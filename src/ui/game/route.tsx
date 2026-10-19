// The game's route: the map screen with a game in it. Opened from New game, or Continue, which
// loads the saved game; with no game to show it goes to New game.

import { useEffect, useState } from 'preact/hooks';
import {
  continueGame,
  endTheTurn,
  game,
  giveOrder,
  leaveGame,
  needs,
  player,
  resolving,
  world,
} from '../../app/game.ts';
import { MapScreen } from '../map/MapScreen.tsx';
import { resetMapState } from '../map/state.ts';

export default function GameRoute({ buildId }: { buildId: string }) {
  const [checked, setChecked] = useState(game.value !== null);
  useEffect(() => {
    resetMapState();
    if (game.value) return;
    void continueGame().then((ok) => {
      if (!ok) location.hash = '#/new';
      else setChecked(true);
    });
  }, []);
  const g = game.value;
  const p = player.value;
  if (!checked || !g || !p) return <p class="loading">Loading the game…</p>;
  return (
    <MapScreen
      world={world}
      game={g}
      buildId={buildId}
      play={{
        faction: p.faction,
        order: giveOrder,
        endTurn: endTheTurn,
        leave: async () => {
          await leaveGame();
          location.hash = '#/';
        },
        resolving: resolving.value,
        needs: needs.value,
      }}
    />
  );
}
