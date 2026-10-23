import { dryStroke, stroke, resample, curve } from './brush.js';
import { wash, blob, fadedWash } from './wash.js';
import { rng, noise1 } from './noise.js';

// ═══════════════════════════════════════════════════════════════════
// paint.js — painting the scroll's still parts, once per dial step.
//
// Every layer is painted with the same two tools (brush.js and wash.js)
// and lies on the same paper, so the pond, the garden and the hills
// are one hand at every step:
//   ink     line only, in tones of one ink (far things paler)
//   wash    the same line, with soft watercolour under it
//   colour  the same washes, fuller; the line in a warmer, lighter ink
// ═══════════════════════════════════════════════════════════════════

export const PAPER = [243, 236, 223];

const PIG = {
  //           ink and wash        colour
  sky:       [[184, 198, 206], [156, 196, 220]],
  warm:      [[228, 178, 140], [242, 176, 120]],
  far:       [[160, 172, 184], [140, 176, 194]],
  mid:       [[122, 138, 150], [104, 148, 160]],
  near:      [[104, 124, 104], [96, 146, 102]],
  leaf:      [[104, 132, 82], [90, 152, 66]],
  earth:     [[156, 124, 90], [158, 116, 72]],
  grass:     [[134, 150, 98], [122, 168, 84]],
  water:     [[96, 134, 138], [58, 146, 152]],
  deep:      [[60, 92, 108], [26, 98, 116]],
  pad:       [[106, 140, 86], [86, 162, 84]],
  stone:     [[132, 132, 128], [146, 144, 136]],
  wood:      [[136, 108, 80], [146, 104, 68]],
  grape:     [[100, 74, 112], [104, 58, 124]],
  red:       [[204, 88, 62], [232, 98, 66]],
  pink:      [[214, 130, 140], [238, 150, 172]],
  gold:      [[206, 162, 74], [236, 182, 70]],
  white:     [[248, 244, 236], [252, 250, 244]],
};
export const pig = (name, mode) => PIG[name][mode === 'colour' ? 1 : 0];

export function inkOf(mode) {
  return mode === 'colour' ? [70, 54, 42] : [26, 24, 22];
}
const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// ── Layout: places stacked up the page ──────────────────────────────
export function layout(W, H) {
  const portrait = H > W;
  return {
    W, H, portrait,
    farY: H * 0.17, midY: H * 0.235, nearY: H * 0.305,
    trellisTop: H * 0.37, wire1: H * 0.405, wire2: H * 0.455,
    bedTop: H * 0.535, groundY: H * 0.565,
    bankY: H * 0.64,
    m: 14, // margin for gentle parallax
    u: Math.min(W, H) / 800, // the brush's scale
  };
}

// The bank: the top edge of the pond, a soft irregular line.
export function bankEdge(L, seed = 3) {
  const pts = [];
  for (let x = -40; x <= L.W + 40; x += 10) {
    pts.push([x, L.bankY + noise1(x * 0.012, seed) * L.H * 0.012 + noise1(x * 0.04, seed + 1) * L.H * 0.004]);
  }
  return pts;
}

function ridge(L, base, amp, seed, freq = 1) {
  const pts = [];
  for (let x = -L.m - 20; x <= L.W + L.m + 20; x += 6) {
    const u = x * freq;
    const h = 0.55 * (noise1(u * 0.0062, seed) * 0.5 + 0.5) + 0.3 * (noise1(u * 0.017, seed + 3) * 0.5 + 0.5)
      + 0.15 * (noise1(u * 0.05, seed + 7) * 0.5 + 0.5);
    pts.push([x, base - amp * h * h * 1.6]);
  }
  return pts;
}

