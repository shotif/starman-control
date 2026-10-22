// Defences, invasion, bombardment and blockade (docs/design/M4_FLEETS.md §26, D-65): a colony's
// garrison, who holds a system's orbit, troops landed from transports, bombardment from orbit, and
// the blockade of a colony whose orbit an enemy holds.

import { FACTIONS, type FactionId } from '../content/factions.ts';
import { MODULES, type ModuleId } from '../content/modules.ts';
import { PROJECTS } from '../content/projects.ts';
import { RULES } from '../content/rules.ts';
import { SHIPS } from '../content/ships.ts';
import { TREATIES } from '../content/treaties.ts';
import type { SystemId } from '../data/types.ts';
import { knownModules } from './designs.ts';
import { fleetAt, fleetShips } from './fleets.ts';
import { remember } from './memory.ts';
import type { ReportEvent } from './report.ts';
import { rng } from './rng.ts';
import {
  contactWith,
  type Fleet,
  type GameState,
  type Holding,
  type Mission,
  type PowerState,
  powerOf,
  treatyOf,
} from './state.ts';
import { atWar, isArmed, truceUntil, wearyFrom } from './war.ts';

export interface Part {
  label: string;
  value: number;
}

/** A colony's garrison (§26.2): 2, one a million people, 5 more at the capital, 10 with barracks; an outpost none. */
export function garrisonOf(h: Holding): { total: number; parts: Part[] } {
  if (h.kind !== 'colony') return { total: 0, parts: [] };
  const r = RULES.invasion;
  const parts: Part[] = [{ label: 'a guard of its own', value: r.garrisonBase }];
  const millions = Math.floor(h.people / 10);
  if (millions > 0) parts.push({ label: `its ${millions} million people`, value: millions });
  if (h.capital) parts.push({ label: 'the capital', value: r.garrisonCapital });
  if (h.projects.includes('barracks')) parts.push({ label: 'barracks', value: r.garrisonBarracks });
  return { total: parts.reduce((n, p) => n + p.value, 0), parts };
}

/** Whether a holding has a defence battery (§26.1). */
export function hasBattery(h: Holding): boolean {
  return h.kind === 'colony' && h.projects.includes('defence-battery');
}

/** The weapon a power's batteries fire (§26.7): the strongest weapon module it can build. */
export function bestWeapon(power: PowerState): ModuleId {
  let best: ModuleId = 'pulse-1';
  let damage = 0;
  for (const m of knownModules(power)) {
    const w = MODULES[m].weapon;
    if (w && w.damage > damage) {
      best = m;
      damage = w.damage;
    }
  }
  return best;
}

/** Whether a holding's battery was silenced in a battle this turn (§26.7): it fires again next turn. */
export function silenced(state: GameState, h: Holding): boolean {
  return state.battles.some(
    (b) => b.turn === state.turn && b.system === h.system && b.rounds.some((r) => r.destroyed.includes(-h.id)),
  );
}

/** Whether a power holds a system's orbit (§26.4): an armed ship of its own there, or a battery not silenced. */
export function holdsOrbit(state: GameState, owner: FactionId, system: SystemId): boolean {
  if (state.ships.some((s) => s.owner === owner && s.at === system && isArmed(state, s))) return true;
  return state.holdings.some((h) => h.owner === owner && h.system === system && hasBattery(h) && !silenced(state, h));
}

/** The power at war with a colony's whose armed ships blockade it (§26.6), or null. */
export function blockadedBy(state: GameState, h: Holding): FactionId | null {
  if (h.kind !== 'colony' || state.wars.length === 0) return null;
  if (holdsOrbit(state, h.owner, h.system)) return null;
  const s = state.ships.find(
    (x) => x.at === h.system && x.owner !== h.owner && atWar(state, h.owner, x.owner) && isArmed(state, x),
  );
  return s?.owner ?? null;
}

/** The troops a fleet carries: 5 for each transport (§26.3). */
export function troopsOf(state: GameState, fleet: Fleet): number {
  return fleetShips(state, fleet).reduce((n, s) => n + (SHIPS[s.type].troops ?? 0), 0);
}

/** Why a fleet cannot take on a mission (§26.4, §26.5), or null if it can. */
export function missionRefusal(state: GameState, fleet: Fleet, mission: Mission): string | null {
  const h = state.holdings.find((x) => x.id === mission.holding);
  if (!h) return 'There is no such colony.';
  const at = fleetAt(state, fleet);
  if (at !== h.system || fleet.destinations.length > 0) return `The ${fleet.name} must be in its system, not moving.`;
  if (h.owner === fleet.owner) return 'It is our own.';
  if (mission.kind === 'raid') {
    const why = raidRefusal(state, fleet.owner, h);
    if (why) return why;
    if (!fleetShips(state, fleet).some((s) => isArmed(state, s))) return `The ${fleet.name} has no armed ship.`;
    return null;
  }
  if (!atWar(state, fleet.owner, h.owner)) return `We are not at war with the ${FACTIONS[h.owner].shortName}.`;
  if (mission.kind === 'invade') {
    if (troopsOf(state, fleet) === 0) return `The ${fleet.name} carries no troops: add troop transports to it.`;
    return null;
  }
  if (h.kind !== 'colony') return 'Only a colony can be bombarded.';
  if (!fleetShips(state, fleet).some((s) => isArmed(state, s))) return `The ${fleet.name} has no armed ship.`;
  return null;
}

