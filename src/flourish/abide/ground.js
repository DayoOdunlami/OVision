import { seeded } from '../lib/vine.js';

// ═══════════════════════════════════════════════════════════════════
// The ground, before sowing.
//
// "Others fell among the thorns … the cares of this world, the
//  deceitfulness of riches and the lusts of other things choke the
//  word." — Mark 4
//
// A few weeds (and a stone or two) on the soil, to clear before the
// seed goes in. Weeds grow back while you're away. Clearing them is the
// settling-in: a small, physical act of setting things aside.
//
//   weed   drag it up and it stretches, then pulls free with its roots
//          and is tossed aside; or just tap it
//   stone  tap (or flick) it and it rolls away off the edge
//
// Everything here is plain data + drawing; AbideScene owns the input.
// ═══════════════════════════════════════════════════════════════════

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const TYPES = ['grass', 'thistle', 'bramble'];

export function makeGround({ W, soilY, edge, weeds, stones, seed }) {
  const rand = seeded(seed);
  const r = (a, b) => a + rand() * (b - a);
  const S = Math.max(0.95, Math.min(1.7, W / 760));
  const n = weeds + stones;
  // Spread across the width with a little jitter, in a shuffled order so
  // stones aren't always at one end.
  const slots = Array.from({ length: n }, (_, i) => (i + 0.5) / n);
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  const items = [];
  slots.forEach((u, i) => {
    const x = W * (0.1 + 0.8 * u) + r(-0.25, 0.25) * (W * 0.8) / n * 0.6;
    const y = edge(x);
    if (i < weeds) {
      const type = TYPES[(i + Math.floor(rand() * 3)) % 3];
      const s = S * r(0.85, 1.2);
      const blades = [];
      const nb = type === 'grass' ? 6 + Math.floor(rand() * 3) : type === 'thistle' ? 5 : 3;
      for (let k = 0; k < nb; k++) {
        const f = nb === 1 ? 0.5 : k / (nb - 1);
        blades.push({
          lean: (f - 0.5) * r(1.2, 1.8) + r(-0.15, 0.15),
          len: (type === 'grass' ? r(20, 36) : type === 'thistle' ? r(14, 22) : r(26, 40)) * s,
          w: (type === 'grass' ? r(2.4, 3.6) : r(5, 7)) * s,
          bend: r(-0.4, 0.4),
          c: rand(),
        });
      }
      items.push({
        kind: 'weed', type, x, y, s, blades, phase: r(0, 6),
        stalk: type === 'thistle' ? r(30, 42) * s : 0,
        roots: Array.from({ length: 4 }, () => [r(-0.9, 0.9), r(10, 20) * s]),
        state: 'in', pull: 0, lean: 0, t: 0, vx: 0, vy: 0, rot: 0, vr: 0, a: 1,
      });
    } else {
      const rx = r(13, 20) * S, ry = rx * r(0.62, 0.78);
      const pts = Array.from({ length: 9 }, (_, k) => {
        const a = (k / 9) * Math.PI * 2;
        return [Math.cos(a) * rx * r(0.86, 1.08), Math.sin(a) * ry * r(0.86, 1.08)];
      });
      items.push({
        kind: 'stone', x, y: y + ry * 0.25, rx, ry, pts, tone: rand(),
        state: 'in', t: 0, vx: 0, vy: 0, rot: r(-0.3, 0.3), a: 1, dent: 0,
      });
    }
  });
  return { items, crumbs: [], S };
}

export function remaining(g) {
  return g.items.filter((it) => it.state === 'in' || it.state === 'held').length;
}

// Which item (if any) is under the point.
export function hitItem(g, x, y) {
  let best = null, bd = Infinity;
  for (const it of g.items) {
    if (it.state !== 'in') continue;
    let d;
    if (it.kind === 'stone') {
      d = Math.hypot((x - it.x) / (it.rx + 14), (y - it.y) / (it.ry + 14));
      if (d > 1) continue;
    } else {
      const h = (it.stalk || Math.max(...it.blades.map((b) => b.len))) + 14;
      if (x < it.x - 30 * it.s || x > it.x + 30 * it.s || y < it.y - h || y > it.y + 16) continue;
      d = Math.abs(x - it.x) / (30 * it.s);
    }
    if (d < bd) { bd = d; best = it; }
  }
  return best;
}

