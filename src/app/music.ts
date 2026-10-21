// The music (docs/design/MUSIC.md, D-31): pieces generated with Lyria, played after the first press,
// following where the player is, fading between places and resting between pieces. Two audio decks
// are made at the first press (iOS lets a page play only what a press started) and run through Web
// Audio for the fades. A piece is downloaded whole when first wanted, so the service worker keeps
// it; nothing is downloaded with music off. In test runs (`?test`) music plays only when the address
// asks for it (`?test&music`) or it is turned on during the visit, so the other journeys stay quick.

import { signal } from '@preact/signals';
import {
  FADE_SECONDS,
  MUSIC_LEVEL,
  type MusicMood,
  type MusicPiece,
  nextPiece,
  SILENCE_SECONDS,
} from '../content/music.ts';
import { settings } from './settings.ts';

interface Deck {
  audio: HTMLAudioElement;
  gain: GainNode | null;
  piece: MusicPiece | null;
  url: string | null;
}

/** What the music is doing, for the test hook. */
export const musicState = signal<{ mood: MusicMood | null; piece: MusicPiece | null; playing: boolean }>({
  mood: null,
  piece: null,
  playing: false,
});

let wanted: MusicMood | null = null;
let ctx: AudioContext | null = null;
let decks: Deck[] = [];
let front = 0;
let rest = 0;
let generation = 0;
/** The mood whose piece is being fetched or played, set at once so a second call does not fetch again. */
let playing: MusicMood | null = null;
const lastPiece: Partial<Record<MusicMood, MusicPiece>> = {};
/** Pieces asked for, in order, for the test hook. */
const requested: string[] = [];

const query = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
let testAllowed = !query.has('test') || query.has('music');
let lastMusic = settings.value.music;

function allowed(): boolean {
  if (settings.value.music !== lastMusic) {
    lastMusic = settings.value.music;
    testAllowed = true;
  }
  return settings.value.music === 'on' && testAllowed;
}

