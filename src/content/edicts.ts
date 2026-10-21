// Governors' priorities and the edicts (M2_WORLDS.md §8, §25, D-15), as data. The numbers are
// starting points for balancing.

import type { Zone } from './districts.ts';
import type { ProjectId } from './projects.ts';

/** What a governor runs a colony for. */
export type Priority = 'grow' | 'produce' | 'research' | 'trade' | 'balance';

export const PRIORITIES: readonly Priority[] = ['balance', 'grow', 'produce', 'research', 'trade'];

export interface PriorityDef {
  name: string;
  does: string;
  /** The zones it gives open land, in turn (farms first while food is short, whatever the priority). */
  zones: readonly Zone[];
  /** The projects it builds when its queue is empty, first first. */
  projects: readonly ProjectId[];
}

export const PRIORITY_DEFS: Record<Priority, PriorityDef> = {
  balance: {
    name: 'Balance',
    does: 'Feeds the colony, then zones mines, works, labs and markets in turn.',
    zones: ['mines', 'works', 'labs', 'market', 'works'],
    projects: ['hydroponics', 'mine', 'research-institute', 'trade-exchange', 'terraforming-station'],
  },
  grow: {
    name: 'Grow',
    does: 'Farms and housing first, so the colony fills up, then works.',
    zones: ['farms', 'housing', 'works'],
    projects: ['hydroponics', 'medical-centre', 'arcology', 'terraforming-station'],
  },
  produce: {
    name: 'Produce',
    does: 'Works and mines, for industry and riches.',
    zones: ['works', 'mines', 'works'],
    projects: ['mine', 'fusion-plant', 'refinery'],
  },
  research: {
    name: 'Research',
    does: 'Labs, for research.',
    zones: ['labs'],
    projects: ['research-institute'],
  },
  trade: {
    name: 'Trade',
    does: 'Markets, for credits.',
    zones: ['market'],
    projects: ['trade-exchange'],
  },
};

/** Projects a governor builds first while a colony is less than content. */
export const CALMING: readonly ProjectId[] = ['civic-centre', 'recreation-dome'];

export type EdictId = 'festival' | 'labour-drive' | 'rationing' | 'crash-programme' | 'survey-drive' | 'martial-order';

export interface EdictDef {
  id: EdictId;
  name: string;
  /** Attention it costs. */
  cost: number;
  /** Turns it lasts. */
  turns: number;
  /** Whether it names a colony (rationing names one for its supply network). */
  target: 'colony' | 'power';
  does: string;
}

export const EDICTS: Record<EdictId, EdictDef> = {
  festival: {
    id: 'festival',
    name: 'Festival',
    cost: 2,
    turns: 4,
    target: 'colony',
    does: 'Approval +15 at a colony.',
  },
  'labour-drive': {
    id: 'labour-drive',
    name: 'Labour drive',
    cost: 1,
    turns: 3,
    target: 'colony',
    does: 'A colony’s industry +25%; approval −10 there.',
  },
  rationing: {
    id: 'rationing',
    name: 'Rationing',
    cost: 1,
    turns: 4,
    target: 'colony',
    does: 'The colonies of its supply network eat a quarter less; approval −10 there.',
  },
  'crash-programme': {
    id: 'crash-programme',
    name: 'Crash programme',
    cost: 2,
    turns: 3,
    target: 'power',
    does: 'Research +50%; industry −20% everywhere.',
  },
  'survey-drive': {
    id: 'survey-drive',
    name: 'Survey drive',
    cost: 1,
    turns: 3,
    target: 'power',
    does: 'Survey ships make 1 more jump point a turn.',
  },
  'martial-order': {
    id: 'martial-order',
    name: 'Martial order',
    cost: 2,
    turns: 3,
    target: 'colony',
    does: 'A colony in unrest or revolt yields as if content; approval −5 at every other colony.',
  },
};

export const EDICT_IDS = Object.keys(EDICTS) as EdictId[];

export function isEdictId(id: unknown): id is EdictId {
  return typeof id === 'string' && id in EDICTS;
}

export function isPriority(p: unknown): p is Priority {
  return typeof p === 'string' && (PRIORITIES as readonly string[]).includes(p);
}
