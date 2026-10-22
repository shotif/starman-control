// Checks that a game state is possible: the right shape, whole numbers only, and nothing the rules
// forbid. Used when a save is loaded or imported, and by the tests after every turn.

import { isZone } from '../content/districts.ts';
import { isEdictId, isPriority } from '../content/edicts.ts';
import { isEventId } from '../content/events.ts';
import { isFactionId } from '../content/factions.ts';
import { isModuleId } from '../content/modules.ts';
import { PROJECTS } from '../content/projects.ts';
import { RULES } from '../content/rules.ts';
import { isHull, SHIPS } from '../content/ships.ts';
import { isTechId, TECHS, type TechId } from '../content/techs.ts';
import { isTreatyKind } from '../content/treaties.ts';
import { anomalyAt } from './anomalies.ts';
import { bodiesOf } from './bodies.ts';
import { RETREATS, STANCES, TARGETS } from './fleets.ts';
import { techCost } from './research.ts';
import { beaconSlots, contactWith, type GameState, MEMORY_KINDS, type MemoryKind, powerOf } from './state.ts';
import { isSold, sellerOf } from './treaties.ts';
import { laneEnds, type World } from './world.ts';

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isWhole = (v: unknown, min = 0): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min;
const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every((s) => typeof s === 'string');

