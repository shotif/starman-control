import { describe, expect, it } from 'vitest';
import { FACTIONS, type FactionId } from '../../src/content/factions.ts';
import { RULES } from '../../src/content/rules.ts';
import type { SpeciesId } from '../../src/content/species.ts';
import { TECH_IDS, TECHS, type TechId } from '../../src/content/techs.ts';
import { SKY } from '../../src/data/sky.ts';
import { adviceFor } from '../../src/sim/advice.ts';
import { aiOrders, PERSONALITIES } from '../../src/sim/ai.ts';
import { resolveContacts, sharesTongue } from '../../src/sim/contact.ts';
import { deedDone } from '../../src/sim/discoveries.ts';
import type { ReportEvent } from '../../src/sim/report.ts';
import { parseSave, SAVE_FORMAT } from '../../src/sim/save.ts';
import { contactWith, type GameState, inContact, makeHolding, newGame, powerOf } from '../../src/sim/state.ts';
import { resolveTurn } from '../../src/sim/turn.ts';
import { stateProblems } from '../../src/sim/validate.ts';
import { knownView, standings } from '../../src/sim/visibility.ts';
import { buildWorld, laneId } from '../../src/sim/world.ts';

/** Contact between powers (M3_NEIGHBOURS.md §19, D-52). */

const world = buildWorld(SKY);
const three = () =>
  newGame(world, {
    seed: 42,
    powers: [
      { faction: 'sta', controller: 'player' },
      { faction: 'frontier', controller: 'ai' },
      { faction: 'hollow-wake', controller: 'ai' },
    ],
  });
const contacts = (g: GameState) => {
  const events = new Map<FactionId, ReportEvent[]>(g.powers.map((p) => [p.faction, []]));
  resolveContacts(world, g, events);
  return events;
};
const wakeShip = (g: GameState) => g.ships.find((s) => s.owner === 'hollow-wake' && s.type === 'survey');
/** The Wake made another species for a test, so its tongue is not ours (as the aliens' will be, from increment 38). */
const asAliens = <T>(run: () => T): T => {
  const wake = FACTIONS['hollow-wake'] as { species: SpeciesId };
  const was = wake.species;
  wake.species = 'twilight-test' as SpeciesId;
  try {
    return run();
  } finally {
    wake.species = was;
  }
};

describe('contact (§19.1)', () => {
  it('begins unaware: nobody has heard anybody at the start', () => {
    const g = three();
    for (const p of g.powers) expect(p.contacts).toEqual([]);
    expect([...contacts(g).values()].flat()).toEqual([]);
  });

  it('a signal from a ship in sight: humans share a tongue, so they talk at once', () => {
    const g = three();
    const ship = wakeShip(g);
    if (!ship) throw new Error('no Wake survey ship');
    ship.at = 'sol';
    const events = contacts(g);
    expect(contactWith(powerOf(g, 'sta'), 'hollow-wake')).toEqual({
      faction: 'hollow-wake',
      stage: 'talk',
      since: 1,
      words: RULES.contact.wordsToTalk,
    });
    expect(events.get('sta')).toEqual([
      { kind: 'contact', faction: 'hollow-wake', stage: 'talk', first: true, system: 'sol' },
    ]);
    // One-sided: the Wake sees nothing of the Authority's yet.
    expect(inContact(powerOf(g, 'hollow-wake'), 'sta')).toBe(false);
    expect(stateProblems(world, g)).toEqual([]);
  });

  it('a signal from a colony or outpost in a surveyed system, a lane with an end in one, or a great work', () => {
    let g = three();
    powerOf(g, 'sta').surveyed.push('wolf-1061');
    contacts(g);
    expect(inContact(powerOf(g, 'sta'), 'hollow-wake')).toBe(true);

    g = three();
    makeHolding(g, {
      owner: 'frontier',
      kind: 'outpost',
      system: 'barnard',
      body: 'barnard-b',
      capital: false,
      people: 0,
    });
    contacts(g);
    expect(inContact(powerOf(g, 'sta'), 'frontier')).toBe(false);
    powerOf(g, 'sta').surveyed.push('barnard');
    contacts(g);
    expect(inContact(powerOf(g, 'sta'), 'frontier')).toBe(true);

    g = three();
    g.lanes.push({ id: laneId('sol', 'barnard'), owner: 'frontier', status: 'open' });
    contacts(g);
    expect(inContact(powerOf(g, 'sta'), 'frontier')).toBe(true);

    g = three();
    g.holdings.find((h) => h.capital && h.owner === 'hollow-wake')?.projects.push('lanewright-foundry');
    contacts(g);
    expect(inContact(powerOf(g, 'sta'), 'hollow-wake')).toBe(true);
    expect(inContact(powerOf(g, 'sta'), 'frontier')).toBe(false);
  });

  it('another tongue: words, 1 a turn in sight, 1 more with Translation, talk at 20', () => {
    asAliens(() => {
      expect(sharesTongue('sta', 'hollow-wake')).toBe(false);
      expect(sharesTongue('sta', 'frontier')).toBe(true);
      const g = three();
      const ship = wakeShip(g);
      if (!ship) throw new Error('no Wake survey ship');
      ship.at = 'sol';
      let events = contacts(g);
      expect(events.get('sta')).toEqual([
        { kind: 'contact', faction: 'hollow-wake', stage: 'words', first: true, system: 'sol' },
      ]);
      const c = () => contactWith(powerOf(g, 'sta'), 'hollow-wake');
      expect(c()).toMatchObject({ stage: 'words', words: 0 });
      contacts(g);
      expect(c()?.words).toBe(1);
      // Out of sight: nothing, until Translation, which works seen or not.
      ship.at = 'wolf-1061';
      contacts(g);
      expect(c()?.words).toBe(1);
      powerOf(g, 'sta').researched.push('translation');
      contacts(g);
      expect(c()?.words).toBe(2);
      ship.at = 'sol';
      for (let i = 0; i < 8; i++) contacts(g);
      expect(c()).toMatchObject({ stage: 'words', words: 18 });
      events = contacts(g);
      expect(c()).toMatchObject({ stage: 'talk', words: 20 });
      expect(events.get('sta')).toEqual([
        { kind: 'contact', faction: 'hollow-wake', stage: 'talk', first: false, system: null },
      ]);
      expect(stateProblems(world, g)).toEqual([]);
      // Kept once made, seen or not.
      ship.at = 'wolf-1061';
      contacts(g);
      expect(c()?.stage).toBe('talk');
    });
  });

  it('comes in a whole turn: a Wake ship reaches Sol, and the Envoy says so', () => {
    let g = three();
    // The Wake gives no orders this turn, so its ship stays where it is put.
    powerOf(g, 'hollow-wake').controller = 'player';
    const ship = wakeShip(g);
    if (!ship) throw new Error('no Wake survey ship');
    ship.at = 'sol';
    ship.destinations = [];
    const r = resolveTurn(world, g);
    g = r.state;
    const events = r.reports.find((x) => x.faction === 'sta')?.events ?? [];
    expect(events).toContainEqual({
      kind: 'contact',
      faction: 'hollow-wake',
      stage: 'talk',
      first: true,
      system: 'sol',
    });
    const said = adviceFor(world, g, 'sta', events, [], 'speak').find((l) => l.department === 'envoy');
    expect(said?.text).toBe(
      'Control, we have made contact with the Hollow Wake at Sol. They share our tongue, so we may talk.',
    );
    expect(said?.advisor.name).toBe('Isabel Achterberg');
  });
});

