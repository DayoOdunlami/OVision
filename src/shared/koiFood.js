// ═══════════════════════════════════════════════════════════════════
// koiFood.js — feeding the koi, shared by the pond and the prayer koi.
//
// Double-tap the water (or press and hold, while a small ring fills)
// and a pinch of food is scattered there. It floats, drifts a little,
// soaks and slowly sinks — about forty seconds — and is gone.
//
// The koi don't all dart for it at once. Each fish has to *notice*
// each pellet: the scent spreads out from where it landed over the
// first several seconds, a fish close by is likelier to notice than
// one far off, curious koi notice sooner than shy ones, and a fish
// that sees another one eating nearby catches on quickly. So food
// often sits for a moment before the first fish comes, and the rest
// follow — which is what feeding a real pond looks like.
//
// SpineFish already knows how to swim to food and eat it (env.food);
// this decides *which* food each fish knows about, owns the pellets,
// and draws them.
//
//   const bowl = new FoodBowl();
//   bowl.scatter(x, y);                       // a pinch of food
//   bowl.update(fishList);                    // once a frame
//   fish.update(W, H, bowl.cursor(cur), {
//     food: bowl.foodFor(fish),
//     onBreak: bowl.onBreak,
//   });
//   bowl.draw(ctx);                           // above the fish
//
//   const off = feedGesture({ bowl, toLocal, canStart });   // input
// ═══════════════════════════════════════════════════════════════════

const LIFE = 2400;          // frames a pellet lasts (~40s)
const SOAK = 0.62;          // fraction of life before it starts sinking
const MAX = 36;             // pellets on the water at once
const SCENT_FRAMES = 540;   // how long the scent takes to spread fully
const rand = (a, b) => a + Math.random() * (b - a);

export class FoodBowl {
  constructor({ scale = 1 } = {}) {
    this.scale = scale;
    this.pellets = [];
    this.rings = [];          // { x, y, age, life, r, a }
    this.hold = null;         // { x, y, p } while a press is filling
    this.calm = null;         // { x, y, until } — see cursor()
    this.t = 0;
    this.onBreak = (x, y, kind) => {
      if (kind === 'feed') this.rings.push({ x, y, age: 0, life: 70, r: 26 * this.scale, a: 0.5 });
    };
  }

