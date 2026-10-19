import { describe, expect, it } from 'vitest';
import { hashString, randomSeed, rng } from '../../src/sim/rng.ts';

describe('seeded streams', () => {
  it('give the same numbers for the same seed and keys', () => {
    const a = rng(42, 'world', 'tau-ceti');
    const b = rng(42, 'world', 'tau-ceti');
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });

  it('give different numbers for different keys, so streams are independent', () => {
    const a = rng(42, 'world', 'tau-ceti');
    const b = rng(42, 'world', 'sol');
    const same = Array.from({ length: 20 }, () => a.next() === b.next()).filter(Boolean).length;
    expect(same).toBe(0);
  });

  it('are pinned: the first numbers never change, on any device', () => {
    // If this fails, every saved game would play out differently.
    expect(hashString('starman')).toBe(0x425fdf53);
    const r = rng(1, 'pin');
    expect([r.int(1, 100), r.int(1, 100), r.int(1, 100), r.int(1, 100)]).toEqual([35, 64, 20, 97]);
  });

  it('keep whole numbers in range, both ends included', () => {
    const r = rng(7, 'range');
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const n = r.int(-2, 2);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(-2);
      expect(n).toBeLessThanOrEqual(2);
      seen.add(n);
    }
    expect(seen.size).toBe(5);
  });

  it('weigh choices by whole-number weights, and never pick a weight of nothing', () => {
    const r = rng(9, 'weights');
    const counts = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 4000; i++)
      counts[
        r.weighted([
          ['a', 1],
          ['b', 3],
          ['c', 0],
        ] as const)
      ]++;
    expect(counts.c).toBe(0);
    expect(counts.b / counts.a).toBeGreaterThan(2.5);
    expect(counts.b / counts.a).toBeLessThan(3.5);
    expect(() => r.weighted([])).toThrow(RangeError);
  });

  it('roll chances as whole-number odds', () => {
    const r = rng(3, 'chance');
    expect(Array.from({ length: 50 }, () => r.chance(0, 6)).some(Boolean)).toBe(false);
    expect(Array.from({ length: 50 }, () => r.chance(6, 6)).every(Boolean)).toBe(true);
  });

  it('shuffle a copy, keeping every item', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = rng(5, 'shuffle').shuffle(items);
    expect(out.sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('make new-game seeds from 1 to 2^32 − 1', () => {
    for (let i = 0; i < 20; i++) {
      const s = randomSeed();
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(1);
      expect(s).toBeLessThanOrEqual(0xffffffff);
    }
  });
});
