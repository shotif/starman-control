import { describe, expect, it } from 'vitest';
import manifest from '../../art/manifest.json' with { type: 'json' };
import { LANDSCAPES, STRUCTURES, structureArt, structureId } from '../../src/content/colonyArt.ts';
import { FACTION_IDS, FACTIONS, type FactionId } from '../../src/content/factions.ts';
import { PROJECT_IDS } from '../../src/content/projects.ts';
import { SKY } from '../../src/data/sky.ts';
import { frameTown, placeAll, placeBuilding } from '../../src/render/colonyPlace.ts';
import { biomeOf, colonyScene, homesFor, mixHex } from '../../src/render/colonyScene.ts';
import { bodiesOf } from '../../src/sim/bodies.ts';
import { type GameState, newGame } from '../../src/sim/state.ts';
import { buildWorld } from '../../src/sim/world.ts';

const world = buildWorld(SKY);
const start = (faction: FactionId, seed: number) =>
  newGame(world, { seed, powers: [{ faction, controller: 'player' }] });
const capital = (g: GameState, faction: FactionId) => {
  const h = g.holdings.find((x) => x.owner === faction && x.capital);
  if (!h) throw new Error('no capital');
  return h;
};
const body = (system: string, id: string, seed = 42) => {
  const b = bodiesOf(world, seed, system).find((x) => x.id === id);
  if (!b) throw new Error(id);
  return b;
};

describe('the ground of a world', () => {
  it('follows the real worlds: Earth a garden, the Moon airless, Mars tundra', () => {
    expect(biomeOf(body('sol', 'earth'))).toBe('garden');
    expect(biomeOf(body('sol', 'moon'))).toBe('airless');
    expect(biomeOf(body('sol', 'mars'))).toBe('tundra');
  });

  it('takes the first rule that fits', () => {
    const w = (temperature: string, atmosphere: string, water: string) =>
      biomeOf({ temperature, atmosphere, water } as Parameters<typeof biomeOf>[0]);
    expect(w('scorching', 'toxic', 'none')).toBe('inferno');
    expect(w('warm', 'toxic', 'oceans')).toBe('haze');
    expect(w('frozen', 'none', 'ice')).toBe('ice');
    expect(w('cold', 'none', 'ice')).toBe('airless');
    expect(w('frozen', 'thin', 'none')).toBe('ice');
    expect(w('hot', 'dense', 'oceans')).toBe('desert');
    expect(w('cold', 'thin', 'ice')).toBe('tundra');
    expect(w('temperate', 'dense', 'oceans')).toBe('garden');
    expect(w('warm', 'thin', 'oceans')).toBe('shore');
    expect(w('temperate', 'thin', 'none')).toBe('steppe');
  });

  it('gives every world in the game a ground', () => {
    for (const s of world.systems)
      for (const b of bodiesOf(world, 7, s.id)) expect(typeof biomeOf(b), b.id).toBe('string');
  });
});

describe('homes', () => {
  it('grow in number and size with the people, the newest a size smaller', () => {
    expect(homesFor(5, 5)).toEqual([1]);
    expect(homesFor(25, 5)).toEqual([1]);
    expect(homesFor(100, 5)).toEqual([2, 2, 1]);
    expect(homesFor(200, 6)).toEqual([3, 3, 3, 3, 2]);
    expect(homesFor(200, 3)).toEqual([3, 3, 2]);
  });
});

describe('a colony’s scene', () => {
  it('shows the Cooperative’s capital on Tau Ceti e as the game made it', () => {
    // Seed 1 makes Tau Ceti e warm, with air and seas: a shore. Its high gravity makes it harsh.
    const g = start('frontier', 1);
    const s = colonyScene(world, g, capital(g, 'frontier'));
    expect(s?.biome).toBe('shore');
    expect(s?.envelope).toBe('domed');
    expect(s?.architecture).toBe('cooperative');
    expect(s?.colour).toBe(FACTIONS.frontier.colour);
    expect(s?.sun.word).toBe('yellow');
    expect(s?.sun.size).toBeGreaterThan(1);
    expect(s?.slots).toBe(body('tau-ceti', 'tau-ceti-e', 1).size);
    expect(s?.buildings.map((b) => [b.kind, b.slot])).toEqual([
      ['homes', 0],
      ['shipyard', 1],
      ['homes', 2],
      ['lane-station', 3],
      ['homes', 4],
    ]);
    expect(s?.description).toBe(
      'Tau Ceti e: a domed city of about 10 million under a yellow sun, with a shipyard and a lane station.',
    );
  });

  it('follows the seed: the same world without air is airless, under a black sky', () => {
    const g = start('frontier', 4242);
    const s = colonyScene(world, g, capital(g, 'frontier'));
    expect(s?.biome).toBe('airless');
    expect(s?.sky.starsByDay).toBe(true);
    expect(s?.description).toContain('in a black sky');
  });

  it('puts a scaffold where the queued project will stand, filling as industry goes in', () => {
    const g = start('sta', 42);
    const h = capital(g, 'sta');
    h.queue = [{ kind: 'project', project: 'mine' }];
    h.industry = 15;
    const s = colonyScene(world, g, h);
    const scaffold = s?.buildings.find((b) => b.kind === 'scaffold');
    expect(scaffold).toEqual({ kind: 'scaffold', project: 'mine', slot: 5, progress: 0.5 });
    expect(s?.description).toMatch(/; a mine is being built\.$/);
    // When it is finished, the mine stands in the scaffold's slot.
    h.queue = [];
    h.projects = [...h.projects, 'mine'];
    expect(colonyScene(world, g, h)?.buildings.find((b) => b.kind === 'mine')?.slot).toBe(5);
  });

  it('lays Earth out in the open air, under a dense sky', () => {
    const g = start('sta', 42);
    const s = colonyScene(world, g, capital(g, 'sta'));
    expect(s?.biome).toBe('garden');
    expect(s?.envelope).toBe('open');
    expect(s?.sky.starsByDay).toBe(false);
    expect(s?.sun.size).toBeCloseTo(1, 1);
  });

  it('never assumes the power: each capital is drawn in its owner’s architecture', () => {
    for (const f of FACTION_IDS) {
      const g = start(f, 42);
      expect(colonyScene(world, g, capital(g, f))?.architecture).toBe(FACTIONS[f].architecture);
    }
  });

  it('gives an outpost no homes and no people', () => {
    const g = start('hollow-wake', 42);
    const h = { ...capital(g, 'hollow-wake'), kind: 'outpost' as const, capital: false, people: 0, projects: [] };
    const s = colonyScene(world, g, h);
    expect(s?.buildings.filter((b) => b.kind === 'homes')).toEqual([]);
    expect(s?.people).toBe(0);
    expect(s?.description).toContain('an automated outpost');
  });
});

