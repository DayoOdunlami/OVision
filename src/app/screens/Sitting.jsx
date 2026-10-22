import { useEffect, useMemo, useRef, useState } from 'react';
import { go, home } from '../route.js';
import { setState, setDevice, getState } from '../store.js';
import { buildSitting } from '../script.js';
import { peopleOf, callName, andNames, isChild, uid, KOI } from '../household.js';
import { WEEKDAYS_SHORT } from '../calendar.js';
import { Faces, Dots, CloseButton, KoiGlyph, tick } from '../ui.jsx';
import KoiSchool from '../pond/KoiSchool.jsx';
import Nudge from '../pond/Nudge.jsx';

// ═══════════════════════════════════════════════════════════════════
// Sitting — today's prayer, for whoever is in the room.
//
// The water stills into paper (night paper before dawn), and the prayer
// goes one thought at a time in the same order every day:
//
//   still → Scripture → pray → ask → bless → Amen
//
// Who's here decides the rest (see script.js). It's asked once per
// device and time of day, then remembered, so Dad at 06:45 goes from the
// home-screen icon to the first words in two taps.
// ═══════════════════════════════════════════════════════════════════

function resolveWho(raw, people) {
  if (!raw) return null;
  const want = raw.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
  if (want.includes('all')) return people.map((p) => p.id);
  const ids = people.filter((p) => want.includes(p.id) || want.includes(p.name.toLowerCase()) || (p.short && want.includes(p.short.toLowerCase()))).map((p) => p.id);
  return ids.length ? ids : null;
}

