// Events (M2_WORLDS.md §27, D-38): when one comes to a power, what it is about, and what each
// choice does. An event is drawn from the seed as a turn ends, waits for its answer, and is
// answered as a later turn ends: by the choice given, or by its first after three turns.

import { EVENT_IDS, EVENTS, type EventId } from '../content/events.ts';
import { FACTIONS, type FactionId } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import type { SystemId } from '../data/types.ts';
import { bodyOf, capacityOf, networkFood, networksOf, worked } from './economy.ts';
import { keysHeld } from './keys.ts';
import { siteKnown } from './relics.ts';
import type { ReportEvent } from './report.ts';
import { grantResearch } from './research.ts';
import { rng } from './rng.ts';
import {
  type GameState,
  type Holding,
  type Lasting,
  makeShip,
  type PendingEvent,
  type PowerState,
  powerOf,
} from './state.ts';
import { watchedSystems } from './visibility.ts';
import { laneEnds, type World } from './world.ts';

/** What an event is about. */
export type Subject = Pick<PendingEvent, 'holding' | 'system' | 'lane' | 'ship'>;

const NONE: Subject = { holding: null, system: null, lane: null, ship: null };
const E = RULES.events;

const colonies = (state: GameState, faction: FactionId) =>
  state.holdings.filter((h) => h.owner === faction && h.kind === 'colony');
const ofColony = (h: Holding): Subject => ({ ...NONE, holding: h.id, system: h.system });

/** The capital's network's food store, and the room it has. */
function homeStore(
  world: World,
  state: GameState,
  faction: FactionId,
): { store: number; room: number; colonies: Holding[] } {
  const home = networksOf(world, state, faction).find((n) => n.home) ?? { home: true, colonies: [] };
  const f = networkFood(world, state, faction, home);
  return { store: f.store, room: f.room, colonies: home.colonies };
}

/** Every subject an event could have for a power now, in a fixed order; none when it cannot come. */
export function subjectsFor(world: World, state: GameState, faction: FactionId, id: EventId): Subject[] {
  const power = powerOf(state, faction);
  switch (id) {
    case 'flare':
      return colonies(state, faction)
        .filter((h) => bodyOf(world, state, h)?.flareExposed === true && !h.projects.includes('flare-shield'))
        .map(ofColony);
    case 'comet':
      return [...new Set(state.holdings.filter((h) => h.owner === faction).map((h) => h.system))]
        .sort()
        .map((system) => ({ ...NONE, system }));
    case 'harvest': {
      const home = homeStore(world, state, faction);
      if (home.store >= home.room) return [];
      return home.colonies.filter((h) => worked(h, 'farms') > 0).map(ofColony);
    }
    case 'blight':
      return colonies(state, faction)
        .filter((h) => worked(h, 'farms') > 0)
        .map(ofColony);
    case 'strike':
      return colonies(state, faction)
        .filter((h) => worked(h, 'works') > 0)
        .map(ofColony);
    case 'epidemic':
      return colonies(state, faction)
        .filter((h) => h.people >= E.epidemicPeople && !h.projects.includes('medical-centre'))
        .map(ofColony);
    case 'derelict': {
      const at = state.ships
        .filter((s) => s.owner === faction && s.type === 'survey' && s.at !== null)
        .map((s) => s.at as SystemId);
      return [...new Set(at)]
        .filter((system) => power.surveyed.includes(system) && !state.holdings.some((h) => h.system === system))
        .sort()
        .map((system) => ({ ...NONE, system }));
    }
    case 'lane-drift':
      return state.lanes
        .filter((l) => l.owner === faction && l.status === 'open')
        .map((l) => ({ ...NONE, lane: l.id, system: laneEnds(l.id)[0] }));
    case 'petition':
      return colonies(state, faction)
        .filter(
          (h) =>
            h.projects.includes('shipyard') && h.people >= capacityOf(world, state, h) && h.people > E.petitionPeople,
        )
        .map(ofColony);
    case 'defectors': {
      const watched = watchedSystems(world, state, faction);
      return state.ships
        .filter((s) => s.owner !== faction && s.type === 'survey' && s.at !== null && watched.has(s.at))
        .map((s) => ({ ...NONE, ship: s.id, system: s.at }));
    }
    case 'smugglers':
      return [NONE];
    case 'founders-day':
      return [NONE];
    // M5 (M5_UNKNOWN.md §22): the relics.
    case 'dust-stirs':
      return state.digs
        .filter((d) => d.by === faction && d.waiting === null && d.chapters < RULES.relics.chapterCost.length)
        .map((d) => ({ ...NONE, system: d.system }));
    case 'rival-dig':
      return state.digs
        .filter((d) => d.by !== null && d.by !== faction && siteKnown(world, state, power, d.system))
        .map((d) => ({ ...NONE, system: d.system }));
    case 'key-sings':
      return keysHeld(state, faction).flatMap((k) => {
        const h = state.holdings.find((x) => x.id === k.holding);
        return h ? [ofColony(h)] : [];
      });
    case 'second-tone':
      return power.chapters >= E.toneChapters ? [NONE] : [];
    case 'charts-match':
      return power.chapters >= E.chartsChapters
        ? colonies(state, faction)
            .filter((h) => h.capital)
            .map(ofColony)
        : [];
    // The living sky.
    case 'great-flare':
      return colonies(state, faction)
        .filter((h) => world.system(h.system).flare)
        .map(ofColony);
    case 'nova':
      return state.turn + 1 >= E.novaFrom ? [NONE] : [];
    case 'meteor-storm':
      return colonies(state, faction).map(ofColony);
    // Each power's own.
    case 'audit':
      return faction === 'sta'
        ? colonies(state, faction)
            .filter((h) => !h.capital)
            .map(ofColony)
        : [];
    case 'shareholders':
      return faction === 'frontier' ? colonies(state, faction).map(ofColony) : [];
    case 'feud':
      return faction === 'hollow-wake' ? colonies(state, faction).map(ofColony) : [];
    case 'long-night':
      return faction === 'dusk-concord'
        ? colonies(state, faction)
            .filter((h) => worked(h, 'farms') > 0)
            .map(ofColony)
        : [];
    case 'great-storm':
      return faction === 'drift-moot' ? colonies(state, faction).map(ofColony) : [];
  }
}

