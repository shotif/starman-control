# M1 · Lanes, research and anomalies in detail (increment 6)

**Status:** written 19 October 2026 before increment 6 was built, and built the same day in its
three parts (see *As built* at the end). It fills in
[M1 §3, §8 and §9](M1_FIRST_LIGHT.md) and follows them and the owner's answers to D-19a to D-19c
(the home webs, the Lapse, lanes built as projects). The numbers are starting points for M2.
It is built and deployed in three parts: **6a** lanes, **6b** research, **6c** anomalies.

**Goals.** You can reach out: build new lanes and relight the dark ones from any system you hold;
spend research points on a research tree that extends your reach and opens harder worlds; and
investigate the anomalies your surveys find. With these, M1's 50-turn game is complete.

**Out of scope here:** other powers using or cutting your lanes, and lane upkeep (M3 and M2); the
full research fields (M2); anomalies that start event chains (M5).

## 1. Lanes (6a)

### Building and relighting

A lane is an item in a build queue, like a ship, aimed from the holding's system at another star:

| | New lane | Relighting a dark lane |
| --- | --- | --- |
| To | any star within your **lane reach** (6 ly; *Lane engineering* I, II, III: 8, 10, 12 ly) with no lane to it yet | the other end of a dark lane of Reborn's network that starts here, whatever its length |
| Industry | 20 + 6 a light-year | half |
| Metals, fusion fuel | 1 and 2 a light-year | half |
| Then it is tuned for | 1 turn + 1 for every 3 ly | half |

Costs are rounded up to whole numbers. A new 5 ly lane costs 50 industry, 5 metals and 10 fusion
fuel, then is tuned for 3 turns. *Beacon tuning* makes both kinds 25% cheaper.

- **Paid, then tuned.** When the queue has paid for a lane, it appears on the map as **being
  tuned** (dotted, in your colour) and opens when the turns are done; the report says so. Ships use
  only open lanes.
- **Beacon slots.** Each end must have a free slot: 3 a star, 5 with a lane station. Lanes open or
  being tuned fill a slot; so do lanes already in one of your queues, so you cannot queue more
  than a star can take. Dark lanes fill nothing.
- **Building blind:** the far star need not be held, surveyed or even charted beyond what
  astronomers know; a lane is how the map opens.
- **Outposts build lanes.** An outpost makes **2 industry** a turn for its queue, and can queue
  lanes only: a slow way to push a lane out from a gas giant or a belt. Colonies queue lanes beside
  ships and projects.
- **What needs you** is unchanged; a lane waiting for metals or fuel waits like any item.

### On screen

