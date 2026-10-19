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

/**
 * A power's emblem, drawn on its mark (FIRST_IMPRESSION.md §4; D-08, colour always with shape):
 * the Authority's square within a square, crossed by a lane; the Cooperative's circle of three
 * rising shoots; the Wake's triangle trailing a broken wake. All fiction.
 */
export function Emblem({ faction, size = 40 }: { faction: FactionId; size?: number }) {
  const f = FACTIONS[faction];
  const c = f.colour;
  return (
    <svg class="emblem" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ color: c }}>
      <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        {f.mark === 'square' && (
          <>
            <rect x="8" y="8" width="32" height="32" />
            <rect x="17" y="17" width="14" height="14" fill="currentColor" />
            <path d="M2 24h11M35 24h11" />
          </>
        )}
        {f.mark === 'circle' && (
          <>
            <circle cx="24" cy="24" r="19" />
            <path d="M24 38V16M24 38c0-7-5-11-9-15M24 38c0-7 5-11 9-15" />
            <circle cx="24" cy="13" r="2.6" fill="currentColor" />
            <circle cx="14" cy="21" r="2.2" fill="currentColor" />
            <circle cx="34" cy="21" r="2.2" fill="currentColor" />
          </>
        )}
        {f.mark === 'triangle' && (
          <>
            <path d="M24 4L40 31H8Z" />
            <path d="M24 14L32.5 28h-17Z" fill="currentColor" />
            <path d="M13 37h6M21.5 37h5M29 37h6M7 43h7M20.5 43h7M34 43h7" />
          </>
        )}
      </g>
    </svg>
  );
}
