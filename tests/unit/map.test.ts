// Copied from Starman Reborn, tests/unit/galaxy-map.test.ts at ba4ef73 (D-10): the map maths,
// the orbit camera, label layout and gestures, with Control's data in place of Reborn's.

import { describe, expect, it } from 'vitest';
import { SKY } from '../../src/data/sky.ts';
import { OrbitController } from '../../src/render/camera.ts';
import { type GestureSink, GestureTracker } from '../../src/render/gestures.ts';
import { createLabelBox, type LabelBox, layoutLabels, pickLabelAt, pickNearestPoint } from '../../src/render/labels.ts';
import {
  approachOrbit,
  createScreenPoint,
  equatorialToMap,
  fitOrbitDistance,
  mapToEquatorial,
  ORBIT_LIMITS,
  type OrbitState,
  orbitBasis,
  orbitCameraPosition,
  orbitDirection,
  panOrbit,
  projectPoint,
  rotateOrbit,
  shortestAngleDelta,
  smoothingFactor,
  stageShift,
  type Vec3,
  zoomOrbit,
  zoomOrbitAt,
} from '../../src/render/mapMath.ts';

const distance3 = (a: readonly number[], b: readonly number[]) =>
  Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

describe('map axes', () => {
  it('maps equatorial x, y, z to three.js (x, z, -y) with the equator horizontal', () => {
    expect(equatorialToMap([1, 2, 3])).toEqual([1, 3, -2]);
    expect(mapToEquatorial(equatorialToMap([1.5, -2.25, 4]))).toEqual([1.5, -2.25, 4]);
    // North celestial pole is map "up".
    expect(equatorialToMap([0, 0, 1])).toEqual([0, 1, -0]);
  });

  it('is a proper rotation (keeps handedness and distances)', () => {
    const ex = equatorialToMap([1, 0, 0]);
    const ey = equatorialToMap([0, 1, 0]);
    const ez = equatorialToMap([0, 0, 1]);
    expect(cross(ex, ey).map((v) => v + 0)).toEqual(ez.map((v) => v + 0));
    const a = SKY.systems[1]?.positionLy as Vec3;
    const b = SKY.systems[4]?.positionLy as Vec3;
    expect(distance3(equatorialToMap(a), equatorialToMap(b))).toBeCloseTo(distance3(a, b), 12);
  });
});

