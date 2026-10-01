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

// One entry per day: abiding again today replaces today's.
export function gatherToday(entry) {
  const date = todayIso();
  const list = readVineyard().filter((e) => e.date !== date);
  list.push({ date, word: entry.word, ref: entry.ref, key: entry.key });
  list.sort((a, b) => (a.date < b.date ? -1 : 1));
  const kept = list.slice(-120);
  try { localStorage.setItem(KEY, JSON.stringify(kept)); } catch { /* ignore */ }
  return kept;
}
