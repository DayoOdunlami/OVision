import SpineFish, { buildPondMixFromCounts, ShadowQuality, ShadingMode } from '../src/app/pond/SpineFish.js';
import { VERSES } from '../src/app/content/verses.js';
import { Wind } from './wind.js';
import { stroke } from './brush.js';
import { rng, clamp01, easeInOut } from './noise.js';
import { grainTile, inkTile } from './paper.js';
import { drawInkKoi } from './inkKoi.js';
import { VineMoment } from './vineMoment.js';
import {
  PAPER, layout, bankEdge, paintBack, paintNear, paintGarden, paintBank, paintWater, padSprite,
  plantSprite, tuftSprite, mistSprite, plantSpots, sunAt, inkOf,
} from './paint.js';
import './study.css';

// ═══════════════════════════════════════════════════════════════════
// The study: one landscape, one dial (studio S).
//
// A hanging scroll: the pond at the foot (seen from above, as Quiet
// Waters sees it), the garden above it (from the side), the hills and
// sky at the top (far off). One sheet of paper, one brush, one wind.
// The dial sets how much colour: Paper (no world, a line of Scripture),
// Ink, Ink and wash, Colour. Touch the pond and the page slides down
// into it, the water opening to fill the screen; the koi carry on as
// they were.
//
// What moves: the koi (Quiet Waters' SpineFish, exactly), a few lines on
// the water, rings where a koi rises, the plants and grasses in one
// wind, mist drifting between the hills, now and then two or three
// birds. Everything else was painted once.
// ═══════════════════════════════════════════════════════════════════

const q = new URLSearchParams(location.search);
const STEPS = ['paper', 'ink', 'wash', 'colour'];
const NAMES = { paper: 'Paper', ink: 'Ink', wash: 'Ink and wash', colour: 'Colour' };
const reduced = q.get('rm') === '1' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

// ── Time and light ────────────────────────────────────────────────────
const hourOf = () => {
  const h = q.get('h');
  if (h != null && h !== '' && !Number.isNaN(Number(h))) return ((Number(h) % 24) + 24) % 24;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};
const lightAt = (h) => (h < 5.6 || h >= 20 ? 'night' : h < 7.6 ? 'dawn' : h >= 17.6 ? 'dusk' : 'day');

// ── The page ──────────────────────────────────────────────────────────
const root = document.getElementById('study');
root.innerHTML = `
  <canvas class="world a" aria-hidden="true"></canvas>
  <canvas class="world b" aria-hidden="true"></canvas>
  <div class="grain" aria-hidden="true"></div>
  <div class="night" aria-hidden="true"></div>
  <div class="moon" aria-hidden="true"></div>
  <section class="verse" aria-live="polite"><p class="verse-text"></p><p class="verse-ref"></p></section>
  <h1 class="sr">A landscape: the pond, the garden, the hills</h1>
  <button class="back" type="button" aria-label="Back to the landscape"><span aria-hidden="true">←</span></button>
  <p class="hint" aria-hidden="true">Touch the pond to go in</p>
  <div class="dial" role="radiogroup" aria-label="How much colour">
    <span class="dial-name"></span>
    ${STEPS.map((s) => `<button type="button" role="radio" class="dial-step s-${s}" data-step="${s}" aria-label="${NAMES[s]}"><i></i></button>`).join('')}
  </div>`;
const canvases = [...root.querySelectorAll('canvas.world')];
const grainEl = root.querySelector('.grain');
const nightEl = root.querySelector('.night');
const moonEl = root.querySelector('.moon');
const verseEl = root.querySelector('.verse');
const backEl = root.querySelector('.back');
const hintEl = root.querySelector('.hint');
const dialEl = root.querySelector('.dial');
const dialName = root.querySelector('.dial-name');

// The paper: one sheet, laid over every step with multiply.
const grain = grainTile(384, 7);
grainEl.style.backgroundImage = `url(${grain.toDataURL()})`;