const same = (a: Subject, b: Subject) =>
  a.holding === b.holding && a.system === b.system && a.lane === b.lane && a.ship === b.ship;

/** Whether an event waiting can still happen: its subject is still there, and still fits. */
export function stillFits(world: World, state: GameState, faction: FactionId, ev: PendingEvent): boolean {
  return subjectsFor(world, state, faction, ev.id).some((s) => same(s, ev));
}

/** Why a choice cannot be given now, or null if it can (lane drift's first is paid from the stockpile). */
export function choiceRefusal(state: GameState, faction: FactionId, choice: number): string | null {
  const power = powerOf(state, faction);
  if (!power.event) return 'No event waits for your answer.';
  if (choice !== 0 && choice !== 1) return 'There is no such choice.';
  if (power.event.id === 'lane-drift' && choice === 0 && !canRetune(power))
    return `Retuning needs ${E.driftFuel} fusion fuel and ${E.driftMetals} metals in the stockpile.`;
  return null;
}

const canRetune = (power: PowerState) => power.stockpile.fuel >= E.driftFuel && power.stockpile.metals >= E.driftMetals;

/** The lasting effects of a kind on a colony: its own, and those on every colony of its power. */
export function lastingOn(state: GameState, h: Holding, kind: Lasting['kind']): Lasting[] {
  return powerOf(state, h.owner).lasting.filter((l) => l.kind === kind && (l.holding === null || l.holding === h.id));
}

/** How an event's lasting effect is named among a colony's parts. */
export function lastingLabel(l: Lasting): string {
  if (l.event === 'arks') return 'newcomers settling in';
  return EVENTS[l.event].lasting ?? EVENTS[l.event].name.toLowerCase();
}

/**
 * The event that comes to a power as this turn ends, if one does: Founders' Day by the calendar;
 * otherwise, from the turn's draw, one of those whose conditions fit, with one of its subjects.
 */
export function drawEvent(world: World, state: GameState, faction: FactionId): PendingEvent | null {
  const power = powerOf(state, faction);
  if (power.event) return null;
  const next = state.turn + 1;
  const make = (id: EventId, s: Subject): PendingEvent => ({ id, turn: next, ...s, answer: null });
  if (next > 1 && (next - 1) % E.foundersEvery === 0) return make('founders-day', NONE);
  if (next < E.first || (power.lastEvent > 0 && next - power.lastEvent < E.gap)) return null;
  const r = rng(state.seed, 'event', next, faction);
  if (!r.chance(1, E.chance)) return null;
  const fits = EVENT_IDS.filter((id) => id !== 'founders-day')
    .map((id) => [id, subjectsFor(world, state, faction, id)] as const)
    .filter(([, subjects]) => subjects.length > 0);
  if (fits.length === 0) return null;
  const [id, subjects] = r.pick(fits);
  return make(id, r.pick(subjects));
}

