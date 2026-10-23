// The study's three media share the original living skeleton. SpineFish.draw
// advances its fins and tail, so it runs exactly once per tick into a cache,
// including while Colour is hidden. Ink and wash read that resulting pose.
import SpineFish, { buildPondMix } from '../app/pond/SpineFish.js';
import { stroke, wash } from './brush.js';

const PI = Math.PI;
const INACTIVE = Object.freeze({ x: -9999, y: -9999 });
const EMPTY_ENV = Object.freeze({ food: [], onBreak() {} });
const STILL = () => {};
const clamp = (n) => Math.max(0, Math.min(1, n));
const point = (p) => [p.x, p.y];

// SpineFish's renderer owns two motion updates. Run that same renderer while
// its medium is hidden, but without issuing native Canvas work (even a 1px
// clipped canvas can allocate large offscreen blur surfaces). This explicit
// facade implements only the Canvas API used by the unchanged source asset.
export function createMotionContext() {
  return {
    filter: undefined,
    globalAlpha: 1,
    save: STILL, restore: STILL, beginPath: STILL, closePath: STILL,
    moveTo: STILL, lineTo: STILL, quadraticCurveTo: STILL,
    arc: STILL, ellipse: STILL, fill: STILL, stroke: STILL,
    translate: STILL, scale: STILL,
  };
}

function surface(width, height, density, padding = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((width + padding * 2) * density));
  canvas.height = Math.max(1, Math.round((height + padding * 2) * density));
  const context = canvas.getContext('2d');
  context.setTransform(density, 0, 0, density, padding * density, padding * density);
  return { canvas, context };
}

// A few extra samples soften the original polygon's outline without changing
// its anatomical anchors. Explicit pressure follows the brush gesture rather
// than the unequal spacing between the head, spine and tail joints.
function softLine(points, closed = false, pressure = .56) {
  const result = [];
  const length = points.length;
  for (let i = 0; i < (closed ? length : length - 1); i++) {
    const pick = (n) => points[closed ? (n + length) % length : Math.max(0, Math.min(length - 1, n))];
    const a = pick(i - 1), b = pick(i), c = pick(i + 1), d = pick(i + 2);
    for (let j = 0; j < 3; j++) {
      const t = j / 3, t2 = t * t, t3 = t2 * t;
      const xy = [0, 1].map((axis) => .5 * (
        2 * b[axis] + (-a[axis] + c[axis]) * t
        + (2 * a[axis] - 5 * b[axis] + 4 * c[axis] - d[axis]) * t2
        + (-a[axis] + 3 * b[axis] - 3 * c[axis] + d[axis]) * t3
      ));
      const u = (i + t) / (closed ? length : length - 1);
      xy.push(pressure * (.58 + .42 * Math.sin(PI * u)));
      result.push(xy);
    }
  }
  result.push([...(closed ? points[0] : points[length - 1]), pressure * .3]);
  return result;
}

function outline(fish) {
  const h = fish.head, r = h.radius;
  const contour = [h.getPoint(r * 8, PI / 2)];
  for (const part of fish.parts.slice(0, -1)) contour.push(part.getPoint(part.radius * 8, PI / 2));
  contour.push(point(fish.parts[fish.parts.length - 1]));
  for (const part of fish.parts.slice(0, -1).reverse()) contour.push(part.getPoint(part.radius * 8, -PI / 2));
  contour.push(h.getPoint(r * 8, -PI / 2), h.getPoint(r * 9, -PI / 3), h.getPoint(r * 10.5, -PI / 5));
  const a = h.getPoint(r * 11, -PI / 6), control = h.getPoint(r * 20, 0), b = h.getPoint(r * 11, PI / 6);
  contour.push(a);
  for (let i = 1; i <= 8; i++) {
    const t = i / 8, s = 1 - t;
    contour.push([s * s * a[0] + 2 * s * t * control[0] + t * t * b[0], s * s * a[1] + 2 * s * t * control[1] + t * t * b[1]]);
  }
  contour.push(h.getPoint(r * 10.5, PI / 5), h.getPoint(r * 9, PI / 3));
  return softLine(contour, true);
}

function finOutline(fin) {
  const rows = fin.pieces;
  return [point(rows[0][0]), ...rows[0].slice(1).map(point), ...rows.slice(1).map((row) => point(row[row.length - 1])), ...rows[rows.length - 1].slice(0, -1).reverse().map(point)];
}

