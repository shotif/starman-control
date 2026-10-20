// Makes candidate pictures for briefs, for review. Nothing goes into the game until it is approved.
//
//   npm run art:generate -- --brief style-test-relic [--provider auto|gemini|openai|both] [--count 2]
//                           [--model <id>] [--quality low|medium|high] [--backdrop white|magenta] [--dry-run]
//   npm run art:generate -- --all --dry-run        # every brief; --dry-run prints prompts, calls nothing
//
// `auto` (the default) uses every service that has a key. Candidates land in art/out/<brief>/
// (ignored by git) with a .json record beside each picture. A series keyed to transparency (a
// landscape or a building) is painted on its flat backdrop; --backdrop tries the other one.

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { BRIEFS } from '../../art/briefs.ts';
import { SERIES } from '../../art/styles.ts';
import { buildPrompt, type CandidateRecord, findBrief, keySpecFor } from './catalogue.ts';
import { apiKey, missingKeyHelp } from './env.ts';
import type { Backdrop } from './keying.ts';
import { chooseProviders, DEFAULT_MODELS, generate, type ProviderId } from './providers.ts';

const { values } = parseArgs({
  options: {
    brief: { type: 'string', multiple: true },
    all: { type: 'boolean', default: false },
    provider: { type: 'string', default: 'auto' },
    count: { type: 'string', default: '1' },
    model: { type: 'string' },
    quality: { type: 'string', default: 'medium' },
    backdrop: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
  },
});

const briefIds = values.all ? BRIEFS.map((b) => b.id) : (values.brief ?? []).flatMap((s) => s.split(','));
if (briefIds.length === 0) {
  console.error(`Name a brief with --brief <id> (or --all). Briefs:\n  ${BRIEFS.map((b) => b.id).join('\n  ')}`);
  process.exit(1);
}
const dryRun = values['dry-run'];
let providers: ProviderId[];
try {
  // A dry run calls nothing, so it may show every service's prompt without keys.
  providers = chooseProviders(values.provider, (p) => dryRun || apiKey(p) !== undefined);
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}
if (values.model && providers.length > 1) {
  console.error("--model names one service's model: pick that service with --provider.");
  process.exit(1);
}
const count = Math.max(1, Math.min(8, Number(values.count) || 1));
const quality = values.quality as 'low' | 'medium' | 'high';
if (values.backdrop && values.backdrop !== 'white' && values.backdrop !== 'magenta') {
  console.error('--backdrop must be white or magenta.');
  process.exit(1);
}
const backdrop = values.backdrop as Backdrop | undefined;

const keys = new Map<ProviderId, string>();
if (!dryRun) {
  for (const p of providers) {
    const key = apiKey(p);
    if (!key) {
      console.error(missingKeyHelp(p));
      process.exit(1);
    }
    keys.set(p, key);
  }
}

const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');
let made = 0;
let failed = 0;

for (const id of briefIds) {
  const brief = findBrief(id);
  const prompt = buildPrompt(brief, backdrop);
  const keying = keySpecFor(brief, backdrop);
  const aspect = SERIES[brief.series].aspect;
  for (const provider of providers) {
    const model = values.model ?? DEFAULT_MODELS[provider];
    const key = keys.get(provider);
    // Only a dry run has no keys here: it shows the prompt instead of calling the service.
    if (!key) {
      console.log(`--- ${id} · ${provider} · ${model} · ${aspect}\n${prompt}\n`);
      continue;
    }
    const dir = resolve(import.meta.dirname, '../../art/out', id);
    mkdirSync(dir, { recursive: true });
    for (let n = 1; n <= count; n++) {
      const name = `${stamp}-${model}-${n}`;
      try {
        const image = await generate(provider, { prompt, aspect, model, quality }, key, fetch);
        const ext = image.mimeType === 'image/jpeg' ? 'jpg' : image.mimeType === 'image/webp' ? 'webp' : 'png';
        const record: CandidateRecord = {
          briefId: id,
          provider,
          model,
          prompt,
          aspect,
          quality: provider === 'openai' ? quality : undefined,
          createdAt: new Date().toISOString(),
          note: image.note,
          key: keying,
        };
        writeFileSync(resolve(dir, `${name}.${ext}`), image.bytes);
        writeFileSync(resolve(dir, `${name}.json`), `${JSON.stringify(record, null, 2)}\n`);
        console.log(`made art/out/${id}/${name}.${ext}`);
        made++;
      } catch (err) {
        console.error(`failed ${id} with ${provider}: ${(err as Error).message}`);
        failed++;
      }
    }
  }
}

if (!dryRun) console.log(`${made} made, ${failed} failed.`);
process.exit(failed > 0 && made === 0 ? 1 : 0);
