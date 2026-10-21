// Building and relighting lanes (M1_FIRST_LIGHT.md §3, M1_LANES_RESEARCH.md §1, D-19c): what a
// lane costs, how far a power can reach, the beacon slots at each end, and why a lane cannot be
// queued. Pure and in whole numbers.

import { FACTIONS, type FactionId } from '../content/factions.ts';
import type { Cost } from '../content/projects.ts';
import { RULES } from '../content/rules.ts';
import type { SystemId } from '../data/types.ts';
import { ceilDiv, formatLy } from './geometry.ts';
import { effects } from './research.ts';
import { beaconSlots, type GameState } from './state.ts';
import { laneEnds, laneId, type World } from './world.ts';

export interface LaneQuote {
  from: SystemId;
  to: SystemId;
  lengthDeci: number;
  /** One of Reborn's old lanes, dark since the Lapse: half the cost and time of a new one. */
  relight: boolean;
  cost: Cost;
  /** Turns it is tuned for once paid. */
  turns: number;
}

/** How far a power can build a new lane: 6 ly, and 2 more for each Lane engineering. */
export function laneReachDeci(state: GameState, faction: FactionId): number {
  return RULES.lanes.reachDeci + effects(state, faction, 'reach').reduce((sum, e) => sum + e.deci, 0);
}

/** What a lane from one star to another costs, new or relit. */
export function laneQuote(world: World, state: GameState, faction: FactionId, from: SystemId, to: SystemId): LaneQuote {
  const old = world.catalogueLane(from, to);
  const lengthDeci = old?.lengthDeci ?? world.distanceDeci(from, to);
  const r = RULES.lanes;
  const cost: Cost = {
    industry: r.industryBase + ceilDiv(r.industryPerLy * lengthDeci, 10),
    metals: ceilDiv(r.metalsPerLy * lengthDeci, 10),
    volatiles: 0,
    fuel: ceilDiv(r.fuelPerLy * lengthDeci, 10),
  };
  let turns = r.tuningTurns + ceilDiv(lengthDeci, r.deciPerTuningTurn);
  if (old) {
    cost.industry = ceilDiv(cost.industry, 2);
    cost.metals = ceilDiv(cost.metals, 2);
    cost.fuel = ceilDiv(cost.fuel, 2);
    turns = ceilDiv(turns, 2);
  }
  // Lane weaving tunes lanes faster (M2B_SCIENCE.md §18.2).
  for (const e of effects(state, faction, 'tuning-percent')) turns = Math.max(1, ceilDiv(turns * e.percent, 100));
  // The Lanewright Foundry (M2B_SCIENCE.md §20.2).
  if (state.holdings.some((h) => h.owner === faction && h.projects.includes('lanewright-foundry'))) {
    const keep = 100 - RULES.greatWorks.foundryLanePercent;
    cost.industry = ceilDiv(cost.industry * keep, 100);
    cost.metals = ceilDiv(cost.metals * keep, 100);
    cost.fuel = ceilDiv(cost.fuel * keep, 100);
  }
  for (const e of effects(state, faction, 'lane-discount')) {
    const keep = 100 - e.percent;
    cost.industry = ceilDiv(cost.industry * keep, 100);
    cost.metals = ceilDiv(cost.metals * keep, 100);
    cost.fuel = ceilDiv(cost.fuel * keep, 100);
  }
  return { from, to, lengthDeci, relight: old !== undefined, cost, turns };
}

/**
 * Lanes anchored at a star: open or being tuned, any power's, and lanes waiting in the queues of
 * `queuedBy` (a power cannot see the others' queues: whoever pays first takes the slot, §26.4).
 */
export function slotsUsed(state: GameState, system: SystemId, queuedBy: FactionId | null = null): number {
  let n = 0;
  for (const l of state.lanes) if (laneEnds(l.id).includes(system)) n++;
  if (queuedBy)
    for (const h of state.holdings) {
      if (h.owner !== queuedBy) continue;
      for (const item of h.queue) if (item.kind === 'lane' && (h.system === system || item.to === system)) n++;
    }
  return n;
}

/**
 * Why a power cannot queue a lane from a system it holds to another star, or null if it can.
 * `queued: false` leaves out lanes waiting in queues: the check made when a lane is paid for.
 */
export function laneRefusal(
  world: World,
  state: GameState,
  faction: FactionId,
  from: SystemId,
  to: SystemId,
  queued = true,
): string | null {
  if (!world.hasSystem(to)) return 'There is no such system.';
  if (from === to) return 'A lane needs two stars.';
  const name = world.system(to).name;
  const id = laneId(from, to);
  const lane = state.lanes.find((l) => l.id === id);
  if (lane) {
    const whose = lane.owner === faction ? 'A lane' : `The ${FACTIONS[lane.owner].shortName}’s lane`;
    const closed = lane.owner === faction ? '' : ', closed to your ships';
    return lane.status === 'open'
      ? `${whose} to ${name} is already open${closed}.`
      : `${whose} to ${name} is being tuned${closed}.`;
  }
  if (
    queued &&
    state.holdings.some(
      (h) => h.owner === faction && h.queue.some((q) => q.kind === 'lane' && laneId(h.system, q.to) === id),
    )
  )
    return `A lane to ${name} is already queued.`;
  if (!world.catalogueLane(from, to)) {
    const d = world.distanceDeci(from, to);
    const reach = laneReachDeci(state, faction);
    if (d > reach) return `Out of reach: ${formatLy(d)}, and your lane reach is ${formatLy(reach)}.`;
  }
  for (const end of [from, to]) {
    const slots = beaconSlots(state, end);
    if (slotsUsed(state, end, queued ? faction : null) >= slots)
      return `No free beacon slot at ${world.system(end).name}: its ${slots} are in use.`;
  }
  return null;
}

/** Every lane a power might queue from a system: dark lanes to relight, and stars within reach. */
export function laneTargets(
  world: World,
  state: GameState,
  faction: FactionId,
  from: SystemId,
): { quote: LaneQuote; refusal: string | null }[] {
  const reach = laneReachDeci(state, faction);
  const open = new Set(state.lanes.map((l) => l.id));
  const ids = new Set<SystemId>();
  for (const l of world.catalogueAt(from)) ids.add(l.a === from ? l.b : l.a);
  for (const s of world.systems) if (s.id !== from && world.distanceDeci(from, s.id) <= reach) ids.add(s.id);
  return [...ids]
    .filter((to) => !open.has(laneId(from, to)))
    .map((to) => ({
      quote: laneQuote(world, state, faction, from, to),
      refusal: laneRefusal(world, state, faction, from, to),
    }))
    .sort((a, b) => a.quote.lengthDeci - b.quote.lengthDeci || (a.quote.to < b.quote.to ? -1 : 1));
}
