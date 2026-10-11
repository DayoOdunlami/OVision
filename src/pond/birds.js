// ═══════════════════════════════════════════════════════════════════
// birds.js — the pond's other world: birds over a dusk sky.
//
// The same board, the same meaning, a different place. Each koi
// variety has a bird of matching colour (a person's koi becomes their
// bird: the red-and-white kohaku a robin, the gold ogon a goldfinch, the
// showa a swallow), and a Bird answers to exactly what PondCanvas asks
// of a SpineFish:
//
//   update(W, H, cursor, { food, onBreak })   once a frame
//   draw(ctx)
//   head, mouth {x, y, radius}, parts [{x, y, radius, radian}],
//   tail.pieces[2] (wing tips, for the zones' wake), depth, variety,
//   personName, target, isIdle, feedTarget, fleeCooldown, fedCooldown
//
// So the zones keep working unchanged: birds swell near Full, take the
// colour near marrow, rock the commitments as they pass, scatter the
// identity word's particles, and come down to seed (double-tap).
//
// Behaviour follows the koi's: wander, then circle a while (a bird's
// idle is soaring in rings), curious ones come to a finger, shy ones
// scatter. "Depth" is height: high birds are smaller and paler.
// ═══════════════════════════════════════════════════════════════════

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const wrapAngle = (a) => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };

// A bird for each koi variety (same name, so named koi still work).
export const BIRD_LOOKS = {
  kohaku:   { bird: 'robin',     wing: '#6e5b45', belly: '#ece4d6', accent: '#d8582c', tail: 'fan' },
  chagoi:   { bird: 'sparrow',   wing: '#8a6440', belly: '#dcc7a5', accent: '#a8743f', tail: 'fan' },
  ogon:     { bird: 'goldfinch', wing: '#2c2a24', belly: '#f2d566', accent: '#e2b23a', bar: '#f0c94a', tail: 'fork' },
  karasu:   { bird: 'blackbird', wing: '#1e1d20', belly: '#2d2c30', accent: '#e39a2b', tail: 'fan' },
  shiro:    { bird: 'dove',      wing: '#e6e3dc', belly: '#f6f3ee', accent: '#cbc4ba', tail: 'fan' },
  hiUtsuri: { bird: 'redstart',  wing: '#2b2626', belly: '#e0642f', accent: '#e0642f', tail: 'fan' },
  sanke:    { bird: 'tern',      wing: '#e4dccd', belly: '#f5f1e9', accent: '#d8432c', cap: '#26221f', tail: 'fork' },
  showa:    { bird: 'swallow',   wing: '#1f2a44', belly: '#efe7da', accent: '#b8432f', tail: 'fork' },
  asagi:    { bird: 'bluebird',  wing: '#5b7fa6', belly: '#e9caa8', accent: '#4a6d96', tail: 'fan' },
};
const LOOK_FALLBACK = BIRD_LOOKS.chagoi;

class Target {
  constructor(x, y) { this.x = x; this.y = y; }
  getDistance(x, y) { return Math.hypot(this.x - x, this.y - y); }
}

export class Bird {
  constructor(W, H, variety) {
    this.variety = variety || { name: 'chagoi' };
    this.look = BIRD_LOOKS[this.variety.name] || LOOK_FALLBACK;
    const k = this.variety.sizeScale || 1;
    // A wingspan of about 90px at full size: smaller than a koi, as a
    // bird seen from below should be.
    this.span = 92 * k;
    this.len = this.span * 0.5;
    this.x = W * (0.2 + Math.random() * 0.6);
    this.y = H * (0.2 + Math.random() * 0.6);
    this.dir = Math.random() * TAU;
    this.speed = 1.2;
    this.energy = 0.4;
    this.depth = 0.3 + Math.random() * 0.3;
    this.targetDepth = this.depth;
    this.depthTimer = 300 + Math.random() * 900;
    this.flap = Math.random() * TAU;
    this.glide = 0;
    this.isIdle = false;
    this.idleCenter = null;
    this.idleDuration = 0;
    this.orbitPhase = Math.random() * TAU;
    this.orbitDir = Math.random() < 0.5 ? -1 : 1;
    this.fleeCooldown = 0;
    this.fedCooldown = 0;
    this.feedTarget = null;
    this.wanderTimer = 0;
    this.personName = null;
    this.target = new Target(this.x, this.y);
    this.pickWanderTarget(W, H);
    this.syncPoints();
  }

