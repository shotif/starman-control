import { describe, expect, it } from 'vitest';
import { SPECIES } from '../../src/content/species.ts';
import { laneFingerprint } from '../../src/data/fingerprint.ts';
import { SKY } from '../../src/data/sky.ts';
import {
  type Body,
  bodiesOf,
  equilibriumK,
  generateSystemBodies,
  gravityOf,
  kindOfKnown,
  radiusFromMass,
  sizeOf,
  temperatureBand,
} from '../../src/sim/bodies.ts';
import { habitability } from '../../src/sim/habitability.ts';
import { dwarfRow, estimateStar, whiteDwarfTeff } from '../../src/sim/starLight.ts';
import { starClass } from '../../src/sim/stars.ts';
import { buildWorld } from '../../src/sim/world.ts';

const world = buildWorld(SKY);
const human = SPECIES.human;
const all = (seed: number) => world.systems.flatMap((s) => bodiesOf(world, seed, s.id));
const body = (seed: number, system: string, id: string) =>
  bodiesOf(world, seed, system).find((b) => b.id === id) as Body;

describe('estimated starlight (Pecaut & Mamajek 2013)', () => {
  it('uses the Sun’s measured values for the Sun', () => {
    expect(estimateStar('sun', 'G2V')).toEqual({ teffK: 5772, luminosity: 1, radius: 1, mass: 1, basis: 'measured' });
  });

  it('reads a dwarf’s light from the table for its type', () => {
    const tau = estimateStar('tau-ceti', 'G8V');
    expect(tau.basis).toBe('dwarf-table');
    expect(tau.row).toBe('G8V');
    expect(tau.luminosity).toBeCloseTo(0.68, 2); // measured: about 0.52, so the table runs a little bright
    expect(dwarfRow('M5.5Ve')?.type).toBe('M5.5V');
    expect(dwarfRow('dM6')?.type).toBe('M6V');
    expect(dwarfRow('K2V')?.type).toBe('K2V');
    expect(dwarfRow('L7.5')?.type).toMatch(/^L[78]/);
  });

  it('works out a white dwarf from its temperature index', () => {
    expect(whiteDwarfTeff('DA1.9')).toBe(26526);
    const siriusB = estimateStar('sirius-b', 'DA1.9');
    expect(siriusB.basis).toBe('white-dwarf');
    expect(siriusB.luminosity).toBeGreaterThan(0.04); // measured: about 0.056 of the Sun's
    expect(siriusB.luminosity).toBeLessThan(0.08);
  });

  it('takes a star of unknown type as a typical red dwarf, and says so', () => {
    const e = estimateStar('mystery', 'unknown');
    expect(e.basis).toBe('assumed');
    expect(e.row).toBe('M4V');
  });

  it('estimates every star in the census', () => {
    for (const s of SKY.systems)
      for (const st of s.stars) {
        const e = estimateStar(st.id, st.spectralType);
        expect(e.luminosity, st.id).toBeGreaterThan(0);
        expect(e.teffK, st.id).toBeGreaterThan(200);
      }
  });
});

describe('the rules for a world (§4)', () => {
  it('puts Earth at 255 K with Earth’s reflectivity, and bands temperatures', () => {
    expect(equilibriumK(1, 1000)).toBe(255);
    expect(equilibriumK(1, 4000)).toBe(128);
    expect(temperatureBand(288)).toBe('temperate');
    expect(temperatureBand(253)).toBe('cold');
    expect(temperatureBand(179)).toBe('frozen');
    expect(temperatureBand(737)).toBe('scorching');
  });

  it('judges kind, size and gravity from mass and radius', () => {
    expect(kindOfKnown(1.06, undefined)).toBe('rocky');
    expect(kindOfKnown(3.9, 1.81)).toBe('super-earth');
    expect(kindOfKnown(20, 2.6)).toBe('mini-neptune');
    expect(kindOfKnown(318, undefined)).toBe('gas-giant');
    expect(radiusFromMass(100)).toBe(100);
    expect(sizeOf('rocky', 100)).toBe(7);
    expect(sizeOf('moon', 27)).toBe(2);
    expect(sizeOf('gas-giant', 1100)).toBe(12);
    expect(gravityOf(100, 100)).toBe('normal');
    expect(gravityOf(11, 53)).toBe('low');
    expect(gravityOf(394, 141)).toBe('high');
  });
});

