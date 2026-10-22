import { describe, expect, it } from 'vitest';
import manifest from '../../art/manifest.json' with { type: 'json' };
import {
  boxOf,
  clearOf,
  LANDSCAPES,
  OWN_PROPS,
  PROP_METRES,
  PROPS,
  type PropKind,
  propArt,
  propId,
  propSpots,
  STRUCTURES,
  structureArt,
  structureId,
} from '../../src/content/colonyArt.ts';
import { FACTIONS, type FactionId, PLAYABLE_IDS } from '../../src/content/factions.ts';
import { PROJECT_IDS } from '../../src/content/projects.ts';
import { SKY } from '../../src/data/sky.ts';
import { frameTown, placeAll, placeBuilding, placeProps } from '../../src/render/colonyPlace.ts';
import {
  biomeOf,
  colonyScene,
  districtKind,
  homeSize,
  homeVersions,
  mixHex,
  propsFor,
} from '../../src/render/colonyScene.ts';
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

describe('homes and districts', () => {
  it('grow in size with the people: houses, then blocks from 3 million, towers from 15', () => {
    expect([5, 29, 30, 149, 150, 200].map(homeSize)).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it('show each district as its zone’s building: fields in the open air, farms under glass in domes', () => {
    expect(districtKind('farms', 'open')).toBe('fields');
    expect(districtKind('farms', 'domed')).toBe('greenhouse-farms');
    expect(districtKind('mines', 'open')).toBe('mine');
    expect(districtKind('housing', 'domed')).toBe('homes');
    for (const z of ['works', 'labs', 'market'] as const) expect(districtKind(z, 'open')).toBe(z);
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
    // The hall in the middle, its ten districts round it, then its projects (M2_WORLDS.md §15).
    expect(s?.slots).toBe(13);
    expect(s?.buildings.map((b) => [b.kind, b.slot])).toEqual([
      ['hall', 0],
      ['homes', 1],
      ['homes', 2],
      ['greenhouse-farms', 3],
      ['greenhouse-farms', 4],
      ['works', 5],
      ['works', 6],
      ['works', 7],
      ['mine', 8],
      ['labs', 9],
      ['market', 10],
      ['shipyard', 11],
      ['lane-station', 12],
    ]);
    expect(s?.description).toBe(
      'Tau Ceti e: a domed city of about 10 million under a yellow sun, with 2 farms, 3 works, a mine, a lab, a market, a shipyard and a lane station.',
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
    // After the hall, ten districts and two projects.
    expect(scaffold).toEqual({ kind: 'scaffold', project: 'mine', slot: 13, progress: 0.5 });
    expect(s?.description).toMatch(/; a deep mine is being built\.$/);
    // When it is finished, the deep mine stands in the scaffold's slot.
    h.queue = [];
    h.projects = [...h.projects, 'mine'];
    expect(colonyScene(world, g, h)?.buildings.find((b) => b.project === 'mine')?.slot).toBe(13);
  });

  it('puts a scaffold where a district is being zoned, in place of what stood there', () => {
    const g = start('sta', 42);
    const h = capital(g, 'sta');
    h.queue = [{ kind: 'zone', zone: 'labs', slot: 5 }];
    h.industry = 5;
    const s = colonyScene(world, g, h);
    expect(s?.buildings.filter((b) => b.slot === 5)).toEqual([
      { kind: 'scaffold', district: 'labs', slot: 5, progress: 0.25 },
    ]);
    expect(s?.description).toMatch(/; a district is being zoned for labs\.$/);
  });

  it('lays Earth out in the open air, under a dense sky, its farms as fields', () => {
    const g = start('sta', 42);
    const s = colonyScene(world, g, capital(g, 'sta'));
    expect(s?.biome).toBe('garden');
    expect(s?.envelope).toBe('open');
    expect(s?.buildings.filter((b) => b.district === 'farms').map((b) => [b.kind, b.slot])).toEqual([
      ['fields', 3],
      ['fields', 4],
    ]);
    // A colony's first homes stand in the middle, its housing districts' round it.
    const colony = { ...capital(g, 'sta'), id: 7, capital: false, districts: [{ zone: 'housing' as const, slot: 2 }] };
    expect(
      colonyScene(world, g, colony)
        ?.buildings.filter((b) => b.kind === 'homes')
        .map((b) => b.slot),
    ).toEqual([0, 2]);
    expect(s?.sky.starsByDay).toBe(false);
    expect(s?.sun.size).toBeCloseTo(1, 1);
  });

  it('never assumes the power: each capital is drawn in its owner’s architecture', () => {
    for (const f of PLAYABLE_IDS) {
      const g = start(f, 42);
      expect(colonyScene(world, g, capital(g, f))?.architecture).toBe(FACTIONS[f].architecture);
    }
  });

  it('gives an outpost no homes and no people', () => {
    const g = start('hollow-wake', 42);
    const h = {
      ...capital(g, 'hollow-wake'),
      kind: 'outpost' as const,
      capital: false,
      people: 0,
      projects: [],
      districts: [],
    };
    const s = colonyScene(world, g, h);
    expect(s?.buildings).toEqual([{ kind: 'rig', slot: 0 }]);
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
    for (const art of Object.values(PROPS)) {
      const e = approved.get(art.id);
      expect(e?.series, art.id).toBe('prop');
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
    for (const f of PLAYABLE_IDS) {
      const a = FACTIONS[f].architecture;
      for (const size of [1, 2, 3] as const)
        for (const envelope of ['open', 'domed'] as const)
          expect(structureArt(a, 'homes', { size, envelope }), `${a} ${size} ${envelope}`).toBeDefined();
      for (const p of PROJECT_IDS) expect(structureArt(a, p), `${a} ${p}`).toBeDefined();
      expect(structureArt(a, 'scaffold')?.id).toBe('scaffold');
      expect(structureArt(a, 'fields')?.id).toBe('fields');
      expect(structureArt(a, 'hall')?.id).toBe(`${a}-hall`);
      expect(structureArt(a, 'rig')?.id).toBe(`${a}-rig`);
      for (const z of ['works', 'labs', 'market'] as const) expect(structureArt(a, z)?.id).toBe(`${a}-${z}`);
      expect(structureArt(a, 'greenhouse-farms')?.id).toBe('greenhouse-farms');
    }
    expect(structureId('wake', 'homes', { size: 3, envelope: 'domed' })).toBe('wake-homes-3-domed');
    expect(structureId('wake', 'homes', { size: 3, envelope: 'domed', version: 2 })).toBe('wake-homes-3-domed-c');
    expect(propId('cooperative', 'mast')).toBe('cooperative-mast');
    expect(propId('cooperative', 'solar-field')).toBe('solar-field');
  });

  it('show a home’s first version while another version has no picture yet', () => {
    const missing = 'authority-homes-1-open-c';
    const kept = STRUCTURES[missing];
    delete STRUCTURES[missing];
    try {
      expect(structureArt('authority', 'homes', { size: 1, envelope: 'open', version: 2 })?.id).toBe(
        'authority-homes-1-open',
      );
    } finally {
      if (kept) STRUCTURES[missing] = kept;
    }
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
    // And a district's scaffold to the district's building.
    const zoning = placeBuilding(scene, land, { kind: 'scaffold', district: 'market', slot: 4 });
    const market = placeBuilding(scene, land, { kind: 'market', district: 'market', slot: 4 });
    expect(zoning && market && zoning.w / market.w).toBeCloseTo(0.7, 5);
  });

  it('stands projects past the twelfth slot in a ring round the town', () => {
    const ring = placeBuilding(scene, land, { kind: 'mine', project: 'mine', slot: 13 });
    expect(ring).not.toBeNull();
    expect(ring && ring.u > 0 && ring.u < 1 && ring.v > land.horizon).toBe(true);
    expect(placeBuilding(scene, land, { kind: 'mine', project: 'mine', slot: 40 })).toBeNull();
  });

  it('frames the town inside the picture at any shape', () => {
    for (const aspect of [0.6, 1, 2, 3]) {
      const f = frameTown(placeAll(scene, land), land, aspect);
      expect(f.u0 >= 0 && f.u0 + f.uw <= 1 + 1e-9 && f.v0 >= 0).toBe(true);
    }
  });
});

describe('three versions of every home (COLONY_VIEW.md §9.2)', () => {
  const land = LANDSCAPES.garden;
  const homeSlots = [0, 2, 4, 6, 8, 10].map((i) => land.slots[i] as readonly [number, number]);

  it('never gives a home the version of either of its two nearest neighbours', () => {
    for (let id = 0; id < 30; id++) {
      const v = homeVersions(id, homeSlots, land.aspect);
      homeSlots.forEach(([u, y], k) => {
        const near = homeSlots
          .slice(0, k)
          .map(([u2, y2], j) => ({ j, d: Math.hypot((u - u2) * land.aspect, y - y2) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 2);
        for (const { j } of near) expect(v[k], `colony ${id}, home ${k}`).not.toBe(v[j]);
      });
    }
  });

  it('keeps every home’s version as the town grows', () => {
    for (let n = 1; n < homeSlots.length; n++)
      expect(homeVersions(7, homeSlots.slice(0, n), land.aspect)).toEqual(
        homeVersions(7, homeSlots, land.aspect).slice(0, n),
      );
  });

  it('differs from colony to colony', () => {
    const firsts = new Set([0, 1, 2].map((id) => homeVersions(id, homeSlots, land.aspect)[0]));
    expect(firsts.size).toBe(3);
  });

  it('is part of every home in a scene', () => {
    const g = start('sta', 42);
    const s = colonyScene(world, g, {
      ...capital(g, 'sta'),
      people: 160,
      districts: [1, 2, 3, 4].map((slot) => ({ zone: 'housing' as const, slot })),
    });
    const homes = s?.buildings.filter((b) => b.kind === 'homes') ?? [];
    expect(homes.length).toBeGreaterThan(2);
    expect(new Set(homes.map((b) => b.home?.version)).size).toBeGreaterThan(1);
  });
});

describe('props between the buildings (COLONY_VIEW.md §9.3)', () => {
  const earth = body('sol', 'earth');
  const moon = body('sol', 'moon');
  const holding = { id: 4, kind: 'colony' as const, capital: false, people: 60 };

  it('suit the colony: a monument only at a capital, first', () => {
    expect(propsFor({ ...holding, capital: true }, earth, 'garden', 'open')[0]).toBe('monument');
    expect(propsFor(holding, earth, 'garden', 'open')).not.toContain('monument');
  });

  it('suit the ground and the envelope', () => {
    const all = (b: typeof earth, biome: Parameters<typeof propsFor>[2], e: 'open' | 'domed') =>
      propsFor({ ...holding, people: 400 }, b, biome, e);
    expect(all(earth, 'garden', 'open')).toEqual(expect.arrayContaining(['orchard', 'wind-turbines']));
    expect(all(earth, 'garden', 'open')).not.toContain('greenhouse');
    expect(all(moon, 'airless', 'domed')).toEqual(expect.arrayContaining(['greenhouse', 'radiators']));
    expect(all(moon, 'airless', 'domed')).not.toContain('wind-turbines');
    expect(all(moon, 'airless', 'domed')).not.toContain('orchard');
    expect(all({ ...moon, atmosphere: 'toxic' }, 'haze', 'domed')).not.toContain('solar-field');
    expect(all({ ...moon, riches: { metals: 2, volatiles: 2, fuel: 2 } }, 'airless', 'domed')).toEqual(
      expect.arrayContaining(['ore-heap', 'gas-well', 'regolith-plant']),
    );
  });

  it('grow in number with the people; an outpost has three, and no homely ones', () => {
    expect(propsFor({ ...holding, people: 10 }, earth, 'garden', 'open')).toHaveLength(2);
    expect(propsFor({ ...holding, people: 60 }, earth, 'garden', 'open')).toHaveLength(5);
    const outpost = propsFor({ ...holding, kind: 'outpost', people: 0 }, moon, 'airless', 'domed');
    expect(outpost).toHaveLength(3);
    for (const k of outpost) expect(['landing-beacon', 'supply-crates', 'solar-field', 'radiators']).toContain(k);
  });

  it('keep the props a colony has as it grows, adding new ones after them', () => {
    const small = propsFor({ ...holding, people: 30 }, earth, 'garden', 'open');
    const big = propsFor({ ...holding, people: 90 }, earth, 'garden', 'open');
    expect(big.slice(0, small.length)).toEqual(small);
  });

  it('have spots on every ground, never in a slot', () => {
    for (const land of Object.values(LANDSCAPES)) {
      const spots = propSpots(land);
      expect(spots.length, land.id).toBeGreaterThanOrEqual(12);
      for (const [u, v] of spots) {
        expect(v > land.horizon && v < 1).toBe(true);
        for (const [su, sv] of land.slots) expect(Math.hypot((u - su) * land.aspect, v - sv)).toBeGreaterThan(0.02);
      }
    }
  });

  it('never cover a building or each other, in every power’s capital', () => {
    // Every prop with a stand-in picture, so the test does not wait on the art.
    const added: string[] = [];
    for (const a of ['authority', 'cooperative', 'wake'] as const)
      for (const k of Object.keys(PROP_METRES) as PropKind[]) {
        const id = OWN_PROPS.includes(k) ? `${a}-${k}` : k;
        if (!PROPS[id]) {
          PROPS[id] = { id, aspect: k === 'mast' ? 0.45 : 1.3, metres: PROP_METRES[k] };
          added.push(id);
        }
      }
    try {
      for (const f of PLAYABLE_IDS)
        for (const people of [30, 100, 200]) {
          const g = start(f, 1);
          const s = colonyScene(world, g, { ...capital(g, f), people });
          if (!s) throw new Error('no scene');
          const land = LANDSCAPES[s.biome];
          const placed = placeAll(s, land);
          const props = placeProps(s, land, placed);
          expect(props.length, `${f} ${people}`).toBeGreaterThanOrEqual(2);
          for (const p of props) {
            const me = boxOf(p, land.aspect);
            for (const b of placed)
              expect(clearOf(me, boxOf(b, land.aspect)), `${p.prop.kind} by ${b.building.kind}`).toBe(true);
            for (const q of props)
              if (q !== p)
                expect(
                  boxOf(q, land.aspect).x1 <= me.x0 ||
                    boxOf(q, land.aspect).x0 >= me.x1 ||
                    boxOf(q, land.aspect).y1 <= me.y0 ||
                    boxOf(q, land.aspect).y0 >= me.y1,
                ).toBe(true);
          }
          expect(placeProps(s, land, placed)).toEqual(props);
          expect(props.every((p) => propArt(s.architecture, p.prop.kind) === p.art)).toBe(true);
        }
    } finally {
      for (const id of added) delete PROPS[id];
    }
  });
});
