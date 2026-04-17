// SpineFish.js
// Dot-chain skeletal koi ported from akeatk/fish-pond (MIT-style spirit),
// adapted to a self-contained class with interface:
//   new SpineFish(W, H)
//   fish.update(W, H, cursor)     // cursor: { x, y }  (x < -1000 = inactive)
//   fish.draw(ctx)
//
// Structural changes from the original:
//   - No `pond` dependency. Each fish manages its own wander/flee target.
//   - Canvas wrap at the boundaries instead of pond-hit test.
//   - Colour replaced by a per-fish "variety" object (6 koi varieties).
//   - Pond-floor projected shadow, warm dorsal rim light, translucent
//     fins/tail with visible rays for a Shinkai-pond feel.

// ── Koi varieties ──────────────────────────────────────────────────────────────
// Each variety: body RGB, dorsal RGB (for the top stripe), and optional
// `spots`: array of { at: 0..1 along parts[], side: -1|1, size: 0.6..1.4, hue: RGB }
// Koi varieties. Each carries colour + optional "reticulation" (net-scale
// pattern for asagi) + behaviour traits:
//   personality: 'normal' | 'curious' | 'skittish'
//     - curious fish drift TOWARDS the cursor at moderate range (chagoi is
//       famously the friendliest koi — approaches hands)
//     - skittish fish flee at 1.4× the range and with higher residual energy
//   sizeScale: multiplier on mass — 1.5 = patriarch, 0.8 = juvenile.
const VARIETIES = [
  {
    name: 'kohaku',
    body: [248, 240, 230],
    dorsal: [212, 66, 52],
    fin: [255, 250, 244],
    personality: 'normal',
    sizeScale: 1.0,
    spots: [
      { at: 0.12, side: 0, size: 1.1, hue: [200, 50, 40] },
      { at: 0.42, side: 1, size: 0.9, hue: [212, 66, 52] },
      { at: 0.68, side: -1, size: 0.8, hue: [212, 66, 52] },
    ],
  },
  {
    // The friendly patriarch — largest and most curious, approaches cursor
    name: 'chagoi',
    body: [206, 124, 64],
    dorsal: [150, 82, 40],
    fin: [232, 168, 110],
    personality: 'curious',
    sizeScale: 1.45,
    spots: [],
  },
  {
    name: 'ogon',
    body: [228, 186, 82],
    dorsal: [196, 150, 56],
    fin: [244, 214, 130],
    personality: 'normal',
    sizeScale: 1.05,
    spots: [],
  },
  {
    // Pure black (karasu-style) — reads as a dramatic silhouette
    name: 'karasu',
    body: [36, 38, 46],
    dorsal: [12, 14, 20],
    fin: [70, 74, 86],
    personality: 'normal',
    sizeScale: 0.95,
    spots: [
      { at: 0.32, side: 1, size: 0.7, hue: [110, 120, 140] },
    ],
  },
  {
    name: 'shiro',
    body: [248, 248, 244],
    dorsal: [210, 214, 220],
    fin: [255, 255, 252],
    personality: 'skittish',
    sizeScale: 0.85,
    spots: [],
  },
  {
    name: 'hiUtsuri',
    body: [28, 24, 26],
    dorsal: [14, 12, 14],
    fin: [56, 48, 50],
    personality: 'normal',
    sizeScale: 1.0,
    spots: [
      { at: 0.18, side: 1, size: 1.2, hue: [228, 102, 42] },
      { at: 0.45, side: -1, size: 1.0, hue: [206, 78, 30] },
      { at: 0.72, side: 1, size: 0.8, hue: [216, 92, 36] },
    ],
  },
  {
    // Taisho Sanshoku — white body with red patches AND small black accents.
    // Reads as busier than Kohaku at a glance.
    name: 'sanke',
    body: [250, 244, 236],
    dorsal: [208, 70, 56],
    fin: [255, 252, 246],
    personality: 'normal',
    sizeScale: 1.0,
    spots: [
      { at: 0.16, side: 1, size: 1.05, hue: [212, 64, 48] },   // red
      { at: 0.38, side: -1, size: 0.85, hue: [212, 64, 48] },  // red
      { at: 0.52, side: 1, size: 0.55, hue: [22, 20, 24] },    // black sumi
      { at: 0.7, side: -1, size: 0.7, hue: [212, 70, 52] },    // red
      { at: 0.82, side: 1, size: 0.45, hue: [22, 20, 24] },    // black sumi
    ],
  },
  {
    // Showa Sanshoku — the "inverse" Kohaku: black base + red + white
    name: 'showa',
    body: [32, 28, 30],
    dorsal: [18, 14, 16],
    fin: [70, 60, 62],
    personality: 'normal',
    sizeScale: 1.1,
    spots: [
      { at: 0.14, side: 0, size: 1.15, hue: [244, 238, 226] }, // white face patch
      { at: 0.34, side: 1, size: 1.0, hue: [208, 64, 48] },    // red
      { at: 0.5, side: -1, size: 0.85, hue: [240, 232, 218] }, // white
      { at: 0.66, side: 1, size: 0.9, hue: [208, 64, 48] },    // red
      { at: 0.82, side: -1, size: 0.55, hue: [240, 232, 218] },// white tail patch
    ],
  },
  {
    // Asagi — blue-grey dorsal with red-orange belly hints.
    // The net/reticulation pattern is expressed via `reticulate` flag
    // (drawn as a grid of small dark dots along the back, see drawSpots).
    name: 'asagi',
    body: [134, 150, 170],
    dorsal: [76, 94, 122],
    fin: [220, 160, 120],
    personality: 'skittish',
    sizeScale: 1.1,
    reticulate: { colour: [28, 40, 62], density: 14 },
    spots: [
      { at: 0.15, side: 1, size: 0.75, hue: [210, 120, 70] }, // orange cheek hint
      { at: 0.15, side: -1, size: 0.75, hue: [210, 120, 70] },
    ],
  },
];

