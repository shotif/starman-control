// Battles (M4_FLEETS.md §7, §24, D-62): wherever armed ships of powers at war meet, a battle is
// fought in up to eight rounds at three ranges. Each fleet is a task force with its own stance,
// target priority and retreat point (D-07, D-61); shields take hits by Reborn's damage matrix
// (src/content/rules/balance.ts in Reborn, D-10); structure lost stays. Every roll comes from the
// game's seed, so the same game and the same orders give the same battle (D-06). Pure and in whole
// numbers: damage, shields and structure are worked in tenths.

import type { FactionId } from '../content/factions.ts';
import { type DamageType, MODULES, type ShieldKind } from '../content/modules.ts';
import { RULES } from '../content/rules.ts';
import { SHIPS, type ShipType } from '../content/ships.ts';
import type { SystemId } from '../data/types.ts';
import { shipDesign } from './designs.ts';
import { fleetById, pruneFleets } from './fleets.ts';
import { findRoute, lanesFor } from './movement.ts';
import type { ReportEvent } from './report.ts';
import { rng } from './rng.ts';
import type { GameState, RetreatPoint, ShipState, Stance, TargetPriority } from './state.ts';
import { atWar, wearyFrom } from './war.ts';
import type { World } from './world.ts';

/** Reborn's damage matrix, in percent: what a hit of each type does to each shield, and to a hull. */
export const DAMAGE_MATRIX: Record<DamageType, Record<ShieldKind | 'hull', number>> = {
  energy: { deflector: 130, diffuser: 70, balanced: 100, hull: 90 },
  kinetic: { deflector: 70, diffuser: 100, balanced: 100, hull: 120 },
  plasma: { deflector: 90, diffuser: 130, balanced: 100, hull: 100 },
  ion: { deflector: 160, diffuser: 160, balanced: 150, hull: 25 },
};

/** A range: 0 close, 1 middle, 2 long. */
export type Band = 0 | 1 | 2;

const BAND: Record<'close' | 'middle' | 'long', Band> = { close: 0, middle: 1, long: 2 };
const SOUGHT: Record<Stance, Band> = { engage: 0, defend: 1, evade: 2 };

/** A task force in a battle: a fleet, or a power's ships sailing alone. */
export interface TaskForce {
  key: string;
  owner: FactionId;
  /** The fleet it is, or null for ships sailing alone. */
  fleet: number | null;
  name: string;
  stance: Stance;
  target: TargetPriority;
  retreat: RetreatPoint;
}

/** A ship as it entered a battle. */
export interface BattleShip {
  id: number;
  owner: FactionId;
  name: string;
  type: ShipType;
  /** Its design's name, for a warship. */
  design: string | null;
  force: string;
  /** In tenths: its structure whole, as it began, and its shields whole. */
  structureMax: number;
  structure: number;
  shieldMax: number;
  shieldKind: ShieldKind;
  armed: boolean;
}

/** One shot: who fired, at whom, with which of its weapons; tenths taken by shields and by structure (−1 a miss). */
export type Shot = [from: number, to: number, weapon: number, shield: number, hull: number];

export interface Round {
  /** Each task force's range this round, by key, for those still in it. */
  bands: Record<string, Band>;
  shots: Shot[];
  /** Ships destroyed this round. */
  destroyed: number[];
  /** Task forces that left after this round, and why. */
  left: { force: string; why: 'evade' | 'retreat' }[];
}

/** Why a battle went as it did, from one side's view or the other's (§24.8). */
export type Why =
  /** `by`'s shields took a share of `against`'s fire of one type more (or less) than a balanced shield would. */
  | { kind: 'shields'; by: FactionId; shield: ShieldKind; against: FactionId; type: DamageType; percent: number }
  /** `of`'s fire was weakened by range: so much of its damage lost to firing away from its weapons' best range. */
  | { kind: 'range'; of: FactionId; percent: number }
  /** One side brought much more fire than the other. */
  | { kind: 'weight'; strong: FactionId; weak: FactionId; strongAttack: number; weakAttack: number }
  /** A task force left: it evaded, or it reached its retreat point. */
  | { kind: 'left'; owner: FactionId; force: string; why: 'evade' | 'retreat' }
  /** Ion fire barely scratched hulls once the shields were down. */
  | { kind: 'ion'; of: FactionId; percent: number };

