// The size budgets (M1_PROOF.md §4), measured on the build after `vite build`: what the title
// loads, and what a phone loads to reach the map in a game, compressed; and what a phone loads to
// open a colony's scene (COLONY_VIEW.md §5): the scene's own code, past what the map already
// loaded, and the pictures of the heaviest first visit. Fails when over budget. Run by
// `npm run check` and in CI.

import { readdir, readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { colonyPictureSets } from './colonyPictures.ts';

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
// Opening a colony: the code the map has not already loaded.
{
  const map = files(['index.html', 'src/ui/game/route.tsx', 'src/render/MapView.ts']);
  let bytes = 0;
  for (const f of files(['src/render/ColonyView.ts']))
    if (!map.has(f)) bytes += gzipSync(await readFile(`dist/${f}`)).length;
  const limit = 40 * KB;
  const ok = bytes <= limit;
  failed ||= !ok;
  console.log(`${ok ? 'ok  ' : 'OVER'} Opening a colony (its code): ${(bytes / KB).toFixed(1)} KB of ${limit / KB} KB`);
}

// A colony's first visit on a phone, at its heaviest (COLONY_VIEW.md §5, §9.3): every scene the
// game can draw for a colony, worked out by its own code (scripts/app/colonyPictures.ts), and the
// pictures each loads at the phone's widths. WebP is already compressed.
{
  const sizes = new Map<string, number>();
  const size = async (file: string) => {
    if (!sizes.has(file))
      sizes.set(
        file,
        await stat(`dist/art/${file}`).then(
          (s) => s.size,
          () => 0,
        ),
      );
    return sizes.get(file) ?? 0;
  };
  // What a phone loads for a colony's still (its first pictures) and for the diorama the still
  // opens, each picture at the width the game chooses for it (M2_WORLDS.md §23.4).
  const sets = colonyPictureSets();
  for (const [which, label, limit] of [
    ['still', "A colony's first pictures on a phone (its still)", 1024 * KB],
    ['diorama', "A colony's diorama on a phone", 2048 * KB],
  ] as const) {
    let worst = 0;
    let worstName = '';
    for (const set of sets) {
      let bytes = 0;
      for (const f of set[which]) bytes += await size(f);
      if (bytes > worst) {
        worst = bytes;
        worstName = set.name;
      }
    }
    const ok = worst <= limit;
    failed ||= !ok;
    console.log(
      `${ok ? 'ok  ' : 'OVER'} ${label}, at most (${worstName}): ${(worst / KB).toFixed(1)} KB of ${limit / KB} KB`,
    );
  }
}

// The music (MUSIC.md §3): every piece at most 3 MB, and none in the first load or in the list the
// service worker keeps at the first visit (a piece is downloaded only when it plays).
{
  const limit = 3 * 1024 * KB;
  let heaviest = 0;
  let name = '';
  const pieces = await readdir('dist/music').catch(() => [] as string[]);
  for (const f of pieces.filter((x) => x.endsWith('.mp3'))) {
    const bytes = (await stat(`dist/music/${f}`)).size;
    if (bytes > heaviest) {
      heaviest = bytes;
      name = f;
    }
  }
  const html = await readFile('dist/index.html', 'utf8');
  const listed = /music\/[\w-]+\.mp3/.test(html);
  const ok = heaviest <= limit && !listed;
  failed ||= !ok;
  console.log(
    `${ok ? 'ok  ' : 'OVER'} Music: the largest piece${name ? ` (${name})` : ''} ${(heaviest / KB / 1024).toFixed(2)} MB of 3 MB; ${listed ? 'listed in the first load' : 'none in the first load'}`,
  );
}

if (failed) {
  console.error('budgets: over budget (docs/design/M1_PROOF.md §4)');
  process.exit(1);
}
