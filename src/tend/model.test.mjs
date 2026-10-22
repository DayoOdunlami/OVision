import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, loadModel, saveModel, freshModel, demoModel, dateKey, mondayKey, weekFor, pairFor, recordSitting, recordPractice } from './model.js';

const roster = (n) => Array.from({ length: n }, (_, index) => ({ id: `m${index}`, name: `Person ${index}`, color: '#123456' }));
const modelWith = (n = 6) => ({ ...freshModel(), household: { name: 'Test household', members: roster(n) } });
const ids = (people) => people.map((person) => person.id);

// These tests protect the shared requirements that are easy to break while the
// interface changes: local-day boundaries, arbitrary households, separate
// sittings, stable Scripture and non-destructive persistence failure.
test('Sunday closes the week; Monday changes the verse for the whole household', () => {
  const monday = weekFor('2026-10-19');
  assert.equal(monday.id, 'john15-12');
  for (let day = 20; day <= 25; day += 1) assert.equal(weekFor(`2026-10-${day}`), monday);
  assert.notEqual(weekFor('2026-10-26').id, monday.id);
  assert.equal(weekFor('2026-12-14').id, monday.id);
  assert.equal(mondayKey('2026-10-25'), '2026-10-19');
  assert.equal(mondayKey('2026-10-26'), '2026-10-26');
});

test('calendar keys survive DST and do not parse date-only strings as UTC instants', () => {
  const previousTZ = process.env.TZ;
  try {
    for (const zone of ['Europe/London', 'America/Los_Angeles', 'Pacific/Auckland']) {
      process.env.TZ = zone;
      assert.equal(dateKey(new Date(2026, 9, 25, 23, 59)), '2026-10-25', zone);
      assert.equal(mondayKey(new Date(2026, 9, 25, 23, 59)), '2026-10-19', zone);
      assert.equal(dateKey('2026-10-25'), '2026-10-25', zone);
      assert.equal(mondayKey(new Date(2026, 2, 29, 12)), '2026-03-23', zone);
    }
    assert.throws(() => dateKey('2026-02-30'), RangeError);
  } finally {
    if (previousTZ === undefined) delete process.env.TZ;
    else process.env.TZ = previousTZ;
  }
});

test('the rotation contains eight small stable NIV passages with original surrounding prayers', () => {
  const weeks = Array.from({ length: 8 }, (_, i) => weekFor(new Date(2026, 9, 19 + i * 7)));
  assert.equal(new Set(weeks.map((week) => week.id)).size, 8);
  assert.ok(weeks.every((week) => week.text && week.ref && week.prayer.length === 3));
  assert.ok(weeks.every((week) => !week.text.includes('{names}')));
  const quotedWords = weeks.reduce((sum, week) => sum + week.text.split(/\s+/).length, 0);
  const originalWords = weeks.reduce((sum, week) => sum + [...week.prayer, week.wonder, week.context, week.carry].join(' ').split(/\s+/).length, 0);
  assert.ok(quotedWords <= 90);
  assert.ok(originalWords > 1000);
});

test('a rota accepts empty, single, odd and large households and holds everyone on Sunday', () => {
  for (const count of [0, 1, 3, 5, 6, 11]) {
    const people = roster(count);
    assert.equal(pairFor('2026-10-22', people).length, Math.min(2, count));
    assert.deepEqual(ids(pairFor('2026-10-25', people)).sort(), ids(people).sort());
    assert.equal(new Set(ids(pairFor('2026-10-22', people))).size, Math.min(2, count));
  }
});

test('pair identity survives roster reordering, and the first six-person cycle includes every pair', () => {
  const people = roster(6);
  assert.deepEqual(ids(pairFor('2026-10-22', people)), ids(pairFor('2026-10-22', [...people].reverse())));
  const pairs = [];
  for (let offset = 0; pairs.length < 15; offset += 1) {
    const date = new Date(2026, 9, 19 + offset);
    if (date.getDay() !== 0) pairs.push(ids(pairFor(date, people)).sort().join('/'));
  }
  assert.equal(new Set(pairs).size, 15);
  const firstThree = [19, 20, 21].flatMap((day) => ids(pairFor(`2026-10-${day}`, people)));
  assert.equal(new Set(firstThree).size, 6);
});

