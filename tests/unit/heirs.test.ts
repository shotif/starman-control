import { describe, expect, it } from 'vitest';
import { FACTION_IDS, FACTIONS, type FactionId, PLACING_FACTIONS } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SPECIES } from '../../src/content/species.ts';
import { SKY } from '../../src/data/sky.ts';
import { aiOrders, PERSONALITIES } from '../../src/sim/ai.ts';
import { anomalyAt } from '../../src/sim/anomalies.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import { COPIES, capacityOf, foodOf, growthOf, industryOf } from '../../src/sim/economy.ts';
import { habitability } from '../../src/sim/habitability.ts';
import { keySites } from '../../src/sim/keys.ts';
import { excavate, placedSites, relicSites, siteAt, splitResearch } from '../../src/sim/relics.ts';
import { type GameState, makeHolding, newGame, powerOf } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { shapeProblems, stateProblems } from '../../src/sim/validate.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M5 increment 59 (M5_UNKNOWN.md §27, D-77): the machine heirs. */

const world = buildWorld(SKY);
const M = RULES.machines;
const HEIRS: FactionId = 'continuance';
const FORGE = 'gj-3306:forge';
const game = (factions: readonly FactionId[] = FACTION_IDS, seed = 42): GameState =>
  newGame(world, {
    seed,
    powers: factions.map((faction) => ({
      faction,
      controller: faction === 'sta' ? ('player' as const) : ('ai' as const),
    })),
  });
const capitalOf = (g: GameState, f: FactionId) => {
  const h = g.holdings.find((x) => x.owner === f && x.capital);
  if (!h) throw new Error('capital');
  return h;
};

describe('the Forge (§27.1)', () => {
  it('is at GJ 3306 in every game, an airless rocky world, and fiction', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const forge = bodiesOf(world, seed, 'gj-3306').find((b) => b.id === FORGE);
      expect(forge).toMatchObject({ name: 'The Forge', kind: 'rocky', atmosphere: 'none', water: 'none' });
      expect(forge?.facts.kind).toBe('fiction');
    }
    expect(FACTIONS[HEIRS].capital).toEqual({ systemId: 'gj-3306', bodyId: FORGE });
  });

  it('moves no relic site and no key; anomalies only leave the heirs’ capital', () => {
    expect(PLACING_FACTIONS.map((f) => f.id)).not.toContain(HEIRS);
    // As they were before the heirs (increment 58), for two seeds.
    expect(placedSites(world, 42).map((s) => s.system)).toEqual([
      '2mass-1114-2618',
      '40-eridani',
      'gj-367',
      'gj-4248',
      'gj-915',
      'kx-librae',
      'procyon',
      'scr-1845-6357',
      'sirius',
      'stein-2051',
      'wolf-1062',
      'xi-bootis',
    ]);
    expect(keySites(world, 42)).toEqual(['2mass-1114-2618', '40-eridani', 'gj-4248', 'kx-librae', 'sirius']);
    expect(keySites(world, 7)).toEqual([
      '1rxs-j115928-5-524717',
      '40-eridani',
      'scr-1845-6357',
      'sirius',
      'wise-1800-0134',
    ]);
    for (const seed of [7, 42]) expect(anomalyAt(seed, 'gj-3306')).toBeNull();
  });
});

describe('a machine species (§27.2)', () => {
  it('lives on any rocky world whatever its air or cold; heat, thick air, weight and oceans cost', () => {
    const forge = bodiesOf(world, 42, 'gj-3306').find((b) => b.id === FORGE);
    if (!forge) throw new Error('forge');
    expect(habitability(forge, SPECIES.heirs).level).toBe('comfortable');
    const costs = SPECIES.heirs.costs;
    expect(costs.temperature).toMatchObject({ frozen: 0, cold: 0, hot: 1, scorching: 2 });
    expect(costs.atmosphere).toMatchObject({ none: 0, thin: 0, dense: 1, toxic: 1 });
    expect(costs.gravity.high).toBe(1);
    expect(costs.water.oceans).toBe(1);
    expect(SPECIES.heirs.surfaces).not.toContain('gas-giant');
    expect(FACTIONS[HEIRS].species).toBe('heirs');
  });

  it('eats nothing, so is never hungry', () => {
    const g = game();
    const home = capitalOf(g, HEIRS);
    expect(foodOf(world, g, home).eaten).toBe(0);
    expect(foodOf(world, g, capitalOf(g, 'sta')).eaten).toBeGreaterThan(0);
  });

  it('grows by building copies: half its industry while it has room, a tenth for every 5', () => {
    const g = game();
    const home = capitalOf(g, HEIRS);
    expect(home.people).toBeLessThan(capacityOf(world, g, home));
    const industry = industryOf(world, g, home);
    const copies = industry.parts.find((p) => p.label === COPIES);
    const made = industry.total - (copies?.value ?? 0);
    expect(copies?.value).toBe(-Math.floor((made * M.copyPercent) / 100));
    expect(growthOf(world, g, home)).toBe(Math.max(1, Math.floor(-(copies?.value ?? 0) / M.industryPerTenth)));
    // No other power builds copies.
    expect(industryOf(world, g, capitalOf(g, 'sta')).parts.some((p) => p.label === COPIES)).toBe(false);
    // With no room, all of it goes to the queue, and it does not grow.
    home.people = capacityOf(world, g, home);
    expect(industryOf(world, g, home).parts.some((p) => p.label === COPIES)).toBe(false);
    expect(industryOf(world, g, home).total).toBe(made);
    expect(growthOf(world, g, home)).toBe(0);
  });

  it('a new machine colony grows by its copies too, and eats nothing', () => {
    const g = game();
    // The nearest free world they could live on, beyond the Forge.
    const body = world.systems
      .map((s) => s.id)
      .filter((s) => s !== 'gj-3306')
      .sort((a, b) => world.distanceDeci('gj-3306', a) - world.distanceDeci('gj-3306', b))
      .flatMap((s) => bodiesOf(world, g.seed, s))
      .find((b) => habitability(b, SPECIES.heirs).level === 'comfortable' && !g.holdings.some((h) => h.body === b.id));
    if (!body) throw new Error('a world for them');
    const h = makeHolding(g, {
      owner: HEIRS,
      kind: 'colony',
      system: body.systemId,
      body: body.id,
      capital: false,
      people: 10,
    });
    expect(capacityOf(world, g, h)).toBeGreaterThan(h.people);
    expect(industryOf(world, g, h).parts.some((p) => p.label === COPIES)).toBe(true);
    expect(growthOf(world, g, h)).toBeGreaterThanOrEqual(1);
    expect(foodOf(world, g, h).eaten).toBe(0);
  });
});

