// Weekly verses for learning by heart.
// NIV wording, kept inside Biblica's general-use guidelines:
// a handful of verses, never a whole book, and a small part of the product.
// The prayer around each verse is original, and lives in the UI, not here.

export const NIV_NOTICE =
  'Scripture quotations marked NIV are from the Holy Bible, New International Version®, NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide.';

export const VERSES = [
  {
    id: 'john-15-5',
    ref: 'John 15:5',
    clauses: [
      'I am the vine; you are the branches.',
      'If you remain in me and I in you, you will bear much fruit;',
      'apart from me you can do nothing.',
    ],
  },
  {
    id: 'matthew-11-28',
    ref: 'Matthew 11:28–29',
    clauses: [
      'Come to me, all you who are weary and burdened, and I will give you rest.',
      'Take my yoke upon you and learn from me, for I am gentle and humble in heart,',
      'and you will find rest for your souls.',
    ],
  },
  {
    id: 'psalm-23-1',
    ref: 'Psalm 23:1–3',
    clauses: [
      'The Lord is my shepherd, I lack nothing.',
      'He makes me lie down in green pastures, he leads me beside quiet waters,',
      'he refreshes my soul.',
      'He guides me along the right paths for his name’s sake.',
    ],
  },
  {
    id: 'micah-6-8',
    ref: 'Micah 6:8',
    clauses: [
      'He has shown you, O mortal, what is good.',
      'And what does the Lord require of you?',
      'To act justly and to love mercy and to walk humbly with your God.',
    ],
  },
  {
    id: 'romans-15-13',
    ref: 'Romans 15:13',
    clauses: [
      'May the God of hope fill you with all joy and peace as you trust in him,',
      'so that you may overflow with hope by the power of the Holy Spirit.',
    ],
  },
  {
    id: 'joshua-1-9',
    ref: 'Joshua 1:9',
    clauses: [
      'Have I not commanded you? Be strong and courageous.',
      'Do not be afraid; do not be discouraged,',
      'for the Lord your God will be with you wherever you go.',
    ],
  },
  {
    id: 'isaiah-41-10',
    ref: 'Isaiah 41:10',
    clauses: [
      'So do not fear, for I am with you;',
      'do not be dismayed, for I am your God.',
      'I will strengthen you and help you; I will uphold you with my righteous right hand.',
    ],
  },
  {
    id: 'psalm-121-1',
    ref: 'Psalm 121:1–2',
    clauses: [
      'I lift up my eyes to the mountains—where does my help come from?',
      'My help comes from the Lord, the Maker of heaven and earth.',
    ],
  },
  {
    id: 'psalm-119-105',
    ref: 'Psalm 119:105',
    clauses: [
      'Your word is a lamp for my feet, a light on my path.',
    ],
  },
  {
    id: 'deut-6-5',
    ref: 'Deuteronomy 6:5',
    clauses: [
      'Love the Lord your God with all your heart and with all your soul and with all your strength.',
    ],
  },
];

export function verseText(verse) {
  return verse.clauses.join(' ');
}

export function verseById(id) {
  return VERSES.find((v) => v.id === id) || null;
}

export function countVerses() {
  return VERSES.reduce((n, v) => n + (v.ref.match(/–/) ? spanCount(v.ref) : 1), 0);
}

function spanCount(ref) {
  const m = ref.match(/(\d+)–(\d+)\s*$/);
  if (!m) return 1;
  return Number(m[2]) - Number(m[1]) + 1;
}
