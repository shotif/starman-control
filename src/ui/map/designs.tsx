// The designs, the Admiral's (M4_FLEETS.md §21.7, D-59): every warship design that can be built, by
// hull, with what it adds up to; a new design from the yard's, a module chosen for each place; and
// designs retired. On a phone a sheet, the design being made opened under its hull; on a desktop a
// panel with the design being made beside the list.

import { useSignal } from '@preact/signals';
import type { FactionId } from '../../content/factions.ts';
import { MODULES, type ModuleId, type ModuleKind, RANGE_WORDS } from '../../content/modules.ts';
import { type HullId, SHIPS } from '../../content/ships.ts';
import {
  buildable,
  DESIGN_NAME_MOST,
  type DesignStats,
  designRefusal,
  designStats,
  knownHulls,
  knownModules,
  yardModules,
} from '../../sim/designs.ts';
import { type Design, type GameState, powerOf } from '../../sim/state.ts';
import { AdvisorBy } from './advisor.tsx';
import { costText } from './colony.tsx';
import { give, type Play } from './play.tsx';
import './designs.css';

const KIND_NAMES: Record<ModuleKind, string> = {
  weapon: 'Weapons',
  shield: 'Shields',
  armour: 'Armour',
  special: 'Specials',
};

/** A module in a few words: "energy, 5 a shot, best at middle range". */
export function moduleText(id: ModuleId): string {
  const m = MODULES[id];
  if (m.weapon) return `${m.weapon.type}, ${m.weapon.damage} a shot, best at ${RANGE_WORDS[m.weapon.range]}`;
  if (m.shield) return `${m.shield.kind} shield, ${m.shield.capacity}`;
  if (m.armour) return `structure +${m.armour}`;
  return m.does;
}

/** What a design adds up to, as figures. */
export function StatsLine({ stats }: { stats: DesignStats }) {
  return (
    <span class="design-stats">
      <span>
        Attack <b>{stats.attack}</b>
      </span>
      <span>
        Shields <b>{stats.shields}</b>
      </span>
      <span>
        Structure <b>{stats.structure}</b>
      </span>
      <span>
        Upkeep <b>{stats.upkeep}</b>
      </span>
    </span>
  );
}

/** Each module of a design, in a list, as its places hold them. */
export function ModuleList({ modules }: { modules: readonly ModuleId[] }) {
  return (
    <ol class="design-modules">
      {modules.map((m, i) => (
        <li key={`${i}-${m}`}>
          <b>{MODULES[m].name}</b> <span class="dim">{moduleText(m)}</span>
        </li>
      ))}
    </ol>
  );
}

interface Draft {
  hull: HullId;
  name: string;
  modules: ModuleId[];
}

