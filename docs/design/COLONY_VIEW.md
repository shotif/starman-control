# The colony in pictures (proposal)

**Status:** built, 20 October 2026, in increments 14 to 17 (§6, and *As built* in §8). The owner
answered [D-28](../DECISIONS.md#d-28--the-colony-view--decided) the same day: a living diorama,
seen from a ridge, on a screen of its own, and **a separate set of buildings for each power**; and
approved the style slice before the rest was made.

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
| Homes, growing | the colony's `people`: more homes as it grows, and bigger ones (small houses, then blocks, then towers) |
| Open air or domes | how habitable the world is for the colony's species (`speciesFor`): comfortable → open air and fields; tolerable → domes and greenhouses; harsh → sealed domes, partly underground |
| Each project | `projects`: the shipyard (a pad and a gantry), the lane station (a beacon mast), the mine (a rig and conveyors), the survey station (a dish array) |
| What is being built | the queue's first item: a scaffold where it will stand, filling as industry goes in; a ship's hull on the shipyard's pad |
| Riches | rich metals: ore heaps; volatiles: vents and ice; fusion fuel: regolith processors |
| Whose it is | the power's own architecture (§3), and its colour in lights, banners and the pad's markings; its emblem on the main hall |
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

**Biomes** (one landscape each, nine), chosen from the world's data in this order, the first that
fits: **inferno** (scorching), **haze** (a toxic atmosphere), **ice** (frozen; or airless with ice
and frozen), **airless** (no atmosphere: grey regolith and craters), **desert** (hot), **tundra**
(cold: rust and grey rock, frost in the hollows), **garden** (temperate with oceans), **shore**
(warm with oceans), **steppe** (temperate or warm and dry). Earth is a garden, the Moon airless,
Mars tundra; Tau Ceti e, whose air and water are fiction made for each game, is most often a
shore. Moons use these with their parent planet in the sky.

**Three architectures (D-28).** Each power builds in its own way, written once in `art/briefs.ts`
and put into every brief for that power, so its buildings belong together:

- **Sol Transit Authority**: civic and orderly. Standardised prefabricated modules on a strict grid,
  pale ceramic panels and brushed metal, flat roofs, neat rows of square windows, slim green guide
  lights. Under a dome: faceted geodesic glass.
- **Frontier Cooperative**: rounded and hand-built. Low curved buildings printed from the local
  soil in warm earth tones, round windows, white fabric awnings and solar sails, planters; soft blue
  lights. Under a dome: clusters of frosted bubble domes and greenhouses.
- **Hollow Wake**: salvaged and tough. Sections of old starship hulls and cargo containers, angular,
  patched with mismatched plates and welded seams, gunmetal and rust, half dug into banked earth,
  triangular braces, small red lights. Under a dome: armoured bunkers with small thick-glass domes.

**Structures** (about 42): for each power, homes in three sizes (small houses, blocks, towers),
each open-air and domed (6), the four projects (4), the capital's hall (1), the outpost's rig (1)
and its shuttle (1), so 13 for each power and 39 in all; shared by every power, the scaffold, the
fields and a rover (3). Homes are placed in numbers as the colony grows, so three sizes stand in
for the five tiers first proposed.

**Species and powers (D-08).** A set belongs to an architecture, and a power names its
architecture in its data (`src/content/factions.ts`), so no code assumes which power the player is.
Each alien species gets its own architectures when it arrives (D-12). A power with no set of its
own would borrow the neutral pieces and a human set until it has one.

**Cost:** about 51 pictures to keep (9 landscapes and 42 structures), two or three candidates
each, about $6 to $8 with re-rolls, after a style slice of about $1 (§6). D-27 allows about $15 in
all; about $2.70 was spent before this.

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
| 14 | **Style slice** | the two series, `art:key`, eight pictures (the shore landscape; the Cooperative's domed homes, shipyard, lane station and mine; the scaffold; the Authority's open-air homes and the Wake's domed homes, to set all three architectures), a still composition in the game; the owner sees the contact sheets and screenshots before the rest is made |
| 15 | **The diorama** | `colonyScene()` (pure, tested, like `systemLayout`), the sky shader, landscape and slots, buildings by state, the scaffold and its progress, the screen on phone and desktop, the way in and out; the pictures it needs: every landscape, and every power's homes and projects |
| 16 | **Life** | people, rovers, the shuttle, weather, day and night with lit windows, the moments, tapping buildings, reduced motion, the adaptive frame rate; the shuttles and the rover |
| 17 | **The full set** | the capitals' halls, outposts, the fields; the ways in from the empire and the system view; contact sheets to the owner; the budget |

Each increment's pictures are shown to the owner as lettered contact sheets when they are chosen.

## 7. Tests

- **Unit:** `colonyScene()` for Earth, Tau Ceti e, Wolf 1061 c, an airless moon and a frozen world:
  biome, sky, sun, envelope, slots (as many as the world's size), every project placed, the
  scaffold for the queue's first project, the home tier for the population.
- **Browser:** open the scene from the panel on the phone, tablet and desktop (a `window.__colony`
  hook when `?test`); tap a building for its card; finish a mine and see it appear; nothing moves
  with reduced motion; the art records are complete; screenshots at the ten sizes.

## 8. As built

### Increment 14: the style slice (20 October 2026)

- **The pipeline:** two new series in `art/styles.ts`. `landscape` (21:9, published 1280 and 2560
  wide) is painted under a flat white sky from a raised viewpoint some thirty metres up; the first
  try, from a low viewpoint, put large shrubs in the foreground and made every building look like a
  model. `structure` (1:1, published 512 and 1024) is a building on flat magenta, seen from a
  little above, cut off at its base; the first try painted each building on a "floating island" of
  soil, and asking for walls seen more than roof brought the angle down. A style names its
  backdrop as `{backdrop}`, and `--backdrop` tries the other one.
- **Keying** (`scripts/art/keying.ts`, `npm run art:key`): a building's magenta is keyed out
  everywhere, edges unmixed from the backdrop and despilled (the JPEG's colour bleeds a pixel or
  two, so a two-pixel rim is despilled too), then trimmed to the building; a landscape's sky is
  keyed down each column from the top until a run of solid pixels, so haze at the horizon stays
  partly clear and white things on the ground are kept. Approval keys the chosen candidate itself
  and records the keying's settings and the trim box in `art/manifest.json`; the contact sheets
  show keyed candidates over a checkerboard.
- **The pictures:** 25 made, about $1.25 (the project's total is now **about $3.95** of the
  owner's $15). Chosen: the shore landscape **E** (the raised view), the Cooperative's domed homes
  **B**, shipyard **B**, lane station **B** and mine **B**, the scaffold **A**, the Authority's
  open-air homes **D** and the Wake's domed homes **B**. The lettered contact sheets went to the
  owner.
- **The scene in code:** `src/render/colonyScene.ts` works out the scene from the game (biome, sky,
  sun, envelope, homes, projects, the scaffold and its progress, a description), pure and tested.
  Homes stand in the even slots from the middle outwards, projects in the odd ones in the order they
  were finished, and a scaffold where its project will stand, so nothing moves as the colony grows.
  One home for every 4 million people. `src/content/colonyArt.ts` lists the pictures, each
  landscape's horizon and twelve slots, and each building's width in metres; a building's size
  in the scene is its width times its depth below the horizon.
- **On screen:** the colony's panel opens with a still of its scene (`src/render/colonyStill.ts`,
  Canvas 2D, so no second WebGL context): the sky drawn in the star's colour, the sun at the upper
  left where the buildings are lit from, the landscape tinted by the star's light with haze laid
  over the far land, and the buildings back to front on soft contact shadows. It appears only where
  every part has a picture: in the slice, a Cooperative colony on a shore world, such as Tau Ceti e
  in games where it has air and seas (seed 1, for example). Elsewhere the panel is as it was.
- **Tests:** `keying.test.ts` and `colonyScene.test.ts` (unit), `colony.spec.ts` (the still drawn
  and described on the phone, tablet and desktop; a queued mine's scaffold; no still where no
  picture exists).

### Increment 15: the diorama (20 October 2026)

- **The owner saw the slice** and said "Go ahead, my picks", keeping the buildings crisp rather
  than more painterly.
- **The pictures:** 66 made, about $3.30 (the project's total is now **about $7.25** of the
  owner's $15): every other landscape (garden B, steppe A, desert A, inferno A, tundra B, ice A,
  airless A, haze D) and every power's homes in three sizes, open and domed, and its four projects,
  so every colony of every power on every world has its scene. The ice is painted under a magenta
  sky so its white ground survives keying. The first two haze landscapes painted their haze across
  the whole sky, which the white key cannot take out, so the haze is now asked for only along the
  horizon (the game draws the rest). Magenta seen through the Authority's glass domes keyed purple,
  so keying now also despills any pixel whose red and blue both stand above its green, which a
  building's own colours almost never do (keying settings version 3).
- **Slots:** the shore's twelve hand-placed slots are a pattern that every other landscape fits
  into its own flat ground (a box measured on each picture, with its horizon), so every world keeps
  the same town plan.
- **The screen** (`src/render/ColonyView.ts`): the still in a colony's panel is now the way in
  (*View Tau Ceti e*). The map glides in and the veil lifts, as for a system; the scene borrows the
  map's renderer while the map pauses. An orthographic camera looks at the world (the landscape
  one unit high), framed to fill the stage's height from the town's foot to a little sky above the
  horizon and centred on the town; drag to look along it, pinch, the wheel or + and − to come closer,
  0 or C to frame the town again. The sky is a shader: day colours from the horizon to the zenith,
  stars where there is no air, the sun's disc and glow at the upper left (on a locked world, low
  on the horizon), its size from the star's radius and the orbit. The landscape and the buildings
  are drawn premultiplied in the star's light with haze, and a scaffold rises from its foot as
  industry goes in. **Phone:** the scene fills the screen above the colony's panel, which drops to
  its peek height on the way in. **Desktop:** the scene takes the map's place between the outliner
  and the inspector. *← System* or Esc goes back; closing the panel, choosing a ship or another
  system leaves it; choosing another colony switches to it. The scene follows the game: queue a
  project and its scaffold appears.
- **Not yet:** people, vehicles, weather, day and night and tapping buildings (increment 16);
  outposts, the capitals' halls, the ways in from the empire and the system view, and a size budget
  (increment 17). An outpost's panel has no still yet.
- **Tests:** `colonyScene.test.ts` (every ground and every power's set present; placing, the
  scaffold's size, framing), `colony.spec.ts` (into the diorama from the still on the phone,
  tablet and desktop; the town in view; dragging looks along it; a queued mine's scaffold; back to
  the map; each power's capital in its architecture on its ground; no glide or veil with reduced
  motion).

### Increment 16: life (20 October 2026)

- **The pictures:** each power's shuttle and a shared rover, 8 candidates, about $0.40 (the
  project's total is now **about $7.65** of the owner's $15). Chosen: the Authority's shuttle A, the
  Cooperative's B, the Wake's B, the rover A. All four face left, so a vehicle going right is
  mirrored.
