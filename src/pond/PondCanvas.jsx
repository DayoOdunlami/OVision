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
// PondCanvas — one fixed full-viewport canvas behind the whole board.
// Paints the ambient pond (water gradient, currents, god rays,
// caustics, vignette, shimmer, drifting blossoms, tap ripples) and the
// koi themselves.
//
// The zones above don't own canvases. They publish *attractors* as DOM
// data attributes and this loop reads them each frame:
//
//   [data-full-attractor]    → koi swell with proximity, within a range
//                              the zone sets from prayer consistency
//   [data-marrow-attractor]  → koi passing close take the word's colour
//
// It also publishes two things outward:
//
//   window.__ambientFish     → spine points + radii, consumed by
//                              FlourishZone (particle scatter) and
//                              CommitmentsZone (lily-pad wake)
//   name labels              → for koi tagged with a `personName`,
//                              drawn on the water above the fish
//
// Performance / robustness notes:
//   · Fish count scales with viewport area, clamped by fishMin/fishMax,
//     plus one guaranteed koi per named person.
//   · Koi are drawn back-to-front by their own `depth` value, so the
//     pond reads as a volume.
//   · The loop never hard-freezes on low FPS. An earlier version killed
//     it below 30fps for 2s, which fired during first paint and font
//     layout on a cold load — the "fish keep freezing" symptom. rAF is
//     throttled by the browser anyway; a slow pond beats a dead one.
//   · A zero-size viewport (hidden tab, collapsed pane, tablet waking
//     from sleep) is skipped rather than painted, because drawing from
//     a 0×0 canvas throws and used to take down the whole React tree.
//   · prefers-reduced-motion → one static frame, retried until the
//     element is actually measurable, then no loop.
//
// Interaction: pointer moves influence koi via the `cur` ref; a tap
// drops a ripple. Feeding (`env.food`) is wired but unused here — the
// identity board doesn't need the play-with-the-fish affordance.
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
  // CONCEPT — named koi. An array of { koi: 'sanke', person: 'Bella' }.
  // Each entry guarantees one koi of that variety exists in the pond
  // and tags it with the person's name, which gets drawn on the water
  // beside the fish. Fed from the prayer surface's rota, so the koi
  // carrying a name is whoever is being prayed for today.
  namedKoi = [],
  // CONCEPT — pair today's two named koi so they swim together, per
  // the original brief's Zone 04 note: "two fish swimming in
  // synchronised pairs — a metaphor for knowing-and-being-known".
  pairToday = false,
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
    // Subset of `fish` that carry a personName, kept so the label pass
    // and the pairing nudge don't have to re-scan every fish.
    namedFish: [],
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
      // Never size a backing store to zero — see the guard in
      // paintFrame. A 1px floor keeps every canvas a legal image
      // source even if resize runs while the element is unmeasurable.
      canvas.width = Math.max(1, Math.floor(rect.width * DPR));
      canvas.height = Math.max(1, Math.floor(rect.height * DPR));
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
      const baseVarieties = hasCountOverride
        ? buildPondMixFromCounts(mix)
        : (() => {
            const area = w * h;
            const count = Math.max(
              fishMin,
              Math.min(fishMax, Math.round(area / 260000)),
            );
            return buildPondMix(count);
          })();

      // Named koi are guaranteed present. If the ambient mix already
      // happens to contain that variety we reuse it rather than adding
      // a duplicate, so naming two people never quietly inflates the
      // fish count (and the frame cost) beyond what was asked for.
      const varieties = [...baseVarieties];
      const named = (namedKoi || []).filter((n) => n && n.koi && n.person);
      for (const n of named) {
        if (!varieties.some((v) => v.name === n.koi)) {
          const [extra] = buildPondMixFromCounts({ [n.koi]: 1 });
          if (extra) varieties.push(extra);
        }
      }

      // Koi are built at an absolute pixel size, which means on a phone
      // a single fish fills a third of the screen and the board reads as
      // an aquarium rather than a pond seen from above. Scale the whole
      // shoal down with the viewport. Cloning the variety (rather than
      // mutating it) matters — VARIETIES is a shared module-level array.
      const sizeFactor = Math.max(0.55, Math.min(1, w / 1000));
      const fish = varieties.map(
        (v) => new SpineFish(w, h, {
          ...v,
          sizeScale: (v.sizeScale || 1) * sizeFactor,
        }),
      );

      // Tag one fish per named person. First-match wins, and a fish
      // already claimed by someone else is skipped, so two people who
      // share a variety still get two distinct koi.
      stateRef.current.namedFish = [];
      for (const n of named) {
        const target = fish.find(
          (f) => f.variety?.name === n.koi && !f.personName,
        );
        if (target) {
          target.personName = n.person;
          stateRef.current.namedFish.push(target);
        }
      }

      stateRef.current.fish = fish;

      // Fish-layer offscreen — same logical CSS size, same DPR transform.
      // Lazily created, resized whenever the viewport changes.
      if (!stateRef.current.fishLayer) {
        stateRef.current.fishLayer = document.createElement('canvas');
        stateRef.current.fishLayerCtx = stateRef.current.fishLayer.getContext('2d');
      }
      const off = stateRef.current.fishLayer;
      off.width = Math.max(1, canvas.width);
      off.height = Math.max(1, canvas.height);
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

      // Bail on a zero-size frame. This happens for real: a hidden or
      // unloading document, a display:none ancestor, or the moment
      // between mount and first layout. Painting on through it throws
      // InvalidStateError from drawImage (a canvas of width or height 0
      // is not a valid image source), which killed the whole React tree
      // because there's no error boundary above this component.
      if (!(W > 0) || !(H > 0)) return false;
      if (!s.fishLayer || !(s.fishLayer.width > 0) || !(s.fishLayer.height > 0)) return false;
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
          // maxScale/minScale are published by FullZone as data
          // attributes, because how far the koi swell is driven by
          // prayer consistency rather than being a constant. Falls back
          // to the original fixed values when the attributes are
          // absent or unparseable.
          const dMax = Number(n.dataset.fullMax);
          const dMin = Number(n.dataset.fullMin);
          s.fullTargets.push({
            cx: r.left + r.width / 2,
            cy: r.top + r.height / 2,
            radius: Math.max(360, Math.min(680, r.width * 1.15)),
            maxScale: Number.isFinite(dMax) && dMax > 0 ? dMax : 1.85,
            minScale: Number.isFinite(dMin) && dMin > 0 ? dMin : 0.78,
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

      // ── Update everyone, then draw back-to-front ──────────────
      // Update and draw used to be one pass, which meant fish were
      // painted in array order and the `depth` value each fish already
      // maintains (0.25 near the surface → 0.65 deep) had no visual
      // consequence. Splitting the passes lets us sort by depth, so a
      // deep koi actually passes *behind* a shallow one and the pond
      // reads as a volume rather than a flat plane.
      for (const f of s.fish) {
        f.update(W, H, s.cur, { food: [], onBreak: () => {} });
      }

      // ── CONCEPT: pair today's two named koi ───────────────────
      // A light-touch follow rather than a real flocking rule: nudge
      // the follower's existing target to trail the leader at an
      // offset. We only do this when the follower is calm — a fleeing
      // or feeding fish keeps its own agenda, so a cursor jab still
      // scatters the pair and they re-form afterwards, which is the
      // behaviour we want anyway.
      if (pairToday && s.namedFish.length >= 2) {
        const [leader, follower] = s.namedFish;
        if (leader && follower && follower.fleeCooldown <= 0 && !follower.feedTarget) {
          const trail = 78;
          const ang = leader.parts?.[0]?.radian ?? 0;
          const tx = leader.mouth.x - Math.cos(ang) * trail;
          const ty = leader.mouth.y - Math.sin(ang) * trail + 34;
          if (follower.target) {
            // Ease rather than snap, so the follower swims into
            // formation instead of teleporting its aim point.
            follower.target.x += (tx - follower.target.x) * 0.06;
            follower.target.y += (ty - follower.target.y) * 0.06;
            follower.isIdle = false;
          }
        }
      }

      const drawOrder = [...s.fish].sort(
        (a, b) => (b.depth ?? 0.4) - (a.depth ?? 0.4),
      );

      const ambient = [];
      const labels = [];
      for (const f of drawOrder) {
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

        // Named koi get their label position recorded here (drawn
        // later, onto the main canvas, so the marrow tint mask can't
        // repaint the text).
        if (f.personName) {
          labels.push({
            name: f.personName,
            x: f.head.x,
            y: f.head.y,
            // Offset above the fish, scaled with the Full swell so the
            // label doesn't end up inside a fattened koi.
            lift: 26 * scale + 8,
          });
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

      // ── Name labels for the koi carrying today's names ────────
      // Drawn after the flatten so the marrow tint mask (which is
      // source-atop over fish pixels only) can't tint the text. A
      // label sits quiet by default and brightens as its koi enters
      // the marrow radius, which is the whole point: you watch the
      // name draw near and take the colour.
      if (labels.length) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '700 13px Manrope, system-ui, sans-serif';
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0.16em';

        for (const L of labels) {
          // Nearness to the closest marrow attractor, 0 (far) → 1 (at
          // the word). Drives both opacity and the warm tint.
          let heat = 0;
          for (const m of s.marrowTargets) {
            const d = Math.hypot(L.x - m.cx, L.y - m.cy);
            if (d < m.radius) {
              const k = 1 - d / m.radius;
              if (k > heat) heat = k;
            }
          }

          const text = L.name.toUpperCase();
          const y = L.y - L.lift;
          const w = ctx.measureText(text).width;
          const padX = 11;
          const padY = 6;
          // Quiet, but legible from across a kitchen — the earlier
          // 0.42 base was effectively invisible against sunlit water.
          const alpha = 0.72 + heat * 0.28;

          // Pill backing, so the label stays readable over both pale
          // sunlit water and the dark rim.
          ctx.globalAlpha = alpha * 0.92;
          ctx.fillStyle = heat > 0.02
            ? `rgba(74, 18, 8, ${0.68 + heat * 0.27})`
            : 'rgba(6, 30, 36, 0.62)';
          const bw = w + padX * 2;
          const bh = 13 + padY * 2;
          const r = bh / 2;
          ctx.beginPath();
          ctx.moveTo(L.x - bw / 2 + r, y - bh / 2);
          ctx.arcTo(L.x + bw / 2, y - bh / 2, L.x + bw / 2, y + bh / 2, r);
          ctx.arcTo(L.x + bw / 2, y + bh / 2, L.x - bw / 2, y + bh / 2, r);
          ctx.arcTo(L.x - bw / 2, y + bh / 2, L.x - bw / 2, y - bh / 2, r);
          ctx.arcTo(L.x - bw / 2, y - bh / 2, L.x + bw / 2, y - bh / 2, r);
          ctx.closePath();
          ctx.fill();

          ctx.globalAlpha = alpha;
          ctx.fillStyle = heat > 0.02
            ? `rgb(255, ${Math.round(226 - heat * 40)}, ${Math.round(198 - heat * 70)})`
            : 'rgba(240, 248, 245, 0.95)';
          ctx.fillText(text, L.x, y);
        }
        ctx.restore();
      }

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
      return true;
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
      // Paint one static frame, no loop. But if the element isn't
      // measurable yet — a hidden tab, a collapsed pane, a tablet
      // waking from sleep — that single frame would paint nothing and,
      // with no loop to come back, the pond would stay permanently
      // blank. So retry on animation frames until the first paint
      // actually lands, then stop.
      const paintOnce = () => {
        if (disposed) return;
        resize();
        if (!paintFrame()) raf = requestAnimationFrame(paintOnce);
      };
      paintOnce();
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
    // `namedKoi` must be a stable reference from the caller (PosterPond
    // memoises it) or this effect thrashes and the pond respawns every
    // render. `pairToday` is a boolean so it's safe as-is.
  }, [palette, interactive, fishMin, fishMax, skipPads, mix, namedKoi, pairToday]);

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