export default function Sitting({ day, query }) {
  const people = day.people;
  const initial = useMemo(() => {
    const q = resolveWho(query.who, people);
    if (q) return q;
    if (day.isSunday) return people.map((p) => p.id);
    return day.lastWho.length ? day.lastWho : null;
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps
  const [present, setPresent] = useState(initial);
  const [choosing, setChoosing] = useState(!initial);

  const begin = (ids) => {
    setPresent(ids);
    setChoosing(false);
    if (!day.isSunday) setDevice((d) => ({ ...d, lastWho: { ...d.lastWho, [day.part]: ids } }));
  };

  return (
    <div className="room room-paper sitting" role="dialog" aria-modal="true" aria-label="Today's prayer">
      {choosing ? (
        <WhoHere day={day} initial={present || []} onBegin={begin} />
      ) : (
        <Run key={present.join()} day={day} present={peopleOf(day.household, present)} onChange={() => setChoosing(true)} />
      )}
    </div>
  );
}

// ── Who's here? ──────────────────────────────────────────────────────
function WhoHere({ day, initial, onBegin }) {
  const [sel, setSel] = useState(initial);
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const kids = day.people.some(isChild);
  return (
    <>
      <div className="room-top">
        <span />
        <CloseButton onClick={home} />
      </div>
      <div className="room-body who-here">
        <p className="label">{day.isSunday ? 'Sunday' : `Today we pray for ${andNames(day.forPeople)}`}</p>
        <h1 className="room-title">Who’s praying?</h1>
        <p className="room-sub">Tap everyone who’s here.</p>
        <Faces people={day.people} selected={sel} onToggle={toggle} big={kids} />
      </div>
      <div className="room-foot">
        <span />
        <button className="btn btn-primary btn-big" disabled={!sel.length} onClick={() => onBegin(sel)}>
          Begin
        </button>
      </div>
    </>
  );
}

// ── The sitting itself ───────────────────────────────────────────────
function Run({ day, present, onChange }) {
  const earlier = useMemo(() => {
    const s = getState().sittings.filter((x) => x.date === day.date && !x.who.some((id) => present.some((p) => p.id === id)));
    if (!s.length || day.isSunday) return null;
    const who = peopleOf(day.household, s[0].who);
    const h = Number(String(s[0].at).slice(0, 2));
    const when = h < 12 ? 'this morning' : h < 17 ? 'this afternoon' : 'this evening';
    return `${andNames(who, true)} prayed for ${andNames(day.forPeople, true)} ${when}. Now it’s your turn.`;
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const sitting = useMemo(() => buildSitting({
    present,
    forPeople: day.forPeople,
    everyone: day.people,
    prayerIdx: day.prayerIdx,
    isSunday: day.isSunday,
    part: day.part,
    earlier,
  }), [present, day.prayerIdx, day.isSunday]);  // eslint-disable-line react-hooks/exhaustive-deps

  const { steps, kind, verse } = sitting;
  const [i, setI] = useState(0);
  const [line, setLine] = useState('');
  const [wander, setWander] = useState(false);
  const [phase, setPhase] = useState(0);         // per-step sub-phase
  const step = steps[i];
  const kids = kind === 'children' || sitting.voice === 'kids';
  const silent = kind === 'solo';

  useEffect(() => { setPhase(0); setWander(false); }, [i]);

  const next = () => setI((n) => Math.min(steps.length - 1, n + 1));

  const amen = () => {
    const at = day.clock.toTimeString().slice(0, 5);
    const rec = {
      id: uid(),
      date: day.date,
      at,
      who: present.map((p) => p.id),
      for: day.todayIds,
      week: day.week,
      prayer: day.prayerIdx,
      kind,
      ...(line.trim() ? { line: line.trim().slice(0, 240) } : {}),
    };
    setState((s) => ({ ...s, sittings: [...s.sittings, rec] }));
    tick(14);
    next();
  };

  // Keyboard: → or Enter for the next thought, Esc for the pond.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') home();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isLast = step.type === 'amen';
  const showWander = (step.type === 'pray' || step.type === 'ask') && i > 1 && kind !== 'children' && !day.isSunday;

  return (
    <>
      {isLast && (
        <AmenKoi
          people={sitting.forPeople.map((p) => ({ name: callName(p, kids), koi: p.koi }))}
          delay={silent ? 3000 : 900}
        />
      )}
      <div className="room-top">
        <Dots count={steps.length} at={i} />
        <CloseButton onClick={home} />
      </div>

      <div className={'room-body step step-' + step.type} key={i}>
        <Step
          step={step}
          sitting={sitting}
          day={day}
          present={present}
          phase={phase}
          setPhase={setPhase}
          line={line}
          setLine={setLine}
          kids={kids}
          first={i === 0}
          onChange={onChange}
          onHeart={() => {
            setState((s) => ({ ...s, heart: { ...s.heart, [day.week]: { date: day.date, who: present.map((p) => p.id) } } }));
            tick(14);
          }}
        />
        {wander && (
          <div className="wander" role="note">
            <p>Come back gently, with this week’s word:</p>
            <p className="wander-word">{verse.word}</p>
            <p className="wander-breath">{verse.breath[0]}<br />{verse.breath[1]}</p>
          </div>
        )}
      </div>

      <div className="room-foot">
        {showWander ? (
          <button className="link wander-link" onClick={() => setWander((w) => !w)} aria-expanded={wander}>
            {wander ? 'Back to the prayer' : 'Wandered?'}
          </button>
        ) : <span />}
        <Primary step={step} phase={phase} setPhase={setPhase} next={next} amen={amen} kind={kind} day={day} />
      </div>
    </>
  );
}

// The koi of everyone prayed for rise under the paper, after a held
// silence: the last thing met is quiet, not the app.
function AmenKoi({ people, delay }) {
  const [up, setUp] = useState(false);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setTimeout(() => setUp(true), delay);
    return () => clearTimeout(id);
  }, [delay]);
  return up ? <KoiSchool people={people} stay onGone={() => {}} /> : null;
}

function Primary({ step, phase, setPhase, next, amen, kind, day }) {
  const t = step.type;
  if (t === 'amen') {
    return (
      <div className="foot-actions">
        {(kind === 'children' || kind === 'sunday') && (
          <button className="btn btn-secondary btn-big" onClick={home}>Done</button>
        )}
        {(kind === 'children' || kind === 'sunday') ? (
          <button className="btn btn-primary btn-big" onClick={() => go('play')}>Play the verse</button>
        ) : (
          <button className="btn btn-primary btn-big" onClick={home}>Done</button>
        )}
      </div>
    );
  }
  if (t === 'bless') return <button className="btn btn-primary btn-big" onClick={amen}>Amen</button>;
  if (t === 'verse' && step.twice) {
    if (phase === 0) return <button className="btn btn-primary btn-big" onClick={() => setPhase(1)}>Read it again</button>;
    if (phase === 1) return <button className="btn btn-primary btn-big" onClick={() => setPhase(2)}>Be still</button>;
    return <Stillness seconds={20} onDone={next} />;
  }
  if (t === 'still' || t === 'here') return <button className="btn btn-primary btn-big" onClick={next}>Begin</button>;
  return <button className="btn btn-primary btn-big" onClick={next}>Next</button>;
}

// Twenty seconds of quiet after the second reading. The way on appears
// when it's over; nothing counts down in numbers.
function Stillness({ seconds, onDone }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), seconds * 1000);
    return () => clearTimeout(id);
  }, [seconds]);
  return (
    <div className="stillness">
      {!ready && <span className="stillness-ring" style={{ '--secs': `${seconds}s` }} aria-label="A moment of quiet" />}
      <button className={'btn btn-big ' + (ready ? 'btn-primary' : 'btn-quiet')} onClick={onDone}>
        {ready ? 'Continue' : 'Stay a moment'}
      </button>
    </div>
  );
}

