// The size budgets (M1_PROOF.md §4), measured on the build after `vite build`: what the title
// loads, and what a phone loads to reach the map in a game, compressed; and what a phone loads to
// open a colony's scene (COLONY_VIEW.md §5): the scene's own code, past what the map already
// loaded, and the pictures of the heaviest first visit. Fails when over budget. Run by
// `npm run check` and in CI.

import { readdir, readFile, stat } from 'node:fs/promises';
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

// A colony's first visit on a phone, at its heaviest (COLONY_VIEW.md §9.3): for each power and
// envelope, the largest landscape; the heaviest six of its homes (any size and version) and its
// hall; the heaviest four of its projects and the scaffold; the fields where open; its shuttle and
// the rover; and the heaviest eight props it can show; at the phone's widths. WebP is compressed.
{
  const size = async (dir: string, file: string) => {
    try {
      return (await stat(`dist/art/${dir}/${file}`)).size;
    } catch {
      return 0;
    }
  };
  const files = async (dir: string, suffix: string) => {
    try {
      return (await readdir(`dist/art/${dir}`)).filter((f) => f.endsWith(suffix));
    } catch {
      return [];
    }
  };
  const heaviest = async (dir: string, names: string[], n: number) =>
    (await Promise.all(names.map((f) => size(dir, f))))
      .sort((a, b) => b - a)
      .slice(0, n)
      .reduce((a, b) => a + b, 0);
  const lands = await files('landscape', '-1280.webp');
  const land = Math.max(0, ...(await Promise.all(lands.map((f) => size('landscape', f)))));
  const pieces = await files('structure', '-512.webp');
  const props = await files('prop', '-256.webp');
  const own = ['water-tanks', 'mast', 'cargo', 'greenhouse', 'monument'];
  let worst = 0;
  let worstName = '';
  for (const a of ['authority', 'cooperative', 'wake'])
    for (const e of ['open', 'domed']) {
      const homes = pieces.filter((f) => f.startsWith(`${a}-homes-`) && f.includes(`-${e}`));
      const projects = ['lane-station', 'mine', 'shipyard', 'survey-station'].map((p) => `${a}-${p}-512.webp`);
      const usable = props.filter(
        (f) => own.every((k) => !f.startsWith(k)) && !/^(authority|cooperative|wake)-/.test(f),
      );
      const mine = props.filter((f) => f.startsWith(`${a}-`));
      const bytes =
        land +
        (await heaviest('structure', [...homes, `${a}-hall-512.webp`], 6)) +
        (await heaviest('structure', [...projects, 'scaffold-512.webp'], 4)) +
        (e === 'open' ? await size('structure', 'fields-512.webp') : 0) +
        (await size('structure', `${a}-shuttle-512.webp`)) +
        (await size('structure', 'rover-512.webp')) +
        (await heaviest('prop', [...usable, ...mine], 8));
      if (bytes > worst) {
        worst = bytes;
        worstName = `${a}, ${e}`;
      }
    }
  const limit = 1024 * KB;
  const ok = worst <= limit;
  failed ||= !ok;
  console.log(
    `${ok ? 'ok  ' : 'OVER'} A colony's first pictures on a phone, at most (${worstName}): ${(worst / KB).toFixed(1)} KB of ${limit / KB} KB`,
  );
}

if (failed) {
  console.error('budgets: over budget (docs/design/M1_PROOF.md §4)');
  process.exit(1);
}
