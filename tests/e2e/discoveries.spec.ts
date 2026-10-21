import { expect, type Locator, type Page, test } from '@playwright/test';

/** Discoveries (M2B_SCIENCE.md §17): an observation and an inspiration, on a phone, a tablet and a desktop. */
// Seed 1, as the anomaly journey of game.spec.ts: Barnard's Star is in sight of Sol on every screen.

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface MapHook {
  __map: { screenOf(id: string): { x: number; y: number; visible: boolean } | null; moving: boolean };
}

async function starAt(page: Page, id: string) {
  await expect
    .poll(() => page.evaluate(() => (window as unknown as MapHook).__map.moving), { timeout: 20_000 })
    .toBe(false);
  return page.evaluate((id) => {
    const p = (window as unknown as MapHook).__map.screenOf(id);
    const r = document.querySelector('.map-host')?.getBoundingClientRect();
    return p?.visible && r ? { x: p.x + r.left, y: p.y + r.top } : null;
  }, id);
}

/** Ends the turn, past what needs you on a phone, and waits for the report. */
async function endTurn(page: Page, project: string) {
  const date = await page.locator('.map-date').textContent();
  if (isDesktop(project)) await page.keyboard.press('Enter');
  else {
    await page.getByRole('button', { name: /End turn/ }).tap();
    const needs = page.getByRole('dialog', { name: 'What needs you' });
    const report = page.getByRole('dialog', { name: 'Report' });
    await expect(needs.or(report)).toBeVisible();
    if (await needs.isVisible()) await needs.getByRole('button', { name: /End turn/ }).tap();
  }
  await expect(page.locator('.map-date')).not.toHaveText(date ?? '');
  await expect(page.getByRole('dialog', { name: 'Report' })).toBeVisible();
}

test('a first survey of Barnard’s Star: what astronomers have observed, and the inspiration it gives', async ({
  page,
}, info) => {
  test.slow();
  const project = info.project.name;
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('1');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });

  // The research screen names each technology's inspiration before it is met.
  if (isDesktop(project)) await page.keyboard.press('t');
  else await page.getByRole('button', { name: 'Research', exact: true }).tap();
  const research = page.getByRole('dialog', { name: 'Research' });
  await expect(research).toContainText('Inspirations: 0 of 33 met.');
  const magnetics = research.locator('[data-tech="magnetics"]');
  await expect(magnetics).toContainText('Inspired by surveying a catalogued flare star: 24 research');
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();

  // Petrel to Barnard’s Star, one lane from Sol: four planets, and a harsh world.
  if (isDesktop(project)) {
    await page
      .getByRole('complementary', { name: 'Your power' })
      .locator('.ships-list')
      .getByRole('button', { name: /Petrel/ })
      .click();
    await page.keyboard.press('f');
    const star = await starAt(page, 'barnard');
    if (!star) throw new Error('Barnard’s Star is off screen');
    await page.mouse.click(star.x, star.y, { button: 'right' });
  } else {
    await page.getByRole('button', { name: 'Empire', exact: true }).tap();
    const empire = page.getByRole('dialog', { name: 'Empire' });
    await empire.getByRole('tab', { name: /Ships/ }).tap();
    await empire.getByRole('button', { name: /Petrel/ }).tap();
    await page.getByRole('button', { name: 'Move', exact: true }).tap();
    const star = await starAt(page, 'barnard');
    if (!star) throw new Error('Barnard’s Star is off screen');
    await page.touchscreen.tap(star.x, star.y);
    await page.getByRole('button', { name: 'Confirm' }).tap();
  }
  await endTurn(page, project);
  const report = page.getByRole('dialog', { name: 'Report' });
  const observed = report.locator('.report-observed');
  await expect(observed).toContainText(
    "Observed at Barnard’s Star: astronomers have found Barnard's Star b, Barnard's Star c, Barnard's Star d and Barnard's Star e. 10 research.",
  );
  await expect(observed.locator('.badge')).toHaveText('Observed');
  await expect(report).toContainText(
    'An inspiration: surveying a harsh world taught us about Habitat domes, 12 research towards it.',
  );

  // The inspiration leads to the research screen, where it is met.
  await press(report.getByRole('button', { name: /^An inspiration: surveying a harsh world/ }), project);
  const screen = page.getByRole('dialog', { name: 'Research' });
  await expect(screen).toContainText('Inspirations: 1 of 33 met.');
  const domes = screen.locator('[data-tech="habitat-domes"]');
  await expect(domes).toContainText('Inspired by surveying a harsh world: +12');
  await expect(domes).toContainText('12 of 30');
});
