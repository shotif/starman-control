// Research (M1_FIRST_LIGHT.md §8, M1_LANES_RESEARCH.md §2): a power's queue and
// what its technologies change. Every rule that a technology alters asks here, so a technology's
// effect lives in one place. Pure and in whole numbers.

import type { FactionId } from '../content/factions.ts';
import { FACTIONS } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import { SPECIES, type SpeciesDef } from '../content/species.ts';
import { TECH_IDS, TECHS, type TechEffect, type TechId } from '../content/techs.ts';
import { type GameState, type PowerState, powerOf } from './state.ts';
import { laneEnds } from './world.ts';

/** The effects of every technology a power has researched, of one kind. */
export function effects<K extends TechEffect['kind']>(
  state: GameState,
  faction: FactionId,
  kind: K,
): Extract<TechEffect, { kind: K }>[] {
  const out: Extract<TechEffect, { kind: K }>[] = [];
  for (const id of powerOf(state, faction).researched)
    for (const e of [TECHS[id].effect, ...(TECHS[id].also ?? [])])
      if (e.kind === kind) out.push(e as Extract<TechEffect, { kind: K }>);
  return out;
}

export function hasTech(power: PowerState, id: TechId): boolean {
  return power.researched.includes(id);
}

/** The power's species as its research has adapted it (Adaptation I and II). */
export function speciesFor(state: GameState, faction: FactionId): SpeciesDef {
  const base = SPECIES[FACTIONS[faction].species];
  const adapt = effects(state, faction, 'adaptation');
  if (adapt.length === 0) return base;
  const costs = structuredClone(base.costs) as unknown as Record<string, Record<string, number | null>>;
  for (const a of adapt) {
    const table = costs[a.condition] as Record<string, number | null>;
    for (const v of a.values) {
      const c = table[v];
      if (c !== null && c !== undefined) table[v] = Math.max(0, c - a.by);
    }
  }
  return { ...base, costs: costs as unknown as SpeciesDef['costs'] };
}

/**
 * Whether one power has met another (M2B_SCIENCE.md §19.2): it sees a colony or outpost of theirs in
 * a system it has surveyed, or a lane of theirs with an end in one.
 */
export function hasMet(state: GameState, viewer: PowerState, other: FactionId): boolean {
  if (other === viewer.faction) return false;
  const surveyed = new Set(viewer.surveyed);
  return (
    state.holdings.some((h) => h.owner === other && surveyed.has(h.system)) ||
    state.lanes.some((l) => l.owner === other && laneEnds(l.id).some((end) => surveyed.has(end)))
  );
}

/** The powers a power has met that know a technology already. */
export function knownBy(state: GameState, power: PowerState, tech: TechId): FactionId[] {
  return state.powers
    .filter((p) => p.faction !== power.faction && p.researched.includes(tech) && hasMet(state, power, p.faction))
    .map((p) => p.faction);
}

/**
 * What a technology costs a power now (M2B_SCIENCE.md §18.1, §19.2): its base cost, and 7% of it for
 * every technology the power already knows; then 15% less for each power it has met that knows it,
 * at most 30% (unless `spread` is false). Rounded down.
 */
export function techCost(state: GameState, power: PowerState, tech: TechId, spread = true): number {
  const r = RULES.research;
  const risen = Math.floor((TECHS[tech].cost * (100 + r.risePercent * power.researched.length)) / 100);
  if (!spread) return risen;
  const less = Math.min(r.spreadMost, r.spreadPercent * knownBy(state, power, tech).length);
  return less > 0 ? Math.floor((risen * (100 - less)) / 100) : risen;
}

/** The doctrine that closes this one: its pair, when the power has researched it (§19.1). */
export function closedBy(power: PowerState, tech: TechId): TechId | null {
  const fork = TECHS[tech].fork;
  return fork && power.researched.includes(fork) ? fork : null;
}

/**
 * A technology learnt: researched, out of the queue and its progress; a doctrine closes its pair,
 * which leaves the queue with anything after it that needs it, its progress lost (§19.1).
 */
export function learn(power: PowerState, tech: TechId): void {
  delete power.techProgress[tech];
  power.researchQueue = power.researchQueue.filter((id) => id !== tech);
  power.researched.push(tech);
  const fork = TECHS[tech].fork;
  if (fork) {
    delete power.techProgress[fork];
    if (power.researchQueue.includes(fork)) power.researchQueue = unqueueResearch(power, fork);
  }
}

/** Whether what a technology needs besides technologies is met: Lapse studies' anomalies (§18.2). */
export function requirementMet(power: PowerState, tech: TechId): boolean {
  const r = TECHS[tech].requires;
  return !r || power.investigated.length >= r.investigated;
}

/** "three anomalies investigated", for a refusal. */
export function requirementText(tech: TechId): string | null {
  const r = TECHS[tech].requires;
  if (!r) return null;
  const n = ['no', 'one', 'two', 'three', 'four', 'five', 'six'][r.investigated] ?? String(r.investigated);
  return `${n} anomal${r.investigated === 1 ? 'y' : 'ies'} investigated`;
}

