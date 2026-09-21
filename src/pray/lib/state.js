import { FAMILY, DEFAULT_SELF, PRAYER_STORAGE_KEY } from '../../shared/family.js';
import { prayers } from '../data/prayers.js';

// ═══════════════════════════════════════════════════════════════════
// state.js — persistence and the weekly rota.
//
// COMPATIBILITY IS THE POINT OF THIS FILE. The stored shape is exactly
// what the original single-file app wrote under `familyPrayer`, so an
// existing rota, petition log and prayed-day history carry straight
// over, and the pond's prayerLink keeps working untouched:
//
//   {
//     weekPairs:     [[i,j], …]   six pairs, indices into FAMILY
//     prayerIndex:   number       which of `prayers` is this week's
//     weekStartDate: 'YYYY-MM-DD'
//     mode:          'solo' | 'family' | 'kids'
//     selectedDay:   0..6         Mon-indexed
//     log:           [{date, names, text, prayer}]
//     spokenView:    boolean
//     prayed:        { 'YYYY-MM-DD': true }
//     selfName:      string
//     prayerRef:     string       mirrored for the pond
//     prayerTheme:   string       mirrored for the pond
//     learned:       { [ref]: 'YYYY-MM-DD' }   prayers rebuilt in the
//                                  puzzle, first time each (added later)
//   }
//
// Add fields freely; never rename or repurpose one.
// ═══════════════════════════════════════════════════════════════════

export const VALID_MODES = ['solo', 'family', 'kids'];
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_NAMES_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ── Rotation ─────────────────────────────────────────────────────────
// The order weeks move through the prayers, as indices into `prayers`.
// Kept separate from the array because stored state holds an index, so
// the array itself can only ever be appended to. This order alternates
// Paul's letters with the Psalms and Gospels, and keeps the three
// knowledge-and-fruit prayers (Phil 1, Col 1, Eph 1) apart.
//
//   Eph 1 · Ps 1 · Eph 3 · Ps 121 · Phil 1 · John 15 · Col 1 · Ps 63 ·
//   Rom 15 · Luke 2 · 1 Thess 3 · Ps 139 · Heb 13 · John 17
export const ROTATION = [0, 10, 1, 12, 2, 9, 3, 11, 4, 13, 5, 7, 6, 8];

// The prayer `steps` weeks after `idx` in the rotation. An index not in
// the rotation (shouldn't happen) restarts it.
export function advance(idx, steps = 1) {
  const pos = ROTATION.indexOf(idx);
  const from = pos < 0 ? -1 : pos;
  const n = ROTATION.length;
  return ROTATION[(((from + steps) % n) + n) % n];
}

export function todayDayIndex() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export function isoDate(d = new Date()) {
  return d.toISOString().split('T')[0];
}

// ISO date for a Mon-indexed day in *the current calendar week*.
export function isoForDayIndex(i) {
  const d = new Date();
  d.setDate(d.getDate() - (todayDayIndex() - i));
  return isoDate(d);
}

