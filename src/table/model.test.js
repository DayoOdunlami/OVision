import assert from 'node:assert/strict';
import test from 'node:test';
import { countVerses } from './verses.js';
import {
  addDays,
  createDemo,
  dateFromIso,
  defaultSelected,
  isoDate,
  isSunday,
  joinNames,
  memoryGapIndexes,
  mondayIso,
  pairsForWeek,
  prayedForIds,
  recordSitting,
  satMap,
  verseForMonday,
  weeksFor,
} from './model.js';

const thursday = new Date(2026, 9, 22, 7, 20, 0, 0);

test('22 October 2026 is a Thursday and its Monday is the 19th', () => {
  assert.equal(thursday.getDay(), 4);
  assert.equal(mondayIso(thursday), '2026-10-19');
  assert.equal(isSunday(new Date(2026, 9, 25, 12)), true);
});

test('a verse stays put for the whole week and changes on Monday', () => {
  const mon = mondayIso(thursday);
  const a = verseForMonday(mon);
  const b = verseForMonday(mon);
  assert.equal(a.id, b.id);
  const next = verseForMonday(isoDate(addDays(dateFromIso(mon), 7)));
  assert.notEqual(a.id, next.id);
});

test('the rota is one pair a day, stable, and Sunday is everyone', () => {
  const people = createDemo(thursday).household.people;
  const pairs = pairsForWeek(people, '2026-10-19');
  assert.equal(pairs.length, 6);
  for (const pair of pairs) {
    assert.equal(pair.length, 2);
    assert.notEqual(pair[0], pair[1]);
  }
  assert.deepEqual(pairs, pairsForWeek(people, '2026-10-19'));
  const state = createDemo(thursday);
  assert.deepEqual(prayedForIds(state, new Date(2026, 9, 25, 12)), people.map((p) => p.id));
});

test('a morning sitting does not mark the children', () => {
  const state = createDemo(thursday);
  const today = '2026-10-22';
  assert.ok(satMap(state, today).sam);
  assert.equal(satMap(state, today).wren, undefined);
  assert.equal(satMap(state, today).idris, undefined);
  recordSitting(state, today, ['wren', 'jo'], 'a worry');
  assert.equal(satMap(state, today).wren.putDown, 'a worry');
  assert.ok(satMap(state, today).sam);
});

test('memory gaps are every third word, and repeated words can match', () => {
  const words = 'Love the Lord your God with all your heart and with all your soul'.split(' ');
  const gaps = memoryGapIndexes(words);
  assert.deepEqual(gaps, [2, 5, 8, 11]);
  const live = gaps.find((i) => true);
  assert.equal(words[live], 'Lord');
});

test('demo history has gaps and more than one week', () => {
  const state = createDemo(thursday);
  const weeks = weeksFor(state, thursday);
  assert.ok(weeks.length >= 3);
  const flat = weeks.flatMap((w) => w.days);
  assert.ok(flat.some((d) => !d.future && d.who.length === 0));
  assert.ok(weeks.some((w) => w.learned.includes('idris')));
});

test('names join in plain English and evening selects the children', () => {
  assert.equal(joinNames(['Sam']), 'Sam');
  assert.equal(joinNames(['Idris', 'Wren']), 'Idris and Wren');
  assert.equal(joinNames(['A', 'B', 'C']), 'A, B and C');
  const state = createDemo(thursday);
  assert.deepEqual(defaultSelected(state, 'evening', thursday), ['idris', 'wren', 'jo', 'pip']);
  assert.deepEqual(defaultSelected(state, 'morning', thursday), ['sam']);
});

test('the NIV set stays small', () => {
  const n = countVerses();
  assert.ok(n > 0 && n < 500);
  assert.ok(n < 40);
});
