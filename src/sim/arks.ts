// The dying star and the Unhomed (M5_UNKNOWN.md §25, D-76): on a turn chosen by the seed, the arks
// of a people without a world arrive at CE Boötis and ask every power for one. A power may give them
// a world, take them in as its own people, or refuse; the first answer that settles them takes
// effect as the turn ends. Some turns later their star, Arcturus, dies (real star, fictional death),
// and if they are still waiting they take a world. Given or taken, they become the Last Hearth, a
// power that arrives in mid-game. Pure.

import type { FactionId } from '../content/factions.ts';
import { RULES } from '../content/rules.ts';
import { SPECIES } from '../content/species.ts';
import { TECH_IDS } from '../content/techs.ts';
import type { SystemId } from '../data/types.ts';
import { type Body, bodiesOf } from './bodies.ts';
import { refreshYards } from './designs.ts';
import { capacityOf } from './economy.ts';
import { habitability } from './habitability.ts';
import { remember } from './memory.ts';
import type { ReportEvent } from './report.ts';
import { grantResearch } from './research.ts';
import { rng } from './rng.ts';
import { type ArkAnswer, type GameState, type Holding, makeHolding, makeShip, newPower, powerOf } from './state.ts';
import type { World } from './world.ts';

const U = RULES.unhomed;
/** The power the Unhomed become. */
export const HEARTH: FactionId = 'last-hearth';
const LEVELS = ['comfortable', 'tolerable', 'harsh'] as const;

/** The turn the arks arrive in this game (§25.2). */
export function arksTurn(seed: number): number {
  return rng(seed, 'arks').int(U.from, U.to);
}

/** Whether the arks are here and waiting for an answer. */
export function arksWaiting(state: GameState): boolean {
  return state.arks !== null && state.arks.ended === null;
}

/** A power's answer so far, if it has given one. */
export function answerOf(state: GameState, faction: FactionId): { answer: ArkAnswer; body: string | null } | null {
  return state.arks?.answers.find((a) => a.faction === faction) ?? null;
}

/** How well the Unhomed could live on a body: its level's place among those they can settle, or -1. */
function fitFor(body: Body): number {
  return LEVELS.indexOf(habitability(body, SPECIES.unhomed).level as (typeof LEVELS)[number]);
}

/** The worlds a power could give them (§25.3): free, in a system it holds, and one they could settle; best first. */
export function givableWorlds(world: World, state: GameState, faction: FactionId): Body[] {
  const systems = [...new Set(state.holdings.filter((h) => h.owner === faction).map((h) => h.system))].sort();
  const held = new Set(state.holdings.map((h) => h.body));
  const out: Body[] = [];
  for (const sys of systems)
    for (const b of bodiesOf(world, state.seed, sys)) if (!held.has(b.id) && fitFor(b) >= 0) out.push(b);
  return out.sort(
    (a, b) =>
      fitFor(a) - fitFor(b) ||
      world.distanceDeci(U.at, a.systemId) - world.distanceDeci(U.at, b.systemId) ||
      (a.id < b.id ? -1 : 1),
  );
}

/** Why a power cannot give this answer now, or null if it can. */
export function arksRefusal(
  world: World,
  state: GameState,
  faction: FactionId,
  answer: ArkAnswer,
  body: string | null,
): string | null {
  if (!arksWaiting(state)) return 'No one is asking for a world.';
  if (faction === HEARTH) return 'We are the ones asking.';
  if (answer === 'give') {
    if (!body) return 'Name the world we give them.';
    if (!givableWorlds(world, state, faction).some((b) => b.id === body))
      return 'We can give them only a free world they could live on, in a system we hold.';
  }
  if (answer === 'take' && !state.holdings.some((h) => h.owner === faction && h.kind === 'colony'))
    return 'We have no colony to take them in.';
  return null;
}

/** Records a power's answer, in place of any before. */
export function setArksAnswer(state: GameState, faction: FactionId, answer: ArkAnswer, body: string | null): void {
  const a = state.arks;
  if (!a) return;
  a.answers = [
    ...a.answers.filter((x) => x.faction !== faction),
    { faction, answer, body: answer === 'give' ? body : null },
  ];
}

/** What taking them in gives a power: the colonies they would go to, with the people each. */
export function takeInPlan(world: World, state: GameState, faction: FactionId): { holding: Holding; people: number }[] {
  const room = (h: Holding) => capacityOf(world, state, h) - h.people;
  return state.holdings
    .filter((h) => h.owner === faction && h.kind === 'colony' && room(h) > 0)
    .sort((a, b) => room(b) - room(a) || a.id - b.id)
    .slice(0, U.takeInColonies)
    .map((h) => ({ holding: h, people: Math.min(U.takeInPeople, room(h)) }));
}

/**
 * As the turn ends (§25.2–§25.5): the arks arrive on their turn; while they wait, the first answer
 * that settles them takes effect; their star dies on its turn, and if they still wait they take a
 * world. Each step is told to every power.
 */
