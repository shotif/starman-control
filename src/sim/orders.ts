// Orders (M1_FIRST_LIGHT.md §11, M1_TURNS.md §5): plain data, the same for the player and, from M3,
// the AI. Each is checked when it is given and refused with a reason; it takes effect in the state
// at once, and the movement it sets going happens when the turn ends.

import type { AnomalyId } from '../content/anomalies.ts';
import { EDICTS, type EdictId, isEdictId, isPriority, type Priority } from '../content/edicts.ts';
import type { FactionId } from '../content/factions.ts';
import type { QueueItem } from '../content/projects.ts';
import { isTechId, type TechId } from '../content/techs.ts';
import type { SystemId } from '../data/types.ts';
import { anomalyAt, investigateRefusal, investigationTurns } from './anomalies.ts';
import { approvalOf, edictCost, queueRefusal, settleRefusal } from './economy.ts';
import { choiceRefusal } from './events.ts';
import { formatLy } from './geometry.ts';
import { blindJumpTurns, blindReachDeci, canJumpBlind, findRoute } from './movement.ts';
import { queueResearch, researchRefusal, unqueueResearch } from './research.ts';
import { type GameState, powerOf, type ShipState, type TaxRate } from './state.ts';
import type { World } from './world.ts';

export type Order =
  /** Go to a system along open lanes; `append` adds it after the ship's other destinations (a waypoint). */
  | { type: 'move'; ship: number; to: SystemId; append?: boolean }
  | { type: 'blind-jump'; ship: number; to: SystemId }
  /** Forget its destinations and any blind jump not yet begun. */
  | { type: 'stop'; ship: number }
  | { type: 'hold'; ship: number; hold: boolean }
  | { type: 'auto-survey'; ship: number; on: boolean }
  /** Investigate the anomaly where a survey ship is; it stays for the turns that takes. */
  | { type: 'investigate'; ship: number }
  /** Found a colony (colony ship) or an outpost (outpost ship) on a body of the system it is at, when the turn ends. */
  | { type: 'colonise'; ship: number; body: string }
  | { type: 'found-outpost'; ship: number; body: string }
  /** A colony's or outpost's build queue: add an item at the end, take one out, or move one. */
  | { type: 'queue'; holding: number; item: QueueItem }
  | { type: 'unqueue'; holding: number; index: number }
  | { type: 'reorder'; holding: number; from: number; to: number }
  /** A district made open again, at once (M2_WORLDS.md §2). */
  | { type: 'clear-district'; holding: number; slot: number }
  /** A district worked first, before the colony's others. */
  | { type: 'work-first'; holding: number; slot: number }
  /** Steps of industry bought with credits each turn, 0 to 3 (overdrive, M2_WORLDS.md §4). */
  | { type: 'overdrive'; holding: number; steps: number }
  /** The power's tax rate (M2_WORLDS.md §4). */
  | { type: 'taxes'; rate: TaxRate }
  /** A colony's governor and its priority, or none (M2_WORLDS.md §25.1). */
  | { type: 'governor'; holding: number; priority: Priority | null }
  /** Lets a governor have a district the player zoned or cleared again. */
  | { type: 'unlock'; holding: number; slot: number }
  /** An edict, paid from attention, on a colony or the whole power (§25.2). */
  | { type: 'edict'; edict: EdictId; holding?: number }
  /** Research a technology (and what it needs): after the rest of the queue, or `now`, first. */
  | { type: 'research'; tech: TechId; now?: boolean }
  /** Take a technology out of the research queue, with anything later that needs it. */
  | { type: 'unresearch'; tech: TechId }
  /** The answer to the event waiting (M2_WORLDS.md §27), taken as the turn ends; it may be changed until then. */
  | { type: 'answer'; choice: 0 | 1 };

type HoldingOrder = Extract<Order, { holding: number }>;
type ResearchOrder = Extract<Order, { tech: TechId }>;

export type OrderResult = { ok: true; state: GameState } | { ok: false; reason: string };

