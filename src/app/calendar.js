// ═══════════════════════════════════════════════════════════════════
// calendar.js — what time it is, for the household.
//
// Everything that depends on the clock asks `now()` here, so the judge
// (and we) can preview any moment from the address bar:
//
//   ?h=22        the hour (decimals or 6:45 allowed)
//   ?day=sun     the weekday, within this week
//   ?season=winter
//
// The prayer day turns at 03:00, so a prayer just after midnight still
// belongs to the evening before. The week turns on Monday morning, so
// Sunday, with the whole household, closes the week.
// ═══════════════════════════════════════════════════════════════════

const params = new URLSearchParams(window.location.search);
const DAY_NAMES = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const WEEKDAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_TURNS_AT = 3;

function parseHour(v) {
  if (v == null || v === '') return null;
  const m = String(v).match(/^(\d{1,2})(?:[:.](\d{1,2}))?$/);
  if (!m) return null;
  const h = Number(m[1]);
  // "6.5" is half past six; "6:45" is a quarter to seven.
  const frac = m[2] == null ? 0 : String(v).includes(':') ? Number(m[2]) / 60 : Number(`0.${m[2]}`);
  const out = h + frac;
  return out >= 0 && out < 24 ? out : null;
}

const HOUR = parseHour(params.get('h'));
const DAY = DAY_NAMES.indexOf((params.get('day') || '').slice(0, 3).toLowerCase());
const SEASON = ['spring', 'summer', 'autumn', 'winter'].includes(params.get('season'))
  ? params.get('season')
  : null;

export const previewing = HOUR != null || DAY >= 0 || SEASON != null;

// The current moment, with any preview applied.
export function now() {
  const d = new Date();
  if (DAY >= 0) {
    const today = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() + (DAY - today));
  }
  if (HOUR != null) {
    d.setHours(Math.floor(HOUR), Math.round((HOUR % 1) * 60), 0, 0);
  }
  return d;
}

const pad = (n) => String(n).padStart(2, '0');
export function iso(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function fromIso(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}
export function addDays(s, n) {
  const d = fromIso(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}
export function daysBetween(a, b) {
  return Math.round((fromIso(b) - fromIso(a)) / 86400000);
}

// The prayer day: before 03:00 it is still yesterday.
export function prayerDate(d = now()) {
  const x = new Date(d);
  if (x.getHours() < DAY_TURNS_AT) x.setDate(x.getDate() - 1);
  return iso(x);
}

// 0 = Monday … 6 = Sunday, for a prayer date.
export function weekdayOf(dateIso) {
  return (fromIso(dateIso).getDay() + 6) % 7;
}

// The Monday that starts the week a date belongs to.
export function weekOf(dateIso) {
  return addDays(dateIso, -weekdayOf(dateIso));
}

// Weeks since a fixed Monday: the rotation's clock.
const EPOCH = '2024-01-01';
export function weekNumber(mondayIso) {
  return Math.floor(daysBetween(EPOCH, mondayIso) / 7);
}

export function today() {
  const date = prayerDate();
  return { date, weekday: weekdayOf(date), week: weekOf(date), isSunday: weekdayOf(date) === 6 };
}

// ── Light ───────────────────────────────────────────────────────────
// Sunrise and sunset by month, roughly, for the UK (local clock time,
// with summer time). Good enough to know that 06:45 in October is dark.
const SUNRISE = [8.1, 7.4, 6.5, 6.4, 5.4, 4.8, 5.0, 5.7, 6.6, 7.4, 7.3, 8.0];
const SUNSET = [16.3, 17.2, 18.1, 19.9, 20.7, 21.3, 21.2, 20.5, 19.3, 18.2, 16.4, 15.9];

export function lightAt(d = now()) {
  const h = d.getHours() + d.getMinutes() / 60;
  const rise = SUNRISE[d.getMonth()];
  const set = SUNSET[d.getMonth()];
  if (h < rise - 0.6 || h >= set + 0.8) return 'night';
  if (h < rise + 0.9) return 'dawn';
  if (h >= set - 1) return 'dusk';
  return 'day';
}

// Morning, afternoon, evening: how the sitting speaks of the time.
export function partOfDay(d = now()) {
  const h = d.getHours();
  if (h < DAY_TURNS_AT || h >= 21) return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export function seasonAt(d = now()) {
  if (SEASON) return SEASON;
  const m = d.getMonth();
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}

export function niceDate(dateIso) {
  const d = fromIso(dateIso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}
export function niceWeekRange(mondayIso) {
  const a = fromIso(mondayIso);
  const b = fromIso(addDays(mondayIso, 6));
  const sameMonth = a.getMonth() === b.getMonth();
  const left = a.toLocaleDateString('en-GB', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' });
  const right = b.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${left} – ${right}`;
}
