// The trailer's overlays, drawn in the game's own page (docs/design/TRAILER.md §6, §10.3): the feature
// cards (D-94) in its type on a clear background, and the advisors' cards: the game's own report cards
// (and the Concord's radio line) cropped from the staged turns. Into trailer/out/cards/.
//
//   node trailer/cards.ts        (with the build served on port 4173)

import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { stateDir } from './games.ts';
import { BASE, newGame, OUT, open } from './harness.ts';
import { CARDS } from './script.ts';

const DIR = resolve(OUT, 'cards');
mkdirSync(DIR, { recursive: true });
const s = await open();
const { page } = s;

// The advisors' cards, each from the turn its line was spoken in.
const ADVISOR_CARDS: { id: string; power: string; seed: number; tag: string; selector: string; text: string }[] = [
  {
    id: 'A1',
    power: 'Lead the Transit Authority',
    seed: 42,
    tag: 'sta42/founded-alpha-centauri',
    selector: '.advice li',
    text: 'Adaeze Morrow',
  },
  {
    id: 'A2',
    power: 'Lead the Frontier Co-op',
    seed: 42,
    tag: 'frontier42/built-166-arcology',
    selector: '.advice li',
    text: 'Tobias Mwangi',
  },
  {
    id: 'A3',
    power: 'Lead the Transit Authority',
    seed: 42,
    tag: 'sta42/contact-dusk-concord',
    selector: '.advice li',
    text: 'Isabel Achterberg',
  },
  {
    id: 'A4',
    power: 'Lead the Hollow Wake',
    seed: 42,
    tag: 'hollow-wake42/war-86',
    selector: '.advice li',
    text: 'Hush',
  },
  {
    id: 'A5',
    power: 'Lead the Dusk Concord',
    seed: 42,
    tag: 'dusk-concord42/invasion-224',
    selector: '.report-items > li',
    text: 'We go slowly',
  },
  {
    id: 'A6',
    power: 'Lead the Hollow Wake',
    seed: 7,
    tag: 'hollow-wake7/event-comet',
    selector: '.advice li',
    text: 'Farcast',
  },
];
for (const a of ADVISOR_CARDS) {
  const [dir, file] = a.tag.split('/');
  const faction = (dir ?? '').replace(/\d+$/, '');
  await newGame(page, a.power, a.seed, resolve(stateDir(faction as never, a.seed), `${file}.json`));
  // The sweep of the date the state brought, gone first: the cards are glass and it shows through.
  await page.addStyleTag({ content: '.turn-sweep{display:none!important}' });
  await page.waitForTimeout(1500);
  await page.keyboard.press('r');
  await page.waitForTimeout(600);
  const card = page.locator(a.selector).filter({ hasText: a.text }).first();
  await card.waitFor({ timeout: 20_000 });
  await card.screenshot({ path: resolve(DIR, `${a.id}.png`) });
  console.log(`${a.id}: ${a.text}`);
}

// The feature cards: in the lower third, in the console's capitals after a lit diamond and a hairline.
await page.goto('about:blank');
await page.goto(`${BASE}?test#/codex`);
await page.waitForTimeout(1500);
for (const [i, c] of CARDS.entries()) {
  await page.evaluate(
    ({ text, sub }) => {
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';
      document.body.innerHTML = `
<style>
  html, body { background: transparent !important; margin: 0; }
  .tc-shade { position: fixed; left: 0; bottom: 0; width: 62vw; height: 46vh;
    background: radial-gradient(ellipse at 0% 100%, rgba(3,6,13,.88) 0%, rgba(3,6,13,.6) 38%, rgba(3,6,13,0) 72%); }
  .tc { position: fixed; left: 72px; bottom: 92px; display: grid; gap: 10px; }
  .tc-rule { display: flex; align-items: center; gap: 12px; }
  .tc-rule i { width: 9px; height: 9px; transform: rotate(45deg); background: #7fe3ff; box-shadow: 0 0 12px rgba(92,200,255,.9); }
  .tc-rule b { width: 64px; height: 1px; background: linear-gradient(90deg, rgba(127,227,255,.9), transparent); }
  .tc-text { font-family: var(--font-label); font-weight: 700; font-size: 38px; letter-spacing: .14em; text-transform: uppercase;
    color: #effbff; text-shadow: 0 0 22px rgba(92,200,255,.65), 0 0 3px rgba(190,236,255,.9), 0 2px 10px rgba(0,0,0,.8); }
  .tc-sub { font-family: var(--font-body, system-ui); font-size: 17px; color: rgba(207,232,245,.92); text-shadow: 0 1px 8px rgba(0,0,0,.9); }
</style>
<div class="tc-shade"></div><div class="tc"><div class="tc-rule"><i></i><b></b></div><div class="tc-text">${text}</div>${sub ? `<div class="tc-sub">${sub}</div>` : ''}</div>`;
    },
    { text: c.text, sub: c.sub ?? '' },
  );
  await page.waitForTimeout(150);
  await page.screenshot({ path: resolve(DIR, `card-${i}.png`), omitBackground: true });
}
console.log(`${CARDS.length} feature cards`);
await s.browser.close();