// This week's verse, for Paper.
const week = Math.floor((Date.now() / 864e5 + 3) / 7);
const verse = VERSES[week % VERSES.length];
root.querySelector('.verse-text').textContent = verse.verse;
root.querySelector('.verse-ref').textContent = verse.ref;

// ── State ─────────────────────────────────────────────────────────────
// ?compare=1: the pond split down the middle, colour koi beside ink koi.
const compare = q.get('compare') === '1';
let mode = STEPS.includes(q.get('dial')) ? q.get('dial') : STEPS.includes(store.get('study.dial')) ? store.get('study.dial') : 'ink';
let hour = hourOf();
let light = lightAt(hour);
let W = 0, H = 0, dpr = 1, L = null, edge = null;
let inPond = q.get('view') === 'pond';
let pondU = inPond ? 1 : 0;          // 0 = the scroll, 1 = in the pond
let pondTo = pondU;
const wind = new Wind({ reduced });
const caches = new Map();            // mode → painted layers
const vineM = new VineMoment('Rooted');
const st = {
  koi: [], ripples: [], lines: [], birds: [], nextBirds: 40 + Math.random() * 40,
  stages: [1, 2, 3, 4, 4], pop: [0, 0, 0, 0, 0], cursor: { x: -9999, y: -9999 }, cursorUntil: 0,
  px: 0, py: 0, tx: 0, ty: 0, t: 0, frame: 0,
};
const KINDS = [
  { colour: 'red', fruit: true }, { colour: 'gold' }, { colour: 'white' }, { colour: 'pink' }, { colour: 'red' },
];

// ── Size ──────────────────────────────────────────────────────────────
function resize() {
  W = Math.max(1, Math.round(window.innerWidth));
  H = Math.max(1, Math.round(window.innerHeight));
  // A big screen at 2× is a lot of pixels: cap the backing store.
  dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3.4e6 / (W * H)));
  for (const c of canvases) {
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    c.style.width = W + 'px'; c.style.height = H + 'px';
  }
  L = layout(W, H);
  edge = bankEdge(L);
  caches.clear();
  placeMoon();
  if (!st.koi.length) makeKoi();
}

function placeMoon() {
  const s = sunAt(L, 'night');
  moonEl.style.left = `${s.x - s.r * 3}px`;
  moonEl.style.top = `${s.y - s.r * 3}px`;
  moonEl.style.width = moonEl.style.height = `${s.r * 6}px`;
}

// ── The koi: Quiet Waters' own, swimming in the pond's frame ─────────
// The pond is the whole screen, seen from above. On the scroll only a
// band of it shows, through the bank; there the koi keep to that band
// (only where they head next is chosen; how they swim is untouched).
const band = () => ({ y0: L.bankY / 2 + 34, y1: H - L.bankY / 2 - 24 });
function makeKoi() {
  ShadingMode.current = 'auto';
  ShadowQuality.blur = true;
  const size = Math.max(0.5, Math.min(1.15, Math.min(W, H) / 720)) * 0.9;
  const names = ['chagoi', 'kohaku', 'showa', 'sanke', 'ogon'];
  st.koi = names.map((name, i) => {
    const [v] = buildPondMixFromCounts({ [name]: 1 });
    const fish = new SpineFish(W, H, { ...v, sizeScale: (v.sizeScale || 1) * size });
    const plain = fish.pickWanderTarget.bind(fish);
    fish.pickWanderTarget = function pick(w, h) {
      plain(w, h);
      // On the scroll, three keep to the band you can see; two roam
      // the rest of the pond, under the bank, and come and go.
      if (pondTo < 0.5 && this.__band) {
        const b = band();
        this.target.y = Math.max(b.y0, Math.min(b.y1, this.target.y));
      }
    };
    const b = band();
    fish.__band = i < 3;
    if (fish.__band) {
      fish.shift(0, b.y0 + (b.y1 - b.y0) * ((i + 0.5) / 3) - fish.head.y);
      fish.target.y = Math.max(b.y0, Math.min(b.y1, fish.target.y));
    }
    return { fish, seed: 11 + i * 7 };
  });
  st.lines = Array.from({ length: 4 }, (_, i) => ({ x: Math.random() * W, y: 0, f: (i + 0.5) / 4, len: 0.06 + Math.random() * 0.06, v: 3 + Math.random() * 3, seed: 900 + i }));
  if (reduced) for (let i = 0; i < 120; i++) stepKoi(1 / 60);
}

