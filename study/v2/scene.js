import { dryStroke, stroke, resample, curve } from './brush.js';
import { wash, blob } from './wash.js';
import { rng, noise1 } from './noise.js';
import { paintBack, paintNear, inkOf, pig, stone, lantern, PAPER } from './paint.js';

// ═══════════════════════════════════════════════════════════════════
// scene.js — sprint 2's landscape: fewer things, more paper (studio S).
//
// One view, seen from the side and a little above: hills far off, the
// garden on the rise, and the round pond in front, seen across, so it
// lies as an oval. The pond and the garden are not painted into the
// landscape: each is drawn once at the size you'll see it close up
// (pond.js, garden.js) and the landscape shows it small. Going in is
// that same drawing coming up to meet you.
// ═══════════════════════════════════════════════════════════════════

const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// Where everything goes. `squash` is how much the pond is foreshortened
// (1 = seen straight down, a circle).
export function layout(W, H, squash = 0.5) {
  const portrait = H > W;
  const u = Math.min(W, H) / 800;
  const L = {
    W, H, portrait, u, m: 0,
    farY: H * (portrait ? 0.255 : 0.24),
    midY: H * (portrait ? 0.3 : 0.29),
    nearY: H * (portrait ? 0.345 : 0.335),
    groundY: H * (portrait ? 0.5 : 0.47),
  };
  // The garden: its ground line at groundY. `gu` is how many pixels one
  // garden unit is here (the plot is one unit wide).
  L.garden = { x: portrait ? W * 0.4 : W * 0.25, y: L.groundY, u: portrait ? W * 0.42 : Math.min(W * 0.2, H * 0.3) };
  // The pond: an oval, or (squash off) a circle that fits below the garden.
  let rx = portrait ? W * 0.42 : Math.min(W * 0.27, H * 0.4);
  const floor = H * (portrait ? 0.915 : 0.935);
  const room = floor - (L.groundY + H * 0.05);
  rx = Math.min(rx, room / (2 * squash));
  const ry = rx * squash;
  L.pond = { cx: portrait ? W * 0.52 : W * 0.6, cy: floor - ry, rx, ry, q: squash };
  return L;
}

// ── The still part of the landscape, painted once per dial step ─────
export function paintScene(ctx, L, mode, light) {
  const { W, H } = L;
  const ink = inkOf(mode);
  // Sky, sun, far and middle hills, near hills with a few trees (the
  // sprint 1 painters, laid lower so the sky stays empty paper).
  paintBack(ctx, L, mode, light);
  paintNear(ctx, L, mode);
  // The ground: a faint meadow from the garden down past the pond,
  // fading out (in Ink, nothing: the paper is the ground).
  const { cx, cy, rx, ry } = L.pond;
  if (mode !== 'ink') {
    const top = L.groundY - H * 0.03;
    softBand(ctx, W, H, [top, L.groundY + H * 0.1, cy, H], (x) => {
      wash(x, [[-30, top], [W + 30, top], [W + 30, H + 20], [-30, H + 20]],
        pig('grass', mode), { layers: 12, alpha: mode === 'colour' ? 0.045 : 0.03, spread: 0.04, seed: 41, edge: 0, grain: 0.4 });
    });
  }
  // A few hatches of grass along the rise, broken.
  const r = rng(212);
  for (let k = 0; k < Math.round(W / 70); k++) {
    const x = r() * W, y = L.groundY + H * (0.004 + r() * 0.03);
    const l = (10 + r() * 22) * L.u + 6;
    stroke(ctx, [[x, y], [x + l * 0.5, y - 1], [x + l, y + 0.5]], { size: 2.4 * L.u + 0.7, fill: css(ink), alpha: 0.2 + r() * 0.12, press: 'swell', seed: 220 + k, pool: 0 });
  }
  // The bank round the pond: a soft ring of earth and grass under the
  // oval, so the water sits in the ground rather than on it.
  if (mode !== 'ink') {
    wash(ctx, blob(cx, cy + ry * 0.04, rx * 1.1, ry * 1.18, 18, 230, 0.04), pig('earth', mode), { layers: 10, alpha: mode === 'colour' ? 0.04 : 0.03, spread: 0.03, seed: 231, edge: 0.1, grain: 0.5 });
  }
  // Stepping stones from the garden down to the water (the calmer study
  // had them; here they also tie the two places together).
  // They leave the plot's front and curve down to the pond's far rim,
  // growing a little as they come nearer.
  const g = L.garden;
  const a = Math.PI * (L.portrait ? 1.36 : 1.2);
  const from = [g.x + g.u * 0.3, g.y + g.u * 0.14], to = [cx + Math.cos(a) * rx * 1.03, cy + Math.sin(a) * ry * 1.1];
  const n = L.portrait ? 3 : 4;
  for (let i = 0; i < n; i++) {
    const f = (i + 0.6) / (n + 0.2);
    const bend = Math.sin(f * Math.PI) * (L.portrait ? W * 0.07 : H * 0.03);
    const x = from[0] + (to[0] - from[0]) * f + bend;
    const y = from[1] + (to[1] - from[1]) * f + (L.portrait ? 0 : bend);
    const s = (7 + f * 5) * L.u * (L.portrait ? 1.25 : 1) + 3;
    flatStone(ctx, x, y, s * 1.5, s * 0.48, mode, ink, 240 + i);
  }
}

