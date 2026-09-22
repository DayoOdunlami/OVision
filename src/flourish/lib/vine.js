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

// ── Lines ─────────────────────────────────────────────────────────
// A phrase is broken onto one to four lines — whichever lets it
// be written largest in the space it has — at spaces only, and each
// line is centred. Returns strokes in font units plus where the last
// line starts, so the reflection can mirror just that line.
const LINE = 1160;                 // font units from one baseline to the next

function lineStrokes(text) {
  const strokes = letter(text);
  let x0 = Infinity, x1 = -Infinity;
  for (const s of strokes) for (const p of s) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }
  return { strokes, x0, x1: Math.max(x1, x0 + 1) };
}

function layoutText(text, box) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const measured = new Map();
  const measure = (t) => {
    if (!measured.has(t)) measured.set(t, lineStrokes(t));
    return measured.get(t);
  };
  // Every way to cut the words into n consecutive lines.
  const cuts = (n, from = 1) => {
    if (n === 1) return [[]];
    const out = [];
    for (let c = from; c <= words.length - n + 1; c++) for (const rest of cuts(n - 1, c + 1)) out.push([c, ...rest]);
    return out;
  };
  let best = null;
  for (let n = 1; n <= Math.min(4, words.length); n++) {
    for (const cs of cuts(n)) {
      const bounds = [0, ...cs, words.length];
      const lines = [];
      for (let k = 0; k < n; k++) lines.push(measure(words.slice(bounds[k], bounds[k + 1]).join(' ')));
      const wU = Math.max(...lines.map((l) => l.x1 - l.x0));
      const hU = (n - 1) * LINE + 1000;
      // How big it could be written, a little against extra lines.
      const score = Math.min(box.w / wU, box.h / hU) * (1 - 0.05 * (n - 1));
      if (!best || score > best.score) best = { score, lines, wU };
    }
  }
  const strokes = [];
  let lastStart = 0;
  best.lines.forEach((l, k) => {
    const dx = (best.wU - (l.x1 - l.x0)) / 2 - l.x0;
    if (k === best.lines.length - 1) lastStart = strokes.length;
    for (const s of l.strokes) strokes.push(s.map(([x, y]) => [x + dx, y + k * LINE]));
  });
  return { strokes, lastStart, lines: best.lines.length };
}

