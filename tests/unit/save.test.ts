import { describe, expect, it } from 'vitest';
import { SaveStore } from '../../src/app/saves.ts';
import { MemoryBackend } from '../../src/app/storage.ts';
import { SKY } from '../../src/data/sky.ts';
import { envelope, exportSave, parseSave, SAVE_FORMAT, SaveError, saveFileName } from '../../src/sim/save.ts';
import { newGame, STATE_VERSION } from '../../src/sim/state.ts';
import { buildWorld } from '../../src/sim/world.ts';

const world = buildWorld(SKY);
const game = newGame(world, { seed: 777, powers: [{ faction: 'frontier', controller: 'player' }] });
const when = new Date(2026, 9, 19, 18, 30);

describe('save files', () => {
  it('export and import a game unchanged', () => {
    const { name, json } = exportSave(game, when);
    expect(name).toBe('starman-control-2026-10-19.json');
    expect(saveFileName(when, 2)).toBe('starman-control-2026-10-19-slot-2.json');
    expect(parseSave(world, json)).toEqual(game);
    expect(parseSave(world, `﻿${json}`)).toEqual(game);
  });

  it('bring a game saved before colonies (state version 1) up to date', () => {
    // A version 1 game, as increment 4 wrote it: lane stations on the power, no holdings.
    const { holdings: _h, nextHoldingId: _n, ...rest } = structuredClone(game);
    const old = {
      ...rest,
      version: 1,
      powers: game.powers.map((p) => ({ ...p, laneStations: [p.capital] })),
      ships: game.ships.map(({ founding: _f, ...s }) => s),
    };
    const json = JSON.stringify({ format: SAVE_FORMAT, version: 1, savedAt: when.toISOString(), game: old });
    expect(parseSave(world, json)).toEqual(game);
    // A damaged version 1 game is refused with a message, not a crash.
    const broken = JSON.stringify({ format: SAVE_FORMAT, version: 1, game: { ...old, powers: 'gone' } });
    expect(() => parseSave(world, broken)).toThrow(SaveError);
  });

  it('put a capital that stood on no world on its world (D-24), folding in a colony already there', () => {
    // A version 2 game, as increment 5 wrote it: the Cooperative's capital on no world, and a
    // colony of its own on Tau Ceti e, with a ship about to found an outpost there too.
    const v2 = structuredClone(game) as unknown as Record<string, unknown> & typeof game;
    const cap = v2.holdings[0] as (typeof game.holdings)[number];
    v2.version = 2;
    (cap as { body: string | null }).body = null;
    v2.holdings.push({
      ...cap,
      id: 2,
      capital: false,
      body: 'tau-ceti-e',
      people: 15,
      projects: ['mine'],
      queue: [{ kind: 'ship', ship: 'survey' }],
      industry: 7,
    });
    v2.nextHoldingId = 3;
    (v2.ships[3] as { founding: unknown }).founding = { kind: 'outpost', body: 'tau-ceti-e' };
    const json = JSON.stringify({ format: SAVE_FORMAT, version: 1, savedAt: when.toISOString(), game: v2 });
    const g = parseSave(world, json);
    expect(g.version).toBe(STATE_VERSION);
    expect(g.holdings).toHaveLength(1);
    expect(g.holdings[0]).toMatchObject({
      body: 'tau-ceti-e',
      capital: true,
      people: 115,
      projects: ['shipyard', 'lane-station', 'mine'],
      queue: [{ kind: 'ship', ship: 'survey' }],
      industry: 7,
    });
    expect(g.ships[3]?.founding).toBeNull();
  });

  it('are small: far under the 200 KB budget', () => {
    expect(exportSave(game, when).json.length).toBeLessThan(200 * 1024);
  });

  it('refuse what is not a save, with a message for the player', () => {
    expect(() => parseSave(world, 'not json')).toThrow(/could not be read/);
    expect(() => parseSave(world, '{"format":"starman-reborn-save"}')).toThrow(/not a Starman Control save/);
    expect(() => parseSave(world, JSON.stringify({ format: SAVE_FORMAT }))).toThrow(/version is missing/);
    expect(() => parseSave(world, JSON.stringify({ format: SAVE_FORMAT, version: 1 }))).toThrow(/holds no game/);
    expect(() => parseSave(world, 'x'.repeat(3 * 1024 * 1024))).toThrow(/too large/);
  });

  it('refuse a save from a newer game, and say how to fix it', () => {
    const newer = { ...envelope(game, when), version: 99 };
    expect(() => parseSave(world, JSON.stringify(newer))).toThrow(/newer version/);
    const newerGame = { ...envelope(game, when), game: { ...game, version: 99 } };
    expect(() => parseSave(world, JSON.stringify(newerGame))).toThrow(/newer version/);
  });

  it('refuse a damaged game', () => {
    const broken = { ...envelope(game, when), game: { ...game, turn: -1 } };
    expect(() => parseSave(world, JSON.stringify(broken))).toThrow(SaveError);
    const impossible = {
      ...envelope(game, when),
      game: { ...game, lanes: [{ id: 'barnard~sol', owner: 'sta', status: 'open' }] },
    };
    expect(() => parseSave(world, JSON.stringify(impossible))).toThrow(/not in play/);
  });
});

describe('the save store', () => {
  it('keeps the autosave and the one before it as a backup', async () => {
    const backend = new MemoryBackend();
    const store = new SaveStore(backend, world);
    expect(await store.continueGame()).toBeNull();
    await store.autosave(game, when);
    const later = { ...game, turn: 2 };
    await store.autosave(later, when);
    expect((await store.continueGame())?.game.turn).toBe(2);
    // A damaged autosave falls back to the backup.
    backend.data.set('save:auto', { format: SAVE_FORMAT, version: 1, game: { version: 1 } });
    const restored = await store.continueGame();
    expect(restored?.fromBackup).toBe(true);
    expect(restored?.game.turn).toBe(1);
  });

  it('has three slots that list, load and clear', async () => {
    const store = new SaveStore(new MemoryBackend(), world);
    await store.saveSlot(2, game, when);
    const slots = await store.listSlots();
    expect(slots.map((s) => s.empty)).toEqual([true, false, true]);
    expect(slots[1]?.summary).toEqual({ faction: 'frontier', turn: 1, savedAt: when.toISOString() });
    expect(await store.loadSlot(2)).toEqual(game);
    await expect(store.loadSlot(1)).rejects.toThrow(/empty/);
    await store.clearSlot(2);
    expect((await store.listSlots()).every((s) => s.empty)).toBe(true);
    await expect(store.saveSlot(4, game)).rejects.toThrow(RangeError);
  });

  it('lists a damaged slot as damaged rather than failing', async () => {
    const backend = new MemoryBackend();
    backend.data.set('save:slot:1', { format: SAVE_FORMAT, version: 1, game: 'gone' });
    const slots = await new SaveStore(backend, world).listSlots();
    expect(slots[0]).toEqual({ slot: 1, empty: false, summary: null });
  });
});

describe('the save store between turns', () => {
  it('knows whether there is a game, and leaves the backup alone for saves between turns', async () => {
    const backend = new MemoryBackend();
    const store = new SaveStore(backend, world);
    expect(await store.hasGame()).toBe(false);
    await store.autosave(game, when);
    await store.autosave({ ...game, turn: 2 }, when);
    await store.autosave({ ...game, turn: 2, seed: 778 }, when, false);
    expect(await store.hasGame()).toBe(true);
    expect((backend.data.get('save:auto:backup') as { game: { turn: number } }).game.turn).toBe(1);
    await store.clearAutosave();
    expect(await store.hasGame()).toBe(false);
  });
});
