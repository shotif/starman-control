// What a colony's scene shows (docs/design/COLONY_VIEW.md §1, §2): its world's ground and sky, its
// sun, its buildings in their slots, what is being built, and how many people walk about, all
// worked out from the game. Pure, so it is tested without a browser, like systemLayout; the
// renderer's numbers, not the simulation's, so fractions are fine. Nothing here knows which power
// the player is: a holding's owner names its architecture (D-08, D-28).

import {
  type Biome,
  type Envelope,
  type HomeLook,
  type HomeSize,
  type HomeVersion,
  LANDSCAPES,
  type PropKind,
  type StructureKind,
  slotAt,
} from '../content/colonyArt.ts';
import { type District, ZONE_DEFS, type Zone } from '../content/districts.ts';
import { type ArchitectureId, FACTIONS, type FactionMark } from '../content/factions.ts';
import { type ProjectId, projectWords, withArticle } from '../content/projects.ts';
import type { Atmosphere, Body } from '../sim/bodies.ts';
import { bodiesOf } from '../sim/bodies.ts';
import { bodyOf, costOf, districtCount, levelOf } from '../sim/economy.ts';
import { estimateStar } from '../sim/starLight.ts';
import { type StarClass, starClass } from '../sim/stars.ts';
import type { GameState, Holding } from '../sim/state.ts';
import type { World } from '../sim/world.ts';

export interface SceneBuilding {
  kind: StructureKind;
  /** For a project or its scaffold. */
  project?: ProjectId;
  /** For a district, or a scaffold zoning one (M2_WORLDS.md §15). */
  district?: Zone;
  home?: HomeLook;
  /** Which of the landscape's slots it stands in. */
  slot: number;
  /** A scaffold: the share of its industry already put in, 0 to 1. */
  progress?: number;
}

/** A small piece between the buildings (COLONY_VIEW.md §9.3); where it stands is worked out when it is placed. */
export interface SceneProp {
  kind: PropKind;
}

export interface SceneSky {
  atmosphere: Atmosphere;
  /** By day: the top of the sky and the horizon. */
  zenith: string;
  horizon: string;
  /** Stars are seen by day (there is no air to hide them). */
  starsByDay: boolean;
  /** How much haze lies over the far land, 0 to 1. */
  haze: number;
}

export interface SceneSun {
  colour: string;
  /** The disc's size against the Sun's as seen from Earth. */
  size: number;
  /** Tidally locked: the sun stands still low over the horizon (the twilight band). */
  locked: boolean;
  /** A flare star: the light now and then flickers brighter. */
  flare: boolean;
  /** "yellow", "red"… for the description. */
  word: string;
}

export interface ColonyScene {
  holding: number;
  name: string;
  biome: Biome;
  sky: SceneSky;
  sun: SceneSun;
  /** For a moon: the planet hanging in its sky. */
  parent?: { id: string; name: string; kind: Body['kind'] };
  envelope: Envelope;
  architecture: ArchitectureId;
  /** The owner's colour, for lights and markings, and its mark, shown with it above the capital's hall. */
  colour: string;
  mark: FactionMark;
  outpost: boolean;
  /** How many slots the scene lays out (the world's size, or more if its buildings need them). */
  slots: number;
  buildings: SceneBuilding[];
  /** Small pieces between the buildings; left out where they would cover one. */
  props: SceneProp[];
  /** People to draw walking about. */
  people: number;
  /** The scene in words, for screen readers. */
  description: string;
}

/** The ground of a world (COLONY_VIEW.md §3): the first rule that fits. */
export function biomeOf(b: Pick<Body, 'temperature' | 'atmosphere' | 'water'>): Biome {
  if (b.temperature === 'scorching') return 'inferno';
  if (b.atmosphere === 'toxic') return 'haze';
  if (b.atmosphere === 'none') return b.temperature === 'frozen' && b.water === 'ice' ? 'ice' : 'airless';
  if (b.temperature === 'frozen') return 'ice';
  if (b.temperature === 'hot') return 'desert';
  if (b.temperature === 'cold') return 'tundra';
  if (b.water === 'oceans') return b.temperature === 'warm' ? 'shore' : 'garden';
  return 'steppe';
}

