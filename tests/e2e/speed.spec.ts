import { expect, type Page, test } from '@playwright/test';

/**
 * Load and speed with phone throttling (M6_ONE.md §27.2): the built game, nothing cached, with the
 * browser slowed as a mid-range phone on a mobile network (4× slower processor; 150 ms round trips,
 * 1.6 Mb/s down, 750 kb/s up). The title within 3 s, a new game's map within 12 s, a turn after 50
 * within 2 s at four times its measure (the throttle does not reach the game's worker); the map's
 * frames a second recorded, not judged (the test browser draws in software).
 * Run with `npm run phone-speed`.
 */

interface Hook {
  __game: () => { turn: number } | null;
  __lastTurnMs: () => number;
  __autoplay: () => Promise<number>;
}

const NETWORK = {
  offline: false,
  latency: 150,
  downloadThroughput: (1600 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
};

async function throttle(page: Page, on: boolean) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: on });
  await cdp.send(
    'Network.emulateNetworkConditions',
    on ? NETWORK : { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 },
  );
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: on ? 4 : 1 });
}

async function endTurn(page: Page): Promise<number> {
  await expect(page.getByRole('button', { name: /End turn/ }).first()).toBeEnabled({ timeout: 30_000 });
  const date = await page.locator('.map-date').textContent();
  await page
    .getByRole('button', { name: /End turn/ })
    .first()
    .tap();
  const needs = page.getByRole('dialog', { name: 'What needs you' });
  await expect(needs.or(page.getByRole('dialog', { name: 'Report' }))).toBeVisible({ timeout: 30_000 });
  if (await needs.isVisible()) await needs.getByRole('button', { name: /End turn/ }).tap();
  await expect(page.locator('.map-date')).not.toHaveText(date ?? '', { timeout: 30_000 });
  await expect.poll(() => page.evaluate(() => (window as unknown as Hook).__lastTurnMs())).toBeGreaterThan(0);
  return page.evaluate(() => (window as unknown as Hook).__lastTurnMs());
}

test('a phone on a mobile network: the title, a new game, a turn after 50, and the map turning', async ({ page }) => {
  test.setTimeout(900_000);
  const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

  // The title, nothing cached.
  await throttle(page, true);
  let t0 = Date.now();
  await page.goto('./?test');
  await expect(page.getByRole('heading', { name: /Starman Control/i })).toBeVisible({ timeout: 30_000 });
  const title = Date.now() - t0;

  // A new game's map.
  await page.getByRole('link', { name: 'New game' }).tap();
  const lead = page.getByRole('button', { name: 'Lead the Transit Authority' });
  await expect(lead).toBeVisible({ timeout: 30_000 });
  t0 = Date.now();
  await lead.tap();
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 60_000 });
  const map = Date.now() - t0;

  // Fifty turns played at full speed, then one on the slowed phone.
  await throttle(page, false);
  for (let i = 0; i < 50; i++) {
    await page.evaluate(() => (window as unknown as Hook).__autoplay());
    await endTurn(page);
    await page.getByRole('button', { name: 'Close' }).first().tap();
  }
  await throttle(page, true);
  await page.evaluate(() => (window as unknown as Hook).__autoplay());
  const turn = await endTurn(page);
  await page.getByRole('button', { name: 'Close' }).first().tap();

  // The map's frames while it turns: a finger dragged across it for three seconds.
  const box = await page.getByTestId('map').boundingBox();
  if (!box) throw new Error('no map');
  const cdp = await page.context().newCDPSession(page);
  const frames = page.evaluate(
    () =>
      new Promise<number>((done) => {
        let n = 0;
        const start = performance.now();
        const tick = () => {
          n++;
          if (performance.now() - start < 3000) requestAnimationFrame(tick);
          else done(n / ((performance.now() - start) / 1000));
        };
        requestAnimationFrame(tick);
      }),
  );
  const y = box.y + box.height * 0.4;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + 60, y }] });
  for (let i = 1; i <= 30; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: box.x + 60 + ((box.width - 120) * (i % 10)) / 10, y }],
    });
    await page.waitForTimeout(90);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const fps = await frames;

  console.log(
    `phone-speed: title ${seconds(title)}, map ${seconds(map)}, turn ${turn} ms (unslowed; ${turn * 4} ms at 4×) after ${await page.evaluate(() => ((window as unknown as Hook).__game()?.turn ?? 1) - 1)} turns, the map turning at ${fps.toFixed(0)} frames a second`,
  );
  expect(title).toBeLessThan(3000);
  expect(map).toBeLessThan(12_000);
  // The browser's throttle slows the page, not the worker where a turn is worked out: the turn is
  // judged at four times its measure, as a phone four times slower would take.
  expect(turn * 4).toBeLessThan(2000);
});
