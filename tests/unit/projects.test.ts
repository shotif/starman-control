import { describe, expect, it } from 'vitest';
import type { Zone } from '../../src/content/districts.ts';
import type { FactionId } from '../../src/content/factions.ts';
import { PROJECT_IDS, PROJECTS, type ProjectId } from '../../src/content/projects.ts';
import type { TechId } from '../../src/content/techs.ts';
import { SKY } from '../../src/data/sky.ts';
import {
  approvalOf,
  capacityOf,
  civicOf,
  creditsOf,
  foodOf,
  growthOf,
  industryOf,
  queueRefusal,
  researchOf,
  upkeepOf,
  yieldsOf,
  zoneYield,
} from '../../src/sim/economy.ts';
import { jumpPoints } from '../../src/sim/movement.ts';
import { type GameState, type Holding, makeHolding, newGame, powerOf } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M2 increment 21 (M2_WORLDS.md §23): nine projects and the tree that opens them. */

const world = buildWorld(SKY);
const start = (faction: FactionId = 'sta') => newGame(world, { seed: 42, powers: [{ faction, controller: 'player' }] });
const capital = (g: GameState) => g.holdings.find((h) => h.owner === 'sta' && h.capital) as Holding;
const holding = (g: GameState, id: number) => g.holdings.find((h) => h.id === id) as Holding;
const colony = (
  g: GameState,
  system: string,
  body: string,
  people: number,
  zones: Zone[] = [],
  projects: ProjectId[] = [],
) =>
  makeHolding(g, {
    owner: 'sta',
    kind: 'colony',
    system,
    body,
    capital: false,
    people,
    projects,
    districts: zones.map((zone, i) => ({ zone, slot: i + 1 })),
  });
const knowing = (g: GameState, ...techs: TechId[]) => {
  powerOf(g, 'sta').researched.push(...techs);
  return g;
};
const turn = (g: GameState) => resolveTurn(world, g).state;

