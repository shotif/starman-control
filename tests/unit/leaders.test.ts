import { describe, expect, it } from 'vitest';
import manifest from '../../art/manifest.json' with { type: 'json' };
import { ADVISORS } from '../../src/content/advisors.ts';
import { FACTION_IDS, type FactionId } from '../../src/content/factions.ts';
import { type Calling, FACES, facePortrait, type TraitId } from '../../src/content/leaders.ts';
import type { ModuleId } from '../../src/content/modules.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { aiOrders } from '../../src/sim/ai.ts';
import { votesOf } from '../../src/sim/assembly.ts';
import { fight } from '../../src/sim/battle.ts';
import { makeDesign } from '../../src/sim/designs.ts';
import { approvalOf, creditsOf, industryOf, researchOf, treasuryOf, upkeepOf } from '../../src/sim/economy.ts';
import { resolveEspionage } from '../../src/sim/espionage.ts';
import { formFleet } from '../../src/sim/fleets.ts';
import { candidatesFor, makeCandidates, resolveLeaders } from '../../src/sim/leaders.ts';
import { attitudeOf } from '../../src/sim/memory.ts';
import { applyInPlace } from '../../src/sim/orders.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { type GameState, type Leader, makeShip, newGame, powerOf, STATE_VERSION } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { shapeProblems, stateProblems } from '../../src/sim/validate.ts';
import { declareWar } from '../../src/sim/war.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M5 increment 56 (M5_UNKNOWN.md §24, D-73): leaders. */

const world = buildWorld(SKY);
const L = RULES.leaders;
const talk = (faction: FactionId) => ({ faction, stage: 'talk' as const, since: 1, words: 20 });
const five = (player: FactionId = 'sta'): GameState => {
  const g = newGame(world, {
    seed: 42,
    powers: FACTION_IDS.map((faction) => ({
      faction,
      controller: faction === player ? ('player' as const) : ('ai' as const),
    })),
  });
  for (const p of g.powers) p.contacts = FACTION_IDS.filter((f) => f !== p.faction).map((f) => talk(f));
  return g;
};
const events = (g: GameState) => new Map(g.powers.map((p) => [p.faction, [] as ReportEvent[]]));
/** A leader of ours, made for the test. */
const leader = (
  g: GameState,
  serves: FactionId,
  calling: Calling,
  traits: [TraitId, number][],
  post: number | null = null,
  more: Partial<Leader> = {},
): Leader => {
  const l: Leader = {
    id: g.nextLeaderId++,
    serves,
    people: serves,
    name: `Test ${g.nextLeaderId}`,
    face: 1,
    calling,
    traits: traits.map(([trait, level]) => ({ trait, level })),
    flaw: null,
    wage: 3,
    post,
    served: 0,
    ...more,
  };
  g.leaders.push(l);
  return l;
};
const capitalOf = (g: GameState, f: FactionId) => {
  const h = g.holdings.find((x) => x.owner === f && x.capital);
  if (!h) throw new Error('capital');
  return h;
};
const order = (g: GameState, f: FactionId, o: Parameters<typeof applyInPlace>[3]) => applyInPlace(world, g, f, o);

describe('faces (§24.7)', () => {
  it('every people has its faces, each approved', () => {
    const approved = new Set(manifest.images.map((i) => i.id));
    for (const f of FACTION_IDS)
      for (let n = 1; n <= FACES; n++) expect(approved.has(facePortrait(f, n)), facePortrait(f, n)).toBe(true);
  });
});

