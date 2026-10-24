// The voices' casting (docs/design/VOICES.md §3, D-103): every part that speaks, described from its
// face, its power and its manner, with three candidates made from ElevenLabs' stock voices and shaped
// after generation. No voice is designed, cloned or added to the account (the owner, 24 October
// 2026); within a power each part has its own stock voice, and across powers a stock voice may serve
// again, shaped differently, since a player only ever hears the power they lead. The choice of each
// part is kept in voices/cast.json. All of it is fiction.

import { ADVISORS, type Department, LINES, type LineKind, type Voice } from '../src/content/advisors.ts';
import { RADIO, type RadioStage } from '../src/content/radio.ts';
import { SPOKEN, SPOKEN_RADIO, VOICED_FACTIONS, type VoicedFaction } from '../src/content/voices.ts';

/** ElevenLabs' stock voices, as the account listed them on 24 October 2026. */
export const STOCK = {
  sarah: { id: 'EXAVITQu4vr4xnSDxMaL', is: 'a woman: mature, reassuring, confident' },
  laura: { id: 'FGY2WhTYpPnrIDTdsKH5', is: 'a young woman: quirky, sassy' },
  alice: { id: 'Xb7hH8MSUJpSbSDYk0k2', is: 'a woman, British: clear, professional' },
  matilda: { id: 'XrExE9yKIg1WjnnlVkGX', is: 'a woman: knowledgeable, upbeat' },
  jessica: { id: 'cgSgspJ2msm6clMCkdW9', is: 'a young woman: playful, bright, warm' },
  bella: { id: 'hpp4J3VqNfWAUOO0d1Us', is: 'a woman: professional, bright, warm' },
  lily: { id: 'pFZP5JQG7iQjIQuC4Bku', is: 'a woman, British: velvety, confident' },
  roger: { id: 'CwhRBWXzGAHq8TQ4Fs17', is: 'a man: laid-back, resonant' },
  charlie: { id: 'IKne3meq5aSn9XLyUdCD', is: 'a young man, Australian: deep, energetic' },
  callum: { id: 'N2lVS1w4EtoT3dr4eOWO', is: 'a man: husky' },
  harry: { id: 'SOYHLrjzK2X1ezoPC6cr', is: 'a young man: fierce, rough' },
  liam: { id: 'TX3LPaxmHKxFdv7VOQHJ', is: 'a young man: energetic' },
  will: { id: 'bIHbv24MWmeRgasZH58o', is: 'a young man: relaxed' },
  eric: { id: 'cjVigY5qzO86Huf0OWal', is: 'a man: smooth, trustworthy' },
  chris: { id: 'iP95p4xoKVk53GoZ742B', is: 'a man: charming, down-to-earth' },
  brian: { id: 'nPczCjzI2devNBz1zQrb', is: 'a man: deep, resonant, comforting' },
  adam: { id: 'pNInz6obpgDQGcFmaJgB', is: 'a man: firm' },
  bill: { id: 'pqHfZKP75CvOlQylNhV4', is: 'an old man: wise, crisp' },
  river: { id: 'SAz9YHcvj6GT2YYXdXww', is: 'a calm, neutral voice' },
  // Kept for the trailer's narrator and the casting's announcer, never for a part.
  george: { id: 'JBFqnCBsd6RMkjVDRZzb', is: 'a man, British: a warm storyteller' },
  daniel: { id: 'onwK4e9ZLuTAKqWW03F9', is: 'a man, British: a steady broadcaster' },
} as const;
export type StockVoice = keyof typeof STOCK;

/** The model, and the delivery it is asked for (tags it does not speak), checked on 24 October 2026. */
export const VOICE_MODEL = 'eleven_v4';
export const DELIVERY: Record<VoicedFaction, { advisor: string; radio: string }> = {
  sta: { advisor: '[measured, formal]', radio: '[crisp, military, over the radio]' },
  frontier: { advisor: '[warm, friendly]', radio: '[tired, earnest, over the radio]' },
  'hollow-wake': { advisor: '[gruff, blunt]', radio: '[rough, hurried, over the radio]' },
  'dusk-concord': { advisor: '[slow, calm, patient]', radio: '[slow, solemn, over the radio]' },
};

