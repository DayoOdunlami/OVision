import { useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════
// AmenCard — the end of a prayer, in Pray it and the puzzle alike.
//
// The ✓ calls the koi. When they're up, koi passing close nudge the
// card's words like a koi under a lily pad: pushed aside, a small tilt,
// then drifting back to where they belong. Only the decorative parts
// move — the ✓, "Amen.", and the two quiet lines. The Done button never
// does: a button that shifts as you reach for it just feels broken.
//
// Stays until Done. Nothing here closes on its own.
// ═══════════════════════════════════════════════════════════════════

export default function AmenCard({ koiActive, onCallKoi, onDone }) {
  return (
    <div className="pace-done">
      <Nudge>
        <button
          className="pace-done-mark"
          onClick={onCallKoi}
          aria-label="Call the koi"
          title="Call the koi"
        >
          &#10003;
        </button>
      </Nudge>
      <Nudge className="pace-done-text">Amen.</Nudge>
      <Nudge className="pace-done-sub">Marked for today</Nudge>
      <Nudge as="p" className="pace-done-hint">
        {koiActive ? 'Stay as long as you like.' : 'Tap the tick to call the koi.'}
      </Nudge>
      <button className="btn btn-primary pace-done-btn" onClick={onDone} autoFocus>
        Done
      </button>
    </div>
  );
}

// ── Nudge ─────────────────────────────────────────────────────────────
// A block that koi can push, like a lily pad on an anchor line: a koi
// passing close shoves it aside, it glides away, and a weak anchor
// draws it slowly home. Reads the koi's body points from
// `window.__prayerKoi` (published each frame by KoiSchool).
//
// Tuned by measurement: over 90s of real (frame-stepped) koi on a
// laptop-sized screen, words were pushed ~19 times, typically ~50px
// (never past ~60), and drifted home in ~5s. On smaller screens the
// push and the anchor's slack scale down with the width. The first version used a
// stiff spring — ~30px, snapped back in a moment — which read as a
// jiggle in place rather than a drift. A short reach matters as much
// as the push: with a long one the koi kept shoving the word ahead of
// itself, surfing it across the screen.
const REACH = 45;        // px beyond the element's own half-size
const PUSH = 0.3;        // strength of a koi's push, per frame
const STIFF = 0.0012;    // the anchor's pull home
const DAMP = 0.962;      // velocity kept per frame (water drag)
const SOFT = 35;         // px — beyond this the anchor line goes taut…
const TAUT = 0.012;      // …and pulls this much harder per px past it
const MAX = 70;          // px — a backstop, not normally reached

function Nudge({ as: Tag = 'div', className, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let x = 0, y = 0, vx = 0, vy = 0;
    // Smaller drift on smaller screens: ~60% on a phone.
    const scale = Math.min(1.1, Math.max(0.6, window.innerWidth / 1200));
    const push = PUSH * scale;
    const soft = SOFT * scale;
    // Home position: the element's rect measured without our own offset.
    let home = null;
    let frame = 0;
    const measure = () => {
      const r = el.getBoundingClientRect();
      home = { cx: r.left + r.width / 2 - x, cy: r.top + r.height / 2 - y, hw: r.width / 2, hh: r.height / 2 };
    };

    const tick = () => {
      if (frame++ % 20 === 0) measure();
      const pts = window.__prayerKoi;
      let fx = 0, fy = 0;
      if (home && Array.isArray(pts) && pts.length) {
        const cx = home.cx + x;
        const cy = home.cy + y;
        const reachX = home.hw + REACH;
        const reachY = home.hh + REACH;
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          // Normalised distance in an ellipse fitted to the element, so
          // a wide line of text feels a fish along its whole length.
          const dx = (cx - p.x) / reachX;
          const dy = (cy - p.y) / reachY;
          const d = Math.hypot(dx, dy);
          if (d >= 1 || d === 0) continue;
          const near = 1 - d;
          const w = near * near * Math.min(1.8, Math.max(0.4, (p.r || 6) / 10)) * push;
          fx += (dx / d) * w;
          fy += (dy / d) * w;
        }
      }
      // Anchor: weak near home, taut past SOFT, so a word can drift but
      // never wander off however long a koi lingers nearby.
      const disp = Math.hypot(x, y);
      const k = STIFF + (disp > soft ? TAUT * (disp - soft) / disp : 0);
      vx = (vx + fx - x * k) * DAMP;
      vy = (vy + fy - y * k) * DAMP;
      x = Math.max(-MAX, Math.min(MAX, x + vx));
      y = Math.max(-MAX, Math.min(MAX, y + vy));

      if (Math.abs(x) > 0.05 || Math.abs(y) > 0.05 || Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01) {
        // A pad pushed sideways turns a little as it goes.
        const rot = Math.max(-7, Math.min(7, x * 0.09 + vy * 1.5));
        el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${rot.toFixed(2)}deg)`;
      } else if (el.style.transform) {
        el.style.transform = '';
        x = y = vx = vy = 0;
      }
    };
    const loop = () => { tick(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    // Development only: let KoiSchool's frame-stepping hook step these
    // too, for previews that don't run requestAnimationFrame.
    if (import.meta.env.DEV) (window.__nudgeTicks ||= new Set()).add(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (import.meta.env.DEV) window.__nudgeTicks?.delete(tick);
    };
  }, []);

  return (
    <Tag ref={ref} className={'nudge' + (className ? ` ${className}` : '')}>
      {children}
    </Tag>
  );
}
