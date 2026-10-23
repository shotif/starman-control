# Handover: Starman Control, 23 October 2026 (M5 built)

For a new Claude Code session continuing the game. Read this, then [CLAUDE.md](../CLAUDE.md), then
the documents it points to. Everything here is also in the repository's documents; this page is the
way in.

## 1. The game and where it stands

- **Starman Control** is a 4X strategy game among the real nearby stars, in the universe of
  [Starman Reborn](https://github.com/shotif/starman-reborn); the owner decides, Claude designs,
  documents, builds and tests ([CLAUDE.md](../CLAUDE.md)).
- **Live:** <https://shotif.github.io/starman-control/>, deployed from `main` by
  `.github/workflows/pages.yml`; `.github/workflows/ci.yml` runs the checks and the browser
  journeys on every push. Check CI's latest run on `main` before starting (see §5).
- **M1, First light, is built** (increments 1 to 8, [M1_FIRST_LIGHT.md](design/M1_FIRST_LIGHT.md)):
  the 207 real systems on a flat or 3D map; three playable powers; survey and blind jumps; generated
  worlds labelled fiction; colonies and outposts, people, metals, volatiles and fusion fuel; build
  queues; new and relit lanes; a research tree; anomalies; the system in 3D; saves, settings, an
  installable offline app, size budgets. **Still waiting on the owner: trying M1 on a real phone.**
- **The visual direction is under way** (D-26, [VISUAL_DIRECTION.md](design/VISUAL_DIRECTION.md)),
  increments 9 to 13, each with its design and an *As built* section:
  [the first impression](design/FIRST_IMPRESSION.md) (a live 3D title, the powers' pictures and
  emblems), [the living map](design/LIVING_MAP.md) (the Milky Way, glowing stars, sparks on lanes,
  territory fields, the glide into a system), [Control's console](design/CONSOLE.md) (glass, lit
  plates, icons, the turn's sweep, sound), [in flight](design/IN_FLIGHT.md) (ships seen flying,
  the system view's sky), [illustrated dispatches](design/DISPATCHES.md) (the report's pictures).
- **The colony in pictures is built** (D-28, [COLONY_VIEW.md](design/COLONY_VIEW.md), increments
  14 to 17, with *As built* notes in its §8): every colony and outpost of every power on every
  world is a living diorama, opened from the still in its panel, the empire's *View*, the system
  view's *View it* or the report's *See it*. Nine painted grounds under a sky drawn in code in the
  star's colour; each power's own architecture (the owner chose a set of buildings per power); a
  slow day with lit windows at night; people, rovers, the power's shuttle, weather; a building
  tapped has its card. 51 pictures, keyed from flat backdrops (`npm run art:key`).
- **Increment 18 is built** (D-29, D-30 2a and 2c; [COLONY_VIEW.md §9](design/COLONY_VIEW.md#9-more-homes-and-things-between-them-increment-18-design)
  and its *As built*): no *Illustration* labels anywhere (the codex's credits say the pictures are
  made with an image model); every home in three versions, chosen from its colony and slot; 25
  props between the buildings (a `prop` series, placed beside the buildings once they stand). The
  colony view has 124 pictures.
- **Music is built** (increment 19, D-31 B, [MUSIC.md](design/MUSIC.md)): seven pieces generated
  with Google's Lyria (title, two for the map, system, a colony piece for each power), played after
  the first press, fading between places, downloaded only when played; a *Music* setting.
  `npm run music:generate`, `music:approve`, `music:check` (in `npm run check`).
- **M2 "Worlds" has begun** ([M2_WORLDS.md](design/M2_WORLDS.md), its *As built* in §22).
  **Increment 20 is built:** districts zoned through the queue and worked a million each, food
  pooled along each power's lanes with hunger and starving, the treasury with taxes, upkeep,
  overdrive and debt, approval with its parts and four levels; districts stand in the colony scene
  as buildings (10 new pictures). The owner answered two questions found while building: a new
  colony arrives with farms and works and makes 2 industry of its own (D-42), and idle people cost
  no approval (D-43). **Increment 21 is built:** nine new projects (hydroponics, trade exchange,
  civic centre, recreation dome, research institute, fusion plant, refinery, arcology, medical
  centre), each a building in each power's architecture (27 pictures), and the research tree grown
  to 32 technologies; every building is published at 256 px too, and the phone's picture budgets
  measure what a phone loads. **Increment 22 is built:** six advisors for each power, named, with
  faces and voices, speak up to three lines in each turn's report (a setting quietens them); the
  Treasury and Science stand beside their numbers; the codex lists them. **Increment 23 is
  built:** optional governors with a priority (`src/sim/governor.ts`, the code the rivals will use),
  every action in the report with its reason, the player's own zoning locked; a hands-on or
  imperial start; attention and six edicts, with a setting to hide them; state version 8.
  **Increment 24 is built:** the other two powers play every new game as rivals
  (`src/sim/ai.ts`, *play alone* in *More*), by the player's own orders and rules; the screens
  show only what the player can see of them (`src/sim/visibility.ts`); the deep-space scanner
  (3 pictures); the Watch's report and advisor lines; the empire's *Powers* tab; three 100-turn
  headless games in the unit tests. **Increment 25 is built:** twelve events with pictures and two
  choices each (`src/sim/events.ts`), answered from *what needs you*, the report or the advisor
  who speaks of it, or by their first choice after three turns; rivals answer theirs; the flare
  shield and Magnetics; state version 9. **Increment 26 is built:** the guided opening, eleven
  steps led by the advisors and done by doing them (`src/app/guide.ts`), on for a first game, with
  *Menu → Guide me* and a setting. **Increment 27, the proof, is built:** rivals spend their
  treasuries on overdrive and their attention on edicts; `npm run balance` writes the headless
  games to [M2_BALANCE.md](design/M2_BALANCE.md); a browser journey plays 100 turns on a phone and a
  desktop. **M2 is complete** and waits for the owner's try.
- **M2b, *Science and rivalry*, is under way** ([M2B_SCIENCE.md](design/M2B_SCIENCE.md); D-44 to
  D-50 decided as recommended on 21 October 2026). **Increment 28 is built:** research from every
  colony's scholars (1 for every 4 million, kept at approval) and a lab as every fifth district for
  every governor, so every power's science grows with its empire; the colony's panel shows its
  research; `npm run balance` reports research a turn and when the tree is finished.
  **Increment 29 is built:** discoveries (`src/sim/discoveries.ts`): every technology names a deed
  that pays 40% of it once (an inspiration), and a first survey of what astronomers have observed
  (white dwarfs, discs, brown dwarfs, flare stars, planets, systems of three stars) gives research
  with a line labelled *Observed*; state version 10. **Increment 30 is built:** 21 new
  technologies (54 in all) with tiers 4 and 5, each costing 7% more for every technology known;
  the lane relay, the orbital habitat (an outpost becomes a colony in orbit) and the terraforming
  station, with their pictures; the research screen as tabs on a phone and a grid with the queue
  beside it and arrow keys on a desktop; state version 11. **Increment 31 is built:** three pairs
  of doctrines, each closing the other; a technology costs 15% less for each met power that knows
  it (at most 30%); the Watch's rumours of rivals' great steps; science in the standings.
  **Increment 32 is built:** Great engineering and four great works to race for (one each in the
  neighbourhood, 4 pictures); a score in the standings and the headless games; rising costs at 8%.
  At turn 100 of the headless games the Authority knows about 37 technologies, the Cooperative 22
  and the Wake 22, on every seed within §2's targets; no power learns all it can before turn 180.
  **M2b is complete** and waits for the owner's try.
- **M3 "Neighbours"** ([design/M3_NEIGHBOURS.md](design/M3_NEIGHBOURS.md)), decided 22 October
  2026. **Increment 33 is built:** the shell, 149 real systems between 27 and 33 ly from the
  archives on 22 October 2026 (356 in all), in `src/data/shell.json` beside the unchanged census;
  no old lane reaches them, so they are reached by blind jumps and new lanes. The map's first
  load is 358 KB; a game's map, turns and saves stay within their budgets.
  **Increment 34 is built:** contact kept in the state (a signal, words while a tongue is learnt,
  talk; humans talk at once), in place of M2b's *met*; the Envoy, a seventh advisor with a face for
  each power; Translation in Xenology (62 technologies); state version 12.
  **Increment 35 is built:** every power's regard for the others, with its reasons (kin, how long
  known, character, and memories that fade: gifts, great works lost, settling beside); gifts of
  credits; the diplomacy screen (Y on a desktop; the menu and the Powers tab on a phone); state
  version 13.
  **Increment 36 is built:** treaties of open lanes and shared research, offered and answered by
  the player and the rivals alike, ended with notice or broken (and remembered); the rivals offer,
  send gifts and give notice by their character and regard; state version 14.
  **Increment 37 is built:** claims (a colony's system and every system one lane away), contested
  systems, the border treaty and the trade agreement; claims on the map and in the system panel.
  **Increment 37b is built:** exchanges of credits and resources; passage (one way, for a toll)
  and protection sold by a power whose character sells them (the Wake), paid every turn and lapsing
  when unpaid; the Wake's bribes; the lawful's regard for those who deal with outlaws; state
  version 15.
  **Increment 38 is built:** the Duskfolk, the first alien species (fiction), and their Dusk
  Concord at GJ 433 d in the shell, with a home web of its own lanes; a rival in every game, not yet
  one to lead; contact with it goes through words; its envoy, speaker and people pictured.
  **Increment 39 is built:** the Drifters, who live only on giant planets (fiction), and their Drift
  Moot at HD 192310 c, brokers of fusion fuel; five powers in every game with rivals.
  **Increment 40 is built:** the proof with five powers: every power within M2b's targets at turn
  100 on all eight seeds (the Cooperative's shared-research ask raised to 20), every alien met by
  turn 120, no one through the tree before turn 180. **M3 is complete** and waits for the owner's
  try.
- **Numbers (after M2b):** 425 unit tests and about 230 browser journeys pass; state version 11;
  the tree has 61 technologies (58 for any one power), 22 projects; a colony's still on a phone
  loads 761 KB of pictures at most (1 MB) and its diorama 2.04 MB (2.25 MB, raised from 2 MB for
  the great works); before M2b: the title loads 21.2 KB of its
  40 KB budget, a game's map about 319 KB of 900 KB, opening a colony 9.5 KB of code more (40 KB);
  a colony's still on a phone loads 658 KB of pictures at most (1 MB) and the diorama it opens
  1.62 MB (2 MB), both measured over the game's own scenes with the game's own choice of widths;
  state version 9.

## 2. The next job

The owner was sent every music candidate, lettered, to choose by ear, and the lettered sheet of
increment 20's district buildings; apply any overrule they send (`npm run music:approve` /
`npm run art:approve` with the candidate they name; candidates live in the git-ignored
`music/out/` and `art/out/`, so a pick from a lost session means new candidates).

**The main track is M2 "Worlds"** ([design/M2_WORLDS.md](design/M2_WORLDS.md)), in the order of
its §18. Increments 20 (districts, food, credits and approval, built as one), 21 (projects and
research), 22 (advisors and the report), 23 (governors and edicts), 24 (rivals that play), 25
(events), 26 (the guided opening) and 27 (the proof) are done: **M2 is complete.** The owner was
asked to play a game of 50 turns or more on a phone and a desktop and say what was dull, unclear,
slow or too easy (§29.5); their answers decide M3's first changes.

**Done: M2b, *Science and rivalry*** ([design/M2B_SCIENCE.md](design/M2B_SCIENCE.md)), after M2's
headless games showed two rivals stuck at 5 research a turn and the third through the whole tree by
turn 90. D-44 to D-50 were answered *as recommended* on 21 October 2026, and increments 28 to 32
were built as its §12 set out, each with a detailed design section first (§16 onwards) and its
notes as built. **M2b is complete.** The owner was asked to try it (a game of
50 turns or more on a phone and a desktop) and may overrule the picture picks of increments 30
and 32 (lettered sheets sent).

**Now: M3 "Neighbours"** (SCOPE.md §5), [design/M3_NEIGHBOURS.md](design/M3_NEIGHBOURS.md): first
contact and translation, treaties without war, borders and claims, trade, memory of what each
power did, and the first two alien species, in increments 33 to 40. D-12 and D-51 to D-57 were
answered *as recommended* on 22 October 2026 ([DECISIONS.md Round 6](DECISIONS.md#round-6-neighbours-decided-22-october-2026)),
which gives leave to run the sky fetch on GitHub's runners (D-51) and raises the art budget to
about $50 (D-57). As in M2b: write each increment's detailed design section (§18 onwards) before
building it, and send each increment's pictures as lettered sheets, recorded in DECISIONS.md with
their cost. **Done: increment 33, the shell** (§18): 149 real systems between 27 and 33 ly
(356 in all), laneless, from the archives on 22 October 2026 (`npm run data:shell`); the census
and saved games unchanged. **Done: increment 34, contact** (§19): signal, words and talk between
powers, the Envoy (a seventh advisor), Translation; state version 12. **Done: increment 35,
memory** (§20): attitudes with their reasons, gifts, and the diplomacy screen; state version 13.
**Done: increment 36, treaties** (§21): open lanes and shared research, offered, answered, ended
with notice or broken, and the rivals dealing by character; state version 14. **Done: increment
37, borders and trade** (§22): claims round every holding on the map, contested systems, the
border treaty and the trade agreement. **Done: increment 37b, exchanges and the Wake's dealings**
(§23): exchanges of resources, passage for a toll, protection and bribes (D-56); state version 15.
**Done: increment 38, the Duskfolk** (§24): the first alien species and its power, the Dusk
Concord, a rival in every game. **Done: increment 39, the Drifters** (§25): the second, the Drift
Moot, brokers who live on giants. **Done: increment 40, the proof** (§26): five powers in the
headless games, the 100-turn journeys on CI. **M3 is complete.** The owner is asked to try it (a
game of 100 turns or more on a phone and a desktop, to meet the aliens) and may overrule the
names, the picture picks of increments 38 and 39, and the tuning recorded in DECISIONS.md. M4
(*Fleets*) is next.

**Now: M4 "Fleets"** ([design/M4_FLEETS.md](design/M4_FLEETS.md)), proposed on 22 October 2026 on
the owner's direction (D-58: "Yes, I would like the possibility to have battles and wars"):
warships and designs, fleets, battles with orders and a 3D replay, war and peace, defences and
invasion, the outlaw's raids, the Assembly (the council), rivals at war, and the first victories,
in increments 41 to 50. Its questions (D-59 to D-68, D-14, D-17) were answered *as recommended*
the same day ([DECISIONS.md Round 7](DECISIONS.md#round-7-fleets-decided-22-october-2026)). As in M3:
write each increment's detailed design section (§21 onwards) before building it. The owner has not
yet played M3; their try, when it comes, is recorded there too. **Done: increment 41, warships**
(§21): five hulls, 22 modules, the yard's designs and the player's own (*Designs*, **B**), refits,
the Weapons field (17 technologies, 79 in the tree), upkeep by hull, the Admiral (an eighth
advisor, 3 faces); state version 16. **Done: increment 42, fleets** (§22): every warship sails in a
fleet, named in its power's word, moved and ordered as one, with its stance, target and retreat
point kept for battle; formed, merged, split and joined; state version 17. **Done: increment 43,
war and peace** (§23): war declared at once (treaties end, everyone remembers, allies join), peace
offered and answered with a truce of 10 turns, non-aggression and alliance, forced passage over an
enemy's lanes, interception where its warships wait, war weariness; state version 18. **Done:
increment 44, battles** (§24): rounds at three ranges by each fleet's orders, Reborn's damage
matrix, retreat, damage that stays and repairs near home, the battle and its reasons in the report,
rivals arming when at war; state version 19. **Done: increment 45, the replay** (§25): *Watch* on
each battle in the report opens it in 3D in the map's place, each power's ships from Reborn's kit
(and two alien builders of our own), shots by kind, shields flaring, ships breaking up; play,
pause, a round at a time, rewind, faster and skip; the account beside it; its code loads only when
watched (30 KB); state version 20. **Done: increment 46, defences and invasion** (§26): the defence
battery, planetary shield and barracks, a garrison from each colony's people, troop transports,
invasion as a fleet's mission with the commanders' radio traffic, bombardment, blockade, colonies
and capitals changing hands, rivals building batteries at war; turns made about twice as fast;
state version 21. **Done: increment 47, raids** (§27): the Wake's fleets raid without war and take
plunder, protection bought keeps them off, and an outlaw's raiders may sail the lanes of those they
may raid. **Done: increment 48, rivals at war** (§28): the rivals declare war by character and say
why, arm against their neighbours, gather strikes with troop transports and invade, make peace on
their own terms, and surrender when beaten; any power may surrender and pay tribute; state version
22. **Done: increment 49, the Assembly** (§29): it forms once three powers can each talk with the
other two; votes by people; an election every 20 turns, two thirds choosing a leader; sanctions and
calls for peace proposed and voted on, by the player and the rivals; its own screen (**G**), with
its chamber's picture; state version 23. **Done: increment 50, victory, defeat and the proof**
(§30): conquest, the Assembly's choice and the highest score at a turn limit (150, 200, 250 or
none; 250 by default); a power with no colony leaves the game; the end screen with its picture,
the story in numbers and *Play on*; late turns made about twice as fast; the headless games played
to their end (six of eight won by the Assembly's vote, all by the Cooperative: D-69 asks the
owner); state version 24. **M4 is complete.** **Done: increment 51, many roads to victory** (§31,
D-69 as the owner chose): war plans that strike anywhere the lanes reach and the capital first; the
Wake and the Concord as conquerors that arm, fall on the weak and see a war through; the balance of
power; fear at the Assembly's deciding vote and tiring of a long leader; a less-loved Co-op; works
in the score; state version 25. Three different winners in the eight headless games (the target was
four), none by the vote; shipped on the owner's standing leave, with a switch for every change
(M4_FLEETS.md, *Increment 51*). The owner is asked to try it.

**Now: M5 "The unknown"** ([design/M5_UNKNOWN.md](design/M5_UNKNOWN.md)): the Absent and their
mystery, relic sites excavated in chapters, the keys and the Answer (a fourth road to victory),
guardians, leaders, light espionage, more events, the dying star and the unhomed, and the machine
heirs, in increments 52 to 60. On 22 October 2026 the owner gave standing leave to go on by best
judgement without asking, as long as every major change is documented and reversible; so D-13 and
D-70 to D-78 are **assumed as recommended** ([DECISIONS.md Round 8](DECISIONS.md#round-8-the-unknown-assumed-22-october-2026)),
and the owner may overrule any. D-18 (Steam, money) stays the owner's. As before: write each
increment's detailed design section (§20 onwards) before building it, note it as built, and say in
it how to undo it. **Done: increment 52, relic sites** (§20): twelve sites a game, within reach
of the powers, found by survey or Old charts, excavated in chapters with a share of research, each
chapter a choice and a revelation of the Absent, kept in the journal on the Relics screen (**J**);
three Xenology technologies; the rivals digging by character; governors and rivals kept out of
deep debt; state version 26. **Done: increment 53, the keys and the Answer** (§21): five keys, one near each
capital, found with a site's third chapter, taken and lost with their holding, feared; the Answer
(10 turns with all five and The instrument) and victory by the keys; every rival that does not call
for peace goes to war on it; a road for the rivals to the sites; fear at the deciding vote mended;
state version 27. No headless game is won by the keys, and the Co-op still wins most: both for M6. **Guardians deferred to M6** (§7). **Done: increment 54, events and the living
sky** (§22): thirteen events more, twenty-five in all, five of the relics, three of the sky (a great
flare and a nova, real astronomy marked) and one for each power. **Done: increment 55, light
espionage** (§23): agents watch a power for credits, learning its holdings, its ships and its
secrets as their intelligence rises; a guard at home; the rivals by character from turn 100; state
version 28. **Done: increment 56, leaders** (§24): five callings (commander, steward, scholar,
ambassador, spymaster) with twelve traits that grow and two flaws; three people offered every 10
turns; wages; leaving in debt or from an unhappy colony, lured by a rival that knows our secrets,
fallen with a fleet; the Leaders screen (**L**) and a leader's line where they serve; twenty faces;
the rivals hire by character from turn 70; state version 29. **Done: increment 57, the dying star
and the unhomed** (§25): the arks of the Unhomed arrive at CE Boötis between turns 110 and 150 and
ask every power for a world (give, take in, refuse); Arcturus dies 12 turns later (real star,
fictional death); the Last Hearth, a sixth power, arrives in mid-game with a coral cross; state
version 30. **Done: increment 58, the balance of power** (§26), moved before the machine heirs and
cut down by what was measured: a *scrap* order for ships, and rivals in debt scrapping what they
cannot pay for (deepest debt −518 → −156). The wariness of a leader and a sooner balance-of-power war
changed no winner and were taken out; **D-79, the Co-op's lead in long games, is open for the
owner** with the measurements; assumed A on the owner's leave (left for M6). **Done: increment 59, the
machine heirs** (§27): the Continuance, a sixth power at the start (lime, a pentagon), self-copying
machines the Absent left at the Forge, a fictional world of the real white dwarf GJ 3306; they eat
nothing, grow by building copies, and dig half again as fast; not yet playable. **Done: increment 60,
the proof** (§28): M5 measured against its targets with six powers; the Forge made a relic site of
its own, since the heirs could reach none; raids mended (a holding plundered once a turn, nothing
taken from an empty treasury; deepest debt −131); four different winners in the long games. **M5 is
built**; its last condition, the decision on Steam (D-18), is the owner's. Missed, for M6: a game
won by the keys by a rival, the Co-op's fourth win (D-79), every site found by turn 150.

**Now: M6 "1.0"** ([design/M6_ONE.md](design/M6_ONE.md)), on the owner's leave renewed on 23 October
2026: lessons for every system when it first matters, accessibility checked in CI with a list for
the map, the keys within the rivals' reach, guardians, the Concord to play, music for war and the
end, the long game's targets for 1.0, polish on phones, and the proof, in increments 61 to 69.
D-80 to D-86 are **assumed as recommended** ([DECISIONS.md Round 9](DECISIONS.md#round-9-10-assumed-23-october-2026));
D-85 keeps one map for 1.0. **Done: increment 61, lessons when they matter** (M6 §20): sixteen
lessons from the advisors, each told once on the device the first time its system matters, kept in
the codex's *How to play*. **Done: increment 62, accessibility** (§21): an accessibility checker on
every main screen in CI, Enter that presses a focused button, dialogs that take focus and give it
back, a list of every system (**K**), and the largest text on a phone without sideways scrolling. **Done: increment 63, the keys within
reach** (§22), measured: no small change lets a rival win by the keys (missed, recorded; the keys
stay the player's road); kept: a rival that digs settles its site first, from turn 20, which gives
the long games five different winners. **Increment 64, guardians: deferred again to after 1.0**
(§23), since no rival can gather the keys they would guard. **Done: increment 65, playing the
Concord** (§24): the Dusk Concord is the fourth power to lead, the first not human, with its colonies
in 50 pictures, its advisors' faces, its scene and its colonies' music. **Done: increment 66, music
and sound for 1.0** (§25): a piece for the map at war, one for victory and one for defeat on the end
screen, and two sounds after a turn's tone: a muffled double thud for a battle fought, two bells for
a key found or taken. **Done: increment 67, the long game for 1.0** (§26): rivals now race for the
great works once any power begins one (none had ever built one, so a player took all four
unopposed); the targets for 1.0 measured: five winners with the Co-op one over the three, no win by
the keys, debt and the budgets within their limits. **Done: increment 68, polish and phones** (§27):
the Concord played to turn 150 on a phone with every screen looked at (`npm run journey`), what it
showed fixed (titles on the menu's screens, the chosen step lit, plainer words), load and speed
measured with phone throttling (`npm run phone-speed`: title 1.0 s, map 3.5 s), British words tested.

The art and music spend: about $40.00 of $50 (raised on 22 October 2026; about $10.00 left). M3's
art is about 65 pictures (about $6.50).

### Trying M5 (for the owner)

What is new since M4, and where it is (the desktop's key in brackets):

- **Relic sites** (Relics, **J**): learn *Relic studies* and survey to find them; found an outpost
  at one and *Excavate*. Each chapter asks a choice (study it for research, or take what it gives)
  and tells a revelation of the Absent, kept in the journal.
- **The keys and the Answer** (Relics, **J**): five sites hold a key, found with their third
  chapter. Hold all five and learn *The instrument*, and you may begin the Answer: ten turns, while
  every rival that does not call for peace comes for you. Done, you win by the keys.
- **Events** in the report, with pictures: twenty-five in all, the great flare and a nova among
  them, each marked real or fiction.
- **Agents** (Diplomacy, **Y**, under each power you have met): watch a power to learn its
  holdings, its ships and its secrets; set a guard at home.
- **Leaders** (**L**): three people are offered every ten turns; hire them and post them to a fleet,
  a colony, the research, the diplomacy or the agents. They grow with service and may leave.
- **The arks of the Unhomed:** between turns 110 and 150 they come to CE Boötis and ask every power
  for a world (*What needs you* takes you there): give one, take them in, or refuse.
- **The Continuance:** the machine heirs, a sixth power in every game, at the Forge (GJ 3306).
- **Scrap** a ship from its panel to save its upkeep.

A good first try: lead the Transit Authority, which digs best, and play past turn 110 to meet the
arks. What would help most to hear: whether the chapters are worth the research they take, whether
leaders and agents are worth their credits, whether the arks' choice feels like a real one, and
D-79 (the Co-op's lead in long games).

## 3. Standing instructions from the owner

- **Documentation first; key decisions are the owner's** (CLAUDE.md). Anything the documents do not
  cover goes into DECISIONS.md with options and a recommendation, and is asked before it is built.
  Small, reversible engineering choices are made and listed under *Made without waiting*.
- **The Gemini key** is in the environment as `GEMINI_API_KEY`. **Never print, log, commit or echo
  it.** There is no OpenAI key; that is expected. If the Gemini key is missing or refused, stop and
  tell the owner exactly what you saw.
- **Art spend (D-27):** about **$50 in all** may be spent without asking (raised on 22 October
  2026); about **$27.55** is spent (after increment 50), so about **$22.45** is left. Nano
  Banana (`gemini-nano-banana-2.1`, about $0.05 a picture) for everything (D-23). Record every
  batch with its cost and the running total in DECISIONS.md.
- **Pictures:** candidates go to `art/out/`, which git ignores, so they are lost with the session.
  Send the owner a **lettered contact sheet** of the candidates (as a file) when you choose, so
  they can overrule (`--batch` puts several briefs on one sheet). Approve with `npm run art:approve`; every published picture needs its record,
  and `npm run check` fails without one. Pictures carry **no *Illustration* label** (D-29): that
  they are made with an image model is said in the codex's credits and in the records.
- **Phone and desktop, both first-class (D-04); several powers, never assume the player is human or
  one particular power (D-08).**
- **British English**, plain words, short sentences; real astronomy is real and **everything
  invented is labelled fiction**; nothing (names, text, art, music, data) from *Master of Orion*
  or any other game.
- **Shipping:** each increment keeps the game playable, passes `npm run check` and the browser
  journeys, is committed (with the session's attribution lines), and is pushed to your designated
  branch **and to `main`** (D-21). Then confirm the GitHub Pages deploy, check CI on `main`, and
  tell the owner what is live. No pull requests unless asked. When a milestone is done, mark it in
  SCOPE.md and change the title screen's status line (`src/ui/Title.tsx`: *In development · M4,
  Fleets · …*) to say so; the owner found it still saying M1 after M4.

## 4. Working in this repository

```bash
npm ci                 # Node 22.18+
npm run dev            # http://localhost:5173
npm run check          # typecheck, lint (Biome), art records, unit tests, build, size budgets
npm run format         # Biome's formatting and safe fixes (run before check)
npm run test:e2e       # browser journeys: phone 390×844, tablet 820×1180, desktop 1440×900
npm run screenshots    # ten sizes into test-results/screens/<screen>-<size>.png
npm run journey        # the Concord to turn 150 on a phone, every screen into test-results/journey/
npm run phone-speed    # load and speed with a phone's throttling (title, map, a turn, frames)
npm run art:generate -- --brief <id>[,<id>…] --provider gemini --count 2
npm run art:key -- --brief <id>[,<id>…]             # key a landscape's or building's candidates
npm run art:sheet -- --brief <id>                   # one brief at a time (keyed ones on a checkerboard)
npm run art:approve -- art/out/<brief>/<file>.jpg   # keys it too, when its series is keyed
```

**Where things are:**

- `src/sim/`: the rules, pure TypeScript with whole numbers, run in a Web Worker; the state's
  version and migrations are in `save.ts`, and every rule has unit tests in `tests/unit/`.
- `src/content/`: the game's data: factions, species, projects, ships, technologies, anomalies,
  rules.
- `src/render/`: three.js. `MapView.ts` is the map, with its sky, fields, sparks and flights.
  `SystemScene.ts` is the system in 3D, using Reborn's procedural art copied into `art/`.
  `TitleScene.ts` is the title. `milkyWay.ts` bakes the sky and provides the backdrop and the faint
  stars. `systemLayout.ts` is the pure layout of a system. The colony view: `colonyScene.ts` (what
  a colony's scene shows, pure), `colonyPlace.ts` (where its buildings stand), `colonyLife.ts`
  (the day, walkers, the shuttle, the weather, pure), `colonyStill.ts` (the panel's still, Canvas
  2D) and `ColonyView.ts` (the diorama, three.js on the map's renderer).
- `src/ui/`: Preact and Signals (never React). The map screen and its panels are in `map/`: the
  colony's panel, the empire and the stockpile in `colony.tsx`, its still in `ColonyStill.tsx` and a
  building's card in `ColonyCard.tsx`; the report, its pictures and dispatches in `play.tsx`. The console's skin is `console.css`, with `icons.tsx`, `count.tsx`, and
  the emblems in `parts.tsx`.
- `src/app/`: the game's state on the page, saves, settings (text size, motion, quality, sound),
  and `sound.ts`.
- `art/`: `briefs.ts` (with each power's architecture, written once), `styles.ts` and
  `manifest.json` (the provenance records); the scripts are in `scripts/art/`, and approved
  pictures are served from `public/art/`. `src/content/colonyArt.ts` lists the colony view's
  pictures, each landscape's horizon and slots, and each piece's width in metres.

**Lessons from the last sessions:**

- **After ending a turn, wait for the report before closing it.** On CI's slower machine the date
  turns a moment before the report opens; an *Escape* sent in between is lost, and the report then
  covers whatever opened next (CI failed on increment 18's first push this way).
- **Never `pkill -f "vite preview"`:** the pattern matches the shell running the command, which
  kills it. Stop a preview by its process id (`ps aux | grep "preview --port"`).
- **Props are placed after the buildings** (`placeProps` in `colonyPlace.ts`), beside each building's
  foot first; a prop with no free place is simply not drawn. Layouts are quickest checked by drawing
  the boxes over a landscape with sharp before any browser run.

- The journeys' web server (`vite preview` on port 4173) is **reused if one is already running**,
  and it serves `dist/` from disk. Rebuild (`npm run build`) before running journeys, and never
  rebuild while a run is going.
- **Pass `?test` in the address for test hooks:** `window.__map` (`screenOf`, `moving`, `animating`,
  `fieldCount`, `sparkCount`, `flying`, `orbit`, `visibleLabels`), `window.__system`, and
  `window.__colony` (`info` with its `props` and `pictures`, `life`, `look`, `buildingsOnScreen`,
  `propsOnScreen`, `pointOn`, `setClock`). Use seed `4242` (the *More* section on the new-game
  screen) when a journey needs fixed numbers.
- **Nothing that can be pressed may slide or move as it appears.** Use opacity, or a scale about its
  middle. Reduced motion zeroes the animations' delays as well as their lengths. A tap during a
  sliding entrance misses, and that broke journeys twice.
- **CI is slower than this container** (software rendering, 4 cores): reproduce CI-only failures
  with `taskset -c 0,1 npx playwright test … --workers=2`. Long journeys use `test.slow()`. The map
  and the title lower their frame rate on a device that cannot keep up; keep any new animation
  loop the same.
- Wait for state rather than reading it on the first frame (labels, a scene being ready); poll with
  `expect.poll`.
- **Confirm a deploy** by fetching the live page's `assets/index-*.js` and finding the commit's short
  hash in it (the build id is in that chunk).
- With reduced motion, tests use `test.use({ contextOptions: { reducedMotion: 'reduce' } })`.
- **A background command stops at its time limit (30 minutes by default)**, and that includes a
  `vite preview` started in the background: start it with a long limit before a full run, or the
  last journeys fail in a quarter of a second against a dead server. A full run at two workers
  takes about 25 minutes here.
- **A machine of four cores starts on the low quality setting** (this container and CI): no
  weather in the colony view, 20 people at most. A journey that needs more sets the quality in
  `localStorage` (`starman-control:settings`) with `page.addInitScript`.
- **Generating pictures:** each power's buildings come out at a steeper angle than asked; asking for
  "walls seen more than roof" and a landscape seen from a raised viewpoint made them match. A
  subject that says "courtyard" or "earth bank" invites a top-down view or a cut-off bank of
  soil. A flat backdrop is seen through glass: keying despills any pixel whose red and blue both
  stand above its green. The haze and ice grounds need their own backdrops (horizon-only mist;
  a magenta sky).
- **M2's journeys take longer:** every new game now has rivals and events, and a full local run
  at two workers took about 95 minutes. Run the specs an increment touches locally on all three
  sizes, and let CI run the whole suite on the branch and on `main`.
- **The 100-turn games** (`long.spec.ts`) run as their own projects, `long-phone` and
  `long-desktop`, which depend on every other project: they run last, alone, because their load
  slowed other journeys' first frames on CI. `--no-deps` runs them by themselves.
- **End turn stays disabled until the last turn is saved**; a press before then is ignored. A
  journey that ends many turns waits for the button to be enabled first.
- **Setting a game up:** with `?test`, `window.__setGame(state)` puts a modified copy of
  `window.__game()` into play (structured-clone it first), so a journey can start some way on.
- **More test hooks** (`?test`): `window.__game()` (the game as it stands), `window.__lastTurnMs()`
  (the last turn, from the press to the next quarter in the game), and `__map.shipMarks`. Guiding
  stays off in tests unless the address says `guide`; music unless it says `music`.
- **Headless questions** (what do the rivals do by turn 50?) are quickest answered with a
  throwaway unit test that plays turns with `resolveTurn` and writes what it finds to a file; delete
  it after. `npm run balance` writes the standing report to `docs/design/M2_BALANCE.md`.
- **Overlapping increments:** keep each one its own commit. A fix found later in an unpushed
  increment is folded into it with `git commit --fixup=<sha>` and
  `GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash <base>` (commit or set aside other work first);
  a worktree at an increment's commit (`git worktree add`, with `node_modules` linked) checks and
  tests it exactly as it will ship.

## 5. Also open

- The owner's try of M1 on a real phone.
- The owner's choice by ear of the Concord's colony music (three candidates sent, lettered; A in
  the game, chosen by measure), and of its pictures (the lettered sheets).
- The leaders journey failed once on the tablet (23 October 2026) while headless games loaded the
  machine: the tablet had switched to the desktop layout, as it does after a mouse move or a key
  outside a field. It passed three times alone. If it recurs in CI, find what counts as desktop input.
- The owner's choice by ear of the war, victory and defeat pieces (three candidates each sent,
  lettered; C of each in the game, chosen by measure). Another letter is one `npm run music:approve`.
- `npm audit` (23 October 2026) reports three advisories in Vite's development server (8.3.1, fixed in
  8.3.5): they touch `npm run dev` only, never the built game. Raise Vite's pin once 8.3.5 is two
  weeks old.
- The owner's choice of music by ear (every candidate was sent, lettered), of increments 20's and
  21's buildings and of increment 22's faces (the sheets were sent).
- The owner may overrule the report pictures chosen in increment 13 (DECISIONS.md, 19 October),
  and any of the colony view's (COLONY_VIEW.md §8).
- CI on `main` failed once on increment 15 (a phone journey waited 10 s for a scaffold that a
  starved machine took longer to load); increment 17 gave scene updates 30 s and made taps aim
  where a building really shows, and CI passed on 16 and 17. Look at the latest run before
  starting.
- Round 2 decisions (D-13, D-14, D-17, D-18) are for later milestones; D-15 was decided with M2,
  and D-12 is proposed for M3 in Round 6.
- Not chosen for now (D-30): second versions of the projects, halls and rigs; cold and hot homes;
  more for the colony scene (a parent planet in a moon's sky, a hull on the shipyard's pad).
