// The trailer, put together (docs/design/TRAILER.md §10.5): the filmed shots cut to the script's
// times, the feature cards and the advisors' cards over them, the narrator's chosen takes and the
// game's own clips, the music under them, mastered and encoded as D-97 says, and an .srt of what is
// said. Into trailer/out/starman-control-trailer.mp4 (and a 720p copy small enough to send).
//
//   npm run trailer:build          (after trailer:stage, the shots, the cards, the narrator and the music)

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { duration, FFPROBE, ffmpeg, loudness, run } from '../scripts/media.ts';
import { wordMatch, wordsOf } from '../scripts/voice/words.ts';
import { FPS, OUT } from './harness.ts';
import { readAssets, type TrailerAsset, writeAssets } from './records.ts';
import { ADVISORS, CARDS, CUT, LENGTH, NARRATOR } from './script.ts';

const ROOT = resolve(import.meta.dirname, '..');
const TMP = resolve(OUT, 'build');
mkdirSync(TMP, { recursive: true });
const W = 1920;
const H = 1080;
/** A narrator line may be spoken this much faster to fit before the next (the pitch kept). */
const MOST_TEMPO = 1.12;
const GAP = 0.3;
/** The level every spoken line is set to, as the game's clips are. */
const VOICE_LUFS = -16;
/** Seconds an encode of the whole cut may take. */
const LONG = 1800;

// 1. The narrator's takes: every word heard, then within the slot, then the calm pace (or the owner's pick).
const assets = readAssets();
const events = [...NARRATOR.map((n) => n.at), ...ADVISORS.map((a) => a.at), LENGTH].sort((a, b) => a - b);
const slotOf = (at: number) => (events.find((t) => t > at + 0.01) ?? LENGTH) - at - 0.2;
const takes = NARRATOR.map((line) => {
  const all = assets.filter((a) => a.kind === 'narrator-take' && a.id.startsWith(`narrator/${line.id}/`));
  if (all.length === 0) throw new Error(`No takes of ${line.id}: run node trailer/narrator.ts --takes`);
  const owner = all.find((a) => a.picked === 'owner');
  const score = (a: TrailerAsset) =>
    wordMatch(line.text, a.heard ?? '') * 100 -
    Math.max(0, a.seconds - slotOf(line.at)) * 20 -
    Math.abs(wordsOf(line.text).length / a.seconds - 2.2) * 5;
  const best = owner ?? [...all].sort((a, b) => score(b) - score(a))[0];
  for (const a of all) if (a.picked !== 'owner') a.picked = a === best ? 'measure' : null;
  return { ...line, file: resolve(OUT, best.file), take: best.id };
});
writeAssets(assets);

// 2. The voices on one line of time: each after the one before has ended, a narrator line hurried a
// little where it must be, an advisor's clip exactly as the game plays it.
type Voice = {
  id: string;
  at: number;
  file: string;
  text: string;
  narrator: boolean;
  start: number;
  end: number;
  tempo: number;
};
const spoken: Voice[] = [
  ...takes.map((t) => ({
    id: t.id,
    at: t.at,
    file: t.file,
    text: t.text,
    narrator: true,
    start: 0,
    end: 0,
    tempo: 1,
    gain: 0,
  })),
  ...ADVISORS.map((a) => ({
    id: a.id,
    at: a.at,
    file: resolve(ROOT, 'public', a.clip),
    text: '',
    narrator: false,
    start: 0,
    end: 0,
    tempo: 1,
  })),
].sort((a, b) => a.at - b.at);
const SPOKEN_TEXT: Record<string, string> = {};
{
  const { readFileSync } = await import('node:fs');
  const manifest = JSON.parse(readFileSync(resolve(ROOT, 'voices/manifest.json'), 'utf8')) as {
    clips: { path: string; text: string }[];
  };
  for (const a of ADVISORS) SPOKEN_TEXT[a.id] = manifest.clips.find((c) => c.path === a.clip)?.text ?? '';
}
let free = 0;
for (const [i, v] of spoken.entries()) {
  if (!v.narrator) v.text = SPOKEN_TEXT[v.id] ?? '';
  // Every line at the game's clips' level (−16 LUFS, VOICES.md §13): the narrator's takes come quieter.
  if (v.narrator) v.gain = Math.round((VOICE_LUFS - loudness(v.file).lufs) * 10) / 10;
  const length = duration(v.file);
  v.start = Math.max(v.at, free + (i > 0 ? GAP : 0));
  const next = spoken[i + 1]?.at ?? LENGTH;
  const room = next - 0.15 - v.start;
  if (v.narrator && length > room && room > 0.5) v.tempo = Math.min(MOST_TEMPO, length / room);
  v.end = v.start + length / v.tempo;
  free = v.end;
}
for (const v of spoken)
  console.log(
    `${v.id.padEnd(5)} at ${v.at.toFixed(1).padStart(5)} → ${v.start.toFixed(2).padStart(6)}–${v.end.toFixed(2).padEnd(6)}${v.tempo > 1 ? ` ×${v.tempo.toFixed(2)}` : ''}${v.start - v.at > 0.05 ? ` (${(v.start - v.at).toFixed(2)} s late)` : ''}`,
  );

