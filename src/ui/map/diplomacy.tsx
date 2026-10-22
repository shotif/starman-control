// The diplomacy screen, the Envoy's (M3_NEIGHBOURS.md §20.3, §23.7): every power you are in
// contact with, how it regards you and why, and what you can do for it: treaties, exchanges and
// gifts. On a desktop the powers in a list with the chosen one beside it; on a phone a card for
// each, the chosen one opened under its card.

import { useSignal } from '@preact/signals';
import { FACTIONS, type FactionId } from '../../content/factions.ts';
import { RULES } from '../../content/rules.ts';
import { TREATIES, TREATY_KINDS } from '../../content/treaties.ts';
import { tradeOf } from '../../sim/borders.ts';
import { attitudeOf, giftRefusal } from '../../sim/memory.ts';
import { type Amount, contactWith, type GameState, inContact, powerOf, treatyOf } from '../../sim/state.ts';
import {
  amountWords,
  exchangeShort,
  isSold,
  offerRefusal,
  priceOf,
  RESOURCES,
  sellerOf,
  wouldAccept,
  wouldExchange,
} from '../../sim/treaties.ts';
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

/**
 * The treaties with a power (§21.5, §23.7): those in force, offers both ways, and what can be
 * offered. Passage and protection only where one of us sells them, with their price a turn.
 */
