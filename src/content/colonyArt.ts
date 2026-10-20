// The colony view's pictures (docs/design/COLONY_VIEW.md §3), as data: which landscapes and
// buildings exist, and how each is set out. The pictures themselves are in public/art/, made by the
// art pipeline (art/briefs.ts) and recorded in art/manifest.json; a test checks this list against
// the manifest. A world or a building with no picture yet is simply not drawn.

import type { ArchitectureId } from './factions.ts';
import type { ProjectId } from './projects.ts';

/** The kinds of ground a world can have (COLONY_VIEW.md §3). */
export type Biome = 'garden' | 'shore' | 'steppe' | 'desert' | 'inferno' | 'tundra' | 'ice' | 'airless' | 'haze';

export interface LandscapeArt {
  /** Its brief, and so its file: art/landscape/<id>-<width>.webp. */
  id: string;
  /** Width over height. */
  aspect: number;
  /** Where the horizon is, as a fraction of the picture's height from the top. */
  horizon: number;
  /**
   * Where buildings may stand: [across, down] as fractions of the picture's width and height, each
   * the front middle of a building. Twelve, the most any world has (its `size`): the even ones, for
   * homes, make the middle of the town, and the odd ones, for projects, ring it.
   */
  slots: readonly (readonly [number, number])[];
}

/** Published widths of each kind of picture, smallest for phones. */
export const LANDSCAPE_WIDTHS = [1280, 2560] as const;
export const STRUCTURE_WIDTHS = [512, 1024] as const;

export const LANDSCAPES: Partial<Record<Biome, LandscapeArt>> = {
  shore: {
    id: 'landscape-shore',
    aspect: 3168 / 1344,
    horizon: 0.31,
    slots: [
      [0.48, 0.6],
      [0.27, 0.66],
      [0.6, 0.57],
      [0.72, 0.53],
      [0.37, 0.56],
      [0.66, 0.66],
      [0.43, 0.69],
      [0.84, 0.56],
      [0.25, 0.55],
      [0.15, 0.74],
      [0.56, 0.72],
      [0.88, 0.5],
    ],
  },
};

/** Homes come in three sizes: small houses, blocks, towers (COLONY_VIEW.md §3). */
export type HomeSize = 1 | 2 | 3;

/** Open to the air on a comfortable world; sealed under domes elsewhere. */
export type Envelope = 'open' | 'domed';

export type StructureKind = ProjectId | 'homes' | 'hall' | 'scaffold';

export interface StructureArt {
  /** Its brief, and so its file: art/structure/<id>-<width>.webp. */
  id: string;
  /** Width over height of the cut-out. */
  aspect: number;
  /** How wide it is in the world, in metres, which sets its size in the scene. */
  metres: number;
}

/** Every building picture there is, by its brief id. */
export const STRUCTURES: Record<string, StructureArt> = Object.fromEntries(
  (
    [
      ['authority-homes-2-open', 1860 / 1549, 34],
      ['cooperative-homes-2-domed', 1832 / 1522, 34],
      ['cooperative-lane-station', 1758 / 1598, 24],
      ['cooperative-mine', 1833 / 1429, 30],
      ['cooperative-shipyard', 1874 / 1362, 44],
      ['scaffold', 1764 / 1822, 22],
      ['wake-homes-2-domed', 1894 / 1398, 34],
    ] as const
  ).map(([id, aspect, metres]) => [id, { id, aspect, metres }]),
);

/** The brief id a building would have: homes by size and envelope, the rest by architecture. */
export function structureId(
  architecture: ArchitectureId,
  kind: StructureKind,
  home?: { size: HomeSize; envelope: Envelope },
): string {
  if (kind === 'scaffold') return 'scaffold';
  if (kind === 'homes') return `${architecture}-homes-${home?.size ?? 2}-${home?.envelope ?? 'open'}`;
  return `${architecture}-${kind}`;
}

/**
 * The picture for a building, if there is one. Homes of a size not yet painted borrow the nearest
 * size of the same architecture and envelope.
 */
export function structureArt(
  architecture: ArchitectureId,
  kind: StructureKind,
  home?: { size: HomeSize; envelope: Envelope },
): StructureArt | undefined {
  const exact = STRUCTURES[structureId(architecture, kind, home)];
  if (exact || kind !== 'homes' || !home) return exact;
  const order: HomeSize[] = home.size === 1 ? [2, 3] : home.size === 2 ? [1, 3] : [2, 1];
  for (const size of order) {
    const near = STRUCTURES[structureId(architecture, kind, { ...home, size })];
    if (near) return near;
  }
  return undefined;
}
