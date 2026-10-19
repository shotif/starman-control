// The map's route: the neighbourhood with every power's home web lit (before there is a game).

import { useEffect } from 'preact/hooks';
import { previewGame, world } from '../preview.ts';
import { MapScreen } from './MapScreen.tsx';
import { resetMapState } from './state.ts';

export default function MapRoute({ buildId }: { buildId: string }) {
  useEffect(() => resetMapState(), []);
  return <MapScreen world={world} game={previewGame} buildId={buildId} />;
}
