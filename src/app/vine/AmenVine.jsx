import { useEffect, useRef } from 'react';
import { stem, timeStem, grownLength, seeded } from './vine.js';
import { drawStem, drawLeaf, drawBloom } from './draw.js';
import { KOI } from '../household.js';
import { tintFor } from './tint.js';

// ═══════════════════════════════════════════════════════════════════
// AmenVine — after Amen, in the vine's world (studio P).
//
// The pond's koi rise under the paper for everyone just prayed for
// (KoiSchool). On the vine, a shoot grows up from the foot of the paper
// for each of them, puts out two leaves, and opens a white flower (the
// vine's sign for "prayed for") beside a blossom in their own colour,
// with their name. Then it is still. Nothing to do; nothing to read.
// ═══════════════════════════════════════════════════════════════════

export default function AmenVine({ people }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const r = canvas.getBoundingClientRect();
    const W = Math.max(1, r.width), H = Math.max(1, r.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const night = document.documentElement.dataset.light === 'night';
    const em = Math.max(60, Math.min(110, W / 6));
    const rand = seeded('amen ' + people.map((p) => p.name).join());
    const n = people.length;
    const shoots = people.map((p, k) => {
      const x = W * ((k + 1) / (n + 1));
      const top = H * (0.62 + rand() * 0.08);
      const pts = [];
      const lean = (rand() - 0.5) * em * 0.6;
      for (let j = 0; j <= 40; j++) {
        const u = j / 40;
        pts.push([x + Math.sin(u * Math.PI) * lean * 0.5 + lean * u * u * 0.3, H + 4 - (H + 4 - top) * u]);
      }
      const st = stem(pts, { w0: em * 0.05, w1: em * 0.025 });
      timeStem(st, 0.3 + k * 0.5, em * 2.4, em, rand);
      const at = (f) => pts[Math.round(f * 40)];
      const leaves = [0.45, 0.7].map((f, j) => {
        const [lx, ly] = at(f);
        const th = -Math.PI / 2;
        return { x: lx, y: ly, th, ang: th + (j ? 1 : -1) * 0.95, L: em * 0.22, W: em * 0.07, pl: em * 0.03, curl: rand() - 0.5, flip: j === 1,
          tone: ['#3a7443', '#65a458'], t0: st.tt[Math.round(f * 40)] + 0.3, dur: 2.4, phase: rand() * 6, off: 0, av: 0 };
      });
      const [tx, ty] = pts[40];
      const tint = tintFor(KOI[p.koi] || KOI.kohaku);
      return {
        st, leaves, name: p.name, tx, ty,
        blooms: [
          { kind: 'blossom', tint, x: tx - em * 0.06, y: ty, r: em * 0.11, rot: rand() * 3, t0: st.tEnd + 0.2, phase: rand() * 6 },
          { kind: 'jasmine', x: tx + em * 0.1, y: ty + em * 0.05, r: em * 0.1, rot: rand() * 3, t0: st.tEnd + 0.8, phase: rand() * 6 },
        ],
      };
    });
    let t = reduced ? 60 : 0, raf = 0, last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = night ? 0.7 : 0.85;
      for (const s of shoots) {
        drawStem(ctx, s.st, grownLength(s.st, t), t, em * 0.1);
        for (const lf of s.leaves) drawLeaf(ctx, lf, (t - lf.t0) / lf.dur, 0, em * 0.05, t);
        for (const b of s.blooms) drawBloom(ctx, b, (t - b.t0) / 3, reduced ? 0 : t * 0.3);
        const a = Math.max(0, Math.min(1, (t - s.st.tEnd - 1.4) / 1.2));
        if (a > 0) {
          ctx.save();
          ctx.globalAlpha = a * 0.9;
          ctx.font = `italic 500 ${Math.round(Math.max(15, em * 0.2))}px "Literata Variable", Georgia, serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = night ? '#ece2cc' : '#2f3a2c';
          ctx.fillText(s.name, s.tx, s.ty - em * 0.22);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      const done = shoots.every((s) => t > s.st.tEnd + 4);
      if (!done) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [people]);
  return <canvas ref={ref} className="pz-koi amen-vine" aria-hidden="true" />;
}
