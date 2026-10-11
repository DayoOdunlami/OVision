// ═══════════════════════════════════════════════════════════════════
// birds2.js — the sky world, second pass (Labs: pond.birds2 /
// pond.clouds2). Same contract as birds.js (see the header there), with
// the motion rebuilt on proven open-source rules:
//
//   · Flocking after Craig Reynolds' boids, as used in three.js's
//     webgl_gpgpu_birds and Vanta.js BIRDS (both MIT): keep apart from
//     close neighbours, match heading with nearer ones, drift toward
//     the group further out — loosely, so each bird keeps its own
//     errand (wandering, circling, coming for seed).
//   · The wing beat from the same examples: the wingtip rises and falls
//     on a sine, and beats faster the faster the bird flies.
//   · Our own on top: a wing that bends at the wrist and folds on the
//     upstroke, banking into turns (the outer wing reaches, the tail
//     fans), glides with wings held and bursts of flapping between, and
//     each species flying its own way — the stork slow and soaring, the
//     sparrow quick and busy, the swallow sharp and long-tailed.
//
// The species include birds of the Bible, each with its verse:
//   dove (Matthew 3:16) · sparrow (Matthew 10:29–31) · raven (Luke 12:24)
//   swallow (Psalm 84:3) · stork (Jeremiah 8:7)
//
// SkyScape draws the sky around them: painted clouds in three layers
// that part around a passing bird and close again behind it, a distant
// murmuration, and parallax as the board scrolls. Birds high up pass
// behind the middle clouds; low ones in front — so they fly through.
// ═══════════════════════════════════════════════════════════════════

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const wrap = (a) => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

// ── Species ───────────────────────────────────────────────────────
// span: wingspan relative to the default; chord: how broad the wing is
// (swallow narrow, raven broad); fingers: spread primaries at the tip;
// flap: beat-rate factor; glide: how readily it glides; tail: shape.
export const SPECIES = {
  dove:      { name: 'Dove', verse: 'Matthew 3:16', span: 1.0, chord: 0.5, fingers: 0, flap: 1.15, glide: 0.45, tail: 'fan',
               wing: '#e9e6e0', tip: '#bdb7ae', belly: '#f6f3ee', accent: '#d9d2c8', head: '#ebe7e1', beak: '#c98a6a' },
  sparrow:   { name: 'Sparrow', verse: 'Matthew 10:29–31', span: 0.78, chord: 0.58, fingers: 0, flap: 1.6, glide: 0.12, tail: 'notch',
               wing: '#8d6a47', tip: '#5e4632', belly: '#ddc9a8', accent: '#a37a4f', head: '#7d5a3c', beak: '#4a3a2c' },
  raven:     { name: 'Raven', verse: 'Luke 12:24', span: 1.25, chord: 0.5, fingers: 5, flap: 0.8, glide: 0.7, tail: 'wedge',
               wing: '#25232a', tip: '#141318', belly: '#2e2c33', accent: '#3a3742', head: '#1e1d22', beak: '#1a191d' },
  swallow:   { name: 'Swallow', verse: 'Psalm 84:3', span: 1.0, chord: 0.3, fingers: 0, flap: 1.3, glide: 0.5, tail: 'fork',
               wing: '#1f2a46', tip: '#151c31', belly: '#f0e8db', accent: '#b8432f', head: '#1f2a46', beak: '#1a1a1a' },
  stork:     { name: 'Stork', verse: 'Jeremiah 8:7', span: 1.5, chord: 0.46, fingers: 6, flap: 0.55, glide: 0.92, tail: 'short',
               wing: '#f2efe8', tip: '#1d1b1e', belly: '#f5f2ec', accent: '#f5f2ec', head: '#f2efe8', beak: '#d2482c', neck: 0.55, legs: '#d2482c' },
  robin:     { name: 'Robin', span: 0.85, chord: 0.56, fingers: 0, flap: 1.4, glide: 0.2, tail: 'fan',
               wing: '#6e5b45', tip: '#4c3e30', belly: '#ece4d6', accent: '#d8582c', head: '#6e5b45', beak: '#3a2f25' },
  goldfinch: { name: 'Goldfinch', span: 0.8, chord: 0.5, fingers: 0, flap: 1.5, glide: 0.18, tail: 'notch',
               wing: '#2c2a24', tip: '#1c1b17', belly: '#f2d566', accent: '#e2b23a', bar: '#f0c94a', head: '#c9392f', beak: '#e8d9c4' },
  bluebird:  { name: 'Bluebird', span: 0.85, chord: 0.55, fingers: 0, flap: 1.35, glide: 0.25, tail: 'notch',
               wing: '#5b7fa6', tip: '#3e5d80', belly: '#e9caa8', accent: '#d9925e', head: '#5b7fa6', beak: '#2b2a2a' },
  redstart:  { name: 'Redstart', span: 0.8, chord: 0.5, fingers: 0, flap: 1.5, glide: 0.18, tail: 'fan',
               wing: '#2b2626', tip: '#1a1717', belly: '#e0642f', accent: '#e0642f', head: '#2b2626', beak: '#1a1717', tailColor: '#d8572a' },
};

