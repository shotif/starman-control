// What needs you (M1_TURNS.md §5, M1_COLONIES.md §4): worked out from the state whenever it is
// asked, never stored.

import type { FactionId } from '../content/factions.ts';
import { itemCost } from '../content/projects.ts';
import type { SystemId } from '../data/types.ts';
import { settleable } from './economy.ts';
import { type GameState, powerOf } from './state.ts';
import type { World } from './world.ts';

export type Need =
  /** A ship with nothing to do; `canFound` counts the worlds here a colony or outpost ship could settle. */
  | { kind: 'idle-ship'; ship: number; system: SystemId; canFound: number }
  /** A colony with a shipyard building nothing. */
  | { kind: 'idle-yard'; holding: number; system: SystemId }
  /** A colony's first item has its industry but waits for resources. */
  | { kind: 'waiting'; holding: number; system: SystemId };

export function needsOf(world: World, state: GameState, faction: FactionId): Need[] {
  const out: Need[] = [];
  for (const s of state.ships) {
    if (s.owner !== faction || s.at === null || s.destinations.length > 0 || s.blindJump || s.hold || s.founding)
      continue;
    const canFound =
      s.type === 'colony' || s.type === 'outpost' ? settleable(world, state, faction, s.at, s.type).length : 0;
    out.push({ kind: 'idle-ship', ship: s.id, system: s.at, canFound });
  }
  const stock = powerOf(state, faction).stockpile;
  for (const h of state.holdings) {
    if (h.owner !== faction || h.kind !== 'colony') continue;
    const first = h.queue[0];
    if (!first) {
      if (h.projects.includes('shipyard')) out.push({ kind: 'idle-yard', holding: h.id, system: h.system });
      continue;
    }
    const c = itemCost(first);
    if (h.industry >= c.industry && (stock.metals < c.metals || stock.volatiles < c.volatiles || stock.fuel < c.fuel))
      out.push({ kind: 'waiting', holding: h.id, system: h.system });
  }
  return out;
}
