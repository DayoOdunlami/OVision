import { useState } from 'react';
import { go, home } from '../route.js';
import { useStore } from '../store.js';
import { niceDate, niceWeekRange, weekOf, addDays } from '../calendar.js';
import { VERSES } from '../content/verses.js';
import { peopleOf, andNames } from '../household.js';
import { CloseButton, KoiGlyph } from '../ui.jsx';

// ═══════════════════════════════════════════════════════════════════
// This season — who we're becoming, and what has taken root.
//
// The family's word and its few practices; each person's own word
// around it. Then the season looked back on, week by week: the word and
// verse, and whether it was said by heart (the lotus on the pond). The
// lines written in the morning, if any. Never counts of prayer, never
// one child against another.
// ═══════════════════════════════════════════════════════════════════

export default function Season({ day }) {
  const state = useStore();
  const season = day.season;
  const [openPast, setOpenPast] = useState(null);
  const past = state.seasons.filter((s) => s.end).slice().reverse();

  if (!season) {
    return (
      <div className="room room-paper season" role="dialog" aria-modal="true" aria-label="This season">
        <div className="room-top"><span /><CloseButton onClick={home} /></div>
        <div className="room-body centred">
          <p className="label">This season</p>
          <h1 className="room-title">Who are we becoming?</h1>
          <p className="room-sub">Choose a word for each of you, and one for your family, for this term or season. The family’s word will lie in the pond.</p>
          <button className="btn btn-primary btn-big" onClick={() => go('season/new')}>Choose our words</button>
        </div>
      </div>
    );
  }

  const weeks = day.pads.slice().reverse();
  const lines = state.sittings.filter((s) => s.line && s.date >= season.start).slice(-6).reverse();

  return (
    <div className="room room-paper season" role="dialog" aria-modal="true" aria-label="This season">
      <div className="room-top"><span /><CloseButton onClick={home} /></div>
      <div className="room-body scroll">
        <p className="label">{season.name} · since {niceDate(season.start)}</p>
        <h1 className="season-word">{season.family.word}</h1>
        {!season.compass && season.family.line && <p className="season-line">{season.family.line}</p>}
        {season.compass && <div className="compass-book-intentions"><p className="label">Make room for</p><p>{season.compass.family?.yes || 'Still to choose'}</p><p className="label">Leave behind</p><p>{season.compass.family?.no || 'Still to choose'}</p></div>}
        {!season.compass && season.family.practices?.length > 0 && (
          <div className="practices">
            <p className="label">We will</p>
            <ul>{season.family.practices.map((p, k) => <li key={k}>{p}</li>)}</ul>
          </div>
        )}

        <div className="each">
          {day.people.map((p) => (
            <div key={p.id} className="each-one">
              <KoiGlyph koi={p.koi} size={34} />
              <span className="each-name">{p.name}</span>
              <span className="each-word">{season.words?.[p.id] || '—'}</span>
            </div>
          ))}
        </div>

        <h2 className="section-title">What has taken root</h2>
        <p className="room-sub">On the pond: a lily pad for every week, and a lotus for each verse said by heart.</p>
        <ol className="weeks">
          {weeks.map((w) => {
            const idx = state.sittings.find((s) => s.week === w.week)?.prayer ?? (w.week === day.week ? day.prayerIdx : null);
            const v = idx != null ? VERSES[idx] : null;
            return (
              <li key={w.week} className={w.lotus ? 'is-lotus' : ''}>
                <span className="week-mark" aria-hidden="true">{w.lotus ? <Lotus /> : <Pad />}</span>
                <span className="week-when">{niceWeekRange(w.week)}{w.week === day.week ? ' · this week' : ''}</span>
                <span className="week-what">
                  {v ? <><b>{v.word}</b> · {v.ref}</> : <span className="muted">A quiet week</span>}
                  {w.lotus && <span className="week-heart"> · said by heart</span>}
                </span>
              </li>
            );
          })}
        </ol>

        {lines.length > 0 && (
          <>
            <h2 className="section-title">What we prayed</h2>
            <ul className="lines">
              {lines.map((s) => (
                <li key={s.id}>
                  <p>“{s.line}”</p>
                  <span>{niceDate(s.date)} · for {andNames(peopleOf(day.household, s.for))}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="season-actions">
          <button className="btn btn-primary" onClick={() => go('board')}>Our living compass</button>
          <button className="btn btn-secondary" onClick={() => go('season/new', { edit: '1' })}>Change our words</button>
          <button className="btn btn-secondary" onClick={() => go('season/new')}>Begin a new season</button>
        </div>

        {past.length > 0 && (
          <>
            <h2 className="section-title">The book of seasons</h2>
            <ul className="past">
              {past.map((s) => (
                <li key={s.id}>
                  <button className="past-head" onClick={() => setOpenPast(openPast === s.id ? null : s.id)} aria-expanded={openPast === s.id}>
                    <span className="past-word">{s.family.word}</span>
                    <span className="past-name">{s.name} · {niceDate(s.start)} – {niceDate(s.end || addDays(weekOf(s.start), 7))}</span>
                  </button>
                  {openPast === s.id && (
                    <div className="past-body">
                      {s.compass ? <><p>Make room for {s.compass.family?.yes || 'what matters'}.</p><p>Leave behind {s.compass.family?.no || 'what crowds it out'}.</p></> : s.family.line && <p className="season-line">{s.family.line}</p>}
                      <p className="past-words">
                        {day.people.filter((p) => s.words?.[p.id]).map((p) => `${p.name}: ${s.words[p.id]}`).join(' · ')}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function Pad() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28"><path d="M14 14 L25 10 A11 11 0 1 1 22 6 Z" fill="#6f9e5c" /></svg>
  );
}
function Lotus() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <path d="M14 14 L25 10 A11 11 0 1 1 22 6 Z" fill="#6f9e5c" />
      {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="14" cy="9" rx="3" ry="6" fill="#f6b8cb" transform={`rotate(${a} 14 14)`} />)}
      <circle cx="14" cy="14" r="2.6" fill="#f2c45a" />
    </svg>
  );
}
