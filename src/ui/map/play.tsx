// The parts of the map screen that exist only in a game (M1_TURNS.md §6): resources, ships and their
// orders, choosing where a ship goes, the report, and what needs you. The same parts serve both
// layouts; the map screen places them as sheets on a phone and as panels on a desktop.

import { useState } from 'preact/hooks';
import { settings } from '../../app/settings.ts';
import { DEPARTMENT_NAMES, fillLine } from '../../content/advisors.ts';
import { ANOMALIES, type AnomalyReward } from '../../content/anomalies.ts';
import { ZONE_DEFS } from '../../content/districts.ts';
import { EDICTS, PRIORITY_DEFS } from '../../content/edicts.ts';
import { EVENTS } from '../../content/events.ts';
import { FACTIONS, type FactionId } from '../../content/factions.ts';
import { itemName, PROJECTS, projectWords, withArticle } from '../../content/projects.ts';
import { SHIPS } from '../../content/ships.ts';
import { TECHS } from '../../content/techs.ts';
import { TREATIES } from '../../content/treaties.ts';
import type { SystemId } from '../../data/types.ts';
import { adviceFor } from '../../sim/advice.ts';
import { anomalyAt, investigateRefusal, investigationTurns, rewardTimes } from '../../sim/anomalies.ts';
import { bodiesOf } from '../../sim/bodies.ts';
import { formatDate } from '../../sim/calendar.ts';
import { observationWords } from '../../sim/discoveries.ts';
import { eventWords } from '../../sim/events.ts';
import { formatLy } from '../../sim/geometry.ts';
import { blindJumpTurns, blindReachDeci, canJumpBlind, previewMove } from '../../sim/movement.ts';
import { type Need, needsOf } from '../../sim/needs.ts';
import type { Order } from '../../sim/orders.ts';
import type { ReportEvent } from '../../sim/report.ts';
import { type GameState, playerPower, type ShipState } from '../../sim/state.ts';
import { laneEnds, type World } from '../../sim/world.ts';
import { Icon, type IconName } from '../icons.tsx';
import { AdvisorFace, Badge, FactionMark } from '../parts.tsx';
import { Founding, holdingName, needText } from './colony.tsx';
import { eventTitle } from './event.tsx';
import { say, targeting } from './state.ts';

export interface Play {
  faction: FactionId;
  order(o: Order): string | null;
  endTurn(): Promise<void>;
  leave(): Promise<void>;
  resolving: boolean;
  needs: readonly Need[];
}

/** Gives an order and says why if it is refused. Returns whether it was given. */
export function give(play: Play, o: Order): boolean {
  const reason = play.order(o);
  if (reason) say(reason);
  return reason === null;
}

/** "Idle at Tau Ceti", "Bound for Epsilon Eridani: 1 turn", "On a blind jump to Ross 128: lands next turn". */
export function shipStatus(world: World, game: GameState, ship: ShipState): string {
  const j = ship.blindJump;
  if (j && ship.at === null)
    return `On a blind jump to ${world.system(j.to).name}: lands ${j.left <= 1 ? 'when this turn ends' : `in ${j.left} turns`}`;
  const here = ship.at ? world.system(ship.at).name : 'nowhere';
  if (j) return `At ${here}, to jump blind for ${world.system(j.to).name} (${j.turns} turn${j.turns > 1 ? 's' : ''})`;
  if (ship.destinations.length > 0) {
    const p = previewMove(world, game, ship, ship.destinations);
    const last = world.system(ship.destinations.at(-1) as SystemId).name;
    const via =
      ship.destinations.length > 1
        ? `, by ${ship.destinations.length - 1} waypoint${ship.destinations.length > 2 ? 's' : ''}`
        : '';
    return p
      ? `At ${here}, bound for ${last}${via}: ${p.turns} turn${p.turns === 1 ? '' : 's'}`
      : `At ${here}, bound for ${last}`;
  }
  if (ship.investigating) {
    const id = anomalyAt(game.seed, ship.investigating.system);
    const left = ship.investigating.left;
    return `Investigating ${id ? ANOMALIES[id].name.replace(/^An? /, (m) => m.toLowerCase()) : 'an anomaly'} at ${here}: ${left === 1 ? 'done when this turn ends' : `${left} turns left`}`;
  }
  if (ship.founding && ship.at) {
    const b = bodiesOf(world, game.seed, ship.at).find((x) => x.id === ship.founding?.body);
    return `Founding ${ship.founding.kind === 'colony' ? 'a colony' : 'an outpost'} on ${b?.name ?? 'a world'} at ${here}`;
  }
  if (ship.hold) return `Holding at ${here}`;
  return `Idle at ${here}`;
}

