import { describe, expect, it } from 'vitest';
import { FACTION_IDS, FACTIONS, type FactionId, PLAYABLE_IDS } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SPECIES } from '../../src/content/species.ts';
import { SKY } from '../../src/data/sky.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import { sharesTongue } from '../../src/sim/contact.ts';
import { habitability } from '../../src/sim/habitability.ts';
import { homeWebs } from '../../src/sim/homeWeb.ts';
import { fadeMemories } from '../../src/sim/memory.ts';
import { applyOrder } from '../../src/sim/orders.ts';
import { type GameState, newGame, powerOf } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { buildWorld, laneEnds } from '../../src/sim/world.ts';

/** The Duskfolk and the Dusk Concord (M3_NEIGHBOURS.md §24). */

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

describe('the worlds they live on (§24.3)', () => {
  it('a locked world costs them nothing for its sky or its flares; an open sky costs 2', () => {
    const dusk = SPECIES.duskfolk;
    // GJ 433 d, their home: cold, thin air, ice, locked.
    const home = body('gj-433', 'gj-433-d');
    expect(home.locked).toBe(true);
    expect(habitability(home, dusk).level).toBe('comfortable');
    expect(habitability(home, SPECIES.human).level).not.toBe('comfortable');
    // Earth: an open sky, tolerable for them, comfortable for humans.
    const earth = body('sol', 'earth');
    expect(earth.locked).toBe(false);
    expect(habitability(earth, dusk)).toMatchObject({ level: 'tolerable', total: 2 });
    expect(habitability(earth, dusk).reasons).toContainEqual({ condition: 'open', value: 'open sky', cost: 2 });
    expect(habitability(earth, SPECIES.human).reasons.some((r) => r.condition === 'open')).toBe(false);
    // Proxima b: locked and flare-exposed, a flare costs humans 1 and them nothing.
    const proxima = body('alpha-centauri', 'proxima-cen-b');
    expect(proxima.flareExposed).toBe(true);
    expect(habitability(proxima, dusk).reasons.some((r) => r.condition === 'flare')).toBe(false);
    expect(habitability(proxima, SPECIES.human).reasons).toContainEqual({
      condition: 'flare',
      value: 'flare-exposed',
      cost: 1,
    });
  });

  it('the red dwarfs’ locked worlds suit them better than humans', () => {
    let better = 0;
    let worse = 0;
    const rank = { comfortable: 0, tolerable: 1, harsh: 2, uninhabitable: 3 } as const;
    for (const s of world.systems.slice(0, 120))
      for (const b of bodiesOf(world, 42, s.id)) {
        if (!b.locked) continue;
        const d = rank[habitability(b, SPECIES.duskfolk).level];
        const h = rank[habitability(b, SPECIES.human).level];
        if (d < h) better++;
        if (d > h) worse++;
      }
    expect(better).toBeGreaterThan(worse * 5);
  });
});

describe('their home web, of their own lanes (§24.4)', () => {
  const capitals = FACTION_IDS.map((f) => ({ faction: f, capital: FACTIONS[f].capital.systemId }));
  const webs = homeWebs(world, capitals);
  const concord = webs.find((w) => w.faction === 'dusk-concord');

  it('six systems within two links of up to 6 ly, five lanes from the capital, none of Reborn’s', () => {
    expect(concord?.systems).toEqual([
      'gj-433',
      '20-crateris',
      'wise-1141-3326',
      'sips-1141-3624',
      'vb-5',
      'wise-1112-3857',
    ]);
    expect(concord?.lanes).toHaveLength(5);
    for (const id of concord?.lanes ?? []) {
      const [a, b] = laneEnds(id);
      expect(world.catalogueLane(a, b), id).toBeUndefined();
      expect(world.distanceDeci(a, b), id).toBeLessThanOrEqual(RULES.lanes.reachDeci);
      expect([a, b]).toContain('gj-433');
    }
  });

  it('leaves every human web as it was, seven systems each', () => {
    const before = homeWebs(
      world,
      capitals.filter((c) => world.catalogueAt(c.capital).length > 0),
    );
    for (const w of before) {
      expect(webs.find((x) => x.faction === w.faction)?.systems).toEqual(w.systems);
      expect(w.systems).toHaveLength(RULES.homeWeb.systems);
    }
  });
});

describe('the Concord in the game (§24.5 to §24.8)', () => {
  it('a new game offers the three human powers and the Concord (M6_ONE.md §24); as a rival it starts at GJ 433', () => {
    expect(PLAYABLE_IDS).toEqual(['sta', 'frontier', 'hollow-wake', 'dusk-concord']);
    const g = every();
    expect(g.powers.map((p) => p.faction)).toContain('dusk-concord');
    expect(g.holdings.find((h) => h.owner === 'dusk-concord')).toMatchObject({
      capital: true,
      system: 'gj-433',
      body: 'gj-433-d',
    });
    expect(g.lanes.filter((l) => l.owner === 'dusk-concord')).toHaveLength(5);
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('shares no tongue with humans, and is no kin to them', () => {
    expect(sharesTongue('sta', 'dusk-concord')).toBe(false);
    expect(sharesTongue('sta', 'hollow-wake')).toBe(true);
  });

  it('forgets slowly: a point every 8 turns, where humans forget one every 4', () => {
    const g: GameState = every();
    for (const f of ['sta', 'dusk-concord'] as const)
      powerOf(g, f).memories.push({ faction: 'hollow-wake', kind: 'treaty-broken', amount: -10, turn: 1 });
    for (const turn of [5, 9]) {
      g.turn = turn;
      fadeMemories(g);
    }
    expect(powerOf(g, 'sta').memories[0]?.amount).toBe(-8);
    expect(powerOf(g, 'dusk-concord').memories[0]?.amount).toBe(-9);
  });

  it('remembers a gift at 1 for every 8 credits', () => {
    let g = every();
    powerOf(g, 'sta').contacts.push({ faction: 'dusk-concord', stage: 'talk', since: 1, words: 20 });
    powerOf(g, 'dusk-concord').contacts.push({ faction: 'sta', stage: 'talk', since: 1, words: 20 });
    const r = applyOrder(world, g, 'sta', { type: 'gift', to: 'dusk-concord', credits: 50 });
    if (!r.ok) throw new Error(r.reason);
    g = resolveTurn(world, r.state).state;
    expect(powerOf(g, 'dusk-concord').memories).toContainEqual(
      expect.objectContaining({ faction: 'sta', kind: 'gift', amount: 6 }),
    );
  });

  it('plays 100 turns as a rival with the others, and the game stays sound', () => {
    let g = newGame(world, {
      seed: 42,
      powers: FACTION_IDS.map((faction) => ({ faction, controller: 'ai' as const })),
    });
    for (let t = 0; t < 100; t++) g = resolveTurn(world, g).state;
    expect(stateProblems(world, g)).toEqual([]);
    const concord = g.holdings.filter((h) => h.owner === 'dusk-concord');
    expect(concord.length).toBeGreaterThan(1);
    expect(powerOf(g, 'dusk-concord').researched.length).toBeGreaterThan(5);
  }, 180_000);
});
