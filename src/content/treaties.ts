// The treaties (M3_NEIGHBOURS.md §8, §21, §22, D-53, D-54): what two powers in contact may agree.
// Each power's own rules read these.

export type TreatyKind = 'open-lanes' | 'shared-research' | 'border' | 'trade';

export const TREATY_KINDS: readonly TreatyKind[] = ['open-lanes', 'shared-research', 'border', 'trade'];

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
};

export function isTreatyKind(v: unknown): v is TreatyKind {
  return typeof v === 'string' && (TREATY_KINDS as readonly string[]).includes(v);
}
