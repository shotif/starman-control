// The world: what every game shares, rebuilt from the dataset rather than saved (§11). The systems
// are the real stars; the catalogue lanes are Reborn's old network, which in Control is the set of
// lanes that can be relit (D-19). Which lanes are open, and who holds them, is game state.

import type { SkyDataset, SkySystem, SystemId, Vec3 } from '../data/types.ts';
import { distanceDeci } from './geometry.ts';

/** A lane's id: its two ends in order, joined by "~" ("alpha-centauri~sol"). */
export type LaneId = string;

export interface WorldSystem {
  id: SystemId;
  name: string;
  positionLy: Vec3;
  /** From Sol, in tenths of a light-year. */
  fromSolDeci: number;
  /** True when one of its stars is a catalogued flare star (§4). */
  flare: boolean;
  sky: SkySystem;
}

/** One of Reborn's lanes. */
export interface CatalogueLane {
  id: LaneId;
  a: SystemId;
  b: SystemId;
  /** Its length in tenths of a light-year. */
  lengthDeci: number;
}

export interface World {
  sky: SkyDataset;
  /** Nearest Sol first, as the dataset lists them. */
  systems: readonly WorldSystem[];
  /** Reborn's lanes, in id order. */
  catalogue: readonly CatalogueLane[];
  hasSystem(id: string): boolean;
  /** Throws for an unknown id. */
  system(id: SystemId): WorldSystem;
  /** The catalogue lane between two systems, if Reborn had one. */
  catalogueLane(a: SystemId, b: SystemId): CatalogueLane | undefined;
  /** Catalogue lanes touching a system, shortest first. */
  catalogueAt(id: SystemId): readonly CatalogueLane[];
  /** Tenths of a light-year between two systems. */
  distanceDeci(a: SystemId, b: SystemId): number;
}

export function laneId(a: SystemId, b: SystemId): LaneId {
  return a < b ? `${a}~${b}` : `${b}~${a}`;
}

/** The two ends of a lane id. */
export function laneEnds(id: LaneId): [SystemId, SystemId] {
  const at = id.indexOf('~');
  return [id.slice(0, at), id.slice(at + 1)];
}

/** The other end of a lane from `from`. */
export function otherEnd(id: LaneId, from: SystemId): SystemId {
  const [a, b] = laneEnds(id);
  return a === from ? b : a;
}

export function buildWorld(sky: SkyDataset): World {
  const systems: WorldSystem[] = sky.systems.map((s) => ({
    id: s.id,
    name: s.name,
    positionLy: s.positionLy,
    fromSolDeci: distanceDeci(s.positionLy, [0, 0, 0]),
    flare: s.stars.some((st) => st.flareVariable !== undefined),
    sky: s,
  }));
  const byId = new Map(systems.map((s) => [s.id, s]));
  const system = (id: SystemId): WorldSystem => {
    const s = byId.get(id);
    if (!s) throw new RangeError(`No system ${id}`);
    return s;
  };
  // Distances worked out once each, in a table by the systems' places in the list (−1 not yet).
  const index = new Map(systems.map((s, i) => [s.id, i]));
  const distances = new Int32Array(systems.length * systems.length).fill(-1);
  const distance = (a: SystemId, b: SystemId): number => {
    const i = index.get(a);
    const j = index.get(b);
    if (i === undefined || j === undefined) throw new RangeError(`No system ${i === undefined ? a : b}`);
    const k = i * systems.length + j;
    let d = distances[k] as number;
    if (d < 0) {
      d = distanceDeci(system(a).positionLy, system(b).positionLy);
      distances[k] = d;
      distances[j * systems.length + i] = d;
    }
    return d;
  };

  const catalogue: CatalogueLane[] = sky.lanes
    .map(([a, b]) => ({ id: laneId(a, b), a: a < b ? a : b, b: a < b ? b : a, lengthDeci: distance(a, b) }))
    .sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
  const laneById = new Map(catalogue.map((l) => [l.id, l]));
  const at = new Map<SystemId, CatalogueLane[]>(systems.map((s) => [s.id, []]));
  for (const l of catalogue) {
    at.get(l.a)?.push(l);
    at.get(l.b)?.push(l);
  }
  for (const list of at.values()) list.sort((x, y) => x.lengthDeci - y.lengthDeci || (x.id < y.id ? -1 : 1));

  return {
    sky,
    systems,
    catalogue,
    hasSystem: (id) => byId.has(id),
    system,
    catalogueLane: (a, b) => laneById.get(laneId(a, b)),
    catalogueAt: (id) => at.get(id) ?? [],
    distanceDeci: distance,
  };
}
