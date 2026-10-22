# Handover: Starman Control, 21 October 2026 (M2b complete)

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
- **Increment 18 is built** (D-29, D-30 2a and 2c; [COLONY_VIEW.md §9](design/COLONY_VIEW.md#9-more-homes-and-things-between-them-increment-18-design)
  and its *As built*): no *Illustration* labels anywhere (the codex's credits say the pictures are
  made with an image model); every home in three versions, chosen from its colony and slot; 25
  props between the buildings (a `prop` series, placed beside the buildings once they stand). The
  colony view has 124 pictures.
- **Music is built** (increment 19, D-31 B, [MUSIC.md](design/MUSIC.md)): seven pieces generated
  with Google's Lyria (title, two for the map, system, a colony piece for each power), played after
  the first press, fading between places, downloaded only when played; a *Music* setting.
  `npm run music:generate`, `music:approve`, `music:check` (in `npm run check`).
- **M2 "Worlds" has begun** ([M2_WORLDS.md](design/M2_WORLDS.md), its *As built* in §22).
  **Increment 20 is built:** districts zoned through the queue and worked a million each, food
  pooled along each power's lanes with hunger and starving, the treasury with taxes, upkeep,
  overdrive and debt, approval with its parts and four levels; districts stand in the colony scene
  as buildings (10 new pictures). The owner answered two questions found while building: a new
  colony arrives with farms and works and makes 2 industry of its own (D-42), and idle people cost
  no approval (D-43). **Increment 21 is built:** nine new projects (hydroponics, trade exchange,
  civic centre, recreation dome, research institute, fusion plant, refinery, arcology, medical
  centre), each a building in each power's architecture (27 pictures), and the research tree grown
  to 32 technologies; every building is published at 256 px too, and the phone's picture budgets
  measure what a phone loads. **Increment 22 is built:** six advisors for each power, named, with
  faces and voices, speak up to three lines in each turn's report (a setting quietens them); the
  Treasury and Science stand beside their numbers; the codex lists them. **Increment 23 is
  built:** optional governors with a priority (`src/sim/governor.ts`, the code the rivals will use),
  every action in the report with its reason, the player's own zoning locked; a hands-on or
  imperial start; attention and six edicts, with a setting to hide them; state version 8.
  **Increment 24 is built:** the other two powers play every new game as rivals
  (`src/sim/ai.ts`, *play alone* in *More*), by the player's own orders and rules; the screens
  show only what the player can see of them (`src/sim/visibility.ts`); the deep-space scanner
  (3 pictures); the Watch's report and advisor lines; the empire's *Powers* tab; three 100-turn
  headless games in the unit tests. **Increment 25 is built:** twelve events with pictures and two
  choices each (`src/sim/events.ts`), answered from *what needs you*, the report or the advisor
  who speaks of it, or by their first choice after three turns; rivals answer theirs; the flare
  shield and Magnetics; state version 9. **Increment 26 is built:** the guided opening, eleven
  steps led by the advisors and done by doing them (`src/app/guide.ts`), on for a first game, with
  *Menu → Guide me* and a setting. **Increment 27, the proof, is built:** rivals spend their
  treasuries on overdrive and their attention on edicts; `npm run balance` writes the headless
  games to [M2_BALANCE.md](design/M2_BALANCE.md); a browser journey plays 100 turns on a phone and a
  desktop. **M2 is complete** and waits for the owner's try.
- **M2b, *Science and rivalry*, is under way** ([M2B_SCIENCE.md](design/M2B_SCIENCE.md); D-44 to
  D-50 decided as recommended on 21 October 2026). **Increment 28 is built:** research from every
  colony's scholars (1 for every 4 million, kept at approval) and a lab as every fifth district for
  every governor, so every power's science grows with its empire; the colony's panel shows its
  research; `npm run balance` reports research a turn and when the tree is finished.
  **Increment 29 is built:** discoveries (`src/sim/discoveries.ts`): every technology names a deed
  that pays 40% of it once (an inspiration), and a first survey of what astronomers have observed
  (white dwarfs, discs, brown dwarfs, flare stars, planets, systems of three stars) gives research
  with a line labelled *Observed*; state version 10. **Increment 30 is built:** 21 new
  technologies (54 in all) with tiers 4 and 5, each costing 7% more for every technology known;
  the lane relay, the orbital habitat (an outpost becomes a colony in orbit) and the terraforming
  station, with their pictures; the research screen as tabs on a phone and a grid with the queue
  beside it and arrow keys on a desktop; state version 11. **Increment 31 is built:** three pairs
  of doctrines, each closing the other; a technology costs 15% less for each met power that knows
  it (at most 30%); the Watch's rumours of rivals' great steps; science in the standings.
  **Increment 32 is built:** Great engineering and four great works to race for (one each in the
  neighbourhood, 4 pictures); a score in the standings and the headless games; rising costs at 8%.
  At turn 100 of the headless games the Authority knows about 37 technologies, the Cooperative 22
  and the Wake 22, on every seed within §2's targets; no power learns all it can before turn 180.
  **M2b is complete** and waits for the owner's try.
- **M3 "Neighbours"** ([design/M3_NEIGHBOURS.md](design/M3_NEIGHBOURS.md)), decided 22 October
  2026. **Increment 33 is built:** the shell, 149 real systems between 27 and 33 ly from the
  archives on 22 October 2026 (356 in all), in `src/data/shell.json` beside the unchanged census;
  no old lane reaches them, so they are reached by blind jumps and new lanes. The map's first
  load is 358 KB; a game's map, turns and saves stay within their budgets.
  **Increment 34 is built:** contact kept in the state (a signal, words while a tongue is learnt,
  talk; humans talk at once), in place of M2b's *met*; the Envoy, a seventh advisor with a face for
  each power; Translation in Xenology (62 technologies); state version 12.
  **Increment 35 is built:** every power's regard for the others, with its reasons (kin, how long
  known, character, and memories that fade: gifts, great works lost, settling beside); gifts of
  credits; the diplomacy screen (Y on a desktop; the menu and the Powers tab on a phone); state
  version 13.
  **Increment 36 is built:** treaties of open lanes and shared research, offered and answered by
  the player and the rivals alike, ended with notice or broken (and remembered); the rivals offer,
  send gifts and give notice by their character and regard; state version 14.
  **Increment 37 is built:** claims (a colony's system and every system one lane away), contested
  systems, the border treaty and the trade agreement; claims on the map and in the system panel.
- **Numbers (after M2b):** 425 unit tests and about 230 browser journeys pass; state version 11;
  the tree has 61 technologies (58 for any one power), 22 projects; a colony's still on a phone
  loads 761 KB of pictures at most (1 MB) and its diorama 2.04 MB (2.25 MB, raised from 2 MB for
  the great works); before M2b: the title loads 21.2 KB of its
  40 KB budget, a game's map about 319 KB of 900 KB, opening a colony 9.5 KB of code more (40 KB);
  a colony's still on a phone loads 658 KB of pictures at most (1 MB) and the diorama it opens
  1.62 MB (2 MB), both measured over the game's own scenes with the game's own choice of widths;
  state version 9.

## 2. The next job

The owner was sent every music candidate, lettered, to choose by ear, and the lettered sheet of
increment 20's district buildings; apply any overrule they send (`npm run music:approve` /
`npm run art:approve` with the candidate they name; candidates live in the git-ignored
`music/out/` and `art/out/`, so a pick from a lost session means new candidates).

