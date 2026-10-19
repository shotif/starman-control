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

const SCREENS = [
  { name: 'title', path: './' },
  { name: 'data', path: './#/data' },
  { name: 'data-system', path: './#/data', select: 'Tau Ceti' },
];

for (const size of SIZES) {
  test.describe(size.name, () => {
    test.use({ viewport: { width: size.width, height: size.height }, hasTouch: size.touch, isMobile: size.touch });
    for (const screen of SCREENS) {
      test(screen.name, async ({ page }) => {
        await page.goto(screen.path);
        if (screen.select) await page.getByRole('button', { name: `Show ${screen.select}` }).click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: `test-results/screens/${screen.name}-${size.name}.png` });
      });
    }
  });
}
