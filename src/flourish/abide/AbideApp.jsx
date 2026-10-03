import { useEffect, useMemo, useRef, useState } from 'react';
import AbideScene, { skyAt, groupEntries, ripeness, familyIn } from './AbideScene.jsx';
import {
  WORDS, wordForRef, wordByKey, readVineyard, gatherToday, todayIso, groundFor,
  learnedWords, familyDays, seasonNow, prettyDate,
} from './words.js';
import { readPrayerState } from '../../data/prayerLink.js';

// ═══════════════════════════════════════════════════════════════════
// Abide — a Flourish mode with a purpose.
//
// The outcome: take one word of Scripture into the day, and over the
// weeks see what has taken root — and what has borne fruit.
//
// A daily practice of about three minutes, in five movements:
//
//   1 Clear   the parable of the sower, by hand: a pile of engraved
//             stones to drag off the seed's spot, and thorns to pull up
//             gently and carry away (or they seed). More thorns if you've
//             been away. Setting aside what crowds the mind, before
//             receiving anything. Mark 4:5–7, 18–19.
//   2 Sow     this week's word (the one the family is praying), or
//             another.
//   3 Abide   it grows only while you stay, at the pace of breath —
//             yours if you hold to breathe in and let go to breathe
//             out; a slow guided breath if you don't. The verse comes a
//             line at a time; then a question.
//   4 Respond optionally, one line in answer, kept with the day.
//   5 Gather  into the vineyard: a section per word, a cluster per day.
//
// The vineyard is where it pays off over time. Tap a section to see
// its verse, the days, and what you wrote. Its fruit stays green until
// the verse is learned by heart in the Pray puzzle, then ripens; gold
// berries on the stalk are days the family prayed. The whole page
// follows the clock (sun, moon) and the calendar (seasons).
//
// Lives beside the original Flourish page (/flourish/), which is
// untouched; the switch at the top moves between them.
// ═══════════════════════════════════════════════════════════════════

// How forgiving the field is with a hurried hand. Per device.
const PATIENCE_KEY = 'abide.patience';
const PATIENCE_OPTS = [['forgiving', 'Forgiving'], ['balanced', 'Balanced'], ['exacting', 'Exacting']];
function readPatience() {
  try {
    const v = localStorage.getItem(PATIENCE_KEY);
    return PATIENCE_OPTS.some(([k]) => k === v) ? v : 'balanced';
  } catch { return 'balanced'; }
}

