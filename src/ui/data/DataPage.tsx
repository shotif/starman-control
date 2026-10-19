// The data preview (M1 increment 1): the real systems and the old lanes before there is a map.
// Phone: cards, and a system opens as a bottom sheet. Desktop: a sortable table, and the selected
// system fills an inspector beside it. Both show the same things (D-04).

import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { FACTION_IDS, FACTIONS } from '../../content/factions.ts';
import type { Measured, SkyPlanet, SystemId } from '../../data/types.ts';
import { formatDate } from '../../sim/calendar.ts';
import { formatLy } from '../../sim/geometry.ts';
import type { GameState } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';
import { layout } from '../layout.ts';
import { Badge, FactionMark, FactionTag } from '../parts.tsx';
import { filterRows, type SortKey, type SystemRow, sortRows, systemRows } from './model.ts';
import '../sheet.css';
import './data.css';

interface Props {
  world: World;
  game: GameState;
  buildId: string;
}

const query = signal('');
const websOnly = signal(false);
const sortKey = signal<SortKey>('distance');
const descending = signal(false);
const selected = signal<SystemId | null>(null);
const sheetFull = signal(false);

export function DataPage({ world, game, buildId }: Props) {
  const rows = systemRows(world, game);
  const shown = sortRows(filterRows(rows, query.value, websOnly.value), sortKey.value, descending.value);
  const current = rows.find((r) => r.id === selected.value) ?? null;
  const desktop = layout.value === 'desktop';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inField = e.target instanceof HTMLElement && e.target.closest('input');
      if (e.key === 'Escape') selected.value = null;
      if (e.key === '/' && !inField) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('#data-search')?.focus();
      }
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !inField && desktop) {
        e.preventDefault();
        const at = shown.findIndex((r) => r.id === selected.value);
        const next = shown[Math.max(0, Math.min(shown.length - 1, at + (e.key === 'ArrowDown' ? 1 : -1)))];
        if (next) selected.value = next.id;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const stars = world.systems.reduce((n, s) => n + s.sky.stars.length, 0);
  const planets = world.systems.reduce((n, s) => n + s.sky.planets.length, 0);

  return (
    <div class={`data-page layout-${layout.value}${!desktop && current ? ' has-sheet' : ''}`}>
      <header class="data-header">
        <a class="back" href="#/">
          ← Title
        </a>
        <h1>
          The neighbourhood <span>data preview</span>
        </h1>
        <p class="data-sub">
          Increment 1 of milestone M1: the real sky and the old lanes, before the map. {formatDate(game.turn)}, all
          three powers in play.
        </p>
        <ul class="data-facts" aria-label="What the dataset holds">
          <li>
            <b>{world.systems.length}</b> systems
          </li>
          <li>
            <b>{stars}</b> stars
          </li>
          <li>
            <b>{planets}</b> known planets
          </li>
          <li>
            <b>{world.catalogue.length}</b> old lanes
          </li>
          <li>
            <b>{game.lanes.length}</b> open at the start
          </li>
        </ul>
      </header>

      <section class="webs" aria-label="Home webs at the start">
        {FACTION_IDS.map((f) => (
          <WebCard key={f} faction={f} world={world} game={game} />
        ))}
      </section>

      <div class="data-tools">
        <label class="search">
          <span class="visually-hidden">Find a system</span>
          <input
            id="data-search"
            type="search"
            placeholder={desktop ? 'Find a system  ( / )' : 'Find a system'}
            value={query.value}
            onInput={(e) => {
              query.value = (e.target as HTMLInputElement).value;
            }}
          />
        </label>
        <label class="toggle">
          <input
            type="checkbox"
            checked={websOnly.value}
            onChange={(e) => {
              websOnly.value = (e.target as HTMLInputElement).checked;
            }}
          />
          Home webs only
        </label>
        {!desktop && (
          <label class="sort">
            Sort
            <select
              value={sortKey.value}
              onChange={(e) => {
                sortKey.value = (e.target as HTMLSelectElement).value as SortKey;
                descending.value = false;
              }}
            >
              <option value="distance">by distance</option>
              <option value="name">by name</option>
              <option value="planets">by known planets</option>
              <option value="lanes">by old lanes</option>
            </select>
          </label>
        )}
        <span class="count" aria-live="polite">
          {shown.length} of {rows.length}
        </span>
      </div>

      {desktop ? (
        <div class="data-desktop">
          <SystemTable rows={shown} />
          <aside class="inspector" aria-label="Selected system">
            {current ? (
              <SystemDetail row={current} world={world} />
            ) : (
              <p class="hint">Select a system to see its stars, planets and lanes. ↑ and ↓ move through the list.</p>
            )}
          </aside>
        </div>
      ) : (
        <ul class="system-cards">
          {shown.map((r) => (
            <li key={r.id}>
              <SystemCard row={r} />
            </li>
          ))}
        </ul>
      )}

      {!desktop && current && (
        <div class={`sheet${sheetFull.value ? ' sheet-full' : ''}`} role="dialog" aria-label={current.name}>
          <div class="sheet-bar">
            <button
              type="button"
              class="sheet-grow"
              onClick={() => {
                sheetFull.value = !sheetFull.value;
              }}
              aria-label={sheetFull.value ? 'Show less' : 'Show more'}
            >
              <span class="grip" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="sheet-close"
              onClick={() => {
                selected.value = null;
              }}
            >
              Close
            </button>
          </div>
          <div class="sheet-body">
            <SystemDetail row={current} world={world} />
          </div>
        </div>
      )}

      <footer class="data-footer">
        Stars from Gaia DR3 and SIMBAD, planets from the NASA Exoplanet Archive and the Extrasolar Planets
        Encyclopaedia, as copied from{' '}
        <a href={`${world.sky.importedFrom.repository}/tree/${world.sky.importedFrom.commit}`}>
          Starman Reborn {world.sky.importedFrom.commit}
        </a>
        . The lanes and the powers are fiction. Build {buildId}.
      </footer>
    </div>
  );
}

