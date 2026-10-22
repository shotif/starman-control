import { describe, expect, it } from 'vitest';
import type { FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { dealings } from '../../src/sim/ai.ts';
import { buildable } from '../../src/sim/designs.ts';
import { approvalOf } from '../../src/sim/economy.ts';
import { placeBuilt } from '../../src/sim/fleets.ts';
import { attitudeOf } from '../../src/sim/memory.ts';
import { findRoute } from '../../src/sim/movement.ts';
import { applyOrder, type Order } from '../../src/sim/orders.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { type GameState, type Holding, makeShip, newGame, powerOf, STATE_VERSION } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { atWar, declareRefusal, interceptedBy, truceUntil } from '../../src/sim/war.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M4 increment 43 (M4_FLEETS.md §23): war and peace. */

const world = buildWorld(SKY);
const talk = (faction: FactionId, since = 1) => ({ faction, stage: 'talk' as const, since, words: 20 });
/** Three human powers, the Authority the player, every one in contact with every other. */
const three = (): GameState => {
  const g = newGame(world, {
    seed: 42,
    powers: [
      { faction: 'sta', controller: 'player' },
      { faction: 'frontier', controller: 'ai' },
      { faction: 'hollow-wake', controller: 'ai' },
    ],
  });
  for (const p of g.powers) p.contacts = g.powers.filter((q) => q.faction !== p.faction).map((q) => talk(q.faction));
  return g;
};
const order = (g: GameState, o: Order, f: FactionId = 'sta') => {
  const r = applyOrder(world, g, f, o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const refused = (g: GameState, o: Order, f: FactionId = 'sta') => {
  const r = applyOrder(world, g, f, o);
  return r.ok ? null : r.reason;
};
const treaty = (g: GameState, kind: GameState['treaties'][number]['kind'], a: FactionId, b: FactionId) => {
  const [x, y] = a < b ? [a, b] : [b, a];
  g.treaties.push({ kind, a: x, b: y, since: 1, ends: null, endedBy: null, broken: false });
};
const turn = (g: GameState) => resolveTurn(world, g).state;

describe('war (§23.1)', () => {
  it('is declared at once: treaties end, it is remembered, and allies join', () => {
    let g = three();
    treaty(g, 'trade', 'frontier', 'sta');
    treaty(g, 'alliance', 'frontier', 'hollow-wake');
    g = order(g, { type: 'declare-war', on: 'frontier' });
    expect(atWar(g, 'sta', 'frontier')).toBe(true);
    // The Wake, the Cooperative's ally, is at war with us too.
    expect(atWar(g, 'sta', 'hollow-wake')).toBe(true);
    expect(g.wars.find((w) => w.b === 'sta' && w.a === 'hollow-wake')?.via).toBe('frontier');
    expect(g.treaties.filter((t) => t.a === 'frontier' && t.b === 'sta')).toEqual([]);
    expect(powerOf(g, 'frontier').memories).toContainEqual(
      expect.objectContaining({ faction: 'sta', kind: 'war-declared', amount: RULES.war.declared }),
    );
    // At war, the regard counts −20 while it lasts.
    expect(attitudeOf(world, g, 'frontier', 'sta').parts).toContainEqual(
      expect.objectContaining({ kind: 'war', amount: RULES.war.atWar }),
    );
    // Both are told as the turn ends.
    g = turn(g);
    const ours = g.reports.find((r) => r.faction === 'sta')?.events ?? [];
    expect(ours).toContainEqual({ kind: 'war-declared', faction: 'frontier', by: 'sta' });
    expect(ours).toContainEqual({ kind: 'war-declared', faction: 'hollow-wake', by: 'sta', ally: 'frontier' });
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('every power in contact hears of it, the lawful more', () => {
    let g = three();
    g = order(g, { type: 'declare-war', on: 'frontier' }, 'hollow-wake');
    expect(powerOf(g, 'sta').memories).toContainEqual(
      expect.objectContaining({ faction: 'hollow-wake', kind: 'war-declared-heard', amount: RULES.war.heardLawful }),
    );
  });

  it('is refused at war already, in a truce, and through a pact', () => {
    let g = three();
    treaty(g, 'non-aggression', 'frontier', 'sta');
    expect(refused(g, { type: 'declare-war', on: 'frontier' })).toBe(
      'We have a non-aggression pact with the Frontier Co-op: break it first.',
    );
    g = order(g, { type: 'declare-war', on: 'hollow-wake' });
    expect(declareRefusal(g, 'sta', 'hollow-wake')).toBe('We are at war with the Hollow Wake already.');
    expect(refused(g, { type: 'offer', to: 'hollow-wake', treaty: 'trade' })).toBe(
      'We are at war with the Hollow Wake: offer peace first.',
    );
  });
});

describe('peace (§23.2)', () => {
  it('offered and accepted ends the war, with a truce of 10 turns', () => {
    let g = three();
    g = order(g, { type: 'declare-war', on: 'frontier' });
    // Too soon: the rival is not yet ready.
    g = order(g, { type: 'offer', to: 'frontier', treaty: 'peace' });
    g = turn(g);
    expect(atWar(g, 'sta', 'frontier')).toBe(true);
    for (let i = 0; i < RULES.war.peaceAfter; i++) g = turn(g);
    g = order(g, { type: 'offer', to: 'frontier', treaty: 'peace' });
    g = turn(g);
    expect(atWar(g, 'sta', 'frontier')).toBe(false);
    expect(g.reports.find((r) => r.faction === 'sta')?.events).toContainEqual({
      kind: 'peace-made',
      faction: 'frontier',
    });
    expect(truceUntil(g, 'sta', 'frontier')).toBeGreaterThan(g.turn);
    expect(refused(g, { type: 'declare-war', on: 'frontier' })).toMatch(/We made peace with the Frontier Co-op/);
  });

  it('a rival offers peace once the war has lasted ten turns', () => {
    let g = three();
    g = order(g, { type: 'declare-war', on: 'frontier' });
    g.turn += RULES.war.offerPeaceAfter;
    expect(dealings(world, g, 'frontier')).toContainEqual({ type: 'offer', to: 'sta', treaty: 'peace' });
    // The player answers it in the next turn.
    g = turn(g);
    expect(g.offers).toContainEqual(expect.objectContaining({ kind: 'peace', from: 'frontier', to: 'sta' }));
    g = order(g, { type: 'answer-offer', from: 'frontier', treaty: 'peace', accept: true });
    expect(atWar(g, 'sta', 'frontier')).toBe(false);
  });
});

describe('at war (§23.4)', () => {
  it('forced passage: ships may use the enemy’s open lanes', () => {
    let g = three();
    const coopLane = g.lanes.find((l) => l.owner === 'frontier');
    if (!coopLane) throw new Error('no lane');
    const [a, b] = coopLane.id.split('~') as [string, string];
    expect(findRoute(world, g, 'sta', a, b)).toBeNull();
    g = order(g, { type: 'declare-war', on: 'frontier' });
    expect(findRoute(world, g, 'sta', a, b)).not.toBeNull();
  });

  it('a ship or fleet entering a system with an enemy’s warship stops there', () => {
    let g = three();
    const d = buildable(powerOf(g, 'frontier')).find((x) => x.hull === 'frigate');
    const guard = makeShip(g, 'frontier', 'frigate', 'alpha-centauri', d?.id ?? null);
    placeBuilt(g, guard);
    expect(interceptedBy(g, 'sta', 'alpha-centauri')).toBeNull();
    g = order(g, { type: 'declare-war', on: 'frontier' });
    expect(interceptedBy(g, 'sta', 'alpha-centauri')).toBe('frontier');
    // A survey ship bound past Alpha Centauri stops there.
    const survey = g.ships.find((s) => s.owner === 'sta' && s.type === 'survey');
    if (!survey) throw new Error('no ship');
    survey.autoSurvey = false;
    powerOf(g, 'sta').surveyed.push('alpha-centauri', 'luhman-16');
    g = order(g, { type: 'move', ship: survey.id, to: 'luhman-16' });
    g = turn(g);
    expect(g.ships.find((s) => s.id === survey.id)?.at).toBe('alpha-centauri');
    expect(g.reports.find((r) => r.faction === 'sta')?.events).toContainEqual(
      expect.objectContaining({ kind: 'intercepted', ship: survey.id, system: 'alpha-centauri', by: 'frontier' }),
    );
  });

  it('wearies every power at war by its character, and costs approval', () => {
    let g = three();
    g = order(g, { type: 'declare-war', on: 'frontier' });
    for (let i = 0; i < 10; i++) g = turn(g);
    expect(powerOf(g, 'sta').weariness).toBe(10);
    // The Cooperative tires twice as fast.
    expect(powerOf(g, 'frontier').weariness).toBeGreaterThanOrEqual(20);
    const capital = g.holdings.find((h) => h.owner === 'sta' && h.capital) as Holding;
    expect(approvalOf(world, g, capital).parts).toContainEqual({ label: 'war weariness', value: -2 });
  });
});

describe('non-aggression and alliance (§23.3)', () => {
  it('a pact adds nothing to regard; an alliance opens each other’s lanes', () => {
    const g = three();
    treaty(g, 'non-aggression', 'frontier', 'sta');
    expect(attitudeOf(world, g, 'frontier', 'sta').parts.some((p) => p.kind === 'treaty')).toBe(false);
    const coopLane = g.lanes.find((l) => l.owner === 'frontier');
    const [a, b] = (coopLane?.id ?? '').split('~') as [string, string];
    treaty(g, 'alliance', 'frontier', 'sta');
    expect(findRoute(world, g, 'sta', a, b)).not.toBeNull();
  });
});

describe('state (§23.6)', () => {
  it('a save from version 17 is at peace, and no one is weary', () => {
    const g = three();
    const old = structuredClone(g) as unknown as Record<string, unknown>;
    old.version = 17;
    delete old.wars;
    delete old.truces;
    for (const p of old.powers as Record<string, unknown>[]) delete p.weariness;
    const raw = { format: SAVE_FORMAT, version: 1, savedAt: '2026-10-22T00:00:00Z', game: old };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.wars).toEqual([]);
    expect(powerOf(loaded, 'sta').weariness).toBe(0);
  });
});
