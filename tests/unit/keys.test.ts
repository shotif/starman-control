import { describe, expect, it } from 'vitest';
import { FACTION_IDS, FACTIONS, type FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { aiOrders } from '../../src/sim/ai.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import {
  beginAnswerRefusal,
  isKeySite,
  keyAt,
  keyKnown,
  keySites,
  keysHeld,
  resolveAnswer,
  resolveKeys,
  resolveKeysFound,
} from '../../src/sim/keys.ts';
import { attitudeOf } from '../../src/sim/memory.ts';
import { applyInPlace } from '../../src/sim/orders.ts';
import { digAt, excavate, excavateRefusal, relicSites } from '../../src/sim/relics.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { type GameState, makeHolding, markSurveyed, newGame, powerOf, STATE_VERSION } from '../../src/sim/state.ts';
import { shapeProblems, stateProblems } from '../../src/sim/validate.ts';
import { resolveVictory, victoryNow } from '../../src/sim/victory.ts';
import { warTarget } from '../../src/sim/warAi.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** M5 increment 53 (M5_UNKNOWN.md §21, D-71): the keys of the Absent and the Answer. */

const world = buildWorld(SKY);
const K = RULES.keys;
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
const keyed = keySites(world, 42);
/** An outpost of a power in a system, on its first free world. */
const outpostAt = (g: GameState, owner: FactionId, system: string) => {
  const body = bodiesOf(world, g.seed, system).find((b) => !g.holdings.some((h) => h.body === b.id));
  if (!body) throw new Error('no body');
  return makeHolding(g, { owner, kind: 'outpost', system, body: body.id, capital: false, people: 0 });
};
/** A key site's third chapter done by a power, its key then found. */
const findKey = (g: GameState, f: FactionId, system: string) => {
  const p = powerOf(g, f);
  markSurveyed(p, system);
  if (!p.researched.includes('relic-studies')) p.researched.push('relic-studies');
  const h = outpostAt(g, f, system);
  excavate(g, f, system);
  const d = digAt(g, system);
  if (!d) throw new Error('dig');
  d.chapters = 3;
  resolveKeysFound(world, g, events(g));
  return h;
};

describe('where the keys lie (§21.1)', () => {
  it('five of the sites, from the seed, the one nearest each capital', () => {
    expect(keyed).toHaveLength(K.count);
    expect(keySites(world, 42)).toBe(keyed);
    const sites = relicSites(world, 42).map((s) => s.system);
    for (const s of keyed) expect(sites).toContain(s);
    for (const f of Object.values(FACTIONS)) {
      const nearest = [...sites].sort(
        (a, b) => world.distanceDeci(f.capital.systemId, a) - world.distanceDeci(f.capital.systemId, b),
      );
      expect(
        nearest.slice(0, K.count).some((s) => keyed.includes(s)),
        f.id,
      ).toBe(true);
    }
    expect(isKeySite(world, 42, keyed[0] ?? '')).toBe(true);
  });
});

