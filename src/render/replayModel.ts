// The battle replay's timeline (docs/design/M4_FLEETS.md §25.2): where every ship and shot is at any
// moment of a battle, from its log alone. Pure, so the replay can be seeked to any time and is the
// same however it got there; the scene (BattleScene.ts) only draws what this gives.

import type { FactionId } from '../content/factions.ts';
import type { DamageType, ShieldKind } from '../content/modules.ts';
import { RULES } from '../content/rules.ts';
import type { ShipType } from '../content/ships.ts';
import type { Band, BattleLog, BattleShip } from '../sim/battle.ts';

/** Seconds: the opening, each round, the move at a round's start, the volley after it, the closing. */
export const OPENING = 1.5;
export const ROUND = 3.5;
export const MOVE = 0.8;
export const VOLLEY = 1.9;
export const CLOSING = 1.5;
/** A task force leaves in the last part of its last round, turning, making off, then jumping out. */
export const LEAVE = 0.6;
export const TURN = 0.6;
export const DEPART = 2.0;
/** A ship destroyed breaks up over this long. */
export const BREAK_UP = 1.6;
/** How long a shot flies, by its kind (§25.2), and how long its impact shows. */
export const FLIGHT: Record<DamageType, number> = { kinetic: 0.3, energy: 0.5, plasma: 0.75, ion: 0.2 };
export const IMPACT = 0.5;

/** Each kind of fire's colour (§25.1), for the scene and the replay's key. */
export const SHOT_COLOURS: Record<DamageType, string> = {
  energy: '#a8d8ff',
  kinetic: '#ffae5c',
  plasma: '#8cff8c',
  ion: '#c99cff',
};
/** Each kind of shield's colour as it flares. */
export const SHIELD_COLOURS: Record<ShieldKind, string> = {
  deflector: '#5cc8ff',
  diffuser: '#ffb347',
  balanced: '#e8f0ff',
};

/** Distance from the centre of a task force at close, middle and long range, in scene units. */
export const BAND_DISTANCE: readonly [number, number, number] = [55, 125, 200];
/** A ship's length by its type, in scene units: a corvette smallest, a capital ship three times it. */
export const SHIP_LENGTH: Record<ShipType | 'battery', number> = {
  survey: 12,
  outpost: 15,
  colony: 18,
  transport: 16,
  corvette: 15,
  frigate: 20,
  destroyer: 26,
  cruiser: 34,
  capital: 46,
  battery: 34,
};
const SPACING = 40;
const RANK_DEPTH = 48;
const RANK_SIZE = 5;
const FORCE_GAP = 30;
/** How fast a leaving task force makes off, in units a second squared. */
const MAKE_OFF = 140;

export type Vec = [x: number, y: number, z: number];

export interface ReplaySide {
  owner: FactionId;
  /** Its bearing round the centre, in radians: the viewer's at π/2, nearest the camera. */
  bearing: number;
}

export interface ReplayForce {
  key: string;
  owner: FactionId;
  name: string;
  bearing: number;
  /** Its centre's offset across its side. */
  lateral: number;
  /** Its range in each round; before the first, long. */
  bands: Band[];
  /** When it starts to leave, or null. */
  leaves: number | null;
  why: 'evade' | 'retreat' | null;
}

export interface ReplayShip {
  ship: BattleShip;
  length: number;
  /** Its place in its task force: across, and back from the front rank. */
  across: number;
  back: number;
  /** A little height of its own, so the ranks are not flat. */
  rise: number;
  /** When the shot that destroys it lands, or null. */
  dies: number | null;
}

export interface ReplayShot {
  index: number;
  round: number;
  from: number;
  to: number;
  type: DamageType;
  fired: number;
  lands: number;
  /** Tenths taken by shields and structure; a miss takes nothing. */
  shield: number;
  hull: number;
  hit: boolean;
}

export interface ReplayModel {
  log: BattleLog;
  duration: number;
  rounds: number;
  sides: ReplaySide[];
  forces: ReplayForce[];
  ships: ReplayShip[];
  /** Every shot, in the order it lands. */
  shots: ReplayShot[];
  byShip: Map<number, ReplayShip>;
  byForce: Map<string, ReplayForce>;
  /** The hits on each ship, in the order they land. */
  hitsOn: Map<number, ReplayShot[]>;
}

export type ShipStatus = 'fighting' | 'breaking' | 'leaving' | 'gone';

