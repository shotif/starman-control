// A fleet's panel and the list of fleets (M4_FLEETS.md §22.3, D-61): its ships, its strength, where it
// goes, its orders for battle, and splitting, merging and joining. The same parts serve both layouts;
// the map screen places the panel as a sheet on a phone and in the inspector on a desktop.

import { useSignal } from '@preact/signals';
import { FACTIONS } from '../../content/factions.ts';
import { SHIPS } from '../../content/ships.ts';
import type { SystemId } from '../../data/types.ts';
import { designStats, shipDesign } from '../../sim/designs.ts';
import {
  FLEET_NAME_MOST,
  fleetAt,
  fleetShips,
  fleetStats,
  previewFleetMove,
  RETREATS,
  STANCES,
  TARGETS,
} from '../../sim/fleets.ts';
import type { Fleet, GameState, RetreatPoint, Stance, TargetPriority } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';
import { FactionMark } from '../parts.tsx';
import { holdingName } from './colony.tsx';
import { FleetMissions } from './invasion.tsx';
import { give, type Play } from './play.tsx';
import { targeting } from './state.ts';
import './fleets.css';
import { LeaderLine } from './leaders.tsx';

export const STANCE_WORDS: Record<Stance, { name: string; does: string }> = {
  engage: { name: 'Engage', does: 'closes to close range and fights it out' },
  defend: { name: 'Defend', does: 'holds at middle range where it stands' },
  evade: { name: 'Evade', does: 'keeps to long range and leaves when it can' },
};

export const TARGET_WORDS: Record<TargetPriority, string> = {
  warships: 'Warships first',
  largest: 'The largest first',
  smallest: 'The smallest first',
  transports: 'Transports first',
};

export function retreatWords(r: RetreatPoint): string {
  return r === 100 ? 'Never' : r === 25 ? 'A quarter lost' : r === 50 ? 'Half lost' : 'Three quarters lost';
}

/** Where a fleet is and what it is doing, in a line. */
export function fleetStatus(world: World, game: GameState, fleet: Fleet): string {
  const at = fleetAt(game, fleet);
  const here = at ? world.system(at).name : 'nowhere';
  // Its mission (M4_FLEETS.md §26.9).
  const m = fleet.mission;
  const target = m ? game.holdings.find((h) => h.id === m.holding) : undefined;
  if (m && target)
    return `${m.kind === 'invade' ? 'Invading' : m.kind === 'raid' ? 'Raiding' : 'Bombarding'} ${holdingName(world, game, target)} at ${here}`;
  if (fleet.hold) return `Holding at ${here}`;
  const dest = fleet.destinations.at(-1);
  if (!dest) return `At ${here}`;
  const p = previewFleetMove(world, game, fleet, fleet.destinations);
  const turns = p ? `, ${p.turns} turn${p.turns === 1 ? '' : 's'}` : '';
  return `At ${here}, bound for ${world.system(dest).name}${turns}`;
}

/** "3 warships, 1 colony ship". */
export function fleetLine(game: GameState, fleet: Fleet): string {
  const st = fleetStats(game, fleet);
  const transports = fleetShips(game, fleet).filter((s) => s.type === 'transport').length;
  const civil = st.ships - st.warships - transports;
  const parts = st.warships > 0 || st.ships === 0 ? [`${st.warships} warship${st.warships === 1 ? '' : 's'}`] : [];
  if (transports > 0) parts.push(`${transports} transport${transports === 1 ? '' : 's'}`);
  if (civil > 0) parts.push(`${civil} other ship${civil === 1 ? '' : 's'}`);
  return parts.join(', ');
}

/** A route planned for a fleet, as the target bar shows it (§22.3). */
export function planForFleet(
  world: World,
  game: GameState,
  fleet: Fleet,
  to: SystemId,
): { ok: true; text: string; path: SystemId[]; blind: false } | { ok: false; text: string } {
  const at = fleetAt(game, fleet);
  if (at === null) return { ok: false, text: `The ${fleet.name} has no ships.` };
  if (to === at) return { ok: false, text: `The ${fleet.name} is already there.` };
  const name = world.system(to).name;
  const p = previewFleetMove(world, game, fleet, [to]);
  if (!p) return { ok: false, text: `No open lane leads to ${name}.` };
  return {
    ok: true,
    text: `The ${fleet.name} → ${name}: ${p.jumps} jump${p.jumps === 1 ? '' : 's'}, ${p.turns} turn${p.turns === 1 ? '' : 's'}`,
    path: [at, ...p.hops.map((h) => h.to)],
    blind: false,
  };
}

