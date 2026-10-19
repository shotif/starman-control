# M1 · First light — design

**Status:** draft 2, 19 October 2026. The owner answered the first questions (D-19, D-20, D-21 in
[../DECISIONS.md](../DECISIONS.md)) and decided that **players build the lanes**, so §3 is
redesigned around lane building; three details of it are open ([§13](#13-questions-for-the-owner)).
Everything else follows the decisions and the scope in [../SCOPE.md](../SCOPE.md).

**Goal.** The first playable Starman Control: choose a faction, chart the real neighbourhood,
build and relight lanes out from your home, survey the systems they reach, settle their planets,
and keep going for 50 turns — **on a phone and on a desktop**.

**Done when:**

1. A new game can be started as any of the three human powers, and played for 50 turns without
   the game breaking, on a phone (touch, portrait and landscape) and on a desktop (mouse and
   keyboard).
2. Every system is a real star in its real place; every known exoplanet is the real one; every
   invented body says *Fiction*.
3. Lanes can be built and relit, and where you build them shapes the game.
4. Every number on screen can explain itself.
5. The game saves every turn, loads, and moves between devices by file.
6. A scripted player plays 50 turns as each faction in CI, and the same seed and orders always give
   the same result.

**Not in M1** (later milestones): other powers and the AI (M3), money, approval and districts
(M2), combat (M4), aliens and relics (M3, M5), portraits (the art pipeline is ready; no pictures
are needed yet).

## Contents

1. [What playing M1 feels like](#1-what-playing-m1-feels-like)
2. [Time and the turn](#2-time-and-the-turn)
3. [The map and the lanes](#3-the-map-and-the-lanes)
4. [Stars and planets](#4-stars-and-planets)
5. [Factions and starts](#5-factions-and-starts)
6. [Ships and movement](#6-ships-and-movement)
7. [Colonies, outposts and output](#7-colonies-outposts-and-output)
8. [Research](#8-research)
9. [Anomalies](#9-anomalies)
10. [The interface on phone and desktop](#10-the-interface-on-phone-and-desktop)
11. [Architecture](#11-architecture)
12. [Testing, budgets and increments](#12-testing-budgets-and-increments)
13. [Questions for the owner](#13-questions-for-the-owner)

## 1. What playing M1 feels like

You choose the Frontier Cooperative. The map opens on Tau Ceti, your capital, among the real stars
around the Sun. Your home web of lanes glows in your colour; beyond it, Reborn's old lanes run dark
across the neighbourhood. The first report says what needs you: two survey ships idle, a colony
ship waiting, nothing being built or researched.

You send one survey ship along your lanes and the other on a slow blind jump towards YZ Ceti, a
red dwarf with three known planets. You set research on lane engineering, start relighting the dark
lane towards Epsilon Eridani, and end the turn. Next turn a survey completes: three planets nobody
has observed, labelled *Fiction*, one of them a cold super-Earth your people could live on under
domes, and an old beacon still sending a carrier tone. You send the colony ship, put an outpost on
the system's ice giant for the fusion fuel your lanes will need, and investigate the beacon. Twenty
turns later you have six colonies and a dozen lanes, you have chosen which stars to bind your
network through, and the report keeps telling you what changed, why, and what to do next.

## 2. Time and the turn

- **A turn is one quarter of a year** (D-16). The first turn is *Q1 2176*, some 150 years after
  Reborn (D-20).
- **Resolution order**, the same every turn:
  1. Orders are checked; invalid ones are refused with a reason before the turn ends.
  2. **Movement:** ships make their jumps (§6).
  3. **Arrivals:** surveys, investigations, colonisation and outposts complete (§6, §7, §9).
  4. **Production:** each colony's industry goes into its build queue; finished ships and
     projects appear.
  5. **Research:** points go into the current technology.
  6. **Growth:** populations grow; outposts and colonies add resources to the stockpile.
  7. **Report:** what happened, and *what needs you*.
- **Deterministic.** A game is its seed plus the orders of every turn. The same seed and orders give
  the same result on every device. All randomness comes from a seeded generator split into named
  streams (one per system for the world, one per turn for events), so adding content to one part
  never reshuffles another.

## 3. The map and the lanes

### Systems

The **207 systems** of Reborn's census (D-02), copied with their provenance: 252 stars from Gaia
DR3 and SIMBAD, the 99 known exoplanets, the 9 observed belts and debris discs, and Sol's own
planets. Positions are Sol-centred, in light-years, at epoch J2016.0; over the game's sixty years
the nearest stars move by well under a tenth of a light-year, so positions are fixed.

### Lanes are built (D-19)

Ships travel on **jump lanes**, as in Reborn. In Control, **lanes are infrastructure the powers
build**, and building them is a central strategic choice: where you can go, where you meet others,
where the chokepoints are, and which of the stars astronomers know are worth reaching.

**The fiction** (labelled as such in the game; D-19b): a lane is a pair of beacons tuned to each
other, one at each star, and a ship can only jump between tuned beacons. Beacons must be tended. In
a generation of hard times after Reborn — *the Lapse* — the powers tended only the lanes around
their homes; the rest drifted out of tune and went dark. The game opens as the powers start to
reach out again.

**Reborn's network** has 271 lanes among the 207 systems (median 5.5 ly long; three-quarters under
6.8 ly; the longest 11.7 ly). In Control it appears in two ways:

| On the map | What it is | Use |
| --- | --- | --- |
| **Open lane**, bright, in its owner's colour | a lane someone tends | its owner's ships; others from M3 with permission, a toll, or by force |
| **Dark lane**, faint and dashed | one of Reborn's old lanes, out of tune | nobody, until someone **relights** it, for half the cost and time of a new lane |
| **Lane under construction**, dotted | a lane being built or relit | — |

**At the start** (D-19a, recommended): each power holds its **home web**, Reborn's lanes within
two jumps of its capital, trimmed so that every power starts with the same number of stars in
reach (about seven: Tau Ceti's web, the smallest, has 7 systems and 6 lanes; Sol's has 13 and
Wolf 1061's 10). Every other lane of Reborn's network is dark. In M1, played alone, the other
powers' home webs are dark too.

**Building a lane** (D-19c, recommended) is a project in the build queue of a system you hold
(a colony or an outpost), aimed at any star within your **lane-building reach**:

| | New lane | Relighting a dark lane |
| --- | --- | --- |
| Reach | 6 ly at the start; *Lane engineering* I, II and III raise it to 8, 10 and 12 ly | any dark lane from a system you hold, whatever its length |
| Cost | 20 industry + 6 per ly; 1 metal and 2 fusion fuel per ly | half |
| Time | 1 turn + 1 per 3 ly, rounded up | half, rounded up |

So a new 5 ly lane costs 50 industry, 5 metals and 10 fuel, and takes 3 turns. The numbers are
starting points for balancing.

- **Beacon slots:** a star can anchor at most **3 lanes**; a *lane station*, built at a system you
  hold, raises that to 5. No star is a hub for free, and a chokepoint is something you choose.
- **Building blind:** you may build towards a star known only from astronomy — its type, its
  known planets — and find out what else is there when the lane opens. Or look first, with a
  survey ship's blind jump (§6).
- **Others' lanes (from M3; the data model carries owners from M1):** a lane belongs to its
  builder. Others may use it by treaty (open lanes), by paying a toll (the Wake's trade in Reborn),
  or by force in war; a lane can be cut by taking or destroying a beacon. Lanes left untended go
  dark again (upkeep arrives with money in M2).

What this makes the game about: choosing directions from the real sky (a Sun-like star with
known planets is worth a long lane; a lone brown dwarf may be a useful stepping stone or a
dead end); designing your own chokepoints; racing rivals to the old dark lanes; and, from M3,
access to lanes as a currency of diplomacy.

### What each faction knows

| Level | What you see | How |
| --- | --- | --- |
| **Charted** | the star (type, distance, companions), the real known planets and belts, and the dark lanes on the old charts | every system, from turn one: astronomers already know this |
| **Surveyed** | every body, including generated ones; resources; anomalies | a survey ship reaches the system, or you settle it |
| **Watched** | ships present now | your ship or colony is there (matters from M3) |

## 4. Stars and planets

### Stars

Each star's light and temperature are **estimated from its spectral type** (from a published table
of mean dwarf colours and temperatures), since the census gives types, not luminosities. The game
marks them *Estimated*. White dwarfs and brown dwarfs are included and are poor in planets.
Reborn's ten real flare stars flare: a planet of a flare star is *flare-exposed*.

### Planets: three kinds of fact

Every attribute of every body carries where it came from, shown with Reborn's badges:

| Badge | Meaning | Examples |
| --- | --- | --- |
| **Observed** | measured by astronomers, with its uncertainty | Proxima b's orbit of 11.2 days; its minimum mass of 1.06 Earths |
| **Estimated** | worked out from observed values by a stated rule | Proxima b's temperature, from its orbit and its star's estimated light |
| **Fiction** | invented by this game, from this game's seed | Proxima b's atmosphere and surface; every planet nobody has observed |

**Known planets** keep every observed value. What is unknown (surface, atmosphere, water) is
generated, consistently with what is known: a planet of 300 Earth masses is a gas giant. Contested
planets are kept and say *Astronomers dispute this planet*, as in Reborn.

**Generated bodies** fill each system according to its star (fiction, and labelled so):

| Star | Typical generated bodies |
| --- | --- |
| Red dwarf (M) | one to four small planets close in, most tidally locked; giants rare |
| Orange and yellow dwarfs (K, G) | two to seven planets of every kind; a belt is common |
| White stars (A, F) | a few planets, mostly giants and far out; belts |
| White dwarfs (D) | a belt of debris, rarely a planet |
| Brown dwarfs (L, T, Y) | none, or one or two small cold worlds |

Generated planets keep clear of the known planets' orbits, and never contradict an observation.
Giants get their largest moons as bodies of their own. Sol is entirely real.

### What a body is, for play

| Attribute | Values |
| --- | --- |
| Kind | rocky, super-Earth, mini-Neptune, ice giant, gas giant, dwarf planet, moon, belt |
| Size | 1–12 (the number of districts it will have in M2) |
| Gravity | low, normal, high |
| Temperature | frozen, cold, temperate, warm, hot, scorching (from the estimated equilibrium temperature) |
| Atmosphere | none, thin, dense, toxic |
| Water | none, ice, oceans |
| Locked | tidally locked or not |
| Flare-exposed | yes or no |
| Riches | metals, volatiles, fusion fuel: each none, poor, rich |

**Habitability** is per species, from the species' data, never hard-coded for humans (D-08):
*comfortable*, *tolerable*, *harsh* (needs habitat domes), or *uninhabitable*. It sets how many
people a planet can hold.

## 5. Factions and starts

All three human powers are playable (D-08); M1 is played alone, so the other two are absent until
M3. Every faction starts with **the same assets**; they differ in place and in traits.

| Faction | Capital (D-20) | Why there | Traits for M1 (D-20, to be balanced) |
| --- | --- | --- | --- |
| **Sol Transit Authority** | Earth, Sol | its home in Reborn | industry +10% |
| **Frontier Cooperative** | Tau Ceti (11.9 ly): a Sun-like star with a real debris disc and four reported planets that astronomers still dispute | in its Reborn core, and far enough from Sol for the powers to have room in M3 | colonies grow 20% faster |
| **Hollow Wake** | Wolf 1061 (14.1 ly): a red dwarf with three confirmed planets | Maw Roost, its best-known den in Reborn | ships make one extra jump a turn |

The capital is a developed home world whatever its planet, after generations of building. Every
faction starts with: the capital (population 10, a shipyard), one outpost in the home system, its
home web of lanes (§3), two survey ships, one colony ship, one outpost ship, the founding
technologies, and a small stockpile. The traits are sketches to be balanced in M2 and M3.

## 6. Ships and movement

| Ship | Does | Built for (industry + resources) |
| --- | --- | --- |
| **Survey ship** | surveys a system on arrival (takes the rest of the turn); investigates anomalies | 30 |
| **Outpost ship** | founds an outpost on any body; used up | 40 + 10 metals |
| **Colony ship** | founds a colony on a habitable planet; used up | 80 + 20 metals + 10 volatiles |

**Movement is counted in jumps** (D-16): ships travel only on open lanes they may use, and each
ship has **2 jump points a turn**; a lane up to 6 ly costs 1 point, a longer one costs 2. So two
short hops fit in one turn, a long lane takes the whole turn, and real distances still matter.
Ships can stop on any system on the way.

**Blind jumps:** a survey ship (and only a survey ship) can jump without a lane to any star within
the lane-building reach (§3), slowly: one turn for every 3 ly. It is how you look before you build.
Colony and outpost ships need lanes.

A **move order** names a destination; the route is planned over open lanes (or as a blind jump),
and the preview shows the jumps and the turns before you confirm. Survey ships survey automatically
when they end a turn in an unsurveyed system, unless told not to. (Jumps, lanes and beacons are
fiction, and the game says so.)

## 7. Colonies, outposts and output

- **Colonies** have a population (in units of about a million people), a capacity from the
  planet's size and the species' habitability, and grow by a logistic rule: fast while there is
  room, slowing as the planet fills. A new colony starts at 1.
- **Each unit of population** makes 1 industry and 0.5 research, before modifiers (zoning arrives
  in M2 and replaces this flat rule).
- **Outposts** have no population; each yields 1 or 2 of its body's riches a turn: metals from rocky
  worlds and belts, volatiles from ice and dwarf worlds, fusion fuel from gas giants.
- **Build queues**, one per colony and one per outpost (outposts build only lanes, slowly, from a
  small industry of their own): ships (at colonies with a shipyard), **lanes** (new or relit, §3),
  and five projects — *shipyard*, *lane station* (five beacon slots instead of three), *habitat
  domes* (lets harsh worlds be settled and raises their capacity), *mine* (more metals) and *survey
  station* (surveys the systems a lane away). Unspent industry carries over.
- **Fusion fuel and metals build lanes**, which is what gas-giant and belt outposts are for.
- **Resources** are empire-wide stockpiles: metals, volatiles, fusion fuel. Industry and research
  are not stockpiled: they are spent where and when they are made.

**Every number explains itself.** The simulation computes every figure as a total with its parts
("Industry 13 = population 10 × 1 + capital +2 + Authority +10%"), and the interface can show that
breakdown wherever the figure appears.

## 8. Research

One technology at a time, with a queue; research points from every colony go into it. Fields
appear as in [SCOPE.md §4.6](../SCOPE.md#46-research); M1 has about fourteen technologies:

| Field | Technologies in M1 |
| --- | --- |
| Propulsion | **Lane engineering I, II, III** (lane-building and blind-jump reach 8, 10 and 12 ly, from 6); **Jump tuning** (+1 jump point a turn); **Beacon tuning** (lanes 25% cheaper to build and relight) |
| Construction | **Habitat domes**; **Orbital yards** (ships 20% cheaper); **Automated mining** (outposts yield +1) |
| Life Sciences | **Adaptation I, II** (each makes one kind of world one step more habitable); **Closed ecologies** (growth +25%) |
| Society | **Colonial charters** (colony ships 25% cheaper) |
| Survey | **Deep survey** (investigations take one turn less); **Long-baseline arrays** (survey stations reach two lanes) |
| Xenology | shown, locked: *"Nothing to study yet."* |

Every technology states its exact effect.

## 9. Anomalies

About one system in six holds an **anomaly**, found by surveying it. A survey ship investigates it
over one to three turns and gets a reward: research, resources, a cheaper technology, or a fragment
of story. M1 has about twenty kinds, written in Reborn's voice and labelled fiction, drawn from the
universe: an old beacon with a carrier tone "as there has been for a very long time", a Reborn-era
hauler drifting with its cargo, an abandoned Co-op farm, a Wake cache, a survey team's buried
instruments — and two or three that hint at something no human made, the first threads of the
precursor mystery (D-13).

## 10. The interface on phone and desktop

Both layouts are designed together (D-04); this section is the M1 contract for them. Visual
language as in Reborn: dark navy glass, cut corners, cyan edges, Saira type, icons and numbers
first, colour always paired with a shape and a word.

### Screens in M1

| Screen | Contents |
| --- | --- |
| Title | New game, Continue, Saves, Settings |
| New game | the three factions as cards (place, traits, colour, makers); an optional seed |
| **Map** (home) | the stars, lanes, your systems and ships; the date; resources; *End turn* |
| System | the star (with its real data), its bodies with kind, size, habitability and badges, your assets there, actions |
| Planet | its attributes with badges; for a colony, population, output and the build queue, each figure explainable |
| Ship | type, place, orders, the route preview |
| Research | the current technology and progress, what can be researched by field, the queue |
| Turn report | what happened, grouped, each item going to its place; *what needs you* |
| Empire | every colony, outpost and ship at a glance |
| Codex | each star and planet's real data and its sources (light in M1) |
| Settings, Saves | as in Reborn: text size, reduced motion, quality; three slots, export and import |

### Two layouts

| | Phone (portrait first; landscape supported) | Desktop |
| --- | --- | --- |
| Map | full screen; **flat view by default**; pinch to zoom, drag to pan, two-finger turn in 3D | the centre of the screen; **3D by default**; orbit, zoom, pan; hover cards |
| Chrome | a top bar (date, three key resources, menu) and a bottom bar within thumb reach: *Report*, *Empire*, *Research*, *End turn* | a top bar with every resource; an **outliner** on the left (colonies and ships, idle ones first); an **inspector** on the right (the selection) |
| Selection | tapping a star opens its system as a **bottom sheet** at a third of the screen, dragged up to full | clicking a star fills the inspector; double-click centres it |
| Moving a ship | select it → *Move* → the map asks for a destination (a banner with *Cancel*) → tap a star → the route preview → *Confirm* | select it → right-click a star; the route preview follows the pointer; Shift adds a waypoint |
| Detail | a summary first; *Why?* opens the breakdown | the breakdown on hover, pinned on click |
| Lists | cards that sort and filter | tables with sortable columns |
| End turn | the button shows how many things need you; a tap shows them as a stack of cards first | the same, and **Enter** ends the turn |
| Keys | — | shortcuts for every screen and action, listed under **?** |

Rules for every screen: touch targets of at least 44 px; nothing found only by hovering; safe areas
respected; the middle of the map kept clear on a phone; text size from 100% to 150% honoured;
labels on the map thinned out by priority (yours, selected, notable, the rest) so 207 names never
pile up.

**Breakpoints:** the phone layout below 700 px wide (or below 500 px tall in landscape); the
desktop layout from 1100 px wide with a fine pointer; between them (tablets) the phone layout with
side-by-side sheets in landscape, switching to the desktop layout when a mouse or keyboard is used,
as Reborn does.

## 11. Architecture

```
src/
  sim/        the simulation: pure TypeScript, no DOM, deterministic
    rng.ts        seeded generator with named streams
    world/        systems, lanes, bodies (built from the data and the seed; never saved)
    state.ts      the game state: plain data, the only thing saved
    orders.ts     every order a player can give, and its validation
    turn.ts       resolveTurn(world, state, orders) → { state, report }
    explain.ts    figures as totals with their parts
  content/    rules as data, with guardrail tests: factions, species, ships, projects, technologies, anomalies
  data/       the astronomy dataset copied from Reborn, with its provenance and licences
  worker/     runs the simulation in a Web Worker
  render/     the three.js map (adapted from Reborn's star map)
  ui/         screens, shared components, and the phone and desktop layouts
  app/        boot, settings, saves (IndexedDB), the bridge to the worker
```

- **One API for every player.** Orders are plain data (`move`, `survey`, `investigate`, `colonise`,
  `found-outpost`, `queue`, `unqueue`, `research`); the interface sends them, and from M3 the AI
  will send the same ones. Nothing in the simulation knows which faction is the player.
- **The world is rebuilt, not saved.** Stars, lanes and generated bodies come from the dataset and
  the seed, so a save holds only what changed: small enough to export and move between devices.
- **The simulation runs in a Web Worker** from the start, so the interface never stutters at the
  end of a turn and the AI can be added in M3 without restructuring.
- **Copied from Reborn** (D-10), each file noting its source: the astronomy data, the lane network
  generator and its frozen core, the star map's projection and drawing, the save storage, the design
  tokens and fonts.
- **Saves:** an autosave every turn, three slots, export and import as a file
  (`{ format: 'starman-control-save', version, … }`), versioned and migrated, with a backup slot.
- **Offline:** after the first visit the game is kept for offline play, as Reborn is.

## 12. Testing, budgets and increments

### Tests

- **Unit:** the generator's streams; the world (207 systems, lanes identical to Reborn's, no lane
  over its limit); planet generation guardrails (every star type yields plausible bodies, generated
  orbits keep clear of known planets, the same seed gives the same planets); habitability; movement
  costs; colonisation; growth; production; research; anomalies.
- **Soak:** a scripted player plays 50 turns as each faction, headless, in CI: no errors, no
  impossible values, and replaying the same orders gives an identical state.
- **Browser journeys** (Playwright) on a phone viewport with touch and on a desktop: start a game,
  survey, settle, research, end five turns, save, reload, and find the game as it was.
- **Screenshots** of every M1 screen at Reborn's nine test sizes, from a 316 px phone at 130% zoom
  to a 1440 px desktop.

### Budgets (measured, failing the build when exceeded)

| Budget | M1 limit |
| --- | --- |
| First load, compressed | 900 KB (Reborn's is 850 KB; Control adds the planet rules) |
| Map frame time on a mid-range phone | under 16 ms |
| Ending a turn | under 200 ms on a mid-range phone |
| A save | under 200 KB |

### Increments

Each increment is deployed to the live site when CI passes.

| # | Increment | What changes on the site |
| --- | --- | --- |
| 1 | **Data and simulation core:** the dataset, the world (systems, Reborn's lane network as the catalogue of dark lanes, the home webs), the seeded generator, the state, saves | a map-less debug page listing the systems and lanes |
| 2 | **The map** on phone and desktop: real stars, lanes, the flat and 3D views, selecting a star, the system screen with real data | you can explore the real neighbourhood |
| 3 | **Planets:** generation, habitability, the planet screen with badges, the codex | every system has its worlds |
| 4 | **Ships and turns:** new game, the three factions, ships, moving on lanes, blind jumps, surveying, ending the turn, the report | the first playable turns |
| 5 | **Colonies:** colonising, outposts, growth, industry, build queues, resources, the empire screen | you can grow |
| 6 | **Lanes, research and anomalies:** building and relighting lanes, beacon slots and lane stations, lane engineering opens the map; *what needs you*; every figure explainable | the 50-turn game |
| 7 | **Proof:** saves and settings complete, the soak test, screenshots, a real phone, the budgets | M1 is done |

## 13. Questions for the owner

**Answered on 19 October 2026** ([../DECISIONS.md](../DECISIONS.md)): the start year is 2176;
the capitals are Earth, Tau Ceti and Wolf 1061; the traits stand as drafted (D-20). For the lanes
the owner chose **a fraction of Reborn's network, with players building the rest** (D-19).

**Open: the details of lane building** (needed by increment 1 for the first, increment 6 for the
others; increments 1–5 can start on the recommendations):

| # | Question | Recommendation |
| --- | --- | --- |
| D-19a | **Which of Reborn's lanes survive at the start?** (a) each power's home web, Reborn's lanes within two jumps of its capital, trimmed to the same size for all; (b) Reborn's oldest core (38 lanes among its first 32 systems), shared by everyone; (c) a random share each game | (a): a classic start, each power in its own pocket; lane building is how the powers spread and, from M3, how they meet |
| D-19b | **Why did the rest go dark?** | *The Lapse*: lanes are pairs of beacons that must be tended, and in a generation of hard times after Reborn the powers tended only their home lanes. The details of the Lapse can stay a mystery for now — perhaps even a thread of the precursor story (D-13) |
| D-19c | **How is a lane built?** (a) a project at a system you hold, aimed at a star within reach; (b) a *lane ship* that flies out, plants the far beacon and is used up | (a): simple to read and to play on a phone, and the cost and reach are where the strategy lies; (b) could come later as a way to lay lanes from a ship far from home |
