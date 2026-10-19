import { describe, expect, it } from 'vitest';
import { SKY } from '../../src/data/sky.ts';
import { orbitUnits, planetStyle, systemLayout } from '../../src/render/systemLayout.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import { buildWorld } from '../../src/sim/world.ts';

const world = buildWorld(SKY);
const layout = (id: string, seed = 42) => systemLayout(world.system(id), bodiesOf(world, seed, id));

describe('the system in 3D: where things are drawn', () => {
  it('draws every world once, round its own star, moons round their planets', () => {
    for (const s of world.systems) {
      const bodies = bodiesOf(world, 42, s.id);
      const l = systemLayout(s, bodies);
      const drawn = [...l.bodies.map((b) => b.id), ...l.belts.map((b) => b.id)].sort();
      expect(drawn, s.id).toEqual(bodies.map((b) => b.id).sort());
      expect(l.stars.map((x) => x.id)).toEqual(s.sky.stars.map((x) => x.id));
      for (const b of l.bodies) {
        expect(Number.isFinite(b.orbit) && Number.isFinite(b.period) && b.radius > 0, b.id).toBe(true);
        const source = bodies.find((x) => x.id === b.id);
        expect(b.parent).toBe(source?.parent);
      }
      expect(Number.isFinite(l.extent)).toBe(true);
    }
  });

  it('keeps each star’s worlds in their real order, and their orbits apart', () => {
    for (const s of world.systems) {
      const l = layout(s.id);
      for (const st of l.stars) {
        const ring = l.bodies.filter((b) => b.star === st.id && !b.parent);
        for (let i = 1; i < ring.length; i++) {
          const a = ring[i - 1];
          const b = ring[i];
          if (!a || !b) continue;
          expect(b.orbit - b.radius, `${a.id} then ${b.id}`).toBeGreaterThan(a.orbit + a.radius);
        }
        if (ring[0]) expect(ring[0].orbit).toBeGreaterThan(st.radius * 1.5);
      }
    }
  });

  it('places companion stars clear of every orbit', () => {
    const l = layout('alpha-centauri');
    expect(l.stars).toHaveLength(3);
    for (const a of l.stars)
      for (const b of l.stars) {
        if (a === b) continue;
        expect(Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2])).toBeGreaterThan(a.extent + b.extent);
      }
  });

  it('draws Sol as Sol: the planets’ own looks, Saturn’s rings, the Moon round Earth, Earth in the habitable zone', () => {
    const l = layout('sol');
    const earth = l.bodies.find((b) => b.id === 'earth');
    expect(earth?.style).toBe('earth');
    expect(l.bodies.find((b) => b.id === 'saturn')?.rings).toBeDefined();
    expect(l.bodies.find((b) => b.id === 'moon')).toMatchObject({ parent: 'earth', style: 'moon' });
    expect(l.belts.map((b) => b.id)).toEqual(['sol-main-belt', 'sol-kuiper-belt']);
    const hz = l.habitableZone;
    expect(hz && earth && earth.orbit > hz.inner && earth.orbit < hz.outer).toBe(true);
    // Mercury goes round fastest, and the rest in Kepler's ratio.
    const mercury = l.bodies.find((b) => b.id === 'mercury');
    expect(mercury?.period).toBe(24);
    expect(earth?.period).toBeCloseTo(24 * (1 / 0.387) ** 1.5, 0);
  });

  it('compresses orbits by their square root, and chooses looks from kind and climate', () => {
    expect(orbitUnits(0)).toBe(3000);
    expect(orbitUnits(4)).toBe(31_000);
    const tauCeti = bodiesOf(world, 42, 'tau-ceti');
    for (const b of tauCeti) if (b.kind === 'gas-giant') expect(['saturn', 'exo-gas-giant']).toContain(planetStyle(b));
    expect(layout('tau-ceti')).toEqual(layout('tau-ceti'));
  });
});
