// Borders and trade (M3_NEIGHBOURS.md §22, D-54): every colony claims its own system and every
// system one lane away; an outpost its own system. A system held by one power is its own; one
// claimed by more than one, and held by none or by several, is contested, unless a border treaty
// shares it out. Claims are worked out, never stored. Trade brings both sides credits every turn.

import type { FactionId } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import type { SystemId } from '../data/types.ts';
import { type GameState, treatyOf } from './state.ts';
import { laneEnds, otherEnd, type World } from './world.ts';

/** A system's claim: its owner, or the powers that contest it. */
export interface Claim {
  /** The power whose system it is, by holding or by claim; null where contested or unclaimed. */
  owner: FactionId | null;
  /** Every power that claims it, in the order the powers are listed. */
  claimants: FactionId[];
  /** Whether a border treaty decided it. */
  settled: boolean;
}

/** The systems one lane away: along the old lanes, and any lane built since, open or not. */
export function neighbours(world: World, state: GameState, system: SystemId): SystemId[] {
  const out = new Set<SystemId>(world.catalogueAt(system).map((l) => otherEnd(l.id, system)));
  for (const l of state.lanes) if (laneEnds(l.id).includes(system)) out.add(otherEnd(l.id, system));
  return [...out];
}

/** The powers that claim a system (§22.1): those holding anything there, and those with a colony one lane away. */
export function claimantsAt(world: World, state: GameState, system: SystemId): FactionId[] {
  const near = new Set(neighbours(world, state, system));
  const who = new Set<FactionId>();
  for (const h of state.holdings)
    if (h.system === system || (h.kind === 'colony' && near.has(h.system))) who.add(h.owner);
  return state.powers.map((p) => p.faction).filter((f) => who.has(f));
}

/** The tenths of a light-year from a system to a power's nearest colony. */
function nearestColony(world: World, state: GameState, f: FactionId, system: SystemId): number {
  let best = Number.POSITIVE_INFINITY;
  for (const h of state.holdings)
    if (h.owner === f && h.kind === 'colony') best = Math.min(best, world.distanceDeci(system, h.system));
  return best;
}

/**
 * A system's claim (§22.1, §22.3): its holder's if one power holds it; contested if several do;
 * otherwise its one claimant's, or, between powers with a border treaty, the one whose nearest
 * colony is nearer (at an equal distance, the one listed first).
 */
export function claimOf(world: World, state: GameState, system: SystemId): Claim {
  const holders = state.powers
    .map((p) => p.faction)
    .filter((f) => state.holdings.some((h) => h.owner === f && h.system === system));
  if (holders.length === 1) return { owner: holders[0] as FactionId, claimants: holders, settled: false };
  if (holders.length > 1) return { owner: null, claimants: holders, settled: false };
  const claimants = claimantsAt(world, state, system);
  let left = [...claimants];
  let settled = false;
  for (const x of claimants)
    for (const y of claimants) {
      if (x >= y || !left.includes(x) || !left.includes(y) || !treatyOf(state, x, y, 'border')) continue;
      const dx = nearestColony(world, state, x, system);
      const dy = nearestColony(world, state, y, system);
      const order = state.powers.map((p) => p.faction);
      const loser = dx < dy ? y : dy < dx ? x : order.indexOf(x) < order.indexOf(y) ? y : x;
      left = left.filter((f) => f !== loser);
      settled = true;
    }
  return { owner: left.length === 1 ? (left[0] as FactionId) : null, claimants, settled: settled && left.length === 1 };
}

/** Every claimed system's claim, for the map and the screens. */
export function claimsOf(world: World, state: GameState): Map<SystemId, Claim> {
  const systems = new Set<SystemId>();
  for (const h of state.holdings) {
    systems.add(h.system);
    if (h.kind === 'colony') for (const n of neighbours(world, state, h.system)) systems.add(n);
  }
  return new Map([...systems].map((s) => [s, claimOf(world, state, s)]));
}

/**
 * What a trade agreement brings each side a turn (§22.4): 1 for every 4 colonies of the smaller
 * side (at least 1), and 1 for each open lane joining a system of one to a system of the other, at
 * most 10.
 */
export function tradeOf(state: GameState, a: FactionId, b: FactionId): number {
  const t = RULES.treaties;
  const colonies = (f: FactionId) => state.holdings.filter((h) => h.owner === f && h.kind === 'colony').length;
  const held = (f: FactionId) => new Set(state.holdings.filter((h) => h.owner === f).map((h) => h.system));
  const ha = held(a);
  const hb = held(b);
  const lanes = state.lanes.filter((l) => {
    if (l.status !== 'open') return false;
    const [x, y] = laneEnds(l.id);
    return (ha.has(x) && hb.has(y)) || (ha.has(y) && hb.has(x));
  }).length;
  const base = Math.max(1, Math.floor(Math.min(colonies(a), colonies(b)) / t.tradeColonies));
  return Math.min(t.tradeMost, base + lanes * t.tradeLane);
}

/** Every trade agreement's credits for a power this turn, from the turn after it was agreed. */
export function tradeIncome(state: GameState, f: FactionId): { faction: FactionId; credits: number }[] {
  return state.treaties
    .filter((t) => t.kind === 'trade' && (t.a === f || t.b === f) && t.since < state.turn)
    .map((t) => {
      const other = t.a === f ? t.b : t.a;
      return { faction: other, credits: tradeOf(state, f, other) };
    });
}