function stepKoi() {
  const cur = st.frame < st.cursorUntil ? st.cursor : { x: -9999, y: -9999 };
  for (const k of st.koi) {
    k.fish.update(W, H, cur, {
      food: [],
      onBreak: (x, y) => { if (!reduced) st.ripples.push({ x, y, t: 0 }); },
    });
  }
}

// ── Painting a dial step's still layers (once) ────────────────────────
function sheet(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.__dpr = dpr;
  return { c, ctx };
}
function layersFor(m) {
  const key = `${m}:${W}x${H}:${light}`;
  if (caches.has(m) && caches.get(m).key === key) return caches.get(m);
  const back = sheet(W + L.m * 2, H * 0.42); paintBack(back.ctx, L, m, light);
  const near = sheet(W + L.m * 2, H * 0.45); paintNear(near.ctx, L, m);
  const garden = sheet(W + L.m * 2, H * 0.68); paintGarden(garden.ctx, L, m);
  // The bank only needs its own band of the page.
  const bankY0 = Math.max(0, L.bankY - H * 0.16), bankH = H * 0.22;
  const bank = sheet(W + L.m * 2, bankH); bank.ctx.translate(0, -bankY0); paintBank(bank.ctx, L, m, edge);
  bank.y0 = bankY0; bank.h = bankH;
  // Everything above the pond that doesn't move, flattened into one
  // sheet: drawn as a single image while the page is at rest.
  const still = sheet(W, H * 0.68);
  for (const [lay, h] of [[back, H * 0.42], [near, H * 0.45], [garden, H * 0.68]]) still.ctx.drawImage(lay.c, -L.m, 0, W + L.m * 2, h);
  const water = sheet(W, H); paintWater(water.ctx, W, H, m, light);
  const ps = Math.max(18, Math.min(W, H) * 0.06);
  const b = band();
  const r = rng(707);
  const pads = [0, 1, 2, 3, 4].map((i) => {
    const s = ps * (0.8 + r() * 0.5);
    return {
      ...padSprite(s, m, dpr, 600 + i, i === 1 || i === 3),
      x: W * [0.14, 0.82, 0.36, 0.66, 0.9][i], y: i < 4 ? b.y0 + (b.y1 - b.y0) * [0.2, 0.3, 0.88, 0.7][i] : H * 0.88,
      rot: r() * 6, phase: r() * 6,
    };
  });
  const ph = Math.min(H * 0.12, W * 0.17);
  const plants = KINDS.map((kind, i) => [0, 1, 2, 3, 4].map((s) => plantSprite(s, kind, ph, m, dpr, 1000 + i * 17)));
  const tuftH = H * 0.03;
  const tufts = [0, 1, 2].map((i) => tuftSprite(tuftH * (0.8 + i * 0.25), m, dpr, 1200 + i));
  const mist = mistSprite(W * 1.4, H * 0.07, dpr, 1300);
  const ink = inkTile(inkOf(m), 128, 11);
  const out = { key, back, near, garden, still, bank, water, pads, plants, tufts, mist, ink, inkPat: null };
  caches.set(m, out);
  // Keep at most the two steps on screen.
  for (const k of caches.keys()) if (k !== m && k !== mode && k !== prevMode) caches.delete(k);
  return out;
}

// ── One frame of the world, in a dial step ────────────────────────────
const tuftSpots = () => {
  const r = rng(1400);
  const out = [];
  // In clumps of two to five, with gaps between; some mirrored, some
  // smaller, so no two look stamped.
  const clump = (x, y, bank) => {
    const n = 2 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) out.push({ x: x + (r() - 0.5) * 26, y: y + r() * L.H * 0.008, k: Math.floor(r() * 3), ph: r() * 6, s: 0.6 + r() * 0.6, flip: r() < 0.5 ? -1 : 1, bank });
  };
  for (let x = r() * 60; x < W; x += 60 + r() * 120) clump(x, L.groundY + L.H * 0.006, false);
  for (let x = r() * 120; x < W; x += 140 + r() * 200) clump(x, L.bankY - L.H * 0.004, true);
  return out;
};
let tufts = null;

