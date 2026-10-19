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
}

export interface MapHolding {
  system: SystemId;
  faction: FactionId;
  mark: FactionMark;
  colour: string;
  capital: boolean;
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
  const owner = new Map(state.lanes.map((l) => [l.id, l.owner]));
  const lanes = world.catalogue.map((l): MapLane => ({ id: l.id, a: l.a, b: l.b, owner: owner.get(l.id) ?? null }));
  // In M1 a power holds its capital and its home web's systems; colonies and outposts come later.
  const held = new Map<SystemId, MapHolding>();
  for (const p of state.powers) {
    const f = FACTIONS[p.faction];
    held.set(p.capital, { system: p.capital, faction: p.faction, mark: f.mark, colour: f.colour, capital: true });
  }
  for (const l of state.lanes) {
    const f = FACTIONS[l.owner];
    for (const end of laneEnds(l.id)) {
      if (!held.has(end))
        held.set(end, { system: end, faction: l.owner, mark: f.mark, colour: f.colour, capital: false });
    }
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
