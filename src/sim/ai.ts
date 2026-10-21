// How a rival plays (M2_WORLDS.md §26.2, D-37): its orders for a turn, worked out from the state
// alone, so the same game always plays the same way (D-06), and given through the same orders as
// the player's, refused for the same reasons. Its colonies are run by governors (`govern`); this
// decides its ships, its shipyards, its lanes, its research and its taxes, in its power's character.

import type { Priority } from '../content/edicts.ts';
import type { FactionId } from '../content/factions.ts';
import type { QueueItem } from '../content/projects.ts';
import { type FieldId, TECHS } from '../content/techs.ts';
import type { SystemId } from '../data/types.ts';
import { investigateRefusal } from './anomalies.ts';
import { approvalOf, settleable, treasuryOf } from './economy.ts';
import { rivalChoice } from './events.ts';
import { habitability } from './habitability.ts';
import { laneTargets } from './lanes.ts';
import { blindReachDeci, findRoute } from './movement.ts';
import type { Order } from './orders.ts';
import { canResearch, speciesFor } from './research.ts';
import { type GameState, type Holding, powerOf, type TaxRate } from './state.ts';
import type { World } from './world.ts';

/** A rival's character (§26.2): what its governors run for, where it settles, what it researches, how it taxes. */
export interface Personality {
  capital: Priority;
  colonies: Priority;
  /** How it chooses a world to settle: the roomiest, the nearest, or the richest. */
  settles: 'roomiest' | 'nearest' | 'richest';
  fields: readonly FieldId[];
  taxes: TaxRate;
  /** Its colonies queue lanes too, not only its outposts. */
  laneBuilder: boolean;
}

export const PERSONALITIES: Record<FactionId, Personality> = {
  sta: {
    capital: 'research',
    colonies: 'balance',
    settles: 'roomiest',
    fields: ['survey', 'propulsion'],
    taxes: 'standard',
    laneBuilder: true,
  },
  frontier: {
    capital: 'grow',
    colonies: 'grow',
    settles: 'nearest',
    fields: ['life-sciences', 'society'],
    taxes: 'low',
    laneBuilder: false,
  },
  'hollow-wake': {
    capital: 'produce',
    colonies: 'produce',
    settles: 'richest',
    fields: ['construction', 'propulsion'],
    taxes: 'high',
    laneBuilder: false,
  },
};

/** Below this, or with no income to keep one, a rival builds no ships. */
const SHIP_TREASURY = 20;
/** Below this and falling, a rival raises its taxes a step; from twice it, it goes back to its own. */
const LOW_TREASURY = 30;
/** With this much, a rival lowers its taxes while a colony is in unrest. */
const RICH_TREASURY = 100;

