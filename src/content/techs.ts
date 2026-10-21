// The M1 research tree (M1_FIRST_LIGHT.md §8, M1_LANES_RESEARCH.md §2), as data: each technology's
// field, cost in research points, what it needs first, and its effect, which the rules read. Every
// technology states its exact effect. The numbers are starting points for balancing in M2.

import type { Gravity, TempBand } from '../sim/bodies.ts';
import type { Zone } from './districts.ts';
import type { EventId } from './events.ts';
import type { ProjectId } from './projects.ts';
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
  | 'long-range-sensors'
  // Increment 25 (M2_WORLDS.md §27.5).
  | 'magnetics'
  // M2b's tiers 4 and 5 and the rest (M2B_SCIENCE.md §18.2).
  | 'lane-relays'
  | 'fast-hulls'
  | 'fold-charts'
  | 'lane-weaving'
  | 'orbital-habitats'
  | 'prefabrication'
  | 'mass-drivers'
  | 'terraforming'
  | 'gene-tailoring'
  | 'ecopoiesis'
  | 'cryosleep'
  | 'civil-service'
  | 'public-schooling'
  | 'councils'
  | 'free-press'
  | 'federation'
  | 'interferometry'
  | 'scanner-arrays'
  | 'thinking-machines'
  | 'deep-sky-survey'
  | 'lapse-studies'
  // M2b's doctrines (M2B_SCIENCE.md §19.1).
  | 'open-frontier'
  | 'strong-centre'
  | 'lane-network'
  | 'deep-jumpers'
  | 'industrial-worlds'
  | 'garden-worlds'
  // M2b's great works (M2B_SCIENCE.md §20.1).
  | 'great-engineering';

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
  | { kind: 'survey-jump-points'; points: number }
  // M2b (M2B_SCIENCE.md §18.2).
  /** Blind jumps reach this much further, in tenths of a light-year, and take this many turns less (at least one). */
  | { kind: 'blind-jump'; deci: number; turns: number }
  /** Lanes are tuned in this share of the turns, in percent, rounded up. */
  | { kind: 'tuning-percent'; percent: number }
  /** Projects cost this much less industry, in percent. */
  | { kind: 'project-discount'; percent: number }
  /** Outposts yield this many times their world's riches. */
  | { kind: 'outpost-times'; times: number }
  /** Terraforming takes this many turns a step, and goes on for this many steps. */
  | { kind: 'terraform'; turnsPerStep: number; steps: number }
  /** Colony ships carry this many tenths of people. */
  | { kind: 'settlers'; people: number }
  /** Attention a turn, more. */
  | { kind: 'attention'; perTurn: number }
  /** A scholar for every so many tenths of people. */
  | { kind: 'scholars'; per: number }
  /** Approval at every colony, more. */
  | { kind: 'approval'; amount: number }
  /** Edicts cost this much less attention (at least 1). */
  | { kind: 'edict-discount'; attention: number }
  /** Being far from home costs no approval. */
  | { kind: 'no-far' }
  /** Observations give this much more research, in percent. */
  | { kind: 'observation-percent'; percent: number }
  /** Deep-space scanners see this far, in tenths of a light-year. */
  | { kind: 'scanner-deci'; deci: number }
  /** Research this much more, in percent. */
  | { kind: 'research-percent'; percent: number }
  /** Anomalies' rewards this much more, in percent. */
  | { kind: 'anomaly-percent'; percent: number }
  // M2b's doctrines (M2B_SCIENCE.md §19.1).
  /** Approval at colonies within so many lane jumps of the capital, more. */
  | { kind: 'approval-near'; amount: number; jumps: number }
  /** The capital's own research, more. */
  | { kind: 'capital-research'; amount: number }
  /** Beacon slots in every system where the power holds a colony, more. */
  | { kind: 'colony-slots'; slots: number }
  /** Approval at colonies with this many works districts or more, changed. */
  | { kind: 'works-unrest'; works: number; approval: number };

/**
 * A deed that teaches a power something towards a technology: its inspiration (M2B_SCIENCE.md §17.1,
 * D-45). Each is checked as a turn ends, from the turn's report and the state.
 */
