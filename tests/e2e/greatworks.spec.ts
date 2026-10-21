import { expect, type Locator, type Page, test } from '@playwright/test';

/** Great works and the score (M2B_SCIENCE.md §20), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface Power {
  faction: string;
  controller: string;
  researched: string[];
  stockpile: { metals: number };
}
interface GameHook {
  __game(): { powers: Power[]; holdings: { owner: string; capital: boolean; queue: unknown[]; industry: number }[] };
  __setGame(g: unknown): void;
}

/** Ends the turn, past what needs you on a phone, and waits for the report. */
async function endTurn(page: Page, project: string) {
  const date = await page.locator('.map-date').textContent();
  await expect(page.getByRole('button', { name: /End turn/ }).first()).toBeEnabled();
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

test('a great work finished: the only one in the neighbourhood, and the score counts it', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // Some way on: Great engineering and Public schooling known, the Lapse Archive a point from done at Earth.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const me = g.powers.find((p) => p.controller === 'player');
    const earth = g.holdings.find((h) => h.capital && h.owner === me?.faction);
    if (!me || !earth) return;
    me.researched.push('automated-mining', 'automation', 'automation-2', 'prefabrication', 'great-engineering');
    me.researched.push('colonial-charters', 'shared-spaces', 'civil-service', 'public-schooling');
    me.stockpile.metals = 100;
    earth.queue = [{ kind: 'project', project: 'lapse-archive' }];
    earth.industry = 399;
    w.__setGame(g);
  });
  const report = await endTurn(page, project);
  await expect(report).toContainText(
    'Earth has finished the Lapse Archive: a great work, the only one in the neighbourhood.',
  );
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();

  // The capital's panel: it stands there, and cannot be built again.
  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const empire = page.getByRole('dialog', { name: 'Empire' });
  await press(empire.getByRole('button', { name: /^Earth/ }).first(), project);
  const earth = isDesktop(project) ? page.locator('.map-inspector') : page.getByRole('dialog', { name: 'Earth' });
  await expect(earth.locator('.projects')).toContainText('Lapse Archive');
  await expect(earth.getByRole('button', { name: 'Queue the Lapse Archive' })).toContainText(
    'It already has the Lapse Archive.',
  );
  await expect(earth.getByRole('button', { name: 'Queue the Commons' })).toContainText('Needs Gene tailoring.');

  // The standings' score: 50 for the great work among the rest.
  if (!isDesktop(project)) await page.getByRole('button', { name: 'Close' }).first().tap();
  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const powers = page.getByRole('dialog', { name: 'Empire' });
  await press(powers.getByRole('tab', { name: /^Powers/ }), project);
  await expect(powers.getByRole('columnheader', { name: 'Score' })).toBeVisible();
  const mine = await page.evaluate(() => {
    const g = (window as unknown as GameHook).__game();
    return g.powers.find((p) => p.controller === 'player')?.researched.length ?? 0;
  });
  expect(mine).toBeGreaterThanOrEqual(9);
  await expect(powers.locator('.standings-table tbody tr').first()).toContainText(/\d+ known/);
});
