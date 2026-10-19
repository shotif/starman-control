// What needs you (M1_TURNS.md §5): worked out from the state whenever it is asked, never stored.

import type { FactionId } from '../content/factions.ts';
import type { SystemId } from '../data/types.ts';
import type { GameState } from './state.ts';

export type Need = { kind: 'idle-ship'; ship: number; system: SystemId };

/** Ships with nothing to do: no destination, no blind jump, not told to hold. */
export function needsOf(state: GameState, faction: FactionId): Need[] {
  return state.ships
    .filter((s) => s.owner === faction && s.at !== null && s.destinations.length === 0 && !s.blindJump && !s.hold)
    .map((s) => ({ kind: 'idle-ship', ship: s.id, system: s.at as SystemId }));
}