describe('Sol', () => {
  const sol = bodiesOf(world, 1, 'sol');

  it('is entirely real: eight planets, seven large moons, two belts', () => {
    expect(sol.filter((b) => !b.parent && b.kind !== 'belt').map((b) => b.name)).toEqual([
      'Mercury',
      'Venus',
      'Earth',
      'Mars',
      'Jupiter',
      'Saturn',
      'Uranus',
      'Neptune',
    ]);
    expect(sol.filter((b) => b.parent)).toHaveLength(7);
    expect(sol.filter((b) => b.kind === 'belt')).toHaveLength(2);
    expect(sol.every((b) => b.origin === 'sol' && b.facts.orbit === 'observed' && b.facts.riches === 'fiction')).toBe(
      true,
    );
  });

  it('is the same whatever the seed, but for its riches', () => {
    const strip = (b: Body) => ({ ...b, riches: null });
    expect(bodiesOf(world, 2, 'sol').map(strip)).toEqual(sol.map(strip));
  });

  it('gives humans Earth as comfortable, Mars and the Moon as harsh, Venus and the giants as impossible', () => {
    const level = (id: string) => habitability(sol.find((b) => b.id === id) as Body, human).level;
    expect(level('earth')).toBe('comfortable');
    expect(level('mars')).toBe('harsh');
    expect(level('moon')).toBe('harsh');
    expect(level('venus')).toBe('uninhabitable');
    expect(level('jupiter')).toBe('uninhabitable');
    expect(level('sol-main-belt')).toBe('uninhabitable');
  });

  it('explains a world’s habitability, and sets its capacity', () => {
    const mars = habitability(sol.find((b) => b.id === 'mars') as Body, human);
    expect(mars.reasons).toEqual([
      { condition: 'temperature', value: 'cold', cost: 1 },
      { condition: 'atmosphere', value: 'thin', cost: 1 },
      { condition: 'gravity', value: 'low', cost: 1 },
    ]);
    expect(mars.capacity).toBe(2); // harsh: half its size of 4
    expect(habitability(sol.find((b) => b.id === 'earth') as Body, human).capacity).toBe(14);
    const venus = habitability(sol.find((b) => b.id === 'venus') as Body, human);
    expect(venus.reasons.find((r) => r.cost === null)?.value).toBe('scorching');
  });
});

describe('known planets', () => {
  it('keep every observed value, to the thousandth of an au and the hundredth of an Earth', () => {
    for (const s of SKY.systems) {
      if (s.id === 'sol') continue;
      for (const p of s.planets) {
        const b = body(1, s.id, p.id);
        expect(b.origin, p.id).toBe('known');
        if (p.semiMajorAxisAu)
          expect(b.orbitMilliAu, p.id).toBe(Math.max(1, Math.round(p.semiMajorAxisAu.value * 1000)));
        if (p.massEarth) expect(b.massCenti, p.id).toBe(Math.round(p.massEarth.value * 100));
        if (p.radiusEarth) expect(b.radiusCenti, p.id).toBe(Math.round(p.radiusEarth.value * 100));
        expect(b.facts.atmosphere, p.id).toBe('fiction');
        expect(b.planet, p.id).toBe(p);
      }
    }
  });

  it('feel their star: Proxima b is tidally locked to a flare star', () => {
    const b = body(1, 'alpha-centauri', 'proxima-cen-b');
    expect(b.locked).toBe(true);
    expect(b.flareExposed).toBe(true);
    expect(habitability(b, human).reasons.some((r) => r.condition === 'flare')).toBe(true);
  });
});

