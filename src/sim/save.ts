// Saves as files (§11): a game exported to a JSON file the player keeps or moves to another device,
// and read back by Import. Adapted from Starman Reborn's src/app/save/saveFile.ts at ba4ef73 (D-10).
// The same envelope holds the autosave and the slots in storage (src/app/saves.ts).
//
// The world is never saved: it is rebuilt from the dataset, so a save is small.

import { type GameState, STATE_VERSION } from './state.ts';
import { shapeProblems, stateProblems } from './validate.ts';
import type { World } from './world.ts';

export const SAVE_FORMAT = 'starman-control-save';

/** Version of the envelope (not of the game inside it). */
export const SAVE_VERSION = 1;

/** Larger files are refused unread: a save is a few kilobytes. */
export const SAVE_MAX_BYTES = 2 * 1024 * 1024;

export interface SaveEnvelope {
  format: typeof SAVE_FORMAT;
  version: typeof SAVE_VERSION;
  /** ISO time it was written. */
  savedAt: string;
  game: GameState;
}

/** A save that cannot be loaded. The message is written for the player. */
export class SaveError extends Error {}

export function envelope(game: GameState, now: Date): SaveEnvelope {
  return { format: SAVE_FORMAT, version: SAVE_VERSION, savedAt: now.toISOString(), game };
}

/** `starman-control-2026-10-19.json` (the local date), or `…-slot-2.json` for a slot. */
export function saveFileName(now: Date, slot?: number): string {
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `starman-control-${date}${slot ? `-slot-${slot}` : ''}.json`;
}

/** The export file for a game: its name and its text. */
export function exportSave(game: GameState, now = new Date(), slot?: number): { name: string; json: string } {
  return { name: saveFileName(now, slot), json: JSON.stringify(envelope(game, now)) };
}

const NEWER = 'This save was made by a newer version of the game. Reload the page to update the game, then try again.';

/**
 * Brings an older game up to the current shape. Each step takes one version to the next; there are
 * none yet, since version 1 is the first shape a player could save.
 */
const MIGRATIONS: Record<number, (game: Record<string, unknown>) => Record<string, unknown>> = {};

function migrate(game: Record<string, unknown>): Record<string, unknown> {
  let g = game;
  while ((g.version as number) < STATE_VERSION) {
    const step = MIGRATIONS[g.version as number];
    if (!step) throw new SaveError(`This save is damaged: version ${String(g.version)} cannot be updated.`);
    g = step(g);
  }
  return g;
}

/** A stored or imported envelope, checked and brought up to date. Throws SaveError for anything else. */
export function readEnvelope(world: World, raw: unknown): { game: GameState; savedAt: string } {
  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);
  if (!isRecord(raw) || raw.format !== SAVE_FORMAT) throw new SaveError('This is not a Starman Control save.');
  if (typeof raw.version !== 'number' || !Number.isInteger(raw.version) || raw.version < 1)
    throw new SaveError('This save is damaged: its version is missing.');
  if (raw.version > SAVE_VERSION) throw new SaveError(NEWER);
  if (!isRecord(raw.game)) throw new SaveError('This save is damaged: it holds no game.');
  const version = raw.game.version;
  if (typeof version === 'number' && version > STATE_VERSION) throw new SaveError(NEWER);
  const shape = shapeProblems(raw.game);
  if (shape.some((p) => p.startsWith('version'))) throw new SaveError('This save is damaged: its game has no version.');
  const game = migrate(structuredClone(raw.game));
  const problems = [...shapeProblems(game)];
  if (problems.length === 0) problems.push(...stateProblems(world, game as unknown as GameState));
  if (problems.length > 0) throw new SaveError(`This save is damaged and cannot be loaded (${problems[0]}).`);
  return { game: game as unknown as GameState, savedAt: typeof raw.savedAt === 'string' ? raw.savedAt : '' };
}

/** Reads an exported file back into a current, checked game. Throws SaveError with a message for the player. */
export function parseSave(world: World, text: string): GameState {
  if (text.length > SAVE_MAX_BYTES) throw new SaveError('This file is too large to be a Starman Control save.');
  let raw: unknown;
  try {
    // Some editors put a byte-order mark in front of the text.
    raw = JSON.parse(text.replace(/^﻿/, ''));
  } catch {
    throw new SaveError('This file could not be read. Choose a save exported from Starman Control (a .json file).');
  }
  return readEnvelope(world, raw).game;
}
