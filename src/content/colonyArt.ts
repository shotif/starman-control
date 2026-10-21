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

/** Published widths of each kind of picture, smallest for phones; props are drawn small. */
export const LANDSCAPE_WIDTHS = [1280, 2560] as const;
export const STRUCTURE_WIDTHS = [512, 1024] as const;
export const PROP_WIDTHS = [256, 512] as const;

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

/** Every home picture comes in three versions, so neighbouring homes differ (COLONY_VIEW.md §9.2). */
export type HomeVersion = 0 | 1 | 2;

/** A home: its size, whether it is sealed, and which version of the picture it shows. */
export interface HomeLook {
  size: HomeSize;
  envelope: Envelope;
  version?: HomeVersion;
}

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
      // Increment 18: the second and third versions of the homes (COLONY_VIEW.md §9.2), as wide
      // as their first versions.
      ['authority-homes-2-open-b', 1961 / 1370, 34],
      ['authority-homes-2-open-c', 1866 / 1554, 34],
      ['cooperative-homes-2-domed-b', 1827 / 1220, 40],
      ['cooperative-homes-2-domed-c', 1819 / 1337, 40],
      ['wake-homes-2-domed-b', 1894 / 953, 40],
      ['wake-homes-2-domed-c', 1903 / 1452, 40],
      ['authority-homes-1-domed-b', 1866 / 1605, 30],
      ['authority-homes-1-domed-c', 1677 / 1401, 30],
      ['authority-homes-1-open-b', 1809 / 932, 24],
      ['authority-homes-1-open-c', 1853 / 1107, 24],
      ['authority-homes-2-domed-b', 1867 / 1508, 40],
      ['authority-homes-2-domed-c', 1902 / 1776, 40],
      ['authority-homes-3-domed-b', 1372 / 1845, 50],
      ['authority-homes-3-domed-c', 1956 / 1653, 50],
      ['authority-homes-3-open-b', 1299 / 1916, 30],
      ['authority-homes-3-open-c', 1678 / 1881, 30],
      ['cooperative-homes-1-domed-b', 1845 / 1178, 30],
      ['cooperative-homes-1-domed-c', 1854 / 1414, 30],
      ['cooperative-homes-1-open-b', 1790 / 1185, 24],
      ['cooperative-homes-1-open-c', 1805 / 1519, 24],
      ['cooperative-homes-2-open-b', 1916 / 1435, 34],
      ['cooperative-homes-2-open-c', 1792 / 1707, 34],
      ['cooperative-homes-3-domed-b', 1746 / 1616, 50],
      ['cooperative-homes-3-domed-c', 1943 / 1468, 50],
      ['cooperative-homes-3-open-b', 1794 / 1833, 30],
      ['cooperative-homes-3-open-c', 1684 / 1865, 30],
      ['wake-homes-1-domed-b', 1873 / 1352, 30],
      ['wake-homes-1-domed-c', 1783 / 1640, 30],
      ['wake-homes-1-open-b', 1903 / 1223, 24],
      ['wake-homes-1-open-c', 1844 / 1254, 24],
      ['wake-homes-2-open-b', 1371 / 1620, 34],
      ['wake-homes-2-open-c', 1878 / 1263, 34],
      ['wake-homes-3-domed-b', 1403 / 1821, 50],
      ['wake-homes-3-domed-c', 1955 / 1560, 50],
      ['wake-homes-3-open-b', 1478 / 1941, 30],
      ['wake-homes-3-open-c', 1672 / 1813, 30],
    ] as const
  ).map(([id, aspect, metres]) => [id, { id, aspect, metres }]),
);

const VERSION_SUFFIX = ['', '-b', '-c'] as const;

/** The brief id a building would have: homes by size, envelope and version, the rest by architecture. */
export function structureId(architecture: ArchitectureId, kind: StructureKind, home?: HomeLook): string {
  if (kind === 'scaffold' || kind === 'fields') return kind;
  if (kind === 'homes')
    return `${architecture}-homes-${home?.size ?? 2}-${home?.envelope ?? 'open'}${VERSION_SUFFIX[home?.version ?? 0]}`;
  return `${architecture}-${kind}`;
}

/** The picture for a building, if there is one; a home's version with no picture yet shows the first. */
export function structureArt(
  architecture: ArchitectureId,
  kind: StructureKind,
  home?: HomeLook,
): StructureArt | undefined {
  const art = STRUCTURES[structureId(architecture, kind, home)];
  if (art || kind !== 'homes' || !home?.version) return art;
  return STRUCTURES[structureId(architecture, kind, { ...home, version: 0 })];
}

/** Small pieces between the buildings (COLONY_VIEW.md §9.3): some in each power's architecture, some shared. */
export type PropKind =
  | 'water-tanks'
  | 'mast'
  | 'cargo'
  | 'greenhouse'
  | 'monument'
  | 'solar-field'
  | 'landing-beacon'
  | 'supply-crates'
  | 'storage-spheres'
  | 'wind-turbines'
  | 'radiators'
  | 'orchard'
  | 'ore-heap'
  | 'gas-well'
  | 'regolith-plant';

