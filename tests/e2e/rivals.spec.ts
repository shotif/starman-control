import { expect, type Locator, type Page, test } from '@playwright/test';

/** Rivals that play (M2_WORLDS.md §26), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface MapHook {
  __map: { shipMarks: readonly { at: string | null; colour: string }[] };
}

async function newGame(page: Page, project: string, alone = false) {
  await page.goto('./?test#/new');
  await expect(page.locator('.ng-head')).toContainText('The other powers play too, as your rivals');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  if (alone) {
    await press(page.getByLabel(/Play alone/), project);
    await expect(page.locator('.ng-head')).toContainText('You play alone');
  }
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

async function closeEmpire(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('dialog', { name: 'Empire' }).getByRole('button', { name: 'Close' }).tap();
  await expect(page.getByRole('dialog', { name: 'Empire' })).toBeHidden();
}

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
  const report = page.getByRole('dialog', { name: 'Report' });
  await expect(report).toBeVisible();
  return report;
}

test('rivals: unseen at first; the Watch sees a Wake survey ship reach Sol, on the map, at Sol and in the standings', async ({
  page,
}, info) => {
  test.setTimeout(120_000);
  const project = info.project.name;
  await newGame(page, project);
  let empire = await openEmpire(page, project);
  await press(empire.getByRole('tab', { name: 'Powers 1' }), project);
  await expect(empire.locator('.standings')).toContainText(
    'Not yet seen: the Frontier Co-op, the Hollow Wake, the Dusk Concord and the Drift Moot.',
  );
  await closeEmpire(page, project);

  // With seed 42 and nothing ordered, a survey ship of the Hollow Wake reaches Sol in the ninth quarter.
  let report = await endTurn(page, project);
  for (let turn = 2; turn <= 9; turn++) report = await endTurn(page, project);
  const watch = report.getByRole('button', { name: 'The Watch: a Hollow Wake survey ship is at Sol.' });
  await expect(watch).toBeVisible();
  const marks = await page.evaluate(() => (window as unknown as MapHook).__map.shipMarks);
  expect(marks.filter((m) => m.at === 'sol').map((m) => m.colour)).toContain('#ff5f5f');

  await press(watch, project);
  const sol = isDesktop(project) ? page.locator('.map-inspector') : page.getByRole('dialog', { name: 'Sol' });
  await expect(sol.getByRole('heading', { name: 'Other powers’ ships here' })).toBeVisible();
  await expect(sol).toContainText('Hollow Wake survey ship');
  // Theirs is listed, never given orders.
  await expect(sol.getByRole('button', { name: /Hollow Wake survey ship/ })).toHaveCount(0);

  empire = await openEmpire(page, project);
  await press(empire.getByRole('tab', { name: 'Powers 2' }), project);
  const rows = empire.locator('.standings-table tbody tr');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1)).toContainText('Hollow Wake');
  // Science (M2B_SCIENCE.md §19.4): yours as a count, theirs ahead of you, level or behind.
  await expect(rows.nth(0)).toContainText('known');
  await expect(rows.nth(1)).toContainText(/ahead of us|level|behind/);
  await expect(empire.locator('.standings')).toContainText(
    'Not yet seen: the Frontier Co-op, the Dusk Concord and the Drift Moot.',
  );
});

test('play alone: no other power in play, and no Powers tab', async ({ page }, info) => {
  const project = info.project.name;
  await newGame(page, project, true);
  const empire = await openEmpire(page, project);
  await expect(empire.getByRole('tab', { name: /Colonies/ })).toBeVisible();
  await expect(empire.getByRole('tab', { name: /Powers/ })).toHaveCount(0);
});
