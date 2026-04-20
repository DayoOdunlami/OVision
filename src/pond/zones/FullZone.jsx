// ═══════════════════════════════════════════════════════════════════
// FullZone — season view.
//
// No canvas here any more. The word "Full" sits still; proximity is
// what makes it read. Ambient pond koi that swim near the word
// visibly swell — the closer to the centre the bigger — and shrink
// back to their own size as they drift away. That's the metaphor
// the zone carries: life lived near this season is nourished, lives
// lived distant from it look leaner.
//
// Mechanically this mirrors MarrowZone: we expose the word with
//
//   <h1 data-full-attractor ...>Full</h1>
//
// …and PondCanvas reads those elements per frame and applies a
// per-fish proximity scale during draw. See src/pond/PondCanvas.jsx
// for the maths.
// ═══════════════════════════════════════════════════════════════════

export default function FullZone({
  text = 'Full',
  cadence = 'Rooted · Honest · Resilient',
  verse,
  anchor,
}) {
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

      <h1
        data-full-attractor
        style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontStyle: 'italic',
          fontWeight: 900,
          fontSize: 'clamp(5rem, 20vw, 13rem)',
          lineHeight: 0.9,
          margin: 0,
          background:
            'linear-gradient(180deg, #ffd58a 0%, #d66524 58%, #7a2914 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          textShadow: '0 4px 24px rgba(0,0,0,0.18)',
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
        Fish drawing near grow full. Those drifting far grow lean.
      </div>
    </section>
  );
}
