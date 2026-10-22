// Contact between powers (M3_NEIGHBOURS.md §19, D-52): a power hears a signal from another the
// first turn it sees anything of theirs; then, unless they share a tongue, it has words while it
// learns theirs; then it can talk. Each side has its own contact, and none is ever lost.

import { FACTIONS, type FactionId } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import type { SystemId } from '../data/types.ts';
import type { ReportEvent } from './report.ts';
import { effects } from './research.ts';
import { contactWith, type GameState, powerOf } from './state.ts';
import { seesHolding, seesLane, seesShip, watchedSystems } from './visibility.ts';
import { laneEnds, type World } from './world.ts';

/** Powers of one species share a tongue (§19.1): they talk from the first signal. */
export function sharesTongue(a: FactionId, b: FactionId): boolean {
  return FACTIONS[a].species === FACTIONS[b].species;
}

/**
 * Where a power sees something of another's now, if anywhere: a colony or outpost, then a ship,
 * then a lane (at an end it has surveyed). A great work is seen by everyone.
 */
export function seenAt(
  state: GameState,
  viewer: FactionId,
  other: FactionId,
  watched: ReadonlySet<SystemId>,
): SystemId | null {
  const holding = state.holdings.find((h) => h.owner === other && seesHolding(state, viewer, h));
  if (holding) return holding.system;
  const ship = state.ships.find((s) => s.owner === other && s.at !== null && seesShip(viewer, s, watched));
  if (ship?.at) return ship.at;
  const lane = state.lanes.find((l) => l.owner === other && seesLane(state, viewer, l));
  if (!lane) return null;
  const surveyed = state.powers.find((p) => p.faction === viewer)?.surveyed ?? [];
  return laneEnds(lane.id).find((end) => surveyed.includes(end)) ?? null;
}

/** Translation a power gains in a turn besides sight: Translation's (§19.4). */
export function translationOf(state: GameState, faction: FactionId): number {
  return effects(state, faction, 'translation').reduce((sum, e) => sum + e.perTurn, 0);
}

/**
 * A power hears another for the first time (§19.1): at talk if they share a tongue, at the first
 * words if not; its report says where. Also when an offer comes from a power not heard (§21.2).
 */
export function hear(
  state: GameState,
  faction: FactionId,
  other: FactionId,
  at: SystemId | null,
  events: Map<FactionId, ReportEvent[]>,
): void {
  const power = powerOf(state, faction);
  if (contactWith(power, other) || faction === other) return;
  const talk = sharesTongue(faction, other);
  power.contacts.push({
    faction: other,
    stage: talk ? 'talk' : 'words',
    since: state.turn,
    words: talk ? RULES.contact.wordsToTalk : 0,
  });
  events
    .get(faction)
    ?.push({ kind: 'contact', faction: other, stage: talk ? 'talk' : 'words', first: true, system: at });
}

/**
 * The turn's contact (§19.1), as it ends: each power hears the powers it sees for the first time,
 * and its words with the others grow; the report says when contact begins and when talk comes.
 */
export function resolveContacts(world: World, state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  const r = RULES.contact;
  for (const power of state.powers) {
    const watched = watchedSystems(world, state, power.faction);
    const translation = translationOf(state, power.faction);
    for (const other of state.powers) {
      if (other.faction === power.faction) continue;
      const at = seenAt(state, power.faction, other.faction, watched);
      const contact = contactWith(power, other.faction);
      if (!contact) {
        if (at !== null) hear(state, power.faction, other.faction, at, events);
        continue;
      }
      if (contact.stage !== 'words') continue;
      contact.words = Math.min(r.wordsToTalk, contact.words + (at !== null ? r.wordsSeen : 0) + translation);
      if (contact.words < r.wordsToTalk) continue;
      contact.stage = 'talk';
      events
        .get(power.faction)
        ?.push({ kind: 'contact', faction: other.faction, stage: 'talk', first: false, system: null });
    }
  }
}
