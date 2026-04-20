// ═══════════════════════════════════════════════════════════════════
// MarrowZone — friction view.
//
// No canvas here any more. The word "marrow" is rendered as a still,
// warm-gradient piece of type. The *meaning* is applied by the
// ambient pond: any ambient koi swimming within the attractor radius
// takes on warmer / deeper colour — as if the marrow leaches truth
// into anything that passes close. Koi drifting away fade back to
// their own palette. This is set up by:
//
//   <h1 data-marrow-attractor ...>marrow</h1>
//
// …and PondCanvas reads those elements each frame and tints the
// fish near them. See src/pond/PondCanvas.jsx for the tint maths.
//
// Removing the per-zone canvas + ripple/caustic loop also significantly
// reduces the number of concurrent requestAnimationFrame schedulers
// on the page, which was the root cause of the "fish keep freezing"
// issue — too many zones were each running heavy full-frame loops.
// ═══════════════════════════════════════════════════════════════════

export default function MarrowZone({
  text = 'marrow',
  cadence = 'Truth · Depth · Grace',
  verse,
  anchor,
}) {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '68vh',
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
        04 · Friction
      </div>

      <h1
        data-marrow-attractor
        style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontStyle: 'italic',
          fontWeight: 900,
          fontSize: 'clamp(5rem, 19vw, 12rem)',
          lineHeight: 0.9,
          margin: 0,
          background:
            'radial-gradient(ellipse at 50% 60%, #ffd9a0 0%, #e6833a 32%, #9c2b1a 72%, #481208 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          textShadow: '0 4px 24px rgba(80, 18, 10, 0.35)',
          letterSpacing: '-0.02em',
          pointerEvents: 'none',
        }}
      >
        {text}
      </h1>

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
            color: 'rgba(255,255,255,0.6)',
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

      <div
        style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.72rem',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'rgba(255, 215, 180, 0.55)',
          marginTop: '1.2rem',
          fontStyle: 'italic',
          textShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}
      >
        Fish passing close take its colour.
      </div>
    </section>
  );
}
