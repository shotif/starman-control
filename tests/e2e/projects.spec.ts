import { expect, type Locator, type Page, test } from '@playwright/test';

/** M2's projects and research (M2_WORLDS.md §23), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

async function newGame(page: Page, project: string) {
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
}

test('the new projects: those open from the start can be queued, the rest say what they need', async ({
  page,
}, info) => {
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await newGame(page, project);
  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  await press(
    page
      .getByRole('dialog', { name: 'Empire' })
      .getByRole('button', { name: /^Earth/ })
      .first(),
    project,
  );
  const panel = isDesktop(project) ? page.locator('.map-inspector') : page.getByRole('dialog', { name: 'Earth' });

  const hydroponics = panel.getByRole('button', { name: 'Queue hydroponics' });
  await expect(hydroponics).toBeEnabled();
  await expect(hydroponics).toContainText('40 industry, 5 metals · upkeep 1');
  await expect(hydroponics).toContainText('3 food a turn, on any world.');
  const institute = panel.getByRole('button', { name: 'Queue a research institute' });
  await expect(institute).toBeDisabled();
  await expect(institute).toContainText('Needs Computing.');
  await expect(panel.getByRole('button', { name: 'Queue an arcology' })).toContainText('Needs Arcologies.');

  await press(panel.getByRole('button', { name: 'Queue a civic centre' }), project);
  await expect(panel.locator('.queue-list, .queue-table').first()).toContainText('Civic centre');
  await expect(panel.getByRole('button', { name: 'Queue a civic centre' })).toContainText(
    'A civic centre is already queued.',
  );
  expect(errors).toEqual([]);
});

test('the research tree has M2’s technologies, each with its exact effect', async ({ page }, info) => {
  const project = info.project.name;
  await newGame(page, project);
  if (isDesktop(project)) await page.keyboard.press('t');
  else await page.getByRole('button', { name: 'Research', exact: true }).tap();
  const screen = page.getByRole('dialog', { name: 'Research' });
  await expect(screen).toContainText('Soil science');
  await expect(screen).toContainText('Each farm district yields 1 more food.');
  await expect(screen).toContainText('Computing');
  await expect(screen).toContainText('opens the research institute');
  await press(screen.getByRole('button', { name: 'Queue Soil science', exact: true }), project);
  await expect(screen.locator('.research-queue')).toContainText('Soil science');
  await expect(screen.locator('.research-queue li').first()).toContainText('done in about 5 turns');
});
