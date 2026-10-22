// Ships of the two alien powers for the battle replay (docs/design/M4_FLEETS.md §25.1), built with
// Reborn's ship kit (kit.ts, ships.ts). Both are fiction: no one has seen a Duskfolk or Drifter ship.
//
// - The Dusk Concord: a dark crescent, horns forward, amber slits along its rim, for a people who
//   live in the ring of dusk on a world locked to its red sun.
// - The Drift Moot: clustered pods like the floaters themselves, banded with violet light, a
//   gondola slung beneath.
// Each is about 14 units long and faces −Z, as Reborn's ships do.

import * as THREE from 'three';
import { Kit, latheZ, loft, mirrored, rod, slab, type V3 } from './kit.ts';
import { assembleShip, type ShipArt } from './ships.ts';
import type { ArtContext } from './types.ts';
import { byQuality } from './util.ts';

const DUSK = {
  hull: '#6a5e6c',
  dark: '#3a3340',
  rim: '#8a7680',
  metal: '#5e5664',
  slit: '#ffb347',
};

/** A crescent's planform in (x, z): the outer arc, then the inner arc back, horns towards −Z. */
function crescent(outer: number, inner: number, offset: number, n: number): [number, number][] {
  const pts: [number, number][] = [];
  const sweep = Math.PI * 0.78;
  for (let i = 0; i <= n; i++) {
    const a = -sweep + (2 * sweep * i) / n;
    pts.push([Math.sin(a) * outer, Math.cos(a) * outer - outer * 0.35]);
  }
  for (let i = n; i >= 0; i--) {
    const a = -sweep * 0.86 + (2 * sweep * 0.86 * i) / n;
    pts.push([Math.sin(a) * inner, Math.cos(a) * inner - outer * 0.35 + offset]);
  }
  // The horns point forward: flip so the open side faces −Z.
  return pts.map(([x, z]) => [x, -z] as [number, number]);
}

/** A Duskfolk warship: a dark crescent, about 14 units across its horns (fiction). */
export function createDuskShip(ctx: ArtContext): ShipArt {
  const kit = new Kit(3);
  const n = byQuality(ctx.quality, 10, 14, 18);
  // The crescent, in two layers, the upper a little smaller.
  kit.add('hull', slab(crescent(7, 5.6, 2.2, n), 0.9, 0.2), { color: DUSK.hull });
  kit.add('dark', slab(crescent(6.3, 5.4, 1.9, n), 0.5, 0.1), { position: [0, 0.6, 0.15], color: DUSK.dark });
  // A keel along the middle, from the back of the arc forward.
  kit.add(
    'hull',
    loft(
      [
        {
          z: 4.4,
          pts: mirrored([
            [0, 0.9],
            [0.9, 0.3],
            [0.7, -0.6],
            [0, -0.8],
          ]),
        },
        {
          z: 2.0,
          pts: mirrored([
            [0, 1.3],
            [1.3, 0.4],
            [1.0, -0.8],
            [0, -1.0],
          ]),
        },
        {
          z: -1.5,
          pts: mirrored([
            [0, 1.0],
            [1.0, 0.3],
            [0.8, -0.6],
            [0, -0.8],
          ]),
        },
        {
          z: -3.6,
          pts: mirrored([
            [0, 0.3],
            [0.3, 0.1],
            [0.25, -0.2],
            [0, -0.25],
          ]),
        },
      ],
      {
        capStart: true,
        capEnd: true,
        baseColor: DUSK.rim,
        faceColor: (_s, edge) => (edge === 0 || edge === 5 ? DUSK.dark : null),
      },
    ),
    { color: undefined },
  );
  // Amber slits along the rim and the keel.
  const slits = 7;
  for (let i = 0; i < slits; i++) {
    const a = -Math.PI * 0.62 + (Math.PI * 1.24 * i) / (slits - 1);
    const x = Math.sin(a) * 6.75;
    const z = -(Math.cos(a) * 6.75 - 7 * 0.35);
    kit.add('emissive', new THREE.BoxGeometry(0.7, 0.08, 0.12), {
      position: [x, 0.05, z],
      rotation: [0, -a, 0],
      color: DUSK.slit,
      intensity: 1.8,
    });
  }
  kit.add('emissive', new THREE.BoxGeometry(0.1, 0.06, 3.2), {
    position: [0, 1.25, 1.2],
    color: DUSK.slit,
    intensity: 1.5,
  });
  // Guns at the horns' tips.
  for (const s of [-1, 1]) rod(kit, 'metal', [s * 4.9, 0, -3.2], [s * 4.6, 0, -5.4], 0.18, DUSK.metal, 6);

  return assembleShip(
    {
      name: 'dusk-crescent',
      kit,
      engine: {
        nozzles: [
          [0.7, 0, 4.6],
          [-0.7, 0, 4.6],
        ],
        radius: 0.45,
        length: 5,
        core: '#fff2d8',
        color: '#ff9a2a',
        boostCore: '#ffffff',
        boostColor: '#ffc06a',
        cruiseColor: '#ffb347',
      },
      lights: [
        { p: [6.2, 0.1, -3.4], color: '#ffb347', size: 0.7, intensity: 1.4 },
        { p: [-6.2, 0.1, -3.4], color: '#ffb347', size: 0.7, intensity: 1.4 },
        { p: [0, 1.4, 0.5], color: '#ffd28a', size: 0.8, intensity: 1.5, blink: 0.4, duty: 0.2, min: 0.2 },
      ],
      shield: [8, 3.2, 6.5],
      shieldColor: '#ffb347',
      radius: 7.5,
      muzzles: [
        [4.6, 0, -5.4],
        [-4.6, 0, -5.4],
      ],
    },
    ctx,
  );
}

