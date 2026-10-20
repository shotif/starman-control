// Transparency for pictures the image service can only return as JPEG (ART_PIPELINE.md, *Keying*).
// A building is painted on a flat magenta backdrop and cut out; a landscape is painted under a flat
// white (or magenta) sky, and the sky is keyed away column by column from the top, so the game can
// draw its own sky behind it. Pure functions on raw RGBA pixels, so they are tested without files.

/** The flat colour the model is asked to paint behind the subject. */
export type Backdrop = 'white' | 'magenta';

/** How a series is keyed: `cutout` keys the backdrop everywhere and trims; `sky` keys only above the land. */
export interface KeySpec {
  backdrop: Backdrop;
  mode: 'cutout' | 'sky';
}

/** The settings every keyed picture is made with; recorded in the manifest with the picture. */
export const KEY_SETTINGS = {
  version: 2,
  /** Magenta: a pixel's likeness to the backdrop, from 0 (none) to 1; opaque below `low`, clear above `high`. */
  magenta: { low: 0.3, high: 0.85 },
  /**
   * White: by the darkest channel, clear within `slack` of the sky's own, opaque `band` below that,
   * and never clear if more colourful than `maxChroma`.
   */
  white: { slack: 6, band: 42, maxChroma: 36 },
  /** Solid pixels in a row (going down a column) that end the sky. */
  groundRun: 3,
  /** Pixels kept round a trimmed cut-out. */
  margin: 6,
  /** How far inside a magenta cut-out's edge its tint is taken out. */
  rim: 2,
} as const;

export interface Raster {
  /** RGBA, 8 bits a channel, rows top to bottom. */
  data: Uint8Array;
  width: number;
  height: number;
}

type RGB = [number, number, number];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** The backdrop's actual colour: the median of the picture's edge (cut-outs) or top rows (skies). */
export function backdropColour(img: Raster, mode: KeySpec['mode']): RGB {
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const take = (x: number, y: number) => {
    const i = (y * img.width + x) * 4;
    rs.push(img.data[i] ?? 0);
    gs.push(img.data[i + 1] ?? 0);
    bs.push(img.data[i + 2] ?? 0);
  };
  const step = Math.max(1, Math.floor(img.width / 256));
  if (mode === 'sky') {
    const rows = Math.max(1, Math.floor(img.height / 50));
    for (let y = 0; y < rows; y++) for (let x = 0; x < img.width; x += step) take(x, y);
  } else {
    for (let x = 0; x < img.width; x += step) {
      take(x, 0);
      take(x, img.height - 1);
    }
    for (let y = 0; y < img.height; y += step) {
      take(0, y);
      take(img.width - 1, y);
    }
  }
  const median = (v: number[]) => v.sort((a, b) => a - b)[Math.floor(v.length / 2)] ?? 0;
  return [median(rs), median(gs), median(bs)];
}

/** How much a pixel looks like the backdrop, 0 to 1. */
export function likeness(r: number, g: number, b: number, backdrop: Backdrop, key: RGB): number {
  if (backdrop === 'magenta') {
    const keyM = Math.max(1, Math.min(key[0], key[2]) - key[1]);
    return clamp01((Math.min(r, b) - g) / keyM);
  }
  const { slack, band, maxChroma } = KEY_SETTINGS.white;
  if (Math.max(r, g, b) - Math.min(r, g, b) > maxChroma) return 0;
  const high = Math.min(key[0], key[1], key[2]) - slack;
  return clamp01((Math.min(r, g, b) - (high - band)) / band);
}

/** Opacity from likeness: the white key's likeness is already scaled; magenta's has its own band. */
function alphaOf(like: number, backdrop: Backdrop): number {
  if (backdrop === 'white') return 1 - like;
  const { low, high } = KEY_SETTINGS.magenta;
  return 1 - clamp01((like - low) / (high - low));
}

/**
 * Takes the backdrop out of a partly clear pixel: the colour seen is a·F + (1 − a)·K, so the
 * subject's own colour is F = (C − (1 − a)·K) / a. Then any magenta still left is taken out.
 */
function unmix(out: Uint8Array, i: number, a: number, key: RGB, backdrop: Backdrop): void {
  if (a >= 1) return;
  if (a <= 0) {
    out[i] = 0;
    out[i + 1] = 0;
    out[i + 2] = 0;
    out[i + 3] = 0;
    return;
  }
  const f = [0, 1, 2].map((c) => clamp01(((out[i + c] ?? 0) - (1 - a) * key[c as 0 | 1 | 2]) / a / 255) * 255) as RGB;
  out[i] = Math.round(f[0]);
  out[i + 1] = Math.round(f[1]);
  out[i + 2] = Math.round(f[2]);
  out[i + 3] = Math.round(a * 255);
  if (backdrop === 'magenta') despill(out, i);
}

