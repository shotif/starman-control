// A warship's modules (M4_FLEETS.md §21.2, D-59): one in each place of its hull. Weapons have one of
// Starman Reborn's four damage types and a best range (src/content/rules/gearFamilies.ts in Reborn,
// D-10); shields one of its three kinds; armour adds structure. What they do in battle comes with
// increment 44 (§7); the numbers are starting points for balancing.

import type { Cost } from './projects.ts';
import type { TechId } from './techs.ts';

export type DamageType = 'energy' | 'kinetic' | 'plasma' | 'ion';
export type ShieldKind = 'balanced' | 'deflector' | 'diffuser';
/** The three ranges of a battle (§7). */
export type Range = 'long' | 'middle' | 'close';

export type ModuleId =
  | 'pulse-1'
  | 'pulse-2'
  | 'pulse-3'
  | 'railgun-1'
  | 'railgun-2'
  | 'railgun-3'
  | 'plasma-1'
  | 'plasma-2'
  | 'ion-1'
  | 'ion-2'
  | 'shield-1'
  | 'shield-2'
  | 'shield-3'
  | 'deflector-1'
  | 'deflector-2'
  | 'diffuser-1'
  | 'diffuser-2'
  | 'armour-1'
  | 'armour-2'
  | 'armour-3'
  | 'targeting'
  | 'jump-drive'
  | 'repair-bay';

export type ModuleKind = 'weapon' | 'shield' | 'armour' | 'special';

export interface ModuleDef {
  id: ModuleId;
  name: string;
  kind: ModuleKind;
  /** Its line, for the yard's choice: the same for every mark ("pulse"). */
  line: string;
  mark: number;
  cost: Cost;
  /** The technology that opens it; none for those every power has from the start. */
  needs?: TechId;
  /** A weapon's damage a shot, its type and its best range. */
  weapon?: { damage: number; type: DamageType; range: Range };
  /** A shield's capacity and kind. */
  shield?: { capacity: number; kind: ShieldKind };
  /** Structure armour adds. */
  armour?: number;
  does: string;
}

const cost = (industry: number, metals: number, volatiles: number, fuel: number): Cost => ({
  industry,
  metals,
  volatiles,
  fuel,
});

