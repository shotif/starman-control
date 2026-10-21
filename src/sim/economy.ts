// What colonies and outposts make (M1_COLONIES.md §2, M2_WORLDS.md §2 to §5), as figures with their
// parts, so every number can explain itself ("Industry 11 = 9 from 3 works + 2 from the capital").
// Districts are worked by the colony's people, a million each; food is shared along a power's
// lanes; credits come from taxes and markets and go on upkeep; approval scales what the districts
// yield. Pure and in whole numbers.

import { type District, ZONE_DEFS, type Zone } from '../content/districts.ts';
import { FACTIONS, type FactionId } from '../content/factions.ts';
import { type BuildItem, type Cost, itemCost, PROJECTS, type QueueItem, withArticle } from '../content/projects.ts';
import { RULES } from '../content/rules.ts';
import { SHIPS, type ShipType } from '../content/ships.ts';
import { TECHS } from '../content/techs.ts';
import type { SystemId } from '../data/types.ts';
import { type Body, bodiesOf } from './bodies.ts';
import { ceilDiv } from './geometry.ts';
import { habitability } from './habitability.ts';
import { laneQuote, laneRefusal } from './lanes.ts';
import { findRoute, lanesFor } from './movement.ts';
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

function sum(parts: Part[]): number {
  return parts.reduce((n, p) => n + p.value, 0);
}

export function bodyOf(world: World, state: GameState, h: Holding): Body | undefined {
  return h.body ? bodiesOf(world, state.seed, h.system).find((b) => b.id === h.body) : undefined;
}

// ---------------------------------------------------------------- districts

/** How many districts a colony has: its world's size, a capital ten (M2_WORLDS.md §2); none for an outpost. */
export function districtCount(world: World, state: GameState, h: Holding): number {
  if (h.kind !== 'colony') return 0;
  if (h.capital) return RULES.districts.capital;
  return Math.max(1, bodyOf(world, state, h)?.size ?? 1);
}

/** The district in a slot, if it is zoned. */
export function districtAt(h: Holding, slot: number): District | undefined {
  return h.districts.find((d) => d.slot === slot);
}

/** The first open slot not already being zoned, or null when every district is zoned or queued. */
export function freeSlot(world: World, state: GameState, h: Holding): number | null {
  const n = districtCount(world, state, h);
  for (let slot = 1; slot <= n; slot++) {
    if (districtAt(h, slot)) continue;
    if (h.queue.some((q) => q.kind === 'zone' && q.slot === slot)) continue;
    return slot;
  }
  return null;
}

/** Whole millions of people, who work the districts. */
export function workforce(h: Holding): number {
  return h.kind === 'colony' ? Math.floor(h.people / RULES.districts.workers) : 0;
}

/** The slots whose districts are worked: housing always counts; the rest in order, a million each. */
export function workedSlots(h: Holding): Set<number> {
  let left = workforce(h);
  const out = new Set<number>();
  for (const d of h.districts) {
    if (!ZONE_DEFS[d.zone].worked) continue;
    if (left <= 0) break;
    out.add(d.slot);
    left--;
  }
  return out;
}

/** Districts of a zone that are worked. */
function worked(h: Holding, zone: Zone): number {
  const slots = workedSlots(h);
  return h.districts.filter((d) => d.zone === zone && slots.has(d.slot)).length;
}

/** Millions with no district to work. */
export function idleMillions(h: Holding): number {
  const jobs = h.districts.filter((d) => ZONE_DEFS[d.zone].worked).length;
  return Math.max(0, workforce(h) - jobs);
}

