// The Assembly (fiction, M4_FLEETS.md §29, D-67): it forms once three powers can each talk with
// the other two; its members' votes are weighed by their people; every 20 turns it elects a leader,
// and two thirds of all the votes choose one; between elections a member may propose sanctions or a
// call for peace. Votes and proposals are orders, the player's and the rivals' alike.

import { FACTIONS, type FactionId } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import { attitudeOf } from './memory.ts';
import type { ReportEvent } from './report.ts';
import {
  type Assembly,
  contactWith,
  type GameState,
  powerOf,
  type Resolution,
  type ResolutionKind,
  treatyOf,
  type VoteChoice,
} from './state.ts';
import { wouldMakePeace } from './treaties.ts';
import { atWar, warBetween } from './war.ts';
import type { World } from './world.ts';

const A = RULES.assembly;

/** Whether two powers can each talk with the other (M3_NEIGHBOURS.md §19). */
function talk(state: GameState, x: FactionId, y: FactionId): boolean {
  return contactWith(powerOf(state, x), y)?.stage === 'talk' && contactWith(powerOf(state, y), x)?.stage === 'talk';
}

/** Whether a power is a member of the Assembly. */
export function isMember(state: GameState, f: FactionId): boolean {
  return state.assembly?.members.includes(f) ?? false;
}

/** A member's votes (§29.1): one for every million of its people, at least one. */
export function votesOf(state: GameState, f: FactionId): number {
  let people = 0;
  for (const h of state.holdings) if (h.owner === f && h.kind === 'colony') people += h.people;
  return Math.max(1, Math.floor(people / A.peoplePerVote));
}

/** All the members' votes together. */
export function totalVotes(state: GameState): number {
  return (state.assembly?.members ?? []).reduce((n, f) => n + votesOf(state, f), 0);
}

/** A member's votes as the Assembly last counted them (§29.4): what every power knows of them. */
export function rollOf(state: GameState, f: FactionId): number {
  return state.assembly?.roll.find((r) => r.faction === f)?.votes ?? 0;
}

/** Whether so many votes are two thirds of the whole (§29.2). */
export function isTwoThirds(votes: number, total: number): boolean {
  return total > 0 && votes * A.chosenOf >= total * A.chosenParts;
}

/** The first three powers, in the order they are listed, that can each talk with the other two. */
export function foundersOf(state: GameState): FactionId[] | null {
  const all = state.powers.map((p) => p.faction);
  for (let i = 0; i < all.length; i++)
    for (let j = i + 1; j < all.length; j++)
      for (let k = j + 1; k < all.length; k++) {
        const [a, b, c] = [all[i], all[j], all[k]] as [FactionId, FactionId, FactionId];
        if (talk(state, a, b) && talk(state, a, c) && talk(state, b, c)) return [a, b, c];
      }
  return null;
}

/**
 * The two members with the most votes, the earlier member first on a tie (§29.2); by the roll on a
 * screen, which knows no more of the others' people than the Assembly says.
 */
export function candidatesOf(
  state: GameState,
  votes: (f: FactionId) => number = (f) => votesOf(state, f),
): [FactionId, FactionId] | null {
  const members = state.assembly?.members ?? [];
  if (members.length < 2) return null;
  const order = [...members].sort((x, y) => votes(y) - votes(x) || members.indexOf(x) - members.indexOf(y));
  return [order[0] as FactionId, order[1] as FactionId];
}

/** What is before the Assembly this turn: an election, a resolution, or nothing. */
export function onTheFloor(state: GameState): 'election' | 'resolution' | null {
  const a = state.assembly;
  if (!a) return null;
  if (a.election === state.turn && a.candidates) return 'election';
  if (a.resolution && a.resolution.turn === state.turn) return 'resolution';
  return null;
}

/** Whether sanctions are in force on a power (§29.3). */
export function isSanctioned(state: GameState, f: FactionId): boolean {
  return state.assembly?.sanctions.some((s) => s.on === f) ?? false;
}

/**
 * Why trade or an exchange between two powers is refused under sanctions (§29.3): no member trades
 * with a sanctioned power.
 */
export function sanctionRefusal(state: GameState, from: FactionId, to: FactionId): string | null {
  if (isSanctioned(state, to) && isMember(state, from))
    return `The Assembly's sanctions on the ${FACTIONS[to].shortName} forbid trade with them.`;
  if (isSanctioned(state, from) && isMember(state, to))
    return 'The Assembly’s sanctions on us forbid trade with its members.';
  return null;
}

/** The call for peace in force between two powers, if there is one (§29.3). */
export function callBetween(state: GameState, x: FactionId, y: FactionId) {
  return state.assembly?.calls.find((c) => (c.a === x && c.b === y) || (c.a === y && c.b === x));
}

