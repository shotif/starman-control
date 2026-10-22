// Makes a copy of Starman Reborn whose sky pipeline reaches the shell out to 33 light-years
// (M3_NEIGHBOURS.md §18, D-51). Reborn itself is not changed: its census stays at 27 ly. Then, in
// the copy, the archives are asked and the answers built into Reborn's dataset, and
// `npm run data:shell` reads the shell from it:
//
//   node scripts/data/prepare-shell.ts --to <copy> [--from ../starman-reborn]
//   cd <copy> && npm ci && NODE_USE_ENV_PROXY=1 npm run data:fetch
//   node scripts/sky-process.ts && node scripts/build-dataset.ts
//   cd - && npm run data:shell -- --from <copy>
//
// The fetch needs the archives: GitHub's runners reach them (D-51), and so may a container.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

/** What is changed in the copy, each said in words for the shell's record. */
export const SHELL_CHANGES: { file: string; from: string; to: string; why: string }[] = [
  {
    file: 'scripts/sky-fetch.ts',
    from: 'const NEIGHBOURHOOD_PLX = 120;',
    to: 'const NEIGHBOURHOOD_PLX = 99;',
    why: 'SIMBAD and Hipparcos asked for every star with a parallax of at least 99 mas (about 32.9 ly), not 120',
  },
  {
    file: 'scripts/sky-fetch.ts',
    from: 'const PLANET_DIST_PC = 8.3;',
    to: 'const PLANET_DIST_PC = 10.2;',
    why: 'the NASA Exoplanet Archive asked for every confirmed planet within 10.2 pc, not 8.3',
  },
  {
    file: 'scripts/sky-fetch.ts',
    from: 'const ENCYCLOPAEDIA_DIST_PC = 8.4;',
    to: 'const ENCYCLOPAEDIA_DIST_PC = 10.3;',
    why: 'the Extrasolar Planets Encyclopaedia asked for every planet within 10.3 pc, not 8.4',
  },
  {
    file: 'scripts/sky-fetch.ts',
    from: "if (s.catalogIds.gaiaDr3) gaiaIds.add(s.catalogIds.gaiaDr3.replace(/\\D/g, ''));",
    to: "if (s.catalogIds.gaiaDr3) gaiaIds.add(s.catalogIds.gaiaDr3.replace(/^Gaia DR3\\s*/, '').replace(/\\D/g, ''));",
    why: 'a Gaia DR3 identifier read without its words: three had kept the 3 of "DR3", 20 digits that no Gaia source has, and made Gaia time out',
  },
  {
    file: 'scripts/sky-process.ts',
    from: `.replace(/([[,:]\\s*)(-?\\d{16,})(?=\\s*[,\\]}])/g, '$1"$2"'))`,
    to: `.replace(/([[,:]\\s*)(-?\\d{16,})(?=\\s*[,\\]}])/g, '$1"$2"').replace(/([[,:]\\s*)(-?Infinity|NaN)(?=\\s*[,\\]}])/g, '$1null'))`,
    why: 'an answer holding Infinity or NaN, which are not JSON, read with no value there',
  },
];

if (import.meta.main) {
  const { values } = parseArgs({
    options: { from: { type: 'string', default: '../starman-reborn' }, to: { type: 'string' } },
  });
  if (!values.to) throw new Error('Say where the copy goes: --to <dir>');
  const root = resolve(import.meta.dirname, '../..');
  const to = resolve(root, values.to);
  execFileSync('git', ['clone', '--quiet', resolve(root, values.from), to], { stdio: 'inherit' });
  for (const c of SHELL_CHANGES) {
    const path = resolve(to, c.file);
    const text = readFileSync(path, 'utf8');
    if (text.split(c.from).length !== 2) throw new Error(`${c.file}: expected "${c.from}" once`);
    writeFileSync(path, text.replace(c.from, c.to));
  }
  console.log(`A copy of Reborn with the shell's limits is at ${to}.`);
}
