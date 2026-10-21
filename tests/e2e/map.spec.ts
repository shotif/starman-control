import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * The map on a phone (touch, flat by default), a tablet (touch) and a desktop (mouse, 3D by
 * default). Stars are found through the map's test hook (`?test`), which says where each is drawn.
 */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface MapHook {
  __map: {
    screenOf(id: string): { x: number; y: number; visible: boolean } | null;
    systemAt(x: number, y: number, pointerType: string): string | null;
    visibleLabels(): string[];
    viewMode: 'flat' | '3d';
    moving: boolean;
  };
}

async function openMap(page: Page) {
  await page.goto('./?test#/map');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
}

/** Where a system is on the page once the view has settled, or null when it is off screen. */
async function starAt(page: Page, id: string) {
  await expect.poll(() => page.evaluate(() => (window as unknown as MapHook).__map.moving)).toBe(false);
  return page.evaluate((id) => {
    const p = (window as unknown as MapHook).__map.screenOf(id);
    const r = document.querySelector('.map-host')?.getBoundingClientRect();
    return p?.visible && r ? { x: p.x + r.left, y: p.y + r.top } : null;
  }, id);
}

async function pressStar(page: Page, id: string, project: string) {
  const p = await starAt(page, id);
  expect(p, `${id} on screen`).not.toBeNull();
  if (!p) return;
  if (isDesktop(project)) await page.mouse.click(p.x, p.y);
  else await page.touchscreen.tap(p.x, p.y);
}

