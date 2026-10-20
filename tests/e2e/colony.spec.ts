import { expect, type Locator, type Page, test } from '@playwright/test';

/** The colony in pictures (COLONY_VIEW.md): the still at the top of a colony's panel. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

async function openCapital(page: Page, power: string, capital: string, seed: string, project: string) {
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill(seed);
  await press(page.getByRole('button', { name: power }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const empire = page.getByRole('dialog', { name: 'Empire' });
  await press(empire.getByRole('button', { name: new RegExp(`^${capital}`) }).first(), project);
  return isDesktop(project) ? page.locator('.map-inspector') : page.getByRole('dialog', { name: capital });
}

test('the Cooperative’s capital is drawn as a domed city on a warm shore, and shows what it builds', async ({
  page,
}, info) => {
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // Seed 1 makes Tau Ceti e a warm world with seas (its air and water are fiction made per game).
  const panel = await openCapital(page, 'Lead the Frontier Co-op', 'Tau Ceti e', '1', project);
  const still = panel.getByTestId('colony-still');
  await expect(still).toHaveClass(/is-drawn/, { timeout: 20_000 });
  await expect(still).toHaveAttribute('data-biome', 'shore');
  await expect(still.getByRole('img')).toHaveAccessibleName(
    'Tau Ceti e: a domed city of about 10 million under a yellow sun, with a shipyard and a lane station.',
  );
  await expect(still).toContainText('Illustration');
  const box = await still.boundingBox();
  expect(box && box.width / box.height).toBeCloseTo(2, 1);
  // Something is drawn: the canvas is not one flat colour.
  const varied = await still.locator('canvas').evaluate((c: HTMLCanvasElement) => {
    const g = c.getContext('2d');
    if (!g) return false;
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const seen = new Set<number>();
    for (let i = 0; i < d.length; i += 4 * 97) seen.add((d[i] ?? 0) >> 4);
    return seen.size > 6;
  });
  expect(varied).toBe(true);

  // A queued mine stands as a scaffold where the mine will be.
  await press(panel.getByRole('button', { name: 'Queue a mine' }), project);
  await expect(still.getByRole('img')).toHaveAccessibleName(/; a mine is being built\.$/);
  expect(errors).toEqual([]);
});

test('a world with no pictures yet keeps the panel as it was', async ({ page }, info) => {
  const project = info.project.name;
  // Seed 4242 makes Tau Ceti e airless, a ground not yet painted.
  const panel = await openCapital(page, 'Lead the Frontier Co-op', 'Tau Ceti e', '4242', project);
  await expect(panel.getByRole('heading', { name: 'Tau Ceti e' })).toBeVisible();
  await expect(panel.getByTestId('colony-still')).toHaveCount(0);
});
