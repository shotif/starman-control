// The numbers of M1's rules (docs/design/M1_FIRST_LIGHT.md), in one place so they can be balanced.
// Distances are in tenths of a light-year (src/sim/geometry.ts); everything here is a whole number.

export const RULES = {
  calendar: {
    /** The first turn is the first quarter of this year (D-20). */
    startYear: 2176,
    /** A turn is a quarter of a year (D-16). */
    turnsPerYear: 4,
  },
  beacons: {
    /** Lanes a star can anchor (§3). */
    slots: 3,
    /** With a lane station built there. */
    slotsWithStation: 5,
  },
  start: {
    /** Every power starts with the same small stockpile (§5). */
    stockpile: { metals: 40, volatiles: 20, fuel: 40 },
  },
  capital: {
    /** People, in tenths of a unit (a unit is about a million): 10 units. */
    people: 100,
    /** Room for 12 units, whatever its world (§5). */
    capacity: 120,
    /** Extra industry from generations of building. */
    industry: 2,
    /** Resources it yields besides its world's. */
    yields: { metals: 2, volatiles: 1, fuel: 1 },
  },
  colonies: {
    /** A new colony's people, in tenths of a unit. */
    founding: 10,
    /** Growth a turn, in hundredths, before the room left is counted (M1_COLONIES.md §2). */
    growthPercent: 10,
    /** Industry kept with nothing to build. */
    storedIndustry: 60,
  },
  movement: {
    /** Jump points a ship has each turn (§6), before traits and research. */
    jumpPoints: 2,
    /** A lane up to this long costs 1 jump point; a longer one 2. */
    shortLaneDeci: 60,
  },
  blindJump: {
    /** How far a survey ship can jump without a lane, until research extends it (§3, §6). */
    reachDeci: 60,
    /** One turn for every 3 light-years, rounded up. */
    deciPerTurn: 30,
  },
  homeWeb: {
    /** Reborn's lanes within this many jumps of a capital make its home web (D-19a). */
    jumps: 2,
    /** Every power's web is trimmed to this many systems, Tau Ceti's being the smallest (§3). */
    systems: 7,
  },
} as const;
