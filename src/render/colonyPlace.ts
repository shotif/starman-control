// Where a colony's buildings stand in its landscape and how big they are drawn (COLONY_VIEW.md §2),
// shared by the panel's still and the living diorama. Fractions of the landscape picture: `u`
// across its width, `v` down its height.

import {
  LANDSCAPE_WIDTHS,
  type LandscapeArt,
  STRUCTURE_WIDTHS,
  type StructureArt,
  structureArt,
} from '../content/colonyArt.ts';
import type { ColonyScene, SceneBuilding } from './colonyScene.ts';

/** How wide a metre is, as a share of the picture's width, per unit of depth below the horizon. */
export const METRE = 0.0105;

/** A scaffold is drawn this much narrower than the building it is putting up. */
const SCAFFOLD_SHARE = 0.7;

export interface Placed {
  building: SceneBuilding;
  art: StructureArt;
  /** Its front middle on the ground, and its size, as fractions of the picture's width and height. */
  u: number;
  v: number;
  w: number;
  h: number;
}

/** Where a building stands and how big it is drawn; null when it has no picture. */
export function placeBuilding(scene: ColonyScene, land: LandscapeArt, b: SceneBuilding): Placed | null {
  const art = structureArt(scene.architecture, b.kind, b.home);
  const slot = land.slots[b.slot];
  if (!art || !slot) return null;
  const [u, v] = slot;
  // A scaffold takes the size of what it is building.
  const target = b.kind === 'scaffold' && b.project ? structureArt(scene.architecture, b.project) : undefined;
  const metres = target ? target.metres * SCAFFOLD_SHARE : art.metres;
  const w = metres * METRE * (v - land.horizon);
  return { building: b, art, u, v, w, h: (w / art.aspect) * land.aspect };
}

/** Every building there is a picture for, farthest first. */
export function placeAll(scene: ColonyScene, land: LandscapeArt): Placed[] {
  return scene.buildings
    .map((b) => placeBuilding(scene, land, b))
    .filter((p): p is Placed => p !== null)
    .sort((a, b) => a.v - b.v || a.u - b.u);
}

/** The town's extent: from the left of its leftmost building to the right of its rightmost, and down. */
export function townBounds(placed: Placed[]): { left: number; right: number; top: number; bottom: number } {
  let left = 0.4;
  let right = 0.6;
  let top = 1;
  let bottom = 0;
  for (const p of placed) {
    left = Math.min(left, p.u - p.w * 0.6);
    right = Math.max(right, p.u + p.w * 0.6);
    top = Math.min(top, p.v - p.h);
    bottom = Math.max(bottom, p.v);
  }
  return { left, right, top, bottom };
}

/** The part of the landscape to show in a frame of this shape: the town, with sky above it. */
export function frameTown(
  placed: Placed[],
  land: LandscapeArt,
  frameAspect: number,
): { u0: number; v0: number; uw: number } {
  const { left, right, bottom } = townBounds(placed);
  const uw = Math.min(1, Math.max(0.42, right - left + 0.04));
  const vh = (uw * land.aspect) / frameAspect;
  const u0 = Math.max(0, Math.min(1 - uw, (left + right) / 2 - uw / 2));
  // The lowest building's front sits a little above the bottom; never below the picture's foot.
  const lowest = Math.max(bottom, land.horizon + 0.3);
  const v0 = Math.max(0, Math.min(1 - vh, lowest + 0.06 - vh));
  return { u0, v0, uw };
}

/** The file for a picture at the smallest published width that is sharp enough. */
export function artUrl(base: string, kind: 'landscape' | 'structure', id: string, pixelsWide: number): string {
  const widths: readonly number[] = kind === 'landscape' ? LANDSCAPE_WIDTHS : STRUCTURE_WIDTHS;
  const width = widths.find((x) => x >= pixelsWide * 0.9) ?? widths.at(-1);
  return `${base}art/${kind}/${id}-${width}.webp`;
}
