// The treaties (M3_NEIGHBOURS.md §8, §21, D-53): what two powers that can talk may agree. Those of
// increment 36; trade and borders come with increment 37. Each power's own rules read these.

export type TreatyKind = 'open-lanes' | 'shared-research';

export const TREATY_KINDS: readonly TreatyKind[] = ['open-lanes', 'shared-research'];

export const TREATIES: Record<TreatyKind, { name: string; does: string }> = {
  'open-lanes': {
    name: 'Open lanes',
    does: 'Each power’s ships may use the other’s open lanes.',
  },
  'shared-research': {
    name: 'Shared research',
    does: 'A technology the other knows costs 25% less, and knowledge from others can take up to 50% off.',
  },
};

export function isTreatyKind(v: unknown): v is TreatyKind {
  return typeof v === 'string' && (TREATY_KINDS as readonly string[]).includes(v);
}
