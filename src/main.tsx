import { signal } from '@preact/signals';
import { type ComponentType, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { applySettings } from './app/settings.ts';
import { watchLayout } from './ui/layout.ts';
import { Title } from './ui/Title.tsx';
import './style.css';

/** The screen, from the address: "#/game", "#/new", "#/map", "#/codex" (once "#/data"), or the title. */
const route = signal(location.hash);
window.addEventListener('hashchange', () => {
  route.value = location.hash;
  window.scrollTo(0, 0);
  document.documentElement.dataset.screen = screenName(location.hash);
});

function screenName(hash: string): string {
  for (const [prefix, name] of [
    ['#/map', 'map'],
    ['#/game', 'game'],
    ['#/new', 'new'],
    ['#/codex', 'codex'],
    ['#/data', 'codex'],
    ['#/saves', 'saves'],
    ['#/settings', 'settings'],
  ])
    if (hash.startsWith(prefix)) return name;
  return 'title';
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
const loadNew = () => import('./ui/newgame/NewGame.tsx');
const loadGame = () => import('./ui/game/route.tsx');
const loadSaves = () => import('./ui/saves/Saves.tsx');
const loadSettings = () => import('./ui/settings/SettingsScreen.tsx');

function App() {
  const r = route.value;
  if (r.startsWith('#/codex') || r.startsWith('#/data')) return <Lazy key="codex" load={loadData} />;
  if (r.startsWith('#/map')) return <Lazy key="map" load={loadMap} />;
  if (r.startsWith('#/new')) return <Lazy key="new" load={loadNew} />;
  if (r.startsWith('#/game')) return <Lazy key="game" load={loadGame} />;
  if (r.startsWith('#/saves')) return <Lazy key="saves" load={loadSaves} />;
  if (r.startsWith('#/settings')) return <Lazy key="settings" load={loadSettings} />;
  return <Title buildId={__BUILD_ID__} />;
}

/**
 * Offline play after one visit (M1_PROOF.md §3), as in Starman Reborn (src/main.ts at ba4ef73,
 * D-10): production builds over HTTPS or on localhost, never in test runs. Once the title is up,
 * the service worker is given the page and every file of the build to keep (public/sw.js).
 */
function keepForOffline(): void {
  if (
    !import.meta.env.PROD ||
    !('serviceWorker' in navigator) ||
    (location.protocol !== 'https:' && location.hostname !== 'localhost') ||
    new URLSearchParams(location.search).has('test')
  )
    return;
  let files: string[] = [];
  try {
    files = JSON.parse(document.getElementById('offline-files')?.textContent ?? '[]') as string[];
  } catch {
    // Without the list the worker still keeps what passes through it.
  }
  const urls = [new URL('./', location.href).href, ...files.map((f) => new URL(f, location.href).href)];
  navigator.serviceWorker
    .register('./sw.js')
    .then(() => navigator.serviceWorker.ready)
    .then((registration) => registration.active?.postMessage({ type: 'keep', urls }))
    .catch(() => {
      // Offline play is a convenience; the game works without it.
    });
}

applySettings();
watchLayout();
const app = document.querySelector<HTMLDivElement>('#app');
if (app) render(<App />, app);
window.addEventListener('load', () => setTimeout(keepForOffline, 1500));
