import { useEffect, useRef } from 'react';
import SpineFish, { buildPondMix, ShadingMode } from '../SpineFish.js';
import {
  CLEAR_POND,
  paintWater,
  paintCurrents,
  paintGodRays,
  paintCaustics,
  paintVignette,
  paintShimmer,
} from './water.js';
import {
  DEFAULT_PADS,
  drawPad,
  drawPadShadow,
  Blossom,
  Ripple,
} from './pads.js';

// ═══════════════════════════════════════════════════════════════════
// PondCanvas — single full-viewport canvas. Stage 2: full ambient
// pond (water gradient, currents, god rays, caustics, vignette,
// shimmer, lily pads, drifting blossoms) plus SpineFish swimming
// uniformly across the whole canvas. No zones yet.
//
// Performance notes:
//   · Fish count scales with viewport area, 7–11 max.
//   · SpineFish is imported from the existing src/SpineFish.js so the
//     Family Board and the Identity Board share one implementation.
//   · If measured FPS drops below 30 for 2s, the loop freezes to a
//     single static frame (accessibility + low-end devices).
//   · prefers-reduced-motion → static frame on first paint, no loop.
//
// Interaction (carried over from KoiBoard): pointer moves influence
// fish via cur ref; short tap drops a ripple. Long-press / food is
// deferred to Stage 5 — the identity board's hero-word ambient
// doesn't need the play-with-the-fish affordance.
// ═══════════════════════════════════════════════════════════════════