// Where a frame is laid on its canvas: the whole screen, or (comparing)
// one half of it.
let T = { s: 1, x: 0, y: 0 };
const base = (ctx) => ctx.setTransform(dpr * T.s, 0, 0, dpr * T.s, dpr * T.x, dpr * T.y);

function render(ctx, m) {
  const Lr = layersFor(m);
  if (!Lr.inkPat) Lr.inkPat = ctx.createPattern(Lr.ink, 'repeat');
  const e = easeInOut(pondU);
  const off0 = L.bankY / 2;
  const S = off0 * e;
  const par = (k) => st.px * k * (1 - e);
  base(ctx);
  ctx.globalAlpha = 1;
  ctx.fillStyle = `rgb(${PAPER[0]},${PAPER[1]},${PAPER[2]})`;
  ctx.fillRect(0, 0, W, H);
  // When the vine comes forward, the whole page leans in a little.
  const cam = vineM.camera(L);
  ctx.save();
  if (cam.s !== 1) { ctx.translate(cam.cx, cam.cy); ctx.scale(cam.s, cam.s); ctx.translate(-cam.cx, -cam.cy); }

  if (pondU < 0.999) {
    ctx.save();
    ctx.translate(0, -S);
    const dimAll = 1 - clamp01(e * 1.4);
    ctx.globalAlpha = 0.35 + 0.65 * dimAll;
    // The back: sky, sun, hills, the garden's still parts. At rest, one
    // image; when the hand moves (a mouse), the layers part a little.
    const parted = Math.abs(st.px) > 0.35 && e === 0;
    if (parted) ctx.drawImage(Lr.back.c, -L.m + par(2), 0, W + L.m * 2, H * 0.42);
    else ctx.drawImage(Lr.still.c, 0, 0, W, H * 0.68);
    drawBirds(ctx, m);
    // Mist drifting between the ranges.
    const drift = reduced ? 0 : Math.sin(st.t * 0.012) * W * 0.08 + st.t * 1.2;
    const mw = W * 1.4, mx = ((drift % mw) + mw) % mw;
    for (const [y, a] of [[L.farY + H * 0.02, 0.9], [L.nearY - H * 0.03, 0.7]]) {
      ctx.globalAlpha = a * (0.35 + 0.65 * dimAll);
      ctx.drawImage(Lr.mist, mx - mw, y, mw, H * 0.07);
      ctx.drawImage(Lr.mist, mx, y, mw, H * 0.07);
    }
    ctx.globalAlpha = 0.35 + 0.65 * dimAll;
    if (parted) {
      ctx.drawImage(Lr.near.c, -L.m + par(3.5), 0, W + L.m * 2, H * 0.45);
      ctx.drawImage(Lr.garden.c, -L.m + par(5), 0, W + L.m * 2, H * 0.68);
    }
    // Plants in their beds, and grass, in the one wind.
    const spots = plantSpots(L);
    spots.forEach((x, i) => {
      const sp = Lr.plants[i][st.stages[i]];
      const sway = wind.sway(x, 0.05 + st.stages[i] * 0.015, i * 0.37);
      const pop = st.pop[i] > 0 ? 1 - 0.12 * Math.sin(Math.PI * st.pop[i]) : 1;
      ctx.save();
      ctx.translate(x + par(5), L.bedTop - L.H * 0.006);
      ctx.rotate(sway);
      ctx.scale(pop, pop);
      ctx.drawImage(sp.c, -sp.W / 2, -sp.H + 2, sp.W, sp.H);
      ctx.restore();
    });
    if (!tufts) tufts = tuftSpots();
    for (const tf of tufts) {
      const sp = Lr.tufts[tf.k];
      ctx.save();
      ctx.translate(tf.x + par(tf.bank ? 7 : 5.5), tf.y);
      ctx.rotate(wind.sway(tf.x, 0.12, tf.ph));
      ctx.scale(tf.flip * tf.s, tf.s);
      ctx.drawImage(sp.c, -sp.W / 2, -sp.H + 1, sp.W, sp.H);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    vineM.draw(ctx, L, m);
    ctx.restore();
  }

  // The pond: its water opens from the bank to fill the screen.
  ctx.save();
  const pondOff = off0 - S;
  const k = 1 + 2.6 * Math.pow(e, 1.4);
  const cy = (L.bankY + H) / 2 - S;
  ctx.translate(W / 2, cy);
  ctx.scale(k, k);
  ctx.translate(-W / 2, -cy);
  ctx.beginPath();
  ctx.moveTo(edge[0][0] + par(7), edge[0][1] - S);
  for (const p of edge) ctx.lineTo(p[0] + par(7), p[1] - S);
  ctx.lineTo(W + 60, H + 80); ctx.lineTo(-60, H + 80);
  ctx.closePath();
  base(ctx);
  if (cam.s !== 1) { ctx.translate(cam.cx, cam.cy); ctx.scale(cam.s, cam.s); ctx.translate(-cam.cx, -cam.cy); }
  ctx.clip();
  ctx.fillStyle = `rgb(${PAPER[0]},${PAPER[1]},${PAPER[2]})`;
  ctx.fillRect(0, 0, W, H);
  ctx.translate(par(7), pondOff);
  // Only the part of the water that can show.
  const top = cy - (cy - (L.bankY - S - H * 0.03)) * k;
  const wy0 = Math.max(0, Math.min(H - 1, top - pondOff));
  ctx.drawImage(Lr.water.c, 0, wy0 * dpr, W * dpr, (H - wy0) * dpr, 0, wy0, W, H - wy0);
  drawWaterLines(ctx, m);
  for (const kf of st.koi) {
    if (m === 'colour') {
      kf.fish.draw(ctx);
    } else {
      drawInkKoi(ctx, kf.fish, { mode: m, fill: Lr.inkPat, seed: kf.seed, act: !st.noAct });
    }
  }
  for (const p of Lr.pads) {
    const bob = reduced ? 0 : Math.sin(st.t * 0.35 + p.phase) * 1.2;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.rotate(p.rot + (reduced ? 0 : Math.sin(st.t * 0.21 + p.phase) * 0.03));
    ctx.drawImage(p.c, -p.S / 2, -p.S / 2, p.S, p.S);
    ctx.restore();
  }
  drawRipples(ctx, m);
  ctx.restore();

  // The bank's stones and the lantern, in front, fading as the water opens.
  if (pondU < 0.999) {
    ctx.save();
    ctx.globalAlpha = 1 - clamp01(e * 1.8);
    ctx.translate(0, -S);
    ctx.drawImage(Lr.bank.c, -L.m + par(7), Lr.bank.y0, W + L.m * 2, Lr.bank.h);
    ctx.restore();
  }
  ctx.restore();
}

// A few lines on the water, drifting very slowly with the current.
function drawWaterLines(ctx, m) {
  const ink = inkOf(m);
  for (const ln of st.lines) {
    const y = H * (0.12 + ln.f * 0.78);
    const l = Math.min(W, H) * ln.len;
    const x = ((ln.x % (W + l * 2)) + W + l * 2) % (W + l * 2) - l;
    stroke(ctx, [[x, y], [x + l * 0.3, y - l * 0.07], [x + l * 0.65, y + l * 0.05], [x + l, y - l * 0.02]], { size: 1.6, fill: `rgb(${ink.join(',')})`, alpha: m === 'colour' ? 0.12 : 0.2, press: 'swell', seed: ln.seed, pool: 0, wobble: 0.6 });
  }
}

// Where a koi rises: two rings, painted, widening and fading.
function drawRipples(ctx, m) {
  const ink = inkOf(m);
  for (const rp of st.ripples) {
    for (let j = 0; j < 2; j++) {
      const age = rp.t - j * 0.7;
      if (age <= 0) continue;
      const rr = 6 + age * 14, a = Math.max(0, 0.32 * (1 - age / 4.5));
      if (a <= 0) continue;
      const pts = [];
      for (let i = 0; i <= 26; i++) {
        const t = (i / 26) * Math.PI * 1.85 + rp.x * 0.01;
        pts.push([rp.x + Math.cos(t) * rr, rp.y + Math.sin(t) * rr * 0.86]);
      }
      stroke(ctx, pts, { size: 1.5, fill: `rgb(${ink.join(',')})`, alpha: a * (m === 'colour' ? 0.7 : 1), press: 'swell', seed: 1700 + j, pool: 0, wobble: 0.4 });
    }
  }
}

// Now and then two or three birds cross the sky, slowly.
function drawBirds(ctx, m) {
  const ink = inkOf(m);
  for (const b of st.birds) {
    const flap = Math.sin(st.t * 2.2 + b.ph) * 0.5 + 0.5;
    const s = b.s;
    const x = b.x, y = b.y;
    stroke(ctx, [[x - s, y - s * 0.35 * flap], [x - s * 0.4, y - s * 0.12], [x, y]], { size: Math.max(1, s * 0.16), fill: `rgb(${ink.join(',')})`, alpha: 0.55, press: 'flick', seed: b.seed, pool: 0.3 });
    stroke(ctx, [[x, y], [x + s * 0.45, y - s * 0.15], [x + s, y - s * 0.4 * flap]], { size: Math.max(1, s * 0.14), fill: `rgb(${ink.join(',')})`, alpha: 0.5, press: 'flick', seed: b.seed + 1, pool: 0 });
  }
}

// ── The dial ──────────────────────────────────────────────────────────
let prevMode = null;
let reveal = null;              // { from, to, start }
let front = 0;                  // which canvas shows the current step
function setDial(next, fromEl) {
  if (next === mode) return;
  store.set('study.dial', next);
  const u = new URL(location.href);
  u.searchParams.set('dial', next);
  history.replaceState(null, '', u);
  const was = mode;
  mode = next;
  updateDial();
  if (was === 'paper' || next === 'paper') {
    root.classList.toggle('is-paper', next === 'paper');
    prevMode = null;
    if (next !== 'paper') { const c = canvases[front]; c.style.maskImage = c.style.webkitMaskImage = ''; }
    draw(true);
    return;
  }
  if (reduced) { draw(true); return; }
  // The new step spreads out from the dial, like colour into wet paper.
  prevMode = was;
  const r = fromEl.getBoundingClientRect();
  reveal = { x: r.left + r.width / 2, y: r.top + r.height / 2, start: performance.now() };
  front = 1 - front;
  canvases[front].style.zIndex = 2;
  canvases[1 - front].style.zIndex = 1;
}

function updateDial() {
  for (const b of dialEl.querySelectorAll('.dial-step')) b.setAttribute('aria-checked', String(b.dataset.step === mode));
  dialName.textContent = NAMES[mode];
  dialEl.classList.add('show-name');
  clearTimeout(updateDial.t);
  updateDial.t = setTimeout(() => dialEl.classList.remove('show-name'), 2200);
}
dialEl.addEventListener('click', (e) => {
  const b = e.target.closest('.dial-step');
  if (b) setDial(b.dataset.step, b);
});

// ── Into the pond, and back ──────────────────────────────────────────
function goPond(on) {
  pondTo = on ? 1 : 0;
  root.classList.toggle('in-pond', on);
  const u = new URL(location.href);
  if (on) u.searchParams.set('view', 'pond'); else u.searchParams.delete('view');
  history.replaceState(null, '', u);
  if (on) {
    hintEl.classList.remove('show');
    store.set('study.hinted', '1');
    // In the pond, the koi have all of it: each picks somewhere new.
    setTimeout(() => { for (const k of st.koi) if (k.fish.__band && !k.fish.isIdle) k.fish.pickWanderTarget(W, H); }, 900);
  } else {
    // Back on the scroll, the koi keep to the band they can be seen in.
    const b = band();
    for (const k of st.koi) if (k.fish.__band) k.fish.target.y = Math.max(b.y0, Math.min(b.y1, k.fish.target.y));
  }
  if (reduced) { pondU = pondTo; draw(true); }
}
backEl.addEventListener('click', () => goPond(false));

let down = null;
root.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button')) return;
  down = { x: e.clientX, y: e.clientY, t: performance.now() };
});
root.addEventListener('pointerup', (e) => {
  if (!down || e.target.closest('button')) return;
  const d = down;
  down = null;
  if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12 || performance.now() - d.t > 450 || mode === 'paper') return;
  const x = e.clientX, y = e.clientY;
  if (pondTo === 1) {
    // In the pond: the water rings, and the curious koi come to look.
    st.ripples.push({ x, y, t: 0 });
    st.cursor = { x, y }; st.cursorUntil = st.frame + 40;
    if (reduced) draw(true);
    return;
  }
  // While the vine is forward, a touch lets the garden settle back.
  if (vineM.on) { vineM.stop(); if (reduced) { vineM.k = 0; draw(true); } return; }
  // A plant grows one stage.
  const spots = plantSpots(L);
  const ph = Math.min(H * 0.12, W * 0.17);
  for (let i = 0; i < spots.length; i++) {
    if (Math.abs(x - spots[i]) < Math.max(26, ph * 0.35) && y < L.bedTop + 12 && y > L.bedTop - ph * 1.05) {
      st.stages[i] = (st.stages[i] + 1) % 5;
      st.pop[i] = 0.001;
      if (reduced) draw(true);
      return;
    }
  }
  // The vine, along the trellis: it comes forward and writes our word.
  if (y > L.trellisTop - 16 && y < L.wire2 + 10) {
    vineM.start(L);
    if (reduced) { vineM.t = 999; vineM.k = 1; draw(true); }
    return;
  }
  if (y > L.bankY + 6) goPond(true);
});
root.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse') { st.tx = (e.clientX / W) * 2 - 1; st.ty = (e.clientY / H) * 2 - 1; }
});
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pondTo === 1) goPond(false); });

