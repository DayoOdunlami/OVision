import { buildVine, grownLength, seeded, stem } from './vine.js';
import { drawStem, bakeStem, drawLeaf, drawBloom } from './draw.js';
import { Wind } from './wind.js';
import { Ambient } from './ambient.js';

// ═══════════════════════════════════════════════════════════════════
// The vine — the family's board as a vine in a field.
//
// "I am the vine; you are the branches" (John 15:5). The vine itself
// is never named: it rises from the soil and, as it grows, writes the
// family's word along the trellis wire. Each person is a branch abiding
// in it, shaped by what their word means to them, and ending in a
// blossom in their own colour.
//
//   our yeses     tags on the trellis posts: the rule of life that holds
//                 the vine up. Today's yes: a tendril has found its post
//                 and wound round it.
//   our nos       a pruned spur on the vine, with a new shoot just below
//                 the cut, and the cutting lying at its foot (John 15:2)
//   what grew     a cluster for each week of the season, ripening as the
//                 season goes; a flower for each verse said by heart
//   prayed for    a white flower on their branch, their name in the sky
//
// One light (the real clock), one wind (wind.js), three depths: sky,
// the far hill, the near ground. Everything that moves is the wind, a
// hand, or growth. Nothing is labelled at rest on a phone except what
// the page's own words say; on a tablet the tags and names, which stay
// still, carry their words.
// ═══════════════════════════════════════════════════════════════════

