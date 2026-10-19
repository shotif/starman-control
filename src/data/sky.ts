// The real sky, copied from Starman Reborn (src/data/sky.json, made by `npm run data:import`).

import skyFile from './sky.json' with { type: 'json' };
import type { SkyDataset } from './types.ts';

export const SKY = skyFile as unknown as SkyDataset;
