import { useEffect, useState } from 'react';
import { readPrayerState } from '../../data/prayerLink.js';

// ═══════════════════════════════════════════════════════════════════
// MarrowZone — friction view.
//
// The word "marrow" is still, warm type. The *meaning* is applied by
// the pond: any koi swimming inside the attractor radius takes on
// warmer, deeper colour, as if the word leaches into whatever passes
// close, and fades back to its own palette on the way out. The metaphor
// is proximity and dwelling — the closer you come and the longer you
// stay, the more you take on the colour of the thing. Set up by:
//
//   <h1 data-marrow-attractor ...>marrow</h1>
//
// …with the tint maths in src/pond/PondCanvas.jsx.
//
// CONCEPT LAYER (toggleable in Pond settings): once each family member
// has a koi, this zone stops being abstract. The two people you're
// praying for today are named here, and their koi carry their names on
// the water — so the tint is happening to *someone*, not to a generic
// fish. That is the whole reason the prayer surface and the pond are
// worth joining: "know this love" landing in a particular body.
// ═══════════════════════════════════════════════════════════════════

export default function MarrowZone({
  text = 'marrow',
  preText,
  statement,
  cadence = 'Truth · Depth · Grace',
  verse,
  anchor,
  showNames = true,
}) {
  const [prayer, setPrayer] = useState(() => readPrayerState());

  useEffect(() => {
    const refresh = () => setPrayer(readPrayerState());
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const names = prayer.todayNames;
  const hasNames = showNames && prayer.available && (names.length > 0 || prayer.isSunday);

  return (
    <section className="pond-zone" style={{ minHeight: '68vh' }}>
      <div className="pond-zone-eyebrow">04 · Friction</div>

      {preText && <div className="marrow-pre">{preText}</div>}

      <h1 data-marrow-attractor className="marrow-hero">
        {text}
      </h1>

      {statement && <div className="marrow-statement">{statement}</div>}

      <div className="pond-zone-cadence">{cadence}</div>

      {(verse || anchor) && (
        <div className="pond-zone-verse">
          {verse}
          {anchor && <span className="ref">— {anchor}</span>}
        </div>
      )}

      {hasNames ? (
        <div className="marrow-names">
          <span className="marrow-names-label">Carrying today</span>
          <span className="marrow-names-value">
            {prayer.isSunday
              ? 'All of us'
              : names.join(' & ')}
          </span>
          <span className="pond-zone-hint" style={{ marginTop: '0.55rem' }}>
            Their koi take the colour as they pass
          </span>
        </div>
      ) : (
        <div className="pond-zone-hint">Fish passing close take its colour.</div>
      )}

      <style>{`
        .marrow-hero {
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic;
          font-weight: 900;
          font-size: clamp(4.2rem, 19vw, 12rem);
          line-height: 0.9;
          margin: 0;
          background: radial-gradient(ellipse at 50% 60%,
            #ffd9a0 0%, #e6833a 32%, #9c2b1a 72%, #481208 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
          text-shadow: 0 4px 24px rgba(80, 18, 10, 0.35);
          pointer-events: none;
        }

        .marrow-pre, .marrow-statement {
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic;
          font-size: clamp(1rem, 3vw, 1.35rem);
          color: rgba(255, 250, 242, 0.88);
          text-align: center;
          max-width: 30rem;
          text-shadow: 0 1px 5px rgba(0, 0, 0, 0.6);
        }
        .marrow-pre       { margin-bottom: 0.4rem; }
        .marrow-statement { margin-top: 0.5rem; }

        .marrow-names {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.85rem 1.5rem 0.95rem;
          border-radius: 14px;
          border: 1px solid rgba(255, 190, 130, 0.28);
          background: rgba(60, 20, 10, 0.34);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        .marrow-names-label {
          font-family: 'Manrope', sans-serif;
          font-size: 0.62rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          font-weight: 600;
          color: rgba(255, 206, 160, 0.82);
        }
        .marrow-names-value {
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic;
          font-weight: 700;
          font-size: clamp(1.3rem, 4.5vw, 1.9rem);
          color: #ffe9cf;
          margin-top: 0.22rem;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </section>
  );
}
