# Scope of work — draft 1

**Status:** draft 2, 19 October 2026. The first round of decisions is answered (see
[DECISIONS.md](DECISIONS.md)); references such as *(D-01)* point to them. Areas that still depend on
an open question say so.

This document says **what** Starman Control will contain and in what order it gets built. Each
feature area will get its own detailed design document before it is built.

## Contents

1. [The game in brief](#1-the-game-in-brief)
2. [Design pillars](#2-design-pillars)
3. [The turn](#3-the-turn)
4. [Feature areas](#4-feature-areas)
5. [Out of scope for 1.0](#5-out-of-scope-for-10)
6. [Technical approach](#6-technical-approach)
7. [Milestones](#7-milestones)
8. [Risks](#8-risks)
9. [Next steps](#9-next-steps)

## 1. The game in brief

**Genre:** single-player, turn-based 4X strategy (explore, expand, exploit, exterminate) in the
browser — **completely playable on a phone, with a dedicated desktop experience** *(D-04)*.

**Setting** *(D-01, D-02)*: the real stellar neighbourhood — every star real, every known planet
real, everything else generated and labelled fiction — some generations after Starman Reborn. The
three human powers of Reborn, the Sol Transit Authority, the Frontier Cooperative and the Hollow
Wake, hold the old 27-light-year sphere and are pushing the jump lanes past it. Out beyond the
frontier are other species, and the relics of one that is gone.

**The player** *(D-08, D-11)* leads one of several playable factions: in 1.0 the three human
powers, the Authority, the Cooperative and the Wake; the alien species become playable later. You
are *Control*: the voice your captains, governors and admirals answer to. You chart the neighbourhood, settle its real planets, build them
up, manage resources and fleets, deal with the other powers, human and alien, and hunt for the
artefacts.

**Inspiration:** *Master of Orion 3* above all — an empire big enough to feel imperial, planets
you develop rather than micromanage, a council of powers with a vote that can end the game, a hunt
for a vanished species' relics — together with the lessons of what it got wrong
([research](research/MASTER_OF_ORION_3.md)).

**A game, start to finish** (a standard game, *D-16*):

| Phase | Turns (approx.) | What happens |
| --- | --- | --- |
| Opening | 1–40 | Survey the old sphere's unclaimed systems, settle the best real planets, research better drives to reach the frontier lanes, rival human powers crowd the same stars |
| Contact | 40–100 | The frontier lanes open; first signals from other species; translation, first treaties, first border incidents; the first relic sites |
| Ascendancy | 100–180 | Large economies, fleets and wars; the council forms and votes; the artefact hunt narrows; a star dies and changes the map |
| Endgame | 180–250 | A power wins by conquest, by the council's vote, or by completing the artefacts — or the turn limit ends it on score |

A standard game should take 6–12 hours over several sittings; a quick setting halves it.

## 2. Design pillars

These come from [VISION.md](VISION.md) and settle arguments about what to build.

1. **A real sky.** Every star is where astronomers measure it, every known planet is the real one,
   and every invented thing says so.
2. **An empire, not a spreadsheet.** Every number can explain itself; every turn tells you what
   changed, why, and what needs you.
3. **Delegate, never abdicate.** Hand any part of the empire to a governor or an automatic rule,
   see what they did and why, and take it back at any time. The game never plays itself.
4. **Others are truly other.** Each species wants different worlds, thinks differently and talks
   differently, so peace is as interesting as war.
5. **The unknown pulls you outward.** Mysteries keep exploration meaningful for the whole game,
   not just the first fifty turns.
6. **Fits a life.** A few turns on a phone on the bus, an evening's campaign at a desk; the whole
   game on either; save anywhere.

## 3. The turn

1. **Briefing.** The turn opens on a report: what happened, grouped by importance, each item
   linking to where it happened, and a short list of **what needs you** (an idle shipyard, a
   colony starving, an envoy waiting).
2. **Orders.** Move fleets, set what planets build and how they are zoned, choose research, design
   ships, make or answer diplomatic offers. Anything can be left to governors and rules.
3. **End turn.** All powers' orders resolve together, in a fixed order (movement, combat,
   invasion, production, research, growth, diplomacy, events), the same for everyone *(D-05)*.

The simulation is deterministic: the same game seed and the same orders give the same result.

## 4. Feature areas

Each area lists what 1.0 contains and what comes later. *MoO3* marks the mechanic in *Master of
Orion 3* it answers to.

### 4.0 Playable factions

*MoO3: every one of its sixteen races could be played.*

*(D-08)* In 1.0 all three human powers are playable, each with its own traits, start, shipmakers
and way of playing; the AI plays the others. First sketches, to be designed in M1–M3:

| Faction | Plays as | Starts | Shipmakers |
| --- | --- | --- | --- |
| **Sol Transit Authority** | The lawful centre: strong administration, the lanes and their customs, steady growth, slow to change | Sol and the old core | Halden (balanced), Ares (armoured) |
| **Frontier Cooperative** | Many settlements run by vote: good at colonising and farming, happiest at peace, decisions shaped by its members | Alpha Centauri, Sirius, Epsilon Eridani | Toliman (frugal), Horizon (fast), Eridani (cheap haulers) |
| **Hollow Wake** | An outlaw power: lives off raids, tolls and black markets, hides its bases, weak at governing, dangerous at the edges | the raider dens of lawless space | Wake Salvage (stolen hulls rebuilt) |

Starts are balanced by design, not copied from Reborn's map, where the powers differ greatly in
size.

**Built for more factions.** A faction is data: a species, a government, traits, a start,
shipbuilding styles, names and art. No rule assumes the player is human; the player and the AI
give orders through the same interface; every screen works for any faction. Adding an alien
faction later means adding its data and its own mechanics, not rewriting the game.

### 4.1 The map and exploration

*MoO3: a galaxy of stars joined by starlanes, scouts, survey.*

- **Real stars** in real 3D positions (*D-02*). The map shows the neighbourhood in 3D, with a flat
  projected view for clarity, as Reborn's star map does.
- **Jump lanes** between stars, generated as Reborn generates them (short core lanes, longer
  frontier lanes). **Drive technology decides the longest lane a ship can take**, so research
  opens the map in rings — the real distances between real stars shape the strategy.
- **What astronomers already know is known from turn one:** every star's type and the real known
  exoplanets (with their uncertainties). **What nobody knows yet must be found:** generated planets,
  moons and belts *(D-03)*, resources, relic sites, anomalies, and other species.
- **Survey ships** chart systems; **deep-space scanners** on colonies see fleets moving nearby.
- **Anomalies** found by surveys become small research projects with a reward.
- *Later:* building new lanes as an infrastructure project; lane blockades and interdiction.

### 4.2 Planets and colonies

*MoO3: planet types, climates, gravity, sizes; colony ships; population growth.*

- **Planet model** derived from real data where it exists, generated from the star otherwise:
  kind (rocky, super-Earth, mini-Neptune, gas giant, ice giant, dwarf, belt), size, gravity,
  temperature from the starlight it receives, atmosphere, water, tidal locking, and exposure to
  stellar flares (ten real flare stars are already in Reborn's data).
- **Habitability per species:** each species has environments it can live in comfortably, with
  effort, or not at all. Humans and aliens want different worlds, so neighbours need not fight
  over every planet.
- **Three kinds of holding:** *colonies* (people living there), *outposts* (mines, gas harvesters,
  research posts, without a population; Reborn's station kinds), and *stations* (orbital habitats
  and bases, later).
- **Colonisation** by colony ships and outpost ships built at shipyards; population grows towards
  the planet's capacity; approval (happiness) affects output and order.
- *Later:* terraforming, orbital habitats, migration between colonies, refugee events.

### 4.3 Developing planets

*MoO3: planets of 1–12 regions, each zoned for up to two "dominant economic activities"
(farming, mining, manufacturing, research, government, military, recreation), developed by the
planet's viceroy to the plan you set.*

- Each colony has a number of **districts** set by its size (about 1 to 12).
- You **zone** each district for one use: farming, industry, mining, research, habitation,
  commerce, military or administration. A planet's nature favours some uses (rich ores for mining,
  a temperate surface for farms, a gas giant only for harvesting).
- **Projects** are one-off buildings on a planet: spaceport, shipyard, defence grid, laboratory,
  orbital elevator, and so on — about fifteen in 1.0.
- A **governor** can zone and build for you to a priority you set (grow, produce, research,
  defend), and says what it did (§4.15).
- *Later:* unique wonders, planet-specific special buildings from relics.

### 4.4 Peoples within the empire

- Population belongs to a species; colonies can mix species once aliens join your empire (by
  treaty, conquest or refuge).
- Approval responds to food, taxes, war weariness, crowding, and how the empire treats each
  species. Unrest lowers output; rebellion can lose a colony.
- *Later:* factions and politics inside your own power.

### 4.5 Economy and resources

*MoO3: planetary and imperial economies, taxes, budgets; few resources.*

- **Credits** (the treasury): taxes in, upkeep of ships and buildings out, a tax rate you set.
- **Industry** built on each planet, spent on its own projects and ships. The treasury can push a
  planet past its capacity at a cost that doubles with each step (MoO3's "overdrive"), shown as a
  curve so the choice — build capacity, or pay to go beyond it — is plain.
- **Research** pooled empire-wide.
- **Food** made by farm districts and shipped automatically along lanes within supply range.
- **Strategic resources** drawn from Reborn's goods and the real sky: *metals* (rocky worlds and
  belts), *volatiles* (ice worlds, comets, Kuiper belts), *fusion fuel* (deuterium and helium-3,
  from gas giants) and *exotics* (only from anomalies and relic sites). Advanced ships and
  buildings need them.
- **Trade:** freight between your own colonies happens by itself; trade treaties with other powers
  add income; the Wake's raiders, and war, interrupt it.
- **Supply range:** fleets far from your colonies and bases lose supply and fight worse.
- *Later:* a market where powers trade resources, trade routes you can see and raid.

### 4.6 Research

*MoO3: six research schools advancing by levels; which technology unlocks at which levels was
randomised each game, so some had to be traded for or stolen.*

- **Six fields:** Propulsion, Construction, Life Sciences, Energy and Weapons, Society, and
  **Xenology** — the last opened only by meeting aliens and studying relics, so the unknown drives
  science.
- Each field advances by levels; each level offers technologies. In 1.0 about 60–90
  technologies, each doing something you can see.
- Drive research opens longer lanes (§4.1); habitability research opens harder worlds.
- Every technology states its exact effect (MoO3's vague descriptions made players stop caring).
- *Later:* more technologies; trading and stealing them; an option to shuffle a little which
  technology comes at which level, for replay.

### 4.7 Ships, designs and fleets

*MoO3: ship design from hulls and components, fleets made of task forces with roles.*

- **Hulls** from small to capital: about five warship sizes and five civilian kinds (survey,
  colony, outpost, freighter, troop transport). Reborn's makers give each human power its own
  shipbuilding tradition and look.
- **Ship designer:** a hull with slots for weapons (with Reborn's damage types: energy, kinetic,
  plasma, ion), shields (balanced, deflector, diffuser), armour, drives and special modules. The
  game offers good designs automatically, and you can refine them.
- **Refits** bring old ships up to a new design at a shipyard.
- **Fleets** are made of **task forces** with a role (line, escort, screen, support, transport) and
  led by an admiral. Fleets have a stance (engage, defend, evade) and a retreat point.
- A **command limit** and **upkeep** keep fleets in proportion to the economy.
- *Later:* carriers and fighters, stations you can move, very large hulls.

### 4.8 Combat

*MoO3: real-time 3D tactical battles (much criticised) and ground combat.*

- **Space battles** *(D-07)*: you decide before the battle — each task force's stance, target
  priority and retreat point — and the battle resolves by rules that use the designs, the damage
  types and the admirals. It plays as a short 3D replay you can watch, skip or rewind, with a
  report that explains why it went the way it did.
- **Planetary defences:** shields, batteries and garrisons, built as projects.
- **Ground invasion:** troop transports land armies against the garrison; resolved over one or
  more turns and reported as radio traffic from the commanders to Control (MoO3's much-loved
  touch). Bombardment and blockade are orders too.
- *Later:* tactical command of battles for those who want it.

### 4.9 Diplomacy and the council

*MoO3: diplomacy with every race, and the Orion Senate, whose vote can make a leader win.*

- **First contact is a process:** first a signal, then a partial translation, then talk. Xenology
  research and contact time improve understanding; misunderstanding is possible early on.
- **Treaties:** non-aggression, open lanes (passage), trade, research sharing, borders, alliance,
  tribute, and war and peace. Demands and threats.
- **Every power remembers** what you did and **shows its reasons**: "remembers you broke a
  treaty", "admires your fleet", "covets Tau Ceti e".
- **The council** forms once enough powers know each other: members vote on resolutions
  (embargoes, lane law, sanctions, admitting new members) and periodically on who leads it; being
  elected leader by a large majority is a victory *(D-14)*. Its name and rules are to be designed.
- The **Hollow Wake** deals differently from lawful powers: tolls, bribes and protection.
- *Later:* federations, a fuller set of resolutions.

### 4.10 Espionage

*MoO3: spies for intelligence, sabotage and theft.*

- *1.0, light:* agents gather intelligence on another power (its planets, fleets, technologies)
  and defend your own.
- *Later:* sabotage, stealing technology, inciting unrest.

### 4.11 Alien species

*MoO3: sixteen playable races in eight species, each species with fixed traits and built-in
likes and hatreds that drive diplomacy.*

Principles: every species is original, grounded in a real idea from astrobiology, tied to the
kinds of stars that really fill the neighbourhood, and **mechanically different**: it lives on
different worlds, expands differently, fights differently, and talks differently. Their homes
are real stars beyond the frontier *(D-01, D-02)*; the species themselves are fiction, and the game
says so. In 1.0 they are played by the AI, but each is designed with enough depth to be played
later *(D-08)*.

Draft concepts for discussion *(D-12)*; the names are placeholders:

| Concept | Idea | How it plays |
| --- | --- | --- |
| **Twilight folk** | From a tidally locked planet of a red dwarf, living in the ring of twilight between the burning day side and the frozen night side; hardened against flares | Red dwarfs are most of the real neighbourhood, so they thrive where humans struggle: the natural expanders. Patient, communal |
| **Under-ice thinkers** | Evolved in an ocean under the ice of a frozen moon; never saw a star until they drilled out | Slow to leave home, superb at life sciences, defensive; settle icy worlds no one else wants |
| **Cloud drifters** | Vast, long-lived floaters in a gas giant's atmosphere | Few in number, live only on gas giants, masters of fusion-fuel trade; natural brokers and council kingmakers |
| **The chorus** | A colonial organism of many small bodies with one mind per colony | Breeds fast, expands hard, hard to negotiate with until understood |
| **Machine heirs** | Self-copying machines that outlived the species that built them | Need no habitable worlds (belts, airless rocks); cold and logical; know something about the precursors |
| **The unhomed** | Survivors of a dying star, living in ark fleets | No homeworld; arrive as an event; can be welcomed, settled, used or fought |

### 4.12 Unknown artefacts and the precursors

*MoO3: the Antarans and the hunt for their relics, which can end the game; ancient ruins and
special planets.*

- A **vanished species** left things behind among the real stars: relic sites on planets, derelict
  structures in deep space, and a small number of **keys** — pieces of one thing.
- **Relic sites** are excavated as projects in chapters, each with a choice and a reward
  (technology, exotics, Xenology, a warning).
- **Guardians** watch some sites.
- Assembling the keys is a victory path, and dangerous *(D-13, D-14)*.
- Ties to Reborn worth exploring *(D-13)*: the old derelicts with charts "older than any in your
  computer" and a carrier tone "as there has been for a very long time"; Pyre's black hole; the
  dead stars.
- The main mystery is written once; which relics appear where changes every game.

### 4.13 Events and the living sky

- **Real astronomy, as play:** flare stars flare and harm unshielded colonies (that they flare is
  real; when is fiction); binary stars' companions; belts and discs where astronomers see them.
- **Fictional set pieces, labelled:** a star dies mid-game, as Betelgeuse does in Reborn, and
  changes what is possible.
- **Story events** for each power and each species, with choices; random events (discoveries,
  epidemics, strikes, raids, defectors). About forty in 1.0.

### 4.14 Leaders

*MoO3: leaders with traits as governors, admirals and spies.*

- Named **starmen**: admirals, governors, envoys, scientists and agents, hired from a pool, each
  with traits that grow with experience and a loyalty that can fail.
- Some are descendants of Reborn's people, for players who know them.

### 4.15 Delegation and governors

*MoO3: viceroys ran the planets to development plans you set. The design rationed the player's
interventions with "focus points", but they were cut before release, leaving systems built for
rationed attention with unlimited, unrewarding meddling — and viceroys that overrode orders. The
result felt like the game played itself; critics see this as its root failure.*

- Anything can be delegated: a planet's zoning and projects (to its governor), research (to a
  queue), ship designs (to the designer), colonisation targets (to suggestions), a sector of
  planets (to a sector governor).
- **Nothing is delegated by default** except what you choose at the start (a setting offers
  "hands-on" and "imperial" presets).
- Every delegated decision appears in the turn report with its reason, and can be undone; an
  order you give a governor sticks.
- *Open (D-15):* how far to go, and whether attention should be a resource — a few "edicts" a
  turn spent on changing plans, which would give delegation real meaning.

### 4.16 AI powers

- Each AI power has a **personality** from its people's nature and its leader (cautious,
  expansionist, mercantile, zealous…), and plays by the same rules as you.
- Difficulty levels change how well the AI plays; any advantage it gets at higher levels is
  disclosed in the setup screen.
- AI turns run in the background (a Web Worker) so the interface stays responsive.

### 4.17 Victory and defeat

*(D-14)* Proposed for 1.0:

- **Supremacy:** every rival power defeated or subdued.
- **The council's choice:** elected leader of the council by a large majority.
- **The keys:** the artefacts assembled and their purpose fulfilled.
- **Score:** at a turn limit, if set.

You lose when your last colony is lost or you are subdued.

### 4.18 Interface and learning

- **Screens:** the neighbourhood map (3D, and flat), a system view, a planet screen, the empire
  overview (every colony at a glance), research, the ship designer, fleets, diplomacy, the
  council, the turn report, and a **codex** of real astronomy (each entry badged *Observed* or
  *Fiction*, as in Reborn).
- **Every number explains itself:** hover (desktop) or tap (phone) any figure for its breakdown.
- **What needs you:** a list at the start of each turn, so nothing important is hidden.

**Two first-class layouts** *(D-04)*. The whole game is playable on a phone, and the desktop gets
an experience of its own. They share the simulation, the screens' content and the visual language;
they differ in layout and input:

| | Phone | Desktop |
| --- | --- | --- |
| Shape | Portrait first, landscape supported; one thing at a time, full-screen sheets that slide up over the map | Several panels at once around the map (empire, selection, report), resizable |
| Map | Pinch to zoom, drag to turn, tap to select; the flat view is the default for clarity | Mouse orbit and zoom, hover cards, box-select fleets; 3D by default |
| Detail | Progressive: a summary card first, the full breakdown a tap away | Dense: tables, side-by-side comparisons, tooltips on hover |
| Orders | Large targets (at least 44 px), long-press for more, a bottom action bar within thumb reach | Right-click orders, drag and drop, keyboard shortcuts for every action |
| Lists | Cards that sort and filter (colonies, fleets, technologies) | Sortable tables with many columns |
| Turn | "What needs you" as a stack of cards to work through, then *End turn* | The same list as a panel beside the map |

Rules for every screen: designed for both layouts before it is built; tested at Reborn's range of
phone, tablet and desktop sizes with screenshots; safe areas respected; the middle of the map kept
clear on a phone, as Reborn keeps its flight view clear; text size setting honoured; nothing that
needs a hover to be found. Tablets take whichever layout fits their width, by touch or with a
keyboard and mouse.
- **Learning:** a guided opening teaches each system in turn, as Reborn's first job chain does;
  advisors (your starmen) give short, plain, optional advice.
- **Accessibility:** text size, colour always paired with shape and word, full keyboard play,
  reduced motion — Reborn's rules.
- Reborn's visual language: dark navy glass panels with cut corners, cyan edges, the Saira
  typefaces, icons and numbers first.

### 4.19 Art and sound

*(D-09)* Procedural 3D for the map, planets, ships and battles, reusing Reborn's generators.
Portraits (species, leaders, advisors) and illustrations (events, relics) are generated with
OpenAI or Google Gemini at build time, reviewed, and committed with a record of how each was made
([ART_PIPELINE.md](ART_PIPELINE.md)); pictures are sized and compressed for phones. Music and sound
from Reborn's procedural audio engine, adapted for a calmer strategic mood.

### 4.20 Saves and settings

As in Reborn: an autosave every turn, three save slots, export and import as a file, saves that
migrate across versions, settings kept separately. Saves are small because the simulation is
deterministic and the map is rebuilt from its seed.

## 5. Out of scope for 1.0

- Online or real-time multiplayer *(D-06)*; real-time play *(D-05)*.
- Playing an alien species *(D-08)*: designed for, added after 1.0.
- Syncing one campaign between phone and desktop automatically (there is no server); a save can
  be moved by exporting and importing a file, as in Reborn.
- Tactical command of battles *(D-07)*; flying a ship yourself.
- Live AI-written text while playing *(D-17)*.
- Mods (the rules will live in data files, so this is possible later).
- Languages other than English; voice acting.
- A made-up galaxy: the map is always the real neighbourhood.

## 6. Technical approach

- **Same toolchain as Reborn:** TypeScript, Vite, Vitest, Playwright; a static site on GitHub
  Pages; no server.
- **A pure simulation core:** plain TypeScript with no browser access; a seeded random number
  generator; the whole game state is plain data, saved as one versioned record. It runs in a Web
  Worker in the game and directly in tests.
- **Rules in data files** with automated guardrails, as Reborn's procedural generation does
  ([Reborn's PROCGEN.md](https://github.com/shotif/starman-reborn/blob/main/docs/PROCGEN.md)).
- **Rendering:** three.js for the map and battle replays (likely, *D-10*); HTML and CSS for every
  panel and text, as in Reborn.
- **Data:** the astronomy dataset copied from Reborn with its provenance, extended with Reborn's
  own fetch pipeline (run on GitHub's runners) to the radius chosen in *D-02*.
- **Tests:** unit tests for every rule; **AI-against-AI games played headless in CI** for hundreds
  of turns, to catch crashes, stalls and runaway balance; browser journeys for the main screens on
  both a phone and a desktop viewport; layout screenshots at every test size.
- **Phones set the budgets,** as in Reborn: a first-load budget for a mobile connection, a frame
  budget for the map on a mid-range phone, an end-of-turn time budget, quality presets that step
  down on slow devices, and the game kept for offline play after the first visit.
- **Generated art** comes from a build-time pipeline using the OpenAI and Gemini APIs; the keys
  live only in environment variables, never in the repository or the site
  ([ART_PIPELINE.md](ART_PIPELINE.md)).

## 7. Milestones

Each milestone is split into increments; each increment keeps the game working, passes CI and
deploys to the live site. The exit criterion says when the milestone is done.

| | Milestone | Contents | Done when |
| --- | --- | --- | --- |
| **M0** | Foundations | Repository, CI, GitHub Pages, these documents, the first round of decisions, the art pipeline | Round 1 answered, the site live *(done 19 October 2026)* |
| **M1** | First light | The real map (207 systems) and lanes, the turn loop, survey and colony ships, planets (real and generated), colonies and outposts with simple output, drive research, saves — on phone and desktop | You can explore and settle the neighbourhood alone for 50 turns, on a phone and on a desktop |
| **M2** | Worlds | Districts and zoning, projects, population and approval, food, credits and strategic resources, the research fields, governors, the turn report and number breakdowns | A 100-turn solo game has real economic choices, and every number explains itself |
| **M3** | Neighbours | The other human powers as AI, the first two or three alien species, first contact and translation, treaties, borders, memory of what you did | You meet, trade with and quarrel with AI powers that behave believably |
| **M4** | Fleets | The ship designer, fleets and task forces, battles with orders and replays, invasion and defences, war and peace, the council, the first victory conditions | A full game can be won by conquest or by the council's vote |
| **M5** | The unknown | Relic sites, the precursor mystery and keys, anomalies, events and the dying star, the remaining species, light espionage, leaders | A full game can be won by the keys; the decision on Steam is taken |
| **M6** | 1.0 | Balance from AI-against-AI games, the guided opening, music and sound, accessibility, the wider map sizes, polish | The owner is happy to call it 1.0 |

Rough sense of size: M1 and M2 are the foundation and take the longest; M3 and M4 are each about
as large as M1; M5 is content-heavy; M6 is tuning. Dates will be estimated once round 1 is decided
and M1 is designed in detail.

## 8. Risks

| Risk | Mitigation |
| --- | --- |
| **Scope.** A 4X is enormous. | Every milestone is playable; each area has a 1.0 cut and a *later* list; we cut before we slip. |
| **The AI.** A weak AI ruins a 4X. | AI is built with each system from M1, not bolted on at the end; AI-against-AI games in CI; personalities over cleverness. |
| **Opacity**, *Master of Orion 3*'s great failure. | "Every number explains itself", the turn report and "what needs you" are built in M1–M2, before the content. |
| **Balance.** | Rules in data files; headless games measure win rates and economies. |
| **A 4X on a phone screen.** Dense information, hundreds of stars, small fingers. | Both layouts designed from M1, not adapted later; progressive detail; the flat map by default on phones; every screen tested at phone sizes; a real phone tried at every milestone. |
| **Performance** in a browser with hundreds of systems and fleets, on phones. | Simulation in a worker; instanced rendering; budgets measured on a mid-range phone. |
| **Generated art** that varies in style, or that a store or player objects to. | A written style guide and reference images per series; every picture reviewed; provenance recorded; AI use disclosed where stores require it. |
| **Real data gaps** (faint brown dwarfs, uncertain planets). | Show uncertainty as Reborn does; generated bodies always labelled. |
| **Data licence:** HYG-derived values are CC BY-SA 4.0. | Prefer the archive snapshot values; credit and keep the licence for anything HYG-derived. |
| **Canon** drifting from Reborn. | The universe digest is the reference; new canon is recorded in a lore document and agreed with the owner. |

## 9. Next steps

1. ~~The owner answers round 1~~ — done 19 October 2026.
2. The M1 design: [design/M1_FIRST_LIGHT.md](design/M1_FIRST_LIGHT.md) — the rules for the map,
   the turn, planets and colonisation, the phone and desktop screens, and the architecture.
3. The owner reviews it and answers its questions; then M1 is built in increments, each deployed
   to the live site.
