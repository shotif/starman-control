import { expect, type Locator, test } from '@playwright/test';

/** Lessons when they matter (M6_ONE.md §20), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface GameHook {
  __game(): {
    powers: { faction: string; contacts: { faction: string; stage: string; since: number; words: number }[] }[];
  };
  __setGame(g: unknown): void;
}

test('first contact brings the Envoy’s lesson, told once and kept in the codex', async ({ page }, info) => {
  const project = info.project.name;
  await page.goto('./?test&lessons#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // Nothing is due at the start.
  await expect(page.getByRole('complementary', { name: 'Lesson' })).toHaveCount(0);
  // We meet the Cooperative.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    g.powers
      .find((p) => p.faction === 'sta')
      ?.contacts.push({ faction: 'frontier', stage: 'words', since: 1, words: 2 });
    w.__setGame(g);
  });
  const card = page.getByRole('complementary', { name: 'Lesson' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('Isabel Achterberg');
  await expect(card).toContainText('we have met another power');
  // On the desktop the Diplomacy chip is lit.
  if (isDesktop(project)) await expect(page.locator('[data-guide="diplomacy"]')).toHaveCSS('outline-style', 'solid');
  await press(card.getByRole('button', { name: 'Got it' }), project);
  await expect(card).toHaveCount(0);
  // Told for good: not again after a reload.
  await page.reload();
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  await expect(page.getByRole('complementary', { name: 'Lesson' })).toHaveCount(0);
  // Kept in the codex, with the rest.
  await page.goto('./?test&lessons#/codex');
  const how = page.getByRole('region', { name: 'How to play' });
  await how.scrollIntoViewIfNeeded();
  await expect(how.getByRole('listitem').filter({ hasText: 'First contact' })).toContainText('Met in play');
  await expect(how.getByRole('listitem').filter({ hasText: 'The Assembly' })).not.toContainText('Met in play');
  await press(how.getByRole('button', { name: 'Tell me again' }), project);
  await expect(how).not.toContainText('Met in play');
});
