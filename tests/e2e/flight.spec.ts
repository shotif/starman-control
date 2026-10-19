import { expect, type Locator, type Page, test } from '@playwright/test';

/** In flight (docs/design/IN_FLIGHT.md): ships fly the lanes they took; the system view's sky. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface MapHook {
  __map: {
    screenOf(id: string): { x: number; y: number; visible: boolean } | null;
    moving: boolean;
    flying: number;
  };
}

const flying = (page: Page) => page.evaluate(() => (window as unknown as MapHook).__map.flying);

async function newGame(page: Page, project: string) {
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('4242');
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

/** Sends the survey ship Juniper to Luyten 726-8, one lane from Tau Ceti, and ends the turn. */
async function sendAndEnd(page: Page, project: string) {
  if (isDesktop(project)) {
    await page
      .getByRole('complementary', { name: 'Your power' })
      .locator('.ships-list')
      .getByRole('button', { name: /Juniper/ })
      .click();
  } else {
    await page.getByRole('button', { name: 'Empire', exact: true }).tap();
    const empire = page.getByRole('dialog', { name: 'Empire' });
    await empire.getByRole('tab', { name: /Ships/ }).tap();
    await empire.getByRole('button', { name: /Juniper/ }).tap();
    await page.getByRole('button', { name: 'Move', exact: true }).tap();
  }
  const luyten = await starAt(page, 'luyten-726-8');
  expect(luyten).not.toBeNull();
  if (!luyten) return;
  if (isDesktop(project)) {
    await page.mouse.click(luyten.x, luyten.y, { button: 'right' });
    await page.keyboard.press('Enter');
  } else {
    await page.touchscreen.tap(luyten.x, luyten.y);
    await page.getByRole('button', { name: 'Confirm' }).tap();
    await page.getByRole('button', { name: /End turn/ }).tap();
    await page
      .getByRole('dialog', { name: 'What needs you' })
      .getByRole('button', { name: /End turn anyway/ })
      .tap();
  }
  await expect(page.locator('.map-date')).toHaveText('Q2 2176');
}

test('a ship flies the lane it took when the turn ends', async ({ page }, info) => {
  await newGame(page, info.project.name);
  expect(await flying(page)).toBe(0);
  await sendAndEnd(page, info.project.name);
  await expect.poll(() => flying(page), { intervals: [50] }).toBe(1);
  await expect.poll(() => flying(page), { timeout: 10_000 }).toBe(0);
});

test('the system in 3D sits under the Milky Way', async ({ page }, info) => {
  await newGame(page, info.project.name);
  const tau = await starAt(page, 'tau-ceti');
  expect(tau).not.toBeNull();
  if (!tau) return;
  if (isDesktop(info.project.name)) await page.mouse.click(tau.x, tau.y);
  else await page.touchscreen.tap(tau.x, tau.y);
  await press(page.getByRole('button', { name: 'View in 3D' }), info.project.name);
  await expect(page.getByTestId('map')).toHaveAttribute('data-system-sky', 'yes', { timeout: 20_000 });
  await press(page.getByRole('button', { name: '← Neighbourhood' }), info.project.name);
  await expect(page.getByTestId('map')).not.toHaveAttribute('data-system-sky', 'yes');
});

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('ships are simply where they are', async ({ page }, info) => {
    await newGame(page, info.project.name);
    await sendAndEnd(page, info.project.name);
    expect(await flying(page)).toBe(0);
  });
});
