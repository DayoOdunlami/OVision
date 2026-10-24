import { ShadowQuality } from '../../src/app/pond/SpineFish.js';
import { FoodBowl, feedGesture } from '../../src/app/pond/koiFood.js';
import { VERSES } from '../../src/app/content/verses.js';
import { Wind } from './wind.js';
import { stroke } from './brush.js';
import { washTone } from './wash.js';
import { rng, clamp01, easeInOut, smooth } from './noise.js';
import { grainTile, inkTile } from './paper.js';
import { PAPER, sunAt, inkOf, tuftSprite, mistSprite } from './paint.js';
import { layout, paintScene, paintFront, reedSpots, drawRim, shadowSprite } from './scene.js';
import { Pond } from './pond.js';
import { Garden } from './garden.js';
import { on } from './flags.js';
import './study.css';

// ═══════════════════════════════════════════════════════════════════
// The study, sprint 2: one landscape, one dial, two places to go in
// (studio S).
//
// Calmer than sprint 1: more paper, fewer things. Hills far off, the
// garden on the rise, and in front a round pond, seen across so it lies
// as an oval. Touch the pond and that same drawing un-squashes and
// grows until you're looking down into it, the koi growing with it.
// Touch the garden and you walk into it: clear the ground, sow the
// week's word, and the vine writes it on the trellis.
//
// Every change from sprint 1 sits behind a switch (flags.js); ?v=1 is
// sprint 1 exactly.
// ═══════════════════════════════════════════════════════════════════

