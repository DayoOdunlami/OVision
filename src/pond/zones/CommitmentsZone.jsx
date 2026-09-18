import { useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════
// CommitmentsZone — four lily pads carrying the verbs.
//
// These used to be static cards that happened to be pad-shaped, which
// is why they read as "random surfaces": nothing in the pond could
// touch them. Now they are floating objects.
//
//   · A koi passing underneath lifts and rocks the pad, and sheds a
//     ripple ring from the point of contact.
//   · Tapping a pad dips it and rings it, like pressing a leaf down
//     into water.
//   · Each pad keeps its own idle bob, at its own tempo:
//       Pray  — slowest bob, deepest sink  (contemplative)
//       Train — quickest bob, most upright (energetic)
//       Show  — lifts highest              (rising to surface)
//       Cook  — adds a gentle rotation     (the family rotation)
//
// Architecture note — four nested transform layers, each doing exactly
// one thing, because CSS animations and JS-driven transforms fight if
// they share an element:
//
//   .pad-slot    grid cell, static
//   .pad-bob     CSS keyframes — the idle float
//   .pad-rock    JS per-frame  — koi wake + tap response
//   .pad-tilt    static rotate — the natural lily angle
//   .pad-content counter-rotate so the text reads upright
//
// The koi positions come from `window.__ambientFish`, which PondCanvas
// republishes every frame as viewport-space spine points each carrying
// its own body radius. FlourishZone already consumes the same array to
// scatter its particles, so this reuses a path that's already proven.
// ═══════════════════════════════════════════════════════════════════

const PAD_PRESETS = [
  { id: 'pray',  verb: 'Pray',  rotate: -8, bobDuration: 7.2, bobDepth: 8,  bobRotate: 0, hue: 132 },
  { id: 'train', verb: 'Train', rotate:  6, bobDuration: 4.4, bobDepth: 12, bobRotate: 0, hue: 142 },
  { id: 'show',  verb: 'Show',  rotate: -4, bobDuration: 5.6, bobDepth: 16, bobRotate: 0, hue: 118 },
  { id: 'cook',  verb: 'Cook',  rotate:  9, bobDuration: 6.0, bobDepth: 10, bobRotate: 5, hue: 128 },
];

// Intrinsic pad geometry. The SVG keeps this as its viewBox and CSS
// scales the whole thing down on small screens, so all the internal
// proportions survive untouched.
const PAD_W = 320;
const PAD_H = 230;

// ── Wake physics ────────────────────────────────────────────────────
// A koi under the pad displaces water; the pad lifts on the side the
// koi is on and rocks back. Modelled as two independent damped springs
// (one per tilt axis) chasing a target derived from koi proximity.
//
// Tuned for "floating leaf", not "trampoline": low stiffness so the
// pad lags behind the fish, and damping just under critical so it
// overshoots once and settles rather than oscillating.
const WAKE = {
  reach: 110,        // px beyond the pad's own radius that koi are felt
  maxTilt: 11,       // deg — ceiling on either axis
  tiltPerUnit: 16,   // deg per unit of normalised koi influence
  maxLift: 9,        // px the pad rises at full influence
  stiffness: 0.10,   // spring constant towards the target
  damping: 0.86,     // velocity retained per frame
  rippleThreshold: 0.42,  // influence needed to shed a ring
  rippleCooldown: 34,     // frames between rings from one pad
};

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

function PadSVG({ hue, id }) {
  // Organic blob: subtle radial wobble around an ellipse, with a
  // single small notch on the right edge to keep the lily-pad read.
  const steps = 56;
  const notch = 0.05;
  const rx = PAD_W / 2 - 6;
  const ry = PAD_H / 2 - 6;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = notch + (i / steps) * (Math.PI * 2 - notch * 2);
    // Tiny edge wobble — different frequency on each axis so the pad
    // doesn't look stamped.
    const wobble = 1 + Math.sin(a * 5) * 0.018 + Math.sin(a * 9) * 0.009;
    pts.push(`${(Math.cos(a) * rx * wobble).toFixed(1)},${(Math.sin(a) * ry * wobble).toFixed(1)}`);
  }
  const d = `M ${pts[0]} L ${pts.slice(1).join(' L ')} L 0,0 Z`;

  // Radiating veins from the centre — subtle, not loud.
  const veinCount = 9;
  const veins = [];
  for (let i = 0; i < veinCount; i++) {
    const t = (i + 0.5) / veinCount;
    const a = notch + t * (Math.PI * 2 - notch * 2);
    veins.push(`M 0,0 L ${(Math.cos(a) * rx * 0.92).toFixed(1)},${(Math.sin(a) * ry * 0.92).toFixed(1)}`);
  }

  return (
    <svg
      viewBox={`-${PAD_W / 2} -${PAD_H / 2} ${PAD_W} ${PAD_H}`}
      className="pad-svg"
      aria-hidden="true"
    >
      <defs>
        {/* Near-opaque body. The earlier translucent version let koi
            swim visibly *through* the pad, which read as a z-order
            bug rather than as depth. A lily pad floats on the surface
            — nothing should show through it. */}
        <radialGradient id={`pad-${id}`} cx="38%" cy="34%" r="68%">
          <stop offset="0%"   stopColor={`hsla(${hue - 6}, 56%, 88%, 0.985)`} />
          <stop offset="55%"  stopColor={`hsla(${hue},     46%, 68%, 0.975)`} />
          <stop offset="100%" stopColor={`hsla(${hue + 4}, 46%, 34%, 0.975)`} />
        </radialGradient>
        <radialGradient id={`pad-sheen-${id}`} cx="30%" cy="22%" r="42%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.42)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#pad-${id})`} />
      {veins.map((vd, i) => (
        <path key={i} d={vd} stroke="rgba(0,40,30,0.16)" strokeWidth="0.6" fill="none" />
      ))}
      <path d={d} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.9" />
      <ellipse cx={-PAD_W * 0.18} cy={-PAD_H * 0.22} rx="42" ry="20" fill={`url(#pad-sheen-${id})`} />
    </svg>
  );
}