// A wash laid through a vertical fade: nothing at y0, full from y1 to
// y2, nothing again at y3. So a band of ground has no edges.
function softBand(ctx, W, H, [y0, y1, y2, y3], paint) {
  const dpr = ctx.__dpr || 1;
  const c = document.createElement('canvas');
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  const x = c.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  paint(x);
  x.globalCompositeOperation = 'destination-in';
  const g = x.createLinearGradient(0, y0, 0, y3);
  const f = (y) => Math.max(0, Math.min(1, (y - y0) / (y3 - y0)));
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(f(y1), 'rgba(0,0,0,1)'); g.addColorStop(f(y2), 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(c, 0, 0);
  ctx.restore();
}

// A flat stone lying in the grass, seen from the side and above.
function flatStone(ctx, x, y, rx, ry, mode, ink, seed) {
  const r = rng(seed);
  if (mode !== 'ink') wash(ctx, blob(x, y, rx, ry, 9, seed, 0.12), pig('stone', mode), { layers: 6, alpha: 0.14, spread: 0.06, seed, edge: 0.4, grain: 0.5 });
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI * 0.95 + (i / 14) * Math.PI * 1.05;
    pts.push([x + Math.cos(a) * rx * (1 + (r() - 0.5) * 0.1), y + Math.sin(a) * ry]);
  }
  dryStroke(ctx, resample(pts, 2), { size: Math.max(1.4, ry * 0.35), ink, alpha: 0.6, dry: 0.5, seed, press: 'swell' });
  stroke(ctx, [[x - rx * 0.8, y + ry * 0.6], [x + rx * 0.7, y + ry * 0.7]], { size: Math.max(1, ry * 0.25), fill: css(ink), alpha: 0.3, press: 'swell', seed: seed + 1, pool: 0 });
}

// ── In front of the pond: a lantern at its far side, stones on its
// near rim. Laid over the water, and gone as you go in.
export function paintFront(ctx, L, mode) {
  const ink = inkOf(mode);
  const { cx, cy, rx, ry } = L.pond;
  const lh = Math.max(46, Math.min(L.H * 0.1, rx * 0.42));
  lantern(ctx, cx + rx * 0.8, cy - ry * 0.66, lh, mode, ink);
  const r = rng(260);
  for (let k = 0; k < 3; k++) {
    const a = Math.PI * (0.62 + k * 0.09) + (r() - 0.5) * 0.08;
    const x = cx + Math.cos(a) * rx * 1.01, y = cy + Math.sin(a) * ry * 1.02;
    stone(ctx, x, y + 3, (7 + r() * 5) * L.u + 4, mode, ink, 270 + k);
  }
}

// Where the reeds stand, on the rim (they sway, so they're laid live).
export function reedSpots(L) {
  const { cx, cy, rx, ry } = L.pond;
  const out = [];
  for (const [a, n, s] of [[Math.PI * 1.08, 3, 1.15], [Math.PI * 0.18, 2, 0.9], [Math.PI * 1.7, 2, 0.75]]) {
    for (let i = 0; i < n; i++) {
      const aa = a + (i - n / 2) * 0.05;
      out.push({ x: cx + Math.cos(aa) * rx * 1.0, y: cy + Math.sin(aa) * ry * 1.0 + 2, s: s * (0.8 + i * 0.15), k: i % 3, ph: aa * 3 });
    }
  }
  return out;
}

// The pond's rim: an ink line round the oval, broken where the eye loses
// it, laid live because it moves when you go in. In screen space.
export function drawRim(ctx, cx, cy, rx, ry, mode, alpha = 1, u = 1) {
  const ink = inkOf(mode);
  const arcs = [[0.06, 0.46, 0.75], [0.5, 0.97, 0.9], [1.02, 1.42, 0.55], [1.47, 1.98, 0.7]];
  for (const [i, [a0, a1, w]] of arcs.entries()) {
    const pts = [];
    for (let j = 0; j <= 28; j++) {
      const a = Math.PI * (a0 + (a1 - a0) * (j / 28));
      const k = 1 + noise1(a * 3, 77) * 0.008;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    stroke(ctx, pts, { size: (3.2 * u + 0.9) * w, fill: css(ink), alpha: 0.62 * alpha, press: 'swell', wobble: 0.3, seed: 310 + i, pool: 0.3 });
  }
}

// A slow cloud shadow for the hills: a soft darker wash that drifts
// across them. Faded top and bottom so it has no edges.
export function shadowSprite(w, h, mode, dpr, seed) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const col = mode === 'ink' ? inkOf(mode) : pig('mid', mode);
  wash(ctx, blob(w / 2, h / 2, w * 0.42, h * 0.32, 12, seed, 0.25), col, { layers: 12, alpha: mode === 'ink' ? 0.012 : 0.03, spread: 0.2, seed: seed + 1, edge: 0, grain: 0.3 });
  ctx.globalCompositeOperation = 'destination-in';
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.7, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.setTransform(dpr, 0, 0, dpr * (h / w), 0, 0);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, w);
  return c;
}

export { PAPER, curve };
