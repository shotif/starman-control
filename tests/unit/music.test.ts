import { describe, expect, it } from 'vitest';
import { MUSIC_BRIEFS, musicPrompt } from '../../music/briefs.ts';
import manifest from '../../music/manifest.json' with { type: 'json' };
import { auditMusic, upsertMusic } from '../../scripts/music/catalogue.ts';
import { lyriaRequest, parseLyria } from '../../scripts/music/lyria.ts';
import { FACTIONS, PLAYABLE_IDS } from '../../src/content/factions.ts';
import {
  MOOD_PIECES,
  MUSIC_PIECES,
  type MusicMood,
  moodFor,
  nextPiece,
  PUBLISHED_PIECES,
  SILENCE_SECONDS,
} from '../../src/content/music.ts';

describe('the music (MUSIC.md)', () => {
  it('plays the title everywhere but the map, and each place its own there', () => {
    expect(moodFor({ screen: 'other' })).toBe('title');
    expect(moodFor({ screen: 'map' })).toBe('map');
    expect(moodFor({ screen: 'map', system: true })).toBe('system');
    expect(moodFor({ screen: 'map', system: true, colony: 'wake' })).toBe('colony-wake');
  });

  it('gives every power’s colonies the piece of its architecture, never the player’s (D-08)', () => {
    for (const f of PLAYABLE_IDS) {
      const mood = moodFor({ screen: 'map', colony: FACTIONS[f].architecture }) as MusicMood;
      expect(MOOD_PIECES[mood]).toEqual([`colony-${FACTIONS[f].architecture}`]);
    }
  });

  it('takes the map’s two pieces in turn, and repeats a place’s only piece', () => {
    expect(nextPiece('map', null)).toBe('map-1');
    expect(nextPiece('map', 'map-1')).toBe('map-2');
    expect(nextPiece('map', 'map-2')).toBe('map-1');
    expect(nextPiece('title', 'title')).toBe('title');
    expect(SILENCE_SECONDS.map).toBeGreaterThan(SILENCE_SECONDS.title);
  });

  it('has a brief for every piece, none naming a person or a work', () => {
    expect(MUSIC_BRIEFS.map((b) => b.id).sort()).toEqual([...MUSIC_PIECES].sort());
    for (const b of MUSIC_BRIEFS) {
      const prompt = musicPrompt(b);
      expect(prompt).toContain('no vocals');
      expect(prompt).not.toMatch(/\b(by|in the style of)\s+[A-Z]/);
    }
  });

  it('has published exactly the pieces the records hold, each generated and recorded', () => {
    expect(manifest.pieces.map((p) => p.id).sort()).toEqual([...PUBLISHED_PIECES].sort());
    for (const p of manifest.pieces) {
      expect(p.aiGenerated).toBe(true);
      expect(p.path).toBe(`music/${p.id}.mp3`);
      expect(p.bytes).toBeLessThanOrEqual(3 * 1024 * 1024);
    }
  });
});

describe('the music pipeline', () => {
  it('asks Lyria for audio through the Interactions API, with the key in a header', () => {
    const call = lyriaRequest('a calm piece', 'lyria-3.5', 'secret');
    expect(call.url).toMatch(/\/v1beta\/interactions$/);
    expect(call.init.headers['x-goog-api-key']).toBe('secret');
    expect(call.url).not.toContain('secret');
    expect(JSON.parse(call.init.body)).toMatchObject({ model: 'lyria-3.5', response_format: { type: 'audio' } });
  });

  it('reads the audio and the notes from the answer', () => {
    const json = {
      status: 'completed',
      steps: [
        {
          type: 'model_output',
          content: [
            { type: 'text', text: '[[A0]]' },
            { type: 'audio', data: 'AAEC', mime_type: 'audio/mpeg' },
          ],
        },
      ],
    };
    const m = parseLyria(json);
    expect([...m.bytes]).toEqual([0, 1, 2]);
    expect(m.mimeType).toBe('audio/mpeg');
    expect(m.note).toBe('[[A0]]');
    expect(() => parseLyria({ status: 'failed', steps: [] })).toThrow(/no audio/);
  });

  it('finds published pieces without records, and records without files', () => {
    const record = { ...manifest.pieces[0], id: 'title', path: 'music/title.mp3' } as (typeof manifest.pieces)[number];
    const m = upsertMusic({ pieces: [] }, record as Parameters<typeof upsertMusic>[1]);
    expect(auditMusic(m, ['music/title.mp3'], () => true)).toEqual([]);
    expect(auditMusic(m, ['music/title.mp3', 'music/extra.mp3'], () => true)).toHaveLength(1);
    expect(auditMusic(m, [], () => false)).toHaveLength(1);
  });
});
