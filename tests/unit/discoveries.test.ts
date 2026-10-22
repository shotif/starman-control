import { describe, expect, it } from 'vitest';
import type { FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SPECIES } from '../../src/content/species.ts';
import { TECH_IDS, TECHS, type TechId } from '../../src/content/techs.ts';
import { SKY } from '../../src/data/sky.ts';
import { adviceFor } from '../../src/sim/advice.ts';
import { type Body, bodiesOf } from '../../src/sim/bodies.ts';
import {
  deedDone,
  inspirationPoints,
  inspire,
  OBSERVATION_KINDS,
  observationPoints,
  observationsAt,
  observationWords,
  resolveInspirations,
} from '../../src/sim/discoveries.ts';
import { habitability } from '../../src/sim/habitability.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { type GameState, type Holding, makeHolding, newGame, powerOf, STATE_VERSION } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** Discoveries (M2B_SCIENCE.md §17, D-45): inspirations and observations of the real sky. */

const world = buildWorld(SKY);
const start = (faction: FactionId = 'sta') => newGame(world, { seed: 42, powers: [{ faction, controller: 'player' }] });
const capital = (g: GameState) => g.holdings.find((h) => h.capital) as Holding;
const done = (g: GameState, tech: TechId, events: ReportEvent[] = []) =>
  deedDone(world, g, 'sta', TECHS[tech].inspiration.deed, events);
/** The first body in the sky, by system, that passes a test. */
const findBody = (test: (b: Body) => boolean): Body => {
  for (const s of world.systems) {
    const b = bodiesOf(world, 42, s.id).find(test);
    if (b) return b;
  }
  throw new Error('no such body');
};
const colonyOn = (g: GameState, b: Body, people = 20) =>
  makeHolding(g, {
    owner: 'sta',
    kind: 'colony',
    system: b.systemId,
    body: b.id,
    capital: false,
    people,
    districts: [{ zone: 'farms', slot: 1 }],
  });

