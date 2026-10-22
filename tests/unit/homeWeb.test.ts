import { describe, expect, it } from 'vitest';
import { FACTION_IDS, FACTIONS } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import { SKY } from '../../src/data/sky.ts';
import { homeWebs } from '../../src/sim/homeWeb.ts';
import { buildWorld, laneEnds } from '../../src/sim/world.ts';

const world = buildWorld(SKY);
// The webs of Reborn's old lanes; a capital in the shell grows one of its own (duskfolk.test.ts).
const capitals = FACTION_IDS.map((f) => ({ faction: f, capital: FACTIONS[f].capital.systemId })).filter(
  (c) => world.catalogueAt(c.capital).length > 0,
);
const webs = homeWebs(world, capitals);
const web = (f: string) => webs.find((w) => w.faction === f) as (typeof webs)[number];

describe('home webs (D-19a)', () => {
  it('give every power the same seven systems in reach and six lanes', () => {
    for (const w of webs) {
      expect(w.systems, w.faction).toHaveLength(RULES.homeWeb.systems);
      expect(w.lanes, w.faction).toHaveLength(RULES.homeWeb.systems - 1);
      expect(w.systems[0]).toBe(w.capital);
    }
  });

  it('use only Reborn’s lanes, within two jumps of the capital', () => {
    for (const w of webs) {
      for (const id of w.lanes) expect(world.catalogueLane(...laneEnds(id)), id).toBeDefined();
      for (const s of w.systems) expect(w.jumps.get(s), s).toBeLessThanOrEqual(RULES.homeWeb.jumps);
    }
  });

  it('join every system to the capital (a tree: connected, no loops)', () => {
    for (const w of webs) {
      const reached = new Set([w.capital]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const id of w.lanes) {
          const [a, b] = laneEnds(id);
          if (reached.has(a) !== reached.has(b)) {
            reached.add(reached.has(a) ? b : a);
            grew = true;
          }
        }
      }
      expect([...reached].sort(), w.faction).toEqual([...w.systems].sort());
    }
  });

  it('never overlap, so each power starts in its own pocket', () => {
    const all = webs.flatMap((w) => w.systems);
    expect(new Set(all).size).toBe(all.length);
  });

  it('keep within the beacon slots: three, or five at a capital with its lane station', () => {
    for (const w of webs) {
      const n = new Map<string, number>();
      for (const id of w.lanes) for (const end of laneEnds(id)) n.set(end, (n.get(end) ?? 0) + 1);
      for (const [s, count] of n) {
        const slots = s === w.capital ? RULES.beacons.slotsWithStation : RULES.beacons.slots;
        expect(count, `${w.faction} at ${s}`).toBeLessThanOrEqual(slots);
      }
    }
  });

  it('are Tau Ceti’s whole web, the smallest, and Sol’s and Wolf 1061’s nearest', () => {
    expect([...web('frontier').systems].sort()).toEqual(
      ['epsilon-eridani', 'gj-1', 'lacaille-9352', 'luyten-726-8', 'tau-ceti', 'van-maanens-star', 'yz-ceti'].sort(),
    );
    expect(web('sta').systems).toEqual([
      'sol',
      'alpha-centauri',
      'barnard',
      'wolf-359',
      'sirius',
      'luhman-16',
      'wise-0855-0714',
    ]);
    expect(web('hollow-wake').systems.slice(0, 4)).toEqual([
      'wolf-1061',
      '70-ophiuchi',
      'gaia-dr3-6305165514134625024',
      'ross-154',
    ]);
  });

  it('are the same whichever order the powers are listed in', () => {
    const reversed = homeWebs(world, [...capitals].reverse());
    for (const w of webs) {
      const r = reversed.find((x) => x.faction === w.faction);
      expect(r?.systems).toEqual(w.systems);
      expect(r?.lanes).toEqual(w.lanes);
    }
  });

  it('shrink every web to the smallest when one has less room', () => {
    const small = homeWebs(world, capitals, 1);
    // Within one jump, Tau Ceti has two neighbours: every web is cut to three systems.
    for (const w of small) expect(w.systems, w.faction).toHaveLength(3);
  });
});
