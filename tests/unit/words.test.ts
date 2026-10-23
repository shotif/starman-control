import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * British English in every string the player reads (CLAUDE.md, M6_ONE.md §27.3): the quoted text
 * and the JSX text of src/content and src/ui, word by word, never code such as a CSS property.
 */

const AMERICAN = new RegExp(
  `\\b(${[
    'colors?',
    'colored',
    'centers?',
    'centered',
    'behaviors?',
    'favors?',
    'favorites?',
    'honors?',
    'labors?',
    'defenses?',
    'offenses?',
    'neighbors?',
    'neighborhoods?',
    'gray',
    'armor',
    'harbors?',
    'rumors?',
    'vapors?',
    'fibers?',
    'theaters?',
    'meters?',
    'kilometers?',
    'maneuvers?',
    'catalog',
    'dialog',
    'traveled',
    'traveling',
    'canceled',
    'labeled',
    'modeled',
    'fueled',
    'judgment',
    '\\w+(?:iz(?:e|es|ed|ing|ation|ations))',
    '\\w+(?:yz(?:e|es|ed|ing))',
  ].join('|')})\\b`,
  'i',
);
/** Words of the -ize shape that are English everywhere. */
const ALLOWED = /^(size[sd]?|sizing|prize[sd]?|seize[sd]?|seizing|capsize[sd]?|resize[sd]?|resizing|downsize[sd]?)$/i;

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : [],
  );
}

/** The prose of a line: quoted strings with a space in them, and JSX text. */
function prose(line: string, jsx: boolean): string[] {
  const out: string[] = [];
  for (const m of line.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`([^`]*)`/g)) {
    const t = m[1] ?? m[2] ?? m[3] ?? '';
    if (/[A-Za-z] [A-Za-z]/.test(t)) out.push(t);
  }
  if (jsx) for (const m of line.matchAll(/>([^<>{}]+)</g)) out.push(m[1] as string);
  if (jsx && /^[A-Za-z][^=;{}()<>]*[a-z] [a-z][^=;{}()<>]*$/.test(line.trim())) out.push(line.trim());
  return out;
}

describe('the words', () => {
  it('are British in every string the player reads', () => {
    const found: string[] = [];
    for (const f of [...files('src/content'), ...files('src/ui')]) {
      const lines = readFileSync(f, 'utf8').split('\n');
      lines.forEach((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
        for (const text of prose(line, f.endsWith('.tsx')))
          for (const m of text.matchAll(new RegExp(AMERICAN.source, 'gi')))
            if (!ALLOWED.test(m[0])) found.push(`${f}:${i + 1}: ${m[0]} in “${text.trim().slice(0, 80)}”`);
      });
    }
    expect(found).toEqual([]);
  });

  it('finds an American spelling when there is one', () => {
    expect(AMERICAN.test('the colonies were colonized')).toBe(true);
    expect(AMERICAN.test('a neighbor’s defense')).toBe(true);
    expect(AMERICAN.test('the colonies were colonised in the neighbourhood')).toBe(false);
    expect(prose(`  label: 'Defense of the realm',`, false)).toEqual(['Defense of the realm']);
    expect(prose(`<p class="dim">We colonize it</p>`, true)).toContain('We colonize it');
  });
});
