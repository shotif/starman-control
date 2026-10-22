// Copies the real sky and the old lane network from a Starman Reborn checkout (D-10) into
// src/data/sky.json: the 207 systems with their stars, known planets and belts, every value with
// its source, and Reborn's 271 lanes, which in Control are the catalogue of dark lanes (D-19).
//
//   npm run data:import -- [--from ../starman-reborn]
//
// Reborn builds its world when its modules load, so this script imports them rather than copying
// its generator: the lanes are taken exactly as Reborn's players fly them. Control keeps only the
// astronomy and the lanes; Reborn's stations, owners and stories stay in Reborn.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { laneFingerprint } from '../../src/data/fingerprint.ts';
import type { SkyDataset } from '../../src/data/types.ts';
import { readReborn } from './rebornSky.ts';

const { values } = parseArgs({ options: { from: { type: 'string', default: '../starman-reborn' } } });
const root = resolve(import.meta.dirname, '../..');
const reborn = resolve(root, values.from);
const { commit, systems: out, links } = await readReborn(reborn);

const known = new Set(out.map((s) => s.id));
const lanes: [string, string][] = [];
for (const [id, jumpLinks] of links) {
  for (const to of jumpLinks) {
    if (!known.has(to)) throw new Error(`Reborn lane ${id} → ${to} leaves the 207 systems`);
    if (id < to) lanes.push([id, to]);
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
