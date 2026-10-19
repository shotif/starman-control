import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * The system in 3D (docs/design/M1_SYSTEM_VIEW.md) on a phone, a tablet and a desktop: enter a
 * system from its panel, choose a world in the scene, and go back to the neighbourhood. Reduced
 * motion holds the worlds still, so they can be found on screen.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } });

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface Hooks {
  __map: { screenOf(id: string): { x: number; y: number; visible: boolean } | null; moving: boolean };
  __system?: { screenOf(id: string): { x: number; y: number; visible: boolean } | null; moving: boolean };
}

async function pointAt(page: Page, hook: '__map' | '__system', id: string) {
  await expect
    .poll(() => page.evaluate((h) => (window as unknown as Hooks)[h]?.moving ?? true, hook), { timeout: 20_000 })
    .toBe(false);
  return page.evaluate(
    ([h, id]) => {
      const p = (window as unknown as Hooks)[h as '__map' | '__system']?.screenOf(id as string);
      const r = document.querySelector('.map-host')?.getBoundingClientRect();
      return p?.visible && r ? { x: p.x + r.left, y: p.y + r.top } : null;
    },
    [hook, id],
  );
}

async function tapAt(page: Page, p: { x: number; y: number } | null, project: string) {
  expect(p).not.toBeNull();
  if (!p) return;
  if (isDesktop(project)) await page.mouse.click(p.x, p.y);
  else await page.touchscreen.tap(p.x, p.y);
}

test('enters Sol in 3D, chooses Earth there, and goes back to the neighbourhood', async ({ page }, info) => {
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?test#/map');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  await tapAt(page, await pointAt(page, '__map', 'sol'), project);
  await press(page.getByRole('button', { name: 'View in 3D' }), project);
  await expect(page.locator('.system-scale')).toContainText('Sol · not to scale');
  await expect.poll(() => page.evaluate(() => Boolean((window as unknown as Hooks).__system))).toBe(true);
  // The neighbourhood's labels give way to the system's.
  await expect(page.locator('.system-labels .map-label[data-body="earth"]')).toBeVisible({ timeout: 20_000 });
  await tapAt(page, await pointAt(page, '__system', 'earth'), project);
  const panel = isDesktop(project) ? page.locator('.map-inspector') : page.getByRole('dialog', { name: 'Sol' });
  await expect(panel.getByRole('heading', { name: 'Earth' })).toBeVisible();
  await expect(panel).toContainText('For humans: Comfortable');
  await press(page.getByRole('button', { name: '← Neighbourhood' }), project);
  await expect(page.locator('.system-scale')).toHaveCount(0);
  await expect(page.locator('.system-labels')).toHaveCount(0);
  expect(await pointAt(page, '__map', 'sol')).not.toBeNull();
  expect(errors).toEqual([]);
});

test('has a key for the system view on the desktop', async ({ page }, info) => {
  test.skip(!isDesktop(info.project.name), 'desktop only');
  await page.goto('./?test#/map');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  await tapAt(page, await pointAt(page, '__map', 'sol'), 'desktop');
  await page.keyboard.press('v');
  await expect(page.locator('.system-scale')).toContainText('Sol · not to scale');
  await page.keyboard.press('Escape');
  await expect(page.locator('.system-scale')).toHaveCount(0);
});