function hourNow() {
  try {
    const q = new URLSearchParams(location.search).get('h');   // ?h=21 to preview night
    if (q !== null && Number.isFinite(Number(q))) return Number(q);
  } catch { /* ignore */ }
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

export default function AbideApp() {
  const weekWord = useMemo(() => wordForRef(readPrayerState().prayerRef), []);
  const season = useMemo(() => seasonNow(), []);
  const learned = useMemo(() => learnedWords(), []);
  const famDays = useMemo(() => familyDays(), []);
  const [entry, setEntry] = useState(weekWord);
  const [entries, setEntries] = useState(readVineyard);
  const ground = useMemo(() => ({ ...groundFor(entries), seed: todayIso() }), []);   // eslint-disable-line react-hooks/exhaustive-deps
  const doneToday = entries.some((e) => e.date === todayIso());
  const [phase, setPhase] = useState(doneToday ? 'vineyard' : 'ground');
  const [run, setRun] = useState(0);
  const [progress, setProgress] = useState(0);
  const [breath, setBreath] = useState({ b: '', led: false });
  const [grown, setGrown] = useState(false);
  const [left, setLeft] = useState(ground.weeds + ground.stones);
  // A passing word from the field ("too quick: it scattered seed").
  const [fieldLine, setNoteLine] = useState('');
  const [patience, setPatienceRaw] = useState(readPatience);
  const setPatience = (v) => {
    setPatienceRaw(v);
    try { localStorage.setItem(PATIENCE_KEY, v); } catch { /* ignore */ }
  };
  const noteTimer = useRef(0);
  const fieldNote = (t) => {
    setNoteLine(t);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNoteLine(''), 3800);
  };
  const [note, setNote] = useState('');
  const [slots, setSlots] = useState([]);
  const [open, setOpen] = useState(-1);
  const [hour, setHour] = useState(hourNow);

  useEffect(() => {
    const id = setInterval(() => setHour(hourNow()), 60000);
    return () => clearInterval(id);
  }, []);

  const night = skyAt(hour, season).night > 0.5;
  const groups = groupEntries(entries);
  const daysTotal = entries.length;

  const sow = () => {
    setProgress(0);
    setGrown(false);
    setBreath({ b: '', led: false });
    setNote('');
    setRun((n) => n + 1);
    setPhase('sow');
  };
  const gather = () => {
    setEntries(gatherToday(entry, note));
    setPhase('gather');
  };
  const abideWith = (w) => {
    setOpen(-1);
    setEntry(w);
    setPhase(doneToday ? 'intro' : 'ground');
  };

  const lines = entry.lines;
  const shownLines = lines.filter((_, k) => progress >= 0.1 + k * 0.22).length;
  const showQuestion = progress >= 0.55;
  const awayLine = ground.away === null
    ? 'Your first time here'
    : ground.away >= 2 ? `Welcome back · ${ground.away} days away` : 'Before you sow';

  return (
    <div className={`ab-app is-${phase}${night ? ' is-night' : ''}`}>
      <AbideScene
        key={run}
        phase={phase}
        entry={entry}
        entries={entries}
        hour={hour}
        season={season}
        ground={ground}
        learned={learned}
        famDays={famDays}
        onProgress={setProgress}
        onBreath={(b, led) => setBreath({ b, led })}
        onGrown={() => setGrown(true)}
        onGathered={() => setPhase('vineyard')}
        onClearLeft={setLeft}
        onNote={fieldNote}
        patience={patience}
        onCleared={() => setPhase((p) => (p === 'ground' ? 'intro' : p))}
        onSlots={setSlots}
      />

      <nav className="ab-nav" aria-label="Surfaces">
        <a href="/" className="ab-pill">Pond</a>
        <span className="ab-switch" role="group" aria-label="Flourish mode">
          <span className="ab-pill is-here" aria-current="page">Abide</span>
          <a href="/flourish/" className="ab-pill">Free write</a>
        </span>
        <a href="/pray/" className="ab-pill">Pray</a>
      </nav>

      {phase === 'ground' && (
        <section className="ab-ground" aria-live="polite">
          <p className="ab-eyebrow">{awayLine}</p>
          <h1 className="ab-title">Prepare the ground</h1>
          <p className="ab-how">
            Drag the stones away from where the seed will fall. Then pull up the thorns, slowly, and carry each one right off the field.
          </p>
          <p className={`ab-left${fieldLine ? ' is-note' : ''}`}>
            {fieldLine || (left > 0 ? `${left} left` : 'Ready')}
          </p>
          <p className="ab-cite">
            “Some fell on rocky ground … some among thorns, and the thorns grew up and choked it.” <span className="ab-nowrap">Mark 4:5–7</span>
          </p>
          <div className="ab-patience" role="radiogroup" aria-label="Patience: how forgiving the field is with a hurried hand">
            <span className="ab-patience-label">Patience</span>
            {PATIENCE_OPTS.map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={patience === k}
                className={`ab-patience-opt${patience === k ? ' is-on' : ''}`}
                onClick={() => setPatience(k)}
              >
                {label}
              </button>
            ))}
          </div>
          {left > 0 && <button type="button" className="ab-link" onClick={() => setPhase('intro')}>Skip</button>}
        </section>
      )}

      {phase === 'intro' && (
        <section className="ab-intro">
          <p className="ab-eyebrow">{entry === weekWord ? 'This week’s word' : 'Today’s word'}</p>
          <h1 className="ab-word">{entry.word}</h1>
          <p className="ab-ref">{entry.ref}</p>
          <p className="ab-how">
            Sow it, then stay while it grows. Breathe with it: hold anywhere to breathe in, let go to breathe out. About two minutes.
          </p>
          <button type="button" className="ab-btn ab-btn-primary" onClick={sow}>Sow</button>
          <label className="ab-choose">
            <span>or choose another</span>
            <select
              value={entry.key}
              onChange={(e) => setEntry(WORDS.find((w) => w.key === e.target.value) || weekWord)}
            >
              {WORDS.map((w) => (
                <option key={w.key} value={w.key}>{w.word} — {w.ref}</option>
              ))}
            </select>
          </label>
        </section>
      )}

      {phase === 'sow' && (
        <section className="ab-verse" aria-live="polite">
          {lines.map((l, k) => (
            <span key={k} className={`ab-line${k < shownLines ? ' is-shown' : ''}`}>{l}</span>
          ))}
          <span className={`ab-verse-ref${shownLines === lines.length ? ' is-shown' : ''}`}>{entry.ref}</span>
          <span className={`ab-question${showQuestion ? ' is-shown' : ''}`}>{entry.question}</span>
          {grown ? (
            <form
              className="ab-respond"
              onSubmit={(e) => { e.preventDefault(); gather(); }}
            >
              <input
                className="ab-note"
                type="text"
                value={note}
                maxLength={160}
                onChange={(e) => setNote(e.target.value)}
                placeholder="A line in answer (optional)"
                aria-label={`Your answer: ${entry.question}`}
                enterKeyHint="done"
              />
              <button type="submit" className="ab-btn ab-btn-primary">Gather into the vineyard</button>
            </form>
          ) : (
            <span className={`ab-breathe${breath.b ? ' is-shown' : ''}`}>
              <span className={`ab-orb is-${breath.b || 'out'}${breath.led ? ' is-led' : ''}`} aria-hidden="true" />
              <span className="ab-breath">
                {breath.b === 'in' ? 'breathe in' : breath.b === 'out' ? 'breathe out' : ''}
                {breath.led ? ' · with you' : ''}
              </span>
              <span className={`ab-tip${!breath.led && progress < 0.3 ? ' is-shown' : ''}`}>
                Hold anywhere (or Space) to breathe in · let go to breathe out
              </span>
            </span>
          )}
        </section>
      )}

      {phase === 'vineyard' && (
        <>
          <div className="ab-sections">
            {slots.map((s) => {
              const grp = groups[s.i];
              if (!grp) return null;
              const ripe = ripeness(grp, learned) >= 4;
              return (
                <button
                  key={`${s.key}-${s.i}`}
                  type="button"
                  className="ab-section"
                  style={{ left: s.box.x, top: Math.min(s.box.y, s.box.labelY), width: s.box.w, height: s.box.h + 24 }}
                  onClick={() => setOpen(s.i)}
                  aria-label={`${grp.word}, ${grp.ref}, ${grp.days.length} day${grp.days.length === 1 ? '' : 's'}${ripe ? ', ripe' : ''}`}
                />
              );
            })}
          </div>
          <section className="ab-foot">
            <p className="ab-summary">
              {groups.length
                ? `Your vineyard · ${groups.length} word${groups.length === 1 ? '' : 's'} · ${daysTotal} day${daysTotal === 1 ? '' : 's'} abided`
                : 'Your vineyard is waiting for its first word.'}
            </p>
            <button type="button" className="ab-btn" onClick={() => setPhase(doneToday ? 'intro' : 'ground')}>
              {doneToday ? 'Abide again' : 'Sow today’s word'}
            </button>
          </section>
          {open >= 0 && groups[open] && (
            <SectionCard
              grp={groups[open]}
              learned={learned}
              famDays={famDays}
              weekKey={weekWord.key}
              night={night}
              onClose={() => setOpen(-1)}
              onAbide={abideWith}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── A section of the vineyard, opened ─────────────────────────────
function SectionCard({ grp, learned, famDays, weekKey, night, onClose, onAbide }) {
  const ref = useRef(null);
  const w = wordByKey(grp.key);
  const ripeOn = learned[grp.key];
  const fam = familyIn(grp, famDays);
  const n = grp.days.length;
  const a = grp.days[0], b = grp.days[n - 1];
  const span = a === b ? prettyDate(a, { weekday: 'short', day: 'numeric', month: 'short' }) : `${prettyDate(a)} – ${prettyDate(b)}`;

  useEffect(() => {
    ref.current?.querySelector('button')?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="ab-scrim" onClick={onClose}>
      <div
        ref={ref}
        className={`ab-card${night ? ' is-night' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${grp.word}, ${grp.ref}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="ab-close" onClick={onClose} aria-label="Close">×</button>
        <p className="ab-eyebrow">{grp.ref}</p>
        <h2 className="ab-card-word">{grp.word}</h2>
        {w && (
          <p className="ab-card-verse">
            {w.lines.map((l, k) => <span key={k}>{l} </span>)}
          </p>
        )}
        <ul className="ab-facts">
          <li><span className="ab-dot is-grape" />Abided {n} day{n === 1 ? '' : 's'} · {span}</li>
          <li>
            <span className={`ab-dot ${ripeOn !== undefined ? 'is-ripe' : 'is-green'}`} />
            {ripeOn !== undefined
              ? `Ripe: learned by heart${ripeOn ? ` on ${prettyDate(ripeOn)}` : ''}`
              : grp.key === weekKey
                ? <span>Still green: it ripens when you learn this prayer by heart. <a href="/pray/">Learn it in Pray →</a></span>
                : <span>Still green: it ripens when you learn this prayer by heart in Pray, the week it comes round.</span>}
          </li>
          {fam > 0 && <li><span className="ab-dot is-family" />The family prayed on {fam} of these days</li>}
        </ul>
        {grp.notes.length > 0 && (
          <div className="ab-notes">
            {w && <p className="ab-notes-q">{w.question}</p>}
            {grp.notes.map((x) => (
              <p key={x.date} className="ab-noteline">
                <span>{prettyDate(x.date)}</span> {x.note}
              </p>
            ))}
          </div>
        )}
        {w && (
          <button type="button" className="ab-btn ab-btn-primary" onClick={() => onAbide(w)}>
            Abide with this word again
          </button>
        )}
      </div>
    </div>
  );
}
