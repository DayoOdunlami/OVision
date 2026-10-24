import { buildVine, grownLength } from './vine.js';
import { stroke } from './brush.js';
import { boneless, bunch, inkOf, pig, PAPER } from './paint.js';
import { clamp01, easeInOut } from './noise.js';

// ═══════════════════════════════════════════════════════════════════
// vineMoment.js — the vine comes forward (studio S).
//
// The vine isn't the world: it lives along the trellis at the back of
// the garden. Touch it and the page leans in a little, the air in front
// of the trellis clears, and the vine writes the family's word along
// the top wire, growing as the old Flourish writer grew it (vine.js,
// unchanged), but painted with the study's own brush: the stem in ink,
// leaves as two presses of the brush, a few bunches. It stays a while,
// then the garden settles back. A touch anywhere ends it sooner.
// ═══════════════════════════════════════════════════════════════════

export class VineMoment {
  constructor(word = 'Rooted') {
    this.word = word;
    this.on = false;
    this.k = 0;       // how far forward (0..1)
    this.t = 0;       // growth time
    this.vine = null;
    this.for = '';
  }

  start(L) {
    const key = `${L.W}x${L.H}`;
    if (key !== this.for) {
      this.for = key;
      const box = { x: L.W * 0.1, y: L.trellisTop - L.H * 0.11, w: L.W * 0.8, h: L.wire1 - L.trellisTop + L.H * 0.12 };
      this.vine = buildVine(this.word, box, { bloom: 'grapes', amount: 'few', pace: 2.2 });
      this.box = box;
    }
    this.on = true;
    this.t = 0;
    this.until = (this.vine?.doneAt || 12) + 22;
  }

  stop() { this.on = false; }

  step(dt) {
    if (this.on) {
      this.t += dt;
      if (this.t > this.until) this.on = false;
    }
    this.k += ((this.on ? 1 : 0) - this.k) * Math.min(1, dt * (this.on ? 1.2 : 0.9));
    if (!this.on && this.k < 0.002) this.k = 0;
  }

  // The lean towards the trellis, for the whole page.
  camera(L) {
    const e = easeInOut(clamp01(this.k));
    return { s: 1 + 0.12 * e, cx: L.W / 2, cy: L.wire1 };
  }

  draw(ctx, L, mode) {
    if (this.k <= 0 || !this.vine) return;
    const a = clamp01(this.k);
    const { box } = this;
    // The air clears in front of the trellis.
    const g = ctx.createLinearGradient(0, box.y - L.H * 0.02, 0, box.y + box.h + L.H * 0.02);
    const p = PAPER.join(',');
    g.addColorStop(0, `rgba(${p},0)`);
    g.addColorStop(0.2, `rgba(${p},${0.78 * a})`);
    g.addColorStop(0.85, `rgba(${p},${0.78 * a})`);
    g.addColorStop(1, `rgba(${p},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, box.y - L.H * 0.02, L.W, box.h + L.H * 0.04);
    drawGrowth(ctx, this.vine, this.t, mode, a);
  }
}

// The vine as far as it has grown at time t (seconds), in the study's
// brush. Shared by the landscape's vine moment and the garden.
export function drawGrowth(ctx, vine, t, mode, a = 1) {
  ctx.save();
  ctx.globalAlpha *= a;
  const ink = inkOf(mode);
  const fill = `rgb(${ink.join(',')})`;
  const { stems, leaves, blossoms, em } = vine;
  for (const st of stems) {
    const grown = grownLength(st, t);
    if (grown <= 1) continue;
    const pts = [];
    for (let i = 0; i < st.pts.length && st.s[i] <= grown; i += 2) pts.push(st.pts[i]);
    if (pts.length < 2) continue;
    const frac = grown / st.len;
    const w = Math.max(1.4, st.w0 * 1.25);
    const press = (u) => {
      const g2 = u * frac;
      const taper = (st.w0 + (st.w1 - st.w0) * g2) / st.w0;
      return (u < 0.04 && !st.branch ? 1.3 : 1) * taper * (frac < 1 && u > 0.85 ? 1 - (u - 0.85) * 4 : 1);
    };
    if (mode !== 'ink') stroke(ctx, pts, { size: w * 1.9, fill: `rgb(${pig('leaf', mode).join(',')})`, alpha: 0.28, press, wobble: 0.2, seed: 2000 + Math.round(st.len), pool: 0 });
    stroke(ctx, pts, { size: w, fill, alpha: st.tendril ? 0.5 : 0.82, press, wobble: 0.25, seed: 2100 + Math.round(st.len), pool: st.branch ? 0.1 : 0.4 });
  }
  for (const [i, lf] of leaves.entries()) {
    const q = clamp01((t - lf.t0) / lf.dur);
    if (q <= 0) continue;
    boneless(ctx, lf.x, lf.y, lf.ang, lf.L * 0.55 * (0.4 + 0.6 * q), mode, ink, 2300 + i);
  }
  for (const [i, b] of blossoms.entries()) {
    const q = clamp01((t - b.t0) / 2.5);
    if (q <= 0 || b.kind !== 'grapes') continue;
    ctx.save();
    ctx.globalAlpha *= q;
    bunch(ctx, b.x, b.y, em * 0.09, mode, ink, 2500 + i);
    ctx.restore();
  }
  ctx.restore();
}
