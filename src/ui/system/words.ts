// Plain words for the planets' attributes, shared by the panels.

import type { Atmosphere, Body, BodyKind, Richness, TempBand, Water } from '../../sim/bodies.ts';
import type { Habitability, HabitabilityReason } from '../../sim/habitability.ts';

export const KIND_WORD: Record<BodyKind, string> = {
  rocky: 'rocky planet',
  'super-earth': 'super-Earth',
  'mini-neptune': 'mini-Neptune',
  'ice-giant': 'ice giant',
  'gas-giant': 'gas giant',
  dwarf: 'dwarf planet',
  moon: 'moon',
  belt: 'belt',
};

export const ATMOSPHERE_WORD: Record<Atmosphere, string> = {
  none: 'none',
  thin: 'thin',
  dense: 'dense',
  toxic: 'toxic, a runaway greenhouse',
};

export const WATER_WORD: Record<Water, string> = { none: 'none', ice: 'ice', oceans: 'oceans' };

export const TEMPERATURE_WORD: Record<TempBand, string> = {
  frozen: 'frozen',
  cold: 'cold',
  temperate: 'temperate',
  warm: 'warm',
  hot: 'hot',
  scorching: 'scorching',
};

export const HABITABILITY_WORD: Record<Habitability, string> = {
  comfortable: 'Comfortable',
  tolerable: 'Tolerable',
  harsh: 'Harsh',
  uninhabitable: 'Uninhabitable',
};

export const HABITABILITY_HELP: Record<Habitability, string> = {
  comfortable: 'people can live in the open',
  tolerable: 'people can live there with care',
  harsh: 'only under habitat domes',
  uninhabitable: 'outposts only',
};

const RICH = ['none', 'poor', 'rich'] as const;

export function richnessWord(r: Richness): string {
  return RICH[r];
}

/** "cold +1", "thin air +1", "no surface", for a habitability's reasons. */
export function reasonWord(r: HabitabilityReason): string {
  const what =
    r.condition === 'surface'
      ? `no surface to live on (${KIND_WORD[r.value as BodyKind] ?? r.value})`
      : r.condition === 'atmosphere'
        ? r.value === 'none'
          ? 'no air'
          : `${r.value} air`
        : r.condition === 'gravity'
          ? `${r.value} gravity`
          : r.condition === 'water'
            ? r.value === 'none'
              ? 'no water'
              : r.value
            : r.value;
  if (r.condition === 'surface') return what;
  return r.cost === null ? `${what}: impossible` : `${what} +${r.cost}`;
}

/** "0.54 au", with three figures for close orbits. */
export function auWord(milliAu: number): string {
  return milliAu < 100 ? `${(milliAu / 1000).toFixed(3)} au` : `${(milliAu / 1000).toFixed(2)} au`;
}

/** A short line for a world in a list: "super-Earth · size 10 · warm". */
export function bodyLine(b: Body): string {
  if (b.kind === 'belt')
    return `${b.name.toLowerCase().includes('disc') ? 'debris disc' : 'belt'} · ${auWord(b.orbitMilliAu)}`;
  return `${KIND_WORD[b.kind]} · size ${b.size} · ${b.temperature}`;
}
