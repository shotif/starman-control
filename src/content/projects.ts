// What a colony can build (M1_FIRST_LIGHT.md §7, M1_COLONIES.md §3), as data. Ships come from
// ships.ts; projects are built once per colony. Costs are starting points for balancing in M2.

import type { SystemId } from '../data/types.ts';
import { ZONE_DEFS, type Zone } from './districts.ts';
import { SHIPS, type ShipType } from './ships.ts';
import type { TechId } from './techs.ts';

export type ProjectId =
  | 'shipyard'
  | 'lane-station'
  | 'mine'
  | 'survey-station'
  | 'hydroponics'
  | 'trade-exchange'
  | 'civic-centre'
  | 'recreation-dome'
  | 'research-institute'
  | 'fusion-plant'
  | 'refinery'
  | 'arcology'
  | 'medical-centre'
  | 'deep-space-scanner'
  | 'flare-shield'
  // M2b (M2B_SCIENCE.md §18.3).
  | 'lane-relay'
  | 'orbital-habitat'
  | 'terraforming-station'
  // M2b's great works (M2B_SCIENCE.md §20.2).
  | 'long-array'
  | 'lapse-archive'
  | 'lanewright-foundry'
  | 'commons';

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
  /** Credits a turn to keep it (M2_WORLDS.md §6). */
  upkeep: number;
  /** The technology that opens it; none for those open from the start. */
  opens?: TechId;
  /** Where it may be built: a colony (the default), an outpost, or either (M2B_SCIENCE.md §18.3). */
  where?: 'colony' | 'outpost' | 'either';
  /** A great work (§20.2): one in the whole neighbourhood, needing this technology besides `opens`. */
  great?: { needs: TechId };
}

export const PROJECTS: Record<ProjectId, ProjectDef> = {
  shipyard: {
    id: 'shipyard',
    name: 'Shipyard',
    does: 'Builds ships.',
    cost: { industry: 60, metals: 10, volatiles: 0, fuel: 0 },
    upkeep: 2,
  },
  'lane-station': {
    id: 'lane-station',
    name: 'Lane station',
    does: 'Five beacon slots here instead of three.',
    cost: { industry: 50, metals: 10, volatiles: 0, fuel: 10 },
    upkeep: 1,
  },
  mine: {
    id: 'mine',
    name: 'Deep mine',
    does: 'Each mine district here yields 1 more.',
    cost: { industry: 30, metals: 5, volatiles: 0, fuel: 0 },
    upkeep: 1,
  },
  'survey-station': {
    id: 'survey-station',
    name: 'Survey station',
    does: 'Surveys every system one open lane away, now and as lanes open.',
    cost: { industry: 40, metals: 5, volatiles: 0, fuel: 0 },
    upkeep: 1,
  },
  // M2's projects (M2_WORLDS.md §6, §23.1).
  hydroponics: {
    id: 'hydroponics',
    name: 'Hydroponics',
    does: '3 food a turn, on any world.',
    cost: { industry: 40, metals: 5, volatiles: 0, fuel: 0 },
    upkeep: 1,
  },
  'trade-exchange': {
    id: 'trade-exchange',
    name: 'Trade exchange',
    does: '3 credits a turn, and 1 more for each worked market district here. No upkeep.',
    cost: { industry: 50, metals: 0, volatiles: 0, fuel: 0 },
    upkeep: 0,
  },
  'civic-centre': {
    id: 'civic-centre',
    name: 'Civic centre',
    does: 'Approval +10 here, and +5 at your colonies within two lane jumps.',
    cost: { industry: 50, metals: 5, volatiles: 0, fuel: 0 },
    upkeep: 1,
  },
  'recreation-dome': {
    id: 'recreation-dome',
    name: 'Recreation dome',
    does: 'Approval +10 here.',
    cost: { industry: 40, metals: 0, volatiles: 5, fuel: 0 },
    upkeep: 1,
    opens: 'shared-spaces',
  },
  'research-institute': {
    id: 'research-institute',
    name: 'Research institute',
    does: '3 research a turn, and each worked lab here 1 more.',
    cost: { industry: 60, metals: 10, volatiles: 0, fuel: 0 },
    upkeep: 2,
    opens: 'computing',
  },
  'fusion-plant': {
    id: 'fusion-plant',
    name: 'Fusion plant',
    does: '4 industry a turn, burning 1 fusion fuel from the stockpile.',
    cost: { industry: 60, metals: 10, volatiles: 0, fuel: 0 },
    upkeep: 1,
    opens: 'fusion-power',
  },
  refinery: {
    id: 'refinery',
    name: 'Refinery',
    does: '2 fusion fuel a turn from 1 volatiles.',
    cost: { industry: 50, metals: 5, volatiles: 0, fuel: 0 },
    upkeep: 1,
    opens: 'fusion-power',
  },
  arcology: {
    id: 'arcology',
    name: 'Arcology',
    does: 'Room for 4 million more people.',
    cost: { industry: 80, metals: 15, volatiles: 0, fuel: 0 },
    upkeep: 1,
    opens: 'arcologies',
  },
  'medical-centre': {
    id: 'medical-centre',
    name: 'Medical centre',
    does: 'The colony grows 25% faster.',
    cost: { industry: 50, metals: 0, volatiles: 5, fuel: 0 },
    upkeep: 1,
    opens: 'medicine',
  },
  // Increment 24 (M2_WORLDS.md §26.3).
  'deep-space-scanner': {
    id: 'deep-space-scanner',
    name: 'Deep-space scanner',
    does: 'Shows other powers’ ships within 8 light-years.',
    cost: { industry: 40, metals: 5, volatiles: 0, fuel: 0 },
    upkeep: 1,
    opens: 'long-baseline-arrays',
  },
  // Increment 25 (M2_WORLDS.md §27.5).
  'flare-shield': {
    id: 'flare-shield',
    name: 'Flare shield',
    does: 'Its star’s flares do no harm here. Only on a world exposed to them.',
    cost: { industry: 40, metals: 10, volatiles: 0, fuel: 0 },
    upkeep: 1,
    opens: 'magnetics',
  },
  // M2b (M2B_SCIENCE.md §18.3).
  'lane-relay': {
    id: 'lane-relay',
    name: 'Lane relay',
    does: 'Two more beacon slots in its system. At a colony or an outpost.',
    cost: { industry: 80, metals: 10, volatiles: 0, fuel: 10 },
    upkeep: 1,
    opens: 'lane-relays',
    where: 'either',
  },
  'orbital-habitat': {
    id: 'orbital-habitat',
    name: 'Orbital habitat',
    does: 'The outpost becomes a colony in orbit: 1 million settlers, room for 2 million, 2 districts of its own, on any world.',
    cost: { industry: 100, metals: 20, volatiles: 10, fuel: 0 },
    upkeep: 2,
    opens: 'orbital-habitats',
    where: 'outpost',
  },
  'terraforming-station': {
    id: 'terraforming-station',
    name: 'Terraforming station',
    does: 'Its world becomes one step more habitable after 10 turns. On a harsh or tolerable world.',
    cost: { industry: 120, metals: 10, volatiles: 20, fuel: 0 },
    upkeep: 2,
    opens: 'terraforming',
  },
  // M2b's great works (M2B_SCIENCE.md §20.2), all fiction: one of each in the whole neighbourhood.
  'long-array': {
    id: 'long-array',
    name: 'Long Array',
    does: 'A great work: sees every ship within 20 ly of where it stands, and observations give twice the research.',
    cost: { industry: 400, metals: 40, volatiles: 0, fuel: 0 },
    upkeep: 3,
    opens: 'great-engineering',
    great: { needs: 'interferometry' },
  },
  'lapse-archive': {
    id: 'lapse-archive',
    name: 'Lapse Archive',
    does: 'A great work: research +20%.',
    cost: { industry: 400, metals: 40, volatiles: 0, fuel: 0 },
    upkeep: 3,
    opens: 'great-engineering',
    great: { needs: 'public-schooling' },
  },
  'lanewright-foundry': {
    id: 'lanewright-foundry',
    name: 'Lanewright Foundry',
    does: 'A great work: lanes cost half.',
    cost: { industry: 400, metals: 40, volatiles: 0, fuel: 0 },
    upkeep: 3,
    opens: 'great-engineering',
    great: { needs: 'lane-relays' },
  },
  commons: {
    id: 'commons',
    name: 'Commons',
    does: 'A great work: approval +5 and growth +10% at every colony.',
    cost: { industry: 400, metals: 40, volatiles: 0, fuel: 0 },
    upkeep: 3,
    opens: 'great-engineering',
    great: { needs: 'gene-tailoring' },
  },
};

