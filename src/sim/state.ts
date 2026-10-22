// The game state: plain data, whole numbers only, and the only thing a save holds (§11). The world
// (stars, the lane catalogue, the bodies made from the seed) is rebuilt; the state records what this
// game changed. Nothing here knows which power the player is: `controller` only says who sends the
// orders, and the rules treat both the same.

import type { District } from '../content/districts.ts';
import type { EdictId, Priority } from '../content/edicts.ts';
import type { EventId } from '../content/events.ts';
import { FACTIONS, type FactionId, type WarReason } from '../content/factions.ts';
import type { ModuleId } from '../content/modules.ts';
import type { ProjectId, QueueItem } from '../content/projects.ts';
import { RULES } from '../content/rules.ts';
import { type HullId, type ShipType, STARTING_FLEET, shipName } from '../content/ships.ts';
import { TECHS, type TechId } from '../content/techs.ts';
import type { TreatyKind } from '../content/treaties.ts';
import type { SystemId } from '../data/types.ts';
import type { BattleLog } from './battle.ts';
import { refreshYards } from './designs.ts';
import { homeWebs } from './homeWeb.ts';
import type { ReportEvent } from './report.ts';
import type { LaneId, World } from './world.ts';

/** The version of the game state's shape. Raised, with a migration in save.ts, whenever it changes. */
export const STATE_VERSION = 26;

export interface Stockpile {
  metals: number;
  volatiles: number;
  fuel: number;
}

export interface PowerState {
  faction: FactionId;
  /** Who gives its orders. The rules treat both the same. */
  controller: 'player' | 'ai';
  capital: SystemId;
  stockpile: Stockpile;
  /** Systems it has surveyed, in id order (§1 of M1_TURNS.md); every other system is only charted. */
  surveyed: SystemId[];
  /** Ships it has ever had, for naming the next. */
  shipsBuilt: number;
  /** Technologies researched, in the order they were finished (M1_LANES_RESEARCH.md §2). */
  researched: TechId[];
  /** Technologies to research, first first; each after what it needs. */
  researchQueue: TechId[];
  /** Points put into technologies not yet finished; kept when the queue changes. */
  techProgress: Partial<Record<TechId, number>>;
  /** Technologies whose inspiration it has had, in the order it had them (M2B_SCIENCE.md §17.1). */
  inspired: TechId[];
  /** Systems whose anomaly it has investigated, in id order (M1_LANES_RESEARCH.md §3). */
  investigated: SystemId[];
  /** Food in store for the colonies joined to the capital by its lanes (M2_WORLDS.md §3). */
  food: number;
  /** Credits in the treasury; below zero is debt (M2_WORLDS.md §4). */
  treasury: number;
  /** One tax rate for the whole power. */
  taxes: TaxRate;
  /** What pays for edicts: a little each turn, kept up to a limit (M2_WORLDS.md §25.2). */
  attention: number;
  /** Edicts in force, one of each at most. */
  edicts: ActiveEdict[];
  /** New colonies get a governor (the imperial start, M2_WORLDS.md §25.1). */
  governNew: boolean;
  /** An event waiting for its answer (M2_WORLDS.md §27). */
  event: PendingEvent | null;
  /** The turn its last event came; 0 before any. */
  lastEvent: number;
  /** What its events left behind, each until it runs out. */
  lasting: Lasting[];
  /** The other powers it has heard, in the order heard (M3_NEIGHBOURS.md §19.1). */
  contacts: Contact[];
  /** What it remembers of the others, oldest first (M3_NEIGHBOURS.md §20.1). */
  memories: Memory[];
  /** Gifts it is sending this turn, paid already and delivered as the turn ends (§20.2). */
  gifts: { to: FactionId; credits: number }[];
  /** Its warships' designs, the yard's and its own, in the order made (M4_FLEETS.md §21.3). */
  designs: Design[];
  /** Fleets it has ever formed, for naming the next (M4_FLEETS.md §22.1). */
  fleetsMade: number;
  /** How weary its people are of war (M4_FLEETS.md §23.4): every 5 costs a point of approval. */
  weariness: number;
  /** The power it has capitulated to, if any (M4_FLEETS.md §28.5): it pays tribute and fights its wars. */
  subduedBy: FactionId | null;
  /** The most colonies it has ever held, to tell when it is beaten (§28.5). */
  mostColonies: number;
  /** The turn it left the game, its last colony gone (M4_FLEETS.md §30.2); null while it plays. */
  left: number | null;
  /**
   * Its story in numbers, for the end (§30.3): wars it declared, battles it fought, holdings it took;
   * and the research points and industry it has made in the game, its works in the score (§31.4).
   */
  story: { wars: number; battles: number; taken: number; research: number; industry: number };
  /** The share of its research that goes to its excavations, in percent (M5_UNKNOWN.md §20.3). */
  digShare: DigShare;
  /** How many chapters of excavation it has completed, which says its next revelation (§20.5). */
  chapters: number;
}

