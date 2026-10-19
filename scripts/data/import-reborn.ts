// Copies the real sky and the old lane network from a Starman Reborn checkout (D-10) into
// src/data/sky.json: the 207 systems with their stars, known planets and belts, every value with
// its source, and Reborn's 271 lanes, which in Control are the catalogue of dark lanes (D-19).
//
//   npm run data:import -- [--from ../starman-reborn]
//
// Reborn builds its world when its modules load, so this script imports them rather than copying
// its generator: the lanes are taken exactly as Reborn's players fly them. Control keeps only the
// astronomy and the lanes; Reborn's stations, owners and stories stay in Reborn.

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { laneFingerprint } from '../../src/data/fingerprint.ts';
import type { SkyBelt, SkyDataset, SkyPlanet, SkyStar, SkySystem, SourceRef } from '../../src/data/types.ts';

const { values } = parseArgs({ options: { from: { type: 'string', default: '../starman-reborn' } } });
const root = resolve(import.meta.dirname, '../..');
const reborn = resolve(root, values.from);

const systems = await import(resolve(reborn, 'src/data/systems.ts'));
const flares = await import(resolve(reborn, 'src/content/stellar/flares.ts'));
const commit = execFileSync('git', ['-C', reborn, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();

type Measured = { value: number; unit: string; error?: number; qualifier?: string };
type RebornStar = {
  id: string;
  name: string;
  role: 'primary' | 'companion';
  parentId?: string;
  catalogIds: Record<string, string | undefined>;
  spectralType: string;
  spectralTypeSource: SourceRef;
  raDegrees: number;
  decDegrees: number;
  parallaxMas: number;
  distanceLightYears: number;
  distanceErrorLightYears?: number;
  astrometrySource: SourceRef;
  parallaxSource: SourceRef;
  positionNote?: string;
  verification: 'snapshot' | 'provisional';
  positionLy: [number, number, number];
  colorHex: string;
};

const flareNames = new Map<string, string>(
  (flares.FLARE_STARS as { star: string; variable: string }[]).map((f) => [f.star, f.variable]),
);

/** Six decimals of a light-year is about 0.06 au: far finer than any rule uses, and it keeps the file small. */
const round = (v: number, places = 6) => Number(v.toFixed(places));
const vec = (v: readonly number[]) => v.map((x) => round(x)) as [number, number, number];

const SUN: SkyStar = {
  id: 'sun',
  name: 'Sun',
  role: 'primary',
  spectralType: 'G2V',
  spectralTypeSource: { label: 'NASA: Our Sun', url: 'https://science.nasa.gov/sun/' },
  colorHex: '#fff4e0',
  catalogIds: {},
  distanceLy: 0,
  positionLy: [0, 0, 0],
  astrometrySource: { label: 'NASA: Our Sun', url: 'https://science.nasa.gov/sun/' },
  verification: 'snapshot',
};

function star(id: string): SkyStar {
  if (id === 'sun') return SUN;
  const c = systems.getComponent(id) as RebornStar | undefined;
  if (!c) throw new Error(`Reborn has no star ${id}`);
  const ids = Object.fromEntries(Object.entries(c.catalogIds).filter(([, v]) => v)) as Record<string, string>;
  const sameParallax = c.parallaxSource.url === c.astrometrySource.url;
  return {
    id: c.id,
    name: c.name,
    role: c.role,
    ...(c.parentId ? { parentId: c.parentId } : {}),
    spectralType: c.spectralType,
    spectralTypeSource: c.spectralTypeSource,
    colorHex: c.colorHex,
    catalogIds: ids,
    distanceLy: round(c.distanceLightYears, 4),
    ...(c.distanceErrorLightYears !== undefined ? { distanceErrorLy: round(c.distanceErrorLightYears, 4) } : {}),
    parallaxMas: round(c.parallaxMas, 4),
    raDegrees: round(c.raDegrees),
    decDegrees: round(c.decDegrees),
    positionLy: vec(c.positionLy),
    astrometrySource: c.astrometrySource,
    ...(sameParallax ? {} : { parallaxSource: c.parallaxSource }),
    ...(c.positionNote ? { positionNote: c.positionNote } : {}),
    verification: c.verification,
    ...(flareNames.has(c.id) ? { flareVariable: flareNames.get(c.id) } : {}),
  };
}

function planet(p: Record<string, unknown>): SkyPlanet {
  const m = (k: string) => (p[k] ? { [k]: p[k] as Measured } : {});
  return {
    id: p.id as string,
    archiveName: p.archiveName as string,
    name: p.displayName as string,
    hostId: p.hostId as string,
    status: p.status as SkyPlanet['status'],
    // Reborn's sky script (scripts/sky-process.ts) leaves the Encyclopaedia's word out of four notes
    // ("the Encyclopaedia calls it ."): drop the empty clause rather than show it.
    ...(p.statusNote ? { statusNote: (p.statusNote as string).replace('; the Encyclopaedia calls it .', '.') } : {}),
    controversial: p.controversial as boolean,
    source: { label: (p.sourceLabel as string | undefined) ?? 'NASA Exoplanet Archive', url: p.sourceUrl as string },
    asOfDate: p.asOfDate as string,
    verification: p.verification as SkyPlanet['verification'],
    ...(p.discoveryYear ? { discoveryYear: p.discoveryYear as number } : {}),
    ...(p.discoveryMethod ? { discoveryMethod: p.discoveryMethod as string } : {}),
    ...m('orbitalPeriodDays'),
    ...m('semiMajorAxisAu'),
    ...m('massEarth'),
    ...m('radiusEarth'),
    unknowns: p.unknowns as string[],
  } as SkyPlanet;
}

function belt(b: Record<string, unknown>): SkyBelt {
  return {
    id: b.id as string,
    hostId: b.hostId as string,
    name: b.name as string,
    kind: b.kind as SkyBelt['kind'],
    ...(b.innerAu !== undefined ? { innerAu: b.innerAu as number } : {}),
    ...(b.outerAu !== undefined ? { outerAu: b.outerAu as number } : {}),
    sources: b.sources as SourceRef[],
    note: b.note as string,
  };
}

const out: SkySystem[] = [];
for (const s of systems.SYSTEMS as Record<string, unknown>[]) {
  const id = s.id as string;
  const stars = (s.componentIds as string[]).map(star);
  const ref = stars.find((x) => x.role === 'primary') ?? stars[0];
  out.push({
    id,
    name: s.displayName as string,
    catalogId: s.catalogId as string,
    positionLy: vec(s.positionLy as number[]),
    distanceLy: round(s.distanceLightYears as number, 4),
    ...(ref?.distanceErrorLy !== undefined ? { distanceErrorLy: ref.distanceErrorLy } : {}),
    stars,
    planets: (s.confirmedBodies as Record<string, unknown>[]).map(planet),
    belts: (systems.beltsOf(id) as Record<string, unknown>[]).map(belt),
  });
}

const known = new Set(out.map((s) => s.id));
const lanes: [string, string][] = [];
for (const s of systems.SYSTEMS as { id: string; jumpLinks: string[] }[]) {
  for (const to of s.jumpLinks) {
    if (!known.has(to)) throw new Error(`Reborn lane ${s.id} → ${to} leaves the 207 systems`);
    if (s.id < to) lanes.push([s.id, to]);
  }
}
lanes.sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : a[0] < b[0] ? -1 : 1));