function shipOf(state: GameState, faction: FactionId, id: number): ShipState | string {
  const ship = state.ships.find((s) => s.id === id);
  if (!ship) return 'There is no such ship.';
  if (ship.owner !== faction) return 'That ship is not yours to order.';
  return ship;
}

function holdingRefusal(world: World, state: GameState, faction: FactionId, order: HoldingOrder): string | null {
  const h = state.holdings.find((x) => x.id === order.holding);
  if (!h) return 'There is no such colony.';
  if (h.owner !== faction) return 'That colony is not yours.';
  if (order.type === 'queue') return queueRefusal(world, state, h, order.item);
  if (order.type === 'unqueue')
    return order.index >= 0 && order.index < h.queue.length ? null : 'Nothing is queued there.';
  if (order.type === 'clear-district' || order.type === 'work-first')
    return h.districts.some((d) => d.slot === order.slot) ? null : 'That district is open.';
  if (order.type === 'governor') {
    if (h.kind !== 'colony') return 'Outposts have no governors.';
    return order.priority === null || isPriority(order.priority) ? null : 'There is no such priority.';
  }
  if (order.type === 'unlock') return h.locked.includes(order.slot) ? null : 'That district is not locked.';
  if (order.type === 'overdrive') {
    if (h.kind !== 'colony') return 'Only colonies can be overdriven.';
    if (!Number.isInteger(order.steps) || order.steps < 0 || order.steps > 3) return 'Overdrive is 0 to 3 steps.';
    if (order.steps > h.overdrive && powerOf(state, faction).treasury <= 0)
      return 'The treasury has nothing to pay for it.';
    return null;
  }
  const { from, to } = order;
  return from >= 0 && from < h.queue.length && to >= 0 && to < h.queue.length ? null : 'Nothing is queued there.';
}

function researchOrderRefusal(state: GameState, faction: FactionId, order: ResearchOrder): string | null {
  if (!isTechId(order.tech)) return 'There is no such technology.';
  if (order.type === 'research') return researchRefusal(state, faction, order.tech);
  return powerOf(state, faction).researchQueue.includes(order.tech) ? null : 'That is not being researched.';
}

/** Why an edict cannot be issued (M2_WORLDS.md §25.2), or null if it can. */
function edictRefusal(
  world: World,
  state: GameState,
  faction: FactionId,
  edict: EdictId,
  holding?: number,
): string | null {
  if (!isEdictId(edict)) return 'There is no such edict.';
  const def = EDICTS[edict];
  const power = powerOf(state, faction);
  if (power.edicts.some((e) => e.edict === edict)) return `A ${def.name.toLowerCase()} is already in force.`;
  const cost = edictCost(state, faction, edict);
  if (power.attention < cost) return `Not enough attention: it needs ${cost}, and there is ${power.attention}.`;
  if (def.target === 'power') return null;
  const h = state.holdings.find((x) => x.id === holding);
  if (!h || h.owner !== faction || h.kind !== 'colony') return 'Choose one of your colonies.';
  if (edict === 'martial-order') {
    const level = approvalOf(world, state, h).level;
    if (level !== 'unrest' && level !== 'revolt') return 'Only a colony in unrest or revolt needs martial order.';
  }
  return null;
}

/** Why an order cannot be given, or null if it can. */
export function refuse(world: World, state: GameState, faction: FactionId, order: Order): string | null {
  if ('tech' in order) return researchOrderRefusal(state, faction, order);
  if (order.type === 'edict') return edictRefusal(world, state, faction, order.edict, order.holding);
  if (order.type === 'taxes')
    return order.rate === 'low' || order.rate === 'standard' || order.rate === 'high'
      ? null
      : 'There is no such tax rate.';
  if (order.type === 'answer') return choiceRefusal(state, faction, order.choice);
  if (!('ship' in order)) return holdingRefusal(world, state, faction, order);
  const ship = shipOf(state, faction, order.ship);
  if (typeof ship === 'string') return ship;
  if (order.type === 'stop' || order.type === 'hold') return null;
  if (order.type === 'investigate') return investigateRefusal(state, ship);
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
  return applyChecked(world, next, faction, order);
}

