import { describe, expect, it } from 'vitest';
import type { FactionId } from '../../src/content/factions.ts';
import type { ModuleId } from '../../src/content/modules.ts';
import type { HullId } from '../../src/content/ships.ts';
import { SKY } from '../../src/data/sky.ts';
import {
  BAND_DISTANCE,
  CLOSING,
  frameAt,
  MOVE,
  OPENING,
  ROUND,
  replayModel,
  roundAt,
  roundBack,
  roundOn,
  roundStart,
} from '../../src/render/replayModel.ts';
import { type BattleLog, fight } from '../../src/sim/battle.ts';
import { makeDesign } from '../../src/sim/designs.ts';
import { formFleet } from '../../src/sim/fleets.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { type Fleet, type GameState, makeShip, newGame, powerOf, STATE_VERSION } from '../../src/sim/state.ts';
import { declareWar } from '../../src/sim/war.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M4 increment 45 (M4_FLEETS.md §25): the replay's timeline. */

const world = buildWorld(SKY);
const talk = (faction: FactionId) => ({ faction, stage: 'talk' as const, since: 1, words: 20 });
const two = (): GameState => {
  const g = newGame(world, {
    seed: 42,
    powers: [
      { faction: 'sta', controller: 'player' },
      { faction: 'frontier', controller: 'ai' },
    ],
  });
  powerOf(g, 'sta').contacts = [talk('frontier')];
  powerOf(g, 'frontier').contacts = [talk('sta')];
  return g;
};
const squadron = (
  g: GameState,
  owner: FactionId,
  at: string,
  hull: HullId,
  modules: ModuleId[],
  n: number,
  orders: Partial<Fleet> = {},
) => {
  const power = powerOf(g, owner);
  const d = makeDesign(g, power, hull, `${owner}-${hull}-${power.designs.length}`, modules);
  const ships = Array.from({ length: n }, () => makeShip(g, owner, hull, at, d.id));
  const fleet = formFleet(g, owner, ships);
  Object.assign(fleet, orders);
  return { fleet, ships };
};
const PULSE_FRIGATE: ModuleId[] = ['pulse-1', 'pulse-1', 'shield-1'];

/** Four of our frigates engaging one of theirs that defends: a short, one-sided battle. */
function oneSided(): BattleLog {
  const g = two();
  squadron(g, 'sta', 'alpha-centauri', 'frigate', PULSE_FRIGATE, 4, { stance: 'engage', retreat: 100 });
  squadron(g, 'frontier', 'alpha-centauri', 'corvette', ['pulse-1', 'armour-1'], 1, { retreat: 100 });
  declareWar(g, 'sta', 'frontier');
  return fight(world, g, 'alpha-centauri', 1);
}

/** Three a side, theirs with railguns, ours evading: it lasts two rounds, and ours leave. */
function evaded(): BattleLog {
  const g = two();
  squadron(g, 'sta', 'alpha-centauri', 'frigate', PULSE_FRIGATE, 3, { stance: 'evade', retreat: 100 });
  squadron(g, 'frontier', 'alpha-centauri', 'frigate', ['railgun-1', 'railgun-1', 'shield-1'], 3, {
    stance: 'engage',
    retreat: 100,
  });
  declareWar(g, 'sta', 'frontier');
  return fight(world, g, 'alpha-centauri', 1);
}

/** A long battle: two even squadrons that defend. */
function even(): BattleLog {
  const g = two();
  squadron(g, 'sta', 'alpha-centauri', 'destroyer', ['pulse-1', 'pulse-1', 'shield-1', 'armour-1'], 3, {
    stance: 'defend',
    retreat: 100,
  });
  squadron(g, 'frontier', 'alpha-centauri', 'destroyer', ['railgun-1', 'railgun-1', 'shield-1', 'armour-1'], 3, {
    stance: 'defend',
    retreat: 100,
  });
  declareWar(g, 'sta', 'frontier');
  return fight(world, g, 'alpha-centauri', 1);
}

