# Handover: Starman Control, 20 October 2026

For a new Claude Code session continuing the game. Read this, then [CLAUDE.md](../CLAUDE.md), then
the documents it points to. Everything here is also in the repository's documents; this page is the
way in.

## 1. The game and where it stands

- **Starman Control** is a 4X strategy game among the real nearby stars, in the universe of
  [Starman Reborn](https://github.com/shotif/starman-reborn); the owner decides, Claude designs,
  documents, builds and tests ([CLAUDE.md](../CLAUDE.md)).
- **Live:** <https://shotif.github.io/starman-control/>, deployed from `main` by
  `.github/workflows/pages.yml`; `.github/workflows/ci.yml` runs the checks and the browser
  journeys on every push. CI was green on `main` at `90afb84`.
- **M1, First light, is built** (increments 1 to 8, [M1_FIRST_LIGHT.md](design/M1_FIRST_LIGHT.md)):
  the 207 real systems on a flat or 3D map; three playable powers; survey and blind jumps; generated
  worlds labelled fiction; colonies and outposts, people, metals, volatiles and fusion fuel; build
  queues; new and relit lanes; a research tree; anomalies; the system in 3D; saves, settings, an
  installable offline app, size budgets. **Still waiting on the owner: trying M1 on a real phone.**
- **The visual direction is under way** (D-26, [VISUAL_DIRECTION.md](design/VISUAL_DIRECTION.md)),
  increments 9 to 13, each with its design and an *As built* section:
  [the first impression](design/FIRST_IMPRESSION.md) (a live 3D title, the powers' pictures and
  emblems), [the living map](design/LIVING_MAP.md) (the Milky Way, glowing stars, sparks on lanes,
  territory fields, the glide into a system), [Control's console](design/CONSOLE.md) (glass, lit
  plates, icons, the turn's sweep, sound), [in flight](design/IN_FLIGHT.md) (ships seen flying,
  the system view's sky), [illustrated dispatches](design/DISPATCHES.md) (the report's pictures).
- **Numbers at handover:** 211 unit tests and 133 browser journeys pass; the title loads 18.9 KB of
  its 40 KB budget, a game's map 276.7 KB of 900 KB; state version 6.

## 2. The next job: the colony in pictures

The owner, on 20 October 2026:

> I want to flesh out the colony management screen to have nice illustrations, so I can visually
> see the colony, see the buildings, and see maybe some people moving around. I want it to be
> really nice.

The proposal is [COLONY_VIEW.md](design/COLONY_VIEW.md), and its choices are open as
[D-28](DECISIONS.md#d-28--the-colony-view--decided). In short: **a living diorama**, put together by
the game from the colony's data. A painted landscape for the world's biome (about nine biomes),
under a sky drawn in code in the star's true colour. Painted buildings in slots on the plain: homes
that grow with the people, open-air or domed by habitability, each project, a scaffold for what is
being built. Then life animated in code: people, rovers, a shuttle, weather, day and night with lit
windows. It is seen from a ridge and panned sideways; it is a screen of its own on the phone and
the desktop, with the colony's panel beside or below it. About 75 pictures, about $4 to $6, over
four increments (14 to 17), starting with a style slice of about $0.60 that the owner sees first.

**First steps:**

1. Read COLONY_VIEW.md and D-28, then the colony's current panel (`HoldingPanel` in
   `src/ui/map/colony.tsx`) and how the system view is entered and left (the effect round
   `SystemScene` in `src/ui/map/MapScreen.tsx`), which the colony view should copy: borrow the map's
   renderer, suspend the map, glide and veil.
2. **Ask the owner D-28**, with its options and recommendations, and record the answers, the date
   and the reason in DECISIONS.md before building. (The owner may answer simply "go with your
   recommendations", as they did for D-24 and D-25.)
3. Build increment 14, the style slice. Add the `landscape` and `structure` series to
   `art/styles.ts`. Write `npm run art:key`: Gemini returns JPEG only, so keying a flat magenta
   background and a white sky to transparent WebP is new; record the keying in
   `art/manifest.json`. Generate the six slice pictures, two or three candidates each, and compose
   a still scene in the game. **Send the owner a lettered contact sheet and screenshots** before
   generating the rest.
4. Then increments 15 to 17 as COLONY_VIEW.md §6 sets out, each designed for the phone and the
   desktop, tested, deployed, and reported to the owner.

## 3. Standing instructions from the owner

- **Documentation first; key decisions are the owner's** (CLAUDE.md). Anything the documents do not
  cover goes into DECISIONS.md with options and a recommendation, and is asked before it is built.
  Small, reversible engineering choices are made and listed under *Made without waiting*.
- **The Gemini key** is in the environment as `GEMINI_API_KEY`. **Never print, log, commit or echo
  it.** There is no OpenAI key; that is expected. If the Gemini key is missing or refused, stop and
  tell the owner exactly what you saw.
- **Art spend (D-27):** about **$15 in all** may be spent without asking; about **$2.70** is spent,
  so about **$12.30** is left. Nano Banana (`gemini-nano-banana-2.1`, about $0.05 a picture) for
  everything (D-23). Record every batch with its cost and the running total in DECISIONS.md.
- **Pictures:** candidates go to `art/out/`, which git ignores, so they are lost with the session.
  Send the owner a **lettered contact sheet** of the candidates (as a file) when you choose, so
  they can overrule. Approve with `npm run art:approve`; every published picture needs its record,
  and `npm run check` fails without one. Pictures are badged *Illustration* in the game.
- **Phone and desktop, both first-class (D-04); several powers, never assume the player is human or
  one particular power (D-08).**
- **British English**, plain words, short sentences; real astronomy is real and **everything
  invented is labelled fiction**; nothing (names, text, art, music, data) from *Master of Orion*
  or any other game.
- **Shipping:** each increment keeps the game playable, passes `npm run check` and the browser
  journeys, is committed (with the session's attribution lines), and is pushed to your designated
  branch **and to `main`** (D-21). Then confirm the GitHub Pages deploy, check CI on `main`, and
  tell the owner what is live. No pull requests unless asked.

## 4. Working in this repository

```bash
npm ci                 # Node 22.18+
npm run dev            # http://localhost:5173
npm run check          # typecheck, lint (Biome), art records, unit tests, build, size budgets
npm run format         # Biome's formatting and safe fixes (run before check)
npm run test:e2e       # browser journeys: phone 390×844, tablet 820×1180, desktop 1440×900
npm run screenshots    # ten sizes into test-results/screens/<screen>-<size>.png
npm run art:generate -- --brief <id>[,<id>…] --provider gemini --count 2
npm run art:sheet -- --brief <id>                   # one brief at a time
npm run art:approve -- art/out/<brief>/<file>.jpg
```

**Where things are:**

- `src/sim/`: the rules, pure TypeScript with whole numbers, run in a Web Worker; the state's
  version and migrations are in `save.ts`, and every rule has unit tests in `tests/unit/`.
- `src/content/`: the game's data: factions, species, projects, ships, technologies, anomalies,
  rules.
- `src/render/`: three.js. `MapView.ts` is the map, with its sky, fields, sparks and flights.
  `SystemScene.ts` is the system in 3D, using Reborn's procedural art copied into `art/`.
  `TitleScene.ts` is the title. `milkyWay.ts` bakes the sky and provides the backdrop and the faint
  stars. `systemLayout.ts` is the pure layout of a system, the model for a `colonyScene()`.
- `src/ui/`: Preact and Signals (never React). The map screen and its panels are in `map/`: the
  colony's panel, the empire and the stockpile in `colony.tsx`; the report, its pictures and
  dispatches in `play.tsx`. The console's skin is `console.css`, with `icons.tsx`, `count.tsx`, and
  the emblems in `parts.tsx`.
- `src/app/`: the game's state on the page, saves, settings (text size, motion, quality, sound),
  and `sound.ts`.
- `art/`: `briefs.ts`, `styles.ts` and `manifest.json` (the provenance records); the scripts are in
  `scripts/art/`, and approved pictures are served from `public/art/`.

**Lessons from the last sessions:**

- The journeys' web server (`vite preview` on port 4173) is **reused if one is already running**,
  and it serves `dist/` from disk. Rebuild (`npm run build`) before running journeys, and never
  rebuild while a run is going.
- **Pass `?test` in the address for test hooks:** `window.__map` (`screenOf`, `moving`, `animating`,
  `fieldCount`, `sparkCount`, `flying`, `orbit`, `visibleLabels`) and `window.__system`. Use seed
  `4242` (the *More* section on the new-game screen) when a journey needs fixed numbers.
- **Nothing that can be pressed may slide or move as it appears.** Use opacity, or a scale about its
  middle. Reduced motion zeroes the animations' delays as well as their lengths. A tap during a
  sliding entrance misses, and that broke journeys twice.
- **CI is slower than this container** (software rendering, 4 cores): reproduce CI-only failures
  with `taskset -c 0,1 npx playwright test … --workers=2`. Long journeys use `test.slow()`. The map
  and the title lower their frame rate on a device that cannot keep up; keep any new animation
  loop the same.
- Wait for state rather than reading it on the first frame (labels, a scene being ready); poll with
  `expect.poll`.
- **Confirm a deploy** by fetching the live page's `assets/index-*.js` and finding the commit's short
  hash in it (the build id is in that chunk).
- With reduced motion, tests use `test.use({ contextOptions: { reducedMotion: 'reduce' } })`.

## 5. Also open

- The owner's try of M1 on a real phone.
- The owner may overrule the report pictures chosen in increment 13 (DECISIONS.md, 19 October).
- Round 2 decisions (D-12 to D-18) are for later milestones; M2's districts will use the same
  `size` slots the colony view lays out.
