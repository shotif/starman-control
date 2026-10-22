import { expect, type Locator, type Page, test } from '@playwright/test';

/** Borders and trade (M3_NEIGHBOURS.md §22), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface Contact {
  faction: string;
  stage: string;
  since: number;
  words: number;
}
interface Holding {
  id: number;
  owner: string;
  capital: boolean;
  system: string;
  body: string;
  people: number;
  queue: unknown[];
  projects: string[];
  districts: unknown[];
  governor: unknown;
}
interface GameHook {
  __game(): {
    powers: { faction: string; controller: string; contacts: Contact[]; surveyed: string[] }[];
    holdings: Holding[];
    nextHoldingId: number;
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
  return screen;
}

/** Opens Barnard's Star's panel from the search. */
async function barnard(page: Page, project: string) {
  if (!isDesktop(project)) {
    await page.getByRole('button', { name: 'Menu', exact: true }).tap();
    await page.getByRole('button', { name: 'Find a system' }).tap();
  }
  await page.getByPlaceholder('Find a system').fill('barnard');
  await press(page.locator('.search-results').getByRole('button', { name: /Barnard/ }), project);
  const panel = isDesktop(project)
    ? page.getByRole('complementary', { name: 'Selected system' })
    : page.getByRole('dialog', { name: 'Barnard’s Star' });
  await expect(panel.getByRole('heading', { name: 'Barnard’s Star' })).toBeVisible();
  return panel;
}

test('a contested system, a border treaty and a trade agreement', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // The Authority and the Cooperative can talk, and the Cooperative has a colony at Alpha Centauri,
  // one old lane from Barnard's Star, as Sol is.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const sta = g.powers.find((p) => p.faction === 'sta');
    const coop = g.powers.find((p) => p.faction === 'frontier');
    const capital = g.holdings.find((h) => h.capital && h.owner === 'frontier');
    if (!sta || !coop || !capital) return;
    sta.contacts.push({ faction: 'frontier', stage: 'talk', since: 1, words: 20 });
    coop.contacts.push({ faction: 'sta', stage: 'talk', since: 1, words: 20 });
    sta.surveyed.push('alpha-centauri');
    sta.surveyed.sort();
    g.holdings.push({
      ...structuredClone(capital),
      id: g.nextHoldingId++,
      capital: false,
      system: 'alpha-centauri',
      body: 'proxima-cen-b',
      people: 10,
      queue: [],
      projects: [],
      districts: capital.districts.slice(0, 2),
      governor: null,
    });
    w.__setGame(g);
  });

  let panel = await barnard(page, project);
  const claim = panel.locator('.claim');
  await expect(claim).toContainText('Contested');
  await expect(claim).toContainText('Transit Authority');
  await expect(claim).toContainText('Frontier Co-op');
  if (!isDesktop(project)) await page.getByRole('button', { name: 'Close' }).first().tap();

  let screen = await openDiplomacy(page, project);
  if (!isDesktop(project)) await screen.getByRole('button', { name: /^The Frontier Co-op/ }).tap();
  const detail = screen.getByRole('region', { name: 'The Frontier Co-op' });
  await press(detail.getByRole('button', { name: 'Offer the Frontier Co-op a border treaty' }), project);
  await press(detail.getByRole('button', { name: 'Offer the Frontier Co-op a trade agreement' }), project);
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();

  const report = await endTurn(page, project);
  await expect(report).toContainText('We have a border treaty with the Frontier Co-op now');
  await expect(report).toContainText('We have a trade agreement with the Frontier Co-op now');
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();

  // Barnard's Star is ours by the border treaty: Sol is nearer than Alpha Centauri.
  panel = await barnard(page, project);
  await expect(panel.locator('.claim')).toContainText('Claimed by');
  await expect(panel.locator('.claim')).toContainText('by a border treaty');
  if (!isDesktop(project)) await page.getByRole('button', { name: 'Close' }).first().tap();

  // Trade in the treasury.
  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const treasury = page.getByRole('region', { name: 'Treasury and food' });
  await expect(treasury).toContainText('trade with the Frontier Co-op');
  screen = page.getByRole('dialog', { name: 'Empire' });
  await expect(screen).toBeVisible();
});