- **The day** (`src/render/colonyLife.ts`, pure and tested): 90 seconds, light for 60% of it,
  then dusk, night and dawn. The sun crosses from right to left; at sunset and sunrise the
  horizon glows warm where there is air; at night the sky darkens, the stars come out, and the
  pictures darken towards blue while **lit windows and lights glow on**. Windows are found in the
  shader, not painted twice: small bright, coloured spots brighter than their surroundings (a
  coarser mipmap level stands for the surroundings), which works across all three architectures.
  Each colony starts at its own hour. A locked world stays in its twilight, its red sun low and
  still; with reduced motion the scene stays in late-afternoon light and nothing moves.
- **People:** tiny two-frame figures in work suits with a stripe of their power's colour,
  helmeted on worlds that need domes, walking rounds of two or three doors and pausing at each,
  smaller and slower further off, drawn in front of what is behind them. One for every third of a
  million people, at most 40 (20 on low quality).
- **Vehicles:** rovers (one, two on high quality) driving between the projects and the homes,
  with headlights at night; and where there is a shipyard, the power's **shuttle** comes down
  every 45 seconds onto the pad, stays a while, and climbs away, its engines glowing.
- **Weather** by ground, where there is air: dust low over the ground (desert, steppe, haze,
  shore), snow (ice, tundra), rain that comes and goes (garden), ash (inferno). Not on low quality.
