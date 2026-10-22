import { useState } from 'react';
import { go, home } from '../route.js';
import { setState, getState } from '../store.js';
import { now, today, addDays, weekOf } from '../calendar.js';
import { uid, callName, isChild } from '../household.js';
import { CloseButton, Dots, KoiGlyph } from '../ui.jsx';

// ═══════════════════════════════════════════════════════════════════
// A new season — who are we becoming this term?
//
// Pass the tablet round: each person chooses their own word (a child can
// tap one; nobody has to type). Then the family chooses its word
// together, often from the words just chosen, and a few "we will…"
// practices: a rule of life, not goals. The old season goes into the
// book of seasons; the pond starts clear.
// ═══════════════════════════════════════════════════════════════════

const KID_WORDS = ['Brave', 'Kind', 'Gentle', 'Joyful', 'Patient', 'Honest', 'Generous', 'Helpful', 'Thankful', 'Peaceful', 'Curious', 'Bold'];
const GROWN_WORDS = ['Steady', 'Present', 'Faithful', 'Rest', 'Patient', 'Generous', 'Brave', 'Gentle', 'Joyful', 'Humble'];
const FAMILY_WORDS = ['Rooted', 'Welcome', 'Abide', 'Together', 'Grateful', 'Generous', 'Rest', 'Brave'];
const PRACTICES = ['Eat together, phones away', 'Pray for each other every day', 'Keep Sunday for rest', 'Have someone round each week', 'Say sorry quickly', 'Go outside together'];

function suggestName(d = now()) {
  const m = d.getMonth();
  const y = d.getFullYear();
  if (m >= 8 && m <= 11) return `Autumn term ${y}`;
  if (m <= 2) return `Spring term ${y}`;
  if (m <= 6) return `Summer term ${y}`;
  return `Summer ${y}`;
}

