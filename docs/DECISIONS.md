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
| D-27 | How much may be spent on generated art without asking | Decided 2026-10-20 | **about $15 in all** (raised from about $5); about $2.70 spent by 20 October 2026 |
| D-28 | The colony view: its look, camera, how powers differ, where it lives | **Open** | a living diorama from the art pipeline, seen from a ridge; see [D-28](#d-28--the-colony-view--open) and [COLONY_VIEW.md](design/COLONY_VIEW.md) |
| D-12 – D-15, D-17, D-18 | Round 2 | Open | see [Round 2](#round-2-needed-later) |

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
**about $2.70**, leaving about $12.30. Each batch is recorded below under *Made without waiting*
with its cost and the running total; the owner is asked before the total would pass $15.

### D-28 · The colony view — **Open**

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

## Round 2: needed later

| ID | Question | Needed by | Recommendation in brief |
| --- | --- | --- | --- |
| D-12 | The alien roster: how many species in 1.0, and which concepts (drafts in [SCOPE.md §4.11](SCOPE.md#411-alien-species)) | M3 | five or six, each with a different way to play against — and, since they will become playable (D-08), each with enough to play as |
| D-13 | The artefacts and the vanished species behind them ([SCOPE.md §4.12](SCOPE.md#412-unknown-artefacts-and-the-precursors)) | M5 | tie them to Reborn's old derelicts and Pyre |
| D-14 | Victory conditions | M4 | conquest, a council vote, the artefact hunt, and a score at a turn limit |
| D-15 | How much is automated (governors and viceroys), and whether attention is a resource ("edicts" spent on changing plans, the idea MoO3 cut) | M2 | optional governors with visible priorities and reasons, never the default; try edicts in M2 and keep them only if they make play better |
| D-17 | Live AI text while playing (for example, alien diplomats speaking through a language model) | M4 | not in 1.0: a public static site cannot hold API keys. Text can be written at build time with the same providers as the art |
| D-18 | Free or paid, open source or not, Steam or web only | M5 | develop in the open on GitHub Pages; decide at M5 |

## Made without waiting

Small engineering choices, easy to reverse. Overrule any of them.

| Date | Choice | Why |
| --- | --- | --- |
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
