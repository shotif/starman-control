// Small pieces shared by every screen: badges for where a fact comes from, and faction marks that
// pair a colour with a shape and a word (colour is never the only cue).

import { FACTIONS, type FactionId } from '../content/factions.ts';

export type BadgeKind = 'observed' | 'estimated' | 'fiction' | 'disputed';

const BADGE_TEXT: Record<BadgeKind, string> = {
  observed: 'Observed',
  estimated: 'Estimated',
  fiction: 'Fiction',
  disputed: 'Disputed',
};

const BADGE_HELP: Record<BadgeKind, string> = {
  observed: 'Measured by astronomers',
  estimated: 'Worked out from observed values by a stated rule',
  fiction: 'Invented by this game',
  disputed: 'Astronomers dispute this planet',
};

export function Badge({ kind }: { kind: BadgeKind }) {
  return (
    <span class={`badge badge-${kind}`} title={BADGE_HELP[kind]}>
      {BADGE_TEXT[kind]}
    </span>
  );
}

export function FactionMark({ faction, size = 12 }: { faction: FactionId; size?: number }) {
  const f = FACTIONS[faction];
  const s = size;
  return (
    <svg class="faction-mark" width={s} height={s} viewBox="0 0 12 12" aria-hidden="true">
      {f.mark === 'square' && <rect x="1.5" y="1.5" width="9" height="9" fill={f.colour} />}
      {f.mark === 'circle' && <circle cx="6" cy="6" r="4.8" fill={f.colour} />}
      {f.mark === 'triangle' && <polygon points="6,1 11.2,10.6 0.8,10.6" fill={f.colour} />}
    </svg>
  );
}

/** A faction's mark and short name. */
export function FactionTag({ faction }: { faction: FactionId }) {
  return (
    <span class="faction-tag">
      <FactionMark faction={faction} />
      {FACTIONS[faction].shortName}
    </span>
  );
}
