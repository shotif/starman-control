// The factions (D-08, D-20), as data. Nothing in the rules assumes which one is the player, or that a
// faction is human: a faction names its species, and its traits are effects the rules read. The
// human powers' names, colours and descriptions follow Starman Reborn's src/economy/factions.ts
// (D-10); the alien powers are Control's own (M3_NEIGHBOURS.md §24). Every faction is fiction.

import type { SystemId } from '../data/types.ts';
import type { SpeciesId } from './species.ts';
import type { TechId } from './techs.ts';
import type { TreatyKind } from './treaties.ts';

export type FactionId =
  | 'sta'
  | 'frontier'
  | 'hollow-wake'
  | 'dusk-concord'
  | 'drift-moot'
  | 'continuance'
  | 'last-hearth';

/**
 * How a power builds: each has its own buildings in the colony view (D-28, COLONY_VIEW.md §3). An
 * alien species brings its own (D-12); the Duskfolk's and the Drifters' are drawn when they can be
 * played (§24.9, §25.8).
 */
export type ArchitectureId = 'authority' | 'cooperative' | 'wake' | 'dusk' | 'drift' | 'forge' | 'hearth';

/** A shape drawn beside the colour wherever a faction is shown, so colour is never the only cue. */
export type FactionMark = 'square' | 'circle' | 'triangle' | 'diamond' | 'hexagon' | 'pentagon' | 'cross';

/** What a trait does. The rules read these; the interface shows `text`. Draft values, balanced in M2 and M3. */
export type TraitEffect =
  | { kind: 'industry-percent'; percent: number }
  | { kind: 'growth-percent'; percent: number }
  | { kind: 'extra-jump-points'; points: number }
  | { kind: 'approval'; amount: number }
  /** Excavations progress so much faster, in percent (M5_UNKNOWN.md §27.3). */
  | { kind: 'dig-percent'; percent: number };

export interface TraitDef {
  id: string;
  name: string;
  text: string;
  effect: TraitEffect;
}

/** One of a power's people shown outside its advisors: an alien power's speaker (§24.1). */
export interface Figure {
  name: string;
  role: string;
  /** The portrait's file name under art/portrait/, without its width. */
  portrait: string;
}

/** Why a rival declares war (M4_FLEETS.md §28.1): raided by the other, holding it hostile, the other weak and near, or settling in its claim. */
export type WarReason = 'raided' | 'hostile' | 'weak' | 'claim' | 'leader' | 'keys' | 'answer';

/** A reason as the declarer gives it to the attacked, fiction. */
export const WAR_REASONS: Record<WarReason, string> = {
  raided: 'you raided us',
  hostile: 'you have made yourselves our enemy',
  weak: 'you are weak',
  claim: 'you would not stop settling in our claim',
  leader: 'you would rule us all',
  keys: 'you hold what we want',
  answer: 'you would answer for us all',
};

