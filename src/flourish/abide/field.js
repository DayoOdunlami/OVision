import { seeded } from '../lib/vine.js';
import { SPECIES, makeThorn, drawThorn, drawSeedHead } from './weeds.js';

// ═══════════════════════════════════════════════════════════════════
// The field, before sowing — the parable of the sower, cleared by hand.
//
//   "Some fell on rocky ground … some fell among thorns, and the thorns
//    grew up and choked it." — Mark 4
//   "He dug it up and cleared it of stones and planted it with the
//    choicest vines." — Isaiah 5:2
//
// ROCKY GROUND. A heap sits on the seed's spot: engraved stones
// (Selfishness, Greed, Distraction…) and unnamed rubble — not everything
// has a name. They're real bodies (Matter.js, the verse puzzle's
// engine): held, a stone shoves and tumbles the others. The heap pulls
// loose pieces back to itself — rubble most of all. Named stones are
// heavy: they lag behind the finger and slip from a hurried hand. Each
// one goes to THE WALL at the far edge of the field, where it's set into
// a drystone wall that the family builds over the days (rubble fills
// its heart, as in a real drystone wall).
//
// THORNS. Weeds with seed heads, each carrying a faint word — money,
// worry, fear… Hold steady tension and the roots loosen; lift it out;
// carry it to THE COMPOST BASKET in the corner. Care matters:
//   · yank it out, or shake it while carrying, and it drops seed
//   · let go of it on the field and it falls, drops seed, and re-roots
// Dropped seed sprouts into new little weeds. But care is rewarded,
// and more visibly: a weed taken whole to the compost leaves rich dark
// soil where it grew, and a field cleared without dropping a seed is
// "good soil" — today's vine grows fuller for it (Mark 4:20).
//
// A tap only shows how; Skip (in the page) clears the lot for anyone
// who needs it.
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
const WEED_SIZE = 1.35;   // thorns, a little larger than life

// How forgiving the field is. Faster thresholds, quicker roots and a
// firmer grip on the stones when forgiving; the reverse when exacting.
export const PATIENCE = {
  forgiving: { speed: 1.6, loosen: 0.55, grip: 1.5 },
  balanced: { speed: 1, loosen: 1, grip: 1 },
  exacting: { speed: 0.72, loosen: 1.45, grip: 0.75 },
};

// How a carried piece follows the hand: named stones are heavy.
const HEFT = {
  stone: { follow: 0.12, cap: 9, slip: 85 },
  rubble: { follow: 0.4, cap: 18, slip: 150 },
};

