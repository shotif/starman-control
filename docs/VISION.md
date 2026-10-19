# Vision

**Status:** first draft for discussion, 19 October 2026.

## The pitch

> **Every star is real. Everything you find there is up to you.**
>
> Lead one of humanity's three powers out of the old neighbourhood and into the frontier: survey
> the real stars around the Sun, settle their real planets, build them into worlds, manage the
> fleets and the money that hold an empire together, and meet the species waiting beyond the
> lanes — and the relics of one that is gone.

Starman Control is a single-player, turn-based 4X strategy game in the browser, set in the
universe of [Starman Reborn](https://github.com/shotif/starman-reborn). Reborn is the view from one
cockpit; Control is the view from the top. In Reborn you are a starman. **In Control you are
Control** — the voice the starmen answer to *(D-11)*.

## Why this game

- **No 4X has been set among the real stars.** Our map is the actual neighbourhood: Alpha
  Centauri 4.2 light-years away, Barnard's Star, Tau Ceti, Epsilon Eridani with its real debris
  disc, Proxima b where astronomers found it. Distances between real stars decide which lanes you
  can use and where the fronts form. Every invented thing is labelled, as in Reborn, so the game
  teaches the real sky as you play.
- ***Master of Orion 3* is the 4X that aimed highest and fell shortest.** Its ideas — an empire
  that feels imperial, planets developed through zoning, a council whose vote can end the game, a
  hunt for a vanished species' relics — still have no worthy successor. Its failure was in the
  execution: opaque systems, a game that seemed to play itself, and battles that frustrated. We
  can keep the ideas and fix the execution.
- **The universe already exists.** Three human powers with characters of their own, six
  shipmakers, a frontier, a black hole where a star died — Reborn has built a world that is ready
  to be governed.

## Pillars

1. **A real sky.** Every star where astronomers measure it, every known planet the real one with
   its real uncertainty, every invented thing labelled *Fiction*. Real astronomy is part of play:
   a red dwarf's flares, a tidally locked world's twilight band, a gas giant's fuel.
2. **An empire, not a spreadsheet.** Every number explains itself. Every turn opens with what
   changed, why, and what needs you. If the player cannot see why something happened, it is a bug.
3. **Delegate, never abdicate.** Governors and automatic rules take the tedium away, never the
   decisions. What they do is reported with reasons and can be taken back.
4. **Others are truly other.** Each species lives on different worlds, thinks and talks
   differently, and wants different things — so peace, trade and the council are as rich as war.
5. **The unknown pulls you outward.** Relic sites, anomalies and the precursor mystery keep
   exploration meaningful to the last turn.
6. **Fits a life.** A few turns in a lunch break, a campaign over a week of evenings; save
   anywhere; nothing to install.

## What we take from *Master of Orion 3*, and what we fix

Details and sources: [research/MASTER_OF_ORION_3.md](research/MASTER_OF_ORION_3.md). Mechanics
only: no names, text, art or data from that game.

| *Master of Orion 3* had | We keep | We fix |
| --- | --- | --- |
| Planets of 1–12 regions zoned for "dominant economic activities" (farming, mining, research and more) | Zoning districts as the heart of planet building | Few, clear zone types; each planet's nature visible in what it is good at; every effect explained |
| Viceroys running planets to development plans; a designed ration of "focus points" for intervening, cut before release | Optional delegation for big empires | Nothing delegated by default; every delegated decision reported with its reason and reversible; orders stick. Whether attention becomes a resource is open *(D-15)* |
| Spending past a planet's capacity at doubling cost ("overdrive") | The overdrive curve | Shown as a curve, so the trade-off is visible |
| Starlanes and chokepoints | Lanes, from Reborn's own network | Drive research decides the longest lane you can take, so real distances shape the map |
| A senate of all races, with a vote that can win the game | The council, its resolutions and its leadership vote | Clear rules, visible vote counts and reasons for each power's vote |
| The hunt for relics of a vanished people as a victory path | Relic sites, keys, guardians | Relics tied to a mystery told in chapters, so the hunt is a story, not a scavenger hunt |
| Many species with deep trait systems | Species that differ in how they play | Fewer species in 1.0, each far more distinct |
| Fleets organised into task forces with roles | Task forces and roles | Readable stances and orders; the battle explains its outcome |
| Real-time 3D tactical battles | — | Battles decided by your orders before the fight, shown as a replay you can watch or skip *(D-07)* |
| A thin tutorial and opaque interface | — | A guided opening, "what needs you", number breakdowns |

## Tone

Reborn's voice: plain, short, wry and understated, in British English. Wonder comes from the real
sky and from restraint, not from adjectives. Aliens are strange in what they want and how they
reason, not just in how they look. The precursor mystery is quiet and uneasy rather than epic.

## Games we learn from

- ***Master of Orion 3*** (2003): the model for scope and ambition.
- ***Master of Orion II*** (1996): clarity, ship design, the joy of a readable 4X.
- ***Stellaris*** (2016): sectors and governors, events and archaeology sites told in chapters.
- ***Endless Space 2*** (2017): strongly distinct factions with their own stories, battles decided
  by plans and watched as cinematics.
- ***Distant Worlds 2*** (2022): automation that the player can switch on area by area.
- ***Starman Reborn***: our own universe's tone, interface, astronomy and rule-driven generation.

## Who it is for

Players who enjoy a thoughtful 4X over many sessions; people drawn to space and real astronomy;
and players of Starman Reborn who want to see their universe from the top. It should be learnable
by someone new to 4X games through the guided opening, and deep enough for veterans of the genre.