export function ShipPanel({
  world,
  game,
  ship,
  play,
  onGo,
}: {
  world: World;
  game: GameState;
  ship: ShipState;
  play: Play;
  onGo: (id: SystemId) => void;
}) {
  const def = SHIPS[ship.type];
  const moving = ship.destinations.length > 0 || ship.blindJump !== null;
  const inFlight = ship.at === null;
  const reach = blindReachDeci(game, ship.owner);
  return (
    <article class="ship-panel" aria-label={ship.name}>
      {ship.at && (
        <button type="button" class="link back-link" onClick={() => onGo(ship.at as SystemId)}>
          ← {world.system(ship.at).name}
        </button>
      )}
      <header>
        <h2>
          <FactionMark faction={ship.owner} size={14} /> {ship.name}
        </h2>
        <p class="system-kind">{def.name}</p>
        <p class="ship-status">{shipStatus(world, game, ship)}</p>
      </header>
      <p class="dim">{def.does}</p>
      {!inFlight && (
        <div class="ship-actions">
          <button
            type="button"
            class="button button-primary"
            onClick={() => {
              targeting.value = { ship: ship.id, blind: false, to: null };
            }}
          >
            Move
          </button>
          {canJumpBlind(ship) && (
            <button
              type="button"
              class="button"
              onClick={() => {
                targeting.value = { ship: ship.id, blind: true, to: null };
              }}
            >
              Jump blind
            </button>
          )}
          {moving && (
            <button
              type="button"
              class="button button-quiet"
              onClick={() => give(play, { type: 'stop', ship: ship.id })}
            >
              Stop
            </button>
          )}
          <button
            type="button"
            class="button button-quiet"
            aria-pressed={ship.hold}
            onClick={() => give(play, { type: 'hold', ship: ship.id, hold: !ship.hold })}
          >
            {ship.hold ? 'Stop holding' : 'Hold here'}
          </button>
        </div>
      )}
      {ship.type === 'survey' && (
        <label class="check">
          <input
            type="checkbox"
            checked={ship.autoSurvey}
            onChange={(e) =>
              give(play, { type: 'auto-survey', ship: ship.id, on: (e.target as HTMLInputElement).checked })
            }
          />
          Survey each new system it enters (it stops there for the turn)
        </label>
      )}
      {canJumpBlind(ship) && (
        <p class="dim">
          A blind jump reaches any star within {formatLy(reach)}, with no lane, taking a turn for every 3 ly.
        </p>
      )}
      {!inFlight && <Founding world={world} game={game} ship={ship} play={play} />}
      {!inFlight && <Investigate game={game} ship={ship} play={play} />}
    </article>
  );
}

