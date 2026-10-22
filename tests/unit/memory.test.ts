import { describe, expect, it } from 'vitest';
import type { FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { adviceFor } from '../../src/sim/advice.ts';
import { attitudeOf, attitudeWord, fadeMemories, remember } from '../../src/sim/memory.ts';
import { applyOrder, type Order } from '../../src/sim/orders.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { type GameState, type Holding, makeHolding, newGame, powerOf } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** Memory and attitude, and gifts (M3_NEIGHBOURS.md §20, D-55). */

const world = buildWorld(SKY);
const three = () =>
  newGame(world, {
    seed: 42,
    powers: [
      { faction: 'sta', controller: 'player' },
      { faction: 'frontier', controller: 'ai' },
      { faction: 'hollow-wake', controller: 'ai' },
    ],
  });
/** Two powers in contact, at talk, from turn 1, as humans are. */
const meet = (g: GameState, a: FactionId, b: FactionId) => {
  for (const [x, y] of [
    [a, b],
    [b, a],
  ] as const)
    powerOf(g, x).contacts.push({ faction: y, stage: 'talk', since: 1, words: RULES.contact.wordsToTalk });
  return g;
};
const order = (g: GameState, faction: FactionId, o: Order) => {
  const r = applyOrder(world, g, faction, o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const refused = (g: GameState, faction: FactionId, o: Order) => {
  const r = applyOrder(world, g, faction, o);
  return r.ok ? null : r.reason;
};
const capital = (g: GameState, f: FactionId) => g.holdings.find((h) => h.capital && h.owner === f) as Holding;

describe('attitude (§20.1)', () => {
  it('is nothing before contact, then kin, how long known, and character, each with its reason', () => {
    const g = three();
    expect(attitudeOf(world, g, 'frontier', 'sta')).toEqual({ total: 0, word: 'neutral', parts: [] });
    meet(g, 'sta', 'frontier');
    meet(g, 'sta', 'hollow-wake');
    expect(attitudeOf(world, g, 'frontier', 'sta').parts).toEqual([
      { kind: 'kin', reason: 'Of our own kind', amount: 10 },
    ]);
    g.turn = 31;
    expect(attitudeOf(world, g, 'frontier', 'sta')).toEqual({
      total: 13,
      word: 'warm',
      parts: [
        { kind: 'kin', reason: 'Of our own kind', amount: 10 },
        { kind: 'known', reason: 'Has known us 30 turns', amount: 3 },
      ],
    });
    // The Authority holds the Wake for outlaws; the Wake sees in the Authority the law it runs from.
    expect(attitudeOf(world, g, 'sta', 'hollow-wake').total).toBe(10 + 3 - 15);
    expect(attitudeOf(world, g, 'sta', 'hollow-wake').parts.at(-1)).toEqual({
      kind: 'character',
      reason: 'Holds us for outlaws',
      amount: -15,
    });
    expect(attitudeOf(world, g, 'hollow-wake', 'sta').total).toBe(3);
    // Known counts at most 10.
    g.turn = 500;
    expect(attitudeOf(world, g, 'frontier', 'sta').total).toBe(20);
  });

  it('has its words: hostile, cold, neutral, warm, friendly', () => {
    expect([-100, -40, -39, -10, -9, 0, 9, 10, 39, 40, 100].map(attitudeWord)).toEqual([
      'hostile',
      'hostile',
      'cold',
      'cold',
      'neutral',
      'neutral',
      'neutral',
      'warm',
      'warm',
      'friendly',
      'friendly',
    ]);
  });

  it('is held to ±100', () => {
    const g = meet(three(), 'sta', 'frontier');
    for (let i = 0; i < 8; i++) remember(g, 'frontier', 'sta', { kind: 'gift', amount: 20, credits: 100 });
    expect(attitudeOf(world, g, 'frontier', 'sta').total).toBe(100);
  });

  it('remembers, and forgets a point every 4 turns until nothing is left', () => {
    const g = meet(three(), 'sta', 'frontier');
    remember(g, 'frontier', 'sta', { kind: 'gift', amount: 2, credits: 10 });
    remember(g, 'frontier', 'sta', { kind: 'great-work-lost', amount: -15, system: 'sol', project: 'commons' });
    const amounts = () => powerOf(g, 'frontier').memories.map((m) => m.amount);
    for (let t = 2; t <= 4; t++) {
      g.turn = t;
      fadeMemories(g);
    }
    expect(amounts()).toEqual([2, -15]);
    g.turn = 5;
    fadeMemories(g);
    expect(amounts()).toEqual([1, -14]);
    g.turn = 9;
    fadeMemories(g);
    expect(amounts()).toEqual([-13]);
    expect(attitudeOf(world, g, 'frontier', 'sta').parts.at(-1)).toEqual({
      kind: 'great-work-lost',
      reason: 'Lost the Commons to us',
      amount: -13,
    });
  });
});

describe('a gift (§20.2)', () => {
  it('is refused unless we can talk, of 20, 50 or 100, and never into debt', () => {
    const g = three();
    expect(refused(g, 'sta', { type: 'gift', to: 'frontier', credits: 50 })).toBe(
      'We cannot talk with the Frontier Co-op yet.',
    );
    meet(g, 'sta', 'frontier');
    expect(refused(g, 'sta', { type: 'gift', to: 'frontier', credits: 30 })).toBe('A gift is 20, 50 or 100 credits.');
    expect(refused(g, 'sta', { type: 'gift', to: 'sta', credits: 50 })).toBe('There is no such power.');
    powerOf(g, 'sta').treasury = 40;
    expect(refused(g, 'sta', { type: 'gift', to: 'frontier', credits: 50 })).toBe('The treasury cannot pay for it.');
    expect(refused(g, 'sta', { type: 'gift', to: 'frontier', credits: 0 })).toBe(
      'No gift to the Frontier Co-op is waiting to be sent.',
    );
  });

  it('is paid at once, one to a power a turn, taken back for nothing, and arrives as the turn ends', () => {
    let g = meet(three(), 'sta', 'frontier');
    const t0 = powerOf(g, 'sta').treasury;
    const f0 = powerOf(g, 'frontier').treasury;
    g = order(g, 'sta', { type: 'gift', to: 'frontier', credits: 50 });
    expect(powerOf(g, 'sta').treasury).toBe(t0 - 50);
    // A second gift replaces the first.
    g = order(g, 'sta', { type: 'gift', to: 'frontier', credits: 20 });
    expect(powerOf(g, 'sta').treasury).toBe(t0 - 20);
    expect(powerOf(g, 'sta').gifts).toEqual([{ to: 'frontier', credits: 20 }]);
    g = order(g, 'sta', { type: 'gift', to: 'frontier', credits: 0 });
    expect(powerOf(g, 'sta').treasury).toBe(t0);
    g = order(g, 'sta', { type: 'gift', to: 'frontier', credits: 50 });
    expect(stateProblems(world, g)).toEqual([]);

    const r = resolveTurn(world, g);
    g = r.state;
    expect(powerOf(g, 'sta').gifts).toEqual([]);
    const sent = r.reports.find((x) => x.faction === 'sta')?.events ?? [];
    const got = r.reports.find((x) => x.faction === 'frontier')?.events ?? [];
    expect(sent).toContainEqual({ kind: 'gift-sent', faction: 'frontier', credits: 50 });
    expect(got).toContainEqual({ kind: 'gift-received', faction: 'sta', credits: 50 });
    expect(powerOf(g, 'frontier').memories).toContainEqual({
      faction: 'sta',
      kind: 'gift',
      amount: 10,
      credits: 50,
      turn: 1,
    });
    expect(attitudeOf(world, g, 'frontier', 'sta').parts).toContainEqual({
      kind: 'gift',
      reason: 'Remembers our gift of 50 credits',
      amount: 10,
    });
    // Its credits arrived (whatever else the Cooperative earned and spent that turn).
    expect(powerOf(g, 'frontier').treasury).toBeGreaterThanOrEqual(f0 + 50 - 40);
    const said = adviceFor(world, g, 'sta', sent, [], 'speak').find((l) => l.department === 'envoy');
    expect(said?.text).toBe(
      'Control, I have delivered our gift of 50 credits to the Frontier Co-op. It will be remembered.',
    );
    expect(stateProblems(world, g)).toEqual([]);
  });
});

describe('what is remembered (§20.1)', () => {
  it('a colony or outpost founded beside one of ours', () => {
    let g = meet(three(), 'sta', 'frontier');
    powerOf(g, 'frontier').controller = 'player';
    const ship = g.ships.find((s) => s.owner === 'frontier' && s.type === 'outpost');
    if (!ship) throw new Error('no Cooperative outpost ship');
    ship.at = 'sol';
    ship.destinations = [];
    ship.founding = { body: 'mars', kind: 'outpost' };
    powerOf(g, 'frontier').surveyed.push('sol');
    powerOf(g, 'frontier').surveyed.sort();
    g = resolveTurn(world, g).state;
    expect(g.holdings.some((h) => h.owner === 'frontier' && h.system === 'sol')).toBe(true);
    expect(powerOf(g, 'sta').memories).toContainEqual({
      faction: 'frontier',
      kind: 'settled-beside',
      amount: -5,
      system: 'sol',
      turn: 1,
    });
    expect(attitudeOf(world, g, 'sta', 'frontier').parts.at(-1)?.reason).toBe('We settled beside it at Sol');
  });

  it('a great work finished first by another', () => {
    let g = meet(three(), 'sta', 'frontier');
    for (const f of ['sta', 'frontier'] as const) {
      powerOf(g, f).researched.push('great-engineering', 'public-schooling');
      powerOf(g, f).stockpile.metals = 100;
    }
    capital(g, 'sta').queue = [{ kind: 'project', project: 'lapse-archive' }];
    capital(g, 'sta').industry = 399;
    capital(g, 'frontier').queue = [{ kind: 'project', project: 'lapse-archive' }];
    capital(g, 'frontier').industry = 100;
    g = resolveTurn(world, g).state;
    expect(powerOf(g, 'frontier').memories).toContainEqual({
      faction: 'sta',
      kind: 'great-work-lost',
      amount: -15,
      system: 'sol',
      project: 'lapse-archive',
      turn: 1,
    });
  });
});

describe('the state (§20.4)', () => {
  it('a save from version 12 remembers nothing yet', () => {
    const g = three();
    const powers = g.powers.map(({ memories: _m, gifts: _g, ...p }) => p);
    const raw = {
      format: SAVE_FORMAT,
      version: 1,
      savedAt: '2026-10-22T00:00:00Z',
      game: { ...g, version: 12, powers },
    };
    const loaded = parseSave(world, JSON.stringify(raw));
    for (const p of loaded.powers) {
      expect(p.memories).toEqual([]);
      expect(p.gifts).toEqual([]);
    }
  });

  it('refuses a memory of nothing, of itself, or a gift of the wrong size', () => {
    const g = meet(three(), 'sta', 'frontier');
    powerOf(g, 'sta').memories.push({ faction: 'sta', kind: 'gift', amount: 0, turn: 1, credits: 20 });
    powerOf(g, 'sta').gifts.push({ to: 'frontier', credits: 30 });
    expect(stateProblems(world, g)).toEqual([
      'sta remembers sta, which is not another power in play',
      "sta's memory of sta counts 0",
      'sta sends a gift of 30 credits',
    ]);
  });

  it('a whole game of rivals stays sound', () => {
    let g = three();
    for (let t = 0; t < 40; t++) g = resolveTurn(world, g).state;
    expect(stateProblems(world, g)).toEqual([]);
    expect(makeHolding).toBeTypeOf('function');
  }, 60_000);
});
