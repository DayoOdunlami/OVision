import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import PondView from '../pond/PondView.jsx';
import { useDevice, setDevice, isDemo } from '../store.js';
import { go } from '../route.js';
import { Gear } from '../ui.jsx';
import { deriveBoard } from './model.js';
import './compass.css';

const Grove = lazy(() => import('./Grove.jsx'));
const COLOURS = ['#98663c', '#ab6359', '#9b8a36', '#4d795d', '#557e8c', '#77657e'];
const STORIES = {
  belong: ['Drawn together', 'Each has a place. We gather without becoming the same.'],
  rest: ['Room to rest', 'Life settles into shelter. We do not need to fill every space.'],
  grow: ['Towards the light', 'Small growth turns towards what matters. There is no hurry.'],
  give: ['Goodness shared', 'What grows here is offered outwards, beyond ourselves.'],
  steady: ['Rooted, not rigid', 'Life yields and returns. Being steady is not standing frozen.'],
  welcome: ['An open place', 'The gathering leaves a space. There is room for someone else.'],
};

export function WorldSwitch({ world, onOpen }) {
  return <button className="world-toggle" onClick={onOpen} aria-haspopup="dialog" aria-label={`Choose a world. Current world: ${world === 'grove' ? 'Grove' : 'Pond'}`}><WorldMark world={world} /><span>{world === 'grove' ? 'Grove' : 'Pond'}</span><span aria-hidden="true">⇄</span></button>;
}

function WorldMark({ world }) {
  return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">{world === 'grove' ? <><path d="M12 21V8m0 6L6 9m6 8 6-8" stroke="currentColor" strokeWidth="1.3"/><path d="M12 4c-7-5-13 9-5 10 1 6 10 6 11 0 8-3 2-14-6-10Z" stroke="currentColor" strokeWidth="1.3"/></> : <><path d="M3 16c4-3 6 3 10 0s5 1 8 0M3 20c4-3 6 3 10 0s5 1 8 0" stroke="currentColor" strokeWidth="1.3"/><path d="M16 5C10 1 5 9 7 12c5 1 12-3 9-7Zm-3 5 6 3-1-6" stroke="currentColor" strokeWidth="1.3"/></>}</svg>;
}

export function Sheet({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const before = document.activeElement;
    ref.current?.querySelector('button,input')?.focus();
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'Tab') {
        const els = [...ref.current.querySelectorAll('button,input,a,select,textarea')].filter(el => !el.disabled);
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); before?.focus?.(); };
  }, [onClose]);
  return <div className="compass-shade" onClick={e => e.target === e.currentTarget && onClose()}><section className="compass-sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref}><header><h2>{title}</h2><button className="compass-close" onClick={onClose} aria-label="Close">×</button></header>{children}</section></div>;
}

