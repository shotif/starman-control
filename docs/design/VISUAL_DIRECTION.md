# Visual direction: Control's console

**Status:** written 19 October 2026 at the owner's direction (D-26): "This game has to be visually
appealing and sexy. It should not look like a browser game … Use the internet and use other games
for inspiration. Make it visually very nice and engaging for the players." It sets the look for
the increments after M1's proof, and every screen after them.

## 1. Where we are

Increments 1 to 7 built a working game with a careful, quiet interface: Reborn's tokens and
typefaces, dark glass, cyan edges. Played today, it still reads as a web page:

- **Web furniture.** Underlined links, square bordered buttons, plain tables and lists, visible
  scrollbars, selectable text, the browser's tap highlight and context menu.
- **No depth and no motion.** Panels appear and vanish at once; numbers jump; nothing glows.
- **A flat sky.** The map is lines and dots on black: accurate, but with no light, haze or
  Milky Way, and the lanes are still.
- **No pictures and no sound.** No faction has a face or an emblem; nothing is heard.
- **A browser tab.** It runs in a tab, with the address bar showing.

## 2. What the best of the genre do

Looked at on 19 October 2026 (sources below). Inspiration is about **techniques only**: no names,
art, music or data from any other game (CLAUDE.md).

- **Endless Space 2** (Amplitude): a "pared back" interface of **thin clean lines**, generous space
  round dense data, and **a small geometric vocabulary** (hexagons, radial charts, node trees)
  reused on every screen, so varied layouts feel like one system. Its critics' warning: beauty
  must not hide information; shorthand symbols need words beside them while players learn.
- **Stellaris** (Paradox): the art vision asks for **high contrast and strong colours** on a dark
  ground; nebulae and system effects are particles (flat planes), cheap and atmospheric.
- **Dead Space** and **Star Citizen**: the interface is **diegetic**, a hologram the fiction
  explains, so any interface is allowed as long as it is holographic, and it must still navigate
  well.
- **Space menus** (SpaceEngine, Galactic Civilizations IV): the title is **a live 3D scene**, not a
  picture; players should be "wowed" by the first screen.
- **Sins of a Solar Empire II**: replaced generated portraits with human-drawn ones after players
  objected, and was criticised for generic icons. Generated art here stays reviewed, recorded and
  disclosed (D-09, D-23), and icons say what they mean.
- **Bloom** done with restraint: heavy bloom looks worse than none; each full-screen pass costs
  milliseconds on a phone, so effects are chosen and scaled by quality.

## 3. The idea: Control's console

You are **Control** (D-11), the voice the starmen answer to. The interface is Control's console:
**a holographic command table** of light over the dark, which the fiction explains, so it can be
luminous and animated without pretending to be a web page.

| Principle | In practice |
| --- | --- |
| **Light, not boxes** | Panels are dark glass with hairline edges that glow at their corners; no bordered boxes, no underlines. Actions are lit plates with a glyph and a word. |
| **One vocabulary** | Corner brackets, hairlines, diamonds for resources, rings for places, chevrons for ships; no hexagons, which are another game's signature. Reused everywhere. |
| **Contrast and colour** | Deep navy-black ground; cyan for Control; amber for what needs you and for routes; each power's colour and shape (never colour alone). |
| **Motion with meaning** | Panels slide and settle (200–300 ms); numbers count; lanes pulse in their direction of use; a turn ends with a sweep. All off with *reduced motion*. |
| **The real sky, beautiful** | The Milky Way across the background in its true place on the sky; stars with glow; light that blooms a little. Fiction stays labelled. |
| **Faces and places** | Each power has an emblem and a picture; events have illustrations; all made by the art pipeline (D-23) and badged as illustrations. |
| **An app, not a tab** | Installable, full screen, offline; no selection, no tap highlight, no browser menus; a loading screen in the game's own look. |
| **Readable first** | Every number still explains itself; words beside every symbol; 44 px targets on a phone; text size setting honoured. |

## 4. The increments

| # | Increment | What changes |
| --- | --- | --- |
| 8 | **Proof** (M1's last) | settings (text size, reduced motion, quality), the saves screen, installable and offline, the budgets, nine screenshot sizes ([M1_PROOF.md](M1_PROOF.md)) |
| 9 | **First impression** (built: [FIRST_IMPRESSION.md](FIRST_IMPRESSION.md)) | the title as a live 3D scene of the neighbourhood under the Milky Way, slowly turning; the logotype; the new-game screen with each power's emblem and picture; the app's own loading screen; no web furniture anywhere |
| 10 | **The living map** (built: [LIVING_MAP.md](LIVING_MAP.md)) | the Milky Way backdrop on the map; bloom (by quality); stars with glow; lanes that pulse; each power's territory as a soft field of its colour; animated selection; a glide into a system when it is entered |
| 11 | **Control's console** (built: [CONSOLE.md](CONSOLE.md)) | the interface skin: glass panels with lit corners, an icon set, buttons as lit plates, motion for panels and numbers, the end of a turn as a sweep and the report as illustrated dispatches, and sound for the interface |

Each is designed for the phone and the desktop together (D-04), deployed, and tested as before.

## Sources

- Endless Space 2 interface: [HUDS+GUIS](https://www.hudsandguis.com/home/2017/7/6/endless-space-2);
  reviews: [PC Gamer](https://pcgamer.com/endless-space-2-review),
  [PCWorld](https://www.pcworld.com/article/406919/endless-space-2-review-mood-meets-4x-strategy.html),
  [Destructoid](https://www.destructoid.com/reviews/review-endless-space-2/)
- Stellaris art: [Dev Diary 2, art vision](https://www.moddb.com/games/stellaris/features/dev-diary-2-art-vision),
  [Dev Diary 203, VFX](https://admin-forum.paradoxplaza.com/forum/developer-diary/stellaris-dev-diary-203-vfx-in-nemesis.1460183)
- Diegetic interfaces: [Wayline](https://www.wayline.io/blog/diegetic-interfaces-game-design),
  [Star Citizen UI](https://www.hudsandguis.com/home/star-citizen-revisited-part-1)
- Menus as scenes: [SpaceEngine](https://spaceengine.org/news/blog181008/),
  [Factorio forum](https://forums.factorio.com/viewtopic.php?p=702796)
- Sins of a Solar Empire II's interface update:
  [PCGamesN](https://pcgamesn.com/sins-of-a-solar-empire-2/update-ui-horizons)
- Post-processing cost and restraint:
  [three.js post-processing notes](https://svilenkovic.com/3d/three-js-postprocessing)
