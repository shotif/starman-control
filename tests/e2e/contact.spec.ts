import { expect, type Locator, type Page, test } from '@playwright/test';

/** Contact (M3_NEIGHBOURS.md §19), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface GameHook {
  __game(): {
    powers: { faction: string; controller: string }[];
    ships: { owner: string; type: string; at: string | null; destinations: string[] }[];
  };
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

test('first contact: a Wake ship at Sol, the Envoy’s word, and the standings', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // A Wake survey ship at Sol, its power holding its orders for a turn.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const wake = g.powers.find((p) => p.faction === 'hollow-wake');
    const ship = g.ships.find((s) => s.owner === 'hollow-wake' && s.type === 'survey');
    if (!wake || !ship) return;
    wake.controller = 'player';
    ship.at = 'sol';
    ship.destinations = [];
    w.__setGame(g);
  });
  const report = await endTurn(page, project);
  await expect(report).toContainText(
    'First contact: the Hollow Wake, seen at Sol. They share our tongue, so we can talk.',
  );
  await expect(report).toContainText('Isabel Achterberg');
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();

  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const powers = page.getByRole('dialog', { name: 'Empire' });
  await press(powers.getByRole('tab', { name: /^Powers/ }), project);
  const wake = powers.locator('.standings-table tbody tr').filter({ hasText: 'Hollow Wake' });
  await expect(wake.locator('.standing-contact')).toHaveText('we can talk');
});
