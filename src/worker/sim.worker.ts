// The simulation's worker (§11): ends turns off the main thread, so the screens never stutter.
// It rebuilds the world from the dataset once, then answers each request with the next state.

import { SKY } from '../data/sky.ts';
import type { GameState } from '../sim/state.ts';
import { resolveTurn, type TurnResult } from '../sim/turn.ts';
import { buildWorld } from '../sim/world.ts';

export type WorkerRequest = { id: number; kind: 'end-turn'; state: GameState };
export type WorkerReply = { id: number; ok: true; result: TurnResult } | { id: number; ok: false; error: string };

const world = buildWorld(SKY);
const scope = self as unknown as {
  onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(reply: WorkerReply): void;
};

scope.onmessage = (e) => {
  const { id, state } = e.data;
  try {
    scope.postMessage({ id, ok: true, result: resolveTurn(world, state) });
  } catch (err) {
    scope.postMessage({ id, ok: false, error: (err as Error).message });
  }
};
