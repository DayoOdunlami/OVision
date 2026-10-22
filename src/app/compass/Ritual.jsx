import { useState } from 'react';
import { go } from '../route.js';
import { getState, setState } from '../store.js';
import { now, today } from '../calendar.js';
import { uid, callName } from '../household.js';
import { CloseButton, KoiGlyph } from '../ui.jsx';
import { THEMES, deriveBoard, normaliseBoard, themeFor, saveCompassSeason } from './model.js';
import './ritual.css';

const WORDS = ['Rooted', 'Brave', 'Kind', 'Present', 'Steady', 'Welcome'];
const EXAMPLES = {
  belong: { yes: ['Time together, phones away', 'Listen before answering'], no: ['Hurrying past each other', 'Having the last word'] },
  rest: { yes: ['One thing at a time', 'A quiet Sunday'], no: ['Filling every hour', 'Saying yes to everything'] },
  grow: { yes: ['Try the first small step', 'Ask a question'], no: ['Waiting to feel ready', 'Pretending to know'] },
  give: { yes: ['Make room in the game', 'Share what we have'], no: ['Keeping the best for me', 'Having the last word'] },
  steady: { yes: ['Listen before answering', 'Use gentle hands'], no: ['Rushing an answer', 'One more work message'] },
  welcome: { yes: ['An open door', 'Invite someone to join'], no: ['Leaving someone out', 'Always being too busy'] },
};

function suggestName() {
  const date = now();
  const month = date.getMonth();
  return `${month >= 8 ? 'Autumn' : month < 3 ? 'Spring' : 'Summer'} term ${date.getFullYear()}`;
}

function boardsFor(season, people) {
  return {
    family: deriveBoard(season),
    people: Object.fromEntries(people.map((person) => [person.id, deriveBoard(season, person.id)])),
  };
}

