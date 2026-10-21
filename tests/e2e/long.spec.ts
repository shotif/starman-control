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
  /** The game's own measure of its last turn: from the press to the new quarter in the game. */
  __lastTurnMs: () => number;
}

/**
 * Ends a turn; returns how long the game took from the press that ended it to the new quarter in
 * the game. The test browser draws with software (SwiftShader), so the drawing is not timed.
 */
async function endTurn(page: Page, project: string): Promise<number> {
  // The last turn is saved before the next can end: End turn waits, disabled, until then.
  await expect(page.getByRole('button', { name: /End turn/ }).first()).toBeEnabled();
  const date = await page.locator('.map-date').textContent();
  if (isDesktop(project)) await page.keyboard.press('Enter');
  else {
    await page
      .getByRole('button', { name: /End turn/ })
      .first()
      .tap();
    const needs = page.getByRole('dialog', { name: 'What needs you' });
    const report = page.getByRole('dialog', { name: 'Report' });
    await expect(needs.or(report)).toBeVisible();
    if (await needs.isVisible()) await needs.getByRole('button', { name: /End turn/ }).tap();
  }
  await expect(page.locator('.map-date')).not.toHaveText(date ?? '');
  await expect.poll(() => page.evaluate(() => (window as unknown as GameHook).__lastTurnMs())).toBeGreaterThan(0);
  return page.evaluate(() => (window as unknown as GameHook).__lastTurnMs());
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
  let total = 0;
  let answered = 0;
  for (let turn = 1; turn <= 100; turn++) {
    const ms = await endTurn(page, project);
    slowest = Math.max(slowest, ms);
    total += ms;
    if (await answer(page, project)) answered++;
  }
  console.log(
    `${project}: slowest turn ${slowest} ms, average ${Math.round(total / 100)} ms, ${answered} events answered`,
  );
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
