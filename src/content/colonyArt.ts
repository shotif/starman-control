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

/**
 * Where buildings stand on a landscape whose flat ground is a plain box: the shore's hand-placed
 * slots, as [across, depth] within that box from 0 to 1, so every landscape keeps the same town.
 */
const PATTERN: readonly (readonly [number, number])[] = [
  [0.46, 0.43],
  [0.19, 0.64],
  [0.62, 0.32],
  [0.77, 0.18],
  [0.32, 0.29],
  [0.69, 0.64],
  [0.4, 0.75],
  [0.92, 0.29],
  [0.17, 0.25],
  [0.04, 0.93],
  [0.56, 0.86],
  [0.97, 0.07],
];

/** A landscape whose flat ground lies between `left` and `right` across, and `back` and `front` down. */
function landscape(
  id: string,
  horizon: number,
  ground: { left: number; right: number; back: number; front: number },
): LandscapeArt {
  const round = (x: number) => Math.round(x * 1000) / 1000;
  return {
    id,
    aspect: 3168 / 1344,
    horizon,
    slots: PATTERN.map(([x, d]) => [
      round(ground.left + x * (ground.right - ground.left)),
      round(ground.back + d * (ground.front - ground.back)),
    ]),
  };
}

export const LANDSCAPES: Record<Biome, LandscapeArt> = {
  shore: {
    id: 'landscape-shore',
    aspect: 3168 / 1344,
    horizon: 0.31,
    // Placed by hand round the slope in the near right.
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
  garden: landscape('landscape-garden', 0.3, { left: 0.08, right: 0.78, back: 0.45, front: 0.78 }),
  steppe: landscape('landscape-steppe', 0.27, { left: 0.1, right: 0.9, back: 0.42, front: 0.78 }),
  desert: landscape('landscape-desert', 0.33, { left: 0.2, right: 0.8, back: 0.45, front: 0.8 }),
  inferno: landscape('landscape-inferno', 0.34, { left: 0.1, right: 0.9, back: 0.48, front: 0.82 }),
  tundra: landscape('landscape-tundra', 0.4, { left: 0.3, right: 0.95, back: 0.5, front: 0.8 }),
  ice: landscape('landscape-ice', 0.29, { left: 0.08, right: 0.82, back: 0.42, front: 0.8 }),
  airless: landscape('landscape-airless', 0.3, { left: 0.2, right: 0.88, back: 0.42, front: 0.8 }),
  haze: landscape('landscape-haze', 0.35, { left: 0.05, right: 0.72, back: 0.46, front: 0.72 }),
};

/** Homes come in three sizes: small houses, blocks, towers (COLONY_VIEW.md §3). */
export type HomeSize = 1 | 2 | 3;

/** Open to the air on a comfortable world; sealed under domes elsewhere. */
export type Envelope = 'open' | 'domed';

/** Built things; `rig` is an outpost's, `fields` an open-air colony's farmland. */
export type StructureKind = ProjectId | 'homes' | 'hall' | 'scaffold' | 'rig' | 'fields';

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
      ['authority-homes-1-domed', 1949 / 1821, 30],
      ['authority-homes-1-open', 1885 / 1487, 24],
      ['authority-homes-2-domed', 1806 / 1819, 40],
      ['authority-homes-2-open', 1860 / 1549, 34],
      ['authority-homes-3-domed', 1966 / 1899, 50],
      ['authority-homes-3-open', 1842 / 1858, 30],
      ['authority-lane-station', 1621 / 1656, 26],
      ['authority-mine', 1834 / 1424, 32],
      ['authority-shipyard', 1887 / 1095, 46],
      ['authority-survey-station', 1949 / 1400, 30],
      ['cooperative-homes-1-domed', 1865 / 1565, 30],
      ['cooperative-homes-1-open', 1839 / 1125, 24],
      ['cooperative-homes-2-domed', 1832 / 1522, 40],
      ['cooperative-homes-2-open', 1813 / 1593, 34],
      ['cooperative-homes-3-domed', 1888 / 1687, 50],
      ['cooperative-homes-3-open', 1734 / 1712, 30],
      ['cooperative-lane-station', 1758 / 1598, 26],
      ['cooperative-mine', 1833 / 1429, 32],
      ['cooperative-shipyard', 1874 / 1362, 46],
      ['cooperative-survey-station', 1865 / 1080, 30],
      ['scaffold', 1764 / 1822, 22],
      ['wake-homes-1-domed', 1574 / 1456, 30],
      ['wake-homes-1-open', 1766 / 1542, 24],
      ['wake-homes-2-domed', 1894 / 1398, 40],
      ['wake-homes-2-open', 1588 / 1737, 34],
      ['wake-homes-3-domed', 1413 / 1764, 50],
      ['wake-homes-3-open', 1200 / 1839, 30],
      ['wake-lane-station', 1584 / 1723, 26],
      ['wake-mine', 1814 / 1725, 32],
      ['wake-shipyard', 1906 / 1369, 46],
      ['wake-survey-station', 1714 / 1652, 30],
      // Vehicles (increment 16): each power's shuttle, and the rover every power drives.
      ['authority-shuttle', 1756 / 1256, 22],
      ['cooperative-shuttle', 1627 / 1389, 22],
      ['wake-shuttle', 1812 / 1049, 22],
      ['rover', 1769 / 1259, 9],
      // Increment 17: each power's capital hall and outpost rig, and the fields every power farms.
      ['authority-hall', 1834 / 1713, 46],
      ['cooperative-hall', 1853 / 1392, 46],
      ['wake-hall', 1832 / 1704, 46],
      ['authority-rig', 1772 / 1523, 34],
      ['cooperative-rig', 1897 / 1543, 34],
      ['wake-rig', 1845 / 1302, 34],
      ['fields', 1881 / 1193, 40],
    ] as const
  ).map(([id, aspect, metres]) => [id, { id, aspect, metres }]),
);

/** The brief id a building would have: homes by size and envelope, the rest by architecture. */
export function structureId(
  architecture: ArchitectureId,
  kind: StructureKind,
  home?: { size: HomeSize; envelope: Envelope },
): string {
  if (kind === 'scaffold' || kind === 'fields') return kind;
  if (kind === 'homes') return `${architecture}-homes-${home?.size ?? 2}-${home?.envelope ?? 'open'}`;
  return `${architecture}-${kind}`;
}

/** The picture for a building, if there is one. */
export function structureArt(
  architecture: ArchitectureId,
  kind: StructureKind,
  home?: { size: HomeSize; envelope: Envelope },
): StructureArt | undefined {
  return STRUCTURES[structureId(architecture, kind, home)];
}