const q = new URLSearchParams(location.search);
const STEPS = ['paper', 'ink', 'wash', 'colour'];
const NAMES = { paper: 'Paper', ink: 'Ink', wash: 'Ink and wash', colour: 'Colour' };
const reduced = q.get('rm') === '1' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};
const MOVE_S = 1.7;   // the move into a place, in seconds

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
  <p class="hint" aria-hidden="true"></p>
  <div class="prompt" aria-live="polite"><p class="prompt-word"></p><p class="prompt-text"></p></div>
  <p class="how" aria-live="polite"></p>
  <button class="skip" type="button">Clear it for me</button>
  <div class="dial" role="radiogroup" aria-label="How much colour">
    <span class="dial-name"></span>
    ${STEPS.map((s) => `<button type="button" role="radio" class="dial-step s-${s}" data-step="${s}" aria-label="${NAMES[s]}"><i></i></button>`).join('')}
  </div>`;
const canvases = [...root.querySelectorAll('canvas.world')];
const grainEl = root.querySelector('.grain');
const nightEl = root.querySelector('.night');
const moonEl = root.querySelector('.moon');
const backEl = root.querySelector('.back');
const hintEl = root.querySelector('.hint');
const promptEl = root.querySelector('.prompt');
const howEl = root.querySelector('.how');
const dialEl = root.querySelector('.dial');
const dialName = root.querySelector('.dial-name');
const skipEl = root.querySelector('.skip');

const grain = grainTile(384, 7);
grainEl.style.backgroundImage = `url(${grain.toDataURL()})`;

// This week's verse (for Paper) and word (for the garden).
const week = Math.floor((Date.now() / 864e5 + 3) / 7);
const verse = VERSES[week % VERSES.length];
root.querySelector('.verse-text').textContent = verse.verse;
root.querySelector('.verse-ref').textContent = verse.ref;

// ── State ─────────────────────────────────────────────────────────────
const compare = q.get('compare') === '1';
let mode = STEPS.includes(q.get('dial')) ? q.get('dial') : STEPS.includes(store.get('study.dial')) ? store.get('study.dial') : 'ink';
let light = lightAt(hourOf());
let W = 0, H = 0, dpr = 1, L = null;
const wind = new Wind({ reduced });
const caches = new Map();
const pond = new Pond({ reduced });
const garden = new Garden({
  word: verse.word, ref: verse.ref, reduced,
  onNote: (t) => { if (place === 'garden' && to === 1) say(t); },
  onPrompt: (w, t) => { if (place === 'garden' && to === 1) showPrompt(w, t); },
});
// A garden finished this week stays finished (?fresh=1 starts again).
const GKEY = 'study.garden';
garden.onDone = () => store.set(GKEY, String(week));
if (store.get(GKEY) === String(week) && q.get('fresh') !== '1') garden.restoreDone();
// Nobody gets stuck: after a while in the garden, a quiet way through.
let fieldT = { t: 0, done: 0 };
skipEl.addEventListener('click', () => { garden.clearAll(); skipEl.classList.remove('show'); st.dirty = true; });
const bowl = new FoodBowl();
// Which place, and how far in (0 the landscape, 1 there).
const start = q.get('view');
let place = start === 'garden' && on('garden') ? 'garden' : 'pond';
let U = start === 'pond' || (start === 'garden' && on('garden')) ? 1 : 0;
let to = U;
const st = { birds: [], nextBirds: 14 + Math.random() * 12, t: 0, frame: 0, noAct: false, dirty: true };

// ── Size ──────────────────────────────────────────────────────────────
function resize() {
  W = Math.max(1, Math.round(window.innerWidth));
  H = Math.max(1, Math.round(window.innerHeight));
  dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3.4e6 / (W * H)));
  for (const c of canvases) {
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    c.style.width = W + 'px'; c.style.height = H + 'px';
  }
  L = layout(W, H, on('squash') ? 0.5 : 1);
  caches.clear();
  pond.resize(W, H, L);
  garden.resize(W, H, L);
  pond.setInside(place === 'pond' && to === 1);
  placeMoon();
  st.dirty = true;
}

function placeMoon() {
  const s = sunAt(L, 'night');
  moonEl.style.left = `${s.x - s.r * 3}px`;
  moonEl.style.top = `${s.y - s.r * 3}px`;
  moonEl.style.width = moonEl.style.height = `${s.r * 6}px`;
}

// How each step's washes are laid ('richer' off: thinner and greyer, as
// the calmer study had them). Set before anything is painted.
function tone(m) {
  const muted = m === 'wash' && !on('richer');
  washTone.gain = muted ? 0.62 : 1;
  washTone.mute = muted ? 0.35 : 0;
}

// ── A dial step's still layers, painted once ─────────────────────────
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
  tone(m);
  const scene = sheet(W, H); paintScene(scene.ctx, L, m, light);
  const front = sheet(W, H); paintFront(front.ctx, L, m);
  const reedH = Math.max(18, H * 0.035);
  const reeds = [0, 1, 2].map((i) => tuftSprite(reedH * (0.9 + i * 0.25), m, dpr, 1200 + i));
  const mist = mistSprite(W * 1.4, H * 0.06, dpr, 1300);
  const band = L.nearY - L.farY + H * 0.1;
  const shadow = shadowSprite(W * 0.8, band, m, dpr, 1350);
  const out = { key, scene, front, reeds, mist, shadow, band, ink: inkTile(inkOf(m), 128, 11), inkPat: null };
  caches.set(m, out);
  for (const k of caches.keys()) if (k !== m && k !== mode && k !== prevMode) caches.delete(k);
  return out;
}

// ── One frame, in a dial step ─────────────────────────────────────────
let T = { s: 1, x: 0, y: 0 };
const base = (ctx) => ctx.setTransform(dpr * T.s, 0, 0, dpr * T.s, dpr * T.x, dpr * T.y);
let reeds = null;

function render(ctx, m) {
  tone(m);
  const Lr = layersFor(m);
  if (!Lr.inkPat) Lr.inkPat = ctx.createPattern(Lr.ink, 'repeat');
  base(ctx);
  ctx.globalAlpha = 1;
  ctx.fillStyle = `rgb(${PAPER.join(',')})`;
  ctx.fillRect(0, 0, W, H);
  const e = easeInOut(U);
  const smoothMove = on('smoothmove') || place === 'garden';
  const E = smoothMove ? e : 0;                    // how far the camera has gone
  const pv = pond.view(place === 'pond' ? E : 0, { squash: on('squash') });
  const gv = garden.view(place === 'garden' ? E : 0);
  // The landscape camera follows whichever place you're going into, so
  // the world around it comes with it as it grows.
  let land = 1, cam = null;
  if (place === 'pond' && E > 0) {
    const k = pv.s / pv.s0;
    cam = [pv.x, pv.y, k, L.pond.cx, L.pond.cy];
    land = 1 - smooth(0.12, 0.85, E);
  } else if (place === 'garden' && E > 0) {
    const k = gv.u / L.garden.u;
    cam = [gv.x, gv.y, k, L.garden.x, L.garden.y];
    land = 1 - 0.88 * smooth(0.05, 0.75, E);
  }
  if (!smoothMove) land = 1 - smooth(0, 1, e);
  const withCam = (fn) => {
    ctx.save();
    if (cam) { ctx.translate(cam[0], cam[1]); ctx.scale(cam[2], cam[2]); ctx.translate(-cam[3], -cam[4]); }
    ctx.globalAlpha = land;
    fn();
    ctx.restore();
    ctx.globalAlpha = 1;
  };
  const opts = { inkPat: Lr.inkPat, dpr, t: st.t, fullsize: on('fullsize'), noAct: st.noAct };
  const food = on('touch') ? bowl : null;
  const entering = place === 'pond' && smoothMove && E > 0;
  const showLand = land > 0.002;
  // Behind: sky, hills, the ground, and the garden on its rise.
  if (showLand) {
    withCam(() => {
      ctx.drawImage(Lr.scene.c, 0, 0, W, H);
      hillsLife(ctx, Lr, m, land);
      ctx.globalAlpha = 1;
      if (place !== 'garden') garden.draw(ctx, garden.view(0), m, { dpr, t: st.t, wind, alpha: land });
    });
  }
  // The pond: on the landscape, or growing as you go in.
  if (entering) {
    pond.draw(ctx, pv, m, { ...opts, bowl: food });
    if (E < 0.999) drawRim(ctx, pv.x, pv.y, pv.s * pond.Rc, pv.s * pond.Rc * pv.q, m, 1 - smooth(0.4, 0.95, E), L.u * (1 + E));
  } else if (showLand) {
    withCam(() => {
      const v0 = pond.view(0, { squash: on('squash') });
      pond.draw(ctx, v0, m, opts);
      drawRim(ctx, v0.x, v0.y, v0.s * pond.Rc, v0.s * pond.Rc * v0.q, m, 1, L.u);
    });
  }
  // In front: the lantern, the stones on the rim, the reeds.
  if (showLand) {
    withCam(() => {
      ctx.drawImage(Lr.front.c, 0, 0, W, H);
      drawReeds(ctx, Lr);
    });
  }
  if (place === 'pond' && !smoothMove && e > 0.001) {
    // Smoothmove off: the pond view simply fades in over the landscape.
    ctx.globalAlpha = smooth(0, 1, e);
    pond.draw(ctx, pond.view(1, { squash: on('squash') }), m, { ...opts, bowl: food });
    ctx.globalAlpha = 1;
  }
  if (place === 'garden') garden.draw(ctx, gv, m, { dpr, t: st.t, wind });
}

// The hills' little life: mist drifting between the ranges, now and then
// a cloud's shadow passing over, and rarely two or three birds.
function hillsLife(ctx, Lr, m, a) {
  const live = on('hills') && !reduced;
  const drift = live ? Math.sin(st.t * 0.012) * W * 0.08 + st.t * 1.2 : W * 0.3;
  const mw = W * 1.4, mx = ((drift % mw) + mw) % mw;
  for (const [y, k] of [[L.farY + H * 0.015, 0.9], [L.nearY - H * 0.025, 0.7]]) {
    ctx.globalAlpha = a * k;
    ctx.drawImage(Lr.mist, mx - mw, y, mw, H * 0.06);
    ctx.drawImage(Lr.mist, mx, y, mw, H * 0.06);
  }
  if (live) {
    const sw = W * 0.8, span = W + sw * 1.4;
    const x = ((st.t * W / 140) % span) - sw * 0.7;
    ctx.globalAlpha = a;
    ctx.drawImage(Lr.shadow, x - sw / 2 + sw * 0.5 - sw * 0.5, L.farY - H * 0.05, sw, Lr.band);
    drawBirds(ctx, m, a);
  }
  ctx.globalAlpha = a;
}

function drawBirds(ctx, m, a) {
  const ink = inkOf(m);
  for (const b of st.birds) {
    const flap = Math.sin(st.t * 2.2 + b.ph) * 0.5 + 0.5;
    const s = b.s, x = b.x, y = b.y;
    stroke(ctx, [[x - s, y - s * 0.35 * flap], [x - s * 0.4, y - s * 0.12], [x, y]], { size: Math.max(1, s * 0.16), fill: `rgb(${ink.join(',')})`, alpha: 0.5 * a, press: 'flick', seed: b.seed, pool: 0.3 });
    stroke(ctx, [[x, y], [x + s * 0.45, y - s * 0.15], [x + s, y - s * 0.4 * flap]], { size: Math.max(1, s * 0.14), fill: `rgb(${ink.join(',')})`, alpha: 0.45 * a, press: 'flick', seed: b.seed + 1, pool: 0 });
  }
}

function drawReeds(ctx, Lr) {
  if (!reeds) reeds = reedSpots(L);
  for (const rd of reeds) {
    const sp = Lr.reeds[rd.k];
    ctx.save();
    ctx.translate(rd.x, rd.y);
    ctx.rotate(wind.sway(rd.x, 0.1, rd.ph));
    ctx.scale(rd.s, rd.s);
    ctx.drawImage(sp.c, -sp.W / 2, -sp.H + 1, sp.W, sp.H);
    ctx.restore();
  }
}

// ── The dial ──────────────────────────────────────────────────────────
let prevMode = null;
let reveal = null;
let front = 0;
function setDial(next, fromEl) {
  if (next === mode) return;
  store.set('study.dial', next);
  const u = new URL(location.href);
  u.searchParams.set('dial', next);
  history.replaceState(null, '', u);
  const was = mode;
  mode = next;
  updateDial();
  st.dirty = true;
  if (was === 'paper' || next === 'paper') {
    root.classList.toggle('is-paper', next === 'paper');
    prevMode = null;
    if (next !== 'paper') { const c = canvases[front]; c.style.maskImage = c.style.webkitMaskImage = ''; c.style.opacity = ''; }
    draw();
    return;
  }
  if (reduced) { draw(); return; }
  // Wetdial: the new step spreads out from the dial, like colour into
  // wet paper. Off: a plain crossfade.
  prevMode = was;
  const r = fromEl.getBoundingClientRect();
  reveal = { x: r.left + r.width / 2, y: r.top + r.height / 2, start: performance.now(), wet: on('wetdial') };
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

// ── Words in the garden ──────────────────────────────────────────────
function say(text) {
  clearTimeout(say.t);
  howEl.textContent = text;
  howEl.classList.toggle('show', Boolean(text));
  if (text) say.t = setTimeout(() => howEl.classList.remove('show'), 6000);
}
function showPrompt(word, text) {
  if (!word && !text) { promptEl.classList.remove('show'); return; }
  promptEl.querySelector('.prompt-word').textContent = word;
  promptEl.querySelector('.prompt-text').textContent = text;
  promptEl.classList.add('show');
}

// ── Going in, and back ───────────────────────────────────────────────
function go(where) {
  if (where) place = where;
  to = where ? 1 : 0;
  root.classList.toggle('in-place', Boolean(where));
  root.classList.toggle('in-garden', where === 'garden');
  const u = new URL(location.href);
  if (where) u.searchParams.set('view', where); else u.searchParams.delete('view');
  history.replaceState(null, '', u);
  hintEl.classList.remove('show');
  if (where) store.set('study.hinted2', '1');
  if (place === 'pond') setTimeout(() => pond.setInside(to === 1 && place === 'pond'), where ? 700 : 0);
  if (where === 'garden') {
    setTimeout(() => { if (to === 1 && garden.phase === 'clear') say('Clear the ground: lift the stones, pull up the thorn.'); }, reduced ? 0 : MOVE_S * 1000);
  } else {
    say('');
    showPrompt('', '');
  }
  if (reduced) { U = to; st.dirty = true; draw(); }
}
backEl.addEventListener('click', () => go(null));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && to === 1) go(null); });

// The pond as it is at full view, for touches.
const pondAt = (sx, sy) => pond.toPond(pond.view(1, { squash: on('squash') }), sx, sy);
const inGarden = () => place === 'garden' && to === 1 && U > 0.98;
const inPond = () => place === 'pond' && to === 1 && U > 0.98;

let down = null;
root.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button') || mode === 'paper') return;
  down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
  if (inGarden()) {
    const p = garden.toLocal(garden.view(1), e.clientX, e.clientY);
    if (garden.down(p, e.pointerId)) { root.setPointerCapture?.(e.pointerId); down.used = true; st.dirty = true; }
  }
});
root.addEventListener('pointermove', (e) => {
  if (inGarden()) { garden.move(garden.toLocal(garden.view(1), e.clientX, e.clientY), e.pointerId); st.dirty = true; }
});
const end = (e) => {
  if (inGarden()) garden.up(garden.toLocal(garden.view(1), e.clientX, e.clientY), e.pointerId);
  st.dirty = true;
};
root.addEventListener('pointercancel', end);
root.addEventListener('pointerup', (e) => {
  end(e);
  if (!down || e.target.closest('button')) return;
  const d = down;
  down = null;
  if (d.used || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12 || performance.now() - d.t > 450 || mode === 'paper') return;
  const x = e.clientX, y = e.clientY;
  if (inPond()) {
    // The water rings; the curious come to look, the shy scatter.
    const p = pondAt(x, y);
    pond.touch(p.x, p.y, on('touch'));
    if (reduced) draw();
    return;
  }
  if (to !== 0 || U > 0.02) return;
  // On the landscape: the pond (inside its oval, with a little slack),
  // or the garden.
  const { cx, cy, rx, ry } = L.pond;
  if (((x - cx) / (rx + 10)) ** 2 + ((y - cy) / (ry + 14)) ** 2 < 1) { go('pond'); return; }
  if (on('garden') && garden.hitsGarden(garden.toLocal(garden.view(0), x, y))) go('garden');
});

// Feeding: double-tap (or press and hold) in the pond, as in Quiet Waters.
if (on('touch')) {
  feedGesture({
    bowl,
    canStart: () => inPond() && mode !== 'paper',
    toLocal: (e) => (inPond() && !(e.target instanceof Element && e.target.closest('.dial, .back')) ? pondAt(e.clientX, e.clientY) : null),
  });
}

// ── The loop ─────────────────────────────────────────────────────────
let last = performance.now();
const times = [];
let lite = false;
function draw() {
  root.classList.toggle('is-paper', mode === 'paper');
  nightEl.style.opacity = light === 'night' ? '1' : light === 'dusk' ? '0.25' : light === 'dawn' ? '0.15' : '0';
  root.dataset.light = light;
  if (mode === 'paper') return;
  if (reveal) {
    const k = clamp01((performance.now() - reveal.start) / (reveal.wet ? 1500 : 1100));
    const c = canvases[front];
    if (reveal.wet) {
      const rad = easeInOut(k) * Math.hypot(W, H) * 1.15;
      const mask = `radial-gradient(circle at ${reveal.x}px ${reveal.y}px, #000 ${rad}px, transparent ${rad + 180}px)`;
      c.style.maskImage = c.style.webkitMaskImage = mask;
    } else {
      c.style.transition = 'none';
      c.style.opacity = String(easeInOut(k));
    }
    render(canvases[1 - front].getContext('2d'), prevMode);
    render(c.getContext('2d'), mode);
    if (k >= 1) { reveal = null; prevMode = null; c.style.maskImage = c.style.webkitMaskImage = ''; c.style.opacity = ''; c.style.transition = ''; }
  } else if (compare) {
    // The same koi at the same moment, twice: today's colour, and the
    // painted step.
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
  st.dirty = false;
}

