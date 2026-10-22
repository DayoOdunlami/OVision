import { useEffect, useRef, useState } from 'react';

function palette(night, season) {
  if (night) return ['#243044', '#182433', '#0d1520'];
  if (season === 'winter') return ['#d5dde6', '#6d8494', '#243848'];
  if (season === 'spring') return ['#d7e4cf', '#6f947c', '#2a4a3c'];
  if (season === 'summer') return ['#d7ebe6', '#3f8d8a', '#1a4c50'];
  return ['#d7e2d4', '#6d917f', '#243f3c'];
}

function drawKoi(ctx, fish) {
  ctx.save();
  ctx.translate(fish.x, fish.y);
  ctx.rotate(fish.a);
  const s = 28 * fish.scale;
  ctx.fillStyle = '#f6f1e6';
  ctx.beginPath();
  ctx.ellipse(0, 0, s, s * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-s * 0.75, 0);
  ctx.lineTo(-s * 1.35, -s * 0.42);
  ctx.lineTo(-s * 1.05, 0);
  ctx.lineTo(-s * 1.35, s * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = fish.hue;
  ctx.beginPath();
  ctx.ellipse(s * 0.1, 0, s * 0.32, s * 0.16, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-s * 0.28, s * 0.02, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#241f1a';
  ctx.beginPath();
  ctx.arc(s * 0.62, -s * 0.05, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function angDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export default function Glance({ word, verseLine, todayLine, people, pairIds, night, season, reduced, onClose }) {
  const ref = useRef(null);
  const dropRef = useRef(() => {});
  const [hint, setHint] = useState(true);

  function feed() {
    const canvas = ref.current;
    if (!canvas) return;
    dropRef.current(canvas.clientWidth / 2, canvas.clientHeight * 0.42);
  }

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const fish = people.map((p, i) => ({
      hue: p.hue,
      x: 70 + ((i * 130) % 280),
      y: 150 + ((i * 70) % 220),
      a: i * 0.8,
      scale: pairIds.includes(p.id) ? 1 : 0.7,
      wobble: i * 1.3,
    }));
    const food = [];
    let pointer = null;
    let timer = 0;
    let raf = 0;

    const resize = () => {
      canvas.width = Math.max(1, canvas.clientWidth) * dpr;
      canvas.height = Math.max(1, canvas.clientHeight) * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const drop = (x, y) => {
      food.push({ x, y, life: 1 });
      setHint(false);
    };
    dropRef.current = drop;
    const down = (event) => {
      const r = canvas.getBoundingClientRect();
      const x = event.clientX - r.left;
      const y = event.clientY - r.top;
      pointer = { x, y };
      timer = window.setTimeout(() => drop(x, y), 420);
    };
    const up = () => {
      window.clearTimeout(timer);
      pointer = null;
    };
    const move = (event) => {
      if (!pointer) return;
      const r = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - r.left, y: event.clientY - r.top };
    };
    const double = (event) => {
      const r = canvas.getBoundingClientRect();
      drop(event.clientX - r.left, event.clientY - r.top);
    };
    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('dblclick', double);

    const frame = (t) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const [a, b, c] = palette(night, season);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, a);
      g.addColorStop(0.42, b);
      g.addColorStop(1, c);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(12, 28, 30, 0.18)';
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.46, w * 0.42, h * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let i = food.length - 1; i >= 0; i--) {
        const f = food[i];
        if (!reduced) f.y += 0.4;
        f.life -= 0.003;
        ctx.fillStyle = 'rgba(244, 226, 176, 0.92)';
        ctx.beginPath();
        ctx.arc(f.x, f.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        if (f.life <= 0 || f.y > h - 10) food.splice(i, 1);
      }
      for (const f of fish) {
        let target = null;
        let best = 160;
        for (const crumb of food) {
          const dist = Math.hypot(crumb.x - f.x, crumb.y - f.y);
          if (dist < best) { best = dist; target = crumb; }
        }
        if (!target && pointer && Math.hypot(pointer.x - f.x, pointer.y - f.y) < 200) target = pointer;
        if (!reduced) {
          if (target) {
            const aim = Math.atan2(target.y - f.y, target.x - f.x);
            f.a += angDiff(f.a, aim) * 0.05;
            f.x += Math.cos(f.a) * 0.85;
            f.y += Math.sin(f.a) * 0.55;
            if (target.life != null && Math.hypot(target.x - f.x, target.y - f.y) < 18) target.life = 0;
          } else {
            f.a += Math.sin(t / 1400 + f.wobble) * 0.012;
            f.x += Math.cos(f.a) * 0.32;
            f.y += Math.sin(f.a) * 0.16;
          }
          if (f.x < 40) f.a = 0;
          if (f.x > w - 40) f.a = Math.PI;
          f.y = Math.max(h * 0.16, Math.min(h * 0.72, f.y));
        }
        drawKoi(ctx, f);
      }
      if (!reduced) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.clearTimeout(timer);
      canvas.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('dblclick', double);
    };
  }, [night, season, reduced, people, pairIds]);

  return (
    <div className="glance">
      <canvas ref={ref} aria-hidden="true" />
      <button className="quiet glance-back" type="button" onClick={onClose}>Back</button>
      <h1 className="glance-word">{word || 'Near'}</h1>
      <div className="glance-foot">
        <p className="glance-verse">{verseLine}</p>
        <p className="glance-today">{todayLine}</p>
        {hint && <p className="hint">Hold on the water, or tap Feed.</p>}
        <button className="quiet feed" type="button" onClick={feed}>Feed</button>
      </div>
    </div>
  );
}