// Each koi variety's bird: the person's koi colour, in the sky. Where a
// bird of the Bible matches the koi, it's that one.
export const SPECIES_FOR_KOI = {
  shiro: 'dove', chagoi: 'sparrow', karasu: 'raven', showa: 'swallow', sanke: 'stork',
  kohaku: 'robin', ogon: 'goldfinch', asagi: 'bluebird', hiUtsuri: 'redstart',
};

class Target {
  constructor(x, y) { this.x = x; this.y = y; }
  getDistance(x, y) { return Math.hypot(this.x - x, this.y - y); }
}

export class Bird2 {
  constructor(W, H, variety) {
    this.variety = variety || { name: 'chagoi' };
    this.kind = SPECIES_FOR_KOI[this.variety.name] || 'sparrow';
    this.sp = SPECIES[this.kind];
    const k = this.variety.sizeScale || 1;
    this.span = 96 * k * this.sp.span;
    this.len = this.span * (this.sp.neck ? 0.62 : 0.48);
    this.x = W * (0.15 + Math.random() * 0.7);
    this.y = H * (0.15 + Math.random() * 0.7);
    const a = Math.random() * TAU;
    this.vx = Math.cos(a); this.vy = Math.sin(a);
    this.dir = a;
    this.bank = 0;
    this.energy = 0.4;
    this.depth = 0.25 + Math.random() * 0.4;
    this.targetDepth = this.depth;
    this.depthTimer = 300 + Math.random() * 900;
    this.phase = Math.random() * TAU;
    this.glide = 0;
    this.burst = 0;
    this.glideTimer = 120 + Math.random() * 200;
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
    this.flock = null;
    this.tint = 0;
    this.target = new Target(this.x, this.y);
    this.pickWanderTarget(W, H);
    this.syncPoints();
  }

  joinFlock(all) { this.flock = all; }

  pickWanderTarget(W, H) {
    const m = Math.min(W, H) * 0.12;
    this.target = new Target(m + Math.random() * (W - 2 * m), m + Math.random() * (H - 2 * m));
  }

