// The headless games (M2_WORLDS.md §29.2, M2B_SCIENCE.md §2, M4_FLEETS.md §30.4): every power plays
// as a rival, 100 turns for M2's and M3's tables and on to the end of the game for M4's (the alien powers too, M3_NEIGHBOURS.md §24.8) on eight seeds, and what each power made of it is written to docs/design/M2_BALANCE.md, to read when
// balancing. Not part of `npm run check` (the unit tests check the limits); run it with
// `npm run balance`.

import { writeFileSync } from 'node:fs';
import { EVENTS, type EventId } from '../../src/content/events.ts';
import { FACTION_IDS, FACTIONS, type FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { TECH_IDS, TECHS } from '../../src/content/techs.ts';
import { SKY } from '../../src/data/sky.ts';
import { researchOf } from '../../src/sim/economy.ts';
import { placedSites, siteKnown } from '../../src/sim/relics.ts';
import { scoreOf } from '../../src/sim/score.ts';
import { newGame } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { buildWorld } from '../../src/sim/world.ts';

const SEEDS = [42, 7, 2176, 1, 2, 3, 4, 5];
/** What a power can learn: every technology but one of each pair of doctrines (M2B_SCIENCE.md §19.1). */
const LEARNABLE = TECH_IDS.length - TECH_IDS.filter((id) => TECHS[id].fork).length / 2;
const AT = [25, 50, 100];
/** Each game is played to its end (M4_FLEETS.md §30.4): won, or the default limit of 250 turns. */
const TURNS = 250;
const FACTION_ORDER: readonly FactionId[] = FACTION_IDS;

interface Line {
  colonies: number;
  outposts: number;
  people: number;
  techs: number;
  research: number;
  inspired: number;
  score: number;
  treasury: number;
}

const world = buildWorld(SKY);
const rows: string[] = [];
const totals = new Map<string, Line & { n: number }>();
const answered = new Map<EventId, [number, number]>();
let longestDebt = 0;
let longestHunger = 0;
let slowest = 0;
let biggest = 0;
/** M4 (M4_FLEETS.md §18): raids' plunder, battles, wars begun and colonies taken, in all the games. */
let raids = 0;
let battles = 0;
let wars = 0;
let taken = 0;
/** The Assembly (M4_FLEETS.md §29): the turn it formed in each game, its elections and resolutions passed. */
const formedOn: number[] = [];
let elections = 0;
let passed = 0;
/** The turn each power finished the whole tree, in each game. */
const finished: string[] = [];
/** M4's games to their end (§30.4): each game's ending, first war, and what happened in it. */
const ends: string[] = [];
let wonBefore = 0;
let warBy150 = 0;
let leftBefore100 = 0;
let slowestAll = 0;
let slowestTurn = 0;
let biggestAll = 0;
/** The whole game (M5_UNKNOWN.md §20, as built): the deepest treasury and the longest debt of any power. */
let deepest = 0;
let longestDebtAll = 0;
/** Relic sites (§20.11): those some power knew by turn 150, in each game. */
const sitesBy150: number[] = [];

for (const seed of SEEDS) {
  let g = newGame(world, { seed, powers: FACTION_ORDER.map((faction) => ({ faction, controller: 'ai' as const })) });
  const debt = new Map<FactionId, number>();
  const done = new Set<FactionId>();
  const game = { firstWar: 0, wars: 0, battles: 0, taken: 0, surrenders: 0, left: [] as string[] };
  const debtAll = new Map<FactionId, number>();
  for (let turn = 1; turn <= TURNS; turn++) {
    // Played on to turn 100 for the tables, and no further once decided.
    if (turn > 100 && g.ended) break;
    const t0 = performance.now();
    const r = resolveTurn(world, g);
    const ms = performance.now() - t0;
    if (turn <= 100) slowest = Math.max(slowest, ms);
    if (ms > slowestAll) {
      slowestAll = ms;
      slowestTurn = turn;
    }
    g = r.state;
    if (turn % 25 === 0) biggestAll = Math.max(biggestAll, JSON.stringify(g).length);
    for (const p of g.powers) {
      deepest = Math.min(deepest, p.treasury);
      const d = p.treasury < 0 ? (debtAll.get(p.faction) ?? 0) + 1 : 0;
      debtAll.set(p.faction, d);
      longestDebtAll = Math.max(longestDebtAll, d);
    }
    if (turn === 150)
      sitesBy150.push(
        placedSites(world, seed).filter((s) => g.powers.some((p) => siteKnown(world, g, p, s.system))).length,
      );
    game.battles += g.battles.length;
    for (const rep of r.reports)
      for (const e of rep.events) {
        if (e.kind === 'war-declared' && e.by === rep.faction) {
          game.wars++;
          if (!game.firstWar) game.firstWar = turn;
        }
        if (e.kind === 'invasion' && e.won && e.by === rep.faction) game.taken++;
        if (e.kind === 'subdued' && e.faction === rep.faction) game.surrenders++;
        if (e.kind === 'power-left' && e.faction === rep.faction) {
          game.left.push(`${FACTIONS[e.faction].shortName} (${turn})`);
          if (turn < 100) leftBefore100++;
        }
      }
    if (turn > 100) continue;
    for (const rep of r.reports)
      for (const e of rep.events) {
        if (e.kind === 'event-answered') {
          const a = answered.get(e.event) ?? [0, 0];
          a[e.choice]++;
          answered.set(e.event, a);
        }
        // Each told to both sides: counted once, by the side that did it.
        if (e.kind === 'raided' && e.by === rep.faction) raids++;
        if (e.kind === 'war-declared' && e.by === rep.faction) wars++;
        if (e.kind === 'invasion' && e.won && e.by === rep.faction) taken++;
      }
    if (turn === 100) biggest = Math.max(biggest, JSON.stringify(g).length);
    // The Assembly's events go to every member: each counted once.
    if (g.assembly && turn === 100) formedOn.push(g.assembly.formed);
    if (r.reports.some((rep) => rep.events.some((e) => e.kind === 'elected'))) elections++;
    if (r.reports.some((rep) => rep.events.some((e) => e.kind === 'resolution' && e.stage === 'passed'))) passed++;
    battles += g.battles.length;
    for (const p of g.powers) {
      const d = p.treasury < 0 ? (debt.get(p.faction) ?? 0) + 1 : 0;
      debt.set(p.faction, d);
      longestDebt = Math.max(longestDebt, d);
    }
    longestHunger = Math.max(longestHunger, ...g.holdings.map((h) => h.hungry));
    for (const p of g.powers)
      if (!done.has(p.faction) && p.researched.length === LEARNABLE) {
        done.add(p.faction);
        finished.push(`${FACTIONS[p.faction].shortName} on turn ${turn} (seed ${seed})`);
      }
    if (!AT.includes(turn)) continue;
    for (const p of g.powers) {
      const held = g.holdings.filter((h) => h.owner === p.faction);
      const line: Line = {
        colonies: held.filter((h) => h.kind === 'colony').length,
        outposts: held.filter((h) => h.kind === 'outpost').length,
        people: held.reduce((n, h) => n + h.people, 0),
        techs: p.researched.length,
        research: researchOf(world, g, p.faction).total,
        inspired: p.inspired.length,
        score: scoreOf(g, p.faction).total,
        treasury: p.treasury,
      };
      const key = `${turn}:${p.faction}`;
      const t = totals.get(key) ?? {
        colonies: 0,
        outposts: 0,
        people: 0,
        techs: 0,
        research: 0,
        inspired: 0,
        score: 0,
        treasury: 0,
        n: 0,
      };
      totals.set(key, {
        colonies: t.colonies + line.colonies,
        outposts: t.outposts + line.outposts,
        people: t.people + line.people,
        techs: t.techs + line.techs,
        research: t.research + line.research,
        inspired: t.inspired + line.inspired,
        score: t.score + line.score,
        treasury: t.treasury + line.treasury,
        n: t.n + 1,
      });
      if (turn === 100)
        rows.push(
          `| ${seed} | ${FACTIONS[p.faction].shortName} | ${line.colonies} | ${line.outposts} | ${(line.people / 10).toFixed(1)} | ${line.techs} | ${line.research} | ${line.inspired} | ${line.score} | ${line.treasury} |`,
        );
    }
  }
  biggestAll = Math.max(biggestAll, JSON.stringify(g).length);
  const e = g.ended;
  if (e && e.how !== 'score') wonBefore++;
  if (game.firstWar && game.firstWar <= 150) warBy150++;
  const how = !e ? 'undecided' : e.how === 'conquest' ? 'conquest' : e.how === 'vote' ? 'the Assembly' : 'score';
  // Relic sites (M5_UNKNOWN.md §20.11): chapters done in all, and the power that did the most.
  const chapters = g.powers.reduce((n, p) => n + p.chapters, 0);
  const most = [...g.powers].sort((a, b) => b.chapters - a.chapters)[0];
  const digger = most && most.chapters > 0 ? `${FACTIONS[most.faction].shortName} (${most.chapters})` : '—';
  // The arks of the Unhomed (M5_UNKNOWN.md §25): how they ended, and what the Last Hearth held at the end.
  const a = g.arks;
  const arks = !a?.ended
    ? a
      ? 'still asking'
      : '—'
    : `${a.ended.how === 'given' ? `given by the ${FACTIONS[a.ended.by ?? 'sta'].shortName}` : a.ended.how === 'taken-in' ? `taken in by the ${FACTIONS[a.ended.by ?? 'sta'].shortName}` : 'took a world'}, turn ${a.ended.turn}`;
  const hearth = g.holdings.filter((h) => h.owner === 'last-hearth');
  const hearthHeld = g.powers.some((p) => p.faction === 'last-hearth')
    ? `${hearth.filter((h) => h.kind === 'colony').length} colonies, ${hearth.filter((h) => h.kind === 'outpost').length} outposts`
    : '—';
  ends.push(
    `| ${seed} | ${e?.winner ? FACTIONS[e.winner].shortName : '—'} | ${how} | ${e ? e.turn : '—'} | ${game.firstWar || '—'} | ${game.wars} | ${game.battles} | ${game.taken} | ${game.surrenders} | ${game.left.join(', ') || '—'} | ${chapters} | ${digger} | ${arks} | ${hearthHeld} |`,
  );
}

const avg = (turn: number, f: FactionId) => {
  const t = totals.get(`${turn}:${f}`);
  if (!t) return '';
  const a = (n: number) => (n / t.n).toFixed(1);
  return `| ${turn} | ${FACTIONS[f].shortName} | ${a(t.colonies)} | ${a(t.outposts)} | ${(t.people / t.n / 10).toFixed(1)} | ${a(t.techs)} | ${a(t.research)} | ${a(t.inspired)} | ${Math.round(t.score / t.n)} | ${Math.round(t.treasury / t.n)} |`;
};

/** "No power fell into debt." or "The longest time in debt was 3 turns in a row." */
const streak = (turns: number, what: string, never: string) =>
  turns === 0 ? `${never}.` : `The longest time ${what} was ${turns} turn${turns === 1 ? '' : 's'} in a row.`;

/** "1 battle", "3 battles". */
const many = (n: number, one: string, more: string) => `${n} ${n === 1 ? one : more}`;

const out = `# The headless games

*Written by \`npm run balance\` (scripts/app/balance.ts, M2_WORLDS.md §29.2, M2B_SCIENCE.md §2, M4_FLEETS.md §30.4):
${FACTION_ORDER.length} rivals, ${SEEDS.length} seeds, 100 turns each for the tables, then on to the end of each game. Regenerate it
after any change to the rules or the rivals.*

The slowest of the first 100 turns took ${slowest.toFixed(0)} ms on the machine that wrote this; the largest save at turn 100
was ${(biggest / 1024).toFixed(1)} KB. ${streak(longestDebt, 'in debt', 'No power fell into debt')} ${streak(longestHunger, 'hungry', 'No colony went hungry')}

In all ${SEEDS.length} games, by turn 100: ${many(raids, 'turn', 'turns')} of plunder by raids, ${many(battles, 'battle', 'battles')}, ${many(wars, 'war', 'wars')} declared and ${many(taken, 'colony or outpost', 'colonies or outposts')} taken by invasion (M4).
The Assembly formed in ${formedOn.length} of them${formedOn.length > 0 ? `, on turn ${Math.min(...formedOn)} at the earliest and ${Math.max(...formedOn)} at the latest` : ''}; it held ${many(elections, 'election', 'elections')} and passed ${many(passed, 'resolution', 'resolutions')} by turn 100.

The tree has ${TECH_IDS.length} technologies, of which a power can learn ${LEARNABLE} (one of each pair of doctrines). ${finished.length === 0 ? 'No power learnt them all in 100 turns.' : `All learnt by: ${finished.join('; ')}.`}

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${AT.flatMap((t) => FACTION_ORDER.map((f) => avg(t, f))).join('\n')}

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Research a turn | Inspirations | Score | Treasury |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

## To the end of each game (M4)

Each game played on, after turn 100, until it was won or reached the default limit of ${TURNS} turns
(M4_FLEETS.md §30.4). ${many(wonBefore, 'game was', 'games were')} won before the limit; ${many(warBy150, 'game', 'games')} saw a war by turn 150;
${many(leftBefore100, 'power', 'powers')} left the game before turn 100. The slowest turn of all took ${slowestAll.toFixed(0)} ms (turn ${slowestTurn}); the
largest save was ${(biggestAll / 1024).toFixed(1)} KB. The deepest any treasury fell was ${deepest} credits;
${streak(longestDebtAll, 'in debt', 'no power fell into debt').replace(/^T/, 't')}
Of the ${RULES.relics.sites} relic sites in each game, some power knew ${sitesBy150.length > 0 ? `${Math.min(...sitesBy150)} to ${Math.max(...sitesBy150)}` : 'none'} by turn 150 (M5).

| Seed | Won by | How | On turn | First war | Wars | Battles | Taken | Surrenders | Left the game | Chapters | Most chapters | The arks | The Last Hearth at the end |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${ends.join('\n')}

## Events, and how the rivals answered them

| Event | First choice | Second choice |
| --- | --- | --- |
${[...answered.entries()]
  .sort((a, b) => (a[0] < b[0] ? -1 : 1))
  .map(
    ([id, [a, b]]) =>
      `| ${EVENTS[id].name} | ${a} (${EVENTS[id].choices[0].name.toLowerCase()}) | ${b} (${EVENTS[id].choices[1].name.toLowerCase()}) |`,
  )
  .join('\n')}
`;

writeFileSync(new URL('../../docs/design/M2_BALANCE.md', import.meta.url), out);
console.log(out);
