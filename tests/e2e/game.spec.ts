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
      // The capital is in the middle of the map; four ships need orders, the idle shipyard and research.
      expect(
        await starAt(page, capital === 'Sol' ? 'sol' : capital === 'Tau Ceti' ? 'tau-ceti' : 'wolf-1061'),
      ).not.toBeNull();
      await expect(page.locator('.needs-count-badge').first()).toHaveText('6');
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
      await expect(needs).toContainText('1 of 5 need you');
      await needs.getByRole('button', { name: 'Skip' }).tap();
      await expect(needs).toContainText('2 of 5');
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
    // The shipyard is busy now: four ships and research still need you.
    await expect(page.locator('.needs-count-badge').first()).toHaveText('5');
    await press(panel.getByRole('button', { name: 'Queue a mine' }), project);
    await expect(panel.getByRole('button', { name: 'Queue a mine' })).toBeDisabled();
    await expect(panel).toContainText('A mine is already queued.');
    for (let i = 0; i < 3; i++) await endTurn(page, project);
    await expect(page.getByRole('dialog', { name: 'Report' })).toContainText(
      'Tau Ceti e built a survey ship, the Prism.',
    );
    await expect(page.locator('.map-date')).toHaveText('Q4 2176');
  });

  test('queues a lane from the capital, and the turn report says it is being tuned', async ({ page }, info) => {
    const project = info.project.name;
    await newGame(page, 'Lead the Frontier Co-op', project);
    const empire = await openEmpire(page, project);
    await press(empire.getByRole('button', { name: /^Tau Ceti/ }).first(), project);
    const panel = selection(page, project, 'Tau Ceti');
    const lane = panel.getByRole('button', { name: 'Queue a lane to Epsilon Eridani' });
    await expect(lane).toContainText('5.5 ly, tuned for 3 turns');
    await expect(lane).toContainText('53 industry, 6 metals, 11 fusion fuel');
    await press(lane, project);
    await expect(panel).toContainText('New lane to Epsilon Eridani');
    await expect(panel).toContainText('then tuned for 3 turns');
    await expect(lane).toBeDisabled();
    await expect(lane).toContainText('A lane to Epsilon Eridani is already queued.');
    // 53 industry at 12 a turn: paid in the fifth turn.
    for (let i = 0; i < 5; i++) await endTurn(page, project);
    await expect(page.getByRole('dialog', { name: 'Report' })).toContainText(
      'Tau Ceti e has paid for a new lane to Epsilon Eridani: its beacons are tuned for 3 turns.',
    );
  });
});

test.describe('research', () => {
  test('researches a technology from the tree, and the report says so', async ({ page }, info) => {
    const project = info.project.name;
    await newGame(page, 'Lead the Transit Authority', project);
    if (isDesktop(project)) await page.keyboard.press('t');
    else await page.getByRole('button', { name: 'Research', exact: true }).tap();
    const screen = page.getByRole('dialog', { name: 'Research' });
    await expect(screen).toContainText('Research 5 a turn = from 10 million people × ½');
    await expect(screen).toContainText('Nothing is being researched');
    await expect(page.locator('.needs-count-badge').first()).toHaveText('6');
    // Lane engineering II brings Lane engineering I with it.
    await press(screen.getByRole('button', { name: 'Queue Lane engineering II', exact: true }), project);
    await expect(screen.locator('.research-queue')).toContainText('Lane engineering I');
    await expect(screen.locator('.research-queue')).toContainText('Lane engineering II');
    await press(screen.getByRole('button', { name: 'Research Deep survey now' }), project);
    await expect(screen.locator('.research-queue li').first()).toContainText('Deep survey');
    await expect(screen.locator('.research-queue li').first()).toContainText('done in about 6 turns');
    await expect(page.locator('.needs-count-badge').first()).toHaveText('5');
    if (!isDesktop(project)) await page.getByRole('button', { name: 'Close' }).first().tap();
    for (let i = 0; i < 6; i++) await endTurn(page, project);
    await expect(page.getByRole('dialog', { name: 'Report' })).toContainText(
      'Researched Deep survey: Investigating an anomaly takes one turn less',
    );
  });
});

test.describe('anomalies', () => {
  test('a survey finds an anomaly, and the survey ship investigates it', async ({ page }, info) => {
    const project = info.project.name;
    // With seed 1, Barnard's Star, one lane from Sol, holds a silent relay.
    await newGame(page, 'Lead the Transit Authority', project, '1');
    await chooseShip(page, 'Petrel', project);
    if (isDesktop(project)) {
      await page.keyboard.press('f');
      const barnard = await starAt(page, 'barnard');
      if (!barnard) throw new Error("Barnard's Star is off screen");
      await page.mouse.click(barnard.x, barnard.y, { button: 'right' });
    } else {
      await page.getByRole('button', { name: 'Move', exact: true }).tap();
      const barnard = await starAt(page, 'barnard');
      if (!barnard) throw new Error("Barnard's Star is off screen");
      await page.touchscreen.tap(barnard.x, barnard.y);
      await page.getByRole('button', { name: 'Confirm' }).tap();
    }
    await endTurn(page, project);
    await expect(page.getByRole('dialog', { name: 'Report' })).toContainText(
      'An anomaly: A communications relay from Reborn’s days, silent.',
    );
    if (!isDesktop(project)) await page.getByRole('button', { name: 'Close' }).first().tap();
    await chooseShip(page, 'Petrel', project);
    const panel = selection(page, project, 'Petrel');
    await expect(panel).toContainText('A silent relay');
    await press(panel.getByRole('button', { name: 'Investigate: 2 turns' }), project);
    await expect(panel).toContainText('Investigating a silent relay at Barnard’s Star: 2 turns left');
    await endTurn(page, project);
    await endTurn(page, project);
    await expect(page.getByRole('dialog', { name: 'Report' })).toContainText(
      'Petrel investigated a silent relay at Barnard’s Star. Its memory is full of messages that were never delivered.',
    );
    await expect(page.getByRole('dialog', { name: 'Report' })).toContainText('20 research points.');
  });
});

