# Decisions

Every decision that shapes the game is recorded here: the question, the options, Claude's
recommendation, and the owner's answer with its date. Nothing marked **Open** is built until it is
answered (see [../CLAUDE.md](../CLAUDE.md)). Engineering choices that are small and easy to reverse
are listed under *Made without waiting* so the owner can overrule them.

Status: **Open** · **Decided** · **Deferred** (not needed until a later milestone).

## Summary

| ID | Question | Status | Answer |
| --- | --- | --- | --- |
| D-01 | Setting and timeline | Decided 2026-10-19 | A sequel beyond Reborn's frontier |
| D-02 | Which real stars | Decided 2026-10-19 | M1 on Reborn's 207 systems; the full game to 33 ly (~340 systems) |
| D-03 | Planets nobody has found yet | Decided 2026-10-19 | Generated per game, labelled *Fiction*; real planets always real |
| D-04 | Devices | Decided 2026-10-19 | **Fully playable on phones, and a dedicated desktop experience** |
| D-05 | Turns or real time | Decided 2026-10-19 | Turn-based, orders resolved simultaneously |
| D-06 | Single player or multiplayer | Decided 2026-10-19 | Single player against AI; deterministic simulation |
| D-07 | Space combat | Decided 2026-10-19 | Orders before battle, a watchable replay after |
| D-08 | Who the player can be | Decided 2026-10-19 | **Several playable factions**: the three human powers first, aliens playable later |
| D-09 | Art and external tools | Decided 2026-10-19 | **Google Gemini image generation** for portraits and illustrations (OpenAI not available for now); procedural for the rest |
| D-10 | Sharing code with Reborn | Decided 2026-10-19 | Copy and adapt, noting the source |
| D-11 | What "Control" means | Decided 2026-10-19 | You are Control, the voice the starmen answer to |
| D-16 | Game length, and what a turn stands for | Decided 2026-10-19 | 150–250 turns; a turn is about three months |
| D-19 | Jump lanes | Decided 2026-10-19 | **A fraction of Reborn's lanes at the start; players build new lanes as part of the strategy** |
| D-19a–c | Which lanes survive, why the rest lapsed, how a lane is built | Decided 2026-10-19 | the home webs; the Lapse; a lane is a project at a system you hold |
| D-20 | The M1 start: year, capitals, traits | Decided 2026-10-19 | 2176; Earth, Tau Ceti, Wolf 1061; the draft traits |
| D-21 | How finished work reaches `main` | Assumed 2026-10-19 | pushed to `main` once the checks pass, as in Reborn |
| D-22 | The technology stack | Decided 2026-10-19 | **the web platform, with Preact + Signals for the interface** and Biome; see [D-22](#d-22--the-technology-stack--decided) |
| D-23 | Art direction and image model, from the style test | Decided 2026-10-19 | the draft style, with `gemini-nano-banana-2.1` (Nano Banana) for everything |
| D-24 | Which planet each capital is on | Decided 2026-10-19 | Earth, **Tau Ceti e** (disputed) and **Wolf 1061 c** |
| D-25 | The 3D system view: when, at what scale, with what look | Decided 2026-10-19 | in M1 as increment 7; compressed and labelled "not to scale"; Reborn's procedural shaders |
| D-26 | Visual direction | Decided 2026-10-19 (owner's direction) | **Control's console**: a luminous, animated, installable game that does not look like a web page; see [VISUAL_DIRECTION.md](design/VISUAL_DIRECTION.md) |
| D-27 | How much may be spent on generated art without asking | Decided 2026-10-20 | **about $25 in all** (raised from $5, then $15); about $21.65 spent by 21 October 2026 (pictures and music) |
| D-28 | The colony view: its look, camera, how powers differ, where it lives | Decided 2026-10-20 | a living diorama from the art pipeline, seen from a ridge, on a screen of its own, with **a set of buildings for each power**; see [D-28](#d-28--the-colony-view--decided) and [COLONY_VIEW.md](design/COLONY_VIEW.md) |
| D-29 | The "Illustration" labels on pictures | Decided 2026-10-20 (owner's direction) | **removed everywhere**; the AI disclosure moves to the codex's credits and stays in the art records; *Fiction* labels stay; see [D-29](#d-29--the-illustration-labels--decided) |
| D-30 | What comes after the colony view | Decided 2026-10-20 (owner's choices) | more varied buildings first, then **M2 "Worlds"** with rivals that play, events, leaders and advisors and a guided opening; music needs the owner; see [D-30](#d-30--what-comes-next--decided) |
| D-31 | Music | Decided 2026-10-21 (owner's choice) | **B: pieces generated at build time with Google's Lyria**, chosen by the owner like the pictures; see [D-31](#d-31--music--decided) |
| D-15, D-32 – D-41 | The M2 design: governors and edicts, districts, food, credits, approval, projects, rivals, events, advisors, the opening, the art | Decided 2026-10-21 | **as recommended**; see [Round 4](#round-4-the-m2-design-decided-21-october-2026) and [M2_WORLDS.md §21](design/M2_WORLDS.md#21-decisions-for-the-owner) |
| D-42 | How a new colony starts, now that only districts make industry | Decided 2026-10-21 | **A, the founders' kit**: farms and works zoned, and 2 industry of its own; see [D-42](#d-42--how-a-new-colony-starts--decided) |
| D-43 | Idle people and approval | Decided 2026-10-21 (owner's choice) | **C, no penalty**: idle people make nothing, and that is all; see [D-43](#d-43--idle-people-and-approval--decided) |
| D-12 – D-14, D-17, D-18 | Round 2 | Open | see [Round 2](#round-2-needed-later) |

## Round 1: decided 19 October 2026

The owner agreed with the recommendations except where noted (D-04, D-08, D-09).

### D-01 · Setting and timeline — **Decided**

Starman Reborn has no aliens, and humanity already lives across its 207 systems in what reads as
an alternative present. A 4X with aliens needs new canon.

| Option | What it means |
| --- | --- |
| **A. Beyond the frontier (sequel)** ✅ | Some generations after Reborn. The Authority, the Co-op and the Wake have grown into states holding the old 27 ly sphere. The lanes are being pushed past it, and out there are the aliens and the artefacts. |
| B. The lanes go dark | A collapse of the lane network cuts every power off in its home system; they reopen the neighbourhood and meet whoever did it. |
| C. A separate continuity | Same powers and style, a "what if" timeline with aliens inside the 27 ly sphere. |

**Decided:** A, as recommended. Starting positions must be balanced as a design task, since the
powers' Reborn territories differ in size (the Co-op's core is 18 systems, the Authority's 5).

### D-02 · The map: which real stars — **Decided**

For scale: *Master of Orion 3*'s galaxies had about 50, 100, 175 or 250 stars.

| Radius | Systems (approx.) | Notes |
| --- | --- | --- |
| 27 ly | 207 | Reborn's census; data ready now |
| 33 ly (10 parsecs) | ~340 | the "10 parsec sample" astronomers study closely |
| 40 ly | ~600 | more than twice MoO3's largest |
| 50 ly | ~1,200 | too heavy for a turn-based browser game |

**Decided:** as recommended. M1 is built on the 207 ready systems. For the full game the census is
extended with Reborn's own fetch pipeline to **33 ly (about 340 systems)** as the standard map, the
old 27 ly sphere being humanity's heartland and the alien homeworlds in the shell beyond. A 40 ly
map may come later if performance and the AI allow. On a phone the map must stay readable at this
size (D-04), which the map design must prove in M1.

### D-03 · Planets nobody has found yet — **Decided**

**Decided:** as recommended. Known planets are always the real ones, with their uncertainties and
contested ones flagged. Every other planet, belt and moon is generated from the star's real type,
mass and age, differently each game (seeded), and labelled *Fiction*. A setting can fix the seed.

### D-04 · Devices — **Decided (owner's direction)**

Claude recommended desktop first with phones later. **The owner decided otherwise:**

> The game must be **completely playable on a mobile phone**, just like Starman Reborn, and also
> have a **fully dedicated desktop experience**.

What this means for every design from now on:

- **Two first-class layouts, designed together:** a phone layout (portrait first, landscape
  supported, touch only) and a desktop layout (large screen, mouse and keyboard, several panels at
  once, hover, shortcuts). Tablets use whichever fits their width, by touch or with a keyboard and
  mouse. Neither is a shrunk or stretched copy of the other.
- **Every feature is complete on both.** Nothing in the game is desktop-only.
- **Every screen is designed for both before it is built**, and tested at Reborn's range of phone,
  tablet and desktop sizes, with screenshots.
- **Phone constraints shape the rules too:** short turns, readable lists over dense tables,
  progressive detail, a first load small enough for a mobile connection, and performance measured
  on a real phone.
- Steam is still decided at milestone M5 (D-18); nothing may stop a desktop build later.

### D-05 · Turns or real time — **Decided**

**Decided:** turn-based, as in *Master of Orion 3*: every power gives its orders, then the turn
resolves for everyone at once. It suits phones especially well: a turn can be played in a minute
and the game closed at any point.

### D-06 · Single player or multiplayer — **Decided**

**Decided:** single player against AI powers for 1.0. The simulation is deterministic (same seed
and same orders give the same result), so hot-seat or play-by-turn multiplayer can come later.

### D-07 · Space combat — **Decided**

| Option | Effort |
| --- | --- |
| Auto-resolve with a written report | small |
| **Orders before battle, a watchable replay after** ✅ | medium |
| Turn-based tactical command | large |
| Real-time tactical, or flying your flagship | very large |

**Decided:** as recommended. Each task force's stance, target priority and retreat point are set
before the battle; it resolves by rules and plays as a short 3D replay to watch, skip or rewind,
with a report that explains the outcome. Tactical command may come later.

### D-08 · Who the player can be — **Decided (owner's direction)**

> **Several playable factions.** Start with what we have, but keep in mind that alien factions are
> to be playable in the future.

- **1.0:** the three human powers are all playable — the **Sol Transit Authority**, the
  **Frontier Cooperative** and the **Hollow Wake** — each with its own traits, start, shipmakers
  and way of playing (the Wake as an outlaw power: raiding, tolls, black markets).
- **Later:** the alien species become playable.
- **So, from M1:** nothing in the rules assumes the player is human. Factions and species are data;
  the player and the AI give orders through the same interface; every screen works for any
  faction; habitability, traits, names and art come from the faction and species definitions.

### D-09 · Art and external tools — **Decided (owner's direction)**

The owner provides **Google Gemini API** access; Claude sets up the pipeline. (OpenAI was offered
at first; on 19 October 2026 the owner said an OpenAI key cannot be provided, so the pipeline runs
on Gemini alone and keeps OpenAI support for later.)

- **Procedural** (as in Reborn): the map, planets, ships, battles and interface.
- **Generated with OpenAI or Gemini** at build time, never while playing: species and leader
  portraits, event and relic illustrations, and concept art. Each picture is reviewed before it
  goes in the game, and its provider, model and prompt are recorded beside it.
- **The keys never reach the game.** The game is a public static site, so generation runs only in
  scripts (in a Claude Code session, on the owner's computer, or on GitHub's runners) and only the
  approved pictures are committed. See [ART_PIPELINE.md](ART_PIPELINE.md).
- Music and sound: Reborn's procedural audio engine; ElevenLabs remains available for voice.

### D-10 · Sharing code with Starman Reborn — **Decided**

**Decided:** copy and adapt, with a note in each copied file of where it came from. Revisit a
shared package if the same fix keeps being needed in both games.

### D-11 · What "Control" means — **Decided**

**Decided:** in Reborn you are a starman; in Control **you are Control**, the voice your captains,
governors and admirals ("starmen") answer to. Advisors address you as Control and reports come in
as signals.

### D-16 · Game length, and what a turn stands for — **Decided**

**Decided:** a standard game of 150–250 turns (6–12 hours), with a quick setting. A turn is about
**three months**, so a game spans roughly sixty years. Fleets are limited by jumps per turn and by
supply, not by Reborn's raw lane speed.

## Round 3: the M1 design, answered 19 October 2026

The owner accepted the M1 design's recommendations ([design/M1_FIRST_LIGHT.md](design/M1_FIRST_LIGHT.md)
§13) except the lanes.

### D-19 · Jump lanes — **Decided (owner's direction)**

Claude recommended Reborn's exact lane network in every game. **The owner decided otherwise:**

> Use a fraction of Reborn's lane network, and let the player build new lanes. Lane building
> should be part of the strategy game.

So lanes are infrastructure, not scenery: where you build them decides where you can go, where you
meet others, where the chokepoints are, and what the stars that astronomers know are worth to you.
The design is in [M1_FIRST_LIGHT.md §3](design/M1_FIRST_LIGHT.md#3-the-map-and-the-lanes). Three
details are open, each with a recommendation there:

| ID | Question | Recommendation |
| --- | --- | --- |
| D-19a | Which part of Reborn's network survives at the start | each power's **home web**: Reborn's lanes within two jumps of its capital, trimmed to the same size for every power; the rest of Reborn's lanes are **dark lanes**, visible and cheaper to relight than a new lane is to build |
| D-19b | Why the rest lapsed (fiction) | a lane is a pair of tuned beacons that must be tended; in a generation of hard times after Reborn ("the Lapse") the powers tended only their home lanes, and the others drifted out of tune |
| D-19c | How a lane is built | as a project at a system you hold, aimed at a star within your lane-building reach, paid for in industry, metals and fusion fuel |

**Decided on 19 October 2026, as recommended:** the owner kept the home webs for the lanes, the
Lapse as the plot point, and a project for building and relighting lanes. The home webs and the
Lapse were already built on the recommendations (increments 1 to 5); lane projects come with
increment 6.

### D-20 · The M1 start — **Decided**

As recommended: the game starts in **2176**, some 150 years after Reborn. The capitals are
**Earth** (Sol Transit Authority), **Tau Ceti** (Frontier Cooperative) and **Wolf 1061** (Hollow
Wake). The draft traits stand (Authority: industry +10%; Cooperative: colonies grow 20% faster;
Wake: ships make one extra jump a turn), to be balanced in M2 and M3.

### D-21 · How finished work reaches `main` — **Assumed**

Claude asked whether to push to `main` once the checks pass (as Reborn does) or to open a pull
request for each increment; the owner accepted the suggestions without naming one. Assumed: work
is pushed to `main`, and so deployed, once `npm run check` and CI pass. Tell Claude if you would
rather review pull requests.

### D-22 · The technology stack — **Decided**

The owner asked on 19 October 2026 whether a stack other than Reborn's would be more effective.
The full comparison, with measured sizes, is in
[research/TECH_STACK.md](research/TECH_STACK.md).

| Option | In short |
| --- | --- |
| A. Reborn's stack unchanged (hand-written HTML interface) | smallest download, but every screen's updates written by hand: slow and error-prone for a 4X's many screens, twice over for phone and desktop |
| **B. Reborn's platform plus Preact + Signals for the interface, and Biome** | about 8 KB more on a phone; components and Signals make the many two-layout screens far quicker to build and test |
| C. As B with Svelte 5 | about 19 KB; pleasant, but its own compiler, checker and file format |
| D. As B with React 19 | about 68 KB; the largest ecosystem, little gain for this game |
| E. A game engine (Godot 4) | strong native exports, but a multi-megabyte web build, weaker in phone browsers, nothing of Reborn carried over |

**Decided 19 October 2026: B**, as recommended ("Go with Preact + Signals"). Nothing built so far
changes (the simulation, data, three.js map and saves do not depend on it), and switching now cost
nothing. Set up the same day: Preact 10.29.8 (the mature line; move to 11 once it has settled),
Signals 2.11.3, Biome 2.5.15 in `npm run check` and CI, and the placeholder title rebuilt as a
Preact component.

### D-23 · Art direction and image model — **Decided**

The style test ([ART_PIPELINE.md](ART_PIPELINE.md#style-test-the-next-step)) was run on
19 October 2026: the four style-test briefs, two candidates each from both Gemini models, 16
pictures for about $1.50. The owner was sent the four contact sheets. No picture is approved into
the game until this is answered.

What the two models did with the same prompts:

| | `gemini-nano-banana-2.1` (default, about $0.05) | `gemini-3-pro-image` (premium, about $0.13) |
| --- | --- | --- |
| Look | smoother, finely detailed, close to a digital painting; the cyan rim light and star field as asked | looser, more visible brushwork, more like a painting; more atmosphere and cyan accents |
| Following the brief | closely: the cargo ship lifts off on a thin trail, the relic dwarfs the ship | freer: ships hover rather than lift off; one portrait adds a desk and a window |
| Faults | none seen | painted letters ("ST") on the officer's insignia, against the "no text" rule; black letterbox bars painted into three of the eight pictures |

| Option | What it means |
| --- | --- |
| **A. Keep the draft style; `gemini-nano-banana-2.1` for everything** | cheapest and most reliable; add "letterbox bars" to what to avoid and ask for insignia as plain shapes |
| B. Keep the style; `gemini-3-pro-image` for portraits, the default for illustrations | the more painterly portraits, at about $0.08 more each, with more pictures to discard for stray letters |
| C. `gemini-3-pro-image` for everything | the most painterly; the faults above in both series |
| D. Change the style | say what to change (brighter, more stylised, more photographic…) and the test is run again |

**Recommendation: A.** The style works on a phone (one clear subject, dark ground, readable at
thumbnail size), and the default model kept to the brief and to the rules every time.

**Decided on 19 October 2026: A.** The owner: "Keep the style and Nano Banana as the main model
for everything." `art/styles.ts` now also asks to avoid black letterbox bars, and for insignia as
plain shapes. The style-test pictures stay out of the game (they were tests, not briefs the game
needs); the first pictures for the game will be briefed when a screen needs them.

### D-24 · The capital worlds — **Decided**

D-20 placed the capitals in Sol, Tau Ceti and Wolf 1061; the new game (M1 increment 4) needs the
planet each stands on. Earth is Earth. The other two are less simple: **all four of Tau Ceti's
reported planets are disputed** (neither archive confirms them; the game keeps them and says so),
and Wolf 1061 has three confirmed planets.

| Option | Tau Ceti (Frontier Cooperative) | Wolf 1061 (Hollow Wake) |
| --- | --- | --- |
| **A. The planet nearest the habitable zone** | **Tau Ceti e**, disputed: 0.54 au from its star, about 1.8 times the sunlight Earth gets (estimated), so a warm world | **Wolf 1061 c**, confirmed: 0.09 au from its red dwarf, in its habitable zone, at least 3.4 Earth masses |
| B. The cooler choice for Tau Ceti | **Tau Ceti f**, disputed: 1.33 au out, about a third of Earth's sunlight, a cold world under domes | as A |
| C. Stations, not planets | a great orbital habitat at Tau Ceti, so no capital stands on a planet astronomers dispute | Maw Roost, a station, as the Wake's den is in Reborn |

**Recommendation: A.** Both are the worlds a settler would choose, and a capital on a disputed
planet is a good way to show the player what *disputed* means: the planet screen says so, and the
capital's own description says it is fiction. C is the cautious choice if you would rather no
capital rests on a planet that may not exist.

**Decided on 19 October 2026: A**, as recommended: the Cooperative's capital is on **Tau Ceti
e** and the Wake's on **Wolf 1061 c**. Until then (increment 5) the two capitals stood on no world;
the game state's version 3 puts them on their worlds, and a save that had settled one of them has
that colony folded into the capital. The capital's rules do not depend on its world, except that
it also yields its world's riches: Earth and Wolf 1061 c are rich in metals, Tau Ceti e poor, so
the Cooperative starts with 1 metal a turn less (to weigh when balancing in M2).

### D-25 · The 3D system view — **Decided**

The owner asked on 19 October 2026 for a view inside a star system: "enter a star system and see
the sun and the planets in 3D (the sun or multiple suns, if that's the case)". The plans had a
system *screen* (a panel of facts) but no 3D view, so it is now designed in
[M1_SYSTEM_VIEW.md](design/M1_SYSTEM_VIEW.md). Three things to settle:

| | Options | Recommendation |
| --- | --- | --- |
| **When** | (a) in M1, as a new increment 7 after lanes and research, the proof becoming increment 8; (b) now, before lanes and research; (c) in M2 | **(a)**: lanes and research finish M1's 50-turn game first, and the view then shows a game with something in it; it costs M1 one more increment |
| **Scale** | (a) compressed and labelled "not to scale", true figures in the panels; (b) true scale, zooming to find each world; (c) compressed with a true-scale switch | **(a)**: at true scale the worlds are invisible dots; (c) could follow later as a codex feature |
| **Look** | (a) Reborn's procedural shaders for stars, planets, rings and belts, copied (D-10); (b) simple lit spheres; (c) generated pictures as planet textures | **(a)**: the same look as Reborn, no art cost, and every one of the game's ~700 worlds gets its own; (b) stays as the low-quality setting for slow phones |

**Decided on 19 October 2026: (a), (a) and (a)**, as recommended: in M1 as increment 7, after
lanes and research; compressed and labelled "not to scale"; Reborn's shaders, with plain spheres
as the low-quality setting.

### D-26 · Visual direction — **Decided (owner's direction)**

On 19 October 2026 the owner asked for the game to be "visually appealing and sexy", not to "look
like a browser game", for inspiration from other games, and for at least three increments chosen
by Claude after M1's proof:

> This game has to be visually appealing and sexy. It should not look like a browser game, which
> is, by the way, what it looks like now. Use the internet and use other games for inspiration.
> Make it visually very nice and engaging for the players.

Claude's answer is [VISUAL_DIRECTION.md](design/VISUAL_DIRECTION.md): the interface as **Control's
console**, a holographic command table (D-11), luminous and animated, with the real Milky Way in
the sky, faces and emblems for the powers from the art pipeline (D-23), sound, and an installable
full-screen app; built as increments 9 to 11 after the proof (8). Inspiration is taken as
technique only, never names or art from other games.

## Since round 1

### D-27 · The art budget — **Decided**

The owner first allowed about $5 of generation without asking (19 October 2026). On 20 October
2026 they raised it: "I'm also raising your limit for the Gemini API up to $15, so you have a little
bit more room to build assets." **About $15 in all** may now be spent without asking. Spent so far:
about $1.50 on the style test, $0.60 on the powers' pictures and $0.60 on the report's pictures,
**about $2.70**, leaving about $12.30; then about $1.25 on the colony view's style slice (20 October 2026),
**about $3.95** in all; then about $3.30 on the diorama's pictures, **about $7.25** in all; then about $0.40 on its vehicles, **about $7.65** in all; then about $0.70 on its halls, rigs and fields, **about $8.35** in all. Each batch is recorded below under *Made without waiting*
with its cost and the running total; the owner is asked before the total would pass the allowance.

**Raised again on 20 October 2026:** "I'm also increasing your budget to $25 for the Gemini API, so
you can use it to continue working on the game." **About $25 in all** may now be spent without
asking; about $8.35 was spent, so about $16.65 was left. Then about $1.90 on the first homes and
props of increment 18, **about $10.25** in all; then about $4.20 on the rest of its homes and
props, **about $14.45** in all; then about $1.40 on the music (D-31), **about $15.85** in all;
then about $1.00 on increment 20's district buildings, **about $16.85** in all; then about $2.70
on increment 21's project buildings, **about $19.55** in all; then about $1.80 on increment 22's
advisors' faces, **about $21.35** in all; then about $0.30 on increment 24's deep-space
scanners, **about $21.65** in all, leaving about **$3.35**.

### D-28 · The colony view — **Decided**

On 20 October 2026 the owner asked for the colony screen "to have nice illustrations, so I can
visually see the colony, see the buildings, and see maybe some people moving around. I want it to
be really nice." The proposal is [COLONY_VIEW.md](design/COLONY_VIEW.md). Its choices:

| Question | Options | Recommendation |
| --- | --- | --- |
| **The look** | (a) a living diorama: painted landscapes and buildings from the art pipeline, put together by the game from the colony's data, with people, vehicles, weather and day and night animated in code; (b) a whole colony built in 3D in code, with no generated art; (c) one finished illustration for each kind of world, with nothing that changes as the colony grows | **(a)**: painted like the rest of the game's art, it changes with every building and every million people, and about 75 pictures cover all ~700 worlds |
| **The camera** | (a) a low panorama, as if from a ridge above the settlement, panned sideways; (b) isometric, like a city builder | **(a)**: generated pictures keep a ridge view far more reliably than an exact isometric angle, and it matches the report's pictures |
| **How the powers differ** | (a) one human architecture, each power told apart by its colour in lights, banners and markings, and its emblem; (b) a separate set of buildings for each power | **(a)** now, at a third of the cost; (b) can follow if the scenes feel too alike |
| **Where it lives** | (a) a screen of its own, entered from the colony's panel, the empire and the system view, with the panel beside or below it; (b) only a picture at the top of the colony's panel | **(a)**, the scene also giving the panel its header |
| **The spend** | about $4 to $6 for about 75 pictures over four increments, after a style slice of about $0.60 that the owner sees first | within D-27 |

**Decided on 20 October 2026:** the look (a), the camera (a) and where it lives (a), as
recommended; and for how the powers differ, **(b), a separate set of buildings for each power**,
over the recommendation. So the Sol Transit Authority, the Frontier Cooperative and the Hollow Wake
each build in an architecture of their own (COLONY_VIEW.md §3), still told apart by colour and
emblem as well; landscapes, the scaffold and other neutral pieces are shared. The structures for
the human powers become about three times as many, so the plan is now about 60 pictures to keep
(fewer home pictures, placed in numbers, offset most of the rise), at about $6 to $8 with
candidates and re-rolls, still within D-27. The style slice (increment 14) now shows all three
architectures before the rest is made.

### D-29 · The "Illustration" labels — **Decided (owner's direction)**

Since increment 9, every generated picture in the game carried an *Illustration* label (the
new-game cards, the report's pictures, and from increment 14 the colony's still and its scene's
bar). On 20 October 2026 the owner asked for them to go: "I would like to remove the text … where
it says 'illustrated', like on the colony screen." Asked whether everywhere or only on the colony's
screens, the owner chose **everywhere** (option 1a).

So: no picture is labelled *Illustration* on screen. That the pictures are made with an image model
is said once, in the codex's credits, and every picture keeps `aiGenerated: true` in
`art/manifest.json`, which is what a store's declaration needs (ART_PIPELINE.md, *Principles*).
The *Fiction* labels on invented worlds, places and powers stay: they say the content is made up,
which CLAUDE.md requires; *Illustration* only said how a picture was made. Built in the next
increment (D-30).

### D-30 · What comes next — **Decided (owner's choices)**

After the colony view (increments 14 to 17), Claude proposed a menu on 20 October 2026 and the owner
chose "1a, 2a and 2c, track A with B, C, D, E, G":

| | Chosen | In short |
| --- | --- | --- |
| 1a | The *Illustration* labels removed everywhere | D-29 |
| 2a | **Two more versions of every home** | 3 sizes × open and domed × 3 powers: 36 pictures, about $4; each slot picks its own version, so neighbouring homes differ |
| 2c | **Small props between the buildings** | water tanks, masts, cargo stacks, greenhouses, solar fields, landing beacons, a monument: about 25 pictures (some for each power, some shared), about $2.50, so a town looks lived-in |
| A | **M2 "Worlds"** as the main track ([SCOPE.md §7](SCOPE.md#7-milestones)) | districts and zoning (the colony scene's slots become districts, and zoning shows as buildings), food, credits, approval and unrest, about 15 projects, governors (D-15), the research fields, the turn report and every number explained |
| B | **Rivals that play** (from M3) | a simple AI for the other human powers, by the same rules: they survey, settle, build lanes and claim worlds; no war yet (M4) |
| C | **Events and stories** (from M5) | now and then an event with a picture and a choice that has a cost and a consequence |
| D | **Leaders and advisors** (from M5) | a face for each department, who comments in the report and gives advice |
| E | **A guided opening** (from M6) | the first turns explained, on the phone and the desktop |
| G | **Music** | needs the owner: a composer, a licensed library, or music generated at build time; to be put to the owner as a decision with options before anything is built |

Not chosen for now: second versions of the projects, halls and rigs (2b); cold and hot versions of
the homes (2d); more for the colony scene (F). Claude recommended doing A first with E inside it,
and B after the economy exists so the rivals play by M2's rules; the order, and every rule that
shapes the game, comes first as a written design with its decisions put to the owner. The art for
all of it is planned at about $12 of the $16.65 left (D-27).

### D-31 · Music — **Decided**

The owner chose music (D-30, G) on 20 October 2026, to be put as a decision before anything is
built. The game has interface sounds made in the browser (CONSOLE.md) and no music. D-09 and
SCOPE.md §4.19 first planned *Reborn's procedural audio engine*; CONSOLE.md left music to the owner,
since a composer or a licensed source costs money. What the options mean:

| Option | What it is | Cost | Download | For | Against |
| --- | --- | --- | --- | --- | --- |
| **A. Reborn's generative engine** | Copy and adapt Reborn's music engine (`src/audio/`, D-10): seeded generative moods (chords, pads, a drone, melody, bass) made in the browser, written for Control's calmer mood: the title, the map, a system, a colony, the report, and tension when rivals come near | no money; about two increments of work | about 15 KB of code, after the first press; no files | free and original; never repeats; follows the game (the mood changes with what is on screen, as Reborn's does); works offline from the first visit; one sound family with Reborn | synthesised pads and plucks, not a recorded score; atmospheric rather than memorable tunes |
| **B. Generated at build time with Google's Lyria** | Instrumental pieces made by a script, like the pictures: briefs, candidates, the owner's pick, a record of every prompt; the owner's Gemini key already reaches `lyria-3.5` | about **$0.08 a piece** (Google's price page, 20 October 2026): 8 to 10 pieces of two or three minutes, three candidates each, about **$2.40** | 2 to 3 MB a piece (Opus), about 25 MB in all, loaded after the game starts and kept offline | recorded-sounding music with real instruments, cheap and quick; the same pipeline and disclosure as the pictures (D-29) | fixed pieces that loop; quality varies from piece to piece; generated music must be declared to a store, as the pictures are, and has weaker copyright than a composer's |
| **C. A licensed library** | Royalty-free tracks bought with a licence that covers games on the web | about $20 to $60 a track, or $100 to $300 for a pack; subscriptions often cover only what is published while subscribed | as B | professional and immediate | not unique (other games use the same tracks); each licence's terms to keep, sometimes attribution; needs the owner's account |
| **D. A composer** | An original score commissioned from a composer, with a theme for each power | indie rates run about $100 to $1,000 a finished minute, most experienced freelancers $200 to $500: 20 to 30 minutes, about **$4,000 to $15,000**, over weeks | as B | the best and most distinctive; the game's own identity | the cost; the owner finds and contracts the composer, and the rights |
| **E. A and then B** | A as the base everywhere, and a few generated pieces (B) for the title and the great moments (first contact, a lane opening, victory) | A's work, plus about $1 | as A, plus a few MB | adaptive music everywhere at no cost, with a memorable theme where it counts | two systems to mix well together |

**Recommendation: E, after a listening trial.** A is free, follows the game and keeps the first
load small, as D-09 planned; generated pieces can add a theme where one matters. Before you choose,
I can let you hear both: a minute of Reborn's engine rendered to a file (free), and three trial
pieces from Lyria (about $0.25, from the D-27 allowance if you agree). D can come later for 1.0
(M6) if the game earns it. **Nothing is built until you answer.**

**Decided on 21 October 2026: B**, over the recommendation ("As recommended, except for music use
option B"). The game's music is a set of instrumental pieces generated at build time with Lyria
through the owner's Gemini key, chosen from candidates by the owner like the pictures, recorded
with their prompts, and declared as generated in the codex's credits. Reborn's engine is not used
for music. Designed and built as increment 19 ([MUSIC.md](design/MUSIC.md)); its cost comes from
the D-27 allowance.

Sources (checked 20 October 2026): [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
(Lyria 3.5, $0.08 a song); composers' rates from
[Ninichi Music](https://ninichimusic.com/blog/understanding-how-much-an-indie-game-music-composer-costs),
[GamesBeat](https://gamesbeat.com/the-indiebeat-composer-2-mellos-notes-for-starting-a-game-music-career/)
and [Twine](https://twine.net/blog/music-composer-prices-and-commissions); Reborn's engine in
[Reborn's DESIGN.md, *Audio*](https://github.com/shotif/starman-reborn/blob/main/docs/DESIGN.md).

## Round 4: the M2 design, decided 21 October 2026

M2 "Worlds", with rivals that play, events, advisors and a guided opening (D-30), is designed in
[design/M2_WORLDS.md](design/M2_WORLDS.md). Each question has its options and reasons in the
section named. **Decided on 21 October 2026: every one as recommended** (the owner: "As
recommended, except for music use option B"). M2 is built from increment 20, after the music.

| ID | Question | Recommendation |
| --- | --- | --- |
| **D-15** | Governors and edicts ([§8](design/M2_WORLDS.md#8-governors-and-edicts-d-15)) | optional governors with a priority, off by default, every action reported with its reason, your own orders locked; **edicts as policies paid from attention** (2 a turn, up to 6), with a setting to turn them off, kept only if they make play better |
| **D-32** | How a world's land is used ([§2](design/M2_WORLDS.md#2-districts-and-zoning)) | districts by the world's size (a capital 10), each zoned for farms, works, mines, labs, a market or housing, worked by a million people each, zoning built in the queue; projects separate |
| **D-33** | Food ([§3](design/M2_WORLDS.md#3-food)) | 1 food for every 2 million, pooled along each power's lanes; hunger stops growth and costs approval, then people |
| **D-34** | Credits ([§4](design/M2_WORLDS.md#4-credits)) | one tax rate (low, standard, high), upkeep for ships, outposts and projects, MoO3's overdrive curve, debt costs approval |
| **D-35** | Approval and unrest ([§5](design/M2_WORLDS.md#5-approval-and-unrest)) | its parts as drafted, four levels (content, uneasy, unrest, revolt); a colony in revolt stops but is never lost in M2 |
| **D-36** | The fifteen projects ([§6](design/M2_WORLDS.md#6-projects)) | the four of M1 and eleven more, as listed |
| **D-37** | Rivals in M2 ([§10](design/M2_WORLDS.md#10-rivals-that-play)) | both other powers in every new game (*play alone* in *More*), the same rules, no bonuses, one difficulty; others' lanes closed to you until treaties (M3); old saves go on alone |
| **D-38** | Events ([§11](design/M2_WORLDS.md#11-events-and-stories)) | about twelve, a 1 in 8 chance a turn and at most one in six turns, each with a picture and choices whose costs are shown first |
| **D-39** | Advisors ([§9](design/M2_WORLDS.md#9-advisors)) | six departments for each power, named, with faces (18 portraits), up to three lines a turn in the report, a setting to quieten them |
| **D-40** | The guided opening ([§12](design/M2_WORLDS.md#12-the-guided-opening)) | steps done by doing them, led by the advisors, on for a first game, always skippable |
| **D-41** | The art for M2 ([§20](design/M2_WORLDS.md#20-art-and-its-cost)) | 73 pictures (districts' and projects' buildings, advisors, events), about $8, made as each increment needs them: about $22.50 of the $25 in all |

## Found while building M2

### D-42 · How a new colony starts — **Decided**

Increment 20 found a gap in the M2 design: a new colony has no districts, and only works make
industry, so it could never pay the 20 industry its first zoning costs. A capital has its own 2
industry; nothing else has any. (Asked 21 October 2026.)

- **A. The founders' kit (recommended).** A new colony arrives with two districts zoned, *farms*
  then *works* (as far as its world has districts), and every colony makes **2 industry of its
  own**, as the capital and every outpost do. Its first million works its farms, so it feeds
  itself from the first turn; at 2 million it works its works too. It can always pay to zone,
  slowly at first (about 10 turns for the next district at 1 million, 4 at 2 million), and never
  gets stuck, even with no lane to the capital.
- **B. Bare land.** A new colony arrives with nothing zoned but makes 2 industry of its own: its
  first zoning takes 10 turns, and until then it eats from the store, or goes hungry and does not
  grow where it has no lane to the capital.
- **C. Zoning paid by the power.** No industry of its own; a colony with no works may pay for
  zoning from the treasury (20 credits instead of 20 industry).

**Decided on 21 October 2026: A, as recommended.** Built in increment 20.

### D-43 · Idle people and approval — **Decided**

The design takes 2 approval for each idle million (at most 10). But a comfortable world has room
for twice as many people as it has districts, and a capital at 12 million has 8 working districts,
so a full colony would always have idle people, with nothing the player could do about it but
lower taxes. A full capital then falls to *uneasy*, its farms make 10% less, it goes hungry and
starts to starve, all with no orders given. (Asked 21 October 2026.)

- **A. Idle people count only while there is open land to give them (recommended).** "−2 for each
  idle million, while districts lie open, at most −10": a reason to zone, never a penalty with no
  remedy. A full capital stays *content* (65).
- **B. As designed.** Every idle million costs 2, whether or not there is land to give them.
- **C. No penalty for idle people.** They still make nothing.

**Decided on 21 October 2026: C, no penalty** (the owner's choice, over the recommended A). Idle
people pay taxes and eat but make nothing; approval does not count them. Built in increment 20.

## Round 2: needed later

| ID | Question | Needed by | Recommendation in brief |
| --- | --- | --- | --- |
| D-12 | The alien roster: how many species in 1.0, and which concepts (drafts in [SCOPE.md §4.11](SCOPE.md#411-alien-species)) | M3 | five or six, each with a different way to play against — and, since they will become playable (D-08), each with enough to play as |
| D-13 | The artefacts and the vanished species behind them ([SCOPE.md §4.12](SCOPE.md#412-unknown-artefacts-and-the-precursors)) | M5 | tie them to Reborn's old derelicts and Pyre |
| D-14 | Victory conditions | M4 | conquest, a council vote, the artefact hunt, and a score at a turn limit |
| D-15 | How much is automated (governors and viceroys), and whether attention is a resource ("edicts" spent on changing plans, the idea MoO3 cut) | M2 | **decided with the M2 design** ([Round 4](#round-4-the-m2-design-decided-21-october-2026)): optional governors, edicts as policies paid from attention |
| D-17 | Live AI text while playing (for example, alien diplomats speaking through a language model) | M4 | not in 1.0: a public static site cannot hold API keys. Text can be written at build time with the same providers as the art |
| D-18 | Free or paid, open source or not, Steam or web only | M5 | develop in the open on GitHub Pages; decide at M5 |

## Made without waiting

Small engineering choices, easy to reverse. Overrule any of them.

| Date | Choice | Why |
| --- | --- | --- |
| 2026-10-21 | Increment 24's pictures, the deep-space scanner in each power's architecture (M2_WORLDS.md §26.3): 6 candidates, about **$0.30**, so about **$21.65** of the owner's $25 spent in all; chosen the Authority's B (a mast and a great dish), the Cooperative's A (three dishes round a listening hall) and the Wake's A (a tower of hull sections crowned with salvaged arrays) | within D-27 and D-41; the lettered sheet went to the owner to overrule |
| 2026-10-21 | Increment 24's rivals as M2_WORLDS.md §26 (D-37): they give their orders as each turn begins, in the order the powers are listed, through the same orders as the player's; the screens are given only what the player can see, while the rules work on the whole game; a power's queued lanes take no beacon slot from another power and do not stop it queuing the same lane (whoever pays first relights it, and the other is told whose it is); a refusal names a rival's lane or holding; a capital shows as one only where its colony is seen; the standings are a *Powers* tab of the empire, shown only with rivals in play | the smallest reading of §10 and §26 that keeps the rivals' plans hidden; each has a unit test |
| 2026-10-21 | A report or advisor line about a place now opens that place on a phone and a tablet, as one about a colony did; before, the report stayed in front of it | found while testing the Watch's lines |
| 2026-10-19 | Same toolchain as Reborn: Node 22, TypeScript, Vite, Vitest, the same pinned versions, plus Preact + Signals and Biome (D-22) | one way of working across both games; proven on GitHub Pages |
| 2026-10-19 | three.js for the map and battle replays, added with the map in M1's increment 2 (D-22) | Reborn's star map is three.js and is copied from there |
| 2026-10-19 | Biome's style: two spaces, single quotes, semicolons, trailing commas, lines up to 120 characters; its recommended lint rules, none switched off | close to how the code was already written; the rules caught real issues on the first run |
| 2026-10-19 | The interface borrows Reborn's design tokens and typefaces (Saira, dark navy glass, cyan accent) | the two games read as one universe |
| 2026-10-19 | CI runs on every branch and pull request; Pages deploys from `main` | catches problems before they reach the live site |
| 2026-10-19 | The simulation will be a pure, deterministic TypeScript core with no DOM access, separate from the interface | testable without a browser, AI turns can run in a worker, replays and multiplayer stay possible |
| 2026-10-19 | API keys are read from environment variables (`GEMINI_API_KEY`, and `OPENAI_API_KEY` if one is ever provided) or a git-ignored `.env`; approved pictures are committed with a provenance record | keys stay out of the repository and the public site; every picture can be traced and regenerated |
| 2026-10-19 | Reborn's sky and lanes are copied as data: `npm run data:import` loads Reborn's own modules from a checkout and writes `src/data/sky.json` (207 systems, 253 stars, 99 planets, 9 belts, 271 lanes, every value with its source); a test pins the lanes' fingerprint | the lanes are exactly Reborn's without copying its station generator, and a later re-import cannot change them unnoticed |
| 2026-10-19 | Home webs (D-19a as recommended) never overlap, respect the beacon slots and are 7 systems and 6 lanes for every power; each capital starts with a lane station; the starting stockpile is 40 metals, 20 volatiles and 40 fusion fuel ([M1 §3](design/M1_FIRST_LIGHT.md#3-the-map-and-the-lanes)) | equal starts; Sol's web needs four lanes at its capital; the stockpile is a first guess for balancing |
| 2026-10-19 | The rules measure distance in whole tenths of a light-year, worked out with `Math.sqrt` (never `Math.hypot`) | the same on every device (D-06); a tenth of a light-year is finer than any rule needs |
| 2026-10-19 | One save envelope for exported files, the autosave (with the previous one kept as a backup) and three slots; the state's version stays 1 until the first playable build, after which every change ships with a migration | nobody can have a save before increment 4, so the shape is free to change until then |
| 2026-10-19 | Browser journeys with Playwright 1.56.1 (Reborn's version) on a phone, a tablet and a desktop, in CI on every push; `npm run screenshots` for the six review sizes | phone and desktop are both tested on every change (D-04) |
| 2026-10-19 | Until the map arrives, the live site has a data preview at `#/data`, reached from the title | each increment shows something on the site, as §12 asks |
| 2026-10-19 | The map (increment 2) draws both views with three.js 0.186.1 (Reborn's version): the flat view as an orthographic camera looking down from above the celestial north pole, the 3D view as Reborn's orbit camera; labels are HTML over the canvas. Reborn's camera maths, gestures and label layout are copied with their tests | one renderer for both views keeps them consistent; copied code arrives tested |
| 2026-10-19 | Touch and mouse controls as listed in [M1 §10, *As built*](design/M1_FIRST_LIGHT.md#10-the-interface-on-phone-and-desktop): one finger turns the 3D view (as in Reborn), sheets sit on the bottom bar and open beside the map on wide, short screens | found simpler in testing than the first sketch |
| 2026-10-19 | Each screen's styles live beside it and load with it; the map and three.js load only when the map opens | the title stays small for a phone's first visit (about 12 KB of script) |
| 2026-10-19 | The planets (increment 3) follow [M1_PLANETS.md](design/M1_PLANETS.md): stars' light from Pecaut & Mamajek's mean dwarf sequence (copied with its citation), generation rules per kind of star, humans' habitability as data, every attribute badged | written before building, as the working agreement asks; the numbers are for balancing in M2 |
| 2026-10-19 | Generated planets take the letters after the highest a real planet in the system has ("Tau Ceti i", not "Tau Ceti b") | letters skipped in real names were often withdrawn candidates; fiction must never wear a real planet's name |
| 2026-10-19 | The data preview became the **codex** (`#/codex`), reached from the map, with how the estimates are made and the data's licences | §10 lists a light codex for M1 |
| 2026-10-19 | Ships and turns (increment 4) follow [M1_TURNS.md](design/M1_TURNS.md): a power starts with only its capital surveyed (its home web charted), a survey ship stops for the turn in each system it has not surveyed, ships can hold waypoints, and turns are resolved in a Web Worker | the first turns have something to do at home; one survey a turn keeps surveys readable in the report |
| 2026-10-19 | From the capital no star lies within the 6 ly blind-jump reach outside the home web, for any power; from the far side of each web, six or seven do | equal for all three powers; it makes the home web the way out, as the design intends |
| 2026-10-19 | Routes are drawn in amber, ships as chevrons a little lighter than their power's colour | the Cooperative's colour is the interface's cyan, so routes in cyan vanished over its lanes |
| 2026-10-19 | Saves now hold real games: from here on, every change to the state's shape comes with a migration | players can have saves on the live site from increment 4 |
| 2026-10-19 | Colonies (increment 5) follow [M1_COLONIES.md](design/M1_COLONIES.md): the capital is a colony of 10 with room for 12 for every power; industry, yields and growth as there; build queues that wait for resources; the game state is now version 2, and version 1 saves are migrated | written before building; the numbers are for balancing in M2 |
| 2026-10-19 | People are shown in millions ("10.4 million"), a unit being about a million; a colony's system label on the map shows its people ("Tau Ceti 10M") | plain words; the map shows where your people are at a glance |
| 2026-10-19 | The desktop's Empire panel opens with **P** (for your power), not E as first written, because Q and E already turn the map | keeps the established camera keys |
| 2026-10-19 | Lanes, research and anomalies (increment 6) follow [M1_LANES_RESEARCH.md](design/M1_LANES_RESEARCH.md), built in three deployed parts, each raising the state's version with a migration | written before building; the numbers (lane costs from M1 §3, the tree's 700 points, research at 1 for every 2 million people) are for balancing in M2 |
| 2026-10-19 | Outposts make 2 industry a turn, for lanes only | M1 §7 asks for outposts that build lanes "slowly, from a small industry of their own" |
| 2026-10-19 | The phone's bottom bar is *Report, Empire, Research, End turn*, as M1 §10 asks; the flat/3D switch moves to a small button on the map. The desktop puts Legend, Codex, the keys and *Save and leave* under **Menu**, and opens research with **T** | room for Research on a 320 px phone; a desktop top bar that fits at 1280 px |
| 2026-10-19 | An anomaly's progress towards a technology stops one point short of finishing it | the technology is still researched in its place in the tree, after what it needs |
| 2026-10-19 | Choosing where a ship goes frames its system and every star it can reach above the bars | on a phone, a neighbour could hide under the destination bar |
| 2026-10-19 | The 3D system view (increment 7) follows [M1_SYSTEM_VIEW.md](design/M1_SYSTEM_VIEW.md) and D-25: entered with **View in 3D** or **V**, left with **← Neighbourhood** or Esc; it borrows the map's renderer, and Reborn's art is copied into `src/render/art/` with its lint rule against `!` relaxed there only | one WebGL context on a phone; copied code stays as Reborn wrote it |
| 2026-10-19 | The proof (increment 8) follows [M1_PROOF.md](design/M1_PROOF.md): settings kept in `localStorage`, the saves screen, an installable full-screen app with Reborn's service worker, and the budgets (title 40 KB, map in a game 900 KB, a 50-turn save 200 KB, a 50-turn turn 200 ms) failing `npm run check` | M1 §12's budgets, measured on every build |
| 2026-10-19 | The app's icon: the Sun under Control's ring, one lane to each power in its colour and shape (`public/icon.svg`) | drawn as vector art in the game's own vocabulary; no generated picture needed |
| 2026-10-19 | A new colony grows in the turn it is founded; a survey station surveys from the turn after it is finished; a mine yields in the turn it is finished | follows the order of the turn's steps (arrivals, production, growth, yields) without special cases |
| 2026-10-19 | Industry is kept (up to 60) only while nothing is queued; while an item waits for resources, industry keeps building up behind it | an empty queue is the player's choice and is capped; a waiting item is not, so nothing is lost while metals arrive |
| 2026-10-19 | The first impression (increment 9) follows [FIRST_IMPRESSION.md](design/FIRST_IMPRESSION.md): the Milky Way baked once into a cube map; the title's camera turns in the plane of the galaxy; the scene has its own canvas, made after the menu and thrown away with the title; the six approved power pictures go on the new-game cards | a phone draws the sky once; the band is always in view; the title stays small |
| 2026-10-19 | The living map (increment 10) follows [LIVING_MAP.md](design/LIVING_MAP.md): no full-screen bloom pass (the glow is drawn into each star's sprite), ambient motion drawn at most 30 times a second and never with reduced motion, and territory shown as soft fields round held systems with no rules behind them yet | a phone pays for no extra pass and little battery; borders with rules come with claims in a later milestone |
| 2026-10-19 | Control's console (increment 11) follows [CONSOLE.md](design/CONSOLE.md): interface sounds made in the browser (no files, nothing to licence), **on by default** with a setting to turn them off; no music, which needs the owner (a composer or a licensed source); report illustrations left for later, as they need new pictures | games have sound; quiet tones that wait for the first press are easy to turn off, and music and pictures cost money the owner decides on |
| 2026-10-19 | After increments 9 to 11, a fourth of the visual direction: **In flight** (increment 12, [IN_FLIGHT.md](design/IN_FLIGHT.md)), ships seen flying the lanes they took when a turn ends, and the system view under the map's sky | the owner asked for at least three increments of my own choosing; ending a turn now shows what happened out there |
| 2026-10-19 | Illustrated dispatches (increment 13, [DISPATCHES.md](design/DISPATCHES.md)): six report pictures from twelve candidates, about $0.60, so about $2.70 of the owner's $5 spent in all; chosen survey B, colony A, ship B, research A, anomaly A, lane B | within the spend the owner allowed without asking; the lettered contact sheet was sent to the owner to overrule |
| 2026-10-20 | The colony view's style slice (increment 14): 25 candidates, about $1.25, so about **$3.95** of the owner's $15 spent in all; chosen shore E, the Cooperative's homes B, shipyard B, lane station B, mine B, the scaffold A, the Authority's homes D, the Wake's homes B. Landscapes are painted from a raised viewpoint, and buildings on magenta cut off at their base | within D-27; the lettered contact sheets were sent to the owner to overrule, and nothing more is generated until they have seen the slice |
| 2026-10-20 | The owner saw the style slice and approved it with Claude's picks ("Go ahead, my picks"), keeping the buildings crisp rather than more painterly, so they read clearly when small; the rest of the colony view's pictures are made in this style | the owner's answer, asked with the contact sheets and screenshots before anything more was generated |
| 2026-10-20 | The colony view's diorama (increment 15): 66 candidates, about $3.30, so about **$7.25** of the owner's $15 spent in all, for every landscape and every power's homes and projects (picks in [COLONY_VIEW.md §8](design/COLONY_VIEW.md#increment-15-the-diorama-20-october-2026)); the ice painted under a magenta sky; keying despills magenta seen through glass | within D-27 and the owner's go-ahead; the lettered contact sheets go to the owner to overrule |
| 2026-10-20 | The colony view's life (increment 16): the three shuttles and the rover, 8 candidates, about $0.40, so about **$7.65** of the owner's $15 spent in all; chosen the Authority's shuttle A, the Cooperative's B, the Wake's B, the rover A. A day of 90 seconds; weather and the most people only on medium and high quality | within D-27; a machine of four cores starts on low quality, so it has no weather |
| 2026-10-20 | Increment 18, the first batch (D-30 2a, 2c): 38 candidates, about **$1.90**, so about **$10.25** of the owner's $25 spent in all; chosen the size-2 homes of each capital, b and c (Authority open b A, c B; Cooperative domed b A, c B; Wake domed b A, c A), and 13 props (every power's monument and mast, the Authority's cargo, the Cooperative's and the Wake's greenhouses, the solar field, landing beacon, storage spheres and supply crates; all A but the Wake's mast and both greenhouses, B). Props are published to fit a square of 256 and 512 px; the 1 MB budget for a colony's first pictures is now measured per power | within D-27; the lettered contact sheets and screenshots went to the owner, and the rest is made only after they have seen them |
| 2026-10-21 | The owner kept increment 18's first picks ("as recommended"); the rest of the homes and props are made the same way | the owner's answer to the contact sheets |
| 2026-10-21 | Increment 23's governors and edicts as M2_WORLDS.md §25 (D-15 as recommended): governors act as the turn ends, after growth and upkeep, so the report shows what they did before the next turn; farms are always worked first; a district the player zones, rezones or clears is locked until they let the governor have it, and items the player queues are theirs (there is no lock to undo on a queued item); attention starts at 2; edicts sit in the empire under the treasury, and the *Edicts* setting only hides them | the smallest reading of §8 that keeps the player's orders theirs; each has a unit test |
| 2026-10-21 | Increment 22's pictures, the advisors' faces (M2_WORLDS.md §24): 36 candidates, about **$1.80**, so about **$21.35** of the owner's $25 spent in all; chosen every Authority advisor's A (starlit backgrounds, as the leaders'); the Cooperative's Colonies A, Works A, Treasury B, Science B, Survey A, Watch A; the Wake's Colonies A, Works B (its brief reworded after the image model's filter refused it once), Treasury A, Science A, Survey A, Watch A | within D-27 and D-41; the lettered sheets went to the owner to overrule |
| 2026-10-21 | The advisors' names, roles and lines (M2_WORLDS.md §24.1, §24.2) were written for the game, in three voices; the Watch speaks only once there are rivals (increment 24) | D-39 chose named advisors with faces and voices; names and words are the game's own |
| 2026-10-21 | Increment 21's pictures, M2's projects in each power's architecture (M2_WORLDS.md §23): 54 candidates, about **$2.70**, so about **$19.55** of the owner's $25 spent in all; chosen the Authority's hydroponics B, exchange B, civic centre B, recreation dome B, institute A, fusion plant A, refinery A, arcology B, medical centre A; the Cooperative's hydroponics B, exchange B, civic centre B (A stood on a cut block of ground), recreation dome A, institute B, fusion plant A, refinery B, arcology A, medical centre A; the Wake's hydroponics A, exchange B, civic centre A, recreation dome A, institute A, fusion plant B, refinery B (A stood on a mound), arcology A, medical centre B | within D-27 and D-41; the lettered sheets went to the owner to overrule |
| 2026-10-21 | Increment 21 leaves the flare shield for events (25) and the deep-space scanner for rivals (24): until then each would do nothing. The tree's eighteen new technologies, their costs and effects are as M2_WORLDS.md §23.2 | each project is built when it can do something |
| 2026-10-21 | The phone's picture budgets measured as the phone loads them (M2_WORLDS.md §23.4): buildings published at 256 px too, the still loading each picture at the width it is drawn (618 KB of its 1 MB at most), and a new budget of 2 MB for the diorama it opens (1.62 MB at most) | the old measure counted 512 px buildings and a smaller landscape than a phone loaded |
| 2026-10-21 | Increment 20's pictures, the districts' buildings (M2_WORLDS.md §15): 20 candidates, about **$1.00**, so about **$16.85** of the owner's $25 spent in all; chosen the Authority's works, labs and market A, the Cooperative's works A, labs B, market A, the Wake's works A, labs B (A stood on a block of ground), market A, and the greenhouse farms B | within D-27 and D-41; the lettered sheet went to the owner to overrule |
| 2026-10-21 | Increments 20 and 21 of M2 built as one (districts and food with credits and approval): food, approval and credits each change what the others yield, so none can be played or balanced alone. M2's later increments move up one: projects and research are 21, the proof 27 | the game stays playable and balanced at every step |
| 2026-10-21 | M2's economy in whole numbers (increment 20): a yield kept at a lower approval is rounded to the nearest (so "10% less" is not a third less of a small yield); what a turn yields is counted as the turn begins, so a deep mine yields from the next turn; only the capital's network keeps a food store (5 a colony), a colony cut off from it feeds itself; what needs you warns of food two turns ahead and names districts no one works only once the colony is full; a district scaffold takes its district's size; projects stand after the districts, then in a ring round the town | small and easy to change; each has a unit test |
| 2026-10-21 | The music (increment 19, [MUSIC.md](design/MUSIC.md)): 15 candidates from `lyria-3.5` and four trials, about **$1.40**, so about **$15.85** of the owner's $25 spent in all; seven pieces chosen by what can be measured and sent to the owner to choose by ear; MP3 at 112 kbps levelled to −18 LUFS, about 2 MB each, downloaded only when played; music on by default with a setting | within D-27; the owner chose generated music (D-31) |
| 2026-10-21 | Increment 18, the rest: 84 candidates, about **$4.20**, so about **$14.45** of the owner's $25 spent in all; 30 more homes and 12 more props (picks in [COLONY_VIEW.md §8](design/COLONY_VIEW.md#increment-18-the-second-part-21-october-2026)); the 1 MB budget for a colony's first pictures is measured over the game's own scenes (921 KB at most) | within D-27; the lettered sheets went to the owner to overrule |
| 2026-10-20 | The colony view's full set (increment 17): the capitals' halls, the outposts' rigs and the fields, 14 candidates, about $0.70, so about **$8.35** of the owner's $15 spent in all; chosen the Authority's hall A, the Cooperative's A, the Wake's B, the fields A, every rig A. The hall takes the town's middle slot (the homes move one slot out, once); open-air colonies farm up to two free slots; budgets of 40 KB for the colony's code and 1 MB for its heaviest first pictures on a phone | within D-27; about $6.65 of the allowance is left |
