# M2b · Science and rivalry

*Proposed 21 October 2026, after M2's headless games. **Waiting for the owner's answers to D-44 to
D-50** ([DECISIONS.md](../DECISIONS.md)); nothing here is built until they are given. Each
increment gets a detailed design section, written before it is built, as M2's did.*

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
