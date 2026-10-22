import { expect, type Locator, type Page, test } from '@playwright/test';

/** Treaties (M3_NEIGHBOURS.md §21), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface Contact {
  faction: string;
  stage: string;
  since: number;
  words: number;
}
interface GameHook {
  __game(): { powers: { faction: string; controller: string; contacts: Contact[] }[] };
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

/** Opens the diplomacy screen: Y on a desktop, the menu on a phone and a tablet. */
async function openDiplomacy(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('y');
  else {
    await page.getByRole('button', { name: 'Menu', exact: true }).tap();
    await page.getByRole('button', { name: 'Diplomacy', exact: true }).tap();
  }
  const screen = page.getByRole('dialog', { name: 'Diplomacy' });
  await expect(screen).toBeVisible();
  return screen;
}

test('open lanes offered to the Cooperative, accepted, and ended with notice', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // The Authority and the Cooperative have met, and can talk.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const sta = g.powers.find((p) => p.faction === 'sta');
    const coop = g.powers.find((p) => p.faction === 'frontier');
    if (!sta || !coop) return;
    sta.contacts.push({ faction: 'frontier', stage: 'talk', since: 1, words: 20 });
    coop.contacts.push({ faction: 'sta', stage: 'talk', since: 1, words: 20 });
    w.__setGame(g);
  });

  let screen = await openDiplomacy(page, project);
  if (!isDesktop(project)) await screen.getByRole('button', { name: /^The Frontier Co-op/ }).tap();
  let detail = screen.getByRole('region', { name: 'The Frontier Co-op' });
  const lanes = detail.getByRole('list', { name: 'Treaties with the Frontier Co-op' }).getByRole('listitem').first();
  await expect(lanes).toContainText('Their regard is enough: likely yes.');
  await press(lanes.getByRole('button', { name: 'Offer the Frontier Co-op open lanes' }), project);
  await expect(lanes).toContainText('Our offer reaches them as the turn ends.');
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();

  const report = await endTurn(page, project);
  await expect(report).toContainText('The Frontier Co-op accepted our offer of open lanes.');
  await expect(report).toContainText('We have open lanes with the Frontier Co-op now');
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();

  screen = await openDiplomacy(page, project);
  if (!isDesktop(project)) await screen.getByRole('button', { name: /^The Frontier Co-op/ }).tap();
  detail = screen.getByRole('region', { name: 'The Frontier Co-op' });
  await expect(detail.getByRole('list', { name: 'Why' })).toContainText('Bound to us by open lanes');
  const held = detail.getByRole('list', { name: 'Treaties with the Frontier Co-op' }).getByRole('listitem').first();
  await press(held.getByRole('button', { name: 'End with notice' }), project);
  await expect(held).toContainText('In force; it ends in 5 turns.');
  await expect(detail.getByRole('list', { name: 'Why' })).toContainText('We ended the open lanes treaty');
});
