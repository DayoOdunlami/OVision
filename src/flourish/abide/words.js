// ═══════════════════════════════════════════════════════════════════
// One word for each prayer in the rota, so the Abide practice can sow
// this week's word without being told. Keyed by the start of the
// prayer's reference ("Psalm 1", "John 15"), which the pond bridge
// already exposes. Verse lines are short excerpts, mostly WEB (public
// domain), revealed a line at a time as the vine grows; the question
// appears halfway. Questions are "I wonder…" (as in Godly Play): there
// is no right answer, and staying quiet is an answer too.
// ═══════════════════════════════════════════════════════════════════

export const WORDS = [
  { key: 'Ephesians 1', word: 'See', ref: 'Ephesians 1:18',
    lines: ['Having the eyes of your hearts enlightened,', 'that you may know', 'the hope of his calling.'],
    question: 'I wonder what you would like to see clearly today?' },
  { key: 'Ephesians 3', word: 'Rooted', ref: 'Ephesians 3:17',
    lines: ['That Christ may dwell in your hearts', 'through faith,', 'being rooted and grounded in love.'],
    question: 'I wonder where you feel most rooted?' },
  { key: 'Philippians 1', word: 'Discern', ref: 'Philippians 1:9',
    lines: ['That your love may abound', 'yet more and more', 'in knowledge and all discernment.'],
    question: 'I wonder where you need wise love today?' },
  { key: 'Colossians 1', word: 'Fruitful', ref: 'Colossians 1:10',
    lines: ['Bearing fruit in every good work,', 'and increasing', 'in the knowledge of God.'],
    question: 'I wonder what good work is waiting for you today?' },
  { key: 'Romans 15', word: 'Hope', ref: 'Romans 15:13',
    lines: ['May the God of hope fill you', 'with all joy and peace in believing,', 'that you may abound in hope.'],
    question: 'I wonder where joy and peace could fill you today?' },
  { key: '1 Thessalonians 3', word: 'Abound', ref: '1 Thessalonians 3:12',
    lines: ['May the Lord make you', 'increase and abound in love', 'toward one another, and toward all.'],
    question: 'I wonder who is just beyond your front door?' },
  { key: 'Hebrews 13', word: 'Equipped', ref: 'Hebrews 13:21',
    lines: ['Make you complete in every good work', 'to do his will,', 'working in you what is pleasing in his sight.'],
    question: 'I wonder what God is making you ready for?' },
  { key: 'Psalm 139', word: 'Search', ref: 'Psalm 139:23',
    lines: ['Search me, God,', 'and know my heart.', 'Try me, and know my thoughts.'],
    question: 'I wonder what is really on your heart today?' },
  { key: 'John 17', word: 'Kept', ref: 'John 17:15',
    lines: ['I pray not that you would', 'take them from the world,', 'but that you would keep them from the evil one.'],
    question: 'I wonder who needs keeping safe today?' },
  { key: 'John 15', word: 'Abide', ref: 'John 15:4–5',
    lines: ['Abide in me, and I in you.', 'I am the vine; you are the branches.', 'Apart from me you can do nothing.'],
    question: 'I wonder where you most need to stay close today?' },
  { key: 'Psalm 1', word: 'Planted', ref: 'Psalm 1:3',
    lines: ['He will be like a tree', 'planted by the streams of water,', 'that brings forth its fruit in its season.'],
    question: 'I wonder what streams you are planted by?' },
  { key: 'Psalm 63', word: 'Thirst', ref: 'Psalm 63:1',
    lines: ['God, you are my God.', 'I will earnestly seek you.', 'My soul thirsts for you.'],
    question: 'I wonder what you are thirsty for?' },
  { key: 'Psalm 121', word: 'Keep', ref: 'Psalm 121:7',
    lines: ['The Lord will keep you', 'from all evil.', 'He will keep your soul.'],
    question: 'I wonder what you would like to hand over to God today?' },
  { key: 'Luke 2', word: 'Grow', ref: 'Luke 2:52',
    lines: ['And Jesus increased', 'in wisdom and stature,', 'and in favour with God and people.'],
    question: 'I wonder where you would like to grow?' },
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

// Each entry is one session: a day, a word, and who abided together.
// Older entries (before names) have no `who`; they read as [] and
// belong to the whole family.
export function readVineyard() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(v)) return [];
    return v
      .filter((e) => e && typeof e.word === 'string' && typeof e.date === 'string')
      .map((e) => ({ ...e, who: Array.isArray(e.who) ? e.who.filter((p) => typeof p === 'string') : [] }));
  } catch {
    return [];
  }
}

// Gather today's session for this group. A person abides once a day:
// earlier sessions today that this group fully covers are replaced
// (keeping a note if this time there isn't one); others are kept.
export function gatherToday(entry, note = '', who = [], extra = {}) {
  const date = todayIso();
  const all = readVineyard();
  const covered = (e) => e.date === date && (who.length ? e.who.length > 0 && e.who.every((p) => who.includes(p)) : !e.who.length);
  const before = all.find((e) => covered(e) && e.key === entry.key && e.note);
  const list = all.filter((e) => !covered(e));
  const kept = String(note || '').trim().slice(0, 160) || before?.note || '';
  list.push({
    date, word: entry.word, ref: entry.ref, key: entry.key, who: [...who],
    ...(kept ? { note: kept } : {}),
    ...(extra.soil ? { soil: extra.soil } : {}),
  });
  list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const out = list.slice(-600);
  try { localStorage.setItem(KEY, JSON.stringify(out)); } catch { /* ignore */ }
  return out;
}

// Sessions that include this person (or, for no one, the family's).
export function sessionsOf(entries, person) {
  return entries.filter((e) => (person ? e.who.includes(person) : !e.who.length));
}

// Has everyone in this group abided today?
export function doneTodayFor(entries, who) {
  const today = todayIso();
  if (!who.length) return entries.some((e) => e.date === today);
  return who.every((p) => entries.some((e) => e.date === today && e.who.includes(p)));
}

// ── The family's field: the wall and the compost ─────────────────
// Every stone carried to the wall and every weed put on the compost,
// across all the days, by anyone. They build the vineyard's wall and
// heap (Isaiah 5:2: "he cleared it of stones and planted it…").
const FIELD_KEY = 'flourish.field';
export function readField() {
  try {
    const v = JSON.parse(localStorage.getItem(FIELD_KEY) || '{}');
    return {
      wall: Number.isFinite(v.wall) ? v.wall : 0,
      compost: Number.isFinite(v.compost) ? v.compost : 0,
      seen: typeof v.seen === 'string' ? v.seen : '',
    };
  } catch {
    return { wall: 0, compost: 0, seen: '' };
  }
}
export function addToField(delta) {
  const f = readField();
  const out = { ...f, ...Object.fromEntries(Object.entries(delta).map(([k, v]) => [k, typeof v === 'number' ? (f[k] || 0) + v : v])) };
  try { localStorage.setItem(FIELD_KEY, JSON.stringify(out)); } catch { /* ignore */ }
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
export function daysAway(entries, who = []) {
  const mine = who.length ? entries.filter((e) => !e.who.length || e.who.some((p) => who.includes(p))) : entries;
  if (!mine.length) return null;
  return Math.max(0, daysBetween(mine[mine.length - 1].date, todayIso()) - 1);
}

// The ground before sowing: the pile of stones is there every day;
// the thorns grow back while you're away — two even after a single
// day, because the cares of the day always crowd in.
export function groundFor(entries, who = []) {
  const away = daysAway(entries, who);
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
