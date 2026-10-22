// Leaders (M5_UNKNOWN.md §24, D-73): named people, all fiction, hired from the people offered every
// few turns, posted to a fleet, a colony or one of a power's own posts, growing in their traits and
// leaving when they are not kept well. What their traits give is read where it applies (battles, the
// economy, research, regard, the Assembly and espionage). Pure.

import { ADVISORS } from '../content/advisors.ts';
import { FACTIONS, type FactionId } from '../content/factions.ts';
import {
  CALLING_DEFS,
  CALLINGS,
  type Calling,
  FACES,
  FLAWS,
  LEADER_NAMES,
  TRAITS,
  type TraitId,
} from '../content/leaders.ts';
import { RULES } from '../content/rules.ts';
import type { ReportEvent } from './report.ts';
import { rng } from './rng.ts';
import { type Candidate, contactWith, type GameState, type Holding, type Leader, powerOf } from './state.ts';

const L = RULES.leaders;

/** A power's leaders, in id order. */
export function leadersOf(state: GameState, faction: FactionId): Leader[] {
  return state.leaders.filter((l) => l.serves === faction);
}

/** The people offered to a power now (§24.3). */
export function candidatesFor(state: GameState, faction: FactionId): Candidate[] {
  return state.candidates.filter((c) => c.serves === faction);
}

/** The leader in a post: a commander's fleet, a steward's colony, or 0 for one of the power's own posts. */
export function postedLeader(state: GameState, faction: FactionId, calling: Calling, post = 0): Leader | undefined {
  return state.leaders.find((l) => l.serves === faction && l.calling === calling && l.post === post);
}

/** A leader's level in a trait, 0 if it has none (or there is no leader). */
export function traitLevel(leader: Leader | undefined, trait: TraitId): number {
  return leader?.traits.find((t) => t.trait === trait)?.level ?? 0;
}

/** What a trait gives in a post, in the rules' units for each level; 0 with no one there. */
export function postGives(state: GameState, faction: FactionId, calling: Calling, trait: TraitId, post = 0): number {
  return traitLevel(postedLeader(state, faction, calling, post), trait) * L.per[trait];
}

/** "Steward Ines Barros". */
export function leaderTitle(l: Pick<Leader, 'calling' | 'name'>): string {
  return `${CALLING_DEFS[l.calling].title} ${l.name}`;
}

/** "Bold 2, Steady 1". */
export function traitsText(l: Pick<Leader, 'traits'>): string {
  return l.traits.map((t) => `${TRAITS[t.trait].name} ${t.level}`).join(', ');
}

/** A figure's part for a trait: "Steward Ines Barros (Beloved 2)". */
export function traitLabel(l: Leader, trait: TraitId): string {
  return `${leaderTitle(l)} (${TRAITS[trait].name} ${traitLevel(l, trait)})`;
}

/** The part a leader's trait adds to a figure, if any. */
export function traitPart(
  state: GameState,
  faction: FactionId,
  calling: Calling,
  trait: TraitId,
  value: (per: number) => number,
  post = 0,
): { label: string; value: number } | null {
  const l = postedLeader(state, faction, calling, post);
  const level = traitLevel(l, trait);
  if (!l || level === 0) return null;
  const v = value(level * L.per[trait]);
  return v === 0 ? null : { label: traitLabel(l, trait), value: v };
}

/** What a power's leaders cost a turn (§24.3). */
export function wagesOf(state: GameState, faction: FactionId): number {
  return leadersOf(state, faction).reduce((n, l) => n + l.wage, 0);
}

/** The fee and wage for so many trait levels, and a flaw (§24.3). */
export function feeAndWage(levels: number, greedy: boolean): { fee: number; wage: number } {
  return {
    fee: L.fee + L.feePerLevel * levels,
    wage: (L.wage + L.wagePerLevel * levels) * (greedy ? 2 : 1),
  };
}

const levelsOf = (l: Pick<Leader, 'traits'>) => l.traits.reduce((n, t) => n + t.level, 0);

// ---------------------------------------------------------------- the pool

/** Names no new leader takes: every advisor's and speaker's, and every leader's living or offered. */
function namesTaken(state: GameState): Set<string> {
  const out = new Set<string>();
  for (const a of Object.values(ADVISORS)) for (const p of Object.values(a.people)) out.add(p.name);
  for (const f of Object.values(FACTIONS)) if (f.speaker) out.add(f.speaker.name);
  for (const l of [...state.leaders, ...state.candidates]) out.add(l.name);
  return out;
}

