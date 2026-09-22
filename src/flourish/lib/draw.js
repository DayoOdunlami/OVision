import { MATURE_S } from './vine.js';

// ═══════════════════════════════════════════════════════════════════
// Drawing the vine's parts. The shapes are few and drawn with care —
// the code only decides where they go.
// ═══════════════════════════════════════════════════════════════════

// Stem colours: fresh growth is lime and darkens to a deeper green over
// a few seconds; even when mature, each stem stays a little lighter
// toward its tip than at its base, as a real vine does.
const BODY_FRESH = hex('#b4d43d');
const BODY_MATURE = hex('#6c9a2e');
const CORE_FRESH = hex('#e3f28e');
const CORE_MATURE = hex('#a9cb55');
export const STALK = '#6f9a30';

function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const css = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const easeOutCubic = (x) => 1 - (1 - x) ** 3;
export const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// A gentle overshoot: a leaf opens a touch past full, then settles.
export const easeOutBack = (x) => {
  const c = 1.1;
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
};

// ── Stem ──────────────────────────────────────────────────────────
// Drawn as a filled outline (both edges offset from the centre line),
// not as stroked segments: one continuous shape, so no seams, and the
// width can taper smoothly to a point at a growing tip. It's filled in
// short pieces so colour can change along it — and so pieces that have
// finished growing and darkening can be drawn once into a keep canvas
// and never again (see bakeStem), leaving only young growth to redraw.
//
// While a tip is growing it sways a little from side to side — real
// shoots circle slowly as they grow, feeling for something to hold.
export const CHUNK = 24;
let bx = new Float32Array(0), by = new Float32Array(0), bw = new Float32Array(0);
let bnx = new Float32Array(0), bny = new Float32Array(0), bi = new Int32Array(0);

