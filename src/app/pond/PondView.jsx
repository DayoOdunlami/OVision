import { lowerFirst } from '../board.js';
import { useEffect, useRef } from 'react';
import { paintCurrents, paintGodRays, paintShimmer } from './water.js';
import { WATER, Drifter, layoutPads } from './paint.js';
import { drawPad, Ripple, padMotion } from './pads.js';
import { baseLayer, overLayer, causticSprite, paintCausticsFast, paintPadShadowFast } from './layers.js';
import { FoodBowl, feedGesture, markFed } from './koiFood.js';
import { layoutYes, drawYesPad, drawStone } from './board.js';
import { Mind, gatherAt } from './behaviour.js';

// ═══════════════════════════════════════════════════════════════════
// PondView — the household's pond, and the family's board in it.
//
// One koi per person, in their own variety, moving by what their word
// means (behaviour.js). The family's word lies in the still water in
// the middle (the page's own words, over this canvas); every few
// minutes the koi gather round it. The yeses float on lily pads either
// side, and today's has a water lily open; the no each yes protects is
// a stone resting on the floor beneath it. A small pad for every week
// of the season round the margin, and a water lily on each week whose
// verse was said by heart.
//
// Nothing written ever rides on a fish. Touch a koi and it turns to
// your finger, and its name and word rest on the water where it was;
// touch a pad or a stone and its words do the same. Double-tap or hold
// to feed.
//
// The fish code loads after the first paint, so the page (its words and
// its buttons) is usable before the koi arrive.
// ═══════════════════════════════════════════════════════════════════

const FAR = { x: -9999, y: -9999 };
const INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"], [data-no-feed]';

