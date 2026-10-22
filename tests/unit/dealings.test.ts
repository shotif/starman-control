import { describe, expect, it } from 'vitest';
import type { FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { dealings } from '../../src/sim/ai.ts';
import { treasuryOf } from '../../src/sim/economy.ts';
import { attitudeOf } from '../../src/sim/memory.ts';
import { findRoute } from '../../src/sim/movement.ts';
import { applyOrder, type Order } from '../../src/sim/orders.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import {
  type Amount,
  type GameState,
  newGame,
  powerOf,
  STATE_VERSION,
  type Treaty,
  treatyOf,
} from '../../src/sim/state.ts';
import { passageWith, payForSold, resolveTreaties, tollOf, wouldAccept } from '../../src/sim/treaties.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** Exchanges and the Wake's dealings (M3_NEIGHBOURS.md §23, D-56). */

const world = buildWorld(SKY);
const three = (player: FactionId = 'sta') =>
  newGame(world, {
    seed: 42,
    powers: (['sta', 'frontier', 'hollow-wake'] as const).map((faction) => ({
      faction,
      controller: faction === player ? ('player' as const) : ('ai' as const),
    })),
  });
/** Every pair of powers in contact, at talk, from turn 1. */
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
const fresh = (g: GameState) => new Map<FactionId, ReportEvent[]>(g.powers.map((p) => [p.faction, []]));
const treaties = (g: GameState) => {
  const events = fresh(g);
  resolveTreaties(world, g, events);
  return events;
};
const sold = (kind: 'passage' | 'protection', buyer: FactionId, since = 1): Treaty => {
  const [a, b] = buyer < 'hollow-wake' ? [buyer, 'hollow-wake' as const] : ['hollow-wake' as const, buyer];
  return { kind, a, b, since, ends: null, endedBy: null, broken: false, payer: buyer };
};
const credits = (amount: number) => ({ resource: 'credits' as const, amount });
const metals = (amount: number) => ({ resource: 'metals' as const, amount });
const exchange = (give: Amount, get: Amount, to: FactionId): Order => ({
  type: 'offer',
  to,
  treaty: 'exchange',
  give,
  get,
});
/** Enough of everything that no one is short. */
const stocked = (g: GameState) => {
  for (const p of g.powers) {
    p.treasury = 200;
    p.stockpile = { metals: 100, volatiles: 100, fuel: 100 };
  }
  return g;
};