describe('the colony view’s pictures', () => {
  const approved = new Map(manifest.images.map((e) => [e.id, e]));

  it('are all approved, and their shapes match the cut-outs', () => {
    for (const art of Object.values(STRUCTURES)) {
      const e = approved.get(art.id);
      expect(e?.series, art.id).toBe('structure');
      const crop = (e as { crop?: { width: number; height: number } }).crop;
      expect(crop, art.id).toBeDefined();
      if (crop) expect(art.aspect).toBeCloseTo(crop.width / crop.height, 3);
    }
    for (const art of Object.values(LANDSCAPES)) {
      expect(approved.get(art.id)?.series, art.id).toBe('landscape');
      expect(art.slots).toHaveLength(12);
      for (const [u, v] of art.slots) {
        expect(u > 0 && u < 1 && v > art.horizon && v < 1).toBe(true);
      }
    }
  });

  it('cover every ground, and every power’s homes and projects', () => {
    for (const biome of ['garden', 'shore', 'steppe', 'desert', 'inferno', 'tundra', 'ice', 'airless', 'haze'] as const)
      expect(LANDSCAPES[biome], biome).toBeDefined();
    for (const f of FACTION_IDS) {
      const a = FACTIONS[f].architecture;
      for (const size of [1, 2, 3] as const)
        for (const envelope of ['open', 'domed'] as const)
          expect(structureArt(a, 'homes', { size, envelope }), `${a} ${size} ${envelope}`).toBeDefined();
      for (const p of PROJECT_IDS) expect(structureArt(a, p), `${a} ${p}`).toBeDefined();
      expect(structureArt(a, 'scaffold')?.id).toBe('scaffold');
    }
    expect(structureId('wake', 'homes', { size: 3, envelope: 'domed' })).toBe('wake-homes-3-domed');
  });

  it('mixes colours', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixHex('#102030', '#102030', 0.3)).toBe('#102030');
  });
});

describe('placing the buildings', () => {
  const g = start('frontier', 1);
  const h = capital(g, 'frontier');
  h.queue = [{ kind: 'project', project: 'mine' }];
  const scene = colonyScene(world, g, h);
  if (!scene) throw new Error('no scene');
  const land = LANDSCAPES[scene.biome];

  it('sets each building in its slot, nearer ones larger, farthest first', () => {
    const placed = placeAll(scene, land);
    expect(placed).toHaveLength(scene.buildings.length);
    for (let i = 1; i < placed.length; i++) expect((placed[i]?.v ?? 0) >= (placed[i - 1]?.v ?? 0)).toBe(true);
    const homes = placed.filter((p) => p.building.kind === 'homes');
    const near = homes.reduce((a, b) => (b.v > a.v ? b : a));
    const far = homes.reduce((a, b) => (b.v < a.v ? b : a));
    expect(near.w).toBeGreaterThan(far.w);
  });

  it('sizes a scaffold to the project it is putting up', () => {
    const scaffold = scene.buildings.find((b) => b.kind === 'scaffold');
    if (!scaffold) throw new Error('no scaffold');
    const p = placeBuilding(scene, land, scaffold);
    const mine = placeBuilding(scene, land, { kind: 'mine', project: 'mine', slot: scaffold.slot });
    expect(p && mine && p.w / mine.w).toBeCloseTo(0.7, 5);
  });

  it('frames the town inside the picture at any shape', () => {
    for (const aspect of [0.6, 1, 2, 3]) {
      const f = frameTown(placeAll(scene, land), land, aspect);
      expect(f.u0 >= 0 && f.u0 + f.uw <= 1 + 1e-9 && f.v0 >= 0).toBe(true);
    }
  });
});
