import { stroke } from './brush.js';

// ═══════════════════════════════════════════════════════════════════
// inkKoi.js — the same koi, painted.
//
// The fish is Quiet Waters' SpineFish, untouched: its skeleton, its
// swimming, its fins and tail, its depth, all exactly as they are. Only
// the drawing changes. Where SpineFish.draw() fills coloured shapes,
// this lays brush strokes along the very same points, every frame:
//
//   the flanks     two strokes from the gills to the tail, swelling at
//                  the shoulders, lifting off before the tail meets them
//                  (a lost edge, as a painter leaves one)
//   the head       one firm stroke round the nose, gill line, two eyes
//   the back       a thin dark stroke down the spine
//   fins and tail  quick flicks along the fin rays, pale
//   markings       ink: tone only (sumi dark, the red in pale ink);
//                  ink and wash: soft colour laid under the line
//   depth          a deeper fish is fainter and smaller, as in the pond
//
// Each stroke's wobble is seeded per fish and per stroke and indexed
// along the body, so it moves with the fish and never flickers.
// SpineFish advances its fins and tail inside draw(); this calls the
// same act() once a frame, so the motion is identical.
// ═══════════════════════════════════════════════════════════════════

const DARK = new Set(['showa', 'karasu', 'hiUtsuri']);
// Ink and wash pigments for the markings: koi colours, as a painter
// would mix them (vermilion, ochre, umber, indigo), never neon.
const WASH = {
  red: [200, 82, 56],
  black: [40, 38, 40],
  white: [250, 246, 238],
};

const side = (p, r, s) => p.getPoint(p.radius * r, s * Math.PI / 2);

