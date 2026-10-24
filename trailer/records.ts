// The records of what was generated for the trailer (docs/design/TRAILER.md §10.4): trailer/manifest.json,
// committed, as the art and music keep theirs. The files themselves stay in trailer/out/ (ignored).

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface TrailerAsset {
  /** narrator/audition/A, narrator/N5/B, music/C … */
  id: string;
  kind: 'narrator-audition' | 'narrator-take' | 'music';
  /** Relative to trailer/out/. */
  file: string;
  provider: 'elevenlabs' | 'gemini';
  model: string;
  voice?: string;
  shape?: string;
  text?: string;
  prompt?: string;
  heard?: string;
  seconds: number;
  characters?: number;
  /** In US dollars, where the service charges per item (Lyria). */
  costUsd?: number;
  createdAt: string;
  /** Chosen: by measure, by the owner, or not (a candidate). */
  picked: 'measure' | 'owner' | null;
  aiGenerated: true;
}

const FILE = resolve(import.meta.dirname, 'manifest.json');

export function readAssets(): TrailerAsset[] {
  return existsSync(FILE) ? (JSON.parse(readFileSync(FILE, 'utf8')) as { assets: TrailerAsset[] }).assets : [];
}

/** Saves these records into the file as it is now, so two scripts running at once lose nothing. */
export function writeAssets(assets: TrailerAsset[]): void {
  let all = readAssets();
  for (const a of assets) all = upsert(all, a);
  all.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  writeFileSync(FILE, `${JSON.stringify({ assets: all }, null, 2)}\n`);
}

export function upsert(assets: TrailerAsset[], a: TrailerAsset): TrailerAsset[] {
  return [...assets.filter((x) => x.id !== a.id), a];
}
