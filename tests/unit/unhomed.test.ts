import { describe, expect, it } from 'vitest';
import { FACTION_IDS, FACTIONS, type FactionId, isFactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { aiOrders } from '../../src/sim/ai.ts';
import { arksRefusal, arksTurn, givableWorlds, HEARTH, resolveArks, worldToTake } from '../../src/sim/arks.ts';
import { approvalOf } from '../../src/sim/economy.ts';
import { attitudeOf } from '../../src/sim/memory.ts';
import { needsOf } from '../../src/sim/needs.ts';
import { applyInPlace } from '../../src/sim/orders.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { type GameState, newGame, powerOf, STATE_VERSION } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { shapeProblems, stateProblems } from '../../src/sim/validate.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M5 increment 57 (M5_UNKNOWN.md §25, D-76): the dying star and the Unhomed. */

const world = buildWorld(SKY);
const U = RULES.unhomed;
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
/** The arks arrive in this game, now. */
const arrived = (player: FactionId = 'sta') => {
  const g = five(player);
  g.turn = arksTurn(g.seed);
  const ev = events(g);
  resolveArks(world, g, ev);
  return { g, ev };
};
const order = (g: GameState, f: FactionId, o: Parameters<typeof applyInPlace>[3]) => applyInPlace(world, g, f, o);
const capitalOf = (g: GameState, f: FactionId) => {
  const h = g.holdings.find((x) => x.owner === f && x.capital);
  if (!h) throw new Error('capital');
  return h;
};
/** The turn ends for the arks: answers, the star. */
const settleNow = (g: GameState) => {
  g.turn++;
  const ev = events(g);
  resolveArks(world, g, ev);
  return ev;
};

describe('a faction that arrives (§25.1, §25.8)', () => {
  it('is a faction and a species, in no new game, placing nothing at the start', () => {
    expect(isFactionId(HEARTH)).toBe(true);
    expect(FACTIONS[HEARTH].arrives).toBe(true);
    expect(FACTION_IDS).not.toContain(HEARTH);
    expect(five().powers.some((p) => p.faction === HEARTH)).toBe(false);
  });
});

describe('the arks arrive (§25.2)', () => {
  it('on a turn from 110 to 150 by the seed, at CE Boötis, and every power is told', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const t = arksTurn(seed);
      expect(t).toBeGreaterThanOrEqual(U.from);
      expect(t).toBeLessThanOrEqual(U.to);
    }
    const g = five();
    g.turn = arksTurn(g.seed) - 1;
    resolveArks(world, g, events(g));
    expect(g.arks).toBeNull();
    const { g: h, ev } = arrived();
    expect(h.arks).toEqual({ arrived: h.turn, dies: h.turn + U.diesAfter, answers: [], ended: null });
    for (const f of FACTION_IDS) expect(ev.get(f)).toContainEqual({ kind: 'arks', stage: 'arrived', system: U.at });
    expect(needsOf(world, h, 'sta')).toContainEqual({ kind: 'arks', left: U.diesAfter });
  });
});

