// The numbers of the rules (docs/design/M1_FIRST_LIGHT.md, M2_WORLDS.md), in one place so they can
// be balanced.
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
    /** Room for 12 units, whatever its world (§5): its own 8 and two housing districts (M2). */
    capacity: 120,
    /** Its own room, in tenths, before its housing districts (M2_WORLDS.md §2). */
    room: 80,
    /** Extra industry from generations of building. */
    industry: 2,
    /** Research of its own, from its old universities (M2_WORLDS.md §2). */
    research: 3,
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
    /** Industry every colony but the capital makes of its own, so it can always pay to zone (D-42). */
    industry: 2,
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
  lanes: {
    /** How far a new lane can reach, until research extends it (M1_LANES_RESEARCH.md §1). */
    reachDeci: 60,
    /** Industry for a new lane: a base, and so much a light-year. */
    industryBase: 20,
    industryPerLy: 6,
    metalsPerLy: 1,
    fuelPerLy: 2,
    /** Turns it is tuned once paid for: one, and one more for every 3 light-years. */
    tuningTurns: 1,
    deciPerTuningTurn: 30,
  },
  districts: {
    /** A capital has this many districts, whatever its world (M2_WORLDS.md §2). */
    capital: 10,
    /** What zoning or rezoning a district costs, built in the colony's queue. */
    zoneCost: { industry: 20, metals: 5, volatiles: 0, fuel: 0 },
    /** People, in tenths, who work one district: a million. */
    workers: 10,
    /** Food from a worked farm district, by how habitable the world is; at a capital, the most. */
    farms: { comfortable: 3, tolerable: 2, harsh: 1 },
    works: 3,
    labs: 2,
    market: 2,
    /** A market district where the colony has a lane station. */
    marketWithStation: 3,
    /** Room a housing district adds, in tenths. */
    housing: 20,
    /** How every capital starts, slot by slot from the first (M2_WORLDS.md §2). */
    capitalStart: ['housing', 'housing', 'farms', 'farms', 'works', 'works', 'works', 'mines', 'labs', 'market'],
    /** How a new colony arrives, as far as its world has districts: its founders' farms, then works (D-42). */
    founding: ['farms', 'works'],
  },
  food: {
    /** A colony eats 1 food for every this many tenths of people (2 million), rounded up. */
    eatenPer: 20,
    /** The capital's network keeps this much in store for each colony in it. */
    storePerColony: 5,
    /** What a power's store holds at the start: as much as the capital's network keeps. */
    start: 5,
    /** Hungry this many turns in a row, a colony starts to lose people: a tenth a turn. */
    starveAfter: 3,
  },
  credits: {
    /** The treasury at the start (M2_WORLDS.md §4). */
    start: 50,
    /** A credit for every so many tenths of people, by tax rate: 4 million, 2 million, a million. */
    taxPer: { low: 40, standard: 20, high: 10 },
    /** Upkeep a turn for each ship and outpost; each project's is its own (src/content/projects.ts). */
    upkeep: { ship: 1, outpost: 1 },
    /** Overdrive: each step buys a quarter of a colony's industry, at 1, 2 and 4 credits apiece. */
    overdriveSteps: [1, 2, 4],
  },
  approval: {
    /** Where every colony starts, and the parts that move it (M2_WORLDS.md §5). */
    base: 60,
    taxes: { low: 10, standard: 0, high: -15 },
    capital: 10,
    hungry: -15,
    full: -5,
    domes: -5,
    /** For each lane jump beyond `nearJumps` from the capital, at most `farMost`; `farMost` with no lane. */
    far: -2,
    nearJumps: 3,
    farMost: -12,
    debt: -10,
    /** The levels: content from 60, uneasy from 40, unrest from 20, revolt below; and what each keeps of the districts' yields. */
    levels: { content: 60, uneasy: 40, unrest: 20 },
    keeps: { content: 100, uneasy: 90, unrest: 70, revolt: 0 },
  },
  /** M2's projects (M2_WORLDS.md §6, §23.1). */
  projects: {
    hydroponicsFood: 3,
    exchangeCredits: 3,
    /** Approval from a civic centre here, and from one within `civicJumps` lane jumps. */
    civicHere: 10,
    civicNear: 5,
    civicJumps: 2,
    recreation: 10,
    instituteResearch: 3,
    /** Each worked lab with an institute yields this much more. */
    instituteLab: 1,
    fusionIndustry: 4,
    fusionFuel: 1,
    refineryVolatiles: 1,
    refineryFuel: 2,
    /** Room an arcology adds, in tenths. */
    arcology: 40,
    medicalPercent: 25,
  },
  outposts: {
    /** Industry an outpost makes for its queue, which holds lanes only. */
    industry: 2,
  },
  homeWeb: {
    /** Reborn's lanes within this many jumps of a capital make its home web (D-19a). */
    jumps: 2,
    /** Every power's web is trimmed to this many systems, Tau Ceti's being the smallest (§3). */
    systems: 7,
  },
} as const;
