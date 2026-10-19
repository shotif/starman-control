import { signal } from '@preact/signals';
import { type ComponentType, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { watchLayout } from './ui/layout.ts';
import { Title } from './ui/Title.tsx';
import './style.css';

/** The screen, from the address: "#/map", "#/data" (the data preview), or the title. */
const route = signal(location.hash);
window.addEventListener('hashchange', () => {
  route.value = location.hash;
  window.scrollTo(0, 0);
  document.documentElement.dataset.screen = screenName(location.hash);
});

function screenName(hash: string): string {
  return hash.startsWith('#/map') ? 'map' : hash.startsWith('#/data') ? 'data' : 'title';
}
document.documentElement.dataset.screen = screenName(location.hash);

/** A screen loaded on demand, so the title stays small for a phone's first visit. */
function Lazy({ load }: { load: () => Promise<{ default: ComponentType<{ buildId: string }> }> }) {
  const [Screen, setScreen] = useState<ComponentType<{ buildId: string }> | null>(null);
  useEffect(() => {
    let live = true;
    load().then((m) => {
      if (live) setScreen(() => m.default);
    });
    return () => {
      live = false;
    };
  }, [load]);
  return Screen ? <Screen buildId={__BUILD_ID__} /> : <p class="loading">Loading…</p>;
}

const loadData = () => import('./ui/data/route.tsx');
const loadMap = () => import('./ui/map/route.tsx');

function App() {
  if (route.value.startsWith('#/data')) return <Lazy load={loadData} />;
  if (route.value.startsWith('#/map')) return <Lazy load={loadMap} />;
  return <Title buildId={__BUILD_ID__} />;
}

watchLayout();
const app = document.querySelector<HTMLDivElement>('#app');
if (app) render(<App />, app);
