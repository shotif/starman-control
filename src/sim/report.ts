// What a turn tells each power (M1_TURNS.md §5, M1_COLONIES.md §4): what happened, as plain data the
// interface words.

import type { AnomalyId } from '../content/anomalies.ts';
import type { Zone } from '../content/districts.ts';
import type { EdictId } from '../content/edicts.ts';
import type { EventId } from '../content/events.ts';
import type { FactionId } from '../content/factions.ts';
import type { BuildItem, ProjectId } from '../content/projects.ts';
import type { HullId, ShipType } from '../content/ships.ts';
import type { TechId } from '../content/techs.ts';
import type { TreatyKind } from '../content/treaties.ts';
import type { SystemId } from '../data/types.ts';
import type { ObservationKind } from './discoveries.ts';
import type { Amount } from './state.ts';
import type { LaneId } from './world.ts';

export type ReportEvent =
  /**
   * A system surveyed, by a survey ship or a survey station: how many worlds, and which are
   * tolerable or better for the power's species.
   */
  | {
      kind: 'surveyed';
      ship?: number;
      station?: number;
      system: SystemId;
      worlds: number;
      habitable: string[];
      /** An anomaly found there. */
      anomaly?: AnomalyId;
    }
  /** A survey ship finished investigating an anomaly; its reward has been given. */
  | { kind: 'investigated'; ship: number; system: SystemId; anomaly: AnomalyId }
  /** A ship reached the last of its destinations. */
  | { kind: 'arrived'; ship: number; system: SystemId }
  /** A survey ship began a blind jump. */
  | { kind: 'jumped'; ship: number; from: SystemId; to: SystemId; turns: number }
  /** A survey ship came out of a blind jump. */
  | { kind: 'landed'; ship: number; system: SystemId }
  /** A ship could not go on: no open lane leads to its destination any more. */
  | { kind: 'blocked'; ship: number; system: SystemId; to: SystemId }
  /** A colony or outpost founded; the ship that founded it is used up. */
  | { kind: 'founded'; holding: number; shipName: string; system: SystemId; body: string }
  /** A ship could not found where it was told to. */
  | { kind: 'not-founded'; ship: number; system: SystemId; body: string; reason: string }
  /** A colony finished an item of its queue (a new ship's id, if it was a ship). */
  | { kind: 'built'; holding: number; item: BuildItem; ship?: number }
  /** A lane paid for: its beacons are tuned for so many turns. */
  | { kind: 'lane-begun'; holding: number; to: SystemId; relight: boolean; turns: number }
  /** A lane tuned and open. */
  | { kind: 'lane-opened'; lane: LaneId }
  /** A technology researched. */
  | { kind: 'researched'; tech: TechId }
  /** A deed that taught the power something: points towards a technology (M2B_SCIENCE.md §17.1). */
  | { kind: 'inspired'; tech: TechId; points: number }
  /** A colony's terraforming station has made its world a step more habitable (M2B_SCIENCE.md §18.3). */
  | { kind: 'terraformed'; holding: number; level: 'tolerable' | 'comfortable' }
  /** An outpost's orbital habitat is finished: it is a colony now (§18.3). */
  | { kind: 'habitat-colony'; holding: number }
  /** A first survey that found what astronomers have observed, and the research it gave (§17.2). */
  | { kind: 'observed'; system: SystemId; found: ObservationKind[]; points: number }
  /** A queued lane that could not be begun when it was paid for, and why. */
  | { kind: 'lane-refused'; holding: number; to: SystemId; reason: string }
  /** A colony has grown to fill its room. */
  | { kind: 'full'; holding: number }
  /** A district zoned, or rezoned, when its industry was in (M2_WORLDS.md §2). */
  | { kind: 'zoned'; holding: number; zone: Zone; slot: number; rezoned: boolean }
  /** A colony's network went hungry this turn (M2_WORLDS.md §3). */
  | { kind: 'hungry'; holding: number }
  /** The treasury could not pay a colony's overdrive, which stopped (M2_WORLDS.md §4). */
  | { kind: 'overdrive-stopped'; holding: number }
  /** The treasury fell into debt (M2_WORLDS.md §4). */
  | { kind: 'debt' }
  /**
   * What a governor did, and why (M2_WORLDS.md §25.1): zoned or rezoned a district, put one first to
   * be worked, or queued a project; for food it says how short the network is; `lab` is the lab every
   * governor keeps (D-44).
   */
  | {
      kind: 'governed';
      holding: number;
      did: 'zone' | 'work' | 'queue';
      zone?: Zone;
      slot?: number;
      project?: ProjectId;
      reason: 'food' | 'full' | 'priority' | 'calm' | 'lab';
      short?: number;
    }
  /** An edict ran its course (M2_WORLDS.md §25.2). */
  | { kind: 'edict-ended'; edict: EdictId; holding: number | null }
  /** The Watch (M2_WORLDS.md §26.3): another power founded a colony or outpost where the power can see it. */
  | { kind: 'rival-founded'; faction: FactionId; holding: number; system: SystemId; body: string; colony: boolean }
  /**
   * Contact (M3_NEIGHBOURS.md §19.1): first contact with another power, seen at `system`, at words or
   * at once at talk; or, `first` false, talk reached after words.
   */
  | { kind: 'contact'; faction: FactionId; stage: 'words' | 'talk'; first: boolean; system: SystemId | null }
  /** A gift arrived (M3_NEIGHBOURS.md §20.2): the one this power sent to `faction`, or one `faction` sent it. */
  | { kind: 'gift-sent'; faction: FactionId; credits: number }
  | { kind: 'gift-received'; faction: FactionId; credits: number }
  /** Treaties (M3_NEIGHBOURS.md §21): an offer waiting for this power's answer, or its own answered or misread. */
  | { kind: 'offer-received'; faction: FactionId; treaty: TreatyKind }
  | { kind: 'offer-answered'; faction: FactionId; treaty: TreatyKind; accepted: boolean }
  | { kind: 'offer-misread'; faction: FactionId; treaty: TreatyKind; ours: boolean }
  /** A treaty agreed with `faction`; notice given by `by`, ending on turn `ends`; ended, or broken by `by`. */
  | { kind: 'treaty-begun'; faction: FactionId; treaty: TreatyKind }
  | { kind: 'treaty-notice'; faction: FactionId; treaty: TreatyKind; by: FactionId; ends: number }
  | { kind: 'treaty-ended'; faction: FactionId; treaty: TreatyKind; by: FactionId; broken: boolean }
  /** `faction` broke a treaty with `victim`, as heard by a power in contact with it. */
  | { kind: 'treaty-broken-heard'; faction: FactionId; victim: FactionId; treaty: TreatyKind }
  /** Passage or protection lost because its buyer (this power if `ours`) could not pay (M3_NEIGHBOURS.md §23.2). */
  | { kind: 'treaty-lapsed'; faction: FactionId; treaty: TreatyKind; ours: boolean }
  /**
   * Exchanges (§23.1): one waiting for this power's answer (`faction` gives `give` for `get`); one
   * made (this power gave `gave` and got `got`); one fallen through because a side no longer had
   * its part; this power's refused.
   */
  | { kind: 'exchange-received'; faction: FactionId; give: Amount; get: Amount }
  | { kind: 'exchange-made'; faction: FactionId; gave: Amount; got: Amount }
  | { kind: 'exchange-failed'; faction: FactionId }
  | { kind: 'exchange-refused'; faction: FactionId }
  /** The Watch hears that a rival in contact has mastered a technology of tier 4 or 5, or a doctrine (M2B_SCIENCE.md §19.3). */
  | { kind: 'rival-tech'; faction: FactionId; tech: TechId }
  /** A great work finished by another power (all hear of it, M2B_SCIENCE.md §20.2). */
  | { kind: 'great-work'; faction: FactionId; project: ProjectId; holding: number; system: SystemId }
  /** The Watch sees a rival begin a great work at a colony the power can see. */
  | { kind: 'great-work-begun'; faction: FactionId; project: ProjectId; holding: number; system: SystemId }
  /** A great work this colony was building was finished by another power first; it keeps half its industry if it was building it. */
  | { kind: 'great-work-lost'; holding: number; project: ProjectId; faction: FactionId; kept: number }
  /** Another power opened a lane the power can see. */
  | { kind: 'rival-lane'; faction: FactionId; lane: LaneId }
  /** Another power's ship came into the power's sight. */
  | { kind: 'rival-ship'; faction: FactionId; ship: number; type: ShipType; system: SystemId }
  /** An event came, and waits for an answer (M2_WORLDS.md §27); its subject, as the event has it. */
  | ({ kind: 'event'; event: EventId } & EventSubjectFields)
  /** An event answered as the turn ended: by the choice given, or by its first when it went unanswered. */
  | ({ kind: 'event-answered'; event: EventId; choice: 0 | 1; auto: boolean } & EventSubjectFields)
  /** An event put away: what it was about has gone. */
  | ({ kind: 'event-gone'; event: EventId } & EventSubjectFields)
  /** A survey ship's crew went over to another power, ship and all. */
  | { kind: 'defected'; ship: string; to: FactionId; system: SystemId }
  /** The yard made a new design from the best the power knows (M4_FLEETS.md §21.3); its old one is retired. */
  | { kind: 'design-new'; design: number; hull: HullId; name: string; old: string | null }
  /** A warship refitted to another design (§21.4), or a refit dropped because the ship had left. */
  | { kind: 'refitted'; holding: number; ship: number; design: number }
  | { kind: 'refit-dropped'; holding: number; ship: number; reason: string };

/** What an event is about, as a report line keeps it. */
export interface EventSubjectFields {
  holding: number | null;
  system: SystemId | null;
  lane: LaneId | null;
  ship: number | null;
}