describe('the timeline (§25.2)', () => {
  it('an opening, 3.5 s a round and a closing: eight rounds in about 30 seconds', () => {
    const log = even();
    const m = replayModel(log, 'sta');
    expect(m.rounds).toBe(log.rounds.length);
    expect(m.duration).toBe(OPENING + log.rounds.length * ROUND + CLOSING);
    expect(OPENING + 8 * ROUND + CLOSING).toBe(31);
    expect([roundAt(m, 0), roundAt(m, OPENING), roundAt(m, OPENING + ROUND), roundAt(m, m.duration)]).toEqual([
      0,
      1,
      2,
      m.rounds,
    ]);
  });

  it('a round back and a round on', () => {
    const m = replayModel(even(), 'sta');
    const r2 = roundStart(m, 2);
    expect(roundOn(m, 0)).toBe(roundStart(m, 1));
    expect(roundOn(m, r2 + 1)).toBe(roundStart(m, 3));
    expect(roundBack(m, r2 + 1)).toBe(r2);
    expect(roundBack(m, r2 + 0.1)).toBe(roundStart(m, 1));
    expect(roundOn(m, roundStart(m, m.rounds))).toBe(m.duration);
  });

  it('the viewer’s side is nearest the camera, the enemy across from it', () => {
    const m = replayModel(oneSided(), 'sta');
    expect(m.sides.map((s) => s.owner)).toEqual(['sta', 'frontier']);
    expect(m.sides[0]?.bearing).toBeCloseTo(Math.PI / 2);
    expect(m.sides[1]?.bearing).toBeCloseTo((3 * Math.PI) / 2);
    // Seen from the Cooperative, its side is the near one.
    expect(replayModel(oneSided(), 'frontier').sides[0]?.owner).toBe('frontier');
  });

  it('task forces start at long range and close to their stance’s range, moving at a round’s start', () => {
    const log = oneSided();
    const m = replayModel(log, 'sta');
    const ours = m.ships.find((s) => s.ship.owner === 'sta');
    if (!ours) throw new Error('no ship');
    const dist = (t: number) => {
      const p = frameAt(m, t).ships.find((s) => s.id === ours.ship.id)?.pos ?? [0, 0, 0];
      return Math.hypot(p[0], p[2]);
    };
    // Long range in the opening; middle in round 1 (a step); close in round 2 (engage).
    expect(dist(0)).toBeCloseTo(Math.hypot(BAND_DISTANCE[2] + ours.back, ours.across), 5);
    expect(log.rounds[0]?.bands[ours.ship.force]).toBe(1);
    expect(dist(roundStart(m, 1) + MOVE)).toBeCloseTo(dist(roundStart(m, 1) + ROUND - 0.01), 5);
    expect(dist(roundStart(m, 1) + MOVE)).toBeLessThan(dist(0));
    if (m.rounds >= 2) expect(dist(roundStart(m, 2) + MOVE)).toBeLessThan(dist(roundStart(m, 1) + MOVE));
    // Midway through the move, between the two.
    const mid = dist(roundStart(m, 1) + MOVE / 2);
    expect(mid).toBeLessThan(dist(0));
    expect(mid).toBeGreaterThan(dist(roundStart(m, 1) + MOVE));
  });

  it('every shot of the log, in its round, each landing within it', () => {
    const log = even();
    const m = replayModel(log, 'sta');
    expect(m.shots).toHaveLength(log.rounds.flatMap((r) => r.shots).length);
    for (const s of m.shots) {
      expect(s.fired).toBeGreaterThanOrEqual(roundStart(m, s.round) + MOVE);
      expect(s.lands).toBeLessThan(roundStart(m, s.round) + ROUND);
      expect(s.lands).toBeGreaterThan(s.fired);
    }
    // In the order they land.
    for (let i = 1; i < m.shots.length; i++)
      expect(m.shots[i]?.lands).toBeGreaterThanOrEqual(m.shots[i - 1]?.lands ?? 0);
    // Each by its weapon's kind: our pulse cannons energy, their railguns kinetic.
    expect(new Set(m.shots.filter((s) => m.byShip.get(s.from)?.ship.owner === 'sta').map((s) => s.type))).toEqual(
      new Set(['energy']),
    );
    expect(new Set(m.shots.filter((s) => m.byShip.get(s.from)?.ship.owner === 'frontier').map((s) => s.type))).toEqual(
      new Set(['kinetic']),
    );
  });

  it('structure as the log has it at the end; the shots in flight at a moment', () => {
    const log = even();
    const m = replayModel(log, 'sta');
    const end = frameAt(m, m.duration);
    for (const s of log.ships) {
      const taken = log.rounds
        .flatMap((r) => r.shots)
        .filter((x) => x[1] === s.id && x[4] > 0)
        .reduce((n, x) => n + x[4], 0);
      expect(end.ships.find((x) => x.id === s.id)?.structure).toBe(Math.max(0, s.structure - taken));
    }
    const first = m.shots[0];
    if (!first) throw new Error('no shot');
    const mid = frameAt(m, (first.fired + first.lands) / 2);
    expect(mid.shots.some((s) => s.shot === first && s.progress > 0 && s.progress < 1)).toBe(true);
    expect(frameAt(m, first.fired - 0.01).shots.some((s) => s.shot === first)).toBe(false);
  });

  it('a ship destroyed breaks up when the shot that ends it lands, then is gone', () => {
    const log = oneSided();
    const m = replayModel(log, 'sta');
    const victim = m.ships.find((s) => s.ship.owner === 'frontier');
    if (!victim || victim.dies === null) throw new Error('not destroyed');
    const status = (t: number) => frameAt(m, t).ships.find((s) => s.id === victim.ship.id)?.status;
    expect(status(victim.dies - 0.01)).toBe('fighting');
    expect(status(victim.dies + 0.1)).toBe('breaking');
    expect(status(victim.dies + 5)).toBe('gone');
    expect(frameAt(m, m.duration).tally.find((t) => t.owner === 'frontier')).toMatchObject({ ships: 0, lost: 1 });
  });

  it('a task force that evades leaves after its last round, turning away', () => {
    const log = evaded();
    const m = replayModel(log, 'sta');
    const ours = m.forces.find((f) => f.owner === 'sta');
    if (!ours || ours.leaves === null) throw new Error('did not leave');
    expect(ours.why).toBe('evade');
    expect(ours.leaves).toBeCloseTo(roundStart(m, 2) + ROUND - 0.6);
    const ship = m.ships.find((s) => s.ship.force === ours.key);
    const at = (t: number) => frameAt(m, t).ships.find((s) => s.id === ship?.ship.id);
    expect(at(ours.leaves - 0.01)?.status).toBe('fighting');
    expect(at(ours.leaves + 0.3)?.status).toBe('leaving');
    expect(at(m.duration)?.status).toBe('gone');
    expect(frameAt(m, m.duration).tally.find((t) => t.owner === 'sta')?.left).toBe(3);
  });

  it('is the same moment however it was reached', () => {
    const m = replayModel(even(), 'sta');
    const t = roundStart(m, 3) + 1.3;
    const direct = frameAt(m, t);
    for (let x = 0; x < t; x += 0.37) frameAt(m, x);
    frameAt(m, m.duration);
    expect(frameAt(m, t)).toEqual(direct);
  });

  it('each side’s tally: ships fighting and structure left', () => {
    const log = even();
    const m = replayModel(log, 'sta');
    const start = frameAt(m, 0).tally;
    for (const t of start) {
      const mine = log.ships.filter((s) => s.owner === t.owner);
      expect(t.ships).toBe(mine.length);
      expect(t.structure).toBe(mine.reduce((n, s) => n + s.structure, 0));
    }
    const end = frameAt(m, m.duration).tally;
    expect(end.reduce((n, t) => n + t.structure, 0)).toBeLessThan(start.reduce((n, t) => n + t.structure, 0));
  });
});

describe('state (§25.5)', () => {
  it('each ship keeps its weapons’ kinds; a save from version 19 keeps no battles', () => {
    const log = even();
    expect(log.ships.find((s) => s.owner === 'frontier')?.weapons).toEqual(['kinetic', 'kinetic']);
    const g = two();
    g.battles = [log];
    const old = structuredClone(g) as unknown as Record<string, unknown>;
    old.version = 19;
    const raw = { format: SAVE_FORMAT, version: 1, savedAt: '2026-10-22T00:00:00Z', game: old };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.battles).toEqual([]);
  });
});
