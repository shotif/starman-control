// A colony's scene as a still picture (docs/design/COLONY_VIEW.md §2), drawn with Canvas 2D for the
// colony's panel: the sky in code in its star's colour, the painted landscape graded to that light
// with haze over the far land, and the painted buildings in their slots, back to front, each on a
// soft contact shadow. Drawn once; nothing moves. The living diorama (ColonyView.ts) draws the same
// scene by the same placing rules (colonyPlace.ts).

import type { LandscapeArt } from '../content/colonyArt.ts';
import { frameTown, placeAll, placeProps } from './colonyPlace.ts';
import { type ColonyScene, mixHex } from './colonyScene.ts';

function rgba(hex: string, a: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** A small seeded stream for where the stars are. */
function stream(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/**
 * A picture tinted by a light: multiplied by its colour, the haze laid over it towards the top,
 * and its own transparency kept.
 */
function graded(
  img: CanvasImageSource,
  w: number,
  h: number,
  light: string,
  haze: { colour: string; top: number; bottom: number; amount: number } | null,
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const g = c.getContext('2d');
  if (!g) return c;
  g.drawImage(img, 0, 0, c.width, c.height);
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = light;
  g.fillRect(0, 0, c.width, c.height);
  if (haze && haze.amount > 0) {
    g.globalCompositeOperation = 'source-over';
    const grad = g.createLinearGradient(0, haze.top, 0, haze.bottom);
    grad.addColorStop(0, rgba(haze.colour, haze.amount));
    grad.addColorStop(1, rgba(haze.colour, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, c.width, c.height);
  }
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

export interface StillPictures {
  landscape: CanvasImageSource;
  structures: Map<string, CanvasImageSource>;
}

/**
 * Draws the still into a canvas of `width` × `height` device pixels: the part of the landscape
 * `frameTown` chooses, in late-afternoon light.
 */
export function drawColonyStill(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: ColonyScene,
  land: LandscapeArt,
  pictures: StillPictures,
): void {
  const placed = placeAll(scene, land);
  const { u0, v0, uw } = frameTown(placed, land, width / height);
  const LW = width / uw;
  const LH = LW / land.aspect;
  const X = (u: number) => (u - u0) * LW;
  const Y = (v: number) => (v - v0) * LH;
  const horizonY = Y(land.horizon);

  // The sky: its colours by day, warmed a little towards evening.
  const sky = ctx.createLinearGradient(0, 0, 0, Math.max(1, horizonY));
  sky.addColorStop(0, scene.sky.zenith);
  sky.addColorStop(1, mixHex(scene.sky.horizon, '#ffc68a', scene.sky.atmosphere === 'none' ? 0 : 0.18));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  if (scene.sky.starsByDay) {
    const r = stream(scene.holding * 7919 + 17);
    for (let i = 0; i < 140; i++) {
      const x = r() * width;
      const y = r() * horizonY;
      ctx.fillStyle = `rgba(230, 236, 255, ${0.25 + r() * 0.6})`;
      ctx.fillRect(x, y, r() < 0.15 ? 2 : 1, 1);
    }
  }

  // The sun, upper left, where the buildings are lit from; low and still on a locked world.
  const sunX = width * 0.3;
  const sunY = scene.sun.locked ? horizonY - height * 0.02 : Math.max(height * 0.12, horizonY * 0.42);
  const disc = Math.max(2.5, Math.min(height * 0.12, scene.sun.size * LW * 0.0045));
  const air = scene.sky.atmosphere === 'none' ? 0.6 : scene.sky.atmosphere === 'thin' ? 1.4 : 2.6;
  const glow = ctx.createRadialGradient(sunX, sunY, disc * 0.5, sunX, sunY, disc * (4 + air * 4));
  glow.addColorStop(0, rgba(scene.sun.colour, 0.55));
  glow.addColorStop(1, rgba(scene.sun.colour, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, horizonY + disc * 10);
  ctx.fillStyle = mixHex(scene.sun.colour, '#ffffff', 0.55);
  ctx.beginPath();
  ctx.arc(sunX, sunY, disc, 0, Math.PI * 2);
  ctx.fill();

  // The land, in the star's light, hazed towards the horizon.
  const light = mixHex('#ffffff', scene.sun.colour, 0.45);
  const haze = {
    colour: scene.sky.horizon,
    top: Y(land.horizon - 0.04) - Y(0),
    bottom: Y(land.horizon + 0.22) - Y(0),
    amount: scene.sky.haze * 0.7,
  };
  ctx.drawImage(graded(pictures.landscape, LW, LH, light, haze), X(0), Y(0));

  // The buildings and the props between them, farthest first, each on its shadow, a little hazed
  // by distance.
  const pieces = [...placed, ...placeProps(scene, land, placed)].sort((a, b) => a.v - b.v || a.u - b.u);
  for (const p of pieces) {
    const img = pictures.structures.get(p.art.id);
    if (!img) continue;
    const w = p.w * LW;
    const h = p.h * LH;
    const x = X(p.u) - w / 2;
    const y = Y(p.v) - h;
    // The contact shadow: a soft ellipse, a little to the right, away from the light.
    ctx.save();
    ctx.translate(X(p.u) + w * 0.08, Y(p.v) - h * 0.05);
    ctx.scale(1, 0.3);
    const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.56);
    shadow.addColorStop(0, 'rgba(10, 8, 6, 0.42)');
    shadow.addColorStop(1, 'rgba(10, 8, 6, 0)');
    ctx.fillStyle = shadow;
    ctx.fillRect(-w * 0.6, -w * 0.6, w * 1.2, w * 1.2);
    ctx.restore();
    const far = Math.max(0, Math.min(1, 1 - (p.v - land.horizon) / 0.45));
    const tinted = graded(img, w, h, light, {
      colour: scene.sky.horizon,
      top: 0,
      bottom: h,
      amount: scene.sky.haze * far * 0.35,
    });
    ctx.drawImage(tinted, x, y);
  }

  // A soft vignette, like the console's glass.
  const v = ctx.createRadialGradient(width / 2, height * 0.55, height * 0.3, width / 2, height * 0.55, width * 0.75);
  v.addColorStop(0, 'rgba(4, 7, 14, 0)');
  v.addColorStop(1, 'rgba(4, 7, 14, 0.45)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, width, height);
}
