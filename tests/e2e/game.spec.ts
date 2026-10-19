import { expect, type Locator, type Page, test } from '@playwright/test';

/** The first playable turns (M1_TURNS.md), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface MapHook {
  __map: { screenOf(id: string): { x: number; y: number; visible: boolean } | null; moving: boolean };
}

async function starAt(page: Page, id: string) {
  await expect.poll(() => page.evaluate(() => (window as unknown as MapHook).__map.moving)).toBe(false);
  return page.evaluate((id) => {
    const p = (window as unknown as MapHook).__map.screenOf(id);
    const r = document.querySelector('.map-host')?.getBoundingClientRect();
    return p?.visible && r ? { x: p.x + r.left, y: p.y + r.top } : null;
  }, id);
}

async function newGame(page: Page, power: string, project: string, seed = '4242') {
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill(seed);
  await press(page.getByRole('button', { name: power }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
}

/** Chooses a ship: from the outliner on a desktop, from the Empire sheet's ships on a phone. */
async function chooseShip(page: Page, name: string, project: string) {
  if (isDesktop(project)) {
    await page
      .getByRole('complementary', { name: 'Your power' })
      .locator('.ships-list')
      .getByRole('button', { name: new RegExp(name) })
      .click();
  } else {
    await page.getByRole('button', { name: 'Empire', exact: true }).tap();
    const empire = page.getByRole('dialog', { name: 'Empire' });
    await empire.getByRole('tab', { name: /Ships/ }).tap();
    await empire.getByRole('button', { name: new RegExp(name) }).tap();
  }
}

/** Opens the empire: the P key on a desktop, the bottom bar's Empire on a phone. */
async function openEmpire(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const empire = page.getByRole('dialog', { name: 'Empire' });
  await expect(empire).toBeVisible();
  return empire;
}

/** Ends the turn, past what needs you on a phone, and waits for the report. */
async function endTurn(page: Page, project: string) {
  const date = await page.locator('.map-date').textContent();
  if (isDesktop(project)) await page.keyboard.press('Enter');
  else {
    await page.getByRole('button', { name: /End turn/ }).tap();
    const needs = page.getByRole('dialog', { name: 'What needs you' });
    const report = page.getByRole('dialog', { name: 'Report' });
    await expect(needs.or(report)).toBeVisible();
    if (await needs.isVisible()) await needs.getByRole('button', { name: /End turn/ }).tap();
  }
  await expect(page.locator('.map-date')).not.toHaveText(date ?? '');
  await expect(page.getByRole('dialog', { name: 'Report' })).toBeVisible();
}

/** The panel showing what is selected: the inspector on a desktop, the sheet on a phone. */
const selection = (page: Page, project: string, name: string) =>
  isDesktop(project) ? page.locator('.map-inspector') : page.getByRole('dialog', { name });

