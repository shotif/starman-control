// Colonies and outposts on screen (M1_COLONIES.md §5): a holding's panel with its people, industry,
// yields and build queue; the worlds a colony or outpost ship can settle; and the empire at a
// glance. The same parts serve both layouts: the phone shows lists and cards, the desktop tables.

import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { FACTIONS, type FactionId } from '../../content/factions.ts';
import { type Cost, itemName, PROJECTS, type QueueItem } from '../../content/projects.ts';
import { SHIPS } from '../../content/ships.ts';
import type { SystemId } from '../../data/types.ts';
import { bodiesOf } from '../../sim/bodies.ts';
import {
  bodyOf,
  buildOptions,
  capacityOf,
  costOf,
  growthOf,
  incomeOf,
  industryOf,
  queueTurns,
  type Resource,
  resourceWord,
  settleRefusal,
  shortfall,
  yieldsOf,
} from '../../sim/economy.ts';
import { formatLy } from '../../sim/geometry.ts';
import { habitability } from '../../sim/habitability.ts';
import { laneQuote, laneTargets } from '../../sim/lanes.ts';
import type { Need } from '../../sim/needs.ts';
import { researchOf, speciesFor } from '../../sim/research.ts';
import { type GameState, type Holding, powerOf, type ShipState, type Stockpile } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';
import { Badge, FactionTag } from '../parts.tsx';
import { HABITABILITY_WORD } from '../system/words.ts';
import { ColonyStill } from './ColonyStill.tsx';
import { give, type Play } from './play.tsx';
import { lanePreview, queueHover } from './state.ts';
import './colony.css';
import { Count } from '../count.tsx';

/** People and room are counted in tenths of a unit of about a million: "10.4", "12". */
export function millions(tenths: number): string {
  return tenths % 10 === 0 ? String(tenths / 10) : (tenths / 10).toFixed(1);
}

/** Its world's name. */
export function holdingName(world: World, game: GameState, h: Holding): string {
  return bodyOf(world, game, h)?.name ?? world.system(h.system).name;
}

export function holdingKind(h: Holding): string {
  return h.capital ? 'Capital' : h.kind === 'colony' ? 'Colony' : 'Outpost';
}

/** "60 industry, 10 metals". */
export function costText(c: Cost): string {
  const parts = [`${c.industry} industry`];
  if (c.metals) parts.push(`${c.metals} metals`);
  if (c.volatiles) parts.push(`${c.volatiles} volatiles`);
  if (c.fuel) parts.push(`${c.fuel} fusion fuel`);
  return parts.join(', ');
}

/** "Survey ship", "New lane to Ross 128", "Relight the lane to Ross 128". */
export function queueLabel(world: World, h: Holding, item: QueueItem): string {
  if (item.kind !== 'lane') return itemName(item);
  const to = world.system(item.to).name;
  return world.catalogueLane(h.system, item.to) ? `Relight the lane to ${to}` : `New lane to ${to}`;
}

function missingText(m: Partial<Stockpile>): string {
  return (Object.keys(m) as Resource[]).map((r) => `${m[r]} ${resourceWord(r)}`).join(' and ');
}

function turnsText(t: number | null): string {
  if (t === null) return 'never, with no industry';
  return t === 1 ? 'when this turn ends' : `in about ${t} turns`;
}

/** "Earth: 2 metals, 1 volatiles" for each holding, for the top bar's explanations. */
export function incomeHelp(world: World, game: GameState, faction: FactionId, r: Resource): string {
  const lines: string[] = [];
  for (const h of game.holdings) {
    if (h.owner !== faction) continue;
    const n = yieldsOf(world, game, h).total[r];
    if (n > 0) lines.push(`${holdingName(world, game, h)} +${n}`);
  }
  const name = resourceWord(r);
  return lines.length > 0
    ? `${name[0]?.toUpperCase()}${name.slice(1)} a turn: ${lines.join(', ')}`
    : `Nothing yields ${name} yet`;
}