export default function Ritual({ day, query = {} }) {
  const params = Object.keys(query).length ? query : Object.fromEntries(new URLSearchParams(window.location.hash.split('?')[1] || ''));
  const people = day.people || [];
  const person = people.find((p) => p.id === params.person);
  const editing = Boolean(day.season && (person || params.edit === '1'));
  const current = editing ? day.season : null;
  const [name, setName] = useState(current?.name || suggestName());
  const [compass, setCompass] = useState(() => current ? boardsFor(current, people) : { family: normaliseBoard(), people: {} });
  const [path, setPath] = useState(person ? 'person' : null);
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [familySeeded, setFamilySeeded] = useState(false);

  const steps = person
    ? [person.id, 'review']
    : ['name', ...(path === 'together' ? people.map((p) => p.id).concat('gather') : []), 'family', 'review'];
  const step = path ? steps[index] : 'choose';
  const activePerson = people.find((p) => p.id === step);
  const board = activePerson ? compass.people[activePerson.id] || normaliseBoard() : compass.family;
  const contributions = people.filter((p) => compass.people[p.id]?.word);
  const word = board.word.trim();
  const returnToBoard = () => go('board', person ? { person: person.id } : undefined);
  const next = () => { setError(''); setIndex((n) => Math.min(steps.length - 1, n + 1)); };
  const back = () => { setError(''); if (index === 0 && !person) setPath(null); else setIndex((n) => Math.max(0, n - 1)); };
  const update = (nextBoard) => setCompass((c) => activePerson
    ? { ...c, people: { ...c.people, [activePerson.id]: nextBoard } }
    : { ...c, family: nextBoard });
  const skipPerson = () => {
    setCompass((c) => {
      const nextPeople = { ...c.people };
      if (editing) nextPeople[activePerson.id] = deriveBoard(current, activePerson.id);
      else delete nextPeople[activePerson.id];
      return { ...c, people: nextPeople };
    });
    next();
  };

  const finish = () => {
    if (saved) return;
    if (!person && !compass.family.word.trim()) { setError('Choose a word for your family first.'); return; }
    const date = today().date;
    const output = person
      ? { people: { [person.id]: normaliseBoard(compass.people[person.id]) } }
      : { family: normaliseBoard(compass.family), people: Object.fromEntries(Object.entries(compass.people).filter(([, b]) => b.word.trim()).map(([id, b]) => [id, normaliseBoard(b)])) };
    setSaved(true);
    setState((state) => saveCompassSeason(state, {
      seasonId: current?.id,
      name,
      compass: output,
      date,
      id: uid(),
    }));
    returnToBoard();
  };

  return (
    <section className="room room-paper compass-ritual" role="dialog" aria-modal="true" aria-label={person ? `Choose ${person.name}'s direction` : editing ? 'Review our direction' : 'A new season together'}>
      <header className="room-top ritual-top">
        <p className="label">{person ? `${person.name}’s direction` : editing ? 'Review our direction' : 'A new season together'}</p>
        <CloseButton onClick={returnToBoard} label="Back to the board" />
      </header>
      <div className="ritual-body" key={step}>
        {step === 'choose' && <>
          <p className="ritual-kicker">Changed termly. Carried daily.</p>
          <h1 className="room-title">What are we making room for?</h1>
          <p className="room-sub">A word to grow towards. A small yes. Something to leave behind.</p>
          <div className="ritual-ways">
            <button className="ritual-way" onClick={() => { setPath('family'); setIndex(0); }}>
              <span className="ritual-way-mark" aria-hidden="true">◎</span>
              <strong>Choose our family’s direction</strong>
              <span>Make the board together, straight away.</span>
              <span className="ritual-way-go">Begin together <span aria-hidden="true">→</span></span>
            </button>
            {people.length > 0 && <button className="ritual-way" onClick={() => { setPath('together'); setIndex(0); }}>
              <span className="ritual-way-mark" aria-hidden="true">❧</span>
              <strong>Pass the tablet round</strong>
              <span>One direction each. Then find what belongs to all of us.</span>
              <span className="ritual-way-go">Begin with each person <span aria-hidden="true">→</span></span>
            </button>}
          </div>
          <p className="ritual-footnote">No daily ticks. Nothing to keep up with. Just words to help us choose.</p>
        </>}

        {step === 'name' && <>
          <p className="ritual-kicker">A little room to begin</p>
          <h1 className="room-title">What shall we call this season?</h1>
          <label className="ritual-field-label" htmlFor="ritual-season-name">A term, or the months ahead</label>
          <input id="ritual-season-name" className="field big" value={name} maxLength={60} onChange={(event) => setName(event.target.value)} />
          <p className="room-sub">You can change these words when life changes. This is a direction, not a promise to get everything right.</p>
        </>}

        {(activePerson || step === 'family') && <>
          {activePerson ? <div className="ritual-pass">
            <KoiGlyph koi={activePerson.koi} size={42} />
            <p className="ritual-kicker">Pass it to {callName(activePerson, true)}</p>
          </div> : <p className="ritual-kicker">Now, all of us</p>}
          <h1 className="room-title">{activePerson ? `${activePerson.name}, what are you growing towards?` : 'What are we growing towards together?'}</h1>
          <p className="room-sub">{activePerson ? 'Choose a word. Then give it a small, everyday shape.' : contributions.length ? 'Choose your own word, or begin with something one of you has brought.' : 'The family board can begin here. Personal words can join it later.'}</p>
          {step === 'family' && contributions.length > 0 && <div className="ritual-sources" aria-label="Words each person brought">
            {contributions.map((p) => <button key={p.id} className="ritual-source" onClick={() => { update(normaliseBoard(compass.people[p.id])); setFamilySeeded(true); }}>
              <span>{p.name}</span><strong>{compass.people[p.id].word}</strong>
            </button>)}
          </div>}
          {step === 'family' && familySeeded && <p className="ritual-footnote" role="status">A starting point. Make it fit all of us.</p>}
          <BoardEditor board={board} onChange={update} person={activePerson} />
        </>}

        {step === 'gather' && <>
          <p className="ritual-kicker">Many words. One household.</p>
          <h1 className="room-title">See what each of us brings.</h1>
          <p className="room-sub">These words belong beside each other. They do not need to match.</p>
          <div className="ritual-contributions">
            {contributions.map((p) => <article className="ritual-contribution" key={p.id}>
              <KoiGlyph koi={p.koi} size={34} />
              <div><span>{p.name}</span><h2>{compass.people[p.id].word}</h2><p>{compass.people[p.id].yes || 'A word to carry into the day.'}</p></div>
            </article>)}
            {contributions.length === 0 && <p className="room-sub">No personal words yet. You can still choose a direction together.</p>}
          </div>
          <p className="ritual-footnote">Which of these feels like us? What would it help us say yes to, and what could we leave behind?</p>
        </>}

        {step === 'review' && <>
          <p className="ritual-kicker">{name}</p>
          <h1 className="room-title">{person ? 'A direction to carry.' : 'A direction for our days.'}</h1>
          <div className="ritual-preview" data-theme={person ? compass.people[person.id]?.theme : compass.family.theme}>
            <div className="ritual-preview-root" aria-hidden="true"><svg width="64" height="48" viewBox="0 0 64 48"><path d="M32 3 C30 15 35 22 32 28 M32 26 C25 27 21 34 10 39 M32 28 C41 27 45 34 56 38 M31 30 C28 35 28 41 25 46 M34 30 C38 35 39 41 42 45" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></div>
            <p className="label">{person ? `${person.name} is growing towards` : 'We are growing towards'}</p>
            <h2>{person ? compass.people[person.id]?.word : compass.family.word}</h2>
            <div className="ritual-preview-choices">
              <div><span>Make room for</span><p>{(person ? compass.people[person.id]?.yes : compass.family.yes) || 'A small yes, when it comes to mind.'}</p></div>
              <div><span>Leave behind</span><p>{(person ? compass.people[person.id]?.no : compass.family.no) || 'Whatever gets in the way.'}</p></div>
            </div>
          </div>
          {!person && contributions.length > 0 && <div className="ritual-review-people">{contributions.map((p) => <span key={p.id}><b>{p.name}</b> · {compass.people[p.id].word}</span>)}</div>}
          {!editing && getState().seasons.some((season) => !season.end) && <p className="room-sub">The previous season stays in your book. Its words will not be lost.</p>}
          <p className="ritual-footnote">Let this help you choose. There is nothing to complete each day.</p>
        </>}
        {error && <p className="ritual-error" role="alert">{error}</p>}
      </div>
      {step !== 'choose' && <footer className="room-foot ritual-foot">
        <button className="btn btn-quiet" onClick={back} disabled={Boolean(person && index === 0)}>Back</button>
        {step === 'review' ? <button className="btn btn-primary btn-big" onClick={finish} disabled={saved || Boolean(person && !compass.people[person.id]?.word.trim())}>{person ? 'Save my direction' : editing ? 'Save our direction' : 'Begin the season'}</button>
          : activePerson && !word && !person ? <button className="btn btn-primary btn-big" onClick={skipPerson}>Not now</button>
            : <button className="btn btn-primary btn-big" onClick={next} disabled={(step === 'family' || Boolean(person && activePerson)) && !word}>{step === 'gather' ? 'Choose our family word' : 'Continue'}</button>}
      </footer>}
    </section>
  );
}