export class Field {
  constructor({ Matter, W, H, soilY, edge, pileX, stones, weeds, seed, onNote, onEvent, patience = 'balanced', wallBase = 0, compostBase = 0 }) {
    this.M = Matter;
    this.W = W; this.H = H; this.soilY = soilY; this.edge = edge;
    this.onNote = onNote || (() => {});
    this.onEvent = onEvent || (() => {});
    const rand = this.rand = seeded(seed);
    const r = (a, b) => a + rand() * (b - a);
    this.S = Math.max(0.95, Math.min(1.6, W / 760));
    this.t = 0;
    this.acc = 0;
    this.seeds = [];
    this.sprouted = 0;
    this.dropped = 0;
    this.composted = 0;
    this.careful = 0;
    this.rich = [];
    this.grab = null;
    this.dragStone = null;
    this.wallBase = wallBase;
    this.walledToday = 0;
    this.compostBase = compostBase;
    this.said = {};
    this.setPatience(patience);

    // ── Where things go ─────────────────────────────────────────────
    // The heap on the seed's spot; the wall at the far edge from it;
    // the compost basket in the foreground corner on the heap's side.
    const soilH = H - soilY;
    this.pileX = Math.max(Math.min(W * 0.3, 200 * this.S), Math.min(W - 200 * this.S, pileX));
    this.wallSide = this.pileX < W / 2 ? 1 : -1;
    this.wallW = Math.max(74, Math.min(190, W * 0.15));
    this.wallX0 = this.wallSide > 0 ? W - this.wallW : 0;
    this.wallX1 = this.wallX0 + this.wallW;
    const bw = Math.max(86, Math.min(150, W * 0.17));
    const bh = bw * 0.5;
    this.basket = {
      x: this.wallSide > 0 ? 12 : W - 12 - bw,
      y: Math.min(H - bh - 10, soilY + Math.max(16, soilH * 0.32)),
      w: bw, h: bh, hot: 0, puff: 0,
    };

    // ── Stones and rubble ───────────────────────────────────────────
    const { Engine, Bodies, Body, Composite } = Matter;
    this.engine = Engine.create({ enableSleeping: true });
    this.floor = Bodies.rectangle(W / 2, soilY + 2 + 50, W * 6, 100, { isStatic: true, friction: 0.5 });
    // Walls at the screen's edges: a stone flung hard bounces back rather
    // than leaving — the quick swipe doesn't work.
    const T = 200;
    Composite.add(this.engine.world, [
      this.floor,
      Bodies.rectangle(-T / 2, soilY - H, T, H * 4, { isStatic: true, friction: 0.2 }),
      Bodies.rectangle(W + T / 2, soilY - H, T, H * 4, { isStatic: true, friction: 0.2 }),
      Bodies.rectangle(W / 2, -T / 2 - 60, W * 4, T, { isStatic: true }),
    ]);
    const words = [...STONE_WORDS];
    for (let i = words.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [words[i], words[j]] = [words[j], words[i]]; }
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
    const pebble = (o, cx, cy, opts) => {
      const verts = Array.from({ length: 18 }, (_, k) => {
        const a = (k / 18) * Math.PI * 2;
        const c = Math.cos(a), sn = Math.sin(a);
        const e = 2.6;
        const px = Math.sign(c) * Math.abs(c) ** (2 / e), py = Math.sign(sn) * Math.abs(sn) ** (2 / e);
        return { x: px * o.hw * r(0.92, 1.05), y: py * o.hh * r(0.9, 1.05) };
      });
      const body = Bodies.fromVertices(cx, cy, [verts], opts);
      const local = body.vertices.map((v) => ({ x: v.x - body.position.x, y: v.y - body.position.y }));
      Body.setAngle(body, r(-0.2, 0.2));
      return { body, local };
    };
    // A heap: the biggest at the bottom, rows of 3, 2, 1 — or, where the
    // field is narrow (a phone), a taller mound of 2, 2, 1, 1, with the
    // lettering made smaller if even that won't fit beside the wall.
    made.sort((a, b) => b.hw * b.hh - a.hw * a.hh);
    // (with room to spare: a heap spreads a little as it settles)
    const avail = (W - this.wallW - 24) * 0.8;
    const rowsOf = (pattern) => {
      const out = [];
      for (let i = 0, k = 0; i < made.length; k++) { const n = pattern[Math.min(k, pattern.length - 1)]; out.push(made.slice(i, i + n)); i += n; }
      return out;
    };
    const widest = (rs) => Math.max(...rs.map((row) => row.reduce((m, o) => m + o.hw * 2, 0) * 0.92));
    let rows = rowsOf([3, 2, 1]);
    if (widest(rows) > avail) rows = rowsOf([2, 2, 1, 1]);
    if (widest(rows) > avail) {
      const k = avail / widest(rows);
      for (const o of made) { o.hw *= k; o.hh = Math.max(o.hh * Math.sqrt(k), 14); }
      this.fs *= k;
      this.font = `700 ${this.fs}px "Source Sans 3", "Arial Narrow", system-ui, sans-serif`;
    }
    let yBase = soilY;
    this.stones = [];
    rows.forEach((row, ri) => {
      const total = row.reduce((m, o) => m + o.hw * 2, 0) * 0.92;
      let x = this.pileX - total / 2;
      const tallest = Math.max(...row.map((o) => o.hh));
      row.forEach((o) => {
        const cx = x + o.hw * 0.92 + r(-4, 4);
        x += o.hw * 2 * 0.92;
        const { body, local } = pebble(o, cx, yBase - o.hh - 2 - ri * 6,
          { friction: 0.55, frictionStatic: 0.7, restitution: 0.05, density: 0.006, frictionAir: 0.03 });
        const st = { ...o, kind: 'stone', body, local, a: 1, cleared: false, gone: false };
        st.img = this.paintStone(st);
        this.stones.push(st);
      });
      yBase -= tallest * 1.55;
    });
    // Keep the whole heap on screen, and off the wall.
    {
      const x0 = Math.min(...this.stones.map((st) => st.body.position.x - st.hw));
      const x1 = Math.max(...this.stones.map((st) => st.body.position.x + st.hw));
      const lo = this.wallSide < 0 ? this.wallX1 + 10 : 10;
      const hi = this.wallSide > 0 ? this.wallX0 - 10 : W - 10;
      const shift = x0 < lo ? lo - x0 : x1 > hi ? hi - x1 : 0;
      if (shift) {
        for (const st of this.stones) Body.translate(st.body, { x: shift, y: 0 });
        this.pileX += shift;
      }
    }
    const half = Math.max(...this.stones.map((st) => Math.abs(st.body.position.x - this.pileX) + st.hw));
    this.heapHalf = half;
    // Rubble: small unnamed stones, dropped over the heap so they settle
    // into its gaps and round it into a mound.
    const nRubble = 7;
    for (let i = 0; i < nRubble; i++) {
      const rad = r(7, 12) * this.S * (W < 520 ? 0.8 : 1);
      const o = { word: '', hw: rad * r(1.1, 1.4), hh: rad, look: STONE_LOOKS[Math.floor(rand() * STONE_LOOKS.length)], seed: rand() };
      const side = i % 2 ? 1 : -1;
      const cx = Math.max(30, Math.min(W - this.wallW - 30, this.pileX + side * r(0.15, 0.6) * half));
      const { body, local } = pebble(o, cx, soilY - r(60, 160) * this.S,
        { friction: 0.6, frictionStatic: 0.8, restitution: 0.08, density: 0.003, frictionAir: 0.03 });
      const st = { ...o, kind: 'rubble', body, local, a: 1, cleared: false, gone: false };
      st.img = this.paintStone(st);
      this.stones.push(st);
    }
    Composite.add(this.engine.world, this.stones.map((s) => s.body));
    // Let the heap settle before anyone sees it.
    for (let k = 0; k < 180; k++) this.physics();

    // ── Thorns ──────────────────────────────────────────────────────
    const tw = [...THORN_WORDS];
    for (let i = tw.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [tw[i], tw[j]] = [tw[j], tw[i]]; }
    this.thornWords = tw;
    this.weeds = [];
    const spots = [];
    let p0 = Infinity, p1 = -Infinity;
    for (const st of this.stones) { p0 = Math.min(p0, st.body.bounds.min.x); p1 = Math.max(p1, st.body.bounds.max.x); }
    const lo = (this.wallSide < 0 ? this.wallX1 : 0) + 0.05 * W;
    const hi = (this.wallSide > 0 ? this.wallX0 : W) - 0.03 * W;
    for (let tries = 0; spots.length < weeds && tries < 600; tries++) {
      const x = lo + rand() * (hi - lo);
      if (x > p0 - 40 * this.S && x < p1 + 40 * this.S) continue;   // not in the heap
      if (spots.some((o) => Math.abs(o - x) < 84 * this.S)) continue;
      spots.push(x);
    }
    spots.forEach((x, i) => this.addWeed(x, tw[i % tw.length], 1, 1));
    // On a narrow screen not every thorn fits beside the heap; the rest
    // were under the stones, and come up once they're moved.
    this.hidden = weeds - spots.length;
    this.initialWeeds = weeds;
  }