/** The shares of research a power may give its excavations (M5_UNKNOWN.md §20.3). */
export const DIG_SHARES = [0, 25, 50] as const;
export type DigShare = (typeof DIG_SHARES)[number];

/**
 * A relic site's excavation (M5_UNKNOWN.md §20.3), once one has begun there: the power excavating it
 * now, or none; the chapters done; the research toward the next; and the turn its last chapter began
 * to wait for its choice, or null.
 */
export interface Dig {
  system: SystemId;
  by: FactionId | null;
  chapters: number;
  progress: number;
  waiting: number | null;
  /** The choice given for the chapter waiting, taken as the turn ends; it may be changed until then. */
  answer: 0 | 1 | null;
}

/** A war between two powers (M4_FLEETS.md §23.1): `a` before `b` in id order; `by` declared it. */
export interface War {
  a: FactionId;
  b: FactionId;
  since: number;
  by: FactionId;
  /** The power whose alliance brought this war about, when it was declared on another. */
  via?: FactionId;
  /** Why a rival declared it (M4_FLEETS.md §28.1); the player gives no reason. */
  reason?: WarReason;
}

/** A truce after peace (§23.2): neither may declare war on the other before turn `until`. */
export interface Truce {
  a: FactionId;
  b: FactionId;
  until: number;
}

/** A resolution before the Assembly (M4_FLEETS.md §29.3). */
export type ResolutionKind = 'sanctions' | 'peace-call';

export interface Resolution {
  kind: ResolutionKind;
  by: FactionId;
  /** Sanctions: the member named; a call for peace: one of the two at war, and `and` the other. */
  on: FactionId;
  and?: FactionId;
  /** The turn it is voted on, counted as that turn ends. */
  turn: number;
}

/** A vote cast in the Assembly: for a candidate, or on a resolution. */
export type VoteChoice = FactionId | 'for' | 'against' | 'abstain';

/** The Assembly (fiction, M4_FLEETS.md §29). */
export interface Assembly {
  /** The turn it formed. */
  formed: number;
  /** Its members, in the order they joined. */
  members: FactionId[];
  /** Each member's votes as last counted, as the turn ended: public, so every screen shows them. */
  roll: { faction: FactionId; votes: number }[];
  /** Who leads it, elected; none before the first election. */
  leader: FactionId | null;
  /** How many elections in a row its leader has won (M4_FLEETS.md §31.3). */
  terms: number;
  /** The turn of the next election, counted as that turn ends. */
  election: number;
  /** The two candidates, named the turn before the election. */
  candidates: [FactionId, FactionId] | null;
  /** The votes cast this turn, by order. */
  cast: { faction: FactionId; choice: VoteChoice }[];
  /** The resolution proposed, voted on the turn after. */
  resolution: Resolution | null;
  /** The turn each member last proposed one. */
  proposed: { faction: FactionId; turn: number }[];
  /** Sanctions in force, and since when. */
  sanctions: { on: FactionId; since: number }[];
  /** Calls for peace in force: until when, and which of the two have offered peace without terms since. */
  calls: { a: FactionId; b: FactionId; until: number; offered: FactionId[] }[];
  /** Elected by two thirds of all the votes (§29.2): from increment 50 this wins the game. */
  chosen: FactionId | null;
}

