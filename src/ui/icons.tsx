// The console's icons (CONSOLE.md §3): line drawings in its vocabulary of rings, diamonds and
// chevrons, always shown with their word. Drawn on a 24-unit square in the current colour.

import type { ComponentChildren } from 'preact';

const PATHS = {
  report: (
    <>
      <path d="M5 3.5h10.5l3.5 3.5v13.5H5z" />
      <path d="M8.5 9.5h7M8.5 13h7M8.5 16.5h4" />
    </>
  ),
  empire: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4" />
      <path d="M12 9.5l2.5 2.5-2.5 2.5-2.5-2.5z" fill="currentColor" />
    </>
  ),
  research: (
    <>
      <path d="M12 3l8 8-8 8-8-8z" />
      <path d="M12 7.5l3.5 3.5-3.5 3.5-3.5-3.5z" fill="currentColor" />
      <path d="M12 19v2.5" />
    </>
  ),
  menu: <path d="M4.5 7h15M4.5 12h15M4.5 17h15" />,
  // A voice speaking (VOICES.md §5): a speaker and two rings of sound.
  voice: (
    <>
      <path d="M4.5 9.5h3.5l4.5-4v13l-4.5-4H4.5z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  'end-turn': (
    <>
      <path d="M6 5.5l6.5 6.5L6 18.5" />
      <path d="M12 5.5l6.5 6.5-6.5 6.5" />
    </>
  ),
  find: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </>
  ),
  legend: (
    <>
      <path d="M4 7h3M4 12h3M4 17h3" />
      <path d="M10 7h10M10 12h10M10 17h6" />
    </>
  ),
  keys: (
    <>
      <path d="M3.5 7.5h17v9h-17z" />
      <path d="M7 10.5h1M10 10.5h1M13 10.5h1M16 10.5h1M8 13.5h8" />
    </>
  ),
  sol: (
    <>
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </>
  ),
  codex: (
    <>
      <path d="M4 5.5c3-1.3 5.5-1.3 8 .5 2.5-1.8 5-1.8 8-.5v13c-3-1.3-5.5-1.3-8 .5-2.5-1.8-5-1.8-8-.5z" />
      <path d="M12 6v13" />
    </>
  ),
  title: <path d="M14.5 5.5L8 12l6.5 6.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  flat: (
    <>
      <path d="M3 15l9-5 9 5-9 5z" />
    </>
  ),
  '3d': (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </>
  ),
  survey: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M5.5 5.5a9 9 0 0 1 13 0M7.8 7.8a5.8 5.8 0 0 1 8.4 0" />
      <path d="M12 15v6" />
    </>
  ),
  colony: (
    <>
      <path d="M4 18.5a8 8 0 0 1 16 0z" />
      <path d="M12 10.5v-6M9.5 7l2.5-2.5L14.5 7" />
    </>
  ),
  ship: <path d="M5 18.5L12 4l7 14.5-7-4z" />,
  lane: (
    <>
      <circle cx="5" cy="17" r="2" />
      <circle cx="19" cy="7" r="2" />
      <path d="M7 15.6l10-7.2" />
    </>
  ),
  anomaly: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke-dasharray="2.5 2.5" />
      <path d="M12 7.5v5.5M12 16v.5" />
    </>
  ),
  refused: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6 18L18 6" />
    </>
  ),
  growth: (
    <>
      <path d="M4 18.5h16" />
      <path d="M7 15l4-4 3 3 5-6" />
      <path d="M15.5 8H19v3.5" />
    </>
  ),
  // Diplomacy (M3_NEIGHBOURS.md §20.3): two rings that meet, and a diamond where they do.
  diplomacy: (
    <>
      <circle cx="8.5" cy="12" r="5.5" />
      <circle cx="15.5" cy="12" r="5.5" />
      <path d="M12 10l1.5 2-1.5 2-1.5-2z" fill="currentColor" />
    </>
  ),
} satisfies Record<string, ComponentChildren>;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, class: cls }: { name: IconName; size?: number; class?: string }) {
  return (
    <svg class={`icon${cls ? ` ${cls}` : ''}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        {PATHS[name]}
      </g>
    </svg>
  );
}
