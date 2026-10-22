// ═══════════════════════════════════════════════════════════════════
// store.js — everything the household keeps, on this device.
//
// One record under one key, in a shape that would sync cleanly later
// (a household, its seasons, and append-only sittings), plus a small
// per-device record (text size, keep-awake, who usually prays here).
//
//   household  { id, name, people: [{ id, name, short, kind, koi }] }
//   seasons    [{ id, name, start, end|null, family: { word, line,
//                  practices[] }, words: { [personId]: word } }]
//   sittings   [{ id, date, at, who[], for[], week, prayer, kind, line? }]
//                one per Amen: who prayed, for whom, which week
//   heart      { [week]: { date, who[] } }   the verse said by heart
//   play       { [week]: step }              puzzle progress, 0–3
//   pick       { week, prayer } | null       a chosen prayer this week
//
// The example family (?demo=1) lives under a different key, so trying
// it on the family's own tablet never touches their record.
// ═══════════════════════════════════════════════════════════════════

import { useSyncExternalStore } from 'react';

const params = new URLSearchParams(window.location.search);
if (params.get('demo') === '1') {
  try { sessionStorage.setItem('qw.demo', '1'); } catch {}
}
if (params.get('demo') === '0') {
  try { sessionStorage.removeItem('qw.demo'); } catch {}
}
export const isDemo = (() => {
  try { return sessionStorage.getItem('qw.demo') === '1'; } catch { return params.get('demo') === '1'; }
})();

const KEY = isDemo ? 'qw.demo.v1' : 'qw.v1';
const DEVICE_KEY = isDemo ? 'qw.demo.device' : 'qw.device';

export const EMPTY = { v: 1, household: null, seasons: [], sittings: [], heart: {}, play: {}, pick: null };
const DEVICE = { textScale: 1, keepAwake: false, lastWho: {}, quietKoi: false };

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? { ...fallback, ...v } : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

let state = read(KEY, EMPTY);
let device = read(DEVICE_KEY, DEVICE);
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export function getState() { return state; }
export function getDevice() { return device; }

export function setState(fn) {
  const next = typeof fn === 'function' ? fn(state) : fn;
  if (next === state) return;
  state = next;
  write(KEY, state);
  emit();
}
export function setDevice(fn) {
  device = typeof fn === 'function' ? fn(device) : fn;
  write(DEVICE_KEY, device);
  emit();
}

export function replaceAll(nextState, nextDevice) {
  state = { ...EMPTY, ...nextState };
  write(KEY, state);
  if (nextDevice) { device = { ...DEVICE, ...nextDevice }; write(DEVICE_KEY, device); }
  emit();
}

export function forgetDemo() {
  try {
    localStorage.removeItem('qw.demo.v1');
    localStorage.removeItem('qw.demo.device');
    sessionStorage.removeItem('qw.demo');
  } catch {}
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
export function useStore() {
  return useSyncExternalStore(subscribe, getState);
}
export function useDevice() {
  return useSyncExternalStore(subscribe, getDevice);
}

// ── Small helpers over the record ──────────────────────────────────
export const currentSeason = (s = state) => s.seasons.find((x) => !x.end) || null;

export function sittingsOn(date, s = state) {
  return s.sittings.filter((x) => x.date === date);
}

// Who has prayed today's prayer (on this device), in order of praying.
export function prayedToday(date, s = state) {
  const seen = [];
  for (const x of sittingsOn(date, s)) for (const id of x.who) if (!seen.includes(id)) seen.push(id);
  return seen;
}

export function lastSitting(s = state) {
  return s.sittings.length ? s.sittings[s.sittings.length - 1] : null;
}
