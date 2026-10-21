import { expect, type Locator, type Page, test } from '@playwright/test';

/** Doctrines and science among the powers (M2B_SCIENCE.md §19), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface GameHook {
  __game(): {
    powers: {
      faction: string;
      controller: string;
      researched: string[];
      researchQueue: string[];
      techProgress: Record<string, number>;
    }[];
  };
  __setGame(g: unknown): void;
}

async function newGame(page: Page, project: string) {
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Frontier Co-op' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
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

async function openResearch(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('t');
  else await page.getByRole('button', { name: 'Research', exact: true }).tap();
  const screen = page.getByRole('dialog', { name: 'Research' });
  await expect(screen).toBeVisible();
  if (!isDesktop(project)) await screen.getByRole('tab', { name: /^Society/ }).tap();
  return screen;
}

test('a doctrine chosen closes its pair for the game', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  await newGame(page, project);
  // Some way on: Regional administration known, and Open frontier a point from done, Strong centre queued too.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const me = g.powers.find((p) => p.controller === 'player');
    if (!me) return;
    me.researched.push('colonial-charters', 'regional-administration');
    me.researchQueue = ['open-frontier', 'strong-centre'];
    me.techProgress = { 'open-frontier': 113 };
    w.__setGame(g);
  });
  let screen = await openResearch(page, project);
  await expect(screen.locator('[data-tech="open-frontier"]')).toContainText(
    'A doctrine: it closes Strong centre for the game.',
  );
  // Each pair split by "or": all three on a desktop, the Society tab's one on a phone.
  await expect(screen.locator('.tech-or')).toHaveCount(isDesktop(project) ? 3 : 1);
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();
  const report = await endTurn(page, project);
  await expect(report).toContainText('Researched Open frontier');
  if (!isDesktop(project)) await page.getByRole('button', { name: 'Close' }).first().tap();
  else await page.keyboard.press('Escape');
  screen = await openResearch(page, project);
  const closed = screen.locator('[data-tech="strong-centre"]');
  await expect(closed).toContainText('Closed: you chose Open frontier.');
  await expect(closed).toHaveClass(/tech-closed/);
  await expect(closed.getByRole('button')).toHaveCount(0);
  await expect(screen.locator('.research-queue')).toHaveCount(0);
});
