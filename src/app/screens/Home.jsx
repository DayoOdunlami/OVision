import { lowerFirst } from '../board.js';
import { useEffect, useRef, useState } from 'react';
import { go } from '../route.js';
import { WEEKDAYS } from '../calendar.js';
import { useDevice, getState } from '../store.js';
import { andNames, peopleOf, listNames } from '../household.js';
import { wantsFeedHint } from '../pond/koiFood.js';
import { Gear, WorldMark } from '../ui.jsx';

// ═══════════════════════════════════════════════════════════════════
// Home — the family's board, living in its world (studio P).
//
// The glance: who we're becoming this season (the word, lying in the
// pond's still water, or written by the vine), and one line for today:
// which of our yeses it's a day for. Never a no, never a tick. Then who
// we pray for, and the week's verse (touch it to play).
//
// A slip of paper floats at the foot: who we pray for today, who
// already has, and the two things to do: Pray, and Play the verse; and
// the way to the whole board, and to weighing a decision against it.
// Left alone for a minute, the slip and the controls sink away and the
// board is the idle screen.
// ═══════════════════════════════════════════════════════════════════

const IDLE_MS = 60000;

function whenLabel(day) {
  const h = day.clock.getHours();
  const part = day.light === 'night' && day.part === 'morning' ? 'before dawn'
    : day.part === 'night' ? 'night'
    : day.part;
  return `${WEEKDAYS[day.weekday]} · ${h < 3 ? 'late' : part}`;
}

function partOfTime(at) {
  const h = Number(String(at || '').slice(0, 2));
  if (h < 12) return 'this morning';
  if (h < 17) return 'this afternoon';
  return 'this evening';
}

// "Sam prayed this morning. Ada, Kit and Noor this evening."
function prayedLine(day) {
  const sittings = getState().sittings.filter((s) => s.date === day.date);
  if (!sittings.length) return null;
  const parts = [];
  const seen = new Set();
  for (const s of sittings) {
    const who = peopleOf(day.household, s.who.filter((id) => !seen.has(id)));
    who.forEach((p) => seen.add(p.id));
    if (!who.length) continue;
    parts.push({ names: listNames(who.map((p) => p.name)), when: partOfTime(s.at) });
  }
  if (!parts.length) return null;
  return parts.map((p, i) => (i === 0 ? `${p.names} prayed ${p.when}.` : `${p.names} ${p.when}.`)).join(' ');
}

