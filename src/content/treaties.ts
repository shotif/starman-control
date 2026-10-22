// The treaties (M3_NEIGHBOURS.md §8, §21, §22, D-53, D-54): what two powers in contact may agree.
// Each power's own rules read these.

export type TreatyKind =
  | 'open-lanes'
  | 'shared-research'
  | 'border'
  | 'trade'
  | 'passage'
  | 'protection'
  | 'non-aggression'
  | 'alliance';

export const TREATY_KINDS: readonly TreatyKind[] = [
  'open-lanes',
  'shared-research',
  'border',
  'trade',
  'passage',
  'protection',
  'non-aggression',
  'alliance',
];

/** Treaties one side sells and the other buys (§23): the buyer pays every turn. */
export const SOLD: readonly TreatyKind[] = ['passage', 'protection'];

/**
 * Each treaty's name; its `words` in a sentence ("the Cooperative offers us a border treaty");
 * its `noun` after "our" or "the" ("our border treaty"); and what it does.
 */
export const TREATIES: Record<TreatyKind, { name: string; words: string; noun: string; does: string }> = {
  'open-lanes': {
    name: 'Open lanes',
    words: 'open lanes',
    noun: 'open lanes treaty',
    does: 'Each power’s ships may use the other’s open lanes.',
  },
  'shared-research': {
    name: 'Shared research',
    words: 'shared research',
    noun: 'shared research treaty',
    does: 'A technology the other knows costs 25% less, and knowledge from others can take up to 50% off.',
  },
  // Increment 37 (§22.3, §22.4).
  border: {
    name: 'Border',
    words: 'a border treaty',
    noun: 'border treaty',
    does: 'The systems both claim are shared out between us, and neither may settle in the other’s claim.',
  },
  trade: {
    name: 'Trade',
    words: 'a trade agreement',
    noun: 'trade agreement',
    does: 'Credits for both every turn: 1 for every 4 colonies of the smaller power, and 1 for each open lane between our systems, at most 10.',
  },
  // Increment 37b (§23.2, §23.4): sold by a power whose character sells them.
  passage: {
    name: 'Passage',
    words: 'passage',
    noun: 'passage',
    does: 'The buyer’s ships may use the seller’s open lanes, for a toll every turn: 1 credit for each of its lanes, from 2 to 8.',
  },
  protection: {
    name: 'Protection',
    words: 'protection',
    noun: 'protection',
    does: 'The buyer pays 5 credits every turn; from M4 the seller’s ships leave the buyer’s systems alone.',
  },
  // M4 (M4_FLEETS.md §23.3).
  'non-aggression': {
    name: 'Non-aggression',
    words: 'a non-aggression pact',
    noun: 'non-aggression pact',
    does: 'Neither may declare war on the other while it holds; breaking it is a breach every power hears of.',
  },
  alliance: {
    name: 'Alliance',
    words: 'an alliance',
    noun: 'alliance',
    does: 'Open lanes between us, and each is at war with whoever declares war on the other.',
  },
};

export function isTreatyKind(v: unknown): v is TreatyKind {
  return typeof v === 'string' && (TREATY_KINDS as readonly string[]).includes(v);
}
