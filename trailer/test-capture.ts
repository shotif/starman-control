// The 10-second test capture (docs/design/TRAILER.md §10.3): the neighbourhood turning in 3D (S01)
// and the battle at Sol replayed (S13), frame-stepped, beside a measure of what capturing in real
// time gives on this machine.
//
//   npm run build && npx vite preview --port 4173 &   then   node trailer/test-capture.ts

import { resolve } from 'node:path';
import { ffmpeg } from '../scripts/media.ts';
import { stateDir } from './games.ts';
import { CLEAN, film, NO_CURSOR, newGame, OUT, open, settle, style } from './harness.ts';

const s = await open();
const { page, cdp } = s;

// S01: the whole neighbourhood in 3D, panels hidden, names faint, turning and pulling back slowly.
await page.goto('http://localhost:4173/?test#/map');
await page.locator('[data-ready="1"]').waitFor({ timeout: 60_000 });
await style(page, `${CLEAN}${NO_CURSOR}.map-labels{opacity:.55}`);
await page.evaluate(() => {
  const m = (window as unknown as { __map: { setMode(m: string): void; showAll(): void } }).__map;
  m.setMode('3d');
  m.showAll();
});
await page.waitForTimeout(2500);

// What real time gives: the frames Chromium sends while the map turns on its own clock.
const stamps: number[] = [];
cdp.on('Page.screencastFrame', (f) => {
  stamps.push(f.metadata.timestamp ?? 0);
  void cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId });
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 80, everyNthFrame: 1 });
const spin = setInterval(() => {
  void page.evaluate(() =>
    (window as unknown as { __map: { rotateBy(y: number, p: number): void } }).__map.rotateBy(0.02, 0),
  );
}, 250);
await page.waitForTimeout(5000);
clearInterval(spin);
await cdp.send('Page.stopScreencast');
const gaps = stamps.slice(1).map((t, i) => (t - (stamps[i] ?? t)) * 1000);
const mean = gaps.reduce((n, g) => n + g, 0) / Math.max(1, gaps.length);
const worst = Math.max(...gaps);
const late = gaps.filter((g) => g > 25).length;
console.log(
  `real time: ${stamps.length} frames in 5 s (${(stamps.length / 5).toFixed(1)} a second), mean gap ${mean.toFixed(1)} ms, worst ${worst.toFixed(0)} ms, ${late} gaps over 25 ms`,
);

const s01 = await film(
  s,
  'test-S01',
  10,
  `(i, n) => { const m = window.__map; m.rotateBy(0.0011, 0.00008); m.zoomBy(1.0003); }`,
);
console.log(`S01 frame-stepped: ${s01.frames} frames in ${(s01.ms / 1000).toFixed(0)} s`);

// S13: the battle at Sol replayed, the camera brought in on the fighting.
await newGame(page, 'Lead the Transit Authority', 7, resolve(stateDir('sta', 7), 'battle-106.json'));
await page.keyboard.press('r');
await page.getByRole('button', { name: 'Watch the battle at Sol' }).click();
await page.waitForFunction(() => (window as unknown as { __replay?: unknown }).__replay, null, { timeout: 30_000 });
await style(page, NO_CURSOR);
await page.evaluate(() => {
  const r = (window as unknown as { __replay: { controller: { zoom(f: number): void } } }).__replay;
  r.controller.zoom(0.6);
});
await settle(page, 0.5);
const s13 = await film(s, 'test-S13', 8);
console.log(`S13 frame-stepped: ${s13.frames} frames in ${(s13.ms / 1000).toFixed(0)} s`);
await s.browser.close();

// One file to look at, smaller for sending.
const list = resolve(OUT, 'shots/test-list.txt');
const { writeFileSync } = await import('node:fs');
writeFileSync(list, `file '${s01.file}'\nfile '${s13.file}'\n`);
const preview = resolve(OUT, 'starman-control-test-capture.mp4');
ffmpeg([
  '-y',
  '-f',
  'concat',
  '-safe',
  '0',
  '-i',
  list,
  '-c:v',
  'libx264',
  '-crf',
  '20',
  '-preset',
  'slow',
  '-pix_fmt',
  'yuv420p',
  '-movflags',
  '+faststart',
  preview,
]);
console.log(preview);