export const MODULES: Record<ModuleId, ModuleDef> = {
  'pulse-1': {
    id: 'pulse-1',
    name: 'Pulse cannon I',
    kind: 'weapon',
    line: 'pulse',
    mark: 1,
    cost: cost(6, 2, 0, 0),
    weapon: { damage: 5, type: 'energy', range: 'middle' },
    does: 'Energy bolts, best at middle range: the all-rounder.',
  },
  'pulse-2': {
    id: 'pulse-2',
    name: 'Pulse cannon II',
    kind: 'weapon',
    line: 'pulse',
    mark: 2,
    cost: cost(9, 3, 1, 0),
    needs: 'pulse-cannons-2',
    weapon: { damage: 8, type: 'energy', range: 'middle' },
    does: 'Energy bolts, best at middle range: the all-rounder.',
  },
  'pulse-3': {
    id: 'pulse-3',
    name: 'Pulse cannon III',
    kind: 'weapon',
    line: 'pulse',
    mark: 3,
    cost: cost(13, 4, 2, 0),
    needs: 'heavy-guns',
    weapon: { damage: 11, type: 'energy', range: 'middle' },
    does: 'Energy bolts, best at middle range: the all-rounder.',
  },
  'railgun-1': {
    id: 'railgun-1',
    name: 'Railgun I',
    kind: 'weapon',
    line: 'railgun',
    mark: 1,
    cost: cost(6, 3, 0, 0),
    weapon: { damage: 5, type: 'kinetic', range: 'long' },
    does: 'Magnetic slugs, best at long range, hard on hulls.',
  },
  'railgun-2': {
    id: 'railgun-2',
    name: 'Railgun II',
    kind: 'weapon',
    line: 'railgun',
    mark: 2,
    cost: cost(9, 4, 1, 0),
    needs: 'railguns-2',
    weapon: { damage: 8, type: 'kinetic', range: 'long' },
    does: 'Magnetic slugs, best at long range, hard on hulls.',
  },
  'railgun-3': {
    id: 'railgun-3',
    name: 'Railgun III',
    kind: 'weapon',
    line: 'railgun',
    mark: 3,
    cost: cost(13, 6, 1, 0),
    needs: 'heavy-guns',
    weapon: { damage: 11, type: 'kinetic', range: 'long' },
    does: 'Magnetic slugs, best at long range, hard on hulls.',
  },
  'plasma-1': {
    id: 'plasma-1',
    name: 'Plasma cannon I',
    kind: 'weapon',
    line: 'plasma',
    mark: 1,
    cost: cost(9, 2, 0, 2),
    needs: 'plasma-cannons',
    weapon: { damage: 8, type: 'plasma', range: 'close' },
    does: 'Heavy plasma bolts, best at close range; they burn through diffusers.',
  },
  'plasma-2': {
    id: 'plasma-2',
    name: 'Plasma cannon II',
    kind: 'weapon',
    line: 'plasma',
    mark: 2,
    cost: cost(13, 3, 1, 3),
    needs: 'particle-beams',
    weapon: { damage: 12, type: 'plasma', range: 'close' },
    does: 'Heavy plasma bolts, best at close range; they burn through diffusers.',
  },
  'ion-1': {
    id: 'ion-1',
    name: 'Ion disruptor I',
    kind: 'weapon',
    line: 'ion',
    mark: 1,
    cost: cost(8, 2, 2, 0),
    needs: 'ion-disruptors',
    weapon: { damage: 6, type: 'ion', range: 'middle' },
    does: 'Breaks shields fast and barely scratches a hull: pair it with another gun.',
  },
  'ion-2': {
    id: 'ion-2',
    name: 'Ion disruptor II',
    kind: 'weapon',
    line: 'ion',
    mark: 2,
    cost: cost(12, 3, 3, 0),
    needs: 'particle-beams',
    weapon: { damage: 9, type: 'ion', range: 'middle' },
    does: 'Breaks shields fast and barely scratches a hull: pair it with another gun.',
  },
  'shield-1': {
    id: 'shield-1',
    name: 'Balanced shield I',
    kind: 'shield',
    line: 'balanced',
    mark: 1,
    cost: cost(5, 0, 2, 0),
    shield: { capacity: 8, kind: 'balanced' },
    does: 'An even field with no weak spots.',
  },
  'shield-2': {
    id: 'shield-2',
    name: 'Balanced shield II',
    kind: 'shield',
    line: 'balanced',
    mark: 2,
    cost: cost(8, 0, 3, 0),
    needs: 'shield-harmonics',
    shield: { capacity: 13, kind: 'balanced' },
    does: 'An even field with no weak spots.',
  },
  'shield-3': {
    id: 'shield-3',
    name: 'Balanced shield III',
    kind: 'shield',
    line: 'balanced',
    mark: 3,
    cost: cost(11, 0, 4, 0),
    needs: 'layered-shields',
    shield: { capacity: 18, kind: 'balanced' },
    does: 'An even field with no weak spots.',
  },
  'deflector-1': {
    id: 'deflector-1',
    name: 'Deflector shield I',
    kind: 'shield',
    line: 'deflector',
    mark: 1,
    cost: cost(6, 0, 2, 0),
    needs: 'deflector-fields',
    shield: { capacity: 9, kind: 'deflector' },
    does: 'A hard field that sheds kinetic slugs, and takes more from energy.',
  },
  'deflector-2': {
    id: 'deflector-2',
    name: 'Deflector shield II',
    kind: 'shield',
    line: 'deflector',
    mark: 2,
    cost: cost(9, 0, 3, 0),
    needs: 'shield-harmonics',
    shield: { capacity: 14, kind: 'deflector' },
    does: 'A hard field that sheds kinetic slugs, and takes more from energy.',
  },
  'diffuser-1': {
    id: 'diffuser-1',
    name: 'Diffuser shield I',
    kind: 'shield',
    line: 'diffuser',
    mark: 1,
    cost: cost(6, 0, 2, 0),
    needs: 'diffuser-fields',
    shield: { capacity: 9, kind: 'diffuser' },
    does: 'Spreads energy hits thin, and takes more from plasma.',
  },
  'diffuser-2': {
    id: 'diffuser-2',
    name: 'Diffuser shield II',
    kind: 'shield',
    line: 'diffuser',
    mark: 2,
    cost: cost(9, 0, 3, 0),
    needs: 'shield-harmonics',
    shield: { capacity: 14, kind: 'diffuser' },
    does: 'Spreads energy hits thin, and takes more from plasma.',
  },
  'armour-1': {
    id: 'armour-1',
    name: 'Plate armour',
    kind: 'armour',
    line: 'armour',
    mark: 1,
    cost: cost(3, 5, 0, 0),
    armour: 8,
    does: 'Structure +8.',
  },
  'armour-2': {
    id: 'armour-2',
    name: 'Composite armour',
    kind: 'armour',
    line: 'armour',
    mark: 2,
    cost: cost(5, 8, 0, 0),
    needs: 'composite-armour',
    armour: 14,
    does: 'Structure +14.',
  },
  'armour-3': {
    id: 'armour-3',
    name: 'Lattice armour',
    kind: 'armour',
    line: 'armour',
    mark: 3,
    cost: cost(7, 11, 2, 0),
    needs: 'lattice-armour',
    armour: 20,
    does: 'Structure +20.',
  },
  targeting: {
    id: 'targeting',
    name: 'Targeting computer',
    kind: 'special',
    line: 'targeting',
    mark: 1,
    cost: cost(8, 2, 2, 0),
    needs: 'fire-control',
    does: 'Its ship’s shots hit more often.',
  },
  'jump-drive': {
    id: 'jump-drive',
    name: 'Jump drive',
    kind: 'special',
    line: 'jump-drive',
    mark: 1,
    cost: cost(10, 3, 0, 3),
    needs: 'combat-drives',
    does: 'Its ship has a jump point more a turn.',
  },
  // Increment 44 (M4_FLEETS.md §24.6).
  'repair-bay': {
    id: 'repair-bay',
    name: 'Repair bay',
    kind: 'special',
    line: 'repair-bay',
    mark: 1,
    cost: cost(10, 4, 2, 0),
    needs: 'field-repairs',
    does: 'Repairs every ship of its fleet a tenth of its structure a turn, anywhere.',
  },
};

export const MODULE_IDS = Object.keys(MODULES) as ModuleId[];

export function isModuleId(id: unknown): id is ModuleId {
  return typeof id === 'string' && id in MODULES;
}

/** "energy", "kinetic"… with what each does to shields and hulls, for the screens. */
export const DAMAGE_WORDS: Record<DamageType, string> = {
  energy: 'energy',
  kinetic: 'kinetic',
  plasma: 'plasma',
  ion: 'ion',
};

export const RANGE_WORDS: Record<Range, string> = { long: 'long range', middle: 'middle range', close: 'close range' };
