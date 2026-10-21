// Fails when a published piece of music has no record, or a record points at a missing file
// (docs/design/MUSIC.md §4). Runs in `npm run check` and CI; needs no keys.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { auditMusic, type MusicManifest } from './catalogue.ts';

const root = resolve(import.meta.dirname, '../..');
const manifestPath = resolve(root, 'music/manifest.json');
const manifest: MusicManifest = existsSync(manifestPath)
  ? (JSON.parse(readFileSync(manifestPath, 'utf8')) as MusicManifest)
  : { pieces: [] };
const dir = resolve(root, 'public/music');
const published = existsSync(dir)
  ? readdirSync(dir)
      .filter((f) => f.endsWith('.mp3'))
      .map((f) => `music/${f}`)
  : [];
const problems = auditMusic(manifest, published, (p) => existsSync(resolve(root, 'public', p)));
if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`music: ${manifest.pieces.length} pieces published, all recorded.`);
