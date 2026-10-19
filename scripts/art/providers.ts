// The two image services the owner provides (D-09). Each provider turns a prompt into a request and
// a response into image bytes; `generate` does the call with an injected fetch so tests need no network.

export type ProviderId = 'openai' | 'gemini';
export const PROVIDERS: readonly ProviderId[] = ['openai', 'gemini'];

/**
 * Which services a command uses: `auto` (the default) means every service with a key, so the
 * scripts work with only one key set; `both`, `openai` or `gemini` name them outright.
 */
export function chooseProviders(choice: string, hasKey: (p: ProviderId) => boolean): ProviderId[] {
  if (choice === 'auto') {
    const keyed = PROVIDERS.filter(hasKey);
    if (keyed.length === 0) throw new Error('No image service has a key: set GEMINI_API_KEY (docs/ART_PIPELINE.md).');
    return keyed;
  }
  if (choice === 'both') return [...PROVIDERS];
  const one = PROVIDERS.find((p) => p === choice);
  if (!one) throw new Error(`--provider must be auto, gemini, openai or both (not "${choice}").`);
  return [one];
}

export type Aspect = '1:1' | '2:3' | '3:2';

/**
 * Default models, each provider's flagship in its own documentation on 19 October 2026; `--model`
 * names another. Image models are renamed and retired often: `npm run art:ping` lists what a key
 * can use and warns when a default has gone (docs/ART_PIPELINE.md).
 */
export const DEFAULT_MODELS: Record<ProviderId, string> = {
  openai: 'gpt-image-2.5-sunburst',
  gemini: 'gemini-nano-banana-2.1',
};

export interface ImageRequest {
  prompt: string;
  aspect: Aspect;
  model: string;
  /** OpenAI only: low, medium or high (cost rises with quality). */
  quality?: 'low' | 'medium' | 'high';
}

export interface GeneratedImage {
  bytes: Uint8Array;
  mimeType: string;
  /** Any text the service returned alongside the picture (a revised prompt, a caption). */
  note?: string;
}

export interface HttpCall {
  url: string;
  init: { method: 'POST' | 'GET'; headers: Record<string, string>; body?: string };
}

const OPENAI_SIZES: Record<Aspect, string> = { '1:1': '1024x1024', '2:3': '1024x1536', '3:2': '1536x1024' };

export function openaiRequest(req: ImageRequest, key: string): HttpCall {
  return {
    url: 'https://api.openai.com/v1/images/generations',
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: req.model,
        prompt: req.prompt,
        size: OPENAI_SIZES[req.aspect],
        quality: req.quality ?? 'medium',
        output_format: 'png',
        n: 1,
      }),
    },
  };
}

// Gemini's Interactions API, which its image guide documents. `store: false` keeps Google from
// holding the request for later retrieval. Its image models return JPEG only: asking for PNG is
// refused with a 400 (seen 19 October 2026), and approval re-encodes to WebP anyway.
export function geminiRequest(req: ImageRequest, key: string): HttpCall {
  return {
    url: 'https://generativelanguage.googleapis.com/v1beta/interactions',
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        model: req.model,
        input: [{ type: 'text', text: req.prompt }],
        response_format: { type: 'image', mime_type: 'image/jpeg', aspect_ratio: req.aspect, image_size: '2K' },
        store: false,
      }),
    },
  };
}

export function parseOpenai(json: unknown): GeneratedImage {
  const data = (json as { data?: { b64_json?: string; revised_prompt?: string }[] }).data;
  const first = data?.[0];
  if (!first?.b64_json) throw new Error(`OpenAI returned no image: ${brief(json)}`);
  return { bytes: fromBase64(first.b64_json), mimeType: 'image/png', note: first.revised_prompt };
}

/** The last image the model produced, as the SDKs' `output_image` takes it, and any text beside it. */
export function parseGemini(json: unknown): GeneratedImage {
  type Block = { type?: string; text?: string; data?: string; mime_type?: string };
  const body = json as { status?: string; steps?: { type?: string; content?: Block[] }[] };
  const blocks = (body.steps ?? []).filter((s) => s.type === 'model_output').flatMap((s) => s.content ?? []);
  const image = blocks.filter((b) => b.type === 'image' && b.data).at(-1);
  if (!image?.data) throw new Error(`Gemini returned no image (status ${body.status ?? 'unknown'}): ${brief(json)}`);
  const text = blocks
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text)
    .join(' ')
    .trim();
  return { bytes: fromBase64(image.data), mimeType: image.mime_type ?? 'image/jpeg', note: text || undefined };
}

/** A cheap call that proves a key works without making a picture: list the provider's models. */
export function pingRequest(provider: ProviderId, key: string): HttpCall {
  return provider === 'openai'
    ? { url: 'https://api.openai.com/v1/models', init: { method: 'GET', headers: { Authorization: `Bearer ${key}` } } }
    : {
        url: 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',
        init: { method: 'GET', headers: { 'x-goog-api-key': key } },
      };
}

/** The ids of the models a ping lists that can make images, so a default can be checked against them. */
export function imageModelsFromPing(provider: ProviderId, json: unknown): string[] {
  if (provider === 'openai') {
    const data = (json as { data?: { id: string }[] }).data ?? [];
    return data
      .map((m) => m.id)
      .filter((id) => /image|dall-e/i.test(id))
      .sort();
  }
  const models = (json as { models?: { name: string }[] }).models ?? [];
  return models
    .map((m) => m.name.replace(/^models\//, ''))
    .filter((id) => /image|banana/i.test(id))
    .sort();
}

export type Fetch = (
  url: string,
  init: HttpCall['init'],
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }>;

export async function generate(
  provider: ProviderId,
  req: ImageRequest,
  key: string,
  fetchFn: Fetch,
): Promise<GeneratedImage> {
  const call = provider === 'openai' ? openaiRequest(req, key) : geminiRequest(req, key);
  const res = await fetchFn(call.url, call.init);
  if (!res.ok) throw new Error(`${provider} answered ${res.status}: ${(await res.text()).slice(0, 600)}`);
  const json = await res.json();
  return provider === 'openai' ? parseOpenai(json) : parseGemini(json);
}

function fromBase64(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

function brief(json: unknown): string {
  return JSON.stringify(json).slice(0, 400);
}