describe('inspirations (§17.1)', () => {
  it('every technology names a deed, worth 40% of its cost to the power now', () => {
    const g = start();
    const p = powerOf(g, 'sta');
    for (const id of TECH_IDS) {
      expect(TECHS[id].inspiration.text.length, id).toBeGreaterThan(5);
      expect(inspirationPoints(g, p, id)).toBe(Math.floor((TECHS[id].cost * 40) / 100));
    }
    expect(inspirationPoints(g, p, 'habitat-domes')).toBe(12);
    expect(inspirationPoints(g, p, 'magnetics')).toBe(24);
    expect(inspirationPoints(g, p, 'arcologies')).toBe(40);
    // With ten technologies known, Arcologies costs 180, and its inspiration 72 (§18.1).
    p.researched.push(...TECH_IDS.slice(0, 10));
    expect(inspirationPoints(g, p, 'arcologies')).toBe(72);
  });

  it('none is done at the start, for any power', () => {
    for (const f of ['sta', 'frontier', 'hollow-wake'] as const) {
      const g = newGame(world, {
        seed: 7,
        powers: [
          { faction: f, controller: 'player' },
          ...(['sta', 'frontier', 'hollow-wake'] as const)
            .filter((x) => x !== f)
            .map((x) => ({ faction: x, controller: 'ai' as const })),
        ],
      });
      for (const id of TECH_IDS)
        expect(deedDone(world, g, f, TECHS[id].inspiration.deed, []), `${f} ${id}`).toBe(false);
    }
  });

  it('deeds from the turn’s report: lanes paid for, a blind landing, surveys, an anomaly, an epidemic', () => {
    const g = start();
    const c = capital(g).id;
    expect(
      done(g, 'lane-engineering-1', [{ kind: 'lane-begun', holding: c, to: 'barnard', relight: true, turns: 2 }]),
    ).toBe(true);
    // Barnard's Star is 6 light-years from Sol: not 7.
    expect(
      done(g, 'lane-engineering-2', [{ kind: 'lane-begun', holding: c, to: 'barnard', relight: true, turns: 2 }]),
    ).toBe(false);
    expect(
      done(g, 'lane-engineering-2', [{ kind: 'lane-begun', holding: c, to: 'sirius', relight: false, turns: 4 }]),
    ).toBe(true);
    expect(done(g, 'jump-tuning', [{ kind: 'landed', ship: 1, system: 'barnard' }])).toBe(true);
    const surveyed = (system: string): ReportEvent => ({ kind: 'surveyed', ship: 1, system, worlds: 1, habitable: [] });
    expect(done(g, 'magnetics', [surveyed('wolf-359')])).toBe(true);
    expect(done(g, 'magnetics', [surveyed('sirius')])).toBe(false);
    const harsh = findBody((b) => habitability(b, SPECIES.human).level === 'harsh');
    expect(done(g, 'habitat-domes', [surveyed(harsh.systemId)])).toBe(true);
    expect(done(g, 'deep-survey', [{ kind: 'investigated', ship: 1, system: 'sol', anomaly: 'lost-surveys' }])).toBe(
      true,
    );
    const answered: ReportEvent = {
      kind: 'event-answered',
      event: 'epidemic',
      choice: 0,
      auto: false,
      holding: c,
      system: 'sol',
      lane: null,
      ship: null,
    };
    expect(done(g, 'medicine', [answered])).toBe(true);
    expect(done(g, 'medicine', [{ ...answered, event: 'flare' }])).toBe(false);
  });

  it('deeds from the state: holdings, ships, districts, the treasury, food and research', () => {
    const g = start();
    const p = powerOf(g, 'sta');
    // Outposts, and one on a world with fusion fuel.
    const fuel = findBody((b) => b.riches.fuel > 0);
    makeHolding(g, { owner: 'sta', kind: 'outpost', system: fuel.systemId, body: fuel.id, capital: false, people: 0 });
    expect(done(g, 'fusion-power')).toBe(true);
    expect(done(g, 'automated-mining')).toBe(false);
    const other = findBody((b) => b.id !== fuel.id && b.riches.metals > 0);
    makeHolding(g, {
      owner: 'sta',
      kind: 'outpost',
      system: other.systemId,
      body: other.id,
      capital: false,
      people: 0,
    });
    expect(done(g, 'automated-mining')).toBe(true);
    // Ships beyond the starting four.
    p.shipsBuilt = 6;
    expect(done(g, 'orbital-yards')).toBe(false);
    p.shipsBuilt = 7;
    expect(done(g, 'orbital-yards')).toBe(true);
    // The treasury, and high taxes with every colony content.
    p.treasury = 200;
    expect(done(g, 'lane-trade-2')).toBe(true);
    p.taxes = 'high';
    expect(done(g, 'shared-spaces')).toBe(true);
    expect(done(g, 'fair-taxation')).toBe(false);
    capital(g).projects.push('civic-centre');
    expect(done(g, 'fair-taxation')).toBe(true);
    p.taxes = 'standard';
    // Districts worked: farms at one colony, works across the power.
    const cap = capital(g);
    cap.districts = cap.districts.map((d) => (d.zone === 'mines' ? { ...d, zone: 'farms' } : d));
    expect(done(g, 'soil-science')).toBe(true);
    expect(done(g, 'automation')).toBe(false);
    cap.districts = cap.districts.map((d) => (d.zone === 'labs' || d.zone === 'market' ? { ...d, zone: 'works' } : d));
    expect(done(g, 'automation')).toBe(true);
    expect(done(g, 'computing')).toBe(false);
    // A full colony, food and research.
    expect(done(g, 'arcologies')).toBe(false);
    cap.people = 120;
    expect(done(g, 'arcologies')).toBe(true);
    expect(done(g, 'soil-science-2')).toBe(false);
    expect(done(g, 'computing-2')).toBe(false);
    // A deep mine; systems surveyed.
    cap.projects.push('mine');
    expect(done(g, 'deep-boring-2')).toBe(true);
    p.surveyed = world.systems.slice(0, 11).map((s) => s.id);
    expect(done(g, 'long-baseline-arrays')).toBe(true);
    expect(done(g, 'long-range-sensors')).toBe(false);
  });

  it('a colony’s world: cold, of low or high gravity, warm or hot, harsh; three colonies; far from home', () => {
    const g = start();
    expect(done(g, 'adaptation-1')).toBe(false);
    colonyOn(
      g,
      findBody((b) => b.temperature === 'cold' && b.kind === 'rocky'),
    );
    expect(done(g, 'adaptation-1')).toBe(true);
    colonyOn(
      g,
      findBody((b) => b.gravity === 'low' && b.kind === 'rocky'),
    );
    expect(done(g, 'adaptation-2')).toBe(true);
    expect(done(g, 'colonial-charters')).toBe(false);
    colonyOn(
      g,
      findBody((b) => b.temperature === 'hot' && b.kind === 'rocky'),
    );
    expect(done(g, 'adaptation-3')).toBe(true);
    expect(done(g, 'colonial-charters')).toBe(true);
    // None of them is on a lane from Sol.
    expect(done(g, 'regional-administration')).toBe(false);
  });

  it('pay once, towards the technology, finishing it only when what it needs is known', () => {
    const g = start();
    const p = powerOf(g, 'sta');
    // Magnetics needs Habitat domes: its 24 points wait, and its progress stops a point short.
    p.techProgress.magnetics = 50;
    expect(inspire(g, p, 'magnetics')).toEqual({ points: 24, finished: false });
    expect(p.techProgress.magnetics).toBe(59);
    // Habitat domes needs nothing: 12 on 20 finishes its 30, and it leaves the queue.
    p.researchQueue = ['habitat-domes'];
    p.techProgress['habitat-domes'] = 20;
    expect(inspire(g, p, 'habitat-domes')).toEqual({ points: 12, finished: true });
    expect(p.researched).toEqual(['habitat-domes']);
    expect(p.researchQueue).toEqual([]);
    expect(p.techProgress['habitat-domes']).toBeUndefined();
    expect(p.inspired).toEqual(['magnetics', 'habitat-domes']);
  });

  it('as the turn ends: an inspiration line once, and none for what is already researched', () => {
    const g = start();
    const p = powerOf(g, 'sta');
    p.researched.push('lane-trade-2');
    p.treasury = 250;
    const fuel = findBody((b) => b.riches.fuel > 0);
    makeHolding(g, { owner: 'sta', kind: 'outpost', system: fuel.systemId, body: fuel.id, capital: false, people: 0 });
    const events = new Map<FactionId, ReportEvent[]>([['sta', []]]);
    resolveInspirations(world, g, events);
    // One technology known: Fusion power costs 64 (60, and 8% of it), and its inspiration 25.
    expect(events.get('sta')).toEqual([{ kind: 'inspired', tech: 'fusion-power', points: 25 }]);
    expect(p.techProgress['fusion-power']).toBe(25);
    const again = new Map<FactionId, ReportEvent[]>([['sta', []]]);
    resolveInspirations(world, g, again);
    expect(again.get('sta')).toEqual([]);
    // In a turn, with its advisor's line.
    const r = resolveTurn(world, g);
    expect(r.reports[0]?.events.some((e) => e.kind === 'inspired')).toBe(false);
    const h = start();
    makeHolding(h, { owner: 'sta', kind: 'outpost', system: fuel.systemId, body: fuel.id, capital: false, people: 0 });
    const t = resolveTurn(world, h);
    const line = t.reports[0]?.events.find((e) => e.kind === 'inspired');
    expect(line).toEqual({ kind: 'inspired', tech: 'fusion-power', points: 24 });
    const said = adviceFor(world, t.state, 'sta', [line as ReportEvent], [], 'speak');
    expect(said[0]?.text).toBe(
      'Control, an outpost on a world with fusion fuel has taught us something of Fusion power: 24 research towards it.',
    );
  });
});

