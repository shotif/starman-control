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
| D-27 | How much may be spent on generated art without asking | Decided 2026-10-22 | **about $50 in all** (raised from $5, then $15, then $25, then $35, by D-57); about $33.20 spent by 23 October 2026 (pictures and music) |
| D-28 | The colony view: its look, camera, how powers differ, where it lives | Decided 2026-10-20 | a living diorama from the art pipeline, seen from a ridge, on a screen of its own, with **a set of buildings for each power**; see [D-28](#d-28--the-colony-view--decided) and [COLONY_VIEW.md](design/COLONY_VIEW.md) |
| D-29 | The "Illustration" labels on pictures | Decided 2026-10-20 (owner's direction) | **removed everywhere**; the AI disclosure moves to the codex's credits and stays in the art records; *Fiction* labels stay; see [D-29](#d-29--the-illustration-labels--decided) |
| D-30 | What comes after the colony view | Decided 2026-10-20 (owner's choices) | more varied buildings first, then **M2 "Worlds"** with rivals that play, events, leaders and advisors and a guided opening; music needs the owner; see [D-30](#d-30--what-comes-next--decided) |
| D-31 | Music | Decided 2026-10-21 (owner's choice) | **B: pieces generated at build time with Google's Lyria**, chosen by the owner like the pictures; see [D-31](#d-31--music--decided) |
| D-15, D-32 – D-41 | The M2 design: governors and edicts, districts, food, credits, approval, projects, rivals, events, advisors, the opening, the art | Decided 2026-10-21 | **as recommended**; see [Round 4](#round-4-the-m2-design-decided-21-october-2026) and [M2_WORLDS.md §21](design/M2_WORLDS.md#21-decisions-for-the-owner) |
| D-42 | How a new colony starts, now that only districts make industry | Decided 2026-10-21 | **A, the founders' kit**: farms and works zoned, and 2 industry of its own; see [D-42](#d-42--how-a-new-colony-starts--decided) |
| D-43 | Idle people and approval | Decided 2026-10-21 (owner's choice) | **C, no penalty**: idle people make nothing, and that is all; see [D-43](#d-43--idle-people-and-approval--decided) |
| D-44 | Where research comes from ([M2B §4](design/M2B_SCIENCE.md#4-where-research-comes-from-d-44)) | Decided 2026-10-21 | **C, scholars and a lab for every governor**, as recommended; see [Round 5](#round-5-science-and-rivalry-decided-21-october-2026) |
| D-45 | Discoveries ([M2B §5](design/M2B_SCIENCE.md#5-discoveries-d-45)) | Decided 2026-10-21 | **C, inspirations and observations of the real sky**, as recommended; see [Round 5](#round-5-science-and-rivalry-decided-21-october-2026) |
| D-46 | A deeper tree ([M2B §6](design/M2B_SCIENCE.md#6-a-deeper-tree-d-46)) | Decided 2026-10-21 | **C, rising costs and tiers 4 and 5**, as recommended; see [Round 5](#round-5-science-and-rivalry-decided-21-october-2026) |
| D-47 | Forks ([M2B §7](design/M2B_SCIENCE.md#7-forks-d-47)) | Decided 2026-10-21 | **B, three doctrine pairs**, as recommended; see [Round 5](#round-5-science-and-rivalry-decided-21-october-2026) |
| D-48 | Rivals' science ([M2B §8](design/M2B_SCIENCE.md#8-knowledge-spreads-and-rivals-science-is-felt-d-48)) | Decided 2026-10-21 | **all three**: spreading knowledge, the Watch's rumours and science in the standings, as recommended; see [Round 5](#round-5-science-and-rivalry-decided-21-october-2026) |
| D-49 | Great works ([M2B §9](design/M2B_SCIENCE.md#9-great-works-d-49)) | Decided 2026-10-21 | **yes, the four drafted**, as recommended; see [Round 5](#round-5-science-and-rivalry-decided-21-october-2026) |
| D-50 | A score ([M2B §10](design/M2B_SCIENCE.md#10-a-score-d-50)) | Decided 2026-10-21 | **yes, with no victory yet**, as recommended; see [Round 5](#round-5-science-and-rivalry-decided-21-october-2026) |
| D-12 | The first alien species ([M3 §5](design/M3_NEIGHBOURS.md#5-the-first-alien-species-d-12)) | Decided 2026-10-22 | **A, the twilight folk and the cloud drifters**, as recommended; see [Round 6](#round-6-neighbours-decided-22-october-2026) |
| D-51 | The map out to 33 light-years ([M3 §4](design/M3_NEIGHBOURS.md#4-the-map-out-to-33-light-years-d-51)) | Decided 2026-10-22 | **A, extend the census now**, with leave to run the sky fetch on GitHub's runners, as recommended; see [Round 6](#round-6-neighbours-decided-22-october-2026) |
| D-52 | First contact and translation ([M3 §6](design/M3_NEIGHBOURS.md#6-first-contact-and-translation-d-52)) | Decided 2026-10-22 | **A, a process**: unaware, signal, words, talk, as recommended; see [Round 6](#round-6-neighbours-decided-22-october-2026) |
| D-53 | Treaties ([M3 §8](design/M3_NEIGHBOURS.md#8-treaties-d-53)) | Decided 2026-10-22 | **A, treaties without war**, as recommended; see [Round 6](#round-6-neighbours-decided-22-october-2026) |
| D-54 | Borders and claims ([M3 §9](design/M3_NEIGHBOURS.md#9-borders-and-claims-d-54)) | Decided 2026-10-22 | **A, claims round holdings**, as recommended; see [Round 6](#round-6-neighbours-decided-22-october-2026) |
| D-55 | Memory and attitude ([M3 §7](design/M3_NEIGHBOURS.md#7-memory-and-attitude-d-55)) | Decided 2026-10-22 | **A, remembered acts with their reasons**, as recommended; see [Round 6](#round-6-neighbours-decided-22-october-2026) |
| D-56 | The Hollow Wake's dealings ([M3 §11](design/M3_NEIGHBOURS.md#11-the-hollow-wakes-dealings-d-56)) | Decided 2026-10-22 | **A, tolls, bribes and protection in M3**, as recommended; see [Round 6](#round-6-neighbours-decided-22-october-2026) |
| D-57 | The art for M3 ([M3 §16](design/M3_NEIGHBOURS.md#16-art-and-its-cost-d-57)) | Decided 2026-10-22 | **raise D-27 to $50**, as recommended; see [Round 6](#round-6-neighbours-decided-22-october-2026) |
| D-58 | Battles and wars | Decided 2026-10-22 (owner's direction) | **yes:** "I would like the possibility to have battles and wars"; M4 is designed for it in [M4_FLEETS.md](design/M4_FLEETS.md); see [D-58](#d-58--battles-and-wars--decided) |
| D-59 | Warships and their designs ([M4 §4](design/M4_FLEETS.md#4-warships-and-their-designs-d-59)) | Decided 2026-10-22 | **A, hulls and modules**, the yard's designs and refits, as recommended; see [Round 7](#round-7-fleets-decided-22-october-2026) |
| D-60 | Weapons research ([M4 §5](design/M4_FLEETS.md#5-the-weapons-field-d-60)) | Decided 2026-10-22 | **A, a seventh field, Weapons**, as recommended; see [Round 7](#round-7-fleets-decided-22-october-2026) |
| D-61 | Fleets and their orders ([M4 §6](design/M4_FLEETS.md#6-fleets-and-their-orders-d-61)) | Decided 2026-10-22 | **A, fleets with orders, fighting together as task forces**; upkeep by size, repairs near home, as recommended; see [Round 7](#round-7-fleets-decided-22-october-2026) |
| D-62 | Battles ([M4 §7](design/M4_FLEETS.md#7-battles-d-62)) | Decided 2026-10-22 | **A, rounds at three ranges**, as recommended; see [Round 7](#round-7-fleets-decided-22-october-2026) |
| D-63 | The replay ([M4 §8](design/M4_FLEETS.md#8-the-replay-d-63)) | Decided 2026-10-22 | **A, in 3D in the system**, as recommended; see [Round 7](#round-7-fleets-decided-22-october-2026) |
| D-64 | War and peace ([M4 §9](design/M4_FLEETS.md#9-war-and-peace-d-64)) | Decided 2026-10-22 | **A, declared war, peace, pacts, capitulation, weariness**, as recommended; see [Round 7](#round-7-fleets-decided-22-october-2026) |
| D-65 | Defences and invasion ([M4 §10](design/M4_FLEETS.md#10-defences-and-invasion-d-65)) | Decided 2026-10-22 | **A, all of SCOPE §4.8**, as recommended; see [Round 7](#round-7-fleets-decided-22-october-2026) |
| D-66 | Raids and protection ([M4 §11](design/M4_FLEETS.md#11-raids-and-protection-d-66)) | Decided 2026-10-22 | **A, the outlaw raids without war**, as recommended; see [Round 7](#round-7-fleets-decided-22-october-2026) |
| D-67 | The council ([M4 §12](design/M4_FLEETS.md#12-the-council-d-67)) | Decided 2026-10-22 | **A, the Assembly: elections and two resolutions**, as recommended; see [Round 7](#round-7-fleets-decided-22-october-2026) |
| D-14 | Victory and defeat ([M4 §13](design/M4_FLEETS.md#13-victory-and-defeat-d-14)) | Decided 2026-10-22 | **A, conquest, the vote, a score at a turn limit** (250 turns by default), as recommended; see [Round 7](#round-7-fleets-decided-22-october-2026) |
| D-68 | Rivals at war ([M4 §14](design/M4_FLEETS.md#14-rivals-at-war-d-68)) | Decided 2026-10-22 | **A, by character**, as recommended; see [Round 7](#round-7-fleets-decided-22-october-2026) |
| D-17 | Words from the other powers ([M4 §15](design/M4_FLEETS.md#15-words-from-the-other-powers-d-17)) | Decided 2026-10-22 | **A, every line written into the game**, as recommended; see [Round 7](#round-7-fleets-decided-22-october-2026) |
| D-69 | Who wins by the Assembly's vote ([below](#d-69--who-wins-by-the-assemblys-vote--decided-owners-choice)) | Decided 2026-10-22 (owner's choice) | **war plans for the rivals (H), fear at the deciding vote (K), tiring of a leader (C), and a less-loved Cooperative**, built as increment 51: three different winners in eight games (the target was four), none by the vote; every part has a switch |
| D-13, D-70 – D-78 | The M5 design: the Absent, relic sites, the keys, guardians, leaders, espionage, events, the dying star, the species, Pyre | Assumed 2026-10-22 (owner's leave) | **as recommended**, open to the owner to overrule; see [Round 8](#round-8-the-unknown-assumed-22-october-2026) and [M5_UNKNOWN.md](design/M5_UNKNOWN.md) |
| D-18 | Free or paid, open source or not, Steam or the web only | Open | the owner's; see [Round 2](#round-2-needed-later) |
| D-79 | The Co-op's lead in long games ([below](#d-79--the-co-ops-lead-in-long-games--assumed-owners-leave)) | Assumed 2026-10-23 (owner's leave) | **A, leave the Co-op as it is for M6's longer campaigns**, as recommended; overrule any time |
| D-80 – D-86 | The M6 design: lessons when they matter, playing an alien power, the keys within everyone's reach, the balance targets for 1.0, accessibility, map sizes, music and sound | Assumed 2026-10-23 (owner's leave) | **as recommended**, open to the owner to overrule; see [Round 9](#round-9-10-assumed-23-october-2026) and [M6_ONE.md](design/M6_ONE.md) |

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
scanners, **about $21.65** in all; then about $1.50 on increment 25's events and flare shields,
**about $23.15** in all, leaving about **$1.85**.

**Raised again on 21 October 2026:** "Your art budget is increased to $35." **About $35 in all**
may now be spent without asking; about $23.15 was spent, so about **$11.85** is left. M2b's 13
pictures are planned at about $1.30 (M2B_SCIENCE.md §14). Then about $0.90 on increment 30's lane
relays, orbital habitats and terraforming stations, **about $24.05** in all; then about $0.40 on
increment 32's four great works, **about $24.45** in all, leaving about **$10.55**.

**Raised again on 22 October 2026** by D-57, answered *as recommended*: **about $50 in all** may
now be spent without asking; about $24.45 was spent, so about **$25.55** is left. M3's pictures
are planned at about $6.50 (M3_NEIGHBOURS.md §16). Then about $0.30 on increment 34's three
Envoys, **about $24.75** in all; then about $0.50 on increment 38's Duskfolk (with a re-roll of
two faces), **about $25.25** in all; then about $0.30 on increment 39's Drifters, **about $25.55** in
all, leaving about **$24.45**. Then about $0.30 on increment 41's Admirals, **about $25.85** in all,
leaving about **$24.15**. Then about $1.30 on increment 46's defences and report pictures, **about
$27.15** in all, leaving about **$22.85**.

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
| D-12 | The alien roster: how many species in 1.0, and which concepts (drafts in [SCOPE.md §4.11](SCOPE.md#411-alien-species)) | M3 | five or six, each with a different way to play against — and, since they will become playable (D-08), each with enough to play as. **M3's two are decided in [Round 6](#round-6-neighbours-decided-22-october-2026)** |
| D-13 | The artefacts and the vanished species behind them ([SCOPE.md §4.12](SCOPE.md#412-unknown-artefacts-and-the-precursors)) | M5 | tie them to Reborn's old derelicts and Pyre. **Assumed for M5 in [Round 8](#round-8-the-unknown-assumed-22-october-2026)** |
| D-14 | Victory conditions | M4 (decided) | conquest, a council vote, the artefact hunt, and a score at a turn limit. **Decided for M4 in [Round 7](#round-7-fleets-decided-22-october-2026)** |
| D-15 | How much is automated (governors and viceroys), and whether attention is a resource ("edicts" spent on changing plans, the idea MoO3 cut) | M2 | **decided with the M2 design** ([Round 4](#round-4-the-m2-design-decided-21-october-2026)): optional governors, edicts as policies paid from attention |
| D-17 | Live AI text while playing (for example, alien diplomats speaking through a language model) | M4 (decided) | not in 1.0: a public static site cannot hold API keys. Text can be written at build time with the same providers as the art. **Decided for M4 in [Round 7](#round-7-fleets-decided-22-october-2026)** |
| D-18 | Free or paid, open source or not, Steam or web only | M5 | develop in the open on GitHub Pages; decide at M5 |

## Round 5: science and rivalry, decided 21 October 2026

M2's headless games showed two powers making 5 research a turn for 100 turns while the third
finished the whole tree by turn 90 ([M2B_SCIENCE.md §1](design/M2B_SCIENCE.md#1-what-m2s-games-showed)).
The proposals, each with its options and recommendation, are in
[M2B_SCIENCE.md §15](design/M2B_SCIENCE.md#15-decisions-for-the-owner): **D-44** where research comes
from, **D-45** discoveries, **D-46** a deeper tree, **D-47** forks, **D-48** rivals' science,
**D-49** great works and **D-50** a score.

**Decided on 21 October 2026: every one as recommended** (the owner: "MY ANSWERS to D-44 to D-50:
as recommended", with no exception named). So M2b is built as M2B_SCIENCE.md §12 sets out,
increments 28 to 32, each with its detailed design written first:

| ID | Answer | Why it was recommended |
| --- | --- | --- |
| **D-44** | **C:** scholars (research from every colony's people) and a lab for every governor | research then grows with every empire, whatever its governors run for, and the rivals follow without rules of their own |
| **D-45** | **C:** inspirations (a deed for every technology) and observations of the real sky (labelled *Observed*) | discoveries reward play and make the real sky worth looking at |
| **D-46** | **C:** rising costs and tiers 4 and 5 | the tree lasts the 150 to 250 turns of D-16, and its new tiers change how the game is played |
| **D-47** | **B:** three doctrine pairs | a few choices that close another path, without a fork in every field |
| **D-48** | spreading knowledge, the Watch's rumours and science in the standings | rivals' science is felt, and whoever is behind can catch up |
| **D-49** | **yes:** the four great works drafted | a race anyone can win |
| **D-50** | **yes:** a score, with no victory yet | every power's progress in one number, and a measure for the headless games |

## Round 6: neighbours, decided 22 October 2026

With M2b built, M3 "Neighbours" (SCOPE.md §5) is designed in [design/M3_NEIGHBOURS.md](design/M3_NEIGHBOURS.md): first contact,
treaties, borders, trade, memory and the first two alien species. Each question has its options
and reasons in the section named. **Decided on 22 October 2026: every one as recommended** (the
owner: "As recommended"). So M3 is built as M3_NEIGHBOURS.md §14 sets out, increments 33 to 40,
each with its detailed design written first; D-51's answer gives leave to run the sky fetch on
GitHub's runners, and D-57's raises D-27 to about $50.

| ID | Question | Options | Recommendation | Why |
| --- | --- | --- | --- | --- |
| **D-12** | The first alien species ([§5](design/M3_NEIGHBOURS.md#5-the-first-alien-species-d-12)) | A the twilight folk and the cloud drifters · B the twilight folk only · C three, adding the under-ice thinkers · D another pair of the six | **A** | one that settles the red dwarfs humans struggle with, one that trades: unlike humans and each other, and each gives M3's rules something to work on |
| **D-51** | The map out to 33 light-years ([§4](design/M3_NEIGHBOURS.md#4-the-map-out-to-33-light-years-d-51)) | A extend the census now · B stay at 27 ly · C 30 ly | **A**, with leave to run the sky fetch on GitHub's runners | D-01 and D-02 put the aliens beyond the frontier, in about 340 systems; the fetch reaches the sky archives only from GitHub's runners, as Reborn's workflow (or a copy of it in Control's repository) |
| **D-52** | First contact and translation ([§6](design/M3_NEIGHBOURS.md#6-first-contact-and-translation-d-52)) | A a process: unaware, signal, words, talk · B talk at once | **A** | meeting an alien should feel different from meeting humans; misunderstanding is part of the story |
| **D-53** | Treaties ([§8](design/M3_NEIGHBOURS.md#8-treaties-d-53)) | A without war: open lanes, trade, shared research, borders · B the full set, war in name only | **A** | no words without deeds: war, alliance and non-aggression come with M4's battles |
| **D-54** | Borders and claims ([§9](design/M3_NEIGHBOURS.md#9-borders-and-claims-d-54)) | A claims round holdings · B none until M4 | **A** | gives quarrels a place on the map and memory something to remember |
| **D-55** | Memory and attitude ([§7](design/M3_NEIGHBOURS.md#7-memory-and-attitude-d-55)) | A remembered acts, each with its reason · B a single number | **A** | every number explains itself; the player can see why a neighbour is cold |
| **D-56** | The Hollow Wake's dealings ([§11](design/M3_NEIGHBOURS.md#11-the-hollow-wakes-dealings-d-56)) | A tolls, bribes and protection in M3 · B later, with M4's raids | **A** | the Wake should deal unlike the lawful powers from the first treaty |
| **D-57** | The art for M3 ([§16](design/M3_NEIGHBOURS.md#16-art-and-its-cost-d-57)) | raise D-27 to $50 · keep $35 | **raise to $50** | about 65 pictures (about $6.50) fit the $10.55 left, but leave nothing for re-rolls or M4's ships |

## Round 7: fleets, decided 22 October 2026

### D-58 · Battles and wars — **Decided (owner's direction)**

M3 gave the powers treaties without war (D-53), leaving non-aggression, alliance and war for M4.
On 22 October 2026, after M3, the owner said:

> Yes, I would like the possibility to have battles and wars.

So M4 is designed around it: warships and their designs, fleets, battles with orders before and a
replay after (D-07), war and peace, invasion and defences, the outlaw's raids, the council, and the
first victories ([design/M4_FLEETS.md](design/M4_FLEETS.md)). War is possible, never forced: a
player can keep the peace, and the rivals go to war for reasons they show (D-68).

The owner was also asked to play M3 (100 turns or more, on a phone and a desktop); their answers
will be recorded here and folded into the M4 design when they come (not yet, on 22 October 2026).

### The M4 questions — **Decided**

Each question has its options and reasons in the section of [M4_FLEETS.md](design/M4_FLEETS.md)
named. **Decided on 22 October 2026: every one as recommended** (the owner chose *as recommended*
for Round 7). So M4 is built as M4_FLEETS.md §17 sets out, increments 41 to 50, each with its
detailed design written first. Asked the same day whether they had played M3, the owner said *not
yet*; M4 goes ahead without it, and the try stays open.

| ID | Question | Options | Recommendation | Why |
| --- | --- | --- | --- | --- |
| **D-59** | Warships and their designs ([§4](design/M4_FLEETS.md#4-warships-and-their-designs-d-59)) | A hulls and modules, the yard's designs, refits · B fixed classes · C a full designer | **A** | designs that counter the enemy's, without a designer too deep for a phone; the rivals use the yard's |
| **D-60** | Weapons research ([§5](design/M4_FLEETS.md#5-the-weapons-field-d-60)) | A a seventh field, Weapons · B spread over the fields | **A** | SCOPE planned one; a power that arms learns less of the rest, and its choices are in one place |
| **D-61** | Fleets and their orders ([§6](design/M4_FLEETS.md#6-fleets-and-their-orders-d-61)) | A fleets with orders, fighting together as task forces · B task forces inside fleets · C no fleets | **A**, with upkeep by size and repairs near home | D-07's orders for each task force, with one list of fleets for a phone |
| **D-62** | Battles ([§7](design/M4_FLEETS.md#7-battles-d-62)) | A rounds at three ranges · B one comparison of strength | **A** | stance, priority, retreat and the damage types each change the outcome, and every battle can say why |
| **D-63** | The replay ([§8](design/M4_FLEETS.md#8-the-replay-d-63)) | A in 3D in the system · B a 2D schematic · C later | **A** | D-07 decided a 3D replay; ships drawn in code cost nothing and each power's look is its own |
| **D-64** | War and peace ([§9](design/M4_FLEETS.md#9-war-and-peace-d-64)) | A declared war, peace, pacts, capitulation, weariness · B war and peace only | **A** | wars with reasons and a price, and a way for a beaten power to surrender, so conquest can end |
| **D-65** | Defences and invasion ([§10](design/M4_FLEETS.md#10-defences-and-invasion-d-65)) | A all of SCOPE §4.8 · B without bombardment and blockade | **A** | a war is won by taking worlds; bombardment and blockade make holding an orbit matter |
| **D-66** | Raids and protection ([§11](design/M4_FLEETS.md#11-raids-and-protection-d-66)) | A the outlaw raids without war · B raids only in war | **A** | keeps M3's promise (§23.4) that protection matters from M4, and the Wake plays as an outlaw |
| **D-67** | The council ([§12](design/M4_FLEETS.md#12-the-council-d-67)) | A elections and two resolutions · B elections only · C more resolutions | **A** | the vote is a victory, and the Assembly has something to do between elections |
| **D-14** | Victory and defeat ([§13](design/M4_FLEETS.md#13-victory-and-defeat-d-14)) | A conquest, the vote, a score at a turn limit · B no turn limit | **A**, 250 turns by default | every game can end, within D-16's length |
| **D-68** | Rivals at war ([§14](design/M4_FLEETS.md#14-rivals-at-war-d-68)) | A by character · B strength alone · C no rival starts a war | **A** | wars the player can see coming and understand |
| **D-17** | Words from the other powers ([§15](design/M4_FLEETS.md#15-words-from-the-other-powers-d-17)) | A written into the game · B written at build time · C the player's own key | **A** | no key can live in a public site, and every line can be checked |

The art M4 needs is about 20 pictures, about $2 with candidates ([§19](design/M4_FLEETS.md#19-art-and-its-cost)),
within the $24.45 of D-27 left; ships and battles are drawn in code.

## Found while building M4

### D-69 · Who wins by the Assembly's vote — **Decided (owner's choice)**

In the headless games of increment 50 (M4_FLEETS.md §30, M2_BALANCE.md), six of eight games were won
by the Assembly's choice between turns 157 and 234, and **every one by the Frontier Co-op**. The
owner does not want one faction to win every time (22 October 2026), and asked to explore other
options; the owner chose to try D, C, F and G, and then H.

**Why.** The Co-op grows fastest (+20%), so it is always one of the two candidates, and no power
has a reason to dislike it: it never declares war, the human powers count it as kin, and no
faction's character holds anything against it. Every other faction has someone who does. And no
rival reacts to a power about to win, as a human player would.

**The trials** (each the eight seeds, five rival powers and no player, to turn 250; built in a
scratch copy, not in the game):

| Trial | Won by the vote | Won on score at turn 250 |
| --- | --- | --- |
| Today | Co-op 6 | Concord 2 |
| D: members fear a power that won its last election with more than half the votes (−2 a point over half, at most −30) | Co-op 5 | Concord 3 |
| C: members tire of a leader after two terms (−10 a term) | Co-op 4 | Concord 3, Co-op 1 |
| F: three votes a colony as well as one a million | Co-op 8 | — |
| G: a candidate sends envoys (a gift of 100) to the largest wavering member, and a power that wins with 55% is denounced (−15 from every member) if the Assembly agrees | Co-op 4 | Co-op 2, Concord 2 |
| D, C and G together | Co-op 3 | Concord 3, Co-op 2 |
| K: fear at the deciding vote itself: when the votes would choose a power outright, each member that is not its ally thinks 20 less of it, and votes for the other candidate if it likes that one | Co-op 3 | Concord 3, Co-op 2 |
| K and G | Co-op 2 | Co-op 3, Concord 3 |
| K and C | Co-op 2 | Concord 4, Co-op 2 |
| B (increment 50): only a power's friends vote it into victory | — | Concord 5, Co-op 3 |
| H: the Wake and the Concord refuse peace while they are the stronger, and the Concord falls on the weak too | Co-op 6 | Concord 2 |
| H, harder: from turn 80 they keep a warship for every colony, look for the weak among every power they know, and ignore the Assembly's calls for peace while winning | Co-op 8 | — |
| H, harder, with K and C | Co-op 3 | Co-op 4, Concord 1 |
| H, harder, with K, C and G | Co-op 2 | Co-op 5, Concord 1 |

**What they show.** Every brake turns the Co-op's wins by vote into wins on score, and only two
factions ever win. H as a rule does not make conquest happen: with it, wars came more often (up to
11 in a game) but no power surrendered or left the game in any trial. **The rivals cannot carry a
war to a distant enemy:** in seed 5 the Concord was at war with the Co-op for 60 turns, at up to
half again its strength, and never landed a trooper, because its strikes go only to enemy holdings
within 6 jumps of its own capital. Wars end by weariness or by the Assembly's calls for peace. More
war only helped the peaceful Co-op. A real H is an increment of its own: war plans that stage a
fleet forward to a holding near the enemy, transports that follow it, targets anywhere the lanes
reach, and a siege of the capital until it surrenders. The others have no road to victory: the **Transit Authority** leads in research
but holds few colonies, and research counts little in the score; the **Hollow Wake** is disliked by
every lawful power, so it can never have two thirds, and no rival ever finishes a conquest (no power
left the game or surrendered in any trial); the **Drift Moot** is small and joins the Assembly late.
With a player in the game there is a sixth contender, but the rivals should not leave it a race
between two of them.

**Options now:**

- **A. A brake alone (K, with C):** rivals fear a power about to rule the Assembly, as a human would,
  and tire of a long-serving leader. Fewer and later wins by the vote; still only the Co-op and the
  Concord win the games without a player.
- **B. A brake and a road for each faction (recommended):** K and C, and
  - **the Wake and the Concord see a conquest through** (H, built as war plans: a fleet staged
    forward, transports following, a siege of the capital), rather than making peace;
  - **the Moot buys votes:** envoys (G's half that is not the denouncing) for every power, the
    player too, and the Moot, rich and a broker, uses them most;
  - **the Authority's road is the keys** (M5's victory by the precursor mystery, D-14), and until
    then research counts for more in the score (10 a technology rather than 5).

  Measured as the others were, and built only if it shows at least four different winners in the
  eight games, none winning more than three.
- **C. Change the factions instead:** take the Co-op's growth down and give it a quarrel (the
  Wake's raids, say), so it is not loved by all. Simple, but it blunts the faction rather than
  giving the others a way to win.

**Answer (22 October 2026, the owner's choice):** *H as war plans, K, C, and a less-loved Co-op.*
The rivals get war plans that carry a war to a distant enemy, the Wake and the Concord see a war
through, the Assembly's members fear a power about to be chosen and tire of a long-serving leader,
and the Cooperative grows more slowly and has a quarrel. Built as increment 51
([M4_FLEETS.md §31](design/M4_FLEETS.md)), and shipped only if the headless games show at least four
different winners in the eight games, none winning more than three.

**As built (22 October 2026), and shipped short of its target.** The headless games now give three
different winners in eight: the Co-op five, the Concord two and the Wake one, all on score at turn
250; none is won by the Assembly's vote. The owner's standing leave of the same day ("continue with
development according to your best judgement ... make sure that any major impact on the game is well
documented and reversible") is read as leave to ship it short of the target, since it is nearer the
owner's aim than what it replaced (one winner in eight games) and every part of it has a switch.
Why it falls short, and the switch for each change, are in
[M4_FLEETS.md, *Increment 51*](design/M4_FLEETS.md#increment-51-many-roads-to-victory-22-october-2026):
the rivals' lane networks seldom meet, so the stronger cannot carry a war to the leader, and the
Co-op's economy leads. What is left is for M5 (the Authority's road through the keys) and M6
(balance from AI-against-AI games, and a rival's road to war: settling toward its prey). The owner
may still ask for any part to be undone.

## Round 8: the unknown, assumed 22 October 2026

With M4 built, M5 "The unknown" (SCOPE.md §7) is designed in
[design/M5_UNKNOWN.md](design/M5_UNKNOWN.md): the precursor mystery, relic sites, the keys,
guardians, leaders, espionage, events, the dying star and the next species. On 22 October 2026 the
owner gave standing leave:

> When done with your current work, continue with development according to your best judgement,
> without asking me anything. [...] Make sure that any major impact on the game is well documented
> and reversible, so I can maybe change directions later on.

So each question was still written with its options and a recommendation, and is **assumed as
recommended on that leave**: built that way, documented in the section named, and open to the
owner to overrule at any time. None needs money beyond the allowance already given (D-27).

| ID | Question | Options | Assumed | Why |
| --- | --- | --- | --- | --- |
| **D-13** | The vanished species and their artefacts ([§4](design/M5_UNKNOWN.md#4-the-absent-and-their-mystery-d-13)) | A the Absent, tied to Reborn's derelicts, tones and Pyre · B the heirs' makers · C no single story | **A** | Reborn's own threads (charts older than any, a bridge switched off carefully, a tone for a very long time, Pyre) become one quiet story, with the real white dwarfs as its places |
| **D-70** | Relic sites ([§5](design/M5_UNKNOWN.md#5-relic-sites-d-70)) | A excavated in chapters, paid in research · B investigated like anomalies · C fixed sites | **A** | a story in chapters with choices, and a road for the power that studies most (D-69) |
| **D-71** | The keys ([§6](design/M5_UNKNOWN.md#6-the-keys-and-the-answer-d-71)) | A all five, then the Answer · B keys add to the score · C three keys | **A** | a victory everyone can see coming and try to stop, as D-14 asked ("dangerous") |
| **D-72** | Guardians ([§7](design/M5_UNKNOWN.md#7-guardians-d-72)) | A fixed defences at the sites · B none | **A**, then **deferred to M6** after increment 53 | the keys cost a fleet as well as research, using M4's battles; deferred because every battle assumes each side is a power, and no rival yet gathers the keys |
| **D-73** | Leaders ([§8](design/M5_UNKNOWN.md#8-leaders-d-73)) | A five posts, traits and loyalty · B admirals and governors only | **A** | SCOPE §4.14 as written, each post a difference a player can read |
| **D-74** | Espionage ([§9](design/M5_UNKNOWN.md#9-light-espionage-d-74)) | A watching and guarding · B none in 1.0 | **A** | SCOPE §4.10's light espionage; knowing a rival's keys matters now |
| **D-75** | Events ([§10](design/M5_UNKNOWN.md#10-events-and-the-living-sky-d-75)) | A about fourteen more · B all forty now | **A** | the events that M5's rules need, the rest with M6 |
| **D-76** | The dying star ([§11](design/M5_UNKNOWN.md#11-the-dying-star-and-the-unhomed-d-76)) | A the arks and the star's death · B the star's death only | **A** | SCOPE's set piece and its species in one, changing the neighbourhood in mid-game |
| **D-77** | The species ([§12](design/M5_UNKNOWN.md#12-the-machine-heirs-and-the-species-after-them-d-77)) | A the machine heirs and the unhomed · B all four · C the unhomed only | **A** | the two that belong to M5's story; the under-ice thinkers and the chorus after |
| **D-78** | Pyre ([§13](design/M5_UNKNOWN.md#13-pyre-d-78)) | A off the map, in the story · B on the map, as in Reborn | **A** | the story's pull without a new kind of system to draw; B fits M6's wider maps |

**Left to the owner: D-18** (free or paid, open source or not, Steam or the web only). SCOPE makes
it part of M5's *done*, and money and platforms are the owner's; nothing in M5 waits on it.

### D-79 · The Co-op's lead in long games — **Assumed (owner's leave)**

D-69's target (at least four different winners in the eight headless games, none winning more than
three) is still not met: the Frontier Co-op wins six or seven, nearly always on score at turn 250. It
passes the others about turn 175 with half again as many colonies and twice the people of the next.
The powers that could check it cannot reach it: its home lies among the human powers, 35 light-years
from the Concord, the strongest in warships, and the Wake, nearer, is weaker. Increment 58
(M5_UNKNOWN.md §26) measured every lever that does not change the Co-op's character, and two that do.
Each line is the eight games to turn 250:

| Tried | Winners |
| --- | --- |
| As after increment 57 | the Co-op 6, the Concord 1, the Wake 1 |
| Every power wary of one that leads all by 15% (−10) or 30% (−20), the balance-of-power war at a 115% lead, pacts given notice to check the leader | the Co-op 6, the Concord 1, the Wake 1 (no game changed) |
| The same, stronger: −20 from a 5% lead, −40 from 20%, the war at 105% | the Co-op 7, the Wake 1 |
| The Co-op without its growth trait (*Settlers*) | the Co-op 6, the Concord 1, the Wake 1 |
| The Co-op at standard taxes, not low | the Co-op 7, the Concord 1 |
| The score counting people at half (increment 53), keys and chapters scored | no winner changed |
| As built in increment 58 (rivals scrap ships when broke; leaders first offered on turn 10) | the Co-op 6, the Authority 1, the Moot 1 (by the Assembly); the close games move with small changes |
| Increment 59: the Continuance, a sixth power from the start | the Co-op 7, the Wake 1 |
| Increment 60: the Forge a relic site the heirs dig; raids take nothing from an empty treasury, and a holding once a turn | the Co-op 4, the Continuance 2, the Wake 1, the Concord 1: **four different winners**, the Co-op one over the three |
| Increment 63: from turn 20 a rival that digs settles its site before more worlds | the Co-op 4, the Wake 1, the Concord 1, the Continuance 1, the Authority 1: **five different winners**, the Co-op still one over the three |

The wariness and the earlier balance of power were taken out again (they changed nothing, and would
have turned every power against a player who leads).

**Options:**

- **A. Leave the Co-op as it is, and give the conquerors the reach to check it in M6** (wider maps,
  longer campaigns, the guardians and the heirs on the map) — **recommended**: no lever on the Co-op
  alone moved the result, and it is the gentlest power to learn the game with.
- **B. End the game at the limit differently:** for instance, the Assembly chooses among the three
  highest scores, or each character has its own way to win (the most technologies, the most
  chapters, the most conquered).
- **C. Weaken the Co-op's character on several levers at once** (its growth, the Commons, how near it
  settles), measured until it wins at most three of eight.
- **D. Drop D-69's target:** one power that plays the long game best may win most long games.

**Assumed on 23 October 2026: A**, on the owner's renewed leave of that day (the same words as Round
8's). The Co-op is left as it is; the machine heirs (increment 59), whose home lies 23 light-years
from the Co-op's and nearer it than any other capital, are its first new neighbour. To overrule,
choose B, C or D and the next increment builds it.

## Round 9: 1.0, assumed 23 October 2026

With M5 built, M6 "1.0" (SCOPE.md §7) is designed in [design/M6_ONE.md](design/M6_ONE.md): lessons
for every system when it first matters, an alien power to play, the keys within the rivals' reach,
guardians, the balance targets for 1.0, accessibility, map sizes, music and sound, polish. On 23
October 2026 the owner renewed their standing leave:

> When done with your current work, continue with development according to your best judgement,
> without asking me anything. [...] Make sure that any major impact on the game is well documented
> and reversible, so I can maybe change directions later on.

So each question was written with its options and a recommendation, and is **assumed as recommended
on that leave**: built that way, documented in the section named, and open to the owner to overrule
at any time. None needs money beyond the allowance already given (D-27).

| ID | Question | Options | Assumed | Why |
| --- | --- | --- | --- | --- |
| **D-80** | Lessons when they matter ([§4](design/M6_ONE.md#4-lessons-when-they-matter-d-80)) | A lessons when they matter, kept in the codex · B a written manual only · C a second scripted tutorial | **A** | most of M3 to M5 meets a new player unexplained; a sentence from the right advisor at the right moment, as the guided opening does, readable again later |
| **D-81** | Playing an alien power ([§5](design/M6_ONE.md#5-playing-an-alien-power-d-81)) | A the Concord in M6, the others after 1.0 · B the Concord and the Moot · C none for 1.0 | **A** | D-08's aliens begin; the Concord builds on the ground, so it needs only its pictures (about $5.50); the Moot needs a new kind of colony scene |
| **D-82** | The keys within everyone's reach ([§6](design/M6_ONE.md#6-the-keys-within-everyones-reach-d-82)) | A the hunt, then keys in exchanges, measured; three keys only if both fail · B three keys now · C the player's road only | **A** | the smallest changes that make the keys a race, each with a switch |
| **D-83** | The balance targets for 1.0 ([§8](design/M6_ONE.md#8-the-long-game-balanced-d-83)) | A four winners and one by the keys, no deep or long debt, M4's limit target dropped · B M4's target kept too · C none | **A** | D-69's and M5's targets carried on; most games now end at the limit by the owner's choice in D-69 |
| **D-84** | Accessibility ([§9](design/M6_ONE.md#9-accessibility-d-84)) | A WCAG 2.2 AA where it applies, checked in CI, with a list for the map · B labels and contrast only · C none before 1.0 | **A** | checked by a tool on every screen, so it stays true as the game grows |
| **D-85** | Map sizes ([§10](design/M6_ONE.md#10-map-sizes-d-85)) | A one map for 1.0 · B add the 27 ly heartland · C add 40 ly if it measures within budget | **A** | the 33 ly map is already larger than MoO3's largest; a smaller map would hold no alien, a larger one would double the turn; a shorter game is the turn limit's job. **This takes "the wider map sizes" out of M6's scope in SCOPE.md**; B or C can come after 1.0 |
| **D-86** | Music and sound ([§11](design/M6_ONE.md#11-music-and-sound-d-86)) | A four pieces (the Concord's colonies, war, victory, defeat) and sounds that tell · B the sounds only · C none | **A** | about $1, by D-31's way (Lyria), chosen on the owner's leave and sent lettered to overrule |

D-72 (guardians) stays A and is built in M6; D-79 stays A. **Left to the owner: D-18**, and whether
the result is 1.0.

## Made without waiting

Small engineering choices, easy to reverse. Overrule any of them.

| Date | Choice | Why |
| --- | --- | --- |
| 2026-10-22 | **Guardians deferred to M6** (D-72): every battle assumes each side is a power, and no rival yet gathers the keys they would guard; increment 54 is the events instead | a large change for little now; M5_UNKNOWN.md §7 |
| 2026-10-22 | Increment 54 as M5_UNKNOWN.md §22 (D-75): thirteen events, twenty-five in all; a chapter studied gives half again its cost in research (150, 300, 450); **M2b's target for the research-led power lowered to 33 technologies at turn 100** in the headless test (from 35), as the Authority now gives half its research to its excavations | each event and number has its place, listed under *Increment 54* |
| 2026-10-22 | Increment 54's pictures (M5_UNKNOWN.md §22): 26 candidates, about **$1.30**, so about **$29.55** of the owner's $50 spent in all; chosen dust A, digging next door A, the key A, the second tone A, the charts B, the great flare A, the new star B, the meteor storm B, the audit A, the shareholders A, the feud B, the long night A, the great storm B | within D-27; the lettered sheets went to the owner to overrule |
| 2026-10-22 | Increment 55 as M5_UNKNOWN.md §23 (D-74): watching for 5 credits a turn, 10 a turn gained, guard home 0 to 2 steps; marks at 25, 50 and 75; **the rivals watch from turn 100 and only with 60 credits and income to spare**, guarding only while healthy, since earlier watching cost the Wake its treaty with the Authority and the Authority a run of debt | each number in `RULES.espionage`, listed under *Increment 55* |
| 2026-10-22 | Increment 56 as M5_UNKNOWN.md §24 (D-73): five callings (commander, steward, scholar, ambassador, spymaster), twelve traits and two flaws, three people offered every 10 turns, fees of 40 and 20 a level, wages of 2 and 1 a level; *steward* rather than *governor*, which already names a colony's automatic management; **the rivals hire from turn 70 with the fee and 20 more**, since hiring earlier with 60 more cost the Wake the treaty M3's target asks of it | each number in `RULES.leaders`, listed under *Increment 56* |
| 2026-10-22 | Increment 56's faces (M5_UNKNOWN.md §24.7): 40 candidates, about **$2.00**, so about **$31.55** of the owner's $50 spent in all; four faces for each people, chosen A but for the Authority's second, the Co-op's third and the Moot's first (B) | within D-27; the lettered sheets went to the owner to overrule |
| 2026-10-22 | Increment 57 as M5_UNKNOWN.md §25 (D-76, D-77 in part): the Unhomed of Arcturus (fiction; the star is real) arrive at CE Boötis between turns 110 and 150 and ask for a world; give, take in or refuse; Arcturus dies 12 turns later (+40 research for all); the **Last Hearth** joins as a rival in mid-game; its names, looks, colour (coral, a cross) and character as §25.1 and §25.5; it comes knowing what **more than half** of the powers know; the rivals answer 2 to 6 turns after the arks come | each number in `RULES.unhomed`, listed under *Increment 57* |
| 2026-10-22 | Increment 57's pictures (M5_UNKNOWN.md §25.7): 20 candidates, about **$1.00**, so about **$32.55** of the owner's $50 spent in all; the arks' picture cropped of a thin black band rather than rolled a third time | within D-27; the lettered sheets went to the owner to overrule |
| 2026-10-23 | Increment 58 as M5_UNKNOWN.md §26, cut down by what was measured: **a scrap order** for any ship (the player's and the rivals'), and **rivals in debt and still losing scrap a ship a turn** (a warship beyond their wants in peace, else an idle civil ship); the deepest debt in the headless games fell from −518 to −156. The wariness of a leader, the balance of power at 115% and pacts given notice were built, measured, and taken out; D-79 raised for the owner | `RULES` unchanged; the order in `orders.ts`, the rivals' rule in `ai.ts` under *Cutting costs* |
| 2026-10-23 | Increment 59 as M5_UNKNOWN.md §27 (D-77): **the Continuance**, the machine heirs, starts every game with rivals as a sixth power (not yet playable); a machine species eats nothing and puts half its industry into copies of itself while it has room (a tenth of a million for every 5); its excavations go half again as fast, and it starts with Relic studies and the two nearest sites; **the Forge**, a fictional world at the real white dwarf GJ 3306, is in every game; relic sites and keys stay placed from the five older capitals, but no anomaly lies at GJ 3306 now. The long games: two winners, not three (D-79) | each has its place, listed under *Increment 59* in M5_UNKNOWN.md; take `continuance` out of `FACTION_IDS` to play without them |
| 2026-10-23 | Increment 59's pictures (M5_UNKNOWN.md §27.5): 13 candidates, about **$0.65**, so about **$33.20** of the owner's $50 spent in all; the provider refused three, and the fourth leader's wording was softened once; chosen the envoy A, the speaker A (its only one), the heirs at work B, the leaders B, A, A and B | within D-27; the lettered sheets went to the owner to overrule |
| 2026-10-23 | Increment 60, the proof, as M5_UNKNOWN.md §28: **the Forge is a relic site of its own** (a vault, besides the twelve, holding no key), since the heirs, made to dig, could reach no site before turn 90 and dug none; **raids mended**: a holding is plundered once a turn however many fleets raid it, and no credits are taken from an empty treasury (the deepest debt fell from −337 to −131). The long games: four different winners. **Missed, for M6:** no game won by the keys, the Co-op one win over three, and not every site found by turn 150 | `KEPT_SITES` in `src/sim/relics.ts` (empty it to remove the Forge's site); the raid rule in `resolveRaids` (`src/sim/raids.ts`) |
| 2026-10-23 | Increment 61 as M6_ONE.md §20 (D-80): sixteen lessons, each **told once on this device** rather than once a game (§4 had said once a game; a player would have been told the Assembly again in every game), kept in the codex's *How to play* with *Tell me again*; off with the guide | `LESSONS` in `src/content/lessons.ts`; the card in `src/ui/map/guide.tsx` |
| 2026-10-23 | Increment 62 as M6_ONE.md §21 (D-84): **`@axe-core/playwright` 4.13.0 added as a development dependency** for the accessibility checker in the journeys (it never reaches the game); Enter presses a control reached by keyboard instead of ending the turn; every dialog takes focus and gives it back; a sheet's scrolling body takes focus; the systems list (**K**) | the journey `a11y.spec.ts`; `DialogFocus` in `src/ui/focus.tsx`; the list in `src/ui/map/systems.tsx` |
| 2026-10-23 | Increment 63 as M6_ONE.md §22 (D-82), measured: **no small change lets a rival win by the keys** (never more than four keys found, never more than two in one hand; gathering five as they are placed means taking four from four powers), so that target is recorded as missed and the keys stay the player's road; **kept: from turn 20 a rival that digs sends an outpost to a site it can reach before a colony ship**, which gives the long games five different winners (the Co-op 4) and the shortest debts yet (−62, 21 turns) | `RULES.keys.outpostFrom` (`null` turns it off); `RULES.keys.hunt` and `RULES.keys.study` left as switches |
| 2026-10-22 | Increment 53 as M5_UNKNOWN.md §21 (D-71), with what the building found: the Answer **begun by order** for 10 turns rather than built; **each key at the site nearest one of the five capitals** (spread to the edges, two were found in eight games); chapters 100, 200 and 300; Relic studies shows sites within 10 light-years, Old charts 20; **a road for the rivals** to a site they cannot reach; a power with three keys goes to war for the rest; the score's `peoplePer`, `key` and `chapter` switches, left neutral; state version 27. **No game won by the keys, and D-69's target still not met:** the Co-op won seven of eight | each has a switch, listed under *Increment 53* in M5_UNKNOWN.md; the rivals' long campaigns and the Co-op's lead are left for M6 |
| 2026-10-22 | **Fear at the deciding vote mended** (increment 51's rule): it now applies once a power's votes as they lean are 60% of all, not only past two thirds, since the roll grows before the count (a vote of 87 in 131 became 88 in 132 and won the game on turn 70) | a bug in the rule as built; `RULES.assembly.fearFromPercent` |
| 2026-10-22 | Increment 53's picture (M5_UNKNOWN.md §21.7): 2 candidates, about **$0.10**, so about **$28.25** of the owner's $50 spent in all; chosen the end by the keys A | within D-27; the lettered sheet went to the owner to overrule |
| 2026-10-22 | Increment 52 as M5_UNKNOWN.md §20 (D-70), with what the building found: **the sites within 18 light-years of the nearest capital** (and at least 8 from every one), since farther they lay beyond any lane; GJ 915 a site only when its generated worlds give it one to hold; the rivals learn Relic studies as soon as they know a site, send outposts to sites first and lay a lane straight to one they cannot reach; state version 26 | the smallest changes that let the rivals reach the sites at all; each has a switch, listed under *Increment 52* in M5_UNKNOWN.md |
| 2026-10-22 | **Two rules against debt** (found in the 250-turn games: the Authority's treasury fell to about −1,000 by turn 200 in three games of four): a governor, the player's too, starts no project with upkeep while the treasury is in debt or falling; a rival in debt runs its colonies, all but its capital, for trade until its treasury is back to 60 | the deepest debt is now −337; one long debt (126 turns, a power losing a war) is left for M6 |
| 2026-10-22 | Increment 52's pictures (M5_UNKNOWN.md §20.9): 12 candidates, about **$0.60**, so about **$28.15** of the owner's $50 spent in all; chosen the vault B, the dust A, the array A (B had a black bar), the hollow moon A, the hall of charts A, the quiet beacon B | within D-27; the lettered sheets went to the owner to overrule |
| 2026-10-22 | Increment 51 as M4_FLEETS.md §31 (D-69), with what the building found: *you are weak* only for a power the rival's fleets can reach; a lane queued toward prey it cannot reach; the outlaw Wake breaks a non-aggression pact for easy prey, the lawful Concord does not; a fifth reason for war, the balance of power (the Authority, the Wake and the Concord against a power that leads all in score with 130% of their own, which they can match and reach); the peaceful arm half as much at war; a subdued power's lanes open to its victor; **works in the score** (a point for every 100 research and 200 industry made in the game); state version 25. **Shipped short of its target** (three different winners, not four; none by the vote) | nearer the owner's aim than one winner in eight; each change has a switch, listed in M4_FLEETS.md under *Increment 51*; overrule any |
| 2026-10-22 | Increment 50 as M4_FLEETS.md §30 (D-14): conquest, then the Assembly's choice, then the limit, checked as each turn ends; a tie in score goes to the earlier power in the order; played alone, the game simply ends at the limit; a power with no colony leaves the game, and no one hears from it again; *Play on* after a victory or a surrender, not once our power has left; a save from before gets the 250-turn limit, or none if past turn 250; **the rule that a rival votes a power into victory only if friendly with it, dropped** (with it no game was won before the limit) | the smallest reading of §13 that lets most games end before the limit; each has a unit test; overrule any |
| 2026-10-22 | Increment 50's pictures (M4_FLEETS.md §30.5): 4 candidates, about **$0.20**, so about **$27.55** of the owner's $50 spent in all; chosen victory A and defeat A (defeat B had black bars) | lettered sheet sent; overrule either letter |
| 2026-10-22 | Late turns made faster without changing any result: a power's routes searched once from each system while its lanes and passage stay the same, and a rival's lane chosen at the first it may build | a turn near turn 200 went from about 300 ms to about 130 ms; the same game to the byte after 150 turns |
| 2026-10-22 | Increment 49 as M4_FLEETS.md §29 (D-67): the Assembly (fiction) forms when three powers can each talk with the other two; a vote for every million people, at least one; an election every 20 turns, the first 20 after it forms, between the two members with the most votes; a rival votes for the candidate it regards better if at least warm (10), never one it is at war with; two thirds of all the votes choose a leader (a victory from increment 50); one resolution at a time, one from each member every 10 turns; sanctions end trade and exchanges with the sanctioned, lifted when it is at war with no member; a call for peace gives 5 turns, then sanctions on each that has not offered peace without terms; the Wake does not heed a call; **each member's votes kept as a public roll** (the screens know only what the player sees); **G** for the Assembly on a desktop (*A* pans the map) | the smallest reading of §12 that gives the Assembly something to do between elections; each has a unit test; overrule any number or word |
| 2026-10-22 | Increment 49's pictures (M4_FLEETS.md §29.5): 4 candidates, about **$0.20**, so about **$27.35** of the owner's $50 spent in all; chosen the Assembly's chamber B (its Duskfolk delegate as the brief has them) and the report's vote B | lettered sheet sent; overrule either letter |
| 2026-10-22 | Increment 48 as M4_FLEETS.md §28 (D-64, D-68): the rivals look for a war every 5 turns with 3 warships, at most one at a time; the Authority answers a raid within 10 turns or a power it holds hostile (−40); the Wake a neighbour (a colony within 12 light-years: the design said 4 jumps) it is **not warm** to (the design said cold: it never was) when half again as strong, **from turn 80** (earlier, it went to war before any treaty); the Concord a power that settled in its claim twice; **30 turns after a peace before war on the same power again**; a rival with a grievance arms to be half again as strong; strikes of 4 warships within 6 jumps, with transports for the garrison and 2 more; peace by character (wait 5, 0, 5, 15, 0 turns; offer after 10, 5, 10, 20, 5; the Wake asks 50 credits, the Moot gives 30); a surrender's tribute a fifth of the taxes; **a buyer of the Wake's protection no longer counts its raids against it** (else it sold nothing) | the smallest reading of §12 and D-68 that keeps M3's treaties by turn 100; each has a unit test; overrule any number |
| 2026-10-22 | Increment 47 as M4_FLEETS.md §27 (D-66): a raid is a fleet's mission for a power that is not lawful; refused against a power at war (invade instead), one that buys its protection, one it has a pact, an alliance or a truce with; plunder a colony's credits of the turn or an outpost's yields; remembered −10 (renewed), heard −5 by the lawful; **an outlaw's armed fleets may sail the lanes of any power they may raid** (not in the design: without it no raid ever reached anyone); the Wake keeps two warships from turn 30 and four colonies, raids every 10 turns for 5, within 4 jumps | the smallest reading of §11 that makes protection worth buying; each has a unit test; overrule any number |
| 2026-10-22 | Increment 46 as M4_FLEETS.md §26 (D-65): a garrison of 2, one a million people, 5 at the capital, 10 with barracks; a transport of 5 troops for 30 industry and 5 metals (the design said 5 fuel too: a ship's cost has no fuel) and a tenth of a million people; the garrison wins each exchange 55 in 100; a colony taken unhappy for 10 turns at −20; a battery of three of its power's best weapon, structure 60, the planetary shield's 30; bombardment a twentieth of the people and a building one turn in three, remembered −15, heard −5 (−10 by the lawful) and renewed rather than piled up; a blockade halves credits and cuts supply; three Weapons technologies; the radio lines, fiction | the smallest reading of §10 that makes a garrison, a landing and a siege each matter; each has a unit test; overrule any number or line |
| 2026-10-22 | Increment 46's pictures (M4_FLEETS.md §26.10): 26 candidates, about **$1.30**, so about **$27.15** of the owner's $50 spent in all; chosen the defence battery A, A and B (the Wake's sandbagged guns), the planetary shield A, A, A, the barracks A, A and B (the grounded troop ship), and the report's battle A (B had black bars), invasion A, war A and peace A | lettered sheets sent; overrule any letter |
| 2026-10-22 | Turns made faster without changing any result: distances, species adapted by research and lanes' lengths worked out once (increment 42's CI ran a turn at 207 ms of the 200 ms budget) | the budget is M1's; about 48 ms a turn now at turn 100 |
| 2026-10-22 | Increment 45 as M4_FLEETS.md §25 (D-63): an opening of 1.5 s, 3.5 s a round (a move of 0.8 s, then the shots over 1.9 s, each landing in its round: the design said 2.4 s, which let the slowest land after the round), a closing of 1.5 s; shots fly 0.3 s (kinetic) to 0.75 s (plasma); each power's look: the Kite in the Authority's green, the Hauler, the raider, and our own Duskfolk crescent and Drifter pods (fiction); a ship's length 15 (corvette) to 46 (capital) in the replay; on an upright screen the camera looks down more steeply, so the two sides stack up the screen; the replay's code within 60 KB | the smallest reading of §8 that reads on a phone; the timeline has unit tests and the screen a journey on three sizes; overrule any number or look |
| 2026-10-22 | Increment 44 as M4_FLEETS.md §24 (D-62): 8 rounds; 100%, 60% and 30% of a weapon's damage at, a step from and two steps from its best range; 70 in 100 to hit, +15 with a targeting computer, −15 against an evading task force, −10 to +10 by size; an evading task force leaves after round 2; **shields recover a fifth a round** (a third in the design: at a third, battles of a few frigates ended with no losses); repairs of half at a shipyard and a tenth at a colony or with a repair bay; Field repairs at tier 2 | the smallest reading of §7 that makes stance, range, shields and retreat each matter; each has a unit test; overrule any number |
| 2026-10-22 | Increment 43 as M4_FLEETS.md §23 (D-64): war −30 to the attacked, −5 heard (−10 by the lawful), −20 while it lasts; a truce of 10 turns; a rival makes peace after 5 turns of war and offers it every 5 once a war has lasted 10; weariness 1 a turn (2 for the Cooperative and the Moot), resting 2, −1 approval for every 5, at most −15; what each power asks for non-aggression (0, −10, 10, 10, −20) and an alliance (40, 30, never, 50, 30); **a non-aggression pact counts nothing in regard** (the design said +5 as every treaty) | at +5 the Cooperative passed 25 technologies by turn 100 on three seeds; each has a unit test; overrule any number |
| 2026-10-22 | Increment 42 as M4_FLEETS.md §22 (D-61): every warship in a fleet, survey ships never; a warship built joins the fleet waiting at its yard or forms one; the powers' words for fleets, fiction: squadrons, flotillas, packs, circles and drifts; a fleet first stands to *defend*, fires at *warships* first and retreats at *half* lost; the Empire's tab stays *Ships* (the design said *Fleets and ships*) so the phone's tabs keep their width | the smallest reading of §6 and D-07's orders for each task force; each has a unit test; overrule any word or default |
| 2026-10-22 | Increment 41 as M4_FLEETS.md §21 (D-59, D-60): five hulls of 2 to 8 places with structure 12 to 100 and upkeep 1 to 5; 22 modules (Reborn's four damage types and three shields, three armours, a targeting computer and a jump drive); the yard's rule of half the places weapons (the two strongest kinds alternating, ion at half), a shield, then armour; designs never changed once made, retired instead; a refit at the new modules less the old, at least a tenth; 17 Weapons technologies, which the rivals leave to last while they hold no warships; *Designs* on **B** (the design said a fleets panel on F, which is the flat/3D key) | the smallest reading of §4 and §5 that a phone can show; each has a unit test; overrule any number |
| 2026-10-22 | Increment 41's pictures (M4_FLEETS.md §21.6): 6 candidates of the three Admirals' faces, about **$0.30**, so about **$25.85** of the owner's $50 spent in all; chosen the Authority's A, the Cooperative's B (the padded vest shows), the Wake's B (the bandolier of tools); the Admirals' names Helena Vasquez, Joon-ho Park and Gaff, and for the aliens Stone Shield and Deep Keel, all fiction | lettered sheet sent; overrule any letter or name |
| 2026-10-22 | Increment 40's tuning (M3_NEIGHBOURS.md §26): the Cooperative asks a regard of 20 for shared research (10 before); the neighbours' targets set as every alien in contact with a human power by turn 120, every human power with a treaty by turn 100 and the Moot by turn 150, the Concord's treaties reported rather than required | with five powers the Cooperative passed 25 technologies on three seeds; now every power is within M2b's targets on all eight. The aliens first talk with anyone between turns 86 and 135, so a treaty by turn 100 could not be asked of them; the Concord, slow to trust, agrees one in 3 of 8 games by turn 180, which suits §5 but may be too slow: say if it should warm faster |
| 2026-10-22 | Increment 39's names (M3_NEIGHBOURS.md §25.1), all fiction: the species **the Drifters** (D-12's cloud drifters), their power **the Drift Moot** (violet, a hexagon), its Envoy Fair Wind and eldest Deep Current, its advisors Wide Shelter, Slow Hands, Full Hold, Long Memory, Far Drift and Still Air | plain words, as for the Duskfolk; overrule any name |
| 2026-10-22 | Increment 39's home and character (§25.2 to §25.7): HD 192310 c, a real Neptune-mass planet of an orange dwarf in the shell at 28.7 ly, with 5 systems of its own lanes (AU Microscopii among them); giants only (gas giants, ice giants and mini-Neptunes; the cloud tops' temperature matters little); memories that fade every 6 turns; asks of −10 for trade and protection, 0 for open lanes; −10 for the Wake's ways; as a rival it produces, settles the roomiest giant, builds lanes, and as a **broker** offers 20 of a resource it holds more than 150 of for 40 credits; the trait Long-lived (growth −20%) | §5's *few in number, live only on gas giants, masters of fusion-fuel trade, natural brokers*; the only gas giants in the shell (GJ 849, GJ 3512, GJ 680) reach 1 or 2 systems, so a Neptune-class giant was taken; each has a unit test; overrule any number |
| 2026-10-22 | Increment 39's pictures (§25.9): 6 candidates, about **$0.30**, so about **$25.55** of the owner's $50 spent in all; chosen Fair Wind A (its row of eyes reads as a face when small), Deep Current B (pale and faded with age, unlike the Envoy), the Drifters at home A (several among cloud walls, their tethered pods between) | lettered sheet sent; overrule any letter |
| 2026-10-22 | Increment 38's names (M3_NEIGHBOURS.md §24.1), all fiction: the species **the Duskfolk** (D-12's twilight folk), their power **the Dusk Concord** (amber, a diamond), its Envoy First Voice and speaker Still Water, its advisors Warm Stone, Long Hands, Full Store, Quiet Eye, Far Walker and Night Ear; names given as translations | plain words that say what they are (they live in the dusk of a locked world, and govern by consensus), like no other work's; overrule any name, it is one line of data |
| 2026-10-22 | Increment 38's home and start (§24.2, §24.4): GJ 433 d, a real super-Earth of a red dwarf in the shell at 29.6 ly, with five systems within 5 ly; a capital with no old lane grows its home web by D-19a's rule over lanes of its own (up to 6 ly, between systems with no old lane), keeping what it reaches, so the Concord starts with 6 systems and 5 lanes and no human web changes | D-01, D-02 and §4 put the aliens in the shell, which has no old lanes; colony ships cannot jump blind, so a power with no lanes could not move. GJ 357 d and Wolf 1069 b reach only 3 and 1 systems; trimming every web to the Concord's 6 would change every human start |
| 2026-10-22 | Increment 38's species and character (§24.3, §24.6, §24.7): the Duskfolk's costs (a world that is not tidally locked costs 2, flares nothing, cold and warm nothing), memories that fade every 8 turns, gifts at 1 for every 8 credits, asks of 20 for open lanes and 30 for shared research, −5 for the Wake's ways; as a rival it grows, settles the nearest world, builds lanes, and has the Patient trait (growth +10%); not playable in M3, so a new game offers the three human powers and the Concord plays in every game with rivals | the smallest reading of §5's *natural expanders, patient and communal, slow to trust, slow to forget*; each has a unit test; overrule any number |
| 2026-10-22 | Increment 38's pictures cut to 3 (§24.10): First Voice's and Still Water's faces and the Duskfolk at home; their buildings (about $2.40) and two twilight landscapes (about $0.20) wait until the Concord can be played | no screen shows a rival's colonies, so their buildings would not be seen in M3; a twilight landscape needs the colony view to paint a sun fixed low, which only matters once their colonies are seen |
| 2026-10-22 | Increment 38's pictures (M3_NEIGHBOURS.md §24.10): 10 candidates, about **$0.50**, so about **$25.25** of the owner's $50 spent in all; chosen the people at home A (crested, four-legged, the red sun fixed on the horizon between the day's desert and the night's ice), then the faces re-rolled to match it (the first two of each looked like grey-skinned humans): First Voice D, Still Water C (the worn, mottled crest of great age) | lettered sheet sent; overrule any letter |
| 2026-10-22 | Increment 37b as M3_NEIGHBOURS.md §23 (D-56 A): exchanges of credits, metals, volatiles or fusion fuel in steps of 10 up to 100, valued 1 a credit and 2 a unit (twice for what a rival holds less than 20 of), accepted at 80% friendly, 100% warm or neutral, 130% cold, never hostile; the player's acceptance changes hands at once; passage one way for a toll of 1 a lane (2 to 8) and protection for 5 a turn, both paid from the turn after, lapsing unremembered when unpaid; the Wake remembers a gift at 1 for every 3 credits; a lawful power counts −5 for each power it knows that buys from an outlaw; *Buy it* for the buyer and *Sell it* for the seller on the diplomacy screen | the smallest reading of §11 and D-56; each has a unit test; overrule any number |
| 2026-10-22 | Increment 37b's rivals: a seller deals only with a buyer that has 75 credits in hand (50 in §23.6); a buyer gives notice on what it pays for when its treasury is under 40 and falling, and on any treaty when its regard falls below 0 or 10 below what it asked, whichever is lower; a rival short of a resource (under 20) with over 100 credits offers 40 credits for 20 of it every 5 turns, to the power that regards it best (neutral or better) | at 50 to buy and no notice when short, the Cooperative ran 3 turns in debt paying the Wake and bought again as soon as it recovered; at 100 to buy the rivals seldom bought at all. At 75 and 40 the Authority buys passage in all eight headless games and the Cooperative in six, with one turn of debt once. The Cooperative reaches 26 technologies by turn 100 on seeds 3 and 4 (the target is 15 to 25; the average is 23.3); left so, as in increment 36 |
| 2026-10-22 | Increment 37 as M3_NEIGHBOURS.md §22 (D-54 A): a colony claims its system and every system one lane away along any lane, old or new, an outpost only its own; a system held by one power is its own, by several contested; a border treaty gives each contested system between two to the one whose nearest colony is nearer, and keeps each out of the other's claim; settling in a claim remembered at −3; trade at 1 credit for every 4 colonies of the smaller side (at least 1) and 1 for each open lane joining them, at most 10, paid before upkeep; the powers ask 10 for a border (the Wake 20) and 10 for trade (the Cooperative 0, the Wake 15); the exchanges and the Wake's dealings left for increment 37b | the smallest reading of §9 and §10; each has a unit test; overrule any number |
| 2026-10-22 | Increment 36 as M3_NEIGHBOURS.md §21 (D-53 A): open lanes and shared research; offers answered by a rival as the turn ends and by the player in the next turn; an offer from a power not heard is a signal of its own; a treaty needs each power in contact with the other (before talk an offer may be misread); notice of 5 turns (−5 remembered), breaking at once (−20, and −5 for every power in contact with the breaker); each treaty in force +5 to each side's regard; the levels the powers ask, tuned with the headless games: the Authority 10 for open lanes and 40 for shared research, the Cooperative 10 and 10, the Wake never open lanes and **10** for shared research (25 in the design), and rivals send gifts above **150** credits (200 in the design), so that every power agrees a treaty within 100 turns while the Authority and the Wake keep apart; a rival offers every 5 turns and gives notice when its regard falls below 0; the Cooperative then knows 26 technologies at turn 100 on one seed of eight, one over M2b's 25, as its treaty with the Authority helps both, and that is left so | the smallest reading of §8 that the rivals play by; each has a unit test; overrule any level |
| 2026-10-22 | Increment 35 as M3_NEIGHBOURS.md §20 (D-55 A): attitude the sum of kin (+10), how long known (+1 for each 10 turns, at most +10), character and three memories (a gift at 1 for every 5 credits, a great work lost −15, settled beside −5), each fading a point every 4 turns; the characters as fiction: the Authority holds the Wake for outlaws (−15), the Cooperative distrusts its ways (−5), the Wake sees in the Authority the law it runs from (−10); five words from hostile to friendly; gifts of 20, 50 or 100 credits, paid when given and delivered as the turn ends; the screen shows how each power regards you, not how you regard them; on a phone it opens from the menu and the Powers tab, not the dock, which keeps its four buttons; the rivals send no gifts until they deal in increment 36 | the smallest reading of §7 with something the player can do; each has a unit test; overrule any number or character |
| 2026-10-22 | Increment 34's pictures (M3_NEIGHBOURS.md §19.6): 6 candidates of the three Envoys' faces, about **$0.30**, so about **$24.75** of the owner's $50 spent in all; chosen the Authority's A (the sash of office shows), the Cooperative's B (the shawl over one shoulder) and the Wake's A | within D-27; the lettered sheet went to the owner to overrule |
| 2026-10-22 | Increment 34 as M3_NEIGHBOURS.md §19 (D-52 A): a signal from a colony, outpost or lane where the power has surveyed, a ship where it watches, or a great work; words grow 1 a turn in sight and 1 more with Translation, talk at 20; contact never lost and one-sided; a ship seen now counts for spreading knowledge, where M2b counted colonies, outposts and lanes; a save from before is in contact as M2b's *met*; the contact shown under each power's name in the standings rather than in a column of its own, so the phone's table keeps its width; rivals research Translation only while they learn a tongue; the Cooperative's Envoy named Rafael Quispe (Kofi Mensah in the design), as its Survey advisor is Ghanaian already | the smallest reading of §6 that every power follows; each has a unit test |
| 2026-10-22 | Increment 33 as M3_NEIGHBOURS.md §18 (D-51 A): the archives asked from this container rather than GitHub's runners, as they answer here now; the shell kept in a file of its own (`shell.json`), the census's `sky.json` and its lanes unchanged so saved games keep their worlds; Mu Herculis left out, as its Mu¹ Herculis belongs with the census's Mu² Herculis; no flare stars marked in the shell (the census keeps Reborn's ten); a Gaia identifier read without its words in the copy, and Infinity read as no value | the smallest reading of §4 that keeps every saved game as it was; each has a test |
| 2026-10-21 | Increment 32 as M2B_SCIENCE.md §20 (D-49, D-50 as recommended): Great engineering at tier 5 needing Prefabrication; great works at a colony, one building each per power at a time, upkeep 3; the loser that was building it first keeps half its industry; a colony holding a great work is seen by every power; rivals build theirs at the capital; a rival's score counts its technologies once met and its great works always; each technology now costs 8% more for every one known (7% before) to meet §2's targets on every seed | the smallest reading of §9 and §10 that makes the race real; each has a unit test |
| 2026-10-21 | Increment 32's pictures (M2B_SCIENCE.md §20.2): 8 candidates, about **$0.40**, so about **$24.45** of the owner's $35 spent in all; chosen the Long Array A (B had a row of dishes floating free), the Lapse Archive A, the Lanewright Foundry A and the Commons A | within D-27; the lettered sheet went to the owner to overrule |
| 2026-10-21 | The phone's diorama budget raised from 2 MB to **2.25 MB** (M2B_SCIENCE.md, increment 32 as built): a colony holding all four great works and every other project loads 2.04 MB of pictures, as the great works are the widest buildings and load at 1024 px; the still a phone loads first stays at 761 KB of its 1 MB | only one colony in a game could ever hold all four; making their pictures lighter would blur the buildings the race is for |
| 2026-10-21 | Increment 31 as M2B_SCIENCE.md §19 (D-47 B, D-48 all three): each pair of doctrines needs the same technology (Regional administration, Lane engineering II, Automation II); a doctrine finished first closes its pair, which leaves the queue and loses its progress; doctrines' inspirations as §19.1; a power is *met* when it sees a colony, outpost or lane of the other's in a system it has surveyed; the standings' science calls a rival ahead or behind at three technologies' difference; a `?test` hook sets up a game some way on | the smallest reading of §7 and §8; each has a unit test |
| 2026-10-21 | Increment 30's pictures (M2B_SCIENCE.md §18.7): 18 candidates, about **$0.90**, so about **$24.05** of the owner's $35 spent in all; chosen the lane relays A, A, A (the Authority's, the Cooperative's, the Wake's), the orbital habitats A, A, B and the terraforming stations A, A, A | within D-27; the lettered sheet went to the owner to overrule |
| 2026-10-21 | Increment 30 tuned against §2's targets with the headless games: each technology costs 7% more of its base for every one known (not §6's 3%), tiers 4 and 5 cost 240 and 480 before the rise (not 160 and 250), the scholars stay at 1 for every 4 million; the Authority's colonies run for research (the research-led power) rather than balance; rivals weigh research by base price with what it needs, their own fields at half, instead of every technology of their own fields first | at 3% and 160/250 every power reached 27 to 37 technologies by turn 100 and the Authority finished the tree by turn 150; with these, about 37, 23 and 22 at turn 100 (§2: 35–45, 15–25), the tree lasting to about turn 170–195 before increments 31 and 32 add four more |
| 2026-10-21 | Increment 30 as M2B_SCIENCE.md §18: the 21 technologies of §18.2 (seven of them completing the tiers as §6 left to the design: Lane weaving, Mass drivers, Cryosleep, Free press, Federation, Thinking machines, Deep-sky survey); an orbital habitat makes its outpost a colony in orbit that keeps its riches; a terraforming station's turns are kept on its colony; outposts build lane relays and orbital habitats; Lapse studies is opened by three anomalies investigated and inspired by five; the phone's research screen is a tab for each field and the desktop's has the queue beside the tree and arrow keys | the smallest reading of §6 and §11 that changes play; each has a unit test; overrule any technology's effect |
| 2026-10-21 | Increment 29 as M2B_SCIENCE.md §17 (D-45 as recommended): a deed for each of M2's 33 technologies, as §17.1's table, in the species' own words; an inspiration is checked as the turn ends and pays into progress, finishing a technology at once when its needs are known; several observations in one system each pay (Alpha Centauri 45); a subdwarf of type T counts as a brown dwarf (45 systems, not 44), and Sol's eight planets as observed planets (47 systems, not 46); an old save's deeds already done pay on its next turn | the smallest reading of §5 that every power earns alike; each has a unit test |
| 2026-10-21 | Increment 28 as M2B_SCIENCE.md §16 (D-44 as recommended): scholars kept at approval as districts' yields are; a colony in revolt makes no research, the capital's own 3 included (M2 still counted them); a governor's lab is due when the colony would have fewer labs than one for every five districts, counting the one it zones, and only where its people could work it; its report line gives its own reason; the colony's panel shows its research | the smallest reading of §4 that every priority and power follows; each has a unit test |
| 2026-10-21 | Increment 27's proof as M2_WORLDS.md §29: rivals use the player's own overdrive and edicts (D-37: the same tools, no bonuses), from thresholds of their treasury and attention; the headless unit test also fails a rival that ends with more than 600 credits; the 100-turn browser journey times each turn from the press to the next quarter in the game, not the test browser's software drawing; the player's own numbers are left as they are, with what the headless games suggest put to the owner | the rivals spend what they earn; the owner decides the player's economy |
| 2026-10-21 | Increment 26's guided opening as M2_WORLDS.md §28 (D-40 as recommended): eleven steps, each done by doing it and passed over when already done; the governor's waits for a second colony and the Watch's for its first news (either may come first); a new game is guided until a guide has been finished or stopped on the device; *Menu → Guide me* and a *Guide* setting; the card sits under the top bar on a phone, beneath any sheet, so it never covers a sheet's buttons | the smallest reading of §12 that never blocks the player |
| 2026-10-21 | Increment 25's pictures (M2_WORLDS.md §27.8): 30 candidates, about **$1.50**, so about **$23.15** of the owner's $25 spent in all; the events chosen: flare A, comet A (B read as an asteroid), harvest A, blight B, strike A, epidemic B, derelict A, lane drift A, petition A, defectors A (B had black bars), smugglers B, Founders' Day A; the flare shields: the Authority's B, the Cooperative's A, the Wake's B | within D-27 and D-41; the lettered sheets went to the owner to overrule |
| 2026-10-21 | Increment 25's events as M2_WORLDS.md §27 (D-38 as recommended), with §11's draft costs made payable when chosen: the comet's ice costs 10 credits (not 20 industry), retuning a drifting lane 10 fuel and 10 metals (not 20 industry at its end), studying a derelict needs no ship to wait; a granted petition takes a million people with its ship; welcoming defectors costs 10 credits; a colony with a medical centre has no epidemics; none before turn 5; answers take effect as the turn ends and may be changed until then; a rival builds no ship while its treasury gains nothing | small, each with a unit test, and the headless games stay out of debt |
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