function tailOutline(tail) {
  return [point(tail.tip), ...tail.pieces[0].map(point), ...tail.pieces.slice(1).map((row) => point(row[row.length - 1])), ...tail.pieces[tail.pieces.length - 1].slice(0, -1).reverse().map(point)];
}

function depthTransform(ctx, fish) {
  const scale = .78 + .28 * (1 - clamp(fish.depth));
  ctx.translate(fish.head.x, fish.head.y);
  ctx.scale(scale, scale);
  ctx.translate(-fish.head.x, -fish.head.y);
}

function drawInk(ctx, fish, index, night) {
  const ink = night ? '#c7c9b5' : '#293b34';
  const alpha = .9 - clamp(fish.depth) * .2;
  const seed = 149 + index * 103;
  const line = (points, width, id, opacity = 1, closed = false) => stroke(ctx, softLine(points, closed), { width, colour: ink, seed: seed + id, alpha: alpha * opacity, dry: .43 });
  ctx.save();
  depthTransform(ctx, fish);
  // Membrane edges and a restrained selection of the original living rays.
  for (let k = 0; k < fish.fins.fins.length; k++) {
    const fin = fish.fins.fins[k];
    line(finOutline(fin), .9, 10 + k, .63, true);
    for (const j of [0, 3, 6]) line(fin.pieces[j].map(point), .66, 20 + k * 7 + j, .44);
  }
  // Like the original opaque body, an unpainted fish interior interrupts the
  // rays behind it. Erase only earlier ink, leaving the paper/water visible;
  // this avoids an X-ray tangle while keeping Ink strictly a line medium.
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 1;
  fish.traceBody(ctx); ctx.fill();
  fish.traceHead(ctx); ctx.fill();
  ctx.restore();
  stroke(ctx, outline(fish), { width: 2.1, colour: ink, seed, alpha, dry: .36 });
  // One broken dorsal gesture, rather than a second silhouette or a bone diagram.
  const start = Math.floor(fish.parts.length / 5);
  const end = Math.floor(fish.parts.length * .7);
  line(fish.parts.slice(start, end + 1).map((p) => p.getPoint(p.radius * .85, PI / 2)), 1.55, 81, .58);
  const tail = fish.tail;
  line(tailOutline(tail), 1.05, 61, .75, true);
  for (let j = 0; j < tail.pieces.length; j++) line([point(tail.tip), ...tail.pieces[j].map(point)], .7, 70 + j, .58);
  const h = fish.head;
  const [ex, ey] = h.getPoint(h.radius * 8.5, PI / 3);
  const er = Math.max(1.5, h.radius * .85);
  // The eye is a small pooled brush mark, using the same position as Colour.
  stroke(ctx, [[ex - er * .2, ey, .85], [ex + er * .2, ey, .7]], { width: er * 2, colour: ink, seed: seed + 90, alpha, dry: .08 });
  ctx.restore();
}

function drawWash(ctx, fish, index, night) {
  const seed = 809 + index * 113;
  const name = fish.variety.name;
  const pigment = night ? '#879c9a' : name === 'chagoi' ? '#b9905c' : name === 'showa' ? '#7f9394' : '#b9bda7';
  ctx.save();
  depthTransform(ctx, fish);
  for (let i = 0; i < fish.fins.fins.length; i++) wash(ctx, finOutline(fish.fins.fins[i]), { colour: pigment, seed: seed + i, alpha: .13, layers: 3 });
  wash(ctx, tailOutline(fish.tail), { colour: pigment, seed: seed + 8, alpha: .16, layers: 3 });
  wash(ctx, outline(fish), { colour: pigment, seed, alpha: .3 - clamp(fish.depth) * .07, layers: 4 });
  // Sparse clay pigment follows the existing variety's actual spot anchors.
  for (let i = 0; i < (fish.variety.spots || []).length; i++) {
    const spot = fish.variety.spots[i];
    if (spot.hue[0] < 100) continue;
    const part = fish.parts[Math.min(fish.parts.length - 2, Math.floor(spot.at * fish.parts.length))];
    const [x, y] = part.getPoint(part.radius * 2.5, spot.side * PI / 2);
    const radius = part.radius * 4.8 * spot.size;
    const polygon = Array.from({ length: 9 }, (_, j) => [x + Math.cos(j / 9 * PI * 2 + part.radian) * radius, y + Math.sin(j / 9 * PI * 2 + part.radian) * radius * .75]);
    wash(ctx, polygon, { colour: night ? '#b2937d' : '#b97959', seed: seed + 20 + i, alpha: .23, layers: 3 });
  }
  ctx.restore();
}

