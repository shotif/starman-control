// Treaties (M3_NEIGHBOURS.md §21, §23, D-53, D-56): offered by one power to another, answered, held,
// ended with notice or broken, through the same orders for the player and the rivals. A rival
// answers by its attitude and its character; the player answers in the next turn. Passage and
// protection are sold by a power whose character sells them, and paid for every turn; resources
// are exchanged once, by the same offers.

import { FACTIONS, type FactionId } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import { SOLD, TREATIES, type TreatyKind } from '../content/treaties.ts';
import { callBetween, heeds, notePeaceOffered, sanctionRefusal } from './assembly.ts';
import { hear } from './contact.ts';
import { attitudeOf, attitudeWord, remember } from './memory.ts';
import type { ReportEvent } from './report.ts';
import { rng } from './rng.ts';
import {
  type Amount,
  contactWith,
  type GameState,
  type Offer,
  type OfferKind,
  powerOf,
  type Treaty,
  treatyOf,
} from './state.ts';
import { pressesOn } from './warAi.ts';
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

/**
 * The powers whose open lanes a power's ships may use (§21.1): its open lanes partners and allies,
 * those it buys passage from (§23.2), those it is at war with (forced passage, M4_FLEETS.md §23.4),
 * and its victor and those it has subdued (§31.2: a subdued power's lanes are open to its victor).
 */
export function passageWith(state: GameState, f: FactionId): FactionId[] {
  const out = treatiesOf(state, f)
    .filter((t) => t.kind === 'open-lanes' || t.kind === 'alliance' || (t.kind === 'passage' && t.payer === f))
    .map((t) => partnerOf(t, f));
  for (const w of state.wars) if (w.a === f || w.b === f) out.push(w.a === f ? w.b : w.a);
  for (const p of state.powers) {
    if (p.subduedBy === f) out.push(p.faction);
    if (p.faction === f && p.subduedBy) out.push(p.subduedBy);
  }
  return out;
}

/** Whether two powers are at war (M4_FLEETS.md §23.1); src/sim/war.ts has the rest of war's rules. */
function warring(state: GameState, x: FactionId, y: FactionId): boolean {
  const [a, b] = pair(x, y);
  return state.wars.some((w) => w.a === a && w.b === b);
}

/** Whether a treaty is sold (§23): passage and protection. */
export function isSold(kind: TreatyKind): boolean {
  return SOLD.includes(kind);
}

/** The power that sells a sold treaty between two, if one of them does. */
export function sellerOf(kind: TreatyKind, x: FactionId, y: FactionId): FactionId | null {
  const sells = (f: FactionId) => FACTIONS[f].sells.includes(kind);
  if (sells(x) && !sells(y)) return x;
  if (sells(y) && !sells(x)) return y;
  return null;
}

/** Passage's toll a turn (§23.2): 1 for each of the seller's open lanes, from 2 to 8. */
export function tollOf(state: GameState, seller: FactionId): number {
  const t = RULES.treaties;
  const lanes = state.lanes.filter((l) => l.owner === seller && l.status === 'open').length;
  return Math.min(t.tollMost, Math.max(t.tollLeast, lanes * t.tollPerLane));
}

/** What a sold treaty costs its buyer a turn. */
export function priceOf(state: GameState, t: Pick<Treaty, 'kind' | 'a' | 'b' | 'payer'>): number {
  if (!t.payer) return 0;
  return t.kind === 'passage' ? tollOf(state, t.payer === t.a ? t.b : t.a) : RULES.treaties.protection;
}

/**
 * Whether a power would accept a treaty from another now (§21.4, §23.6): its attitude reaches what
 * its character asks; a buyer must have a few turns' price in hand.
 */
export function wouldAccept(world: World, state: GameState, receiver: FactionId, from: FactionId, kind: TreatyKind) {
  const asks = FACTIONS[receiver].asks[kind];
  if (asks === null) return false;
  const attitude = attitudeOf(world, state, receiver, from);
  let total = attitude.total;
  // Raided, a power buys protection all the same (M4_FLEETS.md §27.2): the seller's raids do not
  // count against it.
  if (kind === 'protection' && sellerOf(kind, receiver, from) === from)
    for (const p of attitude.parts) if (p.kind === 'raided' || p.kind === 'raided-heard') total -= p.amount;
  if (total < asks) return false;
  if (!isSold(kind)) return true;
  const buyer = sellerOf(kind, receiver, from) === receiver ? from : receiver;
  return powerOf(state, buyer).treasury >= RULES.treaties.afford;
}