  update(W, H, cur, env) {
    const food = env?.food;
    const onBreak = env?.onBreak;
    const personality = this.variety.personality || 'normal';
    const sc = this.scale();

    // A finger in the sky: curious birds come to look; others veer away.
    if (cur && cur.x > -1000) {
      const dx = this.x - cur.x, dy = this.y - cur.y;
      const d = Math.hypot(dx, dy);
      if (personality === 'curious' && d > 80 && d < 320) {
        if (this.fleeCooldown <= 0) {
          this.target = new Target(cur.x, cur.y);
          this.isIdle = false;
          this.energy = Math.max(this.energy, 0.5);
        }
      } else if (d < (personality === 'skittish' ? 240 : 170)) {
        const n = d || 1, far = personality === 'skittish' ? 520 : 400;
        this.target = new Target(clamp(this.x + (dx / n) * far, 60, W - 60), clamp(this.y + (dy / n) * far, 60, H - 60));
        this.fleeCooldown = personality === 'skittish' ? 120 : 80;
        this.energy = 1;
        this.isIdle = false;
        this.feedTarget = null;
        this.burst = Math.max(this.burst, 50);
      }
    }

    // Seed: a bird that has noticed it comes down for it.
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
        this.energy = Math.max(this.energy, 0.75);
        this.targetDepth = 0;
        if (bd < 22) {
          best.eaten = true;
          this.feedTarget = null;
          this.fedCooldown = 260 + Math.random() * 160;
          this.isIdle = true;
          this.idleCenter = { x: this.x, y: this.y };
          this.idleDuration = 260 + Math.random() * 200;
          this.targetDepth = 0.45 + Math.random() * 0.2;
          this.burst = 40;
          onBreak?.(best.x, best.y, 'feed');
        }
      } else this.feedTarget = null;
    } else this.feedTarget = null;
    if (this.fedCooldown > 0) this.fedCooldown--;

    // Errands: wander → circle on a thermal → wander.
    if (this.fleeCooldown > 0) this.fleeCooldown--;
    else if (!this.feedTarget) {
      if (this.isIdle) {
        this.idleDuration--;
        if (!this.idleCenter) this.idleCenter = { x: this.x, y: this.y };
        // Soaring birds circle wide and slow; small ones tighter.
        this.orbitPhase += (0.006 + 0.004 * (1 - this.sp.glide)) * this.orbitDir;
        const r = (60 + 50 * this.sp.glide) * (0.8 + 0.2 * Math.sin(this.orbitPhase * 0.37));
        this.target.x = this.idleCenter.x + Math.cos(this.orbitPhase) * r;
        this.target.y = this.idleCenter.y + Math.sin(this.orbitPhase) * r * 0.72;
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
          this.idleDuration = 240 + Math.random() * 340;
          this.idleCenter = { x: this.x, y: this.y };
          this.orbitDir = Math.random() < 0.5 ? -1 : 1;
          this.energy = 0.22 + Math.random() * 0.1;
        } else if (this.wanderTimer > 420 + Math.random() * 520) {
          this.pickWanderTarget(W, H);
          this.wanderTimer = 0;
        }
      }
    }
    if (this.fleeCooldown <= 0 && !this.feedTarget) this.energy += ((this.isIdle ? 0.22 : 0.4) - this.energy) * 0.02;

    // Height drifts slowly between high and low.
    this.depthTimer--;
    if (this.depthTimer <= 0 && !this.feedTarget && this.fedCooldown <= 0) {
      this.targetDepth = 0.15 + Math.random() * 0.55;
      this.depthTimer = 500 + Math.random() * 1400;
    }
    const climbing = this.targetDepth < this.depth - 0.04;
    this.depth += (this.targetDepth - this.depth) * 0.01;

    // ── Steering (boids) ──────────────────────────────────────────
    const maxSpeed = (0.9 + 2.5 * this.energy) * (0.8 + 0.2 * this.sp.span);
    const maxForce = 0.035 + 0.06 * this.energy;
    let ax = 0, ay = 0;
    // Seek the errand.
    {
      const dx = this.target.x - this.x, dy = this.target.y - this.y;
      const d = Math.hypot(dx, dy) || 1;
      // Arrive: ease off near the target unless it's food.
      const want = this.feedTarget ? maxSpeed : maxSpeed * clamp(d / 120, 0.55, 1);
      ax += (dx / d) * want - this.vx;
      ay += (dy / d) * want - this.vy;
    }
    // Loose flocking with the other birds.
    if (this.flock) {
      let sx = 0, sy = 0, axl = 0, ayl = 0, cx = 0, cy = 0, na = 0, nc = 0;
      const sepR = 70 * sc, aliR = 170, cohR = 240;
      for (const o of this.flock) {
        if (o === this) continue;
        const dx = o.x - this.x, dy = o.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d < sepR && d > 0) { sx -= dx / d * (1 - d / sepR); sy -= dy / d * (1 - d / sepR); }
        if (d < aliR) { axl += o.vx; ayl += o.vy; na++; }
        if (d < cohR) { cx += o.x; cy += o.y; nc++; }
      }
      ax += sx * 1.4;
      ay += sy * 1.4;
      if (na) { ax += (axl / na - this.vx) * 0.12; ay += (ayl / na - this.vy) * 0.12; }
      if (nc && !this.isIdle) { ax += (cx / nc - this.x) * 0.0006; ay += (cy / nc - this.y) * 0.0006; }
    }
    // Keep inside the sky, softly.
    const m = 50;
    if (this.x < m) ax += (m - this.x) * 0.002;
    if (this.x > W - m) ax -= (this.x - (W - m)) * 0.002;
    if (this.y < m) ay += (m - this.y) * 0.002;
    if (this.y > H - m) ay -= (this.y - (H - m)) * 0.002;
    const f = Math.hypot(ax, ay);
    if (f > maxForce) { ax *= maxForce / f; ay *= maxForce / f; }
    this.vx += ax; this.vy += ay;
    // A bird can't stop: a floor on speed, a ceiling too.
    let s = Math.hypot(this.vx, this.vy);
    const minSpeed = 0.55 + 0.25 * this.sp.glide;
    if (s < minSpeed) { this.vx *= minSpeed / (s || 1); this.vy *= minSpeed / (s || 1); s = minSpeed; }
    if (s > maxSpeed * 1.15) { this.vx *= (maxSpeed * 1.15) / s; this.vy *= (maxSpeed * 1.15) / s; s = maxSpeed * 1.15; }
    this.x += this.vx; this.y += this.vy;
    const nd = Math.atan2(this.vy, this.vx);
    const turn = wrap(nd - this.dir);
    this.dir = nd;
    // Bank into the turn (smoothed): the outer wing reaches, the tail fans.
    this.bank += (clamp(turn * 22, -1, 1) - this.bank) * 0.08;
    this.speed = s;

    // ── Wings ────────────────────────────────────────────────────
    // Effort (climbing, fleeing, going for seed, speeding up) means
    // flapping; otherwise the bird glides and flaps in short bursts —
    // more often the less of a glider it is.
    const effort = this.feedTarget || this.fleeCooldown > 0 || climbing || this.energy > 0.6;
    if (effort) this.burst = Math.max(this.burst, 30);
    if (this.burst > 0) {
      this.burst--;
    } else if (--this.glideTimer <= 0) {
      this.burst = Math.round((14 + Math.random() * 30) * (1.2 - this.sp.glide));
      this.glideTimer = (40 + Math.random() * 180) * (0.4 + this.sp.glide * 1.6);
    }
    const flapping = this.burst > 0;
    this.glide += ((flapping ? 0 : 1) - this.glide) * 0.06;
    // Beat faster with speed (three.js birds), and per species.
    const rate = (0.11 + 0.035 * s) * this.sp.flap;
    if (flapping) this.phase += rate;
    else {
      // Settle the wings level (top of the downstroke) to glide.
      const level = Math.PI * 0.08;
      const d = wrap(level - (this.phase % TAU));
      this.phase += clamp(d, -rate, rate) * 0.5;
    }
    this.syncPoints();
  }

  scale() { return 1.18 - this.depth * 0.62; }

  syncPoints() {
    const c = Math.cos(this.dir), s = Math.sin(this.dir);
    const sc = this.scale();
    const L = this.len * sc, half = (this.span * sc) / 2;
    const bodyR = L * 0.15;
    this.head = { x: this.x + c * L * 0.34, y: this.y + s * L * 0.34, radius: bodyR };
    this.mouth = { x: this.x + c * L * 0.5, y: this.y + s * L * 0.5, radius: bodyR * 0.6 };
    this.parts = [
      { x: this.x, y: this.y, radius: bodyR * 1.2, radian: this.dir },
      { x: this.x - c * L * 0.3, y: this.y - s * L * 0.3, radius: bodyR, radian: this.dir },
    ];
    const w = half * 0.8;
    this.tail = {
      pieces: [[], [], [
        { x: this.x - s * w, y: this.y + c * w },
        { x: this.x - c * L * 0.4, y: this.y - s * L * 0.4 },
        { x: this.x + s * w, y: this.y - c * w },
      ]],
    };
  }

  // The bird's colours as they are now: hazed toward the sky when high,
  // and taking the friction word's crimson when close to it.
  colour(h) {
    let c = hex(h);
    const haze = clamp((this.depth - 0.2) / 0.55, 0, 1) * 0.42;
    if (haze > 0) c = mix(c, [58, 64, 108], haze);
    if (this.tint > 0) c = mix(c, [196, 56, 30], this.tint * 0.75);
    return c;
  }

  draw(ctx) {
    const sp = this.sp;
    const sc = this.scale();
    const L = this.len * sc, half = (this.span * sc) / 2;
    const e = Math.sin(this.phase);                // −1 wings down … +1 up
    const up = Math.max(0, Math.cos(this.phase));  // rising: the upstroke
    const g = this.glide;
    // Seen from below, a raised or lowered wing looks shorter.
    const proj = 0.42 + 0.58 * Math.cos(e * 1.05) * (1 - g) + g * 0.98;
    const fold = up * (1 - g) * 0.95;              // wrist folds on the upstroke
    const chord = L * sp.chord;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.dir);

    const wingFill = (side) => {
      const gr = ctx.createLinearGradient(0, 0, 0, side * half);
      gr.addColorStop(0, rgb(this.colour(sp.wing)));
      gr.addColorStop(0.55, rgb(this.colour(sp.wing)));
      gr.addColorStop(1, rgb(this.colour(sp.tip)));
      return gr;
    };

    for (const side of [-1, 1]) {
      // Bank: the outer wing (away from the turn) reaches further.
      const reach = 1 + side * this.bank * 0.22;
      const span = half * proj * reach;
      const arm = span * 0.42, hand = span * 0.62;
      const armSweep = 0.12 + 0.3 * fold;
      const handSweep = armSweep + 0.25 + 1.05 * fold + g * 0.12;
      const sx = L * 0.06, sy = side * L * 0.1;              // shoulder
      const wx = sx - Math.sin(armSweep) * arm, wy = sy + side * Math.cos(armSweep) * arm;   // wrist
      const tx = wx - Math.sin(handSweep) * hand, ty = wy + side * Math.cos(handSweep) * hand; // tip
      const ch = chord * (1 - fold * 0.35);
      ctx.fillStyle = wingFill(side);
      ctx.beginPath();
      ctx.moveTo(sx + L * 0.1, sy * 0.6);
      // Leading edge: shoulder → wrist (a gentle bow) → tip.
      ctx.quadraticCurveTo(sx + L * 0.12, (sy + wy) / 2, wx + L * 0.03, wy);
      ctx.quadraticCurveTo(wx - (wx - tx) * 0.35, wy + (ty - wy) * 0.55, tx, ty);
      // Trailing edge: from the tip back to the body, with the primaries'
      // fingers spread on soaring birds.
      const n = sp.fingers;
      if (n > 0) {
        for (let i = 1; i <= n; i++) {
          const k = i / (n + 1);
          const px = tx + (wx - ch * 0.9 - tx) * k * 0.75, py = ty + (wy - ty) * k * 0.75;
          const len = ch * 0.38 * (1 - k * 0.6);
          ctx.lineTo(px - len * 0.6, py + side * len * 0.2);
          ctx.lineTo(px - len * 0.25, py - side * len * 0.15);
        }
      }
      ctx.quadraticCurveTo(wx - ch * 0.9, wy + side * ch * 0.15, wx - ch, wy - side * ch * 0.1);
      ctx.quadraticCurveTo(sx - ch * 0.8, sy + side * ch * 0.25, -L * 0.14, sy * 0.4);
      ctx.closePath();
      ctx.fill();
      if (sp.bar) {
        ctx.strokeStyle = rgb(this.colour(sp.bar));
        ctx.lineWidth = Math.max(1, L * 0.05);
        ctx.beginPath();
        ctx.moveTo(sx - ch * 0.3, sy + side * L * 0.02);
        ctx.quadraticCurveTo(wx - ch * 0.4, (sy + wy) / 2, wx - ch * 0.45, wy);
        ctx.stroke();
      }
    }

    // Tail: spreads in a turn and when slow.
    const spread = 1 + Math.abs(this.bank) * 0.7 + (1 - clamp(this.speed / 2, 0, 1)) * 0.3;
    ctx.fillStyle = rgb(this.colour(sp.tailColor || sp.wing));
    ctx.beginPath();
    const tb = -L * 0.26;
    if (sp.tail === 'fork') {
      const tl = L * 0.62, tw = L * 0.13 * spread;
      ctx.moveTo(tb, -L * 0.06);
      ctx.lineTo(tb - tl, -tw * 1.5);
      ctx.lineTo(tb - tl * 0.42, 0);
      ctx.lineTo(tb - tl, tw * 1.5);
      ctx.lineTo(tb, L * 0.06);
    } else if (sp.tail === 'wedge') {
      ctx.moveTo(tb, -L * 0.07);
      ctx.lineTo(tb - L * 0.3, -L * 0.13 * spread);
      ctx.lineTo(tb - L * 0.42, 0);
      ctx.lineTo(tb - L * 0.3, L * 0.13 * spread);
      ctx.lineTo(tb, L * 0.07);
    } else if (sp.tail === 'short') {
      ctx.moveTo(tb, -L * 0.07);
      ctx.quadraticCurveTo(tb - L * 0.2, -L * 0.1 * spread, tb - L * 0.2, 0);
      ctx.quadraticCurveTo(tb - L * 0.2, L * 0.1 * spread, tb, L * 0.07);
    } else {
      const notch = sp.tail === 'notch' ? L * 0.05 : 0;
      ctx.moveTo(tb, -L * 0.07);
      ctx.quadraticCurveTo(tb - L * 0.36, -L * 0.17 * spread, tb - L * 0.36, -L * 0.04);
      ctx.lineTo(tb - L * 0.36 + notch, 0);
      ctx.lineTo(tb - L * 0.36, L * 0.04);
      ctx.quadraticCurveTo(tb - L * 0.36, L * 0.17 * spread, tb, L * 0.07);
    }
    ctx.closePath();
    ctx.fill();
    // Legs trailing (the stork).
    if (sp.legs) {
      ctx.strokeStyle = rgb(this.colour(sp.legs));
      ctx.lineWidth = Math.max(1, L * 0.025);
      ctx.beginPath();
      ctx.moveTo(tb, -L * 0.03); ctx.lineTo(tb - L * 0.55, -L * 0.04);
      ctx.moveTo(tb, L * 0.03); ctx.lineTo(tb - L * 0.55, L * 0.04);
      ctx.stroke();
    }

    // Body, from below: belly, breast, head (on a neck for the stork).
    const neck = sp.neck ? L * sp.neck : 0;
    const bg = ctx.createLinearGradient(-L * 0.3, 0, L * 0.3, 0);
    bg.addColorStop(0, rgb(this.colour(sp.belly)));
    bg.addColorStop(1, rgb(this.colour(sp.accent)));
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(-L * 0.02, 0, L * 0.3, L * 0.12, 0, 0, TAU);
    ctx.fill();
    if (neck) {
      ctx.strokeStyle = rgb(this.colour(sp.head));
      ctx.lineWidth = L * 0.07;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(L * 0.2, 0);
      ctx.lineTo(L * 0.2 + neck, Math.sin(this.phase * 0.5) * L * 0.01);
      ctx.stroke();
    }
    const hx = L * 0.3 + neck;
    ctx.fillStyle = rgb(this.colour(sp.head));
    ctx.beginPath();
    ctx.arc(hx, 0, L * 0.09, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgb(this.colour(sp.beak));
    ctx.beginPath();
    const bl = sp.neck ? L * 0.22 : L * 0.1;
    ctx.moveTo(hx + L * 0.06, -L * 0.03);
    ctx.lineTo(hx + L * 0.06 + bl, 0);
    ctx.lineTo(hx + L * 0.06, L * 0.03);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// ── The sky around them ───────────────────────────────────────────

// A puff: a soft white disc with a firm middle. Puffs are heaped into a
// cloud on a half-size canvas, and the whole cloud is then lit at once —
// warm underneath from the glow on the horizon, cool lavender on top —
// so it reads as one painted shape, not a stack of balls.
function puffSprite(size, edge) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const r = size / 2;
  const rg = x.createRadialGradient(r, r, 0, r, r, r);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(edge, 'rgba(255,255,255,0.96)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = rg;
  x.fillRect(0, 0, size, size);
  return c;
}
const RES = 0.5;   // clouds are soft: half resolution is plenty, and cheap

const LAYERS = [
  // far: small, pale, slow, behind everything
  { top: 'rgba(120,114,158,1)', bottom: 'rgba(186,140,146,1)', alpha: 0.55, scale: 0.6, speed: 0.04, parallax: 0.04, edge: 0.45 },
  // mid: the clouds birds fly through
  { top: 'rgba(150,140,190,1)', bottom: 'rgba(244,182,152,1)', alpha: 0.72, scale: 1, speed: 0.08, parallax: 0.1, edge: 0.55 },
  // near: thin wisps in front
  { top: 'rgba(196,184,220,1)', bottom: 'rgba(250,200,172,1)', alpha: 0.28, scale: 1.5, speed: 0.14, parallax: 0.2, edge: 0.3 },
];

export class SkyScape {
  constructor() {
    let s = 11;
    this.rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    this.sprites = LAYERS.map((l) => puffSprite(96, l.edge));
    this.layerC = LAYERS.map(() => document.createElement('canvas'));
    this.clouds = null;
    this.far = null;
    this.W = 0; this.H = 0;
  }

  layout(W, H) {
    if (this.clouds && W === this.W && H === this.H) return;
    this.W = W; this.H = H;
    for (const c of this.layerC) { c.width = Math.ceil(W * RES); c.height = Math.ceil(H * RES); }
    const r = this.rand;
    const unit = Math.max(30, Math.min(64, W / 22));
    const counts = [3, 3, 2];
    this.clouds = [];
    LAYERS.forEach((l, li) => {
      for (let i = 0; i < counts[li]; i++) {
        const w = unit * l.scale * (5 + r() * 4);
        const n = li === 2 ? 8 : 12 + Math.floor(r() * 6);
        const puffs = [];
        for (let k = 0; k < n; k++) {
          const u = (k + r() * 0.6) / n - 0.5;
          // Bigger in the middle, heaped on top, flat along the bottom.
          const body = 1 - Math.abs(u) * 1.7;
          const pr = unit * l.scale * (0.55 + body * (0.7 + r() * 0.8)) * (li === 2 ? 0.6 : 1);
          const oy = li === 2 ? (r() - 0.5) * pr * 0.25 : -pr * (0.15 + r() * 0.5) * body + pr * 0.3;
          puffs.push({ ox: u * w, oy: Math.min(oy, pr * 0.15), r: Math.max(8, pr), dx: 0, dy: 0, vx: 0, vy: 0 });
        }
        puffs.sort((a, b) => a.oy - b.oy);
        this.clouds.push({
          layer: li, x: r() * W * 1.3 - W * 0.15, y: H * (0.12 + r() * 0.85), w, puffs,
          v: l.speed * (0.7 + r() * 0.6),
        });
      }
    });
    // A distant murmuration: tiny birds turning together, far behind.
    const n = 16;
    const cx = W * (0.2 + r() * 0.6), cy = H * (0.15 + r() * 0.2);
    this.far = Array.from({ length: n }, () => ({
      x: cx + (r() - 0.5) * 80, y: cy + (r() - 0.5) * 40, vx: 0.4 + r() * 0.2, vy: (r() - 0.5) * 0.2, ph: r() * TAU,
    }));
    this.farGoal = { x: W * 0.8, y: H * 0.2 };
  }

  // Clouds drift; puffs near a bird are pushed aside and spring back.
  step(birds, scrollY = 0) {
    const { W, H } = this;
    if (!this.clouds) return;
    const span = H * 1.6;
    for (const cl of this.clouds) {
      cl.x += cl.v;
      if (cl.x - cl.w > W + 40) cl.x = -cl.w - 40;
      const l = LAYERS[cl.layer];
      cl.sy = ((((cl.y - scrollY * l.parallax) % span) + span) % span) - H * 0.25;
      for (const p of cl.puffs) {
        const px = cl.x + p.ox + p.dx, py = cl.sy + p.oy + p.dy;
        if (cl.layer === 1 || cl.layer === 2) {
          for (const b of birds) {
            const dx = px - b.x, dy = py - b.y;
            const reach = p.r + b.span * b.scale() * 0.5;
            const d2 = dx * dx + dy * dy;
            if (d2 < reach * reach) {
              const d = Math.sqrt(d2) || 1;
              const push = (1 - d / reach) * (0.5 + 0.25 * (b.speed || 1));
              p.vx += (dx / d) * push;
              p.vy += (dy / d) * push * 0.7;
            }
          }
        }
        // Spring home, damped: the cloud closes behind the bird.
        p.vx += -p.dx * 0.012; p.vy += -p.dy * 0.012;
        p.vx *= 0.9; p.vy *= 0.9;
        p.dx = clamp(p.dx + p.vx, -p.r * 1.2, p.r * 1.2);
        p.dy = clamp(p.dy + p.vy, -p.r * 1.2, p.r * 1.2);
      }
    }
    // The murmuration: boids, heading for a slowly moving goal.
    const g = this.farGoal;
    if (Math.hypot(this.far[0].x - g.x, this.far[0].y - g.y) < 120 || Math.random() < 0.002) {
      g.x = W * (0.1 + Math.random() * 0.8); g.y = H * (0.08 + Math.random() * 0.3);
    }
    for (const a of this.far) {
      let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0;
      for (const o of this.far) {
        if (o === a) continue;
        const dx = o.x - a.x, dy = o.y - a.y, d = Math.hypot(dx, dy);
        if (d < 10 && d > 0) { sx -= dx / d; sy -= dy / d; }
        ax += o.vx; ay += o.vy; cx += o.x; cy += o.y;
      }
      const n = this.far.length - 1;
      a.vx += sx * 0.05 + (ax / n - a.vx) * 0.05 + (cx / n - a.x) * 0.0008 + (g.x - a.x) * 0.00005;
      a.vy += sy * 0.05 + (ay / n - a.vy) * 0.05 + (cy / n - a.y) * 0.0008 + (g.y - a.y) * 0.00005;
      const s = Math.hypot(a.vx, a.vy) || 1;
      const k = clamp(s, 0.35, 0.8) / s;
      a.vx *= k; a.vy *= k;
      a.x += a.vx; a.y += a.vy;
      a.ph += 0.35;
    }
  }

  drawLayer(ctx, li) {
    if (!this.clouds) return;
    const l = LAYERS[li], spr = this.sprites[li];
    const lc = this.layerC[li], x = lc.getContext('2d');
    x.setTransform(RES, 0, 0, RES, 0, 0);
    x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, this.W, this.H);
    let any = false;
    for (const cl of this.clouds) {
      if (cl.layer !== li) continue;
      let top = Infinity, bot = -Infinity;
      for (const p of cl.puffs) {
        const px = cl.x + p.ox + p.dx, py = cl.sy + p.oy + p.dy;
        if (px + p.r < 0 || px - p.r > this.W || py + p.r < 0 || py - p.r > this.H) continue;
        x.drawImage(spr, px - p.r, py - p.r * 0.82, p.r * 2, p.r * 1.64);
        top = Math.min(top, py - p.r * 0.82); bot = Math.max(bot, py + p.r * 0.82);
        any = true;
      }
      if (top < bot) {
        // Light the whole cloud at once: cool on top, warm below.
        x.globalCompositeOperation = 'source-atop';
        const g = x.createLinearGradient(0, top, 0, bot);
        g.addColorStop(0, l.top);
        g.addColorStop(0.5, l.top);
        g.addColorStop(0.85, l.bottom);
        g.addColorStop(1, l.bottom);
        x.fillStyle = g;
        x.fillRect(cl.x - cl.w, top, cl.w * 2, bot - top);
        x.globalCompositeOperation = 'source-over';
      }
    }
    if (!any) return;
    ctx.save();
    ctx.globalAlpha = l.alpha;
    ctx.drawImage(lc, 0, 0, this.W, this.H);
    ctx.restore();
  }

  drawFar(ctx) {
    if (!this.far) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(28,30,58,0.55)';
    ctx.lineWidth = 1.1;
    ctx.lineCap = 'round';
    for (const a of this.far) {
      const ang = Math.atan2(a.vy, a.vx);
      const c = Math.cos(ang), s = Math.sin(ang);
      const w = 3.2 + Math.sin(a.ph) * 1.6;
      ctx.beginPath();
      ctx.moveTo(a.x - s * w - c * 1.5, a.y + c * w - s * 1.5);
      ctx.lineTo(a.x, a.y);
      ctx.lineTo(a.x + s * w - c * 1.5, a.y - c * w - s * 1.5);
      ctx.stroke();
    }
    ctx.restore();
  }
}
