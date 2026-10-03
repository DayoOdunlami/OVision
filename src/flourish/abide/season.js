import { seeded } from '../lib/vine.js';

// ═══════════════════════════════════════════════════════════════════
// The year, on the Abide page. "That brings forth its fruit in its
// season" (Psalm 1).
//
//   spring  fresh, light leaves in the vineyard; petals drift by
//   summer  deep green; fireflies after dark
//   autumn  the vineyard's leaves turn amber and russet; leaves fall
//   winter  the vines go mostly bare; a little snow; frost on the soil
//
// The vine you're growing today is always green: new growth is new.
// ═══════════════════════════════════════════════════════════════════

const AUTUMN = [
  ['#9c4a1f', '#c8743a'],
  ['#b5651d', '#d9a13b'],
  ['#a8752a', '#e2bc5a'],
  ['#8a3b22', '#b8613a'],
];
const WINTER = [['#5f6650', '#858a6e'], ['#6b6656', '#8f8a76']];
const SPRING = [['#4f8f3e', '#8fc85a'], ['#5a9a48', '#a6d46a'], ['#3f8150', '#7dbd6c']];

// Re-dress a finished vine's leaves for the season (in place). Returns
// the leaves to draw.
export function seasonLeaves(leaves, season, seed) {
  if (season === 'summer') return leaves;
  const rand = seeded(seed + ' ' + season);
  const out = [];
  for (const lf of leaves) {
    const u = rand();
    if (season === 'winter') {
      if (u < 0.62) continue;
      lf.tone = WINTER[Math.floor(rand() * WINTER.length)];
    } else if (season === 'autumn') {
      if (u < 0.08) continue;   // a few already fallen
      if (u < 0.78) lf.tone = AUTUMN[Math.floor(rand() * AUTUMN.length)];
    } else if (season === 'spring') {
      lf.tone = SPRING[Math.floor(rand() * SPRING.length)];
    }
    lf.rgb = null;
    out.push(lf);
  }
  return out;
}

// Drifting things in the air.
export class SeasonAir {
  constructor(season) {
    this.season = season;
    this.parts = [];
    this.W = 0;
    this.H = 0;
    this.rand = seeded('air ' + season);
  }

  resize(W, soilY) {
    this.W = W;
    this.H = soilY;
    const r = this.rand;
    const n = { spring: 9, summer: 12, autumn: 10, winter: Math.round(Math.min(70, W / 16)) }[this.season];
    this.parts = Array.from({ length: n }, () => this.spawn(r() * soilY));
  }

  spawn(y = -20) {
    const r = this.rand;
    const s = this.season;
    return {
      x: r() * this.W, y,
      vx: s === 'winter' ? (r() - 0.5) * 6 : s === 'summer' ? (r() - 0.5) * 10 : 8 + r() * 14,
      vy: s === 'winter' ? 10 + r() * 14 : s === 'summer' ? (r() - 0.5) * 6 : 12 + r() * 12,
      size: s === 'winter' ? 0.8 + r() * 1.8 : s === 'summer' ? 1.4 + r() * 1.4 : 4 + r() * 4,
      rot: r() * 6, vr: (r() - 0.5) * 2, phase: r() * 6,
      tone: r(),
      // fireflies keep low, near the vines
      home: s === 'summer' ? this.H * (0.45 + r() * 0.5) : 0,
    };
  }

  step(dt, t) {
    for (const p of this.parts) {
      if (this.season === 'summer') {
        p.x += (p.vx + Math.sin(t * 0.7 + p.phase) * 8) * dt;
        p.y += (p.vy + Math.cos(t * 0.5 + p.phase) * 6 + (p.home - p.y) * 0.05) * dt;
        if (p.x < -10) p.x = this.W + 10;
        if (p.x > this.W + 10) p.x = -10;
        continue;
      }
      p.x += (p.vx + Math.sin(t * 0.9 + p.phase) * 10) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.y > this.H + 6 || p.x > this.W + 20) Object.assign(p, this.spawn(-10 - this.rand() * 40), { x: this.rand() * this.W * 0.9 - this.W * 0.1 });
    }
  }

  draw(ctx, t, night) {
    const s = this.season;
    if (s === 'summer') {
      // Fireflies, only after dark.
      if (night < 0.3) return;
      for (const p of this.parts) {
        const on = Math.max(0, Math.sin(t * 1.3 + p.phase * 3));
        if (on <= 0.05) continue;
        const a = night * on;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 9);
        g.addColorStop(0, `rgba(240,240,150,${0.55 * a})`);
        g.addColorStop(1, 'rgba(240,240,150,0)');
        ctx.fillStyle = g;
        ctx.fillRect(p.x - 9, p.y - 9, 18, 18);
        ctx.fillStyle = `rgba(255,255,210,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    for (const p of this.parts) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (s === 'winter') {
        ctx.fillStyle = `rgba(255,255,255,${0.55 + 0.35 * p.tone})`;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (s === 'spring') {
        ctx.fillStyle = p.tone < 0.5 ? 'rgba(246,196,206,0.9)' : 'rgba(252,226,230,0.9)';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.9, p.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // An autumn leaf, turning as it falls.
        const [dark, light] = AUTUMN[Math.floor(p.tone * AUTUMN.length)];
        ctx.scale(1, 0.55 + 0.45 * Math.sin(t * 2 + p.phase));
        ctx.fillStyle = night > 0.5 ? dark : light;
        ctx.beginPath();
        ctx.moveTo(-p.size, 0);
        ctx.quadraticCurveTo(0, -p.size * 0.75, p.size, 0);
        ctx.quadraticCurveTo(0, p.size * 0.75, -p.size, 0);
        ctx.fill();
        ctx.strokeStyle = dark;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(-p.size, 0);
        ctx.lineTo(p.size * 0.8, 0);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}
