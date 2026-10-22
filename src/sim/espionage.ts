// Light espionage (M5_UNKNOWN.md §23, D-74): agents watch another power for credits a turn, and the
// intelligence they gather rises while they watch and fades when they do not; agents at home guard
// it. What intelligence shows is read by the known view (visibility.ts) and the screens. Pure.

import { FACTIONS, type FactionId } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import type { ReportEvent } from './report.ts';
import { contactWith, type GameState, GUARD_STEPS, type GuardStep, powerOf } from './state.ts';

const S = RULES.espionage;

/** A power's intelligence of another, 0 to 100. */
export function intelOf(state: GameState, viewer: FactionId, other: FactionId): number {
  return powerOf(state, viewer).intel.find((x) => x.faction === other)?.level ?? 0;
}

/** Whether a power's agents know where every holding of another lies (§23.1). */
export const knowsHoldings = (state: GameState, viewer: FactionId, other: FactionId) =>
  intelOf(state, viewer, other) >= S.holdings;
/** Whether they see the other's ships at its own holdings. */
export const knowsShips = (state: GameState, viewer: FactionId, other: FactionId) =>
  intelOf(state, viewer, other) >= S.ships;
/** Whether they know its technologies, research and treasury. */
export const knowsSecrets = (state: GameState, viewer: FactionId, other: FactionId) =>
  intelOf(state, viewer, other) >= S.secrets;

/** What a power's agents cost a turn (§23.1, §23.2): each power watched and each step of guard. */
export function agentsCost(state: GameState, faction: FactionId): number {
  const p = powerOf(state, faction);
  return p.agents.length * S.watchCost + p.guard * S.guardCost;
}

/** Why a power may not watch another, or stop, or null (§23.1). */
export function watchRefusal(state: GameState, faction: FactionId, other: FactionId, watch: boolean): string | null {
  const p = powerOf(state, faction);
  if (other === faction || !state.powers.some((x) => x.faction === other)) return 'There is no such power.';
  if (!watch) return p.agents.includes(other) ? null : 'Our agents are not watching them.';
  if (p.agents.includes(other)) return 'Our agents are watching them already.';
  if (!contactWith(p, other)) return `We have not heard the ${FACTIONS[other].shortName}.`;
  return null;
}

/** Sets a power's watch on another; the caller has checked `watchRefusal`. */
export function setWatch(state: GameState, faction: FactionId, other: FactionId, watch: boolean): void {
  const p = powerOf(state, faction);
  p.agents = watch ? [...p.agents, other].sort() : p.agents.filter((f) => f !== other);
}

export function isGuardStep(n: unknown): n is GuardStep {
  return GUARD_STEPS.includes(n as GuardStep);
}

/** The marks in order, each with what it shows, for the reports and the screens. */
export const MARKS: readonly { level: number; shows: string }[] = [
  { level: S.holdings, shows: 'where every holding of theirs lies' },
  { level: S.ships, shows: 'their ships at their holdings' },
  { level: S.secrets, shows: 'their technologies, their research and their treasury' },
];

/**
 * As the turn ends (§23.1): each power's intelligence of every other rises where its agents watch
 * (less the other's guard) and fades where they do not; a power gone or out of contact is not
 * watched. Each mark newly reached is reported.
 */
export function resolveEspionage(state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  for (const p of state.powers) {
    p.agents = p.agents.filter((f) => contactWith(p, f) && powerOf(state, f).left === null);
    const next: { faction: FactionId; level: number }[] = [];
    for (const other of state.powers) {
      if (other.faction === p.faction) continue;
      const was = intelOf(state, p.faction, other.faction);
      const level = p.agents.includes(other.faction)
        ? Math.min(S.most, was + Math.max(S.least, S.gain - S.guardLess * other.guard))
        : Math.max(0, was - S.fade);
      if (level > 0) next.push({ faction: other.faction, level });
      for (const m of MARKS)
        if (was < m.level && level >= m.level)
          events.get(p.faction)?.push({ kind: 'intel', faction: other.faction, level: m.level });
    }
    p.intel = next;
  }
}
