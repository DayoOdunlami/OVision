import { seeded } from '../lib/vine.js';
import { SPECIES, makeThorn, drawThorn, drawSeedHead } from './weeds.js';

// ═══════════════════════════════════════════════════════════════════
// The field, before sowing — the parable of the sower, to clear by hand.
//
//   "Some fell on rocky ground … some fell among thorns, and the thorns
//    grew up and choked it." — Mark 4
//
// ROCKY GROUND. A pile of stones sits right where the seed must go,
// each engraved: Selfishness, Greed, Insecurity, Distraction… They're
// real bodies (Matter.js, the engine behind the verse puzzle): drag one,
// or fling it. Near the pile a gentle pull draws a stone back to the
// heap; take it past the line marked on the soil (or off the screen)
// and it rolls away for good.
//
// THORNS. Weeds with seed heads, each carrying a faint word — money,
// worry, fear, more… Pull one up slowly and it comes free with its
// roots; then carry it right off the edge of the screen. Care matters:
//   · yank it out, or shake it while carrying, and it drops seed
//   · let go of it on the field and it falls, drops seed, and re-roots
// Dropped seed sprouts into new little weeds a moment later. The head
// trembles first, as a warning, so carefulness can be learned.
//
// A tap does it all gently for you (and Skip clears the lot), so no one
// is ever stuck.
// ═══════════════════════════════════════════════════════════════════

export const STONE_WORDS = ['Selfishness', 'Greed', 'Insecurity', 'Distraction', 'Laziness', 'Pride', 'Busyness', 'Doubt'];
// River-stone colours: slate and charcoal take gold or cream lettering,
// sand, cream and grey take dark.
const STONE_LOOKS = [
  { base: [58, 60, 64], vein: [190, 186, 176], ink: '#d9b45a', dark: true },
  { base: [82, 70, 60], vein: [210, 196, 170], ink: '#efe2c4', dark: true },
  { base: [148, 86, 52], vein: [236, 200, 160], ink: '#f6e7cc', dark: true },
  { base: [196, 172, 132], vein: [120, 96, 66], ink: '#3b3127', dark: false },
  { base: [222, 212, 192], vein: [150, 138, 118], ink: '#3a342c', dark: false },
  { base: [132, 130, 122], vein: [220, 216, 206], ink: '#2c2b28', dark: false },
];

export const THORN_WORDS = ['money', 'worry', 'fear', 'more', 'hurry', 'approval', 'comparison', 'screens', 'envy', 'success'];

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const STEP = 1000 / 60;
// Speeds (px/s) at patience "balanced"; the setting scales them.
const FAST = 1500;        // a pull this quick shatters the head
const SHAKE = 1250;       // carrying this fast sheds seed
const WARN = 800;         // the head starts to tremble
const LOOSEN_S = 1.1;     // steady tension it takes for roots to let go
const MAX_SPROUTS = 5;    // new weeds a session can grow, at most

// How forgiving the field is. Faster thresholds, quicker roots and a
// firmer grip on the stones when forgiving; the reverse when exacting.
export const PATIENCE = {
  forgiving: { speed: 1.6, loosen: 0.55, grip: 1.5 },
  balanced: { speed: 1, loosen: 1, grip: 1 },
  exacting: { speed: 0.72, loosen: 1.45, grip: 0.75 },
};

