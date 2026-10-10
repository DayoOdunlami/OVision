import { seeded } from '../lib/vine.js';

// ═══════════════════════════════════════════════════════════════════
// The quiet life of the place (see the abide-direction skill).
//
//   grass   a fringe of blades along the top of the soil, leaning in
//           the one wind
//   clouds  a few soft clouds crossing the sky, slowly, on the wind
//   bird    the one rare surprise: now and then a small bird crosses
//           the sky — never while the verse is showing or while the
//           field is being cleared
//
// All of it is low-contrast and slow, and none of it asks to be looked
// at. Remove it and the world would feel stopped; look for it and it's
// there.
// ═══════════════════════════════════════════════════════════════════

const GRASS = {
  spring: [[110, 156, 68], [132, 176, 82], [96, 140, 60]],
  summer: [[92, 132, 58], [116, 150, 66], [80, 118, 52]],
  autumn: [[150, 140, 78], [128, 128, 70], [170, 150, 92]],
  winter: [[150, 156, 140], [176, 180, 168], [130, 138, 122]],
};

export class Ambient {
  constructor({ season = 'summer', reduced = false } = {}) {
    this.season = season;
    this.reduced = reduced;
    this.rand = seeded('ambient ' + season);
    this.blades = [];
    this.clouds = [];
    this.bird = null;
    this.nextBird = 25 + this.rand() * 40;
    this.t = 0;
  }

  resize(W, soilY, edge) {
    this.W = W; this.soilY = soilY; this.edge = edge;
    const r = this.rand;
    // Grass: a blade every few pixels, in three tones, a little taller
    // in clumps.
    this.blades = [];
    for (let x = -4; x < W + 4; x += 2.2 + r() * 3.2) {
      const clump = 0.6 + 0.8 * Math.max(0, Math.sin(x * 0.021 + 1.7) * Math.sin(x * 0.0067));
      this.blades.push({ x, h: (3 + r() * 7) * clump + 2, tone: Math.floor(r() * 3), phase: r() });
    }
    // Clouds: three or four, high in the sky, at two depths.
    const n = W < 520 ? 3 : 4;
    if (!this.clouds.length) {
      for (let i = 0; i < n; i++) {
        const far = i % 2 === 0;
        this.clouds.push({
          x: r() * W, y: soilY * (0.08 + r() * 0.26),
          s: (far ? 0.6 : 1) * (0.8 + r() * 0.5) * Math.max(0.7, Math.min(1.3, W / 900)),
          speed: far ? 3 : 6, img: this.cloudSprite(r), far,
        });
      }
    } else {
      for (const c of this.clouds) c.y = Math.min(c.y, soilY * 0.36);
    }
  }

  // A cloud: a long, low bank of many soft overlapping puffs, rounder
  // on top and flat underneath, drawn small and blurred so no single
  // puff shows.
  cloudSprite(r) {
    const w = 320, h = 110;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    if ('filter' in x) x.filter = 'blur(6px)';
    const puffs = 16 + Math.floor(r() * 8);
    for (let i = 0; i < puffs; i++) {
      const u = r();
      const px = 40 + u * (w - 80);
      const lift = Math.sin(Math.PI * u) * (24 + r() * 14);   // taller in the middle
      const pr = 12 + r() * 16 + lift * 0.35;
      const py = 70 - lift * 0.55 + r() * 6;
      const g = x.createRadialGradient(px, py, 0, px, py, pr);
      g.addColorStop(0, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g;
      x.beginPath(); x.arc(px, py, pr, 0, Math.PI * 2); x.fill();
    }
    x.filter = 'none';
    // A flat base.
    x.globalCompositeOperation = 'destination-out';
    const fade = x.createLinearGradient(0, 74, 0, 92);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,1)');
    x.fillStyle = fade;
    x.fillRect(0, 74, w, h - 74);
    return c;
  }

  // mode: the page's phase; quiet: true while the verse is showing.
  step(dt, wind, { mode, quiet }) {
    this.t += dt;
    if (this.reduced) return;
    const drift = wind.drift();
    for (const c of this.clouds) {
      c.x += c.speed * drift * dt;
      if (c.x - 160 * c.s > this.W) c.x = -160 * c.s;
    }
    // The bird: only in the open moments (the word card, the vineyard).
    const open = (mode === 'intro' || mode === 'vineyard') && !quiet;
    if (this.bird) {
      const b = this.bird;
      b.x += b.vx * dt;
      b.y += Math.sin(this.t * 1.3 + b.phase) * 4 * dt;
      if (b.x < -40 || b.x > this.W + 40) this.bird = null;
    } else if (open) {
      this.nextBird -= dt;
      if (this.nextBird <= 0) {
        const r = this.rand;
        const dir = r() < 0.5 ? 1 : -1;
        this.bird = {
          x: dir > 0 ? -30 : this.W + 30, y: this.soilY * (0.12 + r() * 0.2),
          vx: dir * (55 + r() * 25) * Math.max(0.8, this.W / 1000), phase: r() * 6, s: 0.8 + r() * 0.5,
        };
        this.nextBird = 60 + r() * 60;   // at most one a minute
      }
    }
  }

  drawSky(ctx, night) {
    if (this.reduced && !this.clouds.length) return;
    for (const c of this.clouds) {
      ctx.save();
      ctx.globalAlpha = (c.far ? 0.5 : 0.75) * (1 - 0.7 * night);
      const w = 320 * c.s, h = 110 * c.s;
      ctx.drawImage(c.img, c.x - w / 2, c.y - h / 2, w, h);
      ctx.restore();
    }
    const b = this.bird;
    if (b) {
      // A small dark "m", wings beating slowly.
      const flap = Math.sin(this.t * 7 + b.phase);
      const s = 7 * b.s;
      ctx.save();
      ctx.strokeStyle = night > 0.5 ? 'rgba(230,226,214,0.55)' : 'rgba(52,56,50,0.7)';
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x - s, b.y - flap * s * 0.5);
      ctx.quadraticCurveTo(b.x - s * 0.45, b.y - s * 0.35 - flap * s * 0.2, b.x, b.y);
      ctx.quadraticCurveTo(b.x + s * 0.45, b.y - s * 0.35 - flap * s * 0.2, b.x + s, b.y - flap * s * 0.5);
      ctx.stroke();
      ctx.restore();
    }
  }

  // The fringe of grass along the top of the soil, leaning in the wind.
  drawGrass(ctx, wind, night) {
    const tones = GRASS[this.season] || GRASS.summer;
    const k = 0.45 * night;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.3;
    for (let tone = 0; tone < 3; tone++) {
      const c = tones[tone].map((v, i) => (v + ([28, 34, 54][i] - v) * k) | 0);
      ctx.strokeStyle = `rgb(${c.join(',')})`;
      ctx.beginPath();
      for (const bl of this.blades) {
        if (bl.tone !== tone) continue;
        const y = this.edge(bl.x) + 1.5;
        const lean = wind.sway(bl.x, 0.55, bl.phase);
        const tx = bl.x + Math.sin(lean) * bl.h, ty = y - Math.cos(lean) * bl.h;
        ctx.moveTo(bl.x, y);
        ctx.quadraticCurveTo(bl.x + Math.sin(lean) * bl.h * 0.25, y - bl.h * 0.6, tx, ty);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}
