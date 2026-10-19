// The map's route: the neighbourhood with every power's home web lit (before there is a game).

import { previewGame, world } from '../preview.ts';
import { MapScreen } from './MapScreen.tsx';

export default function MapRoute({ buildId }: { buildId: string }) {
  return <MapScreen world={world} game={previewGame} buildId={buildId} />;
}
