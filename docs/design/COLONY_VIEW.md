# The colony in pictures (proposal)

**Status:** a proposal, written 20 October 2026 at the owner's request; not built. It needs the
owner's answers to [D-28](../DECISIONS.md#d-28--the-colony-view--open) before anything is
generated beyond the style slice (§6, increment 14).

The owner's request:

> I want to flesh out the colony management screen to have nice illustrations, so I can visually
> see the colony, see the buildings, and see maybe some people moving around. I want it to be
> really nice.

**Goal.** Opening a colony shows the place itself: its world's ground and sky under its own sun,
the buildings it has (each project, and homes that grow with its people), what is being built, and
life: people walking between buildings, rovers, a shuttle settling on the shipyard's pad, lights
coming on at dusk. The scene changes as the colony grows and builds; it is true to the world it
stands on (a frozen moon looks frozen, a red dwarf's planet is lit red, an airless world has a
black sky); and it works on a phone and a desktop alike (D-04). **The scene shows; the panel
tells:** every number stays in the colony's panel, as now.

**Out of scope.** M2's districts and their rules (but the scene is laid out in the world's `size`
slots, 1 to 12, so districts drop in later); unrest, defence and combat; music.

## 1. What the scene shows, and where it comes from

Everything is worked out from the game's data, so all of the game's ~700 worlds get a scene without
a picture each.

| In the scene | From the game |
| --- | --- |
| The sky: black with stars, thin and violet, bright and hazy, yellow-green and choking | `atmosphere` (none, thin, dense, toxic) |
| The ground (a **biome**, §3) | `kind`, `temperature`, `water` |
| The sun: its colour, its size in the sky, its height | the star's `colorHex`; size from the star's radius and the orbit; a tidally `locked` world's sun stands still on the horizon (the twilight band) |
| A flare | a flare star (`flare`): now and then the light flickers brighter |
| A planet in the sky | for a moon, its parent planet, drawn with the system view's planet art |
| Homes, growing | the colony's `people`: tiers at about 1, 3, 8, 15 and 25 million |
| Open air or domes | how habitable the world is for the colony's species (`speciesFor`): comfortable → open air and fields; tolerable → domes and greenhouses; harsh → sealed domes, partly underground |
| Each project | `projects`: the shipyard (a pad and a gantry), the lane station (a beacon mast), the mine (a rig and conveyors), the survey station (a dish array) |
| What is being built | the queue's first item: a scaffold where it will stand, filling as industry goes in; a ship's hull on the shipyard's pad |
| Riches | rich metals: ore heaps; volatiles: vents and ice; fusion fuel: regolith processors |
| Whose it is | the power's colour in lights, banners and the pad's markings; its emblem on the main hall |
| The capital | a landmark: the power's hall |
| Life | people in proportion to the population (dozens of figures at most), rovers, cargo lifters, a shuttle now and then, lights at night, weather (dust, snow, rain, ash) by biome |

An **outpost** has a smaller scene: automated rigs, a beacon and drones; no homes and no people.

## 2. How it is drawn: a living diorama

A fixed composition, put together by the game from layers, back to front:

1. **Sky**, drawn in code: a gradient from the atmosphere and the star's colour, stars when it is
   dark, the sun's disc and glow, the parent planet for a moon.
