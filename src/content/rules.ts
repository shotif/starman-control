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
  /** Where research comes from besides labs (M2B_SCIENCE.md §4, §16, D-44). */
  research: {
    /** A colony's people make 1 research for every so many tenths of them (4 million): its scholars. */
    scholarsPer: 40,
    /** Each technology costs this much more, in percent of its base, for every one already known (§18.1, tuned). */
    risePercent: 8,
    /** A technology costs this much less, in percent, for each power met that knows it, at most `spreadMost` (§19.2). */
    spreadPercent: 15,
    spreadMost: 30,
    /** The standings call a rival ahead or behind with this many technologies more or fewer (§19.4). */
    standingsGap: 3,
  },
  /** The great works (M2B_SCIENCE.md §20.2). */
  greatWorks: {
    /** The Long Array sees ships this far, in tenths of a light-year. */
    arrayDeci: 200,
    arrayObservationPercent: 100,
    archiveResearchPercent: 20,
    foundryLanePercent: 50,
    commonsApproval: 5,
    commonsGrowthPercent: 10,
    /** A colony that loses the race keeps this share of its industry, in percent. */
    lostKeepsPercent: 50,
  },
  /** The score (M2B_SCIENCE.md §20.3, D-50). */
  score: { colony: 10, millionPeople: 1, technology: 5, lane: 3, greatWork: 50 },
  /** Contact (M3_NEIGHBOURS.md §19.1, D-52). */
  contact: {
    /** Translation needed before powers of different species can talk. */
    wordsToTalk: 20,
    /** Translation gained in a turn when anything of theirs is in sight. */
    wordsSeen: 1,
  },
  /** Treaties (M3_NEIGHBOURS.md §21, D-53). */
  treaties: {
    /** Turns a treaty holds once notice is given. */
    notice: 5,
    /** With shared research, a technology the partner knows costs this much less, and knowledge at most this. */
    sharedPercent: 25,
    sharedMost: 50,
    /** The rivals offer every so many turns; a rival with more credits than this may send a gift, so many, at most once in so many turns, to a power within so much of a treaty it wants. */
    offerEvery: 5,
    giftAbove: 150,
    gift: 50,
    giftEvery: 10,
    giftWithin: 10,
    /** Trade (§22.4): 1 credit for every so many colonies of the smaller side, and so many for each open lane joining them, at most so many. */
    tradeColonies: 4,
    tradeLane: 1,
    tradeMost: 10,
    /** Passage's toll (§23.2): so much for each of the seller's open lanes, between these. */
    tollPerLane: 1,
    tollLeast: 2,
    tollMost: 8,
    /** Protection's price a turn (§23.4). */
    protection: 5,
    /**
     * A rival sells or buys passage or protection only to or as a buyer with so many credits in
     * hand, and gives notice on what it pays for below `keep` while its treasury falls.
     */
    afford: 75,
    keep: 40,
    /** A lawful power's regard for each power it knows that pays an outlaw (§23.5). */
    lawfulDeals: -5,
  },
  /** Exchanges of resources (M3_NEIGHBOURS.md §23.1). */
  exchanges: {
    /** Amounts in steps of so many, at most so many. */
    step: 10,
    most: 100,
    /** What a rival thinks a credit and a unit of a resource worth, and twice that when it holds less than `short`. */
    credit: 1,
    unit: 2,
    short: 20,
    /** What it must get for what it gives, in percent, by its regard (§23.1); hostile never. */
    asks: { friendly: 80, warm: 100, neutral: 100, cold: 130 } as Record<string, number>,
    /** A rival short of a resource offers so many credits for so much of it, every few turns, with more credits than this. */
    offerCredits: 40,
    offerAmount: 20,
    offerAbove: 100,
    /** A broker (M3_NEIGHBOURS.md §25.6) offers so much of what it holds more than `surplus` of, for credits. */
    surplus: 150,
  },
  /** War and peace (M4_FLEETS.md §23, D-64). */
  war: {
    /** Remembered by the power war is declared on; by every other power in contact with the declarer, more by the lawful. */
    declared: -30,
    heard: -5,
    heardLawful: -10,
    /** Counted in the regard of a power at war with another while it lasts. */
    atWar: -20,
    /** Turns of truce after peace, in which neither may declare war. */
    truce: 10,
    /** A rival makes peace once a war has lasted so many turns, and offers it every so many turns once it has lasted so many. */
    peaceAfter: 5,
    offerPeaceAfter: 10,
    /** Weariness at which a rival takes any peace offered (M4_FLEETS.md §28.4). */
    badly: 30,
    offerPeaceEvery: 5,
    /** Weariness: each turn at peace rests so much; every so much costs a point of approval, at most so many. */
    wearyRest: 2,
    wearyPer: 5,
    wearyMost: 15,
    /** Weariness for each warship and each other ship lost (increment 44). */
    wearyWarship: 2,
    wearyShip: 1,
  },
  /** Battles (M4_FLEETS.md §24, D-62). */
  battle: {
    rounds: 8,
    /** A weapon's damage at its best range, a step away and two steps away, in percent. */
    rangePercent: [100, 60, 30],
    /** The chance in a hundred to hit, and what changes it. */
    toHit: 70,
    targeting: 15,
    evading: 15,
    sizeToHit: { corvette: -10, frigate: -5, destroyer: 0, cruiser: 5, capital: 10, battery: 10 } as Record<
      string,
      number
    >,
    /** An evading task force leaves after this round. */
    evadeAfter: 2,
    /** Shields recover this share of their capacity after each round, in percent. */
    shieldRegenPercent: 20,
    /** A civil ship's structure. */
    civilStructure: 10,
    /** Repairs a turn, in percent of a ship's whole structure: at a shipyard, at a colony, by a repair bay. */
    repairYardPercent: 50,
    repairColonyPercent: 10,
    repairBayPercent: 10,
  },
  /** Defences, invasion, bombardment and blockade (M4_FLEETS.md §26). */
  invasion: {
    /** A colony's garrison: a base, one a million people, more at the capital and with barracks. */
    garrisonBase: 2,
    garrisonCapital: 5,
    garrisonBarracks: 10,
    /** People a transport takes from its colony (tenths of a million), and the fewest a colony needs to build one. */
    transportPeople: 1,
    transportLeast: 10,
    /** In each exchange of a landing, the garrison wins this many in a hundred. */
    defenderWins: 55,
    /** A colony taken is unhappy for this many turns, by this much. */
    takenTurns: 10,
    takenApproval: -20,
    /** What a colony lost adds to its old power's war weariness, and what being invaded is remembered at. */
    wearyColony: 5,
    invaded: -10,
  },
  defence: {
    /** A battery: its weapons (of its power's best), its structure, and the planetary shield's shields. */
    batteryWeapons: 3,
    batteryStructure: 60,
    planetaryShield: 30,
  },
  bombardment: {
    /** People lost a turn, in percent (at least a tenth of a million); a building wrecked one turn in this many. */
    peoplePercent: 5,
    wreckEvery: 3,
    /** Remembered by the bombed, by others in contact, and by the lawful. */
    bombed: -15,
    heard: -5,
    heardLawful: -10,
  },
  /** A blockaded colony's credits, in percent. */
  blockadeCreditsPercent: 50,
  /** The rivals at war (M4_FLEETS.md §28). */
  rivalsWar: {
    /** It looks for a war every so many turns, with at least so many warships. */
    every: 5,
    warships: 3,
    /** A neighbour's colony within this many tenths of a light-year of one of its own. */
    nearDeci: 120,
    /** Raided within so many turns; hostile as the attitude's word; not warm (neutral or worse); claims crossed. */
    raidedWithin: 10,
    hostile: -40,
    notWarm: 9,
    claims: 2,
    /** A war of choice (on the weak) not before this turn: the first years are for settling and meeting. */
    choiceFrom: 80,
    /** At war: a strike of at least so many warships, at most so many jumps, with troops to spare. */
    strike: 4,
    invadeJumps: 6,
    spareTroops: 2,
    /** After a peace, so many turns more before it goes back to war with the same power. */
    rest: 30,
  },
  /** The Assembly (M4_FLEETS.md §29): its elections, its resolutions and the rivals' votes. */
  assembly: {
    /** It forms when so many powers can each talk with the others. */
    forms: 3,
    /** An election every so many turns, the first so many after it forms. */
    every: 20,
    /** A vote for every so many tenths of a million people (a million). */
    peoplePerVote: 10,
    /** Chosen with two thirds of all the votes: so many parts in so many. */
    chosenParts: 2,
    chosenOf: 3,
    /** A member proposes at most one resolution in so many turns. */
    proposeEvery: 10,
    /** A call for peace gives so many turns; the Cooperative and the Moot call once a war has lasted so many. */
    callTurns: 5,
    callAfter: 5,
    /** A rival votes for a candidate it regards at least this well (warm). */
    warm: 10,
  },
  /** Victory (M4_FLEETS.md §30): the turn limits a new game offers, and the default; the story's pace. */
  victory: {
    limits: [150, 200, 250] as const,
    limit: 250,
    /** Every power's score is kept every so many turns. */
    historyEvery: 10,
  },
  /** Raids (M4_FLEETS.md §27): remembered by the raided and heard by the lawful; the outlaw's squadron and its pace. */
  raid: {
    raided: -10,
    heard: -5,
    /** Warships a raiding rival keeps in peace, the most jumps it goes to raid, and its pace: a raid begun every so many turns, lasting so many. */
    squadron: 2,
    /** Not before this turn, nor before it holds this many colonies: it settles first. */
    from: 30,
    colonies: 4,
    jumps: 4,
    every: 10,
    lasts: 5,
  },
  /** Memory and attitude (M3_NEIGHBOURS.md §20.1, D-55). */
  memory: {
    /** Attitude is held between these. */
    most: 100,
    /** For a power of one's own species. */
    kin: 10,
    /** 1 for every so many turns since first contact, up to `knownMost`. */
    knownEvery: 10,
    knownMost: 10,
    /** The gifts a power may send. */
    gifts: [20, 50, 100],
    /** A great work they finished that it was building. */
    greatWorkLost: -15,
    /** A colony or outpost of theirs founded in a system where it holds one. */
    settledBeside: -5,
    /** Each treaty in force between them (M3_NEIGHBOURS.md §21.1). */
    treaty: 5,
    /** A treaty ended with notice, or broken: the other remembers; every other in contact hears of a breach. */
    treatyEnded: -5,
    treatyBroken: -20,
    treatyBrokenHeard: -5,
    /** An offer misread before talk. */
    offerMisread: -5,
    /** A colony or outpost founded in a system it claims but does not hold (§22.2). */
    claimCrossed: -3,
    /** The attitude's words: each the least it takes, the first that fits. */
    words: [
      { word: 'friendly', least: 40 },
      { word: 'warm', least: 10 },
      { word: 'neutral', least: -9 },
      { word: 'cold', least: -39 },
      { word: 'hostile', least: -100 },
    ],
  },
  /** Discoveries (M2B_SCIENCE.md §17, D-45). */
  discoveries: {
    /** An inspiration gives this share of its technology's cost, in percent. */
    inspirationPercent: 40,
    /** What a first survey gives for each thing astronomers have observed in a system. */
    observations: { 'white-dwarf': 15, disc: 15, 'brown-dwarf': 10, 'flare-star': 10, planets: 10, 'many-stars': 10 },
    /** A system of this many stars or more is an observation of its own. */
    manyStars: 3,
  },
  governors: {
    /** Every governor zones a lab as every so many districts, whatever its priority (D-44). */
    labEvery: 5,
  },
  /** Attention, which pays for edicts (M2_WORLDS.md §8, §25.2). */
  attention: { start: 2, perTurn: 2, most: 6 },
  /** What the edicts do (src/content/edicts.ts names them). */
  edicts: {
    festivalApproval: 15,
    labourIndustryPercent: 25,
    labourApproval: -10,
    /** Rationing: a network eats this share of what it would, in percent, rounded up. */
    rationingEatsPercent: 75,
    rationingApproval: -10,
    crashResearchPercent: 50,
    crashIndustryPercent: -20,
    surveyJumpPoints: 1,
    martialOthersApproval: -5,
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
    /** How far a deep-space scanner sees other powers' ships, in tenths of a light-year (§26.3). */
    scannerDeci: 80,
    /** Beacon slots a lane relay adds in its system (M2B_SCIENCE.md §18.3). */
    relaySlots: 2,
    /** An orbital habitat's own districts and room, in tenths of people. */
    habitatDistricts: 2,
    habitatRoom: 20,
    /** A terraforming station's turns for a step, and its steps, before Ecopoiesis. */
    terraformTurns: 10,
    terraformSteps: 1,
  },
  /** Events (M2_WORLDS.md §27): when they come, and what each choice costs and gives. */
  events: {
    /** A 1 in `chance` draw each turn, for each power. */
    chance: 8,
    /** At most one in this many turns. */
    gap: 6,
    /** None before this turn. */
    first: 5,
    /** Founders' Day: every so many turns from the start. */
    foundersEvery: 40,
    /** Unanswered for this many turns, an event takes its first choice. */
    waits: 3,
    flarePeople: 2,
    cometCredits: 10,
    cometVolatiles: 15,
    cometResearch: 20,
    harvestCredits: 20,
    blightCredits: 20,
    blightShort: 2,
    blightLong: 5,
    strikeCredits: 25,
    strikeTurns: 2,
    strikeApproval: -10,
    /** An epidemic comes to a colony of this many tenths or more. */
    epidemicPeople: 30,
    epidemicCredits: 30,
    quarantineTurns: 4,
    quarantineApproval: -10,
    derelictMetals: 20,
    derelictResearch: 30,
    driftFuel: 10,
    driftMetals: 10,
    driftTurns: 3,
    petitionCredits: 40,
    /** People who leave with the petitioners' ship, in tenths. */
    petitionPeople: 10,
    petitionTurns: 5,
    petitionApproval: -5,
    defectorsCredits: 10,
    smugglersCredits: 15,
    smugglersFuel: 20,
    smugglersApproval: 5,
    smugglersTurns: 4,
    foundersCredits: 15,
    foundersApproval: 10,
    foundersTurns: 3,
    /** A rival takes the first choice only if its treasury keeps this much after paying. */
    rivalKeeps: 20,
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
