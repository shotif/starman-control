# M1 · The planets in detail (increment 3)

**Status:** written 19 October 2026, before increment 3 is built. It fills in
[M1 §4](M1_FIRST_LIGHT.md#4-stars-and-planets) and follows it; nothing here changes a decision.
The numbers are starting points, to be balanced in M2.

**Goals.** Every system has its worlds. What astronomers know is shown as they know it; what they
do not is generated from the star's real type, consistently with what is known, and says
*Fiction*. Each world has the few attributes play needs, and each species sees how habitable it is.

**Out of scope here:** colonies and outposts (increment 5), surveys and what each power knows
(increment 4: until then every system shows its worlds), districts (M2), alien species (M3).

## 1. Three kinds of fact, attribute by attribute

| Attribute | A known planet | A generated body | Sol's bodies |
| --- | --- | --- | --- |
| Orbit, mass, size in Earth radii | **Observed**, with the archive's uncertainty; a missing radius is **Estimated** from the mass | **Fiction** | **Observed** (NASA) |
| Equilibrium temperature | **Estimated** from the orbit and the star's estimated light | **Fiction** (the orbit is) | **Observed** surface temperature |
| Kind (rocky, super-Earth, giant…) | **Estimated** from mass and radius | **Fiction** | **Observed** |
| Atmosphere, water, surface temperature, riches | **Fiction**, consistent with the above | **Fiction** | **Observed** where known; riches are **Fiction** |
| Tidally locked, flare-exposed | **Estimated** by the rules below | **Fiction** | **Observed** |

## 2. Stars: estimated light

The census gives spectral types, not luminosities. Each star's **temperature, luminosity, radius
and mass** are read from the mean dwarf sequence of Pecaut & Mamajek (2013, ApJS 208, 9; the
updated table version 2022.04.16) for its type, rounded to the nearest listed subclass, and marked
*Estimated*. Copied once by `npm run data:import-dwarfs` into `src/data/dwarfs.json`, with its
source.

- **White dwarfs** (types D…): temperature from the type's number (50,400 K divided by it, the
  definition of the white-dwarf temperature index), radius 0.012 of the Sun's, luminosity from
  the two. Sirius B, DA1.9, comes out at 0.06 of the Sun, as measured.
- **Types the archives do not give** (11 stars): taken as a typical red dwarf (M4V), and the
  panel says so.
- Luminosities are stored as fixed numbers, so the game never computes a power or a logarithm
  while playing (the same on every device, D-06).

## 3. Generated bodies

Generated around each system's primary star, from the stream `rng(seed, 'bodies', systemId)`, so
a body depends on nothing else. Known planets keep their own host stars.

| Primary | Planets | Belt | Notes |
| --- | --- | --- | --- |
| M (red dwarf) | 1–4, close in, mostly rocky and super-Earths; giants 1 in 12 | 1 in 4 | most tidally locked |
| K, G | 2–7, every kind | 1 in 2 | |
| A, F | 1–4, mostly giants, far out | 3 in 5 | |
| D (white dwarf) | none, rarely 1 (1 in 8) | 7 in 10 (debris) | |
| L, T, Y (brown dwarf) | 0–2 small, cold worlds | none | from 0.02 au out |

- **Orbits** start near the star (scaled by the square root of its luminosity) and step outward,
  each 1.4 to 2.2 times the last. A generated orbit within a factor of 1.3 of a known planet's is
  skipped, so generated worlds keep clear of real ones and never contradict an observation.
- **Kind** follows where the orbit lies against the star's snow line (2.7 au × √L): rocky worlds
  and super-Earths inside it, giants more likely beyond it.
- **Belts:** a system with an observed belt or disc keeps only that one; others may get one
  generated.
- **Moons:** a generated giant has 0 to 3 large moons, bodies of their own.
- **Names:** generated planets take the letters after the highest a known planet has, in orbit
  order, as astronomers would name new discoveries ("Tau Ceti i"). Letters skipped in the real
  names are left alone: they were often candidates later withdrawn (Tau Ceti b, c and d), and
  fiction must not wear a real planet's name. Moons take Roman numerals after their planet
  ("… I"); belts are named after their star. Every one is marked *Fiction*.