  pickWanderTarget(W, H) {
    const m = Math.min(W, H) * 0.12;
    this.target = new Target(m + Math.random() * (W - 2 * m), m + Math.random() * (H - 2 * m));
  }

  update(W, H, cur, env) {
    const food = env?.food;
    const onBreak = env?.onBreak;
    const personality = this.variety.personality || 'normal';

    // A finger in the sky: curious birds come and look; others veer off.
    if (cur && cur.x > -1000) {
      const dx = this.x - cur.x, dy = this.y - cur.y;
      const d = Math.hypot(dx, dy);
      if (personality === 'curious' && d > 70 && d < 320) {
        if (this.fleeCooldown <= 0) {
          this.target = new Target(cur.x, cur.y);
          this.isIdle = false;
          this.energy = Math.max(this.energy, 0.5);
        }
      } else if (d < (personality === 'skittish' ? 240 : 170)) {
        const n = d || 1;
        const far = personality === 'skittish' ? 520 : 400;
        this.target = new Target(clamp(this.x + (dx / n) * far, 60, W - 60), clamp(this.y + (dy / n) * far, 60, H - 60));
        this.fleeCooldown = personality === 'skittish' ? 120 : 80;
        this.energy = 1;
        this.isIdle = false;
        this.feedTarget = null;
      }
    }

    // Seed: swoop down to the nearest the bird has noticed.
    if (food && food.length && this.fleeCooldown <= 0 && this.fedCooldown <= 0) {
      let best = null, bd = Infinity;
      for (const f of food) {
        if (f.eaten) continue;
        const d = Math.hypot(f.x - this.mouth.x, f.y - this.mouth.y);
        if (d < bd && d < 380) { bd = d; best = f; }
      }
      if (best) {
        this.feedTarget = best;
        this.target = new Target(best.x, best.y);
        this.isIdle = false;
        this.energy = Math.max(this.energy, 0.8);
        this.targetDepth = 0;
        if (bd < 20) {
          best.eaten = true;
          this.feedTarget = null;
          this.fedCooldown = 260 + Math.random() * 160;
          this.isIdle = true;
          this.idleCenter = { x: this.x, y: this.y };
          this.idleDuration = 260 + Math.random() * 200;
          this.targetDepth = 0.45 + Math.random() * 0.2;
          onBreak?.(best.x, best.y, 'feed');
        }
      } else this.feedTarget = null;
    } else this.feedTarget = null;
    if (this.fedCooldown > 0) this.fedCooldown--;

    // Wander → circle (a bird's rest is soaring in rings) → wander.
    if (this.fleeCooldown > 0) this.fleeCooldown--;
    else if (!this.feedTarget) {
      if (this.isIdle) {
        this.idleDuration--;
        if (!this.idleCenter) this.idleCenter = { x: this.x, y: this.y };
        this.orbitPhase += 0.008 * this.orbitDir;
        const r = 70 + Math.sin(this.orbitPhase * 0.37) * 22;
        this.target.x = this.idleCenter.x + Math.cos(this.orbitPhase) * r;
        this.target.y = this.idleCenter.y + Math.sin(this.orbitPhase) * r * 0.7;
        if (this.idleDuration <= 0) {
          this.isIdle = false;
          this.idleCenter = null;
          this.pickWanderTarget(W, H);
          this.wanderTimer = 0;
          this.energy = 0.4 + Math.random() * 0.15;
        }
      } else {
        this.wanderTimer++;
        if (this.target.getDistance(this.x, this.y) < 70) {
          this.isIdle = true;
          this.idleDuration = 220 + Math.random() * 300;
          this.idleCenter = { x: this.x, y: this.y };
          this.orbitDir = Math.random() < 0.5 ? -1 : 1;
          this.energy = 0.22 + Math.random() * 0.1;
        } else if (this.wanderTimer > 420 + Math.random() * 520) {
          this.pickWanderTarget(W, H);
          this.wanderTimer = 0;
        }
      }
    }
    if (this.fleeCooldown <= 0 && !this.feedTarget) {
      this.energy += ((this.isIdle ? 0.22 : 0.4) - this.energy) * 0.02;
    }

    // Height drifts slowly between high and low.
    this.depthTimer--;
    if (this.depthTimer <= 0 && !this.feedTarget && this.fedCooldown <= 0) {
      this.targetDepth = 0.2 + Math.random() * 0.45;
      this.depthTimer = 500 + Math.random() * 1400;
    }
    this.depth += (this.targetDepth - this.depth) * 0.012;

    // Steer: a bird can't stop or turn on the spot.
    const want = Math.atan2(this.target.y - this.y, this.target.x - this.x);
    const turn = 0.025 + 0.05 * this.energy;
    this.dir += clamp(wrapAngle(want - this.dir), -turn, turn);
    const sp = 0.7 + 2.6 * this.energy;
    this.speed += (sp - this.speed) * 0.05;
    this.x += Math.cos(this.dir) * this.speed;
    this.y += Math.sin(this.dir) * this.speed;
    // Kept inside the sky, gently.
    const m = 30;
    if (this.x < m || this.x > W - m || this.y < m || this.y > H - m) {
      this.target.x = clamp(this.target.x, W * 0.15, W * 0.85);
      this.target.y = clamp(this.target.y, H * 0.15, H * 0.85);
    }

    // Wings: beat when working (climbing, fleeing, going for seed),
    // glide when circling. The beat slows as the bird settles.
    const working = this.energy > 0.5 || this.feedTarget || this.targetDepth < this.depth - 0.05;
    this.glide += ((working ? 0 : 1) - this.glide) * 0.03;
    if (this.glide < 0.6 || Math.sin(this.orbitPhase * 3.1) > 0.92) this.flap += 0.16 + 0.22 * this.energy;
    this.syncPoints();
  }

