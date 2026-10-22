// Leaders on the screen (M5_UNKNOWN.md §24.6): the Leaders screen (ours, where each serves, and the
// people offered), a leader's line wherever their post is (a fleet, a colony, the research, the
// diplomacy screen), and the report's lines. Every leader is fiction, and labelled so.

import { FACTIONS, type FactionId } from '../../content/factions.ts';
import { CALLING_DEFS, type Calling, FLAW_DEFS, facePortrait, TRAITS } from '../../content/leaders.ts';
import { RULES } from '../../content/rules.ts';
import { candidatesFor, hireRefusal, leadersOf, leaderTitle, postedLeader, wagesOf } from '../../sim/leaders.ts';
import type { ReportEvent } from '../../sim/report.ts';
import { type GameState, type Leader, powerOf } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';
import { Badge } from '../parts.tsx';
import { holdingName } from './colony.tsx';
import { give, type Play } from './play.tsx';
import './leaders.css';

const L = RULES.leaders;
const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];

/** The report's line for a leader's news (§24.6). */
export function leaderText(e: Extract<ReportEvent, { kind: 'offered' | 'leader' }>): string {
  if (e.kind === 'offered')
    return `${NUMBER_WORDS[e.count] ?? e.count} people offer to serve us: see the Leaders screen.`;
  const who = leaderTitle(e);
  const them = e.faction ? FACTIONS[e.faction].shortName : 'a rival';
  switch (e.what) {
    case 'grew':
      return `${who} is now ${e.trait ? TRAITS[e.trait].name : 'more able'} ${e.level ?? ''}.`.replace(' .', '.');
    case 'debt':
      return `${who} has left our service: our treasury is empty.`;
    case 'unhappy':
      return `${who} has left our service: the colony they kept is unhappy.`;
    case 'lured':
      return `${who} has left us for the ${them}, whose agents knew our secrets.`;
    case 'fell':
      return `${who} fell with their fleet.`;
    default:
      return `${who} has left the ${them} to serve us.`;
  }
}

/** A leader's face (§24.7). */
export function LeaderFace({ leader, size = 56 }: { leader: Pick<Leader, 'people' | 'face'>; size?: number }) {
  return (
    <img
      class="advisor-face leader-face"
      src={`${import.meta.env.BASE_URL}art/portrait/${facePortrait(leader.people, leader.face)}-128.webp`}
      width={size}
      height={size}
      alt=""
      decoding="async"
    />
  );
}

/** What a leader's traits give, one line each: "Beloved 2: +6 approval at the colony". */
function TraitList({ leader }: { leader: Pick<Leader, 'traits' | 'flaw'> }) {
  return (
    <ul class="leader-traits">
      {leader.traits.map((t) => (
        <li key={t.trait}>
          <b>
            {TRAITS[t.trait].name} {t.level}
          </b>
          : {TRAITS[t.trait].gives(t.level)}
        </li>
      ))}
      {leader.flaw && (
        <li class="leader-flaw">
          <b>{FLAW_DEFS[leader.flaw].name}</b>: {FLAW_DEFS[leader.flaw].does}
        </li>
      )}
    </ul>
  );
}

/** Whose people a leader is, when not the power's own: "Of the Drift Moot. ". */
const ofPeople = (l: Pick<Leader, 'people' | 'serves'>) =>
  l.people === l.serves ? '' : `Of the ${FACTIONS[l.people].shortName}. `;

/**
 * The leader in a post, for the screen where that post is (§24.6): "Steward Ines Barros: Beloved 2,
 * +6 approval at the colony." Nothing when no one serves there.
 */
export function LeaderLine({
  game,
  faction,
  calling,
  post = 0,
}: {
  game: GameState;
  faction: FactionId;
  calling: Calling;
  post?: number;
}) {
  const l = postedLeader(game, faction, calling, post);
  if (!l) return null;
  return (
    <div class="leader-line">
      <LeaderFace leader={l} size={36} />
      <span>
        <b>{leaderTitle(l)}</b>:{' '}
        {l.traits.map((t) => `${TRAITS[t.trait].name} ${t.level}, ${TRAITS[t.trait].gives(t.level)}`).join('; ')}.
      </span>
    </div>
  );
}

