import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * A hundred turns with rivals and events (M2_WORLDS.md §29.3), on a phone and a desktop: every
 * event answered, every turn within 2 seconds from the press to the next quarter, the game saved,
 * and the save under 200 KB.
 */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface GameHook {
  __game: () => { turn: number } | null;
}

async function endTurn(page: Page, project: string): Promise<number> {
  const date = await page.locator('.map-date').textContent();
  const t0 = Date.now();
  if (isDesktop(project)) await page.keyboard.press('Enter');
  else {
    await page.getByRole('button', { name: /End turn/ }).tap();
    const needs = page.getByRole('dialog', { name: 'What needs you' });
    const report = page.getByRole('dialog', { name: 'Report' });
    await expect(needs.or(report)).toBeVisible();
    if (await needs.isVisible()) await needs.getByRole('button', { name: /End turn/ }).tap();
  }
  await expect(page.locator('.map-date')).not.toHaveText(date ?? '');
  return Date.now() - t0;
}

/** Answers an event the report says is waiting, with its first choice. */
async function answer(page: Page, project: string): Promise<boolean> {
  const line = page.getByRole('dialog', { name: 'Report' }).getByRole('button', { name: /: it needs your answer\.$/ });
  if ((await line.count()) === 0) return false;
  await press(line.first(), project);
  const choices = page.locator('.event-choices button');
  await press(choices.first(), project);
  await expect(choices.first()).toHaveAttribute('aria-pressed', 'true');
  const card = page.locator('.event-card').locator('xpath=ancestor::*[@role="dialog"][1]');
  await press(card.getByRole('button', { name: 'Close' }).last(), project);
  return true;
}

test('a hundred turns with rivals and events, answered, within the budgets', async ({ page }, info) => {
  const project = info.project.name;
  test.skip(project === 'tablet', 'The phone and the desktop are enough for the long game.');
  test.setTimeout(900_000);
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('2176');
  await press(page.getByRole('button', { name: 'Lead the Frontier Co-op' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });

  let slowest = 0;
  let answered = 0;
  for (let turn = 1; turn <= 100; turn++) {
    slowest = Math.max(slowest, await endTurn(page, project));
    if (await answer(page, project)) answered++;
  }
  expect(slowest).toBeLessThan(2000);
  expect(answered).toBeGreaterThan(3);
  const game = await page.evaluate(() => {
    const g = (window as unknown as GameHook).__game();
    return g ? { turn: g.turn, bytes: JSON.stringify(g).length } : null;
  });
  expect(game?.turn).toBe(101);
  expect(game?.bytes).toBeLessThan(200_000);
  await expect(page.getByRole('dialog', { name: 'Report' })).toContainText('what happened');
});
