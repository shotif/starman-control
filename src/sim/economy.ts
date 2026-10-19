// What colonies and outposts make (M1_COLONIES.md §2), as figures with their parts, so every number
// can explain itself (§7: "Industry 13 = 10 from people + 2 from the capital + 1 from Administration").
// Pure and in whole numbers.

import { FACTIONS, type FactionId } from '../content/factions.ts';
import { type BuildItem, type Cost, itemCost, PROJECTS, type QueueItem } from '../content/projects.ts';
import { RULES } from '../content/rules.ts';
import { SHIPS, type ShipType } from '../content/ships.ts';
import type { SystemId } from '../data/types.ts';
import { type Body, bodiesOf } from './bodies.ts';
import { ceilDiv } from './geometry.ts';
import { habitability } from './habitability.ts';
import { laneQuote, laneRefusal } from './lanes.ts';
import { effects, speciesFor } from './research.ts';
import { type GameState, type Holding, holdingOn, powerOf, type Stockpile } from './state.ts';
import type { World } from './world.ts';

export type Resource = keyof Stockpile;

export interface Part {
  label: string;
  value: number;
}

export interface Figure {
  total: number;
  parts: Part[];
}

export function bodyOf(world: World, state: GameState, h: Holding): Body | undefined {
  return h.body ? bodiesOf(world, state.seed, h.system).find((b) => b.id === h.body) : undefined;
}

/** Room for people, in tenths of a unit: the capital's fixed room, or its world's for its species. */
export function capacityOf(world: World, state: GameState, h: Holding): number {
  if (h.kind !== 'colony') return 0;
  if (h.capital) return RULES.capital.capacity;
  const body = bodyOf(world, state, h);
  return body ? habitability(body, speciesFor(state, h.owner)).capacity * 10 : 0;
}

/** A colony's industry a turn: 1 for each whole unit of people, the capital's, the traits'. An outpost's own, for lanes. */
export function industryOf(h: Holding): Figure {
  if (h.kind !== 'colony')
    return { total: RULES.outposts.industry, parts: [{ label: 'an outpost’s own', value: RULES.outposts.industry }] };
  const units = Math.floor(h.people / 10);
  const parts: Part[] = [{ label: 'from people', value: units }];
  if (h.capital) parts.push({ label: 'from the capital', value: RULES.capital.industry });
  const base = parts.reduce((sum, p) => sum + p.value, 0);
  for (const t of FACTIONS[h.owner].traits) {
    if (t.effect.kind !== 'industry-percent') continue;
    parts.push({ label: `from ${t.name} (+${t.effect.percent}%)`, value: Math.floor((base * t.effect.percent) / 100) });
  }
  return { total: parts.reduce((sum, p) => sum + p.value, 0), parts };
}

/** Which of a body's riches a holding on it gathers (§2). */
export function mainResource(body: Body): Resource | null {
  switch (body.kind) {
    case 'rocky':
    case 'super-earth':
    case 'belt':
      return body.riches.metals > 0 ? 'metals' : body.riches.volatiles > 0 ? 'volatiles' : null;
    case 'moon':
    case 'dwarf':
      return body.riches.volatiles > 0 ? 'volatiles' : body.riches.metals > 0 ? 'metals' : null;
    default:
      return body.riches.fuel > 0 ? 'fuel' : null;
  }
}

const RESOURCE_WORD: Record<Resource, string> = { metals: 'metals', volatiles: 'volatiles', fuel: 'fusion fuel' };

export function resourceWord(r: Resource): string {
  return RESOURCE_WORD[r];
}