export default function NewSeason({ day }) {
  const editing = new URLSearchParams(window.location.hash.split('?')[1] || '').get('edit') === '1' && day.season;
  const cur = editing ? day.season : null;
  const lastWords = day.season?.words || {};
  const people = day.people;

  const [name, setName] = useState(cur?.name || suggestName());
  const [words, setWords] = useState(cur ? { ...cur.words } : {});
  const [family, setFamily] = useState(cur?.family?.word || '');
  const [line, setLine] = useState(cur?.family?.line || '');
  const [practices, setPractices] = useState(cur?.family?.practices || []);
  const [i, setI] = useState(0);

  // Steps: name, one per person, the family's word, practices, review.
  const steps = ['name', ...people.map((p) => p.id), 'family', 'practices', 'review'];
  const step = steps[i];
  const next = () => setI((n) => Math.min(steps.length - 1, n + 1));
  const back = () => setI((n) => Math.max(0, n - 1));
  const person = people.find((p) => p.id === step);

  const finish = () => {
    const t = today();
    setState((s) => {
      if (cur) {
        return { ...s, seasons: s.seasons.map((x) => (x.id === cur.id ? { ...x, name, words, family: { word: family, line, practices } } : x)) };
      }
      const closed = s.seasons.map((x) => (x.end ? x : { ...x, end: addDays(t.date, -1) }));
      const start = weekOf(t.date);
      return {
        ...s,
        seasons: [...closed, { id: uid(), name, start, until: addDays(start, 7 * 12 - 3), end: null, family: { word: family.trim(), line: line.trim(), practices }, words }],
      };
    });
    go('season');
  };

  const familyChoices = [...new Set([...Object.values(words).filter(Boolean), ...FAMILY_WORDS])].slice(0, 12);

  return (
    <div className="room room-paper new-season" role="dialog" aria-modal="true" aria-label="A new season">
      <div className="room-top">
        <Dots count={steps.length} at={i} />
        <CloseButton onClick={home} />
      </div>
      <div className="room-body scroll" key={i}>
        {step === 'name' && (
          <>
            <p className="label">{cur ? 'Change our words' : 'A new season'}</p>
            <h1 className="room-title">What shall we call this season?</h1>
            <input className="field big" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} aria-label="Season name" />
            <p className="room-sub">A term, a school year, or the months until summer. You’ll be asked to look back near the end.</p>
          </>
        )}

        {person && (
          <>
            <div className="pass-to">
              <KoiGlyph koi={person.koi} size={52} />
              <p className="label">Pass it to {callName(person, true)}</p>
            </div>
            <h1 className="room-title">{isChild(person) ? `${person.name}, who do you want to be this term?` : `${person.name}, who are you becoming this season?`}</h1>
            <p className="room-sub">Choose one word.{lastWords[person.id] && !cur ? ` Until now it was ${lastWords[person.id]}.` : ''}</p>
            <div className="chips">
              {(isChild(person) ? KID_WORDS : GROWN_WORDS).map((w) => (
                <button key={w} className={'chip' + (words[person.id] === w ? ' is-on' : '')} onClick={() => setWords((x) => ({ ...x, [person.id]: w }))}>{w}</button>
              ))}
            </div>
            <input
              className="field"
              placeholder="Or your own word"
              value={words[person.id] && ![...KID_WORDS, ...GROWN_WORDS].includes(words[person.id]) ? words[person.id] : ''}
              onChange={(e) => setWords((x) => ({ ...x, [person.id]: e.target.value.replace(/\s+/g, ' ').slice(0, 20) }))}
              aria-label={`${person.name}'s own word`}
            />
          </>
        )}

        {step === 'family' && (
          <>
            <p className="label">Together</p>
            <h1 className="room-title">Which word is ours, together?</h1>
            <p className="room-sub">It will lie in the pond all season.</p>
            <div className="chips">
              {familyChoices.map((w) => (
                <button key={w} className={'chip' + (family === w ? ' is-on' : '')} onClick={() => setFamily(w)}>{w}</button>
              ))}
            </div>
            <input className="field" placeholder="Or your own word" value={familyChoices.includes(family) ? '' : family} onChange={(e) => setFamily(e.target.value.slice(0, 20))} aria-label="Our own word" />
            <input className="field" placeholder="In a sentence, if you like" value={line} onChange={(e) => setLine(e.target.value.slice(0, 90))} aria-label="Our word in a sentence" />
          </>
        )}

        {step === 'practices' && (
          <>
            <p className="label">A rule of life</p>
            <h1 className="room-title">This season, we will…</h1>
            <p className="room-sub">Choose up to three. Small and true beats big and forgotten.</p>
            <div className="chips">
              {[...new Set([...PRACTICES, ...practices])].map((p) => {
                const on = practices.includes(p);
                return (
                  <button key={p} className={'chip' + (on ? ' is-on' : '')} onClick={() => setPractices((x) => (on ? x.filter((y) => y !== p) : x.length < 3 ? [...x, p] : x))}>{p}</button>
                );
              })}
            </div>
          </>
        )}

        {step === 'review' && (
          <>
            <p className="label">{name}</p>
            <h1 className="season-word">{family || '…'}</h1>
            {line && <p className="season-line">{line}</p>}
            {practices.length > 0 && <ul className="practices-list">{practices.map((p) => <li key={p}>{p}</li>)}</ul>}
            <div className="each">
              {people.map((p) => (
                <div key={p.id} className="each-one">
                  <KoiGlyph koi={p.koi} size={30} />
                  <span className="each-name">{p.name}</span>
                  <span className="each-word">{words[p.id] || '—'}</span>
                </div>
              ))}
            </div>
            {!cur && getState().seasons.some((s) => !s.end) && (
              <p className="room-sub">The last season goes into the book of seasons, and the pond starts clear.</p>
            )}
          </>
        )}
      </div>
      <div className="room-foot">
        {i > 0 ? <button className="btn btn-quiet" onClick={back}>Back</button> : <span />}
        {step === 'review' ? (
          <button className="btn btn-primary btn-big" disabled={!family.trim()} onClick={finish}>{cur ? 'Save' : 'Begin the season'}</button>
        ) : (
          <button className="btn btn-primary btn-big" onClick={next} disabled={step === 'family' && !family.trim()}>
            {person && !words[person.id] ? 'Skip' : 'Next'}
          </button>
        )}
      </div>
    </div>
  );
}
