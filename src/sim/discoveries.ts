// Discoveries (M2B_SCIENCE.md §17, D-45): inspirations, a deed for every technology that teaches a
// power part of it once; and observations of the real sky, research for the first survey of a
// system holding something astronomers have observed. Both are earned by every power by the same
// rules. Pure and in whole numbers.

import { ANOMALIES } from '../content/anomalies.ts';
import { type FactionId, STARTING_FACTIONS } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import { isHull, STARTING_FLEET } from '../content/ships.ts';
import { SOL_BODIES } from '../content/sol.ts';
import { type Deed, TECH_IDS, TECHS, type TechId } from '../content/techs.ts';
import type { SystemId } from '../data/types.ts';
import { anomalyAt } from './anomalies.ts';
import { bodiesOf } from './bodies.ts';
import {
  approvalOf,
  bodyOf,
  capacityOf,
  foodOf,
  industryOf,
  jumpsFromCapital,
  levelOf,
  researchOf,
  worked,
} from './economy.ts';
import { habitability } from './habitability.ts';
import { homeWebs } from './homeWeb.ts';
import { keysHeld } from './keys.ts';
import type { ReportEvent } from './report.ts';
import { closedBy, effects, learn, speciesFor, techCost } from './research.ts';
import { starClass } from './stars.ts';
import { type GameState, type PowerState, powerOf } from './state.ts';
import { type LaneId, laneEnds, type World } from './world.ts';

// ---------------------------------------------------------------- observations

/** What astronomers have observed in a system that a first survey pays for (§17.2). */
export type ObservationKind = 'white-dwarf' | 'disc' | 'brown-dwarf' | 'flare-star' | 'planets' | 'many-stars';

export const OBSERVATION_KINDS: readonly ObservationKind[] = [
  'white-dwarf',
  'disc',
  'brown-dwarf',
  'flare-star',
  'planets',
  'many-stars',
];

/** The planets astronomers have found in a system, with what the archives say of each: Sol's own too. */
function observedPlanets(world: World, system: SystemId): string[] {
  if (system === 'sol')
    return SOL_BODIES.filter((b) => b.kind === 'rocky' || b.kind === 'gas-giant' || b.kind === 'ice-giant').map(
      (b) => b.name,
    );
  return world
    .system(system)
    .sky.planets.map(
      (p) => `${p.name}${p.status === 'contested' ? ' (contested)' : p.status === 'candidate' ? ' (a candidate)' : ''}`,
    );
}

/** The observations of a system, from the game's sky data, in the order above. */
export function observationsAt(world: World, system: SystemId): ObservationKind[] {
  const sky = world.system(system).sky;
  const found: ObservationKind[] = [];
  if (sky.stars.some((s) => starClass(s.spectralType) === 'D')) found.push('white-dwarf');
  if (sky.belts.length > 0) found.push('disc');
  if (sky.stars.some((s) => ['L', 'T', 'Y'].includes(starClass(s.spectralType)))) found.push('brown-dwarf');
  if (sky.stars.some((s) => s.flareVariable)) found.push('flare-star');
  if (observedPlanets(world, system).length > 0) found.push('planets');
  if (sky.stars.length >= RULES.discoveries.manyStars) found.push('many-stars');
  return found;
}

/** Research a power gains for observations: more with Interferometry (M2B_SCIENCE.md §18.2). */
export function observationPoints(state: GameState, faction: FactionId, found: readonly ObservationKind[]): number {
  const base = found.reduce((n, k) => n + RULES.discoveries.observations[k], 0);
  let more = effects(state, faction, 'observation-percent').reduce((n, e) => n + e.percent, 0);
  // The Long Array (M2B_SCIENCE.md §20.2).
  if (state.holdings.some((h) => h.owner === faction && h.projects.includes('long-array')))
    more += RULES.greatWorks.arrayObservationPercent;
  return base + Math.floor((base * more) / 100);
}

// ---------------------------------------------------------------- inspirations

/** Points an inspiration gives towards its technology: 40% of its cost to the power now, rounded down. */
export function inspirationPoints(state: GameState, power: PowerState, tech: TechId): number {
  return Math.floor((techCost(state, power, tech) * RULES.discoveries.inspirationPercent) / 100);
}

/** Each power's home-web lanes, worked out once for a world: its relit lanes are Reborn's others. */
const homeLanes = new WeakMap<World, Map<FactionId, Set<LaneId>>>();

function homeLanesOf(world: World, faction: FactionId): Set<LaneId> {
  let byPower = homeLanes.get(world);
  if (!byPower) {
    const webs = homeWebs(
      world,
      STARTING_FACTIONS.map((f) => ({ faction: f.id, capital: f.capital.systemId })),
    );
    byPower = new Map(webs.map((w) => [w.faction, new Set(w.lanes)]));
    homeLanes.set(world, byPower);
  }
  return byPower.get(faction) ?? new Set();
}