- **Sol** is entirely real: its eight planets, the main belt and the Kuiper belt, and seven large
  moons (the Moon; Io, Europa, Ganymede and Callisto; Titan; Triton), from NASA's fact sheets.

Everything a body holds is a whole number: orbits in thousandths of an au, masses and radii in
hundredths of Earth's, temperatures in kelvin.

## 4. What a body is, for play

| Attribute | Rule |
| --- | --- |
| Kind | rocky, super-Earth, mini-Neptune, ice giant, gas giant, dwarf planet, moon, belt. A known planet: by radius where measured (below 1.6 Earth radii rocky, below 4 super-Earth or mini-Neptune, below 8 ice giant, else gas giant), else by mass (below 2 Earths rocky, below 10 super-Earth, below 30 mini-Neptune, below 80 ice giant, else gas giant) |
| Size 1–12 | solid worlds: 7 × radius in Earth radii, from 1 to 10 (the Moon 2, Mars 4, Earth 7); mini-Neptunes 9, ice giants 11, gas giants 12, belts 3 |
| Gravity | mass over radius squared: below 0.6 g low, above 1.5 g high |
| Equilibrium temperature | 255 K × L^¼ ÷ √(orbit in au), Earth's reflectivity assumed |
| Surface temperature | the equilibrium temperature, plus 5 K for a thin atmosphere, 35 K for a dense one, 400 K for a toxic one (a runaway greenhouse) |
| Temperature band | frozen below 180 K, cold to 260, temperate to 310, warm to 370, hot to 600, scorching above |
| Atmosphere | none, thin, dense, toxic: from the world's mass (small worlds lose theirs), warmth and the star's flares |
| Water | none, ice or oceans, from the surface temperature |
| Tidally locked | inside 0.3 au of a red dwarf, 0.1 au of an orange one, 0.05 au of anything else |
| Flare-exposed | any planet or moon of one of the ten flare stars |
| Riches | metals, volatiles, fusion fuel, each none, poor or rich: rocky worlds and belts carry metals, icy and dwarf worlds volatiles, giants fusion fuel |

## 5. Habitability, per species

A species (D-08) states how hard each condition is for it; the conditions of a world add up.
For **humans**:

| Condition | 0 | 1 | 2 | Impossible |
| --- | --- | --- | --- | --- |
| Temperature | temperate | cold, warm | frozen, hot | scorching |
| Atmosphere | dense | thin | none, toxic | |
| Gravity | normal | low | high | |
| Water | oceans, ice | none | | |
| Flares | none | flare-exposed | | |

Worlds without a surface (mini-Neptunes, giants, belts) are uninhabitable for humans: outposts
only. A total of **0 is comfortable, 1–2 tolerable, 3–6 harsh** (habitat domes needed), above 6
uninhabitable. Earth is comfortable; Mars and the Moon are harsh.

**Capacity** (people, in units of about a million, used from increment 5): comfortable 2 × size,
tolerable 1 × size, harsh ½ × size rounded down (habitat domes raise it later), uninhabitable 0.

## 6. Screens

- **System panel:** the star's estimated light and temperature (with the *Estimated* badge), then
  every body in orbit order: its name, kind, size and, for the player's species, habitability.
- **Planet panel** (tapping a body; on a desktop it replaces the system in the inspector, with a
  way back): every attribute with its badge; for a known planet its archive values, uncertainty,
  status and source; habitability with the reasons ("cold +1, thin air +1, low gravity +1:
  harsh"); capacity; riches.
- **Codex** (light in M1): the data preview becomes the codex, reached from the map: every
  system's real data and sources, how the estimates are made, and the data's licences.

## 7. Tests

The same seed gives the same bodies; another seed different ones; known planets keep every
observed value; generated orbits keep clear of known ones; each star kind yields bodies in the
ranges above; Sol's bodies are exactly NASA's; every number is whole; Earth is comfortable for
humans and Mars harsh; the panels work on a phone and a desktop.
