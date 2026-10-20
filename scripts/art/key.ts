// Keys a brief's candidates to transparency so they can be judged before one is approved: each
// becomes art/out/<brief>/keyed/<name>.png (a cut-out trimmed to its building, or a landscape with
// its sky taken out). art:sheet then shows the keyed versions over a checkerboard. Approval keys the
// chosen candidate the same way by itself; this is only for looking.
//
//   npm run art:key -- --brief cooperative-shipyard[,scaffold…]

import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import type { CandidateRecord } from './catalogue.ts';
import { keyedImage } from './keyImage.ts';

const { values } = parseArgs({ options: { brief: { type: 'string', multiple: true } } });
const briefs = (values.brief ?? []).flatMap((s) => s.split(','));
if (briefs.length === 0) {
  console.error('Name a brief with --brief <id>.');
  process.exit(1);
}
const outDir = resolve(import.meta.dirname, '../../art/out');

for (const brief of briefs) {
  const dir = resolve(outDir, brief);
  if (!existsSync(dir)) {
    console.error(`No candidates for ${brief}.`);
    continue;
  }
  const keyedDir = resolve(dir, 'keyed');
  mkdirSync(keyedDir, { recursive: true });
  for (const file of readdirSync(dir).filter((f) => /\.(png|jpg|webp)$/.test(f))) {
    const record = JSON.parse(readFileSync(resolve(dir, file.replace(/\.\w+$/, '.json')), 'utf8')) as CandidateRecord;
    if (!record.key) {
      console.log(`${brief}/${file}: its series is not keyed`);
      continue;
    }
    const { image, crop } = await keyedImage(resolve(dir, file), record.key);
    const name = file.replace(/\.\w+$/, '.png');
    await image.png().toFile(resolve(keyedDir, name));
    const box = crop ? ` trimmed to ${crop.width}×${crop.height} at ${crop.left},${crop.top}` : '';
    console.log(`keyed art/out/${brief}/keyed/${name} (${record.key.backdrop} ${record.key.mode})${box}`);
  }
}
