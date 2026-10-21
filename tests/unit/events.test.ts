import { describe, expect, it } from 'vitest';
import type { Zone } from '../../src/content/districts.ts';
import { EVENT_IDS, type EventId } from '../../src/content/events.ts';
import type { FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { adviceFor } from '../../src/sim/advice.ts';
import { aiOrders } from '../../src/sim/ai.ts';
import { approvalOf, capacityOf, foodOf, growthOf, industryOf, queueRefusal } from '../../src/sim/economy.ts';
import { drawEvent, resolveEvents, rivalChoice, subjectsFor } from '../../src/sim/events.ts';
import { needsOf } from '../../src/sim/needs.ts';
import { applyOrder, refuse } from '../../src/sim/orders.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import {
  type GameState,
  type Holding,
  makeHolding,
  markSurveyed,
  newGame,
  type PendingEvent,
  powerOf,
  STATE_VERSION,
} from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** Events (M2_WORLDS.md §27, D-38). */

const world = buildWorld(SKY);
const E = RULES.events;
const start = (seed = 42) => newGame(world, { seed, powers: [{ faction: 'sta', controller: 'player' }] });
const withRivals = () =>
  newGame(world, {
    seed: 42,
    powers: [
      { faction: 'sta', controller: 'player' },
      { faction: 'frontier', controller: 'ai' },
    ],
  });
const capital = (g: GameState, f: FactionId = 'sta') => g.holdings.find((h) => h.owner === f && h.capital) as Holding;
/** A colony on Proxima b, a tolerable world exposed to the flares of V645 Cen. */
const proxima = (g: GameState, people = 20, zones: Zone[] = ['farms', 'works']) =>
  makeHolding(g, {
    owner: 'sta',
    kind: 'colony',
    system: 'alpha-centauri',
    body: 'proxima-cen-b',
    capital: false,
    people,
    districts: zones.map((zone, i) => ({ zone, slot: i + 1 })),
  });
/** An event waiting, as if it came this turn. */
const waiting = (g: GameState, id: EventId, subject: Partial<PendingEvent> = {}, f: FactionId = 'sta') => {
  powerOf(g, f).event = {
    id,
    turn: g.turn,
    holding: null,
    system: null,
    lane: null,
    ship: null,
    answer: null,
    ...subject,
  };
  return g;
};
/** The events' step of a turn's end, alone; what each power was told. */
const settle = (g: GameState) => {
  const events = new Map(g.powers.map((p) => [p.faction, [] as ReportEvent[]]));
  resolveEvents(world, g, events);
  return events;
};
const answer = (g: GameState, choice: 0 | 1) => {
  const r = applyOrder(world, g, 'sta', { type: 'answer', choice });
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};

describe('when an event comes (§27.1)', () => {
  it('none before turn 5, then about one turn in eight, never within six turns of the last', () => {
    const g = start();
    g.turn = 3;
    expect(drawEvent(world, g, 'sta')).toBeNull();
    let hits = 0;
    for (let turn = 4; turn < 804; turn++) {
      if (turn % 40 === 0) continue;
      g.turn = turn;
      if (drawEvent(world, g, 'sta')) hits++;
    }
    expect(hits).toBeGreaterThan(70);
    expect(hits).toBeLessThan(130);
    g.turn = 20;
    powerOf(g, 'sta').lastEvent = 17;
    for (let turn = 15; turn < 21; turn++) {
      g.turn = turn;
      expect(drawEvent(world, g, 'sta')).toBeNull();
    }
  });

  it('Founders’ Day comes every 40 turns by the calendar, unless an event is waiting', () => {
    const g = start();
    g.turn = 40;
    expect(drawEvent(world, g, 'sta')).toMatchObject({ id: 'founders-day', turn: 41 });
    g.turn = 80;
    powerOf(g, 'sta').lastEvent = 79;
    expect(drawEvent(world, g, 'sta')?.id).toBe('founders-day');
    waiting(g, 'smugglers');
    expect(drawEvent(world, g, 'sta')).toBeNull();
  });

  it('the same seed brings the same events, and each comes once with what needs you', () => {
    const run = (seed: number) => {
      let g = start(seed);
      const seen: string[] = [];
      for (let t = 0; t < 60; t++) {
        const r = resolveTurn(world, g);
        g = r.state;
        for (const e of r.reports[0]?.events ?? []) if (e.kind === 'event') seen.push(`${g.turn}:${e.event}`);
      }
      return seen;
    };
    const a = run(7);
    expect(a.length).toBeGreaterThan(0);
    expect(run(7)).toEqual(a);
  });
});

