import { beforeEach, describe, expect, it } from 'vitest';
import {
  currentStep,
  type GuideFlags,
  guide,
  guideFinished,
  guideGame,
  guideMe,
  setGuideFlag,
  skipStep,
  stepDone,
  stopGuide,
} from '../../src/app/guide.ts';
import { GUIDE_STEPS } from '../../src/content/guide.ts';
import { SKY } from '../../src/data/sky.ts';
import { applyOrder, type Order } from '../../src/sim/orders.ts';
import { type GameState, type Holding, makeHolding, newGame } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** The guided opening (M2_WORLDS.md §28, D-40). */

const world = buildWorld(SKY);
const start = (alone = false) =>
  newGame(world, {
    seed: 42,
    powers: alone
      ? [{ faction: 'sta', controller: 'player' }]
      : [
          { faction: 'sta', controller: 'player' },
          { faction: 'frontier', controller: 'ai' },
          { faction: 'hollow-wake', controller: 'ai' },
        ],
  });
const order = (g: GameState, o: Order) => {
  const r = applyOrder(world, g, 'sta', o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const none: GuideFlags = { capitalOpened: false, empireOpened: false, skipped: [] };
const at = (g: GameState, flags: GuideFlags = none) => currentStep(g, 'sta', flags)?.id ?? null;
const capital = (g: GameState) => g.holdings.find((h) => h.owner === 'sta' && h.capital) as Holding;
const ship = (g: GameState, type: string) => g.ships.find((s) => s.owner === 'sta' && s.type === type)?.id as number;

describe('the steps (§28.2)', () => {
  it('are eleven, each led by an advisor', () => {
    expect(GUIDE_STEPS.map((s) => s.id)).toEqual([
      'capital',
      'queue',
      'survey',
      'research',
      'taxes',
      'end-turn',
      'colony-ship',
      'ship',
      'lane',
      'governor',
      'watch',
    ]);
  });

  it('come in order, each done by doing it', () => {
    let g = start();
    expect(at(g)).toBe('capital');
    let flags: GuideFlags = { ...none, capitalOpened: true };
    expect(at(g, flags)).toBe('queue');
    g = order(g, { type: 'queue', holding: capital(g).id, item: { kind: 'project', project: 'hydroponics' } });
    expect(at(g, flags)).toBe('survey');
    g = order(g, { type: 'move', ship: ship(g, 'survey'), to: 'alpha-centauri' });
    expect(at(g, flags)).toBe('research');
    g = order(g, { type: 'research', tech: 'deep-survey' });
    expect(at(g, flags)).toBe('taxes');
    flags = { ...flags, empireOpened: true };
    expect(at(g, flags)).toBe('end-turn');
    g = resolveTurn(world, g).state;
    expect(at(g, flags)).toBe('colony-ship');
    g = order(g, { type: 'move', ship: ship(g, 'colony'), to: 'alpha-centauri' });
    expect(at(g, flags)).toBe('ship');
    g = order(g, { type: 'queue', holding: capital(g).id, item: { kind: 'ship', ship: 'survey' } });
    expect(at(g, flags)).toBe('lane');
    flags = { ...flags, skipped: ['lane'] };
    // The governor waits for a colony beyond the capital, and the Watch for news of a rival.
    expect(at(g, flags)).toBeNull();
    expect(guideFinished(g, 'sta', flags)).toBe(false);
    makeHolding(g, {
      owner: 'sta',
      kind: 'colony',
      system: 'alpha-centauri',
      body: 'proxima-cen-b',
      capital: false,
      people: 10,
    });
    expect(at(g, flags)).toBe('governor');
  });

  it('a step already done is passed over', () => {
    let g = start();
    g = order(g, { type: 'research', tech: 'deep-survey' });
    expect(stepDone('research', g, 'sta', none)).toBe(true);
    const flags = { ...none, capitalOpened: true, skipped: ['queue', 'survey'] as GuideFlags['skipped'] };
    expect(at(g, flags)).toBe('taxes');
  });

  it('the Watch’s step comes with its first news of a rival, and closing it is the last', () => {
    const g = start();
    const flags: GuideFlags = {
      capitalOpened: true,
      empireOpened: true,
      skipped: ['queue', 'survey', 'research', 'end-turn', 'colony-ship', 'ship', 'lane'],
    };
    expect(at(g, flags)).toBeNull();
    g.reports = [
      {
        faction: 'sta',
        turn: 9,
        events: [{ kind: 'rival-ship', faction: 'hollow-wake', ship: 9, type: 'survey', system: 'sol' }],
      },
    ];
    expect(at(g, flags)).toBe('watch');
    const closed = { ...flags, skipped: [...flags.skipped, 'watch', 'governor'] as GuideFlags['skipped'] };
    expect(guideFinished(g, 'sta', closed)).toBe(true);
  });

  it('playing alone, the last step follows the governor’s', () => {
    const g = start(true);
    const flags: GuideFlags = {
      capitalOpened: true,
      empireOpened: true,
      skipped: ['queue', 'survey', 'research', 'end-turn', 'colony-ship', 'ship', 'lane'],
    };
    expect(at(g, flags)).toBeNull();
    expect(at(g, { ...flags, skipped: [...flags.skipped, 'governor'] })).toBe('watch');
  });
});

describe('when it guides (§28.1)', () => {
  beforeEach(() => {
    guide.value = { on: false, game: null, flags: none, done: false };
  });

  it('guides a first game; once finished or stopped, a later game only when asked', () => {
    guideGame('42:sta', true);
    expect(guide.value).toMatchObject({ on: true, game: '42:sta' });
    setGuideFlag('capitalOpened');
    skipStep('queue');
    expect(guide.value.flags).toEqual({ capitalOpened: true, empireOpened: false, skipped: ['queue'] });
    // Continuing the same game keeps its place.
    guideGame('42:sta', false);
    expect(guide.value.flags.capitalOpened).toBe(true);
    stopGuide();
    expect(guide.value).toMatchObject({ on: false, done: true });
    guideGame('7:frontier', true);
    expect(guide.value).toMatchObject({ on: false, game: '7:frontier' });
    guideMe('7:frontier');
    expect(guide.value).toMatchObject({ on: true, game: '7:frontier', flags: none });
  });
});