// Deterministic mix: ensures a varied pond rather than a monoculture.
// Guarantees one patriarch chagoi; fills remaining slots by rotating a
// curated order so you always see at least 5-6 distinct varieties.
export function buildPondMix(n) {
  const order = ['chagoi', 'kohaku', 'showa', 'sanke', 'hiUtsuri', 'asagi', 'ogon', 'shiro', 'karasu'];
  const byName = Object.fromEntries(VARIETIES.map(v => [v.name, v]));
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(byName[order[i % order.length]]);
  }
  // Shuffle lightly (but keep chagoi first so it's always near spawn centre).
  for (let i = out.length - 1; i > 1; i--) {
    const j = 1 + Math.floor(Math.random() * i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── Skeleton primitives (adapted from akeatk) ─────────────────────────────────
class Mouth {
  constructor({ radius }) {
    this.x = null;
    this.y = null;
    this.radius = radius;
    this.mass = (Math.PI * 4 / 3) * Math.pow(this.radius, 3);
  }
}

class Head {
  constructor({ radius, radian, prevPart, x, y }) {
    this.x = x;
    this.y = y;
    this.radian = radian;
    this.radius = radius;
    this.mass = (Math.PI * 4 / 3) * Math.pow(this.radius, 3);
    this.prevPart = prevPart;
    this.prevPart.x = this.x + this.radius * 1.3 * 10 * Math.cos(this.radian);
    this.prevPart.y = this.y + this.radius * 1.3 * 10 * Math.sin(this.radian);
    this.nextPart = null;
  }
  setNextPart(p) { if (this.nextPart === null) this.nextPart = p; }
  getPoint(r, a) {
    return [
      this.x + r * Math.cos(a + this.radian),
      this.y + r * Math.sin(a + this.radian),
    ];
  }
  move(x, y) {
    this.nextPart.move(x, y);
    this.radian = this.nextPart.radian;
    this.x = this.nextPart.x + this.radius * 10 * Math.cos(this.radian);
    this.y = this.nextPart.y + this.radius * 10 * Math.sin(this.radian);
    this.prevPart.x = this.x + this.radius * 1.3 * 10 * Math.cos(this.radian);
    this.prevPart.y = this.y + this.radius * 1.3 * 10 * Math.sin(this.radian);
  }
}

class Part {
  constructor({ radius, prevPart, segmentLength, fish }) {
    this.prevPart = prevPart;
    this.segmentLength = segmentLength;
    this.nextPart = null;
    this.commitMove = 0;
    this.dirCount = 0;
    this.x = this.prevPart.x + this.segmentLength * Math.cos(this.prevPart.radian + Math.PI);
    this.y = this.prevPart.y + this.segmentLength * Math.sin(this.prevPart.radian + Math.PI);
    this.atTarget = null;
    this.radius = radius;
    this.mass = (Math.PI * 4 / 3) * Math.pow(this.radius, 3);
    this.maxAngle = Math.PI / Math.pow(Math.log(fish.mass), 1.1);
    this.maxAngle = this.radius * this.radius / this.mass * this.maxAngle;
    this.moveAngle = this.maxAngle / 3;
    this.commitMax = 3 + Math.floor(Math.pow(fish.mass, 1 / 2.5));
    this.updateRadian();
  }
  updateRadian() {
    const xd = this.prevPart.x - this.x;
    const yd = this.prevPart.y - this.y;
    if (xd === 0) {
      this.radian = yd < 0 ? (Math.PI * 3) / 2 : Math.PI / 2;
      return;
    }
    const r = Math.atan(yd / xd);
    this.radian = xd > 0 ? r : -Math.PI + r;
  }
  setNextPart(p) { if (this.nextPart === null) this.nextPart = p; }
  rotate(a) {
    const s = Math.sin(a), c = Math.cos(a);
    const dx = this.x - this.prevPart.x, dy = this.y - this.prevPart.y;
    this.x = dx * c - dy * s + this.prevPart.x;
    this.y = dx * s + dy * c + this.prevPart.y;
  }
  act(fish) {
    const oldx = this.x, oldy = this.y;
    this.updateRadian();
    let angleDiff = this.radian - this.prevPart.radian;
    if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    else if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) > this.maxAngle) {
      this.commitMove = 0;
      if (angleDiff > 0) {
        if (angleDiff - this.maxAngle > this.moveAngle * 2) {
          const rad = this.prevPart.radian + Math.PI + this.maxAngle * 0.8;
          this.x = this.prevPart.x + this.segmentLength * Math.cos(rad);
          this.y = this.prevPart.y + this.segmentLength * Math.sin(rad);
        } else {
          this.x = this.prevPart.x + this.segmentLength * Math.cos(this.radian + Math.PI);
          this.y = this.prevPart.y + this.segmentLength * Math.sin(this.radian + Math.PI);
          this.rotate(-this.moveAngle);
        }
      } else {
        if (angleDiff + this.maxAngle < -this.moveAngle * 2) {
          const rad = this.prevPart.radian + Math.PI - this.maxAngle * 0.8;
          this.x = this.prevPart.x + this.segmentLength * Math.cos(rad);
          this.y = this.prevPart.y + this.segmentLength * Math.sin(rad);
        } else {
          this.x = this.prevPart.x + this.segmentLength * Math.cos(this.radian + Math.PI);
          this.y = this.prevPart.y + this.segmentLength * Math.sin(this.radian + Math.PI);
          this.rotate(this.moveAngle);
        }
      }
    } else {
      this.x = this.prevPart.x + this.segmentLength * Math.cos(this.radian + Math.PI);
      this.y = this.prevPart.y + this.segmentLength * Math.sin(this.radian + Math.PI);
      let dd = this.radian - fish.targetDir;
      if (dd > Math.PI) dd -= Math.PI * 2;
      else if (dd < -Math.PI) dd += Math.PI * 2;

      if (this.commitMove < 0) { this.rotate(-this.moveAngle); this.commitMove += 1; }
      else if (this.commitMove > 0) { this.rotate(this.moveAngle); this.commitMove -= 1; }
      else if (dd > 0) {
        if (dd < 0.1) this.commitMove = -this.commitMax;
        this.rotate(-this.moveAngle);
        if (this.dirCount > 2 * this.commitMax) { this.commitMove = 1 + Math.floor(this.commitMax / 3); this.dirCount = 0; }
        else if (this.dirCount > 0) this.dirCount++;
        else this.dirCount = 1;
      } else {
        if (dd > -0.1) this.commitMove = this.commitMax;
        this.rotate(this.moveAngle);
        if (this.dirCount < -2 * this.commitMax) { this.commitMove = -1 - Math.floor(this.commitMax / 3); this.dirCount = 0; }
        else if (this.dirCount < 0) this.dirCount--;
        else this.dirCount = -1;
      }
    }

    this.updateRadian();

    if (this.nextPart) {
      const ratio = this.mass / fish.mass;
      fish.newvelx += (oldx - this.x) * ratio;
      fish.newvely += (oldy - this.y) * ratio;
      this.nextPart.act(fish);
    } else {
      let distMod = 0;
      const dTo = fish.target ? fish.target.getDistance(fish.mouth.x, fish.mouth.y) : 0;
      if (fish.target && dTo > 300) {
        distMod = 5 / fish.mass * (1 - 50 / dTo);
      }
      let dir = fish.parts[0].radian - fish.targetDir;
      if (dir > Math.PI) dir -= Math.PI * 2;
      else if (dir < -Math.PI) dir += Math.PI * 2;

      const ratio = this.mass / fish.mass;
      const xd = oldx - this.x, yd = oldy - this.y;
      fish.newvelx += xd * ratio;
      fish.newvely += yd * ratio;
      this.atTarget = Math.pow(1 - 2 * Math.abs(dir) / Math.PI, 3) + distMod * 5;
      const md = Math.sqrt(xd * xd + yd * yd);
      fish.velx += (md * Math.cos(fish.parts[0].radian) / 10) * this.atTarget;
      fish.vely += (md * Math.sin(fish.parts[0].radian) / 10) * this.atTarget;
    }
  }
  move(x, y) {
    this.x += x;
    this.y += y;
    if (this.nextPart) this.nextPart.move(x, y);
  }
  getPoint(r, a) {
    return [
      this.x + r * Math.cos(a + this.radian),
      this.y + r * Math.sin(a + this.radian),
    ];
  }
}

