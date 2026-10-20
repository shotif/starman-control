// Life in a colony's scene (docs/design/COLONY_VIEW.md §2, increment 16): a slow, cosmetic day; people
// walking between the buildings' doors; rovers; the shuttle that now and then lands on the
// shipyard's pad; the weather of the world's ground. All of it is worked out from the scene and the
// time alone, so it is pure and tested here, and the same at every frame rate. Nothing here is a rule
// of the game: a turn is three months, and this day is not one.

import type { Biome } from '../content/colonyArt.ts';
import type { Placed } from './colonyPlace.ts';

/** Seconds in one day of the scene. */
export const DAY_SECONDS = 90;

export interface DayLight {
  /** 0 by day, 1 at the darkest of night. */
  night: number;
  /** The sun's way across the sky, 0 rising at the right, 1 setting at the left; below the horizon outside. */
  sun: number;
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * The light at a time: a day of 60% light, dusk, a night of 30% and dawn. A locked world stays in
 * its twilight; with reduced motion the scene stays in late-afternoon light.
 */
export function dayLight(seconds: number, opts: { locked: boolean; still: boolean }): DayLight {
  if (opts.locked) return { night: 0.35, sun: 0.97 };
  if (opts.still) return { night: 0, sun: 0.72 };
  const p = (((seconds / DAY_SECONDS) % 1) + 1) % 1;
  // Day from 0 to 0.6, dusk to 0.65, night to 0.95, dawn to 1.
  const night = p < 0.6 ? 0 : p < 0.66 ? smooth(0.6, 0.66, p) : p < 0.94 ? 1 : 1 - smooth(0.94, 1, p);
  const sun = p < 0.62 ? 0.02 + (p / 0.62) * 0.96 : p > 0.97 ? ((p - 0.97) / 0.03) * 0.02 : 1.2;
  return { night, sun };
}

/** A small seeded stream, so the same colony always has the same comings and goings. */
export function stream(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/** Where a building's door is: a little in front of its foot, to one side. */
export function doorOf(p: Placed, side: number): { u: number; v: number } {
  return { u: p.u + p.w * 0.18 * side, v: p.v + 0.012 };
}

export interface Walker {
  /** Doors visited in turn, round and round. */
  stops: { u: number; v: number }[];
  /** Across the picture's width a second, at the depth of the horizon plus one (scaled by depth). */
  speed: number;
  /** Seconds into its round at time 0. */
  offset: number;
  /** Seconds it waits at each door. */
  pause: number;
}

/**
 * People (or rovers) for a scene: each walks a round of two or three doors, from homes to the other
 * buildings and back. Deterministic from the seed.
 */
export function walkers(placed: Placed[], count: number, seed: number, kind: 'people' | 'rovers'): Walker[] {
  if (placed.length === 0 || count <= 0) return [];
  const r = stream(seed);
  const homes = placed.filter((p) => p.building.kind === 'homes');
  const others = placed.filter((p) => p.building.kind !== 'homes');
  const pick = (list: Placed[]) => list[Math.floor(r() * list.length)] ?? placed[0];
  const out: Walker[] = [];
  for (let i = 0; i < count; i++) {
    const from =
      kind === 'rovers' ? pick(others.length > 0 ? others : placed) : pick(homes.length > 0 ? homes : placed);
    const to = pick(kind === 'rovers' ? (homes.length > 0 ? homes : placed) : placed);
    const via = r() < 0.4 ? pick(placed) : null;
    const stops = [from, ...(via && via !== from && via !== to ? [via] : []), to]
      .filter((p): p is Placed => p !== undefined)
      .map((p) => doorOf(p, r() < 0.5 ? -1 : 1));
    if (stops.length < 2) continue;
    out.push({
      stops,
      speed: kind === 'rovers' ? 0.05 + r() * 0.02 : 0.012 + r() * 0.008,
      offset: r() * 60,
      pause: kind === 'rovers' ? 2 + r() * 3 : 1 + r() * 4,
    });
  }
  return out;
}

export interface WalkerPose {
  u: number;
  v: number;
  /** Facing: 1 right, −1 left. */
  facing: 1 | -1;
  /** Walking (the legs move) or standing at a door. */
  moving: boolean;
}

/** Where a walker is at a time. Speed is in picture widths a second at a depth of one below the horizon. */
export function walkerAt(w: Walker, seconds: number, horizon: number): WalkerPose {
  // The legs of its round, each with the time it takes (slower far away, as things look).
  const legs = w.stops.map((a, i) => {
    const b = w.stops[(i + 1) % w.stops.length] ?? a;
    const depth = Math.max(0.05, (a.v + b.v) / 2 - horizon);
    const dist = Math.hypot(b.u - a.u, (b.v - a.v) * 2);
    return { a, b, time: dist / (w.speed * depth) };
  });
  const round = legs.reduce((s, l) => s + l.time + w.pause, 0);
  let t = (((seconds + w.offset) % round) + round) % round;
  for (const l of legs) {
    if (t < w.pause) return { u: l.a.u, v: l.a.v, facing: l.b.u >= l.a.u ? 1 : -1, moving: false };
    t -= w.pause;
    if (t < l.time) {
      const f = t / l.time;
      return {
        u: l.a.u + (l.b.u - l.a.u) * f,
        v: l.a.v + (l.b.v - l.a.v) * f,
        facing: l.b.u >= l.a.u ? 1 : -1,
        moving: true,
      };
    }
    t -= l.time;
  }
  const first = w.stops[0] ?? { u: 0.5, v: 0.6 };
  return { u: first.u, v: first.v, facing: 1, moving: false };
}

/** Seconds between the shuttle's visits, and how a visit goes. */
export const SHUTTLE = { every: 45, descend: 7, stay: 8, climb: 6 } as const;

export interface ShuttlePose {
  /** Not in the sky or on the pad now. */
  away: boolean;
  /** Where it is relative to the pad: 0 on it, 1 at the top of its arc. */
  height: number;
  /** Across from the pad, in the pad's widths: it comes in from the right and leaves to the left. */
  across: number;
  /** Its engines' glow, 0 to 1. */
  thrust: number;
}

/** The shuttle at a time: it comes down to the pad, stays, and climbs away, once a visit. */
export function shuttleAt(seconds: number, offset = 12): ShuttlePose {
  const t = (((seconds + offset) % SHUTTLE.every) + SHUTTLE.every) % SHUTTLE.every;
  const { descend, stay, climb } = SHUTTLE;
  if (t < descend) {
    const f = t / descend;
    const ease = 1 - (1 - f) * (1 - f);
    return {
      away: false,
      height: 1 - ease,
      across: (1 - ease) * 2.2,
      thrust: 0.4 + 0.6 * (1 - ease) + 0.5 * smooth(0.7, 1, f),
    };
  }
  if (t < descend + stay) return { away: false, height: 0, across: 0, thrust: 0 };
  if (t < descend + stay + climb) {
    const f = (t - descend - stay) / climb;
    const ease = f * f;
    return { away: false, height: ease, across: -ease * 2.2, thrust: 1 };
  }
  return { away: true, height: 1, across: 0, thrust: 0 };
}

export type Weather = 'dust' | 'snow' | 'rain' | 'ash' | null;

/** The weather of a ground: what drifts through the air, if there is air. */
export function weatherOf(biome: Biome, hasAir: boolean): Weather {
  if (!hasAir) return null;
  switch (biome) {
    case 'desert':
    case 'steppe':
    case 'haze':
    case 'shore':
      return 'dust';
    case 'ice':
    case 'tundra':
      return 'snow';
    case 'garden':
      return 'rain';
    case 'inferno':
      return 'ash';
    default:
      return null;
  }
}

/** How much weather there is at a time, 0 to 1: it comes and goes over a few minutes; ash never stops. */
export function weatherAmount(weather: Weather, seconds: number): number {
  if (weather === null) return 0;
  if (weather === 'ash') return 0.7;
  const wave = Math.sin((seconds / 170) * Math.PI * 2) * 0.5 + 0.5;
  return weather === 'rain' ? smooth(0.55, 0.8, wave) : 0.25 + 0.75 * wave;
}
