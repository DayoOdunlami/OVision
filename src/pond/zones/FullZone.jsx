import { useEffect, useRef } from 'react';
import SpineFish from '../../SpineFish.js';

// ═══════════════════════════════════════════════════════════════════
// FullZone — season view.
//
// Two real koi orbit the hero word "Full" on two concentric ellipses.
// No food chase, no eating pauses — each frame we advance an angle
// and set the fish's target directly to a point slightly ahead of it
// on the ellipse. The spine physics does the rest: the fish swims
// toward the target, and because the target is always a fixed lead
// ahead, the fish continuously circles the word.
//
//   inner orbit → patriarch chagoi  (large, sizeScale 1.0)
//   outer orbit → smaller shiro     (sizeScale 0.7)
//
// We also force isIdle = false and zero wanderTimer each frame so
// the fish never decides to rest or wander off — its only job here
// is to keep orbiting.
// ═══════════════════════════════════════════════════════════════════

// Lead angle (radians) — how far ahead of the fish the target sits.
// Bigger lead → fish accelerates more; smaller → fish paces itself.
const INNER_LEAD = 0.75;
const OUTER_LEAD = 0.95;

export default function FullZone({ text = 'Full', cadence = 'Rooted · Honest · Resilient', verse, anchor }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const stateRef = useRef({
    fish: [],
    angles: { inner: 0, outer: Math.PI * 0.85 },
    raf: 0,
    lastT: 0,
    dims: { w: 0, h: 0 },
    cursor: { x: -9999, y: -9999 },
  });

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(360, rect.width || wrap.clientWidth || 360);
      const h = Math.max(280, rect.height || wrap.clientHeight || 280);
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      stateRef.current.dims = { w, h };

      if (stateRef.current.fish.length === 0) {
        // Patriarch — chagoi, warm brown, visibly PLUMP. The "Full"
        // metaphor needs a fish that looks well-fed at a glance.
        const inner = new SpineFish(w, h, {
          name: 'chagoi',
          body: [206, 124, 64], dorsal: [150, 82, 40], fin: [232, 168, 110],
          personality: 'curious', sizeScale: 1.32, spots: [],
        });
        // Skittish outer — shiro, smaller so the contrast reads.
        const outer = new SpineFish(w, h, {
          name: 'shiro',
          body: [248, 248, 244], dorsal: [210, 214, 220], fin: [255, 255, 252],
          personality: 'normal', sizeScale: 0.62, spots: [],
        });
        inner.targetDepth = 0.12;
        outer.targetDepth = 0.14;
        stateRef.current.fish = [inner, outer];
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let inView = true;
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { rootMargin: '200px' });
    io.observe(wrap);

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { stateRef.current.cursor = { x: -9999, y: -9999 }; };
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerleave', onLeave);

    const render = (time) => {
      if (disposed) return;
      const t = time / 1000;
      const dt = Math.min(0.05, t - (stateRef.current.lastT || t));
      stateRef.current.lastT = t;

      if (inView) {
        const { w, h } = stateRef.current.dims;
        ctx.clearRect(0, 0, w, h);

        const fishArr = stateRef.current.fish;
        if (!Array.isArray(fishArr) || fishArr.length < 2) {
          stateRef.current.raf = requestAnimationFrame(render);
          return;
        }
        const [inner, outer] = fishArr;

        const cx = w / 2;
        const cy = h / 2;

        // Two concentric ellipses — inner tighter than outer. Rx > Ry
        // so the orbit reads as "around the word" rather than a full
        // page spin. Clamped so wide screens don't blow it out, and
        // Ry held well under h/2 so the fish never clip cadence above
        // or verse below the canvas.
        const maxRy = h * 0.36;
        const innerRx = Math.min(w * 0.28, 300);
        const innerRy = Math.min(innerRx * 0.42, maxRy * 0.78);
        const outerRx = Math.min(w * 0.38, 400);
        const outerRy = Math.min(outerRx * 0.44, maxRy);

        // Advance angles — inner faster (closer in → shorter path, so
        // a higher angular speed keeps the apparent speeds similar).
        const angles = stateRef.current.angles;
        angles.inner += dt * 0.52;
        angles.outer += dt * 0.32;

        // Drive each fish: set target to a point ahead on the ellipse,
        // zero the wander timer and wake it up, then call update with
        // no food array. The fish physics does a natural chase curve.
        const driveFish = (fish, angle, lead, rx, ry) => {
          const a = angle + lead;
          const tx = cx + Math.cos(a) * rx;
          const ty = cy + Math.sin(a) * ry;
          fish.target = { x: tx, y: ty, value: 1, getDistance(x, y) { return Math.hypot(tx - x, ty - y); } };
          fish.wanderTimer = 0;
          fish.isIdle = false;
          fish.fedCooldown = 0;
          fish.energy = Math.max(fish.energy, 0.5);
          fish.update(w, h, stateRef.current.cursor);
        };
        driveFish(inner, angles.inner, INNER_LEAD, innerRx, innerRy);
        driveFish(outer, angles.outer, OUTER_LEAD, outerRx, outerRy);

        // Draw outer first (further → behind), then inner on top.
        outer.draw(ctx);
        inner.draw(ctx);
      }
      stateRef.current.raf = requestAnimationFrame(render);
    };

    if (reduced) {
      const { w, h } = stateRef.current.dims;
      ctx.clearRect(0, 0, w, h);
      stateRef.current.fish.forEach((f) => f.draw(ctx));
    } else {
      stateRef.current.raf = requestAnimationFrame(render);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(stateRef.current.raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '74vh',
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
        02 · Season
      </div>

      <div
        ref={wrapRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1200,
          minHeight: 'clamp(280px, 50vh, 520px)',
          aspectRatio: '16 / 8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />
        <h1
          style={{
            position: 'relative',
            fontFamily: 'Fraunces, Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: 'clamp(5rem, 20vw, 13rem)',
            lineHeight: 0.9,
            margin: 0,
            background: 'linear-gradient(180deg, #ffd58a 0%, #d66524 58%, #7a2914 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 4px 24px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
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
            maxWidth: 540,
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
