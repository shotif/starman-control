import { describe, expect, it } from 'vitest';
import { SKY } from '../../src/data/sky.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import { laneQuote, laneRefusal, laneTargets } from '../../src/sim/lanes.ts';
import { applyOrder, type Order } from '../../src/sim/orders.ts';
import { exportSave, parseSave } from '../../src/sim/save.ts';
import { type GameState, makeHolding, newGame, powerOf, type ShipState } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { shapeProblems, stateProblems } from '../../src/sim/validate.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** The shell out to 33 ly in play (M3_NEIGHBOURS.md §18): dark and laneless, reached as any star off the lanes. */

const world = buildWorld(SKY);
const start = () => newGame(world, { seed: 42, powers: [{ faction: 'sta', controller: 'player' }] });
const order = (state: GameState, o: Order) => {
  const r = applyOrder(world, state, 'sta', o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const survey = (g: GameState) => g.ships.find((s) => s.owner === 'sta' && s.type === 'survey') as ShipState;

describe('the shell in play', () => {
  it('is reached by a blind jump: G 227-22 to GJ 1227, 2.3 ly, and surveyed on arrival', () => {
    let g = start();
    const ship = survey(g);
    ship.at = 'g-227-22';
    ship.destinations = [];
    expect(world.system('gj-1227').sky.shell).toBe(true);
    g = order(g, { type: 'blind-jump', ship: ship.id, to: 'gj-1227' });
    for (let i = 0; i < 3 && survey(g).at !== 'gj-1227'; i++) {
      g = resolveTurn(world, g).state;
      expect([...shapeProblems(g), ...stateProblems(world, g)]).toEqual([]);
    }
    expect(survey(g).at).toBe('gj-1227');
    expect(powerOf(g, 'sta').surveyed).toContain('gj-1227');
    // Its worlds are made as any star's, from its real type and the seed.
    expect(bodiesOf(world, g.seed, 'gj-1227').length).toBeGreaterThan(0);
  });

  it('is joined by a new lane, never a relit one: none of the old lanes reaches it', () => {
    const g = start();
    makeHolding(g, {
      owner: 'sta',
      kind: 'outpost',
      system: 'g-227-22',
      body: 'g-227-22:1',
      capital: false,
      people: 0,
    });
    expect(laneRefusal(world, g, 'sta', 'g-227-22', 'gj-1227')).toBeNull();
    expect(laneQuote(world, g, 'sta', 'g-227-22', 'gj-1227')).toMatchObject({ lengthDeci: 23, relight: false });
    expect(laneTargets(world, g, 'sta', 'g-227-22').map((t) => t.quote.to)).toContain('gj-1227');
    // Zeta Tucanae is 3.0 ly from GJ 54 but 51.2 ly from G 227-22: far out of a new lane's 6 ly.
    expect(laneRefusal(world, g, 'sta', 'g-227-22', 'zeta-tucanae')).toMatch(/^Out of reach/);
  });

  it('leaves a game saved before it as it was: it loads, with the same worlds, and plays on', () => {
    const census = buildWorld({ ...SKY, systems: SKY.systems.filter((s) => !s.shell) });
    expect(census.systems).toHaveLength(207);
    let old = newGame(census, { seed: 42, powers: [{ faction: 'sta', controller: 'player' }] });
    for (let i = 0; i < 3; i++) old = resolveTurn(census, old).state;
    const loaded = parseSave(world, exportSave(old).json);
    expect(loaded).toEqual(old);
    expect(stateProblems(world, loaded)).toEqual([]);
    for (const id of ['sol', 'tau-ceti', 'wolf-1061', 'mu2-herculis'])
      expect(bodiesOf(world, 42, id)).toEqual(bodiesOf(census, 42, id));
    const next = resolveTurn(world, loaded).state;
    expect([...shapeProblems(next), ...stateProblems(world, next)]).toEqual([]);
  });
});
