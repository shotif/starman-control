// The voices (docs/design/VOICES.md §5, D-102): the advisors and commanders of the power being led,
// spoken from clips made at build time. One line at a time (a new one stops the old); nothing before
// the first press; the music steps back while a voice speaks; the page hidden stops it; nothing is
// downloaded with voices off, and only the led power's clips ever are. A clip is fetched whole when
// first spoken, so the service worker keeps it for offline play. In test runs (`?test`) voices speak
// only when the address asks (`?test&voices`) or they are turned on during the visit.

import { signal } from '@preact/signals';
import type { FactionId } from '../content/factions.ts';
import { clipPath, VOICED_FACTIONS, type VoicedFaction } from '../content/voices.ts';
import { duckMusic, silence } from './music.ts';
import { settings } from './settings.ts';

/** What the voices are doing, for the test hook. */
export const voiceState = signal<{ clip: string | null; speaking: boolean }>({ clip: null, speaking: false });

const query = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
let testAllowed = !query.has('test') || query.has('voices');
let lastVoices = settings.value.voices;
/** Clips asked for, in order, for the test hook. */
const requested: string[] = [];

let audio: HTMLAudioElement | null = null;
let url: string | null = null;
let queue: string[] = [];
let generation = 0;
/** The last report spoken, so reopening it does not speak it again. */
let spokenReport = '';

function allowed(): boolean {
  if (settings.value.voices !== lastVoices) {
    lastVoices = settings.value.voices;
    testAllowed = true;
  }
  return settings.value.voices === 'on' && settings.value.advisors !== 'off' && testAllowed;
}

const voiced = (f: FactionId): f is VoicedFaction => (VOICED_FACTIONS as readonly string[]).includes(f);

/** Whether this power's people can speak now: its voices exist, and the settings let them. */
export function canSpeak(faction: FactionId): boolean {
  return voiced(faction) && allowed();
}

/** Whether the page is inside a press now (the browser lets audio start only then). */
function pressing(): boolean {
  return (navigator as { userActivation?: { isActive: boolean } }).userActivation?.isActive === true;
}

/** Made at the first press: one element, unlocked by playing a moment of silence. */
function unlock(): void {
  if (audio || typeof window === 'undefined') return;
  audio = new Audio();
  audio.preload = 'auto';
  audio.src = silence();
  void audio.play().catch(() => undefined);
  audio.addEventListener('ended', () => {
    if (!voiceState.value.speaking) return;
    void next(generation);
  });
}

function release(): void {
  if (url) URL.revokeObjectURL(url);
  url = null;
}

function quiet(): void {
  duckMusic(false);
  voiceState.value = { clip: null, speaking: false };
}

async function next(mine: number): Promise<void> {
  release();
  const path = queue.shift();
  if (!path || !audio) {
    quiet();
    return;
  }
  requested.push(path);
  let blob: Blob;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}${path}`);
    if (!res.ok) throw new Error(String(res.status));
    blob = await res.blob();
  } catch {
    // Offline before it was ever heard, or not made: skip it.
    if (mine === generation) void next(mine);
    return;
  }
  if (mine !== generation || !allowed()) return;
  url = URL.createObjectURL(blob);
  audio.src = url;
  audio.currentTime = 0;
  duckMusic(true);
  voiceState.value = { clip: path, speaking: true };
  try {
    await audio.play();
  } catch {
    quiet();
  }
}

/** Speaks these clips of the power being led, one after another, in place of anything speaking. */
export function speak(faction: FactionId, clips: readonly string[]): void {
  if (!voiced(faction) || clips.length === 0 || !allowed()) return;
  if (!audio && typeof navigator !== 'undefined' && pressing()) unlock();
  if (!audio) return;
  generation++;
  audio.pause();
  queue = clips.map((id) => clipPath(faction, id));
  void next(generation);
}

/** Speaks a turn's report once, however often it is opened. */
export function speakReport(faction: FactionId, turn: number, clips: readonly string[]): void {
  const key = `${faction}:${turn}`;
  if (spokenReport === key) return;
  if (!allowed() || !audio) return;
  spokenReport = key;
  speak(faction, clips);
}

/** Stops the voice speaking, and anything waiting to be spoken. */
export function hush(): void {
  generation++;
  queue = [];
  audio?.pause();
  release();
  if (voiceState.value.speaking) quiet();
}

/** Listens for the first press while voices may speak, stops with the page hidden, and follows the setting. */
export function listenForVoices(root: Document = document): void {
  const first = () => {
    // Nothing is made, and nothing downloaded, while voices are off.
    if (!allowed()) return;
    root.removeEventListener('pointerdown', first);
    root.removeEventListener('keydown', first);
    unlock();
  };
  root.addEventListener('pointerdown', first, { passive: true });
  root.addEventListener('keydown', first);
  root.addEventListener('visibilitychange', () => {
    if (root.hidden) hush();
  });
  settings.subscribe(() => {
    if (!allowed()) hush();
  });
  if (query.has('test'))
    (window as unknown as { __voice: unknown }).__voice = {
      state: () => ({ ...voiceState.value, unlocked: audio !== null }),
      requested: () => [...requested],
    };
}
