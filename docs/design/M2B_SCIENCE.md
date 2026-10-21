# M2b · Science and rivalry

*Proposed 21 October 2026, after M2's headless games. **Decided the same day: D-44 to D-50 all as
recommended** ([DECISIONS.md, Round 5](../DECISIONS.md#round-5-science-and-rivalry-decided-21-october-2026)).
Each increment has a detailed design section, written before it was built, and its notes as built.
**Built the same day, increments 28 to 32: M2b is complete** and waits for the owner's try (§20.4).*

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
18. [Increment 30 in detail: a deeper tree](#18-increment-30-in-detail-a-deeper-tree-written-before-building-it)
19. [Increment 31 in detail: forks and spreading knowledge](#19-increment-31-in-detail-forks-and-spreading-knowledge-written-before-building-it)
20. [Increment 32 in detail: great works, the score, and the proof](#20-increment-32-in-detail-great-works-the-score-and-the-proof-written-before-building-it)

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


## 18. Increment 30 in detail: a deeper tree (written before building it)

**Goals.** D-46 as decided (C): every technology costs more for each one a power already knows, and
two new tiers whose technologies change how the game is played, taking the tree from 33
technologies to 54 here (about 60 with increment 31's doctrines and increment 32's Great
engineering); the three new projects of §6 in each power's architecture; a research screen for
that many technologies on the phone and the desktop (§11); the rivals research and build by the
same rules. Measured against §2's targets at turn 100.

**Out of scope.** The doctrines (increment 31) and their forks drawn in the tree; Great
engineering and the great works (increment 32); knowledge that spreads (increment 31).

### 18.1 Rising costs

- A technology costs its base cost plus **8% of it for every technology the power already
  knows**, rounded down (`RULES.research.risePercent`; §6 drafted 3%, tuned with the headless
  games to 7% in increment 30 and 8% in increment 32, see the notes as built): Lane engineering I
  costs 30 for a power that knows nothing, 54 for one that knows ten, 102 for one that knows
  thirty.
- The cost is worked out when it is needed: on the cards, in the queue's times, when points are
  spent, and for an inspiration's 40% and an anomaly's progress. Progress already made is kept as
  points; since costs only rise, it never passes a cost.

### 18.2 Twenty-one new technologies

Tier 4 costs 240 points before the rise, tier 5 480 (§6 drafted 160 and 250; tuned). Each has
its inspiration, as §17.1's.

| Field | Tier | Technology | Needs | Does | Inspired by |
| --- | --- | --- | --- | --- | --- |
| Propulsion | 4 | **Lane relays** | Lane engineering III | Opens the **lane relay**: two more beacon slots in its system. | holding twelve lanes |
| | 4 | **Fast hulls** | Jump tuning, Lane engineering III | Every ship makes 1 more jump point a turn. | building ten ships |
| | 5 | **Fold charts** | Fast hulls | Blind jumps reach 3 ly further and take a turn less (at least one). | a blind jump of 9 ly or more |
| | 5 | **Lane weaving** | Lane relays | Lanes are tuned in half the turns, rounded up. | holding twenty lanes |
| Construction | 4 | **Orbital habitats** | Arcologies | Opens the **orbital habitat**: an outpost becomes a colony in orbit, with room for 2 million. | holding six outposts |
| | 4 | **Prefabrication** | Automation II | Projects cost 20% less industry. | twelve projects standing |
| | 5 | **Mass drivers** | Deep boring II | Outposts yield twice their world's riches. | holding ten outposts |
| Life sciences | 4 | **Terraforming** | Adaptation III | Opens the **terraforming station**: its world becomes one step more habitable after 10 turns. | a colony under domes full |
| | 4 | **Gene tailoring** | Medicine, Closed ecologies | Colonies grow 25% faster. | a medical centre built |
| | 5 | **Ecopoiesis** | Terraforming | Terraforming takes 5 turns a step, and goes on to a second step. | a world terraformed |
| | 5 | **Cryosleep** | Gene tailoring | Colony ships carry 2 million settlers. | holding eight colonies besides the capital |
| Society | 2 | **Civil service** | Colonial charters | Attention +1 a turn. | an edict in force |
| | 3 | **Public schooling** | Civil service, Shared spaces | Scholars: 1 for every 3 million instead of 4. | a colony of 12 million |
| | 4 | **Councils** | Public schooling | Approval +5 at every colony. | a colony in unrest |
| | 4 | **Free press** | Civil service, Fair taxation | Edicts cost 1 attention less (at least 1). | two edicts in force at once |
| | 5 | **Federation** | Councils, Regional administration | Being far from home costs no approval (no lane to the capital still does). | a colony six lane jumps from the capital |
| Survey | 4 | **Interferometry** | Long-baseline arrays, Computing II | Observations give twice the research. | ten observed systems surveyed |
| | 4 | **Scanner arrays** | Long-range sensors | Deep-space scanners see 12 ly instead of 8. | a deep-space scanner built |
| | 5 | **Thinking machines** | Computing II | Research +10%. | 60 research a turn |
| | 5 | **Deep-sky survey** | Interferometry, Long-range sensors | Survey stations survey every system three open lanes away. | sixty systems surveyed besides the capital |
| Xenology | 1 | **Lapse studies** (60) | three anomalies investigated | Anomalies' rewards +50%. | five anomalies investigated |

Fifteen are §6's drafts; Lane weaving, Mass drivers, Cryosleep, Free press, Federation, Thinking
machines and Deep-sky survey complete the tiers, as §6 left to this design, each changing what a
power can do rather than adding one to a yield. Lapse studies is the first technology opened by a
deed rather than another technology: it cannot be queued until three anomalies have been
investigated, and says so. In all the tree's base costs come to 8,520 points (M2: 2,060), and with
the rise about 30,000 for a power that learns all 54.

### 18.3 The three projects

| Project | Opened by | Where | Cost | Upkeep | Does |
| --- | --- | --- | --- | --- | --- |
| **Lane relay** | Lane relays | a colony or an outpost | 80 industry, 10 metals, 10 fuel | 1 | two more beacon slots in its system |
| **Orbital habitat** | Orbital habitats | an outpost | 100 industry, 20 metals, 10 volatiles | 2 | the outpost becomes a colony in orbit |
| **Terraforming station** | Terraforming | a colony on a world harsh or tolerable for its people | 120 industry, 10 metals, 20 volatiles | 2 | its world one step more habitable after 10 turns |

- **Outposts' queues** now hold these projects as well as lanes: the lane relay and the orbital
  habitat. Their own 2 industry a turn builds them slowly; overdrive is for colonies.
- **An orbital habitat** finished at an outpost makes it a colony of 1 million founders, as a
  colony ship would, on whatever world it stands: its districts are the habitat's 2, zoned as a
  new colony's are (farms and works, D-42), plus its world's own if its people could live there;
  its room is 2 million plus its world's own; it keeps gathering its world's riches as the outpost
  did. Life in orbit costs approval as life under domes does (−5), and its farms yield as under
  glass (1). It counts as a colony from then on, for food, approval, governors and the score.
- **A terraforming station** counts the turns it has worked (`terraform`, kept on the colony):
  after 10 its world is one step more habitable for the colony's people (harsh to tolerable,
  tolerable to comfortable), with all that follows: room, farms, no more *life under domes*, and
  the colony view's open sky. With Ecopoiesis a step takes 5 turns and a second step follows. A
  colony in revolt does not count the turn. The report says when a step is done.

### 18.4 Rivals

- **Research:** the cheapest technology they can queue with what it needs, by base price, their
  own fields at half the price (before, every technology of their own fields came first, which in
  a deep tree kept them from the first steps of the others); Lapse studies once it is open.
- **The Authority, research-led,** runs its colonies for research as well as its capital.
- **Projects:** governors build a terraforming station where it can work (*grow* and *balance*
  list it after their own); a rival's idle outpost with no lane to queue builds an orbital habitat
  when it knows how and its treasury holds 60 credits and gains each turn, one at a time.

### 18.5 The research screen (§11)

- **Both:** the research a turn with its parts; the queue with each technology's turns and when
  the whole queue will be done; each card with its cost now (rising), what it needs, its
  inspiration and its state; one tap or click queues a technology with what it needs.
- **On a phone** (and a tablet in portrait): a tab for each field across the top (Propulsion,
  Construction, Life Sciences, Society, Survey, Xenology), with how many of its technologies are
  known; the field's tiers as sections; the queue above the tabs.
- **On a desktop:** the six fields as columns and the five tiers as rows, with lines from each
  technology to what it opens; the queue in a panel beside the tree, always in view. The arrow keys
  move between technologies (left and right across fields, up and down through tiers), *Enter*
  queues the one in focus, *Shift+Enter* researches it now, *Delete* takes it out of the queue.

### 18.6 The state

Version 11: each colony's terraforming turns (`terraform`, 0 without a station). Older saves: 0.

### 18.7 Art

The lane relay, the orbital habitat and the terraforming station in each power's architecture: 9
pictures, two candidates each, about **$0.90**, with a lettered contact sheet to the owner. They
stand in the colony view as every project does.

### 18.8 Tests

Unit: rising costs, in the queue's times, spending, inspirations and anomalies; every new
technology's effect; Lapse studies' requirement; each project, its place and refusal; the orbital
habitat's colony; terraforming's steps with and without Ecopoiesis, and none in revolt; the
rivals' choices; the migration to version 11. Headless: §2's targets at turn 100 on eight seeds,
reported by `npm run balance`. Browser: the research screen's tabs on the phone and tablet and its
grid, side queue and keys on the desktop; a new project queued at an outpost.

### Increment 30: a deeper tree (21 October 2026)

- **Rising costs** (`techCost` in `src/sim/research.ts`): 7% of a technology's base for every one
  known, in the cards, the queue (each queued technology at what it will cost when its turn
  comes), spending, inspirations, anomalies and the checks of a save.
- **Twenty-one technologies** (`src/content/techs.ts`) as §18.2's table, with tiers 4 and 5 at 240
  and 480 before the rise, each effect where its rule lives: Fast hulls' jump point, Fold charts'
  blind jumps (`movement.ts`), Lane weaving's tuning (`lanes.ts`), Prefabrication's projects and
  Mass drivers' riches (`economy.ts`), Gene tailoring's growth, Cryosleep's settlers and Civil
  service's attention (`turn.ts`), Public schooling's scholars, Councils' approval and
  Federation's distance (`economy.ts`), Free press's edicts (`edictCost`), Interferometry's
  observations (`discoveries.ts`), Scanner arrays' reach (`visibility.ts`), Thinking machines'
  research (`researchOf`), Deep-sky survey's stations, and Lapse studies' anomalies
  (`anomalies.ts`), which needs three anomalies investigated before it can be queued and is
  inspired by five (§17 had left it without an inspiration).
- **The three projects** (`src/content/projects.ts`, `where` saying where each may stand): the lane
  relay's two beacon slots (`beaconSlots`), the orbital habitat making its outpost a colony in
  orbit with its 2 districts and 2 million of room, keeping its world's riches, with *life in
  orbit* costing approval as domes do; the terraforming station counting its turns
  (`Holding.terraform`, `levelOf`, `terraformSteps`, `terraformNext`), its world's level raised
  everywhere a level is read (room, farms, approval, the colony view's open sky), and a report
  line when a step is done. Outposts' panels offer *Add to the queue* with what an outpost may
  build. Nine pictures, one for each power (about $0.90).
- **Rivals:** by base price with what each technology needs, their own fields at half; the
  Authority's colonies run for research; *grow* and *balance* governors build terraforming
  stations; an idle outpost with no lane to build raises an orbital habitat when the treasury
  holds 60 and gains.
- **The research screen** (`src/ui/map/research.tsx`): on a phone and a tablet the queue, then a
  tab for each field with how many of its technologies are known, its tiers as sections; on a
  desktop the overlay spans the screen, the tree on the left and the queue in a panel beside it,
  the arrow keys moving between technologies, *Enter*, *Shift+Enter* and *Delete* acting on the one
  in focus (and never reaching the map's keys, so *Enter* there never ends the turn). Each queued
  technology can be taken out from the queue itself; with two or more queued, the screen says when
  the whole queue will be done.
- **The state:** version 11 (`terraform`), with the migration from 10.
- **Tuned** with the headless games (a tuning script run over eight seeds and 100 to 200 turns):
  at §6's 3% and 160/250, every power had 27 to 37 technologies at turn 100 and the Authority
  finished the tree by about turn 150; rivals that put every technology of their own fields first
  also missed the first steps of the others (the Authority, with only survey and propulsion,
  never learnt Habitat domes and stopped settling). With the numbers above, `npm run balance`
  gives at turn 100 the Authority about **37 technologies** (35 to 41 by seed), the Cooperative
  **23** and the Wake **22** (§2: 35–45 and 15–25); in 200-turn runs the Authority finished the 54
  between turns 169 and 196, before increments 31 and 32 add four more technologies.
- **Tests:** `tree.test.ts` (rising costs in the queue and in spending; every new technology's
  effect; Lapse studies' requirement and its +50%; each project's place and refusal, the relay's
  slots, the habitat's colony, terraforming's steps with Ecopoiesis; the rivals' research by price
  and their habitats; the migration), with the tree's and projects' counts updated elsewhere;
  `tree.spec.ts` (the phone's and tablet's tabs, Lapse studies' requirement, a tier-4 technology
  queued with what it needs at its rising cost; the desktop's grid, side queue and keys) and an
  outpost's lane relay and orbital habitat in `game.spec.ts`, on the phone, tablet and desktop.


## 19. Increment 31 in detail: forks and spreading knowledge (written before building it)

**Goals.** D-47 as decided (B): three pairs of doctrines, each closing the other for the game. D-48
as decided, all three: a technology costs less for each power you have met that knows it; the
Watch hears of the great steps of the rivals you have met; the standings say whose science is
ahead. The rivals choose their doctrines by character.

**Out of scope.** Trading or stealing technologies (M3, M4); a doctrine in every field (D-47 C,
not chosen); changing a doctrine once taken.

### 19.1 Doctrines

| Field and tier | Needs | One | The other |
| --- | --- | --- | --- |
| Society 3 (100) | Regional administration | **Open frontier:** colony ships cost 25% less; *far from home* begins a jump later | **Strong centre:** +5 approval at colonies within three lane jumps of the capital; the capital +3 research |
| Propulsion 3 (100) | Lane engineering II | **Lane network:** lanes cost 25% less; +1 beacon slot in every system where you hold a colony | **Deep jumpers:** blind jumps reach 2 ly further; survey ships +1 jump point |
| Construction 4 (240) | Automation II | **Industrial worlds:** each works district +1 industry; −5 approval at colonies with three works or more | **Garden worlds:** each farm district +1 food; colonies grow 15% faster |

- **A fork:** a doctrine is a technology at its tier, in the tree beside its pair. Once one is
  researched, the other is **closed** for the game: it cannot be queued, and if it was queued it
  leaves the queue (with anything after it that needs it), its progress lost. Until then both can
  be queued; whichever is finished first closes the other.
- **Inspirations:** Open frontier by a colony five lane jumps from the capital; Strong centre by
  four colonies besides the capital; Lane network by holding eight lanes; Deep jumpers by a blind
  jump of 7 ly or more; Industrial worlds by ten works districts worked; Garden worlds by ten farm
  districts worked. A closed doctrine inspires nothing.
- **On the screen:** a doctrine's card says so ("A doctrine: it closes Strong centre for the
  game"), and a closed one says why ("Closed: you chose Open frontier"). On the desktop each pair
  stands side by side in its cell with *or* between them, the fork drawn as a split from what both
  need; on a phone the pair is one card each with *or* between them.
- **Rivals** choose by character: the Authority *Strong centre*, *Lane network* and *Industrial
  worlds*; the Cooperative *Open frontier*, *Deep jumpers* and *Garden worlds*; the Wake *Open
  frontier*, *Deep jumpers* and *Industrial worlds*. They never queue the other.

### 19.2 Knowledge spreads

- A technology costs **15% less for each power you have met that already knows it, at most 30%**
  (`RULES.research.spreadPercent`, `spreadMost`), after the rise of §18.1: what has been done is
  easier to do again. It helps whoever is behind, the player included, and every rival by the same
  rule.
- **Met:** a power you can see something of: a colony or outpost of theirs in a system you have
  surveyed, or a lane of theirs with an end in one (as the standings count them, §26.5).
- Since a cost can now fall, progress may come to exceed it; the technology is then finished with
  the next research spent. A save's checks compare progress with the cost before the discount.
- **On the screen:** a card whose cost is lowered says by whom ("Known to the Hollow Wake: −15%").

### 19.3 The Watch's rumours

When a rival you have met finishes a technology of tier 4 or 5, or a doctrine, the Watch says so in
the report ("The Watch: word from the lanes is that the Hollow Wake has mastered Terraforming."),
and its advisor speaks of it in each power's voice. It points to the research screen.

### 19.4 Science in the standings

The empire's *Powers* tab gains a **Science** column: yours as how many technologies you know; each
rival in the standings (seen, §26.5) as **ahead of us**, **level** or **behind**: ahead with three or more
technologies more than yours, behind with three or more fewer, as the Watch hears them.

### 19.5 The state

No change: a closed doctrine follows from what is researched, met powers from what is seen, and
rumours are report lines. The state stays version 11.

### 19.6 Tests

Unit: each doctrine's effects; a doctrine closing its pair, in the queue and for queueing; their
inspirations; spreading knowledge's 15% and 30%, for met powers only, and progress beyond a fallen
cost; rumours only of met rivals and only of tier 4, 5 and doctrines; the standings' science; the
rivals' doctrines by character. Headless: §2's targets. Browser: a doctrine chosen and its pair
closed, on the phone, tablet and desktop; the standings' science column.

### Increment 31: forks and spreading knowledge (21 October 2026)

- **Doctrines** (the six in `src/content/techs.ts`, each with its `fork` and a second effect in
  `also`), as §19.1: `learn` in `src/sim/research.ts` researches a technology and closes its
  pair, taking it out of the queue with what needs it and dropping its progress; a closed
  doctrine is refused ("Strong centre is closed: you chose Open frontier."), never offered to
  `canResearch`, never inspired, and a save holding both of a pair, or queueing a closed one, is
  refused. Strong centre's approval and research, Industrial worlds' unrest and Lane network's
  slot are read in `economy.ts` and `beaconSlots`; the rest use the effects that already were.
- **Knowledge spreads** (`techCost`, `hasMet`, `knownBy`): 15% less for each met power that knows
  a technology, at most 30%, after the rise; a progress past a fallen cost is finished with the
  next research spent, and a save's checks compare progress with the cost before the discount.
  The card says who knows it ("Known to the Hollow Wake: −15%").
- **Rumours** (`watchNews`): a met rival's technology of tier 4 or 5 or doctrine, as a Watch line in
  the report that opens the research screen, and the Watch advisor's line in each voice.
- **Standings:** a *Science* column: yours as "N known", each rival in the standings as *ahead of
  us*, *level* or *behind*, three technologies being the gap (`RULES.research.standingsGap`).
- **On the screen:** a doctrine's card says what it closes; a closed one is dimmed, says why and
  has no buttons; each pair stands side by side with *or* between, on the desktop's grid and in the
  phone's tabs.
- **Rivals** choose their doctrines by character (`PERSONALITIES[…].doctrines`) and never queue the
  other.
- **A test hook:** with `?test`, `window.__setGame(state)` puts a game some way on into play, so a
  journey need not play thirty turns to reach a doctrine.
- **Measured** (`npm run balance`, which now counts a power's tree as finished when it has learnt
  the 57 it can): at turn 100 the Authority knows about **38.5** technologies (37 to 41), the
  Cooperative **22.8** (20 to 25) and the Wake **23** (21 to 27); in 200-turn runs the Authority
  had learnt all 57 between turns 172 and 200.
- **Tests:** `doctrines.test.ts` (the pairs; closing in the queue, by inspiration and for
  queueing; each doctrine's effects; the rivals' choices; spreading for met powers only, its 30%
  and progress past a fallen cost; rumours of met rivals' great steps only; the standings'
  science; 120 turns with no power holding both of a pair); `doctrines.spec.ts` (a doctrine
  finished closing its pair) and the standings' science in `rivals.spec.ts`, on the phone, tablet
  and desktop.


## 20. Increment 32 in detail: great works, the score, and the proof (written before building it)

**Goals.** D-49 as decided: four great works, each finished by one power only, a race the Watch
follows. D-50 as decided: a score in the standings, with no victory yet. The proof: the headless
games against §2's targets on eight seeds, the 100-turn journeys, and the owner's try.

**Out of scope.** Victory and defeat (SCOPE §4.17, D-14); great works beyond the four; wonders'
upkeep wars or sabotage (M4).

### 20.1 Great engineering

Construction, tier 5 (480 before the rise), needs Prefabrication: opens the great works. Inspired
by twenty projects standing.

### 20.2 The four great works (all fiction)

| Great work | Needs, with Great engineering | Does, for the power that holds it |
| --- | --- | --- |
| **The Long Array** | Interferometry | sees every ship within 20 ly of where it stands; observations give twice the research |
| **The Lapse Archive** | Public schooling | research +20% |
| **The Lanewright Foundry** | Lane relays | lanes cost half |
| **The Commons** | Gene tailoring | approval +5 and growth +10% at every colony |

- Each costs **400 industry and 40 metals**, upkeep 3, at a colony; one of each in the whole
  neighbourhood. A power may build several, each at one colony at a time.
- **The race:** when one power finishes a great work, every other colony building it loses it from
  its queue; one that was building it first keeps **half its industry** (the rest is lost with the
  work). The report says so.
- **The Watch** says when a rival it can see (a colony in a system you have surveyed) begins one,
  and when anyone finishes one, wherever it stands: great works are famous.
- **Refusals:** "The Lapse Archive stands already, the Hollow Wake's." "The Lapse Archive is being
  built at Tau Ceti e."
- **Rivals** build theirs when they can: the Authority the Lapse Archive, the Cooperative the
  Commons, the Wake the Lanewright Foundry, each at its capital, queued after what the capital's
  governor has queued; they give up nothing to build it.
- **On the screen:** each stands in the colony view as one building, in no power's architecture
  (4 pictures, about $0.40, a lettered sheet to the owner); the colony's panel and *Add to the
  queue* say what each does and who holds it.

### 20.3 The score (D-50)

- **10** for each colony, **1** for each million people, **5** for each technology, **3** for
  each lane (open or being tuned), **50** for each great work (`RULES.score`).
- **In the standings:** a *Score* column. Yours in full; a rival's as far as you can see it: its
  colonies, people and lanes that you see, its great works (known to all), and its technologies
  once you have met it (the Watch hears them). No victory comes of it yet.
- **In the headless games:** `npm run balance` writes each power's full score.

### 20.4 The proof

- **Headless:** §2's targets on the eight seeds of `npm run balance`: at turn 100 each rival 15 to
  25 technologies and a research-led power 35 to 45; no power learns every technology it can
  before turn 180 (checked with 200-turn runs, reported in the notes as built). The three seeds in
  the unit tests check the turn-100 ranges.
- **Browser:** the 100-turn journeys on the phone and the desktop (CI, last); a great work
  finished and a rival's lost; the standings' score; the turn at turn 100 within its budget.
- **The owner's try:** play M2b on a phone and a desktop and say what is dull, unclear, slow or
  too easy, as M2's try asked.

### 20.5 The state

No change: great works are projects; the score is worked out. The state stays version 11.

### 20.6 Tests

Unit: Great engineering and each great work's needs; one in the neighbourhood, one at a time per
power; the race and the half returned; each work's effect; the Watch's lines; rivals building
theirs; the score, in full and as seen. Headless: as §20.4. Browser: as §20.4.

### Increment 32: great works, the score, and the proof (21 October 2026)

- **Great engineering** and the **four great works** (`GREAT_WORKS` in `src/content/projects.ts`,
  each with `great.needs`), as §20.1 and §20.2: one in the whole neighbourhood, one colony of a
  power building each at a time; the turn's production finishes one for its builder and takes it
  out of every other queue, a colony that was building it keeping half its industry
  (`great-work-lost`); every other power hears of it (`great-work`), and the Watch sees a rival
  begin one where it can see (`great-work-begun`). A colony holding a great work is seen by every
  power, as a great work is famous. Their effects: the Long Array's 20 ly of sight
  (`watchedSystems`) and its doubled observations, the Lapse Archive's +20% research, the
  Lanewright Foundry's halved lanes, the Commons' approval and growth (`holdsGreatWork`). A great
  work is named with *the* everywhere (`projectWords`): "Earth has finished the Lapse Archive: a
  great work, the only one in the neighbourhood."
- **Rivals** build theirs at the capital when they can (`PERSONALITIES[…].greatWork`).
- **The score** (`src/sim/score.ts`), as §20.3: in the standings (a *Score* column, a rival's as far
  as it is seen) and in `npm run balance`.
- **Pictures:** the four great works, one each in no power's architecture (about $0.40; $24.45 of
  $35 spent in all).
- **Tuned for the proof:** each technology now costs **8%** more for every one known (7% in
  increment 30). `npm run balance` at turn 100 on its eight seeds: the Authority **37.4**
  technologies (35 to 39 by seed), the Cooperative **21.5** (19 to 24) and the Wake **22.0** (20 to
  24): §2's targets on every seed. In 200-turn runs of the same seeds the Authority learnt all 58
  it can on turns 181, 186 and 187 in three games and had not finished by turn 200 in the other
  five; no rival came near. The headless unit tests check the turn-100 ranges on seeds 42, 7 and
  2176.
- **Tests:** `greatworks.test.ts` (the four and their needs; one in the neighbourhood and one
  building at a time; the race and the half kept; the Watch; each effect; fame; the rivals' great
  works; the score in full and as seen), `rivals.test.ts` (§2's targets), and
  `greatworks.spec.ts` (a great work finished, its refusals, the standings' score) on the phone,
  tablet and desktop; the 100-turn journeys (`long.spec.ts`) on CI.
- **The owner's try** is next: a game of 50 turns or more on a phone and a desktop.

