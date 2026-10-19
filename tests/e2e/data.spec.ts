import { expect, type Locator, test } from '@playwright/test';

const isDesktop = (name: string) => name === 'desktop';

/** A tap on a touch device, a click with the mouse on the desktop: a mouse switches a tablet to the desktop layout. */
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

test.describe('the codex', () => {
  test('opens from the title', async ({ page }, info) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { name: /Starman Control/i })).toBeVisible();
    await press(page.getByRole('link', { name: 'the codex' }), info.project.name);
    await expect(page.getByRole('heading', { name: /Codex/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /How the game works out/ })).toBeVisible();
    await expect(page.locator('.count')).toHaveText('207 of 207');
    await expect(page.locator('.web-card')).toHaveCount(3);
  });

  test('uses the layout for the device', async ({ page }, info) => {
    await page.goto('./#/codex');
    await expect(page.locator('html')).toHaveAttribute(
      'data-layout',
      isDesktop(info.project.name) ? 'desktop' : 'phone',
    );
    if (isDesktop(info.project.name)) {
      await expect(page.locator('.system-table tbody tr')).toHaveCount(207);
      await expect(page.locator('.system-cards')).toHaveCount(0);
    } else {
      await expect(page.locator('.system-card')).toHaveCount(207);
      await expect(page.locator('.system-table')).toHaveCount(0);
    }
  });

  test('finds a system and shows its real data', async ({ page }, info) => {
    await page.goto('./#/codex');
    await page.getByPlaceholder(/Find a system/).fill('barnards');
    await expect(page.locator('.count')).toHaveText('1 of 207');
    if (isDesktop(info.project.name)) {
      await page.locator('.system-table tbody th button').first().click();
      const inspector = page.locator('.inspector');
      await expect(inspector.getByRole('heading', { name: 'Barnard’s Star' })).toBeVisible();
      await expect(inspector.getByText(/Barnard.s Star b/)).toBeVisible();
    } else {
      await page.locator('.system-card').first().tap();
      const sheet = page.getByRole('dialog', { name: 'Barnard’s Star' });
      await expect(sheet).toBeVisible();
      await expect(sheet.getByText(/Barnard.s Star b/)).toBeVisible();
      await sheet.getByRole('button', { name: 'Show more' }).tap();
      await expect(sheet).toHaveClass(/sheet-full/);
      await sheet.getByRole('button', { name: 'Close' }).tap();
      await expect(sheet).toHaveCount(0);
    }
  });

  test('shows the home webs: seven systems each, the rest dark', async ({ page }, info) => {
    await page.goto('./#/codex');
    await press(page.getByLabel('Home webs only'), info.project.name);
    await expect(page.locator('.count')).toHaveText('21 of 207');
    await press(page.getByRole('button', { name: 'Show Tau Ceti' }), info.project.name);
    const detail = isDesktop(info.project.name) ? page.locator('.inspector') : page.getByRole('dialog');
    await expect(detail.getByRole('heading', { name: 'Tau Ceti' })).toBeVisible();
    await expect(detail.getByText('Disputed')).toHaveCount(4);
    await expect(detail.locator('.lane-open')).toHaveCount(2);
  });

  test('sorts by any column on the desktop, and moves with the keyboard', async ({ page }, info) => {
    test.skip(!isDesktop(info.project.name), 'desktop only: the phone sorts with a menu');
    await page.goto('./#/codex');
    const first = page.locator('.system-table tbody th button').first();
    await expect(first).toHaveText('Sol');
    await page.getByRole('button', { name: 'From Sol' }).click();
    await expect(first).not.toHaveText('Sol');
    await page.getByRole('button', { name: /Known planets/ }).click();
    await page.getByRole('button', { name: /Known planets/ }).click();
    await expect(page.locator('.system-table thead th[aria-sort="descending"]')).toHaveCount(1);
    await page.keyboard.press('/');
    await expect(page.getByPlaceholder(/Find a system/)).toBeFocused();
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.system-table tbody tr.is-selected')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('.system-table tbody tr.is-selected')).toHaveCount(0);
  });

  test('sorts with a menu on a phone', async ({ page }, info) => {
    test.skip(isDesktop(info.project.name), 'phone and tablet');
    await page.goto('./#/codex');
    await page.getByLabel('Sort').selectOption('name');
    await expect(page.locator('.system-card .card-name').first()).toHaveText(/^\d|^A/);
  });

  test('never scrolls sideways', async ({ page }) => {
    await page.goto('./#/codex');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test('a tablet switches to the desktop layout when a mouse is used', async ({ page }, info) => {
  test.skip(info.project.name !== 'tablet', 'tablet only');
  await page.goto('./#/codex');
  await expect(page.locator('html')).toHaveAttribute('data-layout', 'phone');
  await page.mouse.move(200, 300);
  await expect(page.locator('html')).toHaveAttribute('data-layout', 'desktop');
  await expect(page.locator('.system-table')).toBeVisible();
});
