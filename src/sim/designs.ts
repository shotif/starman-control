// Warships' designs (M4_FLEETS.md §21.3, §21.4, D-59): what a power can build, its yard's design for
// every hull it knows, the player's own designs, what a design adds up to, and refits. Every power's
// yard follows the same rule (D-08). Pure and in whole numbers.

import type { FactionId } from '../content/factions.ts';
import { MODULE_IDS, MODULES, type ModuleId } from '../content/modules.ts';
import type { Cost, QueueItem, RefitItem } from '../content/projects.ts';
import { HULLS, type HullId, isHull, SHIPS } from '../content/ships.ts';
import type { TechId } from '../content/techs.ts';
import { ceilDiv } from './geometry.ts';
import type { Design, GameState, Holding, PowerState, ShipState } from './state.ts';

/** The longest name a design may have. */
export const DESIGN_NAME_MOST = 24;
/** The most designs of its own a power may keep on its lists at once. */
export const OWN_DESIGNS_MOST = 30;

export function hullKnown(researched: readonly TechId[], hull: HullId): boolean {
  const needs = SHIPS[hull].hull?.needs;
  return needs === undefined || researched.includes(needs);
}

export function moduleKnown(researched: readonly TechId[], id: ModuleId): boolean {
  const needs = MODULES[id].needs;
  return needs === undefined || researched.includes(needs);
}

/** The hulls a power can build, smallest first. */
export function knownHulls(power: PowerState): HullId[] {
  return HULLS.filter((h) => hullKnown(power.researched, h));
}

/** The modules a power can fit, in the catalogue's order. */
export function knownModules(power: PowerState): ModuleId[] {
  return MODULE_IDS.filter((m) => moduleKnown(power.researched, m));
}

function add(a: Cost, b: Cost): Cost {
  return {
    industry: a.industry + b.industry,
    metals: a.metals + b.metals,
    volatiles: a.volatiles + b.volatiles,
    fuel: a.fuel + b.fuel,
  };
}

const NOTHING: Cost = { industry: 0, metals: 0, volatiles: 0, fuel: 0 };

/** What a list of modules costs. */
export function modulesCost(modules: readonly ModuleId[]): Cost {
  return modules.reduce((c, m) => add(c, MODULES[m].cost), NOTHING);
}

/** What a design costs before any discount: its hull and its modules. */
export function designCost(hull: HullId, modules: readonly ModuleId[]): Cost {
  const h = SHIPS[hull].cost;
  return add({ industry: h.industry, metals: h.metals, volatiles: h.volatiles, fuel: 0 }, modulesCost(modules));
}

/** What a design adds up to (§21.2): its weapons' damage a shot, its shields, its structure. */
export interface DesignStats {
  attack: number;
  shields: number;
  structure: number;
  weapons: number;
  cost: Cost;
  upkeep: number;
}

export function designStats(design: { hull: HullId; modules: readonly ModuleId[] }): DesignStats {
  let attack = 0;
  let shields = 0;
  let structure = SHIPS[design.hull].hull?.structure ?? 0;
  let weapons = 0;
  for (const m of design.modules) {
    const def = MODULES[m];
    if (def.weapon) {
      attack += def.weapon.damage;
      weapons++;
    }
    if (def.shield) shields += def.shield.capacity;
    if (def.armour) structure += def.armour;
  }
  return {
    attack,
    shields,
    structure,
    weapons,
    cost: designCost(design.hull, design.modules),
    upkeep: SHIPS[design.hull].upkeep,
  };
}

/** The best known module of each line of a kind, strongest first (by `worth`), then in catalogue order. */
function bestOfEachLine(known: readonly ModuleId[], kind: string, worth: (m: ModuleId) => number): ModuleId[] {
  const best = new Map<string, ModuleId>();
  for (const m of known) {
    const def = MODULES[m];
    if (def.kind !== kind) continue;
    const had = best.get(def.line);
    if (!had || MODULES[had].mark < def.mark) best.set(def.line, m);
  }
  return [...best.values()].sort((a, b) => worth(b) - worth(a) || MODULE_IDS.indexOf(a) - MODULE_IDS.indexOf(b));
}

