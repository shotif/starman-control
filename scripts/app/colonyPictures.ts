// The pictures a colony loads on a phone (COLONY_VIEW.md §5, M2_WORLDS.md §23.4), worked out from
// the game's own scenes rather than guessed: for every world each power could live on, in a few
// seeds, a colony zoned with every kind of district and holding every project (or all but one,
// and its scaffold), at a few sizes, laid out by the scene's own code. Each picture is counted at
// the width the game itself would load (`artUrl`), for the still in a phone's panel, its first
// pictures, and for the diorama the still opens. Used by scripts/app/budgets.ts.

import { LANDSCAPES, type LandscapeArt, STRUCTURES } from '../../src/content/colonyArt.ts';
import { ZONES, type Zone } from '../../src/content/districts.ts';
import { FACTION_IDS } from '../../src/content/factions.ts';
import { PROJECT_IDS } from '../../src/content/projects.ts';
import { SKY } from '../../src/data/sky.ts';
import { artUrl, frameTown, placeAll, placeProps, townBounds } from '../../src/render/colonyPlace.ts';
import { type ColonyScene, colonyScene } from '../../src/render/colonyScene.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import { habitability } from '../../src/sim/habitability.ts';
import { speciesFor } from '../../src/sim/research.ts';
import { newGame } from '../../src/sim/state.ts';
import { buildWorld } from '../../src/sim/world.ts';

/** The phone: the most pixels a canvas draws at (both views cap it at 2), a 390 px screen. */
const DPR = 2;
/** The still's canvas is the sheet's width less its gutters (src/ui/map/ColonyStill.tsx). */
const STILL_WIDTH = 358 * DPR;
/** The still is twice as wide as it is tall (colony.css). */
const STILL_ASPECT = 2;
/** The diorama's stage: the screen's width, and the height the bars and the sheet leave it. */
const STAGE = { w: 390, h: 600 };
/** src/render/ColonyView.ts: the sky above the picture's top that the view may show. */
const SKY_ROOM = 0.9;

const strip = (url: string) => url.replace(/^\/art\//, '');

/** What the still loads (ColonyStill.tsx): each picture at the width it is drawn in its frame. */
function stillFiles(scene: ColonyScene, land: LandscapeArt): Set<string> {
  const placed = placeAll(scene, land);
  const LW = STILL_WIDTH / frameTown(placed, land, STILL_ASPECT).uw;
  const files = new Set([strip(artUrl('/', 'landscape', land.id, LW))]);
  for (const p of placed) files.add(strip(artUrl('/', 'structure', p.art.id, p.w * LW)));
  for (const p of placeProps(scene, land, placed))
    files.add(strip(artUrl('/', 'prop', p.art.id, Math.max(p.w, p.h / land.aspect) * LW)));
  return files;
}

/** What the diorama loads (ColonyView.ts: `showTown`'s framing, and `wantedWidth` at 1.6 times the fit at least). */
function dioramaFiles(scene: ColonyScene, land: LandscapeArt): Set<string> {
  const A = land.aspect;
  const placed = placeAll(scene, land);
  const t = townBounds(placed);
  const skyAbove = STAGE.h > STAGE.w ? 0.3 : 0.22;
  const needH = 1 - land.horizon + skyAbove - (1 - t.bottom - 0.05);
  const townW = (t.right - t.left) * A;
  const shown = Math.max(STAGE.h / (needH * 1.45), Math.min(STAGE.h / needH, STAGE.w / (townW * 1.05)));
  const fitK = Math.max(STAGE.w / A, STAGE.h / (1 + SKY_ROOM));
  const k = Math.max(Math.max(fitK, shown), fitK * 1.6) * DPR;
  const files = new Set([strip(artUrl('/', 'landscape', land.id, A * k))]);
  for (const p of placed) files.add(strip(artUrl('/', 'structure', p.art.id, p.w * A * k)));
  for (const p of placeProps(scene, land, placed))
    files.add(strip(artUrl('/', 'prop', p.art.id, Math.max(p.w * A, p.h) * k)));
  const shuttle = STRUCTURES[`${scene.architecture}-shuttle`];
  if (shuttle && placed.some((p) => p.building.kind === 'shipyard'))
    files.add(strip(artUrl('/', 'structure', shuttle.id, 300)));
  if (STRUCTURES.rover) files.add(strip(artUrl('/', 'structure', 'rover', 200)));
  return files;
}

export interface PictureSet {
  name: string;
  still: string[];
  diorama: string[];
}

/** Every distinct set of files (relative to art/) a colony can load on a phone, for its still and its diorama. */
export function colonyPictureSets(seeds: readonly number[] = [1, 42]): PictureSet[] {
  const world = buildWorld(SKY);
  const sets = new Map<string, PictureSet>();
  // Every kind of district, housing first, as far as the land goes.
  const zoning = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ zone: ZONES[i % ZONES.length] as Zone, slot: i + 1 }));
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
          const land = isCapital ? 10 : Math.max(1, body.size);
          for (const people of [30, 100, 200])
            for (const scaffold of [false, true]) {
              const projects = scaffold ? PROJECT_IDS.slice(0, -1) : [...PROJECT_IDS];
              const queue = scaffold ? [{ kind: 'project' as const, project: PROJECT_IDS.at(-1) ?? 'mine' }] : [];
              const scene = colonyScene(world, game, {
                ...capital,
                id: isCapital ? capital.id : 999,
                system: system.id,
                body: body.id,
                capital: isCapital,
                people,
                projects,
                queue,
                districts: isCapital ? capital.districts : zoning(land),
              });
              if (!scene) continue;
              const art = LANDSCAPES[scene.biome];
              const still = [...stillFiles(scene, art)].sort();
              const diorama = [...dioramaFiles(scene, art)].sort();
              const key = `${still.join('|')}#${diorama.join('|')}`;
              if (!sets.has(key)) sets.set(key, { name: `${body.name} (${faction}, ${people / 10}M)`, still, diorama });
            }
        }
    }
  return [...sets.values()];
}