// ── The back: sky, sun or moon, and two far ranges of hills ─────────
export function paintBack(ctx, L, mode, light) {
  const { W, H, m } = L;
  const ink = inkOf(mode);
  const r = rng(91);
  if (mode !== 'ink') {
    // The sky: a few broad washes, paler towards the hills.
    fadedWash(ctx, W + m * 2, H * 0.4, ctx.__dpr, (x) => {
      x.translate(m, 0);
      for (let i = 0; i < 4; i++) {
        wash(x, [[-m - 40, -20], [W + m + 40, -20], [W + m + 40, H * (0.16 + r() * 0.05)], [-m - 40, H * (0.13 + r() * 0.05)]],
          pig('sky', mode), { layers: 10, alpha: mode === 'colour' ? 0.07 : 0.05, spread: 0.08, seed: 10 + i, edge: 0, grain: 0.3 });
      }
      if (light === 'dawn' || light === 'dusk') {
        wash(x, [[-m - 40, H * 0.14], [W + m + 40, H * 0.12], [W + m + 40, H * 0.3], [-m - 40, H * 0.3]], pig('warm', mode),
          { layers: 14, alpha: 0.06, spread: 0.1, seed: 21, edge: 0, grain: 0.2 });
      }
    }, 0, H * 0.32, 0);
  }
  // Sun by day (a red seal of a sun, as ink painters set one), the moon
  // is laid by the page above the night (so it can glow).
  const sun = sunAt(L, light);
  if (sun && light !== 'night') {
    if (mode === 'ink') {
      stroke(ctx, circlePts(sun.x + m, sun.y, sun.r, 28), { size: 1.8, fill: css(ink), alpha: 0.45, press: 'even', wobble: 0.3, seed: 5, pool: 0.4 });
    } else {
      wash(ctx, blob(sun.x + m, sun.y, sun.r, sun.r, 12, 4, 0.04), pig('red', mode), { layers: 14, alpha: mode === 'colour' ? 0.09 : 0.07, spread: 0.04, seed: 6, edge: 0.3, grain: 0.15 });
    }
  }
  // Far hills: paler, softer; then the middle range.
  for (const [base, amp, seed, name, inkA, dry] of [[L.farY, H * 0.07, 11, 'far', 0.28, 0.7], [L.midY, H * 0.06, 17, 'mid', 0.42, 0.55]]) {
    const pts = ridge(L, base, amp, seed).map(([x, y]) => [x + m, y]);
    if (mode !== 'ink') {
      fadedWash(ctx, W + m * 2, H, ctx.__dpr, (x) => {
        for (let k = 0; k < 2; k++) {
          wash(x, [...pts, [W + m * 2 + 30, base + H * 0.1], [-30, base + H * 0.1]], pig(name, mode),
            { layers: 12, alpha: mode === 'colour' ? 0.07 : 0.055, spread: 0.035, seed: seed + k, edge: 0.25, grain: 0.3 });
        }
      }, base - H * 0.02, base + H * 0.06, 0);
    }
    inkRidge(ctx, pts, { ink, alpha: inkA, size: 4.2 * L.u, dry, seed, cun: name === 'mid' ? 12 : 0, depth: H * 0.03, L });
  }
}

// A ridge in ink: a broken line (a painter lifts the brush) and a few
// texture strokes (cun) down the slopes, paler further away.
function inkRidge(ctx, pts, { ink, alpha, size, dry, seed, cun, depth }) {
  const r = rng(seed * 7);
  let i = 0;
  while (i < pts.length - 4) {
    const len = 12 + Math.floor(r() * 30);
    const seg = pts.slice(i, Math.min(pts.length, i + len));
    if (seg.length > 3) dryStroke(ctx, resample(seg, 4), { size: size * (0.8 + r() * 0.6), ink, alpha, dry, seed: seed + i, press: 'swell' });
    i += len + (r() < 0.6 ? 2 + Math.floor(r() * 5) : 0);
  }
  for (let k = 0; k < cun; k++) {
    const j = 2 + Math.floor(r() * (pts.length - 4));
    const [x, y] = pts[j];
    const slope = Math.atan2(pts[j + 1][1] - pts[j - 1][1], pts[j + 1][0] - pts[j - 1][0]);
    const a = Math.PI / 2 + slope * 1.2 + (r() < 0.5 ? -0.55 : 0.55);
    const l = depth * (0.15 + r() * 0.3);
    const y0 = y + 2 + r() * depth * 0.5;
    dryStroke(ctx, curve([x, y0], [x + Math.cos(a) * l * 0.5 + 2, y0 + Math.sin(a) * l * 0.5], null, [x + Math.cos(a) * l, y0 + Math.sin(a) * l], 6),
      { size: size * 0.7, ink, alpha: alpha * 0.35, dry: 0.8, seed: seed * 31 + k, press: 'flick', bristles: 3, pool: 0 });
  }
}

export function sunAt(L, light) {
  const { W, H } = L;
  if (light === 'night') return { x: L.portrait ? W * 0.26 : W * 0.74, y: H * 0.09, r: Math.min(W, H) * 0.035, moon: true };
  const x = light === 'dawn' ? W * 0.2 : light === 'dusk' ? W * 0.8 : L.portrait ? W * 0.26 : W * 0.72;
  const y = light === 'day' ? H * (L.portrait ? 0.085 : 0.075) : H * 0.135;
  return { x, y, r: Math.min(W, H) * 0.04 };
}

