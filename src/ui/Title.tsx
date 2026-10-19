// Placeholder title until the first playable build (docs/design/M1_FIRST_LIGHT.md, increment 2).

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
      <p class="status">In design — first playable build to come</p>
      <p class="build">
        Build {buildId} · <a href="https://github.com/shotif/starman-control/tree/main/docs">Design documents</a>
      </p>
    </main>
  );
}
