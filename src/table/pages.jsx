import { useEffect, useState } from 'react';
import {
  hueFor,
  joinNames,
  personName,
  slugId,
  weekdayName,
} from './model.js';
import { NIV_NOTICE, verseText } from './verses.js';

const SUGGESTED = ['Near', 'Steady', 'Gentle', 'Brave', 'Joy'];

export function Home({
  now, verse, pairLabel, people, selected, satLine, newVerse, primary, onPrimary,
  onQuiet, quietLabel, fallLabel, onFall, onToggle, onGlance, onWeek, onSeason,
}) {
  const date = `${weekdayName(now)} ${now.getDate()} ${now.toLocaleDateString('en-GB', { month: 'long' })}`;
  return (
    <div className="screen">
      <div className="sheet">
        <p className="kicker">{date}</p>
        {newVerse && <p className="new-line">A new verse this week.</p>}
        <h1 className="verse-line">{verse.clauses[0]}</h1>
        <p className="ref">{verse.ref} · NIV</p>
        <p className="names">{pairLabel}</p>
        <div className="people" role="group" aria-label="Who is here">
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              className={selected.includes(p.id) ? 'chip on' : 'chip'}
              aria-pressed={selected.includes(p.id)}
              onClick={() => onToggle(p.id)}
            >
              <span className="dot" style={{ '--hue': p.hue }} />
              {p.name}
            </button>
          ))}
        </div>
        {satLine && <p className="sat-line">{satLine}</p>}
        <div className="actions">
          {primary && <button className="primary" type="button" onClick={onPrimary}>{primary}</button>}
          {fallLabel && <button className="quiet" type="button" onClick={onFall}>{fallLabel}</button>}
          {quietLabel && <button className="quiet" type="button" onClick={onQuiet}>{quietLabel}</button>}
        </div>
        <div className="footer">
          <button className="quiet" type="button" onClick={onGlance}>Leave it open</button>
          <button className="quiet" type="button" onClick={onWeek}>The weeks</button>
          <button className="quiet" type="button" onClick={onSeason}>This season</button>
        </div>
        <p className="legal">{NIV_NOTICE}</p>
      </div>
    </div>
  );
}

export function Week({ state, now, weeks, onHome, onSeason }) {
  const any = Object.keys(state.sittings || {}).length > 0;
  const rooted = weeks.filter((w) => w.learned.length).length;
  return (
    <div className="screen">
      <div className="sheet">
        <div className="bar">
          <button className="quiet" type="button" onClick={onHome}>Back</button>
          <button className="quiet" type="button" onClick={() => window.print()}>Print the verse</button>
        </div>
        <h1 className="names">{state.board.word || 'This season'}</h1>
        {state.board.sentence && <p className="prayer-line">{state.board.sentence}</p>}
        {personWords(state) && <p className="note">{personWords(state)}</p>}
        <Sprig n={rooted} />
        {!any && <p className="prayer-line">Nothing has been prayed yet. That is all right.</p>}
        {weeks.map((week) => (
          <section className="week-block" key={week.monday}>
            <h2>{week.current ? 'This week' : niceDate(week.monday)}</h2>
            <p className="prayer-line">{week.verse.clauses[0]}</p>
            <p className="ref">{week.verse.ref} · NIV</p>
            <ul className="days">
              {week.days.map((day) => (
                <li key={day.iso} className={`day${day.today ? ' today' : ''}${day.future ? ' future' : ''}`}>
                  <span className="day-letter">{day.letter}</span>
                  {day.who.length === 0 && !day.future && <span className="mark" />}
                  {day.who.map((id) => {
                    const person = state.household.people.find((p) => p.id === id);
                    return <span key={id} className="mark on" style={{ '--hue': person?.hue || 'var(--clay)' }} title={personName(state, id)} />;
                  })}
                </li>
              ))}
            </ul>
            {week.learned.length > 0 && (
              <p className="note">{joinNames(week.learned.map((id) => personName(state, id)))} put the verse back.</p>
            )}
            {week.notes.map((note) => (
              <p className="note" key={note.word + note.ids.join()}>
                {joinNames(note.ids.map((id) => personName(state, id)))} set down {note.word}.
              </p>
            ))}
          </section>
        ))}
        <button className="quiet" type="button" onClick={onSeason}>Review the season</button>
        <p className="legal">{NIV_NOTICE}</p>
        <div className="print-verse" aria-hidden="true">
          <p>{state.board.word}</p>
          <p>{weeks[0] ? verseText(weeks[0].verse) : ''}</p>
          <p>{weeks[0]?.verse.ref} · NIV</p>
        </div>
      </div>
    </div>
  );
}