/** Why an offer cannot be made (§21.2, §23), or null if it can. */
export function offerRefusal(
  state: GameState,
  from: FactionId,
  to: FactionId,
  kind: OfferKind,
  give?: Amount,
  get?: Amount,
): string | null {
  if (!state.powers.some((p) => p.faction === to) || to === from) return 'There is no such power.';
  const name = FACTIONS[to]?.shortName ?? 'others';
  // At war, only peace or surrender may be offered; each only at war (M4_FLEETS.md §23.2, §28.5).
  if (kind === 'peace' || kind === 'capitulation') {
    if (!warring(state, from, to)) return `We are not at war with the ${name}.`;
    if (state.offers.some((o) => o.kind === kind && o.from === from && o.to === to))
      return kind === 'peace'
        ? `Our offer of peace to the ${name} is on its way already.`
        : `Our surrender to the ${name} is on its way already.`;
    // Peace on terms: credits given or asked with it (§28.4).
    for (const a of [give, get])
      if (a !== undefined && (a.resource !== 'credits' || !Number.isInteger(a.amount) || a.amount < 1))
        return 'Peace is made for credits or for nothing.';
    if (give && holdingOf(state, from, 'credits') < give.amount) return `We do not have ${amountWords(give)}.`;
    return null;
  }
  if (warring(state, from, to)) return `We are at war with the ${name}: offer peace first.`;
  // Sanctions (M4_FLEETS.md §29.3): no member trades with a sanctioned power.
  if (kind === 'trade' || kind === 'exchange') {
    const sanctions = sanctionRefusal(state, from, to);
    if (sanctions) return sanctions;
  }
  if (kind === 'exchange') return exchangeRefusal(state, from, to, give, get);
  if (!(kind in TREATIES)) return 'There is no such treaty.';
  const treaty = TREATIES[kind].words;
  if (!contactWith(powerOf(state, from), to)) return `We have not heard the ${name}.`;
  if (isSold(kind) && !sellerOf(kind, from, to)) return `Neither of us sells ${treaty}.`;
  if (treatyBetween(state, from, to, kind)) return `We have ${treaty} with the ${name} already.`;
  if (
    state.offers.some((o) => o.kind === kind && ((o.from === from && o.to === to) || (o.from === to && o.to === from)))
  )
    return `An offer of ${treaty} between us and the ${name} is waiting already.`;
  return null;
}

/** What can be exchanged (§23.1). */
export const RESOURCES: readonly Amount['resource'][] = ['credits', 'metals', 'volatiles', 'fuel'];

/** An amount in words: "40 credits", "20 fusion fuel". */
export function amountWords(a: Amount): string {
  return `${a.amount} ${a.resource === 'fuel' ? 'fusion fuel' : a.resource}`;
}

/** What an offer is of, in a sentence ("the Wake offers us …"). */
export function offerWords(kind: OfferKind): string {
  return kind === 'exchange'
    ? 'an exchange'
    : kind === 'peace'
      ? 'peace'
      : kind === 'capitulation'
        ? 'surrender'
        : TREATIES[kind].words;
}

/** What a power has of a resource or of credits. */
export function holdingOf(state: GameState, f: FactionId, resource: Amount['resource']): number {
  const p = powerOf(state, f);
  return resource === 'credits' ? p.treasury : p.stockpile[resource];
}

/** Why an exchange cannot be offered (§23.1): at talk, two different things in steps of 10 up to 100, which the offerer has. */
function exchangeRefusal(state: GameState, from: FactionId, to: FactionId, give?: Amount, get?: Amount): string | null {
  const x = RULES.exchanges;
  const name = FACTIONS[to].shortName;
  if (contactWith(powerOf(state, from), to)?.stage !== 'talk') return `We cannot talk with the ${name} yet.`;
  const ok = (a?: Amount) =>
    a !== undefined && RESOURCES.includes(a.resource) && a.amount > 0 && a.amount <= x.most && a.amount % x.step === 0;
  if (!give || !get || !ok(give) || !ok(get))
    return `An exchange is ${x.step} to ${x.most} of one thing for ${x.step} to ${x.most} of another, in steps of ${x.step}.`;
  if (give.resource === get.resource) return 'An exchange is of two different things.';
  if (holdingOf(state, from, give.resource) < give.amount) return `We do not have ${amountWords(give)}.`;
  if (state.offers.some((o) => o.kind === 'exchange' && o.from === from && o.to === to))
    return `An exchange with the ${name} is waiting already.`;
  return null;
}