/** The props built in each power's own architecture; the rest are shared. */
export const OWN_PROPS: readonly PropKind[] = ['water-tanks', 'mast', 'cargo', 'greenhouse', 'monument'];

/** How wide each prop is in the world, in metres. */
export const PROP_METRES: Record<PropKind, number> = {
  'water-tanks': 10,
  mast: 7,
  cargo: 14,
  greenhouse: 16,
  monument: 10,
  'solar-field': 22,
  'landing-beacon': 6,
  'supply-crates': 7,
  'storage-spheres': 12,
  'wind-turbines': 18,
  radiators: 14,
  orchard: 18,
  'ore-heap': 14,
  'gas-well': 10,
  'regolith-plant': 14,
};

/** Every prop picture there is, by its brief id, with its cut-out's width over height. */
export const PROPS: Record<string, StructureArt> = Object.fromEntries(
  (
    [
      ['authority-cargo', 'cargo', 1678 / 1438],
      ['authority-mast', 'mast', 650 / 1832],
      ['authority-monument', 'monument', 789 / 1742],
      ['cooperative-greenhouse', 'greenhouse', 1772 / 1631],
      ['cooperative-mast', 'mast', 717 / 1856],
      ['cooperative-monument', 'monument', 1611 / 1641],
      ['wake-greenhouse', 'greenhouse', 1755 / 1477],
      ['wake-mast', 'mast', 1317 / 1866],
      ['wake-monument', 'monument', 1306 / 1843],
      ['landing-beacon', 'landing-beacon', 844 / 1809],
      ['solar-field', 'solar-field', 1788 / 816],
      ['storage-spheres', 'storage-spheres', 1635 / 1618],
      ['supply-crates', 'supply-crates', 1737 / 1272],
      ['authority-greenhouse', 'greenhouse', 1779 / 1136],
      ['authority-water-tanks', 'water-tanks', 1411 / 1800],
      ['cooperative-cargo', 'cargo', 1652 / 1499],
      ['cooperative-water-tanks', 'water-tanks', 1645 / 1467],
      ['gas-well', 'gas-well', 1499 / 1671],
      ['orchard', 'orchard', 1888 / 1064],
      ['ore-heap', 'ore-heap', 1819 / 1072],
      ['radiators', 'radiators', 1733 / 1418],
      ['regolith-plant', 'regolith-plant', 1642 / 1552],
      ['wake-cargo', 'cargo', 1698 / 1721],
      ['wake-water-tanks', 'water-tanks', 1742 / 1582],
      ['wind-turbines', 'wind-turbines', 878 / 1842],
    ] as const
  ).map(([id, kind, aspect]) => [id, { id, aspect, metres: PROP_METRES[kind] }]),
);

/** The brief id of a prop: the power's own, or the shared one. */
export function propId(architecture: ArchitectureId, kind: PropKind): string {
  return OWN_PROPS.includes(kind) ? `${architecture}-${kind}` : kind;
}

/** The picture for a prop, if there is one. */
export function propArt(architecture: ArchitectureId, kind: PropKind): StructureArt | undefined {
  return PROPS[propId(architecture, kind)];
}

/** How a metre is drawn, as a share of the picture's width per unit of depth below the horizon (colonyPlace). */
const METRE = 0.0105;

/** A box on the picture, in heights (across times the aspect, and down). */
export interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Something standing with its front middle at (u, v), `w` of the width across and `h` of the height tall. */
export function boxOf(p: { u: number; v: number; w: number; h: number }, aspect: number): Box {
  return { x0: (p.u - p.w / 2) * aspect, x1: (p.u + p.w / 2) * aspect, y0: p.v - p.h, y1: p.v };
}

export function overlapOf(a: Box, b: Box): number {
  return (
    Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0))
  );
}

/**
 * Whether a prop's box sits clear of a building's (COLONY_VIEW.md §9.3): in front of it, it may
 * hide no more than a little of its foot; behind it, no more than half of the prop is hidden.
 */
export function clearOf(prop: Box, building: Box): boolean {
  const o = overlapOf(prop, building);
  if (o <= 0) return true;
  const tall = building.y1 - building.y0;
  if (prop.y1 > building.y1)
    return o <= 0.12 * (building.x1 - building.x0) * tall && prop.y0 >= building.y1 - 0.4 * tall;
  return o <= 0.5 * (prop.x1 - prop.x0) * (prop.y1 - prop.y0);
}

const spotCache = new Map<string, (readonly [number, number])[]>();

/**
 * Where props may stand on a landscape (COLONY_VIEW.md §9.3): by each slot's front corners, as wide
 * apart as a home of 34 metres, a step in front of its foot; never in a slot itself. In the order
 * the town fills its slots, so a colony's first props stand by its first buildings.
 */
export function propSpots(land: LandscapeArt): (readonly [number, number])[] {
  const cached = spotCache.get(land.id);
  if (cached) return cached;
  const spots: (readonly [number, number])[] = [];
  const round = (x: number) => Math.round(x * 1000) / 1000;
  for (const [u, v] of land.slots) {
    const half = (34 * METRE * (v - land.horizon)) / 2;
    for (const side of [-1, 1]) spots.push([round(u + side * half), round(v + 0.006)]);
  }
  spotCache.set(land.id, spots);
  return spots;
}
