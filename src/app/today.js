// ═══════════════════════════════════════════════════════════════════
// today.js — everything a screen needs to know about today, worked out
// in one place from the record and the clock.
// ═══════════════════════════════════════════════════════════════════

import { now, today, lightAt, partOfDay, seasonAt, weekOf, addDays, daysBetween } from './calendar.js';
import { rotaForWeek, prayerForWeek } from './rota.js';
import { VERSES } from './content/verses.js';
import { peopleOf } from './household.js';
import { currentSeason, prayedToday } from './store.js';

export function deriveToday(state, device) {
  const d = now();
  const t = today();
  const household = state.household;
  const people = household?.people || [];
  const rota = household ? rotaForWeek(household, t.week) : [];
  const todayIds = t.isSunday ? people.map((p) => p.id) : rota[t.weekday] || [];
  const prayerIdx = household ? prayerForWeek(household, t.week, state.pick) : 0;
  const season = currentSeason(state);

  // A lily pad for every week of the season so far; a lotus on each
  // week whose verse was said by heart.
  const firstWeek = season
    ? weekOf(season.start)
    : state.sittings.length ? state.sittings[0].week : t.week;
  const pads = [];
  for (let w = firstWeek, n = 0; w <= t.week && n < 26; w = addDays(w, 7), n++) {
    pads.push({ week: w, lotus: Boolean(state.heart?.[w]) });
  }

  const prayed = prayedToday(t.date, state);
  const before = state.sittings.filter((s) => s.date < t.date);
  const last = before.length ? before[before.length - 1].date : null;
  const away = last ? daysBetween(last, t.date) : 0;
  const part = partOfDay(d);

  return {
    ...t,
    clock: d,
    light: lightAt(d),
    part,
    season,
    seasonName: seasonAt(d),
    household,
    people,
    rota,
    todayIds,
    forPeople: peopleOf(household, todayIds),
    prayerIdx,
    verse: VERSES[prayerIdx],
    words: season?.words || {},
    pads: household ? pads : [],
    prayed,
    // Back after a few days away: say welcome, and nothing else about it.
    welcomeBack: Boolean(last) && away >= 4,
    lastWho: (device.lastWho?.[part] || []).filter((id) => people.some((p) => p.id === id)),
    seasonEnding: Boolean(season?.until) && daysBetween(t.date, season.until) <= 14,
    saturdayEvening: t.weekday === 5 && (part === 'evening' || part === 'night'),
    heartThisWeek: state.heart?.[t.week] || null,
    playStep: state.play?.[t.week] ?? 0,
  };
}
