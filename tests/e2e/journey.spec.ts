import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

/**
 * The long journey on a phone (M6_ONE.md §27.1): the Concord led to turn 150 at 390 × 844, its
 * orders given each turn as a rival of its character would give them, every event answered and every
 * lesson read. At turns 1, 50, 100 and 150 every main screen is opened, kept as a screenshot in
 * test-results/journey/ to be looked at, and checked: nothing sideways, nothing serious for the
 * accessibility checker. Run with `npm run journey`.
 */

const CAPITAL = 'GJ 433 d';
/** The last turn; a shorter journey with JOURNEY_TURNS, to try the script. */
const LAST = Number(process.env.JOURNEY_TURNS ?? 150);
const SHOWN_AT = [1, 50, 100, 150].filter((t) => t <= LAST);

interface Hook {
  __game: () => { turn: number } | null;
  __lastTurnMs: () => number;
  __autoplay: () => Promise<number>;
}

async function endTurn(page: Page): Promise<number> {
  await expect(page.getByRole('button', { name: /End turn/ }).first()).toBeEnabled({ timeout: 30_000 });
  const date = await page.locator('.map-date').textContent();
  await page
    .getByRole('button', { name: /End turn/ })
    .first()
    .tap();
  const needs = page.getByRole('dialog', { name: 'What needs you' });
  const report = page.getByRole('dialog', { name: 'Report' });
  const end = page.getByRole('dialog', { name: 'The end of the game' });
  await expect(needs.or(report).or(end)).toBeVisible();
  if (await needs.isVisible()) await needs.getByRole('button', { name: /End turn/ }).tap();
  await expect(page.locator('.map-date')).not.toHaveText(date ?? '', { timeout: 30_000 });
  await expect.poll(() => page.evaluate(() => (window as unknown as Hook).__lastTurnMs())).toBeGreaterThan(0);
  return page.evaluate(() => (window as unknown as Hook).__lastTurnMs());
}

/** Answers an event the report says is waiting, with its first choice. */
async function answer(page: Page): Promise<boolean> {
  const line = page.getByRole('dialog', { name: 'Report' }).getByRole('button', { name: /: it needs your answer\.$/ });
  if ((await line.count()) === 0) return false;
  await line.first().tap();
  const choices = page.locator('.event-choices button');
  await choices.first().tap();
  await expect(choices.first()).toHaveAttribute('aria-pressed', 'true');
  const card = page.locator('.event-card').locator('xpath=ancestor::*[@role="dialog"][1]');
  await card.getByRole('button', { name: 'Close' }).last().tap();
  return true;
}

/** What is wrong with the screen as it stands: sideways scrolling, clipped sheets, the checker's serious findings. */
async function problems(page: Page, what: string): Promise<string[]> {
  const out: string[] = [];
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (wide > 0) out.push(`${what}: the page scrolls ${wide} px sideways`);
  const clipped = await page.evaluate(() =>
    [...document.querySelectorAll('[role="dialog"], [role="dialog"] .sheet-body')]
      .filter((el) => el.scrollWidth - el.clientWidth > 1)
      .map((el) => `${el.getAttribute('aria-label') ?? el.className} by ${el.scrollWidth - el.clientWidth} px`),
  );
  for (const c of clipped) out.push(`${what}: wider than its box: ${c}`);
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .exclude('canvas')
    .analyze();
  for (const v of r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
    out.push(`${what}: ${v.id} (${v.impact}) ${v.nodes.length}× ${v.nodes[0]?.target.join(' ')}`);
  return out;
}

async function keep(page: Page, turn: number, what: string, found: string[]): Promise<void> {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `test-results/journey/${String(turn).padStart(3, '0')}-${what}.png` });
  found.push(...(await problems(page, `turn ${turn}, ${what}`)));
}

async function closeSheet(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Close' }).first().tap();
}

/** Every main screen, kept and checked. */
async function everyScreen(page: Page, turn: number, found: string[]): Promise<void> {
  const report = page.getByRole('dialog', { name: 'Report' });
  if (await report.isVisible()) {
    await keep(page, turn, 'report', found);
    await closeSheet(page);
    await expect(report).toHaveCount(0);
  }
  await keep(page, turn, 'map', found);
  for (const [name, inMenu] of [
    ['Empire', false],
    ['Research', false],
    ['Diplomacy', true],
    ['Relics', true],
    ['Leaders', true],
    ['Systems', true],
  ] as const) {
    if (inMenu) await page.getByRole('button', { name: 'Menu', exact: true }).tap();
    await page.getByRole('button', { name, exact: true }).tap();
    await expect(page.getByRole('dialog', { name })).toBeVisible();
    await keep(page, turn, name.toLowerCase(), found);
    await closeSheet(page);
  }
  // The capital's panel and its colony view.
  await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  await page
    .getByRole('dialog', { name: 'Empire' })
    .getByRole('button', { name: new RegExp(`^${CAPITAL}`) })
    .first()
    .tap();
  const panel = page.getByRole('dialog', { name: CAPITAL });
  await expect(panel.getByTestId('colony-still')).toHaveClass(/is-drawn/, { timeout: 30_000 });
  await keep(page, turn, 'capital', found);
  await panel.getByRole('button', { name: `View ${CAPITAL}` }).tap();
  await expect(page.getByTestId('map')).toHaveAttribute('data-colony-ready', '1', { timeout: 30_000 });
  await keep(page, turn, 'colony', found);
  await page.locator('.colony-bar').getByRole('button', { name: '← GJ 433' }).tap();
  await expect(page.getByTestId('map')).not.toHaveAttribute('data-colony-ready', '1');
  await closeSheet(page);
}

test('the Concord to turn 150 on a phone: every screen looked at, nothing cut off, every turn quick', async ({
  page,
}) => {
  test.setTimeout(3_600_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?test&lessons#/new');
  await page.getByText('More').tap();
  await page.getByLabel(/Seed/).fill('42');
  await page.getByRole('button', { name: 'Lead the Dusk Concord' }).tap();
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });

  const found: string[] = [];
  const times: number[] = [];
  let answered = 0;
  let lessons = 0;
  for (let turn = 1; turn <= LAST; turn++) {
    const lesson = page.getByRole('button', { name: 'Got it' });
    if (await lesson.isVisible()) {
      if (SHOWN_AT.includes(turn) || lessons === 0) await keep(page, turn, 'lesson', found);
      await lesson.tap();
      lessons++;
    }
    if (SHOWN_AT.includes(turn)) await everyScreen(page, turn, found);
    await page.evaluate(() => (window as unknown as Hook).__autoplay());
    times.push(await endTurn(page));
    if (await page.getByRole('dialog', { name: 'The end of the game' }).isVisible()) break;
    if (await answer(page)) answered++;
  }
  // The codex, at the end.
  await page.goto('./?test#/codex');
  await expect(page.getByRole('heading', { name: /Codex/ })).toBeVisible();
  await keep(page, LAST, 'codex', found);

  const slowest = Math.max(...times);
  console.log(
    `journey: ${times.length} turns, slowest ${slowest} ms, average ${Math.round(times.reduce((a, b) => a + b, 0) / times.length)} ms, ${answered} events answered, ${lessons} lessons read`,
  );
  for (const f of found) console.log(`  ${f}`);
  expect(found).toEqual([]);
  expect(slowest).toBeLessThan(2000);
  expect(errors).toEqual([]);
});
