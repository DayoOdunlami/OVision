import { drawBloom } from '../lib/draw.js';
import { PEOPLE, personOf } from './people.js';
import { daysBetween, todayIso } from './words.js';

// ═══════════════════════════════════════════════════════════════════
// The vineyard — the family's, made of everyone's rows.
//
// A gentle hillside seen in 2.5D: a trellised row for each person,
// receding up the hill (front to back in roster order), and along each
// row one vine for every day that person abided, at its place in the
// calendar — so the weeks line up down the hill, and a day several of
// you abided together has a vine in each of your rows at the same spot,
// tied together by a gold garland. Older entries, from before names,
// stand in a "Family" row.
//
// The vines keep growing for a week after they're planted, so what you
// sowed yesterday is bigger today. Fruit is green until that word's
// prayer has been learned by heart in the Pray puzzle, then ripe; a day
// of "good soil" (the field cleared without dropping a seed) bears an
// extra cluster.
//
// In front runs the wall the family has built from cleared stones, and
// beside it the compost heap; a watchtower rises once the wall is long
// (Isaiah 5:2).
//
// Pan by dragging, pinch or scroll to zoom, double-tap to look closer,
// tap a vine to open its day.
// ═══════════════════════════════════════════════════════════════════

const DX = 92;            // world px between days
const WIRE = 74;          // wire height above the ground (world px)
const ROW_DEPTH = 0.34;   // how much smaller each row back is
const TOWER_AT = 40;      // wall stones for the watchtower
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const clamp01 = (x) => clamp(x, 0, 1);
const ease = (x) => 1 - (1 - clamp01(x)) ** 3;
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };

const LEAF = {
  spring: [[86, 150, 62], [120, 178, 76]],
  summer: [[58, 112, 52], [84, 140, 64]],
  autumn: [[176, 112, 40], [150, 68, 34], [196, 150, 60], [84, 120, 56]],
  winter: [[118, 112, 88]],
};

// How grown a vine is, `age` days after planting: a young vine with
// its first leaves on the day it's planted, full in a week.
export const growthAt = (age) => clamp01(0.32 + 0.68 * (Math.max(0, age) / 6));

