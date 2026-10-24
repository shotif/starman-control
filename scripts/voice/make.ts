// Every clip of a power in its cast's voices (docs/design/VOICES.md §4, increment 70b): each spoken
// by its part's pick (voices/cast.json), shaped, heard back by speech to text and made again if a
// word is lost, then levelled for speech, published to public/voice/<power>/<clip>.mp3 and recorded
// in voices/manifest.json. A clip whose words, voice and shaping are unchanged is left alone.
//
//   npm run voice:make -- --power sta [--clip founded] [--again]

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { type Clip, clipPath, clipsOf, VOICED_FACTIONS, type VoicedFaction } from '../../src/content/voices.ts';
import { DELIVERY, PARTS, SHAPES, STOCK, type StockVoice, VOICE_MODEL } from '../../voices/briefs.ts';
import { duration, ffmpeg, loudness } from '../media.ts';
import type { CastPick } from './cast.ts';
import { type VoiceManifest, type VoiceRecord, writeManifest } from './catalogue.ts';
import { hasKey, missingKeyHelp, speak, transcribe } from './eleven.ts';
import { wordMatch } from './words.ts';

const ROOT = resolve(import.meta.dirname, '../..');
const OUT = resolve(ROOT, 'voices/out/clips');
/** Speech sits a little above the music (−18 LUFS, MUSIC.md §8). */
export const VOICE_LUFS = -16;
/** Mono MP3 at 24 kHz: about 5 KB a second, so the slow Concord's longest lesson keeps within 60 KB. */
export const VOICE_RATE = 24000;
export const VOICE_BITRATE = '40k';
/** How much of a line must be heard back for a take to stand; below it the take is made again. */
const HEARD = 0.9;
const TRIES = 5;

const { values } = parseArgs({
  options: {
    power: { type: 'string' },
    clip: { type: 'string' },
    again: { type: 'boolean', default: false },
    // Encode again from the shaped takes already made, asking the service for nothing.
    encode: { type: 'boolean', default: false },
  },
});
const powers = (values.power === 'all' ? [...VOICED_FACTIONS] : [values.power]) as VoicedFaction[];
if (powers.some((p) => !p || !VOICED_FACTIONS.includes(p))) {
  console.error(`Name a power: --power ${VOICED_FACTIONS.join('|')}|all`);
  process.exit(1);
}
if (!values.encode && !hasKey()) {
  console.error(missingKeyHelp());
  process.exit(1);
}
const cast: Record<string, CastPick> = JSON.parse(readFileSync(resolve(ROOT, 'voices/cast.json'), 'utf8'));
const manifestFile = resolve(ROOT, 'voices/manifest.json');
const manifest: VoiceManifest = existsSync(manifestFile)
  ? JSON.parse(readFileSync(manifestFile, 'utf8'))
  : { clips: [] };
let chars = 0;
let made = 0;
let kept = 0;

async function makeClip(power: VoicedFaction, clip: Clip): Promise<void> {
  const partId = `${power}-${clip.speaker}`;
  const part = PARTS.find((p) => p.id === partId);
  const pick = cast[partId];
  if (!part || !pick) throw new Error(`No pick for ${partId}: run npm run voice:cast -- --power ${power}`);
  const voice = pick.voice as StockVoice;
  const delivery =
    clip.speaker === 'landing' || clip.speaker === 'garrison' ? DELIVERY[power].radio : DELIVERY[power].advisor;
  const path = clipPath(power, clip.id);
  const old = manifest.clips.find((r) => r.path === path);
  const published = resolve(ROOT, 'public', path);
  if (
    !values.again &&
    !values.encode &&
    old &&
    existsSync(published) &&
    old.text === clip.text &&
    old.voice === voice &&
    old.shape === pick.shape &&
    old.delivery === delivery
  ) {
    kept++;
    return;
  }
  const dir = resolve(OUT, power);
  mkdirSync(dir, { recursive: true });
  const raw = resolve(dir, `${clip.id}-raw.mp3`);
  const shaped = resolve(dir, `${clip.id}.mp3`);
  let heard = values.encode && old ? old.heard : '';
  let match = values.encode && old ? old.match : 0;
  if (values.encode && (!old || !existsSync(shaped))) throw new Error(`${path}: no take to encode; make it first`);
  for (let attempt = 1; !values.encode && attempt <= TRIES && match < HEARD; attempt++) {
    writeFileSync(raw, await speak(STOCK[voice].id, `${delivery} ${clip.text}`, VOICE_MODEL));
    chars += delivery.length + 1 + clip.text.length;
    ffmpeg([
      '-y',
      '-i',
      raw,
      '-filter_complex',
      SHAPES[pick.shape as keyof typeof SHAPES],
      '-ac',
      '1',
      '-ar',
      '44100',
      '-b:a',
      '128k',
      shaped,
    ]);
    heard = await transcribe(readFileSync(shaped));
    match = wordMatch(clip.text, heard);
  }
  if (!values.encode && match < HEARD)
    console.warn(`  ${path}: heard ${Math.round(match * 100)}% after ${TRIES} tries ("${heard}")`);
  // Levelled for speech, trimmed of silence at its ends, mono at 24 kHz.
  const { lufs } = loudness(shaped);
  const gain = Math.round((VOICE_LUFS - lufs) * 10) / 10;
  mkdirSync(resolve(published, '..'), { recursive: true });
  ffmpeg([
    '-y',
    '-i',
    shaped,
    '-af',
    `silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.1,areverse,volume=${gain}dB,alimiter=limit=0.89`,
    '-ac',
    '1',
    '-ar',
    String(VOICE_RATE),
    '-b:a',
    VOICE_BITRATE,
    published,
  ]);
  const record: VoiceRecord = {
    path,
    part: partId,
    who: part.who,
    text: clip.text,
    heard,
    match: Math.round(match * 1000) / 1000,
    provider: 'elevenlabs',
    model: VOICE_MODEL,
    voice,
    voiceId: STOCK[voice].id,
    shape: pick.shape,
    delivery,
    seconds: Math.round(duration(published) * 100) / 100,
    bytes: statSync(published).size,
    encoding: { codec: 'mp3', rate: VOICE_RATE, bitrate: VOICE_BITRATE, loudness: `${VOICE_LUFS} LUFS`, gainDb: gain },
    createdAt: values.encode && old ? old.createdAt : new Date().toISOString(),
    cast: pick.by,
    aiGenerated: true,
  };
  manifest.clips = [...manifest.clips.filter((r) => r.path !== path), record];
  made++;
}

for (const power of powers) {
  const clips = clipsOf(power).filter((c) => !values.clip || c.id === values.clip);
  // A few at a time: the service is quick, and each clip waits on its transcription.
  for (let i = 0; i < clips.length; i += 6) {
    await Promise.all(clips.slice(i, i + 6).map((c) => makeClip(power, c)));
    writeManifest(manifestFile, manifest);
  }
  console.log(`${power}: ${clips.length} clips`);
}
writeManifest(manifestFile, manifest);
console.log(`made ${made}, unchanged ${kept}; characters sent: ${chars}`);
