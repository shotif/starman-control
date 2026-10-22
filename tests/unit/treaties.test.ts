import { describe, expect, it } from 'vitest';
import { FACTIONS, type FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import type { SpeciesId } from '../../src/content/species.ts';
import { SKY } from '../../src/data/sky.ts';
import { dealings } from '../../src/sim/ai.ts';
import { networksOf } from '../../src/sim/economy.ts';
import { attitudeOf } from '../../src/sim/memory.ts';
import { findRoute, lanesFor } from '../../src/sim/movement.ts';
import { needsOf } from '../../src/sim/needs.ts';
import { applyOrder, type Order } from '../../src/sim/orders.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { techCost } from '../../src/sim/research.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { type GameState, newGame, powerOf, treatyOf } from '../../src/sim/state.ts';
import { misread, resolveTreaties, treatyBetween } from '../../src/sim/treaties.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** Treaties (M3_NEIGHBOURS.md §21, D-53). */

const world = buildWorld(SKY);
const three = (player: FactionId = 'sta') =>
  newGame(world, {
    seed: 42,
    powers: (['sta', 'frontier', 'hollow-wake'] as const).map((faction) => ({
      faction,
      controller: faction === player ? ('player' as const) : ('ai' as const),
    })),
  });
/** Every pair of powers in contact, at talk, from turn 1, as humans are. */
const allMet = (g: GameState) => {
  for (const p of g.powers)
    for (const q of g.powers)
      if (p !== q && !p.contacts.some((c) => c.faction === q.faction))
        p.contacts.push({ faction: q.faction, stage: 'talk', since: 1, words: RULES.contact.wordsToTalk });
  return g;
};
const order = (g: GameState, f: FactionId, o: Order) => {
  const r = applyOrder(world, g, f, o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const refused = (g: GameState, f: FactionId, o: Order) => {
  const r = applyOrder(world, g, f, o);
  return r.ok ? null : r.reason;
};
const treaties = (g: GameState) => {
  const events = new Map<FactionId, ReportEvent[]>(g.powers.map((p) => [p.faction, []]));
  resolveTreaties(world, g, events);
  return events;
};

describe('offers and answers (§21.2)', () => {
  it('an offer needs contact, one of each kind at a time, and none of a treaty held', () => {
    const g = three();
    expect(refused(g, 'sta', { type: 'offer', to: 'frontier', treaty: 'open-lanes' })).toBe(
      'We have not heard the Frontier Co-op.',
    );
    allMet(g);
    const h = order(g, 'sta', { type: 'offer', to: 'frontier', treaty: 'open-lanes' });
    expect(h.offers).toEqual([{ kind: 'open-lanes', from: 'sta', to: 'frontier', turn: 1 }]);
    expect(refused(h, 'sta', { type: 'offer', to: 'frontier', treaty: 'open-lanes' })).toBe(
      'An offer of open lanes between us and the Frontier Co-op is waiting already.',
    );
    expect(refused(h, 'frontier', { type: 'offer', to: 'sta', treaty: 'open-lanes' })).toBe(
      'An offer of open lanes between us and the Transit Authority is waiting already.',
    );
  });

  it('a rival answers as the turn ends: yes when its regard reaches what it asks, no otherwise', () => {
    let g = allMet(three());
    // The Cooperative asks a regard of 10 for open lanes; kin gives the Authority 10.
    expect(attitudeOf(world, g, 'frontier', 'sta').total).toBe(10);
    g = order(g, 'sta', { type: 'offer', to: 'frontier', treaty: 'open-lanes' });
    // It asks 10 for shared research too; the Wake has 10 for kin and −5 for its ways.
    expect(attitudeOf(world, g, 'frontier', 'hollow-wake').total).toBe(5);
    g = order(g, 'hollow-wake', { type: 'offer', to: 'frontier', treaty: 'shared-research' });
    const events = treaties(g);
    expect(treatyBetween(g, 'sta', 'frontier', 'open-lanes')).toMatchObject({ a: 'frontier', b: 'sta', since: 1 });
    expect(treatyBetween(g, 'hollow-wake', 'frontier', 'shared-research')).toBeUndefined();
    expect(events.get('sta')).toContainEqual({
      kind: 'offer-answered',
      faction: 'frontier',
      treaty: 'open-lanes',
      accepted: true,
    });
    expect(events.get('sta')).toContainEqual({ kind: 'treaty-begun', faction: 'frontier', treaty: 'open-lanes' });
    expect(events.get('frontier')).toContainEqual({ kind: 'treaty-begun', faction: 'sta', treaty: 'open-lanes' });
    expect(events.get('hollow-wake')).toContainEqual({
      kind: 'offer-answered',
      faction: 'frontier',
      treaty: 'shared-research',
      accepted: false,
    });
    expect(g.offers).toEqual([]);
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('the player answers in the next turn, or it is refused as that turn ends', () => {
    let g = allMet(three());
    g = order(g, 'frontier', { type: 'offer', to: 'sta', treaty: 'shared-research' });
    let events = treaties(g);
    expect(events.get('sta')).toEqual([{ kind: 'offer-received', faction: 'frontier', treaty: 'shared-research' }]);
    // Not answerable the turn it is made.
    expect(refused(g, 'sta', { type: 'answer-offer', from: 'frontier', treaty: 'shared-research', accept: true })).toBe(
      'No such offer is waiting for an answer.',
    );
    g.turn = 2;
    expect(needsOf(world, g, 'sta')).toContainEqual({ kind: 'offer', from: 'frontier', treaty: 'shared-research' });
    const yes = order(g, 'sta', { type: 'answer-offer', from: 'frontier', treaty: 'shared-research', accept: true });
    expect(treatyBetween(yes, 'sta', 'frontier', 'shared-research')?.since).toBe(2);
    events = treaties(yes);
    expect(events.get('frontier')).toContainEqual({ kind: 'treaty-begun', faction: 'sta', treaty: 'shared-research' });
    // Left unanswered, refused.
    events = treaties(g);
    expect(g.offers).toEqual([]);
    expect(events.get('frontier')).toContainEqual({
      kind: 'offer-answered',
      faction: 'sta',
      treaty: 'shared-research',
      accepted: false,
    });
  });

  it('before talk an offer may be misread, 1 in 20 for each word to learn, and is remembered', () => {
    const wake = FACTIONS['hollow-wake'] as { species: SpeciesId };
    const was = wake.species;
    wake.species = 'twilight-test' as SpeciesId;
    try {
      const g = allMet(three());
      const c = powerOf(g, 'sta').contacts.find((x) => x.faction === 'hollow-wake');
      if (!c) throw new Error('no contact');
      Object.assign(c, { stage: 'words', words: 0 });
      // With no word learnt, every offer is misread; with all of them, none.
      const offer = { kind: 'shared-research' as const, from: 'sta' as const, to: 'hollow-wake' as const, turn: 1 };
      expect(misread(g, offer)).toBe(true);
      c.words = 19;
      let count = 0;
      for (let t = 1; t <= 400; t++) {
        g.turn = t;
        if (misread(g, { ...offer, turn: t })) count++;
      }
      expect(count).toBeGreaterThan(5);
      expect(count).toBeLessThan(45);
      g.turn = 1;
      c.words = 0;
      g.offers.push(offer);
      const events = treaties(g);
      expect(events.get('sta')).toEqual([
        { kind: 'offer-misread', faction: 'hollow-wake', treaty: 'shared-research', ours: true },
      ]);
      expect(powerOf(g, 'hollow-wake').memories).toContainEqual({
        faction: 'sta',
        kind: 'offer-misread',
        amount: -5,
        treaty: 'shared-research',
        turn: 1,
      });
    } finally {
      wake.species = was;
    }
  });
});

describe('what the treaties do (§21.1)', () => {
  it('open lanes: each may route its ships over the other’s lanes; food and survey still follow its own', () => {
    const g = allMet(three());
    const coopLane = g.lanes.find((l) => l.owner === 'frontier');
    if (!coopLane) throw new Error('no Cooperative lane');
    const [a, b] = coopLane.id.split('~') as [string, string];
    expect(findRoute(world, g, 'sta', a, b)).toBeNull();
    g.treaties.push({
      kind: 'open-lanes',
      a: 'frontier',
      b: 'sta',
      since: 1,
      ends: null,
      endedBy: null,
      broken: false,
    });
    expect(findRoute(world, g, 'sta', a, b)?.[0]?.lane).toBe(coopLane.id);
    expect(lanesFor(world, g, 'sta').has(a)).toBe(false);
    expect(lanesFor(world, g, 'sta', true).has(a)).toBe(true);
    expect(networksOf(world, g, 'sta')).toEqual(networksOf(world, allMet(three()), 'sta'));
  });

  it('shared research: 25% less for what the partner knows, up to 50% in all', () => {
    const g = allMet(three());
    const p = powerOf(g, 'sta');
    powerOf(g, 'frontier').researched.push('magnetics');
    expect(techCost(g, p, 'magnetics')).toBe(51);
    g.treaties.push({
      kind: 'shared-research',
      a: 'frontier',
      b: 'sta',
      since: 1,
      ends: null,
      endedBy: null,
      broken: false,
    });
    expect(techCost(g, p, 'magnetics')).toBe(45);
    powerOf(g, 'hollow-wake').researched.push('magnetics');
    expect(techCost(g, p, 'magnetics')).toBe(36);
    g.treaties.push({
      kind: 'shared-research',
      a: 'hollow-wake',
      b: 'sta',
      since: 1,
      ends: null,
      endedBy: null,
      broken: false,
    });
    expect(techCost(g, p, 'magnetics')).toBe(30);
  });

  it('each treaty in force counts 5 in each one’s regard for the other', () => {
    const g = allMet(three());
    g.treaties.push({
      kind: 'open-lanes',
      a: 'frontier',
      b: 'sta',
      since: 1,
      ends: null,
      endedBy: null,
      broken: false,
    });
    expect(attitudeOf(world, g, 'frontier', 'sta').parts).toContainEqual({
      kind: 'treaty',
      reason: 'Bound to us by open lanes',
      amount: 5,
    });
    expect(attitudeOf(world, g, 'sta', 'frontier').total).toBe(15);
  });
});

describe('ending and breaking (§21.3)', () => {
  it('notice: it holds 5 more turns, then ends; remembered at −5', () => {
    let g = allMet(three());
    g.treaties.push({
      kind: 'open-lanes',
      a: 'frontier',
      b: 'sta',
      since: 1,
      ends: null,
      endedBy: null,
      broken: false,
    });
    g = order(g, 'sta', { type: 'end-treaty', with: 'frontier', treaty: 'open-lanes' });
    expect(treatyOf(g, 'sta', 'frontier', 'open-lanes')).toMatchObject({ ends: 6, endedBy: 'sta', broken: false });
    expect(refused(g, 'sta', { type: 'end-treaty', with: 'frontier', treaty: 'open-lanes' })).toBe(
      'Notice is given already: it ends in 5 turns.',
    );
    expect(powerOf(g, 'frontier').memories).toContainEqual({
      faction: 'sta',
      kind: 'treaty-ended',
      amount: -5,
      treaty: 'open-lanes',
      turn: 1,
    });
    let events = treaties(g);
    expect(events.get('frontier')).toContainEqual({
      kind: 'treaty-notice',
      faction: 'sta',
      treaty: 'open-lanes',
      by: 'sta',
      ends: 6,
    });
    g.turn = 6;
    events = treaties(g);
    expect(g.treaties).toEqual([]);
    expect(events.get('sta')).toContainEqual({
      kind: 'treaty-ended',
      faction: 'frontier',
      treaty: 'open-lanes',
      by: 'sta',
      broken: false,
    });
  });

  it('broken: it ends as the turn ends; −20 for the other, −5 for every power in contact with the breaker', () => {
    let g = allMet(three());
    g.treaties.push({
      kind: 'open-lanes',
      a: 'frontier',
      b: 'sta',
      since: 1,
      ends: null,
      endedBy: null,
      broken: false,
    });
    g = order(g, 'sta', { type: 'break-treaty', with: 'frontier', treaty: 'open-lanes' });
    expect(powerOf(g, 'frontier').memories.map((m) => [m.kind, m.amount])).toEqual([['treaty-broken', -20]]);
    expect(powerOf(g, 'hollow-wake').memories.map((m) => [m.kind, m.amount, m.victim])).toEqual([
      ['treaty-broken-heard', -5, 'frontier'],
    ]);
    expect(attitudeOf(world, g, 'hollow-wake', 'sta').parts.at(-1)?.reason).toBe(
      'We broke a treaty with the Frontier Co-op',
    );
    const events = treaties(g);
    expect(g.treaties).toEqual([]);
    expect(events.get('hollow-wake')).toEqual([
      { kind: 'treaty-broken-heard', faction: 'sta', victim: 'frontier', treaty: 'open-lanes' },
    ]);
  });
});

describe('the rivals deal (§21.4)', () => {
  it('offer when the other’s regard is enough, send a gift when it is a little short, and give notice when cold', () => {
    const g = allMet(three('frontier'));
    g.turn = 4; // the Authority's turn to deal: (4 + 0) is not a multiple of 5, the Cooperative's (4 + 1) is.
    expect(dealings(world, g, 'sta').filter((o) => o.type === 'offer')).toEqual([]);
    g.turn = 5;
    // The Authority wants open lanes, a border, trade and non-aggression (M4) with the Cooperative
    // (its regard 10), and the Cooperative's regard for it is enough (10); it wants no treaty with
    // the Wake (10 − 15 = −5).
    expect(dealings(world, g, 'sta')).toEqual([
      { type: 'offer', to: 'frontier', treaty: 'open-lanes' },
      { type: 'offer', to: 'frontier', treaty: 'border' },
      { type: 'offer', to: 'frontier', treaty: 'trade' },
      { type: 'offer', to: 'frontier', treaty: 'non-aggression' },
    ]);
    // The Wake wants to sell the Authority passage (with 100 credits to pay for it), whose regard
    // (−5) falls short of the 0 it asks (§23.6): a gift of 50. It wants shared research with the
    // Cooperative too, but the Cooperative's regard for it (5) is 15 short of the 20 it asks: too far.
    g.turn = 3;
    const gifts = () => dealings(world, g, 'hollow-wake').filter((o) => o.type === 'gift');
    powerOf(g, 'sta').treasury = 100;
    powerOf(g, 'hollow-wake').treasury = 300;
    expect(gifts()).toEqual([{ type: 'gift', to: 'sta', credits: 50 }]);
    powerOf(g, 'hollow-wake').treasury = 100;
    expect(gifts()).toEqual([]);
    // Gone cold: notice.
    g.treaties.push({
      kind: 'open-lanes',
      a: 'frontier',
      b: 'sta',
      since: 1,
      ends: null,
      endedBy: null,
      broken: false,
    });
    powerOf(g, 'sta').memories.push({
      faction: 'frontier',
      kind: 'treaty-broken',
      amount: -30,
      turn: 1,
      treaty: 'open-lanes',
    });
    g.turn = 7;
    expect(dealings(world, g, 'sta')).toContainEqual({ type: 'end-treaty', with: 'frontier', treaty: 'open-lanes' });
  });

  it('a save from version 13 holds no treaty and no offer', () => {
    const g = three();
    const { treaties: _t, offers: _o, ...rest } = g;
    const raw = { format: SAVE_FORMAT, version: 1, savedAt: '2026-10-22T00:00:00Z', game: { ...rest, version: 13 } };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.treaties).toEqual([]);
    expect(loaded.offers).toEqual([]);
  });

  it('in 100 turns of three rivals, every one agrees a treaty, and the game stays sound', () => {
    let g = newGame(world, {
      seed: 42,
      powers: (['sta', 'frontier', 'hollow-wake'] as const).map((faction) => ({ faction, controller: 'ai' as const })),
    });
    const begun: [FactionId, FactionId, string][] = [];
    for (let t = 0; t < 100; t++) {
      const before = g;
      const r = resolveTurn(world, g);
      g = r.state;
      for (const rep of r.reports)
        for (const e of rep.events)
          if (e.kind === 'offer-answered' && e.accepted) begun.push([e.faction, rep.faction, e.treaty]);
      expect(before.turn + 1).toBe(g.turn);
    }
    expect(stateProblems(world, g)).toEqual([]);
    const holders = new Set(begun.flatMap(([a, b]) => [a, b]));
    expect([...holders].sort()).toEqual(['frontier', 'hollow-wake', 'sta']);
  }, 120_000);
});
