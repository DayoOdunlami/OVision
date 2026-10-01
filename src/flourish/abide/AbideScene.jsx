import { useEffect, useRef } from 'react';
import { buildVine, grownLength, stem, timeStem, seeded } from '../lib/vine.js';
import { drawStem, bakeStem, drawLeaf, drawBloom } from '../lib/draw.js';

// ═══════════════════════════════════════════════════════════════════
// AbideScene — the whole Abide practice on one canvas.
//
//   sky       follows the real clock: sun by day, moon and stars by
//             night, warm at dawn and dusk (Psalm 1: "day and night")
//   soil      along the foot of the screen
//   sow       a seed falls, settles into the soil, puts down roots
//   abide     a shoot rises and writes the word. It grows only while
//             you stay — paced to slow breathing (in 4s, out 6s) — and
//             simply waits if you leave
//   gather    the finished vine is drawn back and set into its place on
//             the vineyard
//   vineyard  one long vine of past words: a section for each word, with
//             a cluster of fruit for each day you abided with it
//
// Phases come from the parent; this reports progress, breath, grown
// and gathered back up.
// ═══════════════════════════════════════════════════════════════════

const FALL = 2.2, SINK = 0.8, REST = 0.7;
const GROW_AT = FALL + SINK + REST;
const GATHER_S = 3.4;
const BREATH_IN = 4, BREATH = 10;

// ── Sky ───────────────────────────────────────────────────────────
const SKY = [
  [0, '#24304a', '#3b4563'],
  [4.8, '#2c3754', '#4f4f6c'],
  [6.3, '#efcab0', '#f8e4d2'],
  [8.5, '#e8eee6', '#f7f3ea'],
  [16.5, '#ecefe4', '#f7f3ea'],
  [18.6, '#f0c3a1', '#f6dfca'],
  [20, '#38405e', '#5a5672'],
  [24, '#24304a', '#3b4563'],
];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixc = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

export function skyAt(h) {
  h = ((h % 24) + 24) % 24;
  let i = 0;
  while (i < SKY.length - 2 && SKY[i + 1][0] <= h) i++;
  const [h0, t0, b0] = SKY[i], [h1, t1, b1] = SKY[i + 1];
  const k = smooth(0, 1, (h - h0) / (h1 - h0));
  const top = mixc(hex(t0), hex(t1), k), bottom = mixc(hex(b0), hex(b1), k);
  const lum = (0.299 * top[0] + 0.587 * top[1] + 0.114 * top[2]) / 255;
  return { top, bottom, night: clamp01((0.62 - lum) / 0.3) };
}

