// The Assembly on the screen (M4_FLEETS.md §29.4, D-67): its chamber, its members and their votes,
// the election or the resolution before it with our vote, how the rivals lean, and what we may
// propose; and its events in the report.

import { FACTIONS, type FactionId } from '../../content/factions.ts';
import { RULES } from '../../content/rules.ts';
import {
  candidatesOf,
  electionLean,
  onTheFloor,
  proposals,
  proposeRefusal,
  resolutionLean,
  resolutionWords,
  rollOf,
  voteRefusal,
} from '../../sim/assembly.ts';
import type { ReportEvent } from '../../sim/report.ts';
import { contactWith, type GameState, powerOf, type VoteChoice } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';
import { Badge, FactionTag } from '../parts.tsx';
import { give, type Play } from './play.tsx';
import './assembly.css';

const the = (f: FactionId) => `the ${FACTIONS[f].shortName}`;
const The = (f: FactionId) => `The ${FACTIONS[f].shortName}`;
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "the Frontier Co-op, the Hollow Wake and the Drift Moot". */
function names(fs: readonly FactionId[], me?: FactionId): string {
  const n = fs.map((f) => (f === me ? 'us' : the(f)));
  return n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} and ${n.at(-1)}`;
}

/** The report's line for an event of the Assembly's, from the player's side (§29.4). */
export function assemblyText(e: ReportEvent, me: FactionId | undefined): string | null {
  const every = RULES.assembly.every;
  switch (e.kind) {
    case 'assembly-formed':
      return `The Assembly has formed, its first members ${names(e.members, me)}. Its first election is in ${every} turns; two thirds of all the votes choose its leader.`;
    case 'assembly-joined':
      return e.faction === me
        ? 'We have joined the Assembly, with a vote for every million of our people.'
        : `${The(e.faction)} has joined the Assembly.`;
    case 'candidates':
      return `The Assembly elects its leader next turn: ${e.a === me ? 'us' : the(e.a)} or ${e.b === me ? 'us' : the(e.b)}. Cast our vote in the Assembly.`;
    case 'elected': {
      if (e.faction === null)
        return `The Assembly’s election was tied, ${e.votes} votes each: its leader stays as it was.`;
      const who = e.faction === me ? 'We lead' : `${The(e.faction)} leads`;
      const line = `${who} the Assembly, with ${e.votes} of its ${e.total} votes to ${e.against}.`;
      if (!e.chosen) return line;
      return `${line} Two thirds: the Assembly has chosen ${e.faction === me ? 'us' : the(e.faction)}.`;
    }
    case 'resolution': {
      const words = resolutionWords({ kind: e.resolution, on: e.on, and: e.and });
      const by = e.by === me ? 'We propose' : `${The(e.by)} proposes`;
      switch (e.stage) {
        case 'proposed':
          return `${by} ${words}: the Assembly votes on it next turn.`;
        case 'passed':
          return `The Assembly passed ${words}, ${e.for} votes to ${e.against}.`;
        case 'failed':
          return `The Assembly rejected ${words}, ${e.for} votes to ${e.against}.`;
        case 'lapsed':
          return `${capital(words)} lapsed: the war it was about is over.`;
      }
      return null;
    }
    case 'sanctions':
      if (!e.laid) return `The Assembly’s sanctions on ${e.faction === me ? 'us' : the(e.faction)} are lifted.`;
      return e.faction === me
        ? 'The Assembly’s sanctions fall on us: no member trades with us while we are at war with any of them.'
        : `The Assembly’s sanctions fall on ${the(e.faction)}: no member trades with it while it is at war with a member.`;
    default:
      return null;
  }
}

/** A rival's lean in words, where we can talk with it (§29.4). */
function leanWords(choice: VoteChoice, me: FactionId, who: FactionId): string {
  if (choice === who) return 'a candidate: votes for itself';
  if (choice === 'abstain') return 'undecided';
  if (choice === 'for' || choice === 'against') return `leans ${choice}`;
  return `leans to ${choice === me ? 'us' : the(choice)}`;
}

export function AssemblyView({
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
  const a = game.assembly;
  const me = powerOf(game, faction);
  const base = `${import.meta.env.BASE_URL}art/illustration/assembly-chamber`;
  const picture = (
    <figure class="assembly-art">
      <img
        src={`${base}-640.webp`}
        srcset={`${base}-640.webp 640w, ${base}-1280.webp 1280w`}
        sizes="(min-width: 900px) 680px, 100vw"
        width={640}
        height={427}
        alt="A great round assembly hall aboard a station, delegates on curved tiers round a speaker, a Duskfolk delegate among them."
        decoding="async"
      />
    </figure>
  );
  if (!a) {
    const talking = me.contacts.filter((c) => c.stage === 'talk').length;
    return (
      <div class="assembly">
        {picture}
        <p>
          <Badge kind="fiction" /> The Assembly forms once three powers can each talk with the other two: its members
          vote, a vote for every million of their people, and elect a leader every {RULES.assembly.every} turns.
        </p>
        <p class="dim">
          We can talk with {talking} {talking === 1 ? 'power' : 'powers'} so far.
        </p>
      </div>
    );
  }

  const member = a.members.includes(faction);
  const total = a.roll.reduce((n, r) => n + r.votes, 0);
  const needed = Math.ceil((total * RULES.assembly.chosenParts) / RULES.assembly.chosenOf);
  const floor = onTheFloor(game);
  const ours = a.cast.find((c) => c.faction === faction)?.choice ?? null;
  // How each member stands on what is before it: ours as cast, the rivals' as they lean, where we can
  // talk with them; the subdued with their victor.
  const leanOf = (f: FactionId): VoteChoice | null => {
    if (!floor) return null;
    if (f === faction) return ours ?? 'abstain';
    if (contactWith(me, f)?.stage !== 'talk') return null;
    return floor === 'election' ? electionLean(world, game, f) : resolutionLean(world, game, f);
  };
  const vote = (choice: VoteChoice, label: string) => {
    const refusal = voteRefusal(game, faction, choice);
    return (
      <button
        key={choice}
        type="button"
        class="button button-small"
        aria-pressed={ours === choice}
        disabled={refusal !== null}
        title={refusal ?? undefined}
        onClick={() => give(play, { type: 'vote', choice })}
      >
        {label}
      </button>
    );
  };
  const tallyOf = (choice: VoteChoice) =>
    a.members.reduce((n, f) => {
      const victor = powerOf(game, f).subduedBy;
      const lean = leanOf(victor && a.members.includes(victor) ? victor : f);
      return lean === choice ? n + rollOf(game, f) : n;
    }, 0);
  const r = a.resolution;
  const next = a.candidates ?? candidatesOf(game, (f) => rollOf(game, f));

  return (
    <div class="assembly">
      {picture}
      <p>
        <Badge kind="fiction" /> Formed on turn {a.formed}: {a.members.length} members, {total} votes in all; two thirds
        is {needed}. {a.leader ? `Led by ${a.leader === faction ? 'us' : the(a.leader)}.` : 'No leader yet.'}
      </p>
      {a.chosen && (
        <p class="assembly-chosen">
          The Assembly has chosen {a.chosen === faction ? 'us' : the(a.chosen)} by two thirds of its votes.
        </p>
      )}
      {!member && <p class="dim">We are not a member: we join once we can talk with one of its members.</p>}

      <ul class="assembly-members" aria-label="Members">
        {a.members.map((f) => {
          const votes = rollOf(game, f);
          const lean = leanOf(f);
          const victor = powerOf(game, f).subduedBy;
          return (
            <li key={f} class={f === faction ? 'assembly-us' : undefined}>
              <span class="assembly-who">
                <FactionTag faction={f} />
                {f === faction && <span class="dim"> (us)</span>}
                {a.leader === f && <b class="assembly-tag">leads</b>}
                {a.sanctions.some((s) => s.on === f) && <b class="at-war">sanctioned</b>}
                {victor && <b class="at-war">votes with {the(victor)}</b>}
              </span>
              <span class="assembly-votes">
                {votes} {votes === 1 ? 'vote' : 'votes'}
              </span>
              <span class="assembly-bar" aria-hidden="true">
                <span style={{ width: `${Math.round((votes * 100) / Math.max(1, total))}%` }} />
              </span>
              {lean !== null && f !== faction && <span class="dim assembly-lean">{leanWords(lean, faction, f)}</span>}
            </li>
          );
        })}
      </ul>

      {floor === 'election' && a.candidates && (
        <section class="assembly-floor" aria-label="The election">
          <h3>The election, this turn</h3>
          <p>
            {capital(a.candidates.map((c) => (c === faction ? 'we' : the(c))).join(' or '))}: votes are counted as the
            turn ends. As they lean now:{' '}
            {a.candidates.map((c) => `${c === faction ? 'us' : the(c)} ${tallyOf(c)}`).join(', ')} of {total}; {needed}{' '}
            choose a leader outright.
          </p>
          {member && (
            <div class="assembly-buttons">
              {a.candidates.map((c) => vote(c, c === faction ? 'For us' : `For ${the(c)}`))}
              {vote('abstain', 'Abstain')}
            </div>
          )}
          {me.subduedBy && <p class="dim">Our votes go as {the(me.subduedBy)}’s do.</p>}
        </section>
      )}

      {floor === 'resolution' && r && (
        <section class="assembly-floor" aria-label="The resolution">
          <h3>Before the Assembly: {resolutionWords(r)}</h3>
          <p>
            Proposed by {r.by === faction ? 'us' : the(r.by)}; counted as the turn ends. As they lean now:{' '}
            {tallyOf('for')} for, {tallyOf('against')} against.
          </p>
          {member && (
            <div class="assembly-buttons">
              {vote('for', 'For')}
              {vote('against', 'Against')}
              {vote('abstain', 'Abstain')}
            </div>
          )}
        </section>
      )}

      {r && r.turn === game.turn + 1 && (
        <p>
          {capital(resolutionWords(r))}, proposed by {r.by === faction ? 'us' : the(r.by)}, goes before the Assembly
          next turn.
        </p>
      )}

      {floor !== 'election' && (
        <p class="dim">
          Next election: turn {a.election}, in {a.election - game.turn}{' '}
          {a.election - game.turn === 1 ? 'turn' : 'turns'}
          {next ? `; the candidates now would be ${names(next, faction)}` : ''}.
        </p>
      )}

      {a.sanctions.length > 0 && (
        <p>
          Sanctions on{' '}
          {names(
            a.sanctions.map((s) => s.on),
            faction,
          )}
          : no member trades with them while they are at war with a member.
        </p>
      )}
      {a.calls.map((c) => (
        <p key={`${c.a}-${c.b}`}>
          The Assembly calls on {names([c.a, c.b], faction)} to make peace by turn {c.until}: whichever has not offered
          peace without terms by then is sanctioned.
        </p>
      ))}

      {member && (
        <section class="assembly-propose" aria-label="Propose">
          <h3>Propose</h3>
          {proposals(game).length === 0 ? (
            <p class="dim">Nothing to propose: no member is at war with another.</p>
          ) : (
            <div class="assembly-buttons">
              {proposals(game).map((p) => {
                const refusal = proposeRefusal(game, faction, p);
                return (
                  <button
                    key={`${p.kind}-${p.on}-${p.and ?? ''}`}
                    type="button"
                    class="button button-small"
                    disabled={refusal !== null}
                    title={refusal ?? undefined}
                    onClick={() =>
                      give(play, { type: 'propose', resolution: p.kind, on: p.on, ...(p.and ? { and: p.and } : {}) })
                    }
                  >
                    {capital(resolutionWords(p))}
                  </button>
                );
              })}
            </div>
          )}
          <p class="dim">
            Sanctions end every member’s trade with a member at war; a call for peace gives two members at war{' '}
            {RULES.assembly.callTurns} turns to offer peace. One resolution at a time, and one from each member every{' '}
            {RULES.assembly.proposeEvery} turns.
          </p>
        </section>
      )}
    </div>
  );
}
