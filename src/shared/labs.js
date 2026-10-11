// ═══════════════════════════════════════════════════════════════════
// Labs: every change from a design pass sits behind a flag, so it can be
// compared with what was there before and kept only if it's better.
//
//   /labs/                   the switchboard: each change, New or Classic
//   ?labs=classic            this visit only: every flag off
//   ?labs=new                this visit only: every flag on
//   ?lab=abide.breathWords   this visit only: just these on (comma list),
//                            everything else Classic — for A/B side by side
//
// Choices made on /labs/ are kept per device under `labs`.
// Flags default to on (the new behaviour) unless `defaultOn: false`.
// ═══════════════════════════════════════════════════════════════════

export const LABS = [
  // ── Abide ──────────────────────────────────────────────────────────
  { key: 'abide.breathWords', surface: 'Abide', title: 'Words on the breath',
    what: 'While the vine grows, a short breath prayer from the verse rides the breath: “Abide in me” on the in-breath, “and I in you” on the out-breath.',
    classic: '“breathe in” / “breathe out”.', path: '/flourish/abide/', query: 'at=sow',
    howTo: 'Watch under the growing vine: the words change with each breath.' },
  { key: 'abide.readTwice', surface: 'Abide', title: 'Read it twice (Lectio)',
    what: 'When the vine has grown, the verse is read a second time, a line at a time, with the word picked out. The question comes after.',
    classic: 'The verse is read once; the question comes halfway through growing.', path: '/flourish/abide/', query: 'at=sow',
    howTo: 'Let the vine finish growing (about two minutes) to see the second reading.' },
  { key: 'abide.stillness', surface: 'Abide', title: '15 seconds of stillness',
    what: 'After the question, about fifteen seconds to be still (the breath carries on) before “Gather” appears.',
    classic: '“Gather” appears as soon as the vine has grown.', path: '/flourish/abide/', query: 'at=sow',
    howTo: 'Let the vine finish growing; then watch for the Gather button.' },
  { key: 'abide.smallField', surface: 'Abide', title: 'A smaller field, shared',
    what: 'About five things to clear for one person, more for each person here (two people, ten; four, twenty). Skipped if everyone here has already cleared it today.',
    classic: 'Sixteen things to clear, every visit.', path: '/flourish/abide/', query: '',
    howTo: 'Count the stones and thorns; tap another person to see the field grow.' },
  { key: 'abide.noFreeWrite', surface: 'Abide', title: 'No “Free write” in the menu',
    what: 'Abide’s menu is just Pond · Abide · Pray.',
    classic: 'A switch between Abide and Free write.', path: '/flourish/abide/', query: '',
    howTo: 'Look at the menu at the top.' },
  { key: 'abide.humanLine', surface: 'Abide', title: 'One human sentence in the vineyard',
    what: 'The vineyard says something like “Bella and Dad have abided together 7 times.”',
    classic: '“22 vines · 7 days together · a wall of 40 stones”.', path: '/flourish/abide/', query: 'at=vineyard',
    howTo: 'Read the line at the foot of the vineyard.' },
  { key: 'abide.wonder', surface: 'Abide', title: '“I wonder…” questions',
    what: 'The questions are open “I wonder…” prompts (as in Godly Play), and the answer box says “Write a line, or just be still”.',
    classic: 'Direct questions (“Where do you need to abide today?”).', path: '/flourish/abide/', query: 'at=sow',
    howTo: 'The question appears as the vine grows (Classic) or after it (New).' },
  { key: 'abide.closingLine', surface: 'Abide', title: 'A closing line',
    what: 'After the gather: “Carry Abide with you today.”',
    classic: 'No closing line.', path: '/flourish/abide/', query: 'at=sow',
    howTo: 'Gather the vine into the vineyard to see it.' },
];

const KEY = 'labs';

function stored() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch { return {}; }
}

function urlMode() {
  try {
    const q = new URLSearchParams(location.search);
    const all = q.get('labs');
    if (all === 'classic' || all === 'new') return { all };
    const only = q.get('lab');
    if (only) return { only: only.split(',').map((s) => s.trim()).filter(Boolean) };
  } catch { /* ignore */ }
  return null;
}

const def = (key) => LABS.find((l) => l.key === key)?.defaultOn !== false;

// Is this change on, for this visit?
export function lab(key) {
  const u = urlMode();
  if (u?.all) return u.all === 'new';
  if (u?.only) return u.only.includes(key);
  const s = stored();
  return typeof s[key] === 'boolean' ? s[key] : def(key);
}

// The saved choice (ignores the URL), for the switchboard.
export function labSaved(key) {
  const s = stored();
  return typeof s[key] === 'boolean' ? s[key] : def(key);
}

export function setLab(key, on) {
  const s = stored();
  s[key] = Boolean(on);
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function setAllLabs(on, surface) {
  const s = stored();
  for (const l of LABS) if (!surface || l.surface === surface) s[l.key] = Boolean(on);
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
