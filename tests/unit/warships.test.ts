import { describe, expect, it } from 'vitest';
import { ADVISORS, DEPARTMENTS } from '../../src/content/advisors.ts';
import { FACTION_IDS, type FactionId } from '../../src/content/factions.ts';
import { MODULE_IDS, MODULES } from '../../src/content/modules.ts';
import { HULLS, SHIPS } from '../../src/content/ships.ts';
import { TECH_IDS, TECHS, type TechId } from '../../src/content/techs.ts';
import { SKY } from '../../src/data/sky.ts';
import { aiOrders } from '../../src/sim/ai.ts';
import { buildable, designCost, designStats, refitCost, refreshYards, yardModules } from '../../src/sim/designs.ts';
import { buildOptions, costOf, queueRefusal, upkeepOf } from '../../src/sim/economy.ts';
import { applyOrder, type Order } from '../../src/sim/orders.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { type GameState, type Holding, makeShip, newGame, powerOf, STATE_VERSION } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M4 increment 41 (M4_FLEETS.md §21): warships, their designs and refits, and the Weapons field. */

const world = buildWorld(SKY);
const start = (faction: FactionId = 'sta') => newGame(world, { seed: 42, powers: [{ faction, controller: 'player' }] });
const capital = (g: GameState, f: FactionId = 'sta') => g.holdings.find((h) => h.owner === f && h.capital) as Holding;
const order = (g: GameState, o: Order, f: FactionId = 'sta') => {
  const r = applyOrder(world, g, f, o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const refused = (g: GameState, o: Order, f: FactionId = 'sta') => {
  const r = applyOrder(world, g, f, o);
  return r.ok ? null : r.reason;
};
const turn = (g: GameState) => resolveTurn(world, g).state;
const knowing = (g: GameState, ...techs: TechId[]) => {
  powerOf(g, 'sta').researched.push(...techs);
  return g;
};
/** A game where the capital can pay for anything at once. */
const rich = (g: GameState) => {
  const h = capital(g);
  h.industry = 2000;
  const p = powerOf(g, 'sta');
  p.stockpile = { metals: 2000, volatiles: 2000, fuel: 2000 };
  p.treasury = 2000;
  return g;
};

describe('the hulls and modules (§21.1, §21.2)', () => {
  it('are five hulls of 2 to 8 places, three needing a technology, with upkeep by size', () => {
    expect(HULLS.map((h) => SHIPS[h].hull?.places)).toEqual([2, 3, 4, 6, 8]);
    expect(HULLS.map((h) => SHIPS[h].upkeep)).toEqual([1, 1, 2, 3, 5]);
    expect(HULLS.map((h) => SHIPS[h].hull?.needs ?? null)).toEqual([
      null,
      null,
      'destroyer-hulls',
      'cruiser-hulls',
      'capital-hulls',
    ]);
    expect(SHIPS.survey.upkeep).toBe(1);
  });

  it('are 23 modules, four open from the start, every other opened by a Weapons technology', () => {
    expect(MODULE_IDS).toHaveLength(23);
    expect(MODULE_IDS.filter((m) => !MODULES[m].needs)).toEqual(['pulse-1', 'railgun-1', 'shield-1', 'armour-1']);
    for (const m of MODULE_IDS) {
      const needs = MODULES[m].needs;
      if (needs) expect(TECHS[needs].field, m).toBe('weapons');
    }
    // Every Weapons technology opens something.
    for (const id of TECH_IDS.filter((t) => TECHS[t].field === 'weapons'))
      expect(
        MODULE_IDS.some((m) => MODULES[m].needs === id) || HULLS.some((h) => SHIPS[h].hull?.needs === id),
        id,
      ).toBe(true);
  });

  it('the Weapons field is 18 technologies over five tiers, each with its inspiration', () => {
    const weapons = TECH_IDS.filter((t) => TECHS[t].field === 'weapons');
    expect(weapons).toHaveLength(18);
    expect(new Set(weapons.map((t) => TECHS[t].tier))).toEqual(new Set([1, 2, 3, 4, 5]));
    for (const t of weapons) expect(TECHS[t].inspiration.text.length).toBeGreaterThan(0);
  });
});

describe('the yard’s designs (§21.3)', () => {
  it('every power starts with a corvette and a frigate from what all know', () => {
    for (const f of FACTION_IDS.slice(0, 3)) {
      const g = start(f);
      const designs = powerOf(g, f).designs;
      expect(designs.map((d) => d.name)).toEqual(['Corvette Mark I', 'Frigate Mark I']);
      expect(designs[0]?.modules).toEqual(['pulse-1', 'shield-1']);
      expect(designs[1]?.modules).toEqual(['pulse-1', 'railgun-1', 'shield-1']);
      expect(designs.every((d) => d.yard && !d.retired && d.since === 1)).toBe(true);
    }
  });

  it('half the places weapons, the two strongest kinds alternating; a shield; then armour', () => {
    expect(yardModules([], 'corvette')).toEqual(['pulse-1', 'shield-1']);
    expect(yardModules(['destroyer-hulls'], 'destroyer')).toEqual(['pulse-1', 'railgun-1', 'shield-1', 'armour-1']);
    // Better guns take the place of worse; ion counts at half.
    const some: TechId[] = ['fire-control', 'pulse-cannons-2', 'deflector-fields', 'ion-disruptors', 'plasma-cannons'];
    expect(yardModules(some, 'frigate')).toEqual(['pulse-2', 'plasma-1', 'deflector-1']);
    // A capital ship: four guns, two shields, a targeting computer, armour.
    expect(yardModules(['fire-control', 'destroyer-hulls', 'cruiser-hulls', 'capital-hulls'], 'capital')).toEqual([
      'pulse-1',
      'railgun-1',
      'pulse-1',
      'railgun-1',
      'shield-1',
      'shield-1',
      'targeting',
      'armour-1',
    ]);
  });

  it('a better module or a new hull brings a new design as the turn ends, the old one retired', () => {
    let g = knowing(start(), 'destroyer-hulls');
    g = turn(g);
    let p = powerOf(g, 'sta');
    expect(buildable(p).map((d) => d.name)).toEqual(['Corvette Mark I', 'Frigate Mark I', 'Destroyer Mark I']);
    expect(g.reports[0]?.events).toContainEqual(
      expect.objectContaining({ kind: 'design-new', name: 'Destroyer Mark I', old: null }),
    );
    g = knowing(g, 'pulse-cannons-2');
    g = turn(g);
    p = powerOf(g, 'sta');
    expect(buildable(p).map((d) => d.name)).toEqual(['Corvette Mark II', 'Frigate Mark II', 'Destroyer Mark II']);
    expect(p.designs.find((d) => d.name === 'Frigate Mark I')?.retired).toBe(true);
    expect(g.reports[0]?.events).toContainEqual(
      expect.objectContaining({ kind: 'design-new', name: 'Frigate Mark II', old: 'Frigate Mark I' }),
    );
    // Nothing better, nothing new.
    expect(refreshYards(g, powerOf(g, 'sta'))).toEqual([]);
  });
});

describe('designs of one’s own (§21.3)', () => {
  it('a hull it knows, a name, and a module it knows in each place', () => {
    const g = start();
    const base: Order = {
      type: 'design',
      hull: 'frigate',
      name: 'Lancer',
      modules: ['railgun-1', 'railgun-1', 'armour-1'],
    };
    expect(refused(g, { ...base, hull: 'destroyer' } as Order)).toBe('The destroyer needs a technology first.');
    expect(refused(g, { ...base, name: '  ' } as Order)).toBe('Give the design a name.');
    expect(refused(g, { ...base, name: 'Frigate Mark I' } as Order)).toBe('A design of that name stands already.');
    expect(refused(g, { ...base, modules: ['railgun-1'] } as Order)).toBe(
      'A frigate has 3 places, each with a module.',
    );
    expect(refused(g, { ...base, modules: ['plasma-1', 'railgun-1', 'armour-1'] } as Order)).toBe(
      'Plasma cannon I needs a technology first.',
    );
    const after = order(g, base);
    const d = powerOf(after, 'sta').designs.at(-1);
    expect(d).toMatchObject({ name: 'Lancer', hull: 'frigate', yard: false, retired: false });
    expect(designStats(d as never)).toMatchObject({ attack: 10, shields: 0, structure: 28, upkeep: 1 });
    const retired = order(after, { type: 'retire-design', design: d?.id as number });
    expect(buildable(powerOf(retired, 'sta')).some((x) => x.name === 'Lancer')).toBe(false);
    expect(refused(retired, { type: 'retire-design', design: d?.id as number })).toBe('Lancer is retired already.');
  });
});

describe('building warships (§21.1)', () => {
  it('a design is queued at a shipyard, paid with its modules, and built to it', () => {
    let g = rich(start());
    const frigate = powerOf(g, 'sta').designs.find((d) => d.hull === 'frigate');
    if (!frigate) throw new Error('no frigate');
    const item = { kind: 'ship', ship: 'frigate', design: frigate.id } as const;
    expect(buildOptions(world, g, capital(g)).some((o) => o.item.kind === 'ship' && o.item.design === frigate.id)).toBe(
      true,
    );
    expect(queueRefusal(world, g, capital(g), { kind: 'ship', ship: 'frigate' })).toBe('Choose a design to build.');
    // 40 + 6 + 6 + 5 industry, 12 + 2 + 3 metals, 2 volatiles.
    expect(costOf(world, g, capital(g), item)).toEqual({ industry: 57, metals: 17, volatiles: 2, fuel: 0 });
    expect(designCost('frigate', frigate.modules)).toEqual({ industry: 57, metals: 17, volatiles: 2, fuel: 0 });
    g = order(g, { type: 'queue', holding: capital(g).id, item });
    const metals = powerOf(g, 'sta').stockpile.metals;
    g = turn(g);
    const ship = g.ships.find((s) => s.type === 'frigate');
    expect(ship?.design).toBe(frigate.id);
    expect(powerOf(g, 'sta').stockpile.metals).toBeLessThanOrEqual(metals - 17 + 10);
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('upkeep is by hull: a civil ship 1, a destroyer 2', () => {
    const g = knowing(start(), 'destroyer-hulls');
    refreshYards(g, powerOf(g, 'sta'));
    const before = upkeepOf(g, 'sta').total;
    const d = powerOf(g, 'sta').designs.find((x) => x.hull === 'destroyer');
    makeShip(g, 'sta', 'destroyer', 'sol', d?.id ?? null);
    expect(upkeepOf(g, 'sta').total).toBe(before + 2);
  });
});

describe('refits (§21.4)', () => {
  const armed = () => {
    let g = rich(start());
    const mk1 = powerOf(g, 'sta').designs.find((d) => d.hull === 'frigate');
    const ship = makeShip(g, 'sta', 'frigate', 'sol', mk1?.id ?? null);
    g = knowing(g, 'pulse-cannons-2');
    refreshYards(g, powerOf(g, 'sta'));
    const mk2 = buildable(powerOf(g, 'sta')).find((d) => d.hull === 'frigate');
    return { g, ship: ship.id, mk1: mk1?.id as number, mk2: mk2?.id as number };
  };

  it('costs the new modules less the old, never less than a tenth of the new', () => {
    const { g, mk1, mk2 } = armed();
    const p = powerOf(g, 'sta');
    const from = p.designs.find((d) => d.id === mk1);
    const to = p.designs.find((d) => d.id === mk2);
    if (!from || !to) throw new Error('no designs');
    // Pulse II for pulse I: 9 − 6 industry, 3 − 2 metals, 1 volatile.
    expect(refitCost(from, to)).toEqual({ industry: 3, metals: 1, volatiles: 1, fuel: 0 });
    // Back again: a tenth of the old design's modules.
    expect(refitCost(to, from)).toEqual({ industry: 2, metals: 1, volatiles: 1, fuel: 0 });
  });

  it('is queued at a shipyard where the ship is, and done as the turn ends', () => {
    let { g, ship, mk2 } = armed();
    const item = { kind: 'refit', ship, design: mk2 } as const;
    g = order(g, { type: 'queue', holding: capital(g).id, item });
    expect(refused(g, { type: 'queue', holding: capital(g).id, item })).toMatch(/queued for a refit already/);
    g = turn(g);
    expect(g.ships.find((s) => s.id === ship)?.design).toBe(mk2);
    expect(g.reports[0]?.events).toContainEqual(expect.objectContaining({ kind: 'refitted', ship, design: mk2 }));
  });

  it('is dropped unpaid if the ship has left', () => {
    let { g, ship, mk2 } = armed();
    g = order(g, { type: 'queue', holding: capital(g).id, item: { kind: 'refit', ship, design: mk2 } });
    const s = g.ships.find((x) => x.id === ship);
    if (s) s.at = 'alpha-centauri';
    const industry = capital(g).industry;
    g = turn(g);
    expect(g.reports[0]?.events).toContainEqual(expect.objectContaining({ kind: 'refit-dropped', ship }));
    expect(capital(g).industry).toBeGreaterThanOrEqual(Math.min(60, industry));
  });
});

describe('the rivals and the Admiral (§21.5, §21.6)', () => {
  it('a rival with no warships leaves the Weapons field to last', () => {
    const g = newGame(world, {
      seed: 42,
      powers: [
        { faction: 'sta', controller: 'player' },
        { faction: 'frontier', controller: 'ai' },
      ],
    });
    const p = powerOf(g, 'frontier');
    const seen: TechId[] = [];
    for (let i = 0; i < 20; i++) {
      const o = aiOrders(world, g, 'frontier').find((x) => x.type === 'research');
      if (o?.type !== 'research') break;
      seen.push(o.tech);
      p.researched.push(o.tech);
    }
    expect(seen.length).toBeGreaterThan(10);
    expect(seen.some((t) => TECHS[t].field === 'weapons')).toBe(false);
  });

  it('every power has an Admiral, the eighth department', () => {
    expect(DEPARTMENTS).toHaveLength(8);
    for (const f of FACTION_IDS) expect(ADVISORS[f].people.admiral.name.length).toBeGreaterThan(0);
  });
});

describe('state (§21.8)', () => {
  it('a save from version 15 gains the yard’s designs, and its ships none', () => {
    const g = start();
    const old = structuredClone(g) as unknown as Record<string, unknown>;
    old.version = 15;
    for (const p of old.powers as Record<string, unknown>[]) delete p.designs;
    for (const s of old.ships as Record<string, unknown>[]) delete s.design;
    const raw = { format: SAVE_FORMAT, version: 1, savedAt: '2026-10-22T00:00:00Z', game: old };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(powerOf(loaded, 'sta').designs.map((d) => d.name)).toEqual(['Corvette Mark I', 'Frigate Mark I']);
    expect(loaded.ships.every((s) => s.design === null)).toBe(true);
  });
});