function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (document.hidden) return;
  if (!lite && dt > 0 && !reduced) {
    times.push(dt);
    if (times.length === 60) { const s = [...times].sort((a, b) => a - b); if (s[30] > 0.026) { lite = true; ShadowQuality.blur = false; } times.length = 0; }
  }
  st.frame++;
  // The move into (or out of) a place.
  if (U !== to) {
    U += Math.sign(to - U) * dt / MOVE_S;
    U = to > U ? Math.min(to, U) : Math.max(to, U);
    st.dirty = true;
  }
  garden.step(dt);
  // (Its clock restarts with each thing cleared: it's for the stuck.)
  const done = garden.stones.filter((s) => s.state === 'set').length + (garden.thorn.state === 'gone' ? 1 : 0);
  if (done !== fieldT.done) fieldT = { t: 0, done };
  if (inGarden() && garden.phase === 'clear') fieldT.t += dt;
  skipEl.classList.toggle('show', inGarden() && garden.phase === 'clear' && fieldT.t > 40);
  if (reduced) {
    // A still page: only what the hand moves, moves.
    if (st.dirty || garden.grab || garden.busy) draw();
    return;
  }
  st.t += dt;
  wind.step(dt);
  pond.step({ bowl: on('touch') && place === 'pond' && to === 1 ? bowl : null });
  pond.tick(dt);
  // Birds: rarely, two or three, small and slow, far off.
  if (on('hills')) {
    st.nextBirds -= dt;
    if (st.nextBirds <= 0 && !st.birds.length && to === 0) {
      const n = 2 + Math.floor(Math.random() * 2);
      const dir = Math.random() < 0.5 ? 1 : -1;
      for (let i = 0; i < n; i++) st.birds.push({ x: dir > 0 ? -30 - i * 24 : W + 30 + i * 24, y: H * (0.1 + Math.random() * 0.07) + i * 5, v: dir * (12 + Math.random() * 4), s: Math.min(W, H) * 0.01 * (0.9 + Math.random() * 0.3), ph: Math.random() * 6, seed: 1900 + i });
      st.nextBirds = 70 + Math.random() * 60;
    }
    for (const b of st.birds) b.x += b.v * dt;
    st.birds = st.birds.filter((b) => b.x > -120 && b.x < W + 120);
  }
  if (lite && st.frame % 2) return;
  draw();
}

