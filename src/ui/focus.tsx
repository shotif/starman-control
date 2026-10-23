// Dialogs take focus as they open and give it back as they close (M6_ONE.md §21.2), so a keyboard
// and a screen reader follow what is shown: back to the control that opened them when it was
// reached by keyboard. Put first inside any element with role="dialog".

import { useEffect, useRef } from 'preact/hooks';

/**
 * How focus came to each element: by a press of the mouse or a finger, or without one (Tab, or a
 * dialog giving it back). The browser's `:focus-visible` cannot say, as any key pressed on a control
 * makes it match.
 */
const byKeyboard = new WeakSet<Element>();
let pressedAt = -1;
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e) => (pressedAt = e.timeStamp), true);
  window.addEventListener(
    'focusin',
    (e) => {
      if (!(e.target instanceof Element)) return;
      if (pressedAt >= 0 && e.timeStamp - pressedAt < 1000) byKeyboard.delete(e.target);
      else byKeyboard.add(e.target);
      pressedAt = -1;
    },
    true,
  );
}

/** Whether an element was focused by keyboard rather than by a press (M6_ONE.md §21.2). */
export function focusedByKeyboard(el: Element): boolean {
  return byKeyboard.has(el);
}

export function DialogFocus() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const dialog = ref.current?.closest<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Focus goes back only to a control reached by keyboard: after a click or a shortcut it stays on
    // the page, so Enter still ends the turn.
    const back = before !== null && before !== document.body && focusedByKeyboard(before) ? before : null;
    // Unless something inside took it first, such as the search's field.
    if (!dialog.contains(document.activeElement)) {
      if (!dialog.hasAttribute('tabindex')) dialog.tabIndex = -1;
      dialog.focus({ preventScroll: true });
    }
    return () => {
      // Back where it was, unless the player has already moved on to something else.
      const now = document.activeElement;
      const lost = now === null || now === document.body || !now.isConnected || dialog.contains(now);
      if (lost && back?.isConnected) back.focus({ preventScroll: true });
    };
  }, []);
  return <span ref={ref} hidden />;
}
