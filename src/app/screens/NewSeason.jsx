import { useEffect, useState } from 'react';
import { go, home } from '../route.js';
import { setState, setDevice, isDemo } from '../store.js';
import { now, today, addDays, weekOf } from '../calendar.js';
import { uid, callName, isChild, KOI } from '../household.js';
import { THEMES, THEME_ORDER, WORDS_FOR, YES_IDEAS, KID_YES, themeOf, lowerFirst } from '../board.js';
import { playMoment } from '../moment.js';
import { CloseButton, Dots, KoiGlyph, ThemePicture, WorldGlyph, tick } from '../ui.jsx';
import { WORLDS } from './WorldSheet.jsx';
import { tintFor } from '../vine/tint.js';

// ═══════════════════════════════════════════════════════════════════
// Setting our way for a new season: pass the tablet (studio P).
//
//   1. Look back. Where did we see God this term? The last season's
//      word and yeses are shown; nothing is marked kept or broken.
//   2. Pass it round. Each person in turn: their own creature first
//      ("this is you"), then what they want to grow in, as a picture;
//      then a word that fits it (tap one, or type your own); then one
//      yes. A grown-up may add a no, kept on their own board only.
//   3. Together. Our word, chosen from everyone's; then up to three
//      yeses, and the no each one protects.
//   4. Where our board lives: the pond or the vine.
//   5. The finale. The paper lifts. The youngest touches the world to
//      let our word in; each of us arrives, named; each no is let go.
//
// Changing a board mid-season (?edit=1, or ?edit=1&p=<person> from
// their own board) walks only the steps it needs.
// ═══════════════════════════════════════════════════════════════════

const FAMILY_WORDS = ['Rooted', 'Welcome', 'Abide', 'Together', 'Grateful', 'Generous', 'Rest', 'Brave'];
const GROWN_YES = ['Home by six', 'A walk on my own', 'Reading before bed', 'Calling a friend each week', 'Sabbath rest', 'Saying no kindly'];
const GROWN_NO = ['Saying yes to everything', 'Work after supper', 'Scrolling in bed', 'Hurry'];

function suggestName(d = now()) {
  const m = d.getMonth();
  const y = d.getFullYear();
  if (m >= 8 && m <= 11) return `Autumn term ${y}`;
  if (m <= 2) return `Spring term ${y}`;
  if (m <= 6) return `Summer term ${y}`;
  return `Summer ${y}`;
}

