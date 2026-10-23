import { describe, expect, it } from 'vitest';
import { FACTION_IDS, type FactionId } from '../../src/content/factions.ts';
import type { ModuleId } from '../../src/content/modules.ts';
import { SHIPS } from '../../src/content/ships.ts';
import { SKY } from '../../src/data/sky.ts';
import { aiOrders } from '../../src/sim/ai.ts';
import { makeDesign } from '../../src/sim/designs.ts';
import { upkeepOf } from '../../src/sim/economy.ts';
import { formFleet } from '../../src/sim/fleets.ts';
import { applyInPlace } from '../../src/sim/orders.ts';
import { type GameState, makeShip, newGame, powerOf } from '../../src/sim/state.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { warshipsWanted } from '../../src/sim/warAi.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M5 increment 58 (M5_UNKNOWN.md §26.3): cutting costs. */

const world = buildWorld(SKY);
const five = (player: FactionId = 'sta'): GameState =>
  newGame(world, {
    seed: 42,
    powers: FACTION_IDS.map((faction) => ({
      faction,
      controller: faction === player ? ('player' as const) : ('ai' as const),
    })),
  });
const MODS: ModuleId[] = ['pulse-1', 'pulse-1', 'shield-1'];
const order = (g: GameState, f: FactionId, o: Parameters<typeof applyInPlace>[3]) => applyInPlace(world, g, f, o);

describe('scrapping a ship (§26.3)', () => {
  it('ours and at a star: broken up, its fleet with it if empty, its upkeep gone', () => {
    const g = five();
    const d = makeDesign(g, powerOf(g, 'sta'), 'frigate', 'test', MODS);
    const ship = makeShip(g, 'sta', 'frigate', 'sol', d.id);
    const fleet = formFleet(g, 'sta', [ship]);
    const theirs = g.ships.find((s) => s.owner === 'frontier');
    if (!theirs) throw new Error('a ship of theirs');
    expect(order(g, 'sta', { type: 'scrap', ship: theirs.id })).toBe('That ship is not ours.');
    const before = upkeepOf(g, 'sta').total;
    expect(order(g, 'sta', { type: 'scrap', ship: ship.id })).toBeNull();
    expect(g.ships.some((s) => s.id === ship.id)).toBe(false);
    expect(g.fleets.some((f) => f.id === fleet.id)).toBe(false);
    expect(upkeepOf(g, 'sta').total).toBe(before - SHIPS.frigate.upkeep);
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('not between the stars', () => {
    const g = five();
    const s = g.ships.find((x) => x.owner === 'sta');
    if (!s) throw new Error('a ship');
    s.at = null;
    expect(order(g, 'sta', { type: 'scrap', ship: s.id })).toBe(
      'It is between the stars: it can be broken up only at a star.',
    );
  });
});

describe('the rivals cut their costs (§26.3)', () => {
  it('in debt and losing, a warship beyond its wants first, else an idle civil ship; not when gaining', () => {
    const g = five('frontier');
    const wake = powerOf(g, 'hollow-wake');
    const d = makeDesign(g, wake, 'frigate', 'test', MODS);
    const many = Array.from({ length: 6 }, () => makeShip(g, 'hollow-wake', 'frigate', wake.capital, d.id));
    formFleet(g, 'hollow-wake', many);
    const scrapped = () => aiOrders(world, g, 'hollow-wake').filter((o) => o.type === 'scrap');
    expect(scrapped()).toEqual([]);
    wake.treasury = -50;
    expect(warshipsWanted(world, g, 'hollow-wake')).toBeLessThan(many.length);
    const first = scrapped();
    expect(first).toHaveLength(1);
    expect(many.some((s) => first[0]?.type === 'scrap' && s.id === first[0].ship)).toBe(true);
    // No warship to spare: an idle civil ship, the survey ships first (idle transports keep it losing).
    g.ships = g.ships.filter((s) => !many.includes(s));
    g.fleets = g.fleets.filter((f) => g.ships.some((s) => s.fleet === f.id));
    for (let i = 0; i < 12; i++) makeShip(g, 'hollow-wake', 'transport', wake.capital);
    const civil = scrapped()[0];
    const ship = g.ships.find((s) => civil?.type === 'scrap' && s.id === civil.ship);
    expect(ship?.owner).toBe('hollow-wake');
    expect(ship?.type).toBe('survey');
  });
});
