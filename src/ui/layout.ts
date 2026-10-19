// Which of the two first-class layouts to use (D-04; docs/design/M1_FIRST_LIGHT.md §10, *Breakpoints*):
// the phone layout below 700 px wide, or below 500 px tall in landscape; the desktop layout from
// 1100 px wide with a fine pointer; in between (tablets), the phone layout until a mouse or a
// keyboard is used, as Reborn does.

import { signal } from '@preact/signals';

export type Layout = 'phone' | 'desktop';

export interface Viewport {
  width: number;
  height: number;
  /** A mouse or trackpad is the main pointer. */
  finePointer: boolean;
  /** A mouse or a keyboard has been used in this visit. */
  desktopInput: boolean;
}

export function layoutFor(v: Viewport): Layout {
  const landscape = v.width > v.height;
  if (v.width < 700 || (landscape && v.height < 500)) return 'phone';
  if (v.width >= 1100 && v.finePointer) return 'desktop';
  return v.desktopInput ? 'desktop' : 'phone';
}

export const layout = signal<Layout>('phone');

/** Keeps `layout` up to date with the window. Returns a function that stops watching. */
export function watchLayout(win: Window = window): () => void {
  let desktopInput = false;
  const fine = win.matchMedia('(pointer: fine)');
  const update = () => {
    const next = layoutFor({
      width: win.innerWidth,
      height: win.innerHeight,
      finePointer: fine.matches,
      desktopInput,
    });
    if (layout.value !== next) layout.value = next;
    win.document.documentElement.dataset.layout = next;
  };
  const onMouse = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && !desktopInput) {
      desktopInput = true;
      update();
    }
  };
  const onKey = (e: KeyboardEvent) => {
    // Tab and the arrows count; a phone's on-screen keyboard typing into a field does not.
    const field = e.target instanceof HTMLElement && e.target.closest('input, textarea');
    if (!field && !desktopInput) {
      desktopInput = true;
      update();
    }
  };
  update();
  win.addEventListener('resize', update);
  fine.addEventListener('change', update);
  win.addEventListener('pointermove', onMouse);
  win.addEventListener('keydown', onKey);
  return () => {
    win.removeEventListener('resize', update);
    fine.removeEventListener('change', update);
    win.removeEventListener('pointermove', onMouse);
    win.removeEventListener('keydown', onKey);
  };
}
