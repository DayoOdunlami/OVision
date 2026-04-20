// ═══════════════════════════════════════════════════════════════════
// CommitmentsZone — four lily pads as text cards. Each pad carries
// the verb, its full sentence, and a cadence pill. Pads are pale,
// generously sized, and bob softly so the whole zone feels like
// stepping stones on water rather than a tidy grid of cards.
//
// Per-pad bob tics keep the four pads from pulsing in unison:
//   Pray  — slowest bob, deepest sink  (contemplative)
//   Train — quickest bob, most upright (energetic)
//   Show  — lifts highest              (rising to surface)
//   Cook  — adds a gentle rotation     (the family rotation)
//
// SVG-only — four small DOM elements with CSS animations are
// effectively free at this scale and crisp at any DPI.
// ═══════════════════════════════════════════════════════════════════

const PAD_PRESETS = [
  { id: 'pray',  verb: 'Pray',  rotate: -8,  bobDuration: 7.2, bobDepth: 8,  bobRotate: 0, hue: 132 },
  { id: 'train', verb: 'Train', rotate:  6,  bobDuration: 4.4, bobDepth: 12, bobRotate: 0, hue: 142 },
  { id: 'show',  verb: 'Show',  rotate: -4,  bobDuration: 5.6, bobDepth: 16, bobRotate: 0, hue: 118 },
  { id: 'cook',  verb: 'Cook',  rotate:  9,  bobDuration: 6.0, bobDepth: 10, bobRotate: 5, hue: 128 },
];

// Pad dimensions tuned so the body text (≤ ~80 chars) sits comfortably
// at typical line-lengths without orphans. The pad itself is wider than
// it is tall so the verb + body fit naturally.
const PAD_W = 320;
const PAD_H = 230;

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
      width={PAD_W}
      height={PAD_H}
      viewBox={`-${PAD_W / 2} -${PAD_H / 2} ${PAD_W} ${PAD_H}`}
      style={{
        display: 'block',
        position: 'absolute',
        inset: 0,
        filter: 'drop-shadow(0 10px 18px rgba(4,22,26,0.32))',
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Pale, translucent body so the verb/text on top is legible
            but the pad still reads as a living leaf, not a card. */}
        <radialGradient id={`pad-${id}`} cx="38%" cy="34%" r="68%">
          <stop offset="0%"   stopColor={`hsla(${hue - 6}, 55%, 88%, 0.88)`} />
          <stop offset="55%"  stopColor={`hsla(${hue},     45%, 70%, 0.78)`} />
          <stop offset="100%" stopColor={`hsla(${hue + 4}, 45%, 38%, 0.78)`} />
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
      <path d={d} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.9" />
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
    <section
      style={{
        position: 'relative',
        minHeight: '78vh',
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
          marginBottom: '2.5rem',
          textShadow: '0 1px 6px rgba(0,0,0,0.35)',
        }}
      >
        03 · {title}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${PAD_W}px, 1fr))`,
          gap: '2.6rem 2rem',
          maxWidth: 1180,
          width: '100%',
          justifyItems: 'center',
        }}
      >
        {pads.map((p) => (
          <div
            key={p.id}
            className={`pond-pad-${p.id}`}
            style={{
              position: 'relative',
              width: PAD_W,
              height: PAD_H,
              transform: `rotate(${p.rotate}deg)`,
              animation: `pond-pad-bob-${p.id} ${p.bobDuration}s ease-in-out infinite`,
            }}
          >
            <PadSVG hue={p.hue} id={p.id} />
            {/* Counter-rotate inner content so text reads upright while
                the pad itself sits at a natural lily angle. */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: `rotate(${-p.rotate}deg)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '34px 38px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 800,
                  fontSize: '2.1rem',
                  lineHeight: 1,
                  color: '#0d2a23',
                  letterSpacing: '-0.01em',
                  marginBottom: '0.55rem',
                }}
              >
                {p.verb}
              </div>
              {p.body && (
                <div
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: '0.84rem',
                    lineHeight: 1.35,
                    color: 'rgba(10, 36, 30, 0.86)',
                    maxWidth: '100%',
                    marginBottom: p.cadence ? '0.7rem' : 0,
                  }}
                >
                  {p.body}
                </div>
              )}
              {p.cadence && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px 4px',
                    background: 'rgba(10, 38, 32, 0.18)',
                    border: '1px solid rgba(10, 38, 32, 0.22)',
                    borderRadius: 999,
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: '0.62rem',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'rgba(10, 38, 32, 0.78)',
                  }}
                >
                  {p.cadence}
                  {p.tag && <span style={{ opacity: 0.55, marginLeft: 4 }}>· {p.tag}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        ${PAD_PRESETS.map((p) => `
          @keyframes pond-pad-bob-${p.id} {
            0%   { transform: rotate(${p.rotate}deg) translateY(0); }
            50%  { transform: rotate(${p.rotate + (p.bobRotate || 0)}deg) translateY(-${p.bobDepth}px); }
            100% { transform: rotate(${p.rotate}deg) translateY(0); }
          }
        `).join('\n')}
        @media (prefers-reduced-motion: reduce) {
          ${PAD_PRESETS.map((p) => `.pond-pad-${p.id} { animation: none !important; }`).join('\n')}
        }
      `}</style>
    </section>
  );
}
