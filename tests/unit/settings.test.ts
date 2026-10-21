import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings, quality, reducedMotion } from '../../src/app/settings.ts';

describe('settings (M1_PROOF.md §1)', () => {
  it('keep only values the game knows, falling back to the defaults', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(
      parseSettings({
        textScale: 1.3,
        motion: 'reduce',
        quality: 'low',
        sound: 'off',
        music: 'off',
        advisors: 'quiet',
      }),
    ).toEqual({
      textScale: 1.3,
      motion: 'reduce',
      quality: 'low',
      sound: 'off',
      music: 'off',
      advisors: 'quiet',
    });
    expect(parseSettings({ textScale: 9, motion: 'wild', quality: 'ultra', sound: 'loud', extra: 1 })).toEqual(
      DEFAULT_SETTINGS,
    );
    // Settings kept before sound was a setting still read, with the sound on.
    expect(parseSettings({ textScale: 1.15 })).toEqual({ ...DEFAULT_SETTINGS, textScale: 1.15 });
    expect(DEFAULT_SETTINGS.sound).toBe('on');
    // Settings kept before music read with the music on (MUSIC.md §2).
    expect(parseSettings({ sound: 'off' }).music).toBe('on');
    // And before the advisors, with them speaking (M2_WORLDS.md §24.2).
    expect(parseSettings({ sound: 'off' }).advisors).toBe('speak');
    expect(parseSettings({ advisors: 'loud' }).advisors).toBe('speak');
  });

  it('say whether to reduce motion and what quality to draw at', () => {
    expect(reducedMotion({ ...DEFAULT_SETTINGS, motion: 'reduce' })).toBe(true);
    expect(reducedMotion({ ...DEFAULT_SETTINGS, motion: 'full' })).toBe(false);
    expect(quality({ ...DEFAULT_SETTINGS, quality: 'high' })).toBe('high');
    expect(['low', 'medium']).toContain(quality(DEFAULT_SETTINGS));
  });
});
