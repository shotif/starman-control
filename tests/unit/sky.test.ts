import { describe, expect, it } from 'vitest';
import { laneFingerprint } from '../../src/data/fingerprint.ts';
import { SKY } from '../../src/data/sky.ts';

/** Reborn's network at ba4ef73, the one Control copies (D-19). Changing it is a decision, not an import. */
const REBORN_LANES = 'dea7fe5e';

describe('the sky copied from Reborn', () => {
  it('has the 207 systems of the census, Sol first, with unique ids', () => {
    expect(SKY.systems).toHaveLength(207);
    expect(SKY.systems[0]?.id).toBe('sol');
    expect(new Set(SKY.systems.map((s) => s.id)).size).toBe(207);
    expect(SKY.importedFrom.commit).toMatch(/^[0-9a-f]{7,}$/);
  });

  it('has every star, every known planet and every observed belt', () => {
    const stars = SKY.systems.flatMap((s) => s.stars);
    expect(stars).toHaveLength(253); // Reborn's 252 stars from Gaia DR3 and SIMBAD, and the Sun
    expect(new Set(stars.map((s) => s.id)).size).toBe(stars.length);
    expect(SKY.systems.flatMap((s) => s.planets)).toHaveLength(99);
    expect(SKY.systems.flatMap((s) => s.belts)).toHaveLength(9);
  });

  it('cites a source for every star, planet and belt', () => {
    for (const s of SKY.systems) {
      for (const star of s.stars) {
        expect(star.astrometrySource.url, star.id).toMatch(/^https:\/\//);
        expect(star.spectralTypeSource.url, star.id).toMatch(/^https:\/\//);
        expect(star.spectralType, star.id).not.toBe('');
      }
      for (const p of s.planets) expect(p.source.url, p.id).toMatch(/^https:\/\//);
      for (const b of s.belts) expect(b.sources.length, b.id).toBeGreaterThan(0);
    }
  });

  it('keeps contested planets, and says so', () => {
    const planets = SKY.systems.flatMap((s) => s.planets);
    const contested = planets.filter((p) => p.status !== 'confirmed');
    expect(contested.length).toBeGreaterThan(0);
    for (const p of contested) expect(p.controversial, p.id).toBe(true);
    const tauCeti = SKY.systems.find((s) => s.id === 'tau-ceti');
    expect(tauCeti?.planets.map((p) => p.status)).toEqual(['contested', 'contested', 'contested', 'contested']);
  });

  it('hosts every planet and belt on a star of its own system', () => {
    for (const s of SKY.systems) {
      const ids = new Set(s.stars.map((st) => st.id));
      for (const p of s.planets) expect(ids.has(p.hostId), p.id).toBe(true);
      for (const b of s.belts) expect(ids.has(b.hostId), b.id).toBe(true);
    }
  });

  it('marks the ten flare stars that Reborn flares', () => {
    const flares = SKY.systems.flatMap((s) => s.stars).filter((s) => s.flareVariable);
    expect(flares.map((s) => s.id).sort()).toEqual(
      [
        'ad-leonis',
        'bl-ceti',
        'dx-cancri',
        'ev-lacertae',
        'proxima-centauri',
        'ross-154',
        'uv-ceti',
        'wolf-359',
        'yz-canis-minoris',
        'yz-ceti',
      ].sort(),
    );
  });

  it('holds exactly the 271 lanes Reborn players fly, each once, between real systems', () => {
    expect(SKY.lanes).toHaveLength(271);
    expect(laneFingerprint(SKY.lanes)).toBe(SKY.laneFingerprint);
    expect(SKY.laneFingerprint).toBe(REBORN_LANES);
    const ids = new Set(SKY.systems.map((s) => s.id));
    const seen = new Set<string>();
    for (const [a, b] of SKY.lanes) {
      expect(a < b, `${a}~${b}`).toBe(true);
      expect(ids.has(a) && ids.has(b), `${a}~${b}`).toBe(true);
      expect(seen.has(`${a}~${b}`)).toBe(false);
      seen.add(`${a}~${b}`);
    }
  });
});
