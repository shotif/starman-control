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
import { attitudeOf } from './memory.ts';
import { contactWith, type Fleet, type GameState, type Holding, powerOf } from './state.ts';
import { declareRefusal, enemiesOf, isArmed } from './war.ts';
import type { World } from './world.ts';

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

/** Whether another power holds a colony near one of a power's own (§28.1). */
function neighbours(world: World, state: GameState, f: FactionId, other: FactionId): boolean {
  const mine = state.holdings.filter((h) => h.owner === f && h.kind === 'colony');
  return state.holdings.some(
    (h) =>
      h.owner === other &&
      h.kind === 'colony' &&
      mine.some((m) => world.distanceDeci(m.system, h.system) <= RULES.rivalsWar.nearDeci),
  );
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
      return (
        state.turn >= w.choiceFrom &&
        neighbours(world, state, f, other) &&
        attitudeOf(world, state, f, other).total <= w.notWarm &&
        stronger()
      );
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
  const reasons = FACTIONS[f].war.declares;
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
 * What a rival at war would invade with a fleet (§28.3): the nearest enemy colony or outpost by the
 * lanes the fleet may use, within a few jumps, where the fleet's attack is at least twice what
 * defends it; and the troops it needs: the garrison and two more.
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
  for (let d = 1; d <= RULES.rivalsWar.invadeJumps && ring.length > 0; d++) {
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
    if (!best || j < best.jumps || (j === best.jumps && h.id < best.holding.id))
      best = { holding: h, troops, jumps: j };
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
