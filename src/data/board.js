// ═══════════════════════════════════════════════════════════════════
// BOARD DATA — source of truth for every identity-board variant.
//
// Each family member has their own board object with the same shape
// (identity / season / commitments / friction). There is also a
// `family` combined board that speaks in the plural — shared values,
// shared hero words — for when the pond should reflect the whole
// household instead of one person.
//
// Member boards default to a placeholder template (owner/period plus
// a gentle "Draft in progress" note under each zone) so a brand-new
// member renders without gaps. Swap those placeholders out when the
// real content lands — from local edits here, or from Notion via
// loadBoard('notion', memberId).
//
// `loadBoard(source, memberId)` is the only thing views call. Keeping
// the signature identical means switching the source from 'local' to
// 'notion' later touches nothing downstream.
// ═══════════════════════════════════════════════════════════════════

// The fully-fleshed-out board — real content, used for "dayo".
const DAYO = {
  id: 'dayo',
  name: 'Dayo',
  role: 'Self',
  owner: 'Dayo',
  period: 'Spring 2026',

  identity: {
    statement:
      'I exist to help the people and things around me flourish — and to flourish myself — to the glory of God.',
    heroWord: 'Flourish',
    values: ['Creativity', 'Joy', 'Faithfulness'],
    anchor: {
      text: 'Apart from me you can do nothing.',
      reference: 'John 15:5',
    },
  },

  season: {
    heroWord: 'Full',
    sentence:
      'Filling up before I pour out — more of God, stronger body, making what I make properly seen.',
    threads: [
      { label: 'Spirit', note: 'More of God' },
      { label: 'Body', note: 'Stronger, trained' },
      { label: 'Craft', note: 'Properly seen' },
    ],
  },

  commitments: [
    { verb: 'Pray',  text: 'Ephesians 1:18 over Claire and the kids each morning.',   cadence: 'Daily',  tag: 'Prayer' },
    { verb: 'Train', text: 'HYROX programming — twice protected, three the target.', cadence: 'Weekly', tag: 'Body'   },
    { verb: 'Show',  text: 'Thirty minutes showing, not just building.',              cadence: 'Weekly', tag: 'Craft'  },
    { verb: 'Cook',  text: 'One family meal. Phone down. Fully present.',             cadence: 'Weekly', tag: 'Home'   },
  ],

  friction: {
    sentence: 'I know the words. I want them in my marrow.',
    heroWord: 'marrow',
    plans: [
      { trigger: 'After gratitude and Bible reading',            action: 'Five minutes of silence. No phone. Just sit.' },
      { trigger: 'When I notice I am in head-mode on a passage', action: 'Stop. Pray it instead of processing it.'       },
    ],
    prayer: {
      text: 'that Christ may dwell in your hearts through faith… to know this love that surpasses knowledge.',
      reference: 'Ephesians 3:17–19',
    },
    walking:
      'Weekly check-in with Claire. Gap to fill: a man at Grace London who is allowed to ask the hard questions.',
  },
};

// Reusable placeholder so a member with no real content yet still
// renders something coherent. Individual members below override any
// fields they want. `draft: true` is a flag the views can read if
// they want to de-emphasise the content (greyed, watermark, etc.);
// we don't require them to.
function draftBoard({ id, name, role, heroWord = 'Becoming' }) {
  return {
    id,
    name,
    role,
    owner: name,
    period: 'Spring 2026',
    draft: true,

    identity: {
      statement: `${name}'s identity board is still being drafted.`,
      heroWord,
      values: ['Presence', 'Love', 'Growth'],
      anchor: {
        text: 'Draft in progress.',
        reference: '',
      },
    },

    season: {
      heroWord: 'Open',
      sentence: `A season ${name} is still putting words to.`,
      threads: [
        { label: 'Spirit', note: 'To be decided' },
        { label: 'Body',   note: 'To be decided' },
        { label: 'Heart',  note: 'To be decided' },
      ],
    },

    commitments: [
      { verb: 'Pray',  text: `${name}'s daily rhythm.`,     cadence: 'Daily',  tag: 'Prayer' },
      { verb: 'Move',  text: `${name}'s weekly practice.`,  cadence: 'Weekly', tag: 'Body'   },
      { verb: 'Make',  text: `${name}'s creative cadence.`, cadence: 'Weekly', tag: 'Craft'  },
      { verb: 'Rest',  text: `${name}'s sabbath anchor.`,   cadence: 'Weekly', tag: 'Home'   },
    ],

    friction: {
      sentence: `What ${name} is wrestling with this season.`,
      heroWord: 'marrow',
      plans: [],
      prayer: {
        text: 'A prayer for this season.',
        reference: '',
      },
      walking: 'Shared walking — to be drafted.',
    },
  };
}

