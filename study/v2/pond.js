import SpineFish, { buildPondMixFromCounts, ShadowQuality, ShadingMode } from '../../src/app/pond/SpineFish.js';
import { stroke, curve } from './brush.js';
import { wash, blob } from './wash.js';
import { rng, clamp01 } from './noise.js';
import { drawInkKoi } from './inkKoi.js';
import { inkOf, pig, padSprite } from './paint.js';

// ═══════════════════════════════════════════════════════════════════
// pond.js — the round pond, drawn once from above (studio S, sprint 2).
//
// The pond is a circle, radius Rc, in its own square of water. Rc is
// half the screen's diagonal, so seen straight down at full size it
// just covers the screen: that is the pond view, and the koi in it are
// Quiet Waters' own, at today's size. On the landscape the very same
// drawing is shown small and squashed into an oval (seen across the
// pond, not down into it). Going in, it un-squashes and grows until it
// fills the screen; nothing is swapped, so the koi just grow.
//
//   view(e)  where the drawing sits at e (0 landscape → 1 the pond):
//            { x, y, s, q }  centre on screen, scale, squash
// ═══════════════════════════════════════════════════════════════════

export class Pond {
  constructor({ reduced }) {
    this.reduced = reduced;
    this.koi = [];
    this.ripples = [];
    this.lines = [];
    this.inside = false;   // whether the koi have the whole view
    this.cursor = { x: -9999, y: -9999 };
    this.cursorUntil = 0;
    this.frame = 0;
    this.sheets = new Map();
  }

  resize(W, H, L) {
    this.W = W; this.H = H;
    this.Rc = Math.hypot(W, H) / 2 * 1.04;
    this.D = this.Rc * 2;
    this.land = L.pond;
    this.sheets.clear();
    if (!this.koi.length) this.makeKoi();
  }

  // Where the drawing is, e from 0 (on the landscape) to 1 (the pond).
  // Scale grows geometrically and the centre moves in step with it, so
  // it reads as one move towards a point, not a slide and then a zoom.
  view(e, { squash = true } = {}) {
    const { cx, cy, rx, q } = this.land;
    const s0 = rx / this.Rc, q0 = squash ? q : 1;
    const s = s0 * Math.pow(1 / s0, e);
    const f = (s - s0) / (1 - s0);
    return { x: cx + (this.W / 2 - cx) * f, y: cy + (this.H / 2 - cy) * f, s, q: q0 + (1 - q0) * f, s0 };
  }

  // Screen → the pond's own coordinates, at a view.
  toPond(v, sx, sy) {
    return { x: this.Rc + (sx - v.x) / v.s, y: this.Rc + (sy - v.y) / (v.s * v.q) };
  }

  // ── The koi ────────────────────────────────────────────────────────
  makeKoi() {
    ShadingMode.current = 'auto';
    ShadowQuality.blur = true;
    const { W, H, Rc, D } = this;
    // Today's size: as Quiet Waters sizes them for this screen.
    const size = Math.max(0.5, Math.min(1.15, Math.min(W, H) / 720)) * 0.9;
    // A curious chagoi, a shy shiro, and three who mind their own business.
    const names = ['chagoi', 'kohaku', 'showa', 'shiro', 'ogon'];
    const pond = this;
    this.koi = names.map((name, i) => {
      const [v] = buildPondMixFromCounts({ [name]: 1 });
      const fish = new SpineFish(D, D, { ...v, sizeScale: (v.sizeScale || 1) * size });
      const plain = fish.pickWanderTarget.bind(fish);
      fish.pickWanderTarget = function pick() {
        plain(D, D);
        pond.keepIn(this.target);
      };
      const a = (i / names.length) * Math.PI * 2 + 0.4;
      const d = Rc * (0.2 + 0.25 * ((i * 37) % 5) / 5);
      fish.shift(Rc + Math.cos(a) * d - fish.head.x, Rc + Math.sin(a) * d - fish.head.y);
      pond.keepIn(fish.target);
      return { fish, seed: 11 + i * 7 };
    });
    const r = rng(921);
    this.lines = Array.from({ length: 5 }, (_, i) => ({ x: r() * D, f: (i + 0.5) / 5, len: 0.05 + r() * 0.05, v: 3 + r() * 3, seed: 900 + i }));
    if (this.reduced) for (let i = 0; i < 120; i++) this.step({});
  }

  // Where a koi may head. On the landscape: anywhere well inside the
  // pond. In the pond: inside the part of it on the screen.
  keepIn(t) {
    const { Rc, W, H } = this;
    if (this.inside) {
      t.x = Math.max(Rc - W / 2 + 70, Math.min(Rc + W / 2 - 70, t.x));
      t.y = Math.max(Rc - H / 2 + 90, Math.min(Rc + H / 2 - 90, t.y));
    }
    const dx = t.x - Rc, dy = t.y - Rc, d = Math.hypot(dx, dy), max = Rc * (this.inside ? 0.9 : 0.68);
    if (d > max) { t.x = Rc + (dx / d) * max; t.y = Rc + (dy / d) * max; }
  }

