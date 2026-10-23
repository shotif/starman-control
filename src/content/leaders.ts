// Leaders (M5_UNKNOWN.md §24): the five callings, the traits and flaws, and the names each people
// gives its own. All of them are fiction.

import type { FactionId } from './factions.ts';
import { RULES } from './rules.ts';

export type Calling = 'commander' | 'steward' | 'scholar' | 'ambassador' | 'spymaster';
export const CALLINGS: readonly Calling[] = ['commander', 'steward', 'scholar', 'ambassador', 'spymaster'];

export type TraitId =
  | 'bold'
  | 'sharp-eyed'
  | 'steady'
  | 'beloved'
  | 'industrious'
  | 'thrifty'
  | 'brilliant'
  | 'antiquarian'
  | 'charming'
  | 'persuasive'
  | 'cunning'
  | 'vigilant';

export type FlawId = 'greedy' | 'restless';
export const FLAWS: readonly FlawId[] = ['greedy', 'restless'];

export interface CallingDef {
  /** "Commander", before a name. */
  title: string;
  /** Where one serves: "a fleet", "the research". */
  post: string;
  /** A power has one of these posts, or one for each fleet or colony. */
  single: boolean;
  traits: readonly TraitId[];
}

export const CALLING_DEFS: Record<Calling, CallingDef> = {
  commander: { title: 'Commander', post: 'a fleet', single: false, traits: ['bold', 'sharp-eyed', 'steady'] },
  steward: { title: 'Steward', post: 'a colony', single: false, traits: ['beloved', 'industrious', 'thrifty'] },
  scholar: { title: 'Scholar', post: 'our research', single: true, traits: ['brilliant', 'antiquarian'] },
  ambassador: {
    title: 'Ambassador',
    post: 'our dealings and our seat in the Assembly',
    single: true,
    traits: ['charming', 'persuasive'],
  },
  spymaster: { title: 'Spymaster', post: 'our agents', single: true, traits: ['cunning', 'vigilant'] },
};

const P = RULES.leaders.per;

export const TRAITS: Record<TraitId, { name: string; calling: Calling; gives: (level: number) => string }> = {
  bold: { name: 'Bold', calling: 'commander', gives: (l) => `the fleet's weapons do ${P.bold * l}% more damage` },
  'sharp-eyed': {
    name: 'Sharp-eyed',
    calling: 'commander',
    gives: (l) => `the fleet's ships hit ${P['sharp-eyed'] * l} more in 100`,
  },
  steady: {
    name: 'Steady',
    calling: 'commander',
    gives: (l) => `the fleet's ships take ${P.steady * l}% less damage to their hulls`,
  },
  beloved: { name: 'Beloved', calling: 'steward', gives: (l) => `+${P.beloved * l} approval at the colony` },
  industrious: {
    name: 'Industrious',
    calling: 'steward',
    gives: (l) => `+${P.industrious * l}% industry at the colony`,
  },
  thrifty: { name: 'Thrifty', calling: 'steward', gives: (l) => `+${P.thrifty * l} credits a turn from the colony` },
  brilliant: { name: 'Brilliant', calling: 'scholar', gives: (l) => `+${P.brilliant * l}% research` },
  antiquarian: {
    name: 'Antiquarian',
    calling: 'scholar',
    gives: (l) => `+${P.antiquarian * l}% to our excavations' progress`,
  },
  charming: {
    name: 'Charming',
    calling: 'ambassador',
    gives: (l) => `every power we know thinks ${P.charming * l} better of us`,
  },
  persuasive: {
    name: 'Persuasive',
    calling: 'ambassador',
    gives: (l) => `+${P.persuasive * l}% votes in the Assembly`,
  },
  cunning: { name: 'Cunning', calling: 'spymaster', gives: (l) => `our agents learn ${P.cunning * l} more a turn` },
  vigilant: {
    name: 'Vigilant',
    calling: 'spymaster',
    gives: (l) => `others' agents learn ${P.vigilant * l} less of us a turn`,
  },
};

