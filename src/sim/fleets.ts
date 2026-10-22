// Fleets (M4_FLEETS.md §22, D-61): ships of one power at one system, named and ordered as one. Every
// warship sails in one; survey ships never do; colony and outpost ships may, under escort. A fleet
// moves along lanes at the pace of its slowest ship. Pure and in whole numbers.

import { FACTIONS, type FactionId } from '../content/factions.ts';
import { isHull } from '../content/ships.ts';
import type { SystemId } from '../data/types.ts';
import { designStats, shipDesign } from './designs.ts';
import { raidLanes } from './invasion.ts';
import { findRoute, type Hop, jumpPoints, lanesFor, type PlannedHop, planJourney } from './movement.ts';
import type { ReportEvent } from './report.ts';
import type { Fleet, GameState, RetreatPoint, ShipState, Stance, TargetPriority } from './state.ts';
import { interceptedBy } from './war.ts';
import type { World } from './world.ts';

/** The longest name a fleet may have. */
export const FLEET_NAME_MOST = 24;

export const STANCES: readonly Stance[] = ['engage', 'defend', 'evade'];
export const TARGETS: readonly TargetPriority[] = ['warships', 'largest', 'smallest', 'transports'];
export const RETREATS: readonly RetreatPoint[] = [25, 50, 75, 100];

/** "1st", "2nd", "3rd", "11th", "22nd". */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const last = n % 10;
  return `${n}${last === 1 ? 'st' : last === 2 ? 'nd' : last === 3 ? 'rd' : 'th'}`;
}

export function fleetById(state: GameState, id: number | null | undefined): Fleet | undefined {
  return id === null || id === undefined ? undefined : state.fleets.find((f) => f.id === id);
}

/** A fleet's ships, in the order they were built. */
export function fleetShips(state: GameState, fleet: Fleet): ShipState[] {
  return state.ships.filter((s) => s.fleet === fleet.id);
}

/** Where a fleet is: where its ships are. */
export function fleetAt(state: GameState, fleet: Fleet): SystemId | null {
  return state.ships.find((s) => s.fleet === fleet.id)?.at ?? null;
}

/** Whether a ship may sail in a fleet: not a survey ship, and not on a blind jump. */
export function canSail(ship: ShipState): boolean {
  return ship.type !== 'survey' && ship.at !== null && ship.blindJump === null;
}

/** A new fleet of a power's, named in its tradition, with its first orders. Changes the state. */
export function formFleet(state: GameState, owner: FactionId, ships: readonly ShipState[]): Fleet {
  const power = state.powers.find((p) => p.faction === owner);
  if (!power) throw new RangeError(`${owner} is not in play`);
  power.fleetsMade++;
  const fleet: Fleet = {
    id: state.nextFleetId,
    owner,
    name: `${ordinal(power.fleetsMade)} ${FACTIONS[owner].fleetWord}`,
    destinations: [],
    hold: false,
    stance: 'defend',
    target: 'warships',
    retreat: 50,
    mission: null,
  };
  state.nextFleetId++;
  state.fleets.push(fleet);
  for (const s of ships) {
    s.fleet = fleet.id;
    s.destinations = [];
    s.hold = false;
  }
  return fleet;
}

/** Takes away every fleet left with no ships. */
export function pruneFleets(state: GameState): void {
  const sailing = new Set(state.ships.map((s) => s.fleet).filter((f) => f !== null));
  state.fleets = state.fleets.filter((f) => sailing.has(f.id));
}

/**
 * A warship just built (§22.1): it joins its power's fleet waiting at that system with no
 * destinations, or forms a new fleet there. Returns the fleet.
 */
export function placeBuilt(state: GameState, ship: ShipState): Fleet {
  const waiting = state.fleets.find(
    (f) => f.owner === ship.owner && f.destinations.length === 0 && fleetAt(state, f) === ship.at,
  );
  if (waiting) {
    ship.fleet = waiting.id;
    return waiting;
  }
  return formFleet(state, ship.owner, [ship]);
}