describe('the projects (§23.1)', () => {
  it('are eighteen with M2b’s three, each with its upkeep, and those that wait for a technology say which', () => {
    expect(PROJECT_IDS).toHaveLength(18);
    expect(PROJECTS['trade-exchange'].upkeep).toBe(0);
    expect(PROJECTS['research-institute'].upkeep).toBe(2);
    expect(PROJECTS.shipyard.upkeep).toBe(2);
    const g = start();
    const item = { kind: 'project', project: 'research-institute' } as const;
    expect(queueRefusal(world, g, capital(g), item)).toBe('Needs Computing.');
    expect(queueRefusal(world, knowing(g, 'computing'), capital(g), item)).toBeNull();
    expect(queueRefusal(world, g, capital(g), { kind: 'project', project: 'hydroponics' })).toBeNull();
  });

  it('cost their own upkeep', () => {
    const g = start();
    capital(g).projects.push('trade-exchange', 'research-institute', 'hydroponics');
    // Four ships, the shipyard 2, the lane station 1, the exchange 0, the institute 2, hydroponics 1.
    expect(upkeepOf(g, 'sta').total).toBe(4 + 2 + 1 + 0 + 2 + 1);
  });

  it('hydroponics: 3 food on any world', () => {
    const g = start();
    const c = colony(g, 'sol', 'mars', 10, [], ['hydroponics']);
    expect(foodOf(world, g, c).made).toEqual({ total: 3, parts: [{ label: 'from hydroponics', value: 3 }] });
  });

  it('trade exchange: 3 credits, and 1 more for each worked market here', () => {
    const g = start();
    capital(g).projects.push('trade-exchange');
    expect(creditsOf(world, g, capital(g)).parts).toContainEqual({ label: 'the trade exchange', value: 3 + 1 });
  });

  it('civic centre: +10 here, +5 within two lane jumps, the best of them only', () => {
    const g = start();
    capital(g).projects.push('civic-centre');
    expect(civicOf(world, g, capital(g))).toBe(10);
    expect(approvalOf(world, g, capital(g)).parts).toContainEqual({ label: 'the civic centre', value: 10 });
    // Alpha Centauri is a lane from Sol; Epsilon Eridani has no lane of the Authority's.
    const near = colony(g, 'alpha-centauri', 'proxima-cen-b', 10, ['farms']);
    const far = colony(g, 'epsilon-eridani', 'eps-eri-b', 10, ['farms']);
    expect(civicOf(world, g, near)).toBe(5);
    expect(approvalOf(world, g, near).parts).toContainEqual({ label: 'a civic centre near', value: 5 });
    expect(civicOf(world, g, far)).toBe(0);
    near.projects.push('civic-centre');
    expect(civicOf(world, g, near)).toBe(10);
  });

  it('recreation dome: +10 here', () => {
    const g = start();
    capital(g).projects.push('recreation-dome');
    expect(approvalOf(world, g, capital(g)).total).toBe(80);
  });

  it('research institute: 3 research, and each worked lab here 1 more', () => {
    const g = start();
    capital(g).projects.push('research-institute');
    expect(zoneYield(world, g, capital(g), 'labs')).toBe(3);
    expect(researchOf(world, g, 'sta')).toEqual({
      total: 3 + 2 + 3 + 3,
      parts: [
        { label: 'from labs', value: 3 },
        { label: 'from 2 scholars', value: 2 },
        { label: 'from research institutes', value: 3 },
        { label: 'from the capital', value: 3 },
      ],
    });
  });

  it('fusion plant: 4 industry, burning 1 fusion fuel; with none, nothing', () => {
    let g = start();
    capital(g).projects.push('fusion-plant');
    // 9 from works + 2 + 4, and the Authority's 10%: 16.
    expect(industryOf(world, g, capital(g)).total).toBe(16);
    expect(yieldsOf(world, g, capital(g)).parts).toContainEqual({
      label: 'burnt by the fusion plant',
      value: -1,
      resource: 'fuel',
    });
    const fuel = powerOf(g, 'sta').stockpile.fuel;
    g = turn(g);
    // The capital's own 1 fuel a turn, less the 1 burnt.
    expect(powerOf(g, 'sta').stockpile.fuel).toBe(fuel);
    expect(capital(g).industry).toBe(16);
    powerOf(g, 'sta').stockpile.fuel = 0;
    expect(industryOf(world, g, capital(g)).parts).toContainEqual({
      label: 'the fusion plant, with no fuel',
      value: 0,
    });
    const before = capital(g).industry;
    g = turn(g);
    expect(capital(g).industry).toBe(before + 12);
  });

  it('refinery: 2 fusion fuel from 1 volatiles, while there are volatiles', () => {
    let g = start();
    capital(g).projects.push('refinery');
    const s = { ...powerOf(g, 'sta').stockpile };
    g = turn(g);
    // The capital's own 1 of each, and the refinery's exchange.
    expect(powerOf(g, 'sta').stockpile).toMatchObject({ volatiles: s.volatiles + 1 - 1, fuel: s.fuel + 1 + 2 });
    powerOf(g, 'sta').stockpile.volatiles = 0;
    const fuel = powerOf(g, 'sta').stockpile.fuel;
    g = turn(g);
    expect(powerOf(g, 'sta').stockpile.fuel).toBe(fuel + 1);
  });

  it('arcology: room for 4 million more; medical centre: growth 25% faster', () => {
    const g = start();
    const c = capital(g);
    expect(capacityOf(world, g, { ...c, projects: [...c.projects, 'arcology'] })).toBe(120 + 40);
    // At 5 million of 12, 10% a turn makes 0.29 million (0.2); 12% makes 0.35 (0.3).
    const half = { ...c, people: 50 };
    expect(growthOf(world, g, { ...half, projects: [...c.projects, 'medical-centre'] })).toBeGreaterThan(
      growthOf(world, g, half),
    );
  });

  it('make nothing in a colony in revolt', () => {
    const g = start();
    const c = colony(g, 'epsilon-eridani', 'eps-eri-b', 10, [], ['hydroponics', 'trade-exchange']);
    powerOf(g, 'sta').taxes = 'high';
    powerOf(g, 'sta').treasury = -1;
    c.hungry = 1;
    expect(approvalOf(world, g, c).level).toBe('revolt');
    expect(foodOf(world, g, holding(g, c.id)).made.total).toBe(0);
    expect(creditsOf(world, g, holding(g, c.id)).parts.map((p) => p.label)).not.toContain('the trade exchange');
  });
});

describe('the new technologies (§23.2)', () => {
  it('make each zone yield more, twice over', () => {
    const g = start();
    const c = capital(g);
    const base = (z: Zone) => zoneYield(world, g, c, z);
    expect([base('farms'), base('works'), base('mines'), base('labs'), base('market')]).toEqual([3, 3, 2, 2, 3]);
    knowing(
      g,
      'soil-science',
      'soil-science-2',
      'automation',
      'deep-boring',
      'computing',
      'lane-trade',
      'lane-trade-2',
    );
    expect([base('farms'), base('works'), base('mines'), base('labs'), base('market')]).toEqual([5, 4, 3, 3, 5]);
  });

  it('lighten high taxes and widen the home region', () => {
    const g = start();
    powerOf(g, 'sta').taxes = 'high';
    expect(approvalOf(world, g, capital(g)).parts).toContainEqual({ label: 'high taxes', value: -15 });
    knowing(g, 'fair-taxation');
    expect(approvalOf(world, g, capital(g)).parts).toContainEqual({ label: 'high taxes', value: -10 });
  });

  it('give survey ships, and only survey ships, a jump point more', () => {
    const g = start();
    const before = jumpPoints(g, 'sta', 'survey');
    knowing(g, 'long-range-sensors');
    expect(jumpPoints(g, 'sta', 'survey')).toBe(before + 1);
    expect(jumpPoints(g, 'sta', 'colony')).toBe(before);
  });
});
