import { describe, expect, it } from 'vitest';
import type { FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { TECH_IDS, TECHS, type TechId } from '../../src/content/techs.ts';
import { SKY } from '../../src/data/sky.ts';
import { adviceFor } from '../../src/sim/advice.ts';
import { aiOrders, PERSONALITIES } from '../../src/sim/ai.ts';
import { inspire, resolveInspirations } from '../../src/sim/discoveries.ts';
import { approvalOf, costOf, growthOf, researchOf, zoneYield } from '../../src/sim/economy.ts';
import { laneQuote } from '../../src/sim/lanes.ts';
import { blindReachDeci, jumpPoints } from '../../src/sim/movement.ts';
import { applyOrder, type Order, refuse } from '../../src/sim/orders.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { canResearch, closedBy, hasMet, knownBy, spendResearch, techCost } from '../../src/sim/research.ts';
import { beaconSlots, type GameState, type Holding, makeHolding, newGame, powerOf } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { knownView, standings, watchNews } from '../../src/sim/visibility.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** Forks and spreading knowledge (M2B_SCIENCE.md §19, D-47, D-48). */

const world = buildWorld(SKY);
const start = (faction: FactionId = 'sta') => newGame(world, { seed: 42, powers: [{ faction, controller: 'player' }] });
const three = () =>
  newGame(world, {
    seed: 42,
    powers: [
      { faction: 'sta', controller: 'player' },
      { faction: 'frontier', controller: 'ai' },
      { faction: 'hollow-wake', controller: 'ai' },
    ],
  });
const capital = (g: GameState, f: FactionId = 'sta') => g.holdings.find((h) => h.capital && h.owner === f) as Holding;
const knowing = (g: GameState, ...techs: TechId[]) => {
  powerOf(g, 'sta').researched.push(...techs);
  return g;
};
const order = (g: GameState, o: Order) => {
  const r = applyOrder(world, g, 'sta', o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
/** The Authority meets the Wake: it has surveyed Wolf 1061, the Wake's capital. */
const meetWake = (g: GameState) => {
  powerOf(g, 'sta').surveyed.push('wolf-1061');
  powerOf(g, 'sta').surveyed.sort();
  return g;
};

describe('doctrines (§19.1)', () => {
  it('are three pairs, each at its tier, each the other’s fork, both needing the same', () => {
    const pairs = TECH_IDS.filter((id) => TECHS[id].fork);
    expect(pairs).toEqual([
      'open-frontier',
      'strong-centre',
      'lane-network',
      'deep-jumpers',
      'industrial-worlds',
      'garden-worlds',
    ]);
    for (const id of pairs) {
      const other = TECHS[id].fork as TechId;
      expect(TECHS[other].fork).toBe(id);
      expect(TECHS[other].tier).toBe(TECHS[id].tier);
      expect(TECHS[other].needs).toEqual(TECHS[id].needs);
    }
  });

  it('one researched closes the other: out of the queue with what needs it, its progress lost, refused after', () => {
    let g = knowing(start(), 'colonial-charters', 'regional-administration');
    g = order(g, { type: 'research', tech: 'strong-centre' });
    g = order(g, { type: 'research', tech: 'open-frontier' });
    const p = powerOf(g, 'sta');
    // Two technologies known: each doctrine costs 114.
    p.techProgress = { 'strong-centre': 5, 'open-frontier': 110 };
    expect(spendResearch(g, p, 1)).toEqual([]);
    p.researchQueue = ['open-frontier', 'strong-centre'];
    expect(spendResearch(g, p, 10)).toEqual(['open-frontier']);
    expect(p.researchQueue).toEqual([]);
    expect(p.techProgress['strong-centre']).toBeUndefined();
    expect(closedBy(p, 'strong-centre')).toBe('open-frontier');
    expect(canResearch(p)).not.toContain('strong-centre');
    expect(refuse(world, g, 'sta', { type: 'research', tech: 'strong-centre' })).toBe(
      'Strong centre is closed: you chose Open frontier.',
    );
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('a closed doctrine inspires nothing; an inspired one closes its pair too', () => {
    const g = knowing(start(), 'colonial-charters', 'regional-administration');
    const p = powerOf(g, 'sta');
    p.techProgress['lane-network'] = 99;
    p.researched.push('lane-engineering-1', 'lane-engineering-2');
    expect(inspire(g, p, 'lane-network').finished).toBe(true);
    expect(closedBy(p, 'deep-jumpers')).toBe('lane-network');
    const events = new Map<FactionId, ReportEvent[]>([
      ['sta', [{ kind: 'jumped', ship: 1, from: 'sol', to: 'sirius', turns: 3 }]],
    ]);
    resolveInspirations(world, g, events);
    expect(events.get('sta')?.some((e) => e.kind === 'inspired' && e.tech === 'deep-jumpers')).toBe(false);
  });

  it('Open frontier and Strong centre', () => {
    const g = start();
    const ship = { kind: 'ship', ship: 'colony' } as const;
    const before = costOf(world, g, capital(g), ship).industry;
    knowing(g, 'open-frontier');
    expect(costOf(world, g, capital(g), ship).industry).toBe(Math.ceil((before * 75) / 100));
    const h = start();
    const research = researchOf(world, h, 'sta').total;
    const approval = approvalOf(world, h, capital(h)).total;
    knowing(h, 'strong-centre');
    expect(researchOf(world, h, 'sta').total).toBe(research + 3);
    expect(approvalOf(world, h, capital(h)).parts).toContainEqual({ label: 'a strong centre', value: 5 });
    expect(approvalOf(world, h, capital(h)).total).toBe(Math.min(100, approval + 5));
  });

  it('Lane network and Deep jumpers', () => {
    const g = start();
    const cost = laneQuote(world, g, 'sta', 'sol', 'sirius').cost.industry;
    expect(beaconSlots(g, 'sol')).toBe(RULES.beacons.slotsWithStation);
    knowing(g, 'lane-network');
    expect(laneQuote(world, g, 'sta', 'sol', 'sirius').cost.industry).toBe(Math.ceil((cost * 75) / 100));
    expect(beaconSlots(g, 'sol')).toBe(RULES.beacons.slotsWithStation + 1);
    const h = start();
    knowing(h, 'deep-jumpers');
    expect(blindReachDeci(h, 'sta')).toBe(80);
    expect(jumpPoints(h, 'sta', 'survey')).toBe(3);
    expect(jumpPoints(h, 'sta', 'colony')).toBe(2);
  });

  it('Industrial worlds and Garden worlds', () => {
    const g = start();
    const works = zoneYield(world, g, capital(g), 'works');
    knowing(g, 'industrial-worlds');
    expect(zoneYield(world, g, capital(g), 'works')).toBe(works + 1);
    // The capital has three works: −5.
    expect(approvalOf(world, g, capital(g)).parts).toContainEqual({ label: 'an industrial world', value: -5 });
    const h = start();
    const farms = zoneYield(world, h, capital(h), 'farms');
    const growth = growthOf(world, h, capital(h));
    knowing(h, 'garden-worlds');
    expect(zoneYield(world, h, capital(h), 'farms')).toBe(farms + 1);
    expect(growthOf(world, h, capital(h))).toBeGreaterThanOrEqual(growth);
  });

  it('rivals choose their own by character, and never queue the other', () => {
    expect(PERSONALITIES.sta.doctrines).toEqual(['strong-centre', 'lane-network', 'industrial-worlds']);
    expect(PERSONALITIES.frontier.doctrines).toEqual(['open-frontier', 'deep-jumpers', 'garden-worlds']);
    expect(PERSONALITIES['hollow-wake'].doctrines).toEqual(['open-frontier', 'deep-jumpers', 'industrial-worlds']);
    const g = three();
    const p = powerOf(g, 'frontier');
    // Everything else known: only doctrines are left to choose.
    p.researched.push(...TECH_IDS.filter((id) => !TECHS[id].fork && id !== 'lapse-studies'));
    const seen: TechId[] = [];
    for (let i = 0; i < 6; i++) {
      const o = aiOrders(world, g, 'frontier').find((x) => x.type === 'research');
      if (!o || o.type !== 'research') break;
      seen.push(o.tech);
      p.researched.push(o.tech);
    }
    expect(seen.sort()).toEqual(['deep-jumpers', 'garden-worlds', 'open-frontier']);
  });
});

describe('knowledge spreads (§19.2)', () => {
  it('15% less for each power met that knows it, at most 30%; nothing for a power not met', () => {
    const g = three();
    const p = powerOf(g, 'sta');
    expect(techCost(g, p, 'magnetics')).toBe(60);
    powerOf(g, 'hollow-wake').researched.push('magnetics');
    powerOf(g, 'frontier').researched.push('magnetics');
    expect(hasMet(g, p, 'hollow-wake')).toBe(false);
    expect(techCost(g, p, 'magnetics')).toBe(60);
    meetWake(g);
    expect(hasMet(g, p, 'hollow-wake')).toBe(true);
    expect(knownBy(g, p, 'magnetics')).toEqual(['hollow-wake']);
    expect(techCost(g, p, 'magnetics')).toBe(51);
    p.surveyed.push('tau-ceti');
    expect(techCost(g, p, 'magnetics')).toBe(42);
    expect(techCost(g, p, 'magnetics', false)).toBe(60);
  });

  it('progress past a fallen cost finishes the technology with the next research spent', () => {
    const g = three();
    const p = powerOf(g, 'sta');
    p.researchQueue = ['habitat-domes'];
    p.techProgress = { 'habitat-domes': 28 };
    powerOf(g, 'hollow-wake').researched.push('habitat-domes');
    meetWake(g);
    // 30 less 15%: 25, below the 28 made.
    expect(stateProblems(world, g)).toEqual([]);
    expect(spendResearch(g, p, 1)).toEqual(['habitat-domes']);
  });
});

describe('the Watch’s rumours and the standings (§19.3, §19.4)', () => {
  it('a met rival’s tier 4 or 5 technology or doctrine, and nothing smaller, nor of a rival not met', () => {
    const before = three();
    const after = structuredClone(before);
    powerOf(after, 'hollow-wake').researched.push('soil-science', 'terraforming', 'open-frontier');
    powerOf(after, 'frontier').researched.push('terraforming');
    meetWake(before);
    meetWake(after);
    const news = watchNews(world, before, after, 'sta').filter((e) => e.kind === 'rival-tech');
    expect(news).toEqual([
      { kind: 'rival-tech', faction: 'hollow-wake', tech: 'terraforming' },
      { kind: 'rival-tech', faction: 'hollow-wake', tech: 'open-frontier' },
    ]);
    const said = adviceFor(world, after, 'sta', news, [], 'speak');
    expect(said[0]?.text).toBe('Control, word from the lanes: the Hollow Wake has mastered Terraforming.');
  });

  it('the standings: yours as a count, each met rival ahead, level or behind', () => {
    const g = meetWake(three());
    powerOf(g, 'sta').researched.push(...TECH_IDS.slice(0, 5));
    powerOf(g, 'hollow-wake').researched.push(...TECH_IDS.slice(0, 8));
    let rows = standings(knownView(world, g, 'sta'), 'sta');
    expect(rows.map((r) => [r.faction, r.technologies, r.science])).toEqual([
      ['sta', 5, null],
      ['hollow-wake', null, 'ahead'],
    ]);
    powerOf(g, 'hollow-wake').researched = TECH_IDS.slice(0, 3);
    rows = standings(knownView(world, g, 'sta'), 'sta');
    expect(rows[1]?.science).toBe('level');
    powerOf(g, 'hollow-wake').researched = TECH_IDS.slice(0, 2);
    rows = standings(knownView(world, g, 'sta'), 'sta');
    expect(rows[1]?.science).toBe('behind');
  });
});

describe('a game with doctrines', () => {
  it('rivals reach theirs, and never both of a pair, in 120 turns', () => {
    let g = three();
    for (let t = 0; t < 120; t++) g = resolveTurn(world, g).state;
    for (const p of g.powers) {
      for (const id of p.researched)
        expect(p.researched.includes(TECHS[id].fork as TechId), `${p.faction} ${id}`).toBe(false);
    }
    expect(stateProblems(world, g)).toEqual([]);
    const any = g.powers.some((p) => p.researched.some((id) => TECHS[id].fork));
    expect(any).toBe(true);
    // A building stands where a doctrine says nothing of it: makeHolding is still the only way in.
    expect(typeof makeHolding).toBe('function');
  }, 120_000);
});
