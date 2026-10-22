// War and peace on the diplomacy screen (M4_FLEETS.md §23.5, §28.6, D-64): at peace, what declaring
// war would cost, said before it is done; at war, since when, why and our weariness, peace offered
// (on terms) and surrender; in a truce, until when; who is subdued by whom.

import { FACTIONS, type FactionId, WAR_REASONS } from '../../content/factions.ts';
import { RULES } from '../../content/rules.ts';
import { TREATIES } from '../../content/treaties.ts';
import { formatDate } from '../../sim/calendar.ts';
import { contactWith, type GameState, powerOf } from '../../sim/state.ts';
import { tributeOf } from '../../sim/treaties.ts';
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

/** What a power would pay a turn, subdued (M4_FLEETS.md §28.5): a fifth of its taxes. */
function tributeIf(game: GameState, f: FactionId): number {
  const power = powerOf(game, f);
  let taxes = 0;
  for (const h of game.holdings)
    if (h.owner === f && h.kind === 'colony') taxes += Math.floor(h.people / RULES.credits.taxPer[power.taxes]);
  return Math.floor(taxes / 5);
}

/** Who is subdued by whom between the two, in a line, or null. */
function subduedNote(game: GameState, me: FactionId, other: FactionId): string | null {
  const name = FACTIONS[other].shortName;
  if (powerOf(game, me).subduedBy === other)
    return `We are subdued by the ${name}: we pay them ${tributeOf(game, me)} credits a turn as tribute, and fight their wars.`;
  if (powerOf(game, other).subduedBy === me)
    return `The ${name} is subdued by us: it pays us ${tributeOf(game, other)} credits a turn, and fights our wars.`;
  return null;
}

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
  const subdued = subduedNote(game, faction, other);
  if (war) {
    const offered = game.offers.find((o) => o.kind === 'peace' && o.from === faction && o.to === other);
    const theirs = game.offers.find(
      (o) => o.kind === 'peace' && o.from === other && o.to === faction && o.turn < game.turn,
    );
    const yielding = game.offers.find(
      (o) => o.kind === 'capitulation' && o.from === other && o.to === faction && o.turn < game.turn,
    );
    const surrendering = game.offers.some((o) => o.kind === 'capitulation' && o.from === faction && o.to === other);
    const terms = theirs?.get
      ? `, for ${theirs.get.amount} credits from us`
      : theirs?.give
        ? `, and ${theirs.give.amount} credits with it`
        : '';
    const owed = tributeIf(game, faction);
    return (
      <section class="diplomacy-war" aria-label="War and peace">
        <h4>War and peace</h4>
        <p class="war-state">
          <b>At war</b> since {formatDate(war.since)}, declared by{' '}
          {war.by === faction ? 'us' : `the ${FACTIONS[war.by].shortName}`}
          {war.reason && war.by !== faction ? `: “${WAR_REASONS[war.reason]}”` : ''}.
        </p>
        <p class="dim">
          Our war weariness is {me.weariness}:{' '}
          {weary === 0 ? 'no cost yet' : `approval ${signed(weary)} at every colony`}.
        </p>
        {yielding && (
          <p>
            They offer their surrender: they would pay us a fifth of their taxes as tribute, fight our wars, and declare
            none of their own.{' '}
            <button
              type="button"
              class="button button-small"
              onClick={() => give(play, { type: 'answer-offer', from: other, treaty: 'capitulation', accept: true })}
            >
              Accept their surrender
            </button>{' '}
            <button
              type="button"
              class="button button-quiet button-small"
              onClick={() => give(play, { type: 'answer-offer', from: other, treaty: 'capitulation', accept: false })}
            >
              Refuse
            </button>
          </p>
        )}
        {theirs ? (
          <p>
            They offer peace{terms}.{' '}
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
        {surrendering ? (
          <p class="dim">Our surrender reaches them as the turn ends.</p>
        ) : (
          <p>
            <button
              type="button"
              class="button button-quiet button-small button-danger"
              aria-label={`Surrender to the ${name}`}
              onClick={() => give(play, { type: 'offer', to: other, treaty: 'capitulation' })}
            >
              Surrender
            </button>{' '}
            <span class="dim">
              The war ends, but we would be subdued: a fifth of our taxes to them as tribute (about {owed} credits a
              turn), their wars ours, and no war of our own.
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
      {subdued && <p class="war-state">{subdued}</p>}
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
