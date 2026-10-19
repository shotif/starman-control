// The M1 research tree (M1_FIRST_LIGHT.md §8, M1_LANES_RESEARCH.md §2), as data: each technology's
// field, cost in research points, what it needs first, and its effect, which the rules read. Every
// technology states its exact effect. The numbers are starting points for balancing in M2.

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
  | 'long-baseline-arrays';

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
  | { kind: 'survey-station-lanes'; lanes: number };

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
};

export const TECH_IDS = Object.keys(TECHS) as TechId[];

export function isTechId(id: unknown): id is TechId {
  return typeof id === 'string' && id in TECHS;
}
