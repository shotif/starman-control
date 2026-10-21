// Ending a turn (M1_FIRST_LIGHT.md §2, M1_TURNS.md §5, M1_COLONIES.md, M2_WORLDS.md): every power's
// orders resolve together, in a fixed order: movement (ships in the order they were built), arrivals
// (blind jumps landing, surveys, colonies and outposts founded), production (overdrive paid first),
// research, food, growth, yields and credits, then each power's report. What a colony makes is
// worked out once, from the state as the turn began. Pure: the same world and state always give the
// same result, on every device.

import { RULES } from '../content/rules.ts';
import type { SystemId } from '../data/types.ts';
import { aiOrders } from './ai.ts';
import { anomalyAt, grantReward } from './anomalies.ts';
import { bodiesOf } from './bodies.ts';
import { observationPoints, observationsAt, resolveInspirations } from './discoveries.ts';
import {
  capacityOf,
  costOf,
  creditsOf,
  districtCount,
  growthOf,
  industryOf,
  networkFood,
  networksOf,
  overdriveCost,
  researchOf,
  settleRefusal,
  stopped,
  upkeepOf,
  yieldsOf,
} from './economy.ts';
import { resolveEvents } from './events.ts';
import { governAll } from './governor.ts';
import { habitability } from './habitability.ts';
import { laneQuote, laneRefusal } from './lanes.ts';
import { findRoute, jumpPoints, lanesFor } from './movement.ts';
import { applyInPlace } from './orders.ts';
import type { ReportEvent } from './report.ts';
import { effects, grantResearch, speciesFor, spendResearch } from './research.ts';
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
import { watchNews } from './visibility.ts';
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
  let points = jumpPoints(state, ship.owner, ship.type);
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

  // 0. The rivals give their orders (M2_WORLDS.md §26.2), from the state as it stands, power by
  // power in the order they are listed, through the same orders as the player's.
  for (const p of state.powers)
    if (p.controller === 'ai')
      for (const o of aiOrders(world, state, p.faction)) applyInPlace(world, state, p.faction, o);

  // 1. Movement. A ship founding a colony or outpost stays to do it.
  for (const ship of state.ships) if (!ship.founding && !ship.investigating) moveShip(world, state, ship, log(ship));

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
    const anomaly = anomalyAt(state.seed, system);
    const log = events.get(power.faction) as ReportEvent[];
    log.push({
      kind: 'surveyed',
      ...by,
      system,
      worlds: bodies.length,
      habitable: habitable.map((b) => b.id),
      ...(anomaly ? { anomaly } : {}),
    });
    // What astronomers have observed here gives research, once (M2B_SCIENCE.md §17.2).
    const found = observationsAt(world, system);
    if (found.length > 0) {
      const points = observationPoints(found);
      log.push({ kind: 'observed', system, found, points });
      for (const tech of grantResearch(power, points)) log.push({ kind: 'researched', tech });
    }
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
  // Investigations: a survey ship that has spent its turns on an anomaly gets its reward.
  for (const ship of state.ships) {
    const inv = ship.investigating;
    if (!inv) continue;
    if (inv.left > 1) {
      inv.left -= 1;
      continue;
    }
    ship.investigating = null;
    const power = powerOf(state, ship.owner);
    const id = anomalyAt(state.seed, inv.system);
    if (!id || power.investigated.includes(inv.system)) continue;
    power.investigated.push(inv.system);
    power.investigated.sort();
    log(ship).push({ kind: 'investigated', ship: ship.id, system: inv.system, anomaly: id });
    for (const tech of grantReward(power, id)) log(ship).push({ kind: 'researched', tech });
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
    // A new colony arrives with its first districts zoned (D-42), and a governor in an imperial game.
    const n = districtCount(world, state, h);
    h.districts = RULES.districts.founding.slice(0, n).map((zone, i) => ({ zone, slot: i + 1 }));
    if (h.kind === 'colony' && powerOf(state, h.owner).governNew) h.governor = 'balance';
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
  // What each colony makes this turn, from the state as it stands now (approval, workers, food).
  const research = new Map(state.powers.map((p) => [p.faction, researchOf(world, state, p.faction).total]));
  const income = new Map(state.holdings.map((h) => [h.id, creditsOf(world, state, h).total]));
  const yields = new Map(state.holdings.map((h) => [h.id, yieldsOf(world, state, h, false).total]));
  const food = state.powers.flatMap((p) =>
    networksOf(world, state, p.faction).map((net) => ({
      faction: p.faction,
      net,
      f: networkFood(world, state, p.faction, net),
    })),
  );
  const revolt = new Set(state.holdings.filter((h) => stopped(world, state, h)).map((h) => h.id));
  // Refineries turn volatiles into fuel, then fusion plants burn it, colony by colony, from the
  // stockpile as it stands; a plant with no fuel left makes nothing this turn (M2_WORLDS.md §23.1).
  const fusion = new Map<number, boolean>();
  for (const h of state.holdings) {
    if (h.kind !== 'colony' || revolt.has(h.id) || !h.projects.includes('refinery')) continue;
    const s = powerOf(state, h.owner).stockpile;
    if (s.volatiles < RULES.projects.refineryVolatiles) continue;
    s.volatiles -= RULES.projects.refineryVolatiles;
    s.fuel += RULES.projects.refineryFuel;
  }
  for (const h of state.holdings) {
    if (h.kind !== 'colony' || revolt.has(h.id) || !h.projects.includes('fusion-plant')) continue;
    const s = powerOf(state, h.owner).stockpile;
    const runs = s.fuel >= RULES.projects.fusionFuel;
    if (runs) s.fuel -= RULES.projects.fusionFuel;
    fusion.set(h.id, runs);
  }
  // Overdrive is paid first, colony by colony; what the treasury cannot pay is not bought.
  for (const h of state.holdings) {
    if (h.overdrive <= 0) continue;
    const power = powerOf(state, h.owner);
    const runs = fusion.get(h.id) ?? false;
    while (h.overdrive > 0 && overdriveCost(world, state, h, runs) > Math.max(0, power.treasury)) h.overdrive--;
    power.treasury -= overdriveCost(world, state, h, runs);
    if (h.overdrive === 0) (events.get(h.owner) as ReportEvent[]).push({ kind: 'overdrive-stopped', holding: h.id });
  }
  const made = new Map(state.holdings.map((h) => [h.id, industryOf(world, state, h, fusion.get(h.id) ?? false).total]));
  for (const h of state.holdings) {
    const power = powerOf(state, h.owner);
    const log = events.get(h.owner) as ReportEvent[];
    if (revolt.has(h.id)) continue;
    h.industry += made.get(h.id) ?? 0;
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
      } else if (first.kind === 'zone') {
        const there = h.districts.find((d) => d.slot === first.slot);
        if (there) there.zone = first.zone;
        else h.districts.push({ zone: first.zone, slot: first.slot });
        log.push({ kind: 'zoned', holding: h.id, zone: first.zone, slot: first.slot, rezoned: there !== undefined });
      } else {
        h.projects.push(first.project);
        log.push({ kind: 'built', holding: h.id, item: first });
      }
    }
  }

  // 4. Research: each power's points go into its research queue.
  for (const p of state.powers) {
    const done = spendResearch(p, research.get(p.faction) ?? 0);
    for (const tech of done) (events.get(p.faction) as ReportEvent[]).push({ kind: 'researched', tech });
  }

  // 5. Food, network by network (M2_WORLDS.md §3): the capital's network keeps a store; a colony
  // cut off from it feeds itself. A shortage the store cannot cover leaves the network hungry.
  for (const { faction, net, f } of food) {
    const power = powerOf(state, faction);
    let hungry = f.made < f.eaten;
    if (net.home) {
      const store = power.food + f.made - f.eaten;
      hungry = store < 0;
      power.food = Math.max(0, Math.min(f.room, store));
    }
    for (const c of net.colonies) {
      const h = state.holdings.find((x) => x.id === c.id);
      if (!h) continue;
      if (hungry && h.hungry === 0) (events.get(faction) as ReportEvent[]).push({ kind: 'hungry', holding: h.id });
      h.hungry = hungry ? h.hungry + 1 : 0;
    }
  }

  // 6. Growth: none while hungry or unhappy; after long hunger, people are lost (never the last tenth).
  for (const h of state.holdings) {
    if (h.kind === 'colony' && h.hungry > RULES.food.starveAfter && h.people > 1) {
      h.people -= 1;
      continue;
    }
    const grow = growthOf(world, state, h);
    if (grow > 0) {
      h.people += grow;
      if (h.people >= capacityOf(world, state, h))
        (events.get(h.owner) as ReportEvent[]).push({ kind: 'full', holding: h.id });
    }
  }

  // 7. Yields and credits: what every holding gathers goes to the stockpile; taxes and markets to
  // the treasury, and upkeep out of it.
  for (const h of state.holdings) {
    const y = yields.get(h.id) ?? { metals: 0, volatiles: 0, fuel: 0 };
    const power = powerOf(state, h.owner);
    power.stockpile.metals += y.metals;
    power.stockpile.volatiles += y.volatiles;
    power.stockpile.fuel += y.fuel;
    power.treasury += income.get(h.id) ?? 0;
  }
  for (const p of state.powers) {
    const before = p.treasury;
    p.treasury -= upkeepOf(state, p.faction).total;
    if (p.treasury < 0 && before >= 0) (events.get(p.faction) as ReportEvent[]).push({ kind: 'debt' });
  }

  // 8. Governors (M2_WORLDS.md §25.1): what each governed colony does as the turn ends, so the
  // report shows it and the player can undo it before the next.
  for (const [faction, said] of governAll(world, state)) (events.get(faction) as ReportEvent[]).push(...said);

  // 9. Attention grows, and edicts run their course (§25.2).
  for (const p of state.powers) {
    p.attention = Math.min(RULES.attention.most, p.attention + RULES.attention.perTurn);
    for (const e of p.edicts) e.left--;
    for (const e of p.edicts.filter((x) => x.left <= 0))
      (events.get(p.faction) as ReportEvent[]).push({ kind: 'edict-ended', edict: e.edict, holding: e.holding });
    p.edicts = p.edicts.filter((e) => e.left > 0);
  }

  // 10. The Watch (M2_WORLDS.md §26.3): what each power newly sees of the others.
  for (const p of state.powers) events.get(p.faction)?.push(...watchNews(world, before, state, p.faction));

  // 11. Events (§27): lasting effects run down, answers take effect, and new events come.
  resolveEvents(world, state, events);

  // 12. Inspirations (M2B_SCIENCE.md §17.1): deeds done this turn, or standing now, teach each power
  // something towards a technology it has not yet researched.
  resolveInspirations(world, state, events);

  // 13. Reports.
  const reports = state.powers.map((p) => ({
    faction: p.faction,
    turn: state.turn,
    events: events.get(p.faction) ?? [],
  }));
  state.reports = reports;
  state.turn += 1;
  return { state, reports };
}
