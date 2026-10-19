import { test } from '@playwright/test';

/**
 * Screenshots of every screen at the test sizes, for review (`npm run screenshots`): from a 320 px
 * phone to a 1440 px desktop. Saved to test-results/screens/.
 */
const SIZES: { name: string; width: number; height: number; touch: boolean; textScale?: number }[] = [
  // Starman Reborn's nine test sizes (tests/e2e/screenshots.spec.ts at ba4ef73), and a 1280 desktop.
  { name: 'phone-360', width: 360, height: 640, touch: true },
  { name: 'phone-360-landscape', width: 640, height: 360, touch: true },
  { name: 'phone-390', width: 390, height: 844, touch: true },
  { name: 'phone-landscape', width: 844, height: 390, touch: true },
  { name: 'tablet', width: 768, height: 1024, touch: true },
  { name: 'tablet-landscape', width: 1024, height: 768, touch: true },
  { name: 'phone-411-text-130', width: 411, height: 741, touch: true, textScale: 1.3 },
  { name: 'phone-316-zoom-130', width: 316, height: 570, touch: true },
  { name: 'desktop-1280', width: 1280, height: 800, touch: false },
  { name: 'desktop-1440', width: 1440, height: 900, touch: false },
];

const SCREENS: {
  name: string;
  path: string;
  select?: string;
  star?: string;
  mode?: string;
  /** A new game as the Cooperative, then: the map, the empire, or its capital colony. */
  game?: 'map' | 'empire' | 'colony';
  /** Inside this system, in 3D. */
  inside?: string;
}[] = [
  { name: 'title', path: './' },
  { name: 'settings', path: './#/settings' },
  { name: 'saves', path: './#/saves' },
  { name: 'data', path: './#/data' },
  { name: 'data-system', path: './#/data', select: 'Tau Ceti' },
  { name: 'map', path: './?test#/map' },
  { name: 'map-system', path: './?test#/map', star: 'sol' },
  { name: 'map-other-view', path: './?test#/map', mode: 'toggle' },
  { name: 'new-game', path: './#/new' },
  { name: 'system-3d', path: './?test#/map', star: 'sol', inside: 'sol' },
  { name: 'system-3d-alpha-centauri', path: './?test#/map', star: 'alpha-centauri', inside: 'alpha-centauri' },
  { name: 'game', path: './?test#/new', game: 'map' },
  { name: 'game-empire', path: './?test#/new', game: 'empire' },
  { name: 'game-colony', path: './?test#/new', game: 'colony' },
];

for (const size of SIZES) {
  test.describe(size.name, () => {
    test.use({ viewport: { width: size.width, height: size.height }, hasTouch: size.touch, isMobile: size.touch });
    for (const screen of SCREENS) {
      test(screen.name, async ({ page }) => {
        if (size.textScale)
          await page.addInitScript((t) => {
            localStorage.setItem('starman-control:settings', JSON.stringify({ textScale: t }));
          }, size.textScale);
        await page.goto(screen.path);
        if (screen.path.includes('#/map')) await page.locator('[data-ready="1"]').waitFor({ timeout: 30_000 });
        const press = async (l: ReturnType<typeof page.locator>) => (size.touch ? l.tap() : l.click());
        if (screen.game) {
          await press(page.getByText('More'));
          await page.getByLabel(/Seed/).fill('4242');
          await press(page.getByRole('button', { name: 'Lead the Frontier Co-op' }));
          await page.locator('[data-ready="1"]').waitFor({ timeout: 30_000 });
          if (screen.game !== 'map') {
            await press(page.getByRole('button', { name: 'Empire', exact: true }));
            if (screen.game === 'colony')
              await press(
                page
                  .getByRole('dialog', { name: 'Empire' })
                  .getByRole('button', { name: /^Tau Ceti/ })
                  .first(),
              );
          }
        }
        if (screen.select) await page.getByRole('button', { name: `Show ${screen.select}` }).click();
        if (screen.star) {
          const p = await page.evaluate((id) => {
            const m = (window as unknown as { __map: { screenOf(id: string): { x: number; y: number } } }).__map;
            const r = document.querySelector('.map-host')?.getBoundingClientRect();
            const s = m.screenOf(id);
            return { x: s.x + (r?.left ?? 0), y: s.y + (r?.top ?? 0) };
          }, screen.star);
          if (size.touch) await page.touchscreen.tap(p.x, p.y);
          else await page.mouse.click(p.x, p.y);
        }
        if (screen.mode) {
          const flat = page.getByRole('button', { name: 'Flat', exact: true });
          const pressed = await flat.getAttribute('aria-pressed');
          const target = pressed === 'true' ? page.getByRole('button', { name: '3D', exact: true }) : flat;
          if (size.touch) await target.tap();
          else await target.click();
        }
        if (screen.inside) {
          await press(page.getByRole('button', { name: 'View in 3D' }));
          await page.locator('.system-labels').waitFor({ timeout: 30_000 });
          await page.waitForTimeout(1500);
        }
        await page.waitForTimeout(700);
        await page.screenshot({ path: `test-results/screens/${screen.name}-${size.name}.png` });
      });
    }
  });
}
