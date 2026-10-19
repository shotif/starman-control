// What a turn tells each power (M1_TURNS.md §5): what happened, as plain data the interface words.

import type { SystemId } from '../data/types.ts';

export type ReportEvent =
  /** A survey ship surveyed a system: how many worlds, and which are tolerable or better for the power's species. */
  | { kind: 'surveyed'; ship: number; system: SystemId; worlds: number; habitable: string[] }
  /** A ship reached the last of its destinations. */
  | { kind: 'arrived'; ship: number; system: SystemId }
  /** A survey ship began a blind jump. */
  | { kind: 'jumped'; ship: number; from: SystemId; to: SystemId; turns: number }
  /** A survey ship came out of a blind jump. */
  | { kind: 'landed'; ship: number; system: SystemId }
  /** A ship could not go on: no open lane leads to its destination any more. */
  | { kind: 'blocked'; ship: number; system: SystemId; to: SystemId };
