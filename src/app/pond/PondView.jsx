import { useEffect, useRef } from 'react';
import { pondTarget } from '../compass/pondBehaviours.js';
import { paintCurrents, paintGodRays, paintShimmer } from './water.js';
import { WATER, Drifter, layoutPads } from './paint.js';
import { drawPad, Ripple } from './pads.js';
import { baseLayer, overLayer, causticSprite, paintCausticsFast, paintPadShadowFast } from './layers.js';
import { FoodBowl, feedGesture, markFed } from './koiFood.js';

// ═══════════════════════════════════════════════════════════════════
// PondView — the household's pond. Home, idle screen and record.
//
// One koi per person, in their own variety. Today's names float beside
// their koi in gold. Tap the water and it rings (and the koi answer as
// koi do: curious ones come, shy ones go); tap a koi and it says whose
// it is and their word this season; double-tap or hold to feed. Around
// the margin, a lily pad for every week of the season, and a lotus on
// each week whose verse was said by heart.
//
// The fish code loads after the first paint, so the page (its words and
// its one button) is usable before the koi arrive.
// ═══════════════════════════════════════════════════════════════════

const FAR = { x: -9999, y: -9999 };
const INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"], [data-no-feed]';

export default function PondView({ people, todayIds = [], words = {}, pads = [], light = 'day', season = 'autumn', paused = false, intention = null }) {
  const canvasRef = useRef(null);
  const live = useRef({});
  // The loop reads these each frame, so changing them never restarts it.
  live.current = { people, todayIds, words, pads, light, season, paused, intention };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, DPR = 1;
    let raf = 0;
    let dead = false;
    let t = 0;
    let fishMod = null;
    let koi = [];               // { id, fish, label: {x,y}, shown: frames }
    let builtFor = '';
    let padLayout = [];
    let padsFor = '';
    let drifters = [];
    let driftersFor = '';
    const ripples = [];
    const bowl = new FoodBowl({ scale: 1 });
    const cur = { ...FAR };
    let curUntil = 0;
    let stillKey = '';
    let keepOut = null;
    let base = null, over = null, sprite = null, layersFor = '';

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

    // ── Koi: one per person (or a few strangers on a new pond) ────────
    const buildKoi = () => {
      if (!fishMod) return;
      const { default: SpineFish, buildPondMixFromCounts, ShadingMode } = fishMod;
      ShadingMode.current = 'auto';
      const list = live.current.people.length
        ? live.current.people
        : [{ id: '_a', koi: 'chagoi', kind: 'adult' }, { id: '_b', koi: 'kohaku', kind: 'adult' }, { id: '_c', koi: 'ogon', kind: 'child' }];
      const key = list.map((p) => `${p.id}:${p.koi}:${p.kind}`).join('|');
      if (key === builtFor) return;
      builtFor = key;
      const size = live.current.intention ? Math.max(.22, Math.min(.64, Math.min(W, H) / 1000)) : Math.max(0.62, Math.min(1.15, Math.min(W, H) / 720));
      const old = new Map(koi.map((k) => [k.id, k]));
      koi = list.map((p) => {
        const prev = old.get(p.id);
        if (prev && prev.koi === p.koi) return prev;
        const [v] = buildPondMixFromCounts({ [p.koi]: 1 });
        const scale = (v.sizeScale || 1) * size * (p.kind === 'child' ? 0.82 : 1.05);
        const fish = new SpineFish(W, H, { ...v, sizeScale: scale });
        return { id: p.id, koi: p.koi, fish, label: null, shown: 0 };
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

    // ── Input: ripples, a koi's name, feeding ────────────────────────
    const toLocal = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      return x >= 0 && y >= 0 && x <= r.width && y <= r.height ? { x, y } : null;
    };
    const blocked = (e) => live.current.paused || (e.target instanceof Element && e.target.closest(INTERACTIVE));
    const offFeed = feedGesture({ bowl, toLocal, canStart: (e) => !blocked(e), onFeed: () => markFed() });

    let down = null;
    const onDown = (e) => {
      if (blocked(e)) return;
      const p = toLocal(e);
      if (!p) return;
      down = { ...p, t: performance.now() };
      cur.x = p.x; cur.y = p.y; curUntil = t + 40;
    };
    const onUp = (e) => {
      if (!down) return;
      const p = toLocal(e);
      const was = down;
      down = null;
      if (!p || Math.hypot(p.x - was.x, p.y - was.y) > 12 || performance.now() - was.t > 320) return;
      // Nearest koi under the finger shows who it is.
      let best = null, bd = 70 * Math.max(0.8, bowl.scale);
      for (const k of koi) {
        const d = Math.hypot(k.fish.head.x - p.x, k.fish.head.y - p.y);
        if (d < bd) { bd = d; best = k; }
      }
      if (best) { best.shown = 260; navigator.vibrate?.(6); }
      else if (!reduced) ripples.push(new Ripple(p.x, p.y));
    };
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });

    // ── The frame ─────────────────────────────────────────────────────
    // Adaptive quality: if frames run slow once the koi are swimming, drop
    // the blurred shadows and half the caustic light. Nobody chooses this.
    let lite = false;
    const times = [];
    let lastT = 0;
    let intentAt = 0, intentKey = "";
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
      if (L.paused || document.hidden) { lastT = 0; return; }
      watch(now);
      // Reduced motion: a still pond, redrawn only when something changes.
      if (reduced) {
        const key = `${W}x${H}:${koi.length}:${L.light}:${L.todayIds.join()}:${L.pads.length}:${L.intention?.board?.word}:${L.intention?.personId}:${L.intention?.event}`;
        if (key === stillKey) return;
        stillKey = key;
      }
      t++;
      const ts = t / 60;
      const pal = WATER[L.light] || WATER.day;
      const night = L.light === 'night';

      buildKoi();
      const padKey = `${W}x${H}:` + L.pads.map((p) => `${p.week}${p.lotus ? '*' : ''}`).join(',');
      if (padKey !== padsFor) { padsFor = padKey; padLayout = layoutPads(L.intention ? L.pads.slice(-3) : L.pads, W, H); }
      const dKey = `${L.season}:${W}`;
      if (dKey !== driftersFor) {
        driftersFor = dKey;
        const kind = L.season === 'autumn' ? 'leaf' : L.season === 'spring' ? 'petal' : null;
        const n = L.intention ? 0 : kind ? Math.round(Math.min(7, Math.max(3, W / 180))) : 0;
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

      // Pads' shadows sit on the water, under the fish.
      for (const p of padLayout) paintPadShadowFast(ctx, p.rx * W, p.ry * H, p.r, p.rot, t, p.phase);

      // Koi may pass under the words, but don't rest there: a resting
      // place inside the words' still water is moved out to its side.
      if (t % 20 === 0) {
        const el = document.querySelector('.water-words');
        const r0 = canvas.getBoundingClientRect();
        const r = el?.getBoundingClientRect();
        keepOut = r && r.width > 0 ? { x0: r.left - r0.left + r.width * 0.12, x1: r.right - r0.left - r.width * 0.12, y0: r.top - r0.top + r.height * 0.18, y1: r.bottom - r0.top - r.height * 0.18 } : null;
      }
      if (keepOut) {
        for (const k of koi) {
          const f = k.fish;
          const tg = f.target;
          if (!tg || f.feedTarget || bowl.wants(f) || f.fleeCooldown > 0) continue;
          if (tg.x > keepOut.x0 && tg.x < keepOut.x1 && tg.y > keepOut.y0 && tg.y < keepOut.y1) {
            const toLeft = tg.x - keepOut.x0 < keepOut.x1 - tg.x;
            tg.x = toLeft ? Math.max(40, keepOut.x0 - 70) : Math.min(W - 40, keepOut.x1 + 70);
            if (f.idleCenter) { f.idleCenter.x = tg.x; f.idleCenter.y = tg.y; }
          }
        }
      }

      // The board proposes slow destinations, leaving the proven body, fins,
      // curiosity and feeding in charge. No fish is teleported or scaled in motion.
      const intentionKey = `${L.intention?.board?.theme}:${L.intention?.personId}:${L.intention?.event}`;
      if (L.intention && (t >= intentAt || intentionKey !== intentKey)) {
        intentKey = intentionKey;
        intentAt = t + 240 + Math.round(Math.random() * 180);
        koi.forEach((k, index) => {
          const f = k.fish;
          if (f.feedTarget || bowl.wants(f) || f.fleeCooldown > 0 || !f.target) return;
          const gift = Math.floor(ts / 18);
          const personalTurn = !L.intention.personId && !L.intention.focus && gift % 2 === 1 && index === Math.floor(gift / 2) % koi.length;
          const theme = personalTurn ? L.intention.boards?.[k.id]?.theme || L.intention.board?.theme : L.intention.board?.theme || 'grow';
          const goal = pondTarget(theme, index, koi.length, ts, W, H, L.intention.focus);
          if (L.intention.personId === k.id) { goal.x = W * .47; goal.y = H * .78; }
          else if (L.intention.personId) goal.depth = .7;
          f.target.x = goal.x; f.target.y = goal.y;
          f.targetDepth = goal.depth; f.depthTimer = 500;
          f.wanderTimer = 0; f.isIdle = goal.rest;
          f.idleCenter = goal.rest ? { x: goal.x, y: goal.y } : null;
          if (goal.rest) f.idleDuration = 500;
        });
      }
      // Fish.
      bowl.update(koi.map((k) => k.fish));
      const pointer = t < curUntil ? cur : FAR;
      for (const k of koi) {
        k.fish.update(W, H, bowl.cursor(pointer), { food: bowl.foodFor(k.fish), onBreak: bowl.onBreak });
      }
      for (const k of koi) {
        ctx.save();
        if (L.intention?.personId && L.intention.personId !== k.id) ctx.globalAlpha = .3;
        k.fish.draw(ctx);
        ctx.restore();
      }
      bowl.draw(ctx);

      for (const p of padLayout) drawPad(ctx, p, W, H, t);
      for (const d of drifters) { d.update(W, H, t); d.draw(ctx, night); }
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].update();
        ripples[i].draw(ctx);
        if (ripples[i].isDead()) ripples.splice(i, 1);
      }

      paintShimmer(ctx, W, H, ts, pal);
      ctx.drawImage(over, 0, 0, W, H);

      // Names: today's in gold, always; anyone else's for a moment when
      // their koi is tapped, with their word.
      const byId = new Map(L.people.map((p) => [p.id, p]));
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const k of koi) {
        const person = byId.get(k.id);
        if (!person) continue;
        const today = !L.intention && L.todayIds.includes(k.id);
        if (L.intention) continue;
        if (k.shown > 0) k.shown--;
        const tapFade = Math.min(1, k.shown / 40);
        const alpha = Math.max(today ? 1 : 0, tapFade);
        if (alpha <= 0.01) { k.label = null; continue; }
        const hx = k.fish.head.x;
        const hy = k.fish.head.y + 30 * Math.max(0.8, bowl.scale);
        k.label = k.label ? { x: k.label.x + (hx - k.label.x) * 0.08, y: k.label.y + (hy - k.label.y) * 0.08 } : { x: hx, y: hy };
        const word = L.words[k.id];
        const text = (k.shown > 0 && word ? `${person.name} · ${word}` : person.name).toUpperCase();
        ctx.font = `600 ${Math.round(12 * Math.max(0.95, Math.min(1.3, bowl.scale)))}px "Literata Variable", Georgia, serif`;
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0.16em';
        const w = ctx.measureText(text).width + 20;
        ctx.globalAlpha = alpha * (night ? 0.8 : 0.9);
        ctx.fillStyle = night ? 'rgba(10, 14, 26, 0.6)' : 'rgba(10, 40, 42, 0.5)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(k.label.x - w / 2, k.label.y - 13, w, 26, 13);
        else ctx.rect(k.label.x - w / 2, k.label.y - 13, w, 26);
        ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = today ? (night ? '#e6c47e' : '#f3d58c') : '#f6f0e4';
        ctx.fillText(text, k.label.x, k.label.y + 0.5);
      }
      ctx.restore();
    };
    raf = requestAnimationFrame(frame);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      offFeed();
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  return <canvas ref={canvasRef} className="pond-canvas" aria-hidden="true" />;
}
