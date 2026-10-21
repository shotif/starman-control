// The research screen (M1_LANES_RESEARCH.md §2, M2B_SCIENCE.md §11, §18.5): the points made each
// turn and where they come from, the queue with its progress, and the research tree. On a phone the
// tree is a tab for each field, its tiers as sections; on a desktop the fields are columns and the
// tiers rows, with a line from each technology to what it needs, the queue in a panel beside it,
// and the arrow keys moving between technologies.

import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { FACTIONS, type FactionId } from '../../content/factions.ts';
import { RULES } from '../../content/rules.ts';
import { FIELDS, type FieldId, TECH_IDS, TECHS, type TechId } from '../../content/techs.ts';
import { inspirationPoints } from '../../sim/discoveries.ts';
import { researchOf } from '../../sim/economy.ts';
import {
  closedBy,
  knownBy,
  requirementMet,
  requirementText,
  researchRefusal,
  researchTurns,
  techCost,
} from '../../sim/research.ts';
import { type GameState, powerOf } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';
import { AdvisorBy } from './advisor.tsx';
import { give, type Play } from './play.tsx';
import './research.css';

function ordinal(n: number): string {
  const end =
    n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th';
  return `${n}${end}`;
}

function turnsWord(t: number | null): string {
  if (t === null) return 'never, with no research';
  return t === 1 ? 'when this turn ends' : `in about ${t} turns`;
}

const TIERS = Math.max(...TECH_IDS.map((id) => TECHS[id].tier));

/** A field's technologies, by tier and then as listed. */
function fieldTechs(field: FieldId): TechId[] {
  return TECH_IDS.filter((id) => TECHS[id].field === field).sort((a, b) => TECHS[a].tier - TECHS[b].tier);
}

/** Queues a technology (with what it needs), researches it now, or takes it out of the queue. */
function act(play: Play, id: TechId, how: 'queue' | 'now' | 'remove') {
  if (how === 'remove') give(play, { type: 'unresearch', tech: id });
  else give(play, { type: 'research', tech: id, now: how === 'now' });
}