// ── The loop ─────────────────────────────────────────────────────────
let last = performance.now();
let raf = 0;
const times = [];
let lite = false;
function draw(once = false) {
  root.classList.toggle('is-paper', mode === 'paper');
  nightEl.style.opacity = light === 'night' ? '1' : light === 'dusk' ? '0.25' : light === 'dawn' ? '0.15' : '0';
  root.dataset.light = light;
  if (mode === 'paper') return;
  if (reveal) {
    const k = clamp01((performance.now() - reveal.start) / 1500);
    const rad = easeInOut(k) * Math.hypot(W, H) * 1.15;
    const c = canvases[front];
    const mask = `radial-gradient(circle at ${reveal.x}px ${reveal.y}px, #000 ${rad}px, transparent ${rad + 180}px)`;
    c.style.maskImage = c.style.webkitMaskImage = mask;
    render(canvases[1 - front].getContext('2d'), prevMode);
    render(c.getContext('2d'), mode);
    if (k >= 1) { reveal = null; prevMode = null; c.style.maskImage = c.style.webkitMaskImage = ''; }
  } else if (compare) {
    // The same koi at the same moment, twice: today's colour, and the
    // painted step. (Their fins and tail move once a frame, in the first.)
    const ctx = canvases[front].getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgb(46,44,40)';
    ctx.fillRect(0, 0, canvases[front].width, canvases[front].height);
    const side = W > H;
    const sc = side ? Math.min((W - 30) / 2 / W, (H - 20) / H) : Math.min((H - 30) / 2 / H, (W - 20) / W);
    const w = W * sc, h = H * sc;
    const slots = side ? [[(W - w * 2 - 10) / 2, (H - h) / 2], [(W - w * 2 - 10) / 2 + w + 10, (H - h) / 2]]
      : [[(W - w) / 2, (H - h * 2 - 10) / 2], [(W - w) / 2, (H - h * 2 - 10) / 2 + h + 10]];
    [['colour', false], [mode === 'colour' ? 'ink' : mode, true]].forEach(([mm, noAct], i) => {
      T = { s: sc, x: slots[i][0], y: slots[i][1] };
      ctx.save();
      base(ctx);
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
      st.noAct = noAct;
      render(ctx, mm);
      ctx.restore();
    });
    st.noAct = false;
    T = { s: 1, x: 0, y: 0 };
  } else {
    canvases[front].style.zIndex = 2;
    canvases[1 - front].style.zIndex = 1;
    render(canvases[front].getContext('2d'), mode);
  }
}