export function uproot(g, it, dirX = 0) {
  if (it.kind === 'stone') {
    const side = dirX ? Math.sign(dirX) : it.x < g.W2 ? -1 : 1;
    it.state = 'out';
    it.dentX = it.x;
    it.dentY = it.y;
    it.vx = side * (4.5 + Math.random() * 2) * g.S;
    it.vy = -2.6 * g.S;
    it.dent = 1;
    return;
  }
  it.state = 'out';
  it.pull = 1;
  const side = dirX ? Math.sign(dirX) : Math.random() < 0.5 ? -1 : 1;
  it.vx = side * (2.2 + Math.random() * 2.2) * it.s;
  it.vy = -(5.5 + Math.random() * 1.5) * it.s;
  it.vr = side * (0.05 + Math.random() * 0.05);
  for (let k = 0; k < 12; k++) {
    g.crumbs.push({
      x: it.x + (Math.random() - 0.5) * 14 * it.s, y: it.y,
      vx: (Math.random() - 0.5) * 3 * it.s, vy: -(1 + Math.random() * 3) * it.s,
      r: (0.8 + Math.random() * 1.6) * it.s, a: 1, light: Math.random() < 0.4,
    });
  }
}

// Advance by dt seconds. `soilAt(x)` gives the soil line.
export function stepGround(g, dt, soilAt, W) {
  g.W2 = W / 2;
  const k = dt * 60;
  for (const it of g.items) {
    if (it.state === 'auto') {
      it.pull = Math.min(1, it.pull + dt / 0.32);
      if (it.pull >= 1) uproot(g, it, it.autoDir);
    } else if (it.state === 'in' && it.pull > 0) {
      it.pull = Math.max(0, it.pull - dt * 5);   // let go too soon: springs back
      it.lean *= 1 - Math.min(1, dt * 8);
    } else if (it.state === 'out') {
      it.t += dt;
      it.x += it.vx * k;
      it.y += it.vy * k;
      if (it.kind === 'weed') {
        it.vy += 0.32 * k * it.s;
        it.vx *= 0.995;
        it.rot += it.vr * k;
        it.a = 1 - clamp01((it.t - 0.45) / 0.6);
      } else {
        // A stone rolls away along the soil and off the edge.
        it.vy += 0.4 * k * g.S;
        const floor = soilAt(it.x) + it.ry * 0.1;
        if (it.y > floor) { it.y = floor; it.vy = -Math.abs(it.vy) * 0.25; }
        it.rot += (it.vx / it.rx) * k * 0.9;
        it.dent = Math.max(0, it.dent - dt * 0.6);
        if (it.x < -it.rx * 2 || it.x > W + it.rx * 2) it.a = 0;
      }
      if (it.a <= 0) it.state = 'gone';
    }
  }
  for (const c of g.crumbs) {
    c.x += c.vx * k; c.y += c.vy * k; c.vy += 0.25 * k;
    if (c.y > soilAt(c.x) + 3) c.a -= dt * 3;
  }
  g.crumbs = g.crumbs.filter((c) => c.a > 0);
}

// ── Drawing ───────────────────────────────────────────────────────
const shade = (rgb, night, a = 1) => {
  const k = 0.45 * night;
  const c = rgb.map((v, i) => v + ([28, 34, 54][i] - v) * k);
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
};
const GRASS = [[84, 104, 46], [104, 122, 52], [70, 90, 40], [122, 132, 60]];
const THISTLE = [[78, 102, 70], [96, 120, 82]];
const BRAMBLE = [92, 64, 52];