// 3. The picture: each shot cut to its length (S19's take runs on through S21), then joined.
const pieces: string[] = [];
const cut = CUT.filter((c) => c.id !== 'S20' && c.id !== 'S21').map((c) => (c.id === 'S19' ? { ...c, to: LENGTH } : c));
for (const c of cut) {
  const src = resolve(OUT, 'shots', `${c.id}.mp4`);
  if (!existsSync(src)) throw new Error(`No film of ${c.id}: run node trailer/shots.ts ${c.id}`);
  const size = run(FFPROBE, ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src]).trim();
  if (size !== `${W},${H}`) throw new Error(`${c.id} is ${size}, not ${W}×${H}: film it again`);
  const out = resolve(TMP, `${c.id}.mp4`);
  const frames = Math.round((c.to - c.from) * FPS);
  ffmpeg([
    '-y',
    '-i',
    src,
    '-frames:v',
    String(frames),
    '-r',
    String(FPS),
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '10',
    '-pix_fmt',
    'yuv420p',
    '-an',
    out,
  ]);
  pieces.push(out);
}
writeFileSync(resolve(TMP, 'pieces.txt'), pieces.map((p) => `file '${p}'`).join('\n'));
const picture = resolve(TMP, 'picture.mp4');
ffmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', resolve(TMP, 'pieces.txt'), '-c', 'copy', picture]);

// 4. The overlays: the feature cards, and each advisor's card while their clip plays (lower right).
const overlays: { file: string; from: number; to: number }[] = CARDS.map((c, i) => ({
  file: resolve(OUT, 'cards', `card-${i}.png`),
  from: c.from,
  to: c.to,
}));
for (const v of spoken.filter((x) => !x.narrator)) {
  const src = resolve(OUT, 'cards', `${v.id}.png`);
  const m = await sharp(src).metadata();
  const w = Math.min(820, m.width ?? 820);
  const h = Math.round(((m.height ?? 100) * w) / (m.width ?? w));
  const card = await sharp(src).resize(w, h).png().toBuffer();
  const file = resolve(TMP, `over-${v.id}.png`);
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: card, left: W - w - 72, top: H - h - 88 }])
    .png()
    .toFile(file);
  overlays.push({ file, from: Math.max(0, v.start - 0.35), to: Math.min(LENGTH, v.end + 0.7) });
}
const inputs = ['-i', picture];
let graph = '';
let last = '0:v';
for (const [i, o] of overlays.entries()) {
  inputs.push('-loop', '1', '-t', String(LENGTH), '-i', o.file);
  const n = i + 1;
  graph += `[${n}:v]format=rgba,fade=t=in:st=${o.from}:d=0.35:alpha=1,fade=t=out:st=${Math.max(o.from, o.to - 0.4)}:d=0.4:alpha=1[o${n}];`;
  graph += `[${last}][o${n}]overlay=0:0:enable='between(t,${o.from},${o.to})'[v${n}];`;
  last = `v${n}`;
}
const layered = resolve(TMP, 'layered.mp4');
ffmpeg(
  [
    '-y',
    ...inputs,
    '-filter_complex',
    graph.replace(/;$/, ''),
    '-map',
    `[${last}]`,
    '-t',
    String(LENGTH),
    '-r',
    String(FPS),
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '14',
    '-pix_fmt',
    'yuv420p',
    layered,
  ],
  LONG,
);