/** A name in its people's style (§24.7), not taken, from the stream. */
function nameFor(people: FactionId, calling: Calling, taken: Set<string>, roll: ReturnType<typeof rng>): string {
  const n = LEADER_NAMES[people];
  let name = '';
  for (let i = 0; i < 12; i++) {
    const first = roll.pick(n.first);
    name = n.second ? `${first} ${roll.pick(n.second)}` : first;
    if (people === 'sta' && calling === 'scholar') name = `Dr ${name}`;
    if (!taken.has(name)) break;
  }
  taken.add(name);
  return name;
}

/**
 * As the first turn ends, and every so many turns after (§24.3): each power in play is offered new
 * people in place of those it did not hire, and told so.
 */
export function makeCandidates(state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  if ((state.turn - 1) % L.offerEvery !== 0) return;
  state.candidates = [];
  const taken = namesTaken(state);
  for (const p of state.powers) {
    if (p.left !== null) continue;
    const roll = rng(state.seed, 'leaders', state.turn, p.faction);
    const heard = p.contacts.map((c) => c.faction).filter((f) => powerOf(state, f).left === null);
    for (let i = 0; i < L.offers; i++) {
      const calling = roll.pick(CALLINGS);
      const people = heard.length > 0 && roll.chance(L.otherPeople, 100) ? roll.pick(heard) : p.faction;
      const kinds = CALLING_DEFS[calling].traits;
      const first = roll.pick(kinds);
      const traits = [{ trait: first, level: 1 }];
      const rest = kinds.filter((t) => t !== first);
      if (rest.length > 0 && roll.chance(L.secondTrait, 100)) traits.push({ trait: roll.pick(rest), level: 1 });
      const flaw = roll.chance(L.flaw, 100) ? roll.pick(FLAWS) : null;
      const { fee, wage } = feeAndWage(traits.length, flaw === 'greedy');
      state.candidates.push({
        id: state.nextLeaderId++,
        serves: p.faction,
        people,
        name: nameFor(people, calling, taken, roll),
        face: roll.int(1, FACES),
        calling,
        traits,
        flaw,
        wage,
        post: null,
        served: 0,
        fee,
      });
    }
    if (L.offers > 0) events.get(p.faction)?.push({ kind: 'offered', count: L.offers });
  }
}

// ---------------------------------------------------------------- orders

/** Why a power cannot hire one offered to it, or null if it can (§24.3). */
export function hireRefusal(state: GameState, faction: FactionId, id: number): string | null {
  const c = state.candidates.find((x) => x.id === id && x.serves === faction);
  if (!c) return 'No one by that name is offered to us now.';
  if (leadersOf(state, faction).length >= L.most) return `We keep ${L.most} leaders already: dismiss one first.`;
  if (powerOf(state, faction).treasury < c.fee) return `We cannot pay the fee of ${c.fee} credits.`;
  return null;
}

/** Hires one offered: the fee paid, the leader waiting for a post. */
export function hire(state: GameState, faction: FactionId, id: number): void {
  const c = state.candidates.find((x) => x.id === id && x.serves === faction);
  if (!c) return;
  powerOf(state, faction).treasury -= c.fee;
  state.candidates = state.candidates.filter((x) => x !== c);
  const { fee: _fee, ...leader } = c;
  state.leaders = [...state.leaders, { ...leader, post: null, served: 0 }].sort((a, b) => a.id - b.id);
}

/** Whether a post is one a leader of this calling can take for this power (§24.1). */
function postFits(state: GameState, faction: FactionId, calling: Calling, post: number): boolean {
  if (CALLING_DEFS[calling].single) return post === 0;
  if (calling === 'commander') return state.fleets.some((f) => f.id === post && f.owner === faction);
  return state.holdings.some((h) => h.id === post && h.owner === faction && h.kind === 'colony');
}

/** Why a leader cannot take a post (or be called back, with null), or null if it can (§24.1). */
export function postRefusal(state: GameState, faction: FactionId, id: number, post: number | null): string | null {
  const l = state.leaders.find((x) => x.id === id && x.serves === faction);
  if (!l) return 'That leader does not serve us.';
  if (post === null) return l.post === null ? `${leaderTitle(l)} is waiting already.` : null;
  if (l.post === post) return `${leaderTitle(l)} serves there already.`;
  if (!postFits(state, faction, l.calling, post)) {
    const def = CALLING_DEFS[l.calling];
    return `A ${def.title.toLowerCase()} serves ${def.post}${def.single ? ' only' : ' of ours'}.`;
  }
  return null;
}

/** Posts a leader, sending whoever served there back to wait; or calls it back with null. */
export function postLeader(state: GameState, faction: FactionId, id: number, post: number | null): void {
  const l = state.leaders.find((x) => x.id === id && x.serves === faction);
  if (!l) return;
  if (post !== null) {
    const there = postedLeader(state, faction, l.calling, post);
    if (there) there.post = null;
  }
  l.post = post;
}