// ── Rota generation (unchanged from the original) ───────────────────
// Every way to split six people into three pairs; take two such splits
// to get six pairings for Mon–Sat, shuffled. Sunday is everyone.
function allPartitions() {
  const indices = [0, 1, 2, 3, 4, 5];
  const out = [];
  for (let i = 0; i < 6; i++) {
    for (let j = i + 1; j < 6; j++) {
      const rest = indices.filter((x) => x !== i && x !== j);
      for (let k = 0; k < rest.length; k++) {
        for (let l = k + 1; l < rest.length; l++) {
          const a = [i, j];
          const b = [rest[k], rest[l]];
          const c = rest.filter((x) => x !== rest[k] && x !== rest[l]);
          const key = [a, b, c].map((p) => [...p].sort().join(',')).sort().join('|');
          if (!out.find((p) => p.key === key)) out.push({ key, pairs: [a, b, c] });
        }
      }
    }
  }
  return out;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function readStored() {
  try {
    const raw = localStorage.getItem(PRAYER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeStored(state) {
  try {
    localStorage.setItem(PRAYER_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function createWeek(prayerIndex, prev) {
  const parts = shuffle(allPartitions());
  const weekPairs = shuffle([...parts[0].pairs, ...parts[1].pairs]).slice(0, 6);
  const idx = ((prayerIndex % prayers.length) + prayers.length) % prayers.length;
  return {
    weekPairs,
    prayerIndex: idx,
    weekStartDate: isoDate(),
    mode: VALID_MODES.includes(prev?.mode) ? prev.mode : 'solo',
    selectedDay: todayDayIndex(),
    log: Array.isArray(prev?.log) ? prev.log : [],
    spokenView: typeof prev?.spokenView === 'boolean' ? prev.spokenView : false,
    prayed: prev?.prayed && typeof prev.prayed === 'object' ? prev.prayed : {},
    selfName: prev?.selfName || DEFAULT_SELF,
    prayerRef: prayers[idx].ref,
    prayerTheme: prayers[idx].theme,
    learned: prev?.learned && typeof prev.learned === 'object' ? prev.learned : {},
  };
}

// Load, repair and roll the week forward. Mirrors the original
// initState(), with one deliberate change: the selected day always
// opens on *today*. The original restored whatever day you last looked
// at, so opening the app on Saturday could land you on Friday's pair.
export function loadState() {
  let s = readStored();
  if (!s || !Array.isArray(s.weekPairs) || s.weekPairs.length === 0) {
    s = createWeek(0, s);
  }

  const started = new Date(s.weekStartDate);
  const daysSince = Math.floor((Date.now() - started.getTime()) / 86400000);
  if (!Number.isFinite(daysSince) || daysSince >= 7) {
    const steps = Number.isFinite(daysSince) ? Math.floor(daysSince / 7) : 1;
    s = createWeek(advance(s.prayerIndex ?? 0, steps), s);
  }

  if (!VALID_MODES.includes(s.mode)) s.mode = 'solo';
  if (typeof s.spokenView !== 'boolean') s.spokenView = false;
  if (!s.prayed || typeof s.prayed !== 'object') s.prayed = {};
  if (!Array.isArray(s.log)) s.log = [];
  if (!s.learned || typeof s.learned !== 'object') s.learned = {};
  if (!FAMILY.some((p) => p.name === s.selfName)) s.selfName = DEFAULT_SELF;
  if (!(s.prayerIndex >= 0 && s.prayerIndex < prayers.length)) s.prayerIndex = 0;
  s.prayerRef = prayers[s.prayerIndex].ref;
  s.prayerTheme = prayers[s.prayerIndex].theme;
  s.selectedDay = todayDayIndex();

  writeStored(s);
  return s;
}

export function weekTally(prayed) {
  const upto = todayDayIndex();
  let done = 0;
  for (let i = 0; i <= upto; i++) if (prayed?.[isoForDayIndex(i)]) done++;
  return { done, elapsed: upto + 1 };
}

// ── Reading-size preference ─────────────────────────────────────────
// Per-device, so it lives outside the shared record: the fridge tablet
// and a phone want different sizes.
const SCALE_KEY = 'familyPrayer.textScale';
export const TEXT_SCALES = [0.9, 1, 1.12, 1.26, 1.42];

export function readTextScale() {
  try {
    const v = Number(localStorage.getItem(SCALE_KEY));
    return TEXT_SCALES.includes(v) ? v : 1;
  } catch {
    return 1;
  }
}

export function writeTextScale(v) {
  try { localStorage.setItem(SCALE_KEY, String(v)); } catch {}
}

// ── Puzzle celebration preference ───────────────────────────────────
// What happens when a verse, and then the whole prayer, is rebuilt.
// Per device, like text size.
//
//   recommended  verse: ripple + gold sweep   prayer: gather + koi
//   quiet        ripple + gold sweep for both
//   grand        gather + koi for both
export const CELEBRATIONS = [
  { value: 'recommended', label: 'Balanced' },
  { value: 'quiet',       label: 'Quiet' },
  { value: 'grand',       label: 'Grand' },
];
const CELEBRATE_KEY = 'familyPrayer.celebrate';

export function readCelebrate() {
  try {
    const v = localStorage.getItem(CELEBRATE_KEY);
    return CELEBRATIONS.some((c) => c.value === v) ? v : 'recommended';
  } catch {
    return 'recommended';
  }
}

export function writeCelebrate(v) {
  try { localStorage.setItem(CELEBRATE_KEY, v); } catch {}
}

// Which effects to play for a completed verse (`isLast` = the final
// verse of the prayer, which gets the bigger moment in Balanced).
export function celebrationEffects(style, isLast) {
  const small = ['ripple', 'sweep'];
  const big = ['gather', 'koi'];
  if (style === 'quiet') return small;
  if (style === 'grand') return big;
  return isLast ? big : small;
}