export class Field {
  constructor({ Matter, W, H, soilY, edge, pileX, stones, weeds, seed, onNote, patience = 'balanced' }) {
    this.M = Matter;
    this.W = W; this.H = H; this.soilY = soilY; this.edge = edge;
    this.onNote = onNote || (() => {});
    const rand = this.rand = seeded(seed);
    const r = (a, b) => a + rand() * (b - a);
    this.S = Math.max(0.95, Math.min(1.6, W / 760));
    // On the seed's spot, but with the whole heap on screen.
    this.pileX = Math.max(Math.min(W * 0.3, 200 * this.S), Math.min(W - 200 * this.S, pileX));
    this.clearR = Math.max(150, Math.min(320, W * 0.24));
    this.t = 0;
    this.acc = 0;
    this.seeds = [];
    this.sprouted = 0;
    this.grab = null;
    this.dragStone = null;
    this.setPatience(patience);

    // ── Stones ──────────────────────────────────────────────────────
    const { Engine, Bodies, Body, Composite, Vertices } = Matter;
    this.engine = Engine.create({ enableSleeping: true });
    this.floor = Bodies.rectangle(W / 2, soilY + 2 + 50, W * 6, 100, { isStatic: true, friction: 0.5 });
    // Walls at the screen's edges: a stone flung hard bounces back rather
    // than leaving — the quick swipe doesn't work. Cleared stones pass
    // through them (they become sensors).
    const T = 200;
    Composite.add(this.engine.world, [
      this.floor,
      Bodies.rectangle(-T / 2, soilY - H, T, H * 4, { isStatic: true, friction: 0.2 }),
      Bodies.rectangle(W + T / 2, soilY - H, T, H * 4, { isStatic: true, friction: 0.2 }),
      Bodies.rectangle(W / 2, -T / 2 - 60, W * 4, T, { isStatic: true }),
    ]);
    const words = [...STONE_WORDS];
    for (let i = words.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [words[i], words[j]] = [words[j], words[i]]; }
    // The first five are the ones named in the brief; keep them in the
    // daily pile more often than not.
    const pick = words.slice(0, stones);
    // River stones, carved deep: bold condensed capitals, like the
    // Babson boulders and garden word-stones.
    this.fs = Math.max(W < 520 ? 10.5 : 13, Math.min(22, W / 52));
    this.font = `700 ${this.fs}px "Source Sans 3", "Arial Narrow", system-ui, sans-serif`;
    const meas = document.createElement('canvas').getContext('2d');
    meas.font = this.font;
    const made = pick.map((word) => {
      const tw = meas.measureText(word.toUpperCase()).width;
      const hw = tw / 2 + this.fs * 0.95;
      const hh = Math.max(this.fs * 1.45, hw * r(0.5, 0.64));
      return { word, tw, hw, hh, look: STONE_LOOKS[Math.floor(rand() * STONE_LOOKS.length)], seed: rand() };
    });
    // A heap: the biggest at the bottom, rows of 3, 2, 1.
    made.sort((a, b) => b.hw * b.hh - a.hw * a.hh);
    const rows = [];
    for (let i = 0, n = 3; i < made.length; n = Math.max(1, n - 1)) { rows.push(made.slice(i, i + n)); i += n; }
    let yBase = soilY;
    this.stones = [];
    rows.forEach((row, ri) => {
      const total = row.reduce((m, o) => m + o.hw * 2, 0) * 0.92;
      let x = this.pileX - total / 2;
      const tallest = Math.max(...row.map((o) => o.hh));
      row.forEach((o) => {
        const cx = x + o.hw * 0.92 + r(-4, 4);
        x += o.hw * 2 * 0.92;
        // A pebble: a rounded superellipse, a little uneven.
        const verts = Array.from({ length: 18 }, (_, k) => {
          const a = (k / 18) * Math.PI * 2;
          const c = Math.cos(a), sn = Math.sin(a);
          const e = 2.6;
          const px = Math.sign(c) * Math.abs(c) ** (2 / e), py = Math.sign(sn) * Math.abs(sn) ** (2 / e);
          return { x: px * o.hw * r(0.96, 1.03), y: py * o.hh * r(0.95, 1.03) };
        });
        const body = Bodies.fromVertices(cx, yBase - o.hh - 2 - ri * 6, [verts], {
          friction: 0.5, frictionStatic: 0.6, restitution: 0.05, density: 0.004, frictionAir: 0.03,
        });
        const local = body.vertices.map((v) => ({ x: v.x - body.position.x, y: v.y - body.position.y }));
        Body.setAngle(body, r(-0.14, 0.14));
        const st = { ...o, body, local, a: 1, cleared: false, gone: false };
        st.img = this.paintStone(st);
        this.stones.push(st);
      });
      yBase -= tallest * 1.55;
    });
    // Keep the whole heap on screen.
    {
      const x0 = Math.min(...this.stones.map((st) => st.body.position.x - st.hw));
      const x1 = Math.max(...this.stones.map((st) => st.body.position.x + st.hw));
      const shift = x0 < 10 ? 10 - x0 : x1 > W - 10 ? W - 10 - x1 : 0;
      if (shift) {
        for (const st of this.stones) Body.translate(st.body, { x: shift, y: 0 });
        this.pileX += shift;
      }
    }
    Composite.add(this.engine.world, this.stones.map((s) => s.body));
    // The line to drag a stone past: clear of the heap on either side.
    const half = Math.max(...this.stones.map((st) => Math.abs(st.body.position.x - this.pileX) + st.hw));
    this.heapHalf = half;
    this.clearR = half + Math.max(80, W * 0.08);
    // The lines themselves, kept on screen (a phone has little room).
    this.lineL = Math.max(this.pileX - this.clearR, -1e6);
    // Leave room past each line for the widest stone to rest beyond it.
    const room = Math.max(...this.stones.map((st) => st.hw)) + 14;
    const heapR = this.pileX + half, heapL = this.pileX - half;
    this.lineR = Math.min(this.pileX + this.clearR, Math.max(heapR + 26, W - room));
    this.lineL = Math.max(this.pileX - this.clearR, Math.min(heapL - 26, room));
    if (this.lineL < 30) this.lineL = -1e6;     // no room on that side
    if (this.lineR > W - 30) this.lineR = 1e6;
    // Let the pile settle before anyone sees it.
    for (let k = 0; k < 140; k++) this.physics();

    // ── Thorns ──────────────────────────────────────────────────────
    const tw = [...THORN_WORDS];
    for (let i = tw.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [tw[i], tw[j]] = [tw[j], tw[i]]; }
    this.thornWords = tw;
    this.weeds = [];
    // Spread across the field, keeping off the pile.
    const spots = [];
    const lo = 0.06 * W, hi = 0.94 * W;
    let p0 = Infinity, p1 = -Infinity;
    for (const st of this.stones) { p0 = Math.min(p0, st.body.bounds.min.x); p1 = Math.max(p1, st.body.bounds.max.x); }
    for (let tries = 0; spots.length < weeds && tries < 600; tries++) {
      const x = lo + rand() * (hi - lo);
      if (x > p0 - 34 * this.S && x < p1 + 34 * this.S) continue;   // not in the heap
      if (tries < 300 && Math.abs(x - this.pileX) < this.clearR * 0.55) continue;
      if (spots.some((o) => Math.abs(o - x) < 70 * this.S)) continue;
      spots.push(x);
    }
    spots.forEach((x, i) => this.addWeed(x, tw[i % tw.length], 1, 1));
    // On a narrow screen not every thorn fits beside the heap; the rest
    // were under the stones, and come up once they're moved.
    this.hidden = weeds - spots.length;
  }

