// The game being played, for the screens: the state as a signal, orders given at once, turns ended
// in the worker, and the game saved after every turn and every order (§11).

import { computed, signal } from '@preact/signals';
import type { FactionId } from '../content/factions.ts';
import { needsOf } from '../sim/needs.ts';
import { applyOrder, type Order } from '../sim/orders.ts';
import { randomSeed } from '../sim/rng.ts';
import { type GameState, newGame, playerPower } from '../sim/state.ts';
import { SaveStore } from './saves.ts';
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

export async function startGame(faction: FactionId, seed?: number): Promise<void> {
  const state = newGame(world, { seed: seed ?? randomSeed(), powers: [{ faction, controller: 'player' }] });
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
