// What the map draws, worked out from the world and a game state (pure, so tested without a
// browser): one glyph per system at its primary star's real position, the lanes (open in their
// holder's colour, or dark), the systems a power holds, and which labels matter most.

import { FACTIONS, type FactionId, type FactionMark } from '../content/factions.ts';
import type { SystemId } from '../data/types.ts';
import { type StarClass, starClass } from '../sim/stars.ts';
import type { GameState } from '../sim/state.ts';
import { type LaneId, laneEnds, type World } from '../sim/world.ts';
import { equatorialToMap, type Vec3 } from './mapMath.ts';

export interface MapSystem {
  id: SystemId;
  name: string;
  /** Map coordinates (three.js axes, light-years; see mapMath.ts). */
  pos: Vec3;
  /** Light-years above (+) or below (−) the plane of the celestial equator. */
  heightLy: number;
  /** The primary star's display colour. */
  colour: string;
  /** Glyph diameter in CSS pixels, loosely by spectral class (illustrative). */
  sizePx: number;
  /** Has known planets: such systems are labelled earlier. */
  planets: number;
}

export interface MapLane {
  id: LaneId;
  a: SystemId;
  b: SystemId;
  owner: FactionId | null;
  /** Open, being tuned (drawn dotted in its owner's colour), or dark. */
  status: 'open' | 'building' | 'dark';
}

export interface MapHolding {
  system: SystemId;
  faction: FactionId;
  mark: FactionMark;
  colour: string;
  capital: boolean;
  /** People in its colonies there, in whole units of about a million; 0 if it has none. */
  people: number;
}

export interface MapContent {
  systems: MapSystem[];
  lanes: MapLane[];
  holdings: MapHolding[];
}

/** Glyph size by spectral class: brighter kinds draw larger (illustrative). */
export function glyphPx(spectralType: string): number {
  const size: Record<StarClass, number> = {
    O: 13,
    B: 13,
    A: 13,
    F: 12,
    G: 11,
    K: 10,
    M: 8,
    D: 6,
    L: 6,
    T: 6,
    Y: 6,
    '?': 6,
  };
  return size[starClass(spectralType)];
}

export function mapContent(world: World, state: GameState): MapContent {
  const systems = world.systems.map((s): MapSystem => {
    const primary = s.sky.stars[0];
    return {
      id: s.id,
      name: s.name,
      pos: equatorialToMap(s.positionLy),
      heightLy: s.positionLy[2],
      colour: primary?.colorHex ?? '#ffffff',
      sizePx: glyphPx(primary?.spectralType ?? ''),
      planets: s.sky.planets.length,
    };
  });
  // Reborn's old lanes, open, being tuned or dark; then the lanes the powers have built anew.
  const kept = new Map(state.lanes.map((l) => [l.id, l]));
  const lanes = world.catalogue.map((l): MapLane => {
    const s = kept.get(l.id);
    return { id: l.id, a: l.a, b: l.b, owner: s?.owner ?? null, status: s ? s.status : 'dark' };
  });
  for (const l of state.lanes) {
    if (world.catalogueLane(...laneEnds(l.id))) continue;
    const [a, b] = laneEnds(l.id);
    lanes.push({ id: l.id, a, b, owner: l.owner, status: l.status });
  }
  // A power holds its capital, the systems of its colonies and outposts, and its home web's systems,
  // in that order where two powers meet. A system's label counts the people of its colonies.
  const held = new Map<SystemId, MapHolding>();
  const mark = (system: SystemId, faction: FactionId, capital: boolean) => {
    if (held.has(system)) return;
    const f = FACTIONS[faction];
    held.set(system, { system, faction, mark: f.mark, colour: f.colour, capital, people: 0 });
  };
  for (const p of state.powers) mark(p.capital, p.faction, true);
  for (const h of state.holdings) mark(h.system, h.owner, false);
  for (const l of state.lanes) for (const end of laneEnds(l.id)) mark(end, l.owner, false);
  const people = new Map<SystemId, number>();
  for (const h of state.holdings) {
    if (h.kind === 'colony' && held.get(h.system)?.faction === h.owner)
      people.set(h.system, (people.get(h.system) ?? 0) + h.people);
  }
  for (const [system, tenths] of people) {
    const m = held.get(system);
    if (m) m.people = Math.floor(tenths / 10);
  }
  return { systems, lanes, holdings: [...held.values()] };
}

export interface LabelContext {
  selected: SystemId | null;
  hovered: SystemId | null;
  holdings: ReadonlyMap<SystemId, MapHolding>;
}

/**
 * Which labels win when they crowd each other (§10: yours, selected, notable, the rest): the
 * selected and hovered systems, then capitals, then held systems, then those with known planets,
 * then the brighter stars. `nearness` (0 to 1, nearer the view's centre higher) breaks ties.
 */
export function labelPriority(s: MapSystem, ctx: LabelContext, nearness: number): number {
  let p = s.sizePx >= 10 ? 200 : 100;
  if (s.planets > 0) p = 300;
  const held = ctx.holdings.get(s.id);
  if (held) p = held.capital ? 800 : 600;
  if (ctx.hovered === s.id) p = 900;
  if (ctx.selected === s.id) p = 1000;
  return p + Math.max(0, Math.min(1, nearness)) * 50;
}
