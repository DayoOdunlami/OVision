import { useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════
// Small shared pieces for the prayer surface.
// ═══════════════════════════════════════════════════════════════════

// Prayer strings carry a little authored HTML (name highlights, <em>).
// Every string comes from src/pray/data/prayers.js — nothing
// user-supplied is ever passed here — so rendering it raw is safe.
export function Html({ as: Tag = 'span', html, ...rest }) {
  return <Tag {...rest} dangerouslySetInnerHTML={{ __html: html }} />;
}

// The Greek/Hebrew note under a section. A native <details>, so it's
// keyboard- and screen-reader-accessible for free — and because React
// no longer rebuilds the page on every tap, an open note stays open.
export function Explore({ html }) {
  if (!html) return null;
  return (
    <details className="explore">
      <summary>Explore</summary>
      <Html as="div" className="explore-text" html={html} />
    </details>
  );
}

// Horizontal swipe on touch → previous / next. Deliberately strict:
// the gesture must be clearly sideways (dx ≥ 64px and at least twice
// dy), so ordinary vertical scrolling through a long prayer never
// changes the day by accident. Mouse and pen are ignored; desktop gets
// arrow keys and the chevrons instead.
export function useSwipe(ref, { onPrev, onNext, enabled = true }) {
  const cb = useRef({ onPrev, onNext });
  cb.current = { onPrev, onNext };

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let start = null;

    const down = (e) => {
      if (e.pointerType !== 'touch') return;
      start = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const up = (e) => {
      if (!start || e.pointerType !== 'touch') return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const dt = performance.now() - start.t;
      start = null;
      if (dt > 700) return;
      if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 2) return;
      if (dx < 0) cb.current.onNext?.();
      else cb.current.onPrev?.();
    };
    const cancel = () => { start = null; };

    el.addEventListener('pointerdown', down, { passive: true });
    el.addEventListener('pointerup', up, { passive: true });
    el.addEventListener('pointercancel', cancel, { passive: true });
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel);
    };
  }, [ref, enabled]);
}

// Escape closes whatever is on top.
export function useEscape(active, onEscape) {
  const cb = useRef(onEscape);
  cb.current = onEscape;
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === 'Escape') cb.current?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);
}

// Stop the page behind an overlay from scrolling (iOS especially).
export function useBodyLock(active) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [active]);
}
