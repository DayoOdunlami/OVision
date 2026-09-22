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

// Turn a list of points (px) into a stem.
function stem(pts, extra) {
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + dist(pts[i - 1], pts[i]));
  return { pts, s, len: s[s.length - 1], baked: 0, ...extra };
}

const LEAF_TONES = [
  ['#2d6a52', '#4f9469'],
  ['#3a7443', '#65a458'],
  ['#295d4d', '#478b72'],
  ['#44803f', '#7bb561'],
];

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
  const base = Math.max(2, Math.min(15, em * 0.02));   // stem width
  const speed = em * 0.95;                              // px per second
  const step = STEP * sc;

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
        if (o.tendril) continue;
        for (let i = 0; i < o.pts.length; i += 3) {
          const d = dist(o.pts[i], pts[0]);
          if (d < best) { best = d; bt = o.t0 + o.s[i] / speed; }
        }
      }
      const prev = stems.filter((o) => !o.tendril).pop();
      if (best < em * 0.35) { t0 = bt + 0.15; branch = true; }
      else t0 = prev.t0 + prev.len / speed;
    }
    const w0 = branch ? base * 0.78 : base;
    stems.push(stem(pts, { t0, w0, w1: w0 * 0.55, branch }));
  }
  const mains = stems.slice();

  // Tendrils: off the very start of the word (curling back), off each
  // long stem's end, and a few along the way.
  const heading = (st, i, j) => Math.atan2(st.pts[j][1] - st.pts[i][1], st.pts[j][0] - st.pts[i][0]);
  const turn = (st, from) => {
    // Which way the stem was bending as it finished — the curl follows.
    const a = heading(st, Math.max(0, from - 12), Math.max(1, from - 6));
    const b = heading(st, Math.max(0, from - 6), from);
    let d = b - a;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return Math.abs(d) < 0.02 ? (rand() < 0.5 ? -1 : 1) : Math.sign(d);
  };
  const addTendril = (x, y, h, len, dir, t0, w) => {
    stems.push(stem(curl(x, y, h, len, dir, em), { t0, w0: w, w1: w * 0.35, tendril: true }));
  };
  const first = mains[0];
  if (first.pts.length > 8) {
    addTendril(first.pts[0][0], first.pts[0][1], heading(first, 6, 0), em * 0.3, rand() < 0.5 ? -1 : 1, 0, base * 0.5);
  }
  for (const st of mains) {
    const n = st.pts.length;
    if (st.len > em * 0.6 && n > 14) {
      addTendril(st.pts[n - 1][0], st.pts[n - 1][1], heading(st, n - 6, n - 1), em * r(0.28, 0.4), turn(st, n - 1),
        st.t0 + st.len / speed, st.w1);
    }
  }
  const longest = [...mains].sort((a, b) => b.len - a.len)[0];
  const midCount = Math.min(4, Math.max(1, Math.round(longest.len / (em * 1.6))));
  for (let k = 0; k < midCount; k++) {
    const i = Math.floor(longest.pts.length * r(0.15, 0.85));
    const h = heading(longest, Math.max(0, i - 3), Math.min(longest.pts.length - 1, i + 3));
    const side = rand() < 0.5 ? -1 : 1;
    addTendril(longest.pts[i][0], longest.pts[i][1], h + side * 0.9, em * r(0.14, 0.22), side,
      longest.t0 + longest.s[i] / speed + 0.3, base * 0.4);
  }

  // Leaves along the stems (not the tendrils), alternating sides,
  // leaning forward the way the vine grows.
  const leaves = [];
  for (const st of mains) {
    let side = rand() < 0.5 ? -1 : 1;
    let s = em * r(0.08, 0.16);
    while (s < st.len - em * 0.04) {
      const i = Math.min(st.pts.length - 1, Math.round(s / step));
      side = -side;
      if (rand() > 0.12) {
        const th = heading(st, Math.max(0, i - 2), Math.min(st.pts.length - 1, i + 2));
        const small = st.branch ? 0.75 : 1;
        const L = em * r(0.12, 0.19) * small;
        leaves.push({
          x: st.pts[i][0], y: st.pts[i][1],
          th, ang: th + side * r(0.75, 1.25),
          L, W: L * r(0.2, 0.26), pl: L * r(0.12, 0.22),
          curl: r(-1, 1), flip: side > 0,
          tone: LEAF_TONES[Math.floor(rand() * LEAF_TONES.length)],
          t0: st.t0 + s / speed + 0.25,
          phase: r(0, Math.PI * 2),
          off: 0, av: 0,
        });
      }
      s += em * r(0.19, 0.3);
    }
  }

  const grownAt = Math.max(...stems.map((st) => st.t0 + st.len / speed));

  // Blossoms: the dots of the word; and if it has none, one at the end.
  const dots = dotsU.length ? dotsU.map(toPx) : [mains[mains.length - 1].pts[mains[mains.length - 1].pts.length - 1]];
  const blossoms = dots.map(([x, y], k) => ({
    x, y, r: em * 0.09, rot: r(0, Math.PI), t0: grownAt + 0.2 + k * 0.5, phase: r(0, 6),
  }));

  const doneAt = Math.max(grownAt, ...leaves.map((l) => l.t0 + 1.6), ...blossoms.map((b) => b.t0 + 2.4));
  return { stems, leaves, blossoms, em, base, speed, step, grownAt, doneAt, bottom: oy + maxY * sc, top: oy + minY * sc };
}