// A stem from plain points, fully grown and mature — for the vineyard.
function still(pts, w0, w1) {
  const st = stem(pts, { w0, w1 });
  st.tt = new Float64Array(pts.length);
  st.t0 = 0; st.tEnd = 0; st.phase = 0;
  return st;
}
function bezier(a, c1, c2, b, n) {
  const out = [];
  for (let j = 0; j <= n; j++) {
    const u = j / n, v = 1 - u;
    out.push([
      v * v * v * a[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * b[0],
      v * v * v * a[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * b[1],
    ]);
  }
  return out;
}

// Consecutive days with the same word are one section of the vineyard.
export function groupEntries(entries) {
  const groups = [];
  for (const e of entries) {
    const key = e.key || e.word;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.days.push(e.date);
    else groups.push({ key, word: e.word, ref: e.ref, days: [e.date] });
  }
  return groups.slice(-8);
}

// Finished vineyard thumbnails, kept across visits to the page.
const thumbs = new Map();

export default function AbideScene({ phase, entry, entries, hour, onProgress, onBreath, onGrown, onGathered }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const live = useRef(null);
  live.current = { phase, entries, hour, onProgress, onBreath, onGrown, onGathered };

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    const bake = document.createElement('canvas'), bctx = bake.getContext('2d');
    const snap = document.createElement('canvas'), sctx = snap.getContext('2d');
    const soilC = document.createElement('canvas'), soilX = soilC.getContext('2d');
    const trunkC = document.createElement('canvas'), trunkX = trunkC.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const rand0 = seeded(entry.word + ' sky');
    const stars = Array.from({ length: 70 }, () => [rand0(), rand0() * 0.62, 0.4 + rand0() * 1.1, rand0() * 6]);

    let W = 0, H = 0, dpr = 1, soilY = 0, soilH = 0, soilPath = null;
    let vine = null, shoot = null, vineStart = 0, total = 1, crop = null, seedX = 0;
    let slots = [], vyEntries = null;
    let mode = null, rt = 0, sowT = 0, growT = 0, g = 0, rate = 1, gT = 0;
    let vyAlpha = 0, breath = '', lastP = -1, grownSent = false, gatheredSent = false;
    let target = null;

    // ── Layout ──────────────────────────────────────────────────────
    const layout = () => {
      const r = wrap.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(6e6 / (W * H)));
      for (const c of [canvas, bake, snap, soilC, trunkC]) {
        c.width = Math.round(W * dpr);
        c.height = Math.round(H * dpr);
      }
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      soilH = Math.max(70, Math.min(160, H * 0.16));
      soilY = H - soilH;

      // The word above the verse, the verse above the soil.
      const textBlock = Math.max(150, Math.min(260, H * 0.26));
      const top = 74;
      const box = { x: W * 0.05, y: top, w: W * 0.9, h: Math.max(120, soilY - textBlock - top) };
      vine = buildVine(entry.word, box, { pace: 0.8, bloom: 'blossom', amount: 'few' });
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.clearRect(0, 0, W, H);

      // The shoot: from the seed up to where the word begins.
      const first = vine.stems[0];
      const p0 = first.pts[0];
      seedX = Math.min(p0[0] - 10, Math.max(W * 0.1, p0[0] - W * 0.08));
      const a = [seedX, soilY + 2];
      const pts = bezier(a, [seedX - 10, soilY - (soilY - p0[1]) * 0.55], [p0[0] - (p0[0] - seedX) * 0.2, p0[1] + (soilY - p0[1]) * 0.35], p0, 80);
      shoot = stem(pts, { w0: vine.base * 1.15, w1: first.w0 });
      timeStem(shoot, 0, vine.em * 0.55, vine.em, seeded(entry.word + ' shoot'));
      vineStart = shoot.tEnd * 0.9;
      total = vineStart + vine.doneAt;

      // Where the finished vine sits, for drawing it back in.
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const st of vine.stems) for (const q of st.pts) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
      const pad = vine.em * 0.14;
      crop = { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };

      // Soil: a soft, uneven top edge and a little grain.
      soilX.setTransform(dpr, 0, 0, dpr, 0, 0);
      soilX.clearRect(0, 0, W, H);
      const rs = seeded('soil');
      soilPath = new Path2D();
      soilPath.moveTo(0, H);
      const edge = (x) => soilY + Math.sin(x * 0.013) * 3 + Math.sin(x * 0.041 + 1) * 1.6;
      for (let x = 0; x < W; x += 8) soilPath.lineTo(x, edge(x));
      soilPath.lineTo(W, edge(W));
      soilPath.lineTo(W, H);
      soilPath.closePath();
      soilX.beginPath();
      const sg = soilX.createLinearGradient(0, soilY, 0, H);
      sg.addColorStop(0, '#8d6c4b');
      sg.addColorStop(0.25, '#76583c');
      sg.addColorStop(1, '#4f3a29');
      soilX.fillStyle = sg;
      soilX.fill(soilPath);
      for (let i = 0; i < (W * soilH) / 260; i++) {
        const x = rs() * W, y = soilY + 4 + rs() * (soilH - 4);
        soilX.fillStyle = rs() < 0.5 ? 'rgba(40,26,16,0.35)' : 'rgba(200,170,130,0.28)';
        soilX.beginPath();
        soilX.arc(x, y, 0.6 + rs() * 1.6, 0, Math.PI * 2);
        soilX.fill();
      }
      vyEntries = null;   // relayout the vineyard too
    };

    // ── Vineyard ────────────────────────────────────────────────────
    const layoutVineyard = (entries) => {
      vyEntries = entries;
      const groups = groupEntries(entries);
      const N = Math.max(1, groups.length);
      const trunkY = 74 + (soilY - 74) * 0.5;
      const base = Math.max(3, Math.min(14, W * 0.008));
      // The trunk rises out of the soil at the left and runs across.
      const pts = [];
      for (let k = 0; k <= 160; k++) {
        const u = k / 160;
        const x = W * (0.05 + 0.9 * u);
        const rise = smooth(0, 0.16, u);
        const y = soilY + 4 + (trunkY - soilY - 4) * rise + Math.sin(u * 7.5) * H * 0.022 * smooth(0.1, 0.3, u);
        pts.push([x, y]);
      }
      const trunk = still(pts, base * 1.5, base * 0.6);
      const span = Math.min(0.74, 0.22 * N + 0.1);
      const gap = Math.max(14, H * 0.03);
      const labelH = 26;
      let sh = Math.min(trunkY - 74 - gap - labelH, soilY - trunkY - gap - labelH - 6);
      let sw = Math.min(W * 0.36, (1.7 * W * span) / N, sh * 2.3);
      sh = Math.min(sh, sw / 2);
      sw = sh * 2;
      trunkX.setTransform(dpr, 0, 0, dpr, 0, 0);
      trunkX.clearRect(0, 0, W, H);
      slots = groups.map((grp, k) => {
        const u = 0.56 - span / 2 + (span * (k + 0.5)) / N;
        // Kept on screen, whatever the count.
        const cx = Math.max(sw / 2 + 10, Math.min(W - sw / 2 - 10, W * (0.05 + 0.9 * u)));
        let ti = 0;
        while (ti < pts.length - 1 && pts[ti][0] < cx) ti++;
        const ty = pts[ti][1];
        const above = N === 1 || k % 2 === 0;
        const box = { x: cx - sw / 2, y: above ? ty - gap - sh : ty + gap, w: sw, h: sh };
        // A short stalk from the trunk to the section.
        const end = [cx + (k % 3 - 1) * sw * 0.08, above ? box.y + sh * 0.82 : box.y + sh * 0.2];
        const sp = bezier([cx, ty], [cx + sw * 0.05, (ty + end[1]) / 2], [end[0] - sw * 0.04, (ty + end[1]) / 2], end, 24);
        drawStem(trunkX, still(sp, base * 0.7, base * 0.45), Infinity, 1e6, 1);
        return { grp, box, above, label: grp.ref ? `${grp.ref} · ${grp.days.length} day${grp.days.length === 1 ? '' : 's'}` : '' };
      });
      drawStem(trunkX, trunk, trunk.len, 1e6, 1);
    };

    const thumbKey = (s) => `${s.grp.word}|${Math.round(s.box.w)}|${Math.round(s.box.h)}|${s.grp.days.length}|${dpr.toFixed(2)}`;
    const buildThumb = (s) => {
      const key = thumbKey(s);
      if (thumbs.has(key)) return thumbs.get(key);
      const c = document.createElement('canvas');
      c.width = Math.round(s.box.w * dpr);
      c.height = Math.round(s.box.h * dpr);
      const x = c.getContext('2d');
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const v = buildVine(s.grp.word, { x: 0, y: 0, w: s.box.w, h: s.box.h },
        { amount: 'prayer', prayerDays: Math.min(7, s.grp.days.length), bloom: 'grapes' });
      if (v) {
        for (const st of v.stems) drawStem(x, st, st.len, 1e6, v.base * 4);
        for (const lf of v.leaves) drawLeaf(x, lf, 1.5, 0, v.base, 1e6);
        for (const b of v.blossoms) drawBloom(x, b, 4, 0);
      }
      thumbs.set(key, c);
      return c;
    };

    const drawVineyard = (alpha, lastAlpha, night) => {
      if (alpha <= 0.01 || !slots.length) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = alpha;
      ctx.drawImage(trunkC, 0, 0);
      ctx.restore();
      ctx.save();
      let built = 0;
      slots.forEach((s, i) => {
        const a = alpha * (i === slots.length - 1 ? lastAlpha : 1);
        if (a <= 0.01) return;
        let th = thumbs.get(thumbKey(s));
        if (!th && built++ === 0) th = buildThumb(s);   // at most one new one a frame
        if (th) {
          ctx.globalAlpha = a;
          ctx.drawImage(th, s.box.x, s.box.y, s.box.w, s.box.h);
        }
        if (s.label) {
          ctx.globalAlpha = a * 0.85;
          ctx.fillStyle = night > 0.5 ? '#efe8d8' : '#55604c';
          ctx.font = `italic 500 ${Math.max(13, Math.min(18, W * 0.014))}px "Cormorant Garamond", Georgia, serif`;
          ctx.textAlign = 'center';
          ctx.fillText(s.label, s.box.x + s.box.w / 2, s.above ? s.box.y - 6 : s.box.y + s.box.h + 18);
        }
      });
      ctx.restore();
    };

    // ── The growing vine ────────────────────────────────────────────
    const drawGrowing = (c) => {
      const taper = vine.base * 4;
      const tv = g - vineStart;
      drawStem(c, shoot, grownLength(shoot, g), g, taper);
      if (tv > 0) {
        const parts = vine.stems.map((st) => {
          const gl = grownLength(st, tv);
          return [st, gl, gl > 0 ? bakeStem(bctx, st, gl, tv, taper) : 0];
        });
        c.save();
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.drawImage(bake, 0, 0);
        c.restore();
        for (const [st, gl, from] of parts) if (gl > 0 && !st.bakedAll) drawStem(c, st, gl, tv, taper, from);
        for (const lf of vine.leaves) {
          const p = (tv - lf.t0) / lf.dur;
          if (p <= 0) continue;
          const settle = reduced ? 0 : clamp01(p - 1);
          const gust = Math.pow(0.5 + 0.5 * Math.sin(rt * 0.33 - (lf.x / vine.em) * 0.8), 3);
          const sway = settle * (0.045 * Math.sin(rt * 1.2 + lf.phase) + 0.08 * gust * Math.sin(rt * 2.3 + lf.phase * 1.3));
          drawLeaf(c, lf, p, sway, vine.base, tv);
        }
        for (const b of vine.blossoms) drawBloom(c, b, (tv - b.t0) / 3, reduced ? 0 : rt);
      }
    };

    const drawSeed = (x, y, rot, a = 1) => {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(x, y);
      ctx.rotate(rot);
      const r = Math.max(5, vine.base * 1.2);
      ctx.fillStyle = '#6b4a2b';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.75, r * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,235,200,0.35)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.22, -r * 0.35, r * 0.2, r * 0.42, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // ── Phases ──────────────────────────────────────────────────────
    const enter = (m) => {
      if (m === 'gather') {
        // Picture the vine as it stands, to carry it into the vineyard.
        sctx.setTransform(1, 0, 0, 1, 0, 0);
        sctx.clearRect(0, 0, snap.width, snap.height);
        sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawGrowing(sctx);
        const s = slots[slots.length - 1];
        if (s) {
          buildThumb(s);
          const k = Math.min(s.box.w / crop.w, s.box.h / crop.h);
          target = { x: s.box.x + (s.box.w - crop.w * k) / 2, y: s.box.y + (s.box.h - crop.h * k) / 2, w: crop.w * k, h: crop.h * k };
        } else target = crop;
        gT = 0;
      }
      if (m === 'sow') { sowT = 0; growT = 0; g = 0; grownSent = false; lastP = -1; }
      if (m === 'vineyard' && mode === 'gather' && !gatheredSent) { gatheredSent = true; }
      mode = m;
    };

    // ── Frame ───────────────────────────────────────────────────────
    const frame = (dt) => {
      const P = live.current;
      rt += dt;
      if (P.entries !== vyEntries) layoutVineyard(P.entries);
      if (P.phase !== mode) enter(P.phase);

      // Growth: only while you're here, breathing pace.
      if (mode === 'sow') {
        sowT += dt;
        if (sowT >= GROW_AT) {
          growT += dt;
          const inhale = growT % BREATH < BREATH_IN;
          const want = reduced ? 3 : inhale ? 1.3 : 0.5;
          rate += (want - rate) * Math.min(1, dt * 1.6);
          g += dt * rate;
          const b = reduced ? '' : inhale ? 'in' : 'out';
          if (b !== breath) { breath = b; P.onBreath?.(b); }
          const p = clamp01(g / total);
          const q = Math.floor(p * 40);
          if (q !== lastP) { lastP = q; P.onProgress?.(p); }
          if (!grownSent && g >= total + 0.6) { grownSent = true; P.onGrown?.(); }
        }
      }
      if (mode === 'gather') {
        gT += dt;
        if (gT >= GATHER_S && !gatheredSent) { gatheredSent = true; P.onGathered?.(); }
      }

      const sky = skyAt(P.hour);
      const wantVy = mode === 'vineyard' ? 1 : mode === 'intro' ? 0.35 : mode === 'gather' ? smooth(0.15, 0.7, gT / GATHER_S) : 0;
      vyAlpha += (wantVy - vyAlpha) * (mode === 'gather' ? 1 : Math.min(1, dt * 2));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Sky.
      const grd = ctx.createLinearGradient(0, 0, 0, soilY);
      grd.addColorStop(0, rgb(sky.top));
      grd.addColorStop(1, rgb(sky.bottom));
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
      if (sky.night > 0) {
        for (const [sx, sy, sr, ph] of stars) {
          ctx.globalAlpha = sky.night * (0.45 + 0.35 * Math.sin(rt * 0.8 + ph));
          ctx.fillStyle = '#fff8e6';
          ctx.beginPath();
          ctx.arc(sx * W, sy * soilY, sr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      // Sun by day, moon by night, each along an arc over the soil.
      const h = ((P.hour % 24) + 24) % 24;
      const arc = (u) => [W * (0.08 + 0.84 * u), soilY - Math.sin(Math.PI * u) * (soilY - 90) * 0.92];
      const R = Math.max(18, Math.min(46, W * 0.03));
      if (h >= 5.8 && h <= 19.6) {
        const [x, y] = arc((h - 5.8) / 13.8);
        const glow = ctx.createRadialGradient(x, y, R * 0.2, x, y, R * 3.2);
        glow.addColorStop(0, 'rgba(255,220,150,0.55)');
        glow.addColorStop(1, 'rgba(255,220,150,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - R * 3.2, y - R * 3.2, R * 6.4, R * 6.4);
        ctx.fillStyle = '#f7cf78';
        ctx.beginPath();
        ctx.arc(x, y, R * 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const hn = h > 19.6 ? h - 19.6 : h + 4.4;
        const [x, y] = arc(hn / 10.2);
        const glow = ctx.createRadialGradient(x, y, R * 0.2, x, y, R * 2.6);
        glow.addColorStop(0, 'rgba(240,236,214,0.35)');
        glow.addColorStop(1, 'rgba(240,236,214,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - R * 2.6, y - R * 2.6, R * 5.2, R * 5.2);
        ctx.fillStyle = '#f2ecd8';
        ctx.beginPath();
        ctx.arc(x, y, R * 0.7, 0, Math.PI * 2);
        ctx.fill();
        // A crescent: the sky's own colour bites one side away.
        ctx.fillStyle = rgb(mixc(sky.top, sky.bottom, clamp01(y / soilY)));
        ctx.beginPath();
        ctx.arc(x + R * 0.32, y - R * 0.12, R * 0.62, 0, Math.PI * 2);
        ctx.fill();
      }

      // The vineyard, behind the soil so the trunk grows out of it.
      const lastA = mode === 'gather' ? smooth(0.86, 1, gT / GATHER_S) : 1;
      drawVineyard(vyAlpha, lastA, sky.night);

      // Soil, darker by night.
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(soilC, 0, 0);
      ctx.restore();
      if (sky.night > 0) {
        ctx.fillStyle = `rgba(16,20,36,${0.38 * sky.night})`;
        ctx.fill(soilPath);
      }

      if (mode === 'sow') {
        const sx = seedX;
        // Roots, once the seed is in.
        if (sowT > FALL + SINK * 0.5) {
          const rl = smooth(FALL, GROW_AT + 4, sowT) * soilH * 0.55;
          ctx.strokeStyle = 'rgba(236,220,190,0.55)';
          ctx.lineWidth = Math.max(1, vine.base * 0.25);
          ctx.lineCap = 'round';
          for (const [dx, bend] of [[-1, -0.4], [0, 0.15], [1, 0.4]]) {
            ctx.beginPath();
            ctx.moveTo(sx, soilY + 4);
            ctx.quadraticCurveTo(sx + dx * rl * 0.15 + bend * rl * 0.5, soilY + 4 + rl * 0.5, sx + dx * rl * 0.35, soilY + 4 + rl);
            ctx.stroke();
          }
        }
        if (sowT < FALL) {
          const f = sowT / FALL;
          drawSeed(sx + Math.sin(f * 7) * 10 * (1 - f), -20 + (soilY - 2 + 20) * f * f, f * 5);
        } else {
          const k = smooth(0, SINK, sowT - FALL);
          drawSeed(sx, soilY - 2 + k * 6, 5 + k * 0.4, 1 - smooth(GROW_AT, GROW_AT + 8, sowT) * 0.6);
          // A puff of soil where it lands.
          const pf = (sowT - FALL) / 0.9;
          if (pf < 1) {
            ctx.fillStyle = `rgba(150,118,84,${0.7 * (1 - pf)})`;
            for (let i = 0; i < 8; i++) {
              const a = Math.PI * (0.15 + (0.7 * i) / 7);
              const d = pf * 26;
              ctx.beginPath();
              ctx.arc(sx - Math.cos(a) * d, soilY - Math.sin(a) * d * 0.9 + pf * pf * 20, 1.8, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        drawGrowing(ctx);
      }

      if (mode === 'gather' && target) {
        // The vine, drawn back into its place on the vineyard.
        const u = easeInOut(clamp01(gT / GATHER_S));
        const rr = {
          x: crop.x + (target.x - crop.x) * u, y: crop.y + (target.y - crop.y) * u,
          w: crop.w + (target.w - crop.w) * u, h: crop.h + (target.h - crop.h) * u,
        };
        ctx.save();
        ctx.globalAlpha = 1 - smooth(0.86, 1, gT / GATHER_S);
        ctx.drawImage(snap, crop.x * dpr, crop.y * dpr, crop.w * dpr, crop.h * dpr, rr.x, rr.y, rr.w, rr.h);
        ctx.restore();
      }
    };

    layout();
    let raf = 0, last = performance.now();
    const loop = (now) => {
      frame(Math.min(0.05, (now - last) / 1000));
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    let rtm = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(rtm);
      rtm = setTimeout(() => { layout(); frame(0); }, 150);
    });
    ro.observe(wrap);
    if (import.meta.env.DEV) {
      window.__abideStep = (n = 60) => { for (let i = 0; i < n; i++) frame(1 / 60); return { mode, g: +g.toFixed(2), total: +total.toFixed(2) }; };
    }
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(rtm);
      ro.disconnect();
      if (import.meta.env.DEV) delete window.__abideStep;
    };
  }, [entry.word]);

  return (
    <div ref={wrapRef} className="ab-scene" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
