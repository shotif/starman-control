// The data preview's route.

import { previewGame, world } from '../preview.ts';
import { DataPage } from './DataPage.tsx';

export default function DataRoute({ buildId }: { buildId: string }) {
  return <DataPage world={world} game={previewGame} buildId={buildId} />;
}
