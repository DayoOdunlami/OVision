import { wordForRef } from '../flourish/abide/words.js';

// ═══════════════════════════════════════════════════════════════════
// Written for someone: a few words the flock writes for one person,
// the same every day or one for each day of the week, travelling as a
// link (no server: the link *is* the note):
//
//   /murmuration/?for=<note, as base64url JSON>
//
//   note = { for: 'Ada', from: 'Dad', name: true,
//            days: [entry] (every day) or [Mon … Sun] }
//   entry = { words: 'You are loved', line: 'We love him, because…', ref: '1 John 4:19' }
//
// Opened from a link, a note is kept on that device (`mm.note`), so the
// page goes on writing it each day until someone goes back to the
// board's words. Notes you write are kept under `mm.notes`.
// ═══════════════════════════════════════════════════════════════════

const NOTE_KEY = 'mm.note';
const NOTES_KEY = 'mm.notes';

const str = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

// The words of an entry, as the flock will write them: at most five,
// each at most 12 letters (longer ones are cut, and warned about).
export const MAX_WORDS = 5, MAX_LEN = 12, EASY_LEN = 8;
export const splitWords = (s) => str(s, 80).split(' ').filter(Boolean).slice(0, MAX_WORDS).map((w) => w.slice(0, MAX_LEN));

const entry = (e = {}) => ({ words: str(e.words, 80), line: str(e.line, 200), ref: str(e.ref, 50) });

export function normaliseNote(n = {}) {
  const days = (Array.isArray(n.days) ? n.days : []).slice(0, 7).map(entry);
  return {
    id: /^n-[a-z0-9]{4,12}$/.test(n.id || '') ? n.id : `n-${Math.random().toString(36).slice(2, 9)}`,
    for: str(n.for, 16),
    from: str(n.from, 24),
    name: n.name !== false,
    days: days.length === 7 ? days : [days[0] || entry()],
  };
}

// Monday is 0.
export const weekday = (d = new Date()) => (d.getDay() + 6) % 7;
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Today's entry; on a week with a blank day, the nearest day before it.
export function entryFor(note, day = weekday()) {
  if (note.days.length === 1) return note.days[0];
  for (let k = 0; k < 7; k++) {
    const e = note.days[(day - k + 7) % 7];
    if (e.words) return e;
  }
  return entry();
}

// What the flock writes: their name, then the words one by one, each
// flowing into the next; the line beneath the last. `caption` builds
// the sentence beneath as it's written, so a child can read along.
export function noteSequence(note, day = weekday()) {
  const e = entryFor(note, day);
  const ws = splitWords(e.words);
  const seq = [];
  if (note.name && note.for) seq.push({ text: note.for, kind: 'name' });
  ws.forEach((w, i) => {
    const lastOne = i === ws.length - 1;
    seq.push({
      text: w,
      kind: lastOne ? 'last' : 'word',
      flow: i > 0,                                         // morph from the word before
      caption: ws.length > 1 ? ws.slice(0, i + 1).join(' ') + (lastOne ? '' : ' …') : '',
      verse: lastOne ? e.line : '',
      ref: lastOne ? e.ref : '',
    });
  });
  return seq;
}

// ── Links ──────────────────────────────────────────────────────────
const toB64 = (obj) => {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  bytes.forEach((c) => { bin += String.fromCharCode(c); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64 = (code) => {
  const b64 = String(code).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
};

export function encodeNote(note) {
  const { id, ...rest } = normaliseNote(note);   // eslint-disable-line no-unused-vars
  return toB64(rest);
}
export function decodeNote(code) {
  try {
    const v = fromB64(code);
    return v && typeof v === 'object' ? normaliseNote(v) : null;
  } catch { return null; }
}
export const noteUrl = (note) => `${location.origin}/murmuration/?for=${encodeNote(note)}`;

// ── On this device ─────────────────────────────────────────────────
// The note this device is showing (from a link), if any.
export function readHeldNote() {
  try {
    const code = localStorage.getItem(NOTE_KEY);
    return code ? decodeNote(code) : null;
  } catch { return null; }
}
export function holdNote(note) {
  try {
    if (note) localStorage.setItem(NOTE_KEY, encodeNote(note));
    else localStorage.removeItem(NOTE_KEY);
  } catch { /* ignore */ }
}

// The notes you've written for people.
export function readNotes() {
  try {
    const v = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
    return Array.isArray(v) ? v.map(normaliseNote) : [];
  } catch { return []; }
}
export function saveNote(note) {
  const n = normaliseNote(note);
  const all = readNotes();
  const i = all.findIndex((x) => x.id === n.id);
  if (i >= 0) all[i] = n; else all.push(n);
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return n;
}
export function deleteNote(id) {
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(readNotes().filter((x) => x.id !== id))); } catch { /* ignore */ }
}

// ── This week's prayer, for "?from=pray" ────────────────────────────
// The word of the prayer the family is praying this week, with its verse.
export function prayerWord() {
  let ref = '';
  try { ref = JSON.parse(localStorage.getItem('familyPrayer') || '{}').prayerRef || ''; } catch { /* ignore */ }
  const w = wordForRef(ref);
  return { text: w.word, verse: w.lines.join(' '), ref: w.ref, kind: 'last' };
}

// ── Ready-made notes, to start from and change ─────────────────────
// Verses are short excerpts, World English Bible (public domain).
const day = (words, line, ref) => ({ words, line, ref });
const FRUIT = 'Galatians 5:22';
export const PRESETS = [
  {
    key: 'loved', title: 'You are loved', sub: 'A week: loved, then love others',
    days: [
      day('You are loved', 'We love him, because he first loved us.', '1 John 4:19'),
      day('Be kind', 'Be kind to one another, tender hearted, forgiving each other.', 'Ephesians 4:32'),
      day('Joy', 'The joy of the Lord is your strength.', 'Nehemiah 8:10'),
      day('Be brave', 'Be strong and courageous. The Lord your God is with you wherever you go.', 'Joshua 1:9'),
      day('Spread love', 'Love one another, just like I have loved you.', 'John 13:34'),
      day('Shine', 'Let your light shine.', 'Matthew 5:16'),
      day('Rest', 'Come to me, all you who labour, and I will give you rest.', 'Matthew 11:28'),
    ],
  },
  {
    key: 'fruit', title: 'Fruit of the Spirit', sub: 'A week: one fruit a day, and something to do',
    days: [
      day('Love', 'Who could you show love to today?', FRUIT),
      day('Joy', 'Look for one thing to be glad about.', FRUIT),
      day('Peace', 'Take a slow breath. God is with you.', FRUIT),
      day('Patience', 'Let someone else go first today.', FRUIT),
      day('Kindness', 'Do one kind thing nobody asked for.', FRUIT),
      day('Goodness', 'Choose the good thing, even when it’s hard.', FRUIT),
      day('Be faithful', 'Keep your promises, like God keeps his.', 'Galatians 5:22'),
    ],
  },
  {
    key: 'always', title: 'Every day', sub: 'The same words each morning',
    days: [day('You are loved', 'See how great a love the Father has given to us, that we should be called children of God.', '1 John 3:1')],
  },
];
