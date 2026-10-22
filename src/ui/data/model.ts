// What the data preview shows (M1 increment 1): every system with its real data, and every old
// lane as it stands at the start of a game with every power in play. Pure, so it is tested
// without a browser.

import type { FactionId } from '../../content/factions.ts';
import type { SystemId } from '../../data/types.ts';
import type { GameState } from '../../sim/state.ts';
import { type LaneId, laneEnds, otherEnd, type World } from '../../sim/world.ts';
import { searchKey } from '../search.ts';

export interface LaneRow {
  id: LaneId;
  to: SystemId;
  toName: string;
  lengthDeci: number;
  /** Open (held by `owner`) or dark. */
  owner: FactionId | null;
}

export interface SystemRow {
  id: SystemId;
  name: string;
  fromSolDeci: number;
  /** "G8V", or "G2V + K1V + M5.5Ve". */
  stars: string;
  planets: number;
  belts: number;
  flare: boolean;
  /** The power whose home web it is in, if any. */
  web: FactionId | null;
  lanes: LaneRow[];
}

export type SortKey = 'name' | 'distance' | 'planets' | 'lanes';

export function systemRows(world: World, game: GameState): SystemRow[] {
  const owner = new Map(game.lanes.map((l) => [l.id, l.owner]));
  const web = new Map<SystemId, FactionId>();
  for (const p of game.powers) web.set(p.capital, p.faction);
  for (const l of game.lanes) for (const end of l.id.split('~')) web.set(end, l.owner);
  return world.systems.map((s) => ({
    id: s.id,
    name: s.name,
    fromSolDeci: s.fromSolDeci,
    stars: s.sky.stars.map((st) => st.spectralType).join(' + '),
    planets: s.sky.planets.length,
    belts: s.sky.belts.length,
    flare: s.flare,
    web: web.get(s.id) ?? null,
    lanes: [
      ...world.catalogueAt(s.id).map((l) => {
        const to = l.a === s.id ? l.b : l.a;
        return {
          id: l.id,
          to,
          toName: world.system(to).name,
          lengthDeci: l.lengthDeci,
          owner: owner.get(l.id) ?? null,
        };
      }),
      // A power's own lanes, where Reborn had none (M3_NEIGHBOURS.md §24.4).
      ...game.lanes
        .filter((l) => l.id.split('~').includes(s.id) && !world.catalogueLane(...laneEnds(l.id)))
        .map((l) => {
          const to = otherEnd(l.id, s.id);
          return {
            id: l.id,
            to,
            toName: world.system(to).name,
            lengthDeci: world.distanceDeci(s.id, to),
            owner: l.owner,
          };
        }),
    ],
  }));
}

export function filterRows(rows: readonly SystemRow[], query: string, websOnly: boolean): SystemRow[] {
  const q = searchKey(query.trim());
  return rows.filter((r) => (!websOnly || r.web !== null) && (q === '' || searchKey(r.name).includes(q)));
}

export function sortRows(rows: readonly SystemRow[], key: SortKey, descending: boolean): SystemRow[] {
  const value = (r: SystemRow) =>
    key === 'distance' ? r.fromSolDeci : key === 'planets' ? r.planets : key === 'lanes' ? r.lanes.length : 0;
  const out = [...rows].sort((a, b) =>
    key === 'name' ? a.name.localeCompare(b.name, 'en') : value(a) - value(b) || a.name.localeCompare(b.name, 'en'),
  );
  return descending ? out.reverse() : out;
}
