import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings, quality, reducedMotion } from '../../src/app/settings.ts';

describe('settings (M1_PROOF.md §1)', () => {
  it('keep only values the game knows, falling back to the defaults', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ textScale: 1.3, motion: 'reduce', quality: 'low' })).toEqual({
      textScale: 1.3,
      motion: 'reduce',
      quality: 'low',
    });
    expect(parseSettings({ textScale: 9, motion: 'wild', quality: 'ultra', extra: 1 })).toEqual(DEFAULT_SETTINGS);
  });

  it('say whether to reduce motion and what quality to draw at', () => {
    expect(reducedMotion({ ...DEFAULT_SETTINGS, motion: 'reduce' })).toBe(true);
    expect(reducedMotion({ ...DEFAULT_SETTINGS, motion: 'full' })).toBe(false);
    expect(quality({ ...DEFAULT_SETTINGS, quality: 'high' })).toBe('high');
    expect(['low', 'medium']).toContain(quality(DEFAULT_SETTINGS));
  });
});
