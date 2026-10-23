// Orders (M1_FIRST_LIGHT.md §11, M1_TURNS.md §5): plain data, the same for the player and, from M3,
// the AI. Each is checked when it is given and refused with a reason; it takes effect in the state
// at once, and the movement it sets going happens when the turn ends.

import type { AnomalyId } from '../content/anomalies.ts';
import { EDICTS, type EdictId, isEdictId, isPriority, type Priority } from '../content/edicts.ts';
import { type FactionId, WAR_REASONS, type WarReason } from '../content/factions.ts';
import type { ModuleId } from '../content/modules.ts';
import type { QueueItem } from '../content/projects.ts';
import type { HullId } from '../content/ships.ts';
import { isTechId, type TechId } from '../content/techs.ts';
import { isTreatyKind, type TreatyKind } from '../content/treaties.ts';
import type { SystemId } from '../data/types.ts';
import { anomalyAt, investigateRefusal, investigationTurns } from './anomalies.ts';
import { arksRefusal, setArksAnswer } from './arks.ts';
import { castVote, propose, proposeRefusal, voteRefusal } from './assembly.ts';
import { designRefusal, makeDesign, retireRefusal } from './designs.ts';
import { approvalOf, edictCost, queueRefusal, settleRefusal } from './economy.ts';
import { isGuardStep, setWatch, watchRefusal } from './espionage.ts';
import { choiceRefusal } from './events.ts';
import {
  fleetAt,
  fleetById,
  fleetLanes,
  fleetRefusal,
  formFleet,
  formRefusal,
  pruneFleets,
  splitOff,
} from './fleets.ts';
import { formatLy } from './geometry.ts';
import { missionRefusal } from './invasion.ts';
import { beginAnswer, beginAnswerRefusal } from './keys.ts';
import { dismiss, dismissRefusal, hire, hireRefusal, postLeader, postRefusal } from './leaders.ts';
import { giftRefusal, giveGift } from './memory.ts';
import { blindJumpTurns, blindReachDeci, canJumpBlind, findRoute } from './movement.ts';
import { chapterRefusal, digAt, excavate, excavateRefusal, stopExcavation, stopRefusal } from './relics.ts';
import { queueResearch, researchRefusal, unqueueResearch } from './research.ts';
import {
  type Amount,
  type ArkAnswer,
  DIG_SHARES,
  type DigShare,
  type GameState,
  type GuardStep,
  type Mission,
  type OfferKind,
  powerOf,
  type ResolutionKind,
  type RetreatPoint,
  type ShipState,
  type Stance,
  type TargetPriority,
  type TaxRate,
  type VoteChoice,
} from './state.ts';
import {
  answerOffer,
  answerRefusal,
  endRefusal,
  endTreaty,
  exchangeShort,
  makeOffer,
  offerRefusal,
} from './treaties.ts';
import { declareRefusal, declareWar } from './war.ts';
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
  | { type: 'answer'; choice: 0 | 1 }
  /** A gift of credits to another power, sent as the turn ends; 0 takes it back (M3_NEIGHBOURS.md §20.2). */
  | { type: 'gift'; to: FactionId; credits: number }
  /** A treaty or an exchange offered, answered, ended with notice or broken (M3_NEIGHBOURS.md §21, §23). */
  | { type: 'offer'; to: FactionId; treaty: OfferKind; give?: Amount; get?: Amount }
  | { type: 'answer-offer'; from: FactionId; treaty: OfferKind; accept: boolean }
  /** War declared on a power, at once (M4_FLEETS.md §23.1); a rival gives its reason (§28.1). */
  | { type: 'declare-war'; on: FactionId; reason?: WarReason }
  /** The Assembly (M4_FLEETS.md §29): a vote on what is before it this turn, and a resolution proposed. */
  | { type: 'vote'; choice: VoteChoice }
  | { type: 'propose'; resolution: ResolutionKind; on: FactionId; and?: FactionId }
  | { type: 'end-treaty'; with: FactionId; treaty: TreatyKind }
  | { type: 'break-treaty'; with: FactionId; treaty: TreatyKind }
  /** A warship design of the power's own (M4_FLEETS.md §21.3), and one taken off the build lists. */
  | { type: 'design'; hull: HullId; name: string; modules: ModuleId[] }
  | { type: 'retire-design'; design: number }
  /** Fleets (M4_FLEETS.md §22.1): formed, merged, split, joined and left; moved, stopped, held and given battle orders. */
  | { type: 'form-fleet'; ships: number[] }
  | { type: 'merge-fleet'; fleet: number; into: number }
  | { type: 'split-fleet'; fleet: number; ships: number[] }
  | { type: 'join-fleet'; ship: number; fleet: number }
  | { type: 'leave-fleet'; ship: number }
  | { type: 'fleet-move'; fleet: number; to: SystemId; append?: boolean }
  | { type: 'fleet-stop'; fleet: number }
  | { type: 'fleet-hold'; fleet: number; hold: boolean }
  | { type: 'fleet-orders'; fleet: number; stance?: Stance; target?: TargetPriority; retreat?: RetreatPoint }
  | { type: 'rename-fleet'; fleet: number; name: string }
  /** An invasion or a bombardment of a holding in the fleet's system, or none (M4_FLEETS.md §26.4, §26.5). */
  | { type: 'fleet-mission'; fleet: number; mission: Mission | null }
  /** Relic sites (M5_UNKNOWN.md §20.3): an excavation begun or stopped, the share of research, a chapter's choice. */
  | { type: 'excavate'; system: SystemId }
  | { type: 'stop-excavation'; system: SystemId }
  | { type: 'dig-share'; share: DigShare }
  | { type: 'chapter-choice'; system: SystemId; choice: 0 | 1 }
  /** The Answer begun (M5_UNKNOWN.md §21.3). */
  | { type: 'begin-answer' }
  /** Agents set to watch a power, or recalled; and the guard kept at home (M5_UNKNOWN.md §23). */
  | { type: 'watch'; on: FactionId; watch: boolean }
  | { type: 'guard'; level: GuardStep }
  /** A leader hired, posted (or called back with null), or let go (M5_UNKNOWN.md §24). */
  | { type: 'hire'; leader: number }
  | { type: 'post'; leader: number; post: number | null }
  | { type: 'dismiss'; leader: number }
  /** Our answer to the arks of the Unhomed (M5_UNKNOWN.md §25.3): a world given, taking them in, or refusing. */
  | { type: 'arks'; answer: ArkAnswer; body: string | null };

