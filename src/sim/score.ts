// The score (M2B_SCIENCE.md §20.3, D-50): every power's progress in one number, with no victory yet:
// 10 for each colony, 1 for each million people, 5 for each technology, 3 for each lane and 50 for
// each great work. A rival's as far as the viewer can see it. Pure and in whole numbers.

import type { FactionId } from '../content/factions.ts';
import { GREAT_WORKS } from '../content/projects.ts';
import { RULES } from '../content/rules.ts';
import { hasMet } from './research.ts';
import { type GameState, powerOf } from './state.ts';

/** A power's score, with its parts. */
export interface Score {
  total: number;
  colonies: number;
  /** Whole millions. */
  millions: number;
  technologies: number;
  lanes: number;
  greatWorks: number;
}

function scored(colonies: number, people: number, technologies: number, lanes: number, greatWorks: number): Score {
  const s = RULES.score;
  const millions = Math.floor(people / 10);
  return {
    total:
      colonies * s.colony +
      millions * s.millionPeople +
      technologies * s.technology +
      lanes * s.lane +
      greatWorks * s.greatWork,
    colonies,
    millions,
    technologies,
    lanes,
    greatWorks,
  };
}

/**
 * A power's score from a state: in full from the whole state, or from a viewer's `knownView`, where
 * a rival's colonies, people and lanes are those the viewer sees, its great works are known to all,
 * and its technologies count once the viewer has met it.
 */
export function scoreOf(state: GameState, faction: FactionId, viewer: FactionId = faction): Score {
  const held = state.holdings.filter((h) => h.owner === faction);
  const knows = faction === viewer || hasMet(state, powerOf(state, viewer), faction);
  return scored(
    held.filter((h) => h.kind === 'colony').length,
    held.reduce((n, h) => n + h.people, 0),
    knows ? powerOf(state, faction).researched.length : 0,
    state.lanes.filter((l) => l.owner === faction).length,
    held.reduce((n, h) => n + h.projects.filter((p) => GREAT_WORKS.includes(p)).length, 0),
  );
}
