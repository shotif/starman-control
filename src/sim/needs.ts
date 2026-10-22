// What needs you (M1_TURNS.md §5, M1_COLONIES.md §4): worked out from the state whenever it is
// asked, never stored.

import type { EventId } from '../content/events.ts';
import type { FactionId } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import type { TreatyKind } from '../content/treaties.ts';
import type { SystemId } from '../data/types.ts';
import { investigateRefusal } from './anomalies.ts';
import {
  approvalOf,
  capacityOf,
  costOf,
  foodTurnsLeft,
  networkFood,
  networksOf,
  settleable,
  treasuryOf,
  unworkedDistricts,
} from './economy.ts';
import { fleetById } from './fleets.ts';
import { canResearch } from './research.ts';
import { type GameState, powerOf } from './state.ts';
import type { World } from './world.ts';

export type Need =
  /** An event waits for its answer (M2_WORLDS.md §27); `left` turns before its first choice is taken. */
  | { kind: 'event'; event: EventId; holding: number | null; system: SystemId | null; left: number }
  /**
   * A ship with nothing to do; `canFound` counts the worlds here a colony or outpost ship could
   * settle, and `canInvestigate` says a survey ship could investigate an anomaly here.
   */
  | { kind: 'idle-ship'; ship: number; system: SystemId; canFound: number; canInvestigate: boolean }
  /** A colony with a shipyard building nothing. */
  | { kind: 'idle-yard'; holding: number; system: SystemId }
  /** A colony's first item has its industry but waits for resources. */
  | { kind: 'waiting'; holding: number; system: SystemId }
  /** Nothing is being researched, and there is something to research. */
  | { kind: 'no-research' }
  /**
   * A network of colonies is hungry (`turns` 0), or will be when this turn ends (1) or the next (2)
   * (M2_WORLDS.md §3); `home` for the capital's network, named by its first colony.
   */
  | { kind: 'food'; holding: number; system: SystemId; turns: number; home: boolean }
  /** A colony in unrest or revolt (M2_WORLDS.md §5). */
  | { kind: 'unrest'; holding: number; system: SystemId; revolt: boolean }
  /** The treasury will fall into debt within `turns` (0: it is in debt) (M2_WORLDS.md §4). */
  | { kind: 'debt'; turns: number }
  /** Districts zoned with no one to work them. */
  | { kind: 'unworked'; holding: number; system: SystemId; districts: number }
  /** A treaty or an exchange offered, waiting for an answer before this turn ends (M3_NEIGHBOURS.md §21.2, §23.1). */
  | { kind: 'offer'; from: FactionId; treaty: TreatyKind | 'exchange' };

export function needsOf(world: World, state: GameState, faction: FactionId): Need[] {
  const out: Need[] = [];
  const ev = powerOf(state, faction).event;
  if (ev && ev.answer === null)
    out.push({
      kind: 'event',
      event: ev.id,
      holding: ev.holding,
      system: ev.system,
      left: Math.max(1, RULES.events.waits - (state.turn - ev.turn)),
    });
  for (const o of state.offers)
    if (o.to === faction && o.turn < state.turn) out.push({ kind: 'offer', from: o.from, treaty: o.kind });
  for (const s of state.ships) {
    if (
      s.owner !== faction ||
      s.at === null ||
      s.destinations.length > 0 ||
      s.blindJump ||
      s.hold ||
      s.founding ||
      s.investigating
    )
      continue;
    const canFound =
      s.type === 'colony' || s.type === 'outpost' ? settleable(world, state, faction, s.at, s.type).length : 0;
    // A ship in a fleet waits with it (M4_FLEETS.md §22.2): only a colony or outpost ship of a fleet
    // at rest, where it could found, needs you.
    const fleet = fleetById(state, s.fleet);
    if (fleet && (fleet.destinations.length > 0 || fleet.hold || canFound === 0)) continue;
    out.push({
      kind: 'idle-ship',
      ship: s.id,
      system: s.at,
      canFound,
      canInvestigate: investigateRefusal(state, s) === null,
    });
  }
  const stock = powerOf(state, faction).stockpile;
  for (const h of state.holdings) {
    if (h.owner !== faction || h.kind !== 'colony') continue;
    const first = h.queue[0];
    if (!first) {
      if (h.projects.includes('shipyard')) out.push({ kind: 'idle-yard', holding: h.id, system: h.system });
      continue;
    }
    const c = costOf(world, state, h, first);
    if (h.industry >= c.industry && (stock.metals < c.metals || stock.volatiles < c.volatiles || stock.fuel < c.fuel))
      out.push({ kind: 'waiting', holding: h.id, system: h.system });
  }
  const power = powerOf(state, faction);
  if (power.researchQueue.length === 0 && canResearch(power).length > 0) out.push({ kind: 'no-research' });
  // Food: a network that is hungry, or whose store runs out within two turns.
  for (const net of networksOf(world, state, faction)) {
    const first = net.colonies[0];
    if (!first) continue;
    const f = networkFood(world, state, faction, net);
    // Turns the store still covers; hunger comes at the end of the turn after.
    const covered = net.home ? foodTurnsLeft(f) : f.made < f.eaten ? 0 : null;
    if (covered === null) continue;
    const turns = net.colonies.some((h) => h.hungry > 0) ? 0 : covered + 1;
    if (turns <= 2) out.push({ kind: 'food', holding: first.id, system: first.system, turns, home: net.home });
  }
  for (const h of state.holdings) {
    if (h.owner !== faction || h.kind !== 'colony') continue;
    const level = approvalOf(world, state, h).level;
    if (level === 'unrest' || level === 'revolt')
      out.push({ kind: 'unrest', holding: h.id, system: h.system, revolt: level === 'revolt' });
    // Districts no one works matter once the colony is full; until then its people grow into them.
    const n = unworkedDistricts(h);
    if (n > 0 && h.people >= capacityOf(world, state, h))
      out.push({ kind: 'unworked', holding: h.id, system: h.system, districts: n });
  }
  const t = treasuryOf(world, state, faction).total;
  if (power.treasury < 0) out.push({ kind: 'debt', turns: 0 });
  else if (t < 0 && power.treasury + 2 * t < 0) out.push({ kind: 'debt', turns: Math.floor(power.treasury / -t) + 1 });
  return out;
}