test.describe('a game', () => {
  for (const [power, capital, first] of [
    ['Lead the Transit Authority', 'Sol', 'Petrel'],
    ['Lead the Frontier Co-op', 'Tau Ceti', 'Juniper'],
    ['Lead the Hollow Wake', 'Wolf 1061', 'Hyena'],
  ] as const) {
    test(`starts as any power: ${capital}`, async ({ page }, info) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await newGame(page, power, info.project.name);
      await expect(page.locator('.map-date')).toHaveText('Q1 2176');
      await expect(page.getByLabel('Stockpile')).toContainText('40');
      // The capital is in the middle of the map; four ships need orders, and the idle shipyard.
      expect(
        await starAt(page, capital === 'Sol' ? 'sol' : capital === 'Tau Ceti' ? 'tau-ceti' : 'wolf-1061'),
      ).not.toBeNull();
      await expect(page.locator('.needs-count-badge').first()).toHaveText('5');
      await chooseShip(page, first, info.project.name);
      await expect(page.getByText(`Idle at ${capital}`).first()).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test('sends a survey ship along a lane, ends the turn and reads what it found', async ({ page }, info) => {
    await newGame(page, 'Lead the Frontier Co-op', info.project.name);
    await chooseShip(page, 'Juniper', info.project.name);
    // On a phone, Move closes the ship's sheet first, and the map recentres.
    if (!isDesktop(info.project.name)) await page.getByRole('button', { name: 'Move', exact: true }).tap();
    const luyten = await starAt(page, 'luyten-726-8');
    expect(luyten).not.toBeNull();
    if (!luyten) return;
    if (isDesktop(info.project.name)) {
      await page.mouse.move(luyten.x, luyten.y);
      await expect(page.locator('.hover-card')).toContainText('1 jump, 1 turn');
      await page.mouse.click(luyten.x, luyten.y, { button: 'right' });
      await expect(page.getByRole('complementary', { name: 'Selected ship' })).toContainText('bound for Luyten 726-8');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('dialog', { name: 'Report' })).toContainText('Juniper surveyed Luyten 726-8');
    } else {
      await expect(page.getByRole('dialog', { name: 'Choose a destination' })).toContainText(
        'Choose where Juniper goes',
      );
      await page.touchscreen.tap(luyten.x, luyten.y);
      await expect(page.getByRole('dialog', { name: 'Choose a destination' })).toContainText('1 jump, 1 turn');
      await page.getByRole('button', { name: 'Confirm' }).tap();
      await page.getByRole('button', { name: /End turn/ }).tap();
      // Three ships are still idle, and the shipyard: they come first, as cards.
      const needs = page.getByRole('dialog', { name: 'What needs you' });
      await expect(needs).toContainText('1 of 4 need you');
      await needs.getByRole('button', { name: 'Skip' }).tap();
      await expect(needs).toContainText('2 of 4');
      await needs.getByRole('button', { name: /End turn anyway/ }).tap();
      await expect(page.getByRole('dialog', { name: 'Report' })).toContainText('Juniper surveyed Luyten 726-8');
    }
    await expect(page.locator('.map-date')).toHaveText('Q2 2176');
  });

  test('refuses a destination no lane leads to, and says why', async ({ page }, info) => {
    await newGame(page, 'Lead the Frontier Co-op', info.project.name);
    await chooseShip(page, 'Estuary', info.project.name);
    // A colony ship needs a lane, and none leads to GJ 54, close as it is.
    if (isDesktop(info.project.name)) {
      await page.keyboard.press('f'); // the flat view, where GJ 54 shows beside Tau Ceti
      const gj = await starAt(page, 'gj-54');
      if (!gj) throw new Error('GJ 54 is off screen');
      await page.mouse.click(gj.x, gj.y, { button: 'right' });
      await expect(page.getByRole('status')).toHaveText('No open lane leads to GJ 54.');
    } else {
      await page.getByRole('button', { name: 'Move', exact: true }).tap();
      const gj = await starAt(page, 'gj-54');
      if (!gj) throw new Error('GJ 54 is off screen');
      await page.touchscreen.tap(gj.x, gj.y);
      await expect(page.getByRole('dialog', { name: 'Choose a destination' })).toContainText(
        'No open lane leads to GJ 54',
      );
      await expect(page.getByRole('button', { name: 'Confirm' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Cancel' }).tap();
    }
  });

  test('saves every turn, and continues after the page is closed', async ({ page }, info) => {
    await newGame(page, 'Lead the Hollow Wake', info.project.name);
    if (isDesktop(info.project.name)) await page.keyboard.press('Enter');
    else {
      await page.getByRole('button', { name: /End turn/ }).tap();
      await page
        .getByRole('dialog', { name: 'What needs you' })
        .getByRole('button', { name: /End turn anyway/ })
        .tap();
    }
    await expect(page.locator('.map-date')).toHaveText('Q2 2176');
    await page.goto('./?test');
    await press(page.getByRole('link', { name: 'Continue' }), info.project.name);
    await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
    await expect(page.locator('.map-date')).toHaveText('Q2 2176');
    await chooseShip(page, 'Hyena', info.project.name);
    await expect(page.getByText('Idle at Wolf 1061').first()).toBeVisible();
  });

  test('has keys for the turn on the desktop', async ({ page }, info) => {
    test.skip(!isDesktop(info.project.name), 'desktop only');
    await newGame(page, 'Lead the Transit Authority', info.project.name);
    await page.keyboard.press('n');
    await expect(
      page.getByRole('complementary', { name: 'Selected ship' }).getByRole('heading', { name: 'Petrel' }),
    ).toBeVisible();
    await page.keyboard.press('n');
    await expect(
      page.getByRole('complementary', { name: 'Selected ship' }).getByRole('heading', { name: 'Bastion' }),
    ).toBeVisible();
    await page.keyboard.press('m');
    await expect(page.getByRole('dialog', { name: 'Choose a destination' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Choose a destination' })).toHaveCount(0);
    await page.keyboard.press('r');
    await expect(page.getByRole('dialog', { name: 'Report' })).toContainText('The first report comes');
  });
});

test.describe('colonies', () => {
  test('founds an outpost from the ship, and it joins the empire', async ({ page }, info) => {
    const project = info.project.name;
    await newGame(page, 'Lead the Transit Authority', project);
    await chooseShip(page, 'Redoubt', project);
    const panel = selection(page, project, 'Redoubt');
    await expect(panel).toContainText('Found an outpost at Sol');
    await press(panel.getByRole('button', { name: /^Mars / }), project);
    await expect(panel).toContainText('Founding an outpost on Mars when the turn ends');
    await endTurn(page, project);
    await expect(page.getByRole('dialog', { name: 'Report' })).toContainText(
      'Redoubt founded an outpost on Mars at Sol.',
    );
    if (!isDesktop(project)) await page.getByRole('button', { name: 'Close' }).first().tap();
    const empire = await openEmpire(page, project);
    await press(empire.getByRole('tab', { name: 'Outposts 1' }), project);
    await expect(empire).toContainText('+1 metals');
    await press(empire.getByRole('button', { name: /Mars/ }).first(), project);
    await expect(selection(page, project, 'Mars')).toContainText('An outpost at Sol');
    // The top bar counts what it adds: Earth 2, the capital 2, Mars 1.
    await expect(page.getByLabel('Stockpile')).toContainText('+5');
  });

  test('queues a ship at the capital, and it is built', async ({ page }, info) => {
    const project = info.project.name;
    await newGame(page, 'Lead the Frontier Co-op', project);
    const empire = await openEmpire(page, project);
    if (isDesktop(project)) await expect(empire.getByRole('columnheader', { name: 'People' })).toBeVisible();
    await press(empire.getByRole('button', { name: /^Tau Ceti/ }).first(), project);
    const panel = selection(page, project, 'Tau Ceti');
    await expect(panel).toContainText('Industry 12 = 10 from people + 2 from the capital');
    await press(panel.getByRole('button', { name: 'Queue a survey ship' }), project);
    await expect(panel).toContainText('in about 3 turns');
    // The shipyard is busy now: four ships still need orders.
    await expect(page.locator('.needs-count-badge').first()).toHaveText('4');
    await press(panel.getByRole('button', { name: 'Queue a mine' }), project);
    await expect(panel.getByRole('button', { name: 'Queue a mine' })).toBeDisabled();
    await expect(panel).toContainText('A mine is already queued.');
    for (let i = 0; i < 3; i++) await endTurn(page, project);
    await expect(page.getByRole('dialog', { name: 'Report' })).toContainText(
      'Tau Ceti e built a survey ship, the Prism.',
    );
    await expect(page.locator('.map-date')).toHaveText('Q4 2176');
  });
});