export default function PondView(props) {
  const canvasRef = useRef(null);
  const live = useRef({});
  // The loop reads these each frame, so changing them never restarts it.
  live.current = props;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, DPR = 1;
    let raf = 0;
    let dead = false;
    let t = 0;
    let fishMod = null;
    let koi = [];               // { id, fish, mind, held }
    let builtFor = '';
    let padLayout = [];
    let yesLayout = [];
    let padsFor = '';
    let drifters = [];
    let driftersFor = '';
    const ripples = [];
    const captions = [];
    const bowl = new FoodBowl({ scale: 1 });
    const cur = { ...FAR };
    let curUntil = 0;
    let stillKey = '';
    let keepOut = null;
    let rim = null;
    let base = null, over = null, sprite = null, layersFor = '';
    let veil = null, veilFor = '';
    let momentFor = null;
    let momentAt = 0;
    const gatherOffset = Math.floor(Math.random() * 60 * 60 * 2);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      bowl.scale = Math.max(0.85, Math.min(1.3, Math.min(W, H) / 600));
      padsFor = '';
      driftersFor = '';
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const peopleOf = () => live.current.board?.people || live.current.people || [];

    // ── Koi: one per person (or a few strangers on a new pond) ────────
    const buildKoi = () => {
      if (!fishMod) return;
      const { default: SpineFish, buildPondMixFromCounts, ShadingMode } = fishMod;
      ShadingMode.current = 'auto';
      const people = peopleOf();
      const list = people.length
        ? people
        : [{ id: '_a', koi: 'chagoi', kind: 'adult', theme: 'growing' }, { id: '_b', koi: 'kohaku', kind: 'adult', theme: 'rest' }, { id: '_c', koi: 'ogon', kind: 'child', theme: 'shining' }];
      const key = list.map((p) => `${p.id}:${p.koi}:${p.kind}:${p.theme}`).join('|');
      if (key === builtFor) return;
      builtFor = key;
      const size = Math.max(0.62, Math.min(1.15, Math.min(W, H) / 720));
      const old = new Map(koi.map((k) => [k.id, k]));
      koi = list.map((p, i) => {
        const prev = old.get(p.id);
        let k = prev && prev.koi === p.koi ? prev : null;
        if (!k) {
          const [v] = buildPondMixFromCounts({ [p.koi]: 1 });
          const scale = (v.sizeScale || 1) * size * (p.kind === 'child' ? 0.82 : 1.05);
          k = { id: p.id, koi: p.koi, fish: new SpineFish(W, H, { ...v, sizeScale: scale }), held: false };
        }
        k.mind = new Mind(k, p, i);
        return k;
      });
    };

    import('./SpineFish.js').then((m) => {
      if (dead) return;
      fishMod = m;
      m.ShadowQuality.blur = true;
      buildKoi();
      if (reduced) {
        // Let them settle into place, then hold still.
        for (let i = 0; i < 90; i++) koi.forEach((k) => k.fish.update(W, H, FAR, { food: [], onBreak: () => {} }));
      }
    });

    // ── Input: ripples, a koi's name, a pad's words, feeding ─────────
    const toLocal = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      return x >= 0 && y >= 0 && x <= r.width && y <= r.height ? { x, y } : null;
    };
    const blocked = (e) => live.current.paused || (e.target instanceof Element && e.target.closest(INTERACTIVE));
    const offFeed = feedGesture({ bowl, toLocal, canStart: (e) => !blocked(e), onFeed: () => markFed() });

    // Words rest on still water: not over the page's own words, and only
    // one or two at a time.
    const say = (text, x, y) => {
      let cy = y;
      if (keepOut && x > keepOut.x0 - 60 && x < keepOut.x1 + 60 && cy > keepOut.y0 - 24 && cy < keepOut.y1 + 24) {
        cy = cy < (keepOut.y0 + keepOut.y1) / 2 ? keepOut.y0 - 30 : keepOut.y1 + 30;
      }
      for (let i = captions.length - 1; i >= 0; i--) if (captions[i].text === text) captions.splice(i, 1);
      if (captions.length > 1) captions.shift();
      captions.push({ text, x, y: Math.max(70, Math.min(H - 40, cy)), at: t });
    };

    let down = null;
    const nearestKoi = (p, reach) => {
      let best = null, bd = reach;
      for (const k of koi) {
        const d = Math.hypot(k.fish.head.x - p.x, k.fish.head.y - p.y);
        if (d < bd) { bd = d; best = k; }
      }
      return best;
    };
    const onDown = (e) => {
      if (blocked(e)) return;
      const p = toLocal(e);
      if (!p) return;
      down = { ...p, t: performance.now(), koi: nearestKoi(p, 70 * Math.max(0.8, bowl.scale)) };
      if (down.koi) { down.koi.held = true; down.koi.fish.isIdle = false; }
      else { cur.x = p.x; cur.y = p.y; curUntil = t + 40; }
    };
    const onMove = (e) => {
      if (!down?.koi) return;
      const p = toLocal(e);
      if (!p) return;
      // Your koi follows your finger.
      const f = down.koi.fish;
      f.target.x = p.x; f.target.y = p.y;
      f.energy = Math.max(f.energy, 0.5);
    };
    const onUp = (e) => {
      if (!down) return;
      const p = toLocal(e);
      const was = down;
      down = null;
      if (was.koi) {
        const k = was.koi;
        setTimeout(() => { k.held = false; }, 2500);
        const person = peopleOf().find((x) => x.id === k.id);
        if (person?.name) {
          say(person.word ? `${person.name} · ${person.word}` : person.name, k.fish.head.x, k.fish.head.y + 40);
          navigator.vibrate?.(6);
        }
        return;
      }
      if (!p || Math.hypot(p.x - was.x, p.y - was.y) > 12 || performance.now() - was.t > 320) return;
      for (const pad of yesLayout) {
        const { bob, drift } = padMotion(t, pad.phase);
        if (Math.hypot(pad.rx * W + drift - p.x, pad.ry * H + bob - p.y) < pad.r) {
          say(`Yes to ${lowerFirst(pad.text)}`, pad.rx * W, pad.ry * H + pad.r + 26);
          return;
        }
        if (pad.stone && Math.hypot(pad.rx * W + pad.stone.dx - p.x, pad.ry * H + pad.stone.dy - p.y) < pad.stone.s * 1.2) {
          say(`No to ${lowerFirst(pad.no)}, so yes to ${lowerFirst(pad.text)}`, pad.rx * W + pad.stone.dx, pad.ry * H + pad.stone.dy + pad.stone.s + 22);
          return;
        }
      }
      if (!reduced) ripples.push(new Ripple(p.x, p.y));
    };
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });

    // ── The frame ─────────────────────────────────────────────────────
    // Adaptive quality: if frames run slow once the koi are swimming, drop
    // the blurred shadows and half the caustic light. Nobody chooses this.
    let lite = false;
    const times = [];
    let lastT = 0;
    const watch = (now) => {
      if (lite || !fishMod || koi.length === 0) { lastT = now; return; }
      if (lastT) times.push(now - lastT);
      lastT = now;
      if (times.length === 40) {
        const sorted = [...times].sort((a, b) => a - b);
        if (sorted[20] > 24) { lite = true; fishMod.ShadowQuality.blur = false; }
        times.length = 0;
      }
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const L = live.current;
      if (L.paused) { lastT = 0; return; }
      watch(now);
      const board = L.board;
      // Reduced motion: a still pond, redrawn only when something changes.
      if (reduced) {
        const key = `${W}x${H}:${koi.length}:${L.light}:${(L.todayIds || []).join()}:${(L.pads || []).length}:${board?.word}:${L.focus}:${captions.length}:${L.moment?.at}`;
        if (key === stillKey) return;
        stillKey = key;
      }
      t++;
      const ts = t / 60;
      const pal = WATER[L.light] || WATER.day;
      const night = L.light === 'night';
      const focus = L.focus ? board?.people.find((p) => p.id === L.focus) : null;

      buildKoi();
      const yesList = focus ? (focus.yes ? [{ text: focus.yes, no: focus.no || '' }] : []) : board?.yes || [];
      const pads = L.pads || [];
      const padKey = `${W}x${H}:` + pads.map((p) => `${p.week}${p.lotus ? '*' : ''}`).join(',') + '|' + JSON.stringify(yesList);
      if (padKey !== padsFor) {
        padsFor = padKey;
        yesLayout = layoutYes(yesList, W, H);
        // Week pads keep clear of the yes pads: a slot that would sit
        // under one is skipped.
        const slots = layoutPads([...pads, ...Array.from({ length: 10 }, () => ({}))], W, H);
        const free = slots.filter((s) => !yesLayout.some((y) => Math.hypot((s.rx - y.rx) * W, (s.ry - y.ry) * H) < y.r + s.r * 0.7));
        padLayout = pads.map((w, i) => ({ ...free[i], key: w.week, r: free[i].r * 0.62, lotus: w.lotus ? { ...free[i].lotus || { ox: 0, oy: 0, size: 10 } } : undefined }))
          .map((p) => (p.lotus ? { ...p, lotus: { ox: p.r * 0.3, oy: -p.r * 0.25, size: p.r * 0.62 } } : p));
      }
      const dKey = `${L.season}:${W}`;
      if (dKey !== driftersFor) {
        driftersFor = dKey;
        // Fewer drifters than before: the pond is quieter (round 1: "busy").
        const kind = L.season === 'autumn' ? 'leaf' : L.season === 'spring' ? 'petal' : null;
        const n = kind ? Math.round(Math.min(4, Math.max(2, W / 300))) : 0;
        drifters = Array.from({ length: n }, (_, i) => new Drifter(W, H, kind, (i + 1) * 0.1371));
      }

      // What doesn't move is painted once (see layers.js).
      const lKey = `${W}x${H}x${DPR}:${L.light}:${L.season}`;
      if (lKey !== layersFor) {
        layersFor = lKey;
        base = baseLayer(W, H, DPR, pal, night);
        over = overLayer(W, H, DPR, pal, night, L.season === 'winter');
        sprite = causticSprite(pal.caustic);
      }
      ctx.drawImage(base, 0, 0, W, H);
      paintCurrents(ctx, W, H, ts, pal);
      if (L.light === 'day' || L.light === 'dawn') paintGodRays(ctx, W, H, ts, pal);
      const caustics = Math.round(Math.min(40, Math.max(14, (W * H) / 26000)) * (night ? 0.4 : 1) * (lite ? 0.5 : 1));
      paintCausticsFast(ctx, W, H, ts, sprite, caustics, pal.sparkle);

      // The finale of the ritual: koi arrive one at a time, then each no
      // is let go: its stone sinks and settles.
      const moment = L.moment;
      if (moment !== momentFor) {
        momentFor = moment;
        momentAt = t;
        yesLayout.forEach((p) => { p.rang = false; });
        if (moment?.kind === 'finale') {
          koi.forEach((k, i) => {
            k.arriveAt = t + 30 + i * 130;
            k.arrived = false;
            k.fish.shift(-W * 2, 0);
          });
        } else koi.forEach((k) => { k.arriveAt = 0; });
      }
      const nArrive = koi.length;
      const sinkFrom = moment?.kind === 'finale' ? 30 + nArrive * 130 + 60 : -1;

      // Stones lie on the floor, under everything that swims.
      yesLayout.forEach((p, i) => {
        if (!p.stone) return;
        let sink = 1;
        if (moment?.kind === 'finale') {
          const s0 = momentAt + sinkFrom + i * 90;
          sink = Math.max(0, Math.min(1, (t - s0) / 100));
          if (sink > 0 && !p.rang && !reduced) { p.rang = true; ripples.push(new Ripple(p.rx * W + p.stone.dx, p.ry * H + p.stone.dy - 40)); }
          if (sink <= 0) return;
        }
        drawStone(ctx, p, W, H, night, sink);
      });

      // Pads' shadows sit on the water, under the fish.
      for (const p of [...padLayout, ...yesLayout]) paintPadShadowFast(ctx, p.rx * W, p.ry * H, p.r, p.rot, t, p.phase);

      // The still water: where the page's words are.
      if (t % 20 === 1) {
        // The words' own extent (not the full-width block they sit in).
        const r0 = canvas.getBoundingClientRect();
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const el of document.querySelectorAll('.water-words > :not(.sr-only)')) {
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height || getComputedStyle(el).display === 'none') continue;
          x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
        }
        if (x1 > x0) {
          keepOut = { x0: x0 - r0.left - 12, x1: x1 - r0.left + 12, y0: y0 - r0.top - 10, y1: y1 - r0.top + 10 };
          const cx = (keepOut.x0 + keepOut.x1) / 2, cy = (keepOut.y0 + keepOut.y1) / 2;
          rim = { x: cx, y: cy, rx: Math.min(W / 2 - 40, (keepOut.x1 - keepOut.x0) / 2 + 90), ry: Math.min(H / 2 - 50, (keepOut.y1 - keepOut.y0) / 2 + 80) };
        } else { keepOut = null; rim = null; }
      }

      // Each koi chooses where it's heading, by its theme.
      const minds = koi.map((k) => k.mind).filter(Boolean);
      const pairs = new Map();
      const today = minds.filter((m) => (L.todayIds || []).includes(m.id));
      if (today.length >= 2 && !L.todayIds.includes('_all')) for (let i = 1; i < today.length; i++) pairs.set(today[i].id, today[0]);
      const env = {
        t, W, H, rim, minds, pairs,
        pads: yesLayout.map((p) => ({ x: p.rx * W, y: p.ry * H, r: p.r })),
        gather: focus || moment ? 0 : gatherAt(t, gatherOffset),
        familyTheme: board?.theme,
        focus: focus?.id || null,
        dayIndex: Math.floor(Date.now() / 864e5),
      };
      for (const m of minds) m.steer(env);

      // Koi may pass under the words, never rest there; passing, they go
      // deep, so the words stay clear.
      if (keepOut) {
        for (const k of koi) {
          const f = k.fish;
          const tg = f.target;
          if (!tg || f.feedTarget || bowl.wants(f) || f.fleeCooldown > 0 || k.held) continue;
          if (tg.x > keepOut.x0 && tg.x < keepOut.x1 && tg.y > keepOut.y0 && tg.y < keepOut.y1) {
            const toLeft = tg.x - keepOut.x0 < keepOut.x1 - tg.x;
            tg.x = toLeft ? Math.max(40, keepOut.x0 - 70) : Math.min(W - 40, keepOut.x1 + 70);
            if (f.idleCenter) { f.idleCenter.x = tg.x; f.idleCenter.y = tg.y; }
          }
          const hx = f.head.x, hy = f.head.y;
          if (hx > keepOut.x0 - 30 && hx < keepOut.x1 + 30 && hy > keepOut.y0 - 30 && hy < keepOut.y1 + 30) f.targetDepth = Math.max(f.targetDepth, 0.9);
        }
      }

      // Fish.
      bowl.update(koi.map((k) => k.fish));
      const pointer = t < curUntil ? cur : FAR;
      for (const k of koi) {
        if (k.arriveAt && t < k.arriveAt) continue;
        if (k.arriveAt && t >= k.arriveAt && !k.arrived) {
          // Swims in from the nearest edge, and says who it is.
          k.arrived = true;
          const f = k.fish;
          const fromLeft = koi.indexOf(k) % 2 === 0;
          f.shift((fromLeft ? -40 : W + 40) - f.head.x, H * (0.35 + 0.3 * Math.random()) - f.head.y);
          f.target.x = rim ? rim.x + (fromLeft ? -rim.rx : rim.rx) * 0.8 : W / 2;
          f.target.y = rim ? rim.y + rim.ry * 0.6 : H / 2;
          f.isIdle = false;
          const person = peopleOf().find((x) => x.id === k.id);
          if (person?.name) {
            // Named as they arrive, one at a time, just under the word.
            captions.length = 0;
            say(person.word ? `${person.name} · ${person.word}` : person.name, W / 2, keepOut ? keepOut.y1 + 34 : H * 0.6);
          }
        }
        k.fish.update(W, H, bowl.cursor(pointer), { food: bowl.foodFor(k.fish), onBreak: bowl.onBreak });
      }
      for (const k of koi) if (!k.arriveAt || t >= k.arriveAt) k.fish.draw(ctx);
      bowl.draw(ctx);
      // Still water over the words: a koi passing beneath them is seen
      // deep and soft, so nothing swims across what's written.
      if (keepOut) {
        const vk = `${lKey}:${Math.round(keepOut.x0 / 8)}:${Math.round(keepOut.y0 / 8)}:${Math.round(keepOut.x1 / 8)}:${Math.round(keepOut.y1 / 8)}`;
        if (vk !== veilFor) { veilFor = vk; veil = stillWater(base, W, H, DPR, keepOut, night); }
        ctx.drawImage(veil, 0, 0, W, H);
      }

      // A koi resting under a yes pad rocks it.
      for (const p of yesLayout) {
        p.rockV = p.rockV || 0; p.rock = p.rock || 0;
        for (const k of koi) {
          const d = Math.hypot(k.fish.head.x - p.rx * W, k.fish.head.y - p.ry * H);
          if (d < p.r * 0.9) p.rockV += 0.00012 * (1 - d / p.r) * (0.4 + k.fish.energy);
        }
        p.rockV += -p.rock * 0.01;
        p.rockV *= 0.96;
        p.rock = Math.max(-0.12, Math.min(0.12, p.rock + p.rockV));
      }

      for (const p of padLayout) if (p.rx != null) drawPad(ctx, p, W, H, t);
      const compact = L.compact;
      for (const p of yesLayout) drawYesPad(ctx, p, W, H, t, { labelled: !compact, today: !focus && L.todayYes && p.text === L.todayYes.text, night, rock: p.rock });
      for (const d of drifters) { d.update(W, H, t); d.draw(ctx, night); }
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].update();
        ripples[i].draw(ctx);
        if (ripples[i].isDead()) ripples.splice(i, 1);
      }

      paintShimmer(ctx, W, H, ts, pal);
      ctx.drawImage(over, 0, 0, W, H);

      // Words touched rest on still water, then sink away.
      for (let i = captions.length - 1; i >= 0; i--) {
        const c = captions[i];
        const age = (t - c.at) / 60;
        const a = reduced ? (age < 6 ? 1 : 0) : Math.min(1, age * 3, Math.max(0, (6.5 - age) / 0.8));
        if (age > 6.5) { captions.splice(i, 1); continue; }
        caption(ctx, c.text, c.x, c.y, a, night, W);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      offFeed();
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  return <canvas ref={canvasRef} className="pond-canvas" aria-hidden="true" />;
}


