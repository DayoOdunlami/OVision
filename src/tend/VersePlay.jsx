import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Matter from 'matter-js';
import './verse-play.css';

// The verse is a single authored string shared with the reading surface.
// Names and personalised prayer text never enter this game.
export default function VersePlay({ verse, onClose, onComplete }) {
  const [attempt, setAttempt] = useState(0);
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const fitViewport = () => {
      // CSS text zoom and browser zoom expose different layout viewports.
      // Measure the actual scale so the controls stay inside the visible page.
      const scale = dialog.getBoundingClientRect().width / (dialog.offsetWidth || 1);
      const height = (window.visualViewport?.height || window.innerHeight) / (scale || 1);
      dialog.style.setProperty('--vp-height', `${height}px`);
    };
    fitViewport();
    const observer = new ResizeObserver(fitViewport);
    observer.observe(dialog);
    window.addEventListener('resize', fitViewport);
    window.visualViewport?.addEventListener('resize', fitViewport);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fitViewport);
      window.visualViewport?.removeEventListener('resize', fitViewport);
    };
  }, []);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
      }
      if (event.key !== 'Tab') return;
      const buttons = [...(dialogRef.current?.querySelectorAll('button:not(:disabled)') || [])]
        .filter((el) => el.tabIndex >= 0 && getComputedStyle(el).visibility !== 'hidden');
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <section className="verse-play" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="verse-play-title">
      <header className="vp-header">
        <div>
          <p className="vp-eyebrow">LEARN IT BY HEART</p>
          <h1 id="verse-play-title">Words to carry.</h1>
          <p className="vp-reference">{verse.ref} <span>· NIV</span></p>
        </div>
        <button className="vp-close" ref={closeRef} type="button" onClick={onClose} aria-label="Close verse game">×</button>
      </header>
      <VerseRound key={`${verse.id || verse.ref}:${attempt}`} verse={verse} onComplete={onComplete} onClose={onClose} onRestart={() => setAttempt((value) => value + 1)} />
    </section>
  );
}