test.describe('the map', () => {
  test('opens from the title, flat on a phone and 3D on a desktop, centred on Sol', async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('./?test');
    await press(page.getByRole('link', { name: 'Explore the neighbourhood' }), info.project.name);
    await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
    const mode = await page.evaluate(() => (window as unknown as MapHook).__map.viewMode);
    expect(mode).toBe(isDesktop(info.project.name) ? '3d' : 'flat');
    // The labels are laid out once the map has its size: wait for them.
    expect(await starAt(page, 'sol')).not.toBeNull();
    const labels = () => page.evaluate(() => (window as unknown as MapHook).__map.visibleLabels());
    await expect.poll(labels).toContain('sol');
    expect((await labels()).length).toBeGreaterThan(10);
    expect(errors).toEqual([]);
  });

  test('shows a star’s system when it is chosen', async ({ page }, info) => {
    await openMap(page);
    await pressStar(page, 'sol', info.project.name);
    if (isDesktop(info.project.name)) {
      const inspector = page.getByRole('complementary', { name: 'Selected system' });
      await expect(inspector.getByRole('heading', { name: 'Sol' })).toBeVisible();
      await expect(inspector.getByText('Main asteroid belt')).toBeVisible();
      // A lane leads on to the next system.
      await inspector.getByRole('button', { name: 'Alpha Centauri' }).click();
      await expect(inspector.getByRole('heading', { name: 'Alpha Centauri' })).toBeVisible();
      await expect(inspector.getByText('Proxima Centauri b')).toBeVisible();
    } else {
      const sheet = page.getByRole('dialog', { name: 'Sol' });
      await expect(sheet).toBeVisible();
      await expect(sheet.getByText('A yellow dwarf')).toBeVisible();
      await sheet.getByRole('button', { name: 'Show more' }).tap();
      await expect(sheet).toHaveClass(/sheet-full/);
      await sheet.getByRole('button', { name: 'Close' }).tap();
      await expect(sheet).toHaveCount(0);
      // Tapping empty space chooses nothing.
      await pressStar(page, 'sol', info.project.name);
      await expect(page.getByRole('dialog', { name: 'Sol' })).toBeVisible();
      // The map recentres above the sheet: wait for it to settle before looking for empty space.
      await expect.poll(() => page.evaluate(() => (window as unknown as MapHook).__map.moving)).toBe(false);
      const empty = await page.evaluate(() => {
        const map = (window as unknown as MapHook).__map;
        const r = document.querySelector('.map-host')?.getBoundingClientRect();
        for (let y = 120; y < 400; y += 9)
          for (let x = 20; x < (r?.width ?? 300) - 20; x += 9)
            if (map.systemAt(x, y, 'touch') === null) return { x: x + (r?.left ?? 0), y: y + (r?.top ?? 0) };
        return null;
      });
      expect(empty).not.toBeNull();
      // A touch counts as a tap only if it is short (gestures.ts); on a loaded test machine the
      // touch's down and up can arrive further apart than that, so a tap that was not taken is
      // tried again, seconds apart (never a double tap).
      await expect(async () => {
        if (empty) await page.touchscreen.tap(empty.x, empty.y);
        await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 2000 });
      }).toPass({ timeout: 20_000 });
    }
  });

  test('finds a system by name and centres it', async ({ page }, info) => {
    await openMap(page);
    if (!isDesktop(info.project.name)) await page.getByRole('button', { name: 'Find' }).tap();
    const search = page.getByPlaceholder('Find a system');
    await search.fill('proxima');
    await press(page.locator('.search-results').getByRole('button', { name: /Alpha Centauri/ }), info.project.name);
    const panel = isDesktop(info.project.name)
      ? page.getByRole('complementary', { name: 'Selected system' })
      : page.getByRole('dialog', { name: 'Alpha Centauri' });
    await expect(panel.getByRole('heading', { name: 'Alpha Centauri' })).toBeVisible();
    // Once the camera settles, Alpha Centauri sits in the middle of what the panels leave showing.
    await expect
      .poll(async () => {
        const p = await starAt(page, 'alpha-centauri');
        const host = await page.locator('.map-host').boundingBox();
        return p && host ? Math.abs(p.x - (host.x + host.width / 2)) : 999;
      })
      .toBeLessThan(30);
  });

  test('switches between the flat and 3D views', async ({ page }, info) => {
    await openMap(page);
    const mode = () => page.evaluate(() => (window as unknown as MapHook).__map.viewMode);
    const start = await mode();
    const other = start === 'flat' ? '3D' : 'Flat';
    await press(page.getByRole('button', { name: other, exact: true }), info.project.name);
    expect(await mode()).toBe(start === 'flat' ? '3d' : 'flat');
    await expect(page.getByRole('button', { name: other, exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('pinches to zoom on a phone', async ({ page }, info) => {
    test.skip(isDesktop(info.project.name), 'touch only');
    await openMap(page);
    const before = await page.evaluate(() => (window as unknown as MapHook).__map.visibleLabels().length);
    // Two fingers moving apart, as CDP touch events.
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', points: [number, number][]) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: points.map(([x, y], id) => ({ x, y, id })),
      });
    await touch('touchStart', [
      [150, 420],
      [240, 420],
    ]);
    for (let i = 1; i <= 8; i++)
      await touch('touchMove', [
        [150 - i * 12, 420],
        [240 + i * 12, 420],
      ]);
    await touch('touchEnd', []);
    await expect
      .poll(() => page.evaluate(() => (window as unknown as MapHook).__map.visibleLabels().length))
      .not.toBe(before);
  });

  test('has a key for everything on the desktop', async ({ page }, info) => {
    test.skip(!isDesktop(info.project.name), 'desktop only');
    await openMap(page);
    await page.keyboard.press('?');
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toHaveCount(0);
    await page.keyboard.press('f');
    expect(await page.evaluate(() => (window as unknown as MapHook).__map.viewMode)).toBe('flat');
    await page.keyboard.press('/');
    await expect(page.getByPlaceholder('Find a system')).toBeFocused();
    await page.keyboard.type('tau ceti');
    await page.keyboard.press('Enter');
    const inspector = page.getByRole('complementary', { name: 'Selected system' });
    await expect(inspector.getByRole('heading', { name: 'Tau Ceti' })).toBeVisible();
    await expect(inspector.getByText('Disputed')).toHaveCount(4);
    await page.keyboard.press('Escape');
    await expect(inspector.getByRole('heading', { name: 'The neighbourhood' })).toBeVisible();
  });

  test('shows a card for the star under the mouse', async ({ page }, info) => {
    test.skip(!isDesktop(info.project.name), 'desktop only');
    await openMap(page);
    const p = await starAt(page, 'sol');
    if (!p) throw new Error('Sol is off screen');
    await page.mouse.move(p.x, p.y);
    await expect(page.locator('.hover-card')).toContainText('Sol');
    await page.mouse.dblclick(p.x, p.y);
    await expect(
      page.getByRole('complementary', { name: 'Selected system' }).getByRole('heading', { name: 'Sol' }),
    ).toBeVisible();
  });

  test('keeps its view when a tablet switches to the desktop layout', async ({ page }, info) => {
    test.skip(info.project.name !== 'tablet', 'tablet only');
    await openMap(page);
    await expect(page.locator('.map-bottom')).toBeVisible();
    await page.mouse.move(300, 400);
    await expect(page.locator('html')).toHaveAttribute('data-layout', 'desktop');
    await expect(page.locator('.outliner')).toBeVisible();
    await expect(page.locator('.map-canvas')).toHaveCount(1);
    expect(await starAt(page, 'sol')).not.toBeNull();
  });

  test('never scrolls sideways and lists the legend', async ({ page }, info) => {
    await openMap(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await press(page.getByRole('button', { name: 'Legend' }), info.project.name);
    await expect(page.getByText(/A dark lane/)).toBeVisible();
  });
});

test('shows a system beside the map when a phone is turned sideways', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'phone only');
  await page.setViewportSize({ width: 844, height: 390 });
  await openMap(page);
  await pressStar(page, 'sol', info.project.name);
  const sheet = page.getByRole('dialog', { name: 'Sol' });
  await expect(sheet).toHaveClass(/sheet-side/);
  // Sol moves to the middle of the part of the map the sheet leaves.
  const box = await sheet.boundingBox();
  await expect
    .poll(async () => {
      const p = await starAt(page, 'sol');
      return p && box ? Math.abs(p.x - box.x / 2) : 999;
    })
    .toBeLessThan(12);
  await sheet.getByRole('button', { name: 'Close' }).tap();
  await expect(sheet).toHaveCount(0);
});

