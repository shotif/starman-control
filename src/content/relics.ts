// Relic sites and the mystery of the Absent (M5_UNKNOWN.md §4, §20, D-13, D-70), as data: the six
// kinds of site, each with three chapters and the second choice of its own, and the twelve
// revelations every power reads in order. Every word of it is fiction, written in Starman Reborn's
// voice; it echoes Reborn's derelicts ("switched off, carefully"), its carrier tones and Pyre. No
// line says anything of the real star or body a site lies at.

import type { FactionId } from './factions.ts';

export type RelicKind = 'vault' | 'dust' | 'array' | 'moon' | 'charts' | 'beacon';

/** A kind's second choice in every chapter (§20.4): a resource, or the charts followed. */
export type RelicGift = 'metals' | 'volatiles' | 'fuel' | 'charts';

export interface RelicKindDef {
  id: RelicKind;
  name: string;
  /** What the survey that finds it says. */
  seen: string;
  /** Each chapter's lines, the first to the third. */
  chapters: readonly [string, string, string];
  /** The second choice: its name, and what it gives. */
  second: string;
  gives: RelicGift;
}

export const RELIC_KINDS: Record<RelicKind, RelicKindDef> = {
  vault: {
    id: 'vault',
    name: 'A vault',
    seen: 'A door, square and sealed, where no one has ever built.',
    chapters: [
      'The door opens when your crew stops trying to open it. Beyond it a corridor is lit, though nothing in it draws power.',
      'Rooms, one after another, each empty and swept. Racks on the walls hold nothing. Every rack is the same height, a little above where a person would reach.',
      'The last room was sealed from the inside. On a single shelf lies one object, which no one can lift until they stop trying to.',
    ],
    second: 'Take what can be moved',
    gives: 'metals',
  },
  dust: {
    id: 'dust',
    name: 'A field of ordered dust',
    seen: 'A cloud of fine dust where none should be, every grain the same size.',
    chapters: [
      'The dust moves against the light. Not much, and not fast, but against it.',
      'Gathered in a jar, it settles into rings. Shaken, it settles into the same rings again.',
      'At the heart of the field the dust lies thickest, and in it is a hollow the exact shape of something that was taken away.',
    ],
    second: 'Gather it',
    gives: 'volatiles',
  },
  array: {
    id: 'array',
    name: 'An array',
    seen: 'Thin rods in a lattice many kilometres across, every one pointing the same way.',
    chapters: [
      'The rods all point to the same place in the southern sky, to within a hair. Your engineers check the bearing three times.',
      'Power still runs in the lattice: very little, very steady, and from nowhere your engineers can find.',
      'When the last rod is cleaned the lattice hums once, and every instrument aboard records the same slow tone.',
    ],
    second: 'Salvage its power',
    gives: 'fuel',
  },
  moon: {
    id: 'moon',
    name: 'A hollow moon',
    seen: 'A small moon no catalogue lists, too light for its size.',
    chapters: [
      'It is hollow, as the survey said. The way in is a shaft cut so cleanly that the rock beside it still shines.',
      'Inside, galleries ring a great central space, and in the space there is nothing, held very carefully.',
      'On the floor of the deepest gallery stands a ring of seats, all facing inward. Something was meant to be in the middle. Your crew leaves a light there when they go.',
    ],
    second: 'Take what can be moved',
    gives: 'metals',
  },
  charts: {
    id: 'charts',
    name: 'A hall of charts',
    seen: 'A long hall of flat panels, each covered in points of light.',
    chapters: [
      'The points are stars: the nearby stars, but not quite where they are now.',
      'Your astronomers measure how far each star has moved since. Every one of them agrees on the age of the charts, and none of them likes the number.',
      'The last panel shows the neighbourhood with lines drawn between the stars. A few are your lanes. Most are older.',
    ],
    second: 'Follow the charts',
    gives: 'charts',
  },
  beacon: {
    id: 'beacon',
    name: 'A quiet beacon',
    seen: 'A beacon no one tuned, sending nothing at all, very precisely.',
    chapters: [
      'It is older than the lanes. Your crew knows beacons, and this one is shaped like theirs as a bird is shaped like an aircraft.',
      'It is listening, not sending. Whatever it waits for is slow: its timers count in centuries.',
      'Since your crew arrived it has turned by a degree. It points toward Phoenix, past the edge of every chart you own.',
    ],
    second: 'Salvage its power',
    gives: 'fuel',
  },
};

export const RELIC_KIND_IDS = Object.keys(RELIC_KINDS) as RelicKind[];

/** Every chapter's first choice (§20.4). */
export const STUDY_IT = 'Study it';

/**
 * The twelve revelations (§4, §20.5), the same in every game, read one with each chapter a power
 * completes; a species that sees it otherwise has its own words.
 */
export const REVELATIONS: readonly { text: string; own?: Partial<Record<FactionId, string>> }[] = [
  {
    text: 'Someone was here before us. Not human, and not anyone we have met. They left no name we can read, so the powers have begun to call them the Absent.',
  },
  {
    text: 'What the Absent left is tidy. Doors shut, rooms swept, nothing dropped. Whatever happened, they were not in a hurry.',
  },
  {
    text: 'Many of their places are at the dead stars, the white dwarfs: the embers of stars that burned out. A dead star is a quiet place, and stays quiet for a very long time.',
  },
  {
    text: 'Their charts show the nearby stars where they stood long ago. Measured against the sky today, the charts are far older than any people we know of.',
  },
  {
    text: 'Under the carrier tones of the old beacons there is a second tone. It is slower than any signal a person would send, and it has not stopped.',
    own: {
      'dusk-concord':
        'Under the carrier tones of the old beacons there is a second tone. Our elders call it a clock: it keeps time for something that has not yet happened.',
      'drift-moot':
        'Under the carrier tones of the old beacons there is a second tone. To us it sounds like weather far off: a front that has been coming for a very long time.',
    },
  },
  {
    text: 'The second tone comes from one direction: toward Phoenix, where Pyre burned. As far as the old recordings tell, it began when Pyre died.',
  },
  {
    text: 'Their machines are not broken. They were switched off, carefully, as if someone meant to come back for them.',
  },
  {
    text: 'Some of what they left is waiting. Not for them: they took everything they wanted. For whoever comes next.',
  },
  {
    text: 'A few of their places hold pieces of one thing. Each piece is shaped to fit another, and none fits anything of ours.',
  },
  {
    text: 'Put together, the pieces would make an instrument: an instrument for answering a tone.',
    own: {
      'dusk-concord': 'Put together, the pieces would make an instrument: a hand to move the clock.',
    },
  },
  {
    text: 'No one knows what would hear the answer. The tone does not say. It only goes on.',
  },
  {
    text: 'Whoever answers will be heard. That is all anyone can say of it, and it is not enough to say no.',
  },
];

/** A revelation as a power reads it (§20.5): the n-th, from 1. */
export function revelationFor(n: number, faction: FactionId): string {
  const r = REVELATIONS[Math.min(Math.max(n, 1), REVELATIONS.length) - 1];
  return r?.own?.[faction] ?? r?.text ?? '';
}
