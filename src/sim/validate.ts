// Checks that a game state is possible: the right shape, whole numbers only, and nothing the rules
// forbid. Used when a save is loaded or imported, and by the tests after every turn.

import { isFactionId } from '../content/factions.ts';
import { PROJECTS } from '../content/projects.ts';
import { SHIPS } from '../content/ships.ts';
import { isTechId, TECHS } from '../content/techs.ts';
import { bodiesOf } from './bodies.ts';
import { beaconSlots, type GameState } from './state.ts';
import { laneEnds, type World } from './world.ts';

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isWhole = (v: unknown, min = 0): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min;
const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every((s) => typeof s === 'string');

/** Problems with the shape of a state (types and whole numbers), before it is trusted as a GameState. */
export function shapeProblems(raw: unknown): string[] {
  const out: string[] = [];
  if (!isRecord(raw)) return ['the game is not a record'];
  if (!isWhole(raw.version, 1)) out.push('version is not a whole number');
  if (!isWhole(raw.seed, 1) || (raw.seed as number) > 0xffffffff)
    out.push('seed is not a whole number from 1 to 2^32 − 1');
  if (!isWhole(raw.turn, 1)) out.push('turn is not a whole number from 1');
  if (!isWhole(raw.nextShipId, 1)) out.push('nextShipId is not a whole number from 1');
  if (!isWhole(raw.nextHoldingId, 1)) out.push('nextHoldingId is not a whole number from 1');
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
      if (!isStrings(p.surveyed)) out.push(`power ${i} surveyed systems are not a list`);
      if (!isWhole(p.shipsBuilt)) out.push(`power ${i} ships built is not a whole number`);
      if (!Array.isArray(p.researched) || !p.researched.every(isTechId))
        out.push(`power ${i} has researched unknown technologies`);
      if (!Array.isArray(p.researchQueue) || !p.researchQueue.every(isTechId))
        out.push(`power ${i} queues unknown technologies`);
      if (!isRecord(p.techProgress) || !Object.entries(p.techProgress).every(([k, v]) => isTechId(k) && isWhole(v, 1)))
        out.push(`power ${i} has progress in unknown technologies`);
      const st = p.stockpile;
      if (!isRecord(st) || !isWhole(st.metals) || !isWhole(st.volatiles) || !isWhole(st.fuel))
        out.push(`power ${i} stockpile is not three whole numbers`);
    }
  if (!Array.isArray(raw.lanes)) out.push('lanes is not a list');
  else
    for (const [i, l] of raw.lanes.entries()) {
      if (!isRecord(l) || typeof l.id !== 'string' || !isFactionId(l.owner)) out.push(`lane ${i} has no owner`);
      else if (l.status !== 'open' && !(l.status === 'building' && isWhole(l.left, 1)))
        out.push(`lane ${i} is neither open nor being tuned`);
    }
  if (!Array.isArray(raw.ships)) out.push('ships is not a list');
  else
    for (const [i, s] of raw.ships.entries()) {
      if (!isRecord(s) || !isWhole(s.id, 1) || !isFactionId(s.owner) || typeof s.name !== 'string') {
        out.push(`ship ${i} is not a ship`);
        continue;
      }
      if (typeof s.type !== 'string' || !(s.type in SHIPS)) out.push(`ship ${i} is of an unknown type`);
      if (s.at !== null && typeof s.at !== 'string') out.push(`ship ${i} is nowhere`);
      if (!isStrings(s.destinations)) out.push(`ship ${i} destinations are not a list`);
      if (typeof s.hold !== 'boolean' || typeof s.autoSurvey !== 'boolean')
        out.push(`ship ${i} flags are not true or false`);
      const f = s.founding;
      if (f !== null && !(isRecord(f) && (f.kind === 'colony' || f.kind === 'outpost') && typeof f.body === 'string'))
        out.push(`ship ${i} is founding nothing it can`);
      const j = s.blindJump;
      if (
        j !== null &&
        !(
          isRecord(j) &&
          typeof j.from === 'string' &&
          typeof j.to === 'string' &&
          isWhole(j.turns, 1) &&
          isWhole(j.left)
        )
      )
        out.push(`ship ${i} blind jump is not a jump`);
    }
  if (!Array.isArray(raw.holdings)) out.push('holdings is not a list');
  else
    for (const [i, h] of raw.holdings.entries()) {
      if (!isRecord(h) || !isWhole(h.id, 1) || !isFactionId(h.owner) || typeof h.system !== 'string') {
        out.push(`holding ${i} is not a holding`);
        continue;
      }
      if (h.kind !== 'colony' && h.kind !== 'outpost') out.push(`holding ${i} is neither a colony nor an outpost`);
      if (typeof h.body !== 'string') out.push(`holding ${i} is on no body`);
      if (typeof h.capital !== 'boolean') out.push(`holding ${i} does not say whether it is a capital`);
      if (!isWhole(h.people) || !isWhole(h.industry)) out.push(`holding ${i} people or industry is not a whole number`);
      if (!Array.isArray(h.projects) || !h.projects.every((p) => typeof p === 'string' && p in PROJECTS))
        out.push(`holding ${i} has unknown projects`);
      if (
        !Array.isArray(h.queue) ||
        !h.queue.every(
          (q) =>
            isRecord(q) &&
            ((q.kind === 'ship' && typeof q.ship === 'string' && q.ship in SHIPS) ||
              (q.kind === 'project' && typeof q.project === 'string' && q.project in PROJECTS) ||
              (q.kind === 'lane' && typeof q.to === 'string')),
        )
      )
        out.push(`holding ${i} has a queue it cannot build`);
    }
  if (!Array.isArray(raw.reports)) out.push('reports is not a list');
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
    let prev = '';
    for (const s of p.surveyed) {
      if (!world.hasSystem(s)) out.push(`${p.faction} surveyed ${s}, which is not a system`);
      if (s <= prev) out.push(`${p.faction}'s surveys are out of order or listed twice`);
      prev = s;
    }
  }
  for (const p of state.powers) {
    const seen = new Set<string>(p.researched);
    if (seen.size !== p.researched.length) out.push(`${p.faction} researched a technology twice`);
    for (const id of p.researchQueue) {
      if (seen.has(id)) out.push(`${p.faction} queues ${id}, which is researched or queued already`);
      for (const n of TECHS[id].needs)
        if (!seen.has(n)) out.push(`${p.faction} queues ${id} before ${n}, which it needs`);
      seen.add(id);
    }
    for (const [id, v] of Object.entries(p.techProgress))
      if (p.researched.includes(id as never) || (v ?? 0) >= TECHS[id as keyof typeof TECHS].cost)
        out.push(`${p.faction} has progress in ${id}, which is done`);
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
  let lastHolding = 0;
  const bodiesHeld = new Set<string>();
  for (const h of state.holdings) {
    if (h.id <= lastHolding) out.push(`holding ${h.id} is out of order or listed twice`);
    if (h.id >= state.nextHoldingId) out.push(`holding ${h.id} is numbered past the next holding`);
    lastHolding = h.id;
    if (!factions.has(h.owner)) out.push(`holding ${h.id} belongs to ${h.owner}, who is not in play`);
    if (!world.hasSystem(h.system)) {
      out.push(`holding ${h.id} is at ${h.system}, which is not a system`);
      continue;
    }
    if (bodiesHeld.has(h.body)) out.push(`${h.body} is held twice`);
    bodiesHeld.add(h.body);
    if (!bodiesOf(world, state.seed, h.system).some((b) => b.id === h.body))
      out.push(`holding ${h.id} is on ${h.body}, which is not in ${h.system}`);
    if (h.kind === 'outpost' && h.people !== 0) out.push(`outpost ${h.id} has people`);
    if (new Set(h.projects).size !== h.projects.length) out.push(`holding ${h.id} has a project twice`);
    for (const q of h.queue) {
      if (q.kind === 'lane' && (!world.hasSystem(q.to) || q.to === h.system))
        out.push(`holding ${h.id} queues a lane to ${q.to}, which it cannot have`);
      if (q.kind !== 'lane' && h.kind === 'outpost') out.push(`outpost ${h.id} queues something other than a lane`);
    }
  }
  let lastShip = 0;
  for (const s of state.ships) {
    if (s.id <= lastShip) out.push(`ship ${s.id} is out of order or listed twice`);
    if (s.id >= state.nextShipId) out.push(`ship ${s.id} is numbered past the next ship`);
    lastShip = s.id;
    if (!factions.has(s.owner)) out.push(`ship ${s.name} belongs to ${s.owner}, who is not in play`);
    if (s.at === null && !s.blindJump) out.push(`ship ${s.name} is nowhere and not on a jump`);
    if (s.at !== null && !world.hasSystem(s.at)) out.push(`ship ${s.name} is at ${s.at}, which is not a system`);
    for (const d of s.destinations)
      if (!world.hasSystem(d)) out.push(`ship ${s.name} is bound for ${d}, which is not a system`);
    if (s.blindJump) {
      const j = s.blindJump;
      if (!world.hasSystem(j.from) || !world.hasSystem(j.to)) out.push(`ship ${s.name} jumps to or from nowhere`);
      if (j.left > j.turns) out.push(`ship ${s.name} has more of its jump left than it takes`);
      if (s.at === null && j.left === j.turns) out.push(`ship ${s.name} has left without its jump beginning`);
    }
  }
  return out;
}
