// The codex (§10, light in M1): every system's real data and its sources, how the game estimates
// what is not measured, and the data's licences. It began as increment 1's data preview.
// Phone: cards, and a system opens as a bottom sheet. Desktop: a sortable table, and the selected
// system fills an inspector beside it. Both show the same things (D-04).

import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { forgetLessons, lessons } from '../../app/lessons.ts';
import { ADVISORS, DEPARTMENT_NAMES, DEPARTMENTS } from '../../content/advisors.ts';
import { ALL_FACTION_IDS, type FACTION_IDS, FACTIONS } from '../../content/factions.ts';
import { LESSONS } from '../../content/lessons.ts';
import { SPECIES } from '../../content/species.ts';
import type { SystemId } from '../../data/types.ts';
import { formatDate } from '../../sim/calendar.ts';
import { formatLy } from '../../sim/geometry.ts';
import { DWARF_SOURCE } from '../../sim/starLight.ts';
import type { GameState } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';
import { layout } from '../layout.ts';
import { AdvisorFace, Badge, FactionMark, FactionTag } from '../parts.tsx';
import { SystemPanel } from '../system/SystemPanel.tsx';
import { filterRows, type SortKey, type SystemRow, sortRows, systemRows } from './model.ts';
import '../sheet.css';
import './data.css';
import { DialogFocus } from '../focus.tsx';

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
  const go = (id: SystemId) => {
    selected.value = id;
  };
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
        <a class="back" href="#/map">
          ← Map
        </a>
        <h1>
          Codex <span>the real neighbourhood</span>
        </h1>
        <p class="data-sub">
          What astronomers know of every system within 33 light-years of the Sun, with its sources, and the old lanes as
          they stand in {formatDate(game.turn)}.
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
        {ALL_FACTION_IDS.map((f) => (
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
              <SystemPanel world={world} game={game} id={current.id} onGo={go} realOnly />
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
          <DialogFocus />
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
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling body must be reachable by keyboard (WCAG 2.1.1, M6_ONE.md §21.2) */}
          <div class="sheet-body" tabIndex={0}>
            <SystemPanel world={world} game={game} id={current.id} onGo={go} realOnly />
          </div>
        </div>
      )}

      <HowToPlay />
      <Methods />

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
      {f.arrives ? (
        <p>
          Arrives in mid-game: its arks come to <b>{world.system(f.capital.systemId).name}</b>, at the map’s edge, and
          ask the powers for a world <Badge kind="fiction" />
        </p>
      ) : (
        <p>
          Capital <b>{world.system(f.capital.systemId).name}</b> · {systems.size} systems · {lanes.length} lanes{' '}
          <Badge kind="fiction" />
        </p>
      )}
      <p class="web-traits">{f.traits.map((t) => t.text).join(' ')}</p>
      {f.people && (
        <figure class="web-people">
          <img
            src={`${import.meta.env.BASE_URL}art/illustration/${f.people.picture}-640.webp`}
            srcset={`${import.meta.env.BASE_URL}art/illustration/${f.people.picture}-640.webp 640w, ${import.meta.env.BASE_URL}art/illustration/${f.people.picture}-1280.webp 1280w`}
            sizes="(min-width: 960px) 30vw, 88vw"
            width={640}
            height={427}
            alt={f.people.alt}
            decoding="async"
          />
          <figcaption>
            {SPECIES[f.species].name}, who make the {f.name} <Badge kind="fiction" />
          </figcaption>
        </figure>
      )}
      {f.playable ? (
        <ul class="web-advisors" aria-label={`The ${f.name}’s advisors`}>
          {/* An alien power one may lead keeps its speaker beside its advisors (M6_ONE.md §24). */}
          {f.speaker && (
            <li key={f.speaker.portrait}>
              <AdvisorFace advisor={f.speaker} size={40} />
              <span>
                <b>{f.speaker.name}</b>
                <span class="dim">{f.speaker.role}</span>
              </span>
            </li>
          )}
          {DEPARTMENTS.map((d) => {
            const a = ADVISORS[faction].people[d];
            return (
              <li key={d}>
                <AdvisorFace advisor={a} size={40} />
                <span>
                  <b>{a.name}</b>
                  <span class="dim">{DEPARTMENT_NAMES[d]}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul class="web-advisors" aria-label={`The ${f.name}’s people`}>
          {[f.speaker, ADVISORS[faction].people.envoy].map(
            (a) =>
              a && (
                <li key={a.portrait}>
                  <AdvisorFace advisor={a} size={40} />
                  <span>
                    <b>{a.name}</b>
                    <span class="dim">{a.role}</span>
                  </span>
                </li>
              ),
          )}
        </ul>
      )}
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

/** How to play (M6_ONE.md §20.3): every lesson's summary, those met in play marked, and *Tell me again*. */
function HowToPlay() {
  const told = lessons.value.told;
  return (
    <section class="codex-methods codex-lessons" aria-label="How to play">
      <h2>How to play</h2>
      <p>
        The advisors explain each part of the game the first time it matters, and once only. Here is every lesson, those
        met in play marked so.
      </p>
      <ul>
        {LESSONS.map((l) => (
          <li key={l.id}>
            <b>{l.title}</b>
            {told.includes(l.id) && <span class="lesson-met"> · Met in play</span>}: {l.summary}
          </li>
        ))}
      </ul>
      {told.length > 0 && (
        <button type="button" class="button button-small button-quiet" onClick={forgetLessons}>
          Tell me again
        </button>
      )}
    </section>
  );
}

function Methods() {
  return (
    <section class="codex-methods" aria-label="How the game estimates">
      <h2>How the game works out what is not measured</h2>
      <ul>
        <li>
          <b>A star’s light and temperature</b> <Badge kind="estimated" /> are read from the mean sequence of dwarf
          stars for its catalogued type,{' '}
          <a href={DWARF_SOURCE.url} target="_blank" rel="noreferrer">
            {DWARF_SOURCE.label}
          </a>
          . White dwarfs are worked out from the temperature their type gives and a radius of 0.012 of the Sun’s. Stars
          whose type is not catalogued are taken as a typical red dwarf.
        </li>
        <li>
          <b>A planet’s equilibrium temperature</b> <Badge kind="estimated" /> follows from its orbit and its star’s
          light: 255 K × L<sup>¼</sup> ÷ √(orbit in au), assuming it reflects as much light as Earth does.
        </li>
        <li>
          <b>Everything else about a planet</b> nobody has measured (its air, water and riches), and every planet, moon
          and belt astronomers have not found, is made by the game from the star’s real type and the game’s seed, and
          marked <Badge kind="fiction" />. It never contradicts what is observed.
        </li>
        <li>
          <b>The lanes, the powers and the Lapse</b> <Badge kind="fiction" /> are the game’s story.
        </li>
      </ul>
      <h2>Sources and licences</h2>
      <p>
        Positions and types: Gaia DR3 and SIMBAD. Planets: the NASA Exoplanet Archive and the Extrasolar Planets
        Encyclopaedia, with three from the Open Exoplanet Catalogue (MIT licence). Sol: NASA’s fact sheets. Two stars’
        values (Procyon B, Ross 614 B) come from the HYG database v4.0, shared under CC BY-SA 4.0. All as gathered by{' '}
        <a href="https://github.com/shotif/starman-reborn" target="_blank" rel="noreferrer">
          Starman Reborn
        </a>
        ’s sky snapshot of 30 September 2026, and beyond about 27 light-years by the same pipeline on 22 October 2026;
        see{' '}
        <a
          href="https://github.com/shotif/starman-control/blob/main/src/data/NOTICE.md"
          target="_blank"
          rel="noreferrer"
        >
          the data notice
        </a>
        .
      </p>
      <h3>The pictures and the music</h3>
      <p data-testid="picture-credits">
        The pictures of places, people, buildings and vehicles are made with an image model, Google’s Gemini, from the
        game’s own written briefs. Each was chosen by hand from a few candidates, and its prompt, model and date are
        recorded in{' '}
        <a
          href="https://github.com/shotif/starman-control/blob/main/art/manifest.json"
          target="_blank"
          rel="noreferrer"
        >
          the art records
        </a>
        . The sky, the stars, the planets, the ships on the map and the people in the colonies are drawn by the game
        itself.
      </p>
      <p data-testid="music-credits">
        The music is made with a music model, Google’s Lyria, from the game’s own briefs, each piece chosen from
        candidates and recorded in{' '}
        <a
          href="https://github.com/shotif/starman-control/blob/main/music/manifest.json"
          target="_blank"
          rel="noreferrer"
        >
          the music records
        </a>
        . The interface’s own sounds are made by the game as you play.
      </p>
    </section>
  );
}
