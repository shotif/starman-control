// The game state: plain data, whole numbers only, and the only thing a save holds (§11). The world
// (stars, the lane catalogue, the bodies made from the seed) is rebuilt; the state records what this
// game changed. Nothing here knows which power the player is: `controller` only says who sends the
// orders, and the rules treat both the same.

import type { District } from '../content/districts.ts';
import type { EdictId, Priority } from '../content/edicts.ts';
import type { EventId } from '../content/events.ts';
import { FACTIONS, type FactionId } from '../content/factions.ts';
import type { ProjectId, QueueItem } from '../content/projects.ts';
import { RULES } from '../content/rules.ts';
import { type ShipType, STARTING_FLEET, shipName } from '../content/ships.ts';
import { TECHS, type TechId } from '../content/techs.ts';
import type { TreatyKind } from '../content/treaties.ts';
import type { SystemId } from '../data/types.ts';
import { homeWebs } from './homeWeb.ts';
import type { ReportEvent } from './report.ts';
import type { LaneId, World } from './world.ts';

/** The version of the game state's shape. Raised, with a migration in save.ts, whenever it changes. */
export const STATE_VERSION = 15;

export interface Stockpile {
  metals: number;
  volatiles: number;
  fuel: number;
}

export interface PowerState {
  faction: FactionId;
  /** Who gives its orders. The rules treat both the same. */
  controller: 'player' | 'ai';
  capital: SystemId;
  stockpile: Stockpile;
  /** Systems it has surveyed, in id order (§1 of M1_TURNS.md); every other system is only charted. */
  surveyed: SystemId[];
  /** Ships it has ever had, for naming the next. */
  shipsBuilt: number;
  /** Technologies researched, in the order they were finished (M1_LANES_RESEARCH.md §2). */
  researched: TechId[];
  /** Technologies to research, first first; each after what it needs. */
  researchQueue: TechId[];
  /** Points put into technologies not yet finished; kept when the queue changes. */
  techProgress: Partial<Record<TechId, number>>;
  /** Technologies whose inspiration it has had, in the order it had them (M2B_SCIENCE.md §17.1). */
  inspired: TechId[];
  /** Systems whose anomaly it has investigated, in id order (M1_LANES_RESEARCH.md §3). */
  investigated: SystemId[];
  /** Food in store for the colonies joined to the capital by its lanes (M2_WORLDS.md §3). */
  food: number;
  /** Credits in the treasury; below zero is debt (M2_WORLDS.md §4). */
  treasury: number;
  /** One tax rate for the whole power. */
  taxes: TaxRate;
  /** What pays for edicts: a little each turn, kept up to a limit (M2_WORLDS.md §25.2). */
  attention: number;
  /** Edicts in force, one of each at most. */
  edicts: ActiveEdict[];
  /** New colonies get a governor (the imperial start, M2_WORLDS.md §25.1). */
  governNew: boolean;
  /** An event waiting for its answer (M2_WORLDS.md §27). */
  event: PendingEvent | null;
  /** The turn its last event came; 0 before any. */
  lastEvent: number;
  /** What its events left behind, each until it runs out. */
  lasting: Lasting[];
  /** The other powers it has heard, in the order heard (M3_NEIGHBOURS.md §19.1). */
  contacts: Contact[];
  /** What it remembers of the others, oldest first (M3_NEIGHBOURS.md §20.1). */
  memories: Memory[];
  /** Gifts it is sending this turn, paid already and delivered as the turn ends (§20.2). */
  gifts: { to: FactionId; credits: number }[];
}

/** What a memory is of (M3_NEIGHBOURS.md §20.1, §21). */
export const MEMORY_KINDS = [
  'gift',
  'great-work-lost',
  'settled-beside',
  'treaty-ended',
  'treaty-broken',
  'treaty-broken-heard',
  'offer-misread',
  'claim-crossed',
] as const;
export type MemoryKind = (typeof MEMORY_KINDS)[number];

/** A memory of another power: its amount now, fading a point towards nothing every few turns. */
export interface Memory {
  faction: FactionId;
  kind: MemoryKind;
  /** What it counts for in the attitude now; never 0 (forgotten then). */
  amount: number;
  /** The turn it began. */
  turn: number;
  /** For a gift, the credits; for the rest, the system where it happened, and the great work lost. */
  credits?: number;
  system?: SystemId;
  project?: ProjectId;
  /** For a treaty ended, broken or misread: which; for a breach heard of, the power it was broken with. */
  treaty?: TreatyKind;
  victim?: FactionId;
}

