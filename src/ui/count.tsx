// Numbers that count to their new value (CONSOLE.md §4): about 0.45 s, easing out; at once with
// reduced motion, and at once the first time they are shown.

import { useEffect, useRef, useState } from 'preact/hooks';
import { reducedMotion } from '../app/settings.ts';

export function useCount(value: number): number {
  const [shown, setShown] = useState(value);
  const now = useRef(value);
  useEffect(() => {
    const from = now.current;
    if (from === value || reducedMotion()) {
      now.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 450);
      const v = Math.round(from + (value - from) * (1 - (1 - k) ** 3));
      now.current = v;
      setShown(v);
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return shown;
}

/** A number that counts to its new value. */
export function Count({ value }: { value: number }) {
  return <>{useCount(value)}</>;
}
