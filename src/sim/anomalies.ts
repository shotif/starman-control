// Anomalies (M1_LANES_RESEARCH.md §3): where they are, found by surveying, investigated by survey
// ships, and what they give. Where they are comes from the game's seed, like the generated worlds,
// so it is never saved. Pure.

import { ANOMALIES, ANOMALY_IDS, type AnomalyId } from '../content/anomalies.ts';
import { type FactionId, STARTING_FACTIONS } from '../content/factions.ts';
import type { TechId } from '../content/techs.ts';
import type { SystemId } from '../data/types.ts';
import { effects, grantResearch, grantTechProgress } from './research.ts';
import { rng } from './rng.ts';
import { type GameState, hasSurveyed, type PowerState, powerOf, type ShipState } from './state.ts';

const CAPITALS = new Set<SystemId>(STARTING_FACTIONS.map((f) => f.capital.systemId));

/** About one system in six holds an anomaly, never a capital; which, the seed decides. */
export function anomalyAt(seed: number, system: SystemId): AnomalyId | null {
  if (CAPITALS.has(system)) return null;
  const r = rng(seed, 'anomaly', system);
  if (!r.chance(1, 6)) return null;
  return ANOMALY_IDS[r.int(0, ANOMALY_IDS.length - 1)] as AnomalyId;
}

/** Turns a power's survey ship spends on an anomaly: its own, less Deep survey's, at least 1. */
export function investigationTurns(state: GameState, faction: FactionId, id: AnomalyId): number {
  const less = effects(state, faction, 'investigation-turns').reduce((sum, e) => sum + e.turns, 0);
  return Math.max(1, ANOMALIES[id].turns - less);
}

/** An anomaly a power has found (surveyed) and not yet investigated, at a system. */
export function openAnomaly(state: GameState, power: PowerState, system: SystemId): AnomalyId | null {
  if (!hasSurveyed(power, system) || power.investigated.includes(system)) return null;
  return anomalyAt(state.seed, system);
}

/** Why a ship cannot investigate where it is, or null if it can. */
export function investigateRefusal(state: GameState, ship: ShipState): string | null {
  if (ship.type !== 'survey') return 'Only survey ships investigate anomalies.';
  if (ship.at === null) return `${ship.name} is on a blind jump.`;
  const at = ship.at;
  const power = powerOf(state, ship.owner);
  if (!hasSurveyed(power, at)) return 'This system has not been surveyed yet.';
  if (anomalyAt(state.seed, at) === null) return 'There is no anomaly here.';
  if (power.investigated.includes(at)) return 'The anomaly here has been investigated.';
  if (ship.investigating) return `${ship.name} is already investigating it.`;
  const other = state.ships.find((s) => s.id !== ship.id && s.owner === ship.owner && s.investigating?.system === at);
  if (other) return `${other.name} is already investigating it.`;
  return null;
}

/** An anomaly's reward as a power has it: more with Lapse studies (M2B_SCIENCE.md §18.2). */
export function rewardTimes(state: GameState, faction: FactionId, amount: number): number {
  const more = effects(state, faction, 'anomaly-percent').reduce((sum, e) => sum + e.percent, 0);
  return amount + Math.floor((amount * more) / 100);
}

/** Gives an anomaly's reward to a power. Returns any technologies it finishes. */
export function grantReward(state: GameState, power: PowerState, id: AnomalyId): TechId[] {
  const r = ANOMALIES[id].reward;
  const more = (n: number) => rewardTimes(state, power.faction, n);
  switch (r.kind) {
    case 'research':
      return grantResearch(state, power, more(r.points));
    case 'tech':
      return grantTechProgress(state, power, r.tech, more(r.points));
    case 'resources':
      power.stockpile.metals += more(r.metals ?? 0);
      power.stockpile.volatiles += more(r.volatiles ?? 0);
      power.stockpile.fuel += more(r.fuel ?? 0);
      return [];
    case 'story':
      return [];
  }
}