function TechCard({
  game,
  faction,
  id,
  play,
  onKey,
}: {
  game: GameState;
  faction: FactionId;
  id: TechId;
  play: Play;
  /** The desktop's keys, on a card in focus. */
  onKey?: (e: KeyboardEvent, id: TechId) => void;
}) {
  const t = TECHS[id];
  const p = powerOf(game, faction);
  const done = p.researched.includes(id);
  const place = p.researchQueue.indexOf(id);
  const progress = p.techProgress[id] ?? 0;
  const cost = techCost(game, p, id);
  const missing = t.needs.filter((n) => !p.researched.includes(n));
  const inspired = p.inspired.includes(id);
  const refusal = done ? null : researchRefusal(game, faction, id);
  const closed = closedBy(p, id);
  const spread = done ? [] : knownBy(game, p, id);
  const state = done
    ? 'done'
    : closed
      ? 'closed'
      : place >= 0
        ? 'queued'
        : missing.length > 0 || refusal
          ? 'later'
          : 'open';
  return (
    <li
      class={`tech tech-${state}`}
      data-tech={id}
      tabIndex={onKey ? 0 : undefined}
      aria-label={onKey ? `${t.name}: ${done ? 'researched' : place >= 0 ? 'queued' : `${cost} points`}` : undefined}
      onKeyDown={onKey ? (e) => onKey(e, id) : undefined}
    >
      <div class="tech-head">
        <b>{t.name}</b>
        <span class="tech-cost">
          {done ? 'Researched' : progress > 0 ? `${progress} of ${cost}` : `${cost} points`}
        </span>
      </div>
      <p class="tech-text">{t.text}</p>
      {t.fork && !done && (
        <p class={`tech-fork${closed ? ' is-closed' : ''}`}>
          {closed
            ? `Closed: you chose ${TECHS[closed].name}.`
            : `A doctrine: it closes ${TECHS[t.fork].name} for the game.`}
        </p>
      )}
      {closed ? null : (
        <>
          {spread.length > 0 && (
            <p class="tech-spread">
              Known to the {spread.map((f) => FACTIONS[f].shortName).join(' and the ')}: −
              {Math.min(RULES.research.spreadMost, RULES.research.spreadPercent * spread.length)}%
            </p>
          )}
          {!done && t.needs.length > 0 && (
            <p class="tech-needs">Needs {t.needs.map((n) => TECHS[n].name).join(' and ')}</p>
          )}
          {!done && t.requires && (
            <p class={`tech-needs${requirementMet(p, id) ? '' : ' is-unmet'}`}>
              Needs {requirementText(id)} ({p.investigated.length} so far)
            </p>
          )}
          {!done && (
            <p class={`tech-inspiration${inspired ? ' is-met' : ''}`}>
              {inspired
                ? `Inspired by ${t.inspiration.text}: +${inspirationPoints(game, p, id)}`
                : `Inspired by ${t.inspiration.text}: ${inspirationPoints(game, p, id)} research`}
            </p>
          )}
          {!done && (
            <div class="tech-actions">
              {place >= 0 ? (
                <>
                  <span class="tech-place">{place === 0 ? 'Researching' : `${ordinal(place + 1)} in the queue`}</span>
                  <button
                    type="button"
                    class="button button-quiet button-small"
                    tabIndex={onKey ? -1 : undefined}
                    aria-label={`Stop researching ${t.name}`}
                    onClick={() => act(play, id, 'remove')}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  class="button button-small"
                  tabIndex={onKey ? -1 : undefined}
                  disabled={refusal !== null}
                  aria-label={`Queue ${t.name}`}
                  onClick={() => act(play, id, 'queue')}
                >
                  Queue{missing.length > 0 ? ' with what it needs' : ''}
                </button>
              )}
              {place !== 0 && refusal === null && (
                <button
                  type="button"
                  class="button button-quiet button-small"
                  tabIndex={onKey ? -1 : undefined}
                  aria-label={`Research ${t.name} now`}
                  onClick={() => act(play, id, 'now')}
                >
                  Now
                </button>
              )}
            </div>
          )}
        </>
      )}
    </li>
  );
}

/** The split between the two doctrines of a pair (M2B_SCIENCE.md §19.1). */
function Or() {
  return (
    <li class="tech-or" aria-hidden="true">
      or
    </li>
  );
}

/** Lines from each technology up to what it needs, drawn over the desktop's tree. */
function useNeedLines(grid: { current: HTMLElement | null }, key: string) {
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; done: boolean }[]>([]);
  useLayoutEffect(() => {
    const el = grid.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const at = (id: TechId) => el.querySelector<HTMLElement>(`[data-tech="${id}"]`)?.getBoundingClientRect();
      const out: typeof lines = [];
      for (const id of TECH_IDS) {
        const to = at(id);
        if (!to) continue;
        for (const n of TECHS[id].needs) {
          const from = at(n);
          if (!from) continue;
          out.push({
            x1: from.left + from.width / 2 - box.left,
            y1: from.bottom - box.top,
            x2: to.left + to.width / 2 - box.left,
            y2: to.top - box.top,
            done: el.querySelector(`[data-tech="${n}"]`)?.classList.contains('tech-done') ?? false,
          });
        }
      }
      setLines(out);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [grid, key]);
  return lines;
}

