// What a turn tells each power (M1_TURNS.md §5, M1_COLONIES.md §4): what happened, as plain data the
// interface words.

import type { QueueItem } from '../content/projects.ts';
import type { SystemId } from '../data/types.ts';

export type ReportEvent =
  /**
   * A system surveyed, by a survey ship or a survey station: how many worlds, and which are
   * tolerable or better for the power's species.
   */
  | { kind: 'surveyed'; ship?: number; station?: number; system: SystemId; worlds: number; habitable: string[] }
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
  | { kind: 'built'; holding: number; item: QueueItem; ship?: number }
  /** A colony has grown to fill its room. */
  | { kind: 'full'; holding: number };
