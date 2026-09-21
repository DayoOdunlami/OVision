import { useEffect, useRef, useState } from 'react';
import { Html, Explore, useSwipe } from './bits.jsx';
import { DAY_NAMES_LONG, todayDayIndex } from '../lib/state.js';

// ═══════════════════════════════════════════════════════════════════
// ReadingView — the landing page. The prayer *is* the page.
//
// The old layout put six rows of controls (title, date, voice tabs,
// seven day buttons, view toggles, week strip) above the first word of
// prayer, so on a phone the first screen was a control panel. Here the
// only things above the prayer are who you're praying for and which
// passage — everything else is in the Options sheet.
//
// Changing day: swipe sideways on touch, arrow keys or the chevrons on
// desktop.
// ═══════════════════════════════════════════════════════════════════

export default function ReadingView({
  day,
  dayIndex,
  setDayIndex,
  prayedThatDay,
  focus,
  onSavePetition,
  isKids,
}) {
  const rootRef = useRef(null);
  const today = todayDayIndex();

  const prev = () => setDayIndex((dayIndex + 6) % 7);
  const next = () => setDayIndex((dayIndex + 1) % 7);
  useSwipe(rootRef, { onPrev: prev, onNext: next });

  // Arrow keys change day — unless you're typing a petition.
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'textarea' || tag === 'input') return;
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Focus mode: dim every block except the one being read. The block
  // nearest the upper-middle of the screen is "the one being read".
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !focus) return;
    const blocks = root.querySelectorAll('.rv-block');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            blocks.forEach((b) => b.classList.remove('in-view'));
            en.target.classList.add('in-view');
          }
        });
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    blocks.forEach((b) => io.observe(b));
    return () => {
      io.disconnect();
      blocks.forEach((b) => b.classList.remove('in-view'));
    };
  }, [focus, day, dayIndex]);

  if (!day) {
    return (
      <main className="rv" ref={rootRef}>
        <p className="rv-empty">No pairing for this day. Open Options to shuffle a new week.</p>
      </main>
    );
  }

  const dayLabel = dayIndex === today
    ? `${DAY_NAMES_LONG[dayIndex]} · Today`
    : DAY_NAMES_LONG[dayIndex];

  return (
    <main className={`rv${focus ? ' is-focus' : ''}${isKids ? ' is-kids' : ''}`} ref={rootRef}>
      <header className="rv-head">
        <div className="rv-daynav">
          <button className="rv-chev" onClick={prev} aria-label="Previous day">&#8249;</button>
          <span className="rv-day">{dayLabel}</span>
          <button className="rv-chev" onClick={next} aria-label="Next day">&#8250;</button>
        </div>

        {/* Keyed on the day so it re-animates when you swipe. */}
        <div key={`who-${dayIndex}`} className="rv-who-wrap">
          <h1 className="rv-who">
            {day.who.b ? (
              <>
                {day.who.a}
                <span className="rv-amp"> &amp; </span>
                {day.who.b}
              </>
            ) : (
              day.who.a
            )}
          </h1>
          <div className="rv-ref">
            {day.isSunday ? day.title : day.prayer.ref}
            <span className="rv-ref-dot">{' · '}</span>
            <span className="rv-ref-theme">{day.isSunday ? 'Sunday' : day.prayer.theme}</span>
          </div>
          {day.subtitle && <div className="rv-sub">{day.subtitle}</div>}
          {prayedThatDay && <div className="rv-prayed">&#10003; Prayed</div>}
        </div>
      </header>

      <article key={`body-${dayIndex}`} className="rv-prayer">
        {day.instruction && <p className="rv-instruction">{day.instruction}</p>}

        {day.body.kind === 'flowing' &&
          day.body.paragraphs.map((p, i) => (
            <Html key={i} as="p" className="rv-block rv-p" html={p} />
          ))}

        {day.body.kind === 'sections' &&
          day.body.sections.map((s, i) => (
            <section key={i} className="rv-block rv-section">
              <Html as="p" className="rv-p" html={s.html} />
              <Explore html={s.explain} />
            </section>
          ))}

        {day.body.kind === 'lords' && (
          <section className="rv-block rv-section">
            <Html as="p" className="rv-p rv-lords" html={day.body.html} />
            <Explore html={day.body.explain} />
          </section>
        )}

        {day.prompt && (
          <Petition
            key={`pet-${dayIndex}`}
            prompt={day.prompt}
            onSave={onSavePetition}
          />
        )}

        <section className="rv-block rv-blessing">
          <Html as="p" className="rv-blessing-text" html={day.blessingHtml} />
          <p className="rv-amen">Amen.</p>
          <Explore html={day.blessingExplain} />
        </section>

        {day.closing && <p className="rv-closing">{day.closing}</p>}
      </article>
    </main>
  );
}

// The pause after the prayer: a question to pray with, and somewhere to
// write down what you prayed. Collapsed by default so it reads as part
// of the prayer, not a form.
function Petition({ prompt, onSave }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const taRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => taRef.current?.focus(), 80);
  }, [open]);

  const save = () => {
    const t = text.trim();
    if (!t) return;
    onSave(t);
    setText('');
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <section className={`rv-block rv-petition${open ? ' is-open' : ''}`}>
      <button
        className="rv-petition-prompt"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {prompt}
        <span className="rv-petition-hint">
          {open ? 'Close' : 'Write what you prayed'}
        </span>
      </button>
      {open && (
        <div className="rv-petition-body">
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What did you pray?"
            rows={3}
          />
          <button className={`btn btn-quiet${saved ? ' is-saved' : ''}`} onClick={save} disabled={!text.trim() && !saved}>
            {saved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      )}
    </section>
  );
}
