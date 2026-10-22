import { expect, type Locator, type Page, test } from '@playwright/test';

/** Defences and invasion (M4_FLEETS.md §26), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface Holding {
  id: number;
  owner: string;
  capital: boolean;
  system: string;
  districts: unknown[];
}

interface Game {
  nextShipId: number;
  nextFleetId: number;
  nextHoldingId: number;
  ships: Record<string, unknown>[];
  fleets: Record<string, unknown>[];
  holdings: Holding[];
  wars: Record<string, unknown>[];
  powers: { faction: string; fleetsMade: number; contacts: Record<string, unknown>[]; surveyed: string[] }[];
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

test('our transports invade a Cooperative colony at war, and the report tells it with radio traffic', async ({
  page,
}, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // At war with the Cooperative, which holds Proxima Centauri b; three transports of ours there.
  await page.evaluate(() => {
    const w = window as unknown as { __game(): Game; __setGame(g: unknown): void };
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
      people: 20,
      queue: [],
      projects: [],
      districts: capital.districts.slice(0, 2),
      governor: null,
      taken: 0,
    } as Holding);
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
    for (const name of ['Petrel', 'Fulmar', 'Shearwater'])
      g.ships.push({
        id: g.nextShipId++,
        owner: 'sta',
        type: 'transport',
        name,
        at: 'alpha-centauri',
        destinations: [],
        blindJump: null,
        hold: false,
        autoSurvey: false,
        founding: null,
        investigating: null,
        design: null,
        fleet,
        damage: 0,
      });
    g.wars.push({ a: 'frontier', b: 'sta', since: 1, by: 'sta' });
    w.__setGame(g);
  });

  // The 1st Squadron, from the Empire's list of fleets: Invade.
  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const empire = page.getByRole('dialog', { name: 'Empire' });
  await press(empire.getByRole('tab', { name: /^Ships/ }), project);
  await press(empire.getByRole('button', { name: /^1st Squadron/ }), project);
  const panel = isDesktop(project)
    ? page.locator('.map-inspector')
    : page.getByRole('dialog', { name: '1st Squadron' });
  const fleet = panel.getByRole('article', { name: '1st Squadron' });
  await expect(fleet).toContainText('3 transports');
  const missions = fleet.getByRole('region', { name: 'Missions' });
  await expect(missions).toContainText('Our 15 troops against a garrison of 4.');
  await press(missions.getByRole('button', { name: 'Invade Proxima Centauri b' }), project);
  await expect(missions).toContainText('Invading Proxima Centauri b as the turn ends');
  await expect(fleet).toContainText('Invading Proxima Centauri b at Alpha Centauri');

  const report = await endTurn(page, project);
  await expect(report).toContainText('Our troops took Proxima Centauri b from the Frontier Co-op');
  const radio = report.getByRole('list', { name: 'Radio traffic' });
  await expect(radio).toContainText('Landing group commander');
  await expect(radio).toContainText('Proxima Centauri b is secure, Control.');
  // The report's picture is the invasion's.
  await expect(report.locator('.dispatch-art')).toHaveAttribute('data-picture', 'dispatch-invasion');
  const owner = await page.evaluate(
    () => (window as unknown as { __game(): Game }).__game().holdings.find((h) => h.system === 'alpha-centauri')?.owner,
  );
  expect(owner).toBe('sta');
  expect(errors).toEqual([]);
});
