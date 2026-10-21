import { describe, expect, it } from 'vitest';
import type { FactionId } from '../../src/content/factions.ts';
import { PROJECTS } from '../../src/content/projects.ts';
import type { TechId } from '../../src/content/techs.ts';
import { SKY } from '../../src/data/sky.ts';
import { adviceFor } from '../../src/sim/advice.ts';
import { aiOrders, PERSONALITIES } from '../../src/sim/ai.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import { queueRefusal } from '../../src/sim/economy.ts';
import { findRoute } from '../../src/sim/movement.ts';
import { applyOrder, type Order, refuse } from '../../src/sim/orders.ts';
import {
  type GameState,
  type Holding,
  makeHolding,
  makeShip,
  markSurveyed,
  newGame,
  powerOf,
  type ShipState,
} from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { shapeProblems, stateProblems } from '../../src/sim/validate.ts';
import { knownView, standings, watchNews } from '../../src/sim/visibility.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** Rivals that play (M2_WORLDS.md §26, D-37). */

const world = buildWorld(SKY);
const withRivals = (seed = 42, player: FactionId | null = 'sta') =>
  newGame(world, {
    seed,
    powers: (['sta', 'frontier', 'hollow-wake'] as const).map((faction) => ({
      faction,
      controller: faction === player ? ('player' as const) : ('ai' as const),
    })),
  });
const capitalOf = (g: GameState, f: FactionId) => g.holdings.find((h) => h.owner === f && h.capital) as Holding;
const shipOf = (g: GameState, f: FactionId, type: ShipState['type']) =>
  g.ships.find((s) => s.owner === f && s.type === type) as ShipState;
