// Adds a width to every published picture of a series that lacks it, made from the largest file
// already published (the candidates are gone with their session), and records it in
// art/manifest.json. Increment 21 added 256 px buildings for the colony's still on a phone
// (M2_WORLDS.md §23.4).
//
//   npm run art:widen -- --series structure --width 256

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import type { SeriesId } from '../../art/styles.ts';
import { type Manifest, publishedPath } from './catalogue.ts';

const { values } = parseArgs({ options: { series: { type: 'string' }, width: { type: 'string' } } });
const series = values.series as SeriesId | undefined;
const width = Number(values.width);
if (!series || !Number.isInteger(width) || width < 16) {
  console.error('Name a series and a width: --series structure --width 256');
  process.exit(1);
}
const root = resolve(import.meta.dirname, '../..');
const manifestPath = resolve(root, 'art/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
let made = 0;
for (const image of manifest.images) {
  if (image.series !== series || image.files.some((f) => f.width === width)) continue;
  const largest = [...image.files].sort((a, b) => b.width - a.width)[0];
  if (!largest) continue;
  const path = publishedPath(series, image.id, width);
  const keyed = image.key !== undefined;
  const info = await sharp(resolve(root, 'public', largest.path))
    .resize({ width, withoutEnlargement: true })
    .webp(keyed ? { quality: 84, alphaQuality: 90 } : { quality: 82 })
    .toFile(resolve(root, 'public', path));
  image.files = [...image.files, { width, path, bytes: info.size }].sort((a, b) => a.width - b.width);
  made++;
}
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`widened ${made} ${series} pictures to ${width} px.`);
