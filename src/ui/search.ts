// Finding a system by name, on every screen that lists systems.

import type { SystemId } from '../data/types.ts';
import type { World } from '../sim/world.ts';

/** Folds accents, apostrophes and case, so "barnards" finds "Barnard’s Star". */
export function searchKey(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/[’'`]/g, '').toLowerCase();
}

/**
 * Systems whose name (or a star's name, so "Proxima" finds Alpha Centauri) matches: names that
 * start with the query first, then the nearest to Sol.
 */
export function searchSystems(world: World, query: string, limit = 8): SystemId[] {
  const q = searchKey(query.trim());
  if (q === '') return [];
  const scored: { id: SystemId; rank: number; d: number }[] = [];
  for (const s of world.systems) {
    const name = searchKey(s.name);
    let rank = name.startsWith(q) ? 0 : name.includes(q) ? 1 : -1;
    if (rank < 0 && s.sky.stars.some((st) => searchKey(st.name).includes(q))) rank = 2;
    if (rank >= 0) scored.push({ id: s.id, rank, d: s.fromSolDeci });
  }
  scored.sort((a, b) => a.rank - b.rank || a.d - b.d);
  return scored.slice(0, limit).map((s) => s.id);
}
