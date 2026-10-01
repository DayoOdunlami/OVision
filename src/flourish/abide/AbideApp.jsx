import { useEffect, useMemo, useState } from 'react';
import AbideScene, { skyAt, groupEntries } from './AbideScene.jsx';
import { WORDS, wordForRef, readVineyard, gatherToday, todayIso } from './words.js';
import { readPrayerState } from '../../data/prayerLink.js';

// ═══════════════════════════════════════════════════════════════════
// Abide — a Flourish mode with a purpose.
//
// Outcome: take in one word from Scripture today, and see over time
// what's taking root. Sow this week's word → stay while it grows (it
// only grows while you're here) → gather it into the vineyard.
//
// Lives beside the original Flourish page (/flourish/), which is
// untouched; the switch at the top moves between them.
// ═══════════════════════════════════════════════════════════════════

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
  const [entry, setEntry] = useState(weekWord);
  const [entries, setEntries] = useState(readVineyard);
  const doneToday = entries.some((e) => e.date === todayIso());
  const [phase, setPhase] = useState(doneToday ? 'vineyard' : 'intro');
  const [run, setRun] = useState(0);
  const [progress, setProgress] = useState(0);
  const [breath, setBreath] = useState('');
  const [grown, setGrown] = useState(false);
  const [hour, setHour] = useState(hourNow);

  useEffect(() => {
    const id = setInterval(() => setHour(hourNow()), 60000);
    return () => clearInterval(id);
  }, []);

  const night = skyAt(hour).night > 0.5;
  const groups = groupEntries(entries);
  const daysTotal = entries.length;

  const sow = () => {
    setProgress(0);
    setGrown(false);
    setBreath('');
    setRun((n) => n + 1);
    setPhase('sow');
  };
  const gather = () => {
    setEntries(gatherToday(entry));
    setPhase('gather');
  };

  const lines = entry.lines;
  const shownLines = lines.filter((_, k) => progress >= 0.1 + k * 0.22).length;
  const showQuestion = progress >= 0.55;

  return (
    <div className={`ab-app${night ? ' is-night' : ''}`}>
      <AbideScene
        key={run}
        phase={phase}
        entry={entry}
        entries={entries}
        hour={hour}
        onProgress={setProgress}
        onBreath={setBreath}
        onGrown={() => setGrown(true)}
        onGathered={() => setPhase('vineyard')}
      />

      <nav className="ab-nav" aria-label="Surfaces">
        <a href="/" className="ab-pill">Pond</a>
        <span className="ab-switch" role="group" aria-label="Flourish mode">
          <span className="ab-pill is-here" aria-current="page">Abide</span>
          <a href="/flourish/" className="ab-pill">Free write</a>
        </span>
        <a href="/pray/" className="ab-pill">Pray</a>
      </nav>

      {phase === 'intro' && (
        <section className="ab-intro">
          <p className="ab-eyebrow">{entry === weekWord ? 'This week’s word' : 'Today’s word'}</p>
          <h1 className="ab-word">{entry.word}</h1>
          <p className="ab-ref">{entry.ref}</p>
          <p className="ab-how">Sow it, then stay while it grows. It only grows while you’re here. About two minutes.</p>
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
            <button type="button" className="ab-btn ab-btn-primary ab-gather" onClick={gather}>
              Gather into the vineyard
            </button>
          ) : (
            <span className={`ab-breath${breath ? ' is-shown' : ''}`}>
              {breath === 'in' ? 'breathe in' : breath === 'out' ? 'breathe out' : ''}
            </span>
          )}
        </section>
      )}

      {phase === 'vineyard' && (
        <section className="ab-foot">
          <p className="ab-summary">
            {groups.length
              ? `Your vineyard · ${groups.length} word${groups.length === 1 ? '' : 's'} · ${daysTotal} day${daysTotal === 1 ? '' : 's'} abided`
              : 'Your vineyard is waiting for its first word.'}
          </p>
          <button type="button" className="ab-btn" onClick={() => setPhase('intro')}>
            {doneToday ? 'Abide again' : 'Sow today’s word'}
          </button>
        </section>
      )}
    </div>
  );
}