  addWeed(x, word, size, grow, species) {
    const rand = this.rand;
    const r = (a, b) => a + rand() * (b - a);
    // One of each in turn, starting somewhere different each day.
    if (this.made === undefined) { this.made = 0; this.first = Math.floor(rand() * SPECIES.length); }
    // (Seed breeds true: a sprout is its parent's plant.)
    const type = species || SPECIES[(this.first + this.made++) % SPECIES.length];
    const s = this.S * r(0.9, 1.12) * size;
    const thorn = makeThorn(type, s, rand);
    const w = {
      kind: 'weed', type, thorn, x, y: this.edge(x), s, phase: r(0, 6),
      stalkH: thorn.stalkH,
      state: 'in', pull: 0, lean: 0, rot: 0, a: 1, free: false,
      word, seeds: 14, quiver: 0, grow: grow ? 1 : 0, vx: 0, vy: 0, t: 0, loose: 0,
    };
    this.weeds.push(w);
    return w;
  }

  // ── Rules ──────────────────────────────────────────────────────────
  remaining() {
    return this.hidden + this.stones.filter((s) => !s.cleared).length
      + this.weeds.filter((w) => w.state !== 'gone' && w.state !== 'away').length
      + this.seeds.filter((sd) => sd.willSprout).length;
  }

  setPatience(p) {
    this.patience = PATIENCE[p] ? p : 'balanced';
    this.P = PATIENCE[this.patience];
  }

  physics() {
    const { Engine, Body, Sleeping } = this.M;
    const g = this.grab;
    for (const st of this.stones) {
      if (st.cleared) continue;
      const b = st.body;
      if (st === this.dragStone && g) {
        // Carried by the hand, but still a body: it shoves and tumbles the
        // others. Moved by velocity toward the finger, so a quick hand
        // leaves it behind — and past a point, it slips.
        const tx = g.px - g.off.x, ty = Math.min(g.py - g.off.y, this.soilY - st.hh);
        const ex = tx - b.position.x, ey = ty - b.position.y;
        const cap = 16 * this.S;
        Body.setVelocity(b, { x: Math.max(-cap, Math.min(cap, ex * 0.28)), y: Math.max(-cap, Math.min(cap, ey * 0.28)) });
        Body.setAngularVelocity(b, b.angularVelocity * 0.8);
        if (Math.hypot(ex, ey) > 95 * this.S * this.P.grip) this.slip(st);
        continue;
      }
      const dx = b.position.x - this.pileX;
      // Past a line — or, where there's no room past it, set down against
      // the edge of the field away from the heap.
      const wall = Math.abs(dx) > this.heapHalf * 0.9 &&
        ((b.position.x + st.hw >= this.W - 8 && dx > 0) || (b.position.x - st.hw <= 8 && dx < 0 && this.lineL < -1e5));
      const out = b.position.x > this.lineR || b.position.x < this.lineL || wall;
      if (!out) {
        // The heap's pull: slight, but enough that a stone half moved, or
        // knocked loose, creeps back to the others.
        if (Math.abs(dx) > this.heapHalf * 0.55) {
          if (b.isSleeping) Sleeping.set(b, false);
          const want = -Math.sign(dx) * Math.min(1.3, (Math.abs(dx) - this.heapHalf * 0.5) * 0.01) * this.S;
          Body.setVelocity(b, { x: b.velocity.x * 0.94 + want * 0.06, y: b.velocity.y });
        }
        st.rest = 0;
      } else {
        // Past the line: set aside once it has come to rest there.
        const still = Math.hypot(b.velocity.x, b.velocity.y) < 0.35 && Math.abs(b.angularVelocity) < 0.02;
        st.rest = still ? (st.rest || 0) + STEP : 0;
        if (st.rest > 450) this.clearStone(st, Math.sign(dx));
      }
    }
    Engine.update(this.engine, STEP);
  }