2. **Landscape**, painted (art pipeline): the far mountains and the middle ground of the world's
   biome, generated against a plain white sky that is keyed out at build time, so the sky (and so
   the sun's true colour) is always the game's own.
3. **Ground and slots**: the empty plain in the foreground, with up to 12 building slots per
   landscape (positions and scale recorded beside the picture), nearer ones larger.
4. **Buildings**, painted sprites (art pipeline): one per kind and state, generated on a flat
   magenta background and keyed to transparent WebP at build time, with contact shadows drawn in
   code. **Night lights without extra pictures:** every building is painted with warm lit windows;
   at night a shader darkens the sprite but keeps its brightest pixels glowing.
5. **Life**, in code: people as tiny two-frame walking figures (a few pixels tall, suits in the
   power's colour) on paths between building doors, rovers with headlights, a shuttle sprite on an
   arc to the pad, weather particles, blinking beacons.
6. **Frame**: a soft vignette and the console's lit corners.

**Light:** a slow, cosmetic day (about 90 seconds; a turn is three months, so the day is not a
rule), dusk and night with the lights on; a locked world stays in its twilight. With *reduced
motion*, a still scene in late-afternoon light.

**Engine:** three.js with an orthographic camera (sprites as planes; shaders for the sky, the night
lights and the haze), borrowing the map's renderer while the map pauses, as the system view does,
so a phone keeps one WebGL context. Canvas 2D would also do, but loses the shaders.

**Camera:** a low panorama from a ridge above the settlement, wider than the screen: drag to pan,
with a little parallax between the layers; it drifts slowly when idle.

## 3. The pictures

Two new series in `art/styles.ts`, in the D-23 style:

- **`landscape`**: a wide matte painting of a planet's surface seen from a low ridge, the horizon a
  third of the way down, an empty flat plain in front, the sky a plain flat white (to be replaced);
  21:9, 2560 px wide.
- **`structure`**: a single building of the colony's architecture, a three-quarter view from the
  front left and a little above, lit from the upper left, warm lit windows, on a plain flat magenta
  (#FF00FF) background, no ground, no shadow, the whole building in frame; published at 512 and
  1024 px with transparency.

Gemini returns JPEG only (ART_PIPELINE.md), so transparency needs a new build-time step,
`npm run art:key` (sharp): a colour key with a soft edge and despill for magenta fringes, and a
luminance key for the white sky; the keying settings are recorded in `art/manifest.json` with the
rest of the picture's provenance.

**Biomes** (one landscape each, about nine): garden (temperate, oceans), steppe (temperate or warm,
dry), desert (hot), inferno (scorching), tundra (cold), ice sheet (frozen), airless rock (no
atmosphere), haze (toxic or dense), ocean shore (oceans, for water worlds). Moons use these with
their parent planet in the sky.

**Structures** (about 22): homes in five tiers, each open-air and domed (10); the four projects
(4); the capital's hall (1); a scaffold (1); the outpost rig and drone pad (2); a shuttle and a
rover (2); greenhouses and fields as filler (2).

**Species and powers (D-08):** sets are keyed by species. The human set serves all three powers,
told apart by colour, lights, markings and emblems drawn in code; each alien species gets its own
set when it arrives (D-12).

**Cost:** about 75 pictures with two or three candidates each, about $4 to $6 with re-rolls, after
a style slice of about $0.60 (§6). D-27 allows about $15 in all; about $2.70 is spent.

## 4. On the screen

- **Entered** from the colony's panel (a *View colony* plate), the empire's list of colonies, and a
  held world in the system view; **left** with *← System* or Esc. The map glides in and the veil
  lifts, as for the system view (LIVING_MAP.md §5).
- **Phone, portrait:** the scene fills the top of the screen; the colony's panel (people, industry,
  queue, yields, lanes) is a sheet below it, pulled up for detail. **Landscape:** the scene fills
  the screen, the panel a side sheet.
- **Desktop:** the scene fills the map's place between the outliner and the inspector; the panel is
  in the inspector; hovering a queue item lights its slot.
- **Tap a building** to light it and open its card: what it does, its numbers; the shipyard's card
  shows the ship being built.
- **Moments:** when a project finishes, its scaffold becomes the building with a flash and a puff
  of dust; when the population passes a tier, new homes rise. The report's dispatch links to the
  scene.

## 5. Speed and access

- The scene's code is its own chunk; its pictures load when first needed (about 0.5 to 1 MB for a
  colony's first visit, then kept offline by the service worker). A new budget for the colony
  view's first open, checked like the others.
- Low quality: 512 px sprites, no weather, at most 20 people; the adaptive frame rate of the map
  (LIVING_MAP.md §8).
- A written description of the scene for screen readers ("Tau Ceti e: a domed town of ten million
  under a pale yellow sun, with a shipyard and a lane station; a mine is being built"), the
  *Illustration* badge, and 44 px targets for every building on a phone.

## 6. Building it

| # | Increment | What |
| --- | --- | --- |
| 14 | **Style slice** | the two series, `art:key`, six pictures (Tau Ceti e's landscape, homes tier 2 domed, shipyard, lane station, mine, scaffold), a still composition in the game; the owner sees the contact sheet and screenshots before the rest is made |
| 15 | **The diorama** | `colonyScene()` (pure, tested, like `systemLayout`), the sky shader, landscape and slots, buildings by state, the scaffold and its progress, the screen on phone and desktop, the way in and out |
| 16 | **Life** | people, rovers, the shuttle, weather, day and night with lit windows, the moments, tapping buildings, reduced motion, the adaptive frame rate |
| 17 | **The full set** | every landscape and structure, domed and open, outposts, the capital's hall; contact sheets to the owner; the budget |

## 7. Tests

- **Unit:** `colonyScene()` for Earth, Tau Ceti e, Wolf 1061 c, an airless moon and a frozen world:
  biome, sky, sun, envelope, slots (as many as the world's size), every project placed, the
  scaffold for the queue's first project, the home tier for the population.
- **Browser:** open the scene from the panel on the phone, tablet and desktop (a `window.__colony`
  hook when `?test`); tap a building for its card; finish a mine and see it appear; nothing moves
  with reduced motion; the art records are complete; screenshots at the ten sizes.