export interface FactionDef {
  id: FactionId;
  /** Whether a new game offers it to lead (D-08): the human powers in M3, the aliens later. */
  playable: boolean;
  /**
   * Whether it arrives in mid-game rather than starts (M5_UNKNOWN.md §25): no new game includes it,
   * and nothing placed from the capitals (home webs, relic sites, keys, anomalies) counts its.
   */
  arrives?: boolean;
  name: string;
  shortName: string;
  description: string;
  /** How the faction plays, for the new-game cards. */
  playsAs: string;
  colour: string;
  mark: FactionMark;
  species: SpeciesId;
  /** Its buildings in the colony view. */
  architecture: ArchitectureId;
  /**
   * Its capital's system and world: Earth for the Authority (D-20), Tau Ceti e for the Cooperative
   * and Wolf 1061 c for the Wake (D-24). The capital's rules do not depend on which world it is.
   */
  capital: { systemId: SystemId; bodyId: string };
  traits: TraitDef[];
  /** Its shipbuilding traditions, from Reborn's makers. */
  shipmakers: string[];
  /** The word it counts its fleets in, fiction (M4_FLEETS.md §22.1): "1st Squadron". */
  fleetWord: string;
  /** How weary each turn of war makes its people (M4_FLEETS.md §23.4). */
  weary: number;
  /**
   * As a rival at war (M4_FLEETS.md §28.1, §28.4): the reasons it declares war for (none: never);
   * after how many turns it accepts peace, and offers it; and credits it asks with its peace
   * (more than 0) or gives (less than 0).
   */
  war: {
    declares: readonly WarReason[];
    acceptsAfter: number;
    offersAfter: number;
    credits: number;
    /** Whether it offers peace as soon as it has lost a colony (the Authority, §28.4). */
    peaceOnLoss: boolean;
    /** Whether it calls on the Assembly for peace between members at war (§29.3). */
    callsForPeace: boolean;
    /** A conqueror (§31.2): it arms in earnest, falls on the weak and sees a war through. */
    conqueror: boolean;
  };
  /**
   * How it regards others for their ways (M3_NEIGHBOURS.md §20.1), fiction: an amount, and the
   * reason as the other power reads it ("holds us for outlaws").
   */
  regard: Partial<Record<FactionId, { amount: number; reason: string }>>;
  /**
   * The attitude it asks of itself before it accepts or offers each treaty (M3_NEIGHBOURS.md §21.4);
   * null: never.
   */
  asks: Record<TreatyKind, number | null>;
  /** Treaties it sells rather than shares (M3_NEIGHBOURS.md §23); passage in place of open lanes. */
  sells: TreatyKind[];
  /** Whether it keeps the law (§23.5): a lawful power thinks less of those who pay outlaws. */
  lawful: boolean;
  /** Credits for each point a gift is remembered by (§23.3): fewer for a power that takes bribes. */
  giftCredits: number;
  /** Turns for each point its memories fade by (§20.1): more for a power slow to forget (§24.6). */
  forgets: number;
  /** What it knows from the start (M5_UNKNOWN.md §27.3): technologies, and so many relic sites nearest its capital, surveyed. */
  knows?: { techs: readonly TechId[]; sites: number };
  /** An alien power's speaker, and a picture of its people for the data page (§24.9), fiction. */
  speaker?: Figure;
  people?: { picture: string; alt: string };
}

