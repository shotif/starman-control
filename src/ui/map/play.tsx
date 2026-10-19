// The parts of the map screen that exist only in a game (M1_TURNS.md §6): resources, ships and their
// orders, choosing where a ship goes, the report, and what needs you. The same parts serve both
// layouts; the map screen places them as sheets on a phone and as panels on a desktop.

import { useState } from 'preact/hooks';
import { FACTIONS, type FactionId } from '../../content/factions.ts';
import { SHIPS } from '../../content/ships.ts';
import type { SystemId } from '../../data/types.ts';
import { formatDate } from '../../sim/calendar.ts';
import { formatLy } from '../../sim/geometry.ts';
import { blindJumpTurns, blindReachDeci, canJumpBlind, previewMove } from '../../sim/movement.ts';
import type { Need } from '../../sim/needs.ts';
import type { Order } from '../../sim/orders.ts';
import type { ReportEvent } from '../../sim/report.ts';
import type { GameState, PowerState, ShipState } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';
import { FactionMark } from '../parts.tsx';
import { say, targeting } from './state.ts';

export interface Play {
  faction: FactionId;
  order(o: Order): string | null;
  endTurn(): Promise<void>;
  leave(): Promise<void>;
  resolving: boolean;
  needs: readonly Need[];
}

/** Gives an order and says why if it is refused. Returns whether it was given. */
export function give(play: Play, o: Order): boolean {
  const reason = play.order(o);
  if (reason) say(reason);
  return reason === null;
}

export function Resources({ power }: { power: PowerState }) {
  const s = power.stockpile;
  return (
    <ul class="resources" aria-label="Stockpile">
      <li title="Metals">
        <span class="res-icon res-metals" aria-hidden="true" />
        <b>{s.metals}</b>
        <span class="res-name"> metals</span>
      </li>
      <li title="Volatiles">
        <span class="res-icon res-volatiles" aria-hidden="true" />
        <b>{s.volatiles}</b>
        <span class="res-name"> volatiles</span>
      </li>
      <li title="Fusion fuel">
        <span class="res-icon res-fuel" aria-hidden="true" />
        <b>{s.fuel}</b>
        <span class="res-name"> fusion fuel</span>
      </li>
    </ul>
  );
}

/** "Idle at Tau Ceti", "Bound for Epsilon Eridani: 1 turn", "On a blind jump to Ross 128: lands next turn". */
export function shipStatus(world: World, game: GameState, ship: ShipState): string {
  const j = ship.blindJump;
  if (j && ship.at === null)
    return `On a blind jump to ${world.system(j.to).name}: lands ${j.left <= 1 ? 'when this turn ends' : `in ${j.left} turns`}`;
  const here = ship.at ? world.system(ship.at).name : 'nowhere';
  if (j) return `At ${here}, to jump blind for ${world.system(j.to).name} (${j.turns} turn${j.turns > 1 ? 's' : ''})`;
  if (ship.destinations.length > 0) {
    const p = previewMove(world, game, ship, ship.destinations);
    const last = world.system(ship.destinations.at(-1) as SystemId).name;
    const via =
      ship.destinations.length > 1
        ? `, by ${ship.destinations.length - 1} waypoint${ship.destinations.length > 2 ? 's' : ''}`
        : '';
    return p
      ? `At ${here}, bound for ${last}${via}: ${p.turns} turn${p.turns === 1 ? '' : 's'}`
      : `At ${here}, bound for ${last}`;
  }
  if (ship.hold) return `Holding at ${here}`;
  return `Idle at ${here}`;
}

