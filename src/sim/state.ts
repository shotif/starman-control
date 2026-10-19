// The game state: plain data, whole numbers only, and the only thing a save holds (§11). The world
// (stars, the lane catalogue, the bodies made from the seed) is rebuilt; the state records what this
// game changed. Nothing here knows which power the player is: `controller` only says who sends the
// orders, and the rules treat both the same.

import { FACTIONS, type FactionId } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import { type ShipType, STARTING_FLEET, shipName } from '../content/ships.ts';
import type { SystemId } from '../data/types.ts';
import { homeWebs } from './homeWeb.ts';
import type { ReportEvent } from './report.ts';
import type { LaneId, World } from './world.ts';

/** The version of the game state's shape. Raised, with a migration in save.ts, whenever it changes. */
export const STATE_VERSION = 1;

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
  /** Systems where it has built a lane station (five beacon slots instead of three). */
  laneStations: SystemId[];
  stockpile: Stockpile;
  /** Systems it has surveyed, in id order (§1 of M1_TURNS.md); every other system is only charted. */
  surveyed: SystemId[];
  /** Ships it has ever had, for naming the next. */
  shipsBuilt: number;
}

/** A lane that is not dark. Every catalogue lane not listed is dark. */
export interface LaneState {
  id: LaneId;
  owner: FactionId;
  status: 'open';
}

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
  };
  state.nextShipId++;
  power.shipsBuilt++;
  state.ships.push(ship);
  return ship;
}

/**
 * A new game (§5): every power in play holds its capital, with a lane station, its home web of
 * lanes, its starting ships and a small stockpile, and has surveyed its capital.
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
      laneStations: [FACTIONS[p.faction].capital.systemId],
      stockpile: { ...RULES.start.stockpile },
      surveyed: [FACTIONS[p.faction].capital.systemId],
      shipsBuilt: 0,
    })),
    lanes,
    ships: [],
    nextShipId: 1,
    reports: [],
  };
  for (const p of state.powers) for (const type of STARTING_FLEET) makeShip(state, p.faction, type, p.capital);
  return state;
}

/** Beacon slots at a system for its holder (§3). */
export function beaconSlots(state: GameState, system: SystemId): number {
  const station = state.powers.some((p) => p.laneStations.includes(system));
  return station ? RULES.beacons.slotsWithStation : RULES.beacons.slots;
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
