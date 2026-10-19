# Decisions

Every decision that shapes the game is recorded here: the question, the options, Claude's
recommendation, and the owner's answer with its date. Nothing marked **Open** is built until it is
answered (see [../CLAUDE.md](../CLAUDE.md)). Engineering choices that are small and easy to reverse
are listed under *Made without waiting* so the owner can overrule them.

Status: **Open** · **Decided** · **Deferred** (not needed until a later milestone).

## Round 1: needed before the first playable build is designed

These decide what milestone M1 ([SCOPE.md](SCOPE.md#7-milestones)) looks like.

### D-01 · Setting and timeline — **Open**

Starman Reborn has no aliens, and humanity already lives across its 207 systems in what reads as
an alternative present. A 4X with aliens needs new canon. Where does Control sit?

| Option | What it means | For | Against |
| --- | --- | --- | --- |
| **A. Beyond the frontier (sequel)** | Some generations after Reborn. The Authority, the Co-op and the Wake have grown into states holding the old 27 ly sphere. The lanes are being pushed past it, and out there are the aliens and the artefacts. | Keeps Reborn canon intact; Reborn's places become the old heartlands; first contact is the story of the game. | Needs real stars beyond 27 ly (D-02). Human powers start bigger than a classic one-homeworld start, and unevenly (the Co-op's Reborn core is 18 systems, the Authority's 5), so starts must be balanced. |
| **B. The lanes go dark (sequel after a collapse)** | Something — perhaps the thing that made Reborn's impossibly old derelicts — breaks the lane network. Each power is cut off in its home system with old charts, and must reopen the neighbourhood, finding Reborn-era ruins and meeting the aliens that did it (or suffered it too). | Classic 4X start from one home system; exploration of known-but-lost space is a strong hook; Reborn's derelicts gain a meaning. | Darker; a big piece of new canon that also reframes Reborn; more story to write. |
| **C. A separate continuity** | Same powers, makers and style, but a "what if" timeline with alien neighbours within the 27 ly sphere. | Simplest: the 207-system map is ready today; standard 4X start. | Breaks continuity with Reborn; aliens on our doorstep sit oddly with the realism ethos. |

**Recommendation: A**, with the starting positions balanced as a design task. It respects the
canon, gives the old powers a reason to expand, and makes "the frontier" — already a place in
Reborn — the stage for first contact. B is the most dramatic and worth considering if you want a
classic one-world start.

### D-02 · The map: which real stars — **Open**

Every star on the map is real (positions, types, known planets and belts from the archives). The
question is how far out. Counts below are estimated from the local star density (Reborn's census
gives 207 systems to 27.2 ly) and will be lower where faint brown dwarfs are not yet catalogued.

For scale: *Master of Orion 3*'s galaxies had about 50, 100, 175 or 250 stars (huge was 250).

| Radius | Systems (approx.) | Notes |
| --- | --- | --- |
| 27 ly | 207 | Reborn's census; data ready now; already a MoO3 "large to huge" map |
| 33 ly (10 parsecs) | ~340 | the "10 parsec sample" astronomers study closely |
| 40 ly | ~600 | more than twice MoO3's largest |
| 50 ly | ~1,200 | Stellaris-sized; too heavy for a turn-based browser game |

**Recommendation:** build M1 on the 207 ready systems. For the full game, extend the census with
Reborn's own fetch pipeline to **33 ly (10 parsecs, about 340 systems)** as the standard map, with
the old 27 ly sphere as humanity's heartland and the alien homeworlds in the shell beyond it
(option A of D-01). A larger 40 ly map can come later if performance and the AI allow. Smaller,
quicker games would start the powers closer together rather than cut the map.

### D-03 · Planets nobody has found yet — **Open**

Only 99 planets are known in those 207 systems; a 4X needs planets everywhere.
**Recommendation:** known planets are always the real ones (with their uncertainties, contested
ones flagged). Every other planet, belt and moon is generated from the star's real type, mass and
age, **different each game** (seeded), and labelled *Fiction* in the interface, as Reborn labels
its fiction. A setting could fix the seed so that everyone plays the same neighbourhood.

### D-04 · Devices and distribution — **Open**

A 4X is dense with information. Reborn was built phone-first; Control probably should not be.

| Option | Notes |
| --- | --- |
| **Desktop browser first**, tablets supported, phones later | Mouse and keyboard, large screen; tablets by touch; a phone layout once the screens settle |
| Every device equally from day one | Reborn's standard; slows every screen down |
| Desktop app (Steam) as the main target | Reborn already has a Steam trailer cut; a browser build can be wrapped (Tauri or Electron) later at modest cost |

**Recommendation:** desktop browser first (Chrome, Edge, Firefox, Safari), tablets supported, the
web build deployed to GitHub Pages at every milestone, and nothing that would stop a Steam build
later. Decide on Steam at milestone M5.

### D-05 · Turns or real time — **Open**

**Recommendation:** turn-based, like *Master of Orion 3*: every power gives its orders, then the
turn resolves for everyone at once (simultaneous resolution). It suits a browser (play a few
turns, close the tab), makes AI and saves simple, and keeps multiplayer possible later. The
alternative is pausable real time (Stellaris, Distant Worlds), which is harder to read and to build.

### D-06 · Single player or multiplayer — **Open**

**Recommendation:** single player against AI powers for 1.0. The simulation is built
deterministic (same seed + same orders = same result), so hot-seat or play-by-turn multiplayer can
be added later without a rewrite. Real-time online multiplayer is out of scope.

### D-07 · Space combat — **Open**

*Master of Orion 3*'s real-time 3D battles were among its most criticised parts.

| Option | Effort | Notes |
| --- | --- | --- |
| Auto-resolve with a written battle report | small | readable but flat |
| **Watchable battle with orders**: you set each task force's stance, targets and retreat point; the battle plays out as a short 3D replay you can watch, skip or rewind | medium | decisions happen before the battle, like *Endless Space 2* and *Stellaris*; reuses Reborn's procedural ships |
| Turn-based tactical battles you command ship by ship | large | *Master of Orion 2* style; long games get longer |
| Real-time tactical, or flying your flagship with Reborn's flight engine | very large | a crossover hook, but a second game inside the first |

**Recommendation:** watchable battles with orders for 1.0; tactical command can be added later
for players who want it.

### D-08 · Who the player can be — **Open**

You said *"aliens which we can encounter"*, which reads as playing humanity.
**Recommendation:** in 1.0 the player chooses one of the human powers (the Authority, the
Cooperative or the Wake, each with its own traits and play style; whether the Wake is playable at
all is part of the question). The alien species are AI-only in 1.0 and become playable after it.

### D-09 · Art and external tools — **Open**

Reborn's art is all procedural and its music synthesised; ElevenLabs made its trailer narration.
A 4X leans on **portraits** (species, leaders, advisors) that procedural art does poorly.

| Need | Options |
| --- | --- |
| Galaxy map, planets, ships, battles | procedural 3D, reusing Reborn's generators (no tool needed) |
| Species and leader portraits, event pictures | an image-generation service you provide (with a licence that allows a commercial release), commissioned art, or stylised procedural silhouettes |
| Music and sound | Reborn's procedural Web Audio engine; optionally a music or voice service (ElevenLabs is already in use) |

**Recommendation:** procedural for everything but portraits; for portraits and event art, decide
between an image service and commissioned art before milestone M3, when the first aliens appear.
Until then, stylised placeholders.

### D-10 · Sharing code with Starman Reborn — **Open**

Control can reuse Reborn's astronomy data, 3D star map, procedural ship generator, audio engine
and interface style.

| Option | For | Against |
| --- | --- | --- |
| **Copy and adapt**, with a note in each copied file of where it came from | fast, each game free to change | fixes must be made twice |
| A shared package both games depend on | one fix serves both | Reborn must be restructured; slows both games |

**Recommendation:** copy and adapt now; revisit a shared package if the same fix is needed in both
games more than a few times.

### D-11 · What "Control" means — **Open**

The title invites a framing: in Reborn you are a starman; in Control **you are Control** — the
voice your captains, governors and admirals ("starmen") answer to. Advisors address you as
*Control*, reports come in as signals, and your leaders are characters with names. Is that the
meaning you had in mind, or did you have another?

### D-16 · Game length, and what a turn stands for — **Open**

*Master of Orion 3* games often ran past 300 turns, and it took about five hours on a small map to
tell whether you were winning. Reborn's lanes take 1.4 days per light-year, yet colonies need
decades to grow.

**Recommendation:** a standard game of 150–250 turns (6–12 hours), with a quick setting. A turn
is about **three months**, so a game spans roughly sixty years — one generation's story. Fleets
are limited by how many jumps they can make in a turn and by supply, not by the raw lane speed.

## Round 2: needed later

| ID | Question | Needed by | Recommendation in brief |
| --- | --- | --- | --- |
| D-12 | The alien roster: how many species in 1.0, and which concepts (drafts in [SCOPE.md §4.11](SCOPE.md#411-alien-species)) | M3 | five or six, each with a different way to play against |
| D-13 | The artefacts and the vanished species behind them ([SCOPE.md §4.12](SCOPE.md#412-unknown-artefacts-and-the-precursors)) | M5 | tie them to Reborn's old derelicts and Pyre |
| D-14 | Victory conditions | M4 | conquest, a council vote, the artefact hunt, and a score at a turn limit |
| D-15 | How much is automated (governors and viceroys), and whether attention is a resource ("edicts" spent on changing plans, the idea MoO3 cut) | M2 | optional governors with visible priorities and reasons, never the default; try edicts in M2 and keep them only if they make play better |
| D-17 | Live AI text (for example, alien diplomats speaking through a language model) | M4 | not in 1.0; text written at build time, as Reborn allows |
| D-18 | Free or paid, open source or not, Steam or web only | M5 | develop in the open on GitHub Pages; decide at M5 |

## Made without waiting

Small engineering choices, easy to reverse. Overrule any of them.

| Date | Choice | Why |
| --- | --- | --- |
| 2026-10-19 | Same toolchain as Reborn: Node 22, TypeScript, Vite, Vitest, the same pinned versions | one way of working across both games; proven on GitHub Pages |
| 2026-10-19 | No rendering library yet (three.js is the likely choice, pending D-07 and D-10) | nothing is drawn yet but a placeholder title |
| 2026-10-19 | The interface borrows Reborn's design tokens and typefaces (Saira, dark navy glass, cyan accent) | the two games read as one universe |
| 2026-10-19 | CI runs on every branch and pull request; Pages deploys from `main` | catches problems before they reach the live site |
| 2026-10-19 | The simulation will be a pure, deterministic TypeScript core with no DOM access, separate from the interface | testable without a browser, AI turns can run in a worker, replays and multiplayer stay possible |