/** A new design, being made: its name, a module for each place, and what it adds up to. */
function Maker({
  game,
  faction,
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  game: GameState;
  faction: FactionId;
  draft: Draft;
  onChange: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const power = powerOf(game, faction);
  const known = knownModules(power);
  const kinds: ModuleKind[] = ['weapon', 'shield', 'armour', 'special'];
  const refusal = designRefusal(power, draft.hull, draft.name, draft.modules);
  const stats = designStats(draft);
  return (
    <section class="design-maker" aria-label={`A new ${SHIPS[draft.hull].name.toLowerCase()} design`}>
      <h3>A new {SHIPS[draft.hull].name.toLowerCase()}</h3>
      <label class="design-name">
        Name
        <input
          type="text"
          value={draft.name}
          maxLength={DESIGN_NAME_MOST}
          onInput={(e) => onChange({ ...draft, name: (e.target as HTMLInputElement).value })}
        />
      </label>
      <ol class="design-places">
        {draft.modules.map((m, i) => (
          <li key={`place-${i}`}>
            <label>
              <span class="dim">Place {i + 1}</span>
              <select
                aria-label={`Place ${i + 1}`}
                value={m}
                onChange={(e) => {
                  const modules = [...draft.modules];
                  modules[i] = (e.target as HTMLSelectElement).value as ModuleId;
                  onChange({ ...draft, modules });
                }}
              >
                {kinds.map((k) => (
                  <optgroup key={k} label={KIND_NAMES[k]}>
                    {known
                      .filter((id) => MODULES[id].kind === k)
                      .map((id) => (
                        <option key={id} value={id}>
                          {MODULES[id].name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <span class="dim design-place-does">{moduleText(m)}</span>
          </li>
        ))}
      </ol>
      <p>
        <StatsLine stats={stats} />
      </p>
      <p class="dim">Costs {costText(stats.cost)}.</p>
      {refusal && <p class="waits">{refusal}</p>}
      <div class="design-maker-buttons">
        <button type="button" class="button button-primary" disabled={refusal !== null} onClick={onSave}>
          Save design
        </button>
        <button type="button" class="button button-quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </section>
  );
}

function DesignCard({ design, play, onCopy }: { design: Design; play: Play; onCopy: () => void }) {
  const stats = designStats(design);
  return (
    <li class="design-card">
      <p class="design-card-head">
        <b>{design.name}</b> <span class="dim">{design.yard ? 'the yard’s design' : 'our own design'}</span>
      </p>
      <StatsLine stats={stats} />
      <ModuleList modules={design.modules} />
      <p class="dim">Costs {costText(stats.cost)}.</p>
      <div class="design-card-buttons">
        <button
          type="button"
          class="button button-quiet button-small"
          aria-label={`A new design from the ${design.name}`}
          onClick={onCopy}
        >
          Change a copy
        </button>
        <button
          type="button"
          class="button button-quiet button-small"
          aria-label={`Retire the ${design.name}`}
          onClick={() => give(play, { type: 'retire-design', design: design.id })}
        >
          Retire
        </button>
      </div>
    </li>
  );
}

export function DesignsView({
  game,
  faction,
  play,
  table,
}: {
  game: GameState;
  faction: FactionId;
  play: Play;
  table: boolean;
}) {
  const power = powerOf(game, faction);
  const draft = useSignal<Draft | null>(null);
  const designs = buildable(power);
  const start = (hull: HullId, modules: readonly ModuleId[], name: string) => {
    draft.value = { hull, name, modules: [...modules] };
  };
  const newName = (hull: HullId) => {
    let n = power.designs.filter((d) => !d.yard && d.hull === hull).length + 1;
    const taken = (s: string) => power.designs.some((d) => !d.retired && d.name === s);
    while (taken(`${SHIPS[hull].name} design ${n}`)) n++;
    return `${SHIPS[hull].name} design ${n}`;
  };
  const save = () => {
    const d = draft.value;
    if (!d) return;
    if (give(play, { type: 'design', hull: d.hull, name: d.name, modules: d.modules })) draft.value = null;
  };
  const maker = draft.value && (
    <Maker
      game={game}
      faction={faction}
      draft={draft.value}
      onChange={(d) => {
        draft.value = d;
      }}
      onSave={save}
      onCancel={() => {
        draft.value = null;
      }}
    />
  );
  return (
    <section class={`designs${table ? ' designs-table' : ''}`} aria-label="Designs">
      <h2>Designs</h2>
      <AdvisorBy faction={faction} department="admiral" />
      <p class="dim">
        A warship is built to a design: a hull and a module in each place. The yard draws its own from the best we know,
        and a new one as research brings better. What the modules do in battle is shown as figures until we fight.
      </p>
      <div class="designs-body">
        <div class="designs-list">
          {knownHulls(power).map((hull) => {
            const def = SHIPS[hull];
            const mine = designs.filter((d) => d.hull === hull);
            return (
              <section key={hull} class="designs-hull" aria-label={`${def.name} designs`}>
                <h3>
                  {def.name}{' '}
                  <span class="dim">
                    {def.hull?.places} places · structure {def.hull?.structure} · upkeep {def.upkeep}
                  </span>
                </h3>
                <ul class="design-cards">
                  {mine.map((d) => (
                    <DesignCard
                      key={d.id}
                      design={d}
                      play={play}
                      onCopy={() => start(hull, d.modules, newName(hull))}
                    />
                  ))}
                </ul>
                <button
                  type="button"
                  class="button button-small"
                  aria-label={`New ${def.name.toLowerCase()} design`}
                  onClick={() => start(hull, yardModules(power.researched, hull), newName(hull))}
                >
                  New design
                </button>
                {!table && draft.value?.hull === hull && maker}
              </section>
            );
          })}
        </div>
        {table && (
          <div class="designs-side">{maker ?? <p class="dim">Choose New design under a hull to make one.</p>}</div>
        )}
      </div>
    </section>
  );
}
