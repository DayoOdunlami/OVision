import { useEffect, useMemo, useRef, useState } from 'react';
import { home } from '../route.js';
import { getDevice } from '../store.js';
import { peopleOf, isChild, callName, andNames, KOI } from '../household.js';
import { CloseButton, Dots, Faces, tick } from '../ui.jsx';
import DeepScene from './DeepScene.jsx';
import './deep.css';

// ═══════════════════════════════════════════════════════════════════
// Into the deep — confession, and letting God carry it.
//
// "You will again have compassion on us; you will tread our sins
//  underfoot and hurl all our iniquities into the depths of the sea."
//  Micah 7:19
//
// For a grown-up (the client found that dragging stones didn't make him
// reflect, so here the reflecting comes first and the gesture last):
//   ask for light → look back over the day → silence → name it to God →
//   one stone, from an open hand → assurance → one thing to put right.
//
// With children, led by a grown-up: a gentle question, then each child
// throws one thing into the pond: a stone (sorry) or a flower (thank
// you), so no one has to find something to confess. The assurance is
// read aloud; then, is there someone to say sorry to?
//
// Nothing is typed. Nothing is stored. God is the one who acts.
// ═══════════════════════════════════════════════════════════════════

const PSALM_139 = 'Search me, God, and know my heart; test me and know my anxious thoughts. See if there is any offensive way in me, and lead me in the way everlasting.';
const MICAH = 'You will again have compassion on us; you will tread our sins underfoot and hurl all our iniquities into the depths of the sea.';
const JOHN = 'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.';

