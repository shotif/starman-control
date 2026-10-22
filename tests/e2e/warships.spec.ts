import { expect, type Locator, type Page, test } from '@playwright/test';

/** Warships and their designs (M4_FLEETS.md §21), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

async function newGame(page: Page, project: string) {
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
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

test('a design made in the designer, queued at the capital and built', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await newGame(page, project);
  // Plenty to build with, so the frigate is built as the turn ends.
  await page.evaluate(() => {
    const w = window as unknown as {
      __game(): {
        powers: { faction: string; stockpile: Record<string, number> }[];
        holdings: { owner: string; capital: boolean; industry: number }[];
      };
      __setGame(g: unknown): void;
    };
    const g = structuredClone(w.__game());
    const sta = g.powers.find((p) => p.faction === 'sta');
    if (sta) sta.stockpile = { metals: 500, volatiles: 500, fuel: 500 };
    const capital = g.holdings.find((h) => h.owner === 'sta' && h.capital);
    if (capital) capital.industry = 60;
    w.__setGame(g);
  });

  // The designs: B on a desktop, the Empire's Ships tab on a phone and a tablet.
  if (isDesktop(project)) await page.keyboard.press('b');
  else {
    await page.getByRole('button', { name: 'Empire', exact: true }).tap();
    const empire = page.getByRole('dialog', { name: 'Empire' });
    await empire.getByRole('tab', { name: /^Ships/ }).tap();
    await empire.getByRole('button', { name: 'Designs', exact: true }).tap();
  }
  const designs = page.getByRole('dialog', { name: 'Designs' });
  await expect(designs).toBeVisible();
  await expect(designs.getByRole('region', { name: 'Frigate designs' })).toContainText('Frigate Mark I');
  await press(designs.getByRole('button', { name: 'New frigate design' }), project);
  const maker = designs.getByRole('region', { name: 'A new frigate design' });
  await maker.getByRole('textbox').fill('Lancer');
  await maker.getByLabel('Place 3').selectOption('armour-1');
  await expect(maker).toContainText('Structure 28');
  await press(maker.getByRole('button', { name: 'Save design' }), project);
  await expect(designs.getByRole('region', { name: 'Frigate designs' })).toContainText('our own design');
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();

  // Queued at Earth, from the Empire.
  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const empire = page.getByRole('dialog', { name: 'Empire' });
  if (!isDesktop(project)) await empire.getByRole('tab', { name: /^Colonies/ }).tap();
  await press(empire.getByRole('button', { name: /^Earth/ }).first(), project);
  const panel = isDesktop(project) ? page.locator('.map-inspector') : page.getByRole('dialog', { name: 'Earth' });
  const lancer = panel.getByRole('button', { name: 'Queue a Lancer' });
  await expect(lancer).toContainText('Frigate: attack 10, shields 0, structure 28.');
  await press(lancer, project);
  await expect(panel.locator('.queue-list, .queue-table').first()).toContainText('Lancer');

  const report = await endTurn(page, project);
  await expect(report).toContainText(/Earth built a Lancer, the \w+/);
  expect(errors).toEqual([]);
});
