// The title (§10): New game, Continue, and the neighbourhood to explore before playing.

import { useEffect, useState } from 'preact/hooks';
import { hasSavedGame } from '../app/hasSave.ts';

export function Title({ buildId }: { buildId: string }) {
  const [canContinue, setCanContinue] = useState(false);
  useEffect(() => {
    let live = true;
    void hasSavedGame().then((yes) => {
      if (live) setCanContinue(yes);
    });
    return () => {
      live = false;
    };
  }, []);
  return (
    <main class="title">
      <h1>
        Starman <span>Control</span>
      </h1>
      <p class="tagline">
        A 4X strategy game of exploration, colonies and first contact among real nearby stars, in the{' '}
        <a href="https://shotif.github.io/starman-reborn/">Starman Reborn</a> universe.
      </p>
      <nav class="title-menu" aria-label="Start">
        {canContinue && (
          <a class="button button-primary" href="#/game">
            Continue
          </a>
        )}
        <a class={`button${canContinue ? '' : ' button-primary'}`} href="#/new">
          New game
        </a>
        <a class="button button-quiet" href="#/map">
          Explore the neighbourhood
        </a>
        <a class="button button-quiet" href="#/codex">
          Codex
        </a>
      </nav>
      <p class="status">In development: milestone M1, First light. The first turns are playable.</p>
      <p class="build">
        Build {buildId} · <a href="https://github.com/shotif/starman-control/tree/main/docs">Design documents</a>
      </p>
    </main>
  );
}
