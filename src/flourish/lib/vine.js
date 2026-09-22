import { ALLURE } from './allure.js';

// ═══════════════════════════════════════════════════════════════════
// The vine's shape and timing — pure geometry, no drawing.
//
// A word is written in a single-stroke script (each letter one pen
// line), so the letters themselves are the vine: strokes that join
// become one continuous stem, detached strokes (the cross of an A)
// sprout as branches from the nearest bit of stem as growth passes it,
// and tiny strokes (the dot of an i) become blossoms. Leaves, tendril
// curls and blossoms are then placed along the stems by a random
// generator seeded from the word — so "Abide" grows the same vine every
// time, and only a different word grows a different one.
// ═══════════════════════════════════════════════════════════════════

const STEP = 4;             // font units between resampled stem points

// ── Seeded randomness ─────────────────────────────────────────────
export function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Lettering ─────────────────────────────────────────────────────
// Font units, y down (the font's y is up).
function letter(word) {
  const strokes = [];
  let x = 0;
  for (const ch of word) {
    const g = ALLURE[ch] ?? ALLURE[ch.toLowerCase()] ?? ALLURE[' '];
    for (const s of g[1]) {
      const pts = [];
      for (let i = 0; i + 1 < s.length; i += 2) pts.push([x + s[i], -s[i + 1]]);
      if (pts.length) strokes.push(pts);
    }
    x += g[0];
  }
  return strokes;
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function polyLen(pts) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]);
  return l;
}

// Centripetal Catmull–Rom through the font's points (it doesn't loop
// at the script's sharp turns the way the uniform kind does), then
// resampled to even spacing so arc length is just index × STEP.
function smooth(raw) {
  const pts = [];
  for (const p of raw) if (!pts.length || dist(pts[pts.length - 1], p) > 1.5) pts.push(p);
  if (pts.length < 2) return pts;
  const n = pts.length;
  const ext = (a, b) => [2 * a[0] - b[0], 2 * a[1] - b[1]];
  const P = [ext(pts[0], pts[1]), ...pts, ext(pts[n - 1], pts[n - 2])];
  const dense = [pts[0]];
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
    const t0 = 0;
    const t1 = t0 + Math.max(1e-3, Math.sqrt(dist(p0, p1)));
    const t2 = t1 + Math.max(1e-3, Math.sqrt(dist(p1, p2)));
    const t3 = t2 + Math.max(1e-3, Math.sqrt(dist(p2, p3)));
    const segs = Math.max(2, Math.ceil(dist(p1, p2) / 3));
    for (let j = 1; j <= segs; j++) {
      const t = t1 + ((t2 - t1) * j) / segs;
      const L = (a, b, ta, tb) => {
        const u = (t - ta) / (tb - ta);
        return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
      };
      const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
      const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
      dense.push(L(B1, B2, t1, t2));
    }
  }
  // Even resample.
  const out = [dense[0]];
  let carry = 0;
  for (let i = 1; i < dense.length; i++) {
    let a = dense[i - 1];
    const b = dense[i];
    let seg = dist(a, b);
    while (carry + seg >= STEP) {
      const u = (STEP - carry) / seg;
      a = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
      out.push(a);
      seg = dist(a, b);
      carry = 0;
    }
    carry += seg;
  }
  if (dist(out[out.length - 1], dense[dense.length - 1]) > STEP * 0.3) out.push(dense[dense.length - 1]);
  return out;
}

// A tendril: carries on from a stem's end and winds into a tightening
// curl, like the ones a real vine throws out to find a hold.
function curl(x, y, heading, len, dir, em) {
  const pts = [[x, y]];
  const n = Math.max(12, Math.round(len / 2));
  const ds = len / n;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    heading += (dir * (0.25 + 5 * t * t) * ds) / (em * 0.09);
    x += Math.cos(heading) * ds;
    y += Math.sin(heading) * ds;
    pts.push([x, y]);
  }
  return pts;
}

