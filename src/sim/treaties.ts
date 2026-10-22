// Treaties (M3_NEIGHBOURS.md §21, D-53): offered by one power to another, answered, held, ended with
// notice or broken, through the same orders for the player and the rivals. A rival answers by its
// attitude and its character; the player answers in the next turn.

import { FACTIONS, type FactionId } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import { TREATIES, type TreatyKind } from '../content/treaties.ts';
import { hear } from './contact.ts';
import { attitudeOf, remember } from './memory.ts';
import type { ReportEvent } from './report.ts';
import { rng } from './rng.ts';
import { contactWith, type GameState, type Offer, powerOf, type Treaty, treatyOf } from './state.ts';
import type { World } from './world.ts';

/** The two powers of a treaty in id order. */
export function pair(x: FactionId, y: FactionId): [FactionId, FactionId] {
  return x < y ? [x, y] : [y, x];
}

/** The other power of a treaty. */
export function partnerOf(t: Treaty, f: FactionId): FactionId {
  return t.a === f ? t.b : t.a;
}

/** The treaty of a kind between two powers, if they have one. */
export const treatyBetween = treatyOf;

/** Every treaty a power holds. */
export function treatiesOf(state: GameState, f: FactionId): Treaty[] {
  return state.treaties.filter((t) => t.a === f || t.b === f);
}

/** The powers whose open lanes a power's ships may use (§21.1). */
export function passageWith(state: GameState, f: FactionId): FactionId[] {
  return treatiesOf(state, f)
    .filter((t) => t.kind === 'open-lanes')
    .map((t) => partnerOf(t, f));
}

/** Whether a power would accept a treaty from another now: its attitude reaches what its character asks (§21.4). */
export function wouldAccept(world: World, state: GameState, receiver: FactionId, from: FactionId, kind: TreatyKind) {
  const asks = FACTIONS[receiver].asks[kind];
  return asks !== null && attitudeOf(world, state, receiver, from).total >= asks;
}

/** Why an offer cannot be made (§21.2), or null if it can. */
export function offerRefusal(state: GameState, from: FactionId, to: FactionId, kind: TreatyKind): string | null {
  if (!state.powers.some((p) => p.faction === to) || to === from) return 'There is no such power.';
  if (!(kind in TREATIES)) return 'There is no such treaty.';
  const name = FACTIONS[to].shortName;
  const treaty = TREATIES[kind].name.toLowerCase();
  if (!contactWith(powerOf(state, from), to)) return `We have not heard the ${name}.`;
  if (treatyBetween(state, from, to, kind)) return `We have ${treaty} with the ${name} already.`;
  if (
    state.offers.some((o) => o.kind === kind && ((o.from === from && o.to === to) || (o.from === to && o.to === from)))
  )
    return `An offer of ${treaty} between us and the ${name} is waiting already.`;
  return null;
}

/** Why an offer cannot be answered (§21.2), or null if it can. */
export function answerRefusal(state: GameState, me: FactionId, from: FactionId, kind: TreatyKind): string | null {
  const offer = state.offers.find((o) => o.to === me && o.from === from && o.kind === kind);
  if (!offer || offer.turn >= state.turn) return 'No such offer is waiting for an answer.';
  return null;
}

/** Why a treaty cannot be ended or broken (§21.3), or null if it can. */
export function endRefusal(state: GameState, me: FactionId, other: FactionId, kind: TreatyKind, broken: boolean) {
  const t = treatyBetween(state, me, other, kind);
  const treaty = TREATIES[kind]?.name.toLowerCase() ?? 'that treaty';
  if (!t) return `We have no ${treaty} treaty with the ${FACTIONS[other]?.shortName ?? 'others'}.`;
  if (t.broken) return 'It is broken already.';
  if (t.ends !== null && !broken) return `Notice is given already: it ends in ${t.ends - state.turn} turns.`;
  return null;
}

/** Makes a treaty from now. */
function begin(state: GameState, x: FactionId, y: FactionId, kind: TreatyKind, since: number): void {
  const [a, b] = pair(x, y);
  state.treaties.push({ kind, a, b, since, ends: null, endedBy: null, broken: false });
  const key = (t: Treaty) => `${t.a}~${t.b}~${t.kind}`;
  state.treaties.sort((p, q) => (key(p) < key(q) ? -1 : 1));
}

/** An offer on its way (order `offer`, checked). */
export function makeOffer(state: GameState, from: FactionId, to: FactionId, kind: TreatyKind): void {
  state.offers.push({ kind, from, to, turn: state.turn });
}

/** The player's answer to an offer waiting (order `answer-offer`, checked): yes, and the treaty holds from now. */
export function answerOffer(state: GameState, me: FactionId, from: FactionId, kind: TreatyKind, accept: boolean) {
  state.offers = state.offers.filter((o) => !(o.to === me && o.from === from && o.kind === kind));
  if (accept) begin(state, me, from, kind, state.turn);
}

