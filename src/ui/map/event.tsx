// The event card (M2_WORLDS.md §27.6): an event's picture, its title and badge, what happened, and
// its two choices, each with what it costs and what follows, said before it is chosen. The answer
// is taken as the turn ends and may be changed until then.

import { fillLine } from '../../content/advisors.ts';
import { EVENTS, type EventId } from '../../content/events.ts';
import { RULES } from '../../content/rules.ts';
import { choiceRefusal, eventWords } from '../../sim/events.ts';
import type { GameState, PendingEvent } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';
import { Badge } from '../parts.tsx';
import { give, type Play } from './play.tsx';
import './event.css';

const base = import.meta.env.BASE_URL;

/** What each event's picture shows, for those who cannot see it. */
const PICTURE_ALT: Record<EventId, string> = {
  flare: 'A red dwarf erupting in a blinding flare over a small settlement of grey domes with its shutters closed.',
  comet: 'A bright comet with a long blue tail, and a small tug closing on its icy nucleus.',
  harvest: 'Golden fields of grain at dusk on a colony world, harvesters working with their lamps on.',
  blight: 'A greenhouse of grey, spotted crops, and a worker looking closely at a sick leaf.',
  strike: 'Workers standing together outside the closed gates of a factory, idle cranes behind them.',
  epidemic: 'A clinic corridor sealed with plastic sheeting, staff in protective suits between the beds.',
  derelict: 'An ancient starship drifting dark in space, caught in a survey ship’s searchlight.',
  'lane-drift': 'A ring-shaped lane beacon flickering unevenly, a small maintenance craft beside it.',
  petition: 'Settlers with their bundles and crates at a landing field, looking up at a colony ship.',
  defectors: 'A small survey ship drifting towards a docking light, its crew at the lit window.',
  smugglers: 'A battered shuttle in a hidden corner of a spaceport, crates of glowing fuel cells being unloaded.',
  'founders-day': 'A colony square at night, crowds under lanterns and fireworks over the domes.',
  // M5 (M5_UNKNOWN.md §22).
  'dust-stirs': 'A field of fine dust swirling in slow rings round a lit excavation platform in space, crew watching.',
  'rival-dig': 'A distant excavation seen through a telescope: work lights on a dark moon, a strange ship beside it.',
  'key-sings':
    'A smooth dark object on a shelf in a dim vault, faint rings of light pulsing from it, a technician covering their ears.',
  'second-tone': 'A lane beacon with faint waves passing through it, a pilot listening with eyes closed.',
  'charts-match': 'An astronomer at night laying an old chart of glowing points over the real sky, one point circled.',
  'great-flare': 'A red dwarf erupting in an enormous flare above a planet, auroras blazing over shuttered domes.',
  nova: 'One new star blazing in a colony night sky, people on rooftops looking up.',
  'meteor-storm': 'Meteors streaking across a colony sky, a fireball breaking up above lit domes.',
  audit: 'Two officials going through ledgers and screens in a cramped customs office at night.',
  shareholders: 'A crowded hall of settlers raising hands to vote, a tally board behind the speaker.',
  feud: 'Two rough crews facing each other across a dim hangar of battered ships.',
  'long-night': 'Fields half in shadow on a twilight world, a dim red sun low on the horizon, workers with lamps.',
  'great-storm': 'A vast storm rising in a gas giant’s clouds, floating towns drawing in their cables.',
};

/** "Turns" in words. */
const turns = (n: number) => (n === 1 ? 'this turn ends' : `${n} turns`);

/** An event and its subject in a few words: "A comet at Barnard's Star", "A strike at Mars". */
export function eventTitle(
  world: World,
  game: GameState,
  ev: Pick<PendingEvent, 'id' | 'turn' | 'holding' | 'system' | 'lane' | 'ship'>,
): string {
  const def = EVENTS[ev.id];
  const words = eventWords(world, game, ev);
  if (def.subject === 'lane' && words.lane) return `${def.name}: the lane ${words.lane}`;
  if (def.subject === 'none') return def.name;
  const place = def.subject === 'colony' ? words.place : words.system;
  return place ? `${def.name} at ${place}` : def.name;
}

export function EventCard({
  world,
  game,
  faction,
  play,
}: {
  world: World;
  game: GameState;
  faction: string;
  play: Play;
}) {
  const power = game.powers.find((p) => p.faction === faction);
  const ev = power?.event;
  if (!power || !ev) return <p class="dim">No event waits for your answer.</p>;
  const def = EVENTS[ev.id];
  const words = eventWords(world, game, ev);
  const left = Math.max(1, RULES.events.waits - (game.turn - ev.turn));
  const pic = `${base}art/illustration/event-${ev.id}`;
  const star =
    (ev.id === 'flare' || ev.id === 'great-flare') && ev.system
      ? world.system(ev.system).sky.stars.find((s) => s.flareVariable !== undefined)?.flareVariable
      : undefined;
  return (
    <section class="event-card" aria-label={def.name}>
      <figure class="event-picture">
        <img
          src={`${pic}-640.webp`}
          srcset={`${pic}-640.webp 640w, ${pic}-1280.webp 1280w`}
          sizes="(min-width: 960px) 560px, 92vw"
          width={640}
          height={427}
          alt={PICTURE_ALT[ev.id]}
          decoding="async"
        />
      </figure>
      <h2 class="event-title">
        {eventTitle(world, game, ev)} <Badge kind="fiction" />
      </h2>
      <p class="event-text">{fillLine(def.text, words)}</p>
      {star && ev.system && (
        <p class="event-real">
          {star}, in {world.system(ev.system).name}, is a catalogued flare star <Badge kind="observed" />. When it
          flares here is the game’s fiction <Badge kind="fiction" />.
        </p>
      )}
      {ev.id === 'nova' && (
        <p class="event-real">
          Novae are real: a white dwarf drawing gas from a companion star flares up for weeks <Badge kind="observed" />.
          Which star, and when, is the game’s fiction <Badge kind="fiction" />.
        </p>
      )}
      <fieldset class="event-choices">
        <legend class="visually-hidden">Your answer</legend>
        {def.choices.map((c, i) => {
          const refusal = choiceRefusal(game, power.faction, i);
          return (
            <button
              key={c.name}
              type="button"
              class={`event-choice${ev.answer === i ? ' is-chosen' : ''}`}
              aria-pressed={ev.answer === i}
              disabled={refusal !== null}
              onClick={() => give(play, { type: 'answer', choice: i as 0 | 1 })}
            >
              <b>{c.name}</b> <span>{fillLine(c.does, words)}</span>
              {refusal && <span class="event-refusal">{refusal}</span>}
            </button>
          );
        })}
      </fieldset>
      <p class="dim event-when">
        {ev.answer === null
          ? `Unanswered, ${def.choices[0].name.toLowerCase()} is chosen for you when ${turns(left)}${left === 1 ? '' : ' have ended'}.`
          : 'Your answer takes effect as this turn ends; you may change it until then.'}
      </p>
    </section>
  );
}
