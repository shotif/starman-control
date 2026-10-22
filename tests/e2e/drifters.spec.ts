import { expect, type Locator, test } from '@playwright/test';

/** The Drifters and the Drift Moot (M3_NEIGHBOURS.md §25), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface GameHook {
  __game(): {
    powers: { faction: string; contacts: { faction: string; stage: string; since: number; words: number }[] }[];
  };
  __setGame(g: unknown): void;
}

test('the Moot in the codex, and its envoy on the diplomacy screen', async ({ page }, info) => {
  const project = info.project.name;
  await page.goto('./#/codex');
  const card = page.locator('.web-card').filter({ hasText: 'Drift Moot' });
  await card.scrollIntoViewIfNeeded();
  await expect(card).toContainText('Capital HD 192310');
  await expect(card).toContainText('5 systems · 4 lanes');
  await expect(card).toContainText('Deep Current');
  await expect(card).toContainText('The Drifters, who make the Drift Moot');
  await expect(card.getByRole('img', { name: /Drifters floating in the banded air/ })).toBeAttached();

  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Frontier Co-op' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // The Cooperative has heard the Moot and is learning its tongue.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    g.powers
      .find((p) => p.faction === 'frontier')
      ?.contacts.push({ faction: 'drift-moot', stage: 'words', since: 1, words: 7 });
    w.__setGame(g);
  });
  if (isDesktop(project)) await page.keyboard.press('y');
  else {
    await page.getByRole('button', { name: 'Menu', exact: true }).tap();
    await page.getByRole('button', { name: 'Diplomacy', exact: true }).tap();
  }
  const screen = page.getByRole('dialog', { name: 'Diplomacy' });
  const power = screen.getByRole('button', { name: /^The Drift Moot/ });
  await expect(power).toContainText('learning their tongue: 7 of 20');
  await press(power, project);
  const detail = screen.getByRole('region', { name: 'The Drift Moot' });
  await expect(detail).toContainText('Their envoy: Fair Wind, who carries offers');
});