  // A pinch: a handful of pellets landing around (x, y) over a moment.
  scatter(x, y, n = 5 + Math.floor(Math.random() * 3)) {
    const s = this.scale;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * 26 * s;
      this.pellets.push({
        x: x + Math.cos(a) * d,
        y: y + Math.sin(a) * d * 0.8,
        vx: Math.cos(a) * rand(0.05, 0.22) * s,
        vy: Math.sin(a) * rand(0.05, 0.18) * s,
        r: rand(2.3, 3.3) * s,
        tone: Math.random(),
        rot: Math.random() * Math.PI,
        age: -i * 4,              // they land one after another
        eaten: false,
        seen: new Set(),
      });
    }
    while (this.pellets.length > MAX) this.pellets.shift();
    // Hold the cursor's sway over the fish for a moment: the hand that
    // fed them shouldn't frighten them off the food.
    this.calm = { x, y, until: this.t + 360 };
  }

  get active() {
    return this.pellets.length > 0;
  }

  // Each frame: drift, age, and let fish notice what's near them.
  update(fish = []) {
    this.t++;
    const feeding = fish.filter((f) => f.feedTarget);
    for (const p of this.pellets) {
      p.age++;
      if (p.age < 0) continue;
      if (p.age === 1) this.rings.push({ x: p.x, y: p.y, age: 0, life: 50, r: 11 * this.scale, a: 0.35 });
      // Spread a little from the throw, then a slow drift on the surface.
      p.x += p.vx; p.y += p.vy;
      p.vx = p.vx * 0.985 + Math.sin(this.t * 0.004 + p.tone * 6) * 0.0016;
      p.vy = p.vy * 0.985 + Math.cos(this.t * 0.003 + p.tone * 5) * 0.0012;
      p.rot += p.vx * 0.05;
      if (p.eaten) continue;
      const scent = (110 + 300 * Math.min(1, p.age / SCENT_FRAMES)) * Math.max(0.7, this.scale);
      // A pellet that's sinking is harder to spot.
      const sinking = this.sink(p);
      for (const f of fish) {
        if (p.seen.has(f) || !f.mouth) continue;
        const d = Math.hypot(f.mouth.x - p.x, f.mouth.y - p.y);
        if (d > scent) continue;
        const mood = f.variety?.personality === 'curious' ? 1.8 : f.variety?.personality === 'skittish' ? 0.55 : 1;
        let chance = 0.006 * mood * (1 - d / scent) * (1 - sinking * 0.6);
        // Seeing another koi eat close by is the strongest cue of all.
        for (const o of feeding) {
          if (o !== f && Math.hypot(o.mouth.x - p.x, o.mouth.y - p.y) < 160 * this.scale + 60) { chance += 0.03; break; }
        }
        if (Math.random() < chance) p.seen.add(f);
      }
    }
    this.pellets = this.pellets.filter((p) => !p.eaten && p.age < LIFE);
    for (const r of this.rings) r.age++;
    this.rings = this.rings.filter((r) => r.age < r.life);
  }

  // 0 floating → 1 gone below.
  sink(p) {
    return Math.max(0, Math.min(1, (p.age / LIFE - SOAK) / (1 - SOAK)));
  }

  // The pellets this fish knows about. SpineFish swims to the nearest.
  foodFor(f) {
    if (!this.pellets.length) return EMPTY;
    const out = [];
    for (const p of this.pellets) if (!p.eaten && p.age >= 0 && p.seen.has(f)) out.push(p);
    return out;
  }

  // The pointer as the fish should feel it. Just after feeding, a still
  // hand over the food is ignored until it moves away.
  cursor(cur) {
    const c = this.calm;
    if (!c) return cur;
    if (this.t > c.until || Math.hypot(cur.x - c.x, cur.y - c.y) > 90) { this.calm = null; return cur; }
    return FAR;
  }

  draw(ctx) {
    for (const r of this.rings) {
      const k = r.age / r.life;
      ctx.save();
      ctx.globalAlpha = r.a * (1 - k);
      ctx.strokeStyle = 'rgba(255, 250, 235, 0.9)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const rr = r.r * (0.35 + (1 - (1 - k) ** 3));
      ctx.ellipse(r.x, r.y, rr, rr * 0.78, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    for (const p of this.pellets) {
      if (p.age < 0) continue;
      const land = Math.min(1, p.age / 10);
      const sink = this.sink(p);
      const a = land * (1 - sink);
      if (a <= 0.01) continue;
      const r = p.r * (1 - sink * 0.35) * (0.6 + 0.4 * land);
      ctx.save();
      ctx.translate(p.x, p.y + sink * 4);
      ctx.rotate(p.rot);
      // Soft shadow on the water below, further off as it floats.
      ctx.globalAlpha = a * 0.25 * (1 - sink);
      ctx.fillStyle = '#0b2a2c';
      ctx.beginPath();
      ctx.ellipse(r * 0.7, r * 0.9, r, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      // The pellet: warm brown to ochre, a little oval, with a glint.
      ctx.globalAlpha = a;
      const c = p.tone < 0.5 ? [150, 92, 44] : [184, 124, 58];
      const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
      g.addColorStop(0, `rgb(${c[0] + 60},${c[1] + 55},${c[2] + 40})`);
      g.addColorStop(1, `rgb(${c[0]},${c[1]},${c[2]})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.84, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // The press-and-hold ring: fills as you hold, then the food falls.
    const h = this.hold;
    if (h && h.p > 0.04) {
      const R = 22 * Math.max(0.85, this.scale);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(255, 250, 238, 0.35)';
      ctx.beginPath();
      ctx.arc(h.x, h.y, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(232, 176, 92, 0.95)';
      ctx.beginPath();
      ctx.arc(h.x, h.y, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, h.p));
      ctx.stroke();
      ctx.restore();
    }
  }
}

const EMPTY = [];
const FAR = { x: -9999, y: -9999 };

// ── Input ─────────────────────────────────────────────────────────
// Double-tap / double-click, or press and hold, on anything that isn't
// a control. `toLocal(e)` maps the event to canvas space (or returns
// null to refuse: outside the water, say). `canStart(e)` can veto a
// press on a particular element.
const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [role="button"], [contenteditable], [data-no-feed]';
const HOLD_MS = 520;
const DOUBLE_MS = 340;

export function feedGesture({ bowl, toLocal, canStart = () => true, onFeed }) {
  let press = null;     // { id, x, y, cx, cy, t0, raf, fired }
  let lastTap = null;   // { x, y, t }

  const ok = (e) => !(e.target instanceof Element && e.target.closest(INTERACTIVE)) && canStart(e);
  const feed = (pt) => {
    bowl.scatter(pt.x, pt.y);
    onFeed?.(pt);
  };

  const tick = () => {
    if (!press) return;
    const p = Math.min(1, (performance.now() - press.t0 - 120) / (HOLD_MS - 120));
    bowl.hold = p > 0 ? { x: press.x, y: press.y, p } : null;
    if (p >= 1 && !press.fired) {
      press.fired = true;
      bowl.hold = null;
      feed(press);
      navigator.vibrate?.(8);
      return;
    }
    press.raf = requestAnimationFrame(tick);
  };

  const end = () => {
    if (press) cancelAnimationFrame(press.raf);
    bowl.hold = null;
  };

  const onDown = (e) => {
    if (e.button > 0 || !ok(e)) return;
    const pt = toLocal(e);
    if (!pt) return;
    end();
    press = { id: e.pointerId, x: pt.x, y: pt.y, cx: e.clientX, cy: e.clientY, t0: performance.now(), raf: 0, fired: false };
    press.raf = requestAnimationFrame(tick);
  };
  const onMove = (e) => {
    if (!press || e.pointerId !== press.id) return;
    if (Math.hypot(e.clientX - press.cx, e.clientY - press.cy) > 12) { end(); press = null; }
  };
  const onUp = (e) => {
    if (!press || e.pointerId !== press.id) return;
    const was = press;
    end();
    press = null;
    if (was.fired) { lastTap = null; return; }
    if (performance.now() - was.t0 > 300) return;   // a slow press isn't a tap
    const now = performance.now();
    if (lastTap && now - lastTap.t < DOUBLE_MS && Math.hypot(was.cx - lastTap.cx, was.cy - lastTap.cy) < 36) {
      lastTap = null;
      feed(was);
    } else {
      lastTap = { cx: was.cx, cy: was.cy, t: now };
    }
  };
  const onCancel = () => { end(); press = null; };
  // A long press on a phone opens the context menu; not on the water.
  const onMenu = (e) => { if (ok(e) && toLocal(e)) e.preventDefault(); };

  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointercancel', onCancel, { passive: true });
  window.addEventListener('contextmenu', onMenu);
  return () => {
    end();
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    window.removeEventListener('contextmenu', onMenu);
  };
}

// ── A first-time hint ────────────────────────────────────────────
// "Double-tap to feed the koi", shown on the first few visits until
// someone has fed them once.
const HINT_KEY = 'koiFood.fed';
export function wantsFeedHint() {
  try { return !localStorage.getItem(HINT_KEY); } catch { return false; }
}
export function markFed() {
  try { localStorage.setItem(HINT_KEY, '1'); } catch { /* ignore */ }
}

export function drawFeedHint(ctx, x, y, alpha, { dark = false } = {}) {
  if (alpha <= 0.01) return;
  const text = 'Double-tap or hold to feed the koi';
  ctx.save();
  ctx.font = '500 13px "Source Sans 3", Manrope, system-ui, sans-serif';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0.06em';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 28;
  ctx.globalAlpha = alpha * 0.9;
  ctx.fillStyle = dark ? 'rgba(42, 34, 29, 0.72)' : 'rgba(6, 30, 36, 0.55)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x - w / 2, y - 15, w, 30, 15);
  else ctx.rect(x - w / 2, y - 15, w, 30);
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#fff6e4';
  ctx.fillText(text, x, y + 0.5);
  ctx.restore();
}
