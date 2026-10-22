import { VERSES, verseById, verseText } from './verses.js';

export const KEY = 'table.house.v1';

export const HUES = ['#8c3a2f', '#8a5a14', '#1f6a4e', '#244a78', '#6b3d62', '#8a4630'];

const ADULT_DOWN = ['hurry', 'worry', 'pride', 'fear', 'envy', 'a sharp word'];
const CHILD_DOWN = ['a worry', 'a fight', 'a sorry'];

export { ADULT_DOWN, CHILD_DOWN };

export function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dateFromIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function mondayIso(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return isoDate(x);
}

export function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
  x.setDate(x.getDate() + n);
  return x;
}

export function isSunday(d) {
  return d.getDay() === 0;
}

export function isMonday(d) {
  return d.getDay() === 1;
}

export function weekdayName(d) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
}

export function resolveNow(search = '') {
  const params = new URLSearchParams(search);
  const now = new Date();
  const on = params.get('on');
  if (on && /^\d{4}-\d{2}-\d{2}$/.test(on)) {
    const [y, m, d] = on.split('-').map(Number);
    now.setFullYear(y, m - 1, d);
  }
  if (params.get('at') === 'sunday') {
    const day = now.getDay();
    const add = day === 0 ? 0 : 7 - day;
    now.setDate(now.getDate() + add);
  }
  const h = params.get('h');
  if (h != null && h !== '' && !Number.isNaN(Number(h))) {
    now.setHours(Number(h), 20, 0, 0);
  }
  return now;
}

export function isNight(d) {
  const h = d.getHours();
  return h >= 20 || h < 6;
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, seed) {
  const arr = list.slice();
  const rnd = mulberry32(hash(seed));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function weeksBetween(mondayA, mondayB) {
  const a = dateFromIso(mondayA).getTime();
  const b = dateFromIso(mondayB).getTime();
  return Math.round((b - a) / (7 * 24 * 3600 * 1000));
}

export function verseForMonday(monday) {
  const n = weeksBetween('2024-01-01', monday);
  const i = ((n % VERSES.length) + VERSES.length) % VERSES.length;
  return VERSES[i];
}

export function joinNames(names) {
  const list = names.filter(Boolean);
  if (list.length === 0) return 'us';
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

export function slugId(name, existing) {
  const base = (name || '').normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '').toLowerCase() || 'person';
  const ids = new Set(existing);
  let id = base;
  let n = 2;
  while (ids.has(id)) id = `${base}${n++}`;
  return id;
}

export function hueFor(index) {
  return HUES[index % HUES.length];
}

export function emptyState() {
  return {
    household: { people: [] },
    board: {
      word: '',
      sentence: '',
      season: '',
      commitments: [],
      personal: {},
    },
    sittings: {},
    learned: {},
    weeks: {},
    seenVerseId: '',
  };
}

export function pairsForWeek(people, monday) {
  const ids = people.map((p) => p.id);
  if (ids.length === 0) return [[], [], [], [], [], []];
  if (ids.length === 1) return Array.from({ length: 6 }, () => [ids[0]]);
  const circle = shuffle(ids, monday);
  if (circle.length % 2) circle.push(null);
  const rounds = [];
  for (let r = 0; r < circle.length - 1; r++) {
    const pairs = [];
    for (let i = 0; i < circle.length / 2; i++) {
      const a = circle[i];
      const b = circle[circle.length - 1 - i];
      if (a && b) pairs.push([a, b]);
    }
    rounds.push(pairs);
    const fixed = circle[0];
    const rest = circle.slice(1);
    rest.unshift(rest.pop());
    circle.splice(0, circle.length, fixed, ...rest);
  }
  const days = [];
  for (let d = 0; d < 6; d++) {
    const round = rounds[d % rounds.length];
    days.push(round[d % round.length]);
  }
  return days;
}

export function prayedForIds(state, date, forceSunday = false) {
  const people = state.household.people;
  if (forceSunday || isSunday(date)) return people.map((p) => p.id);
  const pairs = pairsForWeek(people, mondayIso(date));
  const idx = date.getDay() === 0 ? 6 : date.getDay() - 1;
  return pairs[idx] || people.map((p) => p.id);
}

export function weekVerse(state, monday) {
  const id = state.weeks && state.weeks[monday];
  return (id && verseById(id)) || verseForMonday(monday);
}

export function ensureWeek(state, monday) {
  if (!state.weeks) state.weeks = {};
  if (!state.weeks[monday]) state.weeks[monday] = verseForMonday(monday).id;
  return weekVerse(state, monday);
}

export function satMap(state, iso) {
  return (state.sittings && state.sittings[iso]) || {};
}

export function recordSitting(state, iso, personIds, putDown) {
  if (!state.sittings) state.sittings = {};
  if (!state.sittings[iso]) state.sittings[iso] = {};
  const monday = mondayIso(dateFromIso(iso));
  ensureWeek(state, monday);
  for (const id of personIds) {
    const prev = state.sittings[iso][id];
    state.sittings[iso][id] = {
      at: prev?.at || new Date().toISOString(),
      putDown: putDown || prev?.putDown || null,
    };
  }
  return state;
}

export function recordLearned(state, monday, personIds) {
  if (!state.learned) state.learned = {};
  const cur = new Set(state.learned[monday] || []);
  for (const id of personIds) cur.add(id);
  state.learned[monday] = [...cur];
  ensureWeek(state, monday);
  return state;
}

export function memoryGapIndexes(words) {
  let gaps = words.map((_, i) => i).filter((i) => i % 3 === 2);
  if (gaps.length < 3) gaps = words.map((_, i) => i).filter((i) => i % 2 === 1);
  if (gaps.length === 0 && words.length) gaps = [words.length - 1];
  return gaps;
}

export function wordsOf(verse) {
  return verseText(verse).split(/\s+/).filter(Boolean);
}

function storage() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
  } catch { /* private mode */ }
  return null;
}

