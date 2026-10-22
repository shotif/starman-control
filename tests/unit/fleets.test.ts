import { describe, expect, it } from 'vitest';
import type { FactionId } from '../../src/content/factions.ts';
import { SKY } from '../../src/data/sky.ts';
import { buildable } from '../../src/sim/designs.ts';
import { fleetAt, fleetPoints, fleetShips, ordinal, placeBuilt } from '../../src/sim/fleets.ts';
import { needsOf } from '../../src/sim/needs.ts';
import { applyOrder, type Order } from '../../src/sim/orders.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import {
  type Fleet,
  type GameState,
  type Holding,
  makeShip,
  newGame,
  powerOf,
  type ShipState,
  STATE_VERSION,
} from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M4 increment 42 (M4_FLEETS.md §22): fleets. */

const world = buildWorld(SKY);
const start = (faction: FactionId = 'sta') => newGame(world, { seed: 42, powers: [{ faction, controller: 'player' }] });
const capital = (g: GameState) => g.holdings.find((h) => h.owner === 'sta' && h.capital) as Holding;
const order = (g: GameState, o: Order) => {
  const r = applyOrder(world, g, 'sta', o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const refused = (g: GameState, o: Order) => {
  const r = applyOrder(world, g, 'sta', o);
  return r.ok ? null : r.reason;
};
const turn = (g: GameState) => resolveTurn(world, g).state;
/** A frigate of the yard's design, built at a system and placed in a fleet as a new one would be. */
const frigate = (g: GameState, at = 'sol'): ShipState => {
  const d = buildable(powerOf(g, 'sta')).find((x) => x.hull === 'frigate');
  const s = makeShip(g, 'sta', 'frigate', at, d?.id ?? null);
  placeBuilt(g, s);
  return s;
};
const ship = (g: GameState, id: number) => g.ships.find((s) => s.id === id) as ShipState;

describe('fleets (§22.1)', () => {
  it('a warship built joins the fleet waiting there, or forms one named in its power’s tradition', () => {
    let g = start();
    const h = capital(g);
    h.industry = 500;
    powerOf(g, 'sta').stockpile = { metals: 500, volatiles: 500, fuel: 500 };
    const d = buildable(powerOf(g, 'sta')).find((x) => x.hull === 'frigate');
    const item = { kind: 'ship', ship: 'frigate', design: d?.id } as const;
    g = order(g, { type: 'queue', holding: h.id, item });
    g = order(g, { type: 'queue', holding: h.id, item });
    g = turn(g);
    expect(g.fleets.map((f) => f.name)).toEqual(['1st Squadron']);
    expect(fleetShips(g, g.fleets[0] as never)).toHaveLength(2);
    expect(g.reports[0]?.events).toContainEqual(expect.objectContaining({ kind: 'built', fleet: g.fleets[0]?.id }));
    // Sent away, the next is a fleet of its own.
    g = order(g, { type: 'fleet-move', fleet: g.fleets[0]?.id as number, to: 'alpha-centauri' });
    const next = frigate(g);
    expect(g.fleets.map((f) => f.name)).toEqual(['1st Squadron', '2nd Squadron']);
    expect(next.fleet).toBe(g.fleets[1]?.id);
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('every power counts its fleets in its own word', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23].map(ordinal)).toEqual([
      '1st',
      '2nd',
      '3rd',
      '4th',
      '11th',
      '12th',
      '13th',
      '21st',
      '22nd',
      '23rd',
    ]);
    const g = start('hollow-wake');
    const d = buildable(powerOf(g, 'hollow-wake')).find((x) => x.hull === 'corvette');
    const s = makeShip(g, 'hollow-wake', 'corvette', 'wolf-1061', d?.id ?? null);
    expect(placeBuilt(g, s).name).toBe('1st Pack');
  });

  it('is formed, merged, split and joined at one system, never with a survey ship', () => {
    let g = start();
    const a = frigate(g);
    // The first fleet is bound away, so the second frigate forms a fleet of its own; then it stops.
    const first = g.fleets[0] as Fleet;
    first.destinations = ['alpha-centauri'];
    const b = frigate(g);
    first.destinations = [];
    expect(g.fleets).toHaveLength(2);
    const [f1, f2] = g.fleets.map((f) => f.id) as [number, number];
    g = order(g, { type: 'merge-fleet', fleet: f2, into: f1 });
    expect(g.fleets.map((f) => f.id)).toEqual([f1]);
    expect(ship(g, b.id).fleet).toBe(f1);
    // A colony ship joins; a survey ship may not.
    const colony = g.ships.find((s) => s.type === 'colony') as ShipState;
    const survey = g.ships.find((s) => s.type === 'survey') as ShipState;
    expect(refused(g, { type: 'join-fleet', ship: survey.id, fleet: f1 })).toBe('Survey ships sail alone.');
    g = order(g, { type: 'join-fleet', ship: colony.id, fleet: f1 });
    expect(fleetShips(g, g.fleets[0] as never).map((s) => s.id)).toEqual([colony.id, a.id, b.id]);
    // Split: the warship forms a new fleet; the whole fleet cannot be split off.
    expect(refused(g, { type: 'split-fleet', fleet: f1, ships: [colony.id, a.id, b.id] })).toMatch(/whole of/);
    g = order(g, { type: 'split-fleet', fleet: f1, ships: [b.id] });
    expect(g.fleets).toHaveLength(2);
    expect(ship(g, b.id).fleet).not.toBe(f1);
    // The colony ship leaves to sail alone.
    g = order(g, { type: 'leave-fleet', ship: colony.id });
    expect(ship(g, colony.id).fleet).toBeNull();
    // Forming: ships of one system, not survey ships.
    expect(refused(g, { type: 'form-fleet', ships: [survey.id] })).toBe('Survey ships sail alone.');
    g = order(g, { type: 'form-fleet', ships: [a.id, b.id, colony.id] });
    expect(g.fleets).toHaveLength(1);
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('moves as one, at its slowest ship’s pace, with waypoints, and holds', () => {
    let g = start();
    const a = frigate(g);
    const f = g.fleets[0]?.id as number;
    expect(fleetPoints(g, g.fleets[0] as never)).toBe(2);
    // There and back is two lanes of one point each: one turn.
    g = order(g, { type: 'fleet-move', fleet: f, to: 'alpha-centauri' });
    g = order(g, { type: 'fleet-move', fleet: f, to: 'sol', append: true });
    expect(g.fleets[0]?.destinations).toEqual(['alpha-centauri', 'sol']);
    g = turn(g);
    expect(ship(g, a.id).at).toBe('sol');
    expect(g.reports[0]?.events).toContainEqual(expect.objectContaining({ kind: 'fleet-arrived', system: 'sol' }));
    g = order(g, { type: 'fleet-move', fleet: f, to: 'alpha-centauri' });
    g = turn(g);
    expect(ship(g, a.id).at).toBe('alpha-centauri');
    // Hold stops it where it is.
    g = order(g, { type: 'fleet-hold', fleet: f, hold: true });
    const here = fleetAt(g, g.fleets[0] as never);
    g = turn(g);
    expect(fleetAt(g, g.fleets[0] as never)).toBe(here);
    expect(g.fleets[0]?.destinations).toEqual([]);
    // Arrival is reported.
    g = order(g, { type: 'fleet-move', fleet: f, to: 'sol' });
    g = order(g, { type: 'fleet-hold', fleet: f, hold: false });
    g = turn(g);
    expect(fleetAt(g, g.fleets[0] as never)).toBe('sol');
  });

  it('keeps its battle orders: a stance, a target and a retreat point', () => {
    let g = start();
    frigate(g);
    const f = g.fleets[0];
    expect(f).toMatchObject({ stance: 'defend', target: 'warships', retreat: 50 });
    g = order(g, { type: 'fleet-orders', fleet: f?.id as number, stance: 'engage', target: 'largest', retreat: 100 });
    expect(g.fleets[0]).toMatchObject({ stance: 'engage', target: 'largest', retreat: 100 });
    expect(refused(g, { type: 'fleet-orders', fleet: f?.id as number, retreat: 33 as never })).toBe(
      'There is no such retreat point.',
    );
    g = order(g, { type: 'rename-fleet', fleet: f?.id as number, name: '  Home Guard ' });
    expect(g.fleets[0]?.name).toBe('Home Guard');
  });
});

describe('civil ships in a fleet (§22.2)', () => {
  it('go where the fleet goes; told to found, they leave it', () => {
    let g = start();
    frigate(g);
    const f = g.fleets[0]?.id as number;
    const colony = g.ships.find((s) => s.type === 'outpost') as ShipState;
    g = order(g, { type: 'join-fleet', ship: colony.id, fleet: f });
    expect(refused(g, { type: 'move', ship: colony.id, to: 'alpha-centauri' })).toBe(
      'The Redoubt sails with the 1st Squadron: order the fleet, or take it out first.',
    );
    // A colony ship of a fleet at rest where it could found needs you; while the fleet moves, it does not.
    expect(needsOf(world, g, 'sta').some((n) => n.kind === 'idle-ship' && n.ship === colony.id)).toBe(true);
    g = order(g, { type: 'fleet-move', fleet: f, to: 'alpha-centauri' });
    expect(needsOf(world, g, 'sta').some((n) => n.kind === 'idle-ship' && n.ship === colony.id)).toBe(false);
    g = order(g, { type: 'fleet-stop', fleet: f });
    g = order(g, { type: 'found-outpost', ship: colony.id, body: 'mars' });
    expect(ship(g, colony.id).fleet).toBeNull();
    expect(g.fleets).toHaveLength(1);
  });

  it('a fleet whose ships are all gone is gone', () => {
    let g = start();
    const colony = g.ships.find((s) => s.type === 'outpost') as ShipState;
    g = order(g, { type: 'form-fleet', ships: [colony.id] });
    expect(g.fleets).toHaveLength(1);
    g = order(g, { type: 'found-outpost', ship: colony.id, body: 'mars' });
    expect(g.fleets).toHaveLength(0);
    g = turn(g);
    expect(stateProblems(world, g)).toEqual([]);
  });
});

describe('state (§22.4)', () => {
  it('a save from version 16 puts each power’s warships at each system into a fleet', () => {
    const g = start();
    const d = buildable(powerOf(g, 'sta')).find((x) => x.hull === 'frigate');
    makeShip(g, 'sta', 'frigate', 'sol', d?.id ?? null);
    makeShip(g, 'sta', 'frigate', 'sol', d?.id ?? null);
    makeShip(g, 'sta', 'frigate', 'alpha-centauri', d?.id ?? null);
    const old = structuredClone(g) as unknown as Record<string, unknown>;
    old.version = 16;
    delete old.fleets;
    delete old.nextFleetId;
    for (const p of old.powers as Record<string, unknown>[]) delete p.fleetsMade;
    for (const s of old.ships as Record<string, unknown>[]) delete s.fleet;
    const raw = { format: SAVE_FORMAT, version: 1, savedAt: '2026-10-22T00:00:00Z', game: old };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.fleets.map((f) => [f.name, fleetAt(loaded, f), fleetShips(loaded, f).length])).toEqual([
      ['1st Squadron', 'sol', 2],
      ['2nd Squadron', 'alpha-centauri', 1],
    ]);
    expect(loaded.ships.filter((s) => s.type === 'survey').every((s) => s.fleet === null)).toBe(true);
  });
});
