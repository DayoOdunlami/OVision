// ═══════════════════════════════════════════════════════════════════
// One wind for the whole world (see the abide-direction skill).
//
// Everything that moves on its own — grass, leaves, thorns, clouds,
// falling leaves, the vineyard — takes its motion from here, so the
// scene moves together like a place rather than a set of effects. Gusts
// travel across the screen from left to right: neighbours lean
// together, a moment apart.
//
// While abiding, the wind follows the breath: it swells on the
// in-breath and settles on the out-breath, so the world breathes with
// you. While the verse is showing it falls to a whisper (`calm`), so
// the words are read in stillness.
// ═══════════════════════════════════════════════════════════════════

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

export class Wind {
  constructor({ reduced = false } = {}) {
    this.reduced = reduced;
    this.t = 0;
    this.calm = 1;        // 1 = full life, low = stillness for reading
    this.breath = 0.5;    // 0 = out, 1 = in (smoothed)
    this.breathing = 0;   // how much the breath is leading (0..1)
  }

  // calm: target 0..1; breath: 'in' | 'out' | '' (not abiding)
  step(dt, { calm = 1, breath = '' } = {}) {
    this.t += dt;
    this.calm += (calm - this.calm) * Math.min(1, dt * 0.8);
    const lead = breath ? 1 : 0;
    this.breathing += (lead - this.breathing) * Math.min(1, dt * 0.6);
    if (breath) {
      // A breath in takes ~4s to fill, out ~6s to empty.
      const target = breath === 'in' ? 1 : 0;
      this.breath += (target - this.breath) * Math.min(1, dt * (breath === 'in' ? 0.7 : 0.45));
    }
  }

  // Wind strength at a screen x, 0 (still) → 1 (a good gust).
  at(x = 0) {
    if (this.reduced) return 0;
    const t = this.t, k = x * 0.0035;
    // Three slow travelling waves at unrelated rates: never repeats
    // noticeably, never metronomic.
    const n = Math.sin(t * 0.31 - k) * 0.5
      + Math.sin(t * 0.53 - k * 1.6 + 1.3) * 0.3
      + Math.sin(t * 0.11 - k * 0.45 + 2.1) * 0.6;
    const gust = clamp01((n + 1.4) / 2.8);
    let w = 0.18 + 0.82 * gust * gust;
    // The breath leads while abiding.
    const b = 0.15 + 0.85 * this.breath;
    w = w + (b - w) * this.breathing * 0.85;
    return w * (0.25 + 0.75 * this.calm);
  }

  // A sway angle for something rooted at x (radians, leaning right),
  // with a little flutter of its own so neighbours aren't identical.
  sway(x, amount = 0.08, phase = 0) {
    if (this.reduced) return 0;
    const w = this.at(x);
    const flutter = Math.sin(this.t * (1.7 + (phase % 1) * 0.6) + phase * 6.28) * 0.18 * w;
    return amount * (w * 0.9 + flutter) * (0.4 + 0.6 * this.calm);
  }

  // Mean drift for things carried by the air (px/s scale factor).
  drift() {
    return this.reduced ? 0 : 0.35 + this.at(0) * 1.3;
  }
}
