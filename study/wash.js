import { rng, gauss } from './noise.js';

// ═══════════════════════════════════════════════════════════════════
// wash.js — watercolour, the way Tyler Hobbs describes it (2017).
//
// A shape is deformed by recursive midpoint displacement (each edge's
// midpoint pushed out along a Gaussian), and then laid down as many
// nearly transparent layers, each deformed a little further from the
// same base. Where the layers agree the colour is dense; at the edges
// they disagree, so the edge is soft and irregular, as a wash is. A
// faint line along the last layer's edge is the pigment that gathers
// where a wash dries. A few layers are laid through a granulation tile,
// so the pigment settles in the paper's tooth.
//
// Only for things that don't move: painted once into a layer.
// ═══════════════════════════════════════════════════════════════════

// poly: [[x, y, v?], …] closed; v is how much that vertex may wander.
function deform(poly, depth, amount, r) {
  let p = poly.map((q) => [q[0], q[1], q[2] ?? 1]);
  for (let d = 0; d < depth; d++) {
    const out = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      out.push(a);
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const v = (a[2] + b[2]) / 2;
      const s = len * amount * v;
      out.push([(a[0] + b[0]) / 2 + gauss(r) * s, (a[1] + b[1]) / 2 + gauss(r) * s, v * (0.55 + r() * 0.5)]);
    }
    p = out;
  }
  return p;
}

const grainCache = new Map();
function grainPattern(ctx, rgb) {
  const key = rgb.join();
  if (!grainCache.has(key)) {
    const c = document.createElement('canvas');
    c.width = c.height = 96;
    const x = c.getContext('2d');
    const r = rng(rgb[0] * 7 + rgb[1] * 3 + rgb[2]);
    for (let i = 0; i < 900; i++) {
      x.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.25 + r() * 0.6})`;
      x.beginPath();
      x.arc(r() * 96, r() * 96, 0.4 + r() * 1.6, 0, Math.PI * 2);
      x.fill();
    }
    grainCache.set(key, c);
  }
  return ctx.createPattern(grainCache.get(key), 'repeat');
}

// Lay a wash.
//   poly    the shape, roughly (a few points is plenty)
//   rgb     its pigment
//   layers  how many glazes (more = denser, smoother)
//   alpha   each glaze's opacity
//   spread  how far the edge wanders (fraction of edge length)
//   edge    how strongly pigment gathers at the edge
//   vary    per-vertex wander, so one side can be crisp and another soft
export function wash(ctx, poly, rgb, {
  layers = 18, alpha = 0.05, spread = 0.12, seed = 1, edge = 0.18, grain = 0.25, depth = 3,
} = {}) {
  const r = rng(seed * 104729 + 7);
  const base = deform(poly, 2, spread * 0.9, r);
  const col = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`;
  const pat = grain > 0 ? grainPattern(ctx, rgb) : null;
  let last = base;
  ctx.save();
  for (let l = 0; l < layers; l++) {
    const p = deform(base, depth, spread * 0.55, r);
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.closePath();
    const granulate = pat && l % 4 === 3;
    ctx.globalAlpha = granulate ? alpha * grain * 2.2 : alpha;
    ctx.fillStyle = granulate ? pat : col;
    ctx.fill();
    last = p;
  }
  if (edge > 0) {
    ctx.globalAlpha = alpha * edge * 4;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.1;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last[0][0], last[0][1]);
    for (let i = 1; i < last.length; i++) ctx.lineTo(last[i][0], last[i][1]);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

// A rough ellipse as a polygon, for washes.
export function blob(cx, cy, rx, ry, n = 10, seed = 1, jitter = 0.12) {
  const r = rng(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * jitter * 2;
    out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k, 0.6 + r() * 0.8]);
  }
  return out;
}

// A wash that fades downwards (a hill into mist, the sky towards the
// horizon): painted on its own sheet, then faded with a gradient, then
// laid on.
export function fadedWash(ctx, W, H, dpr, paint, from, to, keep = 0) {
  const c = document.createElement('canvas');
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  const x = c.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  paint(x);
  x.globalCompositeOperation = 'destination-in';
  const g = x.createLinearGradient(0, from, 0, to);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(1, `rgba(0,0,0,${keep})`);
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(c, 0, 0);
  ctx.restore();
}
