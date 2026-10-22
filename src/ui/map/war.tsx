// War and peace on the diplomacy screen (M4_FLEETS.md §23.5, D-64): at peace, what declaring war
// would cost, said before it is done; at war, since when and our weariness, and peace offered; in a
// truce, until when.

import { FACTIONS, type FactionId } from '../../content/factions.ts';
import { RULES } from '../../content/rules.ts';
import { TREATIES } from '../../content/treaties.ts';
import { formatDate } from '../../sim/calendar.ts';
import { contactWith, type GameState, powerOf } from '../../sim/state.ts';
import {
  atWar,
  declareRefusal,
  truceUntil,
  warBetween,
  warWith,
  wearinessApproval,
  wouldMakePeace,
} from '../../sim/war.ts';
import { give, type Play } from './play.tsx';

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

/** "the Frontier Co-op and the Drift Moot". */
function names(fs: readonly FactionId[]): string {
  const n = fs.map((f) => `the ${FACTIONS[f].shortName}`);
  return n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} and ${n.at(-1)}`;
}

export function WarAndPeace({
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
  const name = FACTIONS[other].shortName;
  const w = RULES.war;
  const me = powerOf(game, faction);
  const weary = wearinessApproval(game, faction);
  const war = warBetween(game, faction, other);
  if (war) {
    const offered = game.offers.find((o) => o.kind === 'peace' && o.from === faction && o.to === other);
    const theirs = game.offers.find(
      (o) => o.kind === 'peace' && o.from === other && o.to === faction && o.turn < game.turn,
    );
    return (
      <section class="diplomacy-war" aria-label="War and peace">
        <h4>War and peace</h4>
        <p class="war-state">
          <b>At war</b> since {formatDate(war.since)}, declared by{' '}
          {war.by === faction ? 'us' : `the ${FACTIONS[war.by].shortName}`}.
        </p>
        <p class="dim">
          Our war weariness is {me.weariness}:{' '}
          {weary === 0 ? 'no cost yet' : `approval ${signed(weary)} at every colony`}.
        </p>
        {theirs ? (
          <p>
            They offer peace.{' '}
            <button
              type="button"
              class="button button-small"
              onClick={() => give(play, { type: 'answer-offer', from: other, treaty: 'peace', accept: true })}
            >
              Make peace
            </button>{' '}
            <button
              type="button"
              class="button button-quiet button-small"
              onClick={() => give(play, { type: 'answer-offer', from: other, treaty: 'peace', accept: false })}
            >
              Refuse
            </button>
          </p>
        ) : offered ? (
          <p class="dim">Our offer of peace reaches them as the turn ends.</p>
        ) : (
          <p>
            <button
              type="button"
              class="button button-small"
              aria-label={`Offer the ${name} peace`}
              onClick={() => give(play, { type: 'offer', to: other, treaty: 'peace' })}
            >
              Offer peace
            </button>{' '}
            <span class="dim">
              {game.powers.find((p) => p.faction === other)?.controller === 'ai'
                ? wouldMakePeace(game, other, faction)
                  ? 'They have had enough of it: likely yes.'
                  : 'They are not yet ready to stop: likely no.'
                : ''}{' '}
              Each keeps what it holds, and neither may declare war for {w.truce} turns.
            </span>
          </p>
        )}
      </section>
    );
  }
  const until = truceUntil(game, faction, other);
  const refusal = declareRefusal(game, faction, other);
  const sides = warWith(game, faction, other);
  const allies = sides.filter((f) => f !== other);
  const ending = game.treaties.filter((t) => (t.a === faction && t.b === other) || (t.b === faction && t.a === other));
  const heard = game.powers.filter(
    (p) => p.faction !== faction && !sides.includes(p.faction) && contactWith(p, faction),
  );
  return (
    <section class="diplomacy-war" aria-label="War and peace">
      <h4>War and peace</h4>
      {until !== null ? <p>At peace by treaty: no war before {formatDate(until)}.</p> : <p class="dim">At peace.</p>}
      {refusal === null ? (
        <>
          <p class="dim war-cost">
            War begins at once.{' '}
            {ending.length > 0 &&
              `Our ${ending.map((t) => TREATIES[t.kind].noun).join(', ')} with them ${ending.length === 1 ? 'ends' : 'end'}. `}
            They will remember it ({signed(w.declared)})
            {heard.length > 0
              ? `, and every power that knows us will hear of it (${signed(w.heard)}, ${signed(w.heardLawful)} for the lawful)`
              : ''}
            .{allies.length > 0 && ` Their allies, ${names(allies)}, go to war with us too.`} Every turn at war wearies
            our people.
          </p>
          <p>
            <button
              type="button"
              class="button button-small button-danger"
              aria-label={`Declare war on the ${name}`}
              onClick={() => give(play, { type: 'declare-war', on: other })}
            >
              Declare war
            </button>
          </p>
        </>
      ) : (
        !atWar(game, faction, other) && <p class="dim">{refusal}</p>
      )}
    </section>
  );
}
