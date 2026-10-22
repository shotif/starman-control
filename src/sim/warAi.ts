// The rivals at war (docs/design/M4_FLEETS.md §28, D-68): when each goes to war and why, by its
// character; how strong a power's warships are as the Watch sees them; what a rival at war would
// invade; and when it is beaten. Pure: the rivals' orders are given in ai.ts.

import { FACTIONS, type FactionId, type WarReason } from '../content/factions.ts';
import { MODULES } from '../content/modules.ts';
import { RULES } from '../content/rules.ts';
import type { SystemId } from '../data/types.ts';
import { designStats, shipDesign } from './designs.ts';
import { fleetAt, fleetLanes, fleetShips } from './fleets.ts';
import { bestWeapon, garrisonOf, hasBattery, troopsOf } from './invasion.ts';
import { keysHeld } from './keys.ts';
import { laneTargets } from './lanes.ts';
import { attitudeOf } from './memory.ts';
import { lanesFor } from './movement.ts';
import { scoreOf } from './score.ts';
import { contactWith, type Fleet, type GameState, type Holding, powerOf } from './state.ts';
import { declareRefusal, enemiesOf, isArmed } from './war.ts';
import { laneEnds, type World } from './world.ts';

/** A power's warships' attack in all (§28.1), as the Watch sees it. */
export function strengthOf(state: GameState, f: FactionId): number {
  let attack = 0;
  for (const s of state.ships) {
    if (s.owner !== f) continue;
    const d = shipDesign(state, s);
    if (d) attack += designStats(d).attack;
  }
  return attack;
}

/** A power's armed ships. */
export function warshipsOf(state: GameState, f: FactionId): number {
  return state.ships.filter((s) => s.owner === f && isArmed(state, s)).length;
}

/** Whether a rival made peace with another lately (§28.1): it does not go back to war so soon. */
function lately(state: GameState, f: FactionId, other: FactionId): boolean {
  const [a, b] = f < other ? [f, other] : [other, f];
  return state.truces.some((t) => t.a === a && t.b === b && t.until + RULES.rivalsWar.rest > state.turn);
}

/** Whether a reason for war holds against another power now (§28.1). */
function reasonHolds(
  world: World,
  state: GameState,
  f: FactionId,
  other: FactionId,
  reason: WarReason,
  /** Whether it must be the stronger now; without, a grievance it may arm for (§28.2). */
  strength = true,
  /** Whether its fleets must reach the other now; without, a power it may build lanes toward (§31.1). */
  reach = true,
): boolean {
  const w = RULES.rivalsWar;
  const power = powerOf(state, f);
  const stronger = () => {
    if (!strength) return true;
    const mine = strengthOf(state, f);
    return mine > 0 && mine * 2 >= strengthOf(state, other) * 3;
  };
  switch (reason) {
    case 'raided':
      return power.memories.some(
        (m) => m.faction === other && m.kind === 'raided' && state.turn - m.turn <= w.raidedWithin,
      );
    case 'hostile':
      return attitudeOf(world, state, f, other).total <= w.hostile && stronger();
    case 'weak':
      // The conquerors' reason (§31.2): any power they know and their fleets could reach.
      return (
        state.turn >= w.choiceFrom &&
        attitudeOf(world, state, f, other).total <= w.notWarm &&
        stronger() &&
        (!reach || reachable(world, state, f, other))
      );
    case 'leader': {
      // The balance of power (§31.2, as built): the power that leads all in score, well ahead of it,
      // that it does not like well, and whose warships it can match.
      if (state.turn < w.choiceFrom || attitudeOf(world, state, f, other).total >= RULES.assembly.warm) return false;
      const theirs = scoreOf(state, other).total;
      if (theirs * 100 < scoreOf(state, f).total * w.leaderPercent) return false;
      if (state.powers.some((p) => p.left === null && p.faction !== other && scoreOf(state, p.faction).total > theirs))
        return false;
      const able = !strength || (strengthOf(state, f) > 0 && strengthOf(state, f) >= strengthOf(state, other));
      return able && (!reach || reachable(world, state, f, other));
    }
    // The outlaw takes what it wants (M5_UNKNOWN.md §21.4): a power holding a key it can reach and match.
    case 'keys':
      return (
        state.turn >= w.choiceFrom &&
        keysHeld(state, other).length > 0 &&
        stronger() &&
        (!reach || reachable(world, state, f, other))
      );
    // Against the Answer (§21.3), whatever the strength or the reach: war is declared by `warTarget`.
    case 'answer':
      return state.answer?.by === other;
    case 'claim':
      return (
        power.memories.filter((m) => m.faction === other && m.kind === 'claim-crossed').length >= w.claims && stronger()
      );
  }
}

