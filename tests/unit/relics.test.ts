import { describe, expect, it } from 'vitest';
import { FACTION_IDS, FACTIONS, type FactionId } from '../../src/content/factions.ts';
import { RELIC_KIND_IDS, REVELATIONS, revelationFor } from '../../src/content/relics.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { aiOrders, PERSONALITIES } from '../../src/sim/ai.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import { treasuryOf } from '../../src/sim/economy.ts';
import { govern } from '../../src/sim/governor.ts';
import { applyInPlace } from '../../src/sim/orders.ts';
import {
  chapterCost,
  digAt,
  excavate,
  excavateRefusal,
  KEPT_SITES,
  knownSites,
  placedSites,
  relicSites,
  resolveChapterChoices,
  resolveDigs,
  siteAt,
  splitResearch,
} from '../../src/sim/relics.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import {
  type GameState,
  makeHolding,
  makeShip,
  markSurveyed,
  newGame,
  type PowerState,
  powerOf,
  STATE_VERSION,
} from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { shapeProblems, stateProblems } from '../../src/sim/validate.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M5 increment 52 (M5_UNKNOWN.md §20, D-70): relic sites. */

const world = buildWorld(SKY);
const R = RULES.relics;
const five = (player: FactionId = 'sta'): GameState =>
  newGame(world, {
    seed: 42,
    powers: FACTION_IDS.map((faction) => ({
      faction,
      controller: faction === player ? ('player' as const) : ('ai' as const),
    })),
  });
const events = (g: GameState) => new Map(g.powers.map((p) => [p.faction, [] as ReportEvent[]]));
const sites = placedSites(world, 42);
/** A site's system, and an outpost of a power on its first free world. */
const outpostAt = (g: GameState, owner: FactionId, system: string) => {
  const body = bodiesOf(world, g.seed, system).find((b) => !g.holdings.some((h) => h.body === b.id));
  if (!body) throw new Error('no body');
  return makeHolding(g, { owner, kind: 'outpost', system, body: body.id, capital: false, people: 0 });
};
/** A power that knows a site, may excavate and holds an outpost there. */
const ready = (g: GameState, f: FactionId, system: string): PowerState => {
  const p = powerOf(g, f);
  markSurveyed(p, system);
  p.researched.push('relic-studies');
  outpostAt(g, f, system);
  return p;
};

describe('where the sites are (§20.1)', () => {
  it('twelve from the seed, the same each time, each kind twice, GJ 915 a quiet beacon', () => {
    expect(sites).toHaveLength(R.sites);
    expect(placedSites(world, 42)).toBe(sites);
    expect(placedSites(buildWorld(SKY), 42)).toEqual(sites);
    expect(placedSites(world, 7)).not.toEqual(sites);
    // And the kept ones besides (M5_UNKNOWN.md §28.2).
    expect(relicSites(world, 42)).toEqual([...sites, ...KEPT_SITES].sort((a, b) => (a.system < b.system ? -1 : 1)));
    for (const k of RELIC_KIND_IDS)
      expect(
        sites.filter((s) => s.kind === k),
        k,
      ).toHaveLength(2);
    expect(siteAt(world, 42, 'gj-915')?.kind).toBe('beacon');
  });

  it('never at or near a capital, within reach of one, apart, each with a world, many at white dwarfs', () => {
    const capitals = Object.values(FACTIONS).map((f) => f.capital.systemId);
    for (const s of sites) {
      expect(bodiesOf(world, 42, s.system).length, s.system).toBeGreaterThan(0);
      for (const c of capitals)
        expect(world.distanceDeci(c, s.system), s.system).toBeGreaterThanOrEqual(R.fromCapitalDeci);
      if (s.system !== R.always)
        expect(Math.min(...capitals.map((c) => world.distanceDeci(c, s.system))), s.system).toBeLessThanOrEqual(
          R.nearCapitalDeci,
        );
      for (const t of sites)
        if (t !== s) expect(world.distanceDeci(s.system, t.system)).toBeGreaterThanOrEqual(R.apartDeci);
    }
    const white = sites.filter((s) => world.system(s.system).sky.stars.some((x) => x.spectralType.startsWith('D')));
    expect(white.length).toBeGreaterThanOrEqual(4);
  });
});

