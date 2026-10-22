import { expect, type Locator, type Page, test } from '@playwright/test';

/** The keys of the Absent and the Answer (M5_UNKNOWN.md §21), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

/** The five key sites in the game of seed 42, each with a world of its own to hold. */
const KEYS: readonly [string, string][] = [
  ['2mass-1114-2618', '2mass-1114-2618:1'],
  ['40-eridani', '40-eridani:1'],
  ['gj-4248', 'gj-4248:1'],
  ['kx-librae', 'kx-librae:1'],
  ['sirius', 'sirius:1'],
];

interface GameHook {
  __game(): {
    nextHoldingId: number;
    holdings: Record<string, unknown>[];
    powers: { faction: string; surveyed: string[]; researched: string[] }[];
    keys: { system: string; holding: number | null; by: string | null }[];
    answer: { by: string; left: number } | null;
  };
  __setGame(g: unknown): void;
}

/** Ends the turn, past what needs you on a phone, and waits for the report or the end. */
async function endTurn(page: Page, project: string) {
  const date = await page.locator('.map-date').textContent();
  await expect(page.getByRole('button', { name: /End turn/ }).first()).toBeEnabled();
  if (isDesktop(project)) await page.keyboard.press('Enter');
  else {
    await page.getByRole('button', { name: /End turn/ }).tap();
    const needs = page.getByRole('dialog', { name: 'What needs you' });
    const report = page.getByRole('dialog', { name: 'Report' });
    const end = page.getByRole('dialog', { name: 'The end of the game' });
    await expect(needs.or(report).or(end)).toBeVisible();
    if (await needs.isVisible()) await needs.getByRole('button', { name: /End turn/ }).tap();
  }
  await expect(page.locator('.map-date')).not.toHaveText(date ?? '');
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

test('all five keys and The instrument: the Answer begun, and victory by the keys', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });

  // We hold the five keys, each in an outpost at its site, and know The instrument.
  await page.evaluate((keys) => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const sta = g.powers.find((p) => p.faction === 'sta');
    if (!sta) return;
    sta.researched.push('relic-studies', 'old-charts', 'the-second-tone', 'field-archaeology', 'the-instrument');
    for (const [system, body] of keys) {
      const id = g.nextHoldingId++;
      g.holdings.push({
        id,
        owner: 'sta',
        kind: 'outpost',
        system,
        body,
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
      g.keys.push({ system, holding: id, by: 'sta' });
      sta.surveyed = [...new Set([...sta.surveyed, system])].sort();
    }
    g.keys.sort((a, b) => (a.system < b.system ? -1 : 1));
    w.__setGame(g);
  }, KEYS);

  const relics = await openRelics(page, project);
  const keys = relics.getByRole('region', { name: 'The keys' });
  await expect(keys).toContainText('We hold 5.');
  await expect(keys.getByRole('listitem').filter({ hasText: 'Sirius' })).toContainText('Held by us.');
  await press(keys.getByRole('button', { name: 'Begin the Answer' }), project);
  await close(page, project);

  await endTurn(page, project);
  const report = page.getByRole('dialog', { name: 'Report' });
  await expect(report).toContainText('We have begun the Answer, with the five keys of the Absent: 9 turns more');
  await close(page, project);

  // The last of its turns.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    if (g.answer) g.answer.left = 1;
    w.__setGame(g);
  });
  await endTurn(page, project);
  const end = page.getByRole('dialog', { name: 'The end of the game' });
  await expect(end).toBeVisible();
  await expect(end).toContainText('Victory');
  await expect(end).toContainText('We have answered the second tone with the five keys of the Absent.');
  expect(errors).toEqual([]);
});