/** How a fleet fights (M4_FLEETS.md §6, §22.1): the range it seeks. */
export type Stance = 'engage' | 'defend' | 'evade';
/** What a fleet's ships fire at first. */
export type TargetPriority = 'warships' | 'largest' | 'smallest' | 'transports';
/** The share of its strength, in percent, whose loss sends a fleet home; 100: never. */
export type RetreatPoint = 25 | 50 | 75 | 100;

/**
 * A fleet (M4_FLEETS.md §22.1): ships of one power at one system, named and ordered as one. Its
 * ships are those whose `fleet` is its id; it moves where they all are.
 */
export interface Fleet {
  id: number;
  owner: FactionId;
  name: string;
  /** Where it is going along lanes, in order (waypoints). */
  destinations: SystemId[];
  hold: boolean;
  stance: Stance;
  target: TargetPriority;
  retreat: RetreatPoint;
  /** An invasion or a bombardment of a holding in its system, until carried out or changed (M4_FLEETS.md §26). */
  mission: Mission | null;
}

/** An invasion, a bombardment, or a raid (M4_FLEETS.md §27.1), of a holding. */
export interface Mission {
  kind: 'invade' | 'bombard' | 'raid';
  holding: number;
}

/**
 * A warship's design (M4_FLEETS.md §21.3): a hull and a module in each place. Never changed once
 * made, so every ship built to it stays as built; retired, it leaves the build lists.
 */
export interface Design {
  /** Unique among its power's designs. */
  id: number;
  name: string;
  hull: HullId;
  modules: ModuleId[];
  /** Made by the power's yard from the best it knows; else the player's own. */
  yard: boolean;
  /** The turn it was made. */
  since: number;
  retired: boolean;
}

/** What a memory is of (M3_NEIGHBOURS.md §20.1, §21). */
export const MEMORY_KINDS = [
  'gift',
  'great-work-lost',
  'settled-beside',
  'treaty-ended',
  'treaty-broken',
  'treaty-broken-heard',
  'offer-misread',
  'claim-crossed',
  // M4 (M4_FLEETS.md §23.1).
  'war-declared',
  'war-declared-heard',
  // M4 (M4_FLEETS.md §26.4, §26.5).
  'invaded',
  'bombarded',
  'bombarded-heard',
  // M4 (M4_FLEETS.md §27.1).
  'raided',
  'raided-heard',
] as const;
export type MemoryKind = (typeof MEMORY_KINDS)[number];

/** A memory of another power: its amount now, fading a point towards nothing every few turns. */
export interface Memory {
  faction: FactionId;
  kind: MemoryKind;
  /** What it counts for in the attitude now; never 0 (forgotten then). */
  amount: number;
  /** The turn it began. */
  turn: number;
  /** For a gift, the credits; for the rest, the system where it happened, and the great work lost. */
  credits?: number;
  system?: SystemId;
  project?: ProjectId;
  /** For a treaty ended, broken or misread: which; for a breach or a war heard of, the power it was against. */
  treaty?: TreatyKind;
  victim?: FactionId;
}

/**
 * A treaty between two powers (M3_NEIGHBOURS.md §21): `a` before `b` in id order. Notice given, it
 * ends on turn `ends`; broken, it ends as the turn that broke it ends.
 */
export interface Treaty {
  kind: TreatyKind;
  a: FactionId;
  b: FactionId;
  /** The turn it was agreed; it holds from then. */
  since: number;
  ends: number | null;
  /** Who gave notice or broke it, and whether it was broken. */
  endedBy: FactionId | null;
  broken: boolean;
  /** For a treaty sold (passage, protection, §23): the buyer, who pays every turn. */
  payer?: FactionId;
}