/** The words an event's text and choices are filled with. */
export function eventWords(
  world: World,
  state: GameState,
  ev: Subject & { id: EventId; turn: number },
): Record<string, string> {
  const words: Record<string, string> = {};
  if (ev.system) {
    words.system = world.system(ev.system).name;
    words.place = words.system;
  }
  const h = ev.holding === null ? undefined : state.holdings.find((x) => x.id === ev.holding);
  if (h) words.place = bodyOf(world, state, h)?.name ?? world.system(h.system).name;
  if (ev.lane) {
    const [a, b] = laneEnds(ev.lane);
    words.lane = `between ${world.system(a).name} and ${world.system(b).name}`;
  }
  const ship = ev.ship === null ? undefined : state.ships.find((s) => s.id === ev.ship);
  if (ship) {
    words.ship = ship.name;
    words.power = FACTIONS[ship.owner].shortName;
  }
  // Another power's excavation (M5_UNKNOWN.md §22).
  const digger = ev.system ? state.digs.find((d) => d.system === ev.system)?.by : undefined;
  if (ev.id === 'rival-dig' && digger) words.power = FACTIONS[digger].shortName;
  words.years = String(Math.floor((ev.turn - 1) / 4));
  return words;
}

/** Puts a choice into effect for a power; `events` are the turn's report lines, each power's. */
function apply(
  world: World,
  state: GameState,
  faction: FactionId,
  ev: PendingEvent,
  choice: 0 | 1,
  events: Map<FactionId, ReportEvent[]>,
): void {
  const power = powerOf(state, faction);
  const log = events.get(faction) as ReportEvent[];
  const h = ev.holding === null ? undefined : state.holdings.find((x) => x.id === ev.holding);
  const last = (kind: Lasting['kind'], turns: number, amount = 0, holding: number | null = h?.id ?? null) =>
    power.lasting.push({ event: ev.id, kind, holding, amount, left: turns });
  const research = (points: number) => {
    for (const tech of grantResearch(state, power, points)) log.push({ kind: 'researched', tech });
  };
  power.treasury -= EVENTS[ev.id].choices[choice].credits;
  switch (ev.id) {
    case 'flare':
      if (choice === 0) last('no-industry', 1);
      else if (h) h.people = Math.max(1, h.people - E.flarePeople);
      return;
    case 'comet':
      if (choice === 0) power.stockpile.volatiles += E.cometVolatiles;
      else research(E.cometResearch);
      return;
    case 'harvest':
      if (choice === 0) power.food = Math.max(power.food, homeStore(world, state, faction).room);
      return;
    case 'blight':
      last('blight', choice === 0 ? E.blightShort : E.blightLong);
      return;
    case 'strike':
      if (choice === 1) {
        last('no-industry', E.strikeTurns);
        last('approval', E.strikeTurns, E.strikeApproval);
      }
      return;
    case 'epidemic':
      if (choice === 1) {
        last('no-growth', E.quarantineTurns);
        last('approval', E.quarantineTurns, E.quarantineApproval);
      }
      return;
    case 'derelict':
      if (choice === 0) power.stockpile.metals += E.derelictMetals;
      else research(E.derelictResearch);
      return;
    case 'lane-drift': {
      if (choice === 0) {
        power.stockpile.fuel -= E.driftFuel;
        power.stockpile.metals -= E.driftMetals;
        return;
      }
      const i = state.lanes.findIndex((l) => l.id === ev.lane);
      const lane = state.lanes[i];
      if (lane) state.lanes[i] = { id: lane.id, owner: lane.owner, status: 'building', left: E.driftTurns };
      return;
    }
    case 'petition':
      if (choice === 0 && h) {
        makeShip(state, faction, 'colony', h.system);
        h.people -= E.petitionPeople;
      } else last('approval', E.petitionTurns, E.petitionApproval);
      return;
    case 'defectors': {
      const ship = state.ships.find((s) => s.id === ev.ship);
      if (choice === 1 || !ship || ship.at === null) return;
      events.get(ship.owner)?.push({ kind: 'defected', ship: ship.name, to: faction, system: ship.at });
      ship.owner = faction;
      ship.destinations = [];
      ship.hold = false;
      ship.investigating = null;
      return;
    }
    case 'smugglers': {
      if (choice === 0) {
        power.stockpile.fuel += E.smugglersFuel;
        return;
      }
      const capital = state.holdings.find((x) => x.owner === faction && x.capital);
      if (capital) last('approval', E.smugglersTurns, E.smugglersApproval, capital.id);
      return;
    }
    case 'founders-day':
      if (choice === 0) last('approval', E.foundersTurns, E.foundersApproval, null);
      return;
    // M5 (M5_UNKNOWN.md §22).
    case 'dust-stirs': {
      const d = state.digs.find((x) => x.system === ev.system && x.by === faction);
      if (choice === 0 && d) d.progress += E.dustProgress;
      else if (choice === 1) research(E.dustResearch);
      return;
    }
    case 'rival-dig':
      if (choice === 0) research(E.rivalDigResearch);
      return;
    case 'key-sings':
      if (choice === 1) {
        research(E.keyResearch);
        const capital = state.holdings.find((x) => x.owner === faction && x.capital);
        if (capital) last('approval', E.keyTurns, E.keyApproval, capital.id);
      }
      return;
    case 'second-tone':
      if (choice === 0) {
        research(E.toneResearch);
        last('approval', E.toneTurns, E.toneApproval, null);
      }
      return;
    case 'charts-match':
      if (choice === 0) research(E.chartsResearch);
      else last('approval', E.chartsTurns, E.chartsApproval, null);
      return;
    case 'great-flare':
      if (choice === 0) {
        research(E.greatFlareResearch);
        if (h && !h.projects.includes('flare-shield')) h.people = Math.max(1, h.people - E.greatFlarePeople);
      } else last('no-industry', E.greatFlareTurns);
      return;
    case 'nova':
      if (choice === 0) research(E.novaResearch);
      else last('approval', E.novaTurns, E.novaApproval, null);
      return;
    case 'meteor-storm':
      if (choice === 0) last('no-industry', 1);
      else {
        power.stockpile.metals += E.meteorMetals;
        last('approval', E.meteorTurns, E.meteorApproval);
      }
      return;
    case 'audit':
      if (choice === 0) last('approval', E.auditTurns, E.auditApproval);
      return;
    case 'shareholders':
      if (!h) return;
      if (choice === 0) h.people += E.shareholdersPeople;
      else h.industry += E.shareholdersIndustry;
      return;
    case 'feud':
      if (choice === 0) last('approval', E.feudTurns, E.feudApproval);
      return;
    case 'long-night':
      if (choice === 0) last('blight', E.nightBlight);
      else last('no-growth', E.nightTurns);
      return;
    case 'great-storm':
      if (choice === 0) last('no-industry', E.stormTurns);
      else {
        power.stockpile.fuel += E.stormFuel;
        if (h) h.people = Math.max(1, h.people - E.stormPeople);
      }
      return;
  }
}