/** What a power thinks an amount worth (§23.1): 1 a credit, 2 a unit, twice that for what it is short of. */
export function worth(state: GameState, f: FactionId, a: Amount): number {
  const x = RULES.exchanges;
  const each = a.resource === 'credits' ? x.credit : x.unit;
  return a.amount * each * (holdingOf(state, f, a.resource) < x.short ? 2 : 1);
}

/** Whether a power would accept an exchange offered to it (§23.1): what it gets against what it gives, by its regard. */
export function wouldExchange(world: World, state: GameState, receiver: FactionId, o: Offer): boolean {
  if (!o.give || !o.get) return false;
  const ask = RULES.exchanges.asks[attitudeWord(attitudeOf(world, state, receiver, o.from).total)];
  if (ask === undefined) return false;
  return worth(state, receiver, o.give) * 100 >= worth(state, receiver, o.get) * ask;
}

/** Whether both sides of an exchange still have what they would give. */
function bothHave(state: GameState, o: Offer): boolean {
  const { give, get } = o as Required<Offer>;
  return holdingOf(state, o.from, give.resource) >= give.amount && holdingOf(state, o.to, get.resource) >= get.amount;
}

/** An exchange accepted: both amounts change hands at once. */
function exchange(state: GameState, o: Offer): void {
  const { give, get } = o as Required<Offer>;
  const move = (from: FactionId, to: FactionId, a: Amount) => {
    const p = powerOf(state, from);
    const q = powerOf(state, to);
    if (a.resource === 'credits') {
      p.treasury -= a.amount;
      q.treasury += a.amount;
    } else {
      p.stockpile[a.resource] -= a.amount;
      q.stockpile[a.resource] += a.amount;
    }
  };
  move(o.from, o.to, give);
  move(o.to, o.from, get);
}

/** Why an offer cannot be answered (§21.2), or null if it can. */
export function answerRefusal(state: GameState, me: FactionId, from: FactionId, kind: OfferKind): string | null {
  const offer = state.offers.find((o) => o.to === me && o.from === from && o.kind === kind);
  if (!offer || offer.turn >= state.turn) return 'No such offer is waiting for an answer.';
  return null;
}

/** Why an exchange offered cannot be accepted now (§23.1): one side no longer has what it would give. */
export function exchangeShort(state: GameState, me: FactionId, from: FactionId): string | null {
  const o = state.offers.find((x) => x.to === me && x.from === from && x.kind === 'exchange');
  if (!o?.give || !o.get) return null;
  if (holdingOf(state, me, o.get.resource) < o.get.amount) return `We do not have ${amountWords(o.get)}.`;
  if (holdingOf(state, from, o.give.resource) < o.give.amount)
    return `The ${FACTIONS[from].shortName} no longer has ${amountWords(o.give)}.`;
  return null;
}

/** Why a treaty cannot be ended or broken (§21.3), or null if it can. */
export function endRefusal(state: GameState, me: FactionId, other: FactionId, kind: TreatyKind, broken: boolean) {
  const t = treatyBetween(state, me, other, kind);
  const treaty = TREATIES[kind]?.noun ?? 'such treaty';
  if (!t) return `We have no ${treaty} with the ${FACTIONS[other]?.shortName ?? 'others'}.`;
  if (t.broken) return 'It is broken already.';
  if (t.ends !== null && !broken) return `Notice is given already: it ends in ${t.ends - state.turn} turns.`;
  return null;
}

/** Makes a treaty from now; a sold one with its buyer, who pays. */
function begin(state: GameState, x: FactionId, y: FactionId, kind: TreatyKind, since: number): void {
  const [a, b] = pair(x, y);
  const seller = isSold(kind) ? sellerOf(kind, x, y) : null;
  state.treaties.push({
    kind,
    a,
    b,
    since,
    ends: null,
    endedBy: null,
    broken: false,
    ...(seller ? { payer: seller === a ? b : a } : {}),
  });
  const key = (t: Treaty) => `${t.a}~${t.b}~${t.kind}`;
  state.treaties.sort((p, q) => (key(p) < key(q) ? -1 : 1));
}

/** An offer on its way (order `offer`, checked). */
export function makeOffer(
  state: GameState,
  from: FactionId,
  to: FactionId,
  kind: OfferKind,
  give?: Amount,
  get?: Amount,
): void {
  state.offers.push({ kind, from, to, turn: state.turn, ...(give ? { give } : {}), ...(get ? { get } : {}) });
  if (kind === 'peace') notePeaceOffered(state, from, to, give !== undefined || get !== undefined);
}

