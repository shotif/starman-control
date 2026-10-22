import { expect, type Locator, type Page, test } from '@playwright/test';

/** Leaders (M5_UNKNOWN.md §24), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface GameHook {
  __game(): {
    nextLeaderId: number;
    powers: { faction: string; treasury: number }[];
    candidates: Record<string, unknown>[];
  };
  __setGame(g: unknown): void;
}

/** Opens Leaders: L on a desktop, the menu on a phone and a tablet. */
async function openLeaders(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('l');
  else {
    await page.getByRole('button', { name: 'Menu', exact: true }).tap();
    await page.getByRole('button', { name: 'Leaders', exact: true }).tap();
  }
  const screen = page.getByRole('dialog', { name: 'Leaders' });
  await expect(screen).toBeVisible();
  return screen;
}

async function close(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();
}

test('a steward hired, posted to the capital, and their trait in its approval', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });

  // Nothing offered yet on the first turn.
  let screen = await openLeaders(page, project);
  await expect(screen.getByRole('region', { name: 'Our leaders' })).toContainText('None yet.');
  await expect(screen.getByRole('region', { name: 'Offered to us' })).toContainText('No one yet.');
  await close(page, project);

  // A steward offered to us, and credits to hire them.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const sta = g.powers.find((p) => p.faction === 'sta');
    if (sta) sta.treasury = 200;
    g.candidates.push({
      id: g.nextLeaderId++,
      serves: 'sta',
      people: 'sta',
      name: 'Amara Lindgren',
      face: 2,
      calling: 'steward',
      traits: [{ trait: 'beloved', level: 2 }],
      flaw: null,
      wage: 4,
      post: null,
      served: 0,
      fee: 80,
    });
    w.__setGame(g);
  });

  screen = await openLeaders(page, project);
  const offered = screen.getByRole('region', { name: 'Offered to us' });
  await expect(offered).toContainText('Steward Amara Lindgren');
  await expect(offered).toContainText('Beloved 2: +6 approval at the colony');
  await press(offered.getByRole('button', { name: 'Hire Steward Amara Lindgren for 80 credits' }), project);
  const ours = screen.getByRole('region', { name: 'Our leaders' });
  await expect(ours).toContainText('Ours: 1 of 8');
  await expect(ours).toContainText('wages 4 credits a turn');
  await ours.getByRole('combobox').selectOption({ label: 'Earth' });
  await expect(ours.getByRole('combobox')).not.toHaveValue('');
  await close(page, project);

  // The capital's panel names its steward.
  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const empire = page.getByRole('dialog', { name: 'Empire' });
  await press(empire.getByRole('button', { name: /^Earth/ }).first(), project);
  const panel = isDesktop(project) ? page.locator('.map-inspector') : page.getByRole('dialog', { name: 'Earth' });
  await expect(panel).toContainText('Steward Amara Lindgren: Beloved 2, +6 approval at the colony.');
  expect(errors).toEqual([]);
});
