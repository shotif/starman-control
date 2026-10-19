// Lays out a brief's candidates side by side, each captioned with its letter and model, in one JPEG
// that is easy to look at on a phone: art/out/sheets/<brief>.jpg. The owner picks by letter.
//
//   npm run art:sheet                       # a sheet for every brief with candidates
//   npm run art:sheet -- --brief style-test-relic

import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import type { CandidateRecord } from './catalogue.ts';

const { values } = parseArgs({ options: { brief: { type: 'string' } } });
const outDir = resolve(import.meta.dirname, '../../art/out');
const sheetsDir = resolve(outDir, 'sheets');
const TILE = 480;
const CAPTION = 56;
const GAP = 12;

const briefs = values.brief
  ? [values.brief]
  : existsSync(outDir)
    ? readdirSync(outDir).filter((d) => d !== 'sheets')
    : [];
if (briefs.length === 0) {
  console.error('No candidates yet: run npm run art:generate first.');
  process.exit(1);
}
mkdirSync(sheetsDir, { recursive: true });

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

for (const brief of briefs) {
  const dir = resolve(outDir, brief);
  const pictures = readdirSync(dir).filter((f) => /\.(png|jpg|webp)$/.test(f)).sort();
  if (pictures.length === 0) continue;
  const cols = Math.min(4, pictures.length);
  const rows = Math.ceil(pictures.length / cols);
  const tiles = await Promise.all(
    pictures.map(async (file, i) => {
      const record = JSON.parse(readFileSync(resolve(dir, file.replace(/\.\w+$/, '.json')), 'utf8')) as CandidateRecord;
      const letter = String.fromCharCode(65 + i);
      const image = await sharp(resolve(dir, file)).resize(TILE, TILE, { fit: 'contain', background: '#04060b' }).toBuffer();
      const caption = Buffer.from(
        `<svg width="${TILE}" height="${CAPTION}"><rect width="100%" height="100%" fill="#0a1120"/>` +
          `<text x="12" y="36" font-family="sans-serif" font-size="26" fill="#e8eef8">` +
          `<tspan font-weight="bold" fill="#ffb45c">${letter}</tspan>  ${escapeXml(record.model)}</text></svg>`,
      );
      console.log(`${brief} ${letter}: art/out/${brief}/${file}`);
      return { image, caption, col: i % cols, row: Math.floor(i / cols) };
    }),
  );
  const width = cols * TILE + (cols + 1) * GAP;
  const height = rows * (TILE + CAPTION) + (rows + 1) * GAP;
  const composites = tiles.flatMap((t) => {
    const left = GAP + t.col * (TILE + GAP);
    const top = GAP + t.row * (TILE + CAPTION + GAP);
    return [
      { input: t.image, left, top },
      { input: t.caption, left, top: top + TILE },
    ];
  });
  const path = resolve(sheetsDir, `${brief}.jpg`);
  await sharp({ create: { width, height, channels: 3, background: '#04060b' } })
    .composite(composites)
    .jpeg({ quality: 85 })
    .toFile(path);
  console.log(`sheet: art/out/sheets/${brief}.jpg`);
}
