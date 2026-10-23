// The game's music (docs/design/MUSIC.md, D-31): instrumental pieces generated at build time with
// Google's Lyria and chosen by the owner, published to public/music/. This lists the pieces, which
// screen each plays on, and the silences between them; src/app/music.ts plays them. A colony's piece
// follows its owner's architecture, never the player's power (D-08).

import type { ArchitectureId } from './factions.ts';

export type MusicPiece =
  | 'title'
  | 'map-1'
  | 'map-2'
  | 'system'
  | 'colony-authority'
  | 'colony-cooperative'
  | 'colony-wake'
  | 'colony-dusk';

/** Where the player is, as far as the music cares. */
export type MusicMood = 'title' | 'map' | 'system' | `colony-${ArchitectureId}`;

export const MUSIC_PIECES: readonly MusicPiece[] = [
  'title',
  'map-1',
  'map-2',
  'system',
  'colony-authority',
  'colony-cooperative',
  'colony-wake',
  'colony-dusk',
];

/** The pieces each mood plays, in turn. */
export const MOOD_PIECES: Record<MusicMood, readonly MusicPiece[]> = {
  title: ['title'],
  map: ['map-1', 'map-2'],
  system: ['system'],
  'colony-authority': ['colony-authority'],
  'colony-cooperative': ['colony-cooperative'],
  'colony-wake': ['colony-wake'],
  // The Concord, played from M6 (M6_ONE.md §24).
  'colony-dusk': ['colony-dusk'],
  // None until these peoples can be played and their colonies seen (M3_NEIGHBOURS.md §25, M5_UNKNOWN.md §27).
  'colony-drift': [],
  'colony-forge': [],
  'colony-hearth': [],
};

/** Seconds of quiet after a piece ends, before the next. */
export const SILENCE_SECONDS: Record<MusicMood, number> = {
  title: 20,
  map: 40,
  system: 20,
  'colony-authority': 20,
  'colony-cooperative': 20,
  'colony-wake': 20,
  'colony-dusk': 20,
  'colony-drift': 20,
  'colony-forge': 20,
  'colony-hearth': 20,
};

/** Seconds a change of mood takes to fade the old piece out and the new one in. */
export const FADE_SECONDS = 3;

/** How loud the music plays, under everything else (0 to 1). */
export const MUSIC_LEVEL = 0.45;

/** The pieces that have been approved and published (music/manifest.json; a test checks it). */
export const PUBLISHED_PIECES: readonly MusicPiece[] = [
  'title',
  'map-1',
  'map-2',
  'system',
  'colony-authority',
  'colony-cooperative',
  'colony-wake',
  'colony-dusk',
];

/** The mood for where the player is: a screen of the map (the map, a system, a colony) or any other screen. */
export function moodFor(place: {
  screen: 'map' | 'other';
  system?: boolean;
  colony?: ArchitectureId | null;
}): MusicMood {
  if (place.screen !== 'map') return 'title';
  if (place.colony) return `colony-${place.colony}`;
  return place.system ? 'system' : 'map';
}

/** The piece to play after `last` in a mood: the next in turn, or the first. */
export function nextPiece(mood: MusicMood, last: MusicPiece | null): MusicPiece | null {
  const pieces = MOOD_PIECES[mood].filter((p) => PUBLISHED_PIECES.includes(p));
  if (pieces.length === 0) return null;
  const at = last ? pieces.indexOf(last) : -1;
  return pieces[(at + 1) % pieces.length] ?? null;
}
