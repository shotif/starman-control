// Puts a reviewed candidate into the game: converts it to WebP at the series' widths (the smallest
// for phones) under public/art/, and records where it came from in art/manifest.json.
//
//   npm run art:approve -- art/out/style-test-relic/20261019-153000-openai-1.png

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

const root = resolve(import.meta.dirname, '../..');
const candidateArg = process.argv[2];
if (!candidateArg) {
  console.error('Name the candidate picture to approve, e.g. art/out/<brief>/<file>.png');
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

for (const width of series.widths) {
  const path = publishedPath(brief.series, brief.id, width);
  const out = resolve(root, 'public', path);
  mkdirSync(dirname(out), { recursive: true });
  const info = await sharp(candidate).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
  files.push({ width, path, bytes: info.size });
  console.log(`wrote public/${path} (${Math.round(info.size / 1024)} KB)`);
}

const manifestPath = resolve(root, 'art/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
const next = upsertEntry(manifest, {
  ...record,
  id: brief.id,
  series: brief.series,
  approvedAt: new Date().toISOString(),
  candidate: relative(root, candidate),
  files,
  aiGenerated: true,
});
writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`);
console.log(`recorded ${brief.id} in art/manifest.json`);