/**
 * Gives an order to a state in place (a rival's, as its turn begins, §26.2): the reason it is
 * refused, or null once it is in effect. The state is changed only when the order is allowed.
 */
export function applyInPlace(world: World, state: GameState, faction: FactionId, order: Order): string | null {
  const reason = refuse(world, state, faction, order);
  if (reason) return reason;
  const r = applyChecked(world, state, faction, order);
  return r.ok ? null : r.reason;
}

/** Puts an order already checked into effect in `next`, which it changes. */
function applyChecked(world: World, next: GameState, faction: FactionId, order: Order): OrderResult {
  if ('tech' in order) {
    const p = powerOf(next, faction);
    p.researchQueue =
      order.type === 'research' ? queueResearch(p, order.tech, order.now === true) : unqueueResearch(p, order.tech);
    return { ok: true, state: next };
  }
  if (order.type === 'taxes') {
    powerOf(next, faction).taxes = order.rate;
    return { ok: true, state: next };
  }
  if (order.type === 'answer') {
    const ev = powerOf(next, faction).event;
    if (ev) ev.answer = order.choice;
    return { ok: true, state: next };
  }
  if (order.type === 'edict') {
    const def = EDICTS[order.edict];
    const power = powerOf(next, faction);
    power.attention -= edictCost(next, faction, order.edict);
    power.edicts.push({
      edict: order.edict,
      holding: def.target === 'colony' ? (order.holding ?? null) : null,
      left: def.turns,
    });
    return { ok: true, state: next };
  }
  if (!('ship' in order)) {
    const h = next.holdings.find((x) => x.id === order.holding);
    if (!h) return { ok: false, reason: 'There is no such colony.' };
    // What the player zones, rezones or clears, and queues, is theirs: no governor touches it.
    const lock = (slot: number) => {
      if (!h.locked.includes(slot)) h.locked = [...h.locked, slot].sort((a, b) => a - b);
    };
    if (order.type === 'queue') {
      const { governor: _, ...item } = order.item;
      h.queue.push(item);
      if (item.kind === 'zone') lock(item.slot);
    } else if (order.type === 'unqueue') h.queue.splice(order.index, 1);
    else if (order.type === 'clear-district') {
      h.districts = h.districts.filter((d) => d.slot !== order.slot);
      lock(order.slot);
    } else if (order.type === 'governor') h.governor = order.priority;
    else if (order.type === 'unlock') h.locked = h.locked.filter((s) => s !== order.slot);
    else if (order.type === 'work-first') {
      const d = h.districts.find((x) => x.slot === order.slot);
      if (d) h.districts = [d, ...h.districts.filter((x) => x !== d)];
    } else if (order.type === 'overdrive') h.overdrive = order.steps;
    else {
      const [item] = h.queue.splice(order.from, 1);
      if (item) h.queue.splice(order.to, 0, item);
    }
    return { ok: true, state: next };
  }
  const ship = next.ships.find((s) => s.id === order.ship) as ShipState;
  switch (order.type) {
    case 'investigate': {
      const at = ship.at as SystemId;
      const id = anomalyAt(next.seed, at) as AnomalyId;
      ship.investigating = { system: at, left: investigationTurns(next, faction, id) };
      ship.destinations = [];
      ship.blindJump = null;
      break;
    }
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
      ship.investigating = null;
      break;
    case 'blind-jump': {
      const at = ship.at as SystemId;
      const turns = blindJumpTurns(world.distanceDeci(at, order.to), next, faction);
      ship.blindJump = { from: at, to: order.to, turns, left: turns };
      ship.destinations = [];
      ship.hold = false;
      ship.investigating = null;
      break;
    }
    case 'stop':
      ship.destinations = [];
      ship.founding = null;
      ship.investigating = null;
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
