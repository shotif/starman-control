import { describe, expect, it } from 'vitest';
import { BRIEFS } from '../../art/briefs.ts';
import { SERIES } from '../../art/styles.ts';
import { buildPrompt, findBrief, keySpecFor } from '../../scripts/art/catalogue.ts';
import {
  backdropColour,
  KEY_SETTINGS,
  keyCutout,
  keyPicture,
  keySky,
  likeness,
  type Raster,
  trimBox,
} from '../../scripts/art/keying.ts';

type RGB = [number, number, number];

/** A picture filled with one colour, with a function to paint it. */
function raster(width: number, height: number, fill: RGB, paint?: (x: number, y: number) => RGB | null): Raster {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = paint?.(x, y) ?? fill;
      const i = (y * width + x) * 4;
      data.set([c[0], c[1], c[2], 255], i);
    }
  }
  return { data, width, height };
}

const px = (img: Raster, x: number, y: number) => {
  const i = (y * img.width + x) * 4;
  return [...img.data.slice(i, i + 4)];
};

const MAGENTA: RGB = [255, 0, 255];
const WHITE: RGB = [255, 255, 255];

describe('the backdrop', () => {
  it('is read from the edges of a cut-out and the top of a sky, as painted, not as asked', () => {
    const img = raster(20, 20, [250, 8, 246], (x, y) => (x > 5 && x < 15 && y > 5 && y < 15 ? [90, 90, 90] : null));
    expect(backdropColour(img, 'cutout')).toEqual([250, 8, 246]);
    const sky = raster(20, 100, [240, 240, 238], (_x, y) => (y > 30 ? [80, 70, 50] : null));
    expect(backdropColour(sky, 'sky')).toEqual([240, 240, 238]);
  });

  it('magenta likeness is high on the backdrop, low on greys, warm windows and the powers’ colours', () => {
    expect(likeness(255, 0, 255, 'magenta', MAGENTA)).toBe(1);
    for (const c of [
      [128, 128, 128],
      [255, 190, 90],
      [98, 227, 154],
      [92, 200, 255],
      [255, 95, 95],
      [60, 40, 80],
    ] as RGB[])
      expect(likeness(...c, 'magenta', MAGENTA)).toBeLessThan(KEY_SETTINGS.magenta.low);
  });

  it('white likeness ignores colourful pixels however bright', () => {
    expect(likeness(255, 255, 255, 'white', WHITE)).toBe(1);
    expect(likeness(255, 240, 160, 'white', WHITE)).toBe(0);
    expect(likeness(120, 120, 120, 'white', WHITE)).toBe(0);
  });
});

describe('cutting a building out', () => {
  // A grey block on magenta, with a one-pixel edge half grey, half magenta.
  const img = raster(40, 30, MAGENTA, (x, y) => {
    if (x >= 10 && x < 30 && y >= 8 && y < 26) return [120, 110, 100];
    if (x === 9 && y >= 8 && y < 26) return [188, 55, 178];
    return null;
  });
  const out = keyCutout(img, 'magenta');

  it('clears the backdrop and keeps the building', () => {
    expect(px(out, 0, 0)[3]).toBe(0);
    expect(px(out, 20, 15)).toEqual([120, 110, 100, 255]);
  });

  it('makes an edge partly clear and takes the magenta out of its colour', () => {
    const [r, g, b, a] = px(out, 9, 12) as [number, number, number, number];
    expect(a).toBeGreaterThan(60);
    expect(a).toBeLessThan(220);
    expect(Math.min(r, b) - g).toBeLessThan(25);
  });

  it('trims to the building with a margin', () => {
    expect(trimBox(out, 2)).toEqual({ left: 7, top: 6, width: 25, height: 22 });
    const keyed = keyPicture(img, { backdrop: 'magenta', mode: 'cutout' });
    expect(keyed.crop).toEqual(trimBox(keyed.raster));
  });
});

describe('taking the sky out of a landscape', () => {
  // White sky to row 10, hazy hills at rows 10 and 11, land below, and white snow lower down.
  const img = raster(8, 30, WHITE, (_x, y) => {
    if (y < 10) return null;
    if (y < 12) return [232, 232, 236];
    if (y >= 20 && y < 23) return [250, 250, 252];
    return [90, 80, 60];
  });
  const out = keySky(img, 'white');

  it('clears the sky down to the land', () => {
    expect(px(out, 3, 2)[3]).toBe(0);
    expect(px(out, 3, 15)).toEqual([90, 80, 60, 255]);
    expect(out.skyline[3]).toBe(12);
  });

  it('keeps the haze at the horizon partly clear', () => {
    const a = px(out, 3, 10)[3] ?? 0;
    expect(a).toBeGreaterThan(40);
    expect(a).toBeLessThan(255);
  });

  it('keeps white things on the ground', () => {
    expect(px(out, 3, 21)[3]).toBe(255);
  });

  it('is never trimmed', () => {
    expect(keyPicture(img, { backdrop: 'white', mode: 'sky' }).crop).toBeNull();
  });
});

describe('keyed series', () => {
  it('ask for their backdrop in the prompt, and a brief may try the other', () => {
    const shore = findBrief('landscape-shore');
    expect(keySpecFor(shore)).toEqual({ backdrop: 'white', mode: 'sky' });
    expect(buildPrompt(shore)).toContain('pure white (#FFFFFF)');
    expect(buildPrompt(shore, 'magenta')).toContain('pure magenta (#FF00FF)');
    expect(keySpecFor(shore, 'magenta')).toEqual({ backdrop: 'magenta', mode: 'sky' });
    expect(buildPrompt(findBrief('scaffold'))).toContain('pure magenta (#FF00FF)');
    expect(buildPrompt(findBrief('dispatch-ship'))).not.toContain('{backdrop}');
  });

  it('every building brief is a structure, and every structure style names its backdrop', () => {
    for (const id of ['structure', 'landscape'] as const) expect(SERIES[id].style).toContain('{backdrop}');
    expect(BRIEFS.filter((b) => b.series === 'structure').length).toBeGreaterThanOrEqual(7);
  });
});
