import { useEffect, useMemo, useState } from 'react';
import { readPrayerState } from '../data/prayerLink.js';
import { wordForRef, readVineyard, todayIso } from '../flourish/abide/words.js';
import { loadBoard, DEFAULT_MEMBER_ID } from '../data/board.js';

// ═══════════════════════════════════════════════════════════════════
// Today — an optional front door. The three rooms of the house, in the
// order a family might walk through them on an ordinary day:
//
//   1 Pray   for each other: who we're carrying today (the rota)
//   2 Abide  with the week's word, for yourself (or together)
//   3 Rest   your eyes on the board: who you're becoming this season
//
// Each still stands on its own; this page only joins them up, shows
// what's been done today, and sends you on (?from=today, so each room
// can offer the way back).
// ═══════════════════════════════════════════════════════════════════

const longDate = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const hour = () => new Date().getHours();
const greeting = () => (hour() < 12 ? 'Good morning' : hour() < 18 ? 'Good afternoon' : 'Good evening');

export default function TodayApp() {
  const [prayer, setPrayer] = useState(readPrayerState);
  const [vineyard, setVineyard] = useState(readVineyard);
  const [board, setBoard] = useState(null);
  const word = useMemo(() => wordForRef(prayer.prayerRef), [prayer.prayerRef]);

  useEffect(() => {
    try { sessionStorage.setItem('todaySeen', '1'); } catch { /* ignore */ }
    let id = DEFAULT_MEMBER_ID;
    try { id = localStorage.getItem('ib.member') || id; } catch { /* ignore */ }
    loadBoard('local', id).then(setBoard);
    // Coming back from a room: pick up what was done there.
    const refresh = () => { setPrayer(readPrayerState()); setVineyard(readVineyard()); };
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('pageshow', refresh); };
  }, []);

  const names = prayer.isSunday ? 'All of us' : prayer.todayPair?.map((p) => p.label).join(' & ');
  const abided = vineyard.filter((e) => e.date === todayIso());
  const abidedNames = [...new Set(abided.flatMap((e) => e.who))].length;
  const prayed = prayer.prayedToday;
  const next = !prayed ? 'pray' : !abided.length ? 'abide' : 'rest';

  return (
    <div className="td-app">
      <header className="td-head">
        <p className="td-eyebrow">{longDate()}</p>
        <h1>{greeting()}.</h1>
        <p className="td-lede">Three small things, if you have the time. Each one also stands on its own.</p>
      </header>

      <ol className="td-path">
        <Step
          n="1" title="Pray" done={prayed} next={next === 'pray'}
          href="/pray/?from=today"
          action={prayed ? 'Pray again' : 'Pray'}
          doneLine="Prayed today."
        >
          {prayer.available ? (
            prayer.isSunday ? (
              <>All of us together today: <strong>the Lord’s Prayer</strong>.</>
            ) : (
              <>For each other. Today we’re carrying <strong>{names || 'the family'}</strong>
                {prayer.prayerRef && <span className="td-ref"> · {prayer.prayerRef}</span>}.</>
            )
          ) : (
            <>For each other: the family prayer rota. Open it once to set up this week.</>
          )}
        </Step>

        <Step
          n="2" title="Abide" done={abided.length > 0} next={next === 'abide'}
          href="/flourish/abide/?from=today"
          action={abided.length ? 'Abide again' : 'Abide'}
          doneLine={abidedNames > 1 ? `${abidedNames} of you have abided today.` : 'Abided today.'}
        >
          This week’s word is <em className="td-word">{word.word}</em>. Sow it, and stay while it grows. About three minutes.
          <span className="td-verse">“{word.lines.join(' ')}” <span className="td-ref">{word.ref}</span></span>
        </Step>

        <Step
          n="3" title="Rest your eyes" next={next === 'rest'}
          href="/?from=today"
          action="Open the board"
          extra={<a className="td-quiet" href="/?screen=1">or as a screensaver</a>}
        >
          {board ? (
            <>{board.owner || board.name}’s board{board.period ? ` for ${board.period}` : ''}:
              {' '}<em className="td-word">{board.identity?.heroWord}</em>
              {board.season?.heroWord ? <>, this season <em className="td-word">{board.season.heroWord}</em></> : null}.
              {' '}It changes slowly, with the season, not the day.</>
          ) : 'The board.'}
        </Step>
      </ol>

      <footer className="td-foot">
        <a href="/">Pond</a> · <a href="/pray/">Pray</a> · <a href="/flourish/abide/">Abide</a>
      </footer>
    </div>
  );
}

function Step({ n, title, done, next, href, action, doneLine, extra, children }) {
  return (
    <li className={`td-step${done ? ' is-done' : ''}${next ? ' is-next' : ''}`}>
      <span className="td-n" aria-hidden="true">{done ? '✓' : n}</span>
      <div className="td-body">
        <h2>{title}</h2>
        <p>{children}</p>
        {done && doneLine && <p className="td-done">{doneLine}</p>}
        <div className="td-actions">
          <a className={`td-btn${next ? ' is-primary' : ''}`} href={href}>{action}</a>
          {extra}
        </div>
      </div>
    </li>
  );
}
