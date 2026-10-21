// What the advisors say in the report (M2_WORLDS.md §24.2): from the turn's events and from what
// needs you, each department's most important line, at most three lines, the most pressing first.
// Pure, so it is tested without a browser. Advisors speak; they never change a number.

import {
  ADVISORS,
  type Advisor,
  type AdvisorSetting,
  DEPARTMENTS,
  type Department,
  fillLine,
  LINES,
  type LineKind,
} from '../content/advisors.ts';
import { ZONE_DEFS } from '../content/districts.ts';
import { EVENTS } from '../content/events.ts';
import { FACTIONS, type FactionId } from '../content/factions.ts';
import { PROJECTS, withArticle } from '../content/projects.ts';
import { SHIPS } from '../content/ships.ts';
import { TECHS } from '../content/techs.ts';
import type { SystemId } from '../data/types.ts';
import { bodiesOf } from './bodies.ts';
import { listWords, observationShort } from './discoveries.ts';
import { bodyOf, fusionRuns } from './economy.ts';
import { eventWords } from './events.ts';
import type { Need } from './needs.ts';
import type { ReportEvent } from './report.ts';
import { type GameState, powerOf } from './state.ts';
import { laneEnds, type World } from './world.ts';

export interface AdviceLine {
  department: Department;
  advisor: Advisor;
  /** 1 and 2 need you; 3 is news; 4 a nudge. */
  priority: number;
  kind: LineKind;
  text: string;
  /** Where the line points, when it is about one place. */
  holding?: number;
  system?: SystemId;
  /** The line is about the event waiting: it opens it. */
  event?: true;
}

/** At most this many lines a turn. */
export const MOST_LINES = 3;

/** "when this turn ends", "in two turns". */
function when(turns: number): string {
  return turns <= 1 ? 'when this turn ends' : `in ${turns} turns`;
}

