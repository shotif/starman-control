// How each shot of the trailer is filmed (docs/design/TRAILER.md §6): the staged moment it starts from,
// what is hidden, and the camera's move, frame by frame on the virtual clock. Every frame is the build.
//
//   npm run build && npx vite preview --port 4173 &   then   node trailer/shots.ts [S01,S13,…]
//
// Each shot is filmed half a second longer than the cut needs, for the edit; S19 to S21 are one take.

import { resolve } from 'node:path';
import type { Page } from '@playwright/test';
import { stateDir } from './games.ts';
import { BASE, CLEAN, FPS, film, NO_CURSOR, newGame, open, type Session, settle, style } from './harness.ts';
import { CUT } from './script.ts';

const POWER = {
  sta: 'Lead the Transit Authority',
  frontier: 'Lead the Frontier Co-op',
  'hollow-wake': 'Lead the Hollow Wake',
  'dusk-concord': 'Lead the Dusk Concord',
} as const;
type Power = keyof typeof POWER;
const TAIL = 0.5;
const length = (id: string) => {
  const c = CUT.find((x) => x.id === id);
  if (!c) throw new Error(`${id} is not in the cut`);
  return c.to - c.from + TAIL;
};

async function game(s: Session, power: Power, seed: number, tag?: string): Promise<void> {
  await newGame(s.page, POWER[power], seed, tag ? resolve(stateDir(power, seed), `${tag}.json`) : undefined);
  await style(s.page, NO_CURSOR);
}

/** The map camera, in the page: 3D or flat, centred on a star, zoomed. */
async function mapAt(page: Page, star: string | null, zoom = 1, mode = '3d'): Promise<void> {
  await page.evaluate(
    ([st, z, m]) => {
      const map = (window as unknown as { __map: Record<string, (...a: unknown[]) => void> }).__map;
      map.setMode(m);
      if (st) map.focus(st);
      else map.showAll();
      map.zoomBy(z);
    },
    [star, zoom, mode] as const,
  );
  await settle(page, 2);
}

/** Selects a star by clicking it where the map draws it. */
async function selectStar(page: Page, id: string): Promise<void> {
  const p = await page.evaluate((star) => {
    const m = (window as unknown as { __map: { screenOf(id: string): { x: number; y: number } } }).__map;
    const r = document.querySelector('.map-host')?.getBoundingClientRect();
    const at = m.screenOf(star);
    return { x: at.x + (r?.left ?? 0), y: at.y + (r?.top ?? 0) };
  }, id);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(400);
}

/** Opens a colony's scene from the outliner, with every panel hidden. */
async function colony(page: Page, name: string, clock: number): Promise<void> {
  await page.getByRole('button', { name, exact: false }).first().click();
  await page.getByRole('button', { name: `View ${name}` }).click();
  await page.locator('[data-colony-ready="1"]').waitFor({ timeout: 60_000 });
  await style(page, `${CLEAN}aside,[role=dialog],.colony-bar{display:none!important}`);
  await page.evaluate(
    (t) => (window as unknown as { __colony: { setClock(t: number): void } }).__colony.setClock(t),
    clock,
  );
  await settle(page, 1.5);
}

/**
 * A slow push into the page itself (a sheet, a card): smooth, since the browser draws every step. The
 * root is scaled, not the body: the game's screens are fixed, and a transformed body would hold them.
 */
const push = (x: string, y: string, by: number) =>
  `(i, n) => { const r = document.documentElement; r.style.height = '100%'; r.style.transformOrigin = '${x} ${y}'; r.style.transform = 'scale(' + (1 + ${by} * i / n) + ')'; }`;
const turn = (yaw: number, pitch = 0, zoom = 1) =>
  `() => { const m = window.__map; m.rotateBy(${yaw}, ${pitch}); ${zoom !== 1 ? `m.zoomBy(${zoom});` : ''} }`;
const colonyPan = (dx: number, clockStep = 0) =>
  `(i) => { const c = window.__colony; c.panBy(${dx}, 0); ${clockStep ? `c.setClock(c.life.clock + ${clockStep});` : ''} }`;