describe('finding them (§20.2)', () => {
  it('a survey finds a site and says so; Relic studies shows those within 10 light-years of a holding, Old charts 20', () => {
    let g = five();
    const site = sites.find((s) => s.system === 'sirius');
    if (!site) throw new Error('no site at Sirius');
    expect(knownSites(world, g, 'sta')).toEqual([]);
    makeShip(g, 'sta', 'survey', 'sirius');
    const r = resolveTurn(world, g);
    g = r.state;
    const seen = r.reports
      .find((x) => x.faction === 'sta')
      ?.events.find((e) => e.kind === 'surveyed' && e.system === 'sirius');
    expect(seen).toMatchObject({ relic: site.kind });
    expect(knownSites(world, g, 'sta').map((s) => s.system)).toContain('sirius');

    const h = five();
    const within = (deci: number) =>
      sites.filter((s) => world.distanceDeci('sol', s.system) <= deci).map((s) => s.system);
    powerOf(h, 'sta').researched.push('relic-studies');
    expect(within(100).length).toBeGreaterThan(0);
    expect(knownSites(world, h, 'sta').map((s) => s.system)).toEqual(within(100));
    powerOf(h, 'sta').researched.push('old-charts');
    expect(within(200).length).toBeGreaterThan(within(100).length);
    expect(knownSites(world, h, 'sta').map((s) => s.system)).toEqual(within(200));
    const t = resolveTurn(world, h);
    expect(t.reports.find((x) => x.faction === 'sta')?.events).not.toContainEqual(
      expect.objectContaining({ kind: 'relics-charted' }),
    );
  });
});

