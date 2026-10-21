// What a power can see of the others (M2_WORLDS.md §26.3): their colonies and outposts in systems
// it has surveyed, their lanes with an end in one, and their ships where it holds a colony or an
// outpost or within range of a deep-space scanner of its own. Everything else of theirs is hidden.
// The screens are given this view; the rules always work on the whole state.

import type { FactionId } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import { TECHS } from '../content/techs.ts';
import type { SystemId } from '../data/types.ts';
import type { ReportEvent } from './report.ts';
import { effects, hasMet } from './research.ts';
import { type GameState, type Holding, type LaneState, powerOf, type ShipState } from './state.ts';
import { laneEnds, type World } from './world.ts';

/** Systems where a power sees the others' ships: where it holds something, and in its scanners' range. */
export function watchedSystems(world: World, state: GameState, faction: FactionId): Set<SystemId> {
  const mine = state.holdings.filter((h) => h.owner === faction);
  const out = new Set<SystemId>(mine.map((h) => h.system));
  const scanners = mine.filter((h) => h.projects.includes('deep-space-scanner')).map((h) => h.system);
  // Scanner arrays see further (M2B_SCIENCE.md §18.2).
  const reach = Math.max(RULES.projects.scannerDeci, ...effects(state, faction, 'scanner-deci').map((e) => e.deci));
  if (scanners.length > 0)
    for (const s of world.systems) if (scanners.some((at) => world.distanceDeci(at, s.id) <= reach)) out.add(s.id);
  return out;
}

export function seesHolding(state: GameState, faction: FactionId, h: Holding): boolean {
  return h.owner === faction || powerOf(state, faction).surveyed.includes(h.system);
}

export function seesLane(state: GameState, faction: FactionId, l: LaneState): boolean {
  if (l.owner === faction) return true;
  const surveyed = powerOf(state, faction).surveyed;
  return laneEnds(l.id).some((end) => surveyed.includes(end));
}

/** A ship on a blind jump, between stars, is seen by no one else. */
export function seesShip(faction: FactionId, s: ShipState, watched: ReadonlySet<SystemId>): boolean {
  return s.owner === faction || (s.at !== null && watched.has(s.at));
}

/**
 * The state as a power knows it: its own in full, the others' only as far as it can see. Their
 * powers stay listed (for their names and colours); nothing of theirs the screens show comes
 * from anywhere but the holdings, lanes and ships kept here.
 */
export function knownView(world: World, state: GameState, faction: FactionId): GameState {
  const watched = watchedSystems(world, state, faction);
  return {
    ...state,
    holdings: state.holdings.filter((h) => seesHolding(state, faction, h)),
    lanes: state.lanes.filter((l) => seesLane(state, faction, l)),
    ships: state.ships.filter((s) => seesShip(faction, s, watched)),
  };
}

/**
 * What the Watch saw this turn (§26.3): colonies and outposts the others founded and lanes they
 * opened where the power can see them, and their ships that came into its sight.
 */
export function watchNews(world: World, before: GameState, after: GameState, faction: FactionId): ReportEvent[] {
  const out: ReportEvent[] = [];
  const existed = new Set(before.holdings.map((h) => h.id));
  for (const h of after.holdings)
    if (h.owner !== faction && !existed.has(h.id) && seesHolding(after, faction, h))
      out.push({
        kind: 'rival-founded',
        faction: h.owner,
        holding: h.id,
        system: h.system,
        body: h.body,
        colony: h.kind === 'colony',
      });
  const open = new Set(before.lanes.filter((l) => l.status === 'open').map((l) => l.id));
  for (const l of after.lanes)
    if (l.owner !== faction && l.status === 'open' && !open.has(l.id) && seesLane(after, faction, l))
      out.push({ kind: 'rival-lane', faction: l.owner, lane: l.id });
  const watchedBefore = watchedSystems(world, before, faction);
  const watched = watchedSystems(world, after, faction);
  const seen = new Set(before.ships.filter((s) => seesShip(faction, s, watchedBefore)).map((s) => s.id));
  for (const s of after.ships)
    if (s.owner !== faction && s.at !== null && !seen.has(s.id) && seesShip(faction, s, watched))
      out.push({ kind: 'rival-ship', faction: s.owner, ship: s.id, type: s.type, system: s.at });
  // Rumours (M2B_SCIENCE.md §19.3): a met rival's great steps, a tier 4 or 5 technology or a doctrine.
  const viewer = powerOf(after, faction);
  for (const p of after.powers) {
    if (p.faction === faction || !hasMet(after, viewer, p.faction)) continue;
    const knew = new Set(before.powers.find((x) => x.faction === p.faction)?.researched ?? []);
    for (const tech of p.researched)
      if (!knew.has(tech) && (TECHS[tech].tier >= 4 || TECHS[tech].fork))
        out.push({ kind: 'rival-tech', faction: p.faction, tech });
  }
  return out;
}

/** A power's line in the standings (§26.5), as far as the viewer can see it. */
export interface Standing {
  faction: FactionId;
  colonies: number;
  outposts: number;
  /** In tenths of a million. */
  people: number;
  /** Open or being tuned. */
  lanes: number;
  /** Counted only for the viewer's own power. */
  technologies: number | null;
  /** A rival's science against the viewer's, as the Watch hears it (§19.4); null for the viewer. */
  science: 'ahead' | 'level' | 'behind' | null;
}

/**
 * The standings from a power's view (`knownView`): its own line first, then each other power it
 * has seen anything of, in the order they are listed.
 */
export function standings(view: GameState, viewer: FactionId): Standing[] {
  const line = (faction: FactionId): Standing => {
    const held = view.holdings.filter((h) => h.owner === faction);
    return {
      faction,
      colonies: held.filter((h) => h.kind === 'colony').length,
      outposts: held.filter((h) => h.kind === 'outpost').length,
      people: held.reduce((sum, h) => sum + h.people, 0),
      lanes: view.lanes.filter((l) => l.owner === faction).length,
      technologies: faction === viewer ? mine : null,
      science: faction === viewer ? null : compare(powerOf(view, faction).researched.length),
    };
  };
  const mine = powerOf(view, viewer).researched.length;
  const gap = RULES.research.standingsGap;
  const compare = (theirs: number) => (theirs >= mine + gap ? 'ahead' : theirs <= mine - gap ? 'behind' : 'level');
  const known = (f: FactionId) =>
    view.holdings.some((h) => h.owner === f) ||
    view.lanes.some((l) => l.owner === f) ||
    view.ships.some((s) => s.owner === f);
  return [
    line(viewer),
    ...view.powers.filter((p) => p.faction !== viewer && known(p.faction)).map((p) => line(p.faction)),
  ];
}
