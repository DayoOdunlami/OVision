import { useEffect, useRef } from 'react';
import SpineFish, {
  buildPondMix,
  buildPondMixFromCounts,
  ShadingMode,
} from '../SpineFish.js';
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
  // Optional per-variety count override, e.g. { chagoi: 1, ogon: 1,
  // shiro: 1 }. When present, the pond is populated *exactly* from
  // these counts (ignoring fishMin/fishMax). When null/undefined the
  // density-based auto mix (buildPondMix) is used as before.
  mix = null,
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
    // Same caching pattern for Full attractors (fish swell near the
    // word "Full"). Shares the refresh cadence with marrow.
    fullTargets: [],
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
      // If the caller pinned explicit counts (admin panel), honour
      // them exactly. Otherwise fall back to the viewport-scaled auto
      // mix. `mix` is a closed-over prop so changes trigger a React
      // re-render which remounts this effect.
      const hasCountOverride =
        mix &&
        typeof mix === 'object' &&
        Object.values(mix).reduce((a, b) => a + (b | 0), 0) > 0;
      const varieties = hasCountOverride
        ? buildPondMixFromCounts(mix)
        : (() => {
            const area = w * h;
            const count = Math.max(
              fishMin,
              Math.min(fishMax, Math.round(area / 260000)),
            );
            return buildPondMix(count);
          })();
      stateRef.current.fish = varieties.map((v) => new SpineFish(w, h, v));

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

      // ── Attractor targets (Marrow tint + Full swell) ──────────
      // Cache element centres (viewport coords = canvas coords since
      // the canvas is position:fixed inset:0). Refresh slowly — koi
      // don't move fast enough to need per-frame DOM rect reads.
      if (t - s.marrowRefreshAt > 12) {
        s.marrowRefreshAt = t;

        s.marrowTargets = [];
        document.querySelectorAll('[data-marrow-attractor]').forEach((n) => {
          const r = n.getBoundingClientRect();
          if (r.bottom < -400 || r.top > H + 400) return;
          s.marrowTargets.push({
            cx: r.left + r.width / 2,
            cy: r.top + r.height / 2,
            radius: Math.max(320, Math.min(560, r.width * 1.05)),
          });
        });

        // Full attractors — scale koi up near the centre, down far
        // away. maxScale is how fat a fish gets at the bullseye;
        // minScale is how lean it is outside the radius (a mild
        // shrink so the contrast reads in both directions). Radius
        // is generous so the swell reads as you swim into the word
        // rather than popping at the letter edge.
        s.fullTargets = [];
        document.querySelectorAll('[data-full-attractor]').forEach((n) => {
          const r = n.getBoundingClientRect();
          if (r.bottom < -600 || r.top > H + 600) return;
          s.fullTargets.push({
            cx: r.left + r.width / 2,
            cy: r.top + r.height / 2,
            radius: Math.max(360, Math.min(680, r.width * 1.15)),
            maxScale: 1.85,  // centre: ~85% larger
            minScale: 0.78,  // far:   ~22% smaller
            influenceRadius: Math.max(720, Math.min(1200, r.width * 2.2)),
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
      // Per-fish proximity scale driven by Full attractors. Walks
      // each full target and takes the *highest* scale the fish
      // qualifies for (no additive compounding, so overlapping Full
      // words don't explode the koi). Outside every target the
      // resolved scale stays at 1.0, meaning "ambient normal size".
      const resolveFullScale = (fish) => {
        if (!s.fullTargets.length) return 1;
        let best = 1;
        // Use the head as the fish's "centre". It's the most stable
        // point and it's what the user's eye tracks.
        const hx = fish.head.x;
        const hy = fish.head.y;
        for (const ft of s.fullTargets) {
          const d = Math.hypot(hx - ft.cx, hy - ft.cy);
          let scale;
          if (d >= ft.influenceRadius) {
            scale = ft.minScale;
          } else if (d <= ft.radius * 0.25) {
            scale = ft.maxScale;
          } else if (d <= ft.radius) {
            // Inside the swell zone — ease from maxScale at the core
            // to 1.0 at the radius edge (smoothstep, not linear, so
            // the swell feels more like magnetism than a ramp).
            const u = (d - ft.radius * 0.25) / (ft.radius * 0.75);
            const k = 1 - u * u * (3 - 2 * u);
            scale = 1 + (ft.maxScale - 1) * k;
          } else {
            // Between radius and influenceRadius — ease from 1.0
            // down to minScale. Same smoothstep for symmetry.
            const u = (d - ft.radius) / (ft.influenceRadius - ft.radius);
            const k = u * u * (3 - 2 * u);
            scale = 1 - (1 - ft.minScale) * k;
          }
          if (scale > best) best = scale;
        }
        return best;
      };

      const ambient = [];
      for (const f of s.fish) {
        f.update(W, H, s.cur, { food: [], onBreak: () => {} });

        const scale = resolveFullScale(f);
        if (scale !== 1) {
          offCtx.save();
          offCtx.translate(f.head.x, f.head.y);
          offCtx.scale(scale, scale);
          offCtx.translate(-f.head.x, -f.head.y);
          f.draw(offCtx);
          offCtx.restore();
        } else {
          f.draw(offCtx);
        }

        // Publish spine points with their *apparent* radius — i.e.
        // the actual pixel size on screen, scaled by the Full swell.
        // FlourishZone uses this to size particle repulsion, so a
        // chagoi fattened by the Full word also disperses particles
        // in a wider arc.
        const push = (px, py, pr) => {
          ambient.push({
            x: f.head.x + (px - f.head.x) * scale,
            y: f.head.y + (py - f.head.y) * scale,
            r: (pr || 6) * scale,
          });
        };

        push(f.mouth.x, f.mouth.y, f.mouth.radius || 6);
        push(f.head.x, f.head.y, f.head.radius || 10);

        if (f.parts && f.parts.length) {
          for (let i = 0; i < f.parts.length; i += 2) {
            const p = f.parts[i];
            if (p) push(p.x, p.y, p.radius || 8);
          }
        }

        const midRow = f.tail?.pieces?.[2];
        if (midRow && midRow.length) {
          const mid = midRow[Math.floor(midRow.length / 2)];
          if (mid) push(mid.x, mid.y, 6);
          const tip = midRow[midRow.length - 1];
          if (tip) push(tip.x, tip.y, 4);
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
    // `mix` is intentionally included so that changing the admin
    // panel's per-variety counts tears down and rebuilds the pond
    // with the new fish. React useEffect compares object identity,
    // so PosterPond must only pass a fresh object when the counts
    // actually change (which it does — counts live in state).
  }, [palette, interactive, fishMin, fishMax, skipPads, mix]);

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