describe('the ask (§25.3)', () => {
  it('a world given: free, in a system we hold, one they could live on; they become the Last Hearth', () => {
    const { g } = arrived();
    const ours = capitalOf(g, 'sta');
    expect(order(g, 'sta', { type: 'arks', answer: 'give', body: null })).toBe('Name the world we give them.');
    expect(order(g, 'sta', { type: 'arks', answer: 'give', body: ours.body })).toBe(
      'We can give them only a free world they could live on, in a system we hold.',
    );
    const gift = givableWorlds(world, g, 'sta')[0];
    if (!gift) throw new Error('a world to give');
    expect(order(g, 'sta', { type: 'arks', answer: 'give', body: gift.id })).toBeNull();
    expect(needsOf(world, g, 'sta').some((n) => n.kind === 'arks')).toBe(false);
    const ev = settleNow(g);
    expect(ev.get('frontier')).toContainEqual({ kind: 'arks', stage: 'given', by: 'sta', system: gift.systemId });
    expect(g.arks?.ended).toEqual({ how: 'given', by: 'sta', body: gift.id, turn: g.turn });
    const hearth = powerOf(g, HEARTH);
    const home = g.holdings.find((h) => h.owner === HEARTH);
    expect(home).toMatchObject({
      body: gift.id,
      capital: true,
      people: U.people,
      projects: ['shipyard', 'lane-station'],
    });
    expect(hearth.capital).toBe(gift.systemId);
    expect(g.ships.filter((s) => s.owner === HEARTH).map((s) => s.type)).toEqual(['survey', 'colony']);
    expect(hearth.contacts.map((c) => c.faction).sort()).toEqual([...FACTION_IDS].sort());
    expect(powerOf(g, 'frontier').contacts.some((c) => c.faction === HEARTH && c.stage === 'talk')).toBe(true);
    expect(attitudeOf(world, g, HEARTH, 'sta').parts).toContainEqual(
      expect.objectContaining({ kind: 'gave-home', amount: U.gave }),
    );
    expect(g.history.every((x) => x.scores.length === g.powers.length)).toBe(true);
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('two worlds given: the nearer to CE Boötis first; a world given before a taking-in', () => {
    const { g } = arrived();
    const a = givableWorlds(world, g, 'sta')[0];
    const b = givableWorlds(world, g, 'frontier')[0];
    if (!a || !b) throw new Error('worlds to give');
    order(g, 'sta', { type: 'arks', answer: 'give', body: a.id });
    order(g, 'frontier', { type: 'arks', answer: 'give', body: b.id });
    order(g, 'hollow-wake', { type: 'arks', answer: 'take', body: null });
    settleNow(g);
    const nearer = world.distanceDeci(U.at, a.systemId) <= world.distanceDeci(U.at, b.systemId) ? 'sta' : 'frontier';
    expect(g.arks?.ended?.by).toBe(nearer);
  });

  it('taken in: people to our colonies with the most room, research, and newcomers settling in', () => {
    const { g } = arrived();
    const capital = capitalOf(g, 'frontier');
    const people = capital.people;
    const known = powerOf(g, 'frontier').researched.length;
    const progress = Object.values(powerOf(g, 'frontier').techProgress).reduce((n, v) => n + (v ?? 0), 0);
    expect(order(g, 'frontier', { type: 'arks', answer: 'take', body: null })).toBeNull();
    settleNow(g);
    expect(g.arks?.ended).toMatchObject({ how: 'taken-in', by: 'frontier' });
    expect(capital.people).toBe(people + U.takeInPeople);
    expect(approvalOf(world, g, capital).parts).toContainEqual({
      label: 'newcomers settling in',
      value: U.takeInApproval,
    });
    const after = Object.values(powerOf(g, 'frontier').techProgress).reduce((n, v) => n + (v ?? 0), 0);
    expect(powerOf(g, 'frontier').researched.length > known || after > progress).toBe(true);
    expect(g.powers.some((p) => p.faction === HEARTH)).toBe(false);
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('refused by all, they wait; when their star dies they take a world, remembering who refused', () => {
    const { g } = arrived();
    order(g, 'sta', { type: 'arks', answer: 'refuse', body: null });
    order(g, 'hollow-wake', { type: 'arks', answer: 'refuse', body: null });
    settleNow(g);
    expect(g.arks?.ended).toBeNull();
    const target = worldToTake(world, g);
    if (!target) throw new Error('a world to take');
    g.turn = (g.arks?.dies ?? 0) - 1;
    const ev = settleNow(g);
    expect(ev.get('sta')).toContainEqual({ kind: 'arks', stage: 'star' });
    expect(ev.get('sta')).toContainEqual({ kind: 'arks', stage: 'took', system: target.systemId });
    expect(g.arks?.ended).toMatchObject({ how: 'took', by: null, body: target.id });
    expect(g.holdings.find((h) => h.owner === HEARTH)?.body).toBe(target.id);
    // Those that refused, and those that never answered, are remembered.
    for (const f of FACTION_IDS)
      expect(attitudeOf(world, g, HEARTH, f).parts).toContainEqual(
        expect.objectContaining({ kind: 'refused-home', amount: U.refused }),
      );
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('no answer once they are settled', () => {
    const { g } = arrived();
    const gift = givableWorlds(world, g, 'sta')[0];
    order(g, 'sta', { type: 'arks', answer: 'give', body: gift?.id ?? null });
    settleNow(g);
    expect(arksRefusal(world, g, 'frontier', 'refuse', null)).toBe('No one is asking for a world.');
  });
});

describe('the rivals (§25.3)', () => {
  it('answer by character, a few turns after the arks come', () => {
    const { g } = arrived('frontier');
    const answer = (f: FactionId) => aiOrders(world, g, f).find((o) => o.type === 'arks');
    expect(answer('sta')).toBeUndefined();
    g.turn += U.answerAfter[1];
    expect(answer('sta')).toMatchObject({ type: 'arks', answer: 'give' });
    expect(answer('hollow-wake')).toMatchObject({ type: 'arks', answer: 'take' });
    expect(answer('dusk-concord')).toMatchObject({ type: 'arks', answer: 'refuse' });
  });
});

describe('the Last Hearth in play (§25.5)', () => {
  it('turns on with the Hearth as a rival, and the game stays sound', () => {
    let g = five();
    g.turn = arksTurn(g.seed) - 1;
    for (let t = 0; t < 30; t++) {
      g = resolveTurn(world, g).state;
      expect(stateProblems(world, g)).toEqual([]);
    }
    expect(g.powers.some((p) => p.faction === HEARTH)).toBe(true);
    expect(g.holdings.filter((h) => h.owner === HEARTH).length).toBeGreaterThanOrEqual(1);
  }, 120_000);

  it('a save from version 29 reads with no arks', () => {
    const g = five();
    const { arks: _a, ...rest } = g;
    const raw = { format: SAVE_FORMAT, version: 1, savedAt: '2026-10-22T00:00:00Z', game: { ...rest, version: 29 } };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.arks).toBeNull();
    expect(shapeProblems(loaded)).toEqual([]);
  });
});
