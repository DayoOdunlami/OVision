import { lowerFirst } from '../board.js';
import { useEffect, useRef } from 'react';
import { VineScene } from './scene.js';

// ═══════════════════════════════════════════════════════════════════
// VineView — the family's board as a vine in a field (see scene.js).
//
// The same props as the pond, the same meanings. Touch a branch and it
// lifts towards your hand and its name rests in the air; touch a tag or
// a cutting and its words do the same; a hand passing ruffles the
// leaves. Loaded only when a screen shows the vine.
// ═══════════════════════════════════════════════════════════════════

const INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"], [data-no-feed]';

export default function VineView(props) {
  const canvasRef = useRef(null);
  const live = useRef(props);
  live.current = props;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const scene = new VineScene({ reduced });
    let W = 0, H = 0, raf = 0, last = performance.now(), stillKey = '';
    let lite = false, skip = false, acc = 0;
    const times = [];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      // A big tablet at 2× is a lot of pixels: cap the backing store.
      const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4.5e6 / (W * H)));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      scene.setSize(W, H, dpr);
      stillKey = '';
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const toLocal = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      return x >= 0 && y >= 0 && x <= r.width && y <= r.height ? { x, y } : null;
    };
    const blocked = (e) => live.current.paused || (e.target instanceof Element && e.target.closest(INTERACTIVE));
    let down = null;
    const onDown = (e) => {
      if (blocked(e)) return;
      const p = toLocal(e);
      if (p) { down = { ...p, at: performance.now() }; scene.move(p.x, p.y); }
    };
    const onMove = (e) => {
      if (live.current.paused) return;
      const p = toLocal(e);
      if (p) scene.move(p.x, p.y);
    };
    const onUp = (e) => {
      if (!down) return;
      const p = toLocal(e);
      const was = down;
      down = null;
      if (!p || Math.hypot(p.x - was.x, p.y - was.y) > 14 || performance.now() - was.at > 400) return;
      const h = scene.hit(p.x, p.y);
      if (h) {
        scene.say(h.kind === 'yes' ? { ...h, text: `Yes to ${lowerFirst(h.text)}` }
          : h.kind === 'no' ? { ...h, text: `No to ${lowerFirst(h.text)}` } : h);
        stillKey = '';
        navigator.vibrate?.(6);
      }
    };
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const L = live.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (L.paused) return;
      scene.set(L);
      if (reduced) {
        const key = scene.key + scene.taps.length + Math.floor(now / 1000);
        if (key === stillKey) return;
        stillKey = key;
      }
      // On a slow tablet, draw every other frame: the wind is slow enough
      // that nobody sees the difference, and the tablet stays cool.
      if (!lite && dt > 0) {
        times.push(dt);
        if (times.length === 60) {
          const sorted = [...times].sort((a, b) => a - b);
          if (sorted[30] > 0.024) lite = true;
          times.length = 0;
        }
      }
      skip = !skip;
      if (lite && skip) { acc += dt; return; }
      scene.step(dt + acc, { calm: L.calm ?? 1 });
      acc = 0;
      scene.draw(ctx);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  return <canvas ref={canvasRef} className="pond-canvas vine-canvas" aria-hidden="true" />;
}