  setInside(on) {
    this.inside = on;
    for (const k of this.koi) {
      if (on && !k.fish.isIdle) k.fish.pickWanderTarget();
      else this.keepIn(k.fish.target);
    }
  }

  touch(x, y, respond) {
    this.ripples.push({ x, y, t: 0 });
    if (respond) { this.cursor = { x, y }; this.cursorUntil = this.frame + 40; }
  }

  step({ bowl = null }) {
    this.frame++;
    const raw = this.frame < this.cursorUntil ? this.cursor : { x: -9999, y: -9999 };
    const cur = bowl ? bowl.cursor(raw) : raw;
    if (bowl) bowl.update(this.koi.map((k) => k.fish));
    for (const k of this.koi) {
      k.fish.update(this.D, this.D, cur, {
        food: bowl ? bowl.foodFor(k.fish) : [],
        onBreak: (x, y) => { if (!this.reduced) this.ripples.push({ x, y, t: 0 }); },
      });
    }
  }

  tick(dt) {
    for (const ln of this.lines) ln.x += ln.v * dt;
    for (let i = this.ripples.length - 1; i >= 0; i--) { this.ripples[i].t += dt; if (this.ripples[i].t > 6) this.ripples.splice(i, 1); }
  }

  // ── Painting ───────────────────────────────────────────────────────
  // The water, once per dial step, in its own square (at a modest
  // resolution: it is all soft wash).
  sheet(mode, dpr) {
    if (this.sheets.has(mode)) return this.sheets.get(mode);
    const { D, Rc, W, H } = this;
    const k = Math.min(dpr, 2048 / D);
    const c = document.createElement('canvas');
    c.width = c.height = Math.round(D * k);
    const ctx = c.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.__dpr = k;
    const ink = inkOf(mode);
    const r = rng(808);
    const disc = (rr, n, seed, j = 0.02) => blob(Rc, Rc, rr, rr, n, seed, j);
    if (mode !== 'ink') {
      for (let i = 0; i < 3; i++) wash(ctx, disc(Rc * 1.01, 28, 810 + i), pig('water', mode), { layers: 8, alpha: mode === 'colour' ? 0.09 : 0.032, spread: 0.01, seed: 810 + i, edge: 0.1, grain: 0.35 });
      const d = pig('deep', mode);
      const g = ctx.createRadialGradient(Rc, Rc * 1.04, 0, Rc, Rc * 1.04, Rc);
      g.addColorStop(0, `rgba(${d[0]},${d[1]},${d[2]},${mode === 'colour' ? 0.3 : 0.11})`);
      g.addColorStop(0.65, `rgba(${d[0]},${d[1]},${d[2]},${mode === 'colour' ? 0.12 : 0.05})`);
      g.addColorStop(1, `rgba(${d[0]},${d[1]},${d[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(Rc, Rc, Rc, 0, Math.PI * 2); ctx.fill();
      wash(ctx, disc(Rc * 0.98, 24, 830), pig('water', mode), { layers: 6, alpha: 0.03, spread: 0.04, seed: 830, edge: 0, grain: 0.6 });
    } else {
      // In Ink, the water is the paper; a pale tone gathers at the rim.
      wash(ctx, disc(Rc * 1.01, 28, 815), inkOf(mode), { layers: 3, alpha: 0.012, spread: 0.01, seed: 815, edge: 0.6, grain: 0.5 });
    }
    // A few still lines on the water, pale (the moving ones are live).
    const u = Math.min(W, H) / 800;
    for (let i = 0; i < 14; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * Rc * 0.85;
      const x = Rc + Math.cos(a) * d, y = Rc + Math.sin(a) * d, l = Math.min(W, H) * (0.04 + r() * 0.06);
      stroke(ctx, curve([x, y], [x + l * 0.4, y - l * 0.08], [x + l * 0.7, y + l * 0.06], [x + l, y - l * 0.02], 12), { size: 2.2 * u + 0.6, fill: `rgb(${ink.join(',')})`, alpha: 0.12, press: 'swell', wobble: 0.5, seed: 850 + i, pool: 0 });
    }
    // Lily pads, painted in their own small sheets, placed on the water.
    const ps = Math.max(18, Math.min(W, H) * 0.06);
    const rp = rng(707);
    const pads = [0, 1, 2, 3, 4, 5].map((i) => {
      const a = i * 1.1 + rp() * 0.5, d = Rc * (0.38 + rp() * 0.4);
      return { ...padSprite(ps * (0.8 + rp() * 0.5), mode, dpr, 600 + i, i === 1 || i === 4), x: Rc + Math.cos(a) * d, y: Rc + Math.sin(a) * d * 0.9, rot: rp() * 6, phase: rp() * 6 };
    });
    const out = { c, k, pads };
    this.sheets.set(mode, out);
    return out;
  }

  // Draw the pond at a view. Clipped to its circle; the caller has laid
  // the screen transform (and the landscape camera, if any) already.
  draw(ctx, v, mode, { inkPat, dpr, t, bowl, fullsize = true, noAct = false }) {
    const sh = this.sheet(mode, dpr);
    const { Rc, D } = this;
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.scale(v.s, v.s * v.q);
    ctx.translate(-Rc, -Rc);
    ctx.beginPath();
    ctx.arc(Rc, Rc, Rc, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(sh.c, 0, 0, D, D);
    this.drawLines(ctx, mode);
    for (const kf of this.koi) {
      const f = kf.fish;
      // Fullsize off: the koi stay the size they are on the landscape.
      const c = fullsize ? 1 : v.s0 / v.s;
      if (c !== 1) { ctx.save(); ctx.translate(f.head.x, f.head.y); ctx.scale(c, c); ctx.translate(-f.head.x, -f.head.y); }
      if (mode === 'colour') f.draw(ctx);
      else drawInkKoi(ctx, f, { mode, fill: inkPat, seed: kf.seed, act: !noAct });
      if (c !== 1) ctx.restore();
    }
    for (const p of sh.pads) {
      const bob = this.reduced ? 0 : Math.sin(t * 0.35 + p.phase) * 1.2;
      ctx.save();
      ctx.translate(p.x, p.y + bob);
      ctx.rotate(p.rot + (this.reduced ? 0 : Math.sin(t * 0.21 + p.phase) * 0.03));
      ctx.drawImage(p.c, -p.S / 2, -p.S / 2, p.S, p.S);
      ctx.restore();
    }
    if (bowl) this.drawFood(ctx, bowl, mode);
    this.drawRipples(ctx, mode);
    ctx.restore();
  }

  drawLines(ctx, mode) {
    const ink = inkOf(mode);
    const { Rc, D } = this;
    for (const ln of this.lines) {
      const y = Rc + (ln.f - 0.5) * Rc * 1.4;
      const l = Math.min(this.W, this.H) * ln.len;
      const x = ((ln.x % (D + l * 2)) + D + l * 2) % (D + l * 2) - l;
      stroke(ctx, [[x, y], [x + l * 0.3, y - l * 0.07], [x + l * 0.65, y + l * 0.05], [x + l, y - l * 0.02]], { size: 1.6, fill: `rgb(${ink.join(',')})`, alpha: mode === 'colour' ? 0.12 : 0.2, press: 'swell', seed: ln.seed, pool: 0, wobble: 0.6 });
    }
  }

  drawRipples(ctx, mode) {
    const ink = inkOf(mode);
    for (const rp of this.ripples) {
      for (let j = 0; j < 2; j++) {
        const age = rp.t - j * 0.7;
        if (age <= 0) continue;
        const rr = 6 + age * 14, a = Math.max(0, 0.32 * (1 - age / 4.5));
        if (a <= 0) continue;
        const pts = [];
        for (let i = 0; i <= 26; i++) {
          const th = (i / 26) * Math.PI * 1.85 + rp.x * 0.01;
          pts.push([rp.x + Math.cos(th) * rr, rp.y + Math.sin(th) * rr * 0.86]);
        }
        stroke(ctx, pts, { size: 1.5, fill: `rgb(${ink.join(',')})`, alpha: a * (mode === 'colour' ? 0.7 : 1), press: 'swell', seed: 1700 + j, pool: 0, wobble: 0.4 });
      }
    }
  }

  // Food, in the dial's hand: in Colour, Quiet Waters' own pellets; in
  // Ink and Ink and wash, a dab of the brush each, and an ink ring.
  drawFood(ctx, bowl, mode) {
    if (mode === 'colour') { bowl.draw(ctx); return; }
    const ink = inkOf(mode);
    const fill = `rgb(${ink.join(',')})`;
    for (const rg of bowl.rings) {
      const k = rg.age / rg.life, rr = rg.r * (0.35 + (1 - (1 - k) ** 3));
      ctx.save();
      ctx.globalAlpha = rg.a * (1 - k) * 0.8;
      ctx.strokeStyle = fill;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(rg.x, rg.y, rr, rr * 0.8, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    for (const p of bowl.pellets) {
      if (p.age < 0) continue;
      const sink = bowl.sink(p), a = Math.min(1, p.age / 10) * (1 - sink);
      if (a <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha = a * 0.75;
      if (mode === 'wash') {
        ctx.fillStyle = `rgba(${pig('earth', mode).join(',')},0.8)`;
        ctx.beginPath(); ctx.ellipse(p.x, p.y + sink * 4, p.r * 1.3, p.r * 1.1, p.rot, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = fill;
      ctx.beginPath(); ctx.ellipse(p.x, p.y + sink * 4, p.r * 0.75, p.r * 0.6, p.rot, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    const h = bowl.hold;
    if (h && h.p > 0.04) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = fill;
      ctx.globalAlpha = 0.18; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(h.x, h.y, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.7; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.arc(h.x, h.y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp01(h.p)); ctx.stroke();
      ctx.restore();
    }
  }
}