// ── One vine, drawn once per growth step and kept ────────────────
const sprites = new Map();
function vineSprite(g, clusters, ripe, season, dpr) {
  const q = Math.round(g * 12) / 12;
  const key = `${q}|${clusters}|${ripe}|${season}|${dpr}`;
  if (sprites.has(key)) return sprites.get(key);
  const Wd = 130, Ht = 120, ox = Wd / 2, oy = Ht - 8;
  const c = document.createElement('canvas');
  const k = dpr * 2;   // drawn sharp enough to zoom into
  c.width = Wd * k; c.height = Ht * k;
  const x = c.getContext('2d');
  x.setTransform(k, 0, 0, k, ox * k, oy * k);
  const rand = (() => { let s = Math.floor(hash(key) * 1e9) || 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

  // Trunk: gnarled, from the soil up to the wire.
  const th = (12 + 60 * clamp01(q * 1.5)) * 1;
  const tw = 1.6 + 4 * q;
  const tg = x.createLinearGradient(-tw, 0, tw, 0);
  tg.addColorStop(0, '#5a3d27'); tg.addColorStop(0.5, '#86603f'); tg.addColorStop(1, '#4a3120');
  x.fillStyle = tg;
  x.beginPath();
  x.moveTo(-tw, 0);
  x.bezierCurveTo(-tw * 1.4, -th * 0.35, tw * 0.8, -th * 0.6, -tw * 0.4, -th);
  x.lineTo(tw * 0.4, -th);
  x.bezierCurveTo(tw * 1.6, -th * 0.6, -tw * 0.6, -th * 0.35, tw, 0);
  x.closePath();
  x.fill();
  // Arms along the wire, once it reaches it.
  const arm = 44 * clamp01((q - 0.42) / 0.58);
  const arms = [];
  if (arm > 1) {
    x.strokeStyle = '#6e4c31';
    x.lineCap = 'round';
    for (const d of [-1, 1]) {
      x.lineWidth = Math.max(1.2, tw * 0.55);
      x.beginPath();
      x.moveTo(0, -th);
      x.quadraticCurveTo(d * arm * 0.4, -th - 4, d * arm, -th + 2);
      x.stroke();
      arms.push(d);
    }
  }
  // Leaves: palmate vine leaves along trunk and arms.
  const tones = LEAF[season] || LEAF.summer;
  const nLeaves = season === 'winter' ? Math.round(2 * q) : Math.round(2 + 13 * q);
  for (let i = 0; i < nLeaves; i++) {
    const onArm = arm > 4 && i > 1;
    const d = i % 2 ? 1 : -1;
    const u = rand();
    const px = onArm ? d * arm * (0.2 + 0.8 * u) : (rand() - 0.5) * 6;
    const py = onArm ? -th + 2 - rand() * 10 : -th * (0.35 + 0.6 * u);
    const sz = (6 + 6 * q) * (0.8 + rand() * 0.4);
    const col = tones[Math.floor(rand() * tones.length)];
    vineLeaf(x, px, py, sz, (rand() - 0.5) * 1.4 + (onArm ? d * 0.4 : 0), col);
  }
  // Clusters hang from the arms.
  if (q > 0.5) {
    const n = Math.min(3, clusters);
    for (let i = 0; i < n; i++) {
      const d = i % 2 ? 1 : -1;
      const cx = d * arm * (0.35 + 0.25 * i), cy = -th + 4;
      drawBloom(x, { kind: 'grapes', x: cx, y: cy, r: 9 + 4 * q, sx: 0, rot: 0, phase: 0 }, ripe ? 4 : 1.15, 0);
    }
  }
  const out = { c, w: Wd, h: Ht, ox, oy, top: th };
  sprites.set(key, out);
  return out;
}

function vineLeaf(x, px, py, s, rot, col) {
  x.save();
  x.translate(px, py);
  x.rotate(rot);
  const g = x.createRadialGradient(-s * 0.2, -s * 0.3, 0.5, 0, 0, s * 1.2);
  g.addColorStop(0, `rgb(${col.map((v) => Math.min(255, v + 40)).join(',')})`);
  g.addColorStop(1, `rgb(${col.join(',')})`);
  x.fillStyle = g;
  x.beginPath();
  // Five lobes, like a grape leaf.
  for (let k = 0; k <= 10; k++) {
    const a = -Math.PI / 2 + (k / 10) * Math.PI * 2;
    const rr = s * (k % 2 ? 0.62 : 1) * (k === 0 || k === 10 ? 0.9 : 1);
    const xx = Math.cos(a) * rr, yy = Math.sin(a) * rr * 0.92;
    if (k === 0) x.moveTo(xx, yy); else x.lineTo(xx, yy);
  }
  x.closePath();
  x.fill();
  x.strokeStyle = 'rgba(255,255,230,0.25)';
  x.lineWidth = 0.6;
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k / 5) * Math.PI * 2;
    x.beginPath(); x.moveTo(0, s * 0.2); x.lineTo(Math.cos(a) * s * 0.75, Math.sin(a) * s * 0.7); x.stroke();
  }
  x.restore();
}

export class Vineyard {
  constructor({ season = 'summer', onTap, onReveal, wind } = {}) {
    this.season = season;
    this.wind = wind || null;
    this.onTap = onTap || (() => {});
    this.onReveal = onReveal || (() => {});
    this.view = 'family';
    this.zoom = 1;
    this.camX = 0;
    this.camY = 0;
    this.vx = 0;
    this.ptrs = new Map();
    this.hits = [];
    this.reveal = 1;
    this.revealDays = 0;
    this.t = 0;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.anim = null;
  }

  resize(W, H, soilY) {
    this.W = W; this.H = H; this.soilY = soilY;
    this.horizon = soilY * (W < 520 ? 0.3 : 0.42);
    // The front row stands just above the old soil line, leaving the
    // foreground for the wall and the page's own footer.
    this.front = soilY - Math.min(30, (H - soilY) * 0.12);
    if (!this.placed) this.home();
  }

