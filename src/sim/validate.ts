// Checks that a game state is possible: the right shape, whole numbers only, and nothing the rules
// forbid. Used when a save is loaded or imported, and by the tests after every turn.

import { isFactionId } from '../content/factions.ts';
import { beaconSlots, type GameState } from './state.ts';
import { laneEnds, type World } from './world.ts';

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isWhole = (v: unknown, min = 0): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min;

/** Problems with the shape of a state (types and whole numbers), before it is trusted as a GameState. */
export function shapeProblems(raw: unknown): string[] {
  const out: string[] = [];
  if (!isRecord(raw)) return ['the game is not a record'];
  if (!isWhole(raw.version, 1)) out.push('version is not a whole number');
  if (!isWhole(raw.seed, 1) || (raw.seed as number) > 0xffffffff)
    out.push('seed is not a whole number from 1 to 2^32 − 1');
  if (!isWhole(raw.turn, 1)) out.push('turn is not a whole number from 1');
  if (!Array.isArray(raw.powers)) out.push('powers is not a list');
  else
    for (const [i, p] of raw.powers.entries()) {
      if (!isRecord(p)) {
        out.push(`power ${i} is not a record`);
        continue;
      }
      if (!isFactionId(p.faction)) out.push(`power ${i} has an unknown faction`);
      if (p.controller !== 'player' && p.controller !== 'ai') out.push(`power ${i} has no controller`);
      if (typeof p.capital !== 'string') out.push(`power ${i} has no capital`);
      if (!Array.isArray(p.laneStations) || !p.laneStations.every((s) => typeof s === 'string'))
        out.push(`power ${i} lane stations are not a list of systems`);
      const st = p.stockpile;
      if (!isRecord(st) || !isWhole(st.metals) || !isWhole(st.volatiles) || !isWhole(st.fuel))
        out.push(`power ${i} stockpile is not three whole numbers`);
    }
  if (!Array.isArray(raw.lanes)) out.push('lanes is not a list');
  else
    for (const [i, l] of raw.lanes.entries()) {
      if (!isRecord(l) || typeof l.id !== 'string' || !isFactionId(l.owner) || l.status !== 'open')
        out.push(`lane ${i} is not an open lane with an owner`);
    }
  return out;
}

/** Problems with a well-shaped state against the world and the rules. Empty when the state is possible. */
export function stateProblems(world: World, state: GameState): string[] {
  const out: string[] = [];
  const factions = new Set<string>();
  for (const p of state.powers) {
    if (factions.has(p.faction)) out.push(`${p.faction} is in play twice`);
    factions.add(p.faction);
    if (!world.hasSystem(p.capital)) out.push(`${p.faction}'s capital ${p.capital} is not a system`);
    for (const s of p.laneStations)
      if (!world.hasSystem(s)) out.push(`${p.faction}'s lane station at ${s} is not a system`);
  }
  const used = new Map<string, number>();
  let previous = '';
  for (const lane of state.lanes) {
    if (lane.id <= previous) out.push(`lane ${lane.id} is out of order or listed twice`);
    previous = lane.id;
    const [a, b] = laneEnds(lane.id);
    if (!world.hasSystem(a) || !world.hasSystem(b)) {
      out.push(`lane ${lane.id} joins a system that does not exist`);
      continue;
    }
    if (!factions.has(lane.owner)) out.push(`lane ${lane.id} belongs to ${lane.owner}, who is not in play`);
    for (const end of [a, b]) used.set(end, (used.get(end) ?? 0) + 1);
  }
  for (const [system, n] of used) {
    const slots = beaconSlots(state, system);
    if (n > slots) out.push(`${system} anchors ${n} lanes but has ${slots} beacon slots`);
  }
  return out;
}
