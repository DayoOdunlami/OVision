// ═══════════════════════════════════════════════════════════════════
// paint.js — the water by the clock and the season.
//
// Four settings of one palette shape (water.js reads them), chosen by
// the same `light` value that sets the paper's tokens, so paper and
// water always change together. Seasons add one detail each, never two.
// ═══════════════════════════════════════════════════════════════════

import { CLEAR_POND } from './water.js';

export const WATER = {
  day: {
    ...CLEAR_POND,
    depth: [
      [0.0, '#d6f0e8'],
      [0.28, '#a3d4c9'],
      [0.55, '#5c9c98'],
      [0.8, '#245e62'],
      [1.0, '#0a2a31'],
    ],
  },
  dawn: {
    depth: [
      [0.0, '#f0e1dc'],
      [0.3, '#c9c3cc'],
      [0.56, '#7b8aa2'],
      [0.8, '#3a4866'],
      [1.0, '#141b2e'],
    ],
    currentDark: '#4a5574',
    currentLight: '#f6e4e0',
    caustic: [255, 232, 226],
    sparkle: '#fff4f0',
    godray: 'rgba(255, 220, 214,',
    vignette: '20, 24, 42',
  },
  dusk: {
    depth: [
      [0.0, '#b88a5e'],
      [0.28, '#8a7458'],
      [0.55, '#4a6261'],
      [0.8, '#1f3538'],
      [1.0, '#0a1416'],
    ],
    currentDark: '#2c4242',
    currentLight: '#f5d2a2',
    caustic: [255, 214, 160],
    sparkle: '#fff0d6',
    godray: 'rgba(255, 200, 140,',
    vignette: '10, 16, 18',
  },
  night: {
    depth: [
      [0.0, '#2a3e5f'],
      [0.3, '#1b2a47'],
      [0.58, '#111d35'],
      [0.82, '#0a1324'],
      [1.0, '#03060d'],
    ],
    currentDark: '#0b1629',
    currentLight: '#4a6290',
    caustic: [170, 192, 236],
    sparkle: '#dfe7ff',
    godray: 'rgba(200, 214, 255,',
    vignette: '2, 4, 10',
  },
};

// A moon on the water: a soft reflected disc that breaks up a little
// with the surface, upper right, away from the word.
export function paintMoon(ctx, W, H, ts) {
  const x = W * 0.78;
  const y = H * 0.16;
  const r = Math.min(W, H) * 0.05;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
  g.addColorStop(0, 'rgba(200, 214, 255, 0.16)');
  g.addColorStop(1, 'rgba(200, 214, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
  // The reflection itself: a soft disc, barely broken by the surface.
  const d = ctx.createRadialGradient(x, y, 0, x, y, r);
  d.addColorStop(0, 'rgba(236, 240, 255, 0.2)');
  d.addColorStop(0.7, 'rgba(236, 240, 255, 0.12)');
  d.addColorStop(1, 'rgba(236, 240, 255, 0)');
  ctx.fillStyle = d;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(236, 240, 255, 0.07)';
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    const yy = y + i * r * 0.34 + Math.sin(ts * 0.5 + i) * 1.5;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.8, yy);
    ctx.lineTo(x + r * 0.8, yy);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Season details ──────────────────────────────────────────────────
// Autumn: a few maple leaves drifting on the surface. Spring: petals.
// Winter: a skin of ice at the margins. Summer: nothing extra (the pads
// are at their fullest). All move with the one current, slowly.
export class Drifter {
  constructor(W, H, kind, seed) {
    this.kind = kind;
    this.reset(W, H, seed, true);
  }
  reset(W, H, seed = Math.random(), first = false) {
    this.x = first ? seed * W : -30;
    this.y = H * (0.1 + ((seed * 7.31) % 1) * 0.8);
    this.vx = 0.12 + ((seed * 3.7) % 1) * 0.12;
    this.rot = seed * 6.28;
    this.size = (this.kind === 'leaf' ? 10 : 6) + ((seed * 5.3) % 1) * 4;
    this.tone = (seed * 11.7) % 1;
  }
  update(W, H, t) {
    this.x += this.vx;
    this.y += Math.sin(t * 0.004 + this.tone * 6) * 0.08;
    this.rot += 0.0015 + this.tone * 0.001;
    if (this.x > W + 40) this.reset(W, H);
  }
  draw(ctx, night) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.globalAlpha = night ? 0.45 : 0.85;
    if (this.kind === 'leaf') {
      const s = this.size;
      const c = ['#b4512a', '#c9772f', '#9c3b22', '#d39a3a'][Math.floor(this.tone * 4)];
      // A fallen leaf lying on the water: a pointed oval with its
      // midrib and a short stalk, and a faint shadow on the water.
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.beginPath();
      ctx.ellipse(2, 3, s * 0.42, s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s * 0.62, -s * 0.15, 0, s);
      ctx.quadraticCurveTo(-s * 0.62, -s * 0.15, 0, -s);
      ctx.fill();
      ctx.strokeStyle = 'rgba(70, 28, 12, 0.45)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.85);
      ctx.lineTo(0, s * 1.25);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(255, 222, 232, 0.95)';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * 0.55, this.size, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function paintIce(ctx, W, H, night) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.hypot(W, H) * 0.56);
  const c = night ? '190, 205, 230' : '240, 248, 252';
  g.addColorStop(0, `rgba(${c}, 0)`);
  g.addColorStop(0.7, `rgba(${c}, ${night ? 0.1 : 0.22})`);
  g.addColorStop(1, `rgba(${c}, ${night ? 0.22 : 0.5})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// ── Lily pads: one for every week of the season ────────────────────
// Placed around the margin of the pond (never over the middle, where
// the words are), in a fixed order so a pad never moves once it's
// there. A lotus opens on the week's pad when that week's verse was
// said by heart.
export function layoutPads(weeks, W, H) {
  const portrait = H > W;
  const cx = W / 2;
  const cy = H / 2;
  const rx = W * (portrait ? 0.47 : 0.45);
  const ry = H * (portrait ? 0.46 : 0.44);
  const base = Math.max(22, Math.min(56, Math.min(W, H) * 0.06));
  // Golden-angle steps round the ellipse, so pads spread out evenly
  // however many there are, skipping the bottom middle, where the slip
  // of paper floats.
  const angles = [];
  for (let k = 0; angles.length < weeks.length && k < 200; k++) {
    const a = -Math.PI * 0.62 + k * 2.39996;
    const d = Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2));
    if (Math.abs(d) < (portrait ? 0.95 : 0.7)) continue;
    angles.push(a);
  }
  return weeks.map((w, i) => {
    const a = angles[i];
    const wob = ((i * 0.618) % 1) * 0.08;
    return {
      key: w.week,
      rx: (cx + Math.cos(a) * rx * (0.92 + wob)) / W,
      ry: (cy + Math.sin(a) * ry * (0.92 + wob)) / H,
      r: base * (0.8 + ((i * 0.37) % 1) * 0.35),
      rot: a + 1.2,
      phase: i * 1.3,
      lotus: w.lotus ? { ox: base * 0.25, oy: -base * 0.2, size: base * 0.42 } : undefined,
    };
  });
}
