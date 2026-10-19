// Fails when the briefs are malformed, a published picture has no provenance record, or a record
// points at a missing file. Runs in `npm run check` and CI; needs no keys.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { BRIEFS } from '../../art/briefs.ts';
import { auditArt, type Manifest } from './catalogue.ts';

const root = resolve(import.meta.dirname, '../..');
const publicDir = resolve(root, 'public');
const artDir = resolve(publicDir, 'art');

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [relative(publicDir, path).split('\\').join('/')];
  });
}

const manifest = JSON.parse(readFileSync(resolve(root, 'art/manifest.json'), 'utf8')) as Manifest;
const published = walk(artDir).filter((p) => !p.endsWith('.gitkeep'));
const problems = auditArt(BRIEFS, manifest, published, (p) => existsSync(resolve(publicDir, p)));

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`art: ${BRIEFS.length} briefs, ${manifest.images.length} approved pictures, all recorded.`);
