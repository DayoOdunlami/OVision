import { useEffect, useMemo, useRef, useState } from 'react';
import AbideScene, { skyAt } from './AbideScene.jsx';
import {
  WORDS, wordForRef, wordByKey, readVineyard, gatherToday, todayIso, groundFor, doneTodayFor,
  learnedWords, seasonNow, prettyDate, readField, addToField, daysBetween,
} from './words.js';
import { PEOPLE, personOf, readGroup, writeGroup, groupLabel } from './people.js';
import { readPrayerState } from '../../data/prayerLink.js';

// ═══════════════════════════════════════════════════════════════════
// Abide — a Flourish mode with a purpose.
//
// The outcome: take one word of Scripture into the day, and over the
// weeks see what has taken root — and what has borne fruit. Made for a
// family on one device: whoever is abiding taps in at the start, alone
// or together, and it all goes into one family vineyard of rows.
//
// A daily practice of about three minutes:
//
//   0 Who     tap who's here (remembered from last time)
//   1 Clear   the parable of the sower, by hand (field.js): stones to
//             carry to the wall, thorns to lift slowly and lay in the
//             compost. Care leaves rich soil; a field cleared without
//             dropping a seed is good soil, and today's vine bears more.
//   2 Sow     this week's word (the one the family is praying), or
//             another.
//   3 Abide   it grows only while you stay, at the pace of breath —
//             yours if you hold to breathe in and let go to breathe
//             out; a slow guided breath if you don't. The verse comes a
//             line at a time; then a question.
//   4 Respond optionally, one line in answer, kept with the day.
//   5 Gather  into the vineyard (vineyard.js): a row each, a vine a
//             day, growing for a week; shared days tied together; the
//             family's wall and compost in front. Pan, zoom, tap a vine.
//
// Coming back on a new day, the vineyard shows what grew overnight.
// The whole page follows the clock (sun, moon) and the calendar
// (seasons). Lives beside the original Flourish page (/flourish/).
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
  const [entry, setEntry] = useState(weekWord);
  const [entries, setEntries] = useState(readVineyard);
  const [who, setWhoRaw] = useState(readGroup);
  const setWho = (names) => { setWhoRaw(names); writeGroup(names); };
  const [field, setField] = useState(readField);
  // How many days since the vineyard was last seen: what grew overnight.
  // (Read before it's written: the write happens after mounting, so a
  // render run twice can't see today's date and miss the reveal.)
  const [revealDays] = useState(() => (field.seen ? Math.max(0, daysBetween(field.seen, todayIso())) : 0));
  useEffect(() => { addToField({ seen: todayIso() }); }, []);
  const [ground, setGround] = useState(() => ({ ...groundFor(entries, who), seed: todayIso() + who.join('') }));
  const doneToday = doneTodayFor(entries, who);
  const [phase, setPhase] = useState(doneToday ? 'vineyard' : 'ground');
  const [run, setRun] = useState(0);
  const [progress, setProgress] = useState(0);
  const [breath, setBreath] = useState({ b: '', led: false });
  const [grown, setGrown] = useState(false);
  const [left, setLeft] = useState(ground.weeds + ground.stones);
  const [goodSoil, setGoodSoil] = useState(false);
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
  const [view, setView] = useState('family');
  const [open, setOpen] = useState(null);
  const [grewLine, setGrewLine] = useState(false);
  const [hour, setHour] = useState(hourNow);
  const control = useRef(null);
  // The verse block is measured, and the scene lays the vine out above
  // it; the scene says where the verse begins.
  const verseRef = useRef(null);
  const [textH, setTextH] = useState(0);
  const [verseAt, setVerseAt] = useState(null);
  useEffect(() => {
    const el = verseRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => setTextH(Math.ceil(el.scrollHeight)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // A closing line after the gather: the point of the morning, said once.
  const [sendLine, setSendLine] = useState('');
  const [choosing, setChoosing] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setHour(hourNow()), 60000);
    return () => clearInterval(id);
  }, []);

  const night = skyAt(hour, season).night > 0.5;

  // A fresh field for whoever is here now.
  const startGround = () => {
    const g = { ...groundFor(entries, who), seed: todayIso() + who.join('') + Date.now() };
    setGround(g);
    setLeft(g.weeds + g.stones + 7);
    setGoodSoil(false);
    setRun((n) => n + 1);
    setPhase('ground');
  };
  const sow = () => {
    setProgress(0);
    setGrown(false);
    setBreath({ b: '', led: false });
    setNote('');
    setRun((n) => n + 1);
    setPhase('sow');
  };
  const gather = () => {
    setEntries(gatherToday(entry, note, who, { soil: goodSoil ? 'good' : '' }));
    setSendLine(entry.word);
    setTimeout(() => setSendLine(''), 9000);
    setPhase('gather');
  };
  const again = () => {
    setOpen(null);
    if (doneTodayFor(entries, who)) setPhase('intro');
    else startGround();
  };
  const abideWith = (w) => {
    setOpen(null);
    setEntry(w);
    if (doneTodayFor(entries, who)) setPhase('intro');
    else startGround();
  };
  const onFieldEvent = (ev) => {
    if (ev.type === 'wall') setField(addToField({ wall: 1 }));
    if (ev.type === 'compost') setField(addToField({ compost: 1 }));
  };

  const lines = entry.lines;
  const shownLines = lines.filter((_, k) => progress >= 0.1 + k * 0.22).length;
  const showQuestion = progress >= 0.55;
  const awayLine = ground.away === null
    ? `Welcome, ${groupLabel(who)}`
    : ground.away >= 2 ? `Welcome back · ${ground.away} days away` : 'Before you sow';

  // Vineyard facts.
  const rowsWith = PEOPLE.filter((p) => entries.some((e) => e.who.includes(p.name)));
  const together = entries.filter((e) => e.who.length > 1).length;
  const vines = entries.reduce((m, e) => m + Math.max(1, e.who.length), 0);

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
        field={field}
        who={who}
        view={view}
        goodSoil={goodSoil}
        revealDays={revealDays}
        controlRef={control}
        textH={textH}
        onLayout={setVerseAt}
        onProgress={setProgress}
        onBreath={(b, led) => setBreath({ b, led })}
        onGrown={() => setGrown(true)}
        onGathered={() => setPhase('vineyard')}
        onClearLeft={setLeft}
        onNote={fieldNote}
        patience={patience}
        onCleared={(res) => {
          setGoodSoil(Boolean(res?.perfect));
          setPhase((p) => (p === 'ground' ? 'intro' : p));
        }}
        onFieldEvent={onFieldEvent}
        onTapVine={(e) => setOpen(e)}
        onReveal={(on) => {
          setGrewLine(on);
          if (on) setTimeout(() => setGrewLine(false), 4200);
        }}
      />

      <nav className="ab-nav" aria-label="Surfaces">
        <a href="/" className="ab-pill">Pond</a>
        <span className="ab-switch" role="group" aria-label="Flourish mode">
          <span className="ab-pill is-here" aria-current="page">Abide</span>
          <a href="/flourish/" className="ab-pill">Free write</a>
        </span>
        <a href="/pray/" className="ab-pill">Pray</a>
      </nav>

      {(phase === 'ground' || phase === 'intro') && (
        <WhoPicker who={who} setWho={setWho} />
      )}

      {phase === 'ground' && (
        <section className="ab-ground" aria-live="polite">
          <p className="ab-eyebrow">{awayLine}</p>
          <h1 className="ab-title">Prepare the ground</h1>
          <p className="ab-how">
            Carry each stone to the wall. Lift each thorn out slowly, into the basket.
          </p>
          <p className={`ab-left${fieldLine ? ' is-note' : ''}`}>
            {fieldLine || (left > 0 ? `${left} left` : 'Ready')}
          </p>
          <p className="ab-cite">
            “He cleared it of stones and planted it with the choicest vines.” <span className="ab-nowrap">Isaiah 5:2</span>
          </p>
          {left > 0 && <button type="button" className="ab-link" onClick={() => setPhase('intro')}>Skip</button>}
          <Patience patience={patience} setPatience={setPatience} />
        </section>
      )}

      {phase === 'intro' && (
        <section className="ab-intro">
          <p className="ab-eyebrow">
            {goodSoil ? 'Good soil · ' : ''}{entry === weekWord ? 'This week’s word' : 'Today’s word'}
          </p>
          <h1 className="ab-word">{entry.word}</h1>
          <p className="ab-ref">{entry.ref}</p>
          {goodSoil && (
            <p className="ab-good">Cleared without dropping a seed. “Good soil… bears thirty, sixty, a hundredfold.” Mark 4:20</p>
          )}
          <p className="ab-how">
            Sow it, then stay with it while it grows. About two minutes.
          </p>
          <button type="button" className="ab-btn ab-btn-primary" onClick={sow}>Sow</button>
          {choosing ? (
            <label className="ab-choose">
              <span>Choose a word</span>
              <select
                value={entry.key}
                onChange={(e) => setEntry(WORDS.find((w) => w.key === e.target.value) || weekWord)}
              >
                {WORDS.map((w) => (
                  <option key={w.key} value={w.key}>{w.word} — {w.ref}</option>
                ))}
              </select>
            </label>
          ) : (
            <button type="button" className="ab-link" onClick={() => setChoosing(true)}>Another word</button>
          )}
        </section>
      )}

      <section
        ref={verseRef}
        className={`ab-verse${phase === 'sow' ? '' : ' is-off'}`}
        style={verseAt ? { top: verseAt.verseTop, bottom: 'auto', left: verseAt.inset, right: verseAt.inset } : undefined}
        aria-live="polite"
        aria-hidden={phase !== 'sow'}
      >
          {lines.map((l, k) => (
            <span key={k} className={`ab-line${k < shownLines ? ' is-shown' : ''}`}>{l}</span>
          ))}
          <span className={`ab-verse-ref${shownLines === lines.length ? ' is-shown' : ''}`}>{entry.ref}</span>
          <span className={`ab-question${showQuestion ? ' is-shown' : ''}`}>{entry.question}</span>
          <span className="ab-slot">
          {grown && phase === 'sow' ? (
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
                placeholder="Write a line, or just be still"
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
          </span>
      </section>

      {phase === 'vineyard' && (
        <>
          <div className="ab-views" role="radiogroup" aria-label="Whose vineyard to show">
            <ViewChip on={view === 'family'} onClick={() => setView('family')}>Family</ViewChip>
            {rowsWith.map((p) => (
              <ViewChip key={p.name} on={view === p.name} onClick={() => setView(p.name)} color={p.color}>{p.label}</ViewChip>
            ))}
            {together > 0 && <ViewChip on={view === 'together'} onClick={() => setView('together')} gold>Together</ViewChip>}
          </div>
          <p className={`ab-grew${grewLine || sendLine ? ' is-shown' : ''}`} aria-live="polite">
            {sendLine ? <>Carry <em>{sendLine}</em> with you today.</> : 'Overnight, the vineyard grew.'}
          </p>
          <div className="ab-zoom" role="group" aria-label="Zoom the vineyard">
            <button type="button" className="ab-zoom-btn" onClick={() => control.current?.zoom(1.5)} aria-label="Closer">+</button>
            <button type="button" className="ab-zoom-btn" onClick={() => control.current?.zoom(1 / 1.5)} aria-label="Further">−</button>
            <button type="button" className="ab-zoom-btn" onClick={() => control.current?.home()} aria-label="Back to today">⌂</button>
          </div>
          <section className="ab-foot">
            <p className="ab-summary">
              {entries.length
                ? `${vines} vine${vines === 1 ? '' : 's'}${together ? ` · ${together} day${together === 1 ? '' : 's'} together` : ''}${field.wall ? ` · a wall of ${field.wall} stone${field.wall === 1 ? '' : 's'}` : ''}`
                : 'The vineyard is waiting for its first vine.'}
            </p>
            <button type="button" className="ab-btn" onClick={again}>
              {doneTodayFor(entries, who) ? 'Abide again' : 'Sow today’s word'}
            </button>
          </section>
          {open && (
            <VineCard
              e={open}
              learned={learned}
              weekKey={weekWord.key}
              night={night}
              onClose={() => setOpen(null)}
              onAbide={abideWith}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── Patience: a setting for grown-ups, out of the children's way ──
function Patience({ patience, setPatience }) {
  const [open, setOpen] = useState(false);
  const label = PATIENCE_OPTS.find(([k]) => k === patience)?.[1];
  if (!open) {
    return (
      <button type="button" className="ab-link ab-quiet" onClick={() => setOpen(true)} aria-expanded="false">
        Patience · {label}
      </button>
    );
  }
  return (
    <div className="ab-patience" role="radiogroup" aria-label="Patience: how forgiving the field is with a hurried hand">
      <span className="ab-patience-label">Patience</span>
      {PATIENCE_OPTS.map(([k, l]) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={patience === k}
          className={`ab-patience-opt${patience === k ? ' is-on' : ''}`}
          onClick={() => { setPatience(k); setOpen(false); }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

// ── Who's abiding ─────────────────────────────────────────────────
function WhoPicker({ who, setWho }) {
  const toggle = (name) => {
    const on = who.includes(name);
    if (on && who.length === 1) return;   // always someone
    setWho(on ? who.filter((n) => n !== name) : PEOPLE.map((p) => p.name).filter((n) => n === name || who.includes(n)));
  };
  return (
    <div className="ab-who" role="group" aria-label="Who’s abiding today">
      <span className="ab-who-label">Who’s here?</span>
      {PEOPLE.map((p) => {
        const on = who.includes(p.name);
        return (
          <button
            key={p.name}
            type="button"
            aria-pressed={on}
            className={`ab-who-chip${on ? ' is-on' : ''}`}
            onClick={() => toggle(p.name)}
          >
            <span className="ab-koi" style={{ background: p.color }} aria-hidden="true" />
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

function ViewChip({ on, onClick, color, gold, children }) {
  return (
    <button type="button" role="radio" aria-checked={on} className={`ab-view${on ? ' is-on' : ''}`} onClick={onClick}>
      {color && <span className="ab-koi" style={{ background: color }} aria-hidden="true" />}
      {gold && <span className="ab-koi is-gold" aria-hidden="true" />}
      {children}
    </button>
  );
}

// ── A vine, opened ────────────────────────────────────────────────
function VineCard({ e, learned, weekKey, night, onClose, onAbide }) {
  const ref = useRef(null);
  const w = wordByKey(e.key);
  const ripeOn = learned[e.key];
  const people = e.who.map((n) => personOf(n)).filter(Boolean);

  useEffect(() => {
    ref.current?.querySelector('button')?.focus();
    const onKey = (ev) => { if (ev.key === 'Escape') onClose(); };
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
        aria-label={`${e.word}, ${prettyDate(e.date, { weekday: 'long', day: 'numeric', month: 'long' })}`}
        onClick={(ev) => ev.stopPropagation()}
      >
        <button type="button" className="ab-close" onClick={onClose} aria-label="Close">×</button>
        <p className="ab-eyebrow">{prettyDate(e.date, { weekday: 'long', day: 'numeric', month: 'long' })} · {e.ref}</p>
        <h2 className="ab-card-word">{e.word}</h2>
        {w && (
          <p className="ab-card-verse">
            {w.lines.map((l, k) => <span key={k}>{l} </span>)}
          </p>
        )}
        <ul className="ab-facts">
          <li>
            {people.length
              ? <><span className="ab-dots">{people.map((p) => <span key={p.name} className="ab-koi" style={{ background: p.color }} />)}</span>
                {people.length > 1 ? `Together: ${groupLabel(e.who)}` : `${people[0].label}`}</>
              : <><span className="ab-dot is-family" />The family</>}
          </li>
          <li>
            <span className={`ab-dot ${ripeOn !== undefined ? 'is-ripe' : 'is-green'}`} />
            {ripeOn !== undefined
              ? `Ripe: learned by heart${ripeOn ? ` on ${prettyDate(ripeOn)}` : ''}`
              : e.key === weekKey
                ? <span>Still green: it ripens when you learn this prayer by heart. <a href="/pray/">Learn it in Pray →</a></span>
                : <span>Still green: it ripens when you learn this prayer by heart in Pray, the week it comes round.</span>}
          </li>
          {e.soil === 'good' && <li><span className="ab-dot is-family" />Good soil: the ground was cleared without dropping a seed, so it bore more.</li>}
        </ul>
        {e.note && (
          <div className="ab-notes">
            {w && <p className="ab-notes-q">{w.question}</p>}
            <p className="ab-noteline">{e.note}</p>
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