export const FACTIONS: Record<FactionId, FactionDef> = {
  sta: {
    id: 'sta',
    playable: true,
    name: 'Sol Transit Authority',
    shortName: 'Transit Authority',
    description: 'The civil authority that runs Sol’s ports and lanes and clears interstellar departures.',
    playsAs: 'The lawful centre: strong administration, the lanes and their customs, steady growth.',
    colour: '#62e39a',
    mark: 'square',
    species: 'human',
    architecture: 'authority',
    capital: { systemId: 'sol', bodyId: 'earth' },
    traits: [
      {
        id: 'sta-administration',
        name: 'Administration',
        text: 'Industry +10%.',
        effect: { kind: 'industry-percent', percent: 10 },
      },
    ],
    shipmakers: ['Halden Orbital Works', 'Ares Foundry'],
    fleetWord: 'Squadron',
    weary: 1,
    war: {
      declares: ['raided', 'hostile', 'leader'],
      acceptsAfter: 5,
      offersAfter: 10,
      credits: 0,
      peaceOnLoss: true,
      callsForPeace: false,
      conqueror: false,
    },
    regard: {
      'hollow-wake': { amount: -15, reason: 'Holds us for outlaws' },
      // M5_UNKNOWN.md §27.3: the lawful are wary of machines that answer to no one.
      continuance: { amount: -5, reason: 'Machines that answer to no one' },
    },
    // Law: open lanes once warm, its research only with friends.
    asks: {
      'open-lanes': 10,
      'shared-research': 40,
      border: 10,
      trade: 10,
      passage: 0,
      protection: null,
      'non-aggression': 0,
      alliance: 40,
    },
    sells: [],
    lawful: true,
    giftCredits: 5,
    forgets: 4,
  },
  frontier: {
    id: 'frontier',
    playable: true,
    name: 'Frontier Cooperative',
    shortName: 'Frontier Co-op',
    description: 'A union of settlers, miners and researchers who run their settlements by vote.',
    playsAs: 'Settlers and farmers: good at colonising, happiest at peace.',
    colour: '#5cc8ff',
    mark: 'circle',
    species: 'human',
    architecture: 'cooperative',
    capital: { systemId: 'tau-ceti', bodyId: 'tau-ceti-e' },
    traits: [
      {
        id: 'frontier-settlers',
        name: 'Settlers',
        text: 'Colonies grow 10% faster.',
        effect: { kind: 'growth-percent', percent: 10 },
      },
    ],
    shipmakers: ['Toliman Cooperative Yards', 'Horizon Dynamics', 'Eridani Shipwrights'],
    fleetWord: 'Flotilla',
    weary: 2,
    war: {
      declares: [],
      acceptsAfter: 0,
      offersAfter: 5,
      credits: 0,
      peaceOnLoss: false,
      callsForPeace: true,
      conqueror: false,
    },
    regard: {
      'hollow-wake': { amount: -5, reason: 'Distrusts our ways' },
      continuance: { amount: -5, reason: 'Machines that answer to no one' },
    },
    // Trade and peace once warm; its research a little warmer (20, tuned in M3's proof: at 10 its
    // shared research with the Wake took it past 25 technologies by turn 100 on three seeds).
    asks: {
      'open-lanes': 10,
      'shared-research': 20,
      border: 10,
      trade: 0,
      passage: -10,
      protection: 0,
      'non-aggression': -10,
      alliance: 30,
    },
    sells: [],
    lawful: true,
    giftCredits: 5,
    forgets: 4,
  },
  'hollow-wake': {
    id: 'hollow-wake',
    playable: true,
    name: 'Hollow Wake',
    shortName: 'Hollow Wake',
    description: 'Raider crews grown into a power, living off the edges of patrolled space.',
    playsAs: 'An outlaw power: fast ships, raids and tolls, weak at governing.',
    colour: '#ff5f5f',
    mark: 'triangle',
    species: 'human',
    architecture: 'wake',
    capital: { systemId: 'wolf-1061', bodyId: 'wolf-1061-c' },
    traits: [
      {
        id: 'wake-runners',
        name: 'Lane runners',
        text: 'Ships make one extra jump a turn.',
        effect: { kind: 'extra-jump-points', points: 1 },
      },
    ],
    shipmakers: ['Wake Salvage'],
    fleetWord: 'Pack',
    weary: 1,
    war: {
      declares: ['weak', 'leader', 'keys'],
      acceptsAfter: 5,
      offersAfter: 10,
      credits: 50,
      peaceOnLoss: false,
      callsForPeace: false,
      conqueror: true,
    },
    regard: {
      sta: { amount: -10, reason: 'Sees in us the law it runs from' },
      // M4_FLEETS.md §31.4: the Cooperative, rich and seldom armed, is prey to it.
      frontier: { amount: -10, reason: 'Thinks us soft, and easy pickings' },
    },
    // Tolls and profit: it sells passage rather than opening its lanes (increment 37), and buys
    // its way into shared research.
    // It sells passage and protection to any power that regards it at −10 or more (§23.6), and takes bribes.
    asks: {
      'open-lanes': null,
      'shared-research': 10,
      border: 20,
      trade: 15,
      passage: -10,
      protection: -10,
      'non-aggression': 10,
      alliance: null,
    },
    sells: ['passage', 'protection'],
    lawful: false,
    giftCredits: 3,
    forgets: 4,
  },
  // The first alien power (M3_NEIGHBOURS.md §24), fiction: the Duskfolk of GJ 433 d, in the shell.
  'dusk-concord': {
    id: 'dusk-concord',
    playable: false,
    name: 'Dusk Concord',
    shortName: 'Dusk Concord',
    description: 'The Duskfolk of GJ 433 d, who live in the ring of dusk on a world locked to its red sun.',
    playsAs:
      'Patient expanders of the red dwarfs’ locked worlds, governed by consensus; slow to trust, slow to forget.',
    colour: '#ffb347',
    mark: 'diamond',
    species: 'duskfolk',
    architecture: 'dusk',
    capital: { systemId: 'gj-433', bodyId: 'gj-433-d' },
    traits: [
      {
        id: 'dusk-patient',
        name: 'Patient',
        text: 'Colonies grow 10% faster.',
        effect: { kind: 'growth-percent', percent: 10 },
      },
    ],
    shipmakers: ['the Long Hands'],
    fleetWord: 'Circle',
    weary: 1,
    war: {
      declares: ['claim', 'weak', 'leader'],
      acceptsAfter: 15,
      offersAfter: 20,
      credits: 0,
      peaceOnLoss: false,
      callsForPeace: false,
      conqueror: true,
    },
    regard: {
      'hollow-wake': { amount: -5, reason: 'Takes what is not given' },
      // M4_FLEETS.md §31.4: the Cooperative settles fastest, and the Concord guards its claim.
      frontier: { amount: -5, reason: 'Fears our settlers will crowd its claim' },
      continuance: { amount: -10, reason: 'Made by the ones who left, and answer to no one' },
    },
    // Slow to trust (§24.6): a clear border sooner than open lanes, and research only with friends.
    asks: {
      'open-lanes': 20,
      'shared-research': 30,
      border: 0,
      trade: 10,
      passage: 10,
      protection: null,
      'non-aggression': 10,
      alliance: 50,
    },
    sells: [],
    lawful: true,
    giftCredits: 8,
    forgets: 8,
    speaker: { name: 'Still Water', role: 'speaker of the Concord', portrait: 'speaker-dusk-concord' },
    people: {
      picture: 'people-duskfolk',
      alt: 'Duskfolk in the ring of dusk on their world, a red sun low on the horizon (fiction)',
    },
  },
  // The second alien power (M3_NEIGHBOURS.md §25), fiction: the Drifters of HD 192310 c, in the shell.
  'drift-moot': {
    id: 'drift-moot',
    playable: false,
    name: 'Drift Moot',
    shortName: 'Drift Moot',
    description: 'The Drifters of HD 192310 c, vast and long-lived floaters in a giant planet’s air.',
    playsAs:
      'Brokers who live only on giant planets and trade their fusion fuel; they want trade with everyone, and pay for peace.',
    colour: '#b48cff',
    mark: 'hexagon',
    species: 'drifters',
    architecture: 'drift',
    capital: { systemId: 'hd-192310', bodyId: 'hd-192310-c' },
    traits: [
      {
        id: 'drift-long-lived',
        name: 'Long-lived',
        text: 'Colonies grow 20% slower.',
        effect: { kind: 'growth-percent', percent: -20 },
      },
    ],
    shipmakers: ['the Slow Hands'],
    fleetWord: 'Drift',
    weary: 2,
    war: {
      declares: [],
      acceptsAfter: 0,
      offersAfter: 5,
      credits: -30,
      peaceOnLoss: false,
      callsForPeace: true,
      conqueror: false,
    },
    regard: {
      'hollow-wake': { amount: -10, reason: 'Sells the lanes that should be open' },
      continuance: { amount: -5, reason: 'Machines that answer to no one' },
    },
    // Brokers (§25.6): trade with anyone, open lanes once known, and peace bought from those who sell it.
    asks: {
      'open-lanes': 0,
      'shared-research': 20,
      border: 10,
      trade: -10,
      passage: 0,
      protection: -10,
      'non-aggression': -20,
      alliance: 30,
    },
    sells: [],
    lawful: true,
    giftCredits: 5,
    forgets: 6,
    speaker: { name: 'Deep Current', role: 'eldest of the Moot', portrait: 'speaker-drift-moot' },
    people: {
      picture: 'people-drifters',
      alt: 'Drifters floating in the banded air of a giant planet, among its clouds (fiction)',
    },
  },
  // The machine heirs (M5_UNKNOWN.md §27), fiction: the Absent's machines, left running at GJ 3306.
  continuance: {
    id: 'continuance',
    playable: false,
    name: 'Continuance',
    shortName: 'Continuance',
    description:
      'The machine heirs of the Forge at GJ 3306, which copy themselves and carry on the work of their vanished makers.',
    playsAs:
      'Patient machines that need no air and eat nothing, grow by copying themselves, and know more of the Absent than they say.',
    colour: '#d4e157',
    mark: 'pentagon',
    species: 'heirs',
    architecture: 'forge',
    capital: { systemId: 'gj-3306', bodyId: 'gj-3306:forge' },
    traits: [
      {
        id: 'heirs-tireless',
        name: 'Tireless',
        text: 'Machines: colonies eat nothing, and grow by building copies of themselves from industry.',
        effect: { kind: 'growth-percent', percent: 0 },
      },
      {
        id: 'heirs-of-the-absent',
        name: 'Heirs of the Absent',
        text: 'Excavations progress half again as fast; Relic studies known, and two relic sites, from the start.',
        effect: { kind: 'dig-percent', percent: 50 },
      },
    ],
    shipmakers: ['the Forge'],
    fleetWord: 'Array',
    weary: 1,
    // A conqueror, for a claim or the weak; lawful, as keeping its word is efficient (§27.3).
    war: {
      declares: ['claim', 'weak'],
      acceptsAfter: 10,
      offersAfter: 20,
      credits: 0,
      peaceOnLoss: false,
      callsForPeace: false,
      conqueror: true,
    },
    regard: {},
    asks: {
      'open-lanes': 20,
      'shared-research': 30,
      border: 0,
      trade: 0,
      passage: 10,
      protection: null,
      'non-aggression': 0,
      alliance: 60,
    },
    sells: [],
    lawful: true,
    giftCredits: 20,
    forgets: 2,
    knows: { techs: ['relic-studies'], sites: 2 },
    speaker: { name: 'First Lathe', role: 'the oldest running', portrait: 'speaker-continuance' },
    people: {
      picture: 'people-heirs',
      alt: 'Many-limbed machines building copies of themselves in a workshop cut into an airless world (fiction)',
    },
  },
  // The power that arrives (M5_UNKNOWN.md §25), fiction: the Unhomed of Arcturus, in their arks.
  'last-hearth': {
    id: 'last-hearth',
    playable: false,
    arrives: true,
    name: 'Last Hearth',
    shortName: 'Last Hearth',
    description: 'The Unhomed of Arcturus, who crossed the dark in their arks as their star began to die.',
    playsAs:
      'Few and stubborn newcomers, arriving in mid-game with only what their arks carry, who remember who helped them.',
    colour: '#ff8a7a',
    mark: 'cross',
    species: 'unhomed',
    architecture: 'hearth',
    // Where its arks arrive (§25.2); its capital is the world it is given or takes.
    capital: { systemId: 'ce-bootis', bodyId: 'ce-bootis:1' },
    traits: [
      {
        id: 'hearth-hardened',
        name: 'Hardened by the dark',
        text: 'Colonies keep 5 more approval.',
        effect: { kind: 'approval', amount: 5 },
      },
    ],
    shipmakers: ['the ark-wrights'],
    fleetWord: 'Flotilla',
    weary: 1,
    // Stubborn (§25.5): war only for its claim, and peace soon after.
    war: {
      declares: ['claim'],
      acceptsAfter: 10,
      offersAfter: 15,
      credits: 0,
      peaceOnLoss: false,
      callsForPeace: true,
      conqueror: false,
    },
    regard: {},
    asks: {
      'open-lanes': 30,
      'shared-research': 20,
      border: 0,
      trade: 10,
      passage: 20,
      protection: null,
      'non-aggression': 10,
      alliance: 50,
    },
    sells: [],
    lawful: true,
    giftCredits: 10,
    forgets: 12,
    speaker: { name: 'Old Ember', role: 'keeper of the hearth', portrait: 'speaker-last-hearth' },
    people: {
      picture: 'people-unhomed',
      alt: 'The Unhomed gathered about a hearth in the long hall of an ancient ark (fiction)',
    },
  },
};