const dataset: SkyDataset = {
  format: 'starman-control-sky',
  version: 1,
  importedFrom: { repository: 'https://github.com/shotif/starman-reborn', commit },
  description:
    "The real neighbourhood out to about 27 light-years, as Starman Reborn's sky snapshot of 2026-09-30 holds it: " +
    'stars from Gaia DR3 and SIMBAD, known planets from the NASA Exoplanet Archive and the Extrasolar Planets ' +
    'Encyclopaedia, belts and debris discs from the papers SIMBAD links. Positions are Sol-centred equatorial ' +
    'Cartesian light-years at epoch J2016.0. The lanes are fiction: Reborn’s jump network, which in Control ' +
    'is the catalogue of old lanes from before the Lapse.',
  epoch: 2016,
  systems: out,
  lanes,
  laneFingerprint: laneFingerprint(lanes),
};

const path = resolve(root, 'src/data/sky.json');
writeFileSync(path, `${JSON.stringify(dataset)}\n`);
const stars = out.reduce((n, s) => n + s.stars.length, 0);
const planets = out.reduce((n, s) => n + s.planets.length, 0);
const belts = out.reduce((n, s) => n + s.belts.length, 0);
console.log(
  `sky: ${out.length} systems, ${stars} stars, ${planets} planets, ${belts} belts, ${lanes.length} lanes ` +
    `from Reborn ${commit} → src/data/sky.json`,
);
