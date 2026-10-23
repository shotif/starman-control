// The systems list (M6_ONE.md §21.2): the map as words, for a screen reader and anyone who would
// rather read than look. Every system, nearest our capital first, with whose holdings are there, what
// we know of it, and a choice that selects it as the map does.

import { useState } from 'preact/hooks';
import type { FactionId } from '../../content/factions.ts';
import type { SystemId } from '../../data/types.ts';
import { formatLy } from '../../sim/geometry.ts';
import { siteAt, siteKnown } from '../../sim/relics.ts';
import { type GameState, powerOf } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';
import { FactionTag } from '../parts.tsx';

/** Systems shown before *Show all*. */
const FIRST = 40;

export function SystemsList({
  world,
  game,
  faction,
  onGo,
}: {
  world: World;
  game: GameState;
  faction: FactionId;
  onGo: (id: SystemId) => void;
}) {
  const [all, setAll] = useState(false);
  const power = powerOf(game, faction);
  const rows = world.systems
    .map((s) => s.id)
    .sort((a, b) => world.distanceDeci(power.capital, a) - world.distanceDeci(power.capital, b) || (a < b ? -1 : 1));
  const shown = all ? rows : rows.slice(0, FIRST);
  return (
    <div class="systems-list">
      <p class="dim">
        Every system on the map, nearest our capital first: {rows.length} in all. Choose one to see it on the map.
      </p>
      <ol>
        {shown.map((id) => {
          const holders = [...new Set(game.holdings.filter((h) => h.system === id).map((h) => h.owner))];
          const ours = game.holdings.filter((h) => h.system === id && h.owner === faction);
          const site = siteAt(world, game.seed, id);
          const known = site !== null && siteKnown(world, game, power, id);
          return (
            <li key={id}>
              <button type="button" class="link systems-row" onClick={() => onGo(id)}>
                <b>{world.system(id).name}</b>
              </button>{' '}
              <span class="dim">{formatLy(world.distanceDeci(power.capital, id))}</span>
              {ours.length > 0 && (
                <span>
                  {' '}
                  · ours: {ours.map((h) => h.kind).join(', ')}
                  {ours.some((h) => h.capital) ? ' (our capital)' : ''}
                </span>
              )}
              {holders
                .filter((f) => f !== faction)
                .map((f) => (
                  <span key={f}>
                    {' '}
                    · <FactionTag faction={f} />
                  </span>
                ))}
              <span class="dim"> · {power.surveyed.includes(id) ? 'surveyed' : 'not surveyed'}</span>
              {known && <span> · a relic site</span>}
            </li>
          );
        })}
      </ol>
      {!all && rows.length > FIRST && (
        <button type="button" class="button button-small button-quiet" onClick={() => setAll(true)}>
          Show all {rows.length}
        </button>
      )}
    </div>
  );
}