describe('generated worlds', () => {
  it('are the same for the same seed, and differ for another', () => {
    for (const s of world.systems.slice(0, 40)) expect(generateSystemBodies(7, s)).toEqual(generateSystemBodies(7, s));
    const one = JSON.stringify(all(1));
    expect(JSON.stringify(all(2))).not.toBe(one);
  });

  it('are pinned: the bodies of seed 1 never change by accident', () => {
    // If this fails, every saved game's worlds would change: only update it on purpose.
    const lines = all(1).map(
      (b) => [b.id, `${b.kind}:${b.orbitMilliAu}:${b.massCenti}:${b.atmosphere}:${b.water}`] as [string, string],
    );
    expect(lines).toHaveLength(716);
    expect(laneFingerprint(lines)).toBe(PINNED);
  });

  it('hold whole numbers only', () => {
    for (const b of all(3)) {
      const { planet: _archive, ...rest } = b;
      JSON.stringify(rest, (_k, v) => {
        if (typeof v === 'number') expect(Number.isInteger(v), b.id).toBe(true);
        return v;
      });
    }
  });

  it('keep clear of known planets’ orbits and never wear a real planet’s name', () => {
    for (const s of world.systems) {
      const bodies = bodiesOf(world, 1, s.id);
      const known = bodies.filter((b) => b.origin === 'known' && b.kind !== 'belt');
      const knownLetters = known.map((b) => b.name.slice(-1));
      for (const g of bodies.filter((b) => b.origin === 'generated' && !b.parent && b.kind !== 'belt')) {
        for (const k of known.filter((k) => k.star === g.star))
          expect(g.orbitMilliAu * 10 > k.orbitMilliAu * 13 || g.orbitMilliAu * 13 < k.orbitMilliAu * 10, g.id).toBe(
            true,
          );
        expect(
          SKY.systems.flatMap((x) => x.planets).some((p) => p.name === g.name),
          g.name,
        ).toBe(false);
        if (knownLetters.length > 0)
          expect(g.name.slice(-1) > (knownLetters.sort().at(-1) as string), g.name).toBe(true);
      }
    }
    expect(
      bodiesOf(world, 1, 'tau-ceti').filter((b) => b.origin === 'generated' && !b.parent && b.kind !== 'belt')[0]?.name,
    ).toBe('Tau Ceti i');
  });

  it('suit their star: few and close for red dwarfs, rare for white dwarfs, small and cold for brown dwarfs', () => {
    for (const seed of [1, 2, 3, 4]) {
      for (const s of world.systems) {
        const cls = starClass(s.sky.stars[0]?.spectralType ?? '');
        const made = bodiesOf(world, seed, s.id).filter(
          (b) => b.origin === 'generated' && !b.parent && b.kind !== 'belt',
        );
        if (s.id === 'sol') expect(made).toHaveLength(0);
        else if (cls === 'M') expect(made.length, s.id).toBeLessThanOrEqual(4);
        else if (cls === 'G' || cls === 'K') expect(made.length, s.id).toBeLessThanOrEqual(7);
        else if (cls === 'D') expect(made.length, s.id).toBeLessThanOrEqual(1);
        else if (cls === 'L' || cls === 'T' || cls === 'Y') {
          expect(made.length, s.id).toBeLessThanOrEqual(2);
          for (const b of made) {
            expect(['rocky', 'dwarf'], b.id).toContain(b.kind);
            expect(b.equilibriumK, b.id).toBeLessThan(260);
          }
        }
      }
    }
  });

  it('keep the belts astronomers see, and add none beside them', () => {
    const tau = bodiesOf(world, 1, 'tau-ceti').filter((b) => b.kind === 'belt');
    expect(tau.map((b) => b.name)).toEqual(['Tau Ceti debris disc']);
    expect(tau[0]?.facts.kind).toBe('observed');
  });

  it('give each giant its large moons, after it in the list', () => {
    const bodies = all(1);
    for (const m of bodies.filter((b) => b.kind === 'moon' && b.origin === 'generated')) {
      const parent = bodies.find((b) => b.id === m.parent);
      expect(['gas-giant', 'ice-giant'], m.id).toContain(parent?.kind);
      expect(m.orbitMilliAu).toBe(parent?.orbitMilliAu);
    }
  });

  it('are rarely comfortable for humans, often harsh', () => {
    const levels = all(1).map((b) => habitability(b, human).level);
    const share = (l: string) => levels.filter((x) => x === l).length / levels.length;
    expect(share('comfortable')).toBeLessThan(0.05);
    expect(share('harsh')).toBeGreaterThan(0.3);
  });
});

const PINNED = '9f4f8318';
