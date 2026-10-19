// Stars by kind, from their catalogued spectral types (§4). The class decides how a star is drawn
// now and, with the planets (increment 3), its estimated light and what worlds it is likely to have.

/** O, B, A, F, G, K and M for main-sequence stars; D for white dwarfs; L, T and Y for brown dwarfs. */
export type StarClass = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' | 'D' | 'L' | 'T' | 'Y' | '?';

/**
 * The class of a catalogued spectral type: "dM5.5e" is M (a dwarf prefix), "DA2" is D (a white
 * dwarf), "sdM1" is M (a subdwarf). Follows Starman Reborn's starKindWord (src/data/systems.ts).
 */
export function starClass(spectralType: string): StarClass {
  const s = spectralType.trim().toUpperCase();
  if (/^D[ABCOQZX]/.test(s) || s === 'DG') return 'D';
  const c = s.replace(/^(SD|D|ESD|USD)(?=[OBAFGKMLTY])/, '').charAt(0);
  return 'OBAFGKMDLTY'.includes(c) && c !== '' ? (c as StarClass) : '?';
}

const KIND_WORD: Record<StarClass, string> = {
  O: 'blue star',
  B: 'blue-white star',
  A: 'white star',
  F: 'yellow-white star',
  G: 'yellow dwarf',
  K: 'orange dwarf',
  M: 'red dwarf',
  D: 'white dwarf',
  L: 'brown dwarf',
  T: 'brown dwarf',
  Y: 'brown dwarf',
  '?': 'star',
};

/** "red dwarf" for "dM5.5e". */
export function starKindWord(spectralType: string): string {
  return KIND_WORD[starClass(spectralType)];
}
