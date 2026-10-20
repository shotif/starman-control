// The colony's scene as a still at the top of its panel (COLONY_VIEW.md §4: the scene gives the panel
// its header). Shown where there are pictures for the colony's ground and for every one of its
// buildings; elsewhere the panel is as it was. The pictures load when first needed and are kept.

import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { LANDSCAPES, structureArt } from '../../content/colonyArt.ts';
import { type ColonyScene, colonyScene } from '../../render/colonyScene.ts';
import { artUrl, drawColonyStill, placeAll } from '../../render/colonyStill.ts';
import type { GameState, Holding } from '../../sim/state.ts';
import type { World } from '../../sim/world.ts';

const loaded = new Map<string, Promise<HTMLImageElement>>();

function load(url: string): Promise<HTMLImageElement> {
  let p = loaded.get(url);
  if (!p) {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    p = img.decode().then(() => img);
    p.catch(() => loaded.delete(url));
    loaded.set(url, p);
  }
  return p;
}

/** The scene, if every part of it has a picture. */
export function stillScene(world: World, game: GameState, h: Holding): ColonyScene | null {
  const scene = colonyScene(world, game, h);
  if (!scene || !LANDSCAPES[scene.biome]) return null;
  return scene.buildings.every((b) => structureArt(scene.architecture, b.kind, b.home)) ? scene : null;
}

export function ColonyStill({ world, game, holding }: { world: World; game: GameState; holding: Holding }) {
  const scene = stillScene(world, game, holding);
  const key = scene ? JSON.stringify(scene) : '';
  // biome-ignore lint/correctness/useExhaustiveDependencies: the key stands for the scene.
  const stable = useMemo(() => scene, [key]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const c = canvas.current;
    const land = stable && LANDSCAPES[stable.biome];
    if (!c || !stable || !land) return;
    let gone = false;
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(c.clientWidth * dpr));
      const height = Math.max(1, Math.round(c.clientHeight * dpr));
      if (width < 2 || height < 2) return;
      const placed = placeAll(stable, land);
      const base = import.meta.env.BASE_URL;
      // The landscape's width on screen is the frame's over the share of it shown (about half).
      const landUrl = artUrl(base, 'landscape', land.id, width * 2);
      const urls = new Map(
        placed.map((p) => [p.art.id, artUrl(base, 'structure', p.art.id, p.w * width * 2.2)] as const),
      );
      void Promise.all([load(landUrl), ...[...urls].map(([id, url]) => load(url).then((img) => [id, img] as const))])
        .then(([landscape, ...structures]) => {
          if (gone) return;
          c.width = width;
          c.height = height;
          const ctx = c.getContext('2d');
          if (!ctx) return;
          drawColonyStill(ctx, width, height, stable, land, {
            landscape: landscape as HTMLImageElement,
            structures: new Map(structures as (readonly [string, HTMLImageElement])[]),
          });
          setDrawn(true);
        })
        .catch(() => {
          // Offline before the pictures were ever loaded: the panel works without them.
        });
    };
    draw();
    let last = c.clientWidth;
    const resize = new ResizeObserver(() => {
      if (Math.abs(c.clientWidth - last) < 8) return;
      last = c.clientWidth;
      draw();
    });
    resize.observe(c);
    return () => {
      gone = true;
      resize.disconnect();
    };
  }, [stable]);

  if (!scene) return null;
  return (
    <figure class={`colony-still${drawn ? ' is-drawn' : ''}`} data-testid="colony-still" data-biome={scene.biome}>
      <canvas ref={canvas} role="img" aria-label={scene.description} />
      <span class="badge badge-fiction" title="Made with the game’s art pipeline and laid out by the game">
        Illustration
      </span>
    </figure>
  );
}
