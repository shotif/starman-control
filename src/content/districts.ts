// Districts and zoning (docs/design/M2_WORLDS.md §2, D-32): a colony's land, one district for each
// step of its world's size (a capital ten), each zoned for one use or left open. As data, so the
// rules read it and the interface words it; the numbers are starting points for balancing.

export type Zone = 'farms' | 'works' | 'mines' | 'labs' | 'market' | 'housing';

export const ZONES: readonly Zone[] = ['farms', 'works', 'mines', 'labs', 'market', 'housing'];

export interface ZoneDef {
  id: Zone;
  /** "Farms", "Works"… as a district's name. */
  name: string;
  /** Its exact effect, in plain words. */
  does: string;
  /** Whether people work it (housing needs no workers). */
  worked: boolean;
}

export const ZONE_DEFS: Record<Zone, ZoneDef> = {
  farms: {
    id: 'farms',
    name: 'Farms',
    does: 'Food: 3 on a comfortable world, 2 on a tolerable one, 1 under glass on a harsh one; 3 at a capital.',
    worked: true,
  },
  works: { id: 'works', name: 'Works', does: '3 industry.', worked: true },
  mines: {
    id: 'mines',
    name: 'Mines',
    does: 'Its world’s main riches: 2 if rich, 1 if poor. Only where there are riches.',
    worked: true,
  },
  labs: { id: 'labs', name: 'Labs', does: '2 research.', worked: true },
  market: {
    id: 'market',
    name: 'Market',
    does: '2 credits; 3 where the colony has a lane station.',
    worked: true,
  },
  housing: { id: 'housing', name: 'Housing', does: 'Room for 2 million more people. Needs no workers.', worked: false },
};

export function isZone(x: unknown): x is Zone {
  return typeof x === 'string' && (ZONES as readonly string[]).includes(x);
}

/** A zoned district: its use, and the slot it stands in (the colony scene's, 1 to its size). */
export interface District {
  zone: Zone;
  slot: number;
}
