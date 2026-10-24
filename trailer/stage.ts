// The trailer's staged games (docs/design/TRAILER.md §10.2): headless games with every power a rival,
// each kept as the state at the moments the shot list films, from one power's side. A capture starts
// a new game with the same seed and power and loads the state with `__setGame`. Nothing in the game
// changes for this.
//
//   npm run trailer:stage            (about a minute; writes trailer/out/states/<power><seed>/)

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FACTION_IDS, type FactionId } from '../src/content/factions.ts';
import { SKY } from '../src/data/sky.ts';
import { type GameState, newGame } from '../src/sim/state.ts';
import { resolveTurn } from '../src/sim/turn.ts';
import { buildWorld } from '../src/sim/world.ts';
import { GAMES, LAST, stateDir } from './games.ts';

const world = buildWorld(SKY);

function play(faction: FactionId, seed: number): string[] {
  const dir = stateDir(faction, seed);
  mkdirSync(dir, { recursive: true });
  let g: GameState = newGame(world, {
    seed,
    powers: FACTION_IDS.map((f) => ({ faction: f, controller: 'ai' as const })),
  });
  const kept = new Set<string>();
  const log: string[] = [];
  const keep = (tag: string, why: string) => {
    if (kept.has(tag)) return;
    kept.add(tag);
    const s = structuredClone(g);
    for (const p of s.powers) p.controller = p.faction === faction ? 'player' : 'ai';
    writeFileSync(resolve(dir, `${tag}.json`), JSON.stringify(s));
    log.push(`turn ${s.turn}: ${tag} (${why})`);
  };
  for (let turn = 1; turn <= LAST; turn++) {
    const r = resolveTurn(world, g);
    g = r.state;
    for (const e of r.reports.find((x) => x.faction === faction)?.events ?? []) {
      if (e.kind === 'contact' && e.first && e.stage === 'words') keep(`contact-${e.faction}`, 'first words');
      else if (e.kind === 'battle') keep(`battle-${g.turn}`, `a battle at ${e.system}`);
      else if (e.kind === 'invasion') keep(`invasion-${g.turn}`, `${e.by} invades ${e.system}, won ${e.won}`);
      else if (e.kind === 'event') keep(`event-${e.event}`, 'an event');
      else if (e.kind === 'key') keep(`key-${e.stage}-${g.turn}`, `a key ${e.stage}`);
      else if (e.kind === 'chapter') keep(`chapter-${e.chapter}`, `a chapter at ${e.system}`);
      else if (e.kind === 'arks') keep('arks', 'the arks');
      else if (e.kind === 'war-declared') keep(`war-${g.turn}`, `${e.by} goes to war`);
      else if (e.kind === 'founded') keep(`founded-${e.system}`, `founded on ${e.body}`);
      else if (e.kind === 'built' && e.item.kind === 'project')
        keep(`built-${g.turn}-${e.item.project}`, `holding ${e.holding}`);
      else if (e.kind === 'lane-opened') keep(`lane-${g.turn}`, e.lane);
    }
    if (turn % 25 === 0) keep(`t${turn}`, 'a checkpoint');
    if (g.ended) {
      keep('ended', JSON.stringify(g.ended));
      break;
    }
  }
  writeFileSync(resolve(dir, 'log.txt'), `${log.join('\n')}\n`);
  return log;
}

for (const { faction, seed } of GAMES) console.log(`${faction} ${seed}: ${play(faction, seed).length} states`);
