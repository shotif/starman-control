// Relic sites (M5_UNKNOWN.md §20, D-70): where they lie (from the seed, never saved), who knows of
// them, who may excavate them, the research each turn shares with its excavations, chapters done
// and their choices answered, and the revelations they bring. Pure, in whole numbers.

import { FACTIONS, type FactionId } from '../content/factions.ts';
import { RELIC_KIND_IDS, RELIC_KINDS, type RelicKind } from '../content/relics.ts';
import { RULES } from '../content/rules.ts';
import type { SystemId } from '../data/types.ts';
import { bodiesOf } from './bodies.ts';
import { laneTargets } from './lanes.ts';
import type { ReportEvent } from './report.ts';
import { effects, grantResearch } from './research.ts';
import { rng } from './rng.ts';
import { starClass } from './stars.ts';
import { type Dig, type GameState, hasSurveyed, type PowerState, powerOf } from './state.ts';
import type { World } from './world.ts';

/** A relic site: its system and its kind. */
export interface RelicSite {
  system: SystemId;
  kind: RelicKind;
}

const R = RULES.relics;
const cache = new WeakMap<World, Map<number, readonly RelicSite[]>>();

/**
 * The game's twelve relic sites (§20.1), in system order: GJ 915 always, a quiet beacon; then white
 * dwarfs, brown dwarfs and any system, each with a body, 8 to 18 light-years from the nearest capital
 * and apart from one another; each kind twice. The same for a seed every time.
 */
