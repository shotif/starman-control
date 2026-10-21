// Colonies and outposts on screen (M1_COLONIES.md §5, M2_WORLDS.md §14): a holding's panel with its
// people, approval, food, industry, credits, districts and build queue; the worlds a colony or
// outpost ship can settle; and the empire at a glance. The same parts serve both layouts: the phone
// shows lists and cards, the desktop tables.

import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { settings } from '../../app/settings.ts';
import { ZONE_DEFS, ZONES, type Zone } from '../../content/districts.ts';
import { EDICT_IDS, EDICTS, type EdictId, PRIORITIES, PRIORITY_DEFS, type Priority } from '../../content/edicts.ts';
import { FACTIONS, type FactionId } from '../../content/factions.ts';
import { type Cost, itemName, PROJECTS, type QueueItem, withArticle } from '../../content/projects.ts';
import { RULES } from '../../content/rules.ts';
import { SHIPS } from '../../content/ships.ts';
import type { SystemId } from '../../data/types.ts';
import { bodiesOf } from '../../sim/bodies.ts';
import {
  type ApprovalLevel,
  approvalOf,
  bodyOf,
  buildOptions,
  capacityOf,
  costOf,
  creditsOf,
  districtAt,
  districtCount,
  foodOf,
  foodTurnsLeft,
  growthOf,
  idleMillions,
  incomeOf,
  industryOf,
  mainResource,
  networkFood,
  networkOf,
  networksOf,
  overdriveOf,
  queueTurns,
  type Resource,
  researchOf,
  resourceWord,
  settleRefusal,
  shortfall,
  treasuryOf,
  workedSlots,
  yieldsOf,
  zoneRefusal,
  zoneYield,
} from '../../sim/economy.ts';
import { formatLy } from '../../sim/geometry.ts';
import { habitability } from '../../sim/habitability.ts';
import { laneQuote, laneTargets } from '../../sim/lanes.ts';
import type { Need } from '../../sim/needs.ts';
import { refuse } from '../../sim/orders.ts';
import { speciesFor } from '../../sim/research.ts';
import {
  type GameState,
  type Holding,
  powerOf,
  type ShipState,
  type Stockpile,
  type TaxRate,
} from '../../sim/state.ts';
import { type Standing, standings } from '../../sim/visibility.ts';
import type { World } from '../../sim/world.ts';
import { Badge, FactionTag } from '../parts.tsx';
import { HABITABILITY_WORD } from '../system/words.ts';
import { AdvisorBy } from './advisor.tsx';
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
  if (item.kind === 'zone')
    return `${districtAt(h, item.slot) ? 'Rezone' : 'Zone'} district ${item.slot} for ${ZONE_DEFS[item.zone].name.toLowerCase()}`;
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
  const research = researchOf(world, game, faction);
  const power = powerOf(game, faction);
  const treasury = treasuryOf(world, game, faction);
  const home = networksOf(world, game, faction).find((n) => n.home);
  const food = home ? networkFood(world, game, faction, home) : null;
  const signed = (n: number) => (n > 0 ? ` +${n}` : n < 0 ? ` −${-n}` : '');
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
      <li
        class={`res-credits${power.treasury < 0 ? ' is-short' : ''}`}
        title={`Credits a turn: ${treasury.parts.map((p) => `${p.value > 0 ? '+' : ''}${p.value} ${p.label}`).join(', ')}`}
      >
        <span class="res-icon res-credits-icon" aria-hidden="true" />
        <b>
          <Count value={power.treasury} />
        </b>
        <span class="res-name"> credits</span>
        <span class="res-income">{signed(treasury.total)}</span>
      </li>
      {food && (
        <li
          class={`res-food${food.made < food.eaten && food.store + food.made < food.eaten ? ' is-short' : ''}`}
          title={`Food in store for the colonies on the capital's lanes: ${food.made} made, ${food.eaten} eaten a turn`}
        >
          <span class="res-icon res-food-icon" aria-hidden="true" />
          <b>
            <Count value={food.store} />
          </b>
          <span class="res-name"> food</span>
          <span class="res-income">{signed(food.made - food.eaten)}</span>
        </li>
      )}
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