describe('a key found, taken and lost (§21.2)', () => {
  it('found with its site’s third chapter, in the excavating power’s holding; every power that knows it hears', () => {
    const g = five();
    const site = keyed[0] ?? '';
    const h = findKey(g, 'sta', site);
    expect(keyAt(g, site)).toEqual({ system: site, holding: h.id, by: 'sta' });
    expect(keysHeld(g, 'sta')).toHaveLength(1);
    const ev = events(g);
    const d = digAt(g, site);
    if (d) d.chapters = 3;
    resolveKeysFound(world, g, ev);
    expect(ev.get('frontier')).toEqual([]);
    const g2 = five();
    const ev2 = events(g2);
    findKey(g2, 'sta', site);
    const fresh = events(g2);
    const k = keyAt(g2, site);
    if (k) k.holding = null;
    resolveKeysFound(world, g2, fresh);
    expect(fresh.get('frontier')).toContainEqual({ kind: 'key', system: site, stage: 'found', by: 'sta' });
    expect(ev2.get('sta')).toEqual([]);
  });

  it('taken with its holding, and lost with it: its site needs its third chapter again', () => {
    const g = five();
    const site = keyed[0] ?? '';
    const h = findKey(g, 'sta', site);
    h.owner = 'hollow-wake';
    const ev = events(g);
    resolveKeys(g, ev);
    expect(keysHeld(g, 'hollow-wake')).toHaveLength(1);
    expect(ev.get('sta')).toContainEqual({ kind: 'key', system: site, stage: 'taken', by: 'hollow-wake', from: 'sta' });
    g.holdings = g.holdings.filter((x) => x.id !== h.id);
    const lost = events(g);
    resolveKeys(g, lost);
    expect(keyAt(g, site)).toMatchObject({ holding: null, by: null });
    expect(digAt(g, site)).toMatchObject({ chapters: 2, by: null });
    expect(lost.get('hollow-wake')).toContainEqual({
      kind: 'key',
      system: site,
      stage: 'lost',
      by: null,
      from: 'hollow-wake',
    });
    // Found again with one chapter more.
    ready(g, 'frontier', site);
    expect(excavateRefusal(world, g, 'frontier', site)).toBeNull();
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('feared: every other power thinks 5 less of a power for each key it holds', () => {
    const g = five();
    findKey(g, 'sta', keyed[0] ?? '');
    findKey(g, 'sta', keyed[1] ?? '');
    const part = attitudeOf(world, g, 'frontier', 'sta').parts.find((p) => p.kind === 'keys');
    expect(part).toEqual({ kind: 'keys', reason: 'Holds 2 keys of the Absent', amount: 2 * K.fear });
    expect(keyKnown(world, g, powerOf(g, 'frontier'), keyed[0] ?? '')).toBe(true);
    expect(keyKnown(world, g, powerOf(g, 'frontier'), keyed[2] ?? '')).toBe(false);
    powerOf(g, 'frontier').researched.push('relic-studies', 'old-charts', 'the-second-tone');
    expect(keyKnown(world, g, powerOf(g, 'frontier'), keyed[2] ?? '')).toBe(true);
  });
});

/** A power that knows a site and may excavate it, with an outpost there. */
function ready(g: GameState, f: FactionId, system: string) {
  const p = powerOf(g, f);
  markSurveyed(p, system);
  if (!p.researched.includes('relic-studies')) p.researched.push('relic-studies');
  outpostAt(g, f, system);
}

describe('the Answer (§21.3)', () => {
  const allFive = () => {
    const g = five();
    for (const s of keyed) findKey(g, 'sta', s);
    return g;
  };

  it('needs The instrument and all five keys, no other Answer, and our capital', () => {
    const g = five();
    expect(beginAnswerRefusal(g, 'sta')).toBe('The Answer needs The instrument.');
    powerOf(g, 'sta').researched.push('the-instrument');
    expect(beginAnswerRefusal(g, 'sta')).toBe('The Answer needs all 5 keys of the Absent; we hold 0.');
    const h = allFive();
    powerOf(h, 'sta').researched.push('the-instrument');
    expect(beginAnswerRefusal(h, 'sta')).toBeNull();
    expect(applyInPlace(world, h, 'sta', { type: 'begin-answer' })).toBeNull();
    expect(h.answer).toEqual({ by: 'sta', left: K.answerTurns });
    expect(beginAnswerRefusal(h, 'sta')).toBe('We are answering already.');
  });

  it('ten turns while it keeps the keys and its capital, everyone hearing; then victory by the keys', () => {
    const g = allFive();
    powerOf(g, 'sta').researched.push('the-instrument');
    applyInPlace(world, g, 'sta', { type: 'begin-answer' });
    let ev = events(g);
    resolveAnswer(g, ev);
    expect(ev.get('frontier')).toContainEqual({ kind: 'answer', by: 'sta', stage: 'begun', left: K.answerTurns - 1 });
    for (let i = 1; i < K.answerTurns; i++) {
      expect(victoryNow(g)).toBeNull();
      ev = events(g);
      resolveAnswer(g, ev);
    }
    expect(g.answer).toEqual({ by: 'sta', left: 0 });
    expect(victoryNow(g)).toEqual({ winner: 'sta', how: 'keys' });
    resolveVictory(g, events(g));
    expect(g.ended).toMatchObject({ winner: 'sta', how: 'keys' });
  });

  it('stops when a key is lost', () => {
    const g = allFive();
    powerOf(g, 'sta').researched.push('the-instrument');
    applyInPlace(world, g, 'sta', { type: 'begin-answer' });
    resolveAnswer(g, events(g));
    const k = g.keys[0];
    if (!k) throw new Error('keys');
    const h = g.holdings.find((x) => x.id === k.holding);
    if (h) h.owner = 'hollow-wake';
    resolveKeys(g, events(g));
    const ev = events(g);
    resolveAnswer(g, ev);
    expect(g.answer).toBeNull();
    expect(ev.get('sta')).toContainEqual({ kind: 'answer', by: 'sta', stage: 'stopped', left: K.answerTurns - 1 });
  });

  it('every rival that does not call for peace goes to war on it; the peaceful think 30 less of it', () => {
    const g = allFive();
    powerOf(g, 'sta').researched.push('the-instrument');
    applyInPlace(world, g, 'sta', { type: 'begin-answer' });
    expect(warTarget(world, g, 'hollow-wake')).toEqual({ on: 'sta', reason: 'answer' });
    expect(warTarget(world, g, 'dusk-concord')).toEqual({ on: 'sta', reason: 'answer' });
    expect(warTarget(world, g, 'frontier')).toBeNull();
    expect(attitudeOf(world, g, 'frontier', 'sta').parts).toContainEqual({
      kind: 'answering',
      reason: 'Would answer for us all',
      amount: K.answering,
    });
    // A pact stands in the way: it is broken first.
    g.treaties.push({
      kind: 'non-aggression',
      a: 'dusk-concord',
      b: 'sta',
      since: 1,
      ends: null,
      endedBy: null,
      broken: false,
    });
    expect(aiOrders(world, g, 'dusk-concord')).toContainEqual({
      type: 'break-treaty',
      with: 'sta',
      treaty: 'non-aggression',
    });
  });
});

describe('the rivals (§21.4)', () => {
  it('begin the Answer as soon as they may, and an outlaw goes to war for a key', () => {
    const g = five('frontier');
    for (const s of keyed) findKey(g, 'sta', s);
    powerOf(g, 'sta').researched.push('the-instrument');
    expect(aiOrders(world, g, 'sta')).toContainEqual({ type: 'begin-answer' });

    const h = five('frontier');
    findKey(h, 'frontier', keyed[0] ?? '');
    h.turn = 80;
    const wake = powerOf(h, 'hollow-wake');
    expect(FACTIONS['hollow-wake'].war.declares).toContain('keys');
    // Not without warships that outmatch it.
    expect(warTarget(world, h, 'hollow-wake')?.reason).not.toBe('keys');
    expect(wake.faction).toBe('hollow-wake');
  });
});

describe('state (§21.8)', () => {
  it('a save from version 26 reads with no keys and no Answer', () => {
    const g = five();
    const { keys: _k, answer: _a, ...rest } = g;
    const raw = {
      format: SAVE_FORMAT,
      version: 1,
      savedAt: '2026-10-22T00:00:00Z',
      game: { ...rest, version: 26 },
    };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.keys).toEqual([]);
    expect(loaded.answer).toBeNull();
    expect(shapeProblems(loaded)).toEqual([]);
  });
});
