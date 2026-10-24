import { stroke, wash, rng } from './brush.js';
import { palette } from './landscape.js';

// A small study of the original field's capped, lagging stone movement and
// steady-tension roots, adapted from origin/main src/flourish/abide/field.js.
// The thistle's toothed leaves / exposed taproot follow weeds.js in that same
// directory, redrawn here entirely with this study's shared brush.
// No Matter runtime, punishment, scattered seeds or saved practice is imported.
// Letter centre-lines are a five-glyph EMS Allure subset from origin/main
// src/flourish/lib/allure.js: Sheldon B. Michaels, derived from Allura by
// Rob Leuschke; SVG conversion Windell H. Oskay (hersheytext, MIT).
// Font data is SIL OFL 1.1; see vendor/EMS-Allure-OFL.txt. Growth is arclength
// driven, inspired by the same repository's src/flourish/lib/vine.js.
const GLYPHS = {"R":[639,[[498,573,419,564,356,501,340,438,293,334,208,198,154,85,142,35,161,3,198,19,220,38,227,44],[82,369,28,419,22,495,54,561,161,636,274,671,406,696,558,693,671,680,772,617,813,536,788,447,677,365,554,321,432,284,334,280,202,293,198,315,312,230,381,117,498,-22,627,-117,762,-176,882,-176,945,-139,970,-101,976,-66]]],"o":[391,[[195,337,142,365,66,315,-6,233,-41,161,-57,76,13,9,101,41,183,110,230,208,239,246,239,284,220,284],[167,158,183,101,214,72,255,76,296,110,359,183]]],"t":[290,[[-32,183,19,224,54,261,110,337,183,457,217,510,183,517,9,151,-6,66,19,22,98,28,192,110,258,183],[54,346,258,356]]],"e":[346,[[66,170,148,211,217,249,252,306,239,350,180,356,63,287,16,252,-35,192,-66,139,-72,88,-50,44,32,9,170,44,214,82,277,135,315,183]]],"d":[381,[[328,312,302,356,258,369,151,334,47,265,-38,176,-63,107,-57,50,13,16,79,63,176,148,277,252,387,334,532,457,668,592,693,668,690,709,639,721,561,684,510,633,441,523,387,425,293,217,246,66,233,-44,258,-98,302,-113,340,-101]]]};
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const ellipse = (x, y, rx, ry, n = 28) => Array.from({ length: n }, (_, i) => [x + Math.cos(i / n * TAU) * rx, y + Math.sin(i / n * TAU) * ry]);
const curve = (a, b, c, n = 30) => Array.from({ length: n }, (_, i) => {
  const t = i / (n - 1), u = 1 - t;
  return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]];
});
function mark(ctx, points, colour, width, seed, alpha = .7, dry = .45) {
  stroke(ctx, points, { colour, width, seed, alpha, dry });
}
function fill(ctx, points, colour, seed, alpha = .4) {
  wash(ctx, points, { colour, seed, alpha, layers: 18, softness: .85 });
}
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return c;
}
function leaf(ctx, x, y, angle, length, breadth, p, style, seed, thistle = false) {
  const points = [], back = [], lobes = thistle ? 8 : 16;
  for (let i = 0; i <= lobes; i++) {
    const t = i / lobes;
    const w = Math.sin(Math.PI * t) * breadth * (thistle && i % 2 ? 1.5 : 1);
    const dx = Math.cos(angle) * length * t, dy = Math.sin(angle) * length * t;
    points.push([x + dx - Math.sin(angle) * w, y + dy + Math.cos(angle) * w]);
    back.push([x + dx + Math.sin(angle) * w * .8, y + dy - Math.cos(angle) * w * .8]);
  }
  const outline = points.concat(back.reverse());
  if (style !== 'ink') fill(ctx, outline, p.leaf, seed, style === 'colour' ? .68 : .36);
  mark(ctx, outline, p.ink, .9, seed, .66);
  mark(ctx, [[x, y], [x + Math.cos(angle) * length, y + Math.sin(angle) * length]], p.ink, .65, seed + 70, .45, .6);
}
function plantArt(s, index, p, style) {
  const c = canvas(122 * s, 212 * s), ctx = c.getContext('2d');
  ctx.scale(s, s); ctx.translate(61, 198);
  const random = rng(701 + index * 83), h = [35, 59, 91, 117, 144, 74][index];
  const stem = curve([0, 0], [-13 + index * 4, -h * .6], [Math.sin(index * 2.1) * 12, -h]);
  mark(ctx, stem, p.ink, index === 4 ? 1.8 : 1.4, 70 + index, .78);
  const count = 2 + index % 4;
  for (let j = 0; j < count; j++) {
    const at = stem[Math.floor((.28 + j / count * .58) * (stem.length - 1))], side = j % 2 ? 1 : -1;
    leaf(ctx, at[0], at[1], -Math.PI / 2 + side * (.65 + random() * .45), 15 + random() * 16, 4 + random() * 3, p, style, 300 + index * 50 + j);
  }
  if (index === 3 || index === 4) {
    const top = stem.at(-1);
    for (let k = 0; k < 5; k++) {
      const end = [top[0] + (k - 2) * 6, top[1] + Math.abs(k - 2) * 2 - 15];
      mark(ctx, curve(top, [end[0] + 1, end[1] - 7], end), p.ink, .85, 550 + k, .6);
      if (style !== 'ink') fill(ctx, ellipse(end[0], end[1], 3, 5, 12), p.clay, 680 + k, .55);
      mark(ctx, ellipse(end[0], end[1], 2.6, 4.2, 12).slice(0, 9), p.ink, .9, 600 + k, .64);
    }
  }
  return c;
}
function stoneArt(rx, ry, p, style, index) {
  const pad = 7, c = canvas(rx * 2 + pad * 2, ry * 2 + pad * 2), ctx = c.getContext('2d');
  const random = rng(917 + index * 71), x = rx + pad, y = ry + pad;
  const pts = ellipse(x, y, rx, ry, 18).map(([a, b]) => [a + (random() - .5) * rx * .14, b + (random() - .5) * ry * .12]);
  if (style !== 'ink') fill(ctx, pts, p.stone, 919 + index, style === 'colour' ? .72 : .45);
  mark(ctx, pts.slice(0, 16), p.ink, 1.5, 921 + index, .8, .5);
  mark(ctx, curve([x - rx * .72, y - ry * .08], [x - rx * .2, y - ry * .66], [x + rx * .56, y - ry * .34]), p.ink, .9, 930 + index, .28, .65);
  for (let j = 0; j < 3; j++) mark(ctx, [[x + rx * (-.35 + j * .27), y + ry * .38], [x + rx * (-.48 + j * .28), y + ry * .67]], p.ink, .6, 950 + j + index, .25, .75);
  return c;
}
function thornArt(s, p, style) {
  const c = canvas(132 * s, 154 * s), ctx = c.getContext('2d');
  ctx.scale(s, s); ctx.translate(66, 136);
  const stem = curve([0, 0], [8, -50], [2, -92]);
  mark(ctx, stem, p.ink, 2.2, 1201, .84, .4);
  for (let j = 0; j < 6; j++) {
    const side = j % 2 ? 1 : -1, y = -10 - Math.floor(j / 2) * 20;
    leaf(ctx, 2, y, -Math.PI / 2 + side * 1.05, 27 + (j % 3) * 4, 6.5, p, style, 1210 + j, true);
  }
  if (style !== 'ink') fill(ctx, ellipse(2, -91, 8, 10, 18), p.clay, 1224, style === 'colour' ? .7 : .4);
  mark(ctx, ellipse(2, -91, 7.5, 10, 18).slice(1, 15), p.ink, 1.2, 1230, .8);
  for (let j = 0; j < 6; j++) mark(ctx, [[-4 + j * 2.3, -94], [-5 + j * 2.4, -109 + Math.abs(j - 2.5) * 2]], p.ink, .85, 1240 + j, .7, .55);
  return c;
}
function smooth(raw) {
  if (raw.length < 3) return raw;
  const points = [raw[0]];
  for (let i = 0; i < raw.length - 1; i++) {
    const a = raw[Math.max(0, i - 1)], b = raw[i], c = raw[i + 1], d = raw[Math.min(raw.length - 1, i + 2)];
    const count = Math.max(3, Math.ceil(distance(b, c) / 30));
    for (let k = 1; k <= count; k++) {
      const t = k / count, t2 = t * t, t3 = t2 * t;
      points.push([.5 * ((2 * b[0]) + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), .5 * ((2 * b[1]) + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]);
    }
  }
  return points;
}
function path(points) {
  let total = 0;
  const lengths = points.map((p, i) => { if (i) total += distance(p, points[i - 1]); return total; });
  return { points, lengths, length: total };
}
function portion(route, length) {
  if (length <= 0) return [];
  if (length >= route.length) return route.points;
  const index = route.lengths.findIndex((n) => n >= length);
  const a = route.points[index - 1], b = route.points[index], t = (length - route.lengths[index - 1]) / (route.lengths[index] - route.lengths[index - 1] || 1);
  return [...route.points.slice(0, index), [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]];
}
function rootedPaths(box, seed) {
  let advance = 0;
  const raw = [];
  for (const letter of 'Rooted') {
    const glyph = GLYPHS[letter];
    for (const stroke of glyph[1]) raw.push(Array.from({ length: stroke.length / 2 }, (_, i) => [advance + stroke[i * 2], -stroke[i * 2 + 1]]));
    advance += glyph[0];
  }
  const all = raw.flat(), left = Math.min(...all.map(p => p[0])), top = Math.min(...all.map(p => p[1]));
  const width = Math.max(...all.map(p => p[0])) - left, height = Math.max(...all.map(p => p[1])) - top;
  const scale = Math.min(box.w / width, box.h / height), ox = box.x + (box.w - width * scale) / 2 - left * scale, oy = box.y + (box.h - height * scale) / 2 - top * scale;
  const routes = raw.map(points => path(smooth(points).map(([x, y]) => [ox + x * scale, oy + y * scale])));
  // The shoot rises from the seed before it begins the first letter. This is
  // a physical connected stem, not a text reveal or a new font at completion.
  const first = routes[0].points[0];
  routes.unshift(path(curve([seed.x, seed.y], [box.x - box.w * .14, seed.y - box.h * .34], first, 50)));
  let total = 0;
  for (const route of routes) { route.start = total; total += route.length; }
  return { routes, length: total, box };
}

export function createGarden(width, height, options = {}) {
  let W = Math.max(1, width), H = Math.max(1, height), scale, phase = 'clear', elapsed = 0, growth = 0;
  let reduced = !!options.reduced, held = null, layers = new Map(), geometry, vine;
  const onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
  const onPrompt = typeof options.onPrompt === 'function' ? options.onPrompt : () => {};
  const stones = [
    { id: 'stone-1', label: 'I wish I’d…', prompt: 'Something I wish I’d done…', fx: .18, ry: 25 },
    { id: 'stone-2', label: 'I can let go…', prompt: 'Something I can let go of…', fx: .40, ry: 29 },
    { id: 'stone-3', label: 'Room for…', prompt: 'Something I can make room for…', fx: .60, ry: 23 },
  ].map((stone, i) => ({ ...stone, index: i, cleared: false, lift: 0, x: 0, y: 0, vx: 0, vy: 0 }));
  const thorn = { id: 'thorn', label: 'A tangle…', prompt: 'Something I don’t need to carry…', cleared: false, loose: 0, pull: 0, x: 0, y: 0 };
  function layout() {
    scale = Math.max(.82, Math.min(1.35, W / 900, H / 750));
    const soilY = H * .73;
    geometry = {
      soilY,
      trellis: { x: W * .19, y: H * .30, w: W * .62, h: H * .25 },
      seed: { x: W * .50, y: soilY + 6 * scale },
      wall: { x: W * .035, y: H * .85, w: W * .29, h: 34 * scale },
      basket: { x: W * .78, y: H * .86, w: 64 * scale, h: 31 * scale },
      preview: { x: W * .025, y: H * .285, w: W * .95, h: H * .63, focusX: W * .50, focusY: H * .60 },
    };
    for (const s of stones) {
      s.rx = Math.min(53 * scale, W * .105); s.radiusY = s.ry * scale;
      s.homeX = W * s.fx; s.homeY = soilY - s.radiusY + (s.index === 1 ? -7 : 2) * scale;
      s.x = s.cleared ? geometry.wall.x + geometry.wall.w * (.16 + s.index * .29) : s.homeX;
      s.y = s.cleared ? geometry.wall.y + 9 * scale - s.index % 2 * 9 * scale : s.homeY;
      s.vx = 0; s.vy = 0;
    }
    thorn.homeX = W * .81; thorn.homeY = soilY;
    thorn.x = thorn.cleared ? geometry.basket.x + geometry.basket.w * .5 : thorn.homeX;
    thorn.y = thorn.cleared ? geometry.basket.y + geometry.basket.h * .3 : thorn.homeY;
    thorn.height = 109 * scale;
    vine = rootedPaths({ x: W * .23, y: H * .315, w: W * .54, h: H * .20 }, geometry.seed);
    layers = new Map();
  }
  function getState() {
    const cleared = stones.filter(s => s.cleared).length + Number(thorn.cleared);
    return {
      phase, word: 'Rooted', cleared, total: 4, progress: growth,
      held: held?.object.id || null,
      stones: stones.map(s => ({ id: s.id, x: s.x, y: s.y, rx: s.rx, ry: s.radiusY, label: s.label, prompt: s.prompt, cleared: s.cleared })),
      thorn: { id: thorn.id, x: thorn.x, y: thorn.y, hitX: thorn.x, hitY: thorn.y - thorn.height * .53 - thorn.pull * 36 * scale, r: Math.max(28, 36 * scale), label: thorn.label, prompt: thorn.prompt, cleared: thorn.cleared, loose: thorn.loose },
      ...geometry,
    };
  }
  function changed() { onChange(getState()); }
  function clear(object) {
    if (object.cleared) return false;
    object.cleared = true;
    if (reduced) {
      if (object === thorn) { object.x = geometry.basket.x + geometry.basket.w * .5; object.y = geometry.basket.y + geometry.basket.h * .3; }
      else { object.x = geometry.wall.x + geometry.wall.w * (.16 + object.index * .29); object.y = geometry.wall.y + 9 * scale - object.index % 2 * 9 * scale; }
    }
    if (object === thorn) { thorn.loose = 1; thorn.pull = 1; }
    const count = stones.filter(s => s.cleared).length + Number(thorn.cleared);
    if (count === 4) phase = 'ready';
    changed(); return true;
  }
  function activate(id) {
    if (phase !== 'clear') return false;
    const object = id === thorn.id ? thorn : stones.find(s => s.id === id);
    if (!object || object.cleared) return false;
    onPrompt(object.prompt);
    held = null;
    return clear(object);
  }
  function pointerDown(x, y, pointerId = 1) {
    if (phase !== 'clear' || held) return false;
    let object = [...stones].reverse().find(s => !s.cleared && Math.pow((x - s.x) / Math.max(28, s.rx + 8), 2) + Math.pow((y - s.y) / Math.max(25, s.radiusY + 9), 2) < 1);
    if (!object && !thorn.cleared) {
      const state = getState().thorn;
      if (Math.hypot((x - state.hitX) * .8, (y - state.hitY) * .75) < state.r + 14) object = thorn;
    }
    if (!object) return false;
    held = { object, pointerId, x0: x, y0: y, x, y, offX: x - object.x, offY: y - object.y, moved: 0, time: 0, maxLift: 0 };
    onPrompt(object.prompt); changed(); return true;
  }
  function pointerMove(x, y, pointerId = 1) {
    if (!held || held.pointerId !== pointerId) return false;
    held.x = clamp(x, 8, W - 8); held.y = clamp(y, H * .16, H * .96);
    held.moved = Math.max(held.moved, Math.hypot(x - held.x0, y - held.y0));
    held.maxLift = Math.max(held.maxLift, held.y0 - y);
    return true;
  }
  function pointerUp(x, y, pointerId = 1) {
    if (!held || held.pointerId !== pointerId) return false;
    pointerMove(x, y, pointerId);
    const grab = held; held = null;
    // Tapping and keyboard activation reach exactly the same final state. A
    // child is never forced to make a precise physical gesture to continue.
    if (grab.moved < 9) { clear(grab.object); return true; }
    if (grab.object !== thorn && (grab.maxLift >= 40 * scale || grab.object.x < geometry.wall.x + geometry.wall.w)) clear(grab.object);
    else if (grab.object === thorn && (reduced || thorn.loose >= .88) && grab.maxLift >= 32 * scale) clear(thorn);
    changed(); return true;
  }
  function pointerCancel(pointerId = 1) {
    if (!held || held.pointerId !== pointerId) return false;
    held = null; changed(); return true;
  }
  function sow() {
    if (phase !== 'ready') return false;
    phase = reduced ? 'complete' : 'sowing'; elapsed = 0; growth = reduced ? 1 : 0;
    changed(); return true;
  }
  function step(dt = 1 / 60) {
    dt = clamp(Number(dt) || 0, 0, .1);
    let notify = false;
    if (held) held.time += dt;
    for (const s of stones) {
      if (s.cleared) {
        const tx = geometry.wall.x + geometry.wall.w * (.16 + s.index * .29), ty = geometry.wall.y + 9 * scale - s.index % 2 * 9 * scale;
        const k = reduced ? 1 : 1 - Math.exp(-dt * 5);
        s.x = lerp(s.x, tx, k); s.y = lerp(s.y, ty, k);
      } else if (held?.object === s) {
        // Capped velocity and a lagging centre of mass preserve the original
        // feeling of weight without importing a whole collision simulation.
        const dx = held.x - held.offX - s.x, dy = Math.min(held.y - held.offY, s.homeY) - s.y;
        const max = 360 * scale * dt, k = 1 - Math.exp(-dt * 7);
        s.x += clamp(dx * k, -max, max); s.y += clamp(dy * k, -max, max);
      } else {
        const k = reduced ? 1 : 1 - Math.exp(-dt * 7);
        s.x = lerp(s.x, s.homeX, k); s.y = lerp(s.y, s.homeY, k);
      }
    }
    if (thorn.cleared) {
      const k = reduced ? 1 : 1 - Math.exp(-dt * 4);
      thorn.x = lerp(thorn.x, geometry.basket.x + geometry.basket.w * .5, k);
      thorn.y = lerp(thorn.y, geometry.basket.y + geometry.basket.h * .3, k);
    } else if (held?.object === thorn) {
      const lift = clamp((held.y0 - held.y) / (55 * scale));
      if (lift > .15) thorn.loose = Math.min(1, thorn.loose + dt / .85);
      thorn.pull = Math.min(lift, .22 + .78 * thorn.loose);
      if (thorn.loose >= 1 && lift >= .95) { clear(thorn); held = null; }
    } else {
      thorn.pull = Math.max(0, thorn.pull - dt * 3);
      thorn.loose = Math.max(0, thorn.loose - dt * .35);
    }
    if (phase === 'sowing' || phase === 'growing') {
      if (reduced) { phase = 'complete'; growth = 1; notify = true; }
      else {
        elapsed += dt;
        if (phase === 'sowing' && elapsed >= .72) { phase = 'growing'; notify = true; }
        growth = clamp((elapsed - .72) / 10.5);
        if (growth >= 1) { phase = 'complete'; notify = true; }
      }
    }
    if (notify) changed();
    return getState();
  }
  function background(p, style) {
    const c = canvas(W, H), ctx = c.getContext('2d'), g = geometry;
    const base = g.soilY;
    // Broad beds and open soil, not a boxed activity sitting above the world.
    if (style !== 'ink') {
      fill(ctx, [[W * .025, base + 20 * scale], [W * .13, base - 11 * scale], [W * .47, base + 5 * scale], [W * .69, base - 7 * scale], [W * .97, base + 13 * scale], [W, H * .92], [W * .04, H * .90]], p.soil, 1401, style === 'colour' ? .47 : .23);
      fill(ctx, [[W * .05, base - 1], [W * .33, base + 6], [W * .37, base + 30 * scale], [W * .07, base + 24 * scale]], p.leaf, 1403, style === 'colour' ? .20 : .11);
    }
    mark(ctx, curve([W * .025, base + 11 * scale], [W * .36, base - 6 * scale], [W * .97, base + 8 * scale]), p.ink, 1.25 * scale, 1408, .47, .7);
    for (let i = 0; i < 4; i++) mark(ctx, curve([W * .07, base + (20 + i * 21) * scale], [W * .47, base + (25 + i * 20) * scale], [W * .92, base + (16 + i * 21) * scale]), p.ink, .7 * scale, 1410 + i, .16, .8);
    const t = g.trellis;
    for (const side of [0, 1]) mark(ctx, [[t.x + side * t.w, g.soilY - 4 * scale], [t.x + side * t.w + 2 * scale, t.y]], p.ink, 2.2 * scale, 1500 + side, .58, .55);
    for (let i = 1; i <= 3; i++) mark(ctx, curve([t.x - 7 * scale, t.y + t.h * i / 4], [t.x + t.w * .4, t.y + t.h * i / 4 + 4 * scale], [t.x + t.w + 7 * scale, t.y + t.h * i / 4 - 2 * scale]), p.ink, 1.15 * scale, 1510 + i, .28, .65);
    // A shallow basket, open to the hand; no target precision is required.
    const b = g.basket;
    if (style !== 'ink') fill(ctx, [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w * .86, b.y + b.h], [b.x + b.w * .15, b.y + b.h]], p.clay, 1600, .35);
    mark(ctx, [[b.x, b.y], [b.x + b.w * .15, b.y + b.h], [b.x + b.w * .86, b.y + b.h], [b.x + b.w, b.y]], p.ink, 1.3 * scale, 1601, .65);
    mark(ctx, ellipse(b.x + b.w / 2, b.y, b.w / 2, b.h * .2).slice(0, 24), p.ink, 1.25 * scale, 1602, .7);
    for (let i = 1; i <= 3; i++) mark(ctx, [[b.x + b.w * .1, b.y + b.h * i / 4], [b.x + b.w * .9, b.y + b.h * i / 4]], p.ink, .7 * scale, 1603 + i, .3, .65);
    return c;
  }
  function art(style, light, pigment) {
    const key = `${style}:${light}:${pigment}`;
    if (layers.has(key)) return layers.get(key);
    const p = palette(light, style, { pigment });
    const value = { p, word: canvas(W * .84, H * .53), wordProgress: -1, ground: background(p, style), plants: Array.from({ length: 6 }, (_, i) => plantArt(scale, i, p, style)), stones: stones.map(s => stoneArt(s.rx, s.radiusY, p, style, s.index)), thorn: thornArt(scale, p, style) };
    if (layers.size >= 6) layers.delete(layers.keys().next().value);
    layers.set(key, value); return value;
  }
  function drawVine(ctx, p, style) {
    if (growth <= 0) return;
    const length = vine.length * growth;
    for (let i = 0; i < vine.routes.length; i++) {
      const route = vine.routes[i];
      if (length <= route.start) break;
      const pts = portion(route, length - route.start);
      if (pts.length > 1) {
        if (style !== 'ink') mark(ctx, pts, p.leaf, 4.6 * scale, 1900 + i, style === 'colour' ? .62 : .32, .25);
        mark(ctx, pts, p.ink, 2.15 * scale, 2000 + i, .85, .38);
      }
    }
    // Leaves remain outside the letter counters, so growth never changes the
    // reading of the word. Their positions and brush seeds do not flicker.
    const shoot = vine.routes[0];
    for (let i = 0; i < 5; i++) {
      const at = shoot.points[Math.floor((.17 + i * .13) * (shoot.points.length - 1))];
      const threshold = (shoot.start + shoot.length * (.17 + i * .13)) / vine.length + .06;
      const size = clamp((growth - threshold) * 6);
      if (size > 0) leaf(ctx, at[0], at[1], -1.4 + (i % 2 ? .7 : -.65), 20 * scale * size, 5 * scale * size, p, style, 2110 + i);
    }
  }
  function draw(ctx, paint = {}) {
    if (!ctx) return;
    reduced = paint.reduced === undefined ? reduced : !!paint.reduced;
    if (reduced && (phase === 'sowing' || phase === 'growing')) { phase = 'complete'; growth = 1; changed(); }
    const light = paint.light || (paint.night ? 'night' : options.light || 'day');
    const styles = ['ink', 'wash', 'colour'], weights = [Math.max(0, (paint.ink || 0) - (paint.wash || 0)), paint.wash || 0, paint.colour || 0];
    if (!weights.some(v => v > 0)) weights[0] = 1;
    for (let i = 0; i < styles.length; i++) {
      if (weights[i] < .001) continue;
      const style = styles[i], a = art(style, light, paint.pigment !== false), p = a.p;
      ctx.save(); ctx.globalAlpha *= weights[i] * (paint.opacity ?? 1);
      ctx.drawImage(a.ground, 0, 0);
      const plantXs = [.065, .15, .235, .765, .85, .935];
      for (let j = 0; j < 6; j++) {
        const x = W * plantXs[j], y = H * .762 + [3, -5, 9, -1, -11, 6][j] * scale;
        const sway = reduced || !paint.wind ? 0 : paint.wind.sway(x, .014, j * .23);
        ctx.save(); ctx.translate(x, y); ctx.rotate(sway); ctx.drawImage(a.plants[j], -a.plants[j].width / 2, -a.plants[j].height); ctx.restore();
      }
      // Contact marks stay on the soil while the heavy body moves upward.
      for (const s of stones) {
        if (!s.cleared) mark(ctx, curve([s.homeX - s.rx * .75, s.homeY + s.radiusY], [s.homeX, s.homeY + s.radiusY + 4], [s.homeX + s.rx * .75, s.homeY + s.radiusY]), p.ink, 1.7 * scale, 1700 + s.index, .15, .7);
        ctx.drawImage(a.stones[s.index], s.x - a.stones[s.index].width / 2, s.y - a.stones[s.index].height / 2);
      }
      const lift = thorn.cleared ? 0 : thorn.pull * 36 * scale;
      const lean = held?.object === thorn ? clamp((held.x - held.x0) / (85 * scale), -.5, .5) : thorn.cleared ? -.65 : 0;
      ctx.save(); ctx.translate(thorn.x, thorn.y - lift); ctx.rotate(lean);
      if (thorn.pull > .08 || thorn.cleared) {
        const reveal = thorn.cleared ? 1 : thorn.pull;
        mark(ctx, curve([0, 0], [5 * scale, 15 * scale * reveal], [-3 * scale, 30 * scale * reveal]), p.ink, 1.3 * scale, 1800, .72);
        for (let j = 0; j < 3; j++) mark(ctx, curve([2 * scale, 7 * scale * j * reveal], [(j % 2 ? 1 : -1) * 10 * scale, (13 + j * 6) * scale * reveal], [(j % 2 ? 1 : -1) * 13 * scale, (18 + j * 6) * scale * reveal]), p.ink, .65 * scale, 1801 + j, .56, .65);
      }
      ctx.drawImage(a.thorn, -66 * scale, -136 * scale); ctx.restore();
      if (phase !== 'clear' && phase !== 'ready') {
        const drop = phase === 'sowing' ? 1 - Math.pow(clamp(elapsed / .72), .7) : 0;
        const x = geometry.seed.x, y = geometry.seed.y - drop * H * .13;
        if (style !== 'ink') fill(ctx, ellipse(x, y, 5 * scale, 7 * scale, 14), p.clay, 2200, .65);
        mark(ctx, ellipse(x, y, 4 * scale, 6 * scale, 16).slice(0, 13), p.ink, 1.25 * scale, 2201, .8);
      }
      if (growth > 0) {
        // Completed lettering is a static painted object. During growth only
        // regenerate when enough arclength has arrived to make a visible mark.
        if (Math.abs(a.wordProgress - growth) > .003 || growth === 1 && a.wordProgress !== 1) {
          const wc = a.word.getContext('2d'); wc.setTransform(1, 0, 0, 1, 0, 0); wc.clearRect(0, 0, a.word.width, a.word.height);
          wc.translate(-W * .08, -H * .25); drawVine(wc, p, style); a.wordProgress = growth;
        }
        ctx.drawImage(a.word, W * .08, H * .25);
      }
      ctx.restore();
    }
  }
  function resize(w, h) { W = Math.max(1, w); H = Math.max(1, h); held = null; layout(); changed(); }
  function reset() { phase = 'clear'; elapsed = 0; growth = 0; held = null; for (const s of stones) { s.cleared = false; s.lift = 0; } thorn.cleared = false; thorn.loose = 0; thorn.pull = 0; layout(); changed(); }
  layout();
  return { draw, step, pointerDown, pointerMove, pointerUp, pointerCancel, activate, sow, getState, resize, reset };
}
