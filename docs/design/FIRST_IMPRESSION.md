# First impression (increment 9)

**Status:** written 19 October 2026, before it was built, and built the same day (§7); part of
the visual direction ([VISUAL_DIRECTION.md](VISUAL_DIRECTION.md), D-26).

**Goal.** The first seconds say *game*, not *web page*: a live sky, a title worth looking at, and
powers with faces, on a phone and on a desktop alike.

## 1. The Milky Way, in its true place

A sky drawn behind everything (the title now, the map in increment 10): the band of the Milky
Way along the **real galactic plane** (north galactic pole at RA 192.86°, Dec +27.13°; the
centre at RA 266.40°, Dec −28.94°, in Sagittarius), brighter and warmer towards the centre, with
dark dust lanes along its middle, faint coloured haze, and a dust of faint background stars
thickest in the band. Where it lies is real; how it looks is an illustration, and the credits say
so. One full-screen pass with a few octaves of noise; fewer on low quality.

## 2. The title

- **A live scene:** the 207 real systems as glowing points in their true positions, Reborn's
  lanes as faint threads, each power's capital in its colour, slowly turning round Sol under the
  Milky Way. It loads after the menu is up, so the title stays small (budget: 40 KB), and fades
  in. With reduced motion it holds still.
- **The logotype:** STARMAN set wide and light, CONTROL large and bold with Control's cyan glow.
- **The menu:** lit plates, each a word and a line (*Continue · Sol Transit Authority, Q2 2177*;
  *New game · lead one of three powers*), left of the scene on a desktop, at the thumb's reach on
  a phone; they rise in one after another.

## 3. Choosing a power

Each power as a tall card: its scene (Earth's customs ring at dawn, the Cooperative's terraced
domes, the Wake's asteroid den) and its leader's portrait from the art pipeline, its emblem, its
colour as light along the card's edge, and the facts as before. Side by side on a desktop, lifting
and glowing on hover; one at a time on a phone, swiped sideways. Pictures are badged as
illustrations.

## 4. Emblems

An emblem for each power, drawn as vector art on its mark (D-08: colour always with shape): the
Authority's square within a square, crossed by a lane; the Cooperative's circle of three rising
shoots; the Wake's triangle trailing a broken wake.

## 5. No web page left

A loading screen in the game's own look (in `index.html`, shown before any script runs); screens
fade into one another; the "Loading…" text becomes the console's own loader.

## 6. Tests

Every existing journey still passes (names of links and buttons kept); screenshots at the nine
sizes; the budgets.

## 7. As built

- **The sky** (`src/render/milkyWay.ts`): the band, its star clouds, the dark rift down its middle
  and the faint haze are drawn **once** into a cube map when the scene starts (512, 1024 or 2048
  pixels a face for low, medium and high quality), so a phone pays for the noise once, not every
  frame. Faint stars far beyond the neighbourhood are points, crisp at any size: a scattering over
  the whole sky and a dense cloud of them along the band, thicker towards the galactic centre, all
  from a fixed seed so the sky is the same on every visit. They twinkle a little, unless motion is
  reduced. The map will use the same sky in increment 10.
- **The title's scene** (`src/render/TitleScene.ts`): the camera turns slowly round the middle of
  the three capitals **in the plane of the galaxy**, with a slight roll, so the Milky Way always
  arches across the view; it drifts in from further away over the first seconds. The 207 systems
  glow in their stars' colours, the brighter kinds with four faint spikes; Reborn's old lanes are
  dim threads; each power's home web (worked out as a new game does) is lit in its colour, with
  sparks of light running out from the capital; each capital is ringed by its power's mark. Things
  further away fade, for depth. It has its own canvas, made 0.8 s after the menu has been drawn
  (once the boot screen has gone, so baking the sky never holds either up) and thrown away with
  the title; it draws less often on a device that takes long over a frame; it stops while the page is hidden, and draws once and holds still
  with reduced motion. On a wide screen it sits right of the menu; on a tall one, above it.
- **The title**: the logotype (STARMAN wide between two hairlines, CONTROL in a cold gradient with
  a glow and one pass of light across it), the tagline, and the menu as lit plates, each with a
  glyph, a word and a line (the line is the link's description for screen readers). Continue
  shows the power and the date of the game it continues, read from the save's envelope without
  loading the world. The foot says what is real and what is fiction. The title loads 17.9 KB;
  the scene comes after it (three.js and the sky data, shared with the map).
- **Choosing a power**: each card has its home in a picture with an *Illustration* badge, the
  leader's portrait in a frame of the power's colour with their role beneath, the emblem, the
  facts, and *Lead the …* as a lit plate in the power's colour. Pictures have written
  descriptions. On a desktop (960 px and wider) the three stand side by side and lift on hover;
  narrower, they are swiped one at a time, with a diamond for each power under them.
- **No web page left**: a boot screen in `index.html` shows the logotype and a running line
  before any script arrives, and fades once the first screen is drawn; every screen fades in; the
  loader is the console's turning ring.
- **Tests**: `tests/e2e/title.spec.ts` on the phone, tablet and desktop (the scene draws, the
  menu's lines, reduced motion and no scene left behind, Continue's line, each power's pictures,
  emblem and layout, swiping the cards).
