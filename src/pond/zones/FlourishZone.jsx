import { useEffect, useRef } from 'react';
import { layoutHomesOnText, ParticleFish } from '../particles.js';

// ═══════════════════════════════════════════════════════════════════
// FlourishZone — the hero word "Flourish", rendered as REAL DOM text
// with a ring of reactive particles tracing the letter silhouettes.
//
// Why this architecture (vs the old "particles ARE the word"):
//   · Text is instantly legible at any scale.
//   · Particles are decoration, not content — they can move freely
//     (scatter, return) without the word ever becoming unreadable.
//   · Both variants (Bubbles, Particles) behave the same way:
//       - cursor near particle → hard scatter
//       - ambient pond koi near particle → hard scatter
//       - no source → spring back to home along the letter edge
//
// Ambient fish positions are published by PondCanvas onto
// window.__ambientFish as viewport coords; we convert to our canvas-
// local coords each frame and feed them into the repel pulse.
// ═══════════════════════════════════════════════════════════════════

const HERO_FONT = 'italic 900 260px "Fraunces", Georgia, serif';

// Per-variant packing for the EDGE sampler (not fill). Edge pixel
// counts are roughly 1/4 of fill pixel counts, so caps are lower.
const VARIANT_CONFIG = {
  bubble:   { density: 4, maxCount: 320, jitter: 1.1, strokeDistance: 4 },
  particle: { density: 2, maxCount: 620, jitter: 0.6, strokeDistance: 3 },
};

// Scatter tuning — radius + push strength per source.
// Cursor is focused interaction, so it gets a stronger, tighter pulse.
// Cursor stays strong.
const CURSOR_REPEL = { radius: 110, strength: 4.5 };
// Per-spine-point repel. PondCanvas emits one point per body segment
// along each ambient fish (mouth, head, spine, tail), each carrying
// its local radius. We scale the repel radius off that so the
// midsection pushes in a wider arc than the thin tail, and a fat
// koi displaces more particles than a shiro. Strength is lower
// per-point because many points now overlap over the same fish.
const FISH_REPEL_RADIUS_MULT = 8.5;   // body-radius → scatter radius
const FISH_REPEL_MIN_RADIUS  = 60;
const FISH_REPEL_STRENGTH    = 2.2;

export default function FlourishZone({
  text = 'Flourish',
  variant = 'bubble',
  cadence = 'Creativity · Joy · Faithfulness',
  verse,
  anchor,
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef({
    fish: [],       // EdgeParticle instances
    cursor: { x: -9999, y: -9999 },
    raf: 0,
    dims: { w: 0, h: 0 },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;

    const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.bubble;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(320, rect.width || wrap.clientWidth || 320);
      const h = Math.max(220, rect.height || wrap.clientHeight || 260);
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      stateRef.current.dims = { w, h };

      const maxWidth = Math.min(w * 0.88, 1200);
      const layout = layoutHomesOnText({
        text,
        font: HERO_FONT,
        maxWidth,
        density: cfg.density,
        maxCount: cfg.maxCount,
        jitter: cfg.jitter,
        strokeDistance: cfg.strokeDistance,
      });
      const cx = w / 2;
      const cy = h / 2;
      const homes = layout.points.map((p) => ({ x: cx + p.x, y: cy + p.y }));

      const existing = stateRef.current.fish;
      // Re-seed when count changes or the mode doesn't match the current
      // variant (the ParticleFish constructor captures mode from opts).
      if (existing.length !== homes.length || (existing[0] && existing[0].mode !== variant)) {
        stateRef.current.fish = homes.map((hm) => new ParticleFish(hm.x, hm.y, { mode: variant }));
      } else {
        existing.forEach((f, i) => f.setHome(homes[i].x, homes[i].y));
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (!disposed) resize(); });
    }

    let inView = true;
    const io = new IntersectionObserver(
      ([entry]) => { inView = entry.isIntersecting; },
      { rootMargin: '200px' }
    );
    io.observe(wrap);

    const renderFrame = () => {
      const { w, h } = stateRef.current.dims;
      ctx.clearRect(0, 0, w, h);

      const fish = stateRef.current.fish;
      const cursor = stateRef.current.cursor;

      // Resolve ambient fish → this canvas' local coords, once per
      // frame. Cheaper than per-particle bounding-rect reads.
      const rect = canvas.getBoundingClientRect();
      // Convert every published spine point (mouth / head / body /
      // tail) to local coords, pre-compute its scatter radius from
      // its body radius, and cull anything that can't possibly reach
      // the canvas.
      const ambient = [];
      const src = window.__ambientFish || [];
      for (const p of src) {
        const ax = p.x - rect.left;
        const ay = p.y - rect.top;
        const ar = Math.max(
          FISH_REPEL_MIN_RADIUS,
          (p.r || 6) * FISH_REPEL_RADIUS_MULT,
        );
        if (ax < -ar || ax > w + ar) continue;
        if (ay < -ar || ay > h + ar) continue;
        ambient.push({ x: ax, y: ay, r: ar });
      }

      for (const f of fish) {
        if (cursor.x > -9000) {
          f.applyRepel(cursor.x, cursor.y, CURSOR_REPEL.radius, CURSOR_REPEL.strength);
        }
        for (const a of ambient) {
          f.applyRepel(a.x, a.y, a.r, FISH_REPEL_STRENGTH);
        }
        f.update();
        f.draw(ctx);
      }
    };

    const loop = () => {
      if (disposed) return;
      if (inView) renderFrame();
      stateRef.current.raf = requestAnimationFrame(loop);
    };

    if (reduced) {
      renderFrame();
    } else {
      loop();
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { stateRef.current.cursor = { x: -9999, y: -9999 }; };
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerleave', onLeave);

    return () => {
      disposed = true;
      cancelAnimationFrame(stateRef.current.raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', onLeave);
    };
  }, [text, variant]);

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '72vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4vw 6vw',
      }}
    >
      <div
        style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.75rem',
          letterSpacing: '0.42em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.78)',
          marginBottom: '1.2rem',
          textShadow: '0 1px 6px rgba(0,0,0,0.35)',
        }}
      >
        01 · Identity
      </div>

      <div
        ref={wrapRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1200,
          minHeight: 'clamp(220px, 40vh, 420px)',
          aspectRatio: '16 / 6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Reactive particle layer — fills the wrap, sits BEHIND the text
           so scattering particles don't visually punch through the letters. */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        {/* The word itself — real text, always legible. Positioned above
           the canvas so the ring particles hug its silhouette. */}
        <h1
          style={{
            position: 'relative',
            fontFamily: 'Fraunces, Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: 'clamp(4.2rem, 16vw, 11rem)',
            lineHeight: 1.0,
            margin: 0,
            color: 'rgba(255,255,255,0.92)',
            textShadow:
              '0 1px 0 rgba(10,28,36,0.35), 0 4px 18px rgba(8,22,28,0.28)',
            letterSpacing: '-0.015em',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {text}
        </h1>
      </div>

      <div
        style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.82rem',
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.72)',
          marginTop: '1.6rem',
          textShadow: '0 1px 6px rgba(0,0,0,0.35)',
        }}
      >
        {cadence}
      </div>

      {(verse || anchor) && (
        <div
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontStyle: 'italic',
            fontSize: '0.95rem',
            color: 'rgba(255,255,255,0.55)',
            marginTop: '0.6rem',
            textAlign: 'center',
            maxWidth: 520,
            textShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >
          {verse}
          {anchor && <span style={{ opacity: 0.6, marginLeft: 6 }}>— {anchor}</span>}
        </div>
      )}
    </section>
  );
}