// ── One step ─────────────────────────────────────────────────────────
function Step({ step, sitting, day, present, phase, line, setLine, kids, first, onChange, onHeart }) {
  const chip = first && !day.isSunday && (
    <button className="who-chip" onClick={onChange}>
      Praying: {andNames(present, kids)} <span className="who-chip-change">· change</span>
    </button>
  );

  switch (step.type) {
    case 'still':
      return (
        <div className="still">
          {chip}
          <p className="label">{step.sunday ? 'Sunday' : `${WEEKDAYS_SHORT[day.weekday]} · ${day.part === 'morning' && day.light === 'night' ? 'before dawn' : day.part}`}</p>
          <h1 className="room-title names">{step.sunday ? 'All of us' : <Gold html={sitting.title} />}</h1>
          <Breath words={step.breath} />
          <p className="room-sub">Breathe in, and out. Then begin.</p>
        </div>
      );

    case 'here':
      return (
        <div className="here">
          {chip}
          <p className="label">Today we pray for</p>
          <div className="here-names">
            {step.forPeople.map((p) => (
              <span key={p.id} className="here-name">
                <KoiGlyph koi={p.koi} size={56} />
                <b>{callName(p, true)}</b>
              </span>
            ))}
          </div>
          {step.earlier && <p className="room-sub earlier">{step.earlier}</p>}
          <p className="room-sub">Take one slow breath together.</p>
        </div>
      );

    case 'verse': {
      const heartDone = Boolean(day.heartThisWeek);
      if (step.heart) return <HeartVerse verse={step.verse} done={heartDone} onHeart={onHeart} />;
      return (
        <div className="verse-step">
          <p className="label">{step.twice ? (phase === 0 ? 'Read slowly' : phase === 1 ? 'Again, slower' : 'Be still') : 'Read it together'}</p>
          <blockquote className={'scripture' + (phase >= 1 ? ' is-second' : '')}>
            <WordLit text={step.verse.verse} word={phase >= 1 || !step.twice ? step.verse.word : null} />
          </blockquote>
          <p className="scripture-ref">{step.verse.ref}</p>
          {phase === 2 && <p className="room-sub">Let the words settle. There’s nothing to do.</p>}
        </div>
      );
    }

    case 'pray':
      return (
        <div className="pray-step">
          {step.label && <p className="label">{step.label}</p>}
          {step.reader && (
            <p className="reader" style={{ '--koi': KOI[step.reader.koi]?.turn }}>
              <KoiGlyph koi={step.reader.koi} size={26} /> {callName(step.reader, true)} reads
            </p>
          )}
          <p className="prayer" dangerouslySetInnerHTML={{ __html: step.html }} />
        </div>
      );

    case 'ask':
      return (
        <div className="ask-step">
          <p className="label">Ask</p>
          <p className="prayer prompt">{step.prompt}</p>
          {step.line ? (
            <label className="line-field">
              <span className="line-label">A line for them, if you like. It stays on this device.</span>
              <textarea rows={2} value={line} onChange={(e) => setLine(e.target.value)} maxLength={240} />
            </label>
          ) : (
            <p className="room-sub">Tell God, in your own words.</p>
          )}
        </div>
      );

    case 'wonder':
      return (
        <div className="wonder-step">
          <p className="label">I wonder</p>
          <p className="prayer wonder">{step.text}</p>
          <p className="room-sub">Say it out loud, or just think it.</p>
        </div>
      );

    case 'everyone':
      return (
        <div className="everyone-step">
          <p className="label">We hold each one</p>
          <div className="here-names many">
            {step.people.map((p) => (
              <span key={p.id} className="here-name">
                <KoiGlyph koi={p.koi} size={40} />
                <b>{callName(p, kids)}</b>
              </span>
            ))}
          </div>
          <p className="prayer blessing" dangerouslySetInnerHTML={{ __html: step.html }} />
        </div>
      );

    case 'week':
      return <WeekLook day={day} />;

    case 'bless':
      return (
        <div className="bless-step">
          <p className="label">{step.together ? 'Everyone together' : 'Bless'}</p>
          <p className="prayer blessing" dangerouslySetInnerHTML={{ __html: step.html }} />
        </div>
      );

    case 'amen':
      return (
        <div className="amen">
          <Nudge className="amen-word">Amen.</Nudge>
          <Nudge as="p" className="amen-sub">
            {sitting.kind === 'children' ? 'God heard you.'
              : sitting.kind === 'sunday' ? 'The week is closed. A new prayer comes on Monday morning.'
              : `${andNames(sitting.forPeople)}, held before God.`}
          </Nudge>
        </div>
      );

    default:
      return null;
  }
}

