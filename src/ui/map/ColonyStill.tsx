// The colony's scene as a still at the top of its panel (COLONY_VIEW.md §4: the scene gives the panel
// its header), and the way into the living diorama: pressing it opens the scene. Shown where there
// are pictures for the colony's ground and every one of its buildings, which since increment 17 is
// every colony and outpost. The pictures load when first needed and are kept.

import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { LANDSCAPES, structureArt } from '../../content/colonyArt.ts';
import { artUrl, frameTown, placeAll, placeProps } from '../../render/colonyPlace.ts';
import { type ColonyScene, colonyScene } from '../../render/colonyScene.ts';
import { drawColonyStill } from '../../render/colonyStill.ts';
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
  return scene.buildings.some((b) => structureArt(scene.architecture, b.kind, b.home)) ? scene : null;
}

export function ColonyStill({
  world,
  game,
  holding,
  onOpen,
}: {
  world: World;
  game: GameState;
  holding: Holding;
  /** Opens the scene as a diorama. */
  onOpen?: () => void;
}) {
  const scene = stillScene(world, game, holding);
  const key = scene ? JSON.stringify(scene) : '';
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
      // Each picture at the width it is drawn: the landscape's is the frame's over the share of it
      // shown (as drawColonyStill frames it), and a building's its share of that (M2_WORLDS.md §23.4).
      const LW = width / frameTown(placed, land, width / height).uw;
      const landUrl = artUrl(base, 'landscape', land.id, LW);
      const urls = new Map([
        ...placed.map((p) => [p.art.id, artUrl(base, 'structure', p.art.id, p.w * LW)] as const),
        ...placeProps(stable, land, placed).map(
          // A prop's picture fits a square: its size is its longer side.
          (p) => [p.art.id, artUrl(base, 'prop', p.art.id, Math.max(p.w, p.h / land.aspect) * LW)] as const,
        ),
      ]);
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
      {onOpen && (
        <button type="button" class="colony-open" onClick={onOpen}>
          <span class="colony-open-plate">View {scene.name}</span>
        </button>
      )}
    </figure>
  );
}
