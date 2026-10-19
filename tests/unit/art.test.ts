import { describe, expect, it } from 'vitest';
import { BRIEFS } from '../../art/briefs.ts';
import { SERIES } from '../../art/styles.ts';
import {
  auditArt,
  buildPrompt,
  findBrief,
  type ManifestEntry,
  publishedPath,
  upsertEntry,
} from '../../scripts/art/catalogue.ts';
import { apiKey, parseDotEnv } from '../../scripts/art/env.ts';
import {
  chooseProviders,
  type Fetch,
  geminiRequest,
  generate,
  imageModelsFromPing,
  openaiRequest,
  parseGemini,
  parseOpenai,
} from '../../scripts/art/providers.ts';

const PNG_B64 = Buffer.from('fake png bytes').toString('base64');

function entry(id: string, overrides: Partial<ManifestEntry> = {}): ManifestEntry {
  return {
    id,
    briefId: id,
    series: 'portrait',
    provider: 'openai',
    model: 'gpt-image-2.5-sunburst',
    prompt: 'p',
    aspect: '2:3',
    createdAt: '2026-10-19T00:00:00Z',
    approvedAt: '2026-10-19T00:00:00Z',
    candidate: `art/out/${id}/x.png`,
    files: [{ width: 384, path: publishedPath('portrait', id, 384), bytes: 1 }],
    aiGenerated: true,
    ...overrides,
  };
}

describe('briefs and prompts', () => {
  it('every brief is well formed', () => {
    expect(auditArt(BRIEFS, { images: [] }, [], () => true)).toEqual([]);
  });

  it('a prompt is the series style, the subject and what to avoid', () => {
    const brief = findBrief('style-test-relic');
    const prompt = buildPrompt(brief);
    expect(prompt.startsWith(SERIES.illustration.style)).toBe(true);
    expect(prompt).toContain(`Subject: ${brief.subject}`);
    expect(prompt).toContain(`Do not include: ${SERIES.illustration.avoid}.`);
  });

  it('an unknown brief names the ones that exist', () => {
    expect(() => findBrief('nope')).toThrow(/style-test-relic/);
  });
});

describe('the manifest', () => {
  it('replaces an entry with the same id and keeps ids sorted', () => {
    const m = upsertEntry(upsertEntry({ images: [] }, entry('b')), entry('a'));
    const again = upsertEntry(m, entry('b', { model: 'other' }));
    expect(again.images.map((e) => e.id)).toEqual(['a', 'b']);
    expect(again.images[1].model).toBe('other');
  });

  it('finds unrecorded pictures, missing files and unknown briefs', () => {
    const briefs = [{ id: 'a', series: 'portrait' as const, subject: 's', purpose: 'p' }];
    const problems = auditArt(briefs, { images: [entry('a'), entry('ghost')] }, ['art/portrait/stray-384.webp'], (p) =>
      p.includes('/a-'),
    );
    expect(problems.some((p) => p.includes('stray-384.webp is not in art/manifest.json'))).toBe(true);
    expect(problems.some((p) => p.includes('missing file public/art/portrait/ghost-384.webp'))).toBe(true);
    expect(problems.some((p) => p.includes('no brief "ghost"'))).toBe(true);
  });

  it('rejects malformed and duplicate brief ids', () => {
    const b = { series: 'portrait' as const, subject: 's', purpose: 'p' };
    const problems = auditArt(
      [
        { id: 'Bad Id', ...b },
        { id: 'x', ...b },
        { id: 'x', ...b },
      ],
      { images: [] },
      [],
      () => true,
    );
    expect(problems).toHaveLength(2);
  });
});

describe('keys', () => {
  it('reads .env lines, skipping comments and quotes', () => {
    expect(parseDotEnv('# c\nOPENAI_API_KEY="sk-1"\n\nGEMINI_API_KEY=g-2\nBROKEN')).toEqual({
      OPENAI_API_KEY: 'sk-1',
      GEMINI_API_KEY: 'g-2',
    });
  });

  it('prefers the environment', () => {
    expect(apiKey('openai', { OPENAI_API_KEY: 'from-env' })).toBe('from-env');
  });
});