export const SHOT_FILMS: Record<string, (s: Session) => Promise<unknown>> = {
  S01: async (s) => {
    await s.page.goto('about:blank');
    await s.page.goto(`${BASE}?test#/map`);
    await s.page.locator('[data-ready="1"]').waitFor({ timeout: 60_000 });
    await style(s.page, `${CLEAN}${NO_CURSOR}.map-labels{opacity:.55}`);
    await mapAt(s.page, null, 1.15);
    return film(s, 'S01', length('S01'), turn(0.0012, 0.00008, 1.0004));
  },
  S02: async (s) => {
    await game(s, 'sta', 42);
    await mapAt(s.page, 'sol', 0.8);
    return film(s, 'S02', length('S02'), turn(0.0008, 0, 0.9996));
  },
  S03: async (s) => {
    await game(s, 'sta', 42);
    await mapAt(s.page, 'sol', 0.8);
    await selectStar(s.page, 'sol');
    // Into Sol once and out again, so the system's scene is loaded before it is filmed.
    await s.page.keyboard.press('v');
    await s.page.locator('.system-labels').waitFor({ timeout: 60_000 });
    await s.page.waitForTimeout(1500);
    await s.page.keyboard.press('v');
    await s.page.waitForTimeout(1500);
    await settle(s.page, 1);
    return film(s, 'S03', length('S03'), undefined, async (i) => {
      if (i === 6) await s.page.keyboard.press('v');
    });
  },
  S04: async (s) => {
    await game(s, 'sta', 42, 't50');
    await colony(s.page, 'Proxima Centauri b', 20);
    return film(s, 'S04', length('S04'), colonyPan(-0.45));
  },
  S05: async (s) => {
    await game(s, 'frontier', 42, 'built-166-arcology');
    await colony(s.page, 'Tau Ceti e', 84);
    // Dawn turning to day: the colony's clock run on three times as fast as the frames.
    return film(s, 'S05', length('S05'), colonyPan(0.4, 2 / FPS));
  },
  S06: async (s) => {
    await game(s, 'frontier', 42, 'lane-60');
    await mapAt(s.page, 'tau-ceti', 0.8);
    return film(s, 'S06', length('S06'), turn(-0.001, 0, 0.9997));
  },
  S07: async (s) => {
    await game(s, 'sta', 42, 'contact-dusk-concord');
    await mapAt(s.page, 'procyon', 0.75);
    return film(s, 'S07', length('S07'), turn(0.0006, 0, 0.9993));
  },
  S08: async (s) => {
    await game(s, 'sta', 42, 'contact-dusk-concord');
    await s.page.keyboard.press('y');
    await s.page
      .getByRole('dialog', { name: 'Diplomacy' })
      .getByRole('button', { name: /Dusk Concord/ })
      .first()
      .click();
    await settle(s.page, 1);
    return film(s, 'S08', length('S08'), push('22%', '35%', 0.06));
  },
  S09a: async (s) => {
    await game(s, 'dusk-concord', 42, 't150');
    await colony(s.page, 'GJ 433 d', 30);
    return film(s, 'S09a', length('S09a'), colonyPan(-0.4));
  },
  S09b: async (s) => {
    // At 1920 CSS pixels the four powers' cards stand side by side, as a desktop shows them.
    await s.cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await s.page.goto('about:blank');
    await s.page.goto(`${BASE}?test#/new`);
    await s.page.getByRole('button', { name: POWER['dusk-concord'] }).waitFor();
    await style(s.page, NO_CURSOR);
    await settle(s.page, 2);
    const done = await film(s, 'S09b', length('S09b'), push('70%', '55%', 0.06));
    await s.cdp.send('Emulation.clearDeviceMetricsOverride');
    return done;
  },
  S10a: async (s) => {
    await game(s, 'sta', 7, 'battle-106');
    await s.page.keyboard.press('y');
    await settle(s.page, 1);
    return film(s, 'S10a', length('S10a'), push('35%', '40%', 0.05));
  },
  S10b: async (s) => {
    await game(s, 'sta', 7, 'battle-106');
    await s.page.keyboard.press('g');
    await settle(s.page, 1);
    return film(s, 'S10b', length('S10b'), push('25%', '25%', 0.07));
  },
  S11: async (s) => {
    await game(s, 'hollow-wake', 42, 'war-86');
    await mapAt(s.page, 'wolf-1061', 0.8);
    return film(s, 'S11', length('S11'), turn(-0.0008, 0, 0.9995));
  },
  S12: async (s) => {
    await game(s, 'sta', 7, 'battle-106');
    await s.page.keyboard.press('b');
    await settle(s.page, 1);
    return film(s, 'S12', length('S12'), push('30%', '45%', 0.05));
  },
  S13: async (s) => {
    await game(s, 'sta', 7, 'battle-106');
    await s.page.keyboard.press('r');
    await s.page.getByRole('button', { name: 'Watch the battle at Sol' }).click();
    await s.page.waitForFunction(() => (window as unknown as { __replay?: unknown }).__replay, null, {
      timeout: 30_000,
    });
    await style(
      s.page,
      '.replay-account,.replay-dock,.replay-top,.replay-controls,.replay-bar{display:none!important}',
    );
    await s.page.evaluate(() => {
      const r = (
        window as unknown as { __replay: { controller: { zoom(f: number): void; rotate(y: number, p: number): void } } }
      ).__replay;
      r.controller.zoom(0.55);
      r.controller.rotate(-0.25, 0.05);
    });
    await settle(s.page, 0.3);
    return film(s, 'S13', length('S13'));
  },
  S14: async (s) => {
    await game(s, 'dusk-concord', 42, 'invasion-224');
    await s.page.keyboard.press('r');
    await settle(s.page, 1);
    return film(s, 'S14', length('S14'), push('32%', '14%', 0.18));
  },
  S15: async (s) => {
    await game(s, 'dusk-concord', 42, 'chapter-1');
    await s.page.keyboard.press('j');
    await settle(s.page, 1);
    return film(s, 'S15', length('S15'), push('45%', '30%', 0.14));
  },
  S16: async (s) => {
    await game(s, 'dusk-concord', 42, 'key-found-196');
    await s.page.keyboard.press('j');
    await settle(s.page, 1);
    return film(s, 'S16', length('S16'), push('45%', '40%', 0.06));
  },
  S17a: async (s) => event(s, 'sta', 7, 'event-great-flare', 'S17a'),
  S17b: async (s) => event(s, 'sta', 42, 'event-nova', 'S17b'),
  S17c: async (s) => {
    await game(s, 'dusk-concord', 42, 'arks');
    await s.page.keyboard.press('r');
    await s.page
      .getByRole('button', { name: /Unhomed/ })
      .first()
      .click();
    await settle(s.page, 1);
    return film(s, 'S17c', length('S17c'), push('40%', '25%', 0.08));
  },
  S18: async (s) => {
    await game(s, 'frontier', 42, 'ended');
    await settle(s.page, 2);
    return film(s, 'S18', length('S18'), push('45%', '35%', 0.06));
  },
  // The ending as one take (S19 to S21): Farcast's turn, End turn pressed, the game's own sweep, then
  // the same game's whole neighbourhood with the logotype, the last line, the closing line and the plate.
  S19: async (s) => ending(s),
};

