// ═══════════════════════════════════════════════════════════════════
// prayerLink.js — the bridge between the two surfaces.
//
// The Pond (this React app, served at "/") and the Prayer surface
// (a self-contained static page at "/pray/") are deployed from the
// same origin, which means they share one localStorage. That is the
// whole integration: no API, no database, no build coupling. The
// prayer surface writes its state under `familyPrayer`; the pond
// reads it here and never writes it.
//
// What the pond wants to know:
//   · who am I praying for today        → two koi pair up + get named
//   · how consistent have I been        → drives the "Full" swell
//   · which prayer is this week's       → shown on the Pray pad
//
// Everything is defensive. The prayer surface may never have been
// opened on this device, in which case we return a null-ish shape and
// every consumer degrades to its ambient behaviour.
// ═══════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'familyPrayer';

// Must stay in sync with `family` in public/pray/index.html. Kept as a
// literal (rather than imported) because the two surfaces are built
// independently — the prayer page is plain HTML with no bundler.
export const FAMILY = [
  { name: 'Dayo',     label: 'Dad' },
  { name: 'Claire',   label: 'Mum' },
  { name: 'Bella',    label: 'Bella' },
  { name: 'Florence', label: 'Florence' },
  { name: 'Keziah',   label: 'Keziah' },
  { name: 'Ezra',     label: 'Ezra' },
];

// One koi variety per person. Chosen so each fish is visually distinct
// at a glance on a fridge tablet — you should be able to tell who is
// who from across the kitchen, which is the entire point of naming
// them. Chagoi for Dayo because chagoi are the tame, curious ones that
// come to your hand, and `personality: 'curious'` in SpineFish already
// makes them approach the cursor.
export const KOI_BY_PERSON = {
  Dayo:     'chagoi',
  Claire:   'kohaku',
  Bella:    'sanke',
  Florence: 'ogon',
  Keziah:   'asagi',
  Ezra:     'showa',
};

export const PERSON_BY_KOI = Object.fromEntries(
  Object.entries(KOI_BY_PERSON).map(([person, koi]) => [koi, person]),
);

const EMPTY = {
  available: false,
  todayPair: [],
  todayNames: [],
  isSunday: false,
  prayerRef: null,
  prayerTheme: null,
  daysPrayedThisWeek: 0,
  prayedToday: false,
  weekStartDate: null,
};

// Monday-indexed day of week, matching the prayer surface's rota
// (which runs Mon–Sat as pairs and Sunday as the whole family).
export function todayDayIndex() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function isoDate(d = new Date()) {
  return d.toISOString().split('T')[0];
}

// Every ISO date from the current rota week's Monday through today.
// Used to count consistency without penalising you for days that
// haven't happened yet — a Tuesday should read 2/2, not 2/7.
function weekDatesSoFar() {
  const out = [];
  const today = new Date();
  for (let i = 0; i <= todayDayIndex(); i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (todayDayIndex() - i));
    out.push(isoDate(d));
  }
  return out;
}

// Read the prayer surface's state. Returns EMPTY (never throws) when
// localStorage is unavailable, the key is missing, or the payload is
// the wrong shape — e.g. a fresh device, a private window, or a
// half-written value.
export function readPrayerState() {
  let raw = null;
  try {
    raw = window.localStorage?.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (!raw) return EMPTY;

  let s;
  try {
    s = JSON.parse(raw);
  } catch {
    return EMPTY;
  }
  if (!s || typeof s !== 'object' || !Array.isArray(s.weekPairs)) return EMPTY;

  const dayIdx = todayDayIndex();
  const isSunday = dayIdx === 6;

  // Sunday is the whole household on the prayer surface, so there is
  // no pair to highlight — every koi is "today's koi".
  let todayPair = [];
  if (!isSunday) {
    const pair = s.weekPairs[dayIdx];
    if (Array.isArray(pair)) {
      todayPair = pair
        .map((i) => FAMILY[i])
        .filter(Boolean);
    }
  }

  const prayed = (s.prayed && typeof s.prayed === 'object') ? s.prayed : {};
  const week = weekDatesSoFar();
  const daysPrayedThisWeek = week.filter((d) => prayed[d]).length;

  return {
    available: true,
    todayPair,
    todayNames: todayPair.map((p) => p.name),
    isSunday,
    prayerRef: typeof s.prayerRef === 'string' ? s.prayerRef : null,
    prayerTheme: typeof s.prayerTheme === 'string' ? s.prayerTheme : null,
    daysPrayedThisWeek,
    daysElapsedThisWeek: week.length,
    prayedToday: Boolean(prayed[isoDate()]),
    weekStartDate: s.weekStartDate || null,
  };
}

// Consistency as a 0..1 scalar over the days that have actually
// happened this week. Feeds the "Full" zone's swell: a well-prayed
// week makes the koi near the word fat and golden, a thin week leaves
// them lean. Returns null when the prayer surface has never been
// opened, so FullZone can fall back to pure proximity rather than
// showing a guilt-inducing empty gauge on day one.
export function consistency(state = readPrayerState()) {
  if (!state.available || !state.daysElapsedThisWeek) return null;
  return state.daysPrayedThisWeek / state.daysElapsedThisWeek;
}

// Which koi varieties are today's pair, for the pond to pick out and
// pair up. Returns e.g. [{ koi: 'sanke', person: 'Bella' }, …].
export function todayKoi(state = readPrayerState()) {
  return state.todayNames
    .map((person) => ({ person, koi: KOI_BY_PERSON[person] }))
    .filter((x) => Boolean(x.koi));
}

export const PRAY_URL = '/pray/';
