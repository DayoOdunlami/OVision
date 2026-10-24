import { dryStroke, stroke, resample, curve } from './brush.js';
import { wash, blob } from './wash.js';
import { rng, noise1, clamp01 } from './noise.js';
import { inkOf, pig, stone, leaf, boneless } from './paint.js';
import { buildVine } from './vine.js';
import { drawGrowth } from './vineMoment.js';

// ═══════════════════════════════════════════════════════════════════
// garden.js — the walk into the garden: Abide's field, in the study's
// brush (studio S, sprint 2).
//
// The heart of Abide, made small: clear the ground by hand, sow the
// week's word, and the vine writes it along the trellis. After main's
// src/flourish/abide/field.js and weeds.js, without the physics engine:
//   · Stones are heavy. Held, a stone lags behind the finger (it follows
//     at 0.12 of the gap a frame, up to a speed cap) and slips from a
//     hurried hand. Each carries a word; lifted, it says what it is
//     asking, a prompt for the person to answer silently. Set down off
//     the plot, it goes to the low wall at the edge.
//   · The thorn has roots. Hold it and lift: steady tension loosens
//     them over about a second; a yank doesn't. Out, roots and all, it
//     goes to the basket. Dropped on the ground, it roots again.
//   · Clear, the plot takes the week's word as a seed; the vine grows
//     out of the trellis and writes the word along the top wire.
//
// Everything is in garden units: the plot is one unit wide, its ground
// line is y = 0, up is −y. The same drawing is shown small on the
// landscape (u ≈ 160 px) and close up in the field (u ≈ 300–500 px):
// view(e) moves between the two, as the pond does.
// ═══════════════════════════════════════════════════════════════════

const STONES = [
  { x: -0.235, s: 0.07, seed: 31, word: 'Undone', prompt: 'Something I wish I’d done.' },
  { x: 0.03, s: 0.066, seed: 44, word: 'Unsaid', prompt: 'Something I wish I’d said.' },
  { x: 0.2, s: 0.066, seed: 57, word: 'Heavy', prompt: 'Something I’ve been carrying.' },
];
const THORN = { x: -0.1, word: 'Worry', prompt: 'Something I keep worrying about.' };
const PLOT = [-0.33, 0.27];
const WALL = [0.29, 0.43];
const BASKET = { x: -0.39, y: 0.12, w: 0.13, h: 0.075 };
const POSTS = [-0.42, -0.14, 0.14, 0.42];
const TOP = -0.52, WIRE1 = -0.5, WIRE2 = -0.31;
// Heft (after field.js), in garden units per second.
const FOLLOW = 0.12 * 60, CAP = 1.35, SLIP = 0.34;
const WARN = 2.0, FAST = 3.8, LOOSEN = 0.95;
const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const FONT = '"Literata Variable", Georgia, serif';

// The stone's own size, as paint.js's stone() will draw it.
function stoneSize(s, seed) {
  const r = rng(seed);
  return { w: s * (1.2 + r() * 0.8), h: s * (0.7 + r() * 0.3) };
}

export class Garden {
  constructor({ word, ref = '', reduced, onNote, onPrompt }) {
    this.word = word;
    this.ref = ref;
    this.reduced = reduced;
    this.onNote = onNote || (() => {});
    this.onPrompt = onPrompt || (() => {});
    this.sprites = new Map();
    this.said = {};
    this.reset();
  }

  reset() {
    this.stones = STONES.map((d) => ({ ...d, ...stoneSize(d.s, d.seed), y: 0.006, home: d.x, state: 'ground', vx: 0, vy: 0, damp: 0, slot: -1 }));
    this.thorn = { x: THORN.x, home: THORN.x, y: 0, state: 'in', loose: 0, pull: 0, lean: 0, quiver: 0, rise: 0, k: 1, vy: 0 };
    this.grab = null;
    this.phase = 'clear';      // clear → sow → grow → done
    this.seedT = 0;
    this.growT = 0;
    this.slots = 0;
  }

  // ── Where it is ───────────────────────────────────────────────────
  resize(W, H, L) {
    this.land = L.garden;
    this.field = { x: W / 2, y: H * (L.portrait ? 0.62 : 0.66), u: Math.min(W / 0.98, H * 0.62) };
    this.sprites.clear();
    this.vine = null;
  }

