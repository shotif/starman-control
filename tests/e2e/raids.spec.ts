import { expect, type Locator, type Page, test } from '@playwright/test';

/** Raids (M4_FLEETS.md §27), on a phone, a tablet and a desktop. */

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

test('leading the Hollow Wake, our pack raids a Cooperative colony without war, and the report tells the plunder', async ({
  page,
}, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Hollow Wake' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // At peace with the Cooperative, which holds Proxima Centauri b; two frigates of ours there.
  await page.evaluate(() => {
    const w = window as unknown as { __game(): Game; __setGame(g: unknown): void };
    const g = structuredClone(w.__game());
    const sta = g.powers.find((p) => p.faction === 'hollow-wake') as
      | (Game['powers'][number] & { designs: { id: number; hull: string; retired: boolean }[] })
      | undefined;
    const coop = g.powers.find((p) => p.faction === 'frontier');
    const capital = g.holdings.find((h) => h.capital && h.owner === 'frontier');
    if (!sta || !coop || !capital) return;
    sta.contacts.push({ faction: 'frontier', stage: 'talk', since: 1, words: 20 });
    coop.contacts.push({ faction: 'hollow-wake', stage: 'talk', since: 1, words: 20 });
    const design = sta.designs.find((d) => d.hull === 'frigate' && !d.retired);
    if (!design) return;
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
      owner: 'hollow-wake',
      name: '1st Pack',
      destinations: [],
      hold: false,
      stance: 'defend',
      target: 'warships',
      retreat: 50,
      mission: null,
    });
    for (const name of ['Hyena', 'Ember'])
      g.ships.push({
        id: g.nextShipId++,
        owner: 'hollow-wake',
        type: 'frigate',
        name,
        at: 'alpha-centauri',
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

  // The 1st Pack, from the Empire's list of fleets: Raid.
  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const empire = page.getByRole('dialog', { name: 'Empire' });
  await press(empire.getByRole('tab', { name: /^Ships/ }), project);
  await press(empire.getByRole('button', { name: /^1st Pack/ }), project);
  const panel = isDesktop(project) ? page.locator('.map-inspector') : page.getByRole('dialog', { name: '1st Pack' });
  const fleet = panel.getByRole('article', { name: '1st Pack' });
  await expect(fleet).toContainText('2 warships');
  const missions = fleet.getByRole('region', { name: 'Missions' });
  await expect(missions).toContainText('A raid takes its credits each turn');
  // Not war: no invasion, no bombardment.
  await expect(missions.getByRole('button', { name: /^Invade/ })).toHaveCount(0);
  await press(missions.getByRole('button', { name: 'Raid Proxima Centauri b' }), project);
  await expect(fleet).toContainText('Raiding Proxima Centauri b at Alpha Centauri');

  const report = await endTurn(page, project);
  await expect(report).toContainText('The 1st Pack raided the Frontier Co-op’s Proxima Centauri b and took');
  const memories = await page.evaluate(
    () =>
      (window as unknown as { __game(): { powers: { faction: string; memories: { kind: string }[] }[] } })
        .__game()
        .powers.find((p) => p.faction === 'frontier')
        ?.memories.map((m) => m.kind) ?? [],
  );
  expect(memories).toContain('raided');
  expect(errors).toEqual([]);
});
