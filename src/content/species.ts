// Species, as data (D-08). In M1 there is one, humans; alien species arrive in M3 (D-12). What a
// species can live on is filled in with the planets (M1 increment 3), never hard-coded in the rules.

export type SpeciesId = 'human';

export interface SpeciesDef {
  id: SpeciesId;
  name: string;
  /** "human" in "a human colony". */
  adjective: string;
}

export const SPECIES: Record<SpeciesId, SpeciesDef> = {
  human: { id: 'human', name: 'Humans', adjective: 'human' },
};
