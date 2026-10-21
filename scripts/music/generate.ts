// Makes candidate pieces of music for review (docs/design/MUSIC.md §4). Nothing goes into the game
// until a candidate is approved.
//
//   npm run music:generate -- --piece title[,map-1…] [--count 2] [--model lyria-3.5] [--dry-run]
//
// Candidates land in music/out/<piece>/ (ignored by git), each with a .json record beside it.

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { MUSIC_BRIEFS, musicPrompt } from '../../music/briefs.ts';
import { apiKey, missingKeyHelp } from '../art/env.ts';
import { DEFAULT_MUSIC_MODEL, lyriaRequest, parseLyria } from './lyria.ts';

const { values } = parseArgs({
  options: {
    piece: { type: 'string', multiple: true },
    count: { type: 'string', default: '1' },
    model: { type: 'string', default: DEFAULT_MUSIC_MODEL },
    'dry-run': { type: 'boolean', default: false },
  },
});

const ids = (values.piece ?? []).flatMap((s) => s.split(','));
if (ids.length === 0) {
  console.error(`Name a piece with --piece <id>. Pieces:\n  ${MUSIC_BRIEFS.map((b) => b.id).join('\n  ')}`);
  process.exit(1);
}
const count = Math.max(1, Math.min(4, Number(values.count) || 1));
const model = values.model ?? DEFAULT_MUSIC_MODEL;
const key = values['dry-run'] ? '' : apiKey('gemini');
if (!values['dry-run'] && !key) {
  console.error(missingKeyHelp('gemini'));
  process.exit(1);
}

/**
 * One request, tried again up to twice when Lyria's filter refuses it: the same prompt was refused
 * once and accepted the next time (21 October 2026), so a refusal is not always about the words.
 */
async function ask(prompt: string, model: string, key: string): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const call = lyriaRequest(prompt, model, key);
    const res = await fetch(call.url, call.init);
    if (res.ok) return res.json();
    const text = await res.text();
    if (attempt < 2 && text.includes('content_blocked')) {
      console.log('  refused by the filter; trying again');
      continue;
    }
    throw new Error(`gemini answered ${res.status}: ${text.slice(0, 600)}`);
  }
}

const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');
let made = 0;
let failed = 0;
for (const id of ids) {
  const brief = MUSIC_BRIEFS.find((b) => b.id === id);
  if (!brief) {
    console.error(`No piece ${id}.`);
    failed++;
    continue;
  }
  const prompt = musicPrompt(brief);
  if (values['dry-run'] || !key) {
    console.log(`--- ${id} · ${model}\n${prompt}\n`);
    continue;
  }
  const dir = resolve(import.meta.dirname, '../../music/out', id);
  mkdirSync(dir, { recursive: true });
  for (let n = 1; n <= count; n++) {
    const name = `${stamp}-${model}-${n}`;
    try {
      const music = parseLyria(await ask(prompt, model, key));
      const ext = music.mimeType.includes('wav') ? 'wav' : 'mp3';
      writeFileSync(resolve(dir, `${name}.${ext}`), music.bytes);
      const record = {
        pieceId: id,
        provider: 'gemini',
        model,
        prompt,
        createdAt: new Date().toISOString(),
        note: music.note,
      };
      writeFileSync(resolve(dir, `${name}.json`), `${JSON.stringify(record, null, 2)}\n`);
      console.log(`made music/out/${id}/${name}.${ext}`);
      made++;
    } catch (err) {
      console.error(`failed ${id}: ${(err as Error).message}`);
      failed++;
    }
  }
}
if (!values['dry-run']) console.log(`${made} made, ${failed} failed.`);
process.exit(failed > 0 && made === 0 ? 1 : 0);
