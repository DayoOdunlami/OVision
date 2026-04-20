// ═══════════════════════════════════════════════════════════════════
// particles.js — edge-bound reactive particles for the Flourish zone.
//
// The word itself is rendered as real DOM text in FlourishZone. This
// module is only responsible for the reactive decoration that traces
// the letter silhouettes.
//
// Pipeline:
//   1. Render the target word to an offscreen canvas.
//   2. Walk the alpha grid, keep only pixels that sit on the OUTLINE
//      (filled pixel whose neighbour N px away is empty). That gives
//      a ring of points around each glyph rather than filling them.
//   3. Seed one EdgeParticle per ring point. It springs back to home
//      with damping.
//   4. On cursor OR ambient-fish proximity, particles get a hard
//      radial push. They scatter, then re-settle onto the letter
//      outline.
//
// Two visual modes, same physics:
//   'bubble'   — dark-rimmed white bubble with inner shading
//   'particle' — flat monochrome dot (Tamino-style)
//
// The previous "tadpole" mode is retired; colourful fish-shaped
// particles didn't read as a word at a glance and the user called it.
// ═══════════════════════════════════════════════════════════════════

// ── outline sampler ────────────────────────────────────────────────
//
// Returns a ring of points around every letter at the given font.
// Unlike samplePathPointsFromText (which filled the letters), this
// only keeps pixels near the silhouette edge.
//
// Opts:
//   text, font              — what/how to measure
//   density                 — sampling stride
//   jitter                  — random sub-pixel shake
//   maxCount                — hard cap, stride-decimates if exceeded
//   strokeDistance          — how far a neighbour has to be "empty"
//                             for a pixel to count as an edge pixel
//                             (3 px = fairly thick ring, 1 px = hairline)
export function sampleEdgePointsFromText(opts) {
  const {
    text,
    font = '900 260px "Fraunces", serif',
    density = 3,
    jitter = 0.8,
    maxCount = 500,
    strokeDistance = 3,
    paddingX = 60,
    paddingY = 60,
  } = opts;

  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const metrics = probe.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const ascent = metrics.actualBoundingBoxAscent || 180;
  const descent = metrics.actualBoundingBoxDescent || 40;
  const textHeight = Math.ceil(ascent + descent);

  const W = textWidth + paddingX * 2;
  const H = textHeight + paddingY * 2;

  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  ctx.font = font;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000';
  ctx.fillText(text, paddingX, paddingY + ascent);

  const img = ctx.getImageData(0, 0, W, H).data;
  const alphaAt = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return 0;
    return img[(y * W + x) * 4 + 3];
  };

  const raw = [];
  const s = strokeDistance;
  for (let y = 0; y < H; y += density) {
    for (let x = 0; x < W; x += density) {
      if (alphaAt(x, y) < 140) continue;
      // Edge test — at least one neighbour s px away must be empty.
      const outside =
        alphaAt(x - s, y) < 50 ||
        alphaAt(x + s, y) < 50 ||
        alphaAt(x, y - s) < 50 ||
        alphaAt(x, y + s) < 50 ||
        alphaAt(x - s, y - s) < 50 ||
        alphaAt(x + s, y + s) < 50 ||
        alphaAt(x - s, y + s) < 50 ||
        alphaAt(x + s, y - s) < 50;
      if (!outside) continue;
      raw.push({
        x: x + (Math.random() - 0.5) * jitter,
        y: y + (Math.random() - 0.5) * jitter,
      });
    }
  }

  let points = raw;
  if (raw.length > maxCount) {
    const step = raw.length / maxCount;
    points = [];
    for (let i = 0; i < maxCount; i++) {
      points.push(raw[Math.floor(i * step)]);
    }
  }

  return { points, width: W, height: H };
}

// Legacy name kept — still used if any caller wants filled sampling.
export { sampleEdgePointsFromText as samplePathPointsFromText };

