// ═══════════════════════════════════════════════════════════════════
// Sprint 2's switches. Every change from the list is on by default and
// can be turned off in the address, so each can be seen on its own:
//
//   ?off=hills,squash        two of them off
//   ?off=all                 every switch off (the v2 baseline alone)
//
//   wetdial     the dial change spreads like colour into wet paper
//   richer      a little more tone and pigment in Ink and wash
//   hills       mist and cloud shadow moving on the hills; rare birds
//   squash      the pond seen at an angle: drawn from above, squashed
//   fullsize    in the pond, the koi grow back to today's size
//   smoothmove  one continuous move into the pond and back
//   touch       koi come to a touch, shy ones scatter, double-tap feeds
//   garden      touch the garden and walk into the Abide field
// ═══════════════════════════════════════════════════════════════════

export const SWITCHES = ['wetdial', 'richer', 'hills', 'squash', 'fullsize', 'smoothmove', 'touch', 'garden'];

// Switches left off unless asked for with ?on= (none: every item on the
// list made the study better).
const DEFAULT_OFF = [];

const q = new URLSearchParams(location.search);
const list = (k) => (q.get(k) || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const off = new Set(list('off').includes('all') ? SWITCHES : list('off'));
for (const s of DEFAULT_OFF) if (!list('on').includes(s)) off.add(s);

export const on = (name) => !off.has(name);