The colony or outpost panel's *Add to the queue* gains **Lanes from here**: every star within
reach, nearest first, and every dark lane from here, each with its length, cost and tuning time,
marked *relight* or *new*, and the reason when one cannot be queued (*no free beacon slot at
Ross 128*, *out of reach: 7.2 ly, and your reach is 6 ly*). On a desktop, hovering a row draws the
lane on the map; on a phone, choosing a row asks to confirm with the lane drawn. The map draws
lanes being tuned dotted, and new lanes (not in Reborn's network) like any other.

## 2. Research (6b)

### Research points

Colonies make **research points**, the game's science: 1 for every 2 million people, counted
over all your colonies and rounded down ("Research 7 = 14.6 million people × ½"). They go into the
first technology in your research queue; points beyond what it needs go on to the next. With
nothing queued they are lost, and *what needs you* says so. Each technology keeps the points put
into it, so changing your mind loses nothing.

### The M1 research tree

Fourteen technologies in five fields, each stating its exact effect. A technology can be queued
when what it needs is researched or queued before it; queueing one also queues what it needs.

| Field | Technology | Points | Needs | Effect |
| --- | --- | --- | --- | --- |
| Propulsion | Lane engineering I | 30 | — | lane reach and blind-jump reach 8 ly (from 6) |
| | Lane engineering II | 60 | Lane engineering I | 10 ly |
| | Lane engineering III | 100 | Lane engineering II | 12 ly |
| | Jump tuning | 60 | Lane engineering I | ships make 1 more jump point a turn |
| | Beacon tuning | 60 | Lane engineering I | lanes 25% cheaper to build and relight |
| Construction | Habitat domes | 30 | — | colony ships can settle harsh worlds (room: half their size) |
| | Automated mining | 30 | — | outposts yield 1 more of their world's riches |
| | Orbital yards | 60 | Automated mining | ships 20% cheaper in industry |
| Life Sciences | Adaptation I | 30 | — | cold and frozen worlds count one step warmer for your species |
| | Adaptation II | 60 | Adaptation I | low and high gravity cost one step less |
| | Closed ecologies | 60 | Habitat domes | colonies grow 25% faster |
| Society | Colonial charters | 30 | — | colony ships 25% cheaper |
| Survey | Deep survey | 30 | — | investigating an anomaly takes one turn less |
| | Long-baseline arrays | 60 | Deep survey | survey stations survey two lanes out |
| Xenology | — | — | locked | *Nothing to study yet.* |

The tree costs 700 points in all; a power makes about 500 in 50 turns, so research is a choice.
A power starts with nothing researched.

### On screen

| | Phone | Desktop |
| --- | --- | --- |
| Where | **Research** in the bottom bar, which becomes *Report, Empire, Research, End turn*; the flat/3D switch moves to a small button on the map | a **Research** button in the top bar, and the key T |
| The tree | a section per field; each technology a card (state, points, effect, what it needs); tap to queue it, tap again for *research now* | the fields as columns and the tiers as rows, lines from each technology to what it needs; click to queue, Shift-click to research now |
| The queue | at the top: the current technology with its progress and turns left, the rest below with Remove and Up | the same, as a list beside the tree |
| Top bar | — | research a turn beside the resources, explained on hover |

## 3. Anomalies (6c)

- **Where:** about one system in six, chosen from the game's seed (never a capital). Twenty kinds,
  each a short text in Reborn's voice, labelled *Fiction*; which kind each system holds comes from
  the seed too.
- **Found** when a power surveys the system: the survey report says so, and the system panel shows
  it.
- **Investigated** by a survey ship ordered to (*Investigate*, in its panel and the system's): it
  stays for 1 to 3 turns (by kind; *Deep survey* one less, at least 1), then the report gives the
  finding and the reward. Each power can investigate each anomaly once.
- **Rewards:** research points into your current technology (or the first you can research);
  progress towards a named technology; metals, volatiles or fusion fuel; or only a fragment of
  story. Two or three kinds hint at something no human made: the first threads of the precursor
  mystery (D-13), written so as not to settle it.
- **What needs you:** an idle survey ship where an anomaly waits says so.

## 4. The state

Each part raised the state's version, with a migration, so a save made between them still loads:
version 4 (6a) lets a lane be `building` with the turns left and a queue item be a `lane`;
version 5 (6b) gives each power `researched`, `researchQueue` and `techProgress`; version 6 (6c)
gives each power `investigated` and each ship `investigating`.

## 5. Tests

- **Lanes:** costs and times (new, relit, with Beacon tuning); reach (with each level of Lane
  engineering); beacon slots counting open, tuning and queued lanes; refusals with reasons; a
  lane paid, tuned and opened, then used by a ship; outposts queue lanes only.
- **Research:** points from people; progress, carry-over and keeping progress; queueing what a
  technology needs; every effect changes the rule it names.
- **Anomalies:** placement from the seed (about one in six, never a capital, the same every
  time); found by survey; investigation time; each reward; once per power.
- **Scripted 50-turn games** as each power that build lanes, research and investigate, replayed
  exactly; **browser journeys** that queue a lane, research a technology and investigate an
  anomaly on a phone, a tablet and a desktop.

## As built

- **Lanes (6a).** As in §1. On a phone, choosing a lane in the list queues it at once (like any
  item), and queued lanes are drawn faintly on the map in amber, as ships' orders are; on a
  desktop, hovering a lane in the list draws it. The queue says when a lane will be paid for
  "then tuned for 3 turns". A queued lane whose place was taken before it was paid for is
  dropped, and the report says why.
- **Research (6b).** As in §2. Each technology card has *Queue* (with what it needs, if anything)
  and *Now*. An anomaly's progress towards a named technology stops a point short of finishing
  it, so it is still researched in its place in the tree. The phone's flat/3D switch is a small
  button at the top right of the map; on a desktop, Legend, Codex, the keys and *Save and leave*
  are under **Menu**, and research covers everything right of the outliner.
- **Anomalies (6c).** As in §3: twenty kinds in `src/content/anomalies.ts`, about one system in
  six (28 to 34 of 207 for the seeds tested). A survey ship investigating stays put, and moving
  it calls the investigation off.
- **Choosing a destination** now frames the ship's system and every star it can reach (by its
  lanes, or within its blind-jump reach) above the bars, so none hides under the phone's bar.
- **Scripted 50-turn games** as each power now also research (10 or 11 technologies), lay lanes
  from their outposts and investigate anomalies, and replay exactly.

