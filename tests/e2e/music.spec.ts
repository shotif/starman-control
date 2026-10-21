import { expect, type Page, test } from '@playwright/test';

/** The music (MUSIC.md): nothing before the first press, then each place's piece; off means off. */

interface MusicHook {
  __music: {
    state(): { mood: string | null; piece: string | null; playing: boolean; unlocked: boolean };
    requested(): string[];
  };
}

const music = (page: Page) => page.evaluate(() => (window as unknown as MusicHook).__music.state());

function musicSettings(page: Page, on: boolean) {
  return page.addInitScript(
    (value) => localStorage.setItem('starman-control:settings', JSON.stringify({ sound: 'off', music: value })),
    on ? 'on' : 'off',
  );
}

test('music waits for the first press, plays the title, then the map’s own', async ({ page }, info) => {
  test.slow();
  const desktop = info.project.name === 'desktop';
  const fetched: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/music/')) fetched.push(r.url());
  });
  await musicSettings(page, true);
  await page.goto('./?test&music');
  await expect(page.getByRole('link', { name: 'New game' })).toBeVisible();
  await page.waitForTimeout(800);
  // Nothing is downloaded or played before the first press.
  expect(fetched).toEqual([]);
  expect((await music(page)).unlocked).toBe(false);
  const newGame = page.getByRole('link', { name: 'New game' });
  if (desktop) await newGame.click();
  else await newGame.tap();
  await expect.poll(async () => (await music(page)).piece, { timeout: 30_000 }).toBe('title');
  await expect.poll(async () => (await music(page)).playing, { timeout: 30_000 }).toBe(true);
  expect(fetched.some((u) => u.endsWith('/music/title.mp3'))).toBe(true);
  // A game's map plays the map's first piece.
  const power = page.getByRole('button', { name: 'Lead the Transit Authority' });
  if (desktop) await power.click();
  else await power.tap();
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  await expect.poll(async () => (await music(page)).mood, { timeout: 30_000 }).toBe('map');
  await expect.poll(async () => (await music(page)).piece, { timeout: 30_000 }).toBe('map-1');
  if (!desktop) return;
  // A colony plays the piece of its power's character.
  await page.keyboard.press('p');
  await page
    .getByRole('dialog', { name: 'Empire' })
    .getByRole('button', { name: /^Earth/ })
    .first()
    .click();
  const panel = page.locator('.map-inspector');
  await expect(panel.getByTestId('colony-still')).toHaveClass(/is-drawn/, { timeout: 20_000 });
  await panel.getByRole('button', { name: 'View Earth' }).click();
  await expect.poll(async () => (await music(page)).piece, { timeout: 30_000 }).toBe('colony-authority');
});

test('with music off nothing is downloaded; turned on it plays, and off again it stops', async ({ page }, info) => {
  const desktop = info.project.name === 'desktop';
  const fetched: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/music/')) fetched.push(r.url());
  });
  await musicSettings(page, false);
  await page.goto('./?test#/settings');
  const group = page.getByRole('group', { name: 'Music' });
  const press = (name: string) =>
    desktop ? group.getByRole('button', { name }).click() : group.getByRole('button', { name }).tap();
  await expect(group.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-pressed', 'true');
  // A press with music off unlocks nothing to hear and downloads nothing.
  await press('Off');
  await page.waitForTimeout(1500);
  expect(fetched).toEqual([]);
  expect((await music(page)).playing).toBe(false);
  // On: the settings screen plays the title's piece.
  await press('On');
  await expect.poll(async () => (await music(page)).playing, { timeout: 30_000 }).toBe(true);
  expect((await music(page)).piece).toBe('title');
  // Off again: it stops.
  await press('Off');
  await expect.poll(async () => (await music(page)).playing).toBe(false);
});
