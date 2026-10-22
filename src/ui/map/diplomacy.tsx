// The diplomacy screen, the Envoy's (M3_NEIGHBOURS.md §20.3): every power you are in contact with,
// how it regards you and why, and what you can do for it. On a desktop the powers in a list with
// the chosen one beside it; on a phone a card for each, the chosen one opened under its card.

import { useSignal } from '@preact/signals';
import { FACTIONS, type FactionId } from '../../content/factions.ts';
import { RULES } from '../../content/rules.ts';
import { TREATIES, TREATY_KINDS } from '../../content/treaties.ts';
import { tradeOf } from '../../sim/borders.ts';
import { attitudeOf, giftRefusal } from '../../sim/memory.ts';
import { contactWith, type GameState, inContact, powerOf, treatyOf } from '../../sim/state.ts';
import { offerRefusal } from '../../sim/treaties.ts';
import type { World } from '../../sim/world.ts';
import { FactionTag } from '../parts.tsx';
import { AdvisorBy } from './advisor.tsx';
import { give, type Play } from './play.tsx';

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

/** Your contact with a power, in words (§19.2). */
export function contactText(game: GameState, faction: FactionId, other: FactionId): string {
  const c = contactWith(powerOf(game, faction), other);
  if (!c) return 'not yet heard';
  if (c.stage === 'talk') return 'we can talk';
  return `learning their tongue: ${c.words} of ${RULES.contact.wordsToTalk}`;
}

