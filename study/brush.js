import { getStroke } from 'perfect-freehand';
import { rng, noise1 } from './noise.js';

// ═══════════════════════════════════════════════════════════════════
// brush.js — one brush for everything (the "one hand").
//
// A stroke is a line of points with a pressure for each, turned into a
// filled outline by perfect-freehand (variable width, tapered ends).
// What makes it ink rather than a vector line:
//
//   wobble    each point is nudged along its normal by smooth noise
//             seeded per stroke, so the hand isn't a ruler, and the same
//             stroke wobbles the same way every frame (no flicker)
//   pressure  a stroke presses in, swells and lifts off; the caller can
//             shape it
//   pooling   ink gathers where the brush lands: a denser blot at the
//             start, a smaller one where it lifts
//   dry brush (still things only) the stroke is laid as a few bristles,
//             each carrying its own load of ink that runs out at its own
//             point, so the tail breaks into streaks (kasure)
//   paper     the fill is the ink tile (paper.js), fixed to the sheet, so
//             ink is a little uneven and the grain shows through
// ═══════════════════════════════════════════════════════════════════

export const INK = [26, 24, 22];

// perfect-freehand's outline → a canvas path (its README's quadratic
// midpoint method).
function outline(ctx, pts) {
  const n = pts.length;
  if (n < 3) return false;
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  }
  ctx.closePath();
  return true;
}

function normals(pts) {
  const n = pts.length;
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    out[i] = [-dy / l, dx / l];
  }
  return out;
}

const PRESS = {
  // Lands firmly, eases through, lifts away.
  swell: (u) => Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + u * 0.95)), 0.55),
  // Heavy at the start, thinning to the tip (a fin, a blade of grass).
  flick: (u) => 1 - Math.pow(u, 0.8) * 0.88,
  // Even, with the slightest swell (a contour).
  even: (u) => 0.82 + 0.18 * Math.sin(Math.PI * u),
};

// Draw one ink stroke.
//   pts     [[x, y], …] along the stroke
//   size    the widest the brush gets (px)
//   fill    a colour string or a CanvasPattern (the ink tile)
//   alpha   ink density (pale ink ≈ 0.3, dark ≈ 0.9)
//   press   'swell' | 'flick' | 'even' | (u) => 0..1
//   wobble  how much the hand wanders, as a fraction of size
//   seed    the stroke's own wobble (keep it fixed per stroke)
//   pool    ink pooling at the ends (0..1)
export function stroke(ctx, pts, {
  size = 4, fill = 'rgb(26,24,22)', alpha = 0.85, press = 'swell', wobble = 0.35, seed = 1,
  pool = 0.6, taperStart = 0, taperEnd = 0, thinning = 0.65, scale = 1,
} = {}) {
  const n = pts.length;
  if (n < 2) return;
  const pf = typeof press === 'function' ? press : PRESS[press] || PRESS.swell;
  const nm = normals(pts);
  const input = new Array(n);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const w = noise1(i * 0.45 + seed * 7.13, seed) * wobble * size * 0.5;
    input[i] = [pts[i][0] + nm[i][0] * w, pts[i][1] + nm[i][1] * w, Math.max(0.02, pf(u))];
  }
  const out = getStroke(input, {
    size: size * scale, thinning, smoothing: 0.62, streamline: 0.32, simulatePressure: false,
    start: { taper: taperStart, cap: true }, end: { taper: taperEnd, cap: true }, last: true,
  });
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = fill;
  ctx.beginPath();
  if (outline(ctx, out)) ctx.fill();
  // Ink pools where the brush lands, and a little where it lifts.
  if (pool > 0) {
    const p0 = input[0], p1 = input[n - 1];
    ctx.globalAlpha *= 0.55 * pool;
    ctx.beginPath();
    ctx.ellipse(p0[0], p0[1], size * scale * 0.42 * p0[2], size * scale * 0.34 * p0[2], 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p1[0], p1[1], size * scale * 0.2 * Math.max(0.3, p1[2]), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// A stroke laid as bristles, for things that don't move (painted once
// into a layer). Each bristle carries its own ink and runs dry at its
// own point, so the end of the stroke breaks into streaks.
//   dry   0 = a loaded brush, 1 = nearly dry (lots of broken streaks)
export function dryStroke(ctx, pts, {
  size = 6, ink = INK, alpha = 0.8, press = 'swell', wobble = 0.4, seed = 1, dry = 0.5, bristles = 0,
  pool = 0.5,
} = {}) {
  const n = pts.length;
  if (n < 2) return;
  const r = rng(seed * 977 + 13);
  const pf = typeof press === 'function' ? press : PRESS[press] || PRESS.swell;
  const nm = normals(pts);
  const col = `rgb(${ink[0]},${ink[1]},${ink[2]})`;
  // The body of the stroke, a little paler, so the bristles read as
  // texture within it rather than as separate lines.
  stroke(ctx, pts, { size: size * 0.8, fill: col, alpha: alpha * (0.55 - dry * 0.25), press: pf, wobble, seed, pool });
  const B = bristles || Math.max(4, Math.min(11, Math.round(size / 1.6)));
  for (let b = 0; b < B; b++) {
    const off = (b / Math.max(1, B - 1) - 0.5) * 0.85;
    const load = 0.45 + r() * 0.55;            // how much ink this bristle took up
    const runsOut = 1 - dry * (0.2 + r() * 0.8); // where it runs dry (fraction of the stroke)
    let seg = [];
    const flush = () => {
      if (seg.length > 2) {
        stroke(ctx, seg, { size: Math.max(0.6, size * (0.16 + r() * 0.1)), fill: col, alpha: alpha * load * 0.7, press: 'even', wobble: 0.6, seed: seed * 13 + b, pool: 0 });
      }
      seg = [];
    };
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      // Past the point it runs dry, it skips more and more.
      const skip = u > runsOut ? (u - runsOut) / Math.max(0.05, 1 - runsOut) : 0;
      const gap = noise1(i * 0.6 + b * 3.7, seed + b) * 0.5 + 0.5 < skip * 0.9;
      if (gap) { flush(); continue; }
      const w = off * size * pf(u);
      seg.push([pts[i][0] + nm[i][0] * w, pts[i][1] + nm[i][1] * w]);
    }
    flush();
  }
}

// Resample a polyline to even spacing (px), for smooth brush input.
export function resample(pts, step = 3) {
  if (pts.length < 2) return pts;
  const out = [pts[0]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    let [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    let seg = Math.hypot(bx - ax, by - ay);
    while (carry + seg >= step) {
      const k = (step - carry) / seg;
      ax += (bx - ax) * k; ay += (by - ay) * k;
      out.push([ax, ay]);
      seg = Math.hypot(bx - ax, by - ay);
      carry = 0;
    }
    carry += seg;
  }
  const last = pts[pts.length - 1];
  if (Math.hypot(last[0] - out[out.length - 1][0], last[1] - out[out.length - 1][1]) > step * 0.3) out.push(last);
  return out;
}

// Points along a quadratic or cubic curve.
export function curve(a, c1, c2, b, n = 16) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    if (c2) {
      out.push([
        u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0],
        u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1],
      ]);
    } else {
      out.push([u * u * a[0] + 2 * u * t * c1[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c1[1] + t * t * b[1]]);
    }
  }
  return out;
}
