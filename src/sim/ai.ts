// How a rival plays (M2_WORLDS.md §26.2, D-37): its orders for a turn, worked out from the state
// alone, so the same game always plays the same way (D-06), and given through the same orders as
// the player's, refused for the same reasons. Its colonies are run by governors (`govern`); this
// decides its ships, its shipyards, its lanes, its research and its taxes, in its power's character.

import type { Priority } from '../content/edicts.ts';
import { FACTIONS, type FactionId } from '../content/factions.ts';
import type { ProjectId, QueueItem } from '../content/projects.ts';
import { RULES } from '../content/rules.ts';
import { isHull } from '../content/ships.ts';
import { type FieldId, TECHS, type TechId } from '../content/techs.ts';
import { TREATY_KINDS } from '../content/treaties.ts';
import type { SystemId } from '../data/types.ts';
import { investigateRefusal } from './anomalies.ts';
import { buildable } from './designs.ts';
import { approvalOf, edictCost, industryOf, queueRefusal, settleable, treasuryOf } from './economy.ts';
import { rivalChoice } from './events.ts';
import { fleetAt } from './fleets.ts';
import { habitability } from './habitability.ts';
import { laneTargets } from './lanes.ts';
import { attitudeOf, attitudeWord } from './memory.ts';
import { blindReachDeci, findRoute, lanesFor } from './movement.ts';
import type { Order } from './orders.ts';
import { canResearch, speciesFor, withNeeds } from './research.ts';
import { type Amount, contactWith, type GameState, type Holding, powerOf, type TaxRate } from './state.ts';
import { offerRefusal, partnerOf, treatiesOf, wouldAccept } from './treaties.ts';
import { atWar, enemiesOf } from './war.ts';
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
  /** The edict it issues when its attention is at its most (M2_WORLDS.md §29.1). */
  edict: 'crash-programme' | 'festival' | 'labour-drive';
  /** The doctrines it chooses, one of each pair (M2B_SCIENCE.md §19.1). */
  doctrines: readonly TechId[];
  /** The great work it builds at its capital when it can (§20.2). */
  greatWork: ProjectId;
  /** A broker offers its surplus of a resource for credits (M3_NEIGHBOURS.md §25.6). */
  broker?: boolean;
}

export const PERSONALITIES: Record<FactionId, Personality> = {
  sta: {
    capital: 'research',
    // Research-led (M2B_SCIENCE.md §18.4): its colonies run for research too.
    colonies: 'research',
    settles: 'roomiest',
    fields: ['survey', 'propulsion'],
    taxes: 'standard',
    laneBuilder: true,
    edict: 'crash-programme',
    doctrines: ['strong-centre', 'lane-network', 'industrial-worlds'],
    greatWork: 'lapse-archive',
  },
  frontier: {
    capital: 'grow',
    colonies: 'grow',
    settles: 'nearest',
    fields: ['life-sciences', 'society'],
    taxes: 'low',
    laneBuilder: false,
    edict: 'festival',
    doctrines: ['open-frontier', 'deep-jumpers', 'garden-worlds'],
    greatWork: 'commons',
  },
  'hollow-wake': {
    capital: 'produce',
    colonies: 'produce',
    settles: 'richest',
    fields: ['construction', 'propulsion'],
    taxes: 'high',
    laneBuilder: false,
    edict: 'labour-drive',
    doctrines: ['open-frontier', 'deep-jumpers', 'industrial-worlds'],
    greatWork: 'lanewright-foundry',
  },
  // Patient expanders far from anyone's lanes (M3_NEIGHBOURS.md §24.7).
  'dusk-concord': {
    capital: 'grow',
    colonies: 'grow',
    settles: 'nearest',
    fields: ['life-sciences', 'construction'],
    taxes: 'standard',
    laneBuilder: true,
    edict: 'festival',
    doctrines: ['open-frontier', 'lane-network', 'garden-worlds'],
    greatWork: 'commons',
  },
  // Brokers of the giants' fuel (M3_NEIGHBOURS.md §25.7).
  'drift-moot': {
    capital: 'produce',
    colonies: 'produce',
    settles: 'roomiest',
    fields: ['propulsion', 'society'],
    taxes: 'low',
    laneBuilder: true,
    edict: 'labour-drive',
    doctrines: ['open-frontier', 'lane-network', 'industrial-worlds'],
    greatWork: 'lanewright-foundry',
    broker: true,
  },
};