/** Problems with the shape of a state (types and whole numbers), before it is trusted as a GameState. */
export function shapeProblems(raw: unknown): string[] {
  const out: string[] = [];
  if (!isRecord(raw)) return ['the game is not a record'];
  if (!isWhole(raw.version, 1)) out.push('version is not a whole number');
  if (!isWhole(raw.seed, 1) || (raw.seed as number) > 0xffffffff)
    out.push('seed is not a whole number from 1 to 2^32 − 1');
  if (!isWhole(raw.turn, 1)) out.push('turn is not a whole number from 1');
  if (!isWhole(raw.nextShipId, 1)) out.push('nextShipId is not a whole number from 1');
  if (!isWhole(raw.nextFleetId, 1)) out.push('nextFleetId is not a whole number from 1');
  // Fleets (M4_FLEETS.md §22.4).
  if (
    !Array.isArray(raw.fleets) ||
    !raw.fleets.every(
      (f) =>
        isRecord(f) &&
        isWhole(f.id, 1) &&
        isFactionId(f.owner) &&
        typeof f.name === 'string' &&
        isStrings(f.destinations) &&
        typeof f.hold === 'boolean' &&
        STANCES.includes(f.stance as never) &&
        TARGETS.includes(f.target as never) &&
        RETREATS.includes(f.retreat as never) &&
        // An invasion or a bombardment, or none (M4_FLEETS.md §26.12).
        (f.mission === null ||
          (isRecord(f.mission) &&
            (f.mission.kind === 'invade' || f.mission.kind === 'bombard' || f.mission.kind === 'raid') &&
            isWhole(f.mission.holding, 1))),
    )
  )
    out.push('fleets are not a list of fleets');
  // Wars and truces (M4_FLEETS.md §23.6).
  const pairOf = (x: unknown) => isRecord(x) && isFactionId(x.a) && isFactionId(x.b);
  if (
    !Array.isArray(raw.wars) ||
    !raw.wars.every(
      (w) =>
        pairOf(w) &&
        isRecord(w) &&
        isWhole(w.since, 1) &&
        isFactionId(w.by) &&
        (w.via === undefined || isFactionId(w.via)),
    )
  )
    out.push('wars are not a list of wars');
  if (!Array.isArray(raw.truces) || !raw.truces.every((t) => pairOf(t) && isRecord(t) && isWhole(t.until, 1)))
    out.push('truces are not a list of truces');
  // The last turn's battles (M4_FLEETS.md §24.8), kept for the replay.
  if (
    !Array.isArray(raw.battles) ||
    !raw.battles.every(
      (b) => isRecord(b) && isWhole(b.id, 1) && typeof b.system === 'string' && Array.isArray(b.rounds),
    )
  )
    out.push('battles are not a list of battles');
  if (!isWhole(raw.nextHoldingId, 1)) out.push('nextHoldingId is not a whole number from 1');
  // Treaties and offers (M3_NEIGHBOURS.md §21, §23).
  const isAmount = (a: unknown) =>
    isRecord(a) &&
    (a.resource === 'credits' || a.resource === 'metals' || a.resource === 'volatiles' || a.resource === 'fuel') &&
    isWhole(a.amount, 1);
  if (
    !Array.isArray(raw.treaties) ||
    !raw.treaties.every(
      (t) =>
        isRecord(t) &&
        isTreatyKind(t.kind) &&
        isFactionId(t.a) &&
        isFactionId(t.b) &&
        isWhole(t.since, 1) &&
        (t.ends === null || isWhole(t.ends, 1)) &&
        (t.endedBy === null || isFactionId(t.endedBy)) &&
        typeof t.broken === 'boolean' &&
        (t.payer === undefined || isFactionId(t.payer)),
    )
  )
    out.push('treaties are not a list of treaties');
  if (
    !Array.isArray(raw.offers) ||
    !raw.offers.every(
      (o) =>
        isRecord(o) &&
        (o.kind === 'exchange' ? isAmount(o.give) && isAmount(o.get) : o.kind === 'peace' || isTreatyKind(o.kind)) &&
        isFactionId(o.from) &&
        isFactionId(o.to) &&
        isWhole(o.turn, 1),
    )
  )
    out.push('offers are not a list of offers');
  if (!Array.isArray(raw.powers)) out.push('powers is not a list');
  else
    for (const [i, p] of raw.powers.entries()) {
      if (!isRecord(p)) {
        out.push(`power ${i} is not a record`);
        continue;
      }
      if (!isFactionId(p.faction)) out.push(`power ${i} has an unknown faction`);
      if (p.controller !== 'player' && p.controller !== 'ai') out.push(`power ${i} has no controller`);
      if (typeof p.capital !== 'string') out.push(`power ${i} has no capital`);
      if (!isStrings(p.surveyed)) out.push(`power ${i} surveyed systems are not a list`);
      if (!isWhole(p.shipsBuilt)) out.push(`power ${i} ships built is not a whole number`);
      if (!Array.isArray(p.researched) || !p.researched.every(isTechId))
        out.push(`power ${i} has researched unknown technologies`);
      if (!Array.isArray(p.researchQueue) || !p.researchQueue.every(isTechId))
        out.push(`power ${i} queues unknown technologies`);
      if (!isRecord(p.techProgress) || !Object.entries(p.techProgress).every(([k, v]) => isTechId(k) && isWhole(v, 1)))
        out.push(`power ${i} has progress in unknown technologies`);
      if (!isStrings(p.investigated)) out.push(`power ${i} investigated is not a list`);
      if (!Array.isArray(p.inspired) || !p.inspired.every(isTechId))
        out.push(`power ${i} was inspired towards unknown technologies`);
      if (
        !Array.isArray(p.contacts) ||
        !p.contacts.every(
          (c) =>
            isRecord(c) &&
            isFactionId(c.faction) &&
            (c.stage === 'words' || c.stage === 'talk') &&
            isWhole(c.since, 1) &&
            isWhole(c.words),
        )
      )
        out.push(`power ${i} contacts are not a list of contacts`);
      if (
        !Array.isArray(p.memories) ||
        !p.memories.every(
          (m) =>
            isRecord(m) &&
            isFactionId(m.faction) &&
            MEMORY_KINDS.includes(m.kind as MemoryKind) &&
            typeof m.amount === 'number' &&
            Number.isInteger(m.amount) &&
            isWhole(m.turn, 1),
        )
      )
        out.push(`power ${i} memories are not a list of memories`);
      if (!Array.isArray(p.gifts) || !p.gifts.every((g) => isRecord(g) && isFactionId(g.to) && isWhole(g.credits, 1)))
        out.push(`power ${i} gifts are not a list of gifts`);
      if (!isWhole(p.fleetsMade)) out.push(`power ${i} fleets made is not a whole number`);
      if (!isWhole(p.weariness)) out.push(`power ${i} weariness is not a whole number`);
      // Designs (M4_FLEETS.md §21.3).
      if (
        !Array.isArray(p.designs) ||
        !p.designs.every(
          (d) =>
            isRecord(d) &&
            isWhole(d.id, 1) &&
            typeof d.name === 'string' &&
            typeof d.hull === 'string' &&
            isHull(d.hull as never) &&
            Array.isArray(d.modules) &&
            d.modules.every(isModuleId) &&
            typeof d.yard === 'boolean' &&
            isWhole(d.since, 1) &&
            typeof d.retired === 'boolean',
        )
      )
        out.push(`power ${i} designs are not a list of designs`);
      const st = p.stockpile;
      if (!isRecord(st) || !isWhole(st.metals) || !isWhole(st.volatiles) || !isWhole(st.fuel))
        out.push(`power ${i} stockpile is not three whole numbers`);
      if (!isWhole(p.food)) out.push(`power ${i} food is not a whole number`);
      if (typeof p.treasury !== 'number' || !Number.isInteger(p.treasury))
        out.push(`power ${i} treasury is not a whole number`);
      if (p.taxes !== 'low' && p.taxes !== 'standard' && p.taxes !== 'high') out.push(`power ${i} has no tax rate`);
      if (!isWhole(p.attention) || (p.attention as number) > RULES.attention.most)
        out.push(`power ${i} attention is not a whole number within its limit`);
      if (
        !Array.isArray(p.edicts) ||
        !p.edicts.every(
          (e) =>
            isRecord(e) && isEdictId(e.edict) && isWhole(e.left, 1) && (e.holding === null || isWhole(e.holding, 1)),
        )
      )
        out.push(`power ${i} has edicts it cannot have`);
      if (typeof p.governNew !== 'boolean') out.push(`power ${i} does not say whether new colonies are governed`);
      const ev = p.event;
      if (
        ev !== null &&
        !(
          isRecord(ev) &&
          isEventId(ev.id) &&
          isWhole(ev.turn, 1) &&
          (ev.holding === null || isWhole(ev.holding, 1)) &&
          (ev.system === null || typeof ev.system === 'string') &&
          (ev.lane === null || typeof ev.lane === 'string') &&
          (ev.ship === null || isWhole(ev.ship, 1)) &&
          (ev.answer === null || ev.answer === 0 || ev.answer === 1)
        )
      )
        out.push(`power ${i} has an event it cannot have`);
      if (!isWhole(p.lastEvent)) out.push(`power ${i} does not say when its last event came`);
      if (
        !Array.isArray(p.lasting) ||
        !p.lasting.every(
          (l) =>
            isRecord(l) &&
            isEventId(l.event) &&
            ['no-industry', 'blight', 'no-growth', 'approval'].includes(l.kind as string) &&
            (l.holding === null || isWhole(l.holding, 1)) &&
            typeof l.amount === 'number' &&
            Number.isInteger(l.amount) &&
            isWhole(l.left, 1),
        )
      )
        out.push(`power ${i} has lasting effects it cannot have`);
    }
  if (!Array.isArray(raw.lanes)) out.push('lanes is not a list');
  else
    for (const [i, l] of raw.lanes.entries()) {
      if (!isRecord(l) || typeof l.id !== 'string' || !isFactionId(l.owner)) out.push(`lane ${i} has no owner`);
      else if (l.status !== 'open' && !(l.status === 'building' && isWhole(l.left, 1)))
        out.push(`lane ${i} is neither open nor being tuned`);
    }
  if (!Array.isArray(raw.ships)) out.push('ships is not a list');
  else
    for (const [i, s] of raw.ships.entries()) {
      if (!isRecord(s) || !isWhole(s.id, 1) || !isFactionId(s.owner) || typeof s.name !== 'string') {
        out.push(`ship ${i} is not a ship`);
        continue;
      }
      if (typeof s.type !== 'string' || !(s.type in SHIPS)) out.push(`ship ${i} is of an unknown type`);
      if (s.design !== null && !isWhole(s.design, 1)) out.push(`ship ${i} has a design that is no design`);
      if (s.fleet !== null && !isWhole(s.fleet, 1)) out.push(`ship ${i} sails with a fleet that is no fleet`);
      if (!isWhole(s.damage)) out.push(`ship ${i} damage is not a whole number`);
      if (s.at !== null && typeof s.at !== 'string') out.push(`ship ${i} is nowhere`);
      if (!isStrings(s.destinations)) out.push(`ship ${i} destinations are not a list`);
      if (typeof s.hold !== 'boolean' || typeof s.autoSurvey !== 'boolean')
        out.push(`ship ${i} flags are not true or false`);
      const inv = s.investigating;
      if (inv !== null && !(isRecord(inv) && typeof inv.system === 'string' && isWhole(inv.left, 1)))
        out.push(`ship ${i} is investigating nothing`);
      const f = s.founding;
      if (f !== null && !(isRecord(f) && (f.kind === 'colony' || f.kind === 'outpost') && typeof f.body === 'string'))
        out.push(`ship ${i} is founding nothing it can`);
      const j = s.blindJump;
      if (
        j !== null &&
        !(
          isRecord(j) &&
          typeof j.from === 'string' &&
          typeof j.to === 'string' &&
          isWhole(j.turns, 1) &&
          isWhole(j.left)
        )
      )
        out.push(`ship ${i} blind jump is not a jump`);
    }
  if (!Array.isArray(raw.holdings)) out.push('holdings is not a list');
  else
    for (const [i, h] of raw.holdings.entries()) {
      if (!isRecord(h) || !isWhole(h.id, 1) || !isFactionId(h.owner) || typeof h.system !== 'string') {
        out.push(`holding ${i} is not a holding`);
        continue;
      }
      if (h.kind !== 'colony' && h.kind !== 'outpost') out.push(`holding ${i} is neither a colony nor an outpost`);
      if (typeof h.body !== 'string') out.push(`holding ${i} is on no body`);
      if (typeof h.capital !== 'boolean') out.push(`holding ${i} does not say whether it is a capital`);
      if (!isWhole(h.people) || !isWhole(h.industry)) out.push(`holding ${i} people or industry is not a whole number`);
      if (!Array.isArray(h.projects) || !h.projects.every((p) => typeof p === 'string' && p in PROJECTS))
        out.push(`holding ${i} has unknown projects`);
      if (
        !Array.isArray(h.queue) ||
        !h.queue.every(
          (q) =>
            isRecord(q) &&
            ((q.kind === 'ship' &&
              typeof q.ship === 'string' &&
              q.ship in SHIPS &&
              (q.design === undefined || isWhole(q.design, 1))) ||
              (q.kind === 'refit' && isWhole(q.ship, 1) && isWhole(q.design, 1)) ||
              (q.kind === 'project' && typeof q.project === 'string' && q.project in PROJECTS) ||
              (q.kind === 'zone' && isZone(q.zone) && isWhole(q.slot, 1)) ||
              (q.kind === 'lane' && typeof q.to === 'string')) &&
            (q.governor === undefined || q.governor === true),
        )
      )
        out.push(`holding ${i} has a queue it cannot build`);
      if (!Array.isArray(h.districts) || !h.districts.every((d) => isRecord(d) && isZone(d.zone) && isWhole(d.slot, 1)))
        out.push(`holding ${i} has districts it cannot have`);
      if (!isWhole(h.hungry) || !isWhole(h.overdrive) || (h.overdrive as number) > 3)
        out.push(`holding ${i} hunger or overdrive is not a whole number`);
      if (h.governor !== null && !isPriority(h.governor)) out.push(`holding ${i} has a governor with no priority`);
      if (!Array.isArray(h.locked) || !h.locked.every((s) => isWhole(s, 1)))
        out.push(`holding ${i} has locks it cannot have`);
      if (!isWhole(h.terraform)) out.push(`holding ${i} terraforming is not a whole number`);
      if (!isWhole(h.taken)) out.push(`holding ${i} unrest since it was taken is not a whole number`);
    }
  if (!Array.isArray(raw.reports)) out.push('reports is not a list');
  return out;
}