// Pond-tone palette for the Particle variant — drop the flat black,
// paint each dot in one of a handful of mossy greens and warm bronzes
// so the ring reads as "pond floor" texture rather than a stencil.
const POND_TONES = [
  '#2d5a3d',  // deep forest green
  '#3d6b45',  // moss
  '#5a7c4f',  // sage
  '#7a8c54',  // olive
  '#8b6d3a',  // warm bronze
  '#a0772b',  // amber
  '#6b4a28',  // dark bronze
  '#4a6a4a',  // muted jade
];

// ── edge particle ─────────────────────────────────────────────────
//
// Springs back to home. Scatters on cursor / fish proximity. Also
// carries its own slow fizz wobble so it feels alive at rest.
// Two rendering styles: bubble or particle.
export class ParticleFish {
  constructor(homeX, homeY, opts = {}) {
    this.mode = opts.mode === 'bubble' ? 'bubble' : 'particle';
    this.homeX = homeX;
    this.homeY = homeY;
    this.x = homeX;
    this.y = homeY;
    this.vx = 0;
    this.vy = 0;
    this.scared = 0;

    // Per-particle phase offsets. These are what make the rest motion
    // look organic rather than a rigid grid of identical wobbles.
    this.phase = Math.random() * Math.PI * 2;
    this.phaseRate = 0.06 + Math.random() * 0.06;      // rad/frame — faster so fizz reads
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.pulseRate = 0.02 + Math.random() * 0.03;      // slow enough not to strobe, fast enough to notice
    // Fraction of particles that get an active pulse. Boosted so the
    // ring visibly breathes — on a 500-particle word you'll have
    // ~225 quietly pulsing and a rolling handful at peak brightness.
    this.pulseStrength = Math.random() < 0.45 ? 0.7 + Math.random() * 0.4 : 0;

    if (this.mode === 'bubble') {
      // Small bubbles tracing the letter outlines — they visibly bob.
      // Amp is up from ~1.5px to ~3px so the motion reads even in a
      // still frame out of the corner of your eye.
      this.baseRadius = 1.8 + Math.random() * 2.0;
      this.alpha = 0.9;
      this.fizzAmp = 2.0 + Math.random() * 2.2;        // px of bob
    } else {
      // Pond-tone dot — one colour per particle, picked once at seed
      // time so the ring has a stable stippled texture.
      this.baseRadius = 1.3 + Math.random() * 0.6;
      this.alpha = 0.95;
      this.color = POND_TONES[Math.floor(Math.random() * POND_TONES.length)];
      this.fizzAmp = 1.1 + Math.random() * 1.0;        // particles fizz less but must still move
    }
    if (opts.size) this.baseRadius *= opts.size;
  }

  setHome(x, y) {
    this.homeX = x;
    this.homeY = y;
  }

