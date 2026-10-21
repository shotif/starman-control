// Google's Lyria through Gemini's Interactions API (docs/design/MUSIC.md §4): the request and its
// answer, pure so they are tested without a key. The key goes in a header, never in a log.

export const DEFAULT_MUSIC_MODEL = 'lyria-3.5';

export interface MusicCall {
  url: string;
  init: { method: 'POST'; headers: Record<string, string>; body: string };
}

export function lyriaRequest(prompt: string, model: string, key: string): MusicCall {
  return {
    url: 'https://generativelanguage.googleapis.com/v1beta/interactions',
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        model,
        input: [{ type: 'text', text: prompt }],
        response_format: { type: 'audio' },
        store: false,
      }),
    },
  };
}

export interface GeneratedMusic {
  bytes: Uint8Array;
  mimeType: string;
  /** Any words the model gave beside the audio (a description of its structure). */
  note?: string;
}

/** The last audio the model produced, and any text beside it. */
export function parseLyria(json: unknown): GeneratedMusic {
  type Block = { type?: string; text?: string; data?: string; mime_type?: string };
  const body = json as { status?: string; steps?: { type?: string; content?: Block[] }[] };
  const blocks = (body.steps ?? []).filter((s) => s.type === 'model_output').flatMap((s) => s.content ?? []);
  const audio = blocks.filter((b) => b.type === 'audio' && b.data).at(-1);
  if (!audio?.data)
    throw new Error(
      `Lyria returned no audio (status ${body.status ?? 'unknown'}): ${JSON.stringify(json).slice(0, 400)}`,
    );
  const text = blocks
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text)
    .join(' ')
    .trim();
  return {
    bytes: new Uint8Array(Buffer.from(audio.data, 'base64')),
    mimeType: audio.mime_type ?? 'audio/mpeg',
    note: text || undefined,
  };
}
