import { describe, expect, it } from 'vitest';
import type { FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { mapContent } from '../../src/render/mapModel.ts';
import { costOf, industryOf } from '../../src/sim/economy.ts';
import { laneQuote, laneReachDeci, laneRefusal, laneTargets, slotsUsed } from '../../src/sim/lanes.ts';
import { findRoute } from '../../src/sim/movement.ts';
import { applyOrder, type Order, refuse } from '../../src/sim/orders.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { exportSave, parseSave } from '../../src/sim/save.ts';
import { type GameState, type Holding, makeHolding, newGame } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { shapeProblems, stateProblems } from '../../src/sim/validate.ts';
import { buildWorld, laneId } from '../../src/sim/world.ts';

const world = buildWorld(SKY);
const start = (faction: FactionId) => newGame(world, { seed: 42, powers: [{ faction, controller: 'player' }] });
const order = (state: GameState, faction: FactionId, o: Order) => {
  const r = applyOrder(world, state, faction, o);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
};
const turns = (state: GameState, n: number) => {
  let s = state;
  const events: ReportEvent[] = [];
  for (let i = 0; i < n; i++) {
    const r = resolveTurn(world, s);
    s = r.state;
    events.push(...(r.reports[0]?.events ?? []));
    expect([...shapeProblems(s), ...stateProblems(world, s)]).toEqual([]);
  }
  return { state: s, events };
};
/** The Authority, with an outpost on Wolf 359 c to build lanes from. */
function withOutpost(): { g: GameState; outpost: Holding } {
  const g = start('sta');
  const outpost = makeHolding(g, {
    owner: 'sta',
    kind: 'outpost',
    system: 'wolf-359',
    body: 'wolf-359-c',
    capital: false,
    people: 0,
  });
  return { g, outpost };
}

describe('what a lane costs', () => {
  it('is 20 industry and 6 a light-year, 1 metal and 2 fusion fuel a light-year, tuned 1 turn and 1 for every 3 ly', () => {
    // Sirius to Ross 614, 5.5 ly, is not one of Reborn's lanes: a new lane.
    expect(laneQuote(world, start('sta'), 'sta', 'sirius', 'ross-614')).toEqual({
      from: 'sirius',
      to: 'ross-614',
      lengthDeci: 55,
      relight: false,
      cost: { industry: 53, metals: 6, volatiles: 0, fuel: 11 },
      turns: 3,
    });
  });

  it('is half, rounded up, to relight one of Reborn’s dark lanes', () => {
    // Wolf 359 to Ross 128, 3.9 ly: new it would be 44 industry, 4 metals, 8 fuel and 3 turns.
    expect(laneQuote(world, start('sta'), 'sta', 'wolf-359', 'ross-128')).toMatchObject({
      relight: true,
      cost: { industry: 22, metals: 2, volatiles: 0, fuel: 4 },
      turns: 2,
    });
  });
});

describe('where a lane can go', () => {
  it('reaches 6 ly for a new lane, and any dark lane whatever its length', () => {
    const g = start('sta');
    expect(laneReachDeci(g, 'sta')).toBe(RULES.lanes.reachDeci);
    const far = world.systems.find(
      (s) =>
        world.distanceDeci('sirius', s.id) > 60 &&
        world.distanceDeci('sirius', s.id) <= 80 &&
        !world.catalogueLane('sirius', s.id),
    );
    if (!far) throw new Error('no star just out of reach of Sirius');
    expect(laneRefusal(world, g, 'sta', 'sirius', far.id)).toMatch(
      /^Out of reach: \d+\.\d ly, and your lane reach is 6\.0 ly\.$/,
    );
    // Epsilon Eridani is 7.9 ly from Sirius, but Reborn had a lane there: it can be relit.
    expect(laneRefusal(world, g, 'sta', 'sirius', 'epsilon-eridani')).toBeNull();
    const targets = laneTargets(world, g, 'sta', 'sirius').map((t) => t.quote.to);
    expect(targets).toContain('epsilon-eridani');
    expect(targets).toContain('ross-614');
    expect(targets).not.toContain('sol'); // already open
  });

  it('needs a free beacon slot at both ends, counting lanes open, being tuned and queued', () => {
    const coop = start('frontier');
    expect(slotsUsed(coop, 'luyten-726-8')).toBe(3);
    expect(laneRefusal(world, coop, 'frontier', 'luyten-726-8', 'yz-ceti')).toBe(
      'No free beacon slot at Luyten 726-8: its 3 are in use.',
    );
    const { g, outpost } = withOutpost();
    // Wolf 359 has 2 of its 3 slots in use: one queued lane fills it.
    const q = order(g, 'sta', { type: 'queue', holding: outpost.id, item: { kind: 'lane', to: 'ross-128' } });
    expect(slotsUsed(q, 'wolf-359')).toBe(3);
    expect(
      refuse(world, q, 'sta', { type: 'queue', holding: outpost.id, item: { kind: 'lane', to: 'ross-128' } }),
    ).toBe('A lane to Ross 128 is already queued.');
    expect(
      refuse(world, q, 'sta', { type: 'queue', holding: outpost.id, item: { kind: 'lane', to: 'lalande-21185' } }),
    ).toBe('No free beacon slot at Wolf 359: its 3 are in use.');
  });

  it('refuses a lane already open, and to nowhere', () => {
    const g = start('sta');
    expect(laneRefusal(world, g, 'sta', 'sol', 'barnard')).toBe('A lane to Barnard’s Star is already open.');
    expect(laneRefusal(world, g, 'sta', 'sol', 'sol')).toBe('A lane needs two stars.');
    expect(laneRefusal(world, g, 'sta', 'sol', 'nowhere')).toBe('There is no such system.');
  });
});

describe('building a lane', () => {
  it('is paid from an outpost’s own 2 industry, tuned, then opened, and ships use it only then', () => {
    let { g, outpost } = withOutpost();
    expect(industryOf(world, g, outpost).total).toBe(RULES.outposts.industry);
    // Outposts queue lanes only.
    expect(
      refuse(world, g, 'sta', { type: 'queue', holding: outpost.id, item: { kind: 'ship', ship: 'survey' } }),
    ).toBe('Outposts build only lanes.');
    g = order(g, 'sta', { type: 'queue', holding: outpost.id, item: { kind: 'lane', to: 'ross-128' } });
    expect(costOf(world, g, outpost, { kind: 'lane', to: 'ross-128' }).industry).toBe(22);
    const before = g.powers[0]?.stockpile.fuel ?? 0;
    // 22 industry at 2 a turn: paid in the eleventh turn.
    let r = turns(g, 10);
    expect(r.state.lanes.some((l) => l.id === laneId('wolf-359', 'ross-128'))).toBe(false);
    r = turns(r.state, 1);
    const id = laneId('wolf-359', 'ross-128');
    expect(r.state.lanes.find((l) => l.id === id)).toEqual({ id, owner: 'sta', status: 'building', left: 2 });
    expect(r.events).toContainEqual({
      kind: 'lane-begun',
      holding: outpost.id,
      to: 'ross-128',
      relight: true,
      turns: 2,
    });
    expect(r.state.powers[0]?.stockpile.fuel).toBe(before + 11 * 1 - 4); // the capital's +1 a turn, less the lane's 4
    // Being tuned, it carries no ships yet.
    expect(findRoute(world, r.state, 'sta', 'sol', 'ross-128')).toBeNull();
    r = turns(r.state, 1);
    expect(r.state.lanes.find((l) => l.id === id)).toMatchObject({ status: 'building', left: 1 });
    r = turns(r.state, 1);
    expect(r.state.lanes.find((l) => l.id === id)).toEqual({ id, owner: 'sta', status: 'open' });
    expect(r.events).toContainEqual({ kind: 'lane-opened', lane: id });
    expect(findRoute(world, r.state, 'sta', 'sol', 'ross-128')?.map((h) => h.to)).toEqual(['wolf-359', 'ross-128']);
    // The map draws it as open now; it was one of Reborn's lanes, so it is not drawn twice.
    const lanes = mapContent(world, r.state).lanes.filter((l) => l.id === id);
    expect(lanes).toEqual([{ id, a: 'ross-128', b: 'wolf-359', owner: 'sta', status: 'open' }]);
    // And it survives a save.
    expect(parseSave(world, exportSave(r.state).json)).toEqual(r.state);
  });

  it('builds a new lane from a colony, drawn dotted while it is tuned', () => {
    let g = start('frontier');
    const capital = g.holdings[0] as Holding;
    g = order(g, 'frontier', { type: 'queue', holding: capital.id, item: { kind: 'lane', to: 'epsilon-eridani' } });
    // 53 industry at 12 a turn: paid in the fifth turn, tuned for 3.
    const r = turns(g, 5);
    const id = laneId('tau-ceti', 'epsilon-eridani');
    expect(r.state.lanes.find((l) => l.id === id)).toMatchObject({ status: 'building', left: 3 });
    expect(mapContent(world, r.state).lanes.find((l) => l.id === id)).toMatchObject({
      owner: 'frontier',
      status: 'building',
    });
    const open = turns(r.state, 3).state;
    expect(open.lanes.find((l) => l.id === id)?.status).toBe('open');
    expect(findRoute(world, open, 'frontier', 'tau-ceti', 'epsilon-eridani')).toHaveLength(1);
  });

  it('drops a queued lane whose place was taken before it was paid for, and says why', () => {
    let { g, outpost } = withOutpost();
    g = order(g, 'sta', { type: 'queue', holding: outpost.id, item: { kind: 'lane', to: 'ross-128' } });
    // Another lane takes Wolf 359's last slot before this one is paid for.
    g.lanes.push({ id: laneId('wolf-359', 'lalande-21185'), owner: 'sta', status: 'open' });
    g.lanes.sort((a, b) => (a.id < b.id ? -1 : 1));
    const r = turns(g, 1);
    expect(r.state.holdings.find((h) => h.id === outpost.id)?.queue).toEqual([]);
    expect(r.events).toContainEqual({
      kind: 'lane-refused',
      holding: outpost.id,
      to: 'ross-128',
      reason: 'No free beacon slot at Wolf 359: its 3 are in use.',
    });
  });
});
