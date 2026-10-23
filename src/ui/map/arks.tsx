// The arks of the Unhomed on the screen (M5_UNKNOWN.md §25.6): the Arks sheet with their picture,
// what they ask and our three answers; the section in CE Boötis's panel while they wait; and the
// report's lines, the star's death among them. Arcturus and CE Boötis are real stars; the Unhomed,
// their arks and Arcturus's death are fiction, and labelled so.

import { FACTIONS, type FactionId } from '../../content/factions.ts';
import { RULES } from '../../content/rules.ts';
import { SPECIES } from '../../content/species.ts';
import type { SystemId } from '../../data/types.ts';
import { answerOf, arksRefusal, arksWaiting, givableWorlds, HEARTH, takeInPlan } from '../../sim/arks.ts';
import { habitability } from '../../sim/habitability.ts';
import type { ReportEvent } from '../../sim/report.ts';
import type { GameState } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';
import { Badge } from '../parts.tsx';
import { HABITABILITY_WORD } from '../system/words.ts';
import { holdingName } from './colony.tsx';
import { give, type Play } from './play.tsx';

const U = RULES.unhomed;
const base = import.meta.env.BASE_URL;
const people = (tenths: number) => `${tenths / 10} million`;
/** "−5", "+30". */
const signed = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);

/** "Sirius, Procyon and Earth". */
const list = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

/** The report's line for the arks (§25.6), from the player's side. */
export function arksText(world: World, e: Extract<ReportEvent, { kind: 'arks' }>, me: FactionId | undefined): string {
  const at = e.system ? world.system(e.system).name : 'a world of their own';
  const who = e.by ? (e.by === me ? 'We have' : `The ${FACTIONS[e.by].shortName} has`) : 'Someone has';
  switch (e.stage) {
    case 'arrived':
      return `Ships at ${world.system(U.at).name}, at the edge of the map: arks, very many and very old, crossing from Arcturus. The Unhomed ask every power for a world: see The arks.`;
    case 'given':
      return `${who} given the Unhomed a world at ${at}. They are the Last Hearth now, a power of their own${e.by === me ? ', and grateful to us' : ''}.`;
    case 'taken-in':
      return e.by === me
        ? 'The Unhomed have come to live among our people, and brought what they know.'
        : `${who} taken the Unhomed in among its own people.`;
    case 'took':
      return `With nowhere left to go, the Unhomed have taken a world at ${at} for themselves. They are the Last Hearth now, and remember who refused them.`;
    default:
      return `Arcturus has thrown off its outer layers in a single night: a new light in Boötes, bright enough to read by. Our astronomers study it (+${U.starResearch} research). Arcturus is real; its death is the game’s fiction.`;
  }
}

/** The real stars in it, and what is fiction. */
function RealNote() {
  return (
    <p class="event-real">
      CE Boötis and Arcturus are real stars <Badge kind="observed" />: Arcturus an old orange giant 37 light-years from
      Sol, beyond the map. Its worlds, its people and its death are the game’s fiction <Badge kind="fiction" />; the
      real star will shine for a very long time yet.
    </p>
  );
}

function Picture({ id, alt }: { id: string; alt: string }) {
  const pic = `${base}art/illustration/${id}`;
  return (
    <figure class="event-picture">
      <img
        src={`${pic}-640.webp`}
        srcset={`${pic}-640.webp 640w, ${pic}-1280.webp 1280w`}
        sizes="(min-width: 960px) 560px, 92vw"
        width={640}
        height={427}
        alt={alt}
        decoding="async"
      />
    </figure>
  );
}

