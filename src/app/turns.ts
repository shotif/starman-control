// Ends turns in the simulation's worker, or on the page where workers are not available. Both run
// the same pure function, so the result is the same either way.

import type { GameState } from '../sim/state.ts';
import { resolveTurn, type TurnResult } from '../sim/turn.ts';
import type { World } from '../sim/world.ts';
import type { WorkerReply, WorkerRequest } from '../worker/sim.worker.ts';

let worker: Worker | null | undefined;
let nextId = 1;
const waiting = new Map<number, { resolve: (r: TurnResult) => void; reject: (e: Error) => void }>();

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL('../worker/sim.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<WorkerReply>) => {
      const w = waiting.get(e.data.id);
      if (!w) return;
      waiting.delete(e.data.id);
      if (e.data.ok) w.resolve(e.data.result);
      else w.reject(new Error(e.data.error));
    };
    worker.onerror = () => {
      // A worker that cannot start: finish what is waiting on the page instead, and stop using it.
      worker = null;
    };
  } catch {
    worker = null;
  }
  return worker;
}

export function endTurn(world: World, state: GameState): Promise<TurnResult> {
  const w = getWorker();
  if (!w) return Promise.resolve(resolveTurn(world, state));
  const id = nextId++;
  return new Promise<TurnResult>((resolve, reject) => {
    const timer = setTimeout(() => {
      // No answer in time (the worker failed to load): work it out here.
      if (!waiting.delete(id)) return;
      worker = null;
      resolve(resolveTurn(world, state));
    }, 5000);
    waiting.set(id, {
      resolve: (r) => {
        clearTimeout(timer);
        resolve(r);
      },
      reject: (e) => {
        clearTimeout(timer);
        reject(e);
      },
    });
    w.postMessage({ id, kind: 'end-turn', state } satisfies WorkerRequest);
  });
}
