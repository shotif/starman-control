import { describe, expect, it } from 'vitest';
import { LANDSCAPES } from '../../src/content/colonyArt.ts';
import { SKY } from '../../src/data/sky.ts';
import {
  DAY_SECONDS,
  dayLight,
  SHUTTLE,
  shuttleAt,
  walkerAt,
  walkers,
  weatherAmount,
  weatherOf,
} from '../../src/render/colonyLife.ts';
import { placeAll } from '../../src/render/colonyPlace.ts';
import { colonyScene } from '../../src/render/colonyScene.ts';
import { newGame } from '../../src/sim/state.ts';
import { buildWorld } from '../../src/sim/world.ts';

const world = buildWorld(SKY);
const game = newGame(world, { seed: 1, powers: [{ faction: 'frontier', controller: 'player' }] });
const h = game.holdings[0];
if (!h) throw new Error('no capital');
const scene = colonyScene(world, game, h);
if (!scene) throw new Error('no scene');
const land = LANDSCAPES[scene.biome];
const placed = placeAll(scene, land);

describe('the day', () => {
  it('turns from day to night and back, and the sun crosses the sky by day', () => {
    const at = (f: number) => dayLight(f * DAY_SECONDS, { locked: false, still: false });
    expect(at(0.3).night).toBe(0);
    expect(at(0.8).night).toBe(1);
    expect(at(0.63).night).toBeGreaterThan(0);
    expect(at(0.63).night).toBeLessThan(1);
    expect(at(0.1).sun).toBeLessThan(at(0.5).sun);
    expect(at(0.8).sun).toBeGreaterThan(1);
    expect(at(1.3)).toEqual(at(0.3));
  });

  it('stands still in late-afternoon light with reduced motion, and in twilight on a locked world', () => {
    expect(dayLight(70, { locked: false, still: true })).toEqual(dayLight(5, { locked: false, still: true }));
    expect(dayLight(70, { locked: false, still: true }).night).toBe(0);
    expect(dayLight(33, { locked: true, still: false })).toEqual(dayLight(81, { locked: true, still: false }));
  });
});

describe('people and rovers', () => {
  it('are the same every time for the same colony', () => {
    expect(walkers(placed, 12, 7, 'people')).toEqual(walkers(placed, 12, 7, 'people'));
    expect(walkers(placed, 12, 7, 'people')).not.toEqual(walkers(placed, 12, 8, 'people'));
  });

  it('walk between doors on the ground, below the horizon, and wait at each', () => {
    const ws = walkers(placed, 20, 3, 'people');
    expect(ws.length).toBeGreaterThan(10);
    let moving = 0;
    for (const w of ws) {
      for (let t = 0; t < 120; t += 1.7) {
        const p = walkerAt(w, t, land.horizon);
        expect(p.v).toBeGreaterThan(land.horizon);
        expect(p.u > 0 && p.u < 1).toBe(true);
        if (p.moving) moving++;
      }
    }
    expect(moving).toBeGreaterThan(0);
  });

  it('move smoothly: a small step in time is a small step on the ground', () => {
    const [w] = walkers(placed, 1, 11, 'rovers');
    if (!w) throw new Error('no rover');
    for (let t = 0; t < 60; t += 0.5) {
      const a = walkerAt(w, t, land.horizon);
      const b = walkerAt(w, t + 1 / 30, land.horizon);
      expect(Math.hypot(a.u - b.u, a.v - b.v)).toBeLessThan(0.01);
    }
  });

  it('are none in an empty scene', () => {
    expect(walkers([], 10, 1, 'people')).toEqual([]);
  });
});

describe('the shuttle', () => {
  it('comes down, stays on the pad, climbs away, and is gone for the rest of the visit', () => {
    const t0 = SHUTTLE.every - 12;
    expect(shuttleAt(t0 + 0.01).height).toBeGreaterThan(0.9);
    const landed = shuttleAt(t0 + SHUTTLE.descend + 1);
    expect(landed).toEqual({ away: false, height: 0, across: 0, thrust: 0 });
    expect(shuttleAt(t0 + SHUTTLE.descend + SHUTTLE.stay + 3).height).toBeGreaterThan(0);
    expect(shuttleAt(t0 + SHUTTLE.descend + SHUTTLE.stay + SHUTTLE.climb + 1).away).toBe(true);
  });
});

describe('the weather', () => {
  it('follows the ground, and there is none without air', () => {
    expect(weatherOf('ice', true)).toBe('snow');
    expect(weatherOf('garden', true)).toBe('rain');
    expect(weatherOf('inferno', true)).toBe('ash');
    expect(weatherOf('desert', true)).toBe('dust');
    expect(weatherOf('ice', false)).toBeNull();
    expect(weatherOf('airless', true)).toBeNull();
  });

  it('comes and goes', () => {
    const rain = Array.from({ length: 40 }, (_, i) => weatherAmount('rain', i * 10));
    expect(Math.min(...rain)).toBe(0);
    expect(Math.max(...rain)).toBeGreaterThan(0.8);
    expect(weatherAmount(null, 30)).toBe(0);
  });
});
