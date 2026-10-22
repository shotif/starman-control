import { describe, expect, it } from 'vitest';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { mapContent } from '../../src/render/mapModel.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import { claimantsAt, claimOf, neighbours, tradeIncome, tradeOf } from '../../src/sim/borders.ts';
import { settleRefusal, treasuryOf } from '../../src/sim/economy.ts';
import { type GameState, makeHolding, newGame, powerOf } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** Borders and trade (M3_NEIGHBOURS.md §22, D-54). */

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
const allMet = (g: GameState) => {
  for (const p of g.powers)
    for (const q of g.powers)
      if (p !== q && !p.contacts.some((c) => c.faction === q.faction))
        p.contacts.push({ faction: q.faction, stage: 'talk', since: 1, words: RULES.contact.wordsToTalk });
  return g;
};
const body = (system: string) => bodiesOf(world, 42, system)[0]?.id as string;
/** The Cooperative with a colony at Alpha Centauri: Barnard's Star lies one old lane from it and from Sol. */
const neighbourly = () => {
  const g = allMet(three());
  makeHolding(g, {
    owner: 'frontier',
    kind: 'colony',
    system: 'alpha-centauri',
    body: body('alpha-centauri'),
    capital: false,
    people: 10,
  });
  return g;
};
const border = (g: GameState) =>
  g.treaties.push({ kind: 'border', a: 'frontier', b: 'sta', since: 1, ends: null, endedBy: null, broken: false });

describe('claims (§22.1)', () => {
  it('a colony claims its system and every system one lane away; an outpost only its own', () => {
    const g = three();
    expect(neighbours(world, g, 'sol').sort()).toEqual(['alpha-centauri', 'barnard', 'sirius', 'wolf-359']);
    for (const s of ['sol', 'alpha-centauri', 'barnard', 'sirius', 'wolf-359'])
      expect(claimOf(world, g, s), s).toMatchObject({ owner: 'sta' });
    expect(claimOf(world, g, 'luhman-16').claimants).toEqual([]);
    makeHolding(g, {
      owner: 'hollow-wake',
      kind: 'outpost',
      system: 'luhman-16',
      body: body('luhman-16'),
      capital: false,
      people: 0,
    });
    expect(claimOf(world, g, 'luhman-16')).toEqual({
      owner: 'hollow-wake',
      claimants: ['hollow-wake'],
      settled: false,
    });
    // An outpost claims nothing round it.
    for (const n of neighbours(world, g, 'luhman-16'))
      expect(claimantsAt(world, g, n).includes('hollow-wake'), n).toBe(false);
  });

  it('a system held is its holder’s; one claimed by two and held by neither is contested', () => {
    const g = neighbourly();
    expect(claimOf(world, g, 'alpha-centauri')).toEqual({ owner: 'frontier', claimants: ['frontier'], settled: false });
    expect(claimOf(world, g, 'barnard')).toEqual({ owner: null, claimants: ['sta', 'frontier'], settled: false });
    const content = mapContent(world, g);
    expect(content.claims.filter((c) => c.system === 'barnard').map((c) => [c.faction, c.contested])).toEqual([
      ['sta', true],
      ['frontier', true],
    ]);
  });

  it('settling in another’s claim is remembered (−3), beside it (−5) only once', () => {
    let g = neighbourly();
    powerOf(g, 'frontier').controller = 'player';
    const ship = g.ships.find((s) => s.owner === 'frontier' && s.type === 'outpost');
    if (!ship) throw new Error('no Cooperative outpost ship');
    powerOf(g, 'frontier').surveyed.push('sirius');
    powerOf(g, 'frontier').surveyed.sort();
    Object.assign(ship, { at: 'sirius', destinations: [], founding: { body: body('sirius'), kind: 'outpost' } });
    g = resolveTurn(world, g).state;
    expect(powerOf(g, 'sta').memories).toEqual([
      { faction: 'frontier', kind: 'claim-crossed', amount: -3, system: 'sirius', turn: 1 },
    ]);
    expect(stateProblems(world, g)).toEqual([]);
  });
});

describe('the border treaty (§22.3)', () => {
  it('shares out contested systems to the nearer colony, and keeps each out of the other’s claim', () => {
    const g = neighbourly();
    border(g);
    // Barnard's Star is 6.0 ly from Sol and further from Alpha Centauri.
    expect(world.distanceDeci('barnard', 'sol')).toBeLessThan(world.distanceDeci('barnard', 'alpha-centauri'));
    expect(claimOf(world, g, 'barnard')).toEqual({ owner: 'sta', claimants: ['sta', 'frontier'], settled: true });
    powerOf(g, 'frontier').surveyed.push('barnard');
    expect(settleRefusal(world, g, 'frontier', 'barnard', body('barnard'), 'outpost')).toBe(
      'Barnard’s Star is the Transit Authority’s by our border treaty.',
    );
    // Without the treaty, it may (and is remembered for it).
    g.treaties = [];
    expect(settleRefusal(world, g, 'frontier', 'barnard', body('barnard'), 'outpost')).toBeNull();
  });
});

describe('trade (§22.4)', () => {
  it('1 for every 4 colonies of the smaller side, at least 1, and 1 for each open lane joining them, at most 10', () => {
    const g = neighbourly();
    // Alpha Centauri ~ Sol is an open lane of the Authority's home web, joining Sol to the Cooperative's colony.
    expect(g.lanes.find((l) => l.id === 'alpha-centauri~sol')?.status).toBe('open');
    expect(tradeOf(g, 'sta', 'frontier')).toBe(1 + 1);
    for (let i = 0; i < 12; i++)
      for (const f of ['sta', 'frontier'] as const)
        makeHolding(g, {
          owner: f,
          kind: 'colony',
          system: 'tau-ceti',
          body: `x-${f}-${i}`,
          capital: false,
          people: 10,
        });
    expect(tradeOf(g, 'sta', 'frontier')).toBe(Math.min(10, Math.floor(13 / 4) + 1 + 0));
    expect(tradeOf(g, 'sta', 'frontier')).toBeLessThanOrEqual(RULES.treaties.tradeMost);
  });

  it('pays both every turn from the turn after it is agreed, in the treasury as a line of its own', () => {
    let g = neighbourly();
    g.treaties.push({ kind: 'trade', a: 'frontier', b: 'sta', since: 1, ends: null, endedBy: null, broken: false });
    expect(tradeIncome(g, 'sta')).toEqual([]);
    g.turn = 2;
    expect(tradeIncome(g, 'sta')).toEqual([{ faction: 'frontier', credits: 2 }]);
    expect(treasuryOf(world, g, 'sta').parts).toContainEqual({ label: 'trade with the Frontier Co-op', value: 2 });
    g.turn = 1;
    const before = treasuryOf(world, g, 'sta').total;
    g = resolveTurn(world, g).state;
    expect(treasuryOf(world, g, 'sta').total).toBeGreaterThanOrEqual(before);
    expect(stateProblems(world, g)).toEqual([]);
  });
});