export default function Home({ day, idleNow }) {
  const device = useDevice();
  const [idle, setIdle] = useState(Boolean(idleNow));
  const [feedHint] = useState(() => wantsFeedHint());
  const timer = useRef(0);

  // Left alone, the controls sink away and the pond is the idle screen.
  useEffect(() => {
    const wake = (e) => {
      clearTimeout(timer.current);
      if (idle) {
        setIdle(false);
        // The touch that wakes the pond doesn't also press a button.
        e?.preventDefault?.();
      }
      timer.current = setTimeout(() => setIdle(true), IDLE_MS);
    };
    if (!idleNow) timer.current = setTimeout(() => setIdle(true), IDLE_MS);
    window.addEventListener('pointerdown', wake, true);
    window.addEventListener('keydown', wake, true);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener('pointerdown', wake, true);
      window.removeEventListener('keydown', wake, true);
    };
  }, [idle, idleNow]);

  // The tablet on the side can be kept awake (Settings).
  useEffect(() => {
    if (!device.keepAwake || !('wakeLock' in navigator)) return;
    let lock = null;
    const take = async () => {
      try { lock = await navigator.wakeLock.request('screen'); } catch {}
    };
    take();
    const onVis = () => document.visibilityState === 'visible' && take();
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); lock?.release?.().catch(() => {}); };
  }, [device.keepAwake]);

  const season = day.season;
  const board = day.board;
  const vine = day.world === 'vine';
  const word = board?.word || day.verse.word;
  const wordLabel = season ? `${season.name} · our word` : 'This week’s word';
  const names = day.isSunday ? 'all of us' : andNames(day.forPeople);
  const prayed = prayedLine(day);
  // Whoever usually prays here at this time has prayed: Pray stays, quieter,
  // for the next person.
  const done = day.lastWho.length > 0 && day.lastWho.every((id) => day.prayed.includes(id));
  const yes = day.todayYes;

  const pray = (
    <p className="water-today">
      {day.isSunday ? 'Sunday · we pray for all of us' : <>We pray for <b>{names}</b></>}
    </p>
  );
  const verse = (
    <button className="water-verse" onClick={() => go('play')} aria-label={`Play this week's verse, ${day.verse.ref}`} data-no-feed>
      <span className="water-verse-ref">This week · {day.verse.ref}</span>
    </button>
  );

  return (
    <main className={'home board-home in-' + day.world + (idle ? ' is-idle' : '')} aria-label={vine ? 'Our board, on the vine' : 'Our board, in the pond'}>
      <header className="home-top">
        <p className="home-when">{whenLabel(day)}</p>
        <div className="home-marks fades">
          <WorldMark world={day.world} onClick={() => go('world')} />
          <button className="icon-btn home-gear" onClick={() => go('settings')} aria-label="Settings" title="Settings">
            <Gear />
          </button>
        </div>
      </header>

      <section className="water-words">
        <p className="water-label">{wordLabel}</p>
        <h1 className={vine ? 'water-word sr-only' : 'water-word'}>{word}</h1>
        {board?.line && <p className="board-line">{board.line}</p>}
        {yes && (
          <p className="board-yes">
            <span className="board-today">Today</span>
            Yes to {lowerFirst(yes.text)}
          </p>
        )}
        {!vine && pray}
        {!vine && verse}
        {feedHint && !vine && day.part !== 'morning' && day.light !== 'night' && <p className="water-hint fades">Touch a koi, a pad or the water. Double-tap to feed.</p>}
        {board && (
          <ul className="sr-only">
            {board.yes.map((y) => <li key={y.text}>Yes to {lowerFirst(y.text)}{y.no ? `, so no to ${lowerFirst(y.no)}` : ''}</li>)}
            {board.people.filter((p) => p.word).map((p) => <li key={p.id}>{p.name}: {p.word}</li>)}
          </ul>
        )}
      </section>

      {vine && (
        <section className="field-foot">
          {pray}
          {verse}
        </section>
      )}

      <section className="slip fades" aria-label="Today">
        {day.welcomeBack && !prayed && <p className="slip-welcome">Welcome back.</p>}
        <p className="slip-line">
          {day.isSunday ? (
            <>Sunday. Today we pray for <b className="gold">all of us</b>.</>
          ) : (
            <>Today we pray for <b className="gold">{names}</b>.</>
          )}
        </p>
        {prayed && <p className="slip-sub">{prayed}</p>}
        <div className="slip-actions">
          <button className={'btn btn-big ' + (done ? 'btn-secondary' : 'btn-primary')} onClick={() => go('pray')}>
            {day.isSunday ? 'Pray together' : done ? 'Pray again' : 'Pray'}
          </button>
          <button className="btn btn-secondary btn-big" onClick={() => go('play')}>
            Play the verse
          </button>
        </div>
        {day.saturdayEvening && (
          <button className="slip-offer" onClick={() => go('deep')}>
            Saturday evening: a time to put things down <span aria-hidden="true">→</span>
          </button>
        )}
        {!day.season && (
          <button className="slip-offer" onClick={() => go('season/new')}>
            Set our way for this season, together <span aria-hidden="true">→</span>
          </button>
        )}
        {day.seasonEnding && (
          <button className="slip-offer" onClick={() => go('season/new')}>
            The season is nearly over. Look back, and set the next one together <span aria-hidden="true">→</span>
          </button>
        )}
        <nav className="slip-links">
          {day.season && <button className="link" onClick={() => go('season')}>Our way</button>}
          {day.season && <button className="link" onClick={() => go('weigh')}>Weighing a decision?</button>}
          {!day.saturdayEvening && <button className="link" onClick={() => go('deep')}>Into the deep</button>}
        </nav>
      </section>
    </main>
  );
}

