// How habitable a world is for a species (docs/design/M1_PLANETS.md §5): each condition costs what
// the species' data says; the total sets the level, and the level and the world's size set how
// many people it can hold. Every part is returned, so the interface can say why.

import type { SpeciesDef } from '../content/species.ts';
import type { Body } from './bodies.ts';

export type Habitability = 'comfortable' | 'tolerable' | 'harsh' | 'uninhabitable';

export interface HabitabilityReason {
  condition: 'surface' | 'temperature' | 'atmosphere' | 'gravity' | 'water' | 'flare' | 'open';
  /** The world's value, e.g. "cold". */
  value: string;
  /** Points it costs, or null when it alone makes the world uninhabitable. */
  cost: number | null;
}

export interface HabitabilityResult {
  level: Habitability;
  total: number;
  reasons: HabitabilityReason[];
  /** People it can hold, in units of about a million (§5). */
  capacity: number;
}

export function habitability(body: Body, species: SpeciesDef): HabitabilityResult {
  if (!species.surfaces.includes(body.kind)) {
    return {
      level: 'uninhabitable',
      total: 0,
      reasons: [{ condition: 'surface', value: body.kind, cost: null }],
      capacity: 0,
    };
  }
  const c = species.costs;
  const reasons: HabitabilityReason[] = [
    { condition: 'temperature', value: body.temperature, cost: c.temperature[body.temperature] },
    { condition: 'atmosphere', value: body.atmosphere, cost: c.atmosphere[body.atmosphere] },
    { condition: 'gravity', value: body.gravity, cost: c.gravity[body.gravity] },
    { condition: 'water', value: body.water, cost: c.water[body.water] },
  ];
  if (body.flareExposed) reasons.push({ condition: 'flare', value: 'flare-exposed', cost: c.flare });
  // A world not locked to its star has no ring of dusk (M3_NEIGHBOURS.md §24.3).
  if (!body.locked) reasons.push({ condition: 'open', value: 'open sky', cost: c.open });
  const impossible = reasons.some((r) => r.cost === null);
  const total = reasons.reduce((sum, r) => sum + (r.cost ?? 0), 0);
  const level: Habitability = impossible
    ? 'uninhabitable'
    : total <= species.levels.comfortable
      ? 'comfortable'
      : total <= species.levels.tolerable
        ? 'tolerable'
        : total <= species.levels.harsh
          ? 'harsh'
          : 'uninhabitable';
  const capacity =
    level === 'comfortable'
      ? body.size * 2
      : level === 'tolerable'
        ? body.size
        : level === 'harsh'
          ? Math.floor(body.size / 2)
          : 0;
  return { level, total, reasons: reasons.filter((r) => r.cost !== 0), capacity };
}
