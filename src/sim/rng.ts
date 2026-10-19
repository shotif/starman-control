// Seeded randomness with named streams (docs/design/M1_FIRST_LIGHT.md §2).
// Copied from Starman Reborn, src/content/random.ts at ba4ef73 (D-10), with whole-number helpers
// added for the simulation. The simulation never calls Math.random(): every decision draws from a
// stream keyed by what it is for, so adding content to one part never reshuffles another.
//
// Only additions, multiplications, shifts and one exact division by 2^32 are used, so every device
// gives the same numbers (docs/research/TECH_STACK.md, *The simulation*).

/** FNV-1a (32-bit) hash of a string. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface Rng {
  /** Uniform in [0, 1). */
  next(): number;
  /** Whole number in [min, max], both included. */
  int(min: number, max: number): number;
  /** True with probability numerator / denominator, both whole numbers. */
  chance(numerator: number, denominator: number): boolean;
  pick<T>(items: readonly T[]): T;
  /** One item, each as likely as its whole-number weight. */
  weighted<T>(items: readonly (readonly [T, number])[]): T;
  /** A shuffled copy. */
  shuffle<T>(items: readonly T[]): T[];
}

/** An independent stream for (seed, ...keys), e.g. `rng(seed, 'world', 'tau-ceti')`. */
export function rng(seed: number, ...keys: readonly (string | number)[]): Rng {
  let state = hashString(`${seed >>> 0}|${keys.join('|')}`);
  // mulberry32
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    chance: (numerator, denominator) => int(1, denominator) <= numerator,
    pick: (items) => {
      if (items.length === 0) throw new RangeError('pick from an empty list');
      return items[int(0, items.length - 1)] as (typeof items)[number];
    },
    weighted: (items) => {
      const total = items.reduce((sum, [, w]) => sum + w, 0);
      if (items.length === 0 || total <= 0) throw new RangeError('weighted pick with no weight');
      let roll = int(1, total);
      for (const [item, w] of items) {
        roll -= w;
        if (roll <= 0) return item;
      }
      return (items.at(-1) as (typeof items)[number])[0];
    },
    shuffle: (items) => {
      const out = items.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(0, i);
        [out[i], out[j]] = [out[j] as (typeof out)[number], out[i] as (typeof out)[number]];
      }
      return out;
    },
  };
}

/** A fresh game seed: a whole number from 1 to 2^32 − 1. Only new-game setup may use this. */
export function randomSeed(): number {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return (buf[0] as number) || 1;
}
