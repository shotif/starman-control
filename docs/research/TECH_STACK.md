# The technology stack: options and a recommendation

Research for decision D-22, 19 October 2026. The owner asked whether Control should use a
different stack from Starman Reborn, if another would be more effective.

## What the stack has to do

1. **Run completely on phones and on desktops** (D-04), in the browser, from a static site
   (GitHub Pages), with a first load small enough for a mobile connection.
2. **Carry a lot of interface.** A 4X is mostly screens: the map, systems, planets, colonies,
   fleets, the ship designer, research, diplomacy, the council, reports, the codex — each in a phone
   and a desktop layout, full of lists, tables, sheets and number breakdowns. Reborn is the
   opposite: a 3D action game with a thin interface.
3. **Draw a star map** of a few hundred real stars and their lanes, in 3D and flat, and later short
   3D battle replays with procedural ships.
4. **Run a deterministic simulation** in the background (a Web Worker): the same seed and orders
   give the same result on every device (D-06), with AI powers from M3.
5. **Leave the door open** to a Steam build (D-18) and perhaps the phone app stores.
6. **Suit how the game is built:** mostly by Claude in cloud sessions, so everything should be
   text, testable without a screen, and screenshot-able in CI.

## What changed since Reborn

Reborn's hand-written HTML and CSS (no interface framework) was right for a flight game whose
interface is a HUD and a few station screens. Control turns the proportions round: the interface
is most of the work, it changes with every turn, and it must exist twice (phone and desktop).
Updating hundreds of elements by hand whenever the simulation changes is slow to write and a
common source of bugs. **This is the one place where Reborn's stack would hold Control back.**

## Game engines: considered, not recommended

| Option | For | Against |
| --- | --- | --- |
| **Godot 4** | a strong interface toolkit for games; exports to desktop (Steam) and phone apps; free and open | the web build carries the whole engine (several megabytes compressed, against our budget of under one); slower to start and weaker in phone browsers; multi-threaded web builds need server headers GitHub Pages cannot send; editor-centred workflow; none of Reborn's code, data pipeline or tests carry over |
| **Unity** | mature, large asset store | heavy WebGL builds and poor phone-browser support; licence terms; binary project files |
| **Bevy** (Rust, compiled to WebAssembly) | fast, deterministic, code-only | interface tooling still immature for an interface-heavy game; slow compiles; a second language |
| **A canvas UI** (Phaser, PixiJS UI, Flutter web) | one drawing surface | text drawn on a canvas loses the browser's text sizing, sharpness and accessibility; Reborn's rule that text and controls are HTML exists for good reasons |

An engine would make sense if the game became native-first (a Steam or app-store game that also
happens to have a web build). With the browser and phones as the first home (D-04), the web
platform is the better fit.

## The web platform: which interface layer

The same small screen (a 200-row colony list, a selection and a turn counter) built in each
candidate, bundled and minified as a production build would be (esbuild, 19 October 2026). The
size is what a phone downloads for the interface layer itself:

| Interface layer | Gzipped | Notes |
| --- | --- | --- |
| Hand-written DOM (Reborn's way) | 0.3 KB | nothing to download, but every screen's updates written by hand |
| **Preact + Signals** | **8.2 KB** | React's way of writing components, in a library a tenth of its size. Components are TSX, checked by the same TypeScript compiler as the simulation. Signals update only what changed, which fits "a new simulation snapshot every turn". React libraries work through its compatibility layer if ever needed |
| Svelte 5 | 19.0 KB | pleasant to write, scoped styles and transitions built in; its own file format, compiler and type checker; two generations of its syntax in circulation |
| Solid (not measured; about 7 KB published) | — | the fastest updates; a smaller community and fewer examples |
| React 19 | 67.8 KB | the largest ecosystem (including react-three-fiber for three.js), but eight times Preact's size on every phone for no gain this game needs |
| *For comparison: three.js, the map's core* | *131.4 KB* | *needed whichever interface layer is chosen* |

## The simulation

TypeScript in a Web Worker, as planned, rather than Rust compiled to WebAssembly: one language,
fast tests, and plenty of speed for a turn-based game of a few hundred systems. One rule makes it
deterministic across devices: **the simulation uses whole numbers (or fixed-point) for anything
that persists, and never calls `Math.sin`, `Math.exp`, `Math.pow` and the like**, whose last digits
can differ between browsers. Geometry fixed at build time (positions, distances) is computed once
and stored.

## Recommendation

**Keep the web platform; add an interface framework and a linter.**

| Part | Choice | Status |
| --- | --- | --- |
| Language, build, tests | TypeScript, Vite, Vitest, Playwright | as now |
| **Interface** | **Preact + Signals**, starting on the mature 10.x line (Preact 11 came out on 30 September 2026; move up once it settles) | **new** |
| Styles | plain CSS with Reborn's tokens; **container queries** so a panel lays itself out by the space it has, which serves the phone and desktop layouts | as now, plus container queries |
| Map and battle replays | three.js, adapted from Reborn's star map, inside one Preact component | as planned |
| Simulation | pure TypeScript in a Web Worker, whole-number arithmetic; a small typed message bridge of our own (no library needed for a handful of calls) | as planned |
| **Lint and format** | **Biome** (one fast tool; development only) | **new** |
| Saves | IndexedDB with a backup slot, export and import, adapted from Reborn | as planned |
| Art | the Gemini pipeline with sharp | as now |
| Hosting | GitHub Pages | as now |
| Later: Steam and app stores | wrap the same build: Tauri or Electron for Steam, Capacitor or Tauri for phone stores; decided at M5 (D-18) | open |

**Why it is more effective:** components make each screen small, testable on its own, and easy to
lay out twice; Signals connect the simulation's snapshot to the screens without hand-written update
code; the cost on a phone is about 8 KB. Nothing already built is lost — the simulation, data,
three.js map and save code are framework-independent — and **switching now costs nothing**, since
no interface code exists yet. Switching after M1's screens would cost a rewrite.

**What it does not change:** M1's increment 1 (the data and the simulation core) has no interface
code and can start before this is decided.