export function Resources({ world, game, faction }: { world: World; game: GameState; faction: FactionId }) {
  const s = powerOf(game, faction).stockpile;
  const income = incomeOf(world, game, faction);
  const research = researchOf(game, faction);
  const item = (r: Resource, cls: string) => (
    <li title={incomeHelp(world, game, faction, r)}>
      <span class={`res-icon ${cls}`} aria-hidden="true" />
      <b>
        <Count value={s[r]} />
      </b>
      <span class="res-name"> {resourceWord(r)}</span>
      <span class="res-income">{income[r] > 0 ? ` +${income[r]}` : ''}</span>
    </li>
  );
  return (
    <ul class="resources" aria-label="Stockpile, and what it gains a turn">
      {item('metals', 'res-metals')}
      {item('volatiles', 'res-volatiles')}
      {item('fuel', 'res-fuel')}
      <li class="res-research" title={`Research a turn ${research.parts.map((p) => p.label).join(', ')}`}>
        <span class="res-icon res-science" aria-hidden="true" />
        <b>
          <Count value={research.total} />
        </b>
        <span class="res-name"> research a turn</span>
      </li>
    </ul>
  );
}

/** A figure and the parts it is made of: "Industry 13 = 10 from people + 2 from the capital + 1 from Administration (+10%)". */
function FigureLine({
  label,
  total,
  parts,
}: {
  label: string;
  total: number;
  parts: { label: string; value: number }[];
}) {
  return (
    <p class="figure">
      <b>
        {label} {total}
      </b>
      {parts.length > 1 && <span class="dim"> = {parts.map((p) => `${p.value} ${p.label}`).join(' + ')}</span>}
    </p>
  );
}

/** "+2 metals, +1 volatiles a turn", and where each comes from. */
function YieldsLine({ world, game, h }: { world: World; game: GameState; h: Holding }) {
  const y = yieldsOf(world, game, h);
  const from = new Map<string, string[]>();
  for (const p of y.parts) from.set(p.label, [...(from.get(p.label) ?? []), `+${p.value} ${resourceWord(p.resource)}`]);
  return (
    <p class="figure">
      <b>Yields</b>{' '}
      {y.parts.length > 0 ? `${yieldsText(world, game, h)} a turn` : 'nothing: its world has no riches to gather'}
      {y.parts.length > 0 && (
        <span class="dim"> ({[...from].map(([label, items]) => `${items.join(', ')} from ${label}`).join('; ')})</span>
      )}
    </p>
  );
}

