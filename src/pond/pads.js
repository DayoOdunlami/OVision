// ═══════════════════════════════════════════════════════════════════
// pads.js — lily pads + drifting blossoms + ripples + surface breaks.
// Extracted verbatim from KoiBoard.jsx (minor renames) so both boards
// can share them. The painting logic is frame-tick driven to match
// the rest of the pond animation clock.
// ═══════════════════════════════════════════════════════════════════

// ── Shared pad motion ───────────────────────────────────────────────
// `t` is the frame counter (st.current.tick), not milliseconds.
// Coefficients are frame-based: 0.02 * 60fps ≈ 1.2 rad/s → ~5s period.
function padMotion(t, phase) {
  const bob =
    Math.sin(t * 0.020 + phase) * 4.5 +
    Math.sin(t * 0.048 + phase * 1.7) * 1.4;
  const drift =
    Math.sin(t * 0.013 + phase * 0.8) * 5.5 +
    Math.cos(t * 0.032 + phase) * 1.6;
  const sway =
    Math.sin(t * 0.016 + phase) * 0.08 +
    Math.sin(t * 0.036 + phase * 2.1) * 0.035;
  return { bob, drift, sway };
}

export function drawPadShadow(ctx, x, y, r, rot, t, phase) {
  const { bob, drift, sway } = padMotion(t, phase);
  ctx.save();
  ctx.translate(x + 6 + drift * 0.75, y + bob * 0.9 + 14);
  ctx.rotate(rot + sway);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#140800';
  ctx.beginPath();
  const steps = 36;
  const notch = 0.35;
  for (let i = 0; i <= steps; i++) {
    const a = notch + (i / steps) * (Math.PI * 2 - notch * 2);
    const rr = r * (1.03 + Math.sin(a * 3 + phase) * 0.03);
    if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else         ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.filter = 'blur(8px)';
  ctx.fill();
  ctx.filter = 'none';
  ctx.restore();
}

export function drawPad(ctx, pad, W, H, t) {
  const x = pad.rx * W;
  const y = pad.ry * H;
  const r = pad.r;
  const rot = pad.rot;
  const phase = pad.phase;
  const { bob, drift, sway } = padMotion(t, phase);

  ctx.save();
  ctx.translate(x + drift, y + bob);
  ctx.rotate(rot + sway);

  const grad = ctx.createRadialGradient(-r * 0.28, -r * 0.32, r * 0.08, 0, 0, r);
  grad.addColorStop(0,   '#c8ed9e');
  grad.addColorStop(0.5, '#7ab86a');
  grad.addColorStop(1,   '#2d5a31');

  ctx.beginPath();
  const steps = 44;
  const notch = 0.35;
  for (let i = 0; i <= steps; i++) {
    const a = notch + (i / steps) * (Math.PI * 2 - notch * 2);
    const rr = r * (
      1 +
      Math.sin(a * 4 + phase * 1.7) * 0.025 +
      Math.sin(a * 7 + phase) * 0.015
    );
    if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else         ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.92;
  ctx.fill();

  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#1a3c23';
  ctx.lineWidth = 1.2;
  ctx.stroke();

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

  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#eaffc9';
  ctx.beginPath();
  ctx.ellipse(-r * 0.25, -r * 0.32, r * 0.55, r * 0.22, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = 'rgba(230, 255, 200, 0.75)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.96, Math.PI * 1.1, Math.PI * 1.85);
  ctx.stroke();

  if (pad.droplets) {
    ctx.globalAlpha = 0.85;
    pad.droplets.forEach((d) => {
      const dx = d.x * r;
      const dy = d.y * r;
      const dr = d.r;
      const dg = ctx.createRadialGradient(dx - dr * 0.3, dy - dr * 0.3, 0, dx, dy, dr);
      dg.addColorStop(0,   'rgba(255, 255, 255, 0.9)');
      dg.addColorStop(0.5, 'rgba(200, 230, 210, 0.5)');
      dg.addColorStop(1,   'rgba(40, 70, 50, 0.25)');
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(dx, dy, dr, 0, Math.PI * 2);
      ctx.fill();
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

  if (pad.lotus) {
    drawLotus(ctx, x + drift + pad.lotus.ox, y + bob + pad.lotus.oy, pad.lotus.size, t, phase);
  }
}

function drawLotus(ctx, x, y, size, t, phase) {
  const sway = Math.sin(t * 0.0006 + phase) * 0.05;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sway);

  const outerPetals = 5;
  for (let i = 0; i < outerPetals; i++) {
    ctx.save();
    ctx.rotate((i / outerPetals) * Math.PI * 2);
    const pg = ctx.createLinearGradient(0, 0, 0, -size);
    pg.addColorStop(0,   'rgba(255, 210, 225, 0.95)');
    pg.addColorStop(0.7, 'rgba(252, 178, 200, 0.92)');
    pg.addColorStop(1,   'rgba(230, 130, 165, 0.88)');
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

  const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.22);
  cg.addColorStop(0,   'rgba(255, 230, 120, 0.98)');
  cg.addColorStop(0.7, 'rgba(240, 180, 80, 0.9)');
  cg.addColorStop(1,   'rgba(200, 140, 50, 0.7)');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(220, 150, 70, 0.9)';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * size * 0.11, Math.sin(a) * size * 0.11, size * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// Default pad layout. Placed in relative coords so it resizes fluidly.
// Tuned to keep pads away from the identity board's centre column so
// they never collide with hero words.
export const DEFAULT_PADS = [
  { rx: 0.06, ry: 0.20, r: 52, rot: 0.5, phase: 0.1,
    lotus: { ox: 18, oy: -10, size: 18 },
    droplets: [{ x: 0.35, y: 0.15, r: 3 }, { x: -0.18, y: 0.4, r: 2.2 }] },
  { rx: 0.94, ry: 0.30, r: 58, rot: -0.8, phase: 1.4,
    lotus: { ox: -14, oy: -6, size: 20 } },
  { rx: 0.08, ry: 0.70, r: 46, rot: 2.2, phase: 3.1 },
  { rx: 0.92, ry: 0.78, r: 42, rot: -1.5, phase: 4.0,
    droplets: [{ x: 0.15, y: 0.25, r: 2.2 }] },
  { rx: 0.14, ry: 0.95, r: 38, rot: 0.9, phase: 5.2 },
];

// ── Drifting blossom ────────────────────────────────────────────────
export class Blossom {
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

// ── Ripple (short-tap response) ─────────────────────────────────────
export class Ripple {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.rings = [
      { r: 3, alpha: 0.55, spd: 1.6 },
      { r: 1, alpha: 0.35, spd: 1.2 },
    ];
  }
  update() { this.rings.forEach(r => { r.r += r.spd; r.alpha -= 0.013; }); }
  draw(ctx) {
    this.rings.forEach(r => {
      if (r.alpha <= 0) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 240, 210, ${r.alpha})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    });
  }
  isDead() { return this.rings[0].alpha <= 0; }
}