// Turn a list of points (px) into a stem: arc lengths and normals.
function stem(pts, extra) {
  const n = pts.length;
  const s = new Float64Array(n);
  const nx = new Float64Array(n), ny = new Float64Array(n);
  for (let i = 1; i < n; i++) s[i] = s[i - 1] + dist(pts[i - 1], pts[i]);
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const h = Math.atan2(b[1] - a[1], b[0] - a[0]);
    nx[i] = -Math.sin(h); ny[i] = Math.cos(h);
  }
  return { pts, s, nx, ny, len: s[n - 1], phase: 0, ...extra };
}

const wrap = (d) => {
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
};
const headingAt = (st, i, j) => Math.atan2(st.pts[j][1] - st.pts[i][1], st.pts[j][0] - st.pts[i][0]);
// Signed bend at sample i (radians per px): + turns clockwise on screen.
function bendAt(st, i, k = 4) {
  const n = st.pts.length;
  const a = Math.max(0, i - k), b = Math.min(n - 1, i + k);
  if (i - a < 1 || b - i < 1) return 0;
  const d = wrap(headingAt(st, i, b) - headingAt(st, a, i));
  return d / Math.max(1e-3, st.s[b] - st.s[a]);
}

// When growth reaches each sample. Not a constant speed: a shoot eases
// out of its start, slows through tight curves, and surges and rests a
// little along the way — so it reads as growing, not as being drawn.
function timeStem(st, t0, v, em, rand) {
  const n = st.pts.length;
  const tt = new Float64Array(n);
  tt[0] = t0;
  const ph = rand() * Math.PI * 2;
  const wave = 3.2 + rand() * 1.6;
  for (let i = 1; i < n; i++) {
    const ds = st.s[i] - st.s[i - 1];
    const bend = Math.exp(-Math.abs(bendAt(st, i)) * em * 0.045);
    const sprout = Math.min(1, 0.3 + st.s[i] / (em * 0.3));
    const pulse = 0.78 + 0.22 * Math.sin((st.s[i] / em) * wave + ph);
    tt[i] = tt[i - 1] + ds / (v * (0.5 + 0.5 * bend) * pulse * sprout);
  }
  st.t0 = t0;
  st.tt = tt;
  st.tEnd = tt[n - 1];
  st.phase = ph;
}

// Leaves: deep at the base of the leaf, lighter to the tip; tones range
// from blue-green through leaf green to olive.
const LEAF_TONES = [
  ['#2d6a52', '#4f9469'],
  ['#3a7443', '#65a458'],
  ['#295d56', '#4a8b7f'],
  ['#44803f', '#7bb561'],
  ['#56772d', '#8cab48'],
];

export const MATURE_S = 5;   // seconds for fresh growth to darken

