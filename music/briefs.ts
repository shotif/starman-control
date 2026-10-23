// What to compose (docs/design/MUSIC.md §1, D-31). Every piece is an original instrumental for the
// game, generated with Google's Lyria; no brief names an artist, a composer or a work (CLAUDE.md).

import type { MusicPiece } from '../src/content/music.ts';

export interface MusicBrief {
  id: MusicPiece;
  /** What the piece is: instruments, tempo, key, mood and shape. */
  subject: string;
  /** Why the game needs it, for the reviewer; not sent to the model. */
  purpose: string;
}

/** Said of every piece, so the seven belong together. */
export const MUSIC_STYLE = [
  'An original instrumental piece of music for a calm, thoughtful science-fiction strategy game set among the real nearby stars.',
  'About two and a half minutes long. Cinematic but restrained, spacious and warm, mixed to sit quietly under a game:',
  'no sudden loud hits, no build-ups to a big drop. It begins softly and ends by fading gently to silence.',
  'Instrumental only: no vocals, no singing, no humming, no spoken words, no choir.',
].join(' ');

export const MUSIC_BRIEFS: MusicBrief[] = [
  {
    id: 'title',
    subject:
      'The main theme. Slow, about 70 BPM, in D major. [0:00 - 0:30] a soft bed of synthesiser pads and a distant low string drone; ' +
      '[0:30 - 1:30] a clear, memorable melody on solo French horn, answered by strings, growing to a hopeful, wide statement with the full string section and gentle timpani; ' +
      '[1:30 - 2:30] the melody returns softly on piano over the pads, and the piece settles and fades.',
    purpose: 'The title, the new-game screen, the codex and the saves: the game’s own theme.',
  },
  {
    id: 'map-1',
    subject:
      'Calm, spacious ambient music for thinking. Very slow, about 60 BPM, in A minor drifting to C major. Long evolving synthesiser pads, ' +
      'a soft felt piano playing a sparse, patient figure, distant glassy bells now and then, a low warm drone. No drums, no percussion.',
    purpose: 'The map, the long hours of the game: first of two pieces that take turns.',
  },
  {
    id: 'map-2',
    subject:
      'Calm, spacious ambient music for thinking. Very slow, about 60 BPM, in E Dorian. A harp playing slow broken chords over soft string ' +
      'pads, a gentle solo cello line in the middle, airy textures like starlight, a low warm drone. No drums, no percussion.',
    purpose: 'The map: second of two pieces that take turns, so the music does not wear thin.',
  },
  {
    id: 'system',
    subject:
      'Music of wonder and vast scale, looking at a star and its worlds up close. Slow and floating, about 55 BPM, in F Lydian. Deep slow ' +
      'drones, shimmering glassy textures, a slow rising line on strings and synthesiser that opens out like a sunrise, then sinks back.',
    purpose: 'The 3D system view: a star and its worlds.',
  },
  {
    id: 'colony-authority',
    subject:
      'Orderly, civic and dignified music for a well-run settlement. Moderate, about 80 BPM, in B-flat major. A measured string ensemble ' +
      'playing in steady even rhythm, warm low brass chords, a crisp snare played softly with brushes, a noble, confident melody on trumpet in the middle.',
    purpose: 'A colony of the Sol Transit Authority: its character, civic and orderly.',
  },
  {
    id: 'colony-cooperative',
    subject:
      'Warm, communal, hopeful music for a hand-built frontier settlement. Easy, about 90 BPM, in G major. Fingerpicked acoustic guitar, ' +
      'hand percussion and a soft frame drum, a wooden flute melody, a mandolin, open fifths on fiddle, the feeling of people working together.',
    purpose: 'A colony of the Frontier Cooperative: its character, warm and communal.',
  },
  {
    id: 'colony-wake',
    subject:
      'Low, tough and weathered music for a raiders’ settlement built from salvage. Slow and heavy, about 72 BPM, in D minor. A slow ' +
      'deep pulse, metallic percussion like struck pipes and chains played softly, a lonely, reverberant electric guitar line, a dusty low synthesiser drone.',
    purpose: 'A colony of the Hollow Wake: its character, low and tough.',
  },
  // M6_ONE.md §24 (D-81): the Concord, the first power to lead that is not human, an invented people.
  {
    id: 'colony-dusk',
    subject:
      'Patient, ancient and communal music for a settlement of an invented people who live in the endless dusk of a world that never turns. ' +
      'Very slow, about 56 BPM, in E Dorian. A low bowed drone like a deep string held for a long time, soft resonant frame drums struck slowly and far apart, ' +
      'a wooden flute with a breathy tone playing a long, unhurried melody, plucked strings answering it now and then, warm and a little mysterious; ' +
      'it never hurries, and the dusk never ends.',
    purpose: 'A colony of the Dusk Concord: its character, patient and very old (fiction).',
  },
];

/** The prompt sent for a piece: the shared style, then the piece. */
export function musicPrompt(brief: MusicBrief): string {
  return `${MUSIC_STYLE}\n\n${brief.subject}`;
}