  addWeed(x, word, size, grow, species) {
    const rand = this.rand;
    const r = (a, b) => a + rand() * (b - a);
    // One of each in turn, starting somewhere different each day.
    if (this.made === undefined) { this.made = 0; this.first = Math.floor(rand() * SPECIES.length); }
    // (Seed breeds true: a sprout is its parent's plant.)
    const type = species || SPECIES[(this.first + this.made++) % SPECIES.length];
    const s = this.S * WEED_SIZE * r(0.9, 1.1) * size;
    const thorn = makeThorn(type, s, rand);
    const w = {
      kind: 'weed', type, thorn, x, home: x, y: this.edge(x), s, phase: r(0, 6),
      stalkH: thorn.stalkH,
      state: 'in', pull: 0, lean: 0, rot: 0, a: 1, free: false,
      word, seeds: 14, quiver: 0, grow: grow ? 1 : 0, vx: 0, vy: 0, t: 0, loose: 0,
    };
    this.weeds.push(w);
    return w;
  }

  note(key, text) {
    if (this.said[key]) return;
    this.said[key] = true;
    this.onNote(text);
  }

  // ── Rules ──────────────────────────────────────────────────────────
  remaining() {
    return this.hidden + this.stones.filter((s) => !s.cleared).length
      + this.weeds.filter((w) => w.state !== 'gone' && w.state !== 'away' && w.state !== 'compost').length
      + this.seeds.filter((sd) => sd.willSprout).length;
  }

