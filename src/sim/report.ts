// What a turn tells each power (M1_TURNS.md §5, M1_COLONIES.md §4): what happened, as plain data the
// interface words.

import type { AnomalyId } from '../content/anomalies.ts';
import type { Zone } from '../content/districts.ts';
import type { EdictId } from '../content/edicts.ts';
import type { BuildItem, ProjectId } from '../content/projects.ts';
import type { TechId } from '../content/techs.ts';
import type { SystemId } from '../data/types.ts';
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
   * be worked, or queued a project; for food it says how short the network is.
   */
  | {
      kind: 'governed';
      holding: number;
      did: 'zone' | 'work' | 'queue';
      zone?: Zone;
      slot?: number;
      project?: ProjectId;
      reason: 'food' | 'full' | 'priority' | 'calm';
      short?: number;
    }
  /** An edict ran its course (M2_WORLDS.md §25.2). */
  | { kind: 'edict-ended'; edict: EdictId; holding: number | null };
