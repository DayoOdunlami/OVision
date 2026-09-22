import { useEffect, useRef } from 'react';
import { buildVine, grownLength } from '../lib/vine.js';
import { drawStem, bakeStem, drawLeaf, drawBlossom } from '../lib/draw.js';

// ═══════════════════════════════════════════════════════════════════
// WordVine — a word written by a growing vine.
//
// The stem grows along the letters, easing out of each start, slowing
// through curves, its tip swaying as it feels its way; fresh growth is
// lime and darkens as it matures; leaves unfold behind the tip; tendrils curl off the ends; the dot of an i
// opens last as a blossom. Then it stays alive: leaves sway in a slow
// breeze, a hand passing through ruffles them, and the whole thing
// wavers in a still-water reflection below — the pond's edge.
//
// Each stretch of stem, once grown and matured, is drawn once into its
// own canvas and kept; each frame redraws only young growth, leaves and
// blossoms. With reduced motion it simply appears, grown and still.
// ═══════════════════════════════════════════════════════════════════

export default function WordVine({ word, playKey, onGrown, onDone }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const cbRef = useRef({ onGrown, onDone });
  cbRef.current = { onGrown, onDone };

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    const bake = document.createElement('canvas');
    const bctx = bake.getContext('2d');
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, dpr = 1, vine = null, axis = 0;
    let t = still ? 1e6 : 0;
    let grownSent = false, doneSent = false;
    const pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, at: 0 };

    const layout = () => {
      const r = wrap.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      // Cap the backing store: a big display at 2× is a lot of pixels.
      dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(5e6 / (W * H)));
      for (const c of [canvas, bake]) {
        c.width = Math.round(W * dpr);
        c.height = Math.round(H * dpr);
      }
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      // The word sits in the upper part; its reflection below.
      const wordH = H * 0.72;
      vine = buildVine(word, { x: 0, y: 0, w: W, h: wordH });
      axis = vine ? vine.bottom + vine.em * 0.03 : H;
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const frame = (dt) => {
      if (!vine) return;
      t += dt;
      const { stems, leaves, blossoms, base, em } = vine;
      const taper = base * 4;

      // Stems: pieces that have finished growing and darkening go into
      // the keep canvas once; only young growth is redrawn each frame.
      const live = stems.map((st) => {
        const g = grownLength(st, t);
        return [st, g, g > 0 ? bakeStem(bctx, st, g, t, taper) : 0];
      });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bake, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const [st, g, from] of live) if (g > 0 && !st.bakedAll) drawStem(ctx, st, g, t, taper, from);

      // Leaves: unfold, then sway — a slow breeze that rolls across the
      // word in gusts — and ruffle where a hand passes.
      const R = em * 0.32;
      const pAge = t - pointer.at;
      const pv = pAge < 0.12 ? 1 : 0;
      for (const lf of leaves) {
        const p = (t - lf.t0) / lf.dur;
        if (p <= 0) continue;
        if (!still) {
          const mx = lf.x + Math.cos(lf.ang) * lf.L * 0.6;
          const my = lf.y + Math.sin(lf.ang) * lf.L * 0.6;
          const d = Math.hypot(mx - pointer.x, my - pointer.y);
          if (pv && d < R) {
            const cross = (pointer.vx * -Math.sin(lf.ang) + pointer.vy * Math.cos(lf.ang)) / em;
            lf.av += cross * 7 * (1 - d / R) * dt;
          }
          lf.av += -lf.off * 18 * dt;
          lf.av *= Math.exp(-dt * 3.2);
          lf.off = Math.max(-0.7, Math.min(0.7, lf.off + lf.av * dt));
        }
        const settle = still ? 0 : Math.min(1, Math.max(0, p - 1));
        const gust = Math.pow(0.5 + 0.5 * Math.sin(t * 0.33 - (lf.x / em) * 0.8), 3);
        const sway = settle * (0.045 * Math.sin(t * 1.2 + lf.phase) + 0.08 * gust * Math.sin(t * 2.3 + lf.phase * 1.3));
        drawLeaf(ctx, lf, p, sway + lf.off, base, t);
      }
      for (const b of blossoms) drawBlossom(ctx, b, (t - b.t0) / 3, still ? 0 : t);

      // Reflection: the scene, flipped about the waterline, in thin
      // bands each pushed sideways by a slow ripple and fading with depth.
      const depth = Math.min(H - axis, (axis - vine.top) * 0.7);
      if (depth > 4) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const band = 2;
        for (let y = 0; y < depth; y += band) {
          const k = y / depth;
          ctx.globalAlpha = 0.24 * (1 - k) ** 1.5;
          const dx = still ? 0 : Math.sin(y * 0.11 - t * 1.4) * (0.6 + k * 4);
          const sy = (axis - y - band) * dpr;
          if (sy < 0) break;
          ctx.drawImage(canvas, 0, sy, canvas.width, band * dpr, dx * dpr, (axis + y) * dpr, canvas.width, band * dpr);
        }
        ctx.globalAlpha = 1;
      }

      if (!grownSent && t >= vine.grownAt) { grownSent = true; cbRef.current.onGrown?.(); }
      if (!doneSent && t >= vine.doneAt) { doneSent = true; cbRef.current.onDone?.(); }
    };

    layout();
    let raf = 0, last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      frame(dt);
      raf = requestAnimationFrame(loop);
    };
    if (still) frame(0);
    else raf = requestAnimationFrame(loop);

    // Resizing rebuilds the vine for the new size but keeps its age, so
    // a grown vine stays grown.
    let rt = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        bctx.setTransform(1, 0, 0, 1, 0, 0);
        layout();
        frame(0);
      }, 120);
    });
    ro.observe(wrap);

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const now = t;
      const gap = Math.max(1 / 120, now - pointer.at);
      if (pointer.x > -1e3) {
        pointer.vx = (x - pointer.x) / gap;
        pointer.vy = (y - pointer.y) / gap;
      }
      pointer.x = x; pointer.y = y; pointer.at = now;
    };
    const onLeave = () => { pointer.x = pointer.y = -1e4; pointer.vx = pointer.vy = 0; };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);

    if (import.meta.env.DEV) {
      window.__vineStep = (n = 60, dt = 1 / 60) => { for (let i = 0; i < n; i++) frame(dt); return { t, grownAt: vine?.grownAt, doneAt: vine?.doneAt }; };
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(rt);
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      if (import.meta.env.DEV) delete window.__vineStep;
    };
  }, [word, playKey]);

  return (
    <div ref={wrapRef} className="fl-vine">
      <canvas ref={canvasRef} role="img" aria-label={`The word “${word}”, written by a growing vine`} />
    </div>
  );
}