/** The Arks sheet (§25.6). */
export function ArksView({
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
  const a = game.arks;
  if (!a) return <p class="dim">No one has come.</p>;
  const dead = game.turn > a.dies;
  const ours = answerOf(game, faction);
  const worlds = givableWorlds(world, game, faction);
  const chosen = ours?.answer === 'give' ? ours.body : (worlds[0]?.id ?? null);
  const plan = takeInPlan(world, game, faction);
  const left = a.dies - game.turn;
  const choose = (answer: 'give' | 'take' | 'refuse', body: string | null) =>
    give(play, { type: 'arks', answer, body });
  const ended = a.ended;
  return (
    <section class="event-card arks" aria-label="The arks of the Unhomed">
      <Picture
        id={dead ? 'arcturus-dies' : 'arks-arrive'}
        alt={
          dead
            ? 'A new, dazzling light low in Boötes, seen from a quiet world at night (fiction)'
            : 'Ancient ark ships coming out of the dark beside a dim red star (fiction)'
        }
      />
      <h2 class="event-title">
        The arks of the Unhomed <Badge kind="fiction" />
      </h2>
      <p class="event-text">
        Ships came out of the dark at {world.system(U.at).name}, at the edge of the map, on turn {a.arrived}: arks, very
        many and very old, crossing from Arcturus. Their people, the Unhomed, call to every power in every tongue they
        have learnt from our broadcasts. Their star is dying, and they ask for a world.
      </p>
      {dead && (
        <p class="event-text">
          Arcturus has died: it threw off its outer layers in a single night, and the Unhomed have nowhere to go back
          to.
        </p>
      )}
      <RealNote />
      {ended ? (
        <p class="arks-ended">
          {ended.how === 'given'
            ? `${ended.by === faction ? 'We' : `The ${ended.by ? FACTIONS[ended.by].shortName : 'others'}`} gave them a world at ${ended.body ? worldName(world, game, ended.body) : 'one of their own'}: they are the Last Hearth now.`
            : ended.how === 'taken-in'
              ? `${ended.by === faction ? 'We' : `The ${ended.by ? FACTIONS[ended.by].shortName : 'others'}`} took them in among ${ended.by === faction ? 'our' : 'its'} own people.`
              : `They took a world for themselves at ${ended.body ? worldName(world, game, ended.body) : 'the edge'}: they are the Last Hearth now, and remember who refused them.`}
        </p>
      ) : faction === HEARTH ? null : (
        <>
          <fieldset class="event-choices">
            <legend class="visually-hidden">Our answer</legend>
            <div class={`event-choice arks-give${ours?.answer === 'give' ? ' is-chosen' : ''}`}>
              <b>Give them a world</b>{' '}
              <span>
                They settle there as the Last Hearth, a power of their own, grateful to us ({signed(U.gave)}).
              </span>
              {worlds.length === 0 ? (
                <span class="event-refusal">We hold no system with a free world they could live on.</span>
              ) : (
                <label class="arks-world">
                  <span>The world</span>
                  <select
                    value={chosen ?? ''}
                    onChange={(e) => choose('give', (e.target as HTMLSelectElement).value)}
                    aria-label="The world we give them"
                  >
                    {worlds.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}, {world.system(b.systemId).name}:{' '}
                        {HABITABILITY_WORD[habitability(b, SPECIES.unhomed).level].toLowerCase()} for them
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    class="button button-small"
                    aria-pressed={ours?.answer === 'give'}
                    onClick={() => choose('give', chosen)}
                  >
                    Give it
                  </button>
                </label>
              )}
            </div>
            <button
              type="button"
              class={`event-choice${ours?.answer === 'take' ? ' is-chosen' : ''}`}
              aria-pressed={ours?.answer === 'take'}
              disabled={arksRefusal(world, game, faction, 'take', null) !== null || plan.length === 0}
              onClick={() => choose('take', null)}
            >
              <b>Take them in</b>{' '}
              <span>
                {plan.length === 0
                  ? 'We have no colony with room for them.'
                  : `${list(plan.map((p) => `${people(p.people)} to ${holdingName(world, game, p.holding)}`))}, and ${U.takeInResearch} research from what they know; ${signed(U.takeInApproval)} approval there for ${U.takeInTurns} turns while they settle.`}
              </span>
            </button>
            <button
              type="button"
              class={`event-choice${ours?.answer === 'refuse' ? ' is-chosen' : ''}`}
              aria-pressed={ours?.answer === 'refuse'}
              onClick={() => choose('refuse', null)}
            >
              <b>Refuse</b> <span>If they find a world, they remember it ({signed(U.refused)}).</span>
            </button>
          </fieldset>
          <p class="dim event-when">
            {ours
              ? 'Our answer takes effect as this turn ends, if no answer that settles them comes first; we may change it until then.'
              : `Their star dies in ${left} turn${left === 1 ? '' : 's'}. The first answer that settles them takes effect as its turn ends, a world given before a taking-in. Still waiting when their star dies, they take a world for themselves.`}
          </p>
        </>
      )}
    </section>
  );
}

/** A body's name and its system's, from its id. */
function worldName(world: World, game: GameState, body: string): string {
  const h = game.holdings.find((x) => x.body === body);
  if (h) return holdingName(world, game, h);
  return body;
}

/** In CE Boötis's panel while the arks wait (§25.6). */
export function ArksSection({ game, system, onArks }: { game: GameState; system: SystemId; onArks?: () => void }) {
  if (system !== U.at || !arksWaiting(game)) return null;
  return (
    <section class="arks-here" aria-label="The arks">
      <h3>
        The arks of the Unhomed <Badge kind="fiction" />
      </h3>
      <p>Very many and very old, they wait here, asking every power for a world.</p>
      {onArks && (
        <button type="button" class="button button-small" onClick={onArks}>
          Answer them
        </button>
      )}
    </section>
  );
}