export function adviceFor(
  world: World,
  state: GameState,
  faction: FactionId,
  events: readonly ReportEvent[],
  needs: readonly Need[],
  setting: AdvisorSetting = 'speak',
): AdviceLine[] {
  if (setting === 'off') return [];
  const team = ADVISORS[faction];
  const holdingName = (id: number) => {
    const h = state.holdings.find((x) => x.id === id);
    return h ? (bodyOf(world, state, h)?.name ?? world.system(h.system).name) : 'a colony';
  };
  const out: AdviceLine[] = [];
  const say = (
    department: Department,
    priority: number,
    kind: LineKind,
    values: Record<string, string>,
    at: { holding?: number; system?: SystemId; event?: true } = {},
  ) =>
    out.push({
      department,
      advisor: team.people[department],
      priority,
      kind,
      text: fillLine(LINES[kind][team.voice], values),
      ...(at.holding !== undefined ? { holding: at.holding } : {}),
      ...(at.system !== undefined ? { system: at.system } : {}),
      ...(at.event ? { event: true as const } : {}),
    });

  // What needs you.
  for (const n of needs) {
    if (n.kind === 'food') {
      const place = n.home ? 'the colonies on our lanes' : holdingName(n.holding);
      if (n.turns === 0) say('colonies', 1, 'hungry', { place, is: n.home ? 'are' : 'is' }, { holding: n.holding });
      else
        say(
          'colonies',
          1,
          'hunger-coming',
          { where: n.home ? 'on our lanes' : `at ${place}`, when: when(n.turns) },
          { holding: n.holding },
        );
    } else if (n.kind === 'unrest')
      say('colonies', n.revolt ? 1 : 2, n.revolt ? 'revolt' : 'unrest', { place: holdingName(n.holding) }, n);
    else if (n.kind === 'debt') {
      if (n.turns === 0) say('treasury', 1, 'debt', {});
      else say('treasury', 1, 'debt-coming', { when: when(n.turns) });
    } else if (n.kind === 'no-research') say('science', 2, 'no-research', {});
    else if (n.kind === 'event') {
      const ev = powerOf(state, faction).event;
      if (!ev) continue;
      const def = EVENTS[ev.id];
      const words = eventWords(world, state, ev);
      const where =
        def.subject === 'lane'
          ? `on the lane ${words.lane ?? ''}`
          : def.subject === 'none'
            ? ''
            : `at ${(def.subject === 'colony' ? words.place : words.system) ?? ''}`;
      const what = ev.id === 'founders-day' ? def.name : `${def.name.charAt(0).toLowerCase()}${def.name.slice(1)}`;
      say(def.department, 2, 'event', { what, where }, { event: true });
    } else if (n.kind === 'idle-yard') say('works', 4, 'idle-yard', { place: holdingName(n.holding) }, n);
  }
  const idleShips = needs.filter((n) => n.kind === 'idle-ship').length;
  if (idleShips > 0) say('survey', 4, 'idle-ship', { count: idleShips === 1 ? 'a ship is' : `${idleShips} ships are` });
  for (const h of state.holdings)
    if (h.owner === faction && h.projects.includes('fusion-plant') && !fusionRuns(state, h))
      say('works', 2, 'no-fuel', { place: holdingName(h.id) }, { holding: h.id });

  // The turn's news.
  for (const e of events) {
    if (e.kind === 'overdrive-stopped')
      say('treasury', 2, 'overdrive-stopped', { place: holdingName(e.holding) }, { holding: e.holding });
    else if (e.kind === 'researched')
      say('science', 3, 'researched', { tech: TECHS[e.tech].name, effect: TECHS[e.tech].text });
    else if (e.kind === 'inspired')
      say('science', 3, 'inspired', {
        deed: TECHS[e.tech].inspiration.text,
        tech: TECHS[e.tech].name,
        points: String(e.points),
      });
    else if (e.kind === 'observed')
      say(
        'science',
        3,
        'observed',
        {
          place: world.system(e.system).name,
          what: listWords(e.found.map((k) => observationShort(world, e.system, k))),
          points: String(e.points),
        },
        { system: e.system },
      );
    else if (e.kind === 'built' && e.item.kind === 'project')
      say(
        'works',
        3,
        'built',
        { place: holdingName(e.holding), what: withArticle(PROJECTS[e.item.project].name.toLowerCase()) },
        { holding: e.holding },
      );
    else if (e.kind === 'zoned')
      say('works', 3, 'zoned', { place: holdingName(e.holding), zone: ZONE_DEFS[e.zone].name.toLowerCase() }, e);
    else if (e.kind === 'investigated') say('survey', 3, 'investigated', { place: world.system(e.system).name }, e);
    else if (e.kind === 'lane-opened') {
      const [a, b] = laneEnds(e.lane);
      say('survey', 3, 'lane-opened', { place: `between ${world.system(a).name} and ${world.system(b).name}` });
    } else if (e.kind === 'surveyed') say('survey', 3, 'surveyed', { place: world.system(e.system).name }, e);
    else if (e.kind === 'rival-founded') {
      const what = e.colony ? 'a colony' : 'an outpost';
      const body =
        bodiesOf(world, state.seed, e.system).find((b) => b.id === e.body)?.name ?? world.system(e.system).name;
      say(
        'watch',
        3,
        'rival-founded',
        { power: FACTIONS[e.faction].shortName, what, place: body },
        { system: e.system },
      );
    } else if (e.kind === 'rival-lane') {
      const [a, b] = laneEnds(e.lane);
      const place = `between ${world.system(a).name} and ${world.system(b).name}`;
      say('watch', 3, 'rival-lane', { power: FACTIONS[e.faction].shortName, place }, { system: b });
    } else if (e.kind === 'rival-ship') {
      const ship = withArticle(`${FACTIONS[e.faction].shortName} ${SHIPS[e.type].name.toLowerCase()}`);
      say('watch', 3, 'rival-ship', { ship, place: world.system(e.system).name }, e);
    } else if (e.kind === 'founded') {
      const kind = state.holdings.find((h) => h.id === e.holding)?.kind === 'outpost' ? 'outpost' : 'colony';
      say('colonies', 3, 'founded', { place: holdingName(e.holding), what: `a new ${kind}` }, { holding: e.holding });
    }
  }

  // Each department's most pressing line, then the most pressing departments.
  const best = new Map<Department, AdviceLine>();
  for (const line of out) {
    const now = best.get(line.department);
    if (!now || line.priority < now.priority) best.set(line.department, line);
  }
  return [...best.values()]
    .filter((l) => setting === 'speak' || l.priority <= 2)
    .sort((a, b) => a.priority - b.priority || DEPARTMENTS.indexOf(a.department) - DEPARTMENTS.indexOf(b.department))
    .slice(0, MOST_LINES);
}