/** What a holding adds to the stockpile a turn, each with its reason. */
export function yieldsOf(
  world: World,
  state: GameState,
  h: Holding,
): { total: Stockpile; parts: (Part & { resource: Resource })[] } {
  const parts: (Part & { resource: Resource })[] = [];
  const body = bodyOf(world, state, h);
  if (body) {
    const r = mainResource(body);
    if (r)
      parts.push({
        label: `${body.name} (${body.riches[r] === 2 ? 'rich' : 'poor'})`,
        value: body.riches[r],
        resource: r,
      });
  }
  if (h.capital) {
    const y = RULES.capital.yields;
    if (y.metals) parts.push({ label: 'the capital', value: y.metals, resource: 'metals' });
    if (y.volatiles) parts.push({ label: 'the capital', value: y.volatiles, resource: 'volatiles' });
    if (y.fuel) parts.push({ label: 'the capital', value: y.fuel, resource: 'fuel' });
  }
  if (h.projects.includes('mine')) parts.push({ label: 'its mine', value: 1, resource: 'metals' });
  const mainOf = body ? mainResource(body) : null;
  if (h.kind === 'outpost' && mainOf)
    for (const e of effects(state, h.owner, 'outpost-yield'))
      parts.push({ label: 'automated mining', value: e.amount, resource: mainOf });
  const total: Stockpile = { metals: 0, volatiles: 0, fuel: 0 };
  for (const p of parts) total[p.resource] += p.value;
  return { total, parts };
}

/** What a power gains a turn, in all. */
export function incomeOf(world: World, state: GameState, faction: FactionId): Stockpile {
  const total: Stockpile = { metals: 0, volatiles: 0, fuel: 0 };
  for (const h of state.holdings) {
    if (h.owner !== faction) continue;
    const y = yieldsOf(world, state, h).total;
    total.metals += y.metals;
    total.volatiles += y.volatiles;
    total.fuel += y.fuel;
  }
  return total;
}

/** People gained a turn, in tenths of a unit: logistic, at least a tenth while there is room (§2). */
export function growthOf(world: World, state: GameState, h: Holding): number {
  const cap = capacityOf(world, state, h);
  if (h.kind !== 'colony' || h.people >= cap || cap === 0) return 0;
  // The traits' and technologies' percentages add up, then apply to the base rate.
  const base = RULES.colonies.growthPercent;
  let percent = 0;
  for (const t of FACTIONS[h.owner].traits) if (t.effect.kind === 'growth-percent') percent += t.effect.percent;
  for (const e of effects(state, h.owner, 'growth-percent')) percent += e.percent;
  const rate = base + Math.floor((base * percent) / 100);
  const grow = Math.floor((h.people * (cap - h.people) * rate) / (cap * 100));
  return Math.min(cap - h.people, Math.max(1, grow));
}

/** Why a colony could not be founded on a body by a faction, or null if it can (M1_COLONIES.md §1). */
export function settleRefusal(
  world: World,
  state: GameState,
  faction: FactionId,
  system: SystemId,
  bodyId: string,
  kind: 'colony' | 'outpost',
): string | null {
  const body = bodiesOf(world, state.seed, system).find((b) => b.id === bodyId);
  if (!body) return 'There is no such world here.';
  const power = powerOf(state, faction);
  if (!power.surveyed.includes(system)) return `${world.system(system).name} has not been surveyed.`;
  const held = holdingOn(state, bodyId);
  if (held)
    return `${body.name} already has ${held.owner === faction ? 'your' : held.kind === 'outpost' ? 'an' : 'a'} ${held.kind} on it.`;
  if (state.ships.some((s) => s.founding?.body === bodyId && s.owner === faction))
    return `Another ship is already founding on ${body.name}.`;
  if (kind === 'outpost') return null;
  const h = habitability(body, speciesFor(state, faction));
  if (h.level === 'uninhabitable') return `Your people cannot live on ${body.name}.`;
  if (h.level === 'harsh' && effects(state, faction, 'settle-harsh').length === 0)
    return `${body.name} is harsh: your people need habitat domes, a technology, to live there.`;
  return null;
}

/** Bodies in a system a ship could found on now, for the ship's panel and what needs you. */
export function settleable(
  world: World,
  state: GameState,
  faction: FactionId,
  system: SystemId,
  kind: 'colony' | 'outpost',
): Body[] {
  return bodiesOf(world, state.seed, system).filter(
    (b) => settleRefusal(world, state, faction, system, b.id, kind) === null,
  );
}

