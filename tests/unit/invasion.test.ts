import { describe, expect, it } from 'vitest';
import { FACTION_IDS, type FactionId } from '../../src/content/factions.ts';
import { RADIO, type RadioStage, radioLine } from '../../src/content/radio.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { aiOrders } from '../../src/sim/ai.ts';
import { battleSystems, fight } from '../../src/sim/battle.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import { makeDesign } from '../../src/sim/designs.ts';
import { creditsOf, networksOf, queueRefusal } from '../../src/sim/economy.ts';
import { formFleet } from '../../src/sim/fleets.ts';
import { blockadedBy, garrisonOf, holdsOrbit, resolveBombardment, resolveLandings } from '../../src/sim/invasion.ts';
import { applyOrder, type Order } from '../../src/sim/orders.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
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
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { declareWar, interceptedBy } from '../../src/sim/war.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M4 increment 46 (M4_FLEETS.md §26): defences and invasion. */

const world = buildWorld(SKY);
const talk = (faction: FactionId) => ({ faction, stage: 'talk' as const, since: 1, words: 20 });
/** The Authority (the player) and the Cooperative, in contact, at war. */
const atWar = (): GameState => {
  const g = newGame(world, {
    seed: 42,
    powers: [
      { faction: 'sta', controller: 'player' },
      { faction: 'frontier', controller: 'ai' },
      { faction: 'hollow-wake', controller: 'ai' },
    ],
  });
  for (const p of g.powers) p.contacts = g.powers.filter((q) => q.faction !== p.faction).map((q) => talk(q.faction));
  declareWar(g, 'sta', 'frontier');
  return g;
};
/** A Cooperative colony at Epsilon Eridani, of so many tenths of a million people. */
const coopColony = (g: GameState, people: number, kind: 'colony' | 'outpost' = 'colony'): Holding => {
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
/** A fleet of ours at a system: so many transports, and armed frigates. */
const ourFleet = (g: GameState, at: string, transports: number, frigates = 0, owner: FactionId = 'sta') => {
  const power = powerOf(g, owner);
  const d = makeDesign(g, power, 'frigate', `${owner}-f-${power.designs.length}`, ['pulse-1', 'pulse-1', 'shield-1']);
  const ships = [
    ...Array.from({ length: transports }, () => makeShip(g, owner, 'transport', at, null)),
    ...Array.from({ length: frigates }, () => makeShip(g, owner, 'frigate', at, d.id)),
  ];
  return formFleet(g, owner, ships);
};
const order = (g: GameState, o: Order, f: FactionId = 'sta') => {
  const r = applyOrder(world, g, f, o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const events = (g: GameState) => new Map(g.powers.map((p) => [p.faction, [] as ReportEvent[]]));

describe('the garrison (§26.2)', () => {
  it('2, one a million people, 5 more at the capital, 10 with barracks; an outpost none', () => {
    const g = atWar();
    const c = coopColony(g, 35);
    expect(garrisonOf(c).total).toBe(5);
    c.projects.push('barracks');
    expect(garrisonOf(c).total).toBe(15);
    const capital = g.holdings.find((h) => h.owner === 'frontier' && h.capital) as Holding;
    expect(garrisonOf(capital).total).toBe(2 + Math.floor(capital.people / 10) + 5);
    expect(garrisonOf(coopColony(g, 0, 'outpost')).total).toBe(0);
  });
});

describe('troop transports (§26.3)', () => {
  it('need Ground forces and a colony of a million; built, they take a tenth of a million and join a fleet', () => {
    const g = atWar();
    const capital = g.holdings.find((h) => h.owner === 'sta' && h.capital) as Holding;
    const item = { kind: 'ship' as const, ship: 'transport' as const };
    expect(queueRefusal(world, g, capital, item)).toBe('Needs Ground forces.');
    powerOf(g, 'sta').researched.push('ground-forces');
    expect(queueRefusal(world, g, capital, item)).toBeNull();
    const free = bodiesOf(world, g.seed, 'sol').find((b) => !g.holdings.some((h) => h.body === b.id));
    const small = makeHolding(g, {
      owner: 'sta',
      kind: 'colony',
      system: 'sol',
      body: free?.id ?? '',
      capital: false,
      people: 9,
    });
    small.projects.push('shipyard');
    expect(queueRefusal(world, g, small, item)).toBe('Troops are raised only at a colony of a million people or more.');
    // Built as the turn ends.
    let next = order(g, { type: 'queue', holding: capital.id, item });
    const h = next.holdings.find((x) => x.id === capital.id) as Holding;
    h.industry = 1000;
    powerOf(next, 'sta').stockpile.metals = 100;
    const people = h.people;
    next = resolveTurn(world, next).state;
    const t = next.ships.find((s) => s.owner === 'sta' && s.type === 'transport');
    expect(t?.fleet).not.toBeNull();
    // A tenth less, before the turn's growth.
    expect(next.holdings.find((x) => x.id === capital.id)?.people).toBeLessThanOrEqual(people - 1 + 5);
  });
});

describe('invasion (§26.4)', () => {
  it('a fleet ordered to invade lands its troops as the turn ends, and takes the colony', () => {
    let g = atWar();
    const c = coopColony(g, 20);
    const f = ourFleet(g, 'epsilon-eridani', 3);
    expect(
      applyOrder(world, g, 'sta', { type: 'fleet-mission', fleet: f.id, mission: { kind: 'invade', holding: c.id } })
        .ok,
    ).toBe(true);
    g = order(g, { type: 'fleet-mission', fleet: f.id, mission: { kind: 'invade', holding: c.id } });
    g = resolveTurn(world, g).state;
    const taken = g.holdings.find((h) => h.id === c.id) as Holding;
    expect(taken.owner).toBe('sta');
    expect(taken.taken).toBe(RULES.invasion.takenTurns - 1);
    expect(g.ships.some((s) => s.owner === 'sta' && s.type === 'transport')).toBe(false);
    const ours = g.reports.find((r) => r.faction === 'sta')?.events ?? [];
    expect(ours).toContainEqual(
      expect.objectContaining({
        kind: 'invasion',
        holding: c.id,
        by: 'sta',
        from: 'frontier',
        won: true,
        troops: 15,
        garrison: 4,
      }),
    );
    expect(g.reports.find((r) => r.faction === 'frontier')?.events).toContainEqual(
      expect.objectContaining({ kind: 'invasion', won: true }),
    );
    expect(powerOf(g, 'frontier').memories).toContainEqual(
      expect.objectContaining({ kind: 'invaded', faction: 'sta' }),
    );
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('a landing too small is thrown back; the same landing goes the same way from the same seed', () => {
    const g = atWar();
    const c = coopColony(g, 40);
    c.projects.push('barracks');
    const f = ourFleet(g, 'epsilon-eridani', 1);
    f.mission = { kind: 'invade', holding: c.id };
    const a = structuredClone(g);
    const b = structuredClone(g);
    const ea = events(a);
    const eb = events(b);
    resolveLandings(a, ea);
    resolveLandings(b, eb);
    expect(ea.get('sta')).toEqual(eb.get('sta'));
    expect(ea.get('sta')).toContainEqual(
      expect.objectContaining({ kind: 'invasion', won: false, troops: 5, garrison: 16 }),
    );
    expect(a.holdings.find((h) => h.id === c.id)?.owner).toBe('frontier');
  });

  it('an outpost falls to any troops', () => {
    const g = atWar();
    const o = coopColony(g, 0, 'outpost');
    const f = ourFleet(g, 'epsilon-eridani', 1);
    f.mission = { kind: 'invade', holding: o.id };
    const ev = events(g);
    resolveLandings(g, ev);
    expect(g.holdings.find((h) => h.id === o.id)?.owner).toBe('sta');
    expect(ev.get('sta')).toContainEqual(expect.objectContaining({ won: true, garrison: 0, left: 5 }));
  });

  it('a capital taken moves its power’s capital to its largest colony left', () => {
    const g = atWar();
    const other = coopColony(g, 30);
    const capital = g.holdings.find((h) => h.owner === 'frontier' && h.capital) as Holding;
    const f = ourFleet(g, capital.system, 20);
    f.mission = { kind: 'invade', holding: capital.id };
    const ev = events(g);
    resolveLandings(g, ev);
    expect(capital.owner).toBe('sta');
    expect(capital.capital).toBe(false);
    expect(other.capital).toBe(true);
    expect(powerOf(g, 'frontier').capital).toBe('epsilon-eridani');
    expect(ev.get('frontier')).toContainEqual({
      kind: 'capital-moved',
      faction: 'frontier',
      holding: other.id,
      system: 'epsilon-eridani',
    });
    expect(powerOf(g, 'frontier').weariness).toBeGreaterThanOrEqual(RULES.invasion.wearyColony);
  });

  it('no landing while the enemy holds the orbit with an armed ship or a battery', () => {
    const g = atWar();
    const c = coopColony(g, 20);
    const f = ourFleet(g, 'epsilon-eridani', 3);
    f.mission = { kind: 'invade', holding: c.id };
    ourFleet(g, 'epsilon-eridani', 0, 1, 'frontier');
    expect(holdsOrbit(g, 'frontier', 'epsilon-eridani')).toBe(true);
    resolveLandings(g, events(g));
    expect(c.owner).toBe('frontier');
    expect(g.fleets.find((x) => x.id === f.id)?.mission).toEqual({ kind: 'invade', holding: c.id });
  });

  it('is refused away from the colony, at peace, and with no troops', () => {
    const g = atWar();
    const c = coopColony(g, 20);
    const away = ourFleet(g, 'sol', 1);
    expect(
      applyOrder(world, g, 'sta', {
        type: 'fleet-mission',
        fleet: away.id,
        mission: { kind: 'invade', holding: c.id },
      }),
    ).toEqual({
      ok: false,
      reason: `The ${away.name} must be in its system, not moving.`,
    });
    const empty = ourFleet(g, 'epsilon-eridani', 0, 1);
    const r = applyOrder(world, g, 'sta', {
      type: 'fleet-mission',
      fleet: empty.id,
      mission: { kind: 'invade', holding: c.id },
    });
    expect(r.ok ? '' : r.reason).toMatch(/carries no troops/);
    const free = bodiesOf(world, g.seed, 'epsilon-eridani').find((b) => !g.holdings.some((h) => h.body === b.id));
    const wake = makeHolding(g, {
      owner: 'hollow-wake',
      kind: 'colony',
      system: 'epsilon-eridani',
      body: free?.id ?? '',
      capital: false,
      people: 20,
    });
    const t = ourFleet(g, 'epsilon-eridani', 1);
    const p = applyOrder(world, g, 'sta', {
      type: 'fleet-mission',
      fleet: t.id,
      mission: { kind: 'invade', holding: wake.id },
    });
    expect(p.ok ? '' : p.reason).toBe('We are not at war with the Hollow Wake.');
  });
});

describe('batteries (§26.7)', () => {
  it('fight in a battle at their colony as a task force of their own, and are never destroyed', () => {
    const g = atWar();
    const c = coopColony(g, 30);
    powerOf(g, 'frontier').researched.push('planetary-defence');
    c.projects.push('defence-battery', 'planetary-shield');
    ourFleet(g, 'epsilon-eridani', 1);
    expect(battleSystems(g)).toEqual(['epsilon-eridani']);
    expect(interceptedBy(g, 'sta', 'epsilon-eridani')).toBe('frontier');
    const log = fight(world, g, 'epsilon-eridani', 1);
    const force = log.forces.find((f) => f.defences === c.id);
    expect(force?.owner).toBe('frontier');
    const battery = log.ships.find((s) => s.id === -c.id);
    expect(battery).toMatchObject({ type: 'battery', armed: true, shieldMax: RULES.defence.planetaryShield * 10 });
    expect(battery?.weapons).toHaveLength(RULES.defence.batteryWeapons);
    // It holds the system, and it is still there.
    expect(log.held).toEqual(['frontier']);
    expect(c.projects).toContain('defence-battery');
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('silenced by a strong fleet, it lets the troops land that turn', () => {
    let g = atWar();
    const c = coopColony(g, 20);
    c.projects.push('defence-battery');
    const f = ourFleet(g, 'epsilon-eridani', 3, 6);
    g = order(g, { type: 'fleet-mission', fleet: f.id, mission: { kind: 'invade', holding: c.id } });
    g = resolveTurn(world, g).state;
    const log = g.battles[0];
    expect(log?.rounds.some((r) => r.destroyed.includes(-c.id))).toBe(true);
    expect(g.holdings.find((h) => h.id === c.id)?.owner).toBe('sta');
  });
});

describe('bombardment (§26.5)', () => {
  it('kills a twentieth of the people, wrecks a building one turn in three, and is remembered', () => {
    const g = atWar();
    const c = coopColony(g, 40);
    c.projects.push('hydroponics', 'trade-exchange');
    const f = ourFleet(g, 'epsilon-eridani', 0, 2);
    f.mission = { kind: 'bombard', holding: c.id };
    // A turn on which its newest building is wrecked.
    while ((g.turn + c.id) % RULES.bombardment.wreckEvery !== 0) g.turn++;
    const ev = events(g);
    resolveBombardment(g, ev);
    expect(c.people).toBe(38);
    expect(c.projects).toEqual(['hydroponics']);
    expect(ev.get('frontier')).toContainEqual(
      expect.objectContaining({ kind: 'bombarded', by: 'sta', people: 2, wrecked: 'trade-exchange', shielded: false }),
    );
    expect(powerOf(g, 'frontier').memories).toContainEqual(
      expect.objectContaining({ kind: 'bombarded', faction: 'sta', amount: RULES.bombardment.bombed }),
    );
    // Heard by the Wake, which is in contact.
    expect(powerOf(g, 'hollow-wake').memories).toContainEqual(
      expect.objectContaining({ kind: 'bombarded-heard', faction: 'sta', amount: RULES.bombardment.heard }),
    );
    // Again next turn: one memory, kept at its full weight.
    g.turn++;
    resolveBombardment(g, events(g));
    expect(powerOf(g, 'frontier').memories.filter((m) => m.kind === 'bombarded')).toHaveLength(1);
  });

  it('a planetary shield stops it', () => {
    const g = atWar();
    const c = coopColony(g, 40);
    c.projects.push('planetary-shield');
    const f = ourFleet(g, 'epsilon-eridani', 0, 2);
    f.mission = { kind: 'bombard', holding: c.id };
    const ev = events(g);
    resolveBombardment(g, ev);
    expect(c.people).toBe(40);
    expect(ev.get('sta')).toContainEqual(expect.objectContaining({ kind: 'bombarded', shielded: true, people: 0 }));
  });
});

describe('blockade (§26.6)', () => {
  it('cuts a colony off from its network and halves its credits, while the enemy holds its orbit', () => {
    const g = atWar();
    const c = coopColony(g, 40);
    const before = creditsOf(world, g, c).total;
    expect(blockadedBy(g, c)).toBeNull();
    ourFleet(g, 'epsilon-eridani', 0, 1);
    expect(blockadedBy(g, c)).toBe('sta');
    expect(networksOf(world, g, 'frontier')).toContainEqual({ home: false, colonies: [c] });
    expect(creditsOf(world, g, c).total).toBe(Math.floor((before * RULES.blockadeCreditsPercent) / 100));
    // A warship of its own there breaks it.
    ourFleet(g, 'epsilon-eridani', 0, 1, 'frontier');
    expect(blockadedBy(g, c)).toBeNull();
  });
});

describe('radio traffic (§26.4)', () => {
  it('every power has a line for every stage, every one filled in', () => {
    const stages: RadioStage[] = ['landing', 'fighting', 'won', 'lost', 'sighted', 'holding', 'fell', 'held'];
    for (const f of FACTION_IDS)
      for (const s of stages) {
        const line = radioLine(RADIO[f], s, {
          place: 'Tau Ceti e',
          enemy: 'Hollow Wake',
          troops: 10,
          garrison: 7,
          left: 3,
        });
        expect(line.length, `${f} ${s}`).toBeGreaterThan(20);
        expect(line, `${f} ${s}`).not.toMatch(/[{}]/);
      }
  });
});

describe('the rivals at war (§26.11)', () => {
  it('research Planetary defence first, and build batteries at the capital', () => {
    const g = atWar();
    powerOf(g, 'frontier').researchQueue = [];
    powerOf(g, 'frontier').treasury = 200;
    expect(aiOrders(world, g, 'frontier')).toContainEqual({ type: 'research', tech: 'planetary-defence' });
    powerOf(g, 'frontier').researched.push('planetary-defence');
    const capital = g.holdings.find((h) => h.owner === 'frontier' && h.capital) as Holding;
    expect(aiOrders(world, g, 'frontier')).toContainEqual({
      type: 'queue',
      holding: capital.id,
      item: { kind: 'project', project: 'defence-battery' },
    });
  });
});

describe('state (§26.12)', () => {
  it('a save from version 20 has no missions and no colony taken', () => {
    const g = atWar();
    ourFleet(g, 'sol', 1);
    const old = structuredClone(g) as unknown as Record<string, unknown>;
    old.version = 20;
    for (const f of old.fleets as Record<string, unknown>[]) delete f.mission;
    for (const h of old.holdings as Record<string, unknown>[]) delete h.taken;
    const raw = { format: SAVE_FORMAT, version: 1, savedAt: '2026-10-22T00:00:00Z', game: old };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.fleets.every((f) => f.mission === null)).toBe(true);
    expect(loaded.holdings.every((h) => h.taken === 0)).toBe(true);
  });
});