async function event(s: Session, power: Power, seed: number, tag: string, id: string) {
  await game(s, power, seed, tag);
  await s.page.keyboard.press('r');
  await s.page
    .getByRole('button', { name: /needs your answer/ })
    .first()
    .click();
  await settle(s.page, 1);
  return film(s, id, length(id), push('55%', '30%', 0.08));
}

/** The end overlay: the game's own logotype and lit plate (title.css), the line and the closing line. */
const END_OVERLAY = `
<style>
.trailer-end{position:fixed;inset:0;z-index:60;pointer-events:none;display:grid;place-items:center;
  background:radial-gradient(ellipse at center,rgba(4,7,14,.1),rgba(4,7,14,.55));animation:te-dim 1.2s ease both}
.trailer-end .te-col{display:grid;justify-items:center;gap:16px;text-align:center}
.trailer-end .logo-starman{font-size:1.15rem}.trailer-end .logo-control{font-size:7rem}
.trailer-end .te-line{margin:4px 0 0;font-family:var(--font-label);font-weight:600;text-transform:uppercase;letter-spacing:.38em;
  color:#d8ecfa;font-size:.95rem;text-shadow:0 0 18px rgba(92,200,255,.55);animation:te-in 1s ease 3s both}
.trailer-end .plate{margin-top:30px;width:330px;animation:te-in 1s ease 5s both}
.trailer-end .te-closing{position:absolute;left:0;right:0;bottom:30px;margin:0;font-size:.72rem;color:rgba(207,224,245,.75);
  animation:te-in 1.2s ease 4.5s both}
@keyframes te-in{from{opacity:0}}@keyframes te-dim{from{opacity:0}}
</style>
<div class="trailer-end"><div class="te-col">
  <h1 class="logotype"><span class="logo-starman">Starman</span> <span class="logo-control">Control</span></h1>
  <p class="te-line">The stars are waiting, Control</p>
  <a class="plate plate-primary">
    <svg class="plate-glyph" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6L12 16.4 6.6 19.4l1.3-6L3.4 9.3l6-.7z"/></g></svg>
    <span class="plate-text"><span class="plate-title">Wishlist on Steam</span><span class="plate-line">A 4X strategy game among the real nearby stars</span></span>
    <svg class="plate-chevron" viewBox="0 0 12 24" aria-hidden="true"><path d="M3 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
  </a>
</div><p class="te-closing">CLOSING</p></div>`;