describe('excavating (§20.3)', () => {
  it('needs the site known, Relic studies, a holding there, and no one else at it', () => {
    const g = five();
    const p = powerOf(g, 'sta');
    expect(excavateRefusal(world, g, 'sta', 'sirius')).toBe('There is no relic site known here.');
    markSurveyed(p, 'sirius');
    expect(excavateRefusal(world, g, 'sta', 'sirius')).toBe('Excavation needs Relic studies.');
    p.researched.push('relic-studies');
    expect(excavateRefusal(world, g, 'sta', 'sirius')).toMatch(/needs a colony or an outpost/);
    outpostAt(g, 'sta', 'sirius');
    expect(excavateRefusal(world, g, 'sta', 'sirius')).toBeNull();
    expect(applyInPlace(world, g, 'sta', { type: 'excavate', system: 'sirius' })).toBeNull();
    expect(excavateRefusal(world, g, 'sta', 'sirius')).toBe('We are excavating it already.');
    ready(g, 'frontier', 'sirius');
    expect(excavateRefusal(world, g, 'frontier', 'sirius')).toBe('The Transit Authority are excavating it.');
    const d = digAt(g, 'sirius');
    if (!d) throw new Error('no dig');
    d.by = null;
    d.chapters = 3;
    expect(excavateRefusal(world, g, 'frontier', 'sirius')).toBe('Every chapter of this site is done.');
    expect(applyInPlace(world, g, 'sta', { type: 'stop-excavation', system: 'sirius' })).toBe(
      'We are not excavating there.',
    );
  });

  it('takes the share of research, in equal parts, the odd points to the first; none with no excavation', () => {
    const g = five();
    const [a, b] = sites;
    if (!a || !b) throw new Error('sites');
    ready(g, 'sta', a.system);
    expect(splitResearch(g, 'sta', 101)).toEqual({ digs: [], rest: 101 });
    excavate(g, 'sta', a.system);
    ready(g, 'sta', b.system);
    excavate(g, 'sta', b.system);
    expect(splitResearch(g, 'sta', 101)).toEqual({
      digs: [
        { system: a.system, points: 13 },
        { system: b.system, points: 12 },
      ],
      rest: 76,
    });
    expect(applyInPlace(world, g, 'sta', { type: 'dig-share', share: 50 })).toBeNull();
    expect(splitResearch(g, 'sta', 100).rest).toBe(50);
    expect(applyInPlace(world, g, 'sta', { type: 'dig-share', share: 0 })).toBeNull();
    expect(splitResearch(g, 'sta', 100)).toEqual({ digs: [], rest: 100 });
    expect(applyInPlace(world, g, 'sta', { type: 'dig-share', share: 30 as 25 })).toBe('There is no such share.');
  });

  it('a chapter done waits for its choice and brings the next revelation; Field archaeology needs a fifth less', () => {
    const g = five();
    const site = sites[0];
    if (!site) throw new Error('sites');
    const p = ready(g, 'sta', site.system);
    excavate(g, 'sta', site.system);
    p.digShare = 50;
    expect(chapterCost(g, 'sta', 0)).toBe(100);
    const ev = events(g);
    const rest = resolveDigs(g, new Map([['sta', 220]]), ev);
    expect(rest.get('sta')).toBe(110);
    expect(digAt(g, site.system)).toMatchObject({ chapters: 1, progress: 10, waiting: g.turn });
    expect(p.chapters).toBe(1);
    expect(ev.get('sta')).toContainEqual({ kind: 'chapter', system: site.system, chapter: 1, revelation: 1 });
    // Waiting, it takes nothing.
    expect(resolveDigs(g, new Map([['sta', 320]]), events(g)).get('sta')).toBe(320);
    p.researched.push('old-charts', 'field-archaeology');
    expect(chapterCost(g, 'sta', 1)).toBe(160);
    expect(chapterCost(g, 'sta', 2)).toBe(240);
  });

  it('the choice: research, the kind’s own, or the first after waiting 3 turns', () => {
    const run = (kind: (typeof RELIC_KIND_IDS)[number], answer: 0 | 1 | null, wait = 0) => {
      const g = five();
      const site = sites.find((s) => s.kind === kind);
      if (!site) throw new Error(kind);
      const p = ready(g, 'sta', site.system);
      excavate(g, 'sta', site.system);
      const d = digAt(g, site.system);
      if (!d) throw new Error('dig');
      d.chapters = 2;
      d.waiting = g.turn;
      g.turn += wait;
      if (answer !== null)
        expect(
          applyInPlace(world, g, 'sta', { type: 'chapter-choice', system: site.system, choice: answer }),
        ).toBeNull();
      const ev = events(g);
      const surveyed: string[] = [];
      resolveChapterChoices(world, g, ev, (power, system) => {
        surveyed.push(system);
        return markSurveyed(power, system);
      });
      return { g, p, d, line: ev.get('sta')?.find((e) => e.kind === 'chapter-answered'), surveyed };
    };
    const study = run('vault', 0);
    expect(study.line).toMatchObject({ choice: 0, auto: false, research: 300 });
    expect(study.d.waiting).toBeNull();
    const metals = powerOf(five(), 'sta').stockpile.metals;
    const take = run('vault', 1);
    expect(take.line).toMatchObject({ choice: 1, resource: { kind: 'metals', amount: 80 } });
    expect(take.p.stockpile.metals).toBe(metals + 80);
    expect(run('dust', 1).line).toMatchObject({ resource: { kind: 'volatiles', amount: 80 } });
    expect(run('array', 1).line).toMatchObject({ resource: { kind: 'fuel', amount: 80 } });
    const charts = run('charts', 1);
    expect(charts.line).toMatchObject({ choice: 1 });
    expect(charts.surveyed).toHaveLength(5);
    expect(charts.surveyed.every((s) => charts.p.surveyed.includes(s))).toBe(true);
    // Unanswered: it waits, then takes the first.
    expect(run('vault', null, 2).line).toBeUndefined();
    expect(run('vault', null, 3).line).toMatchObject({ choice: 0, auto: true, research: 300 });
  });

  it('stops when its power no longer holds the system, keeping its progress for another', () => {
    const g = five();
    const site = sites[0];
    if (!site) throw new Error('sites');
    ready(g, 'sta', site.system);
    excavate(g, 'sta', site.system);
    const d = digAt(g, site.system);
    if (!d) throw new Error('dig');
    d.progress = 90;
    g.holdings = g.holdings.filter((h) => !(h.owner === 'sta' && h.system === site.system));
    const ev = events(g);
    resolveDigs(g, new Map([['sta', 100]]), ev);
    expect(ev.get('sta')).toContainEqual({ kind: 'dig', system: site.system, stage: 'lost' });
    expect(d).toMatchObject({ by: null, progress: 90 });
    ready(g, 'frontier', site.system);
    expect(excavateRefusal(world, g, 'frontier', site.system)).toBeNull();
    excavate(g, 'frontier', site.system);
    resolveDigs(g, new Map([['frontier', 40]]), events(g));
    expect(d).toMatchObject({ by: 'frontier', chapters: 1, progress: 0 });
    expect(stateProblems(world, g)).toEqual([]);
  });
});

describe('the revelations (§20.5)', () => {
  it('twelve, in order, the last kept; some in a species’ own words', () => {
    expect(REVELATIONS).toHaveLength(12);
    expect(revelationFor(1, 'sta')).toMatch(/the Absent/);
    expect(revelationFor(13, 'sta')).toBe(revelationFor(12, 'sta'));
    expect(revelationFor(5, 'dusk-concord')).toMatch(/clock/);
    expect(revelationFor(5, 'drift-moot')).toMatch(/weather/);
    expect(revelationFor(5, 'sta')).not.toBe(revelationFor(5, 'drift-moot'));
  });
});

