// ═══════════════════════════════════════════════════════════════════
// demo.js — an invented household with a few weeks behind it, so every
// moment can be reached in minutes (?demo=1). Kept under its own
// storage key; it never touches a real household's record.
// ═══════════════════════════════════════════════════════════════════

import { today, addDays, weekOf, weekdayOf, now } from './calendar.js';
import { rotaForWeek, prayerForWeek } from './rota.js';

const P = (id, name, short, kind, koi) => ({ id, name, short, kind, koi });
export const DEMO_HOUSEHOLD = {
  id: 'rivers-demo',
  name: 'The Rivers household',
  people: [
    P('sam', 'Sam', 'Dad', 'adult', 'chagoi'),
    P('jo', 'Jo', 'Mum', 'adult', 'kohaku'),
    P('ada', 'Ada', '', 'child', 'sanke'),
    P('kit', 'Kit', '', 'child', 'ogon'),
    P('noor', 'Noor', '', 'child', 'asagi'),
    P('pip', 'Pip', '', 'child', 'showa'),
  ],
};

// A small deterministic dice, so the example looks the same each time.
function dice(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

const LINES = [
  'Kit’s spelling test, and that he’d know he’s more than his marks.',
  'Ada nervous about the swimming gala.',
  'Jo’s long week. Give her rest.',
  'Noor and the friend who left her out.',
  'That Pip would sleep through.',
  'Thankful for Ada’s kindness to her brother.',
];

export function buildDemo() {
  const t = today();
  // ?away=5: the household has been away for five days (no guilt, just welcome).
  const away = Math.max(0, Math.min(20, Number(new URLSearchParams(window.location.search).get('away')) || 0));
  const lastDay = addDays(t.date, -away);
  const week = t.week;
  const start = addDays(week, -7 * 6);           // the season began six weeks ago
  const roll = dice(4242);
  const sittings = [];
  const heart = {};
  const play = {};
  let n = 0;

  for (let date = start; date < lastDay; date = addDays(date, 1)) {
    const wd = weekdayOf(date);
    const wk = weekOf(date);
    // A week away in the third week: nothing happened, and nothing withers.
    if (date >= addDays(start, 15) && date <= addDays(start, 19)) continue;
    const rota = rotaForWeek(DEMO_HOUSEHOLD, wk);
    const prayer = prayerForWeek(DEMO_HOUSEHOLD, wk, null);
    const forIds = rota[wd];
    if (wd === 6) {
      if (roll() < 0.9) sittings.push({ id: `d${n++}`, date, at: '17:40', who: ['sam', 'jo', 'ada', 'kit', 'noor', 'pip'], for: forIds, week: wk, prayer, kind: 'sunday' });
      continue;
    }
    if (roll() < 0.86) {
      const line = roll() < 0.3 ? LINES[Math.floor(roll() * LINES.length)] : undefined;
      sittings.push({ id: `d${n++}`, date, at: '06:5' + Math.floor(roll() * 9), who: ['sam'], for: forIds, week: wk, prayer, kind: 'solo', ...(line ? { line } : {}) });
    }
    if (roll() < 0.62) {
      const who = roll() < 0.5 ? ['ada', 'kit', 'noor'] : ['kit', 'noor', 'jo'];
      sittings.push({ id: `d${n++}`, date, at: '18:4' + Math.floor(roll() * 9), who, for: forIds, week: wk, prayer, kind: 'children' });
    }
  }

  // This morning, if the morning has happened.
  const h = now().getHours();
  if (!away && h >= 7 && h < 24 && t.weekday !== 6) {
    const rota = rotaForWeek(DEMO_HOUSEHOLD, week);
    sittings.push({ id: `d${n++}`, date: t.date, at: '06:52', who: ['sam'], for: rota[t.weekday], week, prayer: prayerForWeek(DEMO_HOUSEHOLD, week, null), kind: 'solo' });
  }

  // Verses said by heart in four of the six weeks so far.
  [0, 1, 3, 4].forEach((k) => {
    const wk = addDays(start, 7 * k);
    heart[wk] = { date: addDays(wk, 6), who: ['sam', 'jo', 'ada', 'kit', 'noor'] };
    play[wk] = 3;
  });
  play[week] = 1;   // "Some words" done earlier this week

  const seasons = [
    {
      id: 'summer',
      name: 'Summer 2026',
      start: addDays(start, -7 * 14),
      end: addDays(start, -1),
      family: { word: 'Welcome', line: 'An open door and a spare chair.', practices: ['Have someone round each week', 'Say grace together'] },
      words: { sam: 'Patient', jo: 'Rest', ada: 'Bold', kit: 'Honest', noor: 'Helpful', pip: 'Kind' },
    },
    {
      id: 'autumn',
      name: 'Autumn term',
      start,
      until: addDays(start, 7 * 15 - 3),
      end: null,
      family: {
        word: 'Rooted',
        line: 'Rooted in love, and open-handed with it.',
        practices: ['Eat together, phones away', 'Pray for each other every day', 'Keep Sunday for rest'],
      },
      words: { sam: 'Steady', jo: 'Present', ada: 'Brave', kit: 'Kind', noor: 'Joyful', pip: 'Gentle' },
    },
  ];

  return {
    state: { v: 1, household: DEMO_HOUSEHOLD, seasons, sittings, heart, play, pick: null },
    device: { textScale: 1, keepAwake: false, lastWho: { morning: ['sam'], afternoon: ['ada', 'kit', 'noor'], evening: ['ada', 'kit', 'noor'], night: ['sam'] }, quietKoi: false },
  };
}
