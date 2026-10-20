import { expect, type Locator, type Page, test } from '@playwright/test';

/** The colony in pictures (COLONY_VIEW.md): the still in a colony's panel, and the diorama it opens. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface ColonyHook {
  __colony: {
    look: { cx: number; cy: number; k: number };
    info: { biome: string; architecture: string; buildings: number; props: number; pictures: string[] };
    life: { people: number; vehicles: number; shuttle: boolean; weather: string | null; night: number; clock: number };
    setClock(seconds: number): void;
    pointOn(slot: number): { x: number; y: number } | null;
    buildingsOnScreen(): { kind: string; slot: number; x: number; y: number; w: number; h: number }[];
    propsOnScreen(): { kind: string; x: number; y: number; w: number; h: number }[];
  };
}

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

/** Opens the colony's diorama from its still, and waits for it to be drawn. */
async function enterColony(page: Page, panel: Locator, name: string, project: string) {
  await expect(panel.getByTestId('colony-still')).toHaveClass(/is-drawn/, { timeout: 20_000 });
  await press(panel.getByRole('button', { name: `View ${name}` }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-colony-ready', '1', { timeout: 30_000 });
}

const colony = (page: Page) => page.evaluate(() => (window as unknown as ColonyHook).__colony.info);
const onScreen = (page: Page) => page.evaluate(() => (window as unknown as ColonyHook).__colony.buildingsOnScreen());
const look = (page: Page) => page.evaluate(() => (window as unknown as ColonyHook).__colony.look);
const life = (page: Page) => page.evaluate(() => (window as unknown as ColonyHook).__colony.life);

/** Taps (or clicks) a building of a kind in the scene, where it shows and nothing stands in front. */
async function pressBuilding(page: Page, kind: string, project: string) {
  const map = await page.getByTestId('map').boundingBox();
  const slots = (await onScreen(page)).filter((x) => x.kind === kind).map((x) => x.slot);
  let at: { x: number; y: number } | null = null;
  for (const slot of slots) {
    at = await page.evaluate((s) => (window as unknown as ColonyHook).__colony.pointOn(s), slot);
    if (at) break;
  }
  if (!at || !map) throw new Error(`no ${kind} in view`);
  const x = map.x + at.x;
  const y = map.y + at.y;
  if (isDesktop(project)) await page.mouse.click(x, y);
  else await page.touchscreen.tap(x, y);
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
  // No label says how the picture was made (D-29); the codex's credits do.
  await expect(still).not.toContainText('Illustration');
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

test('the still opens the colony as a diorama, which pans, follows the queue, and goes back to the map', async ({
  page,
}, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const panel = await openCapital(page, 'Lead the Frontier Co-op', 'Tau Ceti e', '1', project);
  await enterColony(page, panel, 'Tau Ceti e', project);
  const scene = await colony(page);
  expect(scene).toMatchObject({ biome: 'shore', architecture: 'cooperative', buildings: 6 });
  // Neighbouring homes show different versions of their picture, and props stand between the
  // buildings (COLONY_VIEW.md §9).
  const homes = scene.pictures.filter((p) => p.startsWith('cooperative-homes-'));
  expect(new Set(homes).size).toBe(homes.length);
  expect(homes).toEqual(expect.arrayContaining(['cooperative-homes-2-domed-b', 'cooperative-homes-2-domed-c']));
  expect(scene.props).toBeGreaterThanOrEqual(3);
  expect(scene.pictures).toContain('cooperative-monument');
  // Every prop the scene chose is drawn.
  const props = await page.evaluate(() => (window as unknown as ColonyHook).__colony.propsOnScreen());
  expect(props.length).toBe(scene.props);
  // The town is in view, between the bars and above the sheet.
  const stage = await page.getByTestId('map').boundingBox();
  const seen = (await onScreen(page)).filter(
    (b) => stage && b.x + b.w > 0 && b.x < stage.width && b.y + b.h > 0 && b.y < stage.height,
  );
  expect(seen.length).toBeGreaterThanOrEqual(3);
  await expect(page.locator('.colony-bar').getByRole('button', { name: '← Tau Ceti' })).toBeVisible();
  await expect(page.locator('.colony-bar')).not.toContainText('Illustration');
  // The panel stays, without its still.
  await expect(panel.getByRole('heading', { name: 'Tau Ceti e' })).toBeVisible();
  await expect(panel.getByTestId('colony-still')).toHaveCount(0);

  // Dragging looks along the town.
  const before = await look(page);
  const canvas = page.getByTestId('map').locator('canvas').first();
  const c = await canvas.boundingBox();
  if (!c) throw new Error('no canvas');
  const y = c.y + c.height * 0.3;
  if (isDesktop(project)) {
    await page.mouse.move(c.x + c.width * 0.6, y);
    await page.mouse.down();
    await page.mouse.move(c.x + c.width * 0.3, y, { steps: 6 });
    await page.mouse.up();
  } else {
    // A real finger, through the browser's own touch input.
    const cdp = await page.context().newCDPSession(page);
    const x0 = c.x + c.width * 0.6;
    const x1 = c.x + c.width * 0.3;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] });
    for (let i = 1; i <= 6; i++)
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x0 + ((x1 - x0) * i) / 6, y }],
      });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await expect.poll(async () => (await look(page)).cx).toBeGreaterThan(before.cx);

  // What is queued stands as a scaffold, in the scene too.
  await press(panel.getByRole('button', { name: 'Queue a mine' }), project);
  await expect(panel).toContainText('A mine is already queued.');
  // The scaffold's picture loads first; a slow machine takes a while.
  await expect.poll(async () => (await onScreen(page)).map((b) => b.kind), { timeout: 30_000 }).toContain('scaffold');

  // Back to the map.
  await press(page.locator('.colony-bar').getByRole('button', { name: '← Tau Ceti' }), project);
  await expect(page.getByTestId('map')).not.toHaveAttribute('data-colony-ready', '1');
  await expect(panel.getByTestId('colony-still')).toBeVisible();
  expect(errors).toEqual([]);
});

