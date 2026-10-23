// Species, as data (D-08). In M1 there is one, humans; alien species arrive in M3 (D-12), the
// Duskfolk (M3_NEIGHBOURS.md §24) and the Drifters (§25). What a species can live on is stated here and read by the
// rules (src/sim/habitability.ts), never hard-coded for humans (docs/design/M1_PLANETS.md §5).
// Every species but humans is fiction.

import type { Atmosphere, BodyKind, Gravity, TempBand, Water } from '../sim/bodies.ts';

export type SpeciesId = 'human' | 'duskfolk' | 'drifters' | 'unhomed';

/** How hard a condition is: 0 easy, more harder; null impossible. */
type Costs<K extends string> = Record<K, number | null>;

export interface SpeciesDef {
  id: SpeciesId;
  name: string;
  /** "human" in "a human colony". */
  adjective: string;
  /** Kinds of body it can live on at all (others: outposts only). */
  surfaces: readonly BodyKind[];
  costs: {
    temperature: Costs<TempBand>;
    atmosphere: Costs<Atmosphere>;
    gravity: Costs<Gravity>;
    water: Costs<Water>;
    flare: number;
    /** An open sky: a world not tidally locked to its star (M3_NEIGHBOURS.md §24.3). */
    open: number;
  };
  /** The highest total for each level; above `harsh` a world is uninhabitable. */
  levels: { comfortable: number; tolerable: number; harsh: number };
}

export const SPECIES: Record<SpeciesId, SpeciesDef> = {
  human: {
    id: 'human',
    name: 'Humans',
    adjective: 'human',
    surfaces: ['rocky', 'super-earth', 'moon', 'dwarf'],
    costs: {
      temperature: { frozen: 2, cold: 1, temperate: 0, warm: 1, hot: 2, scorching: null },
      atmosphere: { none: 2, thin: 1, dense: 0, toxic: 2 },
      gravity: { low: 1, normal: 0, high: 2 },
      water: { none: 1, ice: 0, oceans: 0 },
      flare: 1,
      open: 0,
    },
    levels: { comfortable: 0, tolerable: 2, harsh: 6 },
  },
  // The twilight folk of a red dwarf's locked world, hardened against flares (§24.3).
  duskfolk: {
    id: 'duskfolk',
    name: 'The Duskfolk',
    adjective: 'Duskfolk',
    surfaces: ['rocky', 'super-earth', 'moon', 'dwarf'],
    costs: {
      temperature: { frozen: 1, cold: 0, temperate: 0, warm: 0, hot: 1, scorching: 2 },
      atmosphere: { none: 2, thin: 0, dense: 0, toxic: 1 },
      gravity: { low: 0, normal: 0, high: 1 },
      water: { none: 1, ice: 0, oceans: 0 },
      flare: 0,
      open: 2,
    },
    levels: { comfortable: 0, tolerable: 2, harsh: 6 },
  },
  // The Unhomed of Arcturus (M5_UNKNOWN.md §25.1), fiction: from the cold outer worlds of an old
  // orange giant, at home in the cold and the dim, troubled by heat and heavy worlds.
  unhomed: {
    id: 'unhomed',
    name: 'The Unhomed',
    adjective: 'Unhomed',
    surfaces: ['rocky', 'super-earth', 'moon', 'dwarf'],
    costs: {
      temperature: { frozen: 1, cold: 0, temperate: 0, warm: 1, hot: 2, scorching: null },
      atmosphere: { none: 2, thin: 0, dense: 1, toxic: 2 },
      gravity: { low: 0, normal: 0, high: 2 },
      water: { none: 1, ice: 0, oceans: 0 },
      flare: 1,
      open: 0,
    },
    levels: { comfortable: 0, tolerable: 2, harsh: 6 },
  },
  // The cloud drifters, vast floaters in a giant planet's air (§25.3): giants only.
  drifters: {
    id: 'drifters',
    name: 'The Drifters',
    adjective: 'Drifter',
    surfaces: ['gas-giant', 'ice-giant', 'mini-neptune'],
    costs: {
      temperature: { frozen: 1, cold: 0, temperate: 0, warm: 0, hot: 1, scorching: 2 },
      atmosphere: { none: null, thin: null, dense: 0, toxic: 1 },
      gravity: { low: 0, normal: 0, high: 0 },
      water: { none: 0, ice: 0, oceans: 0 },
      flare: 0,
      open: 0,
    },
    levels: { comfortable: 0, tolerable: 2, harsh: 6 },
  },
};
