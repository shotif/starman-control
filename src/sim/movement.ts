// Moving ships (M1_FIRST_LIGHT.md §6, M1_TURNS.md §3): jump points, lane costs, the cheapest route
// over a power's open lanes, the preview of how many turns a journey takes, and blind jumps.

import { FACTIONS, type FactionId } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import { SHIPS } from '../content/ships.ts';
import type { SystemId } from '../data/types.ts';
import { ceilDiv } from './geometry.ts';
import { effects } from './research.ts';
import type { GameState, ShipState } from './state.ts';
import { type LaneId, laneEnds, type World } from './world.ts';

/** Jump points a power's ships have each turn: 2, plus any trait (the Wake's +1) and Jump tuning. */
export function jumpPoints(state: GameState, faction: FactionId, type?: ShipState['type']): number {
  let points = RULES.movement.jumpPoints;
  for (const t of FACTIONS[faction].traits) if (t.effect.kind === 'extra-jump-points') points += t.effect.points;
  for (const e of effects(state, faction, 'jump-points')) points += e.points;
  if (type === 'survey') {
    for (const e of effects(state, faction, 'survey-jump-points')) points += e.points;
    if (state.powers.find((p) => p.faction === faction)?.edicts.some((e) => e.edict === 'survey-drive'))
      points += RULES.edicts.surveyJumpPoints;
  }
  return points;
}

/** A lane up to 6 ly costs 1 jump point, a longer one 2. */
export function laneCost(lengthDeci: number): number {
  return lengthDeci <= RULES.movement.shortLaneDeci ? 1 : 2;
}

export interface Hop {
  lane: LaneId;
  from: SystemId;
  to: SystemId;
  cost: number;
  lengthDeci: number;
}

/** The open lanes a power's ships may use, from each system. */
export function lanesFor(world: World, state: GameState, owner: FactionId): Map<SystemId, Hop[]> {
  const out = new Map<SystemId, Hop[]>();
  for (const l of state.lanes) {
    if (l.owner !== owner || l.status !== 'open') continue;
    const [a, b] = laneEnds(l.id);
    const lengthDeci = world.catalogueLane(a, b)?.lengthDeci ?? world.distanceDeci(a, b);
    const cost = laneCost(lengthDeci);
    for (const [from, to] of [
      [a, b],
      [b, a],
    ] as const) {
      const list = out.get(from) ?? [];
      list.push({ lane: l.id, from, to, cost, lengthDeci });
      out.set(from, list);
    }
  }
  return out;
}

/**
 * The cheapest route between two systems over a power's open lanes: fewest jump points, then
 * fewest lanes, then shortest, then by system id. Null when no open lane leads there.
 */
export function findRoute(
  world: World,
  state: GameState,
  owner: FactionId,
  from: SystemId,
  to: SystemId,
): Hop[] | null {
  if (from === to) return [];
  const graph = lanesFor(world, state, owner);
  type Best = { points: number; lanes: number; deci: number; via: Hop | null };
  const best = new Map<SystemId, Best>([[from, { points: 0, lanes: 0, deci: 0, via: null }]]);
  const done = new Set<SystemId>();
  const better = (a: Best, b: Best) =>
    a.points !== b.points ? a.points < b.points : a.lanes !== b.lanes ? a.lanes < b.lanes : a.deci < b.deci;
  for (;;) {
    let cur: SystemId | null = null;
    for (const [id, b] of best) {
      if (done.has(id)) continue;
      const c = cur === null ? undefined : best.get(cur);
      if (!c || better(b, c) || (!better(c, b) && id < (cur as SystemId))) cur = id;
    }
    if (cur === null) return null;
    if (cur === to) break;
    done.add(cur);
    const here = best.get(cur) as Best;
    for (const hop of graph.get(cur) ?? []) {
      if (done.has(hop.to)) continue;
      const next: Best = {
        points: here.points + hop.cost,
        lanes: here.lanes + 1,
        deci: here.deci + hop.lengthDeci,
        via: hop,
      };
      const old = best.get(hop.to);
      if (!old || better(next, old) || (!better(old, next) && (old.via?.from ?? '') > hop.from)) best.set(hop.to, next);
    }
  }
  const path: Hop[] = [];
  for (let at = to; at !== from; ) {
    const via = best.get(at)?.via;
    if (!via) return null;
    path.unshift(via);
    at = via.from;
  }
  return path;
}

export interface PlannedHop extends Hop {
  /** The turn of the journey it is made in, from 1. */
  turn: number;
}

/**
 * How a journey along lanes goes, turn by turn: a lane is taken only while the ship still has the
 * points for it (§3), so a long lane after a short one waits for the next turn.
 */
export function planJourney(path: readonly Hop[], points: number): { hops: PlannedHop[]; turns: number } {
  const hops: PlannedHop[] = [];
  let turn = 1;
  let left = points;
  for (const hop of path) {
    if (hop.cost > left) {
      turn++;
      left = points;
    }
    hops.push({ ...hop, turn });
    left -= hop.cost;
  }
  return { hops, turns: path.length === 0 ? 0 : turn };
}

/** The route and turns a ship would take to a destination (and on through any after it). */
export function previewMove(
  world: World,
  state: GameState,
  ship: ShipState,
  destinations: readonly SystemId[],
): { hops: PlannedHop[]; turns: number; jumps: number } | null {
  if (ship.at === null) return null;
  const path: Hop[] = [];
  let at = ship.at;
  for (const d of destinations) {
    const leg = findRoute(world, state, ship.owner, at, d);
    if (!leg) return null;
    path.push(...leg);
    at = d;
  }
  const plan = planJourney(path, jumpPoints(state, ship.owner, ship.type));
  return { ...plan, jumps: path.length };
}

/** How far a power's survey ships can jump without a lane: 6 ly, and 2 more for each Lane engineering. */
export function blindReachDeci(state: GameState, owner: FactionId): number {
  return (
    RULES.blindJump.reachDeci +
    effects(state, owner, 'reach').reduce((sum, e) => sum + e.deci, 0) +
    effects(state, owner, 'blind-jump').reduce((sum, e) => sum + e.deci, 0)
  );
}

/** Turns a blind jump takes: one for every 3 ly, rounded up, less Fold charts' turn (at least one). */
export function blindJumpTurns(distanceDeci: number, state?: GameState, owner?: FactionId): number {
  const less = state && owner ? effects(state, owner, 'blind-jump').reduce((sum, e) => sum + e.turns, 0) : 0;
  return Math.max(1, ceilDiv(distanceDeci, RULES.blindJump.deciPerTurn) - less);
}

export function canJumpBlind(ship: ShipState): boolean {
  return SHIPS[ship.type].blindJumps;
}