  // Points the rest of the pond reads (labels, wake, swell, food).
  syncPoints() {
    const c = Math.cos(this.dir), s = Math.sin(this.dir);
    const sc = this.scale();
    const L = this.len * sc, half = (this.span * sc) / 2;
    const bodyR = L * 0.16;
    this.head = { x: this.x + c * L * 0.32, y: this.y + s * L * 0.32, radius: bodyR };
    this.mouth = { x: this.x + c * L * 0.48, y: this.y + s * L * 0.48, radius: bodyR * 0.6 };
    this.parts = [
      { x: this.x, y: this.y, radius: bodyR * 1.2, radian: this.dir },
      { x: this.x - c * L * 0.3, y: this.y - s * L * 0.3, radius: bodyR, radian: this.dir },
    ];
    const w = half * (0.55 + 0.45 * Math.abs(Math.cos(this.flap)));
    this.tail = {
      pieces: [[], [], [
        { x: this.x - s * w, y: this.y + c * w },
        { x: this.x - c * L * 0.4, y: this.y - s * L * 0.4 },
        { x: this.x + s * w, y: this.y - c * w },
      ]],
    };
  }

  scale() { return 1.18 - this.depth * 0.62; }

  draw(ctx) {
    const lk = this.look;
    const sc = this.scale();
    const L = this.len * sc, half = (this.span * sc) / 2;
    // Wing beat: the span opens and closes; a glide holds it wide.
    const beat = Math.cos(this.flap);
    const open = this.glide * 0.95 + (1 - this.glide) * (0.5 + 0.5 * beat);
    const span = half * (0.35 + 0.65 * open);
    const sweep = L * (0.12 + 0.18 * (1 - open));
    // High birds are paler: the sky between.
    const haze = clamp((this.depth - 0.2) / 0.5, 0, 1) * 0.35;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.dir);
    ctx.globalAlpha *= 1 - haze * 0.5;

