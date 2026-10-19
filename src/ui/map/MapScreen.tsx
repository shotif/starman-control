// The map screen (§10), the home of the game. Both layouts are designed together (D-04):
//
// Phone: the map fills the screen, flat by default; a top bar and a bottom bar within thumb reach;
// tapping a star opens its system as a bottom sheet; search and the legend are sheets too.
// Desktop: 3D by default; a top bar, an outliner on the left, the inspector on the right; hover
// cards, double-click to centre, and a shortcut for every action (listed under ?).
//
// The map element stays the same whichever layout is showing, so a tablet that switches layout
// when a mouse is used keeps its view.

import { signal } from '@preact/signals';
import { Fragment } from 'preact';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { FACTION_IDS, FACTIONS } from '../../content/factions.ts';
import type { SystemId } from '../../data/types.ts';
import type { MapView, ViewMode } from '../../render/MapView.ts';
import type { Rect } from '../../render/mapMath.ts';
import { mapContent } from '../../render/mapModel.ts';
import { formatDate } from '../../sim/calendar.ts';
import { formatLy } from '../../sim/geometry.ts';
import { starKindWord } from '../../sim/stars.ts';
import type { GameState } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';
import { layout, sideSheets } from '../layout.ts';
import { Badge, FactionMark } from '../parts.tsx';
import { Sheet } from '../Sheet.tsx';
import { searchSystems } from '../search.ts';
import { SystemPanel } from '../system/SystemPanel.tsx';
import '../sheet.css';
import './map.css';

interface Props {
  world: World;
  game: GameState;
  buildId: string;
}

const selected = signal<SystemId | null>(null);
const mode = signal<ViewMode | null>(null);
const panel = signal<'search' | 'legend' | 'keys' | null>(null);
const hover = signal<{ id: SystemId; x: number; y: number } | null>(null);
const query = signal('');
const failed = signal<string | null>(null);

/** Keys for the desktop (§10: a shortcut for every action, listed under ?). */
export const SHORTCUTS: readonly [string, string][] = [
  ['Arrows or W A S D', 'Move the map'],
  ['Q and E', 'Turn the map (3D)'],
  ['+ and −', 'Zoom in and out'],
  ['F', 'Flat or 3D view'],
  ['H', 'Back to Sol'],
  ['0', 'The whole neighbourhood'],
  ['/', 'Find a system'],
  ['C', 'Centre the selected system'],
  ['Esc', 'Close, or clear the selection'],
  ['?', 'These keys'],
];

