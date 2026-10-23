import test from 'node:test';
import assert from 'node:assert/strict';
import SpineFish, { buildPondMixFromCounts } from '../app/pond/SpineFish.js';
import { createPond, createMotionContext } from './fish.js';

// These invariants concern simulation ownership, rather than browser pixels.
// The canvas stand-in permits the unmodified original renderer to run.
function canvas() {
  const context = new Proxy({ globalAlpha: 1, filter: 'none' }, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({ addColorStop() {} });
      return () => {};
    },
  });
  return { width: 0, height: 0, getContext: () => context };
}

function pose(fish) {
  const xy = (p) => [p.x, p.y, p.radian];
  return fish.map((f) => ({
    head: xy(f.head), body: f.parts.map(xy),
    fins: f.fins.fins.map((fin) => fin.pieces.map((row) => row.map(xy))),
    tail: f.tail.pieces.map((row) => row.map(xy)),
  }));
}

function scalarState(fish) {
  const seen = new WeakSet(), entries = [];
  const visit = (value, path) => {
    if (typeof value === 'function') return;
    if (value === null || typeof value !== 'object') { entries.push([path, value]); return; }
    if (seen.has(value)) return;
    seen.add(value);
    for (const key of Object.keys(value)) visit(value[key], `${path}.${key}`);
  };
  visit(fish, 'fish');
  return entries;
}

test('each tick calls the original update and original draw once; all media reuse that pose', () => {
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: () => canvas() };
  const update = SpineFish.prototype.update, draw = SpineFish.prototype.draw;
  let updates = 0, draws = 0;
  SpineFish.prototype.update = function (...args) { updates++; return update.apply(this, args); };
  SpineFish.prototype.draw = function (...args) { draws++; return draw.apply(this, args); };
  try {
    const pond = createPond(1180, 820);
    assert.equal(pond.fish.length, 3);
    assert.ok(updates >= 3 * 50 && updates <= 3 * 90, 'prime a settled original pose before exposing it');
    assert.equal(draws, updates, 'settling also preserves the original update/draw pair');
    const initialCalls = updates;
    assert.ok(pond.fish.every((f) => f.parts.length > 4));
    const initial = pose(pond.fish);
    const ctx = canvas().getContext('2d');
    for (const media of [{ ink: 1 }, { ink: 1, wash: 1 }, { colour: 1 }, { ink: .4, wash: .4, colour: .6, night: true }]) pond.draw(ctx, media);
    assert.deepEqual(pose(pond.fish), initial, 'changing dial or palette must not advance any joint');
    assert.equal(draws, initialCalls, 'Colour uses the original cached frame');
    pond.step();
    assert.equal(updates, initialCalls + 3);
    assert.equal(draws, initialCalls + 3);
    assert.notDeepEqual(pose(pond.fish), initial, 'the original moving skeleton must advance');
    const visiblePose = pose(pond.fish);
    pond.step({ paintColour: false });
    assert.equal(updates, initialCalls + 6);
    assert.equal(draws, initialCalls + 6, 'hidden Colour still advances the original fins and tail exactly once');
    assert.notDeepEqual(pose(pond.fish), visiblePose);
    const frozenState = scalarState(pond.fish);
    const methods = pond.fish.map((f) => [f.fins.act, f.tail.act, Object.hasOwn(f.fins, 'act'), Object.hasOwn(f.tail, 'act')]);
    pond.draw(ctx, { colour: 1 });
    assert.equal(updates, initialCalls + 6, 'a stale Colour refresh must not update the simulation');
    assert.equal(draws, initialCalls + 9, 'refresh uses the unchanged original renderer once');
    assert.deepEqual(scalarState(pond.fish), frozenState, 'refresh must preserve every scalar pose/dynamics field, including all fin offsets/radians');
    pond.fish.forEach((f, i) => assert.deepEqual([f.fins.act, f.tail.act, Object.hasOwn(f.fins, 'act'), Object.hasOwn(f.tail, 'act')], methods[i], 'animation hooks and own-property status must be restored'));
    pond.draw(ctx, { colour: 1 });
    assert.equal(draws, initialCalls + 9, 'the read-only refreshed frame is cached');
  } finally {
    SpineFish.prototype.update = update;
    SpineFish.prototype.draw = draw;
    globalThis.document = previousDocument;
  }
});

test('reduced motion retains a complete living pose without stepping on dial changes', () => {
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: () => canvas() };
  try {
    const pond = createPond(390, 844, { reduced: true });
    const initial = pose(pond.fish);
    const ctx = canvas().getContext('2d');
    for (let i = 0; i < 3; i++) { pond.step(); pond.draw(ctx, { ink: 1, wash: 1 }); }
    assert.deepEqual(pose(pond.fish), initial);
    assert.ok(initial.every((f) => f.head.every(Number.isFinite)));
  } finally {
    globalThis.document = previousDocument;
  }
});

test('the no-raster context preserves every original motion field for 120 ticks', () => {
  const random = Math.random;
  function seeded(seed) {
    let state = seed;
    return () => { state = Math.imul(state, 1664525) + 1013904223 | 0; return (state >>> 0) / 4294967296; };
  }
  try {
    const variety = { ...buildPondMixFromCounts({ kohaku: 1 })[0], sizeScale: .6 };
    Math.random = seeded(800);
    const painted = new SpineFish(1180, 820, variety);
    Math.random = seeded(800);
    const hidden = new SpineFish(1180, 820, variety);
    const nativeContext = canvas().getContext('2d'), hiddenContext = createMotionContext();
    for (let tick = 0; tick < 120; tick++) {
      Math.random = seeded(1000 + tick);
      painted.update(1180, 820, { x: -9999, y: -9999 });
      painted.draw(nativeContext);
      Math.random = seeded(1000 + tick);
      hidden.update(1180, 820, { x: -9999, y: -9999 });
      hidden.draw(hiddenContext);
      assert.deepEqual(scalarState([hidden]), scalarState([painted]), `full pose/dynamics equivalence at tick ${tick}`);
    }
  } finally { Math.random = random; }
});
