import { expect, type Locator, type Page, test } from '@playwright/test';

/** Governors and edicts (M2_WORLDS.md §25), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

async function newGame(page: Page, project: string, imperial = false) {
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  if (imperial) await press(page.getByLabel(/Imperial/), project);
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

test('an imperial start: the capital’s governor builds, and says why in the report', async ({ page }, info) => {
  const project = info.project.name;
  await newGame(page, project, true);
  const panel = await openEarth(page, project);
  const governor = panel.getByRole('region', { name: 'Governor' });
  await expect(governor.getByRole('button', { name: 'Balance' })).toHaveAttribute('aria-pressed', 'true');
  const report = await endTurn(page, project);
  await expect(report).toContainText('Earth’s governor queued hydroponics: its priority is balance.');
});

test('a governor set by hand leaves alone a district you zoned, until you let it', async ({ page }, info) => {
  const project = info.project.name;
  await newGame(page, project);
  const panel = await openEarth(page, project);
  const governor = panel.getByRole('region', { name: 'Governor' });
  await expect(governor.getByRole('button', { name: 'None' })).toHaveAttribute('aria-pressed', 'true');
  await press(governor.getByRole('button', { name: 'Research' }), project);
  await expect(governor.getByRole('button', { name: 'Research' })).toHaveAttribute('aria-pressed', 'true');
  await expect(governor).toContainText('Labs, for research.');

  const districts = panel.getByRole('region', { name: 'Districts' });
  await press(districts.getByRole('button', { name: /^District 7: Works/ }), project);
  await press(
    districts.getByRole('group', { name: 'District 7' }).getByRole('button', { name: 'Rezone for labs' }),
    project,
  );
  await expect(districts.getByRole('button', { name: /^District 7: .*, locked$/ })).toBeVisible();
  await expect(panel).toContainText('Rezone district 7 for labs');
  await press(districts.getByRole('button', { name: /^District 7:/ }), project);
  await press(districts.getByRole('button', { name: 'Let the governor have it' }), project);
  await expect(districts.getByRole('button', { name: /, locked$/ })).toHaveCount(0);
});

test('an edict: attention pays for a festival at a colony, for four turns', async ({ page }, info) => {
  const project = info.project.name;
  await newGame(page, project);
  const empire = await openEmpire(page, project);
  const edicts = empire.getByRole('region', { name: 'Edicts' });
  await expect(edicts).toContainText('Attention 2');
  await expect(edicts.getByRole('button', { name: 'Issue crash programme' })).toBeEnabled();
  await press(edicts.getByRole('button', { name: 'Choose a colony for festival' }), project);
  await press(
    edicts.getByRole('list', { name: 'Colonies for festival' }).getByRole('button', { name: 'Earth' }),
    project,
  );
  await expect(edicts).toContainText('Attention 0');
  await expect(edicts).toContainText('Festival at Earth · 4 turns left');
  await expect(edicts.getByRole('button', { name: 'Issue crash programme' })).toBeDisabled();
});
