import { expect, type Locator, test } from '@playwright/test';

/** The machine heirs and the Continuance (M5_UNKNOWN.md §27), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface GameHook {
  __game(): { powers: { faction: string; surveyed: string[] }[] };
  __setGame(g: unknown): void;
}

test('a new game has the Continuance as a rival, and the codex knows them', async ({ page }) => {
  await page.goto('./#/new');
  await expect(page.locator('.power-card')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Lead the Continuance' })).toHaveCount(0);
  await expect(page.getByText(/the Drift Moot and the Continuance, alien powers far out in the shell/)).toBeVisible();
  // The codex shows their home web, their speaker and their people, as fiction.
  await page.goto('./#/codex');
  const card = page.locator('.web-card').filter({ hasText: 'Continuance' });
  await card.scrollIntoViewIfNeeded();
  await expect(card).toContainText('Capital GJ 3306');
  await expect(card).toContainText('Exact Measure');
  await expect(card).toContainText('First Lathe');
  await expect(card.getByRole('img', { name: /machines building copies of themselves/ })).toBeAttached();
});

test('the Forge at GJ 3306: the heirs’ capital, and fiction', async ({ page }, info) => {
  const project = info.project.name;
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // As if our survey ship had been there.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const sta = g.powers.find((p) => p.faction === 'sta');
    if (!sta) return;
    sta.surveyed = [...sta.surveyed, 'gj-3306'].sort();
    w.__setGame(g);
  });
  if (!isDesktop(project)) {
    await page.getByRole('button', { name: 'Menu', exact: true }).tap();
    await page.getByRole('button', { name: 'Find a system' }).tap();
  }
  await page.getByPlaceholder('Find a system').fill('gj 3306');
  await press(page.locator('.search-results').getByRole('button', { name: /GJ 3306/ }), project);
  const panel = isDesktop(project)
    ? page.getByRole('complementary', { name: 'Selected system' })
    : page.getByRole('dialog', { name: 'GJ 3306' });
  await expect(panel.getByRole('heading', { name: 'GJ 3306' })).toBeVisible();
  // The vault where the Absent made them, a relic site of its own (M5_UNKNOWN.md §28.2).
  await expect(panel.getByRole('region', { name: 'Relic site' })).toContainText('A vault');
  await press(panel.getByRole('button', { name: /The Forge/ }), project);
  const forge = panel.getByRole('article', { name: 'The Forge' });
  await expect(forge).toContainText('Fiction');
  await expect(forge).toContainText('Continuance');
  await expect(forge).toContainText('capital here');
});