/** A battle as it was fought: kept for the turn's report and replay (§24.8). */
export interface BattleLog {
  /** Its number in the turn. */
  id: number;
  system: SystemId;
  turn: number;
  powers: FactionId[];
  forces: TaskForce[];
  ships: BattleShip[];
  rounds: Round[];
  /** Powers with armed ships still in the system at the end. */
  held: FactionId[];
  why: Why[];
}

/** Whether a ship carries a weapon. */
function weaponsOf(state: GameState, ship: ShipState): { damage: number; type: DamageType; best: Band }[] {
  const d = shipDesign(state, ship);
  if (!d) return [];
  const out: { damage: number; type: DamageType; best: Band }[] = [];
  for (const m of d.modules) {
    const w = MODULES[m].weapon;
    if (w) out.push({ damage: w.damage * 10, type: w.type, best: BAND[w.range] });
  }
  return out;
}

/** A ship's structure whole, in tenths: its hull's and its armour's. */
export function structureMaxOf(state: GameState, ship: ShipState): number {
  const d = shipDesign(state, ship);
  const hull = SHIPS[ship.type].hull?.structure ?? RULES.battle.civilStructure;
  const armour = d ? d.modules.reduce((n, m) => n + (MODULES[m].armour ?? 0), 0) : 0;
  return (hull + armour) * 10;
}

function shieldsOf(state: GameState, ship: ShipState): { max: number; kind: ShieldKind } {
  const d = shipDesign(state, ship);
  let max = 0;
  let best: { capacity: number; kind: ShieldKind } | null = null;
  for (const m of d?.modules ?? []) {
    const s = MODULES[m].shield;
    if (!s) continue;
    max += s.capacity * 10;
    if (!best || s.capacity > best.capacity) best = s;
  }
  return { max, kind: best?.kind ?? 'balanced' };
}

/** The share of a weapon's damage at a range, in percent: full at its best, less a step or two away. */
export function rangePercent(best: Band, band: Band): number {
  return RULES.battle.rangePercent[Math.abs(best - band)] ?? 0;
}

/** What a hit does to a target (§24.4): tenths taken by its shields and by its structure. */
export function hitDamage(
  damage: number,
  type: DamageType,
  shield: number,
  shieldKind: ShieldKind,
): { shield: number; hull: number } {
  const row = DAMAGE_MATRIX[type];
  const onShield = Math.floor((damage * row[shieldKind]) / 100);
  const absorbed = Math.min(shield, onShield);
  // The part of the hit the shield did not stop reaches the structure.
  const through = onShield > 0 ? damage - Math.floor((absorbed * 100) / row[shieldKind]) : damage;
  return { shield: absorbed, hull: Math.floor((Math.max(0, through) * row.hull) / 100) };
}

/** The chance in a hundred that a shot hits (§24.3). */
export function hitChance(targeting: boolean, target: ShipType, evading: boolean): number {
  const b = RULES.battle;
  const size = b.sizeToHit[target] ?? 0;
  return Math.max(5, Math.min(95, b.toHit + (targeting ? b.targeting : 0) - (evading ? b.evading : 0) + size));
}

/** The systems where a battle is fought this turn: an armed ship and a ship of a power at war with it. */
export function battleSystems(state: GameState): SystemId[] {
  if (state.wars.length === 0) return [];
  const out = new Set<SystemId>();
  for (const a of state.ships) {
    if (a.at === null || !weaponsOf(state, a).length) continue;
    if (state.ships.some((b) => b.at === a.at && atWar(state, a.owner, b.owner))) out.add(a.at);
  }
  return [...out].sort();
}

/** The nearest system where a power has a colony, other than `from`, by lanes it may use; null if none. */
function nearestHome(world: World, state: GameState, owner: FactionId, from: SystemId): SystemId | null {
  const graph = lanesFor(world, state, owner, true);
  let best: { to: SystemId; points: number } | null = null;
  for (const h of state.holdings) {
    if (h.owner !== owner || h.kind !== 'colony' || h.system === from) continue;
    const route = findRoute(world, state, owner, from, h.system, graph);
    if (!route) continue;
    const points = route.reduce((n, hop) => n + hop.cost, 0);
    if (!best || points < best.points || (points === best.points && h.system < best.to))
      best = { to: h.system, points };
  }
  return best?.to ?? null;
}

/**
 * Fights the battle at a system (§24.1 to §24.5), changing the state: ships destroyed, damage kept,
 * task forces that left sent home. Returns the battle as fought.
 */
