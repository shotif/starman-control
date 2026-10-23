import { expect, type Locator, test } from '@playwright/test';

/** Leading the Dusk Concord (M6_ONE.md §24, D-81), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface ColonyHook {
  __colony: { info: { biome: string; architecture: string; buildings: number; pictures: string[] } };
}

test('the Concord leads from GJ 433 d: its capital drawn in its own halls, its advisors guiding', async ({
  page,
}, info) => {
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?test&guide#/new');
  const card = page.getByRole('article', { name: 'Dusk Concord' });
  await expect(card).toContainText('GJ 433');
  await expect(card.getByRole('img', { name: /Still Water/ })).toBeAttached();
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Dusk Concord' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // The guided opening speaks in the Concord's voice, by its colonies advisor.
  const guide = page.getByRole('complementary', { name: 'Guide' });
  await expect(guide).toContainText('Warm Stone');
  // Its capital, in the Empire, drawn in the Duskfolk's architecture.
  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const empire = page.getByRole('dialog', { name: 'Empire' });
  await press(empire.getByRole('button', { name: /^GJ 433 d/ }).first(), project);
  const panel = isDesktop(project) ? page.locator('.map-inspector') : page.getByRole('dialog', { name: 'GJ 433 d' });
  const still = panel.getByTestId('colony-still');
  await expect(still).toHaveClass(/is-drawn/, { timeout: 20_000 });
  await press(panel.getByRole('button', { name: 'View GJ 433 d' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-colony-ready', '1', { timeout: 30_000 });
  const scene = await page.evaluate(() => (window as unknown as ColonyHook).__colony.info);
  expect(scene.architecture).toBe('dusk');
  expect(scene.buildings).toBeGreaterThan(3);
  expect(scene.pictures.some((p) => p.includes('dusk-hall'))).toBe(true);
  expect(errors).toEqual([]);
});
