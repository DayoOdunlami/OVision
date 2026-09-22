// ═══════════════════════════════════════════════════════════════════
// Drawing the vine's parts. The shapes are few and drawn with care —
// the code only decides where they go.
// ═══════════════════════════════════════════════════════════════════

export const STEM_DARK = '#86a525';
export const STEM_LIGHT = '#c3da57';

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const easeOutCubic = (x) => 1 - (1 - x) ** 3;
export const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// A gentle overshoot: a leaf opens a touch past full, then settles.
export const easeOutBack = (x) => {
  const c = 1.2;
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
};

// Stem width at sample i: tapering along the stem, and to a point at a
// tip that is still growing.
export function stemWidth(st, i, grown, taper) {
  const s = st.s[i];
  let w = st.w0 + (st.w1 - st.w0) * (s / st.len);
  if (grown < st.len) w *= Math.max(0.22, Math.min(1, (grown - s) / taper));
  return w;
}

// Samples i0..i1 of a stem: a darker body, then a lighter core set a
// little up and left, so it reads as round rather than flat. Drawn as
// long runs of one width (the width changes slowly), not segment by
// segment — separately stroked segments double their soft edges at
// every joint, which shows as beading.
export function strokeStem(ctx, st, i0, i1, grown, taper) {
  i0 = Math.max(0, i0);
  if (i1 <= i0) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const pass of [0, 1]) {
    ctx.strokeStyle = pass ? STEM_LIGHT : STEM_DARK;
    let i = i0;
    while (i < i1) {
      const w = stemWidth(st, i + 1, grown, taper);
      const q = Math.round(w * 4) / 4;
      const o = pass ? -q * 0.14 : 0;
      ctx.lineWidth = pass ? q * 0.42 : q;
      ctx.beginPath();
      ctx.moveTo(st.pts[i][0] + o, st.pts[i][1] + o);
      let j = i + 1;
      for (; j <= i1; j++) {
        ctx.lineTo(st.pts[j][0] + o, st.pts[j][1] + o);
        if (j < i1 && Math.round(stemWidth(st, j + 1, grown, taper) * 4) / 4 !== q) { j++; break; }
      }
      ctx.stroke();
      i = j - 1;
    }
  }
}

// A leaf. `p` 0→1 is how far it has unfolded: it starts as a thin blade
// lying along the stem, swings out and opens.
export function drawLeaf(ctx, lf, p, extra, stemW) {
  if (p <= 0) return;
  const grow = easeOutBack(clamp01(p));
  const ang = lf.th + (lf.ang - lf.th) * easeOutCubic(clamp01(p)) + extra;
  const open = 0.12 + 0.88 * smoothstep(0.15, 1, p);
  const L = lf.L, W = lf.W * open, tipY = lf.curl * lf.W * 0.35;

  ctx.save();
  ctx.translate(lf.x, lf.y);
  ctx.rotate(ang);
  ctx.scale(grow, grow);

  // Leaf stalk.
  ctx.strokeStyle = STEM_DARK;
  ctx.lineWidth = Math.max(1, stemW * 0.32);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(lf.pl * 0.5, tipY * 0.2, lf.pl, 0);
  ctx.stroke();
  ctx.translate(lf.pl, 0);

  // Two halves either side of the midrib, one in shade.
  const [dark, light] = lf.tone;
  const half = (sgn, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(L * 0.2, sgn * W * 1.1, L * 0.66, sgn * W * 0.98, L, tipY);
    ctx.quadraticCurveTo(L * 0.5, W * 0.06, 0, 0);
    ctx.fill();
  };
  half(-1, lf.flip ? light : dark);
  half(1, lf.flip ? dark : light);

  ctx.strokeStyle = 'rgba(236, 244, 200, 0.4)';
  ctx.lineWidth = Math.max(0.6, L * 0.022);
  ctx.beginPath();
  ctx.moveTo(L * 0.04, 0);
  ctx.quadraticCurveTo(L * 0.5, W * 0.06, L * 0.9, tipY * 0.9);
  ctx.stroke();
  ctx.restore();
}

// A blossom: a closed bud that swells, then five petals open in turn.
export function drawBlossom(ctx, b, p, t) {
  if (p <= 0) return;
  const R = b.r;
  const sway = Math.sin(t * 0.9 + b.phase) * 0.06;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.rot + sway);

  const bud = smoothstep(0, 0.3, p);
  const bloom = smoothstep(0.25, 1, p);
  if (bloom < 1) {
    // The bud, fading as the petals take over.
    ctx.globalAlpha = 1 - bloom;
    ctx.fillStyle = '#e7a9b6';
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 0.28 * bud, R * 0.42 * bud, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  for (let k = 0; k < 5; k++) {
    const q = easeOutBack(clamp01(bloom * 1.6 - k * 0.15));
    if (q <= 0) continue;
    ctx.save();
    ctx.rotate((k * Math.PI * 2) / 5);
    ctx.scale(q, q);
    const g = ctx.createLinearGradient(0, 0, R, 0);
    g.addColorStop(0, '#f2b8c4');
    g.addColorStop(0.55, '#fbe3e6');
    g.addColorStop(1, '#fff8f4');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(R * 0.2, -R * 0.55, R * 0.92, -R * 0.52, R, 0);
    ctx.bezierCurveTo(R * 0.92, R * 0.52, R * 0.2, R * 0.55, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  if (bloom > 0.3) {
    ctx.globalAlpha = smoothstep(0.3, 0.8, bloom);
    ctx.fillStyle = '#e8b64a';
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b8862c';
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * R * 0.12, Math.sin(a) * R * 0.12, R * 0.035, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
