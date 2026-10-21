import { expect, type Locator, type Page, test } from '@playwright/test';

/** The guided opening (M2_WORLDS.md §28), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

async function newGame(page: Page, project: string, seed = '42') {
  await page.goto('./?test&guide#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill(seed);
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
}

async function openMenu(page: Page, project: string) {
  await press(page.getByRole('button', { name: 'Menu', exact: true }), project);
  return page.getByRole('dialog', { name: 'Menu' });
}

test('a first game is guided step by step, each done by doing it; skipped, stopped, and asked for again', async ({
  page,
}, info) => {
  const project = info.project.name;
  await newGame(page, project);
  const card = page.getByRole('complementary', { name: 'Guide' });
  await expect(card).toContainText('step 1 of 11');
  await expect(card).toContainText('Control, this is our capital. Open it to see its districts and what it builds.');

  // The capital, lit by the ring, opened from the empire.
  if (isDesktop(project)) {
    const lit = page.getByRole('complementary', { name: 'Your power' }).locator('[data-guide="capital"]');
    await expect(lit).toHaveCSS('outline-style', 'solid');
    await lit.click();
  } else {
    await page.getByRole('button', { name: 'Empire', exact: true }).tap();
    await page.getByRole('dialog', { name: 'Empire' }).locator('[data-guide="capital"]').first().tap();
  }
  await expect(card).toContainText('step 2 of 11');
  await expect(card).toContainText('The works are waiting');
  await press(card.getByRole('button', { name: 'Skip' }), project);
  await expect(card).toContainText('step 3 of 11');
  await press(card.getByRole('button', { name: 'Stop guiding' }), project);
  await expect(card).toHaveCount(0);

  // Menu → Guide me brings it back, at the first step not done.
  if (!isDesktop(project) && (await page.getByRole('button', { name: 'Close' }).first().isVisible()))
    await page.getByRole('button', { name: 'Close' }).first().tap();
  const menu = await openMenu(page, project);
  await press(menu.getByRole('button', { name: 'Guide me' }), project);
  await expect(card).toContainText('step 2 of 11');
});

test('a second game is not guided once the first guide has been stopped', async ({ page }, info) => {
  const project = info.project.name;
  await newGame(page, project);
  const card = page.getByRole('complementary', { name: 'Guide' });
  await press(card.getByRole('button', { name: 'Stop guiding' }), project);
  await newGame(page, project, '7');
  await expect(card).toHaveCount(0);
});
