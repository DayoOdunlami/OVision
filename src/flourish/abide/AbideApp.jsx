import { useEffect, useMemo, useRef, useState } from 'react';
import AbideScene, { skyAt } from './AbideScene.jsx';
import {
  WORDS, wordForRef, wordByKey, readVineyard, gatherToday, todayIso, groundFor, doneTodayFor,
  learnedWords, seasonNow, prettyDate, readField, addToField, daysBetween,
  clearedToday, markCleared, questionOf,
} from './words.js';
import { lab } from '../../shared/labs.js';
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

// Development: ?fast=1 runs the after-growth timings twenty times faster.
const FAST = import.meta.env.DEV && /[?&]fast=1/.test(location.search) ? 0.05 : 1;
// ?at=intro|sow|vineyard opens at that step (for Labs' side-by-side).
const AT = (() => { try { return new URLSearchParams(location.search).get('at') || ''; } catch { return ''; } })();

export default function AbideApp() {
  // Which of the design pass's changes are on (see /labs/).
  const L = useMemo(() => ({
    breathWords: lab('abide.breathWords'),
    readTwice: lab('abide.readTwice'),
    stillness: lab('abide.stillness'),
    smallField: lab('abide.smallField'),
    noFreeWrite: lab('abide.noFreeWrite'),
    humanLine: lab('abide.humanLine'),
    wonder: lab('abide.wonder'),
    closingLine: lab('abide.closingLine'),
  }), []);
  const weekWord = useMemo(() => wordForRef(readPrayerState().prayerRef), []);
  const season = useMemo(() => seasonNow(), []);
  const learned = useMemo(() => learnedWords(), []);
  const [entry, setEntry] = useState(weekWord);
  const [entries, setEntries] = useState(readVineyard);
  const [who, setWhoRaw] = useState(readGroup);
  const [field, setField] = useState(readField);
  // How many days since the vineyard was last seen: what grew overnight.
  // (Read before it's written: the write happens after mounting, so a
  // render run twice can't see today's date and miss the reveal.)
  const [revealDays] = useState(() => (field.seen ? Math.max(0, daysBetween(field.seen, todayIso())) : 0));
  useEffect(() => { addToField({ seen: todayIso() }); }, []);
  const [ground, setGround] = useState(() => ({ ...groundFor(entries, who, L.smallField), seed: todayIso() + who.join('') }));
  const doneToday = doneTodayFor(entries, who);
  // Back again today, with the ground already cleared: straight to sowing.
  const [phase, setPhase] = useState(() => {
    if (AT === 'intro' || AT === 'sow') return 'intro';
    if (AT === 'vineyard') return 'vineyard';
    return doneToday ? 'vineyard' : L.smallField && clearedToday(who) ? 'intro' : 'ground';
  });
  const [run, setRun] = useState(0);
  const [progress, setProgress] = useState(0);
  const [breath, setBreath] = useState({ b: '', led: false });
  const [grown, setGrown] = useState(false);
  const groundTotal = ground.weeds + ground.stones + (ground.rubble ?? 7);
  const [left, setLeft] = useState(groundTotal);
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
  // After the vine has grown: read it again, a line at a time; be still;
  // then gather. ('grow' → 'again' → 'still' → 'ready'.)
  const [stage, setStage] = useState('grow');
  const [againK, setAgainK] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setHour(hourNow()), 60000);
    return () => clearInterval(id);
  }, []);

  const night = skyAt(hour, season).night > 0.5;

  // A fresh field for whoever is here now (sized to them).
  const startGround = (names = who) => {
    if (L.smallField && clearedToday(names)) { setPhase('intro'); return; }
    const g = { ...groundFor(entries, names, L.smallField), seed: todayIso() + names.join('') + Date.now() };
    setGround(g);
    setLeft(g.weeds + g.stones + (g.rubble ?? 7));
    setGoodSoil(false);
    setRun((n) => n + 1);
    setPhase('ground');
  };
  const setWho = (names) => {
    setWhoRaw(names);
    writeGroup(names);
    // Someone joined or left before any clearing began: lay the field
    // out again for the group, so there's enough work for everyone.
    if (L.smallField && phase === 'ground' && left === groundTotal) startGround(names);
  };
  const toIntro = () => {
    if (L.smallField) markCleared(who);
    setPhase('intro');
  };
  const sow = () => {
    setProgress(0);
    setStage('grow');
    setAgainK(0);
    setGrown(false);
    setBreath({ b: '', led: false });
    setNote('');
    setRun((n) => n + 1);
    setPhase('sow');
  };
  const gather = () => {
    setEntries(gatherToday(entry, note, who, { soil: goodSoil ? 'good' : '' }));
    if (L.closingLine) {
      setSendLine(entry.word);
      setTimeout(() => setSendLine(''), 9000);
    }
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

  // Opened with ?at=sow: start sowing straight away.
  useEffect(() => { if (AT === 'sow') sow(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  // The vine has grown: on to reading again, stillness, then gathering.
  useEffect(() => {
    if (!grown || phase !== 'sow') return undefined;
    if (stage === 'grow') {
      setStage(L.readTwice ? 'again' : L.stillness ? 'still' : 'ready');
      return undefined;
    }
    let t = 0;
    if (stage === 'again') {
      t = againK < entry.lines.length
        ? setTimeout(() => setAgainK((k) => k + 1), (againK === 0 ? 2600 : 3400) * FAST)
        : setTimeout(() => setStage(L.stillness ? 'still' : 'ready'), 2400 * FAST);
    }
    if (stage === 'still') t = setTimeout(() => setStage('ready'), 15000 * FAST);
    return () => clearTimeout(t);
  }, [grown, phase, stage, againK, entry, L]);

  const lines = entry.lines;
  const firstRead = lines.filter((_, k) => progress >= 0.1 + k * 0.22).length;
  const shownLines = stage === 'again' ? againK : firstRead;
  const keyed = stage !== 'grow' && L.readTwice;
  const showQuestion = L.readTwice ? stage === 'still' || stage === 'ready' : progress >= 0.55;
  const question = questionOf(entry, L.wonder);
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
          if (L.smallField) markCleared(who);
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
        {L.noFreeWrite ? (
          <span className="ab-switch"><span className="ab-pill is-here" aria-current="page">Abide</span></span>
        ) : (
          <span className="ab-switch" role="group" aria-label="Flourish mode">
            <span className="ab-pill is-here" aria-current="page">Abide</span>
            <a href="/flourish/" className="ab-pill">Free write</a>
          </span>
        )}
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
          {left > 0 && <button type="button" className="ab-link" onClick={toIntro}>Skip</button>}
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
            <span key={k} className={`ab-line${k < shownLines ? ' is-shown' : ''}`}>{keyed ? keyWord(l, entry.word) : l}</span>
          ))}
          <span className={`ab-verse-ref${shownLines === lines.length ? ' is-shown' : ''}`}>{entry.ref}</span>
          <span className={`ab-question${showQuestion ? ' is-shown' : ''}`}>{question}</span>
          <span className="ab-slot">
          {grown && phase === 'sow' && stage === 'ready' ? (
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
                placeholder={L.wonder ? 'Write a line, or just be still' : 'A line in answer (optional)'}
                aria-label={`Your answer: ${question}`}
                enterKeyHint="done"
              />
              <button type="submit" className="ab-btn ab-btn-primary">Gather into the vineyard</button>
            </form>
          ) : (
            <span className={`ab-breathe${breath.b ? ' is-shown' : ''}`}>
              <span className={`ab-orb is-${breath.b || 'out'}${breath.led ? ' is-led' : ''}`} aria-hidden="true" />
              {L.breathWords && entry.breath ? (
                // A breath prayer from the verse: one half in, one half out.
                <span className="ab-breath-words" aria-live="off">
                  <span className={breath.b === 'in' ? 'is-on' : ''}>{entry.breath[0]}</span>
                  <span className={breath.b === 'out' ? 'is-on' : ''}>{entry.breath[1]}</span>
                </span>
              ) : (
                <span className="ab-breath">
                  {breath.b === 'in' ? 'breathe in' : breath.b === 'out' ? 'breathe out' : ''}
                  {breath.led ? ' · with you' : ''}
                </span>
              )}
              <span className={`ab-tip${stage === 'still' || (!breath.led && progress < 0.3) ? ' is-shown' : ''}`}>
                {stage === 'still'
                  ? 'Be still for a moment.'
                  : L.breathWords
                    ? 'Say it with your breath. Hold anywhere to breathe in, let go to breathe out.'
                    : 'Hold anywhere (or Space) to breathe in · let go to breathe out'}
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
              {L.humanLine ? vineyardLine(entries, view) : entries.length
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

// The verse's own word, picked out on the second reading ("Abide" in
// "Abide in me"; "keep" for Keep). Matched on its first four letters.
function keyWord(line, word) {
  const stem = word.toLowerCase().slice(0, Math.min(4, word.length));
  const parts = line.split(/(\s+)/);
  const hit = parts.findIndex((t) => t.toLowerCase().replace(/[^a-z]/g, '').startsWith(stem));
  if (hit < 0) return line;
  return <>{parts.slice(0, hit).join('')}<em className="ab-key">{parts[hit]}</em>{parts.slice(hit + 1).join('')}</>;
}

// One human sentence about the vineyard, for whoever it's showing:
// "Bella and Dad have abided together 7 times."
const times = (n) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);
const nameOf = (n) => personOf(n)?.label || n;
export function vineyardLine(entries, view = 'family') {
  if (!entries.length) return 'The vineyard is waiting for its first vine.';
  const order = (n) => { const i = PEOPLE.findIndex((p) => p.name === n); return i < 0 ? 99 : i; };
  const pairs = new Map();
  for (const e of entries) {
    const ws = [...e.who].sort((a, b) => order(a) - order(b));
    for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) {
      const k = ws[i] + '|' + ws[j];
      pairs.set(k, (pairs.get(k) || 0) + 1);
    }
  }
  const best = (who) => {
    let top = null;
    for (const [k, n] of pairs) {
      if (who && !k.split('|').includes(who)) continue;
      if (!top || n > top[1]) top = [k.split('|'), n];
    }
    return top;
  };
  if (view !== 'family' && view !== 'together') {
    const n = entries.filter((e) => e.who.includes(view)).length;
    const tp = best(view);
    if (!n) return `${nameOf(view)}'s row is ready for a first vine.`;
    if (tp) {
      const other = tp[0].find((x) => x !== view);
      return `${nameOf(view)} has abided ${times(n)}, ${times(tp[1])} with ${nameOf(other)}.`;
    }
    return `${nameOf(view)} has abided ${times(n)}.`;
  }
  const tp = best();
  if (tp) return `${nameOf(tp[0][0])} and ${nameOf(tp[0][1])} have abided together ${times(tp[1])}.`;
  const people = PEOPLE.filter((p) => entries.some((e) => e.who.includes(p.name)));
  if (people.length === 1) return `${people[0].label} has abided ${times(entries.length)}.`;
  if (!people.length) return `The family has abided ${times(entries.length)}.`;
  return `${people.slice(0, -1).map((p) => p.label).join(', ')} and ${people[people.length - 1].label} have abided ${times(entries.length)} between them.`;
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