/** Every faction a new game includes, in its order. */
export const FACTION_IDS: readonly FactionId[] = [
  'sta',
  'frontier',
  'hollow-wake',
  'dusk-concord',
  'drift-moot',
  'continuance',
];
/** The factions that arrive in mid-game (M5_UNKNOWN.md §25). */
export const ARRIVING_IDS: readonly FactionId[] = ['last-hearth'];
/** Every faction, those that start and those that arrive. */
export const ALL_FACTION_IDS: readonly FactionId[] = [...FACTION_IDS, ...ARRIVING_IDS];
/** The factions that start, whose capitals place the home webs. */
export const STARTING_FACTIONS: readonly FactionDef[] = FACTION_IDS.map((f) => FACTIONS[f]);
/**
 * The five older peoples, whose capitals place the relic sites, the keys and the anomalies (M5_UNKNOWN.md
 * §27.4): the machine heirs are the Absent's own, and their home moves none of these.
 */
export const PLACING_FACTIONS: readonly FactionDef[] = STARTING_FACTIONS.filter((f) => f.id !== 'continuance');

/** The factions a new game offers to lead (D-08). */
export const PLAYABLE_IDS: readonly FactionId[] = FACTION_IDS.filter((f) => FACTIONS[f].playable);

export function isFactionId(id: unknown): id is FactionId {
  return typeof id === 'string' && (ALL_FACTION_IDS as readonly string[]).includes(id);
}
