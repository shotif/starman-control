// Ending a turn (M1_FIRST_LIGHT.md §2, M1_TURNS.md §5, M1_COLONIES.md): every power's orders resolve
// together, in a fixed order: movement (ships in the order they were built), arrivals (blind jumps
// landing, surveys, colonies and outposts founded), production, research (increment 6), growth and
// yields, then each power's report. Pure: the same world and state always give the same result, on
// every device.

import { RULES } from '../content/rules.ts';
import type { SystemId } from '../data/types.ts';
import { bodiesOf } from './bodies.ts';
import { capacityOf, costOf, growthOf, industryOf, settleRefusal, yieldsOf } from './economy.ts';
import { habitability } from './habitability.ts';
import { laneQuote, laneRefusal } from './lanes.ts';
import { findRoute, jumpPoints, lanesFor } from './movement.ts';
import type { ReportEvent } from './report.ts';
import { effects, researchOf, speciesFor, spendResearch } from './research.ts';
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
import { laneId, type World } from './world.ts';

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
  let points = jumpPoints(state, ship.owner);
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
    const species = speciesFor(state, power.faction);
    const domes = effects(state, power.faction, 'settle-harsh').length > 0;
    const bodies = bodiesOf(world, state.seed, system);
    const habitable = bodies.filter((b) => {
      const level = habitability(b, species).level;
      return level === 'comfortable' || level === 'tolerable' || (domes && level === 'harsh');
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
    // One open lane out, or as many as Long-baseline arrays allow, nearest first.
    const reach = Math.max(1, ...effects(state, h.owner, 'survey-station-lanes').map((e) => e.lanes));
    const graph = lanesFor(world, state, h.owner);
    let ring = [h.system];
    const seen = new Set<SystemId>(ring);
    for (let step = 0; step < reach; step++) {
      const next: SystemId[] = [];
      for (const at of ring)
        for (const hop of graph.get(at) ?? []) {
          if (seen.has(hop.to)) continue;
          seen.add(hop.to);
          next.push(hop.to);
          survey(power, hop.to, { station: h.id });
        }
      ring = next;
    }
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

  // 3. Production. Lanes being tuned come a turn nearer opening; then each colony's and outpost's
  // industry goes into its queue, and finished items appear (a paid lane begins its tuning).
  state.lanes = state.lanes.map((l) => {
    if (l.status !== 'building') return l;
    if (l.left > 1) return { ...l, left: l.left - 1 };
    (events.get(l.owner) as ReportEvent[]).push({ kind: 'lane-opened', lane: l.id });
    return { id: l.id, owner: l.owner, status: 'open' };
  });
  for (const h of state.holdings) {
    const power = powerOf(state, h.owner);
    const log = events.get(h.owner) as ReportEvent[];
    h.industry += industryOf(h).total;
    for (;;) {
      const first = h.queue[0];
      if (!first) {
        h.industry = Math.min(h.industry, RULES.colonies.storedIndustry);
        break;
      }
      if (first.kind === 'lane') {
        // Checked again: a lane opened or begun since it was queued may have taken its place.
        const reason = laneRefusal(world, state, h.owner, h.system, first.to, false);
        if (reason) {
          h.queue.shift();
          log.push({ kind: 'lane-refused', holding: h.id, to: first.to, reason });
          continue;
        }
      }
      const c = costOf(world, state, h, first);
      const s = power.stockpile;
      if (h.industry < c.industry || s.metals < c.metals || s.volatiles < c.volatiles || s.fuel < c.fuel) break;
      h.industry -= c.industry;
      s.metals -= c.metals;
      s.volatiles -= c.volatiles;
      s.fuel -= c.fuel;
      h.queue.shift();
      if (first.kind === 'lane') {
        const q = laneQuote(world, state, h.owner, h.system, first.to);
        const id = laneId(h.system, first.to);
        state.lanes.push({ id, owner: h.owner, status: 'building', left: q.turns });
        state.lanes.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        log.push({ kind: 'lane-begun', holding: h.id, to: first.to, relight: q.relight, turns: q.turns });
      } else if (first.kind === 'ship') {
        const ship = makeShip(state, h.owner, first.ship, h.system);
        log.push({ kind: 'built', holding: h.id, item: first, ship: ship.id });
      } else {
        h.projects.push(first.project);
        log.push({ kind: 'built', holding: h.id, item: first });
      }
    }
  }

  // 4. Research: each power's points go into its research queue.
  for (const p of state.powers) {
    const done = spendResearch(p, researchOf(state, p.faction).total);
    for (const tech of done) (events.get(p.faction) as ReportEvent[]).push({ kind: 'researched', tech });
  }

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