/** What an item costs where it is queued: a ship's or project's own cost, or the lane's. */
export function costOf(world: World, state: GameState, h: Holding, item: QueueItem): Cost {
  if (item.kind === 'lane') return laneQuote(world, state, h.owner, h.system, item.to).cost;
  const c = { ...itemCost(item) };
  if (item.kind === 'ship') {
    for (const e of effects(state, h.owner, 'ship-industry-discount'))
      c.industry = ceilDiv(c.industry * (100 - e.percent), 100);
    for (const e of effects(state, h.owner, 'ship-discount')) {
      if (e.ship !== item.ship) continue;
      const keep = 100 - e.percent;
      c.industry = ceilDiv(c.industry * keep, 100);
      c.metals = ceilDiv(c.metals * keep, 100);
      c.volatiles = ceilDiv(c.volatiles * keep, 100);
      c.fuel = ceilDiv(c.fuel * keep, 100);
    }
  }
  return c;
}

/** Why a colony or outpost cannot queue an item, or null (M1_COLONIES.md §3, M1_LANES_RESEARCH.md §1). */
export function queueRefusal(world: World, state: GameState, h: Holding, item: QueueItem): string | null {
  if (item.kind === 'lane') return laneRefusal(world, state, h.owner, h.system, item.to);
  if (h.kind !== 'colony') return 'Outposts build only lanes.';
  if (item.kind === 'ship') {
    if (!h.projects.includes('shipyard')) return 'Ships need a shipyard.';
    return null;
  }
  if (h.projects.includes(item.project)) return `It already has a ${PROJECTS[item.project].name.toLowerCase()}.`;
  if (h.queue.some((q) => q.kind === 'project' && q.project === item.project))
    return `A ${PROJECTS[item.project].name.toLowerCase()} is already queued.`;
  return null;
}

/** Every ship and project a colony might build, each with why not if it cannot (lanes: lanes.ts). */
export function buildOptions(
  world: World,
  state: GameState,
  h: Holding,
): { item: BuildItem; refusal: string | null }[] {
  const ships: BuildItem[] = (Object.keys(SHIPS) as ShipType[]).map((ship) => ({ kind: 'ship', ship }));
  const projects: BuildItem[] = Object.values(PROJECTS).map((p) => ({ kind: 'project', project: p.id }));
  return [...ships, ...projects].map((item) => ({ item, refusal: queueRefusal(world, state, h, item) }));
}

/** What the first item still lacks: industry (it waits for more), or resources from the stockpile. */
export function shortfall(
  world: World,
  state: GameState,
  h: Holding,
): { industry: number; missing: Partial<Stockpile> } | null {
  const first = h.queue[0];
  if (!first) return null;
  const stockpile = powerOf(state, h.owner).stockpile;
  const c = costOf(world, state, h, first);
  const missing: Partial<Stockpile> = {};
  if (stockpile.metals < c.metals) missing.metals = c.metals - stockpile.metals;
  if (stockpile.volatiles < c.volatiles) missing.volatiles = c.volatiles - stockpile.volatiles;
  if (stockpile.fuel < c.fuel) missing.fuel = c.fuel - stockpile.fuel;
  return { industry: Math.max(0, c.industry - h.industry), missing };
}

/**
 * Roughly when each queued item will be finished, in turns from now (1: when this turn ends), at
 * today's industry and with the resources to hand; null if the colony makes no industry. Growth
 * and waiting for resources can change it, so the interface says "about".
 */
export function queueTurns(world: World, state: GameState, h: Holding): (number | null)[] {
  const rate = industryOf(h).total;
  let need = -h.industry;
  return h.queue.map((item) => {
    need += costOf(world, state, h, item).industry;
    if (need <= 0) return 1;
    return rate > 0 ? Math.max(1, Math.ceil(need / rate)) : null;
  });
}
