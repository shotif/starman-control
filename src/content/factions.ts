// The playable factions (D-08, D-20), as data. Nothing in the rules assumes which one is the player,
// or that a faction is human: a faction names its species, and its traits are effects the rules
// read. Names, colours and descriptions follow Starman Reborn's src/economy/factions.ts (D-10).
// Every faction is fiction.

import type { SystemId } from '../data/types.ts';
import type { SpeciesId } from './species.ts';
import type { TreatyKind } from './treaties.ts';

export type FactionId = 'sta' | 'frontier' | 'hollow-wake';

/**
 * How a power builds: each has its own buildings in the colony view (D-28, COLONY_VIEW.md §3). An
 * alien species brings its own when it arrives (D-12).
 */
export type ArchitectureId = 'authority' | 'cooperative' | 'wake';

/** A shape drawn beside the colour wherever a faction is shown, so colour is never the only cue. */
export type FactionMark = 'square' | 'circle' | 'triangle';

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

export interface FactionDef {
  id: FactionId;
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
}

export const FACTIONS: Record<FactionId, FactionDef> = {
  sta: {
    id: 'sta',
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
    asks: { 'open-lanes': 10, 'shared-research': 40, border: 10, trade: 10 },
  },
  frontier: {
    id: 'frontier',
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
    asks: { 'open-lanes': 10, 'shared-research': 10, border: 10, trade: 0 },
  },
  'hollow-wake': {
    id: 'hollow-wake',
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
    asks: { 'open-lanes': null, 'shared-research': 10, border: 20, trade: 15 },
  },
};

export const FACTION_IDS: readonly FactionId[] = ['sta', 'frontier', 'hollow-wake'];

export function isFactionId(id: unknown): id is FactionId {
  return typeof id === 'string' && (FACTION_IDS as readonly string[]).includes(id);
}