/**
 * The war a rival would declare now, and why (§28.1): every few turns, by its character, at most one
 * war at a time, with warships enough, never on a power it has a truce, a pact or an alliance with.
 */
export function warTarget(world: World, state: GameState, f: FactionId): { on: FactionId; reason: WarReason } | null {
  const w = RULES.rivalsWar;
  // The Answer (M5_UNKNOWN.md §21.3): every rival that does not call for peace goes to war on it at once.
  const answering = answerTarget(state, f);
  if (answering && declareRefusal(state, f, answering) === null) return { on: answering, reason: 'answer' };
  const reasons: readonly WarReason[] =
    // A power holding three keys goes for the rest (M5_UNKNOWN.md §21.4, as built).
    keysHeld(state, f).length >= RULES.keys.hunt && !FACTIONS[f].war.declares.includes('keys')
      ? [...FACTIONS[f].war.declares, 'keys']
      : FACTIONS[f].war.declares;
  if (reasons.length === 0 || state.turn % w.every !== 0) return null;
  const power = powerOf(state, f);
  if (power.subduedBy || enemiesOf(state, f).length > 0 || warshipsOf(state, f) < w.warships) return null;
  for (const reason of reasons)
    for (const p of state.powers) {
      const other = p.faction;
      if (other === f || !contactWith(power, other) || declareRefusal(state, f, other) !== null) continue;
      if (lately(state, f, other)) continue;
      if (reasonHolds(world, state, f, other, reason)) return { on: other, reason };
    }
  return null;
}

/**
 * The power answering (M5_UNKNOWN.md §21.3) a rival would go to war on: one it knows and is not yet at
 * war with, unless it calls for peace or is subdued; or null.
 */
export function answerTarget(state: GameState, f: FactionId): FactionId | null {
  const a = state.answer;
  const power = powerOf(state, f);
  if (!a || a.by === f || FACTIONS[f].war.callsForPeace || power.subduedBy || !contactWith(power, a.by)) return null;
  return state.wars.some((x) => (x.a === f && x.b === a.by) || (x.b === f && x.a === a.by)) ? null : a.by;
}

/**
 * The warships a rival keeps in peace (§28.2): half the most any power in contact with it holds, up
 * to its colonies; and with a grievance it could go to war for, enough to be the stronger by half
 * again, and never fewer than it needs to declare.
 */
export function warshipsWanted(world: World, state: GameState, f: FactionId): number {
  const power = powerOf(state, f);
  let most = 0;
  for (const p of state.powers)
    if (p.faction !== f && contactWith(power, p.faction)) most = Math.max(most, warshipsOf(state, p.faction));
  const colonies = state.holdings.filter((h) => h.owner === f && h.kind === 'colony').length;
  let wanted = Math.min(colonies, Math.floor(most / 2));
  const enemy = grievance(world, state, f);
  if (enemy) wanted = Math.max(wanted, RULES.rivalsWar.warships, Math.ceil((warshipsOf(state, enemy) * 3) / 2) + 1);
  // A conqueror arms in earnest (§31.2): a warship for every colony, from the turn wars of choice begin.
  if (FACTIONS[f].war.conqueror && state.turn >= RULES.rivalsWar.choiceFrom) wanted = Math.max(wanted, colonies);
  return wanted;
}

/** A power a rival has a reason to go to war with, by its character, strong enough or not (§28.2). */
export function grievance(world: World, state: GameState, f: FactionId): FactionId | null {
  const reasons = FACTIONS[f].war.declares;
  if (reasons.length === 0) return null;
  const power = powerOf(state, f);
  if (power.subduedBy || enemiesOf(state, f).length > 0) return null;
  for (const reason of reasons)
    for (const p of state.powers) {
      const other = p.faction;
      if (other === f || !contactWith(power, other) || declareRefusal(state, f, other) !== null) continue;
      if (lately(state, f, other)) continue;
      if (reasonHolds(world, state, f, other, reason, false)) return other;
    }
  return null;
}

/** What defends a holding in battle (§28.3): its power's armed ships there, and its battery. */
function defenceAt(state: GameState, h: Holding): number {
  let attack = strengthAtSystem(state, h.owner, h.system);
  if (hasBattery(h)) {
    const w = MODULES[bestWeapon(powerOf(state, h.owner))].weapon;
    attack += (w?.damage ?? 0) * RULES.defence.batteryWeapons;
  }
  return attack;
}

