# Handover: Starman Control, 20 October 2026 (updated after the colony view and the owner's choices)

For a new Claude Code session continuing the game. Read this, then [CLAUDE.md](../CLAUDE.md), then
the documents it points to. Everything here is also in the repository's documents; this page is the
way in.

## 1. The game and where it stands

- **Starman Control** is a 4X strategy game among the real nearby stars, in the universe of
  [Starman Reborn](https://github.com/shotif/starman-reborn); the owner decides, Claude designs,
  documents, builds and tests ([CLAUDE.md](../CLAUDE.md)).
- **Live:** <https://shotif.github.io/starman-control/>, deployed from `main` by
  `.github/workflows/pages.yml`; `.github/workflows/ci.yml` runs the checks and the browser
  journeys on every push. Check CI's latest run on `main` before starting (see §5).
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
- **The colony in pictures is built** (D-28, [COLONY_VIEW.md](design/COLONY_VIEW.md), increments
  14 to 17, with *As built* notes in its §8): every colony and outpost of every power on every
  world is a living diorama, opened from the still in its panel, the empire's *View*, the system
  view's *View it* or the report's *See it*. Nine painted grounds under a sky drawn in code in the
  star's colour; each power's own architecture (the owner chose a set of buildings per power); a
  slow day with lit windows at night; people, rovers, the power's shuttle, weather; a building
  tapped has its card. 51 pictures, keyed from flat backdrops (`npm run art:key`).
- **Numbers:** 252 unit tests and about 150 browser journeys pass; the title loads 18.9 KB of its
  40 KB budget, a game's map about 285 KB of 900 KB, opening a colony 9 KB of code more (40 KB) and
  its heaviest first pictures on a phone under 1 MB; state version 6 (the colony view changed no
  rules and no saves).

## 2. The next job

The owner chose what comes next on 20 October 2026: **D-29 and D-30** in
[DECISIONS.md](DECISIONS.md). Read both first. In order:

1. **Increment 18, the owner's feedback on the colony view.**
   - **No *Illustration* labels anywhere (D-29).** They are in the colony's still
     (`src/ui/map/ColonyStill.tsx`), the scene's bar (`src/ui/map/MapScreen.tsx`), the report's
     pictures (`src/ui/map/play.tsx`) and the new-game cards (`src/ui/newgame/NewGame.tsx`); the
     journeys that look for them are in `tests/e2e/colony.spec.ts`, `game.spec.ts` and
     `title.spec.ts`. Say once, in the codex's *Sources and licences* (`src/ui/data/DataPage.tsx`),
     that the pictures are made with an image model from the game's own briefs; every record keeps
     `aiGenerated: true`. The *Fiction* labels stay.
   - **Two more versions of every home (D-30, 2a):** 3 sizes × open and domed × 3 architectures,
     36 pictures to keep. Each home picks its version from its colony and slot, so neighbours
     differ and a home keeps its picture as the town grows. Same series, keying and metres as the
     first versions.
   - **Small props between the buildings (D-30, 2c):** about 25 (some for each architecture, some
     shared). Write where they stand into COLONY_VIEW.md before generating: in the gaps between
     slots, never covering a building or taking its tap, suited to the ground and the envelope.
   - Send the owner **lettered contact sheets** of the candidates as you choose; keep the
     colony's first pictures on a phone under their 1 MB budget.
2. **Put music (D-30, G) to the owner early,** as a new decision with options (a composer, a
   licensed library, or music generated at build time), costs and a recommendation. Build nothing
   for it until they answer.
3. **M2 "Worlds" (D-30, A) as the main track, with B, C, D and E.** Write its design first
   (`docs/design/`, goals, out of scope, the decisions it needs), from [SCOPE.md](SCOPE.md) §7:
   districts and zoning on the colony scene's slots (each world's `size`), food, credits, approval
   and unrest, about 15 projects that show as buildings, governors and edicts (D-15, still open),
   the research fields, the turn report and every number explained. Fold in the guided opening (E)
   and leaders and advisors (D, a face for each department, speaking in the report); then events
   and stories (C) and rivals that play by M2's rules (B, the other human powers; no war until
   M4). Put every rule that shapes the game to the owner before building it, and split the work
   into increments that each ship.

The art for all of this is planned at about $12 of the $16.65 left (D-27). If the owner overrules
any picture (every pick is lettered on the contact sheets they were sent, and listed in
COLONY_VIEW.md §8 and DECISIONS.md), regenerate or re-approve it with the art scripts; a
candidate's file is gone with the old session, so a new pick means new candidates.

## 3. Standing instructions from the owner

- **Documentation first; key decisions are the owner's** (CLAUDE.md). Anything the documents do not
  cover goes into DECISIONS.md with options and a recommendation, and is asked before it is built.
  Small, reversible engineering choices are made and listed under *Made without waiting*.
- **The Gemini key** is in the environment as `GEMINI_API_KEY`. **Never print, log, commit or echo
  it.** There is no OpenAI key; that is expected. If the Gemini key is missing or refused, stop and
  tell the owner exactly what you saw.