function tick(now) {
  raf = requestAnimationFrame(tick);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (document.hidden) return;
  // On a slow tablet, draw every other frame (the world is slow anyway).
  if (!lite && dt > 0) {
    times.push(dt);
    if (times.length === 60) { const s = [...times].sort((a, b) => a - b); if (s[30] > 0.026) { lite = true; ShadowQuality.blur = false; } times.length = 0; }
  }
  st.frame++;
  st.t += dt;
  wind.step(dt);
  vineM.step(dt);
  // Parallax eases after the hand (or the tilt).
  st.px += (st.tx * 6 - st.px) * Math.min(1, dt * 1.5);
  // The move into (or out of) the pond: about a second and a half.
  if (pondU !== pondTo) {
    pondU += Math.sign(pondTo - pondU) * dt / 1.5;
    pondU = pondTo > pondU ? Math.min(pondTo, pondU) : Math.max(pondTo, pondU);
  }
  stepKoi();
  for (const ln of st.lines) ln.x += ln.v * dt;
  for (let i = st.ripples.length - 1; i >= 0; i--) { st.ripples[i].t += dt; if (st.ripples[i].t > 6) st.ripples.splice(i, 1); }
  for (let i = 0; i < st.pop.length; i++) if (st.pop[i] > 0) st.pop[i] = st.pop[i] + dt / 0.8 > 1 ? 0 : st.pop[i] + dt / 0.8;
  // Birds: at most one small flight every minute or so.
  st.nextBirds -= dt;
  if (st.nextBirds <= 0 && !st.birds.length && pondTo === 0) {
    const n = 2 + Math.floor(Math.random() * 2);
    const dir = Math.random() < 0.5 ? 1 : -1;
    for (let i = 0; i < n; i++) st.birds.push({ x: dir > 0 ? -30 - i * 26 : W + 30 + i * 26, y: H * (0.07 + Math.random() * 0.08) + i * 6, v: dir * (16 + Math.random() * 4), s: Math.min(W, H) * 0.012 * (0.9 + Math.random() * 0.3), ph: Math.random() * 6, seed: 1900 + i });
    st.nextBirds = 60 + Math.random() * 60;
  }
  for (const b of st.birds) b.x += b.v * dt;
  st.birds = st.birds.filter((b) => b.x > -120 && b.x < W + 120);
  if (lite && st.frame % 2) return;
  draw();
}

// ── Start ─────────────────────────────────────────────────────────────
resize();
updateDial();
dialEl.classList.remove('show-name');
root.classList.toggle('in-pond', inPond);
if (!store.get('study.hinted') && !inPond) {
  setTimeout(() => hintEl.classList.add('show'), 2500);
  setTimeout(() => hintEl.classList.remove('show'), 10000);
}
let rt = 0;
window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); tufts = null; draw(true); }, 150); });
setInterval(() => {
  const h = hourOf();
  if (lightAt(h) !== light) { hour = h; light = lightAt(h); caches.clear(); draw(true); }
}, 60000);
// ?vine=1 opens with the vine forward, writing the word.
if (q.get('vine') === '1' && !inPond) { vineM.start(L); if (reduced) { vineM.t = 999; vineM.k = 1; } }
if (reduced) {
  draw(true);
} else {
  raf = requestAnimationFrame(tick);
}
document.body.dataset.ready = '1';