function personWords(state) {
  const line = state.household.people
    .filter((p) => state.board.personal && state.board.personal[p.id])
    .map((p) => `${p.name}, ${state.board.personal[p.id]}`)
    .join(' · ');
  return line;
}

function Sprig({ n }) {
  const leaves = Math.min(n, 6);
  return (
    <svg className="sprig" viewBox="0 0 160 42" aria-hidden="true">
      <path d="M4 32 C 50 34, 100 30, 154 28" stroke="currentColor" fill="none" strokeWidth="1.4" />
      {Array.from({ length: leaves }, (_, i) => (
        <path key={i} fill="currentColor" d="M0 0 C 6 -12, 16 -12, 18 -1 C 12 3, 5 3, 0 0 Z" transform={`translate(${18 + i * 22} 30) rotate(-36)`} />
      ))}
    </svg>
  );
}

function niceDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

export function Season({ state, onSave, onHome }) {
  const [word, setWord] = useState(state.board.word || '');
  const [sentence, setSentence] = useState(state.board.sentence || '');
  const [season, setSeason] = useState(state.board.season || '');
  const [commitments, setCommitments] = useState(() => {
    const c = state.board.commitments || [];
    return [0, 1, 2, 3].map((i) => c[i] || '');
  });
  const [personal, setPersonal] = useState({ ...state.board.personal });
  const [people, setPeople] = useState(state.household.people.map((p) => ({ ...p })));
  const [draft, setDraft] = useState('');
  const [kind, setKind] = useState('child');
  const install = useInstall();

  function addPerson() {
    const name = draft.trim().slice(0, 24);
    if (!name) return;
    const id = slugId(name, people.map((p) => p.id));
    setPeople([...people, { id, name, kind, hue: hueFor(people.length) }]);
    setDraft('');
  }

  function save() {
    onSave({
      people,
      board: {
        word: word.trim() || 'Near',
        sentence: sentence.trim(),
        season: season.trim() || 'This season',
        commitments: commitments.map((c) => c.trim()).filter(Boolean).slice(0, 4),
        personal,
      },
    });
  }

  return (
    <div className="screen">
      <div className="sheet">
        <div className="bar">
          <button className="quiet" type="button" onClick={onHome}>Back</button>
        </div>
        <h1 className="names">This season</h1>
        <label className="field">
          <span>One word</span>
          <input value={word} onChange={(e) => setWord(e.target.value)} maxLength={18} />
        </label>
        <label className="field">
          <span>In a sentence</span>
          <textarea value={sentence} onChange={(e) => setSentence(e.target.value)} maxLength={180} />
        </label>
        <label className="field">
          <span>The season</span>
          <input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="Autumn" maxLength={24} />
        </label>
        <div className="field">
          <span>Up to four things you will actually do</span>
          {commitments.map((c, i) => (
            <input
              key={i}
              value={c}
              maxLength={48}
              onChange={(e) => setCommitments(commitments.map((x, j) => (j === i ? e.target.value : x)))}
            />
          ))}
        </div>
        <div className="household">
          <h3>A word each, if you want one</h3>
          {people.map((p) => (
            <label className="field" key={p.id}>
              <span>{p.name}</span>
              <input
                value={personal[p.id] || ''}
                maxLength={18}
                onChange={(e) => setPersonal({ ...personal, [p.id]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <div className="household">
          <h3>Who prays here</h3>
          {people.map((p) => (
            <div className="person-edit" key={p.id}>
              <span className="dot" style={{ '--hue': p.hue }} />
              <span className="grow">{p.name}</span>
              <button
                className="quiet"
                type="button"
                onClick={() => setPeople(people.map((x) => (x.id === p.id ? { ...x, kind: x.kind === 'adult' ? 'child' : 'adult' } : x)))}
              >
                {p.kind === 'adult' ? 'Grown-up' : 'Child'}
              </button>
              <button className="quiet" type="button" onClick={() => setPeople(people.filter((x) => x.id !== p.id))}>Remove</button>
            </div>
          ))}
          <div className="row">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Name" maxLength={24} />
            <button className="quiet" type="button" onClick={() => setKind(kind === 'adult' ? 'child' : 'adult')}>
              {kind === 'adult' ? 'Grown-up' : 'Child'}
            </button>
            <button className="quiet" type="button" onClick={addPerson}>Add</button>
          </div>
        </div>
        <div className="actions">
          <button className="primary" type="button" onClick={save}>Save</button>
          {install && (
            <button className="quiet" type="button" onClick={() => install.prompt()}>Add to the home screen</button>
          )}
          {!install && !standalone() && (
            <p className="hint">In Chrome, open the menu and choose Add to Home screen.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function Welcome({ onBegin }) {
  const [step, setStep] = useState(0);
  const [people, setPeople] = useState([]);
  const [draft, setDraft] = useState('');
  const [kind, setKind] = useState('adult');
  const [word, setWord] = useState('Near');
  const [own, setOwn] = useState('');

  function addPerson() {
    const name = draft.trim().slice(0, 24);
    if (!name) return;
    const id = slugId(name, people.map((p) => p.id));
    setPeople([...people, { id, name, kind, hue: hueFor(people.length) }]);
    setDraft('');
    setKind('child');
  }

  if (step === 0) {
    return (
      <div className="screen">
        <div className="sheet">
          <p className="kicker">Table</p>
          <h1 className="names">Who prays here?</h1>
          <p className="hint">Add each person. Mark grown-ups, so the morning stays quiet.</p>
          <div className="people">
            {people.map((p) => (
              <button key={p.id} type="button" className="chip on" onClick={() => setPeople(people.filter((x) => x.id !== p.id))}>
                <span className="dot" style={{ '--hue': p.hue }} />
                {p.name}
              </button>
            ))}
          </div>
          <div className="row" style={{ marginTop: '1rem' }}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Name" maxLength={24} aria-label="Name" />
          </div>
          <div className="footer">
            <button className="quiet" type="button" onClick={() => setKind(kind === 'adult' ? 'child' : 'adult')}>
              {kind === 'adult' ? 'Grown-up' : 'Child'}
            </button>
            <button className="quiet" type="button" onClick={addPerson}>Add</button>
          </div>
          <div className="actions">
            <button className="primary" type="button" disabled={!people.length} onClick={() => setStep(1)}>Next</button>
          </div>
        </div>
      </div>
    );
  }

  const chosen = (own.trim() || word).slice(0, 18);
  return (
    <div className="screen">
      <div className="sheet">
        <h1 className="names">One word for this season.</h1>
        <p className="hint">You can change it later.</p>
        <div className="chips">
          {SUGGESTED.map((item) => (
            <button key={item} type="button" className={word === item && !own.trim() ? 'chip on' : 'chip'} onClick={() => { setWord(item); setOwn(''); }}>
              {item}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Or your own</span>
          <input value={own} onChange={(e) => setOwn(e.target.value)} maxLength={18} />
        </label>
        <div className="actions">
          <button
            className="primary"
            type="button"
            onClick={() => onBegin({
              people,
              board: {
                word: chosen || 'Near',
                sentence: '',
                season: '',
                commitments: [],
                personal: {},
              },
            })}
          >
            Begin
          </button>
        </div>
      </div>
    </div>
  );
}

function standalone() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}

function useInstall() {
  const [event, setEvent] = useState(null);
  useEffect(() => {
    const on = (e) => {
      e.preventDefault();
      setEvent(e);
    };
    window.addEventListener('beforeinstallprompt', on);
    return () => window.removeEventListener('beforeinstallprompt', on);
  }, []);
  return event;
}
