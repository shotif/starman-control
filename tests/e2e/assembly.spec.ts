import { expect, type Locator, type Page, test } from '@playwright/test';

/** The Assembly (M4_FLEETS.md §29), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface GameHook {
  __game(): {
    turn: number;
    powers: { faction: string; contacts: { faction: string; stage: string; since: number; words: number }[] }[];
    wars: { a: string; b: string; since: number; by: string }[];
    assembly: { election: number } | null;
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

/** Opens the Assembly: G on a desktop, the menu on a phone and a tablet. */
async function openAssembly(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('g');
  else {
    await page.getByRole('button', { name: 'Menu', exact: true }).tap();
    await page.getByRole('button', { name: 'The Assembly', exact: true }).tap();
  }
  const screen = page.getByRole('dialog', { name: 'The Assembly' });
  await expect(screen).toBeVisible();
  return screen;
}

async function close(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();
}

/** Changes the game as the test hook allows. */
async function change(page: Page, how: string) {
  await page.evaluate((how) => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const three = ['sta', 'frontier', 'hollow-wake'];
    if (how === 'talk')
      for (const p of g.powers)
        if (three.includes(p.faction))
          p.contacts = three
            .filter((f) => f !== p.faction)
            .map((faction) => ({ faction, stage: 'talk', since: 1, words: 20 }));
    if (how === 'elect' && g.assembly) g.assembly.election = g.turn + 1;
    if (how === 'war') g.wars.push({ a: 'frontier', b: 'hollow-wake', since: g.turn, by: 'hollow-wake' });
    w.__setGame(g);
  }, how);
}

test('the Assembly forms; we vote in its election, and propose sanctions on a member at war', async ({
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

  // Before it forms, it says when it will.
  let assembly = await openAssembly(page, project);
  await expect(assembly).toContainText('The Assembly forms once three powers can each talk with the other two');
  await close(page, project);

  // We, the Cooperative and the Wake can each talk with the other two: it forms as the turn ends.
  await change(page, 'talk');
  let report = await endTurn(page, project);
  await expect(report).toContainText(
    'The Assembly has formed, its first members us, the Frontier Co-op and the Hollow Wake.',
  );
  await close(page, project);

  // Its election next turn: the candidates are named, and we vote.
  await change(page, 'elect');
  report = await endTurn(page, project);
  await expect(report).toContainText(/The Assembly elects its leader next turn: .+ Cast our vote in the Assembly\./);
  await close(page, project);
  assembly = await openAssembly(page, project);
  const election = assembly.getByRole('region', { name: 'The election' });
  await expect(election).toContainText('votes are counted as the turn ends');
  const choice = election.getByRole('button', { name: /^For / }).first();
  await press(choice, project);
  await expect(choice).toHaveAttribute('aria-pressed', 'true');
  await close(page, project);
  report = await endTurn(page, project);
  await expect(report).toContainText(/leads? the Assembly, with \d+ of its \d+ votes to \d+\./);
  await close(page, project);

  // The Wake at war with the Cooperative: we propose sanctions on it, and vote for them.
  await change(page, 'war');
  assembly = await openAssembly(page, project);
  await press(
    assembly.getByRole('region', { name: 'Propose' }).getByRole('button', { name: 'Sanctions on the Hollow Wake' }),
    project,
  );
  await expect(assembly).toContainText(
    'Sanctions on the Hollow Wake, proposed by us, goes before the Assembly next turn.',
  );
  await close(page, project);
  report = await endTurn(page, project);
  await expect(report).toContainText('We propose sanctions on the Hollow Wake: the Assembly votes on it next turn.');
  await close(page, project);
  assembly = await openAssembly(page, project);
  const resolution = assembly.getByRole('region', { name: 'The resolution' });
  await press(resolution.getByRole('button', { name: 'For', exact: true }), project);
  await close(page, project);
  report = await endTurn(page, project);
  await expect(report).toContainText(/The Assembly passed sanctions on the Hollow Wake, \d+ votes to \d+\./);
  await expect(report).toContainText('The Assembly’s sanctions fall on the Hollow Wake');
  await close(page, project);
  assembly = await openAssembly(page, project);
  await expect(assembly.getByRole('list', { name: 'Members' })).toContainText('sanctioned');
  expect(errors).toEqual([]);
});
