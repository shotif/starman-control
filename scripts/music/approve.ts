// Puts a chosen candidate piece into the game (docs/design/MUSIC.md §4): levels it to the game's
// loudness, encodes it as MP3 with ffmpeg to public/music/<piece>.mp3, and records where it came
// from in music/manifest.json. Approving a piece again replaces it.
//
//   npm run music:approve -- music/out/title/20261021-044029-lyria-3.5-1.mp3

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { MUSIC_BITRATE, MUSIC_LUFS, type MusicManifest, upsertMusic } from './catalogue.ts';

const candidate = process.argv[2];
if (!candidate) {
  console.error('Name a candidate: npm run music:approve -- music/out/<piece>/<file>.mp3');
  process.exit(1);
}
const root = resolve(import.meta.dirname, '../..');
const source = resolve(root, candidate);
const made = JSON.parse(readFileSync(source.replace(/\.\w+$/, '.json'), 'utf8')) as {
  pieceId: string;
  provider: string;
  model: string;
  prompt: string;
  createdAt: string;
};

/** Runs ffmpeg or ffprobe and returns what it wrote (ffmpeg reports on stderr). */
function run(tool: string, args: string[]): string {
  const r = spawnSync(tool, args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${tool} failed: ${r.stderr.slice(-400)}`);
  return `${r.stdout}\n${r.stderr}`;
}

// The candidate's integrated loudness (EBU R128), so every piece plays at the same level.
const report = run('ffmpeg', [
  '-hide_banner',
  '-nostats',
  '-i',
  source,
  '-af',
  'ebur128=framelog=quiet',
  '-f',
  'null',
  '-',
]);
const integrated = Number(/I:\s+(-?[\d.]+) LUFS/.exec(report.split('Summary:').at(-1) ?? '')?.[1]);
if (!Number.isFinite(integrated)) throw new Error('Could not measure the loudness.');
const gainDb = Math.round((MUSIC_LUFS - integrated) * 10) / 10;

const path = `music/${made.pieceId}.mp3`;
const out = resolve(root, 'public', path);
mkdirSync(resolve(root, 'public/music'), { recursive: true });
run('ffmpeg', [
  '-hide_banner',
  '-y',
  '-i',
  source,
  '-af',
  `volume=${gainDb}dB,afade=t=in:d=0.3`,
  '-ac',
  '2',
  '-ar',
  '44100',
  '-codec:a',
  'libmp3lame',
  '-b:a',
  MUSIC_BITRATE,
  '-map_metadata',
  '-1',
  out,
]);
const seconds =
  Math.round(
    Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).trim()) * 10,
  ) / 10;
const bytes = statSync(out).size;

const manifestPath = resolve(root, 'music/manifest.json');
const manifest: MusicManifest = existsSync(manifestPath)
  ? (JSON.parse(readFileSync(manifestPath, 'utf8')) as MusicManifest)
  : { pieces: [] };
const next = upsertMusic(manifest, {
  id: made.pieceId,
  path,
  bytes,
  seconds,
  provider: made.provider,
  model: made.model,
  prompt: made.prompt,
  createdAt: made.createdAt,
  approvedAt: new Date().toISOString(),
  aiGenerated: true,
  watermark: 'SynthID',
  candidate: basename(source),
  encoding: { codec: 'mp3', bitrate: MUSIC_BITRATE, loudness: `${MUSIC_LUFS} LUFS`, gainDb },
});
writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`);
console.log(`wrote public/${path} (${Math.round(bytes / 1024)} KB, ${seconds} s, ${gainDb} dB)`);
console.log(`recorded ${made.pieceId} in music/manifest.json`);
