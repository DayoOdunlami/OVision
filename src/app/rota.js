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

  // Follow on from where last week's sequence ended, so over the weeks
  // everyone is prayed for about equally (an odd household doesn't
  // leave the same person out every week).
  const wk = weekNumber(monday);
  const rand = rng(hash(`${household.id}:${ids.join(',')}:${wk}`));
  const seq = [];
  let guard = 0;
  while (seq.length < 12 && guard++ < 20) {
    let round = shuffled(ids, rand);
    // Never the same person twice in a row (which would pair them with
    // themselves across the join).
    if (seq.length && round[0] === seq[seq.length - 1]) round = [...round.slice(1), round[0]];
    seq.push(...round);
  }
  const pairs = [];
  for (let i = 0; pairs.length < 6; i += 2) {
    let a = seq[i];
    let b = seq[i + 1];
    if (a === b || b == null) b = ids.find((x) => x !== a);
    pairs.push([a, b]);
  }
  return [...pairs, all];
}

export function prayerForWeek(household, monday, pick) {
  if (pick && pick.week === monday && pick.prayer >= 0 && pick.prayer < ROTATION.length) return pick.prayer;
  const offset = household ? hash(household.id) % ROTATION.length : 0;
  return ROTATION[(weekNumber(monday) + offset) % ROTATION.length];
}
