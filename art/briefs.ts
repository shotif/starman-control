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
  // The first pictures for the game (D-26, VISUAL_DIRECTION.md §4, increment 9): each power's scene
  // and leader, for the new-game screen. The places are real; everything built there is fiction.
  {
    id: 'power-sta-scene',
    series: 'illustration',
    subject:
      'High orbit over Earth at dawn: a vast wheel-shaped customs station with green navigation lights, ' +
      'cargo ships waiting in an orderly line of lights towards a slender lane beacon; the Sun rising over ' +
      'the curve of the Earth, the Moon small and grey in the distance.',
    purpose: 'New-game screen: the Sol Transit Authority at home (Earth, D-20).',
  },
  {
    id: 'power-frontier-scene',
    series: 'illustration',
    subject:
      'A settlement of the Frontier Cooperative on a warm, hazy super-Earth: clusters of white habitat domes ' +
      'and green terraced farms on rolling hills, a shared landing field with small ships under blue lights, ' +
      'a pale yellow-orange sun a little smaller than ours in a golden, dusty sky.',
    purpose: 'New-game screen: the Frontier Cooperative at home (Tau Ceti e, D-24).',
  },
  {
    id: 'power-wake-scene',
    series: 'illustration',
    subject:
      'A raiders’ den in the dark: a hollowed asteroid fitted with docking arms and floodlights, patched-together ' +
      'ships with red running lights, sparks from welding; a small dim red dwarf sun and the dark crescent of ' +
      'a large rocky planet beyond.',
    purpose: 'New-game screen: the Hollow Wake at home (Wolf 1061 and Wolf 1061 c, D-24).',
  },
  {
    id: 'power-sta-leader',
    series: 'portrait',
    subject:
      'The Director of the Sol Transit Authority, a calm man in his sixties with a neatly trimmed white beard, ' +
      'in a dark green civil-service uniform with plain geometric insignia; composed, watchful, a little weary.',
    purpose: 'New-game screen: the face of the Authority.',
  },
  {
    id: 'power-frontier-leader',
    series: 'portrait',
    subject:
      'An elected Elder of the Frontier Cooperative, a woman in her forties with sun-weathered skin and braided ' +
      'dark hair, in a practical blue work jacket with a small round pin; warm, determined, ready to argue.',
    purpose: 'New-game screen: the face of the Cooperative.',
  },
  {
    id: 'power-wake-leader',
    series: 'portrait',
    subject:
      'The chief of the Hollow Wake raiders, a lean woman in her thirties with a shaved head and a thin faded ' +
      'scar at her temple, in a patched dark red flight jacket; a cool, appraising, faintly amused look.',
    purpose: 'New-game screen: the face of the Wake.',
  },
];
