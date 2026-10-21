import { expect, type Locator, type Page, test } from '@playwright/test';

/** Districts, food, credits and approval (M2_WORLDS.md §2 to §5, §14), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

async function newGame(page: Page, project: string) {
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
}

async function openEmpire(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const empire = page.getByRole('dialog', { name: 'Empire' });
  await expect(empire).toBeVisible();
  return empire;
}

async function openEarth(page: Page, project: string) {
  const empire = await openEmpire(page, project);
  await press(empire.getByRole('button', { name: /^Earth/ }).first(), project);
  return isDesktop(project) ? page.locator('.map-inspector') : page.getByRole('dialog', { name: 'Earth' });
}

/** Ends the turn, past what needs you on a phone, and closes the report once it has opened. */
async function endTurn(page: Page, project: string) {
  const date = await page.locator('.map-date').textContent();
  if (isDesktop(project)) await page.keyboard.press('Enter');
  else {
    if (await page.getByRole('dialog', { name: 'Earth' }).isVisible())
      await page.getByRole('button', { name: 'Close' }).first().tap();
    await page.getByRole('button', { name: /End turn/ }).tap();
    const needs = page.getByRole('dialog', { name: 'What needs you' });
    const report = page.getByRole('dialog', { name: 'Report' });
    await expect(needs.or(report)).toBeVisible();
    if (await needs.isVisible()) await needs.getByRole('button', { name: /End turn/ }).tap();
  }
  await expect(page.locator('.map-date')).not.toHaveText(date ?? '');
  const report = page.getByRole('dialog', { name: 'Report' });
  await expect(report).toBeVisible();
  return report;
}

test('the capital’s districts: rezone one, and the report says when it is done', async ({ page }, info) => {
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await newGame(page, project);
  // The top bar has the treasury and the food in store as well as the stockpile.
  const bar = page.getByLabel('Stockpile, and what it gains a turn');
  await expect(bar.locator('.res-credits')).toContainText('50');
  await expect(bar.locator('.res-food')).toContainText('5');

  let panel = await openEarth(page, project);
  await expect(panel).toContainText('Industry 12 = 9 from 3 works + 2 from the capital + 1 from Administration (+10%)');
  await expect(panel).toContainText('70 · Content');
  const districts = panel.getByRole('region', { name: 'Districts' });
  await expect(districts).toContainText('10 of 10 zoned');
  await expect(districts.getByRole('button', { name: /^District \d+:/ })).toHaveCount(10);

  // District 7, works, rezoned for labs: 20 industry and 5 metals, in the queue.
  await press(districts.getByRole('button', { name: /^District 7: Works/ }), project);
  const choices = districts.getByRole('group', { name: 'District 7' });
  await expect(choices.getByRole('button', { name: 'Rezone for mines' })).toBeEnabled();
  await press(choices.getByRole('button', { name: 'Rezone for labs' }), project);
  await expect(panel).toContainText('Rezone district 7 for labs');
  await expect(
    districts.getByRole('button', { name: /^District 7: Works, 3 industry, being zoned for labs/ }),
  ).toBeVisible();

  // 20 industry at 12 a turn: done when the second turn ends.
  let report = await endTurn(page, project);
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await report.getByRole('button', { name: 'Close' }).first().tap();
  await expect(report).toBeHidden();
  report = await endTurn(page, project);
  await expect(report).toContainText('Earth rezoned district 7 for labs.');
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await report.getByRole('button', { name: 'Close' }).first().tap();
  await expect(report).toBeHidden();
  panel = await openEarth(page, project);
  await expect(panel.getByRole('region', { name: 'Districts' })).toContainText('Labs');
  expect(errors).toEqual([]);
});

test('the treasury: taxes change approval, and overdrive buys industry', async ({ page }, info) => {
  const project = info.project.name;
  await newGame(page, project);
  const empire = await openEmpire(page, project);
  const treasury = empire.getByRole('region', { name: 'Treasury and food' });
  await expect(treasury).toContainText('Treasury 50 credits');
  await expect(treasury).toContainText('+1 a turn = 8 taxes and markets, −7 upkeep');
  await expect(treasury).toContainText('Food 5 in store');
  const taxes = treasury.getByRole('group', { name: 'Taxes' });
  await expect(taxes.getByRole('button', { name: 'Standard' })).toHaveAttribute('aria-pressed', 'true');
  await press(taxes.getByRole('button', { name: 'Low' }), project);
  await expect(taxes.getByRole('button', { name: 'Low' })).toHaveAttribute('aria-pressed', 'true');
  await expect(treasury).toContainText('−2 a turn');

  // Earth is happier at low taxes, and buys a quarter more industry for 3 credits.
  await press(empire.getByRole('button', { name: /^Earth/ }).first(), project);
  const panel = isDesktop(project) ? page.locator('.map-inspector') : page.getByRole('dialog', { name: 'Earth' });
  await expect(panel).toContainText('80 · Content');
  const overdrive = panel.getByRole('group', { name: 'Overdrive' });
  await press(overdrive.getByRole('button', { name: '+3 for 3' }), project);
  await expect(overdrive.getByRole('button', { name: '+3 for 3' })).toHaveAttribute('aria-pressed', 'true');
  await expect(panel).toContainText('Industry 15 =');
  await expect(panel).toContainText('3 bought for 3 credits');
});