/** Whether a power has done a deed: this turn, from its report's events, or as the state stands. */
export function deedDone(
  world: World,
  state: GameState,
  faction: FactionId,
  deed: Deed,
  events: readonly ReportEvent[],
): boolean {
  const power = powerOf(state, faction);
  const mine = state.holdings.filter((h) => h.owner === faction);
  const colonies = mine.filter((h) => h.kind === 'colony');
  const founded = colonies.filter((h) => !h.capital);
  switch (deed.kind) {
    case 'lane-paid':
      return events.some((e) => {
        if (e.kind !== 'lane-begun') return false;
        const from = state.holdings.find((h) => h.id === e.holding);
        return from !== undefined && world.distanceDeci(from.system, e.to) >= deed.deci;
      });
    case 'blind-landing':
      return events.some((e) => e.kind === 'landed');
    case 'relit-lanes': {
      const home = homeLanesOf(world, faction);
      const relit = state.lanes.filter(
        (l) => l.owner === faction && !home.has(l.id) && world.catalogueLane(...laneEnds(l.id)) !== undefined,
      );
      return relit.length >= deed.n;
    }
    case 'survey-harsh': {
      const species = speciesFor(state, faction);
      return events.some(
        (e) =>
          e.kind === 'surveyed' &&
          bodiesOf(world, state.seed, e.system).some((b) => habitability(b, species).level === 'harsh'),
      );
    }
    case 'survey-flare':
      return events.some((e) => e.kind === 'surveyed' && world.system(e.system).flare);
    case 'outposts':
      return mine.filter((h) => h.kind === 'outpost').length >= deed.n;
    case 'colonies':
      return founded.length >= deed.n;
    case 'ships-built':
      return power.shipsBuilt - STARTING_FLEET.length >= deed.n;
    case 'colony-on': {
      const species = speciesFor(state, faction);
      return founded.some((h) => {
        const body = bodyOf(world, state, h);
        if (!body) return false;
        if (deed.temperature) return deed.temperature.includes(body.temperature);
        if (deed.gravity) return deed.gravity.includes(body.gravity);
        return habitability(body, species).level === 'harsh';
      });
    }
    case 'outpost-fuel':
      return mine.some((h) => h.kind === 'outpost' && (bodyOf(world, state, h)?.riches.fuel ?? 0) > 0);
    case 'worked': {
      const counts = colonies.map((h) => worked(h, deed.zone));
      return deed.oneColony ? counts.some((n) => n >= deed.n) : counts.reduce((a, b) => a + b, 0) >= deed.n;
    }
    case 'treasury':
      return power.treasury >= deed.credits;
    case 'colony-industry':
      return colonies.some((h) => industryOf(world, state, h).total >= deed.n);
    case 'project':
      return mine.some((h) => h.projects.includes(deed.project));
    case 'colony-full':
      return colonies.some((h) => h.people >= capacityOf(world, state, h));
    case 'food-made':
      return colonies.reduce((n, h) => n + foodOf(world, state, h).made.total, 0) >= deed.n;
    case 'answered':
      return events.some((e) => e.kind === 'event-answered' && e.event === deed.event);
    case 'uneasy':
      return colonies.some((h) => approvalOf(world, state, h).level !== 'content');
    case 'content-high-taxes':
      return power.taxes === 'high' && colonies.every((h) => approvalOf(world, state, h).level === 'content');
    case 'far-colony':
      return founded.some((h) => (jumpsFromCapital(world, state, h) ?? 0) >= deed.jumps);
    case 'investigated':
      return events.some((e) => e.kind === 'investigated');
    case 'surveyed':
      return power.surveyed.length - 1 >= deed.n;
    case 'research':
      return researchOf(world, state, faction).total >= deed.n;
    case 'lanes-held':
      return state.lanes.filter((l) => l.owner === faction).length >= deed.n;
    case 'blind-jump':
      return events.some((e) => e.kind === 'jumped' && world.distanceDeci(e.from, e.to) >= deed.deci);
    case 'projects':
      return mine.reduce((n, h) => n + h.projects.length, 0) >= deed.n;
    case 'harsh-full':
      return colonies.some((h) => levelOf(world, state, h) === 'harsh' && h.people >= capacityOf(world, state, h));
    case 'terraformed':
      return events.some((e) => e.kind === 'terraformed');
    case 'edicts':
      return power.edicts.length >= deed.n;
    case 'colony-people':
      return colonies.some((h) => h.people >= deed.n);
    case 'unrest':
      return colonies.some((h) => {
        const level = approvalOf(world, state, h).level;
        return level === 'unrest' || level === 'revolt';
      });
    case 'observed':
      return (
        power.surveyed.filter((id) => id !== power.capital && observationsAt(world, id).length > 0).length >= deed.n
      );
    case 'investigations':
      return power.investigated.length >= deed.n;
    case 'battles':
      return events.some((e) => e.kind === 'battle');
    case 'warships':
      return state.ships.filter((s) => s.owner === faction && isHull(s.type)).length >= deed.n;
    case 'contacts':
      return power.contacts.length >= deed.n;
    case 'mysteries':
      return (
        power.investigated.filter((id) => {
          const a = anomalyAt(state.seed, id);
          return a !== null && ANOMALIES[a].mystery === true;
        }).length >= deed.n
      );
    case 'chapters':
      return power.chapters >= deed.n;
    case 'keys':
      return keysHeld(state, faction).length >= deed.n;
  }
}

