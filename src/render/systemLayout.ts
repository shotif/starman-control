// Where everything in a system is drawn in its 3D view (docs/design/M1_SYSTEM_VIEW.md §2, §3): the
// stars, the worlds on their orbits, moons round their planets, belts, and the habitable zone.
// Compressed, never to scale: orbits by the square root of their real size (as Starman Reborn
// lays out its systems), worlds enlarged, companion stars pushed clear of every orbit. Pure, so
// it is tested without a browser; the renderer's numbers, not the simulation's, so floats are fine.

import type { SystemId } from '../data/types.ts';
import type { Body, BodyKind } from '../sim/bodies.ts';
import { estimateStar } from '../sim/starLight.ts';
import { type StarClass, starClass } from '../sim/stars.ts';
import type { WorldSystem } from '../sim/world.ts';
import type { PlanetStyle } from './art/planets.ts';
import type { StarKind } from './art/stars.ts';

export type V3 = [number, number, number];

export interface LayoutStar {
  id: string;
  name: string;
  pos: V3;
  radius: number;
  colour: string;
  kind: StarKind;
  activity: number;
  glow: number;
  /** How far its worlds reach, centre to the outermost orbit and its moons. */
  extent: number;
}

export interface LayoutBody {
  id: string;
  name: string;
  kind: BodyKind;
  /** The star it circles. */
  star: string;
  /** For a moon, the planet it circles. */
  parent?: string;
  /** Radius of its orbit round its star (or planet). */
  orbit: number;
  /** Where on its orbit it starts, in radians. */
  phase: number;
  /** Seconds for one turn round its orbit in the view. */
  period: number;
  radius: number;
  style: PlanetStyle;
  rings?: { inner: number; outer: number };
  tilt: number;
}

export interface LayoutBelt {
  id: string;
  name: string;
  star: string;
  inner: number;
  outer: number;
}

export interface SystemLayout {
  system: SystemId;
  stars: LayoutStar[];
  bodies: LayoutBody[];
  belts: LayoutBelt[];
  /** Where water could be liquid round the first star (estimated from its light). */
  habitableZone: { inner: number; outer: number } | null;
  /** Radius that holds everything, for framing the camera. */
  extent: number;
}

/** Star looks by class, after Starman Reborn's (src/world/systems/generated.ts, STAR_LOOK). */
const STAR_LOOK: Record<StarClass, { kind: StarKind; radius: number; activity: number; glow: number }> = {
  O: { kind: 'main-sequence', radius: 6000, activity: 0.3, glow: 1 },
  B: { kind: 'main-sequence', radius: 6000, activity: 0.3, glow: 1 },
  A: { kind: 'main-sequence', radius: 5200, activity: 0.35, glow: 1.3 },
  F: { kind: 'main-sequence', radius: 4200, activity: 0.45, glow: 1 },
  G: { kind: 'main-sequence', radius: 3600, activity: 0.5, glow: 1 },
  K: { kind: 'main-sequence', radius: 2800, activity: 0.6, glow: 1 },
  M: { kind: 'red-dwarf', radius: 1100, activity: 0.6, glow: 1.2 },
  D: { kind: 'white-dwarf', radius: 170, activity: 0, glow: 3 },
  L: { kind: 'red-dwarf', radius: 800, activity: 0.3, glow: 0.8 },
  T: { kind: 'red-dwarf', radius: 700, activity: 0.2, glow: 0.6 },
  Y: { kind: 'red-dwarf', radius: 600, activity: 0.1, glow: 0.5 },
  '?': { kind: 'red-dwarf', radius: 1100, activity: 0.6, glow: 1.2 },
};

/** An orbit's radius in the view: Reborn's square-root compression. */
export function orbitUnits(au: number): number {
  return 3000 + Math.sqrt(Math.max(0, au)) * 14000;
}

/** Companion stars' separation in the view, after Reborn's: logarithmic, kept within reason. */
export function separationUnits(au: number): number {
  return Math.min(110_000, Math.max(22_000, 12_000 * Math.log2(1 + au / 5)));
}