- **Art spend (D-27):** about **$25 in all** may be spent without asking (raised on 20 October
  2026); about **$8.35** is spent (after the colony view), so about **$16.65** is left. Nano
  Banana (`gemini-nano-banana-2.1`, about $0.05 a picture) for everything (D-23). Record every
  batch with its cost and the running total in DECISIONS.md.
- **Pictures:** candidates go to `art/out/`, which git ignores, so they are lost with the session.
  Send the owner a **lettered contact sheet** of the candidates (as a file) when you choose, so
  they can overrule. Approve with `npm run art:approve`; every published picture needs its record,
  and `npm run check` fails without one. Pictures carry **no *Illustration* label** (D-29): that
  they are made with an image model is said in the codex's credits and in the records.
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
npm run art:key -- --brief <id>[,<id>…]             # key a landscape's or building's candidates
npm run art:sheet -- --brief <id>                   # one brief at a time (keyed ones on a checkerboard)
npm run art:approve -- art/out/<brief>/<file>.jpg   # keys it too, when its series is keyed
```

**Where things are:**

- `src/sim/`: the rules, pure TypeScript with whole numbers, run in a Web Worker; the state's
  version and migrations are in `save.ts`, and every rule has unit tests in `tests/unit/`.
- `src/content/`: the game's data: factions, species, projects, ships, technologies, anomalies,
  rules.
- `src/render/`: three.js. `MapView.ts` is the map, with its sky, fields, sparks and flights.
  `SystemScene.ts` is the system in 3D, using Reborn's procedural art copied into `art/`.
  `TitleScene.ts` is the title. `milkyWay.ts` bakes the sky and provides the backdrop and the faint
  stars. `systemLayout.ts` is the pure layout of a system. The colony view: `colonyScene.ts` (what
  a colony's scene shows, pure), `colonyPlace.ts` (where its buildings stand), `colonyLife.ts`
  (the day, walkers, the shuttle, the weather, pure), `colonyStill.ts` (the panel's still, Canvas
  2D) and `ColonyView.ts` (the diorama, three.js on the map's renderer).
- `src/ui/`: Preact and Signals (never React). The map screen and its panels are in `map/`: the
  colony's panel, the empire and the stockpile in `colony.tsx`, its still in `ColonyStill.tsx` and a
  building's card in `ColonyCard.tsx`; the report, its pictures and dispatches in `play.tsx`. The console's skin is `console.css`, with `icons.tsx`, `count.tsx`, and
  the emblems in `parts.tsx`.
- `src/app/`: the game's state on the page, saves, settings (text size, motion, quality, sound),
  and `sound.ts`.
- `art/`: `briefs.ts` (with each power's architecture, written once), `styles.ts` and
  `manifest.json` (the provenance records); the scripts are in `scripts/art/`, and approved
  pictures are served from `public/art/`. `src/content/colonyArt.ts` lists the colony view's
  pictures, each landscape's horizon and slots, and each piece's width in metres.

**Lessons from the last sessions:**

- The journeys' web server (`vite preview` on port 4173) is **reused if one is already running**,
  and it serves `dist/` from disk. Rebuild (`npm run build`) before running journeys, and never
  rebuild while a run is going.
- **Pass `?test` in the address for test hooks:** `window.__map` (`screenOf`, `moving`, `animating`,
  `fieldCount`, `sparkCount`, `flying`, `orbit`, `visibleLabels`), `window.__system`, and
  `window.__colony` (`info`, `life`, `look`, `buildingsOnScreen`, `pointOn`, `setClock`). Use seed
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
- **A background command stops at its time limit (30 minutes by default)**, and that includes a
  `vite preview` started in the background: start it with a long limit before a full run, or the
  last journeys fail in a quarter of a second against a dead server. A full run at two workers
  takes about 25 minutes here.
- **A machine of four cores starts on the low quality setting** (this container and CI): no
  weather in the colony view, 20 people at most. A journey that needs more sets the quality in
  `localStorage` (`starman-control:settings`) with `page.addInitScript`.
- **Generating pictures:** each power's buildings come out at a steeper angle than asked; asking for
  "walls seen more than roof" and a landscape seen from a raised viewpoint made them match. A
  subject that says "courtyard" or "earth bank" invites a top-down view or a cut-off bank of
  soil. A flat backdrop is seen through glass: keying despills any pixel whose red and blue both
  stand above its green. The haze and ice grounds need their own backdrops (horizon-only mist;
  a magenta sky).

## 5. Also open

- The owner's try of M1 on a real phone.
- Music (D-30, G): a decision to put to the owner (§2).
- The owner may overrule the report pictures chosen in increment 13 (DECISIONS.md, 19 October),
  and any of the colony view's (COLONY_VIEW.md §8).
- CI on `main` failed once on increment 15 (a phone journey waited 10 s for a scaffold that a
  starved machine took longer to load); increment 17 gave scene updates 30 s and made taps aim
  where a building really shows, and CI passed on 16 and 17. Look at the latest run before
  starting.
- Round 2 decisions (D-12 to D-18) are for later milestones, except D-15 (governors and edicts),
  which M2 needs.
- Not chosen for now (D-30): second versions of the projects, halls and rigs; cold and hot homes;
  more for the colony scene (a parent planet in a moon's sky, a hull on the shipyard's pad).