/** A single persistent simulation, independent of dial setting and camera. */
export function createPond(width, height, { reduced = false } = {}) {
  const W = Math.max(1, width), H = Math.max(1, height);
  const density = Math.min(1.5, globalThis.devicePixelRatio || 1);
  // The scroll camera sees beyond the simulation rectangle. Retain complete
  // native bodies there, rather than exposing a rectangular cache cut inside
  // the oval basin. This margin changes drawing extent, never wrap bounds.
  const padding = 250;
  const colour = surface(W, H, density, padding);
  const ink = surface(W, H, density, padding);
  const pigment = surface(W, H, density, padding);
  const fish = buildPondMix(3).map((variety) => new SpineFish(W, H, { ...variety, sizeScale: variety.sizeScale * .6 }));
  const initialPlaces = [[.25, .44], [.52, .55], [.74, .47]];
  fish.forEach((f, i) => f.shift(W * initialPlaces[i][0] - f.head.x, H * initialPlaces[i][1] - f.head.y));
  let version = 0, colourVersion = -1, inkVersion = -1, washVersion = -1, inkNight, washNight;
  const clear = ({ context }) => context.clearRect(-padding, -padding, W + padding * 2, H + padding * 2);

  // The source builds its chains at their rest coordinates; the mouth and
  // elastic fin/tail joints need a short run-in before that becomes a valid
  // swimming pose. Run the exact original pair with no raster work, so
  // reduced motion never freezes the unrelaxed construction pose.
  const motionContext = createMotionContext();
  for (let tick = 0; tick < 72; tick++) {
    for (const f of fish) {
      f.update(W, H, INACTIVE, EMPTY_ENV);
      f.draw(motionContext);
    }
  }

  function advance(paintColour = true) {
    if (paintColour) clear(colour);
    // Keep the original update + draw pair together: draw owns fin/tail motion.
    for (const f of fish) {
      f.update(W, H, INACTIVE, EMPTY_ENV);
      f.draw(paintColour ? colour.context : motionContext);
    }
    version++;
    if (paintColour) colourVersion = version;
  }
  advance();

  function refreshColour() {
    clear(colour);
    // A live reduced-motion change may freeze an Ink pose after hidden Colour
    // steps. Repaint that exact pose with the unchanged original renderer,
    // suppressing only its two animation hooks for this read-only refresh.
    // Restore own-property status as well as method identity, even on failure.
    for (const f of fish) {
      const finsOwn = Object.hasOwn(f.fins, 'act'), tailOwn = Object.hasOwn(f.tail, 'act');
      const finsAct = f.fins.act, tailAct = f.tail.act;
      try {
        f.fins.act = STILL;
        f.tail.act = STILL;
        f.draw(colour.context);
      } finally {
        if (finsOwn) f.fins.act = finsAct; else delete f.fins.act;
        if (tailOwn) f.tail.act = tailAct; else delete f.tail.act;
      }
    }
    colourVersion = version;
  }

  return {
    width: W,
    height: H,
    fish,
    colourCanvas: colour.canvas,
    step({ paintColour = true } = {}) { if (!reduced) advance(paintColour); },
    draw(ctx, { ink: inkWeight = 0, wash: washWeight = 0, colour: colourWeight = 0, night = false } = {}) {
      const compose = (layer, weight) => {
        if (weight <= 0) return;
        ctx.save();
        ctx.globalAlpha *= clamp(weight);
        ctx.drawImage(layer.canvas, -padding, -padding, W + padding * 2, H + padding * 2);
        ctx.restore();
      };
      if (washWeight > 0 && (washVersion !== version || washNight !== night)) {
        clear(pigment);
        fish.forEach((f, i) => drawWash(pigment.context, f, i, night));
        washVersion = version;
        washNight = night;
      }
      if (inkWeight > 0 && (inkVersion !== version || inkNight !== night)) {
        clear(ink);
        fish.forEach((f, i) => drawInk(ink.context, f, i, night));
        inkVersion = version;
        inkNight = night;
      }
      if (colourWeight > 0 && colourVersion !== version) refreshColour();
      compose(pigment, washWeight);
      compose(ink, inkWeight);
      compose(colour, colourWeight);
    },
  };
}
