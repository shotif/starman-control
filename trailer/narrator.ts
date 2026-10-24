// The trailer's narrator (docs/design/TRAILER.md §7), the one voice made for the trailer alone:
// ElevenLabs stock voices the game's parts do not use, each reading three lines; then every line in
// the chosen voice, three takes each, heard back and measured. Recorded in trailer/manifest.json.
//
//   node trailer/narrator.ts --audition          five candidates, a lettered file and its index
//   node trailer/narrator.ts --takes [--voice B] every line, three takes each, the best by measure

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { duration, ffmpeg, loudness } from '../scripts/media.ts';
import { hasKey, missingKeyHelp, speak, transcribe } from '../scripts/voice/eleven.ts';
import { wordMatch, wordsOf } from '../scripts/voice/words.ts';
import { SHAPES, type Shape, STOCK, type StockVoice, VOICE_MODEL } from '../voices/briefs.ts';
import { readAssets, type TrailerAsset, upsert, writeAssets } from './records.ts';
import { ADVISORS, NARRATOR } from './script.ts';

const OUT = resolve(import.meta.dirname, 'out');
const DIR = resolve(OUT, 'narrator');
const DELIVERY = '[calm, low, close, quietly awed]';
/** Words a second, about, for a calm narrator. */
const PACE = 2.2;
const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;
/** The candidates: stock voices no part of the game speaks in plain, two of them shaped deeper. */
export const CANDIDATES: readonly { voice: StockVoice; shape: Shape }[] = [
  { voice: 'george', shape: 'plain' },
  { voice: 'daniel', shape: 'plain' },
  { voice: 'george', shape: 'deeper' },
  { voice: 'daniel', shape: 'deeper' },
  { voice: 'bill', shape: 'plain' },
];
const AUDITION = ['N1', 'N5', 'N17'];

const { values } = parseArgs({
  options: {
    audition: { type: 'boolean', default: false },
    takes: { type: 'boolean', default: false },
    voice: { type: 'string' },
  },
});
if (!hasKey()) {
  console.error(missingKeyHelp());
  process.exit(1);
}
mkdirSync(DIR, { recursive: true });
let assets = readAssets();
let chars = 0;

interface Take {
  file: string;
  heard: string;
  match: number;
  seconds: number;
  pace: number;
  peak: number;
}

async function take(name: string, voice: StockVoice, shape: Shape, text: string): Promise<Take> {
  const raw = resolve(DIR, `${name}-raw.mp3`);
  const file = resolve(DIR, `${name}.mp3`);
  writeFileSync(raw, await speak(STOCK[voice].id, `${DELIVERY} ${text}`, VOICE_MODEL));
  chars += DELIVERY.length + 1 + text.length;
  ffmpeg(['-y', '-i', raw, '-filter_complex', SHAPES[shape], '-ac', '1', '-ar', '44100', '-b:a', '192k', file]);
  const heard = await transcribe(readFileSync(file));
  const seconds = duration(file);
  return {
    file,
    heard,
    match: wordMatch(text, heard),
    seconds,
    pace: wordsOf(text).length / seconds,
    peak: loudness(file).peak,
  };
}

/** Every word heard first; then the pace nearest a calm narrator's; then no clipping. */
const score = (ts: Take[]) =>
  Math.round(
    (ts.reduce((n, t) => n + t.match, 0) / ts.length) * 100 -
      Math.abs(ts.reduce((n, t) => n + t.pace, 0) / ts.length - PACE) * 12 -
      (ts.some((t) => t.peak > -0.5) ? 10 : 0),
  );

/** Joins clips with gaps, each announced by a letter in a plain voice, into one file to listen to. */
async function lettered(out: string, groups: { title?: string; items: { letter: string; files: string[] }[] }[]) {
  const wavDir = resolve(DIR, 'wav');
  mkdirSync(wavDir, { recursive: true });
  const wav = (src: string, name: string) => {
    const w = resolve(wavDir, `${name}.wav`);
    ffmpeg(['-y', '-i', src, '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', w]);
    return w;
  };
  const gap = resolve(wavDir, 'gap.wav');
  ffmpeg(['-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', '0.6', '-c:a', 'pcm_s16le', gap]);
  const say = async (name: string, text: string) => {
    const f = resolve(DIR, `say-${name}.mp3`);
    if (!existsSync(f)) {
      writeFileSync(f, await speak(STOCK.river.id, text, VOICE_MODEL));
      chars += text.length;
    }
    return wav(f, `say-${name}`);
  };
  const list: string[] = [];
  for (const [g, group] of groups.entries()) {
    if (group.title) list.push(await say(`title-${g}`, group.title), gap);
    for (const item of group.items) {
      list.push(await say(`letter-${item.letter}`, `${item.letter}.`), gap);
      for (const [i, f] of item.files.entries()) list.push(wav(f, `${g}-${item.letter}-${i}`), gap);
    }
  }
  const listFile = resolve(wavDir, 'list.txt');
  writeFileSync(listFile, list.map((f) => `file '${f}'`).join('\n'));
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
    '-ac',
    '1',
    '-b:a',
    '128k',
    out,
  ]);
}

