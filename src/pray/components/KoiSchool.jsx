import { useEffect, useRef, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════
// KoiSchool — koi beneath the paper.
//
// The page is treated as the surface of a pond and the koi live under
// it. They don't swim in from the edge; they *rise*:
//
//   deep       faint, blurred and a little small — a shape under water
//   surfacing  a pair of soft rings spreads through the paper above them
//   surfaced   clear, full size, and their name fades in
//
// Each fish rises at its own moment and pace, so an arrival never looks
// choreographed. Once up they drift slowly between resting points —
// below a puzzle verse while it's showing, up among the Amen card's
// words once it's gone — pausing (the pond's own idle orbit) between
// moves: much slower than the pond, because someone has just prayed.
// They still answer a finger like pond koi: curious ones come, shy ones
// scatter (and the shy stay within their band while they do).
//
// Two modes:
//   stay  (default) everyone prayed for rises and stays until closed.
//   pass  one koi fades in at the left, crosses once and leaves — used
//         mid-prayer in the puzzle's Grand celebration.
//
// While surfaced, the fish publish their body points as
// `window.__prayerKoi` (viewport coordinates, with radii), which Nudge
// uses to let them push the Amen card's words about like lily pads.
//
// Rendered as the first child of a full-screen overlay (the puzzle or
// Pray it) on a canvas behind everything else in it, so moving on never
// cuts it off. The fish code is loaded on demand.
// ═══════════════════════════════════════════════════════════════════

const SURFACE_FRAMES = [170, 240];   // how long a rise takes (≈2.8–4s)
const DEEP = { alpha: 0.1, blur: 7, scale: 0.72 };

const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

export default function KoiSchool({ people, stay, onGone }) {
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

      // SpineFish sets its own alpha and blur while drawing, so a rising
      // fish is drawn onto this scratch layer first, and the layer is
      // then laid onto the page faded, blurred and scaled.
      const scratch = document.createElement('canvas');
      scratch.width = canvas.width;
      scratch.height = canvas.height;
      const sctx = scratch.getContext('2d');
      const canFilter = 'filter' in ctx;

      // Where the fish may be. While the puzzle's verse is on screen:
      // below it, so the verse stays readable. With no verse — Pray it,
      // or the puzzle once Amen has replaced the verse with the Amen
      // card — they may swim up among the card's words, which is what
      // lets them nudge those words about. Re-measured as it goes, since
      // the verse eases into place and later disappears.
      const verseEl = canvas.parentElement?.querySelector('.pz-verse');
      const OPEN_TOP = H * 0.26;
      const band = { top: OPEN_TOP, bottom: H - 110 };
      const measureBand = () => {
        if (!verseEl || !verseEl.isConnected) { band.top = OPEN_TOP; return; }
        const bottom = verseEl.getBoundingClientRect().bottom - canvas.getBoundingClientRect().top;
        let top = Math.max(bottom + 50, H * 0.4);
        const floor = H - 110;
        if (floor - top < 130) top = Math.max(H * 0.5, floor - 130);
        band.top = top;
        band.bottom = floor;
      };
      measureBand();
      // Resting spots keep clear of the band's top edge: a resting koi
      // circles lazily (the pond's idle orbit, ~60px), which otherwise
      // carried it up behind the last lines of a long verse on a phone.
      const restTop = () => band.top + Math.min(55, (band.bottom - band.top) * 0.4);

      const crowd = people.length;
      const size = Math.max(0.55, Math.min(1, W / 900)) * (crowd > 3 ? 0.8 : 1);
      const randIn = (a, b) => a + Math.random() * (b - a);
      const env = { food: [], onBreak: () => {} };
      const far = { x: -9999, y: -9999 };

      // Spread the surfacing points across the width, jittered, and in
      // a random order so the rises don't sweep left to right.
      const order = people.map((_, i) => i).sort(() => Math.random() - 0.5);

      const school = people.map((person, i) => {
        const variety = link.KOI_BY_PERSON[person] || 'kohaku';
        const [v] = buildPondMixFromCounts({ [variety]: 1 });
        const fish = new SpineFish(W, H, { ...v, sizeScale: (v.sizeScale || 1) * size });
        const slot = order.indexOf(i);
        const k = {
          person,
          label: person.toUpperCase(),
          fish,
          // Rising: staggered, uneven starts and paces — "personality".
          delay: stay ? Math.round(20 + slot * randIn(45, 80)) : 0,
          riseFrames: Math.round(randIn(...SURFACE_FRAMES)),
          risen: stay ? 0 : 1,
          rippled: !stay,
          rest: null,
          restTimer: 0,
          wasIdle: false,
          laneOffset: 0,
        };
        // Settle the spine by letting it swim briefly in open water,
        // then place it where it will surface.
        const spawn = stay
          ? {
              x: ((slot + 0.5) / crowd) * (W - 120) + 60 + randIn(-30, 30),
              y: randIn(restTop(), band.bottom - 10),
            }
          : { x: Math.min(70, W * 0.12), y: (band.top + band.bottom) / 2 };
        const dir = stay ? randIn(0, Math.PI * 2) : 0;
        for (let n = 0; n < 120; n++) {
          if (fish.target) {
            fish.target.x = fish.mouth.x + Math.cos(dir) * 200;
            fish.target.y = fish.mouth.y + Math.sin(dir) * 200;
          }
          fish.isIdle = false;
          fish.energy = 0.5;
          fish.update(W * 4, H * 4, far, env);
        }
        fish.shift(spawn.x - fish.mouth.x, spawn.y - fish.mouth.y);
        return k;
      });

      const ripples = [];          // { x, y, age }
      const cur = { x: -9999, y: -9999 };
      let t = 0;

      // How far through its rise a fish is, 0 → 1.
      const surfaced = (k) => (stay ? ease(k.risen) : 1);

      const steer = (k) => {
        const f = k.fish;
        if (!f.target) return;

        if (!stay) {
          // Passing: a gentle, steady crossing.
          f.target.x = f.mouth.x + 260;
          f.target.y = (band.top + band.bottom) / 2 + Math.sin(t * 0.012) * 22;
          f.isIdle = false;
          f.energy = 0.4;
          return;
        }

        // While a fish flees a finger, let the pond's flee run, but keep
        // its escape inside the band.
        if (f.fleeCooldown > 0) {
          f.target.y = Math.min(Math.max(f.target.y, band.top), band.bottom);
          return;
        }
        // Resting: leave the pond's own lazy idle orbit alone.
        if (f.isIdle) { k.wasIdle = true; return; }

        // Moving on: a new resting point, not far away. Slow and short
        // drifts read as calm; long dashes read as busy.
        if (!k.rest || k.wasIdle || --k.restTimer <= 0) {
          k.wasIdle = false;
          const reach = Math.min(170, W * 0.35);
          k.rest = {
            x: Math.min(W - 60, Math.max(60, f.mouth.x + randIn(-reach, reach))),
            y: randIn(restTop(), band.bottom),
          };
          k.restTimer = Math.round(randIn(420, 780));
        }
        f.target.x = k.rest.x;
        f.target.y = k.rest.y;
        // Still rising: barely moving. Surfaced: an unhurried glide.
        f.energy = surfaced(k) < 1 ? 0.12 : 0.2;
      };

      // A finger or cursor on the page is felt by fish that have
      // surfaced — not by the ones still deep.
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

      // Draw one fish, scaled about its head by `s`, faded to `a`,
      // blurred by `b` px. Surfaced fish (a=1, s=1, b=0) skip the
      // scratch layer entirely.
      const drawFish = (f, a, s, b) => {
        if (a >= 0.999 && s >= 0.999 && b <= 0.05) { f.draw(ctx); return; }
        sctx.setTransform(1, 0, 0, 1, 0, 0);
        sctx.clearRect(0, 0, scratch.width, scratch.height);
        sctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        sctx.translate(f.head.x, f.head.y);
        sctx.scale(s, s);
        sctx.translate(-f.head.x, -f.head.y);
        f.draw(sctx);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = a;
        if (canFilter && b > 0.05) ctx.filter = `blur(${(b * DPR).toFixed(1)}px)`;
        ctx.drawImage(scratch, 0, 0);
        ctx.restore();
      };

      const drawRipples = () => {
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.age++;
          const life = 110;
          if (r.age > life + 30) { ripples.splice(i, 1); continue; }
          for (let ring = 0; ring < 2; ring++) {
            const age = r.age - ring * 22;
            if (age < 0 || age > life) continue;
            const p = age / life;
            const radius = 10 + ease(p) * 95 * size;
            ctx.save();
            ctx.globalAlpha = (1 - p) * (ring === 0 ? 0.42 : 0.26);
            ctx.strokeStyle = 'rgb(160, 120, 70)';
            ctx.lineWidth = ring === 0 ? 1.6 : 1.1;
            ctx.beginPath();
            // A little flattened: a ring seen at a slight angle on water.
            ctx.ellipse(r.x, r.y, radius, radius * 0.72, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }
      };

      const drawLabel = (k, alpha) => {
        if (alpha <= 0.01) return;
        const f = k.fish;
        ctx.save();
        ctx.font = '700 12px "Source Sans 3", system-ui, sans-serif';
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0.16em';
        const tw = ctx.measureText(k.label).width;
        const lx = f.head.x;
        const ly = f.head.y - 34 * size - 10;
        ctx.globalAlpha = 0.9 * alpha;
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

      // Body points of surfaced fish, in viewport coordinates, for Nudge.
      const publish = (list) => {
        const r = canvas.getBoundingClientRect();
        const pts = [];
        for (const k of list) {
          if (surfaced(k) < 0.85) continue;   // deep fish don't touch the surface
          const f = k.fish;
          const add = (p, rad) => p && pts.push({ x: r.left + p.x, y: r.top + p.y, r: rad || 6 });
          add(f.mouth, f.mouth?.radius);
          add(f.head, f.head?.radius);
          if (f.parts) for (let i = 0; i < f.parts.length; i += 2) add(f.parts[i], f.parts[i]?.radius);
          const row = f.tail?.pieces?.[2];
          if (row && row.length) add(row[Math.floor(row.length / 2)], 6);
        }
        window.__prayerKoi = pts;
      };

      const started = performance.now();
      const lastX = school.map((k) => k.fish.mouth.x);
      let frames = 0;

      // One frame of simulation + drawing. Returns false when finished.
      const step = () => {
        if (dead) return false;
        if (frames % (frames < 130 ? 10 : 30) === 0) measureBand();
        frames++;
        t++;

        const active = school.filter((k) => frames > k.delay);
        for (const k of active) {
          if (stay && k.risen < 1) k.risen = Math.min(1, k.risen + 1 / k.riseFrames);
          // The rings go out as the fish breaks the surface.
          if (!k.rippled && k.risen > 0.5) {
            k.rippled = true;
            ripples.push({ x: k.fish.head.x, y: k.fish.head.y, age: 0 });
          }
          const pointer = surfaced(k) >= 0.95 ? cur : far;
          steer(k);
          k.fish.update(W, H, pointer, env);
        }

        ctx.clearRect(0, 0, W, H);
        drawRipples();

        // Deeper fish first, as in the pond; still-rising fish count as
        // deepest of all.
        const drawOrder = [...active].sort(
          (a, b) => (surfaced(a) - surfaced(b)) || ((b.fish.depth ?? 0.4) - (a.fish.depth ?? 0.4)),
        );
        for (const k of drawOrder) {
          const e = surfaced(k);
          const passFade = stay ? 1 : Math.min(1, frames / 45);   // pass: fade in at the edge
          drawFish(
            k.fish,
            (DEEP.alpha + (1 - DEEP.alpha) * e) * passFade,
            DEEP.scale + (1 - DEEP.scale) * e,
            DEEP.blur * (1 - e),
          );
        }
        // Names appear only once a fish is nearly up.
        for (const k of active) drawLabel(k, Math.max(0, (surfaced(k) - 0.7) / 0.3));

        publish(active);

        if (!stay) {
          const allOut = school.every((k, i) => {
            if (frames <= k.delay) return false;
            const x = k.fish.mouth.x;
            const wrapped = x < lastX[i] - W / 2;
            lastX[i] = x;
            return x > W + 80 || wrapped;
          });
          if (allOut || performance.now() - started > 16000) {
            setLeaving(true);
            leaveTimer = setTimeout(() => {
              ctx.clearRect(0, 0, W, H);
              window.__prayerKoi = [];
              goneRef.current?.();
            }, 600);
            return false;
          }
        }
        return true;
      };
      const frame = () => {
        if (step()) raf = requestAnimationFrame(frame);
      };
      // Development only (stripped from production builds): step the
      // animation by hand, for tools and previews that don't run
      // requestAnimationFrame while hidden.
      if (import.meta.env.DEV) {
        window.__koiStep = (n = 1) => { for (let i = 0; i < n; i++) if (!step()) break; };
      }
      // First frame now, so the canvas is never momentarily empty.
      frame();
    })();

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      clearTimeout(leaveTimer);
      offPointer();
      window.__prayerKoi = [];
      if (import.meta.env.DEV) delete window.__koiStep;
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