/** A power's warships' attack at a system. */
function strengthAtSystem(state: GameState, f: FactionId, system: SystemId): number {
  let attack = 0;
  for (const s of state.ships) {
    if (s.owner !== f || s.at !== system) continue;
    const d = shipDesign(state, s);
    if (d) attack += designStats(d).attack;
  }
  return attack;
}

/** A fleet's attack. */
function fleetAttack(state: GameState, fleet: Fleet): number {
  let attack = 0;
  for (const s of fleetShips(state, fleet)) {
    const d = shipDesign(state, s);
    if (d) attack += designStats(d).attack;
  }
  return attack;
}

/**
 * What a rival at war would invade with a fleet (§28.3, §31.1): an enemy holding anywhere the lanes
 * it may sail reach, where the fleet's attack is at least twice what defends it; the enemy's capital
 * first, as its loss beats a power, else the nearest; and the troops it needs: the garrison and two
 * more.
 */
export function invasionTarget(
  world: World,
  state: GameState,
  fleet: Fleet,
): { holding: Holding; troops: number; jumps: number } | null {
  const at = fleetAt(state, fleet);
  if (at === null) return null;
  const enemies = enemiesOf(state, fleet.owner);
  if (enemies.length === 0) return null;
  const graph = fleetLanes(world, state, fleet);
  const jumps = new Map<SystemId, number>([[at, 0]]);
  let ring: SystemId[] = [at];
  for (let d = 1; ring.length > 0; d++) {
    const next: SystemId[] = [];
    for (const from of ring)
      for (const hop of graph.get(from) ?? [])
        if (!jumps.has(hop.to)) {
          jumps.set(hop.to, d);
          next.push(hop.to);
        }
    ring = next;
  }
  const attack = fleetAttack(state, fleet);
  let best: { holding: Holding; troops: number; jumps: number } | null = null;
  for (const h of state.holdings) {
    const j = jumps.get(h.system);
    if (j === undefined || !enemies.includes(h.owner)) continue;
    if (attack < defenceAt(state, h) * 2) continue;
    const troops = garrisonOf(h).total + RULES.rivalsWar.spareTroops;
    // A key's holding first (M5_UNKNOWN.md §21.4), then the capital, then the nearest.
    const rank = (x: Holding) => (state.keys.some((k) => k.holding === x.id) ? 2 : x.capital ? 1 : 0);
    const better =
      !best ||
      rank(h) > rank(best.holding) ||
      (rank(h) === rank(best.holding) && (j < best.jumps || (j === best.jumps && h.id < best.holding.id)));
    if (better) best = { holding: h, troops, jumps: j };
  }
  return best;
}

/** Whether a fleet carries troops enough for a target. */
export function readyFor(state: GameState, fleet: Fleet, troops: number): boolean {
  return troopsOf(state, fleet) >= troops;
}

/** Whether a rival is beaten (§28.5): its first capital lost, or half the colonies it ever held. */
export function beaten(state: GameState, f: FactionId): boolean {
  const power = powerOf(state, f);
  const home = FACTIONS[f].capital.bodyId;
  const first = state.holdings.find((h) => h.body === home);
  if (first && first.owner !== f) return true;
  const colonies = state.holdings.filter((h) => h.owner === f && h.kind === 'colony').length;
  return colonies * 2 <= power.mostColonies;
}

/** Keeps each power's most colonies up to date, as the turn ends. */
export function countColonies(state: GameState): void {
  for (const p of state.powers) {
    const n = state.holdings.filter((h) => h.owner === p.faction && h.kind === 'colony').length;
    if (n > p.mostColonies) p.mostColonies = n;
  }
}

/**
 * Whether a conqueror sees its war with an enemy through (§31.2): while not beaten, with warships whose
 * attack is at least the enemy's, and its war weariness under the limit, it neither offers nor accepts
 * peace, and ignores the Assembly's calls for it.
 */
export function pressesOn(state: GameState, f: FactionId, enemy: FactionId): boolean {
  if (!FACTIONS[f].war.conqueror || beaten(state, f)) return false;
  const mine = strengthOf(state, f);
  return mine > 0 && mine >= strengthOf(state, enemy) && powerOf(state, f).weariness < RULES.rivalsWar.pressOnWeariness;
}

/**
 * Whether a power's fleets could reach another's holdings (§31.2): from its capital by its own lanes,
 * those it may sail, and the other's, which it may sail at war.
 */
