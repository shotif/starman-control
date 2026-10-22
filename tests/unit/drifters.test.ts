import { describe, expect, it } from 'vitest';
import { FACTION_IDS, FACTIONS, type FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SPECIES } from '../../src/content/species.ts';
import { SKY } from '../../src/data/sky.ts';
import { dealings } from '../../src/sim/ai.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import { sharesTongue } from '../../src/sim/contact.ts';
import { habitability } from '../../src/sim/habitability.ts';
import { homeWebs } from '../../src/sim/homeWeb.ts';
import { attitudeOf, fadeMemories } from '../../src/sim/memory.ts';
import { type GameState, newGame, powerOf } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { buildWorld, laneEnds } from '../../src/sim/world.ts';

/** The Drifters and the Drift Moot (M3_NEIGHBOURS.md §25). */

const world = buildWorld(SKY);
const body = (system: string, id: string) => {
  const b = bodiesOf(world, 42, system).find((x) => x.id === id);
  if (!b) throw new Error(`no ${id}`);
  return b;
};
const every = (player: FactionId = 'sta') =>
  newGame(world, {
    seed: 42,
    powers: FACTION_IDS.map((faction) => ({
      faction,
      controller: faction === player ? ('player' as const) : ('ai' as const),
    })),
  });
/** Every pair of powers at talk, from turn 1. */
const allMet = (g: GameState) => {
  for (const p of g.powers)
    for (const q of g.powers)
      if (p !== q && !p.contacts.some((c) => c.faction === q.faction))
        p.contacts.push({ faction: q.faction, stage: 'talk', since: 1, words: RULES.contact.wordsToTalk });
  return g;
};

describe('the worlds they live on (§25.3)', () => {
  it('giants only: their home is comfortable, Earth impossible; humans can only hold an outpost on a giant', () => {
    const drifters = SPECIES.drifters;
    const home = body('hd-192310', 'hd-192310-c');
    expect(home.kind).toBe('ice-giant');
    expect(habitability(home, drifters).level).toBe('comfortable');
    expect(habitability(home, SPECIES.human).level).toBe('uninhabitable');
    const earth = body('sol', 'earth');
    expect(habitability(earth, drifters)).toMatchObject({ level: 'uninhabitable' });
    expect(habitability(earth, drifters).reasons).toContainEqual({ condition: 'surface', value: 'rocky', cost: null });
    // Jupiter: frozen at the top of its clouds, so tolerable.
    const jupiter = bodiesOf(world, 42, 'sol').find((b) => b.kind === 'gas-giant');
    expect(jupiter && habitability(jupiter, drifters).level).toBe('tolerable');
  });
});

describe('their home web (§25.4)', () => {
  it('five systems of its own lanes round HD 192310, AU Microscopii among them; no other web changes', () => {
    const capitals = FACTION_IDS.map((f) => ({ faction: f, capital: FACTIONS[f].capital.systemId }));
    const webs = homeWebs(world, capitals);
    const moot = webs.find((w) => w.faction === 'drift-moot');
    expect(moot?.systems).toHaveLength(5);
    expect(moot?.systems[0]).toBe('hd-192310');
    expect(moot?.systems).toContain('au-mic');
    expect(moot?.lanes).toHaveLength(4);
    for (const id of moot?.lanes ?? []) expect(world.catalogueLane(...laneEnds(id)), id).toBeUndefined();
    const without = homeWebs(
      world,
      capitals.filter((c) => c.faction !== 'drift-moot'),
    );
    for (const w of without) expect(webs.find((x) => x.faction === w.faction)?.systems).toEqual(w.systems);
  });
});

describe('the Moot in the game (§25.5 to §25.7)', () => {
  it('holds its capital on HD 192310 c, shares no tongue, and forgets a point every 6 turns', () => {
    const g = every();
    expect(g.holdings.find((h) => h.owner === 'drift-moot')).toMatchObject({
      capital: true,
      system: 'hd-192310',
      body: 'hd-192310-c',
    });
    expect(stateProblems(world, g)).toEqual([]);
    expect(sharesTongue('drift-moot', 'sta')).toBe(false);
    expect(sharesTongue('drift-moot', 'dusk-concord')).toBe(false);
    powerOf(g, 'drift-moot').memories.push({ faction: 'sta', kind: 'treaty-broken', amount: -10, turn: 1 });
    for (const turn of [7, 13]) {
      g.turn = turn;
      fadeMemories(g);
    }
    expect(powerOf(g, 'drift-moot').memories[0]?.amount).toBe(-8);
  });

  it('thinks less of the Wake for selling its lanes, and wants trade with anyone it knows', () => {
    const g = allMet(every());
    expect(attitudeOf(world, g, 'drift-moot', 'hollow-wake').parts).toContainEqual({
      kind: 'character',
      reason: 'Sells the lanes that should be open',
      amount: -10,
    });
    expect(FACTIONS['drift-moot'].asks.trade).toBe(-10);
    expect(FACTIONS['drift-moot'].asks.protection).toBe(-10);
  });

  it('a broker offers 20 of its surplus for 40 credits, to the power that regards it best', () => {
    const g = allMet(every());
    for (const p of g.powers) {
      p.treasury = 200;
      p.stockpile = { metals: 100, volatiles: 100, fuel: 100 };
    }
    const index = g.powers.findIndex((p) => p.faction === 'drift-moot');
    g.turn = 5 - index + 5; // its turn to deal
    const offers = () => dealings(world, g, 'drift-moot').filter((o) => o.type === 'offer' && o.treaty === 'exchange');
    expect(offers()).toEqual([]);
    powerOf(g, 'drift-moot').stockpile.fuel = 200;
    const [offer] = offers();
    expect(offer).toMatchObject({
      type: 'offer',
      treaty: 'exchange',
      give: { resource: 'fuel', amount: 20 },
      get: { resource: 'credits', amount: 40 },
    });
    // The Duskfolk are no broker: a surplus is kept.
    powerOf(g, 'dusk-concord').stockpile.fuel = 200;
    g.turn = 5 - g.powers.findIndex((p) => p.faction === 'dusk-concord') + 5;
    expect(dealings(world, g, 'dusk-concord').filter((o) => o.type === 'offer' && o.treaty === 'exchange')).toEqual([]);
  });

  it('five powers play 100 turns as rivals, and the game stays sound', () => {
    let g = newGame(world, {
      seed: 42,
      powers: FACTION_IDS.map((faction) => ({ faction, controller: 'ai' as const })),
    });
    for (let t = 0; t < 100; t++) g = resolveTurn(world, g).state;
    expect(stateProblems(world, g)).toEqual([]);
    const moot = g.holdings.filter((h) => h.owner === 'drift-moot');
    expect(moot.filter((h) => h.kind === 'colony').length).toBeGreaterThan(1);
    expect(powerOf(g, 'drift-moot').researched.length).toBeGreaterThan(5);
  }, 240_000);
});