describe('the rivals (§20.7)', () => {
  it('set their share by character, excavate where they may, and choose by character', () => {
    expect(PERSONALITIES.sta.digs).toBe(50);
    expect(PERSONALITIES['hollow-wake'].digs).toBe(0);
    const g = five('frontier');
    const site = sites[0];
    if (!site) throw new Error('sites');
    ready(g, 'sta', site.system);
    const orders = aiOrders(world, g, 'sta');
    expect(orders).toContainEqual({ type: 'dig-share', share: 50 });
    expect(orders).toContainEqual({ type: 'excavate', system: site.system });
    excavate(g, 'sta', site.system);
    const d = digAt(g, site.system);
    if (!d) throw new Error('dig');
    d.chapters = 1;
    d.waiting = g.turn;
    expect(aiOrders(world, g, 'sta')).toContainEqual({ type: 'chapter-choice', system: site.system, choice: 0 });
    ready(g, 'dusk-concord', sites[1]?.system ?? '');
    excavate(g, 'dusk-concord', sites[1]?.system ?? '');
    const e = digAt(g, sites[1]?.system ?? '');
    if (!e) throw new Error('dig');
    e.chapters = 1;
    e.waiting = g.turn;
    expect(aiOrders(world, g, 'dusk-concord')).toContainEqual({
      type: 'chapter-choice',
      system: sites[1]?.system,
      choice: 1,
    });
    // The Wake does not dig.
    ready(g, 'hollow-wake', sites[2]?.system ?? '');
    expect(aiOrders(world, g, 'hollow-wake').some((o) => o.type === 'excavate')).toBe(false);
  });
});

describe('a rival that digs settles its site first (M6_ONE.md §22)', () => {
  it('builds an outpost ship for a site it can reach before a colony ship', () => {
    const g = five('frontier');
    g.turn = RULES.keys.outpostFrom ?? 0;
    const p = powerOf(g, 'sta');
    p.researched.push('relic-studies');
    markSurveyed(p, 'sirius');
    p.treasury = 500;
    // No colony or outpost ship of its own: the yard chooses what to build next.
    g.ships = g.ships.filter((s) => !(s.owner === 'sta' && (s.type === 'colony' || s.type === 'outpost')));
    const capital = g.holdings.find((h) => h.owner === 'sta' && h.capital);
    if (!capital) throw new Error('capital');
    capital.queue = [];
    const built = () =>
      aiOrders(world, g, 'sta').find((o) => o.type === 'queue' && o.holding === capital.id && o.item.kind === 'ship');
    expect(built()).toMatchObject({ item: { kind: 'ship', ship: 'outpost' } });
    // Before its turn, a colony ship first, as before.
    const rules = RULES.keys as { outpostFrom: number | null };
    const from = rules.outpostFrom;
    rules.outpostFrom = null;
    try {
      expect(built()).toMatchObject({ item: { kind: 'ship', ship: 'colony' } });
    } finally {
      rules.outpostFrom = from;
    }
  });
});

describe('the treasury (as built)', () => {
  it('a governor starts no project with upkeep while the treasury falls; a rival in debt runs its colonies for trade', () => {
    const g = five('frontier');
    const capital = g.holdings.find((h) => h.owner === 'frontier' && h.capital);
    if (!capital) throw new Error('capital');
    const p = powerOf(g, 'frontier');
    p.treasury = -50;
    capital.governor = 'research';
    capital.queue = [];
    govern(world, g, capital);
    expect(capital.queue.every((q) => q.kind !== 'project')).toBe(true);
    expect(treasuryOf(world, g, 'frontier').total).toBeGreaterThan(-1000);

    const h = five('frontier');
    const sta = powerOf(h, 'sta');
    const home = h.holdings.find((x) => x.owner === 'sta' && x.capital);
    if (!home) throw new Error('capital');
    const body = bodiesOf(world, h.seed, 'barnard').find(() => true);
    if (!body) throw new Error('body');
    const col = makeHolding(h, {
      owner: 'sta',
      kind: 'colony',
      system: 'barnard',
      body: body.id,
      capital: false,
      people: 10,
    });
    sta.treasury = -1;
    const orders = aiOrders(world, h, 'sta');
    expect(orders).toContainEqual({ type: 'governor', holding: col.id, priority: 'trade' });
    expect(orders).not.toContainEqual({ type: 'governor', holding: home.id, priority: 'trade' });
  });
});

describe('state (§20.10)', () => {
  it('a save from version 25 reads with no excavations, a quarter’s share and no chapters', () => {
    const g = five();
    const powers = g.powers.map(({ digShare: _s, chapters: _c, ...p }) => p);
    const { digs: _d, ...rest } = g;
    const raw = {
      format: SAVE_FORMAT,
      version: 1,
      savedAt: '2026-10-22T00:00:00Z',
      game: { ...rest, powers, version: 25 },
    };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.digs).toEqual([]);
    expect(loaded.powers.every((p) => p.digShare === 25 && p.chapters === 0)).toBe(true);
    expect(shapeProblems(loaded)).toEqual([]);
  });
});
