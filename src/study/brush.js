import { getStroke } from 'perfect-freehand';

// One nib for the whole landscape. Pressure outlines use perfect-freehand
// (MIT; copyright 2021 Stephen Ruiz Ltd). The bristles, washes and paper
// below are original, informed by the references recorded in STUDY.md.
// Seeds belong to marks, never frames: a swimming fish keeps its own hand.
const TAU = Math.PI * 2;
const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));

function seedNumber(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) return seed >>> 0;
  let n = 2166136261;
  for (const char of String(seed ?? 1)) { n ^= char.codePointAt(0); n = Math.imul(n, 16777619); }
  return n >>> 0;
}

export function rng(seed = 1) {
  let value = seedNumber(seed);
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let n = Math.imul(value ^ value >>> 15, 1 | value);
    n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n;
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

function pointsOf(points, limit = 192) {
  if (!Array.isArray(points)) return [];
  const clean = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const x = Array.isArray(p) ? p[0] : p?.x;
    const y = Array.isArray(p) ? p[1] : p?.y;
    const pressure = Array.isArray(p) ? p[2] : p?.pressure;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const previous = clean[clean.length - 1];
    if (previous && Math.hypot(x - previous.x, y - previous.y) < 0.001) continue;
    clean.push({ x, y, pressure: Number.isFinite(pressure) ? clamp(pressure) : null });
  }
  if (clean.length <= limit) return clean;
  return Array.from({ length: limit }, (_, i) => clean[Math.round(i * (clean.length - 1) / (limit - 1))]);
}


// A reusable surface represents one wet mark, not a filtered scene. Dry hair
// gaps remove ink from this mark before it touches the painted landscape.
const markSurfaces = new Map();
let surfacePixels = 0;
function markSurface(points, padding = 8) {
  const minX = Math.floor(Math.min(...points.map(p => p.x)) - padding);
  const minY = Math.floor(Math.min(...points.map(p => p.y)) - padding);
  const w = Math.max(1, Math.ceil(Math.max(...points.map(p => p.x)) + padding - minX));
  const h = Math.max(1, Math.ceil(Math.max(...points.map(p => p.y)) + padding - minY));
  const bw = Math.min(4096, 2 ** Math.ceil(Math.log2(w)));
  const bh = Math.min(4096, 2 ** Math.ceil(Math.log2(h)));
  const key = `${bw}:${bh}`;
  let canvas = markSurfaces.get(key);
  if (!canvas) {
    canvas = document.createElement('canvas'); canvas.width = bw; canvas.height = bh;
    const pixels = bw * bh;
    if (pixels <= 4e6) {
      while (markSurfaces.size && (markSurfaces.size >= 12 || surfacePixels + pixels > 4e6)) {
        const oldest = markSurfaces.keys().next().value;
        const previous = markSurfaces.get(oldest); surfacePixels -= previous.width * previous.height; markSurfaces.delete(oldest);
      }
      markSurfaces.set(key, canvas); surfacePixels += pixels;
    }
  } else { markSurfaces.delete(key); markSurfaces.set(key, canvas); }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, bw, bh); ctx.setTransform(1, 0, 0, 1, -minX, -minY);
  return { canvas, ctx, x: minX, y: minY, w: Math.min(w, bw), h: Math.min(h, bh) };
}
function putMark(target, mark, alpha = 1) {
  target.save(); target.globalAlpha *= alpha;
  target.drawImage(mark.canvas, 0, 0, mark.w, mark.h, mark.x, mark.y, mark.w, mark.h);
  target.restore();
}

function smoothPath(ctx, points, closed = false) {
  if (!points.length) return;
  ctx.beginPath();
  if (closed) {
    const last = points[points.length - 1], first = points[0];
    ctx.moveTo((last[0] + first[0]) / 2, (last[1] + first[1]) / 2);
    for (let i = 0; i < points.length; i++) {
      const p = points[i], next = points[(i + 1) % points.length];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + next[0]) / 2, (p[1] + next[1]) / 2);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i], next = points[i + 1];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + next[0]) / 2, (p[1] + next[1]) / 2);
    }
    if (points.length > 1) ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1]);
  }
}