export function MapScreen({ world, game, buildId }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const view = useRef<MapView | null>(null);
  const sheetHeight = useRef(0);
  const bar = useRef<HTMLElement>(null);
  const top = useRef<HTMLElement>(null);
  const [barHeight, setBarHeight] = useState(0);
  const [topHeight, setTopHeight] = useState(56);
  const desktop = layout.value === 'desktop';

  const select = useCallback((id: SystemId | null) => {
    selected.value = id;
    view.current?.setSelected(id);
    if (id && panel.value === 'search') panel.value = null;
  }, []);
  const go = useCallback(
    (id: SystemId) => {
      select(id);
      view.current?.focus(id);
    },
    [select],
  );

  // The map itself, made once.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    import('../../render/MapView.ts')
      .then(({ MapView }) => {
        if (disposed) return;
        try {
          const initial = mode.value ?? (layout.value === 'desktop' ? '3d' : 'flat');
          mode.value = initial;
          const v = new MapView(
            el,
            mapContent(world, game),
            {
              select: (id) => select(id),
              hover: (id, x, y) => {
                hover.value = id ? { id, x, y } : null;
              },
              activate: (id) => go(id),
            },
            initial,
          );
          view.current = v;
          v.setSelected(selected.value);
          if (new URLSearchParams(location.search).has('test')) (window as unknown as { __map: MapView }).__map = v;
          updateStage();
        } catch (err) {
          failed.value = (err as Error).message || 'WebGL is not available';
        }
      })
      .catch((err: Error) => {
        failed.value = err.message;
      });
    return () => {
      disposed = true;
      view.current?.dispose();
      view.current = null;
    };
  }, [world, game, select, go]);

  /** Tells the map which part of it is not covered by bars, panels and sheets. */
  const updateStage = useCallback(() => {
    const v = view.current;
    const el = host.current;
    if (!v || !el) return;
    const box = el.getBoundingClientRect();
    const rel = (r: DOMRect): Rect => ({ x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height });
    const rects = (selector: string) =>
      [...(root.current?.querySelectorAll<HTMLElement>(selector) ?? [])]
        .map((e) => rel(e.getBoundingClientRect()))
        .filter((r) => r.w > 0 && r.h > 0);
    const covers = rects('[data-covers-map]');
    let top = 0;
    let bottom = box.height;
    let left = 0;
    let right = box.width;
    for (const r of covers) {
      if (r.w >= box.width * 0.6) {
        if (r.y + r.h / 2 < box.height / 2) top = Math.max(top, r.y + r.h);
        else bottom = Math.min(bottom, r.y);
      } else if (r.h >= box.height * 0.5) {
        // A panel down one side (a side sheet).
        if (r.x + r.w / 2 > box.width / 2) right = Math.min(right, r.x);
        else left = Math.max(left, r.x + r.w);
      }
    }
    // The sheet sits on the bottom bar; its height is the one it is settling to, not mid-animation.
    if (sheetHeight.current > 0) {
      bottom -= sheetHeight.current;
      covers.push({ x: 0, y: bottom, w: box.width, h: box.height - bottom });
    }
    v.setStage({ x: left, y: top, w: Math.max(80, right - left), h: Math.max(80, bottom - top) }, [
      ...covers,
      ...rects('[data-keep-clear]'),
    ]);
  }, []);

  useLayoutEffect(() => {
    updateStage();
  });
  useEffect(() => {
    window.addEventListener('resize', updateStage);
    return () => window.removeEventListener('resize', updateStage);
  }, [updateStage]);

  // The sheets sit on the bottom bar, so they need its height.
  useLayoutEffect(() => {
    const el = bar.current;
    if (!el) {
      setBarHeight(0);
      return;
    }
    const measure = () => {
      setBarHeight(Math.round(el.getBoundingClientRect().height));
      if (top.current) setTopHeight(Math.round(top.current.getBoundingClientRect().height));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (top.current) ro.observe(top.current);
    return () => ro.disconnect();
  }, [desktop]);

  const setMode = (m: ViewMode) => {
    mode.value = m;
    view.current?.setMode(m);
  };

  // Keys (desktop, and any keyboard on a tablet).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = view.current;
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const step = 60;
      const k = e.key;
      let handled = true;
      if (k === 'ArrowLeft' || k === 'a') v?.panBy(step, 0);
      else if (k === 'ArrowRight' || k === 'd') v?.panBy(-step, 0);
      else if (k === 'ArrowUp' || k === 'w') v?.panBy(0, step);
      else if (k === 'ArrowDown' || k === 's') v?.panBy(0, -step);
      else if (k === 'q') v?.rotateBy(0.14, 0);
      else if (k === 'e') v?.rotateBy(-0.14, 0);
      else if (k === '+' || k === '=') v?.zoomBy(0.8);
      else if (k === '-' || k === '_') v?.zoomBy(1.25);
      else if (k === 'f') setMode(mode.value === 'flat' ? '3d' : 'flat');
      else if (k === 'h') go('sol');
      else if (k === '0') v?.showAll();
      else if (k === 'c' && selected.value) v?.focus(selected.value);
      else if (k === '/') {
        panel.value = 'search';
        requestAnimationFrame(() => document.querySelector<HTMLInputElement>('#map-search')?.focus());
      } else if (k === '?') panel.value = panel.value === 'keys' ? null : 'keys';
      else if (k === 'Escape') {
        if (panel.value) panel.value = null;
        else select(null);
      } else handled = false;
      if (handled) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, select]);

  const onSheetHeight = useCallback(
    (px: number) => {
      sheetHeight.current = px;
      updateStage();
    },
    [updateStage],
  );

  const current = selected.value;
  const date = formatDate(game.turn);
  const modeNow = mode.value ?? (desktop ? '3d' : 'flat');

  return (
    <div ref={root} class={`map-screen layout-${layout.value}`}>
      <div ref={host} class="map-host" data-testid="map">
        {failed.value && (
          <div class="map-failed">
            <p>This browser cannot draw the map ({failed.value}).</p>
            <p>
              <a href="#/data">Open the systems as a list</a> instead.
            </p>
          </div>
        )}
        {desktop && hover.value && hover.value.id !== current && <HoverCard world={world} at={hover.value} />}
        {desktop && (
          <p class="map-credit" data-keep-clear>
            Stars: Gaia DR3 and SIMBAD, as copied from Starman Reborn · Lanes and powers: fiction · Build {buildId}
          </p>
        )}
      </div>

      <header ref={top} class="map-top" data-covers-map>
        <a class="brand" href="#/" aria-label="Starman Control: back to the title">
          Starman <span>Control</span>
        </a>
        <span class="map-date" title="A turn is three months">
          {date}
        </span>
        {desktop ? (
          <>
            <SearchBox world={world} onPick={go} />
            <ViewToggle mode={modeNow} onChange={setMode} />
            <button
              type="button"
              class="chip"
              onClick={() => (panel.value = panel.value === 'legend' ? null : 'legend')}
            >
              Legend
            </button>
            <button
              type="button"
              class="chip"
              aria-label="Keyboard shortcuts"
              onClick={() => (panel.value = panel.value === 'keys' ? null : 'keys')}
            >
              ?
            </button>
          </>
        ) : (
          <a class="chip" href="#/">
            Menu
          </a>
        )}
      </header>

      {desktop && <Outliner world={world} game={game} onGo={go} />}

      {desktop && (
        <aside class="map-inspector" aria-label="Selected system">
          {current ? (
            <SystemPanel
              world={world}
              game={game}
              id={current}
              onGo={go}
              onCentre={() => view.current?.focus(current)}
            />
          ) : (
            <div class="inspector-hint">
              <h2>The neighbourhood</h2>
              <p>
                {world.systems.length} real star systems within 27 light-years of the Sun, and the old lanes between
                them. Click a star to see what astronomers know of it; double-click to centre it.
              </p>
              <p class="dim">
                Drag to turn the map, Shift-drag or the right button to move it, the wheel to zoom. Press ? for every
                key.
              </p>
            </div>
          )}
        </aside>
      )}

      {desktop && panel.value === 'legend' && (
        <div class="popover legend-popover" role="dialog" aria-label="Legend">
          <Legend />
        </div>
      )}
      {panel.value === 'keys' && (
        <div class="popover keys-popover" role="dialog" aria-label="Keyboard shortcuts">
          <h2>Keys</h2>
          <dl class="keys">
            {SHORTCUTS.map(([key, what]) => (
              <Fragment key={key}>
                <dt>{key}</dt>
                <dd>{what}</dd>
              </Fragment>
            ))}
          </dl>
        </div>
      )}

      {!desktop && (
        <nav ref={bar} class="map-bottom" aria-label="Map" data-covers-map>
          <button
            type="button"
            class="bar-button"
            onClick={() => (panel.value = panel.value === 'search' ? null : 'search')}
          >
            Find
          </button>
          <ViewToggle mode={modeNow} onChange={setMode} />
          <button type="button" class="bar-button" onClick={() => go('sol')}>
            Sol
          </button>
          <button
            type="button"
            class="bar-button"
            onClick={() => (panel.value = panel.value === 'legend' ? null : 'legend')}
          >
            Legend
          </button>
        </nav>
      )}

      {!desktop && panel.value === 'search' && (
        <div class="search-panel" data-covers-map>
          <SearchBox world={world} onPick={go} autoFocus />
        </div>
      )}

      {!desktop && current && (
        <Sheet
          key={current}
          label={world.system(current).name}
          onClose={() => select(null)}
          onHeight={onSheetHeight}
          bottomInset={barHeight}
          topInset={topHeight}
          side={sideSheets.value}
        >
          <SystemPanel world={world} game={game} id={current} onGo={go} onCentre={() => view.current?.focus(current)} />
        </Sheet>
      )}
      {!desktop && !current && panel.value === 'legend' && (
        <Sheet
          label="Legend"
          onClose={() => (panel.value = null)}
          onHeight={onSheetHeight}
          bottomInset={barHeight}
          topInset={topHeight}
          side={sideSheets.value}
        >
          <Legend />
        </Sheet>
      )}
    </div>
  );
}

