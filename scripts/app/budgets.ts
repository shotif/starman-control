// The size budgets (M1_PROOF.md §4), measured on the build after `vite build`: what the title
// loads, and what a phone loads to reach the map in a game, compressed. Fails when over budget.
// Run by `npm run check` and in CI.

import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

interface Chunk {
  file: string;
  imports?: string[];
  css?: string[];
}

const KB = 1024;
const BUDGETS = [
  { name: 'The title (first screen)', from: ['index.html'], limit: 40 * KB },
  {
    name: 'First load to the map in a game',
    from: ['index.html', 'src/ui/game/route.tsx', 'src/render/MapView.ts'],
    limit: 900 * KB,
  },
];

const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8')) as Record<string, Chunk>;

/** Every file a set of entries loads before it can show: their static imports and styles. */
function files(entries: string[]): Set<string> {
  const out = new Set<string>();
  const seen = new Set<string>();
  const visit = (key: string) => {
    if (seen.has(key)) return;
    seen.add(key);
    const c = manifest[key];
    if (!c) throw new Error(`budgets: ${key} is not in the build`);
    out.add(c.file);
    for (const css of c.css ?? []) out.add(css);
    for (const i of c.imports ?? []) visit(i);
  };
  for (const e of entries) visit(e);
  return out;
}

let failed = false;
for (const b of BUDGETS) {
  let bytes = 0;
  for (const f of files(b.from)) bytes += gzipSync(await readFile(`dist/${f}`)).length;
  const ok = bytes <= b.limit;
  failed ||= !ok;
  console.log(`${ok ? 'ok  ' : 'OVER'} ${b.name}: ${(bytes / KB).toFixed(1)} KB of ${(b.limit / KB).toFixed(0)} KB`);
}
if (failed) {
  console.error('budgets: over budget (docs/design/M1_PROOF.md §4)');
  process.exit(1);
}
