// ═══════════════════════════════════════════════════════════════════
// route.js — rooms, by the address's hash: #/pray?who=ada,kit
//
// The search part of the address (?demo=1&h=22) belongs to the whole
// visit and is left alone, so a preview or the example family carries
// on as you move between rooms.
// ═══════════════════════════════════════════════════════════════════

import { useSyncExternalStore } from 'react';

function parse() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  return { path: path || 'home', query: Object.fromEntries(new URLSearchParams(qs || '')) };
}

let current = parse();
const listeners = new Set();
window.addEventListener('hashchange', () => {
  current = parse();
  listeners.forEach((l) => l());
});

export function useRoute() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => current,
  );
}

export function go(path = 'home', query) {
  const qs = query && Object.keys(query).length ? `?${new URLSearchParams(query)}` : '';
  const next = path === 'home' && !qs ? '#/' : `#/${path}${qs}`;
  if (window.location.hash === next) return;
  window.location.hash = next;
}

// Back to the pond, as the last step of every room.
export const home = () => go('home');