  // Scatter-pulse from an external source (cursor or fish). cx,cy in
  // the same canvas-local coord space as this particle.
  // Pushes with inverse-distance falloff inside `radius`.
  applyRepel(cx, cy, radius, strength) {
    const dx = this.x - cx;
    const dy = this.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 > radius * radius || d2 < 0.0001) return;
    const d = Math.sqrt(d2);
    const f = (1 - d / radius) * strength;
    this.vx += (dx / d) * f;
    this.vy += (dy / d) * f;
    this.scared = 22;
  }

  // Per-frame update: spring back to home, carry a gentle fizz around
  // the home point, and advance the slow pulse phase. Scatter pulses
  // are applied from outside via applyRepel before this runs.
  update() {
    this.phase += this.phaseRate;
    this.pulsePhase += this.pulseRate;

    // Fizz — a tiny moving target orbiting the home point. Bubbles bob
    // noticeably; particles drift almost imperceptibly. The offset is
    // per-particle so no two bobs are in phase — the ring looks alive.
    const fx = Math.sin(this.phase) * this.fizzAmp;
    const fy = Math.cos(this.phase * 1.27) * this.fizzAmp;
    const targetX = this.homeX + fx;
    const targetY = this.homeY + fy;

    const spring = this.mode === 'particle' ? 0.17 : 0.11;
    const drag = this.mode === 'particle' ? 0.66 : 0.78;
    this.vx += (targetX - this.x) * spring;
    this.vy += (targetY - this.y) * spring;
    this.vx *= drag;
    this.vy *= drag;
    this.x += this.vx;
    this.y += this.vy;
    if (this.scared > 0) this.scared--;
  }

  // Normalised 0..1 pulse value for particles that opted in. Particles
  // with pulseStrength = 0 always return 0 (static).
  _pulse() {
    if (this.pulseStrength === 0) return 0;
    // Sin → 0..1, raised to a gentler power so the peak is obvious
    // (was ^3 → almost always 0). ^1.5 keeps some off-time between
    // bright moments but makes the active phase wide enough to read.
    const s = (Math.sin(this.pulsePhase) + 1) * 0.5;
    return Math.pow(s, 1.5) * this.pulseStrength;
  }

  draw(ctx) {
    if (this.mode === 'bubble') return this._drawBubble(ctx);
    return this._drawParticle(ctx);
  }

  // Bubble — no more dark rim. A soft translucent body with a bright
  // specular and a whisper of shadow underneath gives the volume.
  // The fizz drift (in update) supplies the organic motion. Active
  // pulse bumps the radius + brightness so the bob visibly inflates.
  _drawBubble(ctx) {
    const pulse = this._pulse();
    const r = this.baseRadius * (1 + pulse * 0.55);
    ctx.save();
    // Soft drop underneath so the bubble separates from the aqua.
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = 'rgba(10, 42, 48, 1)';
    ctx.beginPath();
    ctx.arc(this.x, this.y + r * 0.28, r * 0.92, 0, Math.PI * 2);
    ctx.fill();
    // White body — most of the silhouette, gently translucent.
    ctx.globalAlpha = this.alpha * (0.75 + pulse * 0.25);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
    // Pale cyan shading crescent for dimensional cue.
    ctx.globalAlpha = this.alpha * 0.38;
    ctx.fillStyle = '#b8ece1';
    ctx.beginPath();
    ctx.arc(this.x + r * 0.22, this.y + r * 0.22, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    // Bright specular — the highlight sells "bubble" without a rim.
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.98)';
    ctx.beginPath();
    ctx.arc(this.x - r * 0.36, this.y - r * 0.4, Math.max(0.5, r * 0.24), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Pond-tone dot — picks from a moss/bronze palette, with almost
  // half the particles carrying a slow pulse + warm halo. When a
  // particle pulses it clearly swells and lights up; at rest it's
  // just a flat mossy/bronze dot tracing the letter edge.
  _drawParticle(ctx) {
    const pulse = this._pulse();
    const r = this.baseRadius * (1 + pulse * 0.9);
    ctx.save();
    // Glow is only painted when a particle is actively pulsing. The
    // halo is warm (amber) so the ring sparkles like lamplight on a
    // pond surface rather than feeling electronic.
    if (pulse > 0.02) {
      ctx.globalAlpha = Math.min(1, pulse * 0.9);
      ctx.shadowColor = 'rgba(255, 208, 130, 1)';
      ctx.shadowBlur = 10 + pulse * 16;
      ctx.fillStyle = 'rgba(255, 224, 170, 0.95)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, r * 1.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Place N edge homes along a sampled letterform centred on a max-width box.
export function layoutHomesOnText({ text, font, maxWidth, density, maxCount, jitter, strokeDistance }) {
  const sample = sampleEdgePointsFromText({ text, font, density, maxCount, jitter, strokeDistance });
  const scale = Math.min(1, maxWidth / sample.width);
  return {
    points: sample.points.map((p) => ({
      x: (p.x - sample.width / 2) * scale,
      y: (p.y - sample.height / 2) * scale,
    })),
    scale,
    width: sample.width * scale,
    height: sample.height * scale,
  };
}