export function relicSites(world: World, seed: number): readonly RelicSite[] {
  let bySeed = cache.get(world);
  if (!bySeed) {
    bySeed = new Map();
    cache.set(world, bySeed);
  }
  const known = bySeed.get(seed);
  if (known) return known;
  const capitals = Object.values(FACTIONS)
    .map((f) => f.capital.systemId)
    .filter((c) => world.hasSystem(c));
  const candidates = world.systems
    .map((s) => s.id)
    .filter(
      (id) =>
        world.hasSystem(id) &&
        capitals.every((c) => world.distanceDeci(c, id) >= R.fromCapitalDeci) &&
        capitals.some((c) => world.distanceDeci(c, id) <= R.nearCapitalDeci) &&
        bodiesOf(world, seed, id).length > 0,
    );
  const classes = (id: SystemId) => world.system(id).sky.stars.map((s) => starClass(s.spectralType));
  const white = (id: SystemId) => classes(id).includes('D');
  const brown = (id: SystemId) => classes(id).some((c) => c === 'L' || c === 'T' || c === 'Y');
  const order = (id: SystemId) => rng(seed, 'relic-site', id).int(0, 1_000_000_000);
  const shuffled = [...candidates].sort((a, b) => order(a) - order(b) || (a < b ? -1 : 1));
  const picked: SystemId[] = [];
  const apart = (id: SystemId) => picked.every((p) => p !== id && world.distanceDeci(p, id) >= R.apartDeci);
  const take = (pool: readonly SystemId[], n: number) => {
    let left = n;
    for (const id of pool) {
      if (left === 0) break;
      if (!apart(id)) continue;
      picked.push(id);
      left--;
    }
  };
  // GJ 915 lies a little beyond the band, toward Pyre (§13): it is a site whatever the band.
  if (world.hasSystem(R.always) && bodiesOf(world, seed, R.always).length > 0) picked.push(R.always);
  take(
    shuffled.filter((id) => white(id)),
    R.whiteDwarfs,
  );
  take(
    shuffled.filter((id) => brown(id) && !white(id)),
    R.brownDwarfs,
  );
  take(shuffled, R.sites - picked.length);
  // Each kind twice; GJ 915, first when it is a site, a quiet beacon.
  const lead = picked[0] === R.always ? 1 : 0;
  const kinds: RelicKind[] = RELIC_KIND_IDS.flatMap((k) => [k, k]);
  if (lead) kinds.splice(kinds.indexOf('beacon'), 1);
  const dealt = kinds
    .map((k, i) => ({ k, key: rng(seed, 'relic-kind', i, k).int(0, 1_000_000) }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.k);
  const sites: RelicSite[] = picked.map((system, i) => ({
    system,
    kind: i < lead ? 'beacon' : (dealt[i - lead] ?? 'vault'),
  }));
  sites.sort((a, b) => (a.system < b.system ? -1 : 1));
  bySeed.set(seed, sites);
  return sites;
}

/** The relic site at a system, or null. */
export function siteAt(world: World, seed: number, system: SystemId): RelicSite | null {
  return relicSites(world, seed).find((s) => s.system === system) ?? null;
}

/** Whether a power knows of a site (§20.2): surveyed there, or within its Old charts' reach of a holding. */
export function siteKnown(world: World, state: GameState, power: PowerState, system: SystemId): boolean {
  if (!siteAt(world, state.seed, system)) return false;
  if (hasSurveyed(power, system)) return true;
  const deci = Math.max(0, ...effects(state, power.faction, 'relic-charts').map((e) => e.deci));
  return (
    deci > 0 && state.holdings.some((h) => h.owner === power.faction && world.distanceDeci(h.system, system) <= deci)
  );
}

/** The sites a power knows of, in system order. */
export function knownSites(world: World, state: GameState, faction: FactionId): RelicSite[] {
  const power = powerOf(state, faction);
  return relicSites(world, state.seed).filter((s) => siteKnown(world, state, power, s.system));
}

/** The excavation at a site, if one has begun there. */
export function digAt(state: GameState, system: SystemId): Dig | undefined {
  return state.digs.find((d) => d.system === system);
}

/** Research a site's next chapter needs from a power (§20.3), from the first (0) to the third (2). */
export function chapterCost(state: GameState, faction: FactionId, chapter: number): number {
  const base = R.chapterCost[Math.min(Math.max(chapter, 0), R.chapterCost.length - 1)] ?? 0;
  const less = effects(state, faction, 'chapter-percent').reduce((n, e) => n + e.percent, 0);
  return base - Math.floor((base * Math.min(less, 100)) / 100);
}

/** Whether a power may excavate (§20.3). */
export function canExcavate(state: GameState, faction: FactionId): boolean {
  return effects(state, faction, 'excavation').length > 0;
}

/** Why a power may not excavate a site, or null if it may (§20.3). */
export function excavateRefusal(world: World, state: GameState, faction: FactionId, system: SystemId): string | null {
  const power = powerOf(state, faction);
  if (!siteAt(world, state.seed, system) || !siteKnown(world, state, power, system))
    return 'There is no relic site known here.';
  if (!canExcavate(state, faction)) return 'Excavation needs Relic studies.';
  const dig = digAt(state, system);
  if (dig && dig.chapters >= R.chapterCost.length) return 'Every chapter of this site is done.';
  if (dig?.by === faction) return 'We are excavating it already.';
  if (dig?.by) return `The ${FACTIONS[dig.by].shortName} are excavating it.`;
  if (!state.holdings.some((h) => h.owner === faction && h.system === system))
    return 'Excavation needs a colony or an outpost of ours in the system.';
  return null;
}

/** Begins (or takes up) an excavation; the caller has checked `excavateRefusal`. */
export function excavate(state: GameState, faction: FactionId, system: SystemId): void {
  const dig = digAt(state, system);
  if (dig) {
    dig.by = faction;
    return;
  }
  state.digs.push({ system, by: faction, chapters: 0, progress: 0, waiting: null, answer: null });
  state.digs.sort((a, b) => (a.system < b.system ? -1 : 1));
}

/** Why a power may not stop an excavation, or null. */
export function stopRefusal(state: GameState, faction: FactionId, system: SystemId): string | null {
  return digAt(state, system)?.by === faction ? null : 'We are not excavating there.';
}

/** Stops a power's excavation, keeping its progress for whoever takes it up. */
export function stopExcavation(state: GameState, system: SystemId): void {
  const dig = digAt(state, system);
  if (dig) {
    dig.by = null;
    dig.answer = null;
  }
}

/** A power's excavations taking research now (§20.3): its own, not waiting, not finished; in system order. */
export function activeDigs(state: GameState, faction: FactionId): Dig[] {
  return state.digs.filter((d) => d.by === faction && d.waiting === null && d.chapters < R.chapterCost.length);
}

/**
 * A turn's research split between a power's excavations and its technology (§20.3): the share, in
 * equal parts to each excavation under way (the odd points to the first), and the rest.
 */
export function splitResearch(
  state: GameState,
  faction: FactionId,
  points: number,
): { digs: { system: SystemId; points: number }[]; rest: number } {
  const digs = activeDigs(state, faction);
  const share = powerOf(state, faction).digShare;
  if (digs.length === 0 || share === 0 || points <= 0) return { digs: [], rest: points };
  const toDigs = Math.floor((points * share) / 100);
  const each = Math.floor(toDigs / digs.length);
  return {
    digs: digs.map((d, i) => ({ system: d.system, points: each + (i === 0 ? toDigs - each * digs.length : 0) })),
    rest: points - toDigs,
  };
}

/**
 * Step 4 of the turn (§20.3): stops the excavations whose power no longer holds their system, then
 * gives each power's share to its excavations; a chapter done waits for its choice and brings the
 * power's next revelation. Returns what is left of each power's research for its technology.
 */
export function resolveDigs(
  state: GameState,
  research: Map<FactionId, number>,
  events: Map<FactionId, ReportEvent[]>,
): Map<FactionId, number> {
  for (const d of state.digs) {
    if (!d.by || state.holdings.some((h) => h.owner === d.by && h.system === d.system)) continue;
    events.get(d.by)?.push({ kind: 'dig', system: d.system, stage: 'lost' });
    d.by = null;
    d.answer = null;
  }
  const rest = new Map<FactionId, number>();
  for (const p of state.powers) {
    const split = splitResearch(state, p.faction, research.get(p.faction) ?? 0);
    rest.set(p.faction, split.rest);
    for (const { system, points } of split.digs) {
      const d = digAt(state, system);
      if (!d) continue;
      d.progress += points;
      const cost = chapterCost(state, p.faction, d.chapters);
      if (d.progress < cost) continue;
      d.progress -= cost;
      d.chapters++;
      d.waiting = state.turn;
      d.answer = null;
      p.chapters++;
      events.get(p.faction)?.push({ kind: 'chapter', system, chapter: d.chapters, revelation: p.chapters });
    }
  }
  return rest;
}

/** Why a power may not answer a site's chapter, or null (§20.3). */
export function chapterRefusal(state: GameState, faction: FactionId, system: SystemId): string | null {
  const d = digAt(state, system);
  if (!d || d.by !== faction) return 'We are not excavating there.';
  if (d.waiting === null) return 'No chapter there waits for a choice.';
  return null;
}

/** The kind's second choice in words, with what it gives in a chapter (1 to 3). */
export function secondGives(kind: RelicKind, chapter: number): string {
  const def = RELIC_KINDS[kind];
  const i = Math.min(Math.max(chapter, 1), 3) - 1;
  if (def.gives === 'charts') {
    const n = R.charts[i] ?? 0;
    return `the ${n} nearest systems we have not surveyed are surveyed`;
  }
  const word = def.gives === 'fuel' ? 'fusion fuel' : def.gives;
  return `${R.resource[i]} ${word}`;
}

/** The first choice in words: research into the current technology. */
export function studyGives(chapter: number): string {
  return `${R.research[Math.min(Math.max(chapter, 1), 3) - 1]} research into our current technology`;
}

/**
 * Step 11 of the turn (§20.3): every chapter waiting with an answer, or waiting too long, takes its
 * choice. `survey` surveys a system for a power as a survey ship would; it says whether it was new.
 */
export function resolveChapterChoices(
  world: World,
  state: GameState,
  events: Map<FactionId, ReportEvent[]>,
  survey: (power: PowerState, system: SystemId) => boolean,
): void {
  for (const d of state.digs) {
    if (d.waiting === null || !d.by) continue;
    const auto = d.answer === null;
    if (auto && state.turn - d.waiting < R.waits) continue;
    const choice = d.answer ?? 0;
    const power = powerOf(state, d.by);
    const site = siteAt(world, state.seed, d.system);
    const i = Math.min(Math.max(d.chapters, 1), 3) - 1;
    const log = events.get(d.by);
    const line: Extract<ReportEvent, { kind: 'chapter-answered' }> = {
      kind: 'chapter-answered',
      system: d.system,
      chapter: d.chapters,
      choice,
      auto,
    };
    if (choice === 0 || !site) {
      const points = R.research[i] ?? 0;
      line.research = points;
      log?.push(line);
      for (const tech of grantResearch(state, power, points)) log?.push({ kind: 'researched', tech });
    } else {
      const gives = RELIC_KINDS[site.kind].gives;
      if (gives === 'charts') {
        const from = d.system;
        const near = world.systems
          .map((s) => s.id)
          .filter((id) => !hasSurveyed(power, id))
          .sort((a, b) => world.distanceDeci(from, a) - world.distanceDeci(from, b) || (a < b ? -1 : 1))
          .slice(0, R.charts[i] ?? 0);
        line.surveyed = near;
        log?.push(line);
        for (const id of near) survey(power, id);
      } else {
        const amount = R.resource[i] ?? 0;
        power.stockpile[gives] += amount;
        line.resource = { kind: gives, amount };
        log?.push(line);
      }
    }
    d.waiting = null;
    d.answer = null;
  }
}

/**
 * A lane a power may queue straight to a site it would excavate (§20.7, as built): from the nearest of
 * its holdings that can build it now, with no lane already queued there; or null. None while a lane
 * to the site is queued anywhere.
 */
export function laneToSite(
  world: World,
  state: GameState,
  faction: FactionId,
  site: SystemId,
): { holding: number; to: SystemId } | null {
  const mine = state.holdings.filter((h) => h.owner === faction);
  if (mine.some((h) => h.queue.some((q) => q.kind === 'lane' && q.to === site))) return null;
  const near = [...mine].sort(
    (a, b) => world.distanceDeci(a.system, site) - world.distanceDeci(b.system, site) || a.id - b.id,
  );
  for (const h of near) {
    if (h.queue.some((q) => q.kind === 'lane')) continue;
    if (laneTargets(world, state, faction, h.system).some((t) => t.refusal === null && t.quote.to === site))
      return { holding: h.id, to: site };
  }
  return null;
}
