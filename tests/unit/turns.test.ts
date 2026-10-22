import { describe, expect, it } from 'vitest';
import { FACTION_IDS, type FactionId, PLAYABLE_IDS } from '../../src/content/factions.ts';
import { shipName } from '../../src/content/ships.ts';
import { SKY } from '../../src/data/sky.ts';
import { blindJumpTurns, findRoute, jumpPoints, laneCost, planJourney, previewMove } from '../../src/sim/movement.ts';
import { needsOf } from '../../src/sim/needs.ts';
import { applyOrder, type Order } from '../../src/sim/orders.ts';
import { exportSave, parseSave } from '../../src/sim/save.ts';
import { type GameState, hasSurveyed, newGame, powerOf, type ShipState } from '../../src/sim/state.ts';
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
const ship = (state: GameState, id: number) => state.ships.find((s) => s.id === id) as ShipState;
const surveyShip = (state: GameState) => state.ships.find((s) => s.type === 'survey') as ShipState;

describe('a new game', () => {
  it('gives every power two survey ships, a colony ship and an outpost ship at its capital', () => {
    for (const f of FACTION_IDS) {
      const g = start(f);
      expect(g.ships.map((s) => s.type)).toEqual(['survey', 'survey', 'colony', 'outpost']);
      expect(g.ships.every((s) => s.at === powerOf(g, f).capital && s.owner === f)).toBe(true);
      expect(powerOf(g, f).surveyed).toEqual([powerOf(g, f).capital]);
      expect(stateProblems(world, g)).toEqual([]);
      expect(shapeProblems(g)).toEqual([]);
    }
  });

  it('names ships after their makers’ traditions, taking turns', () => {
    expect(start('sta').ships.map((s) => s.name)).toEqual(['Petrel', 'Bastion', 'Fulmar', 'Redoubt']);
    expect(start('hollow-wake').ships.map((s) => s.name)).toEqual(['Hyena', 'Ember', 'Kite', 'Clinker']);
    expect(shipName(['Wake Salvage'], 8)).toBe('Hyena II');
  });

  it('starts with every ship idle and the capital’s shipyard building nothing, so each needs you', () => {
    const g = start('frontier');
    const needs = needsOf(world, g, 'frontier');
    expect(needs.filter((n) => n.kind === 'idle-ship')).toHaveLength(4);
    expect(needs.filter((n) => n.kind === 'idle-yard')).toHaveLength(1);
  });
});

describe('moving along lanes', () => {
  it('costs 1 jump point for a lane up to 6 ly and 2 beyond; the Wake has one more a turn', () => {
    expect(laneCost(60)).toBe(1);
    expect(laneCost(61)).toBe(2);
    expect(jumpPoints(start('sta'), 'sta')).toBe(2);
    expect(jumpPoints(start('hollow-wake'), 'hollow-wake')).toBe(3);
  });

  it('takes a long lane only with the points left for it', () => {
    const hops = [
      { lane: 'a', from: 'a', to: 'b', cost: 1, lengthDeci: 30 },
      { lane: 'b', from: 'b', to: 'c', cost: 2, lengthDeci: 70 },
      { lane: 'c', from: 'c', to: 'd', cost: 1, lengthDeci: 30 },
    ];
    expect(planJourney(hops, 2).hops.map((h) => h.turn)).toEqual([1, 2, 3]);
    expect(planJourney(hops, 3).hops.map((h) => h.turn)).toEqual([1, 1, 2]);
    expect(planJourney([], 2).turns).toBe(0);
  });

  it('finds the cheapest route over its own open lanes only', () => {
    const g = start('frontier');
    const route = findRoute(world, g, 'frontier', 'tau-ceti', 'epsilon-eridani');
    expect(route?.map((h) => h.to)).toEqual(['luyten-726-8', 'epsilon-eridani']);
    expect(findRoute(world, g, 'frontier', 'tau-ceti', 'sol')).toBeNull();
    // The Authority's lanes are dark in a game it is not in.
    expect(findRoute(world, g, 'sta', 'sol', 'barnard')).toBeNull();
  });

  it('previews the jumps and turns before you confirm', () => {
    const g = start('frontier');
    const s = surveyShip(g);
    expect(previewMove(world, g, s, ['epsilon-eridani'])).toMatchObject({ jumps: 2, turns: 1 });
    // Luyten 726-8 to Lacaille 9352 is 6.6 ly, a long lane: it waits for the second turn.
    expect(previewMove(world, g, s, ['lacaille-9352'])).toMatchObject({ jumps: 2, turns: 2 });
  });

  it('moves a ship when the turn ends, and reports it there', () => {
    let g = start('sta');
    const colony = g.ships.find((s) => s.type === 'colony') as ShipState;
    g = order(g, 'sta', { type: 'move', ship: colony.id, to: 'luhman-16' });
    expect(ship(g, colony.id).at).toBe('sol'); // nothing moves until the turn ends
    const { state, reports } = resolveTurn(world, g);
    expect(ship(state, colony.id).at).toBe('luhman-16');
    expect(ship(state, colony.id).destinations).toEqual([]);
    expect(reports[0]?.events).toContainEqual({ kind: 'arrived', ship: colony.id, system: 'luhman-16' });
    expect(state.turn).toBe(2);
  });

  it('works through waypoints in order', () => {
    let g = start('sta');
    const s = g.ships.find((x) => x.type === 'outpost') as ShipState;
    g = order(g, 'sta', { type: 'move', ship: s.id, to: 'barnard' });
    g = order(g, 'sta', { type: 'move', ship: s.id, to: 'wolf-359', append: true });
    expect(ship(g, s.id).destinations).toEqual(['barnard', 'wolf-359']);
    for (let i = 0; i < 4; i++) g = resolveTurn(world, g).state;
    expect(ship(g, s.id).at).toBe('wolf-359');
  });

  it('refuses what cannot be done, and says why', () => {
    const g = start('frontier');
    const s = surveyShip(g);
    const colony = g.ships.find((x) => x.type === 'colony') as ShipState;
    const reason = (o: Order, f: FactionId = 'frontier') => {
      const r = applyOrder(world, g, f, o);
      return r.ok ? null : r.reason;
    };
    expect(reason({ type: 'move', ship: s.id, to: 'sol' })).toBe('No open lane leads to Sol.');
    expect(reason({ type: 'move', ship: s.id, to: 'tau-ceti' })).toMatch(/already there/);
    expect(reason({ type: 'move', ship: 999, to: 'yz-ceti' })).toBe('There is no such ship.');
    expect(reason({ type: 'move', ship: s.id, to: 'yz-ceti' }, 'sta')).toBe('That ship is not yours to order.');
    expect(reason({ type: 'blind-jump', ship: colony.id, to: 'yz-ceti' })).toBe(
      'Only survey ships can jump without a lane.',
    );
    expect(reason({ type: 'blind-jump', ship: s.id, to: 'sol' })).toMatch(/^Too far to jump blind: 11\.9 ly/);
  });
});