class TailPiece {
  constructor(tail, prevPart, offset) {
    this.prevPart = prevPart || tail.tip;
    this.offset = offset;
    this.velx = 0; this.vely = 0;
    this.radian = this.prevPart.radian;
    this.maxAngle = this.prevPart.maxAngle;
    [this.x, this.y] = this.prevPart.getPoint(tail.pieceLength, this.prevPart.radian + Math.PI);
  }
  act(tail) {
    const oldx = this.x, oldy = this.y;
    this.x += this.velx; this.y += this.vely;
    this.updateRadian();
    let ad = this.radian + this.offset / 3 - this.prevPart.radian;
    if (ad > Math.PI) ad -= Math.PI * 2;
    else if (ad < -Math.PI) ad += Math.PI * 2;

    if (Math.abs(ad) > tail.maxAngle) {
      if (ad > 0) {
        if (ad - tail.maxAngle > tail.maxAngle / 2) {
          const rad = this.prevPart.radian + Math.PI + tail.maxAngle;
          this.x = this.prevPart.x + tail.pieceLength * Math.cos(rad);
          this.y = this.prevPart.y + tail.pieceLength * Math.sin(rad);
        } else {
          this.x = this.prevPart.x + tail.pieceLength * Math.cos(this.radian + Math.PI);
          this.y = this.prevPart.y + tail.pieceLength * Math.sin(this.radian + Math.PI);
        }
      } else {
        if (ad + tail.maxAngle < -tail.maxAngle / 2) {
          const rad = this.prevPart.radian + Math.PI - tail.maxAngle;
          this.x = this.prevPart.x + tail.pieceLength * Math.cos(rad);
          this.y = this.prevPart.y + tail.pieceLength * Math.sin(rad);
        } else {
          this.x = this.prevPart.x + tail.pieceLength * Math.cos(this.radian + Math.PI);
          this.y = this.prevPart.y + tail.pieceLength * Math.sin(this.radian + Math.PI);
        }
      }
    } else {
      this.x = this.prevPart.x + tail.pieceLength * Math.cos(this.radian + Math.PI);
      this.y = this.prevPart.y + tail.pieceLength * Math.sin(this.radian + Math.PI);
    }
    this.velx = (this.velx + this.x - oldx) / 5;
    this.vely = (this.vely + this.y - oldy) / 5;
  }
  updateRadian() {
    const xd = this.prevPart.x - this.x;
    const yd = this.prevPart.y - this.y;
    if (xd === 0) {
      this.radian = yd < 0 ? (Math.PI * 3) / 2 : Math.PI / 2;
      return;
    }
    const r = Math.atan(yd / xd);
    this.radian = xd > 0 ? r : -Math.PI + r;
  }
  getPoint(r, a) {
    return [
      this.x + r * Math.cos(a + this.radian),
      this.y + r * Math.sin(a + this.radian),
    ];
  }
}