  slip(st) {
    const { Body } = this.M;
    const b = st.body;
    Body.setVelocity(b, { x: b.velocity.x * 0.35, y: b.velocity.y * 0.35 });
    this.dragStone = null;
    this.grab = null;
    navigator.vibrate?.(10);
    this.onNote('It slipped. One stone at a time, steadily.');
  }

  clearStone(st, dir) {
    if (st.cleared) return;
    const { Body, Sleeping } = this.M;
    st.cleared = true;
    st.dir = dir || (st.body.position.x < this.pileX ? -1 : 1);
    st.body.isSensor = true;   // through the wall and away
    Sleeping.set(st.body, false);
    Body.setVelocity(st.body, { x: st.dir * 3.5 * this.S, y: -1.5 });
    Body.setAngularVelocity(st.body, st.dir * 0.08);
    this.wake();
  }

  wake() {
    const { Sleeping } = this.M;
    for (const st of this.stones) if (!st.cleared && st !== this.dragStone) Sleeping.set(st.body, false);
  }

  step(dt) {
    this.t += dt;
    this.acc += Math.min(100, dt * 1000);
    let n = 0;
    while (this.acc >= STEP && n < 4) { this.physics(); this.acc -= STEP; n++; }
    // Cleared stones roll on and fade.
    for (const st of this.stones) {
      if (!st.cleared || st.gone) continue;
      const { Body } = this.M;
      if (Math.abs(st.body.velocity.x) < 3 * this.S) Body.setVelocity(st.body, { x: st.dir * 3 * this.S, y: st.body.velocity.y });
      const x = st.body.position.x;
      if (x < -st.hw * 2 || x > this.W + st.hw * 2) st.gone = true;
      st.a = Math.max(0, st.a - dt * 0.35);
      if (st.a <= 0) st.gone = true;
      if (st.gone) this.M.Composite.remove(this.engine.world, st.body);
    }

    if (this.hidden > 0 && this.stones.every((st) => st.cleared)) {
      const taken = this.weeds.map((w) => w.x);
      for (let tries = 0; this.hidden > 0 && tries < 200; tries++) {
        const x = this.W * (0.08 + 0.84 * this.rand());
        if (taken.some((o) => Math.abs(o - x) < 50 * this.S)) continue;
        taken.push(x);
        this.addWeed(x, this.thornWords[(this.weeds.length + this.hidden) % this.thornWords.length], 1, 0);
        this.hidden--;
      }
      this.hidden = 0;
    }

    const k = dt * 60;
    // Holding a weed: steady tension loosens its roots; a hand moving too
    // fast doesn't (it just shakes the plant).
    const gw = this.grab?.w;
    if (gw && gw.state === 'in') {
      const g = this.grab;
      g.speed *= 1 - Math.min(1, dt * 6);   // a still finger is a calm one
      if ((g.lift || 0) > 0.12 && g.speed < WARN * this.P.speed) {
        gw.loose = Math.min(1, gw.loose + dt / (LOOSEN_S * this.P.loosen));
      }
      this.rootPull(gw, g, false);
    }
    for (const w of this.weeds) {
      w.quiver *= 1 - Math.min(1, dt * 4);
      if (w.state === 'in' && w !== gw) w.loose = Math.max(0, w.loose - dt * 0.25);   // roots resettle
      if (w.grow < 1) w.grow = Math.min(1, w.grow + dt / 1.4);
      if (w.state === 'in' && w.pull > 0 && this.grab?.w !== w) {
        w.pull = Math.max(0, w.pull - dt * 5);
        w.lean *= 1 - Math.min(1, dt * 8);
      }
      if (w.state === 'auto') this.autoStep(w, dt);
      if (w.state === 'fallen') {
        w.t += dt;
        w.vy += 0.4 * k * w.s;
        w.x += w.vx * k; w.y += w.vy * k;
        if (!w.landed) w.rot += (Math.sign(w.vx || 1) * 1.2 - w.rot) * Math.min(1, dt * 3);
        const floor = this.edge(w.x);
        if (w.y >= floor) {
          w.y = floor; w.vy = 0; w.vx *= 0.6;
          if (!w.landed) {
            w.landed = this.t;
            this.shed(w, 2, w.x, w.y - w.stalkH * 0.4);
          }
          // It takes root again where it lies.
          if (this.t - w.landed > 0.7) {
            w.rot *= 0.85;
            if (Math.abs(w.rot) < 0.05) { w.rot = 0; w.state = 'in'; w.free = false; w.pull = 0; w.landed = 0; }
          }
        }
      }
      if (w.state === 'away') {
        w.t += dt;
        w.x += w.vx * k;
        w.a = Math.max(0, w.a - dt * 2.5);
        if (w.a <= 0) w.state = 'gone';
      }
    }

    for (const sd of this.seeds) {
      sd.t += dt;
      if (!sd.landed) {
        // Down and parachutes drift; grain and berries drop.
        sd.vy = sd.heavy ? Math.min(sd.vy + 0.25 * k, 6) : Math.min(sd.vy + 0.05 * k, 1.4);
        sd.x += (sd.vx * (sd.heavy ? 0.5 : 1) + (sd.heavy ? 0 : Math.sin(sd.t * 4 + sd.ph) * 0.6)) * k;
        sd.y += sd.vy * k;
        sd.vx *= 0.98;
        const floor = this.edge(sd.x);
        if (sd.y >= floor) { sd.y = floor; sd.landed = this.t; }
      } else if (sd.willSprout && this.t - sd.landed > 0.9) {
        sd.willSprout = false;
        sd.done = true;
        if (sd.x > 10 && sd.x < this.W - 10) {
          this.addWeed(sd.x, sd.word, 0.72, 0, sd.kind);
        }
      } else if (!sd.willSprout && this.t - sd.landed > 0.6) sd.done = true;
    }
    this.seeds = this.seeds.filter((sd) => !sd.done);
    this.weeds = this.weeds.filter((w) => w.state !== 'gone');
  }

