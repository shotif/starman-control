// Placeholder title until the first playable build (docs/design/M1_FIRST_LIGHT.md §12, increment 4).

export function Title({ buildId }: { buildId: string }) {
  return (
    <main class="title">
      <h1>
        Starman <span>Control</span>
      </h1>
      <p class="tagline">
        A 4X strategy game of exploration, colonies and first contact among real nearby stars, in the{' '}
        <a href="https://shotif.github.io/starman-reborn/">Starman Reborn</a> universe.
      </p>
      <p class="status">In development: milestone M1, First light</p>
      <p class="preview">
        <a class="button" href="#/map">
          Explore the neighbourhood
        </a>
        <span>
          The real stars within 27 light-years, their worlds, and the old lanes between them. Not yet a game. Or read{' '}
          <a href="#/codex">the codex</a>.
        </span>
      </p>
      <p class="build">
        Build {buildId} · <a href="https://github.com/shotif/starman-control/tree/main/docs">Design documents</a>
      </p>
    </main>
  );
}
