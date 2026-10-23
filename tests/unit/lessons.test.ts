import { beforeEach, describe, expect, it } from 'vitest';
import { currentLesson, forgetLessons, lessonDue, lessons, lessonsOn, tellLesson } from '../../src/app/lessons.ts';
import { DEFAULT_SETTINGS, settings } from '../../src/app/settings.ts';
import { ADVISORS } from '../../src/content/advisors.ts';
import { FACTION_IDS, type FactionId, PLAYABLE_IDS } from '../../src/content/factions.ts';
import { LESSONS, type LessonId } from '../../src/content/lessons.ts';
import { SKY } from '../../src/data/sky.ts';
import { arksTurn, resolveArks } from '../../src/sim/arks.ts';
import { relicSites } from '../../src/sim/relics.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { type GameState, type Holding, markSurveyed, newGame, powerOf } from '../../src/sim/state.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M6 increment 61 (M6_ONE.md §20, D-80): lessons when they matter. */

const world = buildWorld(SKY);
const game = (): GameState =>
  newGame(world, {
    seed: 42,
    powers: FACTION_IDS.map((faction) => ({
      faction,
      controller: faction === 'sta' ? ('player' as const) : ('ai' as const),
    })),
  });
const due = (g: GameState) => LESSONS.filter((l) => lessonDue(l.id, world, g, 'sta')).map((l) => l.id);
const capital = (g: GameState) => g.holdings.find((h) => h.owner === 'sta' && h.capital) as Holding;
const talk = (g: GameState, other: FactionId) =>
  powerOf(g, 'sta').contacts.push({ faction: other, stage: 'talk', since: 1, words: 20 });

beforeEach(() => {
  lessons.value = { told: [] };
  settings.value = { ...DEFAULT_SETTINGS };
});

describe('the lessons (§20.2)', () => {
  it('are sixteen, each in three voices, with a hint and a summary', () => {
    expect(LESSONS).toHaveLength(16);
    for (const l of LESSONS) {
      for (const voice of ['formal', 'warm', 'blunt'] as const) expect(l.lines[voice].length, l.id).toBeGreaterThan(20);
      expect(l.hint.length, l.id).toBeGreaterThan(20);
      expect(l.summary.split('. ').length, l.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('each playable power has the advisor every lesson names', () => {
    for (const f of PLAYABLE_IDS)
      for (const l of LESSONS) expect(ADVISORS[f].people[l.department].portrait).toBeTruthy();
  });

  it('none is due at the start of a game', () => {
    expect(due(game())).toEqual([]);
  });
});

describe('when each is due (§20.2)', () => {
  it('debt, hunger and unrest, by our treasury and colonies', () => {
    const g = game();
    powerOf(g, 'sta').treasury = -1;
    capital(g).hungry = 1;
    expect(due(g)).toEqual(expect.arrayContaining(['debt', 'hunger']));
    expect(due(g)).not.toContain('unrest');
    // High taxes, hunger, debt and newly taken: unrest or worse.
    powerOf(g, 'sta').taxes = 'high';
    capital(g).taken = 5;
    expect(due(g)).toEqual(expect.arrayContaining(['debt', 'hunger', 'unrest']));
  });

  it('contact, talking, the Assembly and agents, by whom we know', () => {
    const g = game();
    powerOf(g, 'sta').contacts.push({ faction: 'frontier', stage: 'words', since: 1, words: 2 });
    expect(due(g)).toEqual(['contact']);
    talk(g, 'hollow-wake');
    expect(due(g)).toEqual(['contact', 'talk']);
    g.turn = 30;
    expect(due(g)).toEqual(['contact', 'talk', 'agents']);
    g.assembly = { members: ['sta', 'frontier', 'hollow-wake'] } as never;
    expect(due(g)).toContain('assembly');
  });

  it('war, and a raid on us in the last report', () => {
    const g = game();
    g.wars.push({ a: 'frontier', b: 'sta', by: 'frontier', since: 1, reason: 'claim' } as never);
    expect(due(g)).toContain('war');
    const raided: ReportEvent = {
      kind: 'raided',
      holding: capital(g).id,
      system: capital(g).system,
      by: 'hollow-wake',
      from: 'sta',
      fleet: 1,
      credits: 0,
      metals: 0,
      volatiles: 0,
      fuel: 0,
    };
    g.reports = [{ faction: 'sta', turn: g.turn, events: [raided] }];
    expect(due(g)).toContain('raided');
  });

  it('relic sites, a chapter waiting and a key found', () => {
    const g = game();
    const site = relicSites(world, g.seed)[0];
    if (!site) throw new Error('a site');
    markSurveyed(powerOf(g, 'sta'), site.system);
    expect(due(g)).toEqual(['relic-site']);
    g.digs.push({ system: site.system, by: 'sta', chapters: 0, progress: 0, waiting: g.turn, answer: null });
    expect(due(g)).toContain('chapter');
    g.keys.push({ system: site.system, holding: null, by: null });
    expect(due(g)).toContain('keys');
  });

  it('the arks, until we answer', () => {
    const g = game();
    g.turn = arksTurn(g.seed);
    resolveArks(world, g, new Map(g.powers.map((p) => [p.faction, [] as ReportEvent[]])));
    expect(due(g)).toContain('arks');
    g.arks?.answers.push({ faction: 'sta', answer: 'refuse', body: null });
    expect(due(g)).not.toContain('arks');
  });

  it('warships, once we hold or queue one', () => {
    const g = game();
    capital(g).queue.push({ kind: 'ship', ship: 'frigate' });
    expect(due(g)).toContain('warships');
  });
});

describe('told once on this device (§20.1)', () => {
  it('the first due in their order, then the next once told; Tell me again forgets them', () => {
    const g = game();
    powerOf(g, 'sta').contacts.push({ faction: 'frontier', stage: 'talk', since: 1, words: 20 });
    powerOf(g, 'sta').treasury = -5;
    const order = (): LessonId | null => currentLesson(world, g, 'sta', lessons.value.told)?.id ?? null;
    expect(order()).toBe('debt');
    tellLesson('debt');
    expect(order()).toBe('contact');
    tellLesson('contact');
    tellLesson('contact');
    expect(lessons.value.told).toEqual(['debt', 'contact']);
    expect(order()).toBe('talk');
    tellLesson('talk');
    expect(order()).toBeNull();
    forgetLessons();
    expect(order()).toBe('debt');
  });

  it('off with the guide in the settings', () => {
    expect(lessonsOn()).toBe(true);
    settings.value = { ...settings.value, guide: 'off' };
    expect(lessonsOn()).toBe(false);
  });
});
