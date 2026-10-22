import { expect, type Locator, type Page, test } from '@playwright/test';

/** The battle replay (M4_FLEETS.md §25), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface Game {
  nextShipId: number;
  nextFleetId: number;
  ships: Record<string, unknown>[];
  fleets: Record<string, unknown>[];
  wars: Record<string, unknown>[];
  powers: {
    faction: string;
    fleetsMade: number;
    contacts: Record<string, unknown>[];
    designs: { id: number; hull: string; retired: boolean }[];
  }[];
}

interface Replay {
  time: number;
  playing: boolean;
  speed: number;
  model: { duration: number; rounds: number };
}

const replay = (page: Page) => page.evaluate(() => (window as unknown as { __replay: Replay | null }).__replay);

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

test('a battle watched from the report: played, paused, stepped, rewound, faster, skipped, and closed', async ({
  page,
}, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // At war with the Cooperative: four of our frigates and three of theirs at Alpha Centauri.
  await page.evaluate(() => {
    const w = window as unknown as { __game(): Game; __setGame(g: unknown): void };
    const g = structuredClone(w.__game());
    const add = (owner: string, names: string[], stance: string) => {
      const p = g.powers.find((x) => x.faction === owner);
      const design = p?.designs.find((d) => d.hull === 'frigate' && !d.retired);
      if (!p || !design) return;
      const fleet = g.nextFleetId++;
      p.fleetsMade++;
      g.fleets.push({
        id: fleet,
        owner,
        name: owner === 'sta' ? '1st Squadron' : '1st Flotilla',
        destinations: [],
        hold: false,
        stance,
        target: 'warships',
        retreat: 100,
        mission: null,
      });
      for (const name of names)
        g.ships.push({
          id: g.nextShipId++,
          owner,
          type: 'frigate',
          name,
          at: 'alpha-centauri',
          destinations: [],
          blindJump: null,
          hold: false,
          autoSurvey: false,
          founding: null,
          investigating: null,
          design: design.id,
          fleet,
          damage: 0,
        });
    };
    add('sta', ['Lance', 'Pike', 'Halberd', 'Glaive'], 'engage');
    add('frontier', ['Rowan', 'Ash', 'Elder'], 'defend');
    g.powers
      .find((p) => p.faction === 'sta')
      ?.contacts.push({ faction: 'frontier', stage: 'talk', since: 1, words: 20 });
    g.powers
      .find((p) => p.faction === 'frontier')
      ?.contacts.push({ faction: 'sta', stage: 'talk', since: 1, words: 20 });
    g.wars.push({ a: 'frontier', b: 'sta', since: 1, by: 'sta' });
    w.__setGame(g);
  });

  const report = await endTurn(page, project);
  await press(report.getByRole('button', { name: 'Watch the battle at Alpha Centauri' }), project);
  const view = page.getByTestId('replay');
  await expect(view).toBeVisible();
  await expect(page.getByTestId('map')).toHaveAttribute('data-replay', 'yes');
  // The map's bars wait while it plays.
  await expect(page.getByRole('button', { name: /End turn/ })).toBeHidden();
  await expect(view.getByRole('heading', { name: /Battle at Alpha Centauri/ })).toBeVisible();

  // It plays at once.
  await expect.poll(async () => (await replay(page))?.time ?? 0).toBeGreaterThan(0.5);
  const controls = view.getByRole('toolbar', { name: 'Replay' });
  await press(controls.getByRole('button', { name: 'Pause' }), project);
  expect((await replay(page))?.playing).toBe(false);
  await expect(controls.getByRole('button', { name: 'Play' })).toBeVisible();

  // Back to the start, then a round at a time.
  await press(controls.getByRole('button', { name: 'Back to the start' }), project);
  await expect(view.locator('.replay-round')).toHaveText('Before the first round');
  await press(controls.getByRole('button', { name: 'A round on' }), project);
  await expect(view.locator('.replay-round')).toHaveText('Round 1 of 8');
  await press(controls.getByRole('button', { name: 'A round on' }), project);
  await expect(view.locator('.replay-round')).toHaveText('Round 2 of 8');
  await press(controls.getByRole('button', { name: 'A round back' }), project);
  await expect(view.locator('.replay-round')).toHaveText('Round 1 of 8');

  // Faster.
  await press(controls.getByRole('button', { name: 'Speed: 1×' }), project);
  expect((await replay(page))?.speed).toBe(2);
  await press(controls.getByRole('button', { name: 'Speed: 2×' }), project);
  expect((await replay(page))?.speed).toBe(4);

  // The account beside it: a panel on a desktop, a sheet on a phone.
  const toggle = view.getByRole('button', { name: 'Account' });
  if (await toggle.isVisible()) await press(toggle, project);
  const account = view.getByRole('complementary', { name: 'The account of the battle' });
  await expect(account).toContainText('A battle at Alpha Centauri against the Frontier Co-op');
  await expect(account.getByRole('region', { name: 'Sol Transit Authority' })).toContainText('4 fighting');
  // A ship chosen in the account: its card says what is left of it.
  await press(account.getByRole('button', { name: 'Lance' }), project);
  await expect(view.locator('.replay-card')).toContainText('Lance');
  await expect(view.locator('.replay-card')).toContainText(/Structure \d+ of 20/);

  // Skip to the end, with the result.
  await press(controls.getByRole('button', { name: 'Skip' }), project);
  await expect(view.locator('.replay-round')).toContainText('the end');
  const end = await replay(page);
  expect(end?.time).toBe(end?.model.duration);
  await expect(controls.getByRole('button', { name: 'Play again' })).toBeVisible();

  if (isDesktop(project)) {
    // The keys: Home to the start, Space to play, → a round on, Escape to close.
    await page.keyboard.press('Home');
    await expect(view.locator('.replay-round')).toHaveText('Before the first round');
    await page.keyboard.press('ArrowRight');
    await expect(view.locator('.replay-round')).toHaveText('Round 1 of 8');
    await page.keyboard.press('Space');
    await expect.poll(async () => (await replay(page))?.playing).toBe(true);
    await page.keyboard.press('Escape');
  } else await press(view.getByRole('button', { name: '← Back' }), project);

  // Back to the report, and the map.
  await expect(view).toBeHidden();
  await expect(page.getByRole('dialog', { name: 'Report' })).toBeVisible();
  await expect(page.getByTestId('map')).not.toHaveAttribute('data-replay', 'yes');
  await expect(page.getByRole('button', { name: /End turn/ }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