// Names come through as HTML-free text; gold for whoever we pray for.
function Gold({ html }) {
  const parts = String(html).split(' & ');
  return parts.map((p, i) => (
    <span key={i}>{i > 0 && <span className="amp"> &amp; </span>}<span className={p === 'me' ? '' : 'gold'}>{p}</span></span>
  ));
}

// The verse with its word lifted out in gold on the second reading.
function WordLit({ text, word }) {
  if (!word) return text;
  const re = new RegExp(`\\b(${word}\\w*)`, 'i');
  const m = text.match(re);
  if (!m) return text;
  const at = m.index;
  return <>{text.slice(0, at)}<span className="lit">{m[1]}</span>{text.slice(at + m[1].length)}</>;
}

// The breath: a ring that swells for four seconds and settles for six,
// with the two halves of the week's breath prayer.
function Breath({ words }) {
  const [inBreath, setIn] = useState(true);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let alive = true;
    let t;
    const cycle = (isIn) => {
      if (!alive) return;
      setIn(isIn);
      t = setTimeout(() => cycle(!isIn), isIn ? 4000 : 6000);
    };
    cycle(true);
    return () => { alive = false; clearTimeout(t); };
  }, []);
  return (
    <div className="breath" aria-label={`${words[0]}, ${words[1]}`}>
      <span className={'breath-ring' + (inBreath ? ' is-in' : '')} aria-hidden="true" />
      <p className="breath-words">
        <span className={inBreath ? 'is-on' : ''}>{words[0]}</span>
        <span className={!inBreath ? 'is-on' : ''}>{words[1]}</span>
      </p>
    </div>
  );
}

// Sunday: the week's verse, said together from memory. First letters
// are stepping stones; the verse can be shown if it's needed.
function HeartVerse({ verse, done, onHeart }) {
  const [show, setShow] = useState(false);
  const [said, setSaid] = useState(done);
  const stones = verse.verse.split(/\s+/).map((w) => {
    const m = w.match(/^([^\p{L}]*)(\p{L})([\p{L}’']*)([^\p{L}]*)$/u);
    return m ? { pre: m[1], first: m[2], rest: m[3], post: m[4] } : { pre: w, first: '', rest: '', post: '' };
  });
  return (
    <div className="verse-step heart-step">
      <p className="label">This week’s verse, together</p>
      <p className="room-sub">Say it out loud, from memory if you can.</p>
      <blockquote className="scripture stones" aria-label={verse.verse}>
        {stones.map((s, i) => (
          <span key={i} className="stone-word">
            {s.pre}{s.first}<span className={show ? 'rest is-shown' : 'rest'}>{s.rest}</span>{s.post}
          </span>
        ))}
      </blockquote>
      <p className="scripture-ref">{verse.ref}</p>
      <div className="heart-actions">
        <button className="btn btn-quiet" onClick={() => setShow((v) => !v)}>{show ? 'Hide the words' : 'Show the words'}</button>
        <button
          className={'btn ' + (said ? 'btn-said' : 'btn-secondary')}
          onClick={() => { if (!said) { setSaid(true); onHeart(); } }}
          aria-pressed={said}
        >
          {said ? 'Said by heart. A lotus opens.' : 'We said it by heart'}
        </button>
      </div>
    </div>
  );
}

// Sunday: the week, looked back on: its word, and who was held each day.
function WeekLook({ day }) {
  return (
    <div className="week-step">
      <p className="label">This week</p>
      <h1 className="room-title"><span className="gold">{day.verse.word}</span></h1>
      <p className="room-sub">{day.verse.ref}</p>
      <ul className="week-days">
        {day.rota.slice(0, 6).map((ids, k) => (
          <li key={k}>
            <span className="week-day">{WEEKDAYS_SHORT[k]}</span>
            <span>{andNames(peopleOf(day.household, ids), true)}</span>
          </li>
        ))}
      </ul>
      <p className="room-sub">Next week’s prayer is a surprise. It arrives on Monday morning.</p>
    </div>
  );
}
