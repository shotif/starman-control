// A rival's road toward a place it cannot reach (M5_UNKNOWN.md §21.4, as built): one step at a time,
// an outpost at the reachable system nearest the place, where it is nearer than any holding of ours,
// or else a lane from one of the holdings nearest the place to a system nearer it that we could hold.
// Pure; the rivals use it for relic sites, and it serves any target.

import type { FactionId } from '../content/factions.ts';
import type { SystemId } from '../data/types.ts';
import { settleable } from './economy.ts';
import { laneTargets } from './lanes.ts';
import { lanesFor } from './movement.ts';
import { type GameState, powerOf } from './state.ts';
import type { World } from './world.ts';

/** How many of a power's holdings nearest the place it looks for a lane from. */
const FROM = 3;

/** The next step of a road: an outpost to found at a system, or a lane to queue from a holding; or none. */
export type RoadStep = { kind: 'outpost'; system: SystemId } | { kind: 'lane'; holding: number; to: SystemId } | null;

/** The systems a power's ships may reach from its capital by the lanes it may sail, in id order. */
export function reachableFrom(world: World, state: GameState, faction: FactionId): Set<SystemId> {
  const graph = lanesFor(world, state, faction, true);
  const start = powerOf(state, faction).capital;
  const seen = new Set<SystemId>([start]);
  let ring: SystemId[] = [start];
  while (ring.length > 0) {
    const next: SystemId[] = [];
    for (const at of ring)
      for (const hop of graph.get(at) ?? [])
        if (!seen.has(hop.to)) {
          seen.add(hop.to);
          next.push(hop.to);
        }
    ring = next;
  }
  return seen;
}

/** The next step of a power's road toward a system (see the head of this file), or null. */
export function roadStep(
  world: World,
  state: GameState,
  faction: FactionId,
  target: SystemId,
  reach: ReadonlySet<SystemId> = reachableFrom(world, state, faction),
): RoadStep {
  if (reach.has(target)) return null;
  const mine = state.holdings.filter((h) => h.owner === faction);
  if (mine.length === 0) return null;
  const d = (s: SystemId) => world.distanceDeci(s, target);
  const nearestHeld = Math.min(...mine.map((h) => d(h.system)));
  const holdable = (s: SystemId) => settleable(world, state, faction, s, 'outpost').length > 0;
  // An outpost where our ships can go already, nearer than any holding.
  const outpost = [...reach]
    .filter((s) => d(s) < nearestHeld && !mine.some((h) => h.system === s) && holdable(s))
    .sort((a, b) => d(a) - d(b) || (a < b ? -1 : 1))[0];
  if (outpost) return { kind: 'outpost', system: outpost };
  // Else a lane, one at a time, from a holding near the place to the target or a system we could hold.
  if (mine.some((h) => h.queue.some((q) => q.kind === 'lane' && d(q.to) < d(h.system)))) return null;
  const near = [...mine].sort((a, b) => d(a.system) - d(b.system) || a.id - b.id).slice(0, FROM);
  let best: { holding: number; to: SystemId; dist: number } | null = null;
  for (const h of near) {
    if (h.queue.some((q) => q.kind === 'lane')) continue;
    for (const t of laneTargets(world, state, faction, h.system)) {
      const to = t.quote.to;
      if (t.refusal !== null || d(to) >= d(h.system) || (to !== target && !holdable(to))) continue;
      if (!best || d(to) < best.dist) best = { holding: h.id, to, dist: d(to) };
    }
  }
  return best ? { kind: 'lane', holding: best.holding, to: best.to } : null;
}
