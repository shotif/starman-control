// The capture harness (docs/design/TRAILER.md §10.3): the build in Playwright's Chromium on the
// machine's GPU, on a virtual clock, filmed one whole frame at a time into ffmpeg. Adapted from
// Starman Reborn's promo/lib/harness.mjs at 523bcd7 (D-10). Nothing in the game changes for it: the
// capture-only parts are the init scripts here (the clock, the settings) and style sheets a shot
// adds (hiding panels).
//
// The clock: once started, requestAnimationFrame and performance.now move only when a frame is
// stepped, and the page's CSS animations (the turn's sweep, the logotype's pass of light) are held
// and stepped with it, so every frame is whole and evenly spaced however long each takes to capture.

import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { type Browser, type CDPSession, chromium, type Page } from '@playwright/test';
import { FFMPEG } from '../scripts/media.ts';

export const OUT = resolve(import.meta.dirname, 'out');
export const SHOTS = resolve(OUT, 'shots');
export const FPS = 60;
/** The game's window in CSS pixels, drawn at 1.5×: 1920×1080 with the interface large enough to read in a small player. */
export const WINDOW = { width: 1280, height: 720 };
export const SCALE = 1.5;
/** The film's frame. */
export const OUTPUT = { width: 1920, height: 1080 };
export const BASE = process.env.TRAILER_BASE ?? 'http://localhost:4173/';

/** The virtual clock, as an init script. */
function virtualClock(): void {
  const realRaf = window.requestAnimationFrame.bind(window);
  const realNow = performance.now.bind(performance);
  const realCancel = window.cancelAnimationFrame.bind(window);
  const vt = { on: false, now: 0, q: new Map<number, FrameRequestCallback>(), id: 1e6 };
  const waiting = new Map<number, FrameRequestCallback>();
  const held = new WeakSet<Animation>();
  const w = window as unknown as Record<string, unknown>;
  performance.now = () => (vt.on ? vt.now : realNow());
  window.requestAnimationFrame = (cb) => {
    if (vt.on) {
      const id = ++vt.id;
      vt.q.set(id, cb);
      return id;
    }
    const id = realRaf((t) => {
      waiting.delete(id);
      cb(t);
    });
    waiting.set(id, cb);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    vt.q.delete(id);
    waiting.delete(id);
    realCancel(id);
  };
  w.__vtStart = () => {
    if (vt.on) return;
    vt.now = realNow();
    vt.on = true;
    for (const [id, cb] of waiting) {
      realCancel(id);
      vt.q.set(++vt.id, cb);
    }
    waiting.clear();
  };
  w.__vtStep = (ms: number) => {
    vt.now += ms;
    const cbs = [...vt.q.values()];
    vt.q.clear();
    for (const cb of cbs) cb(vt.now);
    // CSS animations: held where they are when first seen, then moved on with the clock.
    for (const a of document.getAnimations()) {
      if (!held.has(a)) {
        held.add(a);
        a.pause();
      } else a.currentTime = Number(a.currentTime ?? 0) + ms;
    }
    return vt.now;
  };
}

export interface Session {
  browser: Browser;
  page: Page;
  cdp: CDPSession;
}

/** The browser and the game's page: high quality, every sound off (the trailer's sound is mixed apart). */
export async function open(): Promise<Session> {
  const gpu =
    process.platform === 'darwin'
      ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']
      : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  const browser = await chromium.launch({
    headless: true,
    args: [...gpu, '--force-color-profile=srgb', '--hide-scrollbars'],
  });
  const context = await browser.newContext({ viewport: WINDOW, deviceScaleFactor: SCALE });
  await context.addInitScript(() => {
    try {
      localStorage.setItem(
        'starman-control:settings',
        JSON.stringify({ quality: 'high', sound: 'off', music: 'off', voices: 'off', guide: 'off' }),
      );
    } catch {
      // about:blank has no storage.
    }
  });
  await context.addInitScript(virtualClock);
  const page = await context.newPage();
  page.on('pageerror', (e) => console.warn(`  page error: ${e.message}`));
  const cdp = await context.newCDPSession(page);
  return { browser, page, cdp };
}

