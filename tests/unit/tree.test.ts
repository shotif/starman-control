import { describe, expect, it } from 'vitest';
import { EDICTS } from '../../src/content/edicts.ts';
import type { FactionId } from '../../src/content/factions.ts';
import { PROJECTS } from '../../src/content/projects.ts';
import { RULES } from '../../src/content/rules.ts';
import { SPECIES } from '../../src/content/species.ts';
import { TECH_IDS, TECHS, type TechId } from '../../src/content/techs.ts';
import { SKY } from '../../src/data/sky.ts';
import { aiOrders } from '../../src/sim/ai.ts';
import { grantReward } from '../../src/sim/anomalies.ts';
import { type Body, bodiesOf } from '../../src/sim/bodies.ts';
import { observationPoints } from '../../src/sim/discoveries.ts';
import {
  approvalOf,
  capacityOf,
  costOf,
  districtCount,
  edictCost,
  growthOf,
  levelOf,
  queueRefusal,
  researchOf,
  scholarsOf,
  terraformNext,
  yieldsOf,
} from '../../src/sim/economy.ts';
import { habitability } from '../../src/sim/habitability.ts';
import { laneQuote } from '../../src/sim/lanes.ts';
import { blindJumpTurns, blindReachDeci, jumpPoints } from '../../src/sim/movement.ts';
import { applyOrder, type Order, refuse } from '../../src/sim/orders.ts';
import { canResearch, researchTurns, techCost } from '../../src/sim/research.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import {
  beaconSlots,
  type GameState,
  type Holding,
  makeHolding,
  newGame,
  powerOf,
  STATE_VERSION,
} from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { watchedSystems } from '../../src/sim/visibility.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** A deeper tree (M2B_SCIENCE.md §18, D-46): rising costs, tiers 4 and 5, three projects. */