const order = (g: GameState, f: FactionId, o: Order) => {
  const r = applyOrder(world, g, f, o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const knowing = (g: GameState, f: FactionId, ...techs: TechId[]) => {
  powerOf(g, f).researched.push(...techs);
  return g;
};

describe('a new game with rivals (§26.1)', () => {
  it('starts every power at its capital with its web, fleet and stockpile, the player’s alone the same', () => {
    const g = withRivals();
    expect(g.powers.map((p) => [p.faction, p.controller])).toEqual([
      ['sta', 'player'],
      ['frontier', 'ai'],
      ['hollow-wake', 'ai'],
    ]);
    for (const f of ['sta', 'frontier', 'hollow-wake'] as const) {
      expect(capitalOf(g, f)).toBeDefined();
      expect(g.ships.filter((s) => s.owner === f)).toHaveLength(4);
      expect(g.lanes.some((l) => l.owner === f)).toBe(true);
    }
    const alone = newGame(world, { seed: 42, powers: [{ faction: 'sta', controller: 'player' }] });
    expect(alone.lanes.filter((l) => l.owner === 'sta')).toEqual(g.lanes.filter((l) => l.owner === 'sta'));
    expect(alone.holdings[0]).toEqual(capitalOf(g, 'sta'));
  });
});

describe('how a rival plays (§26.2)', () => {
  it('governs every colony for its power’s priority', () => {
    const g = withRivals();
    const orders = aiOrders(world, g, 'frontier');
    expect(orders).toContainEqual({ type: 'governor', holding: capitalOf(g, 'frontier').id, priority: 'grow' });
    expect(aiOrders(world, g, 'hollow-wake')).toContainEqual({
      type: 'governor',
      holding: capitalOf(g, 'hollow-wake').id,
      priority: 'produce',
    });
    const sta = withRivals(42, null);
    expect(aiOrders(world, sta, 'sta')).toContainEqual({
      type: 'governor',
      holding: capitalOf(sta, 'sta').id,
      priority: 'research',
    });
    const next = resolveTurn(world, g).state;
    expect(capitalOf(next, 'frontier').governor).toBe('grow');
    // The player's colonies are never touched.
    expect(capitalOf(next, 'sta').governor).toBeNull();
  });

  it('sends its survey ships to the nearest systems not yet surveyed, one each', () => {
    const g = withRivals();
    const moves = aiOrders(world, g, 'frontier').filter((o) => o.type === 'move' || o.type === 'blind-jump');
    const surveyors = g.ships.filter((s) => s.owner === 'frontier' && s.type === 'survey').map((s) => s.id);
    const targets = moves.filter((o) => 'ship' in o && surveyors.includes(o.ship)).map((o) => ('to' in o ? o.to : ''));
    expect(targets).toHaveLength(2);
    expect(new Set(targets).size).toBe(2);
    for (const to of targets) expect(powerOf(g, 'frontier').surveyed).not.toContain(to);
  });

  it('settles: the Authority the roomiest world, the Cooperative the nearest, the Wake’s outposts the richest', () => {
    expect(PERSONALITIES.sta.settles).toBe('roomiest');
    expect(PERSONALITIES.frontier.settles).toBe('nearest');
    expect(PERSONALITIES['hollow-wake'].settles).toBe('richest');
    // At home, the Wake's colony ship takes the richest world it can live on (Wolf 1061 c is its
    // capital), and its outpost ship the richest left.
    const g = withRivals();
    const orders = aiOrders(world, g, 'hollow-wake');
    expect(orders).toContainEqual({
      type: 'colonise',
      ship: shipOf(g, 'hollow-wake', 'colony').id,
      body: 'wolf-1061:1',
    });
    expect(orders).toContainEqual({
      type: 'found-outpost',
      ship: shipOf(g, 'hollow-wake', 'outpost').id,
      body: 'wolf-1061-d',
    });
  });

  it('builds a ship only while it has credits to keep one', () => {
    const g = withRivals();
    // Its colony ship founds first; with none left and worlds to settle, the yard builds another.
    g.ships = g.ships.filter((s) => !(s.owner === 'frontier' && s.type === 'colony'));
    markSurveyed(powerOf(g, 'frontier'), 'yz-ceti');
    const yard = capitalOf(g, 'frontier').id;
    const queued = aiOrders(world, g, 'frontier').find((o) => o.type === 'queue' && o.holding === yard);
    expect(queued).toBeDefined();
    powerOf(g, 'frontier').treasury = 19;
    expect(aiOrders(world, g, 'frontier').some((o) => o.type === 'queue' && o.item.kind === 'ship')).toBe(false);
  });

  it('queues lanes from its outposts, and from the Authority’s colonies too', () => {
    const g = withRivals(42, null);
    const at = (owner: FactionId, kind: Holding['kind'], system: string) =>
      makeHolding(g, {
        owner,
        kind,
        system,
        body: bodiesOf(world, g.seed, system)[0]?.id ?? '',
        capital: false,
        people: kind === 'colony' ? 10 : 0,
      });
    const lanes = (f: FactionId, h: Holding) =>
      aiOrders(world, g, f).filter((o) => o.type === 'queue' && o.holding === h.id && o.item.kind === 'lane');
    const sta = at('sta', 'colony', 'alpha-centauri');
    const coop = at('frontier', 'colony', 'luhman-16');
    const outpost = at('frontier', 'outpost', 'wolf-359');
    expect(lanes('sta', sta)).toEqual([{ type: 'queue', holding: sta.id, item: { kind: 'lane', to: 'barnard' } }]);
    expect(lanes('frontier', coop)).toEqual([]);
    expect(lanes('frontier', outpost)).toEqual([
      { type: 'queue', holding: outpost.id, item: { kind: 'lane', to: 'ross-128' } },
    ]);
  });

  it('researches the cheapest technology in its own fields first', () => {
    const g = withRivals();
    const pick = (f: FactionId) => aiOrders(world, g, f).find((o) => o.type === 'research');
    expect(pick('frontier')).toEqual({ type: 'research', tech: 'adaptation-1' });
    expect(pick('hollow-wake')).toEqual({ type: 'research', tech: 'automated-mining' });
    expect(aiOrders(world, withRivals(42, null), 'sta').find((o) => o.type === 'research')).toEqual({
      type: 'research',
      tech: 'deep-survey',
    });
  });

  it('sets its own taxes once its treasury allows, higher when it runs low and falls', () => {
    const g = withRivals();
    powerOf(g, 'frontier').treasury = 60;
    expect(aiOrders(world, g, 'frontier')).toContainEqual({ type: 'taxes', rate: 'low' });
    expect(aiOrders(world, g, 'hollow-wake')).not.toContainEqual({ type: 'taxes', rate: 'high' });
    powerOf(g, 'hollow-wake').treasury = 60;
    expect(aiOrders(world, g, 'hollow-wake')).toContainEqual({ type: 'taxes', rate: 'high' });
  });

  it('spends a full treasury on overdrive where something is queued, and stops when it runs low (§29.1)', () => {
    const g = withRivals();
    const wake = capitalOf(g, 'hollow-wake');
    wake.queue.push({ kind: 'project', project: 'hydroponics' });
    const overdrive = () => aiOrders(world, g, 'hollow-wake').find((o) => o.type === 'overdrive');
    powerOf(g, 'hollow-wake').treasury = 99;
    expect(overdrive()).toBeUndefined();
    powerOf(g, 'hollow-wake').treasury = 260;
    expect(overdrive()).toEqual({ type: 'overdrive', holding: wake.id, steps: 2 });
    wake.overdrive = 2;
    powerOf(g, 'hollow-wake').treasury = 80;
    expect(overdrive()).toBeUndefined();
    powerOf(g, 'hollow-wake').treasury = 40;
    expect(overdrive()).toEqual({ type: 'overdrive', holding: wake.id, steps: 0 });
  });

  it('issues a festival where a colony is restless; with attention at its most, the edict of its character', () => {
    const g = withRivals(42, null);
    const edict = (f: FactionId) => aiOrders(world, g, f).find((o) => o.type === 'edict');
    expect(edict('sta')).toBeUndefined();
    for (const p of g.powers) p.attention = 6;
    expect(edict('sta')).toEqual({ type: 'edict', edict: 'crash-programme' });
    expect(edict('frontier')).toEqual({ type: 'edict', edict: 'festival', holding: capitalOf(g, 'frontier').id });
    expect(edict('hollow-wake')).toEqual({
      type: 'edict',
      edict: 'labour-drive',
      holding: capitalOf(g, 'hollow-wake').id,
    });
    powerOf(g, 'sta').taxes = 'high';
    powerOf(g, 'sta').treasury = -10;
    capitalOf(g, 'sta').hungry = 3;
    powerOf(g, 'sta').attention = 2;
    expect(edict('sta')).toEqual({ type: 'edict', edict: 'festival', holding: capitalOf(g, 'sta').id });
  });

  it('gives its orders through the same rules as the player’s: a refused order changes nothing', () => {
    const g = withRivals();
    const r = resolveTurn(world, g);
    expect([...shapeProblems(r.state), ...stateProblems(world, r.state)]).toEqual([]);
    expect(powerOf(r.state, 'frontier').researchQueue.length + powerOf(r.state, 'frontier').researched.length).toBe(1);
    expect(powerOf(r.state, 'sta').researchQueue).toEqual([]);
  });
});

describe('what you see of them (§26.3)', () => {
  it('at the start: nothing of theirs', () => {
    const g = withRivals();
    const v = knownView(world, g, 'sta');
    expect(v.holdings.every((h) => h.owner === 'sta')).toBe(true);
    expect(v.lanes.every((l) => l.owner === 'sta')).toBe(true);
    expect(v.ships.every((s) => s.owner === 'sta')).toBe(true);
    // The rules still see everything.
    expect(g.holdings).toHaveLength(3);
  });

  it('their colonies, outposts and lanes in systems you have surveyed; their ships only where you hold something', () => {
    const g = withRivals();
    markSurveyed(powerOf(g, 'sta'), 'tau-ceti');
    const v = knownView(world, g, 'sta');
    expect(v.holdings.map((h) => h.owner)).toEqual(['sta', 'frontier']);
    expect(v.lanes.filter((l) => l.owner === 'frontier').map((l) => l.id)).toEqual([
      'luyten-726-8~tau-ceti',
      'tau-ceti~yz-ceti',
    ]);
    expect(v.ships.some((s) => s.owner === 'frontier')).toBe(false);
    // An outpost there, and their ships at Tau Ceti are seen.
    makeHolding(g, {
      owner: 'sta',
      kind: 'outpost',
      system: 'tau-ceti',
      body: 'tau-ceti-h',
      capital: false,
      people: 0,
    });
    expect(knownView(world, g, 'sta').ships.filter((s) => s.owner === 'frontier')).toHaveLength(4);
  });

  it('a deep-space scanner sees their ships within 8 light-years, but not one between stars', () => {
    const g = withRivals();
    const theirs = shipOf(g, 'hollow-wake', 'survey');
    theirs.at = 'barnard';
    expect(knownView(world, g, 'sta').ships.some((s) => s.id === theirs.id)).toBe(false);
    capitalOf(g, 'sta').projects.push('deep-space-scanner');
    expect(knownView(world, g, 'sta').ships.some((s) => s.id === theirs.id)).toBe(true);
    // Wolf 359 is 7.9 ly from Sol, in range; Sirius, 8.6 ly, is not.
    theirs.at = 'wolf-359';
    expect(knownView(world, g, 'sta').ships.some((s) => s.id === theirs.id)).toBe(true);
    theirs.at = 'sirius';
    expect(knownView(world, g, 'sta').ships.some((s) => s.id === theirs.id)).toBe(false);
    theirs.at = null;
    theirs.blindJump = { from: 'wolf-1061', to: 'barnard', turns: 3, left: 2 };
    expect(knownView(world, g, 'sta').ships.some((s) => s.id === theirs.id)).toBe(false);
  });

  it('the scanner: 40 industry and 5 metals, upkeep 1, opened by Long-baseline arrays', () => {
    const p = PROJECTS['deep-space-scanner'];
    expect(p.cost).toEqual({ industry: 40, metals: 5, volatiles: 0, fuel: 0 });
    expect(p.upkeep).toBe(1);
    const g = withRivals();
    const item = { kind: 'project', project: 'deep-space-scanner' } as const;
    expect(queueRefusal(world, g, capitalOf(g, 'sta'), item)).toBe('Needs Long-baseline arrays.');
    knowing(g, 'sta', 'long-baseline-arrays');
    expect(queueRefusal(world, g, capitalOf(g, 'sta'), item)).toBeNull();
  });

  it('the standings: yours in full, theirs as far as you see, and technologies only yours', () => {
    const g = withRivals();
    expect(standings(knownView(world, g, 'sta'), 'sta').map((s) => s.faction)).toEqual(['sta']);
    markSurveyed(powerOf(g, 'sta'), 'tau-ceti');
    const rows = standings(knownView(world, g, 'sta'), 'sta');
    expect(rows.map((s) => s.faction)).toEqual(['sta', 'frontier']);
    expect(rows[0]).toMatchObject({ colonies: 1, outposts: 0, people: capitalOf(g, 'sta').people, technologies: 0 });
    expect(rows[1]).toMatchObject({ colonies: 1, lanes: 2, technologies: null });
  });
});

describe('the Watch (§26.3)', () => {
  it('tells of a colony founded, a lane opened and a ship come into sight, where you can see them', () => {
    const before = withRivals();
    markSurveyed(powerOf(before, 'sta'), 'tau-ceti');
    const after = structuredClone(before);
    const h = makeHolding(after, {
      owner: 'frontier',
      kind: 'colony',
      system: 'tau-ceti',
      body: 'tau-ceti-f',
      capital: false,
      people: 10,
    });
    after.lanes.push({ id: 'tau-ceti~van-maanens-star', owner: 'frontier', status: 'open' });
    const ship = makeShip(after, 'hollow-wake', 'survey', 'sol');
    // Unseen: an outpost where the player has not surveyed.
    makeHolding(after, {
      owner: 'hollow-wake',
      kind: 'outpost',
      system: 'gj-581',
      body: 'gj-581-b',
      capital: false,
      people: 0,
    });
    const news = watchNews(world, before, after, 'sta');
    expect(news).toEqual([
      {
        kind: 'rival-founded',
        faction: 'frontier',
        holding: h.id,
        system: 'tau-ceti',
        body: 'tau-ceti-f',
        colony: true,
      },
      { kind: 'rival-lane', faction: 'frontier', lane: 'tau-ceti~van-maanens-star' },
      { kind: 'rival-ship', faction: 'hollow-wake', ship: ship.id, type: 'survey', system: 'sol' },
    ]);
    // A ship still in sight next turn is not news again.
    expect(watchNews(world, after, structuredClone(after), 'sta')).toEqual([]);
    const lines = adviceFor(world, after, 'sta', news, []);
    expect(lines.find((l) => l.department === 'watch')?.text).toBe(
      'Control, the Frontier Co-op has founded a colony on Tau Ceti f.',
    );
  });

  it('speaks in each power’s voice', () => {
    const g = withRivals(42, 'frontier');
    const lines = adviceFor(
      world,
      g,
      'frontier',
      [{ kind: 'rival-ship', faction: 'hollow-wake', ship: 9, type: 'colony', system: 'tau-ceti' }],
      [],
    );
    expect(lines[0]?.text).toBe('Control, we’ve spotted a Hollow Wake colony ship at Tau Ceti.');
  });
});

describe('meeting without war (§26.4)', () => {
  it('a held world cannot be settled by another; two powers may hold different worlds in one system', () => {
    let g = withRivals();
    markSurveyed(powerOf(g, 'sta'), 'tau-ceti');
    const ours = shipOf(g, 'sta', 'outpost');
    ours.at = 'tau-ceti';
    expect(refuse(world, g, 'sta', { type: 'found-outpost', ship: ours.id, body: 'tau-ceti-e' })).toBe(
      'Tau Ceti e already has a Frontier Co-op colony on it.',
    );
    g = order(g, 'sta', { type: 'found-outpost', ship: ours.id, body: 'tau-ceti-h' });
    const next = resolveTurn(world, g).state;
    expect(next.holdings.find((h) => h.body === 'tau-ceti-h')?.owner).toBe('sta');
    expect(next.holdings.find((h) => h.body === 'tau-ceti-e')?.owner).toBe('frontier');
  });

  it('a power’s lanes are closed to the others’ ships, and a refusal names their owner', () => {
    const g = withRivals();
    expect(findRoute(world, g, 'sta', 'tau-ceti', 'yz-ceti')).toBeNull();
    expect(findRoute(world, g, 'frontier', 'tau-ceti', 'yz-ceti')).not.toBeNull();
    makeHolding(g, {
      owner: 'sta',
      kind: 'outpost',
      system: 'tau-ceti',
      body: 'tau-ceti-h',
      capital: false,
      people: 0,
    });
    markSurveyed(powerOf(g, 'sta'), 'tau-ceti');
    const outpost = g.holdings.find((h) => h.owner === 'sta' && h.system === 'tau-ceti') as Holding;
    expect(refuse(world, g, 'sta', { type: 'queue', holding: outpost.id, item: { kind: 'lane', to: 'yz-ceti' } })).toBe(
      'The Frontier Co-op’s lane to YZ Ceti is already open, closed to your ships.',
    );
  });

  it('a dark lane is relit by whoever pays first; the other is told whose it is', () => {
    let g = withRivals(42, null);
    // Both powers queue the same dark lane, from outposts at either end, with the industry to pay.
    const a = makeHolding(g, {
      owner: 'sta',
      kind: 'outpost',
      system: 'epsilon-eridani',
      body: 'eps-eri-b',
      capital: false,
      people: 0,
    });
    const b = makeHolding(g, {
      owner: 'frontier',
      kind: 'outpost',
      system: 'sirius',
      body: 'sirius-b',
      capital: false,
      people: 0,
    });
    for (const f of ['sta', 'frontier'] as const) {
      markSurveyed(powerOf(g, f), 'epsilon-eridani');
      markSurveyed(powerOf(g, f), 'sirius');
      powerOf(g, f).controller = 'player';
      powerOf(g, f).stockpile = { metals: 100, volatiles: 100, fuel: 100 };
    }
    g = order(g, 'sta', { type: 'queue', holding: a.id, item: { kind: 'lane', to: 'sirius' } });
    g = order(g, 'frontier', { type: 'queue', holding: b.id, item: { kind: 'lane', to: 'epsilon-eridani' } });
    for (const h of g.holdings) if (h.id === a.id || h.id === b.id) h.industry = 500;
    const r = resolveTurn(world, g);
    expect(r.state.lanes.find((l) => l.id === 'epsilon-eridani~sirius')?.owner).toBe('sta');
    expect(r.reports.find((x) => x.faction === 'frontier')?.events).toContainEqual({
      kind: 'lane-refused',
      holding: b.id,
      to: 'epsilon-eridani',
      reason: 'The Transit Authority’s lane to Epsilon Eridani is being tuned, closed to your ships.',
    });
  });

  it('a star’s beacon slots are shared by every power’s lanes there', () => {
    const g = withRivals();
    // Luyten 726-8's three slots hold the Cooperative's lanes: no one else can anchor a lane there.
    const ours = makeHolding(g, {
      owner: 'sta',
      kind: 'outpost',
      system: 'luyten-726-8',
      body: 'luyten-726-8:1',
      capital: false,
      people: 0,
    });
    markSurveyed(powerOf(g, 'sta'), 'luyten-726-8');
    expect(refuse(world, g, 'sta', { type: 'queue', holding: ours.id, item: { kind: 'lane', to: 'yz-ceti' } })).toMatch(
      /No free beacon slot at Luyten 726-8|already open/,
    );
  });
});

describe('the headless games (§26.6)', () => {
  const play = (seed: number, turns: number) => {
    let g = withRivals(seed, null);
    const debt = new Map<FactionId, number>();
    let longestDebt = 0;
    for (let t = 0; t < turns; t++) {
      g = resolveTurn(world, g).state;
      const problems = [...shapeProblems(g), ...stateProblems(world, g)];
      if (problems.length > 0) throw new Error(`seed ${seed}, turn ${g.turn}: ${problems.join('; ')}`);
      for (const p of g.powers) {
        const d = p.treasury < 0 ? (debt.get(p.faction) ?? 0) + 1 : 0;
        debt.set(p.faction, d);
        longestDebt = Math.max(longestDebt, d);
      }
    }
    // The turn after the last, timed three times, the fastest kept: the machine's other work aside.
    let lastTurnMs = Number.POSITIVE_INFINITY;
    for (let i = 0; i < 3; i++) {
      const t0 = performance.now();
      resolveTurn(world, g);
      lastTurnMs = Math.min(lastTurnMs, performance.now() - t0);
    }
    return { g, lastTurnMs, longestDebt };
  };

  for (const seed of [42, 7, 2176]) {
    it(`seed ${seed}: 100 turns of three rivals, with no crash, hunger or lasting debt, within the budgets`, () => {
      const { g, lastTurnMs, longestDebt } = play(seed, 100);
      for (const p of g.powers) {
        const held = g.holdings.filter((h) => h.owner === p.faction);
        expect(held.filter((h) => h.kind === 'colony').length, p.faction).toBeGreaterThanOrEqual(3);
        expect(held.filter((h) => h.kind === 'outpost').length, p.faction).toBeGreaterThanOrEqual(3);
        expect(
          held.reduce((n, h) => n + h.people, 0),
          p.faction,
        ).toBeGreaterThan(capitalOf(withRivals(), p.faction).people * 2);
        expect(
          held.every((h) => h.hungry <= 2),
          p.faction,
        ).toBe(true);
        expect(p.researched.length, p.faction).toBeGreaterThanOrEqual(8);
      }
      expect(longestDebt).toBeLessThanOrEqual(5);
      // Credits are for spending (§29.1): no rival banks a fortune.
      for (const p of g.powers) expect(p.treasury, p.faction).toBeLessThanOrEqual(600);
      expect(lastTurnMs).toBeLessThan(200);
      expect(JSON.stringify(g).length).toBeLessThan(200_000);
    }, 120_000);
  }

  it('the same seed plays the same game', () => {
    expect(JSON.stringify(play(7, 40).g)).toBe(JSON.stringify(play(7, 40).g));
  }, 120_000);
});
