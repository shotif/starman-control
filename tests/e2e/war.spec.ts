import { expect, type Locator, type Page, test } from '@playwright/test';

/** War and peace (M4_FLEETS.md §23), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface Contact {
  faction: string;
  stage: string;
  since: number;
  words: number;
}
interface GameHook {
  __game(): {
    turn: number;
    powers: { faction: string; controller: string; contacts: Contact[] }[];
    wars: { a: string; b: string; since: number }[];
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

/** Opens the diplomacy screen: Y on a desktop, the menu on a phone and a tablet. */
async function openDiplomacy(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('y');
  else {
    await page.getByRole('button', { name: 'Menu', exact: true }).tap();
    await page.getByRole('button', { name: 'Diplomacy', exact: true }).tap();
  }
  const screen = page.getByRole('dialog', { name: 'Diplomacy' });
  await expect(screen).toBeVisible();
  if (!isDesktop(project)) await screen.getByRole('button', { name: /^The Frontier Co-op/ }).tap();
  return screen.getByRole('region', { name: 'The Frontier Co-op' }).getByRole('region', { name: 'War and peace' });
}

async function close(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();
}

test('war declared on the Cooperative, and peace offered and made', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
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

  let war = await openDiplomacy(page, project);
  await expect(war).toContainText('At peace.');
  await expect(war).toContainText('They will remember it (−30)');
  await press(war.getByRole('button', { name: 'Declare war on the Frontier Co-op' }), project);
  await expect(war).toContainText('At war since Q1 2176, declared by us.');
  await close(page, project);
  const report = await endTurn(page, project);
  await expect(report).toContainText('We are at war with the Frontier Co-op: we declared it.');
  await close(page, project);

  // Six turns on, they have had enough of it.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    for (const war of g.wars) war.since = g.turn - 6;
    w.__setGame(g);
  });
  war = await openDiplomacy(page, project);
  await expect(war).toContainText('They have had enough of it: likely yes.');
  await press(war.getByRole('button', { name: 'Offer the Frontier Co-op peace' }), project);
  await expect(war).toContainText('Our offer of peace reaches them as the turn ends.');
  await close(page, project);
  const after = await endTurn(page, project);
  await expect(after).toContainText('The Frontier Co-op accepted our offer of peace.');
  await expect(after).toContainText('We have made peace with the Frontier Co-op');
  expect(errors).toEqual([]);
});
