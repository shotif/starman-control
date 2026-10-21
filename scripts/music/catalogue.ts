// The music's records (docs/design/MUSIC.md §4): what music/manifest.json holds for every published
// piece, and the checks `npm run music:check` makes. Pure, so it is tested without files.

import { MUSIC_PIECES } from '../../src/content/music.ts';

/** The loudness every piece is levelled to, and the MP3's bitrate. */
export const MUSIC_LUFS = -18;
export const MUSIC_BITRATE = '112k';

export interface MusicRecord {
  id: string;
  /** public/music/<id>.mp3, relative to public/. */
  path: string;
  bytes: number;
  seconds: number;
  provider: string;
  model: string;
  prompt: string;
  createdAt: string;
  approvedAt: string;
  /** Always true: every piece is generated (D-29's disclosure, a store's declaration). */
  aiGenerated: true;
  /** Google marks Lyria's output with an inaudible SynthID watermark. */
  watermark: 'SynthID';
  /** The candidate it was made from, and how it was levelled and encoded. */
  candidate: string;
  encoding: { codec: 'mp3'; bitrate: string; loudness: string; gainDb: number };
}

export interface MusicManifest {
  pieces: MusicRecord[];
}

export function upsertMusic(manifest: MusicManifest, record: MusicRecord): MusicManifest {
  const pieces = manifest.pieces.filter((p) => p.id !== record.id);
  pieces.push(record);
  pieces.sort((a, b) => a.id.localeCompare(b.id));
  return { pieces };
}

/** What is wrong: records for unknown pieces or missing files, and published files with no record. */
export function auditMusic(manifest: MusicManifest, published: string[], exists: (path: string) => boolean): string[] {
  const problems: string[] = [];
  const known = new Set<string>(MUSIC_PIECES);
  for (const p of manifest.pieces) {
    if (!known.has(p.id))
      problems.push(`music/manifest.json: ${p.id} is not a piece the game knows (src/content/music.ts).`);
    if (!exists(p.path)) problems.push(`music/manifest.json: ${p.id}'s file ${p.path} is missing.`);
    if (!p.aiGenerated) problems.push(`music/manifest.json: ${p.id} must say it is generated.`);
  }
  const recorded = new Set(manifest.pieces.map((p) => p.path));
  for (const f of published) if (!recorded.has(f)) problems.push(`${f} has no record in music/manifest.json.`);
  return problems;
}