function circlePts(cx, cy, r, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2 * 0.94;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

// ── The near hills, low and rounded, and the trees on them ──────────
export function paintNear(ctx, L, mode) {
  const { W, H, m } = L;
  const ink = inkOf(mode);
  const pts = ridge(L, L.nearY, H * 0.035, 29, 0.7).map(([x, y]) => [x + m, y]);
  if (mode !== 'ink') {
    fadedWash(ctx, W + m * 2, H, ctx.__dpr, (x) => {
      for (let k = 0; k < 2; k++) {
        wash(x, [...pts, [W + m * 2 + 30, L.nearY + H * 0.14], [-30, L.nearY + H * 0.14]], pig('near', mode),
          { layers: 12, alpha: mode === 'colour' ? 0.08 : 0.06, spread: 0.03, seed: 31 + k, edge: 0.25, grain: 0.35 });
      }
    }, L.nearY - H * 0.02, L.nearY + H * 0.075, 0);
  }
  inkRidge(ctx, pts, { ink, alpha: 0.58, size: 5 * L.u, dry: 0.45, seed: 29, cun: 8, depth: H * 0.025 });
  // A few far trees: dabs of the brush (mi dots), as ink painters do.
  const r = rng(77);
  for (let k = 0; k < Math.round(W / 70); k++) {
    const x = m + r() * W;
    const j = Math.max(1, Math.min(pts.length - 2, Math.round((x + 20) / 6)));
    const y = pts[j][1] + 2;
    const h = H * (0.018 + r() * 0.02);
    tree(ctx, x, y, h, mode, ink, 300 + k);
  }
}

// A distant tree: a short trunk and a crown of dabs.
function tree(ctx, x, y, h, mode, ink, seed) {
  const r = rng(seed);
  stroke(ctx, [[x, y], [x + (r() - 0.5) * 2, y - h * 0.6]], { size: h * 0.12, fill: css(ink), alpha: 0.55, press: 'flick', seed, pool: 0.2 });
  if (mode !== 'ink') wash(ctx, blob(x, y - h * 0.75, h * 0.42, h * 0.38, 8, seed, 0.3), pig('near', mode), { layers: 8, alpha: 0.12, spread: 0.2, seed, edge: 0.4, grain: 0.3 });
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, d = r() * h * 0.38;
    const px = x + Math.cos(a) * d, py = y - h * 0.75 + Math.sin(a) * d * 0.8;
    stroke(ctx, [[px, py], [px + h * 0.06, py + h * 0.03]], { size: h * 0.14, fill: css(ink), alpha: 0.38, press: 'flick', seed: seed * 9 + i, pool: 0.5 });
  }
}

// ── The garden: trellis and vine along the back, beds, ground ───────
export function gardenBeds(L) {
  const { W, portrait } = L;
  return portrait
    ? [[0.05, 0.47], [0.53, 0.95]]
    : [[0.04, 0.31], [0.36, 0.64], [0.69, 0.96]];
}
export function plantSpots(L) {
  const beds = gardenBeds(L);
  const out = [];
  const per = L.portrait ? [3, 2] : [2, 2, 1];
  beds.forEach(([a, b], k) => {
    for (let i = 0; i < per[k]; i++) out.push(L.W * (a + (b - a) * ((i + 0.5) / per[k])) );
  });
  return out.slice(0, 5);
}

export function paintGarden(ctx, L, mode) {
  const { W, H, m } = L;
  const ink = inkOf(mode);
  const r = rng(404);
  ctx.save();
  ctx.translate(m, 0);
  // Ground: the garden floor, from the beds down to the bank.
  if (mode !== 'ink') {
    wash(ctx, [[-m - 30, L.groundY - H * 0.012], [W + m + 30, L.groundY - H * 0.016], [W + m + 30, L.bankY + H * 0.03], [-m - 30, L.bankY + H * 0.03]],
      pig('grass', mode), { layers: 14, alpha: mode === 'colour' ? 0.075 : 0.05, spread: 0.03, seed: 41, edge: 0.15, grain: 0.4 });
  }
  // The trellis: posts and two wires along the back.
  const posts = [];
  const nPosts = L.portrait ? 4 : 6;
  for (let k = 0; k < nPosts; k++) posts.push(W * (0.07 + (0.86 * k) / (nPosts - 1)) + (r() - 0.5) * 8);
  for (const [i, x] of posts.entries()) {
    if (mode !== 'ink') wash(ctx, [[x - 3, L.trellisTop], [x + 3, L.trellisTop], [x + 3, L.groundY], [x - 3, L.groundY]], pig('wood', mode), { layers: 6, alpha: 0.12, spread: 0.02, seed: 50 + i, edge: 0.3, grain: 0.2 });
    dryStroke(ctx, [[x, L.trellisTop - 2], [x + (r() - 0.5) * 2, (L.trellisTop + L.groundY) / 2], [x + (r() - 0.5) * 3, L.groundY + 2]].flatMap((p, j, a) => (j < a.length - 1 ? resample([p, a[j + 1]], 4) : [])),
      { size: Math.max(2.2, 5 * L.u), ink, alpha: 0.7, dry: 0.55, seed: 60 + i, press: 'even' });
  }
  for (const [wy, s] of [[L.wire1, 70], [L.wire2, 71]]) {
    const pts = [];
    for (let k = 0; k < posts.length - 1; k++) pts.push(...curve([posts[k], wy], [(posts[k] + posts[k + 1]) / 2, wy + H * 0.006], null, [posts[k + 1], wy], 10).slice(k ? 1 : 0));
    stroke(ctx, pts, { size: 1.1, fill: css(ink), alpha: 0.45, press: 'even', wobble: 0.6, seed: s, pool: 0 });
  }
  // The vine: an old trunk out of the ground, trained along the top wire.
  paintVine(ctx, L, mode, posts);
  // Beds: low, raised, seen from the side.
  for (const [k, [a, b]] of gardenBeds(L).entries()) {
    const x0 = W * a, x1 = W * b;
    const top = L.bedTop, bot = L.groundY + H * 0.006;
    if (mode !== 'ink') {
      wash(ctx, [[x0, top + 2], [x1, top + 1], [x1, bot], [x0, bot]], pig('wood', mode), { layers: 10, alpha: 0.08, spread: 0.02, seed: 80 + k, edge: 0.3, grain: 0.3 });
      wash(ctx, [[x0 + 2, top - H * 0.008], [(x0 + x1) / 2, top - H * 0.014], [x1 - 2, top - H * 0.008], [x1, top + 3], [x0, top + 3]], pig('earth', mode), { layers: 10, alpha: 0.1, spread: 0.05, seed: 90 + k, edge: 0.2, grain: 0.5 });
    }
    // The bed's top edge, its plank, and the soil mounded in it.
    dryStroke(ctx, resample([[x0, top + 1], [x1, top]], 4), { size: 5 * L.u + 1, ink, alpha: 0.75, dry: 0.4, seed: 100 + k, press: 'swell' });
    dryStroke(ctx, resample([[x0 + 2, bot], [x1 - 1, bot - 1]], 4), { size: 4 * L.u + 1, ink, alpha: 0.6, dry: 0.6, seed: 110 + k, press: 'swell' });
    for (const x of [x0, x1]) stroke(ctx, [[x, top], [x + 0.5, bot]], { size: 4 * L.u + 1, fill: css(ink), alpha: 0.6, press: 'even', seed: 120 + k * 2 + (x === x1), pool: 0.4 });
    stroke(ctx, curve([x0 + 4, top - 1], [(x0 + x1) / 2, top - H * 0.016], null, [x1 - 4, top - 1], 18), { size: 3.5 * L.u + 0.8, fill: css(ink), alpha: 0.4, press: 'swell', seed: 130 + k, pool: 0.2 });
  }
  // The ground line, broken, with a few hatches of grass.
  const g = [];
  for (let x = -m; x <= W + m; x += 8) g.push([x, L.groundY + noise1(x * 0.02, 9) * 2.5 + H * 0.004]);
  inkRidge(ctx, g, { ink, alpha: 0.42, size: 4 * L.u + 0.8, dry: 0.6, seed: 140, cun: 0, depth: 6 });
  ctx.restore();
}