  // Seed leaves the head and drifts down; some will grow.
  shed(w, n, x, y) {
    const lost = Math.min(n, w.seeds);
    w.seeds -= lost;
    for (let i = 0; i < lost; i++) {
      const grows = this.sprouted < MAX_SPROUTS;
      if (grows) this.sprouted++;
      this.seeds.push({
        x, y, vx: (Math.random() < 0.5 ? -1 : 1) * (1 + Math.random() * 2.5) * w.s, vy: -Math.random() * 1.2,
        t: 0, ph: Math.random() * 6, word: w.word, willSprout: grows, landed: 0,
        kind: w.type, heavy: w.type === 'foxtail' || w.type === 'bramble',
      });
    }
    if (lost) navigator.vibrate?.(12);
  }

  // The careful way, done for you: lift slowly, carry off the nearer edge.
  autoStep(w, dt) {
    w.t += dt;
    if (w.pull < 1) { w.pull = Math.min(1, w.pull + dt / 0.6); return; }
    w.free = true;
    const dir = w.x < this.W / 2 ? -1 : 1;
    w.y += (this.edge(w.x) - w.stalkH * 0.7 - w.y) * Math.min(1, dt * 3);
    w.x += dir * 380 * dt * this.S;
    w.lean = -dir * 0.3;
    if (w.x < -60 || w.x > this.W + 60) w.state = 'gone';
  }

  headOf(w) {
    const g = w.grow;
    const stretch = 1 + Math.max(0, w.pull) * 0.28;
    const h = w.stalkH * g * stretch;
    const a = w.rot + w.lean * 0.4 + (w.free ? 0 : Math.sin(this.t * 1.3 + w.phase) * 0.05);
    const base = { x: w.x, y: w.y - (w.free ? 0 : Math.max(0, w.pull) * 6 * w.s) };
    return { x: base.x + Math.sin(a) * h, y: base.y - Math.cos(a) * h, base, a, h };
  }

  // ── Input ──────────────────────────────────────────────────────────
  hitStone(x, y) {
    let best = null, bd = Infinity;
    for (const st of this.stones) {
      if (st.cleared) continue;
      const b = st.body;
      const c = Math.cos(-b.angle), s = Math.sin(-b.angle);
      const dx = x - b.position.x, dy = y - b.position.y;
      const lx = dx * c - dy * s, ly = dx * s + dy * c;
      const d = Math.hypot(lx / (st.hw + 10), ly / (st.hh + 10));
      if (d < 1 && d < bd) { bd = d; best = st; }
    }
    return best;
  }

  hitWeed(x, y) {
    let best = null, bd = Infinity;
    for (const w of this.weeds) {
      if (w.state !== 'in' || w.grow < 0.6) continue;
      const hd = this.headOf(w);
      const top = Math.min(hd.y, w.y - 30 * w.s) - 16;
      if (x < w.x - 32 * w.s || x > w.x + 32 * w.s || y < top || y > w.y + 18) continue;
      const d = Math.abs(x - w.x);
      if (d < bd) { bd = d; best = w; }
    }
    return best;
  }

  hover(x, y) {
    return Boolean(this.hitStone(x, y) || this.hitWeed(x, y));
  }

  down(x, y, id, touch = false) {
    this.touch = touch;
    if (this.grab) return false;
    const st = this.hitStone(x, y);
    if (st) {
      const b = st.body;
      this.dragStone = st;
      this.wake();
      this.grab = { st, id, off: { x: x - b.position.x, y: y - b.position.y }, px: x, py: y, x0: x, y0: y, t0: performance.now(), last: { x, y, t: performance.now() }, moved: 0 };
      return true;
    }
    const w = this.hitWeed(x, y);
    if (w) {
      this.grab = { w, id, x0: x, y0: y, t0: performance.now(), last: { x, y, t: performance.now() }, speed: 0, moved: 0, shedAt: 0 };
      return true;
    }
    return false;
  }

