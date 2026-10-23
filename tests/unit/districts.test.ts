import { describe, expect, it } from 'vitest';
import type { Zone } from '../../src/content/districts.ts';
import { FACTION_IDS, type FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import {
  approvalOf,
  capacityOf,
  creditsOf,
  districtCount,
  foodOf,
  freeSlot,
  growthOf,
  idleMillions,
  industryOf,
  networksOf,
  overdriveOf,
  researchOf,
  treasuryOf,
  unworkedDistricts,
  upkeepOf,
  workedSlots,
  zoneRefusal,
} from '../../src/sim/economy.ts';
import { needsOf } from '../../src/sim/needs.ts';
import { applyOrder, type Order, refuse } from '../../src/sim/orders.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { type GameState, type Holding, makeHolding, newGame, powerOf, STATE_VERSION } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M2 increment 20 (M2_WORLDS.md §2 to §5): districts, food, credits and approval. */

const world = buildWorld(SKY);
const start = (faction: FactionId = 'sta') => newGame(world, { seed: 42, powers: [{ faction, controller: 'player' }] });
const capital = (g: GameState, faction: FactionId = 'sta') =>
  g.holdings.find((h) => h.owner === faction && h.capital) as Holding;
const holding = (g: GameState, id: number) => g.holdings.find((h) => h.id === id) as Holding;
const order = (g: GameState, o: Order) => {
  const r = applyOrder(world, g, 'sta', o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const why = (g: GameState, o: Order) => refuse(world, g, 'sta', o);
const turn = (g: GameState) => resolveTurn(world, g);
/** A colony of the Authority's on a world, zoned slot by slot as given. */
const colony = (g: GameState, system: string, body: string, people: number, zones: Zone[] = []) =>
  makeHolding(g, {
    owner: 'sta',
    kind: 'colony',
    system,
    body,
    capital: false,
    people,
    districts: zones.map((zone, i) => ({ zone, slot: i + 1 })),
  });

describe('districts (§2)', () => {
  it('number a world’s size, ten at a capital and none at an outpost', () => {
    const g = start();
    expect(districtCount(world, g, capital(g))).toBe(10);
    // Proxima Centauri b is size 7 and tolerable; Mars size 4 and harsh.
    expect(districtCount(world, g, colony(g, 'alpha-centauri', 'proxima-cen-b', 10))).toBe(7);
    expect(districtCount(world, g, colony(g, 'sol', 'mars', 10))).toBe(4);
    const outpost = makeHolding(g, {
      owner: 'sta',
      kind: 'outpost',
      system: 'sol',
      body: 'europa',
      capital: false,
      people: 0,
    });
    expect(districtCount(world, g, outpost)).toBe(0);
    expect(zoneRefusal(world, g, outpost, 'works', 1)).toBe('Outposts have no districts.');
  });

  it('start the same at every capital, its eight working districts worked, close to M1’s start', () => {
    for (const f of FACTION_IDS) {
      const g = start(f);
      const c = capital(g, f);
      expect(c.districts.map((d) => d.zone)).toEqual(RULES.districts.capitalStart);
      expect(workedSlots(c).size).toBe(8);
      expect(idleMillions(c)).toBe(2);
      // Machines eat nothing (M5_UNKNOWN.md §27.2).
      expect(foodOf(world, g, c)).toEqual({
        made: { total: 6, parts: [{ label: 'from 2 farms', value: 6 }] },
        eaten: f === 'continuance' ? 0 : 5,
      });
      // 2 from its lab, 2 from its 2 scholars and 3 of its own (M2B_SCIENCE.md §16).
      expect(researchOf(world, g, f).total).toBe(7);
      expect(creditsOf(world, g, c)).toEqual({
        total: 8,
        parts: [
          { label: 'standard taxes', value: 5 },
          { label: 'from 1 market', value: 3 },
        ],
      });
      // Four ships, a shipyard (2) and a lane station (1).
      expect(upkeepOf(g, f)).toEqual({
        total: 7,
        parts: [
          { label: 'ships', value: 4 },
          { label: 'projects', value: 3 },
        ],
      });
      // 70 on Earth; 65 under the domes of a harsh capital.
      expect(approvalOf(world, g, c).level).toBe('content');
    }
    expect(approvalOf(world, start(), capital(start())).total).toBe(70);
  });

  it('are zoned through the queue for 20 industry and 5 metals, and rezoned the same way', () => {
    let g = start();
    const c = colony(g, 'alpha-centauri', 'proxima-cen-b', 30, ['farms', 'works']);
    expect(freeSlot(world, g, c)).toBe(3);
    g = order(g, { type: 'queue', holding: c.id, item: { kind: 'zone', zone: 'labs', slot: 3 } });
    expect(why(g, { type: 'queue', holding: c.id, item: { kind: 'zone', zone: 'works', slot: 3 } })).toBe(
      'That district is already being zoned.',
    );
    expect(freeSlot(world, g, holding(g, c.id))).toBe(4);
    // Its own 2 and its works' 3 a turn: 20 in four turns.
    expect(industryOf(world, g, holding(g, c.id)).total).toBe(5);
    const metals = powerOf(g, 'sta').stockpile.metals;
    for (let i = 0; i < 3; i++) g = turn(g).state;
    expect(holding(g, c.id).districts).toHaveLength(2);
    const r = turn(g);
    expect(r.reports[0]?.events).toContainEqual({
      kind: 'zoned',
      holding: c.id,
      zone: 'labs',
      slot: 3,
      rezoned: false,
    });
    expect(holding(r.state, c.id).districts.at(-1)).toEqual({ zone: 'labs', slot: 3 });
    // Four turns of the capital's 4 metals and the colony's mine-less 0, less the 5 zoning took.
    expect(powerOf(r.state, 'sta').stockpile.metals).toBe(metals + 4 * 4 - 5);
    // Rezoning the farms as works is the same item, and says so.
    g = order(r.state, { type: 'queue', holding: c.id, item: { kind: 'zone', zone: 'works', slot: 1 } });
    for (let i = 0; i < 6 && holding(g, c.id).queue.length > 0; i++) {
      const t = turn(g);
      const zoned = t.reports[0]?.events.find((e) => e.kind === 'zoned');
      if (zoned) expect(zoned).toMatchObject({ zone: 'works', slot: 1, rezoned: true });
      g = t.state;
    }
    expect(holding(g, c.id).districts.map((d) => d.zone)).toEqual(['works', 'works', 'labs']);
  });

  it('refuse what cannot be: mines with no riches, a slot past the land, the zone it has', () => {
    const g = start();
    const moon = colony(g, 'sol', 'moon', 10);
    expect(zoneRefusal(world, g, moon, 'mines', 1)).toBe('Its world has no riches to mine.');
    expect(zoneRefusal(world, g, moon, 'works', 3)).toBe('There is no such district.');
    expect(zoneRefusal(world, g, moon, 'works', 0)).toBe('There is no such district.');
    expect(zoneRefusal(world, g, capital(g), 'farms', 3)).toBe('It is already zoned for farms.');
    expect(zoneRefusal(world, g, capital(g), 'labs', 3)).toBeNull();
  });

  it('are cleared at once for nothing, and the first worked can be chosen', () => {
    let g = start();
    const c = colony(g, 'alpha-centauri', 'proxima-cen-b', 15, ['farms', 'works', 'labs']);
    expect([...workedSlots(c)]).toEqual([1]);
    g = order(g, { type: 'work-first', holding: c.id, slot: 3 });
    expect([...workedSlots(holding(g, c.id))]).toEqual([3]);
    g = order(g, { type: 'clear-district', holding: c.id, slot: 2 });
    expect(holding(g, c.id).districts.map((d) => d.slot)).toEqual([3, 1]);
    expect(why(g, { type: 'clear-district', holding: c.id, slot: 2 })).toBe('That district is open.');
  });

  it('are worked by a million each; housing needs no one and adds room for 2 million', () => {
    const g = start();
    const c = colony(g, 'alpha-centauri', 'proxima-cen-b', 25, ['farms', 'works', 'labs', 'housing']);
    expect([...workedSlots(c)]).toEqual([1, 2]);
    expect(unworkedDistricts(c)).toBe(1);
    expect(capacityOf(world, g, c)).toBe(70 + 20);
    // While it can grow into them, districts no one works do not need you; once it is full, they do.
    expect(needsOf(world, g, 'sta').some((n) => n.kind === 'unworked')).toBe(false);
    const mars = colony(g, 'sol', 'mars', 20, ['farms', 'works', 'labs', 'market']);
    expect(needsOf(world, g, 'sta')).toContainEqual({
      kind: 'unworked',
      holding: mars.id,
      system: 'sol',
      districts: 2,
    });
  });

  it('come with a new colony: farms, then works, and it makes 2 industry of its own (D-42)', () => {
    let g = start();
    const ship = g.ships.find((s) => s.type === 'colony');
    if (!ship) throw new Error('no colony ship');
    ship.at = 'alpha-centauri';
    powerOf(g, 'sta').surveyed.push('alpha-centauri');
    g = order(g, { type: 'colonise', ship: ship.id, body: 'proxima-cen-b' });
    g = turn(g).state;
    const c = g.holdings.find((h) => h.body === 'proxima-cen-b') as Holding;
    expect(c.districts).toEqual([
      { zone: 'farms', slot: 1 },
      { zone: 'works', slot: 2 },
    ]);
    // Its first million works its farms; its own 2 industry pays for zoning.
    expect(foodOf(world, g, c).made.total).toBe(2);
    expect(industryOf(world, g, c)).toEqual({ total: 2, parts: [{ label: 'its own', value: 2 }] });
  });
});

describe('food (§3)', () => {
  it('is eaten, 1 for every 2 million rounded up, and shared along the power’s lanes', () => {
    const g = start();
    const c = colony(g, 'alpha-centauri', 'proxima-cen-b', 15, ['farms']);
    expect(foodOf(world, g, c).eaten).toBe(1);
    expect(foodOf(world, g, { ...c, people: 25 }).eaten).toBe(2);
    // Proxima Centauri is a lane from Sol: one network; Epsilon Eridani has no lane of the Authority's.
    const far = colony(g, 'epsilon-eridani', 'eps-eri-b', 10, ['works']);
    const nets = networksOf(world, g, 'sta');
    expect(nets.map((n) => [n.home, n.colonies.map((h) => h.id)])).toEqual([
      [true, [capital(g).id, c.id]],
      [false, [far.id]],
    ]);
  });

  it('keeps a store of 5 for each colony in the capital’s network', () => {
    const g = start();
    expect(powerOf(g, 'sta').food).toBe(5);
    // The capital's surplus of 1 is more than the store has room for.
    expect(powerOf(turn(g).state, 'sta').food).toBe(5);
    // With a second colony on its lanes, it holds up to 10.
    colony(g, 'alpha-centauri', 'proxima-cen-b', 10, ['farms']);
    expect(powerOf(turn(g).state, 'sta').food).toBe(5 + 1 + 2 - 1);
  });

  it('leaves a network hungry when its store runs out: it stops growing, and after three turns starves', () => {
    let g = start();
    // The capital's farms rezoned as works: it makes no food and eats 5.
    for (const d of capital(g).districts) if (d.zone === 'farms') d.zone = 'works';
    g = turn(g).state; // 5 − 5: empty; 10.1 million now eat 6
    expect(needsOf(world, g, 'sta')).toContainEqual({
      kind: 'food',
      holding: capital(g).id,
      system: 'sol',
      turns: 1,
      home: true,
    });
    expect(capital(g).hungry).toBe(0);
    const r = turn(g); // 5 − 6: hungry
    expect(r.reports[0]?.events).toContainEqual({ kind: 'hungry', holding: capital(g).id });
    g = r.state;
    const people = capital(g).people;
    expect(growthOf(world, g, capital(g))).toBe(0);
    expect(approvalOf(world, g, capital(g)).parts).toContainEqual({ label: 'hungry', value: -15 });
    expect(needsOf(world, g, 'sta')).toContainEqual({
      kind: 'food',
      holding: capital(g).id,
      system: 'sol',
      turns: 0,
      home: true,
    });
    g = turn(turn(g).state).state;
    expect(capital(g).people).toBe(people);
    g = turn(g).state;
    expect(capital(g).hungry).toBe(4);
    expect(capital(g).people).toBe(people - 1);
  });

  it('feeds a colony with no lane to the capital from its own farms', () => {
    let g = start();
    const far = colony(g, 'epsilon-eridani', 'eps-eri-b', 10, ['works']);
    g = turn(g).state;
    expect(holding(g, far.id).hungry).toBe(1);
    expect(capital(g).hungry).toBe(0);
  });
});

describe('credits (§4)', () => {
  it('come from taxes, by the rate, and from markets; upkeep is paid every turn', () => {
    let g = start();
    expect(treasuryOf(world, g, 'sta')).toEqual({
      total: 1,
      parts: [
        { label: 'taxes and markets', value: 8 },
        { label: 'upkeep', value: -7 },
      ],
    });
    expect(powerOf(turn(g).state, 'sta').treasury).toBe(51);
    g = order(g, { type: 'taxes', rate: 'low' });
    expect(creditsOf(world, g, capital(g)).total).toBe(2 + 3);
    expect(approvalOf(world, g, capital(g)).total).toBe(80);
    g = order(g, { type: 'taxes', rate: 'high' });
    expect(creditsOf(world, g, capital(g)).total).toBe(10 + 3);
    expect(approvalOf(world, g, capital(g))).toMatchObject({ total: 55, level: 'uneasy' });
    // A market where there is no lane station makes 2.
    const c = colony(g, 'alpha-centauri', 'proxima-cen-b', 10, ['market']);
    expect(creditsOf(world, g, c).parts).toContainEqual({ label: 'from 1 market', value: 2 });
  });

  it('fall into debt, which costs every colony approval, and is warned of first', () => {
    let g = start();
    g = order(g, { type: 'taxes', rate: 'low' }); // 5 in, 7 out: −2 a turn
    powerOf(g, 'sta').treasury = 3;
    expect(needsOf(world, g, 'sta')).toContainEqual({ kind: 'debt', turns: 2 });
    g = turn(g).state;
    expect(powerOf(g, 'sta').treasury).toBe(1);
    const r = turn(g);
    expect(powerOf(r.state, 'sta').treasury).toBe(-1);
    expect(r.reports[0]?.events).toContainEqual({ kind: 'debt' });
    expect(needsOf(world, r.state, 'sta')).toContainEqual({ kind: 'debt', turns: 0 });
    expect(approvalOf(world, r.state, capital(r.state)).parts).toContainEqual({
      label: 'the treasury in debt',
      value: -10,
    });
  });
});

describe('overdrive (§4)', () => {
  it('buys a quarter of a colony’s industry a step, at 1, 2 and 4 credits apiece', () => {
    expect([0, 1, 2, 3].map((n) => overdriveOf(12, n))).toEqual([
      { industry: 0, credits: 0 },
      { industry: 3, credits: 3 },
      { industry: 6, credits: 9 },
      { industry: 9, credits: 21 },
    ]);
    let g = start();
    g = order(g, { type: 'overdrive', holding: capital(g).id, steps: 2 });
    expect(industryOf(world, g, capital(g)).parts.at(-1)).toEqual({ label: 'bought for 9 credits', value: 6 });
    expect(industryOf(world, g, capital(g)).total).toBe(18);
    expect(treasuryOf(world, g, 'sta').total).toBe(1 - 9);
    const r = turn(g);
    expect(capital(r.state).industry).toBe(18);
    expect(powerOf(r.state, 'sta').treasury).toBe(50 - 9 + 1);
  });

  it('is refused with an empty treasury, and steps down or stops when the treasury cannot pay', () => {
    let g = start();
    powerOf(g, 'sta').treasury = 0;
    expect(why(g, { type: 'overdrive', holding: capital(g).id, steps: 1 })).toBe(
      'The treasury has nothing to pay for it.',
    );
    powerOf(g, 'sta').treasury = 5;
    g = order(g, { type: 'overdrive', holding: capital(g).id, steps: 3 });
    g = turn(g).state; // 21 is more than 5: one step, for 3
    expect(capital(g).overdrive).toBe(1);
    expect(powerOf(g, 'sta').treasury).toBe(5 - 3 + 1);
    powerOf(g, 'sta').treasury = 2;
    const r = turn(g);
    expect(capital(r.state).overdrive).toBe(0);
    expect(r.reports[0]?.events).toContainEqual({ kind: 'overdrive-stopped', holding: capital(g).id });
  });
});

describe('approval (§5)', () => {
  it('shows its parts, and its level scales what the districts yield, rounded', () => {
    const g = start();
    // Mars: full at 2 million (−5), under domes (−5): 50, uneasy, so its works keep 90%.
    const mars = colony(g, 'sol', 'mars', 20, ['works', 'works']);
    expect(approvalOf(world, g, mars)).toEqual({
      total: 50,
      level: 'uneasy',
      parts: [
        { label: 'to begin with', value: 60 },
        { label: 'full', value: -5 },
        { label: 'life under domes', value: -5 },
      ],
    });
    expect(industryOf(world, g, mars)).toEqual({
      total: 7,
      parts: [
        { label: 'from 2 works', value: 6 },
        { label: 'uneasy (90%)', value: -1 },
        { label: 'its own', value: 2 },
      ],
    });
  });

  it('stops growth at unrest; in revolt a colony makes nothing and its queue waits', () => {
    let g = start();
    const c = colony(g, 'alpha-centauri', 'proxima-cen-b', 30, ['works', 'farms']);
    g = order(g, { type: 'taxes', rate: 'high' });
    powerOf(g, 'sta').treasury = -1;
    // 60, high taxes −15, debt −10: 35.
    expect(approvalOf(world, g, holding(g, c.id))).toMatchObject({ total: 35, level: 'unrest' });
    expect(growthOf(world, g, holding(g, c.id))).toBe(0);
    // Full (−5) and hungry (−15) too: 15.
    holding(g, c.id).people = 70;
    holding(g, c.id).hungry = 1;
    expect(approvalOf(world, g, holding(g, c.id))).toMatchObject({ total: 15, level: 'revolt' });
    expect(industryOf(world, g, holding(g, c.id))).toEqual({ total: 0, parts: [{ label: 'in revolt', value: 0 }] });
    expect(needsOf(world, g, 'sta')).toContainEqual({
      kind: 'unrest',
      holding: c.id,
      system: 'alpha-centauri',
      revolt: true,
    });
    holding(g, c.id).industry = 5;
    g = order(g, { type: 'queue', holding: c.id, item: { kind: 'zone', zone: 'labs', slot: 3 } });
    expect(holding(turn(g).state, c.id).industry).toBe(5);
  });

  it('never counts idle people, who make nothing (D-43)', () => {
    const g = start();
    const c = colony(g, 'alpha-centauri', 'proxima-cen-b', 30, ['farms']);
    expect(idleMillions(c)).toBe(2);
    expect(approvalOf(world, g, c)).toMatchObject({ total: 60, parts: [{ label: 'to begin with', value: 60 }] });
  });

  it('is lower with no lane to the capital', () => {
    const g = start();
    const far = colony(g, 'epsilon-eridani', 'eps-eri-b', 10, ['farms']);
    expect(approvalOf(world, g, far).parts).toContainEqual({ label: 'no lane to the capital', value: -12 });
  });
});

describe('a save from before M2 (state version 6)', () => {
  it('zones each capital as every capital starts, and other colonies for their people', () => {
    const g = start();
    const c = colony(g, 'alpha-centauri', 'proxima-cen-b', 35);
    const v6 = structuredClone(g) as unknown as Record<string, unknown>;
    v6.version = 6;
    v6.powers = g.powers.map(({ food: _f, treasury: _t, taxes: _x, ...p }) => p);
    v6.holdings = g.holdings.map(({ districts: _d, hungry: _h, overdrive: _o, ...h }) => h);
    const json = JSON.stringify({ format: SAVE_FORMAT, version: 1, savedAt: '2026-10-21T10:00:00Z', game: v6 });
    const back = parseSave(world, json);
    expect(back.version).toBe(STATE_VERSION);
    expect(powerOf(back, 'sta')).toMatchObject({ food: 5, treasury: 50, taxes: 'standard' });
    expect(capital(back).districts).toEqual(capital(g).districts);
    // 3 million: farms enough to feed it (2 food, from one tolerable farm), then a mine and works.
    expect(holding(back, c.id).districts).toEqual([
      { zone: 'farms', slot: 1 },
      { zone: 'mines', slot: 2 },
      { zone: 'works', slot: 3 },
    ]);
    expect(holding(back, c.id)).toMatchObject({ hungry: 0, overdrive: 0 });
  });
});
