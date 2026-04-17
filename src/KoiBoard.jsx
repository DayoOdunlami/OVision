import { useState, useEffect, useRef, useCallback } from 'react';
import SpineFish, { buildPondMix } from './SpineFish.js';

// ── Lily pads ────────────────────────────────────────────────────────────────
// The pad is drawn in three layers to feel genuinely alive:
//   1. A soft pond-floor shadow offset below it (projected sunlight occlusion)
//   2. The pad itself with a gently-undulating edge (wavy, not a perfect arc)
//      and a notch cut out, lit from the upper-left so rim highlights pick up
//      where the god rays fall
//   3. Optional accents: water droplets beaded on the pad, and a pink lotus
//      blossom growing from it for punctuation
// Shared pad-motion function. The lily rides on the water's surface tension:
//   • a gentle vertical bob (primary wave, ~5s cycle)
//   • a smaller, faster secondary wave (wind ripples, ~2s cycle)
//   • a slow horizontal drift (current nudging it, ~8s cycle)
//   • a subtle rotational sway
// IMPORTANT: `t` here is the frame counter (st.current.tick), not milliseconds.
// Coefficients are frame-based so e.g. 0.02 * 60fps ≈ 1.2 rad/s → ~5s period.
function padMotion(t, phase) {
  const bob = Math.sin(t * 0.020 + phase) * 4.5
            + Math.sin(t * 0.048 + phase * 1.7) * 1.4;
  const drift = Math.sin(t * 0.013 + phase * 0.8) * 5.5
              + Math.cos(t * 0.032 + phase) * 1.6;
  const sway = Math.sin(t * 0.016 + phase) * 0.08
             + Math.sin(t * 0.036 + phase * 2.1) * 0.035;
  return { bob, drift, sway };
}

