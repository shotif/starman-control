// The trailer's staged games (docs/design/TRAILER.md §10.2): which, and where their states are kept.

import { resolve } from 'node:path';
import type { FactionId } from '../src/content/factions.ts';

export const STATES = resolve(import.meta.dirname, 'out/states');
/** How far each game is played. */
export const LAST = 250;
/** The games the shot list films: a power and a seed each. */
export const GAMES: readonly { faction: FactionId; seed: number }[] = [
  { faction: 'sta', seed: 42 },
  { faction: 'sta', seed: 7 },
  { faction: 'frontier', seed: 42 },
  { faction: 'hollow-wake', seed: 42 },
  { faction: 'hollow-wake', seed: 7 },
  { faction: 'dusk-concord', seed: 42 },
];
export const stateDir = (faction: FactionId, seed: number) => resolve(STATES, `${faction}${seed}`);
