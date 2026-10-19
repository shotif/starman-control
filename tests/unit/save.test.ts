import { describe, expect, it } from 'vitest';
import { SaveStore } from '../../src/app/saves.ts';
import { MemoryBackend } from '../../src/app/storage.ts';
import { SKY } from '../../src/data/sky.ts';
import { envelope, exportSave, parseSave, SAVE_FORMAT, SaveError, saveFileName } from '../../src/sim/save.ts';
import { newGame } from '../../src/sim/state.ts';
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