/** How a take is shaped after it is made: ffmpeg filters on 44.1 kHz audio, each kept with its clip. */
export type Shape = 'plain' | 'deeper' | 'lighter' | 'radio' | 'deeper-radio' | 'concord' | 'concord-radio';
const RATE = 44100;
/** The pitch and the timbre moved together by a factor, the pace kept (or changed by `tempo`). */
const pitch = (f: number, tempo = 1) =>
  `asetrate=${RATE}*${f},aresample=${RATE},atempo=${((1 / f) * tempo).toFixed(4)}`;
const RADIO_BAND = 'highpass=f=320,lowpass=f=3300,acompressor=threshold=0.1:ratio=4:attack=5:release=80,volume=1.6';
const CONCORD = `asplit=2[a][b];[a]${pitch(0.88, 0.92)}[m];[b]${pitch(0.78, 0.92)},volume=0.3[s];[m][s]amix=inputs=2:duration=longest:normalize=0,aecho=0.8:0.5:60:0.2,lowpass=f=7500`;
export const SHAPES: Record<Shape, string> = {
  plain: 'anull',
  deeper: pitch(0.94),
  lighter: pitch(1.05),
  radio: RADIO_BAND,
  'deeper-radio': `${pitch(0.94)},${RADIO_BAND}`,
  concord: CONCORD,
  'concord-radio': `${CONCORD},${RADIO_BAND}`,
};

export interface Candidate {
  voice: StockVoice;
  shape: Shape;
}
export type Role = Department | 'landing' | 'garrison';
export interface Part {
  id: string;
  faction: VoicedFaction;
  role: Role;
  /** Who speaks, as the game names them. */
  who: string;
  /** From the face, the power and the manner. */
  description: string;
  candidates: readonly [Candidate, Candidate, Candidate];
}

const c = (voice: StockVoice, shape: Shape = 'plain'): Candidate => ({ voice, shape });
const C = (...cs: [Candidate, Candidate, Candidate]) => cs;

