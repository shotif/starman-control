import { expect, type Locator, type Page, test } from '@playwright/test';

/** Memory and the diplomacy screen (M3_NEIGHBOURS.md §20), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface Contact {
  faction: string;
  stage: string;
  since: number;
  words: number;
}
interface GameHook {
  __game(): { powers: { faction: string; controller: string; contacts: Contact[] }[] };
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

/** Opens the diplomacy screen: Y on a desktop, the menu on a phone and a tablet. */
async function openDiplomacy(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('y');
  else {
    await page.getByRole('button', { name: 'Menu', exact: true }).tap();
    await page.getByRole('button', { name: 'Diplomacy', exact: true }).tap();
  }
  const screen = page.getByRole('dialog', { name: 'Diplomacy' });
  await expect(screen).toBeVisible();
  return screen;
}

test('a gift from the diplomacy screen, remembered with its reason', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // The Authority and the Cooperative have met, and can talk.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const sta = g.powers.find((p) => p.faction === 'sta');
    const coop = g.powers.find((p) => p.faction === 'frontier');
    if (!sta || !coop) return;
    sta.contacts.push({ faction: 'frontier', stage: 'talk', since: 1, words: 20 });
    coop.contacts.push({ faction: 'sta', stage: 'talk', since: 1, words: 20 });
    w.__setGame(g);
  });

  let screen = await openDiplomacy(page, project);
  await expect(screen).toContainText('Isabel Achterberg');
  await expect(screen).toContainText('Not yet heard: the Hollow Wake and the Dusk Concord.');
  const coop = screen.getByRole('button', { name: 'The Frontier Co-op: warm' });
  await expect(coop).toContainText('we can talk');
  if (!isDesktop(project)) await coop.tap();
  const detail = screen.getByRole('region', { name: 'The Frontier Co-op' });
  await expect(detail).toContainText('Their regard for us: warm (+10)');
  await expect(detail.getByRole('list', { name: 'Why' })).toContainText('Of our own kind');
  await press(detail.getByRole('button', { name: 'Send the Frontier Co-op a gift of 50 credits' }), project);
  await expect(detail).toContainText('Our gift of 50 credits leaves as the turn ends.');
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();

  const report = await endTurn(page, project);
  await expect(report).toContainText('The Envoy took our gift of 50 credits to the Frontier Co-op.');
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();

  screen = await openDiplomacy(page, project);
  if (!isDesktop(project)) await screen.getByRole('button', { name: /^The Frontier Co-op/ }).tap();
  const after = screen.getByRole('region', { name: 'The Frontier Co-op' });
  await expect(after).toContainText('Their regard for us: warm (+20)');
  await expect(after.getByRole('list', { name: 'Why' })).toContainText('Remembers our gift of 50 credits');
});