// The vine on its trellis: never the whole world, one living thing at
// the back of the garden. Leaves and a few bunches along the top wire.
function paintVine(ctx, L, mode, posts) {
  const { H } = L;
  const ink = inkOf(mode);
  const r = rng(505);
  const tx = posts[0] + (posts[1] - posts[0]) * 0.45;
  const trunk = curve([tx, L.groundY + 2], [tx - H * 0.02, L.wire2], [tx + H * 0.015, L.wire1 + H * 0.03], [tx + H * 0.004, L.wire1], 18);
  if (mode !== 'ink') wash(ctx, trunk.map(([x, y]) => [x - H * 0.006, y]).concat(trunk.slice().reverse().map(([x, y]) => [x + H * 0.006, y])), pig('wood', mode), { layers: 6, alpha: 0.14, spread: 0.02, seed: 506, edge: 0.4, grain: 0.3 });
  dryStroke(ctx, resample(trunk, 3), { size: 10 * L.u + 2, ink, alpha: 0.82, dry: 0.5, seed: 507, press: (u) => 1 - u * 0.5 });
  // Cordons along the top wire, both ways, undulating over it.
  const arms = [];
  for (const dir of [-1, 1]) {
    const end = dir < 0 ? posts[0] - 6 : posts[posts.length - 1] + 6;
    const pts = [];
    for (let x = tx; dir < 0 ? x >= end : x <= end; x += dir * 5) pts.push([x, L.wire1 - 2 + noise1(x * 0.05, 510 + dir) * 3]);
    if (pts.length > 2) {
      dryStroke(ctx, pts, { size: 5 * L.u + 1, ink, alpha: 0.7, dry: 0.45, seed: 512 + dir, press: (u) => 1 - u * 0.6 });
      arms.push(pts);
    }
  }
  // Leaves: in clusters along the arms, with shoots rising and falling.
  for (const [a, pts] of arms.entries()) {
    for (let i = 4; i < pts.length; i += 3 + Math.floor(r() * 3)) {
      const [x, y] = pts[i];
      const up = r() < 0.6;
      const s = H * (0.016 + r() * 0.01);
      leaf(ctx, x, y, up ? -Math.PI / 2 + (r() - 0.5) * 1.4 : Math.PI / 2 + (r() - 0.5) * 1.2, s, mode, ink, 520 + a * 100 + i);
      if (r() < 0.16) bunch(ctx, x + (r() - 0.5) * 6, y + 4, H * 0.016, mode, ink, 700 + a * 100 + i);
    }
  }
}

