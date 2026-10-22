import { useEffect, useRef } from 'react';
import { paintWater, paintCurrents, paintCaustics, paintVignette } from '../pond/water.js';
import { WATER, paintMoon } from '../pond/paint.js';

// ═══════════════════════════════════════════════════════════════════
// DeepScene — the water for Into the deep.
//
// Dusk water (night water after dark), a few of the household's koi,
// and whatever is given to it. A stone lands with a splash and rings,
// the koi startle and come back, and it sinks slowly into the dark
// until the water closes over it, clean. A flower lands and floats.
// Nothing is ever thrown *at* a koi: they're warned off where a thing
// will land as it's thrown.
//
//   api.launch({ kind: 'stone'|'flower', x, y, vx, vy, drop, onSunk })
//   (x, y in page coordinates; drop = opened from the hand, not thrown)
// ═══════════════════════════════════════════════════════════════════

const FAR = { x: -9999, y: -9999 };

export default function DeepScene({ light, koi = [], onReady }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, DPR = 1, raf = 0, t = 0, dead = false;
    let fish = [];
    const things = [];     // { kind, x, y, vx, vy, s, phase: 'fly'|'sink'|'float', age, onSunk }
    const rings = [];      // { x, y, age, life, r }
    const drops = [];      // splash droplets { x, y, vx, vy, age }
    const bubbles = [];    // { x, y, r, age }
    const scare = { x: -9999, y: -9999, until: 0 };
    const pal = WATER[light === 'night' ? 'night' : 'dusk'];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    import('../pond/SpineFish.js').then((m) => {
      if (dead) return;
      const size = Math.max(0.6, Math.min(1.05, Math.min(W, H) / 760));
      fish = koi.map((k) => {
        const [v] = m.buildPondMixFromCounts({ [k]: 1 });
        const f = new m.default(W, H, { ...v, sizeScale: (v.sizeScale || 1) * size });
        f.depth = 0.5;
        return f;
      });
    });

    const toLocal = (x, y) => {
      const r = canvas.getBoundingClientRect();
      return { x: x - r.left, y: y - r.top };
    };

    const land = (o) => {
      o.phase = o.kind === 'stone' ? 'sink' : 'float';
      o.age = 0;
      rings.push({ x: o.x, y: o.y, age: 0, life: 120, r: o.kind === 'stone' ? 70 : 40 });
      rings.push({ x: o.x, y: o.y, age: -16, life: 120, r: o.kind === 'stone' ? 46 : 26 });
      if (o.kind === 'stone' && !o.drop) {
        for (let i = 0; i < 9; i++) {
          const a = -Math.PI * (0.15 + Math.random() * 0.7);
          drops.push({ x: o.x, y: o.y, vx: Math.cos(a) * (1 + Math.random() * 2.2), vy: Math.sin(a) * (2 + Math.random() * 2.5), age: 0 });
        }
      }
      scare.x = o.x; scare.y = o.y; scare.until = t + 50;
      try { navigator.vibrate?.(o.kind === 'stone' ? 22 : 8); } catch {}
    };

    const api = {
      launch({ kind, x, y, vx = 0, vy = -12, drop = false, onSunk }) {
        const p = toLocal(x, y);
        const o = { kind, x: p.x, y: p.y, vx, vy, s: 1, phase: 'fly', age: 0, drop, onSunk };
        // Where will it come down? Warn the koi off it now.
        if (!drop) {
          let tx = p.x, ty = p.y, tvx = vx, tvy = vy;
          for (let i = 0; i < 60; i++) { tx += tvx; ty += tvy; tvx *= 0.93; tvy *= 0.93; }
          scare.x = Math.max(40, Math.min(W - 40, tx)); scare.y = Math.max(80, ty); scare.until = t + 90;
        }
        if (reduced) { o.x = drop ? p.x : W / 2; o.y = drop ? p.y - 40 : H * 0.42; land(o); }
        things.push(o);
      },
    };
    onReady?.(api);

    const drawStone = (o, a) => {
      const r = 26 * o.s;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(o.x, o.y);
      const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.2);
      const dark = o.phase === 'sink' ? Math.min(1, o.age / 160) : 0;
      g.addColorStop(0, `rgb(${185 - 90 * dark}, ${178 - 90 * dark}, ${166 - 80 * dark})`);
      g.addColorStop(0.6, `rgb(${133 - 70 * dark}, ${125 - 70 * dark}, ${112 - 60 * dark})`);
      g.addColorStop(1, `rgb(${77 - 40 * dark}, ${71 - 40 * dark}, ${63 - 35 * dark})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.25, r * 0.85, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    const drawFlower = (o) => {
      const r = 18 * o.s;
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.age * 0.002);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.beginPath(); ctx.ellipse(4, 6, r * 1.2, r * 0.9, 0, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 8; k++) {
        ctx.save();
        ctx.rotate((k / 8) * Math.PI * 2);
        ctx.fillStyle = '#fbf4ea';
        ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r * 0.28, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#e8b84a';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      t++;
      const ts = t / 60;
      paintWater(ctx, W, H, pal);
      paintCurrents(ctx, W, H, ts, pal);
      paintCaustics(ctx, W, H, ts, pal, light === 'night' ? 10 : 22);
      if (light === 'night') paintMoon(ctx, W, H, ts);

      // Sinking things go under the fish.
      for (const o of things) {
        if (o.phase !== 'sink') continue;
        o.age++;
        const life = o.drop ? 300 : 240;
        const k = Math.min(1, o.age / life);
        o.s = 1 - 0.45 * k;
        o.y += 0.12;
        if (o.age % 24 === 0 && k < 0.9) bubbles.push({ x: o.x + (Math.random() - 0.5) * 14, y: o.y - 8, r: 1.5 + Math.random() * 2.5, age: 0 });
        drawStone(o, 1 - k);
        if (k >= 1 && !o.done) { o.done = true; o.onSunk?.(); }
      }

      const pointer = t < scare.until ? scare : FAR;
      for (const f of fish) { if (!reduced) f.update(W, H, pointer, { food: [], onBreak: () => {} }); f.draw(ctx); }

      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.age++; b.y -= 0.5;
        const a = Math.max(0, 0.6 - b.age / 90);
        if (a <= 0) { bubbles.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(230, 240, 255, ${a})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
      }

      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.age++;
        if (r.age < 0) continue;
        const p = r.age / r.life;
        if (p >= 1) { rings.splice(i, 1); continue; }
        const rad = 8 + (1 - (1 - p) ** 3) * r.r * 2;
        ctx.strokeStyle = `rgba(255, 248, 232, ${0.5 * (1 - p)})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.ellipse(r.x, r.y, rad, rad * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
      }

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.age++; d.x += d.vx; d.y += d.vy; d.vy += 0.25;
        if (d.age > 26) { drops.splice(i, 1); continue; }
        ctx.fillStyle = `rgba(240, 248, 255, ${0.8 - d.age / 32})`;
        ctx.beginPath(); ctx.arc(d.x, d.y, 2, 0, Math.PI * 2); ctx.fill();
      }

      // In the air, and floating.
      for (const o of things) {
        if (o.phase === 'fly') {
          o.age++;
          o.x += o.vx; o.y += o.vy;
          o.vx *= 0.93; o.vy *= 0.93;
          o.s = o.drop ? 1.08 - o.age * 0.007 : Math.max(0.7, 1.1 - o.age * 0.01);
          if (o.x < 30 || o.x > W - 30) o.vx *= -0.5;
          // A shadow on the water below it, closing in as it comes down.
          ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
          ctx.beginPath(); ctx.ellipse(o.x + 6, o.y + 22 * o.s, 24 * o.s, 7 * o.s, 0, 0, Math.PI * 2); ctx.fill();
          if (o.kind === 'stone') drawStone(o, 1); else drawFlower(o);
          const slow = Math.hypot(o.vx, o.vy) < 1.1;
          if ((o.drop && o.age > 12) || (!o.drop && (slow || o.age > 55 || o.y < 70))) land(o);
        } else if (o.phase === 'float') {
          o.age++;
          o.x += Math.sin(o.age * 0.01) * 0.15 + 0.05;
          o.y += Math.cos(o.age * 0.008) * 0.06;
          drawFlower(o);
        }
      }
      paintVignette(ctx, W, H, pal);
    };
    raf = requestAnimationFrame(frame);

    return () => { dead = true; cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return <canvas ref={ref} className="deep-canvas" aria-hidden="true" />;
}
