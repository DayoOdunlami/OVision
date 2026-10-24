import { rng, stroke } from './brush.js';

// A distant glimpse, rather than a permanent animated sky. Each seeded
// 110-second interval has one small flight, with at least 88 seconds between
// appearances. The schedule needs no frame randomness or growing object list.
export function flightAt(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  const cycle = Math.floor(seconds / 110), random = rng(2727 + cycle * 811);
  const start = cycle * 110 + 46 + random() * 22;
  const progress = (seconds - start) / 18;
  if (progress < 0 || progress > 1) return null;
  return { progress, direction: random() < .5 ? 1 : -1, height: .115 + random() * .018, seed: cycle * 31 + 9100 };
}

export function paintDistantBirds(ctx, { W, H, time, wind, colour, night = false }) {
  if (wind?.reduced) return;
  const flight = flightAt(time);
  if (!flight) return;
  const { progress, direction, height, seed } = flight;
  const span = Math.max(2.4, Math.min(W, H) * .0065);
  const centre = direction > 0 ? .22 + progress * .32 : .78 - progress * .32;
  const fade = Math.min(1, progress * 6, (1 - progress) * 6);
  for (let i = 0; i < 2; i++) {
    const s = span * (i ? .72 : 1), x = W * centre - direction * i * span * 3.2;
    const gust = wind?.at ? wind.at(x) : .35;
    const y = H * height + i * span * 1.7 + (gust - .35) * 2;
    // Fold and drift share the plants' wind, with no private flapping clock.
    const fold = .3 + gust * .85;
    const alpha = fade * (night ? .28 : .35);
    stroke(ctx, [[x - s, y - s * fold, .18], [x - s * .45, y - s * .22, .72], [x, y, .3]], { width: Math.max(.65, s * .21), colour, alpha, dry: .5, seed: seed + i * 3 });
    stroke(ctx, [[x, y, .3], [x + s * .45, y - s * .18, .68], [x + s, y - s * fold * .82, .12]], { width: Math.max(.6, s * .19), colour, alpha, dry: .5, seed: seed + i * 3 + 1 });
  }
}