/** Why a colony grows or not. */
function growthText(world: World, game: GameState, h: Holding): string {
  const g = growthOf(world, game, h);
  if (g > 0) return `+${millions(g)} million a turn`;
  if (h.hungry > 0) return 'none: the colony is hungry';
  const level = approvalOf(world, game, h).level;
  if (level === 'unrest' || level === 'revolt')
    return `none: the colony is in ${level === 'revolt' ? 'revolt' : 'unrest'}`;
  return 'none: the colony is full';
}

/** "64 · Content", and what makes it up. */
function ApprovalText({ world, game, h }: { world: World; game: GameState; h: Holding }) {
  const a = approvalOf(world, game, h);
  return (
    <>
      <span class={`approval approval-${a.level}`}>
        {a.total} · {APPROVAL_WORD[a.level]}
      </span>{' '}
      <span class="dim">
        = {a.parts.map((p) => `${p.value > 0 && p !== a.parts[0] ? '+' : ''}${p.value} ${p.label}`).join(' ')}
      </span>
    </>
  );
}

/** What the colony's farms make and its people eat, and how its network stands. */
function FoodText({ world, game, h }: { world: World; game: GameState; h: Holding }) {
  const f = foodOf(world, game, h);
  const net = networkOf(world, game, h);
  const nf = networkFood(world, game, h.owner, net);
  const left = net.home ? foodTurnsLeft(nf) : null;
  const where = net.home
    ? `On the capital's lanes: ${nf.made} made, ${nf.eaten} eaten a turn, ${nf.store} in store${
        left !== null ? `, enough for ${left} turn${left === 1 ? '' : 's'}` : ''
      }.`
    : nf.made < nf.eaten
      ? 'Cut off from the capital’s lanes, and it cannot feed itself.'
      : 'Cut off from the capital’s lanes: it feeds itself.';
  return (
    <>
      {f.made.total} made, {f.eaten} eaten{h.hungry > 0 ? ' · hungry' : ''} <span class="dim">{where}</span>
    </>
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
  const label = (item: QueueItem) => `${queueLabel(world, h, item)}${item.governor ? ' (governor)' : ''}`;
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
        const upkeep = item.kind === 'ship' ? RULES.credits.upkeep.ship : PROJECTS[item.project].upkeep;
        return (
          <li key={name}>
            <button
              type="button"
              class="build-option"
              disabled={refusal !== null}
              aria-label={`Queue ${withArticle(name.toLowerCase())}`}
              onClick={() => give(play, { type: 'queue', holding: h.id, item })}
            >
              <b>{name}</b>
              <span class="build-cost">
                {costText(costOf(world, game, h, item))} · upkeep {upkeep}
              </span>
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

const APPROVAL_WORD: Record<ApprovalLevel, string> = {
  content: 'Content',
  uneasy: 'Uneasy',
  unrest: 'Unrest',
  revolt: 'In revolt',
};

/** What a worked district of a zone yields here, in words: "3 food", "2 metals", "room for 2 million". */
export function zoneYieldText(world: World, game: GameState, h: Holding, zone: Zone): string {
  if (zone === 'housing') return 'room for 2 million';
  const n = zoneYield(world, game, h, zone);
  if (zone === 'mines') {
    const body = bodyOf(world, game, h);
    const r = body ? mainResource(body) : null;
    return r ? `${n} ${resourceWord(r)}` : 'nothing';
  }
  const word = { farms: 'food', works: 'industry', labs: 'research', market: 'credits' }[zone];
  return `${n} ${word}`;
}

/** A colony's governor and its priority (M2_WORLDS.md §25.1). */
function GovernorChoice({ h, play }: { h: Holding; play: Play }) {
  const set = (priority: Priority | null) => give(play, { type: 'governor', holding: h.id, priority });
  return (
    <section class="governor" aria-label="Governor">
      <h3>
        Governor <span class="dim">· {h.governor ? PRIORITY_DEFS[h.governor].name : 'none: you run it'}</span>
      </h3>
      <fieldset class="step-choices governor-choices">
        <legend class="visually-hidden">Governor</legend>
        <button type="button" class="step-choice" aria-pressed={h.governor === null} onClick={() => set(null)}>
          None
        </button>
        {PRIORITIES.map((p) => (
          <button key={p} type="button" class="step-choice" aria-pressed={h.governor === p} onClick={() => set(p)}>
            {PRIORITY_DEFS[p].name}
          </button>
        ))}
      </fieldset>
      <p class="dim">
        {h.governor
          ? `${PRIORITY_DEFS[h.governor].does} It never builds ships or lanes, changes taxes or buys industry, and says why it does what it does in the report. What you zone or queue yourself stays yours.`
          : 'A governor zones the land, chooses the work and builds projects for a priority, as each turn ends.'}
      </p>
    </section>
  );
}

/** The colony's districts (M2_WORLDS.md §2, §14): a tile for each, zoned or open; press one to zone it. */
function Districts({ world, game, h, play }: { world: World; game: GameState; h: Holding; play?: Play }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const n = districtCount(world, game, h);
  const worked = workedSlots(h);
  const queued = new Map(h.queue.flatMap((q) => (q.kind === 'zone' ? [[q.slot, q.zone] as const] : [])));
  const idle = idleMillions(h);
  const unworked = h.districts.filter((d) => ZONE_DEFS[d.zone].worked && !worked.has(d.slot)).length;
  const mine = play?.faction === h.owner;
  const slots = Array.from({ length: n }, (_, i) => i + 1);
  const open = chosen === null ? undefined : districtAt(h, chosen);
  return (
    <section class="districts" aria-label="Districts">
      <h3>
        Districts{' '}
        <span class="dim">
          · {h.districts.length} of {n} zoned
        </span>
      </h3>
      <p class="dim">
        A million people work each district; housing needs no one.
        {idle > 0 && ` ${idle} million have no district to work.`}
        {unworked > 0 &&
          ` ${unworked} district${unworked === 1 ? ' has' : 's have'} no one to work ${unworked === 1 ? 'it' : 'them'}.`}
      </p>
      <ul class="district-tiles">
        {slots.map((slot) => {
          const d = districtAt(h, slot);
          const next = queued.get(slot);
          const state = next
            ? `being zoned for ${ZONE_DEFS[next].name.toLowerCase()}`
            : !d
              ? 'open'
              : !ZONE_DEFS[d.zone].worked
                ? 'lived in'
                : worked.has(slot)
                  ? 'worked'
                  : 'no one to work it';
          const locked = h.locked.includes(slot);
          const label = d ? ZONE_DEFS[d.zone].name : 'Open';
          return (
            <li key={slot}>
              <button
                type="button"
                class={`district zone-${d?.zone ?? 'open'}${d && ZONE_DEFS[d.zone].worked && !worked.has(slot) ? ' is-unworked' : ''}${chosen === slot ? ' is-chosen' : ''}${locked ? ' is-locked' : ''}`}
                aria-pressed={chosen === slot}
                aria-label={`District ${slot}: ${label}, ${d ? zoneYieldText(world, game, h, d.zone) : 'nothing'}, ${state}${locked ? ', locked' : ''}`}
                disabled={!mine}
                onClick={() => setChosen(chosen === slot ? null : slot)}
              >
                <span class="district-name">{label}</span>
                <span class="district-yield">{d ? zoneYieldText(world, game, h, d.zone) : '—'}</span>
                <span class="district-state">
                  {state}
                  {locked && h.governor && <span class="district-lock"> · locked</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {mine && play && chosen !== null && (
        <fieldset class="district-choices" aria-label={`District ${chosen}`}>
          <p>
            <b>District {chosen}</b>{' '}
            <span class="dim">
              {open ? `${ZONE_DEFS[open.zone].name}: ${ZONE_DEFS[open.zone].does}` : 'Open land: zone it for a use.'}
            </span>
          </p>
          <ul class="build-options">
            {ZONES.filter((z) => z !== open?.zone).map((zone) => {
              const refusal = zoneRefusal(world, game, h, zone, chosen);
              const verb = open ? 'Rezone for' : 'Zone for';
              return (
                <li key={zone}>
                  <button
                    type="button"
                    class="build-option"
                    disabled={refusal !== null}
                    aria-label={`${verb} ${ZONE_DEFS[zone].name.toLowerCase()}`}
                    onClick={() => {
                      give(play, { type: 'queue', holding: h.id, item: { kind: 'zone', zone, slot: chosen } });
                      setChosen(null);
                    }}
                  >
                    <b>
                      {verb} {ZONE_DEFS[zone].name.toLowerCase()}
                    </b>
                    <span class="build-cost">
                      {costText(costOf(world, game, h, { kind: 'zone', zone, slot: chosen }))}
                    </span>
                    <span class="build-does">{refusal ?? `${zoneYieldText(world, game, h, zone)} here`}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {open && (
            <p class="district-actions">
              {ZONE_DEFS[open.zone].worked && h.districts[0]?.slot !== chosen && (
                <button
                  type="button"
                  class="button button-small"
                  onClick={() => give(play, { type: 'work-first', holding: h.id, slot: chosen })}
                >
                  Work it first
                </button>
              )}{' '}
              <button
                type="button"
                class="button button-quiet button-small"
                onClick={() => {
                  give(play, { type: 'clear-district', holding: h.id, slot: chosen });
                  setChosen(null);
                }}
              >
                Make it open
              </button>
            </p>
          )}
          {h.governor && h.locked.includes(chosen) && (
            <p class="district-actions">
              <span class="dim">You chose this district’s use: the governor leaves it alone.</span>{' '}
              <button
                type="button"
                class="button button-quiet button-small"
                onClick={() => give(play, { type: 'unlock', holding: h.id, slot: chosen })}
              >
                Let the governor have it
              </button>
            </p>
          )}
        </fieldset>
      )}
    </section>
  );
}

/** Overdrive (M2_WORLDS.md §4): industry bought with credits, each step dearer, drawn as a curve. */
function Overdrive({ world, game, h, play }: { world: World; game: GameState; h: Holding; play: Play }) {
  const base = industryOf(world, game, { ...h, overdrive: 0 }).total;
  const steps = [0, 1, 2, 3].map((n) => ({ n, ...overdriveOf(base, n) }));
  const most = Math.max(1, steps[3]?.credits ?? 1);
  const treasury = powerOf(game, h.owner).treasury;
  return (
    <section class="overdrive" aria-label="Overdrive">
      <p class="dim">
        Buy industry with credits each turn, a quarter of {base} a step; each step costs twice the last.
      </p>
      <fieldset class="step-choices overdrive-steps">
        <legend class="visually-hidden">Overdrive</legend>
        {steps.map((s) => (
          <button
            key={s.n}
            type="button"
            class="step-choice"
            aria-pressed={h.overdrive === s.n}
            disabled={s.n > h.overdrive && treasury <= 0}
            onClick={() => give(play, { type: 'overdrive', holding: h.id, steps: s.n })}
          >
            <span>{s.n === 0 ? 'Off' : `+${s.industry} for ${s.credits}`}</span>
            <span
              class="overdrive-bar"
              aria-hidden="true"
              style={{ height: `${Math.round((s.credits * 100) / most)}%` }}
            />
          </button>
        ))}
      </fieldset>
    </section>
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
            <dd>{growthText(world, game, h)}</dd>
            <dt>Approval</dt>
            <dd>
              <ApprovalText world={world} game={game} h={h} />
            </dd>
            <dt>Food</dt>
            <dd>
              <FoodText world={world} game={game} h={h} />
            </dd>
          </dl>
          <FigureLine label="Industry" {...industryOf(world, game, h)} />
          <FigureLine label="Credits" {...creditsOf(world, game, h)} />
        </>
      ) : (
        <p class="dim">Outposts have no people; they gather their world’s riches, and can build lanes.</p>
      )}
      <YieldsLine world={world} game={game} h={h} />
      {h.kind === 'outpost' && <FigureLine label="Industry" {...industryOf(world, game, h)} />}
      {h.kind === 'colony' && mine && play && <GovernorChoice h={h} play={play} />}
      {h.kind === 'colony' && <Districts world={world} game={game} h={h} play={play} />}
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
            Building <span class="dim">· {industryOf(world, game, h).total} industry a turn</span>
          </h3>
          <Queue world={world} game={game} h={h} play={play} table={table} />
          {h.kind === 'colony' && <Overdrive world={world} game={game} h={h} play={play} />}
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
  if (need.kind === 'debt')
    return need.turns === 0
      ? 'The treasury is in debt: every colony is unhappier until it is paid off.'
      : `The treasury will be in debt in ${need.turns} turn${need.turns === 1 ? '' : 's'}: raise taxes, zone markets or cut overdrive.`;
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
  if (need.kind === 'food') {
    const when = need.turns === 1 ? 'when this turn ends' : 'in two turns';
    if (need.home)
      return need.turns === 0
        ? 'The colonies on the capital’s lanes are hungry: zone farms.'
        : `Food on the capital’s lanes runs out ${when}: zone farms.`;
    return need.turns === 0
      ? `${name} is hungry: zone farms there, or join it to the capital’s lanes.`
      : `${name} goes hungry ${when}: zone farms there, or join it to the capital’s lanes.`;
  }
  if (need.kind === 'unrest')
    return need.revolt
      ? `${name} is in revolt: it makes and builds nothing until its approval rises.`
      : `${name} is in unrest: it makes less and does not grow.`;
  if (need.kind === 'unworked')
    return `${name} has ${need.districts} district${need.districts === 1 ? '' : 's'} with no one to work ${need.districts === 1 ? 'it' : 'them'}.`;
  const first = h.queue[0];
  const short = shortfall(world, game, h);
  return `${first ? queueLabel(world, h, first) : 'Its next item'} at ${name} waits for ${short ? missingText(short.missing) : 'resources'}.`;
}

type Tab = 'colonies' | 'outposts' | 'ships' | 'powers';
type ColonyKey = 'name' | 'system' | 'people' | 'industry' | 'approval';

const TAX_TEXT: Record<TaxRate, string> = {
  low: 'a credit for every 4 million people; approval +10',
  standard: 'a credit for every 2 million people',
  high: 'a credit for every million people; approval −15',
};

/** The treasury, the tax rate and food by network, at the head of the empire (M2_WORLDS.md §14). */
function Treasury({ world, game, faction, play }: { world: World; game: GameState; faction: FactionId; play?: Play }) {
  const power = powerOf(game, faction);
  const t = treasuryOf(world, game, faction);
  const nets = networksOf(world, game, faction);
  const home = nets.find((n) => n.home);
  const hf = home ? networkFood(world, game, faction, home) : null;
  const left = hf ? foodTurnsLeft(hf) : null;
  const cut = nets.filter((n) => !n.home);
  const hungry = cut.filter(
    (n) => networkFood(world, game, faction, n).made < networkFood(world, game, faction, n).eaten,
  );
  return (
    <section class="treasury" aria-label="Treasury and food">
      <AdvisorBy faction={faction} department="treasury" />
      <p class="figure">
        <b>
          Treasury {power.treasury} credits{power.treasury < 0 ? ' (in debt)' : ''}
        </b>{' '}
        <span class="dim">
          {t.total >= 0 ? '+' : '−'}
          {Math.abs(t.total)} a turn ={' '}
          {t.parts.map((p) => `${p.value >= 0 ? '' : '−'}${Math.abs(p.value)} ${p.label}`).join(', ')}
        </span>
      </p>
      <fieldset class="step-choices tax-choices">
        <legend class="visually-hidden">Taxes</legend>
        {(['low', 'standard', 'high'] as const).map((rate) => (
          <button
            key={rate}
            type="button"
            class="step-choice"
            aria-pressed={power.taxes === rate}
            disabled={!play}
            onClick={() => play && give(play, { type: 'taxes', rate })}
          >
            {rate[0]?.toUpperCase()}
            {rate.slice(1)}
          </button>
        ))}
      </fieldset>
      <p class="dim">
        {power.taxes[0]?.toUpperCase()}
        {power.taxes.slice(1)} taxes: {TAX_TEXT[power.taxes]}.
      </p>
      {hf && (
        <p class="figure">
          <b>Food {hf.store} in store</b>{' '}
          <span class="dim">
            on the capital's lanes: {hf.made} made, {hf.eaten} eaten a turn
            {left !== null ? `, enough for ${left} turn${left === 1 ? '' : 's'}` : ''}; it holds up to {hf.room}.
            {cut.length > 0 &&
              ` ${cut.reduce((n, c) => n + c.colonies.length, 0)} cut off from it, feeding themselves${hungry.length > 0 ? ` (${hungry.length} hungry)` : ''}.`}
          </span>
        </p>
      )}
    </section>
  );
}

/** The whole empire: colonies, outposts and ships, as cards (phone) or sortable tables (desktop). */
export function EmpireView({
  world,
  game,
  faction,
  play,
  table,
  shipsList,
  onHolding,
  onView,
}: {
  world: World;
  game: GameState;
  faction: FactionId;
  /** The player's game, to set the taxes. */
  play?: Play;
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
  const rivals = game.powers.length > 1;
  const known = standings(game, faction);
  const value = (h: Holding, key: ColonyKey): string | number =>
    key === 'name'
      ? holdingName(world, game, h)
      : key === 'system'
        ? world.system(h.system).name
        : key === 'people'
          ? h.people
          : key === 'approval'
            ? approvalOf(world, game, h).total
            : industryOf(world, game, h).total;
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
      <Treasury world={world} game={game} faction={faction} play={play} />
      {play && <Edicts world={world} game={game} faction={faction} play={play} />}
      <div class="view-toggle empire-tabs" role="tablist">
        {(
          [
            ['colonies', `Colonies ${colonies.length}`],
            ['outposts', `Outposts ${outposts.length}`],
            ['ships', `Ships ${ships.length}`],
            ...(rivals ? ([['powers', `Powers ${known.length}`]] as const) : []),
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
                {head('approval', 'Approval')}
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
                  <td>{industryOf(world, game, h).total}</td>
                  <td class={`approval-${approvalOf(world, game, h).level}`}>
                    {approvalOf(world, game, h).total} {APPROVAL_WORD[approvalOf(world, game, h).level].toLowerCase()}
                    {h.hungry > 0 ? ' · hungry' : ''}
                  </td>
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
                    {industryOf(world, game, h).total} · {APPROVAL_WORD[approvalOf(world, game, h).level].toLowerCase()}
                    {h.hungry > 0 ? ' · hungry' : ''}
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
      {tab === 'powers' && <Standings game={game} faction={faction} rows={known} />}
    </section>
  );
}

/** The standings (M2_WORLDS.md §26.5): your power in full, the others as far as you can see them. */
function Standings({ game, faction, rows }: { game: GameState; faction: FactionId; rows: readonly Standing[] }) {
  const unmet = game.powers.filter((p) => !rows.some((r) => r.faction === p.faction)).map((p) => p.faction);
  return (
    <div class="standings">
      <table class="empire-table standings-table">
        <thead>
          <tr>
            <th scope="col">Power</th>
            <th scope="col">Colonies</th>
            <th scope="col">Outposts</th>
            <th scope="col">People</th>
            <th scope="col">Lanes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.faction}>
              <th scope="row">
                <FactionTag faction={r.faction} />
                {r.faction === faction && <span class="dim"> · you</span>}
              </th>
              <td>{r.colonies}</td>
              <td>{r.outposts}</td>
              <td>{millions(r.people)} m</td>
              <td>{r.lanes}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p class="dim">
        Yours in full; the others’ only as far as you can see: in systems you have surveyed. You have researched{' '}
        {rows[0]?.technologies ?? 0} technolog{rows[0]?.technologies === 1 ? 'y' : 'ies'}.
      </p>
      {unmet.length > 0 && (
        <p class="dim">
          Not yet seen:{' '}
          {unmet.map((f, i) => (
            <span key={f}>
              {i > 0 && (i === unmet.length - 1 ? ' and ' : ', ')}the {FACTIONS[f].shortName}
            </span>
          ))}
          .
        </p>
      )}
    </div>
  );
}

function yieldsText(world: World, game: GameState, h: Holding): string {
  const t = yieldsOf(world, game, h).total;
  const parts = (Object.keys(t) as Resource[]).filter((r) => t[r] > 0).map((r) => `+${t[r]} ${resourceWord(r)}`);
  return parts.length > 0 ? parts.join(', ') : 'nothing';
}

/** Edicts (M2_WORLDS.md §25.2): attention, what is in force, and each edict with its cost and its turns. */
function Edicts({ world, game, faction, play }: { world: World; game: GameState; faction: FactionId; play: Play }) {
  const [choosing, setChoosing] = useState<EdictId | null>(null);
  if (settings.value.edicts === 'off') return null;
  const power = powerOf(game, faction);
  const colonies = game.holdings.filter((h) => h.owner === faction && h.kind === 'colony');
  const name = (id: number | null) => {
    const h = game.holdings.find((x) => x.id === id);
    return h ? holdingName(world, game, h) : '';
  };
  return (
    <section class="edicts" aria-label="Edicts">
      <p class="figure">
        <b>Attention {power.attention}</b>{' '}
        <span class="dim">
          of {RULES.attention.most}, +{RULES.attention.perTurn} a turn: edicts spend it; nothing else does.
        </span>
      </p>
      {power.edicts.length > 0 && (
        <ul class="edicts-in-force">
          {power.edicts.map((e) => (
            <li key={e.edict}>
              <b>{EDICTS[e.edict].name}</b>
              {e.holding !== null ? ` at ${name(e.holding)}` : ''}{' '}
              <span class="dim">
                · {e.left} turn{e.left === 1 ? '' : 's'} left
              </span>
            </li>
          ))}
        </ul>
      )}
      <ul class="build-options edict-options">
        {EDICT_IDS.map((id) => {
          const def = EDICTS[id];
          const inForce = power.edicts.some((e) => e.edict === id);
          const refusal =
            def.target === 'power'
              ? refuse(world, game, faction, { type: 'edict', edict: id })
              : inForce
                ? `A ${def.name.toLowerCase()} is already in force.`
                : power.attention < def.cost
                  ? `Not enough attention: it needs ${def.cost}.`
                  : null;
          return (
            <li key={id}>
              <button
                type="button"
                class="build-option"
                disabled={refusal !== null}
                aria-expanded={def.target === 'colony' ? choosing === id : undefined}
                aria-label={`${def.target === 'colony' ? 'Choose a colony for' : 'Issue'} ${def.name.toLowerCase()}`}
                onClick={() => {
                  if (def.target === 'power') give(play, { type: 'edict', edict: id });
                  else setChoosing(choosing === id ? null : id);
                }}
              >
                <b>{def.name}</b>
                <span class="build-cost">
                  {def.cost} attention · {def.turns} turns
                </span>
                <span class="build-does">{refusal ?? def.does}</span>
              </button>
              {choosing === id && refusal === null && (
                <ul class="edict-targets" aria-label={`Colonies for ${def.name.toLowerCase()}`}>
                  {colonies.map((h) => {
                    const why = refuse(world, game, faction, { type: 'edict', edict: id, holding: h.id });
                    return (
                      <li key={h.id}>
                        <button
                          type="button"
                          class="button button-small"
                          disabled={why !== null}
                          title={why ?? undefined}
                          onClick={() => {
                            give(play, { type: 'edict', edict: id, holding: h.id });
                            setChoosing(null);
                          }}
                        >
                          {holdingName(world, game, h)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
