// What to paint. A brief names a series (its style is in art/styles.ts) and a subject. Everything a
// brief depicts is fiction; real astronomy in a picture must match the real sky (CLAUDE.md).

import type { SeriesId } from './styles.ts';

export interface ArtBrief {
  /** Unique, lowercase words joined by hyphens; also the published file name. */
  id: string;
  series: SeriesId;
  /** What is in the picture: who or what, doing what, where. */
  subject: string;
  /** Why the game needs it, for the reviewer; not sent to the model. */
  purpose: string;
}

export const BRIEFS: ArtBrief[] = [
  // The style test: the same four subjects from both services, so the owner can choose a direction
  // and a provider before any picture goes into the game.
  {
    id: 'style-test-authority-officer',
    series: 'portrait',
    subject:
      'A senior officer of the Sol Transit Authority, a woman in her fifties with close-cropped grey hair, ' +
      'in a dark green civil-service uniform with a small brass insignia at the collar; tired, patient, sharp-eyed.',
    purpose: 'Style test: a human leader portrait (the Authority).',
  },
  {
    id: 'style-test-wake-captain',
    series: 'portrait',
    subject:
      'A Hollow Wake raider captain, a man in his thirties with a weathered face and an old scar along the jaw, ' +
      'in a flight jacket patched together from different ships, a wary half-smile.',
    purpose: 'Style test: a human leader portrait (the Wake).',
  },
  {
    id: 'style-test-twilight-colony',
    series: 'illustration',
    subject:
      'A small frontier colony on the twilight band of a tidally locked planet orbiting a red dwarf: ' +
      'domes and greenhouses in ruddy half-light, the large dim red sun low and unmoving on the horizon, ' +
      'a cargo ship lifting off on a thin trail.',
    purpose: 'Style test: an event illustration (a colony on a red dwarf world).',
  },
  {
    id: 'style-test-relic',
    series: 'illustration',
    subject:
      "In the dark between stars, a small survey ship's floodlights fall on an enormous ancient structure " +
      'of no human make: smooth, dark, partly broken, many times larger than the ship. Quiet and uneasy.',
    purpose: 'Style test: a relic illustration (the precursor mystery).',
  },
];