describe('orbit math', () => {
  const base = (): OrbitState => ({ target: [1, 2, 3], yaw: 0, pitch: 0, distance: 5 });

  it('places the camera from yaw, pitch and distance', () => {
    const p = orbitCameraPosition(base(), [0, 0, 0]);
    expect(p[0]).toBeCloseTo(1, 12);
    expect(p[1]).toBeCloseTo(2, 12);
    expect(p[2]).toBeCloseTo(8, 12);
    const above = orbitCameraPosition({ ...base(), pitch: Math.PI / 2 }, [0, 0, 0]);
    expect(above[1]).toBeCloseTo(7, 12);
  });

  it('clamps pitch and distance and wraps yaw', () => {
    const s = base();
    rotateOrbit(s, 7, 10);
    expect(s.pitch).toBe(ORBIT_LIMITS.maxPitch);
    expect(s.yaw).toBeCloseTo(7 - 2 * Math.PI, 12);
    zoomOrbit(s, 1000);
    expect(s.distance).toBe(ORBIT_LIMITS.maxDistance);
    zoomOrbit(s, 1e-9);
    expect(s.distance).toBe(ORBIT_LIMITS.minDistance);
    zoomOrbit(s, Number.NaN);
    expect(s.distance).toBe(ORBIT_LIMITS.minDistance);
  });

  it('builds an orthonormal screen basis', () => {
    const r: Vec3 = [0, 0, 0];
    const u: Vec3 = [0, 0, 0];
    orbitBasis(0.7, 0.4, r, u);
    expect(Math.hypot(...r)).toBeCloseTo(1, 12);
    expect(Math.hypot(...u)).toBeCloseTo(1, 12);
    expect(r[0] * u[0] + r[1] * u[1] + r[2] * u[2]).toBeCloseTo(0, 12);
  });

  it('pans so the scene follows the pointer', () => {
    const s = base();
    panOrbit(s, 100, 0, 1000, 50);
    // Camera looks down -Z with screen-right = +X: dragging right moves the target left.
    expect(s.target[0]).toBeLessThan(1);
    expect(s.target[1]).toBeCloseTo(2, 12);
    const t = base();
    panOrbit(t, 0, 100, 1000, 50);
    expect(t.target[1]).toBeGreaterThan(2);
  });

  it('eases toward a goal along the shorter arc and snaps at the end', () => {
    const cur: OrbitState = { target: [0, 0, 0], yaw: 3, pitch: 0, distance: 1 };
    const goal: OrbitState = { target: [4, 0, 0], yaw: -3, pitch: 0.5, distance: 16 };
    expect(shortestAngleDelta(3, -3)).toBeCloseTo(2 * Math.PI - 6, 12);
    expect(approachOrbit(cur, goal, 0.5)).toBe(true);
    expect(cur.distance).toBeCloseTo(4, 9); // halfway in log space
    expect(cur.target[0]).toBeCloseTo(2, 12);
    expect(Math.abs(cur.yaw)).toBeGreaterThan(3); // crossed the +/-PI seam, not the long way
    for (let i = 0; i < 60 && approachOrbit(cur, goal, 0.5); i++);
    expect(cur).toEqual(goal);
  });

  /** Where a world point lands on screen (px from the projection centre, y down) for an orbit camera. */
  const screenOf = (s: OrbitState, p: Vec3, fov: number, h: number): { x: number; y: number } => {
    const c = orbitCameraPosition(s, [0, 0, 0]);
    const dir = orbitDirection(s.yaw, s.pitch, [0, 0, 0]);
    const r: Vec3 = [0, 0, 0];
    const u: Vec3 = [0, 0, 0];
    orbitBasis(s.yaw, s.pitch, r, u);
    const d: Vec3 = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
    const depth = -(d[0] * dir[0] + d[1] * dir[1] + d[2] * dir[2]);
    const f = h / 2 / Math.tan((fov * Math.PI) / 360);
    return {
      x: ((d[0] * r[0] + d[1] * r[1] + d[2] * r[2]) / depth) * f,
      y: (-(d[0] * u[0] + d[1] * u[1] + d[2] * u[2]) / depth) * f,
    };
  };
  /** The world point at `depth` along the ray through screen point (x, y). */
  const pointAt = (s: OrbitState, x: number, y: number, depth: number, fov: number, h: number): Vec3 => {
    const c = orbitCameraPosition(s, [0, 0, 0]);
    const dir = orbitDirection(s.yaw, s.pitch, [0, 0, 0]);
    const r: Vec3 = [0, 0, 0];
    const u: Vec3 = [0, 0, 0];
    orbitBasis(s.yaw, s.pitch, r, u);
    const k = depth / (h / 2 / Math.tan((fov * Math.PI) / 360));
    return [0, 1, 2].map((i) => c[i] - dir[i] * depth + r[i] * x * k - u[i] * y * k) as Vec3;
  };

  it('zooms toward a point on screen: whatever is under it stays there, near or far', () => {
    const s: OrbitState = { target: [3, -1, 2], yaw: 0.8, pitch: 0.45, distance: 12 };
    const h = 800;
    // Points under (180, -95) px at the target's depth, nearer and farther.
    const points = [12, 7, 20].map((depth) => pointAt(s, 180, -95, depth, 50, h));
    for (const p of points) {
      const before = screenOf(s, p, 50, h);
      expect(before.x).toBeCloseTo(180, 6);
      expect(before.y).toBeCloseTo(-95, 6);
    }
    const z = { ...s, target: [...s.target] as Vec3 };
    zoomOrbitAt(z, 0.5, 180, -95, h, 50);
    expect(z.distance).toBeCloseTo(6, 12);
    for (const p of points) {
      const after = screenOf(z, p, 50, h);
      expect(after.x).toBeCloseTo(180, 6);
      expect(after.y).toBeCloseTo(-95, 6);
    }
    // Zooming back out about the same point returns to where it started.
    zoomOrbitAt(z, 2, 180, -95, h, 50);
    for (let i = 0; i < 3; i++) expect(z.target[i]).toBeCloseTo(s.target[i], 9);
  });

  it('zooms about the middle like a plain zoom, and leaves the view alone at the limits', () => {
    const a: OrbitState = { target: [1, 2, 3], yaw: 0.3, pitch: 0.2, distance: 9 };
    const b: OrbitState = { target: [1, 2, 3], yaw: 0.3, pitch: 0.2, distance: 9 };
    zoomOrbitAt(a, 0.7, 0, 0, 600, 50);
    zoomOrbit(b, 0.7);
    expect(a).toEqual(b);
    const far: OrbitState = { target: [1, 2, 3], yaw: 0.3, pitch: 0.2, distance: ORBIT_LIMITS.maxDistance };
    zoomOrbitAt(far, 1.5, 200, 100, 600, 50);
    expect(far.target).toEqual([1, 2, 3]);
    expect(far.distance).toBe(ORBIT_LIMITS.maxDistance);
    zoomOrbitAt(far, Number.NaN, 200, 100, 600, 50);
    expect(far.target).toEqual([1, 2, 3]);
  });

  it('can centre any system, the far shell included', () => {
    const farthest = Math.max(...SKY.systems.map((sys) => Math.hypot(...sys.positionLy)));
    expect(ORBIT_LIMITS.maxTargetRadius).toBeGreaterThan(farthest);
  });

  it('uses frame-rate independent smoothing', () => {
    expect(smoothingFactor(0.1, 0.1)).toBeCloseTo(0.5, 12);
    expect(smoothingFactor(0.2, 0.1)).toBeCloseTo(0.75, 12);
    expect(smoothingFactor(0.016, 0)).toBe(1);
  });
});