/** A resource or credits, and how much, in an exchange (§23.1). */
export interface Amount {
  resource: 'credits' | 'metals' | 'volatiles' | 'fuel';
  amount: number;
}

/**
 * A treaty, or an exchange of resources (§23.1), offered: on its way as the turn it was made ends,
 * then waiting for the player's answer.
 */
/** What may be offered (M3_NEIGHBOURS.md §21.2, M4_FLEETS.md §23.2, §28.5). */
export type OfferKind = TreatyKind | 'exchange' | 'peace' | 'capitulation';

export interface Offer {
  /**
   * A treaty, an exchange, peace to a power at war with the offerer (M4_FLEETS.md §23.2), or the
   * offerer's capitulation to it (§28.5).
   */
  kind: OfferKind;
  from: FactionId;
  to: FactionId;
  turn: number;
  /** An exchange's terms: what the offerer gives, and what it asks for. */
  give?: Amount;
  get?: Amount;
}

/**
 * A power's contact with another (D-52): words while it learns their tongue, then talk. A power not
 * listed is unaware of the other. Contact is never lost.
 */
export interface Contact {
  faction: FactionId;
  stage: 'words' | 'talk';
  /** The turn it first heard them. */
  since: number;
  /** Translation so far, up to `RULES.contact.wordsToTalk`. */
  words: number;
}

/** An event that has come to a power, with its subject, and the answer given (taken as the turn ends). */
export interface PendingEvent {
  id: EventId;
  /** The turn it came. */
  turn: number;
  holding: number | null;
  system: SystemId | null;
  lane: LaneId | null;
  ship: number | null;
  answer: 0 | 1 | null;
}

/** An event's lasting effect: on a colony, or on every colony (`holding` null), for `left` more turns. */
export interface Lasting {
  event: EventId;
  kind: 'no-industry' | 'blight' | 'no-growth' | 'approval';
  holding: number | null;
  /** Approval's change; 0 for the others. */
  amount: number;
  left: number;
}

/** An edict in force: on a colony (or its supply network) or the whole power, for `left` more turns. */
export interface ActiveEdict {
  edict: EdictId;
  holding: number | null;
  left: number;
}

/** How hard a power taxes its people (M2_WORLDS.md §4). */
export type TaxRate = 'low' | 'standard' | 'high';

/**
 * A lane that is not dark: open, or paid for and being tuned for `left` more turns. Every lane of
 * the catalogue not listed is dark; a lane not in the catalogue is one a power built.
 */
export type LaneState =
  | { id: LaneId; owner: FactionId; status: 'open' }
  | { id: LaneId; owner: FactionId; status: 'building'; left: number };

export interface BlindJump {
  from: SystemId;
  to: SystemId;
  /** Turns the whole jump takes. */
  turns: number;
  /** Turns still to go; the jump has begun once this is below `turns`. */
  left: number;
}

export interface ShipState {
  id: number;
  owner: FactionId;
  type: ShipType;
  name: string;
  /** Where it is; null while on a blind jump. */
  at: SystemId | null;
  /** Where it is going along lanes, in order (waypoints). */
  destinations: SystemId[];
  blindJump: BlindJump | null;
  /** Told to stay where it is: not counted as idle. */
  hold: boolean;
  /** Survey ships survey what they enter unless this is off. */
  autoSurvey: boolean;
  /** A colony or outpost it will found when the turn ends, on a body of the system it is at. */
  founding: { kind: 'colony' | 'outpost'; body: string } | null;
  /** The anomaly it is investigating where it is, and the turns left. */
  investigating: { system: SystemId; left: number } | null;
  /** A warship's design, one of its power's (M4_FLEETS.md §21.3); null for a civil ship. */
  design: number | null;
  /** The fleet it sails with (M4_FLEETS.md §22.1): always one for a warship, none for a survey ship. */
  fleet: number | null;
  /** Structure lost in battle and not yet repaired, in tenths (M4_FLEETS.md §24.4). */
  damage: number;
}