function VerseRound({ verse, onComplete, onClose, onRestart }) {
  const words = useMemo(() => String(verse.text).trim().split(/\s+/), [verse.text]);
  const [phase, setPhase] = useState('reading');
  const [filled, setFilled] = useState(() => new Set());
  const [hint, setHint] = useState('');
  const [hover, setHover] = useState(null);
  const [large, setLarge] = useState(false);
  const [bankUsed, setBankUsed] = useState(() => new Set());
  const bankOrder = useMemo(() => words.map((_, index) => index).sort(() => Math.random() - 0.5), [words]);
  const stageRef = useRef(null);
  const targetRef = useRef(null);
  const slotsRef = useRef([]);
  const piecesRef = useRef([]);
  const filledRef = useRef(new Set());
  const hintRef = useRef(null);
  const tryPlaceRef = useRef(null);
  const completionRef = useRef(onComplete);
  const reportedRef = useRef(false);
  const footerRef = useRef(null);
  completionRef.current = onComplete;
  const liveIndex = filled.size;

  useEffect(() => {
    if (phase === 'complete' && !reportedRef.current) {
      reportedRef.current = true;
      completionRef.current?.();
      footerRef.current?.querySelector('button')?.focus();
    }
  }, [phase]);

  // Fit both the reading and the future pile to the real play area.
  // Keep readable type and 48 px pieces; do not shrink to a fake desktop canvas.
  useLayoutEffect(() => {
    if (phase !== 'reading' || large) return;
    const stage = stageRef.current;
    const target = targetRef.current;
    if (!stage || !target) return;
    let alive = true;
    const fit = () => {
      if (!alive) return;
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      let low = 18;
      let high = W < 520 ? 32 : 44;
      let best = low;
      for (let step = 0; step < 9; step += 1) {
        const size = (low + high) / 2;
        stage.style.setProperty('--vp-word-size', `${size}px`);
        const area = piecesRef.current.filter(Boolean).reduce((sum, tile) => sum + (tile.offsetWidth + 8) * (tile.offsetHeight + 8), 0);
        const pileHeight = area / Math.max(1, W * 0.66);
        if (target.offsetHeight + pileHeight + 32 <= H) { best = size; low = size; }
        else high = size;
      }
      stage.style.setProperty('--vp-word-size', `${best}px`);
      // Enlarged text must never be shrunk back to fit a physics pile.
      // A flowing word bank provides the same recall task without a fixed arena.
      const area = piecesRef.current.filter(Boolean).reduce((sum, tile) => sum + (tile.offsetWidth + 8) * (tile.offsetHeight + 8), 0);
      if (W < 260 || target.offsetHeight + area / Math.max(1, W * 0.66) + 20 > H) setLarge(true);
    };
    fit();
    document.fonts?.ready.then(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => { alive = false; observer.disconnect(); };
  }, [phase, words, large]);

  useLayoutEffect(() => {
    if (phase !== 'playing' || large) return;
    const stage = stageRef.current;
    if (!stage) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { Engine, Bodies, Body, Composite, Sleeping } = Matter;
    const engine = Engine.create({ enableSleeping: true });
    engine.gravity.y = reduced ? 0 : 1;
    let width = stage.clientWidth;
    let height = stage.clientHeight;
    let disposed = false;
    let drag = null;
    let raf = 0;
    const timers = new Set();
    const delay = (callback, time) => {
      const timer = setTimeout(() => { timers.delete(timer); if (!disposed) callback(); }, time);
      timers.add(timer);
    };
    const wallSize = 100;
    const floor = Bodies.rectangle(width / 2, height + wallSize / 2, width * 4, wallSize, { isStatic: true });
    const left = Bodies.rectangle(-wallSize / 2, height / 2, wallSize, height * 4, { isStatic: true });
    const right = Bodies.rectangle(width + wallSize / 2, height / 2, wallSize, height * 4, { isStatic: true });
    const ceiling = Bodies.rectangle(width / 2, -wallSize / 2 - 100, width * 4, wallSize, { isStatic: true });
    Composite.add(engine.world, [floor, left, right, ceiling]);

    const pointInStage = (clientX, clientY) => {
      const bounds = stage.getBoundingClientRect();
      return { x: clientX - bounds.left, y: clientY - bounds.top };
    };
    const centreOfSlot = (index) => {
      const element = slotsRef.current[index];
      if (!element) return null;
      const bounds = element.getBoundingClientRect();
      return pointInStage(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    };
    const items = words.map((text, index) => {
      const element = piecesRef.current[index];
      const w = element.offsetWidth;
      const h = element.offsetHeight;
      const centre = centreOfSlot(index) || { x: width / 2, y: 30 };
      const body = Bodies.rectangle(centre.x, centre.y, w, h, {
        chamfer: { radius: 5 }, restitution: 0.2, friction: 0.65,
        frictionAir: 0.025, density: 0.0016, sleepThreshold: 45,
      });
      Body.setInertia(body, body.inertia * 5);
      if (!reduced) {
        Body.setVelocity(body, { x: (Math.random() - 0.5) * 4, y: -Math.random() * 2 });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.035);
      }
      return { index, text, element, body, w, h, placed: false, busy: false, home: null };
    });
    Composite.add(engine.world, items.map((item) => item.body));
    const draw = (item) => {
      item.element.style.transform = `translate3d(${item.body.position.x - item.w / 2}px, ${item.body.position.y - item.h / 2}px, 0) rotate(${item.body.angle}rad)`;
    };
    const arrange = () => {
      let x = 8;
      let y = height - 8;
      let rowHeight = 0;
      const shuffled = [...items].filter((item) => !item.placed && !item.busy).sort(() => Math.random() - 0.5);
      for (const item of shuffled) {
        if (x + item.w > width - 8) { x = 8; y -= rowHeight + 8; rowHeight = 0; }
        rowHeight = Math.max(rowHeight, item.h);
        item.home = { x: x + item.w / 2, y: y - item.h / 2 };
        Body.setPosition(item.body, item.home);
        Body.setStatic(item.body, true);
        Body.setAngle(item.body, 0);
        draw(item);
        x += item.w + 8;
      }
    };
    if (reduced) arrange();
    items.forEach(draw);

    const wake = () => {
      if (!reduced) items.forEach((item) => {
        if (!item.placed && !item.busy && !item.body.isStatic) Sleeping.set(item.body, false);
      });
    };
    const matches = (item) => words[filledRef.current.size] === item.text;
    const overTarget = (point) => {
      const slot = slotsRef.current[filledRef.current.size];
      if (!slot) return false;
      const bounds = slot.getBoundingClientRect();
      const topLeft = pointInStage(bounds.left, bounds.top);
      const pad = 30;
      return point.x > topLeft.x - pad && point.x < topLeft.x + bounds.width + pad && point.y > topLeft.y - pad && point.y < topLeft.y + bounds.height + pad;
    };
    const place = (item) => {
      const index = filledRef.current.size;
      const centre = centreOfSlot(index);
      if (!centre || item.placed || item.busy) return;
      filledRef.current = new Set(filledRef.current).add(index);
      item.busy = true;
      item.element.disabled = true;
      item.element.classList.add('vp-placing');
      item.element.classList.remove('vp-hinted', 'vp-held');
      Composite.remove(engine.world, item.body);
      item.element.style.transform = `translate3d(${centre.x - item.w / 2}px, ${centre.y - item.h / 2}px, 0) rotate(0)`;
      setHint('');
      setHover(null);
      wake();
      delay(() => {
        item.placed = true;
        item.element.style.visibility = 'hidden';
        setFilled(new Set(filledRef.current));
        if (filledRef.current.size === words.length) setPhase('complete');
      }, reduced ? 0 : 200);
    };
    const release = (item, vx = 0, vy = 0) => {
      item.body.isSensor = false;
      if (reduced) {
        Body.setPosition(item.body, item.home);
        Body.setAngle(item.body, 0);
        draw(item);
      } else {
        Body.setStatic(item.body, false);
        Body.setVelocity(item.body, { x: Math.max(-12, Math.min(12, vx)), y: Math.max(-12, Math.min(12, vy)) });
        Sleeping.set(item.body, false);
        wake();
      }
    };
    const tryWord = (item) => {
      if (!item || item.placed || item.busy) return;
      if (matches(item)) place(item);
      else {
        setHint('Try another word. A hint is here if you need one.');
        if (!reduced && !item.body.isStatic) {
          Sleeping.set(item.body, false);
          Body.setVelocity(item.body, { x: 0, y: -3 });
        }
      }
    };
    tryPlaceRef.current = (index) => tryWord(items[index]);
    hintRef.current = () => {
      const item = items.find((candidate) => !candidate.placed && !candidate.busy && matches(candidate));
      if (!item) return;
      items.forEach((candidate) => candidate.element.classList.remove('vp-hinted'));
      item.element.classList.add('vp-hinted');
      item.element.style.zIndex = '8';
      setHint(`Look for “${item.text}”.`);
      if (!reduced) {
        const verseBottom = targetRef.current.offsetTop + targetRef.current.offsetHeight;
        Body.setPosition(item.body, { x: width / 2, y: Math.min(height - item.h / 2 - 8, Math.max(verseBottom + item.h, height * 0.65)) });
        Body.setVelocity(item.body, { x: 0, y: -2 });
        Body.setAngle(item.body, 0);
        Sleeping.set(item.body, false);
      }
      draw(item);
      item.element.focus({ preventScroll: true });
    };
    const downHandlers = items.map((item) => {
      const handler = (event) => {
        if (item.placed || item.busy || drag) return;
        event.preventDefault();
        try { item.element.setPointerCapture(event.pointerId); } catch { /* window listeners retain the drag */ }
        const point = pointInStage(event.clientX, event.clientY);
        Body.setStatic(item.body, true);
        item.body.isSensor = true;
        item.element.classList.add('vp-held');
        wake();
        drag = { item, offset: { x: point.x - item.body.position.x, y: point.y - item.body.position.y }, start: point, last: point, distance: 0 };
      };
      item.element.addEventListener('pointerdown', handler);
      return [item.element, handler];
    });
    const move = (event) => {
      if (!drag) return;
      const point = pointInStage(event.clientX, event.clientY);
      drag.distance = Math.max(drag.distance, Math.hypot(point.x - drag.start.x, point.y - drag.start.y));
      drag.last = point;
      Body.setPosition(drag.item.body, { x: Math.max(drag.item.w / 2, Math.min(width - drag.item.w / 2, point.x - drag.offset.x)), y: Math.max(drag.item.h / 2, Math.min(height - drag.item.h / 2, point.y - drag.offset.y)) });
      Body.setAngle(drag.item.body, 0);
      draw(drag.item);
      setHover(overTarget(point) ? (matches(drag.item) ? 'match' : 'other') : null);
    };
    const up = (event) => {
      if (!drag) return;
      const { item, distance, last } = drag;
      drag = null;
      item.element.classList.remove('vp-held');
      setHover(null);
      if (event.type !== 'pointercancel' && (distance < 9 || overTarget(last) || overTarget(item.body.position))) {
        if (matches(item)) { place(item); return; }
        setHint('Try another word. A hint is here if you need one.');
      }
      release(item, 0, reduced ? 0 : -2);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);

    // Fixed-step physics: high-refresh screens do not accelerate the fall.
    if (!reduced) {
      const step = 1000 / 60;
      let accumulator = 0;
      let previous = performance.now();
      const tick = (now) => {
        accumulator += Math.min(90, now - previous);
        previous = now;
        let iterations = 0;
        while (accumulator >= step && iterations < 4) {
          Engine.update(engine, step);
          items.forEach((item) => {
            if (!item.placed && !item.busy && !item.body.isStatic && Math.abs(item.body.angle) > 0.28) {
              Body.setAngle(item.body, Math.sign(item.body.angle) * 0.28);
              Body.setAngularVelocity(item.body, 0);
            }
          });
          accumulator -= step;
          iterations += 1;
        }
        items.forEach((item) => {
          if (!item.placed && !item.busy && (!item.body.isSleeping || !item.drawnAsleep)) draw(item);
          item.drawnAsleep = item.body.isSleeping;
        });
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    const resize = () => {
      width = stage.clientWidth;
      height = stage.clientHeight;
      Body.setPosition(floor, { x: width / 2, y: height + wallSize / 2 });
      Body.setPosition(right, { x: width + wallSize / 2, y: height / 2 });
      if (reduced) { arrange(); return; }
      items.forEach((item) => {
        if (!item.placed && !item.busy) Body.setPosition(item.body, {
          x: Math.max(item.w / 2, Math.min(width - item.w / 2, item.body.position.x)),
          y: Math.max(item.h / 2, Math.min(height - item.h / 2, item.body.position.y)),
        });
      });
      wake();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      observer.disconnect();
      downHandlers.forEach(([element, handler]) => element.removeEventListener('pointerdown', handler));
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      hintRef.current = null;
      tryPlaceRef.current = null;
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, [phase === 'playing', words, large]);

  const placeFromBank = (index) => {
    if (bankUsed.has(index) || phase !== 'playing') return;
    if (words[index] !== words[filledRef.current.size]) {
      setHint('Try another word. A hint is here if you need one.');
      return;
    }
    const next = new Set(filledRef.current).add(filledRef.current.size);
    filledRef.current = next;
    setBankUsed((used) => new Set(used).add(index));
    setFilled(next);
    setHint('');
    if (next.size === words.length) setPhase('complete');
  };
  const showHint = () => {
    if (!large) { hintRef.current?.(); return; }
    const nextWord = words[filledRef.current.size];
    const index = bankOrder.find((candidate) => !bankUsed.has(candidate) && words[candidate] === nextWord);
    setHint(`Look for “${nextWord}”.`);
    piecesRef.current[index]?.focus();
  };

  return (
    <>
      <div className={`vp-stage vp-${phase}${large ? ' vp-large' : ''}`} ref={stageRef}>
        <p className="vp-verse" ref={targetRef} aria-label={phase === 'playing' ? 'Put the verse back in order. The next space is underlined.' : undefined}>
          {words.map((word, index) => (
            <Fragment key={index}>
              {index > 0 ? ' ' : ''}
              <span className={`vp-slot${phase === 'reading' || phase === 'complete' || filled.has(index) ? ' vp-visible' : ''}${phase === 'playing' && index === liveIndex ? ` vp-next${hover === 'match' ? ' vp-match' : ''}` : ''}`} ref={(element) => { slotsRef.current[index] = element; }} aria-hidden={phase === 'playing' && !filled.has(index) ? true : undefined}>
                <span>{word}</span>
              </span>
            </Fragment>
          ))}
        </p>
        {phase === 'complete' && <div className="vp-finished"><svg viewBox="0 0 40 38" aria-hidden="true"><path d="M12 35C17 24 20 14 29 3M19 23C8 23 5 16 7 10c9 0 13 5 12 13ZM24 14C23 6 28 2 35 1c1 8-4 12-11 13ZM15 30C7 33 2 29 2 23c7-1 12 1 13 7Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg><h2>You’ve practised<br />{verse.ref}.</h2><p>Try saying it together, away from the screen.</p></div>}
        <div className="vp-pieces" aria-label="Words to put back" aria-hidden={phase !== 'playing'}>
          {(large ? bankOrder : words.map((_, index) => index)).map((index) => {
            const word = words[index];
            return (
            <button type="button" key={index} ref={(element) => { piecesRef.current[index] = element; }} className="vp-piece" tabIndex={phase === 'playing' ? 0 : -1} aria-label={`Place ${word}`} style={phase !== 'playing' ? { visibility: 'hidden' } : undefined}
              disabled={large && bankUsed.has(index)}
              onClick={(event) => { if (large) placeFromBank(index); else if (event.detail === 0) tryPlaceRef.current?.(index); }}
              onKeyDown={(event) => { if (!large && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); tryPlaceRef.current?.(index); } }}>
              {word}
            </button>
            );
          })}
        </div>
      </div>
      <footer className="vp-footer" ref={footerRef}>
        <p className="vp-instruction" role="status" aria-live="polite">{phase === 'reading' ? 'Read the verse slowly.' : phase === 'playing' ? (hint || (filled.size === 0 ? 'Tap the first word.' : 'Tap the word that comes next.')) : 'Keep the words with you.'}</p>
        <div className="vp-actions">
          {phase === 'reading' && <><button type="button" className="vp-primary" onClick={() => setPhase('playing')}>{large ? 'Mix the words' : 'Let the words fall'}</button><button type="button" className="vp-text-button" aria-pressed={large} onClick={() => setLarge(!large)}>Large words</button></>}
          {phase === 'playing' && <><button type="button" className="vp-secondary" onClick={showHint}>A little hint</button><button type="button" className="vp-text-button" onClick={onRestart}>Read again</button></>}
          {phase === 'complete' && <><button type="button" className="vp-primary" onClick={onClose}>Done</button><button type="button" className="vp-text-button" onClick={onRestart}>Play again</button></>}
        </div>
      </footer>
    </>
  );
}