export function leaf(ctx, x, y, ang, s, mode, ink, seed) {
  const r = rng(seed);
  const tip = [x + Math.cos(ang) * s * 1.6, y + Math.sin(ang) * s * 1.6];
  const nx = -Math.sin(ang), ny = Math.cos(ang);
  const w = s * (0.55 + r() * 0.2);
  const midA = [x + Math.cos(ang) * s * 0.8 + nx * w, y + Math.sin(ang) * s * 0.8 + ny * w];
  const midB = [x + Math.cos(ang) * s * 0.8 - nx * w, y + Math.sin(ang) * s * 0.8 - ny * w];
  if (mode !== 'ink') {
    wash(ctx, [[x, y], midA, tip, midB], pig('leaf', mode), { layers: 7, alpha: mode === 'colour' ? 0.2 : 0.15, spread: 0.12, seed, edge: 0.5, grain: 0.3, depth: 2 });
  }
  // A leaf in two strokes, as a painter does it: one side, then the other.
  stroke(ctx, curve([x, y], midA, null, tip, 8), { size: Math.max(1, s * 0.12), fill: css(ink), alpha: 0.62, press: 'swell', seed, pool: 0.25 });
  stroke(ctx, curve([x, y], midB, null, tip, 8), { size: Math.max(1, s * 0.1), fill: css(ink), alpha: 0.45, press: 'swell', seed: seed + 1, pool: 0.1 });
  stroke(ctx, [[x, y], [x + (tip[0] - x) * 0.75, y + (tip[1] - y) * 0.75]], { size: Math.max(0.7, s * 0.05), fill: css(ink), alpha: 0.35, press: 'flick', seed: seed + 2, pool: 0 });
}

function bunch(ctx, x, y, s, mode, ink, seed) {
  const r = rng(seed);
  const rows = [3, 3, 2, 2, 1];
  stroke(ctx, [[x, y - s * 0.4], [x + 1, y]], { size: 1, fill: css(ink), alpha: 0.5, press: 'even', seed, pool: 0 });
  rows.forEach((n, j) => {
    for (let i = 0; i < n; i++) {
      const bx = x + (i - (n - 1) / 2) * s * 0.44 + (r() - 0.5) * 1.5, by = y + s * 0.3 + j * s * 0.36;
      if (mode !== 'ink') {
        ctx.save();
        ctx.globalAlpha = mode === 'colour' ? 0.5 : 0.36;
        ctx.fillStyle = css(pig('grape', mode));
        ctx.beginPath();
        ctx.arc(bx, by, s * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      stroke(ctx, circlePts(bx, by, s * 0.2, 9), { size: 0.9, fill: css(ink), alpha: 0.5, press: 'even', wobble: 0.5, seed: seed + i * 7 + j, pool: 0 });
    }
  });
}

// ── The bank: stones along the top of the pond, a lantern, reeds ────
export function paintBank(ctx, L, mode, edge) {
  const { W, H, m } = L;
  const ink = inkOf(mode);
  ctx.save();
  ctx.translate(m, 0);
  // The water's edge, in a broken line.
  inkRidge(ctx, edge, { ink, alpha: 0.6, size: 5 * L.u + 1, dry: 0.5, seed: 150, cun: 0, depth: 6 });
  const r = rng(160);
  const n = L.portrait ? 4 : 7;
  for (let k = 0; k < n; k++) {
    const x = W * ((k + 0.3 + r() * 0.4) / n);
    const j = Math.max(0, Math.min(edge.length - 1, Math.round((x + 40) / 10)));
    const y = edge[j][1];
    stone(ctx, x, y, H * (0.016 + r() * 0.014), mode, ink, 170 + k);
  }
  lantern(ctx, L.portrait ? W * 0.88 : W * 0.9, L.bankY + H * 0.004, L.portrait ? H * 0.085 : H * 0.12, mode, ink);
  ctx.restore();
}

export function stone(ctx, x, y, s, mode, ink, seed) {
  const r = rng(seed);
  const pts = [];
  const w = s * (1.2 + r() * 0.8), h = s * (0.7 + r() * 0.3);
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    const k = 1 + (r() - 0.5) * 0.25;
    pts.push([x + Math.cos(a) * w * k, y + Math.sin(a) * h * k * (a > Math.PI * 1.5 ? 0.9 : 1.1)]);
  }
  if (mode !== 'ink') wash(ctx, [...pts, [x + w, y + h * 0.3], [x - w, y + h * 0.35]], pig('stone', mode), { layers: 8, alpha: 0.16, spread: 0.08, seed, edge: 0.4, grain: 0.5 });
  dryStroke(ctx, resample(pts, 3), { size: Math.max(2, s * 0.18), ink, alpha: 0.75, dry: 0.5, seed, press: 'swell' });
  // The shadowed side, in a drier, darker brush, and a few moss dots.
  const shade = [];
  for (let i = 0; i <= 6; i++) { const a = Math.PI * 1.55 + (i / 6) * Math.PI * 0.45; shade.push([x + Math.cos(a) * w * 0.82, y + Math.sin(a) * h * 0.85]); }
  shade.push([x + w * 0.9, y]);
  dryStroke(ctx, resample(shade, 3), { size: Math.max(2.5, s * 0.32), ink, alpha: 0.42, dry: 0.75, seed: seed + 5, press: 'swell' });
  for (let i = 0; i < 4; i++) {
    const px = x - w * 0.6 + r() * w * 1.2, py = y - h * (0.75 + r() * 0.25);
    stroke(ctx, [[px, py], [px + s * 0.05, py + s * 0.03]], { size: Math.max(1.4, s * 0.14), fill: css(ink), alpha: 0.6, press: 'swell', seed: seed * 7 + i, pool: 0.6 });
  }
  // Texture strokes down its face.
  for (let i = 0; i < 3; i++) {
    const px = x - w * 0.5 + r() * w;
    dryStroke(ctx, [[px, y - h * 0.6], [px + s * 0.1, y - h * 0.2], [px + s * 0.05, y]], { size: Math.max(1.5, s * 0.12), ink, alpha: 0.32, dry: 0.8, seed: seed * 3 + i, press: 'flick', bristles: 3 });
  }
}

// A stone lantern (tōrō): the client's garden picture had one at the
// water's edge. Base, shaft, the light box, the roof, the jewel.
export function lantern(ctx, x, y, h, mode, ink) {
  const s = h;
  const c = css(ink);
  const box = (x0, y0, x1, y1, seed, a = 0.7) => {
    if (mode !== 'ink') wash(ctx, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], pig('stone', mode), { layers: 6, alpha: 0.13, spread: 0.03, seed, edge: 0.3, grain: 0.5 });
    dryStroke(ctx, resample([[x0, y1], [x0, y0], [x1, y0], [x1, y1]], 3), { size: Math.max(1.5, s * 0.022), ink, alpha: a, dry: 0.5, seed, press: 'even', bristles: 4 });
  };
  box(x - s * 0.17, y - s * 0.08, x + s * 0.17, y, 901);                 // base
  box(x - s * 0.06, y - s * 0.44, x + s * 0.06, y - s * 0.08, 902, 0.6); // shaft
  box(x - s * 0.15, y - s * 0.5, x + s * 0.15, y - s * 0.44, 903);       // platform
  box(x - s * 0.11, y - s * 0.68, x + s * 0.11, y - s * 0.5, 904);       // light box
  // Its window, where the light would be.
  stroke(ctx, [[x - s * 0.04, y - s * 0.64], [x + s * 0.04, y - s * 0.64], [x + s * 0.04, y - s * 0.55], [x - s * 0.04, y - s * 0.55], [x - s * 0.04, y - s * 0.64]], { size: 1.2, fill: c, alpha: 0.5, press: 'even', seed: 905, pool: 0 });
  // The roof: a swept curve each side.
  const roof = [[x - s * 0.26, y - s * 0.66], [x - s * 0.14, y - s * 0.72], [x, y - s * 0.8], [x + s * 0.14, y - s * 0.72], [x + s * 0.26, y - s * 0.66]];
  if (mode !== 'ink') wash(ctx, [...roof, [x + s * 0.2, y - s * 0.68], [x - s * 0.2, y - s * 0.68]], pig('stone', mode), { layers: 6, alpha: 0.16, spread: 0.04, seed: 906, edge: 0.3, grain: 0.5 });
  dryStroke(ctx, resample(curve(roof[0], [x - s * 0.08, y - s * 0.74], [x + s * 0.08, y - s * 0.74], roof[4], 16), 3), { size: Math.max(2, s * 0.03), ink, alpha: 0.78, dry: 0.4, seed: 907, press: 'swell' });
  stroke(ctx, [[x, y - s * 0.8], [x, y - s * 0.88]], { size: s * 0.04, fill: c, alpha: 0.7, press: 'swell', seed: 908, pool: 0.5 });
}

