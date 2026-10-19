import { describe, expect, it } from 'vitest';
import type { FactionId } from '../../src/content/factions.ts';
import { SPECIES } from '../../src/content/species.ts';
import { TECH_IDS, TECHS, type TechId } from '../../src/content/techs.ts';
import { SKY } from '../../src/data/sky.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import { capacityOf, costOf, growthOf, settleRefusal, yieldsOf } from '../../src/sim/economy.ts';
import { habitability } from '../../src/sim/habitability.ts';
import { laneQuote, laneReachDeci } from '../../src/sim/lanes.ts';
import { blindReachDeci, jumpPoints } from '../../src/sim/movement.ts';
import { needsOf } from '../../src/sim/needs.ts';
import { applyOrder, type Order, refuse } from '../../src/sim/orders.ts';
import { researchOf, researchTurns, speciesFor } from '../../src/sim/research.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { type GameState, type Holding, makeHolding, newGame, powerOf } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { buildWorld } from '../../src/sim/world.ts';

const world = buildWorld(SKY);
const start = (faction: FactionId = 'sta') => newGame(world, { seed: 42, powers: [{ faction, controller: 'player' }] });
const order = (state: GameState, o: Order, faction: FactionId = 'sta') => {
  const r = applyOrder(world, state, faction, o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const research = (state: GameState, tech: TechId, now = false) => order(state, { type: 'research', tech, now });
const turn = (state: GameState) => resolveTurn(world, state);
/** A game where the Authority has these technologies already. */
const knowing = (...techs: TechId[]) => {
  const g = start();
  powerOf(g, 'sta').researched.push(...techs);
  return g;
};
const capital = (g: GameState) => g.holdings[0] as Holding;

describe('research points', () => {
  it('are 1 for every 2 million people over all your colonies, rounded down', () => {
    const g = start();
    expect(researchOf(g, 'sta')).toEqual({ total: 5, parts: [{ label: 'from 10 million people × ½', value: 5 }] });
    makeHolding(g, { owner: 'sta', kind: 'colony', system: 'sol', body: 'mars', capital: false, people: 15 });
    expect(researchOf(g, 'sta').total).toBe(5); // 11.5 million: 5.75
    makeHolding(g, { owner: 'sta', kind: 'colony', system: 'sol', body: 'moon', capital: false, people: 5 });
    expect(researchOf(g, 'sta').total).toBe(6); // 12 million
  });

  it('go into the first technology queued, then the next with what is left', () => {
    let g = research(start(), 'lane-engineering-1');
    expect(researchTurns(g, 'sta')).toEqual([6]);
    for (let i = 0; i < 5; i++) g = turn(g).state;
    expect(powerOf(g, 'sta').techProgress['lane-engineering-1']).toBe(25);
    const r = turn(g);
    expect(powerOf(r.state, 'sta').researched).toEqual(['lane-engineering-1']);
    expect(powerOf(r.state, 'sta').techProgress).toEqual({});
    expect(r.reports[0]?.events).toContainEqual({ kind: 'researched', tech: 'lane-engineering-1' });
    // Points beyond what a technology needs go on to the next.
    let h = research(research(start(), 'habitat-domes'), 'deep-survey');
    capital(h).people = 1220; // 61 points a turn, as if a large empire
    h = turn(h).state;
    expect(powerOf(h, 'sta').researched).toEqual(['habitat-domes', 'deep-survey']);
    expect(powerOf(h, 'sta').researchQueue).toEqual([]);
  });

  it('are lost with nothing queued, and what needs you says so', () => {
    const g = start();
    expect(needsOf(world, g, 'sta')).toContainEqual({ kind: 'no-research' });
    const after = turn(g).state;
    expect(powerOf(after, 'sta').techProgress).toEqual({});
    expect(needsOf(world, research(g, 'deep-survey'), 'sta')).not.toContainEqual({ kind: 'no-research' });
  });

  it('stay with a technology taken out of the queue, for when it comes back', () => {
    let g = research(start(), 'adaptation-1');
    g = turn(turn(g).state).state;
    g = order(g, { type: 'unresearch', tech: 'adaptation-1' });
    expect(powerOf(g, 'sta').techProgress['adaptation-1']).toBe(10);
    g = research(g, 'adaptation-1');
    expect(researchTurns(g, 'sta')).toEqual([4]);
  });
});

describe('the research tree', () => {
  it('has fourteen technologies costing 700 points, each needing only what comes before it', () => {
    expect(TECH_IDS).toHaveLength(14);
    expect(TECH_IDS.reduce((sum, id) => sum + TECHS[id].cost, 0)).toBe(700);
    for (const id of TECH_IDS)
      for (const n of TECHS[id].needs) expect(TECHS[n].tier, `${id} needs ${n}`).toBeLessThan(TECHS[id].tier);
  });

  it('queues what a technology needs before it, and "now" puts them first', () => {
    let g = research(start(), 'deep-survey');
    g = research(g, 'lane-engineering-3');
    expect(powerOf(g, 'sta').researchQueue).toEqual([
      'deep-survey',
      'lane-engineering-1',
      'lane-engineering-2',
      'lane-engineering-3',
    ]);
    g = research(g, 'closed-ecologies', true);
    expect(powerOf(g, 'sta').researchQueue.slice(0, 3)).toEqual(['habitat-domes', 'closed-ecologies', 'deep-survey']);
    // Taking one out takes out what needs it.
    g = order(g, { type: 'unresearch', tech: 'lane-engineering-1' });
    expect(powerOf(g, 'sta').researchQueue).toEqual(['habitat-domes', 'closed-ecologies', 'deep-survey']);
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('refuses what is researched, unknown or not queued', () => {
    const g = knowing('deep-survey');
    expect(refuse(world, g, 'sta', { type: 'research', tech: 'deep-survey' })).toBe(
      'Deep survey is already researched.',
    );
    expect(refuse(world, g, 'sta', { type: 'research', tech: 'warp-drive' as TechId })).toBe(
      'There is no such technology.',
    );
    expect(refuse(world, g, 'sta', { type: 'unresearch', tech: 'adaptation-1' })).toBe('That is not being researched.');
  });
});

describe('every technology changes the rule it names', () => {
  it('Lane engineering: lane and blind-jump reach 8, 10 and 12 ly', () => {
    const levels = ['lane-engineering-1', 'lane-engineering-2', 'lane-engineering-3'] as const;
    expect(laneReachDeci(start(), 'sta')).toBe(60);
    for (let i = 1; i <= 3; i++) {
      const g = knowing(...levels.slice(0, i));
      expect(laneReachDeci(g, 'sta')).toBe(60 + 20 * i);
      expect(blindReachDeci(g, 'sta')).toBe(60 + 20 * i);
    }
  });

  it('Jump tuning: one more jump point', () => {
    expect(jumpPoints(knowing('jump-tuning'), 'sta')).toBe(3);
  });

  it('Beacon tuning: lanes 25% cheaper, rounded up', () => {
    expect(laneQuote(world, knowing('beacon-tuning'), 'sta', 'sirius', 'ross-614').cost).toEqual({
      industry: 40,
      metals: 5,
      volatiles: 0,
      fuel: 9,
    });
  });

  it('Habitat domes: harsh worlds can be settled, with room for half their size', () => {
    const mars = bodiesOf(world, 42, 'sol').find((b) => b.id === 'mars');
    if (!mars) throw new Error('no Mars');
    expect(habitability(mars, SPECIES.human).level).toBe('harsh');
    expect(settleRefusal(world, start(), 'sta', 'sol', 'mars', 'colony')).toMatch(/habitat domes/);
    const g = knowing('habitat-domes');
    expect(settleRefusal(world, g, 'sta', 'sol', 'mars', 'colony')).toBeNull();
    const h = makeHolding(g, { owner: 'sta', kind: 'colony', system: 'sol', body: 'mars', capital: false, people: 10 });
    expect(capacityOf(world, g, h)).toBe(Math.floor(mars.size / 2) * 10);
  });

  it('Automated mining: outposts yield one more', () => {
    for (const [g, more] of [
      [start(), 0],
      [knowing('automated-mining'), 1],
    ] as const) {
      const h = makeHolding(g, {
        owner: 'sta',
        kind: 'outpost',
        system: 'sol',
        body: 'mars',
        capital: false,
        people: 0,
      });
      expect(yieldsOf(world, g, h).total.metals).toBe(1 + more);
    }
  });

  it('Orbital yards and Colonial charters: cheaper ships', () => {
    const g = knowing('automated-mining', 'orbital-yards', 'colonial-charters');
    expect(costOf(world, g, capital(g), { kind: 'ship', ship: 'survey' }).industry).toBe(24);
    // Colony ships: 20% less industry, then 25% less of everything.
    expect(costOf(world, g, capital(g), { kind: 'ship', ship: 'colony' })).toEqual({
      industry: 48,
      metals: 15,
      volatiles: 8,
      fuel: 0,
    });
    // Projects are not ships.
    expect(costOf(world, g, capital(g), { kind: 'project', project: 'mine' }).industry).toBe(30);
  });

  it('Adaptation I and II: cold, frozen, low and high gravity cost one step less', () => {
    const s = speciesFor(knowing('adaptation-1', 'adaptation-2'), 'sta');
    expect(s.costs.temperature).toMatchObject({ frozen: 1, cold: 0, temperate: 0, hot: 2, scorching: null });
    expect(s.costs.gravity).toEqual({ low: 0, normal: 0, high: 1 });
    // The Moon (cold, airless, low gravity) is easier for adapted people.
    const moon = bodiesOf(world, 42, 'sol').find((b) => b.id === 'moon');
    if (!moon) throw new Error('no Moon');
    expect(habitability(moon, s).total).toBeLessThan(habitability(moon, SPECIES.human).total);
  });

  it('Closed ecologies: growth 25% faster', () => {
    const g = start();
    const h = { ...capital(g), people: 50 };
    const k = knowing('habitat-domes', 'closed-ecologies');
    expect(growthOf(world, k, { ...capital(k), people: 50 })).toBeGreaterThan(growthOf(world, g, h));
  });

  it('Long-baseline arrays: survey stations reach two lanes out', () => {
    for (const [techs, expected] of [
      [[], false],
      [['deep-survey', 'long-baseline-arrays'], true],
    ] as const) {
      const g = knowing(...techs);
      capital(g).projects.push('survey-station');
      const after = turn(g).state;
      expect(powerOf(after, 'sta').surveyed).toContain('alpha-centauri');
      // Luhman 16 is two lanes out, beyond Alpha Centauri.
      expect(powerOf(after, 'sta').surveyed.includes('luhman-16')).toBe(expected);
    }
  });
});

describe('saves from before research', () => {
  it('start every power with nothing researched', () => {
    const g = start();
    const old = {
      ...g,
      version: 4,
      powers: g.powers.map(({ researched: _r, researchQueue: _q, techProgress: _p, ...p }) => p),
    };
    const loaded = parseSave(world, JSON.stringify({ format: SAVE_FORMAT, version: 1, savedAt: '', game: old }));
    expect(loaded).toEqual(g);
  });
});