type FleetOrder = Extract<
  Order,
  {
    type:
      | 'merge-fleet'
      | 'split-fleet'
      | 'join-fleet'
      | 'leave-fleet'
      | 'fleet-stop'
      | 'fleet-hold'
      | 'fleet-orders'
      | 'rename-fleet';
  }
>;

const FLEET_ORDERS: readonly string[] = [
  'merge-fleet',
  'split-fleet',
  'join-fleet',
  'leave-fleet',
  'fleet-stop',
  'fleet-hold',
  'fleet-orders',
  'rename-fleet',
];

function isFleetOrder(o: Order): o is FleetOrder {
  return FLEET_ORDERS.includes(o.type);
}

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
  if (order.type === 'excavate') return excavateRefusal(world, state, faction, order.system);
  if (order.type === 'stop-excavation') return stopRefusal(state, faction, order.system);
  if (order.type === 'dig-share') return DIG_SHARES.includes(order.share) ? null : 'There is no such share.';
  if (order.type === 'begin-answer') return beginAnswerRefusal(state, faction);
  if (order.type === 'watch') return watchRefusal(state, faction, order.on, order.watch);
  if (order.type === 'guard') return isGuardStep(order.level) ? null : 'There is no such guard.';
  if (order.type === 'hire') return hireRefusal(state, faction, order.leader);
  if (order.type === 'post') return postRefusal(state, faction, order.leader, order.post);
  if (order.type === 'dismiss') return dismissRefusal(state, faction, order.leader);
  if (order.type === 'arks') return arksRefusal(world, state, faction, order.answer, order.body);
  if (order.type === 'chapter-choice')
    return order.choice === 0 || order.choice === 1
      ? chapterRefusal(state, faction, order.system)
      : 'There is no such choice.';
  if (order.type === 'gift') return giftRefusal(state, faction, order.to, order.credits);
  if (order.type === 'design') return designRefusal(powerOf(state, faction), order.hull, order.name, order.modules);
  if (order.type === 'form-fleet') return formRefusal(state, faction, order.ships);
  if (isFleetOrder(order)) return fleetRefusal(state, faction, order);
  if (order.type === 'fleet-mission') {
    const f = fleetById(state, order.fleet);
    if (!f || f.owner !== faction) return 'There is no such fleet of yours.';
    if (order.mission === null) return f.mission ? null : `The ${f.name} has no mission.`;
    const m = order.mission as Partial<Mission> | null;
    if (
      !m ||
      typeof m !== 'object' ||
      (m.kind !== 'invade' && m.kind !== 'bombard' && m.kind !== 'raid') ||
      typeof m.holding !== 'number'
    )
      return 'There is no such mission.';
    return missionRefusal(state, f, order.mission);
  }
  if (order.type === 'fleet-move') {
    const f = fleetById(state, order.fleet);
    if (!f || f.owner !== faction) return 'There is no such fleet of yours.';
    const at = fleetAt(state, f);
    if (at === null) return `The ${f.name} has no ships.`;
    if (!world.hasSystem(order.to)) return 'There is no such system.';
    const from = order.append ? (f.destinations.at(-1) ?? at) : at;
    if (from === order.to) return `The ${f.name} is already there.`;
    if (!findRoute(world, state, faction, from, order.to, fleetLanes(world, state, f)))
      return `No open lane leads to ${world.system(order.to).name}.`;
    return null;
  }
  if (order.type === 'retire-design') return retireRefusal(powerOf(state, faction), order.design);
  if (
    order.type === 'offer' ||
    order.type === 'answer-offer' ||
    order.type === 'end-treaty' ||
    order.type === 'break-treaty'
  ) {
    const exchange = order.treaty === 'exchange' && (order.type === 'offer' || order.type === 'answer-offer');
    const peace =
      (order.treaty === 'peace' || order.treaty === 'capitulation') &&
      (order.type === 'offer' || order.type === 'answer-offer');
    if (!exchange && !peace && !isTreatyKind(order.treaty)) return 'There is no such treaty.';
    if (order.type === 'offer') return offerRefusal(state, faction, order.to, order.treaty, order.give, order.get);
    if (order.type === 'answer-offer')
      return (
        answerRefusal(state, faction, order.from, order.treaty) ??
        (exchange && order.accept ? exchangeShort(state, faction, order.from) : null)
      );
    return endRefusal(state, faction, order.with, order.treaty as TreatyKind, order.type === 'break-treaty');
  }
  if (order.type === 'declare-war') {
    if (order.reason !== undefined && !(order.reason in WAR_REASONS)) return 'There is no such reason.';
    return declareRefusal(state, faction, order.on);
  }
  if (order.type === 'vote') return voteRefusal(state, faction, order.choice);
  if (order.type === 'propose') {
    if (order.resolution !== 'sanctions' && order.resolution !== 'peace-call') return 'There is no such resolution.';
    return proposeRefusal(state, faction, { kind: order.resolution, on: order.on, and: order.and });
  }
  if (!('ship' in order)) return holdingRefusal(world, state, faction, order);
  const ship = shipOf(state, faction, order.ship);
  if (typeof ship === 'string') return ship;
  // A ship in a fleet goes where its fleet goes (M4_FLEETS.md §22.2).
  const sailing = fleetById(state, ship.fleet);
  if (
    sailing &&
    (order.type === 'move' || order.type === 'blind-jump' || order.type === 'stop' || order.type === 'hold')
  )
    return `The ${ship.name} sails with the ${sailing.name}: order the fleet, or take it out first.`;
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
  if (order.type === 'excavate') {
    excavate(next, faction, order.system);
    return { ok: true, state: next };
  }
  if (order.type === 'stop-excavation') {
    stopExcavation(next, order.system);
    return { ok: true, state: next };
  }
  if (order.type === 'dig-share') {
    powerOf(next, faction).digShare = order.share;
    return { ok: true, state: next };
  }
  if (order.type === 'chapter-choice') {
    const d = digAt(next, order.system);
    if (d) d.answer = order.choice;
    return { ok: true, state: next };
  }
  if (order.type === 'begin-answer') {
    beginAnswer(next, faction);
    return { ok: true, state: next };
  }
  if (order.type === 'watch') {
    setWatch(next, faction, order.on, order.watch);
    return { ok: true, state: next };
  }
  if (order.type === 'guard') {
    powerOf(next, faction).guard = order.level;
    return { ok: true, state: next };
  }
  if (order.type === 'hire') {
    hire(next, faction, order.leader);
    return { ok: true, state: next };
  }
  if (order.type === 'post') {
    postLeader(next, faction, order.leader, order.post);
    return { ok: true, state: next };
  }
  if (order.type === 'dismiss') {
    dismiss(next, faction, order.leader);
    return { ok: true, state: next };
  }
  if (order.type === 'arks') {
    setArksAnswer(next, faction, order.answer, order.body);
    return { ok: true, state: next };
  }

  if (order.type === 'gift') {
    giveGift(next, faction, order.to, order.credits);
    return { ok: true, state: next };
  }
  if (order.type === 'design') {
    makeDesign(next, powerOf(next, faction), order.hull, order.name, order.modules);
    return { ok: true, state: next };
  }
  if (order.type === 'retire-design') {
    const d = powerOf(next, faction).designs.find((x) => x.id === order.design);
    if (d) d.retired = true;
    return { ok: true, state: next };
  }
  if (order.type === 'form-fleet' || isFleetOrder(order) || order.type === 'fleet-move') {
    applyFleetOrder(next, faction, order);
    return { ok: true, state: next };
  }
  if (order.type === 'fleet-mission') {
    const f = fleetById(next, order.fleet);
    if (f) f.mission = order.mission === null ? null : { kind: order.mission.kind, holding: order.mission.holding };
    return { ok: true, state: next };
  }
  if (order.type === 'offer') {
    makeOffer(next, faction, order.to, order.treaty, order.give, order.get);
    return { ok: true, state: next };
  }
  if (order.type === 'answer-offer') {
    answerOffer(next, faction, order.from, order.treaty, order.accept);
    return { ok: true, state: next };
  }
  if (order.type === 'end-treaty' || order.type === 'break-treaty') {
    endTreaty(next, faction, order.with, order.treaty, order.type === 'break-treaty');
    return { ok: true, state: next };
  }
  if (order.type === 'declare-war') {
    declareWar(next, faction, order.on, order.reason);
    return { ok: true, state: next };
  }
  if (order.type === 'vote') {
    castVote(next, faction, order.choice);
    return { ok: true, state: next };
  }
  if (order.type === 'propose') {
    propose(next, faction, { kind: order.resolution, on: order.on, ...(order.and ? { and: order.and } : {}) });
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
      // Told to found, it leaves its fleet (M4_FLEETS.md §22.2).
      if (ship.fleet !== null) {
        ship.fleet = null;
        pruneFleets(next);
      }
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

/** Puts a fleet order already checked into effect (M4_FLEETS.md §22.1). */
function applyFleetOrder(
  next: GameState,
  faction: FactionId,
  order: FleetOrder | Extract<Order, { type: 'form-fleet' | 'fleet-move' }>,
): void {
  const ships = (ids: readonly number[]) => next.ships.filter((s) => ids.includes(s.id));
  if (order.type === 'form-fleet') {
    formFleet(next, faction, ships(order.ships));
    pruneFleets(next);
    return;
  }
  if (order.type === 'join-fleet') {
    const s = next.ships.find((x) => x.id === order.ship);
    if (s) {
      s.fleet = order.fleet;
      s.destinations = [];
      s.hold = false;
    }
    pruneFleets(next);
    return;
  }
  if (order.type === 'leave-fleet') {
    const s = next.ships.find((x) => x.id === order.ship);
    if (s) splitOff(next, [s]);
    return;
  }
  const f = fleetById(next, order.fleet);
  if (!f) return;
  switch (order.type) {
    case 'merge-fleet':
      for (const s of next.ships) if (s.fleet === f.id) s.fleet = order.into;
      pruneFleets(next);
      break;
    case 'split-fleet':
      splitOff(next, ships(order.ships));
      break;
    case 'fleet-move':
      f.destinations = order.append ? [...f.destinations, order.to] : [order.to];
      f.hold = false;
      // Moving ends its mission (§26.4).
      f.mission = null;
      break;
    case 'fleet-stop':
      f.destinations = [];
      break;
    case 'fleet-hold':
      f.hold = order.hold;
      if (order.hold) f.destinations = [];
      break;
    case 'fleet-orders':
      if (order.stance !== undefined) f.stance = order.stance;
      if (order.target !== undefined) f.target = order.target;
      if (order.retreat !== undefined) f.retreat = order.retreat;
      break;
    case 'rename-fleet':
      f.name = order.name.trim();
      break;
  }
}