function Queue({
  world,
  game,
  h,
  play,
  table,
}: {
  world: World;
  game: GameState;
  h: Holding;
  play: Play;
  table: boolean;
}) {
  const short = shortfall(world, game, h);
  const turns = queueTurns(world, game, h);
  const cost = (item: QueueItem) => costOf(world, game, h, item);
  const label = (item: QueueItem) => queueLabel(world, h, item);
  const up = (i: number) => give(play, { type: 'reorder', holding: h.id, from: i, to: i - 1 });
  const remove = (i: number) => give(play, { type: 'unqueue', holding: h.id, index: i });
  const waits = (i: number) =>
    i === 0 && short !== null && Object.keys(short.missing).length > 0 && short.industry === 0;
  /** A lane is tuned after it is paid for. */
  const tuned = (item: QueueItem) => {
    if (item.kind !== 'lane') return '';
    const n = laneQuote(world, game, h.owner, h.system, item.to).turns;
    return `, then tuned for ${n} turn${n === 1 ? '' : 's'}`;
  };
  const when = (i: number) => {
    const item = h.queue[i];
    return `${turnsText(turns[i] ?? null)}${item ? tuned(item) : ''}`;
  };
  const status = (i: number) =>
    waits(i) && short
      ? `Waits for ${missingText(short.missing)}`
      : `${h.queue[i]?.kind === 'lane' ? 'Paid' : 'Ready'} ${when(i)}`;
  const buttons = (i: number, name: string) => (
    <>
      <button
        type="button"
        class="button button-quiet button-small"
        aria-label={`Remove the ${name.toLowerCase()}`}
        onClick={() => remove(i)}
      >
        Remove
      </button>
      {i > 0 && (
        <button
          type="button"
          class="button button-quiet button-small"
          aria-label={`Move the ${name.toLowerCase()} up`}
          onClick={() => up(i)}
        >
          Up
        </button>
      )}
    </>
  );
  const first = h.queue[0];
  const firstCost = first ? cost(first).industry : 0;
  const progress = `${Math.min(h.industry, firstCost)} of ${firstCost}`;
  if (h.queue.length === 0)
    return (
      <p class="dim">
        Nothing queued.{' '}
        {h.industry > 0 ? `${h.industry} industry is kept for the next item (up to 60).` : 'Add something below.'}
      </p>
    );
  if (table)
    return (
      <table class="queue-table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Industry</th>
            <th scope="col">Ready</th>
            <th scope="col">
              <span class="visually-hidden">Order</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {h.queue.map((item, i) => (
            <tr
              key={`${i}-${label(item)}`}
              class={i === 0 ? 'is-first' : ''}
              onMouseEnter={() => {
                if (i === 0 && item.kind === 'project') queueHover.value = h.id;
              }}
              onMouseLeave={() => {
                queueHover.value = null;
              }}
            >
              <td>{label(item)}</td>
              <td>{i === 0 ? progress : cost(item).industry}</td>
              <td class={waits(i) ? 'waits' : ''}>{waits(i) ? status(i) : when(i)}</td>
              <td class="queue-buttons">{buttons(i, label(item))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  return (
    <ol class="queue-list">
      {h.queue.map((item, i) => {
        const c = cost(item);
        return (
          <li key={`${i}-${label(item)}`} class={i === 0 ? 'is-first' : ''}>
            <div class="queue-item">
              <b>{label(item)}</b>
              <span class={waits(i) ? 'waits' : 'dim'}>{status(i)}</span>
              {i === 0 && (
                <span
                  class="queue-bar"
                  role="progressbar"
                  aria-label={`${progress} industry`}
                  aria-valuemin={0}
                  aria-valuemax={c.industry}
                  aria-valuenow={Math.min(h.industry, c.industry)}
                >
                  <span
                    style={{ width: `${Math.min(100, Math.floor((h.industry * 100) / Math.max(1, c.industry)))}%` }}
                  />
                </span>
              )}
            </div>
            <div class="queue-buttons">{buttons(i, label(item))}</div>
          </li>
        );
      })}
    </ol>
  );
}

function AddToQueue({ world, game, h, play }: { world: World; game: GameState; h: Holding; play: Play }) {
  const options = buildOptions(world, game, h);
  return (
    <ul class="build-options">
      {options.map(({ item, refusal }) => {
        const name = itemName(item);
        const does = item.kind === 'ship' ? SHIPS[item.ship].does : PROJECTS[item.project].does;
        return (
          <li key={name}>
            <button
              type="button"
              class="build-option"
              disabled={refusal !== null}
              aria-label={`Queue a ${name.toLowerCase()}`}
              onClick={() => give(play, { type: 'queue', holding: h.id, item })}
            >
              <b>{name}</b>
              <span class="build-cost">{costText(costOf(world, game, h, item))}</span>
              <span class="build-does">{refusal ?? does}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Lanes this holding could queue: dark lanes to relight and stars within reach, nearest first. */
function LanesFromHere({ world, game, h, play }: { world: World; game: GameState; h: Holding; play: Play }) {
  const targets = laneTargets(world, game, h.owner, h.system);
  if (targets.length === 0) return <p class="dim">No star is within your lane reach from here.</p>;
  return (
    <ul class="build-options lane-options">
      {targets.map(({ quote: q, refusal }) => {
        const to = world.system(q.to).name;
        const turns = `tuned for ${q.turns} turn${q.turns === 1 ? '' : 's'}`;
        return (
          <li key={q.to}>
            <button
              type="button"
              class="build-option"
              disabled={refusal !== null}
              aria-label={`Queue a lane to ${to}`}
              onClick={() => give(play, { type: 'queue', holding: h.id, item: { kind: 'lane', to: q.to } })}
              onMouseEnter={() => {
                lanePreview.value = { from: h.system, to: q.to };
              }}
              onMouseLeave={() => {
                lanePreview.value = null;
              }}
              onFocus={() => {
                lanePreview.value = { from: h.system, to: q.to };
              }}
              onBlur={() => {
                lanePreview.value = null;
              }}
            >
              <b>
                {to} <span class="lane-kind">{q.relight ? 'relight' : 'new'}</span>
              </b>
              <span class="build-cost">{costText(q.cost)}</span>
              <span class="build-does">{refusal ?? `${formatLy(q.lengthDeci)}, ${turns}`}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function HoldingPanel({
  world,
  game,
  holding: h,
  play,
  table,
  onGo,
  viewing = false,
  onView,
}: {
  world: World;
  game: GameState;
  holding: Holding;
  /** The player's game; their own holdings take orders. */
  play?: Play;
  /** Show the queue as a table (the desktop). */
  table: boolean;
  onGo: (id: SystemId) => void;
  /** Its scene is open as a diorama, so the panel's still is not needed. */
  viewing?: boolean;
  /** Opens its scene as a diorama. */
  onView?: () => void;
}) {
  const mine = play?.faction === h.owner;
  const name = holdingName(world, game, h);
  const body = bodyOf(world, game, h);
  const system = world.system(h.system).name;
  return (
    <article class="holding-panel" aria-label={name}>
      <button type="button" class="link back-link" onClick={() => onGo(h.system)}>
        ← {system}
      </button>
      <header>
        <h2>{name}</h2>
        <p class="system-kind">
          {h.capital ? 'The capital' : h.kind === 'colony' ? 'A colony' : 'An outpost'} at {system} ·{' '}
          <FactionTag faction={h.owner} /> <Badge kind="fiction" />
        </p>
        {body?.planet && body.planet.status !== 'confirmed' && (
          <p class="dim">
            Astronomers dispute {body.name}: it may not exist. The game keeps it, and says so <Badge kind="disputed" />
          </p>
        )}
      </header>
      {!viewing && <ColonyStill world={world} game={game} holding={h} onOpen={onView} />}
      {h.kind === 'colony' ? (
        <>
          <dl class="facts">
            <dt>People</dt>
            <dd>
              {millions(h.people)} million, room for {millions(capacityOf(world, game, h))} million
            </dd>
            <dt>Growth</dt>
            <dd>
              {growthOf(world, game, h) > 0
                ? `+${millions(growthOf(world, game, h))} million a turn`
                : 'none: the colony is full'}
            </dd>
          </dl>
          <FigureLine label="Industry" {...industryOf(h)} />
        </>
      ) : (
        <p class="dim">Outposts have no people; they gather their world’s riches, and can build lanes.</p>
      )}
      <YieldsLine world={world} game={game} h={h} />
      {h.kind === 'outpost' && <FigureLine label="Industry" {...industryOf(h)} />}
      {h.kind === 'colony' && (
        <>
          <h3>Built here</h3>
          {h.projects.length > 0 ? (
            <ul class="projects">
              {h.projects.map((p) => (
                <li key={p}>
                  <b>{PROJECTS[p].name}</b> <span class="dim">{PROJECTS[p].does}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p class="dim">Nothing yet.</p>
          )}
        </>
      )}
      {mine && play && (
        <>
          <h3>
            Building <span class="dim">· {industryOf(h).total} industry a turn</span>
          </h3>
          <Queue world={world} game={game} h={h} play={play} table={table} />
          {h.kind === 'colony' && (
            <>
              <h3>Add to the queue</h3>
              <AddToQueue world={world} game={game} h={h} play={play} />
            </>
          )}
          <h3>Lanes from here</h3>
          <LanesFromHere world={world} game={game} h={h} play={play} />
        </>
      )}
    </article>
  );
}

/** The worlds here a colony or outpost ship could found on, each one tap (or click) away. */
export function Founding({ world, game, ship, play }: { world: World; game: GameState; ship: ShipState; play: Play }) {
  if (ship.type === 'survey' || ship.at === null) return null;
  const kind = ship.type === 'colony' ? 'colony' : 'outpost';
  const at = ship.at;
  const system = world.system(at).name;
  const bodies = bodiesOf(world, game.seed, at);
  if (ship.founding) {
    const b = bodies.find((x) => x.id === ship.founding?.body);
    return (
      <section class="founding" aria-label="Founding">
        <p>
          Founding {kind === 'colony' ? 'a colony' : 'an outpost'} on <b>{b?.name ?? 'a world'}</b> when the turn ends.
          The ship is used up.
        </p>
        <button type="button" class="button button-quiet" onClick={() => give(play, { type: 'stop', ship: ship.id })}>
          Do not found it
        </button>
      </section>
    );
  }
  if (!powerOf(game, ship.owner).surveyed.includes(at))
    return <p class="dim">{system} has not been surveyed: survey it to find the worlds this ship could settle.</p>;
  const species = speciesFor(game, ship.owner);
  const open = bodies.filter((b) => settleRefusal(world, game, ship.owner, at, b.id, kind) === null);
  return (
    <section class="founding" aria-label={kind === 'colony' ? 'Found a colony' : 'Found an outpost'}>
      <h3>{kind === 'colony' ? `Found a colony at ${system}` : `Found an outpost at ${system}`}</h3>
      {open.length === 0 ? (
        <p class="dim">
          {kind === 'colony'
            ? `No world here your people can live on yet: the rest need habitat domes, a technology, or are taken.`
            : 'Every body here is already taken.'}
        </p>
      ) : (
        <ul class="found-list">
          {open.map((b) => {
            const hab = habitability(b, species);
            return (
              <li key={b.id}>
                <button
                  type="button"
                  class="found-row"
                  onClick={() =>
                    give(play, { type: kind === 'colony' ? 'colonise' : 'found-outpost', ship: ship.id, body: b.id })
                  }
                >
                  <span class="world-name">{b.name}</span>
                  <span class="world-line">
                    {kind === 'colony' ? `room for ${hab.capacity} million` : outpostYield(b.riches)}
                  </span>
                  <span class={`hab hab-${hab.level}`}>{HABITABILITY_WORD[hab.level]}</span>
                  <span class="found-go">Found</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function outpostYield(riches: Stockpile): string {
  const best = (Object.keys(riches) as Resource[]).filter((r) => riches[r] > 0);
  return best.length > 0 ? `riches: ${best.map(resourceWord).join(', ')}` : 'no riches';
}

/** What a need says, and what choosing it opens. */
export function needText(world: World, game: GameState, need: Need): string {
  if (need.kind === 'no-research') return 'Nothing is being researched.';
  const where = world.system(need.system).name;
  if (need.kind === 'idle-ship') {
    const s = game.ships.find((x) => x.id === need.ship);
    if (!s) return '';
    const found =
      need.canFound > 0
        ? `: it could found ${s.type === 'colony' ? 'a colony' : 'an outpost'} on ${need.canFound} world${need.canFound === 1 ? '' : 's'} here`
        : '';
    const look = need.canInvestigate ? ': it could investigate the anomaly here' : '';
    return `${SHIPS[s.type].name} ${s.name} is idle at ${where}${found}${look}.`;
  }
  const h = game.holdings.find((x) => x.id === need.holding);
  if (!h) return '';
  const name = holdingName(world, game, h);
  if (need.kind === 'idle-yard') return `${name}’s shipyard is building nothing.`;
  const first = h.queue[0];
  const short = shortfall(world, game, h);
  return `${first ? queueLabel(world, h, first) : 'Its next item'} at ${name} waits for ${short ? missingText(short.missing) : 'resources'}.`;
}

type Tab = 'colonies' | 'outposts' | 'ships';
type ColonyKey = 'name' | 'system' | 'people' | 'industry';

/** The whole empire: colonies, outposts and ships, as cards (phone) or sortable tables (desktop). */
export function EmpireView({
  world,
  game,
  faction,
  table,
  shipsList,
  onHolding,
  onView,
}: {
  world: World;
  game: GameState;
  faction: FactionId;
  table: boolean;
  /** The ships, as the screen lists them. */
  shipsList: ComponentChildren;
  onHolding: (id: number) => void;
  /** Opens a colony's or an outpost's scene. */
  onView?: (id: number) => void;
}) {
  const view = (h: Holding, name: string) =>
    onView && (
      <button
        type="button"
        class="button button-quiet button-small empire-view"
        aria-label={`View ${name}`}
        onClick={() => onView(h.id)}
      >
        View
      </button>
    );
  const [tab, setTab] = useState<Tab>('colonies');
  const [sort, setSort] = useState<{ key: ColonyKey; down: boolean }>({ key: 'people', down: true });
  const mine = game.holdings.filter((h) => h.owner === faction);
  const colonies = mine.filter((h) => h.kind === 'colony');
  const outposts = mine.filter((h) => h.kind === 'outpost');
  const ships = game.ships.filter((s) => s.owner === faction);
  const value = (h: Holding, key: ColonyKey): string | number =>
    key === 'name'
      ? holdingName(world, game, h)
      : key === 'system'
        ? world.system(h.system).name
        : key === 'people'
          ? h.people
          : industryOf(h).total;
  const sorted = [...colonies].sort((a, b) => {
    const x = value(a, sort.key);
    const y = value(b, sort.key);
    const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'en-GB');
    return (sort.down ? -c : c) || a.id - b.id;
  });
  const building = (h: Holding) => {
    const first = h.queue[0];
    if (!first) return h.projects.includes('shipyard') ? 'Nothing' : '—';
    const t = queueTurns(world, game, h)[0] ?? null;
    return `${queueLabel(world, h, first)}, ${t === null ? 'no industry' : t === 1 ? 'this turn' : `about ${t} turns`}`;
  };
  const head = (key: ColonyKey, label: string) => (
    <th scope="col" aria-sort={sort.key === key ? (sort.down ? 'descending' : 'ascending') : 'none'}>
      <button
        type="button"
        class="sort"
        onClick={() => setSort({ key, down: sort.key === key ? !sort.down : key !== 'name' && key !== 'system' })}
      >
        {label}
      </button>
    </th>
  );
  return (
    <section class="empire" aria-label="Empire">
      <h2 class="sheet-heading">The {FACTIONS[faction].name}</h2>
      <div class="view-toggle empire-tabs" role="tablist">
        {(
          [
            ['colonies', `Colonies ${colonies.length}`],
            ['outposts', `Outposts ${outposts.length}`],
            ['ships', `Ships ${ships.length}`],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            role="tab"
            class="toggle-option"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'colonies' &&
        (table ? (
          <table class="empire-table">
            <thead>
              <tr>
                {head('name', 'Colony')}
                {head('system', 'System')}
                {head('people', 'People')}
                {head('industry', 'Industry')}
                <th scope="col">Building</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((h) => (
                <tr key={h.id}>
                  <td>
                    <button type="button" class="link" onClick={() => onHolding(h.id)}>
                      {holdingName(world, game, h)}
                    </button>
                    {h.capital && <span class="dim"> · capital</span>} {view(h, holdingName(world, game, h))}
                  </td>
                  <td>{world.system(h.system).name}</td>
                  <td>
                    {millions(h.people)} / {millions(capacityOf(world, game, h))}
                  </td>
                  <td>{industryOf(h).total}</td>
                  <td class={building(h) === 'Nothing' ? 'waits' : ''}>{building(h)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <ul class="empire-cards">
            {sorted.map((h) => (
              <li key={h.id}>
                <button type="button" class="empire-card" onClick={() => onHolding(h.id)}>
                  <b>{holdingName(world, game, h)}</b>
                  <span class="ship-type">{h.capital ? 'Capital' : world.system(h.system).name}</span>
                  <span class="ship-line">
                    {millions(h.people)} of {millions(capacityOf(world, game, h))} million · industry{' '}
                    {industryOf(h).total}
                  </span>
                  <span class={building(h) === 'Nothing' ? 'needs-tag' : 'ship-line'}>
                    {building(h) === 'Nothing' ? 'Building nothing' : building(h)}
                  </span>
                </button>
                {view(h, holdingName(world, game, h))}
              </li>
            ))}
          </ul>
        ))}
      {tab === 'outposts' &&
        (outposts.length === 0 ? (
          <p class="dim">No outposts yet: send an outpost ship to any body of a surveyed system.</p>
        ) : table ? (
          <table class="empire-table">
            <thead>
              <tr>
                <th scope="col">Outpost</th>
                <th scope="col">System</th>
                <th scope="col">Yields a turn</th>
              </tr>
            </thead>
            <tbody>
              {outposts.map((h) => (
                <tr key={h.id}>
                  <td>
                    <button type="button" class="link" onClick={() => onHolding(h.id)}>
                      {holdingName(world, game, h)}
                    </button>{' '}
                    {view(h, holdingName(world, game, h))}
                  </td>
                  <td>{world.system(h.system).name}</td>
                  <td>{yieldsText(world, game, h)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <ul class="empire-cards">
            {outposts.map((h) => (
              <li key={h.id}>
                <button type="button" class="empire-card" onClick={() => onHolding(h.id)}>
                  <b>{holdingName(world, game, h)}</b>
                  <span class="ship-type">{world.system(h.system).name}</span>
                  <span class="ship-line">{yieldsText(world, game, h)}</span>
                </button>
                {view(h, holdingName(world, game, h))}
              </li>
            ))}
          </ul>
        ))}
      {tab === 'ships' && shipsList}
    </section>
  );
}

function yieldsText(world: World, game: GameState, h: Holding): string {
  const t = yieldsOf(world, game, h).total;
  const parts = (Object.keys(t) as Resource[]).filter((r) => t[r] > 0).map((r) => `+${t[r]} ${resourceWord(r)}`);
  return parts.length > 0 ? parts.join(', ') : 'nothing';
}