export function load() {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.household) return null;
    return data;
  } catch {
    return null;
  }
}

export function save(state) {
  const s = storage();
  if (!s) return;
  try { s.setItem(KEY, JSON.stringify(state)); } catch { /* full */ }
}

export function clearStore() {
  const s = storage();
  if (!s) return;
  try { s.removeItem(KEY); } catch { /* ignore */ }
}

function demoPeople() {
  const names = [
    ['sam', 'Sam', 'adult'],
    ['noor', 'Noor', 'adult'],
    ['idris', 'Idris', 'child'],
    ['wren', 'Wren', 'child'],
    ['jo', 'Jo', 'child'],
    ['pip', 'Pip', 'child'],
  ];
  return names.map(([id, name, kind], i) => ({ id, name, kind, hue: hueFor(i) }));
}

function demoBoard() {
  return {
    word: 'Near',
    sentence: 'We stay near to God and to each other while the days shorten.',
    season: 'Autumn',
    commitments: ['Pray this verse', 'Eat one meal together', 'Tell the truth quickly', 'Keep a real rest'],
    personal: {
      sam: 'Unhurried',
      noor: 'Gentle',
      idris: 'Brave',
      wren: 'Kind',
      jo: 'Steady',
    },
  };
}

export function createDemo(now, opts = {}) {
  const state = emptyState();
  state.household.people = demoPeople();
  state.board = demoBoard();
  const monday = mondayIso(now);
  const verse = ensureWeek(state, monday);
  state.seenVerseId = isMonday(now) ? verseForMonday(isoDate(addDays(dateFromIso(monday), -7))).id : verse.id;
  if (opts.empty) return state;

  const people = state.household.people;
  for (let back = 27; back >= 1; back--) {
    const d = addDays(now, -back);
    const iso = isoDate(d);
    const h = hash(iso);
    if (h % 7 === 0) continue;
    if (isSunday(d)) {
      recordSitting(state, iso, people.map((p) => p.id));
      if (h % 2 === 0) state.sittings[iso].sam.putDown = 'hurry';
    } else {
      if (h % 5 !== 0) recordSitting(state, iso, ['sam']);
      if (h % 4 === 0) recordSitting(state, iso, ['noor']);
      const kids = ['idris', 'wren', 'jo'];
      recordSitting(state, iso, [kids[h % 3]]);
      if (h % 3 !== 1) recordSitting(state, iso, [kids[(h + 1) % 3]]);
      if (h % 6 === 0) {
        const id = kids[h % 3];
        state.sittings[iso][id].putDown = CHILD_DOWN[h % CHILD_DOWN.length];
      }
    }
    if (d.getDay() === 6) recordLearned(state, mondayIso(d), ['idris', 'wren']);
  }

  const today = isoDate(now);
  if (opts.allSat) {
    recordSitting(state, today, people.map((p) => p.id));
  } else if (!isSunday(now)) {
    recordSitting(state, today, ['sam'], 'hurry');
  }
  return state;
}

