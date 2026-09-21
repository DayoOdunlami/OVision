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
// A block that koi can push. Reads the surfaced koi's body points from
// `window.__prayerKoi` (published each frame by KoiSchool) and runs the
// same spring model as the pond's lily pads: a push away from nearby
// fish, weighted by how close and how thick that part of the body is;
// a pull back home; damping just under critical, so it overshoots once
// and settles. Offset is capped so nothing wanders off.
const REACH = 70;        // px beyond the element's own half-size
const PUSH = 1.6;        // strength of a koi's push
const STIFF = 0.045;     // pull back towards home
const DAMP = 0.86;       // velocity kept per frame
const MAX = 26;          // px

function Nudge({ as: Tag = 'div', className, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let x = 0, y = 0, vx = 0, vy = 0;
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
          const w = near * near * Math.min(1.8, Math.max(0.4, (p.r || 6) / 10)) * PUSH;
          fx += (dx / d) * w;
          fy += (dy / d) * w;
        }
      }
      vx = (vx + fx - x * STIFF) * DAMP;
      vy = (vy + fy - y * STIFF) * DAMP;
      x = Math.max(-MAX, Math.min(MAX, x + vx));
      y = Math.max(-MAX, Math.min(MAX, y + vy));

      if (Math.abs(x) > 0.05 || Math.abs(y) > 0.05) {
        el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${(x * 0.12).toFixed(2)}deg)`;
      } else if (el.style.transform) {
        el.style.transform = '';
        x = y = vx = vy = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Tag ref={ref} className={'nudge' + (className ? ` ${className}` : '')}>
      {children}
    </Tag>
  );
}
