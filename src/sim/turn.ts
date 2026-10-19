// Ending a turn (M1_FIRST_LIGHT.md §2, M1_TURNS.md §5, M1_COLONIES.md): every power's orders resolve
// together, in a fixed order: movement (ships in the order they were built), arrivals (blind jumps
// landing, surveys, colonies and outposts founded), production, research (increment 6), growth and
// yields, then each power's report. Pure: the same world and state always give the same result, on
// every device.

import { FACTIONS } from '../content/factions.ts';
import { itemCost } from '../content/projects.ts';
import { RULES } from '../content/rules.ts';
import { SPECIES } from '../content/species.ts';
import type { SystemId } from '../data/types.ts';
import { bodiesOf } from './bodies.ts';
import { capacityOf, growthOf, industryOf, settleRefusal, yieldsOf } from './economy.ts';
import { habitability } from './habitability.ts';
import { findRoute, jumpPoints, lanesFor } from './movement.ts';
import type { ReportEvent } from './report.ts';
import {
  type GameState,
  hasSurveyed,
  makeHolding,
  makeShip,
  markSurveyed,
  type PowerState,
  powerOf,
  type ShipState,
} from './state.ts';
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

  // 1. Movement. A ship founding a colony or outpost stays to do it.
  for (const ship of state.ships) if (!ship.founding) moveShip(world, state, ship, log(ship));

  // 2. Arrivals: surveys (one per system and power, by the first ship there), survey stations,
  // then colonies and outposts founded.
  const survey = (power: PowerState, system: SystemId, by: { ship?: number; station?: number }) => {
    if (!markSurveyed(power, system)) return;
    const species = SPECIES[FACTIONS[power.faction].species];
    const bodies = bodiesOf(world, state.seed, system);
    const habitable = bodies.filter((b) => {
      const level = habitability(b, species).level;
      return level === 'comfortable' || level === 'tolerable';
    });
    (events.get(power.faction) as ReportEvent[]).push({
      kind: 'surveyed',
      ...by,
      system,
      worlds: bodies.length,
      habitable: habitable.map((b) => b.id),
    });
  };
  for (const ship of state.ships) {
    if (wantsSurvey(state, ship)) survey(powerOf(state, ship.owner), ship.at as SystemId, { ship: ship.id });
  }
  for (const h of state.holdings) {
    if (!h.projects.includes('survey-station')) continue;
    const power = powerOf(state, h.owner);
    for (const hop of lanesFor(world, state, h.owner).get(h.system) ?? []) survey(power, hop.to, { station: h.id });
  }
  const usedUp = new Set<number>();
  for (const ship of state.ships) {
    const f = ship.founding;
    if (!f || ship.at === null) continue;
    ship.founding = null;
    const reason = settleRefusal(world, state, ship.owner, ship.at, f.body, f.kind);
    if (reason) {
      log(ship).push({ kind: 'not-founded', ship: ship.id, system: ship.at, body: f.body, reason });
      continue;
    }
    const h = makeHolding(state, {
      owner: ship.owner,
      kind: f.kind,
      system: ship.at,
      body: f.body,
      capital: false,
      people: f.kind === 'colony' ? RULES.colonies.founding : 0,
    });
    usedUp.add(ship.id);
    log(ship).push({ kind: 'founded', holding: h.id, shipName: ship.name, system: ship.at, body: f.body });
  }
  state.ships = state.ships.filter((s) => !usedUp.has(s.id));

  // 3. Production: each colony's industry goes into its queue; finished items appear.
  for (const h of state.holdings) {
    if (h.kind !== 'colony') continue;
    const power = powerOf(state, h.owner);
    const log = events.get(h.owner) as ReportEvent[];
    h.industry += industryOf(h).total;
    for (;;) {
      const first = h.queue[0];
      if (!first) {
        h.industry = Math.min(h.industry, RULES.colonies.storedIndustry);
        break;
      }
      const c = itemCost(first);
      const s = power.stockpile;
      if (h.industry < c.industry || s.metals < c.metals || s.volatiles < c.volatiles || s.fuel < c.fuel) break;
      h.industry -= c.industry;
      s.metals -= c.metals;
      s.volatiles -= c.volatiles;
      s.fuel -= c.fuel;
      h.queue.shift();
      if (first.kind === 'ship') {
        const ship = makeShip(state, h.owner, first.ship, h.system);
        log.push({ kind: 'built', holding: h.id, item: first, ship: ship.id });
      } else {
        h.projects.push(first.project);
        log.push({ kind: 'built', holding: h.id, item: first });
      }
    }
  }

  // 4. Research arrives with increment 6.

  // 5. Growth, then what every holding yields.
  for (const h of state.holdings) {
    const grow = growthOf(world, state, h);
    if (grow > 0) {
      h.people += grow;
      if (h.people >= capacityOf(world, state, h))
        (events.get(h.owner) as ReportEvent[]).push({ kind: 'full', holding: h.id });
    }
  }
  for (const h of state.holdings) {
    const y = yieldsOf(world, state, h).total;
    const s = powerOf(state, h.owner).stockpile;
    s.metals += y.metals;
    s.volatiles += y.volatiles;
    s.fuel += y.fuel;
  }

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
