// The guided opening (M2_WORLDS.md §12, §28, D-40): which step a game is on, kept on the device
// as the settings are, and when each step is done. Each step is done by doing it, worked out from
// the game and from what the player has opened; nothing here gives an order.

import { signal } from '@preact/signals';
import type { FactionId } from '../content/factions.ts';
import { GUIDE_STEPS, type GuideStep, type GuideStepId } from '../content/guide.ts';
import { STARTING_FLEET } from '../content/ships.ts';
import { type GameState, powerOf } from '../sim/state.ts';

/** What the player has opened, which the game itself does not record. */
export interface GuideFlags {
  capitalOpened: boolean;
  empireOpened: boolean;
  /** Steps skipped, or closed (the last). */
  skipped: GuideStepId[];
}

export interface GuideStore {
  /** Guiding the game named by `game`. */
  on: boolean;
  /** `seed:faction` of the game it guides. */
  game: string | null;
  flags: GuideFlags;
  /** A guide has been finished or stopped once: later games are not guided unless asked. */
  done: boolean;
}

const KEY = 'starman-control:guide';
const FRESH: GuideFlags = { capitalOpened: false, empireOpened: false, skipped: [] };
const EMPTY: GuideStore = { on: false, game: null, flags: FRESH, done: false };

/** A game's name for the guide. */
export function guideGameId(game: GameState, faction: FactionId): string {
  return `${game.seed}:${faction}`;
}

/** Whether a step is done in a game, from the game and what the player opened. */
export function stepDone(id: GuideStepId, game: GameState, faction: FactionId, flags: GuideFlags): boolean {
  if (flags.skipped.includes(id)) return true;
  const power = powerOf(game, faction);
  const mine = game.holdings.filter((h) => h.owner === faction);
  const ships = game.ships.filter((s) => s.owner === faction);
  switch (id) {
    case 'capital':
      return flags.capitalOpened;
    case 'queue':
      return mine.some((h) => h.kind === 'colony' && h.queue.length > 0);
    case 'survey':
      return (
        power.surveyed.length > 1 ||
        !ships.some((s) => s.type === 'survey') ||
        ships.some((s) => s.type === 'survey' && (s.destinations.length > 0 || s.blindJump || s.investigating))
      );
    case 'research':
      return power.researchQueue.length > 0 || power.researched.length > 0;
    case 'taxes':
      return flags.empireOpened;
    case 'end-turn':
      return game.turn > 1;
    case 'colony-ship':
      return !ships.some((s) => s.type === 'colony' && s.destinations.length === 0 && !s.founding);
    case 'ship':
      return power.shipsBuilt > STARTING_FLEET.length || mine.some((h) => h.queue.some((q) => q.kind === 'ship'));
    case 'lane':
      return (
        mine.some((h) => h.queue.some((q) => q.kind === 'lane')) ||
        game.lanes.some((l) => l.owner === faction && l.status === 'building')
      );
    case 'governor':
      return mine.some((h) => h.kind === 'colony' && h.governor !== null);
    case 'watch':
      return false;
  }
}

/** Whether a step can be shown yet: the governor waits for a second colony, the Watch for a rival. */
export function stepReady(id: GuideStepId, game: GameState, faction: FactionId, flags: GuideFlags): boolean {
  if (id === 'governor') return game.holdings.some((h) => h.owner === faction && h.kind === 'colony' && !h.capital);
  if (id === 'watch') {
    if (game.powers.length === 1) return stepDone('governor', game, faction, flags);
    const report = game.reports.find((r) => r.faction === faction);
    return (
      report?.events.some((e) => e.kind === 'rival-founded' || e.kind === 'rival-lane' || e.kind === 'rival-ship') ??
      false
    );
  }
  return true;
}

/**
 * The step to show: the first not done, in order; the governor's and the Watch's only once they
 * are ready (either may come first). Null when there is nothing to show now, or nothing left.
 */
export function currentStep(game: GameState, faction: FactionId, flags: GuideFlags): GuideStep | null {
  for (const step of GUIDE_STEPS) {
    if (stepDone(step.id, game, faction, flags)) continue;
    if (stepReady(step.id, game, faction, flags)) return step;
    if (step.id !== 'governor' && step.id !== 'watch') return null;
  }
  return null;
}

/** Every step done or skipped: the guide has finished. */
export function guideFinished(game: GameState, faction: FactionId, flags: GuideFlags): boolean {
  return GUIDE_STEPS.every((s) => stepDone(s.id, game, faction, flags));
}

function load(): GuideStore {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<GuideStore> | null;
    if (!raw || typeof raw !== 'object') return { ...EMPTY };
    const f = (raw.flags ?? {}) as Partial<GuideFlags>;
    return {
      on: raw.on === true,
      game: typeof raw.game === 'string' ? raw.game : null,
      done: raw.done === true,
      flags: {
        capitalOpened: f.capitalOpened === true,
        empireOpened: f.empireOpened === true,
        skipped: Array.isArray(f.skipped) ? f.skipped.filter((s) => GUIDE_STEPS.some((g) => g.id === s)) : [],
      },
    };
  } catch {
    return { ...EMPTY };
  }
}

export const guide = signal<GuideStore>(load());

function save(next: GuideStore): void {
  guide.value = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private browsing: the guide still works for this visit.
  }
}

/** In the browser tests, guiding stays off unless the address asks for it (as music does). */
function testAllows(): boolean {
  if (typeof location === 'undefined') return true;
  const q = new URLSearchParams(location.search);
  return !q.has('test') || q.has('guide');
}

/**
 * A game begins or continues: a new game is guided while no guide has been finished or stopped; a
 * game continued keeps its place if it is the one guided, and any other is not guided.
 */
export function guideGame(id: string, fresh: boolean): void {
  const g = guide.value;
  if (!fresh) {
    if (g.game !== id) save({ ...g, on: false, game: id, flags: { ...FRESH } });
    return;
  }
  save({ on: !g.done && testAllows(), game: id, flags: { ...FRESH }, done: g.done });
}

export function setGuideFlag(flag: 'capitalOpened' | 'empireOpened'): void {
  const g = guide.value;
  if (!g.on || g.flags[flag]) return;
  save({ ...g, flags: { ...g.flags, [flag]: true } });
}

export function skipStep(id: GuideStepId): void {
  const g = guide.value;
  if (g.flags.skipped.includes(id)) return;
  save({ ...g, flags: { ...g.flags, skipped: [...g.flags.skipped, id] } });
}

/** The guide has finished, or *Stop guiding* was pressed: later games are not guided unless asked. */
export function stopGuide(): void {
  save({ ...guide.value, on: false, done: true });
}

/** *Guide me*: guide this game again, from its first step not done (skipped steps come back). */
export function guideMe(id: string): void {
  const g = guide.value;
  save({ on: true, game: id, done: g.done, flags: { ...(g.game === id ? g.flags : FRESH), skipped: [] } });
}
