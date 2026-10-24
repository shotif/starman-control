// The owner's pick for a part (docs/design/VOICES.md §3): one of its lettered candidates from the
// casting, kept in voices/cast.json and never replaced by a pick by measure.
//
//   npm run voice:pick -- sta-colonies B

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PARTS } from '../../voices/briefs.ts';
import type { CastPick } from './cast.ts';

const [partId, letter] = process.argv.slice(2);
const part = PARTS.find((p) => p.id === partId);
const i = ['A', 'B', 'C'].indexOf((letter ?? '').toUpperCase());
if (!part || i < 0) {
  console.error('Name a part and a letter: npm run voice:pick -- <part> A|B|C (parts are in voices/briefs.ts)');
  process.exit(1);
}
const file = resolve(import.meta.dirname, '../../voices/cast.json');
const cast: Record<string, CastPick> = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
const cand = part.candidates[i];
cast[part.id] = {
  letter: ['A', 'B', 'C'][i],
  voice: cand.voice,
  shape: cand.shape,
  by: 'owner',
  at: new Date().toISOString(),
  measured: cast[part.id]?.measured ?? [],
};
writeFileSync(file, `${JSON.stringify(cast, null, 2)}\n`);
console.log(`${part.who}: ${cast[part.id].letter} (${cand.voice}, shaped ${cand.shape}), the owner's pick.`);