  // How the clearing went, for the soil and the vine.
  result() {
    const perfect = this.dropped === 0 && !this.skipped && this.composted > 0 && this.stones.every((s) => s.walled);
    return { composted: this.composted, careful: this.careful, dropped: this.dropped, walled: this.walledToday, perfect };
  }

  // 0 → 1: how rich the soil has become from careful work.
  richness() {
    return Math.min(1, this.careful / Math.max(1, this.initialWeeds));
  }

  setPatience(p) {
    this.patience = PATIENCE[p] ? p : 'balanced';
    this.P = PATIENCE[this.patience];
  }

  inWall(st) {
    const x = st.body.position.x;
    return this.wallSide > 0 ? x > this.wallX0 + st.hw * 0.2 : x < this.wallX1 - st.hw * 0.2;
  }

  physics() {
    const { Engine, Body, Sleeping } = this.M;
    const g = this.grab;
    for (const st of this.stones) {
      if (st.cleared) continue;
      const b = st.body;
      if (st === this.dragStone && g) {
        // Carried by the hand, but still a body: it shoves and tumbles the
        // others. Moved by velocity toward the finger — a heavy stone
        // lags behind a quick hand, and past a point it slips.
        const H = HEFT[st.kind];
        const tx = g.px - g.off.x, ty = Math.min(g.py - g.off.y, this.soilY - st.hh);
        const ex = tx - b.position.x, ey = ty - b.position.y;
        const cap = H.cap * this.S;
        Body.setVelocity(b, { x: Math.max(-cap, Math.min(cap, ex * H.follow)), y: Math.max(-cap, Math.min(cap, ey * H.follow)) });
        Body.setAngularVelocity(b, b.angularVelocity * 0.8);
        if (Math.hypot(ex, ey) > Math.max(90, H.slip * this.S) * this.P.grip) this.slip(st);
        continue;
      }
      const dx = b.position.x - this.pileX;
      if (this.inWall(st)) {
        // At the wall: set in once it has come to rest there.
        const still = Math.hypot(b.velocity.x, b.velocity.y) < 0.4;
        st.rest = still ? (st.rest || 0) + STEP : 0;
        if (st.rest > 260) this.toWall(st);
        continue;
      }
      st.rest = 0;
      // The heap's pull: loose pieces creep back to it — rubble most
      // keenly, as rubble always seems to.
      const reach = this.heapHalf + this.W * 0.24;
      const from = st.kind === 'rubble' ? this.heapHalf * 0.3 : this.heapHalf * 0.55;
      if (Math.abs(dx) > from && Math.abs(dx) < reach) {
        if (b.isSleeping) Sleeping.set(b, false);
        const max = st.kind === 'rubble' ? 2.2 : 1.2;
        const want = -Math.sign(dx) * Math.min(max, (Math.abs(dx) - from) * 0.012) * this.S;
        Body.setVelocity(b, { x: b.velocity.x * 0.94 + want * 0.06, y: b.velocity.y });
      }
    }
    Engine.update(this.engine, STEP);
  }

  letGo(st) {
    if (st.density) { this.M.Body.setDensity(st.body, st.density); st.density = 0; }
  }

  slip(st) {
    const { Body } = this.M;
    const b = st.body;
    this.letGo(st);
    Body.setVelocity(b, { x: b.velocity.x * 0.35, y: b.velocity.y * 0.35 });
    this.dragStone = null;
    this.grab = null;
    navigator.vibrate?.(10);
    this.onNote(st.kind === 'stone' ? 'Too heavy to rush. It slipped. Slowly does it.' : 'It slipped. One at a time.');
  }

  // Set a stone into the wall: it leaves the physics and is laid in the
  // next place along the wall's courses.
  toWall(st) {
    if (st.cleared) return;
    this.letGo(st);
    st.cleared = true;
    st.walled = true;
    this.M.Composite.remove(this.engine.world, st.body);
    const n = this.wallBase + this.walledToday;
    const slot = this.wallSlot(n);
    this.walledToday++;
    st.fly = { x0: st.body.position.x, y0: st.body.position.y, a0: st.body.angle, t: 0, slot, n };
    this.onEvent({ type: 'wall', kind: st.kind });
    navigator.vibrate?.(8);
    if (st.kind === 'stone') this.note('wall', 'Set into the wall. The wall stays, and grows, day by day.');
  }

