// The casting (docs/design/VOICES.md §3, increment 70a): every part of a power read by its three
// candidates (a stock voice each, shaped), each take heard back by speech to text and measured, a
// pick made by what was measured, and one lettered file for the owner to listen to and overrule.
//
//   npm run voice:cast -- --power sta [--part sta-colonies] [--again]
//
// Takes go to voices/out/cast/<power>/ (ignored by git); the picks to voices/cast.json, where an
// owner's pick (`npm run voice:pick`) is never replaced.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { ADVISORS } from '../../src/content/advisors.ts';
import { VOICED_FACTIONS, type VoicedFaction } from '../../src/content/voices.ts';
import { auditionLines, deliveryOf, PARTS, type Part, SHAPES, STOCK, VOICE_MODEL } from '../../voices/briefs.ts';
import { duration, ffmpeg, loudness } from '../media.ts';
import { hasKey, missingKeyHelp, speak, transcribe } from './eleven.ts';
import { wordMatch, wordsOf } from './words.ts';

const ROOT = resolve(import.meta.dirname, '../..');
const OUT = resolve(ROOT, 'voices/out/cast');
const CAST_FILE = resolve(ROOT, 'voices/cast.json');
const LETTERS = ['A', 'B', 'C'] as const;
/** Words a second each manner should keep to, about. */
const PACE: Record<string, number> = { formal: 2.5, warm: 2.7, blunt: 2.8, concord: 1.9 };

const { values } = parseArgs({
  options: { power: { type: 'string' }, part: { type: 'string' }, again: { type: 'boolean', default: false } },
});
const power = values.power as VoicedFaction | undefined;
if (!power || !VOICED_FACTIONS.includes(power)) {
  console.error(`Name a power: --power ${VOICED_FACTIONS.join('|')}`);
  process.exit(1);
}
if (!hasKey()) {
  console.error(missingKeyHelp());
  process.exit(1);
}

interface Take {
  text: string;
  heard: string;
  match: number;
  seconds: number;
  pace: number;
  lufs: number;
  peak: number;
}
interface Tried {
  letter: (typeof LETTERS)[number];
  voice: string;
  shape: string;
  takes: Take[];
  score: number;
}
export interface CastPick {
  letter: string;
  voice: string;
  shape: string;
  by: 'measure' | 'owner';
  at: string;
  measured: { letter: string; voice: string; shape: string; score: number; match: number; pace: number }[];
}

let chars = 0;

/** A take in its raw and shaped forms, made once (again with --again). */
async function take(part: Part, letter: string, n: number, voice: keyof typeof STOCK, shape: string, text: string) {
  const dir = resolve(OUT, part.faction, part.id);
  mkdirSync(dir, { recursive: true });
  const raw = resolve(dir, `${letter}-${n}-raw.mp3`);
  const shaped = resolve(dir, `${letter}-${n}.mp3`);
  const record = resolve(dir, `${letter}-${n}.json`);
  if (!values.again && existsSync(record)) return JSON.parse(readFileSync(record, 'utf8')) as Take;
  writeFileSync(raw, await speak(STOCK[voice].id, `${deliveryOf(part)} ${text}`, VOICE_MODEL));
  chars += deliveryOf(part).length + 1 + text.length;
  ffmpeg([
    '-y',
    '-i',
    raw,
    '-filter_complex',
    SHAPES[shape as keyof typeof SHAPES],
    '-ac',
    '1',
    '-ar',
    '44100',
    '-b:a',
    '128k',
    shaped,
  ]);
  const heard = await transcribe(readFileSync(shaped));
  const seconds = duration(shaped);
  const { lufs, peak } = loudness(shaped);
  const t: Take = {
    text,
    heard,
    match: wordMatch(text, heard),
    seconds,
    pace: wordsOf(text).length / seconds,
    lufs,
    peak,
  };
  writeFileSync(
    record,
    `${JSON.stringify({ ...t, voice, shape, model: VOICE_MODEL, delivery: deliveryOf(part), at: new Date().toISOString() }, null, 2)}\n`,
  );
  return t;
}

function paceFor(part: Part): number {
  return part.faction === 'dusk-concord' ? PACE.concord : PACE[ADVISORS[part.faction].voice];
}

/** Every word heard first; then the pace nearest the manner's; then no clipping. */
function scoreOf(part: Part, takes: Take[]): number {
  const match = takes.reduce((n, t) => n + t.match, 0) / takes.length;
  const pace = takes.reduce((n, t) => n + t.pace, 0) / takes.length;
  const clipped = takes.some((t) => t.peak > -0.5);
  return Math.round((match * 100 - Math.abs(pace - paceFor(part)) * 12 - (clipped ? 10 : 0)) * 10) / 10;
}

const parts = PARTS.filter((p) => p.faction === power && (!values.part || p.id === values.part));
const tried = new Map<string, Tried[]>();
for (const part of parts) {
  const lines = auditionLines(part);
  const all = await Promise.all(
    part.candidates.map(async (cand, i) => {
      const takes = await Promise.all(
        lines.map((text, n) => take(part, LETTERS[i], n + 1, cand.voice, cand.shape, text)),
      );
      return { letter: LETTERS[i], voice: cand.voice, shape: cand.shape, takes, score: scoreOf(part, takes) } as Tried;
    }),
  );
  tried.set(part.id, all);
  console.log(
    `${part.id.padEnd(26)} ${all.map((t) => `${t.letter} ${t.voice}/${t.shape} ${t.score} (heard ${Math.round((t.takes.reduce((n, x) => n + x.match, 0) / t.takes.length) * 100)}%, ${(t.takes.reduce((n, x) => n + x.pace, 0) / t.takes.length).toFixed(1)} w/s)`).join(' | ')}`,
  );
}