test('a morning Amen records only actual participants and leaves evening and puzzle separate', () => {
  const original = modelWith();
  const morning = recordSitting(original, { date: '2026-10-22', participants: ['m0'], mode: 'quiet' });
  assert.equal(original.sessions.length, 0);
  assert.deepEqual(morning.sessions[0].participants, ['m0']);
  assert.deepEqual(morning.sessions[0].names, ['Person 0']);
  assert.equal(morning.practices.length, 0);
  const evening = recordSitting(morning, { date: '2026-10-22', participants: ['m2', 'm3'], mode: 'together' });
  assert.equal(evening.sessions.length, 2);
  assert.equal(evening.sessions.some((sitting) => sitting.participants.includes('m5')), false);
  assert.equal(recordSitting(evening, { date: '2026-10-22', participants: ['m3', 'm2', 'm2'], mode: 'together' }), evening);
  assert.equal(recordSitting(evening, { date: '2026-10-22', participants: ['unknown'] }), evening);
});

test('puzzle records do not claim prayer, and same-day repeat completion is harmless', () => {
  const original = modelWith(3);
  const practice = recordPractice(original, { date: '2026-10-22', participants: ['m1', 'm2'] });
  assert.equal(practice.sessions.length, 0);
  assert.equal(practice.practices.length, 1);
  assert.deepEqual(practice.practices[0].names, ['Person 1', 'Person 2']);
  assert.equal(recordPractice(practice, { date: '2026-10-22', participants: ['m2', 'm1'] }), practice);
});

test('demo gives three weeks of past events, invented people, and no today/future completion', () => {
  const today = new Date(2026, 9, 22, 0, 1);
  const model = demoModel(today);
  assert.equal(model.demo, true);
  assert.equal(model.household.members.length, 6);
  assert.ok(model.sessions.length > 20);
  assert.ok(model.practices.length > 5);
  for (const record of [...model.sessions, ...model.practices]) {
    assert.ok(record.date < dateKey(today));
    assert.ok(record.date >= '2026-10-01');
    assert.ok(record.participants.length && record.names.length === record.participants.length);
  }
  assert.equal(freshModel().demo, false);
  assert.equal(freshModel().household.members.length, 0);
});

test('storage failure is explicit and malformed data never prevents a first run', () => {
  globalThis.localStorage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('full'); } };
  assert.deepEqual(loadModel(), freshModel());
  assert.equal(saveModel(modelWith()), false);
  for (const value of ['{broken', 'null', '{"version":2}', '{"version":1,"household":null}']) {
    globalThis.localStorage = { getItem: () => value };
    assert.deepEqual(loadModel(), freshModel());
  }
  delete globalThis.localStorage;
});

test('saved records retain their names and IDs after somebody leaves the household', () => {
  let stored;
  globalThis.localStorage = { getItem: (key) => key === STORAGE_KEY ? stored : null, setItem: (_, value) => { stored = value; } };
  const original = recordSitting(modelWith(2), { date: '2026-10-22', participants: ['m0', 'm1'] });
  const edited = { ...original, household: { name: 'Changed name', members: [{ ...original.household.members[0], name: 'A new name' }] } };
  assert.equal(saveModel(edited), true);
  const restored = loadModel();
  assert.deepEqual(restored.sessions[0].names, ['Person 0', 'Person 1']);
  assert.deepEqual(restored.sessions[0].participants, ['m0', 'm1']);
  assert.equal(restored.household.members[0].name, 'A new name');
  delete globalThis.localStorage;
});

test('partial malformed storage is normalised without accepting duplicate member IDs or invalid dates', () => {
  const model = demoModel(new Date(2026, 9, 22));
  model.household.members.push({ id: 'person-1', name: 'Duplicate' });
  model.sessions.push({ id: 'bad', date: '2026-02-30', participants: ['person-1'] });
  model.board = null;
  globalThis.localStorage = { getItem: () => JSON.stringify(model) };
  const restored = loadModel();
  assert.equal(restored.household.members.length, 6);
  assert.equal(restored.sessions.some((session) => session.id === 'bad'), false);
  assert.equal(restored.demo, true);
  assert.equal(restored.board.word, freshModel().board.word);
  delete globalThis.localStorage;
});