export interface ShipFrame {
  id: number;
  pos: Vec;
  /** The way its bow points, as an angle in the plane of the battle (0 along +x, π/2 along +z). */
  heading: number;
  status: ShipStatus;
  /** How far through breaking up or leaving, 0 to 1. */
  phase: number;
  /** Tenths left. */
  structure: number;
  shield: number;
  /** When its shields or structure were last hit, for their flare. */
  shieldHit: number | null;
  hullHit: number | null;
}

export interface ShotFrame {
  shot: ReplayShot;
  from: Vec;
  /** Where it ends: the target, or past it for a miss. */
  to: Vec;
  /** 0 to 1 in flight; above 1, seconds since it landed, as `since`. */
  progress: number;
  since: number;
}

export interface Tally {
  owner: FactionId;
  ships: number;
  lost: number;
  left: number;
  structure: number;
  structureStart: number;
}

export interface Frame {
  t: number;
  /** The round under way: 0 in the opening, then 1 to the last (the last also through the closing). */
  round: number;
  ended: boolean;
  ships: ShipFrame[];
  shots: ShotFrame[];
  tally: Tally[];
}

/** When a round (from 1) begins. */
export function roundStart(model: Pick<ReplayModel, 'rounds'>, round: number): number {
  return OPENING + (Math.max(1, Math.min(model.rounds, round)) - 1) * ROUND;
}

/** The round under way at a time. */
export function roundAt(model: Pick<ReplayModel, 'rounds'>, t: number): number {
  if (t < OPENING || model.rounds === 0) return 0;
  return Math.min(model.rounds, Math.floor((t - OPENING) / ROUND) + 1);
}

/** Where to go for *a round back*: the start of this round, or of the one before if just begun. */
export function roundBack(model: Pick<ReplayModel, 'rounds'>, t: number): number {
  const r = roundAt(model, t);
  if (r === 0) return 0;
  const start = roundStart(model, r);
  if (t - start > 0.4) return start;
  return r === 1 ? 0 : roundStart(model, r - 1);
}

/** Where to go for *a round on*: the next round's start, or the end. */
export function roundOn(model: Pick<ReplayModel, 'rounds' | 'duration'>, t: number): number {
  const r = roundAt(model, t);
  return r >= model.rounds ? model.duration : roundStart(model, r + 1);
}

const smooth = (u: number) => {
  const x = Math.max(0, Math.min(1, u));
  return x * x * (3 - 2 * x);
};