/** The great works (M2B_SCIENCE.md §20.2). */
export const GREAT_WORKS = (Object.keys(PROJECTS) as ProjectId[]).filter((id) => PROJECTS[id].great);

export const PROJECT_IDS = Object.keys(PROJECTS) as ProjectId[];

/**
 * A ship or a project: what costs the same wherever it is built. A warship names its design
 * (M4_FLEETS.md §21.3), whose modules add to its hull's cost.
 */
export type BuildItem = { kind: 'ship'; ship: ShipType; design?: number } | { kind: 'project'; project: ProjectId };

/** A warship refitted to another design of its hull, at a shipyard where it is (M4_FLEETS.md §21.4). */
export type RefitItem = { kind: 'refit'; ship: number; design: number };

/** A lane from the holding's system to another star, new or relit (M1_LANES_RESEARCH.md §1). */
export type LaneItem = { kind: 'lane'; to: SystemId };

/** Zoning a district (M2_WORLDS.md §2): the open district in `slot`, or rezoning the one there. */
export type ZoneItem = { kind: 'zone'; zone: Zone; slot: number };

/** What a colony or outpost has queued; a governor's own items say so (M2_WORLDS.md §25.1). */
export type QueueItem = (BuildItem | LaneItem | ZoneItem | RefitItem) & { governor?: true };

/**
 * The base cost of a ship's hull or a project; src/sim/economy.ts's costOf gives any item's actual
 * cost, with a warship's modules.
 */
export function itemCost(item: BuildItem): Cost {
  if (item.kind === 'project') return PROJECTS[item.project].cost;
  const c = SHIPS[item.ship].cost;
  return { industry: c.industry, metals: c.metals, volatiles: c.volatiles, fuel: 0 };
}

/** "a survey ship", "an arcology", "hydroponics": a thing's name with the article English gives it. */
export function withArticle(name: string): string {
  if (name.endsWith('ics')) return name;
  return /^[aeiou]/i.test(name) ? `an ${name}` : `a ${name}`;
}

/** A project in words, with its article: "a deep mine", "hydroponics", "the Lapse Archive" (a great work, §20.2). */
export function projectWords(id: ProjectId): string {
  const def = PROJECTS[id];
  return def.great ? `the ${def.name}` : withArticle(def.name.toLowerCase());
}

/** An item's name; a warship's design or a refit is named by src/sim/designs.ts's `queueName`. */
export function itemName(item: QueueItem): string {
  if (item.kind === 'zone') return `${ZONE_DEFS[item.zone].name} district`;
  if (item.kind === 'refit') return 'Refit';
  return item.kind === 'lane' ? 'Lane' : item.kind === 'project' ? PROJECTS[item.project].name : SHIPS[item.ship].name;
}