function BoardEditor({ board, onChange, person }) {
  const [manualTheme, setManualTheme] = useState(false);
  const suggestions = EXAMPLES[board.theme] || EXAMPLES.grow;
  const updateWord = (word) => onChange({ ...board, word, theme: manualTheme ? board.theme : themeFor(word) });
  return <div className="ritual-editor">
    <label className="ritual-field-label" htmlFor="ritual-word">{person ? 'My word' : 'Our word'}</label>
    <input className="field big" id="ritual-word" value={board.word} onChange={(event) => updateWord(event.target.value.slice(0, 32))} maxLength={32} placeholder="A word that matters to you" />
    <div className="ritual-word-choices" aria-label="Word suggestions">{WORDS.map((word) => <button className={'ritual-chip' + (board.word === word ? ' is-on' : '')} key={word} onClick={() => updateWord(word)} aria-pressed={board.word === word}>{word}</button>)}</div>
    <div className="ritual-decisions">
      <div>
        <label className="ritual-field-label" htmlFor="ritual-yes">Make room for</label>
        <input className="field" id="ritual-yes" value={board.yes} maxLength={100} onChange={(event) => onChange({ ...board, yes: event.target.value })} placeholder="A small, everyday yes" />
        <div className="ritual-examples" aria-label="Ways to make room">{suggestions.yes.map((text) => <button key={text} className="ritual-example" onClick={() => onChange({ ...board, yes: text })}>{text}</button>)}</div>
      </div>
      <div>
        <label className="ritual-field-label" htmlFor="ritual-no">Leave behind</label>
        <input className="field" id="ritual-no" value={board.no} maxLength={100} onChange={(event) => onChange({ ...board, no: event.target.value })} placeholder="Something that gets in the way" />
        <div className="ritual-examples" aria-label="Things to leave behind">{suggestions.no.map((text) => <button key={text} className="ritual-example" onClick={() => onChange({ ...board, no: text })}>{text}</button>)}</div>
      </div>
    </div>
    <details className="ritual-meaning">
      <summary>How this word lives <span>{THEMES.find((theme) => theme.id === board.theme)?.label}</span></summary>
      <p className="room-sub">A word can mean different things to each of us. Choose what yours means. Both worlds will carry that meaning.</p>
      <div className="ritual-themes">{THEMES.map((theme) => <button key={theme.id} className={'ritual-theme' + (theme.id === board.theme ? ' is-on' : '')} aria-pressed={theme.id === board.theme} onClick={() => { setManualTheme(true); onChange({ ...board, theme: theme.id }); }}><b>{theme.label}</b><span>{theme.hint}</span></button>)}</div>
    </details>
  </div>;
}
