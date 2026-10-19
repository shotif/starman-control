// Orders (M1_FIRST_LIGHT.md §11, M1_TURNS.md §5): plain data, the same for the player and, from M3,
// the AI. Each is checked when it is given and refused with a reason; it takes effect in the state
// at once, and the movement it sets going happens when the turn ends.

import type { FactionId } from '../content/factions.ts';
import type { SystemId } from '../data/types.ts';
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
  | { type: 'auto-survey'; ship: number; on: boolean };

export type OrderResult = { ok: true; state: GameState } | { ok: false; reason: string };

function shipOf(state: GameState, faction: FactionId, id: number): ShipState | string {
  const ship = state.ships.find((s) => s.id === id);
  if (!ship) return 'There is no such ship.';
  if (ship.owner !== faction) return 'That ship is not yours to order.';
  return ship;
}

/** Why an order cannot be given, or null if it can. */
export function refuse(world: World, state: GameState, faction: FactionId, order: Order): string | null {
  const ship = shipOf(state, faction, order.ship);
  if (typeof ship === 'string') return ship;
  if (order.type === 'stop' || order.type === 'hold') return null;
  if (order.type === 'auto-survey') return ship.type === 'survey' ? null : 'Only survey ships survey.';
  if (ship.at === null) return `${ship.name} is on a blind jump and cannot be reached until it lands.`;
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
  const ship = next.ships.find((s) => s.id === order.ship) as ShipState;
  switch (order.type) {
    case 'move':
      ship.destinations = order.append ? [...ship.destinations, order.to] : [order.to];
      ship.blindJump = null;
      ship.hold = false;
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
