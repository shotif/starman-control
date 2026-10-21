# M2b · Science and rivalry

*Proposed 21 October 2026, after M2's headless games. **Decided the same day: D-44 to D-50 all as
recommended** ([DECISIONS.md, Round 5](../DECISIONS.md#round-5-science-and-rivalry-decided-21-october-2026)).
Each increment gets a detailed design section, written before it is built, as M2's did, and its
notes as built.*

## Contents

1. [What M2's games showed](#1-what-m2s-games-showed)
2. [Goals](#2-goals)
3. [Out of scope](#3-out-of-scope)
4. [Where research comes from (D-44)](#4-where-research-comes-from-d-44)
5. [Discoveries (D-45)](#5-discoveries-d-45)
6. [A deeper tree (D-46)](#6-a-deeper-tree-d-46)
7. [Forks (D-47)](#7-forks-d-47)
8. [Knowledge spreads, and rivals' science is felt (D-48)](#8-knowledge-spreads-and-rivals-science-is-felt-d-48)
9. [Great works (D-49)](#9-great-works-d-49)
10. [A score (D-50)](#10-a-score-d-50)
11. [The research screen](#11-the-research-screen)
12. [Increments](#12-increments)
13. [Tests and budgets](#13-tests-and-budgets)
14. [Art and its cost](#14-art-and-its-cost)
15. [Decisions for the owner](#15-decisions-for-the-owner)
16. [Increment 28 in detail: where research comes from](#16-increment-28-in-detail-where-research-comes-from-written-before-building-it)
17. [Increment 29 in detail: discoveries](#17-increment-29-in-detail-discoveries-written-before-building-it)

## 1. What M2's games showed

Eight headless games of 100 turns ([M2_BALANCE.md](M2_BALANCE.md)) and a closer look at three of
them:

- **Research comes only from labs**, the capital's own 3 and research institutes. The governors'
  *grow* and *produce* priorities never zone a lab, so the Frontier Cooperative and the Hollow Wake
  make **exactly 5 research a turn for all 100 turns** (the capital's 3 and its one starting lab)
  and finish about 11 technologies, one every 12 turns. Meanwhile their industry grows from 13 to
  over 100.
- **The Sol Transit Authority** runs its capital for research: labs, institutes and crash
  programmes take it from 5 a turn to about 60, and it finishes **the whole tree of 33
  technologies by about turn 90** of a game meant to last 150 to 250 turns (D-16).
- **The tree is small and flat:** three tiers (30, 60 and 100 points), 2,060 points in all. Most
  technologies add 1 to a yield; few change how the game is played; none excludes another; none
  is tied to exploring; Society has only four.
- **Rivals' science is invisible:** the standings count technologies only for your own power, and
  nothing tells you a rival has learnt something.

A player who zones no labs makes 5 research a turn too, as the Cooperative does.

## 2. Goals

- **Every power's science grows with its empire and with what it explores.** At turn 100 of the
  headless games: each rival 15 to 25 technologies; a research-led power 35 to 45; no power
  finishes the tree before turn 180.
- **Research choices that matter:** technologies that change what you can do, forks that close
  another path, and discoveries earned by playing, many of them from the real sky.
- **Rivals whose science you feel:** the Watch hears of their breakthroughs, knowledge spreads to
  those who lag, and great works are a race anyone can win.
- **Phone and desktop alike:** a research screen that holds about 60 technologies on both (D-04).

## 3. Out of scope

The Energy and Weapons field (M4, with weapons); Xenology beyond its first technology (M3, with
aliens); trading and stealing technologies (M3 and M4); a tree shuffled each game (SCOPE §4.6,
*later*); victory and defeat (SCOPE §4.17); any change to districts, food, credits or approval
beyond what research needs.

## 4. Where research comes from (D-44)

- **A. Scholars:** every colony makes research from its people: 1 for each whole 4 million
  (capital included), kept at the colony's approval as district yields are. The figure explains
  itself as "from 3 scholars".
- **B. Governors keep a lab:** *grow*, *produce* and *trade* zone a lab as every fifth district;
  *balance* and *research* already do. The rivals use governors, so they follow.
- **C. Both (recommended).** Estimated at turn 100: the Cooperative and the Wake roughly 20 to 30
  research a turn instead of 5, the Authority about 75. Tuned with `npm run balance`.

## 5. Discoveries (D-45)

- **A. Inspirations:** each technology names one thing a power does that pays 40% of its cost
  once, whether or not it is being researched. Shown on the technology before it is met, so they
  guide play. Drafts:

  | Technology | Inspired by |
  | --- | --- |
  | Habitat domes | surveying a harsh world your people could not yet settle |
  | Automated mining | founding two outposts |
  | Jump tuning | a survey ship landing from a blind jump |
  | Beacon tuning | relighting two dark lanes |
  | Deep survey | investigating an anomaly |
  | Long-baseline arrays | surveying ten systems |
  | Magnetics | surveying a catalogued flare star |
  | Soil science | a colony feeding itself from three farm districts |
  | Medicine | answering an epidemic |
  | Computing | three worked labs at one colony |
  | Fusion power | an outpost on a world with fusion fuel |
  | Colonial charters | founding three colonies |
  | Arcologies | a colony full |
  | Regional administration | a colony three jumps from the capital |

  (Every technology gets one; the detailed design lists them all.)
- **B. Observations of the real sky:** the first survey of a system holding something astronomers
  have observed gives research once, with a line saying what is real (*Observed*): a white dwarf
  (11 systems) 15, a debris disc or observed belt (8) 15, a brown dwarf (44) 10, a catalogued flare
  star (9) 10, an observed planet (46 systems) 10, a system of three or more stars (8) 10. Survey
  ships become science ships, and the real sky pays for looking at it.
- **C. Both (recommended).**

## 6. A deeper tree (D-46)

- **A. Rising costs:** each technology costs 3% more for every technology the power already
  knows.
- **B. Two more tiers:** tier 4 (160 points) and tier 5 (250 points), about 27 new technologies,
  taking the tree to about 60 (SCOPE's 60 to 90 for 1.0). The new tiers hold what changes play,
  not another +1. Drafts:

  | Field | Tier | Technology | Does |
  | --- | --- | --- | --- |
  | Propulsion | 4 | Lane relays | opens the **lane relay**: two more beacon slots where it stands |
  | Propulsion | 4 | Fast hulls | every ship +1 jump point |
  | Propulsion | 5 | Fold charts | blind jumps reach 3 ly further and take a turn less (at least one) |
  | Construction | 4 | Orbital habitats | opens the **orbital habitat**: an outpost holds 2 million people on any world |
  | Construction | 4 | Prefabrication | projects cost 20% less industry |
  | Construction | 5 | Great engineering | opens the great works (§9) |
  | Life sciences | 4 | Terraforming | opens the **terraforming station**: a world's habitability rises one step after 10 turns |
  | Life sciences | 4 | Gene tailoring | growth +25% |
  | Life sciences | 5 | Ecopoiesis | terraforming takes 5 turns, and may take a world two steps |
  | Society | 2 | Civil service | attention +1 a turn |
  | Society | 3 | Public schooling | scholars make 1 for each 3 million instead of 4 |
  | Society | 4 | Councils | approval +5 at every colony |
  | Survey | 4 | Interferometry | observations give twice the research |
  | Survey | 4 | Scanner arrays | deep-space scanners see 12 ly |
  | Xenology | 1 | Lapse studies | opened by investigating three anomalies; anomalies' rewards +50% (M3 builds on it) |

  (The detailed design completes the list, with each field's tier 4 and 5 and their costs.)
- **C. Both (recommended):** a research-led power reaches the end of the tree around turn 200.

## 7. Forks (D-47)

Three pairs of **doctrines**: taking one closes the other for the game. Each is a technology at its
tier, with the fork shown in the tree.

| Field and tier | One | The other |
| --- | --- | --- |
| Society 3 | **Open frontier:** colony ships cost 25% less; *far from home* begins a jump later | **Strong centre:** colonies within three jumps +5 approval; the capital +3 research |
| Propulsion 3 | **Lane network:** lanes cost 25% less; +1 beacon slot wherever you hold a colony | **Deep jumpers:** blind jumps reach 2 ly further; survey ships +1 jump point |
| Construction 4 | **Industrial worlds:** works +1; approval −5 at colonies with three works or more | **Garden worlds:** farms +1; growth +15% |

- **A. None.** **B. These three (recommended).** **C. A pair in every field.**
- Rivals choose by character: the Authority *Strong centre*, *Lane network*, *Industrial worlds*;
  the Cooperative *Open frontier*, *Deep jumpers*, *Garden worlds*; the Wake *Open frontier*,
  *Deep jumpers*, *Industrial worlds*.

## 8. Knowledge spreads, and rivals' science is felt (D-48)

- **A. Spreading knowledge:** a technology costs 15% less for each power you have met that already
  knows it (at most 30%): what has been done is easier to do again. It helps whoever is behind,
  the player included.
- **B. The Watch hears rumours:** when a rival you have met finishes a tier 4 or 5 technology or a
  doctrine, the Watch says so in the report ("Control, word from the lanes: the Hollow Wake has
  mastered Terraforming").
- **C. Standings show science:** each rival's research as *ahead of us*, *level* or *behind*,
  from the technologies you have heard of.
- **Recommended: all three.**

## 9. Great works (D-49)

Four unique projects; only one power in the neighbourhood can finish each. When one is finished,
the others building it lose it, and half the industry they put in returns to their colony. The
Watch reports a rival beginning one where you can see it, and every completion. All fiction.

| Great work | Opened by | Does |
| --- | --- | --- |
| The Long Array | Interferometry and Great engineering | sees every ship within 20 ly of where it stands; observations give twice the research |
| The Lapse Archive | Public schooling and Great engineering | research +20% |
| The Lanewright Foundry | Lane relays and Great engineering | lanes cost half |
| The Commons | Gene tailoring and Great engineering | approval +5 and growth +10% at every colony |

Each costs 400 industry and 40 metals. **Recommended: yes.** Rivals build one when their character
fits (the Authority the Archive, the Cooperative the Commons, the Wake the Foundry), so the race is
real.

## 10. A score (D-50)

A score in the standings: 10 for each colony, 1 for each million people, 5 for each technology, 3
for each lane, 50 for each great work; a rival's only as far as you can see. **Recommended: yes**,
with no victory yet. It gives every power's progress one number, and the headless games a measure.

## 11. The research screen

About 60 technologies need more than M2's list. **On a phone:** a tab for each field; tiers as
sections; each technology a card with its cost (rising), what it needs, its inspiration (met or
not) and its fork; one tap queues it with what it needs. **On a desktop:** the six fields as columns
and the tiers as rows, lines from each technology to what it opens, forks drawn as a split, the
queue in a side panel; keys move between technologies. Both show the research a turn with its
parts (labs, scholars, institutes, observations this turn) and when the queue will finish.

## 12. Increments

| # | Increment | What |
| --- | --- | --- |
| 28 | **Where research comes from** | scholars; every governor keeps a lab; the rivals follow; `npm run balance` measures the change |
| 29 | **Discoveries** | inspirations for every technology; observations of the real sky; the report and the Science advisor say so; state version 10 |
| 30 | **A deeper tree** | tiers 4 and 5 (about 27 technologies); rising costs; the lane relay, orbital habitat and terraforming station (9 pictures); the new research screen on phone and desktop |
| 31 | **Forks and spreading knowledge** | the three doctrine pairs; knowledge that spreads; the Watch's rumours; science in the standings |
| 32 | **Great works, the score, and the proof** | the four great works (4 pictures); the score; the headless games against §2's targets; the 100-turn journeys; the owner's try |

Each keeps the game playable, passes `npm run check` and the browser journeys, and deploys from
`main`, as M2's did. M3, *Neighbours*, follows.

## 13. Tests and budgets

Unit: scholars and labs for every priority; each inspiration and observation, once only; rising
costs and spreading knowledge; each new technology and project; doctrines closing their pair;
great works' race and refund; the score; the migration to version 10. Headless: §2's targets on
eight seeds, in the unit tests and in `npm run balance`. Browser: an observation and an inspiration
in the report; the research screen on the phone, tablet and desktop; a doctrine chosen; a great
work finished. Budgets as M2's (a turn at turn 100 within 200 ms, a save within 200 KB).

## 14. Art and its cost

The lane relay, orbital habitat and terraforming station in each power's architecture (9 pictures)
and the four great works (4, one each, in no power's architecture): 13 pictures, two candidates
each, about **$1.30**. About $1.85 of D-27's $25 is left, so this fits; M3's species and worlds will
need the budget raised.

## 15. Decisions for the owner

Answer *as recommended* to take every recommendation, or name what to change.

| ID | Question | Options | Recommendation |
| --- | --- | --- | --- |
| **D-44** | Where research comes from (§4) | A scholars · B governors keep a lab · C both | **C** |
| **D-45** | Discoveries (§5) | A inspirations · B observations of the real sky · C both | **C** |
| **D-46** | A deeper tree (§6) | A rising costs · B tiers 4 and 5 · C both | **C** |
| **D-47** | Forks (§7) | A none · B three doctrine pairs · C a pair in every field | **B** |
| **D-48** | Rivals' science (§8) | A spreading knowledge · B the Watch's rumours · C science in the standings | **all three** |
| **D-49** | Great works (§9) | yes · no | **yes**, the four drafted |
| **D-50** | A score (§10) | yes · no | **yes**, no victory yet |

## 16. Increment 28 in detail: where research comes from (written before building it)

**Goals.** D-44 as decided (C): research grows with every power's people, and every governor
keeps a lab, so no power is stuck at 5 research a turn; the rivals follow, since they govern their
colonies with the same code; `npm run balance` measures it.

**Out of scope.** The tree itself: increment 30 deepens it and makes each technology cost more
than the last, which is what keeps a research-led power from finishing early. Public schooling's
1 scholar for every 3 million (increment 30). Discoveries (increment 29).

### 16.1 Scholars

- Every colony, the capital included, has **1 scholar for each whole 4 million people**
  (`RULES.research.scholarsPer`, 40 tenths), and each makes 1 research a turn.
- Scholars are kept at the colony's approval as its districts' yields are (content all, uneasy
  90%, unrest 70%), rounded to the nearest.
- **A colony in revolt makes no research at all:** its labs and scholars are counted as lost, and
  the capital's own 3 stop too (M2 still counted them in revolt, against M2_WORLDS.md §5's
  "a colony in revolt makes nothing").
- At the start every capital holds 10 million, so 2 scholars: research 7 a turn instead of 5.

### 16.2 A lab for every governor

- Every governor, whatever its priority, zones a lab as **every fifth district** of its colony:
  when it zones open land and the colony would have fewer labs than one for every five districts
  (counting the one it is zoning), that district is a lab, if its people could work it as for
  any worked district (`RULES.governors.labEvery`). *Balance* (a lab in five) and *research* (all
  labs) already did so; *grow*, *produce* and *trade* now do.
- Its line in the report gives the reason: "Proxima Cen b's governor zoned district 5 for labs:
  every governor keeps a lab, one district in five."
- How a governor orders the work does not change: farms first, then its priority's zones, then
  the rest, a lab among them, so a lab is worked once there are people for it.
- A capital's ten districts are zoned from the start, one of them a lab, so its governor zones
  none.

### 16.3 On the screen

- **The research screen's figure:** "Research 7 a turn = 2 from labs + 2 from 2 scholars + 3 from
  the capital", with what unhappiness takes as "lost to unhappiness".
- **The colony's panel** gains a research line, as industry and credits have: "Research 7 = 2
  from 1 lab + 2 from 2 scholars + 3 from the capital". The same component on the phone and the
  desktop.
- **The governor's note** in the colony's panel adds "Every governor keeps a lab, one district in
  five."

### 16.4 The state

No change. Scholars are worked out from people and the governors' rule from districts, so the
state stays version 9 and an old save gains its scholars when it is loaded.

### 16.5 What to expect

Estimated at turn 100 of the headless games: the Cooperative and the Wake 20 to 30 research a
turn instead of 5, the Authority about 75. With the 33 technologies of M2 still the whole tree,
the Authority finishes it a little sooner than before and the others reach 20 to 30 technologies;
increment 30's rising costs and new tiers bring them to §2's targets. `npm run balance` now writes
each power's research a turn and the turn any power finished the tree.

### 16.6 Tests

Unit: scholars at the capital and a colony, kept at approval, none in revolt; the research figure's
parts; the lab as the fifth district for every priority, with its reason, and the sixth the
priority's own; the headless games' floor raised from 8 technologies to 15 for every power at turn
100. Browser: the research figure on the research screen and the capital's panel, and the turns a
technology takes, on the phone, tablet and desktop.

### Increment 28: where research comes from (21 October 2026)

- **Scholars** (`scholarsOf`, `colonyResearchOf` and `researchOf` in `src/sim/economy.ts`), as
  §16.1: 1 for every whole 4 million at every colony, kept at its approval; a colony in revolt makes
  no research, the capital's own 3 included. Every capital starts at 7 research a turn.
- **A lab for every governor** (`nextZone` in `src/sim/governor.ts`), as §16.2: the fifth district,
  the tenth and so on is a lab for every priority, with its own reason in the report (`lab`). The
  rivals' governors follow; `ai.ts` is unchanged.
- **On the screen:** the research screen's figure names the scholars, and the colony's panel has a
  research line between industry and credits, on the phone and the desktop alike.
- **Measured** (`npm run balance`, eight seeds, [M2_BALANCE.md](M2_BALANCE.md), which now has
  research a turn and when the tree was finished): research a turn at turns 25, 50 and 100 is about
  17, 22 and 70 for the Authority, 9, 18 and 41 for the Cooperative and 8, 13 and 31 for the Wake
  (M2: 5 a turn for the Cooperative and the Wake throughout). At turn 100 the Cooperative knows
  about 29 of the 33 technologies and the Wake 22 (M2: 11 each); the Authority finishes the tree
  between turns 78 and 98 (M2: about 90). The Cooperative makes more than §16.5 estimated, for it
  has the most people: about 82 million at turn 100. Increment 30's deeper tree is what brings the
  totals to §2's targets.
- **Tests:** `research.test.ts` (scholars at the capital and a colony, kept at approval, none in
  revolt; the figure's parts), `governors.test.ts` (the lab as the fifth district for every
  priority, the sixth the priority's own), `rivals.test.ts` (every power at least 15 technologies
  at turn 100); the research screen's figure and times in `game.spec.ts` and `projects.spec.ts`,
  the capital's research line in `districts.spec.ts`, on the phone, tablet and desktop.

## 17. Increment 29 in detail: discoveries (written before building it)

**Goals.** D-45 as decided (C): every technology names a deed that teaches something towards it
(an *inspiration*), and the first survey of a system holding something astronomers have observed
gives research (an *observation*), with a line saying what is real. Discoveries reward playing and
looking at the real sky; the rivals earn them by the same rules; the report and the Science
advisor say so.

**Out of scope.** Inspirations for the technologies of tiers 4 and 5 (they come with them, in
increment 30, and Lapse studies is *opened* by investigating anomalies rather than inspired);
Interferometry and the Long Array, which double observations (increments 30 and 32); anything new
on the map.

### 17.1 Inspirations

- **What they pay:** the first time a power does a technology's deed, while it has not yet
  researched that technology, it gains **40% of the technology's cost** (rounded down: 12 for a
  tier-1 technology, 24 for tier 2, 40 for tier 3) towards it, whether or not it is being
  researched. Once only for each technology and power.
- **Where the points go:** into the technology's progress, kept if it leaves the queue. If what it
  needs is known and its progress reaches its cost, it is researched at once; otherwise its
  progress stops a point short, and it is finished in its place in the tree, as an anomaly's points
  are.
- **When:** checked for every power as the turn ends, after its events, from the turn's report and
  the state as it then stands. A save from before increment 29 is checked on its first turn, so a
  deed already done then pays once.
- **The deeds**, one for each of M2's 33 technologies. "Worked" districts are those people work;
  "at one colony" means all at the same colony.

  | Field | Technology | Inspired by |
  | --- | --- | --- |
  | Propulsion | Lane engineering I | paying for a lane |
  | | Lane engineering II | paying for a lane of 7 light-years or more |
  | | Lane engineering III | paying for a lane of 9 light-years or more |
  | | Jump tuning | a survey ship landing from a blind jump |
  | | Beacon tuning | holding two relit lanes (Reborn's lanes beyond your home web) |
  | | Fusion power | an outpost on a world with fusion fuel |
  | | Lane trade | three market districts worked |
  | | Lane trade II | 200 credits in the treasury |
  | Construction | Habitat domes | surveying a harsh world |
  | | Automated mining | holding two outposts |
  | | Orbital yards | building three ships |
  | | Magnetics | surveying a catalogued flare star |
  | | Automation | five works districts worked |
  | | Deep boring | three mine districts worked |
  | | Arcologies | a colony full |
  | | Automation II | a colony making 25 industry a turn |
  | | Deep boring II | a deep mine built |
  | Life sciences | Adaptation I | a colony on a cold or frozen world |
  | | Soil science | three farm districts worked at one colony |
  | | Adaptation II | a colony on a world of low or high gravity |
  | | Closed ecologies | a colony under domes (on a harsh world) |
  | | Soil science II | making 20 food a turn |
  | | Medicine | answering an epidemic |
  | | Adaptation III | a colony on a warm or hot world |
  | Society | Colonial charters | holding three colonies besides the capital |
  | | Shared spaces | a colony less than content |
  | | Fair taxation | high taxes with every colony content |
  | | Regional administration | a colony three lane jumps from the capital |
  | Survey | Deep survey | investigating an anomaly |
  | | Long-baseline arrays | ten systems surveyed besides the capital |
  | | Computing | three labs worked at one colony |
  | | Long-range sensors | thirty systems surveyed besides the capital |
  | | Computing II | 30 research a turn |

  The words are the species' own (a world *cold* for its temperature band, *harsh* for its
  habitability), never human ones, so every species and power has the same deeds.

### 17.2 Observations of the real sky

- **What pays:** the first survey of a system, by a ship or a survey station, gives research once
  for each thing astronomers have observed there (**Observed**, from the game's sky data):

  | Observation | Systems | Research |
  | --- | --- | --- |
  | a white dwarf | 11 | 15 |
  | a debris disc or an observed belt | 8 | 15 |
  | a brown dwarf (of type L, T or Y, a subdwarf included) | 45 | 10 |
  | a catalogued flare star | 9 | 10 |
  | an observed planet (confirmed, contested or a candidate, as the archive says; Sol's eight too) | 47 | 10 |
  | a system of three or more stars | 8 | 10 |

  A system with several pays for each: Alpha Centauri (a debris disc, a flare star, planets, three
  stars) 45. The capitals are surveyed from the start and pay nothing.
- **Where the points go:** into the research queue, or with nothing queued into the first
  technology the power could research, as an anomaly's research does.
- **What it says** (each line labelled *Observed*, since it is real): "Observed at Sirius: Sirius B
  is a white dwarf, the cooling core of a star that has shed its outer layers. 15 research." Planets
  name what the archives found ("Tau Ceti e, f, g and h, all contested"); discs and belts use their
  own names ("Epsilon Eridani belts").
- **Fairness:** the home webs hold different things (outside the capitals, the Authority's 110
  research, the Cooperative's 90, the Wake's 65). That is the real sky; with about 1,350 research
  to be found across the neighbourhood, the difference is small, and the Wake's survey ships jump
  further.

### 17.3 On the screen

- **The research screen:** each technology's card says what inspires it, before it is met
  ("Inspired by holding two outposts: 12 research"), and once met ("Inspired by holding two
  outposts: +12"). Above the queue, how many have been met ("Inspirations: 5 of 33 met").
- **The report:** an *inspired* line ("An inspiration: holding two outposts taught us about
  Automated mining, 12 research towards it.") opening the research screen, and an *observed* line
  with its *Observed* badge, opening the system.
- **The Science advisor** says one of them when there is no more pressing line, in each power's
  voice.

### 17.4 The state

Version 10: each power keeps the technologies whose inspiration it has had (`inspired`). Older
saves start with none. Observations need nothing new: a system is surveyed once.

### 17.5 Tests

Unit: every technology has a deed; each deed fires once, pays 40% and finishes a technology whose
needs are known; a deed done after the technology is researched pays nothing; each observation
kind on its systems, once, nothing at the capitals; the report lines and the advisor lines; the
migration from version 9. Headless: the rivals earn inspirations and observations (each at least
five inspirations by turn 100). Browser: an observation and an inspiration in the report, and the
research screen's inspirations, on the phone, tablet and desktop.

### Increment 29: discoveries (21 October 2026)

- **Inspirations** (`src/sim/discoveries.ts`, each technology's `inspiration` in
  `src/content/techs.ts`), as §17.1: the 33 deeds of the table, checked for every power as the turn
  ends (`resolveInspirations`, after the events), each paying 40% of its technology's cost once,
  into its progress; a technology whose needs are known is finished at once when its progress
  reaches its cost.
- **Observations** (`observationsAt`, `observationWords`), as §17.2, from the sky data: 11 systems
  with a white dwarf, 8 with a disc or belt, **45** with a brown dwarf (44 of type L, T or Y, and
  CWISE 1055+5443, a subdwarf of type T, which §5 had missed), 9 with a catalogued flare star, **47**
  with an observed planet (Sol's eight, which the sky data keeps apart, as well as the archives' 46)
  and 8 of three or more stars. A first survey's points go into the queue
  as an anomaly's do; its report line is labelled *Observed*.
- **The report and the advisor:** an *inspired* line (opening the research screen) and an
  *observed* line (opening the system) with its badge; the Science advisor's lines for both in
  the three voices; the report's research picture for an inspiration as for a technology.
- **The research screen:** each technology's card names its inspiration, in amber until met and in
  green after; "Inspirations: 1 of 33 met" above the queue. The same cards on the phone and the
  desktop.
- **The state:** version 10 (`inspired`), with the migration from 9.
- **Measured** (`npm run balance`, which now counts inspirations): by turn 100 the Authority has
  had about 15 inspirations, the Cooperative 15 and the Wake 20. With discoveries, **every power
  now finishes M2's 33 technologies before turn 100** (the Authority between turns 62 and 75, the
  others between 83 and 98), for discoveries add about as many points as the whole small tree
  costs. That is expected: §17 was sized for the deeper tree of increment 30, which comes next.
- **Tests:** `discoveries.test.ts` (every technology's deed and its 40%; none done at the start
  for any power; each kind of deed, from the report and from the state; paid once, finished only
  with its needs known, nothing for a technology already researched; the observations' counts,
  points and words; a first survey only; the advisor's lines; the migration), `rivals.test.ts`
  (every power at least 5 inspirations by turn 100), and the survey and anomaly tests updated for
  observations; `discoveries.spec.ts` (Wolf 359's observation and Magnetics' inspiration in the
  report, and on the research screen) on the phone, tablet and desktop.