// ── Build ─────────────────────────────────────────────────────────
// `box` is where the word should sit, in CSS px.
export function buildVine(word, box) {
  const rand = seeded(word.toLowerCase());
  const r = (a, b) => a + rand() * (b - a);

  // Letters → stems and dots.
  const raw = [];
  const dotsU = [];
  for (const s of letter(word)) {
    if (s.length <= 3 && polyLen(s) < 80) {
      dotsU.push([s.reduce((m, p) => m + p[0], 0) / s.length, s.reduce((m, p) => m + p[1], 0) / s.length]);
      continue;
    }
    const last = raw[raw.length - 1];
    // Strokes that pick up where the last one ended are one stem.
    if (last && dist(last[last.length - 1], s[0]) < 30) last.push(...s.slice(1));
    else raw.push(s.slice());
  }
  if (!raw.length) return null;

  // Fit the word to the box.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of [...raw.flat(), ...dotsU]) {
    minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
    minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
  }
  const bw = maxX - minX, bh = maxY - minY;
  // A little more of the width on a phone, where width is what's short.
  const fill = box.w < 600 ? 0.92 : 0.86;
  const sc = Math.min((box.w * fill) / bw, (box.h * 0.86) / bh);
  const ox = box.x + (box.w - bw * sc) / 2 - minX * sc;
  const oy = box.y + (box.h - bh * sc) / 2 - minY * sc;
  const toPx = (p) => [ox + p[0] * sc, oy + p[1] * sc];
  const em = 1000 * sc;
  // Stems a touch heavier than before, so the letters lead the leaves.
  const base = Math.max(2.4, Math.min(16, em * 0.024));
  const speed = em * 0.62;                              // px per second, before easing

  // Stems, timed. The first starts at once. A later stem that begins
  // near stem already grown sprouts from it when growth passes that
  // point — so the A's crossbar branches off the A — otherwise it
  // waits its turn.
  const stems = [];
  for (const rs of raw) {
    const pts = smooth(rs).map(toPx);
    if (pts.length < 2) continue;
    let t0 = 0, branch = false;
    if (stems.length) {
      let best = Infinity, bt = 0;
      for (const o of stems) {
        for (let i = 0; i < o.pts.length; i += 3) {
          const d = dist(o.pts[i], pts[0]);
          if (d < best) { best = d; bt = o.tt[i]; }
        }
      }
      if (best < em * 0.35) { t0 = bt + 0.3; branch = true; }
      else t0 = stems[stems.length - 1].tEnd;
    }
    const w0 = branch ? base * 0.8 : base;
    const st = stem(pts, { w0, w1: w0 * 0.55, branch });
    timeStem(st, t0, speed, em, rand);
    stems.push(st);
  }
  const mains = stems.slice();

  // Tendrils: one off the very start of the word, curling back, and one
  // off each long stem's end. None mid-word: they read as extra letters.
  // A curl that would wind into another stroke (inside an o, say) tries
  // the other way, and is left out if that's no better.
  const roomy = (pts) => {
    const reach = base * 2.2;
    for (let k = Math.floor(pts.length * 0.3); k < pts.length; k += 2) {
      const p = pts[k];
      for (const o of stems) {
        for (let i = 0; i < o.pts.length; i += 2) {
          const q = o.pts[i];
          if (Math.abs(p[0] - q[0]) < reach && Math.abs(p[1] - q[1]) < reach && dist(p, q) < reach) return false;
        }
      }
    }
    return true;
  };
  const addTendril = (x, y, h, len, dir, t0, w) => {
    for (const d of [dir, -dir]) {
      const pts = curl(x, y, h, len, d, em);
      if (!roomy(pts)) continue;
      const st = stem(pts, { w0: w, w1: w * 0.3, tendril: true });
      timeStem(st, t0, speed * 0.55, em, rand);
      stems.push(st);
      return;
    }
  };
  const first = mains[0];
  if (first.pts.length > 8) {
    addTendril(first.pts[0][0], first.pts[0][1], headingAt(first, 6, 0), em * 0.3, rand() < 0.5 ? -1 : 1, 0.4, base * 0.5);
  }
  for (const st of mains) {
    const n = st.pts.length;
    if (st.len > em * 0.6 && n > 14) {
      const b = bendAt(st, n - 8, 6);
      const dir = Math.abs(b) < 1e-4 ? (rand() < 0.5 ? -1 : 1) : Math.sign(b);
      addTendril(st.pts[n - 1][0], st.pts[n - 1][1], headingAt(st, n - 6, n - 1), em * r(0.26, 0.36), dir,
        st.tEnd, st.w1);
    }
  }

  // Leaves. Kept small and off the letters: each sits on the outside of
  // the curve where it can (so the insides of o, e, a stay open), and a
  // leaf that would lie across another stroke, or on another leaf, is
  // moved to the other side or left out.
  const clear = (st, si, x0, y0, ang, L, W, pl, placed) => {
    const cx = Math.cos(ang), cy = Math.sin(ang);
    const probes = [0.3, 0.6, 0.95].map((f) => [x0 + cx * (pl + f * L), y0 + cy * (pl + f * L)]);
    const reach = W * 0.9 + base * 0.6;
    for (const o of stems) {
      // Skip whole stems nowhere near the leaf.
      if (!o.box) {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const q of o.pts) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
        o.box = [x0, y0, x1, y1];
      }
      const [bx0, by0, bx1, by1] = o.box;
      if (probes.every((p) => p[0] < bx0 - reach || p[0] > bx1 + reach || p[1] < by0 - reach || p[1] > by1 + reach)) continue;
      for (let i = 0; i < o.pts.length; i += 2) {
        if (o === st && Math.abs(o.s[i] - st.s[si]) < (pl + L) * 1.4) continue;
        const q = o.pts[i];
        for (const p of probes) {
          if (Math.abs(p[0] - q[0]) < reach && Math.abs(p[1] - q[1]) < reach && dist(p, q) < reach) return false;
        }
      }
    }
    for (const lf of placed) if (dist(probes[1], lf.mid) < (L + lf.L) * 0.45) return false;
    return true;
  };
  const leaves = [];
  for (const st of mains) {
    let side = rand() < 0.5 ? -1 : 1;
    let s = em * r(0.1, 0.18);
    let i = 0;
    while (s < st.len - em * 0.05) {
      while (i < st.pts.length - 1 && st.s[i] < s) i++;
      side = -side;
      const b = bendAt(st, i, 8);
      // On a real bend, prefer the outside of it.
      let pref = side;
      if (Math.abs(b) * em > 2.5 && rand() < 0.85) pref = b > 0 ? -1 : 1;
      if (rand() > 0.1) {
        const th = headingAt(st, Math.max(0, i - 2), Math.min(st.pts.length - 1, i + 2));
        const L = em * r(0.075, 0.115) * (st.branch ? 0.85 : 1);
        const W = L * r(0.26, 0.32), pl = L * r(0.14, 0.24);
        const lean = r(0.7, 1.15);
        for (const sd of [pref, -pref]) {
          const ang = th + sd * lean;
          if (!clear(st, i, st.pts[i][0], st.pts[i][1], ang, L, W, pl, leaves)) continue;
          leaves.push({
            x: st.pts[i][0], y: st.pts[i][1],
            th, ang, L, W, pl,
            mid: [st.pts[i][0] + Math.cos(ang) * (pl + L * 0.6), st.pts[i][1] + Math.sin(ang) * (pl + L * 0.6)],
            curl: r(-1, 1), flip: sd > 0,
            tone: LEAF_TONES[Math.floor(rand() * LEAF_TONES.length)],
            t0: st.tt[i] + r(0.35, 0.8),
            dur: r(2.2, 3.2),
            phase: r(0, Math.PI * 2),
            off: 0, av: 0,
          });
          side = sd;
          break;
        }
      }
      s += em * r(0.13, 0.22);
    }
  }

  const grownAt = Math.max(...stems.map((st) => st.tEnd));

  // Blossoms: the dots of the word; and if it has none, one at the end.
  const lastMain = mains[mains.length - 1];
  const dots = dotsU.length ? dotsU.map(toPx) : [lastMain.pts[lastMain.pts.length - 1]];
  const blossoms = dots.map(([x, y], k) => ({
    x, y, r: em * 0.085, rot: r(0, Math.PI), t0: grownAt + 0.4 + k * 0.6, phase: r(0, 6),
  }));

  const doneAt = Math.max(grownAt, ...leaves.map((l) => l.t0 + l.dur), ...blossoms.map((b) => b.t0 + 3));
  return {
    stems, leaves, blossoms, em, base, grownAt, doneAt,
    // Fresh growth is lime and darkens as it matures; after this nothing
    // about the stems changes, so they can be drawn once and kept.
    matureAt: grownAt + MATURE_S + 0.5,
    bottom: oy + maxY * sc, top: oy + minY * sc,
  };
}

// How far along a stem growth has reached at time t (px of arc).
export function grownLength(st, t) {
  if (t <= st.t0) return 0;
  if (t >= st.tEnd) return st.len;
  const tt = st.tt;
  let lo = 0, hi = tt.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (tt[mid] <= t) lo = mid; else hi = mid;
  }
  const f = (t - tt[lo]) / Math.max(1e-6, tt[hi] - tt[lo]);
  return st.s[lo] + f * (st.s[hi] - st.s[lo]);
}
