// ═══════════════════════════════════════════════════════════════════
// One word for each prayer in the rota, so the Abide practice can sow
// this week's word without being told. Keyed by the start of the
// prayer's reference ("Psalm 1", "John 15"), which the pond bridge
// already exposes. Verse lines are short excerpts, mostly WEB (public
// domain), revealed a line at a time as the vine grows; the question
// appears halfway.
// ═══════════════════════════════════════════════════════════════════

export const WORDS = [
  { key: 'Ephesians 1', word: 'See', ref: 'Ephesians 1:18',
    lines: ['Having the eyes of your hearts enlightened,', 'that you may know', 'the hope of his calling.'],
    question: 'What would you like to see clearly today?' },
  { key: 'Ephesians 3', word: 'Rooted', ref: 'Ephesians 3:17',
    lines: ['That Christ may dwell in your hearts', 'through faith,', 'being rooted and grounded in love.'],
    question: 'Where do you feel most rooted right now?' },
  { key: 'Philippians 1', word: 'Discern', ref: 'Philippians 1:9',
    lines: ['That your love may abound', 'yet more and more', 'in knowledge and all discernment.'],
    question: 'Where do you need wise love today?' },
  { key: 'Colossians 1', word: 'Fruitful', ref: 'Colossians 1:10',
    lines: ['Bearing fruit in every good work,', 'and increasing', 'in the knowledge of God.'],
    question: 'What good work is in front of you today?' },
  { key: 'Romans 15', word: 'Hope', ref: 'Romans 15:13',
    lines: ['May the God of hope fill you', 'with all joy and peace in believing,', 'that you may abound in hope.'],
    question: 'Where could joy and peace fill in today?' },
  { key: '1 Thessalonians 3', word: 'Abound', ref: '1 Thessalonians 3:12',
    lines: ['May the Lord make you', 'increase and abound in love', 'toward one another, and toward all.'],
    question: 'Who is just beyond your front door today?' },
  { key: 'Hebrews 13', word: 'Equipped', ref: 'Hebrews 13:21',
    lines: ['Make you complete in every good work', 'to do his will,', 'working in you what is pleasing in his sight.'],
    question: 'What are you being equipped for today?' },
  { key: 'Psalm 139', word: 'Search', ref: 'Psalm 139:23',
    lines: ['Search me, God,', 'and know my heart.', 'Try me, and know my thoughts.'],
    question: 'What is really on your heart today?' },
  { key: 'John 17', word: 'Kept', ref: 'John 17:15',
    lines: ['I pray not that you would', 'take them from the world,', 'but that you would keep them from the evil one.'],
    question: 'Who needs keeping today?' },
  { key: 'John 15', word: 'Abide', ref: 'John 15:4–5',
    lines: ['Abide in me, and I in you.', 'I am the vine; you are the branches.', 'Apart from me you can do nothing.'],
    question: 'Where do you need to abide today?' },
  { key: 'Psalm 1', word: 'Planted', ref: 'Psalm 1:3',
    lines: ['He will be like a tree', 'planted by the streams of water,', 'that brings forth its fruit in its season.'],
    question: 'What streams are you planted by?' },
  { key: 'Psalm 63', word: 'Thirst', ref: 'Psalm 63:1',
    lines: ['God, you are my God.', 'I will earnestly seek you.', 'My soul thirsts for you.'],
    question: 'What are you thirsty for?' },
  { key: 'Psalm 121', word: 'Keep', ref: 'Psalm 121:7',
    lines: ['The Lord will keep you', 'from all evil.', 'He will keep your soul.'],
    question: 'What do you need to hand over today?' },
  { key: 'Luke 2', word: 'Grow', ref: 'Luke 2:52',
    lines: ['And Jesus increased', 'in wisdom and stature,', 'and in favour with God and people.'],
    question: 'Where would you like to grow?' },
];

export const DEFAULT_KEY = 'John 15';

// "Psalm 121" → Psalm 121; "John 15:4–5, 8–9" → John 15.
export function wordForRef(ref) {
  if (typeof ref === 'string') {
    const key = ref.split(':')[0].trim();
    const hit = WORDS.find((w) => w.key === key);
    if (hit) return hit;
  }
  return WORDS.find((w) => w.key === DEFAULT_KEY);
}

// ── The vineyard: one word per day, kept on this device ───────────
const KEY = 'flourish.vineyard';

export function todayIso(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function readVineyard() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((e) => e && typeof e.word === 'string' && typeof e.date === 'string') : [];
  } catch {
    return [];
  }
}

// One entry per day: abiding again today replaces today's (keeping
// today's note if this time there isn't one).
export function gatherToday(entry, note = '') {
  const date = todayIso();
  const all = readVineyard();
  const before = all.find((e) => e.date === date);
  const list = all.filter((e) => e.date !== date);
  const kept = String(note || '').trim().slice(0, 160) || (before?.key === entry.key ? before.note : '');
  list.push({ date, word: entry.word, ref: entry.ref, key: entry.key, ...(kept ? { note: kept } : {}) });
  list.sort((a, b) => (a.date < b.date ? -1 : 1));
  const out = list.slice(-120);
  try { localStorage.setItem(KEY, JSON.stringify(out)); } catch { /* ignore */ }
  return out;
}

export function wordByKey(key) {
  return WORDS.find((w) => w.key === key) || null;
}

// Whole days between two ISO dates (b − a).
export function daysBetween(a, b) {
  const t = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
  return Math.round((t(b) - t(a)) / 86400000);
}

// How long since the last time you abided: 0 = yesterday or today,
// null = never.
export function daysAway(entries) {
  if (!entries.length) return null;
  return Math.max(0, daysBetween(entries[entries.length - 1].date, todayIso()) - 1);
}

// The ground before sowing: the pile of stones is there every day;
// the thorns grow back while you're away — two even after a single
// day, because the cares of the day always crowd in.
export function groundFor(entries) {
  const away = daysAway(entries);
  return {
    weeds: away === null ? 3 : 2 + Math.min(3, away),
    stones: 6,
    away,
  };
}

// ── From the prayer surface (read only) ──────────────────────────
function prayerStore() {
  try {
    const s = JSON.parse(localStorage.getItem('familyPrayer') || 'null');
    return s && typeof s === 'object' ? s : null;
  } catch {
    return null;
  }
}

// Words whose prayer has been rebuilt from memory in the puzzle:
// { [key]: 'YYYY-MM-DD' }. Their fruit is ripe.
export function learnedWords() {
  const s = prayerStore();
  const out = {};
  if (s && s.learned && typeof s.learned === 'object') {
    for (const [ref, date] of Object.entries(s.learned)) {
      const key = String(ref).split(':')[0].trim();
      if (WORDS.some((w) => w.key === key)) out[key] = typeof date === 'string' ? date : '';
    }
  }
  return out;
}

// Days the family prayed together (from the prayer surface).
export function familyDays() {
  const s = prayerStore();
  const p = s && s.prayed && typeof s.prayed === 'object' ? s.prayed : {};
  return Object.keys(p).filter((d) => p[d]).sort();
}

// ── Seasons ───────────────────────────────────────────────────────
// Northern hemisphere, by month. ?season=winter to preview.
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export function seasonNow(d = new Date()) {
  try {
    const q = new URLSearchParams(location.search).get('season');
    if (SEASONS.includes(q)) return q;
  } catch { /* ignore */ }
  const m = d.getMonth();
  return m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter';
}

export function prettyDate(iso, opts = { day: 'numeric', month: 'short' }) {
  const d = new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
  return d.toLocaleDateString(undefined, opts);
}
