// Governors (M2_WORLDS.md §8, §25.1, D-15): a colony run for a priority, as each turn ends. A
// governor mends shortages first, zones open land its people can work, puts the right districts to
// work, and queues a project when the queue is empty; it never touches what the player locked or
// queued, never builds ships or lanes, never changes taxes or buys industry. Every action is a
// report line with its reason. The rivals run their colonies with this same code (increment 24).

import { ZONE_DEFS, type Zone } from '../content/districts.ts';
import { CALMING, PRIORITY_DEFS, type Priority } from '../content/edicts.ts';
import type { FactionId } from '../content/factions.ts';
import type { ProjectId } from '../content/projects.ts';
import { RULES } from '../content/rules.ts';
import {
  approvalOf,
  capacityOf,
  districtCount,
  idleMillions,
  networkFood,
  networkOf,
  queueRefusal,
  unworkedDistricts,
  zoneRefusal,
} from './economy.ts';
import type { ReportEvent } from './report.ts';
import type { GameState, Holding } from './state.ts';
import type { World } from './world.ts';

type Governed = Extract<ReportEvent, { kind: 'governed' }>;

/** How short of food a colony's supply network is a turn: 0 when it feeds itself. */
function foodShort(world: World, state: GameState, h: Holding): number {
  const f = networkFood(world, state, h.owner, networkOf(world, state, h));
  return Math.max(0, f.eaten - f.made);
}

/** The district a governor would give up for another use: one no one works, else one of its most common zone, never farms or housing. */
function leastNeeded(h: Holding, keep: Zone): number | null {
  const open = h.districts.filter((d) => !h.locked.includes(d.slot) && d.zone !== keep && d.zone !== 'housing');
  if (open.length === 0) return null;
  const worked = new Set(h.districts.filter((d) => ZONE_DEFS[d.zone].worked).map((d) => d.slot));
  const counts = new Map<Zone, number>();
  for (const d of h.districts) counts.set(d.zone, (counts.get(d.zone) ?? 0) + 1);
  const pool = open.filter((d) => d.zone !== 'farms');
  const from = pool.length > 0 ? pool : open;
  const ranked = [...from].sort(
    (a, b) =>
      Number(worked.has(a.slot)) - Number(worked.has(b.slot)) ||
      (counts.get(b.zone) ?? 0) - (counts.get(a.zone) ?? 0) ||
      b.slot - a.slot,
  );
  return ranked[0]?.slot ?? null;
}

/** Whether the colony's people could work one more district soon: idle people now, or half a million more on the way. */
function canWorkMore(h: Holding): boolean {
  if (idleMillions(h) > 0) return true;
  if (unworkedDistricts(h) > 0) return false;
  const jobs = h.districts.filter((d) => ZONE_DEFS[d.zone].worked).length;
  return h.people >= jobs * RULES.districts.workers + RULES.districts.workers / 2;
}

/** The zone a priority gives the next open district: the one it has fewest of, for how often it wants it. */
function nextZone(world: World, state: GameState, h: Holding, priority: Priority, slot: number): Zone | null {
  const want = PRIORITY_DEFS[priority].zones;
  const counts = new Map<Zone, number>();
  for (const d of h.districts) counts.set(d.zone, (counts.get(d.zone) ?? 0) + 1);
  const nearlyFull = h.people + RULES.districts.workers >= capacityOf(world, state, h);
  const zones = [...new Set(want)].filter(
    (z) =>
      zoneRefusal(world, state, h, z, slot) === null &&
      (z !== 'housing' || nearlyFull) &&
      (!ZONE_DEFS[z].worked || canWorkMore(h)),
  );
  const share = (z: Zone) => (counts.get(z) ?? 0) / want.filter((x) => x === z).length;
  return zones.sort((a, b) => share(a) - share(b) || want.indexOf(a) - want.indexOf(b))[0] ?? null;
}

/** The first open district that is neither being zoned nor locked by the player. */
function openSlot(world: World, state: GameState, h: Holding): number | null {
  const n = districtCount(world, state, h);
  for (let slot = 1; slot <= n; slot++) {
    if (h.locked.includes(slot) || h.districts.some((d) => d.slot === slot)) continue;
    if (h.queue.some((q) => q.kind === 'zone' && q.slot === slot)) continue;
    return slot;
  }
  return null;
}

