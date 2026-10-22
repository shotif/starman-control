// Victory and defeat (M4_FLEETS.md §30, D-14): a power whose last colony is gone leaves the game; a
// game is won by conquest, by the Assembly's choice, or by the highest score at the turn limit; and
// every power's story is kept for the end. Pure, in whole numbers.

import type { FactionId } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import type { ReportEvent } from './report.ts';
import { scoreOf } from './score.ts';
import { contactWith, type GameState, powerOf, type VictoryKind } from './state.ts';

/** Whether a power still plays: it has not left the game. */
export function inGame(state: GameState, f: FactionId): boolean {
  return state.powers.find((p) => p.faction === f)?.left === null;
}

/**
 * A power leaves the game (§30.2): its outposts abandoned, its ships lost, its lanes dark; its wars,
 * treaties, truces and offers ended; out of the Assembly; whoever it subdued freed; and no power
 * hears from it again. It stays listed for the story.
 */
export function leaveGame(state: GameState, f: FactionId, events: Map<FactionId, ReportEvent[]>): void {
  const power = powerOf(state, f);
  if (power.left !== null) return;
  for (const p of state.powers)
    if (p.faction === f || contactWith(p, f)) events.get(p.faction)?.push({ kind: 'power-left', faction: f });
  power.left = state.turn;
  power.subduedBy = null;
  power.contacts = [];
  power.gifts = [];
  state.holdings = state.holdings.filter((h) => h.owner !== f);
  state.ships = state.ships.filter((s) => s.owner !== f);
  state.fleets = state.fleets.filter((x) => x.owner !== f);
  state.lanes = state.lanes.filter((l) => l.owner !== f);
  const touches = (x: { a: FactionId; b: FactionId }) => x.a === f || x.b === f;
  state.wars = state.wars.filter((w) => !touches(w));
  state.treaties = state.treaties.filter((t) => !touches(t));
  state.truces = state.truces.filter((t) => !touches(t));
  state.offers = state.offers.filter((o) => o.from !== f && o.to !== f);
  for (const p of state.powers) {
    if (p.subduedBy === f) p.subduedBy = null;
    p.contacts = p.contacts.filter((c) => c.faction !== f);
    p.gifts = p.gifts.filter((g) => g.to !== f);
  }
  const a = state.assembly;
  if (a) {
    a.members = a.members.filter((m) => m !== f);
    a.roll = a.roll.filter((r) => r.faction !== f);
    a.cast = a.cast.filter((c) => c.faction !== f && c.choice !== f);
    if (a.leader === f) {
      a.leader = null;
      a.terms = 0;
    }
    if (a.candidates?.includes(f)) a.candidates = null;
    if (a.resolution && [a.resolution.by, a.resolution.on, a.resolution.and].includes(f)) a.resolution = null;
    a.sanctions = a.sanctions.filter((s) => s.on !== f);
    a.calls = a.calls.filter((c) => !touches(c));
    a.proposed = a.proposed.filter((p) => p.faction !== f);
    // Too few left to sit: it stands down until three can each talk again.
    if (a.members.length < RULES.assembly.forms) state.assembly = null;
  }
}

/** Every power that holds no colony leaves the game as the turn ends (§30.2). */
export function resolveLeaving(state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  for (const p of state.powers)
    if (p.left === null && !state.holdings.some((h) => h.owner === p.faction && h.kind === 'colony'))
      leaveGame(state, p.faction, events);
}

/** Who has won now, and how (§30.1), or null: conquest, then the keys, then the Assembly's choice, then the limit. */
export function victoryNow(state: GameState): { winner: FactionId | null; how: VictoryKind } | null {
  const playing = state.powers.filter((p) => p.left === null);
  if (state.powers.length > 1) {
    for (const p of playing) {
      const holds = state.holdings.some((h) => h.owner === p.faction && h.kind === 'colony');
      if (holds && playing.every((q) => q.faction === p.faction || q.subduedBy === p.faction))
        return { winner: p.faction, how: 'conquest' };
    }
    // The keys (M5_UNKNOWN.md §21.3): the Answer done.
    const a = state.answer;
    if (a && a.left <= 0 && inGame(state, a.by)) return { winner: a.by, how: 'keys' };
    const chosen = state.assembly?.chosen;
    if (chosen && inGame(state, chosen)) return { winner: chosen, how: 'vote' };
  }
  if (state.limit !== null && state.turn >= state.limit) {
    if (state.powers.length === 1) return { winner: null, how: 'score' };
    let best: { f: FactionId; score: number } | null = null;
    for (const p of playing) {
      const score = scoreOf(state, p.faction).total;
      if (!best || score > best.score) best = { f: p.faction, score };
    }
    return best ? { winner: best.f, how: 'score' } : null;
  }
  return null;
}

/**
 * The end of each turn (§30.1, §30.3): the powers' stories counted from the turn's events, the
 * scores kept every 10 turns, and the game decided if it is not yet; every power is told.
 */
export function resolveVictory(state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  for (const p of state.powers)
    for (const e of events.get(p.faction) ?? []) {
      if (e.kind === 'war-declared' && e.by === p.faction && !e.ally) p.story.wars++;
      if (e.kind === 'battle') p.story.battles++;
      if (e.kind === 'invasion' && e.won && e.by === p.faction) p.story.taken++;
    }
  const keep = () => {
    if (state.history.at(-1)?.turn === state.turn) return;
    state.history.push({
      turn: state.turn,
      scores: state.powers.map((p) => (p.left === null ? scoreOf(state, p.faction).total : 0)),
    });
  };
  if (state.turn % RULES.victory.historyEvery === 0) keep();
  if (state.ended) return;
  const won = victoryNow(state);
  if (!won) return;
  state.ended = { ...won, turn: state.turn };
  // The scores as the game was decided, for the story.
  keep();
  for (const p of state.powers) events.get(p.faction)?.push({ kind: 'game-ended', winner: won.winner, how: won.how });
}

/** How the game stands for a power (§30.2, §30.3): won, lost and how, or still to play. */
export type Outcome =
  | { result: 'victory'; how: VictoryKind }
  | { result: 'end' }
  | { result: 'defeat'; how: 'left' | 'surrender' | VictoryKind; by: FactionId | null };

export function outcomeFor(state: GameState, f: FactionId): Outcome | null {
  const power = powerOf(state, f);
  if (power.left !== null) return { result: 'defeat', how: 'left', by: null };
  const e = state.ended;
  if (e && e.winner === null) return { result: 'end' };
  if (e && e.winner === f) return { result: 'victory', how: e.how };
  if (e) return { result: 'defeat', how: e.how, by: e.winner };
  if (power.subduedBy) return { result: 'defeat', how: 'surrender', by: power.subduedBy };
  return null;
}
