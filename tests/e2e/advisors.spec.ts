import { expect, type Locator, type Page, test } from '@playwright/test';

/** The advisors in the report and beside their numbers (M2_WORLDS.md §24), on a phone, a tablet and a desktop. */

const isDesktop = (name: string) => name === 'desktop';
const press = (target: Locator, project: string) => (isDesktop(project) ? target.click() : target.tap());

async function newGame(page: Page, project: string) {
  await page.goto('./?test#/new');
  await press(page.getByText('More'), project);
  await page.getByLabel(/Seed/).fill('42');
  await press(page.getByRole('button', { name: 'Lead the Transit Authority' }), project);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
}

/** Ends the turn, past what needs you on a phone, and returns the report. */
async function endTurn(page: Page, project: string) {
  const date = await page.locator('.map-date').textContent();
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

/** Every face in a place has its picture. */
async function facesDrawn(where: Locator) {
  await expect
    .poll(() =>
      where
        .locator('img.advisor-face')
        .evaluateAll((imgs) =>
          imgs.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0),
        ),
    )
    .toBe(true);
}

test('the advisors speak in the report, the most pressing first, each with a face', async ({ page }, info) => {
  const project = info.project.name;
  await newGame(page, project);
  const report = await endTurn(page, project);
  const advice = report.getByRole('list', { name: 'Your advisors' });
  await expect(advice.getByRole('listitem')).toHaveCount(3);
  const first = advice.getByRole('listitem').first();
  await expect(first).toContainText('Dr Kenji Albrecht');
  await expect(first).toContainText('Control, our laboratories have nothing to work on. Please choose a technology.');
  await expect(first).toHaveClass(/is-pressing/);
  await facesDrawn(advice);
});

test('quiet, they speak only of what needs you; off, not at all', async ({ page }, info) => {
  const project = info.project.name;
  // Set once: the script runs again on every reload.
  await page.addInitScript(() => {
    if (!localStorage.getItem('starman-control:settings'))
      localStorage.setItem('starman-control:settings', JSON.stringify({ sound: 'off', advisors: 'quiet' }));
  });
  await newGame(page, project);
  let report = await endTurn(page, project);
  await expect(report.getByRole('list', { name: 'Your advisors' }).getByRole('listitem')).toHaveCount(1);
  await page.evaluate(() =>
    localStorage.setItem('starman-control:settings', JSON.stringify({ sound: 'off', advisors: 'off' })),
  );
  await page.reload();
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', '1', { timeout: 30_000 });
  report = await endTurn(page, project);
  await expect(report.getByRole('list', { name: 'Your advisors' })).toHaveCount(0);
});

test('the Treasury and Science stand beside their numbers', async ({ page }, info) => {
  const project = info.project.name;
  await newGame(page, project);
  if (isDesktop(project)) await page.keyboard.press('p');
  else await page.getByRole('button', { name: 'Empire', exact: true }).tap();
  const treasury = page.getByRole('dialog', { name: 'Empire' }).getByRole('region', { name: 'Treasury and food' });
  await expect(treasury).toContainText('Sunita Rao');
  await facesDrawn(treasury);
  if (isDesktop(project)) {
    await page.keyboard.press('Escape');
    await page.keyboard.press('t');
  } else {
    await page.getByRole('button', { name: 'Close' }).first().tap();
    await page.getByRole('button', { name: 'Research', exact: true }).tap();
  }
  const research = page.getByRole('dialog', { name: 'Research' });
  await expect(research).toContainText('Dr Kenji Albrecht');
  await facesDrawn(research);
});