/** Drawn radius by kind and size (1 to 12), illustrative. */
function bodyRadius(b: Body): number {
  switch (b.kind) {
    case 'gas-giant':
      return 1500 + b.size * 40;
    case 'ice-giant':
      return 1100 + b.size * 30;
    case 'mini-neptune':
      return 750 + b.size * 25;
    case 'super-earth':
      return 450 + b.size * 40;
    case 'moon':
    case 'dwarf':
      return 160 + b.size * 30;
    default:
      return 280 + b.size * 45;
  }
}

const SOL_STYLES: Partial<Record<string, PlanetStyle>> = {
  mercury: 'mercury',
  venus: 'venus',
  earth: 'earth',
  moon: 'moon',
  mars: 'mars',
  jupiter: 'jupiter',
  io: 'io',
  europa: 'europa',
  ganymede: 'ganymede',
  callisto: 'callisto',
  saturn: 'saturn',
  titan: 'titan',
  uranus: 'uranus',
  neptune: 'neptune',
};

function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/** Which of Reborn's planet looks suits a world: Sol's own, or one chosen from its kind and climate. */
export function planetStyle(b: Body): PlanetStyle {
  const sol = SOL_STYLES[b.id];
  if (sol) return sol;
  const h = hash(b.id);
  switch (b.kind) {
    case 'gas-giant':
      return h % 3 === 0 ? 'saturn' : 'exo-gas-giant';
    case 'ice-giant':
      return h % 2 === 0 ? 'uranus' : 'neptune';
    case 'mini-neptune':
      return 'neptune';
    case 'moon':
    case 'dwarf':
      if (b.water === 'ice') return h % 2 === 0 ? 'europa' : 'callisto';
      return b.temperature === 'hot' || b.temperature === 'scorching' ? 'io' : 'moon';
    default:
      if (b.atmosphere === 'toxic') return 'venus';
      if (b.temperature === 'scorching' || b.temperature === 'hot') return 'exo-scorched';
      if (b.temperature === 'temperate' && b.water === 'oceans') return 'earth';
      if (b.temperature === 'warm' || b.temperature === 'temperate') return 'exo-rocky-warm';
      return b.temperature === 'cold' && b.atmosphere === 'thin' ? 'mars' : 'exo-rocky-cold';
  }
}

/** Projected separation of two stars on the sky, in au (angle × distance), when both are placed. */
function separationAu(a: WorldSystem['sky']['stars'][number], b: WorldSystem['sky']['stars'][number]): number | null {
  if (a.raDegrees === undefined || a.decDegrees === undefined) return null;
  if (b.raDegrees === undefined || b.decDegrees === undefined) return null;
  const rad = Math.PI / 180;
  const cos =
    Math.sin(a.decDegrees * rad) * Math.sin(b.decDegrees * rad) +
    Math.cos(a.decDegrees * rad) * Math.cos(b.decDegrees * rad) * Math.cos((a.raDegrees - b.raDegrees) * rad);
  const angle = Math.acos(Math.min(1, Math.max(-1, cos)));
  const au = angle * a.distanceLy * 63_241;
  return au > 0 ? au : null;
}