function drawPadShadow(ctx, x, y, r, rot, t, phase) {
  const { bob, drift, sway } = padMotion(t, phase);
  ctx.save();
  // Shadow lags the pad very slightly (refraction through moving water)
  ctx.translate(x + 6 + drift * 0.75, y + bob * 0.9 + 14);
  ctx.rotate(rot + sway);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#021613';
  ctx.beginPath();
  const steps = 36;
  const notch = 0.35;
  for (let i = 0; i <= steps; i++) {
    const a = notch + (i / steps) * (Math.PI * 2 - notch * 2);
    // Slight outline wobble so the shadow blur looks organic
    const rr = r * (1.03 + Math.sin(a * 3 + phase) * 0.03);
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.filter = 'blur(8px)';
  ctx.fill();
  ctx.filter = 'none';
  ctx.restore();
}

function drawPad(ctx, pad, W, H, t) {
  const x = pad.rx * W;
  const y = pad.ry * H;
  const r = pad.r;
  const rot = pad.rot;
  const phase = pad.phase;
  const { bob, drift, sway } = padMotion(t, phase);

  ctx.save();
  ctx.translate(x + drift, y + bob);
  ctx.rotate(rot + sway);

  // ── Pad body with undulating edge ──
  const grad = ctx.createRadialGradient(-r * 0.28, -r * 0.32, r * 0.08, 0, 0, r);
  grad.addColorStop(0, '#c8ed9e');
  grad.addColorStop(0.5, '#7ab86a');
  grad.addColorStop(1, '#2d5a31');

  ctx.beginPath();
  const steps = 44;
  const notch = 0.35;
  for (let i = 0; i <= steps; i++) {
    const a = notch + (i / steps) * (Math.PI * 2 - notch * 2);
    // Organic wobble — the pad edge undulates very softly
    const rr = r * (1 + Math.sin(a * 4 + phase * 1.7) * 0.025
                      + Math.sin(a * 7 + phase) * 0.015);
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.92;
  ctx.fill();

  // Dark outline for definition
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#1a3c23';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // ── Radial veins ──
  ctx.strokeStyle = 'rgba(30, 68, 40, 0.38)';
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 9; i++) {
    const a = notch + (i / 9) * (Math.PI * 2 - notch * 2);
    const rr = r * 0.88;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    ctx.stroke();
  }

  // ── Rim highlight (upper-left, catching the god rays) ──
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#eaffc9';
  ctx.beginPath();
  ctx.ellipse(-r * 0.25, -r * 0.32, r * 0.55, r * 0.22, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // ── Sheen band — a thin bright crescent tracing the upper edge ──
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = 'rgba(230, 255, 200, 0.75)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.96, Math.PI * 1.1, Math.PI * 1.85);
  ctx.stroke();

  // ── Water droplets (only on flagged pads) ──
  if (pad.droplets) {
    ctx.globalAlpha = 0.85;
    pad.droplets.forEach((d, i) => {
      const dx = d.x * r;
      const dy = d.y * r;
      const dr = d.r;
      // Pearly droplet — radial gradient with a tiny white glint
      const dg = ctx.createRadialGradient(dx - dr * 0.3, dy - dr * 0.3, 0, dx, dy, dr);
      dg.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      dg.addColorStop(0.5, 'rgba(200, 230, 210, 0.5)');
      dg.addColorStop(1, 'rgba(40, 70, 50, 0.25)');
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(dx, dy, dr, 0, Math.PI * 2);
      ctx.fill();
      // Tiny white specular glint
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(dx - dr * 0.35, dy - dr * 0.35, dr * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.85;
    });
  }

  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Lotus blossom (rendered outside the rotation so it always sits upright) ──
  if (pad.lotus) {
    drawLotus(ctx, x + drift + pad.lotus.ox, y + bob + pad.lotus.oy, pad.lotus.size, t, phase);
  }
}

function drawLotus(ctx, x, y, size, t, phase) {
  // Gentle sway
  const sway = Math.sin(t * 0.0006 + phase) * 0.05;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sway);

  // Outer petals (5) — pale pink
  const outerPetals = 5;
  for (let i = 0; i < outerPetals; i++) {
    ctx.save();
    ctx.rotate((i / outerPetals) * Math.PI * 2);
    const pg = ctx.createLinearGradient(0, 0, 0, -size);
    pg.addColorStop(0, 'rgba(255, 210, 225, 0.95)');
    pg.addColorStop(0.7, 'rgba(252, 178, 200, 0.92)');
    pg.addColorStop(1, 'rgba(230, 130, 165, 0.88)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size * 0.4, -size * 0.3, 0, -size);
    ctx.quadraticCurveTo(-size * 0.4, -size * 0.3, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(190, 100, 140, 0.5)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.restore();
  }

  // Inner petals (5) — brighter, offset
  const innerPetals = 5;
  for (let i = 0; i < innerPetals; i++) {
    ctx.save();
    ctx.rotate((i / innerPetals) * Math.PI * 2 + Math.PI / innerPetals);
    ctx.fillStyle = 'rgba(255, 240, 245, 0.92)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size * 0.26, -size * 0.3, 0, -size * 0.72);
    ctx.quadraticCurveTo(-size * 0.26, -size * 0.3, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Golden center
  const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.22);
  cg.addColorStop(0, 'rgba(255, 230, 120, 0.98)');
  cg.addColorStop(0.7, 'rgba(240, 180, 80, 0.9)');
  cg.addColorStop(1, 'rgba(200, 140, 50, 0.7)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // Tiny stamen dots
  ctx.fillStyle = 'rgba(220, 150, 70, 0.9)';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * size * 0.11, Math.sin(a) * size * 0.11, size * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

const PADS = [
  // Left side — large pad with lotus
  {
    rx: 0.07, ry: 0.42, r: 58, rot: 0.5, phase: 0.1,
    lotus: { ox: 18, oy: -10, size: 20 },
    droplets: [
      { x: 0.35, y: 0.15, r: 3 },
      { x: -0.18, y: 0.4, r: 2.2 },
    ],
  },
  // Right side — another lotus-bearer, larger
  {
    rx: 0.92, ry: 0.5, r: 62, rot: -0.8, phase: 1.4,
    lotus: { ox: -14, oy: -6, size: 22 },
  },
  // Top-centre — smaller pad with droplets
  {
    rx: 0.5, ry: 0.06, r: 46, rot: 1.3, phase: 2.3,
    droplets: [{ x: 0.3, y: -0.15, r: 2.5 }, { x: -0.25, y: 0.3, r: 1.8 }],
  },
  // Bottom-left cluster
  { rx: 0.18, ry: 0.9, r: 50, rot: 2.2, phase: 3.1 },
  // Bottom-right cluster
  {
    rx: 0.78, ry: 0.87, r: 44, rot: -1.5, phase: 4.0,
    droplets: [{ x: 0.15, y: 0.25, r: 2.2 }],
  },
  // Middle floating pad
  { rx: 0.35, ry: 0.78, r: 38, rot: 0.9, phase: 5.2 },
];

// ── Drifting blossoms (the Shinkai touch) ────────────────────────────────────
// One leaf/blossom drifts across the pond every 18–28s, slow rotation, low alpha.
class Blossom {
  constructor(W, H) {
    const fromLeft = Math.random() < 0.5;
    this.y = 40 + Math.random() * (H - 80);
    this.x = fromLeft ? -40 : W + 40;
    this.vx = (fromLeft ? 1 : -1) * (0.22 + Math.random() * 0.18);
    this.vy = -0.02 + Math.random() * 0.04;
    this.rot = Math.random() * Math.PI * 2;
    this.rotSpd = (Math.random() - 0.5) * 0.004;
    this.size = 8 + Math.random() * 6;
    this.alpha = 0.6 + Math.random() * 0.25;
    this.hue = Math.random() < 0.7 ? 'blossom' : 'leaf';
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rot += this.rotSpd;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    if (this.hue === 'blossom') {
      // 5-petal cherry blossom
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((i / 5) * Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 220, 232, 0.9)';
        ctx.beginPath();
        ctx.ellipse(0, -this.size * 0.55, this.size * 0.38, this.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = 'rgba(220, 180, 200, 0.9)';
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.18, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(180, 210, 140, 0.8)';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * 0.45, this.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(80, 120, 70, 0.6)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(0, this.size);
      ctx.stroke();
    }
    ctx.restore();
  }
  isOffscreen(W) {
    return this.x < -80 || this.x > W + 80;
  }
}

// ── Ripple ──────────────────────────────────────────────────────────────────
class Ripple {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.rings = [
      { r: 3, alpha: 0.65, spd: 1.6 },
      { r: 1, alpha: 0.4, spd: 1.2 },
    ];
  }
  update() { this.rings.forEach(r => { r.r += r.spd; r.alpha -= 0.013; }); }
  draw(ctx) {
    this.rings.forEach(r => {
      if (r.alpha <= 0) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${r.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }
  isDead() { return this.rings[0].alpha <= 0; }
}

// ── Surface break: the "splash from above" effect ────────────────────────────
// Triggered when a fish either (a) eats a food pellet, (b) spontaneously says
// hello to the surface. Renders as an expanding bright ring, a burst of
// droplets arcing outward, and a brief white foam patch. Reads as a splash
// without needing a true 3D camera tilt.
class SurfaceBreak {
  constructor(x, y, intensity = 'normal') {
    this.x = x; this.y = y;
    this.age = 0;
    this.life = intensity === 'gentle' ? 38 : 56; // ~0.6-1s at 60fps
    this.isGentle = intensity === 'gentle';
    const dropCount = this.isGentle ? 4 : 7;
    this.maxR = this.isGentle ? 28 : 48;
    this.droplets = [];
    for (let i = 0; i < dropCount; i++) {
      const a = (i / dropCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const spd = this.isGentle
        ? 0.8 + Math.random() * 0.8
        : 1.4 + Math.random() * 1.4;
      this.droplets.push({
        x: 0, y: 0,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: 1.2 + Math.random() * 1.6,
        life: this.life * (0.6 + Math.random() * 0.4),
      });
    }
  }
  update() {
    this.age++;
    for (const d of this.droplets) {
      d.x += d.vx;
      d.y += d.vy;
      d.vy += 0.04; // gentle settling drag (not gravity since top-down, but
                   // gives droplets a nice "falling back" arc when read as splash)
      d.vx *= 0.96;
      d.life--;
    }
  }
  draw(ctx) {
    const t = this.age / this.life;
    if (t >= 1) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Foam patch — bright flash that fades fast
    const foamAlpha = (1 - t) * (this.isGentle ? 0.35 : 0.55);
    const foamR = this.maxR * 0.55 * (0.6 + t * 0.4);
    const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, foamR);
    fg.addColorStop(0, `rgba(255, 255, 255, ${foamAlpha})`);
    fg.addColorStop(0.5, `rgba(240, 250, 252, ${foamAlpha * 0.5})`);
    fg.addColorStop(1, 'rgba(240, 250, 252, 0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(0, 0, foamR, 0, Math.PI * 2);
    ctx.fill();

    // Expanding ring — the classic splash halo
    const ringR = this.maxR * (0.15 + t * 0.9);
    const ringAlpha = (1 - t) * (this.isGentle ? 0.5 : 0.75);
    ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha})`;
    ctx.lineWidth = this.isGentle ? 1.2 : 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Second, softer ring trailing behind
    if (t > 0.2) {
      const ring2R = this.maxR * (0.05 + (t - 0.2) * 0.7);
      ctx.strokeStyle = `rgba(220, 245, 240, ${(1 - t) * 0.35})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, ring2R, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Droplets
    for (const d of this.droplets) {
      if (d.life <= 0) continue;
      const dt = d.life / this.life;
      ctx.fillStyle = `rgba(255, 255, 255, ${dt * 0.85})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  isDead() { return this.age >= this.life; }
}

// ── Food pellet: a slowly-sinking morsel dropped by long-press ──────────────
class FoodPellet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.eaten = false;
    this.age = 0;
    this.maxAge = 1200; // ~20s at 60fps
    this.bubbles = [];
    this.bubbleCooldown = 0;
  }
  update() {
    this.age++;
    // Very slow sink, slight drift
    this.y += 0.08;
    this.x += Math.sin(this.age * 0.03) * 0.12;
    // Bubble every so often as a "scent" trail
    if (--this.bubbleCooldown <= 0) {
      this.bubbles.push({ x: this.x + (Math.random() - 0.5) * 3, y: this.y, age: 0, life: 45, r: 0.8 + Math.random() * 0.6 });
      this.bubbleCooldown = 12 + Math.random() * 18;
    }
    for (const b of this.bubbles) {
      b.age++;
      b.y -= 0.3;
      b.x += Math.sin(b.age * 0.2) * 0.15;
    }
    this.bubbles = this.bubbles.filter(b => b.age < b.life);
  }
  draw(ctx) {
    // Bubbles trail
    for (const b of this.bubbles) {
      const t = 1 - b.age / b.life;
      ctx.globalAlpha = t * 0.45;
      ctx.strokeStyle = '#cfe8e0';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Pellet — warm brown-orange, small, with a tiny highlight
    const age01 = this.age / this.maxAge;
    const alpha = age01 < 0.8 ? 1 : (1 - age01) * 5;
    const r = 3.2;
    const g = ctx.createRadialGradient(this.x - 1, this.y - 1, 0, this.x, this.y, r);
    g.addColorStop(0, `rgba(255, 210, 140, ${alpha})`);
    g.addColorStop(0.5, `rgba(200, 130, 60, ${alpha})`);
    g.addColorStop(1, `rgba(110, 65, 30, ${alpha * 0.8})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  isDead() { return this.eaten || this.age >= this.maxAge; }
}

// ── Board content model ──────────────────────────────────────────────────────
// Identity-first framing (Clear + Brown + Oettingen + Gottman). Three reading
// distances: 3m identity banner · arm's-length per-person season cards ·
// tap-to-reveal practices + honest obstacle.
//
// Board-level:
//   identity   — the family declaration ("we are X"). Rarely changes. 3m read.
//   values     — exactly 3 lived values, surfaced as quiet all-caps tags.
//   anchor     — scripture/motto anchor, one line under the banner.
//   ritual     — the one sacred recurring thing the family protects.
//   season     — { label, tension }: seasonal label + honest obstacle hidden
//                behind a long-press on the banner (fades after 8 seconds).
//
// Per-person:
//   season     — one honest sentence about where they are right now (arm's length)
//   why        — why this matters (hero card, collapsible)
//   practices  — 2-4 concrete things they actually do (hero card, collapsible)
//   obstacle   — the honest tension hidden behind tap-to-reveal (nullable —
//                Ezra has none because he doesn't need one yet)
//   locked     — when true, editing the card requires a deliberate override.
//                Dayo's card is locked because it was written deliberately and
//                shouldn't be nudged casually; the others are drafts awaiting
//                input from Claire and the kids.
const DEFAULT = {
  identity: "We build each other up. We leave every room better than we found it.",
  values: ["Faithfulness", "Gratitude", "Presence"],
  anchor: {
    ref: "Joshua 24:15",
    text: "As for me and my house, we will serve the Lord.",
  },
  ritual: "Sunday table — uninterrupted, unrushed, everyone.",
  season: {
    label: "Spring 2026",
    tension: "Output comes naturally. The filling has to be protected, not hoped for.",
  },
  family: [
    {
      name: "Dayo", role: "parent", locked: true,
      season: "Filling up — more of God, present in body and mind, building things that matter.",
      why: "Because my family deserves a leader who is full, not running on empty.",
      practices: [
        "Ephesians 1:18 — pray for each person in the rotation",
        "Train for HYROX with intention — Zone 2 and the sled",
        "Build things that matter; make sure the right people understand what I'm making",
      ],
      obstacle: "Output comes naturally. The filling has to be protected, not hoped for.",
    },
    {
      name: "Claire", role: "parent", locked: false, draft: true,
      season: "Finding her feet — resting, rediscovering what's hers, flourishing slowly.",
      why: "Because a flourishing Claire is the best thing that can happen to this family.",
      practices: [
        "One thing per week that is only for her",
        "Build her own parenting language — not Dayo's system, hers",
        "Let rest be rest, not recovery for the next task",
      ],
      obstacle: "She has less runway than she looks like she has. The logistics consume it before she notices.",
    },
    {
      name: "Bella", role: "child", locked: false, draft: true,
      season: "Growing in courage — SATs, faith questions, becoming herself.",
      why: "Because this is the season where what she believes about herself starts to stick.",
      practices: [
        "Marvel marathons and The Chosen — keep watching together",
        "Let her ask the hard faith questions without rushing to answers",
        "Celebrate what she's already good at, not just what she's working on",
      ],
      obstacle: "It's easy to parent the presenting problem rather than the person underneath it.",
    },
    {
      name: "Florence", role: "child", locked: false, draft: true,
      season: "Teaching and being taught — full of ideas, learning when to lead and when to follow.",
      why: "Because she has a gift for seeing things and explaining them. The job is to develop it without rushing it.",
      practices: [
        "Morning conversations — keep them going, they're doing something real",
        "Let her teach: the younger ones, the cooking, whatever she understands",
        "Help her learn that waiting is not the same as losing",
      ],
      obstacle: "Her certainty is a gift and a trap. She needs to be heard before she'll hear.",
    },
    {
      name: "Keziah", role: "child", locked: false, draft: true,
      season: "Steady and growing — one book, one milestone, one quiet moment at a time.",
      why: "Because steadiness is a virtue that doesn't announce itself. She needs to know it's being seen.",
      practices: [
        "Read together — don't let the season get too busy for this",
        "Notice and name the small milestones",
        "Give her space to be the middle child without that meaning invisible",
      ],
      obstacle: "The quiet ones get less airtime than the loud ones. That's the bias to watch.",
    },
    {
      name: "Ezra", role: "child", locked: false, draft: true,
      season: "Present, playful, and discovering who he is.",
      why: "Because he's the youngest and the most likely to grow up fast without anyone noticing. Slow this one down.",
      practices: [
        "Floor time — actual play, no agenda",
        "He doesn't need a system yet. He needs a dad who shows up",
        "Name what you see in him, often",
      ],
      obstacle: null,
    },
  ],
};

const panel = (extra = {}) => ({
  position: 'absolute',
  background: 'rgba(8, 45, 38, 0.48)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: 18,
  color: '#dff5ef',
  cursor: 'pointer',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
  pointerEvents: 'all',
  ...extra,
});

const LABEL = {
  fontSize: 8,
  letterSpacing: '0.22em',
  color: 'rgba(190,245,230,0.5)',
  textTransform: 'uppercase',
  marginBottom: 6,
};

// Small icon-button used inside the hero panel (pencil, close, remove).
const heroIcon = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.18)',
  color: 'rgba(223,245,239,0.7)',
  width: 32, height: 32,
  borderRadius: 16,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
  flexShrink: 0,
};
const heroIconSm = { ...heroIcon, width: 26, height: 26, fontSize: 12, borderRadius: 13 };

// Collapsible section inside the hero panel.
function HeroSection({ label, open, onToggle, children }) {
  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 16,
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.03)',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: 'transparent',
          border: 'none',
          color: 'rgba(223,245,239,0.82)',
          fontFamily: 'inherit',
          fontSize: 11,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        <span>{label}</span>
        <span style={{
          transition: 'transform 240ms ease',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          fontSize: 14,
          color: 'rgba(190,245,230,0.55)',
        }}>›</span>
      </button>
      {open && (
        <div style={{
          padding: '0 18px 18px',
          animation: 'slidein 220ms ease',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Inject hero animations once (keyframes live in document head rather than
// a separate stylesheet to keep this component self-contained).
if (typeof document !== 'undefined' && !document.getElementById('vb-hero-css')) {
  const s = document.createElement('style');
  s.id = 'vb-hero-css';
  s.textContent = `
    @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
    @keyframes heropop {
      from { opacity: 0; transform: scale(0.92) translateY(12px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes slidein {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
}

// ── Main component ───────────────────────────────────────────────────────────
export default function KoiBoard() {
  const cvs = useRef(null);
  const st = useRef({
    fish: [],
    ripples: [],
    blossoms: [],
    breaks: [],
    food: [],
    cur: { x: -9999, y: -9999 },
    tick: 0,
    blossomCooldown: 400,
    // Long-press state for dropping food
    pressStart: 0,
    pressX: 0, pressY: 0,
    pressMoved: false,
    pressArmed: false,          // set true once timer fires
    pressTimer: null,
  });
  const raf = useRef(null);
  const [board, setBoard] = useState(() => {
    // Schema v2: identity-first framing. We bump the storage key because v1
    // had incompatible per-person fields (focus/how vs season/practices), so
    // attempting a merge would produce bad data. Anyone upgrading simply gets
    // the new defaults and can re-edit; the cost is small and the clarity is
    // worth more than preserving placeholder copy.
    try {
      const raw = localStorage.getItem('vb.board.v2');
      if (raw) {
        const saved = JSON.parse(raw);
        return {
          ...DEFAULT,
          ...saved,
          anchor: { ...DEFAULT.anchor, ...(saved.anchor || {}) },
          season: { ...DEFAULT.season, ...(saved.season || {}) },
          values: Array.isArray(saved.values) ? saved.values : DEFAULT.values,
          family: DEFAULT.family.map(def => {
            const match = (saved.family || []).find(f => f.name === def.name) || {};
            return {
              ...def,
              ...match,
              practices: Array.isArray(match.practices) ? match.practices : def.practices,
            };
          }),
        };
      }
    } catch {}
    return DEFAULT;
  });
  useEffect(() => {
    try { localStorage.setItem('vb.board.v2', JSON.stringify(board)); } catch {}
  }, [board]);
  const [edit, setEdit] = useState(null);
  const [val, setVal] = useState('');
  // Index of the family member currently shown as an expanded hero card, or
  // null when no one is expanded. The hero sits over the pond with a dimmed
  // backdrop and renders that person's focus + why + how.
  const [expanded, setExpanded] = useState(null);
  // Per-person which accordion sections are open inside the hero.
  // Shape: { why: bool, practices: bool, obstacle: bool }. Obstacle stays
  // closed by default — honest tension should be chosen, not stumbled into.
  const [heroOpen, setHeroOpen] = useState({ why: false, practices: true, obstacle: false });
  // Family-tension reveal (Oettingen obstacle): long-press the identity banner
  // and the hidden tension sentence fades in for 8 seconds. Ambient reminder
  // of the honest obstacle, not a passive piece of wall art.
  const [tensionShown, setTensionShown] = useState(false);
  const tensionTimer = useRef(null);
  const bannerPressRef = useRef(null);
  // Unlock modal for the locked card (Dayo). When true, the edit dialog
  // should be shown even though the card is locked.
  const [unlockPrompt, setUnlockPrompt] = useState(null); // { editKey, editVal } | null
  // ── Family card positions: percentage-of-viewport so they resize nicely ──
  // Parents sit in the upper corners pushed ~22% down so they don't fight the
  // new identity banner block at the top. Children form a bottom row.
  const FAMILY_DEFAULTS = () => {
    const out = {};
    const kids = DEFAULT.family.filter(m => m.role === 'child');
    const parents = DEFAULT.family.filter(m => m.role === 'parent');
    parents.forEach((p, i) => {
      out[p.name] = { xPct: i === 0 ? 4 : 96, yPct: 24, anchor: i === 0 ? 'tl' : 'tr' };
    });
    const pad = 4;
    const gap = (100 - pad * 2) / kids.length;
    kids.forEach((c, i) => {
      out[c.name] = { xPct: pad + gap * i + gap / 2, yPct: 92, anchor: 'bc' };
    });
    return out;
  };
  const [positions, setPositions] = useState(() => {
    // v2 — bumped because we renamed Isabella → Bella (kept as a draft stub
    // by the family); old positions keyed by "Isabella" would be orphaned.
    try {
      const raw = localStorage.getItem('vb.familyPositions.v2');
      if (raw) return { ...FAMILY_DEFAULTS(), ...JSON.parse(raw) };
    } catch {}
    return FAMILY_DEFAULTS();
  });
  useEffect(() => {
    try { localStorage.setItem('vb.familyPositions.v2', JSON.stringify(positions)); } catch {}
  }, [positions]);
  const [dragging, setDragging] = useState(null); // { name, offsetX, offsetY, moved, startX, startY }

  useEffect(() => {
    const canvas = cvs.current;
    const ctx = canvas.getContext('2d');

    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      // Fish count scales gently with screen area; minimum 7, max 11.
      // buildPondMix guarantees variety — chagoi patriarch, showa, sanke,
      // asagi etc. rather than a random clump of the same colour.
      const area = w * h;
      const count = Math.max(7, Math.min(11, Math.round(area / 220000)));
      const mix = buildPondMix(count);
      st.current.fish = mix.map(v => new SpineFish(w, h, v));
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const { fish, ripples, cur, food, breaks } = st.current;
      const env = {
        food,
        onBreak: (x, y, intensity) => {
          // Cap breaks to avoid pile-ups during feeding flurries
          if (breaks.length < 8) breaks.push(new SurfaceBreak(x, y, intensity));
        },
      };
      st.current.tick++;
      const t = st.current.tick;
      const ts = t * 0.0028; // slower caustic time than before

      // ── Water gradient ──
      // Muted, murkier teal — closer to real pond water. Pulled saturation
      // down from the previous candy-teal, deeper & cooler at the edges so
      // the pond reads as "looking into a basin".
      const bg = ctx.createRadialGradient(
        W * 0.42, H * 0.32, 0,
        W * 0.5, H * 0.55,
        Math.hypot(W, H) * 0.82
      );
      bg.addColorStop(0, '#2e8a79');
      bg.addColorStop(0.3, '#1d6a5d');
      bg.addColorStop(0.6, '#0d4b44');
      bg.addColorStop(0.85, '#052a28');
      bg.addColorStop(1, '#01191a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ── Drifting undercurrents (from your image 3 reference) ──
      // Soft, curvy, very low-opacity bezier strokes that slowly morph across
      // the pond. Gives the water a sense of flow without being literal.
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = '#1a4a44';
      ctx.lineWidth = 32;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const drift = ts * 0.08 + i * 2.1;
        const yBase = H * (0.3 + i * 0.22);
        const amp = 90 + i * 12;
        ctx.beginPath();
        ctx.moveTo(-40, yBase + Math.sin(drift) * amp * 0.5);
        ctx.bezierCurveTo(
          W * 0.25, yBase + Math.sin(drift + 1.2) * amp,
          W * 0.65, yBase + Math.cos(drift + 0.6) * amp,
          W + 40, yBase + Math.cos(drift + 2.1) * amp * 0.5
        );
        ctx.stroke();
      }
      // A lighter, brighter flow line on top for the "surface current" look
      ctx.globalAlpha = 0.05;
      ctx.strokeStyle = '#78d4c1';
      ctx.lineWidth = 14;
      for (let i = 0; i < 2; i++) {
        const drift = ts * 0.06 + i * 3.3;
        const yBase = H * (0.4 + i * 0.3);
        const amp = 70 + i * 20;
        ctx.beginPath();
        ctx.moveTo(-40, yBase + Math.sin(drift + 1) * amp * 0.6);
        ctx.bezierCurveTo(
          W * 0.3, yBase + Math.cos(drift + 0.4) * amp,
          W * 0.7, yBase + Math.sin(drift + 1.8) * amp,
          W + 40, yBase + Math.cos(drift + 2.4) * amp * 0.6
        );
        ctx.stroke();
      }
      ctx.restore();

      // ── Pad floor-shadows (cast on the pond floor, before lighting) ──
      PADS.forEach(p => drawPadShadow(ctx, p.rx * W, p.ry * H, p.r, p.rot, t, p.phase));

      // ── God rays: 3 soft diagonal light columns drifting from top-left ──
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const driftX = Math.sin(ts * 0.05 + i * 2.1) * W * 0.18;
        const cx1 = W * (-0.1 + i * 0.35) + driftX;
        const cy1 = -40;
        const cx2 = cx1 + W * 0.55;
        const cy2 = H + 60;
        const rg = ctx.createLinearGradient(cx1, cy1, cx2, cy2);
        rg.addColorStop(0, 'rgba(255, 252, 230, 0.00)');
        rg.addColorStop(0.35, 'rgba(255, 250, 220, 0.045)');
        rg.addColorStop(0.6, 'rgba(255, 250, 220, 0.035)');
        rg.addColorStop(1, 'rgba(255, 250, 220, 0.00)');
        ctx.fillStyle = rg;
        ctx.save();
        ctx.translate((cx1 + cx2) / 2, (cy1 + cy2) / 2);
        const ang = Math.atan2(cy2 - cy1, cx2 - cx1);
        ctx.rotate(ang);
        const len = Math.hypot(cx2 - cx1, cy2 - cy1);
        ctx.fillRect(-len / 2, -90, len, 180);
        ctx.restore();
      }
      ctx.restore();

      // ── Caustic interference mesh (proper "light on water") ──
      // Many small bright points, positions driven by two sine fields at
      // different frequencies. Rendered additively so overlaps become
      // genuine bright spots — that shimmering surface pattern.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const NUM_CAUSTICS = 64;
      for (let i = 0; i < NUM_CAUSTICS; i++) {
        const a = i * 0.7853981; // golden-ish angle for even spread
        const baseX = (Math.sin(a * 1.3 + i * 0.41) * 0.5 + 0.5) * W;
        const baseY = (Math.cos(a * 1.7 + i * 0.29) * 0.5 + 0.5) * H;
        const wob = 42;
        const cx = baseX + Math.sin(ts * 0.7 + i * 1.31) * wob
                       + Math.cos(ts * 0.31 + i * 0.77) * wob * 0.6;
        const cy = baseY + Math.cos(ts * 0.63 + i * 1.07) * wob
                       + Math.sin(ts * 0.27 + i * 0.93) * wob * 0.6;
        const flicker = (Math.sin(ts * 1.4 + i * 2.3) * 0.5 + 0.5);
        const alpha = 0.06 + flicker * 0.10;
        const size = 22 + flicker * 14;
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
        cg.addColorStop(0, `rgba(220, 255, 240, ${alpha})`);
        cg.addColorStop(0.5, `rgba(180, 240, 220, ${alpha * 0.4})`);
        cg.addColorStop(1, 'rgba(180, 240, 220, 0)');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(cx, cy, size, 0, Math.PI * 2);
        ctx.fill();
      }
      // A few tiny bright pinpoints on top for that "surface sparkle" glint
      for (let i = 0; i < 18; i++) {
        const sx = (Math.sin(i * 3.73 + ts * 0.4) * 0.5 + 0.5) * W;
        const sy = (Math.cos(i * 5.17 + ts * 0.35) * 0.5 + 0.5) * H;
        const sa = (Math.sin(i + ts * 1.1) * 0.5 + 0.5);
        if (sa < 0.5) continue; // only the brightest ones appear
        ctx.globalAlpha = (sa - 0.5) * 0.6;
        ctx.fillStyle = '#fff';
        ctx.fillRect(sx - 0.75, sy - 0.75, 1.5, 1.5);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // ── Food pellets (rendered before fish so fish visually overlap them) ──
      st.current.food = food.filter(f => !f.isDead());
      for (const p of st.current.food) { p.update(); p.draw(ctx); }

      // ── Fish (below lily pads, above food) ──
      for (const f of fish) {
        f.update(W, H, cur, env);
        f.draw(ctx);
      }

      // ── Surface breaks (splash above fish) ──
      st.current.breaks = breaks.filter(b => !b.isDead());
      st.current.breaks.forEach(b => { b.update(); b.draw(ctx); });

      // ── Ripples ──
      st.current.ripples = ripples.filter(r => !r.isDead());
      st.current.ripples.forEach(r => { r.update(); r.draw(ctx); });

      // ── Long-press indicator ──
      // While the user holds, a pulsing ring fills up to show that food will
      // drop on release. Crosses a clear threshold (white → warm-gold glow)
      // at the armed moment for tactile feedback.
      if (st.current.pressStart > 0 && !st.current.pressMoved) {
        const held = performance.now() - st.current.pressStart;
        const LP_MS = 450;
        const progress = Math.min(1, held / LP_MS);
        const armed = progress >= 1;
        ctx.save();
        ctx.translate(st.current.pressX, st.current.pressY);
        const pulse = Math.sin(t * 0.35) * 0.5 + 0.5;
        // Outer ring — fills with progress
        ctx.strokeStyle = armed
          ? `rgba(255, 222, 150, ${0.85 - pulse * 0.2})`
          : 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = armed ? 2 : 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, 16, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.stroke();
        // Tiny centre dot
        ctx.fillStyle = armed
          ? `rgba(255, 220, 140, ${0.9})`
          : 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, armed ? 2.6 + pulse * 0.6 : 1.8, 0, Math.PI * 2);
        ctx.fill();
        // Glow halo when armed
        if (armed) {
          const hg = ctx.createRadialGradient(0, 0, 0, 0, 0, 26);
          hg.addColorStop(0, `rgba(255, 220, 140, ${0.3 - pulse * 0.15})`);
          hg.addColorStop(1, 'rgba(255, 220, 140, 0)');
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.arc(0, 0, 26, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // ── Drifting blossom (occasional) ──
      if (st.current.blossomCooldown <= 0 && st.current.blossoms.length < 2) {
        st.current.blossoms.push(new Blossom(W, H));
        st.current.blossomCooldown = 1100 + Math.random() * 900; // ~18–33s @ 60fps
      }
      st.current.blossomCooldown--;
      st.current.blossoms = st.current.blossoms.filter(b => !b.isOffscreen(W));
      for (const b of st.current.blossoms) { b.update(); b.draw(ctx); }

      // ── Lily pads on top ──
      PADS.forEach(p => drawPad(ctx, p, W, H, t));

      // ── Edge vignette: the key "submerged" cue ──
      // Transparent centre → dark edges. Tells the eye the scene curves away
      // into depth, like you're looking down into a basin of water.
      const vg = ctx.createRadialGradient(
        W * 0.5, H * 0.55, Math.min(W, H) * 0.28,
        W * 0.5, H * 0.55, Math.hypot(W, H) * 0.62
      );
      vg.addColorStop(0, 'rgba(0, 20, 18, 0)');
      vg.addColorStop(0.55, 'rgba(0, 20, 18, 0.18)');
      vg.addColorStop(1, 'rgba(0, 15, 14, 0.55)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      // ── Surface shimmer: a slow, wide horizontal bright band in the top
      // third of the canvas that modulates softly, suggesting a rippling
      // water surface above you.
      const shimmerY = H * 0.18 + Math.sin(ts * 0.2) * 14;
      const shimmerG = ctx.createLinearGradient(0, shimmerY - 60, 0, shimmerY + 80);
      const shimmerA = 0.04 + (Math.sin(ts * 0.5) * 0.5 + 0.5) * 0.04;
      shimmerG.addColorStop(0, 'rgba(220, 255, 240, 0)');
      shimmerG.addColorStop(0.5, `rgba(220, 255, 240, ${shimmerA})`);
      shimmerG.addColorStop(1, 'rgba(220, 255, 240, 0)');
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = shimmerG;
      ctx.fillRect(0, shimmerY - 60, W, 140);
      ctx.restore();

      raf.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ── Pointer interaction ──
  // Unified mouse + touch via pointer events:
  //   - Move → updates fish-flee cursor
  //   - Quick tap (<450ms, no drag) → ripple
  //   - Hold ≥450ms without moving → drops a food pellet at the press point
  //   - Drag (moves >6px while held) → cancels long-press, leaves a small ripple
  const LONG_PRESS_MS = 450;
  const PRESS_MOVE_THRESHOLD = 6;

  const onPointerDown = useCallback(e => {
    // Only the canvas should capture these; cards above will handle their own
    if (e.target !== cvs.current) return;
    const r = cvs.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    st.current.pressStart = performance.now();
    st.current.pressX = x;
    st.current.pressY = y;
    st.current.pressMoved = false;
    st.current.cur = { x, y };
    try { cvs.current.setPointerCapture(e.pointerId); } catch {}
  }, []);

  const onPointerMove = useCallback(e => {
    const r = cvs.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    st.current.cur = { x, y };
    if (st.current.pressStart > 0 && !st.current.pressMoved) {
      const dx = x - st.current.pressX;
      const dy = y - st.current.pressY;
      if (Math.hypot(dx, dy) > PRESS_MOVE_THRESHOLD) {
        st.current.pressMoved = true;
      }
    }
  }, []);

  const onPointerUp = useCallback(e => {
    const r = cvs.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (st.current.pressStart > 0) {
      const held = performance.now() - st.current.pressStart;
      const moved = st.current.pressMoved;
      if (held >= LONG_PRESS_MS && !moved) {
        // Long-press: drop food at the press origin, max 3 pellets at a time
        if (st.current.food.length < 3) {
          st.current.food.push(new FoodPellet(st.current.pressX, st.current.pressY));
        }
      } else if (!moved) {
        st.current.ripples.push(new Ripple(x, y));
      }
    }
    st.current.pressStart = 0;
    st.current.pressMoved = false;
    try { cvs.current.releasePointerCapture(e.pointerId); } catch {}
  }, []);

  const onPointerLeave = useCallback(() => {
    st.current.cur = { x: -9999, y: -9999 };
    st.current.pressStart = 0;
    st.current.pressMoved = false;
  }, []);

  // Dispatch a save based on the edit key prefix. Board-level keys update
  // flat fields; family-level keys (f…-pi[-hi]) update per-person fields.
  const save = () => {
    if (edit === 'identity')         setBoard(b => ({ ...b, identity: val }));
    else if (edit === 'ritual')      setBoard(b => ({ ...b, ritual: val }));
    else if (edit === 'season-label')setBoard(b => ({ ...b, season: { ...b.season, label: val } }));
    else if (edit === 'tension')     setBoard(b => ({ ...b, season: { ...b.season, tension: val } }));
    else if (edit === 'anchor') {
      // Anchor editor takes "text\n— ref" as convention; split gracefully.
      const m = val.match(/^([\s\S]*?)\s*(?:[—-])\s*([^\n—-]+)\s*$/m);
      const text = m ? m[1].trim() : val.trim();
      const ref  = m ? m[2].trim() : '';
      setBoard(b => ({ ...b, anchor: { text, ref } }));
    }
    else if (edit?.startsWith('value-')) {
      const i = +edit.slice(6);
      setBoard(b => {
        const values = [...b.values]; values[i] = val;
        return { ...b, values };
      });
    }
    else if (edit?.startsWith('fseason-')) {
      const i = +edit.slice(8);
      setBoard(b => { const f = [...b.family]; f[i] = { ...f[i], season: val }; return { ...b, family: f }; });
    }
    else if (edit?.startsWith('fwhy-')) {
      const i = +edit.slice(5);
      setBoard(b => { const f = [...b.family]; f[i] = { ...f[i], why: val }; return { ...b, family: f }; });
    }
    else if (edit?.startsWith('fprac-')) {
      const [, pi, hi] = edit.split('-').map((p, idx) => idx === 0 ? p : Number(p));
      setBoard(b => {
        const f = [...b.family];
        const practices = [...(f[pi].practices || [])];
        practices[hi] = val;
        f[pi] = { ...f[pi], practices };
        return { ...b, family: f };
      });
    }
    else if (edit?.startsWith('fobs-')) {
      const i = +edit.slice(5);
      setBoard(b => { const f = [...b.family]; f[i] = { ...f[i], obstacle: val }; return { ...b, family: f }; });
    }
    setEdit(null);
  };

  const open = (key, cur) => { setEdit(key); setVal(cur); };

  // Lock guard: if a person is `locked`, opening their edit dialog first
  // shows an unlock confirmation. Used for Dayo's deliberately-written card
  // so the family doesn't nudge it by accident when walking past.
  const tryEdit = (member, key, cur) => {
    if (member?.locked) setUnlockPrompt({ key, val: cur });
    else open(key, cur);
  };

  const addTactic = (pi) => {
    setBoard(b => {
      const f = [...b.family];
      const practices = [...(f[pi].practices || []), ''];
      f[pi] = { ...f[pi], practices };
      return { ...b, family: f };
    });
    // Open the new practice for editing immediately (its index is the
    // pre-update length, captured from the `board` closure).
    setTimeout(() => {
      const hi = (board.family[pi].practices || []).length;
      open(`fprac-${pi}-${hi}`, '');
    }, 0);
  };

  const removeTactic = (pi, hi) => {
    setBoard(b => {
      const f = [...b.family];
      const practices = (f[pi].practices || []).filter((_, i) => i !== hi);
      f[pi] = { ...f[pi], practices };
      return { ...b, family: f };
    });
  };

  // Close hero on Escape for keyboard users.
  useEffect(() => {
    if (expanded === null) return;
    const onKey = (e) => { if (e.key === 'Escape') setExpanded(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        fontFamily:
          "'Palatino Linotype', Palatino, 'Cormorant Garamond', 'Book Antiqua', Georgia, serif",
      }}
    >
      <canvas
        ref={cvs}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'crosshair',
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
      />

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* ── Season label (top-right, understated) ── */}
        <div style={{
          position: 'absolute',
          top: 22, right: 26,
          fontSize: 10,
          letterSpacing: '0.32em',
          color: 'rgba(190,245,230,0.55)',
          textTransform: 'uppercase',
          pointerEvents: 'all',
          cursor: 'pointer',
        }} onClick={() => open('season-label', board.season.label)}>
          {board.season.label}
        </div>

        {/* ── Identity banner block ── */}
        {/* 3m-read centrepiece: typographic, no chrome, no edit affordance on
            the surface. Long-press reveals the honest family tension for 8s.
            Double-tap opens the edit dialog for the identity sentence itself. */}
        <div style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(820px, 70%)',
          textAlign: 'center',
          pointerEvents: 'all',
          userSelect: 'none',
          cursor: 'pointer',
          touchAction: 'none',
        }}
        onPointerDown={(e) => {
          bannerPressRef.current = {
            t: Date.now(),
            id: setTimeout(() => {
              setTensionShown(true);
              if (tensionTimer.current) clearTimeout(tensionTimer.current);
              tensionTimer.current = setTimeout(() => setTensionShown(false), 8000);
            }, 520),
          };
        }}
        onPointerUp={(e) => {
          const press = bannerPressRef.current;
          if (!press) return;
          const held = Date.now() - press.t;
          clearTimeout(press.id);
          bannerPressRef.current = null;
          if (held < 520) {
            // Short tap → edit the identity sentence.
            open('identity', board.identity);
          }
        }}
        onPointerLeave={() => {
          if (bannerPressRef.current) {
            clearTimeout(bannerPressRef.current.id);
            bannerPressRef.current = null;
          }
        }}
        >
          <div style={{
            fontSize: 'clamp(22px, 2.6vw, 36px)',
            lineHeight: 1.28,
            fontStyle: 'italic',
            color: '#f4fcf7',
            letterSpacing: '0.005em',
            textShadow: '0 2px 12px rgba(0,0,0,0.35)',
          }}>
            {board.identity}
          </div>

          {/* Values — three quiet tags */}
          <div style={{
            marginTop: 16,
            display: 'flex',
            gap: 22,
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            {board.values.map((v, i) => (
              <span
                key={i}
                onClick={(e) => { e.stopPropagation(); open(`value-${i}`, v); }}
                style={{
                  fontSize: 10,
                  letterSpacing: '0.36em',
                  textTransform: 'uppercase',
                  color: 'rgba(190,245,230,0.78)',
                  cursor: 'pointer',
                }}
              >
                {v}
                {i < board.values.length - 1 && (
                  <span style={{ marginLeft: 22, color: 'rgba(190,245,230,0.28)' }}>·</span>
                )}
              </span>
            ))}
          </div>

          {/* Scripture anchor — quiet, single line */}
          <div style={{
            marginTop: 18,
            fontSize: 13,
            fontStyle: 'italic',
            color: 'rgba(223,245,239,0.68)',
            lineHeight: 1.45,
            cursor: 'pointer',
          }}
          onClick={(e) => { e.stopPropagation(); open('anchor', `${board.anchor.text}\n— ${board.anchor.ref}`); }}>
            “{board.anchor.text}”
            <span style={{ color: 'rgba(190,245,230,0.42)', marginLeft: 8 }}>
              — {board.anchor.ref}
            </span>
          </div>

          {/* Ritual — the one protected recurring thing */}
          <div style={{
            marginTop: 10,
            fontSize: 12,
            color: 'rgba(190,245,230,0.5)',
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
          onClick={(e) => { e.stopPropagation(); open('ritual', board.ritual); }}>
            {board.ritual}
          </div>

          {/* Honest tension — fades in on long-press, out after 8s. The
              typographic silence when it's hidden is the point: the tension
              should be chosen, not stumbled into. Single-tap-while-visible
              opens the edit dialog for it. */}
          <div style={{
            marginTop: 18,
            minHeight: 48,
            fontSize: 12,
            fontStyle: 'italic',
            color: 'rgba(255, 210, 190, 0.82)',
            opacity: tensionShown ? 1 : 0,
            transition: 'opacity 560ms ease',
            letterSpacing: '0.02em',
            lineHeight: 1.55,
            padding: '0 16px',
            pointerEvents: tensionShown ? 'all' : 'none',
          }}
          onClick={(e) => { if (tensionShown) { e.stopPropagation(); open('tension', board.season.tension); } }}
          >
            {tensionShown && board.season.tension}
          </div>
        </div>

        {board.family.map((m) => {
          const idx = board.family.indexOf(m);
          const pos = positions[m.name] || { xPct: 50, yPct: 50, anchor: 'c' };
          const isParent = m.role === 'parent';
          const isDraggingMe = dragging && dragging.name === m.name;
          // anchor: how the card is positioned relative to (xPct, yPct)
          //   'tl' → top-left at (xPct,yPct)
          //   'tr' → top-right at (xPct,yPct)
          //   'bc' → bottom-centre at (xPct,yPct)
          //   'c'  → centred at (xPct,yPct)  (used after a drag)
          const styleByAnchor = (a) => {
            switch (a) {
              case 'tl': return { left: `${pos.xPct}%`, top: `${pos.yPct}%` };
              case 'tr': return { right: `${100 - pos.xPct}%`, top: `${pos.yPct}%` };
              case 'bc': return {
                left: `${pos.xPct}%`,
                bottom: `${100 - pos.yPct}%`,
                transform: 'translateX(-50%)',
              };
              case 'c':
              default:   return {
                left: `${pos.xPct}%`,
                top: `${pos.yPct}%`,
                transform: 'translate(-50%,-50%)',
              };
            }
          };
          return (
            <div
              key={`family-${idx}`}
              style={panel({
                ...styleByAnchor(pos.anchor),
                padding: isParent ? '12px 16px' : '10px 14px',
                minWidth: isParent ? 152 : 128,
                textAlign: pos.anchor === 'bc' ? 'center' : 'left',
                cursor: isDraggingMe ? 'grabbing' : 'grab',
                userSelect: 'none',
                touchAction: 'none',
                zIndex: isDraggingMe ? 40 : 10,
                boxShadow: isDraggingMe
                  ? '0 16px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)'
                  : '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                transition: isDraggingMe ? 'none' : 'box-shadow 240ms ease',
              })}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture?.(e.pointerId);
                setDragging({
                  name: m.name,
                  startX: e.clientX,
                  startY: e.clientY,
                  moved: false,
                  pointerId: e.pointerId,
                });
              }}
              onPointerMove={(e) => {
                if (!dragging || dragging.name !== m.name) return;
                const dx = e.clientX - dragging.startX;
                const dy = e.clientY - dragging.startY;
                const dist = Math.hypot(dx, dy);
                if (dist > 6 || dragging.moved) {
                  // Transition to live-drag: set absolute (centred) position
                  const vw = window.innerWidth;
                  const vh = window.innerHeight;
                  const xPct = Math.max(2, Math.min(98, (e.clientX / vw) * 100));
                  const yPct = Math.max(2, Math.min(98, (e.clientY / vh) * 100));
                  setPositions((p) => ({
                    ...p,
                    [m.name]: { xPct, yPct, anchor: 'c' },
                  }));
                  if (!dragging.moved) setDragging({ ...dragging, moved: true });
                }
              }}
              onPointerUp={(e) => {
                try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch {}
                const wasClick = dragging && !dragging.moved;
                setDragging(null);
                if (wasClick) {
                  // Tap a card → open the expanded hero panel (why + how).
                  // Focus can still be edited from the pencil inside the hero.
                  setHeroOpen({ why: false, how: true });
                  setExpanded(idx);
                }
              }}
              onPointerCancel={() => setDragging(null)}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: isParent ? 4 : 3,
              }}>
                <div style={{
                  fontSize: isParent ? 13 : 12,
                  fontWeight: 'bold',
                  color: 'rgba(190,245,230,0.92)',
                  letterSpacing: '0.05em',
                }}>
                  {m.name}
                </div>
                {/* Status hints: padlock = locked (deliberate, don't nudge),
                    open circle = draft (awaiting input from the person). */}
                {m.locked && (
                  <span title="Locked — written deliberately" style={{
                    fontSize: 9, color: 'rgba(190,245,230,0.55)',
                  }}>🔒</span>
                )}
                {m.draft && !m.locked && (
                  <span title="Draft — needs input from them" style={{
                    fontSize: 9, color: 'rgba(255, 210, 190, 0.6)',
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                  }}>draft</span>
                )}
              </div>
              <div style={{
                fontSize: isParent ? 12 : 11,
                fontStyle: 'italic',
                color: 'rgba(223,245,239,0.72)',
                lineHeight: 1.4,
              }}>
                {m.season}
              </div>
            </div>
          );
        })}

        <div style={{
          position: 'absolute',
          bottom: 12,
          right: 16,
          fontSize: 9.5,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.12em',
          pointerEvents: 'all',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}>
          <span>tap card for vision · drag to move · hold banner for the honest bit · hold pond to feed</span>
          <button
            onClick={() => setPositions(FAMILY_DEFAULTS())}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.18)',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 9,
              letterSpacing: '0.12em',
              padding: '4px 10px',
              borderRadius: 10,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textTransform: 'uppercase',
            }}
            title="Reset family card positions"
          >
            reset layout
          </button>
        </div>
      </div>

      {expanded !== null && board.family[expanded] && (() => {
        const m = board.family[expanded];
        const pi = expanded;
        return (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(3, 22, 20, 0.62)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 80,
              animation: 'fadein 240ms ease',
              padding: 24,
            }}
            onClick={() => setExpanded(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(760px, 92vw)',
                maxHeight: '88vh',
                overflowY: 'auto',
                background: 'rgba(10, 52, 46, 0.58)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 28,
                padding: '36px 44px 40px',
                color: '#dff5ef',
                boxShadow: '0 32px 96px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)',
                fontFamily: "'Palatino Linotype', Palatino, Georgia, serif",
                animation: 'heropop 280ms cubic-bezier(0.2, 0.9, 0.25, 1)',
              }}
            >
              {/* Header: role eyebrow + name + lock/draft badge + close */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
                <div>
                  <div style={{
                    fontSize: 10,
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color: 'rgba(190,245,230,0.48)',
                    marginBottom: 6,
                  }}>
                    {m.role === 'parent' ? 'Parent' : 'Child'} · Vision
                    {m.locked && <span style={{ marginLeft: 10 }}>· Locked</span>}
                    {m.draft && !m.locked && <span style={{ marginLeft: 10, color: 'rgba(255, 210, 190, 0.7)' }}>· Draft</span>}
                  </div>
                  <div style={{
                    fontSize: 34,
                    letterSpacing: '0.02em',
                    lineHeight: 1.05,
                    color: '#f2fbf7',
                  }}>
                    {m.name}
                  </div>
                </div>
                <button
                  onClick={() => setExpanded(null)}
                  aria-label="Close"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.22)',
                    color: 'rgba(223,245,239,0.7)',
                    width: 38, height: 38,
                    borderRadius: 19,
                    fontSize: 16,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  ×
                </button>
              </div>

              {/* Season — always visible, editable via pencil (with lock guard) */}
              <div style={{ marginTop: 22, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 10,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: 'rgba(190,245,230,0.44)',
                    marginBottom: 8,
                  }}>
                    Season
                  </div>
                  <div style={{
                    fontSize: 24,
                    fontStyle: 'italic',
                    lineHeight: 1.35,
                    color: '#eaf9f3',
                  }}>
                    {m.season || <span style={{ opacity: 0.4 }}>Add a one-sentence season for this person…</span>}
                  </div>
                </div>
                <button
                  onClick={() => tryEdit(m, `fseason-${pi}`, m.season || '')}
                  title="Edit season"
                  style={heroIcon}
                >
                  ✎
                </button>
              </div>

              {/* Collapsible sections: Why + Practices + Obstacle */}
              <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <HeroSection
                  label="Why"
                  open={heroOpen.why}
                  onToggle={() => setHeroOpen(s => ({ ...s, why: !s.why }))}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      flex: 1,
                      fontSize: 16,
                      fontStyle: 'italic',
                      lineHeight: 1.55,
                      color: 'rgba(235,250,244,0.86)',
                    }}>
                      {m.why || <span style={{ opacity: 0.4 }}>Add the reason this matters…</span>}
                    </div>
                    <button
                      onClick={() => tryEdit(m, `fwhy-${pi}`, m.why || '')}
                      title="Edit why"
                      style={heroIcon}
                    >✎</button>
                  </div>
                </HeroSection>

                <HeroSection
                  label={`Practices · ${(m.practices || []).length}`}
                  open={heroOpen.practices}
                  onToggle={() => setHeroOpen(s => ({ ...s, practices: !s.practices }))}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(m.practices || []).length === 0 && (
                      <div style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(223,245,239,0.4)' }}>
                        No practices yet.
                      </div>
                    )}
                    {(m.practices || []).map((h, hi) => (
                      <div key={hi} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: 'rgba(190,245,230,0.55)',
                          flexShrink: 0,
                        }} />
                        <div style={{
                          flex: 1,
                          fontSize: 15,
                          lineHeight: 1.45,
                          color: 'rgba(235,250,244,0.88)',
                        }}>
                          {h || <span style={{ opacity: 0.4 }}>Empty — tap edit to fill in</span>}
                        </div>
                        <button onClick={() => tryEdit(m, `fprac-${pi}-${hi}`, h)} title="Edit practice" style={heroIconSm}>✎</button>
                        <button onClick={() => !m.locked && removeTactic(pi, hi)} disabled={m.locked} title={m.locked ? 'Locked' : 'Remove'} style={{ ...heroIconSm, opacity: m.locked ? 0.35 : 1, cursor: m.locked ? 'not-allowed' : 'pointer' }}>×</button>
                      </div>
                    ))}
                    <button
                      onClick={() => !m.locked && addTactic(pi)}
                      disabled={m.locked}
                      style={{
                        marginTop: 4,
                        padding: '10px 14px',
                        borderRadius: 12,
                        border: '1px dashed rgba(255,255,255,0.22)',
                        background: 'transparent',
                        color: m.locked ? 'rgba(190,245,230,0.3)' : 'rgba(190,245,230,0.7)',
                        fontSize: 13,
                        fontFamily: 'inherit',
                        letterSpacing: '0.08em',
                        cursor: m.locked ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      + add practice
                    </button>
                  </div>
                </HeroSection>

                {/* Obstacle — collapsed by default (tap-to-reveal). Warm-tinted
                    so it visually signals "this is the hard truth, not the
                    happy part". Ezra's card intentionally has no obstacle. */}
                <HeroSection
                  label="Honest obstacle"
                  open={heroOpen.obstacle}
                  onToggle={() => setHeroOpen(s => ({ ...s, obstacle: !s.obstacle }))}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      flex: 1,
                      fontSize: 15,
                      fontStyle: 'italic',
                      lineHeight: 1.55,
                      color: 'rgba(255, 210, 190, 0.88)',
                    }}>
                      {m.obstacle || <span style={{ opacity: 0.45 }}>Add the honest tension underneath this season…</span>}
                    </div>
                    <button
                      onClick={() => tryEdit(m, `fobs-${pi}`, m.obstacle || '')}
                      title="Edit obstacle"
                      style={heroIcon}
                    >✎</button>
                  </div>
                </HeroSection>
              </div>

              <div style={{
                marginTop: 26,
                fontSize: 10,
                letterSpacing: '0.16em',
                color: 'rgba(255,255,255,0.3)',
                textAlign: 'center',
                textTransform: 'uppercase',
              }}>
                tap outside or press esc to close
              </div>
            </div>
          </div>
        );
      })()}

      {edit && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.52)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99,
          }}
          onClick={() => setEdit(null)}
        >
          <div
            style={{
              background: 'rgba(10, 50, 44, 0.96)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 22,
              padding: 28,
              minWidth: 310,
              color: '#dff5ef',
              fontFamily: "'Palatino Linotype', Palatino, Georgia, serif",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              fontSize: 9,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(190,245,230,0.45)',
              marginBottom: 14,
            }}>
              Edit {(() => {
                if (edit === 'identity') return 'Family Identity';
                if (edit === 'anchor') return 'Scripture Anchor';
                if (edit === 'ritual') return 'Family Ritual';
                if (edit === 'season-label') return 'Season Label';
                if (edit === 'tension') return 'Family Tension';
                if (edit?.startsWith('value-')) return `Value ${+edit.slice(6) + 1}`;
                if (edit?.startsWith('fseason-')) return `${board.family[+edit.slice(8)]?.name} · Season`;
                if (edit?.startsWith('fwhy-')) return `${board.family[+edit.slice(5)]?.name} · Why`;
                if (edit?.startsWith('fobs-')) return `${board.family[+edit.slice(5)]?.name} · Honest obstacle`;
                if (edit?.startsWith('fprac-')) {
                  const parts = edit.split('-');
                  const pi = Number(parts[1]);
                  const hi = Number(parts[2]);
                  return `${board.family[pi]?.name} · Practice ${hi + 1}`;
                }
                return '';
              })()}
            </div>
            <textarea
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  save();
                }
              }}
              autoFocus
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.07)',
                color: '#dff5ef',
                fontSize: 14,
                fontFamily: "'Palatino Linotype', Palatino, Georgia, serif",
                fontStyle: 'italic',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button
                onClick={save}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 11,
                  border: 'none',
                  background: 'rgba(62, 185, 155, 0.35)',
                  color: '#dff5ef',
                  fontSize: 13,
                  fontFamily: "'Palatino Linotype', Palatino, Georgia, serif",
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                }}
              >
                Save
              </button>
              <button
                onClick={() => setEdit(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 11,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'transparent',
                  color: 'rgba(223,245,239,0.6)',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: "'Palatino Linotype', Palatino, Georgia, serif",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock confirmation — gates edits on a locked card. Small friction
          on purpose: this is what stops someone absent-mindedly rewriting
          the deliberate card while looking up a shopping list. */}
      {unlockPrompt && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setUnlockPrompt(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(14, 40, 36, 0.98)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 210, 190, 0.32)',
              borderRadius: 22,
              padding: 28,
              minWidth: 340,
              maxWidth: 420,
              color: '#dff5ef',
              fontFamily: "'Palatino Linotype', Palatino, Georgia, serif",
            }}
          >
            <div style={{
              fontSize: 9,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'rgba(255, 210, 190, 0.7)',
              marginBottom: 10,
            }}>
              Locked card
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.55, fontStyle: 'italic', color: 'rgba(235,250,244,0.9)' }}>
              This card was written deliberately. Editing it changes the
              reference — are you sure?
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <button
                onClick={() => {
                  const k = unlockPrompt.key; const v = unlockPrompt.val;
                  setUnlockPrompt(null);
                  open(k, v);
                }}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 11,
                  border: 'none',
                  background: 'rgba(220, 130, 100, 0.4)',
                  color: '#fff2ea',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                }}
              >
                Edit anyway
              </button>
              <button
                onClick={() => setUnlockPrompt(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 11,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'transparent',
                  color: 'rgba(223,245,239,0.6)',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Keep locked
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