/** Where a leader serves, and the order to post them elsewhere or call them back. */
function PostControl({
  world,
  game,
  faction,
  play,
  leader,
}: {
  world: World;
  game: GameState;
  faction: FactionId;
  play: Play;
  leader: Leader;
}) {
  const def = CALLING_DEFS[leader.calling];
  if (def.single) {
    const there = postedLeader(game, faction, leader.calling);
    return leader.post === 0 ? (
      <p class="leader-post">
        Serves {def.post}.{' '}
        <button
          type="button"
          class="button button-small button-quiet"
          onClick={() => give(play, { type: 'post', leader: leader.id, post: null })}
        >
          Call back
        </button>
      </p>
    ) : (
      <p class="leader-post">
        Waiting.{' '}
        <button
          type="button"
          class="button button-small"
          onClick={() => give(play, { type: 'post', leader: leader.id, post: 0 })}
        >
          Post as {def.title.toLowerCase()}
          {there ? `, in place of ${there.name}` : ''}
        </button>
      </p>
    );
  }
  const places =
    leader.calling === 'commander'
      ? game.fleets.filter((f) => f.owner === faction).map((f) => ({ id: f.id, name: f.name }))
      : game.holdings
          .filter((h) => h.owner === faction && h.kind === 'colony')
          .map((h) => ({ id: h.id, name: holdingName(world, game, h) }));
  return (
    <label class="leader-post">
      <span>Serves</span>
      <select
        value={leader.post === null ? '' : String(leader.post)}
        onChange={(e) => {
          const v = (e.target as HTMLSelectElement).value;
          give(play, { type: 'post', leader: leader.id, post: v === '' ? null : Number(v) });
        }}
      >
        <option value="">nowhere: waiting</option>
        {places.map((p) => {
          const there = postedLeader(game, faction, leader.calling, p.id);
          return (
            <option key={p.id} value={String(p.id)}>
              {p.name}
              {there && there.id !== leader.id ? ` (in place of ${there.name})` : ''}
            </option>
          );
        })}
      </select>
      {places.length === 0 && (
        <span class="dim">We have no {leader.calling === 'commander' ? 'fleet' : 'colony'} to post them to.</span>
      )}
    </label>
  );
}

/** The Leaders screen (§24.6). */
export function LeadersView({
  world,
  game,
  faction,
  play,
}: {
  world: World;
  game: GameState;
  faction: FactionId;
  play: Play;
}) {
  const ours = leadersOf(game, faction);
  const offered = candidatesFor(game, faction);
  // Offers are made as a turn ends whose number is one past a multiple of the interval (§24.3).
  const next = L.offerEvery - ((game.turn - 2 + L.offerEvery) % L.offerEvery);
  const treasury = powerOf(game, faction).treasury;
  return (
    <div class="leaders">
      <p>
        <Badge kind="fiction" /> Named people who serve us, each in one calling: a commander leads a fleet, a steward
        keeps a colony, a scholar our research, an ambassador our dealings and our seat in the Assembly, a spymaster our
        agents. They grow with the turns they serve, and may leave if we keep them badly.
      </p>

      <section aria-label="Our leaders">
        <h3>
          Ours: {ours.length} of {L.most}
          {ours.length > 0 && <span class="dim"> · wages {wagesOf(game, faction)} credits a turn</span>}
        </h3>
        {ours.length === 0 ? (
          <p class="dim">None yet. Hire one of those offered below.</p>
        ) : (
          <ul class="leader-list">
            {ours.map((l) => (
              <li key={l.id} class="leader-card">
                <LeaderFace leader={l} />
                <div class="leader-body">
                  <h4>{leaderTitle(l)}</h4>
                  <p class="dim">
                    {ofPeople(l)}
                    {l.wage} credits a turn; {l.served} turn{l.served === 1 ? '' : 's'} in a post.
                  </p>
                  <TraitList leader={l} />
                  <PostControl world={world} game={game} faction={faction} play={play} leader={l} />
                  <button
                    type="button"
                    class="button button-small button-quiet"
                    onClick={() => give(play, { type: 'dismiss', leader: l.id })}
                    aria-label={`Dismiss ${leaderTitle(l)}`}
                  >
                    Dismiss
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Offered to us">
        <h3>Offered to us</h3>
        <p class="dim">
          New people come every {L.offerEvery} turns, the next in {next} turn{next === 1 ? '' : 's'}; those not hired
          go. Our treasury: {treasury} credits.
        </p>
        {offered.length === 0 ? (
          <p class="dim">No one yet.</p>
        ) : (
          <ul class="leader-list">
            {offered.map((c) => {
              const refusal = hireRefusal(game, faction, c.id);
              return (
                <li key={c.id} class="leader-card">
                  <LeaderFace leader={c} />
                  <div class="leader-body">
                    <h4>{leaderTitle(c)}</h4>
                    <p class="dim">
                      {ofPeople(c)}
                      Would serve {CALLING_DEFS[c.calling].post}, for {c.wage} credits a turn.
                    </p>
                    <TraitList leader={c} />
                    {refusal ? (
                      <p class="dim">{refusal}</p>
                    ) : (
                      <button
                        type="button"
                        class="button button-small"
                        onClick={() => give(play, { type: 'hire', leader: c.id })}
                        aria-label={`Hire ${leaderTitle(c)} for ${c.fee} credits`}
                      >
                        Hire: {c.fee} credits
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