  // entries: sessions; learned: { key: date }; field: { wall, compost }
  setData({ entries, learned, field, ensure = [] }) {
    const firstSet = !this.data;
    this.data = { entries, learned: learned || {}, field: field || { wall: 0, compost: 0 } };
    const today = todayIso();
    // Rows: everyone who has abided (in roster order), anyone abiding
    // now, and a Family row for entries from before names.
    const names = PEOPLE.map((p) => p.name).filter((n) => ensure.includes(n) || entries.some((e) => e.who.includes(n)));
    this.rows = names.map((n) => ({ key: n, label: personOf(n)?.label || n, color: personOf(n)?.color }));
    if (entries.some((e) => !e.who.length)) this.rows.push({ key: '', label: 'Family', color: '#9cb93a' });
    if (!this.rows.length) this.rows.push({ key: ensure[0] || '', label: personOf(ensure[0])?.label || 'Family', color: personOf(ensure[0])?.color || '#9cb93a' });
    const first = entries.length ? entries[0].date : today;
    // Start the calendar on a Monday, at least a week back.
    const d0 = new Date(+first.slice(0, 4), +first.slice(5, 7) - 1, +first.slice(8, 10));
    d0.setDate(d0.getDate() - Math.min(7, Math.max(0, daysBetween(first, today) < 6 ? 6 - daysBetween(first, today) : 0)));
    d0.setDate(d0.getDate() - ((d0.getDay() + 6) % 7));
    const p = (n) => String(n).padStart(2, '0');
    this.d0 = `${d0.getFullYear()}-${p(d0.getMonth() + 1)}-${p(d0.getDate())}`;
    this.days = daysBetween(this.d0, today) + 1;
    this.today = today;
    if (firstSet || !this.placed) this.home();
  }

  setView(v) { this.view = v; }

  // Grow from how it looked when last seen to today.
  startReveal(daysSince) {
    if (!(daysSince > 0)) return;
    this.revealDays = Math.min(6, daysSince);
    this.reveal = 0;
    // A slow push-in while it grows: the camera says "look".
    const z = this.zoom;
    this.anim = { t: 0, dur: 3.2, z0: z * 0.8, z1: z, x0: this.camX, x1: this.camX };
    this.zoom = z * 0.8;
  }

  xOf(date) { return 70 + daysBetween(this.d0, date) * DX; }
  depth(r) { return 1 + r * ROW_DEPTH; }

  // Where a row's ground line sits on screen, and its scale.
  rowAt(r) {
    const z = this.depth(r);
    const s = this.zoom / z;
    const base = this.horizon + (this.front - this.horizon) / z;
    const y = this.front + (base - this.front) * Math.pow(this.zoom, 0.6) + this.camY;
    return { s, y, z };
  }
  sx(wx, s) { return this.W / 2 + (wx - this.camX) * s; }

  // The camera's starting place: today near the right, about ten days
  // in view.
  home() {
    if (!this.W || !this.data) return;
    // A young vineyard opens close on its few vines; a grown one, wider.
    const n = this.data.entries.length;
    const span = n <= 3 ? 2.6 : n <= 8 ? (this.W < 520 ? 3.4 : 6) : (this.W < 520 ? 4.2 : 9);
    this.zoom = clamp((this.W * 0.82) / (DX * span), 0.45, 2.2);
    this.camY = 0;
    const endX = this.xOf(this.today);
    this.camX = endX - (this.W * 0.18) / this.zoom;
    this.clampCam();
    this.placed = true;
  }

  // Bring today's vines into view (for the gather).
  focusToday() {
    const endX = this.xOf(this.today);
    const s = this.zoom;
    if (this.sx(endX, s) > this.W * 0.85 || this.sx(endX, s) < this.W * 0.15) this.camX = endX - (this.W * 0.18) / this.zoom;
    this.clampCam();
  }

  clampCam() {
    const s = this.zoom;
    const lo = -160 + (this.W / 2) / s - 40;
    const hi = this.xOf(this.today) + DX * 3 - (this.W / 2) / s + 40;
    this.camX = hi < lo ? (lo + hi) / 2 : clamp(this.camX, lo, hi);
    this.camY = clamp(this.camY, -this.H * 0.25, this.H * 0.4);
  }

  rowIndex(person) { return this.rows.findIndex((r) => r.key === person); }

  // Screen rect of a vine (for the gather to fly into).
  vineRect(date, person) {
    const r = Math.max(0, this.rowIndex(person));
    const { s, y } = this.rowAt(r);
    const x = this.sx(this.xOf(date), s);
    return { x: x - 50 * s, y: y - 100 * s, w: 100 * s, h: 100 * s };
  }

  lit(e, rowKey) {
    if (this.view === 'family') return 1;
    if (this.view === 'together') return e && e.who.length > 1 ? 1 : 0.22;
    return rowKey === this.view ? 1 : 0.22;
  }

