import { describe, expect, it } from 'vitest';
import { FACTION_IDS, FACTIONS, type FactionId, PLAYABLE_IDS } from '../../src/content/factions.ts';
import type { QueueItem } from '../../src/content/projects.ts';
import { RULES } from '../../src/content/rules.ts';
import { SPECIES } from '../../src/content/species.ts';
import { TECHS } from '../../src/content/techs.ts';
import { SKY } from '../../src/data/sky.ts';
import type { SystemId } from '../../src/data/types.ts';
import { investigateRefusal } from '../../src/sim/anomalies.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import {
  capacityOf,
  freeSlot,
  growthOf,
  incomeOf,
  industryOf,
  networkFood,
  networkOf,
  queueTurns,
  settleable,
  shortfall,
  yieldsOf,
  zoneRefusal,
} from '../../src/sim/economy.ts';
import { habitability } from '../../src/sim/habitability.ts';
import { laneTargets } from '../../src/sim/lanes.ts';
import { findRoute } from '../../src/sim/movement.ts';
import { needsOf } from '../../src/sim/needs.ts';
import { applyOrder, type Order, refuse } from '../../src/sim/orders.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { canResearch } from '../../src/sim/research.ts';
import { exportSave, parseSave } from '../../src/sim/save.ts';
import {
  beaconSlots,
  type GameState,
  type Holding,
  makeShip,
  markSurveyed,
  newGame,
  powerOf,
  type ShipState,
} from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { shapeProblems, stateProblems } from '../../src/sim/validate.ts';
import { buildWorld } from '../../src/sim/world.ts';

