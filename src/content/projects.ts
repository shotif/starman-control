// What a colony can build (M1_FIRST_LIGHT.md §7, M1_COLONIES.md §3), as data. Ships come from
// ships.ts; projects are built once per colony. Costs are starting points for balancing in M2.

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
    name: 'Mine',
    does: '1 more metals a turn.',
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

export type QueueItem = { kind: 'ship'; ship: ShipType } | { kind: 'project'; project: ProjectId };

export function itemCost(item: QueueItem): Cost {
  if (item.kind === 'project') return PROJECTS[item.project].cost;
  const c = SHIPS[item.ship].cost;
  return { industry: c.industry, metals: c.metals, volatiles: c.volatiles, fuel: 0 };
}

export function itemName(item: QueueItem): string {
  return item.kind === 'project' ? PROJECTS[item.project].name : SHIPS[item.ship].name;
}