export function resolveArks(world: World, state: GameState, events: Map<FactionId, ReportEvent[]>): void {
  const all = (e: ReportEvent) => {
    for (const p of state.powers) if (p.left === null) events.get(p.faction)?.push(e);
  };
  if (!state.arks) {
    if (state.turn !== arksTurn(state.seed) || state.powers.some((p) => p.faction === HEARTH)) return;
    state.arks = { arrived: state.turn, dies: state.turn + U.diesAfter, answers: [], ended: null };
    all({ kind: 'arks', stage: 'arrived', system: U.at });
    return;
  }
  const a = state.arks;
  if (a.ended === null) {
    const inPlay = (f: FactionId) => state.powers.some((p) => p.faction === f && p.left === null);
    const near = (f: FactionId) => world.distanceDeci(U.at, powerOf(state, f).capital);
    const gifts = a.answers
      .filter((x) => x.answer === 'give' && inPlay(x.faction))
      .flatMap((x) => {
        const b = givableWorlds(world, state, x.faction).find((w) => w.id === x.body);
        return b ? [{ faction: x.faction, body: b, d: world.distanceDeci(U.at, b.systemId) }] : [];
      })
      .sort((p, q) => p.d - q.d || (p.faction < q.faction ? -1 : 1));
    const takers = a.answers
      .filter((x) => x.answer === 'take' && inPlay(x.faction) && takeInPlan(world, state, x.faction).length > 0)
      .sort((p, q) => near(p.faction) - near(q.faction) || (p.faction < q.faction ? -1 : 1));
    const gift = gifts[0];
    const taker = takers[0];
    if (gift) {
      settle(state, gift.body, gift.faction);
      a.ended = { how: 'given', by: gift.faction, body: gift.body.id, turn: state.turn };
      all({ kind: 'arks', stage: 'given', by: gift.faction, system: gift.body.systemId });
    } else if (taker) {
      takeIn(world, state, taker.faction);
      a.ended = { how: 'taken-in', by: taker.faction, body: null, turn: state.turn };
      all({ kind: 'arks', stage: 'taken-in', by: taker.faction });
    }
  }
  if (state.turn === a.dies) {
    for (const p of state.powers) if (p.left === null) grantResearch(state, p, U.starResearch);
    all({ kind: 'arks', stage: 'star' });
    if (a.ended === null) {
      const body = worldToTake(world, state);
      if (body) {
        settle(state, body, null);
        a.ended = { how: 'took', by: null, body: body.id, turn: state.turn };
        all({ kind: 'arks', stage: 'took', system: body.systemId });
      }
    }
  }
}

/** The world they take by force (§25.4): the best free one near the arks, else the nearest they could live on. */
export function worldToTake(world: World, state: GameState): Body | null {
  const held = new Set(state.holdings.map((h) => h.body));
  const all = world.systems
    .map((s) => ({ s: s.id, d: world.distanceDeci(U.at, s.id) }))
    .sort((x, y) => x.d - y.d || (x.s < y.s ? -1 : 1));
  const free = (sys: SystemId) => bodiesOf(world, state.seed, sys).filter((b) => !held.has(b.id) && fitFor(b) >= 0);
  const near = all.filter((x) => x.d <= U.reachDeci).flatMap((x) => free(x.s).map((b) => ({ b, d: x.d })));
  const best = near.sort((x, y) => fitFor(x.b) - fitFor(y.b) || x.d - y.d || (x.b.id < y.b.id ? -1 : 1))[0];
  if (best) return best.b;
  for (const x of all) {
    const b = free(x.s)[0];
    if (b) return b;
  }
  return null;
}

/** They come to a power's colonies as its own people (§25.3). */
function takeIn(world: World, state: GameState, faction: FactionId): void {
  const power = powerOf(state, faction);
  for (const { holding, people } of takeInPlan(world, state, faction)) {
    holding.people += people;
    power.lasting.push({
      event: 'arks',
      kind: 'approval',
      holding: holding.id,
      amount: U.takeInApproval,
      left: U.takeInTurns,
    });
  }
  grantResearch(state, power, U.takeInResearch);
}

/**
 * The Last Hearth, a power in mid-game (§25.5): its capital colony on the body, a shipyard and a lane
 * station, a survey ship and a colony ship, the technologies every power knows, talk with every power,
 * and its memories of who gave it a home and who refused.
 */
function settle(state: GameState, world0: Body, giver: FactionId | null): void {
  const system = world0.systemId;
  const body = world0.id;
  const others = state.powers.filter((p) => p.left === null);
  const power = newPower(HEARTH, 'ai');
  power.capital = system;
  power.surveyed = [system];
  power.treasury = U.credits;
  // What most of the powers know, they have learnt from listening: more than half of those in play.
  const known = new Map<string, number>();
  for (const p of others) for (const t of p.researched) known.set(t, (known.get(t) ?? 0) + 1);
  power.researched = (others[0] ? TECH_IDS : []).filter((t) => (known.get(t) ?? 0) * 2 > others.length);
  power.contacts = others.map((p) => ({
    faction: p.faction,
    stage: 'talk' as const,
    since: state.turn,
    words: RULES.contact.wordsToTalk,
  }));
  for (const p of others)
    p.contacts = [
      ...p.contacts.filter((c) => c.faction !== HEARTH),
      { faction: HEARTH, stage: 'talk', since: state.turn, words: RULES.contact.wordsToTalk },
    ];
  state.powers.push(power);
  // The story's scores so far: it had none before it came.
  for (const h of state.history) h.scores.push(0);
  makeHolding(state, {
    owner: HEARTH,
    kind: 'colony',
    system,
    body,
    capital: true,
    people: U.people,
    projects: ['shipyard', 'lane-station'],
    districts: RULES.districts.capitalStart.map((zone, i) => ({ zone, slot: i + 1 })),
  });
  makeShip(state, HEARTH, 'survey', system);
  makeShip(state, HEARTH, 'colony', system);
  refreshYards(state, power);
  // Who gave it a home, and who refused (§25.5): taking a world, every power that did not answer too.
  const answers = state.arks?.answers ?? [];
  for (const p of others) {
    const said = answers.find((x) => x.faction === p.faction)?.answer;
    if (p.faction === giver) remember(state, HEARTH, p.faction, { kind: 'gave-home', amount: U.gave, system });
    else if (said === 'refuse' || (giver === null && said === undefined))
      remember(state, HEARTH, p.faction, { kind: 'refused-home', amount: U.refused, system });
  }
}