/** Why a power cannot queue a technology, or null if it can. */
export function researchRefusal(state: GameState, faction: FactionId, tech: TechId): string | null {
  const p = powerOf(state, faction);
  const name = TECHS[tech].name;
  if (p.researched.includes(tech)) return `${name} is already researched.`;
  for (const id of withNeeds(p, tech)) {
    const closed = closedBy(p, id);
    if (closed) return `${TECHS[id].name} is closed: you chose ${TECHS[closed].name}.`;
    if (!requirementMet(p, id)) return `${TECHS[id].name} needs ${requirementText(id)}.`;
  }
  return null;
}

/** A technology and whatever it needs that is not researched, in the order to research them. */
export function withNeeds(power: PowerState, tech: TechId): TechId[] {
  const out: TechId[] = [];
  const visit = (id: TechId) => {
    if (power.researched.includes(id) || out.includes(id)) return;
    for (const n of TECHS[id].needs) visit(n);
    out.push(id);
  };
  visit(tech);
  return out;
}

/** The queue with a technology added: at the end, or first ("research now"), with what it needs. */
export function queueResearch(power: PowerState, tech: TechId, now: boolean): TechId[] {
  const add = withNeeds(power, tech);
  if (now) return [...add, ...power.researchQueue.filter((id) => !add.includes(id))];
  return [...power.researchQueue, ...add.filter((id) => !power.researchQueue.includes(id))];
}

/** The queue without a technology, and without anything later in it that needs it. */
export function unqueueResearch(power: PowerState, tech: TechId): TechId[] {
  const gone = new Set<TechId>([tech]);
  const out: TechId[] = [];
  for (const id of power.researchQueue) {
    if (gone.has(id) || TECHS[id].needs.some((n) => gone.has(n))) gone.add(id);
    else out.push(id);
  }
  return out;
}

/**
 * Roughly when each queued technology is done, in turns from now (1: when this turn ends), at a rate
 * of research points a turn (economy.ts's researchOf); null with no points. Each one learnt makes
 * the next cost more, as it will.
 */
export function researchTurns(state: GameState, faction: FactionId, rate: number): (number | null)[] {
  const p = powerOf(state, faction);
  const ahead: PowerState = { ...p, researched: [...p.researched] };
  let need = 0;
  return p.researchQueue.map((id) => {
    need += techCost(state, ahead, id) - (p.techProgress[id] ?? 0);
    ahead.researched.push(id);
    if (need <= 0) return 1;
    return rate > 0 ? Math.max(1, Math.ceil(need / rate)) : null;
  });
}

/** Technologies a power has neither researched nor queued but could queue, for what needs you. */
export function canResearch(power: PowerState): TechId[] {
  return TECH_IDS.filter(
    (id) =>
      !power.researched.includes(id) &&
      !power.researchQueue.includes(id) &&
      withNeeds(power, id).every((n) => requirementMet(power, n) && closedBy(power, n) === null),
  );
}

/**
 * Research points from elsewhere (an anomaly, an observation): into the queue, or, with nothing
 * queued, into the first technology the power could research, without queueing it. Returns what
 * they finish.
 */
export function grantResearch(state: GameState, power: PowerState, points: number): TechId[] {
  if (power.researchQueue.length > 0) return spendResearch(state, power, points);
  const open = TECH_IDS.find(
    (id) =>
      !power.researched.includes(id) &&
      requirementMet(power, id) &&
      closedBy(power, id) === null &&
      TECHS[id].needs.every((n) => power.researched.includes(n)),
  );
  if (!open) return [];
  power.researchQueue = [open];
  const done = spendResearch(state, power, points);
  power.researchQueue = [];
  return done;
}

/**
 * Progress towards one technology (an anomaly's reward). It brings the technology to within a
 * point of done, never past, so it is still researched in its place in the tree; if it is
 * researched already, the points go to the current research instead.
 */
export function grantTechProgress(state: GameState, power: PowerState, tech: TechId, points: number): TechId[] {
  if (power.researched.includes(tech)) return grantResearch(state, power, points);
  power.techProgress[tech] = Math.min(techCost(state, power, tech) - 1, (power.techProgress[tech] ?? 0) + points);
  return [];
}

/**
 * Puts a turn's points into the queue: the first technology, then the next with what is left.
 * Points with nothing queued are lost. Returns the technologies finished, in order.
 */
export function spendResearch(state: GameState, power: PowerState, points: number): TechId[] {
  const done: TechId[] = [];
  let left = points;
  while (left > 0) {
    const id = power.researchQueue[0];
    if (!id) break;
    const have = power.techProgress[id] ?? 0;
    const need = techCost(state, power, id) - have;
    if (left < need) {
      power.techProgress[id] = have + left;
      left = 0;
      break;
    }
    left -= Math.max(0, need);
    learn(power, id);
    done.push(id);
  }
  return done;
}
