// What a colony can build (M1_FIRST_LIGHT.md §7, M1_COLONIES.md §3), as data. Ships come from
// ships.ts; projects are built once per colony. Costs are starting points for balancing in M2.

import type { SystemId } from '../data/types.ts';
import { ZONE_DEFS, type Zone } from './districts.ts';
import { SHIPS, type ShipType } from './ships.ts';

export type ProjectId = 'shipyard' | 'lane-station' | 'mine' | 'survey-station';

export interface Cost {
  industry: number;
  metals: number;
  volatiles: number;
  fuel: number;
}

export interface ProjectDef {
  id: ProjectId;
  name: string;
  does: string;
  cost: Cost;
}

export const PROJECTS: Record<ProjectId, ProjectDef> = {
  shipyard: {
    id: 'shipyard',
    name: 'Shipyard',
    does: 'Builds ships.',
    cost: { industry: 60, metals: 10, volatiles: 0, fuel: 0 },
  },
  'lane-station': {
    id: 'lane-station',
    name: 'Lane station',
    does: 'Five beacon slots here instead of three.',
    cost: { industry: 50, metals: 10, volatiles: 0, fuel: 10 },
  },
  mine: {
    id: 'mine',
    name: 'Deep mine',
    does: 'Each mine district here yields 1 more.',
    cost: { industry: 30, metals: 5, volatiles: 0, fuel: 0 },
  },
  'survey-station': {
    id: 'survey-station',
    name: 'Survey station',
    does: 'Surveys every system one open lane away, now and as lanes open.',
    cost: { industry: 40, metals: 5, volatiles: 0, fuel: 0 },
  },
};

export const PROJECT_IDS: readonly ProjectId[] = ['shipyard', 'lane-station', 'mine', 'survey-station'];

/** A ship or a project: what costs the same wherever it is built. */
export type BuildItem = { kind: 'ship'; ship: ShipType } | { kind: 'project'; project: ProjectId };

/** A lane from the holding's system to another star, new or relit (M1_LANES_RESEARCH.md §1). */
export type LaneItem = { kind: 'lane'; to: SystemId };

/** Zoning a district (M2_WORLDS.md §2): the open district in `slot`, or rezoning the one there. */
export type ZoneItem = { kind: 'zone'; zone: Zone; slot: number };

export type QueueItem = BuildItem | LaneItem | ZoneItem;

/** The base cost of a ship or project; src/sim/economy.ts's costOf gives any item's actual cost. */
export function itemCost(item: BuildItem): Cost {
  if (item.kind === 'project') return PROJECTS[item.project].cost;
  const c = SHIPS[item.ship].cost;
  return { industry: c.industry, metals: c.metals, volatiles: c.volatiles, fuel: 0 };
}

export function itemName(item: QueueItem): string {
  if (item.kind === 'zone') return `${ZONE_DEFS[item.zone].name} district`;
  return item.kind === 'lane' ? 'Lane' : item.kind === 'project' ? PROJECTS[item.project].name : SHIPS[item.ship].name;
}