const world = buildWorld(SKY);
const start = (faction: FactionId = 'sta') => newGame(world, { seed: 42, powers: [{ faction, controller: 'player' }] });
const capital = (g: GameState) => g.holdings.find((h) => h.capital) as Holding;
const knowing = (g: GameState, ...techs: TechId[]) => {
  powerOf(g, 'sta').researched.push(...techs);
  return g;
};
const order = (g: GameState, o: Order) => {
  const r = applyOrder(world, g, 'sta', o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const findBody = (test: (b: Body) => boolean): Body => {
  for (const s of world.systems) {
    const b = bodiesOf(world, 42, s.id).find(test);
    if (b) return b;
  }
  throw new Error('no such body');
};
const human = SPECIES.human;
const outpostOn = (g: GameState, b: Body) =>
  makeHolding(g, { owner: 'sta', kind: 'outpost', system: b.systemId, body: b.id, capital: false, people: 0 });
const colonyOn = (g: GameState, b: Body, people = 30) =>
  makeHolding(g, {
    owner: 'sta',
    kind: 'colony',
    system: b.systemId,
    body: b.id,
    capital: false,
    people,
    districts: [{ zone: 'farms', slot: 1 }],
  });

describe('rising costs (§18.1)', () => {
  it('7% more of its base for every technology known, rounded down', () => {
    const g = start();
    const p = powerOf(g, 'sta');
    expect(techCost(g, p, 'lane-engineering-1')).toBe(30);
    p.researched.push(...TECH_IDS.filter((id) => id !== 'lane-engineering-1').slice(0, 10));
    expect(techCost(g, p, 'lane-engineering-1')).toBe(51);
    expect(techCost(g, p, 'terraforming')).toBe(408);
  });

  it('in the queue’s times, each one learnt making the next dearer, and when points are spent', () => {
    let g = start();
    g = order(g, { type: 'research', tech: 'deep-survey' });
    g = order(g, { type: 'research', tech: 'habitat-domes' });
    // 7 a turn: 30 in 5 turns, then 32 (30 and 7%) more: 62 in 9.
    expect(researchTurns(g, 'sta', researchOf(world, g, 'sta').total)).toEqual([5, 9]);
    powerOf(g, 'sta').techProgress = { 'deep-survey': 29 };
    const r = resolveTurn(world, g);
    expect(powerOf(r.state, 'sta').researched).toEqual(['deep-survey']);
    // 7 points: 1 into Deep survey and 6 into Habitat domes, which now costs 32.
    expect(powerOf(r.state, 'sta').techProgress).toEqual({ 'habitat-domes': 6 });
    expect(stateProblems(world, r.state)).toEqual([]);
  });
});

describe('the new technologies (§18.2)', () => {
  it('are twenty-one, at tier 4 for 240 and tier 5 for 480 before the rise', () => {
    const added = TECH_IDS.slice(TECH_IDS.indexOf('lane-relays'), TECH_IDS.indexOf('lapse-studies') + 1);
    expect(added).toHaveLength(21);
    for (const id of added) {
      if (TECHS[id].tier === 4) expect(TECHS[id].cost, id).toBe(240);
      if (TECHS[id].tier === 5) expect(TECHS[id].cost, id).toBe(480);
    }
  });

  it('Fast hulls, Fold charts and Lane weaving: jump points, blind jumps and tuning', () => {
    const g = start();
    expect(jumpPoints(g, 'sta')).toBe(2);
    knowing(g, 'fast-hulls');
    expect(jumpPoints(g, 'sta')).toBe(3);
    expect(blindReachDeci(g, 'sta')).toBe(60);
    expect(blindJumpTurns(60, g, 'sta')).toBe(2);
    knowing(g, 'fold-charts');
    expect(blindReachDeci(g, 'sta')).toBe(90);
    expect(blindJumpTurns(60, g, 'sta')).toBe(1);
    expect(blindJumpTurns(20, g, 'sta')).toBe(1);
    const before = laneQuote(world, g, 'sta', 'sol', 'sirius').turns;
    knowing(g, 'lane-weaving');
    expect(laneQuote(world, g, 'sta', 'sol', 'sirius').turns).toBe(Math.max(1, Math.ceil(before / 2)));
  });

  it('Prefabrication and Mass drivers: projects cheaper, outposts twice as rich', () => {
    const g = start();
    const item = { kind: 'project', project: 'hydroponics' } as const;
    expect(costOf(world, g, capital(g), item).industry).toBe(40);
    knowing(g, 'prefabrication');
    expect(costOf(world, g, capital(g), item).industry).toBe(32);
    const rich = findBody((b) => b.riches.metals === 2 && b.kind === 'belt');
    const o = outpostOn(g, rich);
    expect(yieldsOf(world, g, o).total.metals).toBe(2);
    knowing(g, 'mass-drivers');
    expect(yieldsOf(world, g, o).total.metals).toBe(4);
  });

  it('Gene tailoring and Cryosleep: faster growth, and colony ships carrying 2 million', () => {
    const g = start();
    // The capital, 10 of its 12 million: 1 tenth a turn, and 2 with Gene tailoring.
    expect(growthOf(world, g, capital(g))).toBe(1);
    knowing(g, 'gene-tailoring');
    expect(growthOf(world, g, capital(g))).toBe(2);
    let h = start();
    knowing(h, 'cryosleep');
    const ship = h.ships.find((s) => s.type === 'colony');
    if (!ship) throw new Error('no colony ship');
    ship.at = 'alpha-centauri';
    powerOf(h, 'sta').surveyed.push('alpha-centauri');
    h = order(h, { type: 'colonise', ship: ship.id, body: 'proxima-cen-b' });
    expect(resolveTurn(world, h).state.holdings.find((x) => x.body === 'proxima-cen-b')?.people).toBeGreaterThanOrEqual(
      20,
    );
  });

  it('Civil service, Free press, Public schooling, Councils and Federation', () => {
    const g = start();
    // Attention: 2 a turn, 3 with Civil service.
    expect(powerOf(resolveTurn(world, g).state, 'sta').attention).toBe(4);
    knowing(g, 'civil-service');
    expect(powerOf(resolveTurn(world, g).state, 'sta').attention).toBe(5);
    expect(edictCost(g, 'sta', 'festival')).toBe(EDICTS.festival.cost);
    knowing(g, 'free-press');
    expect(edictCost(g, 'sta', 'festival')).toBe(EDICTS.festival.cost - 1);
    // Scholars: 10 million are 2, or 3 with Public schooling.
    expect(scholarsOf(g, capital(g))).toBe(2);
    knowing(g, 'public-schooling');
    expect(scholarsOf(g, capital(g))).toBe(3);
    const before = approvalOf(world, g, capital(g)).total;
    knowing(g, 'councils');
    expect(approvalOf(world, g, capital(g)).total).toBe(Math.min(100, before + 5));
    // Federation: far from home costs nothing; no lane to the capital still does.
    const far = colonyOn(
      g,
      findBody((b) => b.systemId === 'epsilon-eridani' && habitability(b, human).level !== 'uninhabitable'),
    );
    expect(approvalOf(world, g, far).parts.map((p) => p.label)).toContain('no lane to the capital');
    knowing(g, 'federation');
    expect(approvalOf(world, g, far).parts.map((p) => p.label)).toContain('no lane to the capital');
  });

  it('Interferometry, Scanner arrays, Thinking machines and Deep-sky survey', () => {
    const g = start();
    expect(observationPoints(g, 'sta', ['white-dwarf'])).toBe(15);
    knowing(g, 'interferometry');
    expect(observationPoints(g, 'sta', ['white-dwarf'])).toBe(30);
    capital(g).projects.push('deep-space-scanner');
    // Sirius is 8.6 ly from Sol: out of an 8 ly scanner's reach, within 12.
    expect(watchedSystems(world, g, 'sta').has('sirius')).toBe(false);
    knowing(g, 'scanner-arrays');
    expect(watchedSystems(world, g, 'sta').has('sirius')).toBe(true);
    capital(g).projects.push('research-institute');
    const base = researchOf(world, g, 'sta').total;
    expect(base).toBeGreaterThanOrEqual(10);
    knowing(g, 'thinking-machines');
    expect(researchOf(world, g, 'sta').parts).toContainEqual({
      label: 'thinking machines (+10%)',
      value: Math.floor(base / 10),
    });
  });

  it('Lapse studies: only after three anomalies investigated; then their rewards +50%', () => {
    const g = start();
    const p = powerOf(g, 'sta');
    expect(canResearch(p)).not.toContain('lapse-studies');
    expect(refuse(world, g, 'sta', { type: 'research', tech: 'lapse-studies' })).toBe(
      'Lapse studies needs three anomalies investigated.',
    );
    p.investigated = ['alpha-centauri', 'barnard', 'sirius'];
    expect(canResearch(p)).toContain('lapse-studies');
    expect(refuse(world, g, 'sta', { type: 'research', tech: 'lapse-studies' })).toBeNull();
    grantReward(g, p, 'wake-cache');
    expect(p.stockpile.fuel).toBe(40 + 25);
    knowing(g, 'lapse-studies');
    grantReward(g, p, 'wake-cache');
    expect(p.stockpile.fuel).toBe(40 + 25 + 37);
  });
});

describe('the three projects (§18.3)', () => {
  it('each opened by its technology, built where it may be', () => {
    const g = start();
    const relay = { kind: 'project', project: 'lane-relay' } as const;
    const habitat = { kind: 'project', project: 'orbital-habitat' } as const;
    const station = { kind: 'project', project: 'terraforming-station' } as const;
    expect(PROJECTS['lane-relay'].upkeep).toBe(1);
    expect(queueRefusal(world, g, capital(g), relay)).toBe('Needs Lane relays.');
    knowing(g, 'lane-relays', 'orbital-habitats', 'terraforming');
    expect(queueRefusal(world, g, capital(g), relay)).toBeNull();
    expect(queueRefusal(world, g, capital(g), habitat)).toBe('Only at an outpost.');
    // Earth is comfortable: nothing to terraform.
    expect(queueRefusal(world, g, capital(g), station)).toBe('Only on a world harsh or tolerable for its people.');
    const o = outpostOn(
      g,
      findBody((b) => b.kind === 'gas-giant'),
    );
    expect(queueRefusal(world, g, o, relay)).toBeNull();
    expect(queueRefusal(world, g, o, habitat)).toBeNull();
    expect(queueRefusal(world, g, o, { kind: 'project', project: 'hydroponics' })).toBe(
      'Outposts build only lanes, lane relays and orbital habitats.',
    );
  });

  it('the lane relay: two more beacon slots in its system', () => {
    const g = start();
    expect(beaconSlots(g, 'sol')).toBe(RULES.beacons.slotsWithStation);
    capital(g).projects.push('lane-relay');
    expect(beaconSlots(g, 'sol')).toBe(RULES.beacons.slotsWithStation + 2);
  });

  it('the orbital habitat: an outpost becomes a colony in orbit, keeping its riches', () => {
    let g = start();
    knowing(g, 'orbital-habitats');
    const giant = findBody((b) => b.kind === 'gas-giant' && b.riches.fuel > 0);
    const o = outpostOn(g, giant);
    o.queue.push({ kind: 'project', project: 'orbital-habitat' });
    o.industry = 99;
    powerOf(g, 'sta').stockpile = { metals: 100, volatiles: 100, fuel: 100 };
    const r = resolveTurn(world, g);
    g = r.state;
    const h = g.holdings.find((x) => x.id === o.id) as Holding;
    expect(r.reports[0]?.events).toContainEqual({ kind: 'habitat-colony', holding: o.id });
    expect(h.kind).toBe('colony');
    expect(h.people).toBeGreaterThanOrEqual(RULES.colonies.founding);
    expect(districtCount(world, g, h)).toBe(2);
    expect(h.districts.map((d) => d.zone)).toEqual(['farms', 'works']);
    expect(capacityOf(world, g, h)).toBe(20);
    expect(yieldsOf(world, g, h).total.fuel).toBeGreaterThan(0);
    expect(approvalOf(world, g, h).parts).toContainEqual({ label: 'life in orbit', value: RULES.approval.domes });
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('the terraforming station: a step after 10 turns, two at 5 each with Ecopoiesis, none in revolt', () => {
    const g = start();
    knowing(g, 'terraforming');
    const harsh = findBody((b) => habitability(b, human).level === 'harsh' && b.kind === 'rocky');
    const c = colonyOn(g, harsh);
    expect(levelOf(world, g, c)).toBe('harsh');
    c.projects.push('terraforming-station');
    expect(terraformNext(world, g, c)).toEqual({ turns: 10, to: 'tolerable' });
    let s = g;
    let said = false;
    for (let t = 0; t < 10; t++) {
      const r = resolveTurn(world, s);
      s = r.state;
      said ||= (r.reports[0]?.events ?? []).some((e) => e.kind === 'terraformed' && e.level === 'tolerable');
    }
    const after = s.holdings.find((x) => x.id === c.id) as Holding;
    expect(said).toBe(true);
    expect(levelOf(world, s, after)).toBe('tolerable');
    expect(terraformNext(world, s, after)).toBeNull();
    // Ecopoiesis: 5 turns a step, and a second step.
    knowing(s, 'ecopoiesis');
    expect(levelOf(world, s, after)).toBe('comfortable');
    expect(terraformNext(world, s, after)).toBeNull();
  });
});

describe('rivals (§18.4)', () => {
  it('weigh research by price, their own fields at half, so they take the first steps of the others', () => {
    const g = newGame(world, {
      seed: 42,
      powers: [
        { faction: 'sta', controller: 'ai' },
        { faction: 'frontier', controller: 'ai' },
      ],
    });
    // The Authority's fields are survey and propulsion: its own tier 1 first.
    const first = aiOrders(world, g, 'sta').find((o) => o.type === 'research');
    expect(first).toMatchObject({ type: 'research' });
    const p = powerOf(g, 'sta');
    p.researched.push(
      ...TECH_IDS.filter((id) => ['survey', 'propulsion'].includes(TECHS[id].field) && TECHS[id].tier <= 2),
    );
    const next = aiOrders(world, g, 'sta').find((o) => o.type === 'research');
    // A tier-1 technology of another field (60 at double) before its own tier 3 (100).
    expect(next && 'tech' in next && TECHS[next.tech].tier).toBe(1);
  });

  it('an idle outpost with no lane to build raises an orbital habitat when its power knows how and can keep it', () => {
    const g = newGame(world, { seed: 42, powers: [{ faction: 'hollow-wake', controller: 'ai' }] });
    const p = powerOf(g, 'hollow-wake');
    p.treasury = 200;
    // Gaining each turn, as a colony's keep needs.
    p.taxes = 'high';
    // A star with no other within lane reach, so its outpost has no lane to queue.
    const lonely = world.systems.find((s) =>
      world.systems.every((o) => o.id === s.id || world.distanceDeci(s.id, o.id) > RULES.lanes.reachDeci),
    );
    const body = lonely && bodiesOf(world, 42, lonely.id).find((b) => b.kind !== 'rocky');
    if (!lonely || !body) throw new Error('no lonely star with a world for an outpost');
    const o = outpostOn(g, body);
    o.owner = 'hollow-wake';
    const habitat = (orders: Order[]) =>
      orders.some((x) => x.type === 'queue' && x.holding === o.id && x.item.kind === 'project');
    expect(habitat(aiOrders(world, g, 'hollow-wake'))).toBe(false);
    p.researched.push('orbital-habitats');
    expect(habitat(aiOrders(world, g, 'hollow-wake'))).toBe(true);
    p.treasury = 30;
    expect(habitat(aiOrders(world, g, 'hollow-wake'))).toBe(false);
  });
});

describe('saves', () => {
  it('a version 10 game has no terraforming yet', () => {
    const g = start() as unknown as Record<string, unknown>;
    const holdings = (g.holdings as Record<string, unknown>[]).map(({ terraform, ...h }) => h);
    const raw = {
      format: SAVE_FORMAT,
      version: 1,
      savedAt: '2026-10-21T00:00:00Z',
      game: { ...g, version: 10, holdings },
    };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(STATE_VERSION).toBe(11);
    expect(loaded.holdings.every((h) => h.terraform === 0)).toBe(true);
  });
});
