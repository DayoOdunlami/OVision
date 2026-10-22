// ═══════════════════════════════════════════════════════════════════
// verses.js — the week's verse, word and wondering, one per prayer.
//
// One entry for each of the fourteen prayers in prayers.js, in the same
// order (index i here belongs to prayers[i]). Each carries:
//
//   verse    the verse learned by heart this week, in NIV (Anglicised)
//            wording, the same in the prayer and the puzzle all week.
//            Names never go in here: they belong to the prayer.
//   word     one word lifted from the verse; the sacred word a
//            wandering mind returns to.
//   breath   a breath prayer from the verse: in, then out.
//   wonder   an "I wonder…" question (Godly Play): no right answer.
//
// NIV text: fourteen verses, well inside Biblica's General Use
// Guidelines (no more than 500 verses, never a whole book, under 25%
// of the product). The acknowledgement is NIV_NOTICE, shown in the app.
// ═══════════════════════════════════════════════════════════════════

export const NIV_NOTICE =
  'Scripture quotations taken from the Holy Bible, New International Version® Anglicised, NIV® ' +
  'Copyright © 1979, 1984, 2011 by Biblica, Inc. Used by permission. All rights reserved worldwide.';

export const VERSES = [
  { // 0 · Ephesians 1:17–19
    ref: 'Ephesians 1:18', word: 'See',
    verse: 'I pray that the eyes of your heart may be enlightened in order that you may know the hope to which he has called you.',
    breath: ['Open the eyes of my heart', 'to know your hope'],
    wonder: 'I wonder what you would like to see more clearly?',
  },
  { // 1 · Ephesians 3:16–19
    ref: 'Ephesians 3:17–18', word: 'Rooted',
    verse: 'And I pray that you, being rooted and established in love, may have power, together with all the Lord’s holy people, to grasp how wide and long and high and deep is the love of Christ.',
    breath: ['Root me in your love', 'wide and long and high and deep'],
    wonder: 'I wonder how big God’s love is?',
  },
  { // 2 · Philippians 1:9–11
    ref: 'Philippians 1:9', word: 'Abound',
    verse: 'And this is my prayer: that your love may abound more and more in knowledge and depth of insight.',
    breath: ['Let my love abound', 'more and more'],
    wonder: 'I wonder who needs some of your love today?',
  },
  { // 3 · Colossians 1:9–12
    ref: 'Colossians 1:10', word: 'Fruit',
    verse: 'So that you may live a life worthy of the Lord and please him in every way: bearing fruit in every good work, growing in the knowledge of God.',
    breath: ['Make me fruitful', 'in every good work'],
    wonder: 'I wonder what good thing is waiting for you to do?',
  },
  { // 4 · Romans 15:13
    ref: 'Romans 15:13', word: 'Hope',
    verse: 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.',
    breath: ['God of hope', 'fill me with joy and peace'],
    wonder: 'I wonder what makes you feel full of hope?',
  },
  { // 5 · 1 Thessalonians 3:12–13
    ref: '1 Thessalonians 3:12', word: 'Overflow',
    verse: 'May the Lord make your love increase and overflow for each other and for everyone else, just as ours does for you.',
    breath: ['Lord, make my love', 'overflow'],
    wonder: 'I wonder who is just outside your front door?',
  },
  { // 6 · Hebrews 13:20–21
    ref: 'Hebrews 13:21', word: 'Equip',
    verse: 'Equip you with everything good for doing his will, and may he work in us what is pleasing to him, through Jesus Christ, to whom be glory for ever and ever. Amen.',
    breath: ['Equip me, Lord', 'to do your will'],
    wonder: 'I wonder what God is getting you ready for?',
  },
  { // 7 · Psalm 139:23–24
    ref: 'Psalm 139:23', word: 'Search',
    verse: 'Search me, God, and know my heart; test me and know my anxious thoughts.',
    breath: ['Search me, God', 'and know my heart'],
    wonder: 'I wonder what is really on your heart today?',
  },
  { // 8 · John 17:15–21
    ref: 'John 17:15', word: 'Protect',
    verse: 'My prayer is not that you take them out of the world but that you protect them from the evil one.',
    breath: ['Keep me in the world', 'and keep me from evil'],
    wonder: 'I wonder who needs keeping safe today?',
  },
  { // 9 · John 15:4–5, 8–9
    ref: 'John 15:5', word: 'Remain',
    verse: 'I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing.',
    breath: ['Remain in me', 'as I remain in you'],
    wonder: 'I wonder what it is like to be a branch?',
  },
  { // 10 · Psalm 1:1–3
    ref: 'Psalm 1:3', word: 'Planted',
    verse: 'That person is like a tree planted by streams of water, which yields its fruit in season and whose leaf does not wither – whatever they do prospers.',
    breath: ['Plant me by the streams', 'and I will not wither'],
    wonder: 'I wonder what helps you to grow?',
  },
  { // 11 · Psalm 63:1–5
    ref: 'Psalm 63:1', word: 'Thirst',
    verse: 'You, God, are my God, earnestly I seek you; I thirst for you, my whole being longs for you, in a dry and parched land where there is no water.',
    breath: ['You are my God', 'I thirst for you'],
    wonder: 'I wonder what you are thirsty for?',
  },
  { // 12 · Psalm 121
    ref: 'Psalm 121:1–2', word: 'Help',
    verse: 'I lift up my eyes to the mountains – where does my help come from? My help comes from the Lord, the Maker of heaven and earth.',
    breath: ['My help comes', 'from the Lord'],
    wonder: 'I wonder where you need God’s help?',
  },
  { // 13 · Luke 2:52
    ref: 'Luke 2:52', word: 'Grow',
    verse: 'And Jesus grew in wisdom and stature, and in favour with God and man.',
    breath: ['Help me grow', 'in wisdom and in favour'],
    wonder: 'I wonder how you are growing?',
  },
];

// Sunday's prayer is the Lord's Prayer; its verse is still the week's,
// said together from memory to close the week.