/**
 * The player's answer to an offer waiting (order `answer-offer`, checked): yes, and the treaty holds
 * from now, or the exchange is made at once.
 */
export function answerOffer(state: GameState, me: FactionId, from: FactionId, kind: OfferKind, accept: boolean) {
  const offer = state.offers.find((o) => o.to === me && o.from === from && o.kind === kind);
  state.offers = state.offers.filter((o) => o !== offer);
  if (!accept || !offer) return;
  if (kind === 'exchange') exchange(state, offer);
  else if (kind === 'peace') {
    payTerms(state, offer);
    endWar(state, me, from);
  } else if (kind === 'capitulation') capitulate(state, from, me);
  else begin(state, me, from, kind, state.turn);
}

/** Peace's terms (§28.4): credits the offerer gives, or asks of the one who accepts. */
function payTerms(state: GameState, o: Offer): void {
  const from = powerOf(state, o.from);
  const to = powerOf(state, o.to);
  if (o.give) {
    from.treasury -= o.give.amount;
    to.treasury += o.give.amount;
  }
  if (o.get) {
    to.treasury -= o.get.amount;
    from.treasury += o.get.amount;
  }
}

/**
 * Capitulation (M4_FLEETS.md §28.5): the war ends with a truce, and the loser is subdued by its
 * victor; any power the loser had subdued goes free.
 */
export function capitulate(state: GameState, loser: FactionId, victor: FactionId): void {
  endWar(state, loser, victor);
  powerOf(state, loser).subduedBy = victor;
  for (const p of state.powers) if (p.subduedBy === loser) p.subduedBy = null;
}

/** The tribute a subdued power owes its victor a turn (§28.5): a fifth of its taxes. */
export function tributeOf(state: GameState, f: FactionId): number {
  const power = powerOf(state, f);
  if (!power.subduedBy) return 0;
  let taxes = 0;
  for (const h of state.holdings)
    if (h.owner === f && h.kind === 'colony') taxes += Math.floor(h.people / RULES.credits.taxPer[power.taxes]);
  return Math.floor(taxes / 5);
}

/** Tribute paid as the turn ends, from the treasury's credits; both told. */
export function payTribute(state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  for (const p of state.powers) {
    const victor = p.subduedBy;
    const t = tributeOf(state, p.faction);
    if (!victor || t <= 0) continue;
    p.treasury -= t;
    powerOf(state, victor).treasury += t;
    events.get(p.faction)?.push({ kind: 'tribute', faction: victor, credits: t, paid: true });
    events.get(victor)?.push({ kind: 'tribute', faction: p.faction, credits: t, paid: false });
  }
}

/** Peace made (M4_FLEETS.md §23.2): the war ends, and a truce follows in which neither may declare war. */
export function endWar(state: GameState, x: FactionId, y: FactionId): void {
  const [a, b] = pair(x, y);
  state.wars = state.wars.filter((w) => !(w.a === a && w.b === b));
  state.truces = state.truces.filter((t) => !(t.a === a && t.b === b));
  state.truces.push({ a, b, until: state.turn + RULES.war.truce });
  state.truces.sort((p, q) => (`${p.a}~${p.b}` < `${q.a}~${q.b}` ? -1 : 1));
}

/** Whether a rival would make peace with a power it is at war with (§23.2): once the war has lasted a while. */
export function wouldMakePeace(state: GameState, receiver: FactionId, from: FactionId, o?: Offer): boolean {
  const [a, b] = pair(receiver, from);
  const war = state.wars.find((w) => w.a === a && w.b === b);
  if (war === undefined) return false;
  // Terms it cannot pay are refused.
  if (o?.get && powerOf(state, receiver).treasury < o.get.amount) return false;
  // A conqueror that is winning sees the war through, calls for peace or not (M4_FLEETS.md §31.2).
  if (pressesOn(state, receiver, from)) return false;
  // Called to peace by the Assembly (§29.3), a rival that heeds it accepts peace that asks nothing of it.
  if (o && !o.get && callBetween(state, receiver, from) && heeds(receiver)) return true;
  // By its character (M4_FLEETS.md §28.4), or at once when the war goes badly.
  const after = FACTIONS[receiver].war.acceptsAfter;
  return state.turn - war.since >= after || powerOf(state, receiver).weariness >= RULES.war.badly;
}

/**
 * Passage and protection paid for (§23.2, §23.4), with the turn's credits: the buyer pays the
 * seller; one that cannot pay loses it now, with no memory of it on either side.
 */
