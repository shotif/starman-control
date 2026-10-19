# The Starman Reborn universe: what Starman Control inherits

A digest of what [Starman Reborn](https://github.com/shotif/starman-reborn) already establishes,
read on 19 October 2026 at commit `ba4ef73`. Paths are in that repository. It is the source for
the setting decisions in [../DECISIONS.md](../DECISIONS.md); Starman Reborn stays the canon, and
anything Starman Control adds is new canon that must not contradict it unless the owner decides
otherwise.

## 1. The setting in one paragraph

Starman Reborn is a space trading and combat game set among **207 real star systems out to about
27 light-years** from Sol. Humanity already lives across that whole sphere: 322 stations of twelve
kinds, linked by fixed **jump lanes** between real stars. No in-fiction year is ever stated; the
game's calendar is the real date the save began plus the time played, so the setting reads as an
alternative present in which jump travel exists. Everything not astronomical — stations, factions,
lanes, the drive, every story — is original fiction and labelled so in the game.

## 2. Travel: the jump lanes

- Lanes are fixed links between real stars (`src/content/world/rules.ts`, `docs/PROCGEN.md`
  §7.1, §7.7): a minimum spanning tree plus extra links, 2–5 per system.
- **Core lanes** are at most 9.5 ly long. **The frontier** is systems more than 17.5 ly from Sol;
  its lanes run up to 12 ly and need a **long-range jump drive** (reach 11, 11.7 or 12.4 ly at
  class 1, 2 or 3).
- A jump costs 10 cr + 16 cr per ly and takes 1.4 days per ly (fiction, `src/galaxy/routing.ts`).
- Departures from Sol are cleared at Deimos Depot.

**For Control:** this is a starlane network with drive technology deciding which lanes you can
use — very close to *Master of Orion 3*'s starlanes, and it gives the strategic map chokepoints
and a reason to research drives. The generator is a pure function of a seed and could be reused.

## 3. The powers

All factions, ranks and ceremonies are invented and labelled so (`RANK_FICTION`).

| Power | Identity | Home and territory | Ranks | Colour |
| --- | --- | --- | --- | --- |
| **Sol Transit Authority (STA)** | The civil authority that runs Sol's ports and lanes and clears interstellar departures. Bureaucratic, lawful, capable of corruption (Deputy Collector Oren Vail). Civic and nautical names. | Sol and Barnard's Star; core of 5 systems (Sol, Barnard, Wolf 359, Lalande 21185, Ross 154) | Bonded Carrier → Lane Officer → Lightkeeper | green |
| **Frontier Cooperative** | "A union of settlers, miners and researchers running the first outposts beyond Sol." Democratic: ranks are voted in. Pastoral names. | Alpha Centauri, Sirius, Epsilon Eridani; 13 core systems (Procyon, Tau Ceti, Kapteyn's…) and 5 more on the frontier | Field Hand → Shareholder → Elder | blue |
| **Hollow Wake** | "Raider crews that prey on lane traffic at the edges of patrolled space." Dens, Nests and Roosts with grim names; toll gates, fences, black markets. | Lawless space at least 2 jumps from Sol (Maw Roost at Wolf 1061, Graveyard Nest at 70 Ophiuchi…) | Cold Hand → Pack Leader → Long Shadow | red |
| Independents | Free ports, frontier colonies with militias, the Kettering Line hauliers, Sol's belt crews, Pyre Observatory | scattered | — | — |

- **Territory** is computed from influence, `weight / (1 + (d / 5 ly)²)`, with a claim threshold of
  0.32; security below 0.35 is lawless. This model can seed a strategy map's borders directly.
- **The border war:** five fronts between lawful space and Wake dens, each a tide from −100 to
  +100 with skirmish, blockade, fallen and truce phases. Stations can fall.

## 4. Aliens, precursors and artefacts: none yet

**Starman Reborn has no aliens, non-human intelligences, precursors, ruins, artefacts or mystery
signals.** Everything that hints at mystery is human:

- **Old derelicts** found by an "Old beacon" more than two jumps from Sol, with a carrier tone
  "as there has been for a very long time". Boarding logs: *"Only the charts are left, older than
  any in your computer."* and *"A handwritten note on the hatch: back soon. It has been a very long
  time."* (`src/content/wrecks/lines.ts`). They are human class 3 hulls.
- **Wreck trails** (`src/content/wrecks/mysteries.ts`): a lifeboat trail, a strongbox, a survey
  hull's sister ship.
- **Invented astronomy, always badged:** Betelgeuse explodes as a supernova and Antares quietly
  goes dark (both stars are real; their deaths are fiction). **Pyre**, the one invented star, a red
  supergiant 33 ly out towards Phoenix, dies and leaves a black hole. When flare stars flare is
  fiction; that they flare is real.

**For Control:** aliens and artefacts are new canon. The old derelicts' impossible age, Pyre's
black hole and the dead stars are natural hooks to tie them in (see the setting decision).

## 5. Ships and makers

Six ship classes (courier, light fighter, heavy fighter, gunship, freighter, surveyor), 39 ships,
146 pieces of equipment in 21 families. Six makers, each with a character and a naming theme:

| Maker | Base | Power | Character | Names |
| --- | --- | --- | --- | --- |
| Halden Orbital Works | Halcyon Ring | STA | balanced | seabirds (Petrel, Albatross) |
| Ares Foundry | Deimos | STA | armoured, hard-hitting | fortifications (Anvil, Rampart) |
| Toliman Cooperative Yards | Meridian | Co-op | roomy, frugal | trees (Juniper, Rowan) |
| Horizon Dynamics | Sirius | Co-op | fast, expensive | optics (Parallax, Zenith) |
| Eridani Shipwrights | Eridani Hub | Co-op | cheap haulers | rivers (Tidewater, Oxbow) |
| Wake Salvage | — | Wake | stolen hulls rebuilt for ambushes | predators and ash (Jackal, Cinder) |

Weapons carry damage types that shields resist or suffer: energy beats deflectors, kinetic beats
hulls, plasma beats diffusers, ion strips shields. **For Control:** the makers can become the
human powers' shipbuilding traditions and the damage-type triangle can carry into fleet combat.
Reborn's ships are small craft; capital ships would be new.

## 6. The economy

- **23 goods:** water ice, metal ore, volatile gases, deuterium, helium-3, refined metals,
  polymers, staple food, fine food, medical supplies, machinery, electronics, fabricator parts,
  consumer goods, ship components, habitat modules, research samples, survey data cores, luxury
  goods, small arms, salvage, combat stims, transponder spoofers.
- **12 station kinds:** trade port, customs depot, shipyard, mining outpost, refinery, factory,
  agri-station, research station, relay, military base, free port, pirate den.
- Markets are stock-based, with distance to the nearest maker and lawlessness raising prices.

**For Control:** a 4X needs far fewer, coarser resources; the goods suggest which ones belong in
this universe (metals and ice from belts, deuterium and helium-3 from gas giants, food from farm
worlds). The station kinds suggest planetary building types.

## 7. Places and people worth keeping

- **Hand-made places:** Halcyon Ring (Earth orbit), Deimos Depot (Mars), Meridian Outpost
  (Proxima b), Barnard Transit Relay, Horizon Platform (Sirius B), Eridani Mining Hub.
- **Generated landmarks:** Maw Roost (Wolf 1061), Graveyard Nest (70 Ophiuchi), Stonecrop Gardens
  (Procyon), Harrow Farmstead (HD 219134), Doppler Freeport (Achird), Pyre Remnant Station.
- **People:** Rhea Castell (STA auditor), Sabine Kettering (Kettering Line), Salt (Wake captain),
  Amara Quist (Co-op relief), Ines Halloway (Harrow Farmstead), Tamsin Rook (belt crews),
  Dr Selene Achterberg (Pyre Observatory), six rival pilots (Mara "Quickstep" Venn and others).

**For Control:** these can appear as historical figures, leaders' namesakes, or descendants,
depending on how far ahead Control is set.

## 8. Tone and style

- British spelling; plain, short, wry, understated lines (*"The lanes are safer than they were.
  Not safe. Safer."*).
- Real astronomy is never invented; fiction may only be attached to catalogued bodies, and every
  generated thing is labelled fiction. Contested planets are kept and said to be contested.
- Badges in the interface: Observed / Illustrated / Fiction / Pending verification.
- Original names only: nothing from other games, no real people, organisations or trademarks.
- AI-written text packs made at build time are allowed; live AI text while playing is deferred.

## 9. The astronomy data: highly reusable

Plain JSON in `src/data/generated/`, with provenance and uncertainty on every value:

| File | Contents |
| --- | --- |
| `astrometry.json` (458 KB) | 252 stars in 206 systems beyond Sol; Gaia DR3 or SIMBAD; Sol-centred Cartesian light-years. Spectral mix: M 131, K 29, T 28, D 11, Y 11, L 7, G 7, A 4, F 4. Census limit: parallax ≥ 120 mas (~27.2 ly). |
| `catalog-systems.json` (43 KB) | 202 systems → component stars (5 more are hand-curated in `src/data/systems.ts`) |
| `exoplanets.json` (101 KB) | 99 planets, 77 confirmed, 22 contested, with masses, radii, orbits, and what is unknown |
| `belts.json` (7 KB) | 9 belts: Sol's main and Kuiper belts; discs at Proxima, ε Eridani, τ Ceti, Fomalhaut, Fomalhaut C, Vega, GJ 581 |
| `far-stars.json` | Betelgeuse and Antares |
| Sol extras | planets' elements, 22 binary orbits, 14 comets, 15 asteroids, 5 moons, 11 spacecraft, the Moon |

The fetch pipeline (`scripts/sky-fetch.ts`, run on GitHub's runners) queries SIMBAD, Gaia DR3,
VizieR, the NASA Exoplanet Archive and the Extrasolar Planets Encyclopaedia, so **the census could
be widened** (for example to 40 or 50 ly) with the same tools.

**Licence caveat:** values derived from the HYG database are CC BY-SA 4.0 (share-alike); Open
Exoplanet Catalogue data is MIT (`data/provisional/NOTICE.md`). Most stars are now checked against
the snapshot instead, but any HYG-derived values we copy keep that licence.

**Note on scale:** 99 known planets among 207 systems means most systems have no known planets.
A 4X needs planets everywhere, so Control would have to generate the unknown ones, labelled as
fiction, beside the real ones.

## 10. What Reborn says about the future

Nothing about sequels, a strategy layer or 4X. Its known gaps list "no fleet battles, multiplayer,
cloud saves or cross-device sync" as deliberate limits. Player outposts (up to three) and frontier
colonies are the nearest thing to colonisation. Story outcomes change markets but never "who runs a
station" — Control would be the first game in the universe where territory changes hands at scale.