describe('orbit controller', () => {
  const start: OrbitState = { target: [0, 0, 0], yaw: 0, pitch: 0.3, distance: 10 };

  it('animates transitions and snaps them under reduced motion', () => {
    const c = new OrbitController(start);
    c.transitionTo({ distance: 2, target: [1, 0, 0] });
    expect(c.isAnimating).toBe(true);
    c.update(1 / 60);
    expect(c.current.distance).toBeLessThan(10);
    expect(c.current.distance).toBeGreaterThan(2);
    for (let i = 0; i < 600 && c.update(1 / 60); i++);
    expect(c.current.distance).toBeCloseTo(2, 9);
    const r = new OrbitController(start);
    r.reducedMotion = true;
    r.transitionTo({ distance: 2 });
    expect(r.isAnimating).toBe(false);
    expect(r.current.distance).toBe(2);
  });

  it('zooms toward a point at once (a pinch) or eases there (a double tap)', () => {
    const now = new OrbitController(start);
    now.zoomAt(0.5, 120, 40, 700, 50);
    expect(now.isAnimating).toBe(false);
    expect(now.current.distance).toBeCloseTo(5, 12);
    const eased = new OrbitController(start);
    eased.zoomAt(0.5, 120, 40, 700, 50, true);
    expect(eased.isAnimating).toBe(true);
    expect(eased.current.distance).toBe(10);
    for (let i = 0; i < 600 && eased.update(1 / 60); i++);
    expect(eased.current.distance).toBeCloseTo(5, 9);
    for (let i = 0; i < 3; i++) expect(eased.current.target[i]).toBeCloseTo(now.current.target[i], 9);
  });

  it('lets direct manipulation cancel a transition from the on-screen view', () => {
    const c = new OrbitController(start);
    c.transitionTo({ distance: 2 });
    c.update(1 / 60);
    const shown = c.current.distance;
    const v = c.version;
    c.rotate(0.5, 0);
    expect(c.isAnimating).toBe(false);
    expect(c.current.distance).toBeCloseTo(shown, 12);
    expect(c.goal).toEqual(c.current);
    expect(c.version).toBeGreaterThan(v);
  });
});