// Template members — content is a placeholder until the real board
// lands. Keep them deliberately sparse so "draft" reads at a glance.
const CLAIRE = draftBoard({
  id: 'claire',
  name: 'Claire',
  role: 'Partner',
  heroWord: 'Home',
});

const KIDS = draftBoard({
  id: 'kids',
  name: 'The Kids',
  role: 'Children',
  heroWord: 'Play',
});

// Combined household board — speaks in the plural. Same shape; the
// content reflects the whole family rather than any one person.
const FAMILY = {
  id: 'family',
  name: 'Family',
  role: 'Household',
  owner: 'Odunlami Household',
  period: 'Spring 2026',

  identity: {
    statement:
      'We exist together to flourish — to love God, love each other, and open our home to others.',
    heroWord: 'Together',
    values: ['Presence', 'Love', 'Hospitality'],
    anchor: {
      text: 'As for me and my house, we will serve the Lord.',
      reference: 'Joshua 24:15',
    },
  },

  season: {
    heroWord: 'Home',
    sentence:
      'A season of rootedness — steady rhythms, table time, less noise.',
    threads: [
      { label: 'Rhythm', note: 'Shared meals' },
      { label: 'Rest',   note: 'Unhurried weekends' },
      { label: 'Reach',  note: 'Open door' },
    ],
  },

  commitments: [
    { verb: 'Eat',   text: 'One family meal a day. Phones away.',          cadence: 'Daily',  tag: 'Home'   },
    { verb: 'Pray',  text: 'Bless each child by name before bed.',         cadence: 'Daily',  tag: 'Prayer' },
    { verb: 'Walk',  text: 'A slow Saturday walk, all of us, rain or no.', cadence: 'Weekly', tag: 'Body'   },
    { verb: 'Host',  text: 'One person at our table every fortnight.',     cadence: 'Monthly', tag: 'Home'  },
  ],

  friction: {
    sentence: 'We know the rhythm. We want it in our bones.',
    heroWord: 'rhythm',
    plans: [
      { trigger: 'When a week starts feeling scattered', action: 'Reset Sunday night. Pick one anchor meal and one anchor walk.' },
    ],
    prayer: {
      text: 'May our home be a place where your peace is tasted.',
      reference: '',
    },
    walking: 'We are better together than separately. We do this on purpose.',
  },
};

// Registry — everything keyed by id. Order here is the order shown
// in the member picker UI.
export const MEMBERS = [DAYO, CLAIRE, KIDS, FAMILY];
export const MEMBERS_BY_ID = Object.fromEntries(MEMBERS.map((m) => [m.id, m]));

// Compact list views can use this without pulling the entire board
// per member (saves a lot of JSX props).
export const MEMBER_INDEX = MEMBERS.map((m) => ({
  id: m.id,
  name: m.name,
  role: m.role,
  draft: Boolean(m.draft),
  heroWord: m.identity.heroWord,
}));

// Default member when nothing is persisted.
export const DEFAULT_MEMBER_ID = 'dayo';

// Back-compat — views that haven't migrated to multi-member still
// import `BOARD` directly.
export const BOARD = DAYO;

// ═══════════════════════════════════════════════════════════════════
// loadBoard — async adapter. Pick a member by id; source governs
// whether we read from the local objects above or from Notion.
// ═══════════════════════════════════════════════════════════════════
export async function loadBoard(source = 'local', memberId = DEFAULT_MEMBER_ID) {
  const id = MEMBERS_BY_ID[memberId] ? memberId : DEFAULT_MEMBER_ID;
  if (source === 'notion') return loadFromNotion(id);
  return MEMBERS_BY_ID[id];
}

// Stubbed Notion adapter. When wired up, this fetches a per-member
// Notion page or a multi-member database and maps properties into
// the BOARD shape above. Keeping the shape identical is the whole
// point — view code never knows where the content came from.
async function loadFromNotion(memberId) {
  // Intentionally unimplemented. Likely shape when wired:
  //   fetch(`/api/notion?member=${memberId}`) → BOARD-shaped JSON.
  // Each member can be a page in one "Identity Board" database, with
  // properties: heroWord, statement, values (multi-select),
  // anchorText, anchorRef, sentence, threads (relation), etc.
  console.warn(
    `[board] notion source not wired yet — falling back to local for "${memberId}"`,
  );
  return MEMBERS_BY_ID[memberId] || MEMBERS_BY_ID[DEFAULT_MEMBER_ID];
}