/** Each part's description and candidates, by power and role. */
const CAST: Record<VoicedFaction, Record<Role, [string, readonly [Candidate, Candidate, Candidate]]>> = {
  sta: {
    colonies: [
      'A woman of about sixty: measured and civil, warm under the formality.',
      C(c('alice', 'deeper'), c('lily', 'deeper'), c('sarah', 'deeper')),
    ],
    works: ['A man of about forty-five, an engineer: plain, steady, practical.', C(c('eric'), c('adam'), c('roger'))],
    treasury: [
      'A woman of about sixty-five, the Comptroller: precise, dry, careful with every word.',
      C(c('lily', 'deeper'), c('matilda', 'deeper'), c('sarah')),
    ],
    science: [
      'A man in his fifties, the Chief Scientist: thoughtful, exact, quietly enthusiastic.',
      C(c('bill', 'lighter'), c('eric', 'deeper'), c('river')),
    ],
    survey: [
      'A woman in her early thirties, Commander of the Survey: brisk, keen, confident.',
      C(c('jessica'), c('bella'), c('laura')),
    ],
    watch: [
      'A man of about sixty, Inspector of the Watch: grave, watchful, economical.',
      C(c('bill'), c('brian'), c('adam', 'deeper')),
    ],
    envoy: ['A woman of about forty, a diplomat: careful, courteous, composed.', C(c('lily'), c('alice'), c('bella'))],
    admiral: [
      'A woman of about fifty, a rear admiral: firm, controlled, used to command.',
      C(c('sarah'), c('matilda'), c('alice', 'deeper')),
    ],
    landing: [
      'A landing group commander over the radio: crisp, by the book.',
      C(c('adam', 'radio'), c('charlie', 'radio'), c('harry', 'radio')),
    ],
    garrison: [
      'A garrison commander over the radio: steady, drilled, unshaken.',
      C(c('eric', 'radio'), c('roger', 'radio'), c('brian', 'radio')),
    ],
  },
  frontier: {
    colonies: [
      'A woman in her fifties of the Settlement table: warm, motherly, practical.',
      C(c('bella'), c('sarah'), c('matilda')),
    ],
    works: [
      'A man of about thirty-five, a builder: cheerful, proud of the work.',
      C(c('chris'), c('will'), c('charlie')),
    ],
    treasury: [
      'A man of about seventy, keeper of the Common Purse: gentle, wise, a little wry.',
      C(c('bill'), c('roger', 'deeper'), c('brian')),
    ],
    science: [
      'A young woman of about thirty of the Learning table: bright, eager, curious.',
      C(c('jessica'), c('laura'), c('bella', 'lighter')),
    ],
    survey: [
      'A man in his fifties of the Pathfinders: warm, easy, a storyteller.',
      C(c('brian'), c('chris', 'deeper'), c('roger')),
    ],
    watch: [
      'A woman of about forty-five of the Lookouts: calm, plain-spoken, observant.',
      C(c('matilda'), c('alice'), c('sarah')),
    ],
    envoy: [
      'A man in his fifties of the Welcome table: kind, unhurried, generous.',
      C(c('roger'), c('eric'), c('bill')),
    ],
    admiral: [
      'A man in his forties of the Defence table: steady, reluctant to fight, reassuring.',
      C(c('eric'), c('adam'), c('chris')),
    ],
    landing: [
      'A landing warden over the radio: tired, earnest, nobody wanted this.',
      C(c('will', 'radio'), c('chris', 'radio'), c('liam', 'radio')),
    ],
    garrison: [
      'A militia warden over the radio: steady, protective of their people.',
      C(c('sarah', 'radio'), c('bella', 'radio'), c('matilda', 'radio')),
    ],
  },
  'hollow-wake': {
    colonies: [
      'A woman in her sixties who keeps the holds: gruff, short, unsentimental.',
      C(c('sarah', 'deeper'), c('matilda', 'deeper'), c('lily', 'deeper')),
    ],
    works: [
      'A young man of about thirty, chief welder: cocky, quick, a grin in it.',
      C(c('liam'), c('harry'), c('charlie')),
    ],
    treasury: [
      'A man of about fifty who counts the takings: sly, smooth, amused.',
      C(c('callum'), c('roger'), c('eric', 'lighter')),
    ],
    science: [
      'A woman of about seventy, doctor and scientist: dry, sharp, impatient.',
      C(c('lily', 'deeper'), c('alice', 'deeper'), c('matilda')),
    ],
    survey: [
      'A young woman in her late twenties, the navigator: cool, quick, half a smile.',
      C(c('laura'), c('jessica'), c('bella')),
    ],
    watch: [
      'A hooded man of about forty who keeps watch: low, quiet, suspicious.',
      C(c('callum', 'deeper'), c('adam', 'deeper'), c('harry', 'deeper')),
    ],
    envoy: [
      'A woman in her thirties who does the talking: smooth, wry, dangerous.',
      C(c('lily'), c('laura', 'deeper'), c('bella', 'deeper')),
    ],
    admiral: ['A man in his forties who runs the guns: hard, loud, impatient.', C(c('adam'), c('harry'), c('callum'))],
    landing: [
      'A boarding boss over the radio: rough, hungry, in a hurry.',
      C(c('harry', 'radio'), c('callum', 'radio'), c('charlie', 'radio')),
    ],
    garrison: [
      'A dock boss over the radio: hard, flat, unafraid.',
      C(c('adam', 'radio'), c('brian', 'radio'), c('roger', 'radio')),
    ],
  },
  'dusk-concord': {
    colonies: [
      'One who speaks for the Settled, of a people that are not human: slow, deep, patient, kind.',
      C(c('brian', 'concord'), c('bill', 'concord'), c('roger', 'concord')),
    ],
    works: [
      'One who speaks for the Builders, not human: slow, deep, steady.',
      C(c('adam', 'concord'), c('eric', 'concord'), c('chris', 'concord')),
    ],
    treasury: [
      'One who keeps the Stores, not human: slow, careful, quiet.',
      C(c('matilda', 'concord'), c('sarah', 'concord'), c('bella', 'concord')),
    ],
    science: [
      'One who speaks for the Learned, not human: slow, wondering, soft.',
      C(c('river', 'concord'), c('alice', 'concord'), c('lily', 'concord')),
    ],
    survey: [
      'One who speaks for the Wayfarers, not human: slow, far-seeing, light.',
      C(c('charlie', 'concord'), c('will', 'concord'), c('liam', 'concord')),
    ],
    watch: [
      'One who speaks for the Watchers, not human: slow, low, wary.',
      C(c('callum', 'concord'), c('harry', 'concord'), c('adam', 'concord')),
    ],
    envoy: [
      'First Voice, who speaks to strangers, not human: slow, grave, courteous.',
      C(c('lily', 'concord'), c('alice', 'concord'), c('sarah', 'concord')),
    ],
    admiral: [
      'One who speaks for the Guardians, not human: slow, deep, unyielding.',
      C(c('brian', 'concord'), c('adam', 'concord'), c('bill', 'concord')),
    ],
    landing: [
      'The keeper of the descent over the radio, not human: slow, solemn.',
      C(c('bill', 'concord-radio'), c('brian', 'concord-radio'), c('roger', 'concord-radio')),
    ],
    garrison: [
      'The keeper of the ring over the radio, not human: slow, enduring.',
      C(c('eric', 'concord-radio'), c('adam', 'concord-radio'), c('callum', 'concord-radio')),
    ],
  },
};