function ViewToggle({ mode: m, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <fieldset class="view-toggle">
      <legend class="visually-hidden">View</legend>
      <button type="button" class="toggle-option" aria-pressed={m === 'flat'} onClick={() => onChange('flat')}>
        Flat
      </button>
      <button type="button" class="toggle-option" aria-pressed={m === '3d'} onClick={() => onChange('3d')}>
        3D
      </button>
    </fieldset>
  );
}

function SearchBox({
  world,
  onPick,
  autoFocus,
}: {
  world: World;
  onPick: (id: SystemId) => void;
  autoFocus?: boolean;
}) {
  const results = searchSystems(world, query.value);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);
  const pick = (id: SystemId) => {
    onPick(id);
    query.value = '';
    input.current?.blur();
  };
  return (
    <div class="search-box">
      <label>
        <span class="visually-hidden">Find a system</span>
        <input
          ref={input}
          id="map-search"
          type="search"
          autoComplete="off"
          placeholder="Find a system"
          value={query.value}
          onInput={(e) => {
            query.value = (e.target as HTMLInputElement).value;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) pick(results[0]);
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              document.querySelector<HTMLButtonElement>('.search-results .result')?.focus();
            }
          }}
        />
      </label>
      {results.length > 0 && (
        <ul class="search-results">
          {results.map((id) => {
            const s = world.system(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  class="result"
                  onClick={() => pick(id)}
                  onKeyDown={(e) => {
                    const li = (e.currentTarget as HTMLElement).parentElement;
                    if (e.key === 'ArrowDown')
                      (li?.nextElementSibling?.querySelector('.result') as HTMLElement)?.focus();
                    if (e.key === 'ArrowUp')
                      ((li?.previousElementSibling?.querySelector('.result') as HTMLElement) ?? input.current)?.focus();
                  }}
                >
                  <b>{s.name}</b>
                  <span>
                    {formatLy(s.fromSolDeci)} · {starKindWord(s.sky.stars[0]?.spectralType ?? '')}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {query.value.trim() !== '' && results.length === 0 && <p class="search-none">No system by that name.</p>}
    </div>
  );
}

function Outliner({ world, game, onGo }: { world: World; game: GameState; onGo: (id: SystemId) => void }) {
  return (
    <aside class="outliner" aria-label="The powers">
      <h2>The powers</h2>
      {FACTION_IDS.filter((f) => game.powers.some((p) => p.faction === f)).map((f) => {
        const lanes = game.lanes.filter((l) => l.owner === f);
        const capital = FACTIONS[f].capital.systemId;
        const systems = [capital, ...new Set(lanes.flatMap((l) => l.id.split('~')).filter((s) => s !== capital))];
        return (
          <section key={f} class="outliner-power" style={{ '--faction': FACTIONS[f].colour }}>
            <h3>
              <FactionMark faction={f} size={13} /> {FACTIONS[f].name}
            </h3>
            <ul>
              {systems.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    class={`outliner-item${selected.value === id ? ' is-selected' : ''}`}
                    onClick={() => onGo(id)}
                  >
                    {world.system(id).name}
                    {id === capital && <span class="capital"> capital</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <p class="dim">
        Each power’s home web: the lanes it kept tending through the Lapse <Badge kind="fiction" />
      </p>
    </aside>
  );
}

function HoverCard({ world, at }: { world: World; at: { id: SystemId; x: number; y: number } }) {
  const s = world.system(at.id);
  const lanes = world.catalogueAt(at.id).length;
  return (
    <div class="hover-card" style={{ transform: `translate(${Math.round(at.x + 16)}px, ${Math.round(at.y + 12)}px)` }}>
      <b>{s.name}</b>
      <span>
        {s.id === 'sol' ? 'The Sun' : formatLy(s.fromSolDeci)} ·{' '}
        {s.sky.stars.length > 1 ? `${s.sky.stars.length} stars` : starKindWord(s.sky.stars[0]?.spectralType ?? '')}
      </span>
      <span>
        {s.sky.planets.length > 0 ? `${s.sky.planets.length} known planets` : 'No known planets'} · {lanes} old lane
        {lanes === 1 ? '' : 's'}
      </span>
    </div>
  );
}

export function Legend() {
  return (
    <div class="legend">
      <h2>Legend</h2>
      <ul>
        <li>
          <span class="legend-line legend-open" aria-hidden="true" /> An open lane, in the colour of the power that
          tends it <Badge kind="fiction" />
        </li>
        <li>
          <span class="legend-line legend-dark" aria-hidden="true" /> A dark lane: one of the old lanes, out of tune
          since the Lapse, that can be relit <Badge kind="fiction" />
        </li>
        {FACTION_IDS.map((f) => (
          <li key={f}>
            <FactionMark faction={f} size={14} /> {FACTIONS[f].name}: its {FACTIONS[f].mark} marks the systems it holds;
            a larger one its capital
          </li>
        ))}
        <li>
          <span class="legend-star" aria-hidden="true" /> A star, where astronomers measure it, coloured by its kind
          (red dwarfs red, the Sun yellow-white) <Badge kind="observed" />
        </li>
        <li>
          <span class="legend-ring" aria-hidden="true" /> Rings every 5 light-years from Sol, in the plane of the
          celestial equator; in 3D, a faint line drops from each star to that plane
        </li>
      </ul>
    </div>
  );
}