function caption(ctx, text, x, y, a, night, W) {
  ctx.save();
  const size = Math.round(Math.max(14, Math.min(18, W / 60)));
  ctx.font = `italic 500 ${size}px "Literata Variable", Georgia, serif`;
  const w = Math.min(W - 24, ctx.measureText(text).width + 30);
  const h = size + 20;
  const cx = Math.max(w / 2 + 12, Math.min(W - w / 2 - 12, x));
  ctx.globalAlpha = a;
  ctx.fillStyle = night ? 'rgba(10, 14, 26, 0.74)' : 'rgba(246, 240, 228, 0.88)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(cx - w / 2, y - h / 2, w, h, h / 2); else ctx.rect(cx - w / 2, y - h / 2, w, h);
  ctx.fill();
  ctx.fillStyle = night ? 'rgba(236, 226, 204, 0.94)' : '#1c2a26';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y + 1, w - 20);
  ctx.restore();
}

// The still water over the words: the plain water, laid over whatever
// swims beneath, strongest in the middle and fading at the edge.
function stillWater(base, W, H, DPR, k, night) {
  const c = document.createElement('canvas');
  c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
  const x = c.getContext('2d');
  x.drawImage(base, 0, 0);
  x.globalCompositeOperation = 'destination-in';
  x.setTransform(DPR, 0, 0, DPR, 0, 0);
  const cx = (k.x0 + k.x1) / 2, cy = (k.y0 + k.y1) / 2;
  const rx = (k.x1 - k.x0) / 2 * 1.36 + 30, ry = (k.y1 - k.y0) / 2 * 1.36 + 30;
  x.translate(cx, cy);
  x.scale(rx / ry, 1);
  const g = x.createRadialGradient(0, 0, 0, 0, 0, ry);
  const a = night ? 0.72 : 0.8;
  g.addColorStop(0, `rgba(0,0,0,${a})`);
  g.addColorStop(0.74, `rgba(0,0,0,${a * 0.92})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(-ry * 2, -ry * 2, ry * 4, ry * 4);
  return c;
}
