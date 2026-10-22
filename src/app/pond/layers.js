// ═══════════════════════════════════════════════════════════════════
// layers.js — the pond, drawn cheaply enough for an ordinary tablet.
//
// What doesn't move is painted once and laid down each frame as one
// image: the water's depth, and the overlay (vignette, winter's ice,
// the night tint). What does move but always looks the same is a small
// sprite drawn many times: caustic light, a pad's soft shadow. No
// gradients are created and no blur filters run inside the frame.
// ═══════════════════════════════════════════════════════════════════

import { paintWater, paintVignette } from './water.js';
import { paintIce } from './paint.js';
import { padMotion } from './pads.js';

function offscreen(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

// The still water: depth gradient (and, at night, the moon's glow).
export function baseLayer(W, H, DPR, pal, night) {
  const c = offscreen(W * DPR, H * DPR);
  const ctx = c.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  paintWater(ctx, W, H, pal);
  if (night) {
    const x = W * 0.78, y = H * 0.16, r = Math.min(W, H) * 0.05;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
    g.addColorStop(0, 'rgba(200, 214, 255, 0.16)');
    g.addColorStop(1, 'rgba(200, 214, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
    const d = ctx.createRadialGradient(x, y, 0, x, y, r);
    d.addColorStop(0, 'rgba(236, 240, 255, 0.2)');
    d.addColorStop(0.7, 'rgba(236, 240, 255, 0.12)');
    d.addColorStop(1, 'rgba(236, 240, 255, 0)');
    ctx.fillStyle = d;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

// Over everything: winter's ice, the vignette, the night tint.
export function overLayer(W, H, DPR, pal, night, winter) {
  const c = offscreen(W * DPR, H * DPR);
  const ctx = c.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (winter) paintIce(ctx, W, H, night);
  paintVignette(ctx, W, H, pal);
  if (night) {
    ctx.fillStyle = 'rgba(4, 8, 20, 0.22)';
    ctx.fillRect(0, 0, W, H);
  }
  return c;
}

// One soft dot of light, drawn once in the caustic colour.
export function causticSprite(rgb) {
  const s = 64;
  const c = offscreen(s, s);
  const ctx = c.getContext('2d');
  const [r, g, b] = rgb;
  const gr = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gr.addColorStop(0.5, `rgba(${r},${g},${b},0.4)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, s, s);
  return c;
}

// The same drifting light as water.js's paintCaustics, from a sprite.
export function paintCausticsFast(ctx, W, H, ts, sprite, count, sparkle) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < count; i++) {
    const a = i * 0.7853981;
    const baseX = (Math.sin(a * 1.3 + i * 0.41) * 0.5 + 0.5) * W;
    const baseY = (Math.cos(a * 1.7 + i * 0.29) * 0.5 + 0.5) * H;
    const wob = 42;
    const cx = baseX + Math.sin(ts * 0.7 + i * 1.31) * wob + Math.cos(ts * 0.31 + i * 0.77) * wob * 0.6;
    const cy = baseY + Math.cos(ts * 0.63 + i * 1.07) * wob + Math.sin(ts * 0.27 + i * 0.93) * wob * 0.6;
    const flicker = Math.sin(ts * 1.4 + i * 2.3) * 0.5 + 0.5;
    const size = 22 + flicker * 14;
    ctx.globalAlpha = 0.06 + flicker * 0.1;
    ctx.drawImage(sprite, cx - size, cy - size, size * 2, size * 2);
  }
  ctx.fillStyle = sparkle;
  for (let i = 0; i < 18; i++) {
    const sa = Math.sin(i + ts * 1.1) * 0.5 + 0.5;
    if (sa < 0.5) continue;
    const sx = (Math.sin(i * 3.73 + ts * 0.4) * 0.5 + 0.5) * W;
    const sy = (Math.cos(i * 5.17 + ts * 0.35) * 0.5 + 0.5) * H;
    ctx.globalAlpha = (sa - 0.5) * 0.6;
    ctx.fillRect(sx - 0.75, sy - 0.75, 1.5, 1.5);
  }
  ctx.restore();
}

// A pad's soft shadow: a pre-blurred disc, laid where the pad's shadow
// falls as it bobs (the same motion as the pad itself).
let shadow = null;
export function paintPadShadowFast(ctx, x, y, r, rot, t, phase) {
  if (!shadow) {
    shadow = offscreen(96, 96);
    const s = shadow.getContext('2d');
    const g = s.createRadialGradient(48, 48, 10, 48, 48, 46);
    g.addColorStop(0, 'rgba(20, 8, 0, 0.9)');
    g.addColorStop(0.65, 'rgba(20, 8, 0, 0.55)');
    g.addColorStop(1, 'rgba(20, 8, 0, 0)');
    s.fillStyle = g;
    s.fillRect(0, 0, 96, 96);
  }
  const { bob, drift } = padMotion(t, phase);
  ctx.save();
  ctx.globalAlpha = 0.22;
  const R = r * 1.25;
  ctx.drawImage(shadow, x + 6 + drift * 0.75 - R, y + bob * 0.9 + 14 - R, R * 2, R * 2);
  ctx.restore();
}
