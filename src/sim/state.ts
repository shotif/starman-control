// The game state: plain data, whole numbers only, and the only thing a save holds (§11). The world
// (stars, the lane catalogue, the bodies made from the seed) is rebuilt; the state records what this
// game changed. Nothing here knows which power the player is: `controller` only says who sends the
// orders, and the rules treat both the same.

import { FACTIONS, type FactionId } from '../content/factions.ts';
import type { ProjectId, QueueItem } from '../content/projects.ts';
import { RULES } from '../content/rules.ts';
import { type ShipType, STARTING_FLEET, shipName } from '../content/ships.ts';
import type { TechId } from '../content/techs.ts';
import type { SystemId } from '../data/types.ts';
import { homeWebs } from './homeWeb.ts';
import type { ReportEvent } from './report.ts';
import type { LaneId, World } from './world.ts';

/** The version of the game state's shape. Raised, with a migration in save.ts, whenever it changes. */
export const STATE_VERSION = 5;

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
}

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
}

export interface NewGameSetup {
  seed: number;
  /** The powers in play, in the order they are listed. */
  powers: { faction: FactionId; controller: 'player' | 'ai' }[];
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
  };
  state.nextShipId++;
  power.shipsBuilt++;
  state.ships.push(ship);
  return ship;
}

/** A new colony or outpost, added to the state. */
export function makeHolding(
  state: GameState,
  h: Omit<Holding, 'id' | 'projects' | 'queue' | 'industry'> & Partial<Pick<Holding, 'projects'>>,
): Holding {
  const holding: Holding = { id: state.nextHoldingId, projects: [], queue: [], industry: 0, ...h };
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
    })),
    lanes,
    ships: [],
    nextShipId: 1,
    holdings: [],
    nextHoldingId: 1,
    reports: [],
  };
  for (const p of state.powers) makeHolding(state, capitalHolding(p.faction));
  for (const p of state.powers) for (const type of STARTING_FLEET) makeShip(state, p.faction, type, p.capital);
  return state;
}

/** Beacon slots at a system (§3): five where a holding there has a lane station, else three. */
export function beaconSlots(state: GameState, system: SystemId): number {
  const station = state.holdings.some((h) => h.system === system && h.projects.includes('lane-station'));
  return station ? RULES.beacons.slotsWithStation : RULES.beacons.slots;
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