const ROLES: readonly Role[] = [
  'colonies',
  'works',
  'treasury',
  'science',
  'survey',
  'watch',
  'envoy',
  'admiral',
  'landing',
  'garrison',
];

function whoOf(f: VoicedFaction, role: Role): string {
  if (role === 'landing' || role === 'garrison')
    return `${RADIO[f][role].charAt(0).toUpperCase()}${RADIO[f][role].slice(1)}`;
  const a = ADVISORS[f].people[role];
  return `${a.name}, ${a.role}`;
}

export const PARTS: readonly Part[] = VOICED_FACTIONS.flatMap((faction) =>
  ROLES.map((role) => ({
    id: `${faction}-${role}`,
    faction,
    role,
    who: whoOf(faction, role),
    description: CAST[faction][role][0],
    candidates: CAST[faction][role][1],
  })),
);

/** The two lines each candidate reads at the casting: kinds for an advisor, stages for a commander. */
const AUDITION: Record<Role, readonly [LineKind, LineKind] | readonly [RadioStage, RadioStage]> = {
  colonies: ['founded', 'hungry'],
  works: ['built', 'idle-yard'],
  treasury: ['debt', 'debt-coming'],
  science: ['no-research', 'researched'],
  survey: ['surveyed', 'investigated'],
  watch: ['rival-ship', 'rival-tech'],
  envoy: ['contact-words', 'offer-refused'],
  admiral: ['battle-lost', 'warship-built'],
  landing: ['landing', 'won'],
  garrison: ['sighted', 'held'],
};

/** The words a part reads at its casting, in its power's manner. */
export function auditionLines(part: Part): [string, string] {
  if (part.role === 'landing' || part.role === 'garrison') {
    const [a, b] = AUDITION[part.role] as readonly [RadioStage, RadioStage];
    return [SPOKEN_RADIO[part.faction][a], SPOKEN_RADIO[part.faction][b]];
  }
  const manner: Voice = ADVISORS[part.faction].voice;
  const [a, b] = AUDITION[part.role] as readonly [LineKind, LineKind];
  return [SPOKEN[a][manner] ?? LINES[a][manner], SPOKEN[b][manner] ?? LINES[b][manner]];
}

/** The delivery tags for a part. */
export function deliveryOf(part: Part): string {
  return part.role === 'landing' || part.role === 'garrison'
    ? DELIVERY[part.faction].radio
    : DELIVERY[part.faction].advisor;
}
