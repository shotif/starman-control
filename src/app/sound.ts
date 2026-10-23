// The interface's sounds (CONSOLE.md §5): quiet tones made in the browser with Web Audio, so there
// are no sound files to load or licence. Nothing plays until the player first presses something,
// and nothing at all with the sound setting off.

import { settings } from './settings.ts';

export type Cue = 'tap' | 'open' | 'turn' | 'report' | 'refused' | 'battle' | 'key';

let audio: AudioContext | null = null;

/** The cues played, for the test hook (`?test`). */
const played: Cue[] = [];
const testing = typeof location !== 'undefined' && new URLSearchParams(location.search).has('test');
if (testing) (window as unknown as { __sound: unknown }).__sound = { played: () => [...played] };

function context(): AudioContext | null {
  if (settings.value.sound === 'off' || typeof window === 'undefined') return null;
  if (!audio) {
    const Context =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return null;
    try {
      audio = new Context();
    } catch {
      return null;
    }
  }
  if (audio.state === 'suspended') void audio.resume().catch(() => undefined);
  return audio;
}

interface Tone {
  from: number;
  to: number;
  at: number;
  length: number;
  gain: number;
  wave: OscillatorType;
}

/** One tone gliding from one pitch to another, with a quick rise and a soft fall. */
function tone(c: AudioContext, t: Tone): void {
  const osc = c.createOscillator();
  const level = c.createGain();
  osc.type = t.wave;
  osc.frequency.setValueAtTime(t.from, t.at);
  osc.frequency.exponentialRampToValueAtTime(t.to, t.at + t.length);
  level.gain.setValueAtTime(0.0001, t.at);
  level.gain.exponentialRampToValueAtTime(t.gain, t.at + 0.012);
  level.gain.exponentialRampToValueAtTime(0.0001, t.at + t.length);
  osc.connect(level).connect(c.destination);
  osc.start(t.at);
  osc.stop(t.at + t.length + 0.02);
}

/**
 * Plays a cue, `after` seconds from now: a tick for a press, a rising tone for a turn, a chime for
 * the report, a low tone for a refusal, a muffled double thud for a battle fought, two bells for a
 * key (M6_ONE.md §25.2).
 */
export function play(cue: Cue, after = 0): void {
  const c = context();
  if (!c) return;
  if (testing) played.push(cue);
  const at = c.currentTime + 0.005 + after;
  switch (cue) {
    case 'tap':
      tone(c, { from: 1900, to: 1500, at, length: 0.04, gain: 0.018, wave: 'sine' });
      break;
    case 'open':
      tone(c, { from: 700, to: 1100, at, length: 0.09, gain: 0.016, wave: 'sine' });
      break;
    case 'turn':
      tone(c, { from: 196, to: 588, at, length: 0.55, gain: 0.035, wave: 'triangle' });
      tone(c, { from: 294, to: 880, at: at + 0.06, length: 0.5, gain: 0.018, wave: 'sine' });
      break;
    case 'report':
      tone(c, { from: 880, to: 870, at, length: 0.35, gain: 0.022, wave: 'sine' });
      tone(c, { from: 1318, to: 1310, at: at + 0.09, length: 0.45, gain: 0.018, wave: 'sine' });
      break;
    case 'refused':
      tone(c, { from: 240, to: 170, at, length: 0.2, gain: 0.035, wave: 'triangle' });
      break;
    case 'battle':
      tone(c, { from: 120, to: 50, at, length: 0.3, gain: 0.06, wave: 'sine' });
      tone(c, { from: 105, to: 45, at: at + 0.2, length: 0.4, gain: 0.05, wave: 'sine' });
      break;
    case 'key':
      tone(c, { from: 1046, to: 1044, at, length: 0.9, gain: 0.016, wave: 'sine' });
      tone(c, { from: 1568, to: 1566, at: at + 0.16, length: 1.1, gain: 0.013, wave: 'sine' });
      break;
  }
}

/** A tick for every press of a button, link, tab or toggle: one listener for the whole game. */
export function listenForPresses(root: Document = document): void {
  root.addEventListener(
    'pointerdown',
    (e) => {
      const target = (e.target as Element | null)?.closest?.('button, a, [role="tab"], summary');
      if (target && !(target as HTMLButtonElement).disabled) play('tap');
    },
    { passive: true },
  );
}
