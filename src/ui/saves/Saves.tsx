// The saves screen (M1_PROOF.md §2): the autosave and three slots, each to load, export or clear;
// the game being played saved to a slot; a file imported as the game. The same on a phone and a
// desktop, reached from the title and from the game's menu.

import { useEffect, useRef, useState } from 'preact/hooks';
import { clearSlot, exportFile, game, importFile, listSaves, loadFromSlot, saveToSlot } from '../../app/game.ts';
import type { SaveSummary, SlotInfo } from '../../app/saves.ts';
import { FACTIONS } from '../../content/factions.ts';
import { formatDate } from '../../sim/calendar.ts';
import { SAVE_MAX_BYTES, SaveError } from '../../sim/save.ts';
import { goBack } from '../settings/SettingsScreen.tsx';
import '../page.css';

function describe(s: SaveSummary): string {
  const who = s.faction ? FACTIONS[s.faction].name : 'No power';
  const when = s.savedAt
    ? new Date(s.savedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : '';
  return `${who} · ${formatDate(s.turn)}${when ? ` · saved ${when}` : ''}`;
}

/** Hands a file to the player: the share sheet where there is one (phones), else a download. */
async function deliver(name: string, json: string): Promise<void> {
  const file = new File([json], name, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return;
    } catch {
      // Cancelled, or refused: download instead.
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function Saves() {
  const [list, setList] = useState<{ auto: SaveSummary | null; slots: SlotInfo[] } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const playing = game.value !== null;
  const refresh = () => void listSaves().then(setList);
  useEffect(refresh, []);

  const act = async (what: () => Promise<void>, done: string) => {
    try {
      await what();
      setNote(done);
      refresh();
    } catch (err) {
      setNote(err instanceof SaveError ? err.message : 'That did not work. Try again.');
    }
  };
  const toGame = () => {
    location.hash = '#/game';
  };

  return (
    <main class="page saves-page">
      <button type="button" class="back" onClick={goBack}>
        ← Back
      </button>
      <h1>Saves</h1>
      {note && (
        <p class="save-note" role="status">
          {note}
        </p>
      )}
      {!list ? (
        <p class="dim">Reading the saves…</p>
      ) : (
        <>
          <section class="page-section save-row" aria-label="Autosave">
            <header>
              <h2>Autosave</h2>
              <span class="save-what">{list.auto ? describe(list.auto) : 'No game yet'}</span>
            </header>
            <p>Saved after every turn and every order, with the one before kept in case.</p>
            <div class="save-actions">
              {list.auto && (
                <button type="button" class="button button-primary button-small" onClick={toGame}>
                  {playing ? 'Back to the game' : 'Continue'}
                </button>
              )}
              {list.auto && (
                <button
                  type="button"
                  class="button button-small"
                  onClick={() =>
                    void act(async () => {
                      const f = await exportFile(null);
                      if (f) await deliver(f.name, f.json);
                    }, 'Exported.')
                  }
                >
                  Export
                </button>
              )}
            </div>
          </section>
          {list.slots.map((s) => (
            <section key={s.slot} class="page-section save-row" aria-label={`Slot ${s.slot}`}>
              <header>
                <h2>Slot {s.slot}</h2>
                <span class="save-what">{s.summary ? describe(s.summary) : s.empty ? 'Empty' : 'Damaged'}</span>
              </header>
              <div class="save-actions">
                {playing && (
                  <button
                    type="button"
                    class="button button-small"
                    onClick={() => void act(() => saveToSlot(s.slot), `Saved to slot ${s.slot}.`)}
                  >
                    Save here
                  </button>
                )}
                {s.summary && (
                  <button
                    type="button"
                    class="button button-primary button-small"
                    onClick={() =>
                      void act(async () => {
                        await loadFromSlot(s.slot);
                        toGame();
                      }, `Loaded slot ${s.slot}.`)
                    }
                  >
                    Load
                  </button>
                )}
                {s.summary && (
                  <button
                    type="button"
                    class="button button-small"
                    onClick={() =>
                      void act(async () => {
                        const f = await exportFile(s.slot);
                        if (f) await deliver(f.name, f.json);
                      }, 'Exported.')
                    }
                  >
                    Export
                  </button>
                )}
                {!s.empty && (
                  <button
                    type="button"
                    class="button button-quiet button-small"
                    onClick={() => void act(() => clearSlot(s.slot), `Slot ${s.slot} is empty now.`)}
                  >
                    Clear
                  </button>
                )}
              </div>
            </section>
          ))}
          <section class="page-section save-row" aria-label="Import">
            <header>
              <h2>Import</h2>
            </header>
            <p>Open a save exported from Starman Control on this or another device. It becomes the game you play.</p>
            <div class="save-actions">
              <button type="button" class="button button-small" onClick={() => picker.current?.click()}>
                Choose a file
              </button>
              <input
                ref={picker}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={(e) => {
                  const input = e.currentTarget as HTMLInputElement;
                  const file = input.files?.[0];
                  input.value = '';
                  if (!file) return;
                  if (file.size > SAVE_MAX_BYTES) {
                    setNote('This file is too large to be a Starman Control save.');
                    return;
                  }
                  void act(async () => {
                    await importFile(await file.text());
                    toGame();
                  }, 'Imported.');
                }}
              />
            </div>
          </section>
        </>
      )}
    </main>
  );
}