  view(e) {
    const a = this.land, b = this.field;
    const u = a.u * Math.pow(b.u / a.u, e);
    const f = (u - a.u) / (b.u - a.u);
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, u };
  }

  toLocal(v, sx, sy) { return { x: (sx - v.x) / v.u, y: (sy - v.y) / v.u }; }

  // Whether a point (garden units) is on the garden, for the landscape.
  hitsGarden(p) { return p.x > -0.55 && p.x < 0.55 && p.y > -0.62 && p.y < 0.22; }

  // Whether anything is moving on its own (for a still page).
  get busy() {
    return this.stones.some((s) => s.state === 'falling' || s.state === 'toWall') || ['fallen', 'compost'].includes(this.thorn.state) || this.phase === 'grow';
  }

  get cleared() { return this.stones.every((s) => s.state === 'set') && this.thorn.state === 'gone'; }

  // ── The hand ──────────────────────────────────────────────────────
  down(p, id) {
    if (this.grab) return false;
    if (this.phase === 'sow') {
      if (p.y > -0.3 && p.y < 0.12 && p.x > PLOT[0] - 0.05 && p.x < PLOT[1] + 0.05) { this.sow(); return true; }
      return false;
    }
    if (this.phase !== 'clear') return false;
    const now = performance.now();
    // The nearest thing under the finger, with a finger's slack.
    const pad = 0.07;
    let best = null, bd = Infinity;
    for (const st of this.stones) {
      if (st.state !== 'ground' && st.state !== 'falling') continue;
      const dx = (p.x - st.x) / (st.w + pad), dy = (p.y - (st.y - st.h * 0.5)) / (st.h * 0.6 + pad);
      const d = dx * dx + dy * dy;
      if (d < 1 && d < bd) { bd = d; best = st; }
    }
    const th = this.thorn;
    if (th.state === 'in' || th.state === 'fallen') {
      const d = ((p.x - th.x) / 0.1) ** 2 + ((p.y - (th.y - 0.08)) / 0.13) ** 2;
      if (d < 1 && d < bd) best = th;
    }
    if (!best) return false;
    if (best === th) {
      this.grab = { th, id, x0: p.x, y0: p.y, t0: now, last: { ...p, t: now }, speed: 0, moved: 0, lift: 0 };
      if (th.state === 'fallen') { th.state = 'in'; th.loose = 0; }
      return true;
    }
    best.state = 'held';
    best.vx = best.vy = 0;
    this.grab = { st: best, id, off: { x: p.x - best.x, y: p.y - best.y }, px: p.x, py: p.y, x0: p.x, y0: p.y, t0: now, moved: 0, shown: false };
    this.note('heavy', 'It’s heavy. Carry it slowly to the wall.');
    return true;
  }

  move(p, id) {
    const g = this.grab;
    if (!g || g.id !== id) return;
    const now = performance.now();
    g.moved = Math.max(g.moved, Math.hypot(p.x - g.x0, p.y - g.y0));
    if (g.st) { g.px = p.x; g.py = p.y; return; }
    const th = g.th;
    const dt = Math.max(0.001, (now - g.last.t) / 1000);
    const v = Math.hypot(p.x - g.last.x, p.y - g.last.y) / dt;
    g.last = { ...p, t: now };
    g.speed = g.speed * 0.6 + v * 0.4;
    g.px = p.x; g.py = p.y;
    if (th.state === 'in') {
      g.lift = clamp01((g.y0 - p.y) / 0.11);
      th.lean = Math.max(-1, Math.min(1, (p.x - g.x0) / 0.25));
      th.quiver = Math.max(th.quiver, clamp01((g.speed - WARN) / (FAST - WARN)));
      if (g.speed > FAST && g.lift > 0.5) {
        // Yanked: it won't come. It springs back.
        this.grab = null;
        th.pull = 0; th.lean = 0; th.quiver = 1;
        this.onNote('Gently. The roots let go when they’re ready.');
        return;
      }
      this.rootPull(th, g);
    } else if (th.state === 'carried') {
      th.x = p.x + g.hold.dx;
      th.y = p.y + g.hold.dy;
      th.lean += (Math.max(-1, Math.min(1, -(p.x - (g.prevX ?? p.x)) / (dt * 3))) - th.lean) * 0.3;
      g.prevX = p.x;
    }
  }

  rootPull(th, g) {
    th.pull = Math.min(g.lift || 0, 0.3 + 0.7 * th.loose);
    if (th.pull < 0.97) return;
    th.state = 'carried';
    th.pull = 1;
    th.y = -0.13;
    g.hold = { dx: th.x - g.px, dy: th.y - g.py };
    navigator.vibrate?.(6);
    this.onPrompt(THORN.word, THORN.prompt);
    this.note('out', 'Out, roots and all. Lay it in the basket.');
  }

  up(p, id) {
    const g = this.grab;
    if (!g || g.id !== id) return;
    this.grab = null;
    const tap = g.moved < 0.03 && performance.now() - g.t0 < 450;
    if (g.st) {
      const st = g.st;
      if (tap) this.onNote('Hold it and carry it to the wall.');
      this.letGo(st);
      return;
    }
    const th = g.th;
    if (th.state === 'in') {
      if (tap) this.onNote('Hold it, and lift slowly. The roots let go when they’re ready.');
      return;   // otherwise it springs back
    }
    if (th.state === 'carried') {
      if (Math.abs(p.x - BASKET.x) < BASKET.w * 0.85 && p.y > BASKET.y - 0.22 && p.y < BASKET.y + 0.16) {
        th.state = 'compost'; th.t = 0; th.from = { x: th.x, y: th.y };
        this.onPrompt('', '');
        return;
      }
      th.state = 'fallen'; th.vy = 0;
      this.onPrompt('', '');
    }
  }

  // A stone let go: off the plot (or over the wall) it goes to the
  // wall; on the plot it falls back where it is.
  letGo(st) {
    st.state = 'falling';
    st.vy = 0;
  }

  toWall(st) {
    const slot = this.slots++;
    const pos = [[0.32, -0.093], [0.4, -0.093], [0.36, -0.093 - 0.05]][slot % 3];
    st.state = 'toWall'; st.t = 0; st.from = { x: st.x, y: st.y }; st.to = { x: pos[0], y: pos[1] };
    this.onPrompt('', '');
    if (this.stones.filter((s) => s.state === 'set' || s.state === 'toWall').length === 1) this.note('wall', 'Set in the wall.');
  }

  note(key, text) {
    if (this.said[key]) return;
    this.said[key] = true;
    this.onNote(text);
  }

  sow() {
    this.phase = 'grow';
    this.growT = 0;
    this.onNote('');
    this.onPrompt('', '');
    navigator.vibrate?.(6);
  }

  // ── Each frame ───────────────────────────────────────────────────
  step(dt) {
    const g = this.grab;
    for (const st of this.stones) {
      st.damp = Math.max(0, st.damp - dt * 0.05);
      if (st.state === 'held' && g?.st === st) {
        // Carried, with heft: it moves towards the finger at a pace of
        // its own, and a hand that runs ahead loses it.
        const tx = g.px - g.off.x, ty = Math.min(g.py - g.off.y, 0.006);
        const ex = tx - st.x, ey = ty - st.y;
        st.vx = Math.max(-CAP, Math.min(CAP, ex * FOLLOW));
        st.vy = Math.max(-CAP, Math.min(CAP, ey * FOLLOW));
        st.x += st.vx * dt; st.y += st.vy * dt;
        if (st.y < -0.03) {
          st.damp = 1;
          if (!g.shown) { g.shown = true; this.onPrompt(st.word, st.prompt); }
        }
        if (Math.hypot(ex, ey) > SLIP) {
          this.grab = null;
          this.letGo(st);
          this.onNote('Too heavy to rush. It slipped. Slowly does it.');
        }
      } else if (st.state === 'falling') {
        st.vy += 5 * dt;
        st.y += st.vy * dt;
        st.x += st.vx * dt * 0.3;
        st.vx *= 0.9;
        const overWall = st.x > WALL[0] - 0.03;
        if (overWall || st.x < PLOT[0] || st.x > PLOT[1]) { this.toWall(st); continue; }
        if (st.y >= 0.006) {
          st.y = 0.006; st.vy = 0; st.state = 'ground';
          this.onPrompt('', '');
        }
      } else if (st.state === 'toWall') {
        st.t += dt / 0.75;
        const k = st.t >= 1 ? 1 : 1 - (1 - st.t) ** 3;
        st.x = st.from.x + (st.to.x - st.from.x) * k;
        st.y = st.from.y + (st.to.y - st.from.y) * k - Math.sin(Math.PI * k) * 0.06;
        if (st.t >= 1) st.state = 'set';
      }
    }
    const th = this.thorn;
    th.quiver *= 1 - Math.min(1, dt * 4);
    if (g?.th === th && th.state === 'in') {
      g.speed *= 1 - Math.min(1, dt * 6);
      if (g.lift > 0.12 && g.speed < WARN) th.loose = Math.min(1, th.loose + dt / LOOSEN);
      this.rootPull(th, g);
    } else if (th.state === 'in') {
      th.loose = Math.max(0, th.loose - dt * 0.25);
      th.pull = Math.max(0, th.pull - dt * 5);
      th.lean *= 1 - Math.min(1, dt * 8);
    }
    if (th.state === 'fallen') {
      th.vy += 5 * dt;
      th.y += th.vy * dt;
      if (th.y >= 0) {
        // It takes root again where it lands.
        th.y = 0; th.vy = 0; th.state = 'in'; th.loose = 0; th.pull = 0; th.lean = 0;
        this.onNote('It took root again. Carry it to the basket.');
      }
    }
    if (th.state === 'compost') {
      th.t += dt / 0.6;
      if (th.t >= 1) {
        th.state = 'gone';
        this.onNote('');
      }
    }
    if (this.phase === 'clear' && this.cleared && !this.grab && this.stones.every((s) => s.state === 'set')) {
      this.phase = 'sow';
      this.seedT = 0;
      this.onPrompt(this.word, 'Sow this week’s word. Touch the soil.');
    }
    if (this.phase === 'sow') this.seedT += dt;
    if (this.phase === 'grow' || this.phase === 'done') {
      this.growT += dt;
      if (this.phase === 'grow' && this.vine && (this.reduced || this.growT > 1.6 + (this.vine.doneAt || 10))) {
        this.phase = 'done';
        this.onPrompt(this.ref, '');
      }
    }
  }

  // ── Painting ──────────────────────────────────────────────────────
  // The still part (trellis, plot, wall, basket), once per dial step, at
  // the field's size; the landscape shows it smaller.
  sprite(mode, dpr) {
    const key = `${mode}`;
    if (this.sprites.has(key)) return this.sprites.get(key);
    const fu = this.field.u;
    const box = { x0: -0.74, x1: 0.74, y0: -0.64, y1: 0.24 };
    const c = document.createElement('canvas');
    c.width = Math.round((box.x1 - box.x0) * fu * dpr);
    c.height = Math.round((box.y1 - box.y0) * fu * dpr);
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, -box.x0 * fu * dpr, -box.y0 * fu * dpr);
    ctx.__dpr = dpr;
    paintField(ctx, fu, mode);
    const stones = this.stones.map((st) => stoneSprite(st, fu, mode, dpr));
    const out = { c, box, stones, thorn: thornSprite(fu, mode, dpr) };
    this.sprites.set(key, out);
    return out;
  }

  draw(ctx, v, mode, { dpr, t, wind, alpha = 1 }) {
    const sp = this.sprite(mode, dpr);
    const fu = this.field.u;
    const k = v.u / fu;
    const ink = inkOf(mode);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(v.x, v.y);
    ctx.scale(k, k);
    // Below here, one unit is fu px.
    const { box } = sp;
    ctx.drawImage(sp.c, box.x0 * fu, box.y0 * fu, (box.x1 - box.x0) * fu, (box.y1 - box.y0) * fu);
    // Darker soil where a stone has been lifted.
    for (const st of this.stones) {
      if (st.damp <= 0 && st.state === 'ground') continue;
      const a = st.state === 'ground' ? 0 : Math.max(0.35, st.damp);
      ctx.save();
      ctx.globalAlpha *= 0.22 * a;
      ctx.fillStyle = css(mode === 'ink' ? ink : pig('earth', mode).map((c) => c * 0.6));
      ctx.beginPath();
      ctx.ellipse(st.home * fu, 0.012 * fu, st.w * fu * 0.8, 0.018 * fu, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Stones, set ones first (in the wall), the held one last.
    const order = [...this.stones].sort((a, b) => rank(a) - rank(b));
    for (const st of order) {
      if (st.state === 'held') continue;
      this.drawStone(ctx, st, sp.stones[this.stones.indexOf(st)], fu);
    }
    this.drawThorn(ctx, sp.thorn, fu, mode, t, wind);
    this.drawSeed(ctx, fu, mode, t);
    if (this.phase === 'grow' || this.phase === 'done') this.drawVine(ctx, fu, mode);
    const held = this.stones.find((s) => s.state === 'held');
    if (held) this.drawStone(ctx, held, sp.stones[this.stones.indexOf(held)], fu, true);
    // While a thorn is held in the ground: a faint ring round it fills
    // as the roots loosen (the original's cue, in a thin line of ink).
    const th = this.thorn, g = this.grab;
    if (g?.th === th && th.state === 'in' && th.loose > 0.02) {
      ctx.save();
      ctx.strokeStyle = css(ink);
      ctx.lineCap = 'round';
      ctx.globalAlpha *= 0.5;
      ctx.lineWidth = Math.max(1.4, fu * 0.006);
      ctx.beginPath();
      ctx.arc(th.x * fu, -0.07 * fu, 0.14 * fu, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * th.loose);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  drawStone(ctx, st, sp, fu, held = false) {
    const lift = held ? clamp01(-st.y / 0.08) : 0;
    ctx.save();
    ctx.translate(st.x * fu, st.y * fu);
    // Set in the wall, a stone sits a little smaller, as part of it.
    const s = st.state === 'set' ? 0.86 : st.state === 'toWall' ? 1 - 0.14 * clamp01(st.t) : 1;
    ctx.scale(s, s);
    if (held) ctx.rotate(Math.max(-0.08, Math.min(0.08, st.vx * 0.05)));
    // A soft shadow on the ground under a lifted stone.
    if (lift > 0) {
      ctx.save();
      ctx.globalAlpha *= 0.12 * lift;
      ctx.fillStyle = '#1d1b19';
      ctx.beginPath();
      ctx.ellipse(0, -st.y * fu + 0.01 * fu, st.w * fu * (1 - lift * 0.2), 0.016 * fu, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.drawImage(sp.c, -sp.ox, -sp.oy, sp.w, sp.h);
    ctx.restore();
  }

  drawThorn(ctx, sp, fu, mode, t, wind) {
    const th = this.thorn;
    if (th.state === 'gone') return;
    let x = th.x * fu, y = th.y * fu, sc = 1;
    if (th.state === 'compost') {
      const k = clamp01(th.t);
      const e = 1 - (1 - k) ** 2;
      x = (th.from.x + (BASKET.x - th.from.x) * e) * fu;
      y = (th.from.y + (BASKET.y - 0.03 - th.from.y) * e) * fu - Math.sin(Math.PI * k) * 0.05 * fu;
      sc = 1 - 0.7 * k;
    }
    const rise = th.state === 'in' ? th.pull * 0.11 * fu : 0;
    const sway = this.reduced ? 0 : wind.sway(x, 0.04, 1.3);
    const jitter = th.quiver > 0.01 && !this.reduced ? Math.sin(t * 60) * 0.05 * th.quiver : 0;
    ctx.save();
    if (th.state === 'in' || th.state === 'fallen') {
      // In the ground, the roots show only as far as they've come up.
      ctx.beginPath();
      ctx.rect(-2 * fu, -2 * fu, 4 * fu, 2 * fu + th.y * fu + 0.004 * fu);
      ctx.clip();
    }
    ctx.translate(x, y - rise);
    ctx.rotate(th.lean * 0.22 + sway + jitter);
    ctx.scale(sc, sc);
    ctx.drawImage(sp.c, -sp.ox, -sp.oy, sp.w, sp.h);
    ctx.restore();
  }

  drawSeed(ctx, fu, mode, t) {
    if (this.phase !== 'sow' && !(this.phase === 'grow' && this.growT < 1.6)) return;
    const ink = inkOf(mode);
    let y, a = 1, grow = 0;
    if (this.phase === 'sow') {
      a = clamp01(this.seedT / 0.8);
      y = (-0.2 + (this.reduced ? 0 : Math.sin(t * 1.3) * 0.008)) * fu;
    } else {
      const k = clamp01(this.growT / 0.5);
      y = (-0.2 + 0.21 * k * k) * fu;
      grow = clamp01((this.growT - 0.6) / 1.0);
      a = 1 - clamp01((this.growT - 0.5) / 0.3);
    }
    const s = 0.018 * fu;
    ctx.save();
    ctx.globalAlpha *= a;
    if (mode !== 'ink') {
      ctx.fillStyle = css(pig('earth', mode), 0.7);
      ctx.beginPath(); ctx.ellipse(0, y, s * 0.75, s, 0.3, 0, Math.PI * 2); ctx.fill();
    }
    stroke(ctx, [[-s * 0.2, y - s * 0.8], [0, y], [s * 0.15, y + s * 0.8]], { size: s * 1.3, fill: css(ink), alpha: 0.8, press: 'dab', seed: 3001, pool: 0.3 });
    ctx.restore();
    if (grow > 0) {
      // A shoot, where it went in.
      const h = 0.07 * fu * grow;
      stroke(ctx, curve([0, 0], [0.004 * fu, -h * 0.5], null, [-0.003 * fu, -h], 8), { size: Math.max(1.2, fu * 0.006), fill: css(ink), alpha: 0.8, press: 'flick', seed: 3002, pool: 0.3 });
      if (grow > 0.5) {
        const ls = 0.03 * fu * (grow - 0.5) * 2;
        leaf(ctx, -0.003 * fu, -h, -Math.PI / 2 - 0.9, ls, mode, ink, 3003);
        leaf(ctx, -0.003 * fu, -h, -Math.PI / 2 + 0.9, ls, mode, ink, 3004);
      }
    }
  }

  drawVine(ctx, fu, mode) {
    if (!this.vine) {
      const box = { x: -0.38 * fu, y: -0.75 * fu, w: 0.78 * fu, h: 0.34 * fu };
      this.vine = buildVine(this.word, box, { bloom: 'grapes', amount: 'few', pace: 2.2 });
    }
    const t = this.reduced ? 999 : Math.max(0, this.growT - 1.6);
    if (t > 0) drawGrowth(ctx, this.vine, t, mode, 1);
  }
}

function rank(st) {
  return st.state === 'set' ? 0 : st.state === 'toWall' ? 1 : 2;
}

// ── The still part of the garden, in garden units × fu ─────────────
function paintField(ctx, fu, mode) {
  const ink = inkOf(mode);
  const U = (v) => v * fu;
  const r = rng(404);
  const S = fu / 400;   // the brush's scale here
  // The ground: a pale wash, and a broken line along it.
  if (mode !== 'ink') {
    // Soft all round, so on the landscape it has no edge.
    const dpr = ctx.__dpr || 1;
    const c = document.createElement('canvas');
    c.width = Math.round(U(1.5) * dpr); c.height = Math.round(U(0.3) * dpr);
    const x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, U(0.75) * dpr, U(0.04) * dpr);
    wash(x, blob(0, U(0.06), U(0.7), U(0.1), 14, 41, 0.08), pig('grass', mode), { layers: 10, alpha: mode === 'colour' ? 0.06 : 0.045, spread: 0.08, seed: 41, edge: 0, grain: 0.4 });
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'destination-in';
    const g = x.createRadialGradient(c.width / 2, c.height * 0.3, 0, c.width / 2, c.height * 0.3, c.width / 2);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.setTransform(1, 0, 0, c.height / c.width * 2.2, 0, 0);
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.width);
    ctx.drawImage(c, U(-0.75), U(-0.04), U(1.5), U(0.3));
  }
  const gl = [];
  for (let x = -0.72; x <= 0.72; x += 0.02) gl.push([U(x), U(noise1(x * 8, 9) * 0.005 + 0.002)]);
  for (let i = 0; i < gl.length - 3;) {
    const n = 5 + Math.floor(r() * 12);
    const seg = gl.slice(i, i + n);
    if (seg.length > 2) dryStroke(ctx, resample(seg, 3), { size: 4 * S + 0.8, ink, alpha: 0.45, dry: 0.6, seed: 140 + i, press: 'swell' });
    i += n + (r() < 0.4 ? 2 : 0);
  }
  // The trellis: posts and two wires.
  for (const [i, x0] of POSTS.entries()) {
    const x = U(x0), lean = (r() - 0.5) * U(0.012);
    if (mode !== 'ink') wash(ctx, [[x - 3 * S, U(TOP)], [x + 3 * S, U(TOP)], [x + 3 * S, 0], [x - 3 * S, 0]], pig('wood', mode), { layers: 6, alpha: 0.12, spread: 0.02, seed: 50 + i, edge: 0.3, grain: 0.2 });
    dryStroke(ctx, resample([[x + lean, U(TOP) - 2], [x + lean * 0.4, U(TOP / 2)], [x, 2]], 4),
      { size: Math.max(2.2, 6 * S), ink, alpha: 0.72, dry: 0.6, seed: 60 + i, press: (u) => (u < 0.06 ? 1.3 : 1 - u * 0.35) });
  }
  for (const [wy, s] of [[WIRE1, 70], [WIRE2, 71]]) {
    const pts = [];
    for (let k = 0; k < POSTS.length - 1; k++) pts.push(...curve([U(POSTS[k]), U(wy)], [U((POSTS[k] + POSTS[k + 1]) / 2), U(wy + 0.012)], null, [U(POSTS[k + 1]), U(wy)], 10).slice(k ? 1 : 0));
    for (let a = 0; a < pts.length - 2;) {
      const len = 6 + Math.floor(r() * 12);
      const seg = pts.slice(a, a + len);
      if (seg.length > 1) stroke(ctx, seg, { size: 1.3 * S + 0.4, fill: css(ink), alpha: 0.45, press: 'even', wobble: 0.6, seed: s + a, pool: 0 });
      a += len + 1 + Math.floor(r() * 3);
    }
  }
  // The vine's old trunk at the first post, cut back for the winter: the
  // word will grow from it.
  const tx = U(-0.38);
  const trunk = curve([tx, 2], [tx - U(0.04), U(-0.2)], [tx + U(0.03), U(-0.4)], [tx + U(0.01), U(WIRE1)], 18);
  if (mode !== 'ink') wash(ctx, trunk.map(([x, y]) => [x - U(0.012), y]).concat(trunk.slice().reverse().map(([x, y]) => [x + U(0.012), y])), pig('wood', mode), { layers: 6, alpha: 0.14, spread: 0.02, seed: 506, edge: 0.4, grain: 0.3 });
  dryStroke(ctx, resample(trunk, 3), { size: 12 * S + 2, ink, alpha: 0.82, dry: 0.5, seed: 507, press: (u) => 1 - u * 0.5 });
  const arm = [];
  for (let x = -0.38; x >= -0.46; x -= 0.012) arm.push([U(x), U(WIRE1) - 2 + noise1(x * 20, 510) * 2]);
  dryStroke(ctx, arm, { size: 6 * S + 1, ink, alpha: 0.7, dry: 0.45, seed: 512, press: (u) => 1 - u * 0.6 });
  boneless(ctx, U(-0.44), U(WIRE1) - 2, -Math.PI / 2 - 0.5, U(0.03), mode, ink, 520);
  leaf(ctx, U(-0.4), U(WIRE1), Math.PI / 2 + 0.4, U(0.026), mode, ink, 521);
  // The plot: turned earth, mounded a little.
  const [p0, p1] = PLOT;
  if (mode !== 'ink') {
    wash(ctx, [[U(p0), U(0.012)], [U(p0 + 0.08), U(-0.02)], [U((p0 + p1) / 2), U(-0.03)], [U(p1 - 0.08), U(-0.02)], [U(p1), U(0.012)], [U(p1 - 0.02), U(0.05)], [U(p0 + 0.02), U(0.05)]],
      pig('earth', mode), { layers: 12, alpha: mode === 'colour' ? 0.12 : 0.09, spread: 0.04, seed: 90, edge: 0.3, grain: 0.6 });
  }
  stroke(ctx, curve([U(p0), U(0.01)], [U(p0 + 0.15), U(-0.034)], [U(p1 - 0.15), U(-0.034)], [U(p1), U(0.01)], 24), { size: 4 * S + 0.8, fill: css(ink), alpha: 0.42, press: 'swell', seed: 130, pool: 0.2 });
  for (let i = 0; i < 9; i++) {
    const x = U(p0 + 0.04 + r() * (p1 - p0 - 0.08)), y = U(0.006 + r() * 0.03);
    stroke(ctx, [[x, y], [x + U(0.012), y + 0.5]], { size: 2.4 * S + 0.6, fill: css(ink), alpha: 0.28, press: 'swell', seed: 150 + i, pool: 0.4 });
  }
  // The low wall at the edge, where the stones go: dry stone, two rows.
  const [w0, w1] = WALL;
  const rows = [[0.0, 3, 0.023], [-0.048, 2, 0.021]];
  for (const [ri, [y, n, s]] of rows.entries()) {
    for (let i = 0; i < n; i++) {
      const x = w0 + (w1 - w0) * ((i + 0.5 + (ri ? 0.5 : 0)) / (n + (ri ? 1 : 0)));
      stone(ctx, U(x), U(y), U(s), mode, ink, 180 + ri * 10 + i);
    }
  }
  // The basket, in the front corner: woven, open at the top.
  const { x: bx, y: by, w: bw, h: bh } = BASKET;
  const top = U(by - bh / 2), bot = U(by + bh / 2);
  if (mode !== 'ink') wash(ctx, [[U(bx - bw / 2), top], [U(bx + bw / 2), top], [U(bx + bw * 0.4), bot], [U(bx - bw * 0.4), bot]], pig('wood', mode), { layers: 8, alpha: 0.13, spread: 0.03, seed: 160, edge: 0.4, grain: 0.4 });
  const rim = [];
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; rim.push([U(bx) + Math.cos(a) * U(bw / 2), top + Math.sin(a) * U(0.016)]); }
  stroke(ctx, rim, { size: 3.5 * S + 0.8, fill: css(ink), alpha: 0.62, press: 'even', seed: 161, pool: 0 });
  stroke(ctx, [[U(bx - bw / 2), top], [U(bx - bw * 0.4), bot]], { size: 3.5 * S + 0.8, fill: css(ink), alpha: 0.6, press: 'even', seed: 162, pool: 0.3 });
  stroke(ctx, [[U(bx + bw / 2), top], [U(bx + bw * 0.4), bot]], { size: 3.5 * S + 0.8, fill: css(ink), alpha: 0.6, press: 'even', seed: 163, pool: 0.3 });
  stroke(ctx, [[U(bx - bw * 0.4), bot], [U(bx + bw * 0.4), bot]], { size: 3.5 * S + 0.8, fill: css(ink), alpha: 0.55, press: 'swell', seed: 164, pool: 0.3 });
  for (let i = 1; i < 6; i++) {
    const f = i / 6;
    stroke(ctx, [[U(bx - bw / 2 + bw * f), top + U(0.014)], [U(bx - bw * 0.4 + bw * 0.8 * f), bot]], { size: 1.6 * S + 0.4, fill: css(ink), alpha: 0.3, press: 'even', seed: 165 + i, pool: 0 });
  }
  for (let j = 1; j < 3; j++) {
    const y = top + (bot - top) * (j / 3);
    stroke(ctx, curve([U(bx - bw * (0.5 - 0.1 * j / 3)), y], [U(bx), y + U(0.008)], null, [U(bx + bw * (0.5 - 0.1 * j / 3)), y], 10), { size: 1.6 * S + 0.4, fill: css(ink), alpha: 0.3, press: 'swell', seed: 172 + j, pool: 0 });
  }
  // Two tufts of grass, at the posts.
  for (const [i, x0] of [[0, -0.42], [1, 0.42], [2, 0.52]]) {
    for (let k = 0; k < 4; k++) {
      const x = U(x0) + (r() - 0.5) * U(0.03), lean = (r() - 0.5) * U(0.05);
      stroke(ctx, curve([x, 1], [x + lean * 0.2, U(-0.02)], null, [x + lean, U(-0.035 - r() * 0.03)], 8), { size: 2.6 * S + 0.6, fill: css(ink), alpha: 0.45, press: 'flick', seed: 190 + i * 9 + k, pool: 0.2 });
    }
  }
}

// A stone, with its word, in a small sheet of its own (base at oy).
function stoneSprite(st, fu, mode, dpr) {
  const ink = inkOf(mode);
  const w = st.w * fu, h = st.h * fu;
  const W = Math.ceil(w * 2.6), H = Math.ceil(h * 2.2);
  const ox = W / 2, oy = Math.ceil(h * 1.45);
  const c = document.createElement('canvas');
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Its underside, faint: a stone is round, not cut flat.
  stroke(ctx, curve([ox - w * 0.96, oy - 1], [ox - w * 0.5, oy + h * 0.3], [ox + w * 0.5, oy + h * 0.3], [ox + w * 0.96, oy - 1], 14), { size: Math.max(1.4, h * 0.08), fill: css(ink), alpha: 0.28, press: 'swell', seed: st.seed + 3, pool: 0 });
  stone(ctx, ox, oy, st.s * fu, mode, ink, st.seed);
  // The word, cut into its face.
  const px = Math.max(11, Math.round(h * 0.4));
  ctx.font = `italic 500 ${px}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = css(ink, mode === 'colour' ? 0.68 : 0.78);
  ctx.fillText(st.word, ox, oy - h * 0.46, w * 1.7);
  return { c, ox, oy, w: W, h: H };
}

// The thorn: a thistle, its rosette low, a spined stalk, a spiny head;
// and below the ground, its roots. Base at (ox, oy).
function thornSprite(fu, mode, dpr) {
  const ink = inkOf(mode);
  const S = fu / 400;
  const W = Math.ceil(fu * 0.36), H = Math.ceil(fu * 0.52);
  const ox = W / 2, oy = Math.ceil(fu * 0.3);
  const c = document.createElement('canvas');
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const r = rng(808);
  // Roots: a tap root and a few side roots, dry and fine.
  const tap = curve([ox, oy], [ox + 6 * S, oy + 30 * S], [ox - 8 * S, oy + 55 * S], [ox - 2 * S, oy + 78 * S], 14);
  dryStroke(ctx, resample(tap, 3), { size: 5 * S + 1, ink, alpha: 0.62, dry: 0.5, seed: 801, press: (u) => 1 - u * 0.85 });
  for (let i = 0; i < 6; i++) {
    const y0 = oy + (6 + i * 9) * S, dir = i % 2 ? 1 : -1, l = (18 + r() * 22) * S * (1 - i * 0.08);
    const pts = curve([ox + (r() - 0.5) * 4 * S, y0], [ox + dir * l * 0.4, y0 + l * 0.15], null, [ox + dir * l, y0 + l * (0.35 + r() * 0.3)], 8);
    stroke(ctx, pts, { size: 2.2 * S + 0.4, fill: css(ink), alpha: 0.42, press: 'flick', wobble: 0.5, seed: 810 + i, pool: 0 });
  }
  // The rosette: spiny leaves lying low.
  const n = 6;
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const ang = -Math.PI / 2 + (f - 0.5) * 2.9 + (r() - 0.5) * 0.15;
    const s = (15 + r() * 5) * S * (1 - Math.abs(f - 0.5) * 0.3);
    leaf(ctx, ox, oy - 2 * S, ang, s, mode, ink, 820 + i);
    // Spines along it.
    for (let k = 1; k < 4; k++) {
      const d = s * 1.6 * (k / 4), px = ox + Math.cos(ang) * d, py = oy - 2 * S + Math.sin(ang) * d;
      for (const side of [-1, 1]) {
        const a2 = ang + side * 1.1;
        stroke(ctx, [[px, py], [px + Math.cos(a2) * 5 * S, py + Math.sin(a2) * 5 * S]], { size: 1.2 * S + 0.3, fill: css(ink), alpha: 0.5, press: 'flick', seed: 830 + i * 10 + k + side, pool: 0 });
      }
    }
  }
  // The stalk and the head.
  const hy = oy - 70 * S;
  stroke(ctx, curve([ox, oy - 4 * S], [ox + 3 * S, oy - 35 * S], null, [ox + 1 * S, hy + 6 * S], 10), { size: 3.6 * S + 0.6, fill: css(ink), alpha: 0.75, press: (u) => 1 - u * 0.5, seed: 850, pool: 0.3 });
  leaf(ctx, ox + 2 * S, oy - 30 * S, -Math.PI / 2 + 1.1, 12 * S, mode, ink, 851);
  leaf(ctx, ox + 1 * S, oy - 46 * S, -Math.PI / 2 - 1.0, 10 * S, mode, ink, 852);
  if (mode !== 'ink') wash(ctx, blob(ox + 1 * S, hy - 6 * S, 8 * S, 7 * S, 9, 853, 0.2), pig('grape', mode), { layers: 8, alpha: mode === 'colour' ? 0.3 : 0.22, spread: 0.1, seed: 854, edge: 0.4, grain: 0.3, depth: 2 });
  // The cup, scaled; then the brush of the flower on top.
  stroke(ctx, curve([ox - 7 * S, hy - 2 * S], [ox - 6 * S, hy + 8 * S], [ox + 8 * S, hy + 8 * S], [ox + 9 * S, hy - 2 * S], 10), { size: 3 * S + 0.5, fill: css(ink), alpha: 0.7, press: 'swell', seed: 855, pool: 0.2 });
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.22;
    const bx = ox + 1 * S, by = hy - 2 * S;
    stroke(ctx, [[bx + Math.cos(a) * 3 * S, by + Math.sin(a) * 3 * S], [bx + Math.cos(a) * 14 * S, by + Math.sin(a) * 13 * S]], { size: 1.7 * S + 0.4, fill: css(ink), alpha: 0.6, press: 'flick', seed: 860 + i, pool: 0 });
  }
  for (let i = 0; i < 4; i++) {
    const a = Math.PI * 0.2 + i * 0.22;
    stroke(ctx, [[ox + Math.cos(a) * 7 * S, hy + 4 * S], [ox + Math.cos(a) * 13 * S, hy + 2 * S + Math.sin(a) * 6 * S]], { size: 1.3 * S + 0.3, fill: css(ink), alpha: 0.55, press: 'flick', seed: 870 + i, pool: 0 });
    stroke(ctx, [[ox - Math.cos(a) * 6 * S, hy + 4 * S], [ox - Math.cos(a) * 12 * S, hy + 2 * S + Math.sin(a) * 6 * S]], { size: 1.3 * S + 0.3, fill: css(ink), alpha: 0.55, press: 'flick', seed: 875 + i, pool: 0 });
  }
  // Its word, faint, on a leaf.
  const px = Math.max(9, Math.round(13 * S));
  ctx.font = `italic 500 ${px}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = css(ink, 0.62);
  ctx.fillText(THORN.word, ox, oy - 92 * S);
  return { c, ox, oy, w: W, h: H };
}
