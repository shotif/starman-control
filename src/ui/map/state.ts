// What the map screen is showing, shared by its parts.

import { signal } from '@preact/signals';
import type { SystemId } from '../../data/types.ts';
import type { ViewMode } from '../../render/MapView.ts';

export const selected = signal<SystemId | null>(null);
export const selectedShip = signal<number | null>(null);
/** A fleet being looked at (M4_FLEETS.md §22.3). */
export const selectedFleet = signal<number | null>(null);
/** A colony or outpost being looked at, in its system. */
export const selectedHolding = signal<number | null>(null);
export const mode = signal<ViewMode | null>(null);
export const panel = signal<
  | 'search'
  | 'legend'
  | 'keys'
  | 'menu'
  | 'empire'
  | 'research'
  | 'diplomacy'
  | 'report'
  | 'needs'
  | 'event'
  | 'designs'
  | 'assembly'
  | null
>(null);
export const hover = signal<{ id: SystemId; x: number; y: number } | null>(null);
export const query = signal('');
export const failed = signal<string | null>(null);

/** The system seen from inside, in 3D (M1_SYSTEM_VIEW.md), and the world chosen in it or its panel. */
export const insideSystem = signal<SystemId | null>(null);
export const selectedBody = signal<string | null>(null);

/** A colony seen as a living diorama (COLONY_VIEW.md), by its holding's id. */
export const insideColony = signal<number | null>(null);
/** The battle of the turn being watched in the replay (M4_FLEETS.md §25), by its number. */
export const watching = signal<number | null>(null);

/** The colony whose queue's first project the pointer is over: its scaffold is lit in the scene. */
export const queueHover = signal<number | null>(null);

/** A lane being looked at in a colony's or outpost's list, drawn on the map (desktop hover). */
export const lanePreview = signal<{ from: SystemId; to: SystemId } | null>(null);

/** Choosing where a ship or a fleet goes: which, whether it jumps blind, and the star chosen so far. */
export const targeting = signal<{ ship?: number; fleet?: number; blind: boolean; to: SystemId | null } | null>(null);

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
  selectedFleet.value = null;
  selectedHolding.value = null;
  panel.value = null;
  hover.value = null;
  targeting.value = null;
  lanePreview.value = null;
  insideSystem.value = null;
  insideColony.value = null;
  queueHover.value = null;
  selectedBody.value = null;
  toast.value = null;
}
