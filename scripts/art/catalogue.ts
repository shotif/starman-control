// Prompts from briefs, and the manifest that records every picture in the game: which brief, which
// service and model, which prompt, when made and when approved. Pure functions, unit-tested.

import { type ArtBrief, BRIEFS } from '../../art/briefs.ts';
import { SERIES, type SeriesId } from '../../art/styles.ts';
import type { Backdrop, KeySpec } from './keying.ts';
import type { Aspect, ProviderId } from './providers.ts';

export function findBrief(id: string, briefs: ArtBrief[] = BRIEFS): ArtBrief {
  const brief = briefs.find((b) => b.id === id);
  if (!brief) throw new Error(`No brief "${id}". Briefs: ${briefs.map((b) => b.id).join(', ')}`);
  return brief;
}

const BACKDROP_WORDS: Record<Backdrop, string> = {
  white: 'plain, flat, uniform pure white (#FFFFFF)',
  magenta: 'plain, flat, uniform pure magenta (#FF00FF)',
};

/** How a brief's pictures are keyed to transparency, if its series is: the series' own, or `backdrop` instead. */
export function keySpecFor(brief: ArtBrief, backdrop?: Backdrop): KeySpec | undefined {
  const key = SERIES[brief.series].key;
  return key ? { ...key, backdrop: backdrop ?? key.backdrop } : undefined;
}

/** The series style (its backdrop named), then the subject, then what to avoid. */
export function buildPrompt(brief: ArtBrief, backdrop?: Backdrop): string {
  const series = SERIES[brief.series];
  const key = keySpecFor(brief, backdrop);
  const style = key ? series.style.replace('{backdrop}', BACKDROP_WORDS[key.backdrop]) : series.style;
  return `${style}\n\nSubject: ${brief.subject}\n\nDo not include: ${series.avoid}.`;
}

/** Everything about a generated candidate, saved beside it so approval can record it. */
export interface CandidateRecord {
  briefId: string;
  provider: ProviderId;
  model: string;
  prompt: string;
  aspect: Aspect;
  quality?: string;
  createdAt: string;
  note?: string;
  /** For a series keyed to transparency: the backdrop it was painted on, and how it is keyed. */
  key?: KeySpec;
}

export interface ManifestFile {
  width: number;
  /** Relative to public/, as the game will load it. */
  path: string;
  bytes: number;
}

export interface ManifestEntry extends Omit<CandidateRecord, 'key'> {
  id: string;
  series: SeriesId;
  approvedAt: string;
  /** The candidate file it was made from, for finding it again. */
  candidate: string;
  files: ManifestFile[];
  /** How it was keyed to transparency, with the exact settings (scripts/art/keying.ts). */
  key?: KeySpec & { settings: Record<string, unknown> };
  /** A cut-out's box in the candidate, before it was scaled to the published widths. */
  crop?: { left: number; top: number; width: number; height: number };
  /** Always true: every picture here was made by an image model, which stores may require us to disclose. */
  aiGenerated: true;
}

export interface Manifest {
  images: ManifestEntry[];
}

export function publishedPath(series: SeriesId, id: string, width: number): string {
  return `art/${series}/${id}-${width}.webp`;
}

/** Adds or replaces the entry for a picture, keeping the manifest sorted by id. */
export function upsertEntry(manifest: Manifest, entry: ManifestEntry): Manifest {
  const images = manifest.images.filter((e) => e.id !== entry.id).concat(entry);
  images.sort((a, b) => a.id.localeCompare(b.id));
  return { images };
}

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Problems with the briefs and the manifest; empty when all is well. `exists` checks a path under public/. */
export function auditArt(
  briefs: ArtBrief[],
  manifest: Manifest,
  published: string[],
  exists: (path: string) => boolean,
): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const b of briefs) {
    if (!ID_PATTERN.test(b.id)) problems.push(`Brief "${b.id}": id must be lowercase words joined by hyphens.`);
    if (ids.has(b.id)) problems.push(`Brief "${b.id}" is listed twice.`);
    ids.add(b.id);
    if (!(b.series in SERIES)) problems.push(`Brief "${b.id}": unknown series "${b.series}".`);
    if (!b.subject.trim()) problems.push(`Brief "${b.id}" has no subject.`);
  }
  const listed = new Set<string>();
  for (const e of manifest.images) {
    if (!ids.has(e.briefId)) problems.push(`Manifest "${e.id}": no brief "${e.briefId}".`);
    if (e.aiGenerated !== true) problems.push(`Manifest "${e.id}": aiGenerated must be true.`);
    if (!e.provider || !e.model || !e.prompt)
      problems.push(`Manifest "${e.id}": provider, model and prompt are required.`);
    for (const f of e.files) {
      listed.add(f.path);
      if (!exists(f.path)) problems.push(`Manifest "${e.id}": missing file public/${f.path}.`);
    }
  }
  for (const path of published) {
    if (!listed.has(path))
      problems.push(`public/${path} is not in art/manifest.json (approve it with npm run art:approve).`);
  }
  return problems;
}