// 5. The sound: the voices on their line of time; the music under them, stepping back while they speak.
const music = assets.find((a) => a.kind === 'music' && (a.picked === 'owner' || a.picked === 'measure'));
if (!music) throw new Error('No music chosen: run node trailer/music.ts');
const ain = ['-i', resolve(OUT, music.file)];
let af = `[0:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${LENGTH},afade=t=in:d=1.2,afade=t=out:st=${LENGTH - 3.5}:d=3.5,volume=0.42[bed];`;
const labels: string[] = [];
for (const [j, v] of spoken.entries()) {
  ain.push('-i', v.file);
  const ms = Math.round(v.start * 1000);
  af += `[${j + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo${v.tempo > 1 ? `,atempo=${v.tempo.toFixed(3)}` : ''}${v.gain ? `,volume=${v.gain}dB` : ''},adelay=${ms}|${ms}[s${j}];`;
  labels.push(`[s${j}]`);
}
af += `${labels.join('')}amix=inputs=${labels.length}:duration=longest:normalize=0,apad=whole_dur=${LENGTH}[voice];`;
af += '[voice]asplit=2[vk][vm];';
af += '[bed][vk]sidechaincompress=threshold=0.012:ratio=8:attack=50:release=700[ducked];';
af += '[ducked]asplit=2[d1][d2];[vm]asplit=2[v1][v2];';
af += `[d1][v1]amix=inputs=2:duration=first:normalize=0,atrim=0:${LENGTH}[mix]`;
// Levelled in two passes, to −14 LUFS with true peaks under −1 dBTP: measured first, then applied.
const mixed = resolve(TMP, 'mix.wav');
const bedOnly = resolve(TMP, 'bed.wav');
const voiceOnly = resolve(TMP, 'voice.wav');
ffmpeg(
  [
    ...ain,
    '-filter_complex',
    af,
    '-map',
    '[mix]',
    '-ar',
    '48000',
    '-c:a',
    'pcm_s24le',
    '-y',
    mixed,
    '-map',
    '[d2]',
    '-ar',
    '48000',
    '-y',
    bedOnly,
    '-map',
    '[v2]',
    '-ar',
    '48000',
    '-y',
    voiceOnly,
  ],
  LONG,
);
// How far each line stands above the music under it (Reborn's cut asked for 6 dB at least).
const level = (file: string, from: number, to: number) => {
  const part = resolve(TMP, 'part.wav');
  ffmpeg(['-y', '-ss', String(from), '-t', String(Math.max(0.5, to - from)), '-i', file, part]);
  const l = loudness(part).lufs;
  return Number.isFinite(l) ? l : -70;
};
const margins = spoken.map((v) => ({
  id: v.id,
  db: level(voiceOnly, v.start, v.end) - level(bedOnly, v.start, v.end),
}));
const thinnest = margins.reduce((a, b) => (b.db < a.db ? b : a));
console.log(
  `voice over music: ${margins.map((x) => `${x.id} ${x.db.toFixed(1)}`).join(', ')}; the least ${thinnest.id} at ${thinnest.db.toFixed(1)} dB`,
);
if (thinnest.db < 6) console.warn(`  ${thinnest.id} stands only ${thinnest.db.toFixed(1)} dB above the music`);
const report = ffmpeg(['-i', mixed, '-af', 'loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json', '-f', 'null', '-']);
const m = JSON.parse(report.slice(report.lastIndexOf('{'), report.lastIndexOf('}') + 1)) as Record<string, string>;
const sound = resolve(TMP, 'sound.wav');
ffmpeg(
  [
    '-y',
    '-i',
    mixed,
    '-af',
    `loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
    '-ar',
    '48000',
    '-c:a',
    'pcm_s16le',
    sound,
  ],
  LONG,
);

// 6. Together: H.264 High at 60 fps, AAC at 48 kHz, ready to stream.
const master = resolve(OUT, 'starman-control-trailer.mp4');
ffmpeg(
  [
    '-y',
    '-i',
    layered,
    '-i',
    sound,
    '-map',
    '0:v',
    '-map',
    '1:a',
    '-c:v',
    'libx264',
    '-profile:v',
    'high',
    '-preset',
    'slow',
    '-crf',
    '16',
    '-pix_fmt',
    'yuv420p',
    '-r',
    String(FPS),
    '-c:a',
    'aac',
    '-b:a',
    '320k',
    '-ar',
    '48000',
    '-movflags',
    '+faststart',
    '-t',
    String(LENGTH),
    master,
  ],
  LONG,
);
const preview = resolve(OUT, 'starman-control-trailer-720p.mp4');
ffmpeg(
  [
    '-y',
    '-i',
    master,
    '-vf',
    'scale=1280:-2',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '24',
    '-c:a',
    'aac',
    '-b:a',
    '160k',
    '-movflags',
    '+faststart',
    preview,
  ],
  LONG,
);

// 7. The captions: what is said, when.
const stamp = (t: number) => {
  const ms = Math.round(t * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3_600_000))}:${p(Math.floor(ms / 60_000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
const srt = spoken.map((v, i) => `${i + 1}\n${stamp(v.start)} --> ${stamp(v.end + 0.3)}\n${v.text}\n`).join('\n');
writeFileSync(resolve(OUT, 'starman-control-trailer.srt'), srt);

const l = loudness(master);
console.log(`${master}: ${duration(master).toFixed(2)} s, ${l.lufs} LUFS, peak ${l.peak} dBFS`);
console.log(preview);
