// Reads the shell, every real system between the census of 27 ly and 33 ly, from a copy of
// Starman Reborn whose sky snapshot was fetched with the shell's limits (prepare-shell.ts), into
// src/data/shell.json (M3_NEIGHBOURS.md §18, D-51):
//
//   npm run data:shell -- --from <copy>
//
// The census (src/data/sky.json) is left as it is, with its lanes: a game saved before the shell
// finds every one of its systems as it was. A Reborn system that shares a star with the census is
// left out and listed with its reason. No lane reaches the shell.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import type { ShellDataset, SkyDataset, SkyStar, SkySystem } from '../../src/data/types.ts';
import { SHELL_CHANGES } from './prepare-shell.ts';
import { readReborn } from './rebornSky.ts';

const { values } = parseArgs({ options: { from: { type: 'string' } } });
if (!values.from) throw new Error('Say where the copy of Reborn is: --from <copy>');
const root = resolve(import.meta.dirname, '../..');
const copy = resolve(root, values.from);

const census = JSON.parse(readFileSync(resolve(root, 'src/data/sky.json'), 'utf8')) as SkyDataset;
const { commit, systems } = await readReborn(copy);

// The snapshot the copy was built from: its day, its parallax floor and what was asked again.
const rawRoot = resolve(copy, 'data/snapshot/raw');
const day = readdirSync(rawRoot)
  .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
  .sort()
  .at(-1);
if (!day) throw new Error(`No snapshot in ${rawRoot}`);
const manifest = JSON.parse(readFileSync(resolve(rawRoot, day, 'manifest.json'), 'utf8')) as {
  retrieved: string;
  neighbourhoodParallaxMas: number;
  queries: { label: string; ok: boolean; note?: string }[];
};
const floor = manifest.neighbourhoodParallaxMas;
if (floor >= 120)
  throw new Error(`The copy asked for parallaxes of ${floor} mas and more: that is the census, not the shell`);

/** Every name a catalogue gives a star, so the same star is known under any of them. */
const names = (s: SkyStar) => Object.values(s.catalogIds).map((v) => v.replace(/\s+/g, ' ').trim().toLowerCase());
const censusStar = new Map<string, { star: SkyStar; system: SkySystem }>();
for (const system of census.systems)
  for (const star of system.stars) for (const n of names(star)) censusStar.set(n, { star, system });
const censusIds = new Set(census.systems.map((s) => s.id));
const takenStars = new Set(census.systems.flatMap((s) => s.stars.map((x) => x.id)));
const takenPlanets = new Set(census.systems.flatMap((s) => s.planets.map((x) => x.id)));

const leftOut: ShellDataset['leftOut'] = [];
const out: SkySystem[] = [];
for (const s of systems) {
  if (censusIds.has(s.id)) continue;
  const shared = s.stars.flatMap((star) => names(star).map((n) => censusStar.get(n))).find((x) => x !== undefined);
  if (shared) {
    leftOut.push({
      id: s.id,
      name: s.name,
      reason: `it shares ${shared.star.name} with the census's ${shared.system.name}, which saved games know as it is`,
    });
    continue;
  }
  if (s.stars.every((star) => (star.parallaxMas ?? 0) < floor)) {
    leftOut.push({ id: s.id, name: s.name, reason: `no star with a parallax of ${floor} mas or more` });
    continue;
  }
  for (const star of s.stars) if (takenStars.has(star.id)) throw new Error(`Star ${star.id} is in the census already`);
  for (const p of s.planets) if (takenPlanets.has(p.id)) throw new Error(`Planet ${p.id} is in the census already`);
  out.push({ ...s, shell: true });
}
out.sort((a, b) => a.distanceLy - b.distanceLy || (a.id < b.id ? -1 : 1));

const shell: ShellDataset = {
  format: 'starman-control-shell',
  version: 1,
  importedFrom: {
    repository: census.importedFrom.repository,
    commit,
    changes: [
      ...SHELL_CHANGES.map((c) => c.why),
      ...manifest.queries.filter((q) => q.note).map((q) => `${q.label}: ${q.note}`),
    ],
  },
  retrieved: manifest.retrieved,
  parallaxFloorMas: floor,
  description:
    `The real neighbourhood beyond the census, out to about 33 light-years (a parallax of ${floor} mas or more), ` +
    `as the archives answered on ${manifest.retrieved} through Starman Reborn's sky pipeline, run on a copy with the ` +
    "shell's limits: stars from Gaia DR3 and SIMBAD, known planets from the NASA Exoplanet Archive and the " +
    'Extrasolar Planets Encyclopaedia, belts and debris discs from the papers SIMBAD links. Positions are ' +
    'Sol-centred equatorial Cartesian light-years at epoch J2016.0. No old lane reaches it.',
  leftOut,
  systems: out,
};

writeFileSync(resolve(root, 'src/data/shell.json'), `${JSON.stringify(shell)}\n`);
const stars = out.reduce((n, s) => n + s.stars.length, 0);
const planets = out.reduce((n, s) => n + s.planets.length, 0);
const belts = out.reduce((n, s) => n + s.belts.length, 0);
console.log(
  `shell: ${out.length} systems, ${stars} stars, ${planets} planets, ${belts} belts, ${leftOut.length} left out, ` +
    `asked ${manifest.retrieved}, from Reborn ${commit} with the shell's limits → src/data/shell.json`,
);
for (const l of leftOut) console.log(`  left out: ${l.name}: ${l.reason}`);