/** Jump points a fleet has each turn: the fewest of its ships' (a jump drive adds to its own ship only). */
export function fleetPoints(state: GameState, fleet: Fleet): number {
  const ships = fleetShips(state, fleet);
  if (ships.length === 0) return 0;
  return Math.min(...ships.map((s) => shipPoints(state, s)));
}

/** A ship's jump points, with a jump drive's point. */
export function shipPoints(state: GameState, ship: ShipState): number {
  const drive = shipDesign(state, ship)?.modules.includes('jump-drive') ? 1 : 0;
  return jumpPoints(state, ship.owner, ship.type) + drive;
}

/** A fleet moves as one along lanes, at its slowest ship's pace (§22.1). */
export function moveFleet(world: World, state: GameState, fleet: Fleet, events: ReportEvent[]): void {
  const ships = fleetShips(state, fleet);
  let at = ships[0]?.at ?? null;
  if (at === null || fleet.destinations.length === 0) return;
  let points = fleetPoints(state, fleet);
  const arrived = (system: SystemId) => events.push({ kind: 'fleet-arrived', fleet: fleet.id, system });
  while (fleet.destinations.length > 0) {
    const dest = fleet.destinations[0] as SystemId;
    if (at === dest) {
      fleet.destinations.shift();
      if (fleet.destinations.length === 0) arrived(dest);
      continue;
    }
    const path = findRoute(world, state, fleet.owner, at, dest, fleetLanes(world, state, fleet));
    if (!path || path.length === 0) {
      events.push({ kind: 'fleet-blocked', fleet: fleet.id, system: at, to: dest });
      fleet.destinations = [];
      break;
    }
    const hop = path[0] as Hop;
    if (hop.cost > points) break;
    at = hop.to;
    for (const s of ships) s.at = at;
    points -= hop.cost;
    if (at === dest) {
      fleet.destinations.shift();
      if (fleet.destinations.length === 0) arrived(dest);
    }
    // Stopped where a power at war with it has warships (M4_FLEETS.md §23.4).
    const by = interceptedBy(state, fleet.owner, at);
    if (by) {
      events.push({ kind: 'intercepted', fleet: fleet.id, system: at, by });
      break;
    }
  }
}

/** The lanes a fleet may use: its power's, with passage, and an outlaw's raiders' (M4_FLEETS.md §27.1). */
export function fleetLanes(world: World, state: GameState, fleet: Fleet): Map<SystemId, Hop[]> {
  return lanesFor(world, state, fleet.owner, true, raidLanes(state, fleet));
}

/** The route and turns a fleet would take to a destination (and on through any after it). */
export function previewFleetMove(
  world: World,
  state: GameState,
  fleet: Fleet,
  destinations: readonly SystemId[],
): { hops: PlannedHop[]; turns: number; jumps: number } | null {
  let at = fleetAt(state, fleet);
  if (at === null) return null;
  const path: Hop[] = [];
  for (const d of destinations) {
    const leg = findRoute(world, state, fleet.owner, at, d, fleetLanes(world, state, fleet));
    if (!leg) return null;
    path.push(...leg);
    at = d;
  }
  const plan = planJourney(path, fleetPoints(state, fleet));
  return { ...plan, jumps: path.length };
}

/** A fleet's strength in all: its warships' attack, shields and structure, and how many ships. */
export function fleetStats(
  state: GameState,
  fleet: Fleet,
): { ships: number; warships: number; attack: number; shields: number; structure: number; left: number } {
  let attack = 0;
  let shields = 0;
  let structure = 0;
  let warships = 0;
  const ships = fleetShips(state, fleet);
  let damage = 0;
  for (const s of ships) {
    const d = shipDesign(state, s);
    if (!d) continue;
    warships++;
    const st = designStats(d);
    attack += st.attack;
    shields += st.shields;
    structure += st.structure;
    damage += s.damage;
  }
  // Structure left after battle damage, in whole points (M4_FLEETS.md §24.4).
  return { ships: ships.length, warships, attack, shields, structure, left: structure - Math.ceil(damage / 10) };
}

// ---------------------------------------------------------------- orders

function own(state: GameState, faction: FactionId, id: number): Fleet | string {
  const f = fleetById(state, id);
  if (!f) return 'There is no such fleet.';
  if (f.owner !== faction) return 'That fleet is not yours to order.';
  return f;
}