if (values.audition) {
  const lines = AUDITION.map((id) => NARRATOR.find((n) => n.id === id)?.text ?? '');
  const tried: { letter: string; voice: StockVoice; shape: Shape; takes: Take[]; score: number }[] = [];
  for (const [i, c] of CANDIDATES.entries()) {
    const takes = await Promise.all(lines.map((t, n) => take(`audition-${LETTERS[i]}-${n + 1}`, c.voice, c.shape, t)));
    tried.push({ letter: LETTERS[i], voice: c.voice, shape: c.shape, takes, score: score(takes) });
  }
  const best = [...tried].sort((a, b) => b.score - a.score)[0];
  for (const t of tried)
    assets = upsert(assets, {
      id: `narrator/audition/${t.letter}`,
      kind: 'narrator-audition',
      file: `narrator/audition-${t.letter}-1.mp3`,
      provider: 'elevenlabs',
      model: VOICE_MODEL,
      voice: t.voice,
      shape: t.shape,
      text: lines.join(' / '),
      heard: t.takes.map((x) => x.heard).join(' / '),
      seconds: Math.round(t.takes.reduce((n, x) => n + x.seconds, 0) * 100) / 100,
      createdAt: new Date().toISOString(),
      picked: t === best ? 'measure' : null,
      aiGenerated: true,
    });
  writeAssets(assets);
  const out = resolve(OUT, 'starman-control-narrator-audition.mp3');
  await lettered(out, [{ items: tried.map((t) => ({ letter: t.letter, files: t.takes.map((x) => x.file) })) }]);
  const index = [
    '# The narrator: the audition',
    '',
    `Each candidate reads three lines: ${lines.map((l) => `“${l}”`).join(', ')}. ★ is the pick by measure.`,
    '',
    ...tried.map(
      (t) =>
        `- **${t.letter}**${t === best ? ' ★' : ''}: ${STOCK[t.voice].is} (${t.voice}), shaped *${t.shape}*; score ${t.score}; heard: “${t.takes.map((x) => x.heard).join(' / ')}”`,
    ),
  ];
  writeFileSync(resolve(OUT, 'starman-control-narrator-audition.md'), `${index.join('\n')}\n`);
  for (const t of tried) console.log(`${t.letter} ${t.voice}/${t.shape} ${t.score}${t === best ? ' *' : ''}`);
  console.log(`${out}; characters sent: ${chars}`);
}

if (values.takes) {
  const chosen = values.voice
    ? CANDIDATES[LETTERS.indexOf(values.voice.toUpperCase() as (typeof LETTERS)[number])]
    : (() => {
        const pick = assets.find((a) => a.kind === 'narrator-audition' && a.picked);
        return CANDIDATES.find((c) => c.voice === pick?.voice && c.shape === pick?.shape);
      })();
  if (!chosen) throw new Error('No narrator chosen: run --audition first, or name --voice A-E.');
  // Each line has until the next voice begins (or the end) to be said.
  const events = [...NARRATOR.map((n) => n.at), ...ADVISORS.map((a) => a.at), 120].sort((a, b) => a - b);
  const slot = (at: number) => (events.find((t) => t > at + 0.01) ?? 120) - at - 0.2;
  const groups: { title: string; items: { letter: string; files: string[] }[] }[] = [];
  for (const line of NARRATOR) {
    const takes = await Promise.all(
      [0, 1, 2].map((k) => take(`${line.id}-${LETTERS[k]}`, chosen.voice, chosen.shape, line.text)),
    );
    // Heard exactly first, then within its slot, then nearest the narrator's pace.
    const ranked = takes
      .map((t, k) => ({ t, k, s: t.match * 100 - (t.seconds > slot(line.at) ? 30 : 0) - Math.abs(t.pace - PACE) * 10 }))
      .sort((a, b) => b.s - a.s);
    const best = ranked[0];
    for (const [k, t] of takes.entries())
      assets = upsert(assets, {
        id: `narrator/${line.id}/${LETTERS[k]}`,
        kind: 'narrator-take',
        file: `narrator/${line.id}-${LETTERS[k]}.mp3`,
        provider: 'elevenlabs',
        model: VOICE_MODEL,
        voice: chosen.voice,
        shape: chosen.shape,
        text: line.text,
        heard: t.heard,
        seconds: Math.round(t.seconds * 100) / 100,
        createdAt: new Date().toISOString(),
        picked: k === best?.k ? 'measure' : null,
        aiGenerated: true,
      });
    groups.push({ title: `${line.id}.`, items: takes.map((t, k) => ({ letter: LETTERS[k], files: [t.file] })) });
    console.log(
      `${line.id} ${takes.map((t, k) => `${LETTERS[k]} ${t.seconds.toFixed(1)}s ${Math.round(t.match * 100)}%`).join(' | ')} → ${LETTERS[best?.k ?? 0]} (slot ${slot(line.at).toFixed(1)}s)`,
    );
  }
  writeAssets(assets);
  const out = resolve(OUT, 'starman-control-narrator-takes.mp3');
  await lettered(out, groups);
  console.log(`${out}; characters sent: ${chars}`);
}
