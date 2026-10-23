import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';

/** Accessibility (M6_ONE.md §21, D-84), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

interface GameHook {
  __game(): {
    powers: { faction: string; contacts: { faction: string; stage: string; since: number; words: number }[] }[];
  };
  __setGame(g: unknown): void;
}

/** The serious and critical findings on the page as it stands, by WCAG 2.2 A and AA. */
async function findings(page: Page, what: string): Promise<string[]> {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    // The map and the scenes are drawn pictures, with their words beside them.
    .exclude('canvas')
    .analyze();
  return r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${what}: ${v.id} (${v.impact}) ${v.nodes.length}× ${v.nodes[0]?.target.join(' ')}`);
}

async function newGame(page: Page, project: string) {
  await page.goto('./?test#/new');
  await expect(page.locator('.power-card')).toHaveCount(4);
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // We can talk with the Cooperative, so Diplomacy has something to show.
  await page.evaluate(() => {
    const w = window as unknown as GameHook;
    const g = structuredClone(w.__game());
    g.powers
      .find((p) => p.faction === 'sta')
      ?.contacts.push({ faction: 'frontier', stage: 'talk', since: 1, words: 20 });
    g.powers
      .find((p) => p.faction === 'frontier')
      ?.contacts.push({ faction: 'sta', stage: 'talk', since: 1, words: 20 });
    w.__setGame(g);
  });
}

/** Opens a screen by its key on the desktop, or by the menu or its chip on a phone. */
async function open(page: Page, project: string, name: string, key: string, inMenu: boolean) {
  if (isDesktop(project)) await page.keyboard.press(key);
  else {
    if (inMenu) await page.getByRole('button', { name: 'Menu', exact: true }).tap();
    await page.getByRole('button', { name, exact: true }).tap();
  }
  const dialog = page.getByRole('dialog', { name });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function close(page: Page, project: string) {
  if (isDesktop(project)) await page.keyboard.press('Escape');
  else await page.getByRole('button', { name: 'Close' }).first().tap();
}

test('every main screen passes the checker', async ({ page }, info) => {
  test.slow();
  const project = info.project.name;
  const found: string[] = [];
  await page.goto('./?test');
  await expect(page.getByRole('heading', { name: /Starman Control/i })).toBeVisible();
  found.push(...(await findings(page, 'title')));
  await page.goto('./?test#/new');
  await expect(page.locator('.power-card')).toHaveCount(4);
  found.push(...(await findings(page, 'new game')));
  await newGame(page, project);
  found.push(...(await findings(page, 'map')));
  for (const [name, key, inMenu] of [
    ['Empire', 'p', false],
    ['Research', 't', false],
    ['Diplomacy', 'y', true],
    ['Relics', 'j', true],
    ['Leaders', 'l', true],
    ['Systems', 'k', true],
  ] as const) {
    await open(page, project, name, key, inMenu);
    found.push(...(await findings(page, name)));
    await close(page, project);
  }
  // The report, after a turn.
  if (isDesktop(project)) await page.keyboard.press('Enter');
  else {
    await page.getByRole('button', { name: /End turn/ }).tap();
    const needs = page.getByRole('dialog', { name: 'What needs you' });
    if (await needs.isVisible().catch(() => false)) await needs.getByRole('button', { name: /End turn/ }).tap();
  }
  await expect(page.getByRole('dialog', { name: 'Report' })).toBeVisible({ timeout: 30_000 });
  found.push(...(await findings(page, 'report')));
  await page.goto('./?test#/codex');
  await expect(page.getByRole('heading', { name: /Codex/ })).toBeVisible();
  found.push(...(await findings(page, 'codex')));
  await page.goto('./?test#/settings');
  found.push(...(await findings(page, 'settings')));
  await page.goto('./?test#/saves');
  found.push(...(await findings(page, 'saves')));
  expect(found).toEqual([]);
});

test('dialogs take focus and give it back; Enter presses a button reached by keyboard', async ({ page }, info) => {
  test.skip(!isDesktop(info.project.name), 'a keyboard on the desktop');
  await newGame(page, info.project.name);
  const date = await page.locator('.map-date').textContent();
  // Into the Empire, by its key; back out with Escape.
  await page.keyboard.press('p');
  const empire = page.getByRole('dialog', { name: 'Empire' });
  await expect(empire).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(empire).toHaveCount(0);
  // Reach the Research chip by keyboard and press Enter: Research opens, and the turn does not end.
  const chip = page.getByRole('button', { name: 'Research', exact: true });
  await chip.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(chip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Research' })).toBeVisible();
  await expect(page.locator('.map-date')).toHaveText(date ?? '');
  await page.keyboard.press('Escape');
  // Focus comes back to the chip that opened it.
  await expect(chip).toBeFocused();
});

test('the systems list: every system, nearest first, and a choice selects it', async ({ page }, info) => {
  const project = info.project.name;
  await newGame(page, project);
  const list = await open(page, project, 'Systems', 'k', true);
  const rows = list.getByRole('listitem');
  await expect(rows).toHaveCount(40);
  await expect(rows.first()).toContainText('Sol');
  await expect(rows.first()).toContainText('our capital');
  await press(list.getByRole('button', { name: /Show all/ }), project);
  await expect(rows).toHaveCount(356);
  await press(list.getByRole('button', { name: 'Alpha Centauri', exact: true }), project);
  const panel = isDesktop(project)
    ? page.getByRole('complementary', { name: 'Selected system' })
    : page.getByRole('dialog', { name: 'Alpha Centauri' });
  await expect(panel.getByRole('heading', { name: 'Alpha Centauri' })).toBeVisible();
});

test('the largest text on a phone scrolls nothing sideways', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'the phone');
  await page.goto('./?test#/settings');
  await page.evaluate(() => localStorage.setItem('starman-control:settings', JSON.stringify({ textScale: 1.5 })));
  const wide = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  for (const where of ['#/settings', '#/codex', '#/new']) {
    await page.goto(`./?test${where}`);
    await page.waitForLoadState('networkidle');
    expect(await wide(), where).toBeLessThanOrEqual(0);
  }
  await page.getByRole('button', { name: 'Lead the Transit Authority' }).tap();
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  expect(await wide(), 'map').toBeLessThanOrEqual(0);
  for (const name of ['Empire', 'Research']) {
    await page.getByRole('button', { name, exact: true }).tap();
    await expect(page.getByRole('dialog', { name })).toBeVisible();
    expect(await wide(), name).toBeLessThanOrEqual(0);
    await page.getByRole('button', { name: 'Close' }).first().tap();
  }
});