describe('exchanges (§23.1)', () => {
  it('an exchange is at talk, two different things in steps of 10 up to 100, which the offerer has', () => {
    const g = stocked(three());
    expect(refused(g, 'sta', exchange(credits(40), metals(20), 'frontier'))).toBe(
      'We cannot talk with the Frontier Co-op yet.',
    );
    allMet(g);
    expect(refused(g, 'sta', exchange(credits(45), metals(20), 'frontier'))).toBe(
      'An exchange is 10 to 100 of one thing for 10 to 100 of another, in steps of 10.',
    );
    expect(refused(g, 'sta', exchange(credits(110), metals(20), 'frontier'))).not.toBeNull();
    expect(refused(g, 'sta', exchange(metals(20), metals(30), 'frontier'))).toBe(
      'An exchange is of two different things.',
    );
    powerOf(g, 'sta').treasury = 30;
    expect(refused(g, 'sta', exchange(credits(40), metals(20), 'frontier'))).toBe('We do not have 40 credits.');
    powerOf(g, 'sta').treasury = 200;
    const h = order(g, 'sta', exchange(credits(40), metals(20), 'frontier'));
    expect(h.offers).toEqual([
      { kind: 'exchange', from: 'sta', to: 'frontier', turn: 1, give: credits(40), get: metals(20) },
    ]);
    expect(refused(h, 'sta', exchange(credits(10), metals(10), 'frontier'))).toBe(
      'An exchange with the Frontier Co-op is waiting already.',
    );
    expect(stateProblems(world, h)).toEqual([]);
  });

  it('a rival accepts what is worth at least what it gives by its regard, and both amounts change hands', () => {
    let g = order(stocked(allMet(three())), 'sta', exchange(credits(40), metals(20), 'frontier'));
    // Warm (10): 40 credits are worth 40 to it, 20 metals 40; it asks 100%.
    expect(attitudeOf(world, g, 'frontier', 'sta').word).toBe('warm');
    let events = treaties(g);
    expect(events.get('sta')).toEqual([
      { kind: 'exchange-made', faction: 'frontier', gave: credits(40), got: metals(20) },
    ]);
    expect(events.get('frontier')).toEqual([
      { kind: 'exchange-made', faction: 'sta', gave: metals(20), got: credits(40) },
    ]);
    expect(powerOf(g, 'sta').treasury).toBe(160);
    expect(powerOf(g, 'sta').stockpile.metals).toBe(120);
    expect(powerOf(g, 'frontier').treasury).toBe(240);
    expect(powerOf(g, 'frontier').stockpile.metals).toBe(80);
    expect(g.offers).toEqual([]);
    // Asking more than it is worth: refused.
    g = order(g, 'sta', exchange(credits(30), metals(20), 'frontier'));
    events = treaties(g);
    expect(events.get('sta')).toEqual([{ kind: 'exchange-refused', faction: 'frontier' }]);
    // 30 credits for 10 metals is enough; short of metals (under 20), it values them twice over.
    g = order(g, 'sta', exchange(credits(30), metals(10), 'frontier'));
    expect(treaties(g).get('sta')?.[0]?.kind).toBe('exchange-made');
    powerOf(g, 'frontier').stockpile.metals = 15;
    g = order(g, 'sta', exchange(credits(30), metals(10), 'frontier'));
    expect(treaties(g).get('sta')).toEqual([{ kind: 'exchange-refused', faction: 'frontier' }]);
  });

  it('cold, it asks 130%; hostile, never', () => {
    let g = stocked(allMet(three()));
    powerOf(g, 'frontier').memories.push({ faction: 'sta', kind: 'treaty-broken', amount: -25, turn: 1 });
    expect(attitudeOf(world, g, 'frontier', 'sta').word).toBe('cold');
    g = order(g, 'sta', exchange(credits(50), metals(20), 'frontier'));
    expect(treaties(g).get('sta')).toEqual([{ kind: 'exchange-refused', faction: 'frontier' }]);
    g = order(g, 'sta', exchange(credits(60), metals(20), 'frontier'));
    expect(treaties(g).get('sta')?.[0]?.kind).toBe('exchange-made');
    powerOf(g, 'frontier').memories.push({ faction: 'sta', kind: 'treaty-broken', amount: -40, turn: 1 });
    expect(attitudeOf(world, g, 'frontier', 'sta').word).toBe('hostile');
    g = order(g, 'sta', exchange(credits(100), metals(10), 'frontier'));
    expect(treaties(g).get('sta')).toEqual([{ kind: 'exchange-refused', faction: 'frontier' }]);
  });

  it('falls through when a side no longer has its part, and both are told', () => {
    const g = order(stocked(allMet(three())), 'sta', exchange(credits(40), metals(20), 'frontier'));
    powerOf(g, 'sta').treasury = 10;
    const events = treaties(g);
    expect(events.get('sta')).toEqual([{ kind: 'exchange-failed', faction: 'frontier' }]);
    expect(events.get('frontier')).toEqual([{ kind: 'exchange-failed', faction: 'sta' }]);
    expect(powerOf(g, 'frontier').treasury).toBe(200);
  });

  it('the player answers in the next turn: accepted, both change hands at once', () => {
    let g = order(stocked(allMet(three())), 'frontier', exchange(credits(40), metals(20), 'sta'));
    const events = treaties(g);
    expect(events.get('sta')).toEqual([
      { kind: 'exchange-received', faction: 'frontier', give: credits(40), get: metals(20) },
    ]);
    expect(g.offers).toHaveLength(1);
    const answer: Order = { type: 'answer-offer', from: 'frontier', treaty: 'exchange', accept: true };
    expect(refused(g, 'sta', answer)).toBe('No such offer is waiting for an answer.');
    g.turn = 2;
    powerOf(g, 'sta').stockpile.metals = 10;
    expect(refused(g, 'sta', answer)).toBe('We do not have 20 metals.');
    powerOf(g, 'sta').stockpile.metals = 100;
    powerOf(g, 'frontier').treasury = 20;
    expect(refused(g, 'sta', answer)).toBe('The Frontier Co-op no longer has 40 credits.');
    powerOf(g, 'frontier').treasury = 200;
    g = order(g, 'sta', answer);
    expect(g.offers).toEqual([]);
    expect(powerOf(g, 'sta').treasury).toBe(240);
    expect(powerOf(g, 'sta').stockpile.metals).toBe(80);
    expect(powerOf(g, 'frontier').stockpile.metals).toBe(120);
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('a rival short of a resource, with credits to spare, offers 40 credits for 20 to the power that regards it best', () => {
    const g = stocked(allMet(three()));
    g.turn = 3; // the Wake's turn to deal: (3 + 2) is a multiple of 5.
    const offers = (f: FactionId) => dealings(world, g, f).filter((o) => o.type === 'offer' && o.treaty === 'exchange');
    expect(offers('hollow-wake')).toEqual([]);
    powerOf(g, 'hollow-wake').stockpile.volatiles = 15;
    // The Cooperative regards it at 5, the Authority at −5.
    expect(offers('hollow-wake')).toEqual([exchange(credits(40), { resource: 'volatiles', amount: 20 }, 'frontier')]);
    powerOf(g, 'hollow-wake').treasury = 100;
    expect(offers('hollow-wake')).toEqual([]);
    powerOf(g, 'hollow-wake').treasury = 200;
    for (const f of ['sta', 'frontier'] as const)
      powerOf(g, f).memories.push({ faction: 'hollow-wake', kind: 'treaty-broken', amount: -20, turn: 1 });
    expect(offers('hollow-wake')).toEqual([]);
  });
});

describe('passage for a toll (§23.2)', () => {
  it('only from one that sells it; the buyer’s ships may use the seller’s lanes, not the other way', () => {
    const g = stocked(allMet(three()));
    expect(refused(g, 'sta', { type: 'offer', to: 'frontier', treaty: 'passage' })).toBe(
      'Neither of us sells passage.',
    );
    expect(refused(g, 'sta', { type: 'offer', to: 'hollow-wake', treaty: 'passage' })).toBeNull();
    const wakeLane = g.lanes.find((l) => l.owner === 'hollow-wake' && l.status === 'open');
    const staLane = g.lanes.find((l) => l.owner === 'sta' && l.status === 'open');
    if (!wakeLane || !staLane) throw new Error('no open lanes');
    const [a, b] = wakeLane.id.split('~') as [string, string];
    const [c, d] = staLane.id.split('~') as [string, string];
    expect(findRoute(world, g, 'sta', a, b)).toBeNull();
    g.treaties.push(sold('passage', 'sta'));
    expect(passageWith(g, 'sta')).toEqual(['hollow-wake']);
    expect(passageWith(g, 'hollow-wake')).toEqual([]);
    expect(findRoute(world, g, 'sta', a, b)?.[0]?.lane).toBe(wakeLane.id);
    expect(findRoute(world, g, 'hollow-wake', c, d)).toBeNull();
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('a rival sells when its regard reaches what it asks and the buyer has 50 credits in hand', () => {
    let g = stocked(allMet(three()));
    // The Wake asks −10 of a buyer; its regard for the Authority is 0.
    g = order(g, 'sta', { type: 'offer', to: 'hollow-wake', treaty: 'passage' });
    let events = treaties(g);
    expect(events.get('sta')).toContainEqual({
      kind: 'offer-answered',
      faction: 'hollow-wake',
      treaty: 'passage',
      accepted: true,
    });
    expect(treatyOf(g, 'sta', 'hollow-wake', 'passage')?.payer).toBe('sta');
    g = stocked(allMet(three()));
    powerOf(g, 'sta').treasury = 40;
    g = order(g, 'sta', { type: 'offer', to: 'hollow-wake', treaty: 'protection' });
    events = treaties(g);
    expect(events.get('sta')).toContainEqual({
      kind: 'offer-answered',
      faction: 'hollow-wake',
      treaty: 'protection',
      accepted: false,
    });
  });

  it('the toll: 1 a turn for each of the seller’s open lanes, from 2 to 8, from the turn after; in both treasuries', () => {
    const g = stocked(allMet(three()));
    const lanes = g.lanes.filter((l) => l.owner === 'hollow-wake' && l.status === 'open').length;
    expect(tollOf(g, 'hollow-wake')).toBe(Math.min(8, Math.max(2, lanes)));
    g.treaties.push(sold('passage', 'sta'));
    const toll = tollOf(g, 'hollow-wake');
    expect(treasuryOf(world, g, 'sta').parts.find((p) => p.label.startsWith('toll'))).toBeUndefined();
    g.turn = 2;
    expect(treasuryOf(world, g, 'sta').parts).toContainEqual({ label: 'toll paid to the Hollow Wake', value: -toll });
    expect(treasuryOf(world, g, 'hollow-wake').parts).toContainEqual({
      label: 'toll from the Transit Authority',
      value: toll,
    });
    payForSold(g, fresh(g));
    expect(powerOf(g, 'sta').treasury).toBe(200 - toll);
    expect(powerOf(g, 'hollow-wake').treasury).toBe(200 + toll);
  });

  it('a buyer that cannot pay loses it as the turn ends, and neither remembers it', () => {
    const g = stocked(allMet(three()));
    g.treaties.push(sold('passage', 'sta'));
    g.turn = 2;
    powerOf(g, 'sta').treasury = 1;
    const events = fresh(g);
    payForSold(g, events);
    expect(g.treaties).toEqual([]);
    expect(events.get('sta')).toEqual([
      { kind: 'treaty-lapsed', faction: 'hollow-wake', treaty: 'passage', ours: true },
    ]);
    expect(events.get('hollow-wake')).toEqual([
      { kind: 'treaty-lapsed', faction: 'sta', treaty: 'passage', ours: false },
    ]);
    expect(powerOf(g, 'sta').memories).toEqual([]);
    expect(powerOf(g, 'hollow-wake').memories).toEqual([]);
    expect(powerOf(g, 'sta').treasury).toBe(1);
  });

  it('one that sells passage never opens its lanes freely, however warm', () => {
    const g = stocked(allMet(three()));
    for (const [x, y] of [
      ['hollow-wake', 'frontier'],
      ['frontier', 'hollow-wake'],
    ] as const)
      powerOf(g, x).memories.push({ faction: y, kind: 'gift', amount: 50, turn: 1, credits: 150 });
    expect(wouldAccept(world, g, 'frontier', 'hollow-wake', 'open-lanes')).toBe(true);
    expect(wouldAccept(world, g, 'hollow-wake', 'frontier', 'open-lanes')).toBe(false);
    g.turn = 3;
    expect(dealings(world, g, 'hollow-wake')).not.toContainEqual(expect.objectContaining({ treaty: 'open-lanes' }));
    g.turn = 4;
    expect(dealings(world, g, 'frontier')).not.toContainEqual(
      expect.objectContaining({ to: 'hollow-wake', treaty: 'open-lanes' }),
    );
  });
});

describe('bribes and protection (§23.3, §23.4)', () => {
  it('the Wake remembers a gift at 1 for every 3 credits; the others at 1 for every 5', () => {
    let g = stocked(allMet(three()));
    g = order(g, 'sta', { type: 'gift', to: 'hollow-wake', credits: 50 });
    g = resolveTurn(world, g).state;
    expect(powerOf(g, 'hollow-wake').memories).toContainEqual(
      expect.objectContaining({ faction: 'sta', kind: 'gift', amount: 16, credits: 50 }),
    );
    g = order(g, 'sta', { type: 'gift', to: 'frontier', credits: 50 });
    g = resolveTurn(world, g).state;
    expect(powerOf(g, 'frontier').memories).toContainEqual(
      expect.objectContaining({ faction: 'sta', kind: 'gift', amount: 10, credits: 50 }),
    );
  });

  it('protection costs 5 a turn and counts as a treaty in regard; the Authority never buys it', () => {
    let g = stocked(allMet(three('frontier')));
    const before = attitudeOf(world, g, 'hollow-wake', 'frontier').total;
    g = order(g, 'frontier', { type: 'offer', to: 'hollow-wake', treaty: 'protection' });
    treaties(g);
    const t = treatyOf(g, 'frontier', 'hollow-wake', 'protection');
    expect(t?.payer).toBe('frontier');
    expect(attitudeOf(world, g, 'hollow-wake', 'frontier').total).toBe(before + RULES.memory.treaty);
    g.turn = 2;
    expect(treasuryOf(world, g, 'frontier').parts).toContainEqual({
      label: 'protection paid to the Hollow Wake',
      value: -5,
    });
    // The Wake offers it to the Authority, which never pays an outlaw.
    g = order(g, 'hollow-wake', { type: 'offer', to: 'sta', treaty: 'protection' });
    const events = treaties(g);
    expect(events.get('hollow-wake')).toContainEqual({
      kind: 'offer-answered',
      faction: 'sta',
      treaty: 'protection',
      accepted: false,
    });
  });
});

describe('the lawful remember (§23.5)', () => {
  it('a lawful power counts −5 for each power it knows that buys passage or protection from an outlaw', () => {
    const g = stocked(allMet(three()));
    const before = attitudeOf(world, g, 'sta', 'frontier').total;
    g.treaties.push(sold('passage', 'frontier'), sold('protection', 'frontier'));
    const after = attitudeOf(world, g, 'sta', 'frontier');
    expect(after.total).toBe(before - 10);
    expect(after.parts.filter((p) => p.kind === 'lawful')).toEqual([
      { kind: 'lawful', reason: 'Deals with the Hollow Wake', amount: -5 },
      { kind: 'lawful', reason: 'Deals with the Hollow Wake', amount: -5 },
    ]);
    // The Wake is no lawful power, and the Cooperative thinks no less of the Authority.
    expect(attitudeOf(world, g, 'hollow-wake', 'frontier').parts.some((p) => p.kind === 'lawful')).toBe(false);
    expect(attitudeOf(world, g, 'frontier', 'sta').parts.some((p) => p.kind === 'lawful')).toBe(false);
  });
});

describe('the rivals deal (§23.6)', () => {
  it('the Wake offers passage and protection to those that would buy and can pay', () => {
    const g = stocked(allMet(three()));
    g.turn = 3;
    const sells = () =>
      dealings(world, g, 'hollow-wake').filter(
        (o) => o.type === 'offer' && (o.treaty === 'passage' || o.treaty === 'protection'),
      );
    // The Cooperative regards it at 5 (it asks −10 and 0); the Authority at −5 (0, and never).
    expect(sells()).toEqual([
      { type: 'offer', to: 'frontier', treaty: 'passage' },
      { type: 'offer', to: 'frontier', treaty: 'protection' },
    ]);
    powerOf(g, 'frontier').treasury = 40;
    expect(sells()).toEqual([]);
  });

  it('a buyer gives notice only well below what it asked', () => {
    const g = stocked(allMet(three()));
    g.treaties.push(sold('passage', 'frontier'));
    g.turn = 7;
    // Kin 10, its ways −5, the treaty 5: −15 more makes −5, below nothing, yet above the −20 it would leave at.
    powerOf(g, 'frontier').memories.push({ faction: 'hollow-wake', kind: 'treaty-broken', amount: -15, turn: 1 });
    expect(attitudeOf(world, g, 'frontier', 'hollow-wake').total).toBe(-5);
    expect(dealings(world, g, 'frontier')).not.toContainEqual(
      expect.objectContaining({ type: 'end-treaty', treaty: 'passage' }),
    );
    powerOf(g, 'frontier').memories.push({ faction: 'hollow-wake', kind: 'treaty-broken', amount: -20, turn: 1 });
    expect(dealings(world, g, 'frontier')).toContainEqual({
      type: 'end-treaty',
      with: 'hollow-wake',
      treaty: 'passage',
    });
  });
});

describe('state (§23.8)', () => {
  it('a sold treaty is paid by its buyer, and a shared one by no one', () => {
    const g = stocked(allMet(three()));
    g.treaties.push({ ...sold('passage', 'sta'), payer: 'hollow-wake' });
    expect(stateProblems(world, g)).toEqual(['treaty hollow-wake~sta~passage is not paid by its buyer']);
    g.treaties = [
      { kind: 'trade', a: 'frontier', b: 'sta', since: 1, ends: null, endedBy: null, broken: false, payer: 'sta' },
    ];
    expect(stateProblems(world, g)).toEqual(['treaty frontier~sta~trade is shared, yet paid for']);
  });

  it('a save from version 14 reads as it is, at version 15', () => {
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
    const raw = { format: SAVE_FORMAT, version: 1, savedAt: '2026-10-22T00:00:00Z', game: { ...g, version: 14 } };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(STATE_VERSION).toBe(15);
    expect(loaded.version).toBe(15);
    expect(loaded.treaties).toEqual(g.treaties);
  });

  it('in 100 turns of three rivals, the Wake sells and the game stays sound', () => {
    let g = newGame(world, {
      seed: 42,
      powers: (['sta', 'frontier', 'hollow-wake'] as const).map((faction) => ({ faction, controller: 'ai' as const })),
    });
    const seen = new Set<string>();
    for (let t = 0; t < 100; t++) {
      const r = resolveTurn(world, g);
      g = r.state;
      for (const rep of r.reports)
        for (const e of rep.events) {
          if (e.kind === 'treaty-begun' && (e.treaty === 'passage' || e.treaty === 'protection')) seen.add(e.treaty);
          if (e.kind === 'exchange-made') seen.add('exchange');
        }
    }
    expect(stateProblems(world, g)).toEqual([]);
    expect(seen.has('passage') || seen.has('protection')).toBe(true);
  }, 120_000);
});