/** Queues a zoning at the front of the queue, as the governor's. */
function zone(h: Holding, zone: Zone, slot: number): void {
  h.queue.unshift({ kind: 'zone', zone, slot, governor: true });
}

/** What a governor does for one colony this turn; the state is changed in place. */
export function govern(world: World, state: GameState, h: Holding): Governed[] {
  if (h.kind !== 'colony' || h.governor === null) return [];
  const priority = h.governor;
  const out: Governed[] = [];
  const zoning = () => h.queue.some((q) => q.kind === 'zone');

  // 1. Shortages: food for its network, then room.
  const short = foodShort(world, state, h);
  if (!zoning() && short > 0) {
    const slot = openSlot(world, state, h) ?? leastNeeded(h, 'farms');
    if (slot !== null && zoneRefusal(world, state, h, 'farms', slot) === null) {
      zone(h, 'farms', slot);
      out.push({ kind: 'governed', holding: h.id, did: 'zone', zone: 'farms', slot, reason: 'food', short });
    }
  }
  if (!zoning() && h.people >= capacityOf(world, state, h)) {
    const slot = openSlot(world, state, h);
    if (slot !== null && zoneRefusal(world, state, h, 'housing', slot) === null) {
      zone(h, 'housing', slot);
      out.push({ kind: 'governed', holding: h.id, did: 'zone', zone: 'housing', slot, reason: 'full' });
    }
  }

  // 2. Open land, for its priority; a colony that only just feeds itself zones farms first.
  if (!zoning()) {
    const slot = openSlot(world, state, h);
    if (slot !== null) {
      const f = networkFood(world, state, h.owner, networkOf(world, state, h));
      const lean = f.made - f.eaten < 1 && canWorkMore(h) && zoneRefusal(world, state, h, 'farms', slot) === null;
      const z = lean ? 'farms' : nextZone(world, state, h, priority, slot);
      if (z) {
        zone(h, z, slot);
        out.push({ kind: 'governed', holding: h.id, did: 'zone', zone: z, slot, reason: lean ? 'food' : 'priority' });
      }
    }
  }

  // 3. The work: farms first, so the colony eats, then the priority's zones, then the rest.
  const first = PRIORITY_DEFS[priority].zones;
  const rank = (z: Zone) => (z === 'farms' ? -1 : first.includes(z) ? first.indexOf(z) : first.length);
  const before = h.districts[0]?.zone;
  const ordered = [...h.districts].sort((a, b) => rank(a.zone) - rank(b.zone));
  if (ordered.some((d, i) => d !== h.districts[i])) {
    h.districts = ordered;
    const now = ordered[0]?.zone;
    if (now && now !== before)
      out.push({ kind: 'governed', holding: h.id, did: 'work', zone: now, reason: short > 0 ? 'food' : 'priority' });
  }

  // 4. A project when nothing else is queued: something to calm its people first, if they need it.
  if (h.queue.length === 0) {
    const uneasy = approvalOf(world, state, h).level !== 'content';
    const list: ProjectId[] = [...(uneasy ? CALMING : []), ...PRIORITY_DEFS[priority].projects];
    const project = list.find((p) => queueRefusal(world, state, h, { kind: 'project', project: p }) === null);
    if (project) {
      h.queue.push({ kind: 'project', project, governor: true });
      out.push({
        kind: 'governed',
        holding: h.id,
        did: 'queue',
        project,
        reason: uneasy && CALMING.includes(project) ? 'calm' : 'priority',
      });
    }
  }
  return out;
}

/** Every governed colony of every power, in id order, as the turn ends. */
export function governAll(world: World, state: GameState): Map<FactionId, ReportEvent[]> {
  const out = new Map<FactionId, ReportEvent[]>();
  for (const h of state.holdings) {
    if (h.governor === null || districtCount(world, state, h) === 0) continue;
    const events = govern(world, state, h);
    if (events.length > 0) out.set(h.owner, [...(out.get(h.owner) ?? []), ...events]);
  }
  return out;
}
