// Where games are kept in the browser (§11): an autosave every turn with the one before it kept as a
// backup, and three slots. Each record is a save envelope (src/sim/save.ts), checked when read.
// The slots follow Starman Reborn's src/app/save/slots.ts at ba4ef73 (D-10).

import type { FactionId } from '../content/factions.ts';
import { envelope, readEnvelope, SaveError } from '../sim/save.ts';
import type { GameState } from '../sim/state.ts';
import type { World } from '../sim/world.ts';
import type { SaveBackend } from './storage.ts';

export const SLOT_COUNT = 3;

const AUTO = 'save:auto';
const BACKUP = 'save:auto:backup';
const slotKey = (slot: number) => `save:slot:${slot}`;

export interface SaveSummary {
  /** The player's faction, if the game has a player. */
  faction: FactionId | null;
  turn: number;
  savedAt: string;
}

export interface SlotInfo {
  slot: number;
  empty: boolean;
  /** Null when empty or damaged. */
  summary: SaveSummary | null;
}

export function summarize(game: GameState, savedAt: string): SaveSummary {
  return { faction: game.powers.find((p) => p.controller === 'player')?.faction ?? null, turn: game.turn, savedAt };
}

function assertSlot(slot: number): void {
  if (!Number.isInteger(slot) || slot < 1 || slot > SLOT_COUNT) throw new RangeError(`No save slot ${slot}`);
}

export class SaveStore {
  private readonly backend: SaveBackend;
  private readonly world: World;

  constructor(backend: SaveBackend, world: World) {
    this.backend = backend;
    this.world = world;
  }

  /**
   * Saves the running game. At the end of a turn the previous autosave is kept as the backup;
   * saves between turns (after an order) leave the backup alone.
   */
  autosave(game: GameState, now = new Date(), keepBackup = true): Promise<void> {
    return this.backend.write({ [AUTO]: envelope(game, now) }, keepBackup ? { key: BACKUP, from: AUTO } : undefined);
  }

  /** Whether there is a game to continue, without reading it all. */
  async hasGame(): Promise<boolean> {
    return (await this.backend.get(AUTO)) !== undefined || (await this.backend.get(BACKUP)) !== undefined;
  }

  /** Forgets the running game (its slots are kept). */
  clearAutosave(): Promise<void> {
    return this.backend.remove([AUTO, BACKUP]);
  }

  /**
   * The game to continue: the autosave, or the backup when the autosave cannot be read.
   * Null when there is neither.
   */
  async continueGame(): Promise<{ game: GameState; savedAt: string; fromBackup: boolean } | null> {
    const auto = await this.backend.get(AUTO);
    if (auto !== undefined) {
      try {
        return { ...readEnvelope(this.world, auto), fromBackup: false };
      } catch (err) {
        if (!(err instanceof SaveError)) throw err;
      }
    }
    const backup = await this.backend.get(BACKUP);
    if (backup === undefined) return null;
    return { ...readEnvelope(this.world, backup), fromBackup: true };
  }

  /** What the autosave holds: null when there is none, or when it cannot be read. */
  async autoSummary(): Promise<SaveSummary | null> {
    try {
      const c = await this.continueGame();
      return c ? summarize(c.game, c.savedAt) : null;
    } catch {
      return null;
    }
  }

  async listSlots(): Promise<SlotInfo[]> {
    const out: SlotInfo[] = [];
    for (let slot = 1; slot <= SLOT_COUNT; slot++) {
      const raw = await this.backend.get(slotKey(slot));
      if (raw === undefined || raw === null) {
        out.push({ slot, empty: true, summary: null });
        continue;
      }
      try {
        const { game, savedAt } = readEnvelope(this.world, raw);
        out.push({ slot, empty: false, summary: summarize(game, savedAt) });
      } catch {
        out.push({ slot, empty: false, summary: null });
      }
    }
    return out;
  }

  async saveSlot(slot: number, game: GameState, now = new Date()): Promise<void> {
    assertSlot(slot);
    await this.backend.write({ [slotKey(slot)]: envelope(game, now) });
  }

  /** The game in a slot. Throws SaveError when the slot is empty or damaged. */
  async loadSlot(slot: number): Promise<GameState> {
    assertSlot(slot);
    const raw = await this.backend.get(slotKey(slot));
    if (raw === undefined || raw === null) throw new SaveError(`Slot ${slot} is empty.`);
    return readEnvelope(this.world, raw).game;
  }

  async clearSlot(slot: number): Promise<void> {
    assertSlot(slot);
    await this.backend.remove([slotKey(slot)]);
  }
}