export function drawInkKoi(ctx, fish, { mode = 'ink', fill, seed = 1, wash = 1 }) {
  const v = fish.variety;
  // The fins and tail move as SpineFish moves them (it does this inside
  // its own render calls).
  fish.fins.act();
  fish.tail.act();

  const depth = Math.max(0, Math.min(1, fish.depth));
  const surface = 1 - depth;
  const scale = 0.78 + 0.28 * surface;
  const ink = 0.42 + 0.58 * surface;            // deeper fish: paler ink
  const head = fish.head;
  const parts = fish.parts;
  const n = parts.length;
  const R = head.radius;
  const brush = Math.max(1.8, R * 1.55);

  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.scale(scale, scale);
  ctx.translate(-head.x, -head.y);
  ctx.globalAlpha = ink;

  // ── Under the line: the koi's colour (wash), or its tone (ink) ──────
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(...head.getPoint(R * 8, Math.PI / 2));
    for (let i = 0; i < n - 1; i++) ctx.lineTo(...side(parts[i], 8, 1));
    ctx.lineTo(...parts[n - 1].getPoint(0, 0));
    for (let i = n - 2; i >= 0; i--) ctx.lineTo(...side(parts[i], 8, -1));
    ctx.lineTo(...head.getPoint(R * 8, -Math.PI / 2));
    ctx.quadraticCurveTo(...head.getPoint(R * 17, 0), ...head.getPoint(R * 8, Math.PI / 2));
    ctx.closePath();
  };
  const dark = DARK.has(v.name);
  if (mode === 'wash') {
    // A pale shadow on the floor, then the body's own colour.
    ctx.save();
    ctx.globalAlpha = ink * 0.16;
    ctx.translate(5 + depth * 5, 10 + depth * 8);
    ctx.fillStyle = 'rgb(52,74,96)';
    body();
    ctx.fill();
    ctx.restore();
    const base = dark ? WASH.black : v.name === 'ogon' ? [210, 168, 72] : v.name === 'chagoi' ? [176, 112, 62]
      : v.name === 'asagi' ? [104, 126, 150] : WASH.white;
    ctx.globalAlpha = ink * (dark ? 0.6 : base === WASH.white ? 0.5 : 0.42) * wash;
    ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
    body();
    ctx.fill();
  } else {
    // Ink: the body's tone, pale for a pale fish, deep for a dark one.
    ctx.globalAlpha = ink * (dark ? 0.42 : v.name === 'chagoi' || v.name === 'ogon' ? 0.13 : 0.05);
    ctx.fillStyle = fill;
    body();
    ctx.fill();
  }
  // Markings: soft blots, a little loose of the line, as a wash bleeds.
  if (v.spots) {
    for (const s of v.spots) {
      const idx = Math.max(0, Math.min(n - 1, Math.floor(n * s.at)));
      const p = parts[idx];
      const r = p.radius * 5 * (s.size || 1);
      const [cx, cy] = p.getPoint(p.radius * 2 * s.side, s.side === 0 ? 0 : Math.PI / 2 * Math.sign(s.side));
      const isRed = s.hue[0] > 150 && s.hue[1] < 140;
      const isBlack = s.hue[0] < 60;
      if (mode === 'wash') {
        const c = isRed ? WASH.red : isBlack ? WASH.black : WASH.white;
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        ctx.globalAlpha = ink * (isRed ? 0.55 : isBlack ? 0.6 : 0.7) * wash;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 1.05, r * 0.8, p.radian + 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha *= 0.5;
        ctx.beginPath();
        ctx.ellipse(cx + r * 0.15, cy - r * 0.1, r * 0.7, r * 0.55, p.radian - 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (!dark || !isRed) {
        // Ink only: the red as pale ink, the black as dark.
        ctx.fillStyle = fill;
        ctx.globalAlpha = ink * (isBlack ? 0.6 : isRed ? 0.26 : 0);
        if (ctx.globalAlpha > 0) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, r, r * 0.76, p.radian + 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
  ctx.globalAlpha = ink;

  // ── Fins and tail: quick, pale flicks along the rays ────────────────
  const id = (k) => seed * 100 + k;
  // Membranes in pale ink (or a pale wash), and only the leading edge
  // drawn: an ink painter gives a fin one stroke, not every ray.
  const membrane = (pts, a) => {
    ctx.save();
    ctx.globalAlpha = ink * a;
    ctx.fillStyle = mode === 'wash' ? (dark ? 'rgb(60,58,62)' : 'rgb(206,146,108)') : fill;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts) ctx.lineTo(p[0], p[1]);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  fish.fins.fins.forEach((fin, f) => {
    const rows = fin.pieces;
    const lead = rows[0], back = rows[rows.length - 1];
    membrane([...lead.map((p) => [p.x, p.y]), ...back.slice().reverse().map((p) => [p.x, p.y])], mode === 'wash' ? 0.22 * wash : 0.13);
    stroke(ctx, lead.map((p) => [p.x, p.y]), { size: brush * 0.95, fill, alpha: 0.55, press: 'flick', wobble: 0.3, seed: id(10 + f * 5), pool: 0.3 });
    const mid = rows[Math.floor(rows.length / 2)];
    stroke(ctx, mid.map((p) => [p.x, p.y]), { size: brush * 0.45, fill, alpha: 0.16, press: 'flick', wobble: 0.3, seed: id(11 + f * 5), pool: 0 });
  });
  const tip = parts[n - 1];
  const tail = fish.tail.pieces;
  membrane([[tip.x, tip.y], ...tail[0].map((p) => [p.x, p.y]), ...tail[4].slice().reverse().map((p) => [p.x, p.y])], mode === 'wash' ? 0.2 * wash : 0.12);
  [0, 2, 4].forEach((k, j) => {
    const row = tail[k];
    const edge = k !== 2;
    stroke(ctx, [[tip.x, tip.y], ...row.map((p) => [p.x, p.y])], { size: brush * (edge ? 1.0 : 0.45), fill, alpha: edge ? 0.55 : 0.18, press: 'flick', wobble: 0.35, seed: id(40 + j), pool: edge ? 0.2 : 0 });
  });

  // ── The body's line ─────────────────────────────────────────────────
  // Each flank from the gill back, lifting off before the tail.
  const stop = Math.max(3, Math.floor(n * 0.86));
  for (const s of [1, -1]) {
    const pts = [head.getPoint(R * 8, s * (Math.PI / 2 + 0.25))];
    for (let i = 0; i < stop; i++) pts.push(side(parts[i], 8, s));
    stroke(ctx, pts, {
      size: brush * 1.3, fill, alpha: 0.92, wobble: 0.28, seed: id(s > 0 ? 1 : 2), pool: 0.5,
      press: (u) => 0.35 + 0.65 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 0.7) * (1 - u * 0.4),
    });
  }
  // The tail end of the body: one short stroke closing in.
  const tailEnd = [];
  for (let i = Math.max(0, stop - 4); i < n; i++) tailEnd.push(side(parts[i], 8 * (1 - (i - stop + 4) / (n - stop + 4) * 0.9), 1));
  if (tailEnd.length > 2) stroke(ctx, tailEnd, { size: brush * 0.6, fill, alpha: 0.45, press: 'flick', wobble: 0.3, seed: id(3), pool: 0 });

  // The head: one stroke round the nose, gill to gill.
  const h = head;
  const headPts = [
    h.getPoint(R * 8.2, Math.PI / 2 + 0.2), h.getPoint(R * 9.5, Math.PI / 3), h.getPoint(R * 11, Math.PI / 6),
    h.getPoint(R * 12.6, 0.06), h.getPoint(R * 12.6, -0.06), h.getPoint(R * 11, -Math.PI / 6),
    h.getPoint(R * 9.5, -Math.PI / 3), h.getPoint(R * 8.2, -Math.PI / 2 - 0.2),
  ];
  stroke(ctx, headPts, { size: brush * 1.2, fill, alpha: 0.94, press: 'swell', wobble: 0.22, seed: id(4), pool: 0.35 });
  // The gill line, a soft curve just behind the head.
  const g = parts[Math.min(n - 1, 1)];
  stroke(ctx, [side(g, 6.5, 1), g.getPoint(-g.radius * 1.5, 0), side(g, 6.5, -1)], { size: brush * 0.55, fill, alpha: 0.4, press: 'swell', wobble: 0.3, seed: id(5), pool: 0 });
  // The spine: thin and dark down the middle of the back.
  const s0 = Math.floor(n / 6), s1 = Math.floor(n * 0.7);
  const spine = [];
  for (let i = s0; i <= s1; i++) spine.push(parts[i].getPoint(0, 0));
  stroke(ctx, spine, { size: brush * 0.75, fill, alpha: 0.5, press: 'flick', wobble: 0.4, seed: id(6), pool: 0.3 });
  // Eyes.
  ctx.fillStyle = fill;
  ctx.globalAlpha = ink * 0.95;
  for (const s of [1, -1]) {
    const [ex, ey] = h.getPoint(R * 9.2, s * Math.PI / 3.4);
    ctx.beginPath();
    ctx.arc(ex, ey, Math.max(1.1, R * 0.62), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