// ── The water, seen from above (in the pond's own frame) ────────────
export function paintWater(ctx, W, H, mode, light) {
  const ink = inkOf(mode);
  const r = rng(808);
  if (mode !== 'ink') {
    for (let k = 0; k < 3; k++) {
      wash(ctx, [[-40, -40], [W + 40, -40], [W + 40, H + 40], [-40, H + 40]], pig('water', mode), { layers: 8, alpha: mode === 'colour' ? 0.09 : 0.06, spread: 0.03, seed: 810 + k, edge: 0, grain: 0.35 });
    }
    // Deeper water towards the middle, very softly.
    for (let k = 0; k < 2; k++) {
      wash(ctx, blob(W * 0.5, H * 0.5, W * (0.5 + k * 0.1), H * (0.32 + k * 0.08), 12, 820 + k, 0.2), pig('deep', mode), { layers: 14, alpha: mode === 'colour' ? 0.035 : 0.025, spread: 0.35, seed: 821 + k, edge: 0, grain: 0.25 });
    }
  }
  // A few still lines on the water, pale (the moving ones are laid live).
  const u = Math.min(W, H) / 800;
  for (let k = 0; k < Math.round((W * H) / 90000) + 3; k++) {
    const x = r() * W, y = r() * H, l = Math.min(W, H) * (0.04 + r() * 0.06);
    stroke(ctx, curve([x, y], [x + l * 0.4, y - l * 0.08], [x + l * 0.7, y + l * 0.06], [x + l, y - l * 0.02], 12), { size: 2.2 * u + 0.6, fill: css(ink), alpha: 0.13, press: 'swell', wobble: 0.5, seed: 850 + k, pool: 0 });
  }
}

