import { expect, type Locator, type Page, test } from '@playwright/test';

/** The arks of the Unhomed (M5_UNKNOWN.md §25), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface GameHook {
  __game(): { turn: number; arks: unknown };
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

async function close(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();
}

test('the arks arrive, we give them a world, and the Last Hearth is grateful', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });

  // The arks have come.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    g.arks = { arrived: g.turn, dies: g.turn + 12, answers: [], ended: null };
    w.__setGame(g);
  });

  // What needs us opens the arks.
  if (isDesktop(project))
    await page.getByRole('button', { name: /The arks of the Unhomed ask us for a world/ }).click();
  else {
    await page.getByRole('button', { name: /End turn/ }).tap();
    const needs = page.getByRole('dialog', { name: 'What needs you' });
    await expect(needs).toContainText('The arks of the Unhomed ask us for a world: 12 turns before their star dies.');
    await needs.getByRole('button', { name: 'Answer the arks' }).tap();
  }
  const arks = page.getByRole('dialog', { name: 'The arks' });
  await expect(arks).toBeVisible();
  await expect(arks).toContainText('crossing from Arcturus');
  await expect(arks).toContainText('Arcturus an old orange giant 37 light-years from Sol');
  const choice = arks.getByRole('combobox', { name: 'The world we give them' });
  const world = (await choice.locator('option').first().textContent()) ?? '';
  await press(arks.getByRole('button', { name: 'Give it' }), project);
  await expect(arks.getByRole('button', { name: 'Give it' })).toHaveAttribute('aria-pressed', 'true');
  await close(page, project);

  const report = await endTurn(page, project);
  await expect(report).toContainText(
    `We have given the Unhomed a world at ${world.split(',')[1]?.split(':')[0]?.trim()}`,
  );
  await expect(report).toContainText('They are the Last Hearth now, a power of their own, and grateful to us.');
  await close(page, project);

  // The Last Hearth on the diplomacy screen, remembering.
  if (isDesktop(project)) await page.keyboard.press('y');
  else {
    await page.getByRole('button', { name: 'Menu', exact: true }).tap();
    await page.getByRole('button', { name: 'Diplomacy', exact: true }).tap();
  }
  const screen = page.getByRole('dialog', { name: 'Diplomacy' });
  const hearth = screen.getByRole('button', { name: /The Last Hearth:/ });
  await expect(hearth).toBeVisible();
  if (!isDesktop(project)) await hearth.tap();
  else await hearth.click();
  const detail = screen.getByRole('region', { name: 'The Last Hearth', exact: true });
  await expect(detail.getByRole('list', { name: 'Why' })).toContainText('We gave them a home');
  expect(errors).toEqual([]);
});
