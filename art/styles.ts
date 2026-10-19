// The art direction for generated pictures, one style per series. Every prompt is this style plus a
// brief's subject (art/briefs.ts), so a series looks like one hand made it. Draft until the owner
// picks a direction from the style test (docs/ART_PIPELINE.md, "Style test").

import type { Aspect } from '../scripts/art/providers.ts';

export type SeriesId = 'portrait' | 'illustration';

export interface SeriesStyle {
  /** Shape of every picture in the series. */
  aspect: Aspect;
  /** Widths the approved picture is published at, smallest for phones. */
  widths: number[];
  /** The look, written as direction to the model. */
  style: string;
  /** What must never appear. Neither service takes a separate negative prompt, so this is appended. */
  avoid: string;
}

const AVOID_ALWAYS = 'text, letters, numbers, logos, signatures, watermarks, frames, borders, user-interface elements';

export const SERIES: Record<SeriesId, SeriesStyle> = {
  portrait: {
    aspect: '2:3',
    widths: [384, 768],
    style: [
      'A painted science-fiction character portrait for a strategy game.',
      'Head and shoulders, three-quarter view, looking just past the viewer.',
      'Grounded and believable: practical clothing and equipment with real materials and wear.',
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
};
