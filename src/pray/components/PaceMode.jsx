import { useEffect, useRef, useState } from 'react';
import { Html, Explore, useEscape, useBodyLock } from './bits.jsx';
import KoiSchool from './KoiSchool.jsx';

// ═══════════════════════════════════════════════════════════════════
// PaceMode — "Pray it".
//
// One thing on screen, one tempo:
//
//   breath   → settle; no text to read
//   step × n → one thought per card, advance on tap
//   blessing → Amen, which records the day as prayed, and the koi of
//              everyone prayed for swim in (tap the tick to call them
//              again) — unless the celebration is set to Quiet
//
// Exists because the stated problem is a wandering mind. Focus mode
// only dims competing text; this gives attention a single thing to
// hold. Steps come from buildDay().steps — the same source the reading
// view and the puzzle use.
// ═══════════════════════════════════════════════════════════════════

export default function PaceMode({ day, celebrate = 'recommended', onClose, onAmen }) {
  const cards = [
    { kind: 'breath' },
    ...day.steps.map((s) => ({ kind: 'line', ...s })),
    { kind: 'blessing', html: day.blessingHtml },
  ];
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const [koi, setKoi] = useState(null);          // { id } | null
  const koiIdRef = useRef(0);
  const callKoi = () => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    koiIdRef.current += 1;
    setKoi({ id: koiIdRef.current });
  };
  const card = cards[i];
  const last = i === cards.length - 1;

  useEscape(true, onClose);
  useBodyLock(true);

  const next = () => setI((v) => Math.min(cards.length - 1, v + 1));
  const back = () => setI((v) => Math.max(0, v - 1));
  // The Amen card stays until you tap Done, as in the puzzle.
  const amen = () => {
    setDone(true);
    onAmen();
    if (celebrate !== 'quiet') callKoi();
  };

  // Space / → / Enter advance, ← goes back. Ignored while typing.
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'textarea' || tag === 'input' || done) return;
      if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') {
        // Let Enter/Space activate a focused button normally.
        if (tag === 'button' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        last ? amen() : next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const who = day.who.b ? `${day.who.a} & ${day.who.b}` : day.who.a;

  return (
    <div className="overlay pace" role="dialog" aria-modal="true" aria-label="Pray it">
      {koi && <KoiSchool key={koi.id} people={day.people || []} stay onGone={() => setKoi(null)} />}
      <div className="overlay-top">
        <div className="pace-dots" aria-hidden="true">
          {cards.map((_, n) => (
            <span key={n} className={'pace-dot' + (n === i ? ' is-on' : n < i ? ' is-past' : '')} />
          ))}
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close">&times;</button>
      </div>

      <div className="pace-body">
        {done ? (
          <div className="pace-done">
            <button
              className="pace-done-mark"
              onClick={callKoi}
              aria-label="Call the koi"
              title="Call the koi"
            >
              &#10003;
            </button>
            <div className="pace-done-text">Amen.</div>
            <div className="pace-done-sub">Marked for today</div>
            <p className="pace-done-hint">
              {koi ? 'Stay as long as you like.' : 'Tap the tick to call the koi.'}
            </p>
            <button className="btn btn-primary pace-done-btn" onClick={onClose} autoFocus>
              Done
            </button>
          </div>
        ) : card.kind === 'breath' ? (
          <div key="breath" className="pace-breath">
            <div className="pace-ring"><span /></div>
            <div className="pace-who">{who}</div>
            <p className="pace-hint">Put everything down for a moment.<br />Breathe. Then begin.</p>
          </div>
        ) : (
          <div key={i} className={'pace-card' + (card.kind === 'blessing' ? ' is-blessing' : '')}>
            <Html as="p" className="pace-text" html={card.html} />
            {card.explain && <Explore html={card.explain} />}
          </div>
        )}
      </div>

      {!done && (
        <div className="overlay-foot">
          {i > 0 && <button className="btn btn-ghost" onClick={back}>Back</button>}
          {card.kind === 'breath' && <button className="btn btn-primary" onClick={next}>Begin</button>}
          {card.kind === 'line' && (
            <button className="btn btn-primary" onClick={next}>
              {i === cards.length - 2 ? 'Blessing' : 'Next'}
            </button>
          )}
          {card.kind === 'blessing' && <button className="btn btn-primary" onClick={amen}>Amen</button>}
        </div>
      )}
    </div>
  );
}