function WebCard({ faction, world, game }: { faction: (typeof FACTION_IDS)[number]; world: World; game: GameState }) {
  const f = FACTIONS[faction];
  const lanes = game.lanes.filter((l) => l.owner === faction);
  const systems = new Set([f.capital.systemId, ...lanes.flatMap((l) => l.id.split('~'))]);
  return (
    <article class="web-card" style={{ '--faction': f.colour }}>
      <h2>
        <FactionMark faction={faction} size={14} /> {f.name}
      </h2>
      <p>
        Capital <b>{world.system(f.capital.systemId).name}</b> · {systems.size} systems · {lanes.length} lanes{' '}
        <Badge kind="fiction" />
      </p>
      <p class="web-traits">{f.traits.map((t) => t.text).join(' ')}</p>
      <button
        type="button"
        class="link"
        onClick={() => {
          selected.value = f.capital.systemId;
        }}
      >
        Show {world.system(f.capital.systemId).name}
      </button>
    </article>
  );
}

function SortHeader({ k, label, numeric }: { k: SortKey; label: string; numeric?: boolean }) {
  const active = sortKey.value === k;
  return (
    <th
      scope="col"
      class={numeric ? 'num' : undefined}
      aria-sort={active ? (descending.value ? 'descending' : 'ascending') : 'none'}
    >
      <button
        type="button"
        onClick={() => {
          if (active) descending.value = !descending.value;
          else {
            sortKey.value = k;
            descending.value = false;
          }
        }}
      >
        {label}
        <span aria-hidden="true">{active ? (descending.value ? ' ▼' : ' ▲') : ''}</span>
      </button>
    </th>
  );
}

