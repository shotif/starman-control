# M2 · Worlds

**Status:** written 20 October 2026; **decided 21 October 2026**: the owner took every
recommendation of §21. Built from increment 20 (§18), each increment with an *As built* note
(§22); two gaps found while building were answered on 21 October 2026 (D-42, D-43).
The owner chose M2 as the main track with rivals that play, events and stories, leaders and
advisors and a guided opening ([D-30](../DECISIONS.md#d-30--what-comes-next--decided): A with B, C,
D and E). Music is a decision of its own ([D-31](../DECISIONS.md#d-31--music--decided), generated pieces, increment 19).

**Goals.** M2's exit criterion ([SCOPE.md §7](../SCOPE.md#7-milestones)): *a 100-turn solo game has
real economic choices, and every number explains itself.* So every world is worth something
different and you decide what it is for; growing needs food and costs money; people can be
unhappy, and you can see why; your departments have faces and tell you what needs you; the other
two human powers race you for the same stars by the same rules; now and then something happens
that asks you to choose; and a first game teaches itself. All of it on a phone and a desktop alike
(D-04), for any power (D-08).

**Out of scope** (§17, in short): war, borders, treaties and diplomacy (M3, M4); alien species
(M3); leaders with traits and loyalty (M5); losing a colony to revolt; music (D-31).

**The numbers** are starting points for balancing, as M1's were: every rule is in whole numbers, in
`src/content/`, and is tuned by headless 100-turn games (§19).

## Contents

1. [What playing M2 feels like](#1-what-playing-m2-feels-like)
2. [Districts and zoning](#2-districts-and-zoning)
3. [Food](#3-food)
4. [Credits](#4-credits)
5. [Approval and unrest](#5-approval-and-unrest)
6. [Projects](#6-projects)
7. [Research](#7-research)
8. [Governors and edicts](#8-governors-and-edicts-d-15)
9. [Advisors](#9-advisors)
10. [Rivals that play](#10-rivals-that-play)
11. [Events and stories](#11-events-and-stories)
12. [The guided opening](#12-the-guided-opening)
13. [The report, what needs you, and every number explained](#13-the-report-what-needs-you-and-every-number-explained)
14. [On the screen](#14-on-the-screen)
15. [The colony scene](#15-the-colony-scene)
16. [The state and saves](#16-the-state-and-saves)
17. [Out of scope](#17-out-of-scope)
18. [Increments](#18-increments)
19. [Tests and budgets](#19-tests-and-budgets)
20. [Art and its cost](#20-art-and-its-cost)
21. [Decisions for the owner](#21-decisions-for-the-owner)

## 1. What playing M2 feels like

You lead the Frontier Cooperative. The guided opening's Colonies advisor shows you Tau Ceti e: ten
districts, two of them housing, two farms under glass, three works, a mine, a lab and a market.
Your Treasury advisor says the books balance, just: the shipyard and four ships cost what the
taxes bring in. You send the survey ships out; Science asks what to research first.

By turn 15 your first colony on a cold super-Earth has one district and a million people, eating
food that comes along the lanes from Tau Ceti; your Colonies advisor warns that the network will be
short in three turns. You zone a farm there, and put the far colony under a governor told to
*grow*. The Watch reports that the Authority has relit the dark lane to Epsilon Eridani before you
could. A flare from your colony's red dwarf (flare stars really flare; when is fiction) asks you to
choose: shelter and lose a turn's work, or ride it out and lose people. By turn 60 you have nine
colonies, a treasury you overdrive in a hurry, one world in unrest because it is far from home and
taxed hard, and you can tap any number to see exactly why it is what it is.

## 2. Districts and zoning

*MoO3: planets of 1 to 12 regions zoned for economic activities. Lesson 4 ([research](../research/MASTER_OF_ORION_3.md#4-lessons-for-starman-control)): keep regions and zoning, simplified.*

- **A colony has as many districts as its world's size** (1 to 12, the same `size` the colony
  scene's slots already use). **A capital has 10, whatever its world**, as it has room for 12
  million whatever its world (M1_COLONIES.md §1), so the three starts are equal. Outposts have
  no districts: an outpost is its rig and yields its world's riches, as now.
- **Each district is zoned for one use, or left open** (wild land that makes nothing):

| Zone | When worked, it yields | Where it does best |
| --- | --- | --- |
| **Farms** | food: 3 on a comfortable world, 2 on a tolerable one, 1 on a harsh one (under glass); 3 at a capital | worlds with air and water |
| **Works** | 3 industry | anywhere |
| **Mines** | the world's main riches (M1's rule): 2 if rich, 1 if poor; cannot be zoned where there are none | rich worlds |
| **Labs** | 2 research | anywhere |
| **Market** | 2 credits; 3 in a system with a lane station (the traffic) | lane hubs |
| **Housing** | room for 2 million more people; needs no workers | crowded worlds |

- **Zoning is built.** Zoning an open district, or rezoning one, is an item in the colony's queue:
  20 industry and 5 metals, done when paid like any project. Clearing a district back to open is
  free and immediate. So deciding what a world is for is an investment you can see in the queue.
- **People work districts.** Every whole million people works one zoned district (housing aside),
  in the order the colony lists them; you reorder them, or a governor does (§8). A district with
  no one to work it yields nothing and says so ("not worked: 1 million short"). People with no
  district to work are **idle**: they pay taxes and eat, but make nothing; they cost no approval
  ([D-43](../DECISIONS.md#d-43--idle-people-and-approval--decided)).
- **A new colony arrives zoned** ([D-42](../DECISIONS.md#d-42--how-a-new-colony-starts--decided)):
  farms, then works, as far as its world has districts, and every colony makes **2 industry of
  its own**, as the capital and every outpost do, so it can always pay to zone.
- **Room for people** is the world's room for the species (M1's habitability, unchanged) plus 2
  million for each housing district (and 4 for an arcology, §6). A capital has 8 million of its own
  and starts with two housing districts: 12 million, as in M1.
- **What changes from M1.** People no longer make industry and research by themselves: works and
  labs do. A capital keeps its own **2 industry**, and gains **3 research** of its own (its old
  universities), so a start feels like M1's. A colony's world riches now come from its mines; an
  outpost's stay its own. M1's *mine* project becomes the **deep mine** (each mine district there
  yields 1 more).
- **Every capital starts zoned the same:** 2 housing, 2 farms, 3 works, 1 mine, 1 lab, 1 market.
  With 10 million people, its 8 working districts are all worked: about 6 food (it eats 5),
  11 industry (12 for the Authority), 1 or 2 of its world's riches besides the capital's own,
  5 research and 3 credits from its market, close to M1's start.

## 3. Food

- **Every colony eats 1 food for every 2 million people**, rounded up. Outposts eat nothing.
- **Food goes along the lanes.** A power's colonies joined by its open lanes form a **supply
  network**, and their food is pooled: farms on a garden world feed domes on a frozen moon. A
  colony reached only by a blind jump, with no lane of its own, feeds itself.
- **Surplus** goes into the network's store, which holds up to 5 for each colony in it; a shortage
  draws on the store first.
- **Hungry:** when the store cannot cover a shortage, every colony of that network stops growing and
  loses 15 approval; after three hungry turns in a row, each loses a tenth of a million people a
  turn until it is fed. What needs you warns two turns before the store runs out.
- **Growth** is M1's (10% a turn, slowing as the world fills) while the colony is fed.

## 4. Credits

*MoO3: taxes, budgets and the overdrive curve. Lesson 5: keep the overdrive curve, and show it.*

- **The treasury** is the power's, starting at **50 credits**.
- **Taxes**, one rate for the whole power: **low** (1 credit for every 4 million people), **standard**
  (1 for every 2 million) or **high** (1 for every million), counted colony by colony and rounded
  down. Markets and the trade exchange (§6) add to them.
- **Upkeep**, each turn: 1 for every ship, 1 for every outpost, 1 for most projects (2 for a
  shipyard and a research institute; none for a trade exchange). Districts cost nothing to keep.
- **Overdrive:** a colony can buy industry beyond its own, in steps of a quarter of it: the first
  step costs 1 credit for each industry bought, the second 2, the third 4. The panel draws it as a
  curve, so the choice is plain: build more works, or pay to go beyond them. An overdrive stays set
  until you change it, and stops by itself when the treasury cannot pay.
- **Debt:** below zero, nothing can be overdriven and every colony loses 10 approval until the
  treasury is back above zero. The Treasury advisor warns two turns before.
- **At the start** a capital takes about 5 in taxes and 3 from its market, and pays about 7 in upkeep
  (four ships, a shipyard and a lane station): tight on purpose, and easier once the colony ships
  are used.

## 5. Approval and unrest

*MoO3: five levels of unrest that scaled output down to nothing at revolt.*

Every colony has an **approval** from 0 to 100, shown as a word and a number, with its parts:

| Part | Effect |
| --- | --- |
| A base | 60 |
| Taxes | low +10, standard 0, high −15 |
| The capital | +10 (the seat of government) |
| Hungry | −15 |
| Full | −5 at its room |
| Under domes | −5 on a harsh world |
| Far from home | −2 for each lane jump beyond 3 from the capital, at most −12; −12 with no lane to it |
| Debt | −10 |
| A civic centre | +10 here, +5 within two jumps |
| A recreation dome | +10 |
| Edicts and events | as each says |

| Level | Approval | The colony's districts yield | Grows |
| --- | --- | --- | --- |
| **Content** | 60 or more | all | yes |
| **Uneasy** | 40 to 59 | 10% less | yes |
| **Unrest** | 20 to 39 | 30% less | no |
| **Revolt** | below 20 | nothing; its queue stops | no |

A colony in revolt is never lost in M2: it comes back as its approval rises. Losing a colony to
independence or a rival needs the powers to deal with each other (M3, M4). The powers' traits stay
as they are (D-20); new ones for approval come with balancing.

## 6. Projects

*SCOPE.md §4.3: about fifteen projects in 1.0, one-off buildings on a planet.* M1 has four; M2 adds
eleven. A colony builds each project once; every project shows as a building in the colony's scene
in its power's architecture (§15). Projects do not take districts: zoning decides what the land is
for, projects are investments on top, and their upkeep is what limits them.

| Project | Does | Cost (industry, other) | Upkeep | Opens with |
| --- | --- | --- | --- | --- |
| Shipyard | builds ships (M1) | 60, 10 metals | 2 | the start |
| Lane station | five beacon slots here (M1) | 50, 10 metals, 10 fuel | 1 | the start |
| Survey station | surveys every system one open lane away (M1) | 40, 5 metals | 1 | the start |
| Deep mine | each mine district here yields 1 more (M1's mine) | 30, 5 metals | 1 | the start |
| **Hydroponics** | 3 food, on any world | 40, 5 metals | 1 | the start |
| **Trade exchange** | 3 credits, and 1 more for each market district here | 50 | 0 | the start |
| **Civic centre** | approval +10 here and +5 within two jumps | 50, 5 metals | 1 | the start |
| **Recreation dome** | approval +10 | 40, 5 volatiles | 1 | Society I |
| **Research institute** | 3 research, and each lab here 1 more | 60, 10 metals | 2 | Computing |
| **Fusion plant** | 4 industry; burns 1 fusion fuel a turn | 60, 10 metals | 1 | Fusion power |
| **Refinery** | 2 fusion fuel a turn from 1 volatiles | 50, 5 metals | 1 | Fusion power |
| **Arcology** | room for 4 million more | 80, 15 metals | 1 | Arcologies |
| **Medical centre** | the colony grows 25% faster | 50, 5 volatiles | 1 | Medicine |
| **Flare shield** | its star's flares do no harm here (§11); only where a world is flare-exposed (M1's real flare stars) | 40, 10 metals | 1 | Magnetics |
| **Deep-space scanner** | shows other powers' ships within 8 light-years (§10) | 40, 5 metals | 1 | Long-baseline arrays (M1) |

## 7. Research

- **Research points** come from labs, the capital's own 3, institutes and anomalies; they are
  pooled for the power and buy technologies one at a time from the tree, as in M1.
- **The fields** stay M1's six: Propulsion, Construction, Life Sciences, Society, Survey and
  Xenology, Xenology closed until a species is met (M3). SCOPE's *Energy and Weapons* comes with
  weapons (M4). A field's rows are its levels: a deeper row needs what is above it.
- **The tree grows from 14 technologies to about 34**: one to open each project that does not open
  at the start (seven); one in each field to make a zone yield 1 more (soil science for farms,
  automation for works, deep boring for mines, computing for labs, lane trade for markets); and
  society's laws (lighter taxes: high taxes cost −10 approval instead of −15; regional
  administration: *far from home* begins a jump later; the edicts, if chosen, §8). Every
  technology states its exact effect, as now.

## 8. Governors and edicts (D-15)

*MoO3's viceroys ran the planets and overrode the player; its focus points, which rationed
attention, were cut before release, and critics see that as its root failure. Lessons 1 and 2.*

### Governors

- **Any colony can be given a governor**, and you can choose that every new colony gets one.
  **Nothing is governed by default**; the new-game screen's *More* offers a *hands-on* start
  (no governors, the default) and an *imperial* one (a governor for every new colony).
- **A governor has a priority** you choose: *grow*, *produce*, *research*, *trade* or *balance*.
  From it, each turn, it zones open districts, chooses which districts are worked, queues projects,
  and mends shortages (a farm when hungry, housing when full). It never builds ships or lanes,
  never changes taxes, and never spends credits on overdrive: those stay yours.
- **A contract you can see.** Every action it takes is in the report with its reason ("Tau Ceti f:
  zoned a farm — the network is 2 food short"). **What you order yourself sticks:** a district you
  zone and an item you queue are locked, shown with a padlock, until you unlock them.
- **The same rules for everyone:** the rivals' AI runs its colonies with the same governor code
  (§10), so a governor is as good as the AI, and no better.

### Edicts: three ways

| | What it is | For | Against |
| --- | --- | --- | --- |
| **E1. No edicts** | every order is free; governors are a convenience | the simplest | delegation has no weight beyond saving taps |
| **E2. Edicts as policies** | Control has **attention**, 2 a turn, kept up to 6; an edict spends it for a strong, short policy. Ordinary orders never cost attention | a light form of the idea MoO3 cut; a real choice each turn without rationing taps; easy to explain on a phone | another number to watch |
| **E3. Attention rations changes** | MoO3's focus points: *changing* plans (rezoning, taxes, reordering, overriding a governor) costs attention; looking is free; governors spend none | delegation buys attention, which gives it real meaning | frustrating on a phone, where every change is a tap; hard to explain; easy to feel blocked |

**The edicts of E2** (their numbers for balancing):

| Edict | Attention | Lasts | Does |
| --- | --- | --- | --- |
| Festival | 2 | 4 turns | approval +15 at a colony |
| Labour drive | 1 | 3 turns | a colony's industry +25%, approval −10 there |
| Rationing | 1 | 4 turns | a network eats a quarter less, its approval −10 |
| Crash programme | 2 | 3 turns | research +50%, industry −20% everywhere |
| Survey drive | 1 | 3 turns | survey ships make 1 more jump point |
| Martial order | 2 | 3 turns | a colony in unrest or revolt yields as if content; approval −5 at every other colony |

**Recommendation:** governors as above, off by default; and **E2**, tried in M2 with a setting to
turn edicts off, and kept only if they make play better (D-15's own draft).

## 9. Advisors

*SCOPE.md §4.14 and §4.18: starmen who give short, plain, optional advice. D-11: they address you as
Control.*

- **Six advisors for each power**, one for each department: **Colonies** (people, food, approval),
  **Works** (industry, districts, projects), **Treasury** (credits, taxes, upkeep), **Science**
  (research), **Survey** (ships, surveys, anomalies, lanes) and **the Watch** (the rivals). Each has a
  name in its power's tradition, a face (18 portraits) and a voice: the Authority's formal, the
  Cooperative's warm and ready to argue, the Wake's dry and blunt. All of them are fiction, and the
  codex says so.
- **They speak in the report:** each turn, up to three lines from the departments with the most
  important news, with advice where something needs you ("Control, Tau Ceti f will go hungry in two
  turns: zone a farm there, or build hydroponics"). Lines are written in the game's data as
  sentences with blanks, filled from the state: no live AI text (D-17).
- **They lead the opening** (§12) and stand beside their numbers (the Treasury's face by the
  treasury's breakdown).
- **A setting:** advisors *speak* (the default), are *quiet* (only when something needs you) or
  *off*.
- **Not yet:** traits, experience, loyalty and hiring (SCOPE.md §4.14, M5). Advisors speak; they do
  not change any number.

## 10. Rivals that play

*SCOPE.md §4.16: AI powers with personalities that play by the same rules, run in a Web Worker.*

- **Every new game has the three human powers**: yours and the other two as **rivals**, each at its
  capital with its home web, starting fleet and stockpile, as M1's start already sets out (D-19a,
  D-20). The new-game screen's *More* offers *play alone*.
- **The same rules and the same orders** as the player (D-08): they survey, settle, zone, build
  projects and lanes, relight dark lanes, research, set taxes and answer events, through the orders
  the interface sends. **No bonuses.** One difficulty in M2, said on the new-game screen.
- **Personalities from their powers:** the Authority steady (lanes and research, the best worlds
  first, standard taxes); the Cooperative wide (many colonies, farms, low taxes); the Wake quick
  (lanes and outposts on rich worlds, high taxes). Whichever power you lead, the other two play.
- **What you can see of them:** their colonies, outposts and lanes in systems you have surveyed;
  their ships in systems you hold and within a deep-space scanner's range; the Watch's news
  ("The Authority settled Epsilon Eridani b").
- **Meeting without war:** a world one power holds cannot be settled by another; two powers may
  hold different worlds in one system; a power's lanes are closed to the others' ships until
  treaties (M3); a dark lane belongs to whoever relights it first; a new lane can't be built to a
  star whose beacon slots are full, whoever filled them. No combat, borders, claims or diplomacy
  yet (M3, M4).
- **Standings:** the empire screen compares the powers you know (systems, colonies, people,
  technologies), as far as you can see them.
- **Same game, same result:** the AI's choices come only from the state and the seed (D-06), and run
  in the worker with the turn.
- **Saves from before M2** go on alone, as they began.

## 11. Events and stories

*SCOPE.md §4.13: real astronomy as play, fictional set pieces labelled, story events with choices;
about forty in 1.0.*

- **About twelve in M2.** Each has a picture (the `illustration` series, shared by the powers), a few
  lines of text, and two or three choices, each showing its cost and what follows **before** you
  choose. Invented events are labelled *Fiction*; real astronomy says what is real.
- **When:** each turn, each power has a 1 in 8 chance of an event, at most one in six turns, drawn
  from the seed among the events whose conditions fit. The rivals get events and answer them too.
- **Unanswered** for three turns, an event takes its first choice; it waits in what needs you until
  then.

| Event | When | Choices (draft) |
| --- | --- | --- |
| **Flare** | a colony on a flare-exposed world without a flare shield (flare stars are real; when they flare is fiction) | shelter: no industry there this turn · ride it out: lose 2 tenths of a million people |
| **A comet** | a system you hold | capture its ice: 20 industry, +15 volatiles · study it: +20 research |
| **A bumper harvest** | a colony with farms | store it: the network's store fills · sell it: +20 credits |
| **Blight** | a colony with farms | burn and replant: −20 credits, its farms yield 1 less for 2 turns · live with it: 1 less for 5 turns |
| **A strike** | a colony with works | meet their demands: −25 credits · wait it out: no industry there for 2 turns, approval −10 |
| **An epidemic** | a colony of 3 million or more | medical aid: −30 credits · quarantine: no growth for 4 turns, approval −10 |
| **A derelict** | a system you surveyed (Reborn's old derelicts, D-13 later) | salvage it: +20 metals · study it: a survey ship there spends 2 turns, +30 research |
| **Lane drift** | an open lane of yours | retune it: 20 industry at its end · let it drift: the lane is closed for 3 turns |
| **Settlers' petition** | a full colony | grant it: a colony ship at that colony for 40 credits · refuse: approval −5 there |
| **Defectors** | a rival's ship near you | welcome them: a survey ship joins you, the rival's ship goes · send them home: nothing |
| **A smugglers' offer** | any | buy: +20 fusion fuel for 15 credits · report them: approval +5 at the capital |
| **Founders' Day** | the start's anniversary, every 40 turns | a festival: −15 credits, approval +10 everywhere for 3 turns · a quiet day: nothing |

## 12. The guided opening

*SCOPE.md §4.18: a guided opening teaches each system in turn, as Reborn's first job chain does.*

- **On for a first game**, and from *Menu → Guide me* at any time; a setting turns it off.
- The advisors take you through the first turns **one step at a time, each done by doing it**, never
  by reading a page: see your capital and its districts (Colonies) · zone or queue something
  (Works) · send a survey ship out (Survey) · choose research (Science) · look at the taxes
  (Treasury) · end the turn and read the report · send the colony ship to a world the survey found
  · queue a ship at the shipyard · relight or build a lane · meet a governor (and the edicts, if
  chosen) · the Watch's first news of a rival.
- **Each step** is a short card with the advisor's face and one sentence, and the control to press
  lit by a ring: on a phone above the bottom bar, on a desktop beside the control. *Skip* and *Stop
  guiding* are always there; nothing is blocked; a step you have already done is passed over.
  With reduced motion, the ring does not pulse.

## 13. The report, what needs you, and every number explained

*Pillar 2: an empire, not a spreadsheet. MoO3's great failure was opacity.*

- **The report** opens with **what needs you** (cards to work through), then events waiting, the
  advisors' lines, then what happened, grouped by place, as now.
- **What needs you** gains: a network about to go hungry; a colony in unrest or revolt; the treasury
  about to fall into debt; districts not worked, and districts left open; an event waiting; a
  governor that could not do what its priority asks (and why).
- **Every number explains itself**: any figure in a colony's panel, the empire and the top bar can
  be tapped (phone) or hovered (desktop) for its parts, as industry already can, **and what changed
  since the last turn, and why**: "Industry 14 (+2): +3 a new works district, −1 uneasy".

## 14. On the screen

Both layouts are designed together (D-04) before anything is built; the colony's panel and the
empire change most.

- **The colony's panel** gains *Districts*: one tile for each district, with its zone's icon, its
  yield and whether it is worked; tap a tile to zone it (a sheet listing each zone's yield on this
  world) and move it up or down to choose which are worked. Approval and food join people and
  industry at the top, each with its breakdown; the governor's priority and the overdrive curve
  sit below the queue.
- **The empire** gains the treasury and the tax rate, food by network, approval by colony, the
  edicts (if chosen) and the standings.
- **The top bar** gains credits and food beside metals, volatiles and fuel, and attention if edicts
  are chosen.
- **Phone:** the tiles are a grid of 44 px targets; sections fold; the opening's cards sit above the
  bottom bar. **Desktop:** the districts are a strip in the inspector, with keys to zone and
  reorder; the empire is a sortable table.

## 15. The colony scene

The owner's direction for M2 (D-30): *the colony scene's slots become districts, and zoning shows
as buildings.*

- **Each district is a slot.** Farms show as the fields (open air) or greenhouses (domed); works
  as the power's works; mines as its mine (the picture it has now); labs as its laboratory; a market
  as its market; housing as homes, which grow with the people as now, in the three versions of
  increment 18; an open district as wild ground.
- **Projects stand in a second ring of slots** round the town, found for each landscape as the
  first twelve were; the capital's hall keeps the middle. Props (increment 18) fill the gaps.
- **New pictures:** each power's works, laboratory and market (9), shared greenhouse farms (1), and
  each power's eleven new projects (33): 43 in all (§20).

## 16. The state and saves

- The game state's version rises with each increment that changes its shape (version 7 onwards),
  each with a migration, as since M1. A save from M1 or increment 18 is zoned as a *balance*
  governor would zone it, keeps its projects (the mine becomes the deep mine, with a mine district
  where the world has riches), starts its treasury at 50, and goes on alone (§10).
- All rules stay pure, whole-number TypeScript in the worker; every new number lives in
  `src/content/`.

## 17. Out of scope

- **War** and everything of it: combat, invasion, defences, blockades (M4).
- **Diplomacy:** treaties, borders and claims, lane tolls and passage, trade between powers, the
  council, espionage (M3, M4).
- **Alien species** and Xenology (M3, D-12).
- **Leaders** with traits, experience and loyalty, admirals, hiring (M5); advisors only speak.
- **Losing a colony** to revolt or independence.
- Sector governors and plans for groups of worlds (MoO3's development plans); migration between
  colonies; terraforming; orbital habitats and stations.
- More than one difficulty, and personalities beyond the three powers'.
- Story chains, relics and the precursor mystery (M5); events beyond the twelve.
- Music (D-31); voices; live AI text (D-17).

## 18. Increments

Each keeps the game playable, passes `npm run check` and the browser journeys, and deploys, as
before. (Increment 19 is the music, D-31, so M2 begins at 20.) The order follows D-30: the economy first with the opening's pieces inside it, the rivals
once there is an economy to play by. Districts and food, and credits and approval, were built as
one increment (20): each changes what the others yield, so none could be played or balanced alone.

| # | Increment | What |
| --- | --- | --- |
| 20 | **Districts, food, credits and approval** | districts, zoning in the queue, workers, room, food and supply networks; the treasury, taxes, upkeep, overdrive and its curve, debt; approval, its parts and levels; the capitals' start; the panel's districts on phone and desktop; credits and food in the top bar; districts as buildings in the scene (10 pictures); state version 7 (built, §22) |
| 21 | **Projects and research** | the eleven new projects and their buildings (33 pictures); the tree to about 34 technologies |
| 22 | **Advisors and the report** | six faces for each power (18 portraits), their lines in the report, the new needs |
| 23 | **Governors and edicts** | governors and their contract; edicts (E2) with a setting to turn them off; the hands-on and imperial starts |
| 24 | **Rivals that play** | the other two powers as AI in new games; what you see of them, the Watch, the standings; the headless 100-turn game in CI |
| 25 | **Events and stories** | the twelve events, their pictures and choices |
| 26 | **The guided opening** | the steps, on phone and desktop |
| 27 | **The proof** | balance from headless games; a 100-turn game on a phone and a desktop; the budgets; the owner's try |

Every rule that shapes the game and is not settled in §21 is put to the owner when its increment
reaches it.

## 19. Tests and budgets

- **Unit:** every rule (zoning, workers, room, food networks and hunger, taxes, upkeep, the overdrive
  curve, debt, approval's parts and levels, each project, governors' choices and their reasons,
  locks, edicts, events' conditions and outcomes, the AI's choices), the migrations from version 6.
- **Headless:** three AI powers for 100 turns over a set of seeds, in CI: no crash and no stall;
  every power settles, grows and stays out of lasting hunger and debt; the same seed gives the same
  game twice.
- **Browser:** zoning on the phone, tablet and desktop; a hungry network warned; overdrive; a
  governor's action in the report and a lock that holds; an event answered; the opening's steps done
  by doing them; rivals seen on the map; screenshots at the ten sizes.
- **Budgets:** a turn with three powers at turn 100 within 200 ms on a phone (M1's turn budget, now
  with the AI); a 100-turn save within 200 KB; the map's first load within its 900 KB.

## 20. Art and its cost

| Pictures | Count | With two candidates each |
| --- | --- | --- |
| The districts' buildings: each power's works, laboratory and market, shared greenhouse farms | 10 | about $1.00 |
| The new projects, in each power's architecture | 33 | about $3.30 |
| The advisors: six faces for each power | 18 | about $1.80 |
| The events | 12 | about $1.20 |
| **In all** | **73** | **about $7.30**, about $8 with re-rolls |

With increment 18 (about $6.10 in all, $1.90 of it spent), the project would reach about **$22.50**
of the $25 D-27 allows. Each batch is recorded in DECISIONS.md, and shown to the owner as lettered
contact sheets.

## 21. Decisions for the owner

Answer *as recommended* to take every recommendation, or name what to change. Smaller choices are
made without waiting and listed in DECISIONS.md.

| ID | Question | Options | Recommendation |
| --- | --- | --- | --- |
| **D-15** | Governors and edicts (§8) | governors: none · **optional, with a priority, a visible contract and locks** · sector governors; edicts: E1 none · **E2 policies paid from attention** · E3 attention rations changes | optional governors, off by default, with *hands-on* and *imperial* starts; **E2**, with a setting to turn edicts off, kept only if they make play better |
| **D-32** | How a world's land is used (§2) | (a) **districts by size, zoned for one of six uses, worked by a million each, zoning built in the queue; projects separate** · (b) MoO3's regions with two activities each · (c) no districts, projects only | **(a)**, with capitals of 10 districts whatever their world and the same starting zoning |
| **D-33** | Food (§3) | (a) **pooled along each power's lanes, hunger stops growth and costs approval, then people** · (b) each colony feeds itself · (c) no food | **(a)**: it makes lanes and garden worlds matter |
| **D-34** | Credits (§4) | (a) **one tax rate, upkeep for ships, outposts and projects, the overdrive curve, debt costs approval** · (b) the same without overdrive · (c) taxes per colony | **(a)**: MoO3's curve, shown plainly |
| **D-35** | Approval and unrest (§5) | (a) **its parts and four levels as drafted; revolt stops a colony but never loses it in M2** · (b) the same, and a colony in revolt for 10 turns breaks away · (c) no approval in M2 | **(a)**: losing colonies waits for the powers to deal with each other |
| **D-36** | The fifteen projects (§6) | (a) **the list as drafted** · (b) change the list | **(a)** |
| **D-37** | Rivals in M2 (§10) | (a) **both other powers in every new game, same rules, no bonuses, one difficulty, lanes closed to others until treaties, old saves alone** · (b) rivals only when chosen · (c) rivals that may use each other's lanes freely | **(a)** |
| **D-38** | Events (§11) | (a) **about twelve, a 1 in 8 chance a turn and at most one in six turns, each with a picture and choices shown with their costs** · (b) fewer, without pictures · (c) a different list | **(a)** |
| **D-39** | Advisors (§9) | (a) **six departments for each power, named, with faces (18 portraits), up to three lines a turn, a setting to quieten them** · (b) one advisor for each power · (c) advisors with no faces | **(a)** |
| **D-40** | The guided opening (§12) | (a) **steps done by doing them, led by the advisors, on for a first game, skippable** · (b) a written tutorial page · (c) none in M2 | **(a)** |
| **D-41** | The art for M2 (§20) | (a) **73 pictures, about $8, as each increment needs them** · (b) fewer (one candidate each, about $4) · (c) more for the scenes (raise D-27) | **(a)**: about $22.50 of the $25 in all |

## 22. As built

### Increment 20: districts, food, credits and approval (21 October 2026)

- **The rules** (`src/sim/economy.ts`, numbers in `src/content/rules.ts`): districts by the world's
  size (a capital 10), zoned through the queue for 20 industry and 5 metals, cleared at once and
  for nothing, worked a million each in the colony's order (*Work it first* moves one to the
  front); farms, works, mines, labs, markets and housing as §2; food pooled along each power's open
  lanes, a store of 5 for each colony on the capital's lanes, hunger after the store is spent,
  starving after three hungry turns; taxes at three rates, markets, upkeep, debt; overdrive in
  three steps of a quarter of the colony's industry at 1, 2 and 4 credits apiece, stepping down
  or stopping when the treasury cannot pay; approval with its parts and four levels. M1's mine
  project is the deep mine.
- **The owner's answers while building:** a new colony arrives with farms and works zoned and
  makes 2 industry of its own (D-42 A); idle people cost no approval (D-43 C).
- **Smaller choices** (DECISIONS.md, *Made without waiting*): a yield kept at a lower approval is
  rounded to the nearest; what a turn yields is counted as it begins, so a new deep mine yields from
  the next turn; only the capital's network keeps a store; *what needs you* warns of food two
  turns ahead, of debt, of unrest, and of districts no one works once the colony is full.
- **Saves:** state version 7. An older game's capitals are zoned as every capital starts; its
  other colonies are zoned for their people (farms to feed them, then a mine where there are
  riches, works, labs, a market); every power gets 5 food (what the store holds for one colony), 50 credits and standard taxes.
- **The panel:** *Districts* as a grid of tiles (at least 64 px tall, so a thumb's target on a
  phone), each with its zone, its yield here and whether it is worked; a tile opens its choices
  to zone, rezone, work first or make open, each with its cost and what it would yield. Approval
  and food sit with people and growth, each with its parts; credits beside industry; the overdrive
  curve as four buttons whose bars rise with their cost, under the queue. Tab and Enter reach every
  tile on a desktop; keys of their own wait for the governors (increment 23).
- **The empire:** the treasury, its parts and the tax rate at the head, with food by network;
  approval as a column of the desktop's table. **The top bar:** credits and food beside the
  stockpile, red when short; to fit, a phone and a desktop narrower than 1380 px show what each
  figure gains a turn only in the empire and the panels (CONSOLE.md §6). The food store starts at
  5, what it holds for the capital alone.
- **The scene:** the hall (or an outpost's rig, or a colony's first homes) in the middle, each
  district in its slot as its zone's building, projects after the districts and then in a ring
  round the town; a district being zoned is a scaffold of its building's size. Ten pictures (about
  $1.00): each power's works, labs and market, and farms under glass for domed towns.
- **Budgets:** a colony's heaviest first pictures on a phone are now 1020.8 KB of 1 MB (a colony
  with every kind of district and every project): increment 21's 33 project buildings need the
  phone to load smaller pictures, or a larger budget, which will be put to the owner.
- **Tests:** `districts.test.ts` (20: districts, zoning, workers and housing, the new colony,
  food and hunger, credits and debt, overdrive, approval, the migration), the 50-turn scripted
  players of `colonies.test.ts` now zone their land, the scene and card tests; the browser
  journeys `districts.spec.ts` (rezoning a district and the report; taxes, approval and overdrive)
  on the phone, tablet and desktop, and the colony and game journeys brought up to date.

## 23. Increment 21 in detail: projects and research (written before building it)

**Goals.** Nine of §6's new projects, each a building in each power's architecture, and the
research tree grown to open them and to make each zone yield more, with society's two laws; every
number shown with its parts, as in increment 20.

**Out of scope, and why.** The *flare shield* waits for events (increment 25): until a flare can
do harm it would do nothing. The *deep-space scanner* waits for rivals (increment 24): until
there are others' ships it would show nothing. The edicts' law waits for governors and edicts
(increment 23). So this increment adds nine projects, not eleven, and 27 pictures, not 33.

### 23.1 The nine projects

As §6's table, with these exact rules:

- **Hydroponics:** 3 food a turn, whatever the world, into the colony's network.
- **Trade exchange:** 3 credits a turn, and 1 more for each worked market district here. No upkeep.
- **Civic centre:** approval +10 here; +5 at every other colony of the power within two lane jumps.
  A colony takes the best it is given, never both and never two of either.
- **Recreation dome** (opens with *Shared spaces*): approval +10 here.
- **Research institute** (opens with *Computing*): 3 research a turn, and each worked lab here 1
  more. Upkeep 2.
- **Fusion plant** (opens with *Fusion power*): 4 industry a turn, burning 1 fusion fuel from the
  stockpile; with no fuel it makes nothing and says so.
- **Refinery** (opens with *Fusion power*): turns 1 volatiles into 2 fusion fuel a turn, while
  there are volatiles.
- **Arcology** (opens with *Arcologies*): room for 4 million more.
- **Medical centre** (opens with *Medicine*): the colony grows 25% faster (added to the traits'
  and technologies' percentages, as M1's growth rule adds them).

Projects' yields are not scaled by approval (approval scales what the districts yield, §5), but a
colony in revolt makes nothing at all. Each project's upkeep is its own (§6's table); the shipyard
keeps its 2.

### 23.2 The tree, from 14 technologies to 32

New technologies, by field (tier, cost in points; *needs*):

| Field | Technology | Tier, cost | Needs | Effect |
| --- | --- | --- | --- | --- |
| Propulsion | **Fusion power** | 2, 60 | Lane engineering I | opens the fusion plant and the refinery |
| Propulsion | **Lane trade** | 2, 60 | Lane engineering I | each market district yields 1 more |
| Propulsion | **Lane trade II** | 3, 100 | Lane trade | each market district yields 1 more again |
| Construction | **Automation** | 2, 60 | Automated mining | each works district yields 1 more |
| Construction | **Automation II** | 3, 100 | Automation | each works district yields 1 more again |
| Construction | **Deep boring** | 2, 60 | Automated mining | each mine district yields 1 more |
| Construction | **Deep boring II** | 3, 100 | Deep boring | each mine district yields 1 more again |
| Construction | **Arcologies** | 3, 100 | Habitat domes, Automation | opens the arcology |
| Life Sciences | **Soil science** | 1, 30 | — | each farm district yields 1 more |
| Life Sciences | **Soil science II** | 2, 60 | Soil science | each farm district yields 1 more again |
| Life Sciences | **Medicine** | 2, 60 | Soil science | opens the medical centre |
| Society | **Shared spaces** | 1, 30 | — | opens the recreation dome |
| Society | **Fair taxation** | 2, 60 | Shared spaces | high taxes cost 10 approval instead of 15 |
| Society | **Regional administration** | 2, 60 | Colonial charters | *far from home* begins a jump later |
| Survey | **Computing** | 2, 60 | Deep survey | each lab district yields 1 more; opens the research institute |
| Survey | **Computing II** | 3, 100 | Computing | each lab district yields 1 more again |
| Survey | **Long-range sensors** | 3, 100 | Long-baseline arrays | survey ships make 1 more jump point a turn |
| Life Sciences | **Adaptation III** | 3, 100 | Adaptation II | hot and scorching worlds cost your people one step less |

The tree’s cost rises from 700 points to 2,000. A capital makes 5 a turn and a lab 2, so the
whole tree is a long game's work, and the zone technologies reward the colonies that specialise.

### 23.3 On the screen and in the scene

- **The panel's *Add to the queue*** lists the new projects with their cost, upkeep and what they
  do here ("3 food", "+10 approval here, +5 at Barnard's Star"); one that waits for a technology
  says which.
- **The research screen** shows the new technologies in their fields, as M1's.
- **The scene:** each project in the power's architecture after the districts, as now (27 pictures,
  about $2.70 with two candidates each).

### 23.4 The phone's picture budget

A colony's heaviest first pictures on a phone were already 1020.8 KB of the 1 MB budget, measured
with every project. Before the new buildings are added, the colony's still (its first pictures)
will load each picture at the width it is drawn, which on a phone is far less than 512 px:
buildings are published at **256 px** too, and the budget measures what a phone loads for the
still, and separately for the diorama it opens, with the game's own choice of widths.

### 23.5 Tests

Unit: each project's rule, the civic centre's reach and its best-of, the fusion plant without
fuel, the refinery without volatiles, upkeep per project, every new technology's effect, the
tree's shape (each needs only what comes before it) and cost. Browser: a project opened by research
and queued, on phone, tablet and desktop; the budgets.

### Increment 21: projects and research (21 October 2026)

- **Nine projects** (§23.1): hydroponics, the trade exchange and the civic centre from the start;
  the recreation dome, research institute, fusion plant, refinery, arcology and medical centre
  opened by research. Each has its own upkeep (`src/content/projects.ts`); a project waiting for a
  technology says which ("Needs Computing."). Refineries and fusion plants run as the turn begins,
  colony by colony, from the stockpile, so a plant whose fuel ran out says so and makes nothing.
- **The tree: 32 technologies, 2,000 points** (§23.2), as designed, but *Lane trade* needs *Lane
  engineering I*, not *Beacon tuning*, so each technology needs only what lies above it.
- **The pictures:** 27 buildings, 54 candidates, about $2.70; picks in DECISIONS.md. Every
  building is also published at 256 px (`npm run art:widen`, which made the 256 px files of the 88
  buildings already published from their 1024 px ones; approval now makes all three).
- **The phone's pictures** (§23.4): the still loads each picture at the width it is drawn in its
  frame (a painted landscape may be drawn up to 18% larger than its file, a building 10%), so its
  heaviest is **618 KB of its 1 MB**, with every district and project; measured honestly at last,
  the old way had counted 512 px buildings and a 1280 px landscape where a phone loaded the 2560
  px one. The diorama it opens, measured the same way from the diorama's own framing, is **1.62
  MB at most**; a new budget of **2 MB** guards it.
- **On the screen:** *Add to the queue* shows each item's upkeep; the report, the scene's words and
  the cards say *an arcology* and *hydroponics*, not *a arcology*.
- **Tests:** `projects.test.ts` (each project's rule, upkeep, the civic centre's reach and its
  best-of, the fusion plant without fuel, the refinery, the new technologies), the tree's shape
  and cost, and `projects.spec.ts` (queueing a project and one that waits for research; the tree's
  new technologies) on the phone, tablet and desktop.

## 24. Increment 22 in detail: advisors and the report (written before building it)

**Goals.** §9's six advisors for each power, named, with faces and voices, speaking in the report:
up to three lines a turn, the most important first, with advice where something needs you. A
setting to quieten them. Their faces beside their numbers: the Treasury's by the treasury, Science's
by the research rate.

**Out of scope.** The Watch has nothing to say until there are rivals (increment 24): it is named,
has its face and stands in the codex, but speaks from then. The advisors' part in the opening is
increment 26's. Traits, experience, loyalty and hiring are M5's (SCOPE.md §4.14).

### 24.1 Who they are (all fiction)

| Department | The Authority (formal) | The Cooperative (warm) | The Wake (blunt) |
| --- | --- | --- | --- |
| **Colonies** | Commissioner Adaeze Morrow | Ines Barros, of the Settlement table | Grist, who keeps the holds |
| **Works** | Chief Engineer Pavel Lindqvist | Tobias Mwangi, of the Builders' table | Weld |
| **Treasury** | Comptroller Sunita Rao | Lin Feng, keeper of the Common Purse | Tally |
| **Science** | Dr Kenji Albrecht | Priya Nandakumar, of the Learning table | Doc Marrow |
| **Survey** | Commander Lucia Ferreira | Sefa Owusu, of the Pathfinders | Farcast |
| **The Watch** | Inspector Owen Hale | Mara Kowal, of the Lookouts | Lantern |

Each face is a portrait in the style of the powers' leaders (18 pictures, about $1.80): the
Authority's in its dark green civil-service uniform, the Cooperative's in blue work clothes, the
Wake's in patched flight jackets.

### 24.2 What they say

Each turn the report gathers what each department would say, from the turn's events and from what
needs you, and shows **at most three lines, one a department**, the most important first:

| Priority | Department | When |
| --- | --- | --- |
| 1, needs you | Colonies | a network is hungry, or will be within two turns; a colony is in revolt |
| 1, needs you | Treasury | the treasury is in debt, or will be within two turns |
| 2, needs you | Colonies | a colony is in unrest |
| 2, needs you | Science | nothing is being researched |
| 2, needs you | Treasury | an overdrive stopped for want of credits |
| 2, needs you | Works | a fusion plant has no fuel |
| 3, news | Science | a technology was researched (and what it opens) |
| 3, news | Works | a project was built, or a district zoned |
| 3, news | Survey | an anomaly was investigated, a lane opened, or a system surveyed |
| 3, news | Colonies | a colony was founded |
| 4, a nudge | Works | a shipyard builds nothing |
| 4, a nudge | Survey | a ship is idle |

Each line is a sentence with blanks in the game's data, in three voices; it names the place and
says what to do ("Control, the colonies on our lanes go hungry when this turn ends: zone farms,
or build hydroponics"). Ties go to the department first in the table's order.

**The setting:** *Advisors* speak (every line, the default), are *quiet* (only lines that need
you) or *off*.

### 24.3 On the screen

- **The report:** the advisors' lines first, each with the face (48 px), the name and the
  department, then the turn's events as now. On a phone the faces sit to the left of each line.
- **Beside their numbers:** the Treasury's face and name by the empire's treasury, Science's by the
  research rate.
- **The codex** lists each power's advisors with their faces, labelled fiction.

### 24.4 Tests

Unit: which lines a turn gives, their order and the limit of three, one a department; quiet and
off; every line's blanks filled in all three voices. Browser: the report's lines and faces on the
phone, tablet and desktop; the setting.

### Increment 22: advisors and the report (21 October 2026)

- **Who they are** (`src/content/advisors.ts`): §24.1's eighteen advisors, each with a name, a
  role, a voice and a face; all fiction, and the codex lists them with their faces under each
  power's home web.
- **What they say** (`src/sim/advice.ts`): §24.2's lines, from the turn's events and what needs
  you, one a department, at most three, the most pressing first; each in its power's voice (the
  Authority's formal, the Cooperative's warm, the Wake's blunt), with blanks filled from the state.
  A line about one place is a link to it. *What needs you* is edged in warm.
- **The setting:** *Advisors* speak, are quiet or off, in *Settings*.
- **Beside their numbers:** the Treasury's face and name head the empire's treasury, and Science's
  the research screen.
- **The faces:** 18 portraits, 36 candidates, about $1.80 (the image model's filter refused one
  brief, the Wake's welder with burn scars, which was reworded); picks in DECISIONS.md. Portraits
  are now published at 128 px too (4 KB a face), for their small places.
- **The Watch** is named and has its face; it speaks from increment 24, with rivals to watch.
- **Tests:** `advisors.test.ts` (who they are, every line in every voice with every blank filled,
  what a turn gives and in what order, quiet and off), `settings.test.ts`, and `advisors.spec.ts`
  (the report's lines and faces; quiet and off; the Treasury and Science beside their numbers) on
  the phone, tablet and desktop.

## 25. Increment 23 in detail: governors and edicts (written before building it)

**Goals.** §8 as decided (D-15): optional governors with a priority, every action in the report
with its reason, your own orders locked; edicts as policies paid from attention, with a setting
to turn them off. The governor's code is the one the rivals will play with (increment 24).

**Out of scope.** Rivals using edicts (they govern their colonies, and may use edicts once the
headless games show edicts are worth having, increment 27); sector governors; governors that
build ships or lanes, change taxes or spend credits (§8: those stay yours).

### 25.1 Governors

- **Who:** any colony; none by default. *More* on the new-game screen chooses a **hands-on** start
  (no governors) or an **imperial** one (every colony gets a governor, the capital included, and so
  does every new colony). The colony's panel gives or removes a governor and sets its priority.
- **When:** as each turn ends, after growth, so what it did is in the report you read and can
  undo before the next turn.
- **What, in order, each turn, for each governed colony** (at most one zoning in its queue at a
  time, and never a district or queue item you locked):
  1. **Mend shortages.** Its supply network short of food: zone a farm (an open district, else
     rezone its least needed district). Full, with land open: zone housing.
  2. **Zone open land** for its priority, but only a district its people can work within a few
     turns (idle people now, or room to grow into it): *grow* farms then housing and works;
     *produce* works and mines; *research* labs; *trade* markets; *balance* farms to feed itself,
     then mines, works, labs and markets in turn.
  3. **Order the work:** farms first, so the colony eats, then its priority's zones.
  4. **Queue a project** when its queue is empty, the first it may build of its priority's list,
     with civic centre and recreation dome first while approval is below *content*:
     *grow* hydroponics, medical centre, arcology; *produce* deep mine (with mines), fusion plant,
     refinery; *research* research institute; *trade* trade exchange; *balance* hydroponics,
     deep mine, research institute, trade exchange.
- **What it says:** each action is a report line with its reason: "Tau Ceti f's governor zoned
  district 3 for farms: its network is 2 food short."
- **Locks:** a district you zone, rezone or clear, and an item you queue, is **locked** (a padlock
  on its tile and its queue line) until you unlock it. A governor's own work is never locked; it
  may undo it next turn.

### 25.2 Edicts (E2)

- **Attention:** each power has 2 a turn, kept up to 6, starting at 2. Ordinary orders never cost
  it.
- **The six edicts** as §8's table: *festival*, *labour drive* and *martial order* name a colony;
  *rationing* a colony, for its supply network; *crash programme* and *survey drive* the whole
  power. One of each at a time; an edict lasts its turns and then ends, said in the report.
- **The setting:** *Edicts* on (the default) or off, in *Settings*: off hides attention and edicts.
- **On the screen:** the empire's head shows attention and the edicts in force; each edict is a
  button with its cost, its turns and what it does, opening a choice of colony where it needs one.

### 25.3 The state

State version 8: each colony's governor (none or its priority) and its locked district slots;
queue items queued by a governor are marked as the governor's; each power's attention, edicts in
force and whether new colonies are governed. Older saves: no governors, nothing locked, attention
2, no edicts.

### 25.4 Tests

Unit: each priority's zoning, ordering and projects; shortages mended first; locks respected; the
report's reasons; a governed colony over 50 turns stays fed and content enough; attention and each
edict's effect and end; the migration. Browser: a governor set and its line in the report; a lock
shown and undone; an edict on the phone, tablet and desktop.

### Increment 23: governors and edicts (21 October 2026)

- **Governors** (`src/sim/governor.ts`), as §25.1, after growth, yields and upkeep as each turn
  ends: a food shortage mended first (an open district zoned for farms, else the least needed one
  rezoned), housing when full, open land zoned for the priority as far as the people can work it
  (farms first where the colony only just feeds itself), farms worked first and then the priority's
  zones, and a project queued when the queue is empty (a civic centre or recreation dome first while
  the colony is less than content). Each action is a report line with its reason. A capital has no
  open land, so its governor builds what its priority lists.
- **Locks:** a district the player zones, rezones or clears is locked, marked on its tile, until
  *Let the governor have it*; items the player queues are theirs and no governor touches them (a
  governor's own items say *(governor)*). There is no lock to undo on a queued item: taking it out
  of the queue is the player's own choice.
- **Starts:** *More* on the new-game screen offers *Hands-on* (the default) or *Imperial*, where
  the capital and every new colony have a *balance* governor.
- **Edicts** (`src/content/edicts.ts`): attention 2 a turn, kept up to 6, starting at 2; the six
  edicts as §8's table, one of each at a time, each ending with a line in the report. They live
  in the empire under the treasury; a colony's edict asks which colony. *Settings* turns them off.
- **The state:** version 8 (governors, locks, attention, edicts, the imperial start), with the
  migration from 7.
- **Tests:** `governors.test.ts` (no governors by default and the imperial start; food mended first
  with its shortfall; zoning for each priority, and only as far as people can work; locks; projects
  and calming first; a governed empire fed and growing for 50 turns; attention; every edict's
  effect and its end; the migration), and `governors.spec.ts` (an imperial start's governor in the
  report; a governor set by hand and a lock undone; a festival) on the phone, tablet and desktop.

## 26. Increment 24 in detail: rivals that play (written before building it)

**Goals.** §10 as decided (D-37): the other two powers play every new game by the same rules and
orders, each in its own character; you see of them only what you could; the Watch tells you what
it saw; the empire compares the powers you know. The deep-space scanner (§6) comes with them.

**Out of scope.** War, borders, claims, treaties and trade (M3, M4); rivals using edicts or
overdrive (increment 27 decides, from the headless games); more than one difficulty; rivals
answering events (they come with the events, increment 25).

### 26.1 Who plays

- A new game has your power and the other two as **rivals**, each at its capital with its home
  web, fleet and stockpile, as the player starts. *More* offers **play alone** (the start of M1).
  The new-game screen says that the rivals play by your rules, with no bonuses, at one difficulty.
- A save from before rivals goes on as it began, alone.

### 26.2 How a rival plays (`src/sim/ai.ts`)

Its orders are worked out at the start of each turn from the state alone (D-06), and given through
the same orders as yours, refused for the same reasons:

- **Its colonies are governed** (`govern`, §25.1), each with its power's priority: the Authority's
  *research* at the capital and *balance* elsewhere; the Cooperative's *grow*; the Wake's *produce*.
- **Survey ships** investigate an anomaly where they are, else go to the nearest system not yet
  surveyed by lane, else jump blind within reach.
- **Colony and outpost ships** go to the best world they can found on, and found there: the
  Authority the roomiest, the Cooperative the nearest, the Wake (outposts) the richest.
- **Shipyards** build a colony ship while there are worlds to settle and an outpost ship while
  there are riches to take, one ship at a time, a survey ship while there is sky to survey; never
  while the treasury is below 20.
- **Outposts** queue the nearest lane they can; the Authority's colonies too.
- **Research:** the cheapest technology it can, in its power's fields first: the Authority's
  survey and propulsion, the Cooperative's life sciences and society, the Wake's construction
  and propulsion.
- **Taxes:** the Authority's standard, the Cooperative's low, the Wake's high; any rival raises
  them while in debt and lowers them while a colony is in unrest and the treasury holds 100.

### 26.3 What you see of them

- **Their colonies and outposts** in systems you have surveyed; **their lanes** with an end in a
  system you have surveyed; **their ships** in systems where you hold a colony or outpost, and
  within 8 light-years of a deep-space scanner of yours. Nothing else: the map, the system view,
  the panels and the standings show only this, in each power's colour.
- **The deep-space scanner** (opens with *Long-baseline arrays*): 40 industry and 5 metals, upkeep 1,
  a building in each power's architecture (3 pictures, about $0.30).
- **The Watch** speaks (§24): a rival founded a colony or outpost, or opened a lane, where you can
  see it; a rival ship came into your sight ("Control, a Cooperative survey ship is at Barnard's
  Star"). The report has these as events too.

### 26.4 Meeting without war

As §10: a held world cannot be settled by another; two powers may hold different worlds in one
system; a power's lanes are closed to the others' ships; a dark lane is relit by whoever pays
first; a star's beacon slots are shared by every power's lanes there. The rules already work so;
increment 24 tests them with three powers.

### 26.5 Standings

The empire shows each power you know: its colonies, outposts, people and lanes as far as you can
see them, and your own in full. Technologies are counted only for your own power.

### 26.6 The headless games and the budgets

A unit test plays three rivals for 100 turns on several seeds: no crash or stall; every power
settles and grows, stays out of lasting hunger and debt; the same seed gives the same game; a turn
at turn 100 within 200 ms; the save within 200 KB.

### 26.7 Tests

Unit: each of 26.2's choices; visibility (26.3); the scanner; meeting without war (26.4); the
Watch's lines; the headless games. Browser: a new game with rivals, a rival seen on the map and in
the standings, *play alone*, on the phone, tablet and desktop.