export function ShipPanel({
  world,
  game,
  ship,
  play,
  onGo,
}: {
  world: World;
  game: GameState;
  ship: ShipState;
  play: Play;
  onGo: (id: SystemId) => void;
}) {
  const def = SHIPS[ship.type];
  const moving = ship.destinations.length > 0 || ship.blindJump !== null;
  const inFlight = ship.at === null;
  const reach = blindReachDeci(game, ship.owner);
  return (
    <article class="ship-panel" aria-label={ship.name}>
      {ship.at && (
        <button type="button" class="link back-link" onClick={() => onGo(ship.at as SystemId)}>
          ← {world.system(ship.at).name}
        </button>
      )}
      <header>
        <h2>
          <FactionMark faction={ship.owner} size={14} /> {ship.name}
        </h2>
        <p class="system-kind">{def.name}</p>
        <p class="ship-status">{shipStatus(world, game, ship)}</p>
      </header>
      <p class="dim">{def.does}</p>
      {!inFlight && (
        <div class="ship-actions">
          <button
            type="button"
            class="button button-primary"
            onClick={() => {
              targeting.value = { ship: ship.id, blind: false, to: null };
            }}
          >
            Move
          </button>
          {canJumpBlind(ship) && (
            <button
              type="button"
              class="button"
              onClick={() => {
                targeting.value = { ship: ship.id, blind: true, to: null };
              }}
            >
              Jump blind
            </button>
          )}
          {moving && (
            <button
              type="button"
              class="button button-quiet"
              onClick={() => give(play, { type: 'stop', ship: ship.id })}
            >
              Stop
            </button>
          )}
          <button
            type="button"
            class="button button-quiet"
            aria-pressed={ship.hold}
            onClick={() => give(play, { type: 'hold', ship: ship.id, hold: !ship.hold })}
          >
            {ship.hold ? 'Stop holding' : 'Hold here'}
          </button>
        </div>
      )}
      {ship.type === 'survey' && (
        <label class="check">
          <input
            type="checkbox"
            checked={ship.autoSurvey}
            onChange={(e) =>
              give(play, { type: 'auto-survey', ship: ship.id, on: (e.target as HTMLInputElement).checked })
            }
          />
          Survey each new system it enters (it stops there for the turn)
        </label>
      )}
      {canJumpBlind(ship) && (
        <p class="dim">
          A blind jump reaches any star within {formatLy(reach)}, with no lane, taking a turn for every 3 ly.
        </p>
      )}
      {ship.type !== 'survey' && <p class="dim">Founding colonies and outposts arrives with the next update.</p>}
    </article>
  );
}