describe('surveys', () => {
  it('stop a survey ship in each system it has not surveyed, one a turn, and report what it found', () => {
    let g = start('frontier');
    const s = surveyShip(g);
    g = order(g, 'frontier', { type: 'move', ship: s.id, to: 'epsilon-eridani' });
    let r = resolveTurn(world, g);
    expect(ship(r.state, s.id).at).toBe('luyten-726-8');
    expect(hasSurveyed(powerOf(r.state, 'frontier'), 'luyten-726-8')).toBe(true);
    const found = r.reports[0]?.events.find((e) => e.kind === 'surveyed');
    expect(found).toMatchObject({ kind: 'surveyed', ship: s.id, system: 'luyten-726-8' });
    r = resolveTurn(world, r.state);
    expect(ship(r.state, s.id).at).toBe('epsilon-eridani');
    // What astronomers have observed there (a debris disc and planets) gives research, and with
    // Luyten 726-8's it finishes the first technology that could be researched (M2B_SCIENCE.md §17.2).
    expect(r.reports[0]?.events.map((e) => e.kind).sort()).toEqual(['arrived', 'observed', 'researched', 'surveyed']);
    // Back home through surveyed systems, it does not stop.
    g = order(r.state, 'frontier', { type: 'move', ship: s.id, to: 'tau-ceti' });
    r = resolveTurn(world, g);
    expect(ship(r.state, s.id).at).toBe('tau-ceti');
  });

  it('can be switched off, and other ships never survey', () => {
    let g = start('frontier');
    const s = surveyShip(g);
    const colony = g.ships.find((x) => x.type === 'colony') as ShipState;
    g = order(g, 'frontier', { type: 'auto-survey', ship: s.id, on: false });
    g = order(g, 'frontier', { type: 'move', ship: s.id, to: 'epsilon-eridani' });
    g = order(g, 'frontier', { type: 'move', ship: colony.id, to: 'yz-ceti' });
    const r = resolveTurn(world, g);
    expect(ship(r.state, s.id).at).toBe('epsilon-eridani');
    expect(powerOf(r.state, 'frontier').surveyed).toEqual(['tau-ceti']);
  });
});

