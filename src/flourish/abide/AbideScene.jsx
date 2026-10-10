import { useEffect, useRef } from 'react';
import { buildVine, grownLength, stem, timeStem, seeded } from '../lib/vine.js';
import { drawStem, bakeStem, drawLeaf, drawBloom } from '../lib/draw.js';
import { Field } from './field.js';
import { Vineyard } from './vineyard.js';
import { Wind } from './wind.js';
import { Ambient } from './ambient.js';
import { todayIso } from './words.js';
import { seasonLeaves, SeasonAir } from './season.js';

// ═══════════════════════════════════════════════════════════════════
// AbideScene — the whole Abide practice on one canvas.
//
//   sky       follows the real clock: sun by day, moon and stars by
//             night, warm at dawn and dusk (Psalm 1: "day and night");
//             and the season, by the calendar (season.js)
//   soil      along the foot of the screen
//   ground    before sowing, the parable of the sower to clear by hand:
//             a pile of engraved stones on the seed's spot, and thorns
//             that seed if handled roughly (field.js)
//   sow       a seed falls, settles into the soil, puts down roots
//   abide     a shoot rises and writes the word. It grows only while
//             you stay, paced by breath: by your own if you hold to
//             breathe in and let go to breathe out, otherwise by a slow
//             guided breath (in 4s, out 6s). It waits if you leave.
//   gather    the finished vine is drawn back and set into its place on
//             the vineyard
//   vineyard  one long vine of past words: a section for each word, with
//             a cluster of fruit for each day you abided with it. The
//             fruit stays green until that word's prayer has been
//             learned by heart in the Pray puzzle, then ripens; small
//             gold berries on its stalk are days the family prayed.
//
// Phases come from the parent; this reports progress, breath, grown,
// gathered, the ground left to clear, and where each vineyard section
// sits (so the page can lay real buttons over them).
// ═══════════════════════════════════════════════════════════════════

const FALL = 2.2, SINK = 0.8, REST = 0.7;
const GROW_AT = FALL + SINK + REST;
const GATHER_S = 3.4;
const BREATH_IN = 4, BREATH = 10;
const USER_LED_S = 14;   // after your last breath, how long before the guide resumes

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
// The season leans on the daytime sky a little.
const SEASON_TINT = {
  spring: [[236, 244, 230], 0.25],
  summer: [[226, 238, 244], 0.2],
  autumn: [[246, 228, 200], 0.3],
  winter: [[228, 234, 242], 0.35],
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixc = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"], [data-no-breath]';

export function skyAt(h, season) {
  h = ((h % 24) + 24) % 24;
  let i = 0;
  while (i < SKY.length - 2 && SKY[i + 1][0] <= h) i++;
  const [h0, t0, b0] = SKY[i], [h1, t1, b1] = SKY[i + 1];
  const k = smooth(0, 1, (h - h0) / (h1 - h0));
  let top = mixc(hex(t0), hex(t1), k), bottom = mixc(hex(b0), hex(b1), k);
  const lum = (0.299 * top[0] + 0.587 * top[1] + 0.114 * top[2]) / 255;
  const night = clamp01((0.62 - lum) / 0.3);
  const tint = SEASON_TINT[season];
  if (tint) {
    const day = 1 - night;
    top = mixc(top, tint[0], tint[1] * day);
    bottom = mixc(bottom, tint[0], tint[1] * 0.6 * day);
  }
  return { top, bottom, night };
}

// Everything a vine will draw, fully grown: stems and tendrils, the
// tips of its leaves, its blossoms.
function extentOf(v) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y, r = 0) => {
    if (x - r < x0) x0 = x - r; if (x + r > x1) x1 = x + r;
    if (y - r < y0) y0 = y - r; if (y + r > y1) y1 = y + r;
  };
  for (const st of v.stems) for (const p of st.pts) add(p[0], p[1], v.base);
  for (const lf of v.leaves) {
    const reach = lf.pl + lf.L;
    add(lf.x + Math.cos(lf.ang) * reach, lf.y + Math.sin(lf.ang) * reach, lf.W * 0.5);
  }
  for (const b of v.blossoms) add(b.x, b.y, b.r * 1.4);
  return { x0, y0, x1, y1 };
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

