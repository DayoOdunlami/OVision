// ═══════════════════════════════════════════════════════════════════
// The sky over the reed bed, painted on a plain canvas behind the birds,
// and the light the birds are seen in. Follows the real clock (?h=21 to
// preview): dawn rose and gold; day pale and overcast, like most
// murmuration photographs; dusk deep blue to rose to gold (the classic);
// night indigo, with the birds silvered as if by the moon.
// ═══════════════════════════════════════════════════════════════════

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const smooth = (x) => x * x * (3 - 2 * x);

// [hour, top, middle, horizon, birds, lit word]
const KEYS = [
  [0, '#0c1124', '#1c2444', '#343760', '#cfd3e2', '#fff1c4'],
  [4.8, '#141a33', '#2c2f55', '#5a4a6c', '#c4c4d6', '#ffe1b0'],
  [6.4, '#5b6a94', '#d9a9a6', '#f5d3a6', '#1b1820', '#7a4a1c'],
  [8.6, '#8ea4c2', '#cbd5dc', '#ecebe2', '#1d1f27', '#6b4a1e'],
  [16.4, '#8a9ec0', '#cfd3d6', '#efe6d8', '#1d1f27', '#6b4a1e'],
  [18.2, '#3c4670', '#c2879a', '#f2b679', '#151318', '#7d4614'],
  [20.2, '#1d2346', '#4a4268', '#7a5a76', '#bfc2d6', '#ffe0a8'],
  [24, '#0c1124', '#1c2444', '#343760', '#cfd3e2', '#fff1c4'],
];

export function hourNow() {
  try {
    const q = new URLSearchParams(location.search).get('h');
    if (q !== null && Number.isFinite(Number(q))) return Number(q);
  } catch { /* ignore */ }
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

export function lightAt(h, followClock = true) {
  if (!followClock) h = 18.9;
  h = ((h % 24) + 24) % 24;
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1][0] <= h) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const k = smooth(Math.min(1, Math.max(0, (h - a[0]) / (b[0] - a[0]))));
  const at = (j) => mix(hex(a[j]), hex(b[j]), k);
  const top = at(1), mid = at(2), low = at(3);
  const lum = (c) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  return { h, top, mid, low, birds: at(4), lit: at(5), night: lum(mid) < 0.3 };
}

// A seeded random, so the reeds stand in the same places each time.
const seeded = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);

export function paintSky(ctx, W, H, L) {
  // The sky.
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, rgb(L.top));
  g.addColorStop(0.62, rgb(L.mid));
  g.addColorStop(0.9, rgb(L.low));
  g.addColorStop(1, rgb(L.low));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // The sun low over the reeds at dawn and dusk; the moon by night.
  const r = seeded(7);
  const horizon = H * 0.88;
  if (L.night) {
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(255,246,224,${0.15 + r() * 0.45})`;
      ctx.beginPath();
      ctx.arc(r() * W, r() * H * 0.6, 0.4 + r() * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    const mx = W * 0.78, my = H * 0.2, mr = Math.max(14, Math.min(W, H) * 0.028);
    const mg = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 5);
    mg.addColorStop(0, 'rgba(240,236,214,0.28)');
    mg.addColorStop(1, 'rgba(240,236,214,0)');
    ctx.fillStyle = mg;
    ctx.fillRect(mx - mr * 5, my - mr * 5, mr * 10, mr * 10);
    ctx.fillStyle = '#efe9d6';
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
  } else {
    // Strongest just after sunrise and around sunset.
    const warm = Math.max(0, 1 - Math.abs(L.h - 6.8) / 2) + Math.max(0, 1 - Math.abs(L.h - 18.7) / 2);
    const sx = W * 0.32, sy = horizon - H * 0.02;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(W, H) * 0.55);
    sg.addColorStop(0, `rgba(255,214,150,${0.15 + 0.5 * Math.min(1, warm)})`);
    sg.addColorStop(0.35, `rgba(255,190,130,${0.1 * Math.min(1, warm)})`);
    sg.addColorStop(1, 'rgba(255,190,130,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, H);
  }

  // A far tree line, then the reed bed in front.
  const ink = mix(L.low, [20, 18, 24], L.night ? 0.75 : 0.62);
  const far = mix(L.low, ink, 0.45);
  ctx.fillStyle = rgb(far);
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 6) {
    const y = horizon - H * 0.012 - (Math.sin(x * 0.011) * 0.5 + Math.sin(x * 0.037 + 1.3) * 0.3 + 0.8) * H * 0.018;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  // The reed bed's floor: a soft darkening, not a slab.
  const fg = ctx.createLinearGradient(0, horizon, 0, H);
  fg.addColorStop(0, rgb(ink, 0));
  fg.addColorStop(0.5, rgb(ink, 0.85));
  fg.addColorStop(1, rgb(ink, 1));
  ctx.fillStyle = fg;
  ctx.fillRect(0, horizon, W, H - horizon);
  // Reeds: thin, slightly bowed, crowding together, a few with heads.
  ctx.strokeStyle = rgb(ink);
  ctx.lineCap = 'round';
  const n = Math.round(W / 3.2);
  for (let i = 0; i < n; i++) {
    const x = r() * W;
    const tall = H * (0.05 + r() * 0.08);
    const base = H + 2;
    const lean = (r() - 0.4) * tall * 0.35;
    ctx.lineWidth = 0.8 + r() * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.quadraticCurveTo(x + lean * 0.3, base - tall * 0.6, x + lean, base - tall);
    ctx.stroke();
    if (r() < 0.18) {
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(x + lean, base - tall);
      ctx.lineTo(x + lean * 1.15, base - tall - H * 0.014);
      ctx.stroke();
    }
  }
}
