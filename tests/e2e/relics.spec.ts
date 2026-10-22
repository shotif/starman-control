import { expect, type Locator, type Page, test } from '@playwright/test';

/** Relic sites (M5_UNKNOWN.md §20), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface GameHook {
  __game(): {
    nextHoldingId: number;
    holdings: Record<string, unknown>[];
    powers: { faction: string; surveyed: string[]; researched: string[]; digShare: number }[];
    digs: { system: string; progress: number }[];
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

/** Opens Relics: J on a desktop, the menu on a phone and a tablet. */
async function openRelics(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('j');
  else {
    await page.getByRole('button', { name: 'Menu', exact: true }).tap();
    await page.getByRole('button', { name: 'Relics', exact: true }).tap();
  }
  const screen = page.getByRole('dialog', { name: 'Relics' });
  await expect(screen).toBeVisible();
  return screen;
}

async function close(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();
}

/** Changes the game as the test hook allows. */
async function change(page: Page, how: 'site' | 'nearly') {
  await page.evaluate((how) => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const sta = g.powers.find((p) => p.faction === 'sta');
    if (!sta) return;
    if (how === 'site') {
      // We have surveyed Sirius, a hall of charts in this game, learnt Relic studies and hold an outpost there.
      sta.surveyed = [...sta.surveyed, 'sirius'].sort();
      sta.researched.push('relic-studies');
      g.holdings.push({
        id: g.nextHoldingId,
        owner: 'sta',
        kind: 'outpost',
        system: 'sirius',
        body: 'sirius:2',
        capital: false,
        people: 0,
        projects: [],
        queue: [],
        industry: 0,
        districts: [],
        hungry: 0,
        overdrive: 0,
        governor: null,
        locked: [],
        terraform: 0,
        taken: 0,
      });
      g.nextHoldingId++;
    }
    if (how === 'nearly') {
      sta.digShare = 50;
      for (const d of g.digs) d.progress = 149;
    }
    w.__setGame(g);
  }, how);
}

test('a relic site found, excavated, its chapter chosen, and the Absent in the journal', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });

  // Nothing known yet.
  let relics = await openRelics(page, project);
  await expect(relics).toContainText('We cannot excavate yet: it needs Relic studies, in Xenology.');
  await expect(relics).toContainText('None yet.');
  await close(page, project);

  // The site at Sirius, known and held: we excavate it.
  await change(page, 'site');
  relics = await openRelics(page, project);
  const row = relics.getByRole('listitem').filter({ hasText: 'Sirius' });
  await expect(row).toContainText('A hall of charts');
  await expect(row).toContainText('Not yet excavated.');
  await press(row.getByRole('button', { name: 'Excavate' }), project);
  await expect(row).toContainText('We excavate it: chapter 1, 0 of 100 research.');
  await expect(relics.getByRole('button', { name: 'A quarter' })).toHaveAttribute('aria-pressed', 'true');
  await close(page, project);

  // The first chapter done as the turn ends, with the first revelation.
  await change(page, 'nearly');
  let report = await endTurn(page, project);
  await expect(report).toContainText('Chapter 1 of a hall of charts at Sirius is done.');
  await expect(report).toContainText('The Absent: Someone was here before us.');
  await close(page, project);

  // Its choice: we follow the charts.
  relics = await openRelics(page, project);
  const waiting = relics.getByRole('region', { name: 'Chapter 1 at Sirius' });
  await expect(waiting).toContainText('The points are stars');
  const follow = waiting.getByRole('button', { name: /Follow the charts/ });
  await press(follow, project);
  await expect(follow).toHaveAttribute('aria-pressed', 'true');
  await close(page, project);
  report = await endTurn(page, project);
  await expect(report).toContainText(/We followed its charts: 3 systems surveyed, .+, from chapter 1 at Sirius\./);
  await close(page, project);

  // The journal keeps the revelation; the site stands in its system's panel.
  relics = await openRelics(page, project);
  await expect(relics.getByRole('list').last()).toContainText('Someone was here before us.');
  await press(
    relics.getByRole('listitem').filter({ hasText: 'A hall of charts' }).getByRole('button', { name: 'Sirius' }),
    project,
  );
  const site = page.getByRole('region', { name: 'Relic site' });
  await expect(site).toBeVisible();
  await expect(site).toContainText('A hall of charts');
  await expect(site).toContainText('We excavate it: chapter 2');
  expect(errors).toEqual([]);
});
