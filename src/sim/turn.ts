// Ending a turn (M1_FIRST_LIGHT.md §2, M1_TURNS.md §5): every power's orders resolve together, in a
// fixed order: movement (ships in the order they were built), arrivals (blind jumps landing, surveys),
// then production, research and growth (later increments), then each power's report. Pure: the same
// world and state always give the same result, on every device.

import { FACTIONS } from '../content/factions.ts';
import { SPECIES } from '../content/species.ts';
import type { SystemId } from '../data/types.ts';
import { bodiesOf } from './bodies.ts';
import { habitability } from './habitability.ts';
import { findRoute, jumpPoints } from './movement.ts';
import type { ReportEvent } from './report.ts';
import { type GameState, hasSurveyed, markSurveyed, powerOf, type ShipState } from './state.ts';
import type { World } from './world.ts';

/** Whether a survey ship should stop to survey where it now is. */
function wantsSurvey(state: GameState, ship: ShipState): boolean {
  return (
    ship.type === 'survey' && ship.autoSurvey && ship.at !== null && !hasSurveyed(powerOf(state, ship.owner), ship.at)
  );
}

function moveShip(world: World, state: GameState, ship: ShipState, events: ReportEvent[]): void {
  const jump = ship.blindJump;
  if (jump) {
    if (ship.at !== null) {
      events.push({ kind: 'jumped', ship: ship.id, from: jump.from, to: jump.to, turns: jump.turns });
      ship.at = null;
    }
    jump.left -= 1;
    if (jump.left <= 0) {
      ship.at = jump.to;
      ship.blindJump = null;
      events.push({ kind: 'landed', ship: ship.id, system: jump.to });
    }
    return;
  }
  let points = jumpPoints(ship.owner);
  while (ship.destinations.length > 0 && ship.at !== null) {
    const dest = ship.destinations[0] as SystemId;
    if (ship.at === dest) {
      ship.destinations.shift();
      if (ship.destinations.length === 0) events.push({ kind: 'arrived', ship: ship.id, system: dest });
      continue;
    }
    const path = findRoute(world, state, ship.owner, ship.at, dest);
    if (!path || path.length === 0) {
      events.push({ kind: 'blocked', ship: ship.id, system: ship.at, to: dest });
      ship.destinations = [];
      break;
    }
    const hop = path[0] as (typeof path)[number];
    if (hop.cost > points) break;
    ship.at = hop.to;
    points -= hop.cost;
    if (ship.at === dest) {
      ship.destinations.shift();
      if (ship.destinations.length === 0) events.push({ kind: 'arrived', ship: ship.id, system: dest });
    }
    // A survey ship stops in a system nobody of its power has surveyed, and surveys it (§4).
    if (wantsSurvey(state, ship)) break;
  }
}

export interface TurnResult {
  state: GameState;
  /** What happened to each power this turn. */
  reports: GameState['reports'];
}

export function resolveTurn(world: World, before: GameState): TurnResult {
  const state = structuredClone(before);
  const events = new Map(state.powers.map((p) => [p.faction, [] as ReportEvent[]]));
  const log = (ship: ShipState) => events.get(ship.owner) as ReportEvent[];

  // 1. Movement.
  for (const ship of state.ships) moveShip(world, state, ship, log(ship));

  // 2. Arrivals: surveys, one per system and power, by the first ship there.
  for (const ship of state.ships) {
    if (!wantsSurvey(state, ship)) continue;
    const system = ship.at as SystemId;
    const power = powerOf(state, ship.owner);
    markSurveyed(power, system);
    const species = SPECIES[FACTIONS[power.faction].species];
    const bodies = bodiesOf(world, state.seed, system);
    const habitable = bodies.filter((b) => {
      const level = habitability(b, species).level;
      return level === 'comfortable' || level === 'tolerable';
    });
    log(ship).push({
      kind: 'surveyed',
      ship: ship.id,
      system,
      worlds: bodies.length,
      habitable: habitable.map((b) => b.id),
    });
  }

  // 3-6. Production, research and growth arrive with increments 5 and 6.

  // 7. Reports.
  const reports = state.powers.map((p) => ({
    faction: p.faction,
    turn: state.turn,
    events: events.get(p.faction) ?? [],
  }));
  state.reports = reports;
  state.turn += 1;
  return { state, reports };
}