/** A colony or an outpost (M1_COLONIES.md §1). */
export interface Holding {
  id: number;
  owner: FactionId;
  kind: 'colony' | 'outpost';
  system: SystemId;
  /** The body it is on. */
  body: string;
  capital: boolean;
  /** People, in tenths of a unit (a unit is about a million); 0 for an outpost. */
  people: number;
  /** Projects built here, in the order they were finished. */
  projects: ProjectId[];
  queue: QueueItem[];
  /** Industry made and not yet spent: it goes into the first item, and is kept up to a limit. */
  industry: number;
  /** Zoned districts, in the order its people work them (M2_WORLDS.md §2); none for an outpost. */
  districts: District[];
  /** Turns in a row it has gone hungry (M2_WORLDS.md §3). */
  hungry: number;
  /** Steps of industry bought with credits each turn, 0 to 3 (overdrive, M2_WORLDS.md §4). */
  overdrive: number;
  /** Its governor's priority, or none (M2_WORLDS.md §25.1). */
  governor: Priority | null;
  /** District slots the player zoned or cleared, which no governor touches. */
  locked: number[];
  /** Turns its terraforming station has worked (M2B_SCIENCE.md §18.3); 0 without one. */
  terraform: number;
  /** Turns of unrest left since it changed hands (M4_FLEETS.md §26.4); 0 for most. */
  taken: number;
}

export interface GameState {
  version: number;
  /** A whole number from 1 to 2^32 − 1. With the orders, it decides everything. */
  seed: number;
  /** 1 is Q1 2176. */
  turn: number;
  powers: PowerState[];
  /** In id order. */
  lanes: LaneState[];
  /** In id order. */
  ships: ShipState[];
  nextShipId: number;
  /** In id order (M4_FLEETS.md §22.1). */
  fleets: Fleet[];
  nextFleetId: number;
  /** Colonies and outposts, in id order. */
  holdings: Holding[];
  nextHoldingId: number;
  /** What happened to each power in the last turn that ended. */
  reports: { faction: FactionId; turn: number; events: ReportEvent[] }[];
  /** Treaties in force (M3_NEIGHBOURS.md §21), and offers on their way or waiting for an answer. */
  treaties: Treaty[];
  offers: Offer[];
  /** Wars, and truces after peace (M4_FLEETS.md §23), each in id order of its powers. */
  wars: War[];
  truces: Truce[];
  /** The last turn's battles, kept for its report and replay (M4_FLEETS.md §24.8). */
  battles: BattleLog[];
  /** The Assembly (M4_FLEETS.md §29), once it has formed. */
  assembly: Assembly | null;
  /** The last turn before the highest score wins (M4_FLEETS.md §30.1), or null for no limit. */
  limit: number | null;
  /** How the game was decided, once it is (§30.1): who won (none when played alone), how, and on which turn. */
  ended: { winner: FactionId | null; how: VictoryKind; turn: number } | null;
  /** Every power's score every 10 turns, in the powers' order, for the story (§30.3). */
  history: { turn: number; scores: number[] }[];
  /** The relic sites' excavations (M5_UNKNOWN.md §20.10), one for each site begun, in system order. */
  digs: Dig[];
}

/** How a game is won (M4_FLEETS.md §30.1). */
export type VictoryKind = 'conquest' | 'vote' | 'score';

export interface NewGameSetup {
  seed: number;
  /** The turn limit (M4_FLEETS.md §30.1): 250 unless said; null for none. */
  limit?: number | null;
  /** The powers in play, in the order they are listed; `governed` for the imperial start. */
  powers: { faction: FactionId; controller: 'player' | 'ai'; governed?: boolean }[];
}

