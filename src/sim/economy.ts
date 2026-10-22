// What colonies and outposts make (M1_COLONIES.md §2, M2_WORLDS.md §2 to §5), as figures with their
// parts, so every number can explain itself ("Industry 11 = 9 from 3 works + 2 from the capital").
// Districts are worked by the colony's people, a million each; food is shared along a power's
// lanes; credits come from taxes and markets and go on upkeep; approval scales what the districts
// yield. Pure and in whole numbers.

import { type District, ZONE_DEFS, type Zone } from '../content/districts.ts';
import { EDICTS, type EdictId } from '../content/edicts.ts';
import { FACTIONS, type FactionId } from '../content/factions.ts';
import {
  type BuildItem,
  type Cost,
  itemCost,
  PROJECTS,
  type ProjectId,
  projectWords,
  type QueueItem,
} from '../content/projects.ts';
import { RULES } from '../content/rules.ts';
import { CIVIL, isHull, SHIPS } from '../content/ships.ts';
import { TECHS } from '../content/techs.ts';
import type { SystemId } from '../data/types.ts';
import { type Body, bodiesOf } from './bodies.ts';
import { claimOf, tradeIncome } from './borders.ts';
import { buildable, designCost, designOf, refitCost, refitRefusal } from './designs.ts';
import { lastingLabel, lastingOn } from './events.ts';
import { ceilDiv } from './geometry.ts';
import { type Habitability, habitability } from './habitability.ts';
import { blockadedBy } from './invasion.ts';
import { laneQuote, laneRefusal } from './lanes.ts';
import { findRoute, lanesFor } from './movement.ts';
import { effects, speciesFor } from './research.ts';
import { type GameState, type Holding, holdingOn, powerOf, type Stockpile, treatyOf } from './state.ts';
import { soldParts } from './treaties.ts';
import { wearinessApproval } from './war.ts';
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
  const body = bodyOf(world, state, h);
  // A colony in orbit has its habitat's districts, and its world's own if its people could live there (§18.3).
  if (h.projects.includes('orbital-habitat')) {
    const own = body && habitability(body, speciesFor(state, h.owner)).level !== 'uninhabitable' ? body.size : 0;
    return own + RULES.projects.habitatDistricts;
  }
  return Math.max(1, body?.size ?? 1);
}

// ---------------------------------------------------------------- habitability and terraforming

const LEVELS: readonly Habitability[] = ['uninhabitable', 'harsh', 'tolerable', 'comfortable'];

/** The steps a colony's terraforming station has made its world more habitable (M2B_SCIENCE.md §18.3). */
export function terraformSteps(state: GameState, h: Holding): number {
  if (!h.projects.includes('terraforming-station')) return 0;
  const e = effects(state, h.owner, 'terraform')[0];
  const per = e?.turnsPerStep ?? RULES.projects.terraformTurns;
  const most = e?.steps ?? RULES.projects.terraformSteps;
  return Math.min(most, Math.floor(h.terraform / per));
}

/** Turns a terraforming station needs for its next step here, or null when it can do no more. */
export function terraformNext(world: World, state: GameState, h: Holding): { turns: number; to: Habitability } | null {
  if (!h.projects.includes('terraforming-station')) return null;
  const e = effects(state, h.owner, 'terraform')[0];
  const per = e?.turnsPerStep ?? RULES.projects.terraformTurns;
  const most = e?.steps ?? RULES.projects.terraformSteps;
  const steps = terraformSteps(state, h);
  const level = levelOf(world, state, h);
  if (steps >= most || level === 'comfortable' || level === 'uninhabitable') return null;
  return { turns: (steps + 1) * per - h.terraform, to: LEVELS[LEVELS.indexOf(level) + 1] as Habitability };
}

/**
 * How habitable a holding's world is for its people: its world's own level, raised a step for each
 * step its terraforming station has made, never past comfortable.
 */