/** A small, steady number from a few whole numbers, in [0, 1). */
function hash(...n: number[]): number {
  let h = 2166136261;
  for (const x of n) {
    h ^= x | 0;
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

/**
 * The replay of a battle: its sides round the centre (the viewer's nearest the camera), each task
 * force a row on its side, and every shot timed in its round (§25.2).
 */
export function replayModel(log: BattleLog, viewer: FactionId | null = null): ReplayModel {
  const rounds = log.rounds.length;
  const duration = OPENING + rounds * ROUND + CLOSING;
  const owners = [...new Set(log.forces.map((f) => f.owner))].sort((a, b) =>
    a === viewer ? -1 : b === viewer ? 1 : a < b ? -1 : a > b ? 1 : 0,
  );
  const sides: ReplaySide[] = owners.map((owner, i) => ({
    owner,
    bearing: Math.PI / 2 + (2 * Math.PI * i) / Math.max(2, owners.length),
  }));

  // Each task force's ships in ranks, the smallest hulls in front.
  const ships: ReplayShip[] = [];
  const widths = new Map<string, number>();
  for (const f of log.forces) {
    const mine = log.ships
      .filter((s) => s.force === f.key)
      .sort((a, b) => SHIP_LENGTH[a.type] - SHIP_LENGTH[b.type] || a.id - b.id);
    const perRank = Math.min(RANK_SIZE, Math.max(1, mine.length));
    widths.set(f.key, (perRank - 1) * SPACING);
    mine.forEach((ship, i) => {
      const rank = Math.floor(i / RANK_SIZE);
      const inRank = Math.min(RANK_SIZE, mine.length - rank * RANK_SIZE);
      const k = i % RANK_SIZE;
      ships.push({
        ship,
        length: SHIP_LENGTH[ship.type],
        across: (k - (inRank - 1) / 2) * SPACING,
        back: rank * RANK_DEPTH,
        rise: (hash(ship.id, 1) - 0.5) * 14 + rank * 8,
        dies: null,
      });
    });
  }

  // Task forces side by side across their power's side, each at its range in each round.
  const forces: ReplayForce[] = [];
  for (const side of sides) {
    const own = log.forces.filter((f) => f.owner === side.owner);
    const total = own.reduce((n, f) => n + (widths.get(f.key) ?? 0), 0) + FORCE_GAP * Math.max(0, own.length - 1);
    let x = -total / 2;
    for (const f of own) {
      const w = widths.get(f.key) ?? 0;
      const bands: Band[] = [];
      let band: Band = 2;
      let leftAfter: number | null = null;
      let why: 'evade' | 'retreat' | null = null;
      log.rounds.forEach((r, i) => {
        if (leftAfter === null) band = r.bands[f.key] ?? band;
        bands.push(band);
        const left = r.left.find((l) => l.force === f.key);
        if (left && leftAfter === null) {
          leftAfter = i + 1;
          why = left.why;
        }
      });
      forces.push({
        key: f.key,
        owner: f.owner,
        name: f.name,
        bearing: side.bearing,
        lateral: x + w / 2,
        bands,
        leaves: leftAfter === null ? null : roundStart({ rounds }, leftAfter) + ROUND - LEAVE,
        why,
      });
      x += w + FORCE_GAP;
    }
  }

  // Shots, spread through each round's volley in the log's order, each flying by its kind.
  const shots: ReplayShot[] = [];
  const byId = new Map(log.ships.map((s) => [s.id, s]));
  log.rounds.forEach((r, i) => {
    const start = roundStart({ rounds }, i + 1) + MOVE;
    const n = r.shots.length;
    r.shots.forEach(([from, to, weapon, shield, hull], k) => {
      const type = byId.get(from)?.weapons[weapon] ?? 'energy';
      const fired = start + (VOLLEY * k) / Math.max(1, n);
      shots.push({
        index: shots.length,
        round: i + 1,
        from,
        to,
        type,
        fired,
        lands: fired + FLIGHT[type],
        shield: hull < 0 ? 0 : shield,
        hull: hull < 0 ? 0 : hull,
        hit: hull >= 0,
      });
    });
    // A ship destroyed breaks up when the last shot to reach its structure lands.
    for (const id of r.destroyed) {
      const s = ships.find((x) => x.ship.id === id);
      if (!s) continue;
      const killing = shots.filter((x) => x.round === i + 1 && x.to === id && x.hull > 0);
      s.dies = killing.length ? Math.max(...killing.map((x) => x.lands)) : roundStart({ rounds }, i + 1) + ROUND - 0.4;
    }
  });
  shots.sort((a, b) => a.lands - b.lands || a.index - b.index);
  const hitsOn = new Map<number, ReplayShot[]>(ships.map((s) => [s.ship.id, []]));
  for (const shot of shots) if (shot.hit) hitsOn.get(shot.to)?.push(shot);
  return {
    log,
    duration,
    rounds,
    sides,
    forces,
    ships,
    shots,
    byShip: new Map(ships.map((s) => [s.ship.id, s])),
    byForce: new Map(forces.map((f) => [f.key, f])),
    hitsOn,
  };
}

/** A task force's distance from the centre at a time. */
function distanceAt(f: ReplayForce, t: number): number {
  const r = Math.min(f.bands.length, Math.max(0, Math.floor((t - OPENING) / ROUND) + 1));
  if (r === 0) return BAND_DISTANCE[2];
  const now = BAND_DISTANCE[f.bands[r - 1] ?? 2];
  const before = BAND_DISTANCE[r === 1 ? 2 : (f.bands[r - 2] ?? 2)];
  const u = (t - (OPENING + (r - 1) * ROUND)) / MOVE;
  return before + (now - before) * smooth(u);
}

/** Where a ship is and the way it faces, before it breaks up or jumps out. */
function placeAt(model: ReplayModel, s: ReplayShip, t: number): { pos: Vec; heading: number } {
  const f = model.byForce.get(s.ship.force) as ReplayForce;
  const out: Vec = [Math.cos(f.bearing), 0, Math.sin(f.bearing)];
  const across: Vec = [-out[2], 0, out[0]];
  let d = distanceAt(f, Math.min(t, f.leaves ?? t)) + s.back;
  let heading = f.bearing + Math.PI;
  if (f.leaves !== null && t > f.leaves) {
    const u = t - f.leaves;
    // Turning away, then making off faster and faster.
    heading += Math.PI * smooth(u / TURN);
    const v = Math.max(0, u - TURN * 0.5);
    d += 0.5 * MAKE_OFF * v * v;
  }
  const a = f.lateral + s.across;
  return {
    pos: [out[0] * d + across[0] * a, s.rise, out[2] * d + across[2] * a],
    heading,
  };
}

/** Everything at a time (§25.2): the same however the replay got there. */
export function frameAt(model: ReplayModel, time: number): Frame {
  const t = Math.max(0, Math.min(model.duration, time));
  const round = roundAt(model, t);
  const shieldRegen = RULES.battle.shieldRegenPercent;
  const ships: ShipFrame[] = [];
  const tally = new Map<FactionId, Tally>(
    model.sides.map((s) => [s.owner, { owner: s.owner, ships: 0, lost: 0, left: 0, structure: 0, structureStart: 0 }]),
  );
  for (const s of model.ships) {
    const f = model.byForce.get(s.ship.force) as ReplayForce;
    // Shields and structure, shot by shot as they land, the shields recovering at each round's end.
    let structure = s.ship.structure;
    let shield = s.ship.shieldMax;
    let shieldHit: number | null = null;
    let hullHit: number | null = null;
    let regenRound = 1;
    for (const shot of model.hitsOn.get(s.ship.id) ?? []) {
      if (shot.lands > t) break;
      while (regenRound < shot.round) {
        if (s.dies === null || s.dies > roundStart(model, regenRound) + ROUND)
          shield = Math.min(s.ship.shieldMax, shield + Math.floor((s.ship.shieldMax * shieldRegen) / 100));
        regenRound++;
      }
      shield -= shot.shield;
      structure -= shot.hull;
      if (shot.shield > 0) shieldHit = shot.lands;
      if (shot.hull > 0) hullHit = shot.lands;
    }
    while (regenRound <= model.rounds && roundStart(model, regenRound) + ROUND <= t) {
      if (s.dies === null || s.dies > roundStart(model, regenRound) + ROUND)
        shield = Math.min(s.ship.shieldMax, shield + Math.floor((s.ship.shieldMax * shieldRegen) / 100));
      regenRound++;
    }
    const { pos, heading } = placeAt(model, s, s.dies !== null ? Math.min(t, s.dies) : t);
    let status: ShipStatus = 'fighting';
    let phase = 0;
    if (s.dies !== null && t >= s.dies) {
      phase = (t - s.dies) / BREAK_UP;
      status = phase >= 1 ? 'gone' : 'breaking';
    } else if (f.leaves !== null && t > f.leaves) {
      phase = (t - f.leaves) / DEPART;
      status = phase >= 1 ? 'gone' : 'leaving';
    }
    ships.push({
      id: s.ship.id,
      pos,
      heading,
      status,
      phase: Math.min(1, phase),
      structure: Math.max(0, structure),
      shield: Math.max(0, shield),
      shieldHit,
      hullHit,
    });
    const tl = tally.get(s.ship.owner) as Tally;
    tl.structureStart += s.ship.structure;
    if (s.dies !== null && t >= s.dies) tl.lost++;
    else if (f.leaves !== null && t > f.leaves) tl.left++;
    else {
      tl.ships++;
      tl.structure += Math.max(0, structure);
    }
  }

  // The shots in flight, and those just landed.
  const where = new Map(ships.map((s) => [s.id, s]));
  const shots: ShotFrame[] = [];
  for (const shot of model.shots) {
    if (shot.fired > t || t > shot.lands + IMPACT) continue;
    const a = model.byShip.get(shot.from);
    const b = model.byShip.get(shot.to);
    if (!a || !b) continue;
    const from = placeAt(model, a, a.dies !== null ? Math.min(shot.fired, a.dies) : shot.fired).pos;
    const target = where.get(shot.to)?.pos ?? placeAt(model, b, shot.lands).pos;
    let to: Vec = target;
    if (!shot.hit) {
      // A miss passes beside the target and on.
      const side = (hash(shot.index, 7) - 0.5) * 2 * b.length * 1.4;
      const dx = target[0] - from[0];
      const dz = target[2] - from[2];
      const len = Math.hypot(dx, dz) || 1;
      to = [
        target[0] + (dx / len) * 25 - (dz / len) * side,
        target[1] + (hash(shot.index, 9) - 0.5) * b.length,
        target[2] + (dz / len) * 25 + (dx / len) * side,
      ];
    }
    const progress = t <= shot.lands ? (t - shot.fired) / (shot.lands - shot.fired) : 1 + (t - shot.lands);
    shots.push({ shot, from, to, progress, since: Math.max(0, t - shot.lands) });
  }
  return {
    t,
    round,
    ended: t >= model.duration,
    ships,
    shots,
    tally: model.sides.map((s) => tally.get(s.owner) as Tally),
  };
}
