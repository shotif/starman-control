# M1 · The system in 3D (increment 7)

**Status:** designed on 19 October 2026 at the owner's request ("I want to … enter a star system
and see the sun and the planets in 3D"); the owner took the recommendations of
[D-25](../DECISIONS.md#d-25--the-3d-system-view--decided) the same day: M1 increment 7, after
lanes and research, compressed to scale, with Reborn's shaders. It adds to
[M1 §10](M1_FIRST_LIGHT.md#10-the-interface-on-phone-and-desktop), where the system screen is a
panel of facts.

**Goals.** Enter any system and see its star, or stars, and its worlds in 3D, on a phone and on a
desktop; choose a world there to open its panel; see at a glance which worlds are yours, which
your people could live on, and what is real and what is fiction.

**Out of scope here:** flying a ship among the planets (that is Starman Reborn's game); ships,
stations and battles in the scene (with fleets, in M4); the planets' real positions on their orbits
today (astronomers do not know most of them).

## 1. Entering and leaving

| | Phone | Desktop |
| --- | --- | --- |
| Enter | **View in 3D** on a system's sheet | **View in 3D** in the inspector, or the key V (double-click still centres a star) |
| Inside | the scene fills the screen; the sheet lists the worlds, as now | the scene takes the map's place; the outliner and inspector stay |
| Choose a world | tap it, or tap its row in the sheet: the camera glides to it and the sheet shows its panel | click it, or its row; hover shows a card |
| Leave | **← Neighbourhood**, or pinch out far enough | Esc, or **← Neighbourhood** |

The neighbourhood map keeps its place, so leaving returns to the view you had.

## 2. What is drawn

- **Stars** in their catalogued colour, sized by kind, with a glow. A system of several stars
  shows each: a companion with a catalogued orbit sits in its real direction from the primary, the
  others at a fixed angle, all at compressed distances (Reborn places binaries this way).
- **Worlds**, real and generated, each with a procedural look from its kind and temperature: rocky
  (scorched, warm, temperate with oceans and cloud, cold, frozen), super-Earths, mini-Neptunes and
  giants with bands, rings on some giants (from the game's seed). Moons circle their planets;
  belts and debris discs are rings of rock and dust.
- **Orbits** as faint circles, and the **habitable zone** (where water could be liquid, estimated
  from the star's light) as a faint green band.
- **Yours and theirs:** a colony or outpost wears its power's mark and colour beside its label.
- **Labels** name each world, with its habitability for your species; generated worlds carry the
  *Fiction* badge in their panel, as everywhere.
- An unsurveyed system shows only the worlds astronomers know, and says so.

## 3. Scale and motion

- **Compressed, and labelled "not to scale".** At true scale the planets would be invisible dots
  and the outer worlds off screen. Distances are compressed (the square root of the real orbit, as
  Reborn does) and planets enlarged, keeping their order and relative size; each world's panel
  gives the true figures.
- **The worlds move** slowly round their stars, their periods in the real ratio (Kepler's third
  law), much faster than real time; *reduced motion* stops them. Where each world is on its orbit
  is illustrative, and the codex says so.

## 4. How it is built

- The procedural star, planet, ring and belt shaders are **copied from Starman Reborn** (D-10):
  `src/world/art/stars.ts`, `planets.ts`, `asteroids.ts` and `noise.ts`, about 2,500 lines with no
  dependency on Reborn's flight game, on the same three.js version. Their inputs are mapped from
  this game's bodies (kind, temperature, water, atmosphere, seed).
- A `SystemScene` beside `MapView` shares its WebGL renderer, so a phone never holds two contexts.
- The scene's layout (compressed orbits, binaries, moons, belts) is a pure function with unit
  tests: orbits keep their order and never overlap, every body is drawn once, the same system and
  seed always give the same scene.
- **Budgets:** the scene loads with the map (three.js is already there), adds well under 100 KB
  compressed, and keeps 60 frames a second on a mid-range phone; a *quality* setting falls back to
  simply lit spheres.

## 5. Tests

Unit tests for the layout; browser journeys that enter a system, choose a world and leave, on a
phone, a tablet and a desktop; screenshots at the six review sizes.

## As built (19 October 2026)

- **Entering:** **View in 3D** on any system's panel (sheet or inspector), or **V** on a desktop;
  **← Neighbourhood** or Esc leaves, and so does choosing another system or where a ship goes.
  Double-click still centres a star on the neighbourhood map.
- **Choosing a world:** a tap or click on a world or star chooses it, the camera glides to it
  and follows it round its orbit, and the sheet or inspector shows its panel; choosing a world in
  the panel does the same in the scene. A double tap also glides there.
- **Drawn:** as §2, with Reborn's star, planet, ring and belt art copied into
  `src/render/art/` (their source noted in each file); Sol's worlds wear Reborn's looks for them,
  other worlds a look chosen from their kind, temperature, water and air
  (`src/render/systemLayout.ts`). A held world's label carries its power's colour.
- **Scale and time:** orbits at 3,000 + 14,000 × √(au) units, companions at Reborn's logarithmic
  separations and always clear of every orbit; the innermost world goes round in 24 seconds and
  the rest in Kepler's ratio. With *reduced motion* the worlds stand still.
- **The renderer** is the map's own: the map pauses (no drawing, no input, no labels) while the
  system view uses its canvas. The scene's code is loaded only when a system is entered, about
  19 KB compressed.
- **Not yet:** the low-quality setting with plain spheres comes with the settings screen in the
  proof increment; desktop hover cards over worlds (the labels name them meanwhile).