export function fight(world: World, state: GameState, system: SystemId, id: number): BattleLog {
  const b = RULES.battle;
  const here = state.ships.filter((s) => s.at === system);
  const powers = [...new Set(here.map((s) => s.owner))]
    .filter((p) => here.some((s) => s.owner !== p && atWar(state, p, s.owner)))
    .sort();
  const ships = here.filter((s) => powers.includes(s.owner));

  // Task forces: each fleet, and each power's ships sailing alone.
  const forces: TaskForce[] = [];
  const forceOf = (s: ShipState): string => {
    const f = fleetById(state, s.fleet);
    const key = f ? `f${f.id}` : `a-${s.owner}`;
    if (!forces.some((t) => t.key === key))
      forces.push(
        f
          ? { key, owner: f.owner, fleet: f.id, name: f.name, stance: f.stance, target: f.target, retreat: f.retreat }
          : {
              key,
              owner: s.owner,
              fleet: null,
              name: 'ships sailing alone',
              stance: 'evade',
              target: 'warships',
              retreat: 100,
            },
      );
    return key;
  };
  const fighters = ships.map((s) => {
    const sh = shieldsOf(state, s);
    const max = structureMaxOf(state, s);
    return {
      ship: s,
      log: {
        id: s.id,
        owner: s.owner,
        name: s.name,
        type: s.type,
        design: shipDesign(state, s)?.name ?? null,
        force: forceOf(s),
        structureMax: max,
        structure: Math.max(1, max - s.damage),
        shieldMax: sh.max,
        shieldKind: sh.kind,
        armed: weaponsOf(state, s).length > 0,
      } satisfies BattleShip,
      weapons: weaponsOf(state, s),
      targeting: shipDesign(state, s)?.modules.includes('targeting') ?? false,
      structure: Math.max(1, max - s.damage),
      shield: sh.max,
    };
  });
  const byForce = new Map(forces.map((f) => [f.key, f]));
  const startStructure = new Map(forces.map((f) => [f.key, 0]));
  for (const x of fighters) startStructure.set(x.log.force, (startStructure.get(x.log.force) ?? 0) + x.structure);
  const band = new Map<string, Band>(forces.map((f) => [f.key, 2]));
  const gone = new Set<string>();
  const roll = rng(state.seed, 'battle', state.turn, system);
  const rounds: Round[] = [];
  // For the why lines: damage each side's weapons would have done at their best, and did.
  const fired = new Map<FactionId, { best: number; ranged: number; shield: number; hull: number }>();
  const byType = new Map<string, { raw: number; dealt: number }>();

  const alive = (x: (typeof fighters)[number]) => x.structure > 0 && !gone.has(x.log.force);
  const enemiesOf = (owner: FactionId) => fighters.filter((y) => alive(y) && atWar(state, owner, y.log.owner));
  const anyFight = () => fighters.some((x) => alive(x) && x.weapons.length > 0 && enemiesOf(x.log.owner).length > 0);

  for (let r = 1; r <= b.rounds && anyFight(); r++) {
    const round: Round = { bands: {}, shots: [], destroyed: [], left: [] };
    for (const f of forces) {
      if (gone.has(f.key)) continue;
      const now = band.get(f.key) ?? 2;
      const next = Math.max(SOUGHT[f.stance], now - 1) as Band;
      band.set(f.key, next);
      round.bands[f.key] = next;
    }
    const atStart = fighters.filter(alive);
    for (const x of atStart) {
      const mine = byForce.get(x.log.force) as TaskForce;
      for (const [w, weapon] of x.weapons.entries()) {
        const targets = enemiesOf(x.log.owner);
        if (targets.length === 0) break;
        const t = choose(targets, mine.target, roll);
        const tForce = byForce.get(t.log.force) as TaskForce;
        const between = Math.min(band.get(mine.key) ?? 2, band.get(tForce.key) ?? 2) as Band;
        const chance = hitChance(x.targeting, t.log.type, tForce.stance === 'evade');
        const sum = fired.get(x.log.owner) ?? { best: 0, ranged: 0, shield: 0, hull: 0 };
        fired.set(x.log.owner, sum);
        if (roll.int(1, 100) > chance) {
          round.shots.push([x.log.id, t.log.id, w, 0, -1]);
          continue;
        }
        const damage = Math.floor((weapon.damage * rangePercent(weapon.best, between)) / 100);
        const hit = hitDamage(damage, weapon.type, t.shield, t.log.shieldKind);
        t.shield -= hit.shield;
        t.structure -= hit.hull;
        sum.best += weapon.damage;
        sum.ranged += damage;
        sum.shield += hit.shield;
        sum.hull += hit.hull;
        const key = `${x.log.owner}|${t.log.owner}|${weapon.type}|${t.log.shieldKind}|${t.shield + hit.shield > 0 ? 's' : 'h'}`;
        const k = byType.get(key) ?? { raw: 0, dealt: 0 };
        k.raw += damage;
        k.dealt += hit.shield + hit.hull;
        byType.set(key, k);
        round.shots.push([x.log.id, t.log.id, w, hit.shield, hit.hull]);
        if (t.structure <= 0 && !round.destroyed.includes(t.log.id)) round.destroyed.push(t.log.id);
      }
    }
    // Shields recover; task forces that evade or have lost their retreat point leave.
    for (const x of fighters)
      if (x.structure > 0)
        x.shield = Math.min(x.log.shieldMax, x.shield + Math.floor((x.log.shieldMax * b.shieldRegenPercent) / 100));
    for (const f of forces) {
      if (gone.has(f.key)) continue;
      const left = fighters.filter((x) => x.log.force === f.key && x.structure > 0);
      if (left.length === 0) {
        gone.add(f.key);
        continue;
      }
      const start = startStructure.get(f.key) ?? 0;
      const now = left.reduce((n, x) => n + x.structure, 0);
      const why =
        f.stance === 'evade' && r >= b.evadeAfter
          ? 'evade'
          : f.retreat < 100 && (start - now) * 100 >= start * f.retreat
            ? 'retreat'
            : null;
      if (why) {
        gone.add(f.key);
        round.left.push({ force: f.key, why });
      }
    }
    rounds.push(round);
  }

  // What stays: structure lost, ships destroyed, task forces that left sent home.
  const destroyed = new Set(fighters.filter((x) => x.structure <= 0).map((x) => x.log.id));
  for (const x of fighters) if (x.structure > 0) x.ship.damage = x.log.structureMax - x.structure;
  for (const x of fighters.filter((y) => destroyed.has(y.log.id)))
    wearyFrom(state, x.log.owner, x.log.armed ? RULES.war.wearyWarship : RULES.war.wearyShip);
  state.ships = state.ships.filter((s) => !destroyed.has(s.id));
  pruneFleets(state);
  const leftForces = rounds.flatMap((r) => r.left);
  for (const { force } of leftForces) {
    const f = byForce.get(force) as TaskForce;
    const home = nearestHome(world, state, f.owner, system);
    if (!home) continue;
    if (f.fleet !== null) {
      const fleet = fleetById(state, f.fleet);
      if (fleet) {
        fleet.destinations = [home];
        fleet.hold = false;
      }
    } else
      for (const s of state.ships)
        if (s.at === system && s.owner === f.owner && s.fleet === null) {
          s.destinations = [home];
          s.hold = false;
        }
  }
  const held = powers.filter((p) =>
    fighters.some((x) => x.log.owner === p && x.structure > 0 && x.weapons.length > 0 && !gone.has(x.log.force)),
  );
  const log: BattleLog = {
    id,
    system,
    turn: state.turn,
    powers,
    forces,
    ships: fighters.map((x) => x.log),
    rounds,
    held,
    why: whyOf(state, powers, fighters, fired, byType, leftForces, byForce),
  };
  return log;
}

