# In flight (increment 12)

**Status:** written 19 October 2026, before it was built, and built the same day (§5); part of
the visual direction ([VISUAL_DIRECTION.md](VISUAL_DIRECTION.md), D-26), chosen after increments 9
to 11.

**Goal.** Ending a turn should feel like something happened out there, not like a table being
recalculated: the player sees their ships fly the lanes they took. And the system in 3D should sit
under the same sky as the map and the title, so the three views feel like one place.

**Out of scope.** Combat, ships of other powers (M1 has none moving), sound for each ship.

## 1. Ships in flight

When a turn ends, every ship that moved from one system to another is seen flying there: a small
comet of its power's colour, with a short fading tail, running along the open lanes from where it
was to where it is now (along the route the lanes give; straight, for a blind jump's arrival),
easing out of the start and into the end, in about a second and a half. The ship's mark is already
waiting at the end, so nothing is hidden while it flies, and the turn's sweep (CONSOLE.md §4) plays
over it. Ships still on a blind jump move along their dotted line as they do now.

With *reduced motion* there is no flight: ships are simply where they are.

## 2. The sky in the system view

The system in 3D (M1_SYSTEM_VIEW.md) is drawn over the same baked Milky Way and faint stars as the
map (LIVING_MAP.md §1), turning as its camera turns, a little dimmer than on the map so the star
and its worlds stay the brightest things in view. It borrows the map's baked sky, so nothing is
drawn twice.

## 3. Power and motion

Flights draw at the full frame rate for their second and a half, then the map goes back to its
ambient rate (LIVING_MAP.md §6). The system view's sky adds one full-screen texture read and a few
thousand points a frame.

## 4. Tests

- After a turn in which a ship moved, the map reports a flight under way, and none a moment later;
  none at all with reduced motion.
- The system view draws with the sky.
- The existing journeys pass; screenshots at the ten sizes.

## 5. As built

- **Flights** (`MapView.flyShips`): the map screen keeps where each ship was when the turn began;
  when the date moves on by one turn, each ship now somewhere else flies from there to here along
  the route its power's open lanes give (`findRoute`), or straight if there is none. A comet is a
  head and six tail points, each 3% of the flight behind the one before and fainter, eased in and
  out over 1.5 s. Loading a game or going back a turn flies nothing.
- **The system view's sky** is the map's baked texture, lent through `MapView.skyTexture`, drawn at
  half strength with faint stars at 85%, so the star and its worlds stay brightest.
- **Tests:** `tests/e2e/flight.spec.ts` on the phone, tablet and desktop: a survey ship sent one
  lane flies it when the turn ends and has landed a moment later; with reduced motion nothing flies;
  the system view draws with the sky and lets it go when left.
