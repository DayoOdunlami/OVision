import { useEffect, useMemo, useRef, useState } from 'react';
import { Round } from './Round.jsx';
import KoiSchool from '../pond/KoiSchool.jsx';
import { home } from '../route.js';
import { setState, setDevice, getDevice } from '../store.js';
import { peopleOf, callName, isChild, KOI } from '../household.js';
import { buildPrayerContext } from '../content/context.js';
import { prayers } from '../content/prayers.js';
import { CloseButton, Faces, KoiGlyph, tick } from '../ui.jsx';
import './play.css';

// ═══════════════════════════════════════════════════════════════════
// Play — this week's verse, until it's known by heart.
//
// Four steps through the week, and it remembers where you got to:
//
//   Some words   about one in three falls (the old Memory cut)
//   More words   about one in two
//   Every word   all of them
//   By heart     the verse is hidden; first letters are stepping
//                stones. Say the next word aloud, then tap to check.
//
// Different words fall each time you play. Any step can be chosen at
// any time; nothing is locked. With two or three playing, the glowing
// slot takes the colour of whoever's turn it is.
//
// "Today's prayer" is the other game: the prayer with our names in it,
// a paragraph a round, as the family played it before.
// ═══════════════════════════════════════════════════════════════════

export const LEVELS = [
  { label: 'Some words', mode: 'memory', every: 3 },
  { label: 'More words', mode: 'memory', every: 2 },
  { label: 'Every word', mode: 'words' },
  { label: 'By heart' },
];

function resolvePlayers(day, query) {
  const want = (query.who || '').toLowerCase().split(',').filter(Boolean);
  if (want.length) {
    const ids = day.people.filter((p) => want.includes(p.id) || want.includes(p.name.toLowerCase())).map((p) => p.id);
    if (ids.length) return ids;
  }
  const dev = getDevice().lastWho || {};
  const last = (dev.evening || dev.afternoon || dev[day.part] || []).filter((id) => day.people.some((p) => p.id === id));
  if (last.length) return last;
  const kids = day.people.filter(isChild).map((p) => p.id);
  return kids.length ? kids.slice(0, 3) : day.people.slice(0, 1).map((p) => p.id);
}