/** Why a leader cannot be dismissed, or null. */
export function dismissRefusal(state: GameState, faction: FactionId, id: number): string | null {
  return state.leaders.some((x) => x.id === id && x.serves === faction) ? null : 'That leader does not serve us.';
}

/** Lets a leader go, with no fee back. */
export function dismiss(state: GameState, faction: FactionId, id: number): void {
  state.leaders = state.leaders.filter((x) => !(x.id === id && x.serves === faction));
}

// ---------------------------------------------------------------- as the turn ends

/**
 * As the turn ends (§24.2, §24.4), after the battles and the treasury: a leader of a power gone goes
 * too; a post that is no more sends its leader back to wait, but a commander whose fleet was
 * destroyed in battle falls with it; those in posts gain experience and grow; some leave, in debt
 * or with an unhappy colony; and a rival that knows a power's secrets may lure one away.
 */
export function resolveLeaders(
  state: GameState,
  events: Map<FactionId, ReportEvent[]>,
  unhappy: (h: Holding) => boolean,
): void {
  const tell = (f: FactionId, e: ReportEvent) => events.get(f)?.push(e);
  const said = (l: Leader, what: Extract<ReportEvent, { kind: 'leader' }>['what']) =>
    ({ kind: 'leader', what, leader: l.id, name: l.name, calling: l.calling }) as const;
  const inPlay = (f: FactionId) => state.powers.some((p) => p.faction === f && p.left === null);
  state.leaders = state.leaders.filter((l) => inPlay(l.serves));
  state.candidates = state.candidates.filter((c) => inPlay(c.serves));

  // Posts that are no more.
  const fought = new Set(state.battles.flatMap((b) => b.forces.map((f) => f.fleet)));
  const gone: Leader[] = [];
  for (const l of state.leaders) {
    if (l.post === null || postFits(state, l.serves, l.calling, l.post)) continue;
    if (l.calling === 'commander' && fought.has(l.post)) {
      gone.push(l);
      tell(l.serves, said(l, 'fell'));
    } else l.post = null;
  }

  // Experience.
  for (const l of state.leaders) {
    if (l.post === null || gone.includes(l)) continue;
    l.served++;
    if (l.served % L.growEvery !== 0) continue;
    const low = l.traits.reduce<(typeof l.traits)[number] | null>(
      (m, t) => (t.level < L.topLevel && (!m || t.level < m.level) ? t : m),
      null,
    );
    if (!low) continue;
    low.level++;
    tell(l.serves, { ...said(l, 'grew'), trait: low.trait, level: low.level });
  }

  // Loyalty.
  for (const l of state.leaders) {
    if (gone.includes(l)) continue;
    const roll = rng(state.seed, 'loyalty', state.turn, l.id);
    const restless = l.flaw === 'restless' ? 2 : 1;
    if (powerOf(state, l.serves).treasury < 0 && roll.chance(L.leaveInDebt * restless, 100)) {
      gone.push(l);
      tell(l.serves, said(l, 'debt'));
      continue;
    }
    const colony = l.calling === 'steward' && l.post !== null ? state.holdings.find((h) => h.id === l.post) : undefined;
    if (colony && unhappy(colony) && roll.chance(L.leaveUnhappy * restless, 100)) {
      gone.push(l);
      tell(l.serves, said(l, 'unhappy'));
    }
  }
  state.leaders = state.leaders.filter((l) => !gone.includes(l));

  // Lured away, by a rival whose agents know our secrets, unless we keep much guard at home.
  for (const p of state.powers) {
    if (p.left !== null || p.guard >= 2) continue;
    for (const rival of state.powers) {
      if (rival.faction === p.faction || rival.left !== null) continue;
      const knows = (rival.intel.find((x) => x.faction === p.faction)?.level ?? 0) >= RULES.espionage.secrets;
      if (!knows || !contactWith(rival, p.faction)) continue;
      if (leadersOf(state, rival.faction).length >= L.most) continue;
      const ours = leadersOf(state, p.faction);
      if (ours.length === 0) continue;
      if (!rng(state.seed, 'lured', state.turn, p.faction, rival.faction).chance(L.lured, 100)) continue;
      const best = ours.reduce((m, l) => (levelsOf(l) > levelsOf(m) ? l : m));
      tell(p.faction, { ...said(best, 'lured'), faction: rival.faction });
      tell(rival.faction, { ...said(best, 'joined'), faction: p.faction });
      best.serves = rival.faction;
      best.post = null;
    }
  }
}