export function systemLayout(system: WorldSystem, bodies: readonly Body[]): SystemLayout {
  const skyStars = system.sky.stars;
  const primary = skyStars[0];
  // Worlds by the star they circle, nearest first; moons after, by planet.
  const planets = bodies.filter((b) => !b.parent && b.kind !== 'belt');
  const minAu = Math.max(0.001, Math.min(...planets.map((b) => b.orbitMilliAu / 1000), 1));
  const out: LayoutBody[] = [];
  const belts: LayoutBelt[] = [];
  const extents = new Map<string, number>();

  for (const st of skyStars) {
    const look = STAR_LOOK[starClass(st.spectralType)];
    const mine = planets.filter((b) => b.star === st.id).sort((a, b) => a.orbitMilliAu - b.orbitMilliAu);
    let last = look.radius * 1.6;
    for (const b of mine) {
      const radius = bodyRadius(b);
      const moons = bodies.filter((m) => m.parent === b.id);
      const moonReach = moons.length > 0 ? radius * 2.2 + moons.length * 450 : 0;
      const reach = Math.max(radius * (b.kind === 'gas-giant' ? 2.4 : 1.2), moonReach);
      const orbit = Math.max(orbitUnits(b.orbitMilliAu / 1000), last + reach + 900);
      last = orbit + reach;
      const au = Math.max(minAu, b.orbitMilliAu / 1000);
      const h = hash(b.id);
      const style = planetStyle(b);
      out.push({
        id: b.id,
        name: b.name,
        kind: b.kind,
        star: st.id,
        orbit,
        phase: ((h % 3600) / 3600) * Math.PI * 2,
        period: 24 * (au / minAu) ** 1.5,
        radius,
        style,
        ...(style === 'saturn' ? { rings: { inner: radius * 1.25, outer: radius * 2.3 } } : {}),
        tilt: (((h >>> 8) % 100) / 100) * 0.5,
      });
      moons.forEach((m, i) => {
        const mr = bodyRadius(m);
        out.push({
          id: m.id,
          name: m.name,
          kind: m.kind,
          star: st.id,
          parent: b.id,
          orbit: radius * 2.2 + i * 450,
          phase: ((hash(m.id) % 3600) / 3600) * Math.PI * 2,
          period: 8 + i * 4,
          radius: mr,
          style: planetStyle(m),
          tilt: 0,
        });
      });
    }
    for (const b of bodies.filter((x) => x.kind === 'belt' && x.star === st.id)) {
      const r = Math.max(orbitUnits(b.orbitMilliAu / 1000), last + 1500);
      belts.push({ id: b.id, name: b.name, star: st.id, inner: r - 1200, outer: r + 1200 });
      last = r + 1200;
    }
    extents.set(st.id, last);
  }

  // The stars: the first at the centre; each companion clear of both stars' worlds, in its real
  // direction on the sky where the catalogue places it.
  const placed: LayoutStar[] = [];
  for (const [i, st] of skyStars.entries()) {
    const look = STAR_LOOK[starClass(st.spectralType)];
    const extent = extents.get(st.id) ?? look.radius * 2;
    const star: LayoutStar = {
      id: st.id,
      name: st.name,
      pos: [0, 0, 0],
      radius: look.radius,
      colour: st.colorHex,
      kind: look.kind,
      activity: look.activity,
      glow: look.glow,
      extent,
    };
    if (i > 0 && primary) {
      const host = placed.find((p) => p.id === st.parentId) ?? (placed[0] as LayoutStar);
      const hostSky = skyStars.find((s) => s.id === host.id) ?? primary;
      const au = separationAu(hostSky, st);
      const far = Math.max(separationUnits(au ?? 50), host.extent + extent + 8000);
      // Its direction: east-west and north-south on the sky, flattened onto the view's plane.
      let angle = ((hash(st.id) % 360) * Math.PI) / 180;
      if (au && hostSky.raDegrees !== undefined && st.raDegrees !== undefined) {
        const dRa = (st.raDegrees - hostSky.raDegrees) * Math.cos(((st.decDegrees ?? 0) * Math.PI) / 180);
        const dDec = (st.decDegrees ?? 0) - (hostSky.decDegrees ?? 0);
        if (dRa !== 0 || dDec !== 0) angle = Math.atan2(dDec, dRa);
      }
      // Clear of the stars already placed, too.
      for (let tries = 0; tries < 12; tries++) {
        const pos: V3 = [host.pos[0] + Math.cos(angle) * far, 0, host.pos[2] + Math.sin(angle) * far];
        const clash = placed.some((p) => Math.hypot(p.pos[0] - pos[0], p.pos[2] - pos[2]) < p.extent + extent + 8000);
        star.pos = pos;
        if (!clash) break;
        angle += Math.PI / 6;
      }
    }
    placed.push(star);
  }

  let hz: SystemLayout['habitableZone'] = null;
  if (primary) {
    const light = estimateStar(primary.id, primary.spectralType).luminosity;
    if (light > 0) hz = { inner: orbitUnits(Math.sqrt(light / 1.1)), outer: orbitUnits(Math.sqrt(light / 0.53)) };
  }
  const extent = Math.max(...placed.map((s) => Math.hypot(s.pos[0], s.pos[2]) + s.extent), 8000);
  return { system: system.id, stars: placed, bodies: out, belts, habitableZone: hz, extent };
}
