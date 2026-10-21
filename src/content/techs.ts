// The M1 research tree (M1_FIRST_LIGHT.md §8, M1_LANES_RESEARCH.md §2), as data: each technology's
// field, cost in research points, what it needs first, and its effect, which the rules read. Every
// technology states its exact effect. The numbers are starting points for balancing in M2.

import type { Zone } from './districts.ts';
import type { ShipType } from './ships.ts';

export type FieldId = 'propulsion' | 'construction' | 'life-sciences' | 'society' | 'survey' | 'xenology';

export const FIELDS: readonly { id: FieldId; name: string }[] = [
  { id: 'propulsion', name: 'Propulsion' },
  { id: 'construction', name: 'Construction' },
  { id: 'life-sciences', name: 'Life Sciences' },
  { id: 'society', name: 'Society' },
  { id: 'survey', name: 'Survey' },
  { id: 'xenology', name: 'Xenology' },
];

export type TechId =
  | 'lane-engineering-1'
  | 'lane-engineering-2'
  | 'lane-engineering-3'
  | 'jump-tuning'
  | 'beacon-tuning'
  | 'habitat-domes'
  | 'automated-mining'
  | 'orbital-yards'
  | 'adaptation-1'
  | 'adaptation-2'
  | 'closed-ecologies'
  | 'colonial-charters'
  | 'deep-survey'
  | 'long-baseline-arrays'
  // M2 (M2_WORLDS.md §7, §23.2).
  | 'fusion-power'
  | 'lane-trade'
  | 'lane-trade-2'
  | 'automation'
  | 'automation-2'
  | 'deep-boring'
  | 'deep-boring-2'
  | 'arcologies'
  | 'soil-science'
  | 'soil-science-2'
  | 'medicine'
  | 'adaptation-3'
  | 'shared-spaces'
  | 'fair-taxation'
  | 'regional-administration'
  | 'computing'
  | 'computing-2'
  | 'long-range-sensors';

/** What a technology does. The rules read these; the interface shows `text`. */
export type TechEffect =
  /** Lane reach and blind-jump reach, in tenths of a light-year. */
  | { kind: 'reach'; deci: number }
  | { kind: 'jump-points'; points: number }
  /** Lanes cost this much less to build and relight, in percent. */
  | { kind: 'lane-discount'; percent: number }
  /** Colony ships may settle harsh worlds. */
  | { kind: 'settle-harsh' }
  /** Outposts yield this much more of their world's riches. */
  | { kind: 'outpost-yield'; amount: number }
  /** Ships cost this much less industry, in percent. */
  | { kind: 'ship-industry-discount'; percent: number }
  /** One kind of ship costs this much less of everything, in percent. */
  | { kind: 'ship-discount'; ship: ShipType; percent: number }
  /** Conditions cost the species this much less (never below 0). */
  | { kind: 'adaptation'; condition: 'temperature' | 'gravity'; values: readonly string[]; by: number }
  | { kind: 'growth-percent'; percent: number }
  /** Investigating an anomaly takes this many turns less (at least 1). */
  | { kind: 'investigation-turns'; turns: number }
  /** Survey stations survey this many lanes out. */
  | { kind: 'survey-station-lanes'; lanes: number }
  /** Opens projects (src/content/projects.ts names the technology each needs), and does nothing else. */
  | { kind: 'opens' }
  /** Each worked district of a zone yields this much more. */
  | { kind: 'zone-yield'; zone: Zone; amount: number }
  /** High taxes cost this much less approval. */
  | { kind: 'tax-relief'; approval: number }
  /** *Far from home* begins this many lane jumps later. */
  | { kind: 'near-jumps'; jumps: number }
  /** Survey ships make this many more jump points a turn. */
  | { kind: 'survey-jump-points'; points: number };

export interface TechDef {
  id: TechId;
  name: string;
  field: FieldId;
  /** Its row in the tree: 1 needs nothing, deeper rows need what is above them. */
  tier: number;
  /** Research points. */
  cost: number;
  needs: readonly TechId[];
  effect: TechEffect;
  /** Its exact effect, in plain words. */
  text: string;
}