export default function Play({ day, query }) {
  const [playerIds, setPlayerIds] = useState(() => resolvePlayers(day, query));
  const [choosing, setChoosing] = useState(false);
  const players = peopleOf(day.household, playerIds);
  const [game, setGame] = useState(query.game === 'prayer' ? 'prayer' : 'verse');
  const [level, setLevel] = useState(() => Math.min(3, Number(query.step ?? day.playStep) || 0));
  const [round, setRound] = useState(0);          // a new round = a new deal
  const [para, setPara] = useState(0);            // Today's prayer: which paragraph
  const [complete, setComplete] = useState(false);
  const [left, setLeft] = useState(null);
  const [turn, setTurn] = useState(0);
  const [koi, setKoi] = useState(null);
  const koiId = useRef(0);
  const hintRef = useRef(null);
  const idle = useRef(0);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && home();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // A gentle hint after eight quiet seconds, so the older child doesn't
  // have to "help".
  const poke = () => {
    clearTimeout(idle.current);
    idle.current = setTimeout(() => hintRef.current?.(), 8000);
  };
  useEffect(() => () => clearTimeout(idle.current), []);

  const verse = day.verse;
  const prayerParas = useMemo(() => {
    const p = day.forPeople;
    if (!p.length || day.isSunday) return [];
    const as = (x) => ({ name: callName(x, true), label: callName(x, true) });
    const ctx = p.length >= 2 ? buildPrayerContext(as(p[0]), as(p[1]), 'kids', null) : null;
    if (!ctx) return [];
    return prayers[day.prayerIdx].flowing.kids(ctx).split('\n\n');
  }, [day.prayerIdx, day.forPeople, day.isSunday]);

  const turnPlayer = players.length > 1 ? players[turn % players.length] : null;
  const turnColor = turnPlayer ? KOI[turnPlayer.koi]?.turn : null;

  const restart = (opts = {}) => {
    setComplete(false);
    setLeft(null);
    setRound((r) => r + 1);
    if (opts.level != null) setLevel(opts.level);
  };

  const finished = () => {
    setComplete(true);
    tick(16);
    if (game === 'verse' && level < 3) {
      setState((s) => ({ ...s, play: { ...s.play, [day.week]: Math.max(s.play?.[day.week] ?? 0, level + 1) } }));
    }
  };

  const saidByHeart = () => {
    setState((s) => ({
      ...s,
      heart: { ...s.heart, [day.week]: { date: day.date, who: playerIds } },
      play: { ...s.play, [day.week]: 3 },
    }));
    tick(20);
  };

  const koiPeople = players.map((p) => ({ name: callName(p, true), koi: p.koi }));
  const onKoi = () => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !koiPeople.length) return;
    koiId.current += 1;
    setKoi({ id: koiId.current, people: [koiPeople[Math.floor(Math.random() * koiPeople.length)]] });
  };

  const html = game === 'verse' ? verse.verse : prayerParas[para] || '';
  const L = LEVELS[level];

  return (
    <div className="room room-paper play" role="dialog" aria-modal="true" aria-label="Play the verse">
      {koi && <KoiSchool key={koi.id} people={koi.people} stay={false} onGone={() => setKoi(null)} />}

      <div className="room-top play-top">
        <button className="players" onClick={() => setChoosing((c) => !c)} aria-expanded={choosing}>
          {players.map((p) => <KoiGlyph key={p.id} koi={p.koi} size={26} />)}
          <span className="players-names">{players.map((p) => callName(p, true)).join(', ')}</span>
          <span className="who-chip-change">· change</span>
        </button>
        <CloseButton onClick={home} />
      </div>

      {choosing ? (
        <div className="room-body">
          <h1 className="room-title">Who’s playing?</h1>
          <Faces
            people={day.people}
            selected={playerIds}
            big
            forKids
            onToggle={(id) => setPlayerIds((s) => (s.includes(id) ? (s.length > 1 ? s.filter((x) => x !== id) : s) : [...s, id]))}
          />
          <div className="room-foot-inline">
            <button className="btn btn-primary btn-big" onClick={() => {
              setChoosing(false);
              setTurn(0);
              setDevice((d) => ({ ...d, lastWho: { ...d.lastWho, evening: playerIds } }));
            }}>Play</button>
          </div>
        </div>
      ) : (
        <>
          <div className="play-choose">
            <div className="seg" role="tablist" aria-label="What to play">
              <button role="tab" aria-selected={game === 'verse'} className={'seg-opt' + (game === 'verse' ? ' is-on' : '')}
                onClick={() => { setGame('verse'); restart(); }}>This week’s verse</button>
              {prayerParas.length > 0 && (
                <button role="tab" aria-selected={game === 'prayer'} className={'seg-opt' + (game === 'prayer' ? ' is-on' : '')}
                  onClick={() => { setGame('prayer'); setPara(0); restart(); }}>Today’s prayer</button>
              )}
            </div>
            {game === 'verse' && (
              <ol className="steps" aria-label="Steps">
                {LEVELS.map((l, k) => (
                  <li key={k}>
                    <button
                      className={'step-stone' + (k === level ? ' is-on' : '') + (k < day.playStep || (k === 3 && day.heartThisWeek) ? ' is-done' : '')}
                      onClick={() => restart({ level: k })}
                      aria-current={k === level ? 'step' : undefined}
                    >
                      <span className="stone-dot" aria-hidden="true" />
                      <span className="stone-label">{l.label}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {game === 'verse' && level === 3 ? (
            <HeartRound
              key={`h${round}`}
              verse={verse}
              players={players}
              done={Boolean(day.heartThisWeek)}
              onSaid={saidByHeart}
              onAgain={() => restart()}
            />
          ) : (
            <Round
              key={`${game}:${level}:${para}:${round}`}
              html={html}
              mode={game === 'verse' ? L.mode : 'memory'}
              every={game === 'verse' ? L.every || 3 : 3}
              offset={round % 3}
              effects={['ripple', 'sweep', 'gather', 'koi']}
              players={koiPeople}
              passage={game === 'verse' ? verse.ref : day.prayer?.ref || ''}
              hintRef={hintRef}
              onComplete={finished}
              onKoi={onKoi}
              onLeft={setLeft}
              onPlaced={() => { setTurn((n) => n + 1); poke(); }}
              turnColor={turnColor}
            />
          )}

          {!(game === 'verse' && level === 3) && (
            <div className="room-foot play-foot">
              {complete ? (
                game === 'verse' ? (
                  <>
                    <button className="btn btn-secondary btn-big" onClick={() => restart()}>Again</button>
                    <button className="btn btn-primary btn-big" onClick={() => restart({ level: level + 1 })}>
                      Next: {LEVELS[level + 1].label}
                    </button>
                  </>
                ) : para < prayerParas.length - 1 ? (
                  <button className="btn btn-primary btn-big" onClick={() => { setPara((n) => n + 1); restart(); }}>Next part</button>
                ) : (
                  <>
                    <button className="btn btn-secondary btn-big" onClick={() => { setPara(0); restart(); }}>Again</button>
                    <button className="btn btn-primary btn-big" onClick={home}>Done</button>
                  </>
                )
              ) : left != null ? (
                <>
                  <span className="pz-left">
                    {left} to go
                    {turnPlayer && <> · <span className="turn" style={{ '--koi': turnColor }}>{callName(turnPlayer, true)}’s turn</span></>}
                  </span>
                  <button className="btn btn-quiet" onClick={() => hintRef.current?.()}>Hint</button>
                </>
              ) : <span />}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── By heart ─────────────────────────────────────────────────────────
// The verse hidden. Each word is a stepping stone showing only its
// first letter. Say the next word out loud, then tap its stone to see if
// you were right. There's nothing to get wrong: the app can't hear you,
// and doesn't pretend to.
function HeartRound({ verse, players, done, onSaid, onAgain }) {
  const words = useMemo(() => verse.verse.split(/\s+/), [verse.verse]);
  const [shown, setShown] = useState(0);
  const [said, setSaid] = useState(false);
  const all = shown >= words.length;
  const turn = players.length > 1 ? players[shown % players.length] : null;

  const reveal = (k) => {
    if (k !== shown) return;
    setShown((n) => n + 1);
    tick(8);
  };

  return (
    <>
      <div className="heart-stage">
        <p className="heart-intro">{all ? 'You said it by heart.' : 'Say the next word out loud. Then tap it.'}</p>
        {all ? (
          <blockquote className="scripture heart-whole">{verse.verse}</blockquote>
        ) : (
        <p className="heart-verse" style={turn ? { '--turn': KOI[turn.koi]?.turn } : undefined}>
          {words.map((w, k) => {
            const m = w.match(/^([^\p{L}]*)(\p{L})(.*)$/u);
            const first = m ? m[1] + m[2] : w;
            const rest = m ? m[3] : '';
            const open = k < shown;
            return (
              <button
                key={k}
                className={'heart-word' + (open ? ' is-open' : '') + (k === shown ? ' is-next' : '')}
                onClick={() => reveal(k)}
                disabled={k !== shown}
                aria-label={open ? w : k === shown ? `Next word, starting ${first}` : 'Hidden word'}
              >
                {first}<span className="heart-rest">{open ? rest : rest.replace(/[\p{L}’']/gu, '·')}</span>
              </button>
            );
          })}
        </p>
        )}
        <p className="scripture-ref">{verse.ref}</p>
      </div>
      <div className="room-foot play-foot">
        {all ? (
          <>
            <button className="btn btn-secondary btn-big" onClick={onAgain}>Again</button>
            <button
              className={'btn btn-big ' + (said || done ? 'btn-said' : 'btn-primary')}
              onClick={() => { if (!said && !done) { setSaid(true); onSaid(); } }}
            >
              {said || done ? 'By heart. A lotus opens on the pond.' : 'We said it by heart'}
            </button>
          </>
        ) : (
          <span className="pz-left">
            {words.length - shown} to go
            {turn && <> · <span className="turn" style={{ '--koi': KOI[turn.koi]?.turn }}>{callName(turn, true)}’s turn</span></>}
          </span>
        )}
      </div>
    </>
  );
}
