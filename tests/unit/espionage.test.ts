import { describe, expect, it } from 'vitest';
import { FACTION_IDS, type FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { aiOrders } from '../../src/sim/ai.ts';
import { upkeepOf } from '../../src/sim/economy.ts';
import { intelOf, resolveEspionage, watchRefusal } from '../../src/sim/espionage.ts';
import { applyInPlace } from '../../src/sim/orders.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { type GameState, newGame, powerOf, STATE_VERSION } from '../../src/sim/state.ts';
import { shapeProblems } from '../../src/sim/validate.ts';
import { knownView, watchedSystems } from '../../src/sim/visibility.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M5 increment 55 (M5_UNKNOWN.md §23, D-74): light espionage. */

const world = buildWorld(SKY);
const S = RULES.espionage;
const talk = (faction: FactionId) => ({ faction, stage: 'talk' as const, since: 1, words: 20 });
const five = (player: FactionId = 'sta'): GameState => {
  const g = newGame(world, {
    seed: 42,
    powers: FACTION_IDS.map((faction) => ({
      faction,
      controller: faction === player ? ('player' as const) : ('ai' as const),
    })),
  });
  for (const p of g.powers) p.contacts = FACTION_IDS.filter((f) => f !== p.faction).map((f) => talk(f));
  return g;
};
const events = (g: GameState) => new Map(g.powers.map((p) => [p.faction, [] as ReportEvent[]]));
const turns = (g: GameState, n: number) => {
  const all: ReportEvent[] = [];
  for (let i = 0; i < n; i++) {
    const ev = events(g);
    resolveEspionage(g, ev);
    all.push(...(ev.get('sta') ?? []));
  }
  return all;
};

describe('watching (§23.1)', () => {
  it('a power in contact, for credits a turn; recalled at will', () => {
    const g = five();
    expect(watchRefusal(g, 'sta', 'sta', true)).toBe('There is no such power.');
    powerOf(g, 'sta').contacts = [];
    expect(watchRefusal(g, 'sta', 'hollow-wake', true)).toBe('We have not heard the Hollow Wake.');
    powerOf(g, 'sta').contacts = [talk('hollow-wake')];
    expect(applyInPlace(world, g, 'sta', { type: 'watch', on: 'hollow-wake', watch: true })).toBeNull();
    expect(watchRefusal(g, 'sta', 'hollow-wake', true)).toBe('Our agents are watching them already.');
    expect(upkeepOf(g, 'sta').parts).toContainEqual({ label: 'agents', value: S.watchCost });
    expect(applyInPlace(world, g, 'sta', { type: 'watch', on: 'hollow-wake', watch: false })).toBeNull();
    expect(powerOf(g, 'sta').agents).toEqual([]);
  });

  it('intelligence rises while watched, less for the other’s guard, and fades when not', () => {
    const g = five();
    applyInPlace(world, g, 'sta', { type: 'watch', on: 'hollow-wake', watch: true });
    turns(g, 2);
    expect(intelOf(g, 'sta', 'hollow-wake')).toBe(2 * S.gain);
    powerOf(g, 'hollow-wake').guard = 2;
    turns(g, 1);
    expect(intelOf(g, 'sta', 'hollow-wake')).toBe(2 * S.gain + S.gain - 2 * S.guardLess);
    applyInPlace(world, g, 'sta', { type: 'watch', on: 'hollow-wake', watch: false });
    turns(g, 1);
    expect(intelOf(g, 'sta', 'hollow-wake')).toBe(3 * S.gain - 2 * S.guardLess - S.fade);
    expect(applyInPlace(world, g, 'sta', { type: 'guard', level: 2 })).toBeNull();
    expect(upkeepOf(g, 'sta').parts).toContainEqual({ label: 'agents', value: 2 * S.guardCost });
  });

  it('each mark shows more, and the Watch says so', () => {
    const g = five();
    applyInPlace(world, g, 'sta', { type: 'watch', on: 'hollow-wake', watch: true });
    const wake = g.holdings.find((h) => h.owner === 'hollow-wake' && h.capital);
    if (!wake) throw new Error('capital');
    expect(knownView(world, g, 'sta').holdings.some((h) => h.id === wake.id)).toBe(false);
    const said = turns(g, 3);
    expect(said).toContainEqual({ kind: 'intel', faction: 'hollow-wake', level: S.holdings });
    expect(knownView(world, g, 'sta').holdings.some((h) => h.id === wake.id)).toBe(true);
    expect(watchedSystems(world, g, 'sta').has(wake.system)).toBe(false);
    turns(g, 2);
    expect(watchedSystems(world, g, 'sta').has(wake.system)).toBe(true);
    const later = turns(g, 3);
    expect(later).toContainEqual({ kind: 'intel', faction: 'hollow-wake', level: S.secrets });
  });
});

describe('the rivals (§23.3)', () => {
  it('watch by character from turn 100, while their treasury allows; guard at war if it allows', () => {
    const g = five('frontier');
    const wake = powerOf(g, 'hollow-wake');
    wake.treasury = 500;
    expect(aiOrders(world, g, 'hollow-wake').some((o) => o.type === 'watch')).toBe(false);
    g.turn = S.rivalsFrom;
    const watched = aiOrders(world, g, 'hollow-wake').filter((o) => o.type === 'watch');
    expect(watched).toHaveLength(2);
    expect(aiOrders(world, g, 'frontier').some((o) => o.type === 'watch')).toBe(false);
    g.wars.push({ a: 'hollow-wake', b: 'sta', since: g.turn, by: 'hollow-wake' });
    expect(aiOrders(world, g, 'hollow-wake')).toContainEqual({ type: 'guard', level: 1 });
  });
});

describe('state (§23.5)', () => {
  it('a save from version 27 reads with no agents, no guard and nothing known', () => {
    const g = five();
    const powers = g.powers.map(({ agents: _a, guard: _g, intel: _i, ...p }) => p);
    const raw = {
      format: SAVE_FORMAT,
      version: 1,
      savedAt: '2026-10-22T00:00:00Z',
      game: { ...g, powers, version: 27 },
    };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.powers.every((p) => p.agents.length === 0 && p.guard === 0 && p.intel.length === 0)).toBe(true);
    expect(shapeProblems(loaded)).toEqual([]);
  });
});
