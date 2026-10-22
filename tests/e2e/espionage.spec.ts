import { expect, type Locator, type Page, test } from '@playwright/test';

/** Light espionage (M5_UNKNOWN.md §23), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface Contact {
  faction: string;
  stage: string;
  since: number;
  words: number;
}
interface GameHook {
  __game(): {
    powers: { faction: string; contacts: Contact[]; intel: { faction: string; level: number }[] }[];
  };
  __setGame(g: unknown): void;
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

/** Opens the diplomacy screen: Y on a desktop, the menu on a phone and a tablet. */
async function openDiplomacy(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('y');
  else {
    await page.getByRole('button', { name: 'Menu', exact: true }).tap();
    await page.getByRole('button', { name: 'Diplomacy', exact: true }).tap();
  }
  const screen = page.getByRole('dialog', { name: 'Diplomacy' });
  await expect(screen).toBeVisible();
  return screen;
}

async function close(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();
}

/** Opens the Co-op's detail on the diplomacy screen. */
async function coopDetail(page: Page, project: string) {
  const screen = await openDiplomacy(page, project);
  if (!isDesktop(project)) await screen.getByRole('button', { name: /The Frontier Co-op:/ }).tap();
  return { screen, detail: screen.getByRole('region', { name: 'The Frontier Co-op', exact: true }) };
}

test('agents sent to watch a power, its holdings learnt, and a guard kept at home', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // The Authority and the Co-op have met, and can talk.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const sta = g.powers.find((p) => p.faction === 'sta');
    const coop = g.powers.find((p) => p.faction === 'frontier');
    if (!sta || !coop) return;
    sta.contacts.push({ faction: 'frontier', stage: 'talk', since: 1, words: 20 });
    coop.contacts.push({ faction: 'sta', stage: 'talk', since: 1, words: 20 });
    w.__setGame(g);
  });

  // We watch the Co-op, and keep some guard at home.
  let { screen, detail } = await coopDetail(page, project);
  const agents = detail.getByRole('region', { name: 'Agents', exact: true });
  await expect(agents).toContainText('What we know: 0 of 100. Nothing yet beyond what we see.');
  await press(agents.getByRole('button', { name: 'Watch them: 5 credits a turn' }), project);
  await expect(agents.getByRole('button', { name: 'Recall our agents' })).toBeVisible();
  const some = screen.getByRole('button', { name: 'Some', exact: true });
  await press(some, project);
  await expect(some).toHaveAttribute('aria-pressed', 'true');
  await expect(screen).toContainText('5 credits a turn; others learn 4 less of us each turn.');
  await close(page, project);

  let report = await endTurn(page, project);
  await close(page, project);
  ({ detail } = await coopDetail(page, project));
  await expect(detail).toContainText('What we know: 10 of 100.');
  await close(page, project);

  // Nearly at the first mark: the next turn reaches it, and the Watch says so.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const sta = g.powers.find((p) => p.faction === 'sta');
    if (sta) sta.intel = [{ faction: 'frontier', level: 20 }];
    w.__setGame(g);
  });
  report = await endTurn(page, project);
  await expect(report).toContainText(
    'Our agents among the Frontier Co-op now know where every holding of theirs lies.',
  );
  await close(page, project);
  ({ detail } = await coopDetail(page, project));
  await expect(detail).toContainText('What we know: 30 of 100. We know where every holding of theirs lies.');
  await press(detail.getByRole('button', { name: 'Recall our agents' }), project);
  await expect(detail.getByRole('button', { name: 'Watch them: 5 credits a turn' })).toBeVisible();
  expect(errors).toEqual([]);
});
