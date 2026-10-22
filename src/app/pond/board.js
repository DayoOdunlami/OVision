import { drawPad, padMotion } from './pads.js';

// ═══════════════════════════════════════════════════════════════════
// The board in the pond (studio P).
//
//   our yeses     lily pads carrying the yes words, bigger than the
//                 week pads, floating either side of the still water
//                 where the word lies. Koi rest under them and rock them.
//   today's yes   its pad has a water lily open on it
//   our nos       a stone resting on the floor beneath the yes it guards,
//                 seen through the water. It sank once, in the ritual;
//                 it doesn't move again.
//
// On a phone only the page's own words are shown at rest; a pad or a
// stone gives its words when touched, on still water. On a tablet the
// pads carry their words: they stay where they are.
// ═══════════════════════════════════════════════════════════════════

// Where the yes pads float, in fractions of the pond: never in the
// middle column (the word's still water) or the foot (the slip).
const SPOTS = {
  portrait: [[0.24, 0.17], [0.79, 0.25], [0.72, 0.79]],
  landscape: [[0.15, 0.32], [0.85, 0.38], [0.2, 0.7]],
};

export function layoutYes(yes, W, H) {
  const portrait = H > W * 1.05;
  const spots = SPOTS[portrait ? 'portrait' : 'landscape'];
  const r = portrait ? Math.max(40, Math.min(64, W * 0.15)) : Math.max(56, Math.min(92, Math.min(W, H) * 0.105));
  return yes.slice(0, 3).map((y, i) => {
    const [fx, fy] = spots[i];
    return {
      key: 'yes' + i,
      index: i,
      text: y.text,
      no: y.no || '',
      rx: fx, ry: fy,
      r: r * (1 - i * 0.05),
      rot: [0.6, -2.4, 2.1][i],
      phase: 0.7 + i * 2.3,
      yes: true,
      // Its stone lies below and a little to one side, on the floor.
      stone: y.no ? { dx: (fx < 0.5 ? 1 : -1) * r * 0.55, dy: r * 0.95, s: r * 0.5, seed: i * 1.7 + 0.4 } : null,
    };
  });
}

// ── Stones ──────────────────────────────────────────────────────────
// Drawn once into a sprite (they never move), then laid on the floor
// under the water's tint: soft-edged, a little blue with depth.
const stoneCache = new Map();
function stoneSprite(s, seed, night) {
  const key = `${Math.round(s)}:${seed}:${night ? 1 : 0}`;
  if (stoneCache.has(key)) return stoneCache.get(key);
  const pad = 12;
  const w = Math.ceil(s * 2.6 + pad * 2), h = Math.ceil(s * 1.8 + pad * 2);
  const c = document.createElement('canvas');
  c.width = w * 2; c.height = h * 2;
  const x = c.getContext('2d');
  x.scale(2, 2);
  x.translate(w / 2, h / 2);
  // A soft shadow on the floor.
  x.fillStyle = 'rgba(4, 20, 24, 0.35)';
  if ('filter' in x) x.filter = 'blur(5px)';
  x.beginPath();
  x.ellipse(3, 5, s * 1.15, s * 0.6, 0, 0, Math.PI * 2);
  x.fill();
  x.filter = 'none';
  // The stone: a rounded, slightly lopsided river stone.
  x.beginPath();
  const n = 28;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = 1 + Math.sin(a * 2 + seed) * 0.08 + Math.sin(a * 3 + seed * 2) * 0.05;
    const px = Math.cos(a) * s * 1.1 * rr, py = Math.sin(a) * s * 0.62 * rr;
    if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
  }
  x.closePath();
  const g = x.createRadialGradient(-s * 0.35, -s * 0.3, s * 0.1, 0, 0, s * 1.2);
  g.addColorStop(0, night ? '#4a5a6a' : '#b9c4bb');
  g.addColorStop(0.6, night ? '#2c3846' : '#7f8f88');
  g.addColorStop(1, night ? '#1a222c' : '#4f5f5a');
  x.fillStyle = g;
  x.fill();
  // Speckle and a faint vein: a stone, not a blob.
  x.globalAlpha = 0.25;
  x.strokeStyle = night ? '#8090a0' : '#e8eee6';
  x.lineWidth = 0.8;
  x.beginPath();
  x.moveTo(-s * 0.7, -s * 0.05);
  x.quadraticCurveTo(0, s * 0.2, s * 0.8, -s * 0.12);
  x.stroke();
  x.globalAlpha = 1;
  stoneCache.set(key, { c, w, h });
  return { c, w, h };
}

