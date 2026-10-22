import { expect, type Locator, type Page, test } from '@playwright/test';

/** Victory and defeat (M4_FLEETS.md §30), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface GameHook {
  __game(): {
    turn: number;
    powers: { faction: string; contacts: { faction: string; stage: string; since: number; words: number }[] }[];
    holdings: { owner: string }[];
    assembly: { chosen: string | null } | null;
    history: { turn: number; scores: number[] }[];
  };
  __setGame(g: unknown): void;
}

/** Starts a game leading the Authority, on seed 42. */
async function start(page: Page, project: string) {
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
}

/**
 * Ends the turn, past what needs you on a phone; returns the dialog that opens: the report, or the
 * end of the game in its place.
 */
async function endTurn(page: Page, project: string, opens = 'The end of the game') {
  const date = await page.locator('.map-date').textContent();
  await expect(page.getByRole('button', { name: /End turn/ }).first()).toBeEnabled();
  if (isDesktop(project)) await page.keyboard.press('Enter');
  else {
    await page.getByRole('button', { name: /End turn/ }).tap();
    const needs = page.getByRole('dialog', { name: 'What needs you' });
    const shown = page.getByRole('dialog', { name: opens });
    await expect(needs.or(shown)).toBeVisible();
    if (await needs.isVisible()) await needs.getByRole('button', { name: /End turn/ }).tap();
  }
  await expect(page.locator('.map-date')).not.toHaveText(date ?? '');
  const shown = page.getByRole('dialog', { name: opens });
  await expect(shown).toBeVisible();
  return shown;
}

test('chosen by the Assembly: victory, the story in numbers, and playing on', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, project);
  // The Assembly formed among us, the Cooperative and the Wake, and it has chosen us; a history to draw.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const three = ['sta', 'frontier', 'hollow-wake'];
    for (const p of g.powers)
      if (three.includes(p.faction))
        p.contacts = three
          .filter((f) => f !== p.faction)
          .map((faction) => ({ faction, stage: 'talk', since: 1, words: 20 }));
    g.history = [10, 20, 30].map((turn, i) => ({ turn, scores: g.powers.map((_, j) => 50 + i * 20 + j * 5) }));
    w.__setGame(g);
  });
  // A turn, and the Assembly forms as it ends.
  const report = await endTurn(page, project, 'Report');
  await expect(report).toContainText('The Assembly has formed');
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    if (g.assembly) g.assembly.chosen = 'sta';
    w.__setGame(g);
  });
  const end = await endTurn(page, project);
  await expect(end.getByRole('heading', { name: 'Victory' })).toBeVisible();
  await expect(end).toContainText('The Assembly has chosen us to lead it, by two thirds of all its votes.');
  await expect(end.getByRole('img', { name: 'Every power’s score, every 10 turns' })).toBeVisible();
  await expect(end.getByRole('table')).toContainText('Transit Authority');
  await press(end.getByRole('button', { name: 'Play on' }), project);
  await expect(end).toBeHidden();
  // The report says so too, and the game goes on.
  await expect(page.getByRole('button', { name: /End turn/ }).first()).toBeEnabled();
  expect(errors).toEqual([]);
});

test('our last colony lost: defeat, with no playing on', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, project);
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    g.holdings = g.holdings.filter((h) => h.owner !== 'sta');
    w.__setGame(g);
  });
  const end = await endTurn(page, project);
  await expect(end.getByRole('heading', { name: 'Defeat' })).toBeVisible();
  await expect(end).toContainText('Our last colony is gone: our power has left the game.');
  await expect(end.getByRole('button', { name: 'Play on' })).toHaveCount(0);
  await expect(end.getByRole('button', { name: 'Save and leave' })).toBeVisible();
  expect(errors).toEqual([]);
});
