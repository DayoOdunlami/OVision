import { useEffect, useState } from 'react';
import { readPrayerState, consistency, todayDayIndex } from '../../data/prayerLink.js';

// ═══════════════════════════════════════════════════════════════════
// FullZone — season view, and the pond's consistency gauge.
//
// The word "Full" sits still; proximity is what makes it read. Koi
// swimming near it swell — the closer to the centre the bigger — and
// shrink back as they drift away. PondCanvas does the maths; this zone
// just marks the target:
//
//   <h1 data-full-attractor data-full-max data-full-min>Full</h1>
//
// What's new: how *far* they swell is no longer a constant. It's
// driven by how consistently you've actually prayed this week, read
// from the /pray/ surface's shared localStorage. Pray most mornings
// and the koi near "Full" are fat and golden; let the week slide and
// they go lean.
//
// Deliberately measured against days *elapsed*, not seven — on a
// Tuesday a good week reads 2/2, not 2/7. And when the prayer surface
// has never been opened on this device, `consistency()` returns null
// and we fall back to the original fixed swell rather than showing an
// empty gauge that reads as failure on day one.
// ═══════════════════════════════════════════════════════════════════

// Fixed fallback — the pre-prayer-link behaviour.
const AMBIENT_SWELL = { max: 1.85, min: 0.78 };

// Consistency-driven range. At c=0 koi are noticeably lean even at the
// bullseye; at c=1 they're markedly fatter than the ambient default.
function swellFor(c) {
  if (c == null) return AMBIENT_SWELL;
  return {
    max: 1.25 + c * 0.85,   // 1.25 → 2.10
    min: 0.62 + c * 0.24,   // 0.62 → 0.86
  };
}

export default function FullZone({
  text = 'Full',
  cadence = 'Rooted · Honest · Resilient',
  verse,
  anchor,
}) {
  const [prayer, setPrayer] = useState(() => readPrayerState());

  // Re-read when the tab regains focus. The fridge tablet may have the
  // pond open for days while prayer happens on a phone, and coming
  // back to the tab is the natural moment to refresh. `storage` fires
  // when /pray/ is open in another tab of the same browser.
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

  const c = consistency(prayer);
  const swell = swellFor(c);
  const today = todayDayIndex();

  return (
    <section className="pond-zone" style={{ minHeight: '74vh' }}>
      <div className="pond-zone-eyebrow">02 · Season</div>

      <h1
        data-full-attractor
        data-full-max={swell.max}
        data-full-min={swell.min}
        className="full-hero"
      >
        {text}
      </h1>

      <div className="pond-zone-cadence">{cadence}</div>

      {(verse || anchor) && (
        <div className="pond-zone-verse">
          {verse}
          {anchor && <span className="ref">— {anchor}</span>}
        </div>
      )}

      {/* Consistency strip. Only shown once the prayer surface has been
          used at least once on this device — otherwise it's a row of
          empty dots accusing you of nothing. */}
      {c != null ? (
        <div className="full-gauge" aria-label={`Prayed ${prayer.daysPrayedThisWeek} of ${prayer.daysElapsedThisWeek} days so far this week`}>
          <div className="full-gauge-dots" aria-hidden="true">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => {
              const elapsed = i <= today;
              // We know the weekly total but not which individual days
              // were prayed, so fill from Monday forward — the strip is
              // a gauge, not a calendar.
              const filled = elapsed && i < prayer.daysPrayedThisWeek;
              return (
                <span
                  key={i}
                  className={
                    'full-dot' +
                    (filled ? ' is-filled' : '') +
                    (elapsed ? '' : ' is-future') +
                    (i === today ? ' is-today' : '')
                  }
                >
                  {d}
                </span>
              );
            })}
          </div>
          <div className="pond-zone-hint" style={{ marginTop: '0.7rem' }}>
            {prayer.daysPrayedThisWeek} of {prayer.daysElapsedThisWeek} this week
            {' · '}
            {c >= 0.85 ? 'the koi are full' : c >= 0.5 ? 'filling' : 'running lean'}
          </div>
        </div>
      ) : (
        <div className="pond-zone-hint">
          Fish drawing near grow full. Those drifting far grow lean.
        </div>
      )}

      <style>{`
        .full-hero {
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic;
          font-weight: 900;
          font-size: clamp(4.5rem, 20vw, 13rem);
          line-height: 0.9;
          margin: 0;
          background: linear-gradient(180deg, #ffd58a 0%, #d66524 58%, #7a2914 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
          pointer-events: none;
        }

        .full-gauge { margin-top: 1.4rem; text-align: center; }
        .full-gauge-dots {
          display: inline-flex;
          gap: 6px;
        }
        .full-dot {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'Manrope', sans-serif;
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(6, 34, 42, 0.45);
        }
        .full-dot.is-filled {
          background: linear-gradient(180deg, #ffd58a, #d9772c);
          border-color: rgba(255, 213, 138, 0.9);
          color: #4a1c08;
          box-shadow: 0 0 14px rgba(255, 186, 110, 0.4);
        }
        .full-dot.is-future { opacity: 0.35; }
        .full-dot.is-today  { outline: 1px solid rgba(255, 224, 176, 0.75); outline-offset: 2px; }

        @media (max-width: 720px) {
          .full-dot { width: 22px; height: 22px; font-size: 0.52rem; }
        }
      `}</style>
    </section>
  );
}
