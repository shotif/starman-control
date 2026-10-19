import { describe, expect, it } from 'vitest';
import { SKY } from '../../src/data/sky.ts';
import { ceilDiv, distanceDeci, formatLy } from '../../src/sim/geometry.ts';
import { buildWorld, laneEnds, laneId, otherEnd } from '../../src/sim/world.ts';

const world = buildWorld(SKY);

describe('distances', () => {
  it('are whole tenths of a light-year', () => {
    expect(distanceDeci([0, 0, 0], [3, 4, 0])).toBe(50);
    expect(distanceDeci([0, 0, 0], [0.04, 0, 0])).toBe(0);
    expect(distanceDeci([0, 0, 0], [0.05, 0, 0])).toBe(1);
    expect(formatLy(55)).toBe('5.5 ly');
    expect(formatLy(117)).toBe('11.7 ly');
    expect(ceilDiv(7, 3)).toBe(3);
    expect(ceilDiv(6, 3)).toBe(2);
  });

  it('put the real stars where astronomers measure them', () => {
    expect(world.system('sol').fromSolDeci).toBe(0);
    expect(world.distanceDeci('sol', 'alpha-centauri')).toBe(44); // Alpha Centauri A, 4.4 ly
    expect(world.distanceDeci('sol', 'barnard')).toBe(60); // Barnard's Star, 6.0 ly
    expect(world.system('tau-ceti').fromSolDeci).toBe(119);
    expect(world.system('wolf-1061').fromSolDeci).toBe(141);
    expect(world.distanceDeci('tau-ceti', 'sol')).toBe(world.distanceDeci('sol', 'tau-ceti'));
  });

  it('keep every system inside the 27 ly census', () => {
    for (const s of world.systems) expect(s.fromSolDeci, s.id).toBeLessThanOrEqual(275);
  });
});

describe('the lane catalogue', () => {
  it('is Reborn’s network: 271 lanes, median 5.5 ly, longest 11.7 ly', () => {
    expect(world.catalogue).toHaveLength(271);
    const lengths = world.catalogue.map((l) => l.lengthDeci).sort((a, b) => a - b);
    expect(lengths[Math.floor(lengths.length / 2)]).toBe(55);
    expect(lengths.at(-1)).toBe(117);
    expect(lengths[0]).toBeGreaterThan(0);
  });

  it('reaches every system from Sol', () => {
    const seen = new Set(['sol']);
    const queue = ['sol'];
    for (let i = 0; i < queue.length; i++) {
      for (const l of world.catalogueAt(queue[i] as string)) {
        const next = otherEnd(l.id, queue[i] as string);
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    expect(seen.size).toBe(207);
  });

  it('names a lane the same from either end', () => {
    expect(laneId('sol', 'alpha-centauri')).toBe('alpha-centauri~sol');
    expect(laneId('alpha-centauri', 'sol')).toBe('alpha-centauri~sol');
    expect(laneEnds('alpha-centauri~sol')).toEqual(['alpha-centauri', 'sol']);
    expect(otherEnd('alpha-centauri~sol', 'sol')).toBe('alpha-centauri');
    expect(world.catalogueLane('sol', 'alpha-centauri')?.lengthDeci).toBe(44);
    expect(world.catalogueLane('sol', 'tau-ceti')).toBeUndefined();
  });

  it('lists the lanes at a system shortest first', () => {
    for (const s of world.systems) {
      const at = world.catalogueAt(s.id);
      expect(at.length, s.id).toBeGreaterThan(0);
      for (let i = 1; i < at.length; i++)
        expect((at[i] as { lengthDeci: number }).lengthDeci).toBeGreaterThanOrEqual(
          (at[i - 1] as { lengthDeci: number }).lengthDeci,
        );
    }
  });

  it('refuses unknown systems', () => {
    expect(world.hasSystem('nowhere')).toBe(false);
    expect(() => world.system('nowhere')).toThrow(RangeError);
  });

  it('marks the systems of flare stars', () => {
    expect(world.system('alpha-centauri').flare).toBe(true); // Proxima Centauri
    expect(world.system('sol').flare).toBe(false);
    expect(world.systems.filter((s) => s.flare)).toHaveLength(9); // UV Ceti and BL Ceti share a system
  });
});
