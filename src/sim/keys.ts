// The keys of the Absent and the Answer (M5_UNKNOWN.md §21, D-71): which sites hold a key (from the
// seed, never saved), a key found with its site's third chapter, taken with its holding and lost with
// it, and the Answer begun, kept up or stopped. Pure, in whole numbers.

import { type FactionId, PLACING_FACTIONS } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import type { SystemId } from '../data/types.ts';
import { digAt, placedSites } from './relics.ts';
import type { ReportEvent } from './report.ts';
import { effects } from './research.ts';
import { rng } from './rng.ts';
import { contactWith, type GameState, type Key, type PowerState, powerOf } from './state.ts';
import type { World } from './world.ts';

const K = RULES.keys;
const CHAPTERS = RULES.relics.chapterCost.length;
const cache = new WeakMap<World, Map<number, readonly SystemId[]>>();

/**
 * The sites that hold a key (§21.1, as built), in system order: for each power's capital, in play or
 * not, the site nearest it that no nearer capital has taken; the seed breaks a tie. So every
 * neighbourhood has one key near it, and the rest are another's.
 */
export function keySites(world: World, seed: number): readonly SystemId[] {
  let bySeed = cache.get(world);
  if (!bySeed) {
    bySeed = new Map();
    cache.set(world, bySeed);
  }
  const known = bySeed.get(seed);
  if (known) return known;
  const order = (id: SystemId) => rng(seed, 'key-site', id).int(0, 1_000_000_000);
  // Among the placed sites only: the kept ones hold no key (M5_UNKNOWN.md §28.2).
  const sites = placedSites(world, seed).map((s) => s.system);
  const capitals = PLACING_FACTIONS.map((f) => f.capital.systemId).filter((c) => world.hasSystem(c));
  const chosen: SystemId[] = [];
  for (const c of capitals) {
    if (chosen.length >= K.count) break;
    const next = sites
      .filter((s) => !chosen.includes(s))
      .sort((a, b) => world.distanceDeci(c, a) - world.distanceDeci(c, b) || order(a) - order(b))[0];
    if (next) chosen.push(next);
  }
  const out = chosen.sort();
  bySeed.set(seed, out);
  return out;
}

/** Whether a site holds a key. */
export function isKeySite(world: World, seed: number, system: SystemId): boolean {
  return keySites(world, seed).includes(system);
}

/** The key found at a site, if it has been. */
export function keyAt(state: GameState, system: SystemId): Key | undefined {
  return state.keys.find((k) => k.system === system);
}

/** Who holds a key now: its holding's owner, or none while it is lost. */
export function holderOf(state: GameState, key: Key): FactionId | null {
  if (key.holding === null) return null;
  return state.holdings.find((h) => h.id === key.holding)?.owner ?? null;
}

/** The keys a power holds. */
export function keysHeld(state: GameState, faction: FactionId): Key[] {
  return state.keys.filter((k) => holderOf(state, k) === faction);
}

/** Whether a power knows where every key lies (The second tone, §21.5). */
export function keySight(state: GameState, faction: FactionId): boolean {
  return effects(state, faction, 'key-sight').length > 0;
}

/** Whether a power knows a site holds a key: by The second tone, or its key found. */
export function keyKnown(world: World, state: GameState, power: PowerState, system: SystemId): boolean {
  if (!isKeySite(world, state.seed, system)) return false;
  return keySight(state, power.faction) || keyAt(state, system) !== undefined;
}

/** Tells a power, and every power that knows any of `about`, of something (§21.2). */
function tell(
  state: GameState,
  events: Map<FactionId, ReportEvent[]>,
  about: readonly (FactionId | null)[],
  e: ReportEvent,
): void {
  for (const p of state.powers)
    if (about.some((f) => f !== null && (f === p.faction || contactWith(p, f)))) events.get(p.faction)?.push(e);
}

/**
 * Step 4 of the turn, after the excavations (§21.2): a key site whose third chapter is done gives its
 * key to the excavating power's oldest holding there, found for the first time or found again.
 */
export function resolveKeysFound(world: World, state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  for (const d of state.digs) {
    if (d.chapters < CHAPTERS || !d.by || !isKeySite(world, state.seed, d.system)) continue;
    const k = keyAt(state, d.system);
    if (k && k.holding !== null) continue;
    const by = d.by;
    const h = state.holdings.filter((x) => x.owner === by && x.system === d.system).sort((a, b) => a.id - b.id)[0];
    if (!h) continue;
    if (k) {
      k.holding = h.id;
      k.by = by;
    } else {
      state.keys.push({ system: d.system, holding: h.id, by });
      state.keys.sort((a, b) => (a.system < b.system ? -1 : 1));
    }
    tell(state, events, [by], { kind: 'key', system: d.system, stage: 'found', by });
  }
}

/**
 * As the turn ends (§21.2): a key whose holding changed hands goes to its new holder; one whose
 * holding is gone is lost, and its site needs its third chapter again.
 */
export function resolveKeys(state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  for (const k of state.keys) {
    if (k.holding === null) continue;
    const h = state.holdings.find((x) => x.id === k.holding);
    const from = k.by;
    if (!h) {
      k.holding = null;
      k.by = null;
      const d = digAt(state, k.system);
      if (d) {
        d.chapters = CHAPTERS - 1;
        d.progress = 0;
        d.waiting = null;
        d.answer = null;
        d.by = null;
      }
      tell(state, events, [from], {
        kind: 'key',
        system: k.system,
        stage: 'lost',
        by: null,
        ...(from ? { from } : {}),
      });
      continue;
    }
    if (h.owner === from) continue;
    k.by = h.owner;
    tell(state, events, [from, h.owner], {
      kind: 'key',
      system: k.system,
      stage: 'taken',
      by: h.owner,
      ...(from ? { from } : {}),
    });
  }
}

/** Why a power may not begin the Answer, or null if it may (§21.3). */
export function beginAnswerRefusal(state: GameState, faction: FactionId): string | null {
  if (effects(state, faction, 'answer').length === 0) return 'The Answer needs The instrument.';
  if (state.answer?.by === faction) return 'We are answering already.';
  if (state.answer) return 'Another power is answering.';
  const held = keysHeld(state, faction).length;
  if (held < K.count) return `The Answer needs all ${K.count} keys of the Absent; we hold ${held}.`;
  const power = powerOf(state, faction);
  if (power.subduedBy) return 'We are subdued: we may not answer.';
  if (!state.holdings.some((h) => h.owner === faction && h.capital)) return 'The Answer needs our capital.';
  return null;
}

/** Begins the Answer; the caller has checked `answerRefusal`. */
export function beginAnswer(state: GameState, faction: FactionId): void {
  state.answer = { by: faction, left: K.answerTurns };
}

/**
 * As the turn ends (§21.3): the Answer goes on a turn while its power holds all five keys and its
 * capital and is not subdued, every power hearing; else it stops. Done, `victoryNow` sees it.
 */
export function resolveAnswer(state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  const a = state.answer;
  if (!a || a.left <= 0) return;
  const power = powerOf(state, a.by);
  const keeps =
    power.left === null &&
    !power.subduedBy &&
    keysHeld(state, a.by).length >= K.count &&
    state.holdings.some((h) => h.owner === a.by && h.capital);
  if (!keeps) {
    state.answer = null;
    tell(state, events, [a.by], { kind: 'answer', by: a.by, stage: 'stopped', left: a.left });
    return;
  }
  const begun = a.left === K.answerTurns;
  a.left--;
  tell(state, events, [a.by], { kind: 'answer', by: a.by, stage: begun ? 'begun' : 'turns', left: a.left });
}
