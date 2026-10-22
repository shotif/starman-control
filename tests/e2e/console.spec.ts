import { expect, type Locator, type Page, test } from '@playwright/test';

/** Control's console (docs/design/CONSOLE.md): the bars, the end of a turn, and the sound setting. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

async function newGame(page: Page, project: string) {
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('4242');
  await press(page.getByRole('button', { name: 'Lead the Frontier Co-op' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
}

/** Ends the turn: Enter on a desktop; the bottom bar, past what needs you, on a phone. */
async function endTurn(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('Enter');
  else {
    await page.getByRole('button', { name: /End turn/ }).tap();
    await page
      .getByRole('dialog', { name: 'What needs you' })
      .getByRole('button', { name: /End turn anyway/ })
      .tap();
  }
}

test('the desktop’s top bar fits from 1024 px up', async ({ page }, info) => {
  test.skip(!isDesktop(info.project.name), 'the desktop layout');
  await newGame(page, info.project.name);
  for (const width of [1024, 1280, 1380, 1440, 1520, 1600, 1760, 1840, 1920]) {
    await page.setViewportSize({ width, height: 800 });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const bar = document.querySelector('.map-top') as HTMLElement;
          return bar.scrollWidth - bar.clientWidth;
        }),
      )
      .toBe(0);
  }
  // The chips keep their words for screen readers, however narrow.
  await expect(page.getByRole('button', { name: 'Research', exact: true })).toBeVisible();
});

test('the phone’s dock: an icon and a word on every button', async ({ page }, info) => {
  test.skip(isDesktop(info.project.name), 'the phone layout');
  await newGame(page, info.project.name);
  const buttons = page.locator('.map-bottom .bar-button');
  await expect(buttons).toHaveCount(4);
  for (const b of await buttons.all()) {
    await expect(b.locator('svg.icon')).toHaveCount(1);
    await expect(b).toHaveText(/\w/);
  }
});

test('a turn ends with a sweep of light and the new date', async ({ page }, info) => {
  await newGame(page, info.project.name);
  await endTurn(page, info.project.name);
  await expect(page.locator('.turn-sweep')).toHaveText('Q2 2176');
  await expect(page.locator('.turn-sweep')).toHaveCount(0, { timeout: 5_000 });
  await expect(page.locator('.map-date')).toHaveText('Q2 2176');
  // The stockpile counts up to its new value.
  await expect(page.getByLabel('Stockpile')).toContainText('44');
  // A quiet turn's report has no picture (DISPATCHES.md §2).
  await expect(page.getByRole('dialog', { name: 'Report' })).toContainText('A quiet quarter');
  await expect(page.locator('.dispatch-art')).toHaveCount(0);
});

test('sound can be turned off, and then nothing plays', async ({ page }, info) => {
  await page.addInitScript(() => {
    const w = window as unknown as { contexts: number; AudioContext: typeof AudioContext };
    w.contexts = 0;
    const Real = w.AudioContext;
    w.AudioContext = class extends Real {
      constructor() {
        super();
        w.contexts++;
      }
    } as typeof AudioContext;
  });
  await page.goto('./?test#/settings');
  const sound = page.getByRole('group', { name: 'Sound' });
  await expect(sound.getByRole('button', { name: 'On' })).toHaveAttribute('aria-pressed', 'true');
  await press(sound.getByRole('button', { name: 'Off' }), info.project.name);
  await page.reload();
  await expect(page.getByRole('group', { name: 'Sound' }).getByRole('button', { name: 'Off' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await press(page.getByRole('button', { name: 'Medium' }), info.project.name);
  expect(await page.evaluate(() => (window as unknown as { contexts: number }).contexts)).toBe(0);
  // On again: a press is heard.
  await press(page.getByRole('group', { name: 'Sound' }).getByRole('button', { name: 'On' }), info.project.name);
  await press(page.getByRole('button', { name: 'High' }), info.project.name);
  await expect.poll(() => page.evaluate(() => (window as unknown as { contexts: number }).contexts)).toBe(1);
});

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('a turn ends without the sweep', async ({ page }, info) => {
    await newGame(page, info.project.name);
    await endTurn(page, info.project.name);
    await expect(page.locator('.map-date')).toHaveText('Q2 2176');
    await expect(page.getByRole('dialog', { name: 'Report' })).toBeVisible();
    await expect(page.locator('.turn-sweep')).toHaveCount(0);
  });
});