function Choices<T extends string | number>({
  label,
  values,
  value,
  words,
  onPick,
}: {
  label: string;
  values: readonly T[];
  value: T;
  words: (v: T) => string;
  onPick: (v: T) => void;
}) {
  return (
    <fieldset class="fleet-choices">
      <legend>{label}</legend>
      {values.map((v) => (
        <button
          key={String(v)}
          type="button"
          class="toggle-option"
          aria-pressed={v === value}
          onClick={() => {
            if (v !== value) onPick(v);
          }}
        >
          {words(v)}
        </button>
      ))}
    </fieldset>
  );
}

export function FleetPanel({
  world,
  game,
  fleet,
  play,
  onGo,
  onShip,
  onFleet,
}: {
  world: World;
  game: GameState;
  fleet: Fleet;
  play: Play;
  onGo: (id: SystemId) => void;
  onShip: (id: number) => void;
  onFleet: (id: number) => void;
}) {
  const ships = fleetShips(game, fleet);
  const at = fleetAt(game, fleet);
  const st = fleetStats(game, fleet);
  const ticked = useSignal<number[]>([]);
  const naming = useSignal<string | null>(null);
  const moving = fleet.destinations.length > 0;
  const others = game.fleets.filter((f) => f.owner === fleet.owner && f.id !== fleet.id && fleetAt(game, f) === at);
  const civil = game.ships.filter(
    (s) => s.owner === fleet.owner && s.at === at && s.fleet === null && s.type !== 'survey' && !s.blindJump,
  );
  const orders = (o: { stance?: Stance; target?: TargetPriority; retreat?: RetreatPoint }) =>
    give(play, { type: 'fleet-orders', fleet: fleet.id, ...o });
  return (
    <article class="fleet-panel" aria-label={fleet.name}>
      {at && (
        <button type="button" class="link back-link" onClick={() => onGo(at)}>
          ← {world.system(at).name}
        </button>
      )}
      <header>
        <h2>
          <FactionMark faction={fleet.owner} size={14} /> {fleet.name}
        </h2>
        <p class="system-kind">
          A {FACTIONS[fleet.owner].fleetWord.toLowerCase()}: {fleetLine(game, fleet)}
        </p>
        <p class="ship-status">{fleetStatus(world, game, fleet)}</p>
      </header>
      <LeaderLine game={game} faction={fleet.owner} calling="commander" post={fleet.id} />
      {naming.value === null ? (
        <button
          type="button"
          class="link"
          onClick={() => {
            naming.value = fleet.name;
          }}
        >
          Rename
        </button>
      ) : (
        <form
          class="fleet-rename"
          onSubmit={(e) => {
            e.preventDefault();
            if (give(play, { type: 'rename-fleet', fleet: fleet.id, name: naming.value ?? '' })) naming.value = null;
          }}
        >
          <input
            type="text"
            aria-label="The fleet’s name"
            value={naming.value}
            maxLength={FLEET_NAME_MOST}
            onInput={(e) => {
              naming.value = (e.target as HTMLInputElement).value;
            }}
          />
          <button type="submit" class="button button-small">
            Name it
          </button>
        </form>
      )}
      <p class="design-stats">
        <span>
          Attack <b>{st.attack}</b>
        </span>
        <span>
          Shields <b>{st.shields}</b>
        </span>
        <span>
          Structure <b>{st.left < st.structure ? `${st.left} of ${st.structure}` : st.structure}</b>
        </span>
      </p>
      <div class="ship-actions">
        <button
          type="button"
          class="button button-primary"
          onClick={() => {
            targeting.value = { fleet: fleet.id, blind: false, to: null };
          }}
        >
          Move
        </button>
        {moving && (
          <button
            type="button"
            class="button button-quiet"
            onClick={() => give(play, { type: 'fleet-stop', fleet: fleet.id })}
          >
            Stop
          </button>
        )}
        <button
          type="button"
          class="button button-quiet"
          aria-pressed={fleet.hold}
          onClick={() => give(play, { type: 'fleet-hold', fleet: fleet.id, hold: !fleet.hold })}
        >
          {fleet.hold ? 'Stop holding' : 'Hold here'}
        </button>
      </div>

      {at && <FleetMissions world={world} game={game} fleet={fleet} play={play} at={at} />}

      <section class="fleet-battle" aria-label="In battle">
        <h3>In battle</h3>
        <p class="dim">
          Kept for when it fights: several fleets in one battle each fight by their own orders.{' '}
          {STANCE_WORDS[fleet.stance].name}: it {STANCE_WORDS[fleet.stance].does}.
        </p>
        <Choices
          label="Stance"
          values={STANCES}
          value={fleet.stance}
          words={(v) => STANCE_WORDS[v].name}
          onPick={(stance) => orders({ stance })}
        />
        <Choices
          label="Target"
          values={TARGETS}
          value={fleet.target}
          words={(v) => TARGET_WORDS[v]}
          onPick={(target) => orders({ target })}
        />
        <Choices
          label="Retreat"
          values={RETREATS}
          value={fleet.retreat}
          words={retreatWords}
          onPick={(retreat) => orders({ retreat })}
        />
      </section>

      <section aria-label="Its ships">
        <h3>Its ships</h3>
        <ul class="fleet-ships">
          {ships.map((s) => {
            const d = shipDesign(game, s);
            const whole = d ? designStats(d).structure : 0;
            const left = whole - Math.ceil(s.damage / 10);
            const line = d
              ? `${d.name}: attack ${designStats(d).attack}, structure ${left < whole ? `${left} of ${whole}` : whole}`
              : SHIPS[s.type].name;
            return (
              <li key={s.id}>
                {ships.length > 1 && (
                  <input
                    type="checkbox"
                    aria-label={`Tick the ${s.name}`}
                    checked={ticked.value.includes(s.id)}
                    onChange={(e) => {
                      const on = (e.target as HTMLInputElement).checked;
                      ticked.value = on ? [...ticked.value, s.id] : ticked.value.filter((x) => x !== s.id);
                    }}
                  />
                )}
                <button type="button" class="link" onClick={() => onShip(s.id)}>
                  <b>{s.name}</b>
                </button>{' '}
                <span class="dim">{line}</span>
              </li>
            );
          })}
        </ul>
        {ships.length > 1 && (
          <button
            type="button"
            class="button button-small"
            disabled={ticked.value.length === 0}
            onClick={() => {
              if (give(play, { type: 'split-fleet', fleet: fleet.id, ships: ticked.value })) ticked.value = [];
            }}
          >
            Split off the ships ticked
          </button>
        )}
      </section>

      {(others.length > 0 || civil.length > 0) && (
        <section aria-label="Here too">
          <h3>Here too</h3>
          <ul class="fleet-here">
            {others.map((f) => (
              <li key={`f${f.id}`}>
                <button type="button" class="link" onClick={() => onFleet(f.id)}>
                  {f.name}
                </button>{' '}
                <span class="dim">{fleetLine(game, f)}</span>{' '}
                <button
                  type="button"
                  class="button button-quiet button-small"
                  onClick={() => give(play, { type: 'merge-fleet', fleet: f.id, into: fleet.id })}
                >
                  Merge it into the {fleet.name}
                </button>
              </li>
            ))}
            {civil.map((s) => (
              <li key={`s${s.id}`}>
                <b>{s.name}</b> <span class="dim">{SHIPS[s.type].name}</span>{' '}
                <button
                  type="button"
                  class="button button-quiet button-small"
                  onClick={() => give(play, { type: 'join-fleet', ship: s.id, fleet: fleet.id })}
                >
                  Add it to the {fleet.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

/** A power's fleets, as rows to choose. */
export function FleetRows({
  world,
  game,
  fleets,
  onFleet,
}: {
  world: World;
  game: GameState;
  fleets: readonly Fleet[];
  onFleet: (id: number) => void;
}) {
  return (
    <ul class="ships-list fleets-list">
      {fleets.map((f) => (
        <li key={f.id}>
          <button type="button" class="ship-row fleet-row" onClick={() => onFleet(f.id)}>
            <span class="fleet-wedge" style={{ '--faction': FACTIONS[f.owner].colour }} aria-hidden="true" />
            <b>{f.name}</b>
            <span class="ship-type">{fleetLine(game, f)}</span>
            <span class="ship-line">{fleetStatus(world, game, f)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