/**
 * The events' part of a turn's end (§27.1), for every power: lasting effects run down; an event
 * whose subject has gone is put away; one answered, or unanswered for three turns, takes effect;
 * and a new one may come.
 */
export function resolveEvents(world: World, state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  for (const p of state.powers) {
    p.lasting = p.lasting.map((l) => ({ ...l, left: l.left - 1 })).filter((l) => l.left > 0);
    const ev = p.event;
    if (!ev) continue;
    const log = events.get(p.faction) as ReportEvent[];
    const subject = { holding: ev.holding, system: ev.system, lane: ev.lane, ship: ev.ship };
    if (!stillFits(world, state, p.faction, ev)) {
      log.push({ kind: 'event-gone', event: ev.id, ...subject });
      p.event = null;
      continue;
    }
    const due = state.turn - ev.turn + 1 >= E.waits;
    if (ev.answer === null && !due) continue;
    let choice: 0 | 1 = ev.answer ?? 0;
    // A retuning the stockpile can no longer pay for lets the lane drift instead.
    if (ev.id === 'lane-drift' && choice === 0 && !canRetune(p)) choice = 1;
    log.push({ kind: 'event-answered', event: ev.id, choice, auto: ev.answer === null, ...subject });
    apply(world, state, p.faction, ev, choice, events);
    p.event = null;
  }
  for (const p of state.powers) {
    const ev = drawEvent(world, state, p.faction);
    if (!ev) continue;
    p.event = ev;
    p.lastEvent = ev.turn;
    (events.get(p.faction) as ReportEvent[]).push({
      kind: 'event',
      event: ev.id,
      holding: ev.holding,
      system: ev.system,
      lane: ev.lane,
      ship: ev.ship,
    });
  }
}

/** A rival's answer (§27.4): the first choice when its treasury can pay it and keep 20, else the second. */
export function rivalChoice(state: GameState, faction: FactionId): 0 | 1 {
  const power = powerOf(state, faction);
  const ev = power.event;
  if (!ev) return 0;
  if (ev.id === 'lane-drift') return canRetune(power) ? 0 : 1;
  return power.treasury - EVENTS[ev.id].choices[0].credits >= E.rivalKeeps ? 0 : 1;
}
