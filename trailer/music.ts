// The trailer's music (docs/design/TRAILER.md §8, D-93): one cue from Lyria 3.5, written as timed
// sections to the cut, in the title theme's instruments. Four candidates (about $0.32, inside D-27),
// each measured section by section against the shape the cut wants; recorded in trailer/manifest.json.
//
//   node trailer/music.ts [--count 4]

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { apiKey, missingKeyHelp } from '../scripts/art/env.ts';
import { duration, ffmpeg, loudness } from '../scripts/media.ts';
import { DEFAULT_MUSIC_MODEL, lyriaRequest, parseLyria } from '../scripts/music/lyria.ts';
import { readAssets, upsert, writeAssets } from './records.ts';

const OUT = resolve(import.meta.dirname, 'out');
const DIR = resolve(OUT, 'music');
/** Lyria 3.5's price a piece (Gemini's pricing page, 24 October 2026). */
const PRICE = 0.08;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** The cut's sections: from, to, what plays, and how loud it should feel (0 quiet to 1 full). */
export const SECTIONS: readonly { from: number; to: number; music: string; level: number }[] = [
  {
    from: 0,
    to: 16,
    music:
      'near silence opening into a high, soft synthesiser pad; a single slow piano figure; distant bells. Calm and awed.',
    level: 0.15,
  },
  {
    from: 16,
    to: 35,
    music:
      'a slow pulse enters under warm strings; the main melody is stated for the first time, gently and hopefully.',
    level: 0.4,
  },
  {
    from: 35,
    to: 60,
    music: 'the colour changes: a low bowed drone and a breathy wooden flute take over, strange, patient and old.',
    level: 0.4,
  },
  {
    from: 60,
    to: 77,
    music: 'tension: a low steady pulse, taut low strings, muted horns, a build that keeps growing.',
    level: 0.75,
  },
  {
    from: 77,
    to: 85,
    music: 'the build at its height, the fullest it has been, then it cuts away suddenly.',
    level: 0.9,
  },
  {
    from: 85,
    to: 101,
    music: 'almost nothing: glassy high textures and one long held note, mysterious and still.',
    level: 0.15,
  },
  { from: 101, to: 110, music: 'the main theme gathers again on horns and strings, held back, rising.', level: 0.6 },
  { from: 110, to: 112, music: 'one rising swell.', level: 0.8 },
  {
    from: 112,
    to: 120,
    music: 'the main theme in full on horns and strings, then one last chord, held, fading to silence by 2:00.',
    level: 0.85,
  },
];

const stamp = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
export const PROMPT = [
  'An original instrumental cue for the trailer of a calm, thoughtful science-fiction strategy game set among the real nearby stars.',
  'Exactly two minutes long, ending at 2:00. Cinematic and building, but never a big electronic drop or a pounding beat.',
  'Instrumental only: no vocals, no singing, no humming, no choir, no spoken words.',
  'Strings and soft synthesiser pads under a clear, hopeful melody, with a piano and distant bells; horns and low strings later; for one section a low bowed drone and a breathy wooden flute.',
  'About 80 BPM, in D major, with a modal colour in the middle.',
  'The structure, by timestamp:',
  ...SECTIONS.map((s) => `[${stamp(s.from)} to ${stamp(s.to)}] ${s.music}`),
].join('\n');

const { values } = parseArgs({ options: { count: { type: 'string', default: '4' } } });
const count = Math.max(1, Math.min(LETTERS.length, Number(values.count) || 4));
const key = apiKey('gemini');
if (!key) {
  console.error(missingKeyHelp('gemini'));
  process.exit(1);
}
mkdirSync(DIR, { recursive: true });

async function ask(): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const call = lyriaRequest(PROMPT, DEFAULT_MUSIC_MODEL, key as string);
    const res = await fetch(call.url, call.init);
    if (res.ok) return res.json();
    const text = await res.text();
    if (attempt < 2 && text.includes('content_blocked')) continue;
    throw new Error(`gemini answered ${res.status}: ${text.slice(0, 400)}`);
  }
}

/** The loudness of each section, and how well its rise and fall follow the cut's (a correlation, −1 to 1). */
function shapeOf(file: string): { sections: number[]; fit: number } {
  const sections = SECTIONS.map((s) => {
    const part = resolve(DIR, 'part.wav');
    ffmpeg(['-y', '-ss', String(s.from), '-t', String(s.to - s.from), '-i', file, '-ac', '1', part]);
    const l = loudness(part).lufs;
    return Number.isFinite(l) ? l : -70;
  });
  const want = SECTIONS.map((s) => s.level);
  const mean = (xs: number[]) => xs.reduce((n, x) => n + x, 0) / xs.length;
  const [ma, mb] = [mean(sections), mean(want)];
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < want.length; i++) {
    num += (sections[i] - ma) * (want[i] - mb);
    da += (sections[i] - ma) ** 2;
    db += (want[i] - mb) ** 2;
  }
  return { sections, fit: Math.round((num / Math.sqrt(da * db || 1)) * 100) / 100 };
}

let assets = readAssets();
const made = await Promise.all(
  LETTERS.slice(0, count).map(async (letter) => {
    const music = parseLyria(await ask());
    const file = resolve(DIR, `cue-${letter}.mp3`);
    writeFileSync(file, music.bytes);
    const seconds = duration(file);
    const { sections, fit } = shapeOf(file);
    return { letter, file, seconds, sections, fit, note: music.note };
  }),
);
// The best by measure: nearest two minutes, then the best fit to the cut's rise and fall.
const score = (m: (typeof made)[number]) => m.fit * 100 - Math.abs(m.seconds - 120) * 2;
const best = [...made].sort((a, b) => score(b) - score(a))[0];
for (const m of made)
  assets = upsert(assets, {
    id: `music/${m.letter}`,
    kind: 'music',
    file: `music/cue-${m.letter}.mp3`,
    provider: 'gemini',
    model: DEFAULT_MUSIC_MODEL,
    prompt: PROMPT,
    seconds: Math.round(m.seconds * 10) / 10,
    costUsd: PRICE,
    createdAt: new Date().toISOString(),
    picked: m === best ? 'measure' : null,
    aiGenerated: true,
  });
writeAssets(assets);
for (const m of made)
  console.log(
    `${m.letter}${m === best ? ' *' : ''} ${m.seconds.toFixed(1)} s, fit ${m.fit}, sections ${m.sections.map((x) => x.toFixed(0)).join(' ')} LUFS`,
  );
console.log(`cost about $${(made.length * PRICE).toFixed(2)}`);