export default function PondCanvas({
  palette = CLEAR_POND,
  interactive = true,
  // Ambient fish density. Pond-view wants quieter (particle fish do
  // the hero work in the Flourish zone), Family Board can turn it up.
  fishMin = 4,
  fishMax = 6,
  // When true, skip lily pads — the Pond view places its own pads in
  // the Commitments row and doesn't want duplicates.
  skipPads = false,
}) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    fish: [],
    blossoms: [],
    ripples: [],
    cur: { x: -9999, y: -9999 },
    tick: 0,
    blossomCooldown: 400,
    // FPS watchdog
    fpsSamples: [],
    lastFrameAt: 0,
    frozen: false,
    // Cached list of marrow attractor rects (viewport coords). We
    // recompute these every ~12 frames because DOM rect reads trigger
    // layout, and koi move slowly enough that stale-by-200ms is fine.
    marrowTargets: [],
    marrowRefreshAt: 0,
    // Persistent offscreen canvas used as a "fish layer" so we can
    // apply the marrow tint as a source-atop mask and have it affect
    // only fish pixels, not the water behind them.
    fishLayer: null,
    fishLayerCtx: null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let disposed = false;

    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Identity board uses fish shading's symmetric mode by default so
    // the lighting reads coherently without implying a particular wind
    // direction on the paper. (The Family Board sets its own mode.)
    ShadingMode.current = 'symmetric';

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * DPR);
      canvas.height = Math.floor(rect.height * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const w = rect.width;
      const h = rect.height;
      const area = w * h;
      const count = Math.max(fishMin, Math.min(fishMax, Math.round(area / 260000)));
      const mix = buildPondMix(count);
      stateRef.current.fish = mix.map((v) => new SpineFish(w, h, v));

      // Fish-layer offscreen — same logical CSS size, same DPR transform.
      // Lazily created, resized whenever the viewport changes.
      if (!stateRef.current.fishLayer) {
        stateRef.current.fishLayer = document.createElement('canvas');
        stateRef.current.fishLayerCtx = stateRef.current.fishLayer.getContext('2d');
      }
      const off = stateRef.current.fishLayer;
      off.width = canvas.width;
      off.height = canvas.height;
      stateRef.current.fishLayerCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Render one frame (used by both animated loop and the static
    //    fallback for reduced-motion / underperformance).
    const paintFrame = () => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const s = stateRef.current;
      const t = s.tick;
      const ts = t * 0.0028;

      paintWater(ctx, W, H, palette);
      paintCurrents(ctx, W, H, ts, palette);

      // Pad floor-shadows (before lighting layers)
      if (!skipPads) {
        DEFAULT_PADS.forEach((p) => drawPadShadow(ctx, p.rx * W, p.ry * H, p.r, p.rot, t, p.phase));
      }

      paintGodRays(ctx, W, H, ts, palette);
      paintCaustics(ctx, W, H, ts, palette);

      // ── Marrow attractor targets ──────────────────────────────
      // Cache element centres (viewport coords = canvas coords since
      // the canvas is position:fixed inset:0). Refresh slowly — koi
      // don't move fast enough to need per-frame DOM rect reads.
      if (t - s.marrowRefreshAt > 12) {
        s.marrowRefreshAt = t;
        const nodes = document.querySelectorAll('[data-marrow-attractor]');
        s.marrowTargets = [];
        nodes.forEach((n) => {
          const r = n.getBoundingClientRect();
          if (r.bottom < -400 || r.top > H + 400) return; // cull offscreen
          s.marrowTargets.push({
            cx: r.left + r.width / 2,
            cy: r.top + r.height / 2,
            // Generous — user wants the tint to be obvious, not subtle.
            radius: Math.max(320, Math.min(560, r.width * 1.05)),
          });
        });
      }

      // ── Fish → offscreen layer ────────────────────────────────
      // Draw fish onto a dedicated offscreen canvas. This lets us
      // composite the marrow tint with source-atop, so the warm colour
      // only lands on fish pixels, not the water underneath.
      const off = s.fishLayer;
      const offCtx = s.fishLayerCtx;
      offCtx.clearRect(0, 0, W, H);

      // Publish ambient fish positions (viewport coords) for other
      // zones (FlourishZone reads this to make particles scatter
      // when a koi passes through). We emit the full spine — mouth,
      // head, each body Part, and the mid-tail — so every bit of the
      // fish pushes particles, not just the snout. Each point also
      // carries its local radius so repel strength scales with body
      // thickness (a fat midsection pushes harder than a thin tail).
      const ambient = [];
      for (const f of s.fish) {
        f.update(W, H, s.cur, { food: [], onBreak: () => {} });
        f.draw(offCtx);

        // Mouth + head — snout first.
        ambient.push({ x: f.mouth.x, y: f.mouth.y, r: f.mouth.radius || 6 });
        ambient.push({ x: f.head.x, y: f.head.y, r: f.head.radius || 10 });

        // Spine parts — every 2nd part to keep the array small while
        // still covering the whole length.
        if (f.parts && f.parts.length) {
          for (let i = 0; i < f.parts.length; i += 2) {
            const p = f.parts[i];
            if (p) ambient.push({ x: p.x, y: p.y, r: p.radius || 8 });
          }
        }

        // Tail — sample the midline so the fin arc also disperses.
        const midRow = f.tail?.pieces?.[2];
        if (midRow && midRow.length) {
          const mid = midRow[Math.floor(midRow.length / 2)];
          if (mid) ambient.push({ x: mid.x, y: mid.y, r: 6 });
          const tip = midRow[midRow.length - 1];
          if (tip) ambient.push({ x: tip.x, y: tip.y, r: 4 });
        }
      }
      window.__ambientFish = ambient;

      // ── Marrow tint mask ──────────────────────────────────────
      // For each attractor, paint a radial crimson→amber disc onto the
      // fish layer with source-atop composite. Only fish pixels inside
      // the disc get coloured; water is untouched; the tint is strong
      // and unambiguous (the whole point).
      if (s.marrowTargets.length) {
        offCtx.save();
        offCtx.globalCompositeOperation = 'source-atop';
        for (const m of s.marrowTargets) {
          const g = offCtx.createRadialGradient(m.cx, m.cy, 0, m.cx, m.cy, m.radius);
          g.addColorStop(0.00, 'rgba(210, 52, 28, 0.92)');   // deep crimson core
          g.addColorStop(0.35, 'rgba(196, 68, 26, 0.70)');   // rust
          g.addColorStop(0.70, 'rgba(176, 82, 34, 0.35)');   // amber edge
          g.addColorStop(1.00, 'rgba(150, 70, 30, 0.00)');   // fade out
          offCtx.fillStyle = g;
          offCtx.fillRect(m.cx - m.radius, m.cy - m.radius, m.radius * 2, m.radius * 2);
        }
        offCtx.restore();
      }

      // Flatten the fish layer onto the main canvas.
      ctx.drawImage(off, 0, 0, W, H);

      // Ripples
      s.ripples = s.ripples.filter((r) => !r.isDead());
      s.ripples.forEach((r) => {
        r.update();
        r.draw(ctx);
      });

      // Drifting blossoms
      if (s.blossomCooldown <= 0 && s.blossoms.length < 2) {
        s.blossoms.push(new Blossom(W, H));
        s.blossomCooldown = 1100 + Math.random() * 900;
      }
      s.blossomCooldown--;
      s.blossoms = s.blossoms.filter((b) => !b.isOffscreen(W));
      for (const b of s.blossoms) {
        b.update();
        b.draw(ctx);
      }

      // Lily pads on top (surface layer)
      if (!skipPads) {
        DEFAULT_PADS.forEach((p) => drawPad(ctx, p, W, H, t));
      }

      paintVignette(ctx, W, H, palette);
      paintShimmer(ctx, W, H, ts, palette);
    };

    // Previous versions killed the loop permanently when FPS dipped.
    // On a fresh page load in Chrome, first-paint + font layout + zone
    // mount can push measured FPS under the floor for a few seconds,
    // which was triggering the freeze right after "initial load" — the
    // exact symptom the user kept reporting. We now never hard-freeze;
    // rAF is naturally throttled by the browser on slow devices, and a
    // slow pond is better UX than a dead pond. FPS samples are still
    // kept for optional diagnostics but never used to halt the loop.
    const loop = () => {
      if (disposed) return;
      const s = stateRef.current;
      s.tick++;

      const now = performance.now();
      if (s.lastFrameAt) {
        s.fpsSamples.push(1000 / (now - s.lastFrameAt));
        if (s.fpsSamples.length > 300) s.fpsSamples.shift();
      }
      s.lastFrameAt = now;

      paintFrame();
      raf = requestAnimationFrame(loop);
    };

    if (reduced) {
      // Paint one static frame, no loop.
      paintFrame();
    } else {
      loop();
    }

    // ── Interaction ──
    const onMove = (e) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      stateRef.current.cur = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => {
      stateRef.current.cur = { x: -9999, y: -9999 };
    };
    const onTap = (e) => {
      if (!interactive) return;
      if (reduced) return;
      const rect = canvas.getBoundingClientRect();
      stateRef.current.ripples.push(
        new Ripple(e.clientX - rect.left, e.clientY - rect.top)
      );
    };

    // Listen on window so pointer events bubble through the content
    // layer above the canvas (the canvas itself is pointer-events:none).
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    window.addEventListener('click', onTap);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('click', onTap);
    };
  }, [palette, interactive, fishMin, fishMax, skipPads]);

  return (
    <canvas
      ref={canvasRef}
      className="no-print"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
