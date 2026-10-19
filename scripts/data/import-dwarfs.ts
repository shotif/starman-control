// Copies the mean dwarf star sequence of Pecaut & Mamajek (2013) into src/data/dwarfs.json, so each
// star's light and temperature can be estimated from its spectral type (docs/design/M1_PLANETS.md §2).
//
//   npm run data:import-dwarfs -- [--file EEM_dwarf_UBVIJHK_colors_Teff.txt]
//
// Without --file it downloads the table. Luminosities are worked out here, at build time, and
// stored as numbers, so the game never computes a power while playing.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const URL = 'https://www.pas.rochester.edu/~emamajek/EEM_dwarf_UBVIJHK_colors_Teff.txt';
const { values } = parseArgs({ options: { file: { type: 'string' } } });

const text = values.file ? readFileSync(values.file, 'utf8') : await (await fetch(URL)).text();
const version = /Version\s+([0-9.]+)/.exec(text)?.[1];
if (!version) throw new Error('This does not look like the dwarf table: no version line');

const lines = text.split('\n');
const header = lines.findIndex((l) => l.startsWith('#SpT'));
const cols = (lines[header] as string).replace(/^#/, '').trim().split(/\s+/);
const at = (name: string) => cols.indexOf(name);
const [iT, iTeff, iLogL, iR, iM] = [at('SpT'), at('Teff'), at('logL'), at('R_Rsun'), at('Msun')];

interface Row {
  type: string;
  teffK: number;
  luminosity: number;
  radius: number | null;
  mass: number | null;
}

const rows: Row[] = [];
for (const line of lines.slice(header + 1)) {
  if (line.startsWith('#') || line.trim() === '') break;
  const f = line.trim().split(/\s+/);
  // Missing values are written as dots ("...."), so a number must have a digit.
  const num = (i: number) => (f[i] && /^-?[0-9]*\.?[0-9]+$/.test(f[i] as string) ? Number(f[i]) : null);
  const logL = num(iLogL);
  const teff = num(iTeff);
  if (logL === null || teff === null) continue;
  rows.push({
    type: f[iT] as string,
    teffK: teff,
    luminosity: Number((10 ** logL).toPrecision(4)),
    radius: num(iR),
    mass: num(iM),
  });
}

const out = {
  source: {
    label: 'Pecaut & Mamajek 2013, a modern mean dwarf stellar color and effective temperature sequence (ApJS 208, 9)',
    url: 'https://ui.adsabs.harvard.edu/abs/2013ApJS..208....9P',
    bibcode: '2013ApJS..208....9P',
    table: URL,
    version,
  },
  description:
    'Mean main-sequence (dwarf) stars by spectral type: effective temperature (K), luminosity, radius and mass ' +
    '(solar units). Luminosity is 10^logL from the table, to four figures. Rows without a luminosity are left out.',
  rows,
};

const path = resolve(import.meta.dirname, '../../src/data/dwarfs.json');
writeFileSync(path, `${JSON.stringify(out, null, 1)}\n`);
console.log(`dwarfs: ${rows.length} spectral types from ${rows[0]?.type} to ${rows.at(-1)?.type}, version ${version}`);
