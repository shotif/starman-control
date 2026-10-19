// API keys for the art scripts. They come from the environment (a Claude Code cloud environment's
// settings, a shell, or GitHub Actions secrets) or from a git-ignored `.env` in the repository root.
// They are only ever read by these build-time scripts; the game never sees them (docs/ART_PIPELINE.md).

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ProviderId } from './providers.ts';

export const KEY_NAMES: Record<ProviderId, string> = {
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
};

/** Parses `KEY=value` lines; blank lines and `#` comments are skipped, surrounding quotes removed. */
export function parseDotEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

let dotEnv: Record<string, string> | undefined;

function readDotEnv(): Record<string, string> {
  if (!dotEnv) {
    const path = resolve(import.meta.dirname, '../../.env');
    dotEnv = existsSync(path) ? parseDotEnv(readFileSync(path, 'utf8')) : {};
  }
  return dotEnv;
}

/** The provider's key, from the environment first, then `.env`; undefined when neither has it. */
export function apiKey(provider: ProviderId, env: NodeJS.ProcessEnv = process.env): string | undefined {
  const name = KEY_NAMES[provider];
  const value = env[name] || readDotEnv()[name];
  return value ? value : undefined;
}

export function missingKeyHelp(provider: ProviderId): string {
  return [
    `No ${KEY_NAMES[provider]} found.`,
    `In a Claude Code cloud session: add it to the environment's settings (environment variables), then start a new session.`,
    `On your own computer: copy .env.example to .env and fill it in.`,
  ].join('\n');
}