/** Problems with a well-shaped state against the world and the rules. Empty when the state is possible. */
export function stateProblems(world: World, state: GameState): string[] {
  const out: string[] = [];
  const factions = new Set<string>();
  for (const p of state.powers) {
    if (factions.has(p.faction)) out.push(`${p.faction} is in play twice`);
    factions.add(p.faction);
    if (!world.hasSystem(p.capital)) out.push(`${p.faction}'s capital ${p.capital} is not a system`);
    let prev = '';
    for (const s of p.surveyed) {
      if (!world.hasSystem(s)) out.push(`${p.faction} surveyed ${s}, which is not a system`);
      if (s <= prev) out.push(`${p.faction}'s surveys are out of order or listed twice`);
      prev = s;
    }
  }
  for (const p of state.powers) {
    let last = '';
    for (const sys of p.investigated) {
      if (sys <= last) out.push(`${p.faction}'s investigations are out of order or listed twice`);
      if (anomalyAt(state.seed, sys) === null) out.push(`${p.faction} investigated ${sys}, which has no anomaly`);
      last = sys;
    }
  }
  for (const s of state.ships) {
    const inv = s.investigating;
    if (inv && (s.at !== inv.system || s.type !== 'survey' || anomalyAt(state.seed, inv.system) === null))
      out.push(`ship ${s.id} is investigating ${inv.system}, where it cannot`);
  }
  for (const p of state.powers) {
    const seen = new Set<string>(p.researched);
    if (seen.size !== p.researched.length) out.push(`${p.faction} researched a technology twice`);
    for (const id of p.researched) {
      const fork = TECHS[id].fork;
      if (fork && seen.has(fork)) out.push(`${p.faction} has both doctrines ${id} and ${fork}`);
    }
    for (const id of p.researchQueue) {
      if (seen.has(id)) out.push(`${p.faction} queues ${id}, which is researched or queued already`);
      const fork = TECHS[id].fork;
      if (fork && p.researched.includes(fork)) out.push(`${p.faction} queues ${id}, which ${fork} has closed`);
      for (const n of TECHS[id].needs)
        if (!seen.has(n)) out.push(`${p.faction} queues ${id} before ${n}, which it needs`);
      seen.add(id);
    }
    if (new Set(p.inspired).size !== p.inspired.length)
      out.push(`${p.faction} was inspired towards a technology twice`);
    // Contact (M3_NEIGHBOURS.md §19): each other power in play at most once, talk only with every word learnt.
    const heard = new Set<string>();
    for (const c of p.contacts) {
      if (c.faction === p.faction || !state.powers.some((x) => x.faction === c.faction))
        out.push(`${p.faction} is in contact with ${c.faction}, which is not another power in play`);
      if (heard.has(c.faction)) out.push(`${p.faction} is in contact with ${c.faction} twice`);
      heard.add(c.faction);
      if (c.since > state.turn) out.push(`${p.faction} heard ${c.faction} after this turn`);
      if (c.words > RULES.contact.wordsToTalk || (c.stage === 'talk') !== (c.words === RULES.contact.wordsToTalk))
        out.push(`${p.faction}'s words with ${c.faction} do not match its stage`);
    }
    // Memories and gifts (M3_NEIGHBOURS.md §20): of other powers in play, never nothing, never more than the most.
    const inPlay = (f: string) => f !== p.faction && state.powers.some((x) => x.faction === f);
    for (const m of p.memories) {
      if (!inPlay(m.faction)) out.push(`${p.faction} remembers ${m.faction}, which is not another power in play`);
      if (m.amount === 0 || Math.abs(m.amount) > RULES.memory.most)
        out.push(`${p.faction}'s memory of ${m.faction} counts ${m.amount}`);
      if (m.turn > state.turn) out.push(`${p.faction} remembers ${m.faction} from after this turn`);
    }
    const given = new Set<string>();
    for (const g of p.gifts) {
      if (!inPlay(g.to)) out.push(`${p.faction} sends a gift to ${g.to}, which is not another power in play`);
      if (given.has(g.to)) out.push(`${p.faction} sends ${g.to} two gifts in a turn`);
      given.add(g.to);
      if (!(RULES.memory.gifts as readonly number[]).includes(g.credits))
        out.push(`${p.faction} sends a gift of ${g.credits} credits`);
    }
    const ids = new Set(p.designs.map((d) => d.id));
    if (ids.size !== p.designs.length) out.push(`${p.faction} has two designs of one number`);
    for (const d of p.designs)
      if (d.modules.length !== (SHIPS[d.hull].hull?.places ?? 0))
        out.push(`${p.faction}'s design ${d.name} does not fill its hull's places`);
    for (const [id, v] of Object.entries(p.techProgress))
      if (p.researched.includes(id as never) || (v ?? 0) >= techCost(state, p, id as TechId, false))
        out.push(`${p.faction} has progress in ${id}, which is done`);
  }
  // Treaties (M3_NEIGHBOURS.md §21): between two powers in play in contact, one of a kind; offers too.
  const playing = new Set(state.powers.map((p) => p.faction));
  const seenTreaty = new Set<string>();
  for (const t of state.treaties) {
    const key = `${t.a}~${t.b}~${t.kind}`;
    if (!(t.a < t.b) || !playing.has(t.a) || !playing.has(t.b))
      out.push(`treaty ${key} is not between two powers in play`);
    else if (!contactWith(powerOf(state, t.a), t.b) || !contactWith(powerOf(state, t.b), t.a))
      out.push(`treaty ${key} is between powers not in contact`);
    if (seenTreaty.has(key)) out.push(`treaty ${key} is held twice`);
    seenTreaty.add(key);
    if (t.since > state.turn) out.push(`treaty ${key} begins after this turn`);
    if ((t.endedBy === null) !== (t.ends === null) || (t.broken && t.endedBy === null))
      out.push(`treaty ${key} ends without anyone ending it`);
    // A sold treaty is paid by the one of the two that does not sell it (§23).
    const seller = isSold(t.kind) ? sellerOf(t.kind, t.a, t.b) : null;
    if (isSold(t.kind) && (!seller || t.payer !== (seller === t.a ? t.b : t.a)))
      out.push(`treaty ${key} is not paid by its buyer`);
    if (!isSold(t.kind) && t.payer !== undefined) out.push(`treaty ${key} is shared, yet paid for`);
  }
  // Wars (§23.1): between two powers in play, one at most between two, declared by one of them.
  const seenWar = new Set<string>();
  for (const w of state.wars) {
    const key = `${w.a}~${w.b}`;
    if (!(w.a < w.b) || !playing.has(w.a) || !playing.has(w.b))
      out.push(`war ${key} is not between two powers in play`);
    if (w.by !== w.a && w.by !== w.b) out.push(`war ${key} was declared by neither`);
    if (seenWar.has(key)) out.push(`war ${key} is fought twice`);
    seenWar.add(key);
    if (w.since > state.turn) out.push(`war ${key} begins after this turn`);
    if (state.treaties.some((t) => t.a === w.a && t.b === w.b)) out.push(`war ${key} has a treaty between its powers`);
  }
  for (const t of state.truces)
    if (!(t.a < t.b) || !playing.has(t.a) || !playing.has(t.b)) out.push(`a truce is not between two powers in play`);
  for (const o of state.offers) {
    if (o.from === o.to || !playing.has(o.from) || !playing.has(o.to))
      out.push(`an offer of ${o.kind} is not between two powers in play`);
    if (o.turn > state.turn) out.push(`an offer of ${o.kind} is made after this turn`);
  }
  const used = new Map<string, number>();
  let previous = '';
  for (const lane of state.lanes) {
    if (lane.id <= previous) out.push(`lane ${lane.id} is out of order or listed twice`);
    previous = lane.id;
    const [a, b] = laneEnds(lane.id);
    if (!world.hasSystem(a) || !world.hasSystem(b)) {
      out.push(`lane ${lane.id} joins a system that does not exist`);
      continue;
    }
    if (!factions.has(lane.owner)) out.push(`lane ${lane.id} belongs to ${lane.owner}, who is not in play`);
    for (const end of [a, b]) used.set(end, (used.get(end) ?? 0) + 1);
  }
  for (const [system, n] of used) {
    const slots = beaconSlots(state, system);
    if (n > slots) out.push(`${system} anchors ${n} lanes but has ${slots} beacon slots`);
  }
  let lastHolding = 0;
  const bodiesHeld = new Set<string>();
  for (const h of state.holdings) {
    if (h.id <= lastHolding) out.push(`holding ${h.id} is out of order or listed twice`);
    if (h.id >= state.nextHoldingId) out.push(`holding ${h.id} is numbered past the next holding`);
    lastHolding = h.id;
    if (!factions.has(h.owner)) out.push(`holding ${h.id} belongs to ${h.owner}, who is not in play`);
    if (!world.hasSystem(h.system)) {
      out.push(`holding ${h.id} is at ${h.system}, which is not a system`);
      continue;
    }
    if (bodiesHeld.has(h.body)) out.push(`${h.body} is held twice`);
    bodiesHeld.add(h.body);
    if (!bodiesOf(world, state.seed, h.system).some((b) => b.id === h.body))
      out.push(`holding ${h.id} is on ${h.body}, which is not in ${h.system}`);
    if (h.kind === 'outpost' && h.people !== 0) out.push(`outpost ${h.id} has people`);
    if (new Set(h.projects).size !== h.projects.length) out.push(`holding ${h.id} has a project twice`);
    if (h.kind === 'outpost' && h.districts.length > 0) out.push(`outpost ${h.id} has districts`);
    if (h.kind === 'outpost' && h.governor !== null) out.push(`outpost ${h.id} has a governor`);
    if (new Set(h.districts.map((d) => d.slot)).size !== h.districts.length)
      out.push(`holding ${h.id} has two districts in one slot`);
    const most = h.capital ? 10 : 12;
    if (h.districts.some((d) => d.slot > most)) out.push(`holding ${h.id} has a district past its land`);
    for (const q of h.queue) {
      const designs = state.powers.find((p) => p.faction === h.owner)?.designs ?? [];
      if (
        q.kind === 'ship' &&
        (isHull(q.ship) ? !designs.some((d) => d.id === q.design && d.hull === q.ship) : q.design !== undefined)
      )
        out.push(`holding ${h.id} queues a ship of no design of its hull`);
      if (q.kind === 'refit' && !designs.some((d) => d.id === q.design))
        out.push(`holding ${h.id} queues a refit to no design`);
      if (q.kind === 'lane' && (!world.hasSystem(q.to) || q.to === h.system))
        out.push(`holding ${h.id} queues a lane to ${q.to}, which it cannot have`);
      const outposts =
        q.kind === 'lane' || (q.kind === 'project' && (PROJECTS[q.project].where ?? 'colony') !== 'colony');
      if (!outposts && h.kind === 'outpost') out.push(`outpost ${h.id} queues what only a colony builds`);
    }
  }
  let lastShip = 0;
  for (const s of state.ships) {
    if (s.id <= lastShip) out.push(`ship ${s.id} is out of order or listed twice`);
    if (s.id >= state.nextShipId) out.push(`ship ${s.id} is numbered past the next ship`);
    lastShip = s.id;
    if (!factions.has(s.owner)) out.push(`ship ${s.name} belongs to ${s.owner}, who is not in play`);
    if (s.at === null && !s.blindJump) out.push(`ship ${s.name} is nowhere and not on a jump`);
    if (s.at !== null && !world.hasSystem(s.at)) out.push(`ship ${s.name} is at ${s.at}, which is not a system`);
    for (const d of s.destinations)
      if (!world.hasSystem(d)) out.push(`ship ${s.name} is bound for ${d}, which is not a system`);
    // A warship sails in a fleet of its owner's, at one place with the rest; a survey ship in none (§22.1).
    const fleet = state.fleets.find((f) => f.id === s.fleet);
    if (s.fleet !== null && (!fleet || fleet.owner !== s.owner))
      out.push(`ship ${s.name} sails with no fleet of its power's`);
    if (isHull(s.type) && s.fleet === null) out.push(`warship ${s.name} sails in no fleet`);
    if (s.fleet !== null && (s.type === 'survey' || s.at === null)) out.push(`ship ${s.name} cannot sail in a fleet`);
    if (s.fleet !== null && s.destinations.length > 0)
      out.push(`ship ${s.name} has destinations of its own in a fleet`);
    // A warship is built to a design of its owner's, of its hull; a civil ship to none (§21.3).
    const design = state.powers.find((p) => p.faction === s.owner)?.designs.find((d) => d.id === s.design);
    if (isHull(s.type) ? !design || design.hull !== s.type : s.design !== null)
      out.push(`ship ${s.name} is not built to a design of its hull`);
    if (s.blindJump) {
      const j = s.blindJump;
      if (!world.hasSystem(j.from) || !world.hasSystem(j.to)) out.push(`ship ${s.name} jumps to or from nowhere`);
      if (j.left > j.turns) out.push(`ship ${s.name} has more of its jump left than it takes`);
      if (s.at === null && j.left === j.turns) out.push(`ship ${s.name} has left without its jump beginning`);
    }
  }
  let lastFleet = 0;
  for (const f of state.fleets) {
    if (f.id <= lastFleet) out.push(`fleet ${f.id} is out of order or listed twice`);
    if (f.id >= state.nextFleetId) out.push(`fleet ${f.id} is numbered past the next fleet`);
    lastFleet = f.id;
    const ships = state.ships.filter((s) => s.fleet === f.id);
    if (ships.length === 0) out.push(`fleet ${f.name} has no ships`);
    if (new Set(ships.map((s) => s.at)).size > 1) out.push(`fleet ${f.name}'s ships are not at one place`);
    for (const d of f.destinations)
      if (!world.hasSystem(d)) out.push(`fleet ${f.name} is bound for ${d}, which is not a system`);
    const m = f.mission;
    if (m && !state.holdings.some((h) => h.id === m.holding)) out.push(`fleet ${f.name}'s mission is to no holding`);
  }
  return out;
}
