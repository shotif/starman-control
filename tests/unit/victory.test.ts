import { describe, expect, it } from 'vitest';
import { FACTION_IDS, type FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { resolveAssembly } from '../../src/sim/assembly.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { scoreOf } from '../../src/sim/score.ts';
import { type GameState, makeHolding, newGame, powerOf, STATE_VERSION } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { shapeProblems, stateProblems } from '../../src/sim/validate.ts';
import { leaveGame, outcomeFor, resolveLeaving, resolveVictory, victoryNow } from '../../src/sim/victory.ts';
import { declareWar } from '../../src/sim/war.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M4 increment 50 (M4_FLEETS.md §30): victory, defeat and a power leaving the game. */

const world = buildWorld(SKY);
const talk = (faction: FactionId) => ({ faction, stage: 'talk' as const, since: 1, words: 20 });
/** All five powers, every one talking with every other; the Authority the player. */
const five = (): GameState => {
  const g = newGame(world, {
    seed: 42,
    powers: FACTION_IDS.map((faction) => ({
      faction,
      controller: faction === 'sta' ? ('player' as const) : ('ai' as const),
    })),
  });
  for (const p of g.powers) p.contacts = FACTION_IDS.filter((f) => f !== p.faction).map((f) => talk(f));
  return g;
};
const events = (g: GameState) => new Map(g.powers.map((p) => [p.faction, [] as ReportEvent[]]));
/** Takes away a power's colonies, as an invasion would. */
const lose = (g: GameState, f: FactionId) => {
  g.holdings = g.holdings.filter((h) => !(h.owner === f && h.kind === 'colony'));
};

describe('a power leaving the game (§30.2)', () => {
  it('leaves when its last colony is gone, and everything of it goes', () => {
    const g = five();
    resolveAssembly(g, events(g));
    const capital = powerOf(g, 'hollow-wake').capital;
    const body = bodiesOf(world, g.seed, capital).find((b) => !g.holdings.some((h) => h.body === b.id));
    if (!body) throw new Error('no body');
    makeHolding(g, {
      owner: 'hollow-wake',
      kind: 'outpost',
      system: capital,
      body: body.id,
      capital: false,
      people: 0,
    });
    declareWar(g, 'hollow-wake', 'frontier');
    g.treaties.push({
      kind: 'trade',
      a: 'drift-moot',
      b: 'hollow-wake',
      since: 1,
      ends: null,
      endedBy: null,
      broken: false,
    });
    powerOf(g, 'dusk-concord').subduedBy = 'hollow-wake';
    lose(g, 'hollow-wake');
    const ev = events(g);
    resolveLeaving(g, ev);
    const wake = powerOf(g, 'hollow-wake');
    expect(wake.left).toBe(g.turn);
    expect(g.holdings.some((h) => h.owner === 'hollow-wake')).toBe(false);
    expect(g.ships.some((s) => s.owner === 'hollow-wake')).toBe(false);
    expect(g.lanes.some((l) => l.owner === 'hollow-wake')).toBe(false);
    expect(g.wars).toEqual([]);
    expect(g.treaties).toEqual([]);
    expect(g.assembly?.members).not.toContain('hollow-wake');
    expect(powerOf(g, 'dusk-concord').subduedBy).toBeNull();
    expect(powerOf(g, 'sta').contacts.map((c) => c.faction)).not.toContain('hollow-wake');
    expect(ev.get('sta')).toContainEqual({ kind: 'power-left', faction: 'hollow-wake' });
    expect(stateProblems(world, g)).toEqual([]);
    // It gives no more orders, and the game goes on soundly.
    const next = resolveTurn(world, g).state;
    expect(stateProblems(world, next)).toEqual([]);
    expect(next.ships.some((s) => s.owner === 'hollow-wake')).toBe(false);
  });
});

describe('victory (§30.1)', () => {
  it('by conquest: every other power left the game or subdued by us', () => {
    const g = five();
    for (const f of ['frontier', 'hollow-wake', 'dusk-concord'] as const) leaveGame(g, f, events(g));
    expect(victoryNow(g)).toBeNull();
    powerOf(g, 'drift-moot').subduedBy = 'sta';
    expect(victoryNow(g)).toEqual({ winner: 'sta', how: 'conquest' });
  });

  it('by the Assembly’s choice, after conquest', () => {
    const g = five();
    resolveAssembly(g, events(g));
    const a = g.assembly;
    if (!a) throw new Error('no assembly');
    a.chosen = 'frontier';
    expect(victoryNow(g)).toEqual({ winner: 'frontier', how: 'vote' });
    for (const f of ['frontier', 'hollow-wake', 'dusk-concord', 'drift-moot'] as const) powerOf(g, f).subduedBy = 'sta';
    expect(victoryNow(g)).toEqual({ winner: 'sta', how: 'conquest' });
  });

  it('by the highest score at the turn limit; alone, the game simply ends', () => {
    const g = five();
    g.limit = g.turn + 1;
    expect(victoryNow(g)).toBeNull();
    g.turn = g.limit;
    // Every power starts alike: the earlier in the order wins a tie.
    for (const h of g.holdings) if (h.owner === 'dusk-concord') h.people = 400;
    expect(victoryNow(g)).toEqual({ winner: 'dusk-concord', how: 'score' });
    const alone = newGame(world, { seed: 42, limit: 150, powers: [{ faction: 'sta', controller: 'player' }] });
    alone.turn = 150;
    expect(victoryNow(alone)).toEqual({ winner: null, how: 'score' });
    expect(newGame(world, { seed: 1, powers: [{ faction: 'sta', controller: 'player' }] }).limit).toBe(
      RULES.victory.limit,
    );
  });

  it('decides the game once, tells every power, and the game plays on', () => {
    let g = five();
    g.limit = g.turn;
    for (const h of g.holdings) if (h.owner === 'sta') h.people = 400;
    g = resolveTurn(world, g).state;
    expect(g.ended).toEqual({ winner: 'sta', how: 'score', turn: g.turn - 1 });
    expect(g.reports.find((r) => r.faction === 'frontier')?.events).toContainEqual({
      kind: 'game-ended',
      winner: 'sta',
      how: 'score',
    });
    expect(outcomeFor(g, 'sta')).toEqual({ result: 'victory', how: 'score' });
    expect(outcomeFor(g, 'frontier')).toEqual({ result: 'defeat', how: 'score', by: 'sta' });
    const later = resolveTurn(world, g).state;
    expect(later.ended).toEqual(g.ended);
    expect(stateProblems(world, later)).toEqual([]);
  });
});

describe('defeat, and the story (§30.2, §30.3)', () => {
  it('the player is defeated by losing its last colony, by surrender, or by another’s victory', () => {
    const g = five();
    powerOf(g, 'sta').subduedBy = 'frontier';
    expect(outcomeFor(g, 'sta')).toEqual({ result: 'defeat', how: 'surrender', by: 'frontier' });
    lose(g, 'sta');
    resolveLeaving(g, events(g));
    expect(outcomeFor(g, 'sta')).toEqual({ result: 'defeat', how: 'left', by: null });
    expect(outcomeFor(g, 'frontier')).toBeNull();
  });

  it('keeps every power’s score every 10 turns, and counts its wars, battles and holdings taken', () => {
    const g = five();
    g.turn = 10;
    const ev = events(g);
    ev.get('frontier')?.push({ kind: 'war-declared', faction: 'sta', by: 'frontier' });
    resolveVictory(g, ev);
    expect(g.history).toEqual([{ turn: 10, scores: g.powers.map((p) => scoreOf(g, p.faction).total) }]);
    expect(powerOf(g, 'frontier').story).toMatchObject({ wars: 1, battles: 0, taken: 0 });
    g.turn = 11;
    resolveVictory(g, events(g));
    expect(g.history).toHaveLength(1);
  });

  it('a save from version 23 reads, with the default limit and nothing decided', () => {
    const g = five();
    const { limit: _l, ended: _e, history: _h, ...old } = g;
    const powers = g.powers.map(({ left: _x, story: _s, ...p }) => p);
    const raw = {
      format: SAVE_FORMAT,
      version: 1,
      savedAt: '2026-10-22T00:00:00Z',
      game: { ...old, powers, version: 23 },
    };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.limit).toBe(250);
    expect(loaded.ended).toBeNull();
    expect(loaded.powers.every((p) => p.left === null)).toBe(true);
    expect(shapeProblems(loaded)).toEqual([]);
  });
});