/** Opens the menu (a sheet on a phone, a popover on a desktop) and follows one of its links. */
async function fromMenu(page: Page, item: string, project: string) {
  await press(page.getByRole('button', { name: 'Menu', exact: true }), project);
  await press(page.getByRole('link', { name: item, exact: true }), project);
}

test.describe('the M1 journey', () => {
  test('survey, settle and research, end five turns, save to a slot, reload, and find the game as it was', async ({
    page,
  }, info) => {
    const project = info.project.name;
    await newGame(page, 'Lead the Transit Authority', project, '42');
    // Survey: Petrel to Alpha Centauri.
    await chooseShip(page, 'Petrel', project);
    if (isDesktop(project)) {
      await page.keyboard.press('m');
      const ac = await starAt(page, 'alpha-centauri');
      if (!ac) throw new Error('Alpha Centauri is off screen');
      await page.mouse.click(ac.x, ac.y);
    } else {
      await page.getByRole('button', { name: 'Move', exact: true }).tap();
      const ac = await starAt(page, 'alpha-centauri');
      if (!ac) throw new Error('Alpha Centauri is off screen');
      await page.touchscreen.tap(ac.x, ac.y);
    }
    await press(page.getByRole('button', { name: 'Confirm' }), project);
    // Settle: an outpost on Mars.
    await chooseShip(page, 'Redoubt', project);
    await press(selection(page, project, 'Redoubt').getByRole('button', { name: /^Mars / }), project);
    // Research: Deep survey.
    if (isDesktop(project)) await page.keyboard.press('t');
    else await page.getByRole('button', { name: 'Research', exact: true }).tap();
    await press(page.getByRole('button', { name: 'Research Deep survey now' }), project);
    if (isDesktop(project)) await page.keyboard.press('Escape');
    else await page.getByRole('button', { name: 'Close' }).first().tap();
    for (let i = 0; i < 5; i++) await endTurn(page, project);
    await expect(page.locator('.map-date')).toHaveText('Q2 2177');
    if (!isDesktop(project)) await page.getByRole('button', { name: 'Close' }).first().tap();
    await fromMenu(page, 'Saves', project);
    const slot = page.getByRole('region', { name: 'Slot 1' });
    await press(slot.getByRole('button', { name: 'Save here' }), project);
    await expect(page.getByRole('status')).toHaveText('Saved to slot 1.');
    await expect(slot).toContainText('Sol Transit Authority · Q2 2177');
    // A new visit: the slot loads the game as it was.
    await page.goto('./?test#/saves');
    await press(page.getByRole('region', { name: 'Slot 1' }).getByRole('button', { name: 'Load' }), project);
    await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
    await expect(page.locator('.map-date')).toHaveText('Q2 2177');
    const empire = await openEmpire(page, project);
    await expect(empire.getByRole('tab', { name: 'Outposts 1' })).toBeVisible();
    if (isDesktop(project)) await page.keyboard.press('Escape');
    else await page.getByRole('button', { name: 'Close' }).first().tap();
    if (isDesktop(project)) await page.keyboard.press('t');
    else await page.getByRole('button', { name: 'Research', exact: true }).tap();
    await expect(page.getByRole('dialog', { name: 'Research' }).locator('.research-queue')).toContainText(
      'Deep survey',
    );
    await expect(page.getByRole('dialog', { name: 'Research' }).locator('.research-queue')).toContainText('25 of 30');
  });

  test('keeps the settings, and the text grows with them', async ({ page }, info) => {
    const project = info.project.name;
    await page.goto('./?test#/settings');
    await press(page.getByRole('button', { name: '130%' }), project);
    await press(page.getByRole('button', { name: 'Low', exact: true }), project);
    const size = () => page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    expect(await size()).toBe('20.8px');
    await page.reload();
    expect(await size()).toBe('20.8px');
    await expect(page.getByRole('button', { name: 'Low', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });
});

test.describe('an app, not a tab', () => {
  test('can be installed, and plays offline after one visit', async ({ page, context }, info) => {
    test.skip(!isDesktop(info.project.name), 'once is enough');
    const manifest = await page.request.get('./manifest.webmanifest');
    expect((await manifest.json()).display).toBe('fullscreen');
    // Without ?test, so the service worker is kept.
    await page.goto('./');
    await expect(page.getByRole('heading', { name: /Starman/ })).toBeVisible();
    await expect
      .poll(() => page.evaluate(async () => (await caches.keys()).length), { timeout: 20_000 })
      .toBeGreaterThan(0);
    await expect
      .poll(() => page.evaluate(async () => (await (await caches.open('starman-control-v1')).keys()).length), {
        timeout: 20_000,
      })
      .toBeGreaterThan(5);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: /Starman/ })).toBeVisible();
    await page.goto('./#/map');
    await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
    await context.setOffline(false);
  });
});
