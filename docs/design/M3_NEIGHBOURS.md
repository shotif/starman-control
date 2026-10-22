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
21. [Increment 36 in detail: treaties](#21-increment-36-in-detail-treaties-written-before-building-it)
22. [Increment 37 in detail: borders and trade](#22-increment-37-in-detail-borders-and-trade-written-before-building-it)
23. [Increment 37b in detail: exchanges and the Wake's dealings](#23-increment-37b-in-detail-exchanges-and-the-wakes-dealings-written-before-building-it)
24. [Increment 38 in detail: the Duskfolk](#24-increment-38-in-detail-the-duskfolk-written-before-building-it)
25. [Increment 39 in detail: the Drifters](#25-increment-39-in-detail-the-drifters-written-before-building-it)
26. [Increment 40 in detail: the proof](#26-increment-40-in-detail-the-proof-written-before-building-it)

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

## 21. Increment 36 in detail: treaties (written before building it)

**Goals.** D-53 as decided (A), its first two treaties: **open lanes** and **shared research**,
each **offered**, **accepted or refused**, and **ended with notice** or **broken**, by the player
and the rivals through the same orders. What a power accepts and offers follows its attitude
(§20) and its character, so memory starts to matter; breaking a treaty is remembered. The rivals
deal: they offer, answer, and send gifts to win a treaty they want.

**Out of scope.** Trade agreements, borders and the Wake's tolls, bribes and protection (increment
37). Non-aggression, alliance and war (M4).

### 21.1 The treaties

| Treaty | What it does |
| --- | --- |
| **Open lanes** | Each power's ships may use the other's open lanes (D-37 closed them until now). Food and survey stations still follow a power's own lanes. |
| **Shared research** | A technology the other knows costs **25% less** (in place of the 15% that contact gives), and the most knowledge can take off is **50%** (30% from contact alone). |

A treaty is between two powers that can **talk**; one of each kind between them at most. While it
holds, each counts it in its attitude to the other: **+5 for each treaty** (*Bound to us by open
lanes*).

### 21.2 Offers and answers

- **Order `offer`:** a treaty to a power you are in contact with, one offer of each kind to each
  power a turn. It reaches them as the turn ends.
- **A rival answers** as the turn ends: yes if its attitude to you reaches what its character asks
  for that treaty (§21.4), no otherwise.
- **The player answers** an offer during the next turn, in the diplomacy screen and in *what needs
  you*: accept or refuse (order `answer-offer`). One left unanswered is refused as that turn ends.
- **Accepted:** the treaty holds from the next turn. **Refused:** nothing more (the offerer is told).
- **Before talk** (at *words*, with a power of another tongue) an offer may be **misread**: it fails
  with a chance of 1 in 20 for each word still to learn, and the receiver remembers it (−5, *Misread
  our offer*). A deterministic draw, from the game's seed.

### 21.3 Ending and breaking

- **End with notice** (order `end-treaty`): it holds 5 more turns, then ends; the other remembers
  it (−5, *Ended our treaty*).
- **Break it now** (order `break-treaty`): it ends as the turn ends; the other remembers it (−20,
  *Broke our open lanes treaty*), and so does every other power in contact with the breaker (−5,
  *Broke a treaty with the Frontier Co-op*).
- Ships of the other power on your lanes when open lanes end finish the hop they are on and stop.

### 21.4 The rivals deal

Each rival's character asks for an attitude before it accepts or offers a treaty:

| | Open lanes | Shared research |
| --- | --- | --- |
| The Authority (law) | warm (10) | friendly (40) |
| The Cooperative (trade and peace) | warm (10) | warm (10) |
| The Wake (tolls and profit) | never (it sells passage, increment 37) | warm (25) |

- **Offers:** every 5 turns a rival offers each power it can talk with the treaties its character
  wants whose level that power's attitude to it has reached (as far as it knows: the same reasons
  the diplomacy screen shows).
- **Gifts:** a rival with more than 200 credits sends 50 credits, at most once in 10 turns, to a
  power whose attitude is within 10 of a treaty the rival wants.
- **Breaking:** a rival ends a treaty with notice when its attitude to the other falls below 0, and
  never breaks one.

### 21.5 On the screen

- **The diplomacy screen:** under the chosen power, *Treaties*: those in force (with *End with
  notice* and *Break it now*, each saying what it costs), offers waiting for your answer (*Accept*,
  *Refuse*), your offers on their way, and the treaties you can offer, each with what it does and
  how the other is likely to answer ("their regard is warm: likely yes").
- **What needs you:** an offer waiting for your answer.
- **The report:** offers made and answered, treaties begun, ended and broken, in the Envoy's words.
- **The map:** a power's lanes open to you are drawn as yours to use (a lighter line in its colour).

### 21.6 State

`GameState.treaties` (kind, the two powers, the turn it began, the turn it ends if notice is
given) and `GameState.offers` (kind, from, to, the turn made). **State version 14**; a save from
before has none.

### 21.7 Tests

`treaties.test.ts`: offers, answers, misreading; open lanes in routes (and not in food or survey
stations); shared research's costs; ending with notice and breaking, and what is remembered; the
rivals' offers, answers, gifts and endings by character and attitude; the migration. Headless
games with three rivals: every power holds at least one treaty by turn 100, and no rival accepts
below its level. `treaties.spec.ts`: an offer of open lanes accepted by the Cooperative, a ship
routed over its lanes, and the treaty ended with notice, on the phone, tablet and desktop.

### Increment 36: treaties (22 October 2026)

- **Open lanes and shared research as §21.1** (`src/content/treaties.ts`, `src/sim/treaties.ts`):
  ships route over a partner's open lanes (`lanesFor(…, passage)`), while food networks and survey
  stations keep to a power's own; shared research takes 25% off for each partner that knows a
  technology, at most 50% in all; each treaty in force counts +5 in each side's regard.
- **Offers and answers as §21.2**, with two readings made while building: a treaty needs each
  power **in contact** with the other rather than at talk (so an offer before talk that is not
  misread can still be accepted), and an offer from a power not yet heard is **a signal of its own**
  (`hear`, shared with the contact step). Offers resolve in step 10c of the turn.
- **Ending and breaking as §21.3**, remembered as the order is given.
- **The rivals deal as §21.4** (`dealings` in `src/sim/ai.ts`), with two numbers **tuned** with the
  headless games so that every power agrees a treaty within 100 turns: the Wake asks **10** for
  shared research (25 in the design), and a rival sends a gift when it has more than **150** credits
  (200). As the Wake is the one rival with credits to spare, it buys its way into shared research
  with the Cooperative, while the Authority and the Wake keep apart.
- **On the screen as §21.5**: the diplomacy screen's *Treaties* (in force, with *End with notice*
  and *Break it now*; offers to answer; ours on their way; what can be offered and how it is likely
  to be answered); an offer waiting in *what needs you*; the report and the Envoy. The map does not
  yet draw a partner's lanes differently (they show in its colour, as before).
- **State version 14**, as §21.6.
- **Numbers:** `npm run balance` at turn 100 on its eight seeds: the Authority 37.6 technologies
  (36 to 40), the Cooperative 23.1 (20 to **26**), the Wake 22.0 (20 to 24). On seed 4 the
  Cooperative ends one over M2b's 25: its open lanes with the Authority from turn 35 lift both by
  a technology. Dealing is meant to help those who deal, so it is left so, for the owner to judge.
- **Faster turns:** the rivals build their lane graph once a turn rather than for every route they
  test, and each power's technology effects are kept by kind while its research only grows. Games
  play out exactly as before; a turn's median fell from about 35 ms to about 20 ms, and the slowest
  headless turn is 125 ms.
- **Tests:** `treaties.test.ts` as §21.7; 465 unit tests; `treaties.spec.ts` on the phone, tablet
  and desktop (a ship routed over a partner's lanes is tested in the unit tests).

## 22. Increment 37 in detail: borders and trade (written before building it)

**Goals.** D-54 as decided (A) and §10: every power **claims** the systems round its holdings, drawn
on the map; a system claimed by two is **contested**; settling in another's claim is allowed but
remembered; a **border treaty** settles the contested systems between two powers, and a **trade
agreement** brings both credits every turn. The same orders for the player and the rivals.

**Out of scope.** One-off exchanges of resources and the Hollow Wake's tolls, bribes and protection
(increment 37b, next). War over borders (M4).

### 22.1 Claims

- A **colony** claims its own system and every system **one lane away** along the old lanes and any
  lane built since (open, being tuned or dark); an **outpost** claims its own system only.
- A system where a power holds a colony or outpost is **its own**, and stays so; a system claimed
  by two or more powers, held by none or by more than one, is **contested**.
- Claims are worked out from the holdings and lanes, never stored, so they follow every new colony.
- A claim gives nothing of its own (D-54).

### 22.2 Settling in another's claim

Founding a colony or outpost in a system another power claims, but does not hold, is allowed and
remembered by that power (−3, *Settled in our claim at Ross 128*), as settling beside it already is
(−5, §20.1). Neither is remembered of a power with a border treaty, which cannot do it at all.

### 22.3 The border treaty

- **Border** (a third treaty, offered and answered as §21): every system contested between the two
  goes to one of them, for as long as it holds: to the one holding something there; else to the one
  whose nearest colony is nearer; at an equal distance, to the one first in the list of powers.
- While it holds, neither may found a colony or outpost in a system the other claims (refused: *the
  Frontier Co-op's by our border treaty*), and the systems it settled are not contested between them.
- The Authority asks a regard of 10 for it (law), the Cooperative 10, the Wake 20.

### 22.4 The trade agreement

- **Trade** (a fourth treaty): each side gains credits every turn, **1 for every 4 colonies of the
  smaller side** (at least 1), **and 1 for each open lane that joins a system of one to a system of
  the other**, at most **10**, from the turn after it is agreed, in the treasury line *Trade with
  the Frontier Co-op*.
- The Authority asks 10 for it, the Cooperative 0 (trade with anyone it can talk with), the Wake 15.

### 22.5 On the screen

- **The map:** each power's claimed systems carry its field, fainter than a held system's; a
  contested system shows both colours and the word *contested* in its card and panel.
- **The system panel:** *Claimed by the Transit Authority* or *Contested: the Transit Authority and
  the Frontier Co-op*, and *Settled by our border treaty* where one holds.
- **The diplomacy screen:** the two new treaties with what they do, and for trade what it would
  bring now.
- **The treasury:** trade as a line of its own.

### 22.6 State

No new state: claims are worked out, and the two treaties are new kinds of treaty. **Version 14**
still; a save from before reads as it is.

### 22.7 Tests

`borders.test.ts`: claims from colonies and outposts along any lane; own and contested systems;
settling in a claim remembered; the border treaty's share of contested systems, its refusal to
settle, and its end; trade's credits from colonies and lanes, at most 10; the rivals' offers of
both. `borders.spec.ts`: a contested system's panel, a border treaty agreed, and the trade line in
the treasury, on the phone, tablet and desktop.

### Increment 37: borders and trade (22 October 2026)

- **Claims as §22.1** (`src/sim/borders.ts`): `claimOf` and `claimsOf`, worked out from the holdings
  and lanes; a colony's claim reaches along the old lanes and any lane built since.
- **Settling in a claim** is remembered as §22.2 (`claim-crossed`, −3), and refused across a border
  treaty (*Barnard's Star is the Transit Authority's by our border treaty*).
- **The border treaty and the trade agreement** as §22.3 and §22.4: two more kinds of treaty, so
  they are offered, answered, ended and broken as §21; trade is paid before upkeep, and shows in the
  treasury as *trade with the Frontier Co-op*.
- **Treaties in sentences:** each treaty now has its words (*a border treaty*, *open lanes*) and its
  noun (*our trade agreement*), so the report, the Envoy and the reasons read as English.
- **On the screen as §22.5**: a fainter field for each claimed system, one in each claimant's
  colour where contested (also at a home lane's end); the system panel's *Claimed by*, *by a border
  treaty* or *Contested*; the diplomacy screen says what trade would bring now.
- **Numbers:** `npm run balance` at turn 100 as in increment 36 (the Authority 37.5, the Cooperative
  23.1, the Wake 22.0 technologies; the Cooperative 26 on seed 4); one rival was a turn in debt once.
  The slowest headless turn 127 ms.
- **Tests:** `borders.test.ts` as §22.7; 471 unit tests; `borders.spec.ts` on the phone, tablet and
  desktop.

## 23. Increment 37b in detail: exchanges and the Wake's dealings (written before building it)

**Goals.** The rest of §10 and D-56 as decided (A): powers **exchange resources** once, by offer
and answer; the Hollow Wake **sells passage** over its lanes for a toll instead of opening them,
**takes bribes** and **sells protection**; the lawful powers remember dealing with it. Through the
same offers and orders as §21, for the player and the rivals; nothing is the Wake's alone in the
rules: any power whose character sells passage or protection may.

**Out of scope.** What protection protects against: raids come with M4, so in M3 it is paid and
remembered and does nothing else. Markets between powers (prices that move).

### 23.1 Exchanges

- **An exchange** is a one-off offer: so much of one of credits, metals, volatiles or fusion fuel
  for so much of another, in steps of 10, at most 100 of each. Offered, it reaches the other as the
  turn ends; a rival answers at once, the player in the next turn (§21.2). Accepted, both amounts
  change hands at once, if both still have them; if not, it falls through and both are told.
- **A rival values** a credit at 1 and a unit of metals, volatiles or fuel at 2, and **twice that**
  for a resource it holds less than 20 of. It accepts when what it gets is worth at least what it
  gives, by the measure of its regard: friendly 80%, warm or neutral 100%, cold 130%, hostile never.
- **A rival offers** one exchange every 5 turns when it holds less than 20 of a resource and more
  than 100 credits: 40 credits for 20 of it, to a power it can talk with that regards it at least
  neutrally.

### 23.2 Passage for a toll

- **Passage** (a treaty sold, not shared): the buyer's ships may use the seller's open lanes; not
  the other way. The buyer pays a **toll** each turn from the turn after it is agreed, as trade is
  paid: 1 credit for each of the seller's open lanes, at least 2 and at most 8. A buyer that cannot
  pay the toll loses passage as that turn ends; neither side remembers it.
- Only a power whose character **sells passage** sells it (the Wake); one that does never opens
  its lanes freely (§21.4).

### 23.3 Bribes

The Wake **takes bribes**: it remembers a gift at 1 for every **3** credits, not 5 (a power's
character may say so).

### 23.4 Protection

- **Protection** (a treaty sold): the buyer pays **5 credits** a turn; from M4 the seller's ships
  leave the buyer's systems alone. In M3 it is paid, and counts as any treaty in regard (+5).
- Only a power whose character **sells protection** sells it (the Wake).

### 23.5 The lawful remember

A power whose character is **lawful** (the Authority and the Cooperative; not the Wake) counts **−5**
in its regard for each power it is in contact with that **buys passage or protection** from an
outlaw (*Deals with the Hollow Wake*), while it lasts.

### 23.6 What each asks

| | Passage (to buy) | Protection (to buy) |
| --- | --- | --- |
| The Authority | regard 0 | never (the law does not pay outlaws) |
| The Cooperative | regard −10 | regard 0 |

The Wake sells to any power it can talk with that regards it at −10 or more, and offers both every
5 turns to those that can afford a few turns of each (50 credits).

### 23.7 On the screen

- **The diplomacy screen:** *An exchange*: what to give and what to ask for, each an amount and a
  resource, and *Offer it* (with how the other is likely to answer); an exchange waiting, with
  *Accept* and *Refuse*. Passage and protection among the treaties only where one side sells them,
  with their price a turn; *Sell it* for the seller and *Buy it* for the buyer, in place of
  *Offer it*.
- **The treasury:** *toll to the Hollow Wake*, *protection paid to the Hollow Wake*, and for the
  seller *tolls from …*.
- **The report:** exchanges made and fallen through; passage lost for want of the toll.

### 23.8 State

`Offer` gains an exchange's terms; a treaty records which side pays for passage and protection.
**State version 15**; a save from before has neither.

### 23.9 Tests

`dealings.test.ts`: exchanges (offer, value and regard, falling through, the rivals' offers);
passage (one way, the toll, lost when unpaid); bribes; protection; the lawful's regard; the rivals'
offers and answers; the migration. `dealings.spec.ts`: an exchange accepted and passage bought from
the Wake, on the phone, tablet and desktop.

### Increment 37b: exchanges and the Wake's dealings (22 October 2026)

- **Exchanges as §23.1** (`src/sim/treaties.ts`): an offer of kind *exchange* carries what is given
  and what is asked for; a rival answers as the turn ends by `wouldExchange`, the player in the
  next turn, and the player's yes changes hands at once (refused if either side no longer has its
  part, which the screen says beside *Accept*). A rival's yes that finds a side short falls
  through, and both are told.
- **Passage and protection as §23.2 and §23.4**: two more kinds of treaty, sold by a power whose
  character sells them (`sells` in `src/content/factions.ts`); a treaty records its `payer`. Each
  turn's price is paid with trade, before upkeep, from the turn after it is agreed; a buyer that
  cannot pay loses it then, reported as *lapsed*, with no memory on either side. Passage lets the
  buyer's ships use the seller's open lanes, one way only. The treasury shows *toll paid to the
  Hollow Wake* and, for the seller, *toll from the Transit Authority*.
- **Bribes, protection's regard and the lawful as §23.3 to §23.5**: a gift is remembered by the
  receiver's own measure (`giftCredits`: 3 for the Wake, 5 for the others); a sold treaty counts 5
  in regard as any treaty; a lawful power counts −5 (*Deals with the Hollow Wake*) for each power
  it knows that buys from an outlaw.
- **The rivals as §23.6:** the same `dealings` as increment 36, with each side's ask now through
  `wouldAccept`, so a seller offers only to a buyer that would take it and has **75 credits** in
  hand (50 in the design: at 50 the buyers ran down to debt and bought again as soon as they
  recovered; at 100 they seldom bought at all); the Wake sends a gift where passage nearly would do.
  A rival short of a resource offers 40 credits for 20 of it to the power that regards it best. A
  buyer gives notice on what it pays for when its treasury is under 40 and falling, and on any
  treaty only when its regard falls below 0 or 10 below what it asked (so the Cooperative, which
  buys passage at −10, does not leave it at −5).
- **On the screen as §23.7:** passage and protection appear among the treaties only where one side
  sells them, with their price a turn; *Buy it* for the buyer and *Sell it* for the seller; *An
  exchange* with two amounts and two resources and the likely answer; an exchange waiting with
  *Accept* and *Refuse*. The report words exchanges made, refused and fallen through, and lapsed
  passage; the Envoy speaks of an exchange waiting as of any offer.
- **State as §23.8:** version 15; a save from version 14 reads as it is. Validation checks that a
  sold treaty is paid by its buyer and a shared one by no one, and an exchange's terms.
- **Numbers:** `npm run balance` at turn 100: the Authority 37.6, the Cooperative 23.3, the Wake
  22.0 technologies; the Cooperative 26 on seeds 3 and 4. In the eight games the Authority buys
  passage from the Wake in every one, the Cooperative buys passage and protection in six, and
  exchanges are made in six; one rival was a turn in debt once. The slowest headless turn 136 ms.
- **Tests:** `dealings.test.ts` as §23.9 (19 tests, with 100 turns of three rivals); 490 unit tests;
  `dealings.spec.ts` on the phone, tablet and desktop.

## 24. Increment 38 in detail: the Duskfolk (written before building it)

**Goals.** The first alien species of D-12 as decided (A), the *twilight folk* of §5, and the power
it makes: as data, as humans are (D-08); its home a real red dwarf's world in the shell (§4, D-01,
D-02); a rival in every game with rivals, not yet one to play; its own tongue, so contact with it
goes through words (§19); habitability unlike humans'; a character as a rival and in its regard;
its envoy's and speaker's faces and a picture of its people. Nothing in the rules is the Duskfolk's alone: each rule
reads the species' or the power's data.

**Out of scope.** Playing the Duskfolk (later, D-08): their six other advisors' faces, their
buildings in the colony view and the twilight landscapes of their worlds wait until then, since no
screen shows a rival's colonies (§24.9).
Technologies of their own; their ships' looks (M4); the cloud drifters (increment 39); five-power
balance (40).

### 24.1 Names (fiction)

- **The Duskfolk**: the name humans give the species, for the dusk they live in; *a Duskfolk
  colony*. Their own name for themselves is a sound humans do not make.
- **The Dusk Concord** (*the Concord*): their power, governed by consensus. Amber (`#ffb347`), and
  a diamond beside the colour wherever it is shown.
- **Their names** are translations: the Envoy is *First Voice, who speaks to strangers*; their
  speaker *Still Water, speaker of the Concord*. Their seven advisors (for when they are played):
  Warm Stone (the Settled), Long Hands (the Builders), Full Store (the Stores), Quiet Eye (the
  Learned), Far Walker (the Wayfarers), Night Ear (the Watchers) and First Voice; a formal voice.

### 24.2 Their home (observed and fiction)

**GJ 433 d**, a real super-Earth of the red dwarf GJ 433 in Hydra, 29.6 ly from Sol, in the shell:
observed by radial velocity, likely tidally locked by its short orbit (the game's facts say which
are observed and which estimated). Five more systems lie within 5 ly of it (20 Crateris, WISE
1141−3326, SIPS 1141−3624, VB 5, WISE 1112−3857). It is 28 ly from Wolf 1061 and further from
Sol and Tau Ceti, so the Wake is the likeliest to meet the Concord first. The Duskfolk living there
are fiction, and the game labels them so.

### 24.3 The worlds they live on

Each condition costs what the species' data says, as humans' does (M1_PLANETS.md §5). A new
condition, **an open sky**: a world that is not tidally locked, with no ring of dusk to live in.

| | Humans | The Duskfolk |
| --- | --- | --- |
| Temperature | frozen 2, cold 1, temperate 0, warm 1, hot 2, scorching never | frozen 1, cold 0, temperate 0, warm 0, hot 1, scorching 2 |
| Atmosphere | none 2, thin 1, dense 0, toxic 2 | none 2, thin 0, dense 0, toxic 1 |
| Gravity | low 1, normal 0, high 2 | low 0, normal 0, high 1 |
| Water | none 1, ice 0, oceans 0 | none 1, ice 0, oceans 0 |
| Flares | 1 | 0 |
| An open sky | 0 | 2 |

The levels are humans' (comfortable 0, tolerable up to 2, harsh up to 6). So the red dwarfs'
locked worlds, harsh for humans, are tolerable or comfortable for the Duskfolk, and an Earth-like
open world only tolerable: the natural expanders of §5. GJ 433 d (cold, thin, normal gravity, ice,
locked) is comfortable for them.

### 24.4 Their home web, of their own lanes

D-19a gives every power a home web by one rule. Reborn's old lanes end at 27 ly, so a capital in
the shell has none to tend. **A power whose capital has no old lane grows its web the same way
over lanes of its own**: from the capital to systems up to 6 ly apart (a new lane's reach), within
two such links, nearest first, within the beacon slots, at most 7 systems. Its lanes are open and
its own from the start, like any home web's. The webs of old lanes are still trimmed to the
smallest of them; a web of a power's own lanes keeps what it reaches. The Concord's is 6 systems
and 5 lanes (GJ 433's capital anchors all five), one fewer than each human power's 7; so no
human start changes.

### 24.5 Their tongue

The Duskfolk share no tongue with humans, so contact goes signal, words, talk (§19.1): about 20
turns of sight to talk, 10 with Translation. Before talk, an offer may be misread (§21.2).

### 24.6 Their regard and treaties (fiction)

*Slow to trust, slow to forget* (§5):

- **Slow to forget:** their memories fade a point every **8** turns, not 4 (a power's
  `forgets`).
- **Slow to trust:** no kin with any human power; a gift is remembered at 1 for every **8**
  credits; they ask a regard of 20 for open lanes, 30 for shared research, 0 for a border (they
  like a clear line), 10 for trade, 10 to buy passage, and never buy protection. Lawful.
- **Their view of others' ways:** −5 for the Hollow Wake (*Takes what is not given*); humans think
  nothing of them for their ways until they know them.

### 24.7 As a rival

The same rules and orders as every rival (M2_WORLDS.md §26.2). Its character: the capital and its
colonies run to grow; it settles the **nearest** world it can; it researches life sciences and
construction; standard taxes; it builds lanes from its colonies too (it starts far from anyone's
lanes); a festival when its attention is full; the doctrines Open frontier, Lane network and Garden
worlds; and the Commons as its great work. Its trait, **Patient**: colonies grow 10% faster.

### 24.8 In the game

- A **faction can be played or not** (`playable`). The new game offers the three human powers
  only; the Concord plays as a rival in every game with rivals, so every new game has four powers.
- A game saved before keeps its three powers.
- The title's sky shows the capitals of the powers one can lead, as now.

### 24.9 On the screen

- **The map:** the Concord's colour and diamond wherever a power is shown (the standings, claims,
  lanes, holdings, the data page).
- **A world's panel** says how habitable it is for the player's species with its reasons, now
  with *an open sky* where it counts.
- **The diplomacy screen** shows each power's envoy beside its name (new for every power), so the
  Concord's First Voice is seen there.
- **The data page** lists the Concord with its home web, its speaker and a picture of the
  Duskfolk, labelled *Fiction*, and GJ 433 d's facts as for any world.
- **Not yet:** the Duskfolk's buildings in the colony view, their other advisors' faces, and the
  twilight landscapes of locked worlds (a sun fixed low, which the colony view's sky would have to
  paint too), all of which a player of the Concord would see first.

### 24.10 Pictures (D-57)

First Voice's and Still Water's faces, and the Duskfolk at home for the data page: **3 pictures, 6
candidates, about $0.30**, sent as lettered sheets. The Duskfolk are
described to the generator as an invented people (long-limbed, grey-violet skin with a fine
mineral sheen against flares, wide dark eyes for a dim red sun, layered woven shawls), never as
any existing people or any other work's aliens. Their buildings (about 24 pictures, about $2.40)
and two twilight landscapes (about $0.20) wait until they can be played.

### 24.11 State

The faction list gains `dusk-concord`, the species list `duskfolk`; a power in play is still just a
faction, so the state's shape is unchanged. **Version 15** still; a save from before reads as it is,
with its three powers.

### 24.12 Tests

`duskfolk.test.ts`: the Duskfolk's habitability (an open sky, flares, the red dwarfs' worlds);
the home web of their own lanes (6 systems, no human web changed); contact through words with
humans; memories that fade every 8 turns; gifts at 1 for every 8 credits; the Concord as a rival
for 100 turns with the game sound; the new game's four powers and its three playable factions.
`duskfolk.spec.ts`: the new game offers three powers; the Concord's diplomacy card with its envoy
and the words of its tongue; GJ 433 d's panel with its habitability reasons; on the phone, tablet
and desktop.

### Increment 38: the Duskfolk (22 October 2026)

- **The species and the power as §24.1 to §24.3** (`src/content/species.ts`, `src/content/factions.ts`):
  the Duskfolk with an *open sky* among habitability's conditions (2 for them, 0 for humans, in the
  world panel's reasons as *open sky +2*); the Dusk Concord at GJ 433 d, amber with a diamond on the
  map, the title's capitals (only those one can lead), the colony view's mark and the emblems.
- **Its home web as §24.4** (`src/sim/homeWeb.ts`): a capital with no old lane grows its web over
  links of up to 6 ly between systems with no old lane; the Concord starts with 6 systems and 5 lanes,
  and every human web is as before. The codex lists a power's own lanes beside Reborn's.
- **Its character as §24.6 and §24.7:** memories fade by each power's `forgets` (4, the Concord 8);
  gifts by each power's `giftCredits` (the Concord 8); its asks, its regard of the Wake, and its rival
  character. A faction is `playable` or not; a new game offers the three human powers, and says that
  the Concord plays as a rival.
- **On the screen as §24.9:** the diplomacy screen shows every power's envoy beside its regard; the
  codex shows the Concord's speaker, its envoy and its people with *Fiction*, and no advisors for a
  power one cannot lead.
- **Pictures as §24.10:** 10 candidates (the first two faces looked like grey-skinned humans, so they
  were re-rolled to match the people's picture): First Voice D, Still Water C, the Duskfolk at home A.
- **Numbers:** in the eight headless games, now played with four powers, the human powers' turn-100
  numbers are unchanged (the Authority 37.6, the Cooperative 23.3, the Wake 22.0 technologies); the
  Concord reaches 19.9 technologies, 13 colonies and the most people (99.9 million). It is first heard
  of by the Authority about turn 70 (from a great work), meets the Cooperative about turn 100 and
  the Wake about turn 150, not first as §24.2 guessed. The slowest headless turn 171 ms (136 ms with
  three powers), within M1's 200 ms.
- **Tests:** `duskfolk.test.ts` as §24.12; 500 unit tests; `duskfolk.spec.ts` on the phone, tablet and
  desktop; the codex's counts now include the Concord's web.

## 25. Increment 39 in detail: the Drifters (written before building it)

**Goals.** The second species of D-12 as decided (A), the *cloud drifters* of §5, and its power,
the same way as the Duskfolk (§24): as data, its home a real giant planet in the shell, a rival in
every game with rivals and not yet one to lead, its own tongue, habitability unlike anyone's, a
character as a rival and in its regard, its envoy's and speaker's faces and a picture of its
people. Nothing in the rules is the Drifters' alone.

**Out of scope.** Playing the Drifters (later, D-08), so their buildings, other advisors' faces
and the look of a colony in a giant's air; technologies of their own; five-power balance (40).

### 25.1 Names (fiction)

- **The Drifters**: the name humans give the species, vast, long-lived floaters in a giant
  planet's air; *a Drifter colony*.
- **The Drift Moot** (*the Moot*): their power, an assembly of the eldest, and brokers to
  everyone. Violet (`#b48cff`), and a hexagon beside the colour wherever it is shown.
- **Their names** are translations: the Envoy *Fair Wind, who carries offers*; the speaker *Deep
  Current, eldest of the Moot*; their advisors (for when they are played) Wide Shelter (the
  Settled), Slow Hands (the Makers), Full Hold (the Stores), Long Memory (the Learned), Far Drift
  (the Wanderers), Still Air (the Listeners) and Fair Wind; a warm voice.

### 25.2 Their home (observed and fiction)

**HD 192310 c**, a real planet of at least 24 Earth masses (Neptune's class) about 1.2 AU from the
orange dwarf HD 192310 (Gliese 785) in Capricornus, 28.7 ly from Sol, in the shell: observed by
radial velocity (the game's facts say which are observed and which estimated). Its neighbours
within 6 ly include **AU Microscopii**, a young flare star with Neptune-sized planets of its own. It is
23.5 ly from Wolf 1061 and 28 or more from Sol and Tau Ceti, and 46 from GJ 433, so the Moot and
the Concord lie at opposite ends of the shell. The Drifters living there are fiction.

### 25.3 The worlds they live on

Only giants: a gas giant, an ice giant or a mini-Neptune, never a solid surface. In a giant's air
they float at the depth they like, so its temperature at the top of the clouds matters little.

| | The Drifters |
| --- | --- |
| Surfaces | gas giants, ice giants and mini-Neptunes only |
| Temperature | frozen 1, cold 0, temperate 0, warm 0, hot 1, scorching 2 |
| Atmosphere | dense 0, toxic 1; none or thin never (a giant's air is dense) |
| Gravity, water, flares, an open sky | nothing |

A gas giant is comfortable for them, a scorching one harsh. Humans can only hold an outpost on a
giant; the Drifters only a colony on one, and outposts elsewhere. A giant's riches are fusion fuel
(gas giants 2, ice giants 1), so their fuel trade comes from where they live.

### 25.4 Their home web

By §24.4's rule: HD 192310, AU Microscopii, AT Microscopii, PM J20502−3424 and BPS CS 22879−0089,
5 systems and 4 lanes of its own. No other web changes.

### 25.5 Their tongue

Not shared with anyone: signal, words, talk, as with the Duskfolk.

### 25.6 Their regard and treaties (fiction)

*Brokers, who want trade with everyone and pay for peace* (§5):

- **Long-lived, long memory:** their memories fade a point every **6** turns.
- **Brokers:** they ask a regard of −10 for a trade agreement and 0 for open lanes, 20 for shared
  research and 10 for a border; they buy passage at 0 and **protection at −10** (they pay for
  peace). A gift is remembered at 1 for every 5 credits. Lawful.
- **Their view of others' ways:** −10 for the Hollow Wake (*Sells the lanes that should be open*).
- **Their exchanges (§23.1):** a broker also offers its surplus: with more than 150 fusion fuel it
  offers 20 of it for 40 credits every 5 turns, to the power that regards it best (`broker`).

### 25.7 As a rival

The same rules as every rival. Its character: its capital and colonies run to produce; it settles
the **roomiest** giant it can; it researches propulsion and society; low taxes; it builds lanes
from its colonies; a labour drive when its attention is full; the doctrines Open frontier, Lane
network and Industrial worlds; the Lanewright Foundry as its great work. Its trait, **Long-lived**:
colonies grow 20% slower (they are few in number).

### 25.8 On the screen

As the Duskfolk (§24.9): its colour and hexagon everywhere a power is shown; its envoy on the
diplomacy screen; its speaker, envoy and people in the codex, labelled *Fiction*.

### 25.9 Pictures (D-57)

Fair Wind's and Deep Current's faces and the Drifters at home: **3 pictures, 6 candidates, about
$0.30**, as lettered sheets. The Drifters are described to the generator as an invented people,
like no other work's.

### 25.10 State

The faction list gains `drift-moot`, the species list `drifters`; version 15 still.

### 25.11 Tests

`drifters.test.ts`: their habitability (giants only, outposts elsewhere); their home web; contact
through words; memories that fade every 6 turns; a broker's surplus offered; the Moot as a rival
for 100 turns with the game sound; a game with five powers. `drifters.spec.ts`: the Moot in the
codex, its envoy on the diplomacy screen; on the phone, tablet and desktop.

### Increment 39: the Drifters (22 October 2026)

- **As §25:** the Drifters (giants only: gas giants, ice giants and mini-Neptunes) and the Drift
  Moot at HD 192310 c, violet with a hexagon; its home web of its own lanes, 5 systems and 4 lanes;
  a rival in every game with rivals, so every such game now has five powers. A rival's character
  may make it a **broker**, which offers its surplus for credits (`surplus` 150 in
  `RULES.exchanges`); only the Moot is one.
- **The new game** names the alien rivals from the data (*the Dusk Concord and the Drift Moot,
  alien powers far out in the shell*), so a third needs no new words.
- **Pictures:** 6 candidates, no re-roll: Fair Wind A, Deep Current B, the Drifters at home A.
- **Numbers:** in the eight headless games, now with five powers, the Moot holds 5.9 colonies, 93
  million people and 19.8 technologies at turn 100; it meets the Cooperative between turns 80 and
  105. The others as before but the Cooperative, now 26 technologies on seeds 7, 3 and 4 (23.5 on
  average, the target 15 to 25), left for increment 40. The slowest headless turn 180 ms, within
  M1's 200 ms; the largest save at turn 100, 61 KB.
- **Tests:** `drifters.test.ts` as §25.11, with 100 turns of all five powers; 505 unit tests;
  `drifters.spec.ts` on the phone, tablet and desktop; the journeys count five powers.

## 26. Increment 40 in detail: the proof (written before building it)

**Goals.** Show that M3 holds together with all five powers, as M2b's increment 32 did with three
(M2B_SCIENCE.md §20.4): the headless games against their targets, the budgets, the 100-turn
journeys, and the owner's try. Tune what misses, in the smallest way, and say so.

**Out of scope.** New rules. Playing the alien powers. M4's ships and battles.

### 26.1 The headless games

On the eight seeds of `npm run balance`, every game with all five powers as rivals, at turn 100:

- **Technologies:** the research-led Authority 35 to 45, every other power 15 to 25, on every seed
  (M2b's §2 targets, now for the aliens too); no power learns every technology it can before turn
  180 (checked with 200-turn runs, reported in the notes).
- **Neighbours:** every alien power is in contact with at least one human power by turn 120, and
  every power has agreed at least one treaty by turn 100 (§21).
- **Sound:** no crash, no lasting hunger, no debt longer than 5 turns, no rival banking more than
  600 credits, a turn within **200 ms** and a save within **200 KB** (M1's budgets).
- The unit tests play three of the seeds with all five powers and check these ranges, as
  `rivals.test.ts` checked three powers.

### 26.2 The browser

The 100-turn journeys (`long.spec.ts`) on the phone and the desktop, now with five powers in play,
the turn within its budget; every journey of M3 on the phone, tablet and desktop.

### 26.3 The owner's try

Play M3 on a phone and a desktop (a game of 100 turns or more, to meet the aliens) and say what is
dull, unclear, slow or too easy, as M2's and M2b's tries asked.

### 26.4 State and tests

No change to the state (version 15). Tests: `rivals.test.ts` with five powers on seeds 42, 7 and
2176, and the neighbours' checks; the balance file regenerated.
