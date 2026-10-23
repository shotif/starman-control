import { expect, type Locator, test } from '@playwright/test';

/** Scrapping a ship (M5_UNKNOWN.md §26.3), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

test('a survey ship broken up from its panel, asked twice', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });

  const ships = () =>
    isDesktop(project)
      ? page.getByRole('complementary', { name: 'Your power' }).locator('.ships-list')
      : page.getByRole('dialog', { name: 'Empire' });
  if (!isDesktop(project)) {
    await page.getByRole('button', { name: 'Empire', exact: true }).tap();
    await page.getByRole('dialog', { name: 'Empire' }).getByRole('tab', { name: /Ships/ }).tap();
  }
  await press(ships().getByRole('button', { name: /Petrel/ }), project);
  const scrap = page.getByRole('button', { name: 'Scrap: saves 1 credit a turn' });
  await press(scrap, project);
  const ask = page.getByRole('group', { name: 'Scrap the Petrel?' });
  await expect(ask).toContainText('Its upkeep of 1 credit a turn ends, and nothing comes back.');
  await press(ask.getByRole('button', { name: 'Keep it' }), project);
  await expect(ask).toHaveCount(0);
  await press(scrap, project);
  await press(
    page.getByRole('group', { name: 'Scrap the Petrel?' }).getByRole('button', { name: 'Scrap it' }),
    project,
  );

  if (!isDesktop(project)) {
    await page.getByRole('button', { name: 'Empire', exact: true }).tap();
    await page.getByRole('dialog', { name: 'Empire' }).getByRole('tab', { name: /Ships/ }).tap();
  }
  await expect(ships()).not.toContainText('Petrel');
  await expect(ships()).toContainText('Bastion');
  expect(errors).toEqual([]);
});
