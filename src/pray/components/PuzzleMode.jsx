import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Matter from 'matter-js';
import { useEscape, useBodyLock } from './bits.jsx';
import { buildPuzzle, PUZZLE_MODES, readPuzzleMode, writePuzzleMode } from '../lib/puzzle.js';
import { celebrationEffects } from '../lib/state.js';

// ═══════════════════════════════════════════════════════════════════
// PuzzleMode — the verse falls apart; you put it back together.
//
// A round, per verse:
//   1. READ    the whole verse is shown. Read it through.
//   2. FALL    tap "Let them fall" — the chosen words tumble out of the
//              verse into a pile at the bottom, leaving empty slots.
//   3. REBUILD drag a word up to the glowing slot (or just tap it). The
//              right word snaps home; a wrong one drops back with a
//              small bounce. No score, no buzzer.
//
// Only the *next* slot is live, so rebuilding is recitation in order —
// the way you'd actually say it — rather than a jigsaw.
//
// Physics: matter-js, based on the React Bits FallingText idea but not
// copied. That component calls Runner.run(engine) *and* Engine.update()
// in its own rAF loop, so the world steps twice per frame (double
// speed, double CPU), and it runs a canvas renderer that only draws
// invisible bodies. Here: one fixed-timestep loop, no renderer, DOM
// transforms only, and bodies sleep once the pile settles.
//
// Dragging is custom rather than matter's MouseConstraint: a held word
// follows the finger exactly (MouseConstraint is a spring, which feels
// floaty when you're trying to place something precisely) and we need
// the pointer position anyway to test the slot.
// ═══════════════════════════════════════════════════════════════════