export function stroke(ctx, points, { width = 1.5, colour = '#2c3430', seed = 1, alpha = 1, dry = 0.35 } = {}) {
  if (!ctx || width <= 0 || alpha <= 0) return;
  let raw = pointsOf(points);
  if (!raw.length) return;
  const random = rng(seed);
  const dryness = clamp(Number(dry) || 0);
  const phase = random() * TAU, rhythm = random() * TAU;
  if (raw.length === 1) {
    ctx.save(); ctx.fillStyle = colour; ctx.globalAlpha *= clamp(alpha);
    ctx.beginPath(); ctx.ellipse(raw[0].x, raw[0].y, width * 0.36, width * 0.45, phase, 0, TAU); ctx.fill(); ctx.restore();
    return;
  }
  // Two points still describe a gesture, rather than a ruler's edge.
  if (raw.length === 2) {
    const [a, b] = raw;
    raw = Array.from({ length: 7 }, (_, i) => {
      const u = i / 6;
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, pressure: a.pressure == null || b.pressure == null ? null : a.pressure + (b.pressure - a.pressure) * u };
    });
  }
  let length = 0;
  const travelled = raw.map((p, i) => { if (i) length += Math.hypot(p.x - raw[i - 1].x, p.y - raw[i - 1].y); return length; });
  const nib = raw.map((p, i) => {
    const u = length ? travelled[i] / length : i / (raw.length - 1);
    const a = raw[Math.max(0, i - 1)], b = raw[Math.min(raw.length - 1, i + 1)];
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / d, ny = (b.x - a.x) / d;
    const pressure = p.pressure ?? clamp((0.4 + 0.49 * Math.sin(Math.PI * Math.pow(u, 0.8))) * (1 - 0.58 * u) + 0.045 * Math.sin(u * TAU * 2 + rhythm), 0.12, 0.94);
    const wander = Math.sin(Math.PI * u) * (Math.sin(u * TAU * 1.6 + phase) + 0.24 * Math.sin(u * TAU * 4.1 + rhythm)) * width * 0.12;
    return { x: p.x + nx * wander, y: p.y + ny * wander, pressure, nx, ny, u };
  });
  const outline = getStroke(nib.map(p => [p.x, p.y, p.pressure]), {
    size: width,
    thinning: 0.75,
    smoothing: 0.42,
    streamline: 0,
    simulatePressure: false,
    start: { cap: true },
    end: { cap: false, taper: width * 1.25 },
    last: true,
  });
  const target = ctx;
  const mark = markSurface(nib, Math.max(3, width * 2));
  ctx = mark.ctx;
  ctx.save();
  ctx.fillStyle = colour; ctx.strokeStyle = colour;
  ctx.globalAlpha = clamp(alpha) * (1 - dryness * 0.14);
  smoothPath(ctx, outline, true); ctx.fill();
  // Dark bristles break over a lighter body of ink. Their gaps are attached
  // to the nib's local arclength, so they never sparkle as the object moves.
  if (dryness > 0.03 && width >= 0.7) {
    const baseAlpha = ctx.globalAlpha;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const count = width > 3 ? 5 : 3;
    for (let fibre = 0; fibre < count; fibre++) {
      const offset = (fibre / Math.max(1, count - 1) - 0.5) * width * 0.86;
      const gapPhase = random() * TAU;
      const frequency = 2.5 + random() * 3.5;
      ctx.globalAlpha = baseAlpha * dryness * (0.45 + random() * 0.3);
      ctx.lineWidth = Math.max(0.22, width * (0.05 + random() * 0.045));
      let segment = [];
      for (const p of nib) {
        const gap = Math.sin(p.u * TAU * frequency + gapPhase);
        if (gap < -0.35 + dryness * 0.35) {
          if (segment.length > 1) { smoothPath(ctx, segment); ctx.stroke(); }
          segment = [];
        } else segment.push([p.x + p.nx * offset * (0.45 + p.pressure * 0.55), p.y + p.ny * offset * (0.45 + p.pressure * 0.55)]);
      }
      if (segment.length > 1) { smoothPath(ctx, segment); ctx.stroke(); }
    }
  }
  if (dryness > 0.08 && width >= 1.1) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = dryness * 0.76;
    const hairs = width > 4 ? 6 : 3;
    for (let hair = 0; hair < hairs; hair++) {
      const position = ((hair + 0.3 + random() * 0.4) / hairs - 0.5) * width * 0.82;
      const phase = random() * TAU;
      ctx.lineWidth = clamp(width * (0.04 + random() * 0.045), 0.2, 0.9);
      let segment = [];
      for (const p of nib) {
        const gate = Math.sin(p.u * TAU * (3 + hair * 0.37) + phase);
        if (gate < 0.05) {
          if (segment.length > 1) { smoothPath(ctx, segment); ctx.stroke(); }
          segment = [];
        } else segment.push([p.x + p.nx * position * (0.45 + p.pressure * 0.55), p.y + p.ny * position * (0.45 + p.pressure * 0.55)]);
      }
      if (segment.length > 1) { smoothPath(ctx, segment); ctx.stroke(); }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = clamp(alpha);
  }
  // A little pooled ink at the landing, never a new random blot each frame.
  if (width > 1.4 && dryness < 0.85) {
    const first = nib[0];
    ctx.globalAlpha *= 0.45; ctx.beginPath();
    ctx.ellipse(first.x, first.y, width * 0.18, width * 0.23, phase, 0, TAU); ctx.fill();
  }
  ctx.restore();
  putMark(target, mark);
}

