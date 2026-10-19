// The title (§10; FIRST_IMPRESSION.md §2): the logotype and the menu as lit plates over a live
// scene of the real neighbourhood under the Milky Way. The scene loads after the menu is up, so the
// title stays small for a phone's first visit; without WebGL the menu stands on the plain sky.

import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { type SaveGlance, savedGame } from '../app/hasSave.ts';
import { quality, reducedMotion } from '../app/settings.ts';
import { FACTIONS, type FactionId } from '../content/factions.ts';
import { formatDate } from '../sim/calendar.ts';
import './title.css';

/** Line glyphs for the menu, in the console's vocabulary of rings, diamonds and chevrons. */
const GLYPHS: Record<string, ComponentChildren> = {
  continue: <path d="M8 5l9 7-9 7z" fill="currentColor" stroke="none" />,
  new: (
    <>
      <path d="M12 2.5l9.5 9.5-9.5 9.5L2.5 12z" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  explore: (
    <>
      <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-20 12 12)" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
      <circle cx="20.2" cy="8.6" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  codex: (
    <>
      <path d="M5 3.5h10l4 4V20.5H5z" />
      <path d="M8.5 10h7M8.5 13.5h7M8.5 17h4.5" />
    </>
  ),
  saves: (
    <>
      <path d="M12 3l8 4.5-8 4.5-8-4.5z" />
      <path d="M4 12l8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" />
    </>
  ),
  settings: (
    <>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
      <circle cx="9" cy="6.5" r="2" fill="var(--plate-bg, #08101d)" />
      <circle cx="15.5" cy="12" r="2" fill="var(--plate-bg, #08101d)" />
      <circle cx="7" cy="17.5" r="2" fill="var(--plate-bg, #08101d)" />
    </>
  ),
};

function Plate(props: { href: string; title: string; line: string; glyph: string; primary?: boolean; index: number }) {
  const id = `plate-${props.glyph}`;
  return (
    <a
      class={`plate${props.primary ? ' plate-primary' : ''}`}
      href={props.href}
      aria-label={props.title}
      aria-describedby={id}
      style={{ '--i': props.index }}
    >
      <svg class="plate-glyph" viewBox="0 0 24 24" aria-hidden="true">
        <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          {GLYPHS[props.glyph]}
        </g>
      </svg>
      <span class="plate-text">
        <span class="plate-title">{props.title}</span>
        <span class="plate-line" id={id}>
          {props.line}
        </span>
      </span>
      <svg class="plate-chevron" viewBox="0 0 12 24" aria-hidden="true">
        <path d="M3 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" />
      </svg>
    </a>
  );
}

function continueLine(save: SaveGlance | 'unreadable'): string {
  if (save === 'unreadable') return 'The game you were playing';
  const f = save.faction && save.faction in FACTIONS ? FACTIONS[save.faction as FactionId].name : 'Your game';
  return `${f} · ${formatDate(save.turn)}`;
}

/** Starts the live scene once the menu has been drawn; the scene is torn down with the title. */
function useTitleScene(host: { current: HTMLDivElement | null }): void {
  useEffect(() => {
    let live = true;
    let scene: { dispose(): void } | null = null;
    const start = () => {
      if (!live || !host.current) return;
      void import('../render/TitleScene.ts')
        .then(({ TitleScene }) => {
          if (!live || !host.current) return;
          scene = new TitleScene(host.current, { quality: quality(), reducedMotion: reducedMotion() });
        })
        .catch(() => {
          // No WebGL, or the scene could not load: the menu stands on the plain sky.
        });
    };
    // After the menu is drawn and the boot screen has gone, so neither is kept waiting while the
    // sky is baked.
    const timer = setTimeout(() => requestAnimationFrame(start), 800);
    return () => {
      live = false;
      clearTimeout(timer);
      scene?.dispose();
    };
  }, [host]);
}

export function Title({ buildId }: { buildId: string }) {
  const [save, setSave] = useState<SaveGlance | 'unreadable' | null>(null);
  const sky = useRef<HTMLDivElement>(null);
  useTitleScene(sky);
  useEffect(() => {
    let live = true;
    void savedGame().then((s) => {
      if (live) setSave(s);
    });
    return () => {
      live = false;
    };
  }, []);
  const plates = [
    ...(save
      ? [{ href: '#/game', title: 'Continue', line: continueLine(save), glyph: 'continue', primary: true }]
      : []),
    { href: '#/new', title: 'New game', line: 'Lead one of three powers', glyph: 'new', primary: !save },
    {
      href: '#/map',
      title: 'Explore the neighbourhood',
      line: '207 real star systems, free to explore',
      glyph: 'explore',
    },
    { href: '#/codex', title: 'Codex', line: 'Every star and world, with its sources', glyph: 'codex' },
    { href: '#/saves', title: 'Saves', line: 'Three slots, export and import', glyph: 'saves' },
    { href: '#/settings', title: 'Settings', line: 'Text size, motion and quality', glyph: 'settings' },
  ];
  return (
    <main class="title">
      <div class="title-sky" ref={sky} aria-hidden="true" />
      <div class="title-shade" aria-hidden="true" />
      <div class="title-content">
        <header class="title-head">
          <h1 class="logotype">
            <span class="logo-starman">Starman</span> <span class="logo-control">Control</span>
          </h1>
          <p class="tagline">
            A 4X strategy game of exploration, colonies and first contact among the real nearby stars, in the{' '}
            <a href="https://shotif.github.io/starman-reborn/">Starman Reborn</a> universe.
          </p>
        </header>
        <nav class="title-menu" aria-label="Start">
          {plates.map((p, i) => (
            <Plate key={p.href} {...p} index={i} />
          ))}
        </nav>
      </div>
      <footer class="title-foot">
        <p class="status">In development · M1, First light · the first turns are playable</p>
        <p class="credit">
          The stars and their places are real. The lanes, the powers and the look of the sky are the game’s fiction.
        </p>
        <p class="build">
          Build {buildId} · <a href="https://github.com/shotif/starman-control/tree/main/docs">Design documents</a>
        </p>
      </footer>
    </main>
  );
}
