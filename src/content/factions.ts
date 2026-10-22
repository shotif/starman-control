// The factions (D-08, D-20), as data. Nothing in the rules assumes which one is the player, or that a
// faction is human: a faction names its species, and its traits are effects the rules read. The
// human powers' names, colours and descriptions follow Starman Reborn's src/economy/factions.ts
// (D-10); the alien powers are Control's own (M3_NEIGHBOURS.md §24). Every faction is fiction.

import type { SystemId } from '../data/types.ts';
import type { SpeciesId } from './species.ts';
import type { TreatyKind } from './treaties.ts';

export type FactionId = 'sta' | 'frontier' | 'hollow-wake' | 'dusk-concord';

/**
 * How a power builds: each has its own buildings in the colony view (D-28, COLONY_VIEW.md §3). An
 * alien species brings its own (D-12); the Duskfolk's are drawn when they can be played (§24.9).
 */
export type ArchitectureId = 'authority' | 'cooperative' | 'wake' | 'dusk';

/** A shape drawn beside the colour wherever a faction is shown, so colour is never the only cue. */
export type FactionMark = 'square' | 'circle' | 'triangle' | 'diamond';

/** What a trait does. The rules read these; the interface shows `text`. Draft values, balanced in M2 and M3. */
export type TraitEffect =
  | { kind: 'industry-percent'; percent: number }
  | { kind: 'growth-percent'; percent: number }
  | { kind: 'extra-jump-points'; points: number };

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

export interface FactionDef {
  id: FactionId;
  /** Whether a new game offers it to lead (D-08): the human powers in M3, the aliens later. */
  playable: boolean;
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
    regard: { 'hollow-wake': { amount: -15, reason: 'Holds us for outlaws' } },
    // Law: open lanes once warm, its research only with friends.
    asks: { 'open-lanes': 10, 'shared-research': 40, border: 10, trade: 10, passage: 0, protection: null },
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
        text: 'Colonies grow 20% faster.',
        effect: { kind: 'growth-percent', percent: 20 },
      },
    ],
    shipmakers: ['Toliman Cooperative Yards', 'Horizon Dynamics', 'Eridani Shipwrights'],
    regard: { 'hollow-wake': { amount: -5, reason: 'Distrusts our ways' } },
    // Trade and peace: both once warm.
    asks: { 'open-lanes': 10, 'shared-research': 10, border: 10, trade: 0, passage: -10, protection: 0 },
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
    regard: { sta: { amount: -10, reason: 'Sees in us the law it runs from' } },
    // Tolls and profit: it sells passage rather than opening its lanes (increment 37), and buys
    // its way into shared research.
    // It sells passage and protection to any power that regards it at −10 or more (§23.6), and takes bribes.
    asks: { 'open-lanes': null, 'shared-research': 10, border: 20, trade: 15, passage: -10, protection: -10 },
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
    regard: { 'hollow-wake': { amount: -5, reason: 'Takes what is not given' } },
    // Slow to trust (§24.6): a clear border sooner than open lanes, and research only with friends.
    asks: { 'open-lanes': 20, 'shared-research': 30, border: 0, trade: 10, passage: 10, protection: null },
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
};

export const FACTION_IDS: readonly FactionId[] = ['sta', 'frontier', 'hollow-wake', 'dusk-concord'];

/** The factions a new game offers to lead (D-08). */
export const PLAYABLE_IDS: readonly FactionId[] = FACTION_IDS.filter((f) => FACTIONS[f].playable);

export function isFactionId(id: unknown): id is FactionId {
  return typeof id === 'string' && (FACTION_IDS as readonly string[]).includes(id);
}
