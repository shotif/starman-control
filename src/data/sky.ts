// The real sky: the census of 27 ly copied from Starman Reborn (src/data/sky.json, made by
// `npm run data:import`), and the shell out to 33 ly beyond it (src/data/shell.json, made by
// `npm run data:shell`, M3_NEIGHBOURS.md §18), the shell's systems after the census's.

import shellFile from './shell.json' with { type: 'json' };
import skyFile from './sky.json' with { type: 'json' };
import type { ShellDataset, SkyDataset } from './types.ts';

const census = skyFile as unknown as SkyDataset;
const { systems: shellSystems, ...shell } = shellFile as unknown as ShellDataset;

export const SKY: SkyDataset = { ...census, systems: [...census.systems, ...shellSystems], shell };