export function weeksFor(state, now) {
  const monday = mondayIso(now);
  const dates = Object.keys(state.sittings || {});
  let start = monday;
  if (dates.length) {
    const earliest = dates.map(mondayIsoFromIso).sort()[0];
    start = earliest < monday ? earliest : monday;
  }
  const list = [];
  let cursor = monday;
  let guard = 0;
  while (cursor >= start && guard < 6) {
    list.push(buildWeek(state, cursor, now, cursor === monday));
    cursor = isoDate(addDays(dateFromIso(cursor), -7));
    guard += 1;
  }
  if (!list.length) list.push(buildWeek(state, monday, now, true));
  return list;
}

function mondayIsoFromIso(iso) {
  return mondayIso(dateFromIso(iso));
}

function buildWeek(state, monday, now, current) {
  const verse = weekVerse(state, monday);
  const today = isoDate(now);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(dateFromIso(monday), i);
    const iso = isoDate(d);
    const who = Object.keys(satMap(state, iso));
    days.push({
      iso,
      letter: 'MTWTFSS'[i],
      who,
      today: iso === today,
      future: iso > today,
    });
  }
  const learned = (state.learned && state.learned[monday]) || [];
  const notes = [];
  for (const day of days) {
    const sat = satMap(state, day.iso);
    const groups = {};
    for (const [id, rec] of Object.entries(sat)) {
      if (!rec || !rec.putDown) continue;
      if (!groups[rec.putDown]) groups[rec.putDown] = [];
      groups[rec.putDown].push(id);
    }
    for (const [word, ids] of Object.entries(groups)) notes.push({ word, ids });
  }
  return { monday, verse, days, learned, notes, current };
}

export function personName(state, id) {
  const p = state.household.people.find((x) => x.id === id);
  return p ? p.name : '';
}

export function defaultSelected(state, at, now) {
  const people = state.household.people;
  const ids = people.map((p) => p.id);
  if (!ids.length) return [];
  if (at === 'sunday' || isSunday(now)) return ids;
  if (at === 'morning' || at === 'setdown') {
    const adults = people.filter((p) => p.kind === 'adult');
    return [(adults[0] || people[0]).id];
  }
  if (at === 'evening' || at === 'done') {
    const kids = people.filter((p) => p.kind === 'child');
    return (kids.length ? kids : people).map((p) => p.id);
  }
  const hour = now.getHours();
  if (hour < 11) {
    const adults = people.filter((p) => p.kind === 'adult');
    if (adults.length) return [adults[0].id];
  }
  if (hour >= 15) {
    const kids = people.filter((p) => p.kind === 'child');
    if (kids.length) return kids.map((p) => p.id);
  }
  return ids;
}

export function boot(search) {
  const params = new URLSearchParams(search);
  const now = resolveNow(search);
  const at = params.get('at') || '';
  if (params.has('fresh') || at === 'welcome') {
    clearStore();
    return { state: emptyState(), view: 'welcome', now, at: 'welcome' };
  }
  let state;
  const seeded = params.get('demo') === '1' || params.has('empty') || at === 'done';
  if (seeded) {
    state = createDemo(now, { empty: params.has('empty'), allSat: at === 'done' });
    save(state);
  } else {
    state = load();
    if (!state || !state.household.people.length) {
      return { state: state && state.household ? state : emptyState(), view: 'welcome', now, at: 'welcome' };
    }
  }
  let view = 'home';
  if (at === 'glance') view = 'glance';
  else if (at === 'puzzle') view = 'puzzle';
  else if (at === 'week') view = 'week';
  else if (at === 'season') view = 'season';
  else if (at === 'morning' || at === 'setdown' || at === 'pray') view = 'pray';
  else if (!at && now.getHours() < 9) {
    const adult = state.household.people.find((p) => p.kind === 'adult');
    const sat = adult && satMap(state, isoDate(now))[adult.id];
    if (adult && !sat) view = 'pray';
  }
  return { state, view, now, at };
}

export function seasonKey(name, override) {
  const t = (override || name || '').toLowerCase();
  if (t.includes('winter')) return 'winter';
  if (t.includes('spring')) return 'spring';
  if (t.includes('summer')) return 'summer';
  return 'autumn';
}