/**
 * The yard's modules for a hull (§21.3): half its places, rounded up, weapons, alternating the two
 * strongest kinds known (ion counted at half, as it barely scratches a hull); then a shield; on a
 * capital ship a second; a targeting computer on a cruiser or capital ship once known; then armour.
 */
export function yardModules(researched: readonly TechId[], hull: HullId): ModuleId[] {
  const places = SHIPS[hull].hull?.places ?? 0;
  const known = MODULE_IDS.filter((m) => moduleKnown(researched, m));
  const weapons = bestOfEachLine(known, 'weapon', (m) => {
    const w = MODULES[m].weapon;
    return w ? (w.type === 'ion' ? w.damage / 2 : w.damage) : 0;
  }).slice(0, 2);
  const shield = bestOfEachLine(known, 'shield', (m) => MODULES[m].shield?.capacity ?? 0)[0];
  const armour = bestOfEachLine(known, 'armour', (m) => MODULES[m].armour ?? 0)[0];
  const out: ModuleId[] = [];
  const armed = Math.ceil(places / 2);
  for (let i = 0; i < armed && weapons.length > 0; i++) out.push(weapons[i % weapons.length] as ModuleId);
  const rest: ModuleId[] = [];
  if (shield) rest.push(shield);
  if (shield && hull === 'capital') rest.push(shield);
  if ((hull === 'cruiser' || hull === 'capital') && known.includes('targeting')) rest.push('targeting');
  for (const m of rest) if (out.length < places) out.push(m);
  while (out.length < places && armour) out.push(armour);
  return out;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export function roman(n: number): string {
  return ROMAN[n - 1] ?? String(n);
}

function nextDesignId(power: PowerState): number {
  return power.designs.reduce((n, d) => Math.max(n, d.id), 0) + 1;
}

function sameModules(a: readonly ModuleId[], b: readonly ModuleId[]): boolean {
  return a.length === b.length && a.every((m, i) => m === b[i]);
}

/**
 * The yard's new designs for a power (§21.3): for each hull it knows, a design from the best it knows
 * whenever that is not the yard's newest already, the old one retired. Changes the power; returns
 * the designs made.
 */
export function refreshYards(state: GameState, power: PowerState): Design[] {
  const made: Design[] = [];
  for (const hull of HULLS) {
    if (!hullKnown(power.researched, hull)) continue;
    const modules = yardModules(power.researched, hull);
    const yard = power.designs.filter((d) => d.yard && d.hull === hull);
    const newest = yard.at(-1);
    if (newest && sameModules(newest.modules, modules)) continue;
    if (newest) newest.retired = true;
    const design: Design = {
      id: nextDesignId(power),
      name: `${SHIPS[hull].name} Mark ${roman(yard.length + 1)}`,
      hull,
      modules,
      yard: true,
      since: state.turn,
      retired: false,
    };
    power.designs.push(design);
    made.push(design);
  }
  return made;
}

export function designOf(power: PowerState, id: number | null | undefined): Design | undefined {
  return id === null || id === undefined ? undefined : power.designs.find((d) => d.id === id);
}

/** A ship's design, if it is a warship. */
export function shipDesign(state: GameState, ship: ShipState): Design | undefined {
  const power = state.powers.find((p) => p.faction === ship.owner);
  return power ? designOf(power, ship.design) : undefined;
}

/** The designs a power can build now: every one not retired, by hull and then as made. */
export function buildable(power: PowerState): Design[] {
  return power.designs
    .filter((d) => !d.retired && hullKnown(power.researched, d.hull))
    .sort((a, b) => HULLS.indexOf(a.hull) - HULLS.indexOf(b.hull) || a.id - b.id);
}

/** Why a design cannot be made (§21.3), or null. */
export function designRefusal(power: PowerState, hull: unknown, name: unknown, modules: unknown): string | null {
  if (typeof hull !== 'string' || !(HULLS as readonly string[]).includes(hull)) return 'There is no such hull.';
  const h = hull as HullId;
  if (!hullKnown(power.researched, h)) return `The ${SHIPS[h].name.toLowerCase()} needs a technology first.`;
  if (typeof name !== 'string' || name.trim().length === 0) return 'Give the design a name.';
  if (name.trim().length > DESIGN_NAME_MOST) return `A design’s name is ${DESIGN_NAME_MOST} letters at most.`;
  if (power.designs.some((d) => !d.retired && d.name === name.trim())) return 'A design of that name stands already.';
  const places = SHIPS[h].hull?.places ?? 0;
  if (!Array.isArray(modules) || modules.length !== places)
    return `A ${SHIPS[h].name.toLowerCase()} has ${places} places, each with a module.`;
  for (const m of modules) {
    if (typeof m !== 'string' || !(m in MODULES)) return 'There is no such module.';
    if (!moduleKnown(power.researched, m as ModuleId))
      return `${MODULES[m as ModuleId].name} needs a technology first.`;
  }
  if (power.designs.filter((d) => !d.yard && !d.retired).length >= OWN_DESIGNS_MOST)
    return `There are ${OWN_DESIGNS_MOST} designs of your own: retire one first.`;
  return null;
}

/** Adds a design of the player's (or a rival's) own, already checked. */
export function makeDesign(
  state: GameState,
  power: PowerState,
  hull: HullId,
  name: string,
  modules: ModuleId[],
): Design {
  const design: Design = {
    id: nextDesignId(power),
    name: name.trim(),
    hull,
    modules: [...modules],
    yard: false,
    since: state.turn,
    retired: false,
  };
  power.designs.push(design);
  return design;
}

export function retireRefusal(power: PowerState, id: unknown): string | null {
  const d = power.designs.find((x) => x.id === id);
  if (!d) return 'There is no such design.';
  if (d.retired) return `${d.name} is retired already.`;
  return null;
}

/** What a refit costs (§21.4): the new modules less the old, never less than a tenth of the new. */
export function refitCost(from: Design, to: Design): Cost {
  const a = modulesCost(to.modules);
  const b = modulesCost(from.modules);
  const part = (x: number, y: number) => Math.max(x - y, ceilDiv(x, 10));
  return {
    industry: part(a.industry, b.industry),
    metals: part(a.metals, b.metals),
    volatiles: part(a.volatiles, b.volatiles),
    fuel: part(a.fuel, b.fuel),
  };
}

/** Why a refit cannot be queued at a colony, or done now that it is paid for (`queued`), or null (§21.4). */
export function refitRefusal(state: GameState, h: Holding, item: RefitItem, queued = false): string | null {
  if (!h.projects.includes('shipyard')) return 'Refits need a shipyard.';
  const ship = state.ships.find((s) => s.id === item.ship);
  if (!ship || ship.owner !== h.owner) return 'There is no such ship of yours.';
  if (!isHull(ship.type)) return `${ship.name} is not a warship.`;
  if (ship.at !== h.system) return `${ship.name} is not here.`;
  const power = state.powers.find((p) => p.faction === h.owner) as PowerState;
  const to = designOf(power, item.design);
  if (!to || to.retired) return 'Choose a design that can be built.';
  if (to.hull !== ship.type) return `${to.name} is not a ${SHIPS[ship.type].name.toLowerCase()}’s design.`;
  if (to.id === ship.design) return `${ship.name} is built to ${to.name} already.`;
  if (!queued && state.holdings.some((x) => x.queue.some((q) => q.kind === 'refit' && q.ship === ship.id)))
    return `${ship.name} is queued for a refit already.`;
  return null;
}

/** The designs a warship could be refitted to, newest first, each with its cost. */
export function refitTargets(state: GameState, ship: ShipState): { design: Design; cost: Cost }[] {
  const power = state.powers.find((p) => p.faction === ship.owner);
  const from = shipDesign(state, ship);
  if (!power || !from) return [];
  return buildable(power)
    .filter((d) => d.hull === ship.type && d.id !== ship.design)
    .reverse()
    .map((design) => ({ design, cost: refitCost(from, design) }));
}

/** A queue item's name, with a warship's design or a refit's ship and design. */
export function queueName(state: GameState, faction: FactionId, item: QueueItem): string | null {
  const power = state.powers.find((p) => p.faction === faction);
  if (!power) return null;
  if (item.kind === 'ship' && item.design !== undefined) return designOf(power, item.design)?.name ?? null;
  if (item.kind === 'refit') {
    const ship = state.ships.find((s) => s.id === item.ship);
    const to = designOf(power, item.design);
    return `Refit ${ship?.name ?? 'a ship'} to ${to?.name ?? 'a design'}`;
  }
  return null;
}