/** The queue: each technology's progress and when it will be done, and when the whole queue is. */
function Queue({ game, faction, play, rate }: { game: GameState; faction: FactionId; play: Play; rate: number }) {
  const p = powerOf(game, faction);
  const turns = researchTurns(game, faction, rate);
  if (p.researchQueue.length === 0)
    return <p class="waits">Nothing is being researched: choose a technology. Points not spent are lost.</p>;
  const last = turns[turns.length - 1] ?? null;
  // What each costs when its turn comes: dearer for each one before it (§18.1).
  const ahead = { ...p, researched: [...p.researched] };
  const costs = p.researchQueue.map((id) => {
    const cost = techCost(game, ahead, id);
    ahead.researched.push(id);
    return cost;
  });
  return (
    <>
      <ol class="research-queue">
        {p.researchQueue.map((id, i) => {
          const t = TECHS[id];
          const have = p.techProgress[id] ?? 0;
          const cost = costs[i] ?? techCost(game, p, id);
          return (
            <li key={id}>
              <div class="queue-item">
                <b>{t.name}</b>
                <span class="dim">
                  {have} of {cost} · done {turnsWord(turns[i] ?? null)}
                </span>
                {i === 0 && (
                  <span
                    class="queue-bar"
                    role="progressbar"
                    aria-label={`${have} of ${cost} research points`}
                    aria-valuemin={0}
                    aria-valuemax={cost}
                    aria-valuenow={have}
                  >
                    <span style={{ width: `${Math.floor((have * 100) / cost)}%` }} />
                  </span>
                )}
                <button
                  type="button"
                  class="link queue-remove"
                  aria-label={`Take ${t.name} out of the queue`}
                  onClick={() => act(play, id, 'remove')}
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      {p.researchQueue.length > 1 && <p class="dim research-done">The whole queue is done {turnsWord(last)}.</p>}
    </>
  );
}

/** The desktop's tree: fields as columns and tiers as rows, with lines and the keys. */
function TreeGrid({ game, faction, play }: { game: GameState; faction: FactionId; play: Play }) {
  const p = powerOf(game, faction);
  const grid = useRef<HTMLDivElement>(null);
  const lines = useNeedLines(grid, `${p.researched.join()}:${p.researchQueue.join()}`);
  const columns = FIELDS.map((f) => fieldTechs(f.id));
  const focus = (id: TechId | undefined) => {
    if (id) grid.current?.querySelector<HTMLElement>(`[data-tech="${id}"]`)?.focus();
  };
  const onKey = (e: KeyboardEvent, id: TechId) => {
    if (e.target !== e.currentTarget) return;
    const col = FIELDS.findIndex((f) => f.id === TECHS[id].field);
    const list = columns[col] ?? [];
    const i = list.indexOf(id);
    const tier = TECHS[id].tier;
    /** The technology in another column nearest this one's tier. */
    const across = (step: number) => {
      for (let c = col + step; c >= 0 && c < columns.length; c += step) {
        const there = columns[c] ?? [];
        if (there.length === 0) continue;
        return [...there].sort((a, b) => Math.abs(TECHS[a].tier - tier) - Math.abs(TECHS[b].tier - tier))[0];
      }
      return undefined;
    };
    let handled = true;
    if (e.key === 'ArrowDown') focus(list[i + 1]);
    else if (e.key === 'ArrowUp') focus(list[i - 1]);
    else if (e.key === 'ArrowRight') focus(across(1));
    else if (e.key === 'ArrowLeft') focus(across(-1));
    else if (e.key === 'Enter') {
      if (!p.researched.includes(id) && researchRefusal(game, faction, id) === null)
        act(play, id, e.shiftKey ? 'now' : 'queue');
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (p.researchQueue.includes(id)) act(play, id, 'remove');
    } else handled = false;
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  return (
    <div class="tech-grid" ref={grid}>
      <svg class="tech-lines" aria-hidden="true">
        {lines.map((l) => (
          <line
            key={`${l.x1},${l.y1},${l.x2},${l.y2}`}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            class={l.done ? 'is-done' : ''}
          />
        ))}
      </svg>
      {FIELDS.map((f, col) => (
        <h4 key={f.id} class="tech-field-name" style={{ gridColumn: col + 1, gridRow: 1 }}>
          {f.name}
        </h4>
      ))}
      {FIELDS.flatMap((f, col) =>
        Array.from({ length: TIERS }, (_, row) => (
          <ul
            key={`${f.id}-${row}`}
            class="tech-tier"
            aria-label={`${f.name}, tier ${row + 1}`}
            style={{ gridColumn: col + 1, gridRow: row + 2 }}
          >
            {(columns[col] ?? [])
              .filter((id) => TECHS[id].tier === row + 1)
              .flatMap((id, i, here) => [
                ...(i > 0 && TECHS[id].fork === here[i - 1] ? [<Or key={`${id}-or`} />] : []),
                <TechCard key={id} game={game} faction={faction} id={id} play={play} onKey={onKey} />,
              ])}
          </ul>
        )),
      )}
    </div>
  );
}

/** The phone's tree: a tab for each field, its tiers as sections. */
function FieldTabs({ game, faction, play }: { game: GameState; faction: FactionId; play: Play }) {
  const p = powerOf(game, faction);
  const first = p.researchQueue[0];
  const [field, setField] = useState<FieldId>(first ? TECHS[first].field : 'propulsion');
  const techs = fieldTechs(field);
  const name = FIELDS.find((f) => f.id === field)?.name ?? '';
  return (
    <>
      <div class="field-tabs" role="tablist" aria-label="Fields">
        {FIELDS.map((f) => {
          const all = fieldTechs(f.id);
          const known = all.filter((id) => p.researched.includes(id)).length;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              id={`field-tab-${f.id}`}
              aria-selected={f.id === field}
              aria-controls="field-panel"
              class="field-tab"
              onClick={() => setField(f.id)}
            >
              {f.name} <span class="dim">{`${known}/${all.length}`}</span>
            </button>
          );
        })}
      </div>
      <div class="field-panel" id="field-panel" role="tabpanel" aria-labelledby={`field-tab-${field}`}>
        {Array.from({ length: TIERS }, (_, row) => {
          const here = techs.filter((id) => TECHS[id].tier === row + 1);
          if (here.length === 0) return null;
          return (
            <section key={row} class="tech-field" aria-label={`${name}, tier ${row + 1}`}>
              <h4>Tier {row + 1}</h4>
              <ul class="tech-list">
                {here.flatMap((id, i) => [
                  ...(i > 0 && TECHS[id].fork === here[i - 1] ? [<Or key={`${id}-or`} />] : []),
                  <TechCard key={id} game={game} faction={faction} id={id} play={play} />,
                ])}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}

export function ResearchView({
  world,
  game,
  faction,
  play,
  table,
}: {
  world: World;
  game: GameState;
  faction: FactionId;
  play: Play;
  /** The desktop's tree, with fields as columns and the queue beside it. */
  table: boolean;
}) {
  const p = powerOf(game, faction);
  const rate = researchOf(world, game, faction);
  const head = (
    <>
      <h2 class="sheet-heading">Research</h2>
      <AdvisorBy faction={faction} department="science" />
      <p class="figure">
        <b>Research {rate.total} a turn</b>{' '}
        {rate.parts.length > 0 && (
          <span class="dim">= {rate.parts.map((p) => `${p.value} ${p.label}`).join(' + ')}</span>
        )}
      </p>
      <p class="dim">
        Inspirations: {p.inspired.length} of {TECH_IDS.length} met. Each technology names a deed that teaches you{' '}
        {RULES.discoveries.inspirationPercent}% of it once; a first survey of what astronomers have observed gives
        research. Each technology you know makes the next cost {RULES.research.risePercent}% more.
      </p>
    </>
  );
  if (table)
    return (
      <section class="research research-desktop" aria-label="Research">
        <div class="research-layout">
          <div class="research-main">
            {head}
            <h3>The research tree</h3>
            <p class="dim research-keys">
              Arrow keys move between technologies; Enter queues one, Shift+Enter researches it now, Delete takes it out
              of the queue.
            </p>
            <TreeGrid game={game} faction={faction} play={play} />
          </div>
          <aside class="research-side" aria-label="Research queue">
            <h3>The queue</h3>
            <Queue game={game} faction={faction} play={play} rate={rate.total} />
          </aside>
        </div>
      </section>
    );
  return (
    <section class="research" aria-label="Research">
      {head}
      <Queue game={game} faction={faction} play={play} rate={rate.total} />
      <h3>The research tree</h3>
      <FieldTabs game={game} faction={faction} play={play} />
    </section>
  );
}
