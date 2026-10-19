// The neighbourhood as the screens show it before there is a game (M1 increments 1 to 3): the
// world, and a start with every power in play, so all three home webs are lit.

import { FACTION_IDS } from '../content/factions.ts';
import { SKY } from '../data/sky.ts';
import { newGame } from '../sim/state.ts';
import { buildWorld } from '../sim/world.ts';

export const world = buildWorld(SKY);

export const previewGame = newGame(world, {
  seed: 1,
  powers: FACTION_IDS.map((faction) => ({ faction, controller: 'ai' as const })),
});