export const FLAW_DEFS: Record<FlawId, { name: string; does: string }> = {
  greedy: { name: 'Greedy', does: 'asks twice the wage' },
  restless: { name: 'Restless', does: 'twice as likely to leave' },
};

/**
 * Each people's names (§24.7): the humans' as given and family names, the Wake's single hard words,
 * the Concord's and the Moot's as pairs. None is an advisor's name.
 */
export const LEADER_NAMES: Record<FactionId, { first: readonly string[]; second: readonly string[] | null }> = {
  sta: {
    first: [
      'Amara',
      'Tomasz',
      'Mei',
      'Rahul',
      'Elif',
      'Johannes',
      'Nadia',
      'Kwame',
      'Ingrid',
      'Hiroshi',
      'Lucía',
      'Daniel',
      'Farah',
      'Mateus',
      'Olga',
      'Samuel',
    ],
    second: [
      'Okafor',
      'Brandt',
      'Castellanos',
      'Nakamura',
      'Iyer',
      'Novak',
      'Haddad',
      'Lindgren',
      'Mensah',
      'Petrov',
      'Delacroix',
      'Whitfield',
      'Yilmaz',
      'Andersen',
      'Chen',
      'Moreau',
    ],
  },
  frontier: {
    first: [
      'Wren',
      'Ezra',
      'Tamsin',
      'Kofi',
      'Hana',
      'Silas',
      'Marisol',
      'Arlo',
      'Juniper',
      'Teodor',
      'Aroha',
      'Bram',
      'Nell',
      'Iker',
      'Rosa',
      'Callum',
    ],
    second: [
      'Fairweather',
      'Okonkwo',
      'Hollis',
      'Tane',
      'Mendoza',
      'Brook',
      'Sato',
      'Ashby',
      'Kariuki',
      'Larkin',
      'Rowe',
      'Varga',
      'Thornley',
      'Abara',
      'Dunmore',
      'Ríos',
    ],
  },
  'hollow-wake': {
    first: [
      'Rook',
      'Slag',
      'Brine',
      'Flint',
      'Gash',
      'Knell',
      'Rust',
      'Soot',
      'Cinder',
      'Thorn',
      'Shank',
      'Grit',
      'Burr',
      'Lash',
      'Quill',
      'Hook',
      'Scrap',
      'Wick',
      'Ember',
      'Pike',
    ],
    second: null,
  },
  'dusk-concord': {
    first: ['Long', 'Quiet', 'Last', 'Low', 'Slow', 'Deep', 'Pale', 'Kind', 'Far', 'Warm', 'Grey', 'Late'],
    second: ['Shadow', 'Ember', 'Light', 'Ridge', 'Ash', 'Stone', 'Dusk', 'Hearth', 'Frost', 'Thread', 'Lamp', 'Glow'],
  },
  'drift-moot': {
    first: ['High', 'Soft', 'Warm', 'Cold', 'Long', 'Slow', 'Bright', 'Turning', 'Rising', 'Gentle', 'Wide', 'Late'],
    second: [
      'Tide',
      'Eddy',
      'Gust',
      'Swell',
      'Squall',
      'Updraft',
      'Drift',
      'Breeze',
      'Billow',
      'Front',
      'Stream',
      'Calm',
    ],
  },
  'last-hearth': {
    first: ['Banked', 'Bright', 'Low', 'Kept', 'Patient', 'Warm', 'Small', 'Last', 'Steady', 'Glowing', 'Quiet', 'Old'],
    second: [
      'Coal',
      'Ember',
      'Spark',
      'Ash',
      'Flame',
      'Tinder',
      'Glow',
      'Hearth',
      'Cinder',
      'Kindling',
      'Fire',
      'Lamp',
    ],
  },
};

/** Faces for each people (§24.7), each a portrait under art/portrait/. */
export const FACES = 4;

/** The portrait of a leader's face. */
export function facePortrait(people: FactionId, face: number): string {
  return `leader-${people}-${face}`;
}
