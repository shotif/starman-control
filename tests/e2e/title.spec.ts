import { expect, type Locator, test } from '@playwright/test';

/** The first impression (FIRST_IMPRESSION.md): the title's live scene and menu, and the powers' cards. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

test.describe('the first impression', () => {
  test('the title draws the neighbourhood behind its menu', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('./?test');
    await expect(page.getByRole('heading', { name: 'Starman Control' })).toBeVisible();
    // The boot screen gives way to the title.
    await expect(page.locator('#boot')).toHaveCount(0);
    const menu = page.getByRole('navigation', { name: 'Start' });
    await expect(menu.getByRole('link')).toHaveCount(5);
    await expect(menu.getByRole('link', { name: 'New game' })).toHaveAccessibleDescription('Lead one of four powers');
    // The scene arrives after the menu, and draws.
    await expect(page.locator('.title-sky')).toHaveAttribute('data-ready', 'yes', { timeout: 20_000 });
    await expect(page.locator('.title-sky canvas')).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('the title holds still when motion is reduced, and leaves no scene behind', async ({ page }, info) => {
    await page.addInitScript(() => {
      localStorage.setItem('starman-control:settings', JSON.stringify({ motion: 'reduce' }));
    });
    await page.goto('./?test');
    await expect(page.locator('html')).toHaveClass(/reduced-motion/);
    await expect(page.locator('.title-sky')).toHaveAttribute('data-ready', 'yes', { timeout: 20_000 });
    await press(page.getByRole('link', { name: 'Codex', exact: true }), info.project.name);
    await expect(page.getByRole('heading', { name: /Codex/ })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
  });

  test('Continue says which game it is', async ({ page }, info) => {
    await page.goto('./?test#/new');
    await press(page.getByRole('button', { name: 'Lead the Frontier Co-op' }), info.project.name);
    await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
    await page.goto('./?test');
    const go = page.getByRole('link', { name: 'Continue' });
    await expect(go).toHaveAccessibleDescription('Frontier Cooperative · Q1 2176');
    await expect(page.getByRole('navigation', { name: 'Start' }).getByRole('link')).toHaveCount(6);
  });

  test('each power has its home, its face and its emblem', async ({ page }, info) => {
    await page.goto('./?test#/new');
    await expect(page.locator('.power-card')).toHaveCount(4);
    for (const name of ['Sol Transit Authority', 'Frontier Cooperative', 'Hollow Wake', 'Dusk Concord']) {
      const card = page.getByRole('article', { name });
      await expect(card.getByRole('heading', { name })).toBeAttached();
      await expect(card.locator('.emblem')).toBeAttached();
      await expect(card.getByText('Illustration', { exact: true })).toHaveCount(0);
      const pictures = card.locator('img');
      await expect(pictures).toHaveCount(2);
      for (const img of await pictures.all()) {
        await expect(img).toHaveAttribute('alt', /\w/);
        await expect
          .poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0), { timeout: 15_000 })
          .toBe(true);
      }
    }
    const boxes = await page.locator('.power-card').evaluateAll((cards) =>
      (cards as HTMLElement[]).map((c) => ({
        top: c.offsetTop,
        left: c.offsetLeft,
        right: c.offsetLeft + c.offsetWidth,
      })),
    );
    if (isDesktop(info.project.name)) {
      // Side by side, all in view.
      expect(new Set(boxes.map((b) => Math.round(b.top))).size).toBe(1);
      expect(Math.max(...boxes.map((b) => b.right))).toBeLessThanOrEqual(1440);
    } else {
      // One at a time, swiped sideways; the dots follow.
      expect(boxes[1]?.left ?? 0).toBeGreaterThan(boxes[0]?.left ?? 0);
      await expect(page.locator('.power-dots button').first()).toHaveClass('on');
      await page.locator('.power-cards').evaluate((t) => t.scrollTo({ left: t.scrollWidth }));
      await expect(page.locator('.power-dots button').last()).toHaveClass('on');
      await press(page.getByRole('button', { name: 'Lead the Hollow Wake' }), info.project.name);
      await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
    }
  });
});