describe('the heirs of the Absent (§27.3)', () => {
  it('begin with Relic studies and the two relic sites nearest their capital surveyed', () => {
    const g = game();
    const heirs = powerOf(g, HEIRS);
    expect(heirs.researched).toContain('relic-studies');
    const near = placedSites(world, g.seed)
      .map((s) => s.system)
      .sort((a, b) => world.distanceDeci('gj-3306', a) - world.distanceDeci('gj-3306', b))
      .slice(0, 2);
    for (const s of near) expect(heirs.surveyed).toContain(s);
    expect(powerOf(g, 'sta').researched).not.toContain('relic-studies');
  });

  it('dig half again as fast', () => {
    const g = game();
    const heirs = powerOf(g, HEIRS);
    const site = relicSites(world, g.seed)
      .map((s) => s.system)
      .find((s) => heirs.surveyed.includes(s));
    if (!site) throw new Error('a known site');
    const body = bodiesOf(world, g.seed, site).find((b) => !g.holdings.some((h) => h.body === b.id));
    if (!body) throw new Error('a free body');
    makeHolding(g, { owner: HEIRS, kind: 'outpost', system: site, body: body.id, capital: false, people: 0 });
    excavate(g, HEIRS, site);
    const split = splitResearch(g, HEIRS, 100);
    const toDigs = 100 - split.rest;
    expect(split.digs).toEqual([{ system: site, points: Math.floor((toDigs * 150) / 100) }]);
  });

  it('are a rival with a character of their own, and refuse the arks', () => {
    const def = FACTIONS[HEIRS];
    expect(def.playable).toBe(false);
    expect(def.traits.map((t) => t.effect.kind)).toContain('dig-percent');
    expect(def.lawful).toBe(true);
    expect(PERSONALITIES[HEIRS].arks).toBe('refuse');
  });
});

describe('the Forge, a relic site of its own (§28.2)', () => {
  it('is a vault in every game besides the twelve, and holds no key', () => {
    for (const seed of [1, 7, 42]) {
      expect(siteAt(world, seed, 'gj-3306')).toEqual({ system: 'gj-3306', kind: 'vault' });
      expect(relicSites(world, seed)).toHaveLength(RULES.relics.sites + 1);
      expect(keySites(world, seed)).not.toContain('gj-3306');
    }
  });

  it('the heirs begin to excavate it on the first turn', () => {
    const g = game();
    expect(aiOrders(world, g, HEIRS)).toContainEqual({ type: 'excavate', system: 'gj-3306' });
  });
});

describe('in the game (§27.4)', () => {
  it('every new game with rivals has the Continuance; the human powers start as before', () => {
    const six = game();
    const five = game(FACTION_IDS.filter((f) => f !== HEIRS));
    expect(six.powers.map((p) => p.faction)).toContain(HEIRS);
    for (const f of ['sta', 'frontier', 'drift-moot'] as const) {
      const a = powerOf(six, f);
      const b = powerOf(five, f);
      expect(a.researched).toEqual(b.researched);
      expect(a.surveyed).toEqual(b.surveyed);
      expect(a.treasury).toBe(b.treasury);
      expect(capitalOf(six, f)).toEqual(capitalOf(five, f));
      expect(six.ships.filter((s) => s.owner === f).map((s) => s.type)).toEqual(
        five.ships.filter((s) => s.owner === f).map((s) => s.type),
      );
    }
    // The heirs' own lanes take none of anyone's.
    for (const l of five.lanes) expect(six.lanes.find((x) => x.id === l.id)).toEqual(l);
    expect(shapeProblems(six)).toEqual([]);
    expect(stateProblems(world, six)).toEqual([]);
  });

  it('a hundred turns with the Continuance as a rival keep the game sound, and it grows', () => {
    let g = game();
    const start = capitalOf(g, HEIRS).people;
    for (let t = 0; t < 100; t++) {
      g = resolveTurn(world, g).state;
      if (t % 25 === 24) expect(stateProblems(world, g)).toEqual([]);
    }
    expect(g.powers.find((p) => p.faction === HEIRS)).toBeDefined();
    const theirs = g.holdings.filter((h) => h.owner === HEIRS && h.kind === 'colony');
    expect(theirs.reduce((n, h) => n + h.people, 0)).toBeGreaterThan(start);
    for (const h of theirs) expect(h.hungry).toBe(0);
  }, 180_000);
});