describe('what contact changes (§19.2)', () => {
  it('the standings list every power in contact, seen now or not, with its stage', () => {
    const g = three();
    const ship = wakeShip(g);
    if (!ship) throw new Error('no Wake survey ship');
    ship.at = 'sol';
    contacts(g);
    ship.at = 'wolf-1061';
    const rows = standings(knownView(world, g, 'sta'), 'sta');
    expect(rows.map((r) => [r.faction, r.contact])).toEqual([
      ['sta', null],
      ['hollow-wake', { stage: 'talk', words: 20 }],
    ]);
  });

  it('a save from version 11 is in contact with those M2b counted as met, at talk', () => {
    const g = three();
    powerOf(g, 'sta').surveyed.push('wolf-1061');
    const powers = g.powers.map(({ contacts: _, ...p }) => p);
    const raw = {
      format: SAVE_FORMAT,
      version: 1,
      savedAt: '2026-10-21T00:00:00Z',
      game: { ...g, version: 11, powers },
    };
    const loaded = parseSave(world, JSON.stringify(raw));
    expect(powerOf(loaded, 'sta').contacts).toEqual([
      { faction: 'hollow-wake', stage: 'talk', since: 1, words: RULES.contact.wordsToTalk },
    ]);
    expect(powerOf(loaded, 'frontier').contacts).toEqual([]);
  });

  it('refuses a damaged contact: unknown, twice, or talk with words missing', () => {
    const g = three();
    powerOf(g, 'sta').contacts.push({ faction: 'frontier', stage: 'talk', since: 1, words: 3 });
    expect(stateProblems(world, g)).toEqual(["sta's words with frontier do not match its stage"]);
    powerOf(g, 'sta').contacts = [
      { faction: 'sta', stage: 'talk', since: 1, words: 20 },
      { faction: 'frontier', stage: 'words', since: 1, words: 3 },
      { faction: 'frontier', stage: 'words', since: 1, words: 3 },
    ];
    expect(stateProblems(world, g)).toEqual([
      'sta is in contact with sta, which is not another power in play',
      'sta is in contact with frontier twice',
    ]);
  });
});

describe('Translation (§19.4)', () => {
  it('is Xenology’s second tier, inspired by contact with two other powers', () => {
    expect(TECHS.translation).toMatchObject({ field: 'xenology', tier: 2, cost: 60, needs: [] });
    const g = three();
    const deed = TECHS.translation.inspiration.deed;
    expect(deedDone(world, g, 'sta', deed, [])).toBe(false);
    powerOf(g, 'sta').surveyed.push('wolf-1061', 'tau-ceti');
    contacts(g);
    expect(deedDone(world, g, 'sta', deed, [])).toBe(true);
  });

  it('rivals research it only while they learn a tongue', () => {
    const g = three();
    const p = powerOf(g, 'frontier');
    // All learnt but Translation (60) and Great engineering (480): the dear one first, while no
    // tongue is being learnt; Translation first once one is.
    const own = PERSONALITIES.frontier.doctrines as readonly TechId[];
    p.researched = TECH_IDS.filter(
      (id) => id !== 'translation' && id !== 'great-engineering' && (!TECHS[id].fork || own.includes(id)),
    );
    const chosen = () => aiOrders(world, g, 'frontier').find((o) => o.type === 'research');
    expect(chosen()).toEqual({ type: 'research', tech: 'great-engineering' });
    p.contacts.push({ faction: 'hollow-wake', stage: 'words', since: 1, words: 0 });
    expect(chosen()).toEqual({ type: 'research', tech: 'translation' });
  });
});
