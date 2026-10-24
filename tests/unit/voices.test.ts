import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { auditVoices, type VoiceRecord } from '../../scripts/voice/catalogue.ts';
import { wordMatch } from '../../scripts/voice/words.ts';
import { ADVISORS, LINES, type LineKind, type Voice } from '../../src/content/advisors.ts';
import { EVENTS } from '../../src/content/events.ts';
import { PLAYABLE_IDS } from '../../src/content/factions.ts';
import { ALONE_LINES, GUIDE_STEPS } from '../../src/content/guide.ts';
import { LESSONS } from '../../src/content/lessons.ts';
import { RADIO } from '../../src/content/radio.ts';
import { clipPath, clipsOf, SPEAKERS, SPOKEN, SPOKEN_RADIO, VOICED_FACTIONS } from '../../src/content/voices.ts';

const BLANK = /\{\w+\}/;
const MANNERS: readonly Voice[] = ['formal', 'warm', 'blunt'];

describe('the spoken lines (VOICES.md §2)', () => {
  it('are spoken by every power a player can lead, and only those', () => {
    expect([...VOICED_FACTIONS].sort()).toEqual([...PLAYABLE_IDS].sort());
  });

  it('give every advisor line a spoken form in each manner, with no blank', () => {
    for (const kind of Object.keys(LINES) as LineKind[])
      for (const manner of MANNERS) {
        const spoken = SPOKEN[kind]?.[manner];
        expect(spoken, `${kind}, ${manner}`).toBeTruthy();
        expect(spoken, `${kind}, ${manner}`).not.toMatch(BLANK);
      }
  });

  it('address Control wherever the written line does', () => {
    for (const kind of Object.keys(LINES) as LineKind[])
      for (const manner of MANNERS)
        if (LINES[kind][manner].startsWith('Control'))
          expect(SPOKEN[kind][manner], `${kind}, ${manner}`).toMatch(/^Control/);
  });

  it('give every radio line of every power that speaks a spoken form, with no blank', () => {
    for (const f of VOICED_FACTIONS)
      for (const stage of Object.keys(RADIO[f].lines) as (keyof (typeof RADIO)[typeof f]['lines'])[]) {
        const spoken = SPOKEN_RADIO[f][stage];
        expect(spoken, `${f}, ${stage}`).toBeTruthy();
        expect(spoken, `${f}, ${stage}`).not.toMatch(BLANK);
      }
  });

  it('speak the lessons, the guided opening and the empty sky as written: they have no blank', () => {
    const manners = new Set(VOICED_FACTIONS.map((f) => ADVISORS[f].voice));
    for (const manner of manners) {
      for (const l of LESSONS) expect(l.lines[manner], l.id).not.toMatch(BLANK);
      for (const s of GUIDE_STEPS) expect(s.lines[manner], s.id).not.toMatch(BLANK);
      expect(ALONE_LINES[manner]).not.toMatch(BLANK);
    }
  });

  it('know which department says each kind, as the report does (src/sim/advice.ts)', () => {
    const source = readFileSync(new URL('../../src/sim/advice.ts', import.meta.url), 'utf8');
    const said = new Map<string, Set<string>>();
    for (const m of source.matchAll(/say\(\s*([^,]+?),\s*[^,]+?,\s*([^,]+?),/gs)) {
      const departments =
        m[1].trim() === 'def.department' ? Object.values(EVENTS).map((e) => e.department) : [m[1].trim().slice(1, -1)];
      for (const kind of m[2]
        .match(/'([a-z-]+)'/g)
        ?.map((k) => k.slice(1, -1))
        .filter((k) => k in LINES) ?? [])
        for (const d of departments) said.set(kind, (said.get(kind) ?? new Set()).add(d));
    }
    // The kinds chosen in code rather than named in the call (a battle's, a gift's) are in the table too.
    for (const [kind, departments] of said)
      expect([...departments].sort(), kind).toEqual([...SPEAKERS[kind as LineKind]].sort());
    for (const kind of Object.keys(LINES)) expect(SPEAKERS[kind as LineKind], kind).toBeTruthy();
  });

  it('give each power that speaks its 89 clips, each named once (VOICES.md §1)', () => {
    for (const f of VOICED_FACTIONS) {
      const clips = clipsOf(f);
      expect(clips).toHaveLength(89);
      expect(new Set(clips.map((c) => c.id)).size).toBe(89);
      for (const c of clips) expect(c.text, c.id).not.toMatch(BLANK);
    }
  });
});

describe('the voice records (VOICES.md §4)', () => {
  const record = (path: string, text: string): VoiceRecord =>
    ({ path, text, aiGenerated: true }) as unknown as VoiceRecord;
  const all = VOICED_FACTIONS.flatMap((f) => clipsOf(f).map((c) => record(clipPath(f, c.id), c.text)));

  it('pass when every clip is made, recorded and up to date', () => {
    expect(
      auditVoices(
        { clips: all },
        all.map((r) => r.path),
        () => true,
      ),
    ).toEqual([]);
  });

  it('name a clip not made, one whose line has changed, a missing file and a file with no record', () => {
    const [first, second, ...rest] = all;
    const problems = auditVoices(
      { clips: [{ ...second, text: 'Something else.' }, ...rest] },
      [...all.map((r) => r.path), 'voice/sta/stray.mp3'],
      (p) => p !== rest[0].path,
    );
    expect(problems.some((p) => p.startsWith(`${first.path} is not made yet`))).toBe(true);
    expect(problems.some((p) => p.includes(`${second.path} says "Something else."`))).toBe(true);
    expect(problems.some((p) => p.includes(`${rest[0].path}'s file is missing`))).toBe(true);
    expect(problems.some((p) => p.startsWith('voice/sta/stray.mp3 has no record'))).toBe(true);
  });
});

describe('hearing a take back (VOICES.md §3)', () => {
  it('counts the words meant that were heard, in order', () => {
    expect(wordMatch('They want a fight. They’ve declared war.', 'They want a fight, they’ve declared war')).toBe(1);
    expect(wordMatch('They want a fight.', 'They want to fight')).toBe(0.75);
    expect(wordMatch('Lane’s open.', '')).toBe(0);
  });

  it('takes the transcriber’s American spellings for the game’s British ones, and ignores delivery tags', () => {
    expect(wordMatch('Our survey confirms the old catalogues.', 'our survey confirms the old catalogs')).toBe(1);
    expect(wordMatch('Our neighbours have settled.', 'our neighbors have settled')).toBe(1);
    expect(wordMatch('[gruff, blunt] Done. It works.', 'done it works')).toBe(1);
  });
});