/** A moment of silence as a WAV, to unlock an audio element during the first press. */
function silence(): string {
  const samples = 800;
  const buf = new ArrayBuffer(44 + samples * 2);
  const v = new DataView(buf);
  const text = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(at + i, s.charCodeAt(i));
  };
  text(0, 'RIFF');
  v.setUint32(4, 36 + samples * 2, true);
  text(8, 'WAVEfmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true);
  v.setUint32(28, 16000, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, 'data');
  v.setUint32(40, samples * 2, true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

/** Made at the first press: the context and two decks, each unlocked by playing a moment of silence. */
function unlock(): void {
  if (decks.length > 0 || typeof window === 'undefined') return;
  const Context =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  try {
    ctx = Context ? new Context() : null;
  } catch {
    ctx = null;
  }
  const quiet = silence();
  decks = [0, 1].map(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    let gain: GainNode | null = null;
    if (ctx) {
      try {
        gain = ctx.createGain();
        gain.gain.value = 0;
        ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
      } catch {
        gain = null;
      }
    }
    if (!gain) audio.volume = 0;
    audio.src = quiet;
    void audio.play().catch(() => undefined);
    audio.addEventListener('ended', () => ended(audio));
    return { audio, gain, piece: null, url: null };
  });
  void ctx?.resume().catch(() => undefined);
  apply();
}

/** Fades a deck's level to `to` over `seconds`. */
function fade(deck: Deck, to: number, seconds: number): void {
  if (deck.gain && ctx) {
    const g = deck.gain.gain;
    const now = ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(to * MUSIC_LEVEL, now + seconds);
    return;
  }
  // No Web Audio: step the element's own volume (not settable on iOS, which has Web Audio).
  const from = deck.audio.volume;
  const start = performance.now();
  const step = () => {
    const t = Math.min(1, (performance.now() - start) / (seconds * 1000 || 1));
    deck.audio.volume = Math.max(0, Math.min(1, from + (to * MUSIC_LEVEL - from) * t));
    if (t < 1) requestAnimationFrame(step);
  };
  step();
}

function stopDeck(deck: Deck, seconds: number): void {
  fade(deck, 0, seconds);
  const piece = deck.piece;
  setTimeout(() => {
    if (deck.piece !== piece) return;
    deck.audio.pause();
    if (deck.url) URL.revokeObjectURL(deck.url);
    deck.url = null;
    deck.piece = null;
  }, seconds * 1000);
}

/** Starts a piece on the other deck, fading it in and the old one out. */
async function start(mood: MusicMood, piece: MusicPiece, mine: number): Promise<void> {
  requested.push(piece);
  let url: string;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}music/${piece}.mp3`);
    if (!res.ok) return;
    url = URL.createObjectURL(await res.blob());
  } catch {
    return; // Offline before it was ever heard: silent.
  }
  if (mine !== generation || wanted !== mood || !allowed()) {
    URL.revokeObjectURL(url);
    return;
  }
  const old = decks[front];
  front = 1 - front;
  const deck = decks[front];
  if (!deck) return;
  if (old?.piece) stopDeck(old, FADE_SECONDS);
  deck.piece = piece;
  deck.url = url;
  deck.audio.src = url;
  deck.audio.currentTime = 0;
  lastPiece[mood] = piece;
  try {
    await deck.audio.play();
  } catch {
    return;
  }
  fade(deck, 1, FADE_SECONDS);
  musicState.value = { mood, piece, playing: true };
}

function ended(audio: HTMLAudioElement): void {
  const deck = decks[front];
  if (!deck || deck.audio !== audio || !deck.piece || !wanted) return;
  const mood = wanted;
  musicState.value = { ...musicState.value, playing: false };
  clearTimeout(rest);
  const mine = generation;
  rest = window.setTimeout(() => {
    if (mine !== generation || wanted !== mood) return;
    const piece = nextPiece(mood, lastPiece[mood] ?? null);
    if (piece) void start(mood, piece, mine);
  }, SILENCE_SECONDS[mood] * 1000);
}

/** Whether the page is inside a press now (the browser lets audio start only then). */
function pressing(): boolean {
  return (navigator as { userActivation?: { isActive: boolean } }).userActivation?.isActive === true;
}

/** Brings the music in line with the mood wanted and the settings. */
function apply(): void {
  // Turned on by a press (the setting): unlock now, while the press lets audio start.
  if (decks.length === 0 && allowed() && wanted && typeof navigator !== 'undefined' && pressing()) unlock();
  if (decks.length === 0) return;
  const deck = decks[front];
  if (!wanted || !allowed()) {
    generation++;
    clearTimeout(rest);
    playing = null;
    for (const d of decks) if (d.piece) stopDeck(d, 0.4);
    musicState.value = { mood: wanted, piece: null, playing: false };
    return;
  }
  // Already playing, fetching or resting between this mood's pieces: carry on.
  if (playing === wanted && (deck?.piece || rest || musicState.value.mood !== wanted)) return;
  generation++;
  clearTimeout(rest);
  rest = 0;
  playing = wanted;
  const piece = nextPiece(wanted, lastPiece[wanted] ?? null);
  if (piece) void start(wanted, piece, generation);
  else musicState.value = { mood: wanted, piece: null, playing: false };
}

/** Says where the player is; the music follows once a press has unlocked it. */
export function setMusicMood(mood: MusicMood | null): void {
  if (mood === wanted) return;
  wanted = mood;
  apply();
}

/** Listens for the first press while music may play, pauses with the page, and follows the setting. */
export function listenForMusic(root: Document = document): void {
  const first = () => {
    // Nothing is made, and nothing downloaded, while the music is off.
    if (!allowed()) return;
    root.removeEventListener('pointerdown', first);
    root.removeEventListener('keydown', first);
    unlock();
  };
  root.addEventListener('pointerdown', first, { passive: true });
  root.addEventListener('keydown', first);
  root.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (root.hidden) void ctx.suspend().catch(() => undefined);
    else void ctx.resume().catch(() => undefined);
  });
  settings.subscribe(() => apply());
  if (query.has('test'))
    (window as unknown as { __music: unknown }).__music = {
      state: () => ({ ...musicState.value, unlocked: decks.length > 0 }),
      requested: () => [...requested],
    };
}
