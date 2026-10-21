// The headless games (M2_WORLDS.md §29.2): three rivals play 100 turns on eight seeds, and what
// each power made of it is written to docs/design/M2_BALANCE.md, to read when balancing. Not part
// of `npm run check` (the unit tests check the limits); run it with `npm run balance`.

import { writeFileSync } from 'node:fs';
import { EVENTS, type EventId } from '../../src/content/events.ts';
import { FACTIONS, type FactionId } from '../../src/content/factions.ts';
import { SKY } from '../../src/data/sky.ts';
import { newGame } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { buildWorld } from '../../src/sim/world.ts';

const SEEDS = [42, 7, 2176, 1, 2, 3, 4, 5];
const AT = [25, 50, 100];
const FACTION_ORDER: FactionId[] = ['sta', 'frontier', 'hollow-wake'];

interface Line {
  colonies: number;
  outposts: number;
  people: number;
  techs: number;
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

for (const seed of SEEDS) {
  let g = newGame(world, { seed, powers: FACTION_ORDER.map((faction) => ({ faction, controller: 'ai' as const })) });
  const debt = new Map<FactionId, number>();
  for (let turn = 1; turn <= 100; turn++) {
    const t0 = performance.now();
    const r = resolveTurn(world, g);
    slowest = Math.max(slowest, performance.now() - t0);
    g = r.state;
    for (const rep of r.reports)
      for (const e of rep.events)
        if (e.kind === 'event-answered') {
          const a = answered.get(e.event) ?? [0, 0];
          a[e.choice]++;
          answered.set(e.event, a);
        }
    for (const p of g.powers) {
      const d = p.treasury < 0 ? (debt.get(p.faction) ?? 0) + 1 : 0;
      debt.set(p.faction, d);
      longestDebt = Math.max(longestDebt, d);
    }
    longestHunger = Math.max(longestHunger, ...g.holdings.map((h) => h.hungry));
    if (!AT.includes(turn)) continue;
    for (const p of g.powers) {
      const held = g.holdings.filter((h) => h.owner === p.faction);
      const line: Line = {
        colonies: held.filter((h) => h.kind === 'colony').length,
        outposts: held.filter((h) => h.kind === 'outpost').length,
        people: held.reduce((n, h) => n + h.people, 0),
        techs: p.researched.length,
        treasury: p.treasury,
      };
      const key = `${turn}:${p.faction}`;
      const t = totals.get(key) ?? { colonies: 0, outposts: 0, people: 0, techs: 0, treasury: 0, n: 0 };
      totals.set(key, {
        colonies: t.colonies + line.colonies,
        outposts: t.outposts + line.outposts,
        people: t.people + line.people,
        techs: t.techs + line.techs,
        treasury: t.treasury + line.treasury,
        n: t.n + 1,
      });
      if (turn === 100)
        rows.push(
          `| ${seed} | ${FACTIONS[p.faction].shortName} | ${line.colonies} | ${line.outposts} | ${(line.people / 10).toFixed(1)} | ${line.techs} | ${line.treasury} |`,
        );
    }
  }
  biggest = Math.max(biggest, JSON.stringify(g).length);
}

const avg = (turn: number, f: FactionId) => {
  const t = totals.get(`${turn}:${f}`);
  if (!t) return '';
  const a = (n: number) => (n / t.n).toFixed(1);
  return `| ${turn} | ${FACTIONS[f].shortName} | ${a(t.colonies)} | ${a(t.outposts)} | ${(t.people / t.n / 10).toFixed(1)} | ${a(t.techs)} | ${Math.round(t.treasury / t.n)} |`;
};

const out = `# M2's headless games

*Written by \`npm run balance\` (scripts/app/balance.ts, M2_WORLDS.md §29.2): three rivals, ${SEEDS.length} seeds,
100 turns each. Regenerate it after any change to the rules or the rivals.*

The slowest turn took ${slowest.toFixed(0)} ms on the machine that wrote this; the largest save at turn 100
was ${(biggest / 1024).toFixed(1)} KB. No power was in debt for more than ${longestDebt} turn${longestDebt === 1 ? '' : 's'} in a
row; no colony was hungry for more than ${longestHunger} turn${longestHunger === 1 ? '' : 's'} in a row.

## On average

| Turn | Power | Colonies | Outposts | People (millions) | Technologies | Treasury |
| --- | --- | --- | --- | --- | --- | --- |
${AT.flatMap((t) => FACTION_ORDER.map((f) => avg(t, f))).join('\n')}

## Each game at turn 100

| Seed | Power | Colonies | Outposts | People (millions) | Technologies | Treasury |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

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
