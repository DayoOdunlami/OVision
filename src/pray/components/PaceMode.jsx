import { useEffect, useRef, useState } from 'react';
import { Html, Explore, useEscape, useBodyLock } from './bits.jsx';
import KoiSchool from './KoiSchool.jsx';
import AmenCard from './AmenCard.jsx';

// ═══════════════════════════════════════════════════════════════════
// PaceMode — "Pray it".
//
// One thing on screen, one tempo:
//
//   breath   → settle; no text to read
//   step × n → one thought at a time
//   blessing → Amen, which records the day as prayed, and the koi of
//              everyone prayed for swim in (tap the tick to call them
//              again) — unless the celebration is set to Quiet
//
// Exists because the stated problem is a wandering mind. Focus mode
// only dims competing text; this gives attention a single thing to
// hold. Steps come from buildDay().steps — the same source the reading
// view and the puzzle use.
//
// The thoughts sit in one column that you scroll or swipe through, each
// snapping so its first line sits on the same reading line. The one you're on is in full
// ink; the next shows faintly beneath it, so you know there's more and
// roughly how much, without being able to read ahead. Tap the faint one
// (or scroll, swipe, or press → / Space) to move on.
// ═══════════════════════════════════════════════════════════════════

export default function PaceMode({ day, celebrate = 'recommended', onClose, onAmen, skyWord }) {
  const cards = [
    { kind: 'breath' },
    ...(day.paceSteps || day.steps).map((s) => ({ kind: 'line', ...s })),
    { kind: 'blessing', html: day.blessingHtml },
  ];
  const [i, setI] = useState(0);
  const scrollRef = useRef(null);
  const cardRefs = useRef([]);
  const [done, setDone] = useState(false);
  const [koi, setKoi] = useState(null);          // { id } | null
  const koiIdRef = useRef(0);
  const callKoi = () => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    koiIdRef.current += 1;
    setKoi({ id: koiIdRef.current });
  };
  const last = i === cards.length - 1;

  useEscape(true, onClose);
  useBodyLock(true);

  const go = (n) => {
    const el = cardRefs.current[Math.max(0, Math.min(cards.length - 1, n))];
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
  };
  const next = () => go(i + 1);
  const back = () => go(i - 1);

  // The thought you're on is the one whose first line is nearest the
  // reading line (where each thought snaps to).
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || done) return;
    let raf = 0;
    const pick = () => {
      raf = 0;
      const line = root.scrollTop + parseFloat(getComputedStyle(root).scrollPaddingTop || 0);
      let best = 0, bestD = Infinity;
      cardRefs.current.forEach((el, n) => {
        if (!el) return;
        const d = Math.abs(el.offsetTop - line);
        if (d < bestD) { bestD = d; best = n; }
      });
      setI(best);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(pick); };
    root.addEventListener('scroll', onScroll, { passive: true });
    pick();
    return () => { root.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [done, cards.length]);

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
      if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Enter') {
        // Let Enter/Space activate a focused button normally.
        if (tag === 'button' && (e.key === ' ' || e.key === 'Enter')) return;
        // Amen is said with its button, never by running off the end.
        e.preventDefault();
        if (!last) next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
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

      {done ? (
        <div className="pace-body">
          <AmenCard koiActive={Boolean(koi)} onCallKoi={callKoi} onDone={onClose} skyWord={skyWord} />
        </div>
      ) : (
        <div className="pace-scroll" ref={scrollRef}>
          {cards.map((c, n) => (
            <section
              key={n}
              data-n={n}
              ref={(el) => { cardRefs.current[n] = el; }}
              className={'pace-step' + (n === i ? ' is-on' : '') + (c.kind === 'blessing' ? ' is-blessing' : '')}
              aria-current={n === i ? 'step' : undefined}
              onClick={n === i ? undefined : () => go(n)}
            >
              {c.kind === 'breath' ? (
                <div className="pace-breath">
                  <div className="pace-ring"><span /></div>
                  <div className="pace-who">{who}</div>
                  <p className="pace-hint">Put everything down for a moment.<br />Breathe. Then begin.</p>
                  <button type="button" className="pace-on" onClick={next} aria-label="Begin">
                    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              ) : (
                <div className="pace-card">
                  <Html as="p" className="pace-text" html={c.html} />
                  {c.explain && <Explore html={c.explain} />}
                  {c.kind === 'blessing' && (
                    <button className="btn btn-primary pace-amen" onClick={amen} tabIndex={n === i ? 0 : -1}>Amen</button>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