const SKIES: Record<Atmosphere, Omit<SceneSky, 'atmosphere'>> = {
  none: { zenith: '#020308', horizon: '#0a0c14', starsByDay: true, haze: 0 },
  thin: { zenith: '#232c4c', horizon: '#c4b49c', starsByDay: false, haze: 0.2 },
  dense: { zenith: '#3b6cab', horizon: '#d3e2ee', starsByDay: false, haze: 0.45 },
  toxic: { zenith: '#5e5f26', horizon: '#d8cf88', starsByDay: false, haze: 0.8 },
};

const SUN_WORD: Record<StarClass, string> = {
  O: 'blue',
  B: 'blue-white',
  A: 'white',
  F: 'yellow-white',
  G: 'yellow',
  K: 'orange',
  M: 'red',
  D: 'small white',
  L: 'dim red',
  T: 'dim red',
  Y: 'dim red',
  '?': 'pale',
};

/** "#rrggbb" mixed with another by t (0: a, 1: b). */
export function mixHex(a: string, b: string, t: number): string {
  const p = (h: string, i: number) => Number.parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** The size of a colony's homes (COLONY_VIEW.md §1): small houses below 3 million, blocks to 15 million, towers beyond. */
export function homeSize(peopleTenths: number): HomeSize {
  const m = peopleTenths / 10;
  return m < 3 ? 1 : m < 15 ? 2 : 3;
}

/** The building a district shows (M2_WORLDS.md §15): farms as fields or under glass, a mine, works, labs, a market. */
export function districtKind(zone: Zone, envelope: Envelope): StructureKind {
  switch (zone) {
    case 'farms':
      return envelope === 'open' ? 'fields' : 'greenhouse-farms';
    case 'mines':
      return 'mine';
    case 'housing':
      return 'homes';
    default:
      return zone;
  }
}

/**
 * Which version of its picture each home shows (COLONY_VIEW.md §9.2): from the colony's id and the
 * home's place, avoiding the versions of the two nearest homes already standing. Homes are added
 * in order as the colony grows, so a home's version never changes.
 */
export function homeVersions(id: number, slots: readonly (readonly [number, number])[], aspect: number): HomeVersion[] {
  const out: HomeVersion[] = [];
  slots.forEach(([u, v], k) => {
    const near = slots
      .slice(0, k)
      .map(([u2, v2], j) => ({ j, d: Math.hypot((u - u2) * aspect, v - v2) }))
      .sort((a, b) => a.d - b.d || a.j - b.j)
      .slice(0, 2)
      .map((x) => out[x.j]);
    const first = (id + k) % 3;
    const pick = [0, 1, 2].map((n) => ((first + n) % 3) as HomeVersion).find((n) => !near.includes(n));
    out.push(pick ?? (first as HomeVersion));
  });
  return out;
}

/** The props in the order a colony gains them: the monument, the power's own pieces, then the shared ones. */
const PROP_ORDER: readonly PropKind[] = [
  'water-tanks',
  'mast',
  'greenhouse',
  'cargo',
  'solar-field',
  'landing-beacon',
  'storage-spheres',
  'supply-crates',
  'wind-turbines',
  'radiators',
  'orchard',
  'ore-heap',
  'gas-well',
  'regolith-plant',
];

/** Which props suit a holding (COLONY_VIEW.md §9.3), and how many it shows. */
export function propsFor(
  h: Pick<Holding, 'id' | 'kind' | 'capital' | 'people'>,
  body: Pick<Body, 'atmosphere' | 'riches'>,
  biome: Biome,
  envelope: Envelope,
): PropKind[] {
  const outpost = h.kind === 'outpost';
  const fits: Record<PropKind, boolean> = {
    monument: h.capital,
    'water-tanks': !outpost,
    mast: !outpost,
    cargo: !outpost,
    'storage-spheres': !outpost,
    greenhouse: !outpost && (envelope === 'domed' || biome === 'tundra'),
    'solar-field': biome !== 'haze',
    'landing-beacon': true,
    'supply-crates': true,
    'wind-turbines': !outpost && envelope === 'open' && (body.atmosphere === 'thin' || body.atmosphere === 'dense'),
    radiators: biome === 'airless' || biome === 'desert' || biome === 'inferno',
    orchard: !outpost && envelope === 'open' && (biome === 'garden' || biome === 'shore' || biome === 'steppe'),
    'ore-heap': body.riches.metals === 2,
    'gas-well': body.riches.volatiles === 2,
    'regolith-plant': body.riches.fuel === 2,
  };
  const list = PROP_ORDER.filter((k) => fits[k]);
  const turn = list.length > 0 ? h.id % list.length : 0;
  const turned = [...(fits.monument ? (['monument'] as const) : []), ...list.slice(turn), ...list.slice(0, turn)];
  const count = outpost ? 3 : 2 + Math.floor(h.people / 20);
  return turned.slice(0, count);
}

/** A district's building in words, one and many: "2 farms, 3 works, a mine". */
const DISTRICT_WORDS: Record<Zone, readonly [string, string]> = {
  farms: ['farm', 'farms'],
  works: ['works', 'works'],
  mines: ['mine', 'mines'],
  labs: ['lab', 'labs'],
  market: ['market', 'markets'],
  housing: ['housing district', 'housing districts'],
};

/** "a shipyard, a lane station and a mine". */
function listWords(words: string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
}

function article(word: string): string {
  return withArticle(word);
}

export function colonyScene(world: World, game: GameState, h: Holding): ColonyScene | null {
  const body = bodyOf(world, game, h);
  if (!body) return null;
  const system = world.system(h.system);
  const star = system.sky.stars.find((s) => s.id === body.star) ?? system.sky.stars[0];
  if (!star) return null;
  const faction = FACTIONS[h.owner];
  // As terraformed (M2B_SCIENCE.md §18.3): a world made comfortable shows the open sky.
  const level = levelOf(world, game, h);
  const envelope: Envelope = level === 'comfortable' ? 'open' : 'domed';
  const outpost = h.kind === 'outpost';

  // Sky and sun.
  const base = SKIES[body.atmosphere];
  const tint = body.atmosphere === 'none' ? 0 : 0.22;
  const sky: SceneSky = {
    atmosphere: body.atmosphere,
    ...base,
    zenith: mixHex(base.zenith, star.colorHex, tint * 0.5),
    horizon: mixHex(base.horizon, star.colorHex, tint),
  };
  const est = estimateStar(star.id, star.spectralType);
  const au = Math.max(0.005, body.orbitMilliAu / 1000);
  const cls = starClass(star.spectralType);
  const sun: SceneSun = {
    colour: star.colorHex,
    size: Math.round(((est.radius ?? 0.3) / au) * 100) / 100,
    locked: body.locked,
    flare: body.flareExposed,
    word: SUN_WORD[cls],
  };
  const parentBody = body.parent ? bodiesOf(world, game.seed, h.system).find((b) => b.id === body.parent) : undefined;

  // Buildings (M2_WORLDS.md §15): the middle slot holds the capital's hall, an outpost's rig or a
  // colony's first homes; each district stands in its own slot as its zone's building (housing as
  // homes); projects stand in the slots after the colony's land, in the order they were finished,
  // then in a ring round the town; a scaffold stands where what is being built will stand.
  const buildings: SceneBuilding[] = [];
  const land = LANDSCAPES[biomeOf(body)];
  const first = h.queue[0];
  const progress = () => {
    if (!first) return 0;
    const cost = costOf(world, game, h, first).industry;
    return cost > 0 ? Math.min(1, h.industry / cost) : 0;
  };
  if (outpost) buildings.push({ kind: 'rig', slot: 0 });
  else if (h.capital) buildings.push({ kind: 'hall', slot: 0 });
  const homeSlots = [
    ...(outpost || h.capital ? [] : [0]),
    ...h.districts
      .filter((d) => d.zone === 'housing')
      .map((d) => d.slot)
      .sort((a, b) => a - b),
  ];
  const versions = homeVersions(
    h.id,
    homeSlots.map((slot) => slotAt(land, slot) ?? ([0.5, 0.5] as const)),
    land.aspect,
  );
  const size = homeSize(h.people);
  const home = (slot: number): SceneBuilding => ({
    kind: 'homes',
    home: { size, envelope, version: versions[homeSlots.indexOf(slot)] ?? 0 },
    slot,
    ...(slot > 0 ? { district: 'housing' as const } : {}),
  });
  if (!outpost && !h.capital) buildings.push(home(0));
  const zoning = first?.kind === 'zone' ? first : undefined;
  for (const d of h.districts as District[]) {
    if (zoning?.slot === d.slot) continue;
    if (d.zone === 'housing') buildings.push(home(d.slot));
    else buildings.push({ kind: districtKind(d.zone, envelope), district: d.zone, slot: d.slot });
  }
  if (zoning) buildings.push({ kind: 'scaffold', district: zoning.zone, slot: zoning.slot, progress: progress() });
  const after = outpost ? 1 : districtCount(world, game, h) + 1;
  h.projects.forEach((p, i) => {
    buildings.push({ kind: p, project: p, slot: after + i });
  });
  if (first?.kind === 'project')
    buildings.push({ kind: 'scaffold', project: first.project, slot: after + h.projects.length, progress: progress() });
  const slots = Math.max(...buildings.map((b) => b.slot + 1), 1);
  buildings.sort((a, b) => a.slot - b.slot);

  // In words.
  const millions = Math.round(h.people / 10);
  const place = outpost
    ? 'an automated outpost'
    : `${envelope === 'domed' ? 'a domed' : 'an open-air'} ${millions >= 10 ? 'city' : 'town'} of about ${Math.max(1, millions)} million`;
  const built = h.projects.map((p) => projectWords(p));
  const zoned = h.districts.filter((d) => d.zone !== 'housing');
  if (zoned.length > 0) {
    const counts = new Map<Zone, number>();
    for (const d of zoned) counts.set(d.zone, (counts.get(d.zone) ?? 0) + 1);
    built.unshift(
      ...[...counts].map(([z, n]) => (n === 1 ? article(DISTRICT_WORDS[z][0]) : `${n} ${DISTRICT_WORDS[z][1]}`)),
    );
  }
  const skyWords =
    body.atmosphere === 'none' ? ' in a black sky' : body.atmosphere === 'toxic' ? ' through a choking haze' : '';
  const parts = [`${body.name}: ${place} under ${article(sun.word)} sun${skyWords}`];
  if (built.length > 0) parts[0] += `, with ${listWords(built)}`;
  if (first?.kind === 'project') parts.push(`${projectWords(first.project)} is being built`);
  if (first?.kind === 'zone') parts.push(`a district is being zoned for ${ZONE_DEFS[first.zone].name.toLowerCase()}`);
  const description = `${parts.join('; ')}.`;

  return {
    holding: h.id,
    name: body.name,
    biome: biomeOf(body),
    sky,
    sun,
    ...(parentBody ? { parent: { id: parentBody.id, name: parentBody.name, kind: parentBody.kind } } : {}),
    envelope,
    architecture: faction.architecture,
    colour: faction.colour,
    mark: faction.mark,
    outpost,
    slots,
    buildings,
    props: propsFor(h, body, biomeOf(body), envelope).map((kind) => ({ kind })),
    people: outpost ? 0 : Math.min(40, Math.max(2, Math.round((h.people / 10) * 3))),
    description,
  };
}