export function levelOf(world: World, state: GameState, h: Holding): Habitability {
  const body = bodyOf(world, state, h);
  if (!body) return 'harsh';
  const base = habitability(body, speciesFor(state, h.owner)).level;
  if (base === 'uninhabitable') return base;
  const at = Math.min(LEVELS.length - 1, LEVELS.indexOf(base) + terraformSteps(state, h));
  return LEVELS[at] as Habitability;
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
export function worked(h: Holding, zone: Zone): number {
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
      // Blight (an event, M2_WORLDS.md §27.2) takes 1 off each farm while it lasts.
      const blight = lastingOn(state, h, 'blight').length > 0 ? 1 : 0;
      if (h.capital) return Math.max(0, d.farms.comfortable + tech - blight);
      const level = levelOf(world, state, h);
      const base =
        level === 'comfortable' ? d.farms.comfortable : level === 'tolerable' ? d.farms.tolerable : d.farms.harsh;
      return Math.max(0, base + tech - blight);
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
  const size = body?.size ?? 0;
  const level = levelOf(world, state, h);
  const own =
    level === 'comfortable' ? size * 2 : level === 'tolerable' ? size : level === 'harsh' ? Math.floor(size / 2) : 0;
  const orbit = h.projects.includes('orbital-habitat') ? RULES.projects.habitatRoom : 0;
  return own * 10 + orbit + housing;
}

/** People gained a turn, in tenths: logistic, at least a tenth while there is room; none when hungry or unhappy (§2). */
export function growthOf(world: World, state: GameState, h: Holding): number {
  const cap = capacityOf(world, state, h);
  if (h.kind !== 'colony' || h.people >= cap || cap === 0) return 0;
  if (h.hungry > 0) return 0;
  if (lastingOn(state, h, 'no-growth').length > 0) return 0;
  const level = approvalOf(world, state, h).level;
  if (level === 'unrest' || level === 'revolt') return 0;
  // The traits' and technologies' percentages add up, then apply to the base rate.
  const base = RULES.colonies.growthPercent;
  let percent = 0;
  for (const t of FACTIONS[h.owner].traits) if (t.effect.kind === 'growth-percent') percent += t.effect.percent;
  for (const e of effects(state, h.owner, 'growth-percent')) percent += e.percent;
  if (h.projects.includes('medical-centre')) percent += RULES.projects.medicalPercent;
  if (holdsGreatWork(state, h.owner, 'commons')) percent += RULES.greatWorks.commonsGrowthPercent;
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
  const ed = RULES.edicts;
  if (edictAt(state, h, 'festival')) parts.push({ label: 'a festival', value: ed.festivalApproval });
  if (edictAt(state, h, 'labour-drive')) parts.push({ label: 'a labour drive', value: ed.labourApproval });
  if (rationed(world, state, h)) parts.push({ label: 'rationing', value: ed.rationingApproval });
  if (power.edicts.some((e) => e.edict === 'martial-order' && e.holding !== h.id))
    parts.push({ label: 'martial order elsewhere', value: ed.martialOthersApproval });
  for (const l of lastingOn(state, h, 'approval')) parts.push({ label: lastingLabel(l), value: l.amount });
  if (h.hungry > 0) parts.push({ label: 'hungry', value: a.hungry });
  // Idle people make nothing, and cost no approval (D-43).
  if (h.people >= capacityOf(world, state, h)) parts.push({ label: 'full', value: a.full });
  const home = h.capital ? 'comfortable' : levelOf(world, state, h);
  if (home === 'harsh') parts.push({ label: 'life under domes', value: a.domes });
  else if (home === 'uninhabitable' && h.kind === 'colony') parts.push({ label: 'life in orbit', value: a.domes });
  for (const e of effects(state, h.owner, 'approval')) parts.push({ label: 'councils', value: e.amount });
  if (holdsGreatWork(state, h.owner, 'commons'))
    parts.push({ label: 'the Commons', value: RULES.greatWorks.commonsApproval });
  const jumps = jumpsFromCapital(world, state, h);
  // Doctrines (M2B_SCIENCE.md §19.1).
  for (const e of effects(state, h.owner, 'approval-near'))
    if (jumps !== null && jumps <= e.jumps) parts.push({ label: 'a strong centre', value: e.amount });
  for (const e of effects(state, h.owner, 'works-unrest'))
    if (h.districts.filter((d) => d.zone === 'works').length >= e.works)
      parts.push({ label: 'an industrial world', value: e.approval });
  let near: number = a.nearJumps;
  for (const e of effects(state, h.owner, 'near-jumps')) near += e.jumps;
  const federation = effects(state, h.owner, 'no-far').length > 0;
  if (jumps === null) parts.push({ label: 'no lane to the capital', value: a.farMost });
  else if (jumps > near && !federation)
    parts.push({ label: `${jumps} jumps from the capital`, value: Math.max(a.farMost, (jumps - near) * a.far) });
  if (power.treasury < 0) parts.push({ label: 'the treasury in debt', value: a.debt });
  // War weariness (M4_FLEETS.md §23.4), and a colony newly taken (§26.4).
  const weary = wearinessApproval(state, h.owner);
  if (weary < 0) parts.push({ label: 'war weariness', value: weary });
  if (h.taken > 0) parts.push({ label: 'newly taken', value: RULES.invasion.takenApproval });
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

/** What share of its districts' yields a colony keeps at its approval, in percent; under martial order, as if content. */
export function keepsOf(world: World, state: GameState, h: Holding): number {
  if (h.kind !== 'colony') return 100;
  if (edictAt(state, h, 'martial-order')) return RULES.approval.keeps.content;
  return RULES.approval.keeps[approvalOf(world, state, h).level];
}

/** A colony in revolt makes and builds nothing, unless martial order holds it (§25.2). */
export function stopped(world: World, state: GameState, h: Holding): boolean {
  return h.kind === 'colony' && approvalOf(world, state, h).level === 'revolt' && !edictAt(state, h, 'martial-order');
}

/** Whether a power holds a great work (M2B_SCIENCE.md §20.2). */
export function holdsGreatWork(state: GameState, faction: FactionId, work: ProjectId): boolean {
  return state.holdings.some((h) => h.owner === faction && h.projects.includes(work));
}

/** What an edict costs a power in attention: less with Free press, at least 1 (M2B_SCIENCE.md §18.2). */
export function edictCost(state: GameState, faction: FactionId, edict: EdictId): number {
  const less = effects(state, faction, 'edict-discount').reduce((n, e) => n + e.attention, 0);
  return Math.max(1, EDICTS[edict].cost - less);
}

/** Whether an edict is in force for the whole of a power. */
export function edictOn(state: GameState, faction: FactionId, edict: EdictId): boolean {
  return powerOf(state, faction).edicts.some((e) => e.edict === edict);
}

/** Whether an edict naming this colony is in force. */
export function edictAt(state: GameState, h: Holding, edict: EdictId): boolean {
  return powerOf(state, h.owner).edicts.some((e) => e.edict === edict && e.holding === h.id);
}

/** Whether rationing is in force over a colony's supply network. */
export function rationed(world: World, state: GameState, h: Holding): boolean {
  const e = powerOf(state, h.owner).edicts.find((x) => x.edict === 'rationing');
  if (!e || e.holding === null) return false;
  if (e.holding === h.id) return true;
  return networkOf(world, state, h).colonies.some((c) => c.id === e.holding);
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
  if (stopped(world, state, h)) return { total: 0, parts: [{ label: 'in revolt', value: 0 }] };
  const halted = lastingOn(state, h, 'no-industry')[0];
  if (halted) return { total: 0, parts: [{ label: lastingLabel(halted), value: 0 }] };
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
  // Edicts (§25.2) change what the colony makes before any is bought.
  const made = sum(parts);
  const ed = RULES.edicts;
  if (edictAt(state, h, 'labour-drive')) {
    const value = Math.floor((made * ed.labourIndustryPercent) / 100);
    if (value > 0) parts.push({ label: `a labour drive (+${ed.labourIndustryPercent}%)`, value });
  }
  if (edictOn(state, h.owner, 'crash-programme')) {
    const value = -Math.floor((made * -ed.crashIndustryPercent) / 100);
    if (value < 0) parts.push({ label: `a crash programme (${ed.crashIndustryPercent}%)`, value });
  }
  if (h.overdrive > 0) {
    const o = overdriveOf(sum(parts), h.overdrive);
    if (o.industry > 0) parts.push({ label: `bought for ${o.credits} credits`, value: o.industry });
  }
  return { total: sum(parts), parts };
}

/** The capital's own research: its old universities, and Strong centre's (M2B_SCIENCE.md §19.1). */
function capitalResearch(state: GameState, faction: FactionId): number {
  return RULES.capital.research + effects(state, faction, 'capital-research').reduce((n, e) => n + e.amount, 0);
}

/** A colony's scholars (M2B_SCIENCE.md §16, D-44): 1 for every 4 million of its people, 3 with Public schooling. */
export function scholarsOf(state: GameState, h: Holding): number {
  if (h.kind !== 'colony') return 0;
  const per = Math.min(RULES.research.scholarsPer, ...effects(state, h.owner, 'scholars').map((e) => e.per));
  return Math.floor(h.people / per);
}

/** What a colony's scholars make, kept at its approval as a district's yield is. */
function scholarParts(world: World, state: GameState, h: Holding): { parts: Part[]; value: number } {
  const n = scholarsOf(state, h);
  if (n === 0) return { parts: [], value: 0 };
  const keeps = keepsOf(world, state, h);
  const kept = Math.floor((n * keeps + 50) / 100);
  const parts: Part[] = [{ label: `from ${n} scholar${n === 1 ? '' : 's'}`, value: n }];
  if (kept < n) parts.push({ label: `${approvalOf(world, state, h).level} (${keeps}%)`, value: kept - n });
  return { parts, value: kept };
}

/**
 * A colony's research a turn (M2B_SCIENCE.md §16): its labs and its scholars, kept at its approval,
 * its research institute and, at the capital, the capital's own.
 */
export function colonyResearchOf(world: World, state: GameState, h: Holding): Figure {
  if (h.kind !== 'colony') return { total: 0, parts: [] };
  if (stopped(world, state, h)) return { total: 0, parts: [{ label: 'in revolt', value: 0 }] };
  const parts: Part[] = [...districtParts(world, state, h, 'labs').parts, ...scholarParts(world, state, h).parts];
  if (h.projects.includes('research-institute'))
    parts.push({ label: 'from the research institute', value: RULES.projects.instituteResearch });
  if (h.capital) parts.push({ label: 'from the capital', value: capitalResearch(state, h.owner) });
  return { total: sum(parts), parts };
}

/**
 * Research a turn (M2_WORLDS.md §7, M2B_SCIENCE.md §16): the labs and scholars of every colony, what
 * unhappiness takes off them, research institutes and the capital's own.
 */
export function researchOf(world: World, state: GameState, faction: FactionId): Figure {
  let labs = 0;
  let scholars = 0;
  let lost = 0;
  let capital = 0;
  let institutes = 0;
  for (const h of state.holdings) {
    if (h.owner !== faction || h.kind !== 'colony') continue;
    // Labs and scholars are kept at the colony's approval: none in revolt, which stops the rest too.
    const r = districtParts(world, state, h, 'labs');
    labs += sum(r.parts.slice(0, 1));
    lost += r.value - sum(r.parts.slice(0, 1));
    const sp = scholarParts(world, state, h);
    scholars += sum(sp.parts.slice(0, 1));
    lost += sp.value - sum(sp.parts.slice(0, 1));
    if (stopped(world, state, h)) continue;
    if (h.capital) capital += capitalResearch(state, faction);
    if (h.projects.includes('research-institute')) institutes += RULES.projects.instituteResearch;
  }
  const parts: Part[] = [];
  if (labs > 0) parts.push({ label: 'from labs', value: labs });
  if (scholars > 0) parts.push({ label: `from ${scholars} scholar${scholars === 1 ? '' : 's'}`, value: scholars });
  if (lost < 0) parts.push({ label: 'lost to unhappiness', value: lost });
  if (institutes > 0) parts.push({ label: 'from research institutes', value: institutes });
  if (capital > 0) parts.push({ label: 'from the capital', value: capital });
  // Thinking machines and a crash programme each add their share of the rest (§18.2, M2_WORLDS.md §25.2).
  const base = sum(parts);
  for (const e of effects(state, faction, 'research-percent')) {
    const value = Math.floor((base * e.percent) / 100);
    if (value > 0) parts.push({ label: `thinking machines (+${e.percent}%)`, value });
  }
  if (holdsGreatWork(state, faction, 'lapse-archive')) {
    const percent = RULES.greatWorks.archiveResearchPercent;
    const value = Math.floor((base * percent) / 100);
    if (value > 0) parts.push({ label: `the Lapse Archive (+${percent}%)`, value });
  }
  if (edictOn(state, faction, 'crash-programme')) {
    const value = Math.floor((base * RULES.edicts.crashResearchPercent) / 100);
    if (value > 0) parts.push({ label: `a crash programme (+${RULES.edicts.crashResearchPercent}%)`, value });
  }
  return { total: sum(parts), parts };
}

// ---------------------------------------------------------------- food

/** Food a colony makes and eats a turn (M2_WORLDS.md §3). */
export function foodOf(world: World, state: GameState, h: Holding): { made: Figure; eaten: number } {
  if (h.kind !== 'colony') return { made: { total: 0, parts: [] }, eaten: 0 };
  const farms = districtParts(world, state, h, 'farms');
  const parts = [...farms.parts];
  if (h.projects.includes('hydroponics') && !stopped(world, state, h))
    parts.push({ label: 'from hydroponics', value: RULES.projects.hydroponicsFood });
  const eaten = ceilDiv(h.people, RULES.food.eatenPer);
  return {
    made: { total: sum(parts), parts },
    eaten: rationed(world, state, h) ? ceilDiv(eaten * RULES.edicts.rationingEatsPercent, 100) : eaten,
  };
}

/** A power's supply networks: colonies joined by its open lanes, the capital's first. */
export function networksOf(
  world: World,
  state: GameState,
  faction: FactionId,
): { home: boolean; colonies: Holding[] }[] {
  // A blockaded colony is cut off: a network of its own (M4_FLEETS.md §26.6).
  const all = state.holdings.filter((h) => h.owner === faction && h.kind === 'colony');
  const cut = all.filter((h) => blockadedBy(state, h) !== null);
  const colonies = all.filter((h) => !cut.includes(h));
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
  for (const h of cut) out.push({ home: false, colonies: [h] });
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
  if (h.projects.includes('trade-exchange') && !stopped(world, state, h))
    parts.push({ label: 'the trade exchange', value: RULES.projects.exchangeCredits + worked(h, 'market') });
  // A blockade halves it (M4_FLEETS.md §26.6).
  if (blockadedBy(state, h)) {
    const made = sum(parts);
    parts.push({ label: 'the blockade', value: -(made - Math.floor((made * RULES.blockadeCreditsPercent) / 100)) });
  }
  return { total: sum(parts), parts };
}

/** What a power pays a turn to keep its ships, outposts and projects. */
export function upkeepOf(state: GameState, faction: FactionId): Figure {
  const u = RULES.credits.upkeep;
  // Each ship by its hull (M4_FLEETS.md §6): a civil ship 1, a capital ship 5.
  const ships = state.ships.filter((s) => s.owner === faction).reduce((n, s) => n + SHIPS[s.type].upkeep, 0);
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
  // Trade agreements (M3_NEIGHBOURS.md §22.4).
  for (const t of tradeIncome(state, faction))
    parts.push({ label: `trade with the ${FACTIONS[t.faction].shortName}`, value: t.credits });
  // Passage and protection, paid or sold (§23).
  parts.push(...soldParts(state, faction));
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
  // An outpost gathers its world's riches, and so does a colony in orbit that was one (§18.3).
  if ((h.kind === 'outpost' || h.projects.includes('orbital-habitat')) && body && mainOf) {
    const times = Math.max(1, ...effects(state, h.owner, 'outpost-times').map((e) => e.times));
    parts.push({
      label: `${body.name} (${body.riches[mainOf] === 2 ? 'rich' : 'poor'})`,
      value: body.riches[mainOf],
      resource: mainOf,
    });
    if (times > 1) parts.push({ label: 'mass drivers', value: body.riches[mainOf] * (times - 1), resource: mainOf });
    for (const e of effects(state, h.owner, 'outpost-yield'))
      parts.push({ label: 'automated mining', value: e.amount, resource: mainOf });
  }
  if (h.kind === 'colony' && mainOf) {
    const mines = districtParts(world, state, h, 'mines');
    if (mines.value > 0) parts.push({ label: `its mines on ${body?.name}`, value: mines.value, resource: mainOf });
  }
  if (converters && h.kind === 'colony' && !stopped(world, state, h)) {
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
    return `${body.name} already has ${held.owner === faction ? 'your' : `a ${FACTIONS[held.owner].shortName}`} ${held.kind} on it.`;
  if (state.ships.some((s) => s.founding?.body === bodyId && s.owner === faction))
    return `Another ship is already founding on ${body.name}.`;
  // A border treaty keeps each out of the other's claim (M3_NEIGHBOURS.md §22.3).
  const owner = claimOf(world, state, system).owner;
  if (owner && owner !== faction && treatyOf(state, faction, owner, 'border'))
    return `${world.system(system).name} is the ${FACTIONS[owner].shortName}’s by our border treaty.`;
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
  // A refit (M4_FLEETS.md §21.4): the new modules less the old.
  if (item.kind === 'refit') {
    const power = powerOf(state, h.owner);
    const ship = state.ships.find((s) => s.id === item.ship);
    const from = ship ? designOf(power, ship.design) : undefined;
    const to = designOf(power, item.design);
    return from && to ? refitCost(from, to) : { industry: 0, metals: 0, volatiles: 0, fuel: 0 };
  }
  // A warship costs its hull and its design's modules (§21.1).
  const design = item.kind === 'ship' ? designOf(powerOf(state, h.owner), item.design) : undefined;
  const c = design ? designCost(design.hull, design.modules) : { ...itemCost(item) };
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
  // Prefabrication (M2B_SCIENCE.md §18.2).
  if (item.kind === 'project')
    for (const e of effects(state, h.owner, 'project-discount'))
      c.industry = ceilDiv(c.industry * (100 - e.percent), 100);
  return c;
}

/** A holding's place in words: its world's name, or its system's. */
function placeName(world: World, state: GameState, h: Holding): string {
  return bodyOf(world, state, h)?.name ?? world.system(h.system).name;
}

/** Why a colony or outpost cannot queue an item, or null (M1_COLONIES.md §3, M1_LANES_RESEARCH.md §1). */
export function queueRefusal(world: World, state: GameState, h: Holding, item: QueueItem): string | null {
  if (item.kind === 'lane') return laneRefusal(world, state, h.owner, h.system, item.to);
  const where = item.kind === 'project' ? (PROJECTS[item.project].where ?? 'colony') : 'colony';
  if (h.kind !== 'colony' && where === 'colony') return 'Outposts build only lanes, lane relays and orbital habitats.';
  if (h.kind === 'colony' && where === 'outpost') return 'Only at an outpost.';
  if (item.kind === 'zone') return zoneRefusal(world, state, h, item.zone, item.slot);
  if (item.kind === 'refit') return refitRefusal(state, h, item);
  if (item.kind === 'ship') {
    if (!h.projects.includes('shipyard')) return 'Ships need a shipyard.';
    // A warship is built to a design (M4_FLEETS.md §21.3); a civil ship to none.
    if (!isHull(item.ship)) {
      if (item.design !== undefined) return 'Only warships have designs.';
      const def = SHIPS[item.ship];
      if (def.needs && !powerOf(state, h.owner).researched.includes(def.needs))
        return `Needs ${TECHS[def.needs].name}.`;
      // A transport's troops are raised from the colony's people (§26.3).
      if (def.troops !== undefined && h.people < RULES.invasion.transportLeast)
        return 'Troops are raised only at a colony of a million people or more.';
      return null;
    }
    const design = designOf(powerOf(state, h.owner), item.design);
    if (!design || design.hull !== item.ship) return 'Choose a design to build.';
    if (design.retired) return `${design.name} is retired.`;
    return null;
  }
  const def = PROJECTS[item.project];
  if (def.opens && !powerOf(state, h.owner).researched.includes(def.opens)) return `Needs ${TECHS[def.opens].name}.`;
  if (item.project === 'flare-shield' && !bodyOf(world, state, h)?.flareExposed)
    return 'Only on a world exposed to its star’s flares.';
  if (def.great) {
    const power = powerOf(state, h.owner);
    if (!power.researched.includes(def.great.needs)) return `Needs ${TECHS[def.great.needs].name}.`;
    const stands = state.holdings.find((x) => x !== h && x.projects.includes(item.project));
    if (stands)
      return stands.owner === h.owner
        ? `The ${def.name} stands already, at ${placeName(world, state, stands)}.`
        : `The ${def.name} stands already, the ${FACTIONS[stands.owner].shortName}’s.`;
    const building = state.holdings.find(
      (x) => x.owner === h.owner && x !== h && x.queue.some((q) => q.kind === 'project' && q.project === item.project),
    );
    if (building) return `The ${def.name} is being built at ${placeName(world, state, building)}.`;
  }
  if (item.project === 'terraforming-station') {
    const level = levelOf(world, state, h);
    if (level !== 'harsh' && level !== 'tolerable') return 'Only on a world harsh or tolerable for its people.';
  }
  if (h.projects.includes(item.project)) return `It already has ${projectWords(item.project)}.`;
  if (h.queue.some((q) => q.kind === 'project' && q.project === item.project)) {
    const what = projectWords(item.project);
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
  // An outpost is offered only what an outpost can build (§18.3).
  // Civil ships, then every design that can be built (M4_FLEETS.md §21.7).
  const ships: BuildItem[] =
    h.kind === 'colony'
      ? [
          ...CIVIL.map((ship): BuildItem => ({ kind: 'ship', ship })),
          ...buildable(powerOf(state, h.owner)).map((d): BuildItem => ({ kind: 'ship', ship: d.hull, design: d.id })),
        ]
      : [];
  const projects: BuildItem[] = Object.values(PROJECTS)
    .filter((p) => h.kind === 'colony' || (p.where ?? 'colony') !== 'colony')
    .map((p) => ({ kind: 'project', project: p.id }));
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
