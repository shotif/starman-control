// The art direction for generated pictures, one style per series. Every prompt is this style plus a
// brief's subject (art/briefs.ts), so a series looks like one hand made it. Chosen by the owner
// from the style test (D-23): this style, with the default model for every series.

import type { KeySpec } from '../scripts/art/keying.ts';
import type { Aspect } from '../scripts/art/providers.ts';

export type SeriesId = 'portrait' | 'illustration' | 'landscape' | 'structure' | 'prop';

export interface SeriesStyle {
  /** Shape of every picture in the series. */
  aspect: Aspect;
  /** Widths the approved picture is published at, smallest for phones. */
  widths: number[];
  /** The look, written as direction to the model. */
  style: string;
  /** What must never appear. Neither service takes a separate negative prompt, so this is appended. */
  avoid: string;
  /**
   * For pictures the game lays over its own drawing: the flat backdrop the style asks for (its
   * `{backdrop}`), keyed to transparency when approved (scripts/art/keying.ts).
   */
  key?: KeySpec;
}

const AVOID_ALWAYS =
  'text, letters, numbers, logos, signatures, watermarks, frames, borders, black letterbox bars, user-interface elements';

export const SERIES: Record<SeriesId, SeriesStyle> = {
  portrait: {
    aspect: '2:3',
    widths: [384, 768],
    style: [
      'A painted science-fiction character portrait for a strategy game.',
      'Head and shoulders, three-quarter view, looking just past the viewer.',
      'Grounded and believable: practical clothing and equipment with real materials and wear;',
      'any insignia or badges are plain geometric shapes.',
      'One warm key light from the side and a thin cool cyan rim light;',
      'a deep navy-black background with a faint, softly blurred field of stars.',
      'Muted palette, rich shadows, fine painterly brushwork, calm and observant mood.',
    ].join(' '),
    avoid: `${AVOID_ALWAYS}, cartoon or anime style, glossy plastic skin, fantasy armour, extra fingers`,
  },
  illustration: {
    aspect: '3:2',
    widths: [640, 1280],
    style: [
      'A painted widescreen illustration for a strategy game event.',
      'Grounded science fiction among real stars: believable ships, stations and worlds, true scale and starlight.',
      'One clear focal point that still reads on a small phone screen.',
      'A muted palette of deep navy, slate and warm starlight with small cyan accents.',
      'Painterly and cinematic, quiet rather than explosive.',
    ].join(' '),
    avoid: `${AVOID_ALWAYS}, lens flares, cartoon style, busy clutter`,
  },
  // The colony view (COLONY_VIEW.md §3): a world's ground, under a sky the game draws itself, and
  // the buildings set out on it, each cut out of a flat backdrop.
  landscape: {
    aspect: '21:9',
    widths: [1280, 2560],
    style: [
      'A painted panoramic matte painting of the surface of a world, for a strategy game.',
      'Seen from a raised viewpoint on a hillside some thirty metres up, looking down across a wide, level, open plain',
      'towards hills or mountains on the horizon. The horizon is straight and level, about a quarter of the way down the picture.',
      "Below it, a broad, flat, empty plain of the world's own ground fills most of the picture, with nothing on it: room for a town.",
      'Seen from above, the ground nearby is fine-grained, with no large plants or rocks close to the viewer.',
      'Grounded, believable geology at true scale, with fine natural detail.',
      'The sky is {backdrop}, with no clouds, sun, moons or stars, because the game paints its own sky;',
      'the land is lit softly by neutral daylight from the upper left.',
      'A muted, natural palette; painterly and cinematic, fine brushwork.',
    ].join(' '),
    avoid: `${AVOID_ALWAYS}, buildings, ruins, people, vehicles, roads, clouds, the sun, moons or planets in the sky, a tilted or curved horizon, lens flares, cartoon style`,
    key: { backdrop: 'white', mode: 'sky' },
  },
  structure: {
    aspect: '1:1',
    widths: [256, 512, 1024],
    style: [
      "A single building for a strategy game's colony view, painted in a realistic matte-painting style, not as a stylised game icon.",
      'Seen from some way off and only a little above, as from a low rise: a three-quarter view from the front left,',
      'looking down at a shallow angle of about fifteen degrees, so its walls are seen more than its roof.',
      'Lit from the upper left, with warm lit windows.',
      'The whole building is in frame with clear space all round it. It stands at ground level and is cut off cleanly at its base:',
      'no block of earth, plinth, platform edge or floating island under it.',
      'All round it is a {backdrop} background: no surrounding ground, no cast shadow and nothing else in the picture.',
      'Grounded, believable science-fiction architecture with real materials and wear, like concept art for a film,',
      'with doors and windows sized for people so that it reads at its true size.',
      'Muted palette, painterly brushwork, crisp clean edges against the background.',
    ].join(' '),
    avoid: `${AVOID_ALWAYS}, ground, terrain, grass, shadows on the ground, people, vehicles, a second building, a block of soil or rock under the building, a floating island, an isometric game-tile look, magenta or pink on the building itself, cartoon style, glossy toy-like plastic`,
    key: { backdrop: 'magenta', mode: 'cutout' },
  },
  // Small pieces between the buildings (COLONY_VIEW.md §9.3), cut out like them and drawn small.
  prop: {
    aspect: '1:1',
    widths: [256, 512],
    style: [
      "A single small piece of colony equipment for a strategy game's colony view, painted in a realistic matte-painting style, not as a stylised game icon.",
      'Seen from some way off and only a little above, as from a low rise: a three-quarter view from the front left,',
      'looking down at a shallow angle of about fifteen degrees, so its sides are seen more than its top.',
      'Lit from the upper left, with any lamps or lit panels glowing warmly.',
      'The whole object is in frame with clear space all round it. It stands at ground level and is cut off cleanly at its base:',
      'no block of earth, plinth, platform edge or floating island under it.',
      'All round it is a {backdrop} background: no surrounding ground, no cast shadow and nothing else in the picture.',
      'Grounded, believable science-fiction equipment with real materials and wear, like concept art for a film,',
      'with ladders, doors and railings sized for people so that it reads at its true size.',
      'Muted palette, painterly brushwork, crisp clean edges against the background.',
    ].join(' '),
    avoid: `${AVOID_ALWAYS}, ground, terrain, grass, shadows on the ground, people, vehicles, buildings, a block of soil or rock under it, a floating island, an isometric game-tile look, magenta or pink on the object itself, cartoon style, glossy toy-like plastic`,
    key: { backdrop: 'magenta', mode: 'cutout' },
  },
};
