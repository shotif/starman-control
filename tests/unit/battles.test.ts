import { describe, expect, it } from 'vitest';
import type { FactionId } from '../../src/content/factions.ts';
import type { ModuleId } from '../../src/content/modules.ts';
import { RULES } from '../../src/content/rules.ts';
import type { HullId } from '../../src/content/ships.ts';
import { SKY } from '../../src/data/sky.ts';
import { aiOrders } from '../../src/sim/ai.ts';
import {
  battleSystems,
  fight,
  hitChance,
  hitDamage,
  rangePercent,
  repairShips,
  structureMaxOf,
} from '../../src/sim/battle.ts';
import { makeDesign } from '../../src/sim/designs.ts';
import { formFleet } from '../../src/sim/fleets.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import {
  type Fleet,
  type GameState,
  makeShip,
  newGame,
  powerOf,
  type ShipState,
  STATE_VERSION,
} from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { declareWar } from '../../src/sim/war.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M4 increment 44 (M4_FLEETS.md §24): battles. */

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
/** A fleet of ships of one design at a system. */
const squadron = (
  g: GameState,
  owner: FactionId,
  at: string,
  hull: HullId,
  modules: ModuleId[],
  n: number,
  orders: Partial<Fleet> = {},
): { fleet: Fleet; ships: ShipState[] } => {
  const power = powerOf(g, owner);
  const d = makeDesign(g, power, hull, `${owner}-${hull}-${power.designs.length}`, modules);
  const ships = Array.from({ length: n }, () => makeShip(g, owner, hull, at, d.id));
  const fleet = formFleet(g, owner, ships);
  Object.assign(fleet, orders);
  return { fleet, ships };
};
const PULSE_FRIGATE: ModuleId[] = ['pulse-1', 'pulse-1', 'shield-1'];

describe('where and who (§24.1)', () => {
  it('a battle wherever an armed ship meets a ship of a power at war with it', () => {
    const g = two();
    squadron(g, 'sta', 'alpha-centauri', 'frigate', PULSE_FRIGATE, 2);
    squadron(g, 'frontier', 'alpha-centauri', 'frigate', PULSE_FRIGATE, 2);
    expect(battleSystems(g)).toEqual([]);
    declareWar(g, 'sta', 'frontier');
    expect(battleSystems(g)).toEqual(['alpha-centauri']);
  });

  it('is the same battle from the same game and the same orders', () => {
    const g = two();
    squadron(g, 'sta', 'alpha-centauri', 'frigate', PULSE_FRIGATE, 3);
    squadron(g, 'frontier', 'alpha-centauri', 'destroyer', ['railgun-1', 'railgun-1', 'shield-1', 'armour-1'], 2);
    declareWar(g, 'sta', 'frontier');
    const a = fight(world, structuredClone(g), 'alpha-centauri', 1);
    const b = fight(world, structuredClone(g), 'alpha-centauri', 1);
    expect(a).toEqual(b);
    expect(a.rounds.length).toBeGreaterThan(0);
    expect(a.rounds.flatMap((r) => r.shots).length).toBeGreaterThan(0);
  });
});

describe('ranges, hits and damage (§24.2 to §24.4)', () => {
  it('a weapon does its full damage at its best range, 60% a step away, 30% two', () => {
    expect([rangePercent(1, 1), rangePercent(1, 0), rangePercent(2, 0)]).toEqual([100, 60, 30]);
  });

  it('task forces close a step a round towards their stance’s range', () => {
    const g = two();
    squadron(g, 'sta', 'alpha-centauri', 'frigate', PULSE_FRIGATE, 1, { stance: 'engage', retreat: 100 });
    squadron(g, 'frontier', 'alpha-centauri', 'frigate', PULSE_FRIGATE, 1, { stance: 'defend', retreat: 100 });
    declareWar(g, 'sta', 'frontier');
    const log = fight(world, g, 'alpha-centauri', 1);
    const sta = log.forces.find((f) => f.owner === 'sta')?.key as string;
    const coop = log.forces.find((f) => f.owner === 'frontier')?.key as string;
    expect(log.rounds.slice(0, 3).map((r) => [r.bands[sta], r.bands[coop]])).toEqual([
      [1, 1],
      [0, 1],
      [0, 1],
    ]);
  });

  it('shields take hits by Reborn’s damage matrix; what they do not stop reaches the structure', () => {
    // Energy against a deflector: 30% more on the shield, which loses 6.5 to a hit of 5.0.
    expect(hitDamage(50, 'energy', 100, 'deflector')).toEqual({ shield: 65, hull: 0 });
    // Kinetic against a deflector: shed. A weak shield of 2.0 stops 2.0 of 3.5; the rest reaches
    // the hull, which kinetic hits 20% harder.
    expect(hitDamage(50, 'kinetic', 20, 'deflector')).toEqual({ shield: 20, hull: 26 });
    // Ion barely scratches a hull.
    expect(hitDamage(60, 'ion', 0, 'balanced')).toEqual({ shield: 0, hull: 15 });
  });

  it('hits 70 in 100, more with a targeting computer, less against one that evades, and by size', () => {
    expect(hitChance(false, 'destroyer', false)).toBe(70);
    expect(hitChance(true, 'capital', false)).toBe(95);
    expect(hitChance(false, 'corvette', true)).toBe(45);
  });
});

