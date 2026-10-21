import { describe, expect, it } from 'vitest';
import { SKY } from '../../src/data/sky.ts';
import { colonyScene } from '../../src/render/colonyScene.ts';
import { newGame } from '../../src/sim/state.ts';
import { buildWorld } from '../../src/sim/world.ts';
import { buildingCard } from '../../src/ui/map/ColonyCard.tsx';

const world = buildWorld(SKY);

describe('a building’s card', () => {
  const game = newGame(world, { seed: 1, powers: [{ faction: 'frontier', controller: 'player' }] });
  const h = game.holdings[0];
  if (!h) throw new Error('no capital');

  it('says how many live in the homes, and why they are sealed', () => {
    const home = colonyScene(world, game, h)?.buildings.find((b) => b.kind === 'homes');
    if (!home) throw new Error('no homes');
    expect(buildingCard(world, game, h, home, 3)).toEqual({
      title: 'Homes, sealed',
      lines: [
        '10 million people live in the colony’s 3 homes.',
        'Sealed against the world outside: its air cannot be breathed as it is.',
        'District 1, zoned for housing: room for 2 million more.',
      ],
    });
  });

  it('says what a district yields and whether it is worked, and how far its zoning has got', () => {
    const scene = colonyScene(world, game, h);
    const at = (slot: number) => scene?.buildings.find((b) => b.slot === slot);
    const farms = at(3);
    const works = at(5);
    if (!farms || !works) throw new Error('no districts');
    expect(buildingCard(world, game, h, farms, 3)).toEqual({
      title: 'Farms under glass',
      lines: ['District 3: 3 food a turn when worked.', 'A million people work it.'],
    });
    expect(buildingCard(world, game, h, works, 3).title).toBe('Works');
    const zoning = { kind: 'scaffold' as const, district: 'labs' as const, slot: 5 };
    const q = h.queue;
    h.queue = [{ kind: 'zone', zone: 'labs', slot: 5 }];
    try {
      expect(buildingCard(world, game, h, zoning, 3)).toEqual({
        title: 'Zoning district 5 for labs',
        lines: ['0 of 20 industry, ready in about 2 turns.', '2 research.'],
      });
    } finally {
      h.queue = q;
    }
  });

  it('says what a project does, and what the shipyard is building', () => {
    expect(buildingCard(world, game, h, { kind: 'lane-station', project: 'lane-station', slot: 3 }, 3)).toEqual({
      title: 'Lane station',
      lines: ['Five beacon slots here instead of three.'],
    });
    const yard = { kind: 'shipyard' as const, project: 'shipyard' as const, slot: 1 };
    expect(buildingCard(world, game, h, yard, 3).lines).toContain('No ship is being built.');
    h.queue = [{ kind: 'ship', ship: 'survey' }];
    h.industry = 12;
    expect(buildingCard(world, game, h, yard, 3).lines[1]).toBe(
      'Building a survey ship: 12 of 30 industry, ready in about 2 turns.',
    );
  });

  it('says how far a scaffold has got', () => {
    h.queue = [{ kind: 'project', project: 'mine' }];
    h.industry = 6;
    const scaffold = colonyScene(world, game, h)?.buildings.find((b) => b.kind === 'scaffold');
    if (!scaffold) throw new Error('no scaffold');
    expect(buildingCard(world, game, h, scaffold, 3)).toEqual({
      title: 'Building a deep mine',
      lines: ['6 of 30 industry, ready in about 3 turns.', 'Each mine district here yields 1 more.'],
    });
  });
});