/**
 * Why a power may not raid a holding (M4_FLEETS.md §27.1), wherever its fleets are, or null: only a
 * power that is not lawful raids, a power it has met, not at war with it, not one that buys its
 * protection, nor one it has a pact, an alliance or a truce with.
 */
export function raidRefusal(state: GameState, raider: FactionId, h: Holding): string | null {
  if (h.owner === raider) return 'It is our own.';
  return mayRaid(state, raider, h.owner);
}

/** Why a power may not raid another at all (§27.1), or null. */
export function mayRaid(state: GameState, raider: FactionId, victim: FactionId): string | null {
  const them = FACTIONS[victim].shortName;
  if (victim === raider) return 'It is our own.';
  if (FACTIONS[raider].lawful) return `The ${FACTIONS[raider].shortName} keeps the law: it does not raid.`;
  if (!contactWith(powerOf(state, raider), victim)) return `We have not met the ${them}.`;
  if (atWar(state, raider, victim)) return `We are at war with the ${them}: invade or bombard instead.`;
  const protection = treatyOf(state, raider, victim, 'protection');
  if (protection && protection.payer === victim) return `The ${them} pays us for protection.`;
  for (const kind of ['non-aggression', 'alliance'] as const)
    if (treatyOf(state, raider, victim, kind))
      return `We have ${TREATIES[kind].words} with the ${them}: break it first.`;
  const truce = truceUntil(state, raider, victim);
  if (truce !== null) return `We made peace with the ${them}: the truce still holds.`;
  return null;
}

/**
 * The powers whose lanes an outlaw's armed fleet may use to reach a raid (§27.1): every power it may
 * raid. None for a lawful power, or a fleet with no armed ship.
 */
export function raidLanes(state: GameState, fleet: Fleet): FactionId[] {
  if (FACTIONS[fleet.owner].lawful) return [];
  if (!fleetShips(state, fleet).some((s) => isArmed(state, s))) return [];
  return state.powers.map((p) => p.faction).filter((f) => mayRaid(state, fleet.owner, f) === null);
}

/**
 * A colony or outpost changes hands (§26.4), with its people and buildings: its queue, stored
 * industry, governor and locks cleared, its people unhappy for a while. A capital taken moves its
 * power's capital to its largest colony left.
 */
export function takeHolding(state: GameState, h: Holding, by: FactionId, events: Map<FactionId, ReportEvent[]>): void {
  const from = h.owner;
  const was = h.capital;
  h.owner = by;
  h.capital = false;
  h.queue = [];
  h.industry = 0;
  h.governor = null;
  h.locked = [];
  h.overdrive = 0;
  h.taken = h.kind === 'colony' ? RULES.invasion.takenTurns : 0;
  const old = powerOf(state, from);
  old.edicts = old.edicts.filter((e) => e.holding !== h.id);
  old.lasting = old.lasting.filter((l) => l.holding !== h.id);
  for (const f of state.fleets) if (f.mission?.holding === h.id && f.owner === by) f.mission = null;
  if (!was) return;
  const next = state.holdings
    .filter((x) => x.owner === from && x.kind === 'colony')
    .sort((a, b) => b.people - a.people || a.id - b.id)[0];
  if (!next) return;
  next.capital = true;
  old.capital = next.system;
  events.get(from)?.push({ kind: 'capital-moved', faction: from, holding: next.id, system: next.system });
}

/**
 * Landings as the turn ends (§26.4), after the battles: each fleet ordered to invade lands its
 * troops once the target's power no longer holds the orbit, and troops and garrison fight it out.
 */
export function resolveLandings(state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  const r = RULES.invasion;
  for (const fleet of [...state.fleets]) {
    const m = fleet.mission;
    if (!m || m.kind !== 'invade') continue;
    if (missionRefusal(state, fleet, m) !== null) {
      fleet.mission = null;
      continue;
    }
    const h = state.holdings.find((x) => x.id === m.holding) as Holding;
    if (holdsOrbit(state, h.owner, h.system)) continue;
    const transports = fleetShips(state, fleet).filter((s) => (SHIPS[s.type].troops ?? 0) > 0);
    const troops = transports.reduce((n, s) => n + (SHIPS[s.type].troops ?? 0), 0);
    // The transports are spent: their troops have landed.
    const spent = new Set(transports.map((s) => s.id));
    state.ships = state.ships.filter((s) => !spent.has(s.id));
    fleet.mission = null;
    const garrison = garrisonOf(h).total;
    const roll = rng(state.seed, 'invasion', state.turn, h.id);
    let a = troops;
    let d = garrison;
    while (a > 0 && d > 0) {
      if (roll.int(1, 100) <= r.defenderWins) a--;
      else d--;
    }
    const won = d === 0;
    const from = h.owner;
    const event: ReportEvent = {
      kind: 'invasion',
      holding: h.id,
      system: h.system,
      by: fleet.owner,
      from,
      won,
      troops,
      garrison,
      left: won ? a : d,
    };
    events.get(fleet.owner)?.push(event);
    events.get(from)?.push(event);
    remember(state, from, fleet.owner, { kind: 'invaded', amount: r.invaded, system: h.system });
    if (won) {
      wearyFrom(state, from, r.wearyColony);
      takeHolding(state, h, fleet.owner, events);
    }
  }
  // A fleet left with no ship after its transports landed is gone.
  const ships = new Set(state.ships.map((s) => s.fleet));
  state.fleets = state.fleets.filter((f) => ships.has(f.id));
}