/**
 * Notice given or a treaty broken (orders `end-treaty` and `break-treaty`, checked): remembered at
 * once, by the other and, for a breach, by every other power in contact with the breaker.
 */
export function endTreaty(state: GameState, me: FactionId, other: FactionId, kind: TreatyKind, broken: boolean) {
  const t = treatyBetween(state, me, other, kind);
  if (!t) return;
  const m = RULES.memory;
  t.endedBy = me;
  t.broken = broken;
  t.ends = broken ? state.turn : state.turn + RULES.treaties.notice;
  remember(state, other, me, {
    kind: broken ? 'treaty-broken' : 'treaty-ended',
    amount: broken ? m.treatyBroken : m.treatyEnded,
    treaty: kind,
  });
  if (!broken) return;
  for (const p of state.powers)
    if (p.faction !== me && p.faction !== other && contactWith(p, me))
      remember(state, p.faction, me, {
        kind: 'treaty-broken-heard',
        amount: m.treatyBrokenHeard,
        treaty: kind,
        victim: other,
      });
}

/** Whether an offer from a power still learning the other's tongue is misread (§21.2): 1 in 20 for each word to learn. */
export function misread(state: GameState, o: Offer): boolean {
  const c = contactWith(powerOf(state, o.from), o.to);
  const missing = c ? RULES.contact.wordsToTalk - c.words : RULES.contact.wordsToTalk;
  if (missing <= 0) return false;
  return rng(state.seed, 'misread', state.turn, o.from, o.to, o.kind).chance(missing, RULES.contact.wordsToTalk);
}

/**
 * The turn's treaties (§21.2, §21.3), as it ends: treaties whose end has come end; the turn's
 * offers arrive, and a rival answers at once while the player answers in the next turn; offers the
 * player left unanswered are refused. Each step is in both powers' reports.
 */
export function resolveTreaties(world: World, state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  const say = (f: FactionId, e: ReportEvent) => events.get(f)?.push(e);
  // Treaties the player agreed this turn, answering an offer.
  for (const t of state.treaties)
    if (t.since === state.turn)
      for (const f of [t.a, t.b]) say(f, { kind: 'treaty-begun', faction: partnerOf(t, f), treaty: t.kind });

  // Ends that have come, and notice given this turn.
  for (const t of state.treaties) {
    if (t.ends === null || t.endedBy === null) continue;
    const by = t.endedBy;
    const other = partnerOf(t, by);
    if (t.ends <= state.turn) {
      for (const f of [t.a, t.b])
        say(f, { kind: 'treaty-ended', faction: partnerOf(t, f), treaty: t.kind, by, broken: t.broken });
      if (t.broken)
        for (const p of state.powers)
          if (p.faction !== by && p.faction !== other && contactWith(p, by))
            say(p.faction, { kind: 'treaty-broken-heard', faction: by, victim: other, treaty: t.kind });
    } else if (t.ends === state.turn + RULES.treaties.notice)
      for (const f of [t.a, t.b])
        say(f, { kind: 'treaty-notice', faction: partnerOf(t, f), treaty: t.kind, by, ends: t.ends });
  }
  state.treaties = state.treaties.filter((t) => t.ends === null || t.ends > state.turn);

  // Offers: the player's unanswered from the turn before are refused; this turn's arrive.
  const keep: Offer[] = [];
  for (const o of state.offers) {
    const receiver = powerOf(state, o.to);
    if (o.turn < state.turn) {
      say(o.from, { kind: 'offer-answered', faction: o.to, treaty: o.kind, accepted: false });
      continue;
    }
    if (treatyBetween(state, o.from, o.to, o.kind)) continue;
    if (misread(state, o)) {
      remember(state, o.to, o.from, { kind: 'offer-misread', amount: RULES.memory.offerMisread, treaty: o.kind });
      say(o.from, { kind: 'offer-misread', faction: o.to, treaty: o.kind, ours: true });
      say(o.to, { kind: 'offer-misread', faction: o.from, treaty: o.kind, ours: false });
      continue;
    }
    // An offer from a power not heard yet is a signal of its own.
    hear(state, o.to, o.from, null, events);
    if (receiver.controller === 'player') {
      keep.push(o);
      say(o.to, { kind: 'offer-received', faction: o.from, treaty: o.kind });
      continue;
    }
    const yes = wouldAccept(world, state, o.to, o.from, o.kind);
    say(o.from, { kind: 'offer-answered', faction: o.to, treaty: o.kind, accepted: yes });
    if (!yes) continue;
    begin(state, o.from, o.to, o.kind, state.turn);
    for (const [f, other] of [
      [o.from, o.to],
      [o.to, o.from],
    ] as const)
      say(f, { kind: 'treaty-begun', faction: other, treaty: o.kind });
  }
  state.offers = keep;
}