- **Moments:** when a project is finished, it stands where its scaffold stood with a flash of
  light; new homes rise from their foot.
- **Tapping a building** (or clicking it) lights it and opens its **card**: homes say how many
  people live in the colony's homes and why they are sealed; a project says what it does, the
  shipyard what ship it is building and how far it has got; a scaffold how much industry is in.
  On a desktop, the pointer over the queue's first project lights its scaffold.
- **Speed:** while only life moves, at most 30 frames a second and fewer on a device that cannot
  keep up, as on the map. The scene's code is 9 KB compressed, loaded on the way in.
- **Tests:** `colonyLife.test.ts` (the day, walkers, the shuttle, the weather) and
  `colonyCard.test.ts` (the card's words); `colony.spec.ts` (people, vehicles and weather in the
  scene; time passes; night falls; a building tapped has its card; a finished mine stands where its
  scaffold was; nothing moves with reduced motion).

### Increment 17: the full set (20 October 2026)

- **The pictures:** each power's capital hall and outpost rig, and the fields every power farms,
  14 candidates, about $0.70 (the project's total is now **about $8.35** of the owner's $15).
  Chosen: the Authority's hall A, the Cooperative's A, the Wake's B (A's earth bank was cut off
  sharply), the fields A, and each rig A. The colony view now has 51 pictures: 9 landscapes; 39
  pieces in three architectures (for each power, homes in three sizes open and domed, four
  projects, a hall, a rig and a shuttle); and the scaffold, the fields and the rover, shared.
- **The capital's hall** stands in the town's middle slot, the power's mark glowing above it in
  its colour, like the console's holograms; the homes start from the next slot.
- **Outposts** have their scene: the power's rig on the world's ground, with no people (a rover
  may still come by). Their panel has the still too.
- **Fields:** an open-air colony farms up to two of the slots left free, from the edge of the
  town; a project queued there takes the slot, and the fields make way.
- **The ways in:** the still in a colony's panel; *View* beside every colony and outpost in the
  empire's lists; *View it* beside a held world in the system view; and *See it* beside a finished
  project in the report.
- **The budgets** (`npm run budgets`, in `npm run check`): opening a colony's scene loads 9 KB of
  code past the map's (40 KB allowed), and the pictures of the heaviest first visit on a phone
  (the largest landscape and the eleven largest buildings and vehicles, at the phone's widths)
  are checked against 1 MB; the service worker keeps them offline afterwards.
- **Tests:** `colonyScene.test.ts` (the hall, an outpost's rig, Earth's fields, every power's hall
  and rig); `colony.spec.ts` (each capital's buildings with its hall; a finished mine seen from the
  report; the empire's *View*; an outpost founded and seen as its rig).