describe('projection helpers', () => {
  // 90° vertical fov, aspect 1, near 1, far 100; camera at the origin looking down -Z.
  const n = 1;
  const f = 100;
  const P = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -(f + n) / (f - n), -1, 0, 0, (-2 * f * n) / (f - n), 0];

  it('projects camera-relative points to CSS pixels and rejects points behind the camera', () => {
    const out = createScreenPoint();
    projectPoint(P, 0, 0, -5, 800, 600, out);
    expect(out.visible).toBe(true);
    expect(out.x).toBeCloseTo(400, 9);
    expect(out.y).toBeCloseTo(300, 9);
    projectPoint(P, 5, 5, -5, 800, 600, out);
    expect(out.x).toBeCloseTo(800, 9);
    expect(out.y).toBeCloseTo(0, 9);
    expect(projectPoint(P, 0, 0, 5, 800, 600, out).visible).toBe(false);
    expect(projectPoint(P, 0, 0, -500, 800, 600, out).visible).toBe(false);
  });

  it('centres the stage', () => {
    const shift = { x: 0, y: 0 };
    stageShift(1000, 800, { x: 200, y: 100, w: 400, h: 600 }, shift);
    expect(shift).toEqual({ x: -100, y: 0 });
  });

  it('fits every star inside the stage with the tightest distance', () => {
    const pts = SKY.systems.map((s) => equatorialToMap(s.positionLy));
    const target: Vec3 = [1, -1, -1];
    const args = [target, 1.2, 0.5, 50, 600, 400, 800, 30] as const;
    const d = fitOrbitDistance(pts, ...args);
    expect(d).toBeGreaterThan(5);
    const inside = (dist: number) => {
      const s: OrbitState = { target: [...target], yaw: 1.2, pitch: 0.5, distance: dist };
      const cam = orbitCameraPosition(s, [0, 0, 0]);
      const r: Vec3 = [0, 0, 0];
      const u: Vec3 = [0, 0, 0];
      orbitBasis(1.2, 0.5, r, u);
      const fwd: Vec3 = cross(u, r);
      const k = 400 / Math.tan((25 * Math.PI) / 180);
      return pts.every((p) => {
        const rel: Vec3 = [p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]];
        const depth = rel[0] * fwd[0] + rel[1] * fwd[1] + rel[2] * fwd[2];
        const sx = ((rel[0] * r[0] + rel[1] * r[1] + rel[2] * r[2]) / depth) * k;
        const sy = ((rel[0] * u[0] + rel[1] * u[1] + rel[2] * u[2]) / depth) * k;
        return depth > 0 && Math.abs(sx) <= 270 + 1e-6 && Math.abs(sy) <= 170 + 1e-6;
      });
    };
    expect(inside(d)).toBe(true);
    expect(inside(d * 0.97)).toBe(false);
  });
});

describe('label layout and picking', () => {
  const label = (x: number, y: number, priority: number, w = 80, h = 16): LabelBox => {
    const b = createLabelBox();
    Object.assign(b, { anchorX: x, anchorY: y, width: w, height: h, priority, active: true, gap: 8 });
    return b;
  };
  const overlap = (a: LabelBox, b: LabelBox) =>
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  const bounds = { x: 0, y: 0, w: 400, h: 300 };

  it('places crowded labels without overlap, inside bounds, highest priority first', () => {
    const labels = [label(200, 150, 10), label(205, 152, 50), label(210, 150, 30), label(390, 150, 5)];
    layoutLabels(labels, bounds, [], [], []);
    const shown = labels.filter((l) => l.visible);
    expect(labels[1].visible).toBe(true);
    for (const a of shown) {
      expect(a.x).toBeGreaterThanOrEqual(0);
      expect(a.x + a.width).toBeLessThanOrEqual(400);
      for (const b of shown) if (a !== b) expect(overlap(a, b)).toBe(false);
    }
    // The label near the right edge flips to the left of its anchor.
    expect(labels[3].x + labels[3].width).toBeLessThanOrEqual(390);
  });

  it('avoids obstacles, hides what cannot fit and keeps a stable slot', () => {
    const a = label(100, 100, 1);
    layoutLabels([a], bounds, [{ x: 100, y: 80, w: 200, h: 40 }], [], []);
    expect(a.visible).toBe(true);
    expect(a.x + a.width).toBeLessThanOrEqual(100);
    const slot = a.slot;
    a.anchorX += 3;
    layoutLabels([a], bounds, [{ x: 100, y: 80, w: 200, h: 40 }], [], []);
    expect(a.slot).toBe(slot);
    const blocked = label(100, 100, 1);
    layoutLabels([blocked], bounds, [{ x: 0, y: 0, w: 400, h: 300 }], [], []);
    expect(blocked.visible).toBe(false);
  });

  it('tries farther slots only for labels that allow it', () => {
    const obstacle = { x: 50, y: 50, w: 100, h: 100 };
    const near = label(100, 100, 1, 30, 12);
    layoutLabels([near], bounds, [obstacle], [], []);
    expect(near.visible).toBe(false);
    const far = label(100, 100, 1, 30, 12);
    far.gap = 25;
    far.far = true;
    layoutLabels([far], bounds, [obstacle], [], []);
    expect(far.visible).toBe(true);
  });

  it('picks the nearest visible point within the radius, then labels', () => {
    const pts = [
      { x: 100, y: 100, visible: true },
      { x: 120, y: 100, visible: true },
      { x: 112, y: 100, visible: false },
    ];
    expect(pickNearestPoint(pts, 113, 100, 28)).toBe(1);
    expect(pickNearestPoint(pts, 100, 140, 28)).toBe(-1);
    const l = label(0, 0, 1);
    Object.assign(l, { x: 50, y: 50, visible: true });
    expect(pickLabelAt([l], 60, 55)).toBe(0);
    expect(pickLabelAt([l], 10, 10)).toBe(-1);
  });
});