/** Whether a rival heeds a call for peace (§29.3): every one but the outlaw. */
export function heeds(f: FactionId): boolean {
  return FACTIONS[f].lawful;
}

/** Why a member may not vote as it chooses now (§29.2, §29.3), or null. */
export function voteRefusal(state: GameState, f: FactionId, choice: VoteChoice): string | null {
  const a = state.assembly;
  if (!a?.members.includes(f)) return 'We are not a member of the Assembly.';
  const victor = powerOf(state, f).subduedBy;
  if (victor) return `We are subdued by the ${FACTIONS[victor].shortName}: our votes go as theirs do.`;
  const floor = onTheFloor(state);
  if (floor === null) return 'Nothing is before the Assembly this turn.';
  if (choice === 'abstain') return null;
  if (floor === 'election')
    return a.candidates?.includes(choice as FactionId) ? null : 'Only the two candidates can be voted for.';
  return choice === 'for' || choice === 'against' ? null : 'A resolution is voted for or against.';
}

/** Casts a member's vote this turn, in place of any it cast before (order `vote`, checked). */
export function castVote(state: GameState, f: FactionId, choice: VoteChoice): void {
  const a = state.assembly;
  if (!a) return;
  a.cast = a.cast.filter((c) => c.faction !== f);
  a.cast.push({ faction: f, choice });
}

/** The resolutions a member could propose (§29.3), whether or not it may propose now. */
export function proposals(state: GameState): Omit<Resolution, 'by' | 'turn'>[] {
  const members = state.assembly?.members ?? [];
  const out: Omit<Resolution, 'by' | 'turn'>[] = [];
  for (const f of members)
    if (!isSanctioned(state, f) && members.some((g) => atWar(state, f, g))) out.push({ kind: 'sanctions', on: f });
  for (const w of state.wars)
    if (members.includes(w.a) && members.includes(w.b) && !callBetween(state, w.a, w.b))
      out.push({ kind: 'peace-call', on: w.a, and: w.b });
  return out;
}

/** Why a member may not propose a resolution now (§29.3), or null. */
export function proposeRefusal(
  state: GameState,
  f: FactionId,
  r: Pick<Resolution, 'kind' | 'on' | 'and'>,
): string | null {
  const a = state.assembly;
  if (!a?.members.includes(f)) return 'We are not a member of the Assembly.';
  if (a.resolution) return 'A resolution is before the Assembly already.';
  if (a.election === state.turn || a.election === state.turn + 1)
    return 'The Assembly holds its election: propose after it.';
  const last = a.proposed.find((p) => p.faction === f);
  if (last && state.turn - last.turn < A.proposeEvery)
    return `We proposed one on turn ${last.turn}: the next from turn ${last.turn + A.proposeEvery}.`;
  const ok = proposals(state).some((p) => p.kind === r.kind && p.on === r.on && p.and === r.and);
  if (ok) return null;
  return r.kind === 'sanctions'
    ? 'Sanctions fall only on a member at war with another member.'
    : 'Peace is called for only between two members at war, with no call already.';
}

/** Puts a resolution before the Assembly, to be voted on next turn (order `propose`, checked). */
export function propose(state: GameState, f: FactionId, r: Pick<Resolution, 'kind' | 'on' | 'and'>): void {
  const a = state.assembly;
  if (!a) return;
  a.resolution = { kind: r.kind, by: f, on: r.on, ...(r.and ? { and: r.and } : {}), turn: state.turn + 1 };
  a.proposed = a.proposed.filter((p) => p.faction !== f);
  a.proposed.push({ faction: f, turn: state.turn });
}

/**
 * How a rival votes in an election (§29.2): a candidate for itself; otherwise for the candidate it
 * regards better, if it regards it at least warm and is not at war with it; else it abstains. And
 * fear at the deciding vote (M4_FLEETS.md §31.3): when the votes as they lean would choose a power
 * outright, a member that is not its ally thinks so much less of it, and votes for it only if it
 * still regards it warmly, else for the other candidate if it regards that one warmly.
 */
export function electionLean(world: World, state: GameState, f: FactionId): VoteChoice {
  const lean = warmLean(world, state, f);
  const c = state.assembly?.candidates;
  if (!c || lean === 'abstain' || lean === f || !c.includes(lean as FactionId)) return lean;
  const choice = lean as FactionId;
  if (treatyOf(state, f, choice, 'alliance') || !wouldChoose(world, state, choice)) return choice;
  const other = c[0] === choice ? c[1] : c[0];
  const feared = attitudeOf(world, state, f, choice).total - A.fear;
  const them = atWar(state, f, other) ? -Infinity : attitudeOf(world, state, f, other).total;
  if (feared >= A.warm && feared > them) return choice;
  return them >= A.warm ? other : 'abstain';
}