export default function AbideScene({
  phase, entry, entries, hour, season = 'summer', ground, learned, field, who = [], view = 'family',
  goodSoil = false, revealDays = 0, controlRef, textH = 0, onLayout,
  onNote, patience = 'balanced', onProgress, onBreath, onGrown, onGathered, onClearLeft, onCleared,
  onFieldEvent, onTapVine, onReveal,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const live = useRef(null);
  live.current = {
    phase, entries, hour, ground, learned, field, who, view, goodSoil, revealDays, onNote, patience, textH, onLayout,
    onProgress, onBreath, onGrown, onGathered, onClearLeft, onCleared, onFieldEvent, onTapVine, onReveal,
  };

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    const bake = document.createElement('canvas'), bctx = bake.getContext('2d');
    const snap = document.createElement('canvas'), sctx = snap.getContext('2d');
    const soilC = document.createElement('canvas'), soilX = soilC.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const rand0 = seeded(entry.word + ' sky');
    const stars = Array.from({ length: 70 }, () => [rand0(), rand0() * 0.62, 0.4 + rand0() * 1.1, rand0() * 6]);
    const air = new SeasonAir(season);
    // One wind for everything that moves on its own; the quiet life of
    // the place (grass, clouds, a rare bird). See abide-direction.
    const wind = new Wind({ reduced });
    const amb = new Ambient({ season, reduced });

    let W = 0, H = 0, dpr = 1, soilY = 0, soilH = 0, soilPath = null, edgePath = null;
    let vineExt = null, sentTop = -1, sentInset = -1, laidTextH = live.current.textH, skyA = 1;
    let vine = null, shoot = null, vineStart = 0, total = 1, crop = null, seedX = 0;
    let vyEntries = null, vyLearned = null, vyField = null, revealed = false;
    let mode = null, rt = 0, sowT = 0, growT = 0, g = 0, rate = 1, gT = 0;
    let vyAlpha = 0, breath = '', breathLed = false, lastP = -1, grownSent = false, gatheredSent = false;
    let target = null;
    let grd = null, grdLoading = false, dead = false, clearLeft = -1, clearedAt = -1, clearedSent = false;
    // Your own breath: held = breathing in.
    let held = false, lastUser = -1e9;
    const edge = (x) => soilY + Math.sin(x * 0.013) * 3 + Math.sin(x * 0.041 + 1) * 1.6;

    // ── Layout ──────────────────────────────────────────────────────
    const layout = () => {
      const r = wrap.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(6e6 / (W * H)));
      for (const c of [canvas, bake, snap, soilC]) {
        c.width = Math.round(W * dpr);
        c.height = Math.round(H * dpr);
      }
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      soilH = Math.max(70, Math.min(160, H * 0.16));
      soilY = H - soilH;

      // The word above the verse, the verse above the soil — laid out
      // together from what is really drawn, so a tendril, leaf or
      // blossom never reaches into the words. The page measures the
      // verse block (textH); the vine gets the rest, and the two are
      // centred as one piece in the sky.
      const textH = live.current.textH || Math.max(150, Math.min(260, H * 0.26));
      const top = 74, gap = Math.max(14, Math.min(28, H * 0.025)), side = 10;
      const room = soilY - 12 - top;
      const opts = { pace: 0.8, bloom: 'blossom', amount: live.current.goodSoil ? 'some' : 'few' };
      // Good soil (the field cleared without dropping a seed) bears more.
      let box = { x: W * 0.05, y: top, w: W * 0.9, h: Math.max(110, room - textH - gap) };
      vine = buildVine(entry.word, box, opts);
      let ext = extentOf(vine);
      // Shrink until everything the vine draws is inside its space.
      for (let i = 0; i < 4; i++) {
        const over = Math.max(0, ext.y1 - (box.y + box.h), top - ext.y0);
        const overX = Math.max(0, side - ext.x0, ext.x1 - (W - side));
        if (over < 1 && overX < 1) break;
        const ky = over ? Math.max(0.6, (box.h - over * 2.2) / box.h) : 1;
        const kx = overX ? Math.max(0.6, (box.w - overX * 2.2) / box.w) : 1;
        box = { x: box.x + (box.w * (1 - kx)) / 2, y: box.y + (box.h * (1 - ky)) / 2, w: box.w * kx, h: box.h * ky };
        vine = buildVine(entry.word, box, opts);
        ext = extentOf(vine);
      }
      // Centre vine + verse as one piece (a little above the middle).
      const used = ext.y1 - ext.y0 + gap + textH;
      const shift = Math.max(0, (room - used) * 0.42) + (top - ext.y0);
      if (Math.abs(shift) > 0.5) {
        box = { ...box, y: box.y + shift };
        vine = buildVine(entry.word, box, opts);
        ext = extentOf(vine);
      }
      vineExt = ext;
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.clearRect(0, 0, W, H);

      // The shoot: from the seed up to where the word begins.
      const first = vine.stems[0];
      const p0 = first.pts[0];
      // On a phone the stalk hugs the edge, out of the verse's way.
      seedX = W < 560 ? 14 : Math.min(p0[0] - 10, Math.max(W * 0.1, p0[0] - W * 0.08));
      const a = [seedX, soilY + 2];
      const pts = bezier(a, [seedX - 10, soilY - (soilY - p0[1]) * 0.55], [p0[0] - (p0[0] - seedX) * 0.2, p0[1] + (soilY - p0[1]) * 0.35], p0, 80);
      shoot = stem(pts, { w0: vine.base * 1.15, w1: first.w0 });
      timeStem(shoot, 0, vine.em * 0.55, vine.em, seeded(entry.word + ' shoot'));
      vineStart = shoot.tEnd * 0.9;
      // Tell the page where the verse goes: under the vine, and kept
      // clear of the shoot's stalk on a narrow screen.
      const verseTop = Math.round(vineExt.y1 + gap);
      const inset = Math.round(Math.max(16, Math.min(W * 0.22, seedX + vine.base * 1.2 + 8)));
      if (verseTop !== sentTop || inset !== sentInset) {
        sentTop = verseTop; sentInset = inset;
        live.current.onLayout?.({ verseTop, inset });
      }
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
      edgePath = new Path2D();
      soilPath.moveTo(0, H);
      edgePath.moveTo(0, edge(0));
      for (let x = 0; x < W; x += 8) { soilPath.lineTo(x, edge(x)); edgePath.lineTo(x, edge(x)); }
      soilPath.lineTo(W, edge(W));
      edgePath.lineTo(W, edge(W));
      soilPath.lineTo(W, H);
      soilPath.closePath();
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
      if (season === 'winter') {
        // Frost along the top of the soil.
        soilX.strokeStyle = 'rgba(244,248,255,0.75)';
        soilX.lineWidth = 3;
        soilX.stroke(edgePath);
        for (let i = 0; i < W / 6; i++) {
          const x = rs() * W;
          soilX.fillStyle = 'rgba(244,248,255,0.5)';
          soilX.beginPath();
          soilX.arc(x, edge(x) + 2 + rs() * 7, 0.6 + rs(), 0, Math.PI * 2);
          soilX.fill();
        }
      }
      air.resize(W, soilY);
      amb.resize(W, soilY, edge);
      vy.resize(W, H, soilY);
      vyEntries = null;   // and give it its data again
    };

    // ── Vineyard ────────────────────────────────────────────────────
    const vy = new Vineyard({
      wind,
      season,
      onTap: (e, row) => live.current.onTapVine?.(e, row),
      onReveal: (on) => live.current.onReveal?.(on),
    });
    const syncVineyard = () => {
      const P = live.current;
      vyEntries = P.entries; vyLearned = P.learned; vyField = P.field;
      vy.setData({ entries: P.entries, learned: P.learned, field: P.field, ensure: P.who });
    };
    if (controlRef) {
      controlRef.current = {
        zoom: (f) => vy.animateZoom(vy.zoom * f),
        home: () => vy.home(),
        pan: (d) => { vy.camX += d / vy.zoom; vy.clampCam(); },
      };
    }

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
          // In the one wind (which, while abiding, is the breath).
          const sway = settle * wind.sway(lf.x, 0.22, lf.phase);
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
        // …to its place in the vineyard: today, in the front-most row of
        // those who abided.
        syncVineyard();
        vy.focusToday();
        const rows = live.current.who.map((p) => vy.rowIndex(p)).filter((r) => r >= 0);
        const row = rows.length ? vy.rows[Math.min(...rows)].key : (vy.rows[0]?.key ?? '');
        const box = vy.vineRect(todayIso(), row);
        const k = Math.min(box.w / crop.w, box.h / crop.h) * 1.4;
        target = { x: box.x + (box.w - crop.w * k) / 2, y: box.y + box.h - crop.h * k, w: crop.w * k, h: crop.h * k };
        gT = 0;
      }
      if (m === 'ground' && !grd && !grdLoading && live.current.ground) {
        // The physics engine is the puzzle's; fetched only when needed.
        grdLoading = true;
        const gr = live.current.ground;
        import('matter-js').then(({ default: Matter }) => {
          if (dead) return;
          grd = new Field({
            Matter, W, H, soilY, edge, pileX: seedX,
            stones: gr.stones, weeds: gr.weeds, seed: gr.seed || 'ground',
            onNote: (t) => live.current.onNote?.(t),
            onEvent: (ev) => live.current.onFieldEvent?.(ev),
            patience: live.current.patience,
            wallBase: live.current.field?.wall || 0,
            compostBase: live.current.field?.compost || 0,
          });
          if (mode !== 'ground') grd.clearAll();
        });
      }
      if (mode === 'ground' && m !== 'ground' && grd) {
        // Leaving with some still there (Skip): clear the rest, gently.
        grd.clearAll();
      }
      if (m === 'sow') { sowT = 0; growT = 0; g = 0; grownSent = false; lastP = -1; }
      if (m === 'vineyard' && mode === 'gather' && !gatheredSent) { gatheredSent = true; }
      if (m === 'vineyard' && !revealed) {
        // Back on a new day: watch what grew overnight.
        revealed = true;
        const d = live.current.revealDays;
        if (d > 0 && mode !== 'gather') { vy.startReveal(d); live.current.onReveal?.(true); }
      }
      mode = m;
    };

    // ── Input: clearing the ground, and breathing ────────────────────
    const local = (e) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const onDown = (e) => {
      if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return;
      if (mode === 'ground' && grd) {
        const [x, y] = local(e);
        if (grd.down(x, y, e.pointerId, e.pointerType === 'touch')) wrap.style.cursor = 'grabbing';
        return;
      }
      if (mode === 'vineyard') {
        const [x, y] = local(e);
        vy.down(x, y, e.pointerId);
        return;
      }
      if (mode === 'sow') { held = true; lastUser = rt; }
    };
    const onMove = (e) => {
      if (mode === 'vineyard') {
        const [x, y] = local(e);
        vy.move(x, y, e.pointerId);
        return;
      }
      if (grd) {
        const [x, y] = local(e);
        if (grd.grab) { grd.move(x, y, e.pointerId); return; }
        if (mode === 'ground') wrap.style.cursor = grd.hover(x, y) ? 'grab' : '';
      }
    };
    const onUp = (e) => {
      if (mode === 'vineyard' && vy.ptrs.has(e.pointerId)) {
        const [x, y] = local(e);
        vy.up(x, y, e.pointerId);
        return;
      }
      if (grd?.grab) {
        const [x, y] = local(e);
        grd.up(x, y, e.pointerId);
        wrap.style.cursor = '';
      }
      if (held) { held = false; lastUser = rt; }
    };
    const isTyping = (e) => e.target instanceof Element && e.target.closest('input, textarea, select, button');
    const onWheel = (e) => {
      if (mode !== 'vineyard') return;
      e.preventDefault();
      const [x] = local(e);
      if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) vy.wheel(e.deltaY, x);
      else { vy.camX += e.deltaX / vy.zoom; vy.clampCam(); }
    };
    const onKeyDown = (e) => {
      if (mode === 'vineyard' && !isTyping(e)) {
        if (e.key === 'ArrowLeft') { vy.camX -= 80 / vy.zoom; vy.clampCam(); }
        else if (e.key === 'ArrowRight') { vy.camX += 80 / vy.zoom; vy.clampCam(); }
        else if (e.key === '+' || e.key === '=') vy.animateZoom(vy.zoom * 1.4);
        else if (e.key === '-') vy.animateZoom(vy.zoom / 1.4);
        return;
      }
      if (mode !== 'sow' || e.repeat || e.code !== 'Space' || isTyping(e)) return;
      e.preventDefault();
      held = true; lastUser = rt;
    };
    const onKeyUp = (e) => {
      if (e.code !== 'Space' || !held) return;
      held = false; lastUser = rt;
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    wrap.addEventListener('wheel', onWheel, { passive: false });

    // ── Frame ───────────────────────────────────────────────────────
    const frame = (dt) => {
      const P = live.current;
      rt += dt;
      if (P.entries !== vyEntries || P.learned !== vyLearned || P.field !== vyField) syncVineyard();
      vy.setView(P.view);
      vy.step(dt);
      if (P.phase !== mode) enter(P.phase);
      // The verse block changed size (fonts loaded, the screen turned):
      // lay the vine out around it again.
      if (P.textH !== laidTextH && mode !== 'gather') { laidTextH = P.textH; layout(); }

      // Growth: only while you're here, at the pace of breath.
      if (mode === 'sow') {
        sowT += dt;
        if (sowT >= GROW_AT) {
          growT += dt;
          const led = rt - lastUser < USER_LED_S || held;
          const inhale = led ? held : growT % BREATH < BREATH_IN;
          const want = reduced && !led ? 3 : inhale ? 1.3 : 0.5;
          rate += (want - rate) * Math.min(1, dt * 1.6);
          g += dt * rate;
          const b = reduced && !led ? '' : inhale ? 'in' : 'out';
          if (b !== breath || led !== breathLed) { breath = b; breathLed = led; P.onBreath?.(b, led); }
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
      if (grd) {
        if (grd.patience !== P.patience) grd.setPatience(P.patience);
        grd.step(dt);
        if (mode === 'ground') {
          const left = grd.remaining();
          if (left !== clearLeft) { clearLeft = left; P.onClearLeft?.(left); }
          if (left === 0 && clearedAt < 0) clearedAt = rt;
          if (clearedAt >= 0 && !clearedSent && rt - clearedAt > 0.9) { clearedSent = true; P.onCleared?.(grd.result()); }
        }
      }
      // The verse is read in stillness; the field's work is a little
      // quieter than the open moments.
      const reading = mode === 'sow' && sowT >= GROW_AT;
      wind.step(dt, { calm: reading ? 0.2 : mode === 'ground' ? 0.75 : 1, breath: mode === 'sow' ? breath : '' });
      amb.step(dt, wind, { mode, quiet: reading });
      if (!reduced) air.step(dt, rt, wind);

      const sky = skyAt(P.hour, season);
      const wantVy = mode === 'vineyard' ? 1 : mode === 'intro' ? 0 : mode === 'ground' ? 0 : mode === 'gather' ? smooth(0.15, 0.7, gT / GATHER_S) : 0;
      vyAlpha += (wantVy - vyAlpha) * (mode === 'gather' ? 1 : Math.min(1, dt * 2));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Sky.
      const sk = ctx.createLinearGradient(0, 0, 0, soilY);
      sk.addColorStop(0, rgb(sky.top));
      sk.addColorStop(1, rgb(sky.bottom));
      ctx.fillStyle = sk;
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
      // Far things step back behind the word while it grows: the sun or
      // moon fades where it would sit inside the letters.
      // So does it behind the verse.
      const behind = (x, y) => (mode === 'sow' || mode === 'gather') && vineExt
        && x > Math.min(vineExt.x0, sentInset) - R && x < Math.max(vineExt.x1, W - sentInset) + R
        && y > vineExt.y0 - R && y < sentTop + (P.textH || 0) + R;
      const celestial = (x, y) => {
        skyA += ((behind(x, y) ? 0.22 : 1) - skyA) * Math.min(1, dt * 1.2);
        ctx.globalAlpha = skyA;
      };
      if (h >= 5.8 && h <= 19.6) {
        const [x, y] = arc((h - 5.8) / 13.8);
        celestial(x, y);
        const glow = ctx.createRadialGradient(x, y, R * 0.2, x, y, R * 3.2);
        glow.addColorStop(0, 'rgba(255,220,150,0.55)');
        glow.addColorStop(1, 'rgba(255,220,150,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - R * 3.2, y - R * 3.2, R * 6.4, R * 6.4);
        ctx.fillStyle = season === 'winter' ? '#f6dc9c' : '#f7cf78';
        ctx.beginPath();
        ctx.arc(x, y, R * 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const hn = h > 19.6 ? h - 19.6 : h + 4.4;
        const [x, y] = arc(hn / 10.2);
        celestial(x, y);
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
        ctx.globalAlpha = 1;
        ctx.fillStyle = rgb(mixc(sky.top, sky.bottom, clamp01(y / soilY)));
        ctx.beginPath();
        ctx.arc(x + R * 0.32, y - R * 0.12, R * 0.62, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Clouds, and now and then a bird, in the sky.
      amb.drawSky(ctx, sky.night);

      // The vineyard: its own hillside when you're in it; a faint ghost
      // of its rows behind the field otherwise.
      const inVy = mode === 'vineyard' || mode === 'gather';
      vy.draw(ctx, {
        alpha: vyAlpha, night: sky.night, ghost: !inVy,
        hideToday: mode === 'gather', todayAlpha: mode === 'gather' ? smooth(0.86, 1, gT / GATHER_S) : 1,
      });

      // The soil (fading as the vineyard's hillside comes in), richer
      // where the thorns were taken carefully; then the field on it.
      const soilA = inVy ? 1 - vyAlpha : 1;
      if (soilA > 0.01) {
        ctx.save();
        ctx.globalAlpha = soilA;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(soilC, 0, 0);
        ctx.restore();
        if (sky.night > 0) {
          ctx.fillStyle = `rgba(16,20,36,${0.38 * sky.night})`;
          ctx.fill(soilPath);
        }
        const rich = grd ? grd.richness() : 0;
        if (rich > 0) {
          ctx.fillStyle = `rgba(52,30,12,${0.3 * rich})`;
          ctx.fill(soilPath);
        }
        amb.drawGrass(ctx, wind, sky.night);
        if (grd) { grd.wind = wind; grd.draw(ctx, sky.night, reduced); }
        ctx.restore();
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

      // The season's air, over everything but the words.
      // The season's air thins while the verse is read.
      if (!reduced) {
        ctx.save();
        ctx.globalAlpha = 0.15 + 0.85 * wind.calm;
        air.draw(ctx, rt, sky.night);
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
      window.__abideStep = (n = 60) => { for (let i = 0; i < n; i++) frame(1 / 60); return { mode, g: +g.toFixed(2), total: +total.toFixed(2), left: grd ? grd.remaining() : 0 }; };
      window.__abideField = () => grd;
      window.__abideVineyard = () => vy;
    }
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      clearTimeout(rtm);
      ro.disconnect();
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      wrap.removeEventListener('wheel', onWheel);
      if (import.meta.env.DEV) { delete window.__abideStep; delete window.__abideField; delete window.__abideVineyard; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.word, season]);

  return (
    <div ref={wrapRef} className="ab-scene" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
