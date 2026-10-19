import { describe, expect, it } from 'vitest';
import { FACTIONS } from '../../src/content/factions.ts';
import { SKY } from '../../src/data/sky.ts';
import { glyphPx, labelPriority, mapContent } from '../../src/render/mapModel.ts';
import { starClass, starKindWord } from '../../src/sim/stars.ts';
import { newGame } from '../../src/sim/state.ts';
import { buildWorld } from '../../src/sim/world.ts';
import { settle } from '../../src/ui/Sheet.tsx';
import { describeStars } from '../../src/ui/system/SystemPanel.tsx';

const world = buildWorld(SKY);
const game = newGame(world, {
  seed: 1,
  powers: [
    { faction: 'sta', controller: 'player' },
    { faction: 'frontier', controller: 'ai' },
  ],
});
const content = mapContent(world, game);

describe('star classes', () => {
  it('read the catalogued spectral types, prefixes and all', () => {
    expect(starClass('G2V')).toBe('G');
    expect(starClass('dM6')).toBe('M');
    expect(starClass('sdM1')).toBe('M');
    expect(starClass('DA1.9')).toBe('D');
    expect(starClass('A0mA1Va')).toBe('A');
    expect(starClass('T0.5')).toBe('T');
    expect(starClass('unknown')).toBe('?');
    expect(starKindWord('M5.5Ve')).toBe('red dwarf');
    expect(starKindWord('L7.5')).toBe('brown dwarf');
    expect(starKindWord('unknown')).toBe('star');
  });

  it('describe a system’s stars in plain words', () => {
    expect(describeStars(['M4V'])).toBe('A red dwarf');
    expect(describeStars(['K2V'])).toBe('An orange dwarf');
    expect(describeStars(['G2V', 'K1V', 'M5.5Ve'])).toBe(
      'Three stars: a yellow dwarf, an orange dwarf and a red dwarf',
    );
  });

  it('draw brighter kinds larger', () => {
    expect(glyphPx('A1V')).toBeGreaterThan(glyphPx('G2V'));
    expect(glyphPx('G2V')).toBeGreaterThan(glyphPx('M4V'));
    expect(glyphPx('M4V')).toBeGreaterThan(glyphPx('Y0'));
  });
});

describe('what the map draws', () => {
  it('has one glyph per system at its real position, and every old lane', () => {
    expect(content.systems).toHaveLength(207);
    expect(content.lanes).toHaveLength(271);
    const sol = content.systems.find((s) => s.id === 'sol');
    expect(sol?.pos).toEqual([0, 0, -0]);
    // Barnard's Star lies about 0.5 ly north of the plane of the celestial equator.
    expect(content.systems.find((s) => s.id === 'barnard')?.heightLy).toBeCloseTo(0.49, 1);
  });

  it('colours open lanes by their power and leaves the rest dark', () => {
    expect(content.lanes.filter((l) => l.owner === 'sta')).toHaveLength(6);
    expect(content.lanes.filter((l) => l.owner === 'frontier')).toHaveLength(6);
    expect(content.lanes.filter((l) => l.owner === null)).toHaveLength(259);
  });

  it('marks held systems with the power’s shape and colour, capitals larger', () => {
    const tau = content.holdings.find((h) => h.system === 'tau-ceti');
    expect(tau).toEqual({
      system: 'tau-ceti',
      faction: 'frontier',
      mark: 'circle',
      colour: FACTIONS.frontier.colour,
      capital: true,
    });
    expect(content.holdings.filter((h) => h.faction === 'sta')).toHaveLength(7);
    expect(content.holdings.some((h) => h.faction === 'hollow-wake')).toBe(false);
  });

  it('labels the selected system first, then capitals, held systems, known planets, the rest', () => {
    const holdings = new Map(content.holdings.map((h) => [h.system, h]));
    const sys = (id: string) => content.systems.find((s) => s.id === id) as (typeof content.systems)[number];
    const p = (id: string, selected: string | null = null) =>
      labelPriority(sys(id), { selected, hovered: null, holdings }, 0);
    expect(p('ross-128', 'ross-128')).toBeGreaterThan(p('sol'));
    expect(p('sol')).toBeGreaterThan(p('barnard'));
    expect(p('barnard')).toBeGreaterThan(p('ross-128')); // held, against known planets only
    expect(p('ross-128')).toBeGreaterThan(p('ross-248')); // known planets beat a star with none
    expect(labelPriority(sys('ross-128'), { selected: null, hovered: null, holdings }, 1)).toBeGreaterThan(
      p('ross-128'),
    );
  });
});

describe('the bottom sheet', () => {
  it('settles at the nearest height, or follows a flick', () => {
    expect(settle(100, 300, 800, 0)).toBe('closed');
    expect(settle(320, 300, 800, 0)).toBe('peek');
    expect(settle(600, 300, 800, 0)).toBe('full');
    expect(settle(350, 300, 800, -1)).toBe('full');
    expect(settle(700, 300, 800, 1)).toBe('peek');
    expect(settle(250, 300, 800, 1)).toBe('closed');
  });
});