// A lily pad, drawn into its own small sheet (it bobs as one piece).
export function padSprite(s, mode, dpr, seed, flower = false) {
  const c = document.createElement('canvas');
  const S = Math.ceil(s * 2.8);
  c.width = c.height = Math.round(S * dpr);
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = S / 2, cy = S / 2;
  const ink = inkOf(mode);
  const r = rng(seed);
  const notch = 0.35;
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const a = notch + (i / 20) * (Math.PI * 2 - notch * 2);
    const k = 1 + (r() - 0.5) * 0.08;
    pts.push([cx + Math.cos(a) * s * k, cy + Math.sin(a) * s * k * 0.92]);
  }
  if (mode !== 'ink') wash(ctx, [[cx, cy], ...pts], pig('pad', mode), { layers: 9, alpha: mode === 'colour' ? 0.2 : 0.14, spread: 0.05, seed, edge: 0.5, grain: 0.4, depth: 2 });
  stroke(ctx, [[cx, cy], ...pts, [cx, cy]], { size: Math.max(1.1, s * 0.05), fill: css(ink), alpha: 0.48, press: 'swell', wobble: 0.5, seed, pool: 0.3 });
  for (let i = 0; i < 5; i++) {
    const a = notch + ((i + 0.5) / 5) * (Math.PI * 2 - notch * 2);
    stroke(ctx, [[cx, cy], [cx + Math.cos(a) * s * 0.75, cy + Math.sin(a) * s * 0.7]], { size: Math.max(0.6, s * 0.03), fill: css(ink), alpha: 0.25, press: 'flick', seed: seed + i + 1, pool: 0 });
  }
  if (flower) {
    // A lotus, half open: a few petals, the brush pressed and lifted.
    const fx = cx - s * 0.25, fy = cy - s * 0.2, fs = s * 0.55;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.42;
      const tip = [fx + Math.cos(a) * fs, fy + Math.sin(a) * fs];
      if (mode !== 'ink') wash(ctx, [[fx, fy], [fx + Math.cos(a - 0.3) * fs * 0.6, fy + Math.sin(a - 0.3) * fs * 0.6], tip, [fx + Math.cos(a + 0.3) * fs * 0.6, fy + Math.sin(a + 0.3) * fs * 0.6]], pig('pink', mode), { layers: 6, alpha: mode === 'colour' ? 0.28 : 0.18, spread: 0.1, seed: seed + 20 + i, edge: 0.5, grain: 0.2, depth: 2 });
      stroke(ctx, curve([fx, fy], [fx + Math.cos(a - 0.35) * fs * 0.7, fy + Math.sin(a - 0.35) * fs * 0.7], null, tip, 7), { size: Math.max(0.8, s * 0.035), fill: css(ink), alpha: 0.4, press: 'swell', seed: seed + 30 + i, pool: 0.2 });
    }
  }
  return { c, S };
}