// ── Build ─────────────────────────────────────────────────────────
// `box` is the space to fill, in CSS px. Options:
//   pace     speed multiplier (1 = gentle)
//   bloom    'blossom' | 'jasmine' | 'grapes' | 'mixed'
//   amount   'few' | 'some' | 'many' | 'prayer'
//   prayerDays   days prayed this week (for amount 'prayer')
//   family   [{ label, count }] — a branch for each person, with a
//            flower or cluster for each time they've been prayed for
export function buildVine(word, box, opts = {}) {
  const rand = seeded(word.toLowerCase());
  const r = (a, b) => a + rand() * (b - a);
  const pace = opts.pace || 1;
  const family = Array.isArray(opts.family) && opts.family.length ? opts.family : null;

  // With family branches, the word takes the upper part and the
  // branches hang down to the names below it.
  const wordBox = family ? { x: box.x, y: box.y, w: box.w, h: box.h * 0.56 } : box;
  const fill = box.w < 600 ? 0.92 : 0.86;
  const layout = layoutText(word, { w: wordBox.w * fill, h: wordBox.h * 0.86 });

  // Letters → stems and dots.
  const raw = [];
  const dotsU = [];
  let lastRaw = 0;
  layout.strokes.forEach((s, k) => {
    if (k === layout.lastStart) lastRaw = raw.length;
    if (s.length <= 3 && polyLen(s) < 80) {
      dotsU.push([s.reduce((m, p) => m + p[0], 0) / s.length, s.reduce((m, p) => m + p[1], 0) / s.length]);
      return;
    }
    const last = raw[raw.length - 1];
    // Strokes that pick up where the last one ended are one stem.
    if (last && dist(last[last.length - 1], s[0]) < 30) last.push(...s.slice(1));
    else raw.push(s.slice());
  });
  if (!raw.length) return null;

  // Fit to the box.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of [...raw.flat(), ...dotsU]) {
    minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
    minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
  }
  let lastMinY = Infinity;
  for (const s of raw.slice(lastRaw)) for (const p of s) lastMinY = Math.min(lastMinY, p[1]);
  const bw = maxX - minX, bh = maxY - minY;
  const sc = Math.min((wordBox.w * fill) / bw, (wordBox.h * 0.86) / bh);
  const ox = wordBox.x + (wordBox.w - bw * sc) / 2 - minX * sc;
  const oy = wordBox.y + (wordBox.h - bh * sc) / 2 - minY * sc;
  const toPx = (p) => [ox + p[0] * sc, oy + p[1] * sc];
  const em = 1000 * sc;
  // Stems a touch heavier than the leaves' stalks, so the letters lead.
  const base = Math.max(2.4, Math.min(16, em * 0.024));
  // A long phrase grows faster, so it still finishes in about half a
  // minute rather than one and a half.
  const lengthEm = raw.reduce((m, s) => m + polyLen(s), 0) / 1000;
  const speed = em * 0.62 * pace * Math.max(1, (lengthEm / 14) ** 0.95);

  // Stems, timed. The first starts at once. A later stem that begins
  // near stem already grown sprouts from it when growth passes that
  // point — so the A's crossbar branches off the A. Otherwise (the next
  // word, the next line) it starts as the one before is finishing, so a
  // phrase flows on rather than waiting letter by letter.
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
      const prev = stems[stems.length - 1];
      if (best < em * 0.35) { t0 = bt + 0.3; branch = true; }
      else t0 = prev.t0 + (prev.tEnd - prev.t0) * 0.75;
    }
    const w0 = branch ? base * 0.8 : base;
    const st = stem(pts, { w0, w1: w0 * 0.55, branch });
    timeStem(st, t0, speed, em, rand);
    stems.push(st);
  }
  const mains = stems.slice();
  const wordGrown = Math.max(...mains.map((st) => st.tEnd));

  // Tendrils: one off the very start, curling back, and one off each
  // long stem's end. None mid-word: they read as extra letters. A curl
  // that would wind into another stroke (inside an o, say) tries the
  // other way, and is left out if that's no better.
  const near = (p, reach, skip) => {
    for (const o of stems) {
      if (o === skip) continue;
      for (let i = 0; i < o.pts.length; i += 2) {
        const q = o.pts[i];
        if (Math.abs(p[0] - q[0]) < reach && Math.abs(p[1] - q[1]) < reach && dist(p, q) < reach) return true;
      }
    }
    return false;
  };
  const roomy = (pts) => {
    for (let k = Math.floor(pts.length * 0.3); k < pts.length; k += 2) if (near(pts[k], base * 2.2)) return false;
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

  // Family branches: "you are the branches". Once the word has grown,
  // a branch for each person sprouts from the lowest nearby stem and
  // curves down to their name.
  const branches = [];
  const labels = [];
  const blooms = [];
  const kinds = opts.bloom === 'mixed' ? ['blossom', 'jasmine', 'grapes'] : [opts.bloom || 'blossom'];
  const pickKind = () => kinds[Math.floor(rand() * kinds.length)];
  if (family) {
    const n = family.length;
    const labelY = box.y + box.h * 0.95;
    const labelSize = Math.max(15, Math.min(34, em * 0.12));
    const fruitR = em * 0.07;
    // Branch ends high enough for a hanging cluster to clear the name.
    const endY = labelY - labelSize * 1.15 - fruitR * 2.9;
    const wordBottom = oy + maxY * sc;
    const all = [];
    for (const st of mains) for (let i = 0; i < st.pts.length; i += 2) all.push([st, i]);
    family.forEach((person, k) => {
      const tx = box.x + box.w * (0.08 + (0.84 * (k + 0.5)) / n);
      // Where to sprout from: close in x, and low on the word.
      let bestA = null, bestScore = Infinity;
      for (const [st, i] of all) {
        const [x, y] = st.pts[i];
        const score = Math.abs(x - tx) + (wordBottom - y) * 1.4;
        if (score < bestScore) { bestScore = score; bestA = [st, i]; }
      }
      const [ast, ai] = bestA;
      const A = ast.pts[ai];
      const E = [tx, endY];
      const sway = (rand() - 0.5) * em * 0.5;
      const c1 = [A[0] + sway, A[1] + (E[1] - A[1]) * 0.55];
      const c2 = [E[0] - sway * 0.6, E[1] - (E[1] - A[1]) * 0.45];
      const pts = [];
      const steps = Math.max(12, Math.round(dist(A, E) / 2.5));
      for (let j = 0; j <= steps; j++) {
        const u = j / steps, v = 1 - u;
        pts.push([
          v * v * v * A[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * E[0],
          v * v * v * A[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * E[1],
        ]);
      }
      const st = stem(pts, { w0: base * 0.7, w1: base * 0.42, branch: true, person: k });
      timeStem(st, Math.max(wordGrown, ast.tt[ai]) + 0.5 + k * 0.8, speed * 0.8, em, rand);
      stems.push(st);
      branches.push(st);
      labels.push({ text: person.label, x: tx, y: labelY, size: labelSize, t0: st.tEnd + 0.4 });

      // A bloom for each time this person has been prayed for this
      // week, spaced up the lower part of the branch; none yet, a bud.
      const count = Math.max(0, Math.min(7, person.count | 0));
      const at = (f) => {
        const i = Math.min(pts.length - 1, Math.round((pts.length - 1) * f));
        return { i, p: pts[i] };
      };
      if (!count) {
        const { i, p } = at(1);
        blooms.push({ kind: 'bud', x: p[0], y: p[1], r: em * 0.06, rot: r(-0.4, 0.4), t0: st.tt[i] + 0.8, phase: r(0, 6) });
      }
      // Spaced up the branch from its end, and hung to alternate sides
      // on short stalks, so clusters don't pile up.
      const gap = Math.min(0.2, Math.max(fruitR * 2.6 / st.len, 0.62 / Math.max(1, count)));
      for (let j = 0; j < count; j++) {
        const { i, p } = at(1 - j * gap);
        const sx = j ? (j % 2 ? 1 : -1) * fruitR * 1.15 : 0;
        const kind = pickKind();
        const side = j % 2 ? 1 : -1;
        const nx = st.nx[i] * side, ny = st.ny[i] * side;
        const rr = kind === 'grapes' ? fruitR * (j ? 0.85 : 1) : em * 0.065;
        blooms.push({
          kind,
          x: kind === 'grapes' ? p[0] : p[0] + nx * rr * 0.7,
          y: kind === 'grapes' ? p[1] : p[1] + ny * rr * 0.7,
          r: rr, sx, rot: r(0, Math.PI), t0: st.tEnd + 0.6 + j * 0.5, phase: r(0, 6),
        });
      }
    });
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
    for (const b of blooms) if (dist(probes[1], [b.x, b.y]) < b.r * 1.6 + L * 0.4) return false;
    return true;
  };
  const leaves = [];
  for (const st of [...mains, ...branches]) {
    let side = rand() < 0.5 ? -1 : 1;
    let s = em * r(0.1, 0.18);
    let i = 0;
    const stop = st.person !== undefined ? st.len * 0.5 : st.len - em * 0.05;   // keep branch ends for blooms
    while (s < stop) {
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

  // Blooms on the word itself: the dots of i and j always; then more
  // along the stems — a few, some, many, or one for each day the family
  // has prayed this week. Each opens as growth passes its place.
  const dotKind = opts.bloom === 'jasmine' ? 'jasmine' : 'blossom';
  dotsU.map(toPx).forEach(([x, y], k) => {
    blooms.push({ kind: dotKind, x, y, r: em * 0.085, rot: r(0, Math.PI), t0: wordGrown + 0.4 + k * 0.6, phase: r(0, 6) });
  });
  const totalLen = mains.reduce((m, st) => m + st.len, 0);
  const amount = opts.amount || 'some';
  const want = amount === 'prayer' ? Math.max(0, Math.min(7, opts.prayerDays | 0))
    : Math.round(totalLen / (em * ({ few: 4.5, some: 2.4, many: 1.2 }[amount] || 2.4)));
  const extra = [];
  for (let tries = 0; extra.length < want && tries < want * 40 + 40; tries++) {
    // Pick a place, weighted by stem length.
    let pick = rand() * totalLen, st = mains[0];
    for (const m of mains) { if (pick < m.len) { st = m; break; } pick -= m.len; }
    const i = Math.min(st.pts.length - 1, Math.max(0, Math.round(pick / Math.max(1e-6, st.len) * (st.pts.length - 1))));
    const kind = pickKind();
    const rr = em * (kind === 'grapes' ? 0.068 : 0.066);
    const p = st.pts[i];
    let x = p[0], y = p[1];
    if (kind !== 'grapes') {
      // Sit just off the stem, on the outside of its curve.
      const b = bendAt(st, i, 8);
      const sd = Math.abs(b) * em > 1 ? (b > 0 ? -1 : 1) : (rand() < 0.5 ? -1 : 1);
      x += st.nx[i] * sd * rr * 0.75; y += st.ny[i] * sd * rr * 0.75;
    }
    // Grapes hang: their cluster is below the stem. Keep all of it clear
    // of the letters, so fruit never sits across a stroke.
    const cy = kind === 'grapes' ? y + rr * 1.4 : y;
    const probes = kind === 'grapes'
      ? [[x, y + rr * 1.1], [x, y + rr * 2.2], [x - rr * 0.75, y + rr * 1.2], [x + rr * 0.75, y + rr * 1.2]]
      : [[x, y]];
    if (probes.some((q) => near(q, rr * (kind === 'grapes' ? 0.5 : 0.85), kind === 'grapes' ? null : st))) continue;
    if ([...blooms, ...extra].some((o) => dist([o.x, o.y], [x, y]) < (o.r + rr) * 1.3)) continue;
    if (leaves.some((lf) => dist(lf.mid, [x, cy]) < rr + lf.L * 0.35)) continue;
    extra.push({ kind, x, y, r: rr, rot: r(0, Math.PI), t0: st.tt[i] + r(1.2, 2.4), phase: r(0, 6) });
  }
  blooms.push(...extra);
  if (!blooms.length && !family) {
    const lastMain = mains[mains.length - 1];
    const [x, y] = lastMain.pts[lastMain.pts.length - 1];
    blooms.push({ kind: dotKind, x, y, r: em * 0.085, rot: r(0, Math.PI), t0: wordGrown + 0.4, phase: r(0, 6) });
  }

  const grownAt = Math.max(...stems.map((st) => st.tEnd));
  const doneAt = Math.max(grownAt, ...leaves.map((l) => l.t0 + l.dur), ...blooms.map((b) => b.t0 + 3),
    ...labels.map((l) => l.t0 + 1.5));
  return {
    stems, leaves, blossoms: blooms, labels, em, base, grownAt, doneAt, wordGrown,
    bottom: oy + maxY * sc, top: oy + minY * sc, lastTop: oy + lastMinY * sc,
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
