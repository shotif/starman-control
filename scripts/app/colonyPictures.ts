// The pictures a colony's first visit loads on a phone (COLONY_VIEW.md §5, §9.3), worked out from
// the game's own scenes rather than guessed: for every world each power could live on, in a few
// seeds, a colony with all four projects (or three and a scaffold) at a few sizes, laid out by the
// scene's own code, at the phone's smallest widths. Used by scripts/app/budgets.ts.

import { LANDSCAPES, STRUCTURES } from '../../src/content/colonyArt.ts';
import { FACTION_IDS, FACTIONS } from '../../src/content/factions.ts';
import { PROJECT_IDS } from '../../src/content/projects.ts';
import { SKY } from '../../src/data/sky.ts';
import { placeAll, placeProps } from '../../src/render/colonyPlace.ts';
import { colonyScene } from '../../src/render/colonyScene.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import { habitability } from '../../src/sim/habitability.ts';
import { speciesFor } from '../../src/sim/research.ts';
import { newGame } from '../../src/sim/state.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** Every distinct set of files (relative to art/) a colony's first visit can load. */
export function colonyPictureSets(seeds: readonly number[] = [1, 42]): { name: string; files: string[] }[] {
  const world = buildWorld(SKY);
  const sets = new Map<string, { name: string; files: string[] }>();
  for (const seed of seeds)
    for (const faction of FACTION_IDS) {
      const game = newGame(world, { seed, powers: [{ faction, controller: 'player' }] });
      const capital = game.holdings.find((h) => h.owner === faction && h.capital);
      if (!capital) continue;
      const species = speciesFor(game, faction);
      for (const system of world.systems)
        for (const body of bodiesOf(world, seed, system.id)) {
          if (habitability(body, species).level === 'uninhabitable') continue;
          const isCapital = body.id === capital.body;
          for (const people of [30, 100, 200])
            for (const scaffold of [false, true]) {
              const projects = scaffold ? PROJECT_IDS.slice(0, 3) : [...PROJECT_IDS];
              const queue = scaffold ? [{ kind: 'project' as const, project: PROJECT_IDS[3] ?? 'mine' }] : [];
              const scene = colonyScene(world, game, {
                ...capital,
                id: isCapital ? capital.id : 999,
                system: system.id,
                body: body.id,
                capital: isCapital,
                people,
                projects,
                queue,
              });
              if (!scene) continue;
              const land = LANDSCAPES[scene.biome];
              const placed = placeAll(scene, land);
              const files = new Set<string>([`landscape/${land.id}-1280.webp`]);
              for (const p of placed) files.add(`structure/${p.art.id}-512.webp`);
              for (const p of placeProps(scene, land, placed)) files.add(`prop/${p.art.id}-256.webp`);
              if (STRUCTURES.rover) files.add('structure/rover-512.webp');
              const shuttle = STRUCTURES[`${FACTIONS[faction].architecture}-shuttle`];
              if (shuttle && placed.some((p) => p.building.kind === 'shipyard'))
                files.add(`structure/${shuttle.id}-512.webp`);
              const key = [...files].sort().join('|');
              if (!sets.has(key))
                sets.set(key, { name: `${body.name} (${faction}, ${people / 10}M)`, files: [...files] });
            }
        }
    }
  return [...sets.values()];
}