test('each power builds in its own way, on its own ground', async ({ page }, info) => {
  test.skip(!isDesktop(info.project.name), 'one size is enough to check the three sets');
  test.slow();
  const project = info.project.name;
  // Earth's open air leaves a slot for fields; Wolf 1061 c's town is sealed.
  for (const [power, capital, seed, biome, architecture, buildings] of [
    ['Lead the Transit Authority', 'Earth', '42', 'garden', 'authority', 7],
    ['Lead the Hollow Wake', 'Wolf 1061 c', '4242', 'inferno', 'wake', 6],
  ] as const) {
    const panel = await openCapital(page, power, capital, seed, project);
    await enterColony(page, panel, capital, project);
    expect(await colony(page)).toMatchObject({ biome, architecture, buildings });
    expect((await colony(page)).props).toBeGreaterThanOrEqual(2);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('map')).not.toHaveAttribute('data-colony-ready', '1');
  }
});

test('the colony lives: people walk, a rover drives, the shuttle visits, the day turns, and a building has a card', async ({
  page,
}, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // The medium quality setting has weather. (A machine of four cores starts on low.)
  await page.addInitScript(() =>
    localStorage.setItem('starman-control:settings', JSON.stringify({ quality: 'medium' })),
  );
  const panel = await openCapital(page, 'Lead the Frontier Co-op', 'Tau Ceti e', '1', project);
  await enterColony(page, panel, 'Tau Ceti e', project);
  const now = await life(page);
  expect(now.people).toBeGreaterThan(10);
  expect(now.vehicles).toBeGreaterThanOrEqual(1);
  expect(now.shuttle).toBe(true);
  expect(now.weather).toBe('dust');
  // Time passes on its own.
  await expect.poll(async () => (await life(page)).clock).toBeGreaterThan(now.clock + 0.5);
  // Night falls.
  await page.evaluate(() => (window as unknown as ColonyHook).__colony.setClock(72));
  await expect.poll(async () => (await life(page)).night).toBeGreaterThan(0.9);
  await page.evaluate(() => (window as unknown as ColonyHook).__colony.setClock(20));
  await expect.poll(async () => (await life(page)).night).toBe(0);

  // A building, tapped, is lit and has a card.
  await pressBuilding(page, 'homes', project);
  const card = page.locator('.colony-card');
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading')).toHaveText('Homes, sealed');
  await expect(card).toContainText('10 million people live in the colony’s 3 homes.');
  await press(card.getByRole('button', { name: 'Close' }), project);
  await expect(card).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a finished mine stands where its scaffold was, and the report shows it', async ({ page }, info) => {
  test.skip(!isDesktop(info.project.name), 'ending turns is tested on every size elsewhere');
  test.slow();
  const project = info.project.name;
  const panel = await openCapital(page, 'Lead the Frontier Co-op', 'Tau Ceti e', '1', project);
  await press(panel.getByRole('button', { name: 'Queue a mine' }), project);
  // 30 industry at 12 a turn: finished in the third turn.
  for (let i = 0; i < 3; i++) {
    const date = await page.locator('.map-date').textContent();
    await page.keyboard.press('Enter');
    await expect(page.locator('.map-date')).not.toHaveText(date ?? '');
    if (i < 2) await page.keyboard.press('Escape');
  }
  const report = page.getByRole('dialog', { name: 'Report' });
  await expect(report).toContainText('Tau Ceti e built a mine');
  await report.getByRole('button', { name: 'See it' }).click();
  await expect(page.getByTestId('map')).toHaveAttribute('data-colony-ready', '1', { timeout: 30_000 });
  const kinds = (await onScreen(page)).map((b) => b.kind);
  expect(kinds).toContain('mine');
  expect(kinds).not.toContain('scaffold');
});

