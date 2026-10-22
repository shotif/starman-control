import { describe, expect, it } from 'vitest';
import { laneFingerprint } from '../../src/data/fingerprint.ts';
import { SKY } from '../../src/data/sky.ts';

/** Reborn's network at ba4ef73, the one Control copies (D-19). Changing it is a decision, not an import. */
const REBORN_LANES = 'dea7fe5e';

const census = SKY.systems.filter((s) => !s.shell);
const shell = SKY.systems.filter((s) => s.shell);

describe('the sky copied from Reborn', () => {
  it('has the 207 systems of the census, Sol first, then the 149 of the shell, with unique ids', () => {
    expect(census).toHaveLength(207);
    expect(shell).toHaveLength(149);
    expect(SKY.systems.slice(0, 207)).toEqual(census);
    expect(SKY.systems[0]?.id).toBe('sol');
    expect(new Set(SKY.systems.map((s) => s.id)).size).toBe(356);
    expect(SKY.importedFrom.commit).toMatch(/^[0-9a-f]{7,}$/);
  });

  it('has every star, every known planet and every observed belt', () => {
    const stars = SKY.systems.flatMap((s) => s.stars);
    expect(census.flatMap((s) => s.stars)).toHaveLength(253); // Reborn's 252 stars from Gaia DR3 and SIMBAD, and the Sun
    expect(shell.flatMap((s) => s.stars)).toHaveLength(170);
    expect(new Set(stars.map((s) => s.id)).size).toBe(stars.length);
    expect(census.flatMap((s) => s.planets)).toHaveLength(99);
    expect(shell.flatMap((s) => s.planets)).toHaveLength(37);
    expect(new Set(SKY.systems.flatMap((s) => s.planets.map((p) => p.id))).size).toBe(136);
    expect(census.flatMap((s) => s.belts)).toHaveLength(9);
    expect(shell.flatMap((s) => s.belts).map((b) => b.name)).toEqual(['AU Mic debris disc']);
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

describe('the shell out to 33 ly (M3_NEIGHBOURS.md §18)', () => {
  it('says where it came from: the archives on 22 October 2026, through a copy of Reborn with its limits lowered', () => {
    expect(SKY.shell?.retrieved).toBe('2026-10-22');
    expect(SKY.shell?.parallaxFloorMas).toBe(99);
    expect(SKY.shell?.importedFrom.commit).toBe(SKY.importedFrom.commit);
    expect(SKY.shell?.importedFrom.changes.length).toBeGreaterThanOrEqual(5);
    expect(SKY.shell?.leftOut.map((l) => l.id)).toEqual(['mu-herculis']);
  });

  it('lies beyond the census, nearest first, each system with a star of 99 mas or more', () => {
    let last = 0;
    for (const s of shell) {
      expect(s.distanceLy, s.id).toBeGreaterThan(27.2);
      expect(s.distanceLy, s.id).toBeLessThan(33);
      expect(s.distanceLy, s.id).toBeGreaterThanOrEqual(last);
      last = s.distanceLy;
      expect(
        s.stars.some((st) => (st.parallaxMas ?? 0) >= 99),
        s.id,
      ).toBe(true);
      for (const st of s.stars) expect(st.verification, st.id).toBe('snapshot');
    }
  });

  it('has no lane: none of the old network reaches it', () => {
    const ids = new Set(shell.map((s) => s.id));
    for (const [a, b] of SKY.lanes) expect(ids.has(a) || ids.has(b), `${a}~${b}`).toBe(false);
  });

  it('has real names and real neighbours: Chara, 61 Virginis, AU Microscopii and its disc', () => {
    const named = (id: string) => shell.find((s) => s.id === id);
    expect(named('chara')?.name).toBe('Chara');
    expect(
      named('61-virginis')
        ?.planets.map((p) => p.name)
        .sort(),
    ).toEqual(['61 Virginis b', '61 Virginis c', '61 Virginis d']);
    expect(shell.find((s) => s.belts.length > 0)?.planets.length).toBe(4);
  });
});