function Treaties({
  world,
  game,
  faction,
  other,
  play,
  regard,
}: {
  world: World;
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
          const seller = isSold(kind) ? sellerOf(kind, faction, other) : null;
          if (isSold(kind) && !seller) return null;
          const held = treatyOf(game, faction, other, kind);
          const theirs = game.offers.find((o) => o.from === other && o.to === faction && o.kind === kind);
          const ours = game.offers.find((o) => o.from === faction && o.to === other && o.kind === kind);
          const asks = FACTIONS[other].asks[kind];
          const price = seller
            ? priceOf(game, { kind, a: faction, b: other, payer: seller === faction ? other : faction })
            : 0;
          const verb = seller === faction ? 'Sell' : seller ? 'Buy' : 'Offer';
          return (
            <li key={kind}>
              <b>{t.name}</b> <span class="dim">{t.does}</span>
              {kind === 'trade' && (
                <span class="dim"> Now it would bring {tradeOf(game, faction, other)} credits a turn each.</span>
              )}
              {seller && (
                <span class="dim">
                  {' '}
                  {seller === faction
                    ? `It brings us ${price} credits a turn.`
                    : `It costs us ${price} credits a turn.`}
                </span>
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
                  {seller === other ? 'They offer to sell it.' : seller ? 'They offer to buy it.' : 'They offer it.'}{' '}
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
                    aria-label={
                      verb === 'Sell'
                        ? `Sell the ${name} ${t.words}`
                        : verb === 'Buy'
                          ? `Buy ${t.words} from the ${name}`
                          : `Offer the ${name} ${t.words}`
                    }
                    disabled={offerRefusal(game, faction, other, kind) !== null}
                    onClick={() => give(play, { type: 'offer', to: other, treaty: kind })}
                  >
                    {verb} it
                  </button>{' '}
                  <span class="dim">
                    {asks === null
                      ? 'They never agree to it.'
                      : wouldAccept(world, game, other, faction, kind)
                        ? 'Their regard is enough: likely yes.'
                        : regard >= asks
                          ? `Likely no: the buyer must have ${RULES.treaties.afford} credits in hand.`
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

const RESOURCE_NAME: Record<Amount['resource'], string> = {
  credits: 'credits',
  metals: 'metals',
  volatiles: 'volatiles',
  fuel: 'fusion fuel',
};

/** One side of an exchange: how much of what. */
function AmountPicker({ label, value, set }: { label: string; value: Amount; set: (a: Amount) => void }) {
  const x = RULES.exchanges;
  const steps = Array.from({ length: x.most / x.step }, (_, i) => (i + 1) * x.step);
  return (
    <span class="diplomacy-amount">
      <select
        aria-label={`How much ${label}`}
        value={value.amount}
        onChange={(e) => set({ ...value, amount: Number((e.target as HTMLSelectElement).value) })}
      >
        {steps.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <select
        aria-label={`What ${label}`}
        value={value.resource}
        onChange={(e) => set({ ...value, resource: (e.target as HTMLSelectElement).value as Amount['resource'] })}
      >
        {RESOURCES.map((r) => (
          <option key={r} value={r}>
            {RESOURCE_NAME[r]}
          </option>
        ))}
      </select>
    </span>
  );
}

/** Exchanges with a power (§23.1, §23.7): one waiting for our answer, ours on its way, or a new one. */
function Exchange({
  world,
  game,
  faction,
  other,
  play,
}: {
  world: World;
  game: GameState;
  faction: FactionId;
  other: FactionId;
  play: Play;
}) {
  const x = RULES.exchanges;
  const ours = useSignal<Amount>({ resource: 'credits', amount: x.offerCredits });
  const wanted = useSignal<Amount>({ resource: 'metals', amount: x.offerAmount });
  const name = FACTIONS[other].shortName;
  const theirs = game.offers.find(
    (o) => o.kind === 'exchange' && o.from === other && o.to === faction && o.turn < game.turn,
  );
  const sent = game.offers.find((o) => o.kind === 'exchange' && o.from === faction && o.to === other);
  const offer = {
    kind: 'exchange' as const,
    from: faction,
    to: other,
    turn: game.turn,
    give: ours.value,
    get: wanted.value,
  };
  const refusal = offerRefusal(game, faction, other, 'exchange', ours.value, wanted.value);
  const short = theirs ? exchangeShort(game, faction, other) : null;
  return (
    <>
      <h4>An exchange</h4>
      {theirs?.give && theirs.get && (
        <p>
          They offer {amountWords(theirs.give)} for {amountWords(theirs.get)}.{' '}
          <button
            type="button"
            class="button button-small"
            aria-label={`Accept the ${name}’s exchange`}
            disabled={short !== null}
            title={short ?? undefined}
            onClick={() => give(play, { type: 'answer-offer', from: other, treaty: 'exchange', accept: true })}
          >
            Accept
          </button>{' '}
          <button
            type="button"
            class="button button-quiet button-small"
            aria-label={`Refuse the ${name}’s exchange`}
            onClick={() => give(play, { type: 'answer-offer', from: other, treaty: 'exchange', accept: false })}
          >
            Refuse
          </button>
          {short && <span class="dim"> {short}</span>}
        </p>
      )}
      {sent?.give && sent.get ? (
        <p class="dim">
          Our offer of {amountWords(sent.give)} for {amountWords(sent.get)} reaches them as the turn ends.
        </p>
      ) : (
        <>
          <p class="diplomacy-exchange">
            We give <AmountPicker label="we give" value={ours.value} set={(a) => (ours.value = a)} /> for{' '}
            <AmountPicker label="we ask for" value={wanted.value} set={(a) => (wanted.value = a)} />
          </p>
          <p>
            <button
              type="button"
              class="button button-small"
              aria-label={`Offer the ${name} this exchange`}
              disabled={refusal !== null}
              onClick={() =>
                give(play, { type: 'offer', to: other, treaty: 'exchange', give: ours.value, get: wanted.value })
              }
            >
              Offer it
            </button>{' '}
            <span class="dim">
              {refusal ??
                (wouldExchange(world, game, other, offer)
                  ? 'Fair by their measure: likely yes.'
                  : 'Likely no: they would want more for it.')}
            </span>
          </p>
        </>
      )}
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
        <Treaties world={world} game={game} faction={faction} other={other} play={play} regard={regard.total} />
        {contactWith(me, other)?.stage === 'talk' && (
          <Exchange world={world} game={game} faction={faction} other={other} play={play} />
        )}
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
          A gift is remembered at 1 for every {FACTIONS[other].giftCredits} credits, and fades a point every{' '}
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
