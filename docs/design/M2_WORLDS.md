# M2 · Worlds (proposal)

**Status:** proposal, written 20 October 2026. **Nothing here is built until the owner has answered
§21.** The owner chose M2 as the main track with rivals that play, events and stories, leaders and
advisors and a guided opening ([D-30](../DECISIONS.md#d-30--what-comes-next--decided): A with B, C,
D and E). Music is a decision of its own ([D-31](../DECISIONS.md#d-31--music--open)).

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
  district to work are **idle**: they pay taxes and eat, but make nothing, and many idle people
  lower approval (§5).
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
| Idle people | −2 for each idle million, at most −10 |
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
before. The order follows D-30: the economy first with the opening's pieces inside it, the rivals
once there is an economy to play by.

| # | Increment | What |
| --- | --- | --- |
| 19 | **Districts and food** | districts, zoning in the queue, workers, room, food and supply networks; the capitals' start; the panel's districts on phone and desktop; districts as buildings in the scene (10 pictures); state version 7 |
| 20 | **Credits and approval** | the treasury, taxes, upkeep, overdrive and its curve, debt; approval, its parts and levels; credits and food in the top bar; every number with what changed |
| 21 | **Projects and research** | the eleven new projects and their buildings (33 pictures); the tree to about 34 technologies |
| 22 | **Advisors and the report** | six faces for each power (18 portraits), their lines in the report, the new needs |
| 23 | **Governors and edicts** | governors and their contract; edicts if chosen; the hands-on and imperial starts |
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