// Stones sit half in the soil, so they're drawn before it.
export function drawStonesUnder(ctx, g, night) {
  for (const it of g.items) {
    if (it.kind !== 'stone') continue;
    if (it.dent > 0) {
      ctx.fillStyle = `rgba(40,26,16,${0.35 * it.dent})`;
      ctx.beginPath();
      ctx.ellipse(it.dentX ?? it.x, it.dentY ?? it.y, it.rx, it.ry * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (it.state === 'in' || it.state === 'held') drawStone(ctx, it, night);
  }
}

export function drawGroundOver(ctx, g, rt, night) {
  for (const it of g.items) {
    if (it.state === 'gone') continue;
    if (it.kind === 'stone') { if (it.state === 'out') drawStone(ctx, it, night); continue; }
    drawWeed(ctx, it, rt, night);
  }
  for (const c of g.crumbs) {
    ctx.fillStyle = c.light ? `rgba(196,164,124,${c.a})` : `rgba(92,66,44,${c.a})`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStone(ctx, it, night) {
  ctx.save();
  ctx.globalAlpha = it.a;
  ctx.translate(it.x, it.y);
  ctx.rotate(it.rot);
  const base = it.tone < 0.5 ? [138, 132, 122] : [158, 148, 132];
  const g = ctx.createRadialGradient(-it.rx * 0.35, -it.ry * 0.45, it.rx * 0.1, 0, 0, it.rx * 1.1);
  g.addColorStop(0, shade(base.map((v) => Math.min(255, v + 50)), night));
  g.addColorStop(1, shade(base.map((v) => v - 40), night));
  ctx.fillStyle = g;
  ctx.beginPath();
  const p = it.pts;
  ctx.moveTo((p[0][0] + p[p.length - 1][0]) / 2, (p[0][1] + p[p.length - 1][1]) / 2);
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  }
  ctx.fill();
  // A fleck or two.
  ctx.fillStyle = shade([90, 84, 76], night, 0.5);
  ctx.beginPath();
  ctx.arc(it.rx * 0.3, it.ry * 0.1, it.rx * 0.08, 0, Math.PI * 2);
  ctx.arc(-it.rx * 0.2, it.ry * 0.3, it.rx * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWeed(ctx, it, rt, night) {
  const out = it.state === 'out';
  const pull = Math.max(0, it.pull);
  ctx.save();
  ctx.globalAlpha = it.a;
  ctx.translate(it.x, it.y - (out ? 0 : pull * 6 * it.s));
  ctx.rotate(it.rot + it.lean * 0.4);
  // Stretched upward as it's pulled; a little breeze when it isn't.
  const stretch = 1 + pull * 0.28;
  const breeze = out ? 0 : Math.sin(rt * 1.3 + it.phase) * 0.05 * (1 - pull);

  // Roots, showing as it comes free.
  const rootK = out ? 1 : clamp01((pull - 0.55) / 0.45);
  if (rootK > 0) {
    ctx.strokeStyle = shade([226, 208, 176], night, 0.85 * rootK);
    ctx.lineWidth = Math.max(0.8, 1.1 * it.s);
    ctx.lineCap = 'round';
    for (const [dx, len] of it.roots) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(dx * len * 0.4, len * 0.5 * rootK, dx * len * 0.7, len * rootK);
      ctx.stroke();
    }
    ctx.fillStyle = shade([96, 70, 48], night, rootK);
    ctx.beginPath();
    ctx.ellipse(0, 3 * it.s, 7 * it.s, 4.5 * it.s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.scale(1, stretch);
  if (it.type === 'bramble') drawBramble(ctx, it, breeze, night);
  else {
    for (const b of it.blades) {
      const col = it.type === 'grass' ? GRASS[Math.floor(b.c * GRASS.length)] : THISTLE[Math.floor(b.c * THISTLE.length)];
      const ang = b.lean * (it.type === 'thistle' ? 1.1 : 0.55) + breeze;
      const tx = Math.sin(ang) * b.len, ty = -Math.cos(ang) * b.len;
      const cx = tx * 0.4 + b.bend * b.len * 0.3, cy = ty * 0.55;
      ctx.fillStyle = shade(col, night);
      ctx.beginPath();
      if (it.type === 'grass') {
        ctx.moveTo(-b.w / 2, 0);
        ctx.quadraticCurveTo(cx - b.w * 0.3, cy, tx, ty);
        ctx.quadraticCurveTo(cx + b.w * 0.3, cy, b.w / 2, 0);
      } else {
        // A thistle leaf: toothed along both edges.
        const nx = -Math.cos(ang), ny = -Math.sin(ang);
        const steps = 6;
        ctx.moveTo(0, 0);
        for (let j = 1; j <= steps; j++) {
          const f = j / steps;
          const w = b.w * Math.sin(Math.PI * f) * (j % 2 ? 1.25 : 0.55);
          ctx.lineTo(tx * f + nx * w, ty * f + ny * w);
        }
        for (let j = steps - 1; j >= 1; j--) {
          const f = j / steps;
          const w = b.w * Math.sin(Math.PI * f) * (j % 2 ? 1.25 : 0.55);
          ctx.lineTo(tx * f - nx * w, ty * f - ny * w);
        }
        ctx.closePath();
      }
      ctx.fill();
    }
    if (it.type === 'thistle') {
      // A stalk with a spiky purple head.
      const h = it.stalk, sway = breeze * 1.5;
      ctx.strokeStyle = shade([86, 108, 70], night);
      ctx.lineWidth = Math.max(1.2, 1.8 * it.s);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(sway * h * 0.3, -h * 0.5, Math.sin(sway) * h * 0.4, -h);
      ctx.stroke();
      const hx = Math.sin(sway) * h * 0.4, hy = -h;
      ctx.fillStyle = shade([100, 128, 84], night);
      ctx.beginPath();
      ctx.ellipse(hx, hy + 2 * it.s, 4.2 * it.s, 4.8 * it.s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = shade([150, 92, 160], night);
      ctx.lineWidth = Math.max(0.8, 1.1 * it.s);
      for (let k = 0; k < 9; k++) {
        const a = -Math.PI * (0.1 + (0.8 * k) / 8);
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + Math.cos(a) * 6.5 * it.s, hy + Math.sin(a) * 6.5 * it.s);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawBramble(ctx, it, breeze, night) {
  // Arching thorny canes.
  ctx.lineCap = 'round';
  for (const b of it.blades) {
    const ang = b.lean * 0.7 + breeze;
    const L = b.len * 1.25;
    const ex = Math.sin(ang) * L * 0.9 + b.bend * L * 0.4, ey = -Math.cos(ang) * L * 0.55;
    const cx = Math.sin(ang) * L * 0.2, cy = -L * 0.95;
    ctx.strokeStyle = shade(BRAMBLE, night);
    ctx.lineWidth = Math.max(1.4, 2.2 * it.s);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.stroke();
    // Thorns along it.
    ctx.fillStyle = shade([120, 80, 64], night);
    for (let k = 1; k < 6; k++) {
      const u = k / 6, v = 1 - u;
      const x = 2 * v * u * cx + u * u * ex, y = 2 * v * u * cy + u * u * ey;
      const dx = 2 * v * (cx) + 2 * u * (ex - cx), dy = 2 * v * (cy) + 2 * u * (ey - cy);
      const d = Math.hypot(dx, dy) || 1;
      const side = k % 2 ? 1 : -1;
      const nx = (-dy / d) * side, ny = (dx / d) * side;
      const t = 3.4 * it.s;
      ctx.beginPath();
      ctx.moveTo(x - (dx / d) * t * 0.5, y - (dy / d) * t * 0.5);
      ctx.lineTo(x + nx * t, y + ny * t);
      ctx.lineTo(x + (dx / d) * t * 0.5, y + (dy / d) * t * 0.5);
      ctx.fill();
    }
    // A small dull leaf near the end.
    ctx.fillStyle = shade([82, 100, 52], night);
    ctx.beginPath();
    ctx.ellipse(ex * 0.75, ey * 0.85 - 3 * it.s, 5 * it.s, 2.6 * it.s, ang, 0, Math.PI * 2);
    ctx.fill();
  }
}
