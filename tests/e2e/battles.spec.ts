import { expect, type Locator, type Page, test } from '@playwright/test';

/** Battles (M4_FLEETS.md §24), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface Game {
  turn: number;
  nextShipId: number;
  nextFleetId: number;
  ships: Record<string, unknown>[];
  fleets: Record<string, unknown>[];
  wars: Record<string, unknown>[];
  powers: {
    faction: string;
    fleetsMade: number;
    contacts: Record<string, unknown>[];
    designs: { id: number; hull: string; retired: boolean }[];
  }[];
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

test('our squadron meets the Cooperative’s at war, and the report tells the battle and why', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // At war with the Cooperative: four of our frigates and one of theirs at Alpha Centauri.
  await page.evaluate(() => {
    const w = window as unknown as { __game(): Game; __setGame(g: unknown): void };
    const g = structuredClone(w.__game());
    const add = (owner: string, names: string[]) => {
      const p = g.powers.find((x) => x.faction === owner);
      const design = p?.designs.find((d) => d.hull === 'frigate' && !d.retired);
      if (!p || !design) return;
      const fleet = g.nextFleetId++;
      p.fleetsMade++;
      g.fleets.push({
        id: fleet,
        owner,
        name: owner === 'sta' ? '1st Squadron' : '1st Flotilla',
        destinations: [],
        hold: false,
        stance: owner === 'sta' ? 'engage' : 'defend',
        target: 'warships',
        retreat: 100,
      });
      for (const name of names)
        g.ships.push({
          id: g.nextShipId++,
          owner,
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
    };
    add('sta', ['Lance', 'Pike', 'Halberd', 'Glaive']);
    add('frontier', ['Rowan']);
    const sta = g.powers.find((p) => p.faction === 'sta');
    const coop = g.powers.find((p) => p.faction === 'frontier');
    sta?.contacts.push({ faction: 'frontier', stage: 'talk', since: 1, words: 20 });
    coop?.contacts.push({ faction: 'sta', stage: 'talk', since: 1, words: 20 });
    g.wars.push({ a: 'frontier', b: 'sta', since: 1, by: 'sta' });
    w.__setGame(g);
  });

  const report = await endTurn(page, project);
  const battle = report.locator('.report-battle');
  await expect(battle).toContainText('A battle at Alpha Centauri against the Frontier Co-op');
  await expect(battle).toContainText('We hold the system.');
  await expect(battle.getByRole('list', { name: 'Why it went so' })).toContainText(
    'We brought far more fire: 40 a round against their 10.',
  );
  // The Admiral speaks of it.
  await expect(report.getByRole('list', { name: 'Your advisors' })).toContainText('Helena Vasquez');
  expect(errors).toEqual([]);
});