/**
 * A treaty between two powers (M3_NEIGHBOURS.md §21): `a` before `b` in id order. Notice given, it
 * ends on turn `ends`; broken, it ends as the turn that broke it ends.
 */
export interface Treaty {
  kind: TreatyKind;
  a: FactionId;
  b: FactionId;
  /** The turn it was agreed; it holds from then. */
  since: number;
  ends: number | null;
  /** Who gave notice or broke it, and whether it was broken. */
  endedBy: FactionId | null;
  broken: boolean;
  /** For a treaty sold (passage, protection, §23): the buyer, who pays every turn. */
  payer?: FactionId;
}

/** A resource or credits, and how much, in an exchange (§23.1). */
export interface Amount {
  resource: 'credits' | 'metals' | 'volatiles' | 'fuel';
  amount: number;
}

/**
 * A treaty, or an exchange of resources (§23.1), offered: on its way as the turn it was made ends,
 * then waiting for the player's answer.
 */
export interface Offer {
  kind: TreatyKind | 'exchange';
  from: FactionId;
  to: FactionId;
  turn: number;
  /** An exchange's terms: what the offerer gives, and what it asks for. */
  give?: Amount;
  get?: Amount;
}

/**
 * A power's contact with another (D-52): words while it learns their tongue, then talk. A power not
 * listed is unaware of the other. Contact is never lost.
 */
export interface Contact {
  faction: FactionId;
  stage: 'words' | 'talk';
  /** The turn it first heard them. */
  since: number;
  /** Translation so far, up to `RULES.contact.wordsToTalk`. */
  words: number;
}

/** An event that has come to a power, with its subject, and the answer given (taken as the turn ends). */
export interface PendingEvent {
  id: EventId;
  /** The turn it came. */
  turn: number;
  holding: number | null;
  system: SystemId | null;
  lane: LaneId | null;
  ship: number | null;
  answer: 0 | 1 | null;
}

/** An event's lasting effect: on a colony, or on every colony (`holding` null), for `left` more turns. */
export interface Lasting {
  event: EventId;
  kind: 'no-industry' | 'blight' | 'no-growth' | 'approval';
  holding: number | null;
  /** Approval's change; 0 for the others. */
  amount: number;
  left: number;
}

/** An edict in force: on a colony (or its supply network) or the whole power, for `left` more turns. */
export interface ActiveEdict {
  edict: EdictId;
  holding: number | null;
  left: number;
}

/** How hard a power taxes its people (M2_WORLDS.md §4). */
export type TaxRate = 'low' | 'standard' | 'high';

/**
 * A lane that is not dark: open, or paid for and being tuned for `left` more turns. Every lane of
 * the catalogue not listed is dark; a lane not in the catalogue is one a power built.
 */
export type LaneState =
  | { id: LaneId; owner: FactionId; status: 'open' }
  | { id: LaneId; owner: FactionId; status: 'building'; left: number };

export interface BlindJump {
  from: SystemId;
  to: SystemId;
  /** Turns the whole jump takes. */
  turns: number;
  /** Turns still to go; the jump has begun once this is below `turns`. */
  left: number;
}

export interface ShipState {
  id: number;
  owner: FactionId;
  type: ShipType;
  name: string;
  /** Where it is; null while on a blind jump. */
  at: SystemId | null;
  /** Where it is going along lanes, in order (waypoints). */
  destinations: SystemId[];
  blindJump: BlindJump | null;
  /** Told to stay where it is: not counted as idle. */
  hold: boolean;
  /** Survey ships survey what they enter unless this is off. */
  autoSurvey: boolean;
  /** A colony or outpost it will found when the turn ends, on a body of the system it is at. */
  founding: { kind: 'colony' | 'outpost'; body: string } | null;
  /** The anomaly it is investigating where it is, and the turns left. */
  investigating: { system: SystemId; left: number } | null;
}