const DRIFT = {
  envelope: '#5e5470',
  envelopeLight: '#7a6e8e',
  dark: '#2c2636',
  metal: '#4c4658',
  band: '#b48cff',
};

/** An egg's profile for latheZ: radius along z, from tail (+z) to nose (−z). */
function egg(length: number, radius: number, n: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = u * Math.PI;
    // Fuller at the nose than the tail.
    const r = Math.sin(a) * radius * (1 - 0.18 * u);
    pts.push([Math.max(0.001, r), (0.5 - u) * length]);
  }
  return pts;
}

/** A Drifter warship: three pods banded with violet light, a gondola beneath (fiction). */
export function createDriftShip(ctx: ArtContext): ShipArt {
  const kit = new Kit(3);
  const seg = byQuality(ctx.quality, 12, 16, 22);
  const n = byQuality(ctx.quality, 8, 10, 14);
  const pods: { at: V3; length: number; radius: number }[] = [
    { at: [0, 0.6, 0], length: 13, radius: 2.6 },
    { at: [3.4, -0.4, 1.4], length: 8, radius: 1.5 },
    { at: [-3.4, -0.4, 1.4], length: 8, radius: 1.5 },
  ];
  for (const p of pods) {
    kit.add('hull', latheZ(egg(p.length, p.radius, n), seg), { position: p.at, color: DRIFT.envelope });
    // Bands of light round each pod.
    for (const f of [-0.22, 0.05, 0.3]) {
      const z = p.at[2] + f * p.length;
      const r = p.radius * Math.sin(Math.PI * (0.5 - f)) * 1.01;
      kit.add('emissive', new THREE.TorusGeometry(r, 0.07, 4, seg), {
        position: [p.at[0], p.at[1], z],
        color: DRIFT.band,
        intensity: 1.6,
      });
    }
  }
  // The struts that bind them, and the gondola beneath.
  for (const s of [-1, 1]) {
    rod(kit, 'metal', [0, 0.2, 1.8], [s * 3.2, -0.4, 1.6], 0.22, DRIFT.metal, 6);
    rod(kit, 'metal', [0, 0.2, -1.2], [s * 3.1, -0.4, -0.8], 0.18, DRIFT.metal, 6);
  }
  kit.add(
    'dark',
    loft(
      [
        {
          z: 2.5,
          pts: mirrored([
            [0, -1.9],
            [0.7, -2.2],
            [0.5, -2.9],
            [0, -3.0],
          ]),
        },
        {
          z: -1.0,
          pts: mirrored([
            [0, -1.8],
            [0.9, -2.2],
            [0.7, -3.1],
            [0, -3.3],
          ]),
        },
        {
          z: -3.5,
          pts: mirrored([
            [0, -2.0],
            [0.4, -2.3],
            [0.3, -2.7],
            [0, -2.8],
          ]),
        },
      ],
      { capStart: true, capEnd: true, baseColor: DRIFT.dark },
    ),
    { color: undefined },
  );
  kit.add('emissive', new THREE.BoxGeometry(1.2, 0.12, 0.1), {
    position: [0, -2.5, -3.4],
    color: DRIFT.band,
    intensity: 2,
  });

  return assembleShip(
    {
      name: 'drift-pods',
      kit,
      engine: {
        nozzles: [
          [0, 0.6, 6.3],
          [3.4, -0.4, 5.3],
          [-3.4, -0.4, 5.3],
        ],
        radius: 0.6,
        length: 4,
        core: '#f4ecff',
        color: '#9a6aff',
        boostCore: '#ffffff',
        boostColor: '#c8a8ff',
        cruiseColor: '#b48cff',
      },
      lights: [
        { p: [4.9, -0.4, 1.4], color: '#b48cff', size: 0.8, intensity: 1.3 },
        { p: [-4.9, -0.4, 1.4], color: '#b48cff', size: 0.8, intensity: 1.3 },
        { p: [0, 3.3, 0], color: '#e8dcff', size: 0.9, intensity: 1.6, blink: 0.3, duty: 0.25, min: 0.25 },
      ],
      shield: [6.8, 4.6, 8],
      shieldColor: '#b48cff',
      radius: 7.4,
      muzzles: [
        [0, -2.6, -3.6],
        [3.4, -0.4, -2.6],
        [-3.4, -0.4, -2.6],
      ],
    },
    ctx,
  );
}