function SystemTable({ rows }: { rows: SystemRow[] }) {
  return (
    <table class="system-table">
      <thead>
        <tr>
          <SortHeader k="name" label="System" />
          <SortHeader k="distance" label="From Sol" numeric />
          <th scope="col">Stars</th>
          <SortHeader k="planets" label="Known planets" numeric />
          <SortHeader k="lanes" label="Old lanes" numeric />
          <th scope="col">Home web</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} class={selected.value === r.id ? 'is-selected' : undefined}>
            <th scope="row">
              <button
                type="button"
                onClick={() => {
                  selected.value = r.id;
                }}
              >
                {r.name}
              </button>
              {r.flare && <span class="flare-tag"> flare star</span>}
            </th>
            <td class="num">{formatLy(r.fromSolDeci)}</td>
            <td>{r.stars}</td>
            <td class="num">{r.planets || '—'}</td>
            <td class="num">
              {r.lanes.length}
              {r.lanes.some((l) => l.owner) && (
                <span class="open-count"> · {r.lanes.filter((l) => l.owner).length} open</span>
              )}
            </td>
            <td>{r.web ? <FactionTag faction={r.web} /> : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SystemCard({ row }: { row: SystemRow }) {
  return (
    <button
      type="button"
      class={`system-card${selected.value === row.id ? ' is-selected' : ''}`}
      onClick={() => {
        selected.value = row.id;
        sheetFull.value = false;
      }}
    >
      <span class="card-name">{row.name}</span>
      <span class="card-dist">{formatLy(row.fromSolDeci)}</span>
      <span class="card-line">
        {row.stars}
        {row.flare && ' · flare star'}
      </span>
      <span class="card-line">
        {row.planets > 0 ? `${row.planets} known planet${row.planets > 1 ? 's' : ''}` : 'No known planets'} ·{' '}
        {row.lanes.length} old lane{row.lanes.length > 1 ? 's' : ''}
      </span>
      {row.web && (
        <span class="card-web">
          <FactionTag faction={row.web} />
        </span>
      )}
    </button>
  );
}

function measured(m: Measured | undefined, digits = 2): string {
  if (!m) return 'unknown';
  const v = m.value.toFixed(digits);
  return m.error !== undefined ? `${v} ± ${m.error.toFixed(digits)}` : v;
}

function PlanetItem({ p }: { p: SkyPlanet }) {
  return (
    <li class="planet">
      <div class="planet-name">
        <a href={p.source.url} target="_blank" rel="noreferrer">
          {p.name}
        </a>{' '}
        <Badge kind={p.status === 'confirmed' ? 'observed' : 'disputed'} />
      </div>
      <dl>
        <dt>Orbit</dt>
        <dd>{p.semiMajorAxisAu ? `${measured(p.semiMajorAxisAu, 3)} au` : 'unknown'}</dd>
        <dt>{p.massEarth?.qualifier?.startsWith('minimum') ? 'Minimum mass' : 'Mass'}</dt>
        <dd>{p.massEarth ? `${measured(p.massEarth)} Earths` : 'unknown'}</dd>
        <dt>Radius</dt>
        <dd>{p.radiusEarth ? `${measured(p.radiusEarth)} Earths` : 'unknown'}</dd>
      </dl>
      {p.statusNote && <p class="note">{p.statusNote}</p>}
    </li>
  );
}

function SystemDetail({ row, world }: { row: SystemRow; world: World }) {
  const s = world.system(row.id).sky;
  return (
    <article class="system-detail">
      <h2>{s.name}</h2>
      <p class="detail-dist">
        {s.distanceLy.toFixed(2)} ly from Sol
        {s.distanceErrorLy !== undefined && s.distanceErrorLy > 0 && ` ± ${s.distanceErrorLy.toFixed(3)}`}{' '}
        <Badge kind="observed" />
      </p>

      <h3>Stars</h3>
      <ul class="stars">
        {s.stars.map((st) => (
          <li key={st.id}>
            <span class="star-dot" style={{ background: st.colorHex }} aria-hidden="true" />
            <b>{st.name}</b> {st.spectralType}
            {st.flareVariable && <span class="flare-tag"> · flare star ({st.flareVariable})</span>}{' '}
            <a href={st.astrometrySource.url} target="_blank" rel="noreferrer">
              {st.astrometrySource.label}
            </a>
          </li>
        ))}
      </ul>

      <h3>Known planets</h3>
      {s.planets.length > 0 ? (
        <ul class="planets">
          {s.planets.map((p) => (
            <PlanetItem key={p.id} p={p} />
          ))}
        </ul>
      ) : (
        <p class="none">
          None known. Every other planet here will be generated when the planets arrive, and labelled{' '}
          <Badge kind="fiction" />.
        </p>
      )}

      {s.belts.length > 0 && (
        <>
          <h3>Belts and discs</h3>
          <ul class="belts">
            {s.belts.map((b) => (
              <li key={b.id}>
                <b>{b.name}</b> <Badge kind="observed" /> {b.note}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>
        Old lanes <Badge kind="fiction" />
      </h3>
      <ul class="lanes">
        {row.lanes.map((l) => (
          <li key={l.id} class={l.owner ? 'lane-open' : 'lane-dark'}>
            <button
              type="button"
              class="link"
              onClick={() => {
                selected.value = l.to;
              }}
            >
              {l.toName}
            </button>{' '}
            {formatLy(l.lengthDeci)} · {l.owner ? <FactionTag faction={l.owner} /> : <span class="dark">dark</span>}
          </li>
        ))}
      </ul>
    </article>
  );
}
