// What a turn tells each power (M1_TURNS.md §5, M1_COLONIES.md §4): what happened, as plain data the
// interface words.

import type { AnomalyId } from '../content/anomalies.ts';
import type { Zone } from '../content/districts.ts';
import type { EdictId } from '../content/edicts.ts';
import type { EventId } from '../content/events.ts';
import type { FactionId } from '../content/factions.ts';
import type { BuildItem, ProjectId } from '../content/projects.ts';
import type { ShipType } from '../content/ships.ts';
import type { TechId } from '../content/techs.ts';
import type { SystemId } from '../data/types.ts';
import type { ObservationKind } from './discoveries.ts';
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
  | { kind: 'defected'; ship: string; to: FactionId; system: SystemId };

/** What an event is about, as a report line keeps it. */
export interface EventSubjectFields {
  holding: number | null;
  system: SystemId | null;
  lane: LaneId | null;
  ship: number | null;
}