describe('the twelve (§27.2)', () => {
  it('each comes only where it fits', () => {
    const g = start();
    // At the start: the capital's system, its farms and works, its 4 million, its lanes, and anything;
    // no harvest, as the food store starts full.
    const fits = (id: EventId) => subjectsFor(world, g, 'sta', id).length > 0;
    expect(EVENT_IDS.filter(fits)).toEqual([
      'comet',
      'blight',
      'strike',
      'epidemic',
      'lane-drift',
      'smugglers',
      'founders-day',
    ]);
    powerOf(g, 'sta').food = 0;
    expect(fits('harvest')).toBe(true);
    expect(subjectsFor(world, g, 'sta', 'comet')).toEqual([{ holding: null, system: 'sol', lane: null, ship: null }]);
    const p = proxima(g);
    expect(subjectsFor(world, g, 'sta', 'flare')).toEqual([
      { holding: p.id, system: 'alpha-centauri', lane: null, ship: null },
    ]);
    p.projects.push('flare-shield');
    expect(subjectsFor(world, g, 'sta', 'flare')).toEqual([]);
    // An epidemic needs 3 million and no medical centre; the capital has 4 million.
    expect(subjectsFor(world, g, 'sta', 'epidemic').map((s) => s.holding)).toEqual([capital(g).id]);
    capital(g).projects.push('medical-centre');
    expect(subjectsFor(world, g, 'sta', 'epidemic')).toEqual([]);
    // A derelict where a survey ship of yours is, in a surveyed system no one holds.
    const ship = g.ships.find((s) => s.type === 'survey') as NonNullable<GameState['ships'][number]>;
    ship.at = 'barnard';
    expect(subjectsFor(world, g, 'sta', 'derelict')).toEqual([]);
    markSurveyed(powerOf(g, 'sta'), 'barnard');
    expect(subjectsFor(world, g, 'sta', 'derelict')).toEqual([
      { holding: null, system: 'barnard', lane: null, ship: null },
    ]);
    // A petition from a full colony with a shipyard.
    expect(subjectsFor(world, g, 'sta', 'petition')).toEqual([]);
    p.projects.push('shipyard');
    p.people = capacityOf(world, g, p);
    expect(subjectsFor(world, g, 'sta', 'petition').map((s) => s.holding)).toEqual([p.id]);
  });

  it('defectors: another power’s survey ship you can see', () => {
    const g = withRivals();
    const theirs = g.ships.find((s) => s.owner === 'frontier' && s.type === 'survey') as NonNullable<
      GameState['ships'][number]
    >;
    expect(subjectsFor(world, g, 'sta', 'defectors')).toEqual([]);
    theirs.at = 'sol';
    expect(subjectsFor(world, g, 'sta', 'defectors')).toEqual([
      { holding: null, system: 'sol', lane: null, ship: theirs.id },
    ]);
  });

  it('flare: shelter stops its industry for a turn; riding it out loses 2 tenths of its people', () => {
    let g = start();
    const p = proxima(g);
    g = answer(waiting(g, 'flare', { holding: p.id, system: 'alpha-centauri' }), 0);
    settle(g);
    const h = g.holdings.find((x) => x.id === p.id) as Holding;
    expect(industryOf(world, g, h)).toEqual({ total: 0, parts: [{ label: 'sheltering from a flare', value: 0 }] });
    settle(g);
    expect(industryOf(world, g, h).total).toBeGreaterThan(0);
    g = answer(waiting(g, 'flare', { holding: p.id, system: 'alpha-centauri' }), 1);
    settle(g);
    expect(g.holdings.find((x) => x.id === p.id)?.people).toBe(20 - E.flarePeople);
  });

  it('comet, harvest, derelict and smugglers: credits, stock, food and research as each choice says', () => {
    let g = start();
    const p = powerOf(g, 'sta');
    const before = { ...p.stockpile, treasury: p.treasury };
    g = answer(waiting(g, 'comet', { system: 'sol' }), 0);
    settle(g);
    expect(powerOf(g, 'sta').stockpile.volatiles).toBe(before.volatiles + E.cometVolatiles);
    expect(powerOf(g, 'sta').treasury).toBe(before.treasury - E.cometCredits);
    g = answer(waiting(g, 'comet', { system: 'sol' }), 1);
    powerOf(g, 'sta').researchQueue = ['deep-survey'];
    settle(g);
    expect(powerOf(g, 'sta').techProgress['deep-survey']).toBe(E.cometResearch);
    powerOf(g, 'sta').food = 0;
    g = answer(waiting(g, 'harvest', { holding: capital(g).id, system: 'sol' }), 0);
    settle(g);
    expect(powerOf(g, 'sta').food).toBe(RULES.food.storePerColony);
    const credits = powerOf(g, 'sta').treasury;
    g = answer(waiting(g, 'smugglers'), 0);
    settle(g);
    expect(powerOf(g, 'sta').treasury).toBe(credits - E.smugglersCredits);
    expect(powerOf(g, 'sta').stockpile.fuel).toBe(before.fuel + E.smugglersFuel);
    g = answer(waiting(g, 'derelict', { system: 'sol' }), 0);
    // Sol is held, so no derelict could be there: it has passed.
    expect(settle(g).get('sta')).toContainEqual({
      kind: 'event-gone',
      event: 'derelict',
      holding: null,
      system: 'sol',
      lane: null,
      ship: null,
    });
  });

  it('blight, a strike and an epidemic leave lasting effects that run out', () => {
    let g = start();
    const h = capital(g);
    const farms = foodOf(world, g, h).made.total;
    g = answer(waiting(g, 'blight', { holding: h.id, system: 'sol' }), 1);
    settle(g);
    const colony = () => g.holdings.find((x) => x.id === h.id) as Holding;
    expect(foodOf(world, g, colony()).made.total).toBeLessThan(farms);
    for (let i = 0; i < E.blightLong; i++) settle(g);
    expect(foodOf(world, g, colony()).made.total).toBe(farms);

    g = answer(waiting(g, 'strike', { holding: h.id, system: 'sol' }), 1);
    settle(g);
    expect(industryOf(world, g, colony()).total).toBe(0);
    expect(approvalOf(world, g, colony()).parts).toContainEqual({ label: 'a strike', value: E.strikeApproval });
    settle(g);
    settle(g);
    expect(industryOf(world, g, colony()).total).toBeGreaterThan(0);

    colony().people = 30;
    g = answer(waiting(g, 'epidemic', { holding: h.id, system: 'sol' }), 1);
    settle(g);
    expect(growthOf(world, g, colony())).toBe(0);
    expect(approvalOf(world, g, colony()).parts).toContainEqual({ label: 'quarantine', value: E.quarantineApproval });
    const credits = powerOf(g, 'sta').treasury;
    g = answer(waiting(g, 'epidemic', { holding: h.id, system: 'sol' }), 0);
    settle(g);
    expect(powerOf(g, 'sta').treasury).toBe(credits - E.epidemicCredits);
  });

  it('lane drift: retuned from the stockpile, or closed while it is retuned', () => {
    let g = start();
    const lane = 'alpha-centauri~sol';
    powerOf(g, 'sta').stockpile = { metals: 0, volatiles: 0, fuel: 0 };
    waiting(g, 'lane-drift', { lane, system: 'alpha-centauri' });
    expect(refuse(world, g, 'sta', { type: 'answer', choice: 0 })).toBe(
      `Retuning needs ${E.driftFuel} fusion fuel and ${E.driftMetals} metals in the stockpile.`,
    );
    g = answer(g, 1);
    settle(g);
    expect(g.lanes.find((l) => l.id === lane)).toEqual({
      id: lane,
      owner: 'sta',
      status: 'building',
      left: E.driftTurns,
    });
  });

  it('a petition granted: a colony ship and a million people gone; refused: approval −5 there', () => {
    let g = start();
    const p = proxima(g, 50);
    p.projects.push('shipyard');
    p.people = capacityOf(world, g, p);
    const people = p.people;
    const ships = g.ships.length;
    g = answer(waiting(g, 'petition', { holding: p.id, system: 'alpha-centauri' }), 0);
    settle(g);
    expect(g.ships).toHaveLength(ships + 1);
    expect(g.ships.at(-1)).toMatchObject({ type: 'colony', at: 'alpha-centauri', owner: 'sta' });
    expect(g.holdings.find((x) => x.id === p.id)?.people).toBe(people - E.petitionPeople);
    g = answer(waiting(g, 'petition', { holding: p.id, system: 'alpha-centauri' }), 1);
    (g.holdings.find((x) => x.id === p.id) as Holding).people = people;
    settle(g);
    expect(approvalOf(world, g, g.holdings.find((x) => x.id === p.id) as Holding).parts).toContainEqual({
      label: 'a refused petition',
      value: E.petitionApproval,
    });
  });

  it('defectors welcomed: the ship changes sides, and its old power is told', () => {
    let g = withRivals();
    const theirs = g.ships.find((s) => s.owner === 'frontier' && s.type === 'survey') as NonNullable<
      GameState['ships'][number]
    >;
    theirs.at = 'sol';
    g = answer(waiting(g, 'defectors', { ship: theirs.id, system: 'sol' }), 0);
    const told = settle(g);
    expect(g.ships.find((s) => s.id === theirs.id)?.owner).toBe('sta');
    expect(told.get('frontier')).toContainEqual({ kind: 'defected', ship: theirs.name, to: 'sta', system: 'sol' });
  });

  it('Founders’ Day: a festival lifts every colony for three turns', () => {
    let g = start();
    const p = proxima(g);
    g = answer(waiting(g, 'founders-day'), 0);
    settle(g);
    for (const h of [capital(g), g.holdings.find((x) => x.id === p.id) as Holding])
      expect(approvalOf(world, g, h).parts).toContainEqual({ label: 'Founders’ Day', value: E.foundersApproval });
  });
});