describe('blind jumps', () => {
  // From the capital nothing lies within 6 ly outside the home web; from its far side, a few stars do.
  const g = structuredClone(start('frontier'));
  (g.ships[0] as ShipState).at = 'lacaille-9352';
  const web = new Set(['tau-ceti', ...g.lanes.flatMap((l) => l.id.split('~'))]);
  const near = world.systems
    .filter((x) => !web.has(x.id) && world.distanceDeci('lacaille-9352', x.id) <= 60)
    .sort((a, b) => world.distanceDeci('lacaille-9352', a.id) - world.distanceDeci('lacaille-9352', b.id));

  it('reach stars within 6 ly with no lane, a turn for every 3 ly', () => {
    expect(near.map((x) => x.id)).toEqual(['ez-aquarii', 'epsilon-indi', 'lacaille-8760']);
    const fromHome = world.systems.filter((x) => !web.has(x.id) && world.distanceDeci('tau-ceti', x.id) <= 60);
    expect(fromHome).toEqual([]);
    expect(blindJumpTurns(30)).toBe(1);
    expect(blindJumpTurns(31)).toBe(2);
    expect(blindJumpTurns(60)).toBe(2);
  });

  it('take the ship out of contact on the way, then survey where it lands', () => {
    const target = near.at(-1)?.id as string;
    const turns = blindJumpTurns(world.distanceDeci('lacaille-9352', target));
    expect(turns).toBe(2);
    const s = surveyShip(g);
    let state = order(g, 'frontier', { type: 'blind-jump', ship: s.id, to: target });
    expect(needsOf(world, state, 'frontier').some((n) => n.kind === 'idle-ship' && n.ship === s.id)).toBe(false);
    for (let i = 1; i < turns; i++) {
      state = resolveTurn(world, state).state;
      expect(ship(state, s.id).at).toBeNull();
      const r = applyOrder(world, state, 'frontier', { type: 'move', ship: s.id, to: 'tau-ceti' });
      expect(r.ok ? null : r.reason).toMatch(/on a blind jump/);
    }
    const r = resolveTurn(world, state);
    expect(ship(r.state, s.id).at).toBe(target);
    expect(hasSurveyed(powerOf(r.state, 'frontier'), target)).toBe(true);
    expect(r.reports[0]?.events.map((e) => e.kind)).toContain('landed');
    expect(stateProblems(world, r.state)).toEqual([]);
  });

  it('can be called off before it begins', () => {
    const s = surveyShip(g);
    let state = order(g, 'frontier', { type: 'blind-jump', ship: s.id, to: near[0]?.id as string });
    state = order(state, 'frontier', { type: 'stop', ship: s.id });
    expect(ship(state, s.id).blindJump).toBeNull();
  });
});

describe('holding', () => {
  it('keeps a ship where it is without it needing you', () => {
    let g = start('sta');
    const colony = g.ships.find((x) => x.type === 'colony') as ShipState;
    g = order(g, 'sta', { type: 'hold', ship: colony.id, hold: true });
    expect(needsOf(world, g, 'sta').map((n) => (n.kind === 'idle-ship' ? n.ship : 0))).not.toContain(colony.id);
    g = order(g, 'sta', { type: 'move', ship: colony.id, to: 'barnard' });
    expect(ship(g, colony.id).hold).toBe(false);
  });
});

/** A simple scripted player: survey ships head for the nearest unsurveyed system, by lane or blind. */
function scriptedOrders(state: GameState, faction: FactionId): Order[] {
  const orders: Order[] = [];
  const power = powerOf(state, faction);
  const claimed = new Set<string>();
  for (const s of state.ships) {
    if (s.owner !== faction || s.at === null || s.destinations.length > 0 || s.blindJump || s.hold) continue;
    if (s.type !== 'survey') {
      orders.push({ type: 'hold', ship: s.id, hold: true });
      continue;
    }
    const unsurveyed = world.systems
      .filter((x) => !power.surveyed.includes(x.id) && !claimed.has(x.id) && x.id !== s.at)
      .sort(
        (a, b) =>
          world.distanceDeci(s.at as string, a.id) - world.distanceDeci(s.at as string, b.id) || (a.id < b.id ? -1 : 1),
      );
    const byLane = unsurveyed.find((x) => findRoute(world, state, faction, s.at as string, x.id));
    const blind = unsurveyed.find((x) => world.distanceDeci(s.at as string, x.id) <= 60);
    const target = byLane ?? blind;
    if (!target) {
      orders.push({ type: 'hold', ship: s.id, hold: true });
      continue;
    }
    claimed.add(target.id);
    orders.push(
      byLane ? { type: 'move', ship: s.id, to: target.id } : { type: 'blind-jump', ship: s.id, to: target.id },
    );
  }
  return orders;
}

function play(faction: FactionId, seed: number, turns: number, given?: Order[][]) {
  let state = start(faction, seed);
  const log: Order[][] = [];
  for (let t = 0; t < turns; t++) {
    const orders = given ? (given[t] ?? []) : scriptedOrders(state, faction);
    for (const o of orders) state = order(state, faction, o);
    log.push(orders);
    state = resolveTurn(world, state).state;
    const problems = [...shapeProblems(state), ...stateProblems(world, state)];
    if (problems.length) throw new Error(`turn ${state.turn}: ${problems.join('; ')}`);
  }
  return { state, log };
}

describe('a scripted player', () => {
  // As any power one can lead; the alien powers as rivals are in duskfolk.test.ts and drifters.test.ts.
  for (const f of PLAYABLE_IDS) {
    it(`plays 40 turns as ${f} without an impossible state, and the same orders replay to the same game`, () => {
      const first = play(f, 777, 40);
      expect(first.state.turn).toBe(41);
      expect(powerOf(first.state, f).surveyed.length).toBeGreaterThan(5);
      const again = play(f, 777, 40, first.log);
      expect(again.state).toEqual(first.state);
      // And it survives a save and a load.
      expect(parseSave(world, exportSave(first.state).json)).toEqual(first.state);
    });
  }
});