export const TECHS: Record<TechId, TechDef> = {
  'lane-engineering-1': {
    id: 'lane-engineering-1',
    name: 'Lane engineering I',
    field: 'propulsion',
    tier: 1,
    cost: 30,
    needs: [],
    effect: { kind: 'reach', deci: 20 },
    text: 'Lane reach and blind-jump reach 8 ly, from 6.',
  },
  'lane-engineering-2': {
    id: 'lane-engineering-2',
    name: 'Lane engineering II',
    field: 'propulsion',
    tier: 2,
    cost: 60,
    needs: ['lane-engineering-1'],
    effect: { kind: 'reach', deci: 20 },
    text: 'Lane reach and blind-jump reach 10 ly.',
  },
  'lane-engineering-3': {
    id: 'lane-engineering-3',
    name: 'Lane engineering III',
    field: 'propulsion',
    tier: 3,
    cost: 100,
    needs: ['lane-engineering-2'],
    effect: { kind: 'reach', deci: 20 },
    text: 'Lane reach and blind-jump reach 12 ly.',
  },
  'jump-tuning': {
    id: 'jump-tuning',
    name: 'Jump tuning',
    field: 'propulsion',
    tier: 2,
    cost: 60,
    needs: ['lane-engineering-1'],
    effect: { kind: 'jump-points', points: 1 },
    text: 'Ships make 1 more jump point a turn.',
  },
  'beacon-tuning': {
    id: 'beacon-tuning',
    name: 'Beacon tuning',
    field: 'propulsion',
    tier: 2,
    cost: 60,
    needs: ['lane-engineering-1'],
    effect: { kind: 'lane-discount', percent: 25 },
    text: 'Lanes cost 25% less to build and relight.',
  },
  'habitat-domes': {
    id: 'habitat-domes',
    name: 'Habitat domes',
    field: 'construction',
    tier: 1,
    cost: 30,
    needs: [],
    effect: { kind: 'settle-harsh' },
    text: 'Colony ships can settle harsh worlds, with room for half their size.',
  },
  'automated-mining': {
    id: 'automated-mining',
    name: 'Automated mining',
    field: 'construction',
    tier: 1,
    cost: 30,
    needs: [],
    effect: { kind: 'outpost-yield', amount: 1 },
    text: 'Outposts yield 1 more of their world’s riches.',
  },
  'orbital-yards': {
    id: 'orbital-yards',
    name: 'Orbital yards',
    field: 'construction',
    tier: 2,
    cost: 60,
    needs: ['automated-mining'],
    effect: { kind: 'ship-industry-discount', percent: 20 },
    text: 'Ships cost 20% less industry.',
  },
  'adaptation-1': {
    id: 'adaptation-1',
    name: 'Adaptation I',
    field: 'life-sciences',
    tier: 1,
    cost: 30,
    needs: [],
    effect: { kind: 'adaptation', condition: 'temperature', values: ['frozen', 'cold'], by: 1 },
    text: 'Cold and frozen worlds cost your people one step less.',
  },
  'adaptation-2': {
    id: 'adaptation-2',
    name: 'Adaptation II',
    field: 'life-sciences',
    tier: 2,
    cost: 60,
    needs: ['adaptation-1'],
    effect: { kind: 'adaptation', condition: 'gravity', values: ['low', 'high'], by: 1 },
    text: 'Low and high gravity cost your people one step less.',
  },
  'closed-ecologies': {
    id: 'closed-ecologies',
    name: 'Closed ecologies',
    field: 'life-sciences',
    tier: 2,
    cost: 60,
    needs: ['habitat-domes'],
    effect: { kind: 'growth-percent', percent: 25 },
    text: 'Colonies grow 25% faster.',
  },
  'colonial-charters': {
    id: 'colonial-charters',
    name: 'Colonial charters',
    field: 'society',
    tier: 1,
    cost: 30,
    needs: [],
    effect: { kind: 'ship-discount', ship: 'colony', percent: 25 },
    text: 'Colony ships cost 25% less.',
  },
  'deep-survey': {
    id: 'deep-survey',
    name: 'Deep survey',
    field: 'survey',
    tier: 1,
    cost: 30,
    needs: [],
    effect: { kind: 'investigation-turns', turns: 1 },
    text: 'Investigating an anomaly takes one turn less (at least one).',
  },
  'long-baseline-arrays': {
    id: 'long-baseline-arrays',
    name: 'Long-baseline arrays',
    field: 'survey',
    tier: 2,
    cost: 60,
    needs: ['deep-survey'],
    effect: { kind: 'survey-station-lanes', lanes: 2 },
    text: 'Survey stations survey every system two open lanes away.',
  },
  // M2's technologies (M2_WORLDS.md §23.2).
  'fusion-power': {
    id: 'fusion-power',
    name: 'Fusion power',
    field: 'propulsion',
    tier: 2,
    cost: 60,
    needs: ['lane-engineering-1'],
    effect: { kind: 'opens' },
    text: 'Opens the fusion plant and the refinery.',
  },
  'lane-trade': {
    id: 'lane-trade',
    name: 'Lane trade',
    field: 'propulsion',
    tier: 2,
    cost: 60,
    needs: ['lane-engineering-1'],
    effect: { kind: 'zone-yield', zone: 'market', amount: 1 },
    text: 'Each market district yields 1 more credit.',
  },
  'lane-trade-2': {
    id: 'lane-trade-2',
    name: 'Lane trade II',
    field: 'propulsion',
    tier: 3,
    cost: 100,
    needs: ['lane-trade'],
    effect: { kind: 'zone-yield', zone: 'market', amount: 1 },
    text: 'Each market district yields 1 more credit again.',
  },
  automation: {
    id: 'automation',
    name: 'Automation',
    field: 'construction',
    tier: 2,
    cost: 60,
    needs: ['automated-mining'],
    effect: { kind: 'zone-yield', zone: 'works', amount: 1 },
    text: 'Each works district yields 1 more industry.',
  },
  'automation-2': {
    id: 'automation-2',
    name: 'Automation II',
    field: 'construction',
    tier: 3,
    cost: 100,
    needs: ['automation'],
    effect: { kind: 'zone-yield', zone: 'works', amount: 1 },
    text: 'Each works district yields 1 more industry again.',
  },
  'deep-boring': {
    id: 'deep-boring',
    name: 'Deep boring',
    field: 'construction',
    tier: 2,
    cost: 60,
    needs: ['automated-mining'],
    effect: { kind: 'zone-yield', zone: 'mines', amount: 1 },
    text: 'Each mine district yields 1 more.',
  },
  'deep-boring-2': {
    id: 'deep-boring-2',
    name: 'Deep boring II',
    field: 'construction',
    tier: 3,
    cost: 100,
    needs: ['deep-boring'],
    effect: { kind: 'zone-yield', zone: 'mines', amount: 1 },
    text: 'Each mine district yields 1 more again.',
  },
  arcologies: {
    id: 'arcologies',
    name: 'Arcologies',
    field: 'construction',
    tier: 3,
    cost: 100,
    needs: ['habitat-domes', 'automation'],
    effect: { kind: 'opens' },
    text: 'Opens the arcology: room for 4 million more in one colony.',
  },
  'soil-science': {
    id: 'soil-science',
    name: 'Soil science',
    field: 'life-sciences',
    tier: 1,
    cost: 30,
    needs: [],
    effect: { kind: 'zone-yield', zone: 'farms', amount: 1 },
    text: 'Each farm district yields 1 more food.',
  },
  'soil-science-2': {
    id: 'soil-science-2',
    name: 'Soil science II',
    field: 'life-sciences',
    tier: 2,
    cost: 60,
    needs: ['soil-science'],
    effect: { kind: 'zone-yield', zone: 'farms', amount: 1 },
    text: 'Each farm district yields 1 more food again.',
  },
  medicine: {
    id: 'medicine',
    name: 'Medicine',
    field: 'life-sciences',
    tier: 2,
    cost: 60,
    needs: ['soil-science'],
    effect: { kind: 'opens' },
    text: 'Opens the medical centre: a colony grows 25% faster.',
  },
  'adaptation-3': {
    id: 'adaptation-3',
    name: 'Adaptation III',
    field: 'life-sciences',
    tier: 3,
    cost: 100,
    needs: ['adaptation-2'],
    effect: { kind: 'adaptation', condition: 'temperature', values: ['hot', 'scorching'], by: 1 },
    text: 'Hot and scorching worlds cost your people one step less.',
  },
  'shared-spaces': {
    id: 'shared-spaces',
    name: 'Shared spaces',
    field: 'society',
    tier: 1,
    cost: 30,
    needs: [],
    effect: { kind: 'opens' },
    text: 'Opens the recreation dome: approval +10 in one colony.',
  },
  'fair-taxation': {
    id: 'fair-taxation',
    name: 'Fair taxation',
    field: 'society',
    tier: 2,
    cost: 60,
    needs: ['shared-spaces'],
    effect: { kind: 'tax-relief', approval: 5 },
    text: 'High taxes cost 10 approval instead of 15.',
  },
  'regional-administration': {
    id: 'regional-administration',
    name: 'Regional administration',
    field: 'society',
    tier: 2,
    cost: 60,
    needs: ['colonial-charters'],
    effect: { kind: 'near-jumps', jumps: 1 },
    text: 'Being far from home costs approval from 5 lane jumps, not 4.',
  },
  computing: {
    id: 'computing',
    name: 'Computing',
    field: 'survey',
    tier: 2,
    cost: 60,
    needs: ['deep-survey'],
    effect: { kind: 'zone-yield', zone: 'labs', amount: 1 },
    text: 'Each lab district yields 1 more research; opens the research institute.',
  },
  'computing-2': {
    id: 'computing-2',
    name: 'Computing II',
    field: 'survey',
    tier: 3,
    cost: 100,
    needs: ['computing'],
    effect: { kind: 'zone-yield', zone: 'labs', amount: 1 },
    text: 'Each lab district yields 1 more research again.',
  },
  'long-range-sensors': {
    id: 'long-range-sensors',
    name: 'Long-range sensors',
    field: 'survey',
    tier: 3,
    cost: 100,
    needs: ['long-baseline-arrays'],
    effect: { kind: 'survey-jump-points', points: 1 },
    text: 'Survey ships make 1 more jump point a turn.',
  },
};

export const TECH_IDS = Object.keys(TECHS) as TechId[];

export function isTechId(id: unknown): id is TechId {
  return typeof id === 'string' && id in TECHS;
}
