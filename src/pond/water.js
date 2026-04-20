// ═══════════════════════════════════════════════════════════════════
// water.js — painting helpers for the pond's ambient water layer.
// Extracted from KoiBoard.jsx and re-tuned for the identity board's
// warm palette. The teal-deep pond of the Family Board is a different
// animal; this is a sepia pond at golden hour.
//
// Each function is a pure painter over an existing 2D canvas context:
// it reads (ctx, W, H, t, ts) — where t is the frame tick and ts is
// t scaled to a smooth time in seconds. None of them mutate any
// external state.
// ═══════════════════════════════════════════════════════════════════

// ── PALETTES ────────────────────────────────────────────────────────
// CLEAR_POND is the default. Fresh, clean aqua — not sepia — so the
// koi colours (orange / red / white) read vividly against the water
// rather than drowning in brown. Warmth comes from the sunlight god
// rays and the fish themselves, not the water.
//
// WARM_POND is retained for Family-Board-style renders where a deep,
// more ancient feel is wanted.

export const CLEAR_POND = {
  depth: [
    [0.00, '#eaf7f3'],   // shallow: near-white glaze (sun on water)
    [0.30, '#b8e0d6'],   // mid: pale aqua
    [0.60, '#6ea7a1'],   // deeper: soft teal
    [0.85, '#2d5f62'],   // edge: deep teal
    [1.00, '#0e2e33'],   // rim: cool depth
  ],
  currentDark:  '#2f6a6a',
  currentLight: '#d4f4ec',
  caustic:      [230, 255, 245],   // cool-white caustics
  sparkle:      '#ffffff',
  godray:       'rgba(255, 248, 210,',  // warm sun cutting through cool water
  vignette:     '6, 22, 26',
};

export const WARM_POND = {
  depth: [
    [0.00, '#b78a5c'],
    [0.30, '#955d31'],
    [0.60, '#5a2f18'],
    [0.85, '#2e1608'],
    [1.00, '#1a0b04'],
  ],
  currentDark:  '#6b3420',
  currentLight: '#e8b874',
  caustic:      [255, 225, 165],
  sparkle:      '#fff3d6',
  godray:       'rgba(255, 235, 180,',
  vignette:     '20, 10, 4',
};

// ── WATER GRADIENT ──────────────────────────────────────────────────
// Radial basin with the "shallow" centre pushed slightly up and left
// to match the existing sun-at-upper-left lighting model used by the
// fish shading code.

export function paintWater(ctx, W, H, palette = CLEAR_POND) {
  const bg = ctx.createRadialGradient(
    W * 0.42, H * 0.32, 0,
    W * 0.5,  H * 0.55, Math.hypot(W, H) * 0.82
  );
  for (const [off, col] of palette.depth) bg.addColorStop(off, col);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
}

// ── DRIFTING UNDERCURRENTS ──────────────────────────────────────────
// Soft, low-opacity bezier strokes that slowly morph. Gives the water
// a sense of flow without being literal.

export function paintCurrents(ctx, W, H, ts, palette = CLEAR_POND) {
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = palette.currentDark;
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
      W + 40,   yBase + Math.cos(drift + 2.1) * amp * 0.5
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = palette.currentLight;
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
      W + 40,  yBase + Math.cos(drift + 2.4) * amp * 0.6
    );
    ctx.stroke();
  }
  ctx.restore();
}

// ── GOD RAYS ────────────────────────────────────────────────────────
// Three soft warm light columns drifting from the top-left. Additive
// composite so they lift the water surface without washing it out.

export function paintGodRays(ctx, W, H, ts, palette = CLEAR_POND) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const base = palette.godray;
  for (let i = 0; i < 3; i++) {
    const driftX = Math.sin(ts * 0.05 + i * 2.1) * W * 0.18;
    const cx1 = W * (-0.1 + i * 0.35) + driftX;
    const cy1 = -40;
    const cx2 = cx1 + W * 0.55;
    const cy2 = H + 60;
    const g = ctx.createLinearGradient(cx1, cy1, cx2, cy2);
    g.addColorStop(0,    `${base} 0.00)`);
    g.addColorStop(0.35, `${base} 0.055)`);
    g.addColorStop(0.6,  `${base} 0.045)`);
    g.addColorStop(1,    `${base} 0.00)`);
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate((cx1 + cx2) / 2, (cy1 + cy2) / 2);
    ctx.rotate(Math.atan2(cy2 - cy1, cx2 - cx1));
    const len = Math.hypot(cx2 - cx1, cy2 - cy1);
    ctx.fillRect(-len / 2, -90, len, 180);
    ctx.restore();
  }
  ctx.restore();
}

