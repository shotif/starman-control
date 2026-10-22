import { expect, type Locator, type Page, test } from '@playwright/test';

/** Rivals at war (M4_FLEETS.md §28), on a phone, a tablet and a desktop. */

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
    nextShipId: number;
    nextFleetId: number;
    ships: Record<string, unknown>[];
    fleets: Record<string, unknown>[];
    powers: {
      faction: string;
      controller: string;
      contacts: Contact[];
      fleetsMade: number;
      capital: string;
      memories: Record<string, unknown>[];
      designs: { id: number; hull: string; retired: boolean }[];
    }[];
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
  if (!isDesktop(project)) await screen.getByRole('button', { name: /^The Transit Authority/ }).tap();
  return screen.getByRole('region', { name: 'The Transit Authority' }).getByRole('region', { name: 'War and peace' });
}

async function close(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();
}

test('the Authority declares war on us for our raids, with its reason, and we surrender', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Frontier Co-op' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // The Authority remembers a raid of ours, and holds three warships at Sol.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const sta = g.powers.find((p) => p.faction === 'sta');
    const coop = g.powers.find((p) => p.faction === 'frontier');
    const design = sta?.designs.find((d) => d.hull === 'frigate' && !d.retired);
    if (!sta || !coop || !design) return;
    sta.contacts.push({ faction: 'frontier', stage: 'talk', since: 1, words: 20 });
    coop.contacts.push({ faction: 'sta', stage: 'talk', since: 1, words: 20 });
    // A turn on which the rivals look for a war (every five).
    g.turn = 5;
    sta.memories.push({ faction: 'frontier', kind: 'raided', amount: -10, turn: 5, system: sta.capital });
    const fleet = g.nextFleetId++;
    sta.fleetsMade++;
    g.fleets.push({
      id: fleet,
      owner: 'sta',
      name: '1st Squadron',
      destinations: [],
      hold: false,
      stance: 'defend',
      target: 'warships',
      retreat: 50,
      mission: null,
    });
    for (const name of ['Bastion', 'Redoubt', 'Barbican'])
      g.ships.push({
        id: g.nextShipId++,
        owner: 'sta',
        type: 'frigate',
        name,
        at: sta.capital,
        destinations: [],
        blindJump: null,
        hold: false,
        autoSurvey: false,
        founding: null,
        investigating: null,
        design: design.id,
        fleet,
        damage: 0,
      });
    w.__setGame(g);
  });

  const report = await endTurn(page, project);
  await expect(report).toContainText('The Transit Authority has declared war on us: “you raided us”.');
  await close(page, project);

  // We surrender: the cost is said first.
  let war = await openDiplomacy(page, project);
  await expect(war).toContainText('declared by the Transit Authority: “you raided us”.');
  await expect(war).toContainText('a fifth of our taxes to them as tribute');
  await press(war.getByRole('button', { name: 'Surrender to the Transit Authority' }), project);
  await expect(war).toContainText('Our surrender reaches them as the turn ends.');
  await close(page, project);
  const after = await endTurn(page, project);
  await expect(after).toContainText(
    'We have surrendered to the Transit Authority: we pay them tribute and fight their wars.',
  );
  await close(page, project);
  war = await openDiplomacy(page, project);
  await expect(war).toContainText('We are subdued by the Transit Authority');
  expect(errors).toEqual([]);
});