describe('the end (§24.5)', () => {
  it('ships destroyed are gone, damage stays, losses weary their power, the victor holds the system', () => {
    let g = two();
    const strong = squadron(g, 'sta', 'alpha-centauri', 'frigate', PULSE_FRIGATE, 4, {
      stance: 'engage',
      retreat: 100,
    });
    squadron(g, 'frontier', 'alpha-centauri', 'corvette', ['pulse-1', 'armour-1'], 1, { retreat: 100 });
    declareWar(g, 'sta', 'frontier');
    g = resolveTurn(world, g).state;
    const log = g.battles[0];
    expect(log?.held).toEqual(['sta']);
    expect(g.ships.some((s) => s.owner === 'frontier' && s.type === 'corvette')).toBe(false);
    expect(powerOf(g, 'frontier').weariness).toBeGreaterThanOrEqual(RULES.war.wearyWarship);
    expect(g.ships.filter((s) => strong.ships.some((x) => x.id === s.id))).toHaveLength(4);
    // Both powers read of it.
    for (const f of ['sta', 'frontier'] as const)
      expect(g.reports.find((r) => r.faction === f)?.events).toContainEqual({
        kind: 'battle',
        battle: 1,
        system: 'alpha-centauri',
      });
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('a task force that reaches its retreat point leaves, and makes for home', () => {
    const g = two();
    // At YZ Ceti, a lane from the Cooperative's capital.
    squadron(g, 'sta', 'yz-ceti', 'cruiser', [...PULSE_FRIGATE, 'pulse-1', 'pulse-1', 'pulse-1'], 3, {
      stance: 'engage',
      retreat: 100,
    });
    const weak = squadron(g, 'frontier', 'yz-ceti', 'frigate', PULSE_FRIGATE, 3, { retreat: 25 });
    declareWar(g, 'sta', 'frontier');
    const log = fight(world, g, 'yz-ceti', 1);
    expect(log.rounds.some((r) => r.left.some((l) => l.why === 'retreat'))).toBe(true);
    expect(log.why).toContainEqual(expect.objectContaining({ kind: 'left', owner: 'frontier', why: 'retreat' }));
    expect(g.fleets.find((f) => f.id === weak.fleet.id)?.destinations).toEqual(['tau-ceti']);
  });

  it('an evading task force leaves after the second round', () => {
    const g = two();
    squadron(g, 'sta', 'alpha-centauri', 'frigate', PULSE_FRIGATE, 2, { stance: 'engage', retreat: 100 });
    squadron(g, 'frontier', 'alpha-centauri', 'frigate', PULSE_FRIGATE, 2, { stance: 'evade', retreat: 100 });
    declareWar(g, 'sta', 'frontier');
    const log = fight(world, g, 'alpha-centauri', 1);
    expect(log.rounds[1]?.left).toContainEqual(expect.objectContaining({ why: 'evade' }));
    expect(log.rounds.length).toBe(2);
  });

  it('says why: the weight of fire, and shields that shed a kind of fire', () => {
    const g = two();
    squadron(g, 'sta', 'alpha-centauri', 'frigate', ['railgun-1', 'railgun-1', 'shield-1'], 4, {
      stance: 'engage',
      retreat: 100,
    });
    powerOf(g, 'frontier').researched.push('deflector-fields');
    squadron(g, 'frontier', 'alpha-centauri', 'corvette', ['pulse-1', 'deflector-1'], 1, { retreat: 100 });
    declareWar(g, 'sta', 'frontier');
    const log = fight(world, g, 'alpha-centauri', 1);
    expect(log.why).toContainEqual(expect.objectContaining({ kind: 'weight', strong: 'sta', weak: 'frontier' }));
    expect(log.why).toContainEqual(
      expect.objectContaining({ kind: 'shields', by: 'frontier', shield: 'deflector', type: 'kinetic', percent: -30 }),
    );
  });
});

describe('repairs (§24.6)', () => {
  it('half at a shipyard, a tenth at a colony or with a repair bay, nothing elsewhere', () => {
    const g = two();
    const atYard = squadron(g, 'sta', 'sol', 'frigate', PULSE_FRIGATE, 1).ships[0] as ShipState;
    const away = squadron(g, 'sta', 'alpha-centauri', 'frigate', PULSE_FRIGATE, 1).ships[0] as ShipState;
    powerOf(g, 'sta').researched.push('fire-control', 'field-repairs');
    const bayed = squadron(g, 'sta', 'barnards-star', 'frigate', ['pulse-1', 'shield-1', 'repair-bay'], 1)
      .ships[0] as ShipState;
    const max = structureMaxOf(g, atYard);
    for (const s of [atYard, away, bayed]) s.damage = 150;
    repairShips(g);
    expect(max).toBe(200);
    expect(atYard.damage).toBe(50);
    expect(away.damage).toBe(150);
    expect(bayed.damage).toBe(130);
  });
});

describe('the rivals at war (§24.9)', () => {
  it('build warships at their yards, and keep their fleets at the capital', () => {
    const g = two();
    declareWar(g, 'sta', 'frontier');
    powerOf(g, 'frontier').treasury = 200;
    const orders = aiOrders(world, g, 'frontier');
    expect(orders).toContainEqual(
      expect.objectContaining({ type: 'queue', item: expect.objectContaining({ kind: 'ship', ship: 'frigate' }) }),
    );
    squadron(g, 'frontier', 'epsilon-eridani', 'frigate', PULSE_FRIGATE, 1);
    expect(aiOrders(world, g, 'frontier')).toContainEqual(
      expect.objectContaining({ type: 'fleet-move', to: 'tau-ceti' }),
    );
  });
});

describe('state (§24.10)', () => {
  it('a save from version 18 has no damage and no battles', () => {
    const g = two();
    const old = structuredClone(g) as unknown as Record<string, unknown>;
    old.version = 18;
    delete old.battles;
    for (const s of old.ships as Record<string, unknown>[]) delete s.damage;
    const raw = { format: SAVE_FORMAT, version: 1, savedAt: '2026-10-22T00:00:00Z', game: old };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.battles).toEqual([]);
    expect(loaded.ships.every((s) => s.damage === 0)).toBe(true);
  });
});