async function ending(s: Session) {
  const { page } = s;
  await game(s, 'hollow-wake', 7, 'event-comet');
  await mapAt(page, 'wolf-1061', 0.9);
  // Every sheet the turn opens stays out of the picture; the turn itself is ended for real.
  await style(page, '[role=dialog]{display:none!important}.map-labels{transition:opacity 1.4s ease}');
  const total = 107; // the take begins at 1:47
  const at = (t: number) => Math.round((t - total) * FPS);
  const { CLOSING } = await import('./script.ts');
  return film(s, 'S19', 120 - total + TAIL, turn(0.0006, 0, 0.9997), async (i) => {
    if (i === at(109.3)) await page.hover('button:has-text("End turn")');
    if (i === at(109.8)) {
      const date = await page.locator('.map-date').textContent();
      await page.locator('button:has-text("End turn")').first().click();
      // The clock is held while the turn is worked out; a list of what needs us is passed by.
      for (let t = 0; t < 100; t++) {
        const state = await page.evaluate((d) => {
          const needs = [...document.querySelectorAll('[role=dialog]')].find(
            (x) => x.getAttribute('aria-label') === 'What needs you',
          );
          const go = needs && [...needs.querySelectorAll('button')].find((b) => /End turn/.test(b.textContent ?? ''));
          if (go) (go as HTMLButtonElement).click();
          return document.querySelector('.turn-sweep') || document.querySelector('.map-date')?.textContent !== d;
        }, date);
        if (state) break;
        await page.waitForTimeout(100);
      }
    }
    if (i === at(111.5)) {
      await style(page, `${CLEAN}.map-labels{opacity:0!important}`);
      await page.evaluate(() => {
        const m = (window as unknown as { __map: Record<string, (...a: unknown[]) => void> }).__map;
        m.setMode('3d');
        m.showAll();
        m.zoomBy(2.4);
      });
    }
    if (i === at(112))
      await page.evaluate(
        (html) => document.body.insertAdjacentHTML('beforeend', html),
        END_OVERLAY.replace('CLOSING', CLOSING),
      );
  });
}

// Films the shots named (all by default), one browser for all.
if (import.meta.url === `file://${process.argv[1]}`) {
  const wanted = (process.argv[2] ?? Object.keys(SHOT_FILMS).join(',')).split(',');
  const s = await open();
  for (const id of wanted) {
    const shot = SHOT_FILMS[id];
    if (!shot) throw new Error(`No shot ${id}`);
    const t0 = Date.now();
    await shot(s);
    console.log(`${id}: ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  await s.browser.close();
}
