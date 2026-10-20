// Puts a reviewed candidate into the game: converts it to WebP at the series' widths (the smallest
// for phones) under public/art/, and records where it came from in art/manifest.json.
//
//   npm run art:approve -- art/out/style-test-relic/20261019-153000-openai-1.png
//
// A candidate painted on a flat backdrop (a landscape or a building) is keyed to transparency first
// (scripts/art/keying.ts), and the keying is recorded with the picture.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import sharp from 'sharp';
import { SERIES } from '../../art/styles.ts';
import {
  type CandidateRecord,
  findBrief,
  type Manifest,
  type ManifestFile,
  publishedPath,
  upsertEntry,
} from './catalogue.ts';
import { keyedImage } from './keyImage.ts';
import { keyRecord } from './keying.ts';

const root = resolve(import.meta.dirname, '../..');
const candidateArg = process.argv[2];
if (!candidateArg) {
  console.error('Name the candidate picture to approve, e.g. art/out/<brief>/<file>.jpg');
  process.exit(1);
}
const candidate = resolve(root, candidateArg);
const recordPath = candidate.replace(/\.(png|jpg|webp)$/, '.json');
if (!existsSync(candidate) || !existsSync(recordPath)) {
  console.error(`Need both the picture and its .json record: ${candidateArg}`);
  process.exit(1);
}

const record = JSON.parse(readFileSync(recordPath, 'utf8')) as CandidateRecord;
const brief = findBrief(record.briefId);
const series = SERIES[brief.series];
const files: ManifestFile[] = [];
const keying = record.key ?? series.key;
const keyed = keying ? await keyedImage(candidate, keying) : null;
const source = keyed ? await keyed.image.png().toBuffer() : candidate;

for (const width of series.widths) {
  const path = publishedPath(brief.series, brief.id, width);
  const out = resolve(root, 'public', path);
  mkdirSync(dirname(out), { recursive: true });
  // A prop is published to fit a square, so a tall mast is no heavier than a wide solar field.
  const fit = brief.series === 'prop' ? { width, height: width, fit: 'inside' as const } : { width };
  const info = await sharp(source)
    .resize({ ...fit, withoutEnlargement: true })
    .webp(keyed ? { quality: 84, alphaQuality: 90 } : { quality: 82 })
    .toFile(out);
  files.push({ width, path, bytes: info.size });
  console.log(`wrote public/${path} (${Math.round(info.size / 1024)} KB)`);
}

const manifestPath = resolve(root, 'art/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
const { key: _painted, ...made } = record;
const next = upsertEntry(manifest, {
  ...made,
  id: brief.id,
  series: brief.series,
  approvedAt: new Date().toISOString(),
  candidate: relative(root, candidate),
  files,
  ...(keying ? { key: keyRecord(keying) } : {}),
  ...(keyed?.crop ? { crop: keyed.crop } : {}),
  aiGenerated: true,
});
writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`);
console.log(`recorded ${brief.id} in art/manifest.json`);