  // Where the n-th stone of the wall sits on screen (the field shows the
  // top courses; the vineyard shows the whole wall).
  wallSlot(n) {
    const per = Math.max(3, Math.floor(this.wallW / (17 * this.S)));
    const shown = n % (per * 6);
    const course = Math.floor(shown / per), k = shown % per;
    const sw = this.wallW / per;
    const x = this.wallX0 + sw * (k + 0.5 + (course % 2 ? 0.5 : 0) - (course % 2 && k === per - 1 ? 1 : 0));
    const y = this.soilY - 5 * this.S - course * 9 * this.S;
    return { x, y, w: sw * 0.98, h: 10 * this.S };
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
    for (const st of this.stones) {
      if (st.fly) {
        st.fly.t = Math.min(1, st.fly.t + dt / 0.7);
        if (st.fly.t >= 1) st.gone = true;
      } else if (st.cleared && !st.gone) {
        // Skipped: fades where it is.
        st.a = Math.max(0, st.a - dt * 1.5);
        if (st.a <= 0) { st.gone = true; this.M.Composite.remove(this.engine.world, st.body); }
      }
    }
    this.basket.hot *= 1 - Math.min(1, dt * 6);
    this.basket.puff = Math.max(0, this.basket.puff - dt * 1.4);
    for (const p of this.rich) p.a = Math.min(1, p.a + dt * 0.8);

    if (this.hidden > 0 && this.stones.every((st) => st.cleared || st.kind === 'rubble')) {
      const taken = this.weeds.map((w) => w.x);
      const lo = (this.wallSide < 0 ? this.wallX1 : 0) + 0.06 * this.W;
      const hi = (this.wallSide > 0 ? this.wallX0 : this.W) - 0.04 * this.W;
      for (let tries = 0; this.hidden > 0 && tries < 200; tries++) {
        const x = lo + (hi - lo) * this.rand();
        if (taken.some((o) => Math.abs(o - x) < 60 * this.S)) continue;
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
            if (Math.abs(w.rot) < 0.05) { w.rot = 0; w.state = 'in'; w.free = false; w.pull = 0; w.landed = 0; w.loose = 0; }
          }
        }
      }
      if (w.state === 'compost') {
        // Laid into the basket: it sinks in.
        w.t += dt;
        const b = this.basket;
        w.x += (b.x + b.w / 2 - w.x) * Math.min(1, dt * 8);
        w.y += (b.y + b.h * 0.35 - w.y) * Math.min(1, dt * 8);
        w.a = Math.max(0, 1 - w.t / 0.55);
        if (w.a <= 0) w.state = 'gone';
      }
      if (w.state === 'away') {
        w.a = Math.max(0, w.a - dt * 2);
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
        if (sd.x > 10 && sd.x < this.W - 10) this.addWeed(sd.x, sd.word, 0.72, 0, sd.kind);
      } else if (!sd.willSprout && this.t - sd.landed > 0.6) sd.done = true;
    }
    this.seeds = this.seeds.filter((sd) => !sd.done);
    this.weeds = this.weeds.filter((w) => w.state !== 'gone');
  }

  // Seed leaves the head and drifts down; some will grow.
  shed(w, n, x, y) {
    const lost = Math.min(n, w.seeds);
    w.seeds -= lost;
    this.dropped += lost;
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

  headOf(w) {
    const g = w.grow;
    const stretch = 1 + Math.max(0, w.pull) * 0.28;
    const h = w.stalkH * g * stretch;
    const a = w.rot + w.lean * 0.4 + (w.free ? 0 : (w.windSway != null ? w.windSway : Math.sin(this.t * 1.3 + w.phase) * 0.05) * (1 - Math.max(0, w.pull)));
    const base = { x: w.x, y: w.y - (w.free ? 0 : Math.max(0, w.pull) * 6 * w.s) };
    return { x: base.x + Math.sin(a) * h, y: base.y - Math.cos(a) * h, base, a, h };
  }

  overBasket(x, y) {
    const b = this.basket, pad = 26;
    return x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad * 2.2 && y < b.y + b.h + pad;
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
      const pad = st.kind === 'rubble' ? 14 : 10;   // small things get a generous target
      const d = Math.hypot(lx / (st.hw + pad), ly / (st.hh + pad));
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
      if (x < w.x - 30 * w.s || x > w.x + 30 * w.s || y < top || y > w.y + 18) continue;
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
      // In the hand it has heft: it shoulders the others aside rather
      // than sticking on them (it still lags behind a hurried hand).
      st.density = b.density;
      this.M.Body.setDensity(b, b.density * 10);
      this.wake();
      this.grab = { st, id, off: { x: x - b.position.x, y: y - b.position.y }, px: x, py: y, x0: x, y0: y, t0: performance.now(), last: { x, y, t: performance.now() }, moved: 0 };
      if (st.kind === 'stone') this.note('stone', 'Carry it to the wall, steadily. It’s heavy.');
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
      w.x = Math.max(4, Math.min(this.W - 4, x + g.hold.dx));
      w.y = y + g.hold.dy;
      w.lean += (Math.max(-1, Math.min(1, -vx / 1400)) - w.lean) * 0.3;
      w.quiver = Math.max(w.quiver, clamp01((g.speed - WARN * this.P.speed) / ((SHAKE - WARN) * this.P.speed)));
      if (this.overBasket(x, y)) this.basket.hot = 1;
      if (g.speed > SHAKE * this.P.speed && now - g.shedAt > 380 && w.seeds > 0) {
        g.shedAt = now;
        const hd = this.headOf(w);
        this.shed(w, 1, hd.x, hd.y);
        this.note('shake', 'Shaking it drops seed. Carry it steadily.');
      }
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
      this.note('out', 'Out, roots and all. Lay it in the compost basket.');
    }
    g.hold = { dx: w.x - g.px, dy: w.y - g.py };
  }

  up(x, y, id) {
    const g = this.grab;
    if (!g || g.id !== id) return;
    this.grab = null;
    const tap = g.moved < 10 && performance.now() - g.t0 < 450;

    if (g.st) {
      this.dragStone = null;
      this.letGo(g.st);
      // A tap only shows how: the work is the point.
      if (tap) this.onNote(g.st.kind === 'stone' ? 'Hold it and carry it to the wall.' : 'Drag it to the wall.');
      this.wake();
      return;
    }

    const w = g.w;
    if (w.state === 'in') {
      if (tap) this.onNote('Hold it, and lift slowly. The roots let go when they’re ready.');
      return;   // otherwise it springs back
    }
    if (w.state === 'carried') {
      if (this.overBasket(x, y)) { this.compost(w); return; }
      // Let go on the field: it falls, seeds, and roots again.
      w.state = 'fallen';
      w.vx = 0; w.vy = 0; w.landed = 0; w.t = 0;
      this.onNote('Dropped on the field: it will root again. Carry it to the basket.');
    }
  }

  compost(w) {
    w.state = 'compost';
    w.t = 0;
    this.composted++;
    this.basket.puff = 1;
    const whole = w.seeds >= 14;
    if (whole) {
      // Taken whole: rich dark soil where it grew.
      this.careful++;
      this.rich.push({ x: w.home, s: w.s, a: 0 });
      this.note('rich', 'Taken whole. Look: the soil is richer where it grew.');
    } else {
      this.note('lost', 'Into the compost, but it dropped seed on the way.');
    }
    this.onEvent({ type: 'compost', whole });
  }

  clearAll() {
    this.skipped = true;
    for (const st of this.stones) if (!st.cleared) { st.cleared = true; }
    for (const w of this.weeds) if (w.state === 'in' || w.state === 'fallen') w.state = 'away';
    for (const sd of this.seeds) sd.willSprout = false;
    this.hidden = 0;
  }

  // ── Drawing ────────────────────────────────────────────────────────
  // The soil's richness, from careful work: drawn over the soil.
  drawSoil(ctx, night) {
    for (const p of this.rich) {
      const y = this.edge(p.x) + 6 * p.s;
      const g = ctx.createRadialGradient(p.x, y, 2, p.x, y, 34 * p.s);
      g.addColorStop(0, `rgba(48,30,16,${0.6 * p.a})`);
      g.addColorStop(0.7, `rgba(58,38,20,${0.3 * p.a})`);
      g.addColorStop(1, 'rgba(58,38,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(p.x, y, 34 * p.s, 12 * p.s, 0, 0, Math.PI * 2); ctx.fill();
      // A few glints of good soil.
      ctx.fillStyle = `rgba(214,186,120,${0.5 * p.a * (night > 0.5 ? 0.5 : 1)})`;
      for (let k = 0; k < 5; k++) {
        ctx.beginPath(); ctx.arc(p.x + ((k * 37) % 40 - 20) * p.s, y + ((k * 13) % 7 - 3) * p.s, 0.9 * p.s, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  drawWall(ctx, night) {
    const total = this.wallBase + this.walledToday;
    const cap = Math.max(3, Math.floor(this.wallW / (17 * this.S))) * 6;   // six courses show here
    const tint = (c) => c.map((v, i) => v + ([28, 34, 54][i] - v) * 0.42 * night);
    // The footing, even before there are stones: a shallow trench.
    ctx.fillStyle = 'rgba(60,40,24,0.35)';
    ctx.fillRect(this.wallX0 + 4, this.soilY - 2, this.wallW - 8, 6);
    const landing = new Set(this.stones.filter((st) => st.fly && st.fly.t < 1).map((st) => st.fly.n % cap));
    const shown = Math.min(total, cap);
    for (let i = 0; i < shown; i++) {
      // A full wall keeps its newest stones on top.
      const n = total > cap ? total - cap + i : i;
      if (landing.has(n % cap) && n >= total - this.walledToday) continue;   // still on its way
      const s = this.wallSlot(n);
      const k = ((n * 7919) % 100) / 100;
      const c = tint([128 + k * 50, 122 + k * 44, 110 + k * 36]);
      const g = ctx.createLinearGradient(0, s.y - s.h / 2, 0, s.y + s.h / 2);
      g.addColorStop(0, `rgb(${c.map((v) => (v + 30) | 0)})`);
      g.addColorStop(1, `rgb(${c.map((v) => (v - 25) | 0)})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(s.x - s.w / 2, s.y - s.h / 2, s.w, s.h, s.h * 0.45);
      else ctx.rect(s.x - s.w / 2, s.y - s.h / 2, s.w, s.h);
      ctx.fill();
    }
    // While a stone is carried: the place it will go, glowing.
    if (this.dragStone) {
      const s = this.wallSlot(this.wallBase + this.walledToday);
      const pulse = 0.5 + 0.5 * Math.sin(this.t * 4);
      ctx.save();
      ctx.strokeStyle = `rgba(232,196,110,${0.5 + 0.4 * pulse})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(s.x - s.w / 2, s.y - s.h / 2, s.w, s.h, s.h * 0.45);
      else ctx.rect(s.x - s.w / 2, s.y - s.h / 2, s.w, s.h);
      ctx.stroke();
      const g = ctx.createLinearGradient(this.wallSide > 0 ? this.wallX0 - 40 : this.wallX1 + 40, 0, this.wallSide > 0 ? this.wallX0 + 20 : this.wallX1 - 20, 0);
      g.addColorStop(0, 'rgba(232,196,110,0)');
      g.addColorStop(1, `rgba(232,196,110,${0.12 + 0.08 * pulse})`);
      ctx.fillStyle = g;
      ctx.fillRect(this.wallSide > 0 ? this.wallX0 - 40 : this.wallX0, this.soilY - 140 * this.S, this.wallW + 40, 140 * this.S);
      ctx.restore();
    }
  }

  drawBasket(ctx, night) {
    const b = this.basket;
    const tint = (c, a = 1) => `rgba(${c.map((v, i) => (v + ([28, 34, 54][i] - v) * 0.42 * night) | 0)},${a})`;
    const cx = b.x + b.w / 2;
    ctx.save();
    // Glow when a weed is carried over it.
    if (b.hot > 0.02 || this.grab?.w?.state === 'carried') {
      const k = Math.max(b.hot, 0.35);
      const g = ctx.createRadialGradient(cx, b.y + b.h * 0.3, 4, cx, b.y + b.h * 0.3, b.w * 0.9);
      g.addColorStop(0, `rgba(240,214,140,${0.45 * k})`);
      g.addColorStop(1, 'rgba(240,214,140,0)');
      ctx.fillStyle = g;
      ctx.fillRect(b.x - b.w * 0.4, b.y - b.h, b.w * 1.8, b.h * 2.4);
    }
    // Shadow.
    ctx.fillStyle = 'rgba(30,20,12,0.3)';
    ctx.beginPath(); ctx.ellipse(cx + 4, b.y + b.h + 2, b.w * 0.46, 5, 0, 0, Math.PI * 2); ctx.fill();
    // Body: a woven, tapering basket.
    const top = b.y + b.h * 0.18, bot = b.y + b.h;
    const inset = b.w * 0.09;
    ctx.beginPath();
    ctx.moveTo(b.x, top);
    ctx.lineTo(b.x + inset, bot - 6);
    ctx.quadraticCurveTo(cx, bot + 6, b.x + b.w - inset, bot - 6);
    ctx.lineTo(b.x + b.w, top);
    ctx.closePath();
    const bg = ctx.createLinearGradient(0, top, 0, bot);
    bg.addColorStop(0, tint([196, 152, 96]));
    bg.addColorStop(1, tint([138, 98, 56]));
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.save();
    ctx.clip();
    // Weave: staggered strokes.
    ctx.strokeStyle = tint([110, 76, 42], 0.55);
    ctx.lineWidth = 1.2;
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      const y = top + ((r + 0.5) / rows) * (bot - top);
      for (let x = b.x + (r % 2 ? 6 : 0); x < b.x + b.w; x += 12) {
        ctx.beginPath(); ctx.ellipse(x + 3, y, 5, (bot - top) / rows / 2.4, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.restore();
    // Compost inside, mounding with all the family's weeds.
    const fill = Math.min(1, (this.compostBase + this.composted) / 40);
    ctx.fillStyle = tint([66, 44, 26]);
    ctx.beginPath();
    ctx.ellipse(cx, top + 1, b.w * 0.47, b.h * 0.14 + fill * b.h * 0.12, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = tint([90, 112, 52], 0.8);
    for (let k = 0; k < 5 * fill + 1; k++) {
      ctx.beginPath(); ctx.ellipse(cx + ((k * 29) % (b.w * 0.6)) - b.w * 0.3, top - 2 - ((k * 7) % 5), 4, 1.6, (k % 3) - 1, 0, Math.PI * 2); ctx.fill();
    }
    // Rim.
    ctx.strokeStyle = tint([120, 84, 46]);
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(cx, top, b.w / 2, b.h * 0.16, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = tint([214, 176, 118], 0.6);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(cx, top - 1.5, b.w / 2 - 2, b.h * 0.14, 0, Math.PI, 0); ctx.stroke();
    // A puff as something goes in.
    if (b.puff > 0) {
      ctx.fillStyle = `rgba(120,96,64,${0.5 * b.puff})`;
      for (let k = 0; k < 7; k++) {
        const a = Math.PI * (1.1 + (0.8 * k) / 6), d = (1 - b.puff) * b.w * 0.45;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, top + Math.sin(a) * d * 0.6, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  draw(ctx, night, reduced) {
    const ink = night > 0.5 ? [239, 232, 216] : [70, 62, 52];
    this.drawSoil(ctx, night);
    this.drawWall(ctx, night);

    for (const st of this.stones) {
      if (st.gone) continue;
      if (st.fly) { this.drawFlying(ctx, st, night); continue; }
      this.drawStone(ctx, st, night);
    }

    this.labels = [];
    const drawWeed = (w) => {
      // In the one wind, like the grass around it.
      if (this.wind) { w.windSway = this.wind.sway(w.x, 0.12, w.phase); w.windAt = this.wind.at(w.x); }
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
      if (w.state !== 'compost') this.drawLabel(ctx, w, night, ink);
      ctx.restore();
    };
    for (const w of this.weeds) if (w.state !== 'gone' && w.state !== 'carried' && w.state !== 'compost') drawWeed(w);
    // The basket is in front of the field; what's carried is in front of it.
    this.drawBasket(ctx, night);
    for (const w of this.weeds) if (w.state === 'carried' || w.state === 'compost') drawWeed(w);

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

  // A stone on its way into the wall: it eases from where it was let go
  // to its place, turning flat and shrinking to the wall's scale.
  drawFlying(ctx, st, night) {
    const f = st.fly;
    const u = f.t < 0.5 ? 2 * f.t * f.t : 1 - (-2 * f.t + 2) ** 2 / 2;
    const x = f.x0 + (f.slot.x - f.x0) * u;
    const y = f.y0 + (f.slot.y - f.y0) * u - Math.sin(Math.PI * u) * 40 * this.S;
    const sc = 1 + (Math.min(f.slot.w / (st.hw * 2), 1.4) - 1) * u;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(f.a0 * (1 - u));
    ctx.scale(sc, sc * (1 - 0.25 * u));
    ctx.drawImage(st.img.c, -st.img.w / 2, -st.img.h / 2, st.img.w, st.img.h);
    if (night > 0.02) { ctx.fillStyle = `rgba(20,24,42,${0.4 * night})`; ctx.fill(st.path); }
    ctx.restore();
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
    if (!st.word) return { c, w, h };   // rubble: no carving
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
