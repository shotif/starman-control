// Renders the app's icons from public/icon.svg (`npm run icons`): the PNGs an installed app needs,
// including a maskable one with room round the edge for the device's own shape.

import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const svg = await readFile('public/icon.svg');
for (const size of [192, 512]) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(`public/icon-${size}.png`);
}
// Maskable: the art in the middle 80%, on the icon's own background.
const inner = await sharp(svg, { density: 300 }).resize(410, 410).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#04060b' } })
  .composite([{ input: inner, left: 51, top: 51 }])
  .png()
  .toFile('public/icon-maskable-512.png');
console.log('icons: public/icon-192.png, icon-512.png, icon-maskable-512.png');
