// Lays out a brief's candidates side by side, each captioned with its letter and model, in one JPEG
// that is easy to look at on a phone: art/out/sheets/<brief>.jpg. The owner picks by letter. Where
// art:key has keyed the candidates, the keyed versions are shown over a checkerboard instead, so the
// cut-out's edges can be judged; a panorama gets wider tiles.
//
//   npm run art:sheet                       # a sheet for every brief with candidates
//   npm run art:sheet -- --brief style-test-relic
//   npm run art:sheet -- --brief a,b,c --batch first-props   # one sheet for several briefs,
//                                           # each candidate captioned with its brief and letter

import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import type { CandidateRecord } from './catalogue.ts';

const { values } = parseArgs({ options: { brief: { type: 'string', multiple: true }, batch: { type: 'string' } } });
const outDir = resolve(import.meta.dirname, '../../art/out');
const sheetsDir = resolve(outDir, 'sheets');
const CAPTION = 56;
const GAP = 12;

const briefs = values.brief
  ? values.brief.flatMap((b) => b.split(','))
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

const checkerFor = (w: number, h: number) =>
  sharp(
    Buffer.from(
      `<svg width="${w}" height="${h}"><defs><pattern id="c" width="32" height="32" patternUnits="userSpaceOnUse">` +
        `<rect width="32" height="32" fill="#5d6470"/><rect width="16" height="16" fill="#8a919c"/>` +
        `<rect x="16" y="16" width="16" height="16" fill="#8a919c"/></pattern></defs>` +
        `<rect width="100%" height="100%" fill="url(#c)"/></svg>`,
    ),
  )
    .png()
    .toBuffer();

function candidatesOf(brief: string): string[] {
  const dir = resolve(outDir, brief);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.(png|jpg|webp)$/.test(f))
    .sort();
}

/** One candidate as a tile: keyed over a checkerboard where art:key has keyed it. */
async function tileImage(brief: string, file: string, w: number, h: number): Promise<Buffer> {
  const dir = resolve(outDir, brief);
  const keyed = resolve(dir, 'keyed', file.replace(/\.\w+$/, '.png'));
  if (!existsSync(keyed))
    return sharp(resolve(dir, file)).resize(w, h, { fit: 'contain', background: '#04060b' }).toBuffer();
  return sharp(await checkerFor(w, h))
    .composite([
      {
        input: await sharp(keyed)
          .resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer(),
      },
    ])
    .png()
    .toBuffer();
}

function captionImage(w: number, letter: string, text: string): Buffer {
  return Buffer.from(
    `<svg width="${w}" height="${CAPTION}"><rect width="100%" height="100%" fill="#0a1120"/>` +
      `<text x="12" y="36" font-family="sans-serif" font-size="${text.length > 22 ? 20 : 26}" fill="#e8eef8">` +
      `<tspan font-weight="bold" fill="#ffb45c">${letter}</tspan>  ${escapeXml(text)}</text></svg>`,
  );
}

// Several briefs on one sheet: each candidate captioned with its brief, lettered within it.
if (values.batch) {
  const TILE = 400;
  const cols = 4;
  const tiles: { image: Buffer; caption: Buffer }[] = [];
  for (const brief of briefs) {
    const files = candidatesOf(brief);
    for (const [i, file] of files.entries()) {
      const letter = String.fromCharCode(65 + i);
      tiles.push({ image: await tileImage(brief, file, TILE, TILE), caption: captionImage(TILE, letter, brief) });
      console.log(`${brief} ${letter}: art/out/${brief}/${file}`);
    }
  }
  const rows = Math.ceil(tiles.length / cols);
  const width = cols * TILE + (cols + 1) * GAP;
  const height = rows * (TILE + CAPTION) + (rows + 1) * GAP;
  const composites = tiles.flatMap((t, i) => {
    const left = GAP + (i % cols) * (TILE + GAP);
    const top = GAP + Math.floor(i / cols) * (TILE + CAPTION + GAP);
    return [
      { input: t.image, left, top },
      { input: t.caption, left, top: top + TILE },
    ];
  });
  const path = resolve(sheetsDir, `${values.batch}.jpg`);
  await sharp({ create: { width, height, channels: 3, background: '#04060b' } })
    .composite(composites)
    .jpeg({ quality: 84 })
    .toFile(path);
  console.log(`sheet: art/out/sheets/${values.batch}.jpg`);
  process.exit(0);
}

for (const brief of briefs) {
  const dir = resolve(outDir, brief);
  const pictures = readdirSync(dir)
    .filter((f) => /\.(png|jpg|webp)$/.test(f))
    .sort();
  if (pictures.length === 0) continue;
  const first = await sharp(resolve(dir, pictures[0] ?? '')).metadata();
  const wide = (first.width ?? 1) / (first.height ?? 1) > 1.8;
  const TILE = wide ? 960 : 480;
  const TILE_H = wide ? Math.round((TILE * (first.height ?? 1)) / (first.width ?? 1)) : 480;
  const cols = Math.min(wide ? 2 : 4, pictures.length);
  const rows = Math.ceil(pictures.length / cols);
  const checker = await sharp(
    Buffer.from(
      `<svg width="${TILE}" height="${TILE_H}"><defs><pattern id="c" width="32" height="32" patternUnits="userSpaceOnUse">` +
        `<rect width="32" height="32" fill="#5d6470"/><rect width="16" height="16" fill="#8a919c"/>` +
        `<rect x="16" y="16" width="16" height="16" fill="#8a919c"/></pattern></defs>` +
        `<rect width="100%" height="100%" fill="url(#c)"/></svg>`,
    ),
  )
    .png()
    .toBuffer();
  const tiles = await Promise.all(
    pictures.map(async (file, i) => {
      const record = JSON.parse(readFileSync(resolve(dir, file.replace(/\.\w+$/, '.json')), 'utf8')) as CandidateRecord;
      const letter = String.fromCharCode(65 + i);
      const keyed = resolve(dir, 'keyed', file.replace(/\.\w+$/, '.png'));
      const image = existsSync(keyed)
        ? await sharp(checker)
            .composite([
              {
                input: await sharp(keyed)
                  .resize(TILE, TILE_H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                  .png()
                  .toBuffer(),
              },
            ])
            .png()
            .toBuffer()
        : await sharp(resolve(dir, file)).resize(TILE, TILE_H, { fit: 'contain', background: '#04060b' }).toBuffer();
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
  const height = rows * (TILE_H + CAPTION) + (rows + 1) * GAP;
  const composites = tiles.flatMap((t) => {
    const left = GAP + t.col * (TILE + GAP);
    const top = GAP + t.row * (TILE_H + CAPTION + GAP);
    return [
      { input: t.image, left, top },
      { input: t.caption, left, top: top + TILE_H },
    ];
  });
  const path = resolve(sheetsDir, `${brief}.jpg`);
  await sharp({ create: { width, height, channels: 3, background: '#04060b' } })
    .composite(composites)
    .jpeg({ quality: 85 })
    .toFile(path);
  console.log(`sheet: art/out/sheets/${brief}.jpg`);
}
