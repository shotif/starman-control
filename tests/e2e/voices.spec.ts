import { expect, type Page, test } from '@playwright/test';

/**
 * The voices (VOICES.md §5): nothing before the first press; a guide step spoken as it appears, the
 * report's most pressing line as a turn's report opens, any line on *Hear*; off means nothing is
 * downloaded and no *Hear* is shown.
 */

interface VoiceHook {
  __voice: {
    state(): { clip: string | null; speaking: boolean; unlocked: boolean };
    requested(): string[];
  };
}

const requested = (page: Page) => page.evaluate(() => (window as unknown as VoiceHook).__voice.requested());

function voiceSettings(page: Page, on: boolean) {
  return page.addInitScript(
    (value) =>
      localStorage.setItem('starman-control:settings', JSON.stringify({ sound: 'off', music: 'off', voices: value })),
    on ? 'on' : 'off',
  );
}

async function endTurn(page: Page, desktop: boolean): Promise<void> {
  const button = page.getByRole('button', { name: /End turn/ }).first();
  await expect(button).toBeEnabled({ timeout: 30_000 });
  if (desktop) await button.click();
  else await button.tap();
  const needs = page.getByRole('dialog', { name: 'What needs you' });
  const report = page.getByRole('dialog', { name: 'Report' });
  await expect(needs.or(report)).toBeVisible({ timeout: 30_000 });
  if (await needs.isVisible()) {
    const again = needs.getByRole('button', { name: /End turn/ });
    if (desktop) await again.click();
    else await again.tap();
  }
  await expect(report).toBeVisible({ timeout: 30_000 });
}

test('voices wait for the first press, speak the guide’s step, the report’s first line and any line on Hear', async ({
  page,
}, info) => {
  test.slow();
  const desktop = info.project.name === 'desktop';
  const fetched: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/voice/')) fetched.push(r.url());
  });
  await voiceSettings(page, true);
  await page.goto('./?test&voices&guide#/new');
  const lead = page.getByRole('button', { name: 'Lead the Transit Authority' });
  await expect(lead).toBeVisible();
  await page.waitForTimeout(800);
  // Nothing is downloaded or spoken before the first press.
  expect(fetched).toEqual([]);
  if (desktop) await lead.click();
  else await lead.tap();
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  // The guide's first step is spoken as it appears, by the power's own advisor.
  await expect(page.getByRole('complementary', { name: 'Guide' })).toBeVisible();
  await expect.poll(async () => (await requested(page)).some((p) => p.startsWith('voice/sta/guide-'))).toBe(true);
  // The report's most pressing line, as the turn's report opens.
  await endTurn(page, desktop);
  const report = page.getByRole('dialog', { name: 'Report' });
  const hear = report.getByRole('button', { name: /^Hear / });
  await expect(hear.first()).toBeVisible();
  await expect
    .poll(
      async () =>
        (await requested(page)).some((p) => /^voice\/sta\/[a-z]+-[a-z-]+\.mp3$/.test(p) && !p.includes('/guide-')),
      {
        timeout: 20_000,
      },
    )
    .toBe(true);
  // Any line again on Hear.
  const before = (await requested(page)).length;
  if (desktop) await hear.last().click();
  else await hear.last().tap();
  await expect.poll(async () => (await requested(page)).length, { timeout: 20_000 }).toBeGreaterThan(before);
  // Only the led power's clips are ever fetched.
  expect(fetched.every((u) => u.includes('/voice/sta/'))).toBe(true);
});

test('with voices off nothing is downloaded and no line offers Hear', async ({ page }, info) => {
  test.slow();
  const desktop = info.project.name === 'desktop';
  const fetched: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/voice/')) fetched.push(r.url());
  });
  await voiceSettings(page, false);
  await page.goto('./?test&voices&guide#/new');
  const lead = page.getByRole('button', { name: 'Lead the Transit Authority' });
  if (desktop) await lead.click();
  else await lead.tap();
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  await endTurn(page, desktop);
  await expect(page.getByRole('dialog', { name: 'Report' }).getByRole('button', { name: /^Hear / })).toHaveCount(0);
  await page.waitForTimeout(1500);
  expect(fetched).toEqual([]);
});