/**
 * Takes any magenta tint out of a pixel: its part along magenta's direction from grey (+1, −2, +1)
 * is removed when positive, so a reddish or bluish edge keeps its warmth or coolness.
 */
function despill(out: Uint8Array, i: number): void {
  const r = out[i] ?? 0;
  const g = out[i + 1] ?? 0;
  const b = out[i + 2] ?? 0;
  const d = (r - 2 * g + b) / 6;
  if (d <= 0) return;
  out[i] = Math.round(Math.max(0, r - d));
  out[i + 1] = Math.round(Math.min(255, g + 2 * d));
  out[i + 2] = Math.round(Math.max(0, b - d));
}

/**
 * The rim: solid pixels within `reach` of a clear one. A JPEG blurs colour over a pixel or two, so
 * the backdrop's tint reaches past the edge the key finds; the rim is despilled too.
 */
function despillRim(out: Uint8Array, width: number, height: number, reach: number): void {
  const clear = new Uint8Array(width * height);
  for (let p = 0; p < clear.length; p++) clear[p] = (out[p * 4 + 3] ?? 0) < 128 ? 1 : 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (clear[p] || (out[p * 4 + 3] ?? 0) < 255) continue;
      let near = false;
      for (let dy = -reach; dy <= reach && !near; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -reach; dx <= reach; dx++) {
          const xx = x + dx;
          if (xx >= 0 && xx < width && clear[yy * width + xx]) {
            near = true;
            break;
          }
        }
      }
      if (near) despill(out, p * 4);
    }
  }
}

/** Keys the backdrop out of the whole picture (a building on magenta). */
export function keyCutout(img: Raster, backdrop: Backdrop): Raster {
  const key = backdropColour(img, 'cutout');
  const out = new Uint8Array(img.data);
  for (let i = 0; i < out.length; i += 4) {
    const like = likeness(out[i] ?? 0, out[i + 1] ?? 0, out[i + 2] ?? 0, backdrop, key);
    unmix(out, i, alphaOf(like, backdrop), key, backdrop);
  }
  if (backdrop === 'magenta') despillRim(out, img.width, img.height, KEY_SETTINGS.rim);
  return { data: out, width: img.width, height: img.height };
}

/**
 * Keys the sky out of a landscape: down each column from the top, every pixel is as clear as it
 * looks like the sky, until a short run of solid pixels marks the land; everything below stays,
 * so white snow or domes on the ground are kept. Haze at the horizon becomes partly clear.
 */
export function keySky(img: Raster, backdrop: Backdrop): Raster & { skyline: Uint16Array } {
  const key = backdropColour(img, 'sky');
  const out = new Uint8Array(img.data);
  const skyline = new Uint16Array(img.width);
  const run = KEY_SETTINGS.groundRun;
  for (let x = 0; x < img.width; x++) {
    let solid = 0;
    let y = 0;
    for (; y < img.height; y++) {
      const i = (y * img.width + x) * 4;
      const a = alphaOf(likeness(out[i] ?? 0, out[i + 1] ?? 0, out[i + 2] ?? 0, backdrop, key), backdrop);
      solid = a >= 0.98 ? solid + 1 : 0;
      if (solid >= run) break;
      unmix(out, i, a, key, backdrop);
    }
    skyline[x] = Math.max(0, y - run + 1);
  }
  return { data: out, width: img.width, height: img.height, skyline };
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The smallest box holding every pixel more than faintly visible, with a margin, inside the picture. */
export function trimBox(img: Raster, margin: number = KEY_SETTINGS.margin): Box {
  let minX = img.width;
  let minY = img.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if ((img.data[(y * img.width + x) * 4 + 3] ?? 0) > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { left: 0, top: 0, width: img.width, height: img.height };
  const left = Math.max(0, minX - margin);
  const top = Math.max(0, minY - margin);
  return {
    left,
    top,
    width: Math.min(img.width, maxX + margin + 1) - left,
    height: Math.min(img.height, maxY + margin + 1) - top,
  };
}

/** A keyed picture: the cut-out trimmed to its subject, the landscape whole. */
export function keyPicture(img: Raster, spec: KeySpec): { raster: Raster; crop: Box | null } {
  if (spec.mode === 'sky') {
    const keyed = keySky(img, spec.backdrop);
    return { raster: keyed, crop: null };
  }
  const keyed = keyCutout(img, spec.backdrop);
  return { raster: keyed, crop: trimBox(keyed) };
}

/** What the manifest records about how a picture was keyed. */
export function keyRecord(spec: KeySpec): KeySpec & { settings: typeof KEY_SETTINGS } {
  return { ...spec, settings: KEY_SETTINGS };
}
