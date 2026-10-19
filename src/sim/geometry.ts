// Distances between stars, as the rules count them: whole tenths of a light-year ("deci-light-years").
// Math.sqrt is exactly rounded on every device (unlike Math.hypot), so these are the same everywhere.

import type { Vec3 } from '../data/types.ts';

/** Tenths of a light-year in one light-year. */
export const DECI = 10;

/** The distance between two positions in whole tenths of a light-year. */
export function distanceDeci(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz) * DECI);
}

/** "5.5 ly" from tenths. */
export function formatLy(deci: number): string {
  return `${Math.trunc(deci / DECI)}.${Math.abs(deci % DECI)} ly`;
}

/** Whole-number division rounded up, for costs and times. */
export function ceilDiv(a: number, b: number): number {
  return Math.floor((a + b - 1) / b);
}
