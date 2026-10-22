import { expect, type Locator, type Page, test } from '@playwright/test';

/** The Duskfolk and the Dusk Concord (M3_NEIGHBOURS.md §24), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface GameHook {
  __game(): {
    powers: { faction: string; controller: string }[];
    ships: { owner: string; type: string; at: string | null; destinations: string[] }[];
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

async function close(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();
}

test('a new game offers the three human powers; the Concord plays as a rival', async ({ page }, info) => {
  await page.goto('./#/new');
  await expect(page.locator('.power-card')).toHaveCount(3);
  for (const name of ['Transit Authority', 'Frontier Co-op', 'Hollow Wake'])
    await expect(page.getByRole('button', { name: `Lead the ${name}` })).toBeAttached();
  await expect(page.getByRole('button', { name: 'Lead the Dusk Concord' })).toHaveCount(0);
  await expect(
    page.getByText(/the other two, and the Dusk Concord and the Drift Moot, alien powers far out in the shell/),
  ).toBeVisible();
  // The codex shows its home web, its speaker and its people, as fiction.
  await page.goto('./#/codex');
  await expect(page.locator('.web-card')).toHaveCount(5);
  const card = page.locator('.web-card').filter({ hasText: 'Dusk Concord' });
  await card.scrollIntoViewIfNeeded();
  await expect(card).toContainText('Capital GJ 433');
  await expect(card).toContainText('6 systems · 5 lanes');
  await expect(card).toContainText('Still Water');
  await expect(card).toContainText('First Voice');
  await expect(card.getByRole('img', { name: /Duskfolk in the ring of dusk/ })).toBeAttached();
  await expect(card).toContainText('The Duskfolk, who make the Dusk Concord');
  void info;
});

test('first contact with the Concord: words, not talk, and its envoy', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // A Concord survey ship at Sol, its power holding its orders for a turn.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const concord = g.powers.find((p) => p.faction === 'dusk-concord');
    const ship = g.ships.find((s) => s.owner === 'dusk-concord' && s.type === 'survey');
    if (!concord || !ship) return;
    concord.controller = 'player';
    ship.at = 'sol';
    ship.destinations = [];
    w.__setGame(g);
  });
  const report = await endTurn(page, project);
  await expect(report).toContainText('First contact: the Dusk Concord, seen at Sol.');
  await expect(report).toContainText('Their tongue is not ours: the Envoy has begun to learn it.');
  await close(page, project);

  if (isDesktop(project)) await page.keyboard.press('y');
  else {
    await page.getByRole('button', { name: 'Menu', exact: true }).tap();
    await page.getByRole('button', { name: 'Diplomacy', exact: true }).tap();
  }
  const screen = page.getByRole('dialog', { name: 'Diplomacy' });
  await expect(screen).toBeVisible();
  const power = screen.getByRole('button', { name: /^The Dusk Concord/ });
  await expect(power).toContainText('learning their tongue');
  await press(power, project);
  const detail = screen.getByRole('region', { name: 'The Dusk Concord' });
  await expect(detail).toContainText('Their envoy: First Voice, who speaks to strangers');
  await expect(detail).toContainText('We cannot talk with them until the Envoy has learnt their tongue.');
});
