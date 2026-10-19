// The game state: plain data, whole numbers only, and the only thing a save holds (§11). The world
// (stars, the lane catalogue) is rebuilt from the dataset; the state records what this game changed.
// Nothing here knows which power the player is: `controller` only says who sends the orders.

import { FACTIONS, type FactionId } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import type { SystemId } from '../data/types.ts';
import { homeWebs } from './homeWeb.ts';
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
}

/** A lane that is not dark. Every catalogue lane not listed is dark. */
export interface LaneState {
  id: LaneId;
  owner: FactionId;
  status: 'open';
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
}

export interface NewGameSetup {
  seed: number;
  /** The powers in play, in the order they are listed. */
  powers: { faction: FactionId; controller: 'player' | 'ai' }[];
}

/** A new game: every power in play holds its capital, with a lane station, and its home web (§3, §5). */
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
  return {
    version: STATE_VERSION,
    seed: setup.seed >>> 0 || 1,
    turn: 1,
    powers: setup.powers.map((p) => ({
      faction: p.faction,
      controller: p.controller,
      capital: FACTIONS[p.faction].capital.systemId,
      laneStations: [FACTIONS[p.faction].capital.systemId],
      stockpile: { ...RULES.start.stockpile },
    })),
    lanes,
  };
}

/** Beacon slots at a system for its holder (§3). */
export function beaconSlots(state: GameState, system: SystemId): number {
  const station = state.powers.some((p) => p.laneStations.includes(system));
  return station ? RULES.beacons.slotsWithStation : RULES.beacons.slots;
}
