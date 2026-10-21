// The game being played, for the screens: the state as a signal, orders given at once, turns ended
// in the worker, and the game saved after every turn and every order (§11).

import { computed, signal } from '@preact/signals';
import { FACTION_IDS, type FactionId } from '../content/factions.ts';
import { needsOf } from '../sim/needs.ts';
import { applyOrder, type Order } from '../sim/orders.ts';
import { randomSeed } from '../sim/rng.ts';
import { exportSave, parseSave } from '../sim/save.ts';
import { type GameState, newGame, playerPower } from '../sim/state.ts';
import { knownView } from '../sim/visibility.ts';
import { SaveStore, type SaveSummary, type SlotInfo } from './saves.ts';
import { detectBackend } from './storage.ts';
import { endTurn } from './turns.ts';
import { world } from './world.ts';

export { world };

export const game = signal<GameState | null>(null);
/** True while a turn is being worked out. */
export const resolving = signal(false);
/** The report of the turn that just ended, until it is read. */
export const freshReport = signal(false);

export const player = computed(() => (game.value ? playerPower(game.value) : undefined));
/** The game as the player knows it (M2_WORLDS.md §26.3): what the screens show. Orders use the whole state. */
export const seen = computed(() =>
  game.value && player.value ? knownView(world, game.value, player.value.faction) : null,
);
export const needs = computed(() =>
  game.value && player.value ? needsOf(world, game.value, player.value.faction) : [],
);
export const report = computed(() => {
  const g = game.value;
  const p = player.value;
  return g && p ? g.reports.find((r) => r.faction === p.faction) : undefined;
});

let store: Promise<SaveStore> | null = null;
function saves(): Promise<SaveStore> {
  if (!store) store = detectBackend().then((b) => new SaveStore(b, world));
  return store;
}

let pendingSave: ReturnType<typeof setTimeout> | null = null;
function saveSoon(): void {
  if (pendingSave) clearTimeout(pendingSave);
  pendingSave = setTimeout(() => {
    pendingSave = null;
    const g = game.value;
    if (g) void saves().then((s) => s.autosave(g, new Date(), false));
  }, 400);
}

/**
 * A new game for a power, with the other two as rivals unless it plays alone (M2_WORLDS.md §26.1);
 * `governed` is the imperial start, with a governor for every colony (§25.1).
 */
export async function startGame(faction: FactionId, seed?: number, governed = false, alone = false): Promise<void> {
  const state = newGame(world, {
    seed: seed ?? randomSeed(),
    powers: FACTION_IDS.filter((f) => f === faction || !alone).map((f) =>
      f === faction ? { faction, controller: 'player', governed } : { faction: f, controller: 'ai' },
    ),
  });
  game.value = state;
  freshReport.value = false;
  await (await saves()).autosave(state);
}

/** Loads the saved game. False when there is none (or it cannot be read). */
export async function continueGame(): Promise<boolean> {
  try {
    const saved = await (await saves()).continueGame();
    if (!saved) return false;
    game.value = saved.game;
    freshReport.value = false;
    return true;
  } catch {
    return false;
  }
}

/** Gives an order for the player's power. Returns why it was refused, or null. */
export function giveOrder(order: Order): string | null {
  const g = game.value;
  const p = player.value;
  if (!g || !p) return 'There is no game.';
  const r = applyOrder(world, g, p.faction, order);
  if (!r.ok) return r.reason;
  game.value = r.state;
  saveSoon();
  return null;
}

export async function endTheTurn(): Promise<void> {
  const g = game.value;
  if (!g || resolving.value) return;
  resolving.value = true;
  try {
    const { state } = await endTurn(world, g);
    game.value = state;
    freshReport.value = true;
    if (pendingSave) {
      clearTimeout(pendingSave);
      pendingSave = null;
    }
    await (await saves()).autosave(state);
  } finally {
    resolving.value = false;
  }
}

/** Leaves the game for the title; it stays saved to continue. */
export async function leaveGame(): Promise<void> {
  const g = game.value;
  if (g) await (await saves()).autosave(g, new Date(), false);
  game.value = null;
}

// ---------------------------------------------------------------- the saves screen (M1_PROOF.md §2)

export async function listSaves(): Promise<{ auto: SaveSummary | null; slots: SlotInfo[] }> {
  const store = await saves();
  return { auto: await store.autoSummary(), slots: await store.listSlots() };
}

/** Saves the game being played to a slot. */
export async function saveToSlot(slot: number): Promise<void> {
  const g = game.value;
  if (g) await (await saves()).saveSlot(slot, g);
}

/** Loads a slot as the game being played (and the autosave). Throws SaveError when it cannot. */
export async function loadFromSlot(slot: number): Promise<void> {
  const store = await saves();
  const g = await store.loadSlot(slot);
  game.value = g;
  freshReport.value = false;
  await store.autosave(g);
}

export async function clearSlot(slot: number): Promise<void> {
  await (await saves()).clearSlot(slot);
}

/** A file of the autosave or a slot, to keep or move. Null when there is nothing there. */
export async function exportFile(slot: number | null): Promise<{ name: string; json: string } | null> {
  const store = await saves();
  if (slot === null) {
    const c = game.value ? { game: game.value } : await store.continueGame();
    return c ? exportSave(c.game) : null;
  }
  return exportSave(await store.loadSlot(slot), new Date(), slot);
}

/** Reads an exported file as the game being played (and the autosave). Throws SaveError when it cannot. */
export async function importFile(text: string): Promise<void> {
  const g = parseSave(world, text);
  game.value = g;
  freshReport.value = false;
  await (await saves()).autosave(g);
}