export default function Board({ day, query = {}, homeMode = false, idleNow = false }) {
  const device = useDevice();
  const world = device.world === 'grove' ? 'grove' : 'pond';
  const person = day.people.find(p => p.id === query.person);
  const personId = person?.id;
  const board = deriveBoard(day.season, personId);
  const family = deriveBoard(day.season);
  const boards = useMemo(() => Object.fromEntries(day.people.map(p => [p.id, deriveBoard(day.season, p.id)])), [day.people, day.season]);
  const [sheet, setSheet] = useState('');
  const [focus, setFocus] = useState('');
  const [event, setEvent] = useState(0);
  const [idle, setIdle] = useState(idleNow);
  const wakeTimer = useRef(null);
  const closeSheet = useMemo(() => () => setSheet(''), []);
  const hasWord = Boolean(board.word);
  const story = STORIES[board.theme] || STORIES.grow;
  const names = day.isSunday ? 'all of us' : day.forPeople.map(p => p.name).join(' & ');
  const prayed = day.lastWho.length > 0 && day.lastWho.every(id => day.prayed.includes(id));
  const weeks = day.pads.length;

  useEffect(() => {
    const wake = () => {
      setIdle(false);
      clearTimeout(wakeTimer.current);
      wakeTimer.current = setTimeout(() => setIdle(true), 60000);
    };
    if (!idleNow) wakeTimer.current = setTimeout(() => setIdle(true), 60000);
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);
    return () => { clearTimeout(wakeTimer.current); window.removeEventListener('pointerdown', wake); window.removeEventListener('keydown', wake); };
  }, [idleNow]);
  useEffect(() => {
    if (!device.keepAwake || !navigator.wakeLock) return;
    let lock, dead = false;
    const take = async () => { try { const next = await navigator.wakeLock.request('screen'); if (dead) next.release(); else lock = next; } catch {} };
    take();
    const onVis = () => document.visibilityState === 'visible' && take();
    document.addEventListener('visibilitychange', onVis);
    return () => { dead = true; lock?.release().catch(() => {}); document.removeEventListener('visibilitychange', onVis); };
  }, [device.keepAwake]);
  useEffect(() => { setFocus(''); }, [personId]);

  const select = id => go(homeMode ? 'home' : 'board', id ? { person: id } : undefined);
  const showMeaning = where => { setFocus(where); setEvent(n => n + 1); if (where === 'meaning') setSheet(where); };
  const edit = () => go('season/new', personId ? { person: personId, edit: '1' } : { edit: '1' });

  return <main className={`compass-screen world-${world}${idle ? ' compass-idle' : ''}${homeMode ? ' compass-home' : ''}`} style={{ '--extra-people': `${Math.max(0, Math.ceil(day.people.length / 3) - 2) * 60}px` }} aria-label={person ? `${person.name}'s compass in the ${world}` : `Our family compass in the ${world}`}>
    <header className="compass-header">
      <button className="compass-brand" onClick={() => go('home')} aria-label="Quiet Waters home"><span>Quiet Waters</span><small>{isDemo ? 'Example family' : day.season?.name || 'Our household'}</small></button>
      <div className="compass-tools"><WorldSwitch world={world} onOpen={() => setSheet('world')} /><button className="compass-settings" onClick={() => go('settings')} aria-label="Settings"><Gear /></button></div>
    </header>

    <section className="compass-stage" aria-label="Our chosen direction">
      <div className="compass-heading">
        {person && <button className="family-return" onClick={() => select()}>← Our family · {family.word || 'our shared direction'}</button>}
        <p className="compass-eyebrow">{hasWord ? (person ? `${person.name} is becoming` : 'We are becoming') : 'A season to begin'}</p>
        <h1 className={board.word.length > 13 ? 'is-long' : ''}>{board.word || (person ? 'Your word' : 'Our compass')}</h1>
        <button className="meaning-button" onClick={() => showMeaning('meaning')} aria-label={`What ${board.word || 'our word'} means here`}>{hasWord ? story[0] : 'Choose a direction for this season'} <span aria-hidden="true">↗</span></button>
      </div>

      <div className="compass-habitat" aria-hidden="true">
        {world === 'pond' ? <PondView people={day.people} todayIds={day.todayIds} words={day.words} pads={day.pads} light={day.light} season={day.seasonName} paused={Boolean(sheet)} intention={{ board, boards, personId, focus, event }} /> : <Suspense fallback={<div className="grove-loading" />}><Grove people={day.people} board={focus === 'yes' ? { ...board, theme: 'grow' } : focus === 'no' ? { ...board, theme: 'welcome' } : board} boards={boards} personId={personId} todayIds={day.todayIds} light={day.light} season={day.seasonName} paused={Boolean(sheet)} weeks={weeks} event={event} /></Suspense>}
        <div className="habitat-edge" />
      </div>

      <button className="compass-bank bank-yes" aria-pressed={focus === 'yes'} onClick={() => showMeaning('yes')}><span className="bank-label">Make room for</span><span className="bank-intention">{board.yes || 'A small, good yes'}</span><span className="bank-sign" aria-hidden="true">↗</span></button>
      <button className="compass-bank bank-no" aria-pressed={focus === 'no'} onClick={() => showMeaning('no')}><span className="bank-label">Leave behind</span><span className="bank-intention">{board.no || 'Something that crowds it out'}</span><span className="bank-sign" aria-hidden="true">↗</span></button>

      <div className="compass-contributions" aria-label="Each person's part in our family">
        {person ? <p className="contribution-line"><span style={{ '--person-colour': COLOURS[day.people.indexOf(person) % COLOURS.length] }} className="person-seed" />{board.word || person.name} is one part of our shared direction.</p> : day.people.map((p, i) => <button key={p.id} className={`contribution${day.todayIds.includes(p.id) ? ' prayed-for' : ''}`} onClick={() => select(p.id)} aria-label={`${p.name}'s board, ${boards[p.id].word || 'choose a word'}`}><span className="person-seed" style={{ '--person-colour': COLOURS[i % COLOURS.length] }} /><span>{p.name}</span><b>{boards[p.id].word || 'Your word'}</b></button>)}
      </div>
      <p className="compass-root-caption" aria-live="polite">{focus === 'yes' ? (world === 'pond' ? 'The gathering makes room.' : 'Growth turns towards the light.') : focus === 'no' ? 'An open place, held for what matters.' : person ? 'One person. A gift to the whole.' : `${day.people.length === 1 ? 'One intention' : 'Our own intentions'}. One shared direction.`}</p>
    </section>

    <footer className="compass-footer">
      <div className="compass-context"><button onClick={() => setSheet('verse')}>{day.verse.word} · {day.verse.ref}</button><span>{day.season?.name || 'A season to begin'}{day.season ? ' · taking root' : ''}</span></div>
      <div className="compass-dock">
        {homeMode ? <><p className="today-pair">{day.welcomeBack && 'Welcome back. '}Today we pray for <strong>{names}</strong>.</p><div className="compass-dock-actions"><button className="btn btn-primary" onClick={() => go('pray')}>{prayed ? 'Pray again' : 'Pray'}</button><button className="btn btn-secondary" onClick={() => go('play')}>Play the verse</button></div><nav><button onClick={() => go('board', personId ? { person: personId } : undefined)}>Our compass</button><button onClick={() => go('deep')}>Into the deep</button><button onClick={() => go('season')}>Season book</button></nav></> : <><div className="compass-dock-actions">{hasWord ? <><button className="btn btn-primary" onClick={() => setIdle(true)}>Leave it open</button><button className="btn btn-secondary" onClick={edit}>{person ? 'Review my words' : 'Review our words'}</button></> : <><button className="btn btn-primary" onClick={edit}>Choose our words</button><button className="btn btn-secondary" onClick={() => setIdle(true)}>Leave it open</button></>}</div><nav><button onClick={() => go('home')}>Back to today</button><button onClick={() => go('season/new')}>A new season</button><button onClick={() => go('season')}>Season book</button></nav></>}
      </div>
      {idle && <button className="idle-wake" onClick={() => setIdle(false)} aria-label="Show controls">Touch to return</button>}
    </footer>

    {sheet && <Sheet title={sheet === 'world' ? 'Choose your world' : sheet === 'verse' ? 'A word to live by' : sheet === 'meaning' ? `${board.word || 'Our word'}, here` : sheet === 'yes' ? 'A good yes' : 'Space for what matters'} onClose={closeSheet}>
      {sheet === 'world' ? <><p className="sheet-intro">The same intentions. Two ways to hold them.</p><div className="world-options">{['pond', 'grove'].map(w => <button key={w} className={world === w ? 'selected' : ''} aria-pressed={world === w} onClick={() => { setDevice(d => ({ ...d, world: w })); const url = new URL(window.location.href); url.searchParams.set('world', w); window.history.replaceState(null, '', url); closeSheet(); }}><WorldMark world={w}/><span><b>{w === 'pond' ? 'Pond' : 'Grove'}</b><small>{w === 'pond' ? 'Gather, rest and make room.' : 'Share a root. Grow towards the light.'}</small></span><span aria-hidden="true">{world === w ? '✓' : '→'}</span></button>)}</div><p className="sheet-note">Chosen for this device. Everyone's words stay the same.</p></> : sheet === 'verse' ? <><p className="sheet-scripture">{day.verse.verse}</p><p className="sheet-note">{day.verse.ref} · NIV</p><p className="sheet-intro">The week's Scripture sits beside our chosen direction. It does not measure how well we have lived it.</p><button className="btn btn-primary" onClick={() => go('play')}>Play this verse</button></> : <><p className="sheet-word">{sheet === 'yes' ? board.yes || 'What could you make room for?' : sheet === 'no' ? board.no || 'What could you leave behind?' : board.word || 'Choose your word'}</p><p className="sheet-intro">{sheet === 'yes' ? 'When a choice comes, does it make space for this?' : sheet === 'no' ? 'A kind boundary, so the good yes has room. Not a fault to count.' : story[1]}</p><p className="sheet-note">{world === 'pond' ? (sheet === 'no' ? 'The school leaves a channel open.' : sheet === 'yes' ? 'The koi draw together, making room.' : 'The koi hold this meaning in their movement.') : (sheet === 'no' ? 'The clearing stays open. Nothing has to fill it.' : sheet === 'yes' ? 'The branches turn towards the light.' : 'Our separate branches share a living root.')}</p><button className="btn btn-secondary" onClick={edit}>Change this intention</button></>}
    </Sheet>}
  </main>;
}
