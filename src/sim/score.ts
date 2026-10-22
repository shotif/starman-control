// The score (M2B_SCIENCE.md §20.3, D-50): every power's progress in one number, the victory at the
// turn limit (M4_FLEETS.md §30.1): 10 for each colony, 1 for each million people, 5 for each
// technology, 3 for each lane and 50 for each great work, and its works, a point for every 100
// research points and 200 industry it has made in the game (§31.4). A rival's as far as the viewer
// can see it. Pure and in whole numbers.

import type { FactionId } from '../content/factions.ts';
import { GREAT_WORKS } from '../content/projects.ts';
import { RULES } from '../content/rules.ts';
import { keysHeld } from './keys.ts';
import { type GameState, inContact, powerOf } from './state.ts';

/** A power's score, with its parts. */
export interface Score {
  total: number;
  colonies: number;
  /** Whole millions. */
  millions: number;
  technologies: number;
  lanes: number;
  greatWorks: number;
  /** Points for what it has made in the game, research and industry (M4_FLEETS.md §31.4). */
  works: number;
  /** Points for the keys of the Absent it holds and the chapters it has excavated (M5_UNKNOWN.md §21, as built). */
  relics: number;
}

function scored(
  colonies: number,
  people: number,
  technologies: number,
  lanes: number,
  greatWorks: number,
  works: number,
  relics: number,
): Score {
  const s = RULES.score;
  const millions = Math.floor(people / 10);
  return {
    total:
      colonies * s.colony +
      Math.floor(millions / s.peoplePer) * s.millionPeople +
      technologies * s.technology +
      lanes * s.lane +
      greatWorks * s.greatWork +
      works +
      relics,
    colonies,
    millions,
    technologies,
    lanes,
    greatWorks,
    works,
    relics,
  };
}

/** A power's works: a point for every so many research points and industry it has made (§31.4). */
function worksOf(story: { research: number; industry: number }): number {
  const s = RULES.score;
  return (
    (s.researchPer > 0 ? Math.floor(story.research / s.researchPer) : 0) +
    (s.industryPer > 0 ? Math.floor(story.industry / s.industryPer) : 0)
  );
}

/**
 * A power's score from a state: in full from the whole state, or from a viewer's `knownView`, where
 * a rival's colonies, people and lanes are those the viewer sees, its great works are known to all,
 * and its technologies count once the viewer is in contact with it (M3_NEIGHBOURS.md §19.2).
 */
export function scoreOf(state: GameState, faction: FactionId, viewer: FactionId = faction): Score {
  const held = state.holdings.filter((h) => h.owner === faction);
  const knows = faction === viewer || inContact(powerOf(state, viewer), faction);
  return scored(
    held.filter((h) => h.kind === 'colony').length,
    held.reduce((n, h) => n + h.people, 0),
    knows ? powerOf(state, faction).researched.length : 0,
    state.lanes.filter((l) => l.owner === faction).length,
    held.reduce((n, h) => n + h.projects.filter((p) => GREAT_WORKS.includes(p)).length, 0),
    knows ? worksOf(powerOf(state, faction).story) : 0,
    keysHeld(state, faction).length * RULES.score.key +
      (knows ? powerOf(state, faction).chapters * RULES.score.chapter : 0),
  );
}

/** What the score counts (M2B_SCIENCE.md §20.3, M4_FLEETS.md §31.4, M5_UNKNOWN.md §21), from the rules. */
export function scoreWords(): string {
  const s = RULES.score;
  const people =
    s.peoplePer > 1
      ? `${s.millionPeople} for every ${s.peoplePer} million people`
      : `${s.millionPeople} for each million people`;
  const parts = [
    `${s.colony} for each colony`,
    people,
    `${s.technology} for each technology`,
    `${s.lane} for each lane`,
    `${s.greatWork} for each great work`,
    ...(s.key > 0 ? [`${s.key} for each key of the Absent held`] : []),
    ...(s.chapter > 0 ? [`${s.chapter} for each chapter excavated`] : []),
  ];
  const works = [
    s.researchPer > 0 ? `${s.researchPer} research` : '',
    s.industryPer > 0 ? `${s.industryPer} industry` : '',
  ].filter(Boolean);
  return (
    `The score counts ${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` +
    (works.length > 0 ? `, and a point for every ${works.join(' and every ')} made in the game` : '') +
    '; at the turn limit, the highest score wins.'
  );
}
