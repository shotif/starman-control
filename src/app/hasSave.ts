// Whether there is a game to continue, for the title, without loading the world or the rules
// (the title must stay small for a phone's first visit): a glance at the autosave's envelope,
// trusted only for the line under Continue. Loading it checks everything properly.

import { detectBackend } from './storage.ts';

export interface SaveGlance {
  /** The player's faction id, as saved; not checked against the factions. */
  faction: string | null;
  turn: number;
}

function glance(raw: unknown): SaveGlance | null {
  const game = (raw as { game?: { turn?: unknown; powers?: unknown } } | null)?.game;
  if (!game || typeof game.turn !== 'number') return null;
  const powers = Array.isArray(game.powers) ? (game.powers as { faction?: unknown; controller?: unknown }[]) : [];
  const player = powers.find((p) => p?.controller === 'player');
  return { faction: typeof player?.faction === 'string' ? player.faction : null, turn: game.turn };
}

/** The autosave (or its backup) at a glance: null when there is no game to continue. */
export async function savedGame(): Promise<SaveGlance | 'unreadable' | null> {
  try {
    const backend = await detectBackend();
    for (const key of ['save:auto', 'save:auto:backup']) {
      const raw = await backend.get(key);
      if (raw !== undefined) return glance(raw) ?? 'unreadable';
    }
    return null;
  } catch {
    return null;
  }
}

export async function hasSavedGame(): Promise<boolean> {
  return (await savedGame()) !== null;
}
