import { describe, expect, it } from 'vitest';
import { FACTION_IDS } from '../../src/content/factions.ts';
import { SKY } from '../../src/data/sky.ts';
import { newGame } from '../../src/sim/state.ts';
import { buildWorld } from '../../src/sim/world.ts';
import { filterRows, searchKey, sortRows, systemRows } from '../../src/ui/data/model.ts';
import { layoutFor } from '../../src/ui/layout.ts';

describe('the layout breakpoints (§10)', () => {
  const v = (width: number, height: number, finePointer = false, desktopInput = false) => ({
    width,
    height,
    finePointer,
    desktopInput,
  });

  it('use the phone layout below 700 px, or below 500 px tall in landscape', () => {
    expect(layoutFor(v(390, 844))).toBe('phone');
    expect(layoutFor(v(699, 900, true, true))).toBe('phone');
    expect(layoutFor(v(844, 390, true, true))).toBe('phone');
  });

  it('use the desktop layout from 1100 px with a fine pointer', () => {
    expect(layoutFor(v(1440, 900, true))).toBe('desktop');
    expect(layoutFor(v(1100, 700, true))).toBe('desktop');
  });

  it('keep a tablet on the phone layout until a mouse or keyboard is used', () => {
    expect(layoutFor(v(820, 1180))).toBe('phone');
    expect(layoutFor(v(1180, 820))).toBe('phone');
    expect(layoutFor(v(820, 1180, false, true))).toBe('desktop');
  });
});

describe('the data preview', () => {
  const world = buildWorld(SKY);
  const game = newGame(world, { seed: 1, powers: FACTION_IDS.map((faction) => ({ faction, controller: 'ai' })) });
  const rows = systemRows(world, game);

  it('lists every system with its lanes, open or dark', () => {
    expect(rows).toHaveLength(207);
    const sol = rows.find((r) => r.id === 'sol');
    expect(sol?.web).toBe('sta');
    expect(sol?.lanes.filter((l) => l.owner === 'sta')).toHaveLength(4);
    expect(rows.filter((r) => r.web !== null)).toHaveLength(21);
    expect(rows.flatMap((r) => r.lanes).filter((l) => l.owner)).toHaveLength(36); // 18 lanes, seen from both ends
  });

  it('finds names whatever the accents, apostrophes and case', () => {
    expect(searchKey('Barnard’s Star')).toBe('barnards star');
    expect(filterRows(rows, 'BARNARDS', false).map((r) => r.id)).toEqual(['barnard']);
    expect(filterRows(rows, '', true)).toHaveLength(21);
  });

  it('sorts by distance, name, planets and lanes', () => {
    expect(sortRows(rows, 'distance', false)[0]?.id).toBe('sol');
    expect(sortRows(rows, 'distance', true).at(-1)?.id).toBe('sol');
    const byPlanets = sortRows(rows, 'planets', true);
    expect(byPlanets[0]?.planets).toBeGreaterThanOrEqual(byPlanets[1]?.planets ?? 0);
    const byName = sortRows(rows, 'name', false).map((r) => r.name);
    expect(byName).toEqual([...byName].sort((a, b) => a.localeCompare(b, 'en')));
  });
});