describe('answering (§27.1, §27.4)', () => {
  it('waits in what needs you, and takes its first choice after three turns unanswered', () => {
    const g = waiting(start(), 'smugglers');
    expect(needsOf(world, g, 'sta')[0]).toEqual({
      kind: 'event',
      event: 'smugglers',
      holding: null,
      system: null,
      left: 3,
    });
    expect(settle(g).get('sta')).toEqual([]);
    g.turn++;
    settle(g);
    g.turn++;
    const told = settle(g).get('sta');
    expect(told).toContainEqual({
      kind: 'event-answered',
      event: 'smugglers',
      choice: 0,
      auto: true,
      holding: null,
      system: null,
      lane: null,
      ship: null,
    });
    expect(powerOf(g, 'sta').event).toBeNull();
  });

  it('an answer may be changed until the turn ends; the advisor of its department speaks of it', () => {
    let g = waiting(start(), 'strike', { holding: 1, system: 'sol' });
    g = answer(answer(g, 0), 1);
    expect(powerOf(g, 'sta').event?.answer).toBe(1);
    expect(needsOf(world, g, 'sta').some((n) => n.kind === 'event')).toBe(false);
    const fresh = waiting(start(), 'strike', { holding: 1, system: 'sol' });
    const line = adviceFor(world, fresh, 'sta', [], needsOf(world, fresh, 'sta')).find((l) => l.kind === 'event');
    expect(line).toMatchObject({
      department: 'works',
      event: true,
      text: 'Control, a strike at Earth requires your decision.',
    });
    expect(refuse(world, start(), 'sta', { type: 'answer', choice: 0 })).toBe('No event waits for your answer.');
  });

  it('a rival answers with its orders: the first choice when it can pay and keep 20 credits', () => {
    const g = withRivals();
    waiting(g, 'strike', { holding: capital(g, 'frontier').id, system: 'tau-ceti' }, 'frontier');
    powerOf(g, 'frontier').treasury = 100;
    expect(aiOrders(world, g, 'frontier')).toContainEqual({ type: 'answer', choice: 0 });
    powerOf(g, 'frontier').treasury = 30;
    expect(rivalChoice(g, 'frontier')).toBe(1);
  });
});

describe('the flare shield (§27.5)', () => {
  it('opens with Magnetics and stands only on a world exposed to flares', () => {
    const g = start();
    const item = { kind: 'project', project: 'flare-shield' } as const;
    const p = proxima(g);
    expect(queueRefusal(world, g, p, item)).toBe('Needs Magnetics.');
    powerOf(g, 'sta').researched.push('magnetics');
    expect(queueRefusal(world, g, p, item)).toBeNull();
    expect(queueRefusal(world, g, capital(g), item)).toBe('Only on a world exposed to its star’s flares.');
  });
});

describe('saves', () => {
  it('a version 8 game gains no event, none before and nothing lasting', () => {
    const g = start() as unknown as Record<string, unknown>;
    const powers = (g.powers as Record<string, unknown>[]).map(({ event, lastEvent, lasting, ...p }) => p);
    const raw = {
      format: SAVE_FORMAT,
      version: 1,
      savedAt: '2026-10-21T00:00:00Z',
      game: { ...g, version: 8, powers },
    };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(powerOf(loaded, 'sta')).toMatchObject({ event: null, lastEvent: 0, lasting: [] });
  });
});