/** Every ship of the player's, idle ones first. */
export function ShipsList({
  world,
  game,
  faction,
  onPick,
}: {
  world: World;
  game: GameState;
  faction: FactionId;
  onPick: (id: number) => void;
}) {
  const idle = (s: ShipState) => s.at !== null && s.destinations.length === 0 && !s.blindJump && !s.hold;
  const ships = game.ships
    .filter((s) => s.owner === faction)
    .sort((a, b) => Number(idle(b)) - Number(idle(a)) || a.id - b.id);
  return (
    <ul class="ships-list">
      {ships.map((s) => (
        <li key={s.id}>
          <button type="button" class="ship-row" onClick={() => onPick(s.id)}>
            <span class="ship-chevron" style={{ '--faction': FACTIONS[s.owner].colour }} aria-hidden="true" />
            <b>{s.name}</b>
            <span class="ship-type">{SHIPS[s.type].name}</span>
            <span class="ship-line">{shipStatus(world, game, s)}</span>
            {idle(s) && <span class="needs-tag">Idle</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

function eventText(world: World, game: GameState, e: ReportEvent): string {
  const ship = game.ships.find((s) => s.id === e.ship)?.name ?? 'A ship';
  const name = (id: SystemId) => world.system(id).name;
  switch (e.kind) {
    case 'surveyed': {
      const n = e.habitable.length;
      return `${ship} surveyed ${name(e.system)}: ${e.worlds} world${e.worlds === 1 ? '' : 's'}${
        n > 0 ? `, ${n} your people could live on` : ', none your people could live on without domes'
      }.`;
    }
    case 'arrived':
      return `${ship} reached ${name(e.system)}.`;
    case 'jumped':
      return `${ship} jumped blind for ${name(e.to)}: ${e.turns} turn${e.turns === 1 ? '' : 's'} out of contact.`;
    case 'landed':
      return `${ship} came out of its blind jump at ${name(e.system)}.`;
    case 'blocked':
      return `${ship} could not go on to ${name(e.to)}: no open lane leads there.`;
  }
}

function eventPlace(e: ReportEvent): SystemId {
  return e.kind === 'jumped' ? e.to : e.system;
}

export function ReportView({
  world,
  game,
  faction,
  needs,
  onGo,
}: {
  world: World;
  game: GameState;
  faction: FactionId;
  needs: number;
  onGo: (id: SystemId) => void;
}) {
  const r = game.reports.find((x) => x.faction === faction);
  return (
    <section class="report" aria-label="Report">
      <h2 class="report-title">{r ? `${formatDate(r.turn)}: what happened` : 'Report'}</h2>
      {!r && <p class="dim">The first report comes when you end the first turn.</p>}
      {r && r.events.length === 0 && <p class="dim">A quiet quarter: nothing to report.</p>}
      {r && r.events.length > 0 && (
        <ul class="report-items">
          {r.events.map((e, i) => (
            <li key={`${e.kind}-${e.ship}-${i}`} class={`report-${e.kind}`}>
              <button type="button" class="link" onClick={() => onGo(eventPlace(e))}>
                {eventText(world, game, e)}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p class="report-needs">
        {needs === 0
          ? 'Nothing needs you.'
          : `${needs} thing${needs === 1 ? '' : 's'} need${needs === 1 ? 's' : ''} you.`}{' '}
        Now {formatDate(game.turn)}.
      </p>
    </section>
  );
}

/** What needs you, one card at a time (phone), before the turn ends. */
export function NeedsStack({
  world,
  game,
  needs,
  onOrders,
  onEnd,
  onClose,
}: {
  world: World;
  game: GameState;
  needs: readonly Need[];
  onOrders: (ship: number) => void;
  onEnd: () => void;
  onClose: () => void;
}) {
  const [at, setAt] = useState(0);
  const need = needs[at];
  return (
    <div class="needs-stack" role="dialog" aria-label="What needs you">
      <div class="needs-card">
        {need ? (
          <>
            <p class="needs-count">
              {at + 1} of {needs.length} need you
            </p>
            <p>
              {(() => {
                const s = game.ships.find((x) => x.id === need.ship);
                return s ? `${SHIPS[s.type].name} ${s.name} is idle at ${world.system(need.system).name}.` : '';
              })()}
            </p>
            <div class="needs-actions">
              <button type="button" class="button button-primary" onClick={() => onOrders(need.ship)}>
                Give orders
              </button>
              <button type="button" class="button button-quiet" onClick={() => setAt(at + 1)}>
                Skip
              </button>
            </div>
          </>
        ) : (
          <p>That is everything.</p>
        )}
        <div class="needs-actions">
          <button type="button" class="button" onClick={onEnd}>
            End turn{need ? ' anyway' : ''}
          </button>
          <button type="button" class="button button-quiet" onClick={onClose}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

/** The preview of where a ship would go, before the order is confirmed (both layouts). */
export function planFor(
  world: World,
  game: GameState,
  ship: ShipState,
  to: SystemId,
  blind: boolean,
): { ok: true; text: string; path: SystemId[]; blind: boolean } | { ok: false; text: string } {
  if (ship.at === null) return { ok: false, text: `${ship.name} is on a blind jump.` };
  if (to === ship.at) return { ok: false, text: `${ship.name} is already there.` };
  const name = world.system(to).name;
  if (!blind) {
    const p = previewMove(world, game, ship, [to]);
    if (p)
      return {
        ok: true,
        text: `${ship.name} → ${name}: ${p.jumps} jump${p.jumps === 1 ? '' : 's'}, ${p.turns} turn${p.turns === 1 ? '' : 's'}`,
        path: [ship.at, ...p.hops.map((h) => h.to)],
        blind: false,
      };
    if (!canJumpBlind(ship)) return { ok: false, text: `No open lane leads to ${name}.` };
  }
  if (!canJumpBlind(ship)) return { ok: false, text: 'Only survey ships can jump without a lane.' };
  const d = world.distanceDeci(ship.at, to);
  const reach = blindReachDeci(game, ship.owner);
  if (d > reach)
    return {
      ok: false,
      text: `${name} is ${formatLy(d)} away: too far to jump blind (reach ${formatLy(reach)})${blind ? '' : ', and no open lane leads there'}.`,
    };
  const turns = blindJumpTurns(d);
  return {
    ok: true,
    text: `${ship.name} → ${name}: a blind jump of ${formatLy(d)}, ${turns} turn${turns === 1 ? '' : 's'}`,
    path: [ship.at, to],
    blind: true,
  };
}

export function TargetBar({ world, game, play }: { world: World; game: GameState; play: Play }) {
  const t = targeting.value;
  if (!t) return null;
  const ship = game.ships.find((s) => s.id === t.ship);
  if (!ship) return null;
  const plan = t.to ? planFor(world, game, ship, t.to, t.blind) : null;
  const confirm = () => {
    if (!t.to || !plan?.ok) return;
    const ok = give(
      play,
      plan.blind ? { type: 'blind-jump', ship: ship.id, to: t.to } : { type: 'move', ship: ship.id, to: t.to },
    );
    if (ok) targeting.value = null;
  };
  return (
    <div class="target-bar" role="dialog" aria-label="Choose a destination" data-covers-map>
      <p>
        {plan
          ? plan.text
          : t.blind
            ? `Choose a star within ${formatLy(blindReachDeci(game, ship.owner))} for ${ship.name} to jump to.`
            : `Choose where ${ship.name} goes.`}
      </p>
      <div class="target-actions">
        {plan?.ok && (
          <button type="button" class="button button-primary" onClick={confirm}>
            Confirm
          </button>
        )}
        <button
          type="button"
          class="button button-quiet"
          onClick={() => {
            targeting.value = null;
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
