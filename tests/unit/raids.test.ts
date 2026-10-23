import { describe, expect, it } from 'vitest';
import type { FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { aiOrders } from '../../src/sim/ai.ts';
import { battleSystems, fight } from '../../src/sim/battle.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import { makeDesign } from '../../src/sim/designs.ts';
import { creditsOf } from '../../src/sim/economy.ts';
import { formFleet } from '../../src/sim/fleets.ts';
import { raidRefusal } from '../../src/sim/invasion.ts';
import { applyOrder } from '../../src/sim/orders.ts';
import { resolveRaids } from '../../src/sim/raids.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { type GameState, type Holding, makeHolding, makeShip, newGame, powerOf } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { atWar, declareWar, interceptedBy } from '../../src/sim/war.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M4 increment 47 (M4_FLEETS.md §27): raids. */

const world = buildWorld(SKY);
const talk = (faction: FactionId) => ({ faction, stage: 'talk' as const, since: 1, words: 20 });
/** The Wake (the player), the Cooperative and the Authority, every one in contact, at peace. */
const three = (): GameState => {
  const g = newGame(world, {
    seed: 42,
    powers: [
      { faction: 'hollow-wake', controller: 'player' },
      { faction: 'frontier', controller: 'ai' },
      { faction: 'sta', controller: 'ai' },
    ],
  });
  for (const p of g.powers) p.contacts = g.powers.filter((q) => q.faction !== p.faction).map((q) => talk(q.faction));
  return g;
};
/** A Cooperative holding at Epsilon Eridani. */
const coop = (g: GameState, kind: 'colony' | 'outpost', people = 30): Holding => {
  const body = bodiesOf(world, g.seed, 'epsilon-eridani').find((b) => !g.holdings.some((h) => h.body === b.id));
  if (!body) throw new Error('no body');
  return makeHolding(g, {
    owner: 'frontier',
    kind,
    system: 'epsilon-eridani',
    body: body.id,
    capital: false,
    people: kind === 'colony' ? people : 0,
  });
};
/** A fleet of armed frigates at a system. */
const squadron = (g: GameState, owner: FactionId, at: string, n: number) => {
  const power = powerOf(g, owner);
  const d = makeDesign(g, power, 'frigate', `${owner}-f-${power.designs.length}`, ['pulse-1', 'pulse-1', 'shield-1']);
  return formFleet(
    g,
    owner,
    Array.from({ length: n }, () => makeShip(g, owner, 'frigate', at, d.id)),
  );
};
const treaty = (
  g: GameState,
  kind: GameState['treaties'][number]['kind'],
  a: FactionId,
  b: FactionId,
  payer?: FactionId,
) => {
  const [x, y] = a < b ? [a, b] : [b, a];
  g.treaties.push({
    kind,
    a: x,
    b: y,
    since: 1,
    ends: null,
    endedBy: null,
    broken: false,
    ...(payer ? { payer } : {}),
  });
};
const events = (g: GameState) => new Map(g.powers.map((p) => [p.faction, [] as ReportEvent[]]));

describe('who may raid, and whom (§27.1)', () => {
  it('only a power that is not lawful, at peace, never a buyer of its protection, a pact or a truce', () => {
    const g = three();
    const c = coop(g, 'colony');
    expect(raidRefusal(g, 'hollow-wake', c)).toBeNull();
    expect(raidRefusal(g, 'sta', c)).toBe('The Transit Authority keeps the law: it does not raid.');
    treaty(g, 'protection', 'hollow-wake', 'frontier', 'frontier');
    expect(raidRefusal(g, 'hollow-wake', c)).toBe('The Frontier Co-op pays us for protection.');
    g.treaties = [];
    treaty(g, 'non-aggression', 'hollow-wake', 'frontier');
    expect(raidRefusal(g, 'hollow-wake', c)).toBe(
      'We have a non-aggression pact with the Frontier Co-op: break it first.',
    );
    g.treaties = [];
    g.truces.push({ a: 'frontier', b: 'hollow-wake', until: g.turn + 5 });
    expect(raidRefusal(g, 'hollow-wake', c)).toBe('We made peace with the Frontier Co-op: the truce still holds.');
    g.truces = [];
    declareWar(g, 'hollow-wake', 'frontier');
    expect(raidRefusal(g, 'hollow-wake', c)).toBe('We are at war with the Frontier Co-op: invade or bombard instead.');
  });

  it('is a fleet’s mission, given where the holding is, with an armed ship', () => {
    const g = three();
    const c = coop(g, 'colony');
    const f = squadron(g, 'hollow-wake', 'epsilon-eridani', 2);
    const r = applyOrder(world, g, 'hollow-wake', {
      type: 'fleet-mission',
      fleet: f.id,
      mission: { kind: 'raid', holding: c.id },
    });
    expect(r.ok).toBe(true);
  });
});

describe('a raid (§27.1)', () => {
  it('fights the raided power’s warships there as if at war, though they are at peace', () => {
    const g = three();
    const c = coop(g, 'colony');
    const raiders = squadron(g, 'hollow-wake', 'epsilon-eridani', 3);
    squadron(g, 'frontier', 'epsilon-eridani', 1);
    expect(battleSystems(g)).toEqual([]);
    raiders.mission = { kind: 'raid', holding: c.id };
    expect(battleSystems(g)).toEqual(['epsilon-eridani']);
    const log = fight(world, g, 'epsilon-eridani', 1);
    expect(log.powers).toEqual(['frontier', 'hollow-wake']);
    expect(log.rounds.flatMap((r) => r.shots).length).toBeGreaterThan(0);
    // Not war: elsewhere neither stops the other.
    expect(atWar(g, 'hollow-wake', 'frontier')).toBe(false);
    expect(interceptedBy(g, 'frontier', 'epsilon-eridani')).toBeNull();
  });

  it('takes a colony’s credits of the turn, and an outpost’s yields, while the orbit is the raider’s', () => {
    const g = three();
    const c = coop(g, 'colony', 40);
    const o = coop(g, 'outpost');
    const credits = creditsOf(world, g, c).total;
    const a = squadron(g, 'hollow-wake', 'epsilon-eridani', 2);
    const b = squadron(g, 'hollow-wake', 'epsilon-eridani', 2);
    a.mission = { kind: 'raid', holding: c.id };
    b.mission = { kind: 'raid', holding: o.id };
    const wake = powerOf(g, 'hollow-wake').treasury;
    const before = powerOf(g, 'frontier').treasury;
    powerOf(g, 'frontier').stockpile = { metals: 50, volatiles: 50, fuel: 50 };
    const ev = events(g);
    resolveRaids(world, g, ev);
    expect(powerOf(g, 'frontier').treasury).toBe(before - credits);
    expect(powerOf(g, 'hollow-wake').treasury).toBe(wake + credits);
    const raided = (ev.get('frontier') ?? []).filter((e) => e.kind === 'raided');
    expect(raided).toHaveLength(2);
    expect(raided[0]).toMatchObject({ holding: c.id, by: 'hollow-wake', credits });
    const fromOutpost = raided.find((e) => e.kind === 'raided' && e.holding === o.id);
    expect(
      fromOutpost && fromOutpost.kind === 'raided' && fromOutpost.metals + fromOutpost.volatiles + fromOutpost.fuel,
    ).toBeGreaterThan(0);
    // Remembered by the raided, once; heard by the lawful Authority.
    expect(powerOf(g, 'frontier').memories.filter((m) => m.kind === 'raided')).toHaveLength(1);
    expect(powerOf(g, 'sta').memories).toContainEqual(
      expect.objectContaining({ kind: 'raided-heard', faction: 'hollow-wake', amount: RULES.raid.heard }),
    );
  });

  it('plunders a holding once a turn, however many fleets raid it, and no credits the treasury lacks', () => {
    const g = three();
    const c = coop(g, 'colony', 40);
    const credits = creditsOf(world, g, c).total;
    expect(credits).toBeGreaterThan(0);
    for (const f of [
      squadron(g, 'hollow-wake', 'epsilon-eridani', 2),
      squadron(g, 'hollow-wake', 'epsilon-eridani', 2),
    ])
      f.mission = { kind: 'raid', holding: c.id };
    const before = powerOf(g, 'frontier').treasury;
    const ev = events(g);
    resolveRaids(world, g, ev);
    expect(powerOf(g, 'frontier').treasury).toBe(before - credits);
    expect((ev.get('frontier') ?? []).filter((e) => e.kind === 'raided')).toHaveLength(1);
    // In debt, there is nothing to take.
    powerOf(g, 'frontier').treasury = -40;
    const wake = powerOf(g, 'hollow-wake').treasury;
    const later = events(g);
    resolveRaids(world, g, later);
    expect(powerOf(g, 'frontier').treasury).toBe(-40);
    expect(powerOf(g, 'hollow-wake').treasury).toBe(wake);
    expect((later.get('frontier') ?? []).find((e) => e.kind === 'raided')).toMatchObject({ credits: 0 });
  });

  it('takes nothing while the raided power holds the orbit', () => {
    const g = three();
    const c = coop(g, 'colony', 40);
    const f = squadron(g, 'hollow-wake', 'epsilon-eridani', 2);
    f.mission = { kind: 'raid', holding: c.id };
    squadron(g, 'frontier', 'epsilon-eridani', 1);
    const ev = events(g);
    resolveRaids(world, g, ev);
    expect(ev.get('frontier')).toEqual([]);
  });

  it('ends when protection is bought', () => {
    let g = three();
    const c = coop(g, 'colony', 40);
    const f = squadron(g, 'hollow-wake', 'epsilon-eridani', 2);
    f.mission = { kind: 'raid', holding: c.id };
    treaty(g, 'protection', 'hollow-wake', 'frontier', 'frontier');
    g = resolveTurn(world, g).state;
    expect(g.fleets.find((x) => x.id === f.id)?.mission).toBeNull();
    expect(stateProblems(world, g)).toEqual([]);
  });
});

describe('the Wake as a rival (§27.3)', () => {
  it('keeps a raiding squadron, and raids the nearest holding it may, the least defended first', () => {
    const g = newGame(world, {
      seed: 42,
      powers: [
        { faction: 'sta', controller: 'player' },
        { faction: 'frontier', controller: 'ai' },
        { faction: 'hollow-wake', controller: 'ai' },
      ],
    });
    for (const p of g.powers) p.contacts = g.powers.filter((q) => q.faction !== p.faction).map((q) => talk(q.faction));
    powerOf(g, 'hollow-wake').treasury = 300;
    // It settles first: no squadron before turn 30 and four colonies.
    const noSquadron = aiOrders(world, g, 'hollow-wake');
    expect(noSquadron).not.toContainEqual(
      expect.objectContaining({ type: 'queue', item: expect.objectContaining({ kind: 'ship', ship: 'frigate' }) }),
    );
    g.turn = RULES.raid.from;
    const home = powerOf(g, 'hollow-wake').capital;
    for (const body of bodiesOf(world, g.seed, home)
      .filter((b) => !g.holdings.some((h) => h.body === b.id))
      .slice(0, 3))
      makeHolding(g, { owner: 'hollow-wake', kind: 'colony', system: home, body: body.id, capital: false, people: 10 });
    const orders = aiOrders(world, g, 'hollow-wake');
    expect(orders).toContainEqual(
      expect.objectContaining({ type: 'queue', item: expect.objectContaining({ kind: 'ship', ship: 'frigate' }) }),
    );
    // A squadron at a holding of the Authority's, which buys no protection: it raids.
    const wakeCapital = powerOf(g, 'hollow-wake').capital;
    const target = g.holdings.find((h) => h.owner === 'sta' && h.capital) as Holding;
    const f = squadron(g, 'hollow-wake', target.system, 2);
    g.turn = RULES.raid.every;
    expect(aiOrders(world, g, 'hollow-wake')).toContainEqual({
      type: 'fleet-mission',
      fleet: f.id,
      mission: { kind: 'raid', holding: target.id },
    });
    // Past the raid's days, it stops and goes home.
    f.mission = { kind: 'raid', holding: target.id };
    g.turn = RULES.raid.every + RULES.raid.lasts;
    expect(aiOrders(world, g, 'hollow-wake')).toContainEqual({ type: 'fleet-mission', fleet: f.id, mission: null });
    expect(wakeCapital).toBeTruthy();
  });
});
