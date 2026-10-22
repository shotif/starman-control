import { describe, expect, it } from 'vitest';
import { FACTION_IDS, PLAYABLE_IDS } from '../../src/content/factions.ts';
import { SKY } from '../../src/data/sky.ts';
import { dateOfTurn, formatDate } from '../../src/sim/calendar.ts';
import { beaconSlots, newGame } from '../../src/sim/state.ts';
import { shapeProblems, stateProblems } from '../../src/sim/validate.ts';
import { buildWorld } from '../../src/sim/world.ts';

const world = buildWorld(SKY);
const solo = (faction: (typeof FACTION_IDS)[number], seed = 1234) =>
  newGame(world, { seed, powers: [{ faction, controller: 'player' }] });

describe('the calendar', () => {
  it('starts in Q1 2176, a quarter a turn', () => {
    expect(formatDate(1)).toBe('Q1 2176');
    expect(formatDate(4)).toBe('Q4 2176');
    expect(formatDate(5)).toBe('Q1 2177');
    expect(dateOfTurn(50)).toEqual({ year: 2188, quarter: 2 });
    expect(dateOfTurn(241)).toEqual({ year: 2236, quarter: 1 }); // sixty years
  });
});

describe('a new game', () => {
  it('can be started as any power, and is a possible state', () => {
    for (const f of FACTION_IDS) {
      const g = solo(f);
      expect(shapeProblems(g), f).toEqual([]);
      expect(stateProblems(world, g), f).toEqual([]);
      expect(g.turn).toBe(1);
      expect(g.powers).toHaveLength(1);
      // The aliens' home webs are of their own lanes: the Concord's five, the Moot's four (M3_NEIGHBOURS.md §24.4).
      expect(g.lanes, f).toHaveLength(PLAYABLE_IDS.includes(f) ? 6 : f === 'dusk-concord' ? 5 : 4);
      expect(g.lanes.every((l) => l.owner === f && l.status === 'open')).toBe(true);
    }
  });

  it('gives every power the same assets, whatever its place', () => {
    const [a, b, c] = FACTION_IDS.map((f) => solo(f).powers[0]);
    expect(a?.stockpile).toEqual(b?.stockpile);
    expect(b?.stockpile).toEqual(c?.stockpile);
    for (const f of FACTION_IDS) {
      const capital = solo(f).holdings[0];
      expect(capital).toMatchObject({
        kind: 'colony',
        capital: true,
        people: 100,
        projects: ['shipyard', 'lane-station'],
      });
    }
    expect(solo('sta').holdings[0]?.body).toBe('earth');
    expect(solo('frontier').holdings[0]?.body).toBe('tau-ceti-e'); // D-24
    expect(solo('hollow-wake').holdings[0]?.body).toBe('wolf-1061-c');
  });

  it('opens only the home webs of the powers in play; every other lane is dark', () => {
    const g = solo('frontier');
    expect(g.lanes.map((l) => l.id)).toContain('luyten-726-8~tau-ceti');
    expect(g.lanes.map((l) => l.id)).not.toContain('alpha-centauri~sol');
    const all = newGame(world, {
      seed: 1,
      powers: FACTION_IDS.map((f) => ({ faction: f, controller: f === 'sta' ? 'player' : 'ai' })),
    });
    expect(all.lanes).toHaveLength(18 + 5 + 4);
    expect(stateProblems(world, all)).toEqual([]);
  });

  it('gives a capital five beacon slots and anywhere else three', () => {
    const g = solo('sta');
    expect(beaconSlots(g, 'sol')).toBe(5);
    expect(beaconSlots(g, 'barnard')).toBe(3);
  });

  it('is the same for the same seed, and holds whole numbers only', () => {
    expect(solo('hollow-wake', 99)).toEqual(solo('hollow-wake', 99));
    const numbers: number[] = [];
    JSON.stringify(solo('sta'), (_k, v) => {
      if (typeof v === 'number') numbers.push(v);
      return v;
    });
    expect(numbers.length).toBeGreaterThan(0);
    expect(numbers.every(Number.isInteger)).toBe(true);
  });

  it('keeps the seed a whole number from 1 to 2^32 − 1', () => {
    expect(solo('sta', 0).seed).toBe(1);
    expect(solo('sta', 2 ** 32 + 5).seed).toBe(5);
    expect(() => newGame(world, { seed: 1, powers: [] })).toThrow(RangeError);
  });
});

describe('state checks', () => {
  it('find impossible states', () => {
    const g = solo('sta');
    expect(
      stateProblems(world, { ...g, lanes: [...g.lanes, { id: 'nowhere~sol', owner: 'sta', status: 'open' }] })[0],
    ).toMatch(/out of order|does not exist/);
    expect(stateProblems(world, { ...g, lanes: [{ id: 'barnard~sol', owner: 'frontier', status: 'open' }] })).toEqual([
      'lane barnard~sol belongs to frontier, who is not in play',
    ]);
    // A station lost in a war leaves its lanes standing (M4_FLEETS.md §26); more than any system could hold is wrong.
    const crowded = { ...g, holdings: g.holdings.map((h) => ({ ...h, projects: [] })) };
    expect(stateProblems(world, crowded)).toEqual([]);
    const ids = ['alpha-centauri', 'barnards-star', 'wolf-359', 'luhman-16', 'sirius', 'tau-ceti', 'epsilon-eridani'];
    const packed = {
      ...crowded,
      lanes: [
        ...crowded.lanes,
        ...ids.map((x) => ({
          id: x < 'sol' ? `${x}~sol` : `sol~${x}`,
          owner: 'sta' as const,
          status: 'open' as const,
        })),
      ].sort((a, b) => (a.id < b.id ? -1 : 1)),
    };
    expect(stateProblems(world, packed).join('; ')).toMatch(/sol anchors \d+ lanes, more than it could ever hold/);
    expect(shapeProblems({ ...g, turn: 1.5 })).toEqual(['turn is not a whole number from 1']);
    expect(shapeProblems({ ...g, seed: 0 })).toHaveLength(1);
    expect(shapeProblems('a game')).toEqual(['the game is not a record']);
  });
});
