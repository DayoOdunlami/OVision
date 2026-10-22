// ═══════════════════════════════════════════════════════════════════
// behaviour.js — how each koi moves by what its person's word means.
//
// The bank (studio P). A koi swims as SpineFish always has (its spine,
// its temperament, flight from a sudden hand, food); this only chooses
// where it is heading, by its person's theme:
//
//   rest       long idles in the shade under a yes pad, sinking deep
//   together   follows a companion: a different one each day
//   growing    explores: long journeys to the far edges, and first there
//   shining    rises to the surface often, into the light
//   giving     visits each of the others in turn, then a yes pad
//   steadfast  keeps a slow, even round of the still water
//
// And by the family's word: every few minutes the whole pond gathers
// round the word's still water for a while (never over it), at the
// pace of the family's theme, then goes back to its own ways.
// The two prayed for today swim as a pair for a minute at a time.
// Seeds per person and clocks that don't divide into each other keep
// it from ever looking like a loop.
// ═══════════════════════════════════════════════════════════════════

function seeded(n) {
  let s = (n * 2654435761) >>> 0 || 1;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

const GATHER_EVERY = 60 * 60 * 3.2;   // frames: about every three minutes…
const GATHER_FOR = 60 * 24;           // …for about twenty-four seconds

export class Mind {
  constructor(k, person, i) {
    this.k = k;
    this.id = person.id;
    this.theme = person.theme || 'rest';
    this.i = i;
    this.rand = seeded(i * 97 + person.id.length * 13 + person.id.charCodeAt(0));
    this.visit = 0;
    this.angle = this.rand() * Math.PI * 2;
    this.dir = this.rand() < 0.5 ? -1 : 1;
    this.idleBoosted = false;
    this.shine = 400 + this.rand() * 600;
    this.install();
  }

  // Each theme chooses its own next place to go.
  install() {
    const f = this.k.fish;
    const self = this;
    const plain = f.pickWanderTarget.bind(f);
    f.pickWanderTarget = function pick(W, H) {
      const env = self.env;
      if (!env) return plain(W, H);
      const r = self.rand;
      if (self.theme === 'rest' && env.pads.length && r() < 0.75) {
        const p = env.pads[Math.floor(r() * env.pads.length)];
        this.target.x = p.x + (r() - 0.5) * p.r * 0.8;
        this.target.y = p.y + (r() - 0.5) * p.r * 0.8;
        return;
      }
      if (self.theme === 'growing') {
        // Somewhere far: an edge of the pond, away from here.
        const m = 70;
        for (let k = 0; k < 6; k++) {
          const side = Math.floor(r() * 4);
          const x = side === 0 ? m : side === 1 ? W - m : m + r() * (W - 2 * m);
          const y = side === 2 ? m : side === 3 ? H - m : m + r() * (H - 2 * m);
          if (Math.hypot(x - this.mouth.x, y - this.mouth.y) > Math.min(W, H) * 0.45 || k === 5) {
            this.target.x = x; this.target.y = y;
            this.energy = Math.max(this.energy, 0.62);
            return;
          }
        }
      }
      if (self.theme === 'giving' && env.minds.length > 1) {
        // The next one round; after all of them, a yes pad.
        const others = env.minds.filter((m) => m !== self);
        self.visit = (self.visit + 1) % (others.length + 1);
        if (self.visit < others.length) {
          const o = others[self.visit].k.fish;
          this.target.x = o.mouth.x; this.target.y = o.mouth.y;
          self.visiting = others[self.visit];
          return;
        }
        self.visiting = null;
        if (env.pads.length) {
          const p = env.pads[Math.floor(r() * env.pads.length)];
          this.target.x = p.x; this.target.y = p.y;
          return;
        }
      }
      plain(W, H);
    };
  }

  // Called every frame before the fish's own update.
  steer(env) {
    this.env = env;
    const f = this.k.fish;
    const busy = f.fleeCooldown > 0 || f.feedTarget || this.k.held;
    if (busy) return;
    const { t } = env;

    // The family gathers round its word.
    if (env.gather > 0 && env.rim) {
      const n = env.minds.length;
      const spin = { rest: 0, together: 0.0016, growing: 0.0026, shining: 0.002, giving: 0.0018, steadfast: 0.0012 }[env.familyTheme] || 0.0015;
      const a = (this.i / n) * Math.PI * 2 + t * spin;
      f.target.x = env.rim.x + Math.cos(a) * env.rim.rx;
      f.target.y = env.rim.y + Math.sin(a) * env.rim.ry;
      f.isIdle = false;
      f.wanderTimer = 0;
      if (env.familyTheme === 'shining') f.targetDepth = 0.05;
      else if (env.familyTheme === 'rest') f.targetDepth = Math.max(f.targetDepth, 0.5);
      return;
    }

    // Someone's own board: their koi comes up under their word; the
    // others go deep and quiet.
    if (env.focus) {
      if (this.id === env.focus && env.rim) {
        this.angle += 0.004 * this.dir;
        f.target.x = env.rim.x + Math.cos(this.angle) * env.rim.rx * 0.9;
        f.target.y = env.rim.y + env.rim.ry * 0.95 + Math.sin(this.angle) * env.rim.ry * 0.35;
        f.isIdle = false;
        f.targetDepth = 0.08;
      } else {
        f.targetDepth = Math.max(f.targetDepth, 0.78);
      }
      return;
    }

    // The two prayed for today keep each other company, a minute at a time.
    const pairWith = env.pairs.get(this.id);
    if (pairWith && Math.floor((t + this.i * 600) / 3600) % 2 === 0) {
      this.follow(pairWith.k.fish, 60);
      return;
    }

    switch (this.theme) {
      case 'rest':
        if (f.isIdle && !this.idleBoosted) { f.idleDuration *= 2.6; this.idleBoosted = true; }
        if (!f.isIdle) this.idleBoosted = false;
        if (f.targetDepth < 0.45 && f.surfaceBreakCooldown > 200) f.targetDepth = 0.5 + this.rand() * 0.2;
        if (f.isIdle) f.energy = Math.min(f.energy, 0.16);
        break;
      case 'together': {
        const day = env.dayIndex;
        const others = env.minds.filter((m) => m !== this);
        if (others.length) this.follow(others[(day + this.i) % others.length].k.fish, 75);
        break;
      }
      case 'shining':
        if (f.surfaceBreakCooldown > 900) f.surfaceBreakCooldown = 900;
        if (--this.shine <= 0) { f.targetDepth = 0.02 + this.rand() * 0.1; this.shine = 300 + this.rand() * 500; }
        break;
      case 'giving':
        // Keep the visit on whoever it's visiting as they move.
        if (this.visiting && !f.isIdle) {
          const o = this.visiting.k.fish;
          f.target.x = o.mouth.x; f.target.y = o.mouth.y;
        }
        break;
      case 'steadfast':
        if (env.rim) {
          this.angle += 0.0019 * this.dir;
          f.target.x = env.rim.x + Math.cos(this.angle) * env.rim.rx * 1.15;
          f.target.y = env.rim.y + Math.sin(this.angle) * env.rim.ry * 1.2;
          f.isIdle = false;
          f.wanderTimer = 0;
          f.energy += (0.34 - f.energy) * 0.05;
        }
        break;
      default:
    }
  }

  follow(o, gap) {
    const f = this.k.fish;
    const hx = o.head.x - o.mouth.x, hy = o.head.y - o.mouth.y;
    const d = Math.hypot(hx, hy) || 1;
    // Just behind and a little to the side, never on top.
    f.target.x = o.mouth.x + (hx / d) * gap + (-hy / d) * gap * 0.4;
    f.target.y = o.mouth.y + (hy / d) * gap + (hx / d) * gap * 0.4;
    f.isIdle = false;
    f.wanderTimer = 0;
  }
}

// When the whole pond next gathers: 0 → 1 → 0 over the gathering.
export function gatherAt(t, offset = 0) {
  const u = (t + offset) % GATHER_EVERY;
  return u < GATHER_FOR ? 1 : 0;
}
