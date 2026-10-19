# M1 · Colonies in detail (increment 5)

**Status:** written 19 October 2026 before increment 5 was built, and built the same day (see
*As built* at the end). It fills in [M1 §5 and §7](M1_FIRST_LIGHT.md) and follows them; the
numbers are starting points for M2.

**Goals.** You can grow: found colonies and outposts, watch populations grow, turn industry into
ships and projects through build queues, gather metals, volatiles and fusion fuel, and see the
whole empire at a glance, on a phone and a desktop.

**Out of scope here:** lane building and research (increment 6). Habitat domes, which open harsh
worlds, are a technology, so until increment 6 colony ships settle tolerable and comfortable
worlds only.

## 1. Holdings

| | Colony | Outpost |
| --- | --- | --- |
| Where | a world its species can live on (tolerable or comfortable now; harsh with habitat domes) | any body: planet, moon, belt or giant |
| Founded by | a colony ship, used up | an outpost ship, used up |
| Has | people, a capacity, industry, a build queue | no people; it yields its body's riches |

One holding per body; a system can have several. A body can be settled only once its system is
surveyed. The colony or outpost is founded when the turn ends (§2 of the M1 design: *arrivals*).

**The capital** is a colony of 10 (units of about a million people) with room for 12, a shipyard
and a lane station, the same for every power whatever its world. The Authority's is on Earth
(D-20). Which world the Cooperative's and the Wake's capitals stand on is decision
[D-24](../DECISIONS.md#d-24--the-capital-worlds--open): until it is answered, their capital is
the capital of its system, its world not yet named, and nothing in the rules depends on which.

## 2. Each turn

- **Industry:** a colony makes 1 for each whole unit of people, the capital 2 more, and the
  Authority 10% more (rounded down). Every figure shows its parts:
  "Industry 13 = people 10 × 1 + capital 2 + Administration 10%".
- **Resources:** every holding yields its body's main riches, 2 if rich, 1 if poor: metals from
  rocky worlds, super-Earths and belts; volatiles from dwarf planets and icy moons; fusion fuel
  from giants and mini-Neptunes. The capital yields 2 metals, 1 volatiles and 1 fusion fuel
  besides, from generations of building; a mine adds 1 metals.
- **Growth:** people grow by 10% of their number times the room left (the share of capacity still
  empty), at least a tenth of a unit while there is room; the Cooperative's 20% faster. People are
  counted in tenths of a unit, so growth is whole numbers too.

## 3. Building

Each colony has a **build queue**. Its industry goes into the first item. An item is finished when
it has its industry and the stockpile holds its other costs, which are taken then; an item short
of resources waits, and the queue says so. Industry left over goes on to the next item, and with
nothing queued is kept for later (up to 60).

| Item | Industry | Also | Needs | Does |
| --- | --- | --- | --- | --- |
| Survey ship | 30 | — | a shipyard | |
| Outpost ship | 40 | 10 metals | a shipyard | |
| Colony ship | 80 | 20 metals, 10 volatiles | a shipyard | |
| Shipyard | 60 | 10 metals | | builds ships |
| Lane station | 50 | 10 metals, 10 fusion fuel | | five beacon slots instead of three |
| Mine | 30 | 5 metals | | 1 more metals a turn |
| Survey station | 40 | 5 metals | | surveys every system one open lane away, now and as lanes open |

A colony builds each project once. Habitat domes (harsh worlds settled, their room raised) join
with research in increment 6.

## 4. Orders and what needs you

New orders: `colonise` and `found-outpost` (a ship, a body in the system it is at), `queue`,
`unqueue` and `reorder` (a colony's build queue). Each is checked and refused with a reason, as
before. **What needs you** adds: a colony with a shipyard building nothing; an item waiting for
resources; a colony or outpost ship idle where it could found one (and says so).

## 5. Screens, on both layouts

| | Phone | Desktop |
| --- | --- | --- |
| Top bar | the three resources with what they gain a turn (+3) | the same, each explained on hover |
| A colony | its world's panel: people and room, growth, industry with its parts, yields, the build queue (add, remove, move up), projects | the inspector, with the queue as a table |
| A colony or outpost ship | its sheet lists the worlds here it can settle, with their habitability; one tap to found | the same in the inspector |
| Empire | **Empire** replaces Ships in the bottom bar: colonies, outposts and ships as cards | an Empire panel (P, and a button in the top bar): colonies, outposts and ships as sortable tables |
| On the map | held systems are marked as before; a colony's system label shows its people | the same |

## 6. Tests

Founding (allowed and refused, one holding per body, surveyed systems only); growth (logistic,
the Cooperative faster, never past capacity); industry with its breakdown; yields; the queue
(progress, carry-over, waiting for resources, shipyard needed, a project once); needs; scripted
50-turn games as each power that grow, replayed exactly; the empire and colony screens on a phone
and a desktop.

## As built

- **Industry** reads "Industry 13 = 10 from people + 2 from the capital + 1 from Administration
  (+10%)"; **yields** read "+4 metals, +1 volatiles, +1 fusion fuel a turn (+2 metals from Earth
  (rich); +2 metals, +1 volatiles, +1 fusion fuel from the capital)". The top bar shows each
  resource's gain a turn (+4); on a desktop, hovering it lists where it comes from.
- **A colony** opens from its system's panel (*Colonies and outposts*), from its world's panel,
  from the Empire screen, from the outliner (desktop), from what needs you, and from the report.
  Its panel shows people and room, growth, industry and yields with their parts, what is built
  there, the queue (a list with a progress bar on a phone, a table on a desktop; Remove and Up),
  and every item it could add, each with its cost and, if it cannot, why not.
- **A colony or outpost ship's** panel lists the worlds here it can settle, with their
  habitability and room (colony) or riches (outpost); one tap orders it, and *Do not found it*
  takes the order back. An unsurveyed system says to survey it first.
- **Order of a turn:** a colony founded this turn grows in the same turn; a finished survey
  station surveys from the next turn; a finished mine yields at once (§2's order of steps).
- **Keys:** P opens the Empire panel (E already turns the map); N goes through everything that
  needs you, ships and colonies alike.
- **Tests:** [colonies.test.ts](../../tests/unit/colonies.test.ts) covers §6, with a scripted player
  for 50 turns as each power (by turn 50 each has 4 to 6 colonies, an outpost and ten ships), and
  [game.spec.ts](../../tests/e2e/game.spec.ts) founds an outpost and builds a ship on a phone, a
  tablet and a desktop.