// Draw samples from index `from` onward: up to the growing tip, or up
// to index `until` (used when baking finished pieces).
export function drawStem(ctx, st, grown, t, taper, from = 0, until = -1) {
  if (grown <= 0) return;
  const { pts, s, nx, ny } = st;
  let n = from;
  while (n < pts.length - 1 && s[n + 1] <= grown) n++;
  if (until >= 0) n = Math.min(n, until);
  const growing = grown < st.len;
  const withTip = until < 0 && growing && n < pts.length - 1;
  const m = n - from + 1 + (withTip ? 1 : 0);
  if (m < 2) return;
  if (bx.length < m) {
    const cap = m * 2;
    bx = new Float32Array(cap); by = new Float32Array(cap); bw = new Float32Array(cap);
    bnx = new Float32Array(cap); bny = new Float32Array(cap); bi = new Int32Array(cap);
  }
  const sway = growing ? Math.min(1, (st.len - grown) / taper) : 0;
  const wob = Math.sin(t * 1.6 + st.phase) * st.w0 * 1.1 * sway;

  for (let k = 0; k < m; k++) {
    const i = Math.min(from + k, n);
    let px = pts[i][0], py = pts[i][1], sk = s[i];
    if (from + k > n) {
      const f = (grown - s[n]) / Math.max(1e-6, s[n + 1] - s[n]);
      px += (pts[n + 1][0] - px) * f;
      py += (pts[n + 1][1] - py) * f;
      sk = grown;
    }
    let w = st.w0 + (st.w1 - st.w0) * (sk / st.len);
    let off = 0;
    if (growing) {
      const u = (grown - sk) / taper;          // 0 at the tip
      if (u < 1) {
        w *= 0.18 + 0.82 * Math.sqrt(Math.max(0, u));
        off = wob * (1 - u) * (1 - u);
      }
    }
    bx[k] = px + nx[i] * off; by[k] = py + ny[i] * off;
    bw[k] = w; bnx[k] = nx[i]; bny[k] = ny[i]; bi[k] = i;
  }

  const colorAt = (k, fresh, mature) => {
    const i = bi[k];
    const age = clamp01((t - st.tt[i]) / MATURE_S);
    const toward = mix(mature, fresh, 0.28 * (s[i] / st.len));   // lighter toward the tip
    return css(mix(fresh, toward, easeOutCubic(age)));
  };

  // Body, then a lighter core set up and to the left: reads as round.
  for (const pass of [0, 1]) {
    const half = pass ? 0.18 : 0.5;
    const shift = pass ? -0.13 : 0;
    const fresh = pass ? CORE_FRESH : BODY_FRESH;
    const mature = pass ? CORE_MATURE : BODY_MATURE;
    for (let a = 0; a < m - 1; a += CHUNK) {
      const b = Math.min(m - 1, a + CHUNK + 1);   // overlap one step: no hairline
      ctx.fillStyle = colorAt((a + b) >> 1, fresh, mature);
      ctx.beginPath();
      for (let k = a; k <= b; k++) {
        const o = shift * bw[k], h = half * bw[k];
        ctx.lineTo(bx[k] + bnx[k] * h + o, by[k] + bny[k] * h + o);
      }
      for (let k = b; k >= a; k--) {
        const o = shift * bw[k], h = half * bw[k];
        ctx.lineTo(bx[k] - bnx[k] * h + o, by[k] - bny[k] * h + o);
      }
      ctx.closePath();
      ctx.fill();
    }
    // Rounded ends: the stem's start, and wherever this drawing ends
    // at the real end of the stem or its growing tip.
    const ends = [];
    if (from === 0) ends.push(0);
    if (until < 0) ends.push(m - 1);
    for (const k of ends) {
      const o = shift * bw[k];
      ctx.fillStyle = colorAt(k, fresh, mature);
      ctx.beginPath();
      ctx.arc(bx[k] + o, by[k] + o, half * bw[k], 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Draw into the keep canvas every whole piece of this stem that has
// finished growing and darkening; returns where live drawing starts.
export function bakeStem(ctx, st, grown, t, taper) {
  const { s, tt } = st;
  const n = s.length;
  const done = grown >= st.len && t - st.tEnd >= MATURE_S;
  if (done && !st.bakedAll) {
    drawStem(ctx, st, st.len, t, taper, st.bakeFrom || 0);
    st.bakedAll = true;
  }
  if (st.bakedAll) return n;
  let from = st.bakeFrom || 0;
  for (;;) {
    const end = from + CHUNK + 1;
    if (end >= n - 1) break;
    if (s[end] > grown - taper || t - tt[end] < MATURE_S) break;
    drawStem(ctx, st, grown, t, taper, from, end);
    from += CHUNK;
  }
  st.bakeFrom = from;
  return from;
}

// ── Leaf ──────────────────────────────────────────────────────────
// `p` 0→1 is how far it has unfolded: it starts as a thin blade lying
// along the stem, swings out and opens. A young leaf is paler and
// deepens as it ages; each half is shaded from base to tip.
export function drawLeaf(ctx, lf, p, extra, stemW, t) {
  if (p <= 0) return;
  const grow = easeOutBack(clamp01(p));
  const ang = lf.th + (lf.ang - lf.th) * easeOutCubic(clamp01(p)) + extra;
  const open = 0.12 + 0.88 * smoothstep(0.15, 1, p);
  const L = lf.L, W = lf.W * open, tipY = lf.curl * lf.W * 0.35;
  const young = 1 - clamp01((t - lf.t0) / 6);

  if (!lf.rgb) lf.rgb = lf.tone.map(hex);
  const YOUNG = [150, 196, 88];

  ctx.save();
  ctx.translate(lf.x, lf.y);
  ctx.rotate(ang);
  ctx.scale(grow, grow);

  ctx.strokeStyle = STALK;
  ctx.lineWidth = Math.max(1, stemW * 0.28);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(lf.pl * 0.5, tipY * 0.2, lf.pl, 0);
  ctx.stroke();
  ctx.translate(lf.pl, 0);

  const half = (sgn, base) => {
    const c = mix(base, YOUNG, young * 0.55);
    const g = ctx.createLinearGradient(0, 0, L, 0);
    g.addColorStop(0, css(mix(c, [20, 50, 30], 0.18)));
    g.addColorStop(1, css(mix(c, [225, 240, 170], 0.22)));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(L * 0.18, sgn * W * 1.15, L * 0.64, sgn * W * 1.0, L, tipY);
    ctx.quadraticCurveTo(L * 0.5, W * 0.06, 0, 0);
    ctx.fill();
  };
  const [dark, light] = lf.rgb;
  half(-1, lf.flip ? light : dark);
  half(1, lf.flip ? dark : light);

  ctx.strokeStyle = 'rgba(236, 244, 200, 0.42)';
  ctx.lineWidth = Math.max(0.6, L * 0.024);
  ctx.beginPath();
  ctx.moveTo(L * 0.04, 0);
  ctx.quadraticCurveTo(L * 0.5, W * 0.06, L * 0.9, tipY * 0.9);
  ctx.stroke();
  ctx.restore();
}

// ── Blossom ───────────────────────────────────────────────────────
// A closed bud that swells, then five petals open in turn.
export function drawBlossom(ctx, b, p, t) {
  if (p <= 0) return;
  const R = b.r;
  const sway = Math.sin(t * 0.9 + b.phase) * 0.06;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.rot + sway);

  const bud = smoothstep(0, 0.3, p);
  const bloom = smoothstep(0.25, 1, p);
  if (bloom < 1) {
    ctx.globalAlpha = 1 - bloom;
    ctx.fillStyle = '#e7a9b6';
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 0.28 * bud, R * 0.42 * bud, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  for (let k = 0; k < 5; k++) {
    const q = easeOutBack(clamp01(bloom * 1.6 - k * 0.15));
    if (q <= 0) continue;
    ctx.save();
    ctx.rotate((k * Math.PI * 2) / 5);
    ctx.scale(q, q);
    const g = ctx.createLinearGradient(0, 0, R, 0);
    g.addColorStop(0, '#f2b8c4');
    g.addColorStop(0.55, '#fbe3e6');
    g.addColorStop(1, '#fff8f4');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(R * 0.2, -R * 0.55, R * 0.92, -R * 0.52, R, 0);
    ctx.bezierCurveTo(R * 0.92, R * 0.52, R * 0.2, R * 0.55, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  if (bloom > 0.3) {
    ctx.globalAlpha = smoothstep(0.3, 0.8, bloom);
    ctx.fillStyle = '#e8b64a';
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b8862c';
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * R * 0.12, Math.sin(a) * R * 0.12, R * 0.035, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