export function aiOrders(world: World, state: GameState, faction: FactionId): Order[] {
  const me = PERSONALITIES[faction];
  const power = powerOf(state, faction);
  const orders: Order[] = [];
  const claimed = new Set<string>();
  const mine = state.holdings.filter((h) => h.owner === faction);
  const reachable = (from: SystemId, to: SystemId) =>
    from === to || findRoute(world, state, faction, from, to) !== null;
  const byDistance = (from: SystemId) => (a: SystemId, b: SystemId) =>
    world.distanceDeci(from, a) - world.distanceDeci(from, b) || (a < b ? -1 : 1);

  // Governors: every colony run for its power's priority.
  for (const h of mine) {
    if (h.kind !== 'colony') continue;
    const want = h.capital ? me.capital : me.colonies;
    if (h.governor !== want) orders.push({ type: 'governor', holding: h.id, priority: want });
  }

  // Ships.
  for (const s of state.ships) {
    if (s.owner !== faction || s.at === null || s.destinations.length > 0 || s.blindJump || s.founding) continue;
    if (s.investigating) continue;
    const at = s.at;
    if (s.type === 'survey') {
      if (investigateRefusal(state, s) === null) {
        orders.push({ type: 'investigate', ship: s.id });
        continue;
      }
      const unsurveyed = world.systems
        .map((x) => x.id)
        .filter((id) => !power.surveyed.includes(id) && !claimed.has(id) && id !== at);
      const byLane = unsurveyed.filter((id) => reachable(at, id)).sort(byDistance(at))[0];
      const reach = blindReachDeci(state, faction);
      const blind = unsurveyed.filter((id) => world.distanceDeci(at, id) <= reach).sort(byDistance(at))[0];
      const target = byLane ?? blind;
      if (target) {
        claimed.add(target);
        orders.push(byLane ? { type: 'move', ship: s.id, to: target } : { type: 'blind-jump', ship: s.id, to: target });
        continue;
      }
      // Nothing within reach from here: a jump toward the nearest star not yet surveyed, to the star
      // in reach that comes closest to it.
      const goal = unsurveyed.sort(byDistance(at))[0];
      if (!goal) continue;
      const step = world.systems
        .map((x) => x.id)
        .filter((id) => id !== at && world.distanceDeci(at, id) <= reach)
        .filter((id) => world.distanceDeci(id, goal) < world.distanceDeci(at, goal))
        .sort(byDistance(goal))[0];
      if (step) orders.push({ type: 'blind-jump', ship: s.id, to: step });
      continue;
    }
    const kind = s.type === 'colony' ? 'colony' : 'outpost';
    const species = speciesFor(state, faction);
    const worth = (id: SystemId) =>
      settleable(world, state, faction, id, kind).filter(
        (b) => !claimed.has(b.id) && (kind === 'colony' || b.riches.metals + b.riches.volatiles + b.riches.fuel > 0),
      );
    const systems = power.surveyed.filter((id) => reachable(at, id) && worth(id).length > 0).sort(byDistance(at));
    const target = systems[0];
    if (!target) continue;
    if (target !== at) {
      orders.push({ type: 'move', ship: s.id, to: target });
      continue;
    }
    const riches = (b: { riches: { metals: number; volatiles: number; fuel: number } }) =>
      b.riches.metals + b.riches.volatiles + b.riches.fuel;
    const best = worth(at).sort(
      (a, b) =>
        (me.settles === 'richest' ? riches(b) - riches(a) : 0) ||
        (me.settles !== 'nearest' ? habitability(b, species).capacity - habitability(a, species).capacity : 0) ||
        riches(b) - riches(a) ||
        (a.id < b.id ? -1 : 1),
    )[0];
    if (!best) continue;
    claimed.add(best.id);
    orders.push({ type: kind === 'colony' ? 'colonise' : 'found-outpost', ship: s.id, body: best.id });
  }

  // Shipyards: one ship at a time, while there is somewhere for it to go and credits to keep it.
  const idle = (type: string) => state.ships.filter((s) => s.owner === faction && s.type === type).length;
  const settleTargets = (kind: 'colony' | 'outpost') =>
    power.surveyed.some((id) => settleable(world, state, faction, id, kind).length > 0);
  const unsurveyedLeft = world.systems.some((x) => !power.surveyed.includes(x.id));
  // A ship costs upkeep: none is built while the treasury gains nothing a turn.
  const income = treasuryOf(world, state, faction).total;
  for (const h of mine) {
    if (!h.projects.includes('shipyard') || h.queue.some((q) => q.kind === 'ship')) continue;
    if (power.treasury < SHIP_TREASURY || income <= 0) continue;
    const ship: QueueItem | null =
      idle('colony') === 0 && settleTargets('colony')
        ? { kind: 'ship', ship: 'colony' }
        : idle('outpost') === 0 && settleTargets('outpost')
          ? { kind: 'ship', ship: 'outpost' }
          : idle('survey') < 2 && unsurveyedLeft
            ? { kind: 'ship', ship: 'survey' }
            : null;
    if (ship) orders.push({ type: 'queue', holding: h.id, item: ship });
  }

  // Lanes: outposts (and the Authority's colonies) queue the nearest they can, when idle.
  for (const h of mine) {
    if (h.queue.length > 0 || (h.kind === 'colony' && !me.laneBuilder)) continue;
    const lane = laneTargets(world, state, faction, h.system).find((t) => t.refusal === null);
    if (lane) orders.push({ type: 'queue', holding: h.id, item: { kind: 'lane', to: lane.quote.to } });
  }

  // Research: the cheapest it can, its own fields first.
  if (power.researchQueue.length === 0) {
    const next = canResearch(power).sort(
      (a, b) =>
        Number(!me.fields.includes(TECHS[a].field)) - Number(!me.fields.includes(TECHS[b].field)) ||
        TECHS[a].cost - TECHS[b].cost ||
        (a < b ? -1 : 1),
    )[0];
    if (next) orders.push({ type: 'research', tech: next });
  }

  // Taxes: its own rate while the treasury allows; a step higher while it runs low and falls;
  // low while a colony is in unrest and the treasury holds plenty.
  const unrest = mine.some((h: Holding) => {
    const level = approvalOf(world, state, h).level;
    return h.kind === 'colony' && (level === 'unrest' || level === 'revolt');
  });
  const rates: readonly TaxRate[] = ['low', 'standard', 'high'];
  const now = rates.indexOf(power.taxes);
  const taxes: TaxRate =
    power.treasury < LOW_TREASURY && treasuryOf(world, state, faction).total <= 0
      ? (rates[Math.min(2, now + 1)] ?? 'high')
      : unrest && power.treasury >= RICH_TREASURY
        ? 'low'
        : power.treasury >= LOW_TREASURY * 2
          ? me.taxes
          : power.taxes;
  if (power.taxes !== taxes) orders.push({ type: 'taxes', rate: taxes });

  // Its event (§27.4): the first choice when it can pay and keep 20 credits, else the second.
  if (power.event && power.event.answer === null) orders.push({ type: 'answer', choice: rivalChoice(state, faction) });
  return orders;
}