/** A new ship for a power, at a system, named after its makers' traditions. */
export function makeShip(
  state: GameState,
  faction: FactionId,
  type: ShipType,
  at: SystemId,
  design: number | null = null,
): ShipState {
  const power = state.powers.find((p) => p.faction === faction);
  if (!power) throw new RangeError(`${faction} is not in play`);
  const ship: ShipState = {
    id: state.nextShipId,
    owner: faction,
    type,
    name: shipName(FACTIONS[faction].shipmakers, power.shipsBuilt),
    at,
    destinations: [],
    blindJump: null,
    hold: false,
    autoSurvey: type === 'survey',
    founding: null,
    investigating: null,
    design,
    fleet: null,
    damage: 0,
  };
  state.nextShipId++;
  power.shipsBuilt++;
  state.ships.push(ship);
  return ship;
}

/** A new colony or outpost, added to the state. */
export function makeHolding(
  state: GameState,
  h: Omit<
    Holding,
    | 'id'
    | 'projects'
    | 'queue'
    | 'industry'
    | 'districts'
    | 'hungry'
    | 'overdrive'
    | 'governor'
    | 'locked'
    | 'terraform'
    | 'taken'
  > &
    Partial<Pick<Holding, 'projects' | 'districts' | 'governor'>>,
): Holding {
  const holding: Holding = {
    id: state.nextHoldingId,
    projects: [],
    queue: [],
    industry: 0,
    districts: [],
    hungry: 0,
    overdrive: 0,
    governor: null,
    locked: [],
    terraform: 0,
    taken: 0,
    ...h,
  };
  state.nextHoldingId++;
  state.holdings.push(holding);
  return holding;
}

/** A power's capital colony, as every game starts it (§5 of the M1 design, M1_COLONIES.md §1). */
export function capitalHolding(faction: FactionId): Omit<Holding, 'id'> {
  return {
    owner: faction,
    kind: 'colony',
    system: FACTIONS[faction].capital.systemId,
    body: FACTIONS[faction].capital.bodyId,
    capital: true,
    people: RULES.capital.people,
    projects: ['shipyard', 'lane-station'],
    queue: [],
    industry: 0,
    districts: RULES.districts.capitalStart.map((zone, i) => ({ zone, slot: i + 1 })),
    hungry: 0,
    overdrive: 0,
    governor: null,
    locked: [],
    terraform: 0,
    taken: 0,
  };
}

/**
 * A new game (§5): every power in play holds its capital, with a shipyard and a lane station, its
 * home web of lanes, its starting ships and a small stockpile, and has surveyed its capital.
 */
export function newGame(world: World, setup: NewGameSetup): GameState {
  if (setup.powers.length === 0) throw new RangeError('A game needs at least one power');
  // Webs are worked out for every faction, in play or not, so a start never depends on who plays.
  const webs = homeWebs(
    world,
    Object.values(FACTIONS).map((f) => ({ faction: f.id, capital: f.capital.systemId })),
  );
  const lanes: LaneState[] = [];
  for (const p of setup.powers) {
    const web = webs.find((w) => w.faction === p.faction);
    for (const id of web?.lanes ?? []) lanes.push({ id, owner: p.faction, status: 'open' });
  }
  lanes.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const state: GameState = {
    version: STATE_VERSION,
    seed: setup.seed >>> 0 || 1,
    turn: 1,
    powers: setup.powers.map((p) => ({
      faction: p.faction,
      controller: p.controller,
      capital: FACTIONS[p.faction].capital.systemId,
      stockpile: { ...RULES.start.stockpile },
      surveyed: [FACTIONS[p.faction].capital.systemId],
      shipsBuilt: 0,
      researched: [],
      researchQueue: [],
      techProgress: {},
      inspired: [],
      contacts: [],
      memories: [],
      gifts: [],
      investigated: [],
      food: RULES.food.start,
      treasury: RULES.credits.start,
      taxes: 'standard' as const,
      attention: RULES.attention.start,
      edicts: [],
      governNew: p.governed === true,
      event: null,
      lastEvent: 0,
      lasting: [],
      designs: [],
      fleetsMade: 0,
      weariness: 0,
      subduedBy: null,
      mostColonies: 1,
      left: null,
      story: { wars: 0, battles: 0, taken: 0, research: 0, industry: 0 },
      digShare: RULES.relics.share as DigShare,
      chapters: 0,
    })),
    lanes,
    ships: [],
    nextShipId: 1,
    fleets: [],
    nextFleetId: 1,
    holdings: [],
    nextHoldingId: 1,
    reports: [],
    treaties: [],
    offers: [],
    wars: [],
    truces: [],
    battles: [],
    assembly: null,
    limit: setup.limit === undefined ? RULES.victory.limit : setup.limit,
    ended: null,
    history: [],
    digs: [],
  };
  for (const p of state.powers)
    makeHolding(state, { ...capitalHolding(p.faction), governor: p.governNew ? 'balance' : null });
  for (const p of state.powers) for (const type of STARTING_FLEET) makeShip(state, p.faction, type, p.capital);
  // Each yard's designs for the hulls every power can build from the start (M4_FLEETS.md §21.3).
  for (const p of state.powers) refreshYards(state, p);
  return state;
}

