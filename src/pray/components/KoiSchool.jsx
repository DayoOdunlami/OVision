import { useEffect, useRef, useState } from 'react';

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
// Rendered as the first child of a full-screen overlay (the puzzle or
// Pray it) on a canvas behind everything else in it, so moving on —
// Next verse, Amen — never cuts it off.
// The fish code is loaded on demand.
//
// Steering: a fish chases its `target`. Entering, the target is kept a
// fixed distance ahead of the mouth; staying, each fish is given a
// resting point somewhere in the band below the verse, changed every
// few seconds.
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

      // Where the fish may be: below wherever the verse ends, above the
      // footer. Re-measured for the first couple of seconds, because the
      // verse may still be easing into its gathered position; kept as-is
      // once the verse is gone (Amen swaps it for the Amen card).
      // (Pray it has no verse element; the band then sits in the lower
      // part of the screen, below the Amen card.)
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
