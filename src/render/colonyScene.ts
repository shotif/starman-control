// What a colony's scene shows (docs/design/COLONY_VIEW.md §1, §2): its world's ground and sky, its
// sun, its buildings in their slots, what is being built, and how many people walk about, all
// worked out from the game. Pure, so it is tested without a browser, like systemLayout; the
// renderer's numbers, not the simulation's, so fractions are fine. Nothing here knows which power
// the player is: a holding's owner names its architecture (D-08, D-28).

import type { Biome, Envelope, HomeSize, StructureKind } from '../content/colonyArt.ts';
import { type ArchitectureId, FACTIONS } from '../content/factions.ts';
import { PROJECTS, type ProjectId } from '../content/projects.ts';
import type { Atmosphere, Body } from '../sim/bodies.ts';
import { bodiesOf } from '../sim/bodies.ts';
import { bodyOf, costOf } from '../sim/economy.ts';
import { habitability } from '../sim/habitability.ts';
import { speciesFor } from '../sim/research.ts';
import { estimateStar } from '../sim/starLight.ts';
import { type StarClass, starClass } from '../sim/stars.ts';
import type { GameState, Holding } from '../sim/state.ts';
import type { World } from '../sim/world.ts';

export interface SceneBuilding {
  kind: StructureKind;
  /** For a project or its scaffold. */
  project?: ProjectId;
  home?: { size: HomeSize; envelope: Envelope };
  /** Which of the landscape's slots it stands in. */
  slot: number;
  /** A scaffold: the share of its industry already put in, 0 to 1. */
  progress?: number;
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
  /** The owner's colour, for lights and markings. */
  colour: string;
  outpost: boolean;
  /** How many slots the scene lays out (the world's size, or more if its buildings need them). */
  slots: number;
  buildings: SceneBuilding[];
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

/**
 * Homes for the people (COLONY_VIEW.md §1): one for every 4 million, at least one; small houses
 * below 3 million, blocks to 15 million, towers beyond; the newest home a size smaller.
 */
export function homesFor(peopleTenths: number, room: number): HomeSize[] {
  const m = peopleTenths / 10;
  const count = Math.max(1, Math.min(room, Math.ceil(m / 4)));
  const size: HomeSize = m < 3 ? 1 : m < 15 ? 2 : 3;
  return Array.from({ length: count }, (_, i) =>
    i > 0 && i === count - 1 ? (Math.max(1, size - 1) as HomeSize) : size,
  );
}

/** "a shipyard, a lane station and a mine". */
function listWords(words: string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
}

function article(word: string): string {
  return /^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`;
}

export function colonyScene(world: World, game: GameState, h: Holding): ColonyScene | null {
  const body = bodyOf(world, game, h);
  if (!body) return null;
  const system = world.system(h.system);
  const star = system.sky.stars.find((s) => s.id === body.star) ?? system.sky.stars[0];
  if (!star) return null;
  const faction = FACTIONS[h.owner];
  const level = habitability(body, speciesFor(game, h.owner)).level;
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

  // Buildings: homes in the even slots from the centre outwards, projects in the odd ones in the
  // order they were finished, so nothing moves as the colony grows; the scaffold stands where the
  // project it is building will stand.
  const buildings: SceneBuilding[] = [];
  h.projects.forEach((p, i) => {
    buildings.push({ kind: p, project: p, slot: 2 * i + 1 });
  });
  const first = h.queue[0];
  if (first?.kind === 'project') {
    const cost = costOf(world, game, h, first).industry;
    buildings.push({
      kind: 'scaffold',
      project: first.project,
      slot: 2 * h.projects.length + 1,
      progress: cost > 0 ? Math.min(1, h.industry / cost) : 0,
    });
  }
  const needed = buildings.reduce((n, b) => Math.max(n, b.slot + 1), 1);
  const slots = Math.min(12, Math.max(body.size, needed, 2));
  if (!outpost) {
    const room = Math.max(1, Math.ceil(slots / 2));
    homesFor(h.people, room).forEach((size, i) => {
      buildings.push({ kind: 'homes', home: { size, envelope }, slot: 2 * i });
    });
  }
  buildings.sort((a, b) => a.slot - b.slot);

  // In words.
  const millions = Math.round(h.people / 10);
  const place = outpost
    ? 'an automated outpost'
    : `${envelope === 'domed' ? 'a domed' : 'an open-air'} ${millions >= 10 ? 'city' : 'town'} of about ${Math.max(1, millions)} million`;
  const built = h.projects.map((p) => article(PROJECTS[p].name.toLowerCase()));
  const skyWords =
    body.atmosphere === 'none' ? ' in a black sky' : body.atmosphere === 'toxic' ? ' through a choking haze' : '';
  const parts = [`${body.name}: ${place} under ${article(sun.word)} sun${skyWords}`];
  if (built.length > 0) parts[0] += `, with ${listWords(built)}`;
  if (first?.kind === 'project') parts.push(`${article(PROJECTS[first.project].name.toLowerCase())} is being built`);
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
    outpost,
    slots,
    buildings,
    people: outpost ? 0 : Math.min(40, Math.max(2, Math.round((h.people / 10) * 3))),
    description,
  };
}