/** Districts zoned but with no one to work them. */
export function unworkedDistricts(h: Holding): number {
  const jobs = h.districts.filter((d) => ZONE_DEFS[d.zone].worked).length;
  return Math.max(0, jobs - workforce(h));
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

/** What one worked district of a zone yields at this colony, before approval: its base, the power's technologies and the colony's projects. */
export function zoneYield(world: World, state: GameState, h: Holding, zone: Zone): number {
  const d = RULES.districts;
  let tech = 0;
  for (const e of effects(state, h.owner, 'zone-yield')) if (e.zone === zone) tech += e.amount;
  switch (zone) {
    case 'farms': {
      if (h.capital) return d.farms.comfortable + tech;
      const body = bodyOf(world, state, h);
      const level = body ? habitability(body, speciesFor(state, h.owner)).level : 'harsh';
      const base =
        level === 'comfortable' ? d.farms.comfortable : level === 'tolerable' ? d.farms.tolerable : d.farms.harsh;
      return base + tech;
    }
    case 'works':
      return d.works + tech;
    case 'labs':
      return d.labs + tech + (h.projects.includes('research-institute') ? RULES.projects.instituteLab : 0);
    case 'market':
      return (h.projects.includes('lane-station') ? d.marketWithStation : d.market) + tech;
    case 'mines': {
      const body = bodyOf(world, state, h);
      const r = body ? mainResource(body) : null;
      return body && r ? body.riches[r] + (h.projects.includes('mine') ? 1 : 0) + tech : 0;
    }
    case 'housing':
      return 0;
  }
}

/**
 * How a colony with no districts yet is zoned for its people, as a balanced governor would: enough
 * farms to feed it, then mines where there are riches, works, labs and a market in turn; one
 * district for each whole million, at least one (a save from before M2, M2_WORLDS.md §16).
 */
export function startZoning(world: World, state: GameState, h: Holding): District[] {
  const bare = { ...h, districts: [] };
  const n = districtCount(world, state, bare);
  const want = Math.min(n, Math.max(1, workforce(h)));
  const body = bodyOf(world, state, h);
  const farms = Math.min(
    want,
    ceilDiv(ceilDiv(h.people, RULES.food.eatenPer), Math.max(1, zoneYield(world, state, bare, 'farms'))),
  );
  const cycle: Zone[] =
    body && mainResource(body) ? ['mines', 'works', 'labs', 'works', 'market'] : ['works', 'labs', 'works', 'market'];
  const zones: Zone[] = [];
  for (let i = 0; i < farms; i++) zones.push('farms');
  while (zones.length < want) zones.push(cycle[(zones.length - farms) % cycle.length] as Zone);
  return zones.map((zone, i) => ({ zone, slot: i + 1 }));
}

/** Why a district cannot be zoned for a use here, or null if it can. */
export function zoneRefusal(world: World, state: GameState, h: Holding, zone: Zone, slot: number): string | null {
  if (h.kind !== 'colony') return 'Outposts have no districts.';
  if (slot < 1 || slot > districtCount(world, state, h)) return 'There is no such district.';
  if (districtAt(h, slot)?.zone === zone) return `It is already zoned for ${ZONE_DEFS[zone].name.toLowerCase()}.`;
  if (h.queue.some((q) => q.kind === 'zone' && q.slot === slot)) return 'That district is already being zoned.';
  if (zone === 'mines') {
    const body = bodyOf(world, state, h);
    if (!body || !mainResource(body)) return 'Its world has no riches to mine.';
  }
  return null;
}

// ---------------------------------------------------------------- room and growth

/** Room for people, in tenths: the world's room for its species (the capital's own), and housing. */
export function capacityOf(world: World, state: GameState, h: Holding): number {
  if (h.kind !== 'colony') return 0;
  const housing =
    h.districts.filter((d) => d.zone === 'housing').length * RULES.districts.housing +
    (h.projects.includes('arcology') ? RULES.projects.arcology : 0);
  if (h.capital) return RULES.capital.room + housing;
  const body = bodyOf(world, state, h);
  return (body ? habitability(body, speciesFor(state, h.owner)).capacity * 10 : 0) + housing;
}

/** People gained a turn, in tenths: logistic, at least a tenth while there is room; none when hungry or unhappy (§2). */
export function growthOf(world: World, state: GameState, h: Holding): number {
  const cap = capacityOf(world, state, h);
  if (h.kind !== 'colony' || h.people >= cap || cap === 0) return 0;
  if (h.hungry > 0) return 0;
  const level = approvalOf(world, state, h).level;
  if (level === 'unrest' || level === 'revolt') return 0;
  // The traits' and technologies' percentages add up, then apply to the base rate.
  const base = RULES.colonies.growthPercent;
  let percent = 0;
  for (const t of FACTIONS[h.owner].traits) if (t.effect.kind === 'growth-percent') percent += t.effect.percent;
  for (const e of effects(state, h.owner, 'growth-percent')) percent += e.percent;
  if (h.projects.includes('medical-centre')) percent += RULES.projects.medicalPercent;
  const rate = base + Math.floor((base * percent) / 100);
  const grow = Math.floor((h.people * (cap - h.people) * rate) / (cap * 100));
  return Math.min(cap - h.people, Math.max(1, grow));
}

// ---------------------------------------------------------------- approval

export type ApprovalLevel = 'content' | 'uneasy' | 'unrest' | 'revolt';

/** Lane jumps from the power's capital, or null when no lane of its leads there. */
export function jumpsFromCapital(world: World, state: GameState, h: Holding): number | null {
  const capital = powerOf(state, h.owner).capital;
  if (h.system === capital) return 0;
  const route = findRoute(world, state, h.owner, capital, h.system);
  return route ? route.length : null;
}

/** A colony's approval, 0 to 100, its parts and its level (M2_WORLDS.md §5). */
export function approvalOf(world: World, state: GameState, h: Holding): Figure & { level: ApprovalLevel } {
  const a = RULES.approval;
  const parts: Part[] = [{ label: 'to begin with', value: a.base }];
  const power = powerOf(state, h.owner);
  let tax: number = a.taxes[power.taxes];
  if (power.taxes === 'high') for (const e of effects(state, h.owner, 'tax-relief')) tax += e.approval;
  if (tax !== 0) parts.push({ label: `${power.taxes} taxes`, value: tax });
  if (h.capital) parts.push({ label: 'the seat of government', value: a.capital });
  const civic = civicOf(world, state, h);
  if (civic > 0)
    parts.push({
      label: civic === RULES.projects.civicHere ? 'the civic centre' : 'a civic centre near',
      value: civic,
    });
  if (h.projects.includes('recreation-dome'))
    parts.push({ label: 'the recreation dome', value: RULES.projects.recreation });
  if (h.hungry > 0) parts.push({ label: 'hungry', value: a.hungry });
  // Idle people make nothing, and cost no approval (D-43).
  if (h.people >= capacityOf(world, state, h)) parts.push({ label: 'full', value: a.full });
  const body = bodyOf(world, state, h);
  if (body && habitability(body, speciesFor(state, h.owner)).level === 'harsh')
    parts.push({ label: 'life under domes', value: a.domes });
  const jumps = jumpsFromCapital(world, state, h);
  let near: number = a.nearJumps;
  for (const e of effects(state, h.owner, 'near-jumps')) near += e.jumps;
  if (jumps === null) parts.push({ label: 'no lane to the capital', value: a.farMost });
  else if (jumps > near)
    parts.push({ label: `${jumps} jumps from the capital`, value: Math.max(a.farMost, (jumps - near) * a.far) });
  if (power.treasury < 0) parts.push({ label: 'the treasury in debt', value: a.debt });
  const total = Math.max(0, Math.min(100, sum(parts)));
  const level: ApprovalLevel =
    total >= a.levels.content
      ? 'content'
      : total >= a.levels.uneasy
        ? 'uneasy'
        : total >= a.levels.unrest
          ? 'unrest'
          : 'revolt';
  return { total, parts, level };
}

/**
 * Approval from civic centres (§23.1): +10 with one here, else +5 with one at another of the power's
 * colonies within two lane jumps; never both, never two of either.
 */
export function civicOf(world: World, state: GameState, h: Holding): number {
  const p = RULES.projects;
  if (h.kind !== 'colony') return 0;
  if (h.projects.includes('civic-centre')) return p.civicHere;
  for (const o of state.holdings) {
    if (o === h || o.owner !== h.owner || !o.projects.includes('civic-centre')) continue;
    if (o.system === h.system) return p.civicNear;
    const route = findRoute(world, state, h.owner, o.system, h.system);
    if (route && route.length <= p.civicJumps) return p.civicNear;
  }
  return 0;
}

/** What share of its districts' yields a colony keeps at its approval, in percent. */
export function keepsOf(world: World, state: GameState, h: Holding): number {
  return h.kind === 'colony' ? RULES.approval.keeps[approvalOf(world, state, h).level] : 100;
}

/** Each zone's districts in words, one and many: "from 1 farm", "from 3 works". */
const ZONE_WORDS: Record<Zone, readonly [string, string]> = {
  farms: ['farm', 'farms'],
  works: ['works', 'works'],
  mines: ['mine', 'mines'],
  labs: ['lab', 'labs'],
  market: ['market', 'markets'],
  housing: ['housing district', 'housing districts'],
};

/**
 * A district yield's parts: "from 3 works" and, when unhappy, what approval takes off; what is
 * kept is rounded to the nearest whole number, so "10% less" is not a third less on a small yield.
 */
function districtParts(world: World, state: GameState, h: Holding, zone: Zone): { parts: Part[]; value: number } {
  const n = worked(h, zone);
  if (n === 0) return { parts: [], value: 0 };
  const full = n * zoneYield(world, state, h, zone);
  const keeps = keepsOf(world, state, h);
  const kept = Math.floor((full * keeps + 50) / 100);
  const parts: Part[] = [{ label: `from ${n} ${ZONE_WORDS[zone][n === 1 ? 0 : 1]}`, value: full }];
  if (kept < full) parts.push({ label: `${approvalOf(world, state, h).level} (${keeps}%)`, value: kept - full });
  return { parts, value: kept };
}

// ---------------------------------------------------------------- industry and research

/** Overdrive: industry bought with credits this turn, in steps, and what it costs (M2_WORLDS.md §4). */
export function overdriveOf(base: number, steps: number): { industry: number; credits: number } {
  const step = Math.floor(base / 4);
  let credits = 0;
  for (let i = 0; i < Math.min(steps, RULES.credits.overdriveSteps.length); i++)
    credits += step * (RULES.credits.overdriveSteps[i] ?? 0);
  return { industry: step * Math.min(steps, RULES.credits.overdriveSteps.length), credits };
}

/** Whether a colony's fusion plant would run this turn: it has one, and there is fuel to burn. */
export function fusionRuns(state: GameState, h: Holding): boolean {
  return h.projects.includes('fusion-plant') && powerOf(state, h.owner).stockpile.fuel >= RULES.projects.fusionFuel;
}

/**
 * A colony's industry a turn: its works, the capital's own (or a colony's own), a fusion plant, the
 * traits', and any overdrive; an outpost's own, for lanes. `fusion` says whether the plant runs
 * (the turn decides it, as fuel is shared); by default, when there is fuel.
 */
export function industryOf(world: World, state: GameState, h: Holding, fusion = fusionRuns(state, h)): Figure {
  if (h.kind !== 'colony')
    return { total: RULES.outposts.industry, parts: [{ label: 'an outpost’s own', value: RULES.outposts.industry }] };
  if (approvalOf(world, state, h).level === 'revolt') return { total: 0, parts: [{ label: 'in revolt', value: 0 }] };
  const works = districtParts(world, state, h, 'works');
  const parts: Part[] = [...works.parts];
  if (h.capital) parts.push({ label: 'from the capital', value: RULES.capital.industry });
  else parts.push({ label: 'its own', value: RULES.colonies.industry });
  if (h.projects.includes('fusion-plant'))
    parts.push(
      fusion
        ? { label: 'from the fusion plant', value: RULES.projects.fusionIndustry }
        : { label: 'the fusion plant, with no fuel', value: 0 },
    );
  const base = sum(parts);
  for (const t of FACTIONS[h.owner].traits) {
    if (t.effect.kind !== 'industry-percent') continue;
    const value = Math.floor((base * t.effect.percent) / 100);
    if (value > 0) parts.push({ label: `from ${t.name} (+${t.effect.percent}%)`, value });
  }
  if (h.overdrive > 0) {
    const o = overdriveOf(sum(parts), h.overdrive);
    if (o.industry > 0) parts.push({ label: `bought for ${o.credits} credits`, value: o.industry });
  }
  return { total: sum(parts), parts };
}

/** Research a turn (M2_WORLDS.md §7): the labs of every colony and the capital's own. */
export function researchOf(world: World, state: GameState, faction: FactionId): Figure {
  let labs = 0;
  let lost = 0;
  let capital = 0;
  let institutes = 0;
  for (const h of state.holdings) {
    if (h.owner !== faction || h.kind !== 'colony') continue;
    const r = districtParts(world, state, h, 'labs');
    labs += sum(r.parts.slice(0, 1));
    lost += r.value - sum(r.parts.slice(0, 1));
    if (h.capital) capital += RULES.capital.research;
    if (h.projects.includes('research-institute') && approvalOf(world, state, h).level !== 'revolt')
      institutes += RULES.projects.instituteResearch;
  }
  const parts: Part[] = [];
  if (labs > 0) parts.push({ label: 'from labs', value: labs });
  if (lost < 0) parts.push({ label: 'lost to unhappiness', value: lost });
  if (institutes > 0) parts.push({ label: 'from research institutes', value: institutes });
  if (capital > 0) parts.push({ label: 'from the capital', value: capital });
  return { total: sum(parts), parts };
}

// ---------------------------------------------------------------- food

/** Food a colony makes and eats a turn (M2_WORLDS.md §3). */
export function foodOf(world: World, state: GameState, h: Holding): { made: Figure; eaten: number } {
  if (h.kind !== 'colony') return { made: { total: 0, parts: [] }, eaten: 0 };
  const farms = districtParts(world, state, h, 'farms');
  const parts = [...farms.parts];
  if (h.projects.includes('hydroponics') && approvalOf(world, state, h).level !== 'revolt')
    parts.push({ label: 'from hydroponics', value: RULES.projects.hydroponicsFood });
  return { made: { total: sum(parts), parts }, eaten: ceilDiv(h.people, RULES.food.eatenPer) };
}

/** A power's supply networks: colonies joined by its open lanes, the capital's first. */
export function networksOf(
  world: World,
  state: GameState,
  faction: FactionId,
): { home: boolean; colonies: Holding[] }[] {
  const colonies = state.holdings.filter((h) => h.owner === faction && h.kind === 'colony');
  const graph = lanesFor(world, state, faction);
  const capital = powerOf(state, faction).capital;
  const component = new Map<SystemId, number>();
  let next = 0;
  const systems = [capital, ...colonies.map((h) => h.system).filter((s) => s !== capital)];
  for (const start of systems) {
    if (component.has(start)) continue;
    const id = next++;
    const stack = [start];
    component.set(start, id);
    while (stack.length > 0) {
      const at = stack.pop() as SystemId;
      for (const hop of graph.get(at) ?? []) {
        if (component.has(hop.to)) continue;
        component.set(hop.to, id);
        stack.push(hop.to);
      }
    }
  }
  const out: { home: boolean; colonies: Holding[] }[] = [];
  for (let id = 0; id < next; id++) {
    const members = colonies.filter((h) => component.get(h.system) === id);
    if (members.length > 0 || id === 0) out.push({ home: id === 0, colonies: members });
  }
  return out;
}

/** A network's food a turn: made, eaten, and what the store holds (the capital's network only). */
export function networkFood(
  world: World,
  state: GameState,
  faction: FactionId,
  net: { home: boolean; colonies: Holding[] },
): { made: number; eaten: number; store: number; room: number } {
  let made = 0;
  let eaten = 0;
  for (const h of net.colonies) {
    const f = foodOf(world, state, h);
    made += f.made.total;
    eaten += f.eaten;
  }
  return {
    made,
    eaten,
    store: net.home ? powerOf(state, faction).food : 0,
    room: net.home ? RULES.food.storePerColony * Math.max(1, net.colonies.length) : 0,
  };
}

/** The network a colony belongs to. */
export function networkOf(world: World, state: GameState, h: Holding): { home: boolean; colonies: Holding[] } {
  return (
    networksOf(world, state, h.owner).find((n) => n.colonies.some((c) => c.id === h.id)) ?? {
      home: false,
      colonies: [h],
    }
  );
}

/** Turns until a network's store runs out at today's rate, or null if it is not running down. */
export function foodTurnsLeft(f: { made: number; eaten: number; store: number }): number | null {
  const net = f.made - f.eaten;
  if (net >= 0) return null;
  return Math.floor(f.store / -net);
}

// ---------------------------------------------------------------- credits

/** A colony's taxes and markets a turn, and the power's upkeep (M2_WORLDS.md §4). */
export function creditsOf(world: World, state: GameState, h: Holding): Figure {
  if (h.kind !== 'colony') return { total: 0, parts: [] };
  const power = powerOf(state, h.owner);
  const taxes = Math.floor(h.people / RULES.credits.taxPer[power.taxes]);
  const parts: Part[] = [];
  if (taxes > 0) parts.push({ label: `${power.taxes} taxes`, value: taxes });
  parts.push(...districtParts(world, state, h, 'market').parts);
  if (h.projects.includes('trade-exchange') && approvalOf(world, state, h).level !== 'revolt')
    parts.push({ label: 'the trade exchange', value: RULES.projects.exchangeCredits + worked(h, 'market') });
  return { total: sum(parts), parts };
}

/** What a power pays a turn to keep its ships, outposts and projects. */
export function upkeepOf(state: GameState, faction: FactionId): Figure {
  const u = RULES.credits.upkeep;
  const ships = state.ships.filter((s) => s.owner === faction).length * u.ship;
  const outposts = state.holdings.filter((h) => h.owner === faction && h.kind === 'outpost').length * u.outpost;
  let projects = 0;
  for (const h of state.holdings) if (h.owner === faction) for (const p of h.projects) projects += PROJECTS[p].upkeep;
  const parts: Part[] = [];
  if (ships > 0) parts.push({ label: 'ships', value: ships });
  if (outposts > 0) parts.push({ label: 'outposts', value: outposts });
  if (projects > 0) parts.push({ label: 'projects', value: projects });
  return { total: sum(parts), parts };
}

/** What a power's treasury gains or loses a turn: taxes and markets, less upkeep and overdrive. */
export function treasuryOf(world: World, state: GameState, faction: FactionId): Figure {
  let income = 0;
  let overdrive = 0;
  for (const h of state.holdings) {
    if (h.owner !== faction) continue;
    income += creditsOf(world, state, h).total;
    if (h.overdrive > 0) overdrive += overdriveCost(world, state, h);
  }
  const parts: Part[] = [{ label: 'taxes and markets', value: income }];
  const upkeep = upkeepOf(state, faction).total;
  if (upkeep > 0) parts.push({ label: 'upkeep', value: -upkeep });
  if (overdrive > 0) parts.push({ label: 'overdrive', value: -overdrive });
  return { total: sum(parts), parts };
}

/** What a colony's overdrive costs this turn. */
export function overdriveCost(world: World, state: GameState, h: Holding, fusion = fusionRuns(state, h)): number {
  if (h.kind !== 'colony' || h.overdrive <= 0) return 0;
  const base = industryOf(world, state, { ...h, overdrive: 0 }, fusion).total;
  return overdriveOf(base, h.overdrive).credits;
}

// ---------------------------------------------------------------- resources

/**
 * What a holding adds to the stockpile a turn, each with its reason. With `converters`, what a
 * fusion plant burns and a refinery turns into fuel too (the turn runs those itself, first).
 */
export function yieldsOf(
  world: World,
  state: GameState,
  h: Holding,
  converters = true,
): { total: Stockpile; parts: (Part & { resource: Resource })[] } {
  const parts: (Part & { resource: Resource })[] = [];
  const body = bodyOf(world, state, h);
  const mainOf = body ? mainResource(body) : null;
  if (h.kind === 'outpost' && body && mainOf) {
    parts.push({
      label: `${body.name} (${body.riches[mainOf] === 2 ? 'rich' : 'poor'})`,
      value: body.riches[mainOf],
      resource: mainOf,
    });
    for (const e of effects(state, h.owner, 'outpost-yield'))
      parts.push({ label: 'automated mining', value: e.amount, resource: mainOf });
  }
  if (h.kind === 'colony' && mainOf) {
    const mines = districtParts(world, state, h, 'mines');
    if (mines.value > 0) parts.push({ label: `its mines on ${body?.name}`, value: mines.value, resource: mainOf });
  }
  if (converters && h.kind === 'colony' && approvalOf(world, state, h).level !== 'revolt') {
    const p = RULES.projects;
    const s = powerOf(state, h.owner).stockpile;
    if (h.projects.includes('refinery') && s.volatiles >= p.refineryVolatiles) {
      parts.push({ label: 'into the refinery', value: -p.refineryVolatiles, resource: 'volatiles' });
      parts.push({ label: 'from the refinery', value: p.refineryFuel, resource: 'fuel' });
    }
    if (fusionRuns(state, h))
      parts.push({ label: 'burnt by the fusion plant', value: -p.fusionFuel, resource: 'fuel' });
  }
  if (h.capital) {
    const y = RULES.capital.yields;
    if (y.metals) parts.push({ label: 'the capital', value: y.metals, resource: 'metals' });
    if (y.volatiles) parts.push({ label: 'the capital', value: y.volatiles, resource: 'volatiles' });
    if (y.fuel) parts.push({ label: 'the capital', value: y.fuel, resource: 'fuel' });
  }
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
  if (item.kind === 'zone') return { ...RULES.districts.zoneCost };
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
  if (item.kind === 'zone') return zoneRefusal(world, state, h, item.zone, item.slot);
  if (item.kind === 'ship') {
    if (!h.projects.includes('shipyard')) return 'Ships need a shipyard.';
    return null;
  }
  const def = PROJECTS[item.project];
  if (def.opens && !powerOf(state, h.owner).researched.includes(def.opens)) return `Needs ${TECHS[def.opens].name}.`;
  if (h.projects.includes(item.project))
    return `It already has ${withArticle(PROJECTS[item.project].name.toLowerCase())}.`;
  if (h.queue.some((q) => q.kind === 'project' && q.project === item.project)) {
    const what = withArticle(PROJECTS[item.project].name.toLowerCase());
    return `${what[0]?.toUpperCase()}${what.slice(1)} is already queued.`;
  }
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
  const rate = industryOf(world, state, h).total;
  let need = -h.industry;
  return h.queue.map((item) => {
    need += costOf(world, state, h, item).industry;
    if (need <= 0) return 1;
    return rate > 0 ? Math.max(1, Math.ceil(need / rate)) : null;
  });
}
