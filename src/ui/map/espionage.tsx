// Light espionage on the screen (M5_UNKNOWN.md §23.4): under each power on the diplomacy screen, what
// our agents know of it and the order to watch it or recall them, with its secrets once known; at the
// top, the guard we keep at home; and the Watch's report of a mark reached.

import { FACTIONS, type FactionId } from '../../content/factions.ts';
import { RULES } from '../../content/rules.ts';
import { TECHS } from '../../content/techs.ts';
import { intelOf, knowsSecrets, MARKS, watchRefusal } from '../../sim/espionage.ts';
import type { ReportEvent } from '../../sim/report.ts';
import { type GameState, GUARD_STEPS, type GuardStep, powerOf } from '../../sim/state.ts';
import { give, type Play } from './play.tsx';
import './espionage.css';

const S = RULES.espionage;
const GUARD_WORDS: Record<GuardStep, string> = { 0: 'None', 1: 'Some', 2: 'Much' };

/** The report's line for a mark our agents reached (§23.1). */
export function intelText(e: Extract<ReportEvent, { kind: 'intel' }>): string {
  const mark = MARKS.find((m) => m.level === e.level);
  return `Our agents among the ${FACTIONS[e.faction].shortName} now know ${mark?.shows ?? 'more of them'}.`;
}

/** What our agents know of a power, and the order to watch it or recall them (§23.4). */
export function Agents({
  game,
  faction,
  other,
  play,
}: {
  game: GameState;
  faction: FactionId;
  other: FactionId;
  play: Play;
}) {
  const me = powerOf(game, faction);
  const level = intelOf(game, faction, other);
  const watching = me.agents.includes(other);
  const refusal = watching ? null : watchRefusal(game, faction, other, true);
  const them = powerOf(game, other);
  const shown = MARKS.filter((m) => level >= m.level);
  return (
    <section class="agents" aria-label="Agents">
      <h4>Agents</h4>
      <p>
        What we know: <b>{level}</b> of {S.most}.{' '}
        {shown.length > 0 ? `We know ${shown.map((m) => m.shows).join('; ')}.` : 'Nothing yet beyond what we see.'}
      </p>
      <progress class="agents-bar" max={S.most} value={level} aria-label={`What we know of them: ${level} of 100`} />
      {knowsSecrets(game, faction, other) && (
        <p class="agents-secrets">
          {them.researched.length} technologies;{' '}
          {them.researchQueue[0] ? `researching ${TECHS[them.researchQueue[0]].name}` : 'researching nothing'};{' '}
          {them.treasury} credits in their treasury.
        </p>
      )}
      {watching ? (
        <button
          type="button"
          class="button button-small button-quiet"
          onClick={() => give(play, { type: 'watch', on: other, watch: false })}
        >
          Recall our agents
        </button>
      ) : refusal ? (
        <p class="dim">{refusal}</p>
      ) : (
        <button
          type="button"
          class="button button-small"
          onClick={() => give(play, { type: 'watch', on: other, watch: true })}
        >
          Watch them: {S.watchCost} credits a turn
        </button>
      )}
      <p class="dim">
        Watched, we learn {S.gain} a turn, less {S.guardLess} for each step of their guard; unwatched, it fades {S.fade}{' '}
        a turn. At {S.holdings} we know {MARKS[0]?.shows}; at {S.ships}, {MARKS[1]?.shows}; at {S.secrets},{' '}
        {MARKS[2]?.shows}.
      </p>
    </section>
  );
}

/** The guard we keep at home (§23.2). */
export function GuardHome({ game, faction, play }: { game: GameState; faction: FactionId; play: Play }) {
  const me = powerOf(game, faction);
  return (
    <div class="guard-home">
      <span>Guard home</span>
      <fieldset class="dig-share-buttons">
        <legend class="visually-hidden">Guard home</legend>
        {GUARD_STEPS.map((g) => (
          <button
            key={g}
            type="button"
            class="button button-small"
            aria-pressed={me.guard === g}
            onClick={() => give(play, { type: 'guard', level: g })}
          >
            {GUARD_WORDS[g]}
          </button>
        ))}
      </fieldset>
      <span class="dim">
        {me.guard === 0
          ? 'Others’ agents learn of us freely.'
          : `${me.guard * S.guardCost} credits a turn; others learn ${me.guard * S.guardLess} less of us each turn.`}
      </span>
    </div>
  );
}