    // A soft shadow under the bird reads as height.
    // Wings (both), swept back from the shoulders.
    ctx.fillStyle = lk.wing;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(L * 0.12, 0);
      ctx.quadraticCurveTo(L * 0.05, side * span * 0.55, -sweep, side * span);
      ctx.quadraticCurveTo(-sweep - L * 0.12, side * span * 0.85, -L * 0.18, side * span * 0.42);
      ctx.quadraticCurveTo(-L * 0.12, side * L * 0.05, -L * 0.1, 0);
      ctx.closePath();
      ctx.fill();
      if (lk.bar) {
        ctx.strokeStyle = lk.bar;
        ctx.lineWidth = Math.max(1, L * 0.05);
        ctx.beginPath();
        ctx.moveTo(L * 0.02, side * span * 0.3);
        ctx.quadraticCurveTo(-L * 0.04, side * span * 0.55, -sweep * 0.7, side * span * 0.78);
        ctx.stroke();
      }
    }
    // Tail: a fork for swallows, terns and finches; a fan otherwise.
    ctx.fillStyle = lk.wing;
    ctx.beginPath();
    if (lk.tail === 'fork') {
      ctx.moveTo(-L * 0.28, -L * 0.06);
      ctx.lineTo(-L * 0.72, -L * 0.2);
      ctx.lineTo(-L * 0.46, 0);
      ctx.lineTo(-L * 0.72, L * 0.2);
      ctx.lineTo(-L * 0.28, L * 0.06);
    } else {
      ctx.moveTo(-L * 0.26, -L * 0.07);
      ctx.quadraticCurveTo(-L * 0.62, -L * 0.17, -L * 0.6, 0);
      ctx.quadraticCurveTo(-L * 0.62, L * 0.17, -L * 0.26, L * 0.07);
    }
    ctx.closePath();
    ctx.fill();
    // Body, from below: pale belly, coloured breast, head.
    ctx.fillStyle = lk.belly;
    ctx.beginPath();
    ctx.ellipse(-L * 0.02, 0, L * 0.34, L * 0.14, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = lk.accent;
    ctx.beginPath();
    ctx.ellipse(L * 0.17, 0, L * 0.13, L * 0.12, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = lk.cap || lk.wing;
    ctx.beginPath();
    ctx.arc(L * 0.33, 0, L * 0.1, 0, TAU);
    ctx.fill();
    // Beak.
    ctx.fillStyle = lk.bird === 'blackbird' || lk.bird === 'tern' ? lk.accent : '#3a2f25';
    ctx.beginPath();
    ctx.moveTo(L * 0.41, -L * 0.035);
    ctx.lineTo(L * 0.52, 0);
    ctx.lineTo(L * 0.41, L * 0.035);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// ── The sky ───────────────────────────────────────────────────────
// Dusk: deep blue overhead to a low, warm glow — dark enough that the
// board's light type reads over it, as it does over the pond's water.
export const DUSK = {
  top: '#18203d', mid: '#323a68', low: '#6f5d86', glow: 'rgba(240,170,120,0.35)',
  body: '#18203d',
};

export function paintSky(ctx, W, H, pal = DUSK) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, pal.top);
  g.addColorStop(0.6, pal.mid);
  g.addColorStop(1, pal.low);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const r = ctx.createRadialGradient(W * 0.5, H * 1.15, 0, W * 0.5, H * 1.15, Math.max(W, H) * 0.7);
  r.addColorStop(0, pal.glow);
  r.addColorStop(1, 'rgba(240,170,120,0)');
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, W, H);
}

// A few faint stars and long, slow clouds: the sky's equivalent of the
// pond's currents and caustics. Drawn from a fixed seed so they stay put.
export class SkyLife {
  constructor() {
    let s = 7;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    this.stars = Array.from({ length: 60 }, () => [rand(), rand() * 0.55, 0.4 + rand() * 1.1, rand() * 6]);
    this.clouds = Array.from({ length: 5 }, (_, i) => ({
      y: 0.15 + i * 0.16 + rand() * 0.05, x: rand(), w: 0.35 + rand() * 0.4, h: 0.035 + rand() * 0.03,
      v: 0.00003 + rand() * 0.00005, a: 0.05 + rand() * 0.06,
    }));
  }

  draw(ctx, W, H, t, { clouds = true } = {}) {
    for (const [x, y, r, ph] of this.stars) {
      ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t * 0.02 + ph);
      ctx.fillStyle = '#fff6e0';
      ctx.beginPath();
      ctx.arc(x * W, y * H, r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!clouds) return;
    for (const c of this.clouds) {
      const cx = (((c.x + t * c.v) % 1.6) - 0.3) * W;
      const g = ctx.createRadialGradient(cx, c.y * H, 0, cx, c.y * H, c.w * W * 0.5);
      g.addColorStop(0, `rgba(236,214,226,${c.a})`);
      g.addColorStop(1, 'rgba(236,214,226,0)');
      ctx.save();
      ctx.translate(cx, c.y * H);
      ctx.scale(1, (c.h * H) / (c.w * W * 0.5));
      ctx.translate(-cx, -c.y * H);
      ctx.fillStyle = g;
      ctx.fillRect(cx - c.w * W * 0.5, c.y * H - c.w * W * 0.5, c.w * W, c.w * W);
      ctx.restore();
    }
  }
}
