// ElevenLabs for the voices (docs/design/VOICES.md §4): speech from a stock voice, and speech to text
// to check every take says its words. The key and the host are ELEVENLABS_API_KEY and
// ELEVENLABS_API_BASE, from the environment or the git-ignored `.env` (scripts/art/env.ts); the key is
// sent only to that host, as the `xi-api-key` header, and nothing here prints it.

import { envValue } from '../art/env.ts';

const KEY = envValue('ELEVENLABS_API_KEY');
const BASE = envValue('ELEVENLABS_API_BASE') ?? 'https://api.elevenlabs.io';

export function hasKey(): boolean {
  return !!KEY;
}

export function missingKeyHelp(): string {
  return 'No ELEVENLABS_API_KEY found: add it (and ELEVENLABS_API_BASE for a residency host) to .env in the repository root.';
}

/** Waits before a second and third try (a busy service, a dropped connection). */
const RETRY_MS = [3000, 10000];

async function call(path: string, init: RequestInit): Promise<Response> {
  if (!KEY) throw new Error(missingKeyHelp());
  let last = '';
  for (let attempt = 0; attempt <= RETRY_MS.length; attempt++) {
    if (attempt > 0) await new Promise((done) => setTimeout(done, RETRY_MS[attempt - 1]));
    try {
      const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...init.headers, 'xi-api-key': KEY } });
      if (res.ok) return res;
      last = `${res.status}: ${(await res.text()).slice(0, 300)}`;
      if (res.status !== 429 && res.status < 500) break;
    } catch (e) {
      last = (e as Error).message;
    }
  }
  throw new Error(`ElevenLabs refused ${path.split('?')[0]} (${last})`);
}

/** One take of `text` in a stock voice, as 44.1 kHz MP3. */
export async function speak(voiceId: string, text: string, model: string): Promise<Buffer> {
  const res = await call(`/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: model }),
  });
  return Buffer.from(await res.arrayBuffer());
}

/** What a take says, heard back by speech to text. */
export async function transcribe(audio: Buffer): Promise<string> {
  const form = new FormData();
  form.append('model_id', 'scribe_v2');
  form.append('language_code', 'en');
  form.append('file', new Blob([new Uint8Array(audio)], { type: 'audio/mpeg' }), 'take.mp3');
  const res = await call('/v1/speech-to-text', { method: 'POST', body: form });
  return ((await res.json()) as { text: string }).text;
}
