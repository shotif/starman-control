// A bottom sheet for the phone layout (§10): it opens at about a third of the screen, drags up to
// full and down to close, and its handle is also a button (tap to grow or shrink). It reports its
// height so the map can keep what is selected centred in the part still showing.

import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

export type SheetSize = 'peek' | 'full';

interface Props {
  label: string;
  onClose: () => void;
  /** Called with the sheet's height in CSS pixels whenever it changes. */
  onHeight?: (px: number) => void;
  /** Height kept clear at the top when the sheet is full (the top bar). */
  topInset?: number;
  /** The sheet sits this far up, on a bottom bar. */
  bottomInset?: number;
  /** Beside the map, on the right, rather than under it (a wide, short screen). */
  side?: boolean;
  children: ComponentChildren;
}

/** Where a released drag settles: closed, peeking or full, by the nearest height (pure, tested). */
export function settle(
  heightPx: number,
  peekPx: number,
  fullPx: number,
  velocityPxPerMs: number,
): SheetSize | 'closed' {
  // A quick flick goes the way it was flicked.
  if (velocityPxPerMs < -0.6) return 'full';
  if (velocityPxPerMs > 0.6) return heightPx < peekPx ? 'closed' : 'peek';
  if (heightPx < peekPx * 0.6) return 'closed';
  return heightPx > (peekPx + fullPx) / 2 ? 'full' : 'peek';
}

export function Sheet({ label, onClose, onHeight, topInset = 56, bottomInset = 0, side = false, children }: Props) {
  const [size, setSize] = useState<SheetSize>('peek');
  const [drag, setDrag] = useState<number | null>(null);
  const [viewport, setViewport] = useState(() => window.innerHeight);
  const start = useRef<{ y: number; h: number; t: number } | null>(null);
  const room = viewport - bottomInset;
  const peek = Math.round(Math.max(220, room * 0.4));
  const full = Math.max(peek, room - topInset);
  const height = drag ?? (size === 'full' ? full : peek);

  useEffect(() => {
    const onResize = () => setViewport(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => onHeight?.(side ? 0 : height), [height, side, onHeight]);
  useEffect(() => () => onHeight?.(0), [onHeight]);

  const down = (e: PointerEvent) => {
    start.current = { y: e.clientY, h: height, t: e.timeStamp };
  };
  const move = (e: PointerEvent) => {
    const s = start.current;
    if (!s) return;
    if (drag === null) {
      if (Math.abs(e.clientY - s.y) < 6) return;
      // Only a real drag takes the pointer, so a tap on Close or the handle stays a tap.
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    setDrag(Math.max(0, Math.min(full, s.h - (e.clientY - s.y))));
  };
  const up = (e: PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s || drag === null) return;
    const dt = Math.max(1, e.timeStamp - s.t);
    const v = (e.clientY - s.y) / dt;
    const next = settle(drag, peek, full, v);
    setDrag(null);
    if (next === 'closed') onClose();
    else setSize(next);
  };

  if (side) {
    return (
      <section
        class="sheet sheet-side"
        style={{ top: `${topInset}px`, bottom: `${bottomInset}px` }}
        role="dialog"
        aria-label={label}
        data-covers-map
      >
        <div class="sheet-bar">
          <span class="sheet-title">{label}</span>
          <button type="button" class="sheet-close" onClick={onClose}>
            Close
          </button>
        </div>
        <div class="sheet-body">{children}</div>
      </section>
    );
  }

  return (
    <section
      class={`sheet${size === 'full' ? ' sheet-full' : ''}${drag !== null ? ' is-dragging' : ''}`}
      style={{ height: `${height}px`, bottom: `${bottomInset}px` }}
      role="dialog"
      aria-label={label}
    >
      <div class="sheet-bar" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <button
          type="button"
          class="sheet-grow"
          aria-label={size === 'full' ? 'Show less' : 'Show more'}
          onClick={() => {
            if (drag === null) setSize(size === 'full' ? 'peek' : 'full');
          }}
        >
          <span class="grip" aria-hidden="true" />
        </button>
        <button type="button" class="sheet-close" onClick={onClose}>
          Close
        </button>
      </div>
      <div class="sheet-body">{children}</div>
    </section>
  );
}