/** Why ships cannot form a fleet together (§22.1), or null. */
export function formRefusal(state: GameState, faction: FactionId, ids: unknown): string | null {
  if (!Array.isArray(ids) || ids.length === 0) return 'Choose the ships to sail together.';
  let at: SystemId | null = null;
  for (const id of ids) {
    const s = state.ships.find((x) => x.id === id);
    if (!s || s.owner !== faction) return 'There is no such ship of yours.';
    if (s.type === 'survey') return 'Survey ships sail alone.';
    if (!canSail(s)) return `${s.name} is on a blind jump.`;
    if (at !== null && s.at !== at) return 'A fleet’s ships must be at one system.';
    at = s.at;
  }
  return null;
}

/** Why a fleet order cannot be given, or null. */
export function fleetRefusal(
  state: GameState,
  faction: FactionId,
  order:
    | { type: 'merge-fleet'; fleet: number; into: number }
    | { type: 'split-fleet'; fleet: number; ships: number[] }
    | { type: 'join-fleet'; ship: number; fleet: number }
    | { type: 'leave-fleet'; ship: number }
    | { type: 'fleet-stop'; fleet: number }
    | { type: 'fleet-hold'; fleet: number; hold: boolean }
    | { type: 'fleet-orders'; fleet: number; stance?: Stance; target?: TargetPriority; retreat?: RetreatPoint }
    | { type: 'rename-fleet'; fleet: number; name: string },
): string | null {
  if (order.type === 'join-fleet' || order.type === 'leave-fleet') {
    const s = state.ships.find((x) => x.id === order.ship);
    if (!s || s.owner !== faction) return 'There is no such ship of yours.';
    if (order.type === 'leave-fleet') return s.fleet === null ? `${s.name} sails alone already.` : null;
    const f = own(state, faction, order.fleet);
    if (typeof f === 'string') return f;
    if (s.fleet === f.id) return `${s.name} sails with the ${f.name} already.`;
    if (s.type === 'survey') return 'Survey ships sail alone.';
    if (!canSail(s) || s.at !== fleetAt(state, f)) return `${s.name} is not where the ${f.name} is.`;
    return null;
  }
  const f = own(state, faction, order.fleet);
  if (typeof f === 'string') return f;
  switch (order.type) {
    case 'merge-fleet': {
      const into = own(state, faction, order.into);
      if (typeof into === 'string') return into;
      if (into.id === f.id) return 'A fleet cannot merge with itself.';
      if (fleetAt(state, into) !== fleetAt(state, f)) return `The ${into.name} is not where the ${f.name} is.`;
      return null;
    }
    case 'split-fleet': {
      const mine = fleetShips(state, f).map((s) => s.id);
      if (!Array.isArray(order.ships) || order.ships.length === 0) return 'Choose the ships to split off.';
      if (!order.ships.every((id) => mine.includes(id))) return `Those ships are not all in the ${f.name}.`;
      if (order.ships.length >= mine.length) return `They are the whole of the ${f.name}.`;
      return null;
    }
    case 'fleet-orders':
      if (order.stance !== undefined && !STANCES.includes(order.stance)) return 'There is no such stance.';
      if (order.target !== undefined && !TARGETS.includes(order.target)) return 'There is no such target.';
      if (order.retreat !== undefined && !RETREATS.includes(order.retreat)) return 'There is no such retreat point.';
      return null;
    case 'rename-fleet': {
      const name = typeof order.name === 'string' ? order.name.trim() : '';
      if (name.length === 0) return 'Give the fleet a name.';
      if (name.length > FLEET_NAME_MOST) return `A fleet’s name is ${FLEET_NAME_MOST} letters at most.`;
      return null;
    }
    default:
      return null;
  }
}

/** Ships leave their fleet: warships form a new fleet of their own, civil ships sail alone. */
export function splitOff(state: GameState, ships: readonly ShipState[]): Fleet | null {
  const war = ships.filter((s) => isHull(s.type));
  for (const s of ships) s.fleet = null;
  const formed = war.length > 0 ? formFleet(state, war[0]?.owner as FactionId, war) : null;
  pruneFleets(state);
  return formed;
}
