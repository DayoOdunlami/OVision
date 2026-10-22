// ═══════════════════════════════════════════════════════════════════
// board.js — the family's way for this season, and what each word means
// to the worlds.
//
// A board is one word for who we're becoming (and a line), up to three
// yeses, and the no that each yes protects ("no to hurry, so yes to
// slow dinners"). Each person has their own: a word, what it means to
// them (one of six themes), one yes, and, for grown-ups, a no kept on
// their own board only.
//
// Every word gets a theme, and the worlds move by themes, never by
// words: so any word a family writes works, and looks intended.
//   1. what the person tapped it means to them;
//   2. else the lexicon below;
//   3. else a gentle default, seeded from the word, so it's stable.
// ═══════════════════════════════════════════════════════════════════

export const THEMES = {
  rest:      { label: 'Resting',        hint: 'still, peaceful, held',            picture: 'rest' },
  together:  { label: 'Together',       hint: 'kind, close, welcoming',           picture: 'together' },
  growing:   { label: 'Growing',        hint: 'brave, learning, trying new',      picture: 'growing' },
  shining:   { label: 'Shining',        hint: 'joyful, hopeful, thankful',        picture: 'shining' },
  giving:    { label: 'Giving',         hint: 'generous, helpful, serving',       picture: 'giving' },
  steadfast: { label: 'Standing firm',  hint: 'steady, faithful, rooted',         picture: 'steadfast' },
};
export const THEME_ORDER = ['rest', 'together', 'growing', 'shining', 'giving', 'steadfast'];

const LEXICON = {
  rest: 'rest restful peace peaceful still stillness calm quiet abide abiding sabbath gentle gentleness patient patience slow trust trusting held content contentment meek humble humility soft unhurried selah breathe',
  together: 'together kind kindness welcome welcoming love loving friend friendly hospitality hospitable family belong belonging unity united forgive forgiving close share sharing listen listening tender compassion compassionate honest honesty open connected one present presence attentive',
  growing: 'brave bravery bold courage courageous grow growing growth learn learning curious curiosity adventure try new strong strength wise wisdom explore stretch flourish flourishing become becoming seek seeking fearless daring',
  shining: 'joy joyful hope hopeful thankful thanks grateful gratitude glad light shine shining bright delight praise wonder sing celebrate fun playful happy cheerful radiant overflow abound see',
  giving: 'generous generosity give giving helpful help serve serving service care caring fruit fruitful neighbour neighbor open-handed sacrifice blessing bless gift selfless hands useful',
  steadfast: 'steady steadfast faithful faithfulness rooted root firm stand standing loyal true truth persevere perseverance endure patient-endurance reliable anchored anchor rock solid committed diligent disciplined consistent obedient integrity',
};
const LOOKUP = (() => {
  const m = new Map();
  for (const [theme, words] of Object.entries(LEXICON)) for (const w of words.split(/\s+/)) if (!m.has(w)) m.set(w, theme);
  return m;
})();

// Words offered in the ritual for each picture: a child taps a picture,
// then a word from it, and nobody has to spell.
export const WORDS_FOR = {
  rest: ['Peace', 'Rest', 'Gentle', 'Patient', 'Still', 'Abide'],
  together: ['Kind', 'Welcome', 'Together', 'Honest', 'Forgiving', 'Loving'],
  growing: ['Brave', 'Bold', 'Curious', 'Wise', 'Strong', 'Learn'],
  shining: ['Joyful', 'Thankful', 'Hope', 'Glad', 'Bright', 'Wonder'],
  giving: ['Generous', 'Helpful', 'Serve', 'Caring', 'Fruitful', 'Open-handed'],
  steadfast: ['Steady', 'Faithful', 'Rooted', 'Loyal', 'True', 'Firm'],
};

export function hashOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function lexiconTheme(word) {
  const w = String(word || '').trim().toLowerCase();
  if (!w) return null;
  if (LOOKUP.has(w)) return LOOKUP.get(w);
  // "Kindness", "Bravely", "Rest well": try each word, then its stem.
  for (const part of w.split(/[\s-]+/)) {
    if (LOOKUP.has(part)) return LOOKUP.get(part);
    for (const cut of ['ness', 'fulness', 'ful', 'ly', 'ing', 'ed', 's', 'ity']) {
      if (part.endsWith(cut) && LOOKUP.has(part.slice(0, -cut.length))) return LOOKUP.get(part.slice(0, -cut.length));
    }
  }
  return null;
}

// The theme a word moves by.
export function themeOf(word, chosen) {
  if (chosen && THEMES[chosen]) return chosen;
  return lexiconTheme(word) || THEME_ORDER[hashOf(String(word || '').toLowerCase()) % THEME_ORDER.length];
}

// Yeses a family might choose, and the no each one protects.
export const YES_IDEAS = [
  { text: 'Slow dinners together', no: 'Phones at the table' },
  { text: 'Sunday kept for rest', no: 'Weekend errands' },
  { text: 'Praying for each other', no: '' },
  { text: 'Someone round each week', no: 'A full diary' },
  { text: 'Outside together', no: 'Screens after school' },
  { text: 'Saying sorry quickly', no: 'Sulking' },
  { text: 'Early nights', no: 'Hurry in the morning' },
  { text: 'Making things', no: '' },
];
export const KID_YES = ['Helping at dinner', 'Reading together', 'Playing outside', 'Being kind to my brother', 'Being kind to my sister', 'Praying at bedtime', 'Sharing my things', 'Trying new things'];

// Today's yes: the yeses take turns, one a day, the same all day on
// every device. Never a no.
export function todaysYes(board, date) {
  const yes = (board?.yes || []).filter((y) => y && y.text);
  if (!yes.length) return null;
  const day = Math.floor(Date.parse(date + 'T12:00:00Z') / 864e5);
  const i = ((day % yes.length) + yes.length) % yes.length;
  return { ...yes[i], index: i };
}

// A season's board, from the record, with every word's theme worked out.
export function boardOf(season, people) {
  if (!season) return null;
  const fam = season.family || {};
  const yes = (fam.yes || (fam.practices || []).map((text) => ({ text, no: '' }))).filter((y) => y && y.text).slice(0, 3);
  const mine = season.people || {};
  return {
    word: fam.word || '',
    line: fam.line || '',
    theme: themeOf(fam.word, fam.theme),
    yes,
    people: people.map((p) => {
      const m = mine[p.id] || {};
      const word = m.word || season.words?.[p.id] || '';
      return { ...p, word, theme: themeOf(word || p.name, m.theme), yes: m.yes || '', no: m.no || '' };
    }),
  };
}

// "Slow dinners together" → "slow dinners together", for "Yes to …".
// Names of days, months, God and family names keep their capital.
const PROPER = /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|January|February|March|April|May|June|July|August|September|October|November|December|God|Jesus|Christ|Lord|Mum|Dad|Grandma|Grandpa|Granny|Nana|Church|Christmas|Easter|Sabbath|I)\b/;
export const lowerFirst = (s, names = []) => {
  const t = String(s || '');
  if (PROPER.test(t) || names.some((n) => n && t.startsWith(n))) return t;
  return t.replace(/^[A-Z](?=[a-z\s])/, (c) => c.toLowerCase());
};
