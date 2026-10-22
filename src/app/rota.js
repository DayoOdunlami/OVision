// ═══════════════════════════════════════════════════════════════════
// rota.js — who we pray for each day, and which prayer this week.
//
// Worked out, never stored: from the household's id, its people and
// the week. So the phone and the kitchen tablet agree on today without
// any sync, and a household of any size works:
//
//   Mon–Sat  a pair a day (one person, if the household is one).
//            Everyone comes round about equally often.
//   Sunday   everyone.
//
// The prayer changes every Monday morning, in an order that alternates
// Paul's letters with the Psalms and Gospels. Each household starts at
// a different place in it, which keeps the change a small surprise.
// ═══════════════════════════════════════════════════════════════════

import { weekNumber } from './calendar.js';

// Indices into prayers.js (see the order note in src/pray/lib/state.js):
// Eph 1 · Ps 1 · Eph 3 · Ps 121 · Phil 1 · John 15 · Col 1 · Ps 63 ·
// Rom 15 · Luke 2 · 1 Thess 3 · Ps 139 · Heb 13 · John 17
export const ROTATION = [0, 10, 1, 12, 2, 9, 3, 11, 4, 13, 5, 7, 6, 8];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled(list, rand) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// → [ [id, id], … ×6, [everyone] ]
export function rotaForWeek(household, monday) {
  const ids = household.people.map((p) => p.id);
  if (ids.length === 0) return Array(7).fill([]);
  const all = [...ids];
  if (ids.length === 1) return [...Array(6).fill(all), all];
  if (ids.length === 2) return [...Array(6).fill(all), all];

  // One endless sequence per household: round after round of everyone,
  // each round in its own (seeded) order. Week w takes the twelve places
  // from w × 12 on, so the weeks follow on from each other and, over
  // time, everyone comes round equally often (an odd household doesn't
  // leave the same person out every week).
  const n = ids.length;
  const round = (r) => shuffled(ids, rng(hash(`${household.id}:${ids.join(',')}:${r}`)));
  const start = weekNumber(monday) * 12;
  let r = Math.floor(start / n);
  let k = start % n;
  let cur = round(r);
  const seq = [];
  while (seq.length < 13) {
    if (k >= n) { r += 1; k = 0; cur = round(r); }
    seq.push(cur[k++]);
  }
  const pairs = [];
  for (let i = 0; i < 6; i++) {
    const a = seq[i * 2];
    let b = seq[i * 2 + 1];
    // Where two rounds meet, the same person can come up twice running.
    if (b === a) b = seq[i * 2 + 2] !== a ? seq[i * 2 + 2] : ids.find((x) => x !== a);
    pairs.push([a, b]);
  }
  return [...pairs, all];
}

export function prayerForWeek(household, monday, pick) {
  if (pick && pick.week === monday && pick.prayer >= 0 && pick.prayer < ROTATION.length) return pick.prayer;
  const offset = household ? hash(household.id) % ROTATION.length : 0;
  return ROTATION[(weekNumber(monday) + offset) % ROTATION.length];
}