// Stones lie under the water: drawn after the depth, before the koi.
// `sink` 0→1 is how far a newly let-go stone has settled (the ritual).
export function drawStone(ctx, pad, W, H, night, sink = 1) {
  const st = pad.stone;
  if (!st) return;
  const { c, w, h } = stoneSprite(st.s, st.seed, night);
  const x = pad.rx * W + st.dx, y = pad.ry * H + st.dy;
  ctx.save();
  ctx.globalAlpha = (night ? 0.55 : 0.62) * sink;
  const scale = 1 + (1 - sink) * 0.5;
  ctx.drawImage(c, x - (w * scale) / 2, y - (h * scale) / 2 - (1 - sink) * 40, w * scale, h * scale);
  ctx.restore();
}

// ── Yes pads ───────────────────────────────────────────────────────
export function drawYesPad(ctx, pad, W, H, t, { labelled, today, night, rock = 0 }) {
  drawPad(ctx, { ...pad, rot: pad.rot + rock }, W, H, t);
  const { bob, drift } = padMotion(t, pad.phase);
  const x = pad.rx * W + drift, y = pad.ry * H + bob;
  if (today) drawLily(ctx, x - pad.r * 0.38, y - pad.r * 0.42, pad.r * 0.42, t, pad.phase, night);
  if (!labelled) return;
  // The words sit on the pad itself, cream on green, in two lines at most.
  const size = Math.round(Math.max(13, Math.min(19, pad.r * 0.21)));
  ctx.save();
  ctx.font = `italic 600 ${size}px "Literata Variable", Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = wrap(ctx, pad.text, pad.r * 1.45);
  const lh = size * 1.18;
  const y0 = y + (today ? pad.r * 0.18 : 0) - ((lines.length - 1) * lh) / 2;
  ctx.shadowColor = 'rgba(8, 26, 12, 0.85)';
  ctx.shadowBlur = 7;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(22, 52, 26, 0.55)';
  ctx.lineWidth = 3;
  lines.forEach((l, i) => ctx.strokeText(l, x, y0 + i * lh));
  ctx.shadowBlur = 0;
  ctx.fillStyle = night ? 'rgba(244, 238, 222, 0.92)' : '#fffaf0';
  lines.forEach((l, i) => ctx.fillText(l, x, y0 + i * lh));
  ctx.restore();
}

function wrap(ctx, text, max) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (ctx.measureText(next).width > max && cur) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  if (lines.length > 3) { lines.length = 3; lines[2] += '…'; }
  return lines;
}

// A white water lily, open on the pad: today's yes.
export function drawLily(ctx, x, y, size, t, phase, night) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 0.004 + phase) * 0.05);
  const petal = (len, wid, a, fill) => {
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wid, -len * 0.45, 0, -len);
    ctx.quadraticCurveTo(-wid, -len * 0.45, 0, 0);
    ctx.fill();
    ctx.restore();
  };
  ctx.shadowColor = 'rgba(0, 20, 10, 0.25)';
  ctx.shadowBlur = 4;
  const outer = night ? 'rgba(226, 230, 236, 0.9)' : 'rgba(255, 252, 246, 0.97)';
  const inner = night ? 'rgba(236, 232, 238, 0.95)' : 'rgba(255, 244, 240, 1)';
  for (let i = 0; i < 10; i++) petal(size, size * 0.3, (i / 10) * Math.PI * 2, outer);
  ctx.shadowBlur = 0;
  for (let i = 0; i < 7; i++) petal(size * 0.7, size * 0.24, (i / 7) * Math.PI * 2 + 0.3, inner);
  // A blush at the heart, and gold.
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.3);
  g.addColorStop(0, 'rgba(250, 210, 90, 1)');
  g.addColorStop(1, 'rgba(240, 180, 70, 0.9)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