export function reachable(world: World, state: GameState, f: FactionId, other: FactionId): boolean {
  const theirs = new Set(state.holdings.filter((h) => h.owner === other).map((h) => h.system));
  if (theirs.size === 0) return false;
  const graph = lanesFor(world, state, f, true, [other]);
  const start = powerOf(state, f).capital;
  const seen = new Set<SystemId>([start]);
  let ring: SystemId[] = [start];
  while (ring.length > 0) {
    const next: SystemId[] = [];
    for (const at of ring) {
      if (theirs.has(at)) return true;
      for (const hop of graph.get(at) ?? [])
        if (!seen.has(hop.to)) {
          seen.add(hop.to);
          next.push(hop.to);
        }
    }
    ring = next;
  }
  return false;
}

/**
 * A conqueror's lane toward a weak power it cannot yet reach (§31.1, as built): the power it would
 * fall on but for the distance, and, from the holding of its own nearest that power, the lane it may
 * queue that brings it nearest, if that is nearer than it is; or null.
 */
export function bridgeLane(world: World, state: GameState, f: FactionId): { holding: Holding; to: SystemId } | null {
  const w = RULES.rivalsWar;
  const reasons = FACTIONS[f].war.declares.filter((r) => r === 'weak' || r === 'leader');
  if (reasons.length === 0 || state.turn < w.choiceFrom) return null;
  const power = powerOf(state, f);
  if (power.subduedBy || enemiesOf(state, f).length > 0) return null;
  const mine = state.holdings.filter((h) => h.owner === f);
  let best: { holding: Holding; to: SystemId; d: number } | null = null;
  for (const p of state.powers) {
    const other = p.faction;
    if (other === f || p.left !== null || !contactWith(power, other)) continue;
    // A pact the outlaw would break is no obstacle (§31.2).
    const refusal = declareRefusal(state, f, other);
    if (refusal !== null && !(refusal.includes('non-aggression') && !FACTIONS[f].lawful)) continue;
    if (lately(state, f, other)) continue;
    if (!reasons.some((r) => reasonHolds(world, state, f, other, r, true, false))) continue;
    if (reachable(world, state, f, other)) continue;
    // Its holdings, and every star its open lanes touch: a lane to any of them opens the way at war.
    const theirs = new Set(state.holdings.filter((h) => h.owner === other).map((h) => h.system));
    for (const l of state.lanes)
      if (l.owner === other && l.status === 'open') for (const e of laneEnds(l.id)) theirs.add(e);
    const nearest = (s: SystemId) => Math.min(...[...theirs].map((t) => world.distanceDeci(s, t)));
    // From the nearest of its holdings that can bring it nearer: one lane at a time from each.
    for (const from of [...mine].sort((a, b) => nearest(a.system) - nearest(b.system) || a.id - b.id)) {
      if (from.queue.some((q) => q.kind === 'lane')) break;
      const here = nearest(from.system);
      let found: { holding: Holding; to: SystemId; d: number } | null = null;
      for (const t of laneTargets(world, state, f, from.system)) {
        if (t.refusal !== null) continue;
        const d = nearest(t.quote.to);
        if (d < here && (!found || d < found.d)) found = { holding: from, to: t.quote.to, d };
      }
      if (found) {
        if (!best || found.d < best.d) best = found;
        break;
      }
    }
  }
  return best ? { holding: best.holding, to: best.to } : null;
}

/**
 * The pact an outlaw conqueror breaks to fall on easy prey (§31.2, as built): a non-aggression pact
 * with a power it would otherwise go to war on, on the turns it looks for a war; or null. A lawful
 * conqueror keeps its word.
 */
export function pactToBreak(world: World, state: GameState, f: FactionId): FactionId | null {
  const w = RULES.rivalsWar;
  const def = FACTIONS[f].war;
  if (!def.conqueror || FACTIONS[f].lawful || state.turn % w.every !== 0) return null;
  const power = powerOf(state, f);
  if (power.subduedBy || enemiesOf(state, f).length > 0 || warshipsOf(state, f) < w.warships) return null;
  for (const p of state.powers) {
    const other = p.faction;
    if (other === f || p.left !== null || !contactWith(power, other)) continue;
    const [a, b] = f < other ? [f, other] : [other, f];
    const pact = state.treaties.some((t) => t.a === a && t.b === b && t.kind === 'non-aggression');
    const bound = state.treaties.some((t) => t.a === a && t.b === b && t.kind === 'alliance');
    if (!pact || bound || lately(state, f, other) || state.truces.some((t) => t.a === a && t.b === b)) continue;
    if (reasonHolds(world, state, f, other, 'weak') || reasonHolds(world, state, f, other, 'leader')) return other;
  }
  return null;
}