describe('the pool (§24.3)', () => {
  it('as the first turn ends, three people for each power, from the seed, none an advisor', () => {
    const g = five();
    expect(g.candidates).toEqual([]);
    const ev = events(g);
    makeCandidates(g, ev);
    for (const p of g.powers) expect(candidatesFor(g, p.faction)).toHaveLength(L.offers);
    expect(ev.get('sta')).toContainEqual({ kind: 'offered', count: L.offers });
    const again = five();
    makeCandidates(again, events(again));
    expect(again.candidates).toEqual(g.candidates);
    const advisors = new Set(Object.values(ADVISORS).flatMap((a) => Object.values(a.people).map((x) => x.name)));
    for (const c of g.candidates) {
      expect(advisors.has(c.name)).toBe(false);
      const levels = c.traits.reduce((n, t) => n + t.level, 0);
      expect(c.fee).toBe(L.fee + L.feePerLevel * levels);
      expect(c.wage).toBe((L.wage + L.wagePerLevel * levels) * (c.flaw === 'greedy' ? 2 : 1));
    }
    expect(new Set(g.candidates.map((c) => c.name)).size).toBe(g.candidates.length);
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('new people every 10 turns in place of those not hired', () => {
    const g = five();
    makeCandidates(g, events(g));
    const first = g.candidates.map((c) => c.id);
    g.turn = 2;
    makeCandidates(g, events(g));
    expect(g.candidates.map((c) => c.id)).toEqual(first);
    g.turn = 1 + L.offerEvery;
    makeCandidates(g, events(g));
    expect(g.candidates.some((c) => first.includes(c.id))).toBe(false);
  });
});

describe('hiring and posting (§24.1)', () => {
  it('hired for its fee, waiting, paid its wage', () => {
    const g = five();
    makeCandidates(g, events(g));
    const c = candidatesFor(g, 'sta')[0];
    if (!c) throw new Error('offer');
    powerOf(g, 'sta').treasury = c.fee - 1;
    expect(order(g, 'sta', { type: 'hire', leader: c.id })).toBe(`We cannot pay the fee of ${c.fee} credits.`);
    powerOf(g, 'sta').treasury = c.fee + 10;
    expect(order(g, 'sta', { type: 'hire', leader: c.id })).toBeNull();
    expect(powerOf(g, 'sta').treasury).toBe(10);
    expect(g.leaders).toHaveLength(1);
    expect(g.leaders[0]?.post).toBeNull();
    expect(upkeepOf(g, 'sta').parts).toContainEqual({ label: 'leaders', value: c.wage });
    const theirs = candidatesFor(g, 'frontier')[0];
    if (!theirs) throw new Error('offer');
    expect(order(g, 'sta', { type: 'hire', leader: theirs.id })).toBe('No one by that name is offered to us now.');
    for (let i = 1; i < L.most; i++) leader(g, 'sta', 'scholar', [['brilliant', 1]]);
    const next = candidatesFor(g, 'sta')[0];
    if (!next) throw new Error('offer');
    expect(order(g, 'sta', { type: 'hire', leader: next.id })).toBe(
      `We keep ${L.most} leaders already: dismiss one first.`,
    );
  });

  it('one to a post: a steward to a colony, a commander to a fleet, a scholar to the research', () => {
    const g = five();
    const capital = capitalOf(g, 'sta');
    const a = leader(g, 'sta', 'steward', [['beloved', 1]]);
    const b = leader(g, 'sta', 'steward', [['thrifty', 1]]);
    const s = leader(g, 'sta', 'scholar', [['brilliant', 1]]);
    expect(order(g, 'sta', { type: 'post', leader: a.id, post: 0 })).toBe('A steward serves a colony of ours.');
    expect(order(g, 'sta', { type: 'post', leader: a.id, post: capital.id })).toBeNull();
    expect(order(g, 'sta', { type: 'post', leader: b.id, post: capital.id })).toBeNull();
    expect([a.post, b.post]).toEqual([null, capital.id]);
    expect(order(g, 'sta', { type: 'post', leader: s.id, post: capital.id })).toBe(
      'A scholar serves our research only.',
    );
    expect(order(g, 'sta', { type: 'post', leader: s.id, post: 0 })).toBeNull();
    const c = leader(g, 'sta', 'commander', [['bold', 1]]);
    const d = makeDesign(g, powerOf(g, 'sta'), 'frigate', 'test', ['pulse-1', 'pulse-1', 'shield-1']);
    const fleet = formFleet(g, 'sta', [makeShip(g, 'sta', 'frigate', 'sol', d.id)]);
    expect(order(g, 'sta', { type: 'post', leader: c.id, post: fleet.id })).toBeNull();
    expect(stateProblems(world, g)).toEqual([]);
    expect(order(g, 'sta', { type: 'post', leader: c.id, post: null })).toBeNull();
    expect(order(g, 'sta', { type: 'dismiss', leader: c.id })).toBeNull();
    expect(g.leaders.some((l) => l.id === c.id)).toBe(false);
  });
});

describe('what traits give (§24.2)', () => {
  it('a steward: approval, industry and credits at the colony, named in the parts', () => {
    const g = five();
    const capital = capitalOf(g, 'sta');
    const before = {
      a: approvalOf(world, g, capital),
      i: industryOf(world, g, capital),
      c: creditsOf(world, g, capital),
    };
    leader(
      g,
      'sta',
      'steward',
      [
        ['beloved', 2],
        ['industrious', 1],
        ['thrifty', 3],
      ],
      capital.id,
      { name: 'Ines Test' },
    );
    const a = approvalOf(world, g, capital);
    expect(a.parts).toContainEqual({ label: 'Steward Ines Test (Beloved 2)', value: 2 * L.per.beloved });
    expect(a.total).toBe(Math.min(100, before.a.total + 2 * L.per.beloved));
    expect(industryOf(world, g, capital).total).toBeGreaterThan(before.i.total);
    expect(creditsOf(world, g, capital).total).toBe(before.c.total + 3 * L.per.thrifty);
  });

  it('a scholar: research, and the excavations’ progress', () => {
    const g = five();
    const before = researchOf(world, g, 'sta').total;
    leader(g, 'sta', 'scholar', [['brilliant', 3]], 0);
    expect(researchOf(world, g, 'sta').total).toBe(before + Math.floor((before * 3 * L.per.brilliant) / 100));
  });

  it('an ambassador: regard from every power, and votes in the Assembly', () => {
    const g = five();
    const before = attitudeOf(world, g, 'frontier', 'sta').total;
    const votes = votesOf(g, 'sta');
    leader(
      g,
      'sta',
      'ambassador',
      [
        ['charming', 2],
        ['persuasive', 3],
      ],
      0,
    );
    expect(attitudeOf(world, g, 'frontier', 'sta').total).toBe(before + 2 * L.per.charming);
    expect(votesOf(g, 'sta')).toBeGreaterThanOrEqual(votes);
    const people = g.holdings.filter((h) => h.owner === 'sta' && h.kind === 'colony').reduce((n, h) => n + h.people, 0);
    expect(votesOf(g, 'sta')).toBe(
      Math.max(1, Math.floor((people * (100 + 3 * L.per.persuasive)) / (RULES.assembly.peoplePerVote * 100))),
    );
  });

  it('a spymaster: our agents learn more, others’ less', () => {
    const g = five();
    order(g, 'sta', { type: 'watch', on: 'frontier', watch: true });
    order(g, 'frontier', { type: 'watch', on: 'sta', watch: true });
    leader(
      g,
      'sta',
      'spymaster',
      [
        ['cunning', 1],
        ['vigilant', 2],
      ],
      0,
    );
    resolveEspionage(g, events(g));
    expect(powerOf(g, 'sta').intel).toContainEqual({
      faction: 'frontier',
      level: RULES.espionage.gain + L.per.cunning,
    });
    expect(powerOf(g, 'frontier').intel).toContainEqual({
      faction: 'sta',
      level: RULES.espionage.gain - 2 * L.per.vigilant,
    });
  });

  it('a commander: their fleet fights harder', () => {
    const fought = (traits: [TraitId, number][]) => {
      const g = five();
      declareWar(g, 'sta', 'frontier');
      const mods: ModuleId[] = ['pulse-1', 'pulse-1', 'shield-1'];
      const fleets = (['sta', 'frontier'] as const).map((f) => {
        const d = makeDesign(g, powerOf(g, f), 'frigate', `${f}-test`, mods);
        return formFleet(
          g,
          f,
          Array.from({ length: 3 }, () => makeShip(g, f, 'frigate', 'alpha-centauri', d.id)),
        );
      });
      if (traits.length > 0) leader(g, 'sta', 'commander', traits, fleets[0]?.id);
      const log = fight(world, g, 'alpha-centauri', 1);
      return log.rounds
        .flatMap((r) => r.shots)
        .map((s) => ({ s, ours: s[0] > 0 && log.ships.find((x) => x.id === s[0])?.owner === 'sta' }));
    };
    // The same shots, in the same order, until a ship is lost: compare each.
    const compare = (traits: [TraitId, number][], mine: boolean) => {
      const plain = fought([]);
      const led = fought(traits);
      const out: [number, number][] = [];
      for (let i = 0; i < Math.min(plain.length, led.length); i++) {
        const [p, q] = [plain[i], led[i]];
        if (!p || !q || p.s[0] !== q.s[0] || p.s[1] !== q.s[1]) break;
        if (p.ours !== mine || p.s[4] < 0) continue;
        out.push(mine ? [p.s[3] + p.s[4], q.s[3] + q.s[4]] : [p.s[4], q.s[4]]);
      }
      return out;
    };
    const bold = compare([['bold', 3]], true);
    expect(bold.length).toBeGreaterThan(0);
    expect(bold.every(([p, q]) => q >= p)).toBe(true);
    expect(bold.some(([p, q]) => q > p)).toBe(true);
    const steady = compare([['steady', 3]], false).filter(([p]) => p > 0);
    expect(steady.length).toBeGreaterThan(0);
    expect(steady.every(([p, q]) => q < p)).toBe(true);
  });
});

describe('experience and loyalty (§24.2, §24.4)', () => {
  it('a trait grows every 25 turns in a post, and the report says so', () => {
    const g = five();
    const l = leader(
      g,
      'sta',
      'scholar',
      [
        ['brilliant', 1],
        ['antiquarian', 2],
      ],
      0,
      { served: L.growEvery - 1 },
    );
    const ev = events(g);
    resolveLeaders(g, ev, () => false);
    expect(l.traits).toEqual([
      { trait: 'brilliant', level: 2 },
      { trait: 'antiquarian', level: 2 },
    ]);
    expect(ev.get('sta')).toContainEqual(
      expect.objectContaining({ kind: 'leader', what: 'grew', trait: 'brilliant', level: 2 }),
    );
  });

  it('in debt a leader may leave; a steward may leave an unhappy colony', () => {
    const g = five();
    powerOf(g, 'sta').treasury = -10;
    const l = leader(g, 'sta', 'scholar', [['brilliant', 1]], 0);
    let left = 0;
    for (let t = 1; t <= 200 && !left; t++) {
      g.turn = t;
      const ev = events(g);
      resolveLeaders(g, ev, () => false);
      if (ev.get('sta')?.some((e) => e.kind === 'leader' && e.what === 'debt')) left = t;
    }
    expect(left).toBeGreaterThan(0);
    expect(g.leaders.includes(l)).toBe(false);

    const h = five();
    const s = leader(h, 'sta', 'steward', [['beloved', 1]], capitalOf(h, 'sta').id);
    let gone = 0;
    for (let t = 1; t <= 200 && !gone; t++) {
      h.turn = t;
      const ev = events(h);
      resolveLeaders(h, ev, () => true);
      if (ev.get('sta')?.some((e) => e.kind === 'leader' && e.what === 'unhappy')) gone = t;
    }
    expect(gone).toBeGreaterThan(0);
    expect(h.leaders.includes(s)).toBe(false);
  });

  it('a rival that knows our secrets lures one away, unless we guard much', () => {
    const run = (guard: 0 | 2) => {
      const g = five();
      powerOf(g, 'sta').guard = guard;
      powerOf(g, 'hollow-wake').intel = [{ faction: 'sta', level: RULES.espionage.secrets }];
      const l = leader(g, 'sta', 'scholar', [['brilliant', 2]], 0);
      for (let t = 1; t <= 300 && l.serves === 'sta'; t++) {
        g.turn = t;
        resolveLeaders(g, events(g), () => false);
      }
      return l;
    };
    const lured = run(0);
    expect(lured.serves).toBe('hollow-wake');
    expect(lured.post).toBeNull();
    expect(run(2).serves).toBe('sta');
  });

  it('a commander falls with a fleet destroyed in battle; a fleet merely gone sends them to wait', () => {
    const g = five();
    const ships = [makeShip(g, 'sta', 'frigate', 'sol')];
    const fleet = formFleet(g, 'sta', ships);
    const c = leader(g, 'sta', 'commander', [['bold', 1]], fleet.id);
    g.fleets = g.fleets.filter((f) => f.id !== fleet.id);
    for (const s of g.ships) if (s.fleet === fleet.id) s.fleet = null;
    resolveLeaders(g, events(g), () => false);
    expect(c.post).toBeNull();
    c.post = 99;
    g.battles = [
      {
        id: 1,
        system: 'sol',
        turn: g.turn,
        powers: ['sta'],
        forces: [
          { key: 'f99', owner: 'sta', fleet: 99, name: 'x', stance: 'engage', target: 'warships', retreat: 100 },
        ],
        ships: [],
        rounds: [],
        held: [],
        why: [],
      },
    ];
    const ev = events(g);
    resolveLeaders(g, ev, () => false);
    expect(g.leaders.includes(c)).toBe(false);
    expect(ev.get('sta')).toContainEqual(expect.objectContaining({ kind: 'leader', what: 'fell' }));
  });
});

describe('the rivals (§24.5)', () => {
  it('hire by character from turn 70 with the fee and more, and post them at once', () => {
    const g = five('frontier');
    makeCandidates(g, events(g));
    const wake = powerOf(g, 'hollow-wake');
    wake.treasury = 400;
    const want = candidatesFor(g, 'hollow-wake');
    expect(aiOrders(world, g, 'hollow-wake').some((o) => o.type === 'hire')).toBe(false);
    g.turn = L.rivalsFrom;
    // An offer of the calling it wants first, a commander.
    const c = want[0];
    if (!c) throw new Error('offer');
    c.calling = 'commander';
    c.traits = [{ trait: 'bold', level: 1 }];
    const ships = [makeShip(g, 'hollow-wake', 'frigate', wake.capital)];
    const fleet = formFleet(g, 'hollow-wake', ships);
    // A power gaining: more people at its capital, more taxes.
    capitalOf(g, 'hollow-wake').people += 60;
    expect(treasuryOf(world, g, 'hollow-wake').total).toBeGreaterThan(0);
    const orders = aiOrders(world, g, 'hollow-wake');
    expect(orders).toContainEqual({ type: 'hire', leader: c.id });
    expect(orders).toContainEqual({ type: 'post', leader: c.id, post: fleet.id });
  });
});

describe('state (§24.8)', () => {
  it('a save from version 28 reads with no leaders and none offered', () => {
    const g = five();
    const { leaders: _l, candidates: _c, nextLeaderId: _n, ...rest } = g;
    const raw = {
      format: SAVE_FORMAT,
      version: 1,
      savedAt: '2026-10-22T00:00:00Z',
      game: { ...rest, version: 28 },
    };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect([loaded.leaders, loaded.candidates, loaded.nextLeaderId]).toEqual([[], [], 1]);
    expect(shapeProblems(loaded)).toEqual([]);
  });

  it('a whole turn with leaders stays sound', () => {
    const g = five();
    const r = resolveTurn(world, g);
    expect(r.state.candidates.length).toBe(L.offers * g.powers.length);
    expect(stateProblems(world, r.state)).toEqual([]);
  });
});