// ── Start ─────────────────────────────────────────────────────────────
resize();
updateDial();
dialEl.classList.remove('show-name');
root.classList.toggle('in-place', U === 1);
root.classList.toggle('in-garden', U === 1 && place === 'garden');
hintEl.textContent = on('garden') ? 'Touch the pond, or the garden' : 'Touch the pond to go in';
if (!store.get('study.hinted2') && U === 0) {
  setTimeout(() => { if (to === 0) hintEl.classList.add('show'); }, 2500);
  setTimeout(() => hintEl.classList.remove('show'), 10000);
}
if (U === 1 && place === 'garden') setTimeout(() => say('Clear the ground: lift the stones, pull up the thorn.'), 600);
let rt = 0;
window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); reeds = null; draw(); }, 150); });
setInterval(() => {
  const l = lightAt(hourOf());
  if (l !== light) { light = l; caches.clear(); pond.sheets.clear(); garden.sprites.clear(); st.dirty = true; draw(); }
}, 60000);
// The words on the stones are set in Literata: repaint once it's in.
document.fonts?.load('italic 500 16px "Literata Variable"').then(() => { garden.sprites.clear(); st.dirty = true; if (reduced) draw(); }).catch(() => {});
draw();
requestAnimationFrame(tick);
document.body.dataset.ready = '1';
if (q.get('debug') === '1') window.__study = { garden, pond, go };
