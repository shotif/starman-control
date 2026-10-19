// The neighbourhood as the screens show it before there is a game (M1 increments 1 to 3): the
// world, and a start with every power in play, so all three home webs are lit.

import { world } from '../app/world.ts';
import { FACTION_IDS } from '../content/factions.ts';
import { newGame } from '../sim/state.ts';

export { world };

export const previewGame = newGame(world, {
  seed: 1,
  powers: FACTION_IDS.map((faction) => ({ faction, controller: 'ai' as const })),
});
