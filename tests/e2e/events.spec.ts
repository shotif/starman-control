import { expect, type Locator, type Page, test } from '@playwright/test';

/** Events (M2_WORLDS.md §27), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

async function newGame(page: Page, project: string) {
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
}

async function endTurn(page: Page, project: string) {
  const date = await page.locator('.map-date').textContent();
  if (isDesktop(project)) await page.keyboard.press('Enter');
  else {
    for (const name of ['An epidemic', 'Earth'])
      if (await page.getByRole('dialog', { name }).isVisible())
        await page.getByRole('dialog', { name }).getByRole('button', { name: 'Close' }).first().tap();
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

test('an event: an epidemic at Earth, answered with a quarantine, which shows in its approval', async ({
  page,
}, info) => {
  test.setTimeout(120_000);
  const project = info.project.name;
  await newGame(page, project);
  // With seed 42 and nothing ordered, an epidemic comes to Earth as the fifth turn ends.
  let report = await endTurn(page, project);
  for (let turn = 2; turn <= 5; turn++) report = await endTurn(page, project);
  const line = report.getByRole('button', { name: 'An epidemic at Earth: it needs your answer.' });
  await expect(line).toBeVisible();
  await press(line, project);

  const card = page.getByRole('dialog', { name: 'An epidemic' });
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading', { name: /An epidemic at Earth/ })).toBeVisible();
  await expect
    .poll(() => card.locator('img').evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0))
    .toBe(true);
  await expect(card).toContainText('Unanswered, medical aid is chosen for you when 3 turns have ended.');
  const quarantine = card.getByRole('button', { name: /^Quarantine/ });
  await expect(card.getByRole('button', { name: /^Medical aid −30 credits\./ })).toBeVisible();
  await press(quarantine, project);
  await expect(quarantine).toHaveAttribute('aria-pressed', 'true');
  await expect(card).toContainText('Your answer takes effect as this turn ends');

  if (isDesktop(project)) await card.getByRole('button', { name: 'Close' }).click();
  report = await endTurn(page, project);
  await expect(report).toContainText(
    'An epidemic at Earth: quarantine. No growth there for 4 turns; approval −10 there for 4 turns.',
  );

  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const empire = page.getByRole('dialog', { name: 'Empire' });
  await press(empire.getByRole('button', { name: /^Earth/ }).first(), project);
  const panel = isDesktop(project) ? page.locator('.map-inspector') : page.getByRole('dialog', { name: 'Earth' });
  await expect(panel).toContainText('-10 quarantine');
});