export type Deed =
  /** Paying for a lane at least this long, in tenths of a light-year (0: any). */
  | { kind: 'lane-paid'; deci: number }
  /** A survey ship coming out of a blind jump. */
  | { kind: 'blind-landing' }
  /** Holding this many of Reborn's lanes beyond the power's home web. */
  | { kind: 'relit-lanes'; n: number }
  /** Surveying a system with a world harsh for the power's species. */
  | { kind: 'survey-harsh' }
  /** Surveying a system with a catalogued flare star. */
  | { kind: 'survey-flare' }
  | { kind: 'outposts'; n: number }
  /** Colonies besides the capital. */
  | { kind: 'colonies'; n: number }
  /** Ships built, besides the starting fleet. */
  | { kind: 'ships-built'; n: number }
  /** A colony on a world of one of these temperature bands or gravities, or harsh for its species. */
  | { kind: 'colony-on'; temperature?: readonly TempBand[]; gravity?: readonly Gravity[]; harsh?: true }
  /** An outpost on a world with fusion fuel. */
  | { kind: 'outpost-fuel' }
  /** Districts of a zone worked, across the power or at one colony. */
  | { kind: 'worked'; zone: Zone; n: number; oneColony: boolean }
  | { kind: 'treasury'; credits: number }
  | { kind: 'colony-industry'; n: number }
  | { kind: 'project'; project: ProjectId }
  | { kind: 'colony-full' }
  /** Food made a turn, across the power. */
  | { kind: 'food-made'; n: number }
  /** Answering an event. */
  | { kind: 'answered'; event: EventId }
  /** A colony less than content. */
  | { kind: 'uneasy' }
  /** High taxes, with every colony content. */
  | { kind: 'content-high-taxes' }
  /** A colony this many lane jumps or more from the capital. */
  | { kind: 'far-colony'; jumps: number }
  | { kind: 'investigated' }
  /** Systems surveyed besides the capital. */
  | { kind: 'surveyed'; n: number }
  /** Research a turn. */
  | { kind: 'research'; n: number }
  // M2b's tiers 4 and 5 (M2B_SCIENCE.md §18.2).
  /** Lanes held, open or being tuned. */
  | { kind: 'lanes-held'; n: number }
  /** A blind jump begun of at least this many tenths of a light-year. */
  | { kind: 'blind-jump'; deci: number }
  /** Projects standing at its holdings. */
  | { kind: 'projects'; n: number }
  /** A colony under domes, full. */
  | { kind: 'harsh-full' }
  /** A world terraformed a step. */
  | { kind: 'terraformed' }
  /** Edicts in force at once. */
  | { kind: 'edicts'; n: number }
  /** A colony of this many tenths of people. */
  | { kind: 'colony-people'; n: number }
  /** A colony in unrest or revolt. */
  | { kind: 'unrest' }
  /** Systems surveyed that hold something astronomers have observed, besides the capital. */
  | { kind: 'observed'; n: number }
  /** Anomalies investigated. */
  | { kind: 'investigations'; n: number };

