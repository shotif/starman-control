import './style.css';

// Placeholder title until the first playable build (docs/SCOPE.md, milestone M1).
const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = `
    <main class="title">
      <h1>Starman <span>Control</span></h1>
      <p class="tagline">A 4X strategy game of exploration, colonies and first contact among real nearby stars,
        in the <a href="https://shotif.github.io/starman-reborn/">Starman Reborn</a> universe.</p>
      <p class="status">In design — first playable build to come</p>
      <p class="build">Build ${__BUILD_ID__} ·
        <a href="https://github.com/shotif/starman-control/tree/main/docs">Design documents</a></p>
    </main>
  `;
}
