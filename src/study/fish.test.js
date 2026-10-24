import test from 'node:test';
import assert from 'node:assert/strict';
import SpineFish, { buildPondMixFromCounts } from '../app/pond/SpineFish.js';
import { createPond, createMotionContext, createNativeFishPainter } from './fish.js';
import { createPond as createV1Pond } from './v1/fish.js';

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

function seededRandom(seed) {
  let state = seed;
  return () => { state = Math.imul(state, 1664525) + 1013904223 | 0; return (state >>> 0) / 4294967296; };
}

test('native scratch surfaces belong to each fish and release substantially oversized bounds', () => {
  const previousDocument = globalThis.document;
  const surfaces = [];
  globalThis.document = { createElement: () => { const c = canvas(); surfaces.push(c); return c; } };
  try {
    const paint = createNativeFishPainter(canvas().getContext('2d'));
    const makeFish = (extent) => ({
      head: { x: 0, y: 0, radius: 2 }, mouth: { x: extent, y: 0 }, parts: [],
      tail: { pieces: [] }, fins: { fins: [] }, draws: 0,
      draw() { this.draws++; },
    });
    const large = makeFish(1000), small = makeFish(20);
    paint(large); paint(small);
    assert.equal(surfaces.length, 2);
    assert.ok(surfaces[0].width > surfaces[1].width * 3, 'a small koi must not inherit the large koi blur allocation');
    const initialWidth = surfaces[0].width;
    large.mouth.x = 15;
    paint(large);
    assert.ok(surfaces[0].width < initialWidth * .6, 'a narrow pose releases the former orientation allocation');
    assert.equal(surfaces.length, 2, 'surface identity is reused');
    assert.equal(large.draws, 2);
    assert.equal(small.draws, 1);
  } finally { globalThis.document = previousDocument; }
});

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

test('disabled inputs and untouched interactive koi preserve frozen V1 motion exactly', () => {
  const previousDocument = globalThis.document, random = Math.random;
  globalThis.document = { createElement: () => canvas() };
  try {
    Math.random = seededRandom(93); const original = createV1Pond(1180, 820);
    Math.random = seededRandom(93); const disabled = createPond(1180, 820, { interactive: false });
    Math.random = seededRandom(93); const untouched = createPond(1180, 820, { interactive: true });
    disabled.setPointer({ x: 320, y: 420 });
    assert.equal(disabled.feed({ x: 320, y: 420 }), false);
    assert.equal(disabled.food.length, 0);
    for (let tick = 0; tick < 60; tick++) {
      for (const pond of [original, disabled, untouched]) {
        Math.random = seededRandom(1600 + tick);
        pond.step({ paintColour: false });
      }
      assert.deepEqual(scalarState(disabled.fish), scalarState(original.fish));
      assert.deepEqual(scalarState(untouched.fish), scalarState(original.fish));
    }
  } finally { globalThis.document = previousDocument; Math.random = random; }
});

test('sizeScale configures native constructor mass and radius while retaining the original update/draw pair', () => {
  const previousDocument = globalThis.document, random = Math.random;
  globalThis.document = { createElement: () => canvas() };
  try {
    Math.random = seededRandom(93); const original = createPond(1180, 820);
    Math.random = seededRandom(93); const full = createPond(1180, 820, { sizeScale: 1.05 });
    full.fish.forEach((f, i) => {
      assert.ok(Math.abs(f.mass / original.fish[i].mass - (1.05 / .6) ** 2) < 1e-10);
      assert.ok(f.head.radius > original.fish[i].head.radius);
      let updates = 0, draws = 0;
      const update = f.update, draw = f.draw;
      f.update = function (...args) { updates++; return update.apply(this, args); };
      f.draw = function (...args) { draws++; return draw.apply(this, args); };
      full.step({ paintColour: false });
      assert.equal(updates, 1);
      assert.equal(draws, 1);
      f.update = update; f.draw = draw;
    });
  } finally { globalThis.document = previousDocument; Math.random = random; }
});

