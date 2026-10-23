import { describe, expect, it } from 'vitest';
import { FACTION_IDS as ALL_STARTING, type FactionId } from '../../src/content/factions.ts';

/** The five older powers: these tests set up their votes and wars (the heirs, M5_UNKNOWN.md §27, are left out). */
const FACTION_IDS = ALL_STARTING.filter((f) => f !== 'continuance');

import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { assemblyOrders, dealings } from '../../src/sim/ai.ts';
import {
  candidatesOf,
  electionLean,
  proposeRefusal,
  resolutionLean,
  resolveAssembly,
  votesOf,
} from '../../src/sim/assembly.ts';
import { applyOrder, type Order } from '../../src/sim/orders.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { type GameState, newGame, powerOf, STATE_VERSION } from '../../src/sim/state.ts';
import { offerRefusal, wouldMakePeace } from '../../src/sim/treaties.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { shapeProblems, stateProblems } from '../../src/sim/validate.ts';
import { atWar, declareWar } from '../../src/sim/war.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M4 increment 49 (M4_FLEETS.md §29): the Assembly. */

const world = buildWorld(SKY);
const talk = (faction: FactionId) => ({ faction, stage: 'talk' as const, since: 1, words: 20 });
/** All five powers, the Authority the player unless told; those named talk with each other. */
const five = (talking: readonly FactionId[] = FACTION_IDS, player: FactionId = 'sta'): GameState => {
  const g = newGame(world, {
    seed: 42,
    powers: FACTION_IDS.map((faction) => ({
      faction,
      controller: faction === player ? ('player' as const) : ('ai' as const),
    })),
  });
  for (const p of g.powers)
    if (talking.includes(p.faction)) p.contacts = talking.filter((f) => f !== p.faction).map((f) => talk(f));
  return g;
};
const events = (g: GameState) => new Map(g.powers.map((p) => [p.faction, [] as ReportEvent[]]));
/** The Assembly formed, every power a member. */
const formed = (player: FactionId = 'sta'): GameState => {
  const g = five(FACTION_IDS, player);
  resolveAssembly(g, events(g));
  return g;
};
const order = (g: GameState, o: Order, f: FactionId = 'sta') => {
  const r = applyOrder(world, g, f, o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
/** A warm memory, so a power regards another well. */
const warm = (g: GameState, of: FactionId, toward: FactionId, amount = 30) =>
  powerOf(g, of).memories.push({ faction: toward, kind: 'gift', amount, turn: g.turn, credits: 100 });

describe('forming and members (§29.1)', () => {
  it('forms when three powers can each talk with the other two, and others join', () => {
    const g = five(['sta', 'frontier']);
    resolveAssembly(g, events(g));
    expect(g.assembly).toBeNull();
    const h = five(['sta', 'frontier', 'drift-moot']);
    const ev = events(h);
    resolveAssembly(h, ev);
    expect(h.assembly?.members).toEqual(['sta', 'frontier', 'drift-moot']);
    expect(h.assembly?.election).toBe(h.turn + RULES.assembly.every);
    expect(ev.get('frontier')).toContainEqual({ kind: 'assembly-formed', members: ['sta', 'frontier', 'drift-moot'] });
    // The Wake can talk with the Authority: it joins.
    powerOf(h, 'hollow-wake').contacts.push(talk('sta'));
    powerOf(h, 'sta').contacts.push(talk('hollow-wake'));
    const later = events(h);
    resolveAssembly(h, later);
    expect(h.assembly?.members).toEqual(['sta', 'frontier', 'drift-moot', 'hollow-wake']);
    expect(later.get('hollow-wake')).toContainEqual({ kind: 'assembly-joined', faction: 'hollow-wake' });
    expect(stateProblems(world, h)).toEqual([]);
  });

  it('weighs a vote for every million people, at least one; the candidates are the two with most', () => {
    const g = formed();
    for (const h of g.holdings) h.people = h.owner === 'frontier' ? 95 : h.owner === 'drift-moot' ? 70 : 3;
    expect(votesOf(g, 'frontier')).toBe(9);
    expect(votesOf(g, 'drift-moot')).toBe(7);
    expect(votesOf(g, 'sta')).toBe(1);
    expect(candidatesOf(g)).toEqual(['frontier', 'drift-moot']);
  });
});

describe('elections (§29.2)', () => {
  /** The election this turn, between the Cooperative and the Moot. */
  const election = () => {
    const g = formed();
    for (const h of g.holdings) h.people = h.owner === 'frontier' ? 95 : h.owner === 'drift-moot' ? 70 : 40;
    const a = g.assembly;
    if (!a) throw new Error('no assembly');
    a.election = g.turn;
    a.candidates = ['frontier', 'drift-moot'];
    return g;
  };

  it('the candidates are named the turn before, and the player is asked to vote', () => {
    const g = formed();
    const a = g.assembly;
    if (!a) throw new Error('no assembly');
    a.election = g.turn + 1;
    const next = resolveTurn(world, g).state;
    expect(next.assembly?.candidates).toHaveLength(2);
    expect(next.reports.find((r) => r.faction === 'sta')?.events).toContainEqual(
      expect.objectContaining({ kind: 'candidates' }),
    );
  });

  it('a rival votes for the candidate it regards at least warmly, never one it is at war with', () => {
    const g = election();
    expect(electionLean(world, g, 'frontier')).toBe('frontier');
    // The Concord thinks nothing much of either: it abstains.
    expect(electionLean(world, g, 'dusk-concord')).toBe('abstain');
    warm(g, 'dusk-concord', 'drift-moot');
    expect(electionLean(world, g, 'dusk-concord')).toBe('drift-moot');
    declareWar(g, 'dusk-concord', 'drift-moot');
    expect(electionLean(world, g, 'dusk-concord')).toBe('abstain');
  });

  it('elects a leader; two thirds of all the votes choose it, from members who like it even then', () => {
    let g = election();
    // Fear at the deciding vote (M4_FLEETS.md §31.3): they still vote for it, liking it well enough.
    for (const f of ['hollow-wake', 'dusk-concord'] as const) warm(g, f, 'frontier', 45);
    g = order(g, { type: 'vote', choice: 'frontier' });
    const next = resolveTurn(world, g).state;
    expect(next.assembly?.leader).toBe('frontier');
    // The Cooperative 9, the Authority 4, the Wake 4, the Concord 4 of 28: 21, three quarters.
    expect(next.assembly?.chosen).toBe('frontier');
    expect(next.assembly?.election).toBe(g.turn + RULES.assembly.every);
    const elected = next.reports.find((r) => r.faction === 'sta')?.events.find((e) => e.kind === 'elected');
    expect(elected).toMatchObject({ faction: 'frontier', chosen: true });
    // Short of two thirds: led, not chosen.
    let h = election();
    for (const f of ['hollow-wake', 'dusk-concord'] as const) warm(h, f, 'frontier', 45);
    h = order(h, { type: 'vote', choice: 'drift-moot' });
    const led = resolveTurn(world, h).state;
    expect(led.assembly?.leader).toBe('frontier');
    expect(led.assembly?.chosen).toBeNull();
  });

  it('a subdued power votes as its victor does, and may not vote itself', () => {
    const forMoot = (g: GameState) => {
      const e = resolveTurn(world, g)
        .state.reports.find((r) => r.faction === 'sta')
        ?.events.find((x) => x.kind === 'elected');
      if (e?.kind !== 'elected') throw new Error('no election');
      return e.faction === 'drift-moot' ? e.votes : e.against;
    };
    const free = forMoot(election());
    const g = election();
    powerOf(g, 'sta').subduedBy = 'drift-moot';
    expect(() => order(g, { type: 'vote', choice: 'frontier' })).toThrow(
      'We are subdued by the Drift Moot: our votes go as theirs do.',
    );
    // The Authority's 4 votes go with the Moot's.
    expect(forMoot(g)).toBe(free + 4);
  });

  it('refuses a vote when nothing is before the Assembly, or for one not standing', () => {
    const g = election();
    expect(() => order(g, { type: 'vote', choice: 'hollow-wake' })).toThrow(
      'Only the two candidates can be voted for.',
    );
    expect(() => order(g, { type: 'vote', choice: 'for' })).toThrow('Only the two candidates can be voted for.');
    const quiet = formed();
    expect(() => order(quiet, { type: 'vote', choice: 'abstain' })).toThrow(
      'Nothing is before the Assembly this turn.',
    );
  });
});

describe('resolutions (§29.3)', () => {
  /** The Wake at war with the Cooperative, which has a trade treaty with the Moot and one with the Wake. */
  const war = (player: FactionId = 'sta') => {
    const g = formed(player);
    const a = g.assembly;
    if (!a) throw new Error('no assembly');
    g.turn = 10;
    a.election = 40;
    for (const [x, y] of [
      ['drift-moot', 'hollow-wake'],
      ['frontier', 'sta'],
    ] as const)
      g.treaties.push({ kind: 'trade', a: x, b: y, since: 1, ends: null, endedBy: null, broken: false });
    declareWar(g, 'hollow-wake', 'frontier');
    return g;
  };

  it('is proposed on a member at war, one at a time, not at an election, one in ten turns from each', () => {
    const g = war();
    expect(proposeRefusal(g, 'sta', { kind: 'sanctions', on: 'drift-moot' })).toBe(
      'Sanctions fall only on a member at war with another member.',
    );
    expect(proposeRefusal(g, 'sta', { kind: 'sanctions', on: 'hollow-wake' })).toBeNull();
    const next = order(g, { type: 'propose', resolution: 'sanctions', on: 'hollow-wake' });
    expect(next.assembly?.resolution).toEqual({ kind: 'sanctions', by: 'sta', on: 'hollow-wake', turn: 11 });
    expect(proposeRefusal(next, 'frontier', { kind: 'sanctions', on: 'hollow-wake' })).toBe(
      'A resolution is before the Assembly already.',
    );
    const a = g.assembly;
    if (!a) throw new Error('no assembly');
    a.election = 11;
    expect(proposeRefusal(g, 'sta', { kind: 'sanctions', on: 'hollow-wake' })).toBe(
      'The Assembly holds its election: propose after it.',
    );
    a.election = 40;
    a.proposed.push({ faction: 'sta', turn: 5 });
    expect(proposeRefusal(g, 'sta', { kind: 'sanctions', on: 'hollow-wake' })).toBe(
      'We proposed one on turn 5: the next from turn 15.',
    );
  });

  it('sanctions, passed: every member’s trade with the sanctioned ends and is refused, until its wars end', () => {
    let g = war();
    g = order(g, { type: 'propose', resolution: 'sanctions', on: 'hollow-wake' });
    g = resolveTurn(world, g).state;
    expect(g.reports.find((r) => r.faction === 'sta')?.events).toContainEqual(
      expect.objectContaining({ kind: 'resolution', resolution: 'sanctions', stage: 'proposed', on: 'hollow-wake' }),
    );
    // The vote: the Wake against; the Cooperative, at war with it, for; we for.
    expect(resolutionLean(world, g, 'hollow-wake')).toBe('against');
    expect(resolutionLean(world, g, 'frontier')).toBe('for');
    g = order(g, { type: 'vote', choice: 'for' });
    g = resolveTurn(world, g).state;
    const said = g.reports.find((r) => r.faction === 'sta')?.events ?? [];
    expect(said).toContainEqual(expect.objectContaining({ kind: 'resolution', stage: 'passed' }));
    expect(said).toContainEqual({ kind: 'sanctions', faction: 'hollow-wake', laid: true });
    expect(g.assembly?.sanctions.map((s) => s.on)).toEqual(['hollow-wake']);
    expect(g.treaties.some((t) => t.kind === 'trade' && (t.a === 'hollow-wake' || t.b === 'hollow-wake'))).toBe(false);
    expect(g.treaties.some((t) => t.kind === 'trade' && t.a === 'frontier')).toBe(true);
    expect(offerRefusal(g, 'drift-moot', 'hollow-wake', 'trade')).toBe(
      "The Assembly's sanctions on the Hollow Wake forbid trade with them.",
    );
    expect(offerRefusal(g, 'hollow-wake', 'drift-moot', 'exchange', { resource: 'credits', amount: 5 })).toBe(
      'The Assembly’s sanctions on us forbid trade with its members.',
    );
    // Peace, and they are lifted.
    g.wars = [];
    const ev = events(g);
    resolveAssembly(g, ev);
    expect(g.assembly?.sanctions).toEqual([]);
    expect(ev.get('sta')).toContainEqual({ kind: 'sanctions', faction: 'hollow-wake', laid: false });
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('a call for peace: a rival that heeds it offers and accepts peace without terms', () => {
    let g = war();
    g = order(g, { type: 'propose', resolution: 'peace-call', on: 'frontier', and: 'hollow-wake' });
    g = resolveTurn(world, g).state;
    g = order(g, { type: 'vote', choice: 'for' });
    g = resolveTurn(world, g).state;
    expect(g.assembly?.calls).toEqual([
      expect.objectContaining({ a: 'frontier', b: 'hollow-wake', until: g.turn - 1 + RULES.assembly.callTurns }),
    ]);
    // The Cooperative heeds it; the Wake, an outlaw, does not, though it is offered peace.
    expect(dealings(world, g, 'frontier')).toContainEqual({ type: 'offer', to: 'hollow-wake', treaty: 'peace' });
    expect(
      wouldMakePeace(g, 'frontier', 'hollow-wake', {
        kind: 'peace',
        from: 'hollow-wake',
        to: 'frontier',
        turn: g.turn,
      }),
    ).toBe(true);
    expect(dealings(world, g, 'hollow-wake')).not.toContainEqual({ type: 'offer', to: 'frontier', treaty: 'peace' });
  });

  it('a call unheeded: sanctions on each that has not offered peace without terms', () => {
    const g = war();
    const a = g.assembly;
    if (!a) throw new Error('no assembly');
    a.calls.push({ a: 'frontier', b: 'hollow-wake', until: g.turn, offered: ['frontier'] });
    const ev = events(g);
    resolveAssembly(g, ev);
    expect(a.sanctions.map((s) => s.on)).toEqual(['hollow-wake']);
    expect(a.calls).toEqual([]);
  });

  it('the rivals propose: the attacked, sanctions on its attacker; the Cooperative, a call for peace', () => {
    const g = war();
    expect(assemblyOrders(world, g, 'frontier')).toContainEqual({
      type: 'propose',
      resolution: 'sanctions',
      on: 'hollow-wake',
    });
    // The Moot, which calls for peace, once the war has lasted.
    expect(assemblyOrders(world, g, 'drift-moot')).toEqual([]);
    g.turn += RULES.assembly.callAfter;
    expect(assemblyOrders(world, g, 'drift-moot')).toContainEqual({
      type: 'propose',
      resolution: 'peace-call',
      on: 'frontier',
      and: 'hollow-wake',
    });
    // The Authority neither: it is not at war, and does not call for peace.
    expect(assemblyOrders(world, g, 'sta')).toEqual([]);
    expect(atWar(g, 'frontier', 'hollow-wake')).toBe(true);
  });
});

describe('state (§29.6)', () => {
  it('a save from version 22 reads, with no Assembly yet', () => {
    const g = five();
    const { assembly: _, ...old } = g;
    const raw = { format: SAVE_FORMAT, version: 1, savedAt: '2026-10-22T00:00:00Z', game: { ...old, version: 22 } };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.assembly).toBeNull();
  });

  it('a member twice, or one named who is no member, is a problem', () => {
    const g = formed();
    const a = g.assembly;
    if (!a) throw new Error('no assembly');
    a.members.push('sta');
    expect(stateProblems(world, g)).toContain('a member of the Assembly is listed twice');
    const h = five(['sta', 'frontier', 'drift-moot']);
    resolveAssembly(h, events(h));
    if (h.assembly) h.assembly.leader = 'hollow-wake';
    expect(stateProblems(world, h)).toContain('the Assembly names hollow-wake, not a member');
    expect(shapeProblems({ ...h, assembly: { members: 'all' } } as never)).toContain('the Assembly is not an assembly');
  });
});
