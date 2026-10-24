// ffmpeg and ffprobe for the build-time scripts (the music, the voices, the trailer): the FFMPEG and
// FFPROBE variables if set, else the binaries of the small `tools/` package (`npm ci --prefix tools`),
// else whatever is on the PATH. The game never uses them.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const TOOLS = resolve(import.meta.dirname, '../tools/package.json');

function fromTools(name: 'ffmpeg-static' | 'ffprobe-static'): string | undefined {
  if (!existsSync(TOOLS)) return undefined;
  try {
    const found = createRequire(TOOLS)(name) as string | { path: string };
    const path = typeof found === 'string' ? found : found.path;
    return existsSync(path) ? path : undefined;
  } catch {
    return undefined;
  }
}

export const FFMPEG = process.env.FFMPEG || fromTools('ffmpeg-static') || 'ffmpeg';
export const FFPROBE = process.env.FFPROBE || fromTools('ffprobe-static') || 'ffprobe';

/** Runs ffmpeg or ffprobe and returns what it wrote (ffmpeg reports on stderr); throws with its words if it fails. */
export function run(tool: string, args: string[], seconds = 120): string {
  const r = spawnSync(tool, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: seconds * 1000 });
  if (r.signal) throw new Error(`${tool} stopped after ${seconds} s (${r.signal}): ${args.join(' ').slice(0, 300)}`);
  if (r.error) throw new Error(`${tool} could not be run (${r.error.message}); try npm ci --prefix tools`);
  if (r.status !== 0) throw new Error(`${tool} failed: ${r.stderr.slice(-600)}`);
  return `${r.stdout}\n${r.stderr}`;
}

/** ffmpeg, never waiting on the terminal for keys (`-nostdin`). */
export const ffmpeg = (args: string[]) => run(FFMPEG, ['-hide_banner', '-nostats', '-nostdin', ...args]);

/** A file's length in seconds. */
export function duration(file: string): number {
  return Number(run(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).trim());
}

/** A file's integrated loudness (EBU R128, LUFS) and its true peak (dBTP). */
export function loudness(file: string): { lufs: number; peak: number } {
  const report = ffmpeg(['-i', file, '-af', 'ebur128=framelog=quiet:peak=true', '-f', 'null', '-']);
  const summary = report.split('Summary:').at(-1) ?? '';
  return {
    lufs: Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]),
    peak: Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1]),
  };
}
