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
| D-19a–c | Which lanes survive, why the rest lapsed, how a lane is built | Open | see [D-19](#d-19--jump-lanes--decided-owners-direction-details-open) |
| D-20 | The M1 start: year, capitals, traits | Decided 2026-10-19 | 2176; Earth, Tau Ceti, Wolf 1061; the draft traits |
| D-21 | How finished work reaches `main` | Assumed 2026-10-19 | pushed to `main` once the checks pass, as in Reborn |
| D-22 | The technology stack | Decided 2026-10-19 | **the web platform, with Preact + Signals for the interface** and Biome; see [D-22](#d-22--the-technology-stack--decided) |
| D-23 | Art direction and image model, from the style test | Open | see [D-23](#d-23--art-direction-and-image-model--open) |
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

### D-19 · Jump lanes — **Decided (owner's direction); details open**

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

### D-23 · Art direction and image model — **Open**

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
