// The end of the game (M4_FLEETS.md §30.3, D-14): victory or defeat with its picture, how it came,
// and the story of the game in numbers: each power's score every 10 turns, and what each did. The
// report's lines for a power leaving the game and the game decided.

import { FACTIONS, type FactionId } from '../../content/factions.ts';
import { formatDate } from '../../sim/calendar.ts';
import type { ReportEvent } from '../../sim/report.ts';
import { scoreOf } from '../../sim/score.ts';
import type { GameState, VictoryKind } from '../../sim/state.ts';
import { type Outcome, outcomeFor } from '../../sim/victory.ts';
import { FactionTag } from '../parts.tsx';
import './end.css';

const the = (f: FactionId) => `the ${FACTIONS[f].shortName}`;
const The = (f: FactionId) => `The ${FACTIONS[f].shortName}`;

/** How a victory came, in a few words. */
const HOW: Record<VictoryKind, string> = {
  conquest: 'by conquest',
  vote: 'chosen by the Assembly',
  score: 'with the highest score at the turn limit',
};

/** The report's line for a power leaving the game, or the game decided (§30.3). */
export function endText(game: GameState, e: ReportEvent, me: FactionId | undefined): string | null {
  if (e.kind === 'power-left')
    return e.faction === me
      ? 'We have lost our last colony: our power leaves the game.'
      : `${The(e.faction)} has lost its last colony and leaves the game: its outposts are abandoned, its ships lost and its lanes dark.`;
  if (e.kind !== 'game-ended') return null;
  if (e.winner === null) return `The game has reached its last turn: our score is ${me ? scoreOf(game, me).total : 0}.`;
  if (e.winner === me)
    return e.how === 'conquest'
      ? 'Victory: no power stands against us.'
      : e.how === 'vote'
        ? 'Victory: the Assembly has chosen us to lead it.'
        : 'Victory: the turn limit is reached, and ours is the highest score.';
  return `The game is lost: ${the(e.winner)} has won, ${HOW[e.how]}.`;
}

/** Whether the last turn decided the game for a power, so the end opens over the map. */
export function decidedNow(game: GameState, me: FactionId): boolean {
  const events = game.reports.find((r) => r.faction === me)?.events ?? [];
  return events.some(
    (e) =>
      e.kind === 'game-ended' ||
      (e.kind === 'power-left' && e.faction === me) ||
      (e.kind === 'subdued' && e.faction === me),
  );
}

/** The end's title and its line. */
function headline(game: GameState, o: Outcome): { title: string; line: string } {
  const when = game.ended?.turn ?? game.turn;
  const date = formatDate(when);
  if (o.result === 'victory') {
    const line =
      o.how === 'conquest'
        ? 'No power stands against us: every other has left the game or surrendered to us.'
        : o.how === 'vote'
          ? 'The Assembly has chosen us to lead it, by two thirds of all its votes.'
          : 'The turn limit is reached, and ours is the highest score.';
    return { title: 'Victory', line: `${line} ${date}.` };
  }
  if (o.result === 'end') return { title: 'The end', line: `The game has reached its last turn. ${date}.` };
  const line =
    o.how === 'left'
      ? 'Our last colony is gone: our power has left the game.'
      : o.how === 'surrender'
        ? `We have surrendered to ${o.by ? the(o.by) : 'our enemy'}: we pay them tribute and fight their wars.`
        : `${o.by ? The(o.by) : 'Another power'} has won, ${HOW[o.how]}.`;
  return { title: 'Defeat', line: `${line} ${date}.` };
}

