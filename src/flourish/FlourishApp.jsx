import { useEffect, useMemo, useState } from 'react';
import WordVine from './components/WordVine.jsx';
import { FAMILY } from '../shared/family.js';
import { prayedForThisWeek } from '../data/prayerLink.js';

// ═══════════════════════════════════════════════════════════════════
// Flourish — the third surface, beside the Pond and Pray.
//
// "I am the vine; you are the branches." (John 15:5)
//
// A word or short phrase, written by a growing vine. Options (kept per
// device) choose the pace, the flowers or fruit, how many, the
// reflection, and whether the family grow as branches off the vine —
// each bearing fruit for the times they've been prayed for this week,
// read from the prayer surface. The text is kept in the address (?w=…)
// so it can be shared.
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_WORD = 'Abide';
const MAX_LEN = 40;
const OPTIONS_KEY = 'flourish.options';

const clean = (w) => (w || '').replace(/[^A-Za-z '.,!?&-]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);

function wordFromUrl() {
  try {
    return clean(new URLSearchParams(location.search).get('w')) || DEFAULT_WORD;
  } catch {
    return DEFAULT_WORD;
  }
}

const CHOICES = {
  pace: [['slow', 'Slow'], ['gentle', 'Gentle'], ['brisk', 'Brisk']],
  bloom: [['blossom', 'Blossom'], ['jasmine', 'Jasmine'], ['grapes', 'Grapes'], ['mixed', 'Mixed']],
  amount: [['few', 'Few'], ['some', 'Some'], ['many', 'Many'], ['prayer', 'Days prayed']],
  branches: [['off', 'Off'], ['family', 'Family'], ['sample', 'Family (sample)']],
  reflection: [['on', 'On'], ['off', 'Off']],
};
const DEFAULTS = { pace: 'gentle', bloom: 'blossom', amount: 'some', branches: 'off', reflection: 'on' };
const PACE = { slow: 0.7, gentle: 1, brisk: 1.6 };
// Sample counts, for seeing the family branches on a device where the
// prayer surface hasn't been used yet.
const SAMPLE = [2, 1, 0, 3, 2, 1];

function readOptions() {
  try {
    const o = JSON.parse(localStorage.getItem(OPTIONS_KEY) || '{}');
    const out = { ...DEFAULTS };
    for (const k of Object.keys(CHOICES)) if (CHOICES[k].some(([v]) => v === o[k])) out[k] = o[k];
    return out;
  } catch {
    return { ...DEFAULTS };
  }
}

export default function FlourishApp() {
  const [word, setWord] = useState(wordFromUrl);
  const [draft, setDraft] = useState('');
  const [play, setPlay] = useState(0);
  const [grown, setGrown] = useState(false);
  const [opts, setOpts] = useState(readOptions);
  const [panel, setPanel] = useState(false);
  const prayer = useMemo(() => prayedForThisWeek(), []);

  useEffect(() => { setGrown(false); }, [word, play, opts]);

  useEffect(() => {
    try { localStorage.setItem(OPTIONS_KEY, JSON.stringify(opts)); } catch { /* ignore */ }
  }, [opts]);

  useEffect(() => {
    try {
      const u = new URL(location.href);
      if (word === DEFAULT_WORD) u.searchParams.delete('w');
      else u.searchParams.set('w', word);
      history.replaceState(null, '', u);
    } catch { /* ignore */ }
  }, [word]);

  useEffect(() => {
    if (!panel) return;
    const onKey = (e) => { if (e.key === 'Escape') setPanel(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel]);

  const vineOptions = useMemo(() => {
    const family = opts.branches === 'off' ? null : FAMILY.map((p, i) => ({
      label: p.label,
      count: opts.branches === 'sample' ? SAMPLE[i % SAMPLE.length] : (prayer?.counts?.[p.name] ?? 0),
    }));
    return {
      pace: PACE[opts.pace],
      bloom: opts.bloom,
      amount: opts.amount,
      prayerDays: prayer?.days ?? 0,
      family,
      reflection: opts.reflection === 'on',
    };
  }, [opts, prayer]);

  const submit = (e) => {
    e.preventDefault();
    const w = clean(draft);
    if (!w) return;
    setDraft('');
    if (w === word) setPlay((n) => n + 1);
    else setWord(w);
  };

  const set = (k, v) => setOpts((o) => ({ ...o, [k]: v }));
  const isAbide = word.toLowerCase() === 'abide';

  return (
    <div className="fl-app">
      <nav className="fl-nav" aria-label="Surfaces">
        <a href="/" className="fl-pill">Pond</a>
        <span className="fl-pill is-here" aria-current="page">Flourish</span>
        <a href="/pray/" className="fl-pill">Pray</a>
      </nav>

      <main className="fl-stage">
        <WordVine word={word} options={vineOptions} playKey={play} onGrown={() => setGrown(true)} />
        <p className={`fl-verse${grown ? ' is-shown' : ''}`}>
          {isAbide ? (
            <>
              <span className="fl-verse-text">“Abide in me, and I in you.”</span>
              <span className="fl-verse-ref">John 15:4</span>
            </>
          ) : (
            <>
              <span className="fl-verse-text">“I am the vine; you are the branches.”</span>
              <span className="fl-verse-ref">John 15:5</span>
            </>
          )}
        </p>
      </main>

      <footer className="fl-foot">
        <button type="button" className="fl-btn" onClick={() => setPlay((n) => n + 1)}>
          Grow again
        </button>
        <form className="fl-try" onSubmit={submit}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_LEN}
            placeholder="A word or phrase"
            aria-label="A word or short phrase to grow"
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" className="fl-btn" disabled={!clean(draft)}>Grow</button>
        </form>
        <button
          type="button"
          className={`fl-btn${panel ? ' is-on' : ''}`}
          aria-expanded={panel}
          aria-controls="fl-options"
          onClick={() => setPanel((v) => !v)}
        >
          Options
        </button>
      </footer>

      {panel && (
        <div className="fl-panel" id="fl-options" role="dialog" aria-label="Options">
          <Row label="Pace" k="pace" opts={opts} set={set} />
          <Row label="Flowers" k="bloom" opts={opts} set={set} />
          <Row label="How many" k="amount" opts={opts} set={set} />
          <Row label="Branches" k="branches" opts={opts} set={set} />
          <Row label="Reflection" k="reflection" opts={opts} set={set} />
          <p className="fl-panel-note">
            {prayer
              ? `This week on this device: ${prayer.days} day${prayer.days === 1 ? '' : 's'} prayed. Family branches bear a flower or cluster for each time that person was prayed for.`
              : 'No prayers recorded on this device yet, so family branches show buds. “Family (sample)” shows how they look with fruit.'}
          </p>
          <button type="button" className="fl-btn fl-panel-done" onClick={() => setPanel(false)}>Done</button>
        </div>
      )}
    </div>
  );
}

function Row({ label, k, opts, set }) {
  return (
    <div className="fl-row" role="group" aria-label={label}>
      <span className="fl-row-label">{label}</span>
      <div className="fl-seg">
        {CHOICES[k].map(([v, text]) => (
          <button
            key={v}
            type="button"
            className={opts[k] === v ? 'is-on' : ''}
            aria-pressed={opts[k] === v}
            onClick={() => set(k, v)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
