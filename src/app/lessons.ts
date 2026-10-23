// Lessons when they matter (M6_ONE.md §20, D-80): when each lesson is due, worked out from the game
// as the guided opening's steps are, and which have been told, kept on this device beside the guide.
// Nothing here changes the game.

import { signal } from '@preact/signals';
import type { FactionId } from '../content/factions.ts';
import { LESSONS, type Lesson, type LessonId } from '../content/lessons.ts';
import { isHull } from '../content/ships.ts';
import { answerOf, arksWaiting, HEARTH } from '../sim/arks.ts';
import { approvalOf } from '../sim/economy.ts';
import { candidatesFor } from '../sim/leaders.ts';
import { knownSites } from '../sim/relics.ts';
import { type GameState, powerOf } from '../sim/state.ts';
import { enemiesOf } from '../sim/war.ts';
import type { World } from '../sim/world.ts';
import { settings } from './settings.ts';

/** Agents are told of only once the first years of settling and meeting are past. */
const AGENTS_FROM = 30;

/** Whether a lesson is due for a power in a game: what it teaches matters now. */
export function lessonDue(id: LessonId, world: World, game: GameState, faction: FactionId): boolean {
  const power = powerOf(game, faction);
  const mine = game.holdings.filter((h) => h.owner === faction);
  const talking = power.contacts.some((c) => c.stage === 'talk');
  switch (id) {
    case 'debt':
      return power.treasury < 0;
    case 'hunger':
      return mine.some((h) => h.hungry > 0);
    case 'unrest':
      return mine.some((h) => {
        if (h.kind !== 'colony') return false;
        const level = approvalOf(world, game, h).level;
        return level === 'unrest' || level === 'revolt';
      });
    case 'war':
      return enemiesOf(game, faction).length > 0;
    case 'raided': {
      const report = game.reports.find((r) => r.faction === faction);
      return report?.events.some((e) => e.kind === 'raided' && e.from === faction) ?? false;
    }
    case 'arks':
      return faction !== HEARTH && arksWaiting(game) && answerOf(game, faction) === null;
    case 'contact':
      return power.contacts.length > 0;
    case 'talk':
      return talking;
    case 'assembly':
      return game.assembly !== null;
    case 'warships':
      return (
        game.ships.some((s) => s.owner === faction && isHull(s.type)) ||
        mine.some((h) => h.queue.some((q) => q.kind === 'ship' && isHull(q.ship)))
      );
    case 'relic-site':
      return knownSites(world, game, faction).length > 0;
    case 'chapter':
      return game.digs.some((d) => d.by === faction && d.waiting !== null);
    case 'keys':
      return game.keys.length > 0;
    case 'leaders':
      return candidatesFor(game, faction).length > 0;
    case 'agents':
      return talking && game.turn >= AGENTS_FROM;
    case 'event':
      return power.event !== null && power.event.answer === null;
  }
}

/** The lesson to tell now: the first due and not yet told, in their order; null if none. */
export function currentLesson(
  world: World,
  game: GameState,
  faction: FactionId,
  told: readonly LessonId[],
): Lesson | null {
  for (const lesson of LESSONS) {
    if (told.includes(lesson.id)) continue;
    if (lessonDue(lesson.id, world, game, faction)) return lesson;
  }
  return null;
}

export interface LessonStore {
  /** The lessons told on this device, in the order told. */
  told: LessonId[];
}

const KEY = 'starman-control:lessons';

function load(): LessonStore {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<LessonStore> | null;
    const told = Array.isArray(raw?.told) ? raw.told : [];
    return { told: told.filter((id): id is LessonId => LESSONS.some((l) => l.id === id)) };
  } catch {
    return { told: [] };
  }
}

export const lessons = signal<LessonStore>(load());

function save(next: LessonStore): void {
  lessons.value = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private browsing: the lessons still work for this visit.
  }
}

/** *Got it*: a lesson told, for good on this device. */
export function tellLesson(id: LessonId): void {
  if (lessons.value.told.includes(id)) return;
  save({ told: [...lessons.value.told, id] });
}

/** *Tell me again*: every lesson forgotten, to be told again as each comes due. */
export function forgetLessons(): void {
  save({ told: [] });
}

/**
 * Whether lessons are told: with the guide on in the settings; in the browser tests only when the
 * address asks for them (`?test&lessons`), so no other journey meets a card.
 */
export function lessonsOn(): boolean {
  if (settings.value.guide !== 'on') return false;
  if (typeof location === 'undefined') return true;
  const q = new URLSearchParams(location.search);
  return !q.has('test') || q.has('lessons');
}
