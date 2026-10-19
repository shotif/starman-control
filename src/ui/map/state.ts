// What the map screen is showing, shared by its parts.

import { signal } from '@preact/signals';
import type { SystemId } from '../../data/types.ts';
import type { ViewMode } from '../../render/MapView.ts';

export const selected = signal<SystemId | null>(null);
export const selectedShip = signal<number | null>(null);
/** A colony or outpost being looked at, in its system. */
export const selectedHolding = signal<number | null>(null);
export const mode = signal<ViewMode | null>(null);
export const panel = signal<'search' | 'legend' | 'keys' | 'menu' | 'empire' | 'report' | 'needs' | null>(null);
export const hover = signal<{ id: SystemId; x: number; y: number } | null>(null);
export const query = signal('');
export const failed = signal<string | null>(null);

/** A lane being looked at in a colony's or outpost's list, drawn on the map (desktop hover). */
export const lanePreview = signal<{ from: SystemId; to: SystemId } | null>(null);

/** Choosing where a ship goes: the ship, whether it jumps blind, and the star chosen so far. */
export const targeting = signal<{ ship: number; blind: boolean; to: SystemId | null } | null>(null);

/** A short message, such as why an order was refused. */
export const toast = signal<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;
export function say(message: string): void {
  toast.value = message;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = null;
  }, 4500);
}

/** Clears the screen's state when a different game or the explorer opens. */
export function resetMapState(): void {
  selected.value = null;
  selectedShip.value = null;
  selectedHolding.value = null;
  panel.value = null;
  hover.value = null;
  targeting.value = null;
  lanePreview.value = null;
  toast.value = null;
}
