// ═══════════════════════════════════════════════════════════════════
// moment.js — a moment the world is asked to play (studio P): the
// finale of the ritual, when the board is born in the world. The room
// asks; whichever world is showing plays it.
// ═══════════════════════════════════════════════════════════════════

import { useSyncExternalStore } from 'react';

let moment = null;
const listeners = new Set();

// kind: 'waiting' (the chosen world, empty, before the word is let in)
// or 'finale'; world: which world plays it.
export function playMoment(kind, world) {
  moment = kind ? { kind, world, at: Date.now() } : null;
  listeners.forEach((l) => l());
}

export function useMoment() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => moment);
}
