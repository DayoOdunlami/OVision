// ═══════════════════════════════════════════════════════════════════
// puzzle.js — turning a verse into slots and pieces.
//
// Three ways to cut a verse, chosen in the puzzle header:
//
//   memory   every third word falls; the rest stay as scaffolding.
//            This is the classic cloze technique for memorising
//            Scripture, and the default — it's the least fiddly and
//            the most useful.
//   words    every word falls.
//   phrases  words fall in runs of two or three. Easier for children,
//            and keeps a long verse to a manageable number of pieces
//            on a phone.
//
// Names never fall. They're the anchors — who this is for — and stay
// in place, in gold.
//
// Matching is by *text*, not identity: two pieces that both read
// "the" are interchangeable, so a repeated word can never be "right
// word, wrong copy".
// ═══════════════════════════════════════════════════════════════════

export const PUZZLE_MODES = [
  { value: 'memory',  label: 'Memory' },
  { value: 'words',   label: 'Words' },
  { value: 'phrases', label: 'Phrases' },
];

const MODE_KEY = 'familyPrayer.puzzleMode';

export function readPuzzleMode() {
  try {
    const v = localStorage.getItem(MODE_KEY);
    return PUZZLE_MODES.some((m) => m.value === v) ? v : 'memory';
  } catch {
    return 'memory';
  }
}

export function writePuzzleMode(v) {
  try { localStorage.setItem(MODE_KEY, v); } catch {}
}

// Split the verse's authored HTML into words, remembering which ones
// are names. Words are built character by character across element
// boundaries, so "<span class=name>Claire</span>'s" stays one word
// ("Claire's") rather than splitting at the tag.
export function tokenize(html) {
  const host = document.createElement('div');
  // Authored content from data/prayers.js only; never user input.
  host.innerHTML = String(html).replace(/<br\s*\/?>/gi, ' ');

  const segs = [];
  const walk = (node, isName) => {
    node.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) segs.push({ text: n.nodeValue, isName });
      else if (n.nodeType === Node.ELEMENT_NODE) {
        walk(n, isName || n.classList.contains('name-highlight'));
      }
    });
  };
  walk(host, false);

  const tokens = [];
  let cur = null;
  for (const seg of segs) {
    for (const ch of seg.text) {
      if (/\s/.test(ch)) {
        if (cur) { tokens.push(cur); cur = null; }
      } else {
        if (!cur) cur = { text: '', isName: false };
        cur.text += ch;
        if (seg.isName) cur.isName = true;
      }
    }
  }
  if (cur) tokens.push(cur);
  return tokens;
}

const hasLetter = (s) => /\p{L}/u.test(s);
const letterCount = (s) => (s.match(/\p{L}/gu) || []).length;

// Words too common to be worth recalling. In Memory mode a verse like
// Psalm 121:3–6 otherwise dropped "the" five times out of nine — no
// help to anyone learning it. (Words and Phrases modes still use them:
// there, every word falls anyway.)
const FILLER = new Set([
  'the', 'and', 'but', 'for', 'nor', 'yet', 'you', 'your', 'yours',
  'they', 'them', 'their', 'theirs', 'that', 'this', 'these', 'those',
  'with', 'from', 'into', 'onto', 'are', 'was', 'were', 'has', 'have',
  'had', 'our', 'ours', 'its', 'his', 'her', 'him', 'she', 'what',
  'when', 'then', 'than', 'all', 'let', 'who', 'may', 'will', 'can',
  'just', 'not', 'too', 'very', 'out', 'how',
]);
const bare = (s) => s.toLowerCase().replace(/[^\p{L}']/gu, '').replace(/'s$/, '');
const isCue = (s) => letterCount(s) >= 3 && !FILLER.has(bare(s));

// → { tokens, slots: [{ idxs, text }], slotAt: Map<tokenIdx, slotIdx>,
//     covered: Set<tokenIdx> }
export function buildPuzzle(html, mode) {
  const tokens = tokenize(html);
  const isWord = (t) => !t.isName && hasLetter(t.text);
  const groups = [];

  if (mode === 'words') {
    tokens.forEach((t, i) => { if (isWord(t)) groups.push([i]); });
  } else if (mode === 'phrases') {
    // Runs of consecutive words, broken by names and bare punctuation,
    // cut into chunks of three — never leaving a lonely single word if
    // it can be avoided (4 → 2+2).
    let run = [];
    const flush = () => {
      while (run.length) {
        const n = run.length === 4 ? 2 : Math.min(3, run.length);
        groups.push(run.splice(0, n));
      }
    };
    // A phrase also ends at the end of a clause, so a tile never reads
    // across a full stop ("about you. A").
    tokens.forEach((t, i) => {
      if (!isWord(t)) { flush(); return; }
      run.push(i);
      if (/[.!?;:]["'’”)]*$/.test(t.text)) flush();
    });
    flush();
  } else {
    // Memory: roughly every third word, skipping tiny and filler words
    // ("a", "of", "the", "them"), which make poor recall cues.
    let gap = 0;
    tokens.forEach((t, i) => {
      if (!isWord(t)) return;
      if (gap >= 2 && isCue(t.text)) {
        groups.push([i]);
        gap = 0;
      } else {
        gap++;
      }
    });
    if (groups.length === 0) {
      // Very short verse — take its longest word so there's something
      // to do.
      let best = -1;
      tokens.forEach((t, i) => {
        if (isWord(t) && (best < 0 || letterCount(t.text) > letterCount(tokens[best].text))) best = i;
      });
      if (best >= 0) groups.push([best]);
    }
  }

  const slots = groups.map((idxs) => ({
    idxs,
    text: idxs.map((i) => tokens[i].text).join(' '),
  }));
  const slotAt = new Map();
  const covered = new Set();
  slots.forEach((s, k) => {
    slotAt.set(s.idxs[0], k);
    s.idxs.slice(1).forEach((i) => covered.add(i));
  });

  return { tokens, slots, slotAt, covered };
}