  move(x, y, id) {
    const g = this.grab;
    if (!g || g.id !== id) return;
    const now = performance.now();
    const dt = Math.max(1, now - g.last.t);
    const vx = ((x - g.last.x) / dt) * 1000, vy = ((y - g.last.y) / dt) * 1000;
    g.moved = Math.max(g.moved, Math.hypot(x - g.x0, y - g.y0));
    g.last = { x, y, t: now };

    if (g.st) {
      g.px = x; g.py = y;   // physics() moves the stone toward this
      return;
    }

    const w = g.w;
    g.speed = g.speed * 0.6 + Math.hypot(vx, vy) * 0.4;
    g.px = x; g.py = y;
    if (w.state === 'in') {
      // How far the hand has lifted — but the roots only give as they
      // loosen, which takes steady tension over time (see step()).
      g.lift = clamp01((g.y0 - y) / (70 * Math.min(1.2, w.s)));
      w.lean = Math.max(-1, Math.min(1, (x - g.x0) / 90));
      w.quiver = Math.max(w.quiver, clamp01((g.speed - WARN * this.P.speed) / ((FAST - WARN) * this.P.speed)));
      this.rootPull(w, g, g.speed > FAST * this.P.speed && g.lift > 0.5);
      return;
    }
    if (w.state === 'carried') {
      // Carried by the hand, swinging with the motion.
      w.x = x + g.hold.dx;
      w.y = y + g.hold.dy;
      w.lean += (Math.max(-1, Math.min(1, -vx / 1400)) - w.lean) * 0.3;
      w.quiver = Math.max(w.quiver, clamp01((g.speed - WARN * this.P.speed) / ((SHAKE - WARN) * this.P.speed)));
      if (g.speed > SHAKE * this.P.speed && now - g.shedAt > 380 && w.seeds > 0) {
        g.shedAt = now;
        const hd = this.headOf(w);
        this.shed(w, 1, hd.x, hd.y);
        if (!this.warned) { this.warned = true; this.onNote('Shaking it drops seed. Carry it steadily.'); }
      }
      if (x < -10 || x > this.W + 10 || y < 0) this.carryOff(w, x < this.W / 2 ? -1 : 1);
    }
  }

  // Where a rooted weed is, given the hand and how loose its roots are.
  // It comes free when both agree — or at once, ruined, if yanked.
  rootPull(w, g, yanked) {
    w.pull = yanked ? 1 : Math.min(g.lift || 0, 0.3 + 0.7 * w.loose);
    if (w.pull < 1) return;
    w.free = true;
    w.state = 'carried';
    w.pull = 1;
    const hd = this.headOf(w);
    if (yanked) {
      // Yanked: the head bursts and seed scatters.
      this.shed(w, 3, hd.x, hd.y);
      this.onNote('Too quick: it scattered seed. Gently does it.');
    } else {
      navigator.vibrate?.(6);
      if (!this.praised) { this.praised = true; this.onNote('Out, roots and all. Now carry it off the field.'); }
    }
    g.hold = { dx: w.x - g.px, dy: w.y - g.py };
  }

  carryOff(w, dir) {
    w.state = 'away';
    w.vx = dir * 6 * this.S;
    w.t = 0;
    this.grab = null;
  }

  up(x, y, id) {
    const g = this.grab;
    if (!g || g.id !== id) return;
    this.grab = null;
    const tap = g.moved < 10 && performance.now() - g.t0 < 450;

    if (g.st) {
      const st = g.st;
      this.dragStone = null;
      // A tap sets it aside for you (the accessible way).
      if (tap) this.clearStone(st, st.body.position.x < this.pileX ? -1 : 1);
      // Otherwise it keeps whatever momentum the hand gave it, and the
      // physics decides: past the line and at rest, it's cleared.
      this.wake();
      return;
    }

    const w = g.w;
    if (w.state === 'in') {
      if (tap) { w.state = 'auto'; w.t = 0; }
      return;   // otherwise it springs back
    }
    if (w.state === 'carried') {
      if (x < 40 || x > this.W - 40) { this.carryOff(w, x < this.W / 2 ? -1 : 1); return; }
      // Let go on the field: it falls, seeds, and roots again.
      w.state = 'fallen';
      w.vx = 0; w.vy = 0; w.landed = 0; w.t = 0;
      this.onNote('Dropped on the field: it will root again. Carry it right off the edge.');
    }
  }

  clearAll() {
    let k = 0;
    for (const st of this.stones) if (!st.cleared) setTimeout(() => this.clearStone(st, 0), 120 * k++);
    for (const w of this.weeds) if (w.state === 'in') { w.state = 'auto'; w.t = 0; w.pull = -0.4 * k++; }
    for (const sd of this.seeds) sd.willSprout = false;
    this.hidden = 0;
  }

