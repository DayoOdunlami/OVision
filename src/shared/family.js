// ═══════════════════════════════════════════════════════════════════
// family.js — the household roster, shared by both surfaces.
//
// Before the prayer surface moved to React this list lived in two
// places (the prayer page's inline script and the pond's prayerLink),
// kept in sync by a comment. Now both import it from here.
//
// ORDER MATTERS. The prayer rota stores pairs as *indices* into this
// array (e.g. [[0,5],[3,4],…]) in localStorage. Reordering or inserting
// in the middle would silently reassign every saved pairing. Append new
// people at the end.
// ═══════════════════════════════════════════════════════════════════

export const FAMILY = [
  { name: 'Dayo',     label: 'Dad' },
  { name: 'Claire',   label: 'Mum' },
  { name: 'Bella',    label: 'Bella' },
  { name: 'Florence', label: 'Florence' },
  { name: 'Keziah',   label: 'Keziah' },
  { name: 'Ezra',     label: 'Ezra' },
];

export const DEFAULT_SELF = 'Dayo';

// The localStorage key both surfaces agree on. The prayer surface is
// the only writer; the pond only reads.
export const PRAYER_STORAGE_KEY = 'familyPrayer';
