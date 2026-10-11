import { useCallback, useEffect, useRef, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════
// Screensaver: the board as something to rest your eyes on.
//
//   Pond settings → Screensaver, or open /?screen=1
//
// Full screen, the screen kept awake, every button hidden, and the
// board drifting slowly from zone to zone (about 40s on each, a slow
// glide between). Touching or moving shows a small Exit for a moment;
// Escape (or leaving full screen) ends it. Scroll yourself and the tour
// waits a minute before carrying on. Reduced motion: no tour, it stays.
// ═══════════════════════════════════════════════════════════════════

const DWELL = 40000, GLIDE = 7000, WAIT = 60000;
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

export function useScreensaver(contentRef) {
  const [on, setOn] = useState(() => {
    try { return new URLSearchParams(location.search).get('screen') === '1'; } catch { return false; }
  });
  const [awake, setAwake] = useState(false);   // the Exit pill showing
  const viaFullscreen = useRef(false);

  const start = useCallback(() => {
    setOn(true);
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen().then(() => { viaFullscreen.current = true; }).catch(() => {});
    }
  }, []);

  const stop = useCallback(() => {
    setOn(false);
    viaFullscreen.current = false;
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    try {
      const u = new URL(location.href);
      if (u.searchParams.has('screen')) { u.searchParams.delete('screen'); history.replaceState(null, '', u); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!on) return undefined;
    const root = document.documentElement;
    root.classList.add('is-screen');

    // Keep the screen awake (re-asked when the tab comes back).
    let lock = null;
    const ask = () => { navigator.wakeLock?.request('screen').then((l) => { lock = l; }).catch(() => {}); };
    ask();
    const onVis = () => { if (document.visibilityState === 'visible') ask(); };
    document.addEventListener('visibilitychange', onVis);

    // Leaving full screen (Esc on desktop) ends the screensaver.
    const onFs = () => { if (viaFullscreen.current && !document.fullscreenElement) stop(); };
    document.addEventListener('fullscreenchange', onFs);
    const onKey = (e) => { if (e.key === 'Escape') stop(); };
    window.addEventListener('keydown', onKey);

    // A touch or a move shows Exit for a few seconds, and the cursor.
    let idleT = 0;
    const wake = () => {
      setAwake(true);
      root.classList.remove('is-idle');
      clearTimeout(idleT);
      idleT = setTimeout(() => { setAwake(false); root.classList.add('is-idle'); }, 3500);
    };
    window.addEventListener('pointermove', wake, { passive: true });
    window.addEventListener('pointerdown', wake, { passive: true });
    idleT = setTimeout(() => root.classList.add('is-idle'), 3500);

    // The slow tour: top, then each zone in turn.
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, tourT = 0, i = 0, held = 0;
    const stops = () => {
      const secs = contentRef.current ? [...contentRef.current.querySelectorAll(':scope > section')] : [];
      return [0, ...secs.map((s) => Math.max(0, s.getBoundingClientRect().top + window.scrollY - (window.innerHeight - s.offsetHeight) / 2))];
    };
    const glide = (to) => {
      const from = window.scrollY, t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / GLIDE);
        window.scrollTo(0, from + (to - from) * ease(k));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(step);
    };
    const next = () => {
      if (Date.now() < held) { tourT = setTimeout(next, held - Date.now()); return; }
      const s = stops();
      i = (i + 1) % s.length;
      glide(s[i]);
      tourT = setTimeout(next, DWELL + GLIDE);
    };
    const hold = () => { held = Date.now() + WAIT; cancelAnimationFrame(raf); };
    if (!reduced) {
      tourT = setTimeout(next, DWELL);
      window.addEventListener('wheel', hold, { passive: true });
      window.addEventListener('touchmove', hold, { passive: true });
    }

    return () => {
      root.classList.remove('is-screen', 'is-idle');
      lock?.release?.().catch?.(() => {});
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('fullscreenchange', onFs);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('wheel', hold);
      window.removeEventListener('touchmove', hold);
      clearTimeout(idleT);
      clearTimeout(tourT);
      cancelAnimationFrame(raf);
    };
  }, [on, stop, contentRef]);

  return { on, start, stop, awake };
}

// Styles for the mode: hide the chrome; hide the cursor when idle.
export const SCREEN_CSS = `
  html.is-screen .vb-chrome,
  html.is-screen .pond-settings,
  html.is-screen .pond-today-chip,
  html.is-screen .shared-banner { display: none !important; }
  html.is-screen.is-idle, html.is-screen.is-idle * { cursor: none !important; }
  .screen-exit {
    position: fixed; left: 50%; bottom: calc(18px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%);
    z-index: 40; font: 600 12px/1 Manrope, system-ui, sans-serif; letter-spacing: 0.14em; text-transform: uppercase;
    color: #F1E6D2; background: rgba(10, 32, 38, 0.78); border: 1px solid rgba(255,255,255,0.18);
    border-radius: 999px; padding: 12px 18px; min-height: 44px; cursor: pointer;
    opacity: 0; pointer-events: none; transition: opacity 0.6s ease;
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  }
  .screen-exit.is-shown { opacity: 1; pointer-events: auto; }
`;
