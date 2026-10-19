// Research (M1_FIRST_LIGHT.md §8, M1_LANES_RESEARCH.md §2): the points a power makes, its queue, and
// what its technologies change. Every rule that a technology alters asks here, so a technology's
// effect lives in one place. Pure and in whole numbers.

import type { FactionId } from '../content/factions.ts';
import { FACTIONS } from '../content/factions.ts';
import { SPECIES, type SpeciesDef } from '../content/species.ts';
import { TECH_IDS, TECHS, type TechEffect, type TechId } from '../content/techs.ts';
import type { Figure } from './economy.ts';
import { type GameState, type PowerState, powerOf } from './state.ts';

/** The effects of every technology a power has researched, of one kind. */
export function effects<K extends TechEffect['kind']>(
  state: GameState,
  faction: FactionId,
  kind: K,
): Extract<TechEffect, { kind: K }>[] {
  const out: Extract<TechEffect, { kind: K }>[] = [];
  for (const id of powerOf(state, faction).researched) {
    const e = TECHS[id].effect;
    if (e.kind === kind) out.push(e as Extract<TechEffect, { kind: K }>);
  }
  return out;
}

export function hasTech(power: PowerState, id: TechId): boolean {
  return power.researched.includes(id);
}

/** Research points a turn: 1 for every 2 million people, over all a power's colonies, rounded down. */
export function researchOf(state: GameState, faction: FactionId): Figure {
  const people = state.holdings
    .filter((h) => h.owner === faction && h.kind === 'colony')
    .reduce((sum, h) => sum + h.people, 0);
  const total = Math.floor(people / 20);
  const millions = people % 10 === 0 ? String(people / 10) : (people / 10).toFixed(1);
  return { total, parts: [{ label: `from ${millions} million people × ½`, value: total }] };
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

/** Why a power cannot queue a technology, or null if it can. */
export function researchRefusal(state: GameState, faction: FactionId, tech: TechId): string | null {
  const p = powerOf(state, faction);
  const name = TECHS[tech].name;
  if (p.researched.includes(tech)) return `${name} is already researched.`;
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

/** Roughly when each queued technology is done, in turns from now (1: when this turn ends); null with no points. */
export function researchTurns(state: GameState, faction: FactionId): (number | null)[] {
  const p = powerOf(state, faction);
  const rate = researchOf(state, faction).total;
  let need = 0;
  return p.researchQueue.map((id) => {
    need += TECHS[id].cost - (p.techProgress[id] ?? 0);
    if (need <= 0) return 1;
    return rate > 0 ? Math.max(1, Math.ceil(need / rate)) : null;
  });
}

/** Technologies a power has neither researched nor queued but could queue, for what needs you. */
export function canResearch(power: PowerState): TechId[] {
  return TECH_IDS.filter((id) => !power.researched.includes(id) && !power.researchQueue.includes(id));
}

/**
 * Puts a turn's points into the queue: the first technology, then the next with what is left.
 * Points with nothing queued are lost. Returns the technologies finished, in order.
 */
export function spendResearch(power: PowerState, points: number): TechId[] {
  const done: TechId[] = [];
  let left = points;
  while (left > 0) {
    const id = power.researchQueue[0];
    if (!id) break;
    const have = power.techProgress[id] ?? 0;
    const need = TECHS[id].cost - have;
    if (left < need) {
      power.techProgress[id] = have + left;
      left = 0;
      break;
    }
    left -= need;
    delete power.techProgress[id];
    power.researchQueue.shift();
    power.researched.push(id);
    done.push(id);
  }
  return done;
}
