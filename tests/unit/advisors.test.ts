import { describe, expect, it } from 'vitest';
import manifest from '../../art/manifest.json' with { type: 'json' };
import { ADVISORS, DEPARTMENTS, fillLine, LINES, type LineKind } from '../../src/content/advisors.ts';
import { FACTION_IDS, type FactionId } from '../../src/content/factions.ts';
import { SKY } from '../../src/data/sky.ts';
import { adviceFor } from '../../src/sim/advice.ts';
import { needsOf } from '../../src/sim/needs.ts';
import { type GameState, newGame } from '../../src/sim/state.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** The advisors (M2_WORLDS.md §9, §24). */

const world = buildWorld(SKY);
const start = (faction: FactionId = 'sta') => newGame(world, { seed: 42, powers: [{ faction, controller: 'player' }] });
const advise = (g: GameState, faction: FactionId = 'sta', events = g.reports[0]?.events ?? []) =>
  adviceFor(world, g, faction, events, needsOf(world, g, faction));

describe('the advisors', () => {
  it('are six for every power, one a department, each with a face in the art records', () => {
    const portraits = new Set(manifest.images.map((i) => i.id));
    for (const f of FACTION_IDS) {
      const people = Object.values(ADVISORS[f].people);
      expect(Object.keys(ADVISORS[f].people).sort()).toEqual([...DEPARTMENTS].sort());
      for (const a of people) expect(portraits.has(a.portrait), a.portrait).toBe(true);
    }
  });

  it('have every line in all three voices, with every blank filled', () => {
    const values = {
      place: 'Tau Ceti f',
      is: 'is',
      where: 'at Tau Ceti f',
      when: 'in two turns',
      tech: 'Soil science',
      effect: 'Each farm district yields 1 more food.',
      what: 'a civic centre',
      zone: 'labs',
      count: '2 ships are',
    };
    for (const kind of Object.keys(LINES) as LineKind[])
      for (const voice of ['formal', 'warm', 'blunt'] as const) {
        const line = fillLine(LINES[kind][voice], values);
        expect(line, `${kind} ${voice}`).not.toMatch(/[{}]/);
        expect(line[0], `${kind} ${voice}`).toBe(line[0]?.toUpperCase());
      }
  });
});

describe('what they say in the report (§24.2)', () => {
  it('at the start: research first, then the idle shipyard and the idle ships, three at most', () => {
    const lines = advise(start());
    expect(lines.map((l) => [l.department, l.kind])).toEqual([
      ['science', 'no-research'],
      ['works', 'idle-yard'],
      ['survey', 'idle-ship'],
    ]);
    expect(lines[0]?.text).toBe('Control, our laboratories have nothing to work on. Please choose a technology.');
    expect(lines[0]?.advisor.name).toBe('Dr Kenji Albrecht');
    expect(lines[2]?.text).toBe('Control, 4 ships are awaiting orders.');
  });

  it('speak in their power’s voice', () => {
    expect(advise(start('frontier'), 'frontier')[0]?.text).toBe(
      'Control, the labs are idle! Pick us something to learn.',
    );
    expect(advise(start('hollow-wake'), 'hollow-wake')[0]?.text).toBe('Nothing on the bench. Give me a problem.');
  });

  it('put hunger first, and say what to do', () => {
    const g = start();
    const c = g.holdings[0];
    if (!c) throw new Error('no capital');
    for (const d of c.districts) if (d.zone === 'farms') d.zone = 'works';
    const power = g.powers[0];
    if (power) power.food = 0;
    const first = advise(g)[0];
    expect(first).toMatchObject({ department: 'colonies', kind: 'hunger-coming', priority: 1 });
    expect(first?.text).toBe(
      'Control, food on our lanes runs out when this turn ends. Farms or hydroponics would prevent it.',
    );
  });

  it('tell the turn’s news: a technology researched, with what it does', () => {
    const g = start();
    g.powers[0]?.researchQueue.push('soil-science');
    const lines = advise(g, 'sta', [{ kind: 'researched', tech: 'soil-science' }]);
    expect(lines.find((l) => l.department === 'science')?.text).toBe(
      'Control, our scientists have completed Soil science. Each farm district yields 1 more food.',
    );
  });

  it('are quiet when asked, speaking only of what needs you, and silent when off', () => {
    const g = start();
    const events = g.reports[0]?.events ?? [];
    const needs = needsOf(world, g, 'sta');
    expect(adviceFor(world, g, 'sta', events, needs, 'quiet').map((l) => l.kind)).toEqual(['no-research']);
    expect(adviceFor(world, g, 'sta', events, needs, 'off')).toEqual([]);
  });
});
