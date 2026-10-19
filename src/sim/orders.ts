// Orders (M1_FIRST_LIGHT.md §11, M1_TURNS.md §5): plain data, the same for the player and, from M3,
// the AI. Each is checked when it is given and refused with a reason; it takes effect in the state
// at once, and the movement it sets going happens when the turn ends.

import type { FactionId } from '../content/factions.ts';
import type { QueueItem } from '../content/projects.ts';
import type { SystemId } from '../data/types.ts';
import { queueRefusal, settleRefusal } from './economy.ts';
import { formatLy } from './geometry.ts';
import { blindJumpTurns, blindReachDeci, canJumpBlind, findRoute } from './movement.ts';
import type { GameState, ShipState } from './state.ts';
import type { World } from './world.ts';

export type Order =
  /** Go to a system along open lanes; `append` adds it after the ship's other destinations (a waypoint). */
  | { type: 'move'; ship: number; to: SystemId; append?: boolean }
  | { type: 'blind-jump'; ship: number; to: SystemId }
  /** Forget its destinations and any blind jump not yet begun. */
  | { type: 'stop'; ship: number }
  | { type: 'hold'; ship: number; hold: boolean }
  | { type: 'auto-survey'; ship: number; on: boolean }
  /** Found a colony (colony ship) or an outpost (outpost ship) on a body of the system it is at, when the turn ends. */
  | { type: 'colonise'; ship: number; body: string }
  | { type: 'found-outpost'; ship: number; body: string }
  /** A colony's build queue: add an item at the end, take one out, or move one. */
  | { type: 'queue'; holding: number; item: QueueItem }
  | { type: 'unqueue'; holding: number; index: number }
  | { type: 'reorder'; holding: number; from: number; to: number };

type ShipOrder = Extract<Order, { ship: number }>;

export type OrderResult = { ok: true; state: GameState } | { ok: false; reason: string };

function shipOf(state: GameState, faction: FactionId, id: number): ShipState | string {
  const ship = state.ships.find((s) => s.id === id);
  if (!ship) return 'There is no such ship.';
  if (ship.owner !== faction) return 'That ship is not yours to order.';
  return ship;
}

function holdingRefusal(state: GameState, faction: FactionId, order: Exclude<Order, ShipOrder>): string | null {
  const h = state.holdings.find((x) => x.id === order.holding);
  if (!h) return 'There is no such colony.';
  if (h.owner !== faction) return 'That colony is not yours.';
  if (order.type === 'queue') return queueRefusal(h, order.item);
  if (order.type === 'unqueue')
    return order.index >= 0 && order.index < h.queue.length ? null : 'Nothing is queued there.';
  const { from, to } = order;
  return from >= 0 && from < h.queue.length && to >= 0 && to < h.queue.length ? null : 'Nothing is queued there.';
}

/** Why an order cannot be given, or null if it can. */
export function refuse(world: World, state: GameState, faction: FactionId, order: Order): string | null {
  if (!('ship' in order)) return holdingRefusal(state, faction, order);
  const ship = shipOf(state, faction, order.ship);
  if (typeof ship === 'string') return ship;
  if (order.type === 'stop' || order.type === 'hold') return null;
  if (order.type === 'auto-survey') return ship.type === 'survey' ? null : 'Only survey ships survey.';
  if (ship.at === null) return `${ship.name} is on a blind jump and cannot be reached until it lands.`;
  if (order.type === 'colonise' || order.type === 'found-outpost') {
    const kind = order.type === 'colonise' ? 'colony' : 'outpost';
    if (ship.type !== kind)
      return `Only ${kind === 'colony' ? 'colony' : 'outpost'} ships can found ${kind === 'colony' ? 'colonies' : 'outposts'}.`;
    return settleRefusal(world, state, faction, ship.at, order.body, kind);
  }
  if (!world.hasSystem(order.to)) return 'There is no such system.';
  if (order.type === 'move') {
    const from = order.append ? (ship.destinations.at(-1) ?? ship.at) : ship.at;
    if (from === order.to) return `${ship.name} is already there.`;
    if (!findRoute(world, state, ship.owner, from, order.to))
      return `No open lane leads to ${world.system(order.to).name}.`;
    return null;
  }
  if (!canJumpBlind(ship)) return 'Only survey ships can jump without a lane.';
  if (ship.at === order.to) return `${ship.name} is already there.`;
  const d = world.distanceDeci(ship.at, order.to);
  const reach = blindReachDeci(state, ship.owner);
  if (d > reach) return `Too far to jump blind: ${formatLy(d)}, and the reach is ${formatLy(reach)}.`;
  return null;
}

/** Gives an order: a new state with it in effect, or the reason it is refused. */
export function applyOrder(world: World, state: GameState, faction: FactionId, order: Order): OrderResult {
  const reason = refuse(world, state, faction, order);
  if (reason) return { ok: false, reason };
  const next = structuredClone(state);
  if (!('ship' in order)) {
    const h = next.holdings.find((x) => x.id === order.holding);
    if (!h) return { ok: false, reason: 'There is no such colony.' };
    if (order.type === 'queue') h.queue.push(order.item);
    else if (order.type === 'unqueue') h.queue.splice(order.index, 1);
    else {
      const [item] = h.queue.splice(order.from, 1);
      if (item) h.queue.splice(order.to, 0, item);
    }
    return { ok: true, state: next };
  }
  const ship = next.ships.find((s) => s.id === order.ship) as ShipState;
  switch (order.type) {
    case 'colonise':
    case 'found-outpost':
      ship.founding = { kind: order.type === 'colonise' ? 'colony' : 'outpost', body: order.body };
      ship.destinations = [];
      ship.blindJump = null;
      break;
    case 'move':
      ship.destinations = order.append ? [...ship.destinations, order.to] : [order.to];
      ship.blindJump = null;
      ship.hold = false;
      ship.founding = null;
      break;
    case 'blind-jump': {
      const at = ship.at as SystemId;
      const turns = blindJumpTurns(world.distanceDeci(at, order.to));
      ship.blindJump = { from: at, to: order.to, turns, left: turns };
      ship.destinations = [];
      ship.hold = false;
      break;
    }
    case 'stop':
      ship.destinations = [];
      ship.founding = null;
      if (ship.blindJump && ship.blindJump.left === ship.blindJump.turns) ship.blindJump = null;
      break;
    case 'hold':
      ship.hold = order.hold;
      if (order.hold) {
        ship.destinations = [];
        if (ship.blindJump && ship.blindJump.left === ship.blindJump.turns) ship.blindJump = null;
      }
      break;
    case 'auto-survey':
      ship.autoSurvey = order.on;
      break;
  }
  return { ok: true, state: next };
}