/**
 * Beacon slots at a system (§3): five where a holding there has a lane station, else three; and two
 * more for each lane relay there (M2B_SCIENCE.md §18.3).
 */
export function beaconSlots(state: GameState, system: SystemId): number {
  const here = state.holdings.filter((h) => h.system === system);
  const station = here.some((h) => h.projects.includes('lane-station'));
  const relays = here.filter((h) => h.projects.includes('lane-relay')).length;
  // Lane network: a slot more for each power with the doctrine and a colony here (§19.1).
  let network = 0;
  for (const p of state.powers) {
    if (!here.some((h) => h.owner === p.faction && h.kind === 'colony')) continue;
    for (const id of p.researched)
      for (const e of [TECHS[id].effect, ...(TECHS[id].also ?? [])]) if (e.kind === 'colony-slots') network += e.slots;
  }
  return (
    (station ? RULES.beacons.slotsWithStation : RULES.beacons.slots) + relays * RULES.projects.relaySlots + network
  );
}

/** The holding on a body, if any power holds it. */
export function holdingOn(state: GameState, body: string): Holding | undefined {
  return state.holdings.find((h) => h.body === body);
}

export function powerOf(state: GameState, faction: FactionId): PowerState {
  const p = state.powers.find((x) => x.faction === faction);
  if (!p) throw new RangeError(`${faction} is not in play`);
  return p;
}

/** A power's contact with another, if it has heard them (M3_NEIGHBOURS.md §19.1). */
export function contactWith(power: PowerState, other: FactionId): Contact | undefined {
  return power.contacts.find((c) => c.faction === other);
}

/** The treaty of a kind between two powers, if they hold one (M3_NEIGHBOURS.md §21). */
export function treatyOf(state: GameState, x: FactionId, y: FactionId, kind: TreatyKind): Treaty | undefined {
  const [a, b] = x < y ? [x, y] : [y, x];
  return state.treaties.find((t) => t.kind === kind && t.a === a && t.b === b);
}

/** Whether a power is in contact with another: it has heard a signal from them, or more (§19.2). */
export function inContact(power: PowerState, other: FactionId): boolean {
  return other !== power.faction && power.contacts.some((c) => c.faction === other);
}

/** The power the player controls, if there is one. */
export function playerPower(state: GameState): PowerState | undefined {
  return state.powers.find((p) => p.controller === 'player');
}

export function hasSurveyed(power: PowerState, system: SystemId): boolean {
  return power.surveyed.includes(system);
}

/** Records a survey, keeping the list in id order. */
export function markSurveyed(power: PowerState, system: SystemId): boolean {
  if (power.surveyed.includes(system)) return false;
  power.surveyed.push(system);
  power.surveyed.sort();
  return true;
}
