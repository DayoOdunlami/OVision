// ═══════════════════════════════════════════════════════════════════
// Thorns, drawn with care. Four plants of the field, each with its own
// way of going to seed — and each seed head thins as it sheds, so you
// can see what carelessness has cost:
//
//   dandelion   deep-toothed rosette, a carrot of a taproot, and a clock
//               of tiny parachutes
//   thistle     silvery leaves with white veins and a spine on every
//               lobe; a scaled green cup with a purple brush
//   foxtail     twisting two-tone blades and a nodding, bristled spike
//   bramble     arching red canes with hooked prickles, three-part
//               serrated leaves, and a cluster of dark berries
//
// Shapes are made once per plant (makeThorn, from a seeded random) and
// drawn each frame in the plant's own frame: base at (0,0), up is −y.
// ═══════════════════════════════════════════════════════════════════

export const SPECIES = ['dandelion', 'thistle', 'foxtail', 'bramble'];

const NIGHT = [28, 34, 54];
const tint = (c, night, k = 0.45) => c.map((v, i) => v + (NIGHT[i] - v) * k * night);
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const lift = (c, d) => c.map((v) => Math.max(0, Math.min(255, v + d)));

export function makeThorn(type, s, rand) {
  const r = (a, b) => a + rand() * (b - a);
  const leaves = [];
  const t = { type, leaves, canes: [] };
  if (type === 'dandelion') {
    const n = 6 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      // A dandelion's rosette lies low: long, strap-like leaves, softly
      // toothed, spread almost flat around the crown.
      const side = f < 0.5 ? -1 : 1;
      const lean = Math.abs(f - 0.5) * 2;
      leaves.push({ ang: -Math.PI / 2 + side * (0.5 + lean * 1.0) + r(-0.12, 0.12), len: r(30, 42) * s * (0.8 + lean * 0.3), wid: r(4.2, 5.4) * s, lobes: 5, tone: rand(), bend: r(-0.2, 0.2), soft: true });
    }
    t.stalkH = r(46, 60) * s;
    t.stalkW = 2.1 * s;
  } else if (type === 'thistle') {
    const n = 5 + Math.floor(rand() * 2);
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      leaves.push({ ang: -Math.PI / 2 + (f - 0.5) * r(2.2, 2.7), len: r(22, 32) * s, wid: r(7, 9.5) * s, lobes: 4, tone: rand(), bend: r(-0.15, 0.15) });
    }
    // A couple of small leaves up the stalk.
    t.stem = [{ at: 0.35, side: 1, len: r(12, 16) * s }, { at: 0.6, side: -1, len: r(9, 13) * s }];
    t.stalkH = r(48, 62) * s;
    t.stalkW = 2.6 * s;
  } else if (type === 'foxtail') {
    const n = 5 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      const f = n === 1 ? 0.5 : i / (n - 1);
      leaves.push({ ang: -Math.PI / 2 + (f - 0.5) * r(1.4, 1.9) + r(-0.12, 0.12), len: r(30, 46) * s, wid: r(3, 4.2) * s, droop: r(0.25, 0.7) * (f < 0.5 ? -1 : 1), tone: rand() });
    }
    t.stalkH = r(56, 70) * s;
    t.stalkW = 1.5 * s;
    t.nod = r(0.5, 0.9) * (rand() < 0.5 ? -1 : 1);
  } else {
    const n = 2 + Math.floor(rand() * 2);
    for (let i = 0; i < n; i++) {
      const dir = i % 2 ? 1 : -1;
      const L = r(34, 48) * s;
      const cane = { dir, L, rise: r(0.8, 1.05), leaves: [], prickles: [] };
      for (let k = 1; k <= 7; k++) cane.prickles.push({ u: k / 8, side: k % 2 ? 1 : -1 });
      cane.leaves.push({ u: r(0.35, 0.5), side: -dir, size: r(6.5, 8.5) * s, tone: rand() });
      cane.leaves.push({ u: r(0.7, 0.85), side: dir, size: r(5.5, 7) * s, tone: rand() });
      t.canes.push(cane);
    }
    t.stalkH = r(44, 56) * s;
    t.stalkW = 2.6 * s;
  }
  return t;
}

