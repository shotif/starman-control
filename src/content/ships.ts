// Ships in M1 (docs/design/M1_FIRST_LIGHT.md §6, M1_TURNS.md §2), as data. Costs are paid when ships
// are built (increment 5). Names follow the naming traditions of Starman Reborn's shipmakers
// (src/content/ships in Reborn; D-10); every name here is the game's own.

export type ShipType = 'survey' | 'outpost' | 'colony';

export interface ShipDef {
  type: ShipType;
  name: string;
  does: string;
  cost: { industry: number; metals: number; volatiles: number };
  /** Can jump without a lane (§6). */
  blindJumps: boolean;
}

export const SHIPS: Record<ShipType, ShipDef> = {
  survey: {
    type: 'survey',
    name: 'Survey ship',
    does: 'Surveys the systems it reaches; the only ship that can jump blind.',
    cost: { industry: 30, metals: 0, volatiles: 0 },
    blindJumps: true,
  },
  outpost: {
    type: 'outpost',
    name: 'Outpost ship',
    does: 'Founds an outpost on any body, and is used up.',
    cost: { industry: 40, metals: 10, volatiles: 0 },
    blindJumps: false,
  },
  colony: {
    type: 'colony',
    name: 'Colony ship',
    does: 'Founds a colony on a world its people can live on, and is used up.',
    cost: { industry: 80, metals: 20, volatiles: 10 },
    blindJumps: false,
  },
};

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
