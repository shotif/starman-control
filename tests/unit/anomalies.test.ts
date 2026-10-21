import { describe, expect, it } from 'vitest';
import { ANOMALIES, ANOMALY_IDS } from '../../src/content/anomalies.ts';
import { FACTIONS } from '../../src/content/factions.ts';
import { SKY } from '../../src/data/sky.ts';
import { anomalyAt, grantReward, investigateRefusal, investigationTurns } from '../../src/sim/anomalies.ts';
import { needsOf } from '../../src/sim/needs.ts';
import { applyOrder, type Order } from '../../src/sim/orders.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { exportSave, parseSave } from '../../src/sim/save.ts';
import { type GameState, newGame, powerOf, type ShipState } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { shapeProblems, stateProblems } from '../../src/sim/validate.ts';
import { buildWorld } from '../../src/sim/world.ts';

const world = buildWorld(SKY);
// With seed 42, Alpha Centauri, one lane from Sol, holds lost lane surveys.
const start = () => newGame(world, { seed: 42, powers: [{ faction: 'sta', controller: 'player' }] });
const order = (state: GameState, o: Order) => {
  const r = applyOrder(world, state, 'sta', o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const turn = (state: GameState) => {
  const r = resolveTurn(world, state);
  expect([...shapeProblems(r.state), ...stateProblems(world, r.state)]).toEqual([]);
  return { state: r.state, events: r.reports[0]?.events ?? ([] as ReportEvent[]) };
};
const petrel = (g: GameState) => g.ships.find((s) => s.name === 'Petrel') as ShipState;

describe('where anomalies are', () => {
  it('is about one system in six, never a capital, the same every time for a seed', () => {
    for (const seed of [1, 42, 777, 4242]) {
      const found = world.systems.filter((s) => anomalyAt(seed, s.id) !== null);
      expect(found.length).toBeGreaterThan(207 / 9);
      expect(found.length).toBeLessThan(207 / 4);
      for (const f of Object.values(FACTIONS)) expect(anomalyAt(seed, f.capital.systemId)).toBeNull();
      expect(world.systems.map((s) => anomalyAt(seed, s.id))).toEqual(world.systems.map((s) => anomalyAt(seed, s.id)));
    }
    expect(anomalyAt(42, 'alpha-centauri')).toBe('lost-surveys');
  });

  it('are twenty kinds, three of them threads of the precursor mystery', () => {
    expect(ANOMALY_IDS).toHaveLength(20);
    expect(ANOMALY_IDS.filter((id) => ANOMALIES[id].mystery)).toHaveLength(3);
    for (const id of ANOMALY_IDS) expect(ANOMALIES[id].turns).toBeGreaterThanOrEqual(1);
  });
});

describe('finding and investigating', () => {
  it('finds an anomaly by survey, and a survey ship there can investigate it over its turns', () => {
    // With its surveys switched off, the ship reaches Alpha Centauri without surveying it.
    let g = order(start(), { type: 'auto-survey', ship: petrel(start()).id, on: false });
    g = order(g, { type: 'move', ship: petrel(g).id, to: 'alpha-centauri' });
    g = turn(g).state;
    expect(petrel(g).at).toBe('alpha-centauri');
    expect(investigateRefusal(g, petrel(g))).toBe('This system has not been surveyed yet.');
    g = order(g, { type: 'auto-survey', ship: petrel(g).id, on: true });
    let r = turn(g);
    expect(r.events).toContainEqual(
      expect.objectContaining({ kind: 'surveyed', system: 'alpha-centauri', anomaly: 'lost-surveys' }),
    );
    g = r.state;
    expect(needsOf(world, g, 'sta')).toContainEqual(
      expect.objectContaining({ kind: 'idle-ship', ship: petrel(g).id, canInvestigate: true }),
    );
    g = order(g, { type: 'investigate', ship: petrel(g).id });
    expect(petrel(g).investigating).toEqual({ system: 'alpha-centauri', left: 2 });
    expect(needsOf(world, g, 'sta').some((n) => n.kind === 'idle-ship' && n.ship === petrel(g).id)).toBe(false);
    r = turn(g);
    expect(petrel(r.state).investigating).toEqual({ system: 'alpha-centauri', left: 1 });
    expect(petrel(r.state).at).toBe('alpha-centauri');
    r = turn(r.state);
    expect(r.events).toContainEqual({
      kind: 'investigated',
      ship: petrel(r.state).id,
      system: 'alpha-centauri',
      anomaly: 'lost-surveys',
    });
    const p = powerOf(r.state, 'sta');
    expect(p.investigated).toEqual(['alpha-centauri']);
    // The survey's observations (45 research, M2B_SCIENCE.md §17.2) finished Lane engineering I, so
    // the anomaly's 30 points towards it went to the next that could be researched.
    expect(p.researched).toContain('lane-engineering-1');
    expect(p.techProgress['lane-engineering-2']).toBe(30);
    expect(petrel(r.state).investigating).toBeNull();
    // Once per power.
    expect(investigateRefusal(r.state, petrel(r.state))).toBe('The anomaly here has been investigated.');
    expect(parseSave(world, exportSave(r.state).json)).toEqual(r.state);
  });

  it('takes a turn less with Deep survey, and only survey ships investigate', () => {
    const g = start();
    expect(investigationTurns(g, 'sta', 'derelict-yard')).toBe(3);
    powerOf(g, 'sta').researched.push('deep-survey');
    expect(investigationTurns(g, 'sta', 'derelict-yard')).toBe(2);
    expect(investigationTurns(g, 'sta', 'lifeboat')).toBe(1);
    const colony = g.ships.find((s) => s.type === 'colony') as ShipState;
    expect(investigateRefusal(g, colony)).toBe('Only survey ships investigate anomalies.');
    expect(investigateRefusal(g, petrel(g))).toBe('There is no anomaly here.');
  });

  it('is called off by moving the ship', () => {
    let g = order(start(), { type: 'move', ship: petrel(start()).id, to: 'alpha-centauri' });
    g = turn(g).state;
    g = order(g, { type: 'investigate', ship: petrel(g).id });
    g = order(g, { type: 'move', ship: petrel(g).id, to: 'sol' });
    expect(petrel(g).investigating).toBeNull();
  });
});

describe('rewards', () => {
  it('give resources, research into the current technology, or only a story', () => {
    const g = start();
    const p = powerOf(g, 'sta');
    grantReward(p, 'wake-cache');
    expect(p.stockpile.fuel).toBe(40 + 25);
    // With nothing queued, research goes into the first technology that can be researched.
    grantReward(p, 'buried-instruments');
    expect(p.techProgress['lane-engineering-1']).toBe(25);
    expect(p.researchQueue).toEqual([]);
    // Into the queue when there is one, finishing what it can.
    p.researchQueue = ['deep-survey'];
    expect(grantReward(p, 'ordered-dust')).toEqual(['deep-survey']);
    const before = structuredClone(p);
    grantReward(p, 'lifeboat');
    expect(p).toEqual(before);
  });
});