describe('gestures', () => {
  const recorder = () => {
    const log: string[] = [];
    const sink: GestureSink = {
      rotate: (dx, dy) => log.push(`rotate ${dx},${dy}`),
      pan: (dx, dy) => log.push(`pan ${dx},${dy}`),
      zoom: (f, x, y) => log.push(`zoom ${f.toFixed(2)} at ${x},${y}`),
      tap: (x, y, t) => log.push(`tap ${x},${y},${t}`),
      doubleTap: (x, y) => log.push(`double ${x},${y}`),
    };
    return { log, g: new GestureTracker(sink) };
  };

  it('treats small movement as a tap and larger movement as rotation', () => {
    const { log, g } = recorder();
    g.down(1, 10, 10, 0, 'touch');
    g.move(1, 15, 12); // inside the touch slop
    g.up(1, 15, 12, 100);
    expect(log).toEqual(['tap 15,12,touch']);
    log.length = 0;
    g.down(2, 10, 10, 1000, 'touch');
    g.move(2, 40, 10);
    g.move(2, 50, 20);
    g.up(2, 50, 20, 1200);
    expect(log).toEqual(['rotate 30,0', 'rotate 10,10']);
  });

  it('detects double taps, not slow or distant second taps', () => {
    const { log, g } = recorder();
    g.down(1, 10, 10, 0, 'touch');
    g.up(1, 10, 10, 50);
    g.down(2, 14, 12, 200, 'touch');
    g.up(2, 14, 12, 250);
    expect(log).toEqual(['tap 10,10,touch', 'double 14,12']);
    log.length = 0;
    g.down(3, 10, 10, 1000, 'touch');
    g.up(3, 10, 10, 1050);
    g.down(4, 10, 10, 1600, 'touch');
    g.up(4, 10, 10, 1650);
    expect(log).toEqual(['tap 10,10,touch', 'tap 10,10,touch']);
  });

  it('pinches to zoom and two-finger drags to pan, with no tap afterwards', () => {
    const { log, g } = recorder();
    g.down(1, 100, 100, 0, 'touch');
    g.down(2, 200, 100, 10, 'touch');
    g.move(2, 300, 100); // distance 100 -> 200: zoom in by half about where the fingers were, then follow them 50 px right
    g.up(1, 100, 100, 100);
    g.up(2, 300, 100, 110);
    expect(log).toEqual(['zoom 0.50 at 150,100', 'pan 50,0']);
  });

  it('drops lost fingers without forgetting the last tap', () => {
    const { log, g } = recorder();
    g.down(1, 10, 10, 0, 'touch');
    g.up(1, 10, 10, 50);
    // A finger whose lift never arrives…
    g.down(2, 300, 300, 100, 'touch');
    expect(g.tracks('touch')).toBe(true);
    expect(g.tracks('mouse')).toBe(false);
    g.releaseAll();
    expect(g.activePointers).toBe(0);
    // …does not stop the next tap from making a double tap, or a drag from turning the view.
    g.down(3, 12, 11, 200, 'touch');
    g.up(3, 12, 11, 250);
    g.down(4, 100, 100, 1000, 'touch');
    g.move(4, 140, 100);
    g.up(4, 140, 100, 1100);
    expect(log).toEqual(['tap 10,10,touch', 'double 12,11', 'rotate 40,0']);
  });

  it('never taps after a cancel, ignores a third finger and honours pan mode', () => {
    const { log, g } = recorder();
    g.down(1, 10, 10, 0, 'touch');
    g.cancel(1);
    g.up(1, 10, 10, 20);
    expect(log).toEqual([]);
    expect(g.down(5, 0, 0, 0, 'touch')).toBe(true);
    expect(g.down(6, 50, 0, 0, 'touch')).toBe(true);
    expect(g.down(7, 90, 0, 0, 'touch')).toBe(false);
    g.reset();
    g.down(8, 0, 0, 0, 'mouse', true, false);
    g.move(8, 20, 0);
    g.up(8, 20, 0, 50);
    g.down(9, 0, 0, 100, 'mouse', true, false);
    g.up(9, 0, 0, 120);
    expect(log).toEqual(['pan 20,0']);
  });
});