/** A new game as a power, with a seed; then, if named, a staged state put into play. */
export async function newGame(page: Page, power: string, seed: number, state?: string): Promise<void> {
  await page.goto('about:blank');
  await page.goto(`${BASE}?test#/new`);
  await page.getByText('More').click();
  await page.getByLabel(/Seed/).fill(String(seed));
  await page.getByRole('button', { name: power }).click();
  await page.locator('[data-ready="1"]').waitFor({ timeout: 60_000 });
  if (state) await setState(page, state);
}

export async function setState(page: Page, file: string): Promise<void> {
  const json = readFileSync(file, 'utf8');
  await page.evaluate((s) => (window as unknown as { __setGame(g: unknown): void }).__setGame(JSON.parse(s)), json);
  await page.waitForTimeout(800);
}

/** A capture-only style sheet. */
export async function style(page: Page, css: string): Promise<void> {
  await page.addStyleTag({ content: css });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
}

/** The map's panels and bars hidden, the map over the whole frame: for the cinematic shots. */
export const CLEAN =
  '.outliner,.map-inspector,.map-top,.colony-bar,.map-credit,.map-dock{display:none!important}' +
  '.map-host{position:fixed!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important}';
/** No pointer anywhere. */
export const NO_CURSOR = '*{cursor:none!important}';

/** Starts the virtual clock: from here the game moves only when a frame is stepped. */
export async function freeze(page: Page): Promise<void> {
  await page.evaluate(() => (window as unknown as { __vtStart(): void }).__vtStart());
}

/** Moves the game on without filming, a frame at a time. */
export async function settle(page: Page, seconds: number): Promise<void> {
  await freeze(page);
  await page.evaluate(
    ([n, ms]) => {
      const step = (window as unknown as { __vtStep(ms: number): number }).__vtStep;
      for (let i = 0; i < n; i++) step(ms);
    },
    [Math.round(seconds * FPS), 1000 / FPS],
  );
}

/**
 * Films `seconds` of a shot at 60 frames a second into trailer/out/shots/<name>.mp4 (nearly
 * lossless). `each` is a function's source run in the page before every frame is stepped, given the
 * frame's number and the shot's frame count: the camera's move.
 */
export async function film(
  s: Session,
  name: string,
  seconds: number,
  each?: string,
  /** Run outside the page before a frame is stepped (a key, a click, a wait while the clock is held). */
  onFrame?: (frame: number) => Promise<void>,
): Promise<{ file: string; frames: number; ms: number }> {
  mkdirSync(SHOTS, { recursive: true });
  const file = resolve(SHOTS, `${name}.mp4`);
  const frames = Math.round(seconds * FPS);
  const enc: ChildProcessWithoutNullStreams = spawn(FFMPEG, [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-f',
    'image2pipe',
    '-framerate',
    String(FPS),
    '-c:v',
    'png',
    '-i',
    '-',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '10',
    '-pix_fmt',
    'yuv420p',
    file,
  ]);
  const done = new Promise<void>((ok, fail) => {
    enc.on('close', (code) => (code === 0 ? ok() : fail(new Error(`ffmpeg ended with ${code} for ${name}`))));
  });
  enc.stderr.on('data', (d) => process.stderr.write(d));
  await freeze(s.page);
  const view = await s.page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
  // The camera's move goes into the page once, as a script, and is called before every frame.
  await s.page.addScriptTag({ content: `window.__trailerEach = ${each ?? 'undefined'};` });
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    if (onFrame) await onFrame(i);
    await s.page.evaluate(
      ([n, total, ms]) => {
        const w = window as unknown as {
          __trailerEach?: (n: number, total: number) => void;
          __vtStep(ms: number): number;
        };
        w.__trailerEach?.(n, total);
        return w.__vtStep(ms);
      },
      [i, frames, 1000 / FPS] as const,
    );
    const { data } = await s.cdp.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      optimizeForSpeed: true,
      // The frame at 1920×1080 whatever the window's size in CSS pixels, drawn at that scale.
      clip: { x: 0, y: 0, width: view.width, height: view.height, scale: OUTPUT.width / view.width },
    });
    if (!enc.stdin.write(Buffer.from(data, 'base64'))) await new Promise((r) => enc.stdin.once('drain', r));
  }
  enc.stdin.end();
  await done;
  return { file, frames, ms: Date.now() - t0 };
}