/** A colony or an outpost (M1_COLONIES.md §1). */
export interface Holding {
  id: number;
  owner: FactionId;
  kind: 'colony' | 'outpost';
  system: SystemId;
  /** The body it is on. */
  body: string;
  capital: boolean;
  /** People, in tenths of a unit (a unit is about a million); 0 for an outpost. */
  people: number;
  /** Projects built here, in the order they were finished. */
  projects: ProjectId[];
  queue: QueueItem[];
  /** Industry made and not yet spent: it goes into the first item, and is kept up to a limit. */
  industry: number;
  /** Zoned districts, in the order its people work them (M2_WORLDS.md §2); none for an outpost. */
  districts: District[];
  /** Turns in a row it has gone hungry (M2_WORLDS.md §3). */
  hungry: number;
  /** Steps of industry bought with credits each turn, 0 to 3 (overdrive, M2_WORLDS.md §4). */
  overdrive: number;
  /** Its governor's priority, or none (M2_WORLDS.md §25.1). */
  governor: Priority | null;
  /** District slots the player zoned or cleared, which no governor touches. */
  locked: number[];
  /** Turns its terraforming station has worked (M2B_SCIENCE.md §18.3); 0 without one. */
  terraform: number;
}

export interface GameState {
  version: number;
  /** A whole number from 1 to 2^32 − 1. With the orders, it decides everything. */
  seed: number;
  /** 1 is Q1 2176. */
  turn: number;
  powers: PowerState[];
  /** In id order. */
  lanes: LaneState[];
  /** In id order. */
  ships: ShipState[];
  nextShipId: number;
  /** Colonies and outposts, in id order. */
  holdings: Holding[];
  nextHoldingId: number;
  /** What happened to each power in the last turn that ended. */
  reports: { faction: FactionId; turn: number; events: ReportEvent[] }[];
  /** Treaties in force (M3_NEIGHBOURS.md §21), and offers on their way or waiting for an answer. */
  treaties: Treaty[];
  offers: Offer[];
}

export interface NewGameSetup {
  seed: number;
  /** The powers in play, in the order they are listed; `governed` for the imperial start. */
  powers: { faction: FactionId; controller: 'player' | 'ai'; governed?: boolean }[];
}

/** A new ship for a power, at a system, named after its makers' traditions. */
export function makeShip(state: GameState, faction: FactionId, type: ShipType, at: SystemId): ShipState {
  const power = state.powers.find((p) => p.faction === faction);
  if (!power) throw new RangeError(`${faction} is not in play`);
  const ship: ShipState = {
    id: state.nextShipId,
    owner: faction,
    type,
    name: shipName(FACTIONS[faction].shipmakers, power.shipsBuilt),
    at,
    destinations: [],
    blindJump: null,
    hold: false,
    autoSurvey: type === 'survey',
    founding: null,
    investigating: null,
  };
  state.nextShipId++;
  power.shipsBuilt++;
  state.ships.push(ship);
  return ship;
}

/** A new colony or outpost, added to the state. */
export function makeHolding(
  state: GameState,
  h: Omit<
    Holding,
    | 'id'
    | 'projects'
    | 'queue'
    | 'industry'
    | 'districts'
    | 'hungry'
    | 'overdrive'
    | 'governor'
    | 'locked'
    | 'terraform'
  > &
    Partial<Pick<Holding, 'projects' | 'districts' | 'governor'>>,
): Holding {
  const holding: Holding = {
    id: state.nextHoldingId,
    projects: [],
    queue: [],
    industry: 0,
    districts: [],
    hungry: 0,
    overdrive: 0,
    governor: null,
    locked: [],
    terraform: 0,
    ...h,
  };
  state.nextHoldingId++;
  state.holdings.push(holding);
  return holding;
}

/** A power's capital colony, as every game starts it (§5 of the M1 design, M1_COLONIES.md §1). */
export function capitalHolding(faction: FactionId): Omit<Holding, 'id'> {
  return {
    owner: faction,
    kind: 'colony',
    system: FACTIONS[faction].capital.systemId,
    body: FACTIONS[faction].capital.bodyId,
    capital: true,
    people: RULES.capital.people,
    projects: ['shipyard', 'lane-station'],
    queue: [],
    industry: 0,
    districts: RULES.districts.capitalStart.map((zone, i) => ({ zone, slot: i + 1 })),
    hungry: 0,
    overdrive: 0,
    governor: null,
    locked: [],
    terraform: 0,
  };
}

/**
 * A new game (§5): every power in play holds its capital, with a shipyard and a lane station, its
 * home web of lanes, its starting ships and a small stockpile, and has surveyed its capital.
 */
