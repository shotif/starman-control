// The data preview's route: builds the world and a start with every power in play, once.

import { FACTION_IDS } from '../../content/factions.ts';
import { SKY } from '../../data/sky.ts';
import { newGame } from '../../sim/state.ts';
import { buildWorld } from '../../sim/world.ts';
import { DataPage } from './DataPage.tsx';

const world = buildWorld(SKY);
const game = newGame(world, {
  seed: 1,
  powers: FACTION_IDS.map((faction) => ({ faction, controller: 'ai' as const })),
});

export default function DataRoute({ buildId }: { buildId: string }) {
  return <DataPage world={world} game={game} buildId={buildId} />;
}