export function payForSold(state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  const lapsed = new Set<Treaty>();
  for (const t of state.treaties) {
    if (!t.payer || t.since >= state.turn) continue;
    const price = priceOf(state, t);
    const payer = powerOf(state, t.payer);
    const seller = partnerOf(t, t.payer);
    if (payer.treasury < price) {
      lapsed.add(t);
      events.get(t.payer)?.push({ kind: 'treaty-lapsed', faction: seller, treaty: t.kind, ours: true });
      events.get(seller)?.push({ kind: 'treaty-lapsed', faction: t.payer, treaty: t.kind, ours: false });
      continue;
    }
    payer.treasury -= price;
    powerOf(state, seller).treasury += price;
  }
  state.treaties = state.treaties.filter((t) => !lapsed.has(t));
}

/** What sold treaties cost and bring a power a turn, for its treasury's lines. */
export function soldParts(state: GameState, f: FactionId): { label: string; value: number }[] {
  const out: { label: string; value: number }[] = [];
  for (const t of treatiesOf(state, f)) {
    if (!t.payer || t.since >= state.turn) continue;
    const other = FACTIONS[partnerOf(t, f)].shortName;
    const price = priceOf(state, t);
    const what = t.kind === 'passage' ? 'toll' : 'protection';
    out.push(
      t.payer === f
        ? { label: `${what} paid to the ${other}`, value: -price }
        : { label: `${what} from the ${other}`, value: price },
    );
  }
  return out;
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
  const otherOf = (o: Offer, f: FactionId) => (o.from === f ? o.to : o.from);
  // Peace the player made this turn, answering an offer (M4_FLEETS.md §23.2).
  for (const t of state.truces)
    if (t.until === state.turn + RULES.war.truce)
      for (const [f, other] of [
        [t.a, t.b],
        [t.b, t.a],
      ] as const)
        say(f, { kind: 'peace-made', faction: other });
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
    // Peace (M4_FLEETS.md §23.2): answered as any offer; accepted, the war ends and a truce follows.
    if (o.kind === 'peace') {
      if (!warring(state, o.from, o.to)) continue;
      if (o.turn < state.turn) say(o.from, { kind: 'offer-answered', faction: o.to, treaty: 'peace', accepted: false });
      else if (receiver.controller === 'player') {
        keep.push(o);
        say(o.to, { kind: 'offer-received', faction: o.from, treaty: 'peace' });
      } else {
        const yes = wouldMakePeace(state, o.to, o.from, o);
        say(o.from, { kind: 'offer-answered', faction: o.to, treaty: 'peace', accepted: yes });
        if (yes) {
          payTerms(state, o);
          endWar(state, o.from, o.to);
          say(o.from, { kind: 'peace-made', faction: o.to });
          say(o.to, { kind: 'peace-made', faction: o.from });
        }
      }
      continue;
    }
    // Surrender (M4_FLEETS.md §28.5): a rival always accepts it.
    if (o.kind === 'capitulation') {
      if (!warring(state, o.from, o.to)) continue;
      if (o.turn < state.turn)
        say(o.from, { kind: 'offer-answered', faction: o.to, treaty: 'capitulation', accepted: false });
      else if (receiver.controller === 'player') {
        keep.push(o);
        say(o.to, { kind: 'offer-received', faction: o.from, treaty: 'capitulation' });
      } else {
        capitulate(state, o.from, o.to);
        for (const f of [o.from, o.to]) say(f, { kind: 'subdued', faction: o.from, by: o.to });
      }
      continue;
    }
    if (o.kind === 'exchange') {
      if (o.turn < state.turn) say(o.from, { kind: 'exchange-refused', faction: o.to });
      else if (receiver.controller === 'player') {
        keep.push(o);
        say(o.to, { kind: 'exchange-received', faction: o.from, give: o.give as Amount, get: o.get as Amount });
      } else if (!wouldExchange(world, state, o.to, o)) say(o.from, { kind: 'exchange-refused', faction: o.to });
      else if (!bothHave(state, o))
        for (const f of [o.from, o.to]) say(f, { kind: 'exchange-failed', faction: otherOf(o, f) });
      else {
        exchange(state, o);
        say(o.from, { kind: 'exchange-made', faction: o.to, gave: o.give as Amount, got: o.get as Amount });
        say(o.to, { kind: 'exchange-made', faction: o.from, gave: o.get as Amount, got: o.give as Amount });
      }
      continue;
    }
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