// ── Sky, by the clock (from Abide's scene on main) ──────────────────
const SKY = [
  [0, '#24304a', '#3b4563'],
  [4.8, '#2c3754', '#4f4f6c'],
  [6.3, '#efcab0', '#f8e4d2'],
  [8.5, '#dfe9e6', '#f4f1e6'],
  [16.5, '#e3eae2', '#f6f1e4'],
  [18.6, '#f0c3a1', '#f6dfca'],
  [20, '#38405e', '#5a5672'],
  [24, '#24304a', '#3b4563'],
];
const SEASON_TINT = {
  spring: [[236, 244, 230], 0.25],
  summer: [[226, 238, 244], 0.2],
  autumn: [[246, 228, 200], 0.3],
  winter: [[228, 234, 242], 0.35],
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixc = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

export function skyAt(h, season) {
  h = ((h % 24) + 24) % 24;
  let i = 0;
  while (i < SKY.length - 2 && SKY[i + 1][0] <= h) i++;
  const [h0, t0, b0] = SKY[i], [h1, t1, b1] = SKY[i + 1];
  const k = smooth(0, 1, (h - h0) / (h1 - h0));
  let top = mixc(hex(t0), hex(t1), k), bottom = mixc(hex(b0), hex(b1), k);
  const lum = (0.299 * top[0] + 0.587 * top[1] + 0.114 * top[2]) / 255;
  const night = clamp01((0.62 - lum) / 0.3);
  const tint = SEASON_TINT[season];
  if (tint) {
    const day = 1 - night;
    top = mixc(top, tint[0], tint[1] * day);
    bottom = mixc(bottom, tint[0], tint[1] * 0.6 * day);
  }
  return { top, bottom, night };
}

// What the family's word means sets what the whole vine bears.
const FAMILY_BLOOM = { rest: 'jasmine', together: 'blossom', growing: 'blossom', shining: 'blossom', giving: 'blossom', steadfast: 'jasmine' };
// How much each branch gives to the wind.
const SWAY = { rest: 0.05, together: 0.03, growing: 0.035, shining: 0.03, giving: 0.022, steadfast: 0.008 };

const INK = '#2F3A2C';
const INK_NIGHT = '#ece2cc';

export class VineScene {
  constructor({ reduced = false } = {}) {
    this.reduced = reduced;
    this.wind = new Wind({ reduced });
    this.amb = null;
    this.t = reduced ? 1e6 : 0;
    this.W = 0; this.H = 0; this.dpr = 1;
    this.bake = document.createElement('canvas');
    this.bctx = this.bake.getContext('2d');
    this.key = '';
    this.taps = [];
    this.pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, at: -10 };
    this.lift = new Map();     // person index → how far their branch is lifted towards a touch
  }

  setSize(W, H, dpr) {
    this.W = W; this.H = H; this.dpr = dpr;
    this.bake.width = Math.round(W * dpr);
    this.bake.height = Math.round(H * dpr);
    this.key = '';
  }

  // props: { board, todayIds, todayYes, weeks, heart, progress, hour,
  //          season, compact, focus, grown }
  set(props) {
    this.props = props;
    const b = props.board || { word: '', yes: [], people: [] };
    const key = JSON.stringify([this.W, this.H, b.word, b.theme, b.yes, b.people.map((p) => [p.id, p.theme, p.koi]), props.todayIds,
      props.todayYes?.index, props.weeks, props.heart, props.season, props.compact, props.focus, props.moment?.at]);
    if (key !== this.key) {
      // The ritual's finale: the board is born. The vine grows from
      // nothing, a branch for each person with their name, and then each
      // no is pruned: the cutting falls.
      const born = props.moment?.kind === 'finale' && props.moment.at !== this.momentAt;
      if (born) { this.momentAt = props.moment.at; this.t = this.reduced ? 1e6 : 0; }
      this.finale = props.moment?.kind === 'finale';
      this.key = key;
      this.build(born);
    }
  }

  build(born = false) {
    const { W, H } = this;
    const P = this.props;
    const b = P.board || { word: '', yes: [], people: [] };
    const portrait = H > W * 1.05;
    this.portrait = portrait;
    const rand = seeded('field ' + (b.word || ''));
    this.rand = rand;

    // Ground: a gentle rise and fall along the foot of the screen.
    const soilY = H * (portrait ? 0.8 : 0.86);
    const ph = rand() * 6;
    this.soilY = soilY;
    this.edge = (x) => soilY + Math.sin(x * 0.0042 + ph) * H * 0.008 + Math.sin(x * 0.011 + ph * 2) * H * 0.003;
    if (!this.amb || this.amb.season !== P.season) this.amb = new Ambient({ season: P.season || 'autumn', reduced: this.reduced });
    this.amb.resize(W, soilY, this.edge);

    // The vine: the word along the upper part, the family's branches
    // hanging either side of the trunk.
    const focus = P.focus ? b.people.find((p) => p.id === P.focus) : null;
    const box = portrait
      ? { x: W * 0.04, y: H * 0.19, w: W * 0.92, h: H * 0.42 }
      : { x: W * 0.14, y: H * 0.26, w: W * 0.72, h: H * 0.5 };
    const word = (focus ? focus.word || focus.name : b.word) || '…';
    const theme = focus ? focus.theme : b.theme;
    const family = focus ? null : b.people.map((p) => ({
      label: p.name, theme: p.theme, tint: p.tint, today: (P.todayIds || []).includes(p.id),
    }));
    // The family's vine bears the season's fruit; someone's own word bears
    // what their theme bears, in their colour.
    const vine = buildVine(word, box, focus ? {
      bloom: theme === 'giving' ? 'grapes' : theme === 'rest' || theme === 'steadfast' ? 'jasmine' : 'blossom',
      amount: theme === 'shining' ? 'many' : theme === 'growing' ? 'few' : 'some',
    } : {
      family, trunkGap: 0.14, pace: this.finale ? 1.9 : 1,
      bloom: 'grapes', amount: 'prayer', prayerDays: Math.min(portrait ? 3 : 5, Math.ceil(Math.max(0, P.weeks | 0) / 2) + (theme === 'giving' ? 1 : 0)),
    });
    if (vine && focus) for (const bl of vine.blossoms) if (bl.kind === 'blossom') bl.tint = focus.tint;
    this.vine = vine;
    if (!vine) return;
    if (theme === 'steadfast') for (const st of vine.stems) if (!st.branch && !st.tendril) { st.w0 *= 1.25; st.w1 *= 1.25; }
    // The vine's fruit ripens with the season, not with effort; the
    // grapes on a person's giving branch ripen the same way.
    const ripeTo = 0.5 + 2.7 * clamp01(P.progress ?? 0.4);
    for (const bl of vine.blossoms) if (bl.kind === 'grapes') bl.ripeTo = ripeTo;
    // A flower for each verse said by heart, of the kind the family's
    // word bears, set just off the stems where there's room.
    const mains = vine.stems.filter((s) => !s.branch && !s.tendril);
    const kind = FAMILY_BLOOM[theme] || 'blossom';
    const extra = [];
    for (let tries = 0; !focus && extra.length < Math.min(8, P.heart | 0) && tries < 400; tries++) {
      const st = mains[Math.floor(rand() * mains.length)];
      const i = Math.floor(rand() * st.pts.length);
      const side = rand() < 0.5 ? -1 : 1;
      const x = st.pts[i][0] + st.nx[i] * side * vine.em * 0.07, y = st.pts[i][1] + st.ny[i] * side * vine.em * 0.07;
      const rr = vine.em * 0.06;
      if ([...vine.blossoms, ...extra].some((o) => Math.hypot(o.x - x, (o.kind === 'grapes' ? o.y + o.r * 1.4 : o.y) - y) < (o.r + rr) * 1.5)) continue;
      if (vine.leaves.some((lf) => Math.hypot(lf.mid[0] - x, lf.mid[1] - y) < rr + lf.L * 0.3)) continue;
      extra.push({ kind, x, y, r: rr, rot: rand() * 3, t0: st.tt[i] + 1.5, phase: rand() * 6 });
    }
    vine.blossoms.push(...extra);
    this.base = vine.base;
    this.em = vine.em;

    // The trunk: up out of the soil to the lowest stretch of the word
    // near the middle.
    const cx = box.x + box.w / 2;
    let top = null, best = Infinity;
    for (const st of mains) for (let i = 0; i < st.pts.length; i += 2) {
      const [x, y] = st.pts[i];
      const s = Math.abs(x - cx) * 1.2 + (vine.bottom - y);
      if (s < best) { best = s; top = [x, y]; }
    }
    const foot = [cx + vine.em * 0.08, this.edge(cx) + 6];
    const lean = (rand() < 0.5 ? -1 : 1) * vine.em * (0.25 + rand() * 0.2);
    const trunkPts = [];
    for (let j = 0; j <= 40; j++) {
      const u = j / 40, v = 1 - u;
      const c1 = [foot[0] + lean, foot[1] - (foot[1] - top[1]) * 0.35];
      const c2 = [top[0] - lean * 0.8, top[1] + (foot[1] - top[1]) * 0.35];
      trunkPts.push([
        v * v * v * foot[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * top[0],
        v * v * v * foot[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * top[1],
      ]);
    }
    this.trunk = { pts: trunkPts, w0: vine.base * 6, w1: vine.base * 2.4 };

    // The trellis: one wire at the foot of the word, posts carrying the
    // yeses' tags.
    const wireY = Math.min(vine.bottom - vine.em * 0.06, soilY - H * 0.12);
    this.wireY = wireY;
    const yes = (focus ? (focus.yes ? [{ text: focus.yes }] : []) : b.yes) || [];
    const slots = portrait
      ? [[0.9], [0.08, 0.92], [0.07, 0.31, 0.93]][yes.length - 1] || []
      : [[0.94], [0.06, 0.94], [0.06, 0.3, 0.94]][yes.length - 1] || [];
    this.posts = slots.map((u, j) => {
      const x = W * u;
      return { x, top: wireY - vine.em * 0.12, foot: this.edge(x) + 8, yes: yes[j], index: j };
    });
    this.wire = this.posts.length
      ? [Math.min(W * 0.03, ...this.posts.map((p) => p.x)), Math.max(W * 0.97, ...this.posts.map((p) => p.x))]
      : [W * 0.1, W * 0.9];

    // The nos: a pruned spur on the trunk for each, with a new shoot just
    // below the cut; the cutting lies at the foot.
    const nos = focus ? (focus.no ? [focus.no] : []) : b.yes.filter((y) => y.no).map((y) => y.no);
    this.nos = nos.slice(0, 2).map((text, j) => {
      const u = j === 0 ? 0.42 : 0.66;
      const i = Math.round(u * 40);
      const [x, y] = trunkPts[i];
      const side = j === 0 ? -1 : 1;
      const L = vine.em * 0.11;
      const ang = -Math.PI / 2 + side * 1.15;
      const cut = [x + Math.cos(ang) * L, y + Math.sin(ang) * L];
      const lx = cx + side * Math.min(W * 0.3, vine.em * (1.1 + j * 0.3));
      return {
        text, x, y, side, cut, ang,
        // The new shoot, lime, out of the spur just below the cut.
        shoot: { x: x + Math.cos(ang) * L * 0.5, y: y + Math.sin(ang) * L * 0.5, ang: ang - side * 0.7, L: vine.em * 0.24 },
        cutting: { x: lx, y: this.edge(lx) + H * 0.03, rot: side * (0.15 + rand() * 0.2), L: vine.em * 0.3 },
      };
    });

    // Today's yes: a tendril from the vine along the wire to its post,
    // wound round the top of it.
    const ty = P.todayYes && this.posts.find((p) => p.yes && p.yes.text === P.todayYes.text);
    this.todayPost = ty || null;
    if (ty) {
      let from = null, bd = Infinity;
      for (const st of mains) for (let i = 0; i < st.pts.length; i += 3) {
        const [x, y] = st.pts[i];
        const d = Math.abs(x - ty.x) + Math.abs(y - wireY) * 2;
        if (d < bd) { bd = d; from = [x, y]; }
      }
      const to = [ty.x, ty.top + vine.em * 0.05];
      const pts = [];
      for (let j = 0; j <= 30; j++) {
        const u = j / 30, v = 1 - u;
        const c = [(from[0] + to[0]) / 2, Math.max(from[1], to[1]) + vine.em * 0.1];
        pts.push([v * v * from[0] + 2 * v * u * c[0] + u * u * to[0], v * v * from[1] + 2 * v * u * c[1] + u * u * to[1]]);
      }
      this.reach = stem(pts, { w0: vine.base * 0.4, w1: vine.base * 0.25 });
      // Each time the board is opened, today's tendril is seen finding
      // its post: one small thing that's new today.
      const from0 = P.grown && !born ? Math.max(this.t, vine.doneAt + 4) + 1.2 : vine.doneAt + 1;
      this.reach.t0 = from0; this.reach.tEnd = from0 + 3;
    } else this.reach = null;

    this.labelFont = Math.round(Math.max(13, Math.min(17, W / 70)));
    this.stars = Array.from({ length: Math.round(W / 9) }, () => [rand(), rand() * 0.75, 0.5 + rand() * 1.1, rand() * 6]);
    this.bctx.setTransform(1, 0, 0, 1, 0, 0);
    this.bctx.clearRect(0, 0, this.bake.width, this.bake.height);
    this.bctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    for (const st of vine.stems) { st.bakedAll = false; st.bakeFrom = 0; }
    if (P.grown && !born && !this.finale) this.t = Math.max(this.t, vine.doneAt + 4);
    this.fallFrom = vine.doneAt + 0.5;
  }

  // A touch: who or what is here?
  hit(x, y) {
    const v = this.vine;
    if (!v) return null;
    const P = this.props, b = P.board;
    for (const p of this.posts) {
      if (!p.yes) continue;
      const tag = this.tagRect(p);
      if (x > tag.x - 10 && x < tag.x + tag.w + 10 && y > tag.y - 14 && y < tag.y + tag.h + 10) return { kind: 'yes', text: p.yes.text, x: p.x, y: tag.y - 8 };
    }
    for (const n of this.nos) {
      const c = n.cutting;
      if (Math.hypot(x - c.x, y - c.y) < Math.max(36, c.L * 0.6) || Math.hypot(x - n.cut[0], y - n.cut[1]) < 30) return { kind: 'no', text: n.text, x: c.x, y: c.y - 30 };
    }
    if (!P.focus) {
      let best = null, bd = 56;
      for (const st of v.stems) {
        if (!st.branch || st.person === undefined || st.tendril) continue;
        for (let i = Math.floor(st.pts.length * 0.4); i < st.pts.length; i += 3) {
          const d = Math.hypot(st.pts[i][0] - x, st.pts[i][1] - y);
          if (d < bd) { bd = d; best = st; }
        }
      }
      if (best) {
        const person = b.people[best.person];
        const end = best.pts[best.pts.length - 1];
        this.lift.set(best.person, 1);
        return { kind: 'person', id: person.id, text: person.word ? `${person.name} · ${person.word}` : person.name, x: end[0], y: end[1] + v.em * 0.32 };
      }
    }
    return null;
  }

  // Show a word on still air for a few seconds where it was touched.
  say(h) {
    if (!h) return;
    this.taps = this.taps.filter((s) => s.text !== h.text).slice(-1);
    this.taps.push({ ...h, at: this.t });
  }

  move(x, y) {
    const p = this.pointer;
    const gap = Math.max(1 / 120, this.t - p.at);
    if (p.x > -1e3) { p.vx = (x - p.x) / gap; p.vy = (y - p.y) / gap; }
    p.x = x; p.y = y; p.at = this.t;
  }

  step(dt, { calm = 1 } = {}) {
    if (this.reduced) { this.t = 1e6; return; }
    // The finale is watched by a family standing round a tablet: it
    // grows a little faster than life.
    this.t += dt * (this.finale ? 1.7 : 1);
    const theme = this.props?.board?.theme;
    this.wind.step(dt, { calm: calm * (theme === 'rest' ? 0.75 : 1) });
    this.amb?.step(dt, this.wind, { mode: this.props?.idle ? 'vineyard' : 'intro', quiet: false });
    for (const [k, v] of this.lift) { const n = v - dt / 3; if (n <= 0) this.lift.delete(k); else this.lift.set(k, n); }
  }

  tagRect(p) {
    const P = this.props;
    const labelled = !P.compact;
    const ctxM = this._m || (this._m = document.createElement('canvas').getContext('2d'));
    ctxM.font = `italic 500 ${this.labelFont}px "Literata Variable", Georgia, serif`;
    const w = labelled && p.yes ? Math.min(this.W * 0.3, ctxM.measureText(p.yes.text).width + 22) : 30;
    const h = labelled ? this.labelFont + 16 : 20;
    const y = this.wireY + (p.foot - this.wireY) * (P.compact ? 0.6 : 0.72);
    let x = p.x - w / 2;
    x = Math.max(6, Math.min(this.W - w - 6, x));
    return { x, y, w, h, labelled };
  }

  // The sky keeps to the same light as the paper and its words (the
  // app's `light`): at 06:45 in autumn the page is still night, so is
  // the sky, and the words on it stay readable.
  hourFor(P) {
    const h = P.hour ?? 12;
    const n = skyAt(h, P.season).night;
    if (P.light === 'night' && n < 0.8) return h < 12 ? 4.6 : 21;
    if (P.light && P.light !== 'night' && n > 0.3) return h < 12 ? 6.4 : 18.8;
    return h;
  }

  draw(ctx) {
    const { W, H, t } = this;
    const v = this.vine;
    const P = this.props || {};
    const hour = this.hourFor(P);
    const sky = skyAt(hour, P.season);
    const night = sky.night;
    const dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Sky, sun or moon, and the far hill: painted once for the hour, then
    // laid down as one image (cheap on an ordinary tablet).
    const skyKey = `${W}x${H}x${dpr}:${Math.round(hour * 20)}:${P.season}:${this.key.length}`;
    if (skyKey !== this.skyFor) {
      this.skyFor = skyKey;
      const c = this.skyC || (this.skyC = document.createElement('canvas'));
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      const x = c.getContext('2d');
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sk = x.createLinearGradient(0, 0, 0, this.soilY);
      sk.addColorStop(0, rgb(sky.top));
      sk.addColorStop(1, rgb(sky.bottom));
      x.fillStyle = sk;
      x.fillRect(0, 0, W, H);
      this.drawLight(x, sky, hour);
      this.skyHill = sky;
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.skyC, 0, 0);
    ctx.restore();
    if (night > 0) {
      ctx.fillStyle = '#fff8e6';
      for (const [sx, sy, sr, ph] of this.stars) {
        ctx.globalAlpha = night * (0.4 + 0.3 * Math.sin(t * 0.6 + ph));
        ctx.beginPath();
        ctx.arc(sx * W, sy * this.soilY, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    this.amb?.drawSky(ctx, night);
    this.drawHill(ctx, sky);

    if (!v) {
      // An empty field, waiting for the word.
      this.drawGround(ctx, night);
      this.amb?.drawGrass(ctx, this.wind, night);
      return;
    }
    // The trellis behind the vine.
    this.drawTrellis(ctx, night);
    // Ground.
    this.drawGround(ctx, night);
    this.nos.forEach((n, j) => {
      const k = this.finale ? clamp01((t - this.fallFrom - j * 1.6) / 1.2) : 1;
      if (k <= 0) return;
      const c = n.cutting;
      const e = k * k;
      this.drawCutting(ctx, { ...c, x: n.cut[0] + (c.x - n.cut[0]) * e, y: n.cut[1] + (c.y - n.cut[1]) * e, rot: c.rot * e + n.ang * (1 - e) }, night);
    });
    this.amb?.drawGrass(ctx, this.wind, night);
    // The trunk, rooted.
    ctx.globalAlpha = this.finale ? clamp01(t / 2) : 1;
    this.drawTrunk(ctx, night);
    for (const n of this.nos) this.drawSpur(ctx, n, night);
    ctx.globalAlpha = 1;

    // The word's stems: matured stretches are baked once.
    const taper = v.base * 4;
    const live = [];
    for (const st of v.stems) {
      const g = grownLength(st, t);
      if (g <= 0) continue;
      const moving = (st.branch && st.person !== undefined) || st.branchOf;
      if (moving) { live.push([st, g]); continue; }
      const from = bakeStem(this.bctx, st, g, t, taper);
      if (!st.bakedAll) live.push([st, g, from, true]);
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.bake, 0, 0);
    ctx.restore();
    for (const [st, g, from, still] of live) if (still) drawStem(ctx, st, g, t, taper, from);

    // Leaves and blooms on the word, swaying in the one wind; a hand
    // passing ruffles them.
    for (const lf of v.leaves) if (!lf.st) this.leaf(ctx, lf);
    for (const bl of v.blossoms) if (!bl.st) this.bloom(ctx, bl);

    // Branches: each sways from where it joins the vine, by its theme;
    // a touched one lifts towards the hand.
    for (const st of v.stems) {
      if (!st.branch || st.person === undefined || st.tendril) continue;
      const A = st.root;
      const lift = (this.lift.get(st.person) || 0);
      const ang = this.wind.sway(A[0], SWAY[st.theme] || 0.03, st.person * 0.37) - lift * 0.08 * Math.sign(st.pts[st.pts.length - 1][0] - A[0] || 1);
      ctx.save();
      ctx.translate(A[0], A[1]);
      ctx.rotate(ang);
      ctx.translate(-A[0], -A[1]);
      for (const [s2, g] of live) if (s2 === st || s2.branchOf === st) drawStem(ctx, s2, g, t, taper);
      for (const lf of v.leaves) if (lf.st === st) this.leaf(ctx, lf);
      for (const bl of v.blossoms) if (bl.st === st) this.bloom(ctx, bl);
      st.angle = ang;
      ctx.restore();
    }
    // The together-tendrils that cross between branches.
    if (this.reach) this.drawReach(ctx);

    // Tags on the posts, in front: the yeses.
    for (const p of this.posts) this.drawTag(ctx, p, night);

    // Night lies over the whole field.
    if (night > 0) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(10, 14, 32, 0)');
      g.addColorStop(0.3, `rgba(10, 14, 32, ${0.12 * night})`);
      g.addColorStop(1, `rgba(10, 14, 32, ${0.34 * night})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // Names at the branch ends, still, on a tablet; on a phone only
    // when touched.
    if ((!P.compact || this.finale) && !P.focus) {
      ctx.save();
      ctx.font = `italic 500 ${Math.round(this.labelFont * 1.05)}px "Literata Variable", Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (const l of v.labels) {
        const a = clamp01((t - l.t0) / 1.5);
        if (a <= 0) continue;
        const end = l.st.pts[l.st.pts.length - 1];
        const today = (P.todayIds || []).includes(P.board.people[l.st.person]?.id);
        ctx.globalAlpha = a * 0.92;
        ctx.fillStyle = today ? (night > 0.5 ? '#e6c47e' : '#87591a') : night > 0.5 ? INK_NIGHT : INK;
        ctx.fillText(l.text, end[0], end[1] + v.em * 0.14);
      }
      ctx.restore();
    }

    // A touched thing's words, on still air.
    for (const s of this.taps) {
      const age = t - s.at;
      const a = Math.min(1, age * 3, Math.max(0, (6.5 - age) / 0.8));
      if (a <= 0) continue;
      this.caption(ctx, s.text, s.x, s.y, a, night);
    }
    this.taps = this.taps.filter((s) => t - s.at < 6.5);
  }

  leaf(ctx, lf) {
    const t = this.t;
    const p = (t - lf.t0) / lf.dur;
    if (p <= 0) return;
    const pt = this.pointer;
    if (!this.reduced) {
      const R = this.em * 0.32;
      const mx = lf.x + Math.cos(lf.ang) * lf.L * 0.6;
      const my = lf.y + Math.sin(lf.ang) * lf.L * 0.6;
      const d = Math.hypot(mx - pt.x, my - pt.y);
      if (t - pt.at < 0.12 && d < R) {
        const cross = (pt.vx * -Math.sin(lf.ang) + pt.vy * Math.cos(lf.ang)) / this.em;
        lf.av += cross * 7 * (1 - d / R) * 0.016;
      }
      lf.av += -lf.off * 18 * 0.016;
      lf.av *= Math.exp(-0.016 * 3.2);
      lf.off = Math.max(-0.7, Math.min(0.7, lf.off + lf.av * 0.016));
    }
    const settle = this.reduced ? 0 : Math.min(1, Math.max(0, p - 1));
    const sway = settle * this.wind.sway(lf.x, 0.12, lf.phase);
    drawLeaf(ctx, lf, p, sway + lf.off, this.base, t);
  }

  bloom(ctx, bl) {
    let p = (this.t - bl.t0) / 3;
    if (bl.kind === 'grapes' && bl.ripeTo) p = Math.min(p, bl.ripeTo);
    drawBloom(ctx, bl, p, this.reduced ? 0 : this.t);
  }

  drawLight(ctx, sky, hour) {
    const { W } = this;
    const h = ((hour % 24) + 24) % 24;
    const soilY = this.soilY;
    const arc = (u) => [W * (0.08 + 0.84 * u), soilY - Math.sin(Math.PI * u) * (soilY - 90) * 0.92];
    const R = Math.max(16, Math.min(40, W * 0.03));
    // Sun and moon keep out from behind the word.
    const v = this.vine;
    const fade = (x, y) => (v && y > v.top - R * 2 && y < v.bottom + R && x > W * 0.08 && x < W * 0.92 ? 0.25 : 1);
    if (h >= 5.8 && h <= 19.6) {
      const [x, y] = arc((h - 5.8) / 13.8);
      ctx.globalAlpha = fade(x, y);
      const glow = ctx.createRadialGradient(x, y, R * 0.2, x, y, R * 3.2);
      glow.addColorStop(0, 'rgba(255,220,150,0.5)');
      glow.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - R * 3.2, y - R * 3.2, R * 6.4, R * 6.4);
      ctx.fillStyle = '#f7cf78';
      ctx.beginPath();
      ctx.arc(x, y, R * 0.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const hn = h > 19.6 ? h - 19.6 : h + 4.4;
      const [x, y] = arc(hn / 10.2);
      ctx.globalAlpha = fade(x, y);
      const glow = ctx.createRadialGradient(x, y, R * 0.2, x, y, R * 2.6);
      glow.addColorStop(0, 'rgba(240,236,214,0.32)');
      glow.addColorStop(1, 'rgba(240,236,214,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - R * 2.6, y - R * 2.6, R * 5.2, R * 5.2);
      ctx.fillStyle = '#f2ecd8';
      ctx.beginPath();
      ctx.arc(x, y, R * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = rgb(mixc(sky.top, sky.bottom, clamp01(y / soilY)));
      ctx.beginPath();
      ctx.arc(x + R * 0.32, y - R * 0.12, R * 0.62, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // The far hill: one soft line of country behind the field.
  drawHill(ctx, sky) {
    const { W, H } = this;
    const y0 = this.soilY - H * (this.portrait ? 0.07 : 0.1);
    const c = mixc(mixc(sky.bottom, [120, 150, 120], 0.35), [40, 50, 70], sky.night * 0.6);
    ctx.fillStyle = rgb(c, 0.55);
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 12) ctx.lineTo(x, y0 + Math.sin(x * 0.0036 + 1.2) * H * 0.025 + Math.sin(x * 0.0091) * H * 0.01);
    ctx.lineTo(W, H);
    ctx.fill();
  }

  drawGround(ctx, night) {
    const { W, H } = this;
    const g = ctx.createLinearGradient(0, this.soilY - 10, 0, H);
    const top = mixc([150, 162, 104], [40, 48, 60], night * 0.7);
    const mid = mixc([118, 120, 78], [30, 34, 44], night * 0.7);
    const low = mixc([104, 82, 58], [24, 22, 30], night * 0.7);
    g.addColorStop(0, rgb(top));
    g.addColorStop(0.35, rgb(mid));
    g.addColorStop(1, rgb(low));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, this.edge(x));
    ctx.lineTo(W, H);
    ctx.fill();
  }

  drawTrunk(ctx, night) {
    const { pts, w0, w1 } = this.trunk;
    const n = pts.length;
    const L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      const h = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const u = i / (n - 1);
      const w = (w0 + (w1 - w0) * u) * (1 + 0.12 * Math.sin(u * 17)) / 2;
      L.push([pts[i][0] - Math.sin(h) * w, pts[i][1] + Math.cos(h) * w]);
      R.push([pts[i][0] + Math.sin(h) * w, pts[i][1] - Math.cos(h) * w]);
    }
    const bark = mixc([110, 84, 60], [38, 34, 40], night * 0.6);
    const dark = mixc([72, 52, 38], [24, 22, 28], night * 0.6);
    const g = ctx.createLinearGradient(pts[0][0] - w0, 0, pts[0][0] + w0, 0);
    g.addColorStop(0, rgb(dark));
    g.addColorStop(0.45, rgb(bark));
    g.addColorStop(1, rgb(dark));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(L[0][0], L[0][1]);
    for (const p of L) ctx.lineTo(p[0], p[1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath();
    ctx.fill();
    // Bark: a few long, twisting lines.
    ctx.strokeStyle = rgb(dark, 0.55);
    ctx.lineWidth = 1;
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      for (let i = 2; i < n - 2; i++) {
        const f = 0.5 + k * 0.28 + Math.sin(i * 0.5 + k) * 0.08;
        const x = L[i][0] + (R[i][0] - L[i][0]) * f, y = L[i][1] + (R[i][1] - L[i][1]) * f;
        if (i === 2) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  drawSpur(ctx, n, night) {
    const bark = rgb(mixc([104, 80, 58], [38, 34, 40], night * 0.6));
    ctx.save();
    ctx.strokeStyle = bark;
    ctx.lineCap = 'butt';
    ctx.lineWidth = this.base * 2.2;
    ctx.beginPath();
    ctx.moveTo(n.x, n.y);
    ctx.lineTo(n.cut[0], n.cut[1]);
    ctx.stroke();
    // The clean cut, pale.
    ctx.fillStyle = rgb(mixc([226, 206, 160], [90, 86, 80], night * 0.6));
    ctx.beginPath();
    ctx.ellipse(n.cut[0], n.cut[1], this.base * 0.8, this.base * 0.5, n.ang, 0, Math.PI * 2);
    ctx.fill();
    // The new shoot.
    const s = n.shoot;
    const sway = this.wind.sway(s.x, 0.06, 1.3);
    const a = s.ang + sway;
    ctx.strokeStyle = night > 0.5 ? '#6f8c3a' : '#9cc23c';
    ctx.lineWidth = Math.max(1.2, this.base * 0.5);
    ctx.lineCap = 'round';
    const ex = s.x + Math.cos(a) * s.L, ey = s.y + Math.sin(a) * s.L;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.quadraticCurveTo(s.x + Math.cos(a - 0.4) * s.L * 0.6, s.y + Math.sin(a - 0.4) * s.L * 0.6, ex, ey);
    ctx.stroke();
    ctx.fillStyle = night > 0.5 ? '#5f7f3c' : '#a8d052';
    for (const [f, side] of [[0.55, 1], [0.95, -1]]) {
      const lx = s.x + (ex - s.x) * f, ly = s.y + (ey - s.y) * f;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(a + side * 0.9);
      ctx.beginPath();
      ctx.ellipse(s.L * 0.18, 0, s.L * 0.2, s.L * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  drawCutting(ctx, c, night) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    // Its shadow on the ground.
    ctx.fillStyle = 'rgba(40, 30, 20, 0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 4, c.L * 0.55, this.base * 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgb(mixc([116, 88, 62], [40, 36, 40], night * 0.6));
    ctx.lineWidth = this.base * 1.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-c.L / 2, 0);
    ctx.quadraticCurveTo(0, -this.base * 1.5, c.L / 2, -this.base * 0.5);
    ctx.stroke();
    // Two leaves, dried to straw.
    ctx.fillStyle = rgb(mixc([196, 168, 104], [70, 64, 60], night * 0.6));
    for (const [f, s] of [[-0.1, -1], [0.25, 1]]) {
      ctx.save();
      ctx.translate(c.L * f, -this.base * 1.1);
      ctx.rotate(s * 0.7 - 0.3);
      ctx.beginPath();
      ctx.ellipse(c.L * 0.12, 0, c.L * 0.14, c.L * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  drawTrellis(ctx, night) {
    const wood = rgb(mixc([132, 104, 76], [44, 40, 46], night * 0.6));
    const woodDark = rgb(mixc([92, 70, 50], [30, 28, 34], night * 0.6));
    const [x0, x1] = this.wire;
    // The wire, sagging a little between posts.
    ctx.strokeStyle = night > 0.5 ? 'rgba(200, 200, 210, 0.3)' : 'rgba(70, 70, 64, 0.45)';
    ctx.lineWidth = 1;
    const xs = [x0, ...this.posts.map((p) => p.x).sort((a, b) => a - b), x1];
    ctx.beginPath();
    ctx.moveTo(xs[0], this.wireY);
    for (let i = 1; i < xs.length; i++) {
      const mid = (xs[i - 1] + xs[i]) / 2;
      ctx.quadraticCurveTo(mid, this.wireY + Math.min(10, (xs[i] - xs[i - 1]) * 0.02), xs[i], this.wireY);
    }
    ctx.stroke();
    const w = Math.max(5, this.base * 2.2);
    for (const p of this.posts) {
      const g = ctx.createLinearGradient(p.x - w / 2, 0, p.x + w / 2, 0);
      g.addColorStop(0, woodDark);
      g.addColorStop(0.5, wood);
      g.addColorStop(1, woodDark);
      ctx.fillStyle = g;
      ctx.fillRect(p.x - w / 2, p.top, w, p.foot - p.top);
      ctx.fillStyle = woodDark;
      ctx.beginPath();
      ctx.moveTo(p.x - w / 2, p.top);
      ctx.lineTo(p.x, p.top - w * 0.6);
      ctx.lineTo(p.x + w / 2, p.top);
      ctx.fill();
    }
  }

  drawTag(ctx, p, night) {
    if (!p.yes) return;
    const r = this.tagRect(p);
    const today = p === this.todayPost;
    // Twine from a nail.
    ctx.strokeStyle = night > 0.5 ? 'rgba(210, 196, 160, 0.5)' : 'rgba(120, 96, 60, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x, r.y - 10);
    ctx.lineTo(r.x + r.w * 0.3, r.y + 2);
    ctx.moveTo(p.x, r.y - 10);
    ctx.lineTo(r.x + r.w * 0.7, r.y + 2);
    ctx.stroke();
    // The tag: pale wood, a little darker at the edge.
    const face = night > 0.5 ? [70, 64, 58] : [236, 222, 192];
    ctx.fillStyle = rgb(face, 0.97);
    ctx.strokeStyle = night > 0.5 ? 'rgba(220, 200, 160, 0.35)' : 'rgba(120, 92, 56, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(r.x, r.y, r.w, r.h, 4); else ctx.rect(r.x, r.y, r.w, r.h);
    ctx.fill();
    ctx.stroke();
    if (r.labelled) {
      ctx.save();
      ctx.font = `italic 500 ${this.labelFont}px "Literata Variable", Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = night > 0.5 ? INK_NIGHT : INK;
      let text = p.yes.text;
      while (ctx.measureText(text).width > r.w - 18 && text.length > 4) text = text.slice(0, -2) + '…';
      ctx.fillText(text, r.x + r.w / 2, r.y + r.h / 2 + 1);
      ctx.restore();
    }
    // Today's: sunlight on it.
    if (today) {
      ctx.save();
      ctx.globalCompositeOperation = night > 0.5 ? 'source-over' : 'lighter';
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2, R = Math.max(r.w, 40) * 0.75;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, night > 0.5 ? 'rgba(230, 196, 126, 0.14)' : 'rgba(255, 226, 150, 0.22)');
      g.addColorStop(1, 'rgba(255, 226, 150, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.restore();
    }
  }

  // Today's yes: a tendril along the wire to its post, wound round it.
  drawReach(ctx) {
    const st = this.reach;
    const p = this.todayPost;
    const k = this.reduced ? 1 : clamp01((this.t - st.t0) / (st.tEnd - st.t0));
    if (k <= 0) return;
    const n = Math.max(2, Math.round(st.pts.length * k));
    ctx.save();
    ctx.strokeStyle = '#86ad36';
    ctx.lineWidth = Math.max(1.2, this.base * 0.45);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(st.pts[0][0], st.pts[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(st.pts[i][0], st.pts[i][1]);
    ctx.stroke();
    if (k >= 1) {
      // The coil round the post.
      const w = Math.max(5, this.base * 2.2) * 0.75;
      const y0 = p.top + this.em * 0.05;
      const turns = 3.2;
      const len = this.em * 0.22;
      ctx.lineWidth = Math.max(1, this.base * 0.35);
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const u = i / 64;
        const a = u * turns * Math.PI * 2;
        const x = p.x + Math.cos(a) * w * (1 - u * 0.2);
        const y = y0 + u * len + Math.sin(a) * w * 0.25;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  caption(ctx, text, x, y, a, night) {
    const { W } = this;
    ctx.save();
    ctx.font = `italic 500 ${Math.round(this.labelFont * 1.12)}px "Literata Variable", Georgia, serif`;
    const w = ctx.measureText(text).width + 28;
    const h = this.labelFont * 1.12 + 18;
    const cx = Math.max(w / 2 + 8, Math.min(W - w / 2 - 8, x));
    ctx.globalAlpha = a;
    ctx.fillStyle = night > 0.5 ? 'rgba(20, 22, 34, 0.82)' : 'rgba(250, 245, 234, 0.9)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx - w / 2, y - h / 2, w, h, h / 2); else ctx.rect(cx - w / 2, y - h / 2, w, h);
    ctx.fill();
    ctx.fillStyle = night > 0.5 ? INK_NIGHT : INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, y + 1);
    ctx.restore();
  }
}
