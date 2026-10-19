# M1 · Ships and turns in detail (increment 4)

**Status:** written 19 October 2026, before increment 4 is built. It fills in
[M1 §2, §6 and §10](M1_FIRST_LIGHT.md) and follows them; the small rules it adds are listed under
*Made without waiting* in [DECISIONS.md](../DECISIONS.md).

**Goals.** The first playable turns: start a new game as any of the three powers, send ships along
your lanes and on blind jumps, survey what they reach, end the turn, read what happened and what
needs you. Saved every turn, so it can be closed at any time.

**Out of scope here:** colonies, outposts and building (increment 5), lane building and research
(increment 6). The capital is a system here; which planet it stands on is D-24, decided on
19 October 2026.

## 1. What each power knows

- **Charted** (every system, from turn one): the stars, the known planets and belts, the old lanes.
- **Surveyed**: every body, generated ones included. A power starts with its **capital** surveyed;
  the rest of its home web is charted only, so the first turns are spent surveying it.
- Sol's bodies are all real, so every power knows them.

## 2. Ships

| Ship | Start with | Does |
| --- | --- | --- |
| Survey ship | 2 | surveys systems; the only ship that can make blind jumps |
| Colony ship | 1 | founds a colony (increment 5) |
| Outpost ship | 1 | founds an outpost (increment 5) |

Every ship starts at the capital, with a name from one of its power's shipmakers' traditions (as in
Reborn: seabirds for Halden, trees for Toliman, predators and ash for Wake Salvage…), all original.

## 3. Moving

- **Jump points:** 2 a turn, 3 for the Hollow Wake (D-20). A lane up to 6 ly costs 1, a longer one
  2. A lane is taken only if the ship still has the points for it, so a long lane after a short
  one waits for the next turn.
- A ship goes only on **open lanes its power holds**.
- A **move** order names a destination. Each turn the ship takes the cheapest route there (fewest
  jump points, then fewest lanes, then the shortest, then by name) and stops when its points run
  out or it arrives. The preview shows the jumps and the turns before you confirm. A destination
  no open lane leads to is refused with that reason.
- **Waypoints** (desktop: Shift and a right click): a ship can hold a list of destinations and
  works through them.
- **Blind jumps:** a survey ship can jump to any star within the blind-jump reach (6 ly, raised by
  research in increment 6), with no lane, taking **one turn for every 3 ly**, rounded up. It is out
  of contact on the way and cannot be recalled.
- **Hold:** a ship told to hold stays where it is and is not counted as idle.

## 4. Surveying

A survey ship that **enters a system its power has not surveyed stops there** for the rest of the
turn and surveys it, unless its automatic survey is switched off. So a survey ship sent across the
home web surveys each system on the way, one a turn. The survey is reported with what was found:
how many worlds, and which are tolerable or better for the power's species.

## 5. The turn

Orders are plain data, the same for the player and, from M3, the AI: `move`, `blind-jump`, `stop`,
`hold`, `auto-survey`. Each is checked when it is given and refused with a reason, and takes
effect at once in what the screens show; the movement itself happens when the turn ends.

Ending the turn resolves, in this order (§2): **movement** (ships in the order they were built),
**arrivals** (blind jumps landing, surveys), then production, research and growth (later
increments), then the **report**. The date moves on a quarter. The resolution runs in a Web Worker,
so the screen never stutters, and the game is saved.

**The report** lists what happened, grouped (surveys, arrivals, ships that could not go on), each
item leading to its place. **What needs you** lists idle ships (no orders, not holding), worked out
from the state each time, never stored.

## 6. Screens, on both layouts

| | Phone | Desktop |
| --- | --- | --- |
| Title | New game · Continue · Explore · Codex, one above the other | the same, centred |
| New game | the three powers as cards, one after another: mark and colour, capital, how it plays, its trait, its shipmakers; a seed under *More*; Start | the three cards side by side |
| Top bar | date; metals, volatiles and fusion fuel; Menu (Save and leave, Codex) | date, the resources, the selection's name, **End turn** |
| Bottom bar | Report · Ships · **End turn** (with how many things need you) | — (the outliner holds them) |
| Ships | a list sheet, idle first; tap one to select it | the outliner: *Needs you*, then every ship |
| A ship | its sheet: where, what it is doing, the route; Move, Blind jump, Stop, Hold, automatic survey | the inspector |
| Moving | Move → a banner asks for a destination (Cancel) → tap a star → the route drawn on the map with "2 jumps · 1 turn" → Confirm | with the ship selected, the route follows the pointer; a right click orders it; Shift adds a waypoint |
| End turn | if anything needs you, its cards come first (Give orders or Skip, then End turn) | the button, or Enter; the *Needs you* list is always beside the map |
| The report | a sheet after each turn; each item goes to its place | a panel over the map, kept until closed |
| Keys | — | Enter: end turn · N: next idle ship · R: the report · M: move the selected ship |

On the map, ships are small chevrons beside their system, in their power's colour with a count;
a ship on a blind jump is drawn on its way. The route being planned is a bright line; a ship's
orders show as a fainter one.

## 7. Tests

Lane costs and the points a turn; route choice and its tie-breaks; refusals and their reasons;
blind-jump reach and time; surveys stopping a ship and being reported once; idle ships needing you;
the same seed and orders giving the same game (replayed from the orders); the save round trip;
journeys on a phone and a desktop: start a game as each power, move a ship, end turns, read the
report, leave and continue.
