// Fails when a clip the game can play is missing or out of date, a record points at a missing file, or
// a published clip has no record (docs/design/VOICES.md §4). Runs in `npm run check` and CI; needs no
// keys.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { auditVoices, type VoiceManifest } from './catalogue.ts';

const root = resolve(import.meta.dirname, '../..');
const manifestPath = resolve(root, 'voices/manifest.json');
const manifest: VoiceManifest = existsSync(manifestPath)
  ? (JSON.parse(readFileSync(manifestPath, 'utf8')) as VoiceManifest)
  : { clips: [] };
const dir = resolve(root, 'public/voice');
const published = existsSync(dir)
  ? readdirSync(dir, { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.mp3'))
      .map((f) => `voice/${f.split('\\').join('/')}`)
  : [];
const problems = auditVoices(manifest, published, (p) => existsSync(resolve(root, 'public', p)));
if (problems.length > 0) {
  console.error(problems.slice(0, 20).join('\n'));
  if (problems.length > 20) console.error(`… and ${problems.length - 20} more.`);
  process.exit(1);
}
console.log(`voices: ${manifest.clips.length} clips published, all recorded and up to date.`);
