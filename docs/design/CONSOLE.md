# Control's console (increment 11)

**Status:** written 19 October 2026, before it was built, and built the same day (§8); part of
the visual direction ([VISUAL_DIRECTION.md](VISUAL_DIRECTION.md) §3, D-26).

**Goal.** The interface over the map becomes Control's console: a holographic command table of
light over the dark, which the fiction explains, rather than a web page's boxes and links. Every
screen keeps working exactly as it does, with every word, number and accessible name in place,
on a phone and on a desktop.

**Out of scope.** New rules or screens; illustrations for the report (they need new pictures,
and so the owner's art budget, D-23); music, which needs a composer or a licensed source (CLAUDE.md:
ask for tools).

## 1. Glass and light

- **Panels** (the desktop's outliner and inspector, the bars, the phone's sheets, the pop-overs):
  dark glass over the map, a hairline edge, and **lit corners**, the console's brackets, at two
  opposite corners. No bordered boxes.
- **Headings** inside panels: small capitals after a diamond, with a hairline running out to the
  right.
- **Lists** (ships, needs, colonies, the report): rows divided by hairlines, the row under the
  pointer or chosen lit by a bar of light down its left edge.

## 2. Lit plates

Every button is a plate of light: dark glass, a bright top edge, the word in the console's
capitals, and on the pointer or a press a brighter fill and a glow. The one thing to do next
(*End turn*, *Found a colony*, *Lead the …*) is cyan and brighter than the rest. Pressed toggles
(Flat or 3D, the open panel) are marked by a lit bar beneath. Links inside text lose their
underline and gain a chevron.

## 3. Icons

A small set of line icons in the console's vocabulary (rings, diamonds, chevrons), drawn as vector
art: the report, the empire, research, the menu, ending the turn, finding a system, the legend,
the keys, Sol, the flat and 3D views, and the resources (metals, volatiles, fusion fuel,
research). **An icon always has its word beside it**, except on a narrow desktop's top bar, where
the word is kept for screen readers and shown as a tip. The phone's bottom bar shows each icon
above its word, like a game's dock.

## 4. Motion

All of it under 300 ms except the turn, and none of it with *reduced motion*.

- Panels and pop-overs fade in and settle as they open.
- **Numbers count** to their new value when they change (the stockpile, research a turn).
- **The end of a turn** is a sweep of light across the screen with the new date in large letters
  for a moment; then the report.
- The report's **dispatches** come in one after another, each with the icon of what happened
  (a survey, a colony, a ship, a lane, a technology, an anomaly, a refusal) and a coloured edge:
  cyan for news, green for growth, amber for what needs you, red for what went wrong.

## 5. Sound

Quiet sounds for the interface, made in the browser (no sound files, nothing to licence): a soft
tick for a press, a rising tone for a turn's end, a chime for the report, a low tone for a
refusal. A new setting, **Sound: on / off**, on by default; nothing plays until the player first
touches the game (the browser's rule as well as ours). Music is not part of this.

## 6. The desktop's top bar at every width

Nothing in the top bar shrinks but the search box. Below 1760 px the resources keep their
symbols and numbers only, and below 1380 px the chips their icons only, the name of the game
makes way (the menu still leads to the title) and the resources lose what each gains a turn
(the empire and the panels show it); the words stay as the accessible names and as tips, so the
bar never overflows down to 1024 px. (M2's increment 20 added credits and food, and moved the
widths up from 1600 and 1280 px.) On a phone the bar shows each resource's symbol and number.

## 7. Tests

- Every existing journey passes unchanged (the accessible names are kept).
- The top bar fits at 1024 px; the bottom bar's buttons each have an icon and a word.
- The sound setting is kept and read like the others (unit test); with it off, nothing plays.
- Numbers reach their new value; with reduced motion at once.
- The turn's sweep appears after a turn and is gone a moment later; never with reduced motion.
- Screenshots at the ten sizes.

## 8. As built

- **The skin** is one stylesheet, `src/ui/console.css`, loaded after the map's own styles, with
  the plates, links and page sections in `style.css` and `page.css`. Lit corners are background
  layers, so they stay at a panel's corners while its contents scroll.
- **Icons** (`src/ui/icons.tsx`): 21 line drawings on a 24-unit square. On the desktop's top bar
  and the phone's dock every button has one; the report's dispatches each have the icon of what
  happened.
- **Motion:** pop-overs and needs cards fade and settle in 0.22 s, sheets fade in over 0.26 s
  (nothing that can be pressed slides as it opens, so a tap lands where it was aimed); the stockpile and
  research a turn count to new values in 0.45 s (`src/ui/count.tsx`); the turn's sweep is a band
  of light crossing the screen in 0.9 s with the new date in large letters for 1.3 s; dispatches
  come in 60 ms apart.
- **Sound** (`src/app/sound.ts`): sine and triangle tones made with Web Audio; one listener ticks
  for every press of a button, link, tab or summary; the turn's tone plays when the date moves on,
  and a low tone with a refusal. Nothing is made, not even the audio context, while the setting is
  off.
- **The top bar** fits from 1024 px up (§6), measured in the tests at 1024, 1280, 1440 and
  1920 px.
- **Links** light up instead of underlining, everywhere; links inside text gain a drawn chevron
  (not a character, so their accessible names do not change).
- **Tests:** `tests/e2e/console.spec.ts` on the phone, tablet and desktop (the top bar's widths,
  the dock's icons and words, the turn's sweep and the stockpile counting, reduced motion with no
  sweep, the sound setting kept and silent when off); a journey in `game.spec.ts` checks a
  dispatch's tone and icon; the settings unit test covers the sound setting.