export interface TechDef {
  id: TechId;
  name: string;
  field: FieldId;
  /** Its row in the tree: 1 needs nothing, deeper rows need what is above them. */
  tier: number;
  /** Research points. */
  cost: number;
  needs: readonly TechId[];
  /** What it needs besides technologies: anomalies investigated (Lapse studies, §18.2). */
  requires?: { investigated: number };
  effect: TechEffect;
  /** Further effects, for a technology that does more than one thing (a doctrine, §19.1). */
  also?: readonly TechEffect[];
  /** A doctrine's pair: researching one closes the other for the game (§19.1). */
  fork?: TechId;
  /** Its exact effect, in plain words. */
  text: string;
  /** What inspires it, and that deed in words ("holding two outposts"). */
  inspiration: { deed: Deed; text: string };
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
    inspiration: { deed: { kind: 'lane-paid', deci: 0 }, text: 'paying for a lane' },
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
    inspiration: { deed: { kind: 'lane-paid', deci: 70 }, text: 'paying for a lane of 7 light-years or more' },
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
    inspiration: { deed: { kind: 'lane-paid', deci: 90 }, text: 'paying for a lane of 9 light-years or more' },
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
    inspiration: { deed: { kind: 'blind-landing' }, text: 'a survey ship landing from a blind jump' },
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
    inspiration: {
      deed: { kind: 'relit-lanes', n: 2 },
      text: 'holding two relit lanes (Reborn’s lanes beyond your home web)',
    },
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
    inspiration: { deed: { kind: 'survey-harsh' }, text: 'surveying a harsh world' },
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
    inspiration: { deed: { kind: 'outposts', n: 2 }, text: 'holding two outposts' },
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
    inspiration: { deed: { kind: 'ships-built', n: 3 }, text: 'building three ships' },
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
    inspiration: {
      deed: { kind: 'colony-on', temperature: ['cold', 'frozen'] },
      text: 'a colony on a cold or frozen world',
    },
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
    inspiration: {
      deed: { kind: 'colony-on', gravity: ['low', 'high'] },
      text: 'a colony on a world of low or high gravity',
    },
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
    inspiration: { deed: { kind: 'colony-on', harsh: true }, text: 'a colony under domes, on a harsh world' },
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
    inspiration: { deed: { kind: 'colonies', n: 3 }, text: 'holding three colonies besides the capital' },
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
    inspiration: { deed: { kind: 'investigated' }, text: 'investigating an anomaly' },
  },
  'long-baseline-arrays': {
    id: 'long-baseline-arrays',
    name: 'Long-baseline arrays',
    field: 'survey',
    tier: 2,
    cost: 60,
    needs: ['deep-survey'],
    effect: { kind: 'survey-station-lanes', lanes: 2 },
    text: 'Survey stations survey every system two open lanes away. Opens the deep-space scanner: other powers’ ships seen within 8 light-years.',
    inspiration: { deed: { kind: 'surveyed', n: 10 }, text: 'ten systems surveyed besides the capital' },
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
    inspiration: { deed: { kind: 'outpost-fuel' }, text: 'an outpost on a world with fusion fuel' },
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
    inspiration: {
      deed: { kind: 'worked', zone: 'market', n: 3, oneColony: false },
      text: 'three market districts worked',
    },
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
    inspiration: { deed: { kind: 'treasury', credits: 200 }, text: '200 credits in the treasury' },
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
    inspiration: {
      deed: { kind: 'worked', zone: 'works', n: 5, oneColony: false },
      text: 'five works districts worked',
    },
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
    inspiration: { deed: { kind: 'colony-industry', n: 25 }, text: 'a colony making 25 industry a turn' },
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
    inspiration: {
      deed: { kind: 'worked', zone: 'mines', n: 3, oneColony: false },
      text: 'three mine districts worked',
    },
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
    inspiration: { deed: { kind: 'project', project: 'mine' }, text: 'a deep mine built' },
  },
  magnetics: {
    id: 'magnetics',
    name: 'Magnetics',
    field: 'construction',
    tier: 2,
    cost: 60,
    needs: ['habitat-domes'],
    effect: { kind: 'opens' },
    text: 'Opens the flare shield: a colony on a world exposed to its star’s flares is spared them.',
    inspiration: { deed: { kind: 'survey-flare' }, text: 'surveying a catalogued flare star' },
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
    inspiration: { deed: { kind: 'colony-full' }, text: 'a colony full' },
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
    inspiration: {
      deed: { kind: 'worked', zone: 'farms', n: 3, oneColony: true },
      text: 'three farm districts worked at one colony',
    },
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
    inspiration: { deed: { kind: 'food-made', n: 20 }, text: 'making 20 food a turn' },
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
    inspiration: { deed: { kind: 'answered', event: 'epidemic' }, text: 'answering an epidemic' },
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
    inspiration: { deed: { kind: 'colony-on', temperature: ['warm', 'hot'] }, text: 'a colony on a warm or hot world' },
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
    inspiration: { deed: { kind: 'uneasy' }, text: 'a colony less than content' },
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
    inspiration: { deed: { kind: 'content-high-taxes' }, text: 'high taxes with every colony content' },
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
    inspiration: { deed: { kind: 'far-colony', jumps: 3 }, text: 'a colony three lane jumps from the capital' },
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
    inspiration: {
      deed: { kind: 'worked', zone: 'labs', n: 3, oneColony: true },
      text: 'three labs worked at one colony',
    },
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
    inspiration: { deed: { kind: 'research', n: 30 }, text: '30 research a turn' },
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
    inspiration: { deed: { kind: 'surveyed', n: 30 }, text: 'thirty systems surveyed besides the capital' },
  },
  // M2b's tiers 4 and 5, and what completes them (M2B_SCIENCE.md §18.2).
  'lane-relays': {
    id: 'lane-relays',
    name: 'Lane relays',
    field: 'propulsion',
    tier: 4,
    cost: 240,
    needs: ['lane-engineering-3'],
    effect: { kind: 'opens' },
    text: 'Opens the lane relay: two more beacon slots in its system.',
    inspiration: { deed: { kind: 'lanes-held', n: 12 }, text: 'holding twelve lanes' },
  },
  'fast-hulls': {
    id: 'fast-hulls',
    name: 'Fast hulls',
    field: 'propulsion',
    tier: 4,
    cost: 240,
    needs: ['jump-tuning', 'lane-engineering-3'],
    effect: { kind: 'jump-points', points: 1 },
    text: 'Every ship makes 1 more jump point a turn.',
    inspiration: { deed: { kind: 'ships-built', n: 10 }, text: 'building ten ships' },
  },
  'fold-charts': {
    id: 'fold-charts',
    name: 'Fold charts',
    field: 'propulsion',
    tier: 5,
    cost: 480,
    needs: ['fast-hulls'],
    effect: { kind: 'blind-jump', deci: 30, turns: 1 },
    text: 'Blind jumps reach 3 ly further and take a turn less (at least one).',
    inspiration: { deed: { kind: 'blind-jump', deci: 90 }, text: 'a blind jump of 9 light-years or more' },
  },
  'lane-weaving': {
    id: 'lane-weaving',
    name: 'Lane weaving',
    field: 'propulsion',
    tier: 5,
    cost: 480,
    needs: ['lane-relays'],
    effect: { kind: 'tuning-percent', percent: 50 },
    text: 'Lanes are tuned in half the turns, rounded up.',
    inspiration: { deed: { kind: 'lanes-held', n: 20 }, text: 'holding twenty lanes' },
  },
  'orbital-habitats': {
    id: 'orbital-habitats',
    name: 'Orbital habitats',
    field: 'construction',
    tier: 4,
    cost: 240,
    needs: ['arcologies'],
    effect: { kind: 'opens' },
    text: 'Opens the orbital habitat: an outpost becomes a colony in orbit, with room for 2 million.',
    inspiration: { deed: { kind: 'outposts', n: 6 }, text: 'holding six outposts' },
  },
  prefabrication: {
    id: 'prefabrication',
    name: 'Prefabrication',
    field: 'construction',
    tier: 4,
    cost: 240,
    needs: ['automation-2'],
    effect: { kind: 'project-discount', percent: 20 },
    text: 'Projects cost 20% less industry.',
    inspiration: { deed: { kind: 'projects', n: 12 }, text: 'twelve projects standing' },
  },
  'mass-drivers': {
    id: 'mass-drivers',
    name: 'Mass drivers',
    field: 'construction',
    tier: 5,
    cost: 480,
    needs: ['deep-boring-2'],
    effect: { kind: 'outpost-times', times: 2 },
    text: 'Outposts yield twice their world’s riches.',
    inspiration: { deed: { kind: 'outposts', n: 10 }, text: 'holding ten outposts' },
  },
  terraforming: {
    id: 'terraforming',
    name: 'Terraforming',
    field: 'life-sciences',
    tier: 4,
    cost: 240,
    needs: ['adaptation-3'],
    effect: { kind: 'opens' },
    text: 'Opens the terraforming station: its world becomes one step more habitable after 10 turns.',
    inspiration: { deed: { kind: 'harsh-full' }, text: 'a colony under domes full' },
  },
  'gene-tailoring': {
    id: 'gene-tailoring',
    name: 'Gene tailoring',
    field: 'life-sciences',
    tier: 4,
    cost: 240,
    needs: ['medicine', 'closed-ecologies'],
    effect: { kind: 'growth-percent', percent: 25 },
    text: 'Colonies grow 25% faster.',
    inspiration: { deed: { kind: 'project', project: 'medical-centre' }, text: 'a medical centre built' },
  },
  ecopoiesis: {
    id: 'ecopoiesis',
    name: 'Ecopoiesis',
    field: 'life-sciences',
    tier: 5,
    cost: 480,
    needs: ['terraforming'],
    effect: { kind: 'terraform', turnsPerStep: 5, steps: 2 },
    text: 'Terraforming takes 5 turns a step, and goes on to a second step.',
    inspiration: { deed: { kind: 'terraformed' }, text: 'a world terraformed' },
  },
  cryosleep: {
    id: 'cryosleep',
    name: 'Cryosleep',
    field: 'life-sciences',
    tier: 5,
    cost: 480,
    needs: ['gene-tailoring'],
    effect: { kind: 'settlers', people: 20 },
    text: 'Colony ships carry 2 million settlers.',
    inspiration: { deed: { kind: 'colonies', n: 8 }, text: 'holding eight colonies besides the capital' },
  },
  'civil-service': {
    id: 'civil-service',
    name: 'Civil service',
    field: 'society',
    tier: 2,
    cost: 60,
    needs: ['colonial-charters'],
    effect: { kind: 'attention', perTurn: 1 },
    text: 'Attention +1 a turn.',
    inspiration: { deed: { kind: 'edicts', n: 1 }, text: 'an edict in force' },
  },
  'public-schooling': {
    id: 'public-schooling',
    name: 'Public schooling',
    field: 'society',
    tier: 3,
    cost: 100,
    needs: ['civil-service', 'shared-spaces'],
    effect: { kind: 'scholars', per: 30 },
    text: 'Scholars: 1 for every 3 million people instead of 4.',
    inspiration: { deed: { kind: 'colony-people', n: 120 }, text: 'a colony of 12 million' },
  },
  councils: {
    id: 'councils',
    name: 'Councils',
    field: 'society',
    tier: 4,
    cost: 240,
    needs: ['public-schooling'],
    effect: { kind: 'approval', amount: 5 },
    text: 'Approval +5 at every colony.',
    inspiration: { deed: { kind: 'unrest' }, text: 'a colony in unrest' },
  },
  'free-press': {
    id: 'free-press',
    name: 'Free press',
    field: 'society',
    tier: 4,
    cost: 240,
    needs: ['civil-service', 'fair-taxation'],
    effect: { kind: 'edict-discount', attention: 1 },
    text: 'Edicts cost 1 attention less (at least 1).',
    inspiration: { deed: { kind: 'edicts', n: 2 }, text: 'two edicts in force at once' },
  },
  federation: {
    id: 'federation',
    name: 'Federation',
    field: 'society',
    tier: 5,
    cost: 480,
    needs: ['councils', 'regional-administration'],
    effect: { kind: 'no-far' },
    text: 'Being far from home costs no approval (no lane to the capital still does).',
    inspiration: { deed: { kind: 'far-colony', jumps: 6 }, text: 'a colony six lane jumps from the capital' },
  },
  interferometry: {
    id: 'interferometry',
    name: 'Interferometry',
    field: 'survey',
    tier: 4,
    cost: 240,
    needs: ['long-baseline-arrays', 'computing-2'],
    effect: { kind: 'observation-percent', percent: 100 },
    text: 'Observations give twice the research.',
    inspiration: { deed: { kind: 'observed', n: 10 }, text: 'ten observed systems surveyed' },
  },
  'scanner-arrays': {
    id: 'scanner-arrays',
    name: 'Scanner arrays',
    field: 'survey',
    tier: 4,
    cost: 240,
    needs: ['long-range-sensors'],
    effect: { kind: 'scanner-deci', deci: 120 },
    text: 'Deep-space scanners see 12 ly instead of 8.',
    inspiration: { deed: { kind: 'project', project: 'deep-space-scanner' }, text: 'a deep-space scanner built' },
  },
  'thinking-machines': {
    id: 'thinking-machines',
    name: 'Thinking machines',
    field: 'survey',
    tier: 5,
    cost: 480,
    needs: ['computing-2'],
    effect: { kind: 'research-percent', percent: 10 },
    text: 'Research +10%.',
    inspiration: { deed: { kind: 'research', n: 60 }, text: '60 research a turn' },
  },
  'deep-sky-survey': {
    id: 'deep-sky-survey',
    name: 'Deep-sky survey',
    field: 'survey',
    tier: 5,
    cost: 480,
    needs: ['interferometry', 'long-range-sensors'],
    effect: { kind: 'survey-station-lanes', lanes: 3 },
    text: 'Survey stations survey every system three open lanes away.',
    inspiration: { deed: { kind: 'surveyed', n: 60 }, text: 'sixty systems surveyed besides the capital' },
  },
  'lapse-studies': {
    id: 'lapse-studies',
    name: 'Lapse studies',
    field: 'xenology',
    tier: 1,
    cost: 60,
    needs: [],
    requires: { investigated: 3 },
    effect: { kind: 'anomaly-percent', percent: 50 },
    text: 'Anomalies’ rewards +50%.',
    inspiration: { deed: { kind: 'investigations', n: 5 }, text: 'five anomalies investigated' },
  },
  // M2b's doctrines (M2B_SCIENCE.md §19.1): each pair a fork.
  'open-frontier': {
    id: 'open-frontier',
    name: 'Open frontier',
    field: 'society',
    tier: 3,
    cost: 100,
    needs: ['regional-administration'],
    fork: 'strong-centre',
    effect: { kind: 'ship-discount', ship: 'colony', percent: 25 },
    also: [{ kind: 'near-jumps', jumps: 1 }],
    text: 'A doctrine: colony ships cost 25% less, and being far from home begins a lane jump later.',
    inspiration: { deed: { kind: 'far-colony', jumps: 5 }, text: 'a colony five lane jumps from the capital' },
  },
  'strong-centre': {
    id: 'strong-centre',
    name: 'Strong centre',
    field: 'society',
    tier: 3,
    cost: 100,
    needs: ['regional-administration'],
    fork: 'open-frontier',
    effect: { kind: 'approval-near', amount: 5, jumps: 3 },
    also: [{ kind: 'capital-research', amount: 3 }],
    text: 'A doctrine: approval +5 at colonies within three lane jumps of the capital, and the capital 3 more research.',
    inspiration: { deed: { kind: 'colonies', n: 4 }, text: 'four colonies besides the capital' },
  },
  'lane-network': {
    id: 'lane-network',
    name: 'Lane network',
    field: 'propulsion',
    tier: 3,
    cost: 100,
    needs: ['lane-engineering-2'],
    fork: 'deep-jumpers',
    effect: { kind: 'lane-discount', percent: 25 },
    also: [{ kind: 'colony-slots', slots: 1 }],
    text: 'A doctrine: lanes cost 25% less, and every system where you hold a colony has a beacon slot more.',
    inspiration: { deed: { kind: 'lanes-held', n: 8 }, text: 'holding eight lanes' },
  },
  'deep-jumpers': {
    id: 'deep-jumpers',
    name: 'Deep jumpers',
    field: 'propulsion',
    tier: 3,
    cost: 100,
    needs: ['lane-engineering-2'],
    fork: 'lane-network',
    effect: { kind: 'blind-jump', deci: 20, turns: 0 },
    also: [{ kind: 'survey-jump-points', points: 1 }],
    text: 'A doctrine: blind jumps reach 2 ly further, and survey ships make 1 more jump point a turn.',
    inspiration: { deed: { kind: 'blind-jump', deci: 70 }, text: 'a blind jump of 7 light-years or more' },
  },
  'industrial-worlds': {
    id: 'industrial-worlds',
    name: 'Industrial worlds',
    field: 'construction',
    tier: 4,
    cost: 240,
    needs: ['automation-2'],
    fork: 'garden-worlds',
    effect: { kind: 'zone-yield', zone: 'works', amount: 1 },
    also: [{ kind: 'works-unrest', works: 3, approval: -5 }],
    text: 'A doctrine: each works district yields 1 more industry, and approval −5 at colonies with three works or more.',
    inspiration: {
      deed: { kind: 'worked', zone: 'works', n: 10, oneColony: false },
      text: 'ten works districts worked',
    },
  },
  'garden-worlds': {
    id: 'garden-worlds',
    name: 'Garden worlds',
    field: 'construction',
    tier: 4,
    cost: 240,
    needs: ['automation-2'],
    fork: 'industrial-worlds',
    effect: { kind: 'zone-yield', zone: 'farms', amount: 1 },
    also: [{ kind: 'growth-percent', percent: 15 }],
    text: 'A doctrine: each farm district yields 1 more food, and colonies grow 15% faster.',
    inspiration: {
      deed: { kind: 'worked', zone: 'farms', n: 10, oneColony: false },
      text: 'ten farm districts worked',
    },
  },
  // M2b's great works (M2B_SCIENCE.md §20.1).
  'great-engineering': {
    id: 'great-engineering',
    name: 'Great engineering',
    field: 'construction',
    tier: 5,
    cost: 480,
    needs: ['prefabrication'],
    effect: { kind: 'opens' },
    text: 'Opens the great works: the Long Array, the Lapse Archive, the Lanewright Foundry and the Commons, each with its own technology. One of each in the whole neighbourhood.',
    inspiration: { deed: { kind: 'projects', n: 20 }, text: 'twenty projects standing' },
  },
};

export const TECH_IDS = Object.keys(TECHS) as TechId[];

export function isTechId(id: unknown): id is TechId {
  return typeof id === 'string' && id in TECHS;
}
