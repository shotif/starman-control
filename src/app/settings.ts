// Settings (M1_PROOF.md §1), kept on the device as Starman Reborn keeps them (src/app/settings.ts
// at ba4ef73, D-10, in spirit): text size, reduced motion, quality, sound (CONSOLE.md §5), music (MUSIC.md), voices (VOICES.md) and the
// advisors (M2_WORLDS.md §24). They are read at start-up,
// before anything is drawn, so they live in localStorage rather than the save store.

import { signal } from '@preact/signals';
import type { AdvisorSetting } from '../content/advisors.ts';

export const TEXT_SCALES = [1, 1.15, 1.3, 1.5] as const;
export type TextScale = (typeof TEXT_SCALES)[number];
export type MotionSetting = 'system' | 'reduce' | 'full';
export type QualitySetting = 'auto' | 'low' | 'medium' | 'high';
export type Quality = 'low' | 'medium' | 'high';
export type SoundSetting = 'on' | 'off';

export interface Settings {
  textScale: TextScale;
  motion: MotionSetting;
  quality: QualitySetting;
  sound: SoundSetting;
  music: SoundSetting;
  /** The advisors' and commanders' voices (VOICES.md §5). */
  voices: SoundSetting;
  advisors: AdvisorSetting;
  /** Edicts and the attention that pays for them shown, or hidden (M2_WORLDS.md §25.2). */
  edicts: SoundSetting;
  /** The guided opening: on for a first game, or never (M2_WORLDS.md §28.1). */
  guide: SoundSetting;
}

const KEY = 'starman-control:settings';
export const DEFAULT_SETTINGS: Settings = {
  textScale: 1,
  motion: 'system',
  quality: 'auto',
  sound: 'on',
  music: 'on',
  voices: 'on',
  advisors: 'speak',
  edicts: 'on',
  guide: 'on',
};

/** Reads stored settings, keeping only values the game knows. */
export function parseSettings(raw: unknown): Settings {
  const s = { ...DEFAULT_SETTINGS };
  if (typeof raw !== 'object' || raw === null) return s;
  const r = raw as Record<string, unknown>;
  if (TEXT_SCALES.includes(r.textScale as TextScale)) s.textScale = r.textScale as TextScale;
  if (r.motion === 'system' || r.motion === 'reduce' || r.motion === 'full') s.motion = r.motion;
  if (r.quality === 'auto' || r.quality === 'low' || r.quality === 'medium' || r.quality === 'high')
    s.quality = r.quality;
  if (r.sound === 'on' || r.sound === 'off') s.sound = r.sound;
  if (r.music === 'on' || r.music === 'off') s.music = r.music;
  if (r.voices === 'on' || r.voices === 'off') s.voices = r.voices;
  if (r.advisors === 'speak' || r.advisors === 'quiet' || r.advisors === 'off') s.advisors = r.advisors;
  if (r.edicts === 'on' || r.edicts === 'off') s.edicts = r.edicts;
  if (r.guide === 'on' || r.guide === 'off') s.guide = r.guide;
  return s;
}

function load(): Settings {
  try {
    return parseSettings(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export const settings = signal<Settings>(typeof localStorage === 'undefined' ? { ...DEFAULT_SETTINGS } : load());

export function updateSettings(patch: Partial<Settings>): void {
  settings.value = { ...settings.value, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(settings.value));
  } catch {
    // Private browsing may refuse; the settings still hold for this visit.
  }
  applySettings();
}

/** Whether motion should be reduced: the setting, or the device's own when it says "as the device". */
export function reducedMotion(s: Settings = settings.value): boolean {
  if (s.motion !== 'system') return s.motion === 'reduce';
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** The quality to draw at: the setting, or for "automatic" low on small, slow devices, else medium. */
export function quality(s: Settings = settings.value): Quality {
  if (s.quality !== 'auto') return s.quality;
  if (typeof navigator === 'undefined') return 'medium';
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as { deviceMemory?: number }).deviceMemory ?? 8;
  return cores <= 4 || memory <= 3 ? 'low' : 'medium';
}

/** Puts the settings on the page: the text size on the root, and a class for reduced motion. */
export function applySettings(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--text-scale', String(settings.value.textScale));
  root.classList.toggle('reduced-motion', reducedMotion());
}