**The main track is M2 "Worlds"** ([design/M2_WORLDS.md](design/M2_WORLDS.md)), in the order of
its §18. Increments 20 (districts, food, credits and approval, built as one), 21 (projects and
research), 22 (advisors and the report), 23 (governors and edicts), 24 (rivals that play), 25
(events), 26 (the guided opening) and 27 (the proof) are done: **M2 is complete.** The owner was
asked to play a game of 50 turns or more on a phone and a desktop and say what was dull, unclear,
slow or too easy (§29.5); their answers decide M3's first changes.

**Done: M2b, *Science and rivalry*** ([design/M2B_SCIENCE.md](design/M2B_SCIENCE.md)), after M2's
headless games showed two rivals stuck at 5 research a turn and the third through the whole tree by
turn 90. D-44 to D-50 were answered *as recommended* on 21 October 2026, and increments 28 to 32
were built as its §12 set out, each with a detailed design section first (§16 onwards) and its
notes as built. **M2b is complete.** The owner was asked to try it (a game of
50 turns or more on a phone and a desktop) and may overrule the picture picks of increments 30
and 32 (lettered sheets sent).

**Now: M3 "Neighbours"** (SCOPE.md §5), [design/M3_NEIGHBOURS.md](design/M3_NEIGHBOURS.md): first
contact and translation, treaties without war, borders and claims, trade, memory of what each
power did, and the first two alien species, in increments 33 to 40. D-12 and D-51 to D-57 were
answered *as recommended* on 22 October 2026 ([DECISIONS.md Round 6](DECISIONS.md#round-6-neighbours-decided-22-october-2026)),
which gives leave to run the sky fetch on GitHub's runners (D-51) and raises the art budget to
about $50 (D-57). As in M2b: write each increment's detailed design section (§18 onwards) before
building it, and send each increment's pictures as lettered sheets, recorded in DECISIONS.md with
their cost. **Done: increment 33, the shell** (§18): 149 real systems between 27 and 33 ly
(356 in all), laneless, from the archives on 22 October 2026 (`npm run data:shell`); the census
and saved games unchanged. **Done: increment 34, contact** (§19): signal, words and talk between
powers, the Envoy (a seventh advisor), Translation; state version 12. **Done: increment 35,
memory** (§20): attitudes with their reasons, gifts, and the diplomacy screen; state version 13.
**Done: increment 36, treaties** (§21): open lanes and shared research, offered, answered, ended
with notice or broken, and the rivals dealing by character; state version 14. **Done: increment
37, borders and trade** (§22): claims round every holding on the map, contested systems, the
border treaty and the trade agreement. **Next: increment 37b**, exchanges of resources and the
Hollow Wake's tolls, bribes and protection (D-56), then the two species (38, 39) and the proof (40).

The art and music spend: about $24.75 of $50 (raised on 22 October 2026; about $25.25 left). M3's
art is about 65 pictures (about $6.50).

## 3. Standing instructions from the owner

- **Documentation first; key decisions are the owner's** (CLAUDE.md). Anything the documents do not
  cover goes into DECISIONS.md with options and a recommendation, and is asked before it is built.
  Small, reversible engineering choices are made and listed under *Made without waiting*.
- **The Gemini key** is in the environment as `GEMINI_API_KEY`. **Never print, log, commit or echo
  it.** There is no OpenAI key; that is expected. If the Gemini key is missing or refused, stop and
  tell the owner exactly what you saw.
- **Art spend (D-27):** about **$35 in all** may be spent without asking (raised on 21 October
  2026); about **$24.45** is spent (after M2b), so about **$10.55** is left. Nano
  Banana (`gemini-nano-banana-2.1`, about $0.05 a picture) for everything (D-23). Record every
  batch with its cost and the running total in DECISIONS.md.
- **Pictures:** candidates go to `art/out/`, which git ignores, so they are lost with the session.
  Send the owner a **lettered contact sheet** of the candidates (as a file) when you choose, so
  they can overrule (`--batch` puts several briefs on one sheet). Approve with `npm run art:approve`; every published picture needs its record,
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

- **After ending a turn, wait for the report before closing it.** On CI's slower machine the date
  turns a moment before the report opens; an *Escape* sent in between is lost, and the report then
  covers whatever opened next (CI failed on increment 18's first push this way).
- **Never `pkill -f "vite preview"`:** the pattern matches the shell running the command, which
  kills it. Stop a preview by its process id (`ps aux | grep "preview --port"`).
- **Props are placed after the buildings** (`placeProps` in `colonyPlace.ts`), beside each building's
  foot first; a prop with no free place is simply not drawn. Layouts are quickest checked by drawing
  the boxes over a landscape with sharp before any browser run.

- The journeys' web server (`vite preview` on port 4173) is **reused if one is already running**,
  and it serves `dist/` from disk. Rebuild (`npm run build`) before running journeys, and never
  rebuild while a run is going.
- **Pass `?test` in the address for test hooks:** `window.__map` (`screenOf`, `moving`, `animating`,
  `fieldCount`, `sparkCount`, `flying`, `orbit`, `visibleLabels`), `window.__system`, and
  `window.__colony` (`info` with its `props` and `pictures`, `life`, `look`, `buildingsOnScreen`,
  `propsOnScreen`, `pointOn`, `setClock`). Use seed `4242` (the *More* section on the new-game
  screen) when a journey needs fixed numbers.
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
- **M2's journeys take longer:** every new game now has rivals and events, and a full local run
  at two workers took about 95 minutes. Run the specs an increment touches locally on all three
  sizes, and let CI run the whole suite on the branch and on `main`.
- **The 100-turn games** (`long.spec.ts`) run as their own projects, `long-phone` and
  `long-desktop`, which depend on every other project: they run last, alone, because their load
  slowed other journeys' first frames on CI. `--no-deps` runs them by themselves.
- **End turn stays disabled until the last turn is saved**; a press before then is ignored. A
  journey that ends many turns waits for the button to be enabled first.
- **Setting a game up:** with `?test`, `window.__setGame(state)` puts a modified copy of
  `window.__game()` into play (structured-clone it first), so a journey can start some way on.
- **More test hooks** (`?test`): `window.__game()` (the game as it stands), `window.__lastTurnMs()`
  (the last turn, from the press to the next quarter in the game), and `__map.shipMarks`. Guiding
  stays off in tests unless the address says `guide`; music unless it says `music`.
- **Headless questions** (what do the rivals do by turn 50?) are quickest answered with a
  throwaway unit test that plays turns with `resolveTurn` and writes what it finds to a file; delete
  it after. `npm run balance` writes the standing report to `docs/design/M2_BALANCE.md`.
- **Overlapping increments:** keep each one its own commit. A fix found later in an unpushed
  increment is folded into it with `git commit --fixup=<sha>` and
  `GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash <base>` (commit or set aside other work first);
  a worktree at an increment's commit (`git worktree add`, with `node_modules` linked) checks and
  tests it exactly as it will ship.

## 5. Also open

- The owner's try of M1 on a real phone.
- The owner's choice of music by ear (every candidate was sent, lettered), of increments 20's and
  21's buildings and of increment 22's faces (the sheets were sent).
- The owner may overrule the report pictures chosen in increment 13 (DECISIONS.md, 19 October),
  and any of the colony view's (COLONY_VIEW.md §8).
- CI on `main` failed once on increment 15 (a phone journey waited 10 s for a scaffold that a
  starved machine took longer to load); increment 17 gave scene updates 30 s and made taps aim
  where a building really shows, and CI passed on 16 and 17. Look at the latest run before
  starting.
- Round 2 decisions (D-13, D-14, D-17, D-18) are for later milestones; D-15 was decided with M2,
  and D-12 is proposed for M3 in Round 6.
- Not chosen for now (D-30): second versions of the projects, halls and rigs; cold and hot homes;
  more for the colony scene (a parent planet in a moon's sky, a hull on the shipyard's pad).
