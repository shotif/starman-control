import { test } from '@playwright/test';

/**
 * Screenshots of every screen at the test sizes, for review (`npm run screenshots`): from a 320 px
 * phone to a 1440 px desktop. Saved to test-results/screens/.
 */
const SIZES = [
  { name: 'phone-320', width: 320, height: 640, touch: true },
  { name: 'phone-390', width: 390, height: 844, touch: true },
  { name: 'phone-landscape', width: 844, height: 390, touch: true },
  { name: 'tablet', width: 820, height: 1180, touch: true },
  { name: 'desktop-1280', width: 1280, height: 800, touch: false },
  { name: 'desktop-1440', width: 1440, height: 900, touch: false },
];

const SCREENS: { name: string; path: string; select?: string; star?: string; mode?: string }[] = [
  { name: 'title', path: './' },
  { name: 'data', path: './#/data' },
  { name: 'data-system', path: './#/data', select: 'Tau Ceti' },
  { name: 'map', path: './?test#/map' },
  { name: 'map-system', path: './?test#/map', star: 'sol' },
  { name: 'map-other-view', path: './?test#/map', mode: 'toggle' },
];

for (const size of SIZES) {
  test.describe(size.name, () => {
    test.use({ viewport: { width: size.width, height: size.height }, hasTouch: size.touch, isMobile: size.touch });
    for (const screen of SCREENS) {
      test(screen.name, async ({ page }) => {
        await page.goto(screen.path);
        if (screen.path.includes('#/map')) await page.locator('[data-ready="1"]').waitFor({ timeout: 30_000 });
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
        await page.waitForTimeout(700);
        await page.screenshot({ path: `test-results/screens/${screen.name}-${size.name}.png` });
      });
    }
  });
}
