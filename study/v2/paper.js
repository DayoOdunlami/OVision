import { rng, fbm, noise2 } from './noise.js';

// ═══════════════════════════════════════════════════════════════════
// paper.js — the paper everything is painted on.
//
// One sheet for every dial step: it's what makes the pond, the garden
// and the hills look like one hand. Made once, in code:
//   - tone      a slow, cloudy unevenness, as handmade paper has
//   - fibres    short curved hairs, a few darker, most lighter
//   - tooth     fine grain that catches ink at the edge of a stroke
// It is laid over the painting with multiply, so ink and wash sink into
// it rather than sitting on top of it, and it never moves.
// ═══════════════════════════════════════════════════════════════════

export function grainTile(size = 384, seed = 7) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const img = x.createImageData(size, size);
  const d = img.data;
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      // Tileable by sampling noise on a torus-ish wrap (blend the edges).
      const u = i / size, v = j / size;
      const t = fbm(u * 6, v * 6, seed, 4) * (1 - u) * (1 - v)
        + fbm((u - 1) * 6, v * 6, seed, 4) * u * (1 - v)
        + fbm(u * 6, (v - 1) * 6, seed, 4) * (1 - u) * v
        + fbm((u - 1) * 6, (v - 1) * 6, seed, 4) * u * v;
      const tooth = noise2(i * 0.9, j * 0.9, seed + 3);
      let g = 255 - 14 * t - 16 * tooth * tooth;
      const k = (j * size + i) * 4;
      d[k] = g; d[k + 1] = g - 1; d[k + 2] = g - 4; d[k + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  // Fibres: short curved hairs, light and dark.
  const r = rng(seed * 31);
  for (let n = 0; n < size * 0.9; n++) {
    let px = r() * size, py = r() * size, a = r() * Math.PI * 2;
    const len = 6 + r() * 26;
    const dark = r() < 0.35;
    x.strokeStyle = dark ? `rgba(120,104,84,${0.05 + r() * 0.07})` : `rgba(255,255,250,${0.25 + r() * 0.3})`;
    x.lineWidth = 0.4 + r() * 0.6;
    x.beginPath();
    x.moveTo(px, py);
    for (let s = 0; s < len; s += 2) {
      a += (r() - 0.5) * 0.5;
      px += Math.cos(a) * 2; py += Math.sin(a) * 2;
      x.lineTo(px, py);
    }
    x.stroke();
  }
  // A few specks of something in the pulp.
  for (let n = 0; n < size * 0.05; n++) {
    x.fillStyle = `rgba(90,78,64,${0.08 + r() * 0.12})`;
    x.beginPath();
    x.arc(r() * size, r() * size, 0.4 + r() * 0.7, 0, Math.PI * 2);
    x.fill();
  }
  return c;
}

// Ink isn't a flat colour: where it soaks in it's dense, where the brush
// skims it's broken. A small tile of slightly uneven ink, used as the
// fill of every moving stroke (the koi), fixed to the paper.
export function inkTile(rgb = [24, 22, 20], size = 128, seed = 11) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const img = x.createImageData(size, size);
  const d = img.data;
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const u = i / size, v = j / size;
      const t = fbm(u * 8, v * 8, seed, 3) * (1 - u) * (1 - v) + fbm((u - 1) * 8, v * 8, seed, 3) * u * (1 - v)
        + fbm(u * 8, (v - 1) * 8, seed, 3) * (1 - u) * v + fbm((u - 1) * 8, (v - 1) * 8, seed, 3) * u * v;
      const grain = noise2(i * 1.3, j * 1.3, seed + 5);
      const k = (j * size + i) * 4;
      d[k] = rgb[0]; d[k + 1] = rgb[1]; d[k + 2] = rgb[2];
      d[k + 3] = Math.max(0, Math.min(255, 255 * (0.72 + 0.28 * t - (grain > 0.82 ? 0.45 : 0))));
    }
  }
  x.putImageData(img, 0, 0);
  return c;
}
