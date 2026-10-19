import { expect, type Locator, type Page, test } from '@playwright/test';

/** The living map (docs/design/LIVING_MAP.md): its sky, each power's reach, lanes alive, the glide. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface MapHook {
  __map: {
    screenOf(id: string): { x: number; y: number; visible: boolean } | null;
    moving: boolean;
    animating: boolean;
    orbit: { target: number[]; distance: number; yaw: number; pitch: number };
    fieldCount: number;
    sparkCount: number;
  };
  __system?: unknown;
}

const hook = (page: Page) =>
  page.evaluate(() => {
    const m = (window as unknown as MapHook).__map;
    return { animating: m.animating, fields: m.fieldCount, sparks: m.sparkCount };
  });

async function newGame(page: Page, project: string) {
  await page.goto('./?test#/new');
  await press(page.getByRole('button', { name: 'Lead the Frontier Co-op' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
}

async function starAt(page: Page, id: string) {
  await expect.poll(() => page.evaluate(() => (window as unknown as MapHook).__map.moving)).toBe(false);
  return page.evaluate((id) => {
    const p = (window as unknown as MapHook).__map.screenOf(id);
    const r = document.querySelector('.map-host')?.getBoundingClientRect();
    return p?.visible && r ? { x: p.x + r.left, y: p.y + r.top } : null;
  }, id);
}

test('a game’s map has its sky, each power’s reach, and its lanes alive', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await newGame(page, info.project.name);
  await expect(page.getByTestId('map')).toHaveAttribute('data-sky', 'yes');
  // The Cooperative's capital and the six systems of its home web, each in a field; its six lanes alive.
  expect(await hook(page)).toEqual({ animating: true, fields: 7, sparks: 6 });
  // The ambient motion never keeps the camera "moving".
  await expect.poll(() => page.evaluate(() => (window as unknown as MapHook).__map.moving)).toBe(false);
  expect(errors).toEqual([]);
});

test('the neighbourhood shows every power’s home web alive', async ({ page }) => {
  await page.goto('./?test#/map');
  await expect(page.getByTestId('map')).toHaveAttribute('data-sky', 'yes', { timeout: 30_000 });
  expect(await hook(page)).toEqual({ animating: true, fields: 21, sparks: 18 });
});

test('glides into a system, and comes back to where it was', async ({ page }, info) => {
  const project = info.project.name;
  await newGame(page, project);
  const at = await starAt(page, 'tau-ceti');
  expect(at).not.toBeNull();
  if (!at) return;
  if (isDesktop(project)) await page.mouse.click(at.x, at.y);
  else await page.touchscreen.tap(at.x, at.y);
  await starAt(page, 'tau-ceti');
  const orbit = () => page.evaluate(() => (window as unknown as MapHook).__map.orbit);
  const before = await orbit();
  await press(page.getByRole('button', { name: 'View in 3D' }), project);
  await expect(page.locator('.map-veil')).toBeAttached();
  await expect.poll(() => page.evaluate(() => Boolean((window as unknown as MapHook).__system))).toBe(true);
  await expect(page.locator('.system-scale')).toContainText('Tau Ceti · not to scale');
  await press(page.getByRole('button', { name: '← Neighbourhood' }), project);
  await expect(page.locator('.system-scale')).toHaveCount(0);
  await starAt(page, 'tau-ceti');
  const after = await orbit();
  expect(after.distance).toBeCloseTo(before.distance, 3);
  after.target.forEach((v, i) => {
    expect(v).toBeCloseTo(before.target[i] ?? 0, 3);
  });
});

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('nothing moves on its own', async ({ page }, info) => {
    await newGame(page, info.project.name);
    await expect(page.getByTestId('map')).toHaveAttribute('data-sky', 'yes');
    expect(await hook(page)).toEqual({ animating: false, fields: 7, sparks: 6 });
  });
});