describe('observations of the real sky (§17.2)', () => {
  it('as many systems as the sky data holds, each worth its points', () => {
    const count = (k: string) => world.systems.filter((s) => observationsAt(world, s.id).includes(k as never)).length;
    // The census: 45 with a brown dwarf (44 of type L, T or Y, and CWISE 1055+5443, a subdwarf of
    // type T), 47 with planets (the 46 the archives list, and Sol's eight). The shell (§18 of
    // M3_NEIGHBOURS.md) adds 8 white dwarfs, AU Microscopii's disc, 28 brown dwarfs and 20 systems
    // with planets; its flare stars are not marked (Reborn's ten are), nor has it three stars together.
    expect(OBSERVATION_KINDS.map(count)).toEqual([19, 9, 73, 9, 67, 8]);
    expect(observationsAt(world, 'sirius')).toEqual(['white-dwarf']);
    expect(observationsAt(world, 'alpha-centauri')).toEqual(['disc', 'flare-star', 'planets', 'many-stars']);
    expect(observationPoints(start(), 'sta', observationsAt(world, 'alpha-centauri'))).toBe(45);
    expect(observationsAt(world, 'luhman-16')).toEqual(['brown-dwarf']);
    expect(observationPoints(start(), 'sta', ['white-dwarf', 'brown-dwarf'])).toBe(
      RULES.discoveries.observations['white-dwarf'] + RULES.discoveries.observations['brown-dwarf'],
    );
  });

  it('say what is real', () => {
    expect(observationWords(world, 'sirius', 'white-dwarf')).toBe(
      'Sirius B is a white dwarf, the hot, dense core left when a star has shed its outer layers',
    );
    expect(observationWords(world, 'luhman-16', 'brown-dwarf')).toBe(
      'Luhman 16 A and Luhman 16 B are brown dwarfs, too small to sustain the hydrogen fusion that makes a star shine',
    );
    expect(observationWords(world, 'tau-ceti', 'planets')).toBe(
      'astronomers have found Tau Ceti e (contested), Tau Ceti f (contested), Tau Ceti g (contested) and Tau Ceti h (contested)',
    );
    expect(observationWords(world, 'epsilon-eridani', 'disc')).toBe(
      'astronomers have observed the Epsilon Eridani belts',
    );
    expect(observationsAt(world, 'sol')).toEqual(['disc', 'planets']);
    expect(observationWords(world, 'sol', 'planets')).toBe(
      'astronomers have found Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune',
    );
    expect(observationWords(world, 'alpha-centauri', 'many-stars')).toMatch(/^3 stars in one system: /);
  });

  it('pay on a first survey only, into the research queue, with a line labelled as observed', () => {
    let g = start('frontier');
    const ship = g.ships.find((s) => s.owner === 'frontier' && s.type === 'survey');
    if (!ship) throw new Error('no survey ship');
    ship.destinations = ['yz-ceti'];
    powerOf(g, 'frontier').researchQueue = ['deep-survey'];
    let r = resolveTurn(world, g);
    // YZ Ceti: a flare star and planets.
    expect(r.reports[0]?.events).toContainEqual({
      kind: 'observed',
      system: 'yz-ceti',
      found: ['flare-star', 'planets'],
      points: 20,
    });
    // 20 from the observation and the turn's 7, into Deep survey's 30.
    expect(powerOf(r.state, 'frontier').techProgress['deep-survey']).toBe(27);
    const said = adviceFor(
      world,
      r.state,
      'frontier',
      (r.reports[0]?.events ?? []).filter((e) => e.kind === 'observed'),
      [],
      'speak',
    );
    expect(said[0]).toMatchObject({ department: 'science', kind: 'observed', system: 'yz-ceti' });
    // Back home and out again: no second payment.
    g = r.state;
    const s2 = g.ships.find((s) => s.id === ship.id);
    if (!s2) throw new Error('lost the ship');
    s2.destinations = ['tau-ceti', 'yz-ceti'];
    for (let i = 0; i < 3; i++) {
      r = resolveTurn(world, g);
      g = r.state;
      expect(r.reports[0]?.events.some((e) => e.kind === 'observed' && e.system === 'yz-ceti')).toBe(false);
    }
  });
});

describe('saves', () => {
  it('a version 9 game has had no inspiration', () => {
    const g = start() as unknown as Record<string, unknown>;
    const powers = (g.powers as Record<string, unknown>[]).map(({ inspired, ...p }) => p);
    const raw = {
      format: SAVE_FORMAT,
      version: 1,
      savedAt: '2026-10-21T00:00:00Z',
      game: { ...g, version: 9, powers },
    };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(powerOf(loaded, 'sta').inspired).toEqual([]);
  });
});
