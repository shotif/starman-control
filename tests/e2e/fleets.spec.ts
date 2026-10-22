import { expect, type Locator, type Page, test } from '@playwright/test';

/** Fleets (M4_FLEETS.md §22), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface Game {
  nextShipId: number;
  nextFleetId: number;
  ships: Record<string, unknown>[];
  fleets: Record<string, unknown>[];
  powers: { faction: string; fleetsMade: number; designs: { id: number; hull: string; retired: boolean }[] }[];
}

interface MapHook {
  __map: { moving: boolean; screenOf(id: string): { x: number; y: number; visible: boolean } | null };
}

/** Where a star is on the screen, once the map has stopped moving. */
async function starAt(page: Page, id: string) {
  await expect
    .poll(() => page.evaluate(() => (window as unknown as MapHook).__map.moving), { timeout: 20_000 })
    .toBe(false);
  return page.evaluate((id) => {
    const p = (window as unknown as MapHook).__map.screenOf(id);
    const r = document.querySelector('.map-host')?.getBoundingClientRect();
    return p?.visible && r ? { x: p.x + r.left, y: p.y + r.top } : null;
  }, id);
}

async function newGame(page: Page, project: string) {
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
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

test('two fleets at the capital merged, given a stance and sent to Alpha Centauri', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await newGame(page, project);
  // Two frigates at Sol, each a fleet of its own.
  await page.evaluate(() => {
    const w = window as unknown as { __game(): Game; __setGame(g: unknown): void };
    const g = structuredClone(w.__game());
    const sta = g.powers.find((p) => p.faction === 'sta');
    const design = sta?.designs.find((d) => d.hull === 'frigate' && !d.retired);
    if (!sta || !design) return;
    for (const name of ['Lance', 'Pike']) {
      const fleet = g.nextFleetId++;
      sta.fleetsMade++;
      g.fleets.push({
        id: fleet,
        owner: 'sta',
        name: `${sta.fleetsMade === 1 ? '1st' : '2nd'} Squadron`,
        destinations: [],
        hold: false,
        stance: 'defend',
        target: 'warships',
        retreat: 50,
      });
      g.ships.push({
        id: g.nextShipId++,
        owner: 'sta',
        type: 'frigate',
        name,
        at: 'sol',
        destinations: [],
        blindJump: null,
        hold: false,
        autoSurvey: false,
        founding: null,
        investigating: null,
        design: design.id,
        fleet,
      });
    }
    w.__setGame(g);
  });

  // The 1st Squadron, from the Empire's list of fleets.
  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const empire = page.getByRole('dialog', { name: 'Empire' });
  await press(empire.getByRole('tab', { name: /^Ships/ }), project);
  await press(empire.getByRole('button', { name: /^1st Squadron/ }), project);
  const panel = isDesktop(project)
    ? page.locator('.map-inspector')
    : page.getByRole('dialog', { name: '1st Squadron' });
  const fleet = panel.getByRole('article', { name: '1st Squadron' });
  await expect(fleet).toContainText('1 warship');
  await press(fleet.getByRole('button', { name: 'Merge it into the 1st Squadron' }), project);
  await expect(fleet).toContainText('2 warships');
  await press(fleet.getByRole('group', { name: 'Stance' }).getByRole('button', { name: 'Engage' }), project);
  await expect(fleet.getByRole('group', { name: 'Stance' }).getByRole('button', { name: 'Engage' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Moved: Move, then Alpha Centauri from the search, and Confirm.
  await press(fleet.getByRole('button', { name: 'Move', exact: true }), project);
  const bar = page.getByRole('dialog', { name: 'Choose a destination' });
  await expect(bar).toContainText('Choose where the 1st Squadron goes.');
  const star = await starAt(page, 'alpha-centauri');
  expect(star).not.toBeNull();
  if (!star) return;
  if (isDesktop(project)) await page.mouse.click(star.x, star.y);
  else await page.touchscreen.tap(star.x, star.y);
  await expect(bar).toContainText('The 1st Squadron → Alpha Centauri: 1 jump, 1 turn');
  await press(bar.getByRole('button', { name: 'Confirm' }), project);

  const report = await endTurn(page, project);
  await expect(report).toContainText('The 1st Squadron reached Alpha Centauri.');
  expect(errors).toEqual([]);
});