test('opens a world from its system, with where each fact comes from', async ({ page }, info) => {
  const desktop = isDesktop(info.project.name);
  /** The system's panel: the inspector on a desktop, its own sheet on a phone. */
  const panelOf = (system: string) =>
    desktop ? page.getByRole('complementary', { name: 'Selected system' }) : page.getByRole('dialog', { name: system });
  await openMap(page);
  await pressStar(page, 'sol', info.project.name);
  let panel = panelOf('Sol');
  if (!desktop) await panel.getByRole('button', { name: 'Show more' }).tap();
  await press(panel.getByRole('button', { name: /^Earth/ }), info.project.name);
  await expect(panel.getByRole('heading', { name: 'Earth' })).toBeVisible();
  await expect(panel.getByText('For humans: Comfortable')).toBeVisible();
  await expect(panel.getByText('Observed').first()).toBeVisible();
  await press(panel.getByRole('button', { name: '← Sol' }), info.project.name);
  // A known planet elsewhere: measured values, and the parts that are the game's own.
  await press(panel.getByRole('button', { name: 'Alpha Centauri' }), info.project.name);
  panel = panelOf('Alpha Centauri');
  await expect(panel.getByRole('heading', { name: 'Alpha Centauri' })).toBeVisible();
  if (!desktop) await panel.getByRole('button', { name: 'Show more' }).tap();
  await press(panel.getByRole('button', { name: /Proxima Centauri b/ }), info.project.name);
  await expect(panel.getByText('1.055 ± 0.055')).toBeVisible();
  await expect(panel.getByText('exposed: its star is a flare star')).toBeVisible();
  await expect(panel.getByText('Fiction').first()).toBeVisible();
});