  // ── Drawing ────────────────────────────────────────────────────────
  draw(ctx, night, reduced) {
    const ink = night > 0.5 ? [239, 232, 216] : [70, 62, 52];
    // While a stone is held: the line it must cross, on the soil.
    if (this.dragStone) {
      for (const dir of [-1, 1]) {
        const x = dir < 0 ? this.lineL : this.lineR;
        if (x < 0 || x > this.W) continue;
        const y = this.edge(x);   // (an off-screen line isn't drawn)
        ctx.save();
        ctx.strokeStyle = night > 0.5 ? 'rgba(239,232,216,0.55)' : 'rgba(90,70,50,0.5)';
        ctx.setLineDash([3, 5]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y + 14);
        ctx.lineTo(x, y - 46);
        ctx.stroke();
        ctx.restore();
      }
    }

    for (const st of this.stones) {
      if (st.gone) continue;
      this.drawStone(ctx, st, night);
    }

    this.labels = [];
    for (const w of this.weeds) {
      if (w.state === 'gone') continue;
      const g = w.grow;
      ctx.save();
      ctx.globalAlpha = w.a;
      if (g < 1) {
        ctx.translate(w.x, w.y);
        ctx.scale(g, g);
        ctx.translate(-w.x, -w.y);
      }
      const t = reduced ? 0 : this.t;
      ctx.save();
      ctx.translate(w.x, w.y - (w.free ? 0 : Math.max(0, w.pull) * 6 * w.s));
      ctx.rotate(w.rot + w.lean * 0.4);
      const hd = drawThorn(ctx, w, t, night);
      drawSeedHead(ctx, w, hd.x, hd.y, night, this.t);
      ctx.restore();
      this.drawLabel(ctx, w, night, ink);
      ctx.restore();
    }

    // The hand on a weed: a small ring at the finger. While it's rooted
    // the ring fills as the roots loosen; its colour is the hand's speed —
    // calm green, then amber, then red as it nears tearing or shedding.
    const g = this.grab;
    if (g?.w && g.px !== undefined && (g.w.state === 'in' || g.w.state === 'carried')) {
      const w = g.w;
      const limit = (w.state === 'in' ? FAST : SHAKE) * this.P.speed;
      const r = clamp01((g.speed - WARN * this.P.speed * 0.5) / (limit - WARN * this.P.speed * 0.5));
      const col = r < 0.5
        ? [156 + (230 - 156) * r * 2, 185 + (176 - 185) * r * 2, 58 + (70 - 58) * r * 2]
        : [230 + (214 - 230) * (r - 0.5) * 2, 176 + (84 - 176) * (r - 0.5) * 2, 70 + (64 - 70) * (r - 0.5) * 2];
      const R = 24;
      // Under a fingertip it would be hidden: lift it just above.
      const cy = this.touch ? g.py - 64 : g.py;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = night > 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(47,58,44,0.14)';
      ctx.beginPath(); ctx.arc(g.px, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `rgb(${col.map((v) => v | 0)})`;
      const fill = w.state === 'in' ? Math.max(0.04, w.loose) : 1;
      ctx.globalAlpha = w.state === 'in' ? 1 : 0.35 + 0.65 * r;
      ctx.beginPath(); ctx.arc(g.px, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fill); ctx.stroke();
      ctx.restore();
    }

    // Seed in the air, and seed on the soil about to sprout.
    for (const sd of this.seeds) {
      ctx.save();
      ctx.translate(sd.x, sd.y);
      if (sd.kind === 'bramble') {
        ctx.fillStyle = '#4a1630';
        ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath(); ctx.arc(-0.8, -0.8, 0.8, 0, Math.PI * 2); ctx.fill();
      } else if (sd.kind === 'foxtail') {
        ctx.fillStyle = '#b8ae68';
        ctx.beginPath(); ctx.ellipse(0, 0, 1.8, 1.2, sd.ph, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = night > 0.5 ? 'rgba(240,236,224,0.85)' : 'rgba(250,248,240,0.95)';
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -5); ctx.stroke();
        for (let k = 0; k < 5; k++) {
          const a = -Math.PI / 2 + (k - 2) * 0.35;
          ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(Math.cos(a) * 4, -5 + Math.sin(a) * 4); ctx.stroke();
        }
        ctx.fillStyle = sd.kind === 'thistle' ? '#7a5a3a' : '#6b5a3a';
        ctx.beginPath(); ctx.arc(0, 0, 1.3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  drawLabel(ctx, w, night, ink) {
    const hd = this.headOf(w);
    const g = w.grow;
    if (g < 0.35) return;
    const q = w.quiver;
    const jx = q ? Math.sin(this.t * 60) * q * 2.4 : 0;
    const R = 12 * w.s;
    // Its word, faint until you take hold of it — and left off a young
    // sprout whose word would sit on top of another's.
    const held = w.state === 'carried' || this.grab?.w === w || w.state === 'auto';
    const lx = hd.x + jx, ly = hd.y - R - 6;
    if (!held && this.labels.some((l) => Math.abs(l[0] - lx) < 70 && Math.abs(l[1] - ly) < 22)) return;
    this.labels.push([lx, ly]);
    ctx.save();
    ctx.globalAlpha *= (held ? 0.95 : 0.62) * clamp01((g - 0.5) * 2);
    ctx.fillStyle = `rgb(${ink[0]},${ink[1]},${ink[2]})`;
    ctx.font = `italic 500 ${Math.round(13 * Math.min(1.25, w.s))}px "Cormorant Garamond", Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText(w.word, lx, ly);
    ctx.restore();
  }

  // Each stone is painted once, here, and laid down every frame.
  paintStone(st) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pad = 6;
    const w = st.hw * 2 + pad * 2, h = st.hh * 2 + pad * 2;
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    const x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, w / 2 * dpr, h / 2 * dpr);
    const rand = seeded(st.word + st.seed);
    const L = st.look;
    const path = new Path2D();
    const v = st.local, n = v.length;
    path.moveTo((v[0].x + v[n - 1].x) / 2, (v[0].y + v[n - 1].y) / 2);
    for (let i = 0; i < n; i++) {
      const a = v[i], b = v[(i + 1) % n];
      path.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
    }
    path.closePath();
    st.path = path;
    const col = (rgb, d = 0, a = 1) => `rgba(${rgb.map((q) => Math.max(0, Math.min(255, q + d)) | 0)},${a})`;
    // Body: lit from the upper left.
    const g = x.createRadialGradient(-st.hw * 0.35, -st.hh * 0.45, st.hh * 0.1, 0, 0, st.hw * 1.15);
    g.addColorStop(0, col(L.base, 38));
    g.addColorStop(0.55, col(L.base, 0));
    g.addColorStop(1, col(L.base, -42));
    x.fillStyle = g;
    x.fill(path);
    x.save();
    x.clip(path);
    // Veins and grain.
    x.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      x.strokeStyle = col(L.vein, 0, 0.18 + rand() * 0.2);
      x.lineWidth = 0.6 + rand() * 1.4;
      const y0 = (rand() - 0.5) * st.hh * 2;
      x.beginPath();
      x.moveTo(-st.hw * 1.1, y0);
      x.bezierCurveTo(-st.hw * 0.3, y0 + (rand() - 0.5) * st.hh * 1.4, st.hw * 0.3, y0 + (rand() - 0.5) * st.hh * 1.4, st.hw * 1.1, y0 + (rand() - 0.5) * st.hh);
      x.stroke();
    }
    for (let k = 0; k < (st.hw * st.hh) / 30; k++) {
      x.fillStyle = rand() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
      x.beginPath();
      x.arc((rand() - 0.5) * st.hw * 2, (rand() - 0.5) * st.hh * 2, 0.4 + rand() * 0.9, 0, Math.PI * 2);
      x.fill();
    }
    // Shade underneath, and a wet-looking sheen on top.
    const sh = x.createLinearGradient(0, -st.hh, 0, st.hh);
    sh.addColorStop(0.55, 'rgba(0,0,0,0)');
    sh.addColorStop(1, 'rgba(0,0,0,0.32)');
    x.fillStyle = sh;
    x.fillRect(-st.hw, -st.hh, st.hw * 2, st.hh * 2);
    x.fillStyle = 'rgba(255,255,255,0.13)';
    x.beginPath();
    x.ellipse(-st.hw * 0.3, -st.hh * 0.55, st.hw * 0.45, st.hh * 0.18, -0.15, 0, Math.PI * 2);
    x.fill();
    x.restore();
    // The carving: a shadowed cut, then the letters' fill.
    x.font = this.font;
    if ('letterSpacing' in x) x.letterSpacing = '0.04em';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    const t = st.word.toUpperCase();
    x.fillStyle = L.dark ? 'rgba(0,0,0,0.55)' : 'rgba(255,248,232,0.55)';
    x.fillText(t, L.dark ? -0.8 : 0.9, L.dark ? -0.8 : 1.3);
    x.fillStyle = L.ink;
    x.fillText(t, 0, 0.5);
    return { c, w, h };
  }

  drawStone(ctx, st, night) {
    const b = st.body;
    ctx.save();
    ctx.globalAlpha = st.a;
    // A soft shadow on the soil.
    const floor = this.edge(b.position.x);
    const lift = Math.max(0, floor - (b.position.y + st.hh));
    ctx.fillStyle = `rgba(40,28,18,${0.28 * Math.max(0.2, 1 - lift / 120)})`;
    ctx.beginPath();
    ctx.ellipse(b.position.x + 4, floor + 2, st.hw * 0.85, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(b.position.x, b.position.y);
    ctx.rotate(b.angle);
    ctx.drawImage(st.img.c, -st.img.w / 2, -st.img.h / 2, st.img.w, st.img.h);
    if (night > 0.02) {
      ctx.fillStyle = `rgba(20,24,42,${0.4 * night})`;
      ctx.fill(st.path);
    }
    ctx.restore();
  }
}
