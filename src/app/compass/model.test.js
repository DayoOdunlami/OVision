import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveBoard, themeFor, normaliseBoard, withCompass, saveCompassSeason, demoCompass } from './model.js';

const old = {
  id: 'autumn', name: 'Autumn', start: '2026-09-07', end: null,
  family: { word: 'Rooted', line: 'Rooted in love.', practices: ['Eat together', 'Keep Sunday for rest'] },
  words: { sam: 'Steady', ada: 'Brave' }, custom: { preserved: true },
};

test('legacy seasons gain no invented personal commitments or refusals', () => {
  assert.deepEqual(deriveBoard(old), { word: 'Rooted', yes: 'Eat together', no: '', theme: 'belong' });
  assert.deepEqual(deriveBoard(old, 'ada'), { word: 'Brave', yes: '', no: '', theme: 'grow' });
  assert.deepEqual(deriveBoard(null), { word: '', yes: '', no: '', theme: 'grow' });
});

test('families own the meaning of an unfamiliar word and retain it when renamed', () => {
  assert.equal(themeFor('Sabbath'), 'rest');
  assert.equal(themeFor('Hospitality'), 'welcome');
  assert.equal(themeFor('Ubuntu'), 'grow');
  assert.deepEqual(normaliseBoard({ word: '  Ubuntu  ', theme: 'belong', yes: '  A shared meal  ', no: 'Rushing' }), {
    word: 'Ubuntu', theme: 'belong', yes: 'A shared meal', no: 'Rushing',
  });
  assert.equal(normaliseBoard({ word: 'Steady', theme: 'not-a-theme' }).theme, 'steady');
});

test('editing one personal board preserves everyone else and legacy prayer data', () => {
  const season = withCompass(old, demoCompass());
  const updated = withCompass(season, { people: { ada: { word: 'Curious', yes: 'Ask a question', no: 'Pretending to know', theme: 'grow' } } });
  assert.equal(updated.words.ada, 'Curious');
  assert.equal(updated.words.sam, 'Steady');
  assert.deepEqual(updated.compass.people.kit, season.compass.people.kit);
  assert.deepEqual(updated.family.practices, old.family.practices);
  assert.equal(updated.family.line, old.family.line);
  assert.equal(season.words.ada, 'Brave');
});

test('editing a family board preserves personal contributions and does not archive', () => {
  const season = withCompass(old, demoCompass());
  const state = { seasons: [season], sittings: [{ id: 'prayer-1' }], heart: { week: true } };
  const updated = saveCompassSeason(state, { seasonId: 'autumn', name: 'Autumn reviewed', compass: { family: { word: 'Welcome', yes: 'An open door', no: 'Always being busy', theme: 'welcome' } }, date: '2026-10-22' });
  assert.equal(updated.seasons.length, 1);
  assert.equal(updated.seasons[0].family.word, 'Welcome');
  assert.equal(updated.seasons[0].end, null);
  assert.equal(updated.seasons[0].compass.people.ada.word, 'Brave');
  assert.equal(updated.sittings, state.sittings);
  assert.equal(updated.heart, state.heart);
});

test('a new season archives the former board intact and starts without personal boards when made directly', () => {
  const state = { seasons: [withCompass(old, demoCompass())], sittings: [{ id: 'prayer-1' }] };
  const updated = saveCompassSeason(state, { name: 'Winter', compass: { family: { word: 'Rest', yes: 'A quiet Sunday', no: 'Filling every hour', theme: 'rest' }, people: {} }, date: '2026-12-01', id: 'winter' });
  assert.equal(updated.seasons[0].end, '2026-11-30');
  assert.equal(updated.seasons[0].compass.people.ada.word, 'Brave');
  assert.equal(updated.seasons[1].start, '2026-12-01');
  assert.deepEqual(updated.seasons[1].compass.people, {});
  assert.equal(state.seasons[0].end, null);
  assert.equal(updated.sittings, state.sittings);
});


test('beginning another season on the same day never archives a season before it started', () => {
  const state = { seasons: [{ ...old, start: '2026-10-22' }] };
  const updated = saveCompassSeason(state, { name: 'A new direction', compass: demoCompass(), date: '2026-10-22', id: 'next' });
  assert.equal(updated.seasons[0].end, '2026-10-22');
  assert.ok(updated.seasons[0].end >= updated.seasons[0].start);
});
