import { expect, type Locator, type Page, test } from '@playwright/test';

/** Exchanges and the Wake's dealings (M3_NEIGHBOURS.md §23), on a phone, a tablet and a desktop. */

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
    powers: {
      faction: string;
      contacts: Contact[];
      treasury: number;
      stockpile: { metals: number; volatiles: number; fuel: number };
    }[];
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

/** Opens the diplomacy screen at a power: Y on a desktop, the menu on a phone and a tablet. */
async function openDiplomacy(page: Page, project: string, name: string) {
  if (isDesktop(project)) await page.keyboard.press('y');
  else {
    await page.getByRole('button', { name: 'Menu', exact: true }).tap();
    await page.getByRole('button', { name: 'Diplomacy', exact: true }).tap();
  }
  const screen = page.getByRole('dialog', { name: 'Diplomacy' });
  await expect(screen).toBeVisible();
  await press(screen.getByRole('button', { name: new RegExp(`^The ${name}`) }), project);
  const detail = screen.getByRole('region', { name: `The ${name}` });
  await expect(detail).toBeVisible();
  return detail;
}

async function close(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();
}

test('passage bought from the Wake and an exchange accepted', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // The Authority and the Wake can talk, and both have plenty.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    const sta = g.powers.find((p) => p.faction === 'sta');
    const wake = g.powers.find((p) => p.faction === 'hollow-wake');
    if (!sta || !wake) return;
    sta.contacts.push({ faction: 'hollow-wake', stage: 'talk', since: 1, words: 20 });
    wake.contacts.push({ faction: 'sta', stage: 'talk', since: 1, words: 20 });
    for (const p of [sta, wake]) {
      p.treasury = 200;
      p.stockpile = { metals: 100, volatiles: 100, fuel: 100 };
    }
    w.__setGame(g);
  });

  const detail = await openDiplomacy(page, project, 'Hollow Wake');
  // Passage is sold by the Wake; open lanes it never agrees to.
  const passage = detail.getByRole('listitem').filter({ hasText: /^Passage/ });
  await expect(passage).toContainText('It costs us');
  await expect(passage).toContainText('likely yes');
  await expect(detail.getByRole('listitem').filter({ hasText: /^Open lanes/ })).toContainText(
    'They never agree to it.',
  );
  await press(detail.getByRole('button', { name: 'Buy passage from the Hollow Wake' }), project);
  await expect(passage).toContainText('Our offer reaches them as the turn ends.');

  // 40 credits for 20 metals: fair by the Wake's measure.
  await detail.getByLabel('How much we give').selectOption('40');
  await detail.getByLabel('What we give').selectOption('credits');
  await detail.getByLabel('How much we ask for').selectOption('20');
  await detail.getByLabel('What we ask for').selectOption('metals');
  await expect(detail).toContainText('Fair by their measure: likely yes.');
  await press(detail.getByRole('button', { name: 'Offer the Hollow Wake this exchange' }), project);
  await expect(detail).toContainText('Our offer of 40 credits for 20 metals reaches them as the turn ends.');
  await close(page, project);

  const report = await endTurn(page, project);
  await expect(report).toContainText('We have passage with the Hollow Wake now');
  await expect(report).toContainText('We gave the Hollow Wake 40 credits for 20 metals.');
  await close(page, project);

  // The toll in the treasury, from this turn.
  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const treasury = page.getByRole('region', { name: 'Treasury and food' });
  await expect(treasury).toContainText('toll paid to the Hollow Wake');
  await expect(page.getByRole('dialog', { name: 'Empire' })).toBeVisible();
});