/**
 * Pays a technology's inspiration to a power: its points into the technology's progress. It is
 * researched at once if what it needs is known and its progress reaches its cost; otherwise its
 * progress stops a point short. Returns the points, and whether it was finished.
 */
export function inspire(state: GameState, power: PowerState, tech: TechId): { points: number; finished: boolean } {
  const points = inspirationPoints(state, power, tech);
  const cost = techCost(state, power, tech);
  power.inspired.push(tech);
  const progress = (power.techProgress[tech] ?? 0) + points;
  if (progress >= cost && TECHS[tech].needs.every((n) => power.researched.includes(n))) {
    learn(power, tech);
    return { points, finished: true };
  }
  power.techProgress[tech] = Math.min(cost - 1, progress);
  return { points, finished: false };
}

/**
 * Every power's inspirations as a turn ends (§17.1): each technology it has neither researched nor
 * been inspired towards, whose deed it has done. Report lines go into `events`.
 */
export function resolveInspirations(world: World, state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  for (const power of state.powers) {
    const log = events.get(power.faction);
    if (!log) continue;
    const said = [...log];
    for (const tech of TECH_IDS) {
      if (power.researched.includes(tech) || power.inspired.includes(tech) || closedBy(power, tech)) continue;
      if (!deedDone(world, state, power.faction, TECHS[tech].inspiration.deed, said)) continue;
      const { points, finished } = inspire(state, power, tech);
      log.push({ kind: 'inspired', tech, points });
      if (finished) log.push({ kind: 'researched', tech });
    }
  }
}

// ---------------------------------------------------------------- words

/** An observation in a few words, for an advisor's line. */
export function observationShort(world: World, system: SystemId, kind: ObservationKind): string {
  switch (kind) {
    case 'white-dwarf':
      return 'a white dwarf';
    case 'disc':
      return 'a belt of dust and rock';
    case 'brown-dwarf':
      return 'a brown dwarf';
    case 'flare-star':
      return 'a flare star';
    case 'planets':
      return observedPlanets(world, system).length === 1 ? 'a planet' : 'planets';
    case 'many-stars':
      return `${world.system(system).sky.stars.length} stars`;
  }
}

/** "A, B and C". */
export function listWords(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** What astronomers have observed, in a sentence that says what is real (§17.2). */
export function observationWords(world: World, system: SystemId, kind: ObservationKind): string {
  const sky = world.system(system).sky;
  const stars = (test: (s: (typeof sky.stars)[number]) => boolean) => sky.stars.filter(test).map((s) => s.name);
  switch (kind) {
    case 'white-dwarf': {
      const names = stars((s) => starClass(s.spectralType) === 'D');
      return `${listWords(names)} ${names.length === 1 ? 'is a white dwarf' : 'are white dwarfs'}, the hot, dense core left when a star has shed its outer layers`;
    }
    case 'disc': {
      const names = sky.belts.map((b) => (/^the /i.test(b.name) ? b.name : `the ${b.name}`));
      return `astronomers have observed ${listWords(names)}`;
    }
    case 'brown-dwarf': {
      const names = stars((s) => ['L', 'T', 'Y'].includes(starClass(s.spectralType)));
      return `${listWords(names)} ${names.length === 1 ? 'is a brown dwarf' : 'are brown dwarfs'}, too small to sustain the hydrogen fusion that makes a star shine`;
    }
    case 'flare-star': {
      const flare = sky.stars.filter((s) => s.flareVariable);
      const names = flare.map((s) => `${s.name} (${s.flareVariable})`);
      return `${listWords(names)} ${flare.length === 1 ? 'is a catalogued flare star' : 'are catalogued flare stars'}, brightening suddenly as magnetic fields release their energy`;
    }
    case 'planets':
      return `astronomers have found ${listWords(observedPlanets(world, system))}`;
    case 'many-stars':
      return `${sky.stars.length} stars in one system: ${listWords(sky.stars.map((s) => s.name))}`;
  }
}
