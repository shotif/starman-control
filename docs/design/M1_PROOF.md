# M1 · Proof (increment 8)

**Status:** written 19 October 2026 before increment 8 was built, and built the same day (see
*As built*); the real phone is the owner's to try. It fills in the last row of
[M1 §12](M1_FIRST_LIGHT.md#increments): "saves and settings complete, the soak test, screenshots,
a real phone, the budgets", and the *Settings, Saves* row of §10.

**Goals.** M1 is done when the 50-turn game can be played, saved, moved and continued on any
device; it can be installed and played offline; its size and speed stay within budget; and the
owner has played it on a real phone.

## 1. Settings

Kept on the device (as Reborn keeps them), applied at once, and on both layouts the same screen:

| Setting | Choices | What it does |
| --- | --- | --- |
| Text size | 100%, 115%, 130%, 150% | every text in the game scales (all sizes are in `rem`) |
| Reduced motion | as the device says, on, off | the map and the system view snap rather than glide; worlds stand still |
| Quality | automatic, low, medium, high | low: plain spheres in the system view and a lighter map; automatic picks low on small or slow devices |

Reached from the title and from the game's menu.

## 2. Saves

One screen, reached from the title and from the game's menu: the **autosave** and **three
slots**, each showing the power, the date in the game, the colonies and when it was saved. Each
can be loaded, exported as a file, or cleared; in a game, the current game can be saved to any
slot. **Import** reads a file into the game (and the autosave). Damaged saves say so.

## 3. An app, not a tab

- A manifest (name, colours, icons, **full screen**) so the game can be installed to a phone's
  home screen or a desktop and opens without the browser's bars.
- A service worker, as in Reborn: pages from the network first, the build's files kept after one
  visit, old builds dropped; never in test runs.
- No text selection, tap highlight, pull-to-refresh or browser menu over the game.

## 4. Budgets, measured on every build (failing `npm run check`)

| Budget | Limit | How |
| --- | --- | --- |
| The title (first screen), compressed | 40 KB | the scripts and styles the title page loads |
| First load to the map in a game, compressed | 900 KB | the title, the game and the map |
| A save after 50 turns | 200 KB | a unit test on a scripted game |
| Ending a turn after 50 turns | 200 ms on the build machine | a unit test (a mid-range phone is measured by the owner) |

## 5. Tests

- **The journey of M1:** start a game, survey, settle, research, end five turns, save to a slot,
  reload the page, load the slot, and find the game as it was.
- **Screenshots** at Reborn's nine test sizes, including a 316 px phone at 130% zoom and text at
  130%.
- **A real phone:** the owner plays on their own phone and reports what is hard to read, slow or
  fiddly (asked for in the report of this increment).

## As built

- **Settings** (`src/app/settings.ts`, `#/settings`) as §1, kept in `localStorage` so they apply
  before anything is drawn; *automatic* quality picks low with four cores or fewer, or 3 GB of
  memory or less. Map labels grow with the text size.
- **Saves** (`#/saves`) as §2. Exporting uses the share sheet where there is one (phones) and a
  download otherwise.
- **The app:** `public/manifest.webmanifest` (full screen), icons drawn in `public/icon.svg` and
  rendered by `npm run icons`, and `public/sw.js` from Reborn; the build writes the list of files
  to keep into `index.html` (`scripts/app/offlineFiles.ts`). Text cannot be selected except in
  inputs; scrollbars are in the console's colours; pull-to-refresh and tap highlights are off.
- **Budgets** (`npm run budgets`, part of `npm run check`): the title 13.8 KB and the map in a
  game 263.5 KB compressed at the time of writing; a 50-turn save and turn are checked in
  `tests/unit/colonies.test.ts`.
- **Tests:** the journey of M1 and the settings in `tests/e2e/game.spec.ts`, and offline play
  after one visit; screenshots at the nine sizes and a 1280 desktop.