// The picks: each part its best candidate whose stock voice no other part of this power has taken.
const cast: Record<string, CastPick> = existsSync(CAST_FILE) ? JSON.parse(readFileSync(CAST_FILE, 'utf8')) : {};
const taken = new Set(
  PARTS.filter((p) => p.faction === power && !tried.has(p.id) && cast[p.id]).map((p) => cast[p.id].voice),
);
for (const p of PARTS.filter((x) => x.faction === power && cast[x.id]?.by === 'owner')) taken.add(cast[p.id].voice);
for (const part of parts) {
  const all = tried.get(part.id) ?? [];
  const measured = all.map((t) => ({
    letter: t.letter,
    voice: t.voice,
    shape: t.shape,
    score: t.score,
    match: Math.round((t.takes.reduce((n, x) => n + x.match, 0) / t.takes.length) * 1000) / 1000,
    pace: Math.round((t.takes.reduce((n, x) => n + x.pace, 0) / t.takes.length) * 100) / 100,
  }));
  if (cast[part.id]?.by === 'owner') {
    cast[part.id].measured = measured;
    continue;
  }
  const ranked = [...all].sort((a, b) => b.score - a.score);
  const best = ranked.find((t) => !taken.has(t.voice)) ?? ranked[0];
  taken.add(best.voice);
  cast[part.id] = {
    letter: best.letter,
    voice: best.voice,
    shape: best.shape,
    by: 'measure',
    at: new Date().toISOString(),
    measured,
  };
}
const ordered = Object.fromEntries(PARTS.filter((p) => cast[p.id]).map((p) => [p.id, cast[p.id]]));
writeFileSync(CAST_FILE, `${JSON.stringify(ordered, null, 2)}\n`);

// The lettered file: every part announced, then each candidate's letter and its two lines.
const ann = resolve(OUT, 'announce');
mkdirSync(ann, { recursive: true });
async function announce(name: string, text: string): Promise<string> {
  const file = resolve(ann, `${name}.mp3`);
  if (!existsSync(file)) {
    writeFileSync(file, await speak(STOCK.daniel.id, text, VOICE_MODEL));
    chars += text.length;
  }
  return file;
}
const wav = (src: string, name: string) => {
  const out = resolve(OUT, power, 'wav', `${name}.wav`);
  mkdirSync(resolve(OUT, power, 'wav'), { recursive: true });
  ffmpeg(['-y', '-i', src, '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', out]);
  return out;
};
const silence = (seconds: number) => {
  mkdirSync(resolve(OUT, power, 'wav'), { recursive: true });
  const out = resolve(OUT, power, 'wav', `silence-${seconds}.wav`);
  ffmpeg(['-y', '-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono`, '-t', String(seconds), '-c:a', 'pcm_s16le', out]);
  return out;
};
const gap = { short: silence(0.35), line: silence(0.6), part: silence(1.4) };
const list: string[] = [];
const index: string[] = [
  `# The casting: ${power}`,
  '',
  `Made ${new Date().toISOString()} with ${VOICE_MODEL}. ★ is the pick by measure (voices/cast.json); overrule with \`npm run voice:pick -- <part> <letter>\`.`,
  '',
];
let at = 0;
const add = (file: string) => {
  list.push(`file '${file}'`);
  at += duration(file);
};
const stamp = () => `${Math.floor(at / 60)}:${String(Math.floor(at % 60)).padStart(2, '0')}`;
for (const part of PARTS.filter((p) => p.faction === power)) {
  const all = tried.get(part.id);
  if (!all) continue;
  index.push(`## ${part.who} (${part.id})`, '', `${part.description}`, '');
  add(wav(await announce(`who-${part.id}`, `${part.who}.`), `who-${part.id}`));
  add(gap.short);
  for (const t of all) {
    const pick = cast[part.id]?.letter === t.letter ? ' ★' : '';
    index.push(
      `- **${t.letter}**${pick} at ${stamp()}: ${STOCK[t.voice as keyof typeof STOCK].is} (${t.voice}), shaped *${t.shape}*; score ${t.score}; heard: “${t.takes.map((x) => x.heard).join(' / ')}”`,
    );
    add(wav(await announce(`letter-${t.letter}`, `${t.letter}.`), `letter-${t.letter}`));
    add(gap.short);
    for (const [n, x] of t.takes.entries()) {
      add(wav(resolve(OUT, power, part.id, `${t.letter}-${n + 1}.mp3`), `${part.id}-${t.letter}-${n + 1}`));
      if (n < t.takes.length - 1 || x) add(gap.line);
    }
  }
  index.push('');
  add(gap.part);
}
const listFile = resolve(OUT, power, 'list.txt');
writeFileSync(listFile, list.join('\n'));
const sheet = resolve(OUT, `${power}-casting.mp3`);
ffmpeg([
  '-y',
  '-f',
  'concat',
  '-safe',
  '0',
  '-i',
  listFile,
  '-af',
  'loudnorm=I=-18:TP=-1.5',
  '-ar',
  '44100',
  '-ac',
  '1',
  '-b:a',
  '96k',
  sheet,
]);
writeFileSync(resolve(OUT, `${power}-casting.md`), `${index.join('\n')}\n`);
console.log(`${sheet} (${Math.round(at)} s); characters sent: ${chars}`);
