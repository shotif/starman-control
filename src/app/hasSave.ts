// Whether there is a game to continue, for the title, without loading the world or the rules
// (the title must stay small for a phone's first visit).

import { detectBackend } from './storage.ts';

export async function hasSavedGame(): Promise<boolean> {
  try {
    const backend = await detectBackend();
    return (await backend.get('save:auto')) !== undefined || (await backend.get('save:auto:backup')) !== undefined;
  } catch {
    return false;
  }
}