/**
 * Bombardment as the turn ends (§26.5): each fleet ordered to bombard, holding the orbit, kills a
 * twentieth of the colony's people and one turn in three wrecks its newest building; a planetary
 * shield stops it. Remembered by the bombed and heard by others.
 */
export function resolveBombardment(state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  const b = RULES.bombardment;
  for (const fleet of state.fleets) {
    const m = fleet.mission;
    if (!m || m.kind !== 'bombard') continue;
    if (missionRefusal(state, fleet, m) !== null) {
      fleet.mission = null;
      continue;
    }
    const h = state.holdings.find((x) => x.id === m.holding) as Holding;
    if (holdsOrbit(state, h.owner, h.system)) continue;
    const base = { kind: 'bombarded' as const, holding: h.id, system: h.system, by: fleet.owner };
    let event: ReportEvent;
    if (h.projects.includes('planetary-shield')) event = { ...base, people: 0, shielded: true };
    else {
      const lost = Math.min(h.people - 1, Math.max(1, Math.floor((h.people * b.peoplePercent) / 100)));
      h.people -= Math.max(0, lost);
      let wrecked: (typeof h.projects)[number] | undefined;
      if ((state.turn + h.id) % b.wreckEvery === 0) wrecked = [...h.projects].reverse().find((p) => !PROJECTS[p].great);
      if (wrecked) h.projects.splice(h.projects.lastIndexOf(wrecked), 1);
      event = { ...base, people: Math.max(0, lost), shielded: false, ...(wrecked ? { wrecked } : {}) };
    }
    events.get(fleet.owner)?.push(event);
    events.get(h.owner)?.push(event);
    if (event.kind === 'bombarded' && event.shielded) continue;
    keepMemory(state, h.owner, fleet.owner, 'bombarded', b.bombed, h.system);
    for (const p of state.powers)
      if (p.faction !== h.owner && p.faction !== fleet.owner && contactWith(p, fleet.owner))
        keepMemory(
          state,
          p.faction,
          fleet.owner,
          'bombarded-heard',
          FACTIONS[p.faction].lawful ? b.heardLawful : b.heard,
          h.system,
          h.owner,
        );
  }
}

/** A memory renewed rather than piled up: one for each bombardment or raid, at its full weight while it goes on. */
export function keepMemory(
  state: GameState,
  holder: FactionId,
  about: FactionId,
  kind: 'bombarded' | 'bombarded-heard' | 'raided' | 'raided-heard',
  amount: number,
  system: SystemId,
  victim?: FactionId,
): void {
  const have = powerOf(state, holder).memories.find(
    (m) => m.faction === about && m.kind === kind && m.system === system,
  );
  if (have) {
    have.amount = Math.min(have.amount, amount);
    have.turn = state.turn;
    return;
  }
  remember(state, holder, about, { kind, amount, system, ...(victim ? { victim } : {}) });
}

/** Blockades begun this turn (§26.6), told to the blockaded power. */
export function reportBlockades(
  state: GameState,
  before: ReadonlySet<number>,
  events: Map<FactionId, ReportEvent[]>,
): void {
  for (const h of state.holdings) {
    const by = blockadedBy(state, h);
    if (by && !before.has(h.id)) events.get(h.owner)?.push({ kind: 'blockaded', holding: h.id, system: h.system, by });
  }
}

/** The colonies blockaded now, by id. */
export function blockadedNow(state: GameState): Set<number> {
  return new Set(state.holdings.filter((h) => blockadedBy(state, h) !== null).map((h) => h.id));
}

/** A colony taken counts its unrest down each turn. */
export function settleTaken(state: GameState): void {
  for (const h of state.holdings) if (h.taken > 0) h.taken--;
}

/** The fleet's mission in words, for its panel. */
export function missionWords(state: GameState, fleet: Fleet, place: (h: Holding) => string): string | null {
  const m = fleet.mission;
  if (!m) return null;
  const h = state.holdings.find((x) => x.id === m.holding);
  if (!h) return null;
  return m.kind === 'invade' ? `Invading ${place(h)} as the turn ends` : `Bombarding ${place(h)}`;
}