/** Every power's score every 10 turns, as lines (§30.3). */
function ScoreChart({ game }: { game: GameState }) {
  const h = game.history;
  if (h.length < 2) return null;
  const width = 320;
  const height = 140;
  const first = h[0]?.turn ?? 0;
  const last = h.at(-1)?.turn ?? 1;
  const top = Math.max(1, ...h.flatMap((x) => x.scores));
  const x = (turn: number) => ((turn - first) / Math.max(1, last - first)) * width;
  const y = (score: number) => height - (score / top) * height;
  return (
    <figure class="end-chart">
      <svg viewBox={`-4 -4 ${width + 8} ${height + 8}`} role="img" aria-label="Every power’s score, every 10 turns">
        {game.powers.map((p, i) => (
          <polyline
            key={p.faction}
            fill="none"
            stroke={FACTIONS[p.faction].colour}
            stroke-width={2}
            vector-effect="non-scaling-stroke"
            points={h.map((e) => `${x(e.turn).toFixed(1)},${y(e.scores[i] ?? 0).toFixed(1)}`).join(' ')}
          />
        ))}
      </svg>
      <figcaption class="dim">
        Score, turn {first} to turn {last}: the highest {top}.
      </figcaption>
    </figure>
  );
}

export function EndView({
  game,
  faction,
  onPlayOn,
  onLeave,
}: {
  game: GameState;
  faction: FactionId;
  /** Absent when there is no playing on: our power has left the game. */
  onPlayOn?: () => void;
  onLeave: () => void;
}) {
  const o = outcomeFor(game, faction);
  if (!o) return <p class="dim">The game is not decided yet.</p>;
  const { title, line } = headline(game, o);
  const picture = o.result === 'defeat' ? 'end-defeat' : 'end-victory';
  const base = `${import.meta.env.BASE_URL}art/illustration/${picture}`;
  const last = game.history.at(-1);
  // The scores as last kept, for every power alike (as the game was decided, or the latest tenth turn).
  const scoreOfPower = (i: number, f: FactionId) => last?.scores[i] ?? scoreOf(game, f, faction).total;
  const order = game.powers.map((p, i) => ({ p, score: scoreOfPower(i, p.faction) })).sort((a, b) => b.score - a.score);
  return (
    <div class="end">
      <figure class="end-art">
        <img
          src={`${base}-640.webp`}
          srcset={`${base}-640.webp 640w, ${base}-1280.webp 1280w`}
          sizes="(min-width: 900px) 680px, 100vw"
          width={640}
          height={427}
          alt={
            o.result === 'defeat'
              ? 'An empty command room at night, its star map dark, one officer at the window looking out at a distant red sun.'
              : 'Crowds celebrating on a station concourse under a great curved window, warships passing in salute before a blue-white planet.'
          }
          decoding="async"
        />
      </figure>
      <h2 class={`end-title end-${o.result}`}>{title}</h2>
      <p>{line}</p>
      <h3>The story in numbers</h3>
      <ScoreChart game={game} />
      <table class="end-story">
        <thead>
          <tr>
            <th scope="col">Power</th>
            <th scope="col">Score</th>
            <th scope="col">Most colonies</th>
            <th scope="col">Technologies</th>
            <th scope="col">Wars declared</th>
            <th scope="col">Battles</th>
            <th scope="col">Taken</th>
          </tr>
        </thead>
        <tbody>
          {order.map(({ p, score }) => (
            <tr key={p.faction} class={p.faction === faction ? 'end-us' : undefined}>
              <th scope="row">
                <FactionTag faction={p.faction} />
                {p.left !== null && <span class="dim"> left on turn {p.left}</span>}
                {p.subduedBy && <span class="dim"> subdued by {the(p.subduedBy)}</span>}
              </th>
              <td data-label="Score">{score}</td>
              <td data-label="Most colonies">{p.mostColonies}</td>
              <td data-label="Technologies">{p.researched.length}</td>
              <td data-label="Wars declared">{p.story.wars}</td>
              <td data-label="Battles">{p.story.battles}</td>
              <td data-label="Taken">{p.story.taken}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div class="end-buttons">
        {onPlayOn && (
          <button type="button" class="button button-primary" onClick={onPlayOn}>
            Play on
          </button>
        )}
        <button type="button" class={`button${onPlayOn ? ' button-quiet' : ' button-primary'}`} onClick={onLeave}>
          Save and leave
        </button>
      </div>
    </div>
  );
}