export default function PuzzleMode({ day, celebrate = 'recommended', onClose, onAmen }) {
  const [round, setRound] = useState(0);
  const [mode, setModeRaw] = useState(() => readPuzzleMode());
  const [complete, setComplete] = useState(false);
  const [done, setDone] = useState(false);
  const [left, setLeft] = useState(null);
  const hintRef = useRef(null);
  // The koi lives here, at the level of the whole puzzle, not inside a
  // verse. It used to belong to the verse, so tapping "Next verse" or
  // "Amen" unmounted it — usually before it had even swum into view.
  // Now it keeps swimming across whatever comes next.
  const [koi, setKoi] = useState(null);          // { id, people, stay } | null
  const koiIdRef = useRef(0);
  const releaseKoi = ({ people, stay }) => {
    koiIdRef.current += 1;
    setKoi({ id: koiIdRef.current, people, stay });
  };
  const koiGone = () => setKoi(null);

  useEscape(true, onClose);
  useBodyLock(true);

  const steps = day.steps;
  const last = round === steps.length - 1;
  const who = day.who.b ? `${day.who.a} & ${day.who.b}` : day.who.a;

  const setMode = (m) => {
    setModeRaw(m);
    writePuzzleMode(m);
    setComplete(false);
  };
  const nextRound = () => {
    setRound((r) => r + 1);
    setComplete(false);
  };
  // Amen records the prayer and shows the Amen card, which stays until
  // you tap Done — nothing closes on its own, so the koi can stay too.
  const amen = () => {
    setDone(true);
    onAmen();
  };

  return (
    <div className="overlay puzzle" role="dialog" aria-modal="true" aria-label="Verse puzzle">
      {koi && <KoiSchool key={koi.id} people={koi.people} stay={koi.stay} onGone={koiGone} />}
      <div className="overlay-top">
        <div className="pz-head">
          <div className="pz-who">{who}</div>
          <div className="pz-progress">
            Verse {round + 1} of {steps.length}
          </div>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close">&times;</button>
      </div>

      <div className="pz-modes seg" role="radiogroup" aria-label="How the verse falls apart">
        {PUZZLE_MODES.map((m) => (
          <button
            key={m.value}
            role="radio"
            aria-checked={mode === m.value}
            className={'seg-opt' + (mode === m.value ? ' is-active' : '')}
            onClick={() => setMode(m.value)}
            disabled={done}
          >
            {m.label}
          </button>
        ))}
      </div>

      {done ? (
        <div className="pace-body">
          <div className="pace-done">
            <div className="pace-done-mark">&#10003;</div>
            <div className="pace-done-text">Amen.</div>
            <div className="pace-done-sub">Marked for today</div>
            {koi?.stay && <p className="pace-done-hint">Stay as long as you like.</p>}
            <button className="btn btn-primary pace-done-btn" onClick={onClose} autoFocus>
              Done
            </button>
          </div>
        </div>
      ) : (
        <Round
          // A new verse or a new mode is a fresh round: new world, new
          // pieces, nothing carried over.
          key={`${round}:${mode}`}
          html={steps[round].html}
          mode={mode}
          effects={celebrationEffects(celebrate, last)}
          people={day.people || []}
          passage={day.isSunday ? day.title : day.prayer.ref}
          hintRef={hintRef}
          onComplete={() => setComplete(true)}
          onKoi={releaseKoi}
          onLeft={setLeft}
        />
      )}

      {!done && (
        <div className="overlay-foot">
          {complete ? (
            last ? (
              <button className="btn btn-primary" onClick={amen}>Amen</button>
            ) : (
              <button className="btn btn-primary" onClick={nextRound}>Next verse</button>
            )
          ) : (
            left != null && (
              <>
                <span className="pz-left">{left} to go</span>
                <button className="btn btn-ghost" onClick={() => hintRef.current?.()}>Hint</button>
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── One verse ───────────────────────────────────────────────────────
function Round({ html, mode, effects, people, passage, hintRef, onComplete, onKoi, onLeft }) {
  const puzzle = useMemo(() => buildPuzzle(html, mode), [html, mode]);
  const { tokens, slots, slotAt, covered } = puzzle;

  const [phase, setPhase] = useState('reading');       // reading | playing | complete
  const [filled, setFilled] = useState(() => new Set());
  const [hover, setHover] = useState(null);             // null | 'ok' | 'no'
  const [rejectAt, setRejectAt] = useState(-1);         // slot that just refused a word

  const stageRef = useRef(null);
  const verseRef = useRef(null);
  const slotRefs = useRef([]);
  const pieceRefs = useRef([]);
  // Mirrors of state for the imperative physics/pointer code, which
  // must see the latest values synchronously (two quick drops must not
  // both land in the same slot while React is mid-render).
  const filledRef = useRef(new Set());
  const hoverRef = useRef(null);
  // Keyboard path: focus a piece, press Enter/Space to try it in the
  // live slot. Set by the physics effect, which owns the bodies.
  const tryPlaceRef = useRef(null);
  // The slot filled last: where the completion ripple starts from.
  const lastSlotRef = useRef(0);
  // Completion effects in play: { ripple, sweep, gather, koi, still }
  const [fx, setFx] = useState(null);

  const liveOf = (set) => {
    for (let i = 0; i < slots.length; i++) if (!set.has(i)) return i;
    return -1;
  };
  const live = liveOf(filled);

  useEffect(() => {
    onLeft(phase === 'playing' ? slots.length - filled.size : null);
  }, [phase, filled, slots.length, onLeft]);

  // ── Size the words to the screen ───────────────────────────────────
  // The largest type at which the verse *and* the pile it will become
  // both fit in the play area. Both grow with the square of the type
  // size, so this is a short binary search over real DOM measurements
  // (verse height, and the summed area of every tile). Tiles share the
  // same size, so a word looks identical in the pile and in its slot.
  //
  // Runs while reading, and again if the screen changes size before the
  // words fall. Once they've fallen the size is fixed — the physics
  // bodies are built at it.
  useLayoutEffect(() => {
    if (phase !== 'reading') return;
    const stage = stageRef.current;
    const verse = verseRef.current;
    if (!stage || !verse) return;

    const fit = () => {
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      if (!W || !H) return;
      const tiles = pieceRefs.current.filter(Boolean);
      let lo = 17;
      let hi = W < 520 ? 34 : 48;
      let best = lo;
      for (let n = 0; n < 9; n++) {
        const f = (lo + hi) / 2;
        stage.style.setProperty('--pz-size', `${f}px`);
        const verseH = verse.offsetHeight;
        let area = 0;
        for (const t of tiles) area += (t.offsetWidth + 6) * (t.offsetHeight + 4);
        // A tumbled pile of flat tiles packs at roughly two-thirds.
        const pileH = area / (W * 0.66);
        if (verseH + pileH + 28 <= H) { best = f; lo = f; } else { hi = f; }
      }
      stage.style.setProperty('--pz-size', `${best}px`);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [phase, puzzle]);

  // ── Celebrate a finished verse ────────────────────────────────────────
  // Which effects play is decided upstream (celebrationEffects): the
  // Balanced default gives each verse a ripple and a gold sweep and the
  // whole prayer a gather and a passing koi; Quiet and Grand use one
  // pair for both. Reduced motion gets none of it: the verse just turns
  // gold.
  useEffect(() => {
    if (phase !== 'complete') return;
    const stage = stageRef.current;
    const verse = verseRef.current;
    if (!stage || !verse) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setFx({ still: true });
      return;
    }
    const next = {};
    if (effects.includes('ripple')) {
      const el = slotRefs.current[lastSlotRef.current];
      if (el) {
        const r = el.getBoundingClientRect();
        const st = stage.getBoundingClientRect();
        next.ripple = { x: r.left - st.left + r.width / 2, y: r.top - st.top + r.height / 2 };
      }
    }
    if (effects.includes('sweep')) next.sweep = true;
    if (effects.includes('gather')) {
      // Ease the finished verse down to sit centred in the play area,
      // leaving room for the reference that fades in beneath it.
      const dy = (stage.clientHeight - verse.offsetHeight) / 2 - verse.offsetTop - 24;
      next.gather = Math.max(0, Math.round(dy));
    }
    if (effects.includes('koi') && people.length) {
      // Mid-prayer: one of them swims across and away.
      onKoi({ people: [people[Math.floor(Math.random() * people.length)]], stay: false });
    }
    if (effects.includes('school') && people.length) {
      // End of the prayer: everyone prayed for comes in, and stays.
      onKoi({ people, stay: true });
    }
    setFx(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── The physics world. Built the moment the words are let fall. ────
  // useLayoutEffect so the pieces are positioned over their slots
  // before the first paint — otherwise they'd flash at the top-left.
  useLayoutEffect(() => {
    if (phase !== 'playing') return;
    const stage = stageRef.current;
    if (!stage) return;
    if (slots.length === 0) {
      // Nothing to rebuild (a verse that's all names/punctuation).
      setPhase('complete');
      onComplete();
      return;
    }

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const { Engine, Bodies, Body, Composite, Sleeping } = Matter;

    const engine = Engine.create({ enableSleeping: true });
    engine.gravity.y = reduced ? 0 : 1;

    let W = stage.clientWidth;
    let H = stage.clientHeight;
    const T = 80;
    const floor   = Bodies.rectangle(W / 2, H + T / 2, W * 4, T, { isStatic: true });
    const leftW   = Bodies.rectangle(-T / 2, H / 2, T, H * 4, { isStatic: true });
    const rightW  = Bodies.rectangle(W + T / 2, H / 2, T, H * 4, { isStatic: true });
    const ceiling = Bodies.rectangle(W / 2, -T / 2 - 200, W * 4, T, { isStatic: true });
    Composite.add(engine.world, [floor, leftW, rightW, ceiling]);

    const toStage = (clientX, clientY) => {
      const r = stage.getBoundingClientRect();
      return { x: clientX - r.left, y: clientY - r.top };
    };
    const slotCentre = (i) => {
      const el = slotRefs.current[i];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
    };

    // One body per piece, starting exactly where its word sat in the
    // verse — so it visibly falls *out of* the text.
    const items = slots.map((slot, k) => {
      const el = pieceRefs.current[k];
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const c = slotCentre(k) || { x: W / 2, y: 40 };
      const body = Bodies.rectangle(c.x, c.y, w, h, {
        chamfer: { radius: Math.min(h / 2, 16) },
        restitution: 0.22,
        friction: 0.6,
        frictionAir: 0.022,
        density: 0.0016,
        sleepThreshold: 40,
      });
      // Tiles are words: they have to stay readable. Raising the
      // moment of inertia makes them turn lazily, and the loop below
      // caps the tilt, so they still tumble but never land upside down.
      Body.setInertia(body, body.inertia * 4);
      if (!reduced) {
        Body.setVelocity(body, { x: (Math.random() - 0.5) * 4, y: -Math.random() * 2.5 });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);
      }
      return { k, el, body, w, h, text: slot.text, placed: false, busy: false, home: null };
    });

    // Reduced motion: nothing falls. Pieces are laid out in rows along
    // the bottom and stay put unless you move them.
    if (reduced) {
      let x = 12;
      let y = H - 14;
      let rowH = 0;
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      for (const it of shuffled) {
        if (x + it.w > W - 12) { x = 12; y -= rowH + 10; rowH = 0; }
        rowH = Math.max(rowH, it.h);
        it.home = { x: x + it.w / 2, y: y - it.h / 2 };
        Body.setPosition(it.body, it.home);
        Body.setStatic(it.body, true);
        x += it.w + 10;
      }
    }

    Composite.add(engine.world, items.map((it) => it.body));

    const draw = (it) => {
      const { x, y } = it.body.position;
      it.el.style.transform =
        `translate3d(${(x - it.w / 2).toFixed(1)}px, ${(y - it.h / 2).toFixed(1)}px, 0) rotate(${it.body.angle.toFixed(4)}rad)`;
    };
    items.forEach(draw);

    // ── Loop: fixed 60Hz steps, whatever the display rate ─────────────
    // A 120Hz iPad would otherwise run the physics at double speed.
    const STEP = 1000 / 60;
    const MAX_TILT = 0.42;   // ≈24° — tilted enough to feel tumbled, still readable
    let acc = 0;
    let lastT = performance.now();
    let raf = 0;
    const tick = (now) => {
      acc += Math.min(100, now - lastT);
      lastT = now;
      let n = 0;
      while (acc >= STEP && n < 4) {
        Engine.update(engine, STEP);
        for (const it of items) {
          const b = it.body;
          if (it.placed || it.busy || b.isStatic) continue;
          if (b.angle > MAX_TILT || b.angle < -MAX_TILT) {
            Body.setAngle(b, Math.sign(b.angle) * MAX_TILT);
            Body.setAngularVelocity(b, 0);
          }
        }
        acc -= STEP;
        n++;
      }
      for (const it of items) {
        if (it.placed || it.busy) continue;
        // A sleeping body hasn't moved; skip the DOM write.
        if (it.body.isSleeping && it.drawnAsleep) continue;
        draw(it);
        it.drawnAsleep = it.body.isSleeping;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // A settled pile is asleep, and a sleeping body ignores the world
    // changing around it — so pulling a word out from under others left
    // them hanging in mid-air. Anything that removes or moves a tile
    // wakes the pile so it resettles into the gap.
    const wakeAll = () => {
      if (reduced) return;
      for (const x of items) {
        if (!x.placed && !x.busy && !x.body.isStatic) Sleeping.set(x.body, false);
      }
    };

    const liveIdx = () => liveOf(filledRef.current);
    const matches = (it) => {
      const i = liveIdx();
      return i >= 0 && slots[i].text === it.text;
    };
    // Generous hit area: a finger covers the slot you're aiming at.
    const overLive = (p) => {
      const i = liveIdx();
      const el = slotRefs.current[i];
      if (i < 0 || !el) return false;
      const r = el.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      const pad = 34;
      return (
        p.x > r.left - s.left - pad && p.x < r.right - s.left + pad &&
        p.y > r.top - s.top - pad && p.y < r.bottom - s.top + pad
      );
    };
    const setHoverOnce = (v) => {
      if (hoverRef.current !== v) {
        hoverRef.current = v;
        setHover(v);
      }
    };

    // ── Snap a piece home ─────────────────────────────────────────────
    const place = (it) => {
      const i = liveIdx();
      const c = slotCentre(i);
      if (i < 0 || !c) return;
      // Claim the slot synchronously, before React re-renders.
      filledRef.current = new Set(filledRef.current).add(i);
      lastSlotRef.current = i;
      it.busy = true;
      Composite.remove(engine.world, it.body);
      wakeAll();
      it.el.classList.add('is-placing');
      it.el.style.transform =
        `translate3d(${(c.x - it.w / 2).toFixed(1)}px, ${(c.y - it.h / 2).toFixed(1)}px, 0) rotate(0rad)`;
      setTimeout(() => {
        it.placed = true;
        it.el.style.visibility = 'hidden';
        setFilled(new Set(filledRef.current));
        if (filledRef.current.size === slots.length) {
          setPhase('complete');
          onComplete();
        }
      }, 300);
    };

    const release = (it, vx, vy) => {
      it.body.isSensor = false;
      if (reduced) {
        Body.setPosition(it.body, it.home);
        draw(it);
        return;
      }
      Body.setStatic(it.body, false);
      const cap = 16;
      Body.setVelocity(it.body, {
        x: Math.max(-cap, Math.min(cap, vx)),
        y: Math.max(-cap, Math.min(cap, vy)),
      });
      Sleeping.set(it.body, false);
      wakeAll();
    };

    const refuse = () => {
      const i = liveIdx();
      setRejectAt(i);
      setTimeout(() => setRejectAt(-1), 450);
    };

    // ── Pointer: pick up, carry, drop or tap ──────────────────────────
    let drag = null;

    const onDown = (it) => (e) => {
      if (it.placed || it.busy || drag) return;
      e.preventDefault();
      // Capture keeps moves flowing to us if the finger outruns the
      // tile. Moves are also heard on window, so if capture is refused
      // (it throws for a pointer the browser no longer considers
      // active) the drag still works — don't let it abort the pickup.
      try { it.el.setPointerCapture?.(e.pointerId); } catch {}
      const p = toStage(e.clientX, e.clientY);
      // A held word is lifted *off* the pile, not dragged through it: a
      // sensor passes over other tiles instead of shoving them, so you
      // can't knock the next word you need out of reach while you aim.
      // The pile still reacts to the word *leaving* (wakeAll).
      Body.setStatic(it.body, true);
      it.body.isSensor = true;
      wakeAll();
      drag = {
        it,
        off: { x: p.x - it.body.position.x, y: p.y - it.body.position.y },
        start: { ...p, t: performance.now() },
        last: { ...p, t: performance.now() },
        vx: 0,
        vy: 0,
        moved: 0,
      };
      it.el.classList.add('is-held');
    };

    const onMove = (e) => {
      if (!drag) return;
      const p = toStage(e.clientX, e.clientY);
      const now = performance.now();
      const dt = Math.max(1, now - drag.last.t);
      // Velocity in px per physics step, smoothed, for a natural fling.
      drag.vx = drag.vx * 0.5 + ((p.x - drag.last.x) / dt) * STEP * 0.5;
      drag.vy = drag.vy * 0.5 + ((p.y - drag.last.y) / dt) * STEP * 0.5;
      drag.moved = Math.max(drag.moved, Math.hypot(p.x - drag.start.x, p.y - drag.start.y));
      drag.last = { ...p, t: now };
      const { it } = drag;
      Body.setPosition(it.body, { x: p.x - drag.off.x, y: p.y - drag.off.y });
      Body.setAngle(it.body, it.body.angle * 0.8);   // straighten while held
      draw(it);
      const over = overLive(p) || overLive(it.body.position);
      setHoverOnce(over ? (matches(it) ? 'ok' : 'no') : null);
    };

    const onUp = () => {
      if (!drag) return;
      const { it, vx, vy, moved, start, last } = drag;
      drag = null;
      it.el.classList.remove('is-held');
      setHoverOnce(null);

      const tap = moved < 8 && performance.now() - start.t < 380;
      const over = overLive(last) || overLive(it.body.position);

      if ((tap || over) && matches(it)) {
        place(it);
        return;
      }
      if (over) refuse();
      if (tap) {
        // Not this one — a little hop to say so.
        release(it, (Math.random() - 0.5) * 2, -5);
        return;
      }
      release(it, vx, vy);
    };

    const downHandlers = items.map((it) => {
      const h = onDown(it);
      it.el.addEventListener('pointerdown', h);
      return [it.el, h];
    });
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    // ── Hint: the right word glows and hops ───────────────────────────
    hintRef.current = () => {
      const i = liveIdx();
      if (i < 0) return;
      const it = items.find((x) => !x.placed && !x.busy && x.text === slots[i].text);
      if (!it) return;
      it.el.classList.remove('is-hint');
      void it.el.offsetWidth;   // restart the animation
      it.el.classList.add('is-hint');
      if (!reduced && !it.body.isStatic) {
        Sleeping.set(it.body, false);
        Body.setVelocity(it.body, { x: 0, y: -7 });
      }
    };

    tryPlaceRef.current = (k) => {
      const it = items[k];
      if (!it || it.placed || it.busy) return;
      if (matches(it)) place(it);
      else {
        refuse();
        if (!reduced && !it.body.isStatic) {
          Sleeping.set(it.body, false);
          Body.setVelocity(it.body, { x: 0, y: -5 });
        }
      }
    };

    // Keep the walls on the edges of the play area whenever *it*
    // changes size — not just the window. This was the cropping bug:
    // the floor was fixed where the stage ended at the moment the words
    // fell, and then the footer appeared and the stage got shorter, so
    // the bottom row rested below the visible edge. Tiles that end up
    // outside the new bounds are lifted back in.
    const onResize = () => {
      W = stage.clientWidth;
      H = stage.clientHeight;
      Body.setPosition(floor, { x: W / 2, y: H + T / 2 });
      Body.setPosition(rightW, { x: W + T / 2, y: H / 2 });
      Body.setPosition(leftW, { x: -T / 2, y: H / 2 });
      for (const it of items) {
        if (it.placed || it.busy) continue;
        const { x, y } = it.body.position;
        const nx = Math.min(Math.max(x, it.w / 2), W - it.w / 2);
        const ny = Math.min(y, H - it.h / 2);
        if (nx !== x || ny !== y) Body.setPosition(it.body, { x: nx, y: ny });
        if (reduced && it.home) {
          it.home = { x: Math.min(it.home.x, W - it.w / 2), y: Math.min(it.home.y, H - it.h / 2) };
        }
      }
      wakeAll();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(stage);

    return () => {
      cancelAnimationFrame(raf);
      downHandlers.forEach(([el, h]) => el.removeEventListener('pointerdown', h));
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      ro.disconnect();
      hintRef.current = null;
      tryPlaceRef.current = null;
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    };
    // Built once per round; `phase` flipping to 'playing' is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === 'playing']);

  const showAll = phase === 'reading';

  return (
    <div className="pz-stage" ref={stageRef}>
      <p
        ref={verseRef}
        className={
          'pz-verse' +
          (phase === 'complete' ? ' is-complete' : '') +
          (fx?.sweep ? ' fx-sweep' : '') +
          (fx?.gather != null ? ' fx-gather' : '') +
          (fx?.still ? ' fx-still' : '')
        }
        style={fx?.gather != null ? { transform: `translateY(${fx.gather}px)` } : undefined}
      >
        {tokens.map((t, i) => {
          if (covered.has(i)) return null;
          const sep = i > 0 ? ' ' : '';
          const k = slotAt.get(i);
          if (k !== undefined) {
            const isFilled = filled.has(k);
            const isLive = phase === 'playing' && k === live;
            return (
              <Fragment key={i}>
                {sep}
                <span
                  ref={(el) => { slotRefs.current[k] = el; }}
                  style={{ '--i': i }}
                  className={
                    'pz-slot' +
                    (isFilled ? ' is-filled' : '') +
                    (showAll ? ' is-reading' : '') +
                    (isLive ? ' is-live' : '') +
                    (isLive && hover ? ` is-hover-${hover}` : '') +
                    (rejectAt === k ? ' is-reject' : '')
                  }
                >
                  <span className="pz-slot-text">{slots[k].text}</span>
                </span>
              </Fragment>
            );
          }
          return (
            <Fragment key={i}>
              {sep}
              <span className={t.isName ? 'pz-name' : undefined} style={{ '--i': i }}>{t.text}</span>
            </Fragment>
          );
        })}
        {fx?.gather != null && <span className="pz-gather-ref">{passage}</span>}
      </p>

      {fx?.ripple && (
        <span className="pz-ripple" style={{ left: fx.ripple.x, top: fx.ripple.y }} aria-hidden="true">
          <i /><i /><i />
        </span>
      )}


      {phase === 'reading' && (
        <div className="pz-intro">
          <p className="pz-intro-text">
            Read it through. Then let {slots.length === 1 ? 'the word' : `${slots.length} words`} fall
            and put {slots.length === 1 ? 'it' : 'them'} back.
          </p>
          <button className="btn btn-primary" onClick={() => setPhase('playing')}>
            Let them fall
          </button>
        </div>
      )}

      {/* Pieces — positioned by the physics loop via transform, which
          React never sets, so re-renders don't fight it. */}
      <div className="pz-pieces">
        {slots.map((s, k) => (
          <div
            key={k}
            ref={(el) => { pieceRefs.current[k] = el; }}
            className="pz-piece"
            role="button"
            tabIndex={phase === 'playing' ? 0 : -1}
            aria-label={`Place “${s.text}”`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                tryPlaceRef.current?.(k);
              }
            }}
            style={phase === 'reading' ? { visibility: 'hidden' } : undefined}
          >
            {s.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Koi ───────────────────────────────────────────────────────────────
// The pond's own SpineFish, each in the variety that belongs to a person
// being prayed for, with their name riding above it. Two behaviours:
//
//   pass  one koi crosses once, left to right, and leaves (Grand mode,
//         after each verse but the last).
//   stay  the koi of everyone prayed for swim in and settle into the
//         space below the verse, wandering slowly until the puzzle is
//         closed. They answer a finger or cursor the way pond koi do:
//         curious ones come to it, shy ones scatter.
//
// Lives at the puzzle level (not inside a verse) on a canvas behind the
// whole overlay, so moving on — Next verse, Amen — never cuts it off.
// The fish code is loaded on demand.
//
// Steering: a fish chases its `target`. Entering, the target is kept a
// fixed distance ahead of the mouth; staying, each fish is given a
// resting point somewhere in the band below the verse, changed every
// few seconds.
function KoiSchool({ people, stay, onGone }) {
  const canvasRef = useRef(null);
  const [leaving, setLeaving] = useState(false);
  const goneRef = useRef(onGone);
  goneRef.current = onGone;

  useEffect(() => {
    let raf = 0;
    let dead = false;
    let leaveTimer = 0;
    let offPointer = () => {};

    (async () => {
      const [fishMod, link] = await Promise.all([
        import('../../SpineFish.js'),
        import('../../data/prayerLink.js'),
      ]);
      const canvas = canvasRef.current;
      if (dead || !canvas) return;
      const SpineFish = fishMod.default;
      const { buildPondMixFromCounts, ShadingMode } = fishMod;

      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (!W || !H) return;
      const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ShadingMode.current = 'symmetric';

      // Where the fish may be: below wherever the verse ends, above the
      // footer. Re-measured for the first couple of seconds, because the
      // verse may still be easing into its gathered position; kept as-is
      // once the verse is gone (Amen swaps it for the Amen card).
      const verseEl = canvas.parentElement?.querySelector('.pz-verse');
      const band = { top: H * 0.6, bottom: H - 110 };
      const measureBand = () => {
        if (!verseEl || !verseEl.isConnected) return;
        const bottom = verseEl.getBoundingClientRect().bottom - canvas.getBoundingClientRect().top;
        let top = Math.max(bottom + 50, H * 0.4);
        const floor = H - 110;
        // Too little room under a long verse: let them share the lower
        // half (they swim behind the text, so it stays readable).
        if (floor - top < 130) top = Math.max(H * 0.5, floor - 130);
        band.top = top;
        band.bottom = floor;
      };
      measureBand();
      const laneY = () => (band.top + band.bottom) / 2;

      const crowd = people.length;
      const size = Math.max(0.55, Math.min(1, W / 900)) * (crowd > 3 ? 0.8 : 1);
      const randIn = (a, b) => a + Math.random() * (b - a);

      const school = people.map((person, i) => {
        const variety = link.KOI_BY_PERSON[person] || 'kohaku';
        const [v] = buildPondMixFromCounts({ [variety]: 1 });
        const fish = new SpineFish(W, H, { ...v, sizeScale: (v.sizeScale || 1) * size });
        return {
          person,
          label: person.toUpperCase(),
          fish,
          // Each enters on its own line, and a little behind the one before.
          laneOffset: (i - (crowd - 1) / 2) * Math.min(34, 120 / Math.max(1, crowd)),
          entering: true,
          // Entrances are staggered in time, not lined up in space: a
          // fish placed further than ~110px off the left edge gets
          // wrapped round to the right by SpineFish.
          delay: i * 40,
          settleX: randIn(W * 0.2, W * 0.8),
          rest: null,
          restTimer: 0,
        };
      });

      const cur = { x: -9999, y: -9999 };
      const env = { food: [], onBreak: () => {} };
      let t = 0;

      const steer = (k) => {
        const f = k.fish;
        if (!f.target) return;
        if (!stay || k.entering) {
          f.target.x = f.mouth.x + 260;
          f.target.y = laneY() + k.laneOffset + Math.sin((t + k.laneOffset * 7) * 0.015) * 22;
          f.energy = stay ? 0.7 : 0.55 + 0.3 * ((Math.min(size, 1) - 0.55) / 0.45);
          f.isIdle = false;
          if (stay && f.mouth.x > k.settleX) k.entering = false;
          return;
        }
        // Staying: drift between resting points in the band. While a
        // fish is fleeing a finger, let the pond's own flee behaviour
        // run, but keep its escape inside the band: left unchecked,
        // shy fish darted up behind the verse a fifth of the time.
        if (f.fleeCooldown > 0) {
          f.target.y = Math.min(Math.max(f.target.y, band.top), band.bottom);
          return;
        }
        if (!k.rest || --k.restTimer <= 0 ||
            Math.hypot(f.mouth.x - k.rest.x, f.mouth.y - k.rest.y) < 40) {
          k.rest = { x: randIn(60, W - 60), y: randIn(band.top, band.bottom) };
          k.restTimer = 220 + Math.random() * 260;
        }
        f.target.x = k.rest.x;
        f.target.y = k.rest.y;
        f.isIdle = false;
        f.energy = Math.max(f.energy, 0.32);
      };

      // Pre-swim in a wide world so each fish is already facing right,
      // then place it at the left edge: the first with its head already
      // on screen, the rest just off it, waiting their turn.
      school.forEach((k, i) => {
        for (let n = 0; n < 150; n++) { steer(k); k.fish.update(W * 4, H, cur, env); t++; }
        const startX = i === 0 ? Math.min(70, W * 0.12) : -95;
        k.fish.shift(startX - k.fish.mouth.x, laneY() + k.laneOffset - k.fish.mouth.y);
        // The pre-swim carried it far to the right, which steer() reads
        // as "arrived"; it hasn't yet.
        k.entering = true;
      });
      t = 0;

      // A finger or cursor on the screen is felt by the fish (not while
      // they're still entering, so they arrive in formation).
      if (stay) {
        const onMove = (e) => {
          const r = canvas.getBoundingClientRect();
          cur.x = e.clientX - r.left;
          cur.y = e.clientY - r.top;
        };
        const onLeave = () => { cur.x = -9999; cur.y = -9999; };
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('pointerdown', onMove, { passive: true });
        window.addEventListener('pointerup', onLeave, { passive: true });
        window.addEventListener('pointercancel', onLeave, { passive: true });
        offPointer = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerdown', onMove);
          window.removeEventListener('pointerup', onLeave);
          window.removeEventListener('pointercancel', onLeave);
        };
      }

      const drawLabel = (k) => {
        const f = k.fish;
        ctx.save();
        ctx.font = '700 12px "Source Sans 3", system-ui, sans-serif';
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0.16em';
        const tw = ctx.measureText(k.label).width;
        const lx = f.head.x;
        const ly = f.head.y - 34 * size - 10;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = 'rgba(42, 34, 29, 0.72)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(lx - tw / 2 - 10, ly - 11, tw + 20, 22, 11);
        else ctx.rect(lx - tw / 2 - 10, ly - 11, tw + 20, 22);
        ctx.fill();
        ctx.fillStyle = '#FFF3DC';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(k.label, lx, ly + 0.5);
        ctx.restore();
      };

      const started = performance.now();
      const lastX = school.map((k) => k.fish.mouth.x);
      let frames = 0;

      const frame = () => {
        if (dead) return;
        if (frames < 130 && frames % 10 === 0) measureBand();
        frames++;
        t++;

        const pointer = stay && !school.some((k) => k.entering) ? cur : { x: -9999, y: -9999 };
        const active = school.filter((k) => frames > k.delay);
        for (const k of active) {
          steer(k);
          k.fish.update(W, H, pointer, env);
        }

        ctx.clearRect(0, 0, W, H);
        // Deeper fish first, as in the pond.
        [...active]
          .sort((a, b) => (b.fish.depth ?? 0.4) - (a.fish.depth ?? 0.4))
          .forEach((k) => k.fish.draw(ctx));
        active.forEach(drawLabel);

        if (!stay) {
          // Passing: done once every fish has crossed (or wrapped, or run long).
          const allOut = school.every((k, i) => {
            if (frames <= k.delay) return false;
            const x = k.fish.mouth.x;
            const wrapped = x < lastX[i] - W / 2;
            lastX[i] = x;
            return x > W + 80 || wrapped;
          });
          if (allOut || performance.now() - started > 12000) {
            setLeaving(true);
            leaveTimer = setTimeout(() => {
              ctx.clearRect(0, 0, W, H);
              goneRef.current?.();
            }, 600);
            return;
          }
        }
        raf = requestAnimationFrame(frame);
      };
      // First frame now, so the fish are there the instant the canvas is.
      frame();
    })();

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      clearTimeout(leaveTimer);
      offPointer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={'pz-koi' + (leaving ? ' is-leaving' : '')}
      aria-hidden="true"
    />
  );
}