export function wash(ctx, polygon, { colour = '#6f8b7c', seed = 1, alpha = 0.22, layers = 24, softness = 1, edgeVariance = null } = {}) {
  if (!ctx || alpha <= 0) return;
  const points = pointsOf(polygon, 128);
  if (points.length < 3) return;
  const random = rng(seed);
  const n = Math.round(clamp(Number(layers) || 24, 1, 48));
  const targetAlpha = clamp(alpha, 0, 0.95);
  // Build a neutral coverage mask at a useful alpha, then tint it once.
  // Tiny coloured layers on an 8-bit canvas quantise RGB into black/green.
  const opacity = Math.max(0.04, 1 - Math.pow(1 - targetAlpha, 1 / n));
  const coverage = 1 - Math.pow(1 - opacity, n);
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const breadth = Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const soft = clamp(Number(softness) || 0, 0, 6);
  const bleed = clamp(clamp(breadth * 0.028, 0.25, 6) * soft, 0, 30);
  // Edge variance belongs to this mark. Quiet and ragged stretches coexist.
  // Optional per-vertex weights let a ridge stay observed while its lower
  // boundary dissolves into mist. These are displaced polygons, never blur.
  const edgeWeights = points.map((_, i) => Array.isArray(edgeVariance) && Number.isFinite(edgeVariance[i]) ? clamp(edgeVariance[i], 0, 4) : 1);
  const variance = points.map((_, i) => (0.22 + random() * 0.78) * edgeWeights[i]);
  const target = ctx;
  const mark = markSurface(points, Math.min(30, bleed * Math.max(1, ...edgeWeights) * 1.05) + 3);
  ctx = mark.ctx;
  ctx.save(); ctx.fillStyle = '#000';
  const inheritedAlpha = 1;
  for (let layer = 0; layer < n; layer++) {
    const phase = random() * TAU;
    const outline = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i], a = points[(i + points.length - 1) % points.length], b = points[(i + 1) % points.length];
      const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const nx = -(b.y - a.y) / length, ny = (b.x - a.x) / length;
      const spread = clamp((Math.sin(i * 1.37 + phase) * 0.55 + (random() - 0.5)) * bleed * variance[i], -30, 30);
      outline.push([p.x + nx * spread, p.y + ny * spread]);
      const mx = (p.x + b.x) / 2, my = (p.y + b.y) / 2;
      const mid = clamp((random() - 0.5) * bleed * variance[i] * 0.8, -30, 30);
      outline.push([mx + nx * mid, my + ny * mid]);
    }
    ctx.globalAlpha = inheritedAlpha * opacity;
    smoothPath(ctx, outline, true); ctx.fill();
  }
  // A few deposits, rather than a uniform vector border around every wash.
  ctx.strokeStyle = '#000'; ctx.lineCap = 'round';
  for (let i = 0; i < points.length; i++) {
    if (random() > 0.28) continue;
    const a = points[i], b = points[(i + 1) % points.length];
    ctx.globalAlpha = inheritedAlpha * 0.1 / Math.max(1, soft * edgeWeights[i]);
    ctx.lineWidth = 0.35 + random() * 0.6;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  // Uneven absorption leaves gentle gaps in the pigment. The seed and the
  // mark's own bounds hold these patches still as a fish changes shape.
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 1;
  const absorption = Math.round(clamp(mark.w * mark.h / 3000, 18, 45));
  for (let i = 0; i < absorption; i++) {
    const x = mark.x + random() * mark.w, y = mark.y + random() * mark.h;
    const radius = Math.max(1.2, breadth * (0.12 + random() * 0.16));
    const loss = 0.045 + random() * 0.14;
    const tooth = ctx.createRadialGradient(x, y, 0, x, y, radius);
    tooth.addColorStop(0, `rgba(0,0,0,${loss})`); tooth.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tooth; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  // Tint this one paint mark, never the fish or the finished frame.
  ctx.globalCompositeOperation = 'source-in'; ctx.globalAlpha = 1;
  ctx.fillStyle = colour; ctx.fillRect(mark.x, mark.y, mark.w, mark.h);
  ctx.restore();
  putMark(target, mark, targetAlpha / coverage);
}

export function paperTexture(width, height, night = false) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(clamp(Number(width) || 1, 1, 4096));
  canvas.height = Math.round(clamp(Number(height) || 1, 1, 4096));
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const random = rng(`paper:${canvas.width}:${canvas.height}`);
  const w = canvas.width, h = canvas.height;
  // Transparent paper tooth: the caller owns the ground and the dial colour.
  // Long, almost invisible fibres avoid a noisy all-over digital grain.
  ctx.strokeStyle = night ? '#c6c4b2' : '#68604e';
  const fibres = Math.min(7000, Math.round(w * h / 150));
  ctx.lineWidth = 0.45;
  for (let i = 0; i < fibres; i++) {
    const x = random() * w, y = random() * h;
    const dx = 0.8 + random() * 4, dy = (random() - 0.5) * 1.5;
    ctx.globalAlpha = 0.015 + random() * 0.022;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + dx * 0.5, y + dy - 0.4, x + dx, y + dy); ctx.stroke();
  }
  // Broad low-contrast variation in the stock, baked once, not animated fog.
  for (let i = 0; i < 18; i++) {
    const x = random() * w, y = random() * h, radius = (0.08 + random() * 0.12) * Math.min(w, h);
    const mottle = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, radius));
    mottle.addColorStop(0, night ? 'rgba(180,185,173,.012)' : 'rgba(113,101,73,.012)');
    mottle.addColorStop(1, night ? 'rgba(180,185,173,0)' : 'rgba(113,101,73,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = mottle; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  return canvas;
}
