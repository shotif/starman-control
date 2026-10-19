// Each star's estimated temperature and light (docs/design/M1_PLANETS.md §2): read from the mean
// dwarf sequence of Pecaut & Mamajek (2013) for its catalogued spectral type, since the census
// gives types rather than luminosities. Marked Estimated wherever shown. Only multiplication,
// division and stored numbers are used, so every device gets the same values (D-06).

import dwarfsFile from '../data/dwarfs.json' with { type: 'json' };
import type { SourceRef } from '../data/types.ts';
import { type StarClass, starClass } from './stars.ts';

interface DwarfRow {
  type: string;
  teffK: number;
  luminosity: number;
  radius: number | null;
  mass: number | null;
}

const DWARFS = dwarfsFile as unknown as { source: SourceRef & { version: string }; rows: DwarfRow[] };

export const DWARF_SOURCE: SourceRef = DWARFS.source;

export interface StarEstimate {
  teffK: number;
  /** In units of the Sun's. */
  luminosity: number;
  /** In units of the Sun's, when the rule gives one. */
  radius: number | null;
  mass: number | null;
  /** How it was worked out, for the panel to say. */
  basis: 'measured' | 'dwarf-table' | 'white-dwarf' | 'assumed';
  /** The table row used ("G8V"), for `dwarf-table` and `assumed`. */
  row?: string;
}

/** The Sun, as measured (IAU nominal values). */
const SUN: StarEstimate = { teffK: 5772, luminosity: 1, radius: 1, mass: 1, basis: 'measured' };

/** White dwarfs: this radius (in the Sun's) for all, a fair mean for the nearby ones. */
export const WHITE_DWARF_RADIUS = 0.012;

/** The type a star of unknown type is taken as: a typical red dwarf (most of the neighbourhood). */
export const ASSUMED_TYPE = 'M4V';

const byClass = new Map<string, { sub: number; row: DwarfRow }[]>();
for (const row of DWARFS.rows) {
  const m = /^([OBAFGKMLTY])([0-9.]+)/.exec(row.type);
  if (!m) continue;
  const list = byClass.get(m[1] as string) ?? [];
  list.push({ sub: Number(m[2]), row });
  byClass.set(m[1] as string, list);
}

/** The table row nearest a spectral type's class and subclass ("M5.5Ve" → M5.5V). */
export function dwarfRow(spectralType: string): DwarfRow | undefined {
  const cls = starClass(spectralType);
  const list = byClass.get(cls);
  if (!list) return undefined;
  const sub = Number(
    /[OBAFGKMLTY]([0-9]+(?:\.[0-9]+)?)/.exec(
      spectralType.toUpperCase().replace(/^(SD|D|ESD|USD)(?=[OBAFGKMLTY])/, ''),
    )?.[1] ?? 5,
  );
  let best = list[0] as { sub: number; row: DwarfRow };
  for (const x of list) if (Math.abs(x.sub - sub) < Math.abs(best.sub - sub)) best = x;
  return best.row;
}

/** A white dwarf's temperature from its type's number: 50,400 K divided by it ("DA1.9" → 26,526 K). */
export function whiteDwarfTeff(spectralType: string): number {
  const n = Number(/^D[A-Z]*([0-9]+(?:\.[0-9]+)?)/.exec(spectralType.trim().toUpperCase())?.[1] ?? 0);
  return n > 0 ? Math.round(50400 / n) : 10000;
}

export function estimateStar(starId: string, spectralType: string): StarEstimate {
  if (starId === 'sun') return SUN;
  const cls: StarClass = starClass(spectralType);
  if (cls === 'D') {
    const teffK = whiteDwarfTeff(spectralType);
    const t = teffK / 5772;
    const luminosity = WHITE_DWARF_RADIUS * WHITE_DWARF_RADIUS * t * t * t * t;
    return { teffK, luminosity, radius: WHITE_DWARF_RADIUS, mass: null, basis: 'white-dwarf' };
  }
  const row = cls === '?' ? undefined : dwarfRow(spectralType);
  const used = row ?? (dwarfRow(ASSUMED_TYPE) as DwarfRow);
  return {
    teffK: used.teffK,
    luminosity: used.luminosity,
    radius: used.radius,
    mass: used.mass,
    basis: row ? 'dwarf-table' : 'assumed',
    row: used.type,
  };
}