export default function Deep({ day, query }) {
  const initial = useMemo(() => {
    const want = (query.who || '').toLowerCase().split(',').filter(Boolean);
    if (want.length) {
      const ids = day.people.filter((p) => want.includes(p.id) || want.includes(p.name.toLowerCase())).map((p) => p.id);
      if (ids.length) return ids;
    }
    const last = (getDevice().lastWho?.[day.part] || []).filter((id) => day.people.some((p) => p.id === id));
    return last.length ? last : null;
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps
  const [who, setWho] = useState(initial);
  const [choosing, setChoosing] = useState(!initial);
  const [sel, setSel] = useState(initial || []);

  const present = peopleOf(day.household, who || []);
  const children = present.filter(isChild);

  return (
    <div className={'room deep' + (day.light === 'night' ? ' is-night' : '')} role="dialog" aria-modal="true" aria-label="Into the deep">
      <DeepSceneHost day={day} present={present} />
      {choosing ? (
        <>
          <div className="room-top"><span /><CloseButton onClick={home} /></div>
          <div className="room-body deep-card">
            <p className="label">Into the deep</p>
            <h1 className="room-title">Who’s here?</h1>
            <Faces
              people={day.people}
              selected={sel}
              big
              onToggle={(id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
            />
          </div>
          <div className="room-foot">
            <span />
            <button className="btn btn-primary btn-big" disabled={!sel.length} onClick={() => { setWho(sel); setChoosing(false); }}>Begin</button>
          </div>
        </>
      ) : children.length ? (
        <Together key={who.join()} day={day} kids={children} grownUp={present.some((p) => !isChild(p))} onChange={() => setChoosing(true)} />
      ) : (
        <Alone key={who.join()} day={day} onChange={() => setChoosing(true)} present={present} />
      )}
    </div>
  );
}

// The scene sits behind the cards for the whole visit, so moving on
// never cuts the water off.
let sceneApi = null;
function DeepSceneHost({ day, present }) {
  return <DeepScene light={day.light} koi={(present.length ? present : day.people).slice(0, 4).map((p) => p.koi)} onReady={(api) => { sceneApi = api; }} />;
}

// ── A grown-up, alone ───────────────────────────────────────────────
function Alone({ day, present, onChange }) {
  const [i, setI] = useState(0);
  const [dropped, setDropped] = useState(false);
  const [sunk, setSunk] = useState(false);
  const stoneRef = useRef(null);
  const steps = ['light', 'look', 'still', 'name', 'stone', 'grace', 'repair'];
  const step = steps[i];
  const next = () => setI((n) => Math.min(steps.length - 1, n + 1));
  const others = day.forPeople.length ? andNames(day.forPeople) : 'the people around you';

  const open = () => {
    if (dropped) return;
    const r = stoneRef.current?.getBoundingClientRect();
    setDropped(true);
    sceneApi?.launch({ kind: 'stone', x: r ? r.left + r.width / 2 : window.innerWidth / 2, y: r ? r.top + r.height / 2 : window.innerHeight * 0.6, drop: true, onSunk: () => setSunk(true) });
  };

  return (
    <>
      <div className="room-top">
        <Dots count={steps.length} at={i} />
        <CloseButton onClick={home} />
      </div>
      <div className={'room-body deep-card step-' + step} key={i}>
        {i === 0 && (
          <button className="who-chip" onClick={onChange}>
            {andNames(present)} <span className="who-chip-change">· change</span>
          </button>
        )}
        {step === 'light' && (
          <>
            <p className="label">Ask for light</p>
            <blockquote className="scripture">{PSALM_139}</blockquote>
            <p className="scripture-ref">Psalm 139:23–24</p>
          </>
        )}
        {step === 'look' && (
          <>
            <p className="label">Look back over the day</p>
            <ul className="look">
              <li>Where did I not love {others}, or the others in this house?</li>
              <li>What did I do, or leave undone?</li>
              <li>What am I carrying that was never mine to carry?</li>
            </ul>
            <p className="room-sub">Take your time. Let one thing come.</p>
          </>
        )}
        {step === 'still' && (
          <>
            <p className="label">Be still</p>
            <p className="prayer">Let it come. There is no hurry here.</p>
          </>
        )}
        {step === 'name' && (
          <>
            <p className="label">Name it</p>
            <p className="prayer">Tell God what it is, in your own words.</p>
            <p className="room-sub">Nothing here is written down.</p>
          </>
        )}
        {step === 'stone' && (
          <>
            <p className="label">{dropped ? 'He casts it into the depths' : 'Open your hand'}</p>
            {!dropped && <p className="prayer">When you are ready, let it go to him.</p>}
            {sunk && (
              <>
                <blockquote className="scripture">{MICAH}</blockquote>
                <p className="scripture-ref">Micah 7:19</p>
              </>
            )}
          </>
        )}
        {step === 'grace' && (
          <>
            <p className="label">This is true</p>
            <blockquote className="scripture">{JOHN}</blockquote>
            <p className="scripture-ref">1 John 1:9</p>
            <p className="room-sub">It is gone. You are forgiven.</p>
          </>
        )}
        {step === 'repair' && (
          <>
            <p className="label">One small thing</p>
            <p className="prayer">Is there anything to put right today, or anyone to speak to?</p>
          </>
        )}
      </div>
      {step === 'stone' && !dropped && (
        <div className="held-stone" ref={stoneRef}>
          <StoneSvg />
        </div>
      )}
      <div className="room-foot">
        <span />
        {step === 'still' ? (
          <Quiet seconds={30} onDone={next} />
        ) : step === 'stone' ? (
          !dropped ? <button className="btn btn-primary btn-big" onClick={open}>Open your hand</button>
            : sunk ? <button className="btn btn-primary btn-big" onClick={next}>Next</button> : <span />
        ) : step === 'repair' ? (
          <button className="btn btn-primary btn-big" onClick={() => { tick(14); home(); }}>Amen</button>
        ) : (
          <button className="btn btn-primary btn-big" onClick={next}>{step === 'name' ? 'I have' : step === 'light' ? 'Begin' : 'Next'}</button>
        )}
      </div>
    </>
  );
}

function Quiet({ seconds, onDone }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const id = setTimeout(() => setReady(true), seconds * 1000); return () => clearTimeout(id); }, [seconds]);
  return (
    <div className="stillness">
      {!ready && <span className="stillness-ring" style={{ '--secs': `${seconds}s` }} aria-label="A moment of quiet" />}
      <button className={'btn btn-big ' + (ready ? 'btn-primary' : 'btn-quiet')} onClick={onDone}>{ready ? 'Next' : 'Skip the quiet'}</button>
    </div>
  );
}

// ── With children ───────────────────────────────────────────────────
function Together({ day, kids, grownUp, onChange }) {
  const reads = grownUp ? 'A grown-up reads this out loud' : 'Read this out loud together';
  const [i, setI] = useState(0);
  const [thrown, setThrown] = useState({});       // id → 'stone' | 'flower'
  const steps = ['begin', 'ask', 'throw', 'grace', 'sorry'];
  const step = steps[i];
  const next = () => setI((n) => Math.min(steps.length - 1, n + 1));
  const anyThrown = kids.some((c) => thrown[c.id]);

  return (
    <>
      <div className="room-top">
        <Dots count={steps.length} at={i} />
        <CloseButton onClick={home} />
      </div>
      <div className={'room-body deep-card kids step-' + step} key={i}>
        {i === 0 && (
          <button className="who-chip" onClick={onChange}>
            {andNames(kids, true)} <span className="who-chip-change">· change</span>
          </button>
        )}
        {step === 'begin' && (
          <>
            <p className="label">{reads}</p>
            <p className="prayer">Let’s be still. God loves us very much. He wants us to be honest with him.</p>
          </>
        )}
        {step === 'ask' && (
          <>
            <p className="label">{reads}</p>
            <p className="prayer">Was there a time today when you weren’t kind? Or something you wish you hadn’t done?</p>
            <p className="room-sub">Tell God in a whisper. You don’t have to say it out loud.</p>
          </>
        )}
        {step === 'throw' && (
          <>
            <p className="prayer short">A stone says sorry. A flower says thank you.</p>
            <p className="room-sub">Choose one. Throw it in the pond.</p>
          </>
        )}
        {step === 'grace' && (
          <>
            <p className="label">{reads}</p>
            <p className="prayer">Jesus has carried it all away. It’s gone, deep in the sea.</p>
            <blockquote className="scripture small">{JOHN}</blockquote>
            <p className="scripture-ref">1 John 1:9</p>
          </>
        )}
        {step === 'sorry' && (
          <>
            <p className="prayer">Is there someone to say sorry to?</p>
            <p className="room-sub">Go and say it, gently.</p>
          </>
        )}
      </div>

      {step === 'throw' && (
        <Bank kids={kids} thrown={thrown} onThrow={(id, kind) => setThrown((t) => ({ ...t, [id]: kind }))} />
      )}

      <div className="room-foot">
        <span />
        {step === 'sorry' ? (
          <button className="btn btn-primary btn-big" onClick={() => { tick(14); home(); }}>Amen</button>
        ) : (
          <button className="btn btn-primary btn-big" onClick={next} disabled={step === 'throw' && !anyThrown}>
            {step === 'begin' ? 'Begin' : 'Next'}
          </button>
        )}
      </div>
    </>
  );
}

// The bank of the pond: each child's stone and flower, in their colour.
// Drag one up and let go to throw it (a quick flick throws further), or
// just tap it.
function Bank({ kids, thrown, onThrow }) {
  return (
    <div className="bank" data-no-feed>
      {kids.map((c) => (
        <div key={c.id} className={'bank-spot' + (thrown[c.id] ? ' is-done' : '')} style={{ '--koi': KOI[c.koi]?.turn }}>
          <span className="bank-name">{callName(c, true)}</span>
          <div className="bank-things">
            {thrown[c.id] ? (
              <span className="bank-thanks">{thrown[c.id] === 'stone' ? 'Gone.' : 'Thank you.'}</span>
            ) : (
              <>
                <Throwable kind="stone" label={`${callName(c, true)}: a stone, for sorry`} onThrow={() => onThrow(c.id, 'stone')} />
                <Throwable kind="flower" label={`${callName(c, true)}: a flower, for thank you`} onThrow={() => onThrow(c.id, 'flower')} />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Throwable({ kind, label, onThrow }) {
  const ref = useRef(null);
  const drag = useRef(null);

  const down = (e) => {
    e.preventDefault();
    try { ref.current.setPointerCapture(e.pointerId); } catch {}
    const r = ref.current.getBoundingClientRect();
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, cx: r.left + r.width / 2, cy: r.top + r.height / 2, last: [{ x: e.clientX, y: e.clientY, t: performance.now() }] };
    ref.current.classList.add('is-held');
  };
  const move = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    d.last.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (d.last.length > 6) d.last.shift();
    ref.current.style.transform = `translate(${e.clientX - d.x0}px, ${e.clientY - d.y0}px) scale(1.08)`;
  };
  const up = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    ref.current.classList.remove('is-held');
    const a = d.last[0];
    const b = d.last[d.last.length - 1];
    const dt = Math.max(16, b.t - a.t);
    let vx = ((b.x - a.x) / dt) * 16;
    let vy = ((b.y - a.y) / dt) * 16;
    const moved = Math.hypot(e.clientX - d.x0, e.clientY - d.y0);
    if (moved < 10) {
      // A tap: a gentle lob towards open water.
      vx = (Math.random() - 0.5) * 6;
      vy = -16 - Math.random() * 6;
    } else if (vy > -4 && e.clientY > d.y0 - 40) {
      // Not thrown: settle back on the bank.
      ref.current.style.transform = '';
      return;
    }
    ref.current.style.visibility = 'hidden';
    sceneApi?.launch({ kind, x: d.cx + (e.clientX - d.x0), y: d.cy + (e.clientY - d.y0), vx, vy: Math.min(vy, -10) });
    onThrow();
  };

  return (
    <button
      ref={ref}
      className={'throwable ' + kind}
      aria-label={label}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const r = ref.current.getBoundingClientRect();
          ref.current.style.visibility = 'hidden';
          sceneApi?.launch({ kind, x: r.left + r.width / 2, y: r.top, vx: 0, vy: -18 });
          onThrow();
        }
      }}
    >
      {kind === 'stone' ? <StoneSvg /> : <FlowerSvg />}
    </button>
  );
}

export function StoneSvg() {
  return (
    <svg viewBox="0 0 80 56" width="80" height="56" aria-hidden="true">
      <defs>
        <radialGradient id="stoneG" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#b9b2a6" />
          <stop offset="0.55" stopColor="#857d70" />
          <stop offset="1" stopColor="#4d473f" />
        </radialGradient>
      </defs>
      <ellipse cx="41" cy="50" rx="30" ry="5" fill="rgba(0,0,0,0.25)" />
      <path d="M10 30 C10 14 26 7 42 8 C60 9 72 18 71 31 C70 44 56 49 40 49 C22 49 10 43 10 30 Z" fill="url(#stoneG)" />
      <path d="M20 18 C28 12 40 11 50 13" stroke="rgba(255,255,255,0.35)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function FlowerSvg() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
      <ellipse cx="33" cy="58" rx="20" ry="4" fill="rgba(0,0,0,0.2)" />
      {Array.from({ length: 8 }, (_, k) => (
        <ellipse key={k} cx="32" cy="17" rx="7" ry="14" fill="#fbf4ea" stroke="rgba(150,120,90,0.35)" strokeWidth="0.8" transform={`rotate(${k * 45} 32 31)`} />
      ))}
      <circle cx="32" cy="31" r="7.5" fill="#e8b84a" />
      <circle cx="30" cy="29" r="2.5" fill="#f6d77e" />
    </svg>
  );
}
