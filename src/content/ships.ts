// Ships (docs/design/M1_FIRST_LIGHT.md §6, M1_TURNS.md §2, M4_FLEETS.md §21.1), as data. Costs are
// paid when ships are built (increment 5). Names follow the naming traditions of Starman Reborn's
// shipmakers (src/content/ships in Reborn; D-10); every name here is the game's own.

import type { TechId } from './techs.ts';

/** A warship's hull (M4_FLEETS.md §21.1): its modules come from its design. */
export type HullId = 'corvette' | 'frigate' | 'destroyer' | 'cruiser' | 'capital';

export type ShipType = 'survey' | 'outpost' | 'colony' | 'transport' | HullId;

export interface ShipDef {
  type: ShipType;
  name: string;
  does: string;
  cost: { industry: number; metals: number; volatiles: number };
  /** Can jump without a lane (§6). */
  blindJumps: boolean;
  /** Credits a turn to keep it (M4_FLEETS.md §6). */
  upkeep: number;
  /** A warship's hull: places for modules, its own structure, and the technology it needs. */
  hull?: { places: number; structure: number; needs?: TechId };
  /** A civil ship's technology, if it needs one. */
  needs?: TechId;
  /** Troops it carries, raised from the people of the colony that builds it (M4_FLEETS.md §26.3). */
  troops?: number;
}

export const SHIPS: Record<ShipType, ShipDef> = {
  survey: {
    type: 'survey',
    name: 'Survey ship',
    does: 'Surveys the systems it reaches; the only ship that can jump blind.',
    cost: { industry: 30, metals: 0, volatiles: 0 },
    blindJumps: true,
    upkeep: 1,
  },
  outpost: {
    type: 'outpost',
    name: 'Outpost ship',
    does: 'Founds an outpost on any body, and is used up.',
    cost: { industry: 40, metals: 10, volatiles: 0 },
    blindJumps: false,
    upkeep: 1,
  },
  colony: {
    type: 'colony',
    name: 'Colony ship',
    does: 'Founds a colony on a world its people can live on, and is used up.',
    cost: { industry: 80, metals: 20, volatiles: 10 },
    blindJumps: false,
    upkeep: 1,
  },
  // M4's troop transport (M4_FLEETS.md §26.3).
  transport: {
    type: 'transport',
    name: 'Troop transport',
    does: 'Carries 5 troops, raised from its colony’s people, to invade a colony.',
    cost: { industry: 30, metals: 5, volatiles: 0 },
    blindJumps: false,
    upkeep: 1,
    needs: 'ground-forces',
    troops: 5,
  },
  // The warships' hulls (M4_FLEETS.md §21.1, D-59).
  corvette: {
    type: 'corvette',
    name: 'Corvette',
    does: 'The smallest warship: two places for modules.',
    cost: { industry: 25, metals: 8, volatiles: 0 },
    blindJumps: false,
    upkeep: 1,
    hull: { places: 2, structure: 12 },
  },
  frigate: {
    type: 'frigate',
    name: 'Frigate',
    does: 'A light warship: three places for modules.',
    cost: { industry: 40, metals: 12, volatiles: 0 },
    blindJumps: false,
    upkeep: 1,
    hull: { places: 3, structure: 20 },
  },
  destroyer: {
    type: 'destroyer',
    name: 'Destroyer',
    does: 'A warship of the line: four places for modules.',
    cost: { industry: 70, metals: 20, volatiles: 4 },
    blindJumps: false,
    upkeep: 2,
    hull: { places: 4, structure: 32, needs: 'destroyer-hulls' },
  },
  cruiser: {
    type: 'cruiser',
    name: 'Cruiser',
    does: 'A heavy warship: six places for modules.',
    cost: { industry: 120, metals: 35, volatiles: 8 },
    blindJumps: false,
    upkeep: 3,
    hull: { places: 6, structure: 55, needs: 'cruiser-hulls' },
  },
  capital: {
    type: 'capital',
    name: 'Capital ship',
    does: 'The greatest warship: eight places for modules.',
    cost: { industry: 220, metals: 60, volatiles: 15 },
    blindJumps: false,
    upkeep: 5,
    hull: { places: 8, structure: 100, needs: 'capital-hulls' },
  },
};

/** The warships' hulls, smallest first. */
export const HULLS: readonly HullId[] = ['corvette', 'frigate', 'destroyer', 'cruiser', 'capital'];

/** The ships that are not warships: built for what they do, with no design. */
export const CIVIL: readonly ShipType[] = ['survey', 'outpost', 'colony', 'transport'];

export function isHull(type: ShipType): type is HullId {
  return SHIPS[type].hull !== undefined;
}

/** What every power starts with (§5), at its capital. */
export const STARTING_FLEET: readonly ShipType[] = ['survey', 'survey', 'colony', 'outpost'];

/** Names by shipmaker, after the traditions of Reborn's makers. */
export const SHIP_NAMES: Record<string, readonly string[]> = {
  'Halden Orbital Works': ['Petrel', 'Fulmar', 'Shearwater', 'Gannet', 'Kittiwake', 'Tern', 'Skua', 'Guillemot'],
  'Ares Foundry': ['Bastion', 'Redoubt', 'Barbican', 'Parapet', 'Bulwark', 'Citadel', 'Palisade', 'Keep'],
  'Toliman Cooperative Yards': ['Juniper', 'Hawthorn', 'Alder', 'Hazel', 'Linden', 'Elder', 'Larch', 'Willow'],
  'Horizon Dynamics': ['Aperture', 'Prism', 'Lumen', 'Azimuth', 'Focal', 'Refractor', 'Ocular', 'Collimator'],
  'Eridani Shipwrights': ['Estuary', 'Confluence', 'Rill', 'Meander', 'Shoal', 'Weir', 'Backwater', 'Millrace'],
  'Wake Salvage': ['Hyena', 'Ember', 'Kite', 'Clinker', 'Marten', 'Soot', 'Shrike', 'Ashfall'],
};

const ROMAN = ['', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'];

/**
 * The name of a power's nth ship (from 0): its makers take turns, each working through its list,
 * then again with a number ("Petrel II").
 */
export function shipName(makers: readonly string[], n: number): string {
  const maker = makers[n % makers.length] as string;
  const names = SHIP_NAMES[maker] ?? ['Ship'];
  const k = Math.floor(n / makers.length);
  const round = Math.floor(k / names.length);
  return `${names[k % names.length]}${ROMAN[round] ?? ` ${round + 1}`}`;
}
