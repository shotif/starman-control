// Each power's home web (D-19a, as recommended; docs/design/M1_FIRST_LIGHT.md §3): the part of
// Reborn's network it kept tending through the Lapse. Worked out the same way whoever plays, so
// every start is the same whichever faction you choose:
//
// 1. Each system within two of Reborn's jumps of a capital is tended by the nearest such capital
//    (fewest jumps, then shortest distance), so webs never overlap.
// 2. A web grows outward from its capital through its own systems only, nearest first.
// 3. Each system joins by one lane: the shortest to a system one jump nearer the capital that still
//    has a free beacon slot (a capital has a lane station, so more slots). A system with no such
//    lane is left out, and the next nearest is tried.
// 4. Every web is trimmed to the size of the smallest (at most RULES.homeWeb.systems). So every
//    power starts with the same number of systems and lanes; the other old lanes among them are
//    dark, to be relit.

import { RULES } from '../content/rules.ts';
import type { SystemId } from '../data/types.ts';
import type { CatalogueLane, LaneId, World } from './world.ts';

export interface HomeWebInput<F extends string> {
  faction: F;
  capital: SystemId;
}

export interface HomeWeb<F extends string> {
  faction: F;
  capital: SystemId;
  /** The capital first, then nearest first. */
  systems: SystemId[];
  /** One lane to each system but the capital: a tree rooted at the capital. */
  lanes: LaneId[];
  /** Jumps from the capital within the web. */
  jumps: Map<SystemId, number>;
}

const byId = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function jumpsFrom(world: World, from: SystemId, allowed?: (id: SystemId) => boolean): Map<SystemId, number> {
  const out = new Map<SystemId, number>([[from, 0]]);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i] as SystemId;
    const d = out.get(cur) as number;
    for (const lane of world.catalogueAt(cur)) {
      const next = lane.a === cur ? lane.b : lane.a;
      if (out.has(next) || (allowed && !allowed(next))) continue;
      out.set(next, d + 1);
      queue.push(next);
    }
  }
  return out;
}

export function homeWebs<F extends string>(
  world: World,
  capitals: readonly HomeWebInput<F>[],
  maxJumps: number = RULES.homeWeb.jumps,
  maxSystems: number = RULES.homeWeb.systems,
  slots: number = RULES.beacons.slots,
  slotsAtCapital: number = RULES.beacons.slotsWithStation,
): HomeWeb<F>[] {
  // 1. Who tends each system near a capital.
  const reach = capitals.map((c) => ({ ...c, jumps: jumpsFrom(world, c.capital) }));
  const tender = new Map<SystemId, F>();
  for (const s of world.systems) {
    let best: { faction: F; jumps: number; dist: number } | undefined;
    for (const r of reach) {
      const j = r.jumps.get(s.id);
      if (j === undefined || j > maxJumps) continue;
      const dist = world.distanceDeci(r.capital, s.id);
      if (
        !best ||
        j < best.jumps ||
        (j === best.jumps && (dist < best.dist || (dist === best.dist && r.faction < best.faction)))
      ) {
        best = { faction: r.faction, jumps: j, dist };
      }
    }
    if (best) tender.set(s.id, best.faction);
  }
  for (const c of capitals) tender.set(c.capital, c.faction);

  // 2. Each web through its own systems, nearest first.
  const grown = capitals.map((c) => {
    const jumps = jumpsFrom(world, c.capital, (id) => tender.get(id) === c.faction);
    const order = [...jumps]
      .filter(([, j]) => j <= maxJumps)
      .map(([id]) => id)
      .sort(
        (x, y) =>
          (jumps.get(x) as number) - (jumps.get(y) as number) ||
          world.distanceDeci(c.capital, x) - world.distanceDeci(c.capital, y) ||
          byId(x, y),
      );
    return { ...c, jumps, order };
  });

  // 3. One lane to each system, within the beacon slots.
  const joined = grown.map((g) => {
    const systems: SystemId[] = [g.capital];
    const lanes: CatalogueLane[] = [];
    const used = new Map<SystemId, number>();
    const free = (id: SystemId) => (used.get(id) ?? 0) < (id === g.capital ? slotsAtCapital : slots);
    for (const id of g.order.slice(1)) {
      if (systems.length === maxSystems) break;
      const d = g.jumps.get(id) as number;
      const toward = world
        .catalogueAt(id)
        .filter((l) => {
          const other = l.a === id ? l.b : l.a;
          return systems.includes(other) && g.jumps.get(other) === d - 1 && free(other);
        })
        .sort((x, y) => x.lengthDeci - y.lengthDeci || byId(x.id, y.id))[0];
      if (!toward) continue;
      systems.push(id);
      lanes.push(toward);
      for (const end of [toward.a, toward.b]) used.set(end, (used.get(end) ?? 0) + 1);
    }
    return { ...g, systems, lanes };
  });

  // 4. The same size for all. Trimming from the far end keeps every lane's nearer end.
  const size = Math.min(...joined.map((g) => g.systems.length));
  return joined.map((g) => {
    const systems = g.systems.slice(0, size);
    const lanes = g.lanes
      .slice(0, size - 1)
      .map((l) => l.id)
      .sort(byId);
    const jumps = new Map(systems.map((id) => [id, g.jumps.get(id) as number]));
    return { faction: g.faction, capital: g.capital, systems, lanes, jumps };
  });
}