class Tail {
  constructor(fish, radius) {
    this.fish = fish;
    this.pieces = [[], [], [], [], []];
    this.radius = radius;
    this.pieceLength = this.radius * 2;
    this.tip = fish.parts[fish.parts.length - 1];
    this.maxAngle = this.tip.maxAngle;
    for (let i = 0; i < 3; i++) this.pieces[2].push(new TailPiece(this, this.pieces[2][i - 1], 0));
    for (let i = 0; i < 5; i++) this.pieces[1].push(new TailPiece(this, this.pieces[1][i - 1], 1));
    for (let i = 0; i < 8; i++) this.pieces[0].push(new TailPiece(this, this.pieces[0][i - 1], 2));
    for (let i = 0; i < 5; i++) this.pieces[3].push(new TailPiece(this, this.pieces[3][i - 1], -1));
    for (let i = 0; i < 8; i++) this.pieces[4].push(new TailPiece(this, this.pieces[4][i - 1], -2));
  }
  act() {
    this.tip = this.fish.parts[this.fish.parts.length - 1];
    for (const row of this.pieces) for (const p of row) p.act(this);
  }
  render(ctx) {
    this.act();
    const v = this.fish.variety;
    ctx.fillStyle = `rgba(${v.fin[0]},${v.fin[1]},${v.fin[2]},0.42)`;
    for (let j = 0; j < this.pieces.length - 1; j++) {
      ctx.beginPath();
      ctx.moveTo(...this.tip.getPoint(0, 0));
      for (const p of this.pieces[j]) ctx.lineTo(p.x, p.y);
      for (let i = this.pieces[j + 1].length - 1; i > -1; i--) {
        const p = this.pieces[j + 1][i];
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fill();
    }
    // Fin rays
    ctx.strokeStyle = `rgba(${Math.round(v.dorsal[0] * 0.7)},${Math.round(v.dorsal[1] * 0.7)},${Math.round(v.dorsal[2] * 0.7)},0.34)`;
    ctx.lineWidth = 1;
    for (const row of this.pieces) {
      ctx.beginPath();
      ctx.moveTo(...this.tip.getPoint(0, 0));
      for (const p of row) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }
}

class FinPiece {
  constructor(fin, prevPart, side, bias) {
    this.fin = fin;
    this.prevPart = prevPart;
    this.side = side;
    this.finOffset = -this.side * ((1 - this.fin.ratio) * 0.3 - 5 * this.fin.ratio);
    this.bias = side * bias * Math.PI / 8;
    this.velx = 0; this.vely = 0;
    if (!this.prevPart) {
      [this.x, this.y] = this.fin.part.getPoint(this.fin.part.radius * 9, this.side * Math.PI / 2 + this.finOffset);
      this.maxAngle = this.fin.part.maxAngle * this.fin.ratio;
      this.radian = this.fin.part.radian + (Math.PI / 2) * -this.side + this.finOffset / 2 + this.bias;
    } else {
      this.maxAngle = this.prevPart.maxAngle;
      this.radian = this.prevPart.radian;
      [this.x, this.y] = this.prevPart.getPoint(this.fin.pieceLength, Math.PI);
    }
  }
  act() {
    if (!this.prevPart) {
      [this.x, this.y] = this.fin.part.getPoint(this.fin.part.radius * 9, this.side * Math.PI / 2 + this.finOffset);
      this.maxAngle = this.fin.part.maxAngle * this.fin.ratio;
      this.radian = this.fin.part.radian + (Math.PI / 2) * -this.side + this.finOffset / 2 + this.bias;
    } else {
      this.maxAngle = this.prevPart.maxAngle;
      const oldx = this.x, oldy = this.y;
      this.x += this.velx; this.y += this.vely;
      this.updateRadian();
      let ad = this.radian - this.prevPart.radian;
      if (ad > Math.PI) ad -= Math.PI * 2;
      else if (ad < -Math.PI) ad += Math.PI * 2;
      if (ad > 0) {
        if (ad > this.maxAngle) {
          [this.x, this.y] = this.prevPart.getPoint(this.fin.pieceLength, Math.PI + this.maxAngle);
        } else {
          this.x = this.prevPart.x + this.fin.pieceLength * Math.cos(this.radian + Math.PI);
          this.y = this.prevPart.y + this.fin.pieceLength * Math.sin(this.radian + Math.PI);
        }
      } else {
        if (ad < -this.maxAngle) {
          [this.x, this.y] = this.prevPart.getPoint(this.fin.pieceLength, Math.PI - this.maxAngle);
        } else {
          this.x = this.prevPart.x + this.fin.pieceLength * Math.cos(this.radian + Math.PI);
          this.y = this.prevPart.y + this.fin.pieceLength * Math.sin(this.radian + Math.PI);
        }
      }
      this.velx = (this.velx + this.x - oldx) / 5;
      this.vely = (this.vely + this.y - oldy) / 5;
    }
  }
  updateRadian() {
    const xd = this.prevPart.x - this.x;
    const yd = this.prevPart.y - this.y;
    if (xd === 0) {
      this.radian = yd < 0 ? (Math.PI * 3) / 2 : Math.PI / 2;
      return;
    }
    const r = Math.atan(yd / xd);
    this.radian = xd > 0 ? r : -Math.PI + r;
  }
  getPoint(r, a) {
    return [
      this.x + r * Math.cos(a + this.radian),
      this.y + r * Math.sin(a + this.radian),
    ];
  }
}

class Fin {
  constructor(fish, side, ratio, radius) {
    this.fish = fish;
    this.side = side;
    this.ratio = ratio;
    this.radius = radius;
    this.part = fish.parts[Math.floor(fish.parts.length * ratio)];
    this.pieceLength = this.radius * 3 + 1;
    this.pieces = [];
    for (let i = 0; i < 7; i++) {
      this.pieces.push([new FinPiece(this, undefined, this.side, i)]);
      for (let j = 0; j < 5 - i / 2; j++) {
        this.pieces[i].push(new FinPiece(this, this.pieces[i][j], this.side, i));
      }
    }
  }
  act() {
    for (const row of this.pieces) for (const p of row) p.act();
  }
  render(ctx) {
    const v = this.fish.variety;
    ctx.fillStyle = `rgba(${v.fin[0]},${v.fin[1]},${v.fin[2]},0.42)`;
    for (let j = 0; j < this.pieces.length - 1; j++) {
      ctx.beginPath();
      ctx.moveTo(this.pieces[j][0].x, this.pieces[j][0].y);
      for (let i = 1; i < this.pieces[j].length; i++) ctx.lineTo(this.pieces[j][i].x, this.pieces[j][i].y);
      for (let i = this.pieces[j + 1].length - 1; i > -1; i--) ctx.lineTo(this.pieces[j + 1][i].x, this.pieces[j + 1][i].y);
      ctx.closePath();
      ctx.fill();
    }
    // Fin rays
    ctx.strokeStyle = `rgba(${Math.round(v.dorsal[0] * 0.7)},${Math.round(v.dorsal[1] * 0.7)},${Math.round(v.dorsal[2] * 0.7)},0.22)`;
    ctx.lineWidth = 1;
    for (const row of this.pieces) {
      ctx.beginPath();
      ctx.moveTo(row[0].x, row[0].y);
      for (let i = 1; i < row.length; i++) ctx.lineTo(row[i].x, row[i].y);
      ctx.stroke();
    }
  }
}

class Fins {
  constructor(fish, radius) {
    this.fins = [
      new Fin(fish, 1, 0, radius),
      new Fin(fish, -1, 0, radius),
      new Fin(fish, 1, 0.3, radius),
      new Fin(fish, -1, 0.3, radius),
    ];
  }
  act() { for (const f of this.fins) f.act(); }
  render(ctx) { this.act(); for (const f of this.fins) f.render(ctx); }
}

// ── Simple target (replaces pond.getSpot / getClosestFood) ─────────────────────
class Target {
  constructor(x, y) { this.x = x; this.y = y; this.value = 1; }
  getDistance(x, y) { return Math.hypot(this.x - x, this.y - y); }
}

// ── SpineFish (public) ─────────────────────────────────────────────────────────
export default class SpineFish {
  constructor(W, H, variety) {
    this.variety = variety || VARIETIES[Math.floor(Math.random() * VARIETIES.length)];
    // sizeScale multiplies the base mass so patriarchs (Chagoi ≈1.45) are
    // meaningfully larger than juveniles (Shiro ≈0.85). Mass drives head
    // radius which cascades through the whole spine.
    const scale = this.variety.sizeScale || 1;
    this.mass = (420 + Math.random() * 520) * scale * scale;
    this.segmentLength = 10;
    this.velx = 0; this.vely = 0;
    this.newvelx = 0; this.newvely = 0;
    this.targetDir = Math.random() * Math.PI * 2;
    this.fleeCooldown = 0;
    this.wanderTimer = 0;

    // Energy state: drives both how active the fish looks and how quickly
    // it damps out its propulsion. 0.15 = nearly still, 1.0 = startled/fleeing.
    this.energy = 0.2 + Math.random() * 0.15;
    this.isIdle = false;
    this.idleDuration = 120 + Math.random() * 180;
    this.idleCenter = null;           // anchor for the lazy orbital target
    this.orbitPhase = Math.random() * Math.PI * 2;

    // Depth: 0 = surface, 1 = deep. Drives scale, alpha, shadow offset,
    // rim-light intensity — the submerged body-language.
    this.depth = 0.35 + Math.random() * 0.25;
    this.targetDepth = this.depth;
    this.depthTimer = 600 + Math.random() * 900;
    this.lastDepth = this.depth;      // for detecting surface crossings

    // Spontaneous surface-break: an idle fish occasionally rises just enough
    // to break the surface with a gentle hello. Staggered per-fish so the
    // pond has a rolling rhythm rather than clumpy events.
    this.surfaceBreakCooldown = 1400 + Math.random() * 2400;

    // Shimmer phase drives the travelling specular highlight along the back.
    // Each fish starts at a random offset so the pond never "pulses" in sync.
    this.shimmerPhase = Math.random() * Math.PI * 2;

    // Feeding: set by update() when food is available and close enough.
    this.feedTarget = null;
    this.fedCooldown = 0; // after eating, fish rests and sinks for a while

    const x = 80 + Math.random() * Math.max(0, W - 160);
    const y = 80 + Math.random() * Math.max(0, H - 160);
    const radian = Math.random() * Math.PI * 2;
    const maxRadius = Math.cbrt(this.mass / ((5 + Math.floor(Math.log(this.mass))) * Math.PI));

    this.mouth = new Mouth({ radius: maxRadius / 2 });
    this.head = new Head({ radius: maxRadius, radian, prevPart: this.mouth, x, y });

    const modifier = (this.head.mass + this.mouth.mass) / this.mass;
    this.parts = [];
    this.parts.push(new Part({
      radius: maxRadius,
      prevPart: this.head,
      segmentLength: this.head.radius * 10,
      fish: this,
    }));
    this.head.setNextPart(this.parts[0]);
    for (let i = 1; this.parts[i - 1].radius > 0.5; i++) {
      const p = new Part({
        radius: this.parts[i - 1].radius - modifier,
        prevPart: this.parts[i - 1],
        segmentLength: this.segmentLength,
        fish: this,
      });
      this.parts[i - 1].setNextPart(p);
      this.parts.push(p);
    }
    this.tail = new Tail(this, this.head.radius);
    this.fins = new Fins(this, this.head.radius);

    this.target = new Target(
      80 + Math.random() * Math.max(1, W - 160),
      80 + Math.random() * Math.max(1, H - 160)
    );
  }

  pickWanderTarget(W, H) {
    const margin = 120;
    // Short, local drifts feel more tranquil than cross-pond dashes.
    // 70% of the time pick a nearby point; 30% pick a farther spot so fish
    // occasionally relocate across the pond.
    const local = Math.random() < 0.7;
    const radius = local ? 140 + Math.random() * 240 : 360 + Math.random() * 520;
    const ang = Math.random() * Math.PI * 2;
    let x = this.mouth.x + Math.cos(ang) * radius;
    let y = this.mouth.y + Math.sin(ang) * radius;
    x = Math.max(margin, Math.min(W - margin, x));
    y = Math.max(margin, Math.min(H - margin, y));
    this.target = new Target(x, y);
  }

  updateTargetDir() {
    if (!this.target) return;
    const xd = this.target.x - this.mouth.x;
    const yd = this.target.y - this.mouth.y;
    if (xd === 0) {
      this.targetDir = yd < 0 ? (Math.PI * 3) / 2 : Math.PI / 2;
      return;
    }
    const r = Math.atan(yd / xd);
    this.targetDir = xd > 0 ? r : -Math.PI + r;
  }

  // env (optional):
  //   food        — array of FoodPellet, each with { x, y, eaten }
  //   onBreak(x,y,intensity)  — callback to spawn a surface-break
  update(W, H, cur, env) {
    const food = env?.food;
    const onBreak = env?.onBreak;

    // ── Cursor response: personality-dependent ──
    //   curious  → drifts TOWARDS cursor from mid-range (like a real Chagoi)
    //   skittish → flees from further out, stays jumpy longer
    //   normal   → standard short-range flee
    const personality = this.variety.personality || 'normal';
    const fleeRange = personality === 'skittish' ? 250 : 180;
    const curiousRange = 340;

    if (cur && cur.x > -1000) {
      const dx = this.mouth.x - cur.x;
      const dy = this.mouth.y - cur.y;
      const d = Math.hypot(dx, dy);

      if (personality === 'curious' && d > 60 && d < curiousRange) {
        // Approach the cursor at a moderate clip. Do NOT override flee state
        // if already fleeing (e.g. cursor slams down on top of fish).
        if (this.fleeCooldown <= 0) {
          this.target = new Target(cur.x, cur.y);
          this.isIdle = false;
          this.feedTarget = null;
          this.energy = Math.max(this.energy, 0.55);
          this.targetDepth = Math.min(this.targetDepth, 0.2); // rise a bit
        }
      } else if (d < fleeRange) {
        const nx = d > 0 ? dx / d : 1;
        const ny = d > 0 ? dy / d : 0;
        const fleeDist = personality === 'skittish' ? 520 : 420;
        const fx = Math.max(80, Math.min(W - 80, this.mouth.x + nx * fleeDist));
        const fy = Math.max(80, Math.min(H - 80, this.mouth.y + ny * fleeDist));
        this.target = new Target(fx, fy);
        this.fleeCooldown = personality === 'skittish' ? 130 : 90;
        this.wanderTimer = 0;
        this.energy = 1.0;
        this.isIdle = false;
        this.feedTarget = null;
      }
    }

    // ── Feeding: find nearest pellet and treat it as target ──
    // Food overrides normal wandering unless fleeing or in post-feed cooldown.
    if (food && food.length && this.fleeCooldown <= 0 && this.fedCooldown <= 0) {
      let best = null;
      let bestD = Infinity;
      for (const f of food) {
        if (f.eaten) continue;
        const dd = Math.hypot(f.x - this.mouth.x, f.y - this.mouth.y);
        if (dd < bestD && dd < 340) { bestD = dd; best = f; }
      }
      if (best) {
        this.feedTarget = best;
        this.target = new Target(best.x, best.y);
        this.isIdle = false;
        this.energy = Math.max(this.energy, 0.85);
        this.targetDepth = 0; // rise to the surface
        // Reached the pellet — eat it
        if (bestD < 18) {
          best.eaten = true;
          this.feedTarget = null;
          this.fedCooldown = 280 + Math.random() * 180;
          this.isIdle = true;
          this.idleCenter = { x: this.mouth.x, y: this.mouth.y };
          this.idleDuration = 280 + Math.random() * 220;
          this.targetDepth = 0.55 + Math.random() * 0.15; // content, sinks
          if (onBreak) onBreak(best.x, best.y, 'feed');
        }
      } else {
        this.feedTarget = null;
      }
    } else {
      this.feedTarget = null;
    }
    if (this.fedCooldown > 0) this.fedCooldown--;

    // ── Behaviour state machine ──
    if (this.fleeCooldown > 0) {
      this.fleeCooldown--;
    } else if (this.feedTarget) {
      // Feeding overrides wander — target is kept in sync with pellet position
    } else if (this.isIdle) {
      this.idleDuration--;
      // Slow orbital target around the idle centre — this is the fix for the
      // "freeze" feeling. The fish is always chasing a point that lazily
      // circles it, so the tail keeps undulating and the body keeps drifting.
      if (!this.idleCenter) {
        this.idleCenter = { x: this.mouth.x, y: this.mouth.y };
      }
      this.orbitPhase += 0.006;
      const orbitR = 42 + Math.sin(this.orbitPhase * 0.43) * 18;
      this.target.x = this.idleCenter.x + Math.cos(this.orbitPhase) * orbitR;
      this.target.y = this.idleCenter.y + Math.sin(this.orbitPhase * 1.28) * orbitR * 0.65;

      if (this.idleDuration <= 0) {
        this.isIdle = false;
        this.idleCenter = null;
        this.pickWanderTarget(W, H);
        this.wanderTimer = 0;
        this.energy = 0.42 + Math.random() * 0.15;
      }
    } else {
      const dTo = this.target.getDistance(this.mouth.x, this.mouth.y);
      this.wanderTimer++;
      if (dTo < 55) {
        this.isIdle = true;
        this.idleDuration = 180 + Math.random() * 240;
        this.idleCenter = { x: this.mouth.x, y: this.mouth.y };
        this.energy = 0.15 + Math.random() * 0.1;
      } else if (this.wanderTimer > 380 + Math.random() * 520) {
        this.pickWanderTarget(W, H);
        this.wanderTimer = 0;
      }
    }

    // Energy decays towards a tranquil baseline whenever the cursor isn't poking
    if (this.fleeCooldown <= 0 && !this.feedTarget) {
      const baseline = this.isIdle ? 0.18 : 0.4; // a touch higher than before so idle fish still animate
      this.energy += (baseline - this.energy) * 0.02;
    }

    // ── Depth cycle ──
    // Fish slowly drift between depth 0.25 and 0.65 on independent timers,
    // producing the "some surfacing, some submerging" layered look.
    this.depthTimer--;
    if (this.depthTimer <= 0 && !this.feedTarget && this.fedCooldown <= 0) {
      this.targetDepth = 0.25 + Math.random() * 0.4;
      this.depthTimer = 480 + Math.random() * 1500;
    }
    // Lerp towards target depth (slow — takes several seconds to transition)
    this.depth += (this.targetDepth - this.depth) * 0.012;

    // ── Spontaneous surface-break ──
    // Every ~25-60s, a fish rises just enough to break the surface with a
    // gentle ripple — a "hello" moment from the pond.
    this.surfaceBreakCooldown--;
    if (
      this.surfaceBreakCooldown <= 0 &&
      this.depth < 0.5 &&
      this.fleeCooldown <= 0 &&
      !this.feedTarget
    ) {
      this.targetDepth = 0;
      if (onBreak) onBreak(this.mouth.x, this.mouth.y, 'gentle');
      // After a beat, sink back to cruise depth
      this.surfaceBreakCooldown = 1500 + Math.random() * 2400;
      setTimeout(() => {
        this.targetDepth = 0.3 + Math.random() * 0.3;
      }, 1200 + Math.random() * 800);
    }

    // Shimmer phase: advances slightly faster when the fish is moving —
    // stationary fish barely shimmer; cruising fish catch the light on the
    // scales as they bend. 0.004 baseline + up to 0.012 on energy.
    this.shimmerPhase += 0.004 + 0.012 * this.energy;

    this.updateTargetDir();
    this.newvelx = 0;
    this.newvely = 0;
    this.parts[0].act(this);

    // Energy gates forward propulsion.
    const damp = 0.84 + 0.13 * this.energy;
    const push = 0.25 + 0.75 * this.energy;
    this.velx *= damp;
    this.vely *= damp;
    this.newvelx *= push;
    this.newvely *= push;
    this.head.move(this.newvelx + this.velx, this.newvely + this.vely);

    this.lastDepth = this.depth;

    // Wrap around the canvas boundaries
    const M = 110;
    if (this.mouth.x < -M) this.shift(W + M * 2, 0);
    if (this.mouth.x > W + M) this.shift(-(W + M * 2), 0);
    if (this.mouth.y < -M) this.shift(0, H + M * 2);
    if (this.mouth.y > H + M) this.shift(0, -(H + M * 2));
  }

  shift(dx, dy) {
    this.mouth.x += dx; this.mouth.y += dy;
    this.head.x += dx; this.head.y += dy;
    for (const p of this.parts) { p.x += dx; p.y += dy; }
    for (const row of this.tail.pieces)
      for (const tp of row) if (tp.x != null) { tp.x += dx; tp.y += dy; }
    for (const fin of this.fins.fins)
      for (const row of fin.pieces)
        for (const fp of row) if (fp.x != null) { fp.x += dx; fp.y += dy; }
    if (this.target) { this.target.x += dx; this.target.y += dy; }
  }

  // ── Rendering ──────────────────────────────────────────────────────────────
  // z-order inside draw():
  //   1) projected pond-floor shadow (soft, offset below, blurred)
  //   2) fins   — translucent with rays
  //   3) body   — solid fill
  //   4) head   — rounded nose (same fill)
  //   5) tail   — translucent with rays
  //   6) dorsal stripe
  //   7) variety spots (kohaku / hi-utsuri)
  //   8) warm rim light along the dorsal ridge (Shinkai touch)
  //   9) eye
  draw(ctx) {
    const v = this.variety;
    const depth = Math.max(0, Math.min(1, this.depth));
    const surfaceness = 1 - depth;

    // ── 1) Pond-floor shadow ──
    // Offset increases with depth (light has further to travel past the fish),
    // alpha reduces (less light blocked per unit of area), blur grows.
    ctx.save();
    const shadowAlpha = 0.28 * (1 - depth * 0.55);
    const shadowOffset = 1 + depth * 0.9;
    ctx.globalAlpha = shadowAlpha;
    if (ctx.filter !== undefined) ctx.filter = `blur(${7 + depth * 4}px)`;
    ctx.translate(7 * shadowOffset, 16 * shadowOffset);
    ctx.fillStyle = 'rgba(0, 18, 16, 0.85)';
    this.tracePondShadow(ctx);
    ctx.fill();
    if (ctx.filter !== undefined) ctx.filter = 'none';
    ctx.restore();

    // ── Body block: scaled around the head so deeper fish appear smaller ──
    const scale = 0.78 + 0.28 * surfaceness; // 0.78 deep → 1.06 at surface
    // Fins & tail remain translucent (they're fleshy membranes, light passes through);
    // bodies are ALWAYS opaque so fish occlude fish behind them.
    const finAlpha = 0.55 + 0.45 * surfaceness; // 0.55 deep → 1.0 at surface

    ctx.save();
    ctx.translate(this.head.x, this.head.y);
    ctx.scale(scale, scale);
    ctx.translate(-this.head.x, -this.head.y);

    // 2) Fins (translucent, behind body)
    ctx.globalAlpha = finAlpha;
    this.fins.render(ctx);

    // 3) Body — OPAQUE. Depth is expressed via the tint overlay below, not alpha,
    //    so closer fish always occlude deeper fish (no x-ray effect).
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgb(${v.body[0]},${v.body[1]},${v.body[2]})`;
    this.traceBody(ctx);
    ctx.fill();

    // 4) Head
    this.traceHead(ctx);
    ctx.fill();

    // 5) Volumetric shading — darker back, lighter belly, travelling shimmer.
    //    This is what turns a flat silhouette into a body with curvature.
    this.drawShading(ctx, surfaceness);

    // 6) Dorsal stripe
    ctx.fillStyle = `rgb(${v.dorsal[0]},${v.dorsal[1]},${v.dorsal[2]})`;
    this.traceDorsal(ctx);
    ctx.fill();

    // 7) Spots
    if (v.spots && v.spots.length) this.drawSpots(ctx, v);

    // 7) Depth tint — murky water blended over the opaque body for deep fish.
    //    This darkens/greens them without making them see-through.
    if (depth > 0.18) {
      ctx.globalAlpha = (depth - 0.18) * 0.72;
      ctx.fillStyle = 'rgb(10, 52, 46)';
      this.traceBody(ctx);
      ctx.fill();
      this.traceHead(ctx);
      ctx.fill();
    }

    // 8) Tail (translucent, drawn after body so it overlaps cleanly)
    ctx.globalAlpha = finAlpha;
    this.tail.render(ctx);

    // 9) Warm rim light — only surface fish catch the god rays meaningfully
    const rimAlpha = 0.42 * surfaceness * surfaceness;
    if (rimAlpha > 0.02) {
      ctx.globalAlpha = rimAlpha;
      ctx.strokeStyle = 'rgba(255, 238, 198, 0.95)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(...this.head.getPoint(this.head.radius * 7.4, Math.PI / 2));
      for (let i = 0; i < this.parts.length - 1; i++) {
        ctx.lineTo(...this.parts[i].getPoint(this.parts[i].radius * 7.4, Math.PI / 2));
      }
      ctx.stroke();
    }

    // 10) Eye (opaque regardless of depth)
    ctx.globalAlpha = 1;
    const er = Math.max(1.8, this.head.radius * 1.05);
    const [ex, ey] = this.head.getPoint(this.head.radius * 8.5, Math.PI / 3);
    ctx.beginPath();
    ctx.arc(ex, ey, er, 0, Math.PI * 2);
    ctx.fillStyle = '#100806';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex - er * 0.28, ey - er * 0.28, er * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fill();

    ctx.restore();
  }

  // ── Shared path helpers ───────────────────────────────────────────────────
  traceBody(ctx) {
    ctx.beginPath();
    ctx.moveTo(...this.head.getPoint(this.head.radius * 8, Math.PI / 2));
    for (let i = 0; i < this.parts.length - 1; i++) {
      ctx.lineTo(...this.parts[i].getPoint(this.parts[i].radius * 8, Math.PI / 2));
    }
    ctx.lineTo(...this.parts[this.parts.length - 1].getPoint(0, 0));
    for (let i = this.parts.length - 2; i > -1; i--) {
      ctx.lineTo(...this.parts[i].getPoint(this.parts[i].radius * 8, -Math.PI / 2));
    }
    ctx.lineTo(...this.head.getPoint(this.head.radius * 8, -Math.PI / 2));
    ctx.closePath();
  }
  traceHead(ctx) {
    const h = this.head;
    ctx.beginPath();
    ctx.moveTo(...h.getPoint(h.radius * 8, Math.PI / 2 + 0.1));
    ctx.lineTo(...h.getPoint(h.radius * 9, Math.PI / 3));
    ctx.lineTo(...h.getPoint(h.radius * 10.5, Math.PI / 5));
    ctx.lineTo(...h.getPoint(h.radius * 11, Math.PI / 6));
    ctx.quadraticCurveTo(
      ...h.getPoint(h.radius * 20, 0),
      ...h.getPoint(h.radius * 11, -Math.PI / 6)
    );
    ctx.lineTo(...h.getPoint(h.radius * 10.5, -Math.PI / 5));
    ctx.lineTo(...h.getPoint(h.radius * 9, -Math.PI / 3));
    ctx.lineTo(...h.getPoint(h.radius * 8, -Math.PI / 2 - 0.1));
    ctx.closePath();
  }
  tracePondShadow(ctx) {
    // A slightly wider silhouette for the pond-floor shadow.
    ctx.beginPath();
    ctx.moveTo(...this.head.getPoint(this.head.radius * 9.3, Math.PI / 2));
    for (let i = 0; i < this.parts.length - 1; i++) {
      ctx.lineTo(...this.parts[i].getPoint(this.parts[i].radius * 9, Math.PI / 2));
    }
    ctx.lineTo(...this.parts[this.parts.length - 1].getPoint(0, 0));
    for (let i = this.parts.length - 2; i > -1; i--) {
      ctx.lineTo(...this.parts[i].getPoint(this.parts[i].radius * 9, -Math.PI / 2));
    }
    ctx.lineTo(...this.head.getPoint(this.head.radius * 9.3, -Math.PI / 2));
    // extend through head nose
    ctx.lineTo(...this.head.getPoint(this.head.radius * 20, 0));
    ctx.closePath();
  }
  traceDorsal(ctx) {
    ctx.beginPath();
    const start = Math.floor(this.parts.length / 5);
    const end = Math.floor((this.parts.length * 3) / 4);
    ctx.moveTo(...this.parts[start].getPoint(0, 0));
    for (let i = start + 1; i < end + 1; i++) {
      ctx.lineTo(...this.parts[i].getPoint(this.parts[i].radius * 2, Math.PI / 2));
    }
    ctx.lineTo(...this.parts[end].getPoint(0, 0));
    for (let i = end + 1; i > start; i--) {
      ctx.lineTo(...this.parts[i].getPoint(this.parts[i].radius * 2, -Math.PI / 2));
    }
    ctx.closePath();
  }
  // Traces a half-body slab along the spine, used for back-shading and
  // belly-highlighting. `sign` = +1 draws from the spine out to the top edge;
  // -1 draws from the spine out to the bottom edge.
  traceHalfBody(ctx, sign) {
    const s = Math.sign(sign) || 1;
    ctx.beginPath();
    // Start at head, outer edge
    ctx.moveTo(...this.head.getPoint(this.head.radius * 8, (Math.PI / 2) * s));
    for (let i = 0; i < this.parts.length - 1; i++) {
      ctx.lineTo(...this.parts[i].getPoint(this.parts[i].radius * 8, (Math.PI / 2) * s));
    }
    ctx.lineTo(...this.parts[this.parts.length - 1].getPoint(0, 0));
    // Back along the centreline (spine) — radius 0
    for (let i = this.parts.length - 2; i > -1; i--) {
      ctx.lineTo(...this.parts[i].getPoint(0, 0));
    }
    ctx.lineTo(...this.head.getPoint(0, 0));
    ctx.closePath();
  }

  // Volumetric shading: the single biggest perceived-quality win.
  //   • a darker slab over the TOP half (the back always sits in shadow
  //     underwater because light comes from above-and-forward)
  //   • a brighter slab over the BOTTOM half (scattered light bounces up from
  //     the pond floor onto the belly)
  //   • a short, travelling specular band along the dorsal ridge — reads as
  //     "scales catching the light" without drawing individual scales
  drawShading(ctx, surfaceness) {
    // Back-shade — stronger when near surface (more directional light contrast)
    ctx.save();
    ctx.globalAlpha = 0.16 + 0.14 * surfaceness;
    ctx.fillStyle = 'rgb(0, 18, 22)';
    this.traceHalfBody(ctx, +1);
    ctx.fill();
    ctx.restore();

    // Belly highlight — subtle, warmer cream tone
    ctx.save();
    ctx.globalAlpha = 0.09 + 0.09 * surfaceness;
    ctx.fillStyle = 'rgb(255, 246, 226)';
    this.traceHalfBody(ctx, -1);
    ctx.fill();
    ctx.restore();

    // Travelling specular shimmer — a short highlight that slides along the
    // spine. Only visible near the surface; deep fish don't catch the rays.
    const shimmerAlpha = 0.55 * surfaceness * surfaceness;
    if (shimmerAlpha > 0.04) {
      // Position along the fish, 0..1. Ping-pongs slowly via sin so it doesn't
      // just loop — it feels like the light's rolling with the body's bend.
      const pos = 0.5 + 0.45 * Math.sin(this.shimmerPhase);
      const n = this.parts.length;
      const centre = Math.max(1, Math.min(n - 2, Math.floor(pos * n)));
      const span = 3; // parts either side
      ctx.save();
      ctx.globalAlpha = shimmerAlpha;
      ctx.strokeStyle = 'rgba(255, 248, 220, 0.95)';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = centre - span; i <= centre + span; i++) {
        if (i < 0 || i >= n) continue;
        const [px, py] = this.parts[i].getPoint(this.parts[i].radius * 4.5, Math.PI / 2);
        // Taper the width by fading alpha at the ends of the span
        if (i === centre - span) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  drawSpots(ctx, v) {
    ctx.save();
    for (const spot of v.spots) {
      const idx = Math.max(0, Math.min(this.parts.length - 1, Math.floor(this.parts.length * spot.at)));
      const part = this.parts[idx];
      const r = part.radius * 5 * (spot.size || 1);
      const [cx, cy] = part.getPoint(part.radius * 2 * spot.side, spot.side === 0 ? 0 : Math.PI / 2 * Math.sign(spot.side));
      ctx.fillStyle = `rgba(${spot.hue[0]},${spot.hue[1]},${spot.hue[2]},0.86)`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.78, part.radian, 0, Math.PI * 2);
      ctx.fill();
    }

    // Asagi reticulation: small darker dots along the dorsal ridge that imply
    // individual scale outlines. We walk the spine and drop a tight grid of
    // dots above the centreline — cheap but reads right at a glance.
    if (v.reticulate) {
      const { colour, density } = v.reticulate;
      const start = Math.floor(this.parts.length * 0.08);
      const end = Math.floor(this.parts.length * 0.82);
      ctx.fillStyle = `rgba(${colour[0]},${colour[1]},${colour[2]},0.55)`;
      for (let i = start; i < end; i++) {
        const part = this.parts[i];
        const spacing = Math.max(1, Math.floor((end - start) / density));
        if (i % spacing !== 0) continue;
        // Three dots per row across the dorsal band
        for (let k = -1; k <= 1; k++) {
          const off = k * part.radius * 2.4;
          const [px, py] = part.getPoint(off, Math.PI / 2);
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.7, part.radius * 0.7), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }
}