const world = buildWorld(SKY);
const start = (faction: FactionId, seed = 42) => newGame(world, { seed, powers: [{ faction, controller: 'player' }] });
const order = (state: GameState, faction: FactionId, o: Order) => {
  const r = applyOrder(world, state, faction, o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const why = (state: GameState, faction: FactionId, o: Order) => refuse(world, state, faction, o);
const capital = (state: GameState, faction: FactionId) =>
  state.holdings.find((h) => h.owner === faction && h.capital) as Holding;
const shipOfType = (state: GameState, type: ShipState['type']) => state.ships.find((s) => s.type === type) as ShipState;
const turn = (state: GameState) => resolveTurn(world, state);
const turns = (state: GameState, n: number) => {
  let s = state;
  const events: ReportEvent[] = [];
  for (let i = 0; i < n; i++) {
    const r = turn(s);
    s = r.state;
    events.push(...(r.reports[0]?.events ?? []));
  }
  return { state: s, events };
};
const queue = (state: GameState, faction: FactionId, holding: number, item: QueueItem) =>
  order(state, faction, { type: 'queue', holding, item });

describe('the capital', () => {
  it('is a colony of 10 with room for 12, a shipyard and a lane station, for every power', () => {
    for (const f of FACTION_IDS) {
      const g = start(f);
      const c = capital(g, f);
      expect(c).toMatchObject({ kind: 'colony', system: FACTIONS[f].capital.systemId, people: 100, capital: true });
      expect(c.projects).toEqual(['shipyard', 'lane-station']);
      expect(capacityOf(world, g, c)).toBe(120);
      expect(beaconSlots(g, c.system)).toBe(RULES.beacons.slotsWithStation);
    }
    // Earth (D-20), Tau Ceti e and Wolf 1061 c (D-24); the capital's rules do not depend on the world.
    expect(capital(start('sta'), 'sta').body).toBe('earth');
    expect(capital(start('frontier'), 'frontier').body).toBe('tau-ceti-e');
    expect(capital(start('hollow-wake'), 'hollow-wake').body).toBe('wolf-1061-c');
  });

  it('makes industry with every part shown: its works, the capital, and the Authority’s 10%', () => {
    const g = start('sta');
    const sta = industryOf(world, g, capital(g, 'sta'));
    expect(sta).toEqual({
      total: 12,
      parts: [
        { label: 'from 3 works', value: 9 },
        { label: 'from the capital', value: 2 },
        { label: 'from Administration (+10%)', value: 1 },
      ],
    });
    expect(industryOf(world, start('frontier'), capital(start('frontier'), 'frontier')).total).toBe(11);
    expect(industryOf(world, start('hollow-wake'), capital(start('hollow-wake'), 'hollow-wake')).total).toBe(11);
  });

  it('yields its mine district’s riches and the capital’s own, and a deep mine adds a metal', () => {
    let g = start('sta');
    // Earth is rich in metals, so its mine district yields 2; the capital gives 2 metals, 1 volatiles
    // and 1 fusion fuel.
    expect(yieldsOf(world, g, capital(g, 'sta')).total).toEqual({ metals: 4, volatiles: 1, fuel: 1 });
    // Tau Ceti e is poor in metals (its mine yields 1), Wolf 1061 c rich (2).
    expect(incomeOf(world, start('frontier'), 'frontier')).toEqual({ metals: 3, volatiles: 1, fuel: 1 });
    expect(incomeOf(world, start('hollow-wake'), 'hollow-wake')).toEqual({ metals: 4, volatiles: 1, fuel: 1 });
    g = queue(g, 'sta', capital(g, 'sta').id, { kind: 'project', project: 'mine' });
    g = turns(g, 3).state;
    expect(capital(g, 'sta').projects).toContain('mine');
    expect(incomeOf(world, g, 'sta').metals).toBe(5);
    expect(yieldsOf(world, g, capital(g, 'sta')).parts[0]).toEqual({
      label: 'its mines on Earth',
      value: 3,
      resource: 'metals',
    });
  });
});

describe('growth', () => {
  it('is logistic: faster with room to spare, at least a tenth while there is room, never past it', () => {
    const g = start('sta');
    const h = { ...capital(g, 'sta') };
    // 10 of 12: 10% × 10 × (2/12) = 0.17, rounded down to 0.1.
    expect(growthOf(world, g, h)).toBe(1);
    expect(growthOf(world, g, { ...h, people: 60 })).toBe(3);
    expect(growthOf(world, g, { ...h, people: 119 })).toBe(1);
    expect(growthOf(world, g, { ...h, people: 120 })).toBe(0);
    expect(growthOf(world, g, { ...h, kind: 'outpost', people: 0 })).toBe(0);
  });

  it('is 10% faster for the Cooperative (M4_FLEETS.md §31.4)', () => {
    const sta = capital(start('sta'), 'sta');
    const coop = capital(start('frontier'), 'frontier');
    expect(growthOf(world, start('frontier'), { ...coop, people: 50 })).toBeGreaterThan(
      growthOf(world, start('sta'), { ...sta, people: 50 }),
    );
    expect(growthOf(world, start('frontier'), coop)).toBe(1);
  });

  it('stops when the colony is full, and says so once', () => {
    const { state, events } = turns(start('sta'), 40);
    expect(capital(state, 'sta').people).toBe(120);
    expect(events.filter((e) => e.kind === 'full')).toHaveLength(1);
  });
});

describe('founding', () => {
  it('lets an outpost ship found on any body of a surveyed system, when the turn ends', () => {
    let g = start('sta');
    const outpost = shipOfType(g, 'outpost');
    expect(settleable(world, g, 'sta', 'sol', 'outpost').map((b) => b.id)).not.toContain('earth');
    g = order(g, 'sta', { type: 'found-outpost', ship: outpost.id, body: 'mars' });
    expect(g.ships.find((s) => s.id === outpost.id)?.founding).toEqual({ kind: 'outpost', body: 'mars' });
    // It is not idle while it waits to found.
    expect(needsOf(world, g, 'sta').some((n) => n.kind === 'idle-ship' && n.ship === outpost.id)).toBe(false);
    const r = turn(g);
    const mars = r.state.holdings.find((h) => h.body === 'mars');
    expect(mars).toMatchObject({ kind: 'outpost', owner: 'sta', system: 'sol', people: 0 });
    expect(r.state.ships.some((s) => s.id === outpost.id)).toBe(false);
    expect(r.reports[0]?.events).toContainEqual({
      kind: 'founded',
      holding: mars?.id,
      shipName: outpost.name,
      system: 'sol',
      body: 'mars',
    });
    // Mars is poor in metals: 1 a turn.
    expect(yieldsOf(world, r.state, mars as Holding).total).toEqual({ metals: 1, volatiles: 0, fuel: 0 });
    expect(stateProblems(world, r.state)).toEqual([]);
  });

  it('lets a colony ship settle only a world its people can live on, in a surveyed system', () => {
    let g = start('sta');
    const colony = shipOfType(g, 'colony');
    expect(why(g, 'sta', { type: 'colonise', ship: colony.id, body: 'mars' })).toMatch(/habitat domes, a technology/);
    expect(why(g, 'sta', { type: 'colonise', ship: colony.id, body: 'venus' })).toMatch(/cannot live on Venus/);
    expect(why(g, 'sta', { type: 'colonise', ship: colony.id, body: 'earth' })).toBe(
      'Earth already has your colony on it.',
    );
    expect(why(g, 'sta', { type: 'colonise', ship: colony.id, body: 'proxima-cen-b' })).toBe(
      'There is no such world here.',
    );
    expect(why(g, 'sta', { type: 'found-outpost', ship: colony.id, body: 'mars' })).toMatch(/Only outpost ships/);
    expect(needsOf(world, g, 'sta').find((n) => n.kind === 'idle-ship' && n.ship === colony.id)).toMatchObject({
      canFound: 0,
    });

    // To Alpha Centauri: charted, not surveyed, so nothing can be founded there yet.
    g = order(g, 'sta', { type: 'move', ship: colony.id, to: 'alpha-centauri' });
    g = turn(g).state;
    expect(g.ships.find((s) => s.id === colony.id)?.at).toBe('alpha-centauri');
    expect(why(g, 'sta', { type: 'colonise', ship: colony.id, body: 'proxima-cen-b' })).toBe(
      'Alpha Centauri has not been surveyed.',
    );
    markSurveyed(powerOf(g, 'sta'), 'alpha-centauri');
    const b = bodiesOf(world, g.seed, 'alpha-centauri').find((x) => x.id === 'proxima-cen-b');
    expect(habitability(b as never, SPECIES.human).level).toBe('tolerable');
    g = order(g, 'sta', { type: 'colonise', ship: colony.id, body: 'proxima-cen-b' });
    g = turn(g).state;
    const h = g.holdings.find((x) => x.body === 'proxima-cen-b') as Holding;
    // Founded with 1 (million), it grows in the same turn: at least a tenth a turn while there is room.
    expect(h).toMatchObject({ kind: 'colony', people: RULES.colonies.founding + 1, capital: false, projects: [] });
    expect(capacityOf(world, g, h)).toBe(70);
    expect(turn(g).state.holdings.find((x) => x.id === h.id)?.people).toBe(RULES.colonies.founding + 2);
  });

  it('allows one holding on a body, and one ship founding on it at a time', () => {
    let g = start('sta');
    const first = shipOfType(g, 'outpost');
    const second = makeShip(g, 'sta', 'outpost', 'sol');
    g = order(g, 'sta', { type: 'found-outpost', ship: first.id, body: 'mars' });
    expect(why(g, 'sta', { type: 'found-outpost', ship: second.id, body: 'mars' })).toBe(
      'Another ship is already founding on Mars.',
    );
    g = order(g, 'sta', { type: 'stop', ship: first.id });
    expect(g.ships.find((s) => s.id === first.id)?.founding).toBeNull();
    g = order(g, 'sta', { type: 'found-outpost', ship: second.id, body: 'mars' });
    g = turn(g).state;
    expect(why(g, 'sta', { type: 'found-outpost', ship: first.id, body: 'mars' })).toBe(
      'Mars already has your outpost on it.',
    );
  });

  it('reports a founding that another power beat to the world, and keeps the ship', () => {
    let g = newGame(world, {
      seed: 42,
      powers: [
        { faction: 'sta', controller: 'player' },
        { faction: 'frontier', controller: 'ai' },
      ],
    });
    const ours = g.ships.find((s) => s.owner === 'sta' && s.type === 'outpost') as ShipState;
    const theirs = makeShip(g, 'frontier', 'outpost', 'sol');
    markSurveyed(powerOf(g, 'frontier'), 'sol');
    g = order(g, 'sta', { type: 'found-outpost', ship: ours.id, body: 'mars' });
    g = order(g, 'frontier', { type: 'found-outpost', ship: theirs.id, body: 'mars' });
    const r = turn(g);
    expect(r.state.holdings.find((h) => h.body === 'mars')?.owner).toBe('sta');
    expect(r.state.ships.find((s) => s.id === theirs.id)?.founding).toBeNull();
    expect(r.reports.find((x) => x.faction === 'frontier')?.events).toContainEqual({
      kind: 'not-founded',
      ship: theirs.id,
      system: 'sol',
      body: 'mars',
      reason: 'Mars already has a Transit Authority outpost on it.',
    });
  });
});

describe('the build queue', () => {
  it('puts the colony’s industry into its first item, and the item appears when it is paid for', () => {
    let g = start('sta');
    const c = capital(g, 'sta');
    g = queue(g, 'sta', c.id, { kind: 'ship', ship: 'survey' });
    expect(queueTurns(world, g, capital(g, 'sta'))).toEqual([3]);
    const before = g.ships.length;
    g = turns(g, 2).state;
    expect(capital(g, 'sta').industry).toBe(24);
    expect(g.ships).toHaveLength(before);
    const r = turn(g);
    const built = r.state.ships.at(-1) as ShipState;
    expect(built).toMatchObject({ type: 'survey', at: 'sol', owner: 'sta', name: 'Shearwater' });
    expect(r.reports[0]?.events).toContainEqual({
      kind: 'built',
      holding: c.id,
      item: { kind: 'ship', ship: 'survey' },
      ship: built.id,
    });
    // 36 made, 30 spent: 6 carried over.
    expect(capital(r.state, 'sta').industry).toBe(6);
    expect(capital(r.state, 'sta').queue).toEqual([]);
  });

  it('carries industry on to the next item, finishing more than one in a turn if it can', () => {
    let g = start('sta');
    const c = capital(g, 'sta');
    g.holdings[0] = { ...c, industry: 55 };
    g = queue(g, 'sta', c.id, { kind: 'project', project: 'mine' });
    g = queue(g, 'sta', c.id, { kind: 'ship', ship: 'survey' });
    expect(queueTurns(world, g, capital(g, 'sta'))).toEqual([1, 1]);
    const r = turn(g);
    expect(r.reports[0]?.events.filter((e) => e.kind === 'built')).toHaveLength(2);
    expect(capital(r.state, 'sta').industry).toBe(55 + 12 - 30 - 30);
  });

  it('keeps unspent industry with nothing queued, up to 60', () => {
    expect(capital(turns(start('sta'), 10).state, 'sta').industry).toBe(RULES.colonies.storedIndustry);
  });

  it('waits for resources the stockpile lacks, and says so', () => {
    let g = start('sta');
    const c = capital(g, 'sta');
    g.holdings[0] = { ...c, industry: 60 };
    g.powers[0] = { ...powerOf(g, 'sta'), stockpile: { metals: 0, volatiles: 0, fuel: 0 } };
    g = queue(g, 'sta', c.id, { kind: 'project', project: 'mine' });
    expect(shortfall(world, g, capital(g, 'sta'))).toEqual({ industry: 0, missing: { metals: 5 } });
    expect(needsOf(world, g, 'sta')).toContainEqual({ kind: 'waiting', holding: c.id, system: 'sol' });
    // Production comes before the yields: 0 metals, then 4, then 8, when it is built.
    g = turns(g, 2).state;
    expect(capital(g, 'sta').queue).toHaveLength(1);
    expect(powerOf(g, 'sta').stockpile.metals).toBe(8);
    g = turn(g).state;
    expect(capital(g, 'sta').projects).toContain('mine');
    // Paid for; the deep mine's extra metal comes from the next turn: 4, then 5 a turn.
    expect(powerOf(g, 'sta').stockpile.metals).toBe(8 - 5 + 4);
    g = turn(g).state;
    expect(powerOf(g, 'sta').stockpile.metals).toBe(8 - 5 + 4 + 5);
  });

  it('builds ships only with a shipyard, and each project once', () => {
    let g = start('sta');
    const c = capital(g, 'sta');
    expect(why(g, 'sta', { type: 'queue', holding: c.id, item: { kind: 'project', project: 'shipyard' } })).toBe(
      'It already has a shipyard.',
    );
    g = queue(g, 'sta', c.id, { kind: 'project', project: 'mine' });
    expect(why(g, 'sta', { type: 'queue', holding: c.id, item: { kind: 'project', project: 'mine' } })).toBe(
      'A deep mine is already queued.',
    );
    // A new colony has no shipyard.
    g.holdings.push({ ...c, id: 9, capital: false, body: 'proxima-cen-b', system: 'alpha-centauri', projects: [] });
    expect(why(g, 'sta', { type: 'queue', holding: 9, item: { kind: 'ship', ship: 'survey' } })).toBe(
      'Ships need a shipyard.',
    );
    g.holdings.push({ ...c, id: 10, kind: 'outpost', capital: false, body: 'mars', people: 0, projects: [] });
    expect(why(g, 'sta', { type: 'queue', holding: 10, item: { kind: 'project', project: 'mine' } })).toBe(
      'Outposts build only lanes, lane relays and orbital habitats.',
    );
    expect(why(g, 'frontier', { type: 'queue', holding: c.id, item: { kind: 'ship', ship: 'survey' } })).toBe(
      'That colony is not yours.',
    );
  });

  it('can be reordered and emptied', () => {
    let g = start('sta');
    const id = capital(g, 'sta').id;
    g = queue(g, 'sta', id, { kind: 'project', project: 'mine' });
    g = queue(g, 'sta', id, { kind: 'ship', ship: 'outpost' });
    g = order(g, 'sta', { type: 'reorder', holding: id, from: 1, to: 0 });
    expect(capital(g, 'sta').queue).toEqual([
      { kind: 'ship', ship: 'outpost' },
      { kind: 'project', project: 'mine' },
    ]);
    g = order(g, 'sta', { type: 'unqueue', holding: id, index: 0 });
    expect(capital(g, 'sta').queue).toEqual([{ kind: 'project', project: 'mine' }]);
    expect(why(g, 'sta', { type: 'unqueue', holding: id, index: 3 })).toBe('Nothing is queued there.');
    expect(why(g, 'sta', { type: 'reorder', holding: id, from: 0, to: 2 })).toBe('Nothing is queued there.');
  });

  it('builds a survey station that surveys every system one open lane away', () => {
    let g = start('sta');
    const c = capital(g, 'sta');
    g.holdings[0] = { ...c, industry: 60 };
    g = queue(g, 'sta', c.id, { kind: 'project', project: 'survey-station' });
    const r = turn(g);
    const neighbours = new Set(
      g.lanes
        .map((l) => l.id.split('~') as [SystemId, SystemId])
        .filter(([a, b]) => a === 'sol' || b === 'sol')
        .map(([a, b]) => (a === 'sol' ? b : a)),
    );
    expect(neighbours.size).toBeGreaterThan(0);
    // It is built in production, after this turn's surveys, so it surveys from the next turn on.
    expect(r.state.holdings[0]?.projects).toContain('survey-station');
    const after = turn(r.state);
    for (const s of neighbours) expect(powerOf(after.state, 'sta').surveyed).toContain(s);
    expect(after.reports[0]?.events.filter((e) => e.kind === 'surveyed' && e.station === c.id)).toHaveLength(
      neighbours.size,
    );
  });
});

describe('what needs you', () => {
  it('lists idle ships, a shipyard building nothing and items waiting for resources', () => {
    const g = start('frontier');
    const needs = needsOf(world, g, 'frontier');
    expect(needs.filter((n) => n.kind === 'idle-ship')).toHaveLength(4);
    expect(needs).toContainEqual({ kind: 'idle-yard', holding: capital(g, 'frontier').id, system: 'tau-ceti' });
    const later = queue(g, 'frontier', capital(g, 'frontier').id, { kind: 'ship', ship: 'survey' });
    expect(needsOf(world, later, 'frontier').some((n) => n.kind === 'idle-yard')).toBe(false);
  });
});

/**
 * A scripted player that grows: survey ships survey the nearest system they can reach; colony and
 * outpost ships settle the best world in reach; every colony keeps building.
 */
function growerOrders(state: GameState, faction: FactionId): Order[] {
  const orders: Order[] = [];
  const power = powerOf(state, faction);
  const claimed = new Set<string>();
  const near = (from: SystemId, ids: SystemId[]) =>
    ids
      .filter((id) => id === from || findRoute(world, state, faction, from, id))
      .sort((a, b) => world.distanceDeci(from, a) - world.distanceDeci(from, b) || (a < b ? -1 : 1));
  for (const s of state.ships) {
    if (
      s.owner !== faction ||
      s.at === null ||
      s.destinations.length > 0 ||
      s.blindJump ||
      s.founding ||
      s.investigating
    )
      continue;
    const at = s.at;
    if (s.type === 'survey') {
      if (investigateRefusal(state, s) === null) {
        orders.push({ type: 'investigate', ship: s.id });
        continue;
      }
      const unsurveyed = world.systems
        .map((x) => x.id)
        .filter((id) => !power.surveyed.includes(id) && !claimed.has(id) && id !== at);
      const byLane = near(at, unsurveyed)[0];
      const blind = unsurveyed
        .filter((id) => world.distanceDeci(at, id) <= 60)
        .sort((a, b) => world.distanceDeci(at, a) - world.distanceDeci(at, b))[0];
      const target = byLane ?? blind;
      if (!target) continue;
      claimed.add(target);
      orders.push(byLane ? { type: 'move', ship: s.id, to: target } : { type: 'blind-jump', ship: s.id, to: target });
      continue;
    }
    const kind = s.type === 'colony' ? 'colony' : 'outpost';
    const worth = (id: SystemId) =>
      settleable(world, state, faction, id, kind).filter(
        (b) => !claimed.has(b.id) && (kind === 'colony' || b.riches.metals + b.riches.volatiles + b.riches.fuel > 0),
      );
    const target = near(
      at,
      power.surveyed.filter((id) => worth(id).length > 0),
    )[0];
    if (!target) continue;
    if (target !== at) {
      orders.push({ type: 'move', ship: s.id, to: target });
      continue;
    }
    const best = worth(at).sort(
      (a, b) =>
        habitability(b, SPECIES.human).capacity - habitability(a, SPECIES.human).capacity ||
        b.riches.metals + b.riches.volatiles + b.riches.fuel - (a.riches.metals + a.riches.volatiles + a.riches.fuel) ||
        (a.id < b.id ? -1 : 1),
    )[0];
    if (!best) continue;
    claimed.add(best.id);
    orders.push({ type: kind === 'colony' ? 'colonise' : 'found-outpost', ship: s.id, body: best.id });
  }
  for (const h of state.holdings) {
    if (h.owner !== faction || h.queue.length > 0) continue;
    // Outposts push lanes out: the nearest one they can queue.
    if (h.kind === 'outpost') {
      const lane = laneTargets(world, state, faction, h.system).find((t) => t.refusal === null);
      if (lane) orders.push({ type: 'queue', holding: h.id, item: { kind: 'lane', to: lane.quote.to } });
      continue;
    }
    // Zone the open land: farms while its network is short of food, else mines where there are
    // riches and none yet, else works.
    const slot = freeSlot(world, state, h);
    if (slot !== null) {
      const food = networkFood(world, state, faction, networkOf(world, state, h));
      const zone =
        food.made < food.eaten + 2
          ? 'farms'
          : !h.districts.some((d) => d.zone === 'mines') && zoneRefusal(world, state, h, 'mines', slot) === null
            ? 'mines'
            : 'works';
      orders.push({ type: 'queue', holding: h.id, item: { kind: 'zone', zone, slot } });
      continue;
    }
    const wants: QueueItem[] = [
      { kind: 'project', project: 'mine' },
      { kind: 'ship', ship: 'colony' },
      { kind: 'ship', ship: 'outpost' },
      { kind: 'project', project: 'shipyard' },
      { kind: 'project', project: 'survey-station' },
    ];
    const item = wants.find((w) => refuse(world, state, faction, { type: 'queue', holding: h.id, item: w }) === null);
    if (item) orders.push({ type: 'queue', holding: h.id, item });
  }
  // Research the cheapest technology it can, when nothing is queued.
  if (power.researchQueue.length === 0) {
    const next = canResearch(power).sort((a, b) => TECHS[a].cost - TECHS[b].cost || (a < b ? -1 : 1))[0];
    if (next) orders.push({ type: 'research', tech: next });
  }
  return orders;
}

function grow(faction: FactionId, seed: number, n: number, given?: Order[][]) {
  let state = start(faction, seed);
  const log: Order[][] = [];
  for (let t = 0; t < n; t++) {
    const orders = given ? (given[t] ?? []) : growerOrders(state, faction);
    for (const o of orders) state = order(state, faction, o);
    log.push(orders);
    state = turn(state).state;
    const problems = [...shapeProblems(state), ...stateProblems(world, state)];
    if (problems.length) throw new Error(`turn ${state.turn}: ${problems.join('; ')}`);
  }
  return { state, log };
}

describe('a scripted player that grows', () => {
  // As any power one can lead; the Concord as a rival is in duskfolk.test.ts.
  for (const f of PLAYABLE_IDS) {
    it(`plays 50 turns as ${f}: settles, grows, builds, researches, lays lanes and investigates, and replays exactly`, () => {
      const first = grow(f, 42, 50);
      const mine = first.state.holdings.filter((h) => h.owner === f);
      expect(mine.filter((h) => h.kind === 'colony').length).toBeGreaterThanOrEqual(2);
      expect(mine.filter((h) => h.kind === 'outpost').length).toBeGreaterThanOrEqual(1);
      expect(mine.reduce((sum, h) => sum + h.people, 0)).toBeGreaterThan(RULES.capital.people + 20);
      expect(powerOf(first.state, f).shipsBuilt).toBeGreaterThan(4);
      expect(powerOf(first.state, f).researched.length).toBeGreaterThanOrEqual(5);
      expect(first.state.lanes.filter((l) => l.owner === f).length).toBeGreaterThan(6);
      expect(powerOf(first.state, f).investigated.length).toBeGreaterThanOrEqual(1);
      const again = grow(f, 42, 50, first.log);
      expect(again.state).toEqual(first.state);
      const json = exportSave(first.state).json;
      expect(parseSave(world, json)).toEqual(first.state);
      // The budgets (M1_PROOF.md §4): a save after 50 turns under 200 KB, a turn under 200 ms.
      expect(json.length).toBeLessThan(200 * 1024);
      const times: number[] = [];
      for (let i = 0; i < 5; i++) {
        const t0 = performance.now();
        turn(first.state);
        times.push(performance.now() - t0);
      }
      times.sort((a, b) => a - b);
      expect(times[2]).toBeLessThan(200);
    });
  }
});