export function newGame(world: World, setup: NewGameSetup): GameState {
  if (setup.powers.length === 0) throw new RangeError('A game needs at least one power');
  // Webs are worked out for every faction, in play or not, so a start never depends on who plays.
  const webs = homeWebs(
    world,
    Object.values(FACTIONS).map((f) => ({ faction: f.id, capital: f.capital.systemId })),
  );
  const lanes: LaneState[] = [];
  for (const p of setup.powers) {
    const web = webs.find((w) => w.faction === p.faction);
    for (const id of web?.lanes ?? []) lanes.push({ id, owner: p.faction, status: 'open' });
  }
  lanes.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const state: GameState = {
    version: STATE_VERSION,
    seed: setup.seed >>> 0 || 1,
    turn: 1,
    powers: setup.powers.map((p) => ({
      faction: p.faction,
      controller: p.controller,
      capital: FACTIONS[p.faction].capital.systemId,
      stockpile: { ...RULES.start.stockpile },
      surveyed: [FACTIONS[p.faction].capital.systemId],
      shipsBuilt: 0,
      researched: [],
      researchQueue: [],
      techProgress: {},
      inspired: [],
      contacts: [],
      memories: [],
      gifts: [],
      investigated: [],
      food: RULES.food.start,
      treasury: RULES.credits.start,
      taxes: 'standard' as const,
      attention: RULES.attention.start,
      edicts: [],
      governNew: p.governed === true,
      event: null,
      lastEvent: 0,
      lasting: [],
    })),
    lanes,
    ships: [],
    nextShipId: 1,
    holdings: [],
    nextHoldingId: 1,
    reports: [],
    treaties: [],
    offers: [],
  };
  for (const p of state.powers)
    makeHolding(state, { ...capitalHolding(p.faction), governor: p.governNew ? 'balance' : null });
  for (const p of state.powers) for (const type of STARTING_FLEET) makeShip(state, p.faction, type, p.capital);
  return state;
}

/**
 * Beacon slots at a system (§3): five where a holding there has a lane station, else three; and two
 * more for each lane relay there (M2B_SCIENCE.md §18.3).
 */
export function beaconSlots(state: GameState, system: SystemId): number {
  const here = state.holdings.filter((h) => h.system === system);
  const station = here.some((h) => h.projects.includes('lane-station'));
  const relays = here.filter((h) => h.projects.includes('lane-relay')).length;
  // Lane network: a slot more for each power with the doctrine and a colony here (§19.1).
  let network = 0;
  for (const p of state.powers) {
    if (!here.some((h) => h.owner === p.faction && h.kind === 'colony')) continue;
    for (const id of p.researched)
      for (const e of [TECHS[id].effect, ...(TECHS[id].also ?? [])]) if (e.kind === 'colony-slots') network += e.slots;
  }
  return (
    (station ? RULES.beacons.slotsWithStation : RULES.beacons.slots) + relays * RULES.projects.relaySlots + network
  );
}

/** The holding on a body, if any power holds it. */
export function holdingOn(state: GameState, body: string): Holding | undefined {
  return state.holdings.find((h) => h.body === body);
}

export function powerOf(state: GameState, faction: FactionId): PowerState {
  const p = state.powers.find((x) => x.faction === faction);
  if (!p) throw new RangeError(`${faction} is not in play`);
  return p;
}

/** A power's contact with another, if it has heard them (M3_NEIGHBOURS.md §19.1). */
export function contactWith(power: PowerState, other: FactionId): Contact | undefined {
  return power.contacts.find((c) => c.faction === other);
}

/** The treaty of a kind between two powers, if they hold one (M3_NEIGHBOURS.md §21). */
export function treatyOf(state: GameState, x: FactionId, y: FactionId, kind: TreatyKind): Treaty | undefined {
  const [a, b] = x < y ? [x, y] : [y, x];
  return state.treaties.find((t) => t.kind === kind && t.a === a && t.b === b);
}

/** Whether a power is in contact with another: it has heard a signal from them, or more (§19.2). */
export function inContact(power: PowerState, other: FactionId): boolean {
  return other !== power.faction && power.contacts.some((c) => c.faction === other);
}

/** The power the player controls, if there is one. */
export function playerPower(state: GameState): PowerState | undefined {
  return state.powers.find((p) => p.controller === 'player');
}

export function hasSurveyed(power: PowerState, system: SystemId): boolean {
  return power.surveyed.includes(system);
}

/** Records a survey, keeping the list in id order. */
export function markSurveyed(power: PowerState, system: SystemId): boolean {
  if (power.surveyed.includes(system)) return false;
  power.surveyed.push(system);
  power.surveyed.sort();
  return true;
}
