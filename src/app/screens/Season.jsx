import { useState } from 'react';
import { go, home } from '../route.js';
import { useStore } from '../store.js';
import { niceDate, niceWeekRange, weekOf, addDays } from '../calendar.js';
import { VERSES } from '../content/verses.js';
import { peopleOf, andNames } from '../household.js';
import { CloseButton, KoiGlyph } from '../ui.jsx';
import { lowerFirst } from '../board.js';

// ═══════════════════════════════════════════════════════════════════
// Our way — the whole board on paper, and what has taken root.
//
// The family's word, its yeses and the no each protects; each person's
// own word and yes (touch one for their board in the world). Then the
// season looked back on, week by week, in the marks of whichever world
// the board lives in: a pad and a water lily in the pond; leaves and a
// flower on the vine. Never counts of prayer, never one child against
// another, and no one's own no: those stay on their own board.
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
          <p className="room-sub">Pass the tablet round: a word and a yes for each of you, then a word and a few yeses for all of you, for this term or season.</p>
          <button className="btn btn-primary btn-big" onClick={() => go('season/new')}>Set our way, together</button>
        </div>
      </div>
    );
  }

  const board = day.board;
  const vine = day.world === 'vine';
  const weeks = day.pads.slice().reverse();
  const lines = state.sittings.filter((s) => s.line && s.date >= season.start).slice(-6).reverse();

  return (
    <div className="room room-paper season" role="dialog" aria-modal="true" aria-label="Our way">
      <div className="room-top"><span /><CloseButton onClick={home} label="Back to our board" /></div>
      <div className="room-body scroll">
        <p className="label">{season.name} · since {niceDate(season.start)}</p>
        <h1 className="season-word">{board.word}</h1>
        {board.line && <p className="season-line">{board.line}</p>}
        {board.yes.length > 0 && (
          <div className="practices">
            <p className="label">We say yes to</p>
            <ul className="yes-list">
              {board.yes.map((y) => (
                <li key={y.text}>
                  <b>{y.text}</b>
                  {y.no && <span>so, no to {lowerFirst(y.no)}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2 className="section-title">Each of us</h2>
        <div className="each">
          {board.people.map((p) => (
            <button key={p.id} className="each-one" onClick={() => go('me', { p: p.id })}>
              <KoiGlyph koi={p.koi} size={34} />
              <span className="each-name">{p.name}</span>
              <span className="each-word">{p.word || '—'}</span>
              {p.yes && <span className="each-yes">Yes to {lowerFirst(p.yes)}</span>}
            </button>
          ))}
        </div>

        <h2 className="section-title">What has taken root</h2>
        <p className="room-sub">{vine ? 'On the vine: new leaves for every week, and a flower for each verse said by heart. The grapes ripen as the season goes.' : 'In the pond: a lily pad for every week, and a water lily for each verse said by heart.'}</p>
        <ol className="weeks">
          {weeks.map((w) => {
            const idx = state.sittings.find((s) => s.week === w.week)?.prayer ?? (w.week === day.week ? day.prayerIdx : null);
            const v = idx != null ? VERSES[idx] : null;
            return (
              <li key={w.week} className={w.lotus ? 'is-lotus' : ''}>
                <span className="week-mark" aria-hidden="true">{vine ? <Leaf flower={w.lotus} /> : w.lotus ? <Lotus /> : <Pad />}</span>
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
          <button className="btn btn-primary" onClick={home}>Back to our board</button>
          <button className="btn btn-secondary" onClick={() => go('season/new', { edit: '1' })}>Change our way</button>
          <button className="btn btn-secondary" onClick={() => go('season/new')}>Set a new season, together</button>
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
                      {s.family.line && <p className="season-line">{s.family.line}</p>}
                      {(s.family.yes || []).length > 0 && <p className="past-words">Yes to {s.family.yes.map((y) => lowerFirst(y.text)).join(' · ')}</p>}
                      {s.lookBack && <p className="past-words">Where we saw God: “{s.lookBack}”</p>}
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

function Leaf({ flower }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <path d="M5 23 C5 13 11 6 23 5 C23 16 16 22 5 23 Z" fill="#6c9a2e" />
      <path d="M5 23 C10 17 14 13 19 9" stroke="#a9cb55" strokeWidth="1.2" fill="none" />
      {flower && [0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="20" cy="6" rx="2.2" ry="3.6" fill="#fffaf2" transform={`rotate(${a} 20 9)`} />)}
      {flower && <circle cx="20" cy="9" r="1.6" fill="#e8b64a" />}
    </svg>
  );
}
