import { useEffect, useState } from 'react';
import { Html, Explore, useEscape, useBodyLock } from './bits.jsx';

// ═══════════════════════════════════════════════════════════════════
// PaceMode — "Pray it".
//
// One thing on screen, one tempo:
//
//   breath   → settle; no text to read
//   step × n → one thought per card, advance on tap
//   blessing → Amen, which records the day as prayed
//
// Exists because the stated problem is a wandering mind. Focus mode
// only dims competing text; this gives attention a single thing to
// hold. Steps come from buildDay().steps — the same source the reading
// view and the puzzle use.
// ═══════════════════════════════════════════════════════════════════

export default function PaceMode({ day, onClose, onAmen }) {
  const cards = [
    { kind: 'breath' },
    ...day.steps.map((s) => ({ kind: 'line', ...s })),
    { kind: 'blessing', html: day.blessingHtml },
  ];
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const card = cards[i];
  const last = i === cards.length - 1;

  useEscape(true, onClose);
  useBodyLock(true);

  const next = () => setI((v) => Math.min(cards.length - 1, v + 1));
  const back = () => setI((v) => Math.max(0, v - 1));
  const amen = () => {
    setDone(true);
    onAmen();
    setTimeout(onClose, 2000);
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
            <div className="pace-done-mark">&#10003;</div>
            <div className="pace-done-text">Amen.</div>
            <div className="pace-done-sub">Marked for today</div>
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