export default function NewSeason({ day }) {
  const hashQ = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const editing = hashQ.get('edit') === '1' && day.season ? day.season : null;
  const only = editing && hashQ.get('p');
  const last = day.season;
  const people = day.people;
  const board = day.board;

  const [name, setName] = useState(editing?.name || suggestName());
  const [look, setLook] = useState('');
  // In the example family, ?at=together|world|finale opens the ritual
  // part-way through, filled in from the board as it is (for a judge, or
  // a screenshot), so the finale can be seen in a minute.
  const jump = isDemo && !editing ? hashQ.get('at') : null;
  const [mine, setMine] = useState(() => {
    if ((!editing && !jump) || !board) return {};
    return Object.fromEntries(board.people.map((p) => [p.id, { word: p.word, theme: (editing || last)?.people?.[p.id]?.theme || (p.word ? p.theme : ''), yes: p.yes, no: p.no }]));
  });
  const from = editing || (jump ? last : null);
  const [famWord, setFamWord] = useState(from?.family?.word || '');
  const [famLine, setFamLine] = useState(from?.family?.line || '');
  const [famYes, setFamYes] = useState(() => (from && board ? board.yes.map((y) => ({ ...y })) : []));
  const [world, setWorld] = useState(editing?.world || last?.world || day.world || 'pond');
  const [i, setI] = useState(0);
  const [born, setBorn] = useState(false);
  const [ready, setReady] = useState(false);

  // The steps this time.
  const steps = [];
  if (only) {
    steps.push({ kind: 'pic', pid: only }, { kind: 'word', pid: only }, { kind: 'yes', pid: only });
  } else {
    steps.push({ kind: editing ? 'name' : 'look' });
    for (const p of people) steps.push({ kind: 'pic', pid: p.id }, { kind: 'word', pid: p.id }, { kind: 'yes', pid: p.id });
    steps.push({ kind: 'family-word' }, { kind: 'family-yes' }, { kind: 'world' });
    if (!editing) steps.push({ kind: 'finale' });
  }
  useEffect(() => {
    if (!jump) return;
    const k = steps.findIndex((x) => x.kind === (jump === 'together' ? 'family-word' : jump));
    if (k > 0) setI(k);
  }, []);
  const step = steps[Math.min(i, steps.length - 1)];
  const person = step.pid ? people.find((p) => p.id === step.pid) : null;
  const me = (person && mine[person.id]) || {};
  const setMe = (patch) => setMine((m) => ({ ...m, [person.id]: { ...m[person.id], ...patch } }));
  const isLast = i >= steps.length - 1;

  // Progress by stage, not by screen: looking back, each person, together, the world.
  const stages = only ? [only] : ['look', ...people.map((p) => p.id), 'together', 'world', ...(editing ? [] : ['finale'])];
  const stageAt = only ? 0 : stages.indexOf(step.pid || (step.kind.startsWith('family') ? 'together' : step.kind === 'name' ? 'look' : step.kind));

  const next = () => setI((n) => Math.min(steps.length - 1, n + 1));
  const back = () => setI((n) => Math.max(0, n - 1));

  // The finale lifts the paper: the world shows, and plays it.
  const finale = step.kind === 'finale';
  useEffect(() => {
    if (finale && !hashQ.get('finale')) go('season/new', { finale: '1' });
    if (!finale && hashQ.get('finale')) go('season/new');
    // The chosen world, waiting, empty, for the word.
    if (finale) playMoment('waiting', world);
  }, [finale]);
  useEffect(() => () => playMoment(null), []);

  const record = () => {
    const words = Object.fromEntries(Object.entries(mine).filter(([, v]) => v?.word).map(([k, v]) => [k, v.word]));
    const fam = { word: famWord.trim(), line: famLine.trim(), yes: famYes.filter((y) => y.text.trim()).map((y) => ({ text: y.text.trim(), no: (y.no || '').trim() })) };
    if (famWord.trim()) fam.theme = themeOf(famWord.trim());
    setState((s) => {
      if (editing) {
        return {
          ...s,
          seasons: s.seasons.map((x) => (x.id === editing.id
            ? { ...x, name, world, people: { ...x.people, ...mine }, words: { ...x.words, ...words }, ...(only ? {} : { family: fam }) }
            : x)),
        };
      }
      const t = today();
      const closed = s.seasons.map((x) => (x.end ? x : { ...x, end: addDays(t.date, -1), ...(look.trim() ? { lookBack: look.trim() } : {}) }));
      const start = weekOf(t.date);
      return {
        ...s,
        seasons: [...closed, { id: uid(), name, start, until: addDays(start, 7 * 12 - 3), end: null, world, family: fam, people: mine, words }],
      };
    });
    // This screen now shows the family's choice.
    setDevice((d) => ({ ...d, world: null }));
  };

  const finishEdit = () => {
    record();
    go(only ? 'me' : 'season', only ? { p: only } : undefined);
  };

  // The youngest lets our word in.
  const children = people.filter(isChild);
  const youngest = children[children.length - 1] || people[people.length - 1];
  const letIn = () => {
    tick(14);
    record();
    setBorn(true);
    setTimeout(() => playMoment('finale', world), 60);
    const n = people.length;
    const wait = world === 'vine' ? 13000 + n * 600 : 5000 + n * 2200 + famYes.filter((y) => y.no).length * 1600;
    setTimeout(() => setReady(true), Math.min(wait, 26000));
  };
  const begin = () => { playMoment(null); go('home'); };

  if (finale) {
    return (
      <div className={'finale in-' + world} role="dialog" aria-label="Our way is born">
        {born && world === 'pond' && (
          <section className="water-words finale-words">
            <p className="water-label">{name} · our word</p>
            <h1 className="water-word">{famWord}</h1>
          </section>
        )}
        <div className="finale-card">
          {!born ? (
            <>
              <p className="label">{name}</p>
              <h1 className="finale-title">{callName(youngest, true)}, {world === 'vine' ? 'touch here to plant our word.' : 'touch here to let our word into the pond.'}</h1>
              <button className="btn btn-primary btn-big finale-go" onClick={letIn}>{world === 'vine' ? 'Plant our word' : 'Let our word in'}</button>
            </>
          ) : (
            <>
              <p className="finale-line">{world === 'vine' ? 'Each of us a branch of the vine. Each no pruned, so it bears fruit.' : 'Each of us here. Each no let go, to rest on the bottom.'}</p>
              {ready ? <button className="btn btn-primary btn-big" onClick={begin}>Begin the season</button> : <p className="finale-wait" aria-live="polite">Watch…</p>}
            </>
          )}
        </div>
      </div>
    );
  }

  const canNext = !(step.kind === 'family-word' && !famWord.trim());
  const yesIdeas = [...new Set([...Object.values(mine).map((v) => v?.yes).filter(Boolean), ...YES_IDEAS.map((y) => y.text)])].slice(0, 10);

  return (
    <div className="room room-paper new-season" role="dialog" aria-modal="true" aria-label={editing ? 'Change our way' : 'A new season'}>
      <div className="room-top">
        <Dots count={stages.length} at={stageAt} />
        <CloseButton onClick={() => (only ? go('me', { p: only }) : home())} />
      </div>
      <div className="room-body scroll" key={i}>
        {step.kind === 'look' && (
          <>
            <p className="label">A new season</p>
            <h1 className="room-title">Before we choose: where did we see God this term?</h1>
            {last ? (
              <div className="look-back">
                <p className="label">The season ending · {last.name}</p>
                <p className="season-word small">{last.family?.word}</p>
                {board?.yes?.length > 0 && <p className="look-yes">{board.yes.map((y) => y.text).join(' · ')}</p>}
              </div>
            ) : null}
            <p className="room-sub">Say it out loud, together. Nothing here is marked kept or broken.</p>
            <input className="field" placeholder="Write a line to keep, if you like" value={look} onChange={(e) => setLook(e.target.value.slice(0, 120))} aria-label="Where we saw God" />
            <label className="small-field">
              <span>This season’s name</span>
              <input className="field small" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} />
            </label>
          </>
        )}

        {step.kind === 'name' && (
          <>
            <p className="label">Change our way</p>
            <h1 className="room-title">What shall we call this season?</h1>
            <input className="field big" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} aria-label="Season name" />
          </>
        )}

        {person && step.kind === 'pic' && (
          <>
            <div className="pass-to">
              <Creature person={person} world={world} />
              <p className="label">Pass it to {callName(person, true)}</p>
            </div>
            <h1 className="room-title">{isChild(person) ? `${person.name}, this is you. What do you want to grow in this term?` : `${person.name}, what is God growing in you this season?`}</h1>
            <div className="theme-tiles" role="radiogroup" aria-label="What it means">
              {THEME_ORDER.map((th) => (
                <button key={th} role="radio" aria-checked={me.theme === th} className={'theme-tile' + (me.theme === th ? ' is-on' : '')} onClick={() => { tick(); setMe({ theme: th }); }}>
                  <ThemePicture theme={th} size={44} />
                  <b>{THEMES[th].label}</b>
                  <small>{THEMES[th].hint}</small>
                </button>
              ))}
            </div>
          </>
        )}

        {person && step.kind === 'word' && (
          <>
            <div className="pass-to"><Creature person={person} world={world} small /><p className="label">{person.name}</p></div>
            <h1 className="room-title">Which word is yours?</h1>
            <p className="room-sub">
              {me.theme ? `Words for ${THEMES[me.theme].label.toLowerCase()}. ` : ''}
              {last?.words?.[person.id] && !editing ? `Last season it was ${last.words[person.id]}.` : ''}
            </p>
            <div className="chips">
              {(me.theme ? WORDS_FOR[me.theme] : THEME_ORDER.map((th) => WORDS_FOR[th][0])).map((w) => (
                <button key={w} className={'chip' + (me.word === w ? ' is-on' : '')} onClick={() => { tick(); setMe({ word: w }); }}>{w}</button>
              ))}
            </div>
            <input
              className="field"
              placeholder="Or your own word"
              value={me.word && !Object.values(WORDS_FOR).flat().includes(me.word) ? me.word : ''}
              onChange={(e) => setMe({ word: e.target.value.replace(/\s+/g, ' ').slice(0, 20) })}
              aria-label={`${person.name}'s own word`}
            />
          </>
        )}

        {person && step.kind === 'yes' && (
          <>
            <div className="pass-to"><Creature person={person} world={world} small /><p className="label">{person.name}{me.word ? ` · ${me.word}` : ''}</p></div>
            <h1 className="room-title">And one yes for this term?</h1>
            <p className="room-sub">Something {isChild(person) ? 'you’ll do' : 'you’ll make room for'}. Small and true beats big and forgotten.</p>
            <div className="chips">
              {(isChild(person) ? KID_YES : GROWN_YES).map((y) => (
                <button key={y} className={'chip' + (me.yes === y ? ' is-on' : '')} onClick={() => { tick(); setMe({ yes: me.yes === y ? '' : y }); }}>{y}</button>
              ))}
            </div>
            <input className="field" placeholder="Or your own" value={me.yes && ![...KID_YES, ...GROWN_YES].includes(me.yes) ? me.yes : ''} onChange={(e) => setMe({ yes: e.target.value.slice(0, 40) })} aria-label={`${person.name}'s own yes`} />
            {!isChild(person) && (
              <div className="no-box">
                <p className="set-label">And a no that protects it, if you like</p>
                <p className="room-sub">Kept on {person.name}’s own board only. It isn’t shown to the family.</p>
                <div className="chips">
                  {GROWN_NO.map((n) => (
                    <button key={n} className={'chip chip-quiet' + (me.no === n ? ' is-on' : '')} onClick={() => setMe({ no: me.no === n ? '' : n })}>{n}</button>
                  ))}
                </div>
                <input className="field" placeholder="Or your own" value={me.no && !GROWN_NO.includes(me.no) ? me.no : ''} onChange={(e) => setMe({ no: e.target.value.slice(0, 40) })} aria-label={`${person.name}'s no`} />
              </div>
            )}
          </>
        )}

        {step.kind === 'family-word' && (
          <>
            <p className="label">Together</p>
            <h1 className="room-title">Which word is ours, together?</h1>
            <p className="room-sub">Often it’s one of yours. It will be at the heart of our board all season.</p>
            <div className="chips">
              {[...new Set([...Object.values(mine).map((v) => v?.word).filter(Boolean), ...FAMILY_WORDS])].slice(0, 12).map((w) => (
                <button key={w} className={'chip' + (famWord === w ? ' is-on' : '')} onClick={() => { tick(); setFamWord(w); }}>
                  <ThemePicture theme={themeOf(w, Object.values(mine).find((v) => v?.word === w)?.theme)} size={20} /> {w}
                </button>
              ))}
            </div>
            <input className="field" placeholder="Or our own word" value={famWord && ![...Object.values(mine).map((v) => v?.word), ...FAMILY_WORDS].includes(famWord) ? famWord : ''} onChange={(e) => setFamWord(e.target.value.slice(0, 20))} aria-label="Our own word" />
            <input className="field" placeholder="In a sentence, if you like" value={famLine} onChange={(e) => setFamLine(e.target.value.slice(0, 90))} aria-label="Our word in a sentence" />
          </>
        )}

        {step.kind === 'family-yes' && (
          <>
            <p className="label">Together · {famWord}</p>
            <h1 className="room-title">What will we say yes to?</h1>
            <p className="room-sub">Up to three, from everyone’s. A no is only there to protect a yes.</p>
            <div className="chips">
              {yesIdeas.map((y) => {
                const on = famYes.some((x) => x.text === y);
                return (
                  <button key={y} className={'chip' + (on ? ' is-on' : '')} onClick={() => {
                    tick();
                    setFamYes((list) => (on ? list.filter((x) => x.text !== y) : list.length < 3 ? [...list, { text: y, no: YES_IDEAS.find((z) => z.text === y)?.no || '' }] : list));
                  }}>{y}</button>
                );
              })}
            </div>
            {famYes.length > 0 && (
              <ul className="yes-rows">
                {famYes.map((y, k) => (
                  <li key={y.text}>
                    <b>Yes to {lowerFirst(y.text)}</b>
                    <label>
                      <span>so no to</span>
                      <input className="field small" placeholder="nothing, this time" value={y.no} onChange={(e) => setFamYes((list) => list.map((x, j) => (j === k ? { ...x, no: e.target.value.slice(0, 40) } : x)))} />
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {step.kind === 'world' && (
          <>
            <p className="label">Together</p>
            <h1 className="room-title">Where shall our board live?</h1>
            <p className="room-sub">The same board either way. Any screen can show the other one later.</p>
            <div className="world-tiles" role="radiogroup" aria-label="World">
              {WORLDS.map((w) => (
                <button key={w.id} role="radio" aria-checked={world === w.id} className={'world-tile' + (world === w.id ? ' is-on' : '')} onClick={() => { tick(); setWorld(w.id); }}>
                  <span className="world-tile-mark"><WorldGlyph world={w.id} size={30} /></span>
                  <span className="world-tile-name">{w.name}</span>
                  <span className="world-tile-line">{w.line}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="room-foot">
        {i > 0 ? <button className="btn btn-quiet" onClick={back}>Back</button> : <span />}
        {isLast && editing ? (
          <button className="btn btn-primary btn-big" disabled={!only && !famWord.trim()} onClick={finishEdit}>Save</button>
        ) : (
          <button className="btn btn-primary btn-big" onClick={next} disabled={!canNext}>
            {person && step.kind === 'pic' && !me.theme ? 'Skip' : person && step.kind === 'yes' && !me.yes && !me.word ? 'Skip' : step.kind === 'world' ? 'On to the finale' : 'Next'}
          </button>
        )}
      </div>
    </div>
  );
}

// A person's creature in the world they'll be in: their koi, or their
// blossom on the vine, in their own colours.
function Creature({ person, world, small = false }) {
  if (world === 'vine') {
    const [a, b, c] = tintFor(KOI[person.koi] || KOI.kohaku);
    const s = small ? 34 : 58;
    return (
      <svg width={s} height={s} viewBox="0 0 40 40" aria-hidden="true" className="creature">
        {[0, 72, 144, 216, 288].map((r) => (
          <ellipse key={r} cx="20" cy="11" rx="6.5" ry="9" fill={`url(#pt-${person.id})`} transform={`rotate(${r} 20 20)`} />
        ))}
        <defs>
          <linearGradient id={`pt-${person.id}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={a} /><stop offset="0.55" stopColor={b} /><stop offset="1" stopColor={c} />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="3.6" fill="#e8b64a" />
      </svg>
    );
  }
  return <KoiGlyph koi={person.koi} size={small ? 34 : 58} />;
}
