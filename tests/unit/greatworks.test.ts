import { describe, expect, it } from 'vitest';
import type { FactionId } from '../../src/content/factions.ts';
import { GREAT_WORKS, PROJECTS } from '../../src/content/projects.ts';
import { RULES } from '../../src/content/rules.ts';
import { TECHS, type TechId } from '../../src/content/techs.ts';
import { SKY } from '../../src/data/sky.ts';
import { aiOrders } from '../../src/sim/ai.ts';
import { observationPoints } from '../../src/sim/discoveries.ts';
import { approvalOf, growthOf, queueRefusal, researchOf } from '../../src/sim/economy.ts';
import { laneQuote } from '../../src/sim/lanes.ts';
import { scoreOf } from '../../src/sim/score.ts';
import { type GameState, type Holding, newGame, powerOf } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { knownView, standings, watchedSystems, watchNews } from '../../src/sim/visibility.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** Great works and the score (M2B_SCIENCE.md §20, D-49, D-50). */

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
const capital = (g: GameState, f: FactionId = 'sta') => g.holdings.find((h) => h.capital && h.owner === f) as Holding;
const knowing = (g: GameState, f: FactionId, ...techs: TechId[]) => {
  powerOf(g, f).researched.push(...techs);
  return g;
};
const archive = { kind: 'project', project: 'lapse-archive' } as const;

