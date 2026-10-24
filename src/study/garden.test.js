import test from 'node:test';
import assert from 'node:assert/strict';
import { createGarden } from './garden.js';
const finish = garden => { for (const object of [...garden.getState().stones, garden.getState().thorn]) garden.activate(object.id); };

test('three stones and a thorn lead to one sowing moment, with no practice data', () => {
  const changes = [], prompts = [];
  const garden = createGarden(1180, 820, { onChange: state => changes.push(state.phase), onPrompt: text => prompts.push(text) });
  const initial = garden.getState();
  assert.equal(initial.phase, 'clear');
  assert.equal(initial.total, 4);
  assert.equal(garden.sow(), false);
  finish(garden);
  assert.equal(garden.getState().phase, 'ready');
  assert.equal(garden.getState().cleared, 4);
  assert.equal(prompts.length, 4);
  assert.equal(garden.activate('stone-1'), false);
  assert.equal(garden.sow(), true);
  assert.equal(garden.getState().phase, 'sowing');
  for (let i = 0; i < 720; i++) garden.step(1 / 60);
  assert.equal(garden.getState().phase, 'complete');
  assert.equal(garden.getState().progress, 1);
  assert.ok(changes.includes('growing'));
  assert.ok(!('household' in initial));
});

test('a finger can lift a stone with visual heft and set it aside', () => {
  const garden = createGarden(390, 844);
  const stone = garden.getState().stones[0];
  assert.equal(garden.pointerDown(stone.x, stone.y, 7), true);
  garden.pointerMove(stone.x, stone.y - 90, 7);
  garden.step(1 / 60);
  const moved = garden.getState().stones[0];
  assert.ok(moved.y < stone.y);
  assert.ok(moved.y > stone.y - 30, 'the stone lags behind the finger');
  garden.pointerUp(stone.x, stone.y - 90, 7);
  assert.equal(garden.getState().stones[0].cleared, true);
});

test('the thorn resists a quick pull and releases under steady upward tension', () => {
  const garden = createGarden(390, 844), thorn = garden.getState().thorn;
  assert.equal(garden.pointerDown(thorn.hitX, thorn.hitY, 2), true);
  garden.pointerMove(thorn.hitX, thorn.hitY - 70, 2);
  garden.step(.05);
  assert.equal(garden.getState().thorn.cleared, false);
  for (let i = 0; i < 65; i++) garden.step(1 / 60);
  assert.equal(garden.getState().thorn.cleared, true);
  assert.equal(garden.getState().thorn.loose, 1);
});

test('tap and native-button activation reach the same state without a forced gesture', () => {
  const tapGarden = createGarden(390, 844), buttonGarden = createGarden(390, 844);
  const stone = tapGarden.getState().stones[1];
  tapGarden.pointerDown(stone.x, stone.y);
  tapGarden.pointerUp(stone.x, stone.y);
  buttonGarden.activate(stone.id);
  assert.deepEqual(tapGarden.getState(), buttonGarden.getState());
});

test('reduced motion completes sowing without requiring an animation loop', () => {
  const garden = createGarden(390, 844, { reduced: true });
  finish(garden);
  garden.sow();
  assert.equal(garden.getState().phase, 'complete');
  assert.equal(garden.getState().progress, 1);
});

test('cancel and resize preserve progress and never leave a captured object behind', () => {
  const garden = createGarden(1180, 820);
  garden.activate('stone-1');
  const stone = garden.getState().stones[1];
  garden.pointerDown(stone.x, stone.y, 5);
  assert.equal(garden.pointerCancel(4), false);
  assert.equal(garden.pointerCancel(5), true);
  assert.equal(garden.getState().held, null);
  garden.resize(390, 844);
  assert.equal(garden.getState().cleared, 1);
  assert.equal(garden.getState().stones[0].cleared, true);
  for (const s of garden.getState().stones) assert.ok(s.x > 0 && s.x < 390);
  garden.reset();
  assert.equal(garden.getState().phase, 'clear');
  assert.equal(garden.getState().cleared, 0);
});


test('a reduced-motion finger can pull the thorn without waiting for animation frames', () => {
  const garden = createGarden(390, 844, { reduced: true });
  const thorn = garden.getState().thorn;
  garden.pointerDown(thorn.hitX, thorn.hitY, 8);
  garden.pointerMove(thorn.hitX, thorn.hitY - 65, 8);
  garden.pointerUp(thorn.hitX, thorn.hitY - 65, 8);
  assert.equal(garden.getState().thorn.cleared, true);
  assert.equal(garden.getState().thorn.loose, 1);
});
