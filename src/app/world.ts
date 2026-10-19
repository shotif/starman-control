// The one world the screens share: the real sky and the lane catalogue, built once.

import { SKY } from '../data/sky.ts';
import { buildWorld } from '../sim/world.ts';

export const world = buildWorld(SKY);