/** The treaties with a power (§21.5): those in force, offers both ways, and what can be offered. */
function Treaties({
  game,
  faction,
  other,
  play,
  regard,
}: {
  game: GameState;
  faction: FactionId;
  other: FactionId;
  play: Play;
  /** Their regard for us. */
  regard: number;
}) {
  const name = FACTIONS[other].shortName;
  const m = RULES.memory;
  return (
    <>
      <h4>Treaties</h4>
      <ul class="diplomacy-treaties" aria-label={`Treaties with the ${name}`}>
        {TREATY_KINDS.map((kind) => {
          const t = TREATIES[kind];
          const held = treatyOf(game, faction, other, kind);
          const theirs = game.offers.find((o) => o.from === other && o.to === faction && o.kind === kind);
          const ours = game.offers.find((o) => o.from === faction && o.to === other && o.kind === kind);
          const asks = FACTIONS[other].asks[kind];
          return (
            <li key={kind}>
              <b>{t.name}</b> <span class="dim">{t.does}</span>
              {kind === 'trade' && (
                <span class="dim"> Now it would bring {tradeOf(game, faction, other)} credits a turn each.</span>
              )}
              {held ? (
                held.ends !== null ? (
                  <p>In force; it ends in {Math.max(0, held.ends - game.turn)} turns.</p>
                ) : (
                  <p>
                    In force.{' '}
                    <button
                      type="button"
                      class="button button-quiet button-small"
                      title={`It holds ${RULES.treaties.notice} more turns; they will remember it (${m.treatyEnded}).`}
                      onClick={() => give(play, { type: 'end-treaty', with: other, treaty: kind })}
                    >
                      End with notice
                    </button>{' '}
                    <button
                      type="button"
                      class="button button-quiet button-small"
                      title={`It ends as the turn ends; they will remember it (${m.treatyBroken}), and every power that knows us (${m.treatyBrokenHeard}).`}
                      onClick={() => give(play, { type: 'break-treaty', with: other, treaty: kind })}
                    >
                      Break it now
                    </button>
                  </p>
                )
              ) : theirs && theirs.turn < game.turn ? (
                <p>
                  They offer it.{' '}
                  <button
                    type="button"
                    class="button button-small"
                    onClick={() => give(play, { type: 'answer-offer', from: other, treaty: kind, accept: true })}
                  >
                    Accept
                  </button>{' '}
                  <button
                    type="button"
                    class="button button-quiet button-small"
                    onClick={() => give(play, { type: 'answer-offer', from: other, treaty: kind, accept: false })}
                  >
                    Refuse
                  </button>
                </p>
              ) : ours ? (
                <p class="dim">Our offer reaches them as the turn ends.</p>
              ) : (
                <p>
                  <button
                    type="button"
                    class="button button-small"
                    aria-label={`Offer the ${name} ${t.words}`}
                    disabled={offerRefusal(game, faction, other, kind) !== null}
                    onClick={() => give(play, { type: 'offer', to: other, treaty: kind })}
                  >
                    Offer it
                  </button>{' '}
                  <span class="dim">
                    {asks === null
                      ? 'They never agree to it.'
                      : regard >= asks
                        ? 'Their regard is enough: likely yes.'
                        : `Likely no: they ask for a regard of ${signed(asks)}.`}
                  </span>
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function DiplomacyView({
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
  /** The desktop's list with the chosen power beside it, rather than the phone's cards. */
  table: boolean;
}) {
  const me = powerOf(game, faction);
  const others = game.powers.filter((p) => p.faction !== faction).map((p) => p.faction);
  const heard = others.filter((f) => inContact(me, f));
  const unheard = others.filter((f) => !inContact(me, f));
  const chosen = useSignal<FactionId | null>(table ? (heard[0] ?? null) : null);
  const pick = chosen.value !== null && heard.includes(chosen.value) ? chosen.value : table ? (heard[0] ?? null) : null;

  const detail = (other: FactionId) => {
    const regard = attitudeOf(world, game, other, faction);
    const waiting = me.gifts.find((g) => g.to === other);
    const name = FACTIONS[other].shortName;
    return (
      <section class="diplomacy-detail" aria-label={`The ${name}`}>
        {/* On a phone it opens under its card, which names it already. */}
        {table && (
          <>
            <h3>
              <FactionTag faction={other} />
            </h3>
            <p class="dim">{contactText(game, faction, other)}</p>
          </>
        )}
        <p class="diplomacy-regard">
          Their regard for us: <b class={`regard-${regard.word}`}>{regard.word}</b> ({signed(regard.total)})
        </p>
        {regard.parts.length > 0 ? (
          <ul class="diplomacy-reasons" aria-label="Why">
            {regard.parts.map((p) => (
              <li key={`${p.kind}-${p.reason}`}>
                <span>{p.reason}</span>
                <b class={p.amount < 0 ? 'regard-down' : 'regard-up'}>{signed(p.amount)}</b>
              </li>
            ))}
          </ul>
        ) : (
          <p class="dim">They have no reason yet to think anything of us.</p>
        )}
        <Treaties game={game} faction={faction} other={other} play={play} regard={regard.total} />
        <h4>A gift</h4>
        {waiting ? (
          <p>
            Our gift of {waiting.credits} credits leaves as the turn ends.{' '}
            <button
              type="button"
              class="button button-quiet button-small"
              onClick={() => give(play, { type: 'gift', to: other, credits: 0 })}
            >
              Take it back
            </button>
          </p>
        ) : (
          <div class="diplomacy-gifts">
            {RULES.memory.gifts.map((credits) => {
              const refusal = giftRefusal(game, faction, other, credits);
              return (
                <button
                  key={credits}
                  type="button"
                  class="button button-small"
                  disabled={refusal !== null}
                  title={refusal ?? undefined}
                  aria-label={`Send the ${name} a gift of ${credits} credits`}
                  onClick={() => give(play, { type: 'gift', to: other, credits })}
                >
                  {credits} credits
                </button>
              );
            })}
          </div>
        )}
        {contactWith(me, other)?.stage !== 'talk' && (
          <p class="dim">We cannot talk with them until the Envoy has learnt their tongue.</p>
        )}
        <p class="dim">
          A gift is remembered at 1 for every {RULES.memory.giftCredits} credits, and fades a point every{' '}
          {RULES.memory.fadeEvery} turns.
        </p>
      </section>
    );
  };

  return (
    <div class={`diplomacy${table ? ' diplomacy-table' : ''}`}>
      <AdvisorBy faction={faction} department="envoy" />
      {heard.length === 0 ? (
        <p class="dim">We have heard no other power yet. The Watch and our survey ships will find them.</p>
      ) : (
        <div class="diplomacy-body">
          <ul class="diplomacy-powers" aria-label="Powers we know">
            {heard.map((f) => {
              const regard = attitudeOf(world, game, f, faction);
              return (
                <li key={f}>
                  <button
                    type="button"
                    class="diplomacy-power"
                    aria-pressed={pick === f}
                    aria-label={`The ${FACTIONS[f].shortName}: ${regard.word}`}
                    onClick={() => (chosen.value = !table && pick === f ? null : f)}
                  >
                    <FactionTag faction={f} />
                    <span class="dim">{contactText(game, faction, f)}</span>
                    <span class={`regard-${regard.word}`}>
                      {regard.word} ({signed(regard.total)})
                    </span>
                  </button>
                  {!table && pick === f && detail(f)}
                </li>
              );
            })}
          </ul>
          {table && pick !== null && detail(pick)}
        </div>
      )}
      {unheard.length > 0 && (
        <p class="dim">
          Not yet heard:{' '}
          {unheard.map((f, i) => (
            <span key={f}>
              {i > 0 && (i === unheard.length - 1 ? ' and ' : ', ')}the {FACTIONS[f].shortName}
            </span>
          ))}
          .
        </p>
      )}
    </div>
  );
}
