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
//
// A capital beyond Reborn's lanes, in the shell (M3_NEIGHBOURS.md §24.4), has no old lane to tend:
// its web grows the same way over lanes of its own, each up to a new lane's reach between systems
// with no old lane, and keeps what it reaches (at most RULES.homeWeb.systems), so it never trims
// the webs of old lanes.

import { RULES } from '../content/rules.ts';
import type { SystemId } from '../data/types.ts';
import { type CatalogueLane, type LaneId, laneId, type World } from './world.ts';

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

type Links = (id: SystemId) => readonly CatalogueLane[];

/** The lanes a web may grow along: Reborn's, or for a capital with none, its own between dark systems. */
function linksFor(world: World, capital: SystemId, reachDeci: number): Links {
  if (world.catalogueAt(capital).length > 0) return (id) => world.catalogueAt(id);
  const dark = world.systems.filter((s) => world.catalogueAt(s.id).length === 0).map((s) => s.id);
  const cache = new Map<SystemId, CatalogueLane[]>();
  return (id) => {
    let out = cache.get(id);
    if (!out) {
      out = dark
        .filter((o) => o !== id && world.distanceDeci(id, o) <= reachDeci)
        .map((o) => ({
          id: laneId(id, o),
          a: id < o ? id : o,
          b: id < o ? o : id,
          lengthDeci: world.distanceDeci(id, o),
        }))
        .sort((x, y) => x.lengthDeci - y.lengthDeci || byId(x.id, y.id));
      cache.set(id, out);
    }
    return out;
  };
}

function jumpsFrom(
  world: World,
  from: SystemId,
  allowed?: (id: SystemId) => boolean,
  links: Links = (id) => world.catalogueAt(id),
): Map<SystemId, number> {
  const out = new Map<SystemId, number>([[from, 0]]);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i] as SystemId;
    const d = out.get(cur) as number;
    for (const lane of links(cur)) {
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
  ownReachDeci: number = RULES.lanes.reachDeci,
): HomeWeb<F>[] {
  // 1. Who tends each system near a capital.
  const reach = capitals.map((c) => {
    const links = linksFor(world, c.capital, ownReachDeci);
    return {
      ...c,
      links,
      own: world.catalogueAt(c.capital).length === 0,
      jumps: jumpsFrom(world, c.capital, undefined, links),
    };
  });
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
  const grown = reach.map((c) => {
    const jumps = jumpsFrom(world, c.capital, (id) => tender.get(id) === c.faction, c.links);
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
      const toward = g
        .links(id)
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

  // 4. The same size for all webs of old lanes; one of its own lanes keeps what it reached.
  // Trimming from the far end keeps every lane's nearer end.
  const old = joined.filter((g) => !g.own);
  const size = old.length > 0 ? Math.min(...old.map((g) => g.systems.length)) : maxSystems;
  return joined.map((g) => {
    const systems = g.systems.slice(0, g.own ? maxSystems : size);
    const lanes = g.lanes
      .slice(0, systems.length - 1)
      .map((l) => l.id)
      .sort(byId);
    const jumps = new Map(systems.map((id) => [id, g.jumps.get(id) as number]));
    return { faction: g.faction, capital: g.capital, systems, lanes, jumps };
  });
}
