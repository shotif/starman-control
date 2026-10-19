// A short, stable fingerprint of a lane list, so a test can tell whether the catalogue still holds
// exactly the lanes Reborn's players fly.

/** FNV-1a (32-bit) over "a~b" lines, as eight hex digits. */
export function laneFingerprint(lanes: readonly (readonly [string, string])[]): string {
  let h = 0x811c9dc5;
  for (const [a, b] of lanes) {
    const line = `${a}~${b}\n`;
    for (let i = 0; i < line.length; i++) {
      h ^= line.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
