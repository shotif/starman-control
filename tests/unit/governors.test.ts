import { describe, expect, it } from 'vitest';
import type { Zone } from '../../src/content/districts.ts';
import type { FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import type { TechId } from '../../src/content/techs.ts';
import { SKY } from '../../src/data/sky.ts';
import { approvalOf, foodOf, industryOf, keepsOf, networkFood, networkOf, researchOf } from '../../src/sim/economy.ts';
import { govern } from '../../src/sim/governor.ts';
import { jumpPoints } from '../../src/sim/movement.ts';
import { applyOrder, type Order, refuse } from '../../src/sim/orders.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { type GameState, type Holding, makeHolding, newGame, powerOf, STATE_VERSION } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { shapeProblems, stateProblems } from '../../src/sim/validate.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** Governors and edicts (M2_WORLDS.md §25, D-15). */

const world = buildWorld(SKY);
const start = (governed = false, faction: FactionId = 'sta') =>
  newGame(world, { seed: 42, powers: [{ faction, controller: 'player', governed }] });
const capital = (g: GameState) => g.holdings.find((h) => h.owner === 'sta' && h.capital) as Holding;
const holding = (g: GameState, id: number) => g.holdings.find((h) => h.id === id) as Holding;
const order = (g: GameState, o: Order) => {
  const r = applyOrder(world, g, 'sta', o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const why = (g: GameState, o: Order) => refuse(world, g, 'sta', o);
const turn = (g: GameState) => resolveTurn(world, g);
const colony = (g: GameState, people: number, zones: Zone[]) =>
  makeHolding(g, {
    owner: 'sta',
    kind: 'colony',
    system: 'alpha-centauri',
    body: 'proxima-cen-b',
    capital: false,
    people,
    districts: zones.map((zone, i) => ({ zone, slot: i + 1 })),
  });

describe('governors (§25.1)', () => {
  it('are none by default; an imperial start governs the capital and every new colony', () => {
    expect(capital(start()).governor).toBeNull();
    expect(powerOf(start(), 'sta').governNew).toBe(false);
    const g = start(true);
    expect(capital(g).governor).toBe('balance');
    const ship = g.ships.find((s) => s.type === 'colony');
    if (!ship) throw new Error('no colony ship');
    ship.at = 'alpha-centauri';
    powerOf(g, 'sta').surveyed.push('alpha-centauri');
    const r = turn(order(g, { type: 'colonise', ship: ship.id, body: 'proxima-cen-b' }));
    expect(r.state.holdings.find((h) => h.body === 'proxima-cen-b')?.governor).toBe('balance');
  });

  it('mend a food shortage first, saying how short the network is', () => {
    const g = start();
    const c = colony(g, 25, ['works', 'works']);
    c.governor = 'produce';
    // The capital makes 1 more than it eats; this colony eats 2 and farms nothing.
    const said = govern(world, g, c);
    expect(said[0]).toEqual({
      kind: 'governed',
      holding: c.id,
      did: 'zone',
      zone: 'farms',
      slot: 3,
      reason: 'food',
      short: 1,
    });
    expect(c.queue[0]).toEqual({ kind: 'zone', zone: 'farms', slot: 3, governor: true });
  });

  it('zone open land for their priority, only as far as the people can work it', () => {
    for (const [priority, zone] of [
      ['produce', 'works'],
      ['research', 'labs'],
      ['trade', 'market'],
    ] as const) {
      const g = start();
      // Fed, with a million idle.
      const c = colony(g, 30, ['farms', 'farms']);
      c.governor = priority;
      expect(govern(world, g, c).find((e) => e.did === 'zone')).toMatchObject({ zone, slot: 3, reason: 'priority' });
    }
    const g = start();
    const busy = colony(g, 20, ['farms', 'farms']);
    busy.governor = 'research';
    expect(govern(world, g, busy).some((e) => e.did === 'zone')).toBe(false);
  });

  it('keep a lab as every fifth district, whatever their priority (D-44)', () => {
    for (const [priority, reason] of [
      ['grow', 'lab'],
      ['produce', 'lab'],
      ['trade', 'lab'],
      ['balance', 'priority'],
      ['research', 'priority'],
    ] as const) {
      const g = start();
      // Fed, with a million idle, and four districts zoned: the fifth is a lab.
      const c = colony(g, 50, ['farms', 'farms', 'works', 'works']);
      c.governor = priority;
      expect(
        govern(world, g, c).find((e) => e.did === 'zone'),
        priority,
      ).toMatchObject({
        zone: 'labs',
        slot: 5,
        reason,
      });
    }
    // With a lab already among the first five, the sixth is the priority's own.
    const g = start();
    const c = colony(g, 60, ['farms', 'farms', 'labs', 'works', 'works']);
    c.governor = 'produce';
    expect(govern(world, g, c).find((e) => e.did === 'zone')).toMatchObject({ zone: 'mines', reason: 'priority' });
  });

  it('never touch what the player zoned, cleared or queued', () => {
    let g = start();
    const c = colony(g, 30, ['farms', 'farms']);
    g = order(g, { type: 'governor', holding: c.id, priority: 'research' });
    g = order(g, { type: 'clear-district', holding: c.id, slot: 2 });
    expect(holding(g, c.id).locked).toEqual([2]);
    g = order(g, { type: 'queue', holding: c.id, item: { kind: 'project', project: 'civic-centre' } });
    const h = holding(g, c.id);
    const said = govern(world, g, h);
    // Slot 2 stays open; slot 3 is zoned instead; the player's civic centre stays where it was.
    expect(said.find((e) => e.did === 'zone')?.slot).toBe(3);
    expect(h.queue.map((q) => [q.kind, q.governor === true])).toEqual([
      ['zone', true],
      ['project', false],
    ]);
    g = order(g, { type: 'unlock', holding: c.id, slot: 2 });
    expect(holding(g, c.id).locked).toEqual([]);
    expect(why(g, { type: 'unlock', holding: c.id, slot: 2 })).toBe('That district is not locked.');
  });

  it('queue a project when the queue is empty, something calming first while people are unhappy', () => {
    const g = start();
    const c = capital(g);
    c.governor = 'research';
    knowing(g, 'computing');
    expect(govern(world, g, c).find((e) => e.did === 'queue')).toMatchObject({
      project: 'research-institute',
      reason: 'priority',
    });
    const unhappy = start();
    const u = capital(unhappy);
    u.governor = 'trade';
    powerOf(unhappy, 'sta').taxes = 'high';
    expect(approvalOf(world, unhappy, u).level).toBe('uneasy');
    expect(govern(world, unhappy, u).find((e) => e.did === 'queue')).toMatchObject({
      project: 'civic-centre',
      reason: 'calm',
    });
  });

  it('keep a governed empire fed and growing for 50 turns, with a line for every action', () => {
    let g = start(true);
    let lines = 0;
    let hungryTurns = 0;
    for (let t = 0; t < 50; t++) {
      const r = turn(g);
      g = r.state;
      lines += (r.reports[0]?.events ?? []).filter((e) => e.kind === 'governed').length;
      if (capital(g).hungry > 0) hungryTurns++;
      const problems = [...shapeProblems(g), ...stateProblems(world, g)];
      if (problems.length) throw new Error(`turn ${g.turn}: ${problems.join('; ')}`);
    }
    // A capital has no open land: its governor builds what its priority lists, in turn.
    expect(lines).toBeGreaterThanOrEqual(3);
    expect(hungryTurns).toBeLessThanOrEqual(2);
    expect(capital(g).people).toBeGreaterThanOrEqual(110);
    expect(capital(g).projects).toEqual(expect.arrayContaining(['hydroponics', 'mine', 'trade-exchange']));
  });
});

function knowing(g: GameState, ...techs: TechId[]) {
  powerOf(g, 'sta').researched.push(...techs);
}

describe('edicts (§25.2)', () => {
  it('are paid from attention: 2 a turn, kept up to 6', () => {
    let g = start();
    expect(powerOf(g, 'sta').attention).toBe(2);
    for (let i = 0; i < 3; i++) g = turn(g).state;
    expect(powerOf(g, 'sta').attention).toBe(RULES.attention.most);
    g = order(g, { type: 'edict', edict: 'festival', holding: capital(g).id });
    expect(powerOf(g, 'sta').attention).toBe(4);
    expect(why(g, { type: 'edict', edict: 'festival', holding: capital(g).id })).toBe(
      'A festival is already in force.',
    );
    expect(why(start(), { type: 'edict', edict: 'labour-drive' })).toBe('Choose one of your colonies.');
    const poor = start();
    powerOf(poor, 'sta').attention = 1;
    expect(why(poor, { type: 'edict', edict: 'crash-programme' })).toBe(
      'Not enough attention: it needs 2, and there is 1.',
    );
    expect(why(start(), { type: 'edict', edict: 'martial-order', holding: capital(start()).id })).toBe(
      'Only a colony in unrest or revolt needs martial order.',
    );
  });

  it('do what they say, for their turns, then end with a line in the report', () => {
    let g = start();
    const c = capital(g).id;
    g = order(g, { type: 'edict', edict: 'festival', holding: c });
    expect(approvalOf(world, g, holding(g, c)).parts).toContainEqual({ label: 'a festival', value: 15 });
    for (let i = 0; i < 3; i++) g = turn(g).state;
    expect(powerOf(g, 'sta').edicts).toHaveLength(1);
    const r = turn(g);
    expect(r.reports[0]?.events).toContainEqual({ kind: 'edict-ended', edict: 'festival', holding: c });
    expect(powerOf(r.state, 'sta').edicts).toEqual([]);
  });

  it('labour drive, crash programme, rationing, survey drive and martial order', () => {
    const g = start();
    powerOf(g, 'sta').attention = 6;
    const c = capital(g);
    const industry = industryOf(world, g, c).total;
    const research = researchOf(world, g, 'sta').total;
    const eaten = foodOf(world, g, c).eaten;
    const jumps = jumpPoints(g, 'sta', 'survey');
    let s = order(g, { type: 'edict', edict: 'labour-drive', holding: c.id });
    s = order(s, { type: 'edict', edict: 'crash-programme' });
    s = order(s, { type: 'edict', edict: 'survey-drive' });
    const cs = holding(s, c.id);
    // 12 made; +25% is 3, −20% is −2.
    expect(industryOf(world, s, cs).total).toBe(industry + 3 - 2);
    expect(researchOf(world, s, 'sta').total).toBe(research + Math.floor(research / 2));
    expect(jumpPoints(s, 'sta', 'survey')).toBe(jumps + 1);
    expect(approvalOf(world, s, cs).parts).toContainEqual({ label: 'a labour drive', value: -10 });

    const r = order(g, { type: 'edict', edict: 'rationing', holding: c.id });
    expect(foodOf(world, r, holding(r, c.id)).eaten).toBe(Math.ceil((eaten * 75) / 100));
    expect(networkFood(world, r, 'sta', networkOf(world, r, holding(r, c.id))).eaten).toBe(4);

    const m = start();
    powerOf(m, 'sta').attention = 6;
    powerOf(m, 'sta').taxes = 'high';
    powerOf(m, 'sta').treasury = -1;
    const other = colony(m, 10, ['farms']);
    const cm = capital(m);
    cm.hungry = 1;
    expect(approvalOf(world, m, cm).level).toBe('unrest');
    const mm = order(m, { type: 'edict', edict: 'martial-order', holding: cm.id });
    expect(keepsOf(world, mm, holding(mm, cm.id))).toBe(100);
    expect(approvalOf(world, mm, holding(mm, other.id)).parts).toContainEqual({
      label: 'martial order elsewhere',
      value: -5,
    });
  });
});

describe('a save from before governors (state version 7)', () => {
  it('has no governors, nothing locked, its starting attention and no edicts', () => {
    const g = start();
    const v7 = structuredClone(g) as unknown as Record<string, unknown>;
    v7.version = 7;
    v7.powers = g.powers.map(({ attention: _a, edicts: _e, governNew: _n, ...p }) => p);
    v7.holdings = g.holdings.map(({ governor: _g, locked: _l, ...h }) => h);
    const back = parseSave(world, JSON.stringify({ format: SAVE_FORMAT, version: 1, game: v7 }));
    expect(back.version).toBe(STATE_VERSION);
    expect(back).toEqual(g);
  });
});