test('touch uses the original curiosity and flee responses; clearing touch restores inactive input', () => {
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: () => canvas() };
  const update = SpineFish.prototype.update;
  const cursors = [];
  SpineFish.prototype.update = function (w, h, cursor, env) { cursors.push(cursor); return update.call(this, w, h, cursor, env); };
  try {
    const pond = createPond(1180, 820, { interactive: true });
    const curious = pond.fish.find((f) => f.variety.personality === 'curious');
    const approach = { x: curious.mouth.x + 200, y: curious.mouth.y };
    pond.setPointer(approach);
    pond.step({ paintColour: false });
    assert.equal(curious.target.x, approach.x);
    assert.equal(curious.target.y, approach.y);
    assert.ok(curious.energy > .5);
    assert.ok(curious.targetDepth <= .2);
    const shy = pond.fish.find((f) => f.variety.personality === 'normal');
    const mouth = { x: shy.mouth.x, y: shy.mouth.y };
    pond.setPointer({ x: mouth.x - 30, y: mouth.y });
    pond.step({ paintColour: false });
    assert.equal(shy.fleeCooldown, 89, 'the original normal koi flee duration is retained');
    assert.ok(shy.target.x > mouth.x, 'the target is away from the finger');
    pond.setPointer(null);
    pond.step({ paintColour: false });
    assert.ok(cursors.slice(-3).every((cursor) => cursor.x < -1000));
    pond.setPointer({ x: NaN, y: 0 });
    pond.step({ paintColour: false });
    assert.ok(cursors.slice(-3).every((cursor) => cursor.x < -1000), 'malformed input cannot leave a stuck touch');
  } finally { SpineFish.prototype.update = update; globalThis.document = previousDocument; }
});

test('a fed pinch is noticed and eaten through the original model; drawing never advances food', () => {
  const previousDocument = globalThis.document, random = Math.random;
  globalThis.document = { createElement: () => canvas() };
  try {
    const pond = createPond(1180, 820, { interactive: true });
    const curious = pond.fish.find((f) => f.variety.personality === 'curious');
    Math.random = () => 0; // All three pellets land at the chosen spot and are noticed.
    const nearby = { x: curious.mouth.x + 70, y: curious.mouth.y };
    pond.setPointer(nearby);
    assert.equal(pond.feed(nearby), true);
    assert.equal(pond.food.length, 3);
    pond.step({ paintColour: false });
    assert.ok(curious.feedTarget, 'the original food environment selects a noticed pellet');
    assert.equal(curious.targetDepth, 0);
    assert.equal(curious.fleeCooldown, 0, 'the hand that feeds does not frighten koi from their food');
    const before = scalarState(pond.fish), pellets = pond.food;
    const ctx = canvas().getContext('2d');
    for (const media of [{ ink: 1 }, { ink: 1, wash: 1 }, { colour: 1 }]) pond.draw(ctx, media);
    assert.deepEqual(scalarState(pond.fish), before);
    assert.deepEqual(pond.food, pellets, 'dial changes do not age, move or consume food');
    const atMouth = { x: curious.mouth.x, y: curious.mouth.y };
    pond.feed(atMouth);
    pond.step({ paintColour: false });
    assert.ok(curious.fedCooldown > 0, 'the original fish eats and enters its resting cooldown');
    assert.ok(pond.food.some((p) => p.eaten));
    pond.step({ paintColour: false });
    assert.ok(pond.food.every((p) => !p.eaten), 'eaten food is removed by the original bowl');
  } finally { globalThis.document = previousDocument; Math.random = random; }
});

test('feeding is bounded, validates coordinates, and exposes immutable snapshots', () => {
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: () => canvas() };
  try {
    const pond = createPond(390, 844, { interactive: true, reduced: true });
    assert.equal(pond.feed({ x: -1, y: 400 }), false);
    assert.equal(pond.feed({ x: 200, y: Infinity }), false);
    for (let i = 0; i < 20; i++) pond.feed({ x: 200, y: 400 });
    const food = pond.food;
    assert.equal(food.length, 36, 'the original bowl cap bounds repeated feeding');
    assert.ok(Object.isFrozen(food) && food.every(Object.isFrozen));
    assert.throws(() => { food[0].x = 0; }, TypeError);
    const poseBefore = scalarState(pond.fish);
    pond.draw(canvas().getContext('2d'), { ink: 1, wash: 1 });
    pond.step();
    assert.deepEqual(scalarState(pond.fish), poseBefore, 'reduced motion can show food without animating koi');
    assert.deepEqual(pond.food, food);
  } finally { globalThis.document = previousDocument; }
});