test('every colony and outpost can be seen from the empire’s list', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  await openCapital(page, 'Lead the Frontier Co-op', 'Tau Ceti e', '1', project);
  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const empire = page.getByRole('dialog', { name: 'Empire' });
  await press(empire.getByRole('button', { name: 'View Tau Ceti e' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-colony-ready', '1', { timeout: 30_000 });
  await expect(empire).toHaveCount(0);
  expect((await colony(page)).architecture).toBe('cooperative');
});

test('an outpost is its rig, with no one about', async ({ page }, info) => {
  test.skip(!isDesktop(info.project.name), 'founding is tested on every size elsewhere');
  test.slow();
  const project = info.project.name;
  await openCapital(page, 'Lead the Frontier Co-op', 'Tau Ceti e', '1', project);
  await page.keyboard.press('Escape');
  // The outpost ship founds an outpost at home when the turn ends.
  await page
    .getByRole('complementary', { name: 'Your power' })
    .locator('.ships-list')
    .getByRole('button', { name: /Hawthorn/ })
    .click();
  const inspector = page.locator('.map-inspector');
  await inspector.locator('.found-row').first().click();
  const date = await page.locator('.map-date').textContent();
  await page.keyboard.press('Enter');
  await expect(page.locator('.map-date')).not.toHaveText(date ?? '');
  await page.keyboard.press('Escape');
  await page.keyboard.press('p');
  const empire = page.getByRole('dialog', { name: 'Empire' });
  await empire.getByRole('tab', { name: /Outposts/ }).click();
  await empire
    .getByRole('button', { name: /^View / })
    .first()
    .click();
  await expect(page.getByTestId('map')).toHaveAttribute('data-colony-ready', '1', { timeout: 30_000 });
  expect((await colony(page)).buildings).toBe(1);
  expect((await onScreen(page)).map((b) => b.kind)).toEqual(['rig']);
  expect((await life(page)).people).toBe(0);
});

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('the colony opens without a glide or a veil, and nothing in it moves', async ({ page }, info) => {
    const project = info.project.name;
    const panel = await openCapital(page, 'Lead the Frontier Co-op', 'Tau Ceti e', '1', project);
    await enterColony(page, panel, 'Tau Ceti e', project);
    await expect(page.locator('.map-veil')).toHaveCount(0);
    const still = await life(page);
    expect(still.people).toBe(0);
    expect(still.weather).toBeNull();
    expect(still.night).toBe(0);
    await page.waitForTimeout(600);
    expect((await life(page)).clock).toBe(still.clock);
  });
});
