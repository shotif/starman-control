import { describe, expect, it } from 'vitest';
import type { FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { aiOrders, dealings } from '../../src/sim/ai.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import { makeDesign } from '../../src/sim/designs.ts';
import { formFleet } from '../../src/sim/fleets.ts';
import { applyOrder, type Order } from '../../src/sim/orders.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import {
  type GameState,
  type Holding,
  makeHolding,
  makeShip,
  newGame,
  powerOf,
  STATE_VERSION,
} from '../../src/sim/state.ts';
import { tributeOf, wouldMakePeace } from '../../src/sim/treaties.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { atWar, declareRefusal, declareWar } from '../../src/sim/war.ts';
import { beaten, invasionTarget, warshipsWanted, warTarget } from '../../src/sim/warAi.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M4 increment 48 (M4_FLEETS.md §28): rivals at war. */

const world = buildWorld(SKY);
const talk = (faction: FactionId) => ({ faction, stage: 'talk' as const, since: 1, words: 20 });
/** All five powers, every one in contact with every other; the Authority the player unless told. */
const five = (player: FactionId = 'sta'): GameState => {
  const g = newGame(world, {
    seed: 42,
    powers: (['sta', 'frontier', 'hollow-wake', 'dusk-concord', 'drift-moot'] as const).map((faction) => ({
      faction,
      controller: faction === player ? ('player' as const) : ('ai' as const),
    })),
  });
  for (const p of g.powers) p.contacts = g.powers.filter((q) => q.faction !== p.faction).map((q) => talk(q.faction));
  return g;
};
/** So many armed frigates of a power at a system, in one fleet. */
const warships = (g: GameState, owner: FactionId, at: string, n: number) => {
  const power = powerOf(g, owner);
  const d = makeDesign(g, power, 'frigate', `${owner}-f-${power.designs.length}`, ['pulse-1', 'pulse-1', 'shield-1']);
  return formFleet(
    g,
    owner,
    Array.from({ length: n }, () => makeShip(g, owner, 'frigate', at, d.id)),
  );
};
const order = (g: GameState, o: Order, f: FactionId = 'sta') => {
  const r = applyOrder(world, g, f, o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};

describe('reasons for war (§28.1)', () => {
  it('the Authority answers a raid, with warships enough', () => {
    const g = five('frontier');
    g.turn = 10;
    const capital = powerOf(g, 'sta').capital;
    powerOf(g, 'sta').memories.push({ faction: 'hollow-wake', kind: 'raided', amount: -10, turn: 8, system: capital });
    warships(g, 'sta', capital, 2);
    expect(warTarget(world, g, 'sta')).toBeNull();
    warships(g, 'sta', capital, 1);
    expect(warTarget(world, g, 'sta')).toEqual({ on: 'hollow-wake', reason: 'raided' });
    // Only every few turns.
    g.turn = 11;
    expect(warTarget(world, g, 'sta')).toBeNull();
  });

  it('the Concord goes to war on a power that settled in its claim twice, when it is the stronger', () => {
    const g = five();
    g.turn = 10;
    const p = powerOf(g, 'dusk-concord');
    for (const turn of [3, 6])
      p.memories.push({ faction: 'sta', kind: 'claim-crossed', amount: -10, turn, system: 'gj-433' });
    warships(g, 'dusk-concord', p.capital, 3);
    expect(warTarget(world, g, 'dusk-concord')).toEqual({ on: 'sta', reason: 'claim' });
    // Not when we are as strong.
    warships(g, 'sta', powerOf(g, 'sta').capital, 3);
    expect(warTarget(world, g, 'dusk-concord')).toBeNull();
  });

  it('the Wake goes to war on a weak power it is not warm to, much the stronger, from turn 80', () => {
    const g = five('frontier');
    const home = powerOf(g, 'hollow-wake').capital;
    const body = bodiesOf(world, g.seed, home).find((b) => !g.holdings.some((h) => h.body === b.id));
    if (!body) throw new Error('no body');
    makeHolding(g, { owner: 'sta', kind: 'colony', system: home, body: body.id, capital: false, people: 10 });
    warships(g, 'hollow-wake', home, 3);
    g.turn = RULES.rivalsWar.choiceFrom - RULES.rivalsWar.every;
    expect(warTarget(world, g, 'hollow-wake')).toBeNull();
    g.turn = RULES.rivalsWar.choiceFrom;
    expect(warTarget(world, g, 'hollow-wake')).toEqual({ on: 'sta', reason: 'weak' });
    // Not on the Authority once it is as strong. Not on the Cooperative, which it thinks soft and
    // easy pickings (M4_FLEETS.md §31.4), while its fleets cannot reach it; at once when they can.
    warships(g, 'sta', powerOf(g, 'sta').capital, 3);
    expect(warTarget(world, g, 'hollow-wake')).toBeNull();
    const next = bodiesOf(world, g.seed, home).find((b) => !g.holdings.some((h) => h.body === b.id));
    if (!next) throw new Error('no body');
    makeHolding(g, { owner: 'frontier', kind: 'colony', system: home, body: next.id, capital: false, people: 10 });
    expect(warTarget(world, g, 'hollow-wake')).toEqual({ on: 'frontier', reason: 'weak' });
    // And so on, until every power it is not warm to is as strong.
    for (const f of ['frontier', 'dusk-concord', 'drift-moot'] as const) warships(g, f, powerOf(g, f).capital, 3);
    expect(warTarget(world, g, 'hollow-wake')).toBeNull();
  });

  it('the Cooperative and the Moot never declare war; none while at war, in a truce or subdued', () => {
    const g = five();
    g.turn = 10;
    for (const f of ['frontier', 'drift-moot'] as const) {
      warships(g, f, powerOf(g, f).capital, 6);
      powerOf(g, f).memories.push({ faction: 'sta', kind: 'raided', amount: -10, turn: 9 });
      expect(warTarget(world, g, f)).toBeNull();
    }
    const auth = five('frontier');
    auth.turn = 10;
    warships(auth, 'sta', powerOf(auth, 'sta').capital, 3);
    powerOf(auth, 'sta').memories.push({ faction: 'hollow-wake', kind: 'raided', amount: -10, turn: 9 });
    auth.truces.push({ a: 'hollow-wake', b: 'sta', until: 20 });
    expect(warTarget(world, auth, 'sta')).toBeNull();
    auth.truces = [];
    powerOf(auth, 'sta').subduedBy = 'frontier';
    expect(warTarget(world, auth, 'sta')).toBeNull();
    expect(declareRefusal(auth, 'sta', 'hollow-wake')).toBe(
      'We are subdued by the Frontier Co-op: we may not declare war.',
    );
  });

  it('a rival declares war through the same order, and the attacked reads why', () => {
    let g = five('frontier');
    g.turn = 10;
    const capital = powerOf(g, 'sta').capital;
    powerOf(g, 'sta').memories.push({ faction: 'frontier', kind: 'raided', amount: -10, turn: 8 });
    warships(g, 'sta', capital, 3);
    expect(aiOrders(world, g, 'sta')).toContainEqual({ type: 'declare-war', on: 'frontier', reason: 'raided' });
    g = resolveTurn(world, g).state;
    expect(atWar(g, 'sta', 'frontier')).toBe(true);
    expect(g.reports.find((r) => r.faction === 'frontier')?.events).toContainEqual(
      expect.objectContaining({ kind: 'war-declared', by: 'sta', reason: 'raided' }),
    );
  });
});

describe('arming (§28.2)', () => {
  it('half what a neighbour holds; with a grievance, enough to declare', () => {
    const g = five();
    warships(g, 'frontier', powerOf(g, 'frontier').capital, 4);
    // Half of four, but no more than its colonies (one, at the start).
    expect(warshipsWanted(world, g, 'drift-moot')).toBe(1);
    powerOf(g, 'sta').memories.push({ faction: 'frontier', kind: 'raided', amount: -10, turn: g.turn });
    expect(warshipsWanted(world, g, 'sta')).toBe(7);
  });
});

describe('invading (§28.3)', () => {
  it('a strike at war aims at the nearest holding it outmatches, with transports for its garrison', () => {
    const g = five('frontier');
    declareWar(g, 'sta', 'frontier');
    const body = bodiesOf(world, g.seed, 'alpha-centauri').find((b) => !g.holdings.some((h) => h.body === b.id));
    const target = makeHolding(g, {
      owner: 'frontier',
      kind: 'colony',
      system: 'alpha-centauri',
      body: body?.id ?? '',
      capital: false,
      people: 20,
    });
    const capital = powerOf(g, 'sta').capital;
    const strike = warships(g, 'sta', capital, 4);
    const aim = invasionTarget(world, g, strike);
    expect(aim?.holding.id).toBe(target.id);
    expect(aim?.troops).toBe(4 + RULES.rivalsWar.spareTroops);
    // It knows Ground forces: it queues a transport at its capital.
    powerOf(g, 'sta').researched.push('ground-forces');
    powerOf(g, 'sta').treasury = 200;
    const home = g.holdings.find((h) => h.owner === 'sta' && h.capital) as Holding;
    expect(aiOrders(world, g, 'sta')).toContainEqual({
      type: 'queue',
      holding: home.id,
      item: { kind: 'ship', ship: 'transport' },
    });
    // With troops enough, it makes for the target.
    for (let i = 0; i < 2; i++) {
      const t = makeShip(g, 'sta', 'transport', capital, null);
      t.fleet = strike.id;
    }
    expect(aiOrders(world, g, 'sta')).toContainEqual({ type: 'fleet-move', fleet: strike.id, to: 'alpha-centauri' });
    // Arrived, it invades.
    for (const s of g.ships) if (s.fleet === strike.id) s.at = 'alpha-centauri';
    expect(aiOrders(world, g, 'sta')).toContainEqual({
      type: 'fleet-mission',
      fleet: strike.id,
      mission: { kind: 'invade', holding: target.id },
    });
  });
});

describe('peace, by character (§28.4)', () => {
  it('the Cooperative takes peace at once, the Concord after 15 turns, any rival when the war goes badly', () => {
    const g = five();
    declareWar(g, 'sta', 'frontier');
    declareWar(g, 'sta', 'dusk-concord');
    expect(wouldMakePeace(g, 'frontier', 'sta')).toBe(true);
    expect(wouldMakePeace(g, 'dusk-concord', 'sta')).toBe(false);
    g.turn += 15;
    expect(wouldMakePeace(g, 'dusk-concord', 'sta')).toBe(true);
    g.turn -= 15;
    powerOf(g, 'dusk-concord').weariness = RULES.war.badly;
    expect(wouldMakePeace(g, 'dusk-concord', 'sta')).toBe(true);
  });

  it('the Wake asks credits with its peace, the Moot gives them; accepted, they are paid', () => {
    let g = five();
    declareWar(g, 'sta', 'hollow-wake');
    declareWar(g, 'sta', 'drift-moot');
    g.turn += 10;
    expect(dealings(world, g, 'hollow-wake')).toContainEqual({
      type: 'offer',
      to: 'sta',
      treaty: 'peace',
      get: { resource: 'credits', amount: 50 },
    });
    powerOf(g, 'drift-moot').treasury = 100;
    expect(dealings(world, g, 'drift-moot')).toContainEqual(
      expect.objectContaining({ type: 'offer', to: 'sta', treaty: 'peace', give: { resource: 'credits', amount: 30 } }),
    );
    g.offers.push({
      kind: 'peace',
      from: 'hollow-wake',
      to: 'sta',
      turn: g.turn - 1,
      get: { resource: 'credits', amount: 50 },
    });
    powerOf(g, 'sta').treasury = 80;
    const wake = powerOf(g, 'hollow-wake').treasury;
    g = order(g, { type: 'answer-offer', from: 'hollow-wake', treaty: 'peace', accept: true });
    expect(atWar(g, 'sta', 'hollow-wake')).toBe(false);
    expect(powerOf(g, 'sta').treasury).toBe(30);
    expect(powerOf(g, 'hollow-wake').treasury).toBe(wake + 50);
  });
});

describe('capitulation (§28.5)', () => {
  it('surrender offered and accepted: the war ends, tribute is paid, and the subdued fights its victor’s wars', () => {
    let g = five();
    declareWar(g, 'sta', 'frontier');
    declareWar(g, 'hollow-wake', 'dusk-concord');
    g = order(g, { type: 'offer', to: 'frontier', treaty: 'capitulation' });
    g = resolveTurn(world, g).state;
    // A rival always accepts.
    expect(powerOf(g, 'sta').subduedBy).toBe('frontier');
    expect(atWar(g, 'sta', 'frontier')).toBe(false);
    expect(g.reports.find((r) => r.faction === 'sta')?.events).toContainEqual({
      kind: 'subdued',
      faction: 'sta',
      by: 'frontier',
    });
    // A fifth of its taxes, every turn.
    const owed = tributeOf(g, 'sta');
    expect(owed).toBeGreaterThan(0);
    const coop = powerOf(g, 'frontier').treasury;
    const next = resolveTurn(world, g).state;
    expect(next.reports.find((r) => r.faction === 'sta')?.events).toContainEqual(
      expect.objectContaining({ kind: 'tribute', faction: 'frontier', paid: true }),
    );
    expect(powerOf(next, 'frontier').treasury).toBeGreaterThanOrEqual(coop);
    // Its victor's wars are its own.
    declareWar(next, 'frontier', 'drift-moot');
    expect(atWar(next, 'sta', 'drift-moot')).toBe(true);
    expect(stateProblems(world, next)).toEqual([]);
  });

  it('a rival beaten, its capital lost, surrenders to the strongest of its enemies', () => {
    const g = five();
    declareWar(g, 'sta', 'frontier');
    const capital = g.holdings.find((h) => h.owner === 'frontier' && h.capital) as Holding;
    expect(beaten(g, 'frontier')).toBe(false);
    capital.owner = 'sta';
    capital.capital = false;
    expect(beaten(g, 'frontier')).toBe(true);
    expect(dealings(world, g, 'frontier')).toContainEqual({ type: 'offer', to: 'sta', treaty: 'capitulation' });
  });
});

describe('state (§28.7)', () => {
  it('a save from version 21: no power subdued, the most colonies those it holds', () => {
    const g = five();
    const old = structuredClone(g) as unknown as Record<string, unknown>;
    old.version = 21;
    for (const p of old.powers as Record<string, unknown>[]) {
      delete p.subduedBy;
      delete p.mostColonies;
    }
    const raw = { format: SAVE_FORMAT, version: 1, savedAt: '2026-10-22T00:00:00Z', game: old };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.powers.every((p) => p.subduedBy === null && p.mostColonies === 1)).toBe(true);
  });
});
