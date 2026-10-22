// A chosen direction, rather than a record of performance. The old season
// fields stay intact so prayer, history and device links keep their meaning.
export const THEMES = [
  { id: 'belong', label: 'Belonging', hint: 'Being rooted in each other.' },
  { id: 'rest', label: 'Rest', hint: 'Making room to be still.' },
  { id: 'grow', label: 'Growth', hint: 'Taking the next small step.' },
  { id: 'give', label: 'Giving', hint: 'Letting what we have flow outwards.' },
  { id: 'steady', label: 'Steadiness', hint: 'Returning to what matters.' },
  { id: 'welcome', label: 'Welcome', hint: 'Opening a space for someone.' },
];

const THEME_IDS = new Set(THEMES.map((t) => t.id));
const LEXICON = [
  ['belong', /\b(root(?:ed|s)?|belong(?:ing)?|together|abide|family|connected|love|faithful)\b/i],
  ['rest', /\b(rest(?:ful)?|sabbath|peace(?:ful)?|still(?:ness)?|quiet|present|unhurried|silence)\b/i],
  ['give', /\b(giv(?:e|ing)|generous|generosity|kind(?:ness)?|serve|service|help(?:ful)?|share|sharing|open.hand(?:ed)?)\b/i],
  ['steady', /\b(stead(?:y|iness)|patient|patience|gentle|gentleness|endure|endurance|honest|honesty|true|truth)\b/i],
  ['welcome', /\b(welcome|hospitality|hospitable|friend(?:ly|ship)?|include|inclusion|open.door)\b/i],
  ['grow', /\b(grow(?:th|ing)?|brave|courage(?:ous)?|bold|curious|joy(?:ful)?|hope(?:ful)?|flourish|fruit(?:ful)?)\b/i],
];

export function themeFor(word) {
  return LEXICON.find(([, pattern]) => pattern.test(String(word || '')))?.[0] || 'grow';
}

const clean = (text, max) => typeof text === 'string' ? text.replace(/\s+/g, ' ').trim().slice(0, max) : '';

export function normaliseBoard(board = {}, fallback = {}) {
  board = board && typeof board === 'object' ? board : {};
  fallback = fallback && typeof fallback === 'object' ? fallback : {};
  const word = clean(board.word ?? fallback.word, 32);
  return {
    word,
    yes: clean(board.yes ?? fallback.yes, 100),
    no: clean(board.no ?? fallback.no, 100),
    theme: THEME_IDS.has(board.theme) ? board.theme : THEME_IDS.has(fallback.theme) ? fallback.theme : themeFor(word),
  };
}

export function deriveBoard(season, personId) {
  if (personId) {
    return normaliseBoard(season?.compass?.people?.[personId], { word: season?.words?.[personId] || '' });
  }
  return normaliseBoard(season?.compass?.family, {
    word: season?.family?.word || '',
    yes: season?.family?.practices?.[0] || '',
  });
}

export function withCompass(season, compass) {
  const family = normaliseBoard(compass?.family, deriveBoard(season));
  const people = { ...(season?.compass?.people || {}) };
  for (const [id, board] of Object.entries(compass?.people || {})) {
    people[id] = normaliseBoard(board, deriveBoard(season, id));
  }
  const words = { ...(season?.words || {}) };
  for (const [id, board] of Object.entries(people)) words[id] = board.word;
  return {
    ...season,
    family: { ...(season?.family || {}), word: family.word },
    words,
    compass: { ...(season?.compass || {}), family, people },
  };
}

function addDays(date, days) {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

// Pure save operation: the caller supplies the date and id. Personal edits and
// quick family edits update the same season; only a new term archives it.
export function saveCompassSeason(state, { seasonId, name, compass, date, id, start = date }) {
  const seasons = state.seasons || [];
  const current = seasonId && seasons.find((season) => season.id === seasonId);
  if (current) {
    return {
      ...state,
      seasons: seasons.map((season) => season.id === seasonId
        ? { ...withCompass(season, compass), name: clean(name, 60) || season.name }
        : season),
    };
  }
  const next = withCompass({
    id,
    name: clean(name, 60) || 'This season',
    start,
    until: addDays(start, 7 * 12 - 3),
    end: null,
    family: { word: '', line: '', practices: [] },
    words: {},
  }, compass);
  return {
    ...state,
    seasons: [...seasons.map((season) => season.end ? season : { ...season, end: season.start > addDays(date, -1) ? season.start : addDays(date, -1) }), next],
  };
}

export function demoCompass() {
  return {
    family: { word: 'Rooted', yes: 'Time together, phones away', no: 'Hurrying past each other', theme: 'belong' },
    people: {
      sam: { word: 'Steady', yes: 'Listen before answering', no: 'One more work message', theme: 'steady' },
      jo: { word: 'Present', yes: 'One thing at a time', no: 'Saying yes to everything', theme: 'rest' },
      ada: { word: 'Brave', yes: 'Try the first small step', no: 'Waiting to feel fearless', theme: 'grow' },
      kit: { word: 'Kind', yes: 'Make room in the game', no: 'Having the last word', theme: 'give' },
      noor: { word: 'Joyful', yes: 'Notice something good', no: 'Comparing myself with others', theme: 'welcome' },
      pip: { word: 'Gentle', yes: 'Use gentle hands', no: 'Rushing past a friend', theme: 'steady' },
    },
  };
}
