// Saves as files (§11): a game exported to a JSON file the player keeps or moves to another device,
// and read back by Import. Adapted from Starman Reborn's src/app/save/saveFile.ts at ba4ef73 (D-10).
// The same envelope holds the autosave and the slots in storage (src/app/saves.ts).
//
// The world is never saved: it is rebuilt from the dataset, so a save is small.

import { FACTIONS, type FactionId, isFactionId } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import { sharesTongue } from './contact.ts';
import { startZoning } from './economy.ts';
import { capitalHolding, type GameState, type Holding, STATE_VERSION } from './state.ts';
import { shapeProblems, stateProblems } from './validate.ts';
import { laneEnds, type World } from './world.ts';

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

type Raw = Record<string, unknown>;

const DAMAGED = 'This save is damaged and cannot be loaded.';

/** Brings an older game up to the current shape. Each step takes one version to the next. */
const MIGRATIONS: Record<number, (game: Raw) => Raw> = {
  /**
   * 1 → 2 (M1 increment 5): colonies and outposts. Each power gains its capital colony (with the
   * shipyard and lane station it always had), lane stations move from the power to its holdings,
   * and ships can be founding a holding.
   */
  1: (g) => {
    if (!Array.isArray(g.powers) || !Array.isArray(g.ships)) throw new SaveError(DAMAGED);
    const powers = (g.powers as Raw[]).map(({ laneStations: _, ...p }) => p);
    const holdings = powers
      .filter((p) => isFactionId(p.faction))
      .map((p, i) => ({ id: i + 1, ...capitalHolding(p.faction as Parameters<typeof capitalHolding>[0]) }));
    const ships = (g.ships as Raw[]).map((s) => ({ ...s, founding: null }));
    return { ...g, version: 2, powers, ships, holdings, nextHoldingId: holdings.length + 1 };
  },
  /**
   * 2 → 3 (D-24): the Cooperative's and the Wake's capitals, which stood on no world, move onto
   * Tau Ceti e and Wolf 1061 c. A colony or outpost the same power had founded on that world is
   * folded into the capital (its people join, up to the capital's room; its projects, queue and
   * industry are kept); a ship about to found there stops.
   */
  2: (g) => {
    if (!Array.isArray(g.holdings) || !Array.isArray(g.ships)) throw new SaveError(DAMAGED);
    let holdings = g.holdings as Raw[];
    const taken = new Set<string>();
    for (const cap of holdings) {
      if (cap.capital !== true || cap.body !== null || !isFactionId(cap.owner)) continue;
      const body = FACTIONS[cap.owner].capital.bodyId;
      const there = holdings.filter((h) => h !== cap && h.body === body);
      const projects = new Set(cap.projects as string[]);
      const queue = [...(cap.queue as Raw[])];
      let people = cap.people as number;
      let industry = cap.industry as number;
      for (const h of there) {
        if (h.owner !== cap.owner) continue;
        people = Math.min(RULES.capital.capacity, people + (h.people as number));
        industry += h.industry as number;
        for (const p of h.projects as string[]) projects.add(p);
        for (const item of h.queue as Raw[]) {
          const dup =
            item.kind === 'project' &&
            (projects.has(item.project as string) || queue.some((q) => q.project === item.project));
          if (!dup) queue.push(item);
        }
      }
      Object.assign(cap, { body, people, industry, projects: [...projects], queue });
      holdings = holdings.filter((h) => !there.includes(h));
      taken.add(body);
    }
    const ships = (g.ships as Raw[]).map((s) =>
      taken.has((s.founding as Raw | null)?.body as string) ? { ...s, founding: null } : s,
    );
    return { ...g, version: 3, holdings, ships };
  },
  /** 3 → 4 (M1 increment 6a): lanes can be built and relit. Nothing saved before changes shape. */
  3: (g) => ({ ...g, version: 4 }),
  /** 4 → 5 (M1 increment 6b): research. Every power starts with nothing researched. */
  4: (g) => {
    if (!Array.isArray(g.powers)) throw new SaveError(DAMAGED);
    const powers = (g.powers as Raw[]).map((p) => ({ ...p, researched: [], researchQueue: [], techProgress: {} }));
    return { ...g, version: 5, powers };
  },
  /**
   * 6 → 7 (M2 increment 20): districts, food, credits and approval. Each capital is zoned as every
   * capital starts; every other colony is zoned for its people as a balanced governor would
   * (`startZoning`); the mine project becomes the deep mine; every power gets the starting food
   * store and treasury, at standard taxes; no colony is hungry or overdriven.
   */
  6: (g) => {
    if (!Array.isArray(g.powers) || !Array.isArray(g.holdings)) throw new SaveError(DAMAGED);
    const powers = (g.powers as Raw[]).map((p) => ({
      ...p,
      food: RULES.food.start,
      treasury: RULES.credits.start,
      taxes: 'standard',
    }));
    const holdings = (g.holdings as Raw[]).map((h) => ({
      ...h,
      districts: h.kind !== 'colony' ? [] : h.capital === true ? capitalHolding(h.owner as FactionId).districts : null,
      hungry: 0,
      overdrive: 0,
    }));
    return { ...g, version: 7, powers, holdings };
  },
  /**
   * 7 → 8 (M2 increment 23): governors and edicts. No colony is governed and nothing is locked;
   * every power has its starting attention, no edicts, and its new colonies go ungoverned.
   */
  7: (g) => {
    if (!Array.isArray(g.powers) || !Array.isArray(g.holdings)) throw new SaveError(DAMAGED);
    const powers = (g.powers as Raw[]).map((p) => ({
      ...p,
      attention: RULES.attention.start,
      edicts: [],
      governNew: false,
    }));
    const holdings = (g.holdings as Raw[]).map((h) => ({ ...h, governor: null, locked: [] }));
    return { ...g, version: 8, powers, holdings };
  },
  /** 8 → 9 (M2 increment 25): events. None waiting, none come before, nothing lasting. */
  8: (g) => {
    if (!Array.isArray(g.powers)) throw new SaveError(DAMAGED);
    const powers = (g.powers as Raw[]).map((p) => ({ ...p, event: null, lastEvent: 0, lasting: [] }));
    return { ...g, version: 9, powers };
  },
  /** 9 → 10 (M2b increment 29): discoveries. No inspiration had yet; deeds already done pay on the next turn. */
  9: (g) => {
    if (!Array.isArray(g.powers)) throw new SaveError(DAMAGED);
    const powers = (g.powers as Raw[]).map((p) => ({ ...p, inspired: [] }));
    return { ...g, version: 10, powers };
  },
  /** 10 → 11 (M2b increment 30): terraforming. No colony has worked a terraforming station yet. */
  10: (g) => {
    if (!Array.isArray(g.holdings)) throw new SaveError(DAMAGED);
    const holdings = (g.holdings as Raw[]).map((h) => ({ ...h, terraform: 0 }));
    return { ...g, version: 11, holdings };
  },
  /**
   * 11 → 12 (M3 increment 34): contact. Each power is in contact with those M2b counted as met (a
   * colony, outpost or lane of theirs in a system it has surveyed), from this turn; at talk if they
   * share a tongue, at the first words if not.
   */
  11: (g) => {
    if (!Array.isArray(g.powers) || !Array.isArray(g.holdings) || !Array.isArray(g.lanes)) throw new SaveError(DAMAGED);
    const holdings = g.holdings as Raw[];
    const lanes = g.lanes as Raw[];
    const powers = (g.powers as Raw[]).map((p) => {
      const surveyed = new Set(Array.isArray(p.surveyed) ? (p.surveyed as string[]) : []);
      const met = (g.powers as Raw[])
        .map((q) => q.faction as FactionId)
        .filter(
          (f) =>
            f !== p.faction &&
            (holdings.some((h) => h.owner === f && surveyed.has(h.system as string)) ||
              lanes.some((l) => l.owner === f && laneEnds(l.id as string).some((end) => surveyed.has(end)))),
        );
      const contacts = met.map((f) => {
        const talk = isFactionId(p.faction) && isFactionId(f) && sharesTongue(p.faction, f);
        return {
          faction: f,
          stage: talk ? 'talk' : 'words',
          since: g.turn,
          words: talk ? RULES.contact.wordsToTalk : 0,
        };
      });
      return { ...p, contacts };
    });
    return { ...g, version: 12, powers };
  },
  /** 12 → 13 (M3 increment 35): memory. Nothing remembered yet, and no gift on its way. */
  12: (g) => {
    if (!Array.isArray(g.powers)) throw new SaveError(DAMAGED);
    const powers = (g.powers as Raw[]).map((p) => ({ ...p, memories: [], gifts: [] }));
    return { ...g, version: 13, powers };
  },
  /** 13 → 14 (M3 increment 36): treaties. None held, and no offer made. */
  13: (g) => ({ ...g, version: 14, treaties: [], offers: [] }),
  /** 5 → 6 (M1 increment 6c): anomalies. Nothing investigated yet; no ship investigating. */
  5: (g) => {
    if (!Array.isArray(g.powers) || !Array.isArray(g.ships)) throw new SaveError(DAMAGED);
    const powers = (g.powers as Raw[]).map((p) => ({ ...p, investigated: [] }));
    const ships = (g.ships as Raw[]).map((s) => ({ ...s, investigating: null }));
    return { ...g, version: 6, powers, ships };
  },
};

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
  let game: Record<string, unknown>;
  try {
    game = migrate(structuredClone(raw.game));
  } catch (e) {
    if (e instanceof SaveError) throw e;
    throw new SaveError(DAMAGED);
  }
  // Colonies from before M2 are zoned now that the world is to hand (migration 6 → 7).
  if (Array.isArray(game.holdings))
    for (const h of game.holdings as Raw[])
      if (h.districts === null) h.districts = startZoning(world, game as unknown as GameState, h as unknown as Holding);
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
