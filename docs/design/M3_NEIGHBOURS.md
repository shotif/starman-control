# M3 · Neighbours

*Proposed 21 October 2026, after M2b. **D-12 and D-51 to D-57 decided on 22 October 2026, every
one as recommended** ([DECISIONS.md](../DECISIONS.md#round-6-neighbours-decided-22-october-2026)).
Each increment gets a detailed design section (§18 onwards), written before it is built, as M2's
and M2b's did, with its notes as built.*

SCOPE.md's M3: *the other human powers as AI, the first two or three alien species, first contact
and translation, treaties, borders, memory of what you did.* Done when *you meet, trade with and
quarrel with AI powers that behave believably.* The human rivals already play (M2, D-37); M3 makes
them, and the first aliens, powers you deal with.

## Contents

1. [Where M3 starts](#1-where-m3-starts)
2. [Goals](#2-goals)
3. [Out of scope](#3-out-of-scope)
4. [The map out to 33 light-years (D-51)](#4-the-map-out-to-33-light-years-d-51)
5. [The first alien species (D-12)](#5-the-first-alien-species-d-12)
6. [First contact and translation (D-52)](#6-first-contact-and-translation-d-52)
7. [Memory and attitude (D-55)](#7-memory-and-attitude-d-55)
8. [Treaties (D-53)](#8-treaties-d-53)
9. [Borders and claims (D-54)](#9-borders-and-claims-d-54)
10. [Trade](#10-trade)
11. [The Hollow Wake's dealings (D-56)](#11-the-hollow-wakes-dealings-d-56)
12. [On the screen](#12-on-the-screen)
13. [Rivals that deal](#13-rivals-that-deal)
14. [Increments](#14-increments)
15. [Tests and budgets](#15-tests-and-budgets)
16. [Art and its cost (D-57)](#16-art-and-its-cost-d-57)
17. [Decisions for the owner](#17-decisions-for-the-owner)
18. [Increment 33 in detail: the shell](#18-increment-33-in-detail-the-shell-written-before-building-it)
19. [Increment 34 in detail: contact](#19-increment-34-in-detail-contact-written-before-building-it)
20. [Increment 35 in detail: memory and the diplomacy screen](#20-increment-35-in-detail-memory-and-the-diplomacy-screen-written-before-building-it)

## 1. Where M3 starts

- Three human powers play every game by the same rules (M2), with science, discoveries, doctrines,
  great works and a score (M2b). They meet only as neighbours: each other's lanes are closed to
  them (D-37), the Watch reports what it sees, the standings compare them. There is no talk, no
  treaty, no trade, no border, and nobody remembers anything.
- The map is Reborn's 207 systems out to 27 light-years. D-02 decided the full game reaches
  **33 ly (about 340 systems)**, the old sphere being humanity's heartland and the alien homes in
  the shell beyond. Nothing lives there yet.
- Xenology has one technology (Lapse studies, M2b); D-08 says alien species become playable later,
  so every rule must already treat them as powers like any other.

## 2. Goals

- **Meet the others properly:** first contact as a process, from a signal to talk, faster with
  Xenology and time.
- **Deal with them:** treaties for passage, trade, shared research and borders, offered and
  answered by the player and the AI through the same orders.
- **Be remembered:** every power keeps an attitude to every other, with its reasons shown, built
  from what was done; it decides what they accept and what they offer.
- **Borders that matter:** claims round every holding, drawn on the map, and settling inside
  another's claim has a cost.
- **The first aliens:** two species with homes in the shell beyond 27 ly, mechanically unlike
  humans and each other, played by the AI, designed so they could be played later.
- **Phone and desktop alike** (D-04): a diplomacy screen for each, and every new number explained.

## 3. Out of scope

War, fleets, battles and invasion (M4); the council and its vote (M4, D-14); espionage (M5); relics
and the precursors (M5, D-13); playable alien powers (later, D-08); live text from a language model
while playing (D-17: not in 1.0); more than two species (the rest in M5, D-12).

## 4. The map out to 33 light-years (D-51)

The aliens' homes lie in the shell between 27 and 33 ly (D-01, D-02). The real stars there are
not yet in the game's data: Reborn's sky snapshot keeps everything with a parallax of at least
120 milliarcseconds (about 27 ly); 33 ly needs about 99.

- **A. Extend the census now (recommended).** A fetch on GitHub's runners (Reborn's workflow,
  which can reach SIMBAD, Gaia, the NASA archive and the Extrasolar Planets Encyclopaedia, with
  the limit lowered to 99 mas), then `npm run data:import` as before: about 130 more systems, each
  with its sources. Reborn's lanes end at 27 ly, so the shell starts dark and laneless: reached by
  blind jumps and new lanes, which suits a frontier. The map, the budgets and the headless games
  are measured again (about 340 systems; D-02 asked the phone map to stay readable at that size).
  Needs the owner's leave to run a workflow in Reborn's repository, or a copy of it in Control's.
- **B. Stay at 27 ly.** The aliens' homes are real stars inside the sphere that the human powers
  never reached. Cheaper, but against D-01's "beyond the frontier" and D-02.
- **C. Extend to 30 ly.** A half step: fewer systems to test on a phone, still a shell for the
  aliens.

## 5. The first alien species (D-12)

SCOPE §4.11 drafted six concepts. M3 brings two, chosen to be unlike humans and each other, and
to give the M3 rules something to work on: one that expands where humans cannot, one that trades.
Their names, looks and languages are invented for the game and labelled *Fiction*; their homes are
real stars, and the game says which facts are real.

- **The twilight folk** (a working name): from a tidally locked world of a red dwarf, living in
  the ring of twilight between the burning day and the frozen night, hardened against flares. Red
  dwarfs are most of the real neighbourhood, so they settle where humans struggle: *the natural
  expanders*, patient and communal. Habitability unlike humans' (locked worlds and flares cost
  them nothing; temperate open worlds feel exposed); a government by consensus; slow to trust,
  slow to forget.
- **The cloud drifters** (a working name): vast, long-lived floaters in a gas giant's air, few in
  number, living only on gas giants and trading fusion fuel. *The brokers*: they want trade
  agreements with everyone, pay for peace, and dislike whoever closes lanes.
- **The other four** (under-ice thinkers, the chorus, machine heirs, the unhomed) come in M5.

Options: **A. These two (recommended).** **B. One only** (the twilight folk), the cheapest. **C.
Three**, adding the under-ice thinkers. **D. A different pair** from the six.

Each species is data, as humans are (D-08): its habitability costs, traits, government, names,
its personality as an AI, its advisors' voices for when it becomes playable, and its art.

## 6. First contact and translation (D-52)

- **A. A process (recommended):** with each other power, a power is *unaware*, then hears a
  **signal** (it sees a holding, lane or ship of theirs), then has **words** (translation under
  way), then can **talk** (treaties possible). Translation comes from contact turns (each turn a
  holding or ship of theirs is seen) and Xenology; misunderstanding is possible before *talk*: an
  early offer may be misread and cost attitude. Between the human powers, who share languages,
  contact goes straight to *talk*.
- **B. Talk at once** on first sight, for every power. Simpler, and the aliens feel less alien.

Xenology gains its next technologies here (translation, trade protocols, a cultural exchange),
completing tier 2 and 3 of the field M2b began.

## 7. Memory and attitude (D-55)

- **A. Remembered acts (recommended):** each power holds an attitude to every other from −100 to
  +100, the sum of what it remembers, each memory with its weight and how fast it fades: a treaty
  kept or broken, a gift, trade, a claim crossed, a great work raced and lost, a rumour of shared
  science, being of the same kind or not, the species' own likes and dislikes. Shown with its
  reasons ("remembers you broke the open lanes treaty: −20"; "trades with you: +10"). It decides
  what an AI accepts, offers and demands.
- **B. A single number** with no reasons: less to show, against "every number explains itself".

## 8. Treaties (D-53)

- **A. Treaties without war (recommended):** **open lanes** (each may use the other's lanes;
  until now others' lanes were closed, D-37), **trade** (§10), **shared research** (each pays less
  for what the other knows, beyond M2b's spreading), **borders** (§9), each offered, accepted,
  refused or ended, with notice; breaking one is remembered. Non-aggression, alliance and war come
  with M4, when there is war to make.
- **B. The full set now,** war declared but no battles until M4: the words without the deeds.

## 9. Borders and claims (D-54)

- **A. Claims round holdings (recommended):** every colony claims its system and every system one
  lane jump from it (outposts their own system), drawn as the fields the map already shows (M1's
  living map). A system claimed by two is contested. Founding a colony or outpost inside another's
  claim is allowed but remembered (−); a border treaty settles contested systems. Claims give no
  bonus of their own.
- **B. No borders until M4:** territory stays a drawing.

## 10. Trade

A **trade agreement** gives each side credits each turn: 1 for every 4 colonies of the smaller
side, and 1 more for each lane joining their holdings, at most 10 (numbers for balancing). Powers
may also **exchange resources** once (metals, volatiles, fusion fuel, credits) by offer and
acceptance. Trade is remembered (+).

## 11. The Hollow Wake's dealings (D-56)

SCOPE §4.9: the Wake deals differently from lawful powers.

- **A. In M3 (recommended):** the Wake offers **passage for a toll** instead of open lanes (credits
  a turn), takes **bribes** (credits for attitude), and sells **protection** (pay, and its ships
  leave your systems alone, which matters from M4). The lawful powers remember dealing with it.
- **B. Later, with M4's raids.**

## 12. On the screen

- **The diplomacy screen:** each power you know, its contact stage, attitude with its reasons,
  treaties in force, and what you can offer or ask; on a phone a card per power with a sheet for
  each, on a desktop a table of powers with the selected one beside it.
- **Offers** arrive like events: in *what needs you*, the report and the advisor who speaks for
  foreign affairs (a seventh department, the **Envoy**, with faces for each power: 3 pictures).
- **The map:** claims as the existing fields, contested systems marked, other powers' lanes shown
  as open to you or not.

## 13. Rivals that deal

The AI offers and answers treaties by its personality and its attitude, through the same orders as
the player's: the Authority values law (borders, open lanes), the Cooperative trade and peace, the
Wake tolls and profit; the twilight folk distrust and remember, the cloud drifters trade with all.
Headless games check that every power ends 100 turns with at least one treaty, that attitudes
move for reasons, and that no AI accepts what its attitude refuses.

## 14. Increments

| # | Increment | What |
| --- | --- | --- |
| 33 | **The shell** | the census to 33 ly (D-51), the map and its budgets at about 340 systems, the dark shell |
| 34 | **Contact** | contact stages, translation, the Envoy, Xenology's new technologies |
| 35 | **Memory** | attitudes with reasons, the diplomacy screen on phone and desktop |
| 36 | **Treaties** | open lanes, shared research, offers and answers, the AI dealing |
| 37 | **Borders and trade** | claims on the map, contested systems, border and trade treaties, resource exchanges, the Wake's dealings |
| 38 | **The twilight folk** | the first species: data, home, AI, art, playable later |
| 39 | **The cloud drifters** | the second species |
| 40 | **The proof** | headless games with five powers, 100-turn journeys, the owner's try |

## 15. Tests and budgets

Unit tests for every rule (contact, memory, each treaty, claims, trade, the species' rules), the
headless games with five powers and the save's migrations; browser journeys for contact, a treaty
offered and accepted, borders on the map and the diplomacy screen on the phone, tablet and
desktop; the map's budgets at 340 systems on a phone.

## 16. Art and its cost (D-57)

Each species is seen wherever humans are: its colonies in the colony view, its faces, its home.

| For | Pictures | Candidates (×2) |
| --- | --- | --- |
| Each species' buildings in its own architecture (homes in three sizes, hall, rig, works, labs, market, mine, shipyard, lane station and the projects it builds) | about 24 each, 48 | 96 |
| Each species' landscapes where no human world looks like theirs | 2 each, 4 | 8 |
| Each species' envoy and leader faces, and a codex picture | 3 each, 6 | 12 |
| The Envoy advisor of each human power | 3 | 6 |
| First-contact and treaty pictures for the report | 4 | 8 |
| **In all** | **about 65** | **about 130, about $6.50** |

About $10.55 of D-27's $35 is left. M3 fits, but leaves little for M4's ships and battles. **I ask
the owner to raise D-27 to $50** (D-57), so M3 can be made with re-rolls where pictures miss and
M4 starts with room.

## 17. Decisions for the owner

Answer *as recommended* to take every recommendation, or name what to change.

| ID | Question | Options | Recommendation |
| --- | --- | --- | --- |
| **D-12** | The first alien species (§5) | A the twilight folk and the cloud drifters · B one · C three · D another pair | **A** |
| **D-51** | The map out to 33 ly (§4) | A extend the census now · B stay at 27 ly · C 30 ly | **A**, with leave to run the sky fetch on GitHub's runners |
| **D-52** | First contact (§6) | A a process · B talk at once | **A** |
| **D-53** | Treaties (§8) | A without war · B the full set, war in name | **A** |
| **D-54** | Borders (§9) | A claims round holdings · B none until M4 | **A** |
| **D-55** | Memory and attitude (§7) | A remembered acts with reasons · B one number | **A** |
| **D-56** | The Wake's dealings (§11) | A in M3 · B later | **A** |
| **D-57** | Art for M3 (§16) | raise D-27 to $50 · keep $35 | **raise to $50** |

## 18. Increment 33 in detail: the shell (written before building it)

**Goals.** D-51 as decided (A): every real system out to 33 light-years is in the game, each value
with its source, as the 207 of the census are. The shell between about 27 and 33 ly starts dark
and laneless, reached by survey ships' blind jumps and new lanes. The map, the codex and the
budgets hold at the larger size, on a phone too. Games saved before go on as they were.

**Out of scope.** The aliens' homes in the shell (increments 38 and 39). Old lanes in the shell:
there were none. Starman Reborn itself: its game and its repository are not changed; the fetch
runs on a copy. A 40 ly map (D-02). Flare stars in the shell (below).

### 18.1 The census out to 33 ly

- **Fetched with Reborn's own pipeline** (D-02, D-10) on a copy of Reborn at the commit the census
  came from, with its limits lowered: SIMBAD and Hipparcos to a parallax of at least **99 mas**
  (about 32.9 ly; 120 mas, about 27.2 ly, before), the NASA Exoplanet Archive to 10.2 pc and the
  Extrasolar Planets Encyclopaedia to 10.3 pc. Then Reborn's processing and dataset build as
  always: stars grouped into systems by SIMBAD's multiple-star links and by being close on the sky
  at the same distance; Gaia DR3 astrometry where it passes Reborn's quality cuts, SIMBAD's
  otherwise, each cited.
- `scripts/data/prepare-shell.ts` makes the copy and lists every change made in it;
  **`npm run data:shell -- --from <copy>`** (`scripts/data/import-shell.ts`) writes
  **`src/data/shell.json`**: every system the copy holds that the census lacks, with its stars,
  planets and belts in sky.json's form, nearest first, each marked `shell`, with the day the
  archives were asked and the changes. A system sharing a star with the census is left out and
  listed with its reason.
- **`sky.json` is unchanged:** its 207 systems from the snapshot of 30 September 2026 and its 271
  lanes. Every world, anomaly and observation is seeded system by system, so the census's are
  exactly as before, and a saved game loads and plays on.
- `SKY` joins the two, the census first. The codex says where each part came from.

### 18.2 The shell in play

- **No old lane reaches it** (fiction): the network the Lapse left never ran past the census. The
  system panel says so: "No lane ran here before the Lapse: it lies beyond the old network."
- It is reached as any star off the lanes: a survey ship's **blind jump** (6 ly, more with
  research), then a **new lane** from a held system within reach (6 ly and 2 more for each Lane
  engineering). Colony and outpost ships follow the lanes. No new rule.
- Its worlds are made as any star's, from its real type and the game's seed (D-03); anomalies and
  observations are found there as anywhere. The rivals explore and settle it by the same rules.
- **Flare stars:** the census marks the ten Reborn chose; the shell marks none for now, though
  some of its red dwarfs flare in reality (AU Microscopii, AP Columbae). Choosing them is left for
  when flares matter more (a choice made without waiting).

### 18.3 On the screen

- The map draws every system; the shell's are stars like the rest, with no lanes, and the camera
  can centre any of them (its limit 36 ly from Sol, 30 before). Labels are placed by priority, as
  now, so the phone's map stays readable.
- The title: "356 real star systems, free to explore"; the codex: "every system within 33
  light-years of the Sun"; the map's help: "… and the old lanes between the nearer ones".

### 18.4 Numbers and budgets

About 340 systems (D-02). The first load to the map stays under its 900 KB; a turn after 50 turns
under 200 ms and a save after 50 turns under 200 KB (M1_PROOF.md §4); M2b's targets at turn 100
(`npm run balance`) still met.

### 18.5 State

No change: the world is the data, not the save (state version 11).

### 18.6 Tests

`sky.test.ts` (the census as it was; the shell's count, distances, sources, the one left out, no
lane into it), `world.test.ts` (inside 27 and 33 ly; no catalogue lane in the shell),
`planets.test.ts` (the census's 716 bodies of seed 1 pinned to their old fingerprint, the shell's
pinned too), `shell.test.ts` (a blind jump into the shell and its survey; a new lane to it, never
relit; a game saved on the census alone loads with the same worlds and plays on), the counts in
`discoveries`, `anomalies`, `mapModel` and `ui` tests; `data.spec.ts` (356 systems; Chara,
laneless) on the phone, tablet and desktop.


### Increment 33: the shell (22 October 2026)

- **The archives were asked on 22 October 2026 from this container**, which can reach them now, so
  GitHub's runners (D-51's leave) were not needed; `prepare-shell.ts` and the commands in its
  header do the same anywhere that reaches the archives.
- **149 systems** join the census's 207: **356** in all. They hold 170 stars, from 27.2 to 32.9 ly:
  101 red dwarfs, 12 orange, 7 yellow and 4 yellow-white stars, 8 white dwarfs, 32 brown dwarfs
  (in 28 systems) and 6 whose type no catalogue gives; 21 of the systems are pairs. Among them are Chara, 61 Virginis with its three planets, Zeta
  Tucanae, Chi¹ Orionis and AU Microscopii with its four planets and its debris disc. **37
  planets** (33 confirmed, 4 contested and kept) and **1 belt**. 104 stars' positions come from
  Gaia DR3 and the rest from SIMBAD, each with its source.
- **One left out:** Mu Herculis. Mu¹ Herculis (GJ 695 A), 27.20 ly away, just past the census's
  120 mas, belongs with the census's Mu² Herculis, which saved games know as it is; joining it is
  left for a later import.
- **Two archive answers needed care**, listed in `shell.json`: the Encyclopaedia wrote one value as
  `Infinity`, which is not JSON (read as no value); and a batch of 300 Gaia identifiers timed out.
  Three of them had been read with the "3" of "DR3" kept (20 digits, more than any Gaia source
  has): Proxima Centauri's, Barnard's Star's and Epsilon Eridani's, all in the census. The batch
  was asked again without them; `prepare-shell.ts` mends the reading. **Reborn's own fetch has the
  same slip** (its snapshot of 30 September took 17 minutes on that batch): worth mending there.
- `scripts/data/rebornSky.ts` now holds the reading of Reborn's sky that both imports share;
  `npm run data:import` still writes a byte-identical `sky.json`.
- **As §18.2 and §18.3**, with one more line on the map's help. The camera's limit is 36 ly.
- **Numbers:** the first load to the map 358 KB of 900 KB (331 KB before); `npm run balance` at turn
  100 on its eight seeds: the Authority 37.1 technologies (35 to 39), the Cooperative 21.6 (19 to
  24), the Wake 22.0 (20 to 24), so M2b's targets still hold; the slowest headless turn 136 ms (128
  before), the largest save at turn 100 40.6 KB. A turn's median, measured alone, went from 26 ms to
  31 ms.
- **Tests:** as §18.6; 432 unit tests.

## 19. Increment 34 in detail: contact (written before building it)

**Goals.** D-52 as decided (A): contact is a process, kept in the state. With every other power a
power is *unaware*, then hears a **signal**, then has **words** while it learns their tongue, then
can **talk**. Powers of one species share a tongue and go from the signal to talk at once.
Contact takes the place of M2b's *met* wherever it counted. The **Envoy**, a seventh advisor for
each power, speaks for its dealings with the others. Xenology's **Translation** speeds the words.
No rule assumes a power is human: contact reads each power's species.

**Out of scope.** Attitudes and the diplomacy screen (increment 35); offers, treaties and offers
misread before talk (36); trade, borders and Xenology's trade protocols and cultural exchange (36,
37); the alien powers themselves (38, 39). Until they come every power is human, so in play
contact goes from the signal to talk; the words are tested with a species made for the tests.

### 19.1 Contact

- A power **hears a signal** from another the first turn it sees anything of theirs: a colony or
  outpost in a system it has surveyed, a lane with an end in one, a ship in a system it watches
  (M2's Watch, §26.3), or a great work, which every power sees (M2B_SCIENCE.md §20.2).
- **Of one species: talk** at once. **Of another: words**, with translation at 0 of **20**.
- Each turn in words, translation grows by **1 if it sees anything of theirs** that turn, and by
  **1 more with Translation**, seen or not (its scholars study what was recorded). At 20: talk.
  So about 20 turns of sight without Translation, 10 with it, or 20 out of sight.
- Contact is never lost, and each side has its own: one power may hear another before it is heard.
- The numbers are in `RULES.contact`.

### 19.2 What contact changes

- **M2b's *met*** (M2B_SCIENCE.md §19.2) becomes *in contact*: a signal or more. Spreading
  knowledge, the Watch's rumours and the score as seen count the powers in contact; a ship seen
  now counts too, where M2b counted only colonies, outposts and lanes.
- **The standings** list every power in contact, whether or not anything of theirs is in sight
  this turn, with a *Contact* column: *talk*, or *words 12 of 20*.
- **The report** says when contact changes, in the Envoy's words: a first contact (with the
  power, where it was seen and whether we can talk), and talk reached after words.

### 19.3 The Envoy

A seventh department, **the Envoy**, one advisor for each power, with a name in its tradition,
a voice and a face (3 portraits): Isabel Achterberg, Envoy of the Authority (formal); Kofi Mensah,
of the Welcome table (warm); Hush, who does the talking (blunt). They speak on contact, and from
increment 35 on attitudes and offers. All fiction.

### 19.4 Translation

**Translation** (Xenology, tier 2, 60): translation grows 1 more a turn, seen or not. Its
inspiration: *contact with two other powers*. The tree has 62 technologies, 59 for any one power.
The rivals research it only while words are under way with someone, as it does nothing else.

### 19.5 State

`PowerState.contacts`, one for each power heard, in the order heard: its faction, its stage
(`words` or `talk`), the turn first heard and the translation so far. **State version 12**; a save
from before gains the contacts M2b's *met* gives it, at talk from its current turn.

### 19.6 Art and its cost

The three Envoys' faces: 6 candidates, about **$0.30**, a lettered sheet to the owner.

### 19.7 Tests

`contact.test.ts`: the signal from a colony, a lane, a ship and a great work; talk at once between
humans; words with a species made for the test, 1 a turn in sight, 1 more with Translation, talk
at 20; contact kept and one-sided; spreading knowledge and rumours from contact; the standings'
column; the migration from version 11; the rivals and Translation. `contact.spec.ts`: a Wake ship
reaches Sol, and the Envoy reports first contact and the standings show *talk*, on the phone,
tablet and desktop.


### Increment 34: contact (22 October 2026)

- **Contact as §19.1** (`src/sim/contact.ts`, step 10b of the turn): a signal from a colony,
  outpost or lane where the power has surveyed, a ship where it watches, or a great work; talk at
  once between powers of one species, words otherwise, 1 a turn in sight and 1 more with
  Translation, talk at 20 (`RULES.contact`). `contactWith` and `inContact` (in `state.ts`) take the
  place of M2b's `hasMet` for spreading knowledge, rumours and the score as seen.
- **The report** says *First contact: the Hollow Wake, seen at Sol. They share our tongue, so we
  can talk.* (or that the Envoy has begun to learn their tongue), and later that the Envoy can
  talk with them; **the Envoy** speaks it in the power's voice.
- **The Envoy:** Isabel Achterberg (the Authority), **Rafael Quispe** (the Cooperative; Kofi Mensah
  in the design, renamed as the Cooperative's Survey advisor is Ghanaian already) and Hush (the
  Wake), with their faces (6 candidates, about $0.30; $24.75 of $50 spent in all). The codex lists
  seven advisors for each power.
- **The standings** show the contact **under each power's name** (*we can talk*, or *learning their
  tongue: 12 of 20*) rather than in a column of its own, so the phone's table keeps its width.
- **Translation** as §19.4; the rivals put it last until they learn a tongue. The tree has 62
  technologies, 59 for any one power.
- **State version 12**, with the migration of §19.5.
- **Numbers:** `npm run balance` at turn 100 on its eight seeds: the Authority 37.6 technologies (35
  to 40), the Cooperative 22.6 (20 to 25), the Wake 22.0 (20 to 24), within M2b's targets; the
  Cooperative learns a little faster, as a ship seen now counts for spreading knowledge. The
  contact step takes under 1 ms a turn; the slowest headless turn 115 ms.
- **Tests:** `contact.test.ts` as §19.7, the doctrines', great works' and research tests moved from
  *met* to contact; 442 unit tests; `contact.spec.ts` on the phone, tablet and desktop.

## 20. Increment 35 in detail: memory and the diplomacy screen (written before building it)

**Goals.** D-55 as decided (A): every power holds an **attitude** to each power it is in contact
with, from −100 to +100: the sum of what it remembers and what it is, each part with its reason.
A screen of its own, **Diplomacy**, the Envoy's, shows how each power regards you and why, on a
phone and a desktop, and lets you send the first thing one power can do for another: a **gift**.
The rules are the same for every power; nothing assumes the player is human.

**Out of scope.** Offers, treaties and what attitude makes a power accept or refuse (increment
36); claims, trade and the Wake's dealings (37). The rivals send gifts from increment 36, when they
deal; until then their attitudes are kept but act on nothing.

### 20.1 Attitude

A power's attitude to another is the sum of these parts, held between −100 and +100:

| Part | Amount | Fades |
| --- | --- | --- |
| **Kin:** of one species | +10 | never |
| **Known:** for each 10 turns since first contact | +1, at most +10 | never |
| **Character** (the power's own view of the other's ways, fiction) | the Authority of the Wake −15; the Cooperative of the Wake −5; the Wake of the Authority −10 | never |
| **A gift** received | 1 for every 5 credits | 1 point every 4 turns |
| **A great work lost** to them (they finished one it was building) | −15 | 1 point every 4 turns |
| **Settled beside** it (a colony or outpost founded in a system where it holds one) | −5 | 1 point every 4 turns |

The last three are **memories**, kept in the state with their reason, their amount now and when
they began; each fades one point towards nothing every 4 turns, and is forgotten at nothing. The
first three are worked out from the state when needed. The numbers are in `RULES.memory`.

The attitude is named in words: **hostile** (−40 or less), **cold** (−39 to −10), **neutral** (−9 to
+9), **warm** (+10 to +39), **friendly** (+40 or more).

### 20.2 A gift

- **Order `gift`:** credits from the treasury to a power you can talk with: 20, 50 or 100, at most
  one gift to each power a turn, and never into debt. The credits arrive as the turn ends; the
  receiver remembers the gift (1 for every 5 credits: +4, +10 or +20).
- The report: *The Envoy took our gift of 50 credits to the Hollow Wake.* The receiver's: *The
  Transit Authority sent us a gift of 50 credits.*

### 20.3 The diplomacy screen

- Opened from the bar (*Diplomacy*, beside *Empire*) and, on a desktop, with **Y**.
- **Every power you are in contact with:** its mark and name, your contact (*we can talk*, or
  *learning their tongue: 12 of 20*), and **its regard for you**: the word and the number.
- **The chosen power:** its regard with every reason, in plain words from its side ("Remembers our
  gift of 50 credits: +9"; "Of our own kind: +10"; "Holds us for raiders: −15"), and what you can do
  (a gift; treaties from increment 36). The Envoy's face and name head it.
- **A phone:** a card for each power, and a sheet for the chosen one. **A desktop:** the list of
  powers with the chosen one beside it.
- Powers not heard yet: "Not yet heard: …". With no other power in play, the bar has no
  *Diplomacy*.

### 20.4 State

`PowerState.memories`: each with the power remembered, its kind, its amount now and the turn it
began. **State version 13**; a save from before remembers nothing yet.

### 20.5 Tests

`memory.test.ts`: each part of an attitude and its reason; memories fading one point every 4 turns
and forgotten at nothing; the words; a gift (its refusals: not in talk, into debt, twice in a turn;
paid and remembered as the turn ends; reported to both); a great work lost and a colony beside,
remembered; attitude held to ±100; the migration from version 12. `diplomacy.spec.ts`: a gift sent
from the diplomacy screen and the regard rising with its reason, on the phone, tablet and desktop.

### Increment 35: memory and the diplomacy screen (22 October 2026)

- **Attitude as §20.1** (`src/sim/memory.ts`): `attitudeOf` sums kin, how long known, character
  (`FACTIONS[…].regard`, fiction) and memories (`PowerState.memories`), each part with its reason
  as the regarded power reads it; `fadeMemories` takes a point off each every 4 turns (step 12b of
  the turn); a colony or outpost founded beside one is remembered as it is founded, and a great work
  lost as the race is lost.
- **Gifts as §20.2:** the order `gift` (0 takes one back), paid when given, delivered and remembered
  in step 7b; the report and the Envoy say so to both powers.
- **The diplomacy screen** (`src/ui/map/diplomacy.tsx`) as §20.3: the Envoy at its head, a card
  for each power in contact with its contact and its regard, and the chosen one with every reason
  and the gifts; on a desktop the list with the chosen one beside it, opened with **Y** or the
  *Diplomacy* chip; on a phone and a tablet the chosen card opens beneath itself, and the screen
  opens from the **menu** and the **Powers tab** (the dock keeps its four buttons). Its icon is
  two rings that meet.
- **State version 13**, as §20.4.
- **Tests:** `memory.test.ts` as §20.5; `diplomacy.spec.ts` on the phone, tablet and desktop.
