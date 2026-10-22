import { describe, expect, it } from 'vitest';
import { FACTION_IDS, type FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { electionLean, resolveAssembly } from '../../src/sim/assembly.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import { makeDesign } from '../../src/sim/designs.ts';
import { formFleet } from '../../src/sim/fleets.ts';
import { slotsUsed } from '../../src/sim/lanes.ts';
import { attitudeOf } from '../../src/sim/memory.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { scoreOf, scoreWords } from '../../src/sim/score.ts';
import { type GameState, makeHolding, makeShip, newGame, powerOf, STATE_VERSION } from '../../src/sim/state.ts';
import { passageWith, wouldMakePeace } from '../../src/sim/treaties.ts';
import { shapeProblems } from '../../src/sim/validate.ts';
import { declareWar } from '../../src/sim/war.ts';
import {
  bridgeLane,
  invasionTarget,
  pactToBreak,
  pressesOn,
  reachable,
  warshipsWanted,
  warTarget,
} from '../../src/sim/warAi.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M4 increment 51 (M4_FLEETS.md §31, D-69): many roads to victory. */

const world = buildWorld(SKY);
const talk = (faction: FactionId) => ({ faction, stage: 'talk' as const, since: 1, words: 20 });
/** All five powers, every one talking with every other; the Authority the player unless told. */
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
/** So many armed frigates of a power at a system, in one fleet. */
const warships = (g: GameState, owner: FactionId, at: string, n: number) => {
  const power = powerOf(g, owner);
  const d = makeDesign(g, power, 'frigate', `${owner}-f-${power.designs.length}`, ['pulse-1', 'pulse-1', 'shield-1']);
  return formFleet(
    g,
    owner,
    Array.from({ length: n }, () => makeShip(g, owner, 'frigate', at, d.id)),
  );
};
/** A colony of a power's in a system, on its first free world. */
const colony = (g: GameState, owner: FactionId, system: string, people = 10) => {
  const body = bodiesOf(world, g.seed, system).find((b) => !g.holdings.some((h) => h.body === b.id));
  if (!body) throw new Error('no body');
  return makeHolding(g, { owner, kind: 'colony', system, body: body.id, capital: false, people });
};
const events = (g: GameState) => new Map(g.powers.map((p) => [p.faction, [] as ReportEvent[]]));
/** Systems nearest a power's capital, nearest first, that no lane touches and that have a free world. */
const freeNear = (g: GameState, f: FactionId) => {
  const home = powerOf(g, f).capital;
  return world.systems
    .map((x) => x.id)
    .filter((id) => id !== home && slotsUsed(g, id) === 0)
    .filter((id) => bodiesOf(world, g.seed, id).some((b) => !g.holdings.some((h) => h.body === b.id)))
    .sort((x, y) => world.distanceDeci(home, x) - world.distanceDeci(home, y));
};

describe('war plans (§31.1)', () => {
  it('strikes the enemy capital first when it outmatches what defends it there, else the nearest it outmatches', () => {
    const g = five('frontier');
    const sol = powerOf(g, 'sta').capital;
    const other = colony(g, 'sta', sol);
    declareWar(g, 'hollow-wake', 'sta');
    const strike = warships(g, 'hollow-wake', sol, 6);
    expect(invasionTarget(world, g, strike)?.holding.capital).toBe(true);
    // The Authority's fleet at home: neither holding there is outmatched now.
    warships(g, 'sta', sol, 6);
    expect(invasionTarget(world, g, strike)).toBeNull();
    expect(other.capital).toBe(false);
  });
});

describe('the conquerors (§31.2)', () => {
  it('arm a warship a colony from turn 80', () => {
    const g = five('frontier');
    for (const system of freeNear(g, 'hollow-wake').slice(0, 5)) colony(g, 'hollow-wake', system);
    g.turn = RULES.rivalsWar.choiceFrom - 1;
    expect(warshipsWanted(world, g, 'hollow-wake')).toBeLessThan(6);
    g.turn = RULES.rivalsWar.choiceFrom;
    expect(warshipsWanted(world, g, 'hollow-wake')).toBeGreaterThanOrEqual(6);
    // Not the Cooperative, which is no conqueror.
    expect(warshipsWanted(world, g, 'frontier')).toBe(0);
  });

  it('see a war through while the stronger, a call for peace or not; not with no warships', () => {
    const g = five('frontier');
    declareWar(g, 'hollow-wake', 'sta');
    g.turn += 10;
    expect(pressesOn(g, 'hollow-wake', 'sta')).toBe(false);
    expect(wouldMakePeace(g, 'hollow-wake', 'sta')).toBe(true);
    warships(g, 'hollow-wake', powerOf(g, 'hollow-wake').capital, 3);
    expect(pressesOn(g, 'hollow-wake', 'sta')).toBe(true);
    expect(wouldMakePeace(g, 'hollow-wake', 'sta')).toBe(false);
    resolveAssembly(g, events(g));
    g.assembly?.calls.push({ a: 'hollow-wake', b: 'sta', until: g.turn + 5, offered: [] });
    expect(
      wouldMakePeace(g, 'hollow-wake', 'sta', { kind: 'peace', from: 'sta', to: 'hollow-wake', turn: g.turn }),
    ).toBe(false);
    // Once the Authority is as strong, it makes peace by its character again.
    warships(g, 'sta', powerOf(g, 'sta').capital, 4);
    expect(pressesOn(g, 'hollow-wake', 'sta')).toBe(false);
  });

  it('fall only on powers their fleets can reach, and build lanes toward those they cannot', () => {
    const g = five('frontier');
    g.turn = RULES.rivalsWar.choiceFrom;
    warships(g, 'hollow-wake', powerOf(g, 'hollow-wake').capital, 6);
    // The Cooperative, which the Wake thinks easy pickings, lies beyond its lanes at the start.
    expect(reachable(world, g, 'hollow-wake', 'frontier')).toBe(false);
    for (const f of ['sta', 'dusk-concord', 'drift-moot'] as const) warships(g, f, powerOf(g, f).capital, 6);
    expect(warTarget(world, g, 'hollow-wake')).toBeNull();
    // Its capital's beacon slots are full; an outpost of its, near home, has room for a lane.
    const at = freeNear(g, 'hollow-wake')[0] as string;
    const body = bodiesOf(world, g.seed, at).find((b) => !g.holdings.some((h) => h.body === b.id));
    if (!body) throw new Error('no body');
    makeHolding(g, { owner: 'hollow-wake', kind: 'outpost', system: at, body: body.id, capital: false, people: 0 });
    const lane = bridgeLane(world, g, 'hollow-wake');
    expect(lane?.holding.system).toBe(at);
    // Reachable once it holds a world where the Cooperative does: at war, the other's lanes are its.
    colony(g, 'frontier', powerOf(g, 'hollow-wake').capital);
    expect(reachable(world, g, 'hollow-wake', 'frontier')).toBe(true);
    expect(warTarget(world, g, 'hollow-wake')).toEqual({ on: 'frontier', reason: 'weak' });
  });

  it('the outlaw breaks a pact for easy prey; the lawful Concord keeps its word', () => {
    const g = five('frontier');
    g.turn = RULES.rivalsWar.choiceFrom;
    colony(g, 'sta', powerOf(g, 'hollow-wake').capital);
    colony(g, 'sta', powerOf(g, 'dusk-concord').capital);
    warships(g, 'hollow-wake', powerOf(g, 'hollow-wake').capital, 6);
    warships(g, 'dusk-concord', powerOf(g, 'dusk-concord').capital, 6);
    for (const f of ['hollow-wake', 'dusk-concord'] as const) {
      const [a, b] = f < 'sta' ? [f, 'sta' as const] : ['sta' as const, f];
      g.treaties.push({ kind: 'non-aggression', a, b, since: 1, ends: null, endedBy: null, broken: false });
    }
    expect(warTarget(world, g, 'hollow-wake')).toBeNull();
    expect(pactToBreak(world, g, 'hollow-wake')).toBe('sta');
    expect(pactToBreak(world, g, 'dusk-concord')).toBeNull();
  });

  it('a subdued power’s lanes are open to its victor, and its victor’s to it', () => {
    const g = five();
    powerOf(g, 'drift-moot').subduedBy = 'hollow-wake';
    expect(passageWith(g, 'hollow-wake')).toContain('drift-moot');
    expect(passageWith(g, 'drift-moot')).toContain('hollow-wake');
  });

  it('the balance of power: a rival goes to war on a runaway leader it can match and reach', () => {
    const g = five('frontier');
    g.turn = RULES.rivalsWar.choiceFrom;
    // The Cooperative leads every power by far, and holds a colony the Wake can reach.
    colony(g, 'frontier', powerOf(g, 'hollow-wake').capital);
    for (const h of g.holdings) if (h.owner === 'frontier') h.people = 400;
    // As strong as the Wake: not weak, but a leader to be stopped.
    warships(g, 'hollow-wake', powerOf(g, 'hollow-wake').capital, 3);
    warships(g, 'frontier', powerOf(g, 'frontier').capital, 3);
    for (const f of ['sta', 'dusk-concord', 'drift-moot'] as const) warships(g, f, powerOf(g, f).capital, 6);
    expect(warTarget(world, g, 'hollow-wake')).toEqual({ on: 'frontier', reason: 'leader' });
  });
});

describe('the Assembly’s brakes (§31.3)', () => {
  it('fear at the deciding vote: a member only warm to the power about to be chosen turns to the other', () => {
    const g = five();
    resolveAssembly(g, events(g));
    const a = g.assembly;
    if (!a) throw new Error('no assembly');
    for (const h of g.holdings) h.people = h.owner === 'frontier' ? 300 : 100;
    a.roll = a.members.map((f) => ({ faction: f, votes: f === 'frontier' ? 30 : 10 }));
    a.election = g.turn;
    a.candidates = ['frontier', 'drift-moot'];
    const gift = (of: FactionId, toward: FactionId, amount: number) =>
      powerOf(g, of).memories.push({ faction: toward, kind: 'gift', amount, turn: g.turn, credits: 100 });
    // Every member warm to the Cooperative: by regard alone it would be chosen outright.
    for (const f of ['sta', 'hollow-wake', 'dusk-concord'] as const) gift(f, 'frontier', 25);
    gift('dusk-concord', 'drift-moot', 12);
    expect(electionLean(world, g, 'dusk-concord')).toBe('drift-moot');
    // A friend votes for it all the same.
    gift('dusk-concord', 'frontier', 30);
    expect(electionLean(world, g, 'dusk-concord')).toBe('frontier');
  });

  it('tiring of a leader: after two terms in a row, ten less a term from every member not its ally', () => {
    const g = five();
    resolveAssembly(g, events(g));
    const a = g.assembly;
    if (!a) throw new Error('no assembly');
    a.leader = 'frontier';
    a.terms = 2;
    const regard = () => attitudeOf(world, g, 'drift-moot', 'frontier');
    expect(regard().parts.some((p) => p.kind === 'tired')).toBe(false);
    a.terms = 4;
    expect(regard().parts).toContainEqual(expect.objectContaining({ kind: 'tired', amount: 2 * RULES.assembly.tired }));
  });
});

describe('a less-loved Cooperative (§31.4)', () => {
  it('grows 10% faster, and the Wake and the Concord hold a quarrel with it', () => {
    const g = five();
    const quarrel = (f: FactionId) => attitudeOf(world, g, f, 'frontier').parts.find((p) => p.kind === 'character');
    expect(quarrel('hollow-wake')?.amount).toBe(-10);
    expect(quarrel('dusk-concord')?.amount).toBe(-5);
    expect(quarrel('sta')).toBeUndefined();
  });
});

describe('the score’s works (§31.4, as built)', () => {
  it('counts a point for every 100 research and 200 industry made, and says so; 0 leaves them out', () => {
    const g = five();
    const before = scoreOf(g, 'sta').total;
    powerOf(g, 'sta').story.research = 250;
    powerOf(g, 'sta').story.industry = 450;
    expect(scoreOf(g, 'sta').works).toBe(4);
    expect(scoreOf(g, 'sta').total).toBe(before + 4);
    expect(scoreWords()).toContain('a point for every 100 research and every 200 industry made in the game');
    const s = RULES.score as { researchPer: number; industryPer: number };
    const kept = { ...s };
    try {
      s.researchPer = 0;
      s.industryPer = 0;
      expect(scoreOf(g, 'sta').total).toBe(before);
      expect(scoreWords()).not.toContain('made in the game');
    } finally {
      Object.assign(s, kept);
    }
  });
});

describe('state (§31.5)', () => {
  it('a save from version 24 reads, with a term for a leader and works counted from now', () => {
    const g = five();
    resolveAssembly(g, events(g));
    const a = g.assembly;
    if (!a) throw new Error('no assembly');
    a.leader = 'frontier';
    const { terms: _t, ...oldAssembly } = a;
    const powers = g.powers.map((p) => ({ ...p, story: { wars: 0, battles: 0, taken: 0 } }));
    const raw = {
      format: SAVE_FORMAT,
      version: 1,
      savedAt: '2026-10-22T00:00:00Z',
      game: { ...g, powers, assembly: oldAssembly, version: 24 },
    };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.assembly?.terms).toBe(1);
    expect(loaded.powers.every((p) => p.story.research === 0 && p.story.industry === 0)).toBe(true);
    expect(shapeProblems(loaded)).toEqual([]);
  });
});