// ── Living things that sway: plants (by stage) and tufts of grass ──
// Each is drawn once into a small sheet, its root at the bottom middle,
// and turned about the root by the one wind.
export function plantSprite(stage, kind, h, mode, dpr, seed) {
  const W = Math.ceil(h * 1.1), H = Math.ceil(h * 1.25);
  const c = document.createElement('canvas');
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const ink = inkOf(mode);
  const x = W / 2, y = H - 2;
  const r = rng(seed);
  const tall = [0.08, 0.25, 0.48, 0.75, 0.95][stage] * h;
  // The mound it grows from.
  stroke(ctx, curve([x - h * 0.16, y], [x, y - h * 0.05], null, [x + h * 0.16, y], 8), { size: h * 0.03, fill: css(ink), alpha: 0.45, press: 'swell', seed, pool: 0.2 });
  if (stage === 0) {
    stroke(ctx, [[x, y - h * 0.04], [x + 0.5, y - h * 0.09]], { size: h * 0.04, fill: css(ink), alpha: 0.7, press: 'swell', seed: seed + 1, pool: 0.7 });
    return { c, W, H };
  }
  const bend = (r() - 0.5) * h * 0.12;
  const stem = curve([x, y - h * 0.03], [x + bend, y - tall * 0.5], null, [x + bend * 0.6, y - tall], 14);
  stroke(ctx, stem, { size: Math.max(1.2, h * (0.022 + stage * 0.006)), fill: css(ink), alpha: 0.75, press: (u) => 1 - u * 0.55, seed: seed + 2, pool: 0.4 });
  // Leaves in pairs up the stem.
  const pairs = [1, 1, 2, 3, 3][stage];
  for (let p = 0; p < pairs; p++) {
    const f = (p + 0.6) / (pairs + 0.6);
    const [px, py] = stem[Math.round(f * (stem.length - 1))];
    const s = h * (stage === 1 ? 0.09 : 0.11 - p * 0.012);
    leaf(ctx, px, py, -Math.PI / 2 - 0.9 - r() * 0.3, s, mode, ink, seed * 10 + p * 2);
    leaf(ctx, px, py, -Math.PI / 2 + 0.9 + r() * 0.3, s, mode, ink, seed * 10 + p * 2 + 1);
  }
  const [tx, ty] = stem[stem.length - 1];
  if (stage === 3) {
    // A bud.
    if (mode !== 'ink') wash(ctx, blob(tx, ty - h * 0.02, h * 0.03, h * 0.045, 7, seed + 5, 0.2), pig(kind.colour, mode), { layers: 6, alpha: 0.3, spread: 0.1, seed: seed + 6, edge: 0.5, grain: 0.2, depth: 2 });
    stroke(ctx, curve([tx - h * 0.025, ty], [tx, ty - h * 0.09], null, [tx + h * 0.025, ty], 8), { size: h * 0.018, fill: css(ink), alpha: 0.6, press: 'swell', seed: seed + 7, pool: 0.3 });
  } else if (stage === 4) {
    if (kind.fruit) {
      for (let i = 0; i < 3; i++) {
        const fx = tx + (i - 1) * h * 0.09, fy = ty + h * (0.08 + (i % 2) * 0.05);
        if (mode !== 'ink') wash(ctx, blob(fx, fy, h * 0.045, h * 0.045, 9, seed + 10 + i, 0.15), pig(kind.colour, mode), { layers: 7, alpha: mode === 'colour' ? 0.32 : 0.24, spread: 0.08, seed: seed + 20 + i, edge: 0.5, grain: 0.2, depth: 2 });
        stroke(ctx, circlePts(fx, fy, h * 0.042, 12), { size: h * 0.014, fill: css(ink), alpha: 0.55, press: 'even', seed: seed + 30 + i, pool: 0 });
        stroke(ctx, [[tx, ty + 2], [fx, fy - h * 0.04]], { size: 0.9, fill: css(ink), alpha: 0.4, press: 'flick', seed: seed + 40 + i, pool: 0 });
      }
    } else {
      // A flower: petals in a few presses of the brush.
      const n = 6;
      if (mode !== 'ink') wash(ctx, blob(tx, ty, h * 0.1, h * 0.09, 10, seed + 50, 0.25), pig(kind.colour, mode), { layers: 8, alpha: mode === 'colour' ? 0.3 : 0.2, spread: 0.12, seed: seed + 51, edge: 0.5, grain: 0.2, depth: 2 });
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r() * 0.3;
        stroke(ctx, [[tx + Math.cos(a) * h * 0.025, ty + Math.sin(a) * h * 0.025], [tx + Math.cos(a) * h * 0.1, ty + Math.sin(a) * h * 0.09]], { size: h * 0.035, fill: css(ink), alpha: 0.4, press: 'swell', seed: seed + 60 + i, pool: 0.2 });
      }
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = mode === 'ink' ? css(ink) : css(pig('gold', mode));
      ctx.beginPath();
      ctx.arc(tx, ty, h * 0.022, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  return { c, W, H };
}

export function tuftSprite(h, mode, dpr, seed) {
  const W = Math.ceil(h * 1.3), H = Math.ceil(h * 1.1);
  const c = document.createElement('canvas');
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const ink = inkOf(mode);
  const r = rng(seed);
  const n = 4 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const bx = W / 2 + (r() - 0.5) * h * 0.3;
    const lean = (r() - 0.5) * h * 0.7;
    const top = [bx + lean, H - h * (0.55 + r() * 0.45)];
    const pts = curve([bx, H - 1], [bx + lean * 0.2, H - h * 0.5], null, top, 10);
    if (mode !== 'ink' && i % 2 === 0) {
      ctx.save();
      ctx.globalAlpha = mode === 'colour' ? 0.35 : 0.22;
      stroke(ctx, pts, { size: h * 0.09, fill: css(pig('grass', mode)), alpha: 1, press: 'flick', seed: seed + 50 + i, pool: 0 });
      ctx.restore();
    }
    stroke(ctx, pts, { size: Math.max(1, h * 0.045), fill: css(ink), alpha: 0.5 + r() * 0.3, press: 'flick', wobble: 0.4, seed: seed + i, pool: 0.3 });
  }
  return { c, W, H };
}

// A long, soft band of mist, the colour of the paper.
export function mistSprite(W, h, dpr, seed) {
  const c = document.createElement('canvas');
  c.width = Math.round(W * dpr); c.height = Math.round(h * dpr);
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let k = 0; k < 3; k++) {
    wash(ctx, blob(W * (0.2 + k * 0.3), h / 2, W * 0.26, h * 0.2, 10, seed + k, 0.3), PAPER, { layers: 10, alpha: 0.1, spread: 0.2, seed: seed + 10 + k, edge: 0, grain: 0 });
  }
  // Soften every edge, so the band has no ends and no top or bottom.
  ctx.globalCompositeOperation = 'destination-in';
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, h);
  return c;
}