  step(dt) {
    this.t += dt;
    if (this.reveal < 1) {
      this.reveal = Math.min(1, this.reveal + dt / 2.6);
      if (this.reveal >= 1) this.onReveal(false);
    }
    if (!this.ptrs.size && Math.abs(this.vx) > 0.01) {
      this.camX -= this.vx * dt * 60;
      this.vx *= Math.pow(0.9, dt * 60);
      this.clampCam();
    }
    if (this.anim) {
      const a = this.anim;
      a.t = Math.min(1, a.t + dt / (a.dur || 0.35));
      const k = ease(a.t);
      this.zoom = a.z0 + (a.z1 - a.z0) * k;
      this.camX = a.x0 + (a.x1 - a.x0) * k;
      this.clampCam();
      if (a.t >= 1) this.anim = null;
    }
  }

  ageOf(date) {
    const age = daysBetween(date, this.today);
    return age - (1 - ease(this.reveal)) * Math.min(this.revealDays, age + 1);
  }

  // ── Drawing ────────────────────────────────────────────────────
  draw(ctx, opts = {}) {
    const { alpha = 1, night = 0, ghost = false } = opts;
    if (!this.data || alpha <= 0.01) return;
    const { W, H } = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    const tint = (c, k = 0.45) => c.map((v, i) => (v + ([24, 30, 50][i] - v) * k * night) | 0);
    if (!ghost) this.drawLand(ctx, tint);
    this.hits = [];
    const entries = this.data.entries;
    // Back rows first.
    for (let r = this.rows.length - 1; r >= 0; r--) {
      const row = this.rows[r];
      const { s, y } = this.rowAt(r);
      if (y < -60 || s < 0.06) continue;
      const mine = entries.filter((e) => (row.key ? e.who.includes(row.key) : !e.who.length));
      const dim = this.view === 'family' || this.view === 'together' ? 1 : row.key === this.view ? 1 : 0.35;
      // Furrow and trellis.
      const x0 = this.sx(30, s), x1 = this.sx(this.xOf(this.today) + DX * 1.5, s);
      if (!ghost) {
        ctx.fillStyle = `rgba(${tint([92, 70, 44]).join(',')},${0.28 * dim})`;
        ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, y + 2 * s, (x1 - x0) / 2 + 20 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = alpha * dim;
      const wy = y - WIRE * s;
      ctx.strokeStyle = `rgba(${tint([110, 100, 86]).join(',')},0.8)`;
      ctx.lineWidth = Math.max(0.6, 1.1 * s);
      ctx.beginPath(); ctx.moveTo(x0, wy); ctx.lineTo(x1, wy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0, wy + 22 * s); ctx.lineTo(x1, wy + 22 * s); ctx.stroke();
      // Posts at the start of each week, and at the row's ends.
      for (let d = 0; d <= this.days + 1; d += 7) this.post(ctx, this.sx(70 + d * DX - DX / 2, s), y, s, tint, true);
      this.post(ctx, x1, y, s, tint, true);
      // Vines.
      for (const e of mine) {
        const wx = this.xOf(e.date);
        const x = this.sx(wx, s);
        if (x < -80 * s || x > W + 80 * s) continue;
        const hideK = opts.hideToday && e.date === this.today ? opts.todayAlpha : 1;
        if (hideK <= 0.01) continue;
        const lit = hideK * this.lit(e, row.key) * (this.view === 'family' || this.view === 'together' ? 1 : row.key === this.view ? 1 : 0.6);
        const g = growthAt(this.ageOf(e.date));
        const ripe = this.data.learned[e.key] !== undefined;
        const spr = vineSprite(g, 1 + (e.soil === 'good' ? 1 : 0) + (g > 0.85 ? 1 : 0), ripe, this.season, this.dpr);
        ctx.globalAlpha = alpha * lit;
        this.post(ctx, x, y, s * 0.85, tint, false);
        // Leaning a little in the one wind, from the root.
        const lean = this.wind ? this.wind.sway(x, 0.05, hash(e.date + row.key)) : 0;
        if (lean) {
          ctx.save();
          ctx.translate(x, y);
          ctx.transform(1, 0, -lean, 1, 0, 0);
          ctx.drawImage(spr.c, -spr.ox * s, -spr.oy * s, spr.w * s, spr.h * s);
          ctx.restore();
        } else {
          ctx.drawImage(spr.c, x - spr.ox * s, y - spr.oy * s, spr.w * s, spr.h * s);
        }
        // Together: a gold ribbon on the stake.
        if (e.who.length > 1) {
          ctx.fillStyle = `rgba(222,178,74,${0.95})`;
          ctx.beginPath();
          ctx.moveTo(x - 1 * s, y - 52 * s); ctx.lineTo(x + 7 * s, y - 49 * s); ctx.lineTo(x + 2 * s, y - 45 * s);
          ctx.closePath(); ctx.fill();
        }
        // Its word, on a tag, when close enough to read.
        if (!ghost && s > 0.62) this.tag(ctx, e.word, x, y + 9 * s, s, night, lit);
        this.hits.push({ x: x - 46 * s, y: y - 100 * s, w: 92 * s, h: 112 * s, e, row: row.key, r });
      }
      ctx.globalAlpha = alpha;
      // The row's name, kept at the left edge as you pan.
      if (!ghost && s > 0.18) this.rowLabel(ctx, row, x0 - 14 * s, wy + 6 * s, s, night, dim);
    }
    // Garlands between the rows of a day shared.
    if (!ghost) this.garlands(ctx, entries);
    // The wall and the compost, in front of it all.
    if (!ghost) this.drawWall(ctx, tint);
    ctx.restore();
    // Overnight: a soft light on the vines as they grow.
    if (this.reveal < 1 && !ghost) {
      ctx.save();
      ctx.globalAlpha = 0.25 * Math.sin(Math.PI * this.reveal);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(255,236,190,0)');
      g.addColorStop(0.6, 'rgba(255,236,190,1)');
      g.addColorStop(1, 'rgba(255,236,190,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  drawLand(ctx, tint) {
    const { W, H } = this;
    // Distant hills, drifting slowly as you pan.
    const hills = [[0.06, [176, 190, 160], 0.32, 0.6], [0.12, [150, 170, 130], 0.4, 1.1]];
    for (const [par, col, hgt, f] of hills) {
      const off = -this.camX * par * this.zoom;
      ctx.fillStyle = `rgb(${tint(col).join(',')})`;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let i = 0; i <= Math.ceil(W / 16); i++) {
        const x = Math.min(W, i * 16);
        const y = this.horizon - this.horizon * hgt * (0.5 + 0.5 * Math.sin((x - off) * 0.004 * f + f * 3) * Math.sin((x - off) * 0.0013 + f));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
    }
    // The hillside of the vineyard itself.
    const g = ctx.createLinearGradient(0, this.horizon, 0, H);
    const s = this.season;
    const top = s === 'autumn' ? [168, 160, 104] : s === 'winter' ? [190, 192, 180] : s === 'spring' ? [150, 182, 108] : [128, 164, 92];
    g.addColorStop(0, `rgb(${tint(top).join(',')})`);
    g.addColorStop(0.55, `rgb(${tint(top.map((v, i) => v - [24, 30, 30][i])).join(',')})`);
    g.addColorStop(1, `rgb(${tint([104, 82, 56]).join(',')})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let i = 0; i <= Math.ceil(W / 20); i++) {
      const x = Math.min(W, i * 20);
      ctx.lineTo(x, this.horizon + 6 + Math.sin((x + this.camX * 0.2 * this.zoom) * 0.006) * 6);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  post(ctx, x, y, s, tint, big) {
    const h = (big ? WIRE + 12 : WIRE + 4) * s, w = Math.max(1, (big ? 4 : 2) * s);
    ctx.fillStyle = `rgb(${tint(big ? [120, 90, 60] : [140, 108, 72]).join(',')})`;
    ctx.fillRect(x - w / 2, y - h, w, h);
  }

  tag(ctx, word, x, y, s, night, lit) {
    const fs = clamp(10 * s, 8, 15);
    ctx.save();
    ctx.globalAlpha *= 0.9;
    ctx.font = `italic 500 ${fs}px "Cormorant Garamond", Georgia, serif`;
    const mk = word + '|' + Math.round(fs * 2);
    let tw = this.widths?.get(mk);
    if (tw === undefined) { (this.widths ||= new Map()).set(mk, (tw = ctx.measureText(word).width + 10)); }
    ctx.fillStyle = night > 0.5 ? 'rgba(60,50,40,0.75)' : 'rgba(250,244,228,0.85)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - tw / 2, y, tw, fs + 6, 3); else ctx.rect(x - tw / 2, y, tw, fs + 6);
    ctx.fill();
    ctx.fillStyle = night > 0.5 ? '#f0e8d6' : '#4a4234';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(word, x, y + 3);
    ctx.restore();
  }

  rowLabel(ctx, row, x, y, s, night, dim) {
    const fs = clamp(13 * s, 10, 15);
    ctx.save();
    ctx.globalAlpha *= dim;
    ctx.font = `600 ${fs}px "Source Sans 3", system-ui, sans-serif`;
    const tw = ctx.measureText(row.label).width;
    const pad = fs * 0.55, dot = fs * 0.42;
    const w = tw + dot * 2 + pad * 3;
    // Pinned to the left edge once the row's start scrolls away.
    const right = Math.max(x, 12 + w);
    const left = right - w, h = fs + pad * 1.2;
    ctx.fillStyle = night > 0.5 ? 'rgba(30,34,48,0.6)' : 'rgba(252,248,238,0.78)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(left, y - h / 2, w, h, h / 2); else ctx.rect(left, y - h / 2, w, h);
    ctx.fill();
    ctx.fillStyle = row.color || '#9cb93a';
    ctx.beginPath(); ctx.arc(left + pad + dot, y, dot, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = night > 0.5 ? '#efe8d8' : '#3d4636';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(row.label, left + pad * 2 + dot * 2, y + 0.5);
    ctx.restore();
  }

  garlands(ctx, entries) {
    for (const e of entries) {
      if (e.who.length < 2) continue;
      const rs = e.who.map((n) => this.rowIndex(n)).filter((r) => r >= 0).sort((a, b) => a - b);
      const lit = this.view === 'family' || this.view === 'together' || e.who.includes(this.view) ? 1 : 0.25;
      for (let i = 0; i < rs.length - 1; i++) {
        const A = this.rowAt(rs[i]), B = this.rowAt(rs[i + 1]);
        const ax = this.sx(this.xOf(e.date), A.s), bx = this.sx(this.xOf(e.date), B.s);
        const ay = A.y - (WIRE - 6) * A.s, by = B.y - (WIRE - 6) * B.s;
        if (Math.max(ax, bx) < -40 || Math.min(ax, bx) > this.W + 40) continue;
        ctx.save();
        ctx.globalAlpha *= 0.8 * lit;
        ctx.strokeStyle = 'rgba(226,184,84,1)';
        ctx.lineWidth = Math.max(1, 1.6 * A.s);
        ctx.setLineDash([3 * A.s, 3 * A.s]);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo((ax + bx) / 2 + 8 * A.s, (ay + by) / 2 + 14 * A.s, bx, by);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  drawWall(ctx, tint) {
    const { wall, compost } = this.data.field;
    // The wall runs the whole length of the vineyard's front. It rises a
    // course at a time; the course being laid starts at today's end, so
    // the newest stones are always the nearest.
    const z = 0.8, s = this.zoom / z;
    const y = Math.min(this.H - 64, this.front + 34 * Math.pow(this.zoom, 0.6) + this.camY);
    const sw = 15, sh = 9;
    const wx0 = -40, wx1 = this.xOf(this.today) + DX * 1.5;
    const per = Math.max(1, Math.floor((wx1 - wx0) / sw));
    const full = Math.min(4, Math.floor(wall / per));
    const part = full >= 4 ? 0 : wall - full * per;
    for (let course = 0; course <= full; course++) {
      const n = course < full ? per : part;
      for (let k = 0; k < n; k++) {
        // Full courses run left to right; the one being laid, from today back.
        const slot = course < full ? k : per - 1 - k;
        const wx = wx0 + (slot + (course % 2 ? 0.5 : 0)) * sw;
        const x = this.sx(wx, s), yy = y - course * sh * s;
        if (x < -20 || x > this.W + 20) continue;
        const kk = hash('w' + course + ':' + slot);
        const c = tint([128 + kk * 50, 122 + kk * 44, 110 + kk * 36]);
        ctx.fillStyle = `rgb(${c.join(',')})`;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x - sw * s / 2, yy - sh * s, sw * s * 0.96, sh * s * 0.95, sh * s * 0.4);
        else ctx.rect(x - sw * s / 2, yy - sh * s, sw * s, sh * s);
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x - sw * s / 2, yy - sh * s * 0.3, sw * s * 0.96, sh * s * 0.25);
      }
    }
    // The watchtower, once the wall is long — at today's end, where the
    // view opens.
    if (wall >= TOWER_AT) {
      const x = this.sx(this.xOf(this.today) + DX * 2.4, s), ty = y - 4 * s;
      const tw = 40 * s, th = 120 * s;
      ctx.fillStyle = `rgb(${tint([150, 140, 122]).join(',')})`;
      ctx.beginPath();
      ctx.moveTo(x - tw / 2, ty); ctx.lineTo(x - tw * 0.4, ty - th); ctx.lineTo(x + tw * 0.4, ty - th); ctx.lineTo(x + tw / 2, ty); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgb(${tint([120, 110, 96]).join(',')})`;
      for (let k = -2; k <= 2; k++) ctx.fillRect(x + k * tw * 0.18 - tw * 0.06, ty - th - 8 * s, tw * 0.12, 8 * s);
      ctx.fillStyle = 'rgba(40,30,20,0.6)';
      ctx.fillRect(x - 4 * s, ty - th * 0.6, 8 * s, 14 * s);
    }
    // The compost heap, beside it.
    if (compost > 0) {
      const x = this.sx(this.xOf(this.today) + DX * 1.75, s), r = Math.min(46, 10 + Math.sqrt(compost) * 5) * s;
      ctx.fillStyle = `rgb(${tint([78, 56, 34]).join(',')})`;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = `rgba(${tint([96, 120, 60]).join(',')},0.8)`;
      for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(x + (k - 2.5) * r * 0.3, y - r * 0.3 - (k % 2) * r * 0.1, 3 * s, 1.4 * s, k - 2, 0, Math.PI * 2); ctx.fill(); }
    }
  }

  // ── Input ──────────────────────────────────────────────────────
  down(x, y, id) {
    this.ptrs.set(id, { x, y, x0: x, y0: y, t0: performance.now() });
    this.vx = 0;
    this.anim = null;
    if (this.ptrs.size === 2) {
      const [a, b] = [...this.ptrs.values()];
      this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.zoom };
    }
  }
  move(x, y, id) {
    const p = this.ptrs.get(id);
    if (!p) return;
    const dx = x - p.x, dy = y - p.y;
    p.x = x; p.y = y;
    if (this.ptrs.size === 1) {
      const s = this.zoom;
      this.camX -= dx / s;
      this.camY += dy * 0.6;
      this.vx = this.vx * 0.5 + (dx / s) * 0.5;
      this.clampCam();
    } else if (this.ptrs.size === 2 && this.pinch) {
      const [a, b] = [...this.ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      this.zoomAt(this.pinch.z * (d / Math.max(1, this.pinch.d)), (a.x + b.x) / 2);
    }
  }
  up(x, y, id) {
    const p = this.ptrs.get(id);
    this.ptrs.delete(id);
    if (this.ptrs.size < 2) this.pinch = null;
    if (!p) return;
    const moved = Math.hypot(x - p.x0, y - p.y0);
    const quick = performance.now() - p.t0 < 350;
    if (moved < 8 && quick && !this.ptrs.size) {
      this.vx = 0;
      const now = performance.now();
      // Double tap: look closer.
      if (this.lastTap && now - this.lastTap.t < 320 && Math.hypot(x - this.lastTap.x, y - this.lastTap.y) < 30) {
        this.lastTap = null;
        this.animateZoom(this.zoom * 1.8, x);
        return;
      }
      this.lastTap = { t: now, x, y };
      const hit = this.hitAt(x, y);
      if (hit) this.onTap(hit.e, hit.row);
    }
  }
  hitAt(x, y) {
    // Front rows are drawn last, so search them first.
    const order = [...this.hits].sort((a, b) => a.r - b.r);
    return order.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) || null;
  }
  zoomAt(z, px) {
    const nz = clamp(z, 0.3, 3.2);
    const wx = this.camX + (px - this.W / 2) / this.zoom;
    this.zoom = nz;
    this.camX = wx - (px - this.W / 2) / nz;
    this.clampCam();
  }
  animateZoom(z, px = this.W / 2) {
    const nz = clamp(z, 0.3, 3.2);
    const wx = this.camX + (px - this.W / 2) / this.zoom;
    this.anim = { t: 0, z0: this.zoom, z1: nz, x0: this.camX, x1: wx - (px - this.W / 2) / nz };
  }
  wheel(dy, px) {
    this.zoomAt(this.zoom * Math.exp(-dy * 0.0015), px);
  }
}