/** A target by the firing task force's priority (§24.3): the first group, then one at random. */
function choose<T extends { structure: number; weapons: unknown[]; log: BattleShip }>(
  targets: T[],
  priority: TargetPriority,
  roll: ReturnType<typeof rng>,
): T {
  let group: T[];
  if (priority === 'warships' || priority === 'transports') {
    const armed = targets.filter((t) => t.weapons.length > 0);
    const unarmed = targets.filter((t) => t.weapons.length === 0);
    group = priority === 'warships' ? (armed.length > 0 ? armed : unarmed) : unarmed.length > 0 ? unarmed : armed;
  } else {
    const most = priority === 'largest';
    const pick = targets.reduce((n, t) => (most ? Math.max(n, t.structure) : Math.min(n, t.structure)), most ? 0 : 1e9);
    group = targets.filter((t) => t.structure === pick);
  }
  return roll.pick(group);
}

/** Up to three reasons the battle went as it did (§24.8), the weightiest first. */
function whyOf(
  state: GameState,
  powers: FactionId[],
  fighters: { log: BattleShip; weapons: { damage: number }[] }[],
  fired: Map<FactionId, { best: number; ranged: number; shield: number; hull: number }>,
  byType: Map<string, { raw: number; dealt: number }>,
  left: { force: string; why: 'evade' | 'retreat' }[],
  byForce: Map<string, TaskForce>,
): Why[] {
  const out: { why: Why; weight: number }[] = [];
  // The weight of fire: each side's attack as it came in.
  const attack = (p: FactionId) =>
    fighters.filter((x) => x.log.owner === p).reduce((n, x) => n + x.weapons.reduce((m, w) => m + w.damage, 0), 0);
  for (const a of powers)
    for (const b of powers) {
      if (a >= b || !atWar(state, a, b)) continue;
      const [sa, sb] = [attack(a), attack(b)];
      const [strong, weak, hi, lo] = sa >= sb ? [a, b, sa, sb] : [b, a, sb, sa];
      if (hi >= lo * 2 && hi > 0)
        out.push({
          why: { kind: 'weight', strong, weak, strongAttack: hi / 10, weakAttack: lo / 10 },
          weight: 50,
        });
    }
  // Shields against weapon types, where a type did a quarter more or less than against a balanced shield.
  for (const [key, v] of byType) {
    const [from, to, type, shield, onWhat] = key.split('|') as [FactionId, FactionId, DamageType, ShieldKind, string];
    if (onWhat !== 's' || v.raw < 40 || shield === 'balanced') continue;
    const percent = DAMAGE_MATRIX[type][shield] - 100;
    if (Math.abs(percent) >= 25)
      out.push({
        why: { kind: 'shields', by: to, shield, against: from, type, percent },
        weight: 30 + Math.abs(percent) / 2,
      });
  }
  // Ion fire on hulls.
  for (const [key, v] of byType) {
    const [from, , type, , onWhat] = key.split('|') as [FactionId, FactionId, DamageType, ShieldKind, string];
    if (type === 'ion' && onWhat === 'h' && v.raw >= 40)
      out.push({ why: { kind: 'ion', of: from, percent: 75 }, weight: 35 });
  }
  // Range: a quarter or more of a side's damage lost to firing away from its best range.
  for (const [p, f] of fired) {
    if (f.best <= 0) continue;
    const lost = Math.floor(((f.best - f.ranged) * 100) / f.best);
    if (lost >= 25) out.push({ why: { kind: 'range', of: p, percent: lost }, weight: 20 + lost / 2 });
  }
  for (const l of left) {
    const f = byForce.get(l.force) as TaskForce;
    out.push({
      why: { kind: 'left', owner: f.owner, force: f.name, why: l.why },
      weight: l.why === 'retreat' ? 45 : 25,
    });
  }
  // One reason of each kind for each pair, the weightiest three.
  const seen = new Set<string>();
  return out
    .sort((a, b) => b.weight - a.weight)
    .filter(({ why }) => {
      const k = JSON.stringify([why.kind, 'by' in why ? why.by : '', 'of' in why ? why.of : '']);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 3)
    .map((x) => x.why);
}

/** The turn's battles (§24): fought at every system where they arise, in id order; each power told. */
export function resolveBattles(world: World, state: GameState, events: Map<FactionId, ReportEvent[]>): BattleLog[] {
  const logs: BattleLog[] = [];
  for (const system of battleSystems(state)) {
    const log = fight(world, state, system, logs.length + 1);
    logs.push(log);
    for (const p of log.powers) events.get(p)?.push({ kind: 'battle', battle: log.id, system });
  }
  return logs;
}

/**
 * Repairs as the turn ends (§24.6): half a ship's structure a turn where its power has a shipyard, a
 * tenth where it has a colony, a tenth anywhere with a repair bay in its fleet; the best of them.
 */
export function repairShips(state: GameState): void {
  const b = RULES.battle;
  for (const s of state.ships) {
    if (s.damage <= 0 || s.at === null) continue;
    const at = s.at;
    const here = state.holdings.filter((h) => h.owner === s.owner && h.system === at && h.kind === 'colony');
    const bay =
      s.fleet !== null &&
      state.ships.some((x) => x.fleet === s.fleet && shipDesign(state, x)?.modules.includes('repair-bay'));
    const percent = Math.max(
      here.some((h) => h.projects.includes('shipyard')) ? b.repairYardPercent : 0,
      here.length > 0 ? b.repairColonyPercent : 0,
      bay ? b.repairBayPercent : 0,
    );
    if (percent === 0) continue;
    s.damage = Math.max(0, s.damage - Math.ceil((structureMaxOf(state, s) * percent) / 100));
  }
}