describe('choosing services', () => {
  const onlyGemini = (p: string) => p === 'gemini';

  it('auto uses only the services with a key', () => {
    expect(chooseProviders('auto', onlyGemini)).toEqual(['gemini']);
    expect(chooseProviders('auto', () => true)).toEqual(['openai', 'gemini']);
  });

  it('auto with no key says which key to set', () => {
    expect(() => chooseProviders('auto', () => false)).toThrow(/GEMINI_API_KEY/);
  });

  it('a named service or both is taken as asked', () => {
    expect(chooseProviders('openai', onlyGemini)).toEqual(['openai']);
    expect(chooseProviders('both', onlyGemini)).toEqual(['openai', 'gemini']);
    expect(() => chooseProviders('midjourney', onlyGemini)).toThrow(/auto, gemini, openai or both/);
  });
});

describe('providers', () => {
  const req = { prompt: 'a relic', aspect: '3:2' as const, model: 'm', quality: 'low' as const };

  it('builds an OpenAI images request with a bearer key and the right size', () => {
    const call = openaiRequest(req, 'sk');
    expect(call.url).toBe('https://api.openai.com/v1/images/generations');
    expect(call.init.headers.Authorization).toBe('Bearer sk');
    expect(JSON.parse(String(call.init.body))).toMatchObject({
      model: 'm',
      prompt: 'a relic',
      size: '1536x1024',
      quality: 'low',
      n: 1,
    });
  });

  it('builds a Gemini interactions request with the key header, aspect ratio and no storage', () => {
    const call = geminiRequest(req, 'gk');
    expect(call.url).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    expect(call.init.headers['x-goog-api-key']).toBe('gk');
    expect(JSON.parse(String(call.init.body))).toEqual({
      model: 'm',
      input: [{ type: 'text', text: 'a relic' }],
      response_format: { type: 'image', mime_type: 'image/jpeg', aspect_ratio: '3:2', image_size: '2K' },
      store: false,
    });
  });

  it('reads the picture out of each response', () => {
    const o = parseOpenai({ data: [{ b64_json: PNG_B64, revised_prompt: 'r' }] });
    expect(Buffer.from(o.bytes).toString()).toBe('fake png bytes');
    expect(o.note).toBe('r');
    const g = parseGemini({
      status: 'completed',
      steps: [
        { type: 'thought', content: [{ type: 'image', data: 'ignored' }] },
        {
          type: 'model_output',
          content: [
            { type: 'text', text: 'here' },
            { type: 'image', mime_type: 'image/png', data: PNG_B64 },
          ],
        },
      ],
    });
    expect(Buffer.from(g.bytes).toString()).toBe('fake png bytes');
    expect(g.note).toBe('here');
  });

  it('says why when a response holds no picture', () => {
    expect(() => parseOpenai({ error: { message: 'refused' } })).toThrow(/no image/);
    expect(() => parseGemini({ status: 'failed', steps: [] })).toThrow(/status failed/);
  });

  it('reports a refused request with the status and message', async () => {
    const fetchFn: Fetch = async () => ({
      ok: false,
      status: 401,
      json: async () => ({}),
      text: async () => 'bad key',
    });
    await expect(generate('openai', req, 'sk', fetchFn)).rejects.toThrow('openai answered 401: bad key');
  });

  it('picks the image models out of a model list', () => {
    expect(
      imageModelsFromPing('openai', {
        data: [{ id: 'gpt-5' }, { id: 'gpt-image-2.5-sunburst' }, { id: 'gpt-image-2' }],
      }),
    ).toEqual(['gpt-image-2', 'gpt-image-2.5-sunburst']);
    expect(
      imageModelsFromPing('gemini', {
        models: [
          { name: 'models/gemini-3.6-flash' },
          { name: 'models/gemini-nano-banana-2.1' },
          { name: 'models/gemini-3-pro-image' },
        ],
      }),
    ).toEqual(['gemini-3-pro-image', 'gemini-nano-banana-2.1']);
  });
});
