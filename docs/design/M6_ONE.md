# M6 · 1.0

*Proposed 23 October 2026, after M5. The owner renewed their standing leave the same day: "continue
with development according to your best judgement, without asking me anything", asking that "any
major impact on the game is well documented and reversible, so I can maybe change directions later
on". So each question below has its options and a recommendation as before, and is recorded in
[DECISIONS.md, Round 9](../DECISIONS.md#round-9-10-assumed-23-october-2026) as **assumed on the
owner's leave**: built as recommended, and the owner may overrule any of them. Each increment gets a
detailed design section (§20 onwards), written before it is built, with its notes as built.*

SCOPE.md's M6: *balance from AI-against-AI games, the guided opening, music and sound,
accessibility, the wider map sizes, polish.* Done when *the owner is happy to call it 1.0*: that is
the owner's alone, so M6 ends with a proof and the owner's try.

## Contents

1. [Where M6 starts](#1-where-m6-starts)
2. [Goals](#2-goals)
3. [Out of scope](#3-out-of-scope)
4. [Lessons when they matter (D-80)](#4-lessons-when-they-matter-d-80)
5. [Playing an alien power (D-81)](#5-playing-an-alien-power-d-81)
6. [The keys within everyone's reach (D-82)](#6-the-keys-within-everyones-reach-d-82)
7. [Guardians (D-72, carried from M5)](#7-guardians-d-72-carried-from-m5)
8. [The long game, balanced (D-83)](#8-the-long-game-balanced-d-83)
9. [Accessibility (D-84)](#9-accessibility-d-84)
10. [Map sizes (D-85)](#10-map-sizes-d-85)
11. [Music and sound (D-86)](#11-music-and-sound-d-86)
12. [Polish and phones](#12-polish-and-phones)
13. [Increments](#13-increments)
14. [Tests and budgets](#14-tests-and-budgets)
15. [Art, music and their cost](#15-art-music-and-their-cost)
16. [Decisions](#16-decisions)
20. [Increment 61 in detail: lessons when they matter](#20-increment-61-in-detail-lessons-when-they-matter-written-before-building-it)
21. [Increment 62 in detail: accessibility](#21-increment-62-in-detail-accessibility-written-before-building-it)
22. [Increment 63 in detail: the keys within reach](#22-increment-63-in-detail-the-keys-within-reach-written-before-building-it)
23. [Increment 64: guardians, deferred again](#23-increment-64-guardians-deferred-again)
24. [Increment 65 in detail: playing the Concord](#24-increment-65-in-detail-playing-the-concord-written-before-building-it)
25. [Increment 66 in detail: music and sound for 1.0](#25-increment-66-in-detail-music-and-sound-for-10-written-before-building-it)
26. [Increment 67 in detail: the long game for 1.0](#26-increment-67-in-detail-the-long-game-for-10-written-before-building-it)
27. [Increment 68 in detail: polish and phones](#27-increment-68-in-detail-polish-and-phones-written-before-building-it)
28. [Increment 69 in detail: the proof](#28-increment-69-in-detail-the-proof-written-before-building-it)

## 1. Where M6 starts

- **Six powers start every game with rivals** on 356 real systems out to 33 light-years: the three
  human powers, which the player may lead, and the Dusk Concord, the Drift Moot and the Continuance,
  which play only as rivals. The Last Hearth may arrive in mid-game (M5).
- **Every system of M1 to M5 is built:** worlds, colonies and the economy; research; contact,
  diplomacy and the Assembly; fleets, battles, war and invasion; relic sites, the keys and the
  Answer; events; agents; leaders; the arks. A game can be won by conquest, by the Assembly's choice,
  by the keys or on score at the turn limit.
- **The guided opening** (M2, D-40) teaches the first twenty or so turns of M2's economy: the
  capital, the queue, survey, research, taxes, settling, lanes, governors. **Nothing teaches what
  came after:** contact and words, treaties, the Assembly, warships, war and invasion, raids, relic
  sites and their chapters, the keys, agents, leaders, the arks. The advisors comment in the report,
  but a new player meets most of M3 to M5 unexplained.
- **The aliens cannot be played** (D-08: "alien species later"). Their rules are complete, as every
  rival plays by the player's rules; what is missing is what a player sees: their colonies in
  pictures (the human powers have 45 buildings each), their advisors' faces (only the envoys have
  one), the new game's picture of them, and their colonies' music.
- **The keys are the player's road only.** In the eight headless games no rival holds more than two
  of the five keys; they end spread among three or four powers (M5_UNKNOWN.md §28).
- **Guardians were deferred** from M5 (D-72), since a battle assumes each side is a power.
- **The headless games** (M2_BALANCE.md): four different winners (the Co-op 4, the Continuance 2,
  the Wake 1, the Concord 1); one game won before the limit, by the Assembly; turns within 143 ms and
  saves within 174 KB on the machine that measures them; the deepest debt −131.
- **Accessibility** so far: a text size setting, reduced motion, a shortcut for every action on the
  desktop, every power's colour paired with a shape, labelled controls. Nothing checks it
  automatically, and the map is a picture with no text alternative but the search.
- **Music** (D-31, Lyria): seven pieces, for the title, the map, a system and the three human powers'
  colonies. Interface sounds are made in the browser.
- **Not yet tried by the owner on a real phone** since M1.

## 2. Goals

1. **Every system explained when it first matters,** by the advisor whose work it is, in a sentence
   or two, never in the way.
2. **An alien power to play** (D-08), the first that is not human.
3. **The keys a road the rivals can take too,** so the fourth victory is a race, not a puzzle only
   the player solves; and the guardians that make a key cost a fight.
4. **A long game that is balanced:** many winners, by more than one road, with no power broke.
5. **Accessible to more people:** checked automatically, every screen usable by keyboard and screen
   reader, readable at the largest text size on a phone.
6. **Music for the moments that matter,** and sound that tells what happened.
7. **Polished:** nothing that looks unfinished on a phone or a desktop, and fast enough on a phone.

## 3. Out of scope

- **Several players** (hot seat or online): after 1.0, if ever.
- **A store build** (Steam, app stores): D-18 is the owner's; nothing in M6 depends on it.
- **The under-ice thinkers and the chorus** (M5_UNKNOWN.md §12), **sabotage and theft** (SCOPE §4.10,
  *later*): after 1.0.
- **A composer's score** (D-31, D): if the game earns it, after 1.0.
- **Pyre on the map** (D-78 stays A).

## 4. Lessons when they matter (D-80)

**The lessons.** The first time something that needs explaining happens to the player, the advisor
whose work it is says what it is and where to act, in the power's voice: a card like the guided
opening's, with *Got it*, never blocking anything, lit round the control when it is on the screen.
About fifteen, each told once a game:

| When | Who | What it says, in short |
| --- | --- | --- |
| First contact | the Envoy | who they are; words grow each turn until we can talk |
| We can talk | the Envoy | treaties, and how they regard us (Diplomacy) |
| The Assembly forms | the Envoy | votes by people; elections; resolutions |
| A rival's warship near us, or our first warship | the Admiral | designs, fleets and their orders |
| War declared, by or on us | the Admiral | fleets, defences, invasion, peace |
| First raid on us | the Watch | the outlaw's raids; warships or protection |
| A relic site known | Science | excavation, the share of research, chapters |
| A chapter waiting | Science | the choice; the journal |
| A key found by anyone | Science | the five keys and the Answer |
| Leaders offered | Colonies (or the Envoy) | callings, posts, wages |
| Agents possible | the Watch | watching a power, guarding home |
| The arks arrive | the Envoy | their ask and our three answers |
| An event with a choice | its advisor | events and their choices |
| Hunger, unrest or debt for the first time | that advisor | what causes it and the cure |

**Kept for later.** Every lesson told is kept in the codex, under *How to play*, in the order told,
with the rest listed as *not yet met*; the codex also has a short written summary of every system,
for a player who wants to read ahead.

**Settings.** The guide setting already chooses *on* or *off*; *off* turns the lessons off too. A new
setting is not needed.

**Options:**

- **A. Lessons when they matter, kept in the codex (recommended):** short, in the moment, in the
  advisors' voices, as the guided opening is, and readable again.
- **B. A written manual only,** in the codex: least work, but read by few.
- **C. A second scripted tutorial** after the opening (a war, a relic): thorough, but long and in the
  way of a game already under way.

## 5. Playing an alien power (D-81)

**What a power needs to be played,** besides its rules, which every rival already has:

- **Its colonies in pictures:** 45 buildings in its architecture (homes in three sizes, open and
  domed, three versions; districts; projects; ships on the pad), as each human power has.
- **Its advisors' faces:** seven more (only the envoy has one).
- **Its picture for the new game and the title,** and its card's words.
- **Its colonies' music:** one piece.
- **The guided opening and the lessons** in its voice (each power has a voice already).

**Which first.** The **Dusk Concord** (the Duskfolk, at home in the ring of dusk on tidally locked
worlds, M3_NEIGHBOURS.md §24) builds on the ground, like the human powers, so the colony view needs
nothing new but its buildings. The **Drift Moot** lives in the air of giant planets: its colonies
need a new kind of ground (a cloud deck) and its own scene. The **Continuance** came in M5 and is the
least written.

**Options:**

- **A. The Concord in M6, the Moot and the Continuance after 1.0 (recommended):** one alien power to
  play for 1.0, about $5.50 of pictures and music; the others when their art fits the allowance.
- **B. The Concord and the Moot in M6:** about $12, most of what is left of the $50 (D-27), and a
  new kind of colony scene for the Moot.
- **C. None for 1.0:** the three human powers only.

## 6. The keys within everyone's reach (D-82)

**Why the rivals never gather the keys** (M5_UNKNOWN.md §21, §28): each key lies at the site
nearest one capital, so each power finds the one near it; the rest are across the map, held by
others. A rival takes a key only by war, and goes to war for keys only once it holds three. No one
trades a key. So the keys end spread among three or four powers.

**What could change:**

- **The hunt:** a power holding two keys and knowing where the rest lie (*The second tone*) makes the
  keys its war aim: its war plans strike key holdings first, as far as its lanes reach, and it
  builds the road to them; a power that holds a key fears such a hunter (it arms, and seeks pacts).
- **Keys in exchanges:** a key may be given in a dealing, as credits or a treaty are; a rival gives
  one only to a friend that does not frighten it, and never the last it needs to stop another.
- **Three keys for the Answer** (D-71's option C): shorter games, and the race open to anyone with
  one war won.

**Options:**

- **A. The hunt first, then keys in exchanges, each measured; three keys only if both fail
  (recommended):** the smallest changes that make the keys a race, each with its switch, kept only if
  the headless games show a rival reaching the Answer without the game ending too soon.
- **B. Three keys for the Answer, now:** simplest; changes D-71 for the player too.
- **C. Leave the keys the player's road:** honest, but the fourth victory stays a puzzle.

## 7. Guardians (D-72, carried from M5)

As M5_UNKNOWN.md §7: old machines of the Absent at **every key site and about a third of the
others**, that do not talk, move or leave (fiction). A guarded site cannot be excavated until they
are beaten; they fight as a colony's battery does, from a side of their own, against an armed fleet
sent with the order *clear the guardians*; beaten, they are gone; not beaten, they mend. A risky
choice in a chapter may wake them.

**What M6 adds:** a side in battle that is no power (battles, replays and reports learn it); the
rivals' fleets clear the guardians of a site they would dig; and the order comes after §6, so the
keys are first a race the rivals can win. **No new decision:** D-72 stays A, built now.

## 8. The long game, balanced (D-83)

**The targets for 1.0,** in the eight headless games to turn 250, for the owner to overrule:

- **At least four different winners, none winning more than three** (D-69's, carried on).
- **At least one won by the keys** (M5's, carried on).
- **No treasury below −200,** and none in debt for more than 30 turns in a row.
- **Turns within 200 ms and saves within 200 KB** on the measuring machine.
- **M4's target that most games are won before the limit is dropped:** since increment 51 the brakes
  on the Assembly's vote (fear and tiring, D-69, the owner's choice) end most games at the limit, on
  score, which is a fair end for a long game.

**How:** every change measured in the eight games and kept only if it helps, with its switch; D-79
(the Co-op's lead) stays A.

**Options:**

- **A. These targets (recommended).**
- **B. Keep M4's target too** (most games won before the limit): would mean loosening the brakes
  on the vote the owner chose in D-69.
- **C. No numeric targets for 1.0,** only the owner's try.

## 9. Accessibility (D-84)

- **Checked automatically:** an accessibility checker (axe-core, a development dependency only) runs
  in the browser journeys on every main screen, on the phone and the desktop, and CI fails on a
  serious finding.
- **Fixed:** what it finds (names, roles, contrast, focus).
- **A text alternative to the map:** a list of the systems we know, with what is there and whose,
  sorted by distance, reachable from the menu and the keyboard; choosing one selects it as the map
  does.
- **Keyboard and focus:** every dialog takes focus and gives it back; focus is always visible.
- **The largest text on a phone:** every screen read at the largest text size without sideways
  scrolling.
- **Colour:** every power's colour checked for contrast where it colours text; the shapes beside
  the colours stay.

**Options:**

- **A. WCAG 2.2 AA where it applies, checked in CI, with the map's list (recommended).**
- **B. A lighter pass:** labels and contrast only.
- **C. None before 1.0.**

## 10. Map sizes (D-85)

The game has one map, every real system out to 33 light-years (356 systems), with the human powers
in the old 27 light-year heartland and the aliens in the shell beyond. D-02 planned a 40 light-year
map (about 600 systems) *if performance and the AI allow*.

- **Larger (40 ly):** a new import of real stars through Starman Reborn's sky pipeline; turns would
  take about twice as long (the slowest is 143 ms now, against a budget of 200 ms) and a phone's map
  would carry nearly twice the stars. The alien powers would be no nearer one another.
- **Smaller (27 ly, the heartland):** 207 systems, but every alien capital lies beyond it, so it
  would be a game of the human powers alone; and every part of the game reads one map today, so a
  second needs the world chosen per game, in the turn's worker and in saves.

**Options:**

- **A. One map for 1.0, the 33 ly neighbourhood (recommended):** already larger than *Master of
  Orion 3*'s largest galaxy; a shorter game is the turn limit's job (150, 200, 250 or none).
- **B. Add the heartland map** (27 ly, the human powers only), for short games.
- **C. Add the 40 ly map,** if a measurement first shows turns within budget.

## 11. Music and sound (D-86)

Seven pieces play now (title, map, system, three colonies). **For 1.0:**

- **A piece for the playable alien's colonies** (§5).
- **War:** the map's music while we are at war, tenser.
- **The end:** victory and defeat, for the end screen.
- **Sounds that tell:** a short sound for a battle reported, a key found and the Answer begun, made
  in the browser like the interface sounds.

Generated with Lyria as D-31 decided, three candidates each, chosen by Claude on the owner's leave,
the candidates kept and sent lettered for the owner to overrule: about four pieces, **about $1**.

**Options:** **A. those four pieces and the sounds (recommended)** · B. the sounds only · C. none.

## 12. Polish and phones

Not a decision, the work of every increment and one of its own (§13):

- **A long journey on a phone:** a game played by script to turn 150 on the phone size, every screen
  opened along the way, screenshots kept; anything cut off, overlapping, unreadable or slow is
  fixed.
- **Load and speed on a phone:** the first load, a turn and the map's frame rate measured with the
  browser's phone throttling, within the budgets of SCOPE.md.
- **Words:** every screen's text read once more for plain British English and for what is fiction.

## 13. Increments

Each keeps the game playable, passes CI and deploys from `main`.

| # | Increment | What it adds |
| --- | --- | --- |
| 61 | **Lessons when they matter** | §4: the lessons, *How to play* in the codex |
| 62 | **Accessibility** | §9: the checker in the journeys, fixes, the map's list |
| 63 | **The keys within reach** | §6: the hunt, keys in exchanges, measured |
| 64 | **Guardians** | §7: **deferred again to after 1.0** (§23) |
| 65 | **Playing the Concord** | §5: its buildings, faces, picture and music; the new game offers it |
| 66 | **Music and sound for 1.0** | §11 |
| 67 | **The long game for 1.0** | §8: the targets measured and met where they can be |
| 68 | **Polish and phones** | §12 |
| 69 | **The proof** | the headless games, the whole suite, the owner's try |

## 14. Tests and budgets

- **Unit tests for every rule:** each lesson's trigger, once a game; the hunt and keys in exchanges;
  guardians in battle; the Concord as the player's power for 100 turns.
- **Browser journeys** on the phone, tablet and desktop: a lesson shown and kept in the codex; the
  accessibility checker on every main screen; the map's list; guardians cleared; a game led by the
  Concord, with its colony view.
- **The headless games** to the targets of §8.
- **Budgets** as SCOPE.md: the title, a game's map, a colony's pictures; turns within 200 ms, saves
  within 200 KB.

## 15. Art, music and their cost

| What | About |
| --- | --- |
| The Concord's 45 buildings, two candidates each | $4.50 |
| The Concord's seven advisors' faces and its new-game picture | $0.80 |
| Guardians: a picture for the report | $0.10 |
| Music: the Concord's colonies, war, victory and defeat, three candidates each | $1.00 |
| **In all** | **about $6.40** |

About $16.80 of the $50 allowance (D-27) is left, so M6 fits with about $10 to spare for re-rolls
and the next alien. No increase is asked for.

## 16. Decisions

Assumed on the owner's standing leave of 23 October 2026, each as recommended, and recorded in
[DECISIONS.md, Round 9](../DECISIONS.md#round-9-10-assumed-23-october-2026):

| ID | Question | Recommendation |
| --- | --- | --- |
| **D-80** | Lessons when they matter (§4) | **A, lessons when they matter, kept in the codex** |
| **D-81** | Playing an alien power (§5) | **A, the Concord in M6; the Moot and the Continuance after 1.0** |
| **D-82** | The keys within everyone's reach (§6) | **A, the hunt, then keys in exchanges, measured; three keys only if both fail** |
| **D-83** | The balance targets for 1.0 (§8) | **A, four winners and one by the keys; no deep or long debt; M4's limit target dropped** |
| **D-84** | Accessibility (§9) | **A, WCAG 2.2 AA where it applies, checked in CI, with the map's list** |
| **D-85** | Map sizes (§10) | **A, one map for 1.0** |
| **D-86** | Music and sound (§11) | **A, four pieces and the sounds** |

D-72 (guardians) stays A and is built in M6; D-79 stays A. **Left to the owner:** **D-18**, and
whether to call the result 1.0.

## 20. Increment 61 in detail: lessons when they matter (written before building it)

**Goals.** §4 (D-80): a lesson from the right advisor the first time each system matters, kept in the
codex. **Out of scope:** changing the guided opening's steps; lessons for systems the player cannot
use (an alien's view of its own species).

### 20.1 Once on this device, not once a game

§4 said *once a game*. Built that way, a player who learnt the Assembly in one game would be told
again in every game after. So **each lesson is told once on this device**, as the guided opening
is finished once; *Tell me again* in the codex's *How to play* forgets them all, and *off* for the
guide in the settings turns the lessons off too.

### 20.2 The lessons, in the order they are told

When more than one is due, the first in this order comes first; the next waits until it is closed.
The guided opening's step, while there is one, comes before any lesson.

| Lesson | Due when | Advisor | Lit |
| --- | --- | --- | --- |
| Debt | our treasury is below zero | Treasury | Empire |
| Hunger | a colony of ours is hungry | Colonies | Empire |
| Unrest | a colony of ours is in unrest or revolt | Colonies | Empire |
| War | we are at war | Admiral | Diplomacy |
| Raided | the last report has a raid on us | Watch | — |
| The arks | the arks wait and we have not answered | Envoy | Menu, *The arks* when there |
| First contact | we have met another power | Envoy | Diplomacy |
| Talking | we can talk with another power | Envoy | Diplomacy |
| The Assembly | the Assembly has formed | Envoy | Menu, *The Assembly* |
| Warships | we hold a warship, or a design | Admiral | — |
| Relic sites | we know a relic site | Science | Menu, *Relics* |
| A chapter | an excavation of ours waits for its choice | Science | Menu, *Relics* |
| The keys | a key has been found by anyone | Science | Menu, *Relics* |
| Leaders | people are offered to us | Colonies | Menu, *Leaders* |
| Agents | we can talk with another power, from turn 30 | Watch | Diplomacy |
| Events | an event waits for our answer | the event's advisor (Colonies) | — |

Each has a line in each of the three voices (formal, warm, blunt), as the guided opening's steps do,
a hint for where to find its control on the phone and the desktop, and a **summary**: two or three
plain sentences that say how the system works, for the codex.

### 20.3 On the screen

- **The card** is the guided opening's card: the advisor's face and name, *Lesson*, the line, the
  hint, and **Got it**, which closes it for good. It blocks nothing and sits where the opening's
  card does.
- **The ring** lights each of the lesson's controls that is on the screen (the Diplomacy chip on
  the desktop, the Menu chip, and the menu's entry when the menu is open).
- **The codex, *How to play*:** every lesson's summary, those met marked *Met in play*, and *Tell
  me again*.
- **In the browser tests** lessons stay off unless the address asks for them (`?test&lessons`), as
  the guide does.

### 20.4 State and tests

Nothing in the game's state: what has been told is kept on the device, beside the guide
(`starman-control:lessons`). **Unit** (`lessons.test.ts`): each lesson due by its rule; the order;
told once; *Tell me again*; off with the guide. **Journey** (`lessons.spec.ts`, phone, tablet and
desktop): first contact brings the Envoy's lesson with the Diplomacy chip lit (on the desktop);
*Got it* closes it for good; the codex shows it met.


### As built (23 October 2026)

- **Sixteen lessons as §20.2,** in `src/content/lessons.ts` (each a line in three voices, a hint and a
  summary) and `src/app/lessons.ts` (when each is due, and which are told). The order puts what
  costs most first (debt, hunger, unrest, war, a raid, the arks).
- **Told once on this device (§20.1);** the codex's *How to play* lists all sixteen summaries, marks
  those *Met in play*, and has *Tell me again*. The guide's *off* in the settings turns them off.
- **The ring** lights the Diplomacy chip on the desktop, the Menu chip, and the menu's *Diplomacy*,
  *The Assembly*, *Relics* and *Leaders* when it is open (new `data-guide` names).
- **Facts checked against the rules** as the summaries were written: a fleet's missions are invade,
  bombard and (for an outlaw) raid; an event unanswered for a few turns takes its first choice.
- **Tests:** `lessons.test.ts` (11) and `lessons.spec.ts` (phone, tablet and desktop).

**Reversing it:** the lessons are off for a player who sets the guide *off*; to remove them, drop the
`LessonCard` branch from `GuideCard` (`src/ui/map/guide.tsx`) and `HowToPlay` from the codex
(`src/ui/data/DataPage.tsx`). Nothing in a game's state or its saves depends on them.

## 21. Increment 62 in detail: accessibility (written before building it)

**Goals.** §9 (D-84): WCAG 2.2 AA where it applies, checked in CI, and a text alternative to the map.
**Out of scope:** the 3D scenes themselves (the map, a system, a colony, a battle's replay), which
are pictures with their words beside them; spoken audio, which the game has none of.

### 21.1 What a first check found

The checker (axe-core, through `@axe-core/playwright`, a development dependency only) on the title,
the new game, the map, the empire, research, the codex, the settings and the saves, on the phone and
the desktop: **no failure of any severity.** What it cannot decide is colour contrast over the
translucent panels; checked by hand from the colours in `style.css` and every power's colour, all
text is at least 5:1 on a panel over the dark map (AA asks 4.5:1).

Read in the code, three things a checker does not see:

- **Enter always ends the turn** on the map, even when a keyboard user has moved to a button with
  Tab: the button can never be pressed with Enter, and the turn ends instead.
- **Dialogs do not take focus** when they open, nor give it back when they close: a screen reader
  stays where it was, and Tab walks the page behind.
- **The map has no list:** a system is found by name (the search) or by sight.

### 21.2 What is built

- **The checker in the journeys** (`a11y.spec.ts`, phone, tablet and desktop) on every main screen
  and dialog: the title, the new game, the map, the empire, research, diplomacy, the report, a
  colony, relics, leaders, the systems list, the codex, the settings and the saves. Any serious or
  critical finding fails CI.
- **Enter presses a button reached by keyboard:** on a control with keyboard focus (the browser's
  `:focus-visible`), Enter does what the control does; anywhere else it still ends the turn, so a
  player who clicked a button and then pressed Enter loses nothing.
- **Dialogs take focus and give it back:** every sheet and popover moves focus into itself as it
  opens (unless something inside, such as the search, took it first) and back to where it was as it
  closes.
- **The systems list** (*Systems*, **K**, and in the menu): every system, nearest our capital first,
  with its distance, whose holdings are there and ours, whether we have surveyed it, and a relic site
  we know; choosing one selects it as the map does. The first 40, then *Show all*.
- **The largest text on a phone:** a journey at the largest text size (150%) opens the map, the
  empire, research, the codex and the settings and checks nothing scrolls sideways.

### 21.3 Tests

`a11y.spec.ts` (the checker; Enter on a focused button; focus into a dialog and back; the systems
list) and the largest text, on the phone, tablet and desktop.


### As built (23 October 2026)

- **The checker in the journeys** (`a11y.spec.ts`): the title, the new game, the map, the empire,
  research, diplomacy, relics, leaders, the systems list, the report, the codex, the settings and the
  saves, on the phone, tablet and desktop; a serious or critical finding fails CI. It found one thing
  on the phone: **a sheet's scrolling body could not be reached by keyboard** (Relics and Leaders are
  long enough to scroll). Every sheet's body now takes focus, with its ring shown only for the
  keyboard.
- **Contrast by hand** for what the checker could not decide over the translucent panels: every text
  colour, and every power's colour, is at least 5:1 on a panel over the dark map; the dimmest grey
  would fall to 3.5:1 only over a white backdrop, which the map never shows behind a panel.
- **Enter as §21.2:** on a button or link reached by keyboard it presses it; anywhere else, a
  control clicked included, it ends the turn as before. The browser's `:focus-visible` could not tell
  the two apart (any key pressed on a control makes it match), so the game notes how focus came to
  each control: after a press of the mouse or a finger, or without one (`focusedByKeyboard`).
- **Focus given back** only to a control reached by keyboard: a dialog opened by a click or a
  shortcut leaves focus on the page when it closes, so Enter still ends the turn. (Built first to give
  focus back always, two journeys showed Enter then pressing *Move* again instead of ending the
  turn.)
- **Dialogs take focus and give it back** (`DialogFocus`, `src/ui/focus.tsx`), in all twenty: the
  sheets, the popovers, *What needs you*, the destination bar and the codex's sheet.
- **The systems list** (`src/ui/map/systems.tsx`): *Systems* in the menu and **K**; 40 at first,
  then all 356.
- **The largest text on a phone** (150%): the settings, the codex, the new game, the map, the empire
  and research scroll nothing sideways.
- **A development dependency:** `@axe-core/playwright` 4.13.0 (August 2026), for the journeys only;
  nothing of it reaches the game.

**Reversing it:** the checker's journey is `tests/e2e/a11y.spec.ts`; `DialogFocus` is one line in each
dialog; the Enter rule is one condition in the map's keys (`MapScreen.tsx`); the list is its own
panel. None touches a game's state.

## 22. Increment 63 in detail: the keys within reach (written before building it)

**Goals.** §6 (D-82, A): the smallest changes that let a rival reach the Answer in some long games,
each measured in the eight headless games and kept only if it does that without spoiling the rest.
**Out of scope:** guardians (increment 64); new victory conditions.

### 22.1 What the rivals do now (M5_UNKNOWN.md §21, as built)

A rival that digs digs the key sites first once it knows where the keys lie (*The second tone*).
Holding **three** keys (`RULES.keys.hunt`), it adds *the keys* to its reasons for war, strikes key
holdings first, and researches the way to the Answer; the Wake, an outlaw, goes to war for any key
it can reach and match. In the games no rival ever holds three, so the hunt never begins.

### 22.2 The steps, in order, each measured

1. **The hunt from two keys** (`RULES.keys.hunt` 3 → 2): the hunter goes to war for the rest and
   learns *The second tone* and *The instrument*.
2. **The hunter's reach:** at war for keys, it lays its road toward the nearest key it lacks, as a
   digging power does toward a site (`roads.ts`), so a key across the map is not out of reach.
3. **Keys in exchanges** (only if 1 and 2 are not enough): a key may be given in a dealing, moving to
   the receiver's capital. This changes D-71 (*keys are not traded*), so it is built only if the
   measurements need it.
4. **Three keys for the Answer** (only if all else fails, as D-82 says).

**What counts as working:** at least one of the eight games won by the keys, and no game ended by
the keys before turn 150 (the race should be long); the other targets of §8 no worse.

### 22.3 Tests

Unit tests for each kept change (the hunt from two keys; the road to a key); the headless games in
M2_BALANCE.md, which gain a column: who held the keys at the end.


### As built (23 October 2026)

**Measured, each in the eight games to turn 250** (the keys counted as M2_BALANCE.md now shows them,
in a new column):

| Tried | Keys found in a game | Who won |
| --- | --- | --- |
| As after increment 62 | 1 to 3; never more than 2 in one hand | the Co-op 4, the Continuance 2, the Wake 1, the Concord 1 |
| The hunt from two keys (step 1) | the same; the Authority learns *The instrument* in one game | no change |
| A digger learns all four steps to the keys first (`RULES.keys.study` 4) | the same | the Co-op 5 |
| Both | the same | the Co-op 5 |
| A digger sends an outpost to a site it can reach before a colony ship, from the first turn | 1 to 3 | **five winners**, the Co-op 3; but in seed 7 the Wake no longer agrees a treaty by turn 100 (M3's target) |
| The same from turn 20, 30 or 40 | 1 to 4 | **five winners**: the Co-op 4, the Wake, the Concord, the Continuance and the Authority 1 each |
| The same from turn 60 | 1 to 3 | the Co-op 4, the Continuance 2, the Wake 1, the Concord 1 |

**Why the keys stay out of the rivals' reach.** Never more than four of the five keys are found in a
game, and they end in three or four hands. As placed (each key at the site nearest one of the five
older capitals, §21 as built), gathering all five means taking four of them from four other powers:
a harder road than conquest. A rival does not plan so long a campaign, and steps 3 and 4 (keys in
exchanges, three keys for the Answer) cannot help while no hand holds more than two. **So the target
of a game won by the keys is missed, and recorded so (D-82)**; the keys stay the player's road, and a
rival's only by luck. Changing it means placing the keys differently, which is the owner's call.

**Kept: a digger settles its site first** (`RULES.keys.outpostFrom`, turn 20): from turn 20, a rival
that digs builds an outpost ship for a relic site it can reach before a colony ship. It mends what
the measures showed (the Authority, having finished Sirius by turn 60, founded no outpost at Procyon,
11.5 light-years off, until after turn 100, and dug nothing between), and it gives the long games five
different winners, one more than before. From turn 20 rather than the first, as from the first the
Wake lost its treaty by turn 100 in one game. **Left at their values, as switches:** the hunt at three
keys (`RULES.keys.hunt`) and a digger's first steps (`RULES.keys.study`, 1).

**Numbers** (M2_BALANCE.md): five different winners (the Co-op 4, the Wake, the Concord, the
Continuance and the Authority one each); the deepest debt −62 and the longest 21 turns; the slowest
turn 161 ms and the largest save 173.3 KB. M3's targets still met at turn 100.

**Reversing it:**

| To change | Where |
| --- | --- |
| A digger settling its site first | `RULES.keys.outpostFrom`: `null` turns it off |
| The hunt, and a digger's first steps | `RULES.keys.hunt`, `RULES.keys.study` |

## 23. Increment 64: guardians, deferred again

**Decided on the owner's leave, 23 October 2026: guardians (D-72) wait until after 1.0.** §7 planned
them for M6 once the rivals could carry the long campaign the keys need. Increment 63 measured that
they cannot (§22, as built): never more than two keys end in one hand, and gathering five means taking
four from four powers. Guardians would make the key sites harder still, for the player, whose road the
keys are, and for every rival that digs, whose digging now gives the long games five different
winners. And they need every battle, its replay and its report to learn a side that is no power, the
large change M5 deferred them for. So M6 goes on without them; nothing is built, so nothing is to undo.
When the keys are placed or fought for differently (the owner's call), guardians come back with them.

## 24. Increment 65 in detail: playing the Concord (written before building it)

**Goals.** §5 (D-81, A): the Dusk Concord offered on the new game beside the three human powers, the
first power a player may lead that is not human, seen as fully as they are. **Out of scope:** the
Moot and the Continuance (after 1.0); any change to the Concord's rules, which it already plays by as
a rival.

### 24.1 What the player gets

- **The new game's fourth card:** *Lead the Dusk Concord*, with a picture of the Duskfolk at home in
  the ring of dusk of GJ 433 d (the star is real; the world, its people and everything they built are
  fiction, and the card says so) and their speaker, Still Water, whose face the codex already has.
  The rivals are then the three human powers, the Moot and the Continuance.
- **Its colonies in pictures,** as the human powers' are: homes in three sizes, open and domed, three
  versions of each; the hall at the capital; districts (works, labs, market); every project; the
  rig of an outpost; the shuttle; five small props. In the Duskfolk's architecture, written in M3:
  long low halls half sunk into the ground, turf and dark slate, fitted dark stone, woven screens,
  slit windows glowing amber.
- **Its advisors' faces:** the seven still missing (the envoy, First Voice, has one).
- **Its colonies' music:** one piece for the colony view, by D-31's way.
- **The guided opening and the lessons** in its formal voice, with its advisors' names, as they are
  already written.

### 24.2 Pictures and their cost (D-27)

45 buildings, 5 props, 7 faces and the new game's scene: **58 pictures, 116 candidates, about $5.80**,
sent as lettered sheets for the owner to overrule. The music: three candidates, about $0.25. With
increment 59's spend, about **$39.25** of the owner's $50.

### 24.3 State and saves

No change: a game's powers already say who is the player. A save from before plays on as it was.

### 24.4 Tests

- **Unit:** the Concord among the playable powers; its every building and prop has a picture (the
  colony scene's test now runs for four architectures); a game led by the Concord for 100 turns, the
  game sound, its colonies on the ring of dusk.
- **Journey** (phone, tablet and desktop): the new game offers four powers; *Lead the Dusk Concord*
  starts a game at GJ 433; its capital's still and colony view show Duskfolk buildings; the guide's
  first line is its colonies advisor's. The journeys that count the powers on the new game (three
  cards, *the other two*) count four.


### As built (23 October 2026)

- **The Concord to lead** (`playable: true`): the new game's fourth card, *Lead the Dusk Concord*,
  with the new scene of GJ 433 d and its speaker Still Water's face (the portrait the codex already
  had, so no leader's picture was made). The new game lays the cards two by two on a narrower
  desktop and four across from 1,360 pixels; a phone swipes them as before. The title says *Lead
  one of four powers*, and its sky now marks four capitals.
- **Its colonies in pictures** as §24.1: 45 buildings and 5 props in the Duskfolk's architecture,
  each as wide in the world as the Authority's of its kind (`colonyArt.ts`).
- **Its advisors' faces:** the seven missing; the codex's card shows them with its speaker.
- **Its colonies' music:** *colony-dusk*, chosen from three candidates by what can be measured
  without ears (A begins and ends softest, as the brief asks, with the widest range); the three were
  sent lettered for the owner to choose by ear.
- **Found on the way:** the aliens' ships had no names (each was *Ship*, *Ship II* …), so the four
  alien makers now have names of their own, translated as their advisors' are (fiction). The title's
  line of progress still said *M4, Fleets*; it says *M6, towards 1.0*.
- **Pictures (§24.2):** 116 candidates, about **$5.80**, none refused; chosen as the lettered sheets
  sent to the owner show (seven chosen B for a stray smear or a cropped edge on A, and a few more on
  looks). The music: three candidates, about **$0.25**. In all about **$39.25** of the $50 (D-27).
- **Tests:** the colony scene's tests now cover four architectures; the scripted 50-turn player
  runs as the Concord too (it settles by colonies, so the test checks a colony of it can lay a lane
  rather than that the simple script lays one); `concord.spec.ts` (phone, tablet and desktop): the
  card, the game at GJ 433, the guide in Warm Stone's words and the capital drawn in its halls. The
  journeys that counted three powers count four.

**Reversing it:** set `playable: false` on the Concord in `src/content/factions.ts`; its pictures,
music and ship names can stay (they are used only when it is seen), and the new game falls back to
three cards.

## 25. Increment 66 in detail: music and sound for 1.0 (written before building it)

**Goals.** §11 (D-86, A): music for war and for the end of a game, and sounds that tell what a turn
brought. The Concord's colony piece came with increment 65. **Out of scope:** a volume slider; music
for each event; sung or spoken words.

### 25.1 Three pieces

| Piece | Plays | Character |
| --- | --- | --- |
| **War** | on the map while we are at war, in place of the map's two pieces | tense and low, slow-building, never martial bombast: a low pulse, muted brass, taut strings |
| **Victory** | on the end screen when we have won | the title's warmth grown wide and calm, an ending rather than a fanfare |
| **Defeat** | on the end screen when we have lost or left the game | quiet and dignified, a solo instrument over a low drone, fading |

Inside a system or a colony the music stays as it is; at war the map's mood is *war*. On the end
screen the end's mood wins over every other. Three candidates each, by D-31's way (Lyria), chosen by
measure (a soft start and end, the widest range) and sent lettered for the owner to choose by ear:
**9 candidates, about $0.75**.

### 25.2 Two sounds

Made in the browser like the interface's others (CONSOLE.md §5), after the turn's rising tone when the
report brings them: **a battle** (a low, muffled double thud) when the report has a battle we fought,
and **a key** (two soft bell tones a fifth apart) when we found or took a key. A key lost to another
is told in the report and sounds nothing more. Off with the sound setting.

### 25.3 Tests

Unit: the moods (war on the map only, the end over all); the pieces published. Journey: a game at war
sets the music's mood to *war* (the music state is read, not heard).

### 25.4 As built (23 October 2026)

- **The pieces** (`music/briefs.ts`, `public/music/war.mp3`, `victory.mp3`, `defeat.mp3`): nine
  candidates, about **$0.75**, so about **$40.00** of the owner's $50 (D-27). Lyria's filter refused
  one defeat candidate once and took it on the retry. Each chosen by measure, the softest start among
  those with the widest loudness range: war C (range 8.7 LU, start −20 dB), victory C (10.4 LU,
  −32 dB; B's range of 17 LU meant a loud climax, against the brief's *no big build-ups*), defeat C
  (12.1 LU, −28 dB). The nine went to the owner, lettered, to choose by ear.
- **The moods** (`src/content/music.ts`): `moodFor` takes `war` and `end`; the end wins over every
  place, a system and a colony keep their own at war. A game that ended with no winner plays
  *defeat*, the quiet one. MapScreen gives the mood from the war (`enemiesOf`) and the end's dialog
  being shown; playing on after a victory brings the map's music back.
- **The sounds** (`src/app/sound.ts`): cues `battle` (two sine thuds, 120→50 Hz and 105→45 Hz) and
  `key` (C6 then G6, soft); `play(cue, after)` delays them past the turn's tone. A `__sound` hook
  lists the cues played in test runs.
- **The end, again, on a desktop:** its journey found that the desktop's menu had no way back to the
  end of the game after *Play on*; the phone's had. The desktop's menu now has *The end of the game*
  too, once the game is decided.
- **Tests**: unit, the moods (war on the map only, the end over all, every new mood's piece); journeys,
  `music.spec.ts` (at war the mood and piece are *war*; the end, shown, *victory*) and
  `battles.spec.ts` (a battle fought sounds `battle`, not `key`).

### 25.5 Reversing it

| To undo | Change |
| --- | --- |
| War's piece on the map | drop `war` from `moodFor`'s call in MapScreen (the map's two pieces return) |
| The end's pieces | drop `end` from the same call |
| A piece the owner prefers by ear | `npm run music:approve -- music/out/<piece>/<candidate>.mp3` |
| The two sounds | remove the two `sound('battle'…)` / `sound('key'…)` lines after `sound('turn')` |

## 26. Increment 67 in detail: the long game for 1.0 (written before building it)

**Goals.** §8 (D-83, A): the eight headless games to turn 250 measured against the targets for 1.0,
and met where a fair change meets them. **Out of scope:** new rules for one power alone; loosening
the Assembly's brakes (D-69, the owner's choice); the keys' target, measured as out of reach in §22.

### 26.1 Where it stands (after increments 63 to 66)

| Target | Now |
| --- | --- |
| Four different winners, none winning more than three | five winners, but the Co-op wins four (seeds 42, 7, 2 on score at turn 250; seed 5 by the Assembly at turn 90) |
| One game won by the keys | none (§22: missed, recorded) |
| No treasury below −200, none in debt more than 30 turns | deepest −62, longest 21 turns: **met** |
| Turns within 200 ms, saves within 200 KB | slowest 161 ms, largest 173 KB: **met** |

The Co-op's margins at turn 250: seed 42, 1,546 against the Concord's 1,129; seed 7, 1,263 against
the Concord's 1,204; seed 2, 1,140 against the Wake's 1,045. Seed 5's vote is close: the Authority
regards the Co-op at 31, the fear at the deciding vote takes 20, and 11 is one over the 10 a vote
needs; but with the vote missed the Co-op still wins seed 5 on score at turn 250 (1,368 against the
Continuance's 1,232). It leads on colonies and people, not on technologies, which every power nearly
finishes.

### 26.2 A gap found: no rival builds a great work

No power had built a single great work by turn 250 in any of the eight games. A rival queues its
great work at its capital *when it can* (M2B_SCIENCE.md §20.2), but it studies the cheapest
technology first, and *Great engineering* (480) with the work's own technology always comes last.
So the race for each great work, one in the whole neighbourhood, is never run: a player builds every
one unopposed. **The fix:** from turn 60 (`RULES.greatWorks.rivalsFrom`, `null` for the old order), a
rival studies the road to its great work before the cheapest, while no one has built it. This is
kept for the game's sake, as the race was always meant to be run, if it breaks no target, even if it
does not help the winners'.

### 26.3 The Co-op's fourth win: levers, in order, each measured in the eight games

1. The great works raced (§26.2), as they are.
2. The great works raced, with each rival aiming at the work nearest its character that is still
   free, so that four powers do not race for one.
3. Nothing more if neither helps: the target is recorded as missed by one, D-79 stays A, and the
   owner decides.

### 26.4 Tests

Unit: once the race is open a rival studies *Great engineering* and its work's technology before
cheaper ones, and not once its work stands; with `null`, the cheapest first. The headless games: the table
of §26.1 again, in M2_BALANCE.md and here.

### 26.5 As built (23 October 2026)

Each line is the eight games to turn 250 (seeds 42, 7, 2176, 1, 2, 3, 4 and 5):

| Tried | Winners |
| --- | --- |
| As after increment 66 (no rival ever begins a great work) | the Co-op 4, the Wake 1, the Concord 1, the Continuance 1, the Authority 1 |
| 1. Rivals study towards their great work from turn 60 | the Co-op 7, the Continuance 1 |
| 1. The same from turn 150 | the Co-op 6, the Continuance 1, the Wake 1 |
| 2. From turn 60, the Concord aiming at the Long Array (which no rival sought), and no rival studying for a work another has begun | the Co-op 6, the Concord 2 |
| **Kept: the race opens when any power begins a great work** | the Co-op 4, the Wake 1, the Concord 1, the Continuance 1, the Authority 1 (as before: among rivals alone no one begins one) |

Racing from a set turn always helped the strongest: the others spent their research on a road of
about 2,000 points while the Co-op grew, and close games turned its way. So the race opens instead
when any power begins a great work, which every power sees (they are famous, §20.2 of M2B). Among
rivals alone that never happens in 250 turns, so the balance is as it was; a player who begins one
now meets rivals reaching for theirs. Measured in seed 42 with the Authority beginning the Lapse
Archive at turn 120 (as a player might): it finished on turn 145; the Concord began the Commons on
turn 148, the Continuance the Lanewright Foundry on 155, the Co-op the Commons on 156 and the Moot the
Foundry on 158; the Continuance finished the Foundry on 164 and the Concord the Commons on 165, so the
Co-op and the Moot lost their races. The Long Array, which no rival seeks, is left for a player.

**The targets for 1.0 (D-83), as they stand:** five different winners, the Co-op one over the three
(**missed by one**; D-79 stays A, the owner's to change); no game won by the keys (**missed**, §22);
the deepest treasury −62 and the longest debt 21 turns (**met**); the slowest turn 150 ms and the
largest save 173.5 KB (**met**, within 200 ms and 200 KB; M2_BALANCE.md, regenerated).

- **Where:** `RULES.greatWorks.rivalsFrom` (`'begun'`; a turn, or `null` for the old cheapest-first
  order); the road in `src/sim/ai.ts` under *Research*; the test in `tests/unit/greatworks.test.ts`.

### 26.6 Reversing it

| To undo | Change |
| --- | --- |
| Rivals racing for great works | `RULES.greatWorks.rivalsFrom = null` |
| A race from a set turn instead (measured, not kept) | `RULES.greatWorks.rivalsFrom = 60` |

## 27. Increment 68 in detail: polish and phones (written before building it)

**Goals.** §12: the game played long on a phone, looked at screen by screen, and fixed where it is
cut off, crowded, unreadable or slow; its load and speed measured with the browser's phone
throttling; its words kept British. **Out of scope:** a real phone (the owner's, §5 of HANDOVER.md);
new screens; the map's look.

### 27.1 The long journey on a phone

A new journey, `tests/e2e/journey.spec.ts`, in a project of its own (`journey-phone`, run with
`npm run journey`, after the others, as the hundred-turn games are), leads **the Concord** (the
newest power, and not human) at 390 × 844 to turn 150, ending each turn through the interface and
answering every event. At turns 1, 50, 100 and 150 it opens every main screen (the Empire, Research,
Diplomacy, Relics, Leaders, Systems, the report, the capital's panel and its colony view, the codex)
and for each:

- keeps a screenshot (`test-results/journey/<turn>-<screen>.png`) to be looked at;
- checks that nothing scrolls sideways and that the accessibility checker finds nothing serious;
- times the turn from the press to the new quarter (within 2 s, as the hundred-turn games).

Each screenshot is then looked at, and what is cut off, overlapping or unreadable is fixed in this
increment and listed in its as-built.

### 27.2 Load and speed with phone throttling

`npm run phone-speed` (a Playwright script) loads the built game with the browser throttled as a
mid-range phone on a mobile network (**4× slower processor; 150 ms round trips, 1.6 Mb/s down**) and
measures: the title shown (first load, nothing cached); a new game's map ready; a turn ended after 50;
and the map's frames a second while it turns. The targets, an engineering choice that the owner can
change: **title within 3 s, map within 12 s, a turn within 2 s.** The frame rate is recorded but not
judged: the test browser draws in software, not on a phone's graphics chip.

### 27.3 Words

Every screen's text was read again (as in every increment); a unit test now keeps American
spellings (*color*, *center*, *defense*, *-ize* and the like) out of every string the player reads,
in `src/content` and `src/ui`.

### 27.4 Tests

The journey above; the speed script's targets; the words test.

### 27.5 As built (23 October 2026)

- **The journey** (`tests/e2e/journey.spec.ts`, `npm run journey`; `JOURNEY_TURNS` for a shorter one):
  the Concord to turn 150 in 4.5 minutes, its orders each turn given by a test hook (`__autoplay`,
  only with `?test`, loading the rivals' code only when asked) as a rival of its character would; 10
  events answered, 9 lessons read; the slowest turn 178 ms, the average 69 ms; at turns 1, 50, 100 and
  150, 11 screens each kept and checked, with nothing sideways, no sheet wider than its box and nothing
  serious for the checker.
- **Fixed from its screenshots:** Diplomacy, the Assembly, Relics, Leaders and Systems had no title on
  either layout, where the Empire and Research have one: each now opens with its name. The chosen step
  of *Excavations take* and *Guard home* was not lit (its buttons said they were pressed, but nothing
  showed it): now lit as a pressed chip is. The systems list said "ours: colony, colony, outpost,
  colony" and "0.0 ly" at the capital: now "ours: 3 colonies and an outpost", and "our capital" in
  place of the distance. A colony's approval wrote "-15 high taxes" with a hyphen, where the treasury
  writes "−7 upkeep": now a true minus too. A lesson's hint named the desktop's key on a phone
  ("Leaders (L, or Menu)"): each layout now shows its own way in (`hintFor`).
- **Load and speed** (`tests/e2e/speed.spec.ts`, `npm run phone-speed`): the title in **1.0 s**, a
  new game's map in **3.5 s**, the map turning at 25 frames a second (in software). The browser's
  throttle slows the page but not the worker that works out a turn, so a turn after 50 is measured
  unslowed (36 ms) and judged at four times that; the slowest headless turn of all (150 ms, §26) would
  be about 600 ms on such a phone. Within the targets.
- **Words** (`tests/unit/words.test.ts`): no American spelling was found in any string the player
  reads; the test keeps it so.

### 27.6 Reversing it

| To undo | Change |
| --- | --- |
| The titles on the menu's screens | the `<h2 class="sheet-heading">` before each view in MapScreen |
| The lit chosen step | the `.dig-share-buttons .button[aria-pressed="true"]` rule in `relics.css` |
| A hint for each layout | `hintFor` in the lesson card (`guide.tsx`) |
| The journey and the speed script | their projects in `playwright.config.ts` and their scripts in `package.json` |

## 28. Increment 69 in detail: the proof (written before building it)

**Goals.** §13: M6 shown whole. **Out of scope:** anything new; what the owner's try asks for comes
after.

- **The headless games:** M2_BALANCE.md written again from the game as it stands, the targets of §8
  read off it (as §26.5).
- **The whole suite:** `npm run check`, the browser journeys on the phone, tablet and desktop, the
  hundred-turn games, the long journey (§27.1) and the phone's speed (§27.2), each passing, and CI
  green on `main`.
- **For the owner:** *Trying M6* in HANDOVER.md, beside *Trying M5*: what is new, where it is, a
  good first try, and what would help most to hear; SCOPE.md marks M6 built; this design gains a
  closing *As built* for M6 as a whole (§29), with what was missed and what was deferred.