export default function CommitmentsZone({ title = 'Commitments', commitments = null }) {
  const pads = PAD_PRESETS.map((preset) => {
    const match = commitments?.find((c) =>
      c.verb?.toLowerCase() === preset.verb.toLowerCase() ||
      c.label?.toLowerCase() === preset.verb.toLowerCase()
    );
    return {
      ...preset,
      verb: match?.verb || match?.label || preset.verb,
      body: match?.text || match?.body || '',
      cadence: match?.cadence || '',
      tag: match?.tag || '',
    };
  });

  return (
    <section className="pond-commitments">
      <div className="pond-zone-eyebrow">03 · {title}</div>

      <div className="pond-pad-grid">
        {pads.map((p) => (
          <ReactivePad key={p.id} pad={p} />
        ))}
      </div>

      <PadStyles />
    </section>
  );
}

// ── One pad, wired to the pond ──────────────────────────────────────
function ReactivePad({ pad }) {
  const slotRef = useRef(null);
  const rockRef = useRef(null);
  const rippleHostRef = useRef(null);

  useEffect(() => {
    const slot = slotRef.current;
    const rock = rockRef.current;
    if (!slot || !rock) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;   // pads sit still; CSS bob is disabled too

    let raf = 0;
    let disposed = false;
    let frame = 0;

    // Spring state: tilt about each axis, plus vertical lift.
    let tx = 0, ty = 0, lift = 0;
    let vtx = 0, vty = 0, vlift = 0;

    // Cached geometry. getBoundingClientRect forces layout, and the
    // pad only moves when the page scrolls, so refresh it on a slow
    // cadence and on scroll/resize rather than every frame.
    let cx = 0, cy = 0, reach = 0;
    const measure = () => {
      const r = slot.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      reach = Math.max(r.width, r.height) / 2 + WAKE.reach;
    };
    measure();

    let rippleCooldown = 0;

    const spawnRipple = (offX, offY, strength) => {
      const host = rippleHostRef.current;
      if (!host || host.childElementCount > 5) return;
      const ring = document.createElement('span');
      ring.className = 'pad-ripple';
      // Position in pad-local percentage so it survives CSS scaling.
      ring.style.left = `${50 + offX * 50}%`;
      ring.style.top = `${50 + offY * 50}%`;
      ring.style.setProperty('--ripple-scale', String(1.6 + strength * 2.4));
      ring.addEventListener('animationend', () => ring.remove(), { once: true });
      host.appendChild(ring);
    };

    const tick = () => {
      if (disposed) return;
      frame++;
      if (frame % 12 === 0) measure();

      // ── Gather koi influence ────────────────────────────────────
      // Sum the normalised offset of every nearby spine point,
      // weighted by proximity and by that point's body radius, so a
      // fat midsection shoves harder than a tail tip.
      const points = window.__ambientFish;
      let fx = 0, fy = 0, load = 0;
      if (Array.isArray(points) && reach > 0) {
        for (let i = 0; i < points.length; i++) {
          const p = points[i];
          const dx = p.x - cx;
          const dy = p.y - cy;
          const d = Math.hypot(dx, dy);
          if (d > reach) continue;
          const near = 1 - d / reach;
          const w = near * near * clamp((p.r || 6) / 11, 0.35, 1.9);
          fx += (dx / reach) * w;
          fy += (dy / reach) * w;
          load += w;
        }
      }

      const influence = clamp(load * 0.5, 0, 1);

      // ── Springs ─────────────────────────────────────────────────
      const targetTx = clamp(fx * WAKE.tiltPerUnit, -WAKE.maxTilt, WAKE.maxTilt);
      const targetTy = clamp(fy * WAKE.tiltPerUnit, -WAKE.maxTilt, WAKE.maxTilt);
      const targetLift = -influence * WAKE.maxLift;

      vtx = (vtx + (targetTx - tx) * WAKE.stiffness) * WAKE.damping;
      vty = (vty + (targetTy - ty) * WAKE.stiffness) * WAKE.damping;
      vlift = (vlift + (targetLift - lift) * WAKE.stiffness) * WAKE.damping;
      tx += vtx;
      ty += vty;
      lift += vlift;

      // ── Shed a ring when a koi actually breaks through ───────────
      if (rippleCooldown > 0) rippleCooldown--;
      if (influence > WAKE.rippleThreshold && rippleCooldown === 0) {
        const mag = Math.hypot(fx, fy) || 1;
        spawnRipple(
          clamp(fx / mag * 0.55, -0.8, 0.8),
          clamp(fy / mag * 0.55, -0.8, 0.8),
          influence,
        );
        rippleCooldown = WAKE.rippleCooldown;
      }

      // Only touch the DOM when there's something to see. Below this
      // threshold all four pads are effectively at rest and writing
      // transforms every frame is pure cost.
      if (Math.abs(tx) > 0.02 || Math.abs(ty) > 0.02 || Math.abs(lift) > 0.02) {
        rock.style.transform =
          `perspective(700px) rotateX(${(-ty).toFixed(2)}deg) ` +
          `rotateY(${tx.toFixed(2)}deg) translateY(${lift.toFixed(2)}px)`;
      } else if (rock.style.transform) {
        rock.style.transform = '';
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);

    // ── Tap: press the leaf into the water ──────────────────────────
    const onPress = (e) => {
      const r = slot.getBoundingClientRect();
      const offX = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -0.85, 0.85);
      const offY = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -0.85, 0.85);
      // Kick the springs directly rather than setting a target — a tap
      // is an impulse, and letting the spring resolve it gives the
      // dip-and-settle for free.
      vtx += offX * 7;
      vty += offY * 7;
      vlift += 3.4;
      spawnRipple(offX, offY, 0.9);
    };
    slot.addEventListener('pointerdown', onPress);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      slot.removeEventListener('pointerdown', onPress);
    };
  }, []);

  return (
    <div ref={slotRef} className="pad-slot">
      <div
        className={`pad-bob pad-bob-${pad.id}`}
        style={{
          animationDuration: `${pad.bobDuration}s`,
        }}
      >
        <div ref={rockRef} className="pad-rock">
          <div className="pad-tilt" style={{ transform: `rotate(${pad.rotate}deg)` }}>
            <PadSVG hue={pad.hue} id={pad.id} />
          </div>
          <div ref={rippleHostRef} className="pad-ripples" aria-hidden="true" />
          <div className="pad-content" style={{ transform: `rotate(${pad.rotate}deg)` }}>
            <div className="pad-inner" style={{ transform: `rotate(${-pad.rotate}deg)` }}>
              <div className="pad-verb">{pad.verb}</div>
              {pad.body && <div className="pad-body">{pad.body}</div>}
              {pad.cadence && (
                <div className="pad-cadence">
                  {pad.cadence}
                  {pad.tag && <span className="pad-tag"> · {pad.tag}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PadStyles() {
  return (
    <style>{`
      .pond-commitments {
        position: relative;
        min-height: 78vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 6vh 5vw;
      }

      .pond-pad-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 320px));
        gap: 2.6rem 2rem;
        max-width: 1180px;
        width: 100%;
        justify-content: center;
        justify-items: center;
      }

      /* The pad scales as a unit: width is fluid, height follows the
         intrinsic 320×230 ratio, and everything inside is positioned
         in percentages or scales with the SVG viewBox. */
      .pad-slot {
        position: relative;
        width: 100%;
        max-width: ${PAD_W}px;
        aspect-ratio: ${PAD_W} / ${PAD_H};
        cursor: pointer;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .pad-bob, .pad-rock, .pad-tilt, .pad-content {
        position: absolute;
        inset: 0;
      }

      .pad-bob {
        animation-name: pad-bob-generic;
        animation-timing-function: ease-in-out;
        animation-iteration-count: infinite;
      }
      .pad-rock {
        transform-style: preserve-3d;
        will-change: transform;
        transition: none;
      }

      .pad-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        filter: drop-shadow(0 10px 18px rgba(4, 22, 26, 0.34));
      }

      .pad-content { pointer-events: none; }
      .pad-inner {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 11% 12%;
        text-align: center;
      }

      .pad-verb {
        font-family: 'Fraunces', Georgia, serif;
        font-style: italic;
        font-weight: 800;
        font-size: clamp(1.5rem, 6.2cqw, 2.1rem);
        line-height: 1;
        color: #0d2a23;
        letter-spacing: -0.01em;
        margin-bottom: 0.5rem;
      }
      .pad-body {
        font-family: 'Manrope', sans-serif;
        font-size: clamp(0.72rem, 2.7cqw, 0.84rem);
        line-height: 1.35;
        color: rgba(10, 36, 30, 0.88);
        max-width: 100%;
        margin-bottom: 0.65rem;
      }
      .pad-cadence {
        display: inline-flex;
        align-items: center;
        padding: 3px 10px 4px;
        background: rgba(10, 38, 32, 0.18);
        border: 1px solid rgba(10, 38, 32, 0.24);
        border-radius: 999px;
        font-family: 'Manrope', sans-serif;
        font-size: clamp(0.55rem, 2cqw, 0.62rem);
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: rgba(10, 38, 32, 0.8);
      }
      .pad-tag { opacity: 0.58; }

      /* Ripple rings shed by a passing koi or by a tap. Rendered above
         the pad body so they read as water breaking over the leaf. */
      .pad-ripples {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
      }
      .pad-ripple {
        position: absolute;
        width: 16%;
        aspect-ratio: 1;
        margin: -8% 0 0 -8%;
        border-radius: 50%;
        border: 1.5px solid rgba(255, 252, 235, 0.72);
        box-shadow: inset 0 0 6px rgba(255, 250, 230, 0.35);
        animation: pad-ripple-out 1150ms ease-out forwards;
      }

      @keyframes pad-ripple-out {
        from { transform: scale(0.2); opacity: 0.85; }
        to   { transform: scale(var(--ripple-scale, 2.6)); opacity: 0; }
      }

      @keyframes pad-bob-generic {
        0%   { transform: translateY(0); }
        50%  { transform: translateY(-12px); }
        100% { transform: translateY(0); }
      }

      /* Per-pad bob personality. Depth and rotation differ so the four
         never pulse in unison. */
      ${PAD_PRESETS.map((p) => `
        @keyframes pad-bob-${p.id} {
          0%   { transform: translateY(0) rotate(0deg); }
          50%  { transform: translateY(-${p.bobDepth}px) rotate(${p.bobRotate || 0}deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        .pad-bob-${p.id} { animation-name: pad-bob-${p.id}; }
      `).join('\n')}

      /* Container queries let the pad's own type scale with the pad
         rather than the viewport, which keeps the verb/body ratio
         right when the grid drops to one column on a phone. */
      .pad-slot { container-type: inline-size; }

      @media (max-width: 720px) {
        .pond-commitments { padding: 5vh 6vw; }
        .pond-pad-grid {
          grid-template-columns: minmax(0, 320px);
          gap: 1.6rem;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .pad-bob    { animation: none !important; }
        .pad-ripple { display: none !important; }
      }
    `}</style>
  );
}