// ── CAUSTICS ────────────────────────────────────────────────────────
// Many small additive bright points driven by two sine fields at
// different frequencies — where they overlap, the water surface
// shimmers. Plus a few tiny pinpoint sparkles on top.

export function paintCaustics(ctx, W, H, ts, palette = CLEAR_POND, count = 64) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const [cr, cg, cb] = palette.caustic;
  for (let i = 0; i < count; i++) {
    const a = i * 0.7853981;
    const baseX = (Math.sin(a * 1.3 + i * 0.41) * 0.5 + 0.5) * W;
    const baseY = (Math.cos(a * 1.7 + i * 0.29) * 0.5 + 0.5) * H;
    const wob = 42;
    const cx = baseX
      + Math.sin(ts * 0.7 + i * 1.31) * wob
      + Math.cos(ts * 0.31 + i * 0.77) * wob * 0.6;
    const cy = baseY
      + Math.cos(ts * 0.63 + i * 1.07) * wob
      + Math.sin(ts * 0.27 + i * 0.93) * wob * 0.6;
    const flicker = Math.sin(ts * 1.4 + i * 2.3) * 0.5 + 0.5;
    const alpha = 0.06 + flicker * 0.10;
    const size = 22 + flicker * 14;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
    g.addColorStop(0,   `rgba(${cr},${cg},${cb},${alpha})`);
    g.addColorStop(0.5, `rgba(${cr},${cg},${cb},${alpha * 0.4})`);
    g.addColorStop(1,   `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 18; i++) {
    const sx = (Math.sin(i * 3.73 + ts * 0.4) * 0.5 + 0.5) * W;
    const sy = (Math.cos(i * 5.17 + ts * 0.35) * 0.5 + 0.5) * H;
    const sa = Math.sin(i + ts * 1.1) * 0.5 + 0.5;
    if (sa < 0.5) continue;
    ctx.globalAlpha = (sa - 0.5) * 0.6;
    ctx.fillStyle = palette.sparkle;
    ctx.fillRect(sx - 0.75, sy - 0.75, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── EDGE VIGNETTE ───────────────────────────────────────────────────
// Transparent centre → dark edges. Tells the eye the scene curves
// away into depth, like looking down into a basin of water.

export function paintVignette(ctx, W, H, palette = CLEAR_POND) {
  const vg = ctx.createRadialGradient(
    W * 0.5, H * 0.55, Math.min(W, H) * 0.28,
    W * 0.5, H * 0.55, Math.hypot(W, H) * 0.62
  );
  vg.addColorStop(0,    `rgba(${palette.vignette}, 0)`);
  vg.addColorStop(0.55, `rgba(${palette.vignette}, 0.22)`);
  vg.addColorStop(1,    `rgba(${palette.vignette}, 0.6)`);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

// ── SURFACE SHIMMER ─────────────────────────────────────────────────
// A slow, wide horizontal bright band in the upper third that
// modulates softly, suggesting a rippling water surface above you.

export function paintShimmer(ctx, W, H, ts, palette = CLEAR_POND) {
  const [cr, cg, cb] = palette.caustic;
  const shimmerY = H * 0.18 + Math.sin(ts * 0.2) * 14;
  const alpha = 0.04 + (Math.sin(ts * 0.5) * 0.5 + 0.5) * 0.04;
  const g = ctx.createLinearGradient(0, shimmerY - 60, 0, shimmerY + 80);
  g.addColorStop(0,   `rgba(${cr},${cg},${cb},0)`);
  g.addColorStop(0.5, `rgba(${cr},${cg},${cb},${alpha})`);
  g.addColorStop(1,   `rgba(${cr},${cg},${cb},0)`);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.fillRect(0, shimmerY - 60, W, 140);
  ctx.restore();
}
