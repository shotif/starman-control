// The research screen (M1_LANES_RESEARCH.md §2): the points made each turn and where they come
// from, the queue with its progress, and the research tree. On a phone the tree is a list of cards
// by field; on a desktop the fields are columns and the tiers rows, with a line from each
// technology to what it needs.

import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { FactionId } from '../../content/factions.ts';
import { FIELDS, TECH_IDS, TECHS, type TechId } from '../../content/techs.ts';
import { researchOf } from '../../sim/economy.ts';
import { researchTurns } from '../../sim/research.ts';
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

function TechCard({ game, faction, id, play }: { game: GameState; faction: FactionId; id: TechId; play: Play }) {
  const t = TECHS[id];
  const p = powerOf(game, faction);
  const done = p.researched.includes(id);
  const place = p.researchQueue.indexOf(id);
  const progress = p.techProgress[id] ?? 0;
  const missing = t.needs.filter((n) => !p.researched.includes(n));
  const state = done ? 'done' : place >= 0 ? 'queued' : missing.length > 0 ? 'later' : 'open';
  return (
    <li class={`tech tech-${state}`} data-tech={id}>
      <div class="tech-head">
        <b>{t.name}</b>
        <span class="tech-cost">
          {done ? 'Researched' : progress > 0 ? `${progress} of ${t.cost}` : `${t.cost} points`}
        </span>
      </div>
      <p class="tech-text">{t.text}</p>
      {!done && t.needs.length > 0 && <p class="tech-needs">Needs {t.needs.map((n) => TECHS[n].name).join(' and ')}</p>}
      {!done && (
        <div class="tech-actions">
          {place >= 0 ? (
            <>
              <span class="tech-place">{place === 0 ? 'Researching' : `${ordinal(place + 1)} in the queue`}</span>
              <button
                type="button"
                class="button button-quiet button-small"
                aria-label={`Stop researching ${t.name}`}
                onClick={() => give(play, { type: 'unresearch', tech: id })}
              >
                Remove
              </button>
            </>
          ) : (
            <button
              type="button"
              class="button button-small"
              aria-label={`Queue ${t.name}`}
              onClick={() => give(play, { type: 'research', tech: id })}
            >
              Queue{missing.length > 0 ? ' with what it needs' : ''}
            </button>
          )}
          {place !== 0 && (
            <button
              type="button"
              class="button button-quiet button-small"
              aria-label={`Research ${t.name} now`}
              onClick={() => give(play, { type: 'research', tech: id, now: true })}
            >
              Now
            </button>
          )}
        </div>
      )}
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
  /** The desktop's tree, with fields as columns. */
  table: boolean;
}) {
  const p = powerOf(game, faction);
  const rate = researchOf(world, game, faction);
  const turns = researchTurns(game, faction, rate.total);
  const grid = useRef<HTMLDivElement>(null);
  const lines = useNeedLines(grid, `${table}:${p.researched.join()}:${p.researchQueue.join()}`);
  const tiers = Math.max(...TECH_IDS.map((id) => TECHS[id].tier));
  return (
    <section class="research" aria-label="Research">
      <h2 class="sheet-heading">Research</h2>
      <AdvisorBy faction={faction} department="science" />
      <p class="figure">
        <b>Research {rate.total} a turn</b>{' '}
        {rate.parts.length > 0 && (
          <span class="dim">= {rate.parts.map((p) => `${p.value} ${p.label}`).join(' + ')}</span>
        )}
      </p>
      {p.researchQueue.length === 0 ? (
        <p class="waits">Nothing is being researched: choose a technology below. Points not spent are lost.</p>
      ) : (
        <ol class="research-queue">
          {p.researchQueue.map((id, i) => {
            const t = TECHS[id];
            const have = p.techProgress[id] ?? 0;
            return (
              <li key={id}>
                <div class="queue-item">
                  <b>{t.name}</b>
                  <span class="dim">
                    {have} of {t.cost} · done {turnsWord(turns[i] ?? null)}
                  </span>
                  {i === 0 && (
                    <span
                      class="queue-bar"
                      role="progressbar"
                      aria-label={`${have} of ${t.cost} research points`}
                      aria-valuemin={0}
                      aria-valuemax={t.cost}
                      aria-valuenow={have}
                    >
                      <span style={{ width: `${Math.floor((have * 100) / t.cost)}%` }} />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <h3>The research tree</h3>
      {table ? (
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
            f.id === 'xenology'
              ? [
                  <p key={f.id} class="tech-locked" style={{ gridColumn: col + 1, gridRow: 2 }}>
                    Nothing to study yet.
                  </p>,
                ]
              : Array.from({ length: tiers }, (_, row) => (
                  <ul
                    key={`${f.id}-${row}`}
                    class="tech-tier"
                    aria-label={`${f.name}, tier ${row + 1}`}
                    style={{ gridColumn: col + 1, gridRow: row + 2 }}
                  >
                    {TECH_IDS.filter((id) => TECHS[id].field === f.id && TECHS[id].tier === row + 1).map((id) => (
                      <TechCard key={id} game={game} faction={faction} id={id} play={play} />
                    ))}
                  </ul>
                )),
          )}
        </div>
      ) : (
        FIELDS.map((f) => (
          <section key={f.id} class="tech-field" aria-label={f.name}>
            <h4>{f.name}</h4>
            {f.id === 'xenology' ? (
              <p class="tech-locked">Nothing to study yet.</p>
            ) : (
              <ul class="tech-list">
                {TECH_IDS.filter((id) => TECHS[id].field === f.id).map((id) => (
                  <TechCard key={id} game={game} faction={faction} id={id} play={play} />
                ))}
              </ul>
            )}
          </section>
        ))
      )}
    </section>
  );
}
