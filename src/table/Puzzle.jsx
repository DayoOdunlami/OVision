import { useEffect, useRef, useState } from 'react';
import { memoryGapIndexes, wordsOf } from './model.js';
import { NIV_NOTICE, verseText } from './verses.js';

export default function Puzzle({ verse, reduced, onClose, onLearned }) {
  const words = wordsOf(verse);
  const gaps = memoryGapIndexes(words);
  const gapSet = new Set(gaps);
  const [phase, setPhase] = useState('read');
  const [filled, setFilled] = useState(() => new Set());
  const [used, setUsed] = useState(() => new Set());
  const [picked, setPicked] = useState(null);
  const [reject, setReject] = useState(0);
  const [hint, setHint] = useState(true);
  const [ready, setReady] = useState(reduced);
  const learned = useRef(false);
  const gapsRef = useRef(gaps);
  gapsRef.current = gaps;
  const pileRef = useRef(null);
  const gapRefs = useRef({});
  const pieceRefs = useRef({});
  const bodies = useRef(new Map());
  const engineRef = useRef(null);
  const matterRef = useRef(null);
  const drag = useRef(null);

  const live = gaps.find((i) => !filled.has(i));
  const pieces = gaps.filter((i) => !used.has(i));

  useEffect(() => {
    if (phase === 'play' && live == null && !learned.current) {
      learned.current = true;
      onLearned();
      setPhase('done');
    }
  }, [phase, live, onLearned]);

  useEffect(() => {
    if (phase !== 'play' || reduced) return undefined;
    let dead = false;
    let raf = 0;
    import('matter-js').then((mod) => {
      if (dead) return;
      const Matter = mod.default || mod;
      matterRef.current = Matter;
      const pile = pileRef.current;
      if (!pile) return;
      const W = pile.clientWidth || 320;
      const H = pile.clientHeight || 280;
      const engine = Matter.Engine.create({
        enableSleeping: true,
        gravity: { y: 1 },
      });
      engineRef.current = engine;
      const t = 50;
      Matter.Composite.add(engine.world, [
        Matter.Bodies.rectangle(W / 2, H + t / 2, W + 20, t, { isStatic: true }),
        Matter.Bodies.rectangle(-t / 2, H / 2, t, H * 2, { isStatic: true }),
        Matter.Bodies.rectangle(W + t / 2, H / 2, t, H * 2, { isStatic: true }),
        Matter.Bodies.rectangle(W / 2, -t, W, t, { isStatic: true }),
      ]);
      gapsRef.current.forEach((id, n) => {
        const el = pieceRefs.current[id];
        const w = Math.max(48, el ? el.offsetWidth : 72);
        const h = Math.max(48, el ? el.offsetHeight : 48);
        const body = Matter.Bodies.rectangle(
          36 + ((n * 67) % Math.max(80, W - 72)),
          24 + (n % 5) * 28,
          w,
          h,
          {
            restitution: 0.04,
            friction: 0.8,
            frictionAir: 0.02,
            density: 0.002,
            sleepThreshold: 16,
            chamfer: { radius: 2 },
          },
        );
        bodies.current.set(id, body);
        Matter.Composite.add(engine.world, body);
      });
      setReady(true);
      const tick = () => {
        Matter.Engine.update(engine, 1000 / 60);
        const dragging = drag.current?.id;
        for (const [id, body] of bodies.current) {
          const el = pieceRefs.current[id];
          if (!el || id === dragging) continue;
          el.style.transform = `translate(${body.position.x - el.offsetWidth / 2}px, ${body.position.y - el.offsetHeight / 2}px) rotate(${body.angle}rad)`;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }).catch(() => setReady(true));
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      const engine = engineRef.current;
      const Matter = matterRef.current;
      if (engine && Matter) Matter.Composite.clear(engine.world, false);
      engineRef.current = null;
      bodies.current.clear();
    };
  }, [phase, reduced, verse.id]);

  function place(pieceId, gapIndex) {
    if (gapIndex == null || used.has(pieceId) || filled.has(gapIndex)) return false;
    if (gapIndex === live && words[pieceId] === words[gapIndex]) {
      setUsed((prev) => new Set(prev).add(pieceId));
      setFilled((prev) => new Set(prev).add(gapIndex));
      setPicked(null);
      setHint(false);
      const Matter = matterRef.current;
      const body = bodies.current.get(pieceId);
      if (Matter && body && engineRef.current) {
        Matter.Composite.remove(engineRef.current.world, body);
        bodies.current.delete(pieceId);
      }
      return true;
    }
    setReject((n) => n + 1);
    return false;
  }

  function pointerDown(event, id) {
    const el = pieceRefs.current[id];
    if (!el) return;
    const body = bodies.current.get(id);
    if (body) body.isStatic = true;
    drag.current = {
      id,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      dx: event.clientX - el.getBoundingClientRect().left,
      dy: event.clientY - el.getBoundingClientRect().top,
    };
    el.setPointerCapture?.(event.pointerId);
  }

  function pointerMove(event) {
    const d = drag.current;
    if (!d || reduced) return;
    if (Math.hypot(event.clientX - d.x, event.clientY - d.y) > 8) d.moved = true;
    const pile = pileRef.current?.getBoundingClientRect();
    const el = pieceRefs.current[d.id];
    const body = bodies.current.get(d.id);
    if (!pile || !el) return;
    const x = event.clientX - pile.left - d.dx;
    const y = event.clientY - pile.top - d.dy;
    el.style.transform = `translate(${x}px, ${y}px)`;
    const Matter = matterRef.current;
    if (body && Matter) {
      Matter.Body.setPosition(body, { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 });
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
    }
  }

  function pointerUp(event) {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const body = bodies.current.get(d.id);
    if (!d.moved) {
      setPicked((prev) => {
        if (prev != null && prev !== d.id) {
          const prevBody = bodies.current.get(prev);
          if (prevBody) prevBody.isStatic = false;
        }
        return d.id;
      });
      if (body) body.isStatic = true;
      return;
    }
    if (body) body.isStatic = false;
    const gapEl = live != null ? gapRefs.current[live] : null;
    if (!gapEl) return;
    const r = gapEl.getBoundingClientRect();
    const hit = event.clientX >= r.left - 16 && event.clientX <= r.right + 16
      && event.clientY >= r.top - 16 && event.clientY <= r.bottom + 16;
    if (hit) place(d.id, live);
  }

  const full = verseText(verse);

  return (
    <div className="screen puzzle">
      <div className="sheet">
        <div className="verse-col">
          <div className="bar">
            <button className="quiet" type="button" onClick={onClose}>Close</button>
            <p className="ref">{verse.ref} · NIV</p>
          </div>
          {phase === 'read' && (
            <>
              <p className="verse-line">{full}</p>
              <p className="hint">Read it. Then the loose words fall.</p>
              <div className="actions">
                <button className="primary" type="button" onClick={() => setPhase('play')}>Let the words fall</button>
              </div>
            </>
          )}
          {phase === 'done' && (
            <>
              <p className="verse-line">{full}</p>
              <p className="prayer-line">That is the verse.</p>
              <div className="actions">
                <button className="primary" type="button" onClick={onClose}>Back to the table</button>
              </div>
            </>
          )}
          {phase === 'play' && (
            <>
              <p className="verse-play">
                {words.map((word, i) => {
                  if (!gapSet.has(i)) return <span key={i}>{word} </span>;
                  if (filled.has(i)) return <span key={i} className="gap done">{word} </span>;
                  return (
                    <button
                      key={i}
                      type="button"
                      ref={(node) => { gapRefs.current[i] = node; }}
                      className={i === live ? `gap live${reject ? ' shake' : ''}` : 'gap'}
                      style={{ minWidth: `${Math.max(2.2, word.length * 0.55)}ch` }}
                      aria-label={i === live ? 'Gold space, the next word' : 'Space'}
                      onClick={() => { if (picked != null) place(picked, i); }}
                    />
                  );
                })}
              </p>
              {hint && <p className="hint">Put the next word in the gold space.</p>}
            </>
          )}
          <p className="legal">{NIV_NOTICE}</p>
        </div>
        {phase === 'play' && (
          <div className={ready && !reduced ? 'pile' : 'pile plain'} ref={pileRef}>
            {pieces.map((id) => (
              <button
                key={id}
                type="button"
                className={picked === id ? 'slip picked' : 'slip'}
                ref={(node) => { pieceRefs.current[id] = node; }}
                aria-pressed={picked === id}
                onPointerDown={(e) => pointerDown(e, id)}
                onPointerMove={pointerMove}
                onPointerUp={pointerUp}
                onPointerCancel={pointerUp}
              >
                {words[id]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
