// ═══════════════════════════════════════════════════════════════════
// BOARD DATA — single source of truth for the identity board.
// All identity-board views (Atmos / Textured / Pond / Document) read
// from this object. The Family Board (KoiBoard) has its own default
// model inside KoiBoard.jsx and is not affected here.
//
// `loadBoard()` is an async interface so we can later swap the source
// from 'local' to 'notion' without touching any view code.
// ═══════════════════════════════════════════════════════════════════

export const BOARD = {
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

// ═══════════════════════════════════════════════════════════════════
// loadBoard — async adapter. Today returns the local BOARD.
// Tomorrow: loadFromNotion() swaps in the same shape, no view changes.
// ═══════════════════════════════════════════════════════════════════

export async function loadBoard(source = 'local') {
  if (source === 'notion') return loadFromNotion();
  return BOARD;
}

// Stubbed Notion adapter. When wired up this fetches a Notion page/
// database and maps properties into the BOARD shape above. Keeping
// the shape identical is the whole point — view code never knows.
async function loadFromNotion() {
  // Intentionally unimplemented. Swap this with a fetch('/api/notion')
  // or direct @notionhq/client call when ready.
  console.warn('[board] notion source not yet implemented — falling back to local');
  return BOARD;
}
