// The voices' records (docs/design/VOICES.md §4): what voices/manifest.json holds for every published
// clip, and the checks `npm run voice:check` makes. Pure but for writing the file, so it is tested
// without the service.

import { writeFileSync } from 'node:fs';
import { clipPath, clipsOf, VOICED_FACTIONS } from '../../src/content/voices.ts';

export interface VoiceRecord {
  /** voice/<power>/<clip>.mp3, relative to public/. */
  path: string;
  /** The part that speaks it (voices/briefs.ts), and who that is in the game. */
  part: string;
  who: string;
  /** What it says (src/content/voices.ts), what speech to text heard, and how much of it matched. */
  text: string;
  heard: string;
  match: number;
  provider: 'elevenlabs';
  model: string;
  /** The stock voice, and how the take was shaped (voices/briefs.ts SHAPES) and directed. */
  voice: string;
  voiceId: string;
  shape: string;
  delivery: string;
  seconds: number;
  bytes: number;
  encoding: { codec: 'mp3'; rate: number; bitrate: string; loudness: string; gainDb: number };
  createdAt: string;
  /** Whose pick the part's voice is: Claude's by measure, or the owner's. */
  cast: 'measure' | 'owner';
  /** Always true: every clip is generated (a store's declaration). */
  aiGenerated: true;
}

export interface VoiceManifest {
  clips: VoiceRecord[];
}

export function writeManifest(file: string, manifest: VoiceManifest): void {
  const clips = [...manifest.clips].sort((a, b) => a.path.localeCompare(b.path));
  writeFileSync(file, `${JSON.stringify({ clips }, null, 2)}\n`);
}

/**
 * What is wrong: a clip the game can play with no file or no record, a record whose words are no
 * longer the line's (make it again), a record for a clip the game does not have or with a missing
 * file, and a published file with no record.
 */
export function auditVoices(manifest: VoiceManifest, published: string[], exists: (path: string) => boolean): string[] {
  const problems: string[] = [];
  const byPath = new Map(manifest.clips.map((r) => [r.path, r]));
  const wanted = new Map<string, string>();
  for (const f of VOICED_FACTIONS) for (const c of clipsOf(f)) wanted.set(clipPath(f, c.id), c.text);
  for (const [path, text] of wanted) {
    const r = byPath.get(path);
    if (!r) problems.push(`${path} is not made yet: npm run voice:make -- --power ${path.split('/')[1]}`);
    else if (r.text !== text) problems.push(`${path} says "${r.text}", but its line is now "${text}": make it again.`);
  }
  for (const r of manifest.clips) {
    if (!wanted.has(r.path)) problems.push(`voices/manifest.json: ${r.path} is not a clip the game plays.`);
    if (!exists(r.path)) problems.push(`voices/manifest.json: ${r.path}'s file is missing.`);
    if (!r.aiGenerated) problems.push(`voices/manifest.json: ${r.path} must say it is generated.`);
  }
  for (const f of published) if (!byPath.has(f)) problems.push(`${f} has no record in voices/manifest.json.`);
  return problems;
}