// ── Leaves ────────────────────────────────────────────────────────
// Along +x, base at 0. A toothed outline whose lobes sweep back toward
// the base, like a dandelion's (thistle: with a spine on each point).
function lobedLeaf(ctx, L, W, lobes, col, night, spines, soft) {
  const up = [], dn = [];
  const steps = lobes * 2;
  for (let j = 0; j <= steps; j++) {
    const f = j / steps;
    const env = W * Math.pow(Math.sin(Math.PI * Math.min(1, f * 1.08)), 0.8) * (1 - f * 0.25);
    const tooth = j % 2 === 1;
    const w = tooth ? env * (soft ? 1.15 : 1.35) : env * (soft ? 0.62 : 0.42);
    const x = L * f - (tooth ? L * 0.05 : 0);
    up.push([x, -w]);
    dn.push([x + (tooth ? L * 0.02 : 0), w * 0.94]);
  }
  const g = ctx.createLinearGradient(0, 0, L, 0);
  g.addColorStop(0, css(tint(lift(col, -30), night)));
  g.addColorStop(0.6, css(tint(col, night)));
  g.addColorStop(1, css(tint(lift(col, 26), night)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (const [x, y] of up) ctx.lineTo(x, y);
  ctx.lineTo(L, 0);
  for (let j = dn.length - 1; j >= 0; j--) ctx.lineTo(dn[j][0], dn[j][1]);
  ctx.closePath();
  ctx.fill();
  // Rim light along the upper edge.
  ctx.strokeStyle = css([255, 252, 226], night > 0.5 ? 0.12 : 0.28);
  ctx.lineWidth = Math.max(0.5, W * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (const [x, y] of up) ctx.lineTo(x, y);
  ctx.stroke();
  // A darker underside, so the leaf has a fold.
  ctx.fillStyle = css(tint(lift(col, -38), night), 0.35);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (const [x, y] of dn) ctx.lineTo(x, y * 0.98);
  ctx.lineTo(L, 0);
  ctx.closePath();
  ctx.fill();
  // Midrib, and on a thistle the pale veins and spines.
  ctx.strokeStyle = spines ? css([238, 244, 232], 0.6) : css(tint(lift(col, 50), night), 0.7);
  ctx.lineWidth = Math.max(0.7, W * 0.12);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(L * 0.5, -W * 0.08, L * 0.96, 0);
  ctx.stroke();
  if (spines) {
    ctx.lineWidth = Math.max(0.5, W * 0.06);
    ctx.strokeStyle = css([236, 240, 226], 0.45);
    for (let j = 1; j < steps; j += 2) {
      const [x, y] = up[j];
      ctx.beginPath(); ctx.moveTo(x * 0.85, 0); ctx.lineTo(x, y * 0.85); ctx.stroke();
    }
    ctx.strokeStyle = css(tint([236, 226, 196], night), 0.95);
    ctx.lineWidth = Math.max(0.5, W * 0.05);
    for (const pts of [up, dn]) {
      for (let j = 1; j < steps; j += 2) {
        const [x, y] = pts[j];
        const len = W * 0.45;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - len * 0.5, y + Math.sign(y) * len);
        ctx.stroke();
      }
    }
  }
}

// A long grass blade along +x that droops, with a lighter edge.
function blade(ctx, L, W, droop, col, night) {
  const tipX = L * Math.cos(droop * 0.6), tipY = L * Math.sin(droop * 0.6);
  const cx = L * 0.55, cy = droop * L * 0.12;
  const g = ctx.createLinearGradient(0, 0, tipX, tipY);
  g.addColorStop(0, css(tint(lift(col, -25), night)));
  g.addColorStop(1, css(tint(lift(col, 30), night)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -W / 2);
  ctx.quadraticCurveTo(cx, cy - W * 0.6, tipX, tipY);
  ctx.quadraticCurveTo(cx, cy + W * 0.6, 0, W / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = css(tint(lift(col, 55), night), 0.5);
  ctx.lineWidth = Math.max(0.5, W * 0.18);
  ctx.beginPath();
  ctx.moveTo(0, -W * 0.3);
  ctx.quadraticCurveTo(cx, cy - W * 0.35, tipX, tipY);
  ctx.stroke();
}

// Bramble leaf: three serrated leaflets on a short stalk.
function trefoil(ctx, size, col, night) {
  ctx.strokeStyle = css(tint([120, 64, 58], night));
  ctx.lineWidth = Math.max(0.6, size * 0.1);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(size * 0.7, 0); ctx.stroke();
  ctx.translate(size * 0.7, 0);
  for (const [a, k] of [[-0.75, 0.8], [0, 1], [0.75, 0.8]]) {
    ctx.save();
    ctx.rotate(a);
    const L = size * 1.25 * k, W = size * 0.48 * k;
    const g = ctx.createLinearGradient(0, -W, 0, W);
    g.addColorStop(0, css(tint(lift(col, 22), night)));
    g.addColorStop(1, css(tint(lift(col, -28), night)));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const n = 6;
    for (let j = 1; j <= n; j++) {
      const f = j / n;
      const w = W * Math.sin(Math.PI * f) * (j % 2 ? 1.12 : 0.9);
      ctx.lineTo(L * f, -w);
    }
    for (let j = n - 1; j >= 1; j--) {
      const f = j / n;
      const w = W * Math.sin(Math.PI * f) * (j % 2 ? 1.12 : 0.9);
      ctx.lineTo(L * f, w);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = css(tint(lift(col, 40), night), 0.5);
    ctx.lineWidth = Math.max(0.4, W * 0.1);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L * 0.9, 0); ctx.stroke();
    ctx.restore();
  }
}

// A tapered, filled stroke along a quadratic, base width w0 to tip w1.
function taper(ctx, x0, y0, cx, cy, x1, y1, w0, w1, fill) {
  const N = 12, L = [], R = [];
  for (let j = 0; j <= N; j++) {
    const u = j / N, v = 1 - u;
    const x = v * v * x0 + 2 * v * u * cx + u * u * x1, y = v * v * y0 + 2 * v * u * cy + u * u * y1;
    const dx = 2 * v * (cx - x0) + 2 * u * (x1 - cx), dy = 2 * v * (cy - y0) + 2 * u * (y1 - cy);
    const d = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * u) / 2;
    L.push([x - (dy / d) * w, y + (dx / d) * w]);
    R.push([x + (dy / d) * w, y - (dx / d) * w]);
  }
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(L[0][0], L[0][1]);
  for (const p of L) ctx.lineTo(p[0], p[1]);
  for (let j = R.length - 1; j >= 0; j--) ctx.lineTo(R[j][0], R[j][1]);
  ctx.closePath();
  ctx.fill();
}

// ── The plant ─────────────────────────────────────────────────────
// w: { type, s, thorn, pull, lean, rot, free, seeds, quiver, phase }
// Draws in the frame the caller has set up at the plant's base.
// Returns the head's position in that frame.
export function drawThorn(ctx, w, t, night) {
  const T = w.thorn;
  const out = w.free;
  const pull = Math.max(0, w.pull);
  const stretch = 1 + pull * 0.28;
  // The one wind (set by the field from wind.js); a private sine only if
  // there's no wind to hand.
  const breeze = out ? 0 : (w.windSway != null ? w.windSway : Math.sin(t * 1.3 + w.phase) * 0.05) * (1 - pull);
  const gusty = w.windAt != null ? 0.4 + w.windAt * 1.4 : 1;
  const s = w.s;

  // Resting on the soil: a soft contact shadow, and as the roots loosen
  // the soil around the crown cracks and lifts.
  if (!out) {
    ctx.fillStyle = `rgba(40,28,18,${0.24 * (1 - pull * 0.6)})`;
    ctx.beginPath();
    ctx.ellipse(0, 2 * s, 17 * s, 3.6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    const lo = w.loose || 0;
    if (lo > 0.02) {
      ctx.strokeStyle = `rgba(52,34,22,${0.65 * lo})`;
      ctx.lineWidth = Math.max(0.6, 0.9 * s);
      ctx.lineCap = 'round';
      for (let k = 0; k < 6; k++) {
        const a = Math.PI * (0.05 + (0.9 * k) / 5);
        const L = (6 + (k % 3) * 3) * s * lo;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 3 * s, 3 * s + Math.sin(a) * 1.2 * s);
        ctx.lineTo(Math.cos(a) * (3 * s + L), 3 * s + Math.sin(a) * (1.2 * s + L * 0.35));
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(150,116,82,${0.9 * lo})`;
      for (let k = 0; k < 7; k++) {
        const x = ((k * 53) % 21 - 10) * s, y = 1 * s - ((k * 31) % 5) * s * lo * 0.6;
        ctx.beginPath(); ctx.arc(x, y, (0.8 + (k % 3) * 0.4) * s, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // Roots, showing as it comes free.
  const rootK = out ? 1 : Math.max(0, Math.min(1, (pull - 0.55) / 0.45));
  if (rootK > 0) {
    if (T.type === 'dandelion') {
      // A taproot.
      taper(ctx, 0, 0, 2 * s, 12 * s * rootK, -1 * s, 24 * s * rootK, 4.2 * s, 0.6, css(tint([214, 186, 140], night)));
    }
    ctx.strokeStyle = css(tint([226, 208, 176], night), 0.85);
    ctx.lineWidth = Math.max(0.6, 0.9 * s);
    ctx.lineCap = 'round';
    for (let k = 0; k < 6; k++) {
      const dx = (k / 5 - 0.5) * 1.8, len = (10 + (k * 7) % 9) * s;
      ctx.beginPath();
      ctx.moveTo(0, 2 * s);
      ctx.quadraticCurveTo(dx * len * 0.4, len * 0.5 * rootK, dx * len * 0.75, len * rootK);
      ctx.stroke();
    }
    ctx.fillStyle = css(tint([104, 76, 52], night), rootK);
    ctx.beginPath();
    ctx.ellipse(0, 3 * s, 7.5 * s, 4.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Foliage, stretched upward as it's pulled.
  ctx.save();
  ctx.scale(1, stretch);
  if (T.type === 'dandelion' || T.type === 'thistle') {
    const base = T.type === 'thistle' ? [96, 128, 104] : [74, 128, 52];
    // Back leaves first (the ones lying flatter), so the rosette has depth.
    const order = [...T.leaves].sort((a, b) => Math.abs(b.ang + Math.PI / 2) - Math.abs(a.ang + Math.PI / 2));
    for (const lf of order) {
      const sway = out ? 0 : Math.sin(t * 1.1 + lf.tone * 9) * 0.03 * gusty;
      ctx.save();
      ctx.rotate(lf.ang + Math.PI / 2 + breeze * 0.6 + lf.bend * 0.3 + sway);
      ctx.rotate(-Math.PI / 2);
      lobedLeaf(ctx, lf.len, lf.wid, lf.lobes, lift(base, (lf.tone - 0.5) * 30), night, T.type === 'thistle', lf.soft);
      ctx.restore();
    }
  } else if (T.type === 'foxtail') {
    for (const lf of T.leaves) {
      const sway = out ? 0 : Math.sin(t * 1.4 + lf.tone * 9) * 0.04 * gusty;
      ctx.save();
      ctx.rotate(lf.ang + breeze + sway);
      blade(ctx, lf.len, lf.wid, lf.droop, lift([88, 132, 58], (lf.tone - 0.5) * 34), night);
      ctx.restore();
    }
  } else {
    for (const c of T.canes) {
      const ex = c.dir * c.L * 0.95, ey = -c.L * 0.35;
      const cx = c.dir * c.L * 0.2, cy = -c.L * c.rise;
      const ang = breeze * 1.5;
      ctx.save();
      ctx.rotate(ang);
      const g = ctx.createLinearGradient(0, 0, ex, cy);
      g.addColorStop(0, css(tint([104, 46, 44], night)));
      g.addColorStop(1, css(tint([150, 74, 62], night)));
      taper(ctx, 0, 0, cx, cy, ex, ey, 3.4 * s, 1.1 * s, g);
      // Hooked prickles.
      ctx.fillStyle = css(tint([196, 120, 96], night));
      for (const p of c.prickles) {
        const u = p.u, v = 1 - u;
        const x = 2 * v * u * cx + u * u * ex, y = 2 * v * u * cy + u * u * ey;
        const dx = 2 * v * cx + 2 * u * (ex - cx), dy = 2 * v * cy + 2 * u * (ey - cy);
        const d = Math.hypot(dx, dy) || 1;
        const nx = (-dy / d) * p.side, ny = (dx / d) * p.side;
        const h = 3.2 * s;
        ctx.beginPath();
        ctx.moveTo(x - (dx / d) * h * 0.5, y - (dy / d) * h * 0.5);
        ctx.quadraticCurveTo(x + nx * h * 0.6, y + ny * h * 0.6, x + nx * h - (dx / d) * h * 0.6, y + ny * h - (dy / d) * h * 0.6);
        ctx.lineTo(x + (dx / d) * h * 0.4, y + (dy / d) * h * 0.4);
        ctx.closePath();
        ctx.fill();
      }
      for (const lf of c.leaves) {
        const u = lf.u, v = 1 - u;
        const x = 2 * v * u * cx + u * u * ex, y = 2 * v * u * cy + u * u * ey;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(lf.side > 0 ? -0.5 : Math.PI + 0.5);
        trefoil(ctx, lf.size, lift([70, 112, 50], (lf.tone - 0.5) * 30), night);
        ctx.restore();
      }
      ctx.restore();
    }
  }
  ctx.restore();

  // Stalk to the seed head.
  const H = T.stalkH * stretch;
  const hx = Math.sin(breeze) * H, hy = -Math.cos(breeze) * H;
  const stalkCol = T.type === 'bramble' ? [118, 58, 52] : T.type === 'thistle' ? [96, 124, 90] : [104, 138, 66];
  taper(ctx, 0, 0, hx * 0.2 + (T.nod || 0) * 2 * s, hy * 0.55, hx, hy, T.stalkW * 1.3, T.stalkW * 0.7, css(tint(stalkCol, night)));
  if (T.stem) {
    for (const sl of T.stem) {
      ctx.save();
      ctx.translate(hx * sl.at, hy * sl.at);
      ctx.rotate(sl.side > 0 ? -0.6 : Math.PI + 0.6);
      lobedLeaf(ctx, sl.len, sl.len * 0.3, 3, [96, 128, 104], night, true);
      ctx.restore();
    }
  }
  return { x: hx, y: hy };
}

// The head, at (x, y) in the plant's frame. `n` seeds left of 14.
export function drawSeedHead(ctx, w, x, y, night, t) {
  const T = w.thorn, s = w.s;
  const n = Math.max(0, w.seeds);
  const q = w.quiver || 0;
  const jx = q ? Math.sin(t * 60) * q * 2.4 : 0;
  ctx.save();
  ctx.translate(x + jx, y);
  if (T.type === 'dandelion') {
    const R = 12.5 * s;
    if (n > 0) {
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.35);
      glow.addColorStop(0, `rgba(255,253,244,${0.5 + q * 0.3})`);
      glow.addColorStop(0.7, 'rgba(255,253,244,0.18)');
      glow.addColorStop(1, 'rgba(255,253,244,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(0, 0, R * 1.35, 0, Math.PI * 2); ctx.fill();
    }
    // Each seed: a beak and a little parachute.
    const shown = Math.round(n * 2.2);
    for (let k = 0; k < shown; k++) {
      const a = (k / 31) * Math.PI * 2 + w.phase;
      const tip = R * (0.92 + ((k * 37) % 7) / 60);
      const cx = Math.cos(a), cy = Math.sin(a);
      ctx.strokeStyle = 'rgba(214,206,186,0.85)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(cx * 2 * s, cy * 2 * s); ctx.lineTo(cx * tip * 0.78, cy * tip * 0.78); ctx.stroke();
      ctx.strokeStyle = night > 0.5 ? 'rgba(236,232,222,0.85)' : 'rgba(255,254,250,0.95)';
      for (let f = -2; f <= 2; f++) {
        const b = a + f * 0.16;
        ctx.beginPath();
        ctx.moveTo(cx * tip * 0.78, cy * tip * 0.78);
        ctx.lineTo(Math.cos(b) * tip, Math.sin(b) * tip);
        ctx.stroke();
      }
    }
    // Reflexed bracts beneath, and the bare receptacle.
    ctx.fillStyle = css(tint([92, 120, 60], night));
    for (let k = -2; k <= 2; k++) {
      ctx.save();
      ctx.rotate(Math.PI / 2 + k * 0.45);
      ctx.beginPath(); ctx.ellipse(3.5 * s, 0, 3.5 * s, 0.9 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = css(tint([168, 142, 96], night));
    ctx.beginPath(); ctx.arc(0, 0, 2.3 * s, 0, Math.PI * 2); ctx.fill();
  } else if (T.type === 'thistle') {
    // Purple brush (thinner as it sheds), on a scaled cup.
    const top = 9 * s;
    ctx.lineCap = 'round';
    const shown = Math.round(n * 1.6);
    for (let k = 0; k < shown; k++) {
      const a = -Math.PI / 2 + ((k / Math.max(1, 22)) - 0.5) * 2.1;
      const len = top * (0.8 + ((k * 13) % 5) / 12);
      ctx.strokeStyle = k % 3 ? css(tint([178, 92, 176], night)) : css(tint([212, 140, 206], night));
      ctx.lineWidth = Math.max(0.7, 1.1 * s);
      ctx.beginPath(); ctx.moveTo(0, -3 * s); ctx.lineTo(Math.cos(a) * len, -3 * s + Math.sin(a) * len); ctx.stroke();
    }
    const g = ctx.createRadialGradient(-2 * s, -1 * s, 0.5, 0, 1 * s, 7 * s);
    g.addColorStop(0, css(tint([150, 176, 120], night)));
    g.addColorStop(1, css(tint([78, 104, 70], night)));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 1.5 * s, 5.6 * s, 6.2 * s, 0, 0, Math.PI * 2); ctx.fill();
    // Scales, each with a little spine.
    ctx.strokeStyle = css(tint([214, 222, 176], night), 0.7);
    ctx.lineWidth = Math.max(0.4, 0.6 * s);
    for (let row = 0; row < 3; row++) {
      for (let k = -2; k <= 2; k++) {
        const x0 = k * 2.2 * s + (row % 2) * 1.1 * s, y0 = -2 * s + row * 3 * s;
        if (Math.abs(x0) > 5 * s - row * 0.6 * s) continue;
        ctx.beginPath(); ctx.moveTo(x0 - 1.2 * s, y0 + 1.2 * s); ctx.quadraticCurveTo(x0, y0 - 0.8 * s, x0 + 1.2 * s, y0 + 1.2 * s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + Math.sign(x0 || 1) * 1.8 * s, y0 - 1.6 * s); ctx.stroke();
      }
    }
  } else if (T.type === 'foxtail') {
    // A nodding, bristled spike of grains.
    const L = 16 * s, nod = T.nod;
    const grains = Math.round(n * 1.8);
    for (let k = 0; k < grains; k++) {
      const u = k / Math.max(1, 25);
      const px = Math.sin(nod * u) * L * u * 0.9, py = -L * u * Math.cos(nod * u * 0.7);
      const side = k % 2 ? 1 : -1;
      const wdt = 2.4 * s * Math.sin(Math.PI * Math.min(1, u * 1.1 + 0.1));
      ctx.strokeStyle = css(tint([222, 206, 146], night), 0.8);
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(px + side * wdt, py); ctx.lineTo(px + side * (wdt + 4 * s), py - 2.5 * s); ctx.stroke();
      ctx.fillStyle = css(tint(k % 3 ? [172, 172, 92] : [196, 186, 112], night));
      ctx.beginPath(); ctx.ellipse(px + side * wdt * 0.5, py, 1.5 * s, 1.1 * s, 0.3 * side, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    // Berries: a cluster of drupelets, dark and glossy, in a green calyx.
    ctx.fillStyle = css(tint([86, 110, 56], night));
    for (let k = 0; k < 5; k++) {
      ctx.save(); ctx.rotate(Math.PI / 2 + (k - 2) * 0.55);
      ctx.beginPath(); ctx.ellipse(5 * s, 0, 2.8 * s, 0.9 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    const shown = Math.max(0, Math.round(n));
    for (let k = 0; k < shown; k++) {
      const a = k * 2.399, rr = Math.sqrt(k / 14) * 5.2 * s;
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr * 1.15 - 2 * s;
      const c = k % 4 === 0 ? [140, 30, 52] : [62, 22, 44];
      const g = ctx.createRadialGradient(px - 0.6 * s, py - 0.7 * s, 0.2, px, py, 2 * s);
      g.addColorStop(0, css(tint(lift(c, 90), night)));
      g.addColorStop(1, css(tint(c, night)));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(px, py, 1.9 * s, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}