/** A member's vote by regard alone (§29.2). */
function warmLean(world: World, state: GameState, f: FactionId): VoteChoice {
  const c = state.assembly?.candidates;
  if (!c) return 'abstain';
  if (c.includes(f)) return f;
  const regard = (x: FactionId) => (atWar(state, f, x) ? -Infinity : attitudeOf(world, state, f, x).total);
  const [a, b] = c;
  const best = regard(a) >= regard(b) ? a : b;
  if (regard(a) === regard(b) || regard(best) < A.warm) return 'abstain';
  return best;
}

/** Whether a candidate would be chosen by the votes as they lean by regard alone, the player's as cast. */
function wouldChoose(world: World, state: GameState, candidate: FactionId): boolean {
  const a = state.assembly;
  if (!a) return false;
  let votes = 0;
  for (const m of a.members) {
    const victor = powerOf(state, m).subduedBy;
    const who = victor && a.members.includes(victor) ? victor : m;
    const choice =
      powerOf(state, who).controller === 'ai'
        ? warmLean(world, state, who)
        : (a.cast.find((c) => c.faction === who)?.choice ?? 'abstain');
    if (choice === candidate) votes += votesOf(state, m);
  }
  return isTwoThirds(votes, totalVotes(state));
}

/**
 * How a rival votes on a resolution (§29.3). Sanctions: the sanctioned and its allies against, its
 * enemies for, the proposer for; any other by whom it regards better, the proposer or the
 * sanctioned. A call for peace: the two at war for it if they would make peace now; any other for it.
 */
export function resolutionLean(world: World, state: GameState, f: FactionId): VoteChoice {
  const r = state.assembly?.resolution;
  if (!r) return 'abstain';
  if (r.kind === 'peace-call') {
    const other = f === r.on ? r.and : f === r.and ? r.on : null;
    if (!other) return 'for';
    return wouldMakePeace(state, f, other) ? 'for' : 'against';
  }
  if (f === r.on || treatyOf(state, f, r.on, 'alliance')) return 'against';
  if (f === r.by || atWar(state, f, r.on)) return 'for';
  const by = attitudeOf(world, state, f, r.by).total;
  const on = attitudeOf(world, state, f, r.on).total;
  return by > on ? 'for' : by < on ? 'against' : 'abstain';
}

/** Each member's vote as counted (§29.2): as cast, abstaining if not, and the subdued with its victor. */
function counted(state: GameState): Map<FactionId, VoteChoice> {
  const a = state.assembly as Assembly;
  const votes = new Map<FactionId, VoteChoice>();
  for (const f of a.members) votes.set(f, a.cast.find((c) => c.faction === f)?.choice ?? 'abstain');
  for (const f of a.members) {
    const victor = powerOf(state, f).subduedBy;
    if (victor && votes.has(victor)) votes.set(f, votes.get(victor) as VoteChoice);
  }
  return votes;
}

/** The votes cast for a choice. */
function tally(state: GameState, votes: Map<FactionId, VoteChoice>, choice: VoteChoice): number {
  let n = 0;
  for (const [f, c] of votes) if (c === choice) n += votesOf(state, f);
  return n;
}

/** A resolution's words, for a refusal or a line ("sanctions on the Wake"). */
export function resolutionWords(r: { kind: ResolutionKind; on: FactionId; and?: FactionId }): string {
  return r.kind === 'sanctions'
    ? `sanctions on the ${FACTIONS[r.on].shortName}`
    : `a call for peace to the ${FACTIONS[r.on].shortName} and the ${FACTIONS[r.and as FactionId].shortName}`;
}

/** Lays sanctions on a member (§29.3): every member's trade with it ends. */
function sanction(state: GameState, on: FactionId, say: (e: ReportEvent) => void): void {
  const a = state.assembly as Assembly;
  if (a.sanctions.some((s) => s.on === on)) return;
  a.sanctions.push({ on, since: state.turn });
  state.treaties = state.treaties.filter(
    (t) => !(t.kind === 'trade' && (t.a === on || t.b === on) && a.members.includes(t.a === on ? t.b : t.a)),
  );
  state.offers = state.offers.filter(
    (o) =>
      !(
        (o.kind === 'trade' || o.kind === 'exchange') &&
        (o.from === on || o.to === on) &&
        a.members.includes(o.from === on ? o.to : o.from)
      ),
  );
  say({ kind: 'sanctions', faction: on, laid: true });
}

/**
 * The Assembly, as each turn ends (§29): it forms, or powers join it; the election or the resolution
 * of the turn is counted; calls for peace run out; sanctions are lifted; the candidates for next
 * turn's election are named; and the turn's votes are cleared.
 */
