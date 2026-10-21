import { expect, type Locator, type Page, test } from '@playwright/test';

/** The deeper tree's research screen (M2B_SCIENCE.md §18.5), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

async function openResearch(page: Page, project: string) {
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('4242');
  await press(page.getByRole('button', { name: 'Lead the Frontier Co-op' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  if (isDesktop(project)) await page.keyboard.press('t');
  else await page.getByRole('button', { name: 'Research', exact: true }).tap();
  const screen = page.getByRole('dialog', { name: 'Research' });
  await expect(screen).toBeVisible();
  return screen;
}

test('the research screen: a tab for each field on a phone and a tablet', async ({ page }, info) => {
  const project = info.project.name;
  test.skip(isDesktop(project), 'the desktop shows the whole tree');
  const screen = await openResearch(page, project);
  const tabs = screen.getByRole('tab');
  await expect(tabs).toHaveCount(6);
  await expect(screen.getByRole('tab', { name: 'Propulsion 0/14' })).toHaveAttribute('aria-selected', 'true');
  await expect(screen.getByRole('region', { name: 'Propulsion, tier 5' })).toContainText('Fold charts');
  // Xenology: Lapse studies, opened by anomalies investigated, not by a technology.
  await screen.getByRole('tab', { name: /^Xenology/ }).tap();
  const lapse = screen.locator('[data-tech="lapse-studies"]');
  await expect(lapse).toContainText('Needs three anomalies investigated (0 so far)');
  await expect(lapse.getByRole('button', { name: 'Queue Lapse studies' })).toBeDisabled();
  // A tier-4 technology queued with what it needs, and the queue says when it will all be done.
  await screen.getByRole('tab', { name: /^Society/ }).tap();
  await expect(screen.locator('[data-tech="councils"]')).toContainText('240 points');
  await screen.getByRole('button', { name: 'Queue Councils', exact: true }).tap();
  const queue = screen.locator('.research-queue');
  await expect(queue).toContainText('Colonial charters');
  await expect(queue).toContainText('Councils');
  await expect(screen).toContainText('The whole queue is done in about');
  // Each one learnt makes the next dearer: Civil service, second, costs 64 rather than 60.
  await expect(queue.locator('li').nth(1)).toContainText('0 of 64');
  // Taking one out takes out what needs it: Shared spaces alone stays.
  await screen.getByRole('button', { name: 'Take Colonial charters out of the queue' }).tap();
  await expect(queue.locator('li')).toHaveCount(1);
  await expect(queue).toContainText('Shared spaces');
});

test('the research screen on a desktop: the tree, the queue beside it, and the keys', async ({ page }, info) => {
  const project = info.project.name;
  test.skip(!isDesktop(project), 'phones and tablets have the field tabs');
  const screen = await openResearch(page, project);
  const side = screen.getByRole('complementary', { name: 'Research queue' });
  await expect(side).toContainText('Nothing is being researched');
  await expect(screen.getByRole('list', { name: 'Xenology, tier 1' })).toContainText('Lapse studies');
  await expect(screen.getByRole('list', { name: 'Survey, tier 5' })).toContainText('Thinking machines');
  // Arrow keys move between technologies; Enter queues; Shift+Enter researches now; Delete takes out.
  await screen.locator('[data-tech="lane-engineering-1"]').focus();
  await page.keyboard.press('Enter');
  await expect(side.locator('.research-queue')).toContainText('Lane engineering I');
  await page.keyboard.press('ArrowRight');
  await expect(screen.locator('[data-tech="habitat-domes"]')).toBeFocused();
  await page.keyboard.press('Shift+Enter');
  await expect(side.locator('.research-queue li').first()).toContainText('Habitat domes');
  await page.keyboard.press('Delete');
  await expect(side.locator('.research-queue')).not.toContainText('Habitat domes');
  await page.keyboard.press('ArrowDown');
  await expect(screen.locator('[data-tech="automated-mining"]')).toBeFocused();
  // The keys stay in the tree: Enter there never ends the turn.
  await expect(page.locator('.map-date')).toHaveText('Q1 2176');
});
