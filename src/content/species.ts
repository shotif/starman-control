// Species, as data (D-08). In M1 there is one, humans; alien species arrive in M3 (D-12). What a
// species can live on is stated here and read by the rules (src/sim/habitability.ts), never
// hard-coded for humans (docs/design/M1_PLANETS.md §5).

import type { Atmosphere, BodyKind, Gravity, TempBand, Water } from '../sim/bodies.ts';

export type SpeciesId = 'human';

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
    },
    levels: { comfortable: 0, tolerable: 2, harsh: 6 },
  },
};