describe('great works (§20.2)', () => {
  it('are four, opened by Great engineering and a technology of their own, 400 industry and 40 metals each', () => {
    expect(GREAT_WORKS).toEqual(['long-array', 'lapse-archive', 'lanewright-foundry', 'commons']);
    expect(TECHS['great-engineering'].tier).toBe(5);
    for (const id of GREAT_WORKS) {
      expect(PROJECTS[id].opens).toBe('great-engineering');
      expect(PROJECTS[id].cost).toEqual({ industry: 400, metals: 40, volatiles: 0, fuel: 0 });
    }
    const g = three();
    expect(queueRefusal(world, g, capital(g), archive)).toBe('Needs Great engineering.');
    knowing(g, 'sta', 'great-engineering');
    expect(queueRefusal(world, g, capital(g), archive)).toBe('Needs Public schooling.');
    knowing(g, 'sta', 'public-schooling');
    expect(queueRefusal(world, g, capital(g), archive)).toBeNull();
  });

  it('one in the whole neighbourhood; one colony of a power building it at a time', () => {
    const g = knowing(
      knowing(three(), 'sta', 'great-engineering', 'public-schooling'),
      'frontier',
      'great-engineering',
      'public-schooling',
    );
    capital(g, 'frontier').queue.push(archive);
    // The Cooperative builds it: the Authority may race it.
    expect(queueRefusal(world, g, capital(g), archive)).toBeNull();
    const mars: Holding = { ...capital(g), id: 99, capital: false, body: 'mars', queue: [archive] };
    g.holdings.push(mars);
    expect(queueRefusal(world, g, capital(g), archive)).toBe('The Lapse Archive is being built at Mars.');
    g.holdings.pop();
    capital(g, 'hollow-wake').projects.push('lapse-archive');
    expect(queueRefusal(world, g, capital(g), archive)).toBe('The Lapse Archive stands already, the Hollow Wake’s.');
  });

  it('the race: the first to finish holds it; the others lose it, keeping half the industry put in', () => {
    let g = knowing(
      knowing(three(), 'sta', 'great-engineering', 'public-schooling'),
      'frontier',
      'great-engineering',
      'public-schooling',
    );
    const sta = capital(g);
    const coop = capital(g, 'frontier');
    sta.queue = [archive];
    sta.industry = 399;
    coop.queue = [archive];
    coop.industry = 300;
    for (const f of ['sta', 'frontier'] as const) powerOf(g, f).stockpile.metals = 100;
    const r = resolveTurn(world, g);
    g = r.state;
    expect(capital(g).projects).toContain('lapse-archive');
    expect(capital(g, 'frontier').queue.some((q) => q.kind === 'project' && q.project === 'lapse-archive')).toBe(false);
    const lost = r.reports.find((x) => x.faction === 'frontier')?.events.find((e) => e.kind === 'great-work-lost');
    expect(lost).toMatchObject({ kind: 'great-work-lost', holding: coop.id, project: 'lapse-archive', faction: 'sta' });
    expect(lost && 'kept' in lost && lost.kept).toBeGreaterThan(0);
    // Everyone hears of it.
    for (const f of ['frontier', 'hollow-wake'] as const)
      expect(r.reports.find((x) => x.faction === f)?.events).toContainEqual({
        kind: 'great-work',
        faction: 'sta',
        project: 'lapse-archive',
        holding: sta.id,
        system: 'sol',
      });
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('the Watch sees a rival begin one where it can see', () => {
    const before = three();
    const after = structuredClone(before);
    capital(after, 'hollow-wake').queue.push({ kind: 'project', project: 'lanewright-foundry' });
    expect(watchNews(world, before, after, 'sta').some((e) => e.kind === 'great-work-begun')).toBe(false);
    for (const g of [before, after]) powerOf(g, 'sta').surveyed.push('wolf-1061');
    expect(watchNews(world, before, after, 'sta')).toContainEqual({
      kind: 'great-work-begun',
      faction: 'hollow-wake',
      project: 'lanewright-foundry',
      holding: capital(after, 'hollow-wake').id,
      system: 'wolf-1061',
    });
  });

  it('each does what it says', () => {
    const g = three();
    const research = researchOf(world, g, 'sta').total;
    const lane = laneQuote(world, g, 'sta', 'sol', 'sirius').cost;
    const approval = approvalOf(world, g, capital(g)).total;
    const growth = growthOf(world, g, capital(g));
    expect(watchedSystems(world, g, 'sta').has('tau-ceti')).toBe(false);
    capital(g).projects.push('long-array', 'lapse-archive', 'lanewright-foundry', 'commons');
    expect(observationPoints(g, 'sta', ['white-dwarf'])).toBe(30);
    // Tau Ceti is 11.9 ly from Sol: within the Long Array's 20.
    expect(watchedSystems(world, g, 'sta').has('tau-ceti')).toBe(true);
    expect(researchOf(world, g, 'sta').parts).toContainEqual({
      label: 'the Lapse Archive (+20%)',
      value: Math.floor((research * 20) / 100),
    });
    expect(laneQuote(world, g, 'sta', 'sol', 'sirius').cost.industry).toBe(Math.ceil(lane.industry / 2));
    expect(approvalOf(world, g, capital(g)).total).toBe(Math.min(100, approval + RULES.greatWorks.commonsApproval));
    expect(growthOf(world, g, capital(g))).toBeGreaterThanOrEqual(growth);
  });

  it('is famous: every power sees the colony that holds one', () => {
    const g = three();
    capital(g, 'hollow-wake').projects.push('lanewright-foundry');
    expect(knownView(world, g, 'sta').holdings.some((h) => h.id === capital(g, 'hollow-wake').id)).toBe(true);
  });

  it('rivals build theirs at the capital when they can: the Authority the Archive, the Cooperative the Commons, the Wake the Foundry', () => {
    const g = newGame(world, {
      seed: 42,
      powers: [
        { faction: 'sta', controller: 'ai' },
        { faction: 'frontier', controller: 'ai' },
        { faction: 'hollow-wake', controller: 'ai' },
      ],
    });
    const wants: [FactionId, TechId, string][] = [
      ['sta', 'public-schooling', 'lapse-archive'],
      ['frontier', 'gene-tailoring', 'commons'],
      ['hollow-wake', 'lane-relays', 'lanewright-foundry'],
    ];
    for (const [f, tech, work] of wants) {
      expect(
        aiOrders(world, g, f).some((o) => o.type === 'queue' && o.item.kind === 'project' && o.item.project === work),
      ).toBe(false);
      knowing(g, f, 'great-engineering', tech);
      expect(
        aiOrders(world, g, f).some(
          (o) =>
            o.type === 'queue' &&
            o.holding === capital(g, f).id &&
            o.item.kind === 'project' &&
            o.item.project === work,
        ),
        f,
      ).toBe(true);
    }
  });
});

describe('the score (§20.3)', () => {
  it('10 a colony, 1 a million, 5 a technology, 3 a lane, 50 a great work', () => {
    const g = three();
    const s = scoreOf(g, 'sta');
    // A capital of 10 million, no technology, six lanes of its home web.
    expect(s).toEqual({
      total: 10 + 10 + 0 + 6 * 3,
      colonies: 1,
      millions: 10,
      technologies: 0,
      lanes: 6,
      greatWorks: 0,
    });
    knowing(g, 'sta', 'deep-survey', 'habitat-domes');
    capital(g).projects.push('commons');
    expect(scoreOf(g, 'sta').total).toBe(38 + 2 * 5 + 50);
  });

  it('a rival’s as far as you see it: its technologies only once met, its great works always', () => {
    const g = three();
    knowing(g, 'hollow-wake', 'deep-survey', 'habitat-domes', 'soil-science');
    capital(g, 'hollow-wake').projects.push('lanewright-foundry');
    let rows = standings(knownView(world, g, 'sta'), 'sta');
    const wake = () => rows.find((r) => r.faction === 'hollow-wake');
    // Seen by its great work alone: its capital, its people, its great work; not its lanes nor its technologies.
    expect(wake()?.score).toBe(10 + 10 + 50);
    powerOf(g, 'sta').surveyed.push('wolf-1061');
    rows = standings(knownView(world, g, 'sta'), 'sta');
    expect(wake()?.score).toBe(
      10 + 10 + 3 * 5 + 50 + 3 * knownView(world, g, 'sta').lanes.filter((l) => l.owner === 'hollow-wake').length,
    );
    expect(rows[0]?.score).toBe(scoreOf(g, 'sta').total);
  });
});
