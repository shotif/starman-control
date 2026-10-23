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
| 64 | **Guardians** | §7 |
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