export function resolveAssembly(state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  const turn = state.turn;
  let a = state.assembly;
  if (!a) {
    const founders = foundersOf(state);
    if (!founders) return;
    a = {
      formed: turn,
      members: founders,
      roll: [],
      leader: null,
      terms: 0,
      election: turn + A.every,
      candidates: null,
      cast: [],
      resolution: null,
      proposed: [],
      sanctions: [],
      calls: [],
      chosen: null,
    };
    state.assembly = a;
    for (const f of founders) events.get(f)?.push({ kind: 'assembly-formed', members: [...founders] });
  }
  const assembly = a;
  const say = (e: ReportEvent) => {
    for (const f of assembly.members) events.get(f)?.push(e);
  };

  // Joins: any power that can talk with a member.
  for (const p of state.powers) {
    if (assembly.members.includes(p.faction)) continue;
    if (!assembly.members.some((m) => talk(state, p.faction, m))) continue;
    assembly.members.push(p.faction);
    say({ kind: 'assembly-joined', faction: p.faction });
  }
  // The roll: each member's votes as they are counted now.
  assembly.roll = assembly.members.map((f) => ({ faction: f, votes: votesOf(state, f) }));

  // The election of the turn (§29.2).
  if (assembly.election <= turn && !assembly.candidates) assembly.election = turn + A.every;
  else if (assembly.election === turn && assembly.candidates) {
    const votes = counted(state);
    const [x, y] = assembly.candidates;
    const forX = tally(state, votes, x);
    const forY = tally(state, votes, y);
    const total = totalVotes(state);
    const winner = forX > forY ? x : forY > forX ? y : null;
    if (winner) {
      assembly.terms = winner === assembly.leader ? assembly.terms + 1 : 1;
      assembly.leader = winner;
    }
    const won = winner === x ? forX : winner === y ? forY : forX;
    const chosen = winner !== null && isTwoThirds(won, total);
    if (chosen && assembly.chosen === null) assembly.chosen = winner;
    say({
      kind: 'elected',
      faction: winner,
      votes: won,
      against: winner === x ? forY : forX,
      total,
      chosen,
    });
    assembly.candidates = null;
    assembly.election = turn + A.every;
  }

  // The resolution of the turn (§29.3): passed with more votes for than against, a tie the leader's
  // way; lapsed if the war it was about is over.
  const r = assembly.resolution;
  if (r && r.turn === turn) {
    const votes = counted(state);
    const yes = tally(state, votes, 'for');
    const no = tally(state, votes, 'against');
    const leader = assembly.leader ? votes.get(assembly.leader) : undefined;
    const passed = yes > no || (yes === no && yes > 0 && leader === 'for');
    const still =
      r.kind === 'sanctions'
        ? assembly.members.some((g) => atWar(state, r.on, g))
        : warBetween(state, r.on, r.and as FactionId) !== undefined;
    say({
      kind: 'resolution',
      resolution: r.kind,
      by: r.by,
      on: r.on,
      ...(r.and ? { and: r.and } : {}),
      stage: !still ? 'lapsed' : passed ? 'passed' : 'failed',
      for: yes,
      against: no,
    });
    if (passed && still) {
      if (r.kind === 'sanctions') sanction(state, r.on, say);
      else assembly.calls.push({ a: r.on, b: r.and as FactionId, until: turn + A.callTurns, offered: [] });
    }
    assembly.resolution = null;
  } else if (r && r.turn === turn + 1)
    say({
      kind: 'resolution',
      resolution: r.kind,
      by: r.by,
      on: r.on,
      ...(r.and ? { and: r.and } : {}),
      stage: 'proposed',
    });

  // Calls for peace: heeded once the war is over; at their end, sanctions on each of the two that has
  // not offered peace without terms.
  const calls: Assembly['calls'] = [];
  for (const c of assembly.calls) {
    if (!warBetween(state, c.a, c.b)) continue;
    if (c.until > turn) {
      calls.push(c);
      continue;
    }
    for (const f of [c.a, c.b]) if (!c.offered.includes(f)) sanction(state, f, say);
  }
  assembly.calls = calls;

  // Sanctions lifted from a power at war with no member.
  assembly.sanctions = assembly.sanctions.filter((s) => {
    if (s.since === turn || assembly.members.some((g) => atWar(state, s.on, g))) return true;
    say({ kind: 'sanctions', faction: s.on, laid: false });
    return false;
  });

  // The candidates for next turn's election.
  if (assembly.election === turn + 1) {
    assembly.candidates = candidatesOf(state);
    if (assembly.candidates) {
      const [x, y] = assembly.candidates;
      say({ kind: 'candidates', a: x, b: y, election: assembly.election });
    }
  }
  assembly.cast = [];
}

/**
 * Peace offered without terms under a call (§29.3), noted for the call's end; the order of peace
 * offered calls this as the offer is made.
 */
export function notePeaceOffered(state: GameState, from: FactionId, to: FactionId, terms: boolean): void {
  const c = callBetween(state, from, to);
  if (c && !terms && !c.offered.includes(from)) c.offered.push(from);
}