/** Below this, or with no income to keep one, a rival builds no ships. */
const SHIP_TREASURY = 20;
/** Below this and falling, a rival raises its taxes a step; from twice it, it goes back to its own. */
const LOW_TREASURY = 30;
/** With this much, a rival lowers its taxes while a colony is in unrest. */
const RICH_TREASURY = 100;
/** Overdrive (§29.1): steps bought at colonies with a queue from these treasuries; none below the last. */
const OVERDRIVE_AT: readonly (readonly [number, number])[] = [
  [500, 3],
  [250, 2],
  [100, 1],
];
const OVERDRIVE_OFF = 60;
/** With this much, and gaining, a rival's idle outpost may raise an orbital habitat (§18.4). */
const HABITAT_TREASURY = 60;

export function aiOrders(world: World, state: GameState, faction: FactionId): Order[] {
  const me = PERSONALITIES[faction];
  const power = powerOf(state, faction);
  const orders: Order[] = [];
  const claimed = new Set<string>();
  const mine = state.holdings.filter((h) => h.owner === faction);
  // Its lanes, with any it has passage on, once for all the routes it asks this turn.
  const lanes = lanesFor(world, state, faction, true);
  const reachable = (from: SystemId, to: SystemId) =>
    from === to || findRoute(world, state, faction, from, to, lanes) !== null;
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
    // Warships and fleets are ordered by increment 43's rules, not here (M4_FLEETS.md §22).
    if (s.investigating || s.fleet !== null || isHull(s.type)) continue;
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
  // At war (M4_FLEETS.md §24.9), every yard builds warships of the largest hull it knows, to a few
  // more than its colonies; and its fleets wait at the capital on defend.
  const atWarNow = enemiesOf(state, faction).length > 0;
  const warships = state.ships.filter((s) => s.owner === faction && isHull(s.type)).length;
  const yardDesign = [...buildable(power)].reverse()[0];
  let arming = atWarNow && yardDesign !== undefined && warships < mine.filter((h) => h.kind === 'colony').length + 2;
  for (const h of mine) {
    if (!h.projects.includes('shipyard') || h.queue.some((q) => q.kind === 'ship')) continue;
    if (power.treasury < SHIP_TREASURY || income <= 0) continue;
    if (arming && yardDesign) {
      orders.push({
        type: 'queue',
        holding: h.id,
        item: { kind: 'ship', ship: yardDesign.hull, design: yardDesign.id },
      });
      arming = warships + 1 < mine.filter((x) => x.kind === 'colony').length + 2;
      continue;
    }
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

  // At war, a battery at the capital and at each colony with a shipyard, as the treasury allows
  // (M4_FLEETS.md §26.11).
  if (atWarNow && power.treasury >= SHIP_TREASURY && income > 0) {
    const battery: QueueItem = { kind: 'project', project: 'defence-battery' };
    for (const h of mine)
      if ((h.capital || h.projects.includes('shipyard')) && queueRefusal(world, state, h, battery) === null)
        orders.push({ type: 'queue', holding: h.id, item: battery });
  }

  // Fleets wait at the capital, ready to defend it (§24.9).
  const home = power.capital;
  for (const f of state.fleets) {
    if (f.owner !== faction || f.destinations.length > 0 || f.hold) continue;
    const at = fleetAt(state, f);
    if (at !== null && at !== home && findRoute(world, state, faction, at, home, lanes))
      orders.push({ type: 'fleet-move', fleet: f.id, to: home });
  }

  // Lanes: outposts (and the Authority's colonies) queue the nearest they can, when idle. An idle
  // outpost with no lane to build raises an orbital habitat once its power knows how, one at a time,
  // while the treasury can keep a colony (M2B_SCIENCE.md §18.4).
  let habitats = mine.filter((h) =>
    h.queue.some((q) => q.kind === 'project' && q.project === 'orbital-habitat'),
  ).length;
  for (const h of mine) {
    if (h.queue.length > 0 || (h.kind === 'colony' && !me.laneBuilder)) continue;
    const lane = laneTargets(world, state, faction, h.system).find((t) => t.refusal === null);
    if (lane) {
      orders.push({ type: 'queue', holding: h.id, item: { kind: 'lane', to: lane.quote.to } });
      continue;
    }
    const habitat: QueueItem = { kind: 'project', project: 'orbital-habitat' };
    if (
      h.kind === 'outpost' &&
      habitats === 0 &&
      power.treasury >= HABITAT_TREASURY &&
      income > 0 &&
      queueRefusal(world, state, h, habitat) === null
    ) {
      orders.push({ type: 'queue', holding: h.id, item: habitat });
      habitats++;
    }
  }

  // Its great work (§20.2): at its capital, after what is queued there, when it can.
  const capital = mine.find((h) => h.capital);
  const work: QueueItem = { kind: 'project', project: me.greatWork };
  if (
    capital &&
    !capital.queue.some((q) => q.kind === 'project' && q.project === me.greatWork) &&
    queueRefusal(world, state, capital, work) === null
  )
    orders.push({ type: 'queue', holding: capital.id, item: work });

  // Research: the cheapest it can with what it needs, by base cost, its own fields at half the price
  // (M2B_SCIENCE.md §18.4), so a deep tree in its own fields does not keep it from the first steps of
  // the others.
  if (power.researchQueue.length === 0) {
    const price = (id: TechId) =>
      withNeeds(power, id).reduce((n, x) => n + TECHS[x].cost * (me.fields.includes(TECHS[x].field) ? 1 : 2), 0);
    // Of each pair of doctrines, only its own (§19.1).
    const own = (id: TechId) => !TECHS[id].fork || me.doctrines.includes(id);
    // Translation only while it learns a tongue (M3_NEIGHBOURS.md §19.4), as it does nothing else;
    // the Weapons field only once it holds warships (M4_FLEETS.md §21), for the same reason.
    const learning = power.contacts.some((c) => c.stage === 'words');
    const armed = state.ships.some((s) => s.owner === faction && isHull(s.type));
    const idle = (id: TechId) =>
      (!learning && withNeeds(power, id).some((x) => TECHS[x].effect.kind === 'translation')) ||
      (!armed && withNeeds(power, id).some((x) => TECHS[x].field === 'weapons'))
        ? 1
        : 0;
    // At war, its batteries first (§26.11).
    const defence: TechId = 'planetary-defence';
    const next =
      atWarNow && canResearch(power).includes(defence)
        ? defence
        : canResearch(power)
            .filter((id) => withNeeds(power, id).every(own))
            .sort((a, b) => idle(a) - idle(b) || price(a) - price(b) || (a < b ? -1 : 1))[0];
    if (next) orders.push({ type: 'research', tech: next });
  }

  // Dealing (M3_NEIGHBOURS.md §21.4): every few turns, each treaty it wants with each power it can
  // talk with, offered when the other's regard reaches what the other asks, or a gift when it falls
  // a little short; and notice given on a treaty with a power it has turned against.
  orders.push(...dealings(world, state, faction));

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

  // Overdrive (§29.1): credits turned into industry while the treasury is full, stopped when it runs low.
  const steps = OVERDRIVE_AT.find(([at]) => power.treasury >= at)?.[1] ?? (power.treasury < OVERDRIVE_OFF ? 0 : null);
  for (const h of mine) {
    if (h.kind !== 'colony') continue;
    const want = h.queue.length === 0 ? 0 : (steps ?? h.overdrive);
    if (want !== h.overdrive) orders.push({ type: 'overdrive', holding: h.id, steps: want });
  }

  // Edicts (§29.1): a festival where a colony is restless; else, with attention at its most, its own.
  const colonies = mine.filter((h) => h.kind === 'colony');
  const approval = (h: Holding) => approvalOf(world, state, h).total;
  const restless = colonies.find((h) => {
    const level = approvalOf(world, state, h).level;
    return level === 'unrest' || level === 'revolt';
  });
  const has = (e: string) => power.edicts.some((x) => x.edict === e);
  if (restless && !has('festival') && power.attention >= edictCost(state, faction, 'festival'))
    orders.push({ type: 'edict', edict: 'festival', holding: restless.id });
  else if (power.attention >= RULES.attention.most && !has(me.edict)) {
    const least = [...colonies].sort((a, b) => approval(a) - approval(b) || a.id - b.id)[0];
    const busiest = [...colonies].sort(
      (a, b) => industryOf(world, state, b).total - industryOf(world, state, a).total || a.id - b.id,
    )[0];
    if (me.edict === 'crash-programme') orders.push({ type: 'edict', edict: 'crash-programme' });
    else if (me.edict === 'festival' && least) orders.push({ type: 'edict', edict: 'festival', holding: least.id });
    else if (busiest) orders.push({ type: 'edict', edict: 'labour-drive', holding: busiest.id });
  }

  // Its event (§27.4): the first choice when it can pay and keep 20 credits, else the second.
  if (power.event && power.event.answer === null) orders.push({ type: 'answer', choice: rivalChoice(state, faction) });
  return orders;
}

/**
 * A rival's offers, gifts and notices this turn (M3_NEIGHBOURS.md §21.4, §23): a treaty to each
 * power it can talk with when both would have it (passage and protection only where one sells
 * them and the buyer can pay), a gift where that would nearly do, and an exchange when it runs short.
 */
export function dealings(world: World, state: GameState, faction: FactionId): Order[] {
  const t = RULES.treaties;
  const power = powerOf(state, faction);
  const orders: Order[] = [];
  const index = state.powers.findIndex((p) => p.faction === faction);
  // Peace (M4_FLEETS.md §23.2): every few turns, to each power a war with has lasted long enough.
  const w = RULES.war;
  for (const war of state.wars) {
    if (war.a !== faction && war.b !== faction) continue;
    const other = war.a === faction ? war.b : war.a;
    const lasted = state.turn - war.since;
    if (
      lasted >= w.offerPeaceAfter &&
      lasted % w.offerPeaceEvery === 0 &&
      !offerRefusal(state, faction, other, 'peace')
    )
      orders.push({ type: 'offer', to: other, treaty: 'peace' });
  }
  if ((state.turn + index) % t.offerEvery === 0) {
    let treasury = power.treasury;
    for (const other of state.powers) {
      if (other.faction === faction || contactWith(power, other.faction)?.stage !== 'talk') continue;
      if (atWar(state, faction, other.faction)) continue;
      const theirs = attitudeOf(world, state, other.faction, faction).total;
      const lastGift = other.memories.some(
        (m) => m.faction === faction && m.kind === 'gift' && m.turn > state.turn - t.giftEvery,
      );
      let gave = false;
      for (const kind of TREATY_KINDS) {
        const asks = FACTIONS[other.faction].asks[kind];
        if (
          asks === null ||
          !wouldAccept(world, state, faction, other.faction, kind) ||
          offerRefusal(state, faction, other.faction, kind)
        )
          continue;
        if (wouldAccept(world, state, other.faction, faction, kind))
          orders.push({ type: 'offer', to: other.faction, treaty: kind });
        else if (!gave && !lastGift && theirs >= asks - t.giftWithin && treasury > t.giftAbove) {
          orders.push({ type: 'gift', to: other.faction, credits: t.gift });
          treasury -= t.gift;
          gave = true;
        }
      }
    }
    const trade = exchangeWanted(world, state, faction);
    if (trade) orders.push(trade);
  }
  // Notice when its regard falls below nothing, or ten below what it asked of a treaty it was glad
  // of at less; and on what it pays for, when its treasury runs low and falls.
  const short = power.treasury < t.keep && treasuryOf(world, state, faction).total < 0;
  for (const treaty of treatiesOf(state, faction)) {
    if (treaty.ends !== null) continue;
    const other = partnerOf(treaty, faction);
    const asks = FACTIONS[faction].asks[treaty.kind] ?? 0;
    if (attitudeOf(world, state, faction, other).total < Math.min(0, asks - 10) || (treaty.payer === faction && short))
      orders.push({ type: 'end-treaty', with: other, treaty: treaty.kind });
  }
  return orders;
}

/**
 * A rival short of a resource, with credits to spare, offers credits for it (§23.1); a broker with
 * a surplus offers some of it for credits (§25.6): to the power it can talk with that regards it
 * best, at least neutrally.
 */
function exchangeWanted(world: World, state: GameState, faction: FactionId): Order | null {
  const x = RULES.exchanges;
  const power = powerOf(state, faction);
  const resources = ['metals', 'volatiles', 'fuel'] as const;
  const short = resources.find((r) => power.stockpile[r] < x.short);
  const surplus = PERSONALITIES[faction].broker ? resources.find((r) => power.stockpile[r] > x.surplus) : undefined;
  let give: Amount;
  let get: Amount;
  if (short && power.treasury > x.offerAbove) {
    give = { resource: 'credits', amount: x.offerCredits };
    get = { resource: short, amount: x.offerAmount };
  } else if (surplus) {
    give = { resource: surplus, amount: x.offerAmount };
    get = { resource: 'credits', amount: x.offerCredits };
  } else return null;
  let best: { to: FactionId; regard: number } | null = null;
  for (const other of state.powers) {
    if (other.faction === faction || offerRefusal(state, faction, other.faction, 'exchange', give, get)) continue;
    const regard = attitudeOf(world, state, other.faction, faction).total;
    if (x.asks[attitudeWord(regard)] === undefined || attitudeWord(regard) === 'cold') continue;
    if (!best || regard > best.regard) best = { to: other.faction, regard };
  }
  return best ? { type: 'offer', to: best.to, treaty: 'exchange', give, get } : null;
}