/** Every ship of the player's, idle ones first. */
export function ShipsList({
  world,
  game,
  faction,
  onPick,
}: {
  world: World;
  game: GameState;
  faction: FactionId;
  onPick: (id: number) => void;
}) {
  const idle = (s: ShipState) =>
    s.at !== null && s.destinations.length === 0 && !s.blindJump && !s.hold && !s.founding && !s.investigating;
  const ships = game.ships
    .filter((s) => s.owner === faction)
    .sort((a, b) => Number(idle(b)) - Number(idle(a)) || a.id - b.id);
  return (
    <ul class="ships-list">
      {ships.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            class="ship-row"
            data-guide={s.type === 'survey' ? 'survey-ship' : s.type === 'colony' ? 'colony-ship' : undefined}
            onClick={() => onPick(s.id)}
          >
            <span class="ship-chevron" style={{ '--faction': FACTIONS[s.owner].colour }} aria-hidden="true" />
            <b>{s.name}</b>
            <span class="ship-type">{SHIPS[s.type].name}</span>
            <span class="ship-line">{shipStatus(world, game, s)}</span>
            {idle(s) && <span class="needs-tag">Idle</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** "Reward: 25 research points." With `more`, as Lapse studies makes it (M2B_SCIENCE.md §18.2). */
export function rewardText(r: AnomalyReward, more: (n: number) => number = (n) => n): string {
  switch (r.kind) {
    case 'research':
      return `${more(r.points)} research points.`;
    case 'tech':
      return `${more(r.points)} research points towards ${TECHS[r.tech].name}.`;
    case 'resources': {
      const parts: string[] = [];
      if (r.metals) parts.push(`${more(r.metals)} metals`);
      if (r.volatiles) parts.push(`${more(r.volatiles)} volatiles`);
      if (r.fuel) parts.push(`${more(r.fuel)} fusion fuel`);
      return `${parts.join(' and ')} for the stockpile.`;
    }
    case 'story':
      return '';
  }
}

/** A survey ship's panel: the anomaly where it is, and the order to investigate it. */
function Investigate({ game, ship, play }: { game: GameState; ship: ShipState; play: Play }) {
  if (ship.type !== 'survey' || ship.at === null) return null;
  const id = anomalyAt(game.seed, ship.at);
  const power = game.powers.find((p) => p.faction === ship.owner);
  if (!id || !power?.surveyed.includes(ship.at)) return null;
  const a = ANOMALIES[id];
  if (power?.investigated.includes(ship.at))
    return (
      <p class="dim">
        {a.name} here has been investigated <Badge kind="fiction" />
      </p>
    );
  const refusal = investigateRefusal(game, ship);
  const turns = investigationTurns(game, ship.owner, id);
  return (
    <section class="anomaly" aria-label="Anomaly">
      <h3>
        {a.name} <Badge kind="fiction" />
      </h3>
      <p>{a.seen}</p>
      {ship.investigating ? null : refusal ? (
        <p class="dim">{refusal}</p>
      ) : (
        <button type="button" class="button" onClick={() => give(play, { type: 'investigate', ship: ship.id })}>
          Investigate: {turns} turn{turns === 1 ? '' : 's'}
        </button>
      )}
    </section>
  );
}

export function eventText(world: World, game: GameState, e: ReportEvent): string {
  const shipOf = (id: number | undefined) => game.ships.find((s) => s.id === id)?.name ?? 'A ship';
  const holding = (id: number) => {
    const h = game.holdings.find((x) => x.id === id);
    return h ? holdingName(world, game, h) : 'A colony';
  };
  const name = (id: SystemId) => world.system(id).name;
  const body = (system: SystemId, id: string) =>
    bodiesOf(world, game.seed, system).find((b) => b.id === id)?.name ?? id;
  switch (e.kind) {
    case 'surveyed': {
      const n = e.habitable.length;
      const by = e.station !== undefined ? `The survey station at ${holding(e.station)}` : shipOf(e.ship);
      const found = e.anomaly ? ` An anomaly: ${ANOMALIES[e.anomaly].seen}` : '';
      return `${by} surveyed ${name(e.system)}: ${e.worlds} world${e.worlds === 1 ? '' : 's'}${
        n > 0 ? `, ${n} your people could live on` : ', none your people could live on without domes'
      }.${found}`;
    }
    case 'investigated': {
      const a = ANOMALIES[e.anomaly];
      const owner = game.ships.find((x) => x.id === e.ship)?.owner ?? playerPower(game)?.faction;
      const more = (n: number) => (owner ? rewardTimes(game, owner, n) : n);
      return `${shipOf(e.ship)} investigated ${a.name.replace(/^An? /, (m) => m.toLowerCase())} at ${name(e.system)}. ${a.found} ${rewardText(a.reward, more)}`;
    }
    case 'arrived':
      return `${shipOf(e.ship)} reached ${name(e.system)}.`;
    case 'jumped':
      return `${shipOf(e.ship)} jumped blind for ${name(e.to)}: ${e.turns} turn${e.turns === 1 ? '' : 's'} out of contact.`;
    case 'landed':
      return `${shipOf(e.ship)} came out of its blind jump at ${name(e.system)}.`;
    case 'blocked':
      return `${shipOf(e.ship)} could not go on to ${name(e.to)}: no open lane leads there.`;
    case 'founded': {
      const h = game.holdings.find((x) => x.id === e.holding);
      return `${e.shipName} founded ${h?.kind === 'outpost' ? 'an outpost' : 'a colony'} on ${body(e.system, e.body)} at ${name(e.system)}.`;
    }
    case 'not-founded':
      return `${shipOf(e.ship)} could not found on ${body(e.system, e.body)}: ${e.reason}`;
    case 'built': {
      if (e.item.kind === 'project' && PROJECTS[e.item.project].great)
        return `${holding(e.holding)} has finished ${projectWords(e.item.project)}: a great work, the only one in the neighbourhood.`;
      const what =
        e.item.kind === 'project' ? projectWords(e.item.project) : withArticle(itemName(e.item).toLowerCase());
      return e.ship !== undefined
        ? `${holding(e.holding)} built ${what}, the ${shipOf(e.ship)}.`
        : `${holding(e.holding)} built ${what}.`;
    }
    case 'full':
      return `${holding(e.holding)} is full: its people have no more room to grow.`;
    case 'lane-begun':
      return `${holding(e.holding)} has paid for ${e.relight ? 'relighting the lane' : 'a new lane'} to ${name(e.to)}: its beacons are tuned for ${e.turns} turn${e.turns === 1 ? '' : 's'}.`;
    case 'lane-opened': {
      const [a, b] = laneEnds(e.lane);
      return `The lane between ${name(a)} and ${name(b)} is open.`;
    }
    case 'lane-refused':
      return `${holding(e.holding)} could not begin the lane to ${name(e.to)}: ${e.reason}`;
    case 'researched':
      return `Researched ${TECHS[e.tech].name}: ${TECHS[e.tech].text}`;
    case 'terraformed':
      return `${holding(e.holding)}’s world is ${e.level} for its people now: its terraforming station has done its work.`;
    case 'habitat-colony':
      return `${holding(e.holding)} is a colony now: its orbital habitat holds its first million settlers.`;
    case 'inspired':
      return `An inspiration: ${TECHS[e.tech].inspiration.text} taught us about ${TECHS[e.tech].name}, ${e.points} research towards it.`;
    case 'observed':
      return `Observed at ${name(e.system)}: ${e.found.map((k) => observationWords(world, e.system, k)).join('; ')}. ${e.points} research.`;
    case 'zoned':
      return `${holding(e.holding)} ${e.rezoned ? 'rezoned' : 'zoned'} district ${e.slot} for ${ZONE_DEFS[e.zone].name.toLowerCase()}.`;
    case 'hungry':
      return `${holding(e.holding)} is hungry: its farms and the store cannot feed it. It stops growing, and its people grow unhappy.`;
    case 'overdrive-stopped':
      return `${holding(e.holding)}’s overdrive stopped: the treasury could not pay for it.`;
    case 'debt':
      return 'The treasury is in debt: every colony is unhappier until it is paid off.';
    case 'governed': {
      const did =
        e.did === 'zone'
          ? `zoned district ${e.slot} for ${e.zone ? ZONE_DEFS[e.zone].name.toLowerCase() : 'a use'}`
          : e.did === 'work'
            ? `put its ${e.zone ? ZONE_DEFS[e.zone].name.toLowerCase() : 'districts'} to work first`
            : `queued ${e.project ? projectWords(e.project) : 'a project'}`;
      const h = game.holdings.find((x) => x.id === e.holding);
      const why =
        e.reason === 'food'
          ? `its network is ${e.short ?? 1} food short`
          : e.reason === 'full'
            ? 'it is full'
            : e.reason === 'calm'
              ? 'its people are unhappy'
              : e.reason === 'lab'
                ? 'every governor keeps a lab, one district in five'
                : `its priority is ${h?.governor ? PRIORITY_DEFS[h.governor].name.toLowerCase() : 'balance'}`;
      return `${holding(e.holding)}’s governor ${did}: ${why}.`;
    }
    case 'edict-ended':
      return `The ${EDICTS[e.edict].name.toLowerCase()}${e.holding !== null ? ` at ${holding(e.holding)}` : ''} is over.`;
    case 'rival-founded':
      return `The Watch: the ${FACTIONS[e.faction].shortName} founded ${e.colony ? 'a colony' : 'an outpost'} on ${body(e.system, e.body)} at ${name(e.system)}.`;
    case 'rival-lane': {
      const [a, b] = laneEnds(e.lane);
      return `The Watch: the ${FACTIONS[e.faction].shortName} opened a lane between ${name(a)} and ${name(b)}. It is closed to your ships.`;
    }
    case 'rival-ship':
      return `The Watch: ${withArticle(`${FACTIONS[e.faction].shortName} ${SHIPS[e.type].name.toLowerCase()}`)} is at ${name(e.system)}.`;
    case 'rival-tech':
      return `The Watch: word from the lanes is that the ${FACTIONS[e.faction].shortName} has mastered ${TECHS[e.tech].name}.`;
    case 'gift-sent':
      return `The Envoy took our gift of ${e.credits} credits to the ${FACTIONS[e.faction].shortName}.`;
    case 'gift-received':
      return `The ${FACTIONS[e.faction].shortName} sent us a gift of ${e.credits} credits.`;
    case 'offer-received':
      return `The ${FACTIONS[e.faction].shortName} offers us ${TREATIES[e.treaty].name.toLowerCase()}: answer it in Diplomacy before this turn ends.`;
    case 'offer-answered':
      return `The ${FACTIONS[e.faction].shortName} ${e.accepted ? 'accepted' : 'refused'} our offer of ${TREATIES[e.treaty].name.toLowerCase()}.`;
    case 'offer-misread':
      return e.ours
        ? `The ${FACTIONS[e.faction].shortName} misread our offer of ${TREATIES[e.treaty].name.toLowerCase()}, and took offence: the Envoy has not yet learnt their tongue.`
        : `The ${FACTIONS[e.faction].shortName} offered us something we could not make out, and it did not sound friendly.`;
    case 'treaty-begun':
      return `We have ${TREATIES[e.treaty].name.toLowerCase()} with the ${FACTIONS[e.faction].shortName} now: ${TREATIES[e.treaty].does}`;
    case 'treaty-notice':
      return e.by === e.faction
        ? `The ${FACTIONS[e.faction].shortName} has given notice: our ${TREATIES[e.treaty].name.toLowerCase()} ends in ${e.ends - game.turn + 1} turns.`
        : `We have given the ${FACTIONS[e.faction].shortName} notice: our ${TREATIES[e.treaty].name.toLowerCase()} ends in ${e.ends - game.turn + 1} turns.`;
    case 'treaty-ended':
      return e.broken
        ? e.by === e.faction
          ? `The ${FACTIONS[e.faction].shortName} broke our ${TREATIES[e.treaty].name.toLowerCase()}.`
          : `We broke our ${TREATIES[e.treaty].name.toLowerCase()} with the ${FACTIONS[e.faction].shortName}; every power that knows us will remember it.`
        : `Our ${TREATIES[e.treaty].name.toLowerCase()} with the ${FACTIONS[e.faction].shortName} has ended.`;
    case 'treaty-broken-heard':
      return `The ${FACTIONS[e.faction].shortName} broke its ${TREATIES[e.treaty].name.toLowerCase()} with the ${FACTIONS[e.victim].shortName}.`;
    case 'contact':
      if (!e.first)
        return `The Envoy has learnt the ${FACTIONS[e.faction].shortName}’s tongue: we can talk with them now.`;
      return e.stage === 'talk'
        ? `First contact: the ${FACTIONS[e.faction].name}, seen at ${e.system ? name(e.system) : 'a distance'}. They share our tongue, so we can talk.`
        : `First contact: the ${FACTIONS[e.faction].name}, seen at ${e.system ? name(e.system) : 'a distance'}. Their tongue is not ours: the Envoy has begun to learn it.`;
    case 'great-work':
      return `The ${FACTIONS[e.faction].shortName} has finished the ${PROJECTS[e.project].name} at ${name(e.system)}: a great work, the only one in the neighbourhood.`;
    case 'great-work-begun':
      return `The Watch: the ${FACTIONS[e.faction].shortName} has begun the ${PROJECTS[e.project].name} at ${name(e.system)}.`;
    case 'great-work-lost':
      return `The ${FACTIONS[e.faction].shortName} finished the ${PROJECTS[e.project].name} first: ${holding(e.holding)} has lost it${e.kept > 0 ? `, and keeps ${e.kept} of its industry` : ''}.`;
    case 'event':
      return `${eventTitle(world, game, { id: e.event, turn: game.turn, ...e })}: it needs your answer.`;
    case 'event-answered': {
      const def = EVENTS[e.event];
      const c = def.choices[e.choice];
      const words = eventWords(world, game, { id: e.event, turn: game.turn, ...e });
      return `${eventTitle(world, game, { id: e.event, turn: game.turn, ...e })}: ${c.name.toLowerCase()}${e.auto ? ', as it went unanswered' : ''}. ${fillLine(c.does, words)}`;
    }
    case 'event-gone':
      return `${eventTitle(world, game, { id: e.event, turn: game.turn, ...e })}: it has passed.`;
    case 'defected':
      return `The crew of the ${e.ship} went over to the ${FACTIONS[e.to].shortName} at ${name(e.system)}, ship and all.`;
  }
}

/** Where a report item leads: the colony it is about, its system, or the research screen. */
function eventPlace(
  game: GameState,
  e: ReportEvent,
): { holding: number } | { system: SystemId } | { research: true } | { event: true } {
  switch (e.kind) {
    case 'researched':
    case 'inspired':
    case 'rival-tech':
      return { research: true };
    case 'zoned':
    case 'hungry':
    case 'overdrive-stopped':
    case 'governed':
    case 'terraformed':
    case 'habitat-colony':
    case 'great-work-lost':
      return { holding: e.holding };
    case 'edict-ended':
      if (e.holding !== null) return { holding: e.holding };
      return { system: playerPower(game)?.capital ?? 'sol' };
    case 'debt': {
      const capital = game.holdings.find((h) => h.capital && h.owner === playerPower(game)?.faction);
      return capital ? { holding: capital.id } : { research: true };
    }
    case 'jumped':
      return { system: e.to };
    case 'built':
    case 'full':
    case 'founded':
      return { holding: e.holding };
    case 'lane-begun':
    case 'lane-refused':
      return { system: e.to };
    case 'lane-opened':
    case 'rival-lane':
      return { system: laneEnds(e.lane)[1] };
    case 'event':
      return { event: true };
    case 'contact':
      return { system: e.system ?? playerPower(game)?.capital ?? 'sol' };
    case 'gift-sent':
    case 'gift-received':
    case 'offer-received':
    case 'offer-answered':
    case 'offer-misread':
    case 'treaty-begun':
    case 'treaty-notice':
    case 'treaty-ended':
    case 'treaty-broken-heard':
      return { system: playerPower(game)?.capital ?? 'sol' };
    case 'event-answered':
    case 'event-gone':
      if (e.holding !== null && game.holdings.some((h) => h.id === e.holding)) return { holding: e.holding };
      return { system: e.system ?? playerPower(game)?.capital ?? 'sol' };
    default:
      return { system: e.system };
  }
}

/** Each dispatch's icon and tone (CONSOLE.md §4): news, growth, what needs you, what went wrong. */
const DISPATCH: Record<ReportEvent['kind'], { icon: IconName; tone: 'news' | 'growth' | 'needs' | 'wrong' }> = {
  surveyed: { icon: 'survey', tone: 'news' },
  investigated: { icon: 'anomaly', tone: 'news' },
  arrived: { icon: 'ship', tone: 'news' },
  jumped: { icon: 'ship', tone: 'news' },
  landed: { icon: 'ship', tone: 'news' },
  blocked: { icon: 'refused', tone: 'needs' },
  founded: { icon: 'colony', tone: 'growth' },
  'not-founded': { icon: 'refused', tone: 'wrong' },
  built: { icon: 'growth', tone: 'growth' },
  'lane-begun': { icon: 'lane', tone: 'growth' },
  'lane-opened': { icon: 'lane', tone: 'growth' },
  researched: { icon: 'research', tone: 'growth' },
  inspired: { icon: 'research', tone: 'growth' },
  terraformed: { icon: 'colony', tone: 'growth' },
  'habitat-colony': { icon: 'colony', tone: 'growth' },
  observed: { icon: 'survey', tone: 'growth' },
  'lane-refused': { icon: 'refused', tone: 'wrong' },
  full: { icon: 'report', tone: 'needs' },
  zoned: { icon: 'growth', tone: 'growth' },
  hungry: { icon: 'refused', tone: 'needs' },
  'overdrive-stopped': { icon: 'refused', tone: 'wrong' },
  debt: { icon: 'refused', tone: 'needs' },
  governed: { icon: 'colony', tone: 'news' },
  'edict-ended': { icon: 'report', tone: 'news' },
  'rival-founded': { icon: 'colony', tone: 'news' },
  'rival-lane': { icon: 'lane', tone: 'news' },
  'rival-ship': { icon: 'ship', tone: 'news' },
  'rival-tech': { icon: 'research', tone: 'news' },
  contact: { icon: 'empire', tone: 'news' },
  'gift-sent': { icon: 'empire', tone: 'news' },
  'gift-received': { icon: 'growth', tone: 'growth' },
  'offer-received': { icon: 'diplomacy', tone: 'needs' },
  'offer-answered': { icon: 'diplomacy', tone: 'news' },
  'offer-misread': { icon: 'refused', tone: 'wrong' },
  'treaty-begun': { icon: 'diplomacy', tone: 'growth' },
  'treaty-notice': { icon: 'diplomacy', tone: 'news' },
  'treaty-ended': { icon: 'diplomacy', tone: 'news' },
  'treaty-broken-heard': { icon: 'diplomacy', tone: 'news' },
  'great-work': { icon: 'colony', tone: 'news' },
  'great-work-begun': { icon: 'colony', tone: 'news' },
  'great-work-lost': { icon: 'refused', tone: 'wrong' },
  event: { icon: 'anomaly', tone: 'needs' },
  'event-answered': { icon: 'report', tone: 'news' },
  'event-gone': { icon: 'report', tone: 'news' },
  defected: { icon: 'refused', tone: 'wrong' },
};

/** The turn's picture (DISPATCHES.md §1): its most notable event's, or none for a quiet turn. */
export function dispatchPicture(events: readonly ReportEvent[]): DispatchPicture | null {
  const has = (k: ReportEvent['kind']) => events.some((e) => e.kind === k);
  if (has('investigated') || events.some((e) => e.kind === 'surveyed' && e.anomaly)) return 'dispatch-anomaly';
  if (has('founded')) return 'dispatch-colony';
  if (has('researched')) return 'dispatch-research';
  if (has('lane-opened')) return 'dispatch-lane';
  if (events.some((e) => e.kind === 'built' && e.ship !== undefined)) return 'dispatch-ship';
  if (has('surveyed')) return 'dispatch-survey';
  return null;
}

export type DispatchPicture =
  | 'dispatch-anomaly'
  | 'dispatch-colony'
  | 'dispatch-research'
  | 'dispatch-lane'
  | 'dispatch-ship'
  | 'dispatch-survey';

/** What each picture shows, for those who cannot see it. */
const PICTURE_TEXT: Record<DispatchPicture, string> = {
  'dispatch-anomaly': 'An ancient ring of dark stone floating in deep space, a small survey ship approaching it.',
  'dispatch-colony': 'The first habitat domes set down on the rocky plain of an alien world at dusk.',
  'dispatch-research': 'Scientists round a glowing model of a lane beacon in a research station.',
  'dispatch-lane': 'A lane beacon igniting, sending a thread of light towards a distant star.',
  'dispatch-ship': 'A new starship easing out of an orbital shipyard above a hazy planet.',
  'dispatch-survey': 'A survey ship drifting past a newly charted system, its scanners reaching out.',
};

function DispatchArt({ picture }: { picture: DispatchPicture }) {
  const base = `${import.meta.env.BASE_URL}art/illustration/${picture}`;
  return (
    <figure class="dispatch-art" data-picture={picture}>
      <img
        src={`${base}-640.webp`}
        srcset={`${base}-640.webp 640w, ${base}-1280.webp 1280w`}
        sizes="(min-width: 900px) 460px, 100vw"
        width={640}
        height={427}
        alt={PICTURE_TEXT[picture]}
        decoding="async"
      />
    </figure>
  );
}

export function ReportView({
  world,
  game,
  faction,
  needs,
  onGo,
  onHolding,
  onResearch,
  onViewColony,
  onEvent,
}: {
  world: World;
  game: GameState;
  faction: FactionId;
  needs: number;
  onGo: (id: SystemId) => void;
  onHolding: (id: number) => void;
  onResearch: () => void;
  /** Opens the event waiting for an answer. */
  onEvent?: () => void;
  /** Opens a colony's scene, to see what it finished. */
  onViewColony?: (id: number) => void;
}) {
  const r = game.reports.find((x) => x.faction === faction);
  const picture = r ? dispatchPicture(r.events) : null;
  const advice = r
    ? adviceFor(world, game, faction, r.events, needsOf(world, game, faction), settings.value.advisors)
    : [];
  return (
    <section class="report" aria-label="Report">
      {picture && <DispatchArt key={`${r?.turn}-${picture}`} picture={picture} />}
      <h2 class="report-title">{r ? `${formatDate(r.turn)}: what happened` : 'Report'}</h2>
      {advice.length > 0 && (
        <ul class="advice" aria-label="Your advisors">
          {advice.map((a) => (
            <li key={a.department} class={`advice-line${a.priority <= 2 ? ' is-pressing' : ''}`}>
              <AdvisorFace advisor={a.advisor} />
              <div>
                <p class="advice-who">
                  <b>{a.advisor.name}</b> <span class="dim">· {DEPARTMENT_NAMES[a.department]}</span>
                </p>
                {a.event || a.holding !== undefined || a.system !== undefined ? (
                  <button
                    type="button"
                    class="link advice-text"
                    onClick={() =>
                      a.event
                        ? onEvent?.()
                        : a.holding !== undefined
                          ? onHolding(a.holding)
                          : a.system && onGo(a.system)
                    }
                  >
                    {a.text}
                  </button>
                ) : (
                  <p class="advice-text">{a.text}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {!r && <p class="dim">The first report comes when you end the first turn.</p>}
      {r && r.events.length === 0 && <p class="dim">A quiet quarter: nothing to report.</p>}
      {r && r.events.length > 0 && (
        <ul class="report-items">
          {r.events.map((e, i) => (
            <li
              key={`${e.kind}-${i}`}
              class={`report-${e.kind} tone-${DISPATCH[e.kind].tone}`}
              style={{ '--i': Math.min(i, 12) }}
            >
              <Icon name={DISPATCH[e.kind].icon} size={20} />
              <button
                type="button"
                class="link"
                onClick={() => {
                  const place = eventPlace(game, e);
                  if ('holding' in place) onHolding(place.holding);
                  else if ('research' in place) onResearch();
                  else if ('event' in place) onEvent?.();
                  else onGo(place.system);
                }}
              >
                {eventText(world, game, e)}
              </button>
              {e.kind === 'observed' && <Badge kind="observed" />}
              {onViewColony && e.kind === 'built' && e.item.kind === 'project' && (
                <button type="button" class="link report-see" onClick={() => onViewColony(e.holding)}>
                  See it
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <p class="report-needs">
        {needs === 0
          ? 'Nothing needs you.'
          : `${needs} thing${needs === 1 ? '' : 's'} need${needs === 1 ? 's' : ''} you.`}{' '}
        Now {formatDate(game.turn)}.
      </p>
    </section>
  );
}

/** What needs you, one card at a time (phone), before the turn ends. */
export function NeedsStack({
  world,
  game,
  needs,
  onNeed,
  onEnd,
  onClose,
}: {
  world: World;
  game: GameState;
  needs: readonly Need[];
  onNeed: (need: Need) => void;
  onEnd: () => void;
  onClose: () => void;
}) {
  const [at, setAt] = useState(0);
  const need = needs[at];
  return (
    <div class="needs-stack" role="dialog" aria-label="What needs you">
      <div class="needs-card">
        {need ? (
          <>
            <p class="needs-count">
              {at + 1} of {needs.length} need you
            </p>
            <p>{needText(world, game, need)}</p>
            <div class="needs-actions">
              <button type="button" class="button button-primary" onClick={() => onNeed(need)}>
                {need.kind === 'idle-ship'
                  ? 'Give orders'
                  : need.kind === 'no-research'
                    ? 'Choose research'
                    : need.kind === 'event'
                      ? 'Answer'
                      : need.kind === 'debt'
                        ? 'Open the empire'
                        : 'Open the colony'}
              </button>
              <button type="button" class="button button-quiet" onClick={() => setAt(at + 1)}>
                Skip
              </button>
            </div>
          </>
        ) : (
          <p>That is everything.</p>
        )}
        <div class="needs-actions">
          <button type="button" class="button" onClick={onEnd}>
            End turn{need ? ' anyway' : ''}
          </button>
          <button type="button" class="button button-quiet" onClick={onClose}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

/** The preview of where a ship would go, before the order is confirmed (both layouts). */
export function planFor(
  world: World,
  game: GameState,
  ship: ShipState,
  to: SystemId,
  blind: boolean,
): { ok: true; text: string; path: SystemId[]; blind: boolean } | { ok: false; text: string } {
  if (ship.at === null) return { ok: false, text: `${ship.name} is on a blind jump.` };
  if (to === ship.at) return { ok: false, text: `${ship.name} is already there.` };
  const name = world.system(to).name;
  if (!blind) {
    const p = previewMove(world, game, ship, [to]);
    if (p)
      return {
        ok: true,
        text: `${ship.name} → ${name}: ${p.jumps} jump${p.jumps === 1 ? '' : 's'}, ${p.turns} turn${p.turns === 1 ? '' : 's'}`,
        path: [ship.at, ...p.hops.map((h) => h.to)],
        blind: false,
      };
    if (!canJumpBlind(ship)) return { ok: false, text: `No open lane leads to ${name}.` };
  }
  if (!canJumpBlind(ship)) return { ok: false, text: 'Only survey ships can jump without a lane.' };
  const d = world.distanceDeci(ship.at, to);
  const reach = blindReachDeci(game, ship.owner);
  if (d > reach)
    return {
      ok: false,
      text: `${name} is ${formatLy(d)} away: too far to jump blind (reach ${formatLy(reach)})${blind ? '' : ', and no open lane leads there'}.`,
    };
  const turns = blindJumpTurns(d, game, ship.owner);
  return {
    ok: true,
    text: `${ship.name} → ${name}: a blind jump of ${formatLy(d)}, ${turns} turn${turns === 1 ? '' : 's'}`,
    path: [ship.at, to],
    blind: true,
  };
}

export function TargetBar({ world, game, play }: { world: World; game: GameState; play: Play }) {
  const t = targeting.value;
  if (!t) return null;
  const ship = game.ships.find((s) => s.id === t.ship);
  if (!ship) return null;
  const plan = t.to ? planFor(world, game, ship, t.to, t.blind) : null;
  const confirm = () => {
    if (!t.to || !plan?.ok) return;
    const ok = give(
      play,
      plan.blind ? { type: 'blind-jump', ship: ship.id, to: t.to } : { type: 'move', ship: ship.id, to: t.to },
    );
    if (ok) targeting.value = null;
  };
  return (
    <div class="target-bar" role="dialog" aria-label="Choose a destination" data-covers-map>
      <p>
        {plan
          ? plan.text
          : t.blind
            ? `Choose a star within ${formatLy(blindReachDeci(game, ship.owner))} for ${ship.name} to jump to.`
            : `Choose where ${ship.name} goes.`}
      </p>
      <div class="target-actions">
        {plan?.ok && (
          <button type="button" class="button button-primary" onClick={confirm}>
            Confirm
          </button>
        )}
        <button
          type="button"
          class="button button-quiet"
          onClick={() => {
            targeting.value = null;
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
